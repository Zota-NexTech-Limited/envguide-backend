import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

export async function addSupplierSustainabilityData(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query("BEGIN"); // start transaction

        try {
            const {
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

            const user_id = req.user_id;
            
            general_info.user_id = user_id;
            material_composition.user_id = user_id;
            energy_manufacturing.user_id = user_id;
            packaging.user_id = user_id;
            transportation_logistics.user_id = user_id;
            waste_by_products.user_id = user_id;
            end_of_life_circularity.user_id = user_id;
            emission_factors.user_id = user_id;
            certification_standards.user_id = user_id;
            additional_notes.user_id = user_id;

            // Insert into supplier_general_info_questions
            const Code = `SIQ-${Date.now()}`;

            const sgiq_id = ulid();
            const generalInsert = `
                INSERT INTO supplier_general_info_questions (
                    sgiq_id, code, name_of_organization, core_business_activities,
                    company_site_address, designation, email_address,
                    type_of_product_manufacture, annul_or_monthly_product_volume_of_product,
                    weight_of_product, where_production_site_product_manufactured, price_of_product,
                    organization_annual_revenue, organization_annual_reporting_period, user_id
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
                general_info.user_id
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
        try {
            const { sgiq_id, user_id } = req.query;

            if (!sgiq_id || !user_id) {
                return res.send(generateResponse(false, "sgiq_id and user_id are required", 400, null));
            }

            const query = `
                SELECT 
                    sgiq.*,
                    mc.*,
                    em.*,
                    p.*,
                    tl.*,
                    wb.*,
                    eol.*,
                    ef.*,
                    cs.*,
                    an.*,
                    u1.user_name
                FROM supplier_general_info_questions sgiq
                LEFT JOIN material_composition_questions mc ON sgiq.sgiq_id = mc.sgiq_id
                LEFT JOIN energy_manufacturing_questions em ON sgiq.sgiq_id = em.sgiq_id
                LEFT JOIN packaging_questions p ON sgiq.sgiq_id = p.sgiq_id
                LEFT JOIN transportation_logistics_questions tl ON sgiq.sgiq_id = tl.sgiq_id
                LEFT JOIN waste_by_products_questions wb ON sgiq.sgiq_id = wb.sgiq_id
                LEFT JOIN end_of_life_circularity_questions eol ON sgiq.sgiq_id = eol.sgiq_id
                LEFT JOIN emission_factors_or_lca_data_questions ef ON sgiq.sgiq_id = ef.sgiq_id
                LEFT JOIN certification_and_standards_questions cs ON sgiq.sgiq_id = cs.sgiq_id
                LEFT JOIN additional_notes_questions an ON sgiq.sgiq_id = an.sgiq_id
                LEFT JOIN users_table u1 ON sgiq.user_id = u1.user_id
                WHERE sgiq.sgiq_id = $1 AND sgiq.user_id = $2;
            `;

            const result = await client.query(query, [sgiq_id, user_id]);

            if (result.rows.length === 0) {
                return res.send(generateResponse(false, "No record found", 404, null));
            }

            return res.send(
                generateResponse(true, "Supplier sustainability data fetched successfully", 200, result.rows[0])
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}
