import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Select,
  Space,
  Tag,
  Input,
  Spin,
  message,
  Popconfirm,
  Switch,
} from "antd";
import {
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone,
  Filter,
  X,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import alertManagementService from "../../lib/alertManagementService";
import type { AlertListItem } from "../../lib/alertManagementService";
import { usePermissions } from "../../contexts/PermissionContext";
import dayjs from "dayjs";

const { Option } = Select;

const AlertManagement: React.FC = () => {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const [alerts, setAlerts] = useState<AlertListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (searchText) filters.alert_name = searchText;
      if (priorityFilter !== "all") filters.priority = priorityFilter;
      if (statusFilter !== "all") filters.status = statusFilter === "active";

      const result = await alertManagementService.getAlertList(
        currentPage,
        pageSize,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      if (result.success) {
        // Ensure data is always an array
        const alertsData = Array.isArray(result.data) ? result.data : [];
        setAlerts(alertsData);
        if (result.pagination) {
          setTotalCount(result.pagination.total || 0);
          setTotalPages(result.pagination.totalPages || 1);
        }
      } else {
        message.error(result.message || "Failed to fetch alerts");
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      message.error("An error occurred while fetching alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, priorityFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleDelete = async (id: string) => {
    try {
      const result = await alertManagementService.deleteAlert(id);
      if (result.success) {
        message.success("Alert deleted successfully");
        fetchAlerts();
      } else {
        message.error(result.message || "Failed to delete alert");
      }
    } catch (error) {
      message.error("An error occurred while deleting alert");
    }
  };

  const clearFilters = () => {
    setSearchText("");
    setPriorityFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchText || priorityFilter !== "all" || statusFilter !== "all";

  const getPriorityTag = (priority: string) => {
    const config: Record<string, { color: string; label: string }> = {
      Low: { color: "green", label: "Low" },
      Medium: { color: "orange", label: "Medium" },
      High: { color: "red", label: "High" },
    };
    const { color, label } = config[priority] || { color: "default", label: priority };
    return <Tag color={color}>{label}</Tag>;
  };

  const getFrequencyTag = (frequency: string) => {
    const config: Record<string, { color: string }> = {
      Immediate: { color: "red" },
      Daily: { color: "blue" },
      Weekly: { color: "purple" },
      Monthly: { color: "cyan" },
      Normal: { color: "default" },
    };
    const { color } = config[frequency] || { color: "default" };
    return <Tag color={color}>{frequency}</Tag>;
  };

  const columns: ColumnsType<AlertListItem> = [
    {
      title: "Alert Name",
      dataIndex: "alert_name",
      key: "alert_name",
      render: (text) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Bell size={16} className="text-green-600" />
          </div>
          <span className="font-medium text-gray-900">{text}</span>
        </div>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
      width: 120,
      render: (frequency) => getFrequencyTag(frequency),
    },
    {
      title: "Channels",
      key: "channels",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.is_email && (
            <Tag color="blue" className="flex items-center gap-1">
              <Mail size={12} />
              Email
            </Tag>
          )}
          {record.is_sms && (
            <Tag color="green" className="flex items-center gap-1">
              <MessageSquare size={12} />
              SMS
            </Tag>
          )}
          {record.is_whatsapp && (
            <Tag color="cyan" className="flex items-center gap-1">
              <Smartphone size={12} />
              WhatsApp
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={status ? "green" : "default"}>
          {status ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          {canUpdate("alert management") && (
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => navigate(`/settings/alert-management/edit/${record.id}`)}
              className="text-gray-500 hover:text-green-600"
            />
          )}
          {canDelete("alert management") && (
            <Popconfirm
              title="Delete Alert"
              description="Are you sure you want to delete this alert?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
                className="text-gray-500 hover:text-red-600"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-6">
            {/* Left Section - Title and Description */}
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Alert Management
                  </h1>
                  <p className="text-gray-500">
                    Configure and manage system alerts and notifications
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex gap-3">
              {canCreate("alert management") && (
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  size="large"
                  onClick={() => navigate("/settings/alert-management/new")}
                  className="shadow-lg shadow-green-600/20"
                >
                  Create Alert
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Alerts Table Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          {/* Filters Row */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-gray-900">All Alerts</h2>
            <Space wrap>
              <Input
                prefix={<Search size={16} className="text-gray-400" />}
                placeholder="Search alerts..."
                className="w-[200px]"
                size="large"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
              />
              <Button
                icon={<Filter size={16} />}
                size="large"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "border-green-500 text-green-600" : ""}
              >
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block" />
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  icon={<X size={16} />}
                  size="large"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              )}
            </Space>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <Select
                    value={priorityFilter}
                    onChange={(value) => {
                      setPriorityFilter(value);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                    size="large"
                  >
                    <Option value="all">All Priorities</Option>
                    <Option value="Low">Low</Option>
                    <Option value="Medium">Medium</Option>
                    <Option value="High">High</Option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                    size="large"
                  >
                    <Option value="all">All Status</Option>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={alerts}
              rowKey="id"
              pagination={false}
              scroll={{ x: 900 }}
              className="rounded-xl overflow-hidden"
            />
          </Spin>

          {/* Pagination */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              Showing{" "}
              <span className="font-medium text-gray-900">
                {Math.min((currentPage - 1) * pageSize + 1, totalCount)}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-900">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900">{totalCount}</span>{" "}
              entries
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-lg font-medium transition-all ${
                      currentPage === pageNum
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/20"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertManagement;
