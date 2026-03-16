import React from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../contexts/PermissionContext";
import { ShieldX } from "lucide-react";

interface PermissionRouteProps {
  children: React.ReactNode;
  permissionKey: string;
  action?: "create" | "read" | "update" | "delete";
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  permissionKey,
  action = "read",
}) => {
  const { hasPermission, loading } = usePermissions();

  // Show loading state while permissions are being checked
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          <p className="text-gray-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user has permission
  const hasAccess = hasPermission(permissionKey, action);

  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-500 mb-6">
            You don't have permission to access this page. Please contact your
            administrator if you believe this is an error.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionRoute;
