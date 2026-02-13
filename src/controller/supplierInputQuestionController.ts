import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';
import { updateSupplierSustainabilityService } from '../services/supplierInputQuetionService';

export async function getSupplierSustainabilityDataById(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { sgiq_id, user_id } = req.query;

            if (!sgiq_id || !user_id) {
                return res.send(generateResponse(false, "sgiq_id and user_id are required", 400, null));
            }

            const result: any = {};

            // ============================================================
            // 1️⃣ FETCH GENERAL INFO
            // ============================================================
            const generalInfoQuery = `
                SELECT gq.*, u.user_name
                FROM supplier_general_info_questions gq
                LEFT JOIN users_table u ON gq.user_id = u.user_id
                WHERE gq.sgiq_id = $1 AND gq.user_id = $2 AND gq.own_emission_id IS NULL
            `;
            const generalInfo = await client.query(generalInfoQuery, [sgiq_id, user_id]);

            if (!generalInfo.rows.length) {
                return res.send(generateResponse(false, "Supplier not found", 404, null));
            }

            result["supplier_general_info_questions"] = generalInfo.rows[0];

            // ============================================================
            // 2️⃣ FETCH MATERIAL COMPOSITION (with enrichment)
            // ============================================================
            const mcQuery = `
                SELECT *
                FROM material_composition_questions
                WHERE sgiq_id = $1
            `;
            const mcRes = await client.query(mcQuery, [sgiq_id]);

            if (mcRes.rows.length) {
                const mc = mcRes.rows[0];

                // Expand JSONB[] with details
                if (Array.isArray(mc.main_raw_materials_used)) {
                    for (let item of mc.main_raw_materials_used) {
                        // Fetch metal type details (MCMT)
                        const mcmt = await client.query(
                            `SELECT mcmt_id, code, name 
                             FROM material_composition_metal_type 
                             WHERE mcmt_id = $1`,
                            [item.mcmt_id]
                        );

                        // Fetch metal details (MCM)
                        const mcm = await client.query(
                            `SELECT mcm_id, code, name 
                             FROM material_composition_metals
                             WHERE mcm_id = $1`,
                            [item.mcm_id]
                        );

                        item.mcmt_details = mcmt.rows[0] || null;
                        item.mcm_details = mcm.rows[0] || null;
                    }
                }

                result["material_composition_questions"] = mc;
            }


            // ============================================================
            // 3️⃣ FETCH TRANSPORTATION LOGISTICS (with lookup)
            // ============================================================
            const tlQuery = `
                SELECT *
                FROM transportation_logistics_questions
                WHERE sgiq_id = $1
            `;
            const tlRes = await client.query(tlQuery, [sgiq_id]);

            if (tlRes.rows.length) {
                const tl = tlRes.rows[0];

                // ------- Expand transport_modes_used (ids -> full objects) ------
                if (Array.isArray(tl.transport_modes_used)) {
                    const expandedModes = [];
                    for (let id of tl.transport_modes_used) {
                        const data = await client.query(
                            `SELECT id, code, name FROM transport_mode WHERE id = $1`,
                            [id]
                        );
                        expandedModes.push(data.rows[0] || { id, code: null, name: null });
                    }
                    tl.transport_modes_used_details = expandedModes;
                }

                // ------- Expand fuel type list (ids -> full objects) ------
                if (Array.isArray(tl.transport_modes_fuel_used)) {
                    const expandedFuel = [];
                    for (let id of tl.transport_modes_fuel_used) {
                        const data = await client.query(
                            `SELECT id, code, name FROM fuel_type WHERE id = $1`,
                            [id]
                        );
                        expandedFuel.push(data.rows[0] || { id, code: null, name: null });
                    }
                    tl.transport_modes_fuel_used_details = expandedFuel;
                }

                result["transportation_logistics_questions"] = tl;
            }


            // ============================================================
            // 4️⃣ FETCH REMAINING QUESTION TABLES (simple)
            // ============================================================
            const OTHER_TABLES = [
                "energy_manufacturing_questions",
                "packaging_questions",
                "waste_by_products_questions",
                "end_of_life_circularity_questions",
                "emission_factors_or_lca_data_questions",
                "certification_and_standards_questions",
                "additional_notes_questions"
            ];

            for (const table of OTHER_TABLES) {
                const tableRes = await client.query(`SELECT * FROM ${table} WHERE sgiq_id = $1`, [sgiq_id]);
                result[table] = tableRes.rows;
            }

            // ============================================================
            // 5️⃣ SEND RESPONSE
            // ============================================================
            return res.send(
                generateResponse(true, "Supplier sustainability data fetched successfully", 200, result)
            );

        } catch (error: any) {
            console.error("❌ Error in getSupplierSustainabilityDataById:", error);
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// export async function getSupplierDetailsList(req: any, res: any) {
//     const { pageNumber, pageSize } = req.query;

//     const limit = parseInt(pageSize) || 20;
//     const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
//     const offset = (page - 1) * limit;

//     return withClient(async (client: any) => {
//         try {

//             const query = `
//         SELECT 
//           gq.*,
//           u.user_name AS created_by_name
//         FROM supplier_general_info_questions gq
//         LEFT JOIN users_table u ON gq.user_id = u.user_id
//         ORDER BY gq.created_date DESC
//         LIMIT $1 OFFSET $2;
//       `;

//             const countQuery = `
//         SELECT COUNT(*) AS total_count
//         FROM supplier_general_info_questions;
//       `;

//             const [result, countResult] = await Promise.all([
//                 client.query(query, [limit, offset]),
//                 client.query(countQuery)
//             ]);

//             const rows = result.rows;


//             // for (const supplier of rows) {
//             //     const sgiq_id = supplier.sgiq_id;

//             //     const supplier_questions: any = {};

//             //     // --- Supplier Question Tables ---
//             //     for (const table of QUESTION_TABLES) {
//             //         const res = await client.query(
//             //             `SELECT * FROM ${table} WHERE sgiq_id = $1`,
//             //             [sgiq_id]
//             //         );
//             //         supplier_questions[table] = res.rows;
//             //     }

//             //     supplier.supplier_questions = supplier_questions;
//             // }

//             // Pagination metadata

//             const totalCount = parseInt(countResult.rows[0]?.total_count ?? 0);
//             const totalPages = Math.ceil(totalCount / limit);

//             return res.status(200).json({
//                 success: true,
//                 message: "Supplier Question Details List fetched successfully",
//                 data: rows,
//                 current_page: page,
//                 total_pages: totalPages,
//                 total_count: totalCount
//             });
//         } catch (error: any) {
//             console.error("Error fetching Supplier Question Details List:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message || "Failed to fetch Supplier Question Details List"
//             });
//         }
//     });
// }

// export async function updateSupplierSustainabilityData(req: any, res: any) {
//     return withClient(async (client: any) => {
//         await client.query("BEGIN");

//         try {
//             const {
//                 sgiq_id,
//                 general_info,
//                 material_composition,
//                 energy_manufacturing,
//                 packaging,
//                 transportation_logistics,
//                 waste_by_products,
//                 end_of_life_circularity,
//                 emission_factors,
//                 certification_standards,
//                 additional_notes
//             } = req.body;

//             if (!sgiq_id) {
//                 throw new Error("sgiq_id is required");
//             }

//             const updated_by = req.user_id;

//             // --- UPDATE GENERAL INFO ---
//             if (general_info) {
//                 const updateGeneral = `
//                     UPDATE supplier_general_info_questions
//                     SET 
//                         name_of_organization = $1,
//                         core_business_activities = $2,
//                         company_site_address = $3,
//                         designation = $4,
//                         email_address = $5,
//                         type_of_product_manufacture = $6,
//                         annul_or_monthly_product_volume_of_product = $7,
//                         weight_of_product = $8,
//                         where_production_site_product_manufactured = $9,
//                         price_of_product = $10,
//                         organization_annual_revenue = $11,
//                         organization_annual_reporting_period = $12,
//                         updated_by = $13,
//                         update_date = NOW()
//                     WHERE sgiq_id = $14
//                     RETURNING *;
//                 `;

//                 await client.query(updateGeneral, [
//                     general_info.name_of_organization,
//                     general_info.core_business_activities,
//                     general_info.company_site_address,
//                     general_info.designation,
//                     general_info.email_address,
//                     general_info.type_of_product_manufacture,
//                     general_info.annul_or_monthly_product_volume_of_product,
//                     general_info.weight_of_product,
//                     general_info.where_production_site_product_manufactured,
//                     general_info.price_of_product,
//                     general_info.organization_annual_revenue,
//                     general_info.organization_annual_reporting_period,
//                     updated_by,
//                     sgiq_id
//                 ]);
//             }

//             // --- MATERIAL COMPOSITION ---
//             if (material_composition) {

//                 await client.query(`
//     UPDATE material_composition_questions
//     SET
//         main_raw_materials_used = $1,
//         contact_enviguide_support = $2,
//         has_recycled_material_usage = $3,
//         percentage_recycled_material = $4,
//         knows_material_breakdown = $5,
//         percentage_pre_consumer = $6,
//         percentage_post_consumer = $7,
//         percentage_reutilization = $8,
//         has_recycled_copper = $9,
//         percentage_recycled_copper = $10,
//         has_recycled_aluminum = $11,
//         percentage_recycled_aluminum = $12,
//         has_recycled_steel = $13,
//         percentage_recycled_steel = $14,
//         has_recycled_plastics = $15,
//         percentage_total_recycled_plastics = $16,
//         percentage_recycled_thermoplastics = $17,
//         percentage_recycled_plastic_fillers = $18,
//         percentage_recycled_fibers = $19,
//         has_recycling_process = $20,
//         has_future_recycling_strategy = $21,
//         planned_recycling_year = $22,
//         track_transport_emissions = $23,
//         estimated_transport_emissions = $24,
//         need_support_for_emissions_calc = $25,
//         emission_calc_requirement = $26,
//         percentage_pcr = $27,
//         percentage_pir = $28,
//         use_bio_based_materials = $29,
//         bio_based_material_details = $30,
//         msds_or_composition_link = $31,
//         main_alloy_metals = $32,
//         metal_grade = $33,
//         updated_by = $34,
//         total_weight_of_all_component_at_factory = $36,
//         update_date = NOW()
//     WHERE sgiq_id = $35;
// `, [
//                     JSON.stringify(material_composition.main_raw_materials_used),  // FIX HERE
//                     material_composition.contact_enviguide_support,
//                     material_composition.has_recycled_material_usage,
//                     material_composition.percentage_recycled_material,
//                     material_composition.knows_material_breakdown,
//                     material_composition.percentage_pre_consumer,
//                     material_composition.percentage_post_consumer,
//                     material_composition.percentage_reutilization,
//                     material_composition.has_recycled_copper,
//                     material_composition.percentage_recycled_copper,
//                     material_composition.has_recycled_aluminum,
//                     material_composition.percentage_recycled_aluminum,
//                     material_composition.has_recycled_steel,
//                     material_composition.percentage_recycled_steel,
//                     material_composition.has_recycled_plastics,
//                     material_composition.percentage_total_recycled_plastics,
//                     material_composition.percentage_recycled_thermoplastics,
//                     material_composition.percentage_recycled_plastic_fillers,
//                     material_composition.percentage_recycled_fibers,
//                     material_composition.has_recycling_process,
//                     material_composition.has_future_recycling_strategy,
//                     material_composition.planned_recycling_year,
//                     material_composition.track_transport_emissions,
//                     material_composition.estimated_transport_emissions,
//                     material_composition.need_support_for_emissions_calc,
//                     material_composition.emission_calc_requirement,
//                     material_composition.percentage_pcr,
//                     material_composition.percentage_pir,
//                     material_composition.use_bio_based_materials,
//                     material_composition.bio_based_material_details,
//                     material_composition.msds_or_composition_link,
//                     material_composition.main_alloy_metals,
//                     material_composition.metal_grade,
//                     updated_by,
//                     sgiq_id,
//                     JSON.stringify(material_composition.total_weight_of_all_component_at_factory) // also jsonb
//                 ]);

//             }

//             // if (material_composition) {
//             //     await client.query(`
//             //         UPDATE material_composition_questions
//             //         SET
//             //             main_raw_materials_used = $1,
//             //             contact_enviguide_support = $2,
//             //             has_recycled_material_usage = $3,
//             //             percentage_recycled_material = $4,
//             //             knows_material_breakdown = $5,
//             //             percentage_pre_consumer = $6,
//             //             percentage_post_consumer = $7,
//             //             percentage_reutilization = $8,
//             //             has_recycled_copper = $9,
//             //             percentage_recycled_copper = $10,
//             //             has_recycled_aluminum = $11,
//             //             percentage_recycled_aluminum = $12,
//             //             has_recycled_steel = $13,
//             //             percentage_recycled_steel = $14,
//             //             has_recycled_plastics = $15,
//             //             percentage_total_recycled_plastics = $16,
//             //             percentage_recycled_thermoplastics = $17,
//             //             percentage_recycled_plastic_fillers = $18,
//             //             percentage_recycled_fibers = $19,
//             //             has_recycling_process = $20,
//             //             has_future_recycling_strategy = $21,
//             //             planned_recycling_year = $22,
//             //             track_transport_emissions = $23,
//             //             estimated_transport_emissions = $24,
//             //             need_support_for_emissions_calc = $25,
//             //             emission_calc_requirement = $26,
//             //             percentage_pcr = $27,
//             //             percentage_pir = $28,
//             //             use_bio_based_materials = $29,
//             //             bio_based_material_details = $30,
//             //             msds_or_composition_link = $31,
//             //             main_alloy_metals = $32,
//             //             metal_grade = $33,
//             //             updated_by = $34,
//             //             total_weight_of_all_component_at_factory = $36,
//             //             update_date = NOW()
//             //         WHERE sgiq_id = $35;
//             //     `, [
//             //         ...Object.values(material_composition),
//             //         updated_by,
//             //         sgiq_id
//             //     ]);
//             // }

//             // --- ENERGY MANUFACTURING ---
//             if (energy_manufacturing) {
//                 await client.query(`
//                     UPDATE energy_manufacturing_questions
//                     SET
//                         energy_sources_used = $1,
//                         electricity_consumption_per_year = $2,
//                         purchases_renewable_electricity = $3,
//                         renewable_electricity_percentage = $4,
//                         has_energy_calculation_method = $5,
//                         energy_calculation_method_details = $6,
//                         energy_intensity_per_unit = $7,
//                         process_specific_energy_usage = $8,
//                         enviguide_support = $9,
//                         uses_abatement_systems = $10,
//                         abatement_system_energy_consumption = $11,
//                         water_consumption_and_treatment_details = $12,
//                         updated_by = $13,
//                         update_date = NOW()
//                     WHERE sgiq_id = $14;
//                 `, [
//                     ...Object.values(energy_manufacturing),
//                     updated_by,
//                     sgiq_id
//                 ]);
//             }

//             // --- PACKAGING ---
//             if (packaging) {
//                 await client.query(`
//                     UPDATE packaging_questions
//                     SET
//                         packaging_materials_used = $1,
//                         enviguide_support = $2,
//                         packaging_weight_per_unit = $3,
//                         packaging_size = $4,
//                         uses_recycled_packaging = $5,
//                         recycled_packaging_percentage = $6,
//                         updated_by = $7,
//                         update_date = NOW()
//                     WHERE sgiq_id = $8;
//                 `, [
//                     ...Object.values(packaging),
//                     updated_by,
//                     sgiq_id
//                 ]);
//             }

//             // --- TRANSPORTATION ---
//             if (transportation_logistics) {
//                 // await client.query(`
//                 //     UPDATE transportation_logistics_questions
//                 //     SET
//                 //         transport_modes_used = $1,
//                 //         enviguide_support = $2,
//                 //         uses_certified_logistics_provider = $3,
//                 //         logistics_provider_details = $4,
//                 //         updated_by = $5,
//                 //         mass_weight_of_component_transported_kg = $7,
//                 //         transport_modes_fuel_used= $8,
//                 //         designation_of_goods_transported= $9,
//                 //         distance_of_goods_transported= $10,
//                 //         update_date = NOW()
//                 //     WHERE sgiq_id = $6;
//                 // `, [
//                 //     ...Object.values(transportation_logistics),
//                 //     updated_by,
//                 //     sgiq_id
//                 // ]);
//                 if (transportation_logistics) {
//                     await client.query(`
//         UPDATE transportation_logistics_questions
//         SET
//             transport_modes_used = $1,
//             enviguide_support = $2,
//             uses_certified_logistics_provider = $3,
//             logistics_provider_details = $4,
//             updated_by = $5,
//             mass_weight_of_component_transported_kg = $6,
//             transport_modes_fuel_used = $7,
//             designation_of_goods_transported = $8,
//             distance_of_goods_transported = $9,
//             update_date = NOW()
//         WHERE sgiq_id = $10;
//     `, [
//                         transportation_logistics.transport_modes_used,         // $1 (TEXT[])
//                         transportation_logistics.enviguide_support,            // $2
//                         transportation_logistics.uses_certified_logistics_provider, // $3
//                         transportation_logistics.logistics_provider_details,   // $4 (TEXT[])
//                         updated_by,                                            // $5
//                         transportation_logistics.mass_weight_of_component_transported_kg, // $6
//                         transportation_logistics.transport_modes_fuel_used,    // $7 (TEXT[])
//                         transportation_logistics.designation_of_goods_transported, // $8
//                         transportation_logistics.distance_of_goods_transported, // $9
//                         sgiq_id                                                // $10
//                     ]);
//                 }

//             }

//             // --- WASTE BY PRODUCTS ---
//             if (waste_by_products) {
//                 await client.query(`
//                     UPDATE waste_by_products_questions
//                     SET
//                         waste_types_generated = $1,
//                         waste_treatment_methods = $2,
//                         recycling_percentage = $3,
//                         has_byproducts = $4,
//                         byproduct_types = $5,
//                         byproduct_quantity = $6,
//                         byproduct_price = $7,
//                         updated_by = $8,
//                         update_date = NOW()
//                     WHERE sgiq_id = $9;
//                 `, [
//                     ...Object.values(waste_by_products),
//                     updated_by,
//                     sgiq_id
//                 ]);
//             }

//             // --- END OF LIFE / CIRCULARITY ---
//             if (end_of_life_circularity) {
//                 await client.query(`
//                     UPDATE end_of_life_circularity_questions
//                     SET
//                         product_designed_for_recycling = $1,
//                         product_recycling_details = $2,
//                         has_takeback_program = $3,
//                         takeback_program_details = $4,
//                         updated_by = $5,
//                         update_date = NOW()
//                     WHERE sgiq_id = $6;
//                 `, [
//                     ...Object.values(end_of_life_circularity),
//                     updated_by,
//                     sgiq_id
//                 ]);
//             }

//             // --- EMISSION FACTORS ---
//             if (emission_factors) {
//                 await client.query(`
//                     UPDATE emission_factors_or_lca_data_questions
//                     SET
//                         reports_product_carbon_footprint = $1,
//                         pcf_methodologies_used = $2,
//                         has_scope_emission_data = $3,
//                         emission_data_details = $4,
//                         required_environmental_impact_methods = $5,
//                         updated_by = $6,
//                         update_date = NOW()
//                     WHERE sgiq_id = $7;
//                 `, [
//                     ...Object.values(emission_factors),
//                     updated_by,
//                     sgiq_id
//                 ]);
//             }

//             // --- CERTIFICATION ---
//             if (certification_standards) {
//                 await client.query(`
//                     UPDATE certification_and_standards_questions
//                     SET
//                         certified_iso_environmental_or_energy = $1,
//                         follows_recognized_standards = $2,
//                         reports_to_esg_frameworks = $3,
//                         previous_reports = $4,
//                         updated_by = $5,
//                         update_date = NOW()
//                     WHERE sgiq_id = $6;
//                 `, [
//                     ...Object.values(certification_standards),
//                     updated_by,
//                     sgiq_id
//                 ]);
//             }

//             // --- ADDITIONAL NOTES ---
//             if (additional_notes) {
//                 await client.query(`
//                     UPDATE additional_notes_questions
//                     SET
//                         carbon_reduction_measures = $1,
//                         renewable_energy_or_recycling_programs = $2,
//                         willing_to_provide_primary_data = $3,
//                         primary_data_details = $4,
//                         updated_by = $5,
//                         update_date = NOW()
//                     WHERE sgiq_id = $6;
//                 `, [
//                     ...Object.values(additional_notes),
//                     updated_by,
//                     sgiq_id
//                 ]);
//             }

//             await client.query("COMMIT");

//             return res.send(
//                 generateResponse(true, "Supplier sustainability data updated successfully", 200, { sgiq_id })
//             );
//         } catch (error: any) {
//             await client.query("ROLLBACK");
//             console.error("❌ Update Error:", error);
//             return res.send(generateResponse(false, error.message, 400, null));
//         }
//     });
// }

export async function getMaterialCompositionMetal(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT mcm_id, code, name, description FROM material_composition_metals;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getMaterialCompositionMetalType(req: any, res: any) {
    const { mcm_id } = req.query;

    return withClient(async (client: any) => {
        try {
            const query = `
                SELECT 
                    mcmt.mcmt_id AS mcmt_id,
                    mcmt.code AS mcmt_code,
                    mcmt.name AS mcmt_name,
                    mcmt.description AS mcmt_description,

                    mcm.mcm_id AS mcm_id,
                    mcm.code AS mcm_code,
                    mcm.name AS mcm_name,
                    mcm.description AS mcm_description

                FROM material_composition_metal_type mcmt
                LEFT JOIN material_composition_metals mcm 
                    ON mcm.mcm_id = mcmt.mcm_id
                WHERE mcmt.mcm_id = $1;
            `;

            const result = await client.query(query, [mcm_id]);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// FRom here start for creation of supplier input and dqr rating
// ========== New apis========

// UNIVERSAL BULK INSERT HELPER
async function bulkInsert(client: any, tableName: string, columns: string[], rows: any[][]) {
    try {
        if (!rows || rows.length === 0) return;

        const values: any[] = [];
        const placeholders: string[] = [];
        let index = 1;

        for (const row of rows) {
            const rowPlaceholders = row.map(() => `$${index++}`).join(', ');
            placeholders.push(`(${rowPlaceholders})`);
            values.push(...row);
        }

        const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES ${placeholders.join(', ')}
    `;

        // ✅ ADD DETAILED LOGGING
        console.log(`📊 Bulk Insert into ${tableName}:`, {
            columns,
            rowCount: rows.length,
            sampleRow: rows[0],
            query: query.substring(0, 200) + '...',
        });

        await client.query(query, values);
        console.log(`✅ Successfully inserted ${rows.length} rows into ${tableName}`);
    } catch (error: any) {
        // ✅ LOG THE ACTUAL ERROR DETAILS
        console.error(`❌ BULK INSERT FAILED for table: ${tableName}`);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint,
            table: error.table,
            column: error.column,
            dataType: error.dataType
        });
        console.error('Columns:', columns);
        console.error('First row data:', rows[0]);
        console.error('Values being inserted:', rows);

        throw error; // Re-throw to trigger rollback
    }
}

// MAIN API FUNCTION
export async function addSupplierSustainabilityData(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query("BEGIN");

        try {
            const {
                supplier_general_info_questions,
                supplier_product_questions,
                scope_one_direct_emissions_questions,
                scope_two_indirect_emissions_questions,
                scope_three_other_indirect_emissions_questions,
                scope_four_avoided_emissions_questions
            } = req.body;

            // Validation
            if (!supplier_general_info_questions?.bom_pcf_id ||
                !supplier_general_info_questions?.sup_id) {
                return res.send(generateResponse(false, "bom_pcf_id and sup_id are required", 400, null));
            }

            const sup_id = supplier_general_info_questions.sup_id;
            const bom_pcf_id = supplier_general_info_questions.bom_pcf_id;
            const bom_id = supplier_general_info_questions.bom_id;
            const sgiq_id = ulid();
            const annual_reporting_period = supplier_general_info_questions.annual_reporting_period;
            const allDQRConfigs: any[] = [];

            scope_two_indirect_emissions_questions.sup_id = sup_id;

            // ============================================
            // STEP 1: Insert General Info (REQUIRED FIRST)
            // ============================================
            const generalInsert = `
                INSERT INTO supplier_general_info_questions (
                    sgiq_id, bom_pcf_id, ere_acknowledge, repm_acknowledge, dc_acknowledge,
                    organization_name, core_business_activitiy, specify_other_activity, designation,
                    email_address, no_of_employees, specify_other_no_of_employees, annual_revenue,
                    specify_other_annual_revenue, annual_reporting_period, 
                    availability_of_scope_one_two_three_emissions_data, sup_id
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
                RETURNING *;
            `;

            const generalResult = await client.query(generalInsert, [
                sgiq_id, bom_pcf_id,
                supplier_general_info_questions.ere_acknowledge ?? false,
                supplier_general_info_questions.repm_acknowledge ?? false,
                supplier_general_info_questions.dc_acknowledge ?? false,
                supplier_general_info_questions.organization_name,
                supplier_general_info_questions.core_business_activitiy,
                supplier_general_info_questions.specify_other_activity,
                supplier_general_info_questions.designation,
                supplier_general_info_questions.email_address,
                supplier_general_info_questions.no_of_employees,
                supplier_general_info_questions.specify_other_no_of_employees,
                supplier_general_info_questions.annual_revenue,
                supplier_general_info_questions.specify_other_annual_revenue,
                supplier_general_info_questions.annual_reporting_period,
                supplier_general_info_questions.availability_of_scope_one_two_three_emissions_data ?? false,
                sup_id
            ]);

            // Insert scope questions (nested in general info) - BULK
            const scopeGeneralQuestions = supplier_general_info_questions.availability_of_scope_one_two_three_emissions_questions;
            if (Array.isArray(scopeGeneralQuestions) && scopeGeneralQuestions.length > 0) {
                const dqrRecordsNine: any[] = [];

                const insertRows = scopeGeneralQuestions.map(scope => {
                    const aosotte_id = ulid(); // Unique ID for each

                    // Store for DQR
                    dqrRecordsNine.push({
                        childId: aosotte_id,
                        data: {
                            country_iso_three: scope.country_iso_three,
                            scope_one: scope.scope_one,
                            scope_two: scope.scope_two,
                            scope_three: scope.scope_three
                        }
                    });

                    // Return row for bulk insert
                    return [aosotte_id, sgiq_id, scope.country_iso_three, scope.scope_one, scope.scope_two, scope.scope_three];
                });

                // Bulk insert
                await bulkInsert(
                    client,
                    'availability_of_scope_one_two_three_emissions_questions',
                    ['aosotte_id', 'sgiq_id', 'country_iso_three', 'scope_one', 'scope_two', 'scope_three'],
                    insertRows
                );

                // Add to DQR configs
                allDQRConfigs.push({
                    tableName: 'dqr_emission_data_rating_qnine',
                    columns: ['edrqn_id', 'sgiq_id', 'aosotte_id', 'data'],
                    parentId: sgiq_id,
                    records: dqrRecordsNine
                });


            }

            // ============================================
            // STEP 2: Process all sections IN PARALLEL
            // ============================================
            const insertPromises = [];

            // SUPPLIER PRODUCT QUESTIONS
            if (supplier_product_questions) {
                insertPromises.push(insertSupplierProduct(client, supplier_product_questions, sgiq_id));
            }

            // SCOPE ONE
            if (scope_one_direct_emissions_questions) {
                insertPromises.push(insertScopeOne(client, scope_one_direct_emissions_questions, sgiq_id));
            }

            // SCOPE TWO
            if (scope_two_indirect_emissions_questions) {
                insertPromises.push(insertScopeTwo(client, scope_two_indirect_emissions_questions, sgiq_id, annual_reporting_period));
            }

            // SCOPE THREE
            if (scope_three_other_indirect_emissions_questions) {
                insertPromises.push(insertScopeThree(client, scope_three_other_indirect_emissions_questions, sgiq_id, annual_reporting_period));
            }

            // SCOPE FOUR
            if (scope_four_avoided_emissions_questions) {
                insertPromises.push(insertScopeFour(client, scope_four_avoided_emissions_questions, sgiq_id));
            }

            // Execute all inserts in parallel
            await Promise.all(insertPromises);

            // ============================================
            // STEP 3: Update PCF stages
            // ============================================

            // await client.query(
            //     `UPDATE pcf_request_stages SET is_data_collected = true WHERE bom_pcf_id = $1;`,
            //     [bom_pcf_id]
            // );

            await client.query(
                `UPDATE pcf_request_data_collection_stage SET is_submitted = true,completed_date=NOW()
                 WHERE bom_pcf_id = $1 AND sup_id=$2;`,
                [bom_pcf_id, sup_id]
            );

            console.log(`Creating ${allDQRConfigs.length} DQR table entries...`);
            await createDQRRecords(client, allDQRConfigs);

            await client.query("COMMIT");

            return res.send(
                generateResponse(true, "Supplier sustainability data added successfully", 200,
                    "Supplier sustainability data added successfully")
            );
        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("Error adding supplier sustainability data:", error);
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// HELPER FUNCTIONS - Each section in separate function
// async function insertSupplierProduct(client: any, data: any, sgiq_id: string) {
//     const spq_id = ulid();
//     const dqrQ11: any[] = [];
//     const allDQRConfigs: any[] = [];

//     // Insert parent
//     await client.query(
//         `INSERT INTO supplier_product_questions (
//             spq_id, sgiq_id, do_you_have_an_existing_pcf_report, pcf_methodology_used,
//             upload_pcf_report, required_environmental_impact_methods, any_co_product_have_economic_value
//         ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
//         [spq_id, sgiq_id, data.do_you_have_an_existing_pcf_report, data.pcf_methodology_used,
//             data.upload_pcf_report, data.required_environmental_impact_methods, data.any_co_product_have_economic_value]
//     );

//     // Q11
//     dqrQ11.push({
//         childId: spq_id,
//         data: data.pcf_methodology_used
//     });
//     allDQRConfigs.push({
//         tableName: 'dqr_supplier_product_questions_rating_qeleven',
//         columns: ['spqrqe_id', 'sgiq_id', 'spq_id', 'data'],
//         parentId: sgiq_id,
//         records: dqrQ11
//     });

//     const dqrQ12: any[] = [];
//     // Q12
//     dqrQ12.push({
//         childId: spq_id,
//         data: data.upload_pcf_report
//     });
//     allDQRConfigs.push({
//         tableName: 'dqr_supplier_product_questions_rating_qtwelve',
//         columns: ['spqrqt_id', 'sgiq_id', 'spq_id', 'data'],
//         parentId: sgiq_id,
//         records: dqrQ12
//     });

//     const childInserts = [];

//     // Production site details - BULK
//     if (Array.isArray(data.production_site_details_questions) && data.production_site_details_questions.length > 0) {

//         const dqrQ13: any[] = [];
//         // Q13
//         const insertRows = data.production_site_details_questions.map((p: any) => {
//             const psd_id = ulid(); // correct child id

//             // Store DQR data
//             dqrQ13.push({
//                 childId: psd_id,
//                 data: {
//                     bom_id: p.bom_id,
//                     material_number: p.material_number,
//                     product_name: p.product_name,
//                     location: p.location
//                 }
//             });

//             // Row for bulk insert
//             return [psd_id, spq_id, p.bom_id, p.material_number, p.product_name, p.location];
//         });

//         childInserts.push(bulkInsert(
//             client,
//             'production_site_details_questions',
//             ['psd_id', 'spq_id', 'bom_id', 'material_number', 'product_name', 'location'],
//             insertRows
//         ));

//         allDQRConfigs.push({
//             tableName: 'dqr_production_site_detail_rating_qthirteen',
//             columns: ['psdrqt_id', 'sgiq_id', 'psd_id', 'data'],
//             parentId: sgiq_id,
//             records: dqrQ13
//         });
//     }

//     // Product component manufactured - BULK
//     if (Array.isArray(data.product_component_manufactured_questions) && data.product_component_manufactured_questions.length > 0) {
//         const dqrQ15: any[] = [];

//         // Q15
//         const insertRows = data.product_component_manufactured_questions.map((p: any) => {
//             const pcm_id = ulid(); //unique child id

//             // Store DQR payload
//             dqrQ15.push({
//                 childId: pcm_id,
//                 data: {
//                     bom_id: p.bom_id,
//                     material_number: p.material_number,
//                     product_name: p.product_name,
//                     production_period: p.production_period,
//                     weight_per_unit: p.weight_per_unit,
//                     unit: p.unit,
//                     price: p.price,
//                     quantity: p.quantity
//                 }
//             });

//             // Return row for bulk insert
//             return [
//                 pcm_id, spq_id, p.bom_id, p.material_number, p.product_name, p.production_period, p.weight_per_unit, p.unit, p.price, p.quantity
//             ];
//         });


//         childInserts.push(bulkInsert(
//             client,
//             'product_component_manufactured_questions',
//             ['pcm_id', 'spq_id', 'bom_id', 'material_number', 'product_name', 'production_period', 'weight_per_unit', 'unit', 'price', 'quantity'],
//             insertRows
//             // data.product_component_manufactured_questions.map((p: any) =>
//             //     [ulid(), spq_id, p.product_name, p.production_period, p.weight_per_unit, p.unit, p.price, p.quantity]
//             // )
//         ));

//         allDQRConfigs.push({
//             tableName: 'dqr_product_component_manufactured_rating_qfiften',
//             columns: ['pcmrqf_id', 'sgiq_id', 'pcm_id', 'data'],
//             parentId: sgiq_id,
//             records: dqrQ15
//         });
//     }

//     // Co-product component - BULK
//     if (Array.isArray(data.co_product_component_economic_value_questions) && data.co_product_component_economic_value_questions.length > 0) {
//         const dqrQ15Point2: any[] = [];
//         const bomGroups: Record<string, any[]> = {};
//         // Q15
//         const insertRows = data.co_product_component_economic_value_questions.map((p: any) => {
//             const cpcev_id = ulid(); //unique child id

//             // Store DQR payload
//             dqrQ15Point2.push({
//                 childId: cpcev_id,
//                 data: {
//                     bom_id: p.bom_id,
//                     material_number: p.material_number,
//                     product_name: p.product_name,
//                     co_product_name: p.co_product_name,
//                     weight: p.weight,
//                     price_per_product: p.price_per_product,
//                     quantity: p.quantity
//                 }
//             });

//             if (!bomGroups[p.bom_id]) bomGroups[p.bom_id] = [];
//             bomGroups[p.bom_id].push(p);

//             // Return row for bulk insert
//             return [
//                 cpcev_id, spq_id, p.bom_id, p.material_number, p.product_name, p.co_product_name, p.weight, p.price_per_product, p.quantity
//             ];
//         });


//         childInserts.push(bulkInsert(
//             client,
//             'co_product_component_economic_value_questions',
//             ['cpcev_id', 'spq_id', 'bom_id', 'material_number', 'product_name', 'co_product_name', 'weight', 'price_per_product', 'quantity'],
//             insertRows
//             // data.co_product_component_economic_value_questions.map((c: any) =>
//             //     [ulid(), spq_id, c.product_name, c.co_product_name, c.weight, c.price_per_product, c.quantity]
//             // )
//         ));


//         for (const [bom_id, coProducts] of Object.entries(bomGroups)) {
//             //  Fetch BOM price

//             const bomRes = await client.query(`SELECT price FROM bom WHERE id = $1`, [bom_id]);
//             const bomPrice = bomRes.rows[0]?.price || 0;

//             //  Calculate average price_per_product
//             const totalPrice = coProducts.reduce((sum, p) => sum + (p.price_per_product || 0), 0);
//             const avgPricePerProduct = totalPrice / (coProducts.length || 1);

//             // Compute ER safely
//             const ER = bomPrice / (avgPricePerProduct || 1);

//             // Update BOM table
//             await client.query(
//                 `UPDATE bom SET economic_ratio = $1 WHERE id = $2`,
//                 [ER, bom_id]
//             );

//             let econAllocation = 'NA';
//             let phyMassAllocation = 'Physical';
//             let checkER = 'Physical';

//             if (ER > 5) {
//                 econAllocation = 'Economic';
//             }

//             await client.query(
//                 `
//     INSERT INTO allocation_methodology (
//         id,
//         bom_id,
//         econ_allocation_er_greater_than_five,
//         phy_mass_allocation_er_less_than_five,
//         check_er_less_than_five
//     )
//     SELECT 
//         $1,
//         $2::VARCHAR(255),
//         $3,
//         $4,
//         $5
//     WHERE NOT EXISTS (
//         SELECT 1
//         FROM allocation_methodology
//         WHERE bom_id = $2::VARCHAR(255)
//     )
//     `,
//                 [
//                     ulid(),
//                     bom_id,
//                     econAllocation,
//                     phyMassAllocation,
//                     checkER
//                 ]
//             );



//             console.log(`BOM ID ${bom_id} | BOM Price: ${bomPrice} | Avg Co-Product Price: ${avgPricePerProduct} | ER: ${ER}`);
//         }

//         allDQRConfigs.push({
//             tableName: 'dqr_co_product_component_manufactured_rating_qfiftenone',
//             columns: ['pcmrqfo_id', 'sgiq_id', 'cpcev_id', 'data'],
//             parentId: sgiq_id,
//             records: dqrQ15Point2
//         });
//     }

//     console.log(`Creating ${allDQRConfigs.length} DQR table entries...`);
//     await createDQRRecords(client, allDQRConfigs);
//     await Promise.all(childInserts);
// }

async function insertSupplierProduct(client: any, data: any, sgiq_id: string) {
    const spq_id = ulid();
    const allDQRConfigs: any[] = [];

    /* ---------------- Parent Insert ---------------- */
    await client.query(
        `
        INSERT INTO supplier_product_questions (
            spq_id,
            sgiq_id,
            do_you_have_an_existing_pcf_report,
            pcf_methodology_used,
            upload_pcf_report,
            required_environmental_impact_methods,
            any_co_product_have_economic_value
        )
        VALUES ($1,$2,$3,$4::TEXT[],$5::TEXT[],$6::TEXT[],$7)
        `,
        [
            spq_id,
            sgiq_id,
            data.do_you_have_an_existing_pcf_report,
            data.pcf_methodology_used,
            data.upload_pcf_report,
            data.required_environmental_impact_methods,
            data.any_co_product_have_economic_value
        ]
    );

    /* ---------------- DQR Q11 ---------------- */
    allDQRConfigs.push({
        tableName: 'dqr_supplier_product_questions_rating_qeleven',
        columns: ['spqrqe_id', 'sgiq_id', 'spq_id', 'data'],
        parentId: sgiq_id,
        records: [{
            childId: spq_id,
            data: data.pcf_methodology_used
        }]
    });

    /* ---------------- DQR Q12 ---------------- */
    allDQRConfigs.push({
        tableName: 'dqr_supplier_product_questions_rating_qtwelve',
        columns: ['spqrqt_id', 'sgiq_id', 'spq_id', 'data'],
        parentId: sgiq_id,
        records: [{
            childId: spq_id,
            data: data.upload_pcf_report
        }]
    });

    /* ---------------- Production Site Details ---------------- */
    if (Array.isArray(data.production_site_details_questions) && data.production_site_details_questions.length) {
        const rows: any[] = [];
        const dqr: any[] = [];

        for (const p of data.production_site_details_questions) {
            const psd_id = ulid();

            rows.push([
                psd_id,
                spq_id,
                p.bom_id,
                p.material_number,
                p.product_name,
                p.location
            ]);

            dqr.push({
                childId: psd_id,
                data: {
                    bom_id: p.bom_id,
                    material_number: p.material_number,
                    product_name: p.product_name,
                    location: p.location
                }
            });
        }

        await bulkInsert(
            client,
            'production_site_details_questions',
            ['psd_id', 'spq_id', 'bom_id', 'material_number', 'product_name', 'location'],
            rows
        );

        allDQRConfigs.push({
            tableName: 'dqr_production_site_detail_rating_qthirteen',
            columns: ['psdrqt_id', 'sgiq_id', 'psd_id', 'data'],
            parentId: sgiq_id,
            records: dqr
        });
    }

    /* ---------------- Product Component Manufactured ---------------- */
    if (Array.isArray(data.product_component_manufactured_questions) && data.product_component_manufactured_questions.length) {
        const rows: any[] = [];
        const dqr: any[] = [];

        for (const p of data.product_component_manufactured_questions) {
            const pcm_id = ulid();

            rows.push([
                pcm_id,
                spq_id,
                p.bom_id,
                p.material_number,
                p.product_name,
                p.production_period,
                p.weight_per_unit,
                p.unit,
                p.price,
                p.quantity
            ]);

            dqr.push({
                childId: pcm_id,
                data: {
                    bom_id: p.bom_id,
                    material_number: p.material_number,
                    product_name: p.product_name,
                    production_period: p.production_period,
                    weight_per_unit: p.weight_per_unit,
                    unit: p.unit,
                    price: p.price,
                    quantity: p.quantity
                }
            });
        }

        await bulkInsert(
            client,
            'product_component_manufactured_questions',
            [
                'pcm_id',
                'spq_id',
                'bom_id',
                'material_number',
                'product_name',
                'production_period',
                'weight_per_unit',
                'unit',
                'price',
                'quantity'
            ],
            rows
        );

        allDQRConfigs.push({
            tableName: 'dqr_product_component_manufactured_rating_qfiften',
            columns: ['pcmrqf_id', 'sgiq_id', 'pcm_id', 'data'],
            parentId: sgiq_id,
            records: dqr
        });
    }

    /* ---------------- Co-Product Component ---------------- */
    if (Array.isArray(data.co_product_component_economic_value_questions) && data.co_product_component_economic_value_questions.length) {
        const rows: any[] = [];
        const dqr: any[] = [];
        const bomGroups: Record<string, any[]> = {};

        for (const p of data.co_product_component_economic_value_questions) {
            const cpcev_id = ulid();

            rows.push([
                cpcev_id,
                spq_id,
                p.bom_id || null,
                p.material_number || null,
                p.product_name,
                p.co_product_name,
                p.weight,
                p.price_per_product,
                p.quantity
            ]);

            dqr.push({
                childId: cpcev_id,
                data: {
                    bom_id: p.bom_id || null,
                    material_number: p.material_number || null,
                    product_name: p.product_name,
                    co_product_name: p.co_product_name,
                    weight: p.weight,
                    price_per_product: p.price_per_product,
                    quantity: p.quantity
                }
            });

            if (p.bom_id) {
                if (!bomGroups[p.bom_id]) bomGroups[p.bom_id] = [];
                bomGroups[p.bom_id].push(p);
            }
        }

        await bulkInsert(
            client,
            'co_product_component_economic_value_questions',
            [
                'cpcev_id',
                'spq_id',
                'bom_id',
                'material_number',
                'product_name',
                'co_product_name',
                'weight',
                'price_per_product',
                'quantity'
            ],
            rows
        );

        /* ---- Economic Ratio Calculation ---- */
        for (const [bom_id, coProducts] of Object.entries(bomGroups)) {
            const bomRes = await client.query(`SELECT price FROM bom WHERE id = $1::VARCHAR`, [bom_id]);
            const bomPrice = bomRes.rows[0]?.price || 0;

            const total = coProducts.reduce((s, p) => s + (p.price_per_product || 0), 0);
            const avg = total / (coProducts.length || 1);
            const ER = bomPrice / (avg || 1);

            await client.query(
                `UPDATE bom SET economic_ratio = $1::NUMERIC WHERE id = $2::VARCHAR`,
                [ER, bom_id]
            );

            const econ = ER > 5 ? 'Economic' : 'NA';

            await client.query(
                `
                INSERT INTO allocation_methodology (
                    id,
                    bom_id,
                    econ_allocation_er_greater_than_five,
                    phy_mass_allocation_er_less_than_five,
                    check_er_less_than_five
                )
                SELECT $1::VARCHAR, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR
                WHERE NOT EXISTS (
                    SELECT 1 FROM allocation_methodology WHERE bom_id = $2
                )
                `,
                [ulid(), bom_id, econ, 'Physical', 'Physical']
            );
        }

        allDQRConfigs.push({
            tableName: 'dqr_co_product_component_manufactured_rating_qfiftenone',
            columns: ['pcmrqfo_id', 'sgiq_id', 'cpcev_id', 'data'],
            parentId: sgiq_id,
            records: dqr
        });
    }

    /* ---------------- DQR Final Insert ---------------- */
    console.log(`Creating ${allDQRConfigs.length} DQR table entries...`);
    await createDQRRecords(client, allDQRConfigs);
}


async function insertScopeOne(client: any, data: any, sgiq_id: string) {
    const sode_id = ulid();
    const allDQRConfigs: any[] = [];

    // Insert parent
    await client.query(
        `INSERT INTO scope_one_direct_emissions_questions 
         (sode_id, sgiq_id, refrigerant_top_ups_performed, industrial_process_emissions_present)
         VALUES ($1, $2, $3, $4)`,
        [sode_id, sgiq_id, data.refrigerant_top_ups_performed ?? false, data.industrial_process_emissions_present ?? false]
    );

    const childInserts = [];

    // Stationary combustion - needs nested handling
    const stationaryCombustionQuestions = data.stationary_combustion_on_site_energy_use_questions;

    if (Array.isArray(stationaryCombustionQuestions) && stationaryCombustionQuestions.length > 0) {
        const dqrQ16: any[] = [];
        const scoseuRows: any[] = [];
        const subFuelRows: any[] = [];

        for (const item of stationaryCombustionQuestions) {
            const scoseu_id = ulid();

            //Parent row
            scoseuRows.push([
                scoseu_id,
                sode_id,
                item.fuel_type
            ]);

            // DQR payload (Q16)
            dqrQ16.push({
                childId: scoseu_id,
                data: JSON.stringify({
                    fuel_type: item.fuel_type
                })
            });

            // Sub fuel types (bulk collected)
            if (Array.isArray(item.scoseu_sub_fuel_type_questions) && item.scoseu_sub_fuel_type_questions.length > 0) {
                for (const s of item.scoseu_sub_fuel_type_questions) {
                    subFuelRows.push([
                        ulid(),
                        scoseu_id,
                        s.sub_fuel_type,
                        s.consumption_quantity,
                        s.unit
                    ]);
                }
            }
        }

        // Bulk insert parent table
        childInserts.push(
            bulkInsert(
                client,
                'stationary_combustion_on_site_energy_use_questions',
                ['scoseu_id', 'sode_id', 'fuel_type'],
                scoseuRows
            )
        );

        // Bulk insert sub fuel types (if any)
        if (subFuelRows.length > 0) {
            childInserts.push(
                bulkInsert(
                    client,
                    'scoseu_sub_fuel_type_questions',
                    ['ssft_id', 'scoseu_id', 'sub_fuel_type', 'consumption_quantity', 'unit'],
                    subFuelRows
                )
            );
        }

        //Register DQR Q16
        allDQRConfigs.push({
            tableName: 'dqr_stationary_combustion_on_site_energy_rating_qsixten',
            columns: ['scoserqs_id', 'sgiq_id', 'scoseu_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ16
        });
    }

    // const stationaryCombustionQuestions = data.stationary_combustion_on_site_energy_use_questions;
    // if (Array.isArray(stationaryCombustionQuestions) && stationaryCombustionQuestions.length > 0) {
    //     childInserts.push((async () => {
    //         for (const item of stationaryCombustionQuestions) {
    //             const scoseu_id = ulid();
    //             await client.query(
    //                 `INSERT INTO stationary_combustion_on_site_energy_use_questions (scoseu_id, sode_id, fuel_type)
    //                  VALUES ($1, $2, $3)`,
    //                 [scoseu_id, sode_id, item.fuel_type]
    //             );

    //             // Bulk insert sub fuel types
    //             if (Array.isArray(item.scoseu_sub_fuel_type_questions) && item.scoseu_sub_fuel_type_questions.length > 0) {
    //                 await bulkInsert(
    //                     client,
    //                     'scoseu_sub_fuel_type_questions',
    //                     ['ssft_id', 'scoseu_id', 'sub_fuel_type', 'consumption_quantity', 'unit'],
    //                     item.scoseu_sub_fuel_type_questions.map((s: any) =>
    //                         [ulid(), scoseu_id, s.sub_fuel_type, s.consumption_quantity, s.unit]
    //                     )
    //                 );
    //             }
    //         }
    //     })());
    // }

    // Mobile combustion - BULK
    if (Array.isArray(data.mobile_combustion_company_owned_vehicles_questions) && data.mobile_combustion_company_owned_vehicles_questions.length > 0) {
        const dqrQ17: any[] = [];

        const insertRows = data.mobile_combustion_company_owned_vehicles_questions.map((p: any) => {
            const mccov_id = ulid(); // correct child id

            // Store DQR data
            dqrQ17.push({
                childId: mccov_id,
                data: {
                    fuel_type: p.fuel_type,
                    quantity: p.quantity,
                    unit: p.unit
                }
            });

            // Row for bulk insert
            return [mccov_id, sode_id, p.fuel_type, p.quantity, p.unit];
        });

        childInserts.push(bulkInsert(
            client,
            'mobile_combustion_company_owned_vehicles_questions',
            ['mccov_id', 'sode_id', 'fuel_type', 'quantity', 'unit'],
            insertRows
            // data.mobile_combustion_company_owned_vehicles_questions.map((v: any) =>
            //     [mccov_id, sode_id, v.fuel_type, v.quantity, v.unit]
            // )
        ));

        allDQRConfigs.push({
            tableName: 'dqr_mobile_combustion_company_owned_vehicles_rating_qseventen',
            columns: ['mccoqrqs_id', 'sgiq_id', 'mccov_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ17
        });
    }

    // Refrigerants - BULK
    if (Array.isArray(data.refrigerants_questions) && data.refrigerants_questions.length > 0) {

        const dqrQ19: any[] = [];

        const insertRows = data.refrigerants_questions.map((p: any) => {
            const refr_id = ulid(); // correct child id

            // Store DQR data
            dqrQ19.push({
                childId: refr_id,
                data: {
                    refrigerant_type: p.refrigerant_type,
                    quantity: p.quantity,
                    unit: p.unit
                }
            });

            // Row for bulk insert
            return [refr_id, sode_id, p.refrigerant_type, p.quantity, p.unit];
        });


        childInserts.push(bulkInsert(
            client,
            'refrigerants_questions',
            ['refr_id', 'sode_id', 'refrigerant_type', 'quantity', 'unit'],
            insertRows
            // data.refrigerants_questions.map((r: any) => [ulid(), sode_id, r.refrigerant_type, r.quantity, r.unit])
        ));

        allDQRConfigs.push({
            tableName: 'dqr_refrigerants_rating_qnineten',
            columns: ['refrqn_id', 'sgiq_id', 'refr_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ19
        });
    }

    // Process emissions - BULK
    if (Array.isArray(data.process_emissions_sources_questions) && data.process_emissions_sources_questions.length > 0) {

        const dqrQ21: any[] = [];

        const insertRows = data.process_emissions_sources_questions.map((p: any) => {
            const pes_id = ulid(); // correct child id

            // Store DQR data
            dqrQ21.push({
                childId: pes_id,
                data: {
                    source: p.source,
                    gas_type: p.gas_type,
                    quantity: p.quantity,
                    unit: p.unit
                }
            });

            // Row for bulk insert
            return [pes_id, sode_id, p.source, p.gas_type, p.quantity, p.unit];
        });


        childInserts.push(bulkInsert(
            client,
            'process_emissions_sources_questions',
            ['pes_id', 'sode_id', 'source', 'gas_type', 'quantity', 'unit'],
            insertRows
            // data.process_emissions_sources_questions.map((e: any) =>
            //     [ulid(), sode_id, e.source, e.gas_type, e.quantity, e.unit]
            // )
        ));

        allDQRConfigs.push({
            tableName: 'dqr_process_emissions_sources_qtwentyone',
            columns: ['pesqto_id', 'sgiq_id', 'pes_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ21
        });
    }

    await Promise.all(childInserts);

    console.log(`Creating ${allDQRConfigs.length} DQR table entries...`);
    await createDQRRecords(client, allDQRConfigs);
}

async function insertScopeTwo(client: any, data: any, sgiq_id: string, annual_reporting_period: string) {
    const stide_id = ulid();
    const allDQRConfigs: any[] = [];

    // Insert parent
    await client.query(
        `INSERT INTO scope_two_indirect_emissions_questions (
            stide_id, sgiq_id, do_you_acquired_standardized_re_certificates,
            methodology_to_allocate_factory_energy_to_product_level, methodology_details_document_url,
            energy_intensity_of_production_estimated_kwhor_mj, process_specific_energy_usage,
            do_you_use_any_abatement_systems, water_consumption_and_treatment_details,
            do_you_perform_destructive_testing, it_system_use_for_production_control,
            total_energy_consumption_of_it_hardware_production, energy_con_included_total_energy_pur_sec_two_qfortythree,
            do_you_use_cloud_based_system_for_production, do_you_use_any_cooling_sysytem_for_server,
            energy_con_included_total_energy_pur_sec_two_qfifty
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
            stide_id, sgiq_id,
            data.do_you_acquired_standardized_re_certificates ?? false,
            data.methodology_to_allocate_factory_energy_to_product_level ?? false,
            data.methodology_details_document_url,
            data.energy_intensity_of_production_estimated_kwhor_mj ?? false,
            data.process_specific_energy_usage ?? false,
            data.do_you_use_any_abatement_systems ?? false,
            data.water_consumption_and_treatment_details,
            data.do_you_perform_destructive_testing ?? false,
            data.it_system_use_for_production_control,
            data.total_energy_consumption_of_it_hardware_production ?? false,
            data.energy_con_included_total_energy_pur_sec_two_qfortythree ?? false,
            data.do_you_use_cloud_based_system_for_production ?? false,
            data.do_you_use_any_cooling_sysytem_for_server ?? false,
            data.energy_con_included_total_energy_pur_sec_two_qfifty ?? false
        ]
    );

    const dqrQ26: any[] = [];
    dqrQ26.push({
        childId: stide_id,
        data: data.methodology_details_document_url
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_two_indirect_emissions_qtwentysix',
        columns: ['stieqts_id', 'sgiq_id', 'stide_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ26
    });

    const dqrQ31: any[] = [];
    dqrQ31.push({
        childId: stide_id,
        data: data.water_consumption_and_treatment_details
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_two_indirect_emissions_qthirtyone',
        columns: ['stideqto_id', 'sgiq_id', 'stide_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ31
    });

    const dqrQ41: any[] = [];
    dqrQ41.push({
        childId: stide_id,
        data: data.it_system_use_for_production_control
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_two_indirect_emissions_qfortyone',
        columns: ['stideqfo_id', 'sgiq_id', 'stide_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ41
    });


    // const childInserts = [];

    // // All child tables in parallel with bulk inserts
    // const tableConfigs = [
    //     {
    //         data: data.scope_two_indirect_emissions_from_purchased_energy_questions,
    //         table: 'scope_two_indirect_emissions_from_purchased_energy_questions',
    //         columns: ['stidefpe_id', 'stide_id', 'energy_source', 'energy_type', 'quantity', 'unit'],
    //         mapper: (e: any) => [ulid(), stide_id, e.energy_source, e.energy_type, e.quantity, e.unit]
    //     },
    //     {
    //         data: data.scope_two_indirect_emissions_certificates_questions,
    //         table: 'scope_two_indirect_emissions_certificates_questions',
    //         columns: ['stidec_id', 'stide_id', 'certificate_name', 'mechanism', 'serial_id', 'generator_id', 'generator_name', 'generator_location', 'date_of_generation', 'issuance_date'],
    //         mapper: (c: any) => [ulid(), stide_id, c.certificate_name, c.mechanism, c.serial_id, c.generator_id, c.generator_name, c.generator_location, c.date_of_generation, c.issuance_date]
    //     },
    //     {
    //         data: data.energy_intensity_of_production_estimated_kwhor_mj_questions,
    //         table: 'energy_intensity_of_production_estimated_kwhor_mj_questions',
    //         columns: ['eiopekm_id', 'stide_id', 'product_name', 'energy_intensity', 'unit'],
    //         mapper: (i: any) => [ulid(), stide_id, i.product_name, i.energy_intensity, i.unit]
    //     },
    //     {
    //         data: data.process_specific_energy_usage_questions,
    //         table: 'process_specific_energy_usage_questions',
    //         columns: ['pseu_id', 'stide_id', 'process_specific_energy_type', 'quantity_consumed', 'unit', 'support_from_enviguide'],
    //         mapper: (p: any) => [ulid(), stide_id, p.process_specific_energy_type, p.quantity_consumed, p.unit, p.support_from_enviguide ?? false]
    //     },
    //     {
    //         data: data.abatement_systems_used_questions,
    //         table: 'abatement_systems_used_questions',
    //         columns: ['asu_id', 'stide_id', 'source', 'quantity', 'unit'],
    //         mapper: (s: any) => [ulid(), stide_id, s.source, s.quantity, s.unit]
    //     },
    //     {
    //         data: data.type_of_quality_control_equipment_usage_questions,
    //         table: 'type_of_quality_control_equipment_usage_questions',
    //         columns: ['toqceu_id', 'stide_id', 'equipment_name', 'quantity', 'unit', 'avg_operating_hours_per_month'],
    //         mapper: (e: any) => [ulid(), stide_id, e.equipment_name, e.quantity, e.unit, e.avg_operating_hours_per_month]
    //     },
    //     {
    //         data: data.electricity_consumed_for_quality_control_questions,
    //         table: 'electricity_consumed_for_quality_control_questions',
    //         columns: ['ecfqc_id', 'stide_id', 'energy_type', 'quantity', 'unit', 'period'],
    //         mapper: (e: any) => [ulid(), stide_id, e.energy_type, e.quantity, e.unit, e.period]
    //     },
    //     {
    //         data: data.quality_control_process_usage_questions,
    //         table: 'quality_control_process_usage_questions',
    //         columns: ['qcpu_id', 'stide_id', 'process_name', 'quantity', 'unit', 'period'],
    //         mapper: (p: any) => [ulid(), stide_id, p.process_name, p.quantity, p.unit, p.period]
    //     },
    //     {
    //         data: data.quality_control_process_usage_pressure_or_flow_questions,
    //         table: 'quality_control_process_usage_pressure_or_flow_questions',
    //         columns: ['qcpupf_id', 'stide_id', 'flow_name', 'quantity', 'unit', 'period'],
    //         mapper: (f: any) => [ulid(), stide_id, f.flow_name, f.quantity, f.unit, f.period]
    //     },
    //     {
    //         data: data.quality_control_use_any_consumables_questions,
    //         table: 'quality_control_use_any_consumables_questions',
    //         columns: ['qcuac_id', 'stide_id', 'consumable_name', 'mass_of_consumables', 'unit', 'period'],
    //         mapper: (c: any) => [ulid(), stide_id, c.flow_name, c.quantity, c.unit, c.period]
    //     },
    //     {
    //         data: data.weight_of_samples_destroyed_questions,
    //         table: 'weight_of_samples_destroyed_questions',
    //         columns: ['wosd_id', 'stide_id', 'component_name', 'weight', 'unit', 'period'],
    //         mapper: (s: any) => [ulid(), stide_id, s.component_name, s.weight, s.unit, s.period]
    //     },
    //     {
    //         data: data.defect_or_rejection_rate_identified_by_quality_control_questions,
    //         table: 'defect_or_rejection_rate_identified_by_quality_control_questions',
    //         columns: ['dorriqc_id', 'stide_id', 'component_name', 'percentage'],
    //         mapper: (d: any) => [ulid(), stide_id, d.component_name, d.percentage]
    //     },
    //     {
    //         data: data.rework_rate_due_to_quality_control_questions,
    //         table: 'rework_rate_due_to_quality_control_questions',
    //         columns: ['rrdqc_id', 'stide_id', 'component_name', 'processes_involved', 'percentage'],
    //         mapper: (r: any) => [ulid(), stide_id, r.component_name, r.processes_involved, r.percentage]
    //     },
    //     {
    //         data: data.weight_of_quality_control_waste_generated_questions,
    //         table: 'weight_of_quality_control_waste_generated_questions',
    //         columns: ['woqcwg_id', 'stide_id', 'waste_type', 'waste_weight', 'unit', 'treatment_type'],
    //         mapper: (w: any) => [ulid(), stide_id, w.waste_type, w.waste_weight, w.unit, w.treatment_type]
    //     },
    //     {
    //         data: data.energy_consumption_for_qfortyfour_questions,
    //         table: 'energy_consumption_for_qfortyfour_questions',
    //         columns: ['ecfqff_id', 'stide_id', 'energy_purchased', 'energy_type', 'quantity', 'unit'],
    //         mapper: (e: any) => [ulid(), stide_id, e.energy_purchased, e.energy_type, e.quantity, e.unit]
    //     },
    //     {
    //         data: data.cloud_provider_details_questions,
    //         table: 'cloud_provider_details_questions',
    //         columns: ['cpd_id', 'stide_id', 'cloud_provider_name', 'virtual_machines', 'data_storage', 'data_transfer'],
    //         mapper: (c: any) => [ulid(), stide_id, c.cloud_provider_name, c.virtual_machines, c.data_storage, c.data_transfer]
    //     },
    //     {
    //         data: data.dedicated_monitoring_sensor_usage_questions,
    //         table: 'dedicated_monitoring_sensor_usage_questions',
    //         columns: ['dmsu_id', 'stide_id', 'type_of_sensor', 'sensor_quantity', 'energy_consumption', 'unit'],
    //         mapper: (s: any) => [ulid(), stide_id, s.type_of_sensor, s.sensor_quantity, s.energy_consumption, s.unit]
    //     },
    //     {
    //         data: data.annual_replacement_rate_of_sensor_questions,
    //         table: 'annual_replacement_rate_of_sensor_questions',
    //         columns: ['arros_id', 'stide_id', 'consumable_name', 'quantity', 'unit'],
    //         mapper: (r: any) => [ulid(), stide_id, r.consumable_name, r.quantity, r.unit]
    //     },
    //     {
    //         data: data.energy_consumption_for_qfiftyone_questions,
    //         table: 'energy_consumption_for_qfiftyone_questions',
    //         columns: ['ecfqfo_id', 'stide_id', 'energy_purchased', 'energy_type', 'quantity', 'unit'],
    //         mapper: (e: any) => [ulid(), stide_id, e.energy_purchased, e.energy_type, e.quantity, e.unit]
    //     }
    // ];

    // for (const config of tableConfigs) {
    //     if (Array.isArray(config.data) && config.data.length > 0) {
    //         childInserts.push(bulkInsert(client, config.table, config.columns, config.data.map(config.mapper)));
    //     }
    // }

    // await Promise.all(childInserts);

    const childInserts = [];

    if (Array.isArray(data.scope_two_indirect_emissions_from_purchased_energy_questions)) {
        console.log(data.sup_id, "data.sup_iddata.sup_id");

        // data.scope_two_indirect_emissions_from_purchased_energy_questions = data.sup_id;

        const dqrQ22: any[] = [];

        const rows = data.scope_two_indirect_emissions_from_purchased_energy_questions.map((e: any) => {
            const stidefpe_id = ulid();

            // e = data.sup_id;
            prepareDQR({
                records: dqrQ22,
                childId: stidefpe_id,
                payload: {
                    energy_source: e.energy_source,
                    energy_type: e.energy_type,
                    quantity: e.quantity,
                    unit: e.unit,
                    sup_id: data.sup_id,
                    annual_reporting_period
                }
            });

            return [stidefpe_id, stide_id, e.energy_source, e.energy_type, e.quantity, e.unit, data.sup_id, annual_reporting_period];
        });

        childInserts.push(bulkInsert(
            client,
            'scope_two_indirect_emissions_from_purchased_energy_questions',
            ['stidefpe_id', 'stide_id', 'energy_source', 'energy_type', 'quantity', 'unit', 'sup_id', 'annual_reporting_period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_scope_two_indirect_emis_from_pur_energy_qtwentytwo',
            columns: ['stidefpeqtt_id', 'sgiq_id', 'stidefpe_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ22
        });
    }

    if (Array.isArray(data.scope_two_indirect_emissions_certificates_questions)) {
        const dqrQ24: any[] = [];

        const rows = data.scope_two_indirect_emissions_certificates_questions.map((c: any) => {
            const stidec_id = ulid();

            prepareDQR({
                records: dqrQ24,
                childId: stidec_id,
                payload: c
            });

            return [
                stidec_id, stide_id,
                c.certificate_name, c.mechanism, c.serial_id,
                c.generator_id, c.generator_name,
                c.generator_location, c.date_of_generation, c.issuance_date
            ];
        });

        childInserts.push(bulkInsert(
            client,
            'scope_two_indirect_emissions_certificates_questions',
            ['stidec_id', 'stide_id', 'certificate_name', 'mechanism', 'serial_id', 'generator_id', 'generator_name', 'generator_location', 'date_of_generation', 'issuance_date'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_scope_two_indirect_emissions_certificates_qtwentyfour',
            columns: ['stiecqtf_id', 'sgiq_id', 'stidec_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ24
        });
    }

    if (Array.isArray(data.energy_intensity_of_production_estimated_kwhor_mj_questions)) {
        const dqrQ27: any[] = [];

        const rows = data.energy_intensity_of_production_estimated_kwhor_mj_questions.map((i: any) => {
            const eiopekm_id = ulid();

            prepareDQR({
                records: dqrQ27,
                childId: eiopekm_id,
                payload: i
            });

            return [eiopekm_id, stide_id, i.bom_id, i.material_number, i.product_name, i.energy_intensity, i.unit];
        });

        childInserts.push(bulkInsert(
            client,
            'energy_intensity_of_production_estimated_kwhor_mj_questions',
            ['eiopekm_id', 'stide_id', 'bom_id', 'material_number', 'product_name', 'energy_intensity', 'unit'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_energy_intensity_of_pro_est_kwhor_mj_qtwentyseven',
            columns: ['eiopekmqts_id', 'sgiq_id', 'eiopekm_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ27
        });

    }

    if (Array.isArray(data.process_specific_energy_usage_questions)) {
        const dqrQ28: any[] = [];

        const rows = data.process_specific_energy_usage_questions.map((p: any) => {
            const pseu_id = ulid();

            prepareDQR({
                records: dqrQ28,
                childId: pseu_id,
                payload: p
            });

            return [pseu_id, stide_id, p.process_specific_energy_type, p.quantity_consumed, p.unit, p.support_from_enviguide ?? false, p.bom_id, p.material_number, p.energy_type, annual_reporting_period];
        });

        childInserts.push(bulkInsert(
            client,
            'process_specific_energy_usage_questions',
            ['pseu_id', 'stide_id', 'process_specific_energy_type', 'quantity_consumed', 'unit', 'support_from_enviguide', 'bom_id', 'material_number', 'energy_type', 'annual_reporting_period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_process_specific_energy_usage_qtwentyeight',
            columns: ['pseuqte_id', 'sgiq_id', 'pseu_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ28
        });

    }

    if (Array.isArray(data.abatement_systems_used_questions) && data.abatement_systems_used_questions.length > 0) {

        const dqrQ30: any[] = [];

        const rows = data.abatement_systems_used_questions.map((a: any) => {
            const asu_id = ulid();

            dqrQ30.push({
                childId: asu_id,
                data: JSON.stringify(a)
            });

            return [asu_id, stide_id, a.source, a.quantity, a.unit];
        });

        childInserts.push(bulkInsert(
            client,
            'abatement_systems_used_questions',
            ['asu_id', 'stide_id', 'source', 'quantity', 'unit'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_abatement_systems_used_qthirty',
            columns: ['asuqt_id', 'sgiq_id', 'asu_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ30
        });
    }

    if (Array.isArray(data.type_of_quality_control_equipment_usage_questions)) {

        const dqrQ32: any[] = [];

        const rows = data.type_of_quality_control_equipment_usage_questions.map((q: any) => {
            const toqceu_id = ulid();

            dqrQ32.push({
                childId: toqceu_id,
                data: JSON.stringify(q)
            });

            return [toqceu_id, stide_id, q.equipment_name, q.quantity, q.unit, q.avg_operating_hours_per_month];
        });

        childInserts.push(bulkInsert(
            client,
            'type_of_quality_control_equipment_usage_questions',
            ['toqceu_id', 'stide_id', 'equipment_name', 'quantity', 'unit', 'avg_operating_hours_per_month'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_type_of_quality_control_equipment_usage_qthirtytwo',
            columns: ['toqceuqto_id', 'sgiq_id', 'toqceu_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ32
        });
    }

    if (Array.isArray(data.electricity_consumed_for_quality_control_questions)) {

        const dqrQ33: any[] = [];

        const rows = data.electricity_consumed_for_quality_control_questions.map((e: any) => {
            const ecfqc_id = ulid();

            dqrQ33.push({
                childId: ecfqc_id,
                data: JSON.stringify(e)
            });

            return [ecfqc_id, stide_id, e.energy_type, e.quantity, e.unit, e.period];
        });

        childInserts.push(bulkInsert(
            client,
            'electricity_consumed_for_quality_control_questions',
            ['ecfqc_id', 'stide_id', 'energy_type', 'quantity', 'unit', 'period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_electricity_consumed_for_quality_control_qthirtythree',
            columns: ['ecfqcqtt_id', 'sgiq_id', 'ecfqc_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ33
        });
    }

    if (Array.isArray(data.quality_control_process_usage_questions)) {

        const dqrQ34: any[] = [];

        const rows = data.quality_control_process_usage_questions.map((q: any) => {
            const qcpu_id = ulid();

            dqrQ34.push({
                childId: qcpu_id,
                data: JSON.stringify(q)
            });

            return [qcpu_id, stide_id, q.process_name, q.quantity, q.unit, q.period];
        });

        childInserts.push(bulkInsert(
            client,
            'quality_control_process_usage_questions',
            ['qcpu_id', 'stide_id', 'process_name', 'quantity', 'unit', 'period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_quality_control_process_usage_qthirtyfour',
            columns: ['qcpuqtf_id', 'sgiq_id', 'qcpu_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ34
        });
    }

    if (Array.isArray(data.quality_control_process_usage_pressure_or_flow_questions)) {

        const dqrQ341: any[] = [];

        const rows = data.quality_control_process_usage_pressure_or_flow_questions.map((p: any) => {
            const qcpupf_id = ulid();

            dqrQ341.push({
                childId: qcpupf_id,
                data: JSON.stringify(p)
            });

            return [qcpupf_id, stide_id, p.flow_name, p.quantity, p.unit, p.period];
        });

        childInserts.push(bulkInsert(
            client,
            'quality_control_process_usage_pressure_or_flow_questions',
            ['qcpupf_id', 'stide_id', 'flow_name', 'quantity', 'unit', 'period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_quality_control_process_usage_pressure_or_flow_qthirtyfour',
            columns: ['qcpupfqtf_id', 'sgiq_id', 'qcpupf_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ341
        });
    }

    if (Array.isArray(data.quality_control_use_any_consumables_questions)) {

        const dqrQ35: any[] = [];

        const rows = data.quality_control_use_any_consumables_questions.map((c: any) => {
            const qcuac_id = ulid();

            dqrQ35.push({
                childId: qcuac_id,
                data: JSON.stringify(c)
            });

            return [qcuac_id, stide_id, c.consumable_name, c.mass_of_consumables, c.unit, c.period];
        });

        childInserts.push(bulkInsert(
            client,
            'quality_control_use_any_consumables_questions',
            ['qcuac_id', 'stide_id', 'consumable_name', 'mass_of_consumables', 'unit', 'period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_quality_control_use_any_consumables_qthirtyfive',
            columns: ['qcuacqtf_id', 'sgiq_id', 'qcuac_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ35
        });
    }

    if (Array.isArray(data.weight_of_samples_destroyed_questions)) {

        const dqrQ37: any[] = [];

        const rows = data.weight_of_samples_destroyed_questions.map((w: any) => {
            const wosd_id = ulid();

            dqrQ37.push({
                childId: wosd_id,
                data: JSON.stringify(w)
            });

            return [wosd_id, stide_id, w.bom_id, w.material_number, w.component_name, w.weight, w.unit, w.period];
        });

        childInserts.push(bulkInsert(
            client,
            'weight_of_samples_destroyed_questions',
            ['wosd_id', 'stide_id', 'bom_id', 'material_number', 'component_name', 'weight', 'unit', 'period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_weight_of_samples_destroyed_qthirtyseven',
            columns: ['wosdqts_id', 'sgiq_id', 'wosd_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ37
        });
    }

    if (Array.isArray(data.defect_or_rejection_rate_identified_by_quality_control_questions)) {

        const dqrQ38: any[] = [];

        const rows = data.defect_or_rejection_rate_identified_by_quality_control_questions.map((d: any) => {
            const dorriqc_id = ulid();

            dqrQ38.push({
                childId: dorriqc_id,
                data: JSON.stringify(d)
            });

            return [dorriqc_id, stide_id, d.bom_id, d.material_number, d.component_name, d.percentage];
        });

        childInserts.push(bulkInsert(
            client,
            'defect_or_rejection_rate_identified_by_quality_control_questions',
            ['dorriqc_id', 'stide_id', 'bom_id', 'material_number', 'component_name', 'percentage'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_defect_or_rej_rate_identified_by_quality_control_qthirtyeight',
            columns: ['dorriqcqte_id', 'sgiq_id', 'dorriqc_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ38
        });
    }

    if (Array.isArray(data.rework_rate_due_to_quality_control_questions)) {

        const dqrQ39: any[] = [];

        const rows = data.rework_rate_due_to_quality_control_questions.map((r: any) => {
            const rrdqc_id = ulid();

            dqrQ39.push({
                childId: rrdqc_id,
                data: JSON.stringify(r)
            });

            return [rrdqc_id, stide_id, r.bom_id, r.material_number, r.component_name, r.processes_involved, r.percentage];
        });

        childInserts.push(bulkInsert(
            client,
            'rework_rate_due_to_quality_control_questions',
            ['rrdqc_id', 'stide_id', 'bom_id', 'material_number', 'component_name', 'processes_involved', 'percentage'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_rework_rate_due_to_quality_control_qthirtynine',
            columns: ['rrdqcqtn_id', 'sgiq_id', 'rrdqc_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ39
        });
    }

    if (Array.isArray(data.weight_of_quality_control_waste_generated_questions)) {

        const dqrQ40: any[] = [];

        const rows = data.weight_of_quality_control_waste_generated_questions.map((w: any) => {
            const woqcwg_id = ulid();

            dqrQ40.push({
                childId: woqcwg_id,
                data: JSON.stringify(w)
            });

            return [woqcwg_id, stide_id, w.bom_id, w.material_number, w.component_name, w.waste_type, w.waste_weight, w.unit, w.treatment_type];
        });

        childInserts.push(bulkInsert(
            client,
            'weight_of_quality_control_waste_generated_questions',
            ['woqcwg_id', 'stide_id', 'bom_id', 'material_number', 'component_name', 'waste_type', 'waste_weight', 'unit', 'treatment_type'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_weight_of_quality_control_waste_generated_qforty',
            columns: ['woqcwgqf_id', 'sgiq_id', 'woqcwg_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ40
        });
    }

    if (Array.isArray(data.energy_consumption_for_qfortyfour_questions) && data.energy_consumption_for_qfortyfour_questions.length > 0) {

        const dqrQ44: any[] = [];

        const rows = data.energy_consumption_for_qfortyfour_questions.map((e: any) => {
            const ecfqff_id = ulid();

            dqrQ44.push({
                childId: ecfqff_id,
                data: JSON.stringify({
                    energy_purchased: e.energy_purchased,
                    energy_type: e.energy_type,
                    quantity: e.quantity,
                    unit: e.unit
                })
            });

            return [
                ecfqff_id,
                stide_id,
                e.energy_purchased,
                e.energy_type,
                e.quantity,
                e.unit
            ];
        });

        childInserts.push(bulkInsert(
            client,
            'energy_consumption_for_qfortyfour_questions',
            ['ecfqff_id', 'stide_id', 'energy_purchased', 'energy_type', 'quantity', 'unit'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_energy_consumption_for_qfortyfour_qfortyfour',
            columns: ['ecfqffqff_id', 'sgiq_id', 'ecfqff_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ44
        });
    }

    if (Array.isArray(data.cloud_provider_details_questions) && data.cloud_provider_details_questions.length > 0) {

        const dqrQ46: any[] = [];

        const rows = data.cloud_provider_details_questions.map((c: any) => {
            const cpd_id = ulid();

            dqrQ46.push({
                childId: cpd_id,
                data: JSON.stringify({
                    cloud_provider_name: c.cloud_provider_name,
                    virtual_machines: c.virtual_machines,
                    data_storage: c.data_storage,
                    data_transfer: c.data_transfer
                })
            });

            return [
                cpd_id,
                stide_id,
                c.cloud_provider_name,
                c.virtual_machines,
                c.data_storage,
                c.data_transfer
            ];
        });

        childInserts.push(bulkInsert(
            client,
            'cloud_provider_details_questions',
            ['cpd_id', 'stide_id', 'cloud_provider_name', 'virtual_machines', 'data_storage', 'data_transfer'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_cloud_provider_details_qfortysix',
            columns: ['cpdqfs_id', 'sgiq_id', 'cpd_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ46
        });
    }

    if (Array.isArray(data.dedicated_monitoring_sensor_usage_questions) && data.dedicated_monitoring_sensor_usage_questions.length > 0) {

        const dqrQ47: any[] = [];

        const rows = data.dedicated_monitoring_sensor_usage_questions.map((d: any) => {
            const dmsu_id = ulid();

            dqrQ47.push({
                childId: dmsu_id,
                data: JSON.stringify({
                    type_of_sensor: d.type_of_sensor,
                    sensor_quantity: d.sensor_quantity,
                    energy_consumption: d.energy_consumption,
                    unit: d.unit
                })
            });

            return [
                dmsu_id,
                stide_id,
                d.type_of_sensor,
                d.sensor_quantity,
                d.energy_consumption,
                d.unit
            ];
        });

        childInserts.push(bulkInsert(
            client,
            'dedicated_monitoring_sensor_usage_questions',
            ['dmsu_id', 'stide_id', 'type_of_sensor', 'sensor_quantity', 'energy_consumption', 'unit'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_dedicated_monitoring_sensor_usage_qfortyseven',
            columns: ['dmsuqfs_id', 'sgiq_id', 'dmsu_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ47
        });
    }


    if (Array.isArray(data.annual_replacement_rate_of_sensor_questions) && data.annual_replacement_rate_of_sensor_questions.length > 0) {

        const dqrQ48: any[] = [];

        const rows = data.annual_replacement_rate_of_sensor_questions.map((a: any) => {
            const arros_id = ulid();

            dqrQ48.push({
                childId: arros_id,
                data: JSON.stringify({
                    consumable_name: a.consumable_name,
                    quantity: a.quantity,
                    unit: a.unit
                })
            });

            return [
                arros_id,
                stide_id,
                a.consumable_name,
                a.quantity,
                a.unit
            ];
        });

        childInserts.push(bulkInsert(
            client,
            'annual_replacement_rate_of_sensor_questions',
            ['arros_id', 'stide_id', 'consumable_name', 'quantity', 'unit'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_annual_replacement_rate_of_sensor_qfortyeight',
            columns: ['arrosqfe_id', 'sgiq_id', 'arros_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ48
        });
    }

    if (Array.isArray(data.energy_consumption_for_qfiftyone_questions) && data.energy_consumption_for_qfiftyone_questions.length > 0) {

        const dqrQ51: any[] = [];

        const rows = data.energy_consumption_for_qfiftyone_questions.map((e: any) => {
            const ecfqfo_id = ulid();

            dqrQ51.push({
                childId: ecfqfo_id,
                data: JSON.stringify({
                    energy_purchased: e.energy_purchased,
                    energy_type: e.energy_type,
                    quantity: e.quantity,
                    unit: e.unit
                })
            });

            return [
                ecfqfo_id,
                stide_id,
                e.energy_purchased,
                e.energy_type,
                e.quantity,
                e.unit
            ];
        });

        childInserts.push(bulkInsert(
            client,
            'energy_consumption_for_qfiftyone_questions',
            ['ecfqfo_id', 'stide_id', 'energy_purchased', 'energy_type', 'quantity', 'unit'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_energy_consumption_for_qfiftyone_qfiftyone',
            columns: ['ecfqfoqfo_id', 'sgiq_id', 'ecfqfo_id', 'data'],
            parentId: sgiq_id,
            records: dqrQ51
        });
    }


    await Promise.all(childInserts);

    console.log(`Creating ${allDQRConfigs.length} DQR table entries...`);
    await createDQRRecords(client, allDQRConfigs);
}

async function insertScopeThree(client: any, data: any, sgiq_id: string, annual_reporting_period: string) {
    const stoie_id = ulid();
    const allDQRConfigs: any[] = [];

    // Insert parent
    await client.query(
        `INSERT INTO scope_three_other_indirect_emissions_questions (
            stoie_id, sgiq_id, raw_materials_contact_enviguide_support,
            grade_of_metal_used, msds_link_or_upload_document,
            use_of_recycled_secondary_materials, percentage_of_pre_post_consumer_material_used_in_product,
            do_you_use_recycle_mat_for_packaging, percentage_of_recycled_content_used_in_packaging,
            do_you_use_electricity_for_packaging, energy_con_included_total_energy_pur_sec_two_qsixtysix,
            internal_or_external_waste_material_per_recycling, any_by_product_generated,
            do_you_track_emission_from_transport, mode_of_transport_used_for_transportation,
            mode_of_transport_enviguide_support, iso_14001_or_iso_50001_certified,
            standards_followed_iso_14067_GHG_catena_etc, do_you_report_to_cdp_sbti_or_other,
            measures_to_reduce_carbon_emissions_in_production, renewable_energy_initiatives_or_recycling_programs,
            your_company_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
        [
            stoie_id, sgiq_id,
            data.raw_materials_contact_enviguide_support ?? false,
            data.grade_of_metal_used,
            data.msds_link_or_upload_document,
            data.use_of_recycled_secondary_materials ?? false,
            data.percentage_of_pre_post_consumer_material_used_in_product ?? false,
            data.do_you_use_recycle_mat_for_packaging ?? false,
            data.percentage_of_recycled_content_used_in_packaging,
            data.do_you_use_electricity_for_packaging ?? false,
            data.energy_con_included_total_energy_pur_sec_two_qsixtysix ?? false,
            data.internal_or_external_waste_material_per_recycling,
            data.any_by_product_generated ?? false,
            data.do_you_track_emission_from_transport ?? false,
            data.mode_of_transport_used_for_transportation ?? false,
            data.mode_of_transport_enviguide_support ?? false,
            data.iso_14001_or_iso_50001_certified ?? false,
            data.standards_followed_iso_14067_GHG_catena_etc ?? false,
            data.do_you_report_to_cdp_sbti_or_other ?? false,
            data.measures_to_reduce_carbon_emissions_in_production,
            data.renewable_energy_initiatives_or_recycling_programs,
            data.your_company_info
        ]
    );

    const dqrQ53: any[] = [];
    dqrQ53.push({
        childId: stoie_id,
        data: data.grade_of_metal_used
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_three_other_indirect_emissions_qfiftythree',
        columns: ['stoieqft_id', 'sgiq_id', 'stoie_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ53
    });

    const dqrQ54: any[] = [];
    dqrQ54.push({
        childId: stoie_id,
        data: data.msds_link_or_upload_document
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_three_other_indirect_emissions_qfiftyfour',
        columns: ['stoieqff_id', 'sgiq_id', 'stoie_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ54
    });

    const dqrQ64: any[] = [];
    dqrQ64.push({
        childId: stoie_id,
        data: data.percentage_of_recycled_content_used_in_packaging
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_three_other_indirect_emissions_qsixtyfour',
        columns: ['stoieqsf_id', 'sgiq_id', 'stoie_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ64
    });

    const dqrQ69: any[] = [];
    dqrQ69.push({
        childId: stoie_id,
        data: data.internal_or_external_waste_material_per_recycling
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_three_other_indirect_emissions_qsixtynine',
        columns: ['stoieqsn_id', 'sgiq_id', 'stoie_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ69
    });


    const dqrQ79: any[] = [];
    dqrQ79.push({
        childId: stoie_id,
        data: data.measures_to_reduce_carbon_emissions_in_production
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_three_other_indirect_emissions_qseventynine',
        columns: ['stoieqsn_id', 'sgiq_id', 'stoie_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ79
    });

    const dqrQ80: any[] = [];
    dqrQ80.push({
        childId: stoie_id,
        data: data.renewable_energy_initiatives_or_recycling_programs
    });
    allDQRConfigs.push({
        tableName: 'dqr_scope_three_other_indirect_emissions_qeighty',
        columns: ['stoieqe_id', 'sgiq_id', 'stoie_id', 'data'],
        parentId: sgiq_id,
        records: dqrQ80
    });

    const childInserts = [];

    // const tableConfigs = [
    //     {
    //         data: data.raw_materials_used_in_component_manufacturing_questions,
    //         table: 'raw_materials_used_in_component_manufacturing_questions',
    //         columns: ['rmuicm_id', 'stoie_id', 'material_name', 'percentage'],
    //         mapper: (m: any) => [ulid(), stoie_id, m.material_name, m.percentage]
    //     },
    //     {
    //         data: data.recycled_materials_with_percentage_questions,
    //         table: 'recycled_materials_with_percentage_questions',
    //         columns: ['rmwp_id', 'stoie_id', 'material_name', 'percentage'],
    //         mapper: (r: any) => [ulid(), stoie_id, r.material_name, r.percentage]
    //     },
    //     {
    //         data: data.pre_post_consumer_reutilization_percentage_questions,
    //         table: 'pre_post_consumer_reutilization_percentage_questions',
    //         columns: ['ppcrp_id', 'stoie_id', 'material_type', 'percentage'],
    //         mapper: (p: any) => [ulid(), stoie_id, p.material_type, p.percentage]
    //     },
    //     {
    //         data: data.pir_pcr_material_percentage_questions,
    //         table: 'pir_pcr_material_percentage_questions',
    //         columns: ['ppmp_id', 'stoie_id', 'material_type', 'percentage'],
    //         mapper: (p: any) => [ulid(), stoie_id, p.material_type, p.percentage]
    //     },
    //     {
    //         data: data.type_of_pack_mat_used_for_delivering_questions,
    //         table: 'type_of_pack_mat_used_for_delivering_questions',
    //         columns: ['topmudp_id', 'stoie_id', 'component_name', 'packagin_type', 'packaging_size', 'unit'],
    //         mapper: (p: any) => [ulid(), stoie_id, p.component_name, p.packagin_type, p.packaging_size, p.unit]
    //     },
    //     {
    //         data: data.weight_of_packaging_per_unit_product_questions,
    //         table: 'weight_of_packaging_per_unit_product_questions',
    //         columns: ['woppup_id', 'stoie_id', 'component_name', 'packagin_weight', 'unit'],
    //         mapper: (w: any) => [ulid(), stoie_id, w.component_name, w.packagin_weight, w.unit]
    //     },
    //     {
    //         data: data.energy_consumption_for_qsixtyseven_questions,
    //         table: 'energy_consumption_for_qsixtyseven_questions',
    //         columns: ['ecfqss_id', 'stoie_id', 'energy_purchased', 'energy_type', 'quantity', 'unit'],
    //         mapper: (e: any) => [ulid(), stoie_id, e.energy_purchased, e.energy_type, e.quantity, e.unit]
    //     },
    //     {
    //         data: data.weight_of_pro_packaging_waste_questions,
    //         table: 'weight_of_pro_packaging_waste_questions',
    //         columns: ['woppw_id', 'stoie_id', 'waste_type', 'waste_weight', 'unit', 'treatment_type'],
    //         mapper: (w: any) => [ulid(), stoie_id, w.waste_type, w.waste_weight, w.unit, w.treatment_type]
    //     },
    //     {
    //         data: data.type_of_by_product_questions,
    //         table: 'type_of_by_product_questions',
    //         columns: ['topbp_id', 'stoie_id', 'component_name', 'by_product', 'price_per_product', 'quantity'],
    //         mapper: (b: any) => [ulid(), stoie_id, b.component_name, b.by_product, b.price_per_product, b.quantity]
    //     },
    //     {
    //         data: data.co_two_emission_of_raw_material_questions,
    //         table: 'co_two_emission_of_raw_material_questions',
    //         columns: ['coteorm_id', 'stoie_id', 'raw_material_name', 'transport_mode', 'source_location', 'destination_location', 'co_two_emission'],
    //         mapper: (c: any) => [ulid(), stoie_id, c.raw_material_name, c.transport_mode, c.source_location, c.destination_location, c.co_two_emission]
    //     },
    //     {
    //         data: data.mode_of_transport_used_for_transportation_questions,
    //         table: 'mode_of_transport_used_for_transportation_questions',
    //         columns: ['motuft_id', 'stoie_id', 'mode_of_transport', 'weight_transported', 'source_point', 'drop_point', 'distance'],
    //         mapper: (t: any) => [ulid(), stoie_id, t.mode_of_transport, t.weight_transported, t.source_point, t.drop_point, t.distance]
    //     },
    //     {
    //         data: data.destination_plant_component_transportation_questions,
    //         table: 'destination_plant_component_transportation_questions',
    //         columns: ['dpct_id', 'stoie_id', 'country', 'state', 'city', 'pincode'],
    //         mapper: (d: any) => [ulid(), stoie_id, d.country, d.state, d.city, d.pincode]
    //     }
    // ];

    // for (const config of tableConfigs) {
    //     if (Array.isArray(config.data) && config.data.length > 0) {
    //         childInserts.push(bulkInsert(client, config.table, config.columns, config.data.map(config.mapper)));
    //     }
    // }

    if (Array.isArray(data.raw_materials_used_in_component_manufacturing_questions)) {

        const dqr52: any[] = [];

        const rows = data.raw_materials_used_in_component_manufacturing_questions.map((m: any) => {
            const rmuicm_id = ulid();

            prepareDQR({
                records: dqr52,
                childId: rmuicm_id,
                payload: {
                    bom_id: m.bom_id,
                    material_number: m.material_number,
                    material_name: m.material_name,
                    percentage: m.percentage,
                    annual_reporting_period
                }
            });

            return [rmuicm_id, stoie_id, m.bom_id, m.material_number, m.material_name, m.percentage, annual_reporting_period];
        });

        childInserts.push(bulkInsert(
            client,
            'raw_materials_used_in_component_manufacturing_questions',
            ['rmuicm_id', 'stoie_id', 'bom_id', 'material_number', 'material_name', 'percentage', 'annual_reporting_period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_raw_materials_used_in_component_manufacturing_qfiftytwo',
            columns: ['rmuicmqft_id', 'sgiq_id', 'rmuicm_id', 'data'],
            parentId: sgiq_id,
            records: dqr52
        });
    }

    if (Array.isArray(data.recycled_materials_with_percentage_questions)) {

        const dqr56: any[] = [];

        const rows = data.recycled_materials_with_percentage_questions.map((r: any) => {
            const rmwp_id = ulid();

            prepareDQR({
                records: dqr56,
                childId: rmwp_id,
                payload: {
                    bom_id: r.bom_id,
                    material_number: r.material_number,
                    material_name: r.material_name,
                    percentage: r.percentage
                }
            });

            return [rmwp_id, stoie_id, r.bom_id, r.material_number, r.material_name, r.percentage];
        });

        childInserts.push(bulkInsert(
            client,
            'recycled_materials_with_percentage_questions',
            ['rmwp_id', 'stoie_id', 'bom_id', 'material_number', 'material_name', 'percentage'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_recycled_materials_with_percentage_qfiftysix',
            columns: ['rmwpqfs_id', 'sgiq_id', 'rmwp_id', 'data'],
            parentId: sgiq_id,
            records: dqr56
        });
    }

    if (Array.isArray(data.pre_post_consumer_reutilization_percentage_questions)) {

        const dqr58: any[] = [];

        const rows = data.pre_post_consumer_reutilization_percentage_questions.map((p: any) => {
            const ppcrp_id = ulid();

            prepareDQR({
                records: dqr58,
                childId: ppcrp_id,
                payload: {
                    material_type: p.material_type,
                    percentage: p.percentage
                }
            });

            return [ppcrp_id, stoie_id, p.material_type, p.percentage];
        });

        childInserts.push(bulkInsert(
            client,
            'pre_post_consumer_reutilization_percentage_questions',
            ['ppcrp_id', 'stoie_id', 'material_type', 'percentage'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_pre_post_consumer_reutilization_percentage_qfiftyeight',
            columns: ['ppcrpqfe_id', 'sgiq_id', 'ppcrp_id', 'data'],
            parentId: sgiq_id,
            records: dqr58
        });
    }

    if (Array.isArray(data.pir_pcr_material_percentage_questions)) {

        const dqr59: any[] = [];

        const rows = data.pir_pcr_material_percentage_questions.map((p: any) => {
            const ppmp_id = ulid();

            prepareDQR({
                records: dqr59,
                childId: ppmp_id,
                payload: {
                    material_type: p.material_type,
                    percentage: p.percentage
                }
            });

            return [ppmp_id, stoie_id, p.material_type, p.percentage];
        });

        childInserts.push(bulkInsert(
            client,
            'pir_pcr_material_percentage_questions',
            ['ppmp_id', 'stoie_id', 'material_type', 'percentage'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_pir_pcr_material_percentage_qfiftynine',
            columns: ['ppmpqfn_id', 'sgiq_id', 'ppmp_id', 'data'],
            parentId: sgiq_id,
            records: dqr59
        });
    }

    if (Array.isArray(data.type_of_pack_mat_used_for_delivering_questions)) {

        const dqr60: any[] = [];

        const rows = data.type_of_pack_mat_used_for_delivering_questions.map((p: any) => {
            const topmudp_id = ulid();

            prepareDQR({
                records: dqr60,
                childId: topmudp_id,
                payload: p
            });

            return [topmudp_id, stoie_id, p.bom_id, p.material_number, p.component_name, p.packagin_type, p.packaging_size, p.unit, p.treatment_type];
        });

        childInserts.push(bulkInsert(
            client,
            'type_of_pack_mat_used_for_delivering_questions',
            ['topmudp_id', 'stoie_id', 'bom_id', 'material_number', 'component_name', 'packagin_type', 'packaging_size', 'unit', 'treatment_type'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_type_of_pack_mat_used_for_delivering_qsixty',
            columns: ['topmudpqs_id', 'sgiq_id', 'topmudp_id', 'data'],
            parentId: sgiq_id,
            records: dqr60
        });
    }

    if (Array.isArray(data.weight_of_packaging_per_unit_product_questions)) {

        const dqr61: any[] = [];

        const rows = data.weight_of_packaging_per_unit_product_questions.map((w: any) => {
            const woppup_id = ulid();

            prepareDQR({
                records: dqr61,
                childId: woppup_id,
                payload: w
            });

            return [woppup_id, stoie_id, w.bom_id, w.material_number, w.component_name, w.packagin_weight, w.unit];
        });

        childInserts.push(bulkInsert(
            client,
            'weight_of_packaging_per_unit_product_questions',
            ['woppup_id', 'stoie_id', 'bom_id', 'material_number', 'component_name', 'packagin_weight', 'unit'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_weight_of_packaging_per_unit_product_qsixtyone',
            columns: ['woppupqso_id', 'sgiq_id', 'woppup_id', 'data'],
            parentId: sgiq_id,
            records: dqr61
        });
    }

    if (Array.isArray(data.energy_consumption_for_qsixtyseven_questions)) {

        const dqr67: any[] = [];

        const rows = data.energy_consumption_for_qsixtyseven_questions.map((e: any) => {
            const ecfqss_id = ulid();

            prepareDQR({
                records: dqr67,
                childId: ecfqss_id,
                payload: e
            });

            return [ecfqss_id, stoie_id, e.energy_purchased, e.energy_type, e.quantity, e.unit];
        });

        childInserts.push(bulkInsert(
            client,
            'energy_consumption_for_qsixtyseven_questions',
            ['ecfqss_id', 'stoie_id', 'energy_purchased', 'energy_type', 'quantity', 'unit'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_energy_consumption_for_qsixtyseven_qsixtyseven',
            columns: ['ecfqssqss_id', 'sgiq_id', 'ecfqss_id', 'data'],
            parentId: sgiq_id,
            records: dqr67
        });
    }

    if (Array.isArray(data.weight_of_pro_packaging_waste_questions)) {

        const dqr68: any[] = [];

        const rows = data.weight_of_pro_packaging_waste_questions.map((w: any) => {
            const woppw_id = ulid();

            prepareDQR({
                records: dqr68,
                childId: woppw_id,
                payload: {
                    bom_id: w.bom_id,
                    material_number: w.material_number,
                    component_name: w.component_name,
                    waste_type: w.waste_type,
                    waste_weight: w.waste_weight,
                    unit: w.unit,
                    treatment_type: w.treatment_type,
                    annual_reporting_period
                }
            });

            return [woppw_id, stoie_id, w.bom_id, w.material_number, w.component_name, w.waste_type, w.waste_weight, w.unit, w.treatment_type, annual_reporting_period];
        });

        childInserts.push(bulkInsert(
            client,
            'weight_of_pro_packaging_waste_questions',
            ['woppw_id', 'stoie_id', 'bom_id', 'material_number', 'component_name', 'waste_type', 'waste_weight', 'unit', 'treatment_type', 'annual_reporting_period'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_weight_of_pro_packaging_waste_qsixtyeight',
            columns: ['woppwqse_id', 'sgiq_id', 'woppw_id', 'data'],
            parentId: sgiq_id,
            records: dqr68
        });
    }

    if (Array.isArray(data.type_of_by_product_questions)) {

        const dqr71: any[] = [];

        const rows = data.type_of_by_product_questions.map((b: any) => {
            const topbp_id = ulid();

            prepareDQR({
                records: dqr71,
                childId: topbp_id,
                payload: {
                    bom_id: b.bom_id,
                    material_number: b.material_number,
                    component_name: b.component_name,
                    by_product: b.by_product,
                    price_per_product: b.price_per_product,
                    quantity: b.quantity
                }
            });

            return [topbp_id, stoie_id, b.bom_id, b.material_number, b.component_name, b.by_product, b.price_per_product, b.quantity];
        });

        childInserts.push(bulkInsert(
            client,
            'type_of_by_product_questions',
            ['topbp_id', 'stoie_id', 'bom_id', 'material_number', 'component_name', 'by_product', 'price_per_product', 'quantity'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_type_of_by_product_qseventyone',
            columns: ['topbpqso_id', 'sgiq_id', 'topbp_id', 'data'],
            parentId: sgiq_id,
            records: dqr71
        });
    }

    if (Array.isArray(data.co_two_emission_of_raw_material_questions)) {

        const dqr73: any[] = [];

        const rows = data.co_two_emission_of_raw_material_questions.map((c: any) => {
            const coteorm_id = ulid();

            prepareDQR({
                records: dqr73,
                childId: coteorm_id,
                payload: {
                    bom_id: c.bom_id,
                    material_number: c.material_number,
                    component_name: c.component_name,
                    raw_material_name: c.raw_material_name,
                    transport_mode: c.transport_mode,
                    source_location: c.source_location,
                    destination_location: c.destination_location,
                    co_two_emission: c.co_two_emission
                }
            });

            return [
                coteorm_id,
                stoie_id,
                c.bom_id,
                c.material_number,
                c.component_name,
                c.raw_material_name,
                c.transport_mode,
                c.source_location,
                c.destination_location,
                c.co_two_emission
            ];
        });

        childInserts.push(bulkInsert(
            client,
            'co_two_emission_of_raw_material_questions',
            ['coteorm_id', 'stoie_id', 'bom_id', 'material_number', 'component_name', 'raw_material_name', 'transport_mode', 'source_location', 'destination_location', 'co_two_emission'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_co_two_emission_of_raw_material_qseventythree',
            columns: ['coteormqst_id', 'sgiq_id', 'coteorm_id', 'data'],
            parentId: sgiq_id,
            records: dqr73
        });
    }

    if (Array.isArray(data.mode_of_transport_used_for_transportation_questions)) {

        const dqr74: any[] = [];

        const rows = data.mode_of_transport_used_for_transportation_questions.map((t: any) => {
            const motuft_id = ulid();

            prepareDQR({
                records: dqr74,
                childId: motuft_id,
                payload: {
                    bom_id: t.bom_id,
                    material_number: t.material_number,
                    component_name: t.component_name,
                    mode_of_transport: t.mode_of_transport,
                    weight_transported: t.weight_transported,
                    source_point: t.source_point,
                    drop_point: t.drop_point,
                    distance: t.distance
                }
            });

            return [
                motuft_id,
                stoie_id,
                t.bom_id,
                t.material_number,
                t.component_name,
                t.mode_of_transport,
                t.weight_transported,
                t.source_point,
                t.drop_point,
                t.distance
            ];
        });

        childInserts.push(bulkInsert(
            client,
            'mode_of_transport_used_for_transportation_questions',
            ['motuft_id', 'stoie_id', 'bom_id', 'material_number', 'component_name', 'mode_of_transport', 'weight_transported', 'source_point', 'drop_point', 'distance'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_mode_of_transport_used_for_transportation_qseventyfour',
            columns: ['motuftqsf_id', 'sgiq_id', 'motuft_id', 'data'],
            parentId: sgiq_id,
            records: dqr74
        });
    }

    if (Array.isArray(data.destination_plant_component_transportation_questions)) {

        const dqr75: any[] = [];

        const rows = data.destination_plant_component_transportation_questions.map((d: any) => {
            const dpct_id = ulid();

            prepareDQR({
                records: dqr75,
                childId: dpct_id,
                payload: {
                    country: d.country,
                    state: d.state,
                    city: d.city,
                    pincode: d.pincode
                }
            });

            return [dpct_id, stoie_id, d.country, d.state, d.city, d.pincode];
        });

        childInserts.push(bulkInsert(
            client,
            'destination_plant_component_transportation_questions',
            ['dpct_id', 'stoie_id', 'country', 'state', 'city', 'pincode'],
            rows
        ));

        allDQRConfigs.push({
            tableName: 'dqr_destination_plant_component_transportation_qseventyfive',
            columns: ['dpctqsf_id', 'sgiq_id', 'dpct_id', 'data'],
            parentId: sgiq_id,
            records: dqr75
        });
    }

    await Promise.all(childInserts);
    console.log(`Creating ${allDQRConfigs.length} DQR table entries...`);
    await createDQRRecords(client, allDQRConfigs);
}

async function insertScopeFour(client: any, data: any, sgiq_id: string) {
    const sfae_id = ulid();

    await client.query(
        `INSERT INTO scope_four_avoided_emissions_questions (
            sfae_id, sgiq_id, products_or_services_that_help_reduce_customer_emissions,
            circular_economy_practices_reuse_take_back_epr_refurbishment, 
            renewable_energy_carbon_offset_projects_implemented
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
            sfae_id, sgiq_id,
            data.products_or_services_that_help_reduce_customer_emissions ?? false,
            data.circular_economy_practices_reuse_take_back_epr_refurbishment,
            data.renewable_energy_carbon_offset_projects_implemented
        ]
    );
}

// DQR HELPER FUNCTION
async function createDQRRecords(client: any, dqrConfigs: any[]) {
    const insertPromises = [];

    for (const config of dqrConfigs) {
        if (config.records && config.records.length > 0) {
            const values: any[] = [];
            const placeholders: string[] = [];
            let index = 1;

            for (const record of config.records) {
                placeholders.push(`($${index++}, $${index++}, $${index++}, $${index++})`);
                values.push(
                    ulid(),                    // dqr_id
                    config.parentId,           // parent FK (sgiq_id, sode_id, etc.)
                    record.childId,            // child FK (aosotte_id, etc.)
                    JSON.stringify(record.data)
                );
            }

            const query = `
                INSERT INTO ${config.tableName} 
                (${config.columns.join(', ')})
                VALUES ${placeholders.join(', ')}
            `;

            insertPromises.push(client.query(query, values));
        }
    }

    if (insertPromises.length > 0) {
        await Promise.all(insertPromises);
    }
}

function prepareDQR({
    records,
    childId,
    payload
}: {
    records: any[],
    childId: string,
    payload: any
}) {
    records.push({
        childId,
        data: JSON.stringify(payload)
    });
}
// it will end here

export async function getSupplierDetailsList(req: any, res: any) {
    try {
        const page = Number(req.query.pageNumber) || 1;
        const limit = Number(req.query.pageSize) || 10;
        const offset = (page - 1) * limit;

        return withClient(async (client: any) => {
            // Total count
            const countResult = await client.query(
                `SELECT COUNT(*) FROM supplier_general_info_questions`
            );

            const totalRecords = Number(countResult.rows[0].count);
            const totalPages = Math.ceil(totalRecords / limit);

            // Data query
            const dataQuery = `
            WITH base_data AS (
    SELECT
        sgiq.*,

        -- Supplier Object
        json_build_object(
            'sup_id', sd.sup_id,
            'code', sd.code,
            'supplier_name', sd.supplier_name,
            'supplier_email', sd.supplier_email,
            'supplier_phone_number', sd.supplier_phone_number
        ) AS supplier_details,

        -- BOM ARRAY (IMPORTANT CHANGE)
        (
            SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'bom_id', b.id,
                        'material_number', b.material_number,
                        'component_name', b.component_name,
                        'production_location', b.production_location
                    )
                    ORDER BY b.created_date DESC
                ),
                '[]'::json
            )
            FROM bom b
            WHERE b.bom_pcf_id = sgiq.bom_pcf_id
              AND b.supplier_id = sgiq.sup_id
        ) AS bom,

        -- BOM PCF Object
        json_build_object(
            'pcf_id', pcf.id,
            'code', pcf.code,
            'request_title', pcf.request_title,
            'priority', pcf.priority,
            'request_organization', pcf.request_organization,
            'due_date', pcf.due_date,
            'request_description', pcf.request_description
        ) AS bom_pcf

    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_details sd 
        ON sd.sup_id = sgiq.sup_id
    LEFT JOIN bom_pcf_request pcf 
        ON pcf.id = sgiq.bom_pcf_id
)

SELECT
    bd.*,

    -- Conditional Scope 1,2,3 Emissions
    CASE
        WHEN bd.availability_of_scope_one_two_three_emissions_data = true
        THEN (
            SELECT json_agg(
                json_build_object(
                    'aosotte_id', aos.aosotte_id,
                    'country_iso_three', aos.country_iso_three,
                    'scope_one', aos.scope_one,
                    'scope_two', aos.scope_two,
                    'scope_three', aos.scope_three
                )
            )
            FROM availability_of_scope_one_two_three_emissions_questions aos
            WHERE aos.sgiq_id = bd.sgiq_id
        )
        ELSE NULL
    END AS scope_one_two_three_emissions

FROM base_data bd
ORDER BY bd.created_date DESC
LIMIT $1 OFFSET $2;

        `;

            const result = await client.query(dataQuery, [limit, offset]);

            return res.status(200).json({
                status: true,
                message: "Supplier General Info List",
                pagination: {
                    page,
                    limit,
                    totalRecords,
                    totalPages
                },
                data: result.rows
            });
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
}

export async function getSupplierDetailsById(req: any, res: any) {
    const sgiq_id = req.query.sgiq_id;
    try {

        return withClient(async (client: any) => {
            // Data query
            const dataQuery = `
            WITH base_data AS (
    SELECT
        to_jsonb(sgiq) AS supplier_general_info,

        to_jsonb(sd) AS supplier_details,
        /* ---------- BOM ARRAY (FIXED) ---------- */
        (
            SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'bom_id', b.id,
                        'code', b.code,
                        'material_number', b.material_number,
                        'component_name', b.component_name,
                        'production_location', b.production_location
                    )
                    ORDER BY b.created_date DESC
                ),
                '[]'::json
            )
            FROM bom b
            WHERE b.bom_pcf_id = sgiq.bom_pcf_id
              AND b.supplier_id = sgiq.sup_id
        ) AS bom,
        to_jsonb(pcf) AS bom_pcf

    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_details sd ON sd.sup_id = sgiq.sup_id
    LEFT JOIN bom_pcf_request pcf ON pcf.id = sgiq.bom_pcf_id
    WHERE sgiq.sgiq_id = $1
)

SELECT
    bd.*,

    /* ---------- Scope 1,2,3 Availability ---------- */
    (
        SELECT json_agg(to_jsonb(aos))
        FROM availability_of_scope_one_two_three_emissions_questions aos
        WHERE aos.sgiq_id = (bd.supplier_general_info->>'sgiq_id')
    ) AS availability_of_scope_one_two_three_emissions,

    /* ---------- Supplier Product Questions ---------- */
    (
        SELECT json_agg(
            to_jsonb(spq) || jsonb_build_object(

                'production_site_details_questions',
                (
                    SELECT json_agg(to_jsonb(psd))
                    FROM production_site_details_questions psd
                    WHERE psd.spq_id = spq.spq_id
                ),

                'product_component_manufactured_questions',
                (
                    SELECT json_agg(to_jsonb(pcm))
                    FROM product_component_manufactured_questions pcm
                    WHERE pcm.spq_id = spq.spq_id
                ),

                'co_product_component_economic_value_questions',
                (
                    SELECT json_agg(to_jsonb(cpcev))
                    FROM co_product_component_economic_value_questions cpcev
                    WHERE cpcev.spq_id = spq.spq_id
                )
            )
        )
        FROM supplier_product_questions spq
        WHERE spq.sgiq_id = (bd.supplier_general_info->>'sgiq_id')
    ) AS supplier_product_questions,

    /* ---------- Scope One Direct Emissions ---------- */
    (
        SELECT json_agg(
            to_jsonb(sode) || jsonb_build_object(

                'stationary_combustion_on_site_energy_use_questions',
                (
                    SELECT json_agg(
                        to_jsonb(scoseu) || jsonb_build_object(
                            'sub_fuel_types',
                            (
                                SELECT json_agg(to_jsonb(ssft))
                                FROM scoseu_sub_fuel_type_questions ssft
                                WHERE ssft.scoseu_id = scoseu.scoseu_id
                            )
                        )
                    )
                    FROM stationary_combustion_on_site_energy_use_questions scoseu
                    WHERE scoseu.sode_id = sode.sode_id
                ),

                'mobile_combustion_company_owned_vehicles_questions',
                (
                    SELECT json_agg(to_jsonb(mccov))
                    FROM mobile_combustion_company_owned_vehicles_questions mccov
                    WHERE mccov.sode_id = sode.sode_id
                ),

                'refrigerants_questions',
                (
                    SELECT json_agg(to_jsonb(r))
                    FROM refrigerants_questions r
                    WHERE r.sode_id = sode.sode_id
                ),

                'process_emissions_sources_questions',
                (
                    SELECT json_agg(to_jsonb(pes))
                    FROM process_emissions_sources_questions pes
                    WHERE pes.sode_id = sode.sode_id
                )
            )
        )
        FROM scope_one_direct_emissions_questions sode
        WHERE sode.sgiq_id = (bd.supplier_general_info->>'sgiq_id')
    ) AS scope_one_direct_emissions_questions,
     /* ---------- Scope Two Indirect Emissions ---------- */
    (
        SELECT json_agg(
            to_jsonb(stide) || jsonb_build_object(

                'scope_two_indirect_emissions_from_purchased_energy_questions',
                (SELECT json_agg(to_jsonb(fpe)) FROM scope_two_indirect_emissions_from_purchased_energy_questions fpe WHERE fpe.stide_id = stide.stide_id),

                'scope_two_indirect_emissions_certificates_questions',
                (SELECT json_agg(to_jsonb(cer)) FROM scope_two_indirect_emissions_certificates_questions cer WHERE cer.stide_id = stide.stide_id),

                'energy_intensity_of_production_estimated_kwhor_mj_questions',
                (SELECT json_agg(to_jsonb(eip)) FROM energy_intensity_of_production_estimated_kwhor_mj_questions eip WHERE eip.stide_id = stide.stide_id),

                'process_specific_energy_usage_questions',
                (SELECT json_agg(to_jsonb(pseu)) FROM process_specific_energy_usage_questions pseu WHERE pseu.stide_id = stide.stide_id),

                'abatement_systems_used_questions',
                (SELECT json_agg(to_jsonb(asu)) FROM abatement_systems_used_questions asu WHERE asu.stide_id = stide.stide_id),

                'type_of_quality_control_equipment_usage_questions',
                (SELECT json_agg(to_jsonb(qc)) FROM type_of_quality_control_equipment_usage_questions qc WHERE qc.stide_id = stide.stide_id),

                'electricity_consumed_for_quality_control_questions',
                (SELECT json_agg(to_jsonb(ec)) FROM electricity_consumed_for_quality_control_questions ec WHERE ec.stide_id = stide.stide_id),

                'quality_control_process_usage_questions',
                (SELECT json_agg(to_jsonb(qcpu)) FROM quality_control_process_usage_questions qcpu WHERE qcpu.stide_id = stide.stide_id),

                'quality_control_process_usage_pressure_or_flow_questions',
                (SELECT json_agg(to_jsonb(qcpupf)) FROM quality_control_process_usage_pressure_or_flow_questions qcpupf WHERE qcpupf.stide_id = stide.stide_id),

                'quality_control_use_any_consumables_questions',
                (SELECT json_agg(to_jsonb(qcuac)) FROM quality_control_use_any_consumables_questions qcuac WHERE qcuac.stide_id = stide.stide_id),

                'weight_of_samples_destroyed_questions',
                (SELECT json_agg(to_jsonb(wosd)) FROM weight_of_samples_destroyed_questions wosd WHERE wosd.stide_id = stide.stide_id),

                'defect_or_rejection_rate_identified_by_quality_control_questions',
                (SELECT json_agg(to_jsonb(dor)) FROM defect_or_rejection_rate_identified_by_quality_control_questions dor WHERE dor.stide_id = stide.stide_id),

                'rework_rate_due_to_quality_control_questions',
                (SELECT json_agg(to_jsonb(rr)) FROM rework_rate_due_to_quality_control_questions rr WHERE rr.stide_id = stide.stide_id),

                'weight_of_quality_control_waste_generated_questions',
                (SELECT json_agg(to_jsonb(wqc)) FROM weight_of_quality_control_waste_generated_questions wqc WHERE wqc.stide_id = stide.stide_id),

                'cloud_provider_details_questions',
                (SELECT json_agg(to_jsonb(cpd)) FROM cloud_provider_details_questions cpd WHERE cpd.stide_id = stide.stide_id),

                'dedicated_monitoring_sensor_usage_questions',
                (SELECT json_agg(to_jsonb(dmsu)) FROM dedicated_monitoring_sensor_usage_questions dmsu WHERE dmsu.stide_id = stide.stide_id),

                'annual_replacement_rate_of_sensor_questions',
                (SELECT json_agg(to_jsonb(arros)) FROM annual_replacement_rate_of_sensor_questions arros WHERE arros.stide_id = stide.stide_id),

                'energy_consumption_for_qfiftyone_questions',
                (SELECT json_agg(to_jsonb(ec51)) FROM energy_consumption_for_qfiftyone_questions ec51 WHERE ec51.stide_id = stide.stide_id),

                'energy_consumption_for_qfortyfour_questions',
                (SELECT json_agg(to_jsonb(ec44)) FROM energy_consumption_for_qfortyfour_questions ec44 WHERE ec44.stide_id = stide.stide_id)

            )
        )
        FROM scope_two_indirect_emissions_questions stide
        WHERE stide.sgiq_id = (bd.supplier_general_info->>'sgiq_id')
    ) AS scope_two_indirect_emissions_questions ,
     /* ---------- Scope Three Other Indirect Emissions ---------- */
(
    SELECT json_agg(
        to_jsonb(stoie) || jsonb_build_object(

            'raw_materials_used_in_component_manufacturing_questions',
            (
                SELECT json_agg(to_jsonb(rm))
                FROM raw_materials_used_in_component_manufacturing_questions rm
                WHERE rm.stoie_id = stoie.stoie_id
            ),

            'recycled_materials_with_percentage_questions',
            (
                SELECT json_agg(to_jsonb(rmp))
                FROM recycled_materials_with_percentage_questions rmp
                WHERE rmp.stoie_id = stoie.stoie_id
            ),

            'pre_post_consumer_reutilization_percentage_questions',
            (
                SELECT json_agg(to_jsonb(ppcr))
                FROM pre_post_consumer_reutilization_percentage_questions ppcr
                WHERE ppcr.stoie_id = stoie.stoie_id
            ),

            'pir_pcr_material_percentage_questions',
            (
                SELECT json_agg(to_jsonb(ppmp))
                FROM pir_pcr_material_percentage_questions ppmp
                WHERE ppmp.stoie_id = stoie.stoie_id
            ),

            'type_of_pack_mat_used_for_delivering_questions',
            (
                SELECT json_agg(to_jsonb(tpm))
                FROM type_of_pack_mat_used_for_delivering_questions tpm
                WHERE tpm.stoie_id = stoie.stoie_id
            ),

            'weight_of_packaging_per_unit_product_questions',
            (
                SELECT json_agg(to_jsonb(wppu))
                FROM weight_of_packaging_per_unit_product_questions wppu
                WHERE wppu.stoie_id = stoie.stoie_id
            ),

            /* ---- Additional Q67+ Tables ---- */

            'energy_consumption_for_qsixtyseven_questions',
            (
                SELECT json_agg(to_jsonb(ec67))
                FROM energy_consumption_for_qsixtyseven_questions ec67
                WHERE ec67.stoie_id = stoie.stoie_id
            ),

            'weight_of_pro_packaging_waste_questions',
            (
                SELECT json_agg(to_jsonb(wppw))
                FROM weight_of_pro_packaging_waste_questions wppw
                WHERE wppw.stoie_id = stoie.stoie_id
            ),

            'type_of_by_product_questions',
            (
                SELECT json_agg(to_jsonb(tbp))
                FROM type_of_by_product_questions tbp
                WHERE tbp.stoie_id = stoie.stoie_id
            ),

            'co_two_emission_of_raw_material_questions',
            (
                SELECT json_agg(to_jsonb(co2))
                FROM co_two_emission_of_raw_material_questions co2
                WHERE co2.stoie_id = stoie.stoie_id
            ),

            'mode_of_transport_used_for_transportation_questions',
            (
                SELECT json_agg(to_jsonb(mot))
                FROM mode_of_transport_used_for_transportation_questions mot
                WHERE mot.stoie_id = stoie.stoie_id
            ),

            'destination_plant_component_transportation_questions',
            (
                SELECT json_agg(to_jsonb(dpct))
                FROM destination_plant_component_transportation_questions dpct
                WHERE dpct.stoie_id = stoie.stoie_id
            )

        )
    )
    FROM scope_three_other_indirect_emissions_questions stoie
    WHERE stoie.sgiq_id = (bd.supplier_general_info->>'sgiq_id')
) AS scope_three_other_indirect_emissions_questions ,
 /* ---------- Scope Four Avoided Emissions ---------- */
(
    SELECT json_agg(to_jsonb(sfae))
    FROM scope_four_avoided_emissions_questions sfae
    WHERE sfae.sgiq_id = (bd.supplier_general_info->>'sgiq_id')
) AS scope_four_avoided_emissions_questions



FROM base_data bd;

        `;

            const result = await client.query(dataQuery, [sgiq_id]);

            return res.status(200).json({
                status: true,
                message: "Supplier Questions Info",
                data: result.rows[0]
            });
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
}

export async function updateSupplierSustainabilityData(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query('BEGIN');

        try {
            const body = req.body;

            if (!body?.supplier_general_info_questions?.sgiq_id) {
                throw new Error('sgiq_id is required');
            }

            await updateSupplierSustainabilityService(client, body);

            await client.query('COMMIT');

            return res.send(
                generateResponse(true, 'Supplier sustainability data updated successfully', 200, 'Supplier sustainability data updated successfully')
            );
        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error(error);
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getPCFBOMListToAutoPop(req: any, res: any) {
    const { bom_pcf_id, sup_id } = req.query;

    return withClient(async (client: any) => {
        try {
            const query = `
                  SELECT 
                    b.id AS bom_id,
                    b.code AS bom_code,
                    b.material_number,
                    b.component_name,
                    b.supplier_id
                FROM bom b
                WHERE b.bom_pcf_id = $1 AND b.supplier_id=$2
                ORDER BY b.created_date DESC;
            `;

            const result = await client.query(query, [bom_pcf_id, sup_id]);

            if (result.rows.length === 0) {
                return res
                    .status(200)
                    .json(generateResponse(true, "No BOM records found in BOM", 200, []));
            }

            return res.status(200).json(
                generateResponse(true, "Fetched successfully", 200, result.rows)
            );
        } catch (error: any) {
            console.error("❌ Error in getPCFBOMListToAutoPop:", error);
            return res.status(500).json(
                generateResponse(false, "Something went wrong", 500, error.message)
            );
        }
    });
}

export async function updatePcfBomSupplierQuestionClickedStatus(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { bom_pcf_id, sup_id } = req.body;

            // Validate input
            if (!bom_pcf_id || !sup_id) {
                return res.send(generateResponse(false, "bom_pcf_id and sup_id is required", 400, null));
            }

            const is_question_clicked = true;

            const updateDataStage = `
                UPDATE pcf_request_data_collection_stage
                SET 
                    is_question_clicked = $1
                WHERE bom_pcf_id = $2 AND sup_id =$3
                RETURNING *;
            `;

            await client.query(updateDataStage, [is_question_clicked, bom_pcf_id, sup_id]);

            const task_status = 'In Progress';
            const updateTaskStatus = `
                UPDATE task_managment
                SET 
                    status = $1
                WHERE bom_pcf_id = $2
                RETURNING *;
            `;

            await client.query(updateTaskStatus, [task_status, bom_pcf_id]);

            // Success
            return res.send(
                generateResponse(true, "BOM PCF Supplier question clicked successfully", 200, "success")
            );

        } catch (error: any) {
            console.error("❌ Error in updateBomRejectionStatus:", error.message);
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}