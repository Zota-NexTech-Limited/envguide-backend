/**
 * Shared helpers for Q68 / waste disposal EF resolution (supplier PCF + client product PCF).
 */

export async function findWasteTreatmentEmissionFactorRow(
    client: any,
    wasteType: string,
    treatmentType: string,
    year: number | string,
    unit: string
): Promise<{ ef_eu_region: string; ef_india_region: string; ef_global_region: string } | null> {
    const fetchExact = `
        SELECT
            wmttef.ef_eu_region,
            wmttef.ef_india_region,
            wmttef.ef_global_region
        FROM waste_material_treatment_type_emission_factor AS wmttef
        JOIN waste_treatment_type AS wtt ON wmttef.wtt_id = wtt.wtt_id
        WHERE LOWER(TRIM(wmttef.waste_type)) = LOWER(TRIM($1))
          AND wmttef.year = $2
          AND wmttef.unit = $3
          AND LOWER(TRIM(wtt.name)) = LOWER(TRIM($4));
    `;
    const exact = await client.query(fetchExact, [wasteType, year, unit, treatmentType]);
    if (exact.rows[0]) return exact.rows[0];

    const normalizeCompact = (s: string) =>
        String(s || "")
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/-/g, "");

    const fetchAllForWaste = `
        SELECT
            wmttef.ef_eu_region,
            wmttef.ef_india_region,
            wmttef.ef_global_region,
            wtt.name AS treatment_name
        FROM waste_material_treatment_type_emission_factor AS wmttef
        JOIN waste_treatment_type AS wtt ON wmttef.wtt_id = wtt.wtt_id
        WHERE LOWER(TRIM(wmttef.waste_type)) = LOWER(TRIM($1))
          AND wmttef.year = $2
          AND wmttef.unit = $3;
    `;
    const all = await client.query(fetchAllForWaste, [wasteType, year, unit]);
    const target = normalizeCompact(treatmentType);
    for (const row of all.rows) {
        const n = normalizeCompact(row.treatment_name);
        if (n === target) return row;
    }
    return null;
}

/** Last resort: any paper/cardboard + recycling row in waste EF master for the reporting year. */
export async function findPaperCardboardRecyclingEfFallback(
    client: any,
    year: number | string,
    unit: string
): Promise<{ ef_eu_region: string; ef_india_region: string; ef_global_region: string } | null> {
    const q = `
        SELECT wmttef.ef_eu_region, wmttef.ef_india_region, wmttef.ef_global_region
        FROM waste_material_treatment_type_emission_factor AS wmttef
        JOIN waste_treatment_type AS wtt ON wmttef.wtt_id = wtt.wtt_id
        WHERE wmttef.year = $1 AND wmttef.unit = $2
          AND (
            LOWER(wmttef.waste_type) LIKE '%paper%' OR LOWER(wmttef.waste_type) LIKE '%cardboard%'
          )
          AND LOWER(wtt.name) LIKE '%recycl%'
        LIMIT 1;
    `;
    const r = await client.query(q, [year, unit]);
    return r.rows[0] || null;
}
