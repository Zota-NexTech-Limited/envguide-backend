import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  FileText,
  Package,
  Puzzle,
  FolderOpen,
  CheckSquare,
  BarChart3,
  Star,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../contexts/PermissionContext";

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<any>;
  permissionKey: string;
  gradient: string;
}

const moduleCards: ModuleCard[] = [
  {
    id: "pcf-request",
    title: "PCF Request",
    description: "Manage Product Carbon Footprint requests and track environmental impact",
    path: "/pcf-request",
    icon: FileText,
    permissionKey: "pcf request",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "product-portfolio",
    title: "Product Portfolio",
    description: "View and manage your product catalog and specifications",
    path: "/product-portfolio/all-products",
    icon: Package,
    permissionKey: "product portfolio",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    id: "components-master",
    title: "Components Master",
    description: "Manage component definitions and their environmental data",
    path: "/components-master",
    icon: Puzzle,
    permissionKey: "component master",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    id: "document-master",
    title: "Document Master",
    description: "Organize and manage all your documents in one place",
    path: "/document-master",
    icon: FolderOpen,
    permissionKey: "document master",
    gradient: "from-cyan-500 to-cyan-600",
  },
  {
    id: "task-management",
    title: "Task Management",
    description: "Track and manage tasks across your organization",
    path: "/task-management",
    icon: CheckSquare,
    permissionKey: "task management",
    gradient: "from-pink-500 to-pink-600",
  },
  {
    id: "reports",
    title: "Reports",
    description: "Generate and view detailed reports and analytics",
    path: "/reports",
    icon: BarChart3,
    permissionKey: "reports",
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    id: "data-quality-rating",
    title: "Data Quality Rating",
    description: "Monitor and improve your data quality metrics",
    path: "/data-quality-rating",
    icon: Star,
    permissionKey: "data quality rating",
    gradient: "from-amber-500 to-amber-600",
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure system settings and manage users",
    path: "/settings",
    icon: Settings,
    permissionKey: "settings",
    gradient: "from-slate-500 to-slate-600",
  },
];

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasModuleAccess, loading: permissionsLoading } = usePermissions();

  // Filter modules based on user permissions
  const accessibleModules = moduleCards.filter((module) =>
    hasModuleAccess(module.permissionKey)
  );

  // Get first name from full name
  const firstName = user?.name?.split(" ")[0] || "User";

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (permissionsLoading) {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-8 pt-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-8 pt-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm relative overflow-hidden border-t-4 border-green-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
          <div className="relative flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="text-slate-600 text-lg">
                Welcome to EnviGuide - Your Environmental Management Suite
              </p>
            </div>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">
              Quick Access
            </h2>
            <p className="text-sm text-slate-500">
              {accessibleModules.length} modules available
            </p>
          </div>

          {accessibleModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {accessibleModules.map((module) => {
                const IconComponent = module.icon;
                return (
                  <div
                    key={module.id}
                    onClick={() => navigate(module.path)}
                    className="bg-white rounded-xl p-5 cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-green-200 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1 group relative overflow-hidden"
                  >
                    {/* Hover gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
                          {module.title}
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-300" />
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Modules Available
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                You don't have access to any modules yet. Please contact your administrator to request access permissions.
              </p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">Environmental Impact</h3>
            </div>
            <p className="text-green-50 text-sm">
              Track and manage your organization's carbon footprint with our comprehensive PCF tools.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">Data-Driven Insights</h3>
            </div>
            <p className="text-blue-50 text-sm">
              Generate detailed reports and analytics to make informed sustainability decisions.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">Product Lifecycle</h3>
            </div>
            <p className="text-purple-50 text-sm">
              Manage your entire product portfolio and track environmental data across the lifecycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
