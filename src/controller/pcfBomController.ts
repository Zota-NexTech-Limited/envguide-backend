import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';
import { bomService } from "../services/bomService";

export async function createBOMWithDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                bom_pcf_request,
                bom_pcf_request_product_specification,
                bom,
                bom_supplier_co_product_information,
                bom_emission_material_calculation_engine,
                bom_emission_production_calculation_engine,
                bom_emission_packaging_calculation_engine,
                bom_emission_waste_calculation_engine,
                bom_emission_logistic_calculation_engine,
                allocation_methodology
            } = req.body;


            const created_by = req.user_id;

            // Insert into bom_pcf_request
            const bomPcfId = ulid();
            const bomPcfCode = `BOMPCF-${Date.now()}`;


            const bomPcfData = {
                id: bomPcfId,
                code: bomPcfCode,
                created_by: created_by,
                ...bom_pcf_request
            };


            await bomService.insertPCFBOMRequest(client, bomPcfData);

            // Insert into bom_pcf_request_product_specification
            if (Array.isArray(bom_pcf_request_product_specification)) {
                for (const spec of bom_pcf_request_product_specification) {
                    await bomService.insertPCFBOMRequestProductSpec(client, {
                        id: ulid(),
                        bom_pcf_id: bomPcfId,
                        ...spec
                    });
                }
            }

            // Insert into BOM (Parent)
            const bomId = ulid();
            const bomCode = `BOM-${Date.now()}`;

            // weight_gms if this field is not provided, then we have to call IMDS api to fetch weight_gms 
            // this api not yet given

            const TWG = ((bom.weight_gms || 0) * (bom.qunatity || 1));
            const TP = ((bom.price || 0) * (bom.qunatity || 1));

            // For ER (economic ratio) calculation, we need to get average of economic_or_co_product_value from bom_supplier_co_product_information
            interface CoProduct {
                economic_or_co_product_value?: number;
                [key: string]: any; // other fields if needed
            }

            // const coProducts: CoProduct[] = bom_supplier_co_product_information || [];
            const coProducts: CoProduct[] = (bom_supplier_co_product_information || []).filter(
                (item: any) => item.material_number === bom.material_number
            );

            const averageCoProductValue =
                coProducts.length > 0
                    ? coProducts.reduce((sum: number, item: CoProduct) => sum + (item.economic_or_co_product_value || 0), 0) / coProducts.length
                    : 0;

            const ER = ((bom.price || 0) / (averageCoProductValue || 1)); // avoid divide by 0

            console.log("Average Co-Product Value:", averageCoProductValue);
            console.log("Economic Ratio (ER):", ER);

            const bomData = {
                id: bomId,
                code: bomCode,
                created_by: created_by,
                total_weight_gms: TWG,
                total_price: TP,
                economic_ratio: ER,
                bom_pcf_id: bomPcfId,
                ...bom
            };

            await bomService.insertBOM(client, bomData);

            const weightGMS = (bom.weight_gms || 0) / 1000; // Convert gms to kgs
            console.log("Weight in KGS for Material Calculation:", weightGMS);

            // Material Calculation
            let totalRawMaterialEmission = 0;
            if (Array.isArray(bom_emission_material_calculation_engine)) {

                for (const materialCal of bom_emission_material_calculation_engine) {

                    const material_composition_weight = (weightGMS / 100) * materialCal.material_composition;
                    const material_emission = material_composition_weight * materialCal.material_emission_factor;

                    // add to running total
                    totalRawMaterialEmission += material_emission;

                    await bomService.insertMaterialCalValue(client, {
                        id: ulid(),
                        bom_id: bomId,
                        material_composition: materialCal.material_composition,
                        material_emission_factor: materialCal.material_emission_factor,
                        material_composition_weight: material_composition_weight,
                        material_emission: material_emission,
                        aluminium_id: materialCal.aluminium_id,
                        silicon_id: materialCal.silicon_id,
                        magnesium_id: materialCal.magnesium_id,
                        iron_id: materialCal.iron_id
                    });
                }

                console.log("Total Raw Material Emission:", totalRawMaterialEmission);

            }

            // Production Calculation
            const productionCal = bom_emission_production_calculation_engine;

            const total_weight_current_component_produced_kg = weightGMS * productionCal.no_products_current_component_produced;
            const total_eu_for_production_all_current_component_kwh = (total_weight_current_component_produced_kg / productionCal.total_weight_produced_factory_level_kg) * productionCal.electricity_energy_consumed_factory_level_kwh;
            const production_ee_use_per_unit = total_eu_for_production_all_current_component_kwh / productionCal.no_products_current_component_produced;
            const manufacturing_emission = production_ee_use_per_unit * productionCal.emission_factor_of_electricity;

            await bomService.insertProductionCalValue(client, {
                id: ulid(),
                bom_id: bomId,
                electricity_energy_consumed_factory_level_kwh: productionCal.electricity_energy_consumed_factory_level_kwh,
                total_weight_produced_factory_level_kg: productionCal.total_weight_produced_factory_level_kg,
                no_products_current_component_produced: productionCal.no_products_current_component_produced,
                total_weight_current_component_produced_kg: total_weight_current_component_produced_kg,
                total_eu_for_production_all_current_component_kwh: total_eu_for_production_all_current_component_kwh,
                production_ee_use_per_unit: production_ee_use_per_unit,
                emission_factor_of_electricity: productionCal.emission_factor_of_electricity,
                manufacturing_emission: manufacturing_emission
            });

            // Packaging Calculation
            const packaging_carbon_emission = bom_emission_packaging_calculation_engine.material_box_weight_kg * bom_emission_packaging_calculation_engine.emission_factor_box_kg;

            await bomService.insertPackaginCalValue(client, {
                id: ulid(),
                bom_id: bomId,
                packaging: bom_emission_packaging_calculation_engine.packaging,
                pack_size_l_w_h_m: bom_emission_packaging_calculation_engine.pack_size_l_w_h_m,
                material_box_weight_kg: bom_emission_packaging_calculation_engine.material_box_weight_kg,
                emission_factor_box_kg: bom_emission_packaging_calculation_engine.emission_factor_box_kg,
                packaging_carbon_emission: packaging_carbon_emission
            });

            // Waste Calculation
            let waste_disposal_emission = 0;
            const WGPBKG = bom_emission_waste_calculation_engine.waste_generated_per_box_kg * 0.1; // assuming 10% of box weight as waste
            const PWTE = WGPBKG * bom_emission_waste_calculation_engine.packaging_waste_treatment_energy_kg;
            waste_disposal_emission = ((WGPBKG * bom_emission_waste_calculation_engine.emission_factor_box_waste_treatment_kg) + (PWTE * bom_emission_waste_calculation_engine.emission_factor_box_packaging_treatment_kg));

            console.log(WGPBKG, bom_emission_waste_calculation_engine.emission_factor_box_waste_treatment_kg,
                PWTE, bom_emission_waste_calculation_engine.emission_factor_box_packaging_treatment_kg, "POOOOOOOOOOOOOOOO"
            );

            await bomService.insertWasteCalValue(client, {
                id: ulid(),
                bom_id: bomId,
                waste_generated_per_box_kg: WGPBKG,
                emission_factor_box_waste_treatment_kg: bom_emission_waste_calculation_engine.emission_factor_box_waste_treatment_kg,
                packaging_waste_treatment_energy_kg: PWTE,
                emission_factor_box_packaging_treatment_kg: bom_emission_waste_calculation_engine.emission_factor_box_packaging_treatment_kg,
                waste_disposal_emission: waste_disposal_emission
            });


            // Logstics Calculation
            let total_transportation_emissions_per_unit_kg = 0;
            if (Array.isArray(bom_emission_logistic_calculation_engine)) {

                // in this distance calculation we have to check with use profile address lat long and manufacturer 
                // profile lat long to calculate distance
                // for now we are using static distance value from frontend

                for (const logisticCal of bom_emission_logistic_calculation_engine) {

                    const mass_transported_kg = weightGMS + bom_emission_packaging_calculation_engine.material_box_weight_kg;
                    const mass_transported_ton = mass_transported_kg / 1000;
                    const leg_wise_transport_emissions_per_unit_kg = (mass_transported_ton * logisticCal.distance_km * logisticCal.transport_mode_emission_factor_value_kg)


                    total_transportation_emissions_per_unit_kg += leg_wise_transport_emissions_per_unit_kg;

                    await bomService.insertLogsticsCalValue(client, {
                        id: ulid(),
                        bom_id: bomId,
                        transport_mode_id: logisticCal.transport_mode_id,
                        vehicle_id: logisticCal.vehicle_id,
                        manufacturer_id: logisticCal.manufacturer_id,
                        user_id: logisticCal.user_id,
                        destination_site: logisticCal.destination_site,
                        mass_transported_kg: mass_transported_kg,
                        mass_transported_ton: mass_transported_ton,
                        distance_km: logisticCal.distance_km,
                        transport_mode_emission_factor_value_kg: logisticCal.transport_mode_emission_factor_value_kg,
                        leg_wise_transport_emissions_per_unit_kg: leg_wise_transport_emissions_per_unit_kg
                    });
                }

                console.log("Total Transportation Emission Logistics:", total_transportation_emissions_per_unit_kg);


            }

            console.log("TOTALLLL:", totalRawMaterialEmission, manufacturing_emission, packaging_carbon_emission, waste_disposal_emission, total_transportation_emissions_per_unit_kg);

            // Bom Emission Calculation Engine(Final PCF)
            const TotalPcfValue = (totalRawMaterialEmission || 0) + (manufacturing_emission || 0) + (packaging_carbon_emission || 0) + (waste_disposal_emission || 0) + (total_transportation_emissions_per_unit_kg || 0);
            await bomService.insertEmissionFinalPCFCalValue(client, {
                id: ulid(),
                bom_id: bomId,
                material_value: Math.round(totalRawMaterialEmission * 100000) / 100000,
                production_value: Math.round(manufacturing_emission * 100000) / 100000,
                packaging_value: Math.round(packaging_carbon_emission * 100000) / 100000,
                waste_value: Math.round(waste_disposal_emission * 100000) / 100000,
                logistic_value: Math.round(total_transportation_emissions_per_unit_kg * 100000) / 100000,
                pcf_value: Math.round(TotalPcfValue * 100000) / 100000
            });

            // Insert into bom_supplier_co_product_information
            if (Array.isArray(bom_supplier_co_product_information)) {
                for (const supplier of bom_supplier_co_product_information) {
                    await bomService.insertSupplierCoProduct(client, {
                        id: ulid(),
                        bom_id: bomId,
                        ...supplier
                    });
                }
            }

            // //Insert into allocation_methodology
            // if (Array.isArray(allocation_methodology)) {
            //     for (const alloc of allocation_methodology) {
            //         await bomService.insertAllocationMethod(client, {
            //             id: ulid(),
            //             bom_id: bomId,
            //             ...alloc
            //         });
            //     }
            // }


            // Insert into pcf_request_stages 
            const lastCodeResult = await client.query(`
            SELECT code 
            FROM pcf_request_stages 
            WHERE code IS NOT NULL
            ORDER BY code DESC 
            LIMIT 1;
        `);

            let newCode = "PCFRS0001";
            if (lastCodeResult.rows.length > 0) {
                const lastCode = lastCodeResult.rows[0].code; // e.g. "PCFRS0007"
                const lastNumber = parseInt(lastCode.replace("PCFRS", ""), 10);
                const nextNumber = lastNumber + 1;
                newCode = "PCFRS" + String(nextNumber).padStart(4, "0");
            }

            const bomPCFStagesData = {
                bom_pcf_id: bomId,
                code: newCode,
                is_pcf_request_created: true,
                is_pcf_request_submitted: true,
                pcf_request_created_by: req.user_id,
                pcf_request_submitted_by: req.user_id,
                pcf_request_created_date: new Date(),
                pcf_request_submitted_date: new Date()
            };

            await bomService.insertPCFBOMRequestStages(client, bomPCFStagesData);

            await client.query("COMMIT");

            return res.status(201).send(
                generateResponse(true, "BOM and related data created successfully", 201, {
                    pcf_id: bomPcfId,
                    code: bomPcfCode
                })
            );

        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("Error creating BOM:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to create BOM data"
            });
        }
    });
}

export async function getPcfBOMWithDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { pcf_id } = req.query;

            if (!pcf_id) {
                return res.status(400).json({
                    success: false,
                    message: "pcf_id is required",
                });
            }

            // 1️⃣ Fetch PCF Request with joined master data
            const pcfRequestQuery = `
        SELECT 
          pcf.*,
          pc.id AS product_category_id,
          pc.code AS product_category_code,
          pc.name AS product_category_name,

          cc.id AS component_category_id,
          cc.code AS component_category_code,
          cc.name AS component_category_name,

          ct.id AS component_type_id,
          ct.code AS component_type_code,
          ct.name AS component_type_name,

          m.id AS manufacturer_id,
          m.code AS manufacturer_code,
          m.name AS manufacturer_name,
          m.address AS manufacturer_address,
          m.lat AS manufacturer_lat,
          m.long AS manufacturer_long,

          u1.user_name AS created_by_name,
          u2.user_name AS updated_by_name
        FROM bom_pcf_request pcf
        LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
        LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
        LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
        LEFT JOIN manufacturer m ON m.id = pcf.manufacturer_id
        LEFT JOIN users_table u1 ON pcf.created_by = u1.user_id
        LEFT JOIN users_table u2 ON pcf.updated_by = u2.user_id
        WHERE pcf.id = $1
      `;
            const pcfRequestResult = await client.query(pcfRequestQuery, [pcf_id]);
            const pcfRequest = pcfRequestResult.rows[0];

            if (!pcfRequest) {
                return res.status(404).json({
                    success: false,
                    message: "No PCF request found with the given ID",
                });
            }

            // 2️⃣ Product Specification details
            const specQuery = `
        SELECT * FROM bom_pcf_request_product_specification
        WHERE bom_pcf_id = $1
      `;
            const specResult = await client.query(specQuery, [pcf_id]);
            const productSpecifications = specResult.rows;

            // 3️⃣ Fetch BOM(s) with joined manufacturer and component_category
            const bomQuery = `
        SELECT 
          b.*,
          m.id AS manufacturer_id,
          m.code AS manufacturer_code,
          m.name AS manufacturer_name,
          m.address AS manufacturer_address,
          m.lat AS manufacturer_lat,
          m.long AS manufacturer_long,
          cc.id AS component_category_id,
          cc.code AS component_category_code,
          cc.name AS component_category_name
        FROM bom b
        LEFT JOIN manufacturer m ON m.id = b.manufacturer_id
        LEFT JOIN component_category cc ON cc.id = b.component_category_id
        WHERE b.bom_pcf_id = $1
      `;
            const bomResult = await client.query(bomQuery, [pcf_id]);
            const boms = bomResult.rows;

            // 4️⃣ Fetch related child tables for each BOM
            const detailedBoms = [];
            for (const bom of boms) {
                const bomId = bom.id;

                const [
                    supplierRes,
                    materialRes,
                    productionRes,
                    packagingRes,
                    wasteRes,
                    logisticRes,
                    emissionRes,
                ] = await Promise.all([
                    // Supplier co-product info with product_type join
                    client.query(`
            SELECT scp.*, 
              pt.id AS product_type_id,
              pt.code AS product_type_code,
              pt.name AS product_type_name
            FROM bom_supplier_co_product_value_calculation scp
            LEFT JOIN product_type pt ON pt.id = scp.co_product_id
            WHERE scp.bom_id = $1
          `, [bomId]),

                    // Material emission calc with multiple type joins
                    client.query(`
            SELECT mc.*, 
              al.id AS aluminium_type_id, al.code AS aluminium_code, al.name AS aluminium_name,
              si.id AS silicon_type_id, si.code AS silicon_code, si.name AS silicon_name,
              mg.id AS magnesium_type_id, mg.code AS magnesium_code, mg.name AS magnesium_name,
              ir.id AS iron_type_id, ir.code AS iron_code, ir.name AS iron_name
            FROM bom_emission_material_calculation_engine mc
            LEFT JOIN aluminium_type al ON al.id = mc.aluminium_id
            LEFT JOIN silicon_type si ON si.id = mc.silicon_id
            LEFT JOIN magnesium_type mg ON mg.id = mc.magnesium_id
            LEFT JOIN iron_type ir ON ir.id = mc.iron_id
            WHERE mc.bom_id = $1
          `, [bomId]),

                    // Production emission calc
                    client.query(`
            SELECT * FROM bom_emission_production_calculation_engine
            WHERE bom_id = $1
          `, [bomId]),

                    // Packaging emission calc
                    client.query(`
            SELECT * FROM bom_emission_packaging_calculation_engine
            WHERE bom_id = $1
          `, [bomId]),

                    // Waste emission calc
                    client.query(`
            SELECT * FROM bom_emission_waste_calculation_engine
            WHERE bom_id = $1
          `, [bomId]),

                    // Logistics emission calc with multiple joins
                    client.query(`
            SELECT le.*, 
              tm.code AS transport_mode_code, tm.name AS transport_mode_name,
              vd.code AS vehicle_code, vd.name AS vehicle_name, 
              vd.make AS vehicle_make, vd.model AS vehicle_model, vd.year AS vehicle_year, vd.number AS vehicle_number,
              mf.code AS manufacturer_code, mf.name AS manufacturer_name,
              u.user_name AS user_name
            FROM bom_emission_logistic_calculation_engine le
            LEFT JOIN transport_mode tm ON tm.id = le.transport_mode_id
            LEFT JOIN vehicle_detail vd ON vd.id = le.vehicle_id
            LEFT JOIN manufacturer mf ON mf.id = le.manufacturer_id
            LEFT JOIN users_table u ON u.user_id = le.user_id
            WHERE le.bom_id = $1
          `, [bomId]),

                    // Final emission values
                    client.query(`
            SELECT * FROM bom_emission_calculation_engine
            WHERE bom_id = $1
          `, [bomId]),
                ]);

                detailedBoms.push({
                    ...bom,
                    supplier_co_product_information: supplierRes.rows,
                    emission_material_calculation_engine: materialRes.rows,
                    emission_production_calculation_engine: productionRes.rows,
                    emission_packaging_calculation_engine: packagingRes.rows,
                    emission_waste_calculation_engine: wasteRes.rows,
                    emission_logistic_calculation_engine: logisticRes.rows,
                    emission_final_pcf_value: emissionRes.rows[0] || null,
                });
            }

            // ✅ Final response
            return res.status(200).json({
                success: true,
                message: "PCF BOM details fetched successfully",
                data: {
                    pcf_request: pcfRequest,
                    product_specifications: productSpecifications,
                    bom_details: detailedBoms,
                },
            });
        } catch (error: any) {
            console.error("Error fetching PCF BOM details:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch PCF BOM details",
            });
        }
    });
}

export async function getPcfBOMList(req: any, res: any) {
    const { pageNumber, pageSize } = req.query;

    const limit = parseInt(pageSize) || 20;
    const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            // 1️⃣ Main query with joins for pagination
            const query = `
        SELECT 
          pcf.*,
          pc.id AS product_category_id,
          pc.code AS product_category_code,
          pc.name AS product_category_name,

          cc.id AS component_category_id,
          cc.code AS component_category_code,
          cc.name AS component_category_name,

          ct.id AS component_type_id,
          ct.code AS component_type_code,
          ct.name AS component_type_name,

          m.id AS manufacturer_id,
          m.code AS manufacturer_code,
          m.name AS manufacturer_name,
          m.address AS manufacturer_address,
          m.lat AS manufacturer_lat,
          m.long AS manufacturer_long,

          u1.user_name AS created_by_name,
          u2.user_name AS updated_by_name
        FROM bom_pcf_request pcf
        LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
        LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
        LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
        LEFT JOIN manufacturer m ON m.id = pcf.manufacturer_id
        LEFT JOIN users_table u1 ON pcf.created_by = u1.user_id
        LEFT JOIN users_table u2 ON pcf.updated_by = u2.user_id
        ORDER BY pcf.created_date DESC
        LIMIT $1 OFFSET $2;
      `;

            const countQuery = `
        SELECT COUNT(*) AS total_count
        FROM bom_pcf_request;
      `;

            const [result, countResult] = await Promise.all([
                client.query(query, [limit, offset]),
                client.query(countQuery),
            ]);

            const rows = result.rows;

            // 2️⃣ Optional: Fetch related BOMs for each PCF (if needed)
            for (const pcf of rows) {
                const bomResult = await client.query(`
          SELECT 
            b.*,
            m.name AS manufacturer_name,
            cc.name AS component_category_name
          FROM bom b
          LEFT JOIN manufacturer m ON m.id = b.manufacturer_id
          LEFT JOIN component_category cc ON cc.id = b.component_category_id
          WHERE b.bom_pcf_id = $1
        `, [pcf.id]);
                pcf.boms = bomResult.rows;
            }

            const totalCount = parseInt(countResult.rows[0]?.total_count ?? 0);
            const totalPages = Math.ceil(totalCount / limit);

            return res.status(200).json({
                success: true,
                message: "PCF BOM list fetched successfully",
                data: rows,
                current_page: page,
                total_pages: totalPages,
                total_count: totalCount,
            });
        } catch (error: any) {
            console.error("Error fetching PCF BOM list:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch PCF BOM list",
            });
        }
    });
}
