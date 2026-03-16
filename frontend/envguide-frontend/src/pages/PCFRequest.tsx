import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Select,
  Space,
  Tag,
  DatePicker,
  Spin,
  message,
  Input,
} from "antd";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Plus,
  Car,
  Battery,
  Lightbulb,
  Microchip,
  Search,
  Pencil,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import pcfService from "../lib/pcfService";
import type { PCFBOMItem } from "../lib/pcfService";
import dayjs from "dayjs";
import { usePermissions } from "../contexts/PermissionContext";

interface PCFRequestItem {
  id: string;
  requestNumber: string;
  productName: string;
  productIcon: React.ReactNode;
  status: string;
  submittedBy: string;
  submittedOn: string;
}

interface PCFFilters {
  search?: string;
  from_date?: string;
  to_date?: string;
  pcf_status?: string;
}

const PCFRequest: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { canCreate } = usePermissions();
  const [pageSize, setPageSize] = useState(10);
  const [pcfRequests, setPcfRequests] = useState<PCFRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  // API Stats
  const [apiStats, setApiStats] = useState<{
    total_pcf_count?: string;
    completed_count?: string;
    approved_count?: string;
    in_progress_count?: string;
    rejected_count?: string;
    draft_count?: string;
    pending_count?: string;
  } | null>(null);

  // Debounce search term - waits 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper function to get product icon based on category
  const getProductIcon = (categoryName: string): React.ReactNode => {
    const category = categoryName?.toLowerCase() || "";
    if (category.includes("battery") || category.includes("power")) {
      return <Battery className="text-green-600" size={20} />;
    } else if (category.includes("frame") || category.includes("chassis")) {
      return <Car className="text-purple-600" size={20} />;
    } else if (category.includes("light")) {
      return <Lightbulb className="text-yellow-600" size={20} />;
    } else if (category.includes("control") || category.includes("unit")) {
      return <Microchip className="text-blue-600" size={20} />;
    }
    return <Car className="text-indigo-600" size={20} />;
  };

  // Build filters object based on current state
  const buildFilters = useCallback((): PCFFilters => {
    const filters: PCFFilters = {};

    // Status filter - use pcf_status param
    if (statusFilter !== "all") {
      filters.pcf_status = statusFilter;
    }

    // Search filter (using debounced value)
    if (debouncedSearchTerm.trim()) {
      filters.search = debouncedSearchTerm.trim();
    }

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      filters.from_date = dateRange[0].format("YYYY-MM-DD");
      filters.to_date = dateRange[1].format("YYYY-MM-DD");
    }

    return filters;
  }, [statusFilter, debouncedSearchTerm, dateRange]);

  // Fetch PCF BOM list from API
  const fetchPCFList = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = buildFilters();
      const result = await pcfService.getPCFBOMList(
        currentPage,
        pageSize,
        filters,
      );

      if (result.success && result.data && Array.isArray(result.data)) {
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
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, "0");
            return `${day} ${month} ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
          } catch (error) {
            return "N/A";
          }
        };

        // Transform API data to PCFRequestItem
        const transformedData: PCFRequestItem[] = result.data.map(
          (item: any) => {
            // Extract actual product name from product_details (new field)
            const productName =
              item.product_details?.product_name ||
              item.request_title ||
              "N/A";

            // Extract product category for icon
            const productCategoryName =
              item.product_category?.name ||
              item.product_category_name ||
              item.component_category?.name ||
              item.component_category_name ||
              "N/A";

            // Extract submitted by from nested structure
            const submittedBy =
              item.pcf_request_stages?.pcf_request_created_by?.user_name ||
              item.created_by_name ||
              "Unknown";

            // Extract created date
            const createdDate =
              item.pcf_request_stages?.pcf_request_created_date ||
              item.created_date ||
              item.createdDate;

            return {
              id: item.id,
              requestNumber: item.code || item.request_number || "N/A",
              productName: productName,
              productIcon: getProductIcon(productCategoryName),
              status: item.status || "Unknown",
              submittedBy: submittedBy,
              submittedOn: createdDate ? formatDate(createdDate) : "N/A",
            };
          },
        );

        setPcfRequests(transformedData);
        setTotalCount(result.total_count || transformedData.length);
        setTotalPages(result.total_pages || 1);

        // Set API stats
        if (result.stats) {
          setApiStats(result.stats);
        }

        // Debug logging
        console.log("PCF List fetched:", {
          totalItems: transformedData.length,
          totalCount: result.total_count,
          totalPages: result.total_pages,
          stats: result.stats,
          sampleItem: transformedData[0],
        });
      } else {
        console.error("PCF List fetch failed:", {
          success: result.success,
          hasData: !!result.data,
          isArray: Array.isArray(result.data),
          result,
        });
        message.error(result.message || "Failed to fetch PCF requests");
        setPcfRequests([]);
      }
    } catch (error) {
      console.error("Error fetching PCF list:", error);
      message.error("An error occurred while fetching PCF requests");
      setPcfRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, buildFilters]);

  // Load data on component mount and when page/filters change
  useEffect(() => {
    fetchPCFList();
  }, [fetchPCFList]);

  // Reset to page 1 when filters change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearch = () => {
    // Immediately trigger search on Enter without waiting for debounce
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
  ) => {
    setDateRange(dates);
    setCurrentPage(1);
  };

  // Use stats from API response for KPI cards
  const statusCounts = {
    total: parseInt(apiStats?.total_pcf_count || "0", 10),
    completed: parseInt(apiStats?.completed_count || "0", 10),
    inProgress: parseInt(apiStats?.in_progress_count || "0", 10),
    approved: parseInt(apiStats?.approved_count || "0", 10),
    rejected: parseInt(apiStats?.rejected_count || "0", 10),
    draft: parseInt(apiStats?.draft_count || "0", 10),
    pending: parseInt(apiStats?.pending_count || "0", 10),
  };

  const getStatusTag = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    const colorConfig: Record<string, string> = {
      "in-progress": "blue",
      "in progress": "blue",
      completed: "green",
      draft: "gold",
      rejected: "red",
      open: "cyan",
      approved: "green",
      pending: "orange",
    };
    const color = colorConfig[statusLower] || "default";
    return <Tag color={color}>{status || "Unknown"}</Tag>;
  };

  const columns: ColumnsType<PCFRequestItem> = [
    {
      title: "PCF Request Number",
      dataIndex: "requestNumber",
      key: "requestNumber",
      width: 180,
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      width: 250,
      render: (_, record) => (
        <Space>
          {record.productIcon}
          <span>{record.productName}</span>
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
      title: "Submitted By",
      dataIndex: "submittedBy",
      key: "submittedBy",
      width: 200,
    },
    {
      title: "Submitted On",
      dataIndex: "submittedOn",
      key: "submittedOn",
      width: 200,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => {
        const isDraft = record.status?.toLowerCase() === "draft";
        return (
          <Space>
            {isDraft ? (
              <Button
                type="text"
                onClick={() => navigate(`/pcf-request/${record.id}/edit`)}
                icon={
                  <Pencil
                    size={16}
                    className="flex items-center justify-center mt-[5px]"
                  />
                }
              >
                Edit
              </Button>
            ) : (
              <Button
                type="text"
                onClick={() => navigate(`/pcf-request/${record.id}`)}
                icon={
                  <Eye
                    size={16}
                    className="flex items-center justify-center mt-[5px]"
                  />
                }
              >
                View
              </Button>
            )}
          </Space>
        );
      },
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
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    PCF Request Management
                  </h1>
                  <p className="text-gray-500">
                    Streamlined carbon footprint tracking and approval workflow
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Summary Cards */}
            <div className="flex gap-3 flex-wrap">
              {/* Total Card */}
              <div className="bg-purple-50 rounded-xl p-4 min-w-[120px] border border-purple-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-purple-600 font-medium">Total</div>
                    <div className="text-xl font-bold text-purple-700">
                      {statusCounts.total}
                    </div>
                  </div>
                </div>
              </div>

              {/* In Progress Card */}
              <div className="bg-blue-50 rounded-xl p-4 min-w-[120px] border border-blue-100 hover:shadow-md transition-shadow">
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
              <div className="bg-teal-50 rounded-xl p-4 min-w-[120px] border border-teal-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-xs text-teal-600 font-medium">Completed</div>
                    <div className="text-xl font-bold text-teal-700">
                      {statusCounts.completed}
                    </div>
                  </div>
                </div>
              </div>

              {/* Approved Card */}
              <div className="bg-green-50 rounded-xl p-4 min-w-[120px] border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-green-600 font-medium">Approved</div>
                    <div className="text-xl font-bold text-green-700">
                      {statusCounts.approved}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejected Card */}
              <div className="bg-red-50 rounded-xl p-4 min-w-[120px] border border-red-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-red-600 font-medium">Rejected</div>
                    <div className="text-xl font-bold text-red-700">
                      {statusCounts.rejected}
                    </div>
                  </div>
                </div>
              </div>

              {/* Draft Card */}
              <div className="bg-amber-50 rounded-xl p-4 min-w-[120px] border border-amber-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs text-amber-600 font-medium">Draft</div>
                    <div className="text-xl font-bold text-amber-700">
                      {statusCounts.draft}
                    </div>
                  </div>
                </div>
              </div>

              {/* Open Card */}
              <div className="bg-orange-50 rounded-xl p-4 min-w-[120px] border border-orange-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs text-orange-600 font-medium">Open</div>
                    <div className="text-xl font-bold text-orange-700">
                      {statusCounts.pending}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              PCF Requests
            </h2>
            <Space wrap>
              <Input
                placeholder="Search code, title, category..."
                prefix={<Search size={16} className="text-gray-400" />}
                size="large"
                className="w-[250px]"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
              <DatePicker.RangePicker
                size="large"
                format="DD MMM YYYY"
                placeholder={["Start Date", "End Date"]}
                value={dateRange}
                onChange={handleDateRangeChange}
                className="w-[260px]"
                allowClear
              />
              <Select
                className="w-[150px]"
                size="large"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                options={[
                  { label: "All Status", value: "all" },
                  { label: "In Progress", value: "In Progress" },
                  { label: "Completed", value: "Completed" },
                  { label: "Open", value: "Open" },
                  { label: "Draft", value: "Draft" },
                  { label: "Approved", value: "Approved" },
                  { label: "Rejected", value: "Rejected" },
                ]}
              />
              {canCreate("PCF Request") && (
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  size="large"
                  onClick={() => navigate("/pcf-request/new")}
                  className="shadow-lg shadow-green-600/20"
                >
                  New Request
                </Button>
              )}
            </Space>
          </div>

          <Spin spinning={isLoading}>
            <Table
              columns={columns}
              dataSource={pcfRequests}
              pagination={false}
              scroll={{ x: 1200 }}
              rowKey="id"
              loading={isLoading}
              className="rounded-xl overflow-hidden"
            />
          </Spin>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              Showing{" "}
              <span className="font-medium text-gray-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-900">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-medium text-gray-900">{totalCount}</span>{" "}
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
              {Array.from(
                { length: Math.min(totalPages, 5) },
                (_, i) => i + 1,
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

export default PCFRequest;
