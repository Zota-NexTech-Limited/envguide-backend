import client from "../util/database";

export async function mirgation() {
    const createTableQueries: any = [
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
            FOREIGN KEY
         (
             user_role_id
         ) REFERENCES roles_table
         (
             role_id
         ),
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

    ]

    try {
        var queryGlobal
        for (const query of createTableQueries) {
            queryGlobal = query
            const tables = await client.query(query);
        }

        console.log("Tables created successfully");
    } catch (error) {
        console.error("Error creating tables:", error, queryGlobal);
    }
}