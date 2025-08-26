import client from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

export async function createTemplete(req: any, res: any) {
  try {
    const reqbObj = req.body

    reqbObj.mapping_id = ulid()

    // Convert JSON fields to proper JSON objects
    if (reqbObj.excel_columns) reqbObj.excel_columns = JSON.stringify(reqbObj.excel_columns);
    if (reqbObj.mapped_columns) reqbObj.mapped_columns = JSON.stringify(reqbObj.mapped_columns);
    if (reqbObj.excel_rows) reqbObj.excel_rows = JSON.stringify(reqbObj.excel_rows);


    const columns = Object.keys(reqbObj);
    const values = Object.values(reqbObj);

    const query = `
        INSERT INTO excel_import_column_mapping_table (${columns.join(', ')})
        VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *;
      `;

    const result = await client.query(query, values);
    if (result.rows.length > 0) {

      return res.send(
        generateResponse(true, "templeted created   succesfully", 200, result.rows)
      )

    } else {
      return res.send(
        generateResponse(false, "templete create   unsuccesfully", 400, null)
      )

    }

  } catch (error: any) {
    return res.send(generateResponse(false, error.message, 400, null));
  }
}



export async function updateMapping(req: any, res: any) {
  try {
    const { mapping_id, module_name, cmr_vendor_name, excel_columns, mapped_columns, excel_rows, gst_format, exp_format } = req.body;

    const updateFields: string[] = [];
    const values: any[] = [];

    if (excel_columns !== undefined) {
      updateFields.push(`excel_columns = $${values.length + 1}::jsonb`);
      values.push(JSON.stringify(excel_columns));
    }

    if (mapped_columns !== undefined) {
      updateFields.push(`mapped_columns = $${values.length + 1}::jsonb`);
      values.push(JSON.stringify(mapped_columns));
    }

    if (excel_rows !== undefined) {
      updateFields.push(`excel_rows = $${values.length + 1}::jsonb`);
      values.push(JSON.stringify(excel_rows));
    }


    if (cmr_vendor_name !== undefined) {
      updateFields.push(`cmr_vendor_name = $${values.length + 1}`);
      values.push(cmr_vendor_name);
    }

    if (gst_format !== undefined) {
      updateFields.push(`gst_format = $${values.length + 1}`);
      values.push(gst_format);
    }


    if (exp_format !== undefined) {
      updateFields.push(`exp_format = $${values.length + 1}`);
      values.push(exp_format);
    }


    values.push(mapping_id);

    if (updateFields.length === 0) {
      return res.status(400).send(generateResponse(false, "No fields provided for update", 400, null));
    }

    const query = `
      UPDATE excel_import_column_mapping_table
      SET ${updateFields.join(', ')}, update_date = CURRENT_TIMESTAMP
      WHERE mapping_id = $${values.length} 
      RETURNING *;
    `;

    const result = await client.query(query, values);

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, "Mapping updated successfully", 200, result.rows));
    } else {
      return res.status(404).send(generateResponse(false, "Mapping not found", 404, null));
    }
  } catch (error: any) {
    return res.status(500).send(generateResponse(false, error.message, 500, null));
  }
}


export async function getMappingById(req: any, res: any) {
  try {
    const { mapping_id, module_name } = req.query;


    const query = `
      SELECT * FROM excel_import_column_mapping_table
      WHERE mapping_id = $1 
    `;

    const result = await client.query(query, [mapping_id]);

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, "Mappings retrieved successfully", 200, result.rows));
    } else {
      return res.status(404).send(generateResponse(false, "No mappings found", 404, null));
    }
  } catch (error: any) {
    return res.status(500).send(generateResponse(false, error.message, 500, null));
  }
}


export async function getMappingList(req: any, res: any) {
  try {
    const { searchValue } = req.query
    const searchCondition = searchValue
      ? `AND (LOWER(cmr_vendor_name) ILIKE LOWER('%${searchValue}%'))`
      : '';
    const query = ` SELECT * FROM excel_import_column_mapping_table WHERE 1=1 ${searchCondition}`;

    const result = await client.query(query);

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, "Mappings retrieved successfully", 200, result.rows));
    } else {
      return res.status(404).send(generateResponse(false, "No mappings found", 404, null));
    }
  } catch (error: any) {
    return res.status(500).send(generateResponse(false, error.message, 500, null));
  }
}


export async function getColumnList(req: any, res: any) {
  try {


    const query = `
SELECT  column_name
FROM information_schema.columns 
WHERE table_name IN ('good_order_receipt_items_list', 'goods_order_receipt_table', 'good_order_receipt_items_batches_list')


    `;

    const result = await client.query(query);

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, "column retrieved successfully", 200, result.rows));
    } else {
      return res.status(404).send(generateResponse(false, "No mappings found", 404, null));
    }
  } catch (error: any) {
    return res.status(500).send(generateResponse(false, error.message, 500, null));
  }
}


export async function deleteMappingById(req: any, res: any) {
  try {
    const mapping_id = req.body.mapping_id;


    const query = `
      delete FROM excel_import_column_mapping_table
      WHERE mapping_id = $1 
    `;

    const result = await client.query(query, [mapping_id]);
    if (result.rows.length == 0) {
      console.log('Customers found:', result.rows);
      return res.status(200).send(
        generateResponse(true, "delete deleted successfully", 200, result.rows))
    } else {
      return res.status(400).send(
        generateResponse(false, "customer not found", 400, null))
    }
  } catch (error: any) {
    return res.status(500).send(generateResponse(false, error.message, 500, null));
  }
}




export async function createRoleBasedCustomization(req: any, res: any) {
  try {
    const reqbObj = req.body

    reqbObj.id = ulid()

    // Convert JSON fields to proper JSON objects

    if (reqbObj.customization) reqbObj.customization = JSON.stringify(reqbObj.customization);


    const columns = Object.keys(reqbObj);
    const values = Object.values(reqbObj);

    const query = `
        INSERT INTO user_column_preferences (${columns.join(', ')})
        VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *;
      `;

    const result = await client.query(query, values);
    if (result.rows.length > 0) {
      console.log("wwwwwww", result.rows)
      return res.send(
        generateResponse(true, "templeted created   succesfully", 200, result.rows)
      )

    } else {
      return res.send(
        generateResponse(false, "templete create   unsuccesfully", 400, null)
      )

    }

  } catch (error: any) {
    return res.send(generateResponse(false, error.message, 400, null));
  }
}



export async function updateRoleBasedCustomization(req: any, res: any) {
  try {
    const { id, role_id, document_id, customization } = req.body;

    // Validate required fields
    if (!role_id || !document_id) {
      return res.status(400).send(generateResponse(false, 'role_id and document_id are required', 400, null));
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    // Add customization to update fields if provided
    if (customization !== undefined) {
      updateFields.push(`customization = $${values.length + 1}::jsonb`);
      values.push(JSON.stringify(customization));
    }

    // Add role_id and document_id to values (these will be the last parameters)
    values.push(role_id, document_id);

    if (updateFields.length === 0) {
      return res.status(400).send(generateResponse(false, 'No fields provided for update', 400, null));
    }

    // Construct the query with proper WHERE clause
    const query = `
      UPDATE user_column_preferences
      SET ${updateFields.join(', ')}, update_date = CURRENT_TIMESTAMP
      WHERE role_id = $${values.length - 1} AND document_id = $${values.length}
      RETURNING *;
    `;

    const result = await client.query(query, values);

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, 'Mapping updated successfully', 200, result.rows[0]));
    } else {
      return res.status(404).send(generateResponse(false, 'Mapping not found', 404, null));
    }
  } catch (error: any) {
    console.error('Error updating role-based customization:', error);
    return res.status(500).send(generateResponse(false, 'Internal server error', 500, null));
  }
}

export async function getcustomizationById(req: any, res: any) {
  try {
    const { role_id, document_id } = req.query;


    const query = `
      SELECT * FROM user_column_preferences
      WHERE role_id = $1 AND document_id = $2
    `;

    const result = await client.query(query, [role_id, document_id]);

    const deafultValuesquery = `
    SELECT * FROM user_column_preferences_default_values
    WHERE document_id = $1
  `;

    const defaultValuesresult = await client.query(deafultValuesquery, [document_id]);
    if (result.rows.length > 0) {
      return res.send(generateResponse(true, "Mappings retrieved successfully", 200, { customziationValues: result.rows, defaultValues: defaultValuesresult.rows }));
    } else {
      return res.status(404).send(generateResponse(false, "No mappings found", 404, null));
    }
  } catch (error: any) {
    return res.status(500).send(generateResponse(false, error.message, 500, null));
  }
}




export async function createDefaultRoleBasedCustomization(req: any, res: any) {
  try {
    const reqbObj = req.body



    // Convert JSON fields to proper JSON objects

    if (reqbObj.customization) reqbObj.customization = JSON.stringify(reqbObj.customization);


    const columns = Object.keys(reqbObj);
    const values = Object.values(reqbObj);

    const query = `
        INSERT INTO user_column_preferences_default_values (${columns.join(', ')})
        VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *;
      `;

    const result = await client.query(query, values);
    if (result.rows.length > 0) {

      return res.send(
        generateResponse(true, "templeted created   succesfully", 200, result.rows)
      )

    } else {
      return res.send(
        generateResponse(false, "templete create   unsuccesfully", 400, null)
      )

    }

  } catch (error: any) {
    return res.send(generateResponse(false, error.message, 400, null));
  }
}



export async function updateDefaultRoleBasedCustomization(req: any, res: any) {
  try {
    const { document_id, customization } = req.body;

    // Validate required fields


    const updateFields: string[] = [];
    const values: any[] = [];

    // Add customization to update fields if provided
    if (customization !== undefined) {
      updateFields.push(`customization = $${values.length + 1}::jsonb`);
      values.push(JSON.stringify(customization));
    }

    // Add role_id and document_id to values (these will be the last parameters)
    values.push(document_id);

    if (updateFields.length === 0) {
      return res.status(400).send(generateResponse(false, 'No fields provided for update', 400, null));
    }

    // Construct the query with proper WHERE clause
    const query = `
      UPDATE user_column_preferences_default_values
      SET ${updateFields.join(', ')}, update_date = CURRENT_TIMESTAMP
      WHERE document_id = $${values.length}
      RETURNING *;
    `;

    const result = await client.query(query, values);

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, 'Mapping updated successfully', 200, result.rows[0]));
    } else {
      return res.status(404).send(generateResponse(false, 'Mapping not found', 404, null));
    }
  } catch (error: any) {
    console.error('Error updating role-based customization:', error);
    return res.status(500).send(generateResponse(false, 'Internal server error', 500, null));
  }
}

export async function getDeafultcustomizationById(req: any, res: any) {
  try {
    const { document_id } = req.query;


    const query = `
      SELECT * FROM user_column_preferences_default_values
      WHERE document_id = $1
    `;

    const result = await client.query(query, [document_id]);

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, "Mappings retrieved successfully", 200, result.rows));
    } else {
      return res.status(404).send(generateResponse(false, "No mappings found", 404, null));
    }
  } catch (error: any) {
    return res.status(500).send(generateResponse(false, error.message, 500, null));
  }
}





export async function getcustomizatiobyrole(req: any, res: any) {
  try {

    const role_id = req.role_id
    console.log(role_id, "sss")

    const query = `
      SELECT * FROM user_column_preferences
      join document_type_table on document_type_table.document_id = user_column_preferences.document_id
      WHERE role_id = $1
    `;

    const result = await client.query(query, [role_id]);
    console.log(result.rows)
    if (result.rows.length > 0) {
      const reponseObject = []

      for (let item of result.rows) {
        reponseObject.push({
          [item.document_type_name]: item.customization,
        });
      }
      return res.send(generateResponse(true, "user prefernce retrieved successfully", 200, reponseObject));
    } else {
      return res.status(404).send(generateResponse(false, "No mappings found", 404, null));
    }
  } catch (error: any) {
    return res.status(500).send(generateResponse(false, error.message, 500, null));
  }
}






export async function createModuleSetting(req: any, res: any) {
  try {
    const reqbObj = req.body


    // Convert JSON fields to proper JSON objects

    if (reqbObj.document_setting) reqbObj.document_setting = JSON.stringify(reqbObj.document_setting);


    const columns = Object.keys(reqbObj);
    const values = Object.values(reqbObj);

    const query = `
        INSERT INTO module_setting (${columns.join(', ')})
        VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *;
      `;

    const result = await client.query(query, values);
    if (result.rows.length > 0) {
      console.log("wwwwwww", result.rows)
      return res.send(
        generateResponse(true, "module setting  created   succesfully", 200, result.rows)
      )

    } else {
      return res.send(
        generateResponse(false, "module setting  create   unsuccesfully", 400, null)
      )

    }

  } catch (error: any) {
    return res.send(generateResponse(false, error.message, 400, null));
  }
}



export async function updateModuleSetting(req: any, res: any) {
  try {
    const { document_name, document_setting } = req.body;

    console.log(document_name, document_setting, "ssssss");
    // Validate required fields
    if (!document_name) {
      return res.status(400).send(generateResponse(false, 'role_id and document_id are required', 400, null));
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    // Add customization to update fields if provided
    if (document_setting !== undefined) {
      console.log(document_setting, "ssssss");
      updateFields.push(`document_setting = $1::jsonb`);
      values.push(JSON.stringify(document_setting));
    }

    // Add document_name to values (this will be the second parameter)
    values.push(document_name);

    if (updateFields.length === 0) {
      return res.status(400).send(generateResponse(false, 'No fields provided for update', 400, null));
    }

    // Construct the query with proper WHERE clause
    const query = `
      UPDATE module_setting
      SET ${updateFields.join(', ')}, update_date = CURRENT_TIMESTAMP
      WHERE document_name = $2
      RETURNING *;
    `;
    console.log(query, values, "ssssss");
    const result = await client.query(query, values);

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, 'module setting updated successfully', 200, result.rows[0]));
    } else {
      return res.status(404).send(generateResponse(false, 'module setting not found', 404, null));
    }
  } catch (error: any) {
    console.error('Error updating role-based customization:', error);
    return res.status(500).send(generateResponse(false, 'Internal server error', 500, null));
  }
}



export async function getModuleSetting() {
  try {


    const query = `
      SELECT * FROM module_setting
      WHERE document_name = $1
    `;


    const result = await client.query(query, ['Add Billing']);
    console.log(result.rows)
    if (result.rows.length > 0) {
      const autoBatch = result.rows[0].document_setting
        .flatMap((section: { list: any; }) => section.list)
        .find((item: { label: string; }) => item.label === "Auto Batch Selection");

      console.log(autoBatch.value);
      const isAutoBatch = autoBatch.value
      return isAutoBatch
    }
  } catch (error: any) {
    console.log("wwww")
  }
}


export async function getAllModuleSetting(req: any, res: any) {
  try {


    const query = `
      SELECT * FROM module_setting
    `;


    const result = await client.query(query);
    console.log(result.rows)

    if (result.rows.length > 0) {
      return res.send(generateResponse(true, 'module setting updated successfully', 200, result.rows));
    } else {
      return res.status(404).send(generateResponse(false, 'module setting not found', 404, null));
    }


  } catch (error: any) {
    console.log("wwww")
  }
}



export async function getModuleSettingForBatchFetchingCriteria() {
  try {


    const query = `
      SELECT * FROM module_setting
      WHERE document_name = $1
    `;


    const result = await client.query(query, ['Add Billing']);
    console.log(result.rows)
    if (result.rows.length > 0) {
      const autoBatch = result.rows[0].document_setting
        .flatMap((section: { list: any; }) => section.list)
        .find((item: { label: string; }) => item.label === "Batch Fetching Criteria");

      console.log(autoBatch.value);
      const isAutoBatch = autoBatch.value
      return isAutoBatch
    }
  } catch (error: any) {
    console.log("wwww")
  }
}
