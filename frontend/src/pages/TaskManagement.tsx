import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Button,
  Select,
  Space,
  Tag,
  Divider,
  Spin,
  message,
  Popconfirm,
} from "antd";
import { ConfigProvider } from "antd";
import {
  CheckSquare,
  Plus,
  Trash2,
  Filter,
  Clock,
  CheckCircle,
  FileText,
  Eye,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import taskService from "../lib/taskService";
import type { TaskItem } from "../lib/taskService";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../contexts/PermissionContext";

interface TaskManagementItem {
  id: string;
  taskName: string;
  status: "To Do" | "Under Review" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
  assignee: string;
  category: string;
  dueDate: string;
}

const PRIORITY_OPTIONS = [
  { label: "All Priorities", value: "all" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

const TaskManagement: React.FC = () => {
  const { canCreate, canDelete } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tasks, setTasks] = useState<TaskManagementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([
    { label: "All Categories", value: "all" },
  ]);
  const [apiStats, setApiStats] = useState<{
    to_do_count?: string;
    inprogress_count?: string;
    completed_count?: string;
  } | null>(null);
  const navigate = useNavigate();
  // Helper function to format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month}, ${year}`;
    } catch (error) {
      return "N/A";
    }
  };

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await taskService.getCategoryDropdown();
        if (result.success && result.data) {
          setCategoryOptions([
            { label: "All Categories", value: "all" },
            ...result.data.map((cat) => ({
              label: cat.name,
              value: cat.name, // Use name for filtering as API accepts category name
            })),
          ]);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Fetch task list from API
  const fetchTaskList = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await taskService.getTaskList(currentPage, pageSize, {
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
      });

      if (result.success && result.data) {
        // Transform API data to TaskManagementItem
        const transformedData: TaskManagementItem[] = result.data.map(
          (item) => {
            // Get assignee names from assigned_entities array
            const assigneeNames =
              item.assigned_entities?.map((entity) => entity.name).join(", ") ||
              "Unassigned";

            // Map API status to UI status
            const statusMap: Record<string, "To Do" | "Under Review" | "In Progress" | "Completed"> = {
              "Created": "To Do",
              "To Do": "To Do",
              "Under Review": "Under Review",
              "In Progress": "In Progress",
              "Completed": "Completed",
            };

            return {
              id: item.id,
              taskName: item.task_title || "N/A",
              status: statusMap[item.status || "Created"] || "To Do",
              priority: item.priority || "Low",
              assignee: assigneeNames,
              category: item.category_name || "N/A",
              dueDate: item.due_date ? formatDate(item.due_date) : "N/A",
            };
          }
        );

        setTasks(transformedData);
        setTotalCount(result.total_count || 0);
        setTotalPages(result.total_pages || 1);

        // Set API stats for KPI cards
        if (result.stats) {
          setApiStats(result.stats);
        }
      } else {
        message.error(result.message || "Failed to fetch tasks");
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching task list:", error);
      message.error("An error occurred while fetching tasks");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, priorityFilter, categoryFilter]);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchTaskList();
  }, [fetchTaskList]);

  // Use stats from API response for KPI cards
  const statusCounts = {
    toDo: parseInt(apiStats?.to_do_count || "0", 10),
    inProgress: parseInt(apiStats?.inprogress_count || "0", 10),
    completed: parseInt(apiStats?.completed_count || "0", 10),
  };

  // Handle filter changes - reset to page 1
  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      "To Do": { color: "default", label: "To-Do" },
      "Under Review": { color: "orange", label: "Under Review" },
      "In Progress": { color: "blue", label: "In Progress" },
      Completed: { color: "green", label: "Completed" },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const priorityConfig = {
      Low: { color: "green", label: "Low" },
      Medium: { color: "orange", label: "Medium" },
      High: { color: "red", label: "High" },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  // Handle task deletion
  const handleDelete = async (taskId: string) => {
    try {
      const result = await taskService.deleteTask(taskId);
      if (result.success) {
        message.success("Task deleted successfully");
        fetchTaskList();
      } else {
        message.error(result.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      message.error("An error occurred while deleting the task");
    }
  };

  const columns: ColumnsType<TaskManagementItem> = [
    {
      title: "Task",
      dataIndex: "taskName",
      key: "taskName",
      width: 250,
      render: (text) => (
        <Space>
          <FileText size={16} className="text-gray-500" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: "Assignee",
      dataIndex: "assignee",
      key: "assignee",
      width: 150,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 180,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 150,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
          {canDelete("Task Management") && (
            <Popconfirm
              title="Delete Task"
              description="Are you sure you want to delete this task?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
                className="flex items-center justify-center"
              />
            </Popconfirm>
          )}
          <Button
            type="text"
            icon={<Eye size={16} />}
            onClick={() => navigate(`/task-management/view/${record.id}`)}
            className="flex items-center justify-center text-blue-500 hover:text-blue-700"
          />
        </div>
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
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Task Management
                  </h1>
                  <p className="text-gray-500">
                    Organized tracking and execution of all assigned tasks
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Summary Cards */}
            <div className="flex gap-3 flex-wrap">
              {/* To-Do Card */}
              <div className="bg-gray-50 rounded-xl p-4 min-w-[140px] border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">To-Do</div>
                    <div className="text-xl font-bold text-gray-700">
                      {statusCounts.toDo}
                    </div>
                  </div>
                </div>
              </div>

              {/* In Progress Card */}
              <div className="bg-blue-50 rounded-xl p-4 min-w-[140px] border border-blue-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-medium">In Progress</div>
                    <div className="text-xl font-bold text-blue-700">
                      {statusCounts.inProgress}
                    </div>
                  </div>
                </div>
              </div>

              {/* Completed Card */}
              <div className="bg-green-50 rounded-xl p-4 min-w-[140px] border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-green-600 font-medium">Completed</div>
                    <div className="text-xl font-bold text-green-700">
                      {statusCounts.completed}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              <Space wrap>
                <Select
                  placeholder="All Priorities"
                  className="w-[140px]"
                  size="large"
                  value={priorityFilter}
                  onChange={handlePriorityChange}
                  options={PRIORITY_OPTIONS}
                  allowClear
                  onClear={() => handlePriorityChange("all")}
                />
                <Select
                  placeholder="All Categories"
                  className="w-[160px]"
                  size="large"
                  value={categoryFilter}
                  onChange={handleCategoryChange}
                  options={categoryOptions}
                  allowClear
                  onClear={() => handleCategoryChange("all")}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
                {canCreate("Task Management") && (
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    size="large"
                    onClick={() => navigate("/task-management/new")}
                    className="shadow-lg shadow-green-600/20"
                  >
                    Create Task
                  </Button>
                )}
              </Space>
            </div>

            <Spin spinning={isLoading}>
              <Table
                columns={columns}
                dataSource={tasks}
                pagination={false}
                scroll={{ x: 1200 }}
                rowKey="id"
                loading={isLoading}
                className="rounded-xl overflow-hidden"
              />
            </Spin>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-gray-500 text-sm">
                Showing <span className="font-medium text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, totalCount)}</span> of{" "}
                <span className="font-medium text-gray-900">{totalCount}</span> entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => i + 1
                ).map((pageNum) => (
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
                ))}
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

export default TaskManagement;
