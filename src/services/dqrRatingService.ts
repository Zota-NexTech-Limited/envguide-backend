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

const QUESTION_TABLES = [
    "supplier_general_info_questions",
    "material_composition_questions",
    "energy_manufacturing_questions",
    "packaging_questions",
    "transportation_logistics_questions",
    "waste_by_products_questions",
    "end_of_life_circularity_questions",
    "emission_factors_or_lca_data_questions",
    "certification_and_standards_questions",
    "additional_notes_questions"
];

const DQR_TABLES = [
    "dqr_raw_material_product_rating",
    "dqr_recycled_material_content_rating",
    "dqr_pre_consumer_material_rating",
    "dqr_post_consumer_material_rating",
    "dqr_reutilization_material_rating",
    "dqr_recycled_copper_rating",
    "dqr_recycled_aluminum_rating",
    "dqr_recycled_steel_rating",
    "dqr_recycled_plastics_rating",
    "dqr_recycled_thermoplastics_rating",
    "dqr_recycled_plastic_fillers_rating",
    "dqr_recycled_fiber_content_rating",
    "dqr_recycling_process_rating",
    "dqr_track_transport_emissions_rating",
    "dqr_pcr_and_pir_rating",
    "dqr_bio_based_or_renewable_materials_rating",
    "dqr_main_alloy_metals_rating",
    "dqr_metal_grade_rating",
    "dqr_energy_sources_used_rating",
    "dqr_electricity_consumption_per_year_rating",
    "dqr_renewable_electricity_percentage_rating",
    "dqr_energy_intensity_per_unit_rating",
    "dqr_process_specific_energy_usage_rating",
    "dqr_abatement_system_energy_consumption_rating",
    "dqr_water_consumption_and_treatment_details_rating",
    "dqr_packaging_materials_used_rating",
    "dqr_packaging_weight_per_unit_rating",
    "dqr_recycled_packaging_percentage_rating",
    "dqr_transport_modes_used_rating",
    "dqr_logistics_provider_details_rating",
    "dqr_recycling_percentage_rating",
    "dqr_byproduct_types_rating",
    "dqr_byproduct_quantity_rating",
    "dqr_product_recycling_details_rating",
    "dqr_takeback_program_details_rating",
    "dqr_pcf_methodologies_used_rating",
    "dqr_emission_data_details_rating",
    "dqr_previous_reports_rating",
    "dqr_carbon_reduction_measures_rating",
    "dqr_renewable_energy_or_recycling_programs_rating",
    "dqr_primary_data_details_rating"
];

// export async function getSupplierDqrDetailsService(sgiq_id: string) {
//     return withClient(async (client: any) => {
//         try {
//             const result: any = {};

//             // ✅ Step 1: Fetch main supplier general info
//             const generalInfo = await client.query(
//                 `SELECT * FROM supplier_general_info_questions WHERE sgiq_id = $1`,
//                 [sgiq_id]
//             );
//             if (!generalInfo.rows.length) return null;
//             result.general_info = generalInfo.rows[0];

//             // ✅ Step 2: Fetch all related question tables
//             for (const table of QUESTION_TABLES.slice(1)) {
//                 const res = await client.query(`SELECT * FROM ${table} WHERE sgiq_id = $1`, [sgiq_id]);
//                 result[table] = res.rows;
//             }

//             // ✅ Step 3: Fetch all DQR rating tables
//             for (const table of DQR_TABLES) {
//                 const res = await client.query(`SELECT * FROM ${table} WHERE sgiq_id = $1`, [sgiq_id]);
//                 result[table] = res.rows;
//             }

//             return result;
//         } catch (error: any) {
//             console.error("Error in getSupplierDqrDetailsService:", error.message);
//             throw new Error(error.message);
//         }
//     });
// }

// export async function getSupplierDqrDetailsService(sgiq_id: string) {
//     return withClient(async (client: any) => {
//         try {
//             const result: any = {
//                 supplier_questions: {},
//                 dqr_ratings: {}
//             };

//             // Fetch main supplier_general_info_questions + user_name
//             const generalInfoQuery = `
//         SELECT gq.*, u.user_name
//         FROM supplier_general_info_questions gq
//         LEFT JOIN users_table u ON gq.user_id = u.user_id
//         WHERE gq.sgiq_id = $1
//       `;
//             const generalInfo = await client.query(generalInfoQuery, [sgiq_id]);

//             if (!generalInfo.rows.length) return null;
//             result.supplier_questions["supplier_general_info_questions"] = generalInfo.rows[0];

//             // Fetch all related supplier question tables
//             for (const table of QUESTION_TABLES.slice(1)) {
//                 const res = await client.query(`SELECT * FROM ${table} WHERE sgiq_id = $1`, [sgiq_id]);
//                 result.supplier_questions[table] = res.rows;
//             }

//             // Fetch all DQR rating tables
//             for (const table of DQR_TABLES) {
//                 const res = await client.query(`SELECT * FROM ${table} WHERE sgiq_id = $1`, [sgiq_id]);
//                 result.dqr_ratings[table] = res.rows;
//             }

//             return result;
//         } catch (error: any) {
//             console.error("Error in getSupplierDqrDetailsService:", error.message);
//             throw new Error(error.message);
//         }
//     });
// }

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
            (SELECT json_agg(to_jsonb(t)) FROM dqr_type_of_quality_control_equipment_usage_qthirtytwo t WHERE t.sgiq_id = $1) AS q32,

            (SELECT json_agg(to_jsonb(t)) FROM dqr_electricity_consumed_for_quality_control_qthirtythree t WHERE t.sgiq_id = $1) AS q33,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_quality_control_process_usage_qthirtyfour t WHERE t.sgiq_id = $1) AS q34,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_quality_control_process_usage_pressure_or_flow_qthirtyfour t WHERE t.sgiq_id = $1) AS q34_pressure,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_quality_control_use_any_consumables_qthirtyfive t WHERE t.sgiq_id = $1) AS q35,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_weight_of_samples_destroyed_qthirtyseven t WHERE t.sgiq_id = $1) AS q37,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_defect_or_rej_rate_identified_by_quality_control_qthirtyeight t WHERE t.sgiq_id = $1) AS q38,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_rework_rate_due_to_quality_control_qthirtynine t WHERE t.sgiq_id = $1) AS q39,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_weight_of_quality_control_waste_generated_qforty t WHERE t.sgiq_id = $1) AS q40,
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
            (SELECT json_agg(to_jsonb(t)) FROM dqr_energy_consumption_for_qsixtyseven_qsixtyseven t WHERE t.sgiq_id = $1) AS q67,
            (SELECT json_agg(to_jsonb(t)) FROM dqr_weight_of_pro_packaging_waste_qsixtyeight t WHERE t.sgiq_id = $1) AS q68,
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


export async function updateDqrRatingService(type: string, records: any[], updated_by: string) {
    return withClient(async (client: any) => {
        await client.query("BEGIN");

        try {
            const updatePromises = records.map(async (record: any) => {
                const { id, sgiq_id, ...updateFields } = record;

                if (!id || !sgiq_id) {
                    throw new Error("Each record must include id and sgiq_id");
                }

                const fields = Object.keys(updateFields);
                const values = Object.values(updateFields);

                if (fields.length === 0) return null;

                // Build dynamic SET clause
                const setClauses = fields.map((field, index) => `${field} = $${index + 1}`);
                setClauses.push(`updated_by = $${fields.length + 1}`);
                setClauses.push(`update_date = NOW()`);

                const query = `
          UPDATE ${type}
          SET ${setClauses.join(", ")}
          WHERE id = $${fields.length + 2} AND sgiq_id = $${fields.length + 3}
          RETURNING *;
        `;

                const params = [...values, updated_by, id, sgiq_id];
                const result = await client.query(query, params);
                return result.rows[0] || null;
            });

            const updatedRows = await Promise.all(updatePromises);

            await client.query("COMMIT");
            return updatedRows.filter(Boolean);
        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error(`❌ Error updating ${type}:`, error.message);
            throw new Error(error.message);
        }
    });
}

