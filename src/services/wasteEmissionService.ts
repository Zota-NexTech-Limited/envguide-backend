// Waste emission calculator (Q9).
//
//   production_waste = production_waste_weight × scrap_EF(dominant material)
//   packaging_waste  = packaging_waste_weight  × waste_EF(packaging type)
//   waste_total      = production_waste + packaging_waste
//
// The dominant material is the raw material with the highest composition % (Q7);
// its scrap row is looked up via the `waste:<material>` mapping key. The
// packaging waste uses the packaging type's `waste:<type>` mapping.
//
// Worked example (manager's sheet):
//   0.03 × 0.02223 (Aluminium scrap) = 0.000667
//   0.003 × 0.09097 (Waste paper)    = 0.00027   → total 0.000937

import { matchMaterialEf, type MaterialEfMatch } from "./materialEfService.js";

export interface WasteResult {
    label: string;
    input: string;            // the material / packaging type used for the EF
    weight_kg: number;
    matched: boolean;
    ef?: number;
    ef_id?: string;
    ef_product?: string;
    emission: number;
}

export interface WasteCalc {
    production_waste: WasteResult;
    packaging_waste: WasteResult;
    total_emission: number;
}

async function wasteLeg(label: string, key: string, weightKg: number): Promise<WasteResult> {
    const ef: MaterialEfMatch = key ? await matchMaterialEf(`waste:${key}`) : { matched: false };
    const w = Number(weightKg) || 0;
    const emission = ef.matched && ef.ef != null ? Number((w * ef.ef).toFixed(8)) : 0;
    return {
        label,
        input: key,
        weight_kg: w,
        matched: ef.matched,
        ef: ef.ef,
        ef_id: ef.ef_id,
        ef_product: ef.product,
        emission,
    };
}

export async function calculateWaste(
    dominantMaterial: string,
    productionWasteWeightKg: number,
    packagingType: string,
    packagingWasteWeightKg: number,
): Promise<WasteCalc> {
    const production = await wasteLeg(
        "Production waste",
        (dominantMaterial || "").trim().toLowerCase(),
        productionWasteWeightKg,
    );
    const packaging = await wasteLeg(
        "Packaging waste",
        (packagingType || "").trim().toLowerCase(),
        packagingWasteWeightKg,
    );
    return {
        production_waste: production,
        packaging_waste: packaging,
        total_emission: Number((production.emission + packaging.emission).toFixed(8)),
    };
}
