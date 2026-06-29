// Formula Engine — computes the calculated v9 PCF fields from one
// supplier_questionnaire_response.
//
// Inputs : a response_id (already saved supplier answers).
// Outputs: a `ComputedFields` object + audit rows in `pcf_computed_field`.
//
// Every "Calculation" row in Final_Catena-x_Reporting_Structure CSV lives here.
// "As per Supplier Input" / "Default" / "System Generated" fields are NOT here —
// those land directly in the payload assembler (Phase D).
//
// For each emission factor lookup we call findBestEf() (Layer 1 + Layer 3).
// Missing or low-confidence EFs return 0 + a "manual" audit row, so the PCF
// still computes — the audit table tells reviewers what needs follow-up.
//
// Sign conventions follow Catena-X:
//   - emissions are positive (>= 0)
//   - uptake / removals are negative (<= 0)
//
// Skip rules (per team confirmation):
//   - Q15 packagingEmissionsIncluded = false → all packagingStage fields = 0
//   - Q18 distributionStageIncluded   = false → all distributionStage fields = 0
//   - Q20 not filled                  → LUC, land management, biogenic uptake portions = 0
//   - Q13 row with already_in_q10 = true → skipped in fossil GHG sum

import { ulid } from "ulid";
import { withClient } from "../util/database.js";
import {
    ActivityType,
    EfMatchInput,
    EfMatchResult,
    findBestEf,
} from "./efMatchingEngine.js";

// ============================================================
// Types
// ============================================================

export interface ComputedFields {
    carbonContent: {
        biogenicCarbonContent: number;
        fossilCarbonContent: number;
        recycledCarbonContent: number;
        carbonContentTotal: number;
        packagingBiogenicCarbonContent: number;
    };
    productionStage: StageEmissions;
    packagingStage: StageEmissions & { packagingEmissionsIncluded: boolean };
    distributionStage: StageEmissions & { distributionStageIncluded: boolean };
    verificationShares: {
        programCertificationShare: number;
        productVerificationShare1stParty: number;
        productVerificationShare2ndParty: number;
        productVerificationShare3rdParty: number;
    };
}

export interface StageEmissions {
    fossilGhgEmissions: number;
    biogenicNonCO2Emissions: number;
    biogenicCO2Uptake: number;
    landUseChangeGhgEmissions: number;
    landManagementBiogenicCO2Emissions: number;
    landManagementBiogenicCO2Removals: number;
    aircraftGhgEmissions: number;
    pcfExcludingBiogenicUptake: number;
    pcfIncludingBiogenicUptake: number;
}

interface SupplierData {
    main: any;
    q4_sites: any[];
    q8_bom: any[];
    q9a_coproducts: any[];
    q10_electricity: any[];
    q11_fuels: any[];
    q12_process_gases: any[];
    q13_qc_it_energy: any[];
    q14_production_waste: any[];
    q16_packaging_materials: any[];
    q16a_packaging_transport: any[];
    q17_packaging_waste: any[];
    q19_transport_legs: any[];
    q20_biomass_feedstock: any[];
}

// ============================================================
// Constants
// ============================================================

// Molar mass ratio CO2 / C (44 / 12). Used to convert biogenic carbon
// (kg C) into biogenic CO2 uptake (kg CO2e). Catena-X PCF Rulebook §5.2.6.
const CO2_PER_C = 44 / 12;

// Verbose calculation trace — set PCF_DEBUG=1 to print every EF match,
// contribution and running total to the terminal (for local testing).
const DEBUG = process.env.PCF_DEBUG === "1" || process.env.PCF_DEBUG === "true";
function dbg(...args: any[]): void {
    if (DEBUG) console.log(...args);
}

// AR6 100-year GWP factors for direct process gases (IPCC AR6 / Catena-X).
// Process emissions = Σ(gas quantity × GWP) — NOT a BAFU EF lookup. Values
// match the manager's reference sheet: CO2=1, CH4=27.9, N2O=273.
const GWP_AR6: Record<string, number> = {
    co2: 1,
    carbondioxide: 1,
    ch4: 27.9,
    methane: 27.9,
    n2o: 273,
    nitrousoxide: 273,
    sf6: 25200,
    sulfurhexafluoride: 25200,
    nf3: 17400,
};
function gwpForGas(gas?: string | null): number {
    // The questionnaire uses subscripts ("CO₂", "CH₄", "N₂O", "SF₆", "NF₃").
    // Convert subscript digits → ASCII before normalizing, else "CO₂" would
    // strip to "co" and miss the map.
    const subs: Record<string, string> = {
        "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
        "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
    };
    const ascii = (gas ?? "").replace(/[₀-₉]/g, (c) => subs[c] ?? c);
    const key = ascii.toLowerCase().replace(/[^a-z0-9]/g, "");
    return GWP_AR6[key] ?? 0;
}
function isBiogenicOrigin(v?: string | null): boolean {
    return `${v ?? ""}`.toLowerCase().startsWith("bio");
}

// Transport/aircraft emission factors are per TONNE-km (t·km). The supplier
// enters weight with a unit (usually kg), so convert to tonnes before
// multiplying by distance × EF — otherwise a kg weight is 1000× too large.
function weightToTonnes(weight: number, unit?: string | null): number {
    const u = (unit ?? "kg").toLowerCase().trim();
    if (u === "t" || u === "ton" || u === "tonne" || u === "tonnes" || u === "mt") return weight;
    if (u === "g" || u === "gram" || u === "grams") return weight / 1e6;
    return weight / 1000; // default: kg → tonnes
}

const ZERO_STAGE: StageEmissions = {
    fossilGhgEmissions: 0,
    biogenicNonCO2Emissions: 0,
    biogenicCO2Uptake: 0,
    landUseChangeGhgEmissions: 0,
    landManagementBiogenicCO2Emissions: 0,
    landManagementBiogenicCO2Removals: 0,
    aircraftGhgEmissions: 0,
    pcfExcludingBiogenicUptake: 0,
    pcfIncludingBiogenicUptake: 0,
};

// ============================================================
// Public entry point
// ============================================================

export async function computePcfFields(responseId: string): Promise<ComputedFields> {
    const data = await loadSupplierData(responseId);
    if (!data.main) {
        throw new Error(`Supplier questionnaire response not found: ${responseId}`);
    }

    // Co-product allocation factor — applies to all "shared" emissions
    // (production, packaging). Default 1 = no allocation (all stays with this product).
    const allocationFactor = computeAllocationFactor(data);

    // Carbon content from Q8.
    const carbonContent = computeCarbonContent(data);

    // Production stage (always computed).
    const productionStage = await computeProductionStage(data, responseId, allocationFactor);

    // Packaging stage — gated by Q15.
    const packagingIncluded = !!data.main.packaging_emissions_included;
    const packagingStage: StageEmissions & { packagingEmissionsIncluded: boolean } = packagingIncluded
        ? {
              packagingEmissionsIncluded: true,
              ...(await computePackagingStage(data, responseId, allocationFactor)),
          }
        : { packagingEmissionsIncluded: false, ...ZERO_STAGE };

    // Distribution stage — gated by Q18.
    const distributionIncluded = !!data.main.distribution_stage_included;
    const distributionStage: StageEmissions & { distributionStageIncluded: boolean } = distributionIncluded
        ? {
              distributionStageIncluded: true,
              ...(await computeDistributionStage(data, responseId)),
          }
        : { distributionStageIncluded: false, ...ZERO_STAGE };

    // Verification & certification shares from Q27.
    const verificationShares = computeVerificationShares(data);

    const computed: ComputedFields = {
        carbonContent,
        productionStage,
        packagingStage,
        distributionStage,
        verificationShares,
    };

    dbg(`\n══════════ FINAL PCF (declared unit) ══════════`);
    dbg(`  production  excl=${productionStage.pcfExcludingBiogenicUptake}  incl=${productionStage.pcfIncludingBiogenicUptake}`);
    dbg(`  packaging   excl=${packagingStage.pcfExcludingBiogenicUptake}  incl=${packagingStage.pcfIncludingBiogenicUptake}  (included=${packagingStage.packagingEmissionsIncluded})`);
    dbg(`  distribution excl=${distributionStage.pcfExcludingBiogenicUptake}  incl=${distributionStage.pcfIncludingBiogenicUptake}  (included=${distributionStage.distributionStageIncluded})`);
    const grandExcl = round6(
        productionStage.pcfExcludingBiogenicUptake +
        packagingStage.pcfExcludingBiogenicUptake +
        distributionStage.pcfExcludingBiogenicUptake
    );
    const grandIncl = round6(
        productionStage.pcfIncludingBiogenicUptake +
        packagingStage.pcfIncludingBiogenicUptake +
        distributionStage.pcfIncludingBiogenicUptake
    );
    dbg(`  ─────────────────────────────────────────────`);
    dbg(`  TOTAL PCF  excl biogenic uptake = ${grandExcl} kgCO2e`);
    dbg(`  TOTAL PCF  incl biogenic uptake = ${grandIncl} kgCO2e`);
    dbg(`══════════════════════════════════════════════\n`);

    await persistComputedFields(responseId, computed);
    return computed;
}

// ============================================================
// Data loading
// ============================================================

async function loadSupplierData(responseId: string): Promise<SupplierData> {
    return withClient(async (client: any) => {
        const main = (
            await client.query(
                `SELECT * FROM supplier_questionnaire_response WHERE id = $1`,
                [responseId]
            )
        ).rows[0];

        const loadChild = async (table: string): Promise<any[]> =>
            (
                await client.query(
                    `SELECT * FROM ${table} WHERE response_id = $1 ORDER BY row_order`,
                    [responseId]
                )
            ).rows;

        return {
            main,
            q4_sites: await loadChild("sq_q4_sites"),
            q8_bom: await loadChild("sq_q8_bom"),
            q9a_coproducts: await loadChild("sq_q9a_coproducts"),
            q10_electricity: await loadChild("sq_q10_electricity"),
            q11_fuels: await loadChild("sq_q11_fuels"),
            q12_process_gases: await loadChild("sq_q12_process_gases"),
            q13_qc_it_energy: await loadChild("sq_q13_qc_it_energy"),
            q14_production_waste: await loadChild("sq_q14_production_waste"),
            q16_packaging_materials: await loadChild("sq_q16_packaging_materials"),
            q16a_packaging_transport: await loadChild("sq_q16a_packaging_transport"),
            q17_packaging_waste: await loadChild("sq_q17_packaging_waste"),
            q19_transport_legs: await loadChild("sq_q19_transport_legs"),
            q20_biomass_feedstock: await loadChild("sq_q20_biomass_feedstock"),
        };
    });
}

// ============================================================
// Co-product allocation factor (Q9 / Q9a)
//
// Catena-X PCF Rulebook §5.2.7:
//   - economic_value_ratio = max(co_product_prices) / min(co_product_prices)
//   - ratio >= 5 → economic allocation (by price)
//   - ratio  < 5 → physical allocation (by mass). Default sub-method = mass.
// We return a single multiplier in [0, 1] that ALL shared emissions are
// multiplied by. Default = 1 when no co-products.
// ============================================================

function computeAllocationFactor(data: SupplierData): number {
    if (!data.main.co_products_present) return 1;
    const rows = data.q9a_coproducts ?? [];
    if (rows.length <= 1) return 1;

    const primary = rows.find((r) => r.is_primary_product) ?? rows[0];
    const primaryPrice = num(primary.co_product_price);

    const prices = rows.map((r) => num(r.co_product_price)).filter((p) => p > 0);
    if (prices.length < 2 || primaryPrice <= 0) return 1;

    const ratio = Math.max(...prices) / Math.min(...prices);
    const totalPrice = prices.reduce((a, b) => a + b, 0);

    if (ratio >= 5) {
        // Economic allocation: by price share.
        return totalPrice > 0 ? primaryPrice / totalPrice : 1;
    } else {
        // Physical allocation, default = mass.
        // Team hasn't given mass per co-product yet, so we fall back to
        // equal allocation across products as a safe placeholder.
        // When team sends the formula, swap this single line.
        return 1 / rows.length;
    }
}

// ============================================================
// Carbon Content (5 fields)
// ============================================================

function computeCarbonContent(data: SupplierData): ComputedFields["carbonContent"] {
    const productMass = num(data.main.product_mass_per_declared_unit);

    let biogenicCarbonContent = 0;
    let recycledCarbonContent = 0;
    let totalCarbon = 0;

    for (const row of data.q8_bom) {
        const componentMass = productMass * (num(row.mass_pct) / 100);
        const totalCFrac = num(row.carbon_pct) / 100;          // carbon content of the component
        const biogenicCFrac = num(row.biogenic_carbon_pct) / 100; // biogenic share of that carbon
        const recycledCFrac = num(row.recycled_carbon_pct) / 100; // recycled share of that carbon

        // CSV Revised Formula:
        //   biogenic = Σ(Material Mass × carbon% × Biogenic Carbon Fraction)
        // i.e. biogenic/recycled are PORTIONS OF THE CARBON, so each is
        // multiplied by carbon% as well — keeping Total = Fossil+Biogenic+Recycled
        // dimensionally consistent (all are carbon masses).
        const componentCarbon = componentMass * totalCFrac;
        totalCarbon += componentCarbon;
        if (row.biogenic_y_n) biogenicCarbonContent += componentCarbon * biogenicCFrac;
        if (row.recycled_y_n) recycledCarbonContent += componentCarbon * recycledCFrac;
        dbg(`   [carbon] ${row.material}: mass=${componentMass}kg carbon%=${num(row.carbon_pct)} → C=${componentCarbon.toFixed(6)} ` +
            `(bio=${row.biogenic_y_n ? (componentCarbon * biogenicCFrac).toFixed(6) : 0}, rec=${row.recycled_y_n ? (componentCarbon * recycledCFrac).toFixed(6) : 0})`);
    }

    // Per team confirmation: derive fossil so the identity Total = Fossil + Biogenic + Recycled holds.
    const fossilCarbonContent = Math.max(
        0,
        totalCarbon - biogenicCarbonContent - recycledCarbonContent
    );
    dbg(`\n━━━ CARBON CONTENT ━━━  total=${round6(totalCarbon)} fossil=${round6(fossilCarbonContent)} ` +
        `biogenic=${round6(biogenicCarbonContent)} recycled=${round6(recycledCarbonContent)}`);

    // Packaging biogenic carbon: Q16 material weight + Q16a transport weight × biogenic %.
    let packagingBiogenicCarbonContent = 0;
    for (const row of data.q16_packaging_materials) {
        const w = num(row.packaging_weight);
        const bioFrac = num(row.carbon_biogenic_pct) / 100;
        packagingBiogenicCarbonContent += w * bioFrac;
    }

    return {
        biogenicCarbonContent: round6(biogenicCarbonContent),
        fossilCarbonContent: round6(fossilCarbonContent),
        recycledCarbonContent: round6(recycledCarbonContent),
        carbonContentTotal: round6(totalCarbon),
        packagingBiogenicCarbonContent: round6(packagingBiogenicCarbonContent),
    };
}

// ============================================================
// Production Stage (9 fields)
// ============================================================

async function computeProductionStage(
    data: SupplierData,
    responseId: string,
    allocation: number
): Promise<StageEmissions> {
    const productMass = num(data.main.product_mass_per_declared_unit);
    const year = parseInt(data.main.reference_period_start?.toString?.().slice(0, 4) ?? "2025", 10);
    const primarySite = data.q4_sites.find((s) => s.is_primary) ?? data.q4_sites[0] ?? null;
    const country = primarySite?.country ?? null;
    const region = primarySite?.region ?? null;

    dbg(`\n━━━ PRODUCTION STAGE ━━━  productMass=${productMass}kg  geo=${country}/${region}  year=${year}`);

    // --- Q8 materials × EF (fossil)
    let fossil = 0;
    for (const row of data.q8_bom) {
        const componentMass = productMass * (num(row.mass_pct) / 100);
        if (componentMass <= 0) continue;
        const ef_ = await ef(
            {
                activityType: "material",
                material: row.material,
                process: row.process,
                // Exact EF taxonomy from the cascade dropdowns (material column
                // = Category; plus sub_category / group_name / specific_type).
                category: row.material,
                subCategory: row.sub_category,
                group: row.group_name,
                specificType: row.specific_type,
                country, region,
                unit: "kg", unitKind: "mass",
                year,
                sourceQuestion: "q8_bom",
                sourceRowId: row.id,
                responseId,
            }
        );
        const contrib = componentMass * ef_;
        fossil += contrib;
        dbg(`   [Q8] ${row.material}: ${num(row.mass_pct)}% × ${productMass}kg = ${componentMass}kg × ${ef_} = ${contrib.toFixed(6)} kgCO2e (fossil=${fossil.toFixed(6)})`);
    }

    // --- Q10 electricity.
    // Manager's model — mass-based factory allocation. The per-unit share of
    // factory electricity is just the product's mass divided by the total mass
    // the factory produced, times the factory's total energy:
    //   perUnitKwh = product_mass × factory_energy / factory_weight
    //   emission   = perUnitKwh × electricity EF × (1 − renewable share)
    // (This is the algebraic reduction of the old
    //  (component_total_weight / factory_weight) × factory_energy / num_products,
    //  since component_total_weight / num_products = product_mass. So the supplier
    //  only needs to give the two factory totals — both in kWh / kg.)
    // Guards: product_mass and factory_weight must be > 0 (same kg unit on both
    // sides); otherwise fall back to per-row entered quantity.
    const factoryEnergy = num(data.main.factory_total_energy_kwh);
    const factoryWeight = num(data.main.factory_total_weight_kg);
    // productMass (declared above) is the component's per-unit mass from Q3c.
    const useFactoryAllocation = factoryEnergy > 0 && factoryWeight > 0 && productMass > 0;

    if (useFactoryAllocation && data.q10_electricity.length > 0) {
        const perUnitKwh = (productMass * factoryEnergy) / factoryWeight;
        const elecRow = data.q10_electricity[0]; // primary electricity source → EF
        const ef_ = await ef({
            activityType: "energy",
            material: elecRow.electricity_type,
            process: elecRow.generator_type,
            category: elecRow.category, subCategory: elecRow.sub_category, group: elecRow.group_name, specificType: elecRow.specific_type,
            country, region,
            unit: elecRow.unit, unitKind: "energy",
            year,
            sourceQuestion: "q10_electricity",
            sourceRowId: elecRow.id,
            responseId,
        });
        const renewableShare = (num(elecRow.renewable_pct) / 100) || 0;
        const contrib = perUnitKwh * ef_ * (1 - renewableShare);
        fossil += contrib;
        dbg(`   [Q10-alloc] perUnit=${productMass}×${factoryEnergy}/${factoryWeight}=${perUnitKwh.toFixed(6)}kWh × ${ef_} × (1−${renewableShare}) = ${contrib.toFixed(6)}`);
    } else {
        for (const row of data.q10_electricity) {
            const qty = num(row.quantity);
            if (qty <= 0) continue;
            const ef_ = await ef({
                activityType: "energy",
                material: row.electricity_type,
                process: row.generator_type,
                category: row.category, subCategory: row.sub_category, group: row.group_name, specificType: row.specific_type,
                country, region,
                unit: row.unit, unitKind: "energy",
                year,
                sourceQuestion: "q10_electricity",
                sourceRowId: row.id,
                responseId,
            });
            const renewableShare = (num(row.renewable_pct) / 100) || 0;
            const contrib = qty * ef_ * (1 - renewableShare);
            fossil += contrib;
            dbg(`   [Q10] ${row.electricity_type}: ${qty}${row.unit} × ${ef_} × (1−${renewableShare}) = ${contrib.toFixed(6)}`);
        }
    }

    // --- Q11 fuels  (biogenic ones go into biogenicNonCO2 below)
    let biogenicNonCO2 = 0;
    for (const row of data.q11_fuels) {
        const qty = num(row.quantity);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "fuels",
            material: row.fuel_carrier,
            category: row.category, subCategory: row.sub_category, group: row.group_name, specificType: row.specific_type,
            country, region,
            unit: row.unit,
            year,
            sourceQuestion: "q11_fuels",
            sourceRowId: row.id,
            responseId,
        });
        if (row.biogenic_y_n) biogenicNonCO2 += qty * ef_;
        else fossil += qty * ef_;
    }

    // --- Q12 process gases — emission = quantity × GWP (AR6), NOT an EF lookup.
    // CO2/fossil gases → fossil GHG; biogenic-origin CH4/N2O → biogenic non-CO2.
    for (const row of data.q12_process_gases) {
        const qty = num(row.quantity);
        if (qty <= 0) continue;
        const gwp = gwpForGas(row.direct_process_gas);
        const contrib = qty * gwp;
        if (isBiogenicOrigin(row.fossil_or_biogenic)) biogenicNonCO2 += contrib;
        else fossil += contrib;
        dbg(`   [Q12] ${row.direct_process_gas}: ${qty} × GWP ${gwp} = ${contrib.toFixed(6)} ` +
            `(${isBiogenicOrigin(row.fossil_or_biogenic) ? "biogenicNonCO2" : "fossil"})`);
        if (gwp === 0) dbg(`        ⚠️ no GWP for gas "${row.direct_process_gas}" → contributes 0`);
    }

    // --- Q13 QC / IT energy (only rows NOT already counted in Q10)
    for (const row of data.q13_qc_it_energy) {
        if (row.already_in_q10) continue;
        const qty = num(row.value);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "energy",
            material: row.item,
            category: row.category, subCategory: row.sub_category, group: row.group_name, specificType: row.specific_type,
            country, region,
            unit: row.unit, unitKind: "energy",
            year,
            sourceQuestion: "q13_qc_it_energy",
            sourceRowId: row.id,
            responseId,
        });
        fossil += qty * ef_;
    }

    // --- Q14 production / QC waste
    for (const row of data.q14_production_waste) {
        const qty = num(row.quantity);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "waste",
            material: row.waste_type,
            process: row.treatment_type,
            category: row.category, subCategory: row.sub_category, group: row.group_name, specificType: row.specific_type,
            country, region,
            unit: row.unit, unitKind: "mass",
            year,
            sourceQuestion: "q14_production_waste",
            sourceRowId: row.id,
            responseId,
        });
        fossil += qty * ef_;
    }

    // --- Production-stage aircraft = INBOUND raw-material air freight only.
    // The Q19 transport table holds OUTBOUND product legs, which are counted
    // once in the distribution stage — looping them here too double-counted
    // transport. Inbound air freight isn't captured as a separate input yet,
    // so production aircraft = 0 until that field exists.
    let aircraft = 0;

    // --- Q20 land use change + land management (only if Q20 filled)
    let luc = 0;
    let landMgmtEmissions = 0;
    let landMgmtRemovals = 0;
    let biogenicCO2UptakeFromBiomass = 0;

    if (data.main.uses_agricultural_forestry_land) {
        const lucEf = num(data.main.luc_emission_factor); // supplier-provided, may be 0
        const landArea = num(data.main.land_area_hectares);

        for (const row of data.q20_biomass_feedstock) {
            const qty = num(row.quantity);
            luc += qty * lucEf;
            const bioFrac = num(row.biogenic_carbon_content_pct) / 100;
            biogenicCO2UptakeFromBiomass += -(qty * bioFrac * CO2_PER_C);
        }

        // Land management EF defaults to 0 until team confirms a source.
        landMgmtEmissions = landArea * 0;
        landMgmtRemovals = -(landArea * 0);
    }

    // --- Biogenic CO2 uptake (carbon stored in product)
    const biogenicCO2UptakeFromMaterials = -(
        round6(productMass) * 0 // computed via carbon-content layer; placeholder for now
    );
    // We use the carbonContent.biogenicCarbonContent result instead (computed separately).
    // To keep this stage self-contained, we re-derive here.
    let biogenicCarbon = 0;
    for (const row of data.q8_bom) {
        if (!row.biogenic_y_n) continue;
        const componentMass = productMass * (num(row.mass_pct) / 100);
        biogenicCarbon += componentMass * (num(row.biogenic_carbon_pct) / 100);
    }
    const biogenicCO2Uptake = -(biogenicCarbon * CO2_PER_C) + biogenicCO2UptakeFromBiomass + biogenicCO2UptakeFromMaterials;

    // Apply co-product allocation to shared emissions.
    fossil *= allocation;
    biogenicNonCO2 *= allocation;
    aircraft *= allocation;
    luc *= allocation;
    landMgmtEmissions *= allocation;
    landMgmtRemovals *= allocation;

    const pcfExcl = fossil + biogenicNonCO2 + luc + aircraft + landMgmtEmissions + landMgmtRemovals;
    const pcfIncl = pcfExcl + biogenicCO2Uptake;

    dbg(`   ── production totals: fossil=${round6(fossil)} biogenicNonCO2=${round6(biogenicNonCO2)} ` +
        `aircraft=${round6(aircraft)} LUC=${round6(luc)} biogenicUptake=${round6(biogenicCO2Uptake)}`);
    dbg(`   ── production PCF excl=${round6(pcfExcl)}  incl=${round6(pcfIncl)}  (allocation×${allocation})`);

    return {
        fossilGhgEmissions: round6(fossil),
        biogenicNonCO2Emissions: round6(biogenicNonCO2),
        biogenicCO2Uptake: round6(biogenicCO2Uptake),
        landUseChangeGhgEmissions: round6(luc),
        landManagementBiogenicCO2Emissions: round6(landMgmtEmissions),
        landManagementBiogenicCO2Removals: round6(landMgmtRemovals),
        aircraftGhgEmissions: round6(aircraft),
        pcfExcludingBiogenicUptake: round6(pcfExcl),
        pcfIncludingBiogenicUptake: round6(pcfIncl),
    };
}

// ============================================================
// Packaging Stage (9 fields)
// ============================================================

async function computePackagingStage(
    data: SupplierData,
    responseId: string,
    allocation: number
): Promise<StageEmissions> {
    const year = parseInt(data.main.reference_period_start?.toString?.().slice(0, 4) ?? "2025", 10);
    const primarySite = data.q4_sites.find((s) => s.is_primary) ?? data.q4_sites[0] ?? null;
    const country = primarySite?.country ?? null;
    const region = primarySite?.region ?? null;

    dbg(`\n━━━ PACKAGING STAGE ━━━`);
    let fossil = 0;
    let biogenicNonCO2 = 0;
    let aircraft = 0;
    let packagingBiogenicCarbon = 0;

    // --- Q16 packaging materials
    for (const row of data.q16_packaging_materials) {
        const qty = num(row.packaging_weight);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "packaging",
            material: row.packaging_type,
            process: row.process_type,
            category: row.category, subCategory: row.sub_category, group: row.group_name, specificType: row.specific_type,
            country: row.country ?? country, region: row.region ?? region,
            unit: row.unit, unitKind: "mass",
            year,
            sourceQuestion: "q16_packaging_materials",
            sourceRowId: row.id,
            responseId,
        });
        fossil += qty * ef_;
        const bioFrac = num(row.carbon_biogenic_pct) / 100;
        packagingBiogenicCarbon += qty * bioFrac;
    }

    // --- Q16a packaging transport
    for (const row of data.q16a_packaging_transport) {
        const dist = num(row.distance_km);
        const wt = num(row.weight);
        if (dist <= 0 || wt <= 0) continue;
        const ef_ = await ef({
            activityType: "transport",
            material: row.transport_mode,
            process: row.transport_mode,
            category: row.category, subCategory: row.sub_category, group: row.group_name, specificType: row.specific_type,
            country, region,
            unit: "tkm", unitKind: "freight",
            year,
            sourceQuestion: "q16a_packaging_transport",
            sourceRowId: row.id,
            responseId,
        });
        const tonnes = weightToTonnes(wt, row.unit);
        const contribution = dist * tonnes * ef_;
        if (isAircraft(row.transport_mode)) aircraft += contribution;
        else fossil += contribution;
        dbg(`   [Q16a] ${row.transport_mode}: ${dist}km × ${tonnes}t × ${ef_} = ${contribution.toFixed(6)}`);
    }

    // --- Q17 packaging waste
    for (const row of data.q17_packaging_waste) {
        const qty = num(row.quantity);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "waste",
            material: row.packaging_waste_type,
            process: row.treatment_type,
            category: row.category, subCategory: row.sub_category, group: row.group_name, specificType: row.specific_type,
            country, region,
            unit: row.unit, unitKind: "mass",
            year,
            sourceQuestion: "q17_packaging_waste",
            sourceRowId: row.id,
            responseId,
        });
        fossil += qty * ef_;
    }

    const biogenicCO2Uptake = -(packagingBiogenicCarbon * CO2_PER_C);

    fossil *= allocation;
    biogenicNonCO2 *= allocation;
    aircraft *= allocation;

    const pcfExcl = fossil + biogenicNonCO2 + aircraft;
    const pcfIncl = pcfExcl + biogenicCO2Uptake;

    return {
        fossilGhgEmissions: round6(fossil),
        biogenicNonCO2Emissions: round6(biogenicNonCO2),
        biogenicCO2Uptake: round6(biogenicCO2Uptake),
        landUseChangeGhgEmissions: 0,
        landManagementBiogenicCO2Emissions: 0,
        landManagementBiogenicCO2Removals: 0,
        aircraftGhgEmissions: round6(aircraft),
        pcfExcludingBiogenicUptake: round6(pcfExcl),
        pcfIncludingBiogenicUptake: round6(pcfIncl),
    };
}

// ============================================================
// Distribution Stage (9 fields)
// ============================================================

async function computeDistributionStage(
    data: SupplierData,
    responseId: string
): Promise<StageEmissions> {
    const year = parseInt(data.main.reference_period_start?.toString?.().slice(0, 4) ?? "2025", 10);

    dbg(`\n━━━ DISTRIBUTION STAGE ━━━`);
    let fossil = 0;
    let aircraft = 0;

    for (const row of data.q19_transport_legs) {
        const dist = num(row.distance_km);
        const wt = num(row.weight);
        if (dist <= 0 || wt <= 0) continue;
        const ef_ = await ef({
            activityType: "transport",
            material: row.transport_mode,
            process: row.transport_mode,
            category: row.category, subCategory: row.sub_category, group: row.group_name, specificType: row.specific_type,
            unit: "tkm", unitKind: "freight",
            year,
            sourceQuestion: "q19_transport_legs",
            sourceRowId: row.id,
            responseId,
        });
        const tonnes = weightToTonnes(wt, row.unit);
        const contribution = dist * tonnes * ef_;
        if (isAircraft(row.transport_mode)) aircraft += contribution;
        else fossil += contribution;
        dbg(`   [Q19-dist] ${row.transport_mode}: ${dist}km × ${tonnes}t × ${ef_} = ${contribution.toFixed(6)}`);
    }

    const pcfExcl = fossil + aircraft;
    return {
        fossilGhgEmissions: round6(fossil),
        biogenicNonCO2Emissions: 0,
        biogenicCO2Uptake: 0,
        landUseChangeGhgEmissions: 0,
        landManagementBiogenicCO2Emissions: 0,
        landManagementBiogenicCO2Removals: 0,
        aircraftGhgEmissions: round6(aircraft),
        pcfExcludingBiogenicUptake: round6(pcfExcl),
        pcfIncludingBiogenicUptake: round6(pcfExcl),
    };
}

// ============================================================
// Verification & Certification Shares (4 fields)
// ============================================================

function computeVerificationShares(data: SupplierData): ComputedFields["verificationShares"] {
    const totalProd = num(data.main.total_production_volume);
    const totalProduct = num(data.main.total_product_volume) || totalProd;

    const pct = (numerator: number, denom: number) =>
        denom > 0 ? round6((numerator / denom) * 100) : 0;

    return {
        programCertificationShare: pct(num(data.main.certified_volume), totalProd),
        productVerificationShare1stParty: pct(num(data.main.verified_volume_1st_party), totalProduct),
        productVerificationShare2ndParty: pct(num(data.main.verified_volume_2nd_party), totalProduct),
        productVerificationShare3rdParty: pct(num(data.main.verified_volume_3rd_party), totalProduct),
    };
}

// ============================================================
// EF lookup helper — calls findBestEf, returns kgCO2e/unit (0 on miss).
// ============================================================

async function ef(input: EfMatchInput): Promise<number> {
    const result: EfMatchResult = await findBestEf(input);
    const v = result.winningRow ? parseFloat(result.winningRow.kgco2e_per_unit ?? "0") : 0;
    const val = Number.isFinite(v) ? v : 0;
    if (DEBUG) {
        const w = result.winningRow;
        const name = w ? (w.product ?? w.dataset_name ?? w.specific_type ?? "?") : null;
        dbg(
            `   [EF] ${String(input.sourceQuestion).padEnd(20)} ` +
            `"${input.material ?? ""}"${input.process ? ` / "${input.process}"` : ""} ` +
            `(${input.unit ?? "-"}, ${input.country ?? "-"}) → ` +
            (w
                ? `${name} = ${val} kgCO2e/${input.unit ?? "unit"}  [${result.confidence} ${Math.round(result.score)}]`
                : `❌ NO MATCH → 0`)
        );
    }
    return val;
}

// ============================================================
// Persist computed fields
// ============================================================

async function persistComputedFields(responseId: string, computed: ComputedFields): Promise<void> {
    const flat: Array<{ path: string; value: number }> = [];

    const walk = (prefix: string, obj: any) => {
        for (const [k, v] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${k}` : k;
            if (typeof v === "number") flat.push({ path, value: v });
            else if (typeof v === "boolean") flat.push({ path, value: v ? 1 : 0 });
            else if (v && typeof v === "object") walk(path, v);
        }
    };
    walk("", computed);

    await withClient(async (client: any) => {
        // Clear previous computation for this response → keep table clean.
        await client.query(
            `DELETE FROM pcf_computed_field WHERE response_id = $1`,
            [responseId]
        );
        for (const f of flat) {
            await client.query(
                `INSERT INTO pcf_computed_field (id, response_id, field_path, value)
                 VALUES ($1, $2, $3, $4)`,
                [ulid(), responseId, f.path, f.value]
            );
        }
    });
}

// ============================================================
// Utilities
// ============================================================

function num(v: any): number {
    if (v == null) return 0;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
}

function round6(v: number): number {
    return Math.round(v * 1e6) / 1e6;
}

function isAircraft(mode?: string | null): boolean {
    if (!mode) return false;
    const m = mode.toLowerCase();
    return m.includes("air") || m.includes("plane") || m.includes("aircraft") || m.includes("aviation");
}
