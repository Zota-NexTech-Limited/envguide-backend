import { FileText } from "lucide-react";

export interface ColumnMapping {
    header: string;
    key: string;
    filterKey?: string;
}

export interface ReportConfig {
    id: string;
    title: string;
    description: string;
    module: string;
    updatedAt: string;
    icon: any;
    iconColor: string;
    moduleColor: string;
    typeColor: string;
    type: string;
    endpoint: string;
    columns: ColumnMapping[];
}

export const reportsConfig: ReportConfig[] = [
    {
        id: "product-footprint",
        title: "Product Footprint",
        description: "Detailed carbon footprint analysis for all products including raw materials and production.",
        module: "Sustainability",
        type: "System",
        updatedAt: "Updated 2h ago",
        icon: FileText,
        iconColor: "text-blue-500 bg-blue-50",
        moduleColor: "text-green-600 bg-green-50",
        typeColor: "text-green-600 bg-green-50",
        endpoint: "/api/report/product-foot-print-list",
        columns: [
            { header: "SL.NO", key: "index" },
            { header: "Supplier ID/Code", key: "supplier_details.code", filterKey: "supplier_code" },
            { header: "Supplier name", key: "supplier_details.supplier_name", filterKey: "supplier_name" },
            { header: "Component or Parts Name", key: "component_name", filterKey: "component_name" },
            { header: "Manufacturer", key: "manufacturer", filterKey: "manufacturer" },
            { header: "Weight (gms) /unit", key: "weight_gms" },
            { header: "Total Weight (gms)", key: "total_weight_gms" },
            { header: "Component Category", key: "component_category", filterKey: "component_category" },
            { header: "Transport Mode", key: "transportation_details.mode_of_transport", filterKey: "mode_of_transport" },
            { header: "Economic Ratio", key: "economic_ratio" },
            { header: "Allocation Methodology", key: "allocation_methodology" },
            { header: "Raw Materials Emissions", key: "material_emission.material_emission" },
            { header: "Production Emissions", key: "production_emission_calculation.manufacturing_emission" },
            { header: "Packaging Emissions", key: "packaging_emissions" },
            { header: "Waste Emissions", key: "waste_emissions" },
            { header: "Transportation Emissions", key: "transportation_emissions" },
            { header: "PCF [kg CO2e / kg Material]", key: "pcf_value" },
        ]
    },
    {
        id: "supplier-footprint",
        title: "Supplier Footprint",
        description: "Emissions tracking across the supplier network and manufacturing regions.",
        module: "Emissions",
        type: "System",
        updatedAt: "Updated 5h ago",
        icon: FileText,
        iconColor: "text-purple-500 bg-purple-50",
        moduleColor: "text-orange-600 bg-orange-50",
        typeColor: "text-green-600 bg-green-50",
        endpoint: "/api/report/supplier-foot-print-list",
        columns: [
            { header: "SL. No.", key: "index" },
            { header: "Supplier ID/Code", key: "supplier_details.code", filterKey: "supplier_code" },
            { header: "Supplier Name", key: "supplier_details.supplier_name", filterKey: "supplier_name" },
            { header: "Manufacturing Region", key: "manufacturing_region", filterKey: "manufacturing_region" },
            { header: "Component / Part Supplied", key: "component_name", filterKey: "component_name" },
            { header: "Material Type", key: "material_type", filterKey: "material_type" },
            { header: "Energy Type Used in Manufacturing", key: "energy_type", filterKey: "energy_type" },
            { header: "Energy Quantity (kWh/kg)", key: "energy_quantity", filterKey: "energy_quantity" },
            { header: "Recycled Content (%)", key: "recycled_content" },
            { header: "Emission Factor", key: "emission_factor" },
            { header: "Supplier Emission", key: "supplier_emission" },
        ]
    },
    {
        id: "material-footprint",
        title: "Material Footprint",
        description: "Detailed product material breakdown and recyclability metrics.",
        module: "Sustainability",
        type: "System",
        updatedAt: "Updated 1d ago",
        icon: FileText,
        iconColor: "text-green-500 bg-green-50",
        moduleColor: "text-green-600 bg-green-50",
        typeColor: "text-green-600 bg-green-50",
        endpoint: "/api/report/material-foot-print-list",
        columns: [
            { header: "SL.No", key: "index" },
            { header: "Supplier ID/Code", key: "supplier_details.code", filterKey: "supplier_code" },
            { header: "Supplier Name", key: "supplier_details.supplier_name", filterKey: "supplier_name" },
            { header: "Material", key: "material", filterKey: "material" },
            { header: "Application in Product", key: "application" },
            { header: "Recyclability (%)", key: "recyclability_percentage" },
            { header: "Weight in kg", key: "weight_kg" },
            { header: "Emission Factor (kg CO₂e/kg material)", key: "emission_factor" },
            { header: "Emission in CO2 eq", key: "emission_co2" }
        ]
    },
    {
        id: "electricity-footprint",
        title: "Electricity Footprint",
        description: "Energy consumption and electricity source emissions categories.",
        module: "Emissions",
        type: "System",
        updatedAt: "Updated 3h ago",
        icon: FileText,
        iconColor: "text-indigo-500 bg-indigo-50",
        moduleColor: "text-orange-600 bg-orange-50",
        typeColor: "text-green-600 bg-green-50",
        endpoint: "/api/report/electricity-foot-print-list",
        columns: [
            { header: "Sl.No", key: "index" },
            { header: "Supplier ID/Code", key: "supplier_details.code", filterKey: "supplier_code" },
            { header: "Supplier Name", key: "supplier_details.supplier_name", filterKey: "supplier_name" },
            { header: "Electricity Source", key: "electricity_source" },
            { header: "Energy Type", key: "energy_type", filterKey: "energy_type" },
            { header: "Emission Factor (kg CO₂e/kWh)", key: "emission_factor" },
            { header: "Emission", key: "emission" }
        ]
    },
    {
        id: "transportation-footprint",
        title: "Transportation Footprint",
        description: "Logistics emissions categorized by transport modes and distances.",
        module: "Emissions",
        type: "System",
        updatedAt: "Updated 6h ago",
        icon: FileText,
        iconColor: "text-teal-500 bg-teal-50",
        moduleColor: "text-orange-600 bg-orange-50",
        typeColor: "text-green-600 bg-green-50",
        endpoint: "/api/report/transporation-foot-print-list",
        columns: [
            { header: "Sl. No", key: "index" },
            { header: "Supplier ID/Code", key: "supplier_details.code", filterKey: "supplier_code" },
            { header: "Supplier Name", key: "supplier_details.supplier_name", filterKey: "supplier_name" },
            { header: "Mode / Category", key: "transport_mode", filterKey: "mode_of_transport" },
            { header: "Fuel / Energy Source", key: "energy_source" },
            { header: "Emission Factor (kg CO₂e / tonne·km)", key: "emission_factor" },
            { header: "Weight Goods in (tons)", key: "weight_tons" },
            { header: "Distance (km)", key: "distance_km" },
            { header: "Total Emission (kg CO₂e / tonne)", key: "total_emission" }
        ]
    },
    {
        id: "packaging-footprint",
        title: "Packaging Footprint",
        description: "Packaging material types and their contribution to total emissions.",
        module: "Emissions",
        type: "System",
        updatedAt: "Updated 4h ago",
        icon: FileText,
        iconColor: "text-amber-500 bg-amber-50",
        moduleColor: "text-orange-600 bg-orange-50",
        typeColor: "text-green-600 bg-green-50",
        endpoint: "/api/report/packaging-foot-print-list",
        columns: [
            { header: "Sl. No", key: "index" },
            { header: "Supplier ID/Code", key: "supplier_details.code", filterKey: "supplier_code" },
            { header: "Supplier Name", key: "supplier_details.supplier_name", filterKey: "supplier_name" },
            { header: "Packaging Material / Type", key: "Q60_packaging_material.packagin_type", filterKey: "packagin_type" },
            { header: "Type of energy used", key: "Q67_energy_type_and_energy_quantity.energy_type", filterKey: "energy_type" },
            { header: "Recyclability (%)", key: "recyclability_percentage" },
            { header: "Emission Factor (kg CO₂e / kg)", key: "emission_factor" },
            { header: "Emission @ 0.25 kg (kg CO₂e)", key: "emission_0_25" },
            { header: "Emission @ 0.5 kg (kg CO₂e)", key: "emission_0_5" },
        ]
    },
    {
        id: "dqr-rating",
        title: "DQR Rating",
        description: "Comprehensive data quality validation and transparency metrics.",
        module: "Quality",
        type: "System",
        updatedAt: "Updated 1h ago",
        icon: FileText,
        iconColor: "text-rose-500 bg-rose-50",
        moduleColor: "text-blue-600 bg-blue-50",
        typeColor: "text-green-600 bg-green-50",
        endpoint: "/api/report/supplier-dqr-rating-report",
        columns: [
            { header: "Sl. No", key: "index" },
            { header: "Supplier ID/Code", key: "supplier_details.code" },
            { header: "Supplier Name", key: "supplier_details.supplier_name" },
            { header: "Data Source / Supplier", key: "data_source" },
            { header: "Data Type", key: "data_type" },
            { header: "Technological Representativeness (TeR)", key: "ter" },
            { header: "Geographical Representativeness (GR)", key: "gr" },
            { header: "Temporal Representativeness (TiR)", key: "tir" },
            { header: "Completeness (C)", key: "completeness" },
            { header: "Reliability (R)", key: "reliability" },
            { header: "Average DQR Score", key: "average_dqr" },
            { header: "Data Quality Level (Catena-X)", key: "quality_level" }
        ]
    },
];
