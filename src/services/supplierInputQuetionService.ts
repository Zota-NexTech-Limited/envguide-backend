
export async function updateSupplierSustainabilityService(client: any, body: any) {
    const {
        supplier_general_info_questions,
        supplier_product_questions,
        scope_one_direct_emissions_questions,
        scope_two_indirect_emissions_questions,
        scope_three_other_indirect_emissions_questions,
        scope_four_avoided_emissions_questions
    } = body;

    await updateSupplierGeneralInfo(client, supplier_general_info_questions);
    await updateAvailabilityScope123(client, supplier_general_info_questions.availability_of_scope_one_two_three_emissions_questions);

    await updateSupplierProduct(client, supplier_product_questions);

    await updateScopeOne(client, scope_one_direct_emissions_questions);
    await updateScopeTwo(client, scope_two_indirect_emissions_questions);
    await updateScopeThree(client, scope_three_other_indirect_emissions_questions);
    await updateScopeFour(client, scope_four_avoided_emissions_questions);
}

async function updateSupplierGeneralInfo(client: any, d: any) {
    await client.query(
        `
    UPDATE supplier_general_info_questions SET
      ere_acknowledge=$1,
      repm_acknowledge=$2,
      dc_acknowledge=$3,
      organization_name=$4,
      core_business_activitiy=$5,
      specify_other_activity=$6,
      designation=$7,
      email_address=$8,
      no_of_employees=$9,
      specify_other_no_of_employees=$10,
      annual_revenue=$11,
      specify_other_annual_revenue=$12,
      annual_reporting_period=$13,
      availability_of_scope_one_two_three_emissions_data=$14,
      sup_id=$15,
      update_date=NOW()
    WHERE sgiq_id=$16
    `,
        [
            d.ere_acknowledge,
            d.repm_acknowledge,
            d.dc_acknowledge,
            d.organization_name,
            d.core_business_activitiy,
            d.specify_other_activity,
            d.designation,
            d.email_address,
            d.no_of_employees,
            d.specify_other_no_of_employees,
            d.annual_revenue,
            d.specify_other_annual_revenue,
            d.annual_reporting_period,
            d.availability_of_scope_one_two_three_emissions_data,
            d.sup_id,
            d.sgiq_id
        ]
    );
}

async function updateAvailabilityScope123(client: any, rows: any[]) {
    for (const r of rows) {
        if (!r.aosotte_id) throw new Error('aosotte_id missing');

        await client.query(
            `
      UPDATE availability_of_scope_one_two_three_emissions_questions SET
        country_iso_three=$1,
        scope_one=$2,
        scope_two=$3,
        scope_three=$4
      WHERE aosotte_id=$5
      `,
            [r.country_iso_three, r.scope_one, r.scope_two, r.scope_three, r.aosotte_id]
        );
    }
}

async function updateSupplierProduct(client: any, d: any) {
    if (!d.spq_id) throw new Error('spq_id missing');

    await client.query(
        `
    UPDATE supplier_product_questions SET
      do_you_have_an_existing_pcf_report=$1,
      pcf_methodology_used=$2,
      upload_pcf_report=$3,
      required_environmental_impact_methods=$4,
      any_co_product_have_economic_value=$5
    WHERE spq_id=$6
    `,
        [
            d.do_you_have_an_existing_pcf_report,
            d.pcf_methodology_used,
            d.upload_pcf_report,
            d.required_environmental_impact_methods,
            d.any_co_product_have_economic_value,
            d.spq_id
        ]
    );

    await updateByArray(client, 'production_site_details_questions', 'psd_id', d.production_site_details_questions,
        ['product_name', 'location']);

    await updateByArray(client, 'product_component_manufactured_questions', 'pcm_id', d.product_component_manufactured_questions,
        ['product_name', 'production_period', 'weight_per_unit', 'unit', 'price', 'quantity']);

    await updateByArray(client, 'co_product_component_economic_value_questions', 'cpcev_id', d.co_product_component_economic_value_questions,
        ['product_name', 'co_product_name', 'weight', 'price_per_product', 'quantity']);
}

async function updateScopeOne(client: any, d: any) {
    if (!d.sode_id) throw new Error('sode_id missing');

    await client.query(
        `
    UPDATE scope_one_direct_emissions_questions SET
      refrigerant_top_ups_performed=$1,
      industrial_process_emissions_present=$2
    WHERE sode_id=$3
    `,
        [
            d.refrigerant_top_ups_performed,
            d.industrial_process_emissions_present,
            d.sode_id
        ]
    );

    await updateByArray(client, 'stationary_combustion_on_site_energy_use_questions', 'scoseu_id',
        d.stationary_combustion_on_site_energy_use_questions, ['fuel_type']);

    for (const sc of d.stationary_combustion_on_site_energy_use_questions) {
        await updateByArray(client, 'scoseu_sub_fuel_type_questions', 'ssft_id',
            sc.scoseu_sub_fuel_type_questions,
            ['sub_fuel_type', 'consumption_quantity', 'unit']);
    }

    await updateByArray(client, 'mobile_combustion_company_owned_vehicles_questions', 'mccov_id',
        d.mobile_combustion_company_owned_vehicles_questions,
        ['fuel_type', 'quantity', 'unit']);

    await updateByArray(client, 'refrigerants_questions', 'refr_id',
        d.refrigerants_questions,
        ['refrigerant_type', 'quantity', 'unit']);

    await updateByArray(client, 'process_emissions_sources_questions', 'pes_id',
        d.process_emissions_sources_questions,
        ['source', 'gas_type', 'quantity', 'unit']);
}

async function updateScopeTwo(client: any, d: any) {
    if (!d.stide_id) throw new Error('stide_id missing');

    await client.query(
        `UPDATE scope_two_indirect_emissions_questions SET 
            do_you_acquired_standardized_re_certificates = $1,
            methodology_to_allocate_factory_energy_to_product_level= $2, 
            methodology_details_document_url= $3,
            energy_intensity_of_production_estimated_kwhor_mj= $4, 
            process_specific_energy_usage= $5,
            do_you_use_any_abatement_systems= $6, 
            water_consumption_and_treatment_details= $7,
            do_you_perform_destructive_testing= $8, 
            it_system_use_for_production_control= $9,
            total_energy_consumption_of_it_hardware_production= $10, 
            energy_con_included_total_energy_pur_sec_two_qfortythree= $11,
            do_you_use_cloud_based_system_for_production= $12,
             do_you_use_any_cooling_sysytem_for_server= $13,
            energy_con_included_total_energy_pur_sec_two_qfifty= $14
            WHERE stide_id = $15`,
        [
            d.do_you_acquired_standardized_re_certificates ?? false,
            d.methodology_to_allocate_factory_energy_to_product_level ?? false,
            d.methodology_details_document_url,
            d.energy_intensity_of_production_estimated_kwhor_mj ?? false,
            d.process_specific_energy_usage ?? false,
            d.do_you_use_any_abatement_systems ?? false,
            d.water_consumption_and_treatment_details,
            d.do_you_perform_destructive_testing ?? false,
            d.it_system_use_for_production_control,
            d.total_energy_consumption_of_it_hardware_production ?? false,
            d.energy_con_included_total_energy_pur_sec_two_qfortythree ?? false,
            d.do_you_use_cloud_based_system_for_production ?? false,
            d.do_you_use_any_cooling_sysytem_for_server ?? false,
            d.energy_con_included_total_energy_pur_sec_two_qfifty ?? false,
            d.stide_id
        ]
    );

    await updateByArray(
        client,
        'scope_two_indirect_emissions_from_purchased_energy_questions',
        'stidefpe_id',
        d.scope_two_indirect_emissions_from_purchased_energy_questions,
        ['energy_source', 'energy_type', 'quantity', 'unit']
    );

    await updateByArray(
        client,
        'scope_two_indirect_emissions_certificates_questions',
        'stidec_id',
        d.scope_two_indirect_emissions_certificates_questions,
        [
            'certificate_name',
            'mechanism',
            'serial_id',
            'generator_id',
            'generator_name',
            'generator_location',
            'date_of_generation',
            'issuance_date'
        ]
    );

    await updateByArray(
        client,
        'energy_intensity_of_production_estimated_kwhor_mj_questions',
        'eiopekm_id',
        d.energy_intensity_of_production_estimated_kwhor_mj_questions,
        ['product_name', 'energy_intensity', 'unit']
    );

    await updateByArray(
        client,
        'process_specific_energy_usage_questions',
        'pseu_id',
        d.process_specific_energy_usage_questions,
        ['process_specific_energy_type', 'quantity_consumed', 'unit', 'support_from_enviguide', 'energy_type']
    );

    await updateByArray(
        client,
        'abatement_systems_used_questions',
        'asu_id',
        d.abatement_systems_used_questions,
        ['source', 'quantity', 'unit']
    );

    await updateByArray(
        client,
        'type_of_quality_control_equipment_usage_questions',
        'toqceu_id',
        d.type_of_quality_control_equipment_usage_questions,
        ['equipment_name', 'quantity', 'unit', 'avg_operating_hours_per_month']
    );

    await updateByArray(
        client,
        'electricity_consumed_for_quality_control_questions',
        'ecfqc_id',
        d.electricity_consumed_for_quality_control_questions,
        ['energy_type', 'quantity', 'unit', 'period']
    );

    await updateByArray(
        client,
        'quality_control_process_usage_questions',
        'qcpu_id',
        d.quality_control_process_usage_questions,
        ['process_name', 'quantity', 'unit', 'period']
    );

    await updateByArray(
        client,
        'quality_control_process_usage_pressure_or_flow_questions',
        'qcpupf_id',
        d.quality_control_process_usage_pressure_or_flow_questions,
        ['flow_name', 'quantity', 'unit', 'period']
    );

    await updateByArray(
        client,
        'quality_control_use_any_consumables_questions',
        'qcuac_id',
        d.quality_control_use_any_consumables_questions,
        ['consumable_name', 'mass_of_consumables', 'unit', 'period']
    );

    await updateByArray(
        client,
        'weight_of_samples_destroyed_questions',
        'wosd_id',
        d.weight_of_samples_destroyed_questions,
        ['component_name', 'weight', 'unit', 'period']
    );

    await updateByArray(
        client,
        'defect_or_rejection_rate_identified_by_quality_control_questions',
        'dorriqc_id',
        d.defect_or_rejection_rate_identified_by_quality_control_questions,
        ['component_name', 'percentage']
    );

    await updateByArray(
        client,
        'rework_rate_due_to_quality_control_questions',
        'rrdqc_id',
        d.rework_rate_due_to_quality_control_questions,
        ['component_name', 'processes_involved', 'percentage']
    );

    await updateByArray(
        client,
        'weight_of_quality_control_waste_generated_questions',
        'woqcwg_id',
        d.weight_of_quality_control_waste_generated_questions,
        ['waste_type', 'waste_weight', 'unit', 'treatment_type']
    );

    await updateByArray(
        client,
        'energy_consumption_for_qfortyfour_questions',
        'ecfqff_id',
        d.energy_consumption_for_qfortyfour_questions,
        ['energy_purchased', 'energy_type', 'quantity', 'unit']
    );

    await updateByArray(
        client,
        'cloud_provider_details_questions',
        'cpd_id',
        d.cloud_provider_details_questions,
        ['cloud_provider_name', 'virtual_machines', 'data_storage', 'data_transfer']
    );

    await updateByArray(
        client,
        'dedicated_monitoring_sensor_usage_questions',
        'dmsu_id',
        d.dedicated_monitoring_sensor_usage_questions,
        ['type_of_sensor', 'sensor_quantity', 'energy_consumption', 'unit']
    );

    await updateByArray(
        client,
        'annual_replacement_rate_of_sensor_questions',
        'arros_id',
        d.annual_replacement_rate_of_sensor_questions,
        ['consumable_name', 'quantity', 'unit']
    );

    await updateByArray(
        client,
        'energy_consumption_for_qfiftyone_questions',
        'ecfqfo_id',
        d.energy_consumption_for_qfiftyone_questions,
        ['energy_purchased', 'energy_type', 'quantity', 'unit']
    );
}

async function updateScopeThree(client: any, d: any) {
    if (!d.stoie_id) throw new Error('stoie_id missing');

    await client.query(
        `UPDATE scope_three_other_indirect_emissions_questions SET
            raw_materials_contact_enviguide_support =$1,
            grade_of_metal_used=$2, 
            msds_link_or_upload_document=$3,
            use_of_recycled_secondary_materials=$4,
             percentage_of_pre_post_consumer_material_used_in_product=$5,
            do_you_use_recycle_mat_for_packaging=$6, 
            percentage_of_recycled_content_used_in_packaging=$7,
            do_you_use_electricity_for_packaging=$8,
             energy_con_included_total_energy_pur_sec_two_qsixtysix=$9,
            internal_or_external_waste_material_per_recycling=$10,
             any_by_product_generated=$11,
            do_you_track_emission_from_transport=$12,
             mode_of_transport_used_for_transportation=$13,
            mode_of_transport_enviguide_support=$14, 
            iso_14001_or_iso_50001_certified=$15,
            standards_followed_iso_14067_GHG_catena_etc=$16,
             do_you_report_to_cdp_sbti_or_other=$17,
            measures_to_reduce_carbon_emissions_in_production=$18, 
            renewable_energy_initiatives_or_recycling_programs=$19,
            your_company_info=$20
            WHERE stoie_id =$21
        `,
        [

            d.raw_materials_contact_enviguide_support ?? false,
            d.grade_of_metal_used,
            d.msds_link_or_upload_document,
            d.use_of_recycled_secondary_materials ?? false,
            d.percentage_of_pre_post_consumer_material_used_in_product ?? false,
            d.do_you_use_recycle_mat_for_packaging ?? false,
            d.percentage_of_recycled_content_used_in_packaging,
            d.do_you_use_electricity_for_packaging ?? false,
            d.energy_con_included_total_energy_pur_sec_two_qsixtysix ?? false,
            d.internal_or_external_waste_material_per_recycling,
            d.any_by_product_generated ?? false,
            d.do_you_track_emission_from_transport ?? false,
            d.mode_of_transport_used_for_transportation ?? false,
            d.mode_of_transport_enviguide_support ?? false,
            d.iso_14001_or_iso_50001_certified ?? false,
            d.standards_followed_iso_14067_GHG_catena_etc ?? false,
            d.do_you_report_to_cdp_sbti_or_other ?? false,
            d.measures_to_reduce_carbon_emissions_in_production,
            d.renewable_energy_initiatives_or_recycling_programs,
            d.your_company_info,
            d.stoie_id
        ]
    );

    await updateByArray(
        client,
        'raw_materials_used_in_component_manufacturing_questions',
        'rmuicm_id',
        d.raw_materials_used_in_component_manufacturing_questions,
        ['material_name', 'percentage']
    );

    await updateByArray(
        client,
        'recycled_materials_with_percentage_questions',
        'rmwp_id',
        d.recycled_materials_with_percentage_questions,
        ['material_name', 'percentage']
    );

    await updateByArray(
        client,
        'pre_post_consumer_reutilization_percentage_questions',
        'ppcrp_id',
        d.pre_post_consumer_reutilization_percentage_questions,
        ['material_type', 'percentage']
    );

    await updateByArray(
        client,
        'pir_pcr_material_percentage_questions',
        'ppmp_id',
        d.pir_pcr_material_percentage_questions,
        ['material_type', 'percentage']
    );

    await updateByArray(
        client,
        'type_of_pack_mat_used_for_delivering_questions',
        'topmudp_id',
        d.type_of_pack_mat_used_for_delivering_questions,
        ['component_name', 'packagin_type', 'packaging_size', 'unit']
    );

    await updateByArray(
        client,
        'weight_of_packaging_per_unit_product_questions',
        'woppup_id',
        d.weight_of_packaging_per_unit_product_questions,
        ['component_name', 'packagin_weight', 'unit']
    );

    await updateByArray(
        client,
        'energy_consumption_for_qsixtyseven_questions',
        'ecfqss_id',
        d.energy_consumption_for_qsixtyseven_questions,
        ['energy_purchased', 'energy_type', 'quantity', 'unit']
    );

    await updateByArray(
        client,
        'weight_of_pro_packaging_waste_questions',
        'woppw_id',
        d.weight_of_pro_packaging_waste_questions,
        ['waste_type', 'waste_weight', 'unit', 'treatment_type']
    );

    await updateByArray(
        client,
        'type_of_by_product_questions',
        'topbp_id',
        d.type_of_by_product_questions,
        ['component_name', 'by_product', 'price_per_product', 'quantity']
    );

    await updateByArray(
        client,
        'co_two_emission_of_raw_material_questions',
        'coteorm_id',
        d.co_two_emission_of_raw_material_questions,
        ['raw_material_name', 'transport_mode', 'source_location', 'destination_location', 'co_two_emission']
    );

    await updateByArray(
        client,
        'mode_of_transport_used_for_transportation_questions',
        'motuft_id',
        d.mode_of_transport_used_for_transportation_questions,
        ['mode_of_transport', 'weight_transported', 'source_point', 'drop_point', 'distance']
    );

    await updateByArray(
        client,
        'destination_plant_component_transportation_questions',
        'dpct_id',
        d.destination_plant_component_transportation_questions,
        ['country', 'state', 'city', 'pincode']
    );
}

async function updateScopeFour(client: any, d: any) {
    if (!d.sfae_id) throw new Error('sfae_id missing');

    await client.query(
        `
        UPDATE scope_four_avoided_emissions_questions SET
            products_or_services_that_help_reduce_customer_emissions = $1,
            circular_economy_practices_reuse_take_back_epr_refurbishment = $2,
            renewable_energy_carbon_offset_projects_implemented = $3,
            update_date = NOW()
        WHERE sfae_id = $4
        `,
        [
            d.products_or_services_that_help_reduce_customer_emissions,
            d.circular_economy_practices_reuse_take_back_epr_refurbishment,
            d.renewable_energy_carbon_offset_projects_implemented,
            d.sfae_id
        ]
    );
}

async function updateByArray(
    client: any,
    table: string,
    pk: string,
    rows: any[],
    fields: string[]
) {
    if (!Array.isArray(rows)) return;

    for (const r of rows) {
        if (!r[pk]) throw new Error(`${pk} missing for ${table}`);

        const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');
        const values = fields.map(f => r[f]);

        await client.query(
            `UPDATE ${table} SET ${setClause} WHERE ${pk}=$${fields.length + 1}`,
            [...values, r[pk]]
        );
    }
}
