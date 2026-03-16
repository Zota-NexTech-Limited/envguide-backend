import { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Package,
  Grid,
  FolderOpen,
  PlayCircle,
  Archive,
  Puzzle,
  CheckSquare,
  BarChart3,
  Settings,
  User,
  Users,
  Shield,
  IdCard,
  Lock,
  Database,
  CreditCard,
  Server,
  Bell,
  MessageCircle,
  Smartphone,
  AlertTriangle,
  Video,
  Wifi,
  Menu,
  X,
  ChevronLeft,
  ClipboardList,
  Star,
} from "lucide-react";
import { menuItems } from "../config/menu";
import { cn } from "../lib/utils";
import type { MenuItem } from "../types";
import { usePermissions } from "../contexts/PermissionContext";

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  FileText,
  Package,
  Grid,
  FolderOpen,
  PlayCircle,
  Archive,
  Puzzle,
  CheckSquare,
  BarChart3,
  ClipboardList,
  Star,
  Settings,
  User,
  Users,
  Shield,
  IdCard,
  Lock,
  Database,
  CreditCard,
  Server,
  Bell,
  MessageCircle,
  Smartphone,
  AlertTriangle,
  Video,
  Wifi,
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onMinimizedChange: (minimized: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onMinimizedChange,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();
  const { hasModuleAccess, loading: permissionsLoading } = usePermissions();

  // Filter menu items based on permissions
  const filteredMenuItems = useMemo(() => {
    // If permissions are still loading, show nothing to prevent flash
    if (permissionsLoading) {
      console.log("[Sidebar] Permissions loading, showing skeleton");
      return [];
    }

    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items.filter((item) => {
        // If no permissionKey, always show (for backwards compatibility)
        if (!item.permissionKey) {
          return true;
        }

        // Check if user has read access to this module
        const hasAccess = hasModuleAccess(item.permissionKey);
        console.log(`[Sidebar] "${item.title}" (${item.permissionKey}) -> hasAccess=${hasAccess}`);

        // If item has children, filter them too
        if (item.children && item.children.length > 0) {
          const filteredChildren = filterItems(item.children);
          // Only show parent if at least one child is accessible
          return filteredChildren.length > 0 || hasAccess;
        }

        return hasAccess;
      }).map((item) => {
        // If item has children, filter them
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: filterItems(item.children),
          };
        }
        return item;
      });
    };

    return filterItems(menuItems);
  }, [hasModuleAccess, permissionsLoading]);

  const toggleExpanded = (itemId: string) => {
    if (isMinimized) return; // Don't expand when minimized
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleMinimized = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    onMinimizedChange(newMinimized);
    // Clear expanded items when minimizing
    if (newMinimized) {
      setExpandedItems(new Set());
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    // Get base path for matching (e.g., /product-portfolio from /product-portfolio/all-products)
    const getBasePath = (path: string) => {
      const segments = path.split('/').filter(Boolean);
      return segments.length > 0 ? `/${segments[0]}` : path;
    };

    const basePath = getBasePath(item.path);
    const isActive =
      location.pathname === item.path ||
      location.pathname.startsWith(basePath + '/') ||
      location.pathname === basePath ||
      (hasChildren &&
        item.children?.some((child) => location.pathname === child.path));

    const IconComponent = iconMap[item.icon] || FileText;

    if (isMinimized) {
      // Minimized view - only show icons
      return (
        <div key={item.id} className="relative">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.id)}
              className={cn(
                "sidebar-menu-item flex items-center justify-center w-11 h-11 mx-auto mb-1.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "active text-white shadow-lg"
                  : "text-slate-300"
              )}
              title={item.title}
            >
              <IconComponent className="h-5 w-5" />
              {/* Tooltip for minimized state */}
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl">
                {item.title}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
              </div>
            </button>
          ) : (
            <NavLink
              to={item.path}
              className={cn(
                "sidebar-menu-item flex items-center justify-center w-11 h-11 mx-auto mb-1.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "active text-white shadow-lg"
                  : "text-slate-300"
              )}
              title={item.title}
            >
              <IconComponent className="h-5 w-5" />
              {/* Tooltip for minimized state */}
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl">
                {item.title}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
              </div>
            </NavLink>
          )}
        </div>
      );
    }

    // Full view - show icons and text
    return (
      <div key={item.id}>
        <div className="flex items-center">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.id)}
              className={cn(
                "sidebar-menu-item flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                isActive
                  ? "active text-white shadow-lg"
                  : "text-slate-200",
                level === 0 ? "text-sm font-semibold" : "text-sm font-medium",
                "group"
              )}
            >
              <IconComponent
                className={cn(
                  "h-5 w-5 mr-3 transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white"
                )}
              />
              <span className="flex-1 text-left">{item.title}</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-white/80 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-transform duration-200" />
              )}
            </button>
          ) : (
            <NavLink
              to={item.path}
              className={cn(
                "sidebar-menu-item flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                isActive
                  ? "active text-white shadow-lg"
                  : "text-slate-200",
                level === 0
                  ? "text-sm font-semibold"
                  : "text-sm font-medium",
                "group"
              )}
            >
              <IconComponent
                className={cn(
                  "h-5 w-5 mr-3 transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white"
                )}
              />
              <span className="flex-1">{item.title}</span>
            </NavLink>
          )}
        </div>

        {hasChildren && isExpanded && !isMinimized && (
          <div className="ml-6 mt-1 space-y-0.5 pl-4 border-l border-slate-700">
            {item.children?.map((child) => (
              <NavLink
                key={child.id}
                to={child.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center w-full py-2 pl-3 text-sm font-medium transition-all duration-200 rounded-lg",
                    isActive
                      ? "text-green-400 font-semibold bg-green-600/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  )
                }
              >
                <span>{child.title}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 shadow-2xl flex flex-col h-screen transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isMinimized ? "w-20" : "w-72"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-slate-700/50 transition-all duration-300",
            isMinimized
              ? "justify-center px-2 py-4"
              : "justify-between px-5 py-5"
          )}
        >
          {!isMinimized && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-600/20">
                <img
                  src="/logo-dark.png"
                  alt="EnviGuide Logo"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">EnviGuide</h1>
                <p className="text-slate-400 text-xs">Management Suite</p>
              </div>
            </div>
          )}

          {isMinimized && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-600/20">
              <img
                src="/logo-dark.png"
                alt="EnviGuide Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
          )}

          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 transition-all duration-300 dark-scrollbar",
            isMinimized
              ? "px-2 py-4 space-y-1"
              : "px-4 py-4 space-y-1 overflow-auto"
          )}
        >
          {permissionsLoading ? (
            // Loading skeleton
            <div className="space-y-2 px-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-slate-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            filteredMenuItems.map((item) => renderMenuItem(item))
          )}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-slate-700/50 transition-all duration-300 flex items-center",
            isMinimized ? "p-3 justify-center" : "p-4 justify-end"
          )}
        >
          <button
            onClick={toggleMinimized}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200"
            title={isMinimized ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isMinimized ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
