import axios from "axios";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_URL = `${getApiBaseUrl()}/api`;

// Interfaces
export interface OwnEmissionDocument {
  id: string;
  own_emission_id: string;
  document: string;
  created_date: string;
  update_date: string;
}

export interface OwnEmission {
  id: string;
  code: string;
  product_id?: string;
  reporting_period_from: string;
  reporting_period_to: string;
  calculation_method_id: string;
  calculation_method_name?: string;
  
  // Scope 1 - Direct Emissions
  fuel_combustion_id: string;
  fuel_combustion_value: string;
  fuel_combustion_name?: string;
  process_emission_id: string;
  process_emission_value: string;
  process_emission_name?: string;
  fugitive_emission_id: string;
  fugitive_emission_value: string;
  fugitive_emission_name?: string;
  
  // Scope 2 - Indirect Emissions
  electicity_location_based_id: string;
  electicity_location_based_value: string;
  electicity_location_based_name?: string;
  electicity_market_based_id: string;
  electicity_market_based_value: string;
  electicity_market_based_name?: string;
  steam_heat_cooling_id: string;
  steam_heat_cooling_value: string;
  steam_heat_cooling_name?: string;
  
  additional_notes: string;
  supporting_document_ids?: string | null;
  supporting_documents?: OwnEmissionDocument[];
  
  created_by: string;
  created_by_name?: string;
  updated_by: string | null;
  updated_by_name?: string | null;
  created_date: string;
  update_date: string;
}

export interface OwnEmissionFormData {
  id?: string;
  product_id: string;
  reporting_period_from: string;
  reporting_period_to: string;
  calculation_method_id: string;
  
  fuel_combustion_id: string;
  fuel_combustion_value: string;
  process_emission_id: string;
  process_emission_value: string;
  fugitive_emission_id: string;
  fugitive_emission_value: string;
  
  electicity_location_based_id: string;
  electicity_location_based_value: string;
  electicity_market_based_id: string;
  electicity_market_based_value: string;
  steam_heat_cooling_id: string;
  steam_heat_cooling_value: string;
  
  additional_notes: string;
  supporting_documents?: string[];
}

export interface ContactTeamData {
  full_name: string;
  phone_number: string;
  email_address: string;
  message: string;
  product_id?: string;
}

// API Methods
const ownEmissionService = {
  // Get Own Emission by Product ID
  getByProductId: async (productId: string) => {
    const token = localStorage.getItem("token");
    try {
      // First get the list and filter by product_id
      const response = await axios.get(`${API_URL}/own-emission/list`, {
        headers: { Authorization: token },
        params: {
          pageNumber: 1,
          pageSize: 100,
        },
      });
      
      if (response.data.status && response.data.data?.data) {
        // Find the own emission for this product
        const ownEmission = response.data.data.data.find(
          (item: OwnEmission) => item.product_id === productId
        );
        return {
          status: true,
          data: ownEmission || null,
        };
      }
      return { status: false, data: null };
    } catch (error) {
      console.error("Error fetching own emission:", error);
      return { status: false, data: null };
    }
  },

  // Get Own Emission by ID
  getById: async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/own-emission/get-by-id`, {
      headers: { Authorization: token },
      params: { id },
    });
    return response.data;
  },

  // Create Own Emission
  create: async (data: OwnEmissionFormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/own-emission/add`,
      data,
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  // Update Own Emission
  update: async (data: OwnEmissionFormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/own-emission/update`,
      data,
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  // Delete Own Emission
  delete: async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/own-emission/delete-own-emission`,
      { id },
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  // Delete Supporting Document
  deleteSupportingDocument: async (documentId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/own-emission/delete-support-doc`,
      { supporting_document_id: documentId },
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  // Submit Contact Team Request
  submitContactRequest: async (data: ContactTeamData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/own-emission/support-create`,
      data,
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },
};

export default ownEmissionService;
