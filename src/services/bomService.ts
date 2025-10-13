export const bomService = {
    insertBOM: async (client: any, data: any) => {
        const query = `
            INSERT INTO bom (
                id, code, material_number, component_name, qunatity,
                production_location, manufacturer_id, detail_description,
                weight_gms, total_weight_gms, component_category_id,
                price, total_price, economic_ratio, created_by
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
            )
        `;
        const values = [
            data.id, data.code, data.material_number, data.component_name, data.qunatity,
            data.production_location, data.manufacturer_id, data.detail_description,
            data.weight_gms, data.total_weight_gms, data.component_category_id,
            data.price, data.total_price, data.economic_ratio,
            data.created_by
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

    getFullBOMDetails: async (client: any, bom_id: string) => {
        //  Fetch main BOM with manufacturer + component_category
        const bomQuery = `
            SELECT 
                b.*,
                m.name AS manufacturer_name,
                m.address AS manufacturer_address,
                m.lat AS manufacturer_lat,
                m.long AS manufacturer_long,
                cc.name AS component_category_name,
                cc.code AS component_category_code,
                u1.user_name AS created_by_name,
                u2.user_name AS updated_by_name
            FROM bom b
            LEFT JOIN manufacturer m ON b.manufacturer_id = m.id
            LEFT JOIN component_category cc ON b.component_category_id = cc.id
            LEFT JOIN users_table u1 ON b.created_by = u1.user_id
            LEFT JOIN users_table u2 ON b.updated_by = u2.user_id
            WHERE b.id = $1
        `;
        const bomResult = await client.query(bomQuery, [bom_id]);
        if (bomResult.rows.length === 0) return null;
        const bom = bomResult.rows[0];

        // Fetch Transport Values with related data
        const transportQuery = `
            SELECT 
                t.*, 
                tm.name AS transport_mode_name,
                tm.code AS transport_mode_code,
                v.name AS vehicle_name,
                v.code AS vehicle_code,
                v.make AS vehicle_make,
                v.model AS vehicle_model,
                v.year AS vehicle_year,
                v.number AS vehicle_number,
                u.user_name,
                u.user_email
            FROM bom_emission_tansport_value_calculation t
            LEFT JOIN transport_mode tm ON t.transport_mode_id = tm.id
            LEFT JOIN vehicle_detail v ON t.vehicle_id = v.id
            LEFT JOIN users_table u ON t.user_id = u.user_id
            WHERE t.bom_id = $1
        `;
        const transportResult = await client.query(transportQuery, [bom_id]);

        //  Fetch Material Composition
        const materialCompositionQuery = `
            SELECT * 
            FROM bom_material_composition_emission_value 
            WHERE bom_id = $1
        `;
        const materialCompositionResult = await client.query(materialCompositionQuery, [bom_id]);

        // Fetch Material Value Calculation
        const materialValueQuery = `
            SELECT * 
            FROM bom_emission_material_value_calculation 
            WHERE bom_id = $1
        `;
        const materialValueResult = await client.query(materialValueQuery, [bom_id]);

        // Fetch Supplier/Co-Product Information
        const supplierQuery = `
            SELECT bs.*,
            pt.name AS product_type_name,
            pt.code AS product_type_code
            FROM bom_supplier_co_product_information bs
            LEFT JOIN product_type pt ON bs.co_product_id = pt.id
            WHERE bom_id = $1
        `;
        const supplierResult = await client.query(supplierQuery, [bom_id]);

        // Fetch Allocation Methodology
        const allocationQuery = `
            SELECT * 
            FROM allocation_methodology 
            WHERE bom_id = $1
        `;
        const allocationResult = await client.query(allocationQuery, [bom_id]);

        // Final structured result
        return {
            bom_id: bom.id,
            code: bom.code,
            material_number: bom.material_number,
            component_name: bom.component_name,
            quantity: bom.qunatity,
            production_location: bom.production_location,
            manufacturer: {
                id: bom.manufacturer_id,
                name: bom.manufacturer_name,
                address: bom.manufacturer_address,
                latitude: bom.manufacturer_lat,
                longitude: bom.manufacturer_long
            },
            component_category: {
                id: bom.component_category_id,
                name: bom.component_category_name,
                code: bom.component_category_code
            },
            detail_description: bom.detail_description,
            weight_gms: bom.weight_gms,
            total_weight_gms: bom.total_weight_gms,
            price: bom.price,
            total_price: bom.total_price,
            economic_rate: bom.economic_rate,
            created_by: bom.created_by,
            updated_by: bom.updated_by,
            created_by_name: bom.created_by_name,
            updated_by_name: bom.updated_by_name,
            created_date: bom.created_date,
            update_date: bom.update_date,

            // 🔹 Child data arrays
            bom_emission_tansport_value_calculation: transportResult.rows,
            bom_material_composition_emission_value: materialCompositionResult.rows,
            bom_emission_material_value_calculation: materialValueResult.rows,
            bom_supplier_co_product_information: supplierResult.rows,
            allocation_methodology: allocationResult.rows
        };
    }


};
