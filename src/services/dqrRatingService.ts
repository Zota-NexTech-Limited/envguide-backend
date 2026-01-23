import { withClient } from '../util/database';
import { ulid } from 'ulid';

export async function createDqrRatingService(type: string, records: any[], created_by: string, code: string, bom_pcf_id: string) {
    return withClient(async (client: any) => {
        await client.query("BEGIN");

        try {
            const insertPromises = records.map(async (record: any) => {
                const id = ulid();
                const created_date = new Date();
                const update_date = new Date();

                const {
                    sgiq_id,
                    data,
                    ter_tag_type,
                    ter_tag_value,
                    ter_data_point,
                    tir_tag_type,
                    tir_tag_value,
                    tir_data_point,
                    gr_tag_type,
                    gr_tag_value,
                    gr_data_point,
                    c_tag_type,
                    c_tag_value,
                    c_data_point,
                    pds_tag_type,
                    pds_tag_value,
                    pds_data_point,
                } = record;

                const insertQuery = `
          INSERT INTO ${type} (
            id,
            sgiq_id,
            data,
            ter_tag_type,
            ter_tag_value,
            ter_data_point,
            tir_tag_type,
            tir_tag_value,
            tir_data_point,
            gr_tag_type,
            gr_tag_value,
            gr_data_point,
            c_tag_type,
            c_tag_value,
            c_data_point,
            pds_tag_type,
            pds_tag_value,
            pds_data_point,
            created_by,
            created_date,
            update_date,
            code
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
            $16,$17,$18,$19,$20,$21,$22
          )
          RETURNING *;
        `;

                const values = [
                    id,
                    sgiq_id,
                    data,
                    ter_tag_type,
                    ter_tag_value,
                    ter_data_point,
                    tir_tag_type,
                    tir_tag_value,
                    tir_data_point,
                    gr_tag_type,
                    gr_tag_value,
                    gr_data_point,
                    c_tag_type,
                    c_tag_value,
                    c_data_point,
                    pds_tag_type,
                    pds_tag_value,
                    pds_data_point,
                    created_by,
                    created_date,
                    update_date,
                    code
                ];

                const result = await client.query(insertQuery, values);
                return result.rows[0];
            });

            const insertedRows = await Promise.all(insertPromises);

            // update PCF Request Stages of 5 and 6
            const updatePCFRequestStages = await client.query(
                `UPDATE pcf_request_stages 
                    SET 
                      is_dqr_completed = true, 
                      is_pcf_calculated = true,
                      dqr_completed_by = $2, 
                      bom_verified_date = NOW(),
                      pcf_calculated_date = NOW() 
                    WHERE bom_pcf_id = $1;`,
                [bom_pcf_id, created_by]
            );

            await client.query("COMMIT");
            return insertedRows;
        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error(`Error inserting into ${type}:`, error.message);
            throw new Error(error.message);
        }
    });
}

export async function getSupplierDqrDetailsService(sgiq_id: string) {
    return withClient(async (client: any) => {

        const query = `
        SELECT
            /* ---------------- Q9 ---------------- */
            (SELECT json_agg(to_jsonb(t)) FROM dqr_emission_data_rating_qnine t WHERE t.sgiq_id = $1) AS q9,

            /* ---------------- Q11 – Q12 ---------------- */
            (SELECT json_agg(to_jsonb(t)) FROM dqr_supplier_product_questions_rating_qeleven t WHERE t.sgiq_id = $1) AS q11,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_supplier_product_questions_rating_qtwelve t WHERE t.sgiq_id = $1) AS q12,

            /* ---------------- Q13 ---------------- */
            (SELECT json_agg(to_jsonb(t)) FROM dqr_production_site_detail_rating_qthirteen t WHERE t.sgiq_id = $1) AS q13,

            /* ---------------- Q15 + 15.1 ---------------- */
            (SELECT json_agg(to_jsonb(t)) FROM dqr_product_component_manufactured_rating_qfiften t WHERE t.sgiq_id = $1) AS q15,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_co_product_component_manufactured_rating_qfiftenone t WHERE t.sgiq_id = $1) AS q15_1,

            /* ---------------- Scope 1 (Q16–Q21) ---------------- */
            (SELECT json_agg(to_jsonb(t)) FROM dqr_stationary_combustion_on_site_energy_rating_qsixten t WHERE t.sgiq_id = $1) AS q16,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_mobile_combustion_company_owned_vehicles_rating_qseventen t WHERE t.sgiq_id = $1) AS q17,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_refrigerants_rating_qnineten t WHERE t.sgiq_id = $1) AS q19,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_process_emissions_sources_qtwentyone t WHERE t.sgiq_id = $1) AS q21,

            /* ---------------- Scope 2 (Q22–Q51) ---------------- */
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_two_indirect_emis_from_pur_energy_qtwentytwo t WHERE t.sgiq_id = $1) AS q22,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_two_indirect_emissions_certificates_qtwentyfour t WHERE t.sgiq_id = $1) AS q24,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_two_indirect_emissions_qtwentysix t WHERE t.sgiq_id = $1) AS q26,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_energy_intensity_of_pro_est_kwhor_mj_qtwentyseven t WHERE t.sgiq_id = $1) AS q27,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_process_specific_energy_usage_qtwentyeight t WHERE t.sgiq_id = $1) AS q28,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_abatement_systems_used_qthirty t WHERE t.sgiq_id = $1) AS q30,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_two_indirect_emissions_qthirtyone t WHERE t.sgiq_id = $1) AS q31,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_type_of_quality_control_equipment_usage_qthirtytwo t WHERE t.sgiq_id = $1) AS q32,

            (SELECT json_agg(to_jsonb(t)) FROM dqr_electricity_consumed_for_quality_control_qthirtythree t WHERE t.sgiq_id = $1) AS q33,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_quality_control_process_usage_qthirtyfour t WHERE t.sgiq_id = $1) AS q34,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_quality_control_process_usage_pressure_or_flow_qthirtyfour t WHERE t.sgiq_id = $1) AS q34_pressure,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_quality_control_use_any_consumables_qthirtyfive t WHERE t.sgiq_id = $1) AS q35,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_weight_of_samples_destroyed_qthirtyseven t WHERE t.sgiq_id = $1) AS q37,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_defect_or_rej_rate_identified_by_quality_control_qthirtyeight t WHERE t.sgiq_id = $1) AS q38,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_rework_rate_due_to_quality_control_qthirtynine t WHERE t.sgiq_id = $1) AS q39,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_weight_of_quality_control_waste_generated_qforty t WHERE t.sgiq_id = $1) AS q40,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_two_indirect_emissions_qfortyone t WHERE t.sgiq_id = $1) AS q41,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_energy_consumption_for_qfortyfour_qfortyfour t WHERE t.sgiq_id = $1) AS q44,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_cloud_provider_details_qfortysix t WHERE t.sgiq_id = $1) AS q46,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_dedicated_monitoring_sensor_usage_qfortyseven t WHERE t.sgiq_id = $1) AS q47,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_annual_replacement_rate_of_sensor_qfortyeight t WHERE t.sgiq_id = $1) AS q48,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_energy_consumption_for_qfiftyone_qfiftyone t WHERE t.sgiq_id = $1) AS q51,

            /* ---------------- Scope 3 (Q52–Q80) ---------------- */
            (SELECT json_agg(to_jsonb(t)) FROM dqr_raw_materials_used_in_component_manufacturing_qfiftytwo t WHERE t.sgiq_id = $1) AS q52,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_three_other_indirect_emissions_qfiftythree t WHERE t.sgiq_id = $1) AS q53,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_three_other_indirect_emissions_qfiftyfour t WHERE t.sgiq_id = $1) AS q54,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_recycled_materials_with_percentage_qfiftysix t WHERE t.sgiq_id = $1) AS q56,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_pre_post_consumer_reutilization_percentage_qfiftyeight t WHERE t.sgiq_id = $1) AS q58,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_pir_pcr_material_percentage_qfiftynine t WHERE t.sgiq_id = $1) AS q59,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_type_of_pack_mat_used_for_delivering_qsixty t WHERE t.sgiq_id = $1) AS q60,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_weight_of_packaging_per_unit_product_qsixtyone t WHERE t.sgiq_id = $1) AS q61,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_three_other_indirect_emissions_qsixtyfour t WHERE t.sgiq_id = $1) AS q64,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_energy_consumption_for_qsixtyseven_qsixtyseven t WHERE t.sgiq_id = $1) AS q67,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_weight_of_pro_packaging_waste_qsixtyeight t WHERE t.sgiq_id = $1) AS q68,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_three_other_indirect_emissions_qsixtynine t WHERE t.sgiq_id = $1) AS q69,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_type_of_by_product_qseventyone t WHERE t.sgiq_id = $1) AS q71,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_co_two_emission_of_raw_material_qseventythree t WHERE t.sgiq_id = $1) AS q73,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_mode_of_transport_used_for_transportation_qseventyfour t WHERE t.sgiq_id = $1) AS q74,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_destination_plant_component_transportation_qseventyfive t WHERE t.sgiq_id = $1) AS q75,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_three_other_indirect_emissions_qseventynine t WHERE t.sgiq_id = $1) AS q79,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_scope_three_other_indirect_emissions_qeighty t WHERE t.sgiq_id = $1) AS q80
        `;

        const { rows } = await client.query(query, [sgiq_id]);
        return rows[0];
    });
}

export const DQR_CONFIG: Record<string, { table: string; pk: string }> = {
    // Q9 – Q13
    q9: { table: 'dqr_emission_data_rating_qnine', pk: 'edrqn_id' },
    q11: { table: 'dqr_supplier_product_questions_rating_qeleven', pk: 'spqrqe_id' },
    q12: { table: 'dqr_supplier_product_questions_rating_qtwelve', pk: 'spqrqt_id' },
    q13: { table: 'dqr_production_site_detail_rating_qthirteen', pk: 'psdrqt_id' },

    // Q15 – Q17
    q15: { table: 'dqr_product_component_manufactured_rating_qfiften', pk: 'pcmrqf_id' },
    q151: { table: 'dqr_co_product_component_manufactured_rating_qfiftenone', pk: 'pcmrqfo_id' },
    q16: { table: 'dqr_stationary_combustion_on_site_energy_rating_qsixten', pk: 'scoserqs_id' },
    q17: { table: 'dqr_mobile_combustion_company_owned_vehicles_rating_qseventen', pk: 'mccoqrqs_id' },

    // Q19 – Q22
    q19: { table: 'dqr_refrigerants_rating_qnineten', pk: 'refrqn_id' },
    q21: { table: 'dqr_process_emissions_sources_qtwentyone', pk: 'pesqto_id' },
    q22: { table: 'dqr_scope_two_indirect_emis_from_pur_energy_qtwentytwo', pk: 'stidefpeqtt_id' },

    // Q24 – Q28
    q24: { table: 'dqr_scope_two_indirect_emissions_certificates_qtwentyfour', pk: 'stiecqtf_id' },
    q26: { table: 'dqr_scope_two_indirect_emissions_qtwentysix', pk: 'stieqts_id' },
    q27: { table: 'dqr_energy_intensity_of_pro_est_kwhor_mj_qtwentyseven', pk: 'eiopekmqts_id' },
    q28: { table: 'dqr_process_specific_energy_usage_qtwentyeight', pk: 'pseuqte_id' },

    // Q30 – Q33
    q30: { table: 'dqr_abatement_systems_used_qthirty', pk: 'asuqt_id' },
    q31: { table: 'dqr_scope_two_indirect_emissions_qthirtyone', pk: 'stideqto_id' },
    q32: { table: 'dqr_type_of_quality_control_equipment_usage_qthirtytwo', pk: 'toqceuqto_id' },
    q33: { table: 'dqr_electricity_consumed_for_quality_control_qthirtythree', pk: 'ecfqcqtt_id' },

    // Q34 – Q35
    q34: { table: 'dqr_quality_control_process_usage_qthirtyfour', pk: 'qcpuqtf_id' },
    q341: { table: 'dqr_quality_control_process_usage_pressure_or_flow_qthirtyfour', pk: 'qcpupfqtf_id' },
    q35: { table: 'dqr_quality_control_use_any_consumables_qthirtyfive', pk: 'qcuacqtf_id' },

    // Q37 – Q41
    q37: { table: 'dqr_weight_of_samples_destroyed_qthirtyseven', pk: 'wosdqts_id' },
    q38: { table: 'dqr_defect_or_rej_rate_identified_by_quality_control_qthirtyeight', pk: 'dorriqcqte_id' },
    q39: { table: 'dqr_rework_rate_due_to_quality_control_qthirtynine', pk: 'rrdqcqtn_id' },
    q40: { table: 'dqr_weight_of_quality_control_waste_generated_qforty', pk: 'woqcwgqf_id' },
    q41: { table: 'dqr_scope_two_indirect_emissions_qfortyone', pk: 'stideqfo_id' },

    // Q44 – Q48
    q44: { table: 'dqr_energy_consumption_for_qfortyfour_qfortyfour', pk: 'ecfqffqff_id' },
    q46: { table: 'dqr_cloud_provider_details_qfortysix', pk: 'cpdqfs_id' },
    q47: { table: 'dqr_dedicated_monitoring_sensor_usage_qfortyseven', pk: 'dmsuqfs_id' },
    q48: { table: 'dqr_annual_replacement_rate_of_sensor_qfortyeight', pk: 'arrosqfe_id' },

    // Q51 – Q54
    q51: { table: 'dqr_energy_consumption_for_qfiftyone_qfiftyone', pk: 'ecfqfoqfo_id' },
    q52: { table: 'dqr_raw_materials_used_in_component_manufacturing_qfiftytwo', pk: 'rmuicmqft_id' },
    q53: { table: 'dqr_scope_three_other_indirect_emissions_qfiftythree', pk: 'stoieqft_id' },
    q54: { table: 'dqr_scope_three_other_indirect_emissions_qfiftyfour', pk: 'stoieqff_id' },

    // Q56 – Q61
    q56: { table: 'dqr_recycled_materials_with_percentage_qfiftysix', pk: 'rmwpqfs_id' },
    q58: { table: 'dqr_pre_post_consumer_reutilization_percentage_qfiftyeight', pk: 'ppcrpqfe_id' },
    q59: { table: 'dqr_pir_pcr_material_percentage_qfiftynine', pk: 'ppmpqfn_id' },
    q60: { table: 'dqr_type_of_pack_mat_used_for_delivering_qsixty', pk: 'topmudpqs_id' },
    q61: { table: 'dqr_weight_of_packaging_per_unit_product_qsixtyone', pk: 'woppupqso_id' },

    // Q64 – Q69
    q64: { table: 'dqr_scope_three_other_indirect_emissions_qsixtyfour', pk: 'stoieqsf_id' },
    q67: { table: 'dqr_energy_consumption_for_qsixtyseven_qsixtyseven', pk: 'ecfqssqss_id' },
    q68: { table: 'dqr_weight_of_pro_packaging_waste_qsixtyeight', pk: 'woppwqse_id' },
    q69: { table: 'dqr_scope_three_other_indirect_emissions_qsixtynine', pk: 'stoieqsn_id' },

    // Q71 – Q75
    q71: { table: 'dqr_type_of_by_product_qseventyone', pk: 'topbpqso_id' },
    q73: { table: 'dqr_co_two_emission_of_raw_material_qseventythree', pk: 'coteormqst_id' },
    q74: { table: 'dqr_mode_of_transport_used_for_transportation_qseventyfour', pk: 'motuftqsf_id' },
    q75: { table: 'dqr_destination_plant_component_transportation_qseventyfive', pk: 'dpctqsf_id' },

    // Q79 – Q80
    q79: { table: 'dqr_scope_three_other_indirect_emissions_qseventynine', pk: 'stoieqsn_id' },
    q80: { table: 'dqr_scope_three_other_indirect_emissions_qeighty', pk: 'stoieqe_id' },
};

function buildDqrCompletenessQuery() {
    return `
        SELECT EXISTS (
            ${Object.values(DQR_CONFIG)
            .map(cfg => `
                    SELECT 1
                    FROM ${cfg.table}
                    WHERE sgiq_id = $1
                      AND pds_tag_type IS NULL
                `)
            .join(" UNION ALL ")}
        ) AS has_incomplete;
    `;
}

export async function updateDqrRatingService(
    type: string,
    records: any[],
    updated_by: string
) {
    const { table, pk } = DQR_CONFIG[type];

    return withClient(async (client: any) => {
        await client.query("BEGIN");

        try {
            const results = [];
            let sgiqId = null;

            for (const record of records) {
                const { sgiq_id, ...rest } = record;
                const pkValue = rest[pk];

                sgiqId = sgiq_id;
                if (!sgiq_id || !pkValue) {
                    throw new Error(`Missing ${pk} or sgiq_id`);
                }

                delete rest[pk];

                const fields = Object.keys(rest);
                if (fields.length === 0) continue;

                const setClause = fields
                    .map((f, i) => `${f} = $${i + 1}`)
                    .join(", ");

                const query = `
                    UPDATE ${table}
                    SET ${setClause},
                        updated_by = $${fields.length + 1},
                        update_date = NOW()
                    WHERE ${pk} = $${fields.length + 2}
                      AND sgiq_id = $${fields.length + 3}
                    RETURNING *;
                `;

                const values = [
                    ...fields.map(f => rest[f]),
                    updated_by,
                    pkValue,
                    sgiq_id
                ];

                const { rows } = await client.query(query, values);
                if (rows[0]) results.push(rows[0]);
            }

            // Update DQR Rating old using bom id will update later
            // if (type === "q80" && sgiqId) {
            //     const fetchIdsQuery = `
            //             SELECT
            //                  bom_pcf_id,
            //                  bom_id,
            //                  sup_id
            //             FROM supplier_general_info_questions
            //             WHERE sgiq_id = $1
            //             LIMIT 1;
            //     `;

            //     const idsResult = await client.query(fetchIdsQuery, [sgiqId]);

            //     const { bom_pcf_id, bom_id, sup_id } = idsResult.rows[0];

            //     const updatePCFDataRating = `
            //          UPDATE pcf_request_data_rating_stage
            //          SET is_submitted = TRUE,
            //             completed_date = NOW(),
            //             submitted_by = $4
            //          WHERE bom_pcf_id = $1 AND bom_id =$2 AND sup_id=$3;
            //         `;

            //     await client.query(updatePCFDataRating, [bom_pcf_id, bom_id, sup_id, updated_by]);
            // }

            // if (type === "q80" && sgiqId) {
            //     const fetchIdsQuery = `
            //             SELECT
            //                  bom_pcf_id,
            //                  sup_id
            //             FROM supplier_general_info_questions
            //             WHERE sgiq_id = $1
            //             LIMIT 1;
            //     `;

            //     const idsResult = await client.query(fetchIdsQuery, [sgiqId]);

            //     const { bom_pcf_id, sup_id } = idsResult.rows[0];

            //     const updatePCFDataRating = `
            //          UPDATE pcf_request_data_rating_stage
            //          SET is_submitted = TRUE,
            //             completed_date = NOW(),
            //             submitted_by = $3
            //          WHERE bom_pcf_id = $1 AND sup_id=$2;
            //         `;

            //     await client.query(updatePCFDataRating, [bom_pcf_id, sup_id, updated_by]);
            // }

            const completenessQuery = buildDqrCompletenessQuery();

            const { rows } = await client.query(completenessQuery, [sgiqId]);

            const hasIncomplete = rows[0]?.has_incomplete === true;

            // ❌ If ANY row is incomplete → stop
            if (!hasIncomplete) {
                // ✅ ALL rows across ALL tables are complete
                const fetchIdsQuery = `
        SELECT bom_pcf_id, sup_id
        FROM supplier_general_info_questions
        WHERE sgiq_id = $1
        LIMIT 1;
    `;

                const idsResult = await client.query(fetchIdsQuery, [sgiqId]);

                if (idsResult.rows[0]) {

                    const { bom_pcf_id, sup_id } = idsResult.rows[0];

                    const updatePCFDataRating = `
        UPDATE pcf_request_data_rating_stage
        SET is_submitted = TRUE,
            completed_date = NOW(),
            submitted_by = $3
        WHERE bom_pcf_id = $1
          AND sup_id = $2;
    `;

                    await client.query(updatePCFDataRating, [
                        bom_pcf_id,
                        sup_id,
                        updated_by
                    ]);
                }
            }

            await client.query("COMMIT");
            return results;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
    });
}


