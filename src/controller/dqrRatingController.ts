import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';
import { createDqrRatingService, getSupplierDqrDetailsService, updateDqrRatingService } from "../services/dqrRatingService";

const ALLOWED_TYPES = [
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

export async function createDqrRating(req: any, res: any) {
    try {
        const { type, bom_pcf_id, ...ratingData } = req.body;

        // ✅ Validate type
        if (!type || !ALLOWED_TYPES.includes(type)) {
            return res
                .status(400)
                .json(generateResponse(false, "Invalid or missing rating type", 400, { allowed_types: ALLOWED_TYPES }));
        }

        if (!ratingData[type] || !Array.isArray(ratingData[type]) || ratingData[type].length === 0) {
            return res
                .status(400)
                .json(generateResponse(false, `Missing or invalid data for ${type}`, 400, null));
        }

        const created_by = req.user_id || "system";
        const code = "DQR-" + Date.now();
        const records = ratingData[type];

        const inserted = await createDqrRatingService(type, records, created_by, code,bom_pcf_id);

        return res
            .status(200)
            .json(generateResponse(true, `${type} inserted successfully`, 200, inserted));
    } catch (error: any) {
        console.error("❌ Error in createDqrRating:", error.message);
        return res
            .status(500)
            .json(generateResponse(false, "Something went wrong", 500, error.message));
    }
}

export async function getSupplierDqrDetailsById(req: any, res: any) {
    try {
        const { sgiq_id } = req.query;

        if (!sgiq_id) {
            return res
                .status(400)
                .json(generateResponse(false, "sgiq_id is required", 400, null));
        }

        const data = await getSupplierDqrDetailsService(sgiq_id);

        if (!data) {
            return res
                .status(404)
                .json(generateResponse(false, "No data found for given sgiq_id", 404, null));
        }

        return res
            .status(200)
            .json(generateResponse(true, "Fetched successfully", 200, data));
    } catch (error: any) {
        console.error("❌ Error in getSupplierDqrDetailsById:", error.message);
        return res
            .status(500)
            .json(generateResponse(false, "Something went wrong", 500, error.message));
    }
}

export async function getSupplierDetailsList(req: any, res: any) {
    const { pageNumber, pageSize } = req.query;

    const limit = parseInt(pageSize) || 20;
    const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {

            const query = `
        SELECT 
          gq.*,
          u.user_name AS created_by_name
        FROM supplier_general_info_questions gq
        LEFT JOIN users_table u ON gq.user_id = u.user_id
        ORDER BY gq.created_date DESC
        LIMIT $1 OFFSET $2;
      `;

            const countQuery = `
        SELECT COUNT(*) AS total_count
        FROM supplier_general_info_questions;
      `;

            const [result, countResult] = await Promise.all([
                client.query(query, [limit, offset]),
                client.query(countQuery)
            ]);

            const rows = result.rows;


            for (const supplier of rows) {
                const sgiq_id = supplier.sgiq_id;

                const supplier_questions: any = {};

                // --- Supplier Question Tables ---
                for (const table of QUESTION_TABLES) {
                    const res = await client.query(
                        `SELECT * FROM ${table} WHERE sgiq_id = $1`,
                        [sgiq_id]
                    );
                    supplier_questions[table] = res.rows;
                }

                supplier.supplier_questions = supplier_questions;
            }

            // Pagination metadata
            const totalCount = parseInt(countResult.rows[0]?.total_count ?? 0);
            const totalPages = Math.ceil(totalCount / limit);

            return res.status(200).json({
                success: true,
                message: "Supplier Question Details List fetched successfully",
                data: rows,
                current_page: page,
                total_pages: totalPages,
                total_count: totalCount
            });
        } catch (error: any) {
            console.error("Error fetching Supplier Question Details List:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Question Details List"
            });
        }
    });
}

export async function updateDqrRating(req: any, res: any) {
    try {
        const { type, ...ratingData } = req.body;

        // ✅ Validate type
        if (!type || !ALLOWED_TYPES.includes(type)) {
            return res.status(400).json(
                generateResponse(false, "Invalid or missing rating type", 400, {
                    allowed_types: ALLOWED_TYPES,
                })
            );
        }

        const records = ratingData[type];
        if (!records || !Array.isArray(records) || records.length === 0) {
            return res
                .status(400)
                .json(generateResponse(false, `Missing or invalid data for ${type}`, 400, null));
        }

        const updated_by = req.user_id || "system";
        const updated = await updateDqrRatingService(type, records, updated_by);

        return res
            .status(200)
            .json(generateResponse(true, `${type} updated successfully`, 200, updated));
    } catch (error: any) {
        console.error("❌ Error in updateDqrRating:", error.message);
        return res
            .status(500)
            .json(generateResponse(false, "Something went wrong", 500, error.message));
    }
}

