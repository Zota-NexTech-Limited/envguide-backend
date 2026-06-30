import { withClient } from "../util/database.js";
import { ulid } from "ulid";
import { computePcfFields } from "./formulaEngine.js";

// ============================================================
// "Run PCF Calculation" for the V3 (28-Q) questionnaire.
//
// The legacy 5-formula calculation chain was removed, so the request-view
// results table (bom_emission_calculation_engine) stays empty for V3 → the
// Results cards show 0.0000. This service is what the "Start PCF Calculation"
// button triggers: it re-runs the formula engine for each component's supplier
// response (which also refreshes pcf_computed_field), reads the engine's
// 5-bucket breakdown, writes one bom_emission_calculation_engine row per BOM
// component (which the existing GET /api/pcf-bom/get-by-id reads as
// `pcf_total_emission_calculation`), and flips is_pcf_calculated so the 8-stage
// tracker advances PCF Calculation → Result Validation.
// ============================================================

export type V3CalcResult = {
    v3: boolean;                 // false when no V3 responses exist (legacy request)
    componentsCalculated: number;
    grandTotal: number;
};

type ComponentResult = {
    bomId: string;
    material_value: number;
    production_value: number;
    packaging_value: number;
    waste_value: number;
    logistic_value: number;
    total_pcf_value: number;
};

/**
 * Compute + persist V3 PCF results for every BOM component of a request, then
 * advance the workflow to Result Validation. Returns { v3: false } when the
 * request has no V3 questionnaire responses (caller keeps the legacy behaviour).
 */
export async function runV3PcfCalculation(
    bomPcfId: string,
    userId: string
): Promise<V3CalcResult> {
    // Phase 1 — recompute each component's PCF (the formula engine manages its
    // own connection/transaction). Kept outside the write transaction below so
    // the two never contend.
    const components: { id: string; supplier_id: string }[] = await withClient(
        async (client: any) => {
            const r = await client.query(
                `SELECT id, supplier_id FROM bom WHERE bom_pcf_id = $1`,
                [bomPcfId]
            );
            return r.rows;
        }
    );

    const results: ComponentResult[] = [];
    for (const comp of components) {
        if (!comp.supplier_id) continue;

        const responseId = await withClient(async (client: any) => {
            const r = await client.query(
                `SELECT id FROM supplier_questionnaire_response
                  WHERE bom_pcf_request_id = $1 AND supplier_id = $2
                  ORDER BY created_date DESC NULLS LAST
                  LIMIT 1`,
                [bomPcfId, comp.supplier_id]
            );
            return r.rowCount > 0 ? (r.rows[0].id as string) : null;
        });
        if (!responseId) continue;

        // Re-run the engine — refreshes pcf_computed_field and returns the
        // 5-bucket breakdown that sums exactly to the grand total.
        const computed = await computePcfFields(responseId);
        const b = computed.breakdown;

        const material_value = b?.materials ?? 0;
        const production_value =
            b?.production ?? computed.productionStage.pcfIncludingBiogenicUptake;
        const packaging_value =
            b?.packaging ?? computed.packagingStage.pcfIncludingBiogenicUptake;
        const waste_value = b?.waste ?? 0;
        const logistic_value =
            b?.logistics ?? computed.distributionStage.pcfIncludingBiogenicUptake;
        const total_pcf_value =
            material_value + production_value + packaging_value + waste_value + logistic_value;

        results.push({
            bomId: comp.id,
            material_value,
            production_value,
            packaging_value,
            waste_value,
            logistic_value,
            total_pcf_value,
        });
    }

    // Not a V3 request — nothing computed. Keep the legacy "unavailable" response.
    if (results.length === 0) {
        return { v3: false, componentsCalculated: 0, grandTotal: 0 };
    }

    // Phase 2 — write the result rows + advance the stage in one transaction.
    let grandTotal = 0;
    await withClient(async (client: any) => {
        await client.query("BEGIN");
        try {
            for (const r of results) {
                await client.query(
                    `DELETE FROM bom_emission_calculation_engine
                      WHERE bom_id = $1 AND product_id IS NULL`,
                    [r.bomId]
                );
                await client.query(
                    `INSERT INTO bom_emission_calculation_engine
                        (id, bom_id, product_id, product_bom_pcf_id,
                         material_value, production_value, packaging_value,
                         logistic_value, waste_value, total_pcf_value)
                     VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        ulid(), r.bomId, bomPcfId,
                        r.material_value, r.production_value, r.packaging_value,
                        r.logistic_value, r.waste_value, r.total_pcf_value,
                    ]
                );
                grandTotal += r.total_pcf_value;
            }

            // Advance the tracker: PCF Calculation done → Result Validation.
            await client.query(
                `UPDATE pcf_request_stages
                    SET is_pcf_calculated = TRUE,
                        pcf_calculated_by = $2,
                        pcf_calculated_date = NOW(),
                        update_date = NOW()
                  WHERE bom_pcf_id = $1`,
                [bomPcfId, userId]
            );

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
    });

    return { v3: true, componentsCalculated: results.length, grandTotal };
}
