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


            // Insert into bom_pcf_request
            const bomPcfId = ulid();
            const bomPcfCode = `BOMPCF-${Date.now()}`;


            const bomPcfData = {
                id: bomPcfId,
                code: bomPcfCode,
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
            const created_by = req.user_id;

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

            await client.query("COMMIT");

            return res.status(201).send(
                generateResponse(true, "BOM and related data created successfully", 201, {
                    bom_id: bomId,
                    code: bomCode
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

export async function getBOMWithDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { bom_id } = req.query;
            if (!bom_id) {
                return res.status(400).json({ success: false, message: "Missing bom_id" });
            }

            const bomData = await bomService.getFullBOMDetails(client, bom_id);

            if (!bomData) {
                return res.status(404).json({ success: false, message: "BOM not found" });
            }

            return res.status(200).send(
                generateResponse(true, "BOM fetched successfully", 200, bomData)
            );
        } catch (error: any) {
            console.error("Error fetching BOM details:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch BOM details"
            });
        }
    })
}