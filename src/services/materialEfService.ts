// Raw-material emission-factor resolver + calculator.
//
// For each raw material (Aluminium, Silicon, …) the manager's PCF logic picks
// ONE specific BAFU product (e.g. Aluminium -> "production mix, cast alloy") and
// then takes the HIGHEST emission factor across all countries for that product.
// The geography chain is NOT used here — that belongs to Production emissions.
//
// Raw material formula (matches the manager's testing sheet):
//   material_weight = component_weight(kg) x (composition_% / 100)
//   material_PCF    = material_weight x EF(kgCO2e/kg)
//   raw_total       = Σ material_PCF

import { withClient } from "../util/database.js";

export interface MaterialEfMatch {
    matched: boolean;
    ef_id?: string;
    ef?: number;              // kgCO2e per kg
    product?: string;
    country_code?: string;
    pattern?: string;         // the product pattern used (audit)
}

export interface RawMaterialRow {
    material: string;
    composition_percent: number;
}

export interface RawMaterialResult {
    material: string;
    composition_percent: number;
    weight_kg: number;
    matched: boolean;
    ef?: number;
    ef_id?: string;
    ef_product?: string;
    ef_country?: string;
    pcf: number;              // weight_kg x ef
}

export interface RawMaterialsCalc {
    component_weight_kg: number;
    rows: RawMaterialResult[];
    total_pcf: number;        // Σ pcf  (raw material emissions)
    total_weight_kg: number;  // Σ weight (should ≈ component weight)
}

// Resolve the single emission factor for one material: look up its BAFU product
// pattern, then take the highest EF across all countries for that product.
export async function matchMaterialEf(material: string): Promise<MaterialEfMatch> {
    const key = (material || "").trim().toLowerCase();
    if (!key) return { matched: false };
    return withClient(async (client: any) => {
        const m = await client.query(
            `SELECT bafu_category, product_pattern, bafu_ef_id FROM material_ef_mapping WHERE material_key = $1 LIMIT 1`,
            [key],
        );
        if (!m.rows[0]) return { matched: false };
        const { bafu_category, product_pattern, bafu_ef_id } = m.rows[0];

        // Exact-row pin (used for transport modes): fetch that EF directly.
        if (bafu_ef_id) {
            const e = await client.query(
                `SELECT ef_id, product, country_code, kgco2e_per_unit FROM emission_factors WHERE ef_id = $1 LIMIT 1`,
                [bafu_ef_id],
            );
            if (e.rows[0]) {
                return {
                    matched: true,
                    ef_id: e.rows[0].ef_id,
                    ef: Number(e.rows[0].kgco2e_per_unit),
                    product: e.rows[0].product,
                    country_code: e.rows[0].country_code,
                    pattern: `ef_id:${bafu_ef_id}`,
                };
            }
        }

        // Highest EF across all countries for this specific product.
        const r = await client.query(
            `SELECT ef_id, product, country_code, kgco2e_per_unit
             FROM emission_factors
             WHERE LOWER(category) = LOWER($1)
               AND product ILIKE $2
             ORDER BY kgco2e_per_unit DESC NULLS LAST
             LIMIT 1`,
            [bafu_category, product_pattern],
        );
        if (!r.rows[0]) return { matched: false, pattern: product_pattern };
        return {
            matched: true,
            ef_id: r.rows[0].ef_id,
            ef: Number(r.rows[0].kgco2e_per_unit),
            product: r.rows[0].product,
            country_code: r.rows[0].country_code,
            pattern: product_pattern,
        };
    });
}

// Compute raw-material emissions for a component.
export async function calculateRawMaterials(
    componentWeightKg: number,
    materials: RawMaterialRow[],
): Promise<RawMaterialsCalc> {
    const rows: RawMaterialResult[] = [];
    let total = 0;
    let totalWeight = 0;
    for (const mat of materials) {
        const pct = Number(mat.composition_percent) || 0;
        const weight = Number((componentWeightKg * (pct / 100)).toFixed(6));
        totalWeight += weight;
        const ef = await matchMaterialEf(mat.material);
        const pcf = ef.matched && ef.ef != null ? Number((weight * ef.ef).toFixed(6)) : 0;
        total += pcf;
        rows.push({
            material: mat.material,
            composition_percent: pct,
            weight_kg: weight,
            matched: ef.matched,
            ef: ef.ef,
            ef_id: ef.ef_id,
            ef_product: ef.product,
            ef_country: ef.country_code,
            pcf,
        });
    }
    return {
        component_weight_kg: componentWeightKg,
        rows,
        total_pcf: Number(total.toFixed(6)),
        total_weight_kg: Number(totalWeight.toFixed(6)),
    };
}
