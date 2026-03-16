import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, User, Shield, Key, ChevronDown } from "lucide-react";
import { message } from "antd";
import authService from "../../lib/authService";
import type { Department, Role, SignupRequest } from "../../types";
import { usePermissions } from "../../contexts/PermissionContext";

const UsersCreate: React.FC = () => {
  const navigate = useNavigate();
  const { canCreate } = usePermissions();

  // Redirect if user doesn't have create permission
  useEffect(() => {
    if (!canCreate("manage users")) {
      message.error("You don't have permission to create users");
      navigate("/settings/users");
    }
  }, [canCreate, navigate]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [form, setForm] = useState<{
    user_name: string;
    user_email: string;
    user_phone_number: string;
    user_role: string;
    user_department: string;
    user_password: string;
    confirm_password: string;
    change_password_next_login: boolean;
    password_never_expires: boolean;
  }>({
    user_name: "",
    user_email: "",
    user_phone_number: "",
    user_role: "",
    user_department: "",
    user_password: "",
    confirm_password: "",
    change_password_next_login: false,
    password_never_expires: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadDropdowns() {
      const [fetchedRoles, fetchedDepartments] = await Promise.all([
        authService.getRoles(),
        authService.getDepartments(),
      ]);
      if (!cancelled) {
        setRoles(fetchedRoles || []);
        setDepartments(fetchedDepartments || []);
      }
    }
    loadDropdowns();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (
      !form.user_name ||
      !form.user_email ||
      !form.user_role ||
      !form.user_department ||
      !form.user_password
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    if (form.user_password !== form.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const payload: SignupRequest = {
        user_name: form.user_name,
        user_role: form.user_role,
        user_email: form.user_email,
        user_phone_number: form.user_phone_number,
        user_department: form.user_department,
        change_password_next_login: form.change_password_next_login,
        password_never_expires: form.password_never_expires,
        user_password: form.user_password,
      };

      const result = await authService.signup(payload);
      if (result.success) {
        alert(result.message || "User created successfully");

        // Trigger refresh of users list
        localStorage.setItem("refreshUsers", "true");

        navigate("/settings/users");
      } else {
        alert(result.message || "Failed to create user");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/settings/users")}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create New User
              </h1>
              <p className="text-gray-500">
                Add a new user account to the EnviGuide system
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-8"
      >
        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              Basic Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={form.user_name}
                onChange={(e) => updateField("user_name", e.target.value)}
                placeholder="Enter username"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={form.user_email}
                onChange={(e) => updateField("user_email", e.target.value)}
                placeholder="name@example.com"
                name="user_email_field"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={form.user_phone_number}
                onChange={(e) =>
                  updateField("user_phone_number", e.target.value)
                }
                placeholder="Enter mobile number"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none transition-all"
                  value={form.user_role}
                  onChange={(e) => updateField("user_role", e.target.value)}
                  required
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_name}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none transition-all"
                  value={form.user_department}
                  onChange={(e) =>
                    updateField("user_department", e.target.value)
                  }
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.department_id} value={d.department_name}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              Security Settings
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={form.user_password}
                onChange={(e) => updateField("user_password", e.target.value)}
                placeholder="Enter password"
                name="new_password"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={form.confirm_password}
                onChange={(e) =>
                  updateField("confirm_password", e.target.value)
                }
                placeholder="Re-enter password"
                name="confirm_password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              Password Options
            </h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                id="neverExpires"
                type="checkbox"
                className="h-4 w-4"
                checked={form.password_never_expires}
                onChange={(e) =>
                  updateField("password_never_expires", e.target.checked)
                }
              />
              <span className="text-gray-700">Password Never Expires</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                id="changeNextLogin"
                type="checkbox"
                className="h-4 w-4"
                checked={form.change_password_next_login}
                onChange={(e) =>
                  updateField("change_password_next_login", e.target.checked)
                }
              />
              <span className="text-gray-700">
                Change Password at Next Login
              </span>
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={() => navigate("/settings/users")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 inline-flex items-center space-x-2 shadow-lg shadow-green-600/20 transition-all"
            disabled={loading}
          >
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Create User</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsersCreate;
