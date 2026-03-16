/**
 * Service for PCF BOM API Integration
 */

import authService from "./authService";
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

// PCF BOM List Response
export interface PCFBOMListResponse {
  success: boolean;
  message: string;
  data: PCFBOMItem[];
  current_page: number;
  total_pages: number;
  total_count: number;
}

// PCF BOM Item structure
export interface PCFBOMItem {
  id: string;
  code: string;
  product_category_id: string;
  component_category_id: string;
  component_type_id: string;
  product_code: string;
  manufacturer_id: string | null;
  model_version: string;
  update_date: string;
  created_date: string;
  created_by: string;
  updated_by: string | null;
  product_category_code: string;
  product_category_name: string;
  component_category_code: string;
  component_category_name: string;
  component_type_code: string;
  component_type_name: string;
  manufacturer_code: string | null;
  manufacturer_name: string | null;
  manufacturer_address: string | null;
  manufacturer_lat: number | null;
  manufacturer_long: number | null;
  created_by_name: string;
  updated_by_name: string | null;
  boms?: any[];
}

// Upload response interface
export interface UploadResponse {
  status: boolean;
  message: string;
  url: string;
  key: string;
}

class PCFService {
  private getHeaders() {
    const token = authService.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `${token}` } : {}),
    };
  }

  /**
   * Upload BOM image or file
   * POST /api/upload-bom-image-or-file
   */
  async uploadBOMFile(file: File): Promise<{
    success: boolean;
    message: string;
    url?: string;
    key?: string;
  }> {
    try {
      const token = authService.getToken();
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_BASE_URL}/api/upload-bom-image-or-file`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "File uploaded successfully",
          url: result.url,
          key: result.key,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to upload file",
        };
      }
    } catch (error) {
      console.error("Upload BOM file error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get image URL by key (for reference only - use fetchImage for actual fetching)
   * GET /api/get-image?key=...
   */
  getImageUrl(key: string): string {
    return `${API_BASE_URL}/api/get-image?key=${encodeURIComponent(key)}`;
  }

  /**
   * Fetch image/file by key and return signed URL for preview/download
   * GET /api/get-image?key=...
   * Returns: { status: true, url: "signed-url" }
   */
  async fetchImage(key: string): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/get-image?key=${encodeURIComponent(key)}`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          message: "Failed to fetch image",
        };
      }

      const result = await response.json();
      
      if (result.status && result.url) {
        return {
          success: true,
          url: result.url,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to get image URL",
        };
      }
    } catch (error) {
      console.error("Fetch image error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get list of PCF BOM requests with optional filters
   */
  async getPCFBOMList(
    pageNumber: number = 1,
    pageSize: number = 20,
    filters?: {
      is_approved?: boolean;
      is_rejected?: boolean;
      is_draft?: boolean | null;
      code?: string;
      request_title?: string;
      product_category?: string;
      component_category?: string;
      component_type?: string;
      manufacturer?: string;
      search?: string;
      from_date?: string; // YYYY-MM-DD format
      to_date?: string;   // YYYY-MM-DD format
      pcf_status?: string; // In Progress, Open, Draft, Completed, Rejected
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: PCFBOMItem[];
    current_page?: number;
    total_pages?: number;
    total_count?: number;
    stats?: {
      total_pcf_count?: string;
      approved_count?: string;
      in_progress_count?: string;
      rejected_count?: string;
      draft_count?: string;
      pending_count?: string;
    };
  }> {
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("pageNumber", pageNumber.toString());
      params.append("pageSize", pageSize.toString());

      // Add filters if provided
      if (filters) {
        if (filters.is_approved !== undefined) params.append("is_approved", filters.is_approved.toString());
        if (filters.is_rejected !== undefined) params.append("is_rejected", filters.is_rejected.toString());
        if (filters.is_draft !== undefined && filters.is_draft !== null) params.append("is_draft", filters.is_draft.toString());
        if (filters.code) params.append("code", filters.code);
        if (filters.request_title) params.append("request_title", filters.request_title);
        if (filters.product_category) params.append("product_category", filters.product_category);
        if (filters.component_category) params.append("component_category", filters.component_category);
        if (filters.component_type) params.append("component_type", filters.component_type);
        if (filters.manufacturer) params.append("manufacturer", filters.manufacturer);
        if (filters.search) params.append("search", filters.search);
        if (filters.from_date) params.append("from_date", filters.from_date);
        if (filters.to_date) params.append("to_date", filters.to_date);
        if (filters.pcf_status) params.append("pcf_status", filters.pcf_status);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/pcf-bom/list?${params.toString()}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: any = await response.json();

      // Debug logging
      console.log("PCF Service Response:", result);

      if (result.status || result.success) {
        // Response format: { status: true, message: "...", data: { success: true, page: 1, pageSize: 10, data: [...] } }
        // The actual data array is nested at result.data.data
        let dataArray: any[] = [];
        let pageInfo: any = {};

        if (result.data) {
          // Check if data.data exists (nested structure)
          if (result.data.data && Array.isArray(result.data.data)) {
            dataArray = result.data.data;
            pageInfo = result.data;
          } 
          // Check if data is directly an array
          else if (Array.isArray(result.data)) {
            dataArray = result.data;
          }
          // Check if data is an object with a data property
          else if (result.data && typeof result.data === 'object') {
            pageInfo = result.data;
            if (Array.isArray(result.data.data)) {
              dataArray = result.data.data;
            }
          }
        }
        
        // Check for pagination object in response
        const pagination = result.pagination || pageInfo.pagination || {};

        console.log("Extracted data:", {
          dataArrayLength: dataArray.length,
          pageInfo,
          pagination,
        });

        const totalCount = pagination.total || pageInfo.total_count || pageInfo.totalCount || pageInfo.total || pageInfo.totalRecords || result.total_count || result.totalCount || dataArray.length;
        const totalPages = pagination.totalPages || pageInfo.total_pages || pageInfo.totalPages || result.total_pages || result.totalPages || Math.ceil(totalCount / pageSize);
        const currentPage = pagination.page || pageInfo.page || pageInfo.currentPage || result.current_page || 1;

        // Extract stats from API response
        const stats = result.data?.stats || pageInfo.stats || result.stats || null;

        return {
          success: true,
          message: result.message || "PCF BOM list fetched successfully",
          data: dataArray as PCFBOMItem[],
          current_page: currentPage,
          total_pages: totalPages,
          total_count: totalCount,
          stats: stats,
        };
      } else {
        console.error("PCF Service Error:", result);
        return {
          success: false,
          message: result.message || "Failed to fetch PCF BOM list",
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
   * Create a new PCF BOM request
   */
  async createPCFRequest(payload: any): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pcf-bom/create`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "PCF request created successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to create PCF request",
        };
      }
    } catch (error) {
      console.error("Create PCF request error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Update an existing PCF BOM request
   */
  async updatePCFRequest(payload: any): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pcf-bom/update`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "PCF request updated successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to update PCF request",
        };
      }
    } catch (error) {
      console.error("Update PCF request error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get PCF BOM request by ID
   */
  /**
   * Get PCF BOM request by ID
   */
  async getPCFBOMById(
    bom_pcf_id: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pcf-bom/get-by-id?bom_pcf_id=${bom_pcf_id}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "PCF BOM fetched successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch PCF BOM",
        };
      }
    } catch (error) {
      console.error("Get PCF BOM by ID error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Verify (Approve) PCF BOM request
   */
  async verifyPCFRequest(
    bom_pcf_id: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pcf-bom/verify`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          bom_pcf_id,
          is_bom_verified: true,
          is_approved: true,
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "PCF BOM verified successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to verify PCF BOM",
        };
      }
    } catch (error) {
      console.error("Verify PCF BOM error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Reject PCF BOM request
   */
  async rejectPCFRequest(
    bom_pcf_id: string,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pcf-bom/reject`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          bom_pcf_id,
          is_rejected: true,
          reject_reason: reason,
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "PCF BOM rejected successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to reject PCF BOM",
        };
      }
    } catch (error) {
      console.error("Reject PCF BOM error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Add comment to PCF BOM request
   */
  async addPCFComment(
    bom_pcf_id: string,
    comment: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pcf-bom/add-comment`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          bom_pcf_id,
          comment,
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "Comment added successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to add comment",
        };
      }
    } catch (error) {
      console.error("Add PCF comment error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Calculate PCF for BOM
   * POST /api/pcf-bom/calculate-bom
   */
  async calculatePCF(
    bom_pcf_id: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pcf-bom/calculate-bom`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ bom_pcf_id }),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "PCF calculation initiated successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to calculate PCF",
        };
      }
    } catch (error) {
      console.error("Calculate PCF error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Submit PCF request internally (final stage after result validation)
   * POST /api/pcf-bom/submit-pcf-request-internally
   */
  async submitPCFRequestInternally(
    bom_pcf_id: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pcf-bom/submit-pcf-request-internally`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ bom_pcf_id }),
      });

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "PCF request submitted internally successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to submit PCF request internally",
        };
      }
    } catch (error) {
      console.error("Submit PCF request internally error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * List comments for PCF BOM request
   */
  async listPCFComments(
    bom_pcf_id: string,
    pageNumber: number = 1,
    pageSize: number = 40
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pcf-bom/list-comment?bom_pcf_id=${bom_pcf_id}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        let comments = [];
        if (result.data && Array.isArray(result.data.data)) {
            comments = result.data.data;
        } else if (Array.isArray(result.data)) {
            comments = result.data;
        }

        return {
          success: true,
          message: result.message || "Comments fetched successfully",
          data: comments,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch comments",
        };
      }
    } catch (error) {
      console.error("List PCF comments error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get DQR list by BOM PCF ID
   * Returns list of DQR entries with sgiq_id for each supplier
   */
  async getDQRListByBomPcfId(
    bom_pcf_id: string
  ): Promise<{ success: boolean; message: string; data?: any[] }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dqr-rating/list?bom_pcf_id=${encodeURIComponent(bom_pcf_id)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: ApiResponse = await response.json();

      if (result.status || result.success) {
        return {
          success: true,
          message: result.message || "DQR list fetched successfully",
          data: result.data || [],
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch DQR list",
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
}

export const pcfService = new PCFService();
export default pcfService;

