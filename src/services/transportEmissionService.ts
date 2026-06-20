// Transport emission calculator.
//
// Each transport leg (one Q10 row): distance × EF(mode) × weight_in_tonnes.
// The BAFU transport EFs are per tonne-km, so the transported weight is always
// converted to tonnes first (grams / kg / tonnes → tonnes).
//
//   leg_emission    = distance_km × ef_mode × weight_tonnes
//   transport_total = Σ legs
//
// Worked example (manager's sheet, weight 0.33 kg = 0.00033 t):
//   Truck 655×0.22×0.00033=0.0476 ; Ship 22031×0.016×0.00033=0.116 ;
//   Train 783×0.017×0.00033=0.0044 ; total ≈ 0.16

import { matchMaterialEf } from "./materialEfService.js";

// Convert any supported weight unit to tonnes.
export function toTonnes(value: number, unit: string): number {
    const u = (unit || "").toLowerCase().trim();
    if (u === "g" || u === "grams" || u === "gram") return value / 1_000_000;
    if (u === "kg" || u === "kilograms" || u === "kilogram") return value / 1_000;
    // tonnes / t / tonne / ton — already tonnes
    return value;
}

export interface TransportLegInput {
    mode: string;          // road / truck / ship / train / rail
    distance_km: number;
}

export interface TransportLegResult {
    mode: string;
    distance_km: number;
    matched: boolean;
    ef?: number;           // kgCO2e per tonne-km
    ef_id?: string;
    ef_product?: string;
    leg_emission: number;
}

export interface TransportCalc {
    transported_weight: number;
    weight_unit: string;
    weight_tonnes: number;
    legs: TransportLegResult[];
    total_emission: number;
}

export async function calculateTransport(
    transportedWeight: number,
    weightUnit: string,
    legs: TransportLegInput[],
): Promise<TransportCalc> {
    const weightTonnes = toTonnes(transportedWeight, weightUnit);
    const results: TransportLegResult[] = [];
    let total = 0;
    for (const leg of legs) {
        const ef = await matchMaterialEf(leg.mode);
        const dist = Number(leg.distance_km) || 0;
        const emission = ef.matched && ef.ef != null
            ? Number((dist * ef.ef * weightTonnes).toFixed(6))
            : 0;
        total += emission;
        results.push({
            mode: leg.mode,
            distance_km: dist,
            matched: ef.matched,
            ef: ef.ef,
            ef_id: ef.ef_id,
            ef_product: ef.product,
            leg_emission: emission,
        });
    }
    return {
        transported_weight: transportedWeight,
        weight_unit: weightUnit,
        weight_tonnes: Number(weightTonnes.toFixed(8)),
        legs: results,
        total_emission: Number(total.toFixed(6)),
    };
}
