import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

export interface PCFDocumentItem {
  id: string;
  code: string;
  request_title: string;
  priority: string;
  request_organization: string;
  due_date: string;
  request_description: string;
  product_code: string;
  model_version: string;
  status: string;
  technical_specification_file: string[];
  product_images: string[];
  created_by: string;
  updated_by: string | null;
  update_date: string;
  created_date: string;
  product_category: {
    id: string;
    code: string;
    name: string;
  } | null;
  component_category: {
    id: string;
    code: string;
    name: string;
  } | null;
  component_type: {
    id: string;
    code: string;
    name: string;
  } | null;
  manufacturer: {
    id: string;
    code: string;
    name: string;
  } | null;
  createdby: {
    user_id: string;
    user_name: string;
  } | null;
  product_specifications: {
    id: string;
    specification_name: string;
    specification_unit: string;
    specification_value: string;
  }[];
}

export interface DocumentStats {
  total_pcf_count: string;
  approved_count: string;
  in_progress_count: string;
  rejected_count: string;
  draft_count: string;
  pending_count: string;
}

export interface DocumentListResponse {
  status: boolean;
  message: string;
  code: number;
  data: {
    page: number;
    pageSize: number;
    totalCount: number;
    data: PCFDocumentItem[];
    stats?: DocumentStats;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface UpdateDocumentsPayload {
  id: string;
  technical_specification_file: string[];
  product_images: string[];
}

export interface UpdateDocumentsResponse {
  status: boolean;
  message: string;
  code: number;
  data: any[];
}

class DocumentMasterService {
  private getHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `${token}`,
    };
  }

  async getDocumentList(
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<DocumentListResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/document-master/list?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error fetching document list:", error);
      return {
        status: false,
        message: "Failed to fetch document list",
        code: 500,
        data: {
          page: 1,
          pageSize: pageSize,
          totalCount: 0,
          data: [],
        },
      };
    }
  }

  async getFileUrl(key: string): Promise<{ success: boolean; url: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get-image?key=${encodeURIComponent(key)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );
      const result = await response.json();
      return {
        success: result.status,
        url: result.url || "",
      };
    } catch (error) {
      console.error("Error getting file URL:", error);
      return {
        success: false,
        url: "",
      };
    }
  }

  async updateDocuments(
    payload: UpdateDocumentsPayload
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/document-master/update-documents`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      return {
        success: result.status,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      console.error("Error updating documents:", error);
      return {
        success: false,
        message: "Failed to update documents",
        data: null,
      };
    }
  }
}

export const documentMasterService = new DocumentMasterService();
