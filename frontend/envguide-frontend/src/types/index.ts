// Basic types for the application
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  children?: RouteConfig[];
  title?: string;
  icon?: string;
  requiresAuth?: boolean;
}

export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  children?: MenuItem[];
  // Permission key for access control - maps to module name in permissions API
  permissionKey?: string;
}

// Backend user structure
export interface BackendUser {
  user_id: string;
  user_name: string;
  user_role: string;
  user_email: string;
  user_phone_number: string;
  user_department: string;
  user_max_dis_per?: number;
  user_min_dis_per?: number;
  user_role_id?: string;
  change_password_next_login?: boolean;
  password_never_expires?: boolean;
}

// Frontend user structure
export interface User {
  id: string;
  userId?: string; // Backend user_id
  name: string;
  email: string;
  role: string;
  department: string;
  phoneNumber: string;
  maxDiscountPercent?: number;
  minDiscountPercent?: number;
  storeId?: string;
  roleId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  status: number;
  data: T;
}

export interface LoginRequest {
  user_email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user_name: string;
  user_role: string;
  user_email: string;
  user_phone_number: string;
  user_department: string;
  user_max_dis_per?: number;
  user_min_dis_per?: number;
}

export interface SignupRequest {
  user_name: string;
  user_role: string;
  user_email: string;
  user_phone_number: string;
  user_department: string;
  change_password_next_login: boolean;
  password_never_expires: boolean;
  user_password: string;
}

export interface Department {
  department_id: string;
  department_name: string;
  description?: string;
}

export interface Role {
  role_id: string;
  role_name: string;
  description?: string;
}
