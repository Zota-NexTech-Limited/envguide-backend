import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { MainModulePermission } from "../types/userManagement";
import authorizationService from "../lib/authorizationService";
import { useAuth } from "./AuthContext";

// Permission actions
type PermissionAction = "create" | "read" | "update" | "delete" | "print" | "export" | "send";

// Flattened permission structure for O(1) lookup
interface FlatPermission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
  send: boolean;
  all: boolean;
}

interface PermissionContextType {
  // Raw hierarchical permissions from API
  hierarchicalPermissions: MainModulePermission[];
  loading: boolean;
  error: string | null;

  // Core permission checks
  refreshPermissions: () => Promise<void>;
  hasPermission: (moduleName: string, action: PermissionAction) => boolean;

  // Convenience methods
  canCreate: (moduleName: string) => boolean;
  canRead: (moduleName: string) => boolean;
  canUpdate: (moduleName: string) => boolean;
  canDelete: (moduleName: string) => boolean;
  canPrint: (moduleName: string) => boolean;
  canExport: (moduleName: string) => boolean;
  canSend: (moduleName: string) => boolean;

  // Module access (for sidebar visibility)
  hasModuleAccess: (moduleName: string) => boolean;

  // Get all permissions for a module (for complex UI logic)
  getModulePermissions: (moduleName: string) => FlatPermission | null;

  // Check if user has any access at all (for showing/hiding entire sections)
  hasAnyPermission: (moduleName: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Normalize module names for consistent comparison
const normalizeModuleName = (name: string): string => {
  return name.toLowerCase().trim().replace(/[-_\s]+/g, " ");
};

// Module name aliases for flexible matching
// IMPORTANT: Do NOT add aliases that match submodule names (e.g., "products", "components")
// as they will overwrite main module permissions when building the permission map
const MODULE_ALIASES: Record<string, string[]> = {
  // Main modules - use exact names only to avoid conflicts with submodules
  "dashboard": ["dashboard"],
  "pcf request": ["pcf request", "pcf", "pcf-request"],
  "product portfolio": ["product portfolio", "product-portfolio", "all products"], // Removed "products" - conflicts with submodule
  "component master": ["component master", "components master", "components-master"], // Removed "components" - conflicts with submodule
  "document master": ["document master", "document-master"], // Removed "documents" - could conflict
  "task management": ["task management", "task-management"], // Removed "tasks" - could conflict
  "reports": ["reports", "report"],
  "data quality rating": ["data quality rating", "dqr", "data-quality-rating"],
  "settings": ["settings", "setting"],
  // Settings modules (2nd level)
  "data configuration": ["data configuration", "data-configuration"],
  "eco invent emission factors": ["eco invent emission factors", "eco-invent", "emission factors"],
  "master data setup": ["master data setup", "master-data-setup", "master data"],
  "user management": ["user management", "user managment", "user-management"], // Removed "users" - conflicts with submodule context
  // User Management submodules (3rd level)
  "authorization": ["authorization", "authorizations"],
  "create new user": ["create new user", "new user", "add user"],
  "manage users": ["manage users"],
  // Alert Management
  "alert management": ["alert management", "alert-management", "alerts"],
};

// Find canonical name from alias
const getCanonicalName = (name: string): string => {
  const normalized = normalizeModuleName(name);

  for (const [canonical, aliases] of Object.entries(MODULE_ALIASES)) {
    if (aliases.some(alias => normalizeModuleName(alias) === normalized)) {
      return canonical;
    }
  }

  return normalized;
};

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [hierarchicalPermissions, setHierarchicalPermissions] = useState<MainModulePermission[]>([]);
  // Start with loading=true to prevent flash of content before permissions load
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Build flat permission map for O(1) lookups
  const permissionMap = useMemo(() => {
    const map = new Map<string, FlatPermission>();

    const addToMap = (name: string, permission: FlatPermission) => {
      const canonical = getCanonicalName(name);
      map.set(canonical, permission);
      // Debug: log what's being added
      // console.log(`[PermissionMap] Added "${name}" as "${canonical}":`, permission);
    };

    console.log(`[PermissionMap] Building map from ${hierarchicalPermissions.length} main modules`);

    hierarchicalPermissions.forEach((mainModule) => {
      // Add main module
      const perm = {
        create: mainModule.create,
        read: mainModule.read,
        update: mainModule.update,
        delete: mainModule.delete,
        print: mainModule.print || mainModule.create || mainModule.update,
        export: mainModule.export || mainModule.create || mainModule.update,
        send: mainModule.send || mainModule.create || mainModule.update,
        all: mainModule.all,
      };
      console.log(`[PermissionMap] "${mainModule.main_module_name}" -> read=${perm.read}`);
      addToMap(mainModule.main_module_name, perm);

      // Add modules under main module
      mainModule.modules?.forEach((mod) => {
        addToMap(mod.module_name, {
          create: mod.create,
          read: mod.read,
          update: mod.update,
          delete: mod.delete,
          print: mod.print || mod.create || mod.update,
          export: mod.export || mod.create || mod.update,
          send: mod.send || mod.create || mod.update,
          all: mod.all,
        });

        // Add submodules (for completeness, though UI won't check at this level)
        mod.submodules?.forEach((sub) => {
          addToMap(sub.submodule_name, {
            create: sub.create,
            read: sub.read,
            update: sub.update,
            delete: sub.delete,
            print: sub.print || sub.create || sub.update,
            export: sub.export || sub.create || sub.update,
            send: sub.send || sub.create || sub.update,
            all: sub.all,
          });
        });
      });
    });

    return map;
  }, [hierarchicalPermissions]);

  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated || !user?.userId) {
      setHierarchicalPermissions([]);
      setLoading(false);
      setInitialized(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await authorizationService.getPermissionsByUserId(user.userId);

      if (result.success && Array.isArray(result.data)) {
        setHierarchicalPermissions(result.data as unknown as MainModulePermission[]);
        console.log("[Permissions] Loaded permissions:", result.data);
      } else {
        console.warn("[Permissions] No permissions found for user");
        setHierarchicalPermissions([]);
      }
    } catch (err) {
      console.error("[Permissions] Error loading permissions:", err);
      setError("Failed to load permissions");
      setHierarchicalPermissions([]);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [isAuthenticated, user?.userId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  // Get permissions for a module
  const getModulePermissions = useCallback((moduleName: string): FlatPermission | null => {
    const canonical = getCanonicalName(moduleName);
    return permissionMap.get(canonical) || null;
  }, [permissionMap]);

  // Check specific permission
  const hasPermission = useCallback((moduleName: string, action: PermissionAction): boolean => {
    // If not initialized yet, deny access to prevent flash
    if (!initialized || loading) {
      return false;
    }

    // If permissions are empty after initialization, deny access (strict mode)
    if (hierarchicalPermissions.length === 0) {
      return false;
    }

    const permissions = getModulePermissions(moduleName);

    if (!permissions) {
      // Module not found in permissions - deny access
      console.log(`[Permissions] Module "${moduleName}" not found in permissions map`);
      return false;
    }

    // If "all" is true, grant all permissions
    if (permissions.all) {
      return true;
    }

    const hasAccess = permissions[action] === true;
    // Uncomment for debugging:
    // console.log(`[Permissions] ${moduleName}.${action} = ${hasAccess}`);
    return hasAccess;
  }, [initialized, loading, hierarchicalPermissions.length, getModulePermissions]);

  // Convenience permission checks
  const canCreate = useCallback((moduleName: string): boolean => {
    return hasPermission(moduleName, "create");
  }, [hasPermission]);

  const canRead = useCallback((moduleName: string): boolean => {
    return hasPermission(moduleName, "read");
  }, [hasPermission]);

  const canUpdate = useCallback((moduleName: string): boolean => {
    return hasPermission(moduleName, "update");
  }, [hasPermission]);

  const canDelete = useCallback((moduleName: string): boolean => {
    return hasPermission(moduleName, "delete");
  }, [hasPermission]);

  const canPrint = useCallback((moduleName: string): boolean => {
    return hasPermission(moduleName, "print");
  }, [hasPermission]);

  const canExport = useCallback((moduleName: string): boolean => {
    return hasPermission(moduleName, "export");
  }, [hasPermission]);

  const canSend = useCallback((moduleName: string): boolean => {
    return hasPermission(moduleName, "send");
  }, [hasPermission]);

  // Check if user has read access (for sidebar visibility)
  const hasModuleAccess = useCallback((moduleName: string): boolean => {
    return canRead(moduleName);
  }, [canRead]);

  // Check if user has ANY permission for a module
  const hasAnyPermission = useCallback((moduleName: string): boolean => {
    const permissions = getModulePermissions(moduleName);
    if (!permissions) return false;

    return permissions.all ||
           permissions.create ||
           permissions.read ||
           permissions.update ||
           permissions.delete;
  }, [getModulePermissions]);

  const value: PermissionContextType = {
    hierarchicalPermissions,
    loading,
    error,
    refreshPermissions,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canPrint,
    canExport,
    canSend,
    hasModuleAccess,
    getModulePermissions,
    hasAnyPermission,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};

// ============================================
// Permission Components for Conditional Rendering
// ============================================

// Gate component - renders children only if permission is granted
export const PermissionGate: React.FC<{
  module: string;
  action?: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ module, action = "read", children, fallback = null }) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// HOC for route protection
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleName: string,
  action: PermissionAction = "read"
) => {
  return function WithPermissionComponent(props: P) {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      );
    }

    if (!hasPermission(moduleName, action)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-center max-w-md">
            You don't have permission to access this page. Please contact your administrator if you
            believe this is an error.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

// ============================================
// Custom Hooks for Specific Use Cases
// ============================================

// Hook for PCF-specific permission checks
export const usePCFPermissions = () => {
  const { canRead, canCreate, canUpdate, canDelete, canExport, canPrint, loading } = usePermissions();

  return useMemo(() => ({
    loading,
    // View PCF details
    canView: canRead("pcf request"),
    // Create new PCF
    canCreatePCF: canCreate("pcf request"),
    // Approve, submit, reject PCF (requires update permission)
    canApprove: canUpdate("pcf request"),
    canSubmit: canUpdate("pcf request"),
    canReject: canUpdate("pcf request"),
    // Delete PCF
    canDeletePCF: canDelete("pcf request"),
    // Export/Print (derived from create/update)
    canExportPCF: canExport("pcf request"),
    canPrintPCF: canPrint("pcf request"),
  }), [canRead, canCreate, canUpdate, canDelete, canExport, canPrint, loading]);
};

// Hook for Product Portfolio permission checks
export const useProductPermissions = () => {
  const { canRead, canCreate, canUpdate, canDelete, canExport, loading } = usePermissions();

  return useMemo(() => ({
    loading,
    canView: canRead("product portfolio"),
    canCreateProduct: canCreate("product portfolio"),
    canEditProduct: canUpdate("product portfolio"),
    canDeleteProduct: canDelete("product portfolio"),
    canExportProduct: canExport("product portfolio"),
  }), [canRead, canCreate, canUpdate, canDelete, canExport, loading]);
};

// Hook for Reports permission checks
export const useReportsPermissions = () => {
  const { canRead, canCreate, canUpdate, loading } = usePermissions();

  return useMemo(() => ({
    loading,
    canViewReports: canRead("reports"),
    // Export requires create OR update
    canExportReports: canCreate("reports") || canUpdate("reports"),
  }), [canRead, canCreate, canUpdate, loading]);
};

// Hook for Settings permission checks
export const useSettingsPermissions = (subModule?: string) => {
  const { canRead, canCreate, canUpdate, canDelete, loading } = usePermissions();

  const moduleName = subModule || "settings";

  return useMemo(() => ({
    loading,
    canView: canRead(moduleName),
    canCreate: canCreate(moduleName),
    canUpdate: canUpdate(moduleName),
    canDelete: canDelete(moduleName),
  }), [canRead, canCreate, canUpdate, canDelete, moduleName, loading]);
};

// Hook for Dashboard permission
export const useDashboardPermissions = () => {
  const { canRead, loading } = usePermissions();

  return useMemo(() => ({
    loading,
    canViewDashboard: canRead("dashboard"),
  }), [canRead, loading]);
};

export default PermissionContext;
