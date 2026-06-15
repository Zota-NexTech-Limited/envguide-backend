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
        const totalCFrac = num(row.carbon_pct) / 100;
        const biogenicCFrac = num(row.biogenic_carbon_pct) / 100;
        const recycledCFrac = num(row.recycled_carbon_pct) / 100;

        totalCarbon += componentMass * totalCFrac;
        if (row.biogenic_y_n) biogenicCarbonContent += componentMass * biogenicCFrac;
        if (row.recycled_y_n) recycledCarbonContent += componentMass * recycledCFrac;
    }

    // Per team confirmation: derive fossil so the identity Total = Fossil + Biogenic + Recycled holds.
    const fossilCarbonContent = Math.max(
        0,
        totalCarbon - biogenicCarbonContent - recycledCarbonContent
    );

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
                country, region,
                unit: "kg", unitKind: "mass",
                year,
                sourceQuestion: "q8_bom",
                sourceRowId: row.id,
                responseId,
            }
        );
        fossil += componentMass * ef_;
    }

    // --- Q10 electricity
    for (const row of data.q10_electricity) {
        const qty = num(row.quantity);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "energy",
            material: row.electricity_type,
            process: row.generator_type,
            country, region,
            unit: row.unit, unitKind: "energy",
            year,
            sourceQuestion: "q10_electricity",
            sourceRowId: row.id,
            responseId,
        });
        const renewableShare = (num(row.renewable_pct) / 100) || 0;
        fossil += qty * ef_ * (1 - renewableShare);
    }

    // --- Q11 fuels  (biogenic ones go into biogenicNonCO2 below)
    let biogenicNonCO2 = 0;
    for (const row of data.q11_fuels) {
        const qty = num(row.quantity);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "fuels",
            material: row.fuel_carrier,
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

    // --- Q12 process gases (split by fossil/biogenic origin)
    for (const row of data.q12_process_gases) {
        const qty = num(row.quantity);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "process_gas",
            material: row.direct_process_gas,
            country, region,
            unit: row.unit,
            year,
            sourceQuestion: "q12_process_gases",
            sourceRowId: row.id,
            responseId,
        });
        if (`${row.fossil_or_biogenic ?? ""}`.toLowerCase().startsWith("bio")) {
            biogenicNonCO2 += qty * ef_;
        } else {
            fossil += qty * ef_;
        }
    }

    // --- Q13 QC / IT energy (only rows NOT already counted in Q10)
    for (const row of data.q13_qc_it_energy) {
        if (row.already_in_q10) continue;
        const qty = num(row.value);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "energy",
            material: row.item,
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
            country, region,
            unit: row.unit, unitKind: "mass",
            year,
            sourceQuestion: "q14_production_waste",
            sourceRowId: row.id,
            responseId,
        });
        fossil += qty * ef_;
    }

    // --- Q19 aircraft (only legs with mode = aircraft contribute to production-stage aviation upstream)
    let aircraft = 0;
    for (const row of data.q19_transport_legs) {
        if (!isAircraft(row.transport_mode)) continue;
        const dist = num(row.distance_km);
        const wt = num(row.weight);
        if (dist <= 0 || wt <= 0) continue;
        const ef_ = await ef({
            activityType: "transport",
            material: "Aircraft",
            process: row.transport_mode,
            country, region,
            unit: "tkm", unitKind: "freight",
            year,
            sourceQuestion: "q19_transport_legs",
            sourceRowId: row.id,
            responseId,
        });
        aircraft += dist * wt * ef_;
    }

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
            country, region,
            unit: "tkm", unitKind: "freight",
            year,
            sourceQuestion: "q16a_packaging_transport",
            sourceRowId: row.id,
            responseId,
        });
        const contribution = dist * wt * ef_;
        if (isAircraft(row.transport_mode)) aircraft += contribution;
        else fossil += contribution;
    }

    // --- Q17 packaging waste
    for (const row of data.q17_packaging_waste) {
        const qty = num(row.quantity);
        if (qty <= 0) continue;
        const ef_ = await ef({
            activityType: "waste",
            material: row.packaging_waste_type,
            process: row.treatment_type,
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
            unit: "tkm", unitKind: "freight",
            year,
            sourceQuestion: "q19_transport_legs",
            sourceRowId: row.id,
            responseId,
        });
        const contribution = dist * wt * ef_;
        if (isAircraft(row.transport_mode)) aircraft += contribution;
        else fossil += contribution;
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
    if (!result.winningRow) return 0;
    const v = parseFloat(result.winningRow.kgco2e_per_unit ?? "0");
    return Number.isFinite(v) ? v : 0;
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
