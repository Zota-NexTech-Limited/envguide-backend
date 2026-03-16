// helpers/columnConfig.ts
export const columnConfig: Record<string, { value: string; label: string }[]> = {

  users_table: [
    { value: "user_id", label: "User ID" },
    { value: "user_name", label: "User Name" },
    { value: "user_role_id", label: "User Role ID" },
    { value: "user_role", label: "User Role" },
    { value: "user_email", label: "User Email" },
    { value: "user_phone_number", label: "User Phone Number" },
    { value: "user_department", label: "User Department" }
  ],
  own_emission: [
    { value: "code", label: "Own Emission Code" },
    { value: "is_quetions_filled", label: "Is Questions Filled" },
    { value: "own_emission_status", label: "Own Emission Status" },
    { value: "is_own_emission_calculated", label: "Is Own Emission Calculated" },
    { value: "client_id", label: "Client Id" },
    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" }
  ],
  product: [
    { value: "product_code", label: "Product Code" },
    { value: "product_name", label: "Product Name" },
    { value: "product_category_id", label: "Product Category Id" },
    { value: "product_sub_category_id", label: "Product Sub Category Id" },
    { value: "ts_weight_kg", label: "Product Weight In Kg" },
    { value: "ts_manufacturing_process_id", label: "Manufacturing Process Id" },
    { value: "ts_supplier", label: "Supplier" },
    { value: "ts_part_number", label: "Product Number" },
    { value: "ed_estimated_pcf", label: "Estimated PCF" },
    { value: "ed_recyclability", label: "Recyclability" },
    { value: "ed_life_cycle_stage_id", label: "Life Cycle Stage Id" },
    { value: "ed_renewable_energy", label: "Renewable Energy" },
    { value: "pcf_status", label: "PCF Status" },
    { value: "product_status", label: "Product Status" },
    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" }
  ],
  bom_pcf_request: [
    { value: "code", label: "Request Code" },
    { value: "request_title", label: "Request Title" },
    { value: "priority", label: "Priority" },
    { value: "request_organization", label: "Request Organization" },
    { value: "product_category_id", label: "Product Category" },
    { value: "component_category_id", label: "Component Category" },
    { value: "component_type_id", label: "Component Type" },
    { value: "product_code", label: "Product Code" },
    { value: "manufacturer_id", label: "Manufacturer" },
    { value: "model_version", label: "Model Version" },
    { value: "client_id", label: "Client" },
    { value: "status", label: "Status" },
    { value: "is_client", label: "Is Client" },
    { value: "is_approved", label: "Is Approved" },
    { value: "is_rejected", label: "Is Rejected" },
    { value: "is_draft", label: "Is Draft" },
    { value: "is_task_created", label: "Is Task Created" },
    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" },
    { value: "rejected_by", label: "Rejected By" },
    { value: "created_date", label: "Created Date" },
    { value: "overall_pcf", label: "Overall PCF" },
    { value: "overall_own_emission_pcf", label: "Overall Own Emission PCF" },
    { value: "is_own_emission_calculated", label: "Is Own Emission Calculated" },
  ],
  bom_pcf_request_product_specification: [
    { value: "bom_pcf_id", label: "PCF Request ID" },
    { value: "specification_name", label: "Specification Name" },
    { value: "specification_value", label: "Specification Value" },
    { value: "specification_unit", label: "Specification Unit" },
    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ],
  bom: [
    { value: "code", label: "BOM Code" },
    { value: "bom_pcf_id", label: "PCF Request ID" },
    { value: "material_number", label: "Material Number" },
    { value: "component_name", label: "Component Name" },
    { value: "qunatity", label: "Quantity" },
    { value: "production_location", label: "Production Location" },
    { value: "manufacturer", label: "Manufacturer" },
    { value: "component_category", label: "Component Category" },
    { value: "weight_gms", label: "Weight (gms)" },
    { value: "total_weight_gms", label: "Total Weight (gms)" },
    { value: "price", label: "Price" },
    { value: "total_price", label: "Total Price" },
    { value: "economic_ratio", label: "Economic Ratio" },
    { value: "supplier_id", label: "Supplier" },
    { value: "is_bom_calculated", label: "Is BOM Calculated" },
    { value: "is_weight_gms", label: "Is Weight (gms)" },
    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" },
    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ],
  task_managment: [
    { value: "code", label: "Task Code" },
    { value: "task_title", label: "Task Title" },
    { value: "category_id", label: "Category" },
    { value: "bom_pcf_id", label: "PCF Request ID" },
    { value: "priority", label: "Priority" },
    { value: "product", label: "Product" },
    { value: "estimated_hour", label: "Estimated Hours" },
    { value: "progress", label: "Progress" },
    { value: "status", label: "Status" },
    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" },
    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ],
  pcf_bom_comments: [
    { value: "bom_pcf_id", label: "PCF Request ID" },
    { value: "user_id", label: "User Id" },
    { value: "commented_at", label: "Commented Date" }
  ],
  supplier_details: [
    { value: "code", label: "Supplier Code" },
    { value: "supplier_name", label: "Supplier Name" },
    { value: "supplier_email", label: "Email" },
    { value: "supplier_phone_number", label: "Phone Number" },
    { value: "supplier_company_name", label: "Company Name" },
    { value: "supplier_business_type", label: "Business Type" },
    { value: "supplier_city", label: "City" },
    { value: "supplier_state", label: "State" },
    { value: "supplier_country", label: "Country" },
    { value: "supplier_years_in_business", label: "Years in Business" },
    { value: "supplier_gst_number", label: "GST Number" },
    { value: "supplier_pan_number", label: "PAN Number" },
    { value: "supplier_bank_name", label: "Bank Name" },
    { value: "supplier_ifsc_code", label: "IFSC Code" },
    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ],
  manufacturer: [
    { value: "code", label: "Manufacturer Code" },
    { value: "name", label: "Manufacturer Name" },
    { value: "email", label: "Email" },
    { value: "phone_number", label: "Phone Number" },
    { value: "factory_or_plant_name", label: "Factory / Plant Name" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "country", label: "Country" },
    { value: "years_of_operation", label: "Years of Operation" },
    { value: "number_of_employees", label: "Number of Employees" },
    { value: "contact_person_name", label: "Contact Person Name" },
    { value: "contact_person_designation", label: "Contact Person Designation" },
    { value: "contact_person_email", label: "Contact Person Email" },
    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" },
    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ],
  product_category: [
    { value: "code", label: "Category Code" },
    { value: "name", label: "Category Name" },

    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" },

    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ],
  product_sub_category: [
    { value: "code", label: "Sub Category Code" },
    { value: "name", label: "Sub Category Name" },

    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" },

    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ],
  component_type: [
    { value: "code", label: "Component Type Code" },
    { value: "name", label: "Component Type Name" },

    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" },

    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ],
  component_category: [
    { value: "code", label: "Component Category Code" },
    { value: "name", label: "Component Category Name" },

    { value: "created_by", label: "Created By" },
    { value: "updated_by", label: "Updated By" },

    { value: "created_date", label: "Created Date" },
    { value: "update_date", label: "Updated Date" }
  ]





};
