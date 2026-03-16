import type {
  ModulePermission,
  MainModule,
  SubModule,
} from "../types/userManagement";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

// Default modules based on menu structure
export const DEFAULT_MODULES: { name: string; description: string; subModules?: string[] }[] = [
  { name: "Dashboard", description: "Main dashboard with analytics and overview" },
  {
    name: "PCF Request",
    description: "Product Carbon Footprint request management",
    subModules: ["Create PCF", "View PCF", "Edit PCF"]
  },
  {
    name: "Product Portfolio",
    description: "Product management and portfolio",
    subModules: ["All Products", "Create Product", "Edit Product"]
  },
  { name: "Components Master", description: "Component master data management" },
  { name: "Document Master", description: "Document management system" },
  {
    name: "Task Management",
    description: "Task creation and tracking",
    subModules: ["Create Task", "View Tasks"]
  },
  { name: "Reports", description: "Report generation and viewing" },
  { name: "Data Quality Rating", description: "Data quality assessment and rating" },
  { name: "Supplier Questionnaire", description: "Supplier questionnaire management" },
  {
    name: "Settings",
    description: "System settings and configuration",
    subModules: ["Users", "Authorizations", "Data Configuration"]
  },
];

class AuthorizationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    };
  }

  // ==================== MAIN MODULES ====================

  async getMainModules(): Promise<{
    success: boolean;
    data: MainModule[];
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/main/module/get`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: Array.isArray(data.data) ? data.data : [],
          message: data.message,
        };
      }

      return {
        success: false,
        data: [],
        message: data.message || "Failed to fetch modules",
      };
    } catch (error) {
      console.error("Error fetching main modules:", error);
      return {
        success: false,
        data: [],
        message: "Network error occurred",
      };
    }
  }

  async addMainModule(
    mainModuleName: string,
    description: string
  ): Promise<{ success: boolean; data: MainModule | null; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/main/module/add`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          main_module_name: mainModuleName,
          description: description,
        }),
      });

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: Array.isArray(data.data) ? data.data[0] : data.data,
          message: data.message,
        };
      }

      return {
        success: false,
        data: null,
        message: data.message || "Failed to add module",
      };
    } catch (error) {
      console.error("Error adding main module:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  // ==================== SUB MODULES ====================

  async getSubModules(): Promise<{
    success: boolean;
    data: SubModule[];
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submodule/get`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: Array.isArray(data.data) ? data.data : [],
          message: data.message,
        };
      }

      return {
        success: false,
        data: [],
        message: data.message || "Failed to fetch submodules",
      };
    } catch (error) {
      console.error("Error fetching submodules:", error);
      return {
        success: false,
        data: [],
        message: "Network error occurred",
      };
    }
  }

  async addSubModule(
    moduleName: string,
    description: string,
    mainModuleId: string
  ): Promise<{ success: boolean; data: SubModule | null; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submodule/add`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          module_name: moduleName,
          description: description,
          main_module_id: mainModuleId,
        }),
      });

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: Array.isArray(data.data) ? data.data[0] : data.data,
          message: data.message,
        };
      }

      return {
        success: false,
        data: null,
        message: data.message || "Failed to add submodule",
      };
    } catch (error) {
      console.error("Error adding submodule:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  // ==================== PERMISSIONS ====================

  async getAllPermissions(): Promise<{
    success: boolean;
    data: ModulePermission[];
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/permission/get`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: Array.isArray(data.data) ? data.data : [],
          message: data.message,
        };
      }

      return {
        success: false,
        data: [],
        message: data.message || "Failed to fetch permissions",
      };
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return {
        success: false,
        data: [],
        message: "Network error occurred",
      };
    }
  }

  async getPermissionsByUserId(userId: string): Promise<{
    success: boolean;
    data: ModulePermission[];
    message: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/permission/getById?user_id=${userId}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          data: Array.isArray(data.data) ? data.data : [],
          message: data.message,
        };
      }

      return {
        success: false,
        data: [],
        message: data.message || "Failed to fetch user permissions",
      };
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      return {
        success: false,
        data: [],
        message: "Network error occurred",
      };
    }
  }

  async addPermission(permission: Omit<ModulePermission, "permission_id">): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/permission/add`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(permission),
      });

      const data = await response.json();

      return {
        success: data.status || false,
        message: data.message || "Failed to add permission",
      };
    } catch (error) {
      console.error("Error adding permission:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  async updatePermissions(permissions: ModulePermission[]): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const token = localStorage.getItem("token");

      // Debug: Log what we're sending to the API
      console.log("[AuthService] Updating permissions - payload:", JSON.stringify(permissions, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/user/permission/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify(permissions),
      });

      const data = await response.json();

      // Debug: Log the response
      console.log("[AuthService] Update response:", data);

      return {
        success: data.status || false,
        message: data.message || "Failed to update permissions",
      };
    } catch (error) {
      console.error("Error updating permissions:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  // ==================== SEED MODULES ====================

  async seedDefaultModules(): Promise<{
    success: boolean;
    message: string;
    created: string[];
    failed: string[];
  }> {
    const created: string[] = [];
    const failed: string[] = [];

    for (const module of DEFAULT_MODULES) {
      const result = await this.addMainModule(module.name, module.description);

      if (result.success && result.data) {
        created.push(module.name);

        // Add submodules if any
        if (module.subModules && module.subModules.length > 0) {
          for (const subModule of module.subModules) {
            const subResult = await this.addSubModule(
              subModule,
              `${subModule} under ${module.name}`,
              result.data.main_module_id
            );

            if (subResult.success) {
              created.push(`  - ${subModule}`);
            } else {
              failed.push(`  - ${subModule}: ${subResult.message}`);
            }
          }
        }
      } else {
        failed.push(`${module.name}: ${result.message}`);
      }
    }

    return {
      success: failed.length === 0,
      message:
        failed.length === 0
          ? "All modules seeded successfully"
          : `Some modules failed to seed`,
      created,
      failed,
    };
  }

  // ==================== ROLES ====================

  async getRoles(search: string = ""): Promise<{
    success: boolean;
    data: { role_id: string; role_name: string; description?: string; role_code?: string }[];
    message: string;
  }> {
    try {
      const url = search
        ? `${API_BASE_URL}/api/roles/get?search=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/api/roles/get`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.status && data.data) {
        const roles = data.data.data || data.data.rows || data.data || [];
        return {
          success: true,
          data: Array.isArray(roles) ? roles : [],
          message: data.message,
        };
      }

      return {
        success: false,
        data: [],
        message: data.message || "Failed to fetch roles",
      };
    } catch (error) {
      console.error("Error fetching roles:", error);
      return {
        success: false,
        data: [],
        message: "Network error occurred",
      };
    }
  }

  async getRoleById(roleId: string): Promise<{
    success: boolean;
    data: { role_id: string; role_name: string; description?: string; role_code?: string } | null;
    message: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get-role-by-id?role_id=${roleId}`,
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
        message: data.message || "Failed to fetch role",
      };
    } catch (error) {
      console.error("Error fetching role:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  async createRole(role: {
    role_name: string;
    description?: string;
    role_code?: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-role`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(role),
      });

      const data = await response.json();

      return {
        success: data.status || false,
        data: data.data || null,
        message: data.message || "Failed to create role",
      };
    } catch (error) {
      console.error("Error creating role:", error);
      return {
        success: false,
        data: null,
        message: "Network error occurred",
      };
    }
  }

  async updateRole(roles: {
    role_id: string;
    role_name: string;
    description?: string;
    role_code?: string;
  }[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/update-role`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(roles),
      });

      const data = await response.json();

      return {
        success: data.status || false,
        message: data.message || "Failed to update role",
      };
    } catch (error) {
      console.error("Error updating role:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  async deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-role`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ role_id: roleId }),
      });

      const data = await response.json();

      return {
        success: data.status || false,
        message: data.message || "Failed to delete role",
      };
    } catch (error) {
      console.error("Error deleting role:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  // ==================== HELPER METHODS ====================

  // Check if user has permission for a specific module and action
  hasPermission(
    permissions: ModulePermission[],
    moduleName: string,
    action: "create" | "read" | "update" | "delete"
  ): boolean {
    const modulePermission = permissions.find(
      (p) => p.module_name.toLowerCase() === moduleName.toLowerCase()
    );

    if (!modulePermission) {
      return false;
    }

    return modulePermission[action] === true;
  }

  // Get all module names from permissions
  getAccessibleModules(permissions: ModulePermission[]): string[] {
    return permissions
      .filter((p) => p.read)
      .map((p) => p.module_name);
  }
}

export const authorizationService = new AuthorizationService();
export default authorizationService;
