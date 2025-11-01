import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';
import { createDqrRatingService, getSupplierDqrDetailsService } from "../services/dqrRatingService";

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

export async function createDqrRating(req: any, res: any) {
    try {
        const { type, ...ratingData } = req.body;

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

        const inserted = await createDqrRatingService(type, records, created_by, code);

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
