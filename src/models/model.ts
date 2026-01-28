// import client from "../util/database";

import { withClient } from '../util/database';

export async function createTables() {
    const createTableQueries = [
        `CREATE TABLE IF NOT EXISTS users_table
        (
            user_id
            VARCHAR
         (
            255
         ) PRIMARY KEY,
            user_name VARCHAR
         (
             255
         ),
            user_role_id VARCHAR
         (
             255
         ),
            user_role VARCHAR
         (
             255
         ),
            user_email VARCHAR
         (
             255
         ),
            user_password VARCHAR
         (
             255
         ),
            user_phone_number VARCHAR
         (
             255
         ),
            user_department VARCHAR
         (
             255
         ),
            change_password_next_login BOOLEAN DEFAULT false,
            password_never_expires BOOLEAN DEFAULT false,
            password_expiry_date DATE,
            pos_id VARCHAR
         (
             255
         ),
            FOREIGN KEY( user_role_id ) REFERENCES roles_table ( role_id ),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )`,

        `CREATE TABLE IF NOT EXISTS users_permission_table
        (
            permission_id
            VARCHAR
         (
            255
         ) PRIMARY KEY,
            module_name VARCHAR
         (
             255
         ),
            module_id VARCHAR
         (
             255
         ),
            user_id VARCHAR
         (
             255
         ),
            "create" BOOLEAN DEFAULT false,
            "update" BOOLEAN DEFAULT false,
            "delete" BOOLEAN DEFAULT false,
            "print" BOOLEAN DEFAULT false,
            "export" BOOLEAN DEFAULT false,
            "send" BOOLEAN DEFAULT false,
            "read" BOOLEAN DEFAULT true,
            "all" BOOLEAN DEFAULT false,
            FOREIGN KEY
         (
             user_id
         ) REFERENCES users_table
         (
             user_id
         ),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )`,

        ` CREATE TABLE IF NOT EXISTS roles_table
        ( 
        role_id VARCHAR  ( 255 ) PRIMARY KEY,
            role_name VARCHAR ( 255) UNIQUE,
            description VARCHAR ( 255),
            role_code VARCHAR (255),
            created_by VARCHAR (255),
            updated_by VARCHAR (255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )`,

        ` CREATE TABLE IF NOT EXISTS department_table
        (
            department_id VARCHAR  ( 255) PRIMARY KEY,
            department_name VARCHAR  (  255 ) UNIQUE,
            description VARCHAR( 255 ),
            department_code VARCHAR (255),
            created_by VARCHAR (255),
            updated_by VARCHAR (255),
            roles_id TEXT[],
            is_mapping BOOLEAN DEFAULT false,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )`,

        ` CREATE TABLE IF NOT EXISTS module_table
        (
            module_id
            VARCHAR
          (
            255
          ) PRIMARY KEY,
            module_name VARCHAR
          (
              255
          ) UNIQUE,
            description VARCHAR
          (
              255
          ),
            main_module_id VARCHAR
          (
              255
          ),
            FOREIGN KEY
          (
              main_module_id
          ) REFERENCES main_module_table
          (
              main_module_id
          ),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )`,

        ` CREATE TABLE IF NOT EXISTS main_module_table
        (
            main_module_id
            VARCHAR
          (
            255
          ) PRIMARY KEY,
            main_module_name VARCHAR
          (
              255
          ) UNIQUE,
            description VARCHAR
          (
              255
          ),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )`,

        `CREATE TABLE IF NOT EXISTS document_type_table (
            document_id VARCHAR(50) ,
            document_type_name VARCHAR(50) ,  
            update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by VARCHAR(255),
            created_by VARCHAR(255)
          )`,

        `CREATE TABLE IF NOT EXISTS whatsapp_config (
      id VARCHAR(255) PRIMARY KEY,
      api_key VARCHAR(255),
      api_url VARCHAR(255),
      user_name VARCHAR(255),
      password VARCHAR(255),
      number VARCHAR(255),
      update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS sms_config (
      id VARCHAR(255) PRIMARY KEY,
      api_key VARCHAR(255),
      api_url VARCHAR(255),
      user_name VARCHAR(255),
      password VARCHAR(255),
      update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS email_config (
            id VARCHAR(255) PRIMARY KEY,
            smtp_host VARCHAR(255),       
            smtp_port VARCHAR(255),
            smtp_user VARCHAR(255),
            smtp_password VARCHAR(255),
            smtp_secure VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS user_mfa_secret (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255),       
            user_email VARCHAR(255),
            mfa_secret VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS own_emission (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255), 
            product_id VARCHAR(255),
            bom_pcf_id VARCHAR(255),
            is_quetions_filled BOOLEAN DEFAULT FALSE,  
            supporting_document_ids VARCHAR(255)[], 
            own_emission_status VARCHAR(255),  
            additional_notes TEXT,
            client_id VARCHAR(255),
            is_own_emission_calculated BOOLEAN DEFAULT FALSE,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS own_emission_supporting_document (
            id VARCHAR(255) PRIMARY KEY,
            own_emission_id VARCHAR(255),      
            document text,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS own_emission_supporting_team (
            id VARCHAR(255) PRIMARY KEY,
            own_emission_id VARCHAR(255),
            full_name VARCHAR(255),      
            phone_number VARCHAR(255), 
            email_address VARCHAR(255), 
            message text,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS document_master (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255),
            document_type VARCHAR(255),      
            category VARCHAR(255), 
            product_code VARCHAR(255), 
            version VARCHAR(255), 
            document_title VARCHAR(255), 
            description text,
            tags VARCHAR(255)[], 
            access_level VARCHAR(255), 
            document text[],
            status VARCHAR(255) DEFAULT 'Pending', 
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            file_size VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS product (
            id VARCHAR(255) PRIMARY KEY,
            product_code VARCHAR(255),
            product_name VARCHAR(255),  
            product_category_id VARCHAR(255), 
            product_sub_category_id VARCHAR(255), 
            description text,
            ts_weight_kg DOUBLE PRECISION,
            ts_dimensions VARCHAR(255),
            ts_material TEXT,
            ts_manufacturing_process_id VARCHAR(255), 
            ts_supplier VARCHAR(255),
            ts_part_number VARCHAR(255),
            ed_estimated_pcf DOUBLE PRECISION,
            ed_recyclability DOUBLE PRECISION,
            ed_life_cycle_stage_id VARCHAR(255), 
            ed_renewable_energy DOUBLE PRECISION,
            pcf_status VARCHAR(255) DEFAULT 'Not Available',
            product_status VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_pcf_request (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) DEFAULT ('PCF' || LPAD(nextval('pcf_code_seq')::text, 5, '0')) UNIQUE,  
            request_title VARCHAR(255),
            priority VARCHAR(255),
            request_organization VARCHAR(255),
            due_date TIMESTAMPTZ,
            request_description TEXT,
            product_category_id VARCHAR(255),
            component_category_id VARCHAR(255),
            component_type_id VARCHAR(255),
            product_code VARCHAR(255),
            manufacturer_id VARCHAR(255),
            model_version VARCHAR(255),
            is_approved BOOLEAN DEFAULT false,
            is_rejected BOOLEAN DEFAULT false,
            is_draft BOOLEAN DEFAULT false,
            is_task_created BOOLEAN DEFAULT false,
            technical_specification_file TEXT[],
            status VARCHAR(255) DEFAULT 'Inprogress',
            product_images TEXT[],
            created_by VARCHAR(255),
            rejected_by VARCHAR(255),
            reject_reason TEXT,
            updated_by VARCHAR(255),
            overall_pcf DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_pcf_request_product_specification (
            id VARCHAR(255) PRIMARY KEY,    
            bom_pcf_id VARCHAR(255),
            specification_name VARCHAR(255),
            specification_value VARCHAR(255),
            specification_unit VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) DEFAULT ('BOM' || LPAD(nextval('bom_code_seq')::text, 5, '0')) UNIQUE,
            bom_pcf_id VARCHAR(255),
            material_number VARCHAR(255),      
            component_name VARCHAR(255), 
            qunatity INTEGER, 
            production_location VARCHAR(255), 
            manufacturer VARCHAR(255),
            detail_description TEXT,
            weight_gms DOUBLE PRECISION, 
            total_weight_gms DOUBLE PRECISION, 
            component_category VARCHAR(255),
            price DOUBLE PRECISION, 
            total_price DOUBLE PRECISION,
            economic_ratio DOUBLE PRECISION,
            is_bom_calculated BOOLEAN DEFAULT false,
            supplier_id VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            is_weight_gms BOOLEAN DEFAULT false,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_material_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),
            material_type VARCHAR(255),
            material_composition DOUBLE PRECISION,
            material_composition_weight DOUBLE PRECISION,
            material_emission_factor DOUBLE PRECISION,
            material_emission DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_production_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255), 
            component_weight_kg DOUBLE PRECISION,
            allocation_methodology VARCHAR(255),
            total_electrical_energy_consumed_at_factory_level_kWh DOUBLE PRECISION,
            total_heating_energy_consumed_at_factory_level_kWh DOUBLE PRECISION,
            total_cooling_energy_consumed_at_factory_level_kWh DOUBLE PRECISION,
            total_steam_energy_consumed_at_factory_level_kWh DOUBLE PRECISION,
            total_energy_consumed_at_factory_level_kWh DOUBLE PRECISION,
            total_weight_produced_at_factory_level_kg DOUBLE PRECISION,
            no_of_products_current_component_produced DOUBLE PRECISION,
            total_weight_of_current_component_produced_kg DOUBLE PRECISION,
            total_electricity_utilised_for_production_all_current_components_kWh DOUBLE PRECISION,
            production_electricity_energy_use_per_unit_kWh DOUBLE PRECISION,
            production_heat_energy_use_per_unit_kWh DOUBLE PRECISION,
            production_cooling_energy_use_per_unit_kWh DOUBLE PRECISION,
            production_steam_energy_use_per_unit_kWh DOUBLE PRECISION,
            emission_factor_of_electricity DOUBLE PRECISION,
            emission_factor_of_heat DOUBLE PRECISION,
            emission_factor_of_cooling DOUBLE PRECISION,
            emission_factor_of_steam DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_packaging_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),      
            pack_weight_kg DOUBLE PRECISION,
            emission_factor_box_kg  DOUBLE PRECISION,
            pack_size_l_w_h_m VARCHAR(255),
            packaging_type VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_logistic_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),   
            mode_of_transport VARCHAR(255), 
            mass_transported_kg DOUBLE PRECISION,
            mass_transported_ton DOUBLE PRECISION,
            distance_km DOUBLE PRECISION,
            transport_mode_emission_factor_value_kg_co2e_t_km DOUBLE PRECISION,
            leg_wise_transport_emissions_per_unit_kg_co2e DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_waste_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),      
            waste_generated_per_box_kg DOUBLE PRECISION,
            emission_factor_box_waste_treatment_kg_co2e_kg DOUBLE PRECISION,
            emission_factor_packaging_waste_treatment_kg_co2e_kWh DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),      
            material_value DOUBLE PRECISION,
            production_value DOUBLE PRECISION,
            packaging_value DOUBLE PRECISION,
            logistic_value DOUBLE PRECISION,
            waste_value DOUBLE PRECISION,
            total_pcf_value DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS allocation_methodology (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255) UNIQUE,   
            split_allocation BOOLEAN DEFAULT false,   
            sys_expansion_allocation BOOLEAN DEFAULT false,
            check_er_less_than_five VARCHAR(255),
            phy_mass_allocation_er_less_than_five VARCHAR(255),
            econ_allocation_er_greater_than_five VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS task_managment (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) DEFAULT ('TASK' || LPAD(nextval('task_code_seq')::text, 5, '0')) UNIQUE,      
            task_title VARCHAR(255),
            category_id VARCHAR(255),
            bom_pcf_id VARCHAR(255),
            priority VARCHAR(255),
            assign_to VARCHAR(255)[],
            due_date TIMESTAMPTZ,
            description TEXT,
            product VARCHAR(255),
            estimated_hour INTEGER,
            tags VARCHAR(255)[],
            attachments TEXT,
            progress VARCHAR(255),
            status VARCHAR(255) DEFAULT 'Created',
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS pcf_bom_comments (
            id VARCHAR(255) PRIMARY KEY,
            bom_pcf_id VARCHAR(255),  
            user_id VARCHAR(255),
            comment TEXT,  
            commented_at TIMESTAMPTZ,   
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        //===========> PCF Request Stages Tables start<============

        `CREATE TABLE IF NOT EXISTS pcf_request_stages (
            id VARCHAR(255) PRIMARY KEY,
            bom_pcf_id VARCHAR(255),
            is_pcf_request_created BOOLEAN DEFAULT FALSE,
            is_pcf_request_submitted BOOLEAN DEFAULT FALSE,
            is_bom_verified BOOLEAN DEFAULT FALSE,
            is_data_collected BOOLEAN DEFAULT FALSE,
            is_dqr_completed BOOLEAN DEFAULT FALSE,
            is_pcf_calculated BOOLEAN DEFAULT FALSE,
            is_result_validation_verified BOOLEAN DEFAULT FALSE,
            is_result_submitted BOOLEAN DEFAULT FALSE,
            pcf_request_created_by VARCHAR(255),
            pcf_request_submitted_by VARCHAR(255),
            bom_verified_by VARCHAR(255),
            dqr_completed_by VARCHAR(255),
            pcf_calculated_by VARCHAR(255) DEFAULT 'system',
            result_validation_verified_by VARCHAR(255),
            result_submitted_by VARCHAR(255),
            pcf_request_created_date TIMESTAMPTZ,
            pcf_request_submitted_date TIMESTAMPTZ,
            bom_verified_date TIMESTAMPTZ,
            dqr_completed_date TIMESTAMPTZ,
            pcf_calculated_date TIMESTAMPTZ,
            result_validation_verified_date TIMESTAMPTZ,
            result_submitted_date TIMESTAMPTZ,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        //   this below table for more than supplier input quetions is right so data collection stage
        `CREATE TABLE IF NOT EXISTS pcf_request_data_collection_stage (
            id VARCHAR(255) PRIMARY KEY,
            bom_pcf_id VARCHAR(255),
            bom_id VARCHAR(255),
            sup_id VARCHAR(255),
            client_id VARCHAR(255),
            is_submitted BOOLEAN DEFAULT FALSE,
            completed_date TIMESTAMPTZ,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS pcf_request_data_rating_stage (
            id VARCHAR(255) PRIMARY KEY,
            bom_pcf_id VARCHAR(255),
            bom_id VARCHAR(255),
            sup_id VARCHAR(255),
            client_id VARCHAR(255),
            submitted_by VARCHAR(255),
            is_submitted BOOLEAN DEFAULT FALSE,
            completed_date TIMESTAMPTZ,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        //========>PCF Request Stages Tables end<============

        //   =======>Supplier Organization Questionnaire Tables<==========

        `CREATE TABLE IF NOT EXISTS supplier_details (
            sup_id VARCHAR(255) PRIMARY KEY,   
            code VARCHAR(255) DEFAULT ('SUP' || LPAD(nextval('supplier_code_seq')::text, 5, '0')) UNIQUE,  
            supplier_name VARCHAR(255),
            supplier_email VARCHAR(255) UNIQUE NOT NULL,
            supplier_phone_number VARCHAR(255),
            supplier_alternate_phone_number VARCHAR(255),
            supplier_gender VARCHAR(50),
            supplier_date_of_birth DATE,
            supplier_image TEXT,
            supplier_company_logo TEXT,
            supplier_company_website VARCHAR(255),
            supplier_company_name VARCHAR(255),
            supplier_business_type VARCHAR(255),
            supplier_supplied_categories TEXT[],
            supplier_years_in_business VARCHAR(255),
            supplier_city VARCHAR(255),
            supplier_state VARCHAR(255),
            supplier_country VARCHAR(255),
            supplier_registered_address TEXT,
            supplier_gst_number VARCHAR(255),
            supplier_pan_number VARCHAR(255),
            supplier_bank_account_number VARCHAR(255),
            supplier_ifsc_code VARCHAR(255),
            supplier_bank_name VARCHAR(255),
            supplier_bank_branch VARCHAR(255),
            supplier_key_automotive_clients TEXT[],
            supplier_business_registration_certificate TEXT[],
            supplier_tax_registration_proof TEXT[],
            supplier_product_catalogue TEXT[],
            supplier_additional_supporting_documents TEXT[],
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        //   Gneral Info Questions
        `CREATE TABLE IF NOT EXISTS supplier_general_info_questions (
            sgiq_id VARCHAR(255) PRIMARY KEY,
            bom_pcf_id VARCHAR(255), 
            ere_acknowledge BOOLEAN DEFAULT false,
            repm_acknowledge BOOLEAN DEFAULT false,
            dc_acknowledge BOOLEAN DEFAULT false,
            organization_name VARCHAR(255),   
            core_business_activitiy VARCHAR(255),
            specify_other_activity VARCHAR(255),
            designation VARCHAR(255),
            email_address VARCHAR(255),
            no_of_employees VARCHAR(255), 
            specify_other_no_of_employees VARCHAR(255), 
            annual_revenue VARCHAR(255),
            specify_other_annual_revenue VARCHAR(255),
            annual_reporting_period VARCHAR(255),
            availability_of_scope_one_two_three_emissions_data BOOLEAN DEFAULT false,
            sup_id VARCHAR(255),
            client_id VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS availability_of_scope_one_two_three_emissions_questions (
            aosotte_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),   
            country_iso_three VARCHAR(255),
            scope_one NUMERIC(5,2),
            scope_two NUMERIC(5,2),
            scope_three NUMERIC(5,2),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sgiq_id) REFERENCES supplier_general_info_questions (sgiq_id)
  );`,

        //   Product Questions
        `CREATE TABLE IF NOT EXISTS supplier_product_questions (
            spq_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            do_you_have_an_existing_pcf_report BOOLEAN DEFAULT false,
            pcf_methodology_used TEXT[], -- ['ISO 14067', 'GHG Protocol', 'Catena-X PCF Guideline', etc.]
            upload_pcf_report TEXT, -- document link or file reference
            required_environmental_impact_methods TEXT[], -- ['Life Cycle Assessment (LCA)', 'Carbon Footprint', 'Water Footprint', etc.]
            any_co_product_have_economic_value BOOLEAN DEFAULT false,
            sup_id VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sgiq_id) REFERENCES supplier_general_info_questions (sgiq_id)
  );`,

        `CREATE TABLE IF NOT EXISTS production_site_details_questions (
            psd_id VARCHAR(255) PRIMARY KEY,
            spq_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),   
            product_name VARCHAR(255),
            location TEXT,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(spq_id) REFERENCES supplier_product_questions (spq_id)
  );`,

        `CREATE TABLE IF NOT EXISTS product_component_manufactured_questions (
            pcm_id VARCHAR(255) PRIMARY KEY,
            spq_id VARCHAR(255),   
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            product_name VARCHAR(255),
            production_period VARCHAR(255),
            weight_per_unit NUMERIC(10,2),
            unit VARCHAR(50),
            price NUMERIC(10,2),
            quantity INTEGER,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(spq_id) REFERENCES supplier_product_questions (spq_id)
  );`,

        `CREATE TABLE IF NOT EXISTS co_product_component_economic_value_questions (
            cpcev_id VARCHAR(255) PRIMARY KEY,
            spq_id VARCHAR(255), 
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            product_name VARCHAR(255),  
            co_product_name VARCHAR(255),
            weight NUMERIC(10,2),
            price_per_product NUMERIC(10,2),
            quantity INTEGER,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(spq_id) REFERENCES supplier_product_questions (spq_id)
  );`,

        //   Scope One Direct Emissions Questions
        `CREATE TABLE IF NOT EXISTS scope_one_direct_emissions_questions (
            sode_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            refrigerant_top_ups_performed BOOLEAN DEFAULT false,
            industrial_process_emissions_present BOOLEAN DEFAULT false,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sgiq_id) REFERENCES supplier_general_info_questions (sgiq_id)
  );`,

        `CREATE TABLE IF NOT EXISTS stationary_combustion_on_site_energy_use_questions (
            scoseu_id VARCHAR(255) PRIMARY KEY,
            sode_id VARCHAR(255),
            fuel_type VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sode_id) REFERENCES scope_one_direct_emissions_questions (sode_id)
  );`,

        `CREATE TABLE IF NOT EXISTS scoseu_sub_fuel_type_questions (
            ssft_id VARCHAR(255) PRIMARY KEY,
            scoseu_id VARCHAR(255),
            sub_fuel_type VARCHAR(255),
            consumption_quantity NUMERIC(10,2),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(scoseu_id) REFERENCES stationary_combustion_on_site_energy_use_questions (scoseu_id)
  );`,

        `CREATE TABLE IF NOT EXISTS mobile_combustion_company_owned_vehicles_questions (
            mccov_id VARCHAR(255) PRIMARY KEY,
            sode_id VARCHAR(255),
            fuel_type VARCHAR(255),
            quantity INTEGER,
            unit VARCHAR(50), 
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sode_id) REFERENCES scope_one_direct_emissions_questions (sode_id)
  );`,

        `CREATE TABLE IF NOT EXISTS refrigerants_questions (
            refr_id VARCHAR(255) PRIMARY KEY,
            sode_id VARCHAR(255),
            refrigerant_type VARCHAR(255),
            quantity INTEGER,
            unit VARCHAR(50), 
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sode_id) REFERENCES scope_one_direct_emissions_questions (sode_id)
  );`,

        `CREATE TABLE IF NOT EXISTS process_emissions_sources_questions (
            pes_id VARCHAR(255) PRIMARY KEY,
            sode_id VARCHAR(255),
            source VARCHAR(255),
            gas_type VARCHAR(255),
            quantity INTEGER,
            unit VARCHAR(50), 
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sode_id) REFERENCES scope_one_direct_emissions_questions (sode_id)
  );`,


        //Scope Two Indirect Emissions from Purchased Energy Questions

        `CREATE TABLE IF NOT EXISTS scope_two_indirect_emissions_questions (
            stide_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            do_you_acquired_standardized_re_certificates BOOLEAN DEFAULT false,
            methodology_to_allocate_factory_energy_to_product_level BOOLEAN DEFAULT false,
            methodology_details_document_url TEXT[], -- array of document links or file references
            energy_intensity_of_production_estimated_kwhor_mj BOOLEAN DEFAULT false,
            process_specific_energy_usage BOOLEAN DEFAULT false,
            do_you_use_any_abatement_systems BOOLEAN DEFAULT false,
            water_consumption_and_treatment_details TEXT,
            do_you_perform_destructive_testing BOOLEAN DEFAULT false,
            it_system_use_for_production_control TEXT[], 
            total_energy_consumption_of_it_hardware_production BOOLEAN DEFAULT false,
            energy_con_included_total_energy_pur_sec_two_qfortythree BOOLEAN DEFAULT false, --Q43
            do_you_use_cloud_based_system_for_production BOOLEAN DEFAULT false,
            do_you_use_any_cooling_sysytem_for_server BOOLEAN DEFAULT false,
            energy_con_included_total_energy_pur_sec_two_qfifty BOOLEAN DEFAULT false, --Q50
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sgiq_id) REFERENCES supplier_general_info_questions (sgiq_id)
  );`,

        `CREATE TABLE IF NOT EXISTS scope_two_indirect_emissions_from_purchased_energy_questions (
            stidefpe_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            energy_source VARCHAR(255),
            energy_type VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            sup_id VARCHAR(255),
            client_id VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,

        `CREATE TABLE IF NOT EXISTS scope_two_indirect_emissions_certificates_questions (
            stidec_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            certificate_name VARCHAR(255),
            mechanism VARCHAR(255),
            serial_id VARCHAR(255),
            generator_id VARCHAR(255),
            generator_name VARCHAR(255),
            generator_location TEXT,
            date_of_generation TIMESTAMPTZ,
            issuance_date TIMESTAMPTZ,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,

        `CREATE TABLE IF NOT EXISTS energy_intensity_of_production_estimated_kwhor_mj_questions (
            eiopekm_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            product_name VARCHAR(255),
            energy_intensity NUMERIC(10,2),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,

        `CREATE TABLE IF NOT EXISTS process_specific_energy_usage_questions (
            pseu_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            process_specific_energy_type VARCHAR(255),
            quantity_consumed NUMERIC(10,2),
            unit VARCHAR(50),
            support_from_enviguide BOOLEAN DEFAULT false,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,

        `CREATE TABLE IF NOT EXISTS abatement_systems_used_questions (
            asu_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            source VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q32
        `CREATE TABLE IF NOT EXISTS type_of_quality_control_equipment_usage_questions (
            toqceu_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            equipment_name VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            avg_operating_hours_per_month VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q33
        `CREATE TABLE IF NOT EXISTS electricity_consumed_for_quality_control_questions (
            ecfqc_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            energy_type VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            period VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q34
        `CREATE TABLE IF NOT EXISTS quality_control_process_usage_questions (
            qcpu_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            process_name VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            period VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q34
        `CREATE TABLE IF NOT EXISTS quality_control_process_usage_pressure_or_flow_questions (
            qcpupf_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            flow_name VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            period VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q35
        `CREATE TABLE IF NOT EXISTS quality_control_use_any_consumables_questions (
            qcuac_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            consumable_name VARCHAR(255),
            mass_of_consumables NUMERIC(10,2),
            unit VARCHAR(50),
            period VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q37
        `CREATE TABLE IF NOT EXISTS weight_of_samples_destroyed_questions (
            wosd_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            weight NUMERIC(10,2),
            unit VARCHAR(50),
            period VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q38
        `CREATE TABLE IF NOT EXISTS defect_or_rejection_rate_identified_by_quality_control_questions (
            dorriqc_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            percentage VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q39
        `CREATE TABLE IF NOT EXISTS rework_rate_due_to_quality_control_questions (
            rrdqc_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            processes_involved VARCHAR(255),
            percentage VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q40
        `CREATE TABLE IF NOT EXISTS weight_of_quality_control_waste_generated_questions (
            woqcwg_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            waste_type VARCHAR(255),
            waste_weight VARCHAR(255),
            unit VARCHAR(50),
            treatment_type VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q44
        `CREATE TABLE IF NOT EXISTS energy_consumption_for_qfortyfour_questions (
            ecfqff_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            energy_purchased VARCHAR(255),
            energy_type VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q46
        `CREATE TABLE IF NOT EXISTS cloud_provider_details_questions (
            cpd_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            cloud_provider_name VARCHAR(255),
            virtual_machines VARCHAR(255),
            data_storage VARCHAR(255),
            data_transfer VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q47
        `CREATE TABLE IF NOT EXISTS dedicated_monitoring_sensor_usage_questions (
            dmsu_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            type_of_sensor VARCHAR(255),
            sensor_quantity VARCHAR(255),
            energy_consumption VARCHAR(255),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q48
        `CREATE TABLE IF NOT EXISTS annual_replacement_rate_of_sensor_questions (
            arros_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            consumable_name VARCHAR(255),
            quantity VARCHAR(255),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,
        // Q51
        `CREATE TABLE IF NOT EXISTS energy_consumption_for_qfiftyone_questions (
            ecfqfo_id VARCHAR(255) PRIMARY KEY,
            stide_id VARCHAR(255),
            energy_purchased VARCHAR(255),
            energy_type VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stide_id) REFERENCES scope_two_indirect_emissions_questions (stide_id)
  );`,

        //Scope Three Other Indirect Emissions

        // Q52
        `CREATE TABLE IF NOT EXISTS scope_three_other_indirect_emissions_questions (
            stoie_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            raw_materials_contact_enviguide_support BOOLEAN DEFAULT false,
            grade_of_metal_used VARCHAR(255),
            msds_link_or_upload_document TEXT[], -- array of document links or file references Q54
            use_of_recycled_secondary_materials BOOLEAN DEFAULT false, -- Q55
            percentage_of_pre_post_consumer_material_used_in_product BOOLEAN DEFAULT false, -- Q57
            do_you_use_recycle_mat_for_packaging BOOLEAN DEFAULT false, -- Q63
            percentage_of_recycled_content_used_in_packaging TEXT, -- Q64
            do_you_use_electricity_for_packaging BOOLEAN DEFAULT false, -- Q65
            energy_con_included_total_energy_pur_sec_two_qsixtysix BOOLEAN DEFAULT false, --Q66
            internal_or_external_waste_material_per_recycling TEXT, --Q69
            any_by_product_generated BOOLEAN DEFAULT false, --Q70
            do_you_track_emission_from_transport BOOLEAN DEFAULT false, -- Q72
            mode_of_transport_used_for_transportation BOOLEAN DEFAULT false, -- Q74
            mode_of_transport_enviguide_support BOOLEAN DEFAULT false, -- Q74
            iso_14001_or_iso_50001_certified BOOLEAN DEFAULT false, --Q76
            standards_followed_iso_14067_GHG_catena_etc BOOLEAN DEFAULT false, --Q77
            do_you_report_to_cdp_sbti_or_other BOOLEAN DEFAULT false, --Q78
            measures_to_reduce_carbon_emissions_in_production TEXT, --Q79
            renewable_energy_initiatives_or_recycling_programs TEXT, --Q80
            your_company_info TEXT, --Q81
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sgiq_id) REFERENCES supplier_general_info_questions (sgiq_id)
  );`,
        // Q52
        `CREATE TABLE IF NOT EXISTS raw_materials_used_in_component_manufacturing_questions (
            rmuicm_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            material_name VARCHAR(255),
            percentage VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,
        // Q56
        `CREATE TABLE IF NOT EXISTS recycled_materials_with_percentage_questions (
            rmwp_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            material_name VARCHAR(255),
            percentage VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,
        // Q58
        `CREATE TABLE IF NOT EXISTS pre_post_consumer_reutilization_percentage_questions (
            ppcrp_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            material_type VARCHAR(255),
            percentage VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q59
        `CREATE TABLE IF NOT EXISTS pir_pcr_material_percentage_questions (
            ppmp_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            material_type VARCHAR(255),
            percentage VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q60
        `CREATE TABLE IF NOT EXISTS type_of_pack_mat_used_for_delivering_questions (
            topmudp_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            packagin_type VARCHAR(255),
            packaging_size VARCHAR(255),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q61
        `CREATE TABLE IF NOT EXISTS weight_of_packaging_per_unit_product_questions (
            woppup_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            packagin_weight VARCHAR(255),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q67
        `CREATE TABLE IF NOT EXISTS energy_consumption_for_qsixtyseven_questions (
            ecfqss_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            energy_purchased VARCHAR(255),
            energy_type VARCHAR(255),
            quantity NUMERIC(10,2),
            unit VARCHAR(50),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q68
        `CREATE TABLE IF NOT EXISTS weight_of_pro_packaging_waste_questions (
            woppw_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            waste_type VARCHAR(255),
            waste_weight VARCHAR(255),
            unit VARCHAR(50),
            treatment_type VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q71
        `CREATE TABLE IF NOT EXISTS type_of_by_product_questions (
            topbp_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            by_product VARCHAR(255),
            price_per_product NUMERIC(10,2),
            quantity INTEGER,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q73
        `CREATE TABLE IF NOT EXISTS co_two_emission_of_raw_material_questions (
            coteorm_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            bom_id VARCHAR(255),  
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            raw_material_name VARCHAR(255),
            transport_mode VARCHAR(255),
            source_location VARCHAR(255),
            source_lat VARCHAR(255),
            source_long VARCHAR(255),
            destination_location VARCHAR(255),
            destination_lat VARCHAR(255),
            destination_long VARCHAR(255),
            co_two_emission VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q74
        `CREATE TABLE IF NOT EXISTS mode_of_transport_used_for_transportation_questions (
            motuft_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            bom_id VARCHAR(255),
            material_number VARCHAR(255),
            component_name VARCHAR(255),
            mode_of_transport VARCHAR(255),
            weight_transported VARCHAR(255),
            source_point VARCHAR(255),
            drop_point VARCHAR(255),
            distance VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        // Q75
        `CREATE TABLE IF NOT EXISTS destination_plant_component_transportation_questions (
            dpct_id VARCHAR(255) PRIMARY KEY,
            stoie_id VARCHAR(255),
            country VARCHAR(255),
            state VARCHAR(255),
            city VARCHAR(255),
            pincode VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stoie_id) REFERENCES scope_three_other_indirect_emissions_questions (stoie_id)
  );`,

        //Scope Four Avoided Emissions

        // Q82
        `CREATE TABLE IF NOT EXISTS scope_four_avoided_emissions_questions (
            sfae_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            products_or_services_that_help_reduce_customer_emissions TEXT, --Q82
            circular_economy_practices_reuse_take_back_epr_refurbishment TEXT, --Q83
            renewable_energy_carbon_offset_projects_implemented TEXT, --Q84
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sgiq_id) REFERENCES supplier_general_info_questions (sgiq_id)
  );`,

        //  ==========>Supplier Organization Questionnaire Tables end<============


        //===========> DQR Rating Tables total 50 tables

        // Q9
        `CREATE TABLE IF NOT EXISTS dqr_emission_data_rating_qnine (
            edrqn_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            aosotte_id VARCHAR(255), -- FK to availability_of_scope_one_two_three_emissions
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q11
        `CREATE TABLE IF NOT EXISTS dqr_supplier_product_questions_rating_qeleven (
            spqrqe_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            spq_id VARCHAR(255), --foreign key to supplier_product_questions
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q12
        `CREATE TABLE IF NOT EXISTS dqr_supplier_product_questions_rating_qtwelve (
            spqrqt_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            spq_id VARCHAR(255), --foreign key to supplier_product_questions
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q13
        `CREATE TABLE IF NOT EXISTS dqr_production_site_detail_rating_qthirteen (
            psdrqt_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            psd_id VARCHAR(255), --foreign key to production_site_details
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q15
        `CREATE TABLE IF NOT EXISTS dqr_product_component_manufactured_rating_qfiften (
            pcmrqf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            pcm_id VARCHAR(255), --foreign key to product_component_manufactured
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        // Q15.1
        `CREATE TABLE IF NOT EXISTS dqr_co_product_component_manufactured_rating_qfiftenone (
            pcmrqfo_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            cpcev_id VARCHAR(255), --foreign key to co_product_component_economic_value_questions
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        // Q16
        `CREATE TABLE IF NOT EXISTS dqr_stationary_combustion_on_site_energy_rating_qsixten (
            scoserqs_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            scoseu_id VARCHAR(255), --foreign key to stationary_combustion_on_site_energy_use
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q17
        `CREATE TABLE IF NOT EXISTS dqr_mobile_combustion_company_owned_vehicles_rating_qseventen (
            mccoqrqs_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            mccov_id VARCHAR(255), --foreign key to mobile_combustion_company_owned_vehicles
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q19
        `CREATE TABLE IF NOT EXISTS dqr_refrigerants_rating_qnineten (
            refrqn_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            refr_id VARCHAR(255), --foreign key to refrigerants
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q21
        `CREATE TABLE IF NOT EXISTS dqr_process_emissions_sources_qtwentyone (
            pesqto_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            pes_id VARCHAR(255), --foreign key to process_emissions_sources
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q22
        `CREATE TABLE IF NOT EXISTS dqr_scope_two_indirect_emis_from_pur_energy_qtwentytwo (
            stidefpeqtt_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stidefpe_id VARCHAR(255), --foreign key to scope_two_indirect_emissions_from_purchased_energy
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q24
        `CREATE TABLE IF NOT EXISTS dqr_scope_two_indirect_emissions_certificates_qtwentyfour (
            stiecqtf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stidec_id VARCHAR(255), --foreign key to scope_two_indirect_emissions_certificates
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q26
        `CREATE TABLE IF NOT EXISTS dqr_scope_two_indirect_emissions_qtwentysix (
            stieqts_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stide_id VARCHAR(255), --foreign key to scope_two_indirect_emissions
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q27
        `CREATE TABLE IF NOT EXISTS dqr_energy_intensity_of_pro_est_kwhor_mj_qtwentyseven (
            eiopekmqts_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            eiopekm_id VARCHAR(255), --foreign key to energy_intensity_of_production_estimated_kwhor_mj
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q28
        `CREATE TABLE IF NOT EXISTS dqr_process_specific_energy_usage_qtwentyeight (
            pseuqte_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            pseu_id VARCHAR(255), --foreign key to process_specific_energy_usage
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q30
        `CREATE TABLE IF NOT EXISTS dqr_abatement_systems_used_qthirty (
            asuqt_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            asu_id VARCHAR(255), --foreign key to abatement_systems_used
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q31
        `CREATE TABLE IF NOT EXISTS dqr_scope_two_indirect_emissions_qthirtyone (
            stideqto_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stide_id VARCHAR(255), --foreign key to scope_two_indirect_emissions
            data TEXT,
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q32
        `CREATE TABLE IF NOT EXISTS dqr_type_of_quality_control_equipment_usage_qthirtytwo (
            toqceuqto_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            toqceu_id VARCHAR(255), --foreign key to type_of_quality_control_equipment_usage
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q33
        `CREATE TABLE IF NOT EXISTS dqr_electricity_consumed_for_quality_control_qthirtythree (
            ecfqcqtt_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            ecfqc_id VARCHAR(255), --foreign key to electricity_consumed_for_quality_control
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q34
        `CREATE TABLE IF NOT EXISTS dqr_quality_control_process_usage_qthirtyfour (
            qcpuqtf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            qcpu_id VARCHAR(255), --foreign key to quality_control_process_usage
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q34
        `CREATE TABLE IF NOT EXISTS dqr_quality_control_process_usage_pressure_or_flow_qthirtyfour (
            qcpupfqtf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            qcpupf_id VARCHAR(255), --foreign key to quality_control_process_usage_pressure_or_flow
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q35
        `CREATE TABLE IF NOT EXISTS dqr_quality_control_use_any_consumables_qthirtyfive (
            qcuacqtf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            qcuac_id VARCHAR(255), --foreign key to quality_control_use_any_consumables
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q37
        `CREATE TABLE IF NOT EXISTS dqr_weight_of_samples_destroyed_qthirtyseven (
            wosdqts_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            wosd_id VARCHAR(255), --foreign key to weight_of_samples_destroyed
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q38
        `CREATE TABLE IF NOT EXISTS dqr_defect_or_rej_rate_identified_by_quality_control_qthirtyeight (
           dorriqcqte_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            dorriqc_id VARCHAR(255), --foreign key to defect_or_rejection_rate_identified_by_quality_control
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q39
        `CREATE TABLE IF NOT EXISTS dqr_rework_rate_due_to_quality_control_qthirtynine (
            rrdqcqtn_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            rrdqc_id VARCHAR(255), --foreign key to rework_rate_due_to_quality_control
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q40
        `CREATE TABLE IF NOT EXISTS dqr_weight_of_quality_control_waste_generated_qforty (
            woqcwgqf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            woqcwg_id VARCHAR(255), --foreign key to weight_of_quality_control_waste_generated
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q41
        `CREATE TABLE IF NOT EXISTS dqr_scope_two_indirect_emissions_qfortyone (
            stideqfo_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stide_id VARCHAR(255), --foreign key to scope_two_indirect_emissions
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q44
        `CREATE TABLE IF NOT EXISTS dqr_energy_consumption_for_qfortyfour_qfortyfour (
            ecfqffqff_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            ecfqff_id VARCHAR(255), --foreign key to energy_consumption_for_qfortyfour
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q46
        `CREATE TABLE IF NOT EXISTS dqr_cloud_provider_details_qfortysix (
            cpdqfs_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            cpd_id VARCHAR(255), --foreign key to cloud_provider_details
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q47
        `CREATE TABLE IF NOT EXISTS dqr_dedicated_monitoring_sensor_usage_qfortyseven (
            dmsuqfs_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            dmsu_id VARCHAR(255), --foreign key to dedicated_monitoring_sensor_usage
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q48
        `CREATE TABLE IF NOT EXISTS dqr_annual_replacement_rate_of_sensor_qfortyeight (
            arrosqfe_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            arros_id VARCHAR(255), --foreign key to annual_replacement_rate_of_sensor
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q51
        `CREATE TABLE IF NOT EXISTS dqr_energy_consumption_for_qfiftyone_qfiftyone (
            ecfqfoqfo_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            ecfqfo_id VARCHAR(255), --foreign key to energy_consumption_for_qfiftyone
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q52
        `CREATE TABLE IF NOT EXISTS dqr_raw_materials_used_in_component_manufacturing_qfiftytwo (
            rmuicmqft_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            rmuicm_id VARCHAR(255), --foreign key to raw_materials_used_in_component_manufacturing
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q53
        `CREATE TABLE IF NOT EXISTS dqr_scope_three_other_indirect_emissions_qfiftythree (
            stoieqft_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stoie_id VARCHAR(255), --foreign key to scope_three_other_indirect_emissions
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q54
        `CREATE TABLE IF NOT EXISTS dqr_scope_three_other_indirect_emissions_qfiftyfour (
            stoieqff_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stoie_id VARCHAR(255), --foreign key to scope_three_other_indirect_emissions
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q56
        `CREATE TABLE IF NOT EXISTS dqr_recycled_materials_with_percentage_qfiftysix (
            rmwpqfs_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            rmwp_id VARCHAR(255), --foreign key to recycled_materials_with_percentage
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q58
        `CREATE TABLE IF NOT EXISTS dqr_pre_post_consumer_reutilization_percentage_qfiftyeight (
            ppcrpqfe_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            ppcrp_id VARCHAR(255), --foreign key to pre_post_consumer_reutilization_percentage
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q59
        `CREATE TABLE IF NOT EXISTS dqr_pir_pcr_material_percentage_qfiftynine (
            ppmpqfn_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            ppmp_id VARCHAR(255), --foreign key to pir_pcr_material_percentage
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q60
        `CREATE TABLE IF NOT EXISTS dqr_type_of_pack_mat_used_for_delivering_qsixty (
            topmudpqs_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            topmudp_id VARCHAR(255), --foreign key to type_of_pack_mat_used_for_delivering
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q61
        `CREATE TABLE IF NOT EXISTS dqr_weight_of_packaging_per_unit_product_qsixtyone (
            woppupqso_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            woppup_id VARCHAR(255), --foreign key to weight_of_packaging_per_unit_product
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q64
        `CREATE TABLE IF NOT EXISTS dqr_scope_three_other_indirect_emissions_qsixtyfour (
            stoieqsf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stoie_id VARCHAR(255), --foreign key to scope_three_other_indirect_emissions
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q67
        `CREATE TABLE IF NOT EXISTS dqr_energy_consumption_for_qsixtyseven_qsixtyseven (
            ecfqssqss_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            ecfqss_id VARCHAR(255), --foreign key to energy_consumption_for_qsixtyseven
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q68
        `CREATE TABLE IF NOT EXISTS dqr_weight_of_pro_packaging_waste_qsixtyeight (
            woppwqse_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            woppw_id VARCHAR(255), --foreign key to weight_of_pro_packaging_waste
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q69
        `CREATE TABLE IF NOT EXISTS dqr_scope_three_other_indirect_emissions_qsixtynine (
            stoieqsn_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stoie_id VARCHAR(255), --foreign key to scope_three_other_indirect_emissions
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q71
        `CREATE TABLE IF NOT EXISTS dqr_type_of_by_product_qseventyone (
            topbpqso_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            topbp_id VARCHAR(255), --foreign key to type_of_by_product
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q73
        `CREATE TABLE IF NOT EXISTS dqr_co_two_emission_of_raw_material_qseventythree (
            coteormqst_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            coteorm_id VARCHAR(255), --foreign key to co_two_emission_of_raw_material
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q74
        `CREATE TABLE IF NOT EXISTS dqr_mode_of_transport_used_for_transportation_qseventyfour (
            motuftqsf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            motuft_id VARCHAR(255), --foreign key to mode_of_transport_used_for_transportation
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q75
        `CREATE TABLE IF NOT EXISTS dqr_destination_plant_component_transportation_qseventyfive (
            dpctqsf_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            dpct_id VARCHAR(255), --foreign key to destination_plant_component_transportation
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q79
        `CREATE TABLE IF NOT EXISTS dqr_scope_three_other_indirect_emissions_qseventynine (
            stoieqsn_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stoie_id VARCHAR(255), --foreign key to scope_three_other_indirect_emissions
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        // Q80
        `CREATE TABLE IF NOT EXISTS dqr_scope_three_other_indirect_emissions_qeighty (
            stoieqe_id VARCHAR(255) PRIMARY KEY,
            sgiq_id VARCHAR(255),
            stoie_id VARCHAR(255), --foreign key to scope_three_other_indirect_emissions
            data TEXT, 
            ter_tag_type VARCHAR(255),
            ter_tag_value VARCHAR(255), 
            ter_data_point VARCHAR(255),   
            tir_tag_type VARCHAR(255),
            tir_tag_value VARCHAR(255), 
            tir_data_point VARCHAR(255), 
            gr_tag_type VARCHAR(255),
            gr_tag_value VARCHAR(255), 
            gr_data_point VARCHAR(255),   
            c_tag_type VARCHAR(255),
            c_tag_value VARCHAR(255), 
            c_data_point VARCHAR(255), 
            pds_tag_type VARCHAR(255),
            pds_tag_value VARCHAR(255), 
            pds_data_point VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        //   ========>DQR Rating Tables end<============

        //   ==========>Data Setup tables<============
        `CREATE TABLE IF NOT EXISTS calculation_method (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_calculation_method_code_name UNIQUE (code, name)
  );`,
        `CREATE TABLE IF NOT EXISTS fuel_combustion (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_fuel_combustion_code_name UNIQUE (code, name)
  );`,
        `CREATE TABLE IF NOT EXISTS process_emission (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_process_emission_code_name UNIQUE (code, name)
  );`,
        `CREATE TABLE IF NOT EXISTS fugitive_emission (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_fugitive_emission_code_name UNIQUE (code, name)
  );`,
        `CREATE TABLE IF NOT EXISTS electicity_location_based (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_electicity_location_based_code_name UNIQUE (code, name)
  );`,
        `CREATE TABLE IF NOT EXISTS electicity_market_based (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_electicity_market_based_code_name UNIQUE (code, name)
  );`,
        `CREATE TABLE IF NOT EXISTS steam_heat_cooling (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_steam_heat_cooling_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS product_type (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_product_type_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS product_category (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_product_category_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS product_sub_category (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_product_sub_category_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS component_type (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_component_type_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS component_category (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_component_category_code UNIQUE (code),
            CONSTRAINT uq_component_category_name UNIQUE (name)
  );`,

        `CREATE TABLE IF NOT EXISTS industry (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_industry_code UNIQUE (code),
            CONSTRAINT uq_industry_name UNIQUE (name)
  );`,

        `CREATE TABLE IF NOT EXISTS category (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_category_code UNIQUE (code),
            CONSTRAINT uq_category_name UNIQUE (name)
  );`,

        `CREATE TABLE IF NOT EXISTS tag (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_tag_code UNIQUE (code),
            CONSTRAINT uq_tag_name UNIQUE (name)
  );`,

        `CREATE TABLE IF NOT EXISTS transport_mode (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_tm_code UNIQUE (code),
            CONSTRAINT uq_tm_name UNIQUE (name)
  );`,

        `CREATE TABLE IF NOT EXISTS material_type (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_mt_code UNIQUE (code),
            CONSTRAINT uq_mt_name UNIQUE (name)
  );`,

        `CREATE TABLE IF NOT EXISTS manufacturer (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            address text,
            lat DOUBLE PRECISION,
            long DOUBLE PRECISION,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_m_code UNIQUE (code),
            CONSTRAINT uq_m_name UNIQUE (name)
  );`,

        `CREATE TABLE IF NOT EXISTS vehicle_detail (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,
            make VARCHAR(255),
            model VARCHAR(255),
            year VARCHAR(255),
            number VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_vd_code UNIQUE (code),
            CONSTRAINT uq_vd_name UNIQUE (name)
  );`,

        `CREATE TABLE IF NOT EXISTS fuel_type (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_ft_code UNIQUE (code),
            CONSTRAINT uq_ft_name UNIQUE (name)
  );`,

        //   from here to 
        `CREATE TABLE IF NOT EXISTS aluminium_type (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_aluminium_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS silicon_type (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_silicon_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS magnesium_type (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_cmagnesium_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS iron_type (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_iron_code_name UNIQUE (code, name)
  );`,
        //   Here these tables needed currently using these below table combining above four

        `CREATE TABLE IF NOT EXISTS material_composition_metal (
            mcm_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_material_composition_metal_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS material_composition_metal_type (
            mcmt_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,   
            mcm_id VARCHAR(255),
            value VARCHAR(255),
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS manufacturing_process (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_mp_code_name UNIQUE (code, name)
  );`,

        `CREATE TABLE IF NOT EXISTS life_cycle_stage (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,       
            description text,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_lc_code_name UNIQUE (code, name)
  );`,

        //   ==========>Data Setup tables end<============


        // ===========> Master Data Setup tables start<============
        `CREATE TABLE IF NOT EXISTS material_composition_metals (
            mcm_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS country_iso_two (
            citw_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS country_iso_three (
            cith_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS scope_two_method (
            stm_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS method_type (
            mt_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS transport_modes (
            tm_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS transport_routes (
            tr_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS packaging_level (
            pl_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS waste_treatment (
            wt_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS refrigerent_type (
            rt_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
        `CREATE TABLE IF NOT EXISTS liquid_fuel_unit (
            lfu_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS gaseous_fuel_unit (
            gfu_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS solid_fuel_unit (
            sfu_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS process_specific_energy (
            pse_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS fuel_types (
            ft_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,


        `CREATE TABLE IF NOT EXISTS sub_fuel_types (
            sft_id VARCHAR(255) PRIMARY KEY,
            ft_id VARCHAR(255),
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS vehicle_types (
            vt_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS energy_source (
            es_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS energy_type (
            et_id VARCHAR(255) PRIMARY KEY,
            es_id VARCHAR(255),
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS energy_unit (
            eu_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS ef_unit (
            efu_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS allocation_method (
            am_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS certificate_type (
            ct_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS verification_status (
            vs_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS reporting_standard (
            rs_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS life_cycle_boundary (
            lcb_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS life_cycle_stages_of_product (
            lcsp_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS time_zone (
            tmz_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS product_unit (
            pu_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS supplier_tier (
            st_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS credit_method (
            cm_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS water_source (
            ws_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS water_unit (
            wu_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS water_treatment (
            wt_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS discharge_destination (
            dd_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        // ===========> Master Data Setup tables end<============

        // ==============> ECOinvent Emission Factor DataSetup <================

        `CREATE TABLE IF NOT EXISTS materials_emission_factor (
    mef_id VARCHAR(255) PRIMARY KEY,
    element_name VARCHAR(255), 
    ef_eu_region VARCHAR(255),  
    ef_india_region VARCHAR(255),
    ef_global_region VARCHAR(255),
    year VARCHAR(255),
    unit VARCHAR(255),
    iso_country_code VARCHAR(255),
    code VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`,

        `CREATE TABLE IF NOT EXISTS waste_treatment_type (
            wtt_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255), 
            name VARCHAR(255),  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS waste_material_treatment_type_emission_factor (
    wmttef_id VARCHAR(255) PRIMARY KEY,
    waste_type VARCHAR(255),
    wtt_id VARCHAR(255),  
    ef_eu_region VARCHAR(255),  
    ef_india_region VARCHAR(255),
    ef_global_region VARCHAR(255),
    year VARCHAR(255),
    unit VARCHAR(255),
    iso_country_code VARCHAR(255),
    code VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`,

        `CREATE TABLE IF NOT EXISTS electricity_emission_factor (
    eef_id VARCHAR(255) PRIMARY KEY,
    type_of_energy VARCHAR(255), 
    ef_eu_region VARCHAR(255),  
    ef_india_region VARCHAR(255),
    ef_global_region VARCHAR(255),
    year VARCHAR(255),
    unit VARCHAR(255),
    iso_country_code VARCHAR(255),
    code VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`,

        `CREATE TABLE IF NOT EXISTS fuel_emission_factor (
    fef_id VARCHAR(255) PRIMARY KEY,
    fuel_type VARCHAR(255), 
    ef_eu_region VARCHAR(255),  
    ef_india_region VARCHAR(255),
    ef_global_region VARCHAR(255),
    year VARCHAR(255),
    unit VARCHAR(255),
    iso_country_code VARCHAR(255),
    code VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`,

        `CREATE TABLE IF NOT EXISTS packaging_treatment_type (
            ptt_id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255), 
            name VARCHAR(255),  
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS packaging_material_treatment_type_emission_factor (
    pef_id VARCHAR(255) PRIMARY KEY,
    material_type VARCHAR(255),
    ptt_id VARCHAR(255), 
    ef_eu_region VARCHAR(255),  
    ef_india_region VARCHAR(255),
    ef_global_region VARCHAR(255),
    year VARCHAR(255),
    unit VARCHAR(255),
    iso_country_code VARCHAR(255),
    code VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`,

        `CREATE TABLE IF NOT EXISTS vehicle_type_emission_factor (
    wtef_id VARCHAR(255) PRIMARY KEY,
    vehicle_type VARCHAR(255) NOT NULL, 
    ef_eu_region VARCHAR(255) NOT NULL,  
    ef_india_region VARCHAR(255) NOT NULL,
    ef_global_region VARCHAR(255) NOT NULL,
    year VARCHAR(255) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    iso_country_code VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`,
        // <=======================END<================
    ]

    // try {

    //     var queryGlobal
    //     for (const query of createTableQueries) {
    //         queryGlobal = query
    //         const tables = await client.query(query);
    //     }

    //     console.log("Tables created successfully");

    // } catch (error) {
    //     console.log("Executing query:", queryGlobal);
    //     console.error("Error creating tables:", error);
    // }
    return withClient(async (client: any) => {
        try {

            var query1
            for (const query of createTableQueries) {
                query1 = query
                //   console.log("Executing query:", query);
                const tables = await client.query(query);
                //   console.log(tables.rows,query)
            }

            console.log("Tables created successfully");

        } catch (error) {
            console.log("Executing query:", query1);
            console.error("Error creating tables:", error);
        }
    })
}