import type {
  ManufacturerOnboarding,
  SupplierOnboarding,
  OnboardingListResponse,
} from "../types/userManagement";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

class UserManagementService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    };
  }

  // ==================== MANUFACTURER ONBOARDING ====================

  async getManufacturerList(
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<{
    success: boolean;
    data: ManufacturerOnboarding[];
    totalCount: number;
    pagination?: { total: number; page: number; limit: number; totalPages: number };
    message: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/manufacturer/onboarding/list?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data: OnboardingListResponse<ManufacturerOnboarding> =
        await response.json();

      if (data.status && data.data) {
        // API returns { data: { data: [...], pagination: { total, page, limit, totalPages } } }
        const rows = data.data.data || data.data.rows || [];
        const paginationData = (data.data as any).pagination;
        return {
          success: true,
          data: Array.isArray(rows) ? rows : [],
          totalCount: paginationData?.total || data.data.totalCount || 0,
          pagination: paginationData,
          message: data.message,
        };
      }

      return {
        success: false,
        data: [],
        totalCount: 0,
        message: data.message || "Failed to fetch manufacturers",
      };
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
      return {
        success: false,
        data: [],
        totalCount: 0,
        message: "Network error occurred",
      };
    }
  }

  async getManufacturerById(id: string): Promise<{
    success: boolean;
    data: ManufacturerOnboarding | null;
    message: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/manufacturer/onboarding/get-by-id?id=${id}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      }

      return {
        success: false,
        data: null,
        message: data.message || "Failed to fetch manufacturer",
      };
    } catch (error) {
      console.error("Error fetching manufacturer:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  async createManufacturer(
    manufacturer: Partial<ManufacturerOnboarding>
  ): Promise<{ success: boolean; data: ManufacturerOnboarding | null; message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/manufacturer/onboarding/create`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(manufacturer),
        }
      );

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      }

      return {
        success: false,
        data: null,
        message: data.message || "Failed to create manufacturer",
      };
    } catch (error) {
      console.error("Error creating manufacturer:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  async updateManufacturer(
    manufacturer: Partial<ManufacturerOnboarding> & { id: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/manufacturer/onboarding/update`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(manufacturer),
        }
      );

      const data = await response.json();

      return {
        success: data.status || false,
        message: data.message || "Failed to update manufacturer",
      };
    } catch (error) {
      console.error("Error updating manufacturer:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  async deleteManufacturer(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/manufacturer/onboarding/delete`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      return {
        success: data.status || false,
        message: data.message || "Failed to delete manufacturer",
      };
    } catch (error) {
      console.error("Error deleting manufacturer:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  // ==================== SUPPLIER ONBOARDING ====================

  async getSupplierList(
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<{
    success: boolean;
    data: SupplierOnboarding[];
    totalCount: number;
    pagination?: { total: number; page: number; limit: number; totalPages: number };
    message: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/onboarding/list?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data: OnboardingListResponse<SupplierOnboarding> =
        await response.json();

      if (data.status && data.data) {
        // API returns { data: { data: [...], pagination: { total, page, limit, totalPages } } }
        const rows = data.data.data || data.data.rows || [];
        const paginationData = (data.data as any).pagination;
        return {
          success: true,
          data: Array.isArray(rows) ? rows : [],
          totalCount: paginationData?.total || data.data.totalCount || 0,
          pagination: paginationData,
          message: data.message,
        };
      }

      return {
        success: false,
        data: [],
        totalCount: 0,
        message: data.message || "Failed to fetch suppliers",
      };
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      return {
        success: false,
        data: [],
        totalCount: 0,
        message: "Network error occurred",
      };
    }
  }

  async getSupplierById(id: string): Promise<{
    success: boolean;
    data: SupplierOnboarding | null;
    message: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/onboarding/get-by-id?id=${id}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      }

      return {
        success: false,
        data: null,
        message: data.message || "Failed to fetch supplier",
      };
    } catch (error) {
      console.error("Error fetching supplier:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  async createSupplier(
    supplier: Partial<SupplierOnboarding>
  ): Promise<{ success: boolean; data: SupplierOnboarding | null; message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/onboarding/create`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(supplier),
        }
      );

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      }

      return {
        success: false,
        data: null,
        message: data.message || "Failed to create supplier",
      };
    } catch (error) {
      console.error("Error creating supplier:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  async updateSupplier(
    supplier: Partial<SupplierOnboarding> & { sup_id: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/onboarding/update`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(supplier),
        }
      );

      const data = await response.json();

      return {
        success: data.status || false,
        message: data.message || "Failed to update supplier",
      };
    } catch (error) {
      console.error("Error updating supplier:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  async deleteSupplier(sup_id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/onboarding/delete`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ sup_id }),
        }
      );

      const data = await response.json();

      return {
        success: data.status || false,
        message: data.message || "Failed to delete supplier",
      };
    } catch (error) {
      console.error("Error deleting supplier:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  async checkSupplierOnboardingStatus(supplierId: string): Promise<{
    isOnboarded: boolean;
    supplierData: SupplierOnboarding | null;
    message: string;
  }> {
    try {
      const result = await this.getSupplierById(supplierId);

      if (result.success && result.data) {
        // Check if supplier has completed onboarding (has required fields filled)
        const supplier = result.data;
        const isOnboarded = !!(
          supplier.supplier_company_name &&
          supplier.supplier_email &&
          supplier.supplier_city &&
          supplier.supplier_country
        );

        return {
          isOnboarded,
          supplierData: supplier,
          message: isOnboarded ? "Supplier is onboarded" : "Supplier onboarding incomplete",
        };
      }

      // If supplier not found, they need to onboard
      return {
        isOnboarded: false,
        supplierData: null,
        message: "Supplier not found - onboarding required",
      };
    } catch (error) {
      console.error("Error checking supplier onboarding status:", error);
      return {
        isOnboarded: false,
        supplierData: null,
        message: "Error checking onboarding status",
      };
    }
  }

  async onboardSupplierPublic(
    supplier: Partial<SupplierOnboarding> & { sup_id: string }
  ): Promise<{ success: boolean; data: SupplierOnboarding | null; message: string }> {
    try {
      // Try to update existing supplier record
      const response = await fetch(
        `${API_BASE_URL}/api/supplier/onboarding/update`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(supplier),
        }
      );

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          data: data.data || supplier as SupplierOnboarding,
          message: data.message || "Supplier onboarded successfully",
        };
      }

      return {
        success: false,
        data: null,
        message: data.message || "Failed to onboard supplier",
      };
    } catch (error) {
      console.error("Error onboarding supplier:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  // ==================== FILE UPLOAD ====================

  async uploadOnboardingFile(file: File): Promise<{
    success: boolean;
    url: string | null;
    key: string | null;
    message: string;
  }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/onboarding-forms-image-or-file`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: token } : {}),
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          url: data.url,
          key: data.key,
          message: data.message,
        };
      }

      return {
        success: false,
        url: null,
        key: null,
        message: data.message || "Failed to upload file",
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        url: null,
        key: null,
        message: "Network error occurred",
      };
    }
  }

  getOnboardingFileUrl(key: string): string {
    return `${API_BASE_URL}/api/onboarding-forms-get-image?key=${encodeURIComponent(key)}`;
  }
}

export const userManagementService = new UserManagementService();
export default userManagementService;
