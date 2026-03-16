import type {
  ApiResponse,
  Department,
  LoginRequest,
  Role,
  SignupRequest,
  User,
} from "../types";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

// MFA Response interface
interface MFAResponse {
  success: boolean;
  message: string;
  qrCode?: string;
  manualCode?: string;
  localIP?: string;
}

// MFA Verification Response
interface MFAVerificationResponse {
  status: boolean;
  message: string;
  code: number;
  data: {
    token: string;
    user_id: string;
    user_name: string;
    user_role: string;
    user_email: string;
    user_phone_number: string;
    user_department: string;
  };
}

class AuthService {
  private token: string | null = localStorage.getItem("token");
  private user: User | null = null;

  constructor() {
    // Try to restore user from localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser && this.token) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        this.logout();
      }
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Login user
  async login(credentials: LoginRequest): Promise<{
    success: boolean;
    user?: User;
    message: string;
    requiresMFA?: boolean;
    mfaData?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log("Login response:", data);
      console.log("Response status:", response.status);
      console.log("Data structure:", JSON.stringify(data, null, 2));

      // Handle different response formats
      if (data.success && data.manualCode) {
        // Handle direct MFA response format (your current backend response)
        console.log("Direct MFA response detected:", data);
        return {
          success: true,
          requiresMFA: true,
          mfaData: data,
          message: data.message,
        };
      } else if (data.status && data.data) {
        // Check if MFA is required in nested format
        console.log("Checking MFA requirement:", data.data.requiresMFA);
        if (data.data.requiresMFA) {
          console.log("MFA required, returning MFA data:", data.data);
          return {
            success: true,
            requiresMFA: true,
            mfaData: data.data,
            message: data.message,
          };
        }

        // Regular login success
        const userData = data.data;

        // Create user object
        const user: User = {
          id: userData.user_id, // Primary ID from backend
          userId: userData.user_id, // Explicitly keep userId for components
          name: userData.user_name,
          email: userData.user_email,
          role: userData.user_role,
          department: userData.user_department,
          phoneNumber: userData.user_phone_number,
          maxDiscountPercent: userData.user_max_dis_per,
          minDiscountPercent: userData.user_min_dis_per,
          storeId: userData.store_id,
        };

        // Store token and user data
        if (userData.token && typeof userData.token === "string") {
          this.token = userData.token;
          this.user = user;
          localStorage.setItem("token", this.token || "");
          localStorage.setItem("user", JSON.stringify(this.user));
        }

        return {
          success: true,
          user: user,
          message: data.message,
        };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Verify MFA
  async verifyMFA(
    email: string,
    mfaToken: string
  ): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_email: email, token: mfaToken }),
      });

      const data: MFAVerificationResponse = await response.json();

      if (data.status && data.data) {
        this.token = data.data.token;
        this.user = {
          id: data.data.user_id, // Use UUID as primary ID
          userId: data.data.user_id, // Store backend user_id separately
          name: data.data.user_name,
          email: data.data.user_email,
          role: data.data.user_role,
          department: data.data.user_department,
          phoneNumber: data.data.user_phone_number,
        };

        // Save to localStorage
        localStorage.setItem("token", this.token);
        localStorage.setItem("user", JSON.stringify(this.user));

        return { success: true, user: this.user, message: data.message };
      } else {
        return {
          success: false,
          message: data.message || "MFA verification failed",
        };
      }
    } catch (error) {
      console.error("MFA verification error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Signup user
  async signup(
    userData: SignupRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/api/user/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      // Handle both response formats: {status: true} and {success: true}
      if (data.status || data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Signup failed" };
      }
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Forgot password
  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/forgot/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_email: email }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return {
          success: false,
          message: data.message || "Failed to send reset email",
        };
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Reset password
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/reset/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          user_password: newPassword,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success || (data as any).status) {
        return { success: true, message: data.message || "Password reset successful" };
      } else {
        return {
          success: false,
          message: data.message || "Failed to reset password",
        };
      }
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Forgot MFA - Request MFA reset
  async forgotMFA(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/forgot/mfa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_email: email }),
      });

      const data: ApiResponse = await response.json();

      if (data.success || (data as any).status) {
        return { success: true, message: data.message || "MFA reset email sent" };
      } else {
        return {
          success: false,
          message: data.message || "Failed to send MFA reset email",
        };
      }
    } catch (error) {
      console.error("Forgot MFA error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Get departments for signup form
  async getDepartments(): Promise<Department[]> {
    try {
      console.log(
        "Fetching departments from:",
        `${API_BASE_URL}/api/department/get`
      );
      const response = await fetch(`${API_BASE_URL}/api/department/get`);
      console.log("Department response status:", response.status);

      if (!response.ok) {
        console.error(
          "Department API error:",
          response.status,
          response.statusText
        );
        return [];
      }

      const data = await response.json();
      console.log("Department API response:", data);

      // Handle different response formats
      if (data.success && data.data) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.departments && Array.isArray(data.departments)) {
        return data.departments;
      }

      console.warn("Unexpected department response format:", data);
      return [];
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  }

  // Get roles for signup form
  async getRoles(): Promise<Role[]> {
    try {
      console.log("Fetching roles from:", `${API_BASE_URL}/api/roles/get`);
      const response = await fetch(`${API_BASE_URL}/api/roles/get`);
      console.log("Roles response status:", response.status);

      if (!response.ok) {
        console.error("Roles API error:", response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log("Roles API response:", data);

      // Handle different response formats
      if (data.success && data.data) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.roles && Array.isArray(data.roles)) {
        return data.roles;
      }

      console.warn("Unexpected roles response format:", data);
      return [];
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  }

  // Create a new role
  async createRole(payload: {
    role_name: string;
    role_code?: string;
    description?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/create/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse = await response.json();
      const success = (data as any).success ?? (data as any).status ?? false;
      return {
        success: !!success,
        message:
          data.message || (success ? "Role created" : "Failed to create role"),
      };
    } catch (error) {
      console.error("Create role error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Create a new department
  async createDepartment(payload: {
    department_name: string;
    department_code?: string;
    description?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/create/department`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse = await response.json();
      const success = (data as any).success ?? (data as any).status ?? false;
      return {
        success: !!success,
        message:
          data.message ||
          (success ? "Department created" : "Failed to create department"),
      };
    } catch (error) {
      console.error("Create department error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Update an existing role
  async updateRole(payload: {
    role_id: string;
    role_name: string;
    description?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/update-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse = await response.json();
      const success = (data as any).success ?? (data as any).status ?? false;
      return {
        success: !!success,
        message:
          data.message || (success ? "Role updated" : "Failed to update role"),
      };
    } catch (error) {
      console.error("Update role error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Update an existing department
  async updateDepartment(payload: {
    department_id: string;
    department_name: string;
    description?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/update-department`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse = await response.json();
      const success = (data as any).success ?? (data as any).status ?? false;
      return {
        success: !!success,
        message:
          data.message ||
          (success ? "Department updated" : "Failed to update department"),
      };
    } catch (error) {
      console.error("Update department error:", error);
      return { success: false, message: "Network error occurred" };
    }
  }

  // Logout user
  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // Update user data
  updateUserData(user: User): void {
    this.user = user;
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export const authService = new AuthService();
export default authService;
