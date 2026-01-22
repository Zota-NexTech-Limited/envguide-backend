import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';
import { bomService } from "../services/pcfBomService";

// below code also working but no need all the details remainng should create after dqr so 
// created  createBOMWithDetailsFinal API
// export async function createBOMWithDetails(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             await client.query("BEGIN");

//             const {
//                 bom_pcf_request,
//                 bom_pcf_request_product_specification,
//                 bom,
//                 bom_supplier_co_product_information,
//                 bom_emission_material_calculation_engine,
//                 bom_emission_production_calculation_engine,
//                 bom_emission_packaging_calculation_engine,
//                 bom_emission_waste_calculation_engine,
//                 bom_emission_logistic_calculation_engine,
//                 allocation_methodology
//             } = req.body;


//             const created_by = req.user_id;

//             // Insert into bom_pcf_request
//             const bomPcfId = ulid();
//             const bomPcfCode = `BOMPCF-${Date.now()}`;


//             const bomPcfData = {
//                 id: bomPcfId,
//                 code: bomPcfCode,
//                 created_by: created_by,
//                 ...bom_pcf_request
//             };


//             await bomService.insertPCFBOMRequest(client, bomPcfData);

//             // Insert into bom_pcf_request_product_specification
//             if (Array.isArray(bom_pcf_request_product_specification)) {
//                 for (const spec of bom_pcf_request_product_specification) {
//                     await bomService.insertPCFBOMRequestProductSpec(client, {
//                         id: ulid(),
//                         bom_pcf_id: bomPcfId,
//                         ...spec
//                     });
//                 }
//             }

//             // Insert into BOM (Parent)
//             const bomId = ulid();
//             const bomCode = `BOM-${Date.now()}`;

//             // weight_gms if this field is not provided, then we have to call IMDS api to fetch weight_gms 
//             // this api not yet given

//             const TWG = ((bom.weight_gms || 0) * (bom.qunatity || 1));
//             const TP = ((bom.price || 0) * (bom.qunatity || 1));

//             // For ER (economic ratio) calculation, we need to get average of economic_or_co_product_value from bom_supplier_co_product_information
//             interface CoProduct {
//                 economic_or_co_product_value?: number;
//                 [key: string]: any; // other fields if needed
//             }

//             // const coProducts: CoProduct[] = bom_supplier_co_product_information || [];
//             const coProducts: CoProduct[] = (bom_supplier_co_product_information || []).filter(
//                 (item: any) => item.material_number === bom.material_number
//             );

//             const averageCoProductValue =
//                 coProducts.length > 0
//                     ? coProducts.reduce((sum: number, item: CoProduct) => sum + (item.economic_or_co_product_value || 0), 0) / coProducts.length
//                     : 0;

//             const ER = ((bom.price || 0) / (averageCoProductValue || 1)); // avoid divide by 0

//             console.log("Average Co-Product Value:", averageCoProductValue);
//             console.log("Economic Ratio (ER):", ER);

//             const bomData = {
//                 id: bomId,
//                 code: bomCode,
//                 created_by: created_by,
//                 total_weight_gms: TWG,
//                 total_price: TP,
//                 economic_ratio: ER,
//                 bom_pcf_id: bomPcfId,
//                 ...bom
//             };

//             await bomService.insertBOM(client, bomData);

//             const weightGMS = (bom.weight_gms || 0) / 1000; // Convert gms to kgs
//             console.log("Weight in KGS for Material Calculation:", weightGMS);

//             // Material Calculation
//             let totalRawMaterialEmission = 0;
//             if (Array.isArray(bom_emission_material_calculation_engine)) {

//                 for (const materialCal of bom_emission_material_calculation_engine) {

//                     const material_composition_weight = (weightGMS / 100) * materialCal.material_composition;
//                     const material_emission = material_composition_weight * materialCal.material_emission_factor;

//                     // add to running total
//                     totalRawMaterialEmission += material_emission;

//                     await bomService.insertMaterialCalValue(client, {
//                         id: ulid(),
//                         bom_id: bomId,
//                         material_composition: materialCal.material_composition,
//                         material_emission_factor: materialCal.material_emission_factor,
//                         material_composition_weight: material_composition_weight,
//                         material_emission: material_emission,
//                         aluminium_id: materialCal.aluminium_id,
//                         silicon_id: materialCal.silicon_id,
//                         magnesium_id: materialCal.magnesium_id,
//                         iron_id: materialCal.iron_id
//                     });
//                 }

//                 console.log("Total Raw Material Emission:", totalRawMaterialEmission);

//             }

//             // Production Calculation
//             const productionCal = bom_emission_production_calculation_engine;

//             const total_weight_current_component_produced_kg = weightGMS * productionCal.no_products_current_component_produced;
//             const total_eu_for_production_all_current_component_kwh = (total_weight_current_component_produced_kg / productionCal.total_weight_produced_factory_level_kg) * productionCal.electricity_energy_consumed_factory_level_kwh;
//             const production_ee_use_per_unit = total_eu_for_production_all_current_component_kwh / productionCal.no_products_current_component_produced;
//             const manufacturing_emission = production_ee_use_per_unit * productionCal.emission_factor_of_electricity;

//             await bomService.insertProductionCalValue(client, {
//                 id: ulid(),
//                 bom_id: bomId,
//                 electricity_energy_consumed_factory_level_kwh: productionCal.electricity_energy_consumed_factory_level_kwh,
//                 total_weight_produced_factory_level_kg: productionCal.total_weight_produced_factory_level_kg,
//                 no_products_current_component_produced: productionCal.no_products_current_component_produced,
//                 total_weight_current_component_produced_kg: total_weight_current_component_produced_kg,
//                 total_eu_for_production_all_current_component_kwh: total_eu_for_production_all_current_component_kwh,
//                 production_ee_use_per_unit: production_ee_use_per_unit,
//                 emission_factor_of_electricity: productionCal.emission_factor_of_electricity,
//                 manufacturing_emission: manufacturing_emission
//             });

//             // Packaging Calculation
//             const packaging_carbon_emission = bom_emission_packaging_calculation_engine.material_box_weight_kg * bom_emission_packaging_calculation_engine.emission_factor_box_kg;

//             await bomService.insertPackaginCalValue(client, {
//                 id: ulid(),
//                 bom_id: bomId,
//                 packaging: bom_emission_packaging_calculation_engine.packaging,
//                 pack_size_l_w_h_m: bom_emission_packaging_calculation_engine.pack_size_l_w_h_m,
//                 material_box_weight_kg: bom_emission_packaging_calculation_engine.material_box_weight_kg,
//                 emission_factor_box_kg: bom_emission_packaging_calculation_engine.emission_factor_box_kg,
//                 packaging_carbon_emission: packaging_carbon_emission
//             });

//             // Waste Calculation
//             let waste_disposal_emission = 0;
//             const WGPBKG = bom_emission_waste_calculation_engine.waste_generated_per_box_kg * 0.1; // assuming 10% of box weight as waste
//             const PWTE = WGPBKG * bom_emission_waste_calculation_engine.packaging_waste_treatment_energy_kg;
//             waste_disposal_emission = ((WGPBKG * bom_emission_waste_calculation_engine.emission_factor_box_waste_treatment_kg) + (PWTE * bom_emission_waste_calculation_engine.emission_factor_box_packaging_treatment_kg));

//             console.log(WGPBKG, bom_emission_waste_calculation_engine.emission_factor_box_waste_treatment_kg,
//                 PWTE, bom_emission_waste_calculation_engine.emission_factor_box_packaging_treatment_kg, "POOOOOOOOOOOOOOOO"
//             );

//             await bomService.insertWasteCalValue(client, {
//                 id: ulid(),
//                 bom_id: bomId,
//                 waste_generated_per_box_kg: WGPBKG,
//                 emission_factor_box_waste_treatment_kg: bom_emission_waste_calculation_engine.emission_factor_box_waste_treatment_kg,
//                 packaging_waste_treatment_energy_kg: PWTE,
//                 emission_factor_box_packaging_treatment_kg: bom_emission_waste_calculation_engine.emission_factor_box_packaging_treatment_kg,
//                 waste_disposal_emission: waste_disposal_emission
//             });


//             // Logstics Calculation
//             let total_transportation_emissions_per_unit_kg = 0;
//             if (Array.isArray(bom_emission_logistic_calculation_engine)) {

//                 // in this distance calculation we have to check with use profile address lat long and manufacturer 
//                 // profile lat long to calculate distance
//                 // for now we are using static distance value from frontend

//                 for (const logisticCal of bom_emission_logistic_calculation_engine) {

//                     const mass_transported_kg = weightGMS + bom_emission_packaging_calculation_engine.material_box_weight_kg;
//                     const mass_transported_ton = mass_transported_kg / 1000;
//                     const leg_wise_transport_emissions_per_unit_kg = (mass_transported_ton * logisticCal.distance_km * logisticCal.transport_mode_emission_factor_value_kg)


//                     total_transportation_emissions_per_unit_kg += leg_wise_transport_emissions_per_unit_kg;

//                     await bomService.insertLogsticsCalValue(client, {
//                         id: ulid(),
//                         bom_id: bomId,
//                         transport_mode_id: logisticCal.transport_mode_id,
//                         vehicle_id: logisticCal.vehicle_id,
//                         manufacturer_id: logisticCal.manufacturer_id,
//                         user_id: logisticCal.user_id,
//                         destination_site: logisticCal.destination_site,
//                         mass_transported_kg: mass_transported_kg,
//                         mass_transported_ton: mass_transported_ton,
//                         distance_km: logisticCal.distance_km,
//                         transport_mode_emission_factor_value_kg: logisticCal.transport_mode_emission_factor_value_kg,
//                         leg_wise_transport_emissions_per_unit_kg: leg_wise_transport_emissions_per_unit_kg
//                     });
//                 }

//                 console.log("Total Transportation Emission Logistics:", total_transportation_emissions_per_unit_kg);


//             }

//             console.log("TOTALLLL:", totalRawMaterialEmission, manufacturing_emission, packaging_carbon_emission, waste_disposal_emission, total_transportation_emissions_per_unit_kg);

//             // Bom Emission Calculation Engine(Final PCF)
//             const TotalPcfValue = (totalRawMaterialEmission || 0) + (manufacturing_emission || 0) + (packaging_carbon_emission || 0) + (waste_disposal_emission || 0) + (total_transportation_emissions_per_unit_kg || 0);
//             await bomService.insertEmissionFinalPCFCalValue(client, {
//                 id: ulid(),
//                 bom_id: bomId,
//                 material_value: Math.round(totalRawMaterialEmission * 100000) / 100000,
//                 production_value: Math.round(manufacturing_emission * 100000) / 100000,
//                 packaging_value: Math.round(packaging_carbon_emission * 100000) / 100000,
//                 waste_value: Math.round(waste_disposal_emission * 100000) / 100000,
//                 logistic_value: Math.round(total_transportation_emissions_per_unit_kg * 100000) / 100000,
//                 pcf_value: Math.round(TotalPcfValue * 100000) / 100000
//             });

//             // Insert into bom_supplier_co_product_information
//             if (Array.isArray(bom_supplier_co_product_information)) {
//                 for (const supplier of bom_supplier_co_product_information) {
//                     await bomService.insertSupplierCoProduct(client, {
//                         id: ulid(),
//                         bom_id: bomId,
//                         ...supplier
//                     });
//                 }
//             }

//             // //Insert into allocation_methodology
//             // if (Array.isArray(allocation_methodology)) {
//             //     for (const alloc of allocation_methodology) {
//             //         await bomService.insertAllocationMethod(client, {
//             //             id: ulid(),
//             //             bom_id: bomId,
//             //             ...alloc
//             //         });
//             //     }
//             // }


//             const bomPCFStagesData = {
//                 id: ulid(),
//                 bom_pcf_id: bomPcfId,
//                 is_pcf_request_created: true,
//                 is_pcf_request_submitted: true,
//                 pcf_request_created_by: req.user_id,
//                 pcf_request_submitted_by: req.user_id,
//                 pcf_request_created_date: new Date(),
//                 pcf_request_submitted_date: new Date()
//             };

//             await bomService.insertPCFBOMRequestStages(client, bomPCFStagesData);

//             await client.query("COMMIT");

//             return res.status(201).send(
//                 generateResponse(true, "BOM and related data created successfully", 201, {
//                     pcf_id: bomPcfId,
//                     code: bomPcfCode
//                 })
//             );

//         } catch (error: any) {
//             await client.query("ROLLBACK");
//             console.error("Error creating BOM:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message || "Failed to create BOM data"
//             });
//         }
//     });
// }

// export async function getPcfBOMWithDetails(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const { pcf_id } = req.query;

//             if (!pcf_id) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "pcf_id is required",
//                 });
//             }

//             // 1️⃣ Fetch PCF Request with joined master data
//             const pcfRequestQuery = `
//         SELECT 
//           pcf.*,
//           pc.id AS product_category_id,
//           pc.code AS product_category_code,
//           pc.name AS product_category_name,

//           cc.id AS component_category_id,
//           cc.code AS component_category_code,
//           cc.name AS component_category_name,

//           ct.id AS component_type_id,
//           ct.code AS component_type_code,
//           ct.name AS component_type_name,

//           m.id AS manufacturer_id,
//           m.code AS manufacturer_code,
//           m.name AS manufacturer_name,
//           m.address AS manufacturer_address,
//           m.lat AS manufacturer_lat,
//           m.long AS manufacturer_long,

//           u1.user_name AS created_by_name,
//           u2.user_name AS updated_by_name
//         FROM bom_pcf_request pcf
//         LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
//         LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
//         LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
//         LEFT JOIN manufacturer m ON m.id = pcf.manufacturer_id
//         LEFT JOIN users_table u1 ON pcf.created_by = u1.user_id
//         LEFT JOIN users_table u2 ON pcf.updated_by = u2.user_id
//         WHERE pcf.id = $1
//       `;
//             const pcfRequestResult = await client.query(pcfRequestQuery, [pcf_id]);
//             const pcfRequest = pcfRequestResult.rows[0];

//             if (!pcfRequest) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "No PCF request found with the given ID",
//                 });
//             }

//             // 2️⃣ Product Specification details
//             const specQuery = `
//         SELECT * FROM bom_pcf_request_product_specification
//         WHERE bom_pcf_id = $1
//       `;
//             const specResult = await client.query(specQuery, [pcf_id]);
//             const productSpecifications = specResult.rows;

//             // 3️⃣ Fetch BOM(s) with joined manufacturer and component_category
//             const bomQuery = `
//         SELECT 
//           b.*,
//           m.id AS manufacturer_id,
//           m.code AS manufacturer_code,
//           m.name AS manufacturer_name,
//           m.address AS manufacturer_address,
//           m.lat AS manufacturer_lat,
//           m.long AS manufacturer_long,
//           cc.id AS component_category_id,
//           cc.code AS component_category_code,
//           cc.name AS component_category_name
//         FROM bom b
//         LEFT JOIN manufacturer m ON m.id = b.manufacturer_id
//         LEFT JOIN component_category cc ON cc.id = b.component_category_id
//         WHERE b.bom_pcf_id = $1
//       `;
//             const bomResult = await client.query(bomQuery, [pcf_id]);
//             const boms = bomResult.rows;

//             // 4️⃣ Fetch related child tables for each BOM
//             const detailedBoms = [];
//             for (const bom of boms) {
//                 const bomId = bom.id;

//                 let supplierDetails: any[] = [];
//                 if (bom.supplier_ids && bom.supplier_ids.length > 0) {
//                     const supplierQuery = `
//             SELECT 
//                 id,
//                 code AS supplier_code,
//                 supplier_name,
//                 supplier_email,
//                 supplier_phone_number
//             FROM supplier_details
//             WHERE id = ANY($1::varchar[])
//         `;
//                     const supplierResult = await client.query(supplierQuery, [bom.supplier_ids]);
//                     supplierDetails = supplierResult.rows;
//                     for (const supplier of supplierDetails) {
//                         const checkQuery = `
//                             SELECT 1
//                             FROM supplier_general_info_questions
//                             WHERE user_id = $1 AND bom_pcf_id = $2
//                             LIMIT 1;
//                          `;
//                         const checkResult = await client.query(checkQuery, [supplier.id, bom.bom_pcf_id]);
//                         supplier.is_responded_questions = checkResult.rowCount > 0;
//                     }
//                 }

//                 const [
//                     supplierRes,
//                     materialRes,
//                     productionRes,
//                     packagingRes,
//                     wasteRes,
//                     logisticRes,
//                     emissionRes,
//                 ] = await Promise.all([
//                     // Supplier co-product info with product_type join
//                     client.query(`
//             SELECT scp.*, 
//               pt.id AS product_type_id,
//               pt.code AS product_type_code,
//               pt.name AS product_type_name,
//               pt.name AS product_type_name,
//               sup.code AS supplier_code,
//               sup.supplier_name,
//               sup.supplier_email,
//               sup.supplier_phone_number
//             FROM bom_supplier_co_product_value_calculation scp
//             LEFT JOIN product_type pt ON pt.id = scp.co_product_id
//             LEFT JOIN supplier_details sup ON sup.id = scp.supplier_id
//             WHERE scp.bom_id = $1
//           `, [bomId]),

//                     // Material emission calc with multiple type joins
//                     client.query(`
//             SELECT mc.*, 
//               al.id AS aluminium_type_id, al.code AS aluminium_code, al.name AS aluminium_name,
//               si.id AS silicon_type_id, si.code AS silicon_code, si.name AS silicon_name,
//               mg.id AS magnesium_type_id, mg.code AS magnesium_code, mg.name AS magnesium_name,
//               ir.id AS iron_type_id, ir.code AS iron_code, ir.name AS iron_name
//             FROM bom_emission_material_calculation_engine mc
//             LEFT JOIN aluminium_type al ON al.id = mc.aluminium_id
//             LEFT JOIN silicon_type si ON si.id = mc.silicon_id
//             LEFT JOIN magnesium_type mg ON mg.id = mc.magnesium_id
//             LEFT JOIN iron_type ir ON ir.id = mc.iron_id
//             WHERE mc.bom_id = $1
//           `, [bomId]),

//                     // Production emission calc
//                     client.query(`
//             SELECT * FROM bom_emission_production_calculation_engine
//             WHERE bom_id = $1
//           `, [bomId]),

//                     // Packaging emission calc
//                     client.query(`
//             SELECT * FROM bom_emission_packaging_calculation_engine
//             WHERE bom_id = $1
//           `, [bomId]),

//                     // Waste emission calc
//                     client.query(`
//             SELECT * FROM bom_emission_waste_calculation_engine
//             WHERE bom_id = $1
//           `, [bomId]),

//                     // Logistics emission calc with multiple joins
//                     client.query(`
//             SELECT le.*, 
//               tm.code AS transport_mode_code, tm.name AS transport_mode_name,
//               vd.code AS vehicle_code, vd.name AS vehicle_name, 
//               vd.make AS vehicle_make, vd.model AS vehicle_model, vd.year AS vehicle_year, vd.number AS vehicle_number,
//               mf.code AS manufacturer_code, mf.name AS manufacturer_name,
//               u.user_name AS user_name
//             FROM bom_emission_logistic_calculation_engine le
//             LEFT JOIN transport_mode tm ON tm.id = le.transport_mode_id
//             LEFT JOIN vehicle_detail vd ON vd.id = le.vehicle_id
//             LEFT JOIN manufacturer mf ON mf.id = le.manufacturer_id
//             LEFT JOIN users_table u ON u.user_id = le.user_id
//             WHERE le.bom_id = $1
//           `, [bomId]),

//                     // Final emission values
//                     client.query(`
//             SELECT * FROM bom_emission_calculation_engine
//             WHERE bom_id = $1
//           `, [bomId]),
//                 ]);

//                 detailedBoms.push({
//                     ...bom,
//                     suppliers: supplierDetails,
//                     supplier_co_product_information: supplierRes.rows,
//                     emission_material_calculation_engine: materialRes.rows,
//                     emission_production_calculation_engine: productionRes.rows,
//                     emission_packaging_calculation_engine: packagingRes.rows,
//                     emission_waste_calculation_engine: wasteRes.rows,
//                     emission_logistic_calculation_engine: logisticRes.rows,
//                     emission_final_pcf_value: emissionRes.rows[0] || null,
//                 });
//             }

//             const pcfRequestStagesQuery = `
//         SELECT 
//           pcfrs.*,

//           u1.user_name AS pcf_request_created_by_name,
//           u1.user_role AS pcf_request_created_by_role,
//           u1.user_department AS pcf_request_created_by_department,
//           u2.user_name AS pcf_request_submitted_by_name,
//           u2.user_role AS pcf_request_submitted_by_role,
//           u2.user_department AS pcf_request_submitted_by_department,
//           u3.user_name AS bom_verified_by_name,
//           u3.user_role AS bom_verified_by_role,
//           u3.user_department AS bom_verified_by_department,
//           u4.user_name AS dqr_completed_by_name,
//           u4.user_role AS dqr_completed_by_role,
//           u4.user_department AS dqr_completed_by_department,
//           u5.user_name AS result_validation_verified_by_name,
//           u5.user_role AS result_validation_verified_by_role,
//           u5.user_department AS result_validation_verified_by_department,
//           u6.user_name AS result_submitted_by_name,
//           u6.user_role AS result_submitted_by_role,
//           u6.user_department AS result_submitted_by_department

//         FROM pcf_request_stages pcfrs
//         LEFT JOIN users_table u1 ON pcfrs.pcf_request_created_by = u1.user_id
//         LEFT JOIN users_table u2 ON pcfrs.pcf_request_submitted_by = u2.user_id
//         LEFT JOIN users_table u3 ON pcfrs.bom_verified_by = u3.user_id
//         LEFT JOIN users_table u4 ON pcfrs.dqr_completed_by = u4.user_id
//         LEFT JOIN users_table u5 ON pcfrs.result_validation_verified_by = u5.user_id
//         LEFT JOIN users_table u6 ON pcfrs.result_submitted_by = u6.user_id
//         WHERE pcfrs.bom_pcf_id = $1
//       `;
//             const pcfRequestStagesResult = await client.query(pcfRequestStagesQuery, [pcf_id]);
//             const pcfRequestStages = pcfRequestStagesResult.rows[0];

//             // ✅ Fetch Data Collection Stage Entries (Many-to-One)
//             let dataCollectionEntries: any[] = [];
//             if (pcfRequestStages) {
//                 const dataCollectionQuery = `
//                     SELECT 
//                       dc.*,
//                       u.user_name AS data_collected_by_name,
//                       u.user_role AS data_collected_by_role,
//                       u.user_department AS data_collected_by_department
//                     FROM pcf_request_data_collection_stage dc
//                     LEFT JOIN users_table u ON dc.data_collected_by = u.user_id
//                     WHERE dc.bom_pcf_id = $1
//                     ORDER BY dc.completed_date ASC;
//                  `;
//                 const dataCollectionResult = await client.query(dataCollectionQuery, [pcf_id]);
//                 dataCollectionEntries = dataCollectionResult.rows;
//             }

//             // Add the data collection info to your existing stage object
//             if (pcfRequestStages) {
//                 pcfRequestStages.data_collection_stage = dataCollectionEntries;
//             }


//             // Final response
//             return res.status(200).json({
//                 success: true,
//                 message: "PCF BOM details fetched successfully",
//                 data: {
//                     pcf_request: pcfRequest,
//                     product_specifications: productSpecifications,
//                     bom_details: detailedBoms,
//                     pcf_request_stages_status: pcfRequestStages
//                 },
//             });
//         } catch (error: any) {
//             console.error("Error fetching PCF BOM details:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message || "Failed to fetch PCF BOM details",
//             });
//         }
//     });
// }

// export async function getPcfBOMList(req: any, res: any) {
//     const { pageNumber, pageSize } = req.query;

//     const limit = parseInt(pageSize) || 20;
//     const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
//     const offset = (page - 1) * limit;

//     return withClient(async (client: any) => {
//         try {
//             // 1️⃣ Main query with joins for pagination
//             const query = `
//         SELECT 
//           pcf.*,
//           pc.id AS product_category_id,
//           pc.code AS product_category_code,
//           pc.name AS product_category_name,

//           cc.id AS component_category_id,
//           cc.code AS component_category_code,
//           cc.name AS component_category_name,

//           ct.id AS component_type_id,
//           ct.code AS component_type_code,
//           ct.name AS component_type_name,

//           m.id AS manufacturer_id,
//           m.code AS manufacturer_code,
//           m.name AS manufacturer_name,
//           m.address AS manufacturer_address,
//           m.lat AS manufacturer_lat,
//           m.long AS manufacturer_long,

//           u1.user_name AS created_by_name,
//           u2.user_name AS updated_by_name
//         FROM bom_pcf_request pcf
//         LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
//         LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
//         LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
//         LEFT JOIN manufacturer m ON m.id = pcf.manufacturer_id
//         LEFT JOIN users_table u1 ON pcf.created_by = u1.user_id
//         LEFT JOIN users_table u2 ON pcf.updated_by = u2.user_id
//         ORDER BY pcf.created_date DESC
//         LIMIT $1 OFFSET $2;
//       `;

//             const countQuery = `
//         SELECT COUNT(*) AS total_count
//         FROM bom_pcf_request;
//       `;

//             const [result, countResult] = await Promise.all([
//                 client.query(query, [limit, offset]),
//                 client.query(countQuery),
//             ]);

//             const rows = result.rows;

//             // 2️⃣ Optional: Fetch related BOMs for each PCF (if needed)
//             for (const pcf of rows) {
//                 const bomResult = await client.query(`
//           SELECT 
//             b.*,
//             m.name AS manufacturer_name,
//             cc.name AS component_category_name
//           FROM bom b
//           LEFT JOIN manufacturer m ON m.id = b.manufacturer_id
//           LEFT JOIN component_category cc ON cc.id = b.component_category_id
//           WHERE b.bom_pcf_id = $1
//         `, [pcf.id]);
//                 pcf.boms = bomResult.rows;
//             }

//             const totalCount = parseInt(countResult.rows[0]?.total_count ?? 0);
//             const totalPages = Math.ceil(totalCount / limit);

//             return res.status(200).json({
//                 success: true,
//                 message: "PCF BOM list fetched successfully",
//                 data: rows,
//                 current_page: page,
//                 total_pages: totalPages,
//                 total_count: totalCount,
//             });
//         } catch (error: any) {
//             console.error("Error fetching PCF BOM list:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message || "Failed to fetch PCF BOM list",
//             });
//         }
//     });
// }

// // export async function createBOMWithDetailsFinal(req: any, res: any) {
// //     return withClient(async (client: any) => {
// //         try {
// //             await client.query("BEGIN");

// //             const {
// //                 bom_pcf_request,
// //                 bom_pcf_request_product_specification,
// //                 bom
// //             } = req.body;

// //             const created_by = req.user_id;

// //             // === Validate required data ===
// //             if (!bom_pcf_request || !bom || !Array.isArray(bom) || bom.length === 0) {
// //                 return res
// //                     .status(400)
// //                     .send(generateResponse(false, "Invalid or missing BOM data", 400, null));
// //             }

// //             // === Insert into bom_pcf_request ===
// //             const bomPcfId = ulid();
// //             const bomPcfCode = `BOMPCF-${Date.now()}`;

// //             const bomPcfData = {
// //                 id: bomPcfId,
// //                 code: bomPcfCode,
// //                 created_by,
// //                 ...bom_pcf_request
// //             };

// //             await bomService.insertPCFBOMRequest(client, bomPcfData);

// //             // === Insert into bom_pcf_request_product_specification ===
// //             if (Array.isArray(bom_pcf_request_product_specification)) {
// //                 for (const spec of bom_pcf_request_product_specification) {
// //                     await bomService.insertPCFBOMRequestProductSpec(client, {
// //                         id: ulid(),
// //                         bom_pcf_id: bomPcfId,
// //                         ...spec
// //                     });
// //                 }
// //             }

// //             // === Insert each BOM item ===
// //             for (const item of bom) {
// //                 const bomId = ulid();
// //                 const bomCode = `BOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// //                 // Total Weight and Price
// //                 const total_weight_gms = (item.weight_gms || 0) * (item.qunatity || 1);
// //                 const total_price = (item.price || 0) * (item.qunatity || 1);

// //                 const bomData = {
// //                     id: bomId,
// //                     code: bomCode,
// //                     created_by,
// //                     bom_pcf_id: bomPcfId,
// //                     total_weight_gms,
// //                     total_price,
// //                     ...item
// //                 };

// //                 await bomService.insertBOM(client, bomData);
// //             }

// //             // === Insert into PCF stages ===
// //             const bomPCFStagesData = {
// //                 id: ulid(),
// //                 bom_pcf_id: bomPcfId,
// //                 is_pcf_request_created: true,
// //                 is_pcf_request_submitted: true,
// //                 pcf_request_created_by: created_by,
// //                 pcf_request_submitted_by: created_by,
// //                 pcf_request_created_date: new Date(),
// //                 pcf_request_submitted_date: new Date()
// //             };

// //             await bomService.insertPCFBOMRequestStages(client, bomPCFStagesData);

// //             await client.query("COMMIT");

// //             return res.status(201).send(
// //                 generateResponse(true, "BOM and related data created successfully", 201, {
// //                     pcf_id: bomPcfId,
// //                     code: bomPcfCode
// //                 })
// //             );
// //         } catch (error: any) {
// //             await client.query("ROLLBACK");
// //             console.error("❌ Error creating BOM:", error);
// //             return res.status(500).json({
// //                 success: false,
// //                 message: error.message || "Failed to create BOM data"
// //             });
// //         }
// //     });
// // }

// // ✅ Manufacturer lookup or creation

// async function getOrCreateManufacturer(client: any, name: string, address: string) {
//     const findQuery = `SELECT id FROM manufacturer WHERE name = $1 LIMIT 1`;
//     const findResult = await client.query(findQuery, [name]);

//     if (findResult.rows.length > 0) {
//         return findResult.rows[0].id;
//     }

//     const newId = ulid();
//     const newCode = `MANU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

//     const insertQuery = `
//         INSERT INTO manufacturer (id, name, address,code)
//         VALUES ($1, $2, $3,$4)
//     `;
//     await client.query(insertQuery, [newId, name, address, newCode]);
//     return newId;
// }

// // Component Category lookup or creation
// async function getOrCreateComponentCategory(client: any, name: string, description: string) {
//     const findQuery = `SELECT id FROM component_category WHERE name = $1 LIMIT 1`;
//     const findResult = await client.query(findQuery, [name]);

//     if (findResult.rows.length > 0) {
//         return findResult.rows[0].id;
//     }

//     const newId = ulid();
//     const newCode = `COMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

//     const insertQuery = `
//         INSERT INTO component_category (id, name, description,code)
//         VALUES ($1, $2, $3,$4)
//     `;
//     await client.query(insertQuery, [newId, name, description, newCode]);
//     return newId;
// }

// //Transport Mode lookup or creation
// async function getOrCreateTransportMode(client: any, name: string) {
//     const findQuery = `SELECT id FROM transport_mode WHERE name = $1 LIMIT 1`;
//     const findResult = await client.query(findQuery, [name]);

//     if (findResult.rows.length > 0) {
//         return findResult.rows[0].id;
//     }

//     const newId = ulid();
//     const newCode = `TRANS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

//     const insertQuery = `
//         INSERT INTO transport_mode (id, name,code)
//         VALUES ($1, $2,$3)
//     `;
//     await client.query(insertQuery, [newId, name, newCode]);
//     return newId;
// }

// async function getOrCreateSupplier(client: any, supplier: any) {
//     const { supplier_name, supplier_email, supplier_phone_number } = supplier;

//     // Check if supplier exists
//     const findQuery = `SELECT id FROM supplier_details WHERE supplier_email = $1 LIMIT 1`;
//     const findResult = await client.query(findQuery, [supplier_email]);

//     if (findResult.rows.length > 0) {
//         const existingId = findResult.rows[0].id;

//         // Update supplier info if changed
//         const updateQuery = `
//             UPDATE supplier_details
//             SET supplier_name = $1, supplier_phone_number = $2, update_date = NOW()
//             WHERE id = $3
//         `;
//         await client.query(updateQuery, [supplier_name, supplier_phone_number, existingId]);
//         return existingId;
//     }

//     // If not found → insert new supplier
//     const newId = ulid();
//     // === Generate new code ===
//     const lastCodeRes = await client.query(`
//         SELECT code 
//         FROM supplier_details 
//         WHERE code LIKE 'SUP%' 
//         ORDER BY created_date DESC 
//         LIMIT 1;
//       `);

//     let newCode = "SUP00001";
//     if (lastCodeRes.rows.length > 0) {
//         const lastCode = lastCodeRes.rows[0].code; // e.g. "SUP00012"
//         const numPart = parseInt(lastCode.replace("SUP", ""), 10);
//         const nextNum = numPart + 1;
//         newCode = "SUP" + String(nextNum).padStart(5, "0");
//     }

//     const insertQuery = `
//         INSERT INTO supplier_details (id, code, supplier_name, supplier_email, supplier_phone_number)
//         VALUES ($1, $2, $3, $4, $5)
//     `;
//     await client.query(insertQuery, [newId, newCode, supplier_name, supplier_email, supplier_phone_number]);
//     return newId;
// }

// export async function createBOMWithDetailsFinal(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             await client.query("BEGIN");

//             const {
//                 basic_details,
//                 bom_pcf_request,
//                 bom_pcf_request_product_specification,
//                 bom
//             } = req.body;

//             const created_by = req.user_id;

//             if (!basic_details) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Invalid or missing basic details data", 400, null));
//             }
//             // === Validate required data ===
//             if (!bom_pcf_request || !bom || !Array.isArray(bom) || bom.length === 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Invalid or missing BOM data", 400, null));
//             }

//             // === Insert into bom_pcf_request ===
//             const bomPcfId = ulid();
//             const bomPcfCode = `BOMPCF-${Date.now()}`;

//             const bomPcfData = {
//                 id: bomPcfId,
//                 code: bomPcfCode,
//                 created_by,
//                 request_title: basic_details.request_title,
//                 priority: basic_details.priority,
//                 request_organization: basic_details.request_organization,
//                 due_date: basic_details.due_date,
//                 request_description: basic_details.request_description,
//                 ...bom_pcf_request
//             };

//             await bomService.insertPCFBOMRequest(client, bomPcfData);

//             // === Insert into bom_pcf_request_product_specification ===
//             if (Array.isArray(bom_pcf_request_product_specification)) {
//                 for (const spec of bom_pcf_request_product_specification) {
//                     await bomService.insertPCFBOMRequestProductSpec(client, {
//                         id: ulid(),
//                         bom_pcf_id: bomPcfId,
//                         ...spec
//                     });
//                 }
//             }

//             // === Insert each BOM item with manufacturer, component category, transport mode ===
//             for (const item of bom) {
//                 const bomId = ulid();
//                 const bomCode = `BOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

//                 // 🔹 1. Manufacturer Handling
//                 let manufacturer_id = null;
//                 if (item.manufacturer_name) {
//                     manufacturer_id = await getOrCreateManufacturer(client, item.manufacturer_name, item.production_location);
//                 }

//                 // 🔹 2. Component Category Handling
//                 let component_category_id = null;
//                 if (item.component_category_name) {
//                     component_category_id = await getOrCreateComponentCategory(client, item.component_category_name, item.detail_description);
//                 }

//                 // 🔹 3. Transport Mode Handling
//                 let transport_mode_id = null;
//                 if (item.transport_mode_name) {
//                     transport_mode_id = await getOrCreateTransportMode(client, item.transport_mode_name);
//                 }

//                 // 🔹 Supplier handling
//                 let supplier_ids: string[] = [];
//                 if (Array.isArray(item.supplier_data)) {
//                     for (const supplier of item.supplier_data) {
//                         const supplier_id = await getOrCreateSupplier(client, supplier);
//                         supplier_ids.push(supplier_id);
//                     }
//                 }

//                 console.log(supplier_ids, "supplier_idssupplier_idssupplier_ids");

//                 // Compute totals
//                 const total_weight_gms = (item.weight_gms || 0) * (item.qunatity || 1);
//                 const total_price = (item.price || 0) * (item.qunatity || 1);

//                 const bomData = {
//                     id: bomId,
//                     code: bomCode,
//                     created_by,
//                     bom_pcf_id: bomPcfId,
//                     total_weight_gms,
//                     total_price,
//                     manufacturer_id,
//                     component_category_id,
//                     transport_mode_id,
//                     supplier_ids,
//                     ...item
//                 };

//                 await bomService.insertBOM(client, bomData);
//             }

//             // === Insert into PCF stages ===
//             const bomPCFStagesData = {
//                 id: ulid(),
//                 bom_pcf_id: bomPcfId,
//                 is_pcf_request_created: true,
//                 is_pcf_request_submitted: true,
//                 pcf_request_created_by: created_by,
//                 pcf_request_submitted_by: created_by,
//                 pcf_request_created_date: new Date(),
//                 pcf_request_submitted_date: new Date()
//             };

//             await bomService.insertPCFBOMRequestStages(client, bomPCFStagesData);

//             await client.query("COMMIT");

//             return res.status(201).send(
//                 generateResponse(true, "BOM and related data created successfully", 201, {
//                     pcf_id: bomPcfId,
//                     code: bomPcfCode
//                 })
//             );

//         } catch (error: any) {
//             await client.query("ROLLBACK");
//             console.error("❌ Error creating BOM:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message || "Failed to create BOM data"
//             });
//         }
//     });
// }

// ==================== > NEW Apis <===========================
export async function createPcfRequestWithBOMDetails(req: any, res: any) {
    return withClient(async (client: any) => {

        await client.query("BEGIN");
        try {

            const {
                bom_pcf_request,
                bom_pcf_request_product_specification,
                bom
            } = req.body;


            const created_by = req.user_id;

            // Insert into bom_pcf_request
            const bomPcfId = ulid();
            const bomPcfCode = `PCF-${Date.now()}`;

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

            // Insert into bom
            if (Array.isArray(bom)) {
                for (const BomDetails of bom) {

                    const total_weight_gms = parseInt(BomDetails.qunatity) * parseFloat(BomDetails.weight_gms);
                    const total_price = parseInt(BomDetails.qunatity) * parseFloat(BomDetails.price);
                    console.log(total_weight_gms, "calculation pcf", parseInt(BomDetails.qunatity), BomDetails.weight_gms);

                    // insert or fetch supplier id
                    const supplier_id = await supplierService.getOrCreateSupplier(client, {
                        supplier_email: BomDetails.supplier_email,
                        supplier_name: BomDetails.supplier_name,
                        supplier_phone_number: BomDetails.supplier_phone_number
                    });

                    await bomService.insertBOM(client, {
                        id: ulid(),
                        bom_pcf_id: bomPcfId,
                        total_price: total_price,
                        total_weight_gms: total_weight_gms,
                        created_by: created_by,
                        supplier_id: supplier_id,
                        ...BomDetails
                    });
                }
            }

            const bomPCFStagesData = {
                id: ulid(),
                bom_pcf_id: bomPcfId,
                is_pcf_request_created: true,
                is_pcf_request_submitted: true,
                pcf_request_created_by: req.user_id,
                pcf_request_submitted_by: req.user_id,
                pcf_request_created_date: new Date(),
                pcf_request_submitted_date: new Date()
            };

            await bomService.insertPCFBOMRequestStages(client, bomPCFStagesData);

            await client.query("COMMIT");

            return res.status(200).send(
                generateResponse(true, "PCF request AND BOM created Successfully!", 200, {
                    bom_pcf_id: bomPcfId,
                    bom_pcf_code: bomPcfCode
                })
            );


        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("Error creating PCF BOM:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to create PCF BOM data"
            });
        }
    });
}

export const supplierService = {
    getOrCreateSupplier: async (
        client: any,
        supplier: {
            supplier_email: string;
            supplier_name?: string;
            supplier_phone_number?: string;
        }
    ): Promise<string | null> => {

        if (!supplier.supplier_email) {
            return null;
        }

        const query = `
            INSERT INTO supplier_details (
                sup_id,
                supplier_email,
                supplier_name,
                supplier_phone_number,
                code
            )
            VALUES ($1, $2, $3, $4,'SUP' || LPAD(nextval('supplier_code_seq')::text, 5, '0'))
            ON CONFLICT (supplier_email)
            DO UPDATE SET
                supplier_name = COALESCE(EXCLUDED.supplier_name, supplier_details.supplier_name),
                supplier_phone_number = COALESCE(EXCLUDED.supplier_phone_number, supplier_details.supplier_phone_number)
            RETURNING sup_id;
        `;

        const values = [
            ulid(),
            supplier.supplier_email,
            supplier.supplier_name || null,
            supplier.supplier_phone_number || null
        ];

        const result = await client.query(query, values);
        return result.rows[0].sup_id;
    },
};

export async function getPcfRequestWithBOMDetailsList(req: any, res: any) {
    const { pageNumber = 1, pageSize = 20 } = req.query;

    const limit = parseInt(pageSize);
    const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const result = await client.query(
                `
                SELECT
    pcf.id,
    pcf.code,
    pcf.request_title,
    pcf.priority,
    pcf.request_organization,
    pcf.due_date,
    pcf.request_description,
    pcf.product_code,
    pcf.model_version,
    pcf.status,
    pcf.is_approved,
    pcf.is_rejected,
    pcf.reject_reason,
    pcf.is_draft,
    pcf.technical_specification_file,
    pcf.product_images,
    pcf.created_by,
    pcf.updated_by,
    pcf.update_date,
    pcf.created_date,

    /* ---------- Product Category ---------- */
    jsonb_build_object(
        'id', pc.id,
        'code', pc.code,
        'name', pc.name
    ) AS product_category,

    /* ---------- Component Category ---------- */
    jsonb_build_object(
        'id', cc.id,
        'code', cc.code,
        'name', cc.name
    ) AS component_category,

    /* ---------- Component Type ---------- */
    jsonb_build_object(
        'id', ct.id,
        'code', ct.code,
        'name', ct.name
    ) AS component_type,

    /* ---------- Manufacturer ---------- */
    jsonb_build_object(
        'id', m.id,
        'code', m.code,
        'name', m.name,
        'address', m.address,
        'lat', m.lat,
        'long', m.long
    ) AS manufacturer,

    /* ---------- Product Specifications ---------- */
    COALESCE(ps.specs, '[]') AS product_specifications,

    /* ---------- PCF Request Stages ---------- */
    jsonb_build_object(
        'pcf_request_created_by', jsonb_build_object(
            'user_id', ucb.user_id,
            'user_role', ucb.user_role,
            'user_name', ucb.user_name
        ),
        'pcf_request_submitted_by', jsonb_build_object(
            'user_id', usb.user_id,
            'user_role', usb.user_role,
            'user_name', usb.user_name
        ),
        'pcf_request_created_date', prs.pcf_request_created_date,
        'pcf_request_submitted_date', prs.pcf_request_submitted_date
    ) AS pcf_request_stages

FROM bom_pcf_request pcf

/* ---------- Master Joins ---------- */
LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
LEFT JOIN manufacturer m ON m.id = pcf.manufacturer_id

/* ---------- Product Specification (LATERAL) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ps.id,
            'specification_name', ps.specification_name,
            'specification_value', ps.specification_value,
            'specification_unit', ps.specification_unit
        )
    ) AS specs
    FROM bom_pcf_request_product_specification ps
    WHERE ps.bom_pcf_id = pcf.id
) ps ON TRUE

/* ---------- PCF Stages ---------- */
LEFT JOIN pcf_request_stages prs ON prs.bom_pcf_id = pcf.id
LEFT JOIN users_table ucb ON ucb.user_id = prs.pcf_request_created_by
LEFT JOIN users_table usb ON usb.user_id = prs.pcf_request_submitted_by

ORDER BY pcf.created_date DESC
LIMIT $1 OFFSET $2;

`,
                [limit, offset]
            );

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    success: true,
                    page,
                    pageSize: limit,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching PCF BOM list:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch PCF BOM list"
            });
        }
    });
}

export async function getByIdPcfRequestWithBOMDetails(req: any, res: any) {
    const { bom_pcf_id } = req.query;

    return withClient(async (client: any) => {
        try {
            const result = await client.query(
                `
WITH base_pcf AS (
    SELECT
        pcf.id,
        pcf.code,
        pcf.request_title,
        pcf.priority,
        pcf.request_organization,
        pcf.due_date,
        pcf.request_description,
        pcf.status,
        pcf.model_version,
        pcf.is_approved,
        pcf.is_rejected,
        pcf.reject_reason,
        pcf.rejected_by,
        pcf.is_draft,
        pcf.created_date,

        pcf.product_category_id,
        pcf.component_category_id,
        pcf.component_type_id,
        pcf.manufacturer_id

    FROM bom_pcf_request pcf
    WHERE pcf.id = $1
)

SELECT
    base_pcf.*,

    /* ---------------- Category Details ---------------- */
    jsonb_build_object(
        'id', pc.id,
        'code', pc.code,
        'name', pc.name
    ) AS product_category,

    jsonb_build_object(
        'id', cc.id,
        'code', cc.code,
        'name', cc.name
    ) AS component_category,

    jsonb_build_object(
        'id', ct.id,
        'code', ct.code,
        'name', ct.name
    ) AS component_type,

    jsonb_build_object(
        'id', m.id,
        'code', m.code,
        'name', m.name,
        'address', m.address,
        'lat', m.lat,
        'long', m.long
    ) AS manufacturer,

    jsonb_build_object(
        'user_id', urb.user_id,
        'user_role', urb.user_role,
        'user_name', urb.user_name
    ) AS rejectedBy,

    /* ---------------- Product Specifications ---------------- */
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'id', ps.id,
                'specification_name', ps.specification_name,
                'specification_value', ps.specification_value,
                'specification_unit', ps.specification_unit
            )
        ) FILTER (WHERE ps.id IS NOT NULL),
        '[]'
    ) AS product_specifications,

    /* ---------------- BOM List ---------------- */
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'id', b.id,
                'code', b.code,
                'material_number', b.material_number,
                'component_name', b.component_name,
                'quantity', b.qunatity,
                'price', b.price,
                'total_price', b.total_price,
                'weight_gms', b.weight_gms,
                'economic_ratio', b.economic_ratio,
                'total_weight_gms', b.total_weight_gms,
                'production_location',b.production_location,
                'manufacturer',b.manufacturer,
                'detail_description',b.detail_description,
                'component_category',b.component_category,
                'supplier', jsonb_build_object(
                    'sup_id', s.sup_id,
                    'code', s.code,
                    'supplier_name', s.supplier_name,
                    'supplier_email', s.supplier_email,
                    'supplier_phone_number', s.supplier_phone_number
                )
            )
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'
    ) AS bom_list,

    /* ---------------- PCF STAGES (1–1 OBJECT) ---------------- */
    jsonb_build_object(
        'id', st.id,
        'bom_pcf_id', st.bom_pcf_id,
        'is_pcf_request_created', st.is_pcf_request_created,
        'is_pcf_request_submitted', st.is_pcf_request_submitted,
        'is_bom_verified', st.is_bom_verified,
        'is_data_collected', st.is_data_collected,
        'is_dqr_completed', st.is_dqr_completed,
        'is_pcf_calculated', st.is_pcf_calculated,
        'is_result_validation_verified', st.is_result_validation_verified,
        'is_result_submitted', st.is_result_submitted,
        'pcf_request_created_by', st.pcf_request_created_by,
        'pcf_request_submitted_by', st.pcf_request_submitted_by,
        'bom_verified_by', st.bom_verified_by,
        'dqr_completed_by', st.dqr_completed_by,
        'pcf_calculated_by', st.pcf_calculated_by,
        'result_validation_verified_by', st.result_validation_verified_by,
        'result_submitted_by', st.result_submitted_by,
        'pcf_request_created_date', st.pcf_request_created_date,
        'pcf_request_submitted_date', st.pcf_request_submitted_date,
        'bom_verified_date', st.bom_verified_date,
        'dqr_completed_date', st.dqr_completed_date,
        'pcf_calculated_date', st.pcf_calculated_date,
        'result_validation_verified_date', st.result_validation_verified_date,
        'result_submitted_date', st.result_submitted_date,
        'update_date', st.update_date,
        'created_date', st.created_date,
        'pcf_request_created_by', jsonb_build_object(
            'user_id', ucb.user_id,
            'user_role', ucb.user_role,
            'user_name', ucb.user_name
        ),
        'pcf_request_submitted_by', jsonb_build_object(
            'user_id', usb.user_id,
            'user_role', usb.user_role,
            'user_name', usb.user_name
        ),
         'bom_verified_by', jsonb_build_object(
            'user_id', uvb.user_id,
            'user_role', uvb.user_role,
            'user_name', uvb.user_name
        )
    ) AS pcf_request_stages,

/* ---------------- PCF DATA COLLECTION STAGE ---------------- */
COALESCE(
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', dcs.id,
               /*  'bom_id', dcs.bom_id,*/

                /* ---------- Supplier ---------- */
                'supplier', jsonb_build_object(
                    'sup_id', sd.sup_id,
                    'code', sd.code,
                    'supplier_name', sd.supplier_name,
                    'supplier_email', sd.supplier_email,
                    'supplier_phone_number', sd.supplier_phone_number
                ),

                /* ---------- BOM ARRAY (via bom_pcf_id + supplier) ---------- 
                'bom',
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', b2.id,
                                'code', b2.code,
                                'material_number', b2.material_number,
                                'component_name', b2.component_name
                            )
                            ORDER BY b2.created_date DESC
                        )
                        FROM bom b2
                        WHERE b2.bom_pcf_id = dcs.bom_pcf_id
                          AND b2.supplier_id = dcs.sup_id
                    ),
                    '[]'::jsonb
                ),*/

                'is_submitted', dcs.is_submitted,
                'completed_date', dcs.completed_date,
                'created_date', dcs.created_date,
                'update_date', dcs.update_date
            )
        )
        FROM pcf_request_data_collection_stage dcs
        LEFT JOIN supplier_details sd ON sd.sup_id = dcs.sup_id
        WHERE dcs.bom_pcf_id = base_pcf.id
    ),
    '[]'::jsonb
) AS pcf_data_collection_stage,


/* ---------------- PCF DQR DATA COLLECTION STAGE ---------------- */
COALESCE(
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', dcsr.id,
               /*  'bom_id', dcsr.bom_id,*/
                'submitted_by', dcsr.submitted_by,

                'supplier', jsonb_build_object(
                    'sup_id', sd.sup_id,
                    'code', sd.code,
                    'supplier_name', sd.supplier_name,
                    'supplier_email', sd.supplier_email,
                    'supplier_phone_number', sd.supplier_phone_number
                ),

              /*  'bom', jsonb_build_object(
                    'id', b2.id,
                    'code', b2.code,
                    'material_number', b2.material_number,
                    'component_name', b2.component_name
                ),*/

                'submittedBy', jsonb_build_object(
                    'user_id', usmb.user_id,
                    'user_role', usmb.user_role,
                    'user_name', usmb.user_name
                ),

                'is_submitted', dcsr.is_submitted,
                'completed_date', dcsr.completed_date,
                'created_date', dcsr.created_date,
                'update_date', dcsr.update_date
            )
        )
        FROM pcf_request_data_rating_stage dcsr
        LEFT JOIN supplier_details sd ON sd.sup_id = dcsr.sup_id
        LEFT JOIN bom b2 ON b2.id = dcsr.bom_id
        LEFT JOIN users_table usmb ON usmb.user_id = dcsr.submitted_by
        WHERE dcsr.bom_pcf_id = base_pcf.id
    ),
    '[]'
) AS pcf_data_dqr_rating_stage


FROM base_pcf
LEFT JOIN product_category pc ON pc.id = base_pcf.product_category_id
LEFT JOIN component_category cc ON cc.id = base_pcf.component_category_id
LEFT JOIN component_type ct ON ct.id = base_pcf.component_type_id
LEFT JOIN manufacturer m ON m.id = base_pcf.manufacturer_id
LEFT JOIN users_table urb ON urb.user_id = base_pcf.rejected_by
LEFT JOIN bom_pcf_request_product_specification ps ON ps.bom_pcf_id = base_pcf.id
LEFT JOIN bom b ON b.bom_pcf_id = base_pcf.id
LEFT JOIN supplier_details s ON s.sup_id = b.supplier_id
LEFT JOIN pcf_request_stages st ON st.bom_pcf_id = base_pcf.id
LEFT JOIN users_table ucb ON ucb.user_id = st.pcf_request_created_by
LEFT JOIN users_table usb ON usb.user_id = st.pcf_request_submitted_by
LEFT JOIN users_table uvb ON uvb.user_id = st.bom_verified_by
GROUP BY
    base_pcf.id,
    base_pcf.code,
    base_pcf.request_title,
    base_pcf.priority,
    base_pcf.request_organization,
    base_pcf.due_date,
    base_pcf.request_description,
    base_pcf.status,
    base_pcf.model_version,
    base_pcf.is_approved,
    base_pcf.is_rejected,
    base_pcf.is_draft,
    base_pcf.created_date,
    base_pcf.product_category_id,
    base_pcf.component_category_id,
    base_pcf.component_type_id,
    base_pcf.manufacturer_id,
    usb.user_id,
    ucb.user_id,
    uvb.user_id,
    base_pcf.reject_reason,
    base_pcf.rejected_by,
    urb.user_id,
    pc.id,
    cc.id,
    ct.id,
    m.id,
    st.id;

`,
                [bom_pcf_id]
            );

            return res.status(200).send(
                generateResponse(true, "PCF request AND BOM fetched Successfully!", 200, result.rows)
            );

        } catch (error: any) {
            console.error("Error fetching PCF BOM list:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch PCF BOM list"
            });
        }
    });
}

export async function updateBomVerificationStatus(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { bom_pcf_id, is_bom_verified, is_approved } = req.body;

            const user_id = req.user_id;

            // Validate input
            if (!bom_pcf_id) {
                return res.send(generateResponse(false, "bom_pcf_id is required", 400, null));
            }

            if (typeof is_bom_verified === "undefined") {
                return res.send(generateResponse(false, "is_bom_verified is required", 400, null));
            }

            if (typeof is_approved === "undefined") {
                return res.send(generateResponse(false, "is_approved is required", 400, null));
            }

            // Update query
            const updateQuery = `
                UPDATE pcf_request_stages
                SET 
                    is_bom_verified = $1,
                    bom_verified_by = $3,
                    bom_verified_date = NOW(),
                    update_date = NOW()
                WHERE bom_pcf_id = $2
                RETURNING *;
            `;

            const updatePcf = `
                UPDATE bom_pcf_request
                SET 
                    is_approved = $1,
                    status = 'Approved'
                WHERE id = $2
                RETURNING *;
            `;
            await client.query(updatePcf, [is_approved, bom_pcf_id]);

            const result = await client.query(updateQuery, [is_bom_verified, bom_pcf_id, user_id]);

            if (result.rows.length === 0) {
                return res.send(generateResponse(false, "No record found for given bom_pcf_id", 404, null));
            }

            // Success
            return res.send(
                generateResponse(true, "BOM verification status updated successfully", 200, result.rows[0])
            );

        } catch (error: any) {
            console.error("❌ Error in updateBomVerificationStatus:", error.message);
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateBomRejectionStatus(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { bom_pcf_id, is_rejected, reject_reason } = req.body;

            const user_id = req.user_id;

            // Validate input
            if (!bom_pcf_id || !reject_reason) {
                return res.send(generateResponse(false, "bom_pcf_id and reject_reason is required", 400, null));
            }

            if (typeof is_rejected === "undefined") {
                return res.send(generateResponse(false, "is_rejected is required", 400, null));
            }

            const updatePcf = `
                UPDATE bom_pcf_request
                SET 
                    is_rejected = $1,
                    status = 'Rejected',
                    reject_reason =$3,
                    rejected_by = $4
                WHERE id = $2
                RETURNING *;
            `;
            const result = await client.query(updatePcf, [is_rejected, bom_pcf_id, reject_reason, user_id]);


            if (result.rows.length === 0) {
                return res.send(generateResponse(false, "No record found for given bom_pcf_id", 404, null));
            }

            // Success
            return res.send(
                generateResponse(true, "BOM PCF Rejected successfully", 200, result.rows[0])
            );

        } catch (error: any) {
            console.error("❌ Error in updateBomRejectionStatus:", error.message);
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function deleteProductSpecification(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;

            // Validate input
            if (!id) {
                return res.send(
                    generateResponse(false, "id is required", 400, null)
                );
            }

            const deleteQuery = `
                DELETE FROM bom_pcf_request_product_specification
                WHERE id = $1
                RETURNING *;
            `;

            const result = await client.query(deleteQuery, [id]);

            if (result.rowCount === 0) {
                return res.send(
                    generateResponse(false, "No record found for given id", 404, null)
                );
            }

            return res.send(
                generateResponse(true, "Product specification deleted successfully", 200, result.rows[0])
            );

        } catch (error: any) {
            console.error("❌ Error deleting product specification:", error);
            return res.send(
                generateResponse(false, error.message || "Delete failed", 500, null)
            );
        }
    });
}

export async function deleteBOM(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;

            // Validate input
            if (!id) {
                return res.send(
                    generateResponse(false, "id is required", 400, null)
                );
            }

            const deleteQuery = `
                DELETE FROM bom
                WHERE id = $1
                RETURNING *;
            `;

            const result = await client.query(deleteQuery, [id]);

            if (result.rowCount === 0) {
                return res.send(
                    generateResponse(false, "No record found for given id", 404, null)
                );
            }

            return res.send(
                generateResponse(true, "BOM deleted successfully", 200, result.rows[0])
            );

        } catch (error: any) {
            console.error("❌ Error deleting NOM:", error);
            return res.send(
                generateResponse(false, error.message || "Delete failed", 500, null)
            );
        }
    });
}

export async function updatePcfRequestWithBOMDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query("BEGIN");
        try {
            const {
                bom_pcf_request,
                bom_pcf_request_product_specification,
                bom
            } = req.body;

            const updated_by = req.user_id;

            if (!bom_pcf_request?.id) {
                return res.send(
                    generateResponse(false, "bom_pcf_request.id is required", 400, null)
                );
            }

            const bomPcfId = bom_pcf_request.id;

            /* --------------------------------------------------
               1️⃣ UPDATE bom_pcf_request
            -------------------------------------------------- */
            const updatePCFQuery = `
                UPDATE bom_pcf_request
                SET
                    request_title = $1,
                    priority = $2,
                    request_organization = $3,
                    due_date = $4,
                    request_description = $5,
                    product_category_id = $6,
                    component_category_id = $7,
                    component_type_id = $8,
                    product_code = $9,
                    manufacturer_id = $10,
                    model_version = $11,
                    updated_by = $12,
                    update_date = CURRENT_TIMESTAMP,
                    technical_specification_file =$14,
                    product_images=$15,
                    is_draft=$16
                WHERE id = $13
            `;

            await client.query(updatePCFQuery, [
                bom_pcf_request.request_title,
                bom_pcf_request.priority,
                bom_pcf_request.request_organization,
                bom_pcf_request.due_date,
                bom_pcf_request.request_description,
                bom_pcf_request.product_category_id,
                bom_pcf_request.component_category_id,
                bom_pcf_request.component_type_id,
                bom_pcf_request.product_code,
                bom_pcf_request.manufacturer_id,
                bom_pcf_request.model_version,
                updated_by,
                bomPcfId,
                bom_pcf_request.technical_specification_file,
                bom_pcf_request.product_images,
                bom_pcf_request.is_draft
            ]);

            /* --------------------------------------------------
               2️⃣ UPSERT Product Specifications
            -------------------------------------------------- */
            if (Array.isArray(bom_pcf_request_product_specification)) {
                for (const spec of bom_pcf_request_product_specification) {
                    if (spec.id) {
                        // UPDATE
                        await client.query(
                            `
                            UPDATE bom_pcf_request_product_specification
                            SET
                                specification_name = $1,
                                specification_value = $2,
                                specification_unit = $3,
                                update_date = CURRENT_TIMESTAMP
                            WHERE id = $4
                            `,
                            [
                                spec.specification_name,
                                spec.specification_value,
                                spec.specification_unit,
                                spec.id
                            ]
                        );
                    } else {
                        // INSERT
                        await client.query(
                            `
                            INSERT INTO bom_pcf_request_product_specification (
                                id,
                                bom_pcf_id,
                                specification_name,
                                specification_value,
                                specification_unit
                            )
                            VALUES ($1, $2, $3, $4, $5)
                            `,
                            [
                                ulid(),
                                bomPcfId,
                                spec.specification_name,
                                spec.specification_value,
                                spec.specification_unit
                            ]
                        );
                    }
                }
            }

            /* --------------------------------------------------
               3️⃣ UPSERT BOM Items
            -------------------------------------------------- */
            if (Array.isArray(bom)) {
                for (const bomItem of bom) {

                    const total_weight_gms = bomItem.qunatity * bomItem.weight_gms;
                    const total_price = bomItem.qunatity * bomItem.price;

                    // supplier upsert
                    const supplier_id = await supplierService.getOrCreateSupplier(client, {
                        supplier_email: bomItem.supplier_email,
                        supplier_name: bomItem.supplier_name,
                        supplier_phone_number: bomItem.supplier_phone_number
                    });

                    if (bomItem.id) {
                        // UPDATE BOM
                        await client.query(
                            `
                            UPDATE bom
                            SET
                                material_number = $1,
                                component_name = $2,
                                qunatity = $3,
                                production_location = $4,
                                manufacturer = $5,
                                detail_description = $6,
                                weight_gms = $7,
                                total_weight_gms = $8,
                                component_category = $9,
                                price = $10,
                                total_price = $11,
                                supplier_id = $12,
                                update_date = CURRENT_TIMESTAMP
                            WHERE id = $13
                            `,
                            [
                                bomItem.material_number,
                                bomItem.component_name,
                                bomItem.qunatity,
                                bomItem.production_location,
                                bomItem.manufacturer,
                                bomItem.detail_description,
                                bomItem.weight_gms,
                                total_weight_gms,
                                bomItem.component_category,
                                bomItem.price,
                                total_price,
                                supplier_id,
                                bomItem.id
                            ]
                        );
                    } else {
                        // INSERT BOM
                        await client.query(
                            `
                            INSERT INTO bom (
                                id,
                                bom_pcf_id,
                                material_number,
                                component_name,
                                qunatity,
                                production_location,
                                manufacturer,
                                detail_description,
                                weight_gms,
                                total_weight_gms,
                                component_category,
                                price,
                                total_price,
                                supplier_id,
                                created_by
                            )
                            VALUES (
                                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
                            )
                            `,
                            [
                                ulid(),
                                bomPcfId,
                                bomItem.material_number,
                                bomItem.component_name,
                                bomItem.qunatity,
                                bomItem.production_location,
                                bomItem.manufacturer,
                                bomItem.detail_description,
                                bomItem.weight_gms,
                                total_weight_gms,
                                bomItem.component_category,
                                bomItem.price,
                                total_price,
                                supplier_id,
                                updated_by
                            ]
                        );
                    }
                }
            }

            await client.query("COMMIT");

            return res.send(
                generateResponse(true, "PCF request updated successfully", 200, {
                    bom_pcf_id: bomPcfId
                })
            );

        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("❌ Error updating PCF BOM:", error);
            return res.send(
                generateResponse(false, error.message || "Update failed", 500, null)
            );
        }
    });
}

export async function createPcfBomComment(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { bom_pcf_id, comment } = req.body;
            const user_id = req.user_id;

            if (!bom_pcf_id || !comment) {
                return res.send(
                    generateResponse(false, "bom_pcf_id and comment are required", 400, null)
                );
            }

            const insertQuery = `
                INSERT INTO pcf_bom_comments (
                    id,
                    bom_pcf_id,
                    user_id,
                    comment,
                    commented_at
                )
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                RETURNING *
            `;

            const result = await client.query(insertQuery, [
                ulid(),
                bom_pcf_id,
                user_id,
                comment
            ]);

            return res.send(
                generateResponse(true, "Comment added successfully", 200, result.rows[0])
            );

        } catch (error: any) {
            console.error("❌ Error creating comment:", error);
            return res.send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function getPcfBomCommentsByBomId(req: any, res: any) {
    const { bom_pcf_id, pageNumber = 1, pageSize = 40 } = req.query;

    const limit = parseInt(pageSize);
    const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            if (!bom_pcf_id) {
                return res.send(
                    generateResponse(false, "bom_pcf_id is required", 400, null)
                );
            }

            const listQuery = `
                SELECT
                    c.id,
                    c.comment,
                    c.commented_at,
                    c.created_date,
                    jsonb_build_object(
                        'user_id', u.user_id,
                        'user_name', u.user_name,
                        'user_role', u.user_role
                    ) AS commented_by
                FROM pcf_bom_comments c
                LEFT JOIN users_table u ON u.user_id = c.user_id
                WHERE c.bom_pcf_id = $1
                ORDER BY c.commented_at DESC
                LIMIT $2 OFFSET $3
            `;

            const countQuery = `
                SELECT COUNT(*)::int AS total
                FROM pcf_bom_comments
                WHERE bom_pcf_id = $1
            `;

            const [listResult, countResult] = await Promise.all([
                client.query(listQuery, [bom_pcf_id, limit, offset]),
                client.query(countQuery, [bom_pcf_id])
            ]);

            return res.send(
                generateResponse(true, "Comments fetched successfully", 200, {
                    page,
                    pageSize: limit,
                    total: countResult.rows[0].total,
                    data: listResult.rows
                })
            );

        } catch (error: any) {
            console.error("❌ Error fetching comments:", error);
            return res.send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function pcfCalculate(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { bom_pcf_id } = req.body;

            // Validate input
            if (!bom_pcf_id) {
                return res.send(
                    generateResponse(false, "bom_pcf_id is required", 400, null)
                );
            }

            // Check PCF request stage
            const checkQuery = `
                SELECT is_pcf_calculated
                FROM pcf_request_stages
                WHERE bom_pcf_id = $1;
            `;

            const result = await client.query(checkQuery, [bom_pcf_id]);

            if (result.rowCount === 0) {
                return res.send(
                    generateResponse(false, "No PCF request found for given bom_pcf_id", 404, null)
                );
            }

            if (result.rows[0].is_pcf_calculated === true) {
                return res.send(
                    generateResponse(false, "PCF is already calculated for this BOM", 400, null)
                );
            }

            // To fetch ALL BOM for particular PCF 
            const fetchAllBOM = `
                SELECT id,bom_pcf_id,material_number,economic_ratio,
                component_name,qunatity,production_location,
                weight_gms,total_weight_gms,price,total_price
                FROM bom
                WHERE bom_pcf_id = $1;
            `;

            const allBOMResult = await client.query(fetchAllBOM, [bom_pcf_id]);

            const TotalBomDetails = [];
            for (let BomData of allBOMResult.rows) {

                const fetchSGIQID = `
                SELECT sgiq_id,bom_pcf_id,sup_id,annual_reporting_period
                FROM supplier_general_info_questions
                WHERE bom_pcf_id = $1;
            `;

                const fetchSGIQIDSupResult = await client.query(fetchSGIQID, [bom_pcf_id]);

                let Total_Housing_Component_Emissions = 0;
                //========> Phase one start
                let Raw_Material_emissions = 0;

                // FEtching materials For Particular BOM
                const fetchQ52 = `
                SELECT rmuicm_id,stoie_id,bom_id,
                material_number,material_name,percentage
                FROM raw_materials_used_in_component_manufacturing_questions
                WHERE bom_id = $1;
            `;

                const fetchQ52SupResult = await client.query(fetchQ52, [BomData.id]);

                for (let ProductData of fetchQ52SupResult.rows) {
                    const fetchQ13 = `
                SELECT bom_id,
                material_number,product_name,location
                FROM production_site_details_questions
                WHERE bom_id = $1;
            `;

                    const fetchQ13SupResult = await client.query(fetchQ13, [BomData.id]);


                    const fetchEmissionMaterialFactor = `
                SELECT element_name,year,unit,
                ef_eu_region,ef_india_region,ef_global_region
                FROM materials_emission_factor WHERE element_name=$1 AND year=$2 AND unit=$3;
            `;

                    const fetchEmissionMaterialFactorSupResult = await client.query(fetchEmissionMaterialFactor, [ProductData.material_name, fetchSGIQIDSupResult.rows[0].annual_reporting_period, "Kg"]);

                    let Material_Emission_Factor_kg_CO2E_kg = 0;
                    if (fetchEmissionMaterialFactorSupResult.rows) {

                        if (fetchQ13SupResult.rows[0]) {

                            if (fetchQ13SupResult.rows[0].location.toLowerCase() === "india") {
                                Material_Emission_Factor_kg_CO2E_kg += parseFloat(fetchEmissionMaterialFactorSupResult.rows[0].ef_india_region)
                            }

                            if (fetchQ13SupResult.rows[0].location.toLowerCase() === "europe") {
                                Material_Emission_Factor_kg_CO2E_kg += parseFloat(fetchEmissionMaterialFactorSupResult.rows[0].ef_eu_region)
                            }

                            if (fetchQ13SupResult.rows[0].location.toLowerCase() === "global") {
                                Material_Emission_Factor_kg_CO2E_kg += parseFloat(fetchEmissionMaterialFactorSupResult.rows[0].ef_global_region)
                            }

                        }

                    }

                    console.log("Component Weight (kg):", BomData.weight_gms);

                    const weightInKg = parseFloat(BomData.weight_gms) / 1000;

                    const material_composition = ProductData.percentage;
                    const material_composition_weight = ((weightInKg / 100) * ProductData.percentage);


                    console.log("Material composition (%):", ProductData.percentage);
                    console.log("Weight In KG convert:", weightInKg);

                    console.log("Material composition Weight in (Kg):", (weightInKg / 100) * ProductData.percentage);
                    console.log("Material_Emission_Factor_kg_CO2E_kg:", Material_Emission_Factor_kg_CO2E_kg);
                    console.log("Material emissions (kg CO₂e):", ((weightInKg / 100) * ProductData.percentage) * Material_Emission_Factor_kg_CO2E_kg);
                    let Material_emissions_kg_CO_e = ((((weightInKg / 100) * ProductData.percentage) * Material_Emission_Factor_kg_CO2E_kg));
                    Raw_Material_emissions += Material_emissions_kg_CO_e;

                    // ====> Insert into bom_emission_material_calculation_engine table
                    const queryMaterial = `
                        INSERT INTO bom_emission_material_calculation_engine 
                        (id,bom_id, material_type, material_composition,
                         material_composition_weight, material_emission_factor,material_emission)
                        VALUES ($1,$2, $3, $4, $5, $6, $7)
                        RETURNING *;
                    `;

                    await client.query(queryMaterial, [
                        ulid(),
                        BomData.id,
                        ProductData.material_name,
                        material_composition,
                        material_composition_weight,
                        Material_Emission_Factor_kg_CO2E_kg,
                        Material_emissions_kg_CO_e
                    ]);

                    // ===> Insert Ends here

                }
                console.log("Raw Material emissions (kg CO₂e):", Raw_Material_emissions);

                Total_Housing_Component_Emissions += Raw_Material_emissions;
                //========> Phase One END

                //========> Second Phase start
                const fetchQ15 = `
                SELECT pcm_id,spq_id,bom_id,
                material_number,product_name,price
                FROM product_component_manufactured_questions
                WHERE bom_id = $1;
            `;

                const fetchQ15SupResult = await client.query(fetchQ15, [BomData.id]);

                const Q15Result = fetchQ15SupResult.rows[0];

                const fetchQ15PointOne = `
                SELECT bom_id,
                material_number,product_name,price_per_product
                FROM co_product_component_economic_value_questions
                WHERE bom_id = $1;
            `;

                const fetchQ15PointOneSupResult = await client.query(fetchQ15PointOne, [BomData.id]);

                const Q15PointOneResult = fetchQ15PointOneSupResult.rows[0];

                // const Economic_Ratio_ER = (Q15Result.price / Q15PointOneResult.price_per_product);
                // console.log("Economic Ratio (ER):", Economic_Ratio_ER);

                const Economic_Ratio_ER = BomData.economic_ratio;

                const Allocation_Method = Economic_Ratio_ER > 5 ? "Economic Allocation Method" : "Physical Mass Balance allocation Method";
                console.log("Allocation Method:", Allocation_Method);

                console.log("Economic_Ratio_ER:", Economic_Ratio_ER);

                // ========>Second Phase End

                // ========>Third Phase Start

                const fetchSTIDEID = `
                SELECT sgiq_id,stide_id
                FROM scope_two_indirect_emissions_questions
                WHERE sgiq_id = $1;
            `;

                const fetchSTIDEIDSupResult = await client.query(fetchSTIDEID, [fetchSGIQIDSupResult.rows[0].sgiq_id]);


                for (let fetchStideId of fetchSTIDEIDSupResult.rows) {
                    const fetchQ22 = `
                SELECT stidefpe_id,stide_id,sup_id,
                energy_source,energy_type,quantity,unit
                FROM scope_two_indirect_emissions_from_purchased_energy_questions
                WHERE stide_id = $1 AND sup_id=$2;
            `;


                    const fetchEnegryResult = await client.query(fetchQ22, [fetchStideId.stide_id, fetchSGIQIDSupResult.rows[0].sup_id]);

                    let Total_Electrical_Energy_consumed_at_Factory_level_kWh = 0;
                    let Total_Heating_Energy_consumed_at_Factory_level_kWh = 0;
                    let Total_Cooling_Energy_consumed_at_Factory_level_kWh = 0;
                    let Total_Steam_Energy_consumed_at_Factory_level_kWh = 0;
                    let Total_Energy_consumed_at_Factory_level_kWh = 0;

                    //                  const fetchQ13 = `
                    //     SELECT bom_id,
                    //     material_number,product_name,location
                    //     FROM production_site_details_questions
                    //     WHERE bom_id = $1;
                    // `;

                    //     const fetchQ13SupResult = await client.query(fetchQ13, [BomData.id]);
                    // for (let Energy of fetchEnegryResult.rows) {

                    //     if (Energy.energy_source.split(" ")[0].toLowerCase() === "electricity") {
                    //         let EnergySource = "Electricity";
                    //         let EnergyType = Energy.energy_type;
                    //         const EnergyResponse = `${EnergySource} - ${EnergyType}`;
                    //         console.log(EnergyResponse, "EnergyResponseEnergyResponse");

                    //         const fetchQ22 = `
                    //             SELECT type_of_energy,ef_eu_region,ef_india_region,
                    //             ef_global_region
                    //             FROM electricity_emission_factor
                    //             WHERE type_of_energy = $1;
                    //          `;


                    //         const fetchEnegryResult = await client.query(fetchQ22, [EnergyResponse]);


                    //         let FetchElectricityEmiassionValue = 0;
                    //         if (fetchEnegryResult.rows) {

                    //             if (fetchQ13SupResult.rows[0].location.toLowerCase() === "india") {
                    //                 FetchElectricityEmiassionValue = fetchEnegryResult.rows[0].ef_india_region

                    //                 Total_Electrical_Energy_consumed_at_Factory_level_kWh = Energy.quantity;

                    //             }

                    //         }
                    //         console.log(FetchElectricityEmiassionValue, "FetchElectricityEmiassionValue");

                    //     }

                    // }

                    for (let Energy of fetchEnegryResult.rows) {
                        console.log(Energy, "EnergyEnergy");

                        if (Energy.energy_source.split(" ")[0].toLowerCase() === "electricity") {
                            Total_Electrical_Energy_consumed_at_Factory_level_kWh += parseFloat(Energy.quantity);
                        }
                        if (Energy.energy_source.split(" ")[0].toLowerCase() === "heating") {
                            Total_Heating_Energy_consumed_at_Factory_level_kWh += parseFloat(Energy.quantity);
                        }
                        if (Energy.energy_source.split(" ")[0].toLowerCase() === "cooling") {
                            Total_Cooling_Energy_consumed_at_Factory_level_kWh += parseFloat(Energy.quantity);
                        }
                        if (Energy.energy_source.split(" ")[0].toLowerCase() === "steam") {
                            Total_Steam_Energy_consumed_at_Factory_level_kWh += parseFloat(Energy.quantity);
                        }
                    }
                    console.log(Total_Electrical_Energy_consumed_at_Factory_level_kWh, "Total_Electrical_Energy_consumed_at_Factory_level_kWh");
                    console.log(Total_Heating_Energy_consumed_at_Factory_level_kWh, "Total_Heating_Energy_consumed_at_Factory_level_kWh");
                    console.log(Total_Cooling_Energy_consumed_at_Factory_level_kWh, "Total_Cooling_Energy_consumed_at_Factory_level_kWh");
                    console.log(Total_Steam_Energy_consumed_at_Factory_level_kWh, "Total_Steam_Energy_consumed_at_Factory_level_kWh");

                    Total_Energy_consumed_at_Factory_level_kWh = Total_Electrical_Energy_consumed_at_Factory_level_kWh + Total_Heating_Energy_consumed_at_Factory_level_kWh +
                        Total_Cooling_Energy_consumed_at_Factory_level_kWh + Total_Steam_Energy_consumed_at_Factory_level_kWh;
                    console.log(Total_Energy_consumed_at_Factory_level_kWh, "Total_Energy_consumed_at_Factory_level_kWh");


                    const fetcSPQID = `
                SELECT spq_id,sgiq_id
                FROM supplier_product_questions
                WHERE sgiq_id = $1;
            `;

                    const fetcSPQIDSupResult = await client.query(fetcSPQID, [fetchSGIQIDSupResult.rows[0].sgiq_id]);


                    const someOfAllProductQues = `
                SELECT spq_id, bom_id,material_number,weight_per_unit,price,quantity
                FROM product_component_manufactured_questions
                WHERE bom_id = $1;
            `;

                    const someOfAllProductQuesSupResult = await client.query(someOfAllProductQues, [BomData.id]);

                    let Total_weight_produced_at_Factory_level_kg = 0;
                    if (someOfAllProductQuesSupResult.rows) {
                        for (let fetchwieghtAndQuanty of someOfAllProductQuesSupResult.rows) {
                            Total_weight_produced_at_Factory_level_kg += parseFloat(fetchwieghtAndQuanty.weight_per_unit) * parseInt(fetchwieghtAndQuanty.quantity);
                        }

                        console.log(Total_weight_produced_at_Factory_level_kg, "Total_weight_produced_at_Factory_level_kg");

                    }

                    let no_of_products_current_component_produced = 0;

                    const partcularProductQuanty = `
                SELECT spq_id,bom_id,material_number,quantity
                FROM product_component_manufactured_questions
                WHERE bom_id = $1;
            `;

                    const partcularProductQuantySupResult = await client.query(partcularProductQuanty, [BomData.id]);

                    if (partcularProductQuantySupResult.rows[0]) {
                        no_of_products_current_component_produced += partcularProductQuantySupResult.rows[0].quantity
                    }
                    console.log("no_of_products_current_component_produced:", no_of_products_current_component_produced);

                    let Total_weight_of_current_component_produced_Kg = 0;
                    if (partcularProductQuantySupResult.rows[0].bom_id === BomData.id) {
                        Total_weight_of_current_component_produced_Kg += ((BomData.weight_gms / 1000) * no_of_products_current_component_produced)
                    }
                    console.log("Total_weight_of_current_component_produced_Kg:", Total_weight_of_current_component_produced_Kg);

                    let Total_electricity_utilised_for_production_all_current_components_kWh = 0;
                    console.log(Total_weight_of_current_component_produced_Kg, Total_weight_produced_at_Factory_level_kg, Total_Electrical_Energy_consumed_at_Factory_level_kWh);
                    Total_electricity_utilised_for_production_all_current_components_kWh = ((Total_weight_of_current_component_produced_Kg / Total_weight_produced_at_Factory_level_kg) * Total_Electrical_Energy_consumed_at_Factory_level_kWh)
                    console.log("Total_electricity_utilised_for_production_all_current_components_kWh :", Total_electricity_utilised_for_production_all_current_components_kWh);

                    let Production_electricity_energy_use_per_unit_kWh = 0;

                    Production_electricity_energy_use_per_unit_kWh =
                        (Total_electricity_utilised_for_production_all_current_components_kWh / no_of_products_current_component_produced);
                    console.log("Production_electricity_energy_use_per_unit_kWh:", Production_electricity_energy_use_per_unit_kWh);

                    let Production_Heating_energy_use_per_unit_kWh = 0;
                    Production_Heating_energy_use_per_unit_kWh = (((Total_weight_of_current_component_produced_Kg / Total_weight_produced_at_Factory_level_kg) * Total_Heating_Energy_consumed_at_Factory_level_kWh) / no_of_products_current_component_produced)
                    console.log("Production_Heating_energy_use_per_unit_kWh :", Production_Heating_energy_use_per_unit_kWh);

                    let Production_Cooling_energy_use_per_unit_kWh = 0;
                    Production_Cooling_energy_use_per_unit_kWh = (((Total_weight_of_current_component_produced_Kg / Total_weight_produced_at_Factory_level_kg) * Total_Cooling_Energy_consumed_at_Factory_level_kWh) / no_of_products_current_component_produced)
                    console.log("Production_Cooling_energy_use_per_unit_kWh :", Production_Cooling_energy_use_per_unit_kWh);

                    let Production_Steam_energy_use_per_unit_kWh = 0;
                    Production_Steam_energy_use_per_unit_kWh = (((Total_weight_of_current_component_produced_Kg / Total_weight_produced_at_Factory_level_kg) * Total_Steam_Energy_consumed_at_Factory_level_kWh) / no_of_products_current_component_produced)
                    console.log("Production_Steam_energy_use_per_unit_kWh :", Production_Steam_energy_use_per_unit_kWh);


                    const fetchQ13Location = `
                        SELECT bom_id,
                        material_number,product_name,location
                        FROM production_site_details_questions
                        WHERE bom_id = $1;
                     `;

                    const fetchQ13LocationSupResult = await client.query(fetchQ13Location, [BomData.id]);


                    let FetchElectricityTypeEmiassionValue = 0;
                    let FetchHeatingTypeEmiassionValue = 0;
                    let FetchSteamTypeEmiassionValue = 0;
                    let FetchCoolingTypeEmiassionValue = 0;
                    for (let Energy of fetchEnegryResult.rows) {

                        if (Energy.energy_source.split(" ")[0].toLowerCase() === "electricity") {
                            let EnergySource = "Electricity";
                            let EnergyType = Energy.energy_type;
                            const EnergyResponse = `${EnergySource} - ${EnergyType}`;
                            console.log(EnergyResponse, "EnergyResponseEnergyResponse", fetchSGIQIDSupResult.rows[0].annual_reporting_period, Energy.unit);

                            const fetchQ22 = `
                                SELECT type_of_energy,ef_eu_region,ef_india_region,
                                ef_global_region,year,unit
                                FROM electricity_emission_factor
                                WHERE type_of_energy = $1 AND year=$2 AND unit=$3;
                             `;


                            const fetchEnegryResult = await client.query(fetchQ22, [EnergyResponse, fetchSGIQIDSupResult.rows[0].annual_reporting_period, Energy.unit]);


                            if (fetchEnegryResult.rows[0]) {

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "india") {
                                    FetchElectricityTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_india_region)
                                }

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "europe") {
                                    FetchElectricityTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_eu_region)
                                }

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "global") {
                                    FetchElectricityTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_global_region)
                                }

                            }
                            console.log(FetchElectricityTypeEmiassionValue, "FetchElectricityTypeEmiassionValue");

                        }

                        if (Energy.energy_source.split(" ")[0].toLowerCase() === "heating") {
                            let EnergySource = "Heating";
                            let EnergyType = Energy.energy_type;
                            const EnergyResponse = `${EnergySource} - ${EnergyType}`;
                            console.log(EnergyResponse, "EnergyResponseEnergyResponse");

                            const fetchQ22 = `
                                SELECT type_of_energy,ef_eu_region,ef_india_region,
                                ef_global_region,year,unit
                                FROM electricity_emission_factor
                                WHERE type_of_energy = $1 AND year=$2 AND unit=$3;
                             `;


                            const fetchEnegryResult = await client.query(fetchQ22, [EnergyResponse, fetchSGIQIDSupResult.rows[0].annual_reporting_period, Energy.unit]);


                            if (fetchEnegryResult.rows[0]) {

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "india") {
                                    FetchHeatingTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_india_region)
                                }

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "europe") {
                                    FetchHeatingTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_eu_region)
                                }

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "global") {
                                    FetchHeatingTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_global_region)
                                }

                            }
                            console.log(FetchHeatingTypeEmiassionValue, "FetchHeatingTypeEmiassionValue");

                        }

                        if (Energy.energy_source.split(" ")[0].toLowerCase() === "steam") {
                            let EnergySource = "Steam";
                            let EnergyType = Energy.energy_type;
                            const EnergyResponse = `${EnergySource} - ${EnergyType}`;
                            console.log(EnergyResponse, "EnergyResponseEnergyResponse");

                            const fetchQ22 = `
                                SELECT type_of_energy,ef_eu_region,ef_india_region,
                                ef_global_region,year,unit
                                FROM electricity_emission_factor
                                WHERE type_of_energy = $1 AND year=$2 AND unit=$3;
                             `;


                            const fetchEnegryResult = await client.query(fetchQ22, [EnergyResponse, fetchSGIQIDSupResult.rows[0].annual_reporting_period, Energy.unit]);


                            if (fetchEnegryResult.rows[0]) {

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "india") {
                                    FetchSteamTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_india_region)
                                }

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "europe") {
                                    FetchSteamTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_eu_region)
                                }

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "global") {
                                    FetchSteamTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_global_region)
                                }

                            }
                            console.log(FetchSteamTypeEmiassionValue, "FetchSteamTypeEmiassionValue");

                        }

                        if (Energy.energy_source.split(" ")[0].toLowerCase() === "cooling") {
                            let EnergySource = "Cooling";
                            let EnergyType = Energy.energy_type;
                            const EnergyResponse = `${EnergySource} - ${EnergyType}`;
                            console.log(EnergyResponse, "EnergyResponseEnergyResponse");

                            const fetchQ22 = `
                                SELECT type_of_energy,ef_eu_region,ef_india_region,
                                ef_global_region,year,unit
                                FROM electricity_emission_factor
                                WHERE type_of_energy = $1 AND year=$2 AND unit=$3;
                             `;


                            const fetchEnegryResult = await client.query(fetchQ22, [EnergyResponse, fetchSGIQIDSupResult.rows[0].annual_reporting_period, Energy.unit]);


                            if (fetchEnegryResult.rows[0]) {

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "india") {
                                    FetchCoolingTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_india_region)
                                }

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "europe") {
                                    FetchCoolingTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_eu_region)
                                }

                                if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "global") {
                                    FetchCoolingTypeEmiassionValue += parseFloat(fetchEnegryResult.rows[0].ef_global_region)
                                }

                            }
                            console.log(FetchCoolingTypeEmiassionValue, "FetchCoolingTypeEmiassionValue");

                        }
                    }


                    console.log("FetchElectricityTypeEmiassionValue:", FetchElectricityTypeEmiassionValue);
                    console.log("FetchHeatingTypeEmiassionValue:", FetchHeatingTypeEmiassionValue);
                    console.log("FetchSteamTypeEmiassionValue:", FetchSteamTypeEmiassionValue);
                    console.log("FetchCoolingTypeEmiassionValue:", FetchCoolingTypeEmiassionValue);

                    let Manufacturing_Emissions_kg_CO2e = 0;

                    Manufacturing_Emissions_kg_CO2e =
                        ((Production_electricity_energy_use_per_unit_kWh * FetchElectricityTypeEmiassionValue) +
                            (Production_Heating_energy_use_per_unit_kWh * FetchHeatingTypeEmiassionValue) +
                            (Production_Cooling_energy_use_per_unit_kWh * FetchHeatingTypeEmiassionValue) +
                            (Production_Steam_energy_use_per_unit_kWh * FetchHeatingTypeEmiassionValue))

                    console.log("Manufacturing_Emissions_kg_CO2e:", Manufacturing_Emissions_kg_CO2e);

                    Total_Housing_Component_Emissions += Manufacturing_Emissions_kg_CO2e;

                    const weightInKg = parseFloat(BomData.weight_gms) / 1000;

                    // ====> Insert into bom_emission_production_calculation_engine table
                    const queryProd = `
                        INSERT INTO bom_emission_production_calculation_engine 
                        (id,bom_id, component_weight_kg, allocation_methodology,
                         total_electrical_energy_consumed_at_factory_level_kWh, total_heating_energy_consumed_at_factory_level_kWh,
                         total_cooling_energy_consumed_at_factory_level_kWh,total_steam_energy_consumed_at_factory_level_kWh,
                         total_energy_consumed_at_factory_level_kWh,total_weight_produced_at_factory_level_kg,
                         no_of_products_current_component_produced,total_weight_of_current_component_produced_kg,
                         total_electricity_utilised_for_production_all_current_components_kWh,
                         production_electricity_energy_use_per_unit_kWh,production_heat_energy_use_per_unit_kWh,
                         production_cooling_energy_use_per_unit_kWh,production_steam_energy_use_per_unit_kWh,
                         emission_factor_of_electricity,emission_factor_of_heat,
                         emission_factor_of_cooling,emission_factor_of_steam)
                        VALUES ($1,$2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                        RETURNING *;
                    `;

                    await client.query(queryProd, [
                        ulid(),
                        BomData.id,
                        weightInKg,
                        Allocation_Method,
                        Total_Electrical_Energy_consumed_at_Factory_level_kWh,
                        Total_Heating_Energy_consumed_at_Factory_level_kWh,
                        Total_Cooling_Energy_consumed_at_Factory_level_kWh,
                        Total_Steam_Energy_consumed_at_Factory_level_kWh,
                        Total_Energy_consumed_at_Factory_level_kWh,
                        Total_weight_produced_at_Factory_level_kg,
                        no_of_products_current_component_produced,
                        Total_weight_of_current_component_produced_Kg,
                        Total_electricity_utilised_for_production_all_current_components_kWh,
                        Production_electricity_energy_use_per_unit_kWh,
                        Production_Heating_energy_use_per_unit_kWh,
                        Production_Cooling_energy_use_per_unit_kWh,
                        Production_Steam_energy_use_per_unit_kWh,
                        FetchElectricityTypeEmiassionValue,
                        FetchHeatingTypeEmiassionValue,
                        FetchCoolingTypeEmiassionValue,
                        FetchSteamTypeEmiassionValue
                    ]);

                    // ===> Insert Ends here

                    // Third Phase END


                    // Fourth Phase Start

                    let packaginType = "";
                    let packaginSize = "";
                    let packaginWeight = 0;
                    let Emission_Factor_Box_kg_CO2E_kg = 0;
                    let Packaging_Carbon_Emissions_kg_CO2e_or_box = 0;

                    const fetchQ61PcakingTypeProduct = `
                        SELECT bom_id,
                        material_number,packagin_type,unit
                        FROM type_of_pack_mat_used_for_delivering_questions
                        WHERE bom_id = $1;
                     `;

                    const fetchQ61PcakingTypeProductResult = await client.query(fetchQ61PcakingTypeProduct, [BomData.id]);

                    if (Q15Result.bom_id === fetchQ61PcakingTypeProductResult.rows[0].bom_id) {
                        packaginType = fetchQ61PcakingTypeProductResult.rows[0].packagin_type
                    }

                    const fetchQ61PcakingWeight = `
                        SELECT bom_id,
                        material_number,packagin_weight,unit
                        FROM weight_of_packaging_per_unit_product_questions
                        WHERE bom_id = $1;
                     `;

                    const fetchQ61PcakingWeightResult = await client.query(fetchQ61PcakingWeight, [BomData.id]);


                    if (Q15Result.bom_id === fetchQ61PcakingWeightResult.rows[0].bom_id) {
                        packaginWeight = fetchQ61PcakingWeightResult.rows[0].packagin_weight;
                    }

                    const fetchPAckaginEmissionFactor = `
                                SELECT material_type,ef_eu_region,ef_india_region,
                                ef_global_region,year,unit,iso_country_code
                                FROM packaging_material_treatment_type_emission_factor
                                WHERE material_type = $1 AND year=$2 AND unit=$3;
                             `;


                    const fetchPackagingEmisResult = await client.query(fetchPAckaginEmissionFactor, [packaginType, fetchSGIQIDSupResult.rows[0].annual_reporting_period, fetchQ61PcakingWeightResult.rows[0].unit]);

                    if (fetchPackagingEmisResult.rows[0]) {

                        if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "india") {
                            Emission_Factor_Box_kg_CO2E_kg += parseFloat(fetchPackagingEmisResult.rows[0].ef_india_region)
                        }

                        if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "europe") {
                            Emission_Factor_Box_kg_CO2E_kg += parseFloat(fetchPackagingEmisResult.rows[0].ef_eu_region)
                        }

                        if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "global") {
                            Emission_Factor_Box_kg_CO2E_kg += parseFloat(fetchPackagingEmisResult.rows[0].ef_global_region)
                        }

                    }

                    Packaging_Carbon_Emissions_kg_CO2e_or_box = (packaginWeight * Emission_Factor_Box_kg_CO2E_kg);
                    console.log("packaginType:", packaginType);
                    console.log("packaginWeight:", packaginWeight);
                    console.log("Emission_Factor_Box_kg_CO2E_kg:", Emission_Factor_Box_kg_CO2E_kg);
                    console.log("Packaging_Carbon_Emissions_kg_CO2e_or_box:", Packaging_Carbon_Emissions_kg_CO2e_or_box);

                    Total_Housing_Component_Emissions += Packaging_Carbon_Emissions_kg_CO2e_or_box;


                    // ====> Insert into bom_emission_packaging_calculation_engine table
                    const queryPacking = `
                        INSERT INTO bom_emission_packaging_calculation_engine 
                        (id,bom_id, pack_weight_kg, emission_factor_box_kg,
                        packaging_type)
                        VALUES ($1,$2, $3, $4, $5)
                        RETURNING *;
                    `;

                    await client.query(queryPacking, [
                        ulid(),
                        BomData.id,
                        packaginWeight,
                        Emission_Factor_Box_kg_CO2E_kg,
                        packaginType
                    ]);

                    // ===> Insert Ends here

                    // Fourth Phase END


                    // Fifth Phase Start


                    const extractNumber = (value: string | number | null | undefined): number => {
                        if (typeof value === 'number') return value;
                        if (!value) return 0;

                        const num = value.match(/[\d.]+/);
                        return num ? parseFloat(num[0]) : 0;
                    };

                    let Total_Transportation_emissions_per_unit_kg_CO2E = 0;

                    const fetchQ74ModeOFTransportControl = `
                                SELECT bom_id,material_number,mode_of_transport,
                                weight_transported,distance
                                FROM mode_of_transport_used_for_transportation_questions
                                WHERE bom_id = $1;
                             `;


                    const fetchQ74ModeOFTransportControlResult = await client.query(fetchQ74ModeOFTransportControl, [BomData.id]);


                    const packaginWeightNum =
                        typeof packaginWeight === 'string'
                            ? parseFloat(packaginWeight)
                            : packaginWeight || 0;
                    const bomWeightKg = (parseFloat(BomData.weight_gms) || 0) / 1000;

                    console.log("packaginWeightNum:", packaginWeightNum, "packaginWeight:", bomWeightKg);

                    const mass_transported_Kg = packaginWeightNum + bomWeightKg;

                    console.log("mass_transported_Kg:", mass_transported_Kg);

                    for (let fetchQ74TransportData of fetchQ74ModeOFTransportControlResult.rows) {



                        let modeOfTransport = fetchQ74TransportData.mode_of_transport;
                        let weightTransportedRaw = fetchQ74TransportData.weight_transported;
                        let distance = extractNumber(fetchQ74TransportData.distance);

                        console.log("modeOfTransport:", modeOfTransport);
                        console.log("weightTransportedRaw:", weightTransportedRaw);
                        console.log("distance:", distance);

                        let Mass_transported_ton;

                        // if (weightTransportedRaw) {

                        //     let weightTransported = extractNumber(weightTransportedRaw);

                        //     Mass_transported_ton = weightTransported;
                        // } else {
                        Mass_transported_ton = mass_transported_Kg / 1000;
                        // }

                        console.log("Mass_transported_ton:", Mass_transported_ton);

                        let Distance_Km = distance;
                        console.log("Distance_Km:", Distance_Km);

                        let transport_Mode_Emission_Factor_Value_kg_CO2e_t_km = 0;


                        const fetchVehicleTypeEmissionFactor = `
                                SELECT vehicle_type,ef_eu_region,ef_india_region,
                                ef_global_region,year,unit,iso_country_code
                                FROM vehicle_type_emission_factor
                                WHERE vehicle_type = $1 AND year=$2 AND unit=$3;
                             `;


                        const fetchVehicleTypeEmisResult = await client.query(fetchVehicleTypeEmissionFactor, [modeOfTransport, fetchSGIQIDSupResult.rows[0].annual_reporting_period, 'Kms']);

                        if (fetchVehicleTypeEmisResult.rows[0]) {

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "india") {
                                transport_Mode_Emission_Factor_Value_kg_CO2e_t_km += parseFloat(fetchVehicleTypeEmisResult.rows[0].ef_india_region)
                            }

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "europe") {
                                transport_Mode_Emission_Factor_Value_kg_CO2e_t_km += parseFloat(fetchVehicleTypeEmisResult.rows[0].ef_eu_region)
                            }

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "global") {
                                transport_Mode_Emission_Factor_Value_kg_CO2e_t_km += parseFloat(fetchVehicleTypeEmisResult.rows[0].ef_global_region)
                            }

                        }

                        console.log("transport_Mode_Emission_Factor_Value_kg_CO2e_t_km:", transport_Mode_Emission_Factor_Value_kg_CO2e_t_km);

                        let Leg_wise_transport_emissions_per_unit_kg_CO2E = 0;

                        Leg_wise_transport_emissions_per_unit_kg_CO2E += (Mass_transported_ton * Distance_Km * transport_Mode_Emission_Factor_Value_kg_CO2e_t_km)

                        console.log("Leg_wise_transport_emissions_per_unit_kg_CO2E:", Leg_wise_transport_emissions_per_unit_kg_CO2E);

                        Total_Transportation_emissions_per_unit_kg_CO2E += Leg_wise_transport_emissions_per_unit_kg_CO2E;


                        // ====> Insert into bom_emission_logistic_calculation_engine table
                        const query = `
                            INSERT INTO bom_emission_logistic_calculation_engine 
                            (id,bom_id, mode_of_transport, mass_transported_kg,
                            mass_transported_ton,distance_km,transport_mode_emission_factor_value_kg_co2e_t_km,
                            leg_wise_transport_emissions_per_unit_kg_co2e)
                            VALUES ($1,$2, $3, $4, $5, $6, $7, $8)
                            RETURNING *;
                        `;

                        await client.query(query, [
                            ulid(),
                            BomData.id,
                            modeOfTransport,
                            mass_transported_Kg,
                            Mass_transported_ton,
                            Distance_Km,
                            transport_Mode_Emission_Factor_Value_kg_CO2e_t_km,
                            Leg_wise_transport_emissions_per_unit_kg_CO2E
                        ]);

                        // ===> Insert Ends here

                    }

                    console.log("Total_Transportation_emissions_per_unit_kg_CO2E:", Total_Transportation_emissions_per_unit_kg_CO2E);

                    Total_Housing_Component_Emissions += Total_Transportation_emissions_per_unit_kg_CO2E;

                    // Fifth Phase END

                    // Sixth Phase Start 

                    //=======> Emission Factor Box waste treatment (kg CO₂e/kg) 

                    let emission_factor_box_waste_treatment_kg_CO2e_kg = 0;
                    let emission_factor_packaging_waste_treatment_kg_COe2_kWh = 0;

                    const fetchQ40WasteQualityControl = `
                                SELECT bom_id,material_number,waste_type,
                                waste_weight,unit,treatment_type
                                FROM weight_of_quality_control_waste_generated_questions
                                WHERE bom_id = $1;
                             `;


                    const fetchQ40WasteQualityControlResult = await client.query(fetchQ40WasteQualityControl, [BomData.id]);

                    for (let fetchQ40Data of fetchQ40WasteQualityControlResult.rows) {

                        // let emission_factor_box_waste_treatment_kg_CO2e_kg = 0;

                        const fetchWasteTreatmentEmissionFactor = `
                                SELECT
                                    wmttef.waste_type,
                                    wmttef.wtt_id,
                                    wmttef.ef_eu_region,
                                    wmttef.ef_india_region,
                                    wmttef.ef_global_region,
                                    wmttef.year,
                                    wmttef.unit,
                                    wmttef.iso_country_code
                                FROM waste_material_treatment_type_emission_factor AS wmttef
                                JOIN waste_treatment_type AS wtt
                                ON wmttef.wtt_id = wtt.wtt_id
                            WHERE
                             wmttef.waste_type = $1
                             AND wmttef.year = $2
                             AND wmttef.unit = $3
                             AND wtt.name = $4;
                        `;

                        const fetchPackagingEmisResult = await client.query(fetchWasteTreatmentEmissionFactor, [fetchQ40Data.waste_type, fetchSGIQIDSupResult.rows[0].annual_reporting_period, fetchQ40Data.unit, fetchQ40Data.treatment_type]);

                        if (fetchPackagingEmisResult.rows[0]) {

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "india") {
                                emission_factor_box_waste_treatment_kg_CO2e_kg += parseFloat(fetchPackagingEmisResult.rows[0].ef_india_region)
                            }

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "europe") {
                                emission_factor_box_waste_treatment_kg_CO2e_kg += parseFloat(fetchPackagingEmisResult.rows[0].ef_eu_region)
                            }

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "global") {
                                emission_factor_box_waste_treatment_kg_CO2e_kg += parseFloat(fetchPackagingEmisResult.rows[0].ef_global_region)
                            }

                        }

                        console.log("emission_factor_box_waste_treatment_kg_CO2e_kg:", emission_factor_box_waste_treatment_kg_CO2e_kg);


                    }
                    //=======> END

                    // ====>Emission Factor Packaging waste treatment (kg CO₂e/kWh) 

                    const fetchQ68PackagingWasteControl = `
                                SELECT bom_id,material_number,waste_type,
                                waste_weight,unit,treatment_type
                                FROM weight_of_pro_packaging_waste_questions
                                WHERE bom_id = $1;
                             `;


                    const fetchQ68PackagingWasteControlResult = await client.query(fetchQ68PackagingWasteControl, [BomData.id]);

                    for (let fetchQ68Data of fetchQ68PackagingWasteControlResult.rows) {

                        // let emission_factor_packaging_waste_treatment_kg_COe2_kWh = 0;

                        const fetchWasteTreatmentEmissionFactor = `
                                SELECT
                                    pmttef.material_type,
                                    pmttef.ptt_id,
                                    pmttef.ef_eu_region,
                                    pmttef.ef_india_region,
                                    pmttef.ef_global_region,
                                    pmttef.year,
                                    pmttef.unit,
                                    pmttef.iso_country_code
                                FROM packaging_material_treatment_type_emission_factor AS pmttef
                                JOIN packaging_treatment_type AS ptt
                                ON pmttef.ptt_id = ptt.ptt_id
                            WHERE
                             pmttef.material_type = $1
                             AND pmttef.year = $2
                             AND pmttef.unit = $3
                             AND ptt.name = $4;
                        `;

                        const fetchPackagingEmisResult = await client.query(fetchWasteTreatmentEmissionFactor, [fetchQ68Data.waste_type, fetchSGIQIDSupResult.rows[0].annual_reporting_period, fetchQ68Data.unit, fetchQ68Data.treatment_type]);

                        console.log(fetchQ68Data.waste_type, fetchSGIQIDSupResult.rows[0].annual_reporting_period, fetchQ68Data.unit, fetchQ68Data.treatment_type);

                        if (fetchPackagingEmisResult.rows[0]) {

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "india") {
                                emission_factor_packaging_waste_treatment_kg_COe2_kWh += parseFloat(fetchPackagingEmisResult.rows[0].ef_india_region)
                            }

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "europe") {
                                emission_factor_packaging_waste_treatment_kg_COe2_kWh += parseFloat(fetchPackagingEmisResult.rows[0].ef_eu_region)
                            }

                            if (fetchQ13LocationSupResult.rows[0].location.toLowerCase() === "global") {
                                emission_factor_packaging_waste_treatment_kg_COe2_kWh += parseFloat(fetchPackagingEmisResult.rows[0].ef_global_region)
                            }

                        }

                        console.log("emission_factor_packaging_waste_treatment_kg_COe2_kWh:", emission_factor_packaging_waste_treatment_kg_COe2_kWh);




                    }


                    let waste_disposal_emissions_kg_CO2e = 0;

                    const weightInKg68 = parseFloat(BomData.weight_gms) / 1000;

                    const weightOfTenPercent = ((weightInKg68 / 100) * 10);

                    console.log("weightInKg68:", weightInKg68, "weightOfTenPercent:", weightOfTenPercent);

                    waste_disposal_emissions_kg_CO2e = ((weightOfTenPercent * emission_factor_box_waste_treatment_kg_CO2e_kg) + (emission_factor_packaging_waste_treatment_kg_COe2_kWh));
                    console.log("waste_disposal_emissions_kg_CO2e:", waste_disposal_emissions_kg_CO2e);
                    // ====> END


                    Total_Housing_Component_Emissions += waste_disposal_emissions_kg_CO2e;

                    console.log(waste_disposal_emissions_kg_CO2e, Raw_Material_emissions, Manufacturing_Emissions_kg_CO2e, Packaging_Carbon_Emissions_kg_CO2e_or_box, Total_Transportation_emissions_per_unit_kg_CO2E);


                    // ====> Insert into bom_emission_waste_calculation_engine table
                    const query = `
                        INSERT INTO bom_emission_waste_calculation_engine 
                        (id,bom_id, waste_generated_per_box_kg, emission_factor_box_waste_treatment_kg_co2e_kg,
                        emission_factor_packaging_waste_treatment_kg_co2e_kWh)
                        VALUES ($1,$2, $3, $4, $5)
                        RETURNING *;
                    `;

                    await client.query(query, [
                        ulid(),
                        BomData.id,
                        weightOfTenPercent,
                        emission_factor_box_waste_treatment_kg_CO2e_kg,
                        emission_factor_packaging_waste_treatment_kg_COe2_kWh
                    ]);

                    // ===> Insert Ends here

                    console.log("Total_Housing_Component_Emissions:", Total_Housing_Component_Emissions);

                    // Sixth Phase END

                    // ====> Insert into bom_emission_calculation_engine table
                    const queryLastPhase = `
                        INSERT INTO bom_emission_calculation_engine 
                        (id,bom_id, material_value, production_value,
                        packaging_value,logistic_value,waste_value,total_pcf_value)
                        VALUES ($1,$2, $3, $4, $5, $6, $7, $8)
                        RETURNING *;
                    `;

                    await client.query(queryLastPhase, [
                        ulid(),
                        BomData.id,
                        Raw_Material_emissions,
                        Manufacturing_Emissions_kg_CO2e,
                        Packaging_Carbon_Emissions_kg_CO2e_or_box,
                        Total_Transportation_emissions_per_unit_kg_CO2E,
                        waste_disposal_emissions_kg_CO2e,
                        Total_Housing_Component_Emissions
                    ]);

                    // ===> Insert Ends here

                    TotalBomDetails.push({
                        bom_id: BomData.id,
                        material_value: Raw_Material_emissions,
                        production_value: Manufacturing_Emissions_kg_CO2e,
                        packaging_value: Packaging_Carbon_Emissions_kg_CO2e_or_box,
                        logistic_value: Total_Transportation_emissions_per_unit_kg_CO2E,
                        waste_value: waste_disposal_emissions_kg_CO2e,
                        total_pcf_value: Total_Housing_Component_Emissions
                    });

                }






            }


            // Update status of bom calculation
            await client.query(
                `UPDATE bom SET is_bom_calculated = true
                 WHERE bom_pcf_id = $1;`,
                [bom_pcf_id]
            );

            return res.send(
                generateResponse(true, "PCF calculation can be initiated", 200, TotalBomDetails)
            );

        } catch (error: any) {
            console.error("❌ Error in PCF calculation:", error);
            return res.send(
                generateResponse(false, error.message || "PCF calculation failed", 500, null)
            );
        }
    });
}
