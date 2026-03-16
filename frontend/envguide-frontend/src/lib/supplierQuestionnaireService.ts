/**
 * Service for Supplier Questionnaire and Data Quality Rating API Integration
 */

import authService from "./authService";
import { getApiKey } from "../config/dqrQuestionsConfig";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

// Response types
interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  code: number;
  data?: T;
  success?: boolean;
}

// UI Data Structure (CamelCase, Nested)
export interface SupplierQuestionnaireData {
  sgiq_id?: string;
  general_information: {
    gdpr_acknowledgement: boolean;
    re_technologies_acknowledgement: boolean;
    re_procurement_acknowledgement: boolean;
    double_counting_acknowledgement: boolean;
  };
  organization_details: {
    organization_name: string;
    core_business_activities: string;
    core_business_activities_other?: string;
    designation: string;
    email_address: string;
    number_of_employees: string;
    annual_revenue: string;
    annual_reporting_period: string;
    availability_of_emissions_data: boolean;
    emission_data?: {
      country: string;
      scope_1: number;
      scope_2: number;
      scope_3: number;
    }[];
  };
  product_details: {
    existing_pcf_report: boolean;
    pcf_methodology?: string[];
    pcf_report_file?: string[];
    production_site_details: {
      bom_id?: string;
      mpn?: string;
      material_number?: string;
      product_name?: string;
      component_name?: string;
      location: string;
    }[];
    required_environmental_impact_methods: string[];
    products_manufactured: {
      bom_id?: string;
      mpn?: string;
      material_number?: string;
      product_name: string;
      production_period: string;
      weight_per_unit: number;
      unit: string;
      price: number;
      quantity: number;
    }[];
    any_co_product_have_economic_value?: boolean;
    co_products?: {
        bom_id?: string;
        material_number?: string;
        product_name: string;
        co_product_name: string;
        weight: number;
        price_per_product: number;
        quantity: number;
    }[];
  };
  scope_1: {
    stationary_combustion: {
      fuel_type: string;
      sub_fuel_type?: { // Changed structure to match UI/API better if needed, but keeping UI structure for now
          sub_fuel_type: string;
          consumption_quantity: number;
          unit: string;
      }[];
    }[];
    mobile_combustion: {
      fuel_type: string;
      quantity: number;
      unit: string; // Added
    }[];
    fugitive_emissions: {
      refrigerant_top_ups: boolean;
      refrigerants?: {
        type: string;
        quantity: number;
        unit: string;
      }[];
    };
    process_emissions: {
      present: boolean;
      sources?: {
        source: string;
        gas_type: string;
        quantity: number;
        unit: string;
      }[];
    };
  };
  scope_2: {
    purchased_energy: {
      energy_source: string;
      energy_type: string;
      quantity: number;
      unit: string;
    }[];
    standardized_re_certificates: boolean;
    certificates?: {
      name: string;
      procurement_mechanism: string;
      serial_id: string;
      generator_id: string;
      generator_name: string;
      generator_location: string;
      date_of_generation: any; // Can be dayjs, Date, string, or timestamp
      issuance_date: any; // Can be dayjs, Date, string, or timestamp
    }[];
    manufacturing_process_specific_energy: {
      allocation_methodology: boolean;
      methodology_document?: string[];
      energy_intensity_estimated: boolean; // Added
      energy_intensity: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        product_name: string;
        energy_intensity: number;
        unit: string;
      }[];
      process_specific_usage_enabled?: boolean; // Added
      process_energy_usage?: {
        bom_id?: string;
        material_number?: string;
        process_type: string;
        energy_source?: string;
        energy_source_name?: string; // Store display name for combining
        energy_type?: string;
        energy_type_name?: string; // Store display name for combining
        quantity: number;
        unit: string;
        support_from_enviguide?: boolean;
      }[];
      abatement_systems: boolean;
      abatement_energy_consumption?: {
        source: string;
        quantity: number;
        unit: string;
      }[];
      water_consumption_details?: string;
    };
    water_consumption?: string;
    quality_control: {
      equipment: {
        equipment_name: string;
        quantity: number;
        unit: string;
        operating_hours: number;
      }[];
      electricity_consumption: {
        energy_type: string;
        quantity: number;
        unit: string;
        period: string;
      }[];
      utilities: {
        name: string;
        quantity: number;
        unit: string;
        period: string;
      }[];
      utilities_pressure_flow: {
          name: string;
          quantity: number;
          unit: string;
          period: string;
      }[];
      consumables: {
        consumable_name: string;
        mass: number;
        unit: string;
        period: string;
      }[];
      destructive_testing: boolean;
      destructive_testing_details?: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        component_name: string;
        weight: number;
        unit: string;
        period: string;
      }[];
      defect_rate: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        component_name: string;
        percentage: number;
      }[];
      rework_rate: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        component_name: string;
        processes_involved: string;
        percentage: number;
      }[];
      waste: {
        bom_id?: string;
        mpn?: string;
        component_name?: string;
        waste_type: string;
        weight: number;
        unit: string;
        treatment_type: string;
      }[];
    };
    it_for_production: {
      systems_used: string[];
      hardware_energy_consumption_tracked?: boolean;
      hardware_energy_included?: boolean;
      hardware_energy_consumption?: {
        energy_source: string;
        energy_type: string;
        quantity: number;
        unit: string;
      }[];
      cloud_systems?: boolean;
      cloud_usage?: {
          provider_name: string;
          virtual_machines: number;
          data_storage: number;
          data_transfer: number;
      }[];
      sensors?: {
          type: string;
          quantity: number;
          energy_consumption: number;
          unit: string;
      }[];
      sensor_replacement?: {
          consumable_name: string;
          quantity: number;
          unit: string;
      }[];
      cooling_systems?: boolean;
      cooling_energy_included?: boolean;
      cooling_energy_consumption?: {
          energy_source: string;
          energy_type: string;
          quantity: number;
          unit: string;
      }[];
    };
  };
  scope_3: {
    materials: {
      raw_materials: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        material: string;
        composition_percent: number;
      }[];
      raw_materials_contact_support?: boolean;
      metal_grade: string;
      msds?: string[] | string;
      recycled_materials_used: boolean;
      recycled_materials_details?: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        material_type: string;
        recycled_percent: number;
      }[];
      estimate_pre_post_consumer?: boolean;
      material_type_percentages?: {
        type: string;
        percentage: number;
      }[];
      pir_pcr_materials?: {
        material_type: string;
        recycled_composition: number;
      }[];
    };
    packaging: {
      materials_used?: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        component_name: string;
        packaging_type: string;
        packing_size: string;
        unit: string;
        treatment_type?: string;
      }[];
      weight_per_unit?: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        component_name: string;
        weight: number;
        unit: string;
      }[];
      size?: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        component_name: string;
        size: number;
        unit: string;
      }[];
      recycled_content_used?: boolean;
      recycled_percent?: number;
      electricity_used?: boolean;
      energy_included?: boolean;
      energy_consumption?: {
        energy_source: string;
        energy_type: string;
        quantity: number;
        unit: string;
      }[];
    };
    waste_disposal: {
      types_and_weight?: {
        waste_type: string;
        weight: number;
        unit: string;
        treatment_type: string;
      }[];
      recycled_percent?: number | string;
      by_products_generated?: boolean;
      by_product_details?: {
        bom_id?: string;
        material_number?: string;
        mpn?: string;
        component_name: string;
        by_product: string;
        price: number;
        quantity: number;
      }[];
    };
    logistics: {
      emissions_tracked: boolean;
      estimated_emissions?: {
        mpn?: string;
        component_name?: string;
        raw_material: string;
        weight?: number;
        transport_mode: string;
        source: string;
        source_lat?: string;
        source_long?: string;
        destination: string;
        destination_lat?: string;
        destination_long?: string;
        co2e: number;
      }[];
      transport_modes?: {
        mpn?: string;
        component_name?: string;
        mode: string;
        weight?: number;
        source: string;
        destination: string;
        distance: number;
      }[];
      enviguide_support?: boolean;
      destination_plant?: {
        country: string;
        state: string;
        city: string;
        pin_code: string;
      }[];
    };
    certifications: {
      iso_certified: boolean;
      standards_followed: boolean;
      reporting_frameworks: boolean;
      additional_notes: {
        reduction_measures: string;
        initiatives: string;
        strategies: string;
      };
    };
  };
  scope_4: {
    products_reducing_customer_emissions: string;
    circular_economy_practices: string;
    offset_projects: string;
  };
}

/**
 * Resolve bom_id for rows that only have mpn/material_number/component_name populated in the UI.
 * The UI often has the MPN dropdown but doesn't persist bom_id on the row object; we derive it from
 * `product_details.products_manufactured` / `product_details.production_site_details`.
 */
function resolveComponentRefFromMpnOrName(
  data: SupplierQuestionnaireData,
  row: { bom_id?: string; mpn?: string; material_number?: string; component_name?: string; product_name?: string }
): { bom_id?: string; material_number?: string; mpn?: string; component_name?: string; product_name?: string } | undefined {
  if (row?.bom_id) return { bom_id: row.bom_id };

  const mpn = (row?.mpn || row?.material_number || "").trim();
  const name = (row?.component_name || row?.product_name || "").trim();

  const candidates: Array<{ bom_id?: string; mpn?: string; material_number?: string; product_name?: string; component_name?: string }> = [
    ...(data?.product_details?.products_manufactured || []),
    ...(data?.product_details?.production_site_details || [])
  ];

  if (!candidates.length) return undefined;

  if (mpn) {
    const foundByMpn = candidates.find(c => (c?.mpn || c?.material_number || "").trim() === mpn);
    if (foundByMpn?.bom_id) return foundByMpn;
  }

  if (name) {
    const foundByName = candidates.find(c => (c?.component_name || c?.product_name || "").trim() === name);
    if (foundByName?.bom_id) return foundByName;
  }

  return undefined;
}

// API Payload Structure (Snake_case, Flat/Nested as per Postman)
interface SupplierQuestionnaireApiPayload {
    supplier_general_info_questions: {
        // bom_id: string; // These might be injected by backend or context
        // bom_pcf_id: string;
        // sup_id: string;
        ere_acknowledge: boolean;
        repm_acknowledge: boolean;
        dc_acknowledge: boolean;
        organization_name: string;
        core_business_activitiy: string;
        specify_other_activity: string | null;
        designation: string;
        email_address: string;
        no_of_employees: string;
        specify_other_no_of_employees: string | null;
        annual_revenue: string;
        specify_other_annual_revenue: string | null;
        annual_reporting_period: string;
        availability_of_scope_one_two_three_emissions_data: boolean;
        availability_of_scope_one_two_three_emissions_questions: {
            country_iso_three: string;
            scope_one: number;
            scope_two: number;
            scope_three: number;
        }[];
    };
    supplier_product_questions: {
        do_you_have_an_existing_pcf_report: boolean;
        pcf_methodology_used: string[];
        upload_pcf_report: string[];
        production_site_details_questions: {
            mpn?: string;
            product_name: string;
            location: string;
        }[];
        required_environmental_impact_methods: string[];
        product_component_manufactured_questions: {
            mpn?: string;
            product_name: string;
            production_period: string;
            weight_per_unit: number;
            unit: string;
            price: number;
            quantity: number;
        }[];
        any_co_product_have_economic_value: boolean;
        co_product_component_economic_value_questions: {
            bom_id?: string;
            material_number?: string;
            product_name: string;
            co_product_name: string;
            weight: number;
            price_per_product: number;
            quantity: number;
        }[];
    };
    scope_one_direct_emissions_questions: {
        stationary_combustion_on_site_energy_use_questions: {
            fuel_type: string;
            scoseu_sub_fuel_type_questions: {
                sub_fuel_type: string;
                consumption_quantity: number;
                unit: string;
            }[];
        }[];
        mobile_combustion_company_owned_vehicles_questions: {
            fuel_type: string;
            quantity: number;
            unit: string;
        }[];
        refrigerant_top_ups_performed: boolean;
        refrigerants_questions: {
            refrigerant_type: string;
            quantity: number;
            unit: string;
        }[];
        industrial_process_emissions_present: boolean;
        process_emissions_sources_questions: {
            source: string;
            gas_type: string;
            quantity: number;
            unit: string;
        }[];
    };
    scope_two_indirect_emissions_questions: {
        scope_two_indirect_emissions_from_purchased_energy_questions: {
            energy_source: string;
            energy_type: string;
            quantity: number;
            unit: string;
        }[];
        do_you_acquired_standardized_re_certificates: boolean;
        scope_two_indirect_emissions_certificates_questions: {
            certificate_name: string;
            mechanism: string;
            serial_id: string;
            generator_id: string;
            generator_name: string;
            generator_location: string;
            date_of_generation: string | null;
            issuance_date: string | null;
        }[];
        methodology_to_allocate_factory_energy_to_product_level: boolean;
        methodology_details_document_url: string[];
        energy_intensity_of_production_estimated_kwhor_mj: boolean;
        energy_intensity_of_production_estimated_kwhor_mj_questions: {
            product_name: string;
            energy_intensity: number;
            unit: string;
        }[];
        process_specific_energy_usage: boolean;
        process_specific_energy_usage_questions: {
            process_specific_energy_type: string;
            quantity_consumed: number;
            unit: string;
            support_from_enviguide: boolean;
        }[];
        do_you_use_any_abatement_systems: boolean;
        abatement_systems_used_questions: {
            source: string;
            quantity: number;
            unit: string;
        }[];
        water_consumption_and_treatment_details: string;
        type_of_quality_control_equipment_usage_questions: {
            equipment_name: string;
            quantity: number;
            unit: string;
            avg_operating_hours_per_month: string;
        }[];
        electricity_consumed_for_quality_control_questions: {
            energy_type: string;
            quantity: number;
            unit: string;
            period: string;
        }[];
        quality_control_process_usage_questions: {
            process_name: string;
            quantity: number;
            unit: string;
            period: string;
        }[];
        quality_control_process_usage_pressure_or_flow_questions: {
            flow_name: string;
            quantity: number;
            unit: string;
            period: string;
        }[];
        quality_control_use_any_consumables_questions: {
            consumable_name: string;
            mass_of_consumables: number;
            unit: string;
            period: string;
        }[];
        do_you_perform_destructive_testing: boolean;
        weight_of_samples_destroyed_questions: {
            component_name: string;
            weight: number;
            unit: string;
            period: string;
        }[];
        defect_or_rejection_rate_identified_by_quality_control_questions: {
            component_name: string;
            percentage: number;
        }[];
        rework_rate_due_to_quality_control_questions: {
            component_name: string;
            processes_involved: string;
            percentage: number;
        }[];
        weight_of_quality_control_waste_generated_questions: {
            mpn?: string;
            component_name?: string;
            waste_type: string;
            waste_weight: number;
            unit: string;
            treatment_type: string;
        }[];
        it_system_use_for_production_control: string[];
        total_energy_consumption_of_it_hardware_production: boolean;
        energy_con_included_total_energy_pur_sec_two_qfortythree: boolean;
        energy_consumption_for_qfortyfour_questions: {
            energy_purchased: string;
            energy_type: string;
            quantity: number;
            unit: string;
        }[];
        do_you_use_cloud_based_system_for_production: boolean;
        cloud_provider_details_questions: {
            cloud_provider_name: string;
            virtual_machines: string;
            data_storage: string;
            data_transfer: string;
        }[];
        dedicated_monitoring_sensor_usage_questions: {
            type_of_sensor: string;
            sensor_quantity: number;
            energy_consumption: string;
            unit: string;
        }[];
        annual_replacement_rate_of_sensor_questions: {
            consumable_name: string;
            quantity: number; // Changed to number based on UI usage, though API example showed string "10.3"
            unit: string;
        }[];
        do_you_use_any_cooling_sysytem_for_server: boolean;
        energy_con_included_total_energy_pur_sec_two_qfifty: boolean;
        energy_consumption_for_qfiftyone_questions: {
            energy_purchased: string;
            energy_type: string;
            quantity: number;
            unit: string;
        }[];
    };
    scope_three_other_indirect_emissions_questions: {
        raw_materials_used_in_component_manufacturing_questions: {
            material_name: string;
            percentage: number;
        }[];
        raw_materials_contact_enviguide_support: boolean;
        grade_of_metal_used: string;
        msds_link_or_upload_document: string[];
        use_of_recycled_secondary_materials: boolean;
        recycled_materials_with_percentage_questions: {
            material_name: string;
            percentage: number;
        }[];
        percentage_of_pre_post_consumer_material_used_in_product: boolean;
        pre_post_consumer_reutilization_percentage_questions: {
            material_type: string;
            percentage: string;
        }[];
        pir_pcr_material_percentage_questions: {
            material_type: string;
            percentage: string;
        }[];
        type_of_pack_mat_used_for_delivering_questions: {
            component_name: string;
            packagin_type: string;
            packaging_size: number;
            unit: string;
        }[];
        weight_of_packaging_per_unit_product_questions: {
            component_name: string;
            packagin_weight: number;
            unit: string;
        }[];
        do_you_use_recycle_mat_for_packaging: boolean;
        percentage_of_recycled_content_used_in_packaging: string;
        do_you_use_electricity_for_packaging: boolean;
        energy_con_included_total_energy_pur_sec_two_qsixtysix: boolean;
        energy_consumption_for_qsixtyseven_questions: {
            energy_purchased: string;
            energy_type: string;
            quantity: number;
            unit: string;
        }[];
        weight_of_pro_packaging_waste_questions: {
            waste_type: string;
            waste_weight: number;
            unit: string;
            treatment_type: string;
        }[];
        internal_or_external_waste_material_per_recycling: string;
        any_by_product_generated: boolean;
        type_of_by_product_questions: {
            component_name: string;
            by_product: string;
            price_per_product: number;
            quantity: number;
        }[];
        do_you_track_emission_from_transport: boolean;
        co_two_emission_of_raw_material_questions: {
            mpn?: string;
            component_name?: string;
            raw_material_name: string;
            transport_mode: string;
            source_location: string;
            destination_location: string;
            co_two_emission: string;
        }[];
        mode_of_transport_used_for_transportation: boolean;
        mode_of_transport_used_for_transportation_questions: {
            mpn?: string;
            component_name?: string;
            mode_of_transport: string;
            weight_transported: string;
            source_point: string;
            drop_point: string;
            distance: string;
        }[];
        mode_of_transport_enviguide_support: boolean;
        destination_plant_component_transportation_questions: {
            country: string;
            state: string;
            city: string;
            pincode: string;
        }[];
        iso_14001_or_iso_50001_certified: boolean;
        standards_followed_iso_14067_GHG_catena_etc: boolean;
        do_you_report_to_cdp_sbti_or_other: boolean;
        measures_to_reduce_carbon_emissions_in_production: string;
        renewable_energy_initiatives_or_recycling_programs: string;
        your_company_info: string;
    };
    scope_four_avoided_emissions_questions: {
        products_or_services_that_help_reduce_customer_emissions: string;
        circular_economy_practices_reuse_take_back_epr_refurbishment: string;
        renewable_energy_carbon_offset_projects_implemented: string;
    };
}

class SupplierQuestionnaireService {
  private getHeaders() {
    const token = authService.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `${token}` } : {}),
    };
  }

  // Helper function to convert Yes/No strings to boolean
  private convertToBoolean(value: any): boolean {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
          const lower = value.toLowerCase().trim();
          return lower === 'yes' || lower === 'true' || lower === '1';
      }
      return Boolean(value);
  }

  // Helper function to convert boolean to Yes/No string for radio buttons
  private convertBooleanToYesNo(value: any): string {
      if (typeof value === 'string') {
          // Already a string, return as is if it's Yes/No, otherwise convert
          const lower = value.toLowerCase().trim();
          if (lower === 'yes' || lower === 'no') return value;
          if (lower === 'true' || lower === '1') return 'Yes';
          if (lower === 'false' || lower === '0') return 'No';
          return value; // Return original if not recognized
      }
      if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
      }
      // For other types, convert to boolean first
      return Boolean(value) ? 'Yes' : 'No';
  }

  // Helper to ensure a value is an array (handles undefined, null, objects, strings, etc.)
  private ensureArray(value: any): any[] {
      if (Array.isArray(value)) return value;
      // Handle single string values (e.g., file paths) by wrapping in array
      if (typeof value === 'string' && value.trim() !== '') return [value];
      return [];
  }

  // Helper to convert date/dayjs to ISO string format for backend
  private convertToISOString(value: any): string | null {
      if (!value) return null;
      // If already a string in ISO format, return as is
      if (typeof value === 'string') {
          // Check if it's already in the expected format
          if (value.includes('T') || value.includes('+')) return value;
          // Try to parse and convert
          const parsed = new Date(value);
          return isNaN(parsed.getTime()) ? null : parsed.toISOString().replace('T', ' ').replace('Z', '+00');
      }
      // If it's a number (timestamp), convert to ISO string
      if (typeof value === 'number') {
          const date = new Date(value);
          return date.toISOString().replace('T', ' ').replace('Z', '+00');
      }
      // If it's a dayjs object
      if (value && typeof value === 'object' && typeof value.toISOString === 'function') {
          return value.toISOString().replace('T', ' ').replace('Z', '+00');
      }
      // If it's a Date object
      if (value instanceof Date) {
          return value.toISOString().replace('T', ' ').replace('Z', '+00');
      }
      return null;
  }

  // Helper function to filter out empty objects from arrays
  private filterEmptyObjects<T extends Record<string, any>>(arr: T[]): T[] {
      return arr.filter(item => {
          // Check if object has any non-empty values
          return Object.values(item).some(val => {
              if (val === null || val === undefined || val === '') return false;
              if (typeof val === 'object' && !Array.isArray(val)) {
                  return Object.keys(val).length > 0;
              }
              return true;
          });
      });
  }

  // Helper to map UI data to API payload
  private mapToApiPayload(data: SupplierQuestionnaireData, sup_id?: string, bom_pcf_id?: string): SupplierQuestionnaireApiPayload {
      return {
          supplier_general_info_questions: {
              ...(sup_id && { sup_id }),
              ...(bom_pcf_id && { bom_pcf_id }),
              ere_acknowledge: this.convertToBoolean(data.general_information?.re_technologies_acknowledgement),
              repm_acknowledge: this.convertToBoolean(data.general_information?.re_procurement_acknowledgement),
              dc_acknowledge: this.convertToBoolean(data.general_information?.double_counting_acknowledgement),
              organization_name: data.organization_details?.organization_name,
              core_business_activitiy: data.organization_details?.core_business_activities,
              specify_other_activity: data.organization_details?.core_business_activities_other || null,
              designation: data.organization_details?.designation,
              email_address: data.organization_details?.email_address,
              no_of_employees: data.organization_details?.number_of_employees,
              specify_other_no_of_employees: null, // Not in UI
              annual_revenue: data.organization_details?.annual_revenue,
              specify_other_annual_revenue: null, // Not in UI
              annual_reporting_period: data.organization_details?.annual_reporting_period,
              availability_of_scope_one_two_three_emissions_data: this.convertToBoolean(data.organization_details?.availability_of_emissions_data),
              availability_of_scope_one_two_three_emissions_questions: this.ensureArray(data.organization_details?.emission_data).map(item => ({
                  country_iso_three: item.country,
                  scope_one: item.scope_1,
                  scope_two: item.scope_2,
                  scope_three: item.scope_3
              })),
          },
          supplier_product_questions: {
              do_you_have_an_existing_pcf_report: this.convertToBoolean(data.product_details?.existing_pcf_report),
              pcf_methodology_used: data.product_details?.pcf_methodology || [],
              upload_pcf_report: this.ensureArray(data.product_details?.pcf_report_file),
              production_site_details_questions: this.ensureArray(data.product_details?.production_site_details)
                  .filter(item => item.location || item.component_name || item.product_name || item.mpn || item.material_number || item.bom_id)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      ...(item.mpn && { mpn: item.mpn }),
                      product_name: item.component_name || item.product_name || '',
                      location: item.location || ''
                  })),
              required_environmental_impact_methods: data.product_details?.required_environmental_impact_methods || [],
              product_component_manufactured_questions: this.ensureArray(data.product_details?.products_manufactured)
                  .filter(item => item.product_name || item.mpn || item.material_number || item.bom_id)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      ...(item.mpn && { mpn: item.mpn }),
                      product_name: item.product_name || '',
                      production_period: item.production_period,
                      weight_per_unit: item.weight_per_unit,
                      unit: item.unit,
                      price: item.price,
                      quantity: item.quantity
                  })),
              any_co_product_have_economic_value: this.convertToBoolean(data.product_details?.any_co_product_have_economic_value || false),
              co_product_component_economic_value_questions: this.ensureArray(data.product_details?.co_products)
                  .filter(item => item.product_name && item.co_product_name)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...((item.material_number || item.mpn) && { material_number: item.material_number || item.mpn }),
                      product_name: item.product_name,
                      co_product_name: item.co_product_name,
                      weight: item.weight,
                      price_per_product: item.price_per_product,
                      quantity: item.quantity
                  })),
          },
          scope_one_direct_emissions_questions: {
              stationary_combustion_on_site_energy_use_questions: this.ensureArray(data.scope_1?.stationary_combustion)
                  .filter(item => item.fuel_type)
                  .map(item => {
                      const subFuelTypes = this.filterEmptyObjects(this.ensureArray(item.sub_fuel_type).map(sub => ({
                          sub_fuel_type: sub.sub_fuel_type,
                          consumption_quantity: sub.consumption_quantity,
                          unit: sub.unit
                      })));
                      return {
                          fuel_type: item.fuel_type,
                          scoseu_sub_fuel_type_questions: subFuelTypes
                      };
                  })
                  .filter(item => item.fuel_type && (item.scoseu_sub_fuel_type_questions.length > 0 || item.fuel_type)),
              mobile_combustion_company_owned_vehicles_questions: this.ensureArray(data.scope_1?.mobile_combustion)
                  .filter(item => item.fuel_type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      fuel_type: item.fuel_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              refrigerant_top_ups_performed: this.convertToBoolean(data.scope_1?.fugitive_emissions?.refrigerant_top_ups || false),
              refrigerants_questions: this.ensureArray(data.scope_1?.fugitive_emissions?.refrigerants)
                  .filter(item => item.type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      refrigerant_type: item.type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              industrial_process_emissions_present: this.convertToBoolean(data.scope_1?.process_emissions?.present || false),
              process_emissions_sources_questions: this.ensureArray(data.scope_1?.process_emissions?.sources)
                  .filter(item => item.source && item.gas_type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      source: item.source,
                      gas_type: item.gas_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
          },
          scope_two_indirect_emissions_questions: {
              scope_two_indirect_emissions_from_purchased_energy_questions: this.ensureArray(data.scope_2?.purchased_energy)
                  .filter(item => item.energy_source && item.energy_type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      energy_source: item.energy_source,
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              do_you_acquired_standardized_re_certificates: this.convertToBoolean(data.scope_2?.standardized_re_certificates || false),
              scope_two_indirect_emissions_certificates_questions: this.ensureArray(data.scope_2?.certificates)
                  .filter(item => item.name && item.serial_id)
                  .map(item => ({
                      certificate_name: item.name,
                      mechanism: item.procurement_mechanism,
                      serial_id: item.serial_id,
                      generator_id: item.generator_id,
                      generator_name: item.generator_name,
                      generator_location: item.generator_location,
                      date_of_generation: this.convertToISOString(item.date_of_generation),
                      issuance_date: this.convertToISOString(item.issuance_date)
                  })),
              methodology_to_allocate_factory_energy_to_product_level: this.convertToBoolean(data.scope_2?.manufacturing_process_specific_energy?.allocation_methodology || false),
              methodology_details_document_url: this.ensureArray(data.scope_2?.manufacturing_process_specific_energy?.methodology_document),
              energy_intensity_of_production_estimated_kwhor_mj: this.convertToBoolean(data.scope_2?.manufacturing_process_specific_energy?.energy_intensity_estimated || false),
              energy_intensity_of_production_estimated_kwhor_mj_questions: this.ensureArray(data.scope_2?.manufacturing_process_specific_energy?.energy_intensity)
                  .filter(item => item.product_name && item.energy_intensity)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      product_name: item.product_name,
                      energy_intensity: item.energy_intensity,
                      unit: item.unit
                  })),
              process_specific_energy_usage: this.convertToBoolean(data.scope_2?.manufacturing_process_specific_energy?.process_specific_usage_enabled || this.ensureArray(data.scope_2?.manufacturing_process_specific_energy?.process_energy_usage).length > 0),
              process_specific_energy_usage_questions: this.ensureArray(data.scope_2?.manufacturing_process_specific_energy?.process_energy_usage)
                  .filter(item => item.process_type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => {
                      // Combine energy_source_name and energy_type_name into single energy_type field
                      const combinedEnergyType = item.energy_source_name && item.energy_type_name
                          ? `${item.energy_source_name} - ${item.energy_type_name}`
                          : item.energy_type_name || item.energy_source_name || '';

                      return {
                          ...(item.bom_id && { bom_id: item.bom_id }),
                          ...(item.material_number && { material_number: item.material_number }),
                          process_specific_energy_type: item.process_type,
                          ...(combinedEnergyType && { energy_type: combinedEnergyType }),
                          quantity_consumed: item.quantity,
                          unit: item.unit,
                          support_from_enviguide: this.convertToBoolean(item.support_from_enviguide || false)
                      };
                  }),
              do_you_use_any_abatement_systems: this.convertToBoolean(data.scope_2?.manufacturing_process_specific_energy?.abatement_systems || false),
              abatement_systems_used_questions: this.ensureArray(data.scope_2?.manufacturing_process_specific_energy?.abatement_energy_consumption)
                  .filter(item => item.source && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      source: item.source,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              water_consumption_and_treatment_details: data.scope_2?.water_consumption || data.scope_2?.manufacturing_process_specific_energy?.water_consumption_details || '',
              type_of_quality_control_equipment_usage_questions: this.ensureArray(data.scope_2?.quality_control?.equipment)
                  .filter(item => item.equipment_name && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      equipment_name: item.equipment_name,
                      quantity: item.quantity,
                      unit: item.unit,
                      avg_operating_hours_per_month: item.operating_hours || ''
                  })),
              electricity_consumed_for_quality_control_questions: this.ensureArray(data.scope_2?.quality_control?.electricity_consumption)
                  .filter(item => item.energy_type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit,
                      period: item.period
                  })),
              quality_control_process_usage_questions: this.ensureArray(data.scope_2?.quality_control?.utilities)
                  .filter(item => item.name && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      process_name: item.name,
                      quantity: item.quantity,
                      unit: item.unit,
                      period: item.period
                  })),
              quality_control_process_usage_pressure_or_flow_questions: this.ensureArray(data.scope_2?.quality_control?.utilities_pressure_flow)
                  .filter(item => item.name && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      flow_name: item.name,
                      quantity: item.quantity,
                      unit: item.unit,
                      period: item.period
                  })),
              quality_control_use_any_consumables_questions: this.ensureArray(data.scope_2?.quality_control?.consumables)
                  .filter(item => item.consumable_name && item.mass)
                  .map(item => ({
                      consumable_name: item.consumable_name,
                      mass_of_consumables: item.mass,
                      unit: item.unit,
                      period: item.period
                  })),
              do_you_perform_destructive_testing: this.convertToBoolean(data.scope_2?.quality_control?.destructive_testing || false),
              weight_of_samples_destroyed_questions: this.ensureArray(data.scope_2?.quality_control?.destructive_testing_details)
                  .filter(item => item.component_name && (item.weight !== undefined && item.weight !== null && item.weight !== ''))
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      weight: item.weight,
                      unit: item.unit,
                      period: item.period
                  })),
              defect_or_rejection_rate_identified_by_quality_control_questions: this.ensureArray(data.scope_2?.quality_control?.defect_rate)
                  .filter(item => item.component_name && item.percentage !== undefined && item.percentage !== null)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      percentage: item.percentage
                  })),
              rework_rate_due_to_quality_control_questions: this.ensureArray(data.scope_2?.quality_control?.rework_rate)
                  .filter(item => item.component_name && item.processes_involved && item.percentage !== undefined && item.percentage !== null)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      processes_involved: item.processes_involved,
                      percentage: item.percentage
                  })),
              weight_of_quality_control_waste_generated_questions: this.ensureArray(data.scope_2?.quality_control?.waste)
                  .filter(item => item.waste_type && (item.weight !== undefined && item.weight !== null && item.weight !== ''))
                  .map(item => {
                      const ref = resolveComponentRefFromMpnOrName(data, item as any);
                      return ({
                      ...(ref?.bom_id && { bom_id: ref.bom_id }),
                      ...((ref?.material_number || item.material_number) && { material_number: (ref?.material_number || item.material_number) }),
                      ...(item.mpn && { mpn: item.mpn }),
                      ...(item.component_name && { component_name: item.component_name }),
                      waste_type: item.waste_type,
                      waste_weight: item.weight,
                      unit: item.unit,
                      treatment_type: item.treatment_type
                      });
                  }),
              it_system_use_for_production_control: data.scope_2?.it_for_production?.systems_used || [],
              total_energy_consumption_of_it_hardware_production: this.convertToBoolean(data.scope_2?.it_for_production?.hardware_energy_consumption_tracked || false),
              energy_con_included_total_energy_pur_sec_two_qfortythree: this.convertToBoolean(data.scope_2?.it_for_production?.hardware_energy_included || false),
              energy_consumption_for_qfortyfour_questions: this.ensureArray(data.scope_2?.it_for_production?.hardware_energy_consumption)
                  .filter(item => item.energy_source && item.energy_type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      energy_purchased: item.energy_source,
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              do_you_use_cloud_based_system_for_production: this.convertToBoolean(data.scope_2?.it_for_production?.cloud_systems || false),
              cloud_provider_details_questions: this.ensureArray(data.scope_2?.it_for_production?.cloud_usage)
                  .filter(item => item.provider_name)
                  .map(item => ({
                      cloud_provider_name: item.provider_name,
                      virtual_machines: item.virtual_machines,
                      data_storage: item.data_storage,
                      data_transfer: item.data_transfer
                  })),
              dedicated_monitoring_sensor_usage_questions: this.ensureArray(data.scope_2?.it_for_production?.sensors)
                  .filter(item => item.type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      type_of_sensor: item.type,
                      sensor_quantity: item.quantity,
                      energy_consumption: item.energy_consumption,
                      unit: item.unit
                  })),
              annual_replacement_rate_of_sensor_questions: this.ensureArray(data.scope_2?.it_for_production?.sensor_replacement)
                  .filter(item => item.consumable_name && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      consumable_name: item.consumable_name,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              do_you_use_any_cooling_sysytem_for_server: this.convertToBoolean(data.scope_2?.it_for_production?.cooling_systems || false),
              energy_con_included_total_energy_pur_sec_two_qfifty: this.convertToBoolean(data.scope_2?.it_for_production?.cooling_energy_included || false),
              energy_consumption_for_qfiftyone_questions: this.ensureArray(data.scope_2?.it_for_production?.cooling_energy_consumption)
                  .filter(item => item.energy_source && item.energy_type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      energy_purchased: item.energy_source,
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
          },
          scope_three_other_indirect_emissions_questions: {
              raw_materials_used_in_component_manufacturing_questions: this.ensureArray(data.scope_3?.materials?.raw_materials)
                  .filter(item => item.material && item.composition_percent !== undefined && item.composition_percent !== null)
                  .map(item => {
                      const ref = resolveComponentRefFromMpnOrName(data, item as any);
                      return ({
                      ...(ref?.bom_id && { bom_id: ref.bom_id }),
                      ...((ref?.material_number || item.material_number) && { material_number: (ref?.material_number || item.material_number) }),
                      material_name: item.material,
                      percentage: item.composition_percent
                      });
                  }),
              raw_materials_contact_enviguide_support: this.convertToBoolean(data.scope_3?.materials?.raw_materials_contact_support || false),
              grade_of_metal_used: data.scope_3?.materials?.metal_grade || '',
              msds_link_or_upload_document: Array.isArray(data.scope_3?.materials?.msds) ? data.scope_3?.materials.msds : (data.scope_3?.materials?.msds ? [data.scope_3?.materials.msds] : []),
              use_of_recycled_secondary_materials: this.convertToBoolean(data.scope_3?.materials?.recycled_materials_used || false),
              recycled_materials_with_percentage_questions: this.ensureArray(data.scope_3?.materials?.recycled_materials_details)
                  .filter(item => item.material_type && item.recycled_percent !== undefined && item.recycled_percent !== null)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      material_name: item.material_type,
                      percentage: item.recycled_percent
                  })),
              percentage_of_pre_post_consumer_material_used_in_product: this.convertToBoolean(data.scope_3?.materials?.estimate_pre_post_consumer || false),
              pre_post_consumer_reutilization_percentage_questions: this.ensureArray(data.scope_3?.materials?.material_type_percentages)
                  .filter(item => item.type && (item.percentage !== undefined && item.percentage !== null && item.percentage !== ''))
                  .map(item => ({
                      material_type: item.type,
                      percentage: String(item.percentage)
                  })),
              pir_pcr_material_percentage_questions: this.ensureArray(data.scope_3?.materials?.pir_pcr_materials)
                  .filter(item => item.material_type && item.recycled_composition)
                  .map(item => ({
                      material_type: item.material_type,
                      percentage: item.recycled_composition
                  })),
              type_of_pack_mat_used_for_delivering_questions: this.ensureArray(data.scope_3?.packaging?.materials_used)
                  .filter(item => item.component_name && item.packaging_type)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      packagin_type: item.packaging_type,
                      packaging_size: item.packing_size,
                      unit: item.unit,
                      treatment_type: item.treatment_type
                  })),
              weight_of_packaging_per_unit_product_questions: this.ensureArray(data.scope_3?.packaging?.weight_per_unit)
                  .filter(item => item.component_name && (item.weight !== undefined && item.weight !== null && item.weight !== ''))
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      packagin_weight: item.weight,
                      unit: item.unit
                  })),
              do_you_use_recycle_mat_for_packaging: this.convertToBoolean(data.scope_3?.packaging?.recycled_content_used || false),
              percentage_of_recycled_content_used_in_packaging: String(data.scope_3?.packaging?.recycled_percent ?? ""),
              do_you_use_electricity_for_packaging: this.convertToBoolean(data.scope_3?.packaging?.electricity_used || false),
              energy_con_included_total_energy_pur_sec_two_qsixtysix: this.convertToBoolean(data.scope_3?.packaging?.energy_included || false),
              energy_consumption_for_qsixtyseven_questions: this.ensureArray(data.scope_3?.packaging?.energy_consumption)
                  .filter(item => item.energy_source && item.energy_type && (item.quantity !== undefined && item.quantity !== null && item.quantity !== ''))
                  .map(item => ({
                      energy_purchased: item.energy_source,
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              weight_of_pro_packaging_waste_questions: this.ensureArray(data.scope_3?.waste_disposal?.types_and_weight)
                  .filter(item => item.waste_type && (item.weight !== undefined && item.weight !== null && item.weight !== ''))
                  .map((item: any) => {
                      const ref = resolveComponentRefFromMpnOrName(data, item as any);
                      return ({
                      ...(ref?.bom_id && { bom_id: ref.bom_id }),
                      ...((ref?.material_number || item.material_number) && { material_number: (ref?.material_number || item.material_number) }),
                      ...(item.component_name && { component_name: item.component_name }),
                      waste_type: item.waste_type,
                      waste_weight: item.weight,
                      unit: item.unit,
                      treatment_type: item.treatment_type
                      });
                  }),
              internal_or_external_waste_material_per_recycling: String(data.scope_3?.waste_disposal?.recycled_percent ?? ''),
              any_by_product_generated: this.convertToBoolean(data.scope_3?.waste_disposal?.by_products_generated || false),
              type_of_by_product_questions: this.ensureArray(data.scope_3?.waste_disposal?.by_product_details)
                  .filter(item => item.component_name && item.by_product)
                  .map(item => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      by_product: item.by_product,
                      price_per_product: item.price,
                      quantity: item.quantity
                  })),
              do_you_track_emission_from_transport: this.convertToBoolean(data.scope_3?.logistics?.emissions_tracked || false),
              co_two_emission_of_raw_material_questions: this.ensureArray(data.scope_3?.logistics?.estimated_emissions)
                  .filter(item => item.raw_material && item.transport_mode && item.source && item.destination && (item.co2e !== undefined && item.co2e !== null && item.co2e !== ''))
                  .map(item => ({
                      ...(item.mpn && { mpn: item.mpn }),
                      ...(item.component_name && { component_name: item.component_name }),
                      raw_material_name: item.raw_material,
                      weight: item.weight,
                      transport_mode: item.transport_mode,
                      source_location: item.source,
                      ...(item.source_lat && { source_lat: item.source_lat }),
                      ...(item.source_long && { source_long: item.source_long }),
                      destination_location: item.destination,
                      ...(item.destination_lat && { destination_lat: item.destination_lat }),
                      ...(item.destination_long && { destination_long: item.destination_long }),
                      co_two_emission: item.co2e
                  })),
              mode_of_transport_used_for_transportation: this.convertToBoolean((data.scope_3?.logistics?.transport_modes?.length || 0) > 0),
              mode_of_transport_used_for_transportation_questions: this.ensureArray(data.scope_3?.logistics?.transport_modes)
                  .filter(item => item.mode && item.source && item.destination && (item.distance !== undefined && item.distance !== null && item.distance !== ''))
                  .map(item => {
                      const ref = resolveComponentRefFromMpnOrName(data, item as any);
                      return ({
                      ...(ref?.bom_id && { bom_id: ref.bom_id }),
                      ...((ref?.material_number || item.material_number) && { material_number: (ref?.material_number || item.material_number) }),
                      ...(item.mpn && { mpn: item.mpn }),
                      ...(item.component_name && { component_name: item.component_name }),
                      mode_of_transport: item.mode,
                      weight_transported: item.weight || '',
                      source_point: item.source,
                      drop_point: item.destination,
                      distance: item.distance
                      });
                  }),
              mode_of_transport_enviguide_support: this.convertToBoolean(data.scope_3?.logistics?.enviguide_support || false),
              destination_plant_component_transportation_questions: this.ensureArray(data.scope_3?.logistics?.destination_plant)
                  .filter(item => item.country && item.state && item.city)
                  .map(item => ({
                      country: item.country,
                      state: item.state,
                      city: item.city,
                      pincode: item.pin_code || ''
                  })),
              iso_14001_or_iso_50001_certified: this.convertToBoolean(data.scope_3?.certifications?.iso_certified || false),
              standards_followed_iso_14067_GHG_catena_etc: this.convertToBoolean(data.scope_3?.certifications?.standards_followed || false),
              do_you_report_to_cdp_sbti_or_other: this.convertToBoolean(data.scope_3?.certifications?.reporting_frameworks || false),
              measures_to_reduce_carbon_emissions_in_production: data.scope_3?.certifications?.additional_notes?.reduction_measures || '',
              renewable_energy_initiatives_or_recycling_programs: data.scope_3?.certifications?.additional_notes?.initiatives || '',
              your_company_info: data.scope_3?.certifications?.additional_notes?.strategies || '',
          },
          scope_four_avoided_emissions_questions: {
              products_or_services_that_help_reduce_customer_emissions: data.scope_4?.products_reducing_customer_emissions,
              circular_economy_practices_reuse_take_back_epr_refurbishment: data.scope_4?.circular_economy_practices,
              renewable_energy_carbon_offset_projects_implemented: data.scope_4?.offset_projects
          }
      };
  }

  // Helper to map API response to UI data
  private mapFromApiResponse(apiData: any): SupplierQuestionnaireData {
      const data = apiData.supplier_general_info_questions ? apiData : { supplier_general_info_questions: apiData }; // Handle potential nesting variations

      const genInfo = data.supplier_general_info_questions || {};
      const prodInfo = data.supplier_product_questions || {};
      const scope1 = data.scope_one_direct_emissions_questions || {};
      const scope2 = data.scope_two_indirect_emissions_questions || {};
      const scope3 = data.scope_three_other_indirect_emissions_questions || {};
      const scope4 = data.scope_four_avoided_emissions_questions || {};

      return {
          sgiq_id: data.sgiq_id || genInfo.sgiq_id,
          general_information: {
              gdpr_acknowledgement: true, // Not in API, assumed true if saved
              re_technologies_acknowledgement: genInfo.ere_acknowledge,
              re_procurement_acknowledgement: genInfo.repm_acknowledge,
              double_counting_acknowledgement: genInfo.dc_acknowledge,
          },
          organization_details: {
              organization_name: genInfo.organization_name,
              core_business_activities: genInfo.core_business_activitiy,
              core_business_activities_other: genInfo.specify_other_activity,
              designation: genInfo.designation,
              email_address: genInfo.email_address,
              number_of_employees: genInfo.no_of_employees,
              annual_revenue: genInfo.annual_revenue,
              annual_reporting_period: genInfo.annual_reporting_period,
              // Convert boolean to Yes/No for radio button field
              availability_of_emissions_data: this.convertToBoolean(genInfo.availability_of_scope_one_two_three_emissions_data),
              emission_data: (genInfo.availability_of_scope_one_two_three_emissions_questions || []).map((item: any) => ({
                  country: item.country_iso_three,
                  scope_1: item.scope_one,
                  scope_2: item.scope_two,
                  scope_3: item.scope_three
              })),
          },
          product_details: {
              // Convert boolean to Yes/No for radio button field
              existing_pcf_report: this.convertToBoolean(prodInfo.do_you_have_an_existing_pcf_report),
              pcf_methodology: prodInfo.pcf_methodology_used,
              pcf_report_file: prodInfo.upload_pcf_report,
              production_site_details: (prodInfo.production_site_details_questions || []).map((item: any) => ({
                  ...(item.bom_id && { bom_id: item.bom_id }),
                  ...(item.material_number && { material_number: item.material_number }),
                  ...(item.mpn && { mpn: item.mpn }),
                  product_name: item.product_name,
                  location: item.location
              })),
              required_environmental_impact_methods: prodInfo.required_environmental_impact_methods,
              products_manufactured: (prodInfo.product_component_manufactured_questions || []).map((item: any) => ({
                  ...(item.bom_id && { bom_id: item.bom_id }),
                  ...(item.material_number && { material_number: item.material_number }),
                  ...(item.mpn && { mpn: item.mpn }),
                  product_name: item.product_name,
                  production_period: item.production_period,
                  weight_per_unit: item.weight_per_unit,
                  unit: item.unit,
                  price: item.price,
                  quantity: item.quantity
              })),
              // Convert boolean to Yes/No for radio button field
              any_co_product_have_economic_value: this.convertToBoolean(prodInfo.any_co_product_have_economic_value),
              co_products: (prodInfo.co_product_component_economic_value_questions || []).map((item: any) => ({
                  ...(item.bom_id && { bom_id: item.bom_id }),
                  ...(item.material_number && { material_number: item.material_number }),
                  product_name: item.product_name,
                  co_product_name: item.co_product_name,
                  weight: item.weight,
                  price_per_product: item.price_per_product,
                  quantity: item.quantity
              })),
          },
          scope_1: {
              stationary_combustion: (scope1.stationary_combustion_on_site_energy_use_questions || []).map((item: any) => ({
                  fuel_type: item.fuel_type,
                  sub_fuel_type: (item.scoseu_sub_fuel_type_questions || []).map((sub: any) => ({
                      sub_fuel_type: sub.sub_fuel_type,
                      consumption_quantity: sub.consumption_quantity,
                      unit: sub.unit
                  }))
              })),
              mobile_combustion: (scope1.mobile_combustion_company_owned_vehicles_questions || []).map((item: any) => ({
                  fuel_type: item.fuel_type,
                  quantity: item.quantity,
                  unit: item.unit
              })),
              fugitive_emissions: {
                  // Convert boolean to Yes/No for radio button field
                  refrigerant_top_ups: this.convertToBoolean(scope1.refrigerant_top_ups_performed),
                  refrigerants: (scope1.refrigerants_questions || []).map((item: any) => ({
                      type: item.refrigerant_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              },
              process_emissions: {
                  // Convert boolean to Yes/No for radio button field
                  present: this.convertToBoolean(scope1.industrial_process_emissions_present),
                  sources: (scope1.process_emissions_sources_questions || []).map((item: any) => ({
                      source: item.source,
                      gas_type: item.gas_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              },
          },
          scope_2: {
              purchased_energy: (scope2.scope_two_indirect_emissions_from_purchased_energy_questions || []).map((item: any) => ({
                  energy_source: item.energy_source,
                  energy_type: item.energy_type,
                  quantity: item.quantity,
                  unit: item.unit
              })),
              // Convert boolean to Yes/No for radio button field
              standardized_re_certificates: this.convertToBoolean(scope2.do_you_acquired_standardized_re_certificates),
              certificates: (scope2.scope_two_indirect_emissions_certificates_questions || []).map((item: any) => ({
                  name: item.certificate_name,
                  procurement_mechanism: item.mechanism,
                  serial_id: item.serial_id,
                  generator_id: item.generator_id,
                  generator_name: item.generator_name,
                  generator_location: item.generator_location,
                  date_of_generation: item.date_of_generation,
                  issuance_date: item.issuance_date
              })),
              manufacturing_process_specific_energy: {
                  // Convert boolean to Yes/No for radio button fields
                  allocation_methodology: this.convertToBoolean(scope2.methodology_to_allocate_factory_energy_to_product_level),
                  methodology_document: scope2.methodology_details_document_url,
                  energy_intensity_estimated: this.convertToBoolean(scope2.energy_intensity_of_production_estimated_kwhor_mj),
                  energy_intensity: (scope2.energy_intensity_of_production_estimated_kwhor_mj_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      product_name: item.product_name,
                      energy_intensity: item.energy_intensity,
                      unit: item.unit
                  })),
                  // Convert boolean to Yes/No for radio button field
                  process_specific_usage_enabled: this.convertToBoolean(scope2.process_specific_energy_usage),
                  process_energy_usage: (scope2.process_specific_energy_usage_questions || []).map((item: any) => ({
                      process_type: item.process_specific_energy_type,
                      quantity: item.quantity_consumed,
                      unit: item.unit,
                      support_from_enviguide: item.support_from_enviguide
                  })),
                  // Convert boolean to Yes/No for radio button field
                  abatement_systems: this.convertToBoolean(scope2.do_you_use_any_abatement_systems),
                  abatement_energy_consumption: (scope2.abatement_systems_used_questions || []).map((item: any) => ({
                      source: item.source,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
                  water_consumption_details: scope2.water_consumption_and_treatment_details,
              },
              water_consumption: scope2.water_consumption_and_treatment_details,
              quality_control: {
                  equipment: (scope2.type_of_quality_control_equipment_usage_questions || []).map((item: any) => ({
                      equipment_name: item.equipment_name,
                      quantity: item.quantity,
                      unit: item.unit,
                      operating_hours: item.avg_operating_hours_per_month
                  })),
                  electricity_consumption: (scope2.electricity_consumed_for_quality_control_questions || []).map((item: any) => ({
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit,
                      period: item.period
                  })),
                  utilities: (scope2.quality_control_process_usage_questions || []).map((item: any) => ({
                      name: item.process_name,
                      quantity: item.quantity,
                      unit: item.unit,
                      period: item.period
                  })),
                  utilities_pressure_flow: (scope2.quality_control_process_usage_pressure_or_flow_questions || []).map((item: any) => ({
                      name: item.flow_name,
                      quantity: item.quantity,
                      unit: item.unit,
                      period: item.period
                  })),
                  consumables: (scope2.quality_control_use_any_consumables_questions || []).map((item: any) => ({
                      consumable_name: item.consumable_name,
                      mass: item.mass_of_consumables,
                      unit: item.unit,
                      period: item.period
                  })),
                  // Convert boolean to Yes/No for radio button field
                  destructive_testing: this.convertToBoolean(scope2.do_you_perform_destructive_testing),
                  destructive_testing_details: (scope2.weight_of_samples_destroyed_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      weight: item.weight,
                      unit: item.unit,
                      period: item.period
                  })),
                  defect_rate: (scope2.defect_or_rejection_rate_identified_by_quality_control_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      percentage: item.percentage
                  })),
                  rework_rate: (scope2.rework_rate_due_to_quality_control_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      processes_involved: item.processes_involved,
                      percentage: item.percentage
                  })),
                  waste: (scope2.weight_of_quality_control_waste_generated_questions || []).map((item: any) => ({
                      ...(item.mpn && { mpn: item.mpn }),
                      ...(item.component_name && { component_name: item.component_name }),
                      waste_type: item.waste_type,
                      weight: item.waste_weight,
                      unit: item.unit,
                      treatment_type: item.treatment_type
                  })),
              },
              it_for_production: {
                  systems_used: scope2.it_system_use_for_production_control,
                  // Convert boolean to Yes/No for radio button fields
                  hardware_energy_consumption_tracked: this.convertToBoolean(scope2.total_energy_consumption_of_it_hardware_production),
                  hardware_energy_included: this.convertToBoolean(scope2.energy_con_included_total_energy_pur_sec_two_qfortythree),
                  hardware_energy_consumption: (scope2.energy_consumption_for_qfortyfour_questions || []).map((item: any) => ({
                      energy_source: item.energy_purchased,
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
                  // Convert boolean to Yes/No for radio button field
                  cloud_systems: this.convertToBoolean(scope2.do_you_use_cloud_based_system_for_production),
                  cloud_usage: (scope2.cloud_provider_details_questions || []).map((item: any) => ({
                      provider_name: item.cloud_provider_name,
                      virtual_machines: item.virtual_machines,
                      data_storage: item.data_storage,
                      data_transfer: item.data_transfer
                  })),
                  sensors: (scope2.dedicated_monitoring_sensor_usage_questions || []).map((item: any) => ({
                      type: item.type_of_sensor,
                      quantity: item.sensor_quantity,
                      energy_consumption: item.energy_consumption,
                      unit: item.unit
                  })),
                  sensor_replacement: (scope2.annual_replacement_rate_of_sensor_questions || []).map((item: any) => ({
                      consumable_name: item.consumable_name,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
                  // Convert boolean to Yes/No for radio button fields
                  cooling_systems: this.convertToBoolean(scope2.do_you_use_any_cooling_sysytem_for_server),
                  cooling_energy_included: this.convertToBoolean(scope2.energy_con_included_total_energy_pur_sec_two_qfifty),
                  cooling_energy_consumption: (scope2.energy_consumption_for_qfiftyone_questions || []).map((item: any) => ({
                      energy_source: item.energy_purchased,
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              },
          },
          scope_3: {
              materials: {
                  raw_materials: (scope3.raw_materials_used_in_component_manufacturing_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      material: item.material_name,
                      composition_percent: item.percentage
                  })),
                  // Convert boolean to Yes/No for radio button field
                  raw_materials_contact_support: this.convertToBoolean(scope3.raw_materials_contact_enviguide_support),
                  metal_grade: scope3.grade_of_metal_used,
                  msds: scope3.msds_link_or_upload_document,
                  // Convert boolean to Yes/No for radio button field
                  recycled_materials_used: this.convertToBoolean(scope3.use_of_recycled_secondary_materials),
                  recycled_materials_details: (scope3.recycled_materials_with_percentage_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      material_type: item.material_name,
                      recycled_percent: item.percentage
                  })),
                  // Convert boolean to Yes/No for radio button field
                  estimate_pre_post_consumer: this.convertToBoolean(scope3.percentage_of_pre_post_consumer_material_used_in_product),
                  material_type_percentages: (scope3.pre_post_consumer_reutilization_percentage_questions || []).map((item: any) => ({
                      type: item.material_type,
                      percentage: item.percentage
                  })),
                  pir_pcr_materials: (scope3.pir_pcr_material_percentage_questions || []).map((item: any) => ({
                      material_type: item.material_type,
                      recycled_composition: item.percentage
                  })),
              },
              packaging: {
                  materials_used: (scope3.type_of_pack_mat_used_for_delivering_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      packaging_type: item.packagin_type,
                      packing_size: item.packaging_size,
                      unit: item.unit,
                      treatment_type: item.treatment_type
                  })),
                  weight_per_unit: (scope3.weight_of_packaging_per_unit_product_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      weight: item.packagin_weight,
                      unit: item.unit
                  })),
                  // Convert boolean to Yes/No for radio button fields
                  recycled_content_used: this.convertToBoolean(scope3.do_you_use_recycle_mat_for_packaging),
                  recycled_percent: scope3.percentage_of_recycled_content_used_in_packaging,
                  electricity_used: this.convertToBoolean(scope3.do_you_use_electricity_for_packaging),
                  energy_included: this.convertToBoolean(scope3.energy_con_included_total_energy_pur_sec_two_qsixtysix),
                  energy_consumption: (scope3.energy_consumption_for_qsixtyseven_questions || []).map((item: any) => ({
                      energy_source: item.energy_purchased,
                      energy_type: item.energy_type,
                      quantity: item.quantity,
                      unit: item.unit
                  })),
              },
              waste_disposal: {
                  types_and_weight: (scope3.weight_of_pro_packaging_waste_questions || []).map((item: any) => ({
                      waste_type: item.waste_type,
                      weight: item.waste_weight,
                      unit: item.unit,
                      treatment_type: item.treatment_type
                  })),
                  recycled_percent: scope3.internal_or_external_waste_material_per_recycling,
                  // Convert boolean to Yes/No for radio button field
                  by_products_generated: this.convertToBoolean(scope3.any_by_product_generated),
                  by_product_details: (scope3.type_of_by_product_questions || []).map((item: any) => ({
                      ...(item.bom_id && { bom_id: item.bom_id }),
                      ...(item.material_number && { material_number: item.material_number }),
                      component_name: item.component_name,
                      by_product: item.by_product,
                      price: item.price_per_product,
                      quantity: item.quantity
                  })),
              },
              logistics: {
                  // Convert boolean to Yes/No for radio button field
                  emissions_tracked: this.convertToBoolean(scope3.do_you_track_emission_from_transport),
                  estimated_emissions: (scope3.co_two_emission_of_raw_material_questions || []).map((item: any) => ({
                      ...(item.mpn && { mpn: item.mpn }),
                      ...(item.component_name && { component_name: item.component_name }),
                      raw_material: item.raw_material_name,
                      weight: item.weight,
                      transport_mode: item.transport_mode,
                      source: item.source_location,
                      ...(item.source_lat && { source_lat: item.source_lat }),
                      ...(item.source_long && { source_long: item.source_long }),
                      destination: item.destination_location,
                      ...(item.destination_lat && { destination_lat: item.destination_lat }),
                      ...(item.destination_long && { destination_long: item.destination_long }),
                      co2e: item.co_two_emission
                  })),
                  transport_modes: (scope3.mode_of_transport_used_for_transportation_questions || []).map((item: any) => ({
                      ...(item.mpn && { mpn: item.mpn }),
                      ...(item.component_name && { component_name: item.component_name }),
                      mode: item.mode_of_transport,
                      weight: item.weight_transported,
                      source: item.source_point,
                      destination: item.drop_point,
                      distance: item.distance
                  })),
                  // Convert boolean to Yes/No for radio button field
                  enviguide_support: this.convertToBoolean(scope3.mode_of_transport_enviguide_support),
                  destination_plant: (scope3.destination_plant_component_transportation_questions || []).map((item: any) => ({
                      country: item.country,
                      state: item.state,
                      city: item.city,
                      pin_code: item.pincode
                  })),
              },
              certifications: {
                  // Convert boolean to Yes/No for radio button fields
                  iso_certified: this.convertToBoolean(scope3.iso_14001_or_iso_50001_certified),
                  standards_followed: this.convertToBoolean(scope3.standards_followed_iso_14067_GHG_catena_etc),
                  reporting_frameworks: this.convertToBoolean(scope3.do_you_report_to_cdp_sbti_or_other),
                  additional_notes: {
                      reduction_measures: scope3.measures_to_reduce_carbon_emissions_in_production,
                      initiatives: scope3.renewable_energy_initiatives_or_recycling_programs,
                      strategies: scope3.your_company_info,
                  },
              },
          },
          scope_4: {
              products_reducing_customer_emissions: scope4.products_or_services_that_help_reduce_customer_emissions,
              circular_economy_practices: scope4.circular_economy_practices_reuse_take_back_epr_refurbishment,
              offset_projects: scope4.renewable_energy_carbon_offset_projects_implemented,
          }
      };
  }

  /**
   * Check if questionnaire is already submitted for a supplier and BOM
   */
  async checkQuestionnaireStatus(
    bom_pcf_id: string,
    sup_id: string
  ): Promise<{ success: boolean; message: string; data?: { is_submitted: boolean; sgiq_id?: string } }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/questionnaire-status?bom_pcf_id=${encodeURIComponent(bom_pcf_id)}&sup_id=${encodeURIComponent(sup_id)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "Status fetched successfully",
          data: {
            is_submitted: result.data?.is_submitted ?? false,
            sgiq_id: result.data?.sgiq_id,
          },
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch status",
          data: { is_submitted: false },
        };
      }
    } catch (error) {
      console.error("Check questionnaire status error:", error);
      return {
        success: false,
        message: "Network error occurred",
        data: { is_submitted: false },
      };
    }
  }

  /**
   * Get PCF BOM list for auto-population
   */
  async getPCFBOMListToAutoPopulate(
    bom_pcf_id: string,
    sup_id: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/auto-populate-bom-details?bom_pcf_id=${encodeURIComponent(bom_pcf_id)}&sup_id=${encodeURIComponent(sup_id)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "BOM data fetched successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch BOM data",
        };
      }
    } catch (error) {
      console.error("Get PCF BOM list error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Create a new supplier questionnaire
   */
  async createQuestionnaire(
    data: SupplierQuestionnaireData,
    sup_id?: string,
    bom_pcf_id?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const payload = this.mapToApiPayload(data, sup_id, bom_pcf_id);
      const response = await fetch(
        `${API_BASE_URL}/api/create-supplier-input-questions`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "Questionnaire created successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to create questionnaire",
        };
      }
    } catch (error) {
      console.error("Create questionnaire error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Update an existing supplier questionnaire
   */
  async updateQuestionnaire(
    sgiq_id: string,
    data: SupplierQuestionnaireData
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const payload = this.mapToApiPayload(data);
      const response = await fetch(
        `${API_BASE_URL}/api/update-supplier-input-questions`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ sgiq_id, ...payload }),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "Questionnaire updated successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to update questionnaire",
        };
      }
    } catch (error) {
      console.error("Update questionnaire error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get questionnaire by ID
   */
  async getQuestionnaireById(
    sgiq_id: string,
    user_id: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Validate parameters
      if (!sgiq_id || sgiq_id.trim() === "") {
        console.error("getQuestionnaireById: sgiq_id is missing or empty");
        return {
          success: false,
          message: "Questionnaire ID (sgiq_id) is required",
        };
      }

      if (!user_id || user_id.trim() === "") {
        console.error("getQuestionnaireById: user_id is missing or empty");
        return {
          success: false,
          message: "User ID (user_id) is required",
        };
      }

      const url = `${API_BASE_URL}/api/supplier-input-questions-get-by-id?sgiq_id=${encodeURIComponent(sgiq_id)}&user_id=${encodeURIComponent(user_id)}`;
      console.log("Fetching questionnaire from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        const mappedData = this.mapFromApiResponse(result.data);
        return {
          success: true,
          message: result.message || "Questionnaire fetched successfully",
          data: mappedData,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch questionnaire",
        };
      }
    } catch (error) {
      console.error("Get questionnaire error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get list of all questionnaires
   */
  async listQuestionnaires(): Promise<{
    success: boolean;
    message: string;
    data?: any[];
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier-input-questions-list`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "Questionnaires fetched successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch questionnaires",
        };
      }
    } catch (error) {
      console.error("List questionnaires error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get DQR details by questionnaire ID
   */
  async getDQRDetailsById(
    sgiq_id: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dqr-rating/get-by-id?sgiq_id=${sgiq_id}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "DQR details fetched successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch DQR details",
        };
      }
    } catch (error) {
      console.error("Get DQR details error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get all DQR ratings with pagination
   */
  async listDQRRatings(
    pageNumber: number = 1,
    pageSize: number = 20,
    bomPcfId?: string,
    search?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
    pagination?: { page: number; limit: number; totalRecords: number; totalPages: number; totalCount: number };
    dqr_summary?: { total_dqr_count: number; pending_dqr_count: number; completed_dqr_count: number };
  }> {
    try {
      let url = `${API_BASE_URL}/api/dqr-rating/list?pageNumber=${pageNumber}&pageSize=${pageSize}`;
      if (bomPcfId) {
        url += `&bom_pcf_id=${encodeURIComponent(bomPcfId)}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await fetch(
        url,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse & { pagination?: any; dqr_summary?: any } = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "DQR ratings fetched successfully",
          data: result.data,
          pagination: result.pagination,
          dqr_summary: result.dqr_summary,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch DQR ratings",
        };
      }
    } catch (error) {
      console.error("List DQR ratings error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get localStorage key for a specific supplier + BOM PCF combination
   */
  private getDraftKey(supId?: string | null, bomPcfId?: string | null): string {
    const parts = ["supplier_questionnaire_draft"];
    if (supId) parts.push(supId);
    if (bomPcfId) parts.push(bomPcfId);
    return parts.join("_");
  }

  /**
   * Save draft questionnaire (to localStorage)
   */
  saveDraft(data: any, stepIndex: number, supId?: string | null, bomPcfId?: string | null): void {
    try {
      const draftData = {
        formData: data,
        currentStep: stepIndex,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(
        this.getDraftKey(supId, bomPcfId),
        JSON.stringify(draftData)
      );
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }

  /**
   * Load draft questionnaire (from localStorage)
   */
  loadDraft(supId?: string | null, bomPcfId?: string | null): { formData: any; currentStep: number } | null {
    try {
      const draft = localStorage.getItem(this.getDraftKey(supId, bomPcfId));
      if (draft) {
        return JSON.parse(draft);
      }
      return null;
    } catch (error) {
      console.error("Error loading draft:", error);
      return null;
    }
  }

  /**
   * Clear draft questionnaire
   */
  clearDraft(supId?: string | null, bomPcfId?: string | null): void {
    try {
      localStorage.removeItem(this.getDraftKey(supId, bomPcfId));
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  }

  /**
   * Get list of all supplier questionnaires
   */
  async getQuestionnairesList(
    user_id: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier-input-questions-list?user_id=${user_id}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "Questionnaires list retrieved successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to retrieve questionnaires list",
        };
      }
    } catch (error) {
      console.error("Get questionnaires list error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get list of all DQR ratings with pagination
   */
  async getDQRList(
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
    pagination?: { page: number; limit: number; totalRecords: number; totalPages: number };
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dqr-rating/list?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse & { pagination?: any } = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "DQR list retrieved successfully",
          data: result.data,
          pagination: result.pagination,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to retrieve DQR list",
        };
      }
    } catch (error) {
      console.error("Get DQR list error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Save DQR rating (legacy method - kept for backward compatibility)
   * @param bom_pcf_id - BOM PCF ID
   * @param type - Type of DQR rating (e.g., "dqr_raw_material_product_rating")
   * @param ratings - Array of DQR rating objects
   */
  async saveDQRRating(
    bom_pcf_id: string,
    type: string,
    ratings: any[]
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const payload: any = {
        bom_pcf_id,
        type,
        [type]: ratings,
      };

      const response = await fetch(`${API_BASE_URL}/api/dqr-rating/add`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "DQR rating saved successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to save DQR rating",
        };
      }
    } catch (error) {
      console.error("Save DQR rating error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Update DQR ratings for a specific question type
   * Uses the new API structure: POST /api/dqr-rating/update
   * @param type - Question type (e.g., "q9", "q16", "q17", etc.)
   * @param records - Array of DQR rating record objects
   */
  async updateDQRRating(
    type: string,
    records: Array<Record<string, any>>
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Convert display key to API key (e.g., q15_1 -> q151)
      const apiType = getApiKey(type);
      const payload = {
        type: apiType,
        records,
      };

      const response = await fetch(`${API_BASE_URL}/api/dqr-rating/update`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "DQR rating updated successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to update DQR rating",
        };
      }
    } catch (error) {
      console.error("Update DQR rating error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }
  /**
   * Create a new client sustainability questionnaire
   * Uses product_id instead of bom_id, product_name/product_code instead of component_name/mpn
   */
  async createClientQuestionnaire(
    data: SupplierQuestionnaireData,
    client_id: string,
    product_id: string,
    bom_pcf_id: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const payload = this.mapToClientApiPayload(data, client_id, product_id, bom_pcf_id);
      const response = await fetch(
        `${API_BASE_URL}/api/product/add-client-sustainability-data`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "Client questionnaire created successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to create client questionnaire",
        };
      }
    } catch (error) {
      console.error("Create client questionnaire error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  // Helper to map UI data to Client API payload (uses product_id instead of bom_id)
  private mapToClientApiPayload(
    data: SupplierQuestionnaireData,
    client_id: string,
    product_id: string,
    bom_pcf_id: string
  ): any {
    // Get the base payload from supplier mapping (without sup_id/bom_pcf_id)
    const basePayload = this.mapToApiPayload(data);

    // Transform the payload for client use:
    // 1. Add client_id at root level
    // 2. Add client_id and bom_pcf_id in supplier_general_info_questions
    // 3. Replace bom_id with product_id in all arrays
    // 4. Keep component_name as is (backend expects component_name for some fields)

    const clientPayload = {
      ...basePayload,
      client_id,
      supplier_general_info_questions: {
        ...basePayload.supplier_general_info_questions,
        bom_pcf_id,
        client_id,
      },
      supplier_product_questions: {
        ...basePayload.supplier_product_questions,
        // Replace bom_id with product_id in production_site_details_questions
        production_site_details_questions: this.ensureArray(basePayload.supplier_product_questions?.production_site_details_questions)
          .map((item: any) => {
            const { bom_id, mpn, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in product_component_manufactured_questions
        product_component_manufactured_questions: this.ensureArray(basePayload.supplier_product_questions?.product_component_manufactured_questions)
          .map((item: any) => {
            const { bom_id, mpn, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in co_product_component_economic_value_questions
        co_product_component_economic_value_questions: this.ensureArray(basePayload.supplier_product_questions?.co_product_component_economic_value_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
      },
      scope_two_indirect_emissions_questions: {
        ...basePayload.scope_two_indirect_emissions_questions,
        // Replace bom_id with product_id in energy_intensity questions
        energy_intensity_of_production_estimated_kwhor_mj_questions: this.ensureArray(basePayload.scope_two_indirect_emissions_questions?.energy_intensity_of_production_estimated_kwhor_mj_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in weight_of_samples_destroyed_questions
        weight_of_samples_destroyed_questions: this.ensureArray(basePayload.scope_two_indirect_emissions_questions?.weight_of_samples_destroyed_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in defect_or_rejection_rate questions
        defect_or_rejection_rate_identified_by_quality_control_questions: this.ensureArray(basePayload.scope_two_indirect_emissions_questions?.defect_or_rejection_rate_identified_by_quality_control_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in rework_rate questions
        rework_rate_due_to_quality_control_questions: this.ensureArray(basePayload.scope_two_indirect_emissions_questions?.rework_rate_due_to_quality_control_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in waste_generated questions
        weight_of_quality_control_waste_generated_questions: this.ensureArray(basePayload.scope_two_indirect_emissions_questions?.weight_of_quality_control_waste_generated_questions)
          .map((item: any) => {
            const { bom_id, mpn, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
      },
      scope_three_other_indirect_emissions_questions: {
        ...basePayload.scope_three_other_indirect_emissions_questions,
        // Replace bom_id with product_id in raw_materials questions
        raw_materials_used_in_component_manufacturing_questions: this.ensureArray(basePayload.scope_three_other_indirect_emissions_questions?.raw_materials_used_in_component_manufacturing_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in recycled_materials questions
        recycled_materials_with_percentage_questions: this.ensureArray(basePayload.scope_three_other_indirect_emissions_questions?.recycled_materials_with_percentage_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in packaging materials questions
        type_of_pack_mat_used_for_delivering_questions: this.ensureArray(basePayload.scope_three_other_indirect_emissions_questions?.type_of_pack_mat_used_for_delivering_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in weight_of_packaging questions
        weight_of_packaging_per_unit_product_questions: this.ensureArray(basePayload.scope_three_other_indirect_emissions_questions?.weight_of_packaging_per_unit_product_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in packaging waste questions
        weight_of_pro_packaging_waste_questions: this.ensureArray(basePayload.scope_three_other_indirect_emissions_questions?.weight_of_pro_packaging_waste_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in by_product questions
        type_of_by_product_questions: this.ensureArray(basePayload.scope_three_other_indirect_emissions_questions?.type_of_by_product_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in co2 emission questions
        co_two_emission_of_raw_material_questions: this.ensureArray(basePayload.scope_three_other_indirect_emissions_questions?.co_two_emission_of_raw_material_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
        // Replace bom_id with product_id in transport questions
        mode_of_transport_used_for_transportation_questions: this.ensureArray(basePayload.scope_three_other_indirect_emissions_questions?.mode_of_transport_used_for_transportation_questions)
          .map((item: any) => {
            const { bom_id, ...rest } = item;
            return {
              product_id,
              ...rest,
            };
          }),
      },
    };

    return clientPayload;
  }

  /**
   * Upload supplier image or file
   * POST /api/upload-supplier-image-or-file
   */
  async uploadSupplierFile(file: File): Promise<{
    success: boolean;
    message?: string;
    url?: string;
    key?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${API_BASE_URL}/api/upload-supplier-image-or-file`,
        {
          method: "POST",
          headers: {
            Authorization: authService.getToken() || "",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          message: data.message || "Uploaded successfully",
          url: data.url,
          key: data.key,
        };
      }

      return {
        success: false,
        message: data.message || "Upload failed",
      };
    } catch (error) {
      console.error("Error uploading supplier file:", error);
      return {
        success: false,
        message: "An error occurred while uploading file",
      };
    }
  }

  /**
   * Fetch supplier file by key
   * GET /api/get-image?key=...
   */
  async fetchSupplierFile(fileKey: string): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get-image?key=${encodeURIComponent(fileKey)}`,
        {
          method: "GET",
          headers: {
            Authorization: authService.getToken() || "",
          },
        }
      );

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          url: data.url,
        };
      }

      return {
        success: false,
        message: data.message || "Failed to fetch file",
      };
    } catch (error) {
      console.error("Error fetching supplier file:", error);
      return {
        success: false,
        message: "An error occurred while fetching file",
      };
    }
  }

  /**
   * Update data collection question stage when supplier starts filling the questionnaire
   */
  async updateDataCollectionQuestionStage(
    bom_pcf_id: string,
    sup_id: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/update-data-collection-question-stage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authService.getToken() || "",
          },
          body: JSON.stringify({
            bom_pcf_id,
            sup_id,
          }),
        }
      );

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          message: data.message,
        };
      }

      return {
        success: false,
        message: data.message || "Failed to update data collection stage",
      };
    } catch (error) {
      console.error("Error updating data collection question stage:", error);
      return {
        success: false,
        message: "An error occurred while updating data collection stage",
      };
    }
  }
}

export const supplierQuestionnaireService = new SupplierQuestionnaireService();
export default supplierQuestionnaireService;
