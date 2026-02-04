export const bomService = {
    insertPCFBOMRequest: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_pcf_request (
                id, request_title, priority, request_organization,
                due_date, request_description, product_category_id, component_category_id,
                component_type_id, product_code,manufacturer_id,model_version,created_by,
                 technical_specification_file,product_images,is_draft,code,status
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'PCF' || LPAD(nextval('pcf_code_seq')::text, 5, '0')
            )
        `;
        const values = [
            data.id, data.request_title, data.priority, data.request_organization,
            data.due_date, data.request_description, data.product_category_id, data.component_category_id,
            data.component_type_id, data.product_code, data.manufacturer_id, data.model_version, data.created_by,
            data.technical_specification_file, data.product_images, data.is_draft, 'Open'
        ];
        await client.query(query, values);
    },

    insertPCFBOMRequestProductSpec: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_pcf_request_product_specification (
                id, bom_pcf_id, specification_name, specification_value, specification_unit
            ) VALUES (
                $1,$2,$3,$4,$5
            )
        `;
        const values = [
            data.id, data.bom_pcf_id, data.specification_name, data.specification_value, data.specification_unit
        ];
        return await client.query(query, values);
    },

    insertBOM: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom (
                id, material_number, component_name, qunatity,
                production_location, manufacturer, detail_description,
                weight_gms, total_weight_gms, component_category,
                price, total_price, created_by ,bom_pcf_id,supplier_id ,code
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'BOM' || LPAD(nextval('bom_code_seq')::text, 5, '0')
            )
        `;
        const values = [
            data.id, data.material_number, data.component_name, data.qunatity,
            data.production_location, data.manufacturer, data.detail_description,
            data.weight_gms, data.total_weight_gms, data.component_category,
            data.price, data.total_price, data.created_by, data.bom_pcf_id, data.supplier_id
        ];
        await client.query(query, values);
    },

    insertSupplierCoProduct: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_supplier_co_product_value_calculation (
                id, bom_id, supplier_id, co_product_id,
                manufacturer_id, economic_or_co_product_value
            ) VALUES ($1,$2,$3,$4,$5,$6)
        `;
        const values = [
            data.id, data.bom_id, data.supplier_id, data.co_product_id,
            data.manufacturer_id || null, data.economic_or_co_product_value
        ];
        await client.query(query, values);
    },

    insertMaterialCalValue: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_emission_material_calculation_engine (
                id, bom_id, material_composition_weight, material_emission_factor ,material_emission ,
                aluminium_id, silicon_id, magnesium_id, iron_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `;
        const values = [
            data.id, data.bom_id, data.material_composition_weight, data.material_emission_factor, data.material_emission,
            data.aluminium_id, data.silicon_id, data.magnesium_id, data.iron_id
        ];
        await client.query(query, values);
    },

    insertProductionCalValue: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_emission_production_calculation_engine (
                id, bom_id, electricity_energy_consumed_factory_level_kwh,total_weight_produced_factory_level_kg,no_products_current_component_produced,
            total_weight_current_component_produced_kg,total_eu_for_production_all_current_component_kwh,production_ee_use_per_unit,
            emission_factor_of_electricity,manufacturing_emission
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `;
        const values = [
            data.id, data.bom_id, data.electricity_energy_consumed_factory_level_kwh, data.total_weight_produced_factory_level_kg,
            data.no_products_current_component_produced, data.total_weight_current_component_produced_kg, data.total_eu_for_production_all_current_component_kwh,
            data.production_ee_use_per_unit, data.emission_factor_of_electricity, data.manufacturing_emission
        ];
        await client.query(query, values);
    },

    insertPackaginCalValue: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_emission_packaging_calculation_engine (
                id, bom_id, packaging,pack_size_l_w_h_m,material_box_weight_kg,
            emission_factor_box_kg,packaging_carbon_emission
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)
        `;
        const values = [
            data.id, data.bom_id, data.packaging, data.pack_size_l_w_h_m,
            data.material_box_weight_kg, data.emission_factor_box_kg, data.packaging_carbon_emission
        ];
        await client.query(query, values);
    },

    insertWasteCalValue: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_emission_waste_calculation_engine (
                id, bom_id, waste_generated_per_box_kg,emission_factor_box_waste_treatment_kg,packaging_waste_treatment_energy_kg,
            emission_factor_box_packaging_treatment_kg,waste_disposal_emission
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)
        `;
        const values = [
            data.id, data.bom_id, data.waste_generated_per_box_kg, data.emission_factor_box_waste_treatment_kg,
            data.packaging_waste_treatment_energy_kg, data.emission_factor_box_packaging_treatment_kg, data.waste_disposal_emission
        ];
        await client.query(query, values);
    },

    insertLogsticsCalValue: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_emission_logistic_calculation_engine (
                id, bom_id,transport_mode_id, vehicle_id, manufacturer_id, user_id,
                destination_site, mass_transported_kg, mass_transported_ton,
                distance_km, transport_mode_emission_factor_value_kg, leg_wise_transport_emissions_per_unit_kg
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
            )
        `;
        const values = [
            data.id, data.bom_id, data.transport_mode_id, data.vehicle_id, data.manufacturer_id, data.user_id,
            data.destination_site, data.mass_transported_kg, data.mass_transported_ton,
            data.distance_km, data.transport_mode_emission_factor_value_kg, data.leg_wise_transport_emissions_per_unit_kg
        ];
        await client.query(query, values);
    },

    insertEmissionFinalPCFCalValue: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_emission_calculation_engine (
                id, bom_id, material_value,production_value,packaging_value,
            waste_value,logistic_value,pcf_value
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `;
        const values = [
            data.id, data.bom_id, data.material_value, data.production_value,
            data.packaging_value, data.waste_value, data.logistic_value, data.pcf_value
        ];
        await client.query(query, values);
    },

    insertTransportValue: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_emission_tansport_value_calculation (
                id, bom_id, transport_mode_id, vehicle_id,
                manufacturer_id, user_id, distance, emission_value
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `;
        const values = [
            data.id, data.bom_id, data.transport_mode_id, data.vehicle_id,
            data.manufacturer_id, data.user_id, data.distance, data.emission_value
        ];
        await client.query(query, values);
    },

    insertMaterialComposition: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_material_composition_emission_value (
                id, bom_id, type_of_material, material_composition,
                material_composition_weight, ef_kg_co_two, total
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)
        `;
        const values = [
            data.id, data.bom_id, data.type_of_material, data.material_composition,
            data.material_composition_weight, data.ef_kg_co_two, data.total
        ];
        await client.query(query, values);
    },

    insertMaterialValue: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom_emission_material_value_calculation (
                id, bom_id, material_value, production_value,
                packaging_value, waste_value, logistic_value, pcf_value
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `;
        const values = [
            data.id, data.bom_id, data.material_value, data.production_value,
            data.packaging_value, data.waste_value, data.logistic_value, data.pcf_value
        ];
        await client.query(query, values);
    },

    // insertAllocationMethod: async (client: any, data: any) => {
    //     const query = `
    //         INSERT INTO allocation_methodology (
    //             id, bom_id, split_allocation, sys_expansion_allocation,
    //             check_er_less_than_five, phy_mass_allocation_er_less_than_five,
    //             econ_allocation_er_greater_than_five
    //         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    //     `;
    //     const values = [
    //         data.id, data.bom_id, data.split_allocation, data.sys_expansion_allocation,
    //         data.check_er_less_than_five, data.phy_mass_allocation_er_less_than_five,
    //         data.econ_allocation_er_greater_than_five
    //     ];
    //     await client.query(query, values);
    // },

    // -> Update BOM and related details ->

    insertPCFBOMRequestStages: async (client: any, data: any, clientId: any) => {
        const client_id = clientId
        const query = `
            INSERT INTO pcf_request_stages (
                id, bom_pcf_id, is_pcf_request_created, is_pcf_request_submitted,
                pcf_request_created_by, pcf_request_submitted_by, pcf_request_created_date,
                pcf_request_submitted_date,client_id
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9
            )
        `;
        const values = [
            data.id, data.bom_pcf_id, data.is_pcf_request_created, data.is_pcf_request_submitted,
            data.pcf_request_created_by, data.pcf_request_submitted_by, data.pcf_request_created_date, data.pcf_request_submitted_date,
            client_id
        ];
        await client.query(query, values);
    },

};
