// Full PCF orchestrator — runs all 5 emission sections and returns the
// per-section breakdown plus the grand total (kgCO2e per component).
//
//   total = raw_materials + production + packaging + transport + waste
//
// Each section reuses the verified per-section engine. The dominant raw
// material (highest composition %) drives the production-waste EF.

import { calculateRawMaterials, type RawMaterialRow } from "./materialEfService.js";
import { calculateProductionEmission } from "./productionEmissionService.js";
import { matchMaterialEf } from "./materialEfService.js";
import { calculateTransport, type TransportLegInput } from "./transportEmissionService.js";
import { calculateWaste } from "./wasteEmissionService.js";

export interface PcfInput {
    component_weight_kg: number;
    raw_materials: RawMaterialRow[];                       // [{ material, composition_percent }]
    production: {
        factory_weight_kg: number;
        factory_energy_kwh: number;
        electricity_ef?: number;                           // defaults to 0.9 (BAFU electricity)
    };
    packaging: Array<{ packaging_type: string; weight_kg: number }>;
    transport: {
        transported_weight: number;
        weight_unit: string;                               // g | kg | t
        legs: TransportLegInput[];                         // [{ mode, distance_km }]
    };
    waste: {
        production_waste_weight_kg: number;
        packaging_waste_weight_kg: number;
    };
}

// Map the raw supplier-questionnaire data object into the engine input.
// Defensive: tolerates missing sections (treats them as zero/empty).
export function extractPcfInput(data: any): PcfInput {
    const get = (path: string) => path.split(".").reduce((o: any, k) => (o == null ? o : o[k]), data);
    const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

    // Q5 products → component weight (kg, locked from BOM).
    const products = get("product_details.products_manufactured") || [];
    const componentWeight = num(products[0]?.weight_per_unit);

    // Q7 raw materials → material + composition %.
    const rawRows = get("scope_3.materials.raw_materials") || [];
    const raw_materials = rawRows
        .map((r: any) => ({ material: String(r?.material || "").trim(), composition_percent: num(r?.composition_percent ?? r?.percentage) }))
        .filter((r: any) => r.material);

    // Q6 purchased energy (quantity) + 6.1 factory weight.
    const energyRows = get("scope_2.purchased_energy") || [];
    const factoryEnergy = num(energyRows[0]?.quantity);
    const factoryWeight = num(get("scope_2.total_factory_weight_produced_kg"));

    // Q8 packaging → packaging type + weight.
    const packRows = get("scope_3.packaging.materials_used") || [];
    const packaging = packRows
        .map((p: any) => ({ packaging_type: String(p?.packaging_type || "").trim(), weight_kg: num(p?.packagin_weight) }))
        .filter((p: any) => p.packaging_type);

    // Q10 transport → one leg per row (mode = Process/layer2, distance, weight).
    const transRows = get("scope_3.logistics.transport_modes") || [];
    const legs = transRows
        .map((t: any) => ({ mode: String(t?.layer2 || t?.layer1 || "").trim(), distance_km: num(t?.distance) }))
        .filter((l: any) => l.mode && l.distance_km > 0);
    // Transported weight: the supplier-entered Q10 weight (kg), else the component weight.
    const transportedWeight = num(transRows[0]?.weight) || componentWeight;

    // Waste: production = 10% of component weight, packaging = 10% of packaging weight.
    const packagingWeightTotal = packaging.reduce((s: number, p: any) => s + p.weight_kg, 0);

    return {
        component_weight_kg: componentWeight,
        raw_materials,
        production: { factory_weight_kg: factoryWeight, factory_energy_kwh: factoryEnergy, electricity_ef: 0.9 },
        packaging,
        transport: { transported_weight: transportedWeight, weight_unit: "kg", legs },
        waste: {
            production_waste_weight_kg: Number((componentWeight * 0.1).toFixed(6)),
            packaging_waste_weight_kg: Number((packagingWeightTotal * 0.1).toFixed(6)),
        },
    };
}

// Pick the raw material with the highest composition % — used for production waste.
function dominantMaterial(rows: RawMaterialRow[]): string {
    let best = "";
    let bestPct = -1;
    for (const r of rows || []) {
        const pct = Number(r.composition_percent) || 0;
        if (pct > bestPct) { bestPct = pct; best = r.material; }
    }
    return best;
}

export async function calculatePcf(input: PcfInput) {
    // 1. Raw materials.
    const raw = await calculateRawMaterials(input.component_weight_kg, input.raw_materials || []);

    // 2. Production / electricity.
    const ef = input.production.electricity_ef != null ? input.production.electricity_ef : 0.9;
    const production = calculateProductionEmission(
        input.component_weight_kg,
        input.production.factory_weight_kg,
        input.production.factory_energy_kwh,
        ef,
    );

    // 3. Packaging — Σ(weight × EF) across packaging rows.
    const packagingRows = [];
    let packagingTotal = 0;
    for (const p of input.packaging || []) {
        const m = await matchMaterialEf(p.packaging_type);
        const emission = m.matched && m.ef != null ? Number((Number(p.weight_kg) * m.ef).toFixed(6)) : 0;
        packagingTotal += emission;
        packagingRows.push({
            packaging_type: p.packaging_type, weight_kg: Number(p.weight_kg),
            matched: m.matched, ef: m.ef, ef_id: m.ef_id, ef_product: m.product, emission,
        });
    }
    packagingTotal = Number(packagingTotal.toFixed(6));

    // 4. Transport.
    const transport = await calculateTransport(
        input.transport.transported_weight,
        input.transport.weight_unit,
        input.transport.legs || [],
    );

    // 5. Waste — production waste uses the dominant material; packaging waste
    //    uses the first packaging type.
    const dom = dominantMaterial(input.raw_materials || []);
    const packType = input.packaging?.[0]?.packaging_type || "";
    const waste = await calculateWaste(
        dom,
        input.waste.production_waste_weight_kg,
        packType,
        input.waste.packaging_waste_weight_kg,
    );

    const total = Number((
        raw.total_pcf + production.production_emission + packagingTotal +
        transport.total_emission + waste.total_emission
    ).toFixed(6));

    return {
        sections: {
            raw_materials: { total: raw.total_pcf, rows: raw.rows },
            production: { total: production.production_emission, detail: production },
            packaging: { total: packagingTotal, rows: packagingRows },
            transport: { total: transport.total_emission, legs: transport.legs },
            waste: { total: waste.total_emission, detail: waste },
        },
        pcf_total: total,
    };
}
