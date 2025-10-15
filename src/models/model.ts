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
            reporting_period_from DATE,
            reporting_period_to DATE,
            calculation_method_id VARCHAR(255), 
            fuel_combustion_id VARCHAR(255), 
            fuel_combustion_value VARCHAR(255),
            process_emission_id VARCHAR(255),
            process_emission_value VARCHAR(255),
            fugitive_emission_id VARCHAR(255),
            fugitive_emission_value VARCHAR(255),
            electicity_location_based_id VARCHAR(255), 
            electicity_location_based_value VARCHAR(255),
            electicity_market_based_id VARCHAR(255),
            electicity_market_based_value VARCHAR(255),
            steam_heat_cooling_id VARCHAR(255),
            steam_heat_cooling_value VARCHAR(255),
            additional_notes TEXT,    
            supporting_document_ids VARCHAR(255)[],   
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

        //   need to update these below tables after updating screen

        `CREATE TABLE IF NOT EXISTS bom_pcf_request (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255),    
            product_category_id VARCHAR(255),
            component_category_id VARCHAR(255),
            component_type_id VARCHAR(255),
            product_code VARCHAR(255),
            manufacturer_id VARCHAR(255),
            model_version VARCHAR(255),
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
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
            code VARCHAR(255),
            bom_pcf_id VARCHAR(255),
            material_number VARCHAR(255),      
            component_name VARCHAR(255), 
            qunatity DOUBLE PRECISION, 
            production_location TEXT, 
            manufacturer_id VARCHAR(255), 
            detail_description text,
            weight_gms DOUBLE PRECISION, 
            total_weight_gms DOUBLE PRECISION, 
            component_category_id VARCHAR(255),
            price DOUBLE PRECISION, 
            total_price DOUBLE PRECISION,
            economic_ratio DOUBLE PRECISION,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            is_weight_gms BOOLEAN DEFAULT false,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_supplier_co_product_value_calculation (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),      
            supplier_id VARCHAR(255),
            co_product_id VARCHAR(255),
            manufacturer_id VARCHAR(255),
            economic_or_co_product_value DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_material_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),
            aluminium_id VARCHAR(255),    
            silicon_id VARCHAR(255),
            magnesium_id VARCHAR(255),
            iron_id VARCHAR(255),
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
            production_ee_use_per_unit DOUBLE PRECISION,
            emission_factor_of_electricity DOUBLE PRECISION,
            manufacturing_emission DOUBLE PRECISION,
            no_products_current_component_produced DOUBLE PRECISION,
            total_eu_for_production_all_current_component_kwh DOUBLE PRECISION,
            electricity_energy_consumed_factory_level_kwh DOUBLE PRECISION,
            total_weight_produced_factory_level_kg DOUBLE PRECISION,
            total_weight_current_component_produced_kg DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_packaging_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),      
            material_box_weight_kg DOUBLE PRECISION,
            emission_factor_box_kg  DOUBLE PRECISION,
            packaging_carbon_emission DOUBLE PRECISION,
            pack_size_l_w_h_m VARCHAR(255),
            packaging VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_waste_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),      
            emission_factor_box_waste_treatment_kg DOUBLE PRECISION,
            packaging_waste_treatment_energy_kg  DOUBLE PRECISION,
            emission_factor_box_packaging_treatment_kg DOUBLE PRECISION,
            waste_generated_per_box_kg VARCHAR(255),
            waste_disposal_emission DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_logistic_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),      
            transport_mode_id VARCHAR(255),
            vehicle_id VARCHAR(255),
            manufacturer_id VARCHAR(255),
            user_id VARCHAR(255),
            destination_site VARCHAR(255),
            mass_transported_kg DOUBLE PRECISION,
            mass_transported_ton DOUBLE PRECISION,
            distance_km DOUBLE PRECISION,
            transport_mode_emission_factor_value_kg DOUBLE PRECISION,
            leg_wise_transport_emissions_per_unit_kg DOUBLE PRECISION,
            total_transportation_emissions_per_unit_kg DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS bom_emission_calculation_engine (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),      
            material_value DOUBLE PRECISION,
            production_value DOUBLE PRECISION,
            packaging_value DOUBLE PRECISION,
            waste_value DOUBLE PRECISION,
            logistic_value DOUBLE PRECISION,
            pcf_value DOUBLE PRECISION,
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,

        `CREATE TABLE IF NOT EXISTS allocation_methodology (
            id VARCHAR(255) PRIMARY KEY,
            bom_id VARCHAR(255),   
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
            code VARCHAR(255),      
            task_title VARCHAR(255),
            category_id VARCHAR(255),
            priority VARCHAR(255),
            assign_to VARCHAR(255),
            due_date TIMESTAMPTZ,
            description TEXT,
            related_product VARCHAR(255),
            estimated_hour INTEGER,
            tags VARCHAR(255)[],
            attachments TEXT,
            progress VARCHAR(255),
            status VARCHAR(255) DEFAULT 'To Do',
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
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
        //   ==========>Data Setup tables end<============
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