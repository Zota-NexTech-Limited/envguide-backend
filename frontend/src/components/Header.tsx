import { Bell, User, LogOut, ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-2.5 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {children}
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Welcome back!
            </h2>
            <p className="text-xs text-gray-500">
              Manage your environmental data
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search - Hidden on mobile */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all hidden">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-green-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-xl p-2 transition-all border border-transparent hover:border-gray-200"
            >
              <div className="h-9 w-9 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm text-left hidden sm:block">
                <div className="font-medium text-gray-900">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.role || "Role"}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900">
                    {user?.name || "User"}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {user?.email || "email@example.com"}
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
                      {user?.department || "Department"}
                    </span>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
