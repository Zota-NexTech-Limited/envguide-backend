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

            const updatePCFRequestStages = await client.query(
                `UPDATE pcf_request_stages 
                    SET 
                      is_dqr_completed = true, 
                      dqr_completed_by = $2, 
                      bom_verified_date = NOW() 
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

export async function getSupplierDqrDetailsService(sgiq_id: string) {
    return withClient(async (client: any) => {
        try {
            const result: any = {
                supplier_questions: {},
                dqr_ratings: {}
            };

            // Fetch main supplier_general_info_questions + user_name
            const generalInfoQuery = `
        SELECT gq.*, u.user_name
        FROM supplier_general_info_questions gq
        LEFT JOIN users_table u ON gq.user_id = u.user_id
        WHERE gq.sgiq_id = $1
      `;
            const generalInfo = await client.query(generalInfoQuery, [sgiq_id]);

            if (!generalInfo.rows.length) return null;
            result.supplier_questions["supplier_general_info_questions"] = generalInfo.rows[0];

            // Fetch all related supplier question tables
            for (const table of QUESTION_TABLES.slice(1)) {
                const res = await client.query(`SELECT * FROM ${table} WHERE sgiq_id = $1`, [sgiq_id]);
                result.supplier_questions[table] = res.rows;
            }

            // Fetch all DQR rating tables
            for (const table of DQR_TABLES) {
                const res = await client.query(`SELECT * FROM ${table} WHERE sgiq_id = $1`, [sgiq_id]);
                result.dqr_ratings[table] = res.rows;
            }

            return result;
        } catch (error: any) {
            console.error("Error in getSupplierDqrDetailsService:", error.message);
            throw new Error(error.message);
        }
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

