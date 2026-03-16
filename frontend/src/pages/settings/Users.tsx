import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
  User,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpDown,
  RotateCcw,
  Building2,
  Factory,
  Truck,
  Eye,
  Link as LinkIcon,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { BackendUser, Role } from "../../types";
import type { ManufacturerOnboarding, SupplierOnboarding } from "../../types/userManagement";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Select, DatePicker, Tabs, message, Tooltip } from "antd";
import dayjs from "dayjs";
import userManagementService from "../../lib/userManagementService";
import authService from "../../lib/authService";
import { usePermissions } from "../../contexts/PermissionContext";
import { getApiBaseUrl } from "../../lib/apiBaseUrl";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface FilterState {
  searchColumn: string;
  searchValue: string;
  fromDate: string;
  toDate: string;
  role: string;
  sortBy: string;
  sortOrder: string;
}

const SEARCH_COLUMNS = [
  { value: "user_name", label: "Name" },
  { value: "user_email", label: "Email" },
  { value: "user_phone_number", label: "Phone" },
  { value: "user_department", label: "Department" },
];

const SORT_OPTIONS = [
  { value: "user_name", label: "Name" },
  { value: "user_email", label: "Email" },
  { value: "created_at", label: "Created Date" },
  { value: "user_role", label: "Role" },
];

type TabKey = "enviguide" | "manufacturer" | "supplier";

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabKey>("enviguide");

  // EnviGuide Team State
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Manufacturer State
  const [manufacturers, setManufacturers] = useState<ManufacturerOnboarding[]>([]);
  const [manufacturerLoading, setManufacturerLoading] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<ManufacturerOnboarding | null>(null);
  const [showManufacturerDetails, setShowManufacturerDetails] = useState(false);
  const [manufacturerPagination, setManufacturerPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Supplier State
  const [suppliers, setSuppliers] = useState<SupplierOnboarding[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierOnboarding | null>(null);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [supplierPagination, setSupplierPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchColumn: "user_name",
    searchValue: "",
    fromDate: "",
    toDate: "",
    role: "",
    sortBy: "",
    sortOrder: "asc",
  });

  // Quick search
  const [quickSearch, setQuickSearch] = useState("");
  const [manufacturerSearch, setManufacturerSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  // Roles from API
  const [roles, setRoles] = useState<Role[]>([]);

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.append("pageNumber", pagination.current.toString());
    params.append("pageSize", pagination.pageSize.toString());

    const searchValue = quickSearch || filters.searchValue;
    if (searchValue) {
      params.append("searchColumn", filters.searchColumn);
      params.append("searchValue", searchValue);
    }

    if (filters.fromDate) {
      params.append("fromDate", filters.fromDate);
    }
    if (filters.toDate) {
      params.append("toDate", filters.toDate);
    }
    if (filters.role) {
      params.append("role", filters.role);
    }
    if (filters.sortBy) {
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);
    }

    return params.toString();
  }, [pagination.current, pagination.pageSize, filters, quickSearch]);

  // Load EnviGuide Users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const response = await fetch(
        `${getApiBaseUrl()}/api/user/getAll?${queryParams}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.status && data.data && data.data.userList) {
          setUsers(data.data.userList);
          setPagination((prev) => ({
            ...prev,
            total: parseInt(data.data.totalCount, 10) || 0,
          }));
        } else if (Array.isArray(data)) {
          setUsers(data);
          setPagination((prev) => ({ ...prev, total: data.length }));
        } else if (data.data && Array.isArray(data.data)) {
          setUsers(data.data);
          setPagination((prev) => ({ ...prev, total: data.data.length }));
        } else {
          setUsers([]);
          setPagination((prev) => ({ ...prev, total: 0 }));
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  // Load Manufacturers
  const loadManufacturers = useCallback(async () => {
    try {
      setManufacturerLoading(true);
      const result = await userManagementService.getManufacturerList(
        manufacturerPagination.current,
        manufacturerPagination.pageSize
      );

      if (result.success) {
        // Client-side filtering for search (API doesn't support search yet)
        let filteredData = result.data;
        if (manufacturerSearch) {
          const search = manufacturerSearch.toLowerCase();
          filteredData = filteredData.filter(
            (m) =>
              m.name?.toLowerCase().includes(search) ||
              m.email?.toLowerCase().includes(search) ||
              m.city?.toLowerCase().includes(search)
          );
        }
        setManufacturers(filteredData);
        setManufacturerPagination((prev) => ({
          ...prev,
          total: result.pagination?.total || result.totalCount,
          totalPages: result.pagination?.totalPages || Math.ceil((result.pagination?.total || result.totalCount) / prev.pageSize),
        }));
      } else {
        setManufacturers([]);
      }
    } catch (error) {
      console.error("Error loading manufacturers:", error);
      setManufacturers([]);
    } finally {
      setManufacturerLoading(false);
    }
  }, [manufacturerPagination.current, manufacturerPagination.pageSize, manufacturerSearch]);

  // Load Suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      setSupplierLoading(true);
      const result = await userManagementService.getSupplierList(
        supplierPagination.current,
        supplierPagination.pageSize
      );

      if (result.success) {
        // Client-side filtering for search (API doesn't support search yet)
        let filteredData = result.data;
        if (supplierSearch) {
          const search = supplierSearch.toLowerCase();
          filteredData = filteredData.filter(
            (s) =>
              s.supplier_name?.toLowerCase().includes(search) ||
              s.supplier_email?.toLowerCase().includes(search) ||
              s.supplier_company_name?.toLowerCase().includes(search)
          );
        }
        setSuppliers(filteredData);
        setSupplierPagination((prev) => ({
          ...prev,
          total: result.pagination?.total || result.totalCount,
          totalPages: result.pagination?.totalPages || Math.ceil((result.pagination?.total || result.totalCount) / prev.pageSize),
        }));
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]);
    } finally {
      setSupplierLoading(false);
    }
  }, [supplierPagination.current, supplierPagination.pageSize, supplierSearch]);

  useEffect(() => {
    if (activeTab === "enviguide") {
      loadUsers();
    } else if (activeTab === "manufacturer") {
      loadManufacturers();
    } else if (activeTab === "supplier") {
      loadSuppliers();
    }
  }, [activeTab, loadUsers, loadManufacturers, loadSuppliers]);

  // Fetch roles from API on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await authService.getRoles();
        setRoles(rolesData);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "refreshUsers" && e.newValue === "true") {
        localStorage.removeItem("refreshUsers");
        loadUsers();
      }
    };

    if (localStorage.getItem("refreshUsers") === "true") {
      localStorage.removeItem("refreshUsers");
      loadUsers();
    }

    const handleCustomRefresh = () => {
      loadUsers();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("refreshUsers", handleCustomRefresh);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("refreshUsers", handleCustomRefresh);
    };
  }, [loadUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "enviguide") {
      await loadUsers();
    } else if (activeTab === "manufacturer") {
      await loadManufacturers();
    } else if (activeTab === "supplier") {
      await loadSuppliers();
    }
    setRefreshing(false);
  };

  const handlePageChange = (page: number) => {
    if (activeTab === "enviguide") {
      setPagination((prev) => ({ ...prev, current: page }));
    } else if (activeTab === "manufacturer") {
      setManufacturerPagination((prev) => ({ ...prev, current: page }));
    } else if (activeTab === "supplier") {
      setSupplierPagination((prev) => ({ ...prev, current: page }));
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (activeTab === "enviguide") {
      setPagination((prev) => ({ ...prev, current: 1, pageSize: size }));
    } else if (activeTab === "manufacturer") {
      setManufacturerPagination((prev) => ({ ...prev, current: 1, pageSize: size }));
    } else if (activeTab === "supplier") {
      setSupplierPagination((prev) => ({ ...prev, current: 1, pageSize: size }));
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  ) => {
    if (dates && dates[0] && dates[1]) {
      setFilters((prev) => ({
        ...prev,
        fromDate: dates[0]!.format("YYYY-MM-DD"),
        toDate: dates[1]!.format("YYYY-MM-DD"),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        fromDate: "",
        toDate: "",
      }));
    }
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadUsers();
  };

  const handleResetFilters = () => {
    setFilters({
      searchColumn: "user_name",
      searchValue: "",
      fromDate: "",
      toDate: "",
      role: "",
      sortBy: "",
      sortOrder: "asc",
    });
    setQuickSearch("");
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleQuickSearch = (value: string) => {
    setQuickSearch(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const activeFiltersCount = [
    filters.searchValue,
    filters.fromDate,
    filters.role,
    filters.sortBy,
  ].filter(Boolean).length;

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${getApiBaseUrl()}/api/delete/user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: token } : {}),
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status) {
            setUsers((prev) => prev.filter((user) => user.user_id !== userId));
            message.success("User deleted successfully!");
          } else {
            message.error("Failed to delete user: " + data.message);
          }
        } else {
          message.error("Failed to delete user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        message.error("Error deleting user");
      }
    }
  };

  const openUserDetails = (user: BackendUser) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setShowUserDetails(false);
  };

  const openManufacturerDetails = (manufacturer: ManufacturerOnboarding) => {
    setSelectedManufacturer(manufacturer);
    setShowManufacturerDetails(true);
  };

  const closeManufacturerDetails = () => {
    setSelectedManufacturer(null);
    setShowManufacturerDetails(false);
  };

  const openSupplierDetails = (supplier: SupplierOnboarding) => {
    setSelectedSupplier(supplier);
    setShowSupplierDetails(true);
  };

  const closeSupplierDetails = () => {
    setSelectedSupplier(null);
    setShowSupplierDetails(false);
  };

  const copySupplierQuestionnaireLink = (supplierId: string) => {
    const link = `${window.location.origin}/supplier-questionnaire?sup_id=${supplierId}`;
    navigator.clipboard.writeText(link);
    message.success("Questionnaire link copied to clipboard!");
  };

  const getCurrentPagination = () => {
    if (activeTab === "enviguide") return pagination;
    if (activeTab === "manufacturer") return manufacturerPagination;
    return supplierPagination;
  };

  const renderPagination = (paginationData: typeof pagination & { totalPages?: number }) => {
    if (paginationData.total === 0) return null;

    const totalPages = paginationData.totalPages || Math.ceil(paginationData.total / paginationData.pageSize);

    return (
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">
              {Math.min(
                (paginationData.current - 1) * paginationData.pageSize + 1,
                paginationData.total
              )}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                paginationData.current * paginationData.pageSize,
                paginationData.total
              )}
            </span>{" "}
            of <span className="font-medium">{paginationData.total}</span> records
          </span>
          <Select
            value={paginationData.pageSize}
            onChange={handlePageSizeChange}
            className="w-[100px]"
            size="small"
          >
            <Option value={10}>10 / page</Option>
            <Option value={20}>20 / page</Option>
            <Option value={50}>50 / page</Option>
            <Option value={100}>100 / page</Option>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(paginationData.current - 1)}
            disabled={paginationData.current === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from(
            {
              length: Math.min(totalPages, 5),
            },
            (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (paginationData.current <= 3) {
                pageNum = i + 1;
              } else if (paginationData.current >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = paginationData.current - 2 + i;
              }
              return pageNum;
            }
          ).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`w-9 h-9 rounded-lg font-medium transition-all ${
                paginationData.current === pageNum
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(paginationData.current + 1)}
            disabled={paginationData.current >= totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // EnviGuide Team Tab Content
  const renderEnviGuideTab = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">Loading users...</p>
          </div>
        </div>
      );
    }

    if (showUserDetails && selectedUser) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={closeUserDetails}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Users</span>
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                <p className="text-gray-500">View user information and permissions</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 cursor-not-allowed"
                  value={selectedUser?.user_name || ""}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 cursor-not-allowed"
                  value={selectedUser?.user_email || ""}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 cursor-not-allowed"
                  value={selectedUser?.user_role || ""}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 cursor-not-allowed"
                  value={selectedUser?.user_department || "N/A"}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 cursor-not-allowed"
                  value={selectedUser?.user_phone_number || ""}
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={closeUserDetails}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <Link
                to={`/settings/users/edit/${selectedUser?.user_id}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit User</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3">
              <Select
                value={filters.searchColumn}
                onChange={(value) => handleFilterChange("searchColumn", value)}
                className="min-w-[140px]"
                size="large"
              >
                {SEARCH_COLUMNS.map((col) => (
                  <Option key={col.value} value={col.value}>
                    {col.label}
                  </Option>
                ))}
              </Select>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                  value={quickSearch}
                  onChange={(e) => handleQuickSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleApplyFilters();
                    }
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-600 text-white rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <Select
                    value={filters.role || undefined}
                    onChange={(value) => handleFilterChange("role", value || "")}
                    className="w-full"
                    placeholder="All Roles"
                    allowClear
                    size="large"
                  >
                    {roles.map((role) => (
                      <Option key={role.role_id} value={role.role_name}>
                        {role.role_name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="inline w-4 h-4 mr-1.5 text-gray-500" />
                    Date Range
                  </label>
                  <RangePicker
                    className="w-full"
                    size="large"
                    value={
                      filters.fromDate && filters.toDate
                        ? [dayjs(filters.fromDate), dayjs(filters.toDate)]
                        : null
                    }
                    onChange={handleDateRangeChange}
                    format="YYYY-MM-DD"
                    placeholder={["Start Date", "End Date"]}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <ArrowUpDown className="inline w-4 h-4 mr-1.5 text-gray-500" />
                    Sort By
                  </label>
                  <Select
                    value={filters.sortBy || undefined}
                    onChange={(value) => handleFilterChange("sortBy", value || "")}
                    className="w-full"
                    placeholder="Select field"
                    allowClear
                    size="large"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                  <Select
                    value={filters.sortOrder}
                    onChange={(value) => handleFilterChange("sortOrder", value)}
                    className="w-full"
                    size="large"
                    disabled={!filters.sortBy}
                  >
                    <Option value="asc">Ascending</Option>
                    <Option value="desc">Descending</Option>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-600/20"
                >
                  <Search className="h-4 w-4" />
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {users.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openUserDetails(user)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.user_name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
                          <div className="text-sm text-gray-500">{user.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {user.user_role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.user_department || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.user_phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        {canUpdate("manage users") && (
                          <Link
                            to={`/settings/users/edit/${user.user_id}`}
                            className="text-gray-500 hover:text-green-600 p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                        )}
                        {canDelete("manage users") && (
                          <button
                            className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            onClick={() => handleDeleteUser(user.user_id)}
                            title="Delete User"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <div className="text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {quickSearch || activeFiltersCount > 0
                    ? "No users found matching your search."
                    : "No users found."}
                </p>
                {(quickSearch || activeFiltersCount > 0) && (
                  <button onClick={handleResetFilters} className="mt-2 text-blue-600 hover:text-blue-500">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {renderPagination(pagination)}
      </div>
    );
  };

  // Manufacturer Tab Content
  const renderManufacturerTab = () => {
    if (manufacturerLoading) {
      return (
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">Loading manufacturers...</p>
          </div>
        </div>
      );
    }

    if (showManufacturerDetails && selectedManufacturer) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={closeManufacturerDetails}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Manufacturers</span>
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedManufacturer.name}</h2>
                <p className="text-gray-500">{selectedManufacturer.code}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <p className="text-gray-900">{selectedManufacturer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p className="text-gray-900">{selectedManufacturer.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <p className="text-gray-900">{selectedManufacturer.phone_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <p className="text-gray-900">{selectedManufacturer.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <p className="text-gray-900">{selectedManufacturer.state}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <p className="text-gray-900">{selectedManufacturer.country}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Factory Name</label>
                <p className="text-gray-900">{selectedManufacturer.factory_or_plant_name || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Operation</label>
                <p className="text-gray-900">{selectedManufacturer.years_of_operation || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employees</label>
                <p className="text-gray-900">{selectedManufacturer.number_of_employees || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                <p className="text-gray-900">{selectedManufacturer.contact_person_name || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <p className="text-gray-900">{selectedManufacturer.contact_person_email || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <p className="text-gray-900">{selectedManufacturer.contact_person_phone || "N/A"}</p>
              </div>
            </div>

            {selectedManufacturer.manufacturing_capabilities && selectedManufacturer.manufacturing_capabilities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturing Capabilities</label>
                <div className="flex flex-wrap gap-2">
                  {selectedManufacturer.manufacturing_capabilities.map((cap, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={closeManufacturerDetails}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search manufacturers..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                value={manufacturerSearch}
                onChange={(e) => setManufacturerSearch(e.target.value)}
              />
            </div>
            <Link
              to="/settings/manufacturer-onboarding"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Manufacturer</span>
            </Link>
          </div>
        </div>

        {/* Public Onboarding Link Section */}
        <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Public Registration Link</p>
                <p className="text-xs text-blue-600">{`${window.location.origin}/manufacturer-onboarding`}</p>
              </div>
            </div>
            <Tooltip title="Copy Link">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/manufacturer-onboarding`);
                  message.success("Manufacturer onboarding link copied to clipboard");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Link</span>
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="overflow-x-auto">
          {manufacturers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {manufacturers.map((manufacturer) => (
                  <tr
                    key={manufacturer.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openManufacturerDetails(manufacturer)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Factory className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{manufacturer.name}</div>
                          <div className="text-sm text-gray-500">{manufacturer.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{manufacturer.contact_person_name || "N/A"}</div>
                      <div className="text-sm text-gray-500">{manufacturer.contact_person_designation || ""}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {manufacturer.city}, {manufacturer.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{manufacturer.email}</div>
                      <div className="text-sm text-gray-500">{manufacturer.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View Details">
                          <button
                            onClick={() => openManufacturerDetails(manufacturer)}
                            className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </Tooltip>
                        <Tooltip title="Edit Onboarding">
                          <Link
                            to={`/settings/manufacturer-onboarding/${manufacturer.id}`}
                            className="text-gray-500 hover:text-green-600 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <div className="text-center text-gray-500">
                <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No manufacturers found.</p>
              </div>
            </div>
          )}
        </div>

        {renderPagination(manufacturerPagination)}
      </div>
    );
  };

  // Supplier Tab Content
  const renderSupplierTab = () => {
    if (supplierLoading) {
      return (
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">Loading suppliers...</p>
          </div>
        </div>
      );
    }

    if (showSupplierDetails && selectedSupplier) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={closeSupplierDetails}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Suppliers</span>
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedSupplier.supplier_company_name}</h2>
                <p className="text-gray-500">{selectedSupplier.code}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <p className="text-gray-900">{selectedSupplier.supplier_company_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <p className="text-gray-900">{selectedSupplier.supplier_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p className="text-gray-900">{selectedSupplier.supplier_email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <p className="text-gray-900">{selectedSupplier.supplier_phone_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                <p className="text-gray-900">{selectedSupplier.supplier_business_type || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years in Business</label>
                <p className="text-gray-900">{selectedSupplier.supplier_years_in_business || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <p className="text-gray-900">{selectedSupplier.supplier_city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <p className="text-gray-900">{selectedSupplier.supplier_state}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <p className="text-gray-900">{selectedSupplier.supplier_country}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                <p className="text-gray-900">{selectedSupplier.supplier_gst_number || "N/A"}</p>
              </div>
            </div>

            {selectedSupplier.supplier_supplied_categories && selectedSupplier.supplier_supplied_categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplied Categories</label>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.supplier_supplied_categories.map((cat, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                onClick={() => copySupplierQuestionnaireLink(selectedSupplier.sup_id)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Questionnaire Link</span>
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeSupplierDetails}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => navigate(`/supplier-questionnaire?sup_id=${selectedSupplier.sup_id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Questionnaire</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
            </div>
            <Link
              to="/settings/supplier-onboarding"
              className="bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </Link>
          </div>
        </div>

        {/* Public Onboarding Link Section */}
        <div className="px-4 py-3 border-b border-gray-100 bg-purple-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Public Registration Link</p>
                <p className="text-xs text-purple-600">{`${window.location.origin}/supplier-onboarding`}</p>
              </div>
            </div>
            <Tooltip title="Copy Link">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/supplier-onboarding`);
                  message.success("Supplier onboarding link copied to clipboard");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Link</span>
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="overflow-x-auto">
          {suppliers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr
                    key={supplier.sup_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openSupplierDetails(supplier)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Truck className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{supplier.supplier_company_name}</div>
                          <div className="text-sm text-gray-500">{supplier.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier.supplier_name}</div>
                      <div className="text-sm text-gray-500">{supplier.supplier_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.supplier_city}, {supplier.supplier_state}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {supplier.supplier_supplied_categories?.slice(0, 2).map((cat, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            {cat}
                          </span>
                        ))}
                        {supplier.supplier_supplied_categories && supplier.supplier_supplied_categories.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{supplier.supplier_supplied_categories.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View Details">
                          <button
                            onClick={() => openSupplierDetails(supplier)}
                            className="text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </Tooltip>
                        <Tooltip title="Edit Onboarding">
                          <Link
                            to={`/settings/supplier-onboarding/${supplier.sup_id}`}
                            className="text-gray-500 hover:text-green-600 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Tooltip>
                        <Tooltip title="Copy Questionnaire Link">
                          <button
                            onClick={() => copySupplierQuestionnaireLink(supplier.sup_id)}
                            className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <LinkIcon className="h-5 w-5" />
                          </button>
                        </Tooltip>
                        <Tooltip title="Open Questionnaire">
                          <button
                            onClick={() => navigate(`/supplier-questionnaire?sup_id=${supplier.sup_id}`)}
                            className="text-gray-500 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <div className="text-center text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No suppliers found.</p>
              </div>
            </div>
          )}
        </div>

        {renderPagination(supplierPagination)}
      </div>
    );
  };

  const tabItems = [
    {
      key: "enviguide",
      label: (
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          EnviGuide Team
        </span>
      ),
      children: renderEnviGuideTab(),
    },
    {
      key: "manufacturer",
      label: (
        <span className="flex items-center gap-2">
          <Factory className="h-4 w-4" />
          Manufacturer
        </span>
      ),
      children: renderManufacturerTab(),
    },
    {
      key: "supplier",
      label: (
        <span className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Supplier
        </span>
      ),
      children: renderSupplierTab(),
    },
  ];

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
                <p className="text-gray-500">Manage EnviGuide team, manufacturers, and suppliers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              {activeTab === "enviguide" && canCreate("manage users") && (
                <Link
                  to="/settings/users/create"
                  className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-600/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add User</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={tabItems}
          className="user-management-tabs"
        />
      </div>
    </div>
  );
};

export default UsersPage;
