import { QUESTIONNAIRE_OPTIONS } from "./questionnaireConfig";

export type FieldType =
  | "text"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "textarea"
  | "date"
  | "file"
  | "table"
  | "group"
  | "info" // For static text/info blocks
  | "tags"; // For pill-based multi-input (array of strings)

export interface QuestionnaireOption {
  label: string;
  value: string | number;
}

// API Dropdown types for dynamic options
export type ApiDropdownType =
  | "fuelType" // Q16 - Fuel types
  | "subFuelTypeByFuel" // Q16 - Sub-fuel types (depends on fuel_type)
  | "subFuelType" // Q17 - All sub-fuel types
  | "refrigerantType" // Q19 - Refrigerant types
  | "energySource" // Q22, Q44, Q51 - Energy sources
  | "energyTypeBySource" // Q22, Q44, Q51 - Energy types (depends on energy_source)
  | "processSpecificEnergy" // Q28 - Process specific energy
  | "energyType" // Q28 - Energy types (all)
  | "bomMaterials" // Q28 - BOM materials from products_manufactured
  | "wasteType" // Q40, Q68 - Waste types
  | "wasteTreatmentType" // Q40, Q68 - Waste treatment types
  | "productUnit" // Q15 - Unit of Measure dropdown
  | "transportMode" // Transport Mode dropdown
  // UOM dropdowns for specific questions
  | "liquidGaseousSolidWaterUnit" // Q16, Q17 - Liquid/Gaseous/Solid/Water units
  | "liquidGaseousSolidUnit" // Q19, Q35 - Liquid/Gaseous/Solid units
  | "gaseousFuelUnit" // Q21 - Gaseous fuel units
  | "energyUnit" // Q22, Q27, Q28, Q30, Q33, Q44, Q47, Q51, Q67 - Energy units
  | "qcEquipmentUnit" // Q32, Q48 - QC Equipment units
  | "liquidGaseousUnit" // Q34 - Liquid/Gaseous units
  | "solidFuelUnit" // Q37, Q61, Q68 - Solid fuel units
  | "liquidSolidUnit" // Q40 - Liquid/Solid units
  | "packingUnit" // Q60, Q62 - Packing units
  | "materialType" // Q52 - Material/Material Type
  | "packingType" // Q60 - Packing type
  | "packagingTreatmentType"; // Q60 - Packaging treatment type

export interface QuestionnaireField {
  name: string; // Data key (path in the data object)
  label?: string; // Display label
  type: FieldType;
  options?: string[] | QuestionnaireOption[]; // For select (static options)
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  dependency?: {
    field: string;
    value: any;
    operator?: "eq" | "neq" | "contains"; // default eq
  };
  // For tables
  columns?: QuestionnaireField[];
  addButtonLabel?: string;
  // For groups
  fields?: QuestionnaireField[];
  // For numbers
  min?: number;
  max?: number;
  // For text
  maxLength?: number;
  // For info
  content?: React.ReactNode;
  className?: string;
  mode?: "multiple" | "tags";
  // For API-driven dropdowns
  apiDropdown?: ApiDropdownType;
  // For cascading/dependent dropdowns - the field name this depends on
  dependsOnField?: string;
  // Auto-populate table rows from products_manufactured (Q15)
  autoPopulateFromProducts?: boolean;
  // For file uploads - allow multiple files
  multiple?: boolean;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  fields: QuestionnaireField[];
}

export const QUESTIONNAIRE_SCHEMA: QuestionnaireSection[] = [
  {
    id: "general_information",
    title: "General Information",
    fields: [
      {
        name: "gdpr_notice",
        type: "info",
        content:
          "All information provided is confidential and used only for Corporate and product level sustainability assessment.",
        label: "Display Message as per GDPR",
        className: "bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-700",
      },
      {
        name: "re_technologies_info",
        type: "info",
        label:
          "Please read following eligible technologies to be considered as renewable electricity (RE) and acknowledge them.",
        content:
          "1. Wind\n2. Hydro\n3. Solar power\n4. Geothermal\n5. Solid, liquid, and gaseous forms of Biomass from the fuels (woody waste, land fill gas, wastewater methane, animal & other organic waste, energy crops)\n6. Ocean-based energy resources captured through tidal and wave technologies.\n\nExcluded technologies:\n1. Electricity from nuclear power is not regarded as renewable electricity.\n2. Electricity from waste combustion is not regarded as renewable electricity.",
        className: "bg-white p-6 rounded-lg border border-gray-200 mb-4",
      },
      {
        name: "general_information.re_technologies_acknowledgement",
        label:
          "I acknowledge that I have read and understood the Eligible technologies consider as renewable electricity (RE) mentioned above.",
        type: "checkbox",
        required: true,
      },
      {
        name: "re_procurement_info",
        type: "info",
        label:
          "Please read following Procurement mechanisms and acknowledge them.",
        content:
          "Electricity will be regarded as renewable electricity if provided using one of the mechanisms stated below and respecting the requirements regarding double counting. Please select which ones apply to your processes. If none apply in the country carbon emissions occur, at the end an alternative locally accepted at the time of production type of proof:\n\nAcronyms used:\nPPA: Power Purchase Agreements\nEAC: Energy Attribute Certificates\niREC or I-REC: International Green Energy Certificates\nGOO: Guarantee of Origin\n\n1. Onsite generation: EACs generated\n2. Onsite generation: No EACs generated\n3. Off-Site generation: PPA / sleeved PPA (Proof of delivery necessary)\n4. Off-Site generation: Virtual PPA (Proof via EAC necessary)\n5. Off-Site generation: Green Power Tariff / Green Power Product\n6. Power supplied by an electricity provider where the provider takes over the responsibility to provide the electricity either directly from renewable sources (e.g. through PPAs) or procures and deletes unbundled EACs for the supplied electricity.\n7. Unbundled EACs\n8. Unbundled REC's / I-REC's",
        className: "bg-white p-6 rounded-lg border border-gray-200 mb-4",
      },
      {
        name: "general_information.re_procurement_acknowledgement",
        label:
          "I acknowledge that I have read and understood the procurement mechanisms mentioned above.",
        type: "checkbox",
        required: true,
      },
      {
        name: "double_counting_info",
        type: "info",
        label: "DOUBLE COUNTING",
        content:
          'Please acknowledge that the mechanism you use does not fall under Double Counting. Examples of prohibited double uses include, but are not limited to:\n1. When the same EAC is sold by one party to more than one party, or any case where another party has a conflicting contract for the EACs or the renewable electricity;\n2. When the same EAC is claimed by more than one party, including any expressed or implied environmental claims made pursuant to electricity coming from a renewable energy resource, environmental labelling or disclosure requirements. This includes representing the energy from which EACs are derived as renewable in calculating another entity\'s product or portfolio resource mix for the purposes of marketing or disclosure;\n3. When the same EAC is used by an electricity provider or utility to meet an environmental mandate, such as an RPS, and is also used to satisfy customer sales or\n4. Use of one or more attributes of the renewable energy or EAC by another party. This includes when an EAC is simultaneously sold to represent "renewable electricity" to one party, and one or more Attributes associated with the same MWh of generation (such as CO2 reduction) are also sold, to another party.',
        className: "bg-white p-6 rounded-lg border border-gray-200 mb-4",
      },
      {
        name: "general_information.double_counting_acknowledgement",
        label: "I acknowledge my mechanisms do not fall under double counting",
        type: "checkbox",
        required: true,
      },
    ],
  },
  {
    id: "organization_details",
    title: "Section 1: Organization Details",
    fields: [
      {
        name: "organization_details.organization_name",
        label: "1. Please enter the name of your organization?",
        type: "text",
        required: true,
        placeholder: "Enter organization name",
      },
      {
        name: "organization_details.core_business_activities",
        label: "2. What is your core business activities?",
        type: "select",
        options: QUESTIONNAIRE_OPTIONS.CORE_BUSINESS_ACTIVITIES,
        required: true,
        placeholder: "Select activity",
      },
      {
        name: "organization_details.core_business_activities_other",
        label: "Specify Other Activity",
        type: "text",
        placeholder: "Enter other activity",
        dependency: {
          field: "organization_details.core_business_activities",
          value: "Others",
        },
      },
      {
        name: "organization_details.designation",
        label: "3. Please enter your Designation/Role/Title?",
        type: "text",
        required: true,
        placeholder: "Enter designation",
      },
      {
        name: "organization_details.email_address",
        label: "4. Please enter your e-mail address?",
        type: "text",
        required: true,
        placeholder: "Enter email address",
      },
      {
        name: "organization_details.number_of_employees",
        label: "5. How many employees does your organization have?",
        type: "select",
        options: QUESTIONNAIRE_OPTIONS.NUMBER_OF_EMPLOYEES,
        required: true,
        placeholder: "Select range",
      },
      {
        name: "organization_details.number_of_employees_other",
        label: "Specify the exact number of employees",
        type: "number",
        placeholder: "Enter exact number",
        dependency: {
          field: "organization_details.number_of_employees",
          value: "Other (Specify the exact number)",
        },
      },
      {
        name: "organization_details.annual_revenue",
        label: "6. What is your organization's annual revenue?",
        type: "select",
        options: QUESTIONNAIRE_OPTIONS.ANNUAL_REVENUE,
        required: true,
        placeholder: "Select revenue range",
      },
      {
        name: "organization_details.annual_revenue_other",
        label: "Specify the exact annual revenue",
        type: "text",
        placeholder: "Enter exact amount (e.g., $2.5M)",
        dependency: {
          field: "organization_details.annual_revenue",
          value: "Other (Specify the exact amount)",
        },
      },
      {
        name: "organization_details.annual_reporting_period",
        label: "7. Please enter the organizational annual reporting period?",
        type: "select",
        options: QUESTIONNAIRE_OPTIONS.ANNUAL_REPORTING_PERIOD,
        required: true,
        placeholder: "Select reporting period",
      },
      {
        name: "organization_details.availability_of_emissions_data",
        label:
          "8. Do you have Site or Organizational level Scope 1, 2, and 3 emissions data available?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "organization_details.emission_data",
        label: "9. Provide the emission data?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "organization_details.availability_of_emissions_data",
          value: "Yes",
        },
        columns: [
          {
            name: "country",
            label: "Product Manufacturing location (ISO3 digits Country)",
            type: "text",
            placeholder: "ISO3 Code",
          },
          {
            name: "scope_1",
            label: "Scope-1",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "scope_2",
            label: "Scope-2",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "scope_3",
            label: "Scope-3",
            type: "number",
            placeholder: "0.00",
          },
        ],
      },
    ],
  },
  {
    id: "product_details",
    title: "Section 2: Product Details",
    fields: [
      {
        name: "product_details.existing_pcf_report",
        label:
          "10. Do you already have a Product Carbon Footprint (PCF) report for requested product(s) within 12 months?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "product_details.pcf_methodology",
        label:
          "11. Share methodology (ISO 14067, GHG Protocol, Catena-X, etc.)",
        type: "tags",
        placeholder: "Type methodology and press Enter to add",
        required: true,
        dependency: {
          field: "product_details.existing_pcf_report",
          value: "Yes",
        },
      },
      {
        name: "product_details.pcf_report_file",
        label:
          "12. Please provide/upload the Product Carbon Footprint (PCF) report for your product(s)?",
        type: "file",
        multiple: true,
        required: true,
        dependency: {
          field: "product_details.existing_pcf_report",
          value: "Yes",
        },
      },
      {
        name: "product_details.production_site_details",
        label:
          "13. Please Specify the Production Site Where the Product is manufactured/ assembled?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "text",
            placeholder: "Enter MPN",
          },
          {
            name: "component_name",
            label: "Component/Product Name",
            type: "text",
            placeholder: "Enter name",
          },
          {
            name: "location",
            label: "Location",
            type: "select",
            options: ["India", "Europe", "Global"],
            placeholder: "Select location",
          },
          {
            name: "detailed_location",
            label: "Detailed Location",
            type: "text",
            placeholder: "Enter detailed location",
          },
        ],
      },
      {
        name: "product_details.required_environmental_impact_methods",
        label:
          "14. Which Environmental Impact method is required for your product?",
        type: "checkbox",
        options: QUESTIONNAIRE_OPTIONS.REQUIRED_ENVIRONMENTAL_IMPACT_METHODS,
        required: true,
      },
      {
        name: "product_details.required_environmental_impact_methods_other",
        label: "Specify Custom Method",
        type: "text",
        placeholder: "Enter your custom method",
        dependency: {
          field: "product_details.required_environmental_impact_methods",
          value: "Other (Add Custom Method)",
          operator: "contains",
        },
      },
      {
        name: "product_details.products_manufactured",
        label:
          "15. Please list all the products/components you manufacture and provide the corresponding details for each.",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "mpn",
            label: "Material Number (MPN)",
            type: "text",
            placeholder: "Enter MPN",
          },
          {
            name: "product_name",
            label: "Product/ Component Name",
            type: "text",
            placeholder: "Enter name",
          },
          {
            name: "production_period",
            label: "Production Period",
            type: "select",
            options: ["Monthly", "Annual"],
            placeholder: "Select period",
          },
          {
            name: "weight_per_unit",
            label: "Weight per Component/ Product",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "productUnit",
            placeholder: "Select unit",
          },
          {
            name: "price",
            label: "Price of each component / Product (₹)",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "quantity",
            label: "Quantity/ Volume (Pcs)",
            type: "number",
            placeholder: "0",
          },
        ],
      },
      {
        name: "product_details.any_co_product_have_economic_value",
        label: "15.1 Any Co-products generated which have economic value?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "product_details.co_products",
        label: "15.2 Specify type of Co-products details?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        dependency: {
          field: "product_details.any_co_product_have_economic_value",
          value: "Yes",
        },
        columns: [
          {
            name: "material_number",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "product_name",
            label: "Name of Component",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "co_product_name",
            label: "Co-product Name",
            type: "text",
            placeholder: "Enter co-product name",
          },
          {
            name: "weight",
            label: "Weight",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "price_per_product",
            label: "Price per Product (₹)",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "quantity",
            label: "Quantity/Volume (Pcs)",
            type: "number",
            placeholder: "0",
          },
        ],
      },
    ],
  },
  {
    id: "scope_1",
    title: "Section 3: Scope 1 - Direct Emissions",
    fields: [
      {
        name: "scope_1.stationary_combustion",
        label:
          "16. What type and quantity of fuel does your company use for energy generation (e.g., boilers, furnaces, Generators, any on-site operations)?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "fuel_type",
            label: "Fuel",
            type: "select",
            apiDropdown: "fuelType",
            placeholder: "Select fuel",
          },
          {
            name: "sub_fuel_type",
            label: "Sub-Fuel Type",
            type: "select",
            apiDropdown: "subFuelTypeByFuel",
            dependsOnField: "fuel_type",
            placeholder: "Select sub-fuel type",
          },
          {
            name: "quantity",
            label: "Consumption Quantity of fuel",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "liquidGaseousSolidWaterUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_1.mobile_combustion",
        label:
          "17. What type and quantity of fuel is consumed annually by company-owned vehicles (e.g., fleet, delivery trucks) in litres?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "fuel_type",
            label: "Fuel",
            type: "select",
            apiDropdown: "subFuelType",
            placeholder: "Select fuel type",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Quantity",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "liquidGaseousSolidWaterUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_1.fugitive_emissions.refrigerant_top_ups",
        label:
          "18. Have you performed refrigerant top-ups for air conditioning, refrigeration, or fire suppression systems?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_1.fugitive_emissions.refrigerants",
        label:
          "19. What types and quantities of refrigerants (e.g., HFCs) have been used?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "scope_1.fugitive_emissions.refrigerant_top_ups",
          value: "Yes",
        },
        columns: [
          {
            name: "type",
            label: "Refrigerant Type",
            type: "select",
            apiDropdown: "refrigerantType",
            placeholder: "Select refrigerant type",
          },
          {
            name: "quantity",
            label: "Consumption Quantity",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "liquidGaseousSolidUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_1.process_emissions.present",
        label:
          "20. Are there emissions from industrial processes (e.g., chemical reactions, material processing)?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_1.process_emissions.sources",
        label:
          "21. What are the sources and types of gases emitted (e.g., CO₂, CH₄, N₂O)?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "scope_1.process_emissions.present",
          value: "Yes",
        },
        columns: [
          {
            name: "source",
            label: "Sources",
            type: "text",
            placeholder: "Enter source",
          },
          {
            name: "gas_type",
            label: "Gas type",
            type: "select",
            options: ["CO₂", "CH₄", "N₂O"],
            placeholder: "Select gas",
          },
          {
            name: "quantity",
            label: "quantity",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "gaseousFuelUnit",
            placeholder: "Select unit",
          },
        ],
      },
    ],
  },
  {
    id: "scope_2",
    title: "Section 4: Scope 2: Indirect Emissions from Purchased Energy",
    fields: [
      {
        name: "scope_2.purchased_energy",
        label:
          "22. Please enter the details of Energy purchased or acquired below and select the respective correct energy unit.",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "energy_source",
            label: "Energy Source Purchased/acquired",
            type: "select",
            apiDropdown: "energySource",
            placeholder: "Select source",
          },
          {
            name: "energy_type",
            label: "Energy_Type",
            type: "select",
            apiDropdown: "energyTypeBySource",
            dependsOnField: "energy_source",
            placeholder: "Select type",
          },
          {
            name: "quantity",
            label: "Purchased/Acquired Quantity",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_2.standardized_re_certificates",
        label: "23. Do you acquire any standardized certificate related to RE?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_2.certificates",
        label: "24. Provide the details of standardized Certificate below:",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "scope_2.standardized_re_certificates",
          value: "Yes",
        },
        columns: [
          {
            name: "name",
            label: "Name of the certificate",
            type: "text",
            placeholder: "Enter name",
          },
          {
            name: "procurement_mechanism",
            label: "RE Procurement mechanism",
            type: "select",
            options: QUESTIONNAIRE_OPTIONS.RE_PROCUREMENT_MECHANISMS,
            placeholder: "Select mechanism",
          },
          {
            name: "serial_id",
            label: "Serial Identity (ID)",
            type: "text",
            placeholder: "Enter ID",
          },
          {
            name: "generator_id",
            label: "Generator ID",
            type: "text",
            placeholder: "Enter Generator ID",
          },
          {
            name: "generator_name",
            label: "Generator Name",
            type: "text",
            placeholder: "Enter Generator Name",
          },
          {
            name: "generator_location",
            label: "Generator Location",
            type: "text",
            placeholder: "Enter Location",
          },
          {
            name: "date_of_generation",
            label: "Date of Generation",
            type: "date",
            placeholder: "Select date",
          },
          {
            name: "issuance_date",
            label: "Issuance Date",
            type: "date",
            placeholder: "Select date",
          },
        ],
      },
      {
        name: "scope_2.manufacturing_process_header",
        type: "info",
        label: "4.1 Manufacturing Process-specific energy",
        className: "text-lg font-semibold text-gray-900 mt-6 mb-4",
      },
      {
        name: "scope_2.manufacturing_process_specific_energy.allocation_methodology",
        label:
          "25. Do you have any device or methodology to calculate from factory level to product level energy?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_2.manufacturing_process_specific_energy.methodology_document",
        label: "26. Provide detailed Methodology?",
        type: "file",
        multiple: true,
        placeholder: "Upload methodology document(s)",
        required: true,
        dependency: {
          field:
            "scope_2.manufacturing_process_specific_energy.allocation_methodology",
          value: "Yes",
        },
      },
      {
        name: "scope_2.manufacturing_process_specific_energy.energy_intensity",
        label:
          "27. Please write the energy intensity of production estimated kWh or MJ per unit of product (if available)?",
        type: "table",
        addButtonLabel: "Add Row",
        autoPopulateFromProducts: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "product_name",
            label: "Product/Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "energy_intensity",
            label: "Energy intensity",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_2.manufacturing_process_specific_energy.process_energy_usage",
        label:
          "28. Please write the Process-specific energy usage (if available)?",
        type: "table",
        addButtonLabel: "Add Row",
        columns: [
          {
            name: "material_number",
            label: "Material Number",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select supplier",
          },
          {
            name: "process_type",
            label: "Process-specific energy type",
            type: "select",
            apiDropdown: "processSpecificEnergy",
            placeholder: "Select type",
          },
          {
            name: "energy_source",
            label: "Energy Source",
            type: "select",
            apiDropdown: "energySource",
            placeholder: "Select energy source",
          },
          {
            name: "energy_type",
            label: "Energy Type",
            type: "select",
            apiDropdown: "energyTypeBySource",
            dependsOnField: "energy_source",
            placeholder: "Select energy type",
          },
          {
            name: "quantity",
            label: "Quantity Consumed per product",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_2.manufacturing_process_specific_energy.abatement_systems",
        label:
          "29. Do you use any abatement systems (VOC treatment, heat recovery)?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_2.manufacturing_process_specific_energy.abatement_energy_consumption",
        label: "30. Provide abatement source energy consumption if applicable?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field:
            "scope_2.manufacturing_process_specific_energy.abatement_systems",
          value: "Yes",
        },
        columns: [
          {
            name: "source",
            label: "Abatement system source",
            type: "text",
            placeholder: "Source",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_2.water_consumption",
        label:
          "31. Provide Water consumption and treatment details (if significant for your product).",
        type: "textarea",
        placeholder: "Text/Numeric",
      },
      {
        name: "scope_2.quality_control_header",
        type: "info",
        label: "4.2 Quality control in production",
        className: "text-lg font-semibold text-gray-900 mt-6 mb-4",
      },
      {
        name: "scope_2.quality_control.equipment",
        label:
          "32. What types of quality control/testing equipment do you use?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "equipment_name",
            label: "Equipment Name",
            type: "text",
            placeholder: "Name",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "qcEquipmentUnit",
            placeholder: "Select unit",
          },
          {
            name: "operating_hours",
            label: "Avg. Operating Hours per Month",
            type: "number",
            placeholder: "0",
          },
        ],
      },
      {
        name: "scope_2.quality_control.electricity_consumption",
        label:
          "33. How much electricity is consumed for quality control activities?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "energy_type",
            label: "Energy Type",
            type: "select",
            apiDropdown: "energySource",
            placeholder: "Select energy type",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
          {
            name: "period",
            label: "Period",
            type: "select",
            options: ["monthly", "annually"],
            placeholder: "Select period",
          },
        ],
      },
      {
        name: "scope_2.quality_control.utilities",
        label:
          "34. Do your quality control processes use compressed air, nitrogen, or other utilities?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "name",
            label: "Process Name",
            type: "text",
            placeholder: "Name",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "liquidGaseousUnit",
            placeholder: "Select unit",
          },
          {
            name: "period",
            label: "Period",
            type: "select",
            options: ["Annual", "Monthly"],
            placeholder: "Select period",
          },
        ],
      },
      {
        name: "scope_2.quality_control.utilities_pressure_flow",
        label:
          "34.1 Do your quality control processes use pressure or flow-based utilities?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "name",
            label: "Flow Name",
            type: "text",
            placeholder: "Name",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "liquidGaseousUnit",
            placeholder: "Select unit",
          },
          {
            name: "period",
            label: "Period",
            type: "select",
            options: ["Annual", "Monthly"],
            placeholder: "Select period",
          },
        ],
      },
      {
        name: "scope_2.quality_control.consumables",
        label: "35. Do quality control activities use any consumables?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "consumable_name",
            label: "Consumable Name",
            type: "text",
            placeholder: "Name",
          },
          {
            name: "mass",
            label: "Mass of Consumables",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "liquidGaseousSolidUnit",
            placeholder: "Select unit",
          },
          {
            name: "period",
            label: "Period",
            type: "select",
            options: ["Monthly", "Annually"],
            placeholder: "Select period",
          },
        ],
      },
      {
        name: "scope_2.quality_control.destructive_testing",
        label: "36. Do you perform destructive testing?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_2.quality_control.destructive_testing_details",
        label: "37. Please write the weight of samples destroyed?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        dependency: {
          field: "scope_2.quality_control.destructive_testing",
          value: "Yes",
        },
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "weight",
            label: "Weight",
            type: "number",
            placeholder: "Numerical value",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "solidFuelUnit",
            placeholder: "Select unit",
          },
          {
            name: "period",
            label: "Period",
            type: "select",
            options: ["Monthly", "Annually"],
            placeholder: "Select period",
          },
        ],
      },
      {
        name: "scope_2.quality_control.defect_rate",
        label:
          "38. What is the defect or rejection rate identified by quality control inspections?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "percentage",
            label: "Percentage (%) per product/component",
            type: "number",
            placeholder: "0-100",
          },
        ],
      },
      {
        name: "scope_2.quality_control.rework_rate",
        label: "39. What is the rework rate due to quality control findings?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "processes_involved",
            label: "Processes involved",
            type: "text",
            placeholder: "Processes",
          },
          {
            name: "percentage",
            label: "Percentage (%) per product/component",
            type: "number",
            placeholder: "0-100",
          },
        ],
      },
      {
        name: "scope_2.quality_control.waste",
        label:
          "40. What are the types and weight of Quality control waste generated and treated?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "waste_type",
            label: "Waste Type",
            type: "select",
            apiDropdown: "wasteType",
            placeholder: "Select type",
          },
          {
            name: "weight",
            label: "Waste Weight",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "liquidSolidUnit",
            placeholder: "Select unit",
          },
          {
            name: "treatment_type",
            label: "Treatment type",
            type: "select",
            apiDropdown: "wasteTreatmentType",
            placeholder: "Select treatment",
          },
        ],
      },
      {
        name: "scope_2.it_header",
        type: "info",
        label:
          "Information Technology (IT) for process and manufacturing control",
        className: "text-lg font-semibold text-gray-900 mt-6 mb-4",
      },
      {
        name: "scope_2.it_for_production.systems_used",
        label: "41. What IT systems do you use for production control?",
        required: true,
        type: "checkbox", // Multi-select
        options: QUESTIONNAIRE_OPTIONS.IT_SYSTEMS,
      },
      {
        name: "scope_2.it_for_production.hardware_energy_consumption_tracked",
        label:
          "42. Do you have the energy consumption of IT hardware or on-site servers or data centres related to production?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_2.it_for_production.hardware_energy_included",
        label:
          "43. Is this Energy consumption included in the total energy purchased section-2?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
        dependency: {
          field:
            "scope_2.it_for_production.hardware_energy_consumption_tracked",
          value: "Yes",
        },
      },
      {
        name: "scope_2.it_for_production.hardware_energy_consumption",
        label: "44. Please write the energy consumption?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "scope_2.it_for_production.hardware_energy_included",
          value: "No", // "If NO in Q43"
        },
        columns: [
          {
            name: "energy_source",
            label: "Energy Source Purchased/acquired",
            type: "select",
            apiDropdown: "energySource",
            placeholder: "Select source",
          },
          {
            name: "energy_type",
            label: "Energy_Type",
            type: "select",
            apiDropdown: "energyTypeBySource",
            dependsOnField: "energy_source",
            placeholder: "Select type",
          },
          {
            name: "quantity",
            label: "Purchased/Acquired Quantity",
            type: "number",
            placeholder: "numerical values with decimals",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_2.it_for_production.cloud_systems",
        label:
          "45. Do you use cloud-based systems for production or Quality control?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_2.it_for_production.cloud_usage",
        label:
          "46. Please write the Cloud provider name and approximate monthly compute usage?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "scope_2.it_for_production.cloud_systems",
          value: "Yes",
        },
        columns: [
          {
            name: "provider_name",
            label: "Cloud provider name",
            type: "text",
            placeholder: "AWS, Azure, SAP, etc.",
          },
          {
            name: "virtual_machines",
            label: "Virtual machines (CPU hours/month)",
            type: "number",
            placeholder: "0",
          },
          {
            name: "data_storage",
            label: "Data storage (GB/month)",
            type: "number",
            placeholder: "0",
          },
          {
            name: "data_transfer",
            label: "Data transfer (GB/month)",
            type: "number",
            placeholder: "0",
          },
        ],
      },
      {
        name: "scope_2.it_for_production.sensors",
        label:
          "47. Are any dedicated monitoring sensors used for energy, temperature, pressure, or vibration?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "type",
            label: "Type of sensor",
            type: "text",
            placeholder: "Type",
          },
          {
            name: "quantity",
            label: "Sensor Quantity",
            type: "number",
            placeholder: "0",
          },
          {
            name: "energy_consumption",
            label: "Energy Consumption",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_2.it_for_production.sensor_replacement",
        label:
          "48. What is the annual replacement rate for sensors or IT consumables?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "consumable_name",
            label: "Consumable Name",
            type: "text",
            placeholder: "Name",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "0",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "qcEquipmentUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_2.it_for_production.cooling_systems",
        label: "49. Do you use any cooling systems for server rooms?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_2.it_for_production.cooling_energy_included",
        label:
          "50. Is this Energy consumption included in the total energy purchased section-2?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
        dependency: {
          field: "scope_2.it_for_production.cooling_systems",
          value: "Yes",
        },
      },
      {
        name: "scope_2.it_for_production.cooling_energy_consumption",
        label: "51. Please write the energy consumption?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "scope_2.it_for_production.cooling_energy_included",
          value: "No", // "If NO in 50"
        },
        columns: [
          {
            name: "energy_source",
            label: "Energy Source Purchased/acquired",
            type: "select",
            apiDropdown: "energySource",
            placeholder: "Select source",
          },
          {
            name: "energy_type",
            label: "Energy_Type",
            type: "select",
            apiDropdown: "energyTypeBySource",
            dependsOnField: "energy_source",
            placeholder: "Select type",
          },
          {
            name: "quantity",
            label: "Purchased/Acquired Quantity",
            type: "number",
            placeholder: "numerical values with decimals",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
        ],
      },
    ],
  },
  {
    id: "scope_3",
    title: "Scope 3: Other Indirect Emissions",
    fields: [
      {
        name: "scope_3.materials.raw_materials",
        label:
          "52. Please select or write all the raw materials used in your component manufacturing? If you don't know the detailed compositions please select Enviguide support to connect",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "material",
            label: "Material",
            type: "select",
            apiDropdown: "materialType",
            placeholder: "Material selected above will be default",
          },
          {
            name: "composition_percent",
            label:
              "% material composition of total component weight percentage",
            type: "number",
            placeholder: "0-100",
          },
        ],
      },
      {
        name: "scope_3.materials.raw_materials_contact_support",
        label:
          "52.1 Would you like EnviGuide support to help identify material compositions?",
        type: "radio",
        options: ["Yes", "No"],
        required: false,
      },
      {
        name: "scope_3.materials.metal_grade",
        label:
          "53. What is the grade of metal used in the manufacture of this component?",
        type: "text",
        placeholder: "Enter grade",
        required: true,
      },
      {
        name: "scope_3.materials.msds",
        label:
          "54. Please provide material safety data sheets (MSDS) or composition breakdowns if available?",
        type: "file",
        placeholder: "Upload MSDS document",
      },
      {
        name: "scope_3.materials.recycled_materials_used",
        label:
          "55. Does your company have Consumption of recycled material content / secondary materials used in your products?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.materials.recycled_materials_details",
        label:
          "56. Please write the recycled materials with percentage of recycled material content?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        dependency: {
          field: "scope_3.materials.recycled_materials_used",
          value: "Yes",
        },
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "material_type",
            label: "Material",
            type: "select",
            options: [
              "Recycled Aluminum",
              "Recycled Copper",
              "Recycled Steel",
              "Recycled Plastics (thermoplastics, filler & fiber)",
              "Others",
            ],
            placeholder: "Material selected default",
          },
          {
            name: "recycled_percent",
            label: "% material composition",
            type: "number",
            placeholder: "Percentage answer between 0%-100%",
          },
        ],
      },
      {
        name: "scope_3.materials.estimate_pre_post_consumer",
        label:
          "57. Does your company know (or can give a rough estimate) of the percentage of pre-consumer, post-consumer and reutilization materials used in your products?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.materials.material_type_percentages",
        label:
          "58. Please write the percentage of pre-consumer, post-consumer and reutilization materials used in your products?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "scope_3.materials.estimate_pre_post_consumer",
          value: "Yes",
        },
        columns: [
          {
            name: "type",
            label: "Material Type",
            type: "select",
            options: [
              "Pre-Consumer materials",
              "Post-consumer Materials",
              "Reutilization Materials",
            ],
            placeholder: "Select type",
          },
          {
            name: "percentage",
            label: "Enter Percentage value for material composition",
            type: "number",
            placeholder: "Percentage answer between 0%-100%",
          },
        ],
      },
      {
        name: "scope_3.materials.pir_pcr_materials",
        label:
          "59. Please specify the post-industrial recycling (PIR) materials and post-consumer recycling (PCR) materials with percentage (%)?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "material_type",
            label: "Material Type",
            type: "select",
            options: [
              "Post-industrial recycling (PIR) Material",
              "Post-Consumer Recycling (PCR) Material",
            ],
            placeholder: "Select type",
          },
          {
            name: "recycled_composition",
            label: "Enter Percentage value for recycled material composition",
            type: "number",
            placeholder: "Percentage answer between 0%-100%",
          },
        ],
      },
      {
        name: "scope_3.packaging.materials_used",
        label:
          "60. What type of packaging materials are used for delivering the product?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "packaging_type",
            label: "Packing Type",
            type: "select",
            apiDropdown: "packingType",
            placeholder: "Select type",
          },
          {
            name: "packing_size",
            label: "Packing Size",
            type: "text",
            placeholder: "Size",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "packingUnit",
            placeholder: "Select unit",
          },
          {
            name: "treatment_type",
            label: "Treatment Type",
            type: "select",
            apiDropdown: "packagingTreatmentType",
            placeholder: "Select treatment",
          },
        ],
      },
      {
        name: "scope_3.packaging.weight_per_unit",
        label: "61. Approximate weight of packaging per unit product?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "weight",
            label: "Packaging weight per product",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "solidFuelUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_3.packaging.size",
        label: "62. What is the size of packing?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "size",
            label: "Size of the package",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "packingUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_3.packaging.recycled_content_used",
        label: "63. Do you use recycled material for packaging?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.packaging.recycled_percent",
        label: "64. What % of recycled content used in packaging materials?",
        type: "number",
        required: true,
        dependency: {
          field: "scope_3.packaging.recycled_content_used",
          value: "Yes",
        },
      },
      {
        name: "scope_3.packaging.electricity_used",
        label: "65. Do you use Electricity for packaging?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.packaging.energy_included",
        label:
          "66. Is this Energy consumption included in the total energy purchased section-2?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
        dependency: {
          field: "scope_3.packaging.electricity_used",
          value: "Yes",
        },
      },
      {
        name: "scope_3.packaging.energy_consumption",
        label: "67. Please write the energy consumption?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        dependency: {
          field: "scope_3.packaging.energy_included",
          value: "No",
        },
        columns: [
          {
            name: "energy_source",
            label: "Energy Source Purchased/acquired",
            type: "select",
            apiDropdown: "energySource",
            placeholder: "Select source",
          },
          {
            name: "energy_type",
            label: "Energy_Type",
            type: "select",
            apiDropdown: "energyTypeBySource",
            dependsOnField: "energy_source",
            placeholder: "Select type",
          },
          {
            name: "quantity",
            label: "Purchased/Acquired Quantity",
            type: "number",
            placeholder: "numerical values with decimals",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "energyUnit",
            placeholder: "Select unit",
          },
        ],
      },
      {
        name: "scope_3.waste_disposal.types_and_weight",
        label:
          "68. What are the types and weight of production and Packaging waste generated?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "waste_type",
            label: "Waste Type",
            type: "select",
            apiDropdown: "wasteType",
            placeholder: "Select type",
          },
          {
            name: "weight",
            label: "Waste Weight",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "unit",
            label: "Unit of Measure",
            type: "select",
            apiDropdown: "solidFuelUnit",
            placeholder: "Select unit",
          },
          {
            name: "treatment_type",
            label: "Treatment type",
            type: "select",
            apiDropdown: "wasteTreatmentType",
            placeholder: "Select treatment",
          },
        ],
      },
      {
        name: "scope_3.waste_disposal.recycled_percent",
        label:
          "69. Please write the scrap/waste material percentage (%) that is internally recycled or externally sent for recycling.",
        type: "number",
        placeholder: "Text/Numeric",
        required: true,
      },
      {
        name: "scope_3.waste_disposal.by_products_generated",
        label: "70. Any by-products generated?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.waste_disposal.by_product_details",
        label: "71. Specify type of By product?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        dependency: {
          field: "scope_3.waste_disposal.by_products_generated",
          value: "Yes",
        },
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Name of Component",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "by_product",
            label: "By Product",
            type: "text",
            placeholder: "By-product",
          },
          {
            name: "price",
            label: "Price per product (₹)",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "0",
          },
        ],
      },
      {
        name: "scope_3.logistics.emissions_tracked",
        label:
          "72. Do you track emissions from transporting raw materials to your facilities?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.logistics.estimated_emissions",
        label: "73. Provide estimated CO₂ emissions for your raw materials?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        dependency: {
          field: "scope_3.logistics.emissions_tracked",
          value: "Yes",
        },
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "raw_material",
            label: "Raw Material",
            type: "text",
            placeholder: "Material",
          },
          {
            name: "weight",
            label: "Weight",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "transport_mode",
            label: "Transport Mode",
            type: "select",
            apiDropdown: "transportMode",
            placeholder: "Select mode",
          },
          {
            name: "source",
            label: "Source Location",
            type: "text",
            placeholder: "Source",
          },
          {
            name: "destination",
            label: "Destination Location",
            type: "text",
            placeholder: "Destination",
          },
          {
            name: "co2e",
            label: "Co2 Emissions (KgCo2e)",
            type: "number",
            placeholder: "0.00",
          },
        ],
      },
      {
        name: "scope_3.logistics.transport_modes",
        label:
          "74. What is(are) the Mode(s) of transport used for transportation of components/products? Select all the multimode transports?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        autoPopulateFromProducts: true,
        dependency: {
          field: "scope_3.logistics.emissions_tracked",
          value: "No",
        },
        columns: [
          {
            name: "mpn",
            label: "MPN",
            type: "select",
            apiDropdown: "bomMaterials",
            placeholder: "Select MPN",
          },
          {
            name: "component_name",
            label: "Component Name",
            type: "text",
            placeholder: "Auto-filled from MPN",
          },
          {
            name: "mode",
            label: "Mode of Transport",
            type: "select",
            apiDropdown: "transportMode",
            placeholder: "Select mode",
          },
          {
            name: "weight",
            label: "weight transported (Tons)",
            type: "number",
            placeholder: "0.00",
          },
          {
            name: "source",
            label: "Source Point",
            type: "text",
            placeholder: "Source",
          },
          {
            name: "destination",
            label: "Drop Point",
            type: "text",
            placeholder: "Destination",
          },
          {
            name: "distance",
            label: "Distance (KMS)",
            type: "number",
            placeholder: "0",
          },
        ],
      },
      {
        name: "scope_3.logistics.enviguide_support",
        label:
          "74.1 Would you like EnviGuide support to help calculate transport emissions?",
        type: "radio",
        options: ["Yes", "No"],
        required: false,
      },
      {
        name: "scope_3.logistics.destination_plant",
        label: "75. Which destination plant are the components transported to?",
        type: "table",
        addButtonLabel: "Add Row",
        required: true,
        columns: [
          {
            name: "country",
            label: "Country",
            type: "select",
            options: [
              "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
              "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
              "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
              "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
              "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
              "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
              "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
              "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
              "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
              "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
              "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
              "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
              "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
              "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
              "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
              "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
              "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
              "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
              "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
              "Vietnam", "Yemen", "Zambia", "Zimbabwe"
            ],
            placeholder: "Select country",
          },
          {
            name: "state",
            label: "State",
            type: "text",
            placeholder: "State",
          },
          {
            name: "city",
            label: "City",
            type: "text",
            placeholder: "City",
          },
          {
            name: "pin_code",
            label: "PINCODE",
            type: "text",
            placeholder: "PIN",
          },
        ],
      },
      {
        name: "scope_3.certifications.iso_certified",
        label:
          "76. Are you certified to ISO 14001 (Environmental Management) or ISO 50001 (Energy Management)?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.certifications.standards_followed",
        label:
          "77. Do you follow ISO 14067, GHG Protocol, Catena-X PCF Guideline, or other recognized standards?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.certifications.reporting_frameworks",
        label:
          "78. Do you report to CDP (Carbon Disclosure Project), SBTi (Science-Based Targets initiative), or other ESG frameworks?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "scope_3.certifications.additional_notes.reduction_measures",
        label:
          "79. What measures are you taking to reduce carbon emissions in your production processes?",
        type: "textarea",
        placeholder: "Text",
        required: true,
      },
      {
        name: "scope_3.certifications.additional_notes.initiatives",
        label:
          "80. What renewable energy initiatives or recycling programs are in place at your facility?",
        type: "textarea",
        required: true,
        placeholder: "Text",
      },
      {
        name: "scope_3.certifications.additional_notes.strategies",
        label:
          "81. Could you please share information about your company's current sustainability initiatives and strategies?",
        type: "textarea",
        placeholder:
          "Specifically, we are interested in learning about the actions that you are taking to reduce environmental impact, improve energy Efficiency, and anything related to promote sustainable practices across your operations.",
        required: true,
      },
    ],
  },
  {
    id: "scope_4",
    title: "Section 6: Scope 4: Avoided Emissions",
    fields: [
      {
        name: "scope_4.products_reducing_customer_emissions",
        label:
          "82. Product Impact: Does your company produce any products or services that help reduce emissions for your customers? Can you estimate the emissions avoided by using your product?",
        type: "textarea",
        placeholder: "Open text",
      },
      {
        name: "scope_4.circular_economy_practices",
        label:
          "83. Circular Economy Practices: Do you implement any recycling or reuse programs in your business model that contribute to reducing emissions (e.g., product take-back or Extended Producer Responsibility regulations, refurbishment)?",
        type: "textarea",
        placeholder: "Open text",
      },
      {
        name: "scope_4.offset_projects",
        label:
          "84. Renewable Energy Projects: Has your company implemented or invested in any carbon offset projects or initiatives (e.g., renewable energy investments (e.g., solar, wind), reforestation projects)?",
        type: "textarea",
        placeholder: "Open text",
      },
    ],
  },
];
