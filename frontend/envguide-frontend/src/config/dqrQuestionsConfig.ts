/**
 * DQR Questions Configuration
 * Maps question keys from API to readable labels and categories
 */

export interface DQRQuestionConfig {
  key: string;
  // Key to use when sending data to API (if different from key)
  apiKey?: string;
  label: string;
  category: string;
  description?: string;
  // Which DQI indicators are required for this question
  dqiRequired: ('TeR' | 'TiR' | 'GR' | 'C' | 'PDS')[];
}

// Categories for grouping questions
export const DQR_CATEGORIES = {
  ORGANIZATION: 'Organization Details',
  PRODUCT: 'Product Details',
  SCOPE_1: 'Scope 1 Emissions',
  SCOPE_2: 'Scope 2 Emissions',
  SCOPE_3: 'Scope 3 Emissions',
  PACKAGING: 'Packaging',
  TRANSPORT: 'Transport & Distribution',
  QUALITY_CONTROL: 'Quality Control',
  IT_PRODUCTION: 'IT for Production',
  MATERIAL: 'Material Composition',
  OTHER: 'Other',
} as const;

// Question configuration mapping
export const DQR_QUESTIONS_CONFIG: Record<string, DQRQuestionConfig> = {
  q9: {
    key: 'q9',
    label: 'Scope 1/2/3 Emissions by Country',
    category: DQR_CATEGORIES.ORGANIZATION,
    description: 'Availability of emissions data by country',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q11: {
    key: 'q11',
    label: 'PCF Methodology',
    category: DQR_CATEGORIES.PRODUCT,
    description: 'PCF calculation methodology used',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q12: {
    key: 'q12',
    label: 'PCF Report Files',
    category: DQR_CATEGORIES.PRODUCT,
    description: 'Uploaded PCF report documents',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q13: {
    key: 'q13',
    label: 'Production Site Details',
    category: DQR_CATEGORIES.PRODUCT,
    description: 'Production site location and details',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q15: {
    key: 'q15',
    label: 'Products Manufactured',
    category: DQR_CATEGORIES.PRODUCT,
    description: 'Product manufacturing details including weight and quantity',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q15_1: {
    key: 'q15_1',
    apiKey: 'q151',
    label: 'Co-Products Economic Value',
    category: DQR_CATEGORIES.PRODUCT,
    description: 'Co-product details and economic value',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q16: {
    key: 'q16',
    label: 'Stationary Combustion (Fuel Usage)',
    category: DQR_CATEGORIES.SCOPE_1,
    description: 'Fuel type and quantity for energy generation',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q17: {
    key: 'q17',
    label: 'Mobile Combustion (Vehicle Fuel)',
    category: DQR_CATEGORIES.SCOPE_1,
    description: 'Fuel consumed by company-owned vehicles',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q19: {
    key: 'q19',
    label: 'Fugitive Emissions (Refrigerants)',
    category: DQR_CATEGORIES.SCOPE_1,
    description: 'Types and quantities of refrigerants used',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q21: {
    key: 'q21',
    apiKey: 'dq21',
    label: 'Process Emissions',
    category: DQR_CATEGORIES.SCOPE_1,
    description: 'Process-related emissions from manufacturing',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q22: {
    key: 'q22',
    label: 'Purchased Energy',
    category: DQR_CATEGORIES.SCOPE_2,
    description: 'Energy purchased or acquired (electricity, heating, cooling, steam)',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q24: {
    key: 'q24',
    label: 'Energy Certificates',
    category: DQR_CATEGORIES.SCOPE_2,
    description: 'Renewable energy certificates and mechanisms',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q26: {
    key: 'q26',
    label: 'Supporting Documents',
    category: DQR_CATEGORIES.SCOPE_2,
    description: 'Supporting documentation for energy claims',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q27: {
    key: 'q27',
    label: 'Energy Intensity per Product',
    category: DQR_CATEGORIES.SCOPE_2,
    description: 'Energy intensity (kWh/kg) per product',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q28: {
    key: 'q28',
    label: 'Process-Specific Energy Usage',
    category: DQR_CATEGORIES.SCOPE_2,
    description: 'Process-specific energy consumption',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q30: {
    key: 'q30',
    label: 'Auxiliary Services Usage',
    category: DQR_CATEGORIES.SCOPE_2,
    description: 'Auxiliary services energy consumption',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q31: {
    key: 'q31',
    label: 'Treatment Support',
    category: DQR_CATEGORIES.SCOPE_2,
    description: 'Treatment support details',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q32: {
    key: 'q32',
    label: 'QC Equipment Usage',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Quality control equipment and operating hours',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q33: {
    key: 'q33',
    label: 'QC Energy Consumption',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Energy consumption for quality control',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q34: {
    key: 'q34',
    label: 'QC Process Usage',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Quality control process consumption',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q34_pressure: {
    key: 'q34_pressure',
    apiKey: 'q341',
    label: 'QC Pressure Flow',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Quality control pressure flow usage',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q35: {
    key: 'q35',
    label: 'QC Consumables',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Quality control consumables usage',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q37: {
    key: 'q37',
    label: 'Work Order Site Details',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Work order site component details',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q38: {
    key: 'q38',
    label: 'Defect Rate by QC',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Defect or rejection rate in quality control',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q39: {
    key: 'q39',
    label: 'Rework Rate by QC',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Rework or repair rate in quality control',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q40: {
    key: 'q40',
    label: 'QC Waste Generated',
    category: DQR_CATEGORIES.QUALITY_CONTROL,
    description: 'Types and weight of quality control waste',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q41: {
    key: 'q41',
    label: 'IT Automation',
    category: DQR_CATEGORIES.IT_PRODUCTION,
    description: 'IT automation tools used in production',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q44: {
    key: 'q44',
    label: 'IT Hardware Energy Consumption',
    category: DQR_CATEGORIES.IT_PRODUCTION,
    description: 'Energy consumption for IT hardware',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q46: {
    key: 'q46',
    label: 'Cloud Provider Details',
    category: DQR_CATEGORIES.IT_PRODUCTION,
    description: 'Cloud service provider usage details',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q47: {
    key: 'q47',
    label: 'Sensor Usage',
    category: DQR_CATEGORIES.IT_PRODUCTION,
    description: 'Data monitoring sensor usage',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q48: {
    key: 'q48',
    label: 'IT Consumables',
    category: DQR_CATEGORIES.IT_PRODUCTION,
    description: 'Consumables and software for IT',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q51: {
    key: 'q51',
    label: 'IT Cooling Energy Consumption',
    category: DQR_CATEGORIES.IT_PRODUCTION,
    description: 'Energy consumption for IT cooling',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q52: {
    key: 'q52',
    label: 'Raw Material Used in Component Manufacturing',
    category: DQR_CATEGORIES.MATERIAL,
    description: 'Raw materials percentage in component manufacturing',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q53: {
    key: 'q53',
    label: 'Treatment Support Information',
    category: DQR_CATEGORIES.SCOPE_3,
    description: 'Support treatment information from EnviGuide',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q54: {
    key: 'q54',
    label: 'Supporting Documents (Scope 3)',
    category: DQR_CATEGORIES.SCOPE_3,
    description: 'Supporting documentation for Scope 3',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q56: {
    key: 'q56',
    label: 'Raw Material with Percentage',
    category: DQR_CATEGORIES.MATERIAL,
    description: 'Raw material details with percentage',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q58: {
    key: 'q58',
    label: 'Pre/Post Consumer Recycled Percentage',
    category: DQR_CATEGORIES.PACKAGING,
    description: 'Pre-consumer and post-consumer recycled material percentage',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q59: {
    key: 'q59',
    label: 'PIR/PCR Material Percentage',
    category: DQR_CATEGORIES.PACKAGING,
    description: 'Post-industrial and post-consumer recycling percentage',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q60: {
    key: 'q60',
    label: 'Packaging Material Used',
    category: DQR_CATEGORIES.PACKAGING,
    description: 'Type and size of packaging materials',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q61: {
    key: 'q61',
    label: 'Packaging Weight',
    category: DQR_CATEGORIES.PACKAGING,
    description: 'Weight of packaging materials per component',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q64: {
    key: 'q64',
    label: 'EnviGuide Support (Packaging)',
    category: DQR_CATEGORIES.PACKAGING,
    description: 'Support information for packaging',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q67: {
    key: 'q67',
    label: 'Storage Energy Consumption',
    category: DQR_CATEGORIES.SCOPE_3,
    description: 'Energy consumption for storage',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q68: {
    key: 'q68',
    label: 'Production & Packaging Waste',
    category: DQR_CATEGORIES.SCOPE_3,
    description: 'Types and weight of production and packaging waste',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q69: {
    key: 'q69',
    label: 'EnviGuide Support (Waste)',
    category: DQR_CATEGORIES.SCOPE_3,
    description: 'Support information for waste disposal',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q71: {
    key: 'q71',
    label: 'By-Products',
    category: DQR_CATEGORIES.SCOPE_3,
    description: 'By-product details and economic value',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q73: {
    key: 'q73',
    label: 'Raw Material Transport CO2 Emissions',
    category: DQR_CATEGORIES.TRANSPORT,
    description: 'CO2 emissions from raw material transport',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q74: {
    key: 'q74',
    label: 'Transport Mode & Distance',
    category: DQR_CATEGORIES.TRANSPORT,
    description: 'Mode of transport and distance for finished products',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q75: {
    key: 'q75',
    label: 'Delivery Point Location',
    category: DQR_CATEGORIES.TRANSPORT,
    description: 'Delivery point country, state, city, and pincode',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q79: {
    key: 'q79',
    label: 'EnviGuide Support (Transport)',
    category: DQR_CATEGORIES.TRANSPORT,
    description: 'Support information for transport',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
  q80: {
    key: 'q80',
    label: 'EnviGuide Support (End)',
    category: DQR_CATEGORIES.OTHER,
    description: 'Final support information',
    dqiRequired: ['TeR', 'TiR', 'GR', 'C', 'PDS'],
  },
};

// Helper function to get question config by key
export function getQuestionConfig(key: string): DQRQuestionConfig | undefined {
  return DQR_QUESTIONS_CONFIG[key];
}

// Helper function to get API key for sending updates (returns apiKey if defined, otherwise returns key)
export function getApiKey(key: string): string {
  const config = DQR_QUESTIONS_CONFIG[key];
  return config?.apiKey || key;
}

// Helper function to get questions by category
export function getQuestionsByCategory(category: string): DQRQuestionConfig[] {
  return Object.values(DQR_QUESTIONS_CONFIG).filter(q => q.category === category);
}

// Helper function to get all categories with their questions
export function getCategorizedQuestions(): Record<string, DQRQuestionConfig[]> {
  const categorized: Record<string, DQRQuestionConfig[]> = {};

  Object.values(DQR_QUESTIONS_CONFIG).forEach(config => {
    if (!categorized[config.category]) {
      categorized[config.category] = [];
    }
    categorized[config.category].push(config);
  });

  return categorized;
}

// Helper function to parse the data field from API response
export function parseDataField(dataString: string): Record<string, any> {
  try {
    // Handle double-encoded JSON strings
    let parsed: any = dataString;

    // If it's a string starting with quotes, try to parse it first
    if (typeof parsed === 'string') {
      // Remove outer quotes if present
      if (parsed.startsWith('"') && parsed.endsWith('"')) {
        parsed = JSON.parse(parsed);
      }

      // If still a string, try parsing again
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
    }

    // Ensure we return an object
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return { value: parsed };
  } catch (error) {
    // If parsing fails, return as-is wrapped in an object
    return { value: dataString };
  }
}

// Helper function to format data point for display
export function formatDataPointDisplay(data: Record<string, any>): string {
  // Handle null/undefined
  if (!data) return '';

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    // Try to extract meaningful values from array
    const firstItem = data[0];
    if (typeof firstItem === 'string') {
      return firstItem;
    }
    if (typeof firstItem === 'object' && firstItem !== null) {
      return formatDataPointDisplay(firstItem);
    }
    return '';
  }

  // Handle simple value wrapper objects like {"value": "something"}
  if (data.value !== undefined && Object.keys(data).length <= 2) {
    const val = data.value;
    if (typeof val === 'string' && val.trim()) {
      // Clean up escaped quotes and whitespace
      return val.replace(/\\"/g, '"').replace(/^["']|["']$/g, '').trim();
    }
    if (typeof val === 'number') {
      return ''; // Don't show just numbers as titles
    }
  }

  // Try to create a meaningful display string from the data
  const displayParts: string[] = [];

  // Priority fields to show (expanded list)
  const priorityFields = [
    'product_name', 'component_name', 'material_name', 'fuel_type', 'fuel_type_name',
    'sub_fuel_type', 'sub_fuel_type_name', 'energy_source', 'energy_source_name',
    'energy_type', 'energy_type_name', 'waste_type', 'waste_type_name',
    'refrigerant_type', 'refrigerant_type_name', 'country_iso_three', 'country_name',
    'process_specific_energy_type', 'process_specific_energy_name', 'consumable_name',
    'equipment_name', 'cloud_provider_name', 'type_of_sensor', 'material_type',
    'raw_material_name', 'mode_of_transport', 'transport_mode', 'country', 'city',
    'name', 'title', 'description', 'type', 'label', 'methodology', 'location',
    'production_location', 'supplier_name', 'bom_id', 'material_number'
  ];

  for (const field of priorityFields) {
    if (data[field] && typeof data[field] === 'string' && data[field].trim()) {
      displayParts.push(String(data[field]).trim());
      break;
    }
  }

  // Add quantity/weight if available and we have a name
  if (displayParts.length > 0) {
    const quantityFields = ['quantity', 'weight', 'waste_weight', 'percentage', 'scope_one', 'energy_intensity'];
    for (const field of quantityFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const unit = data['unit'] || '';
        displayParts.push(`${data[field]} ${unit}`.trim());
        break;
      }
    }
  }

  // If we found meaningful data, return it
  if (displayParts.length > 0) {
    return displayParts.join(' - ');
  }

  // Last resort: try to find any string value that's not too long
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim() && val.length < 50 && !key.includes('id')) {
      return val.trim();
    }
  }

  // Return empty if nothing meaningful found
  return '';
}
