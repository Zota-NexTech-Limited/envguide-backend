/**
 * Centralized configuration for questionnaire and Data Quality Rating (DQR) settings
 */

// Questionnaire Options
export const QUESTIONNAIRE_OPTIONS = {
  CORE_BUSINESS_ACTIVITIES: [
    "Tier-1 Manufacturing",
    "Tier-2 Component Manufacturing",
    "Tier-3 Raw Material Supply",
    "Electronics Manufacturing",
    "Mechanical / Metal Manufacturing",
    "Plastics / Polymer Manufacturing",
    "Assembly & Integration",
    "Logistics & Warehousing",
    "Surface Treatment / Plating / Coating",
    "Chemical / Resin Production",
    "Battery / Energy Storage Production",
    "Recycling / Waste Treatment / Food Processing",
    "Power Generation Sector",
    "Construction & Real Estate",
    "Shipping Industry",
    "Pharmaceuticals Manufacturing",
    "Logistics & Transportation",
    "Technology Development & Services (IT)",
    "Others",
  ],
  NUMBER_OF_EMPLOYEES: [
    "1–100",
    "101–500",
    "501–1000",
    "1001–2000",
    "2001–3000",
    "3001–5000",
    "5001–7000",
    "7001–10,000",
    "> 10,000",
    "Other (Specify the exact number)",
  ],
  ANNUAL_REVENUE: [
    "≤ $1M",
    "$1M–$2M",
    "$2M–$3M",
    "$3M–$4M",
    "$4M–$5M",
    "> $5M",
    "Other (Specify the exact amount)",
  ],
  // Generate years 2020-2050
  ANNUAL_REPORTING_PERIOD: Array.from({ length: 31 }, (_, i) => (2020 + i).toString()),
  
  REQUIRED_ENVIRONMENTAL_IMPACT_METHODS: [
    "Product Carbon Footprint (PCF)",
    "Water Footprint",
    "Land Use Impact",
    "Full LCA (all categories)",
    "Human Toxicity",
    "Ecotoxicity",
    "Acidification",
    "Eutrophication",
    "Ozone Depletion",
    "Particulate Matter Formation",
    "Resource Depletion – Fossil Fuels",
    "Resource Depletion – Minerals & Metals",
    "Other (Add Custom Method)",
  ],

  FUEL_TYPES: [
    "Oil Products",
    "Coal Products",
    "Natural Gas",
    "Other Wastes",
    "Biomass",
  ],

  FUEL_SUB_TYPES: {
    "Oil Products": [
      "Crude oil",
      "Natural Gas Liquids",
      "Motor gasoline / Petrol",
      "Jet gasoline",
      "Diesel fuel",
      "Residual fuel oil",
      "Liquefied Petroleum Gases (LPG)",
      "Ethane",
      "Refinery gas",
      "Other petroleum products",
    ],
    "Coal Products": [
      "Anthracite",
      "Coking coal",
      "Sub-bituminous coal",
      "Lignite",
      "Oil shale and tar sands",
      "Brown coal briquettes",
      "Lignite coke",
      "Blast furnace gas",
      "Oxygen steel furnace gas",
    ],
    "Natural Gas": ["Compressed Natural Gas (CNG)"],
    "Other Wastes": [
      "Municipal waste (non-biomass fraction)",
      "Industrial wastes",
      "Waste oils",
    ],
    "Biomass": [
      "Wood or wood waste",
      "Other primary solid biomass fuels",
      "Charcoal",
      "Bio gasoline",
      "Bio diesels",
      "Municipal wastes (biomass fraction)",
    ],
  },

  VEHICLE_FUEL_TYPES: [
    "Petrol",
    "Diesel",
    "LPG",
    "CNG",
    "LNG",
    "Electric / Hydrogen",
    "Ethanol blends",
  ],

  RE_PROCUREMENT_MECHANISMS: [
    "Onsite generation (EACs generated)",
    "Onsite generation (No EACs generated)",
    "Off-site generation: PPA / sleeved PPA (proof of delivery required)",
    "Off-site generation: Virtual PPA (proof via EAC required)",
    "Off-site generation: Green power tariff / green power product",
    "Utility-supplied renewable electricity (provider procures and retires bundled or unbundled EACs)",
    "Unbundled EACs",
    "Unbundled RECs / I-RECs",
  ],

  IT_SYSTEMS: [
    "PLCs",
    "SCADA",
    "MES",
    "ERP",
    "Automation controllers",
    "IoT sensors",
    "Others",
  ],

  RAW_MATERIALS: [
    "Aluminum",
    "Steel",
    "Copper",
    "ABS – Acrylonitrile Butadiene Styrene",
    "PP – Polypropylene",
    "PVC – Polyvinyl Chloride",
    "Rubber",
    "Composite",
    "Others",
  ],

  TRANSPORT_MODES: [
    "Road / Truck",
    "Rail",
    "Ship",
    "Air Freight",
  ],

  PROCESS_SPECIFIC_ENERGY_USAGE: [
    "Compressed Air",
    "Chillers / Cooling Towers",
    "Boilers / Steam Systems",
    "HVAC",
    "Lighting",
    "Motors / Drives",
    "Process Heating",
    "Refrigeration",
    "Others",
  ],

  WASTE_TYPES: [
    "Scrap metal",
    "Plastic scrap",
    "PCB",
    "Solvents",
    "Plastic",
    "Sludge",
    "Packaging waste",
    "Others",
  ],

  WASTE_TREATMENT_TYPES: [
    "Landfill",
    "Incineration",
    "Recycling",
    "Composting",
    "Reuse",
    "Others",
  ],

  ENERGY_UNITS: [
    "kWh",
    "MWh",
    "MJ",
    "GJ",
    "BTU",
  ],

  WEIGHT_UNITS: [
    "kg",
    "g",
    "mg",
    "Tons",
    "lbs",
  ],

  VOLUME_UNITS: [
    "liters",
    "m³",
    "gallons",
    "ml",
  ],

  REFRIGERANT_UNITS: [
    "kg",
    "g",
    "lbs",
  ],
};

// Data Quality Rating Configuration
export const DQR_CONFIG = {
  // Technological Representativeness (TeR) - Level 2 Options
  TER_LEVEL2_OPTIONS: [
    "Site specific technology",
    "Similar process technology",
    "Industry average technology",
    "Proxy process",
    "Mismatch",
  ],

  // Temporal Representativeness (TiR) - Level 1 Options
  TIR_LEVEL1_OPTIONS: ["Applicable", "Derived", "Not Applicable"],

  // Temporal Representativeness (TiR) - Level 2 Options
  TIR_LEVEL2_OPTIONS: [
    "Data Period < 1 Year",
    "1Y < Data Period < 3Y",
    "3Y < Data Period < 5Y",
    "5Y < Data Period < 10Y",
    "Data Period > 10 Year",
  ],

  // Geographical Representativeness (GR) - Level 2 Options
  GR_LEVEL2_OPTIONS: [
    "Site Specific",
    "Country Specific",
    "Regional",
    "Global",
    "Mismatch",
  ],

  // Primary Data Share (PDS) Options
  PDS_OPTIONS: ["Primary", "Secondary", "Proxy"],

  // Completeness (C) Options
  C_OPTIONS: ["Required", "Optional"],
};

