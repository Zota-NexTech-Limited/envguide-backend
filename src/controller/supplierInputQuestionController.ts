import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

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

export async function addSupplierSustainabilityData(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query("BEGIN"); // start transaction

        try {
            const {
                bom_pcf_id,
                general_info,
                material_composition,
                energy_manufacturing,
                packaging,
                transportation_logistics,
                waste_by_products,
                end_of_life_circularity,
                emission_factors,
                certification_standards,
                additional_notes
            } = req.body;

            if (!bom_pcf_id) {
                return res.send(generateResponse(false, "bom_pcf_id is required", 400, null));
            }

            const user_id = req.user_id;

            general_info.bom_pcf_id = bom_pcf_id;
            general_info.updated_by = user_id;
            material_composition.updated_by = user_id;
            energy_manufacturing.updated_by = user_id;
            packaging.updated_by = user_id;
            transportation_logistics.updated_by = user_id;
            waste_by_products.updated_by = user_id;
            end_of_life_circularity.updated_by = user_id;
            emission_factors.updated_by = user_id;
            certification_standards.updated_by = user_id;
            additional_notes.updated_by = user_id;

            // Insert into supplier_general_info_questions
            const Code = `SIQ-${Date.now()}`;

            const sgiq_id = ulid();
            const generalInsert = `
                INSERT INTO supplier_general_info_questions (
                    sgiq_id, code, name_of_organization, core_business_activities,
                    company_site_address, designation, email_address,
                    type_of_product_manufacture, annul_or_monthly_product_volume_of_product,
                    weight_of_product, where_production_site_product_manufactured, price_of_product,
                    organization_annual_revenue, organization_annual_reporting_period, user_id,bom_pcf_id
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                RETURNING *;
            `;

            const generalResult = await client.query(generalInsert, [
                sgiq_id,
                Code,
                general_info.name_of_organization,
                general_info.core_business_activities,
                general_info.company_site_address,
                general_info.designation,
                general_info.email_address,
                general_info.type_of_product_manufacture,
                general_info.annul_or_monthly_product_volume_of_product,
                general_info.weight_of_product,
                general_info.where_production_site_product_manufactured,
                general_info.price_of_product,
                general_info.organization_annual_revenue,
                general_info.organization_annual_reporting_period,
                general_info.user_id,
                general_info.bom_pcf_id
            ]);

            // Material Composition
            if (material_composition) {
                await client.query(
                    `INSERT INTO material_composition_questions (id, sgiq_id, main_raw_materials_used, contact_enviguide_support, has_recycled_material_usage, percentage_recycled_material, knows_material_breakdown, percentage_pre_consumer, percentage_post_consumer, percentage_reutilization, has_recycled_copper, percentage_recycled_copper, has_recycled_aluminum, percentage_recycled_aluminum, has_recycled_steel, percentage_recycled_steel, has_recycled_plastics, percentage_total_recycled_plastics, percentage_recycled_thermoplastics, percentage_recycled_plastic_fillers, percentage_recycled_fibers, has_recycling_process, has_future_recycling_strategy, planned_recycling_year, track_transport_emissions, estimated_transport_emissions, need_support_for_emissions_calc, emission_calc_requirement, percentage_pcr, percentage_pir, use_bio_based_materials, bio_based_material_details, msds_or_composition_link, main_alloy_metals, metal_grade, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36);`,
                    [ulid(), sgiq_id, ...Object.values(material_composition)]
                );
            }

            // Energy Manufacturing
            if (energy_manufacturing) {
                await client.query(
                    `INSERT INTO energy_manufacturing_questions (id, sgiq_id, energy_sources_used, electricity_consumption_per_year, purchases_renewable_electricity, renewable_electricity_percentage, has_energy_calculation_method, energy_calculation_method_details, energy_intensity_per_unit, process_specific_energy_usage, enviguide_support, uses_abatement_systems, abatement_system_energy_consumption, water_consumption_and_treatment_details, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15);`,
                    [ulid(), sgiq_id, ...Object.values(energy_manufacturing)]
                );
            }

            // Packaging
            if (packaging) {
                await client.query(
                    `INSERT INTO packaging_questions (id, sgiq_id, packaging_materials_used, enviguide_support, packaging_weight_per_unit, packaging_size, uses_recycled_packaging, recycled_packaging_percentage, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);`,
                    [ulid(), sgiq_id, ...Object.values(packaging)]
                );
            }

            // Transportation & Logistics
            if (transportation_logistics) {
                await client.query(
                    `INSERT INTO transportation_logistics_questions (id, sgiq_id, transport_modes_used, enviguide_support, uses_certified_logistics_provider, logistics_provider_details, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7);`,
                    [ulid(), sgiq_id, ...Object.values(transportation_logistics)]
                );
            }

            // Waste & Byproducts
            if (waste_by_products) {
                await client.query(
                    `INSERT INTO waste_by_products_questions (id, sgiq_id, waste_types_generated, waste_treatment_methods, recycling_percentage, has_byproducts, byproduct_types, byproduct_quantity, byproduct_price, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10);`,
                    [ulid(), sgiq_id, ...Object.values(waste_by_products)]
                );
            }

            // End of Life / Circularity
            if (end_of_life_circularity) {
                await client.query(
                    `INSERT INTO end_of_life_circularity_questions (id, sgiq_id, product_designed_for_recycling, product_recycling_details, has_takeback_program, takeback_program_details, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7);`,
                    [ulid(), sgiq_id, ...Object.values(end_of_life_circularity)]
                );
            }

            // Emission Factors / LCA
            if (emission_factors) {
                await client.query(
                    `INSERT INTO emission_factors_or_lca_data_questions (id, sgiq_id, reports_product_carbon_footprint, pcf_methodologies_used, has_scope_emission_data, emission_data_details, required_environmental_impact_methods, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`,
                    [ulid(), sgiq_id, ...Object.values(emission_factors)]
                );
            }

            // Certification & Standards
            if (certification_standards) {
                await client.query(
                    `INSERT INTO certification_and_standards_questions (id, sgiq_id, certified_iso_environmental_or_energy, follows_recognized_standards, reports_to_esg_frameworks, previous_reports, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7);`,
                    [ulid(), sgiq_id, ...Object.values(certification_standards)]
                );
            }

            // Additional Notes
            if (additional_notes) {
                await client.query(
                    `INSERT INTO additional_notes_questions (id, sgiq_id, carbon_reduction_measures, renewable_energy_or_recycling_programs, willing_to_provide_primary_data, primary_data_details, user_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7);`,
                    [ulid(), sgiq_id, ...Object.values(additional_notes)]
                );
            }


            const bomPCFStagesData = {
                bom_pcf_id: bom_pcf_id,
                data_collected_by: req.user_id,
                completed_date: new Date()
            };

            // PCF Request Stages - Data Collection Stage updated
            if (bomPCFStagesData) {
                await client.query(
                    `
                        INSERT INTO pcf_request_data_collection_stage 
                        (id, bom_pcf_id, data_collected_by, completed_date)
                        VALUES ($1, $2, $3, $4);
                        `,
                    [ulid(), bom_pcf_id, bomPCFStagesData.data_collected_by, bomPCFStagesData.completed_date]
                );

                await client.query(
                    `UPDATE pcf_request_stages SET is_data_collected = true WHERE bom_pcf_id = $1;`, [bom_pcf_id]
                );
            }

            // Commit transaction
            await client.query("COMMIT");

            return res.send(
                generateResponse(true, "Supplier sustainability data added successfully", 200, {
                    general_info: generalResult.rows[0]
                })
            );
        } catch (error: any) {
            await client.query("ROLLBACK"); // rollback on failure
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getSupplierSustainabilityDataById(req: any, res: any) {
    return withClient(async (client: any) => {
        // try {
        //     const { sgiq_id, user_id } = req.query;

        //     if (!sgiq_id || !user_id) {
        //         return res.send(generateResponse(false, "sgiq_id and user_id are required", 400, null));
        //     }

        //     const query = `
        //         SELECT 
        //             sgiq.*,
        //             mc.*,
        //             em.*,
        //             p.*,
        //             tl.*,
        //             wb.*,
        //             eol.*,
        //             ef.*,
        //             cs.*,
        //             an.*,
        //             u1.user_name
        //         FROM supplier_general_info_questions sgiq
        //         LEFT JOIN material_composition_questions mc ON sgiq.sgiq_id = mc.sgiq_id
        //         LEFT JOIN energy_manufacturing_questions em ON sgiq.sgiq_id = em.sgiq_id
        //         LEFT JOIN packaging_questions p ON sgiq.sgiq_id = p.sgiq_id
        //         LEFT JOIN transportation_logistics_questions tl ON sgiq.sgiq_id = tl.sgiq_id
        //         LEFT JOIN waste_by_products_questions wb ON sgiq.sgiq_id = wb.sgiq_id
        //         LEFT JOIN end_of_life_circularity_questions eol ON sgiq.sgiq_id = eol.sgiq_id
        //         LEFT JOIN emission_factors_or_lca_data_questions ef ON sgiq.sgiq_id = ef.sgiq_id
        //         LEFT JOIN certification_and_standards_questions cs ON sgiq.sgiq_id = cs.sgiq_id
        //         LEFT JOIN additional_notes_questions an ON sgiq.sgiq_id = an.sgiq_id
        //         LEFT JOIN users_table u1 ON sgiq.user_id = u1.user_id
        //         WHERE sgiq.sgiq_id = $1 AND sgiq.user_id = $2;
        //     `;

        //     const result = await client.query(query, [sgiq_id, user_id]);

        //     if (result.rows.length === 0) {
        //         return res.send(generateResponse(false, "No record found", 404, null));
        //     }

        //     return res.send(
        //         generateResponse(true, "Supplier sustainability data fetched successfully", 200, result.rows[0])
        //     );
        // } catch (error: any) {
        //     return res.send(generateResponse(false, error.message, 400, null));
        // }
        try {
            const { sgiq_id, user_id } = req.query;

            if (!sgiq_id || !user_id) {
                return res.send(generateResponse(false, "sgiq_id and user_id are required", 400, null));
            }

            const result: any = {};

            // ✅ Fetch main supplier_general_info_questions + user_name
            const generalInfoQuery = `
                SELECT gq.*, u.user_name
                FROM supplier_general_info_questions gq
                LEFT JOIN users_table u ON gq.user_id = u.user_id
                WHERE gq.sgiq_id = $1 AND gq.user_id = $2
            `;
            const generalInfo = await client.query(generalInfoQuery, [sgiq_id, user_id]);

            if (!generalInfo.rows.length) {
                return res.send(generateResponse(false, "Supplier not found", 404, null));
            }

            result["supplier_general_info_questions"] = generalInfo.rows[0];

            // ✅ Fetch all related supplier question tables
            for (const table of QUESTION_TABLES.slice(1)) {
                const tableRes = await client.query(`SELECT * FROM ${table} WHERE sgiq_id = $1`, [sgiq_id]);
                result[table] = tableRes.rows;
            }

            // ✅ Send successful response
            return res.send(generateResponse(true, "Supplier sustainability data fetched successfully", 200, result));

        } catch (error: any) {
            console.error("❌ Error in getSupplierSustainabilityDataById:", error.message);
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
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

export async function updateSupplierSustainabilityData(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query("BEGIN");

        try {
            const {
                sgiq_id,
                general_info,
                material_composition,
                energy_manufacturing,
                packaging,
                transportation_logistics,
                waste_by_products,
                end_of_life_circularity,
                emission_factors,
                certification_standards,
                additional_notes
            } = req.body;

            if (!sgiq_id) {
                throw new Error("sgiq_id is required");
            }

            const updated_by = req.user_id;

            // --- UPDATE GENERAL INFO ---
            if (general_info) {
                const updateGeneral = `
                    UPDATE supplier_general_info_questions
                    SET 
                        name_of_organization = $1,
                        core_business_activities = $2,
                        company_site_address = $3,
                        designation = $4,
                        email_address = $5,
                        type_of_product_manufacture = $6,
                        annul_or_monthly_product_volume_of_product = $7,
                        weight_of_product = $8,
                        where_production_site_product_manufactured = $9,
                        price_of_product = $10,
                        organization_annual_revenue = $11,
                        organization_annual_reporting_period = $12,
                        updated_by = $13,
                        update_date = NOW()
                    WHERE sgiq_id = $14
                    RETURNING *;
                `;

                await client.query(updateGeneral, [
                    general_info.name_of_organization,
                    general_info.core_business_activities,
                    general_info.company_site_address,
                    general_info.designation,
                    general_info.email_address,
                    general_info.type_of_product_manufacture,
                    general_info.annul_or_monthly_product_volume_of_product,
                    general_info.weight_of_product,
                    general_info.where_production_site_product_manufactured,
                    general_info.price_of_product,
                    general_info.organization_annual_revenue,
                    general_info.organization_annual_reporting_period,
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- MATERIAL COMPOSITION ---
            if (material_composition) {
                await client.query(`
                    UPDATE material_composition_questions
                    SET
                        main_raw_materials_used = $1,
                        contact_enviguide_support = $2,
                        has_recycled_material_usage = $3,
                        percentage_recycled_material = $4,
                        knows_material_breakdown = $5,
                        percentage_pre_consumer = $6,
                        percentage_post_consumer = $7,
                        percentage_reutilization = $8,
                        has_recycled_copper = $9,
                        percentage_recycled_copper = $10,
                        has_recycled_aluminum = $11,
                        percentage_recycled_aluminum = $12,
                        has_recycled_steel = $13,
                        percentage_recycled_steel = $14,
                        has_recycled_plastics = $15,
                        percentage_total_recycled_plastics = $16,
                        percentage_recycled_thermoplastics = $17,
                        percentage_recycled_plastic_fillers = $18,
                        percentage_recycled_fibers = $19,
                        has_recycling_process = $20,
                        has_future_recycling_strategy = $21,
                        planned_recycling_year = $22,
                        track_transport_emissions = $23,
                        estimated_transport_emissions = $24,
                        need_support_for_emissions_calc = $25,
                        emission_calc_requirement = $26,
                        percentage_pcr = $27,
                        percentage_pir = $28,
                        use_bio_based_materials = $29,
                        bio_based_material_details = $30,
                        msds_or_composition_link = $31,
                        main_alloy_metals = $32,
                        metal_grade = $33,
                        updated_by = $34,
                        update_date = NOW()
                    WHERE sgiq_id = $35;
                `, [
                    ...Object.values(material_composition),
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- ENERGY MANUFACTURING ---
            if (energy_manufacturing) {
                await client.query(`
                    UPDATE energy_manufacturing_questions
                    SET
                        energy_sources_used = $1,
                        electricity_consumption_per_year = $2,
                        purchases_renewable_electricity = $3,
                        renewable_electricity_percentage = $4,
                        has_energy_calculation_method = $5,
                        energy_calculation_method_details = $6,
                        energy_intensity_per_unit = $7,
                        process_specific_energy_usage = $8,
                        enviguide_support = $9,
                        uses_abatement_systems = $10,
                        abatement_system_energy_consumption = $11,
                        water_consumption_and_treatment_details = $12,
                        updated_by = $13,
                        update_date = NOW()
                    WHERE sgiq_id = $14;
                `, [
                    ...Object.values(energy_manufacturing),
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- PACKAGING ---
            if (packaging) {
                await client.query(`
                    UPDATE packaging_questions
                    SET
                        packaging_materials_used = $1,
                        enviguide_support = $2,
                        packaging_weight_per_unit = $3,
                        packaging_size = $4,
                        uses_recycled_packaging = $5,
                        recycled_packaging_percentage = $6,
                        updated_by = $7,
                        update_date = NOW()
                    WHERE sgiq_id = $8;
                `, [
                    ...Object.values(packaging),
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- TRANSPORTATION ---
            if (transportation_logistics) {
                await client.query(`
                    UPDATE transportation_logistics_questions
                    SET
                        transport_modes_used = $1,
                        enviguide_support = $2,
                        uses_certified_logistics_provider = $3,
                        logistics_provider_details = $4,
                        updated_by = $5,
                        update_date = NOW()
                    WHERE sgiq_id = $6;
                `, [
                    ...Object.values(transportation_logistics),
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- WASTE BY PRODUCTS ---
            if (waste_by_products) {
                await client.query(`
                    UPDATE waste_by_products_questions
                    SET
                        waste_types_generated = $1,
                        waste_treatment_methods = $2,
                        recycling_percentage = $3,
                        has_byproducts = $4,
                        byproduct_types = $5,
                        byproduct_quantity = $6,
                        byproduct_price = $7,
                        updated_by = $8,
                        update_date = NOW()
                    WHERE sgiq_id = $9;
                `, [
                    ...Object.values(waste_by_products),
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- END OF LIFE / CIRCULARITY ---
            if (end_of_life_circularity) {
                await client.query(`
                    UPDATE end_of_life_circularity_questions
                    SET
                        product_designed_for_recycling = $1,
                        product_recycling_details = $2,
                        has_takeback_program = $3,
                        takeback_program_details = $4,
                        updated_by = $5,
                        update_date = NOW()
                    WHERE sgiq_id = $6;
                `, [
                    ...Object.values(end_of_life_circularity),
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- EMISSION FACTORS ---
            if (emission_factors) {
                await client.query(`
                    UPDATE emission_factors_or_lca_data_questions
                    SET
                        reports_product_carbon_footprint = $1,
                        pcf_methodologies_used = $2,
                        has_scope_emission_data = $3,
                        emission_data_details = $4,
                        required_environmental_impact_methods = $5,
                        updated_by = $6,
                        update_date = NOW()
                    WHERE sgiq_id = $7;
                `, [
                    ...Object.values(emission_factors),
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- CERTIFICATION ---
            if (certification_standards) {
                await client.query(`
                    UPDATE certification_and_standards_questions
                    SET
                        certified_iso_environmental_or_energy = $1,
                        follows_recognized_standards = $2,
                        reports_to_esg_frameworks = $3,
                        previous_reports = $4,
                        updated_by = $5,
                        update_date = NOW()
                    WHERE sgiq_id = $6;
                `, [
                    ...Object.values(certification_standards),
                    updated_by,
                    sgiq_id
                ]);
            }

            // --- ADDITIONAL NOTES ---
            if (additional_notes) {
                await client.query(`
                    UPDATE additional_notes_questions
                    SET
                        carbon_reduction_measures = $1,
                        renewable_energy_or_recycling_programs = $2,
                        willing_to_provide_primary_data = $3,
                        primary_data_details = $4,
                        updated_by = $5,
                        update_date = NOW()
                    WHERE sgiq_id = $6;
                `, [
                    ...Object.values(additional_notes),
                    updated_by,
                    sgiq_id
                ]);
            }

            await client.query("COMMIT");

            return res.send(
                generateResponse(true, "Supplier sustainability data updated successfully", 200, { sgiq_id })
            );
        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("❌ Update Error:", error);
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

