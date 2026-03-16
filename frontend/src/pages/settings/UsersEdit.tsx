import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User } from "lucide-react";
import { message } from "antd";
import LoadingSpinner from "../../components/LoadingSpinner";
import type { BackendUser } from "../../types";
import { usePermissions } from "../../contexts/PermissionContext";
import { getApiBaseUrl } from "../../lib/apiBaseUrl";

const UsersEdit: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { canUpdate } = usePermissions();
  const [loading, setLoading] = useState(true);

  // Redirect if user doesn't have update permission
  useEffect(() => {
    if (!canUpdate("manage users")) {
      message.error("You don't have permission to edit users");
      navigate("/settings/users");
    }
  }, [canUpdate, navigate]);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [roles, setRoles] = useState<
    Array<{ role_id: string; role_name: string }>
  >([]);
  const [departments, setDepartments] = useState<
    Array<{ department_id: string; department_name: string }>
  >([]);
  const [formData, setFormData] = useState({
    user_name: "",
    user_email: "",
    user_role: "",
    user_department: "",
    user_phone_number: "",
  });

  useEffect(() => {
    if (userId) {
      loadUser();
      loadRoles();
      loadDepartments();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `        ${getApiBaseUrl()}/api/user/getById?user_id=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status && data.data && data.data.length > 0) {
          const userData = data.data[0];
          setUser(userData);
          setFormData({
            user_name: userData.user_name || "",
            user_email: userData.user_email || "",
            user_role: userData.user_role || "",
            user_department: userData.user_department || "",
            user_phone_number: userData.user_phone_number || "",
          });
        }
      } else {
        message.error("Failed to load user data");
        navigate("/settings/users");
      }
    } catch (error) {
      console.error("Error loading user:", error);
      message.error("Error loading user data");
      navigate("/settings/users");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `        ${getApiBaseUrl()}/api/roles/get`,
        {
          headers: {
            ...(token ? { Authorization: token } : {}),
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status && data.data && data.data.rows) {
          setRoles(data.data.rows);
        } else if (data.status && data.data) {
          // Fallback for legacy format
          setRoles(data.data);
        }
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      message.error("Failed to load roles");
    }
  };

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `        ${getApiBaseUrl()}/api/department/get`,
        {
          headers: {
            ...(token ? { Authorization: token } : {}),
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status && data.data && data.data.rows) {
          setDepartments(data.data.rows);
        } else if (data.status && data.data) {
          // Fallback for legacy format
          setDepartments(data.data);
        }
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      message.error("Failed to load departments");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;

    try {
      setSaving(true);
      const response = await fetch(
        `        ${getApiBaseUrl()}/api/user/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            ...formData,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status) {
          message.success("User updated successfully!");
          navigate("/settings/users");
        } else {
          message.error(data.message || "Failed to update user");
        }
      } else {
        message.error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("Error updating user");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
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
              <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-500">Update user information and permissions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
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
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-500">Update user information and permissions</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Name *
              </label>
              <input
                type="text"
                name="user_name"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={formData.user_name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="user_email"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={formData.user_email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="user_role"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={formData.user_role}
                onChange={handleInputChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                name="user_department"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={formData.user_department}
                onChange={handleInputChange}
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_name}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="user_phone_number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={formData.user_phone_number}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate("/settings/users")}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-600/20 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersEdit;
