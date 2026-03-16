// Manufacturer Onboarding Types
export interface ManufacturerOnboarding {
  id: string;
  code: string;
  name: string;
  email: string;
  phone_number: string;
  alternate_phone_number?: string;
  gender?: string;
  date_of_birth?: string;
  image?: string;
  company_logo?: string;
  address: string;
  lat?: number;
  long?: number;
  company_website?: string;
  factory_or_plant_name?: string;
  factory_address?: string;
  city: string;
  state: string;
  country: string;
  manufacturing_capabilities?: string[];
  installed_capacity_or_month?: string;
  machinery_list?: string;
  years_of_operation?: string;
  number_of_employees?: string;
  key_oem_clients?: string[];
  // Certifications
  iso_9001?: string[];
  iso_14001?: string[];
  iatf_16949?: string[];
  ohsas_18001?: string[];
  other_certifications?: string[];
  // Compliance
  reach_compliance?: string[];
  rohs_ompliance?: string[];
  environmental_safety_policy?: string[];
  qa_or_qc_lab_availability?: string[];
  testing_certifications?: string[];
  conflict_minerals_declaration?: string[];
  // Documents
  factory_layout_pdf?: string;
  factory_profile_or_capability_deck?: string;
  // Contact Person
  contact_person_name?: string;
  contact_person_designation?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  // Timestamps
  created_date?: string;
  update_date?: string;
  created_by?: string;
  updated_by?: string;
}

// Supplier Onboarding Types
export interface SupplierOnboarding {
  sup_id: string;
  code: string;
  supplier_name: string;
  supplier_email: string;
  supplier_phone_number: string;
  supplier_alternate_phone_number?: string;
  supplier_gender?: string;
  supplier_date_of_birth?: string;
  supplier_image?: string;
  supplier_company_logo?: string;
  supplier_company_website?: string;
  supplier_company_name: string;
  supplier_business_type?: string;
  supplier_supplied_categories?: string[];
  supplier_years_in_business?: string;
  supplier_city: string;
  supplier_state: string;
  supplier_country: string;
  supplier_registered_address?: string;
  // Financial Details
  supplier_gst_number?: string;
  supplier_pan_number?: string;
  supplier_bank_account_number?: string;
  supplier_ifsc_code?: string;
  supplier_bank_name?: string;
  supplier_bank_branch?: string;
  // Business Info
  supplier_key_automotive_clients?: string[];
  // Documents
  supplier_business_registration_certificate?: string[];
  supplier_tax_registration_proof?: string[];
  supplier_product_catalogue?: string[];
  supplier_additional_supporting_documents?: string[];
  // Timestamps
  created_date?: string;
  update_date?: string;
}

// Permission Types
export interface ModulePermission {
  permission_id?: string;
  user_id: string;
  module_name: string;
  create: boolean;
  update: boolean;
  delete: boolean;
  read: boolean;
}

// Hierarchical Permission Types (from /api/user/permission/getById)
export interface SubmodulePermission {
  submodule_id: string;
  submodule_name: string;
  permission_id: string;
  user_id: string;
  create: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
  send: boolean;
  read: boolean;
  all: boolean;
}

export interface ModuleWithSubmodules {
  module_name: string;
  permission_id: string;
  user_id: string;
  create: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
  send: boolean;
  read: boolean;
  all: boolean;
  submodules: SubmodulePermission[];
}

export interface MainModulePermission {
  main_module_id: string;
  main_module_name: string;
  permission_id: string;
  user_id: string;
  create: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
  send: boolean;
  read: boolean;
  all: boolean;
  modules: ModuleWithSubmodules[];
}

export interface MainModule {
  main_module_id: string;
  main_module_name: string;
  description?: string;
  created_date?: string;
  update_date?: string;
}

export interface SubModule {
  module_id: string;
  module_name: string;
  description?: string;
  main_module_id: string;
  created_date?: string;
  update_date?: string;
}

// Role Permission (for role-based authorization)
export interface RolePermission {
  role_id: string;
  role_name: string;
  permissions: ModulePermission[];
}

// User Types for different categories
export type UserType = 'enviguide' | 'manufacturer' | 'supplier';

// API Response Types
export interface OnboardingListResponse<T> {
  status: boolean;
  message: string;
  code: number;
  data: {
    totalCount: number;
    rows?: T[];
    data?: T[]; // Some APIs return data in 'data' instead of 'rows'
  };
}

export interface PermissionListResponse {
  status: boolean;
  message: string;
  code: number;
  data: ModulePermission[];
}

export interface ModuleListResponse {
  status: boolean;
  message: string;
  code: number;
  data: MainModule[] | SubModule[];
}
