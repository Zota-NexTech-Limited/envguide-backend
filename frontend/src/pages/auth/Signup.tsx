import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import Logo from "../../components/Logo";
import authService from "../../lib/authService";
import type { Role, Department } from "../../types";

const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    user_name: "",
    user_role: "",
    user_email: "",
    user_password: "",
    user_phone_number: "",
    user_department: "",
    change_password_next_login: true,
    password_never_expires: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Load roles and departments on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesData, departmentsData] = await Promise.all([
          authService.getRoles(),
          authService.getDepartments(),
        ]);

        setRoles(rolesData);
        setDepartments(departmentsData);

        // Set default values if data is available
        if (rolesData.length > 0 && !formData.user_role) {
          setFormData((prev) => ({
            ...prev,
            user_role: rolesData[0].role_name,
          }));
        }
        if (departmentsData.length > 0 && !formData.user_department) {
          setFormData((prev) => ({
            ...prev,
            user_department: departmentsData[0].department_name,
          }));
        }
      } catch (error) {
        console.error("Error loading roles and departments:", error);
        setError(
          "Failed to load roles and departments. Please refresh the page."
        );
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validate password confirmation
    if (
      formData.user_password !==
      (document.getElementById("confirmPassword") as HTMLInputElement)?.value
    ) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signup(formData);

      if (result.success) {
        setSuccess(result.message);
        // Clear form
        setFormData({
          user_name: "",
          user_role: "",
          user_email: "",
          user_password: "",
          user_phone_number: "",
          user_department: "",
          change_password_next_login: true,
          password_never_expires: false,
        });

        // Trigger refresh of users list if we're in the admin context
        localStorage.setItem("refreshUsers", "true");
        // Also dispatch a custom event for immediate refresh
        window.dispatchEvent(new CustomEvent("refreshUsers"));

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Dark Background with Green Accent */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <Logo className="mb-8" variant="dark" />
          <div className="text-center text-white max-w-md">
            <h1 className="text-3xl font-bold mb-4 leading-tight">
              Join EnviGuide
              <span className="block text-green-400">Management Suite</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Create your account to start tracking carbon footprints and managing environmental data.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - White Background */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden mb-6">
              <Logo variant="light" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create an account
            </h2>
            <p className="text-gray-500">
              Enter your details below to get started
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="ml-3 text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="user_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                id="user_name"
                name="user_name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder="e.g., John Doe"
                value={formData.user_name}
                onChange={(e) =>
                  setFormData({ ...formData, user_name: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="user_email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="user_email"
                name="user_email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder="e.g., name@company.com"
                value={formData.user_email}
                onChange={(e) =>
                  setFormData({ ...formData, user_email: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="user_phone_number"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                id="user_phone_number"
                name="user_phone_number"
                type="tel"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder="e.g., 1234567890"
                value={formData.user_phone_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    user_phone_number: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="user_role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Role
              </label>
              <select
                id="user_role"
                name="user_role"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                value={formData.user_role}
                onChange={(e) =>
                  setFormData({ ...formData, user_role: e.target.value })
                }
                disabled={isLoading}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.role_id} value={role.role_name}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="user_department"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Department
              </label>
              <select
                id="user_department"
                name="user_department"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                value={formData.user_department}
                onChange={(e) =>
                  setFormData({ ...formData, user_department: e.target.value })
                }
                disabled={isLoading}
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_name}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="change_password_next_login"
                  name="change_password_next_login"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={formData.change_password_next_login}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      change_password_next_login: e.target.checked,
                    })
                  }
                  disabled={isLoading}
                />
                <label
                  htmlFor="change_password_next_login"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Change password on next login
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="password_never_expires"
                  name="password_never_expires"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={formData.password_never_expires}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password_never_expires: e.target.checked,
                    })
                  }
                  disabled={isLoading}
                />
                <label
                  htmlFor="password_never_expires"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Password never expires
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="user_password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="user_password"
                  name="user_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  placeholder="Create a password"
                  value={formData.user_password}
                  onChange={(e) =>
                    setFormData({ ...formData, user_password: e.target.value })
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg shadow-green-600/20"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="border-white" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Google</span>
              </button>

              <button className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="ml-2">Apple</span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-green-600 hover:text-green-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
