import React, { useEffect, useState, useCallback } from "react";
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
  Puzzle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  File,
  PlayCircle,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import componentMasterService, {
  type ComponentItem,
  type ComponentStats,
} from "../lib/componentMasterService";

// Helper function to safely format numbers
const formatNumber = (
  val: any,
  decimals: number = 2,
  fallback: string = "0.00",
): string => {
  if (val === null || val === undefined || val === "") return fallback;
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return fallback;
  return num.toFixed(decimals);
};

// Flattened BOM row type for the table
interface FlattenedBOMRow {
  key: string;
  bom_id: string;
  bom_code: string;
  pcf_code: string;
  pcf_request_number: string;
  pcf_sub_date_time: string;
  product_category: string;
  product_code: string;
  product_name: string;
  pcf_id: string;
  status: string;
  material_number: string;
  component_name: string;
  component_category: string;
  detailed_description: string;
  manufacturer: string;
  production_location: string;
  transport_mode: string;
  quantity: number;
  weight_gms: number;
  total_weight_gms: number;
  price: number;
  total_price: number;
  economic_ratio: number;
  split_allocation: boolean;
  sys_expansion_allocation: boolean;
  check_er_less_than_five: string;
  phy_mass_allocation: string;
  econ_allocation: string;
  packaging_type: string;
  pack_weight_kg: number;
  emission_factor_box_kg: number;
  material_emission_total: number;
  distance_km: number;
  logistic_emission: number;
  production_emission: number;
  waste_emission: number;
  total_pcf_value: number;
}

const ComponentsMaster: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [flattenedData, setFlattenedData] = useState<FlattenedBOMRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<ComponentStats | null>(null);

  // Debounce search term - waits 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Transform the component data (each item is a BOM with nested pcf_request)
  const transformComponentData = (
    components: ComponentItem[],
  ): FlattenedBOMRow[] => {
    return components.map((bom) => {
      const pcf = bom.pcf_request || {};
      const allocationMethod = bom.allocation_methodology || {};
      const packaging = bom.packaging_emission_calculation || {};
      const logistic = bom.logistic_emission_calculation || {};
      const pcfTotal = bom.pcf_total_emission_calculation || {};

      let materialEmissionTotal = 0;
      if (bom.material_emission && Array.isArray(bom.material_emission)) {
        materialEmissionTotal = bom.material_emission.reduce(
          (sum: number, m: any) => sum + (m.material_emission || 0),
          0,
        );
      }

      return {
        key: bom.id,
        bom_id: bom.id,
        bom_code: bom.code || "N/A",
        pcf_code: pcf.code || "N/A",
        pcf_request_number: pcf.code || "N/A",
        pcf_sub_date_time: pcf.created_date || bom.created_date || "",
        product_category: pcf.product_category?.name || "N/A",
        product_code: pcf.product_code || "N/A",
        product_name: pcf.product_details?.product_name || pcf.request_title || "N/A",
        pcf_id: pcf.id || "",
        status: pcf.status || "draft",
        material_number: bom.material_number || "N/A",
        component_name: bom.component_name || "N/A",
        component_category: bom.component_category || "N/A",
        detailed_description: bom.detail_description || "N/A",
        manufacturer: bom.manufacturer || pcf.manufacturer?.name || "N/A",
        production_location: bom.production_location || "N/A",
        transport_mode: (logistic as any)?.mode_of_transport || "N/A",
        quantity: bom.qunatity || 0,
        weight_gms: bom.weight_gms || 0,
        total_weight_gms: bom.total_weight_gms || 0,
        price: bom.price || 0,
        total_price: bom.total_price || 0,
        economic_ratio: bom.economic_ratio || 0,
        split_allocation: (allocationMethod as any)?.split_allocation || false,
        sys_expansion_allocation:
          (allocationMethod as any)?.sys_expansion_allocation || false,
        check_er_less_than_five:
          (allocationMethod as any)?.check_er_less_than_five || "N/A",
        phy_mass_allocation:
          (allocationMethod as any)?.phy_mass_allocation_er_less_than_five || "N/A",
        econ_allocation:
          (allocationMethod as any)?.econ_allocation_er_greater_than_five || "N/A",
        packaging_type: (packaging as any)?.packaging_type || "N/A",
        pack_weight_kg: (packaging as any)?.pack_weight_kg || 0,
        emission_factor_box_kg: (packaging as any)?.emission_factor_box_kg || 0,
        material_emission_total: materialEmissionTotal,
        distance_km: (logistic as any)?.distance_km || 0,
        logistic_emission:
          (logistic as any)?.leg_wise_transport_emissions_per_unit_kg_co2e || 0,
        production_emission: (pcfTotal as any)?.production_value || 0,
        waste_emission: (pcfTotal as any)?.waste_value || 0,
        total_pcf_value: (pcfTotal as any)?.total_pcf_value || 0,
      };
    });
  };

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await componentMasterService.getComponentList({
        pageNumber: currentPage,
        pageSize: pageSize,
        search: debouncedSearchTerm || undefined,
        fromDate: dateRange?.[0] || undefined,
        toDate: dateRange?.[1] || undefined,
        pcfStatus: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (result.success && result.data) {
        const data = result.data;
        setComponents(data.data);
        setFlattenedData(transformComponentData(data.data));
        setTotalCount(data.pagination?.total || data.data.length || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        // Set stats from API response
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        message.error(result.message || "Failed to fetch components");
        setComponents([]);
        setFlattenedData([]);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      message.error("Failed to fetch components");
      setComponents([]);
      setFlattenedData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, dateRange, statusFilter]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  // Use stats from API response for KPI cards
  const approved = parseInt(stats?.approved_count || "0", 10);
  const inProgress = parseInt(stats?.in_progress_count || "0", 10);
  const rejected = parseInt(stats?.rejected_count || "0", 10);
  // Calculate total from sum of displayed status counts
  const total = approved + inProgress + rejected;

  const statusCounts = {
    total,
    approved,
    inProgress,
    rejected,
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
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
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return "N/A";
    }
  };

  const getStatusTag = (status: string | undefined) => {
    const statusLower = status?.toLowerCase() || "";
    const statusConfig: Record<string, { color: string; label: string }> = {
      approved: { color: "green", label: "Approved" },
      completed: { color: "green", label: "Completed" },
      submitted: { color: "cyan", label: "Submitted" },
      "in-progress": { color: "blue", label: "In Progress" },
      "in progress": { color: "blue", label: "In Progress" },
      pending: { color: "blue", label: "Pending" },
      draft: { color: "gold", label: "Draft" },
      rejected: { color: "red", label: "Rejected" },
    };
    const config = statusConfig[statusLower] || {
      color: "gold",
      label: status || "Draft",
    };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns: ColumnsType<FlattenedBOMRow> = [
    {
      title: "PCF Request Number",
      dataIndex: "pcf_request_number",
      key: "pcf_request_number",
      width: 220,
      fixed: "left",
      render: (text: string, record: FlattenedBOMRow) => (
        <div className="flex items-center gap-3 py-2">
          <div className="p-2 bg-green-100 rounded-xl flex-shrink-0">
            <Puzzle size={20} className="text-green-600" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            {text}

            <span
              className="text-xs text-gray-500 truncate"
              title={record.product_name}
            >
              {record.product_name}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "BOM Code",
      dataIndex: "bom_code",
      key: "bom_code",
      width: 120,
    },
    {
      title: "PCF Sub Date & Time",
      dataIndex: "pcf_sub_date_time",
      key: "pcf_sub_date_time",
      width: 150,
      render: (text: string) => formatDate(text),
    },
    {
      title: "Product Category",
      dataIndex: "product_category",
      key: "product_category",
      width: 140,
    },
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
      width: 120,
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      width: 180,
    },
    {
      title: "Material Number/ID",
      dataIndex: "material_number",
      key: "material_number",
      width: 150,
    },
    {
      title: "Component Name",
      dataIndex: "component_name",
      key: "component_name",
      width: 140,
    },
    {
      title: "Component Category",
      dataIndex: "component_category",
      key: "component_category",
      width: 150,
    },
    {
      title: "Detailed Descrip",
      dataIndex: "detailed_description",
      key: "detailed_description",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Manufacturer",
      dataIndex: "manufacturer",
      key: "manufacturer",
      width: 150,
    },
    {
      title: "Production Loc",
      dataIndex: "production_location",
      key: "production_location",
      width: 130,
    },
    {
      title: "Transport Mode",
      dataIndex: "transport_mode",
      key: "transport_mode",
      width: 180,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 90,
      align: "right",
    },
    {
      title: "Weight (gms)",
      dataIndex: "weight_gms",
      key: "weight_gms",
      width: 120,
      align: "right",
      render: (val: any) => formatNumber(val, 2),
    },
    {
      title: "Total Weight (gms)",
      dataIndex: "total_weight_gms",
      key: "total_weight_gms",
      width: 150,
      align: "right",
      render: (val: any) => formatNumber(val, 2),
    },
    {
      title: "Price (unit)",
      dataIndex: "price",
      key: "price",
      width: 110,
      align: "right",
      render: (val: any) => formatNumber(val, 2),
    },
    {
      title: "Total Price",
      dataIndex: "total_price",
      key: "total_price",
      width: 110,
      align: "right",
      render: (val: any) => formatNumber(val, 2),
    },
    {
      title: "Economic Ratio",
      dataIndex: "economic_ratio",
      key: "economic_ratio",
      width: 130,
      align: "right",
    },
    {
      title: "Physical Allocation",
      dataIndex: "phy_mass_allocation",
      key: "phy_mass_allocation",
      width: 150,
    },
    {
      title: "Split Allocation",
      dataIndex: "split_allocation",
      key: "split_allocation",
      width: 130,
      render: (val: boolean) => (val ? "Yes" : "No"),
    },
    {
      title: "Sys Exp Allocation",
      dataIndex: "sys_expansion_allocation",
      key: "sys_expansion_allocation",
      width: 150,
      render: (val: boolean) => (val ? "Yes" : "No"),
    },
    {
      title: "Check ER",
      dataIndex: "check_er_less_than_five",
      key: "check_er_less_than_five",
      width: 100,
    },
    {
      title: "Econ Allocation",
      dataIndex: "econ_allocation",
      key: "econ_allocation",
      width: 140,
    },
    {
      title: "Packaging Type",
      dataIndex: "packaging_type",
      key: "packaging_type",
      width: 130,
    },
    {
      title: "Pack Weight (kg)",
      dataIndex: "pack_weight_kg",
      key: "pack_weight_kg",
      width: 140,
      align: "right",
      render: (val: any) => formatNumber(val, 3, "0.000"),
    },
    {
      title: "Material Emission (kg CO2e)",
      dataIndex: "material_emission_total",
      key: "material_emission_total",
      width: 180,
      align: "right",
      render: (val: any) => formatNumber(val, 6, "0.000000"),
    },
    {
      title: "Logistic Emission (kg CO2e)",
      dataIndex: "logistic_emission",
      key: "logistic_emission",
      width: 180,
      align: "right",
      render: (val: any) => formatNumber(val, 6, "0.000000"),
    },
    {
      title: "Production Emission",
      dataIndex: "production_emission",
      key: "production_emission",
      width: 160,
      align: "right",
      render: (val: any) => formatNumber(val, 6, "0.000000"),
    },
    {
      title: "Waste Emission",
      dataIndex: "waste_emission",
      key: "waste_emission",
      width: 140,
      align: "right",
      render: (val: any) => formatNumber(val, 6, "0.000000"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      fixed: "right",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_: any, record: FlattenedBOMRow) => {
        // Find the full BOM data from the components array
        const bomData = components.find((c) => c.id === record.bom_id);
        return (
          <Button
            type="primary"
            onClick={() =>
              navigate(
                `/components-master/view/${record.pcf_code}?bomId=${record.bom_id}`,
                { state: { componentData: bomData } },
              )
            }
            icon={<Eye size={16} />}
            className="shadow-lg shadow-green-600/20"
          >
            View
          </Button>
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
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Puzzle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Components Master
                  </h1>
                  <p className="text-gray-500">
                    Streamlined tracking and administration for all component
                    details
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              {/* Total */}
              <div className="bg-purple-50 rounded-xl p-4 min-w-[120px] border border-purple-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <File className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-purple-600 font-medium">
                      Total
                    </div>
                    <div className="text-xl font-bold text-purple-700">
                      {statusCounts.total}
                    </div>
                  </div>
                </div>
              </div>

              {/* Approved */}
              <div className="bg-green-50 rounded-xl p-4 min-w-[120px] border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-green-600 font-medium">
                      Approved
                    </div>
                    <div className="text-xl font-bold text-green-700">
                      {statusCounts.approved}
                    </div>
                  </div>
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-cyan-50 rounded-xl p-4 min-w-[120px] border border-cyan-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="text-xs text-cyan-600 font-medium">
                      In Progress
                    </div>
                    <div className="text-xl font-bold text-cyan-700">
                      {statusCounts.inProgress}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejected */}
              <div className="bg-red-50 rounded-xl p-4 min-w-[120px] border border-red-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-red-600 font-medium">
                      Rejected
                    </div>
                    <div className="text-xl font-bold text-red-700">
                      {statusCounts.rejected}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Components</h2>
            <Space wrap>
              <Input
                placeholder="Search..."
                prefix={<Search size={16} className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={() => {
                  // Immediately trigger search on Enter without waiting for debounce
                  setDebouncedSearchTerm(searchTerm);
                  setCurrentPage(1);
                }}
                allowClear
                className="w-[200px]"
                size="large"
              />
              <DatePicker.RangePicker
                size="large"
                format="DD MMM YYYY"
                placeholder={["Start Date", "End Date"]}
                onChange={(dates) => {
                  if (dates) {
                    setDateRange([
                      dates[0]?.format("YYYY-MM-DD") || null,
                      dates[1]?.format("YYYY-MM-DD") || null,
                    ]);
                  } else {
                    setDateRange(null);
                  }
                  setCurrentPage(1);
                }}
                className="w-[240px]"
                allowClear
              />
              <Select
                className="w-[150px]"
                size="large"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { label: "All Status", value: "all" },
                  { label: "Approved", value: "Approved" },
                  { label: "In Progress", value: "In Progress" },
                ]}
              />
            </Space>
          </div>

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={flattenedData}
              pagination={false}
              scroll={{ x: 4000, y: 500 }}
              rowKey="key"
              size="small"
              loading={loading}
              className="rounded-xl overflow-hidden"
            />
          </Spin>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              Showing{" "}
              <span className="font-medium text-gray-900">
                {Math.min((currentPage - 1) * pageSize + 1, totalCount || 1)}
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

export default ComponentsMaster;
