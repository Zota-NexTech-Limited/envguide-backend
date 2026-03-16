import type { SetupEntity } from "../lib/dataSetupService";
import type { MasterDataEntity } from "../lib/masterDataSetupService";
import type { EcoInventEntity } from "../lib/ecoInventService";

// ============================================================================
// DATA SETUP GROUPS - Uses /api/data-setup/... with {code, name, description}
// ============================================================================

export interface DataSetupGroup {
  key: string;
  title: string;
  description: string;
  tabs: {
    key: string;
    label: string;
    entity: SetupEntity;
  }[];
}

export const dataSetupGroups: DataSetupGroup[] = [
  {
    key: "manufacturing",
    title: "Manufacturing Configuration",
    description: "Configure manufacturing processes and stages",
    tabs: [
      {
        key: "manufacturing-process",
        label: "Manufacturing Process",
        entity: "manufacturing-process",
      },
      {
        key: "life-cycle-stage",
        label: "Life Cycle Stage",
        entity: "life-cycle-stage",
      },
    ],
  },
  {
    key: "organization",
    title: "Organization Configuration",
    description: "Configure organizational entities and tags",
    tabs: [
      {
        key: "industry",
        label: "Industry",
        entity: "industry",
      },
      {
        key: "manufacturer",
        label: "Manufacturer",
        entity: "manufacturer",
      },
      {
        key: "category",
        label: "Category",
        entity: "category",
      },
      {
        key: "tag",
        label: "Tag",
        entity: "tag",
      },
    ],
  },
];

// ============================================================================
// MASTER DATA SETUP GROUPS - Uses /api/master-data-setup/... with {name} only
// ============================================================================

export interface MasterDataSetupGroup {
  key: string;
  title: string;
  description: string;
  tabs: {
    key: string;
    label: string;
    entity: MasterDataEntity;
  }[];
}

export const masterDataSetupGroups: MasterDataSetupGroup[] = [
  {
    key: "materials",
    title: "Materials Configuration",
    description: "Configure material compositions",
    tabs: [
      {
        key: "material-composition-metal",
        label: "Composition Metal",
        entity: "material-composition-metal",
      },
      {
        key: "material-composition-metal-type",
        label: "Composition Metal Type",
        entity: "material-composition-metal-type",
      },
    ],
  },
  {
    key: "energy",
    title: "Energy Configuration",
    description: "Configure energy sources, types, and fuels",
    tabs: [
      {
        key: "energy-source",
        label: "Energy Source",
        entity: "energy-source",
      },
      {
        key: "energy-type",
        label: "Energy Type",
        entity: "energy-type",
      },
      {
        key: "energy-unit",
        label: "Energy Unit",
        entity: "energy-unit",
      },
      {
        key: "scope-two-method",
        label: "Scope Two Method",
        entity: "scope-two-method",
      },
      {
        key: "fuel-type",
        label: "Fuel Type",
        entity: "fuel-type",
      },
      {
        key: "sub-fuel-type",
        label: "Sub Fuel Type",
        entity: "sub-fuel-type",
      },
      {
        key: "refrigerent-type",
        label: "Refrigerant Type",
        entity: "refrigerent-type",
      },
    ],
  },
  {
    key: "transport",
    title: "Transport Configuration",
    description: "Configure transport modes, routes, and vehicles",
    tabs: [
      {
        key: "transport-modes",
        label: "Transport Modes",
        entity: "transport-modes",
      },
      {
        key: "transport-routes",
        label: "Transport Routes",
        entity: "transport-routes",
      },
      {
        key: "vehicle-type",
        label: "Vehicle Type",
        entity: "vehicle-type",
      },
    ],
  },
  {
    key: "water-waste",
    title: "Water & Waste Configuration",
    description: "Configure water sources, treatment, and waste management",
    tabs: [
      {
        key: "water-source",
        label: "Water Source",
        entity: "water-source",
      },
      {
        key: "water-treatment",
        label: "Water Treatment",
        entity: "water-treatment",
      },
      {
        key: "water-unit",
        label: "Water Unit",
        entity: "water-unit",
      },
      {
        key: "waste-treatment",
        label: "Waste Treatment",
        entity: "waste-treatment",
      },
      {
        key: "discharge-destination",
        label: "Discharge Destination",
        entity: "discharge-destination",
      },
    ],
  },
  {
    key: "units",
    title: "Units Configuration",
    description: "Configure measurement units for various types",
    tabs: [
      {
        key: "product-unit",
        label: "Product Unit",
        entity: "product-unit",
      },
      {
        key: "gaseous-fuel-unit",
        label: "Gaseous Fuel Unit",
        entity: "gaseous-fuel-unit",
      },
      {
        key: "liquid-fuel-unit",
        label: "Liquid Fuel Unit",
        entity: "liquid-fuel-unit",
      },
      {
        key: "solid-fuel-unit",
        label: "Solid Fuel Unit",
        entity: "solid-fuel-unit",
      },
      {
        key: "ef-unit",
        label: "EF Unit",
        entity: "ef-unit",
      },
      {
        key: "qc-equipment",
        label: "QC Equipment Unit",
        entity: "qc-equipment",
      },
      {
        key: "packing-unit",
        label: "Packing Unit",
        entity: "packing-unit",
      },
    ],
  },
  {
    key: "standards",
    title: "Standards & Compliance",
    description: "Configure reporting standards, certificates, and verification",
    tabs: [
      {
        key: "reporting-standard",
        label: "Reporting Standard",
        entity: "reporting-standard",
      },
      {
        key: "certificate-type",
        label: "Certificate Type",
        entity: "certificate-type",
      },
      {
        key: "verification-status",
        label: "Verification Status",
        entity: "verification-status",
      },
      {
        key: "credit-method",
        label: "Credit Method",
        entity: "credit-method",
      },
    ],
  },
  {
    key: "lifecycle",
    title: "Life Cycle & Methodology",
    description: "Configure life cycle stages, boundaries, and methodologies",
    tabs: [
      {
        key: "life-cycle-stage",
        label: "Life Cycle Stage",
        entity: "life-cycle-stage",
      },
      {
        key: "life-cycle-boundary",
        label: "Life Cycle Boundary",
        entity: "life-cycle-boundary",
      },
      {
        key: "allocation-method",
        label: "Allocation Method",
        entity: "allocation-method",
      },
      {
        key: "method-type",
        label: "Method Type",
        entity: "method-type",
      },
      {
        key: "packaging-level",
        label: "Packaging Level",
        entity: "packaging-level",
      },
      {
        key: "process-specific-energy",
        label: "Process Specific Energy",
        entity: "process-specific-energy",
      },
    ],
  },
  {
    key: "geography",
    title: "Geography & Time",
    description: "Configure country codes and time zones",
    tabs: [
      {
        key: "country-iso-two",
        label: "Country ISO Two",
        entity: "country-iso-two",
      },
      {
        key: "country-iso-three",
        label: "Country ISO Three",
        entity: "country-iso-three",
      },
      {
        key: "time-zone",
        label: "Time Zone",
        entity: "time-zone",
      },
    ],
  },
  {
    key: "organization",
    title: "Organization Configuration",
    description: "Configure supplier tiers",
    tabs: [
      {
        key: "supplier-tier",
        label: "Supplier Tier",
        entity: "supplier-tier",
      },
    ],
  },
];

// ============================================================================
// ECOINVENT EMISSION FACTOR GROUPS - Uses /api/ecoinvent-emission-factor-data-setup/...
// ============================================================================

export interface EcoInventSetupGroup {
  key: string;
  title: string;
  description: string;
  tabs: {
    key: string;
    label: string;
    entity: EcoInventEntity;
  }[];
}

export const ecoInventSetupGroups: EcoInventSetupGroup[] = [
  {
    key: "materials-ef",
    title: "Materials Emission Factors",
    description: "Configure emission factors for various materials",
    tabs: [
      {
        key: "materials-emission-factor",
        label: "Materials",
        entity: "materials-emission-factor",
      },
    ],
  },
  {
    key: "electricity-ef",
    title: "Electricity Emission Factors",
    description: "Configure emission factors for electricity sources",
    tabs: [
      {
        key: "electricity-emission-factor",
        label: "Electricity",
        entity: "electricity-emission-factor",
      },
    ],
  },
  {
    key: "fuel-ef",
    title: "Fuel Emission Factors",
    description: "Configure emission factors for fuel types",
    tabs: [
      {
        key: "fuel-emission-factor",
        label: "Fuel",
        entity: "fuel-emission-factor",
      },
    ],
  },
  {
    key: "packaging-ef",
    title: "Packaging Emission Factors",
    description: "Configure emission factors for packaging",
    tabs: [
      {
        key: "packaging-emission-factor",
        label: "Packaging EF",
        entity: "packaging-emission-factor",
      },
      {
        key: "packaging-treatment-type",
        label: "Treatment Type",
        entity: "packaging-treatment-type",
      },
    ],
  },
  {
    key: "vehicle-ef",
    title: "Vehicle Emission Factors",
    description: "Configure emission factors for vehicle types",
    tabs: [
      {
        key: "vehicle-type-emission-factor",
        label: "Vehicle Types",
        entity: "vehicle-type-emission-factor",
      },
    ],
  },
  {
    key: "waste-ef",
    title: "Waste Emission Factors",
    description: "Configure emission factors for waste materials and treatment",
    tabs: [
      {
        key: "waste-material-type-emission-factor",
        label: "Waste Materials",
        entity: "waste-material-type-emission-factor",
      },
      {
        key: "waste-treatment-type",
        label: "Treatment Types",
        entity: "waste-treatment-type",
      },
    ],
  },
];

// ============================================================================
// SINGLE ENTITY PAGES (kept for backward compatibility, but mostly empty now)
// ============================================================================

export const singleEntityPages: Array<{
  key: string;
  title: string;
  description: string;
  entity: SetupEntity;
  path: string;
}> = [];
