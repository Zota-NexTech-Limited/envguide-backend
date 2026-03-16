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
  Package,
  Eye,
  Plus,
  Edit,
  Search,
  X,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import productService from "../lib/productService";
import type { Product, ProductCategory } from "../lib/productService";
import { usePermissions } from "../contexts/PermissionContext";

const AllProducts: React.FC = () => {
  const navigate = useNavigate();
  const { canCreate, canUpdate } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null] | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, dateRange]);

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productService.getProductCategories();
        if (response?.status && response.data) {
          const cats = Array.isArray(response.data) ? response.data : response.data.rows || [];
          const options = cats.map((cat: ProductCategory) => ({
            label: cat.name,
            value: cat.name, // Use name for API filter (category_name param)
          }));
          setCategories([{ label: "All Categories", value: "all" }, ...options]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([{ label: "All Categories", value: "all" }]);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }
      if (categoryFilter && categoryFilter !== "all") {
        filters.category_name = categoryFilter;
      }
      if (statusFilter && statusFilter !== "all") {
        // Map filter values to API expected values
        const statusMap: Record<string, string> = {
          "available": "Available",
          "in-progress": "In Progress",
          "not-available": "Not Available",
        };
        filters.pcf_status = statusMap[statusFilter];
      }
      if (dateRange && dateRange[0]) {
        filters.start_date = dateRange[0];
      }
      if (dateRange && dateRange[1]) {
        filters.end_date = dateRange[1];
      }

      const response = await productService.getProducts(currentPage, pageSize, filters);

      if (response?.status) {
        const data = response.data;
        // New format: { data: [...], pagination: { total, page, limit, totalPages } }
        const pagination = data?.pagination || {};
        let safeProducts: Product[] = [];

        if (Array.isArray(data)) {
          safeProducts = data as Product[];
        } else if (data && Array.isArray(data.data)) {
          // New format: data.data contains products array
          safeProducts = data.data as Product[];
        } else if (data && Array.isArray(data.rows)) {
          safeProducts = data.rows as Product[];
        }

        setProducts(safeProducts);
        // Handle pagination format: { total, page, limit, totalPages }
        const total = pagination.total || data?.totalCount || data?.total || safeProducts.length;
        const pages = pagination.totalPages || data?.totalPages || Math.max(1, Math.ceil(total / pageSize));
        setTotalCount(total);
        setTotalPages(pages);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, categoryFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Format date helper
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return "-";
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchText("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setDateRange(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || categoryFilter !== "all" || debouncedSearch || dateRange;

  const getStatusTag = (status: string | undefined) => {
    if (status === "Available") {
      return <Tag color="green">PCF Available</Tag>;
    } else if (status === "In Progress") {
      return <Tag color="blue">In Progress</Tag>;
    }
    return <Tag color="default">Not Available</Tag>;
  };

  const columns: ColumnsType<Product> = [
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
      width: 130,
      render: (text) => <span className="font-medium text-gray-900">{text}</span>,
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      width: 220,
      render: (text) => (
        <Space>
          <Package className="text-green-600" size={18} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "Category",
      dataIndex: "category_name",
      key: "category_name",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "Sub Category",
      dataIndex: "sub_category_name",
      key: "sub_category_name",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "PCF Status",
      dataIndex: "pcf_status",
      key: "pcf_status",
      width: 130,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Created By",
      dataIndex: "created_by_name",
      key: "created_by_name",
      width: 130,
      render: (text) => text || "-",
    },
    {
      title: "Created On",
      dataIndex: "created_date",
      key: "created_date",
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: "Updated BY",
      dataIndex: "updated_by_name",
      key: "updated_by_name",
      width: 130,
      render: (text) => text || "-",
    },
    {
      title: "Updated Date",
      dataIndex: "update_date",
      key: "update_date",
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            onClick={() => navigate(`/product-portfolio/view/${record.id}`)}
            icon={<Eye size={16} className="mt-[5px]" />}
            title="View"
          />
          {canUpdate("Product Portfolio") && (
            <Button
              type="text"
              onClick={() => navigate(`/product-portfolio/edit/${record.id}`)}
              icon={<Edit size={16} className="mt-[5px]" />}
              title="Edit"
            />
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
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    All Products
                  </h1>
                  <p className="text-gray-500">
                    Manage your product catalog and PCF tracking
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Products Table Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Products</h2>
              {hasActiveFilters && (
                <Button
                  type="text"
                  size="small"
                  icon={<X size={14} />}
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-red-500"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            <Space wrap>
              <Input
                placeholder="Search products..."
                prefix={<Search size={16} className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="large"
                className="w-[220px]"
              />
              <DatePicker.RangePicker
                size="large"
                format="DD MMM YYYY"
                placeholder={["Start Date", "End Date"]}
                value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                onChange={(dates) => {
                  if (dates) {
                    setDateRange([
                      dates[0]?.format("YYYY-MM-DD") || null,
                      dates[1]?.format("YYYY-MM-DD") || null,
                    ]);
                  } else {
                    setDateRange(null);
                  }
                }}
                className="w-[240px]"
                allowClear
              />
              <Select
                placeholder="PCF Status"
                className="w-[150px]"
                size="large"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { label: "All Status", value: "all" },
                  { label: "PCF Available", value: "available" },
                  { label: "In Progress", value: "in-progress" },
                  { label: "Not Available", value: "not-available" },
                ]}
              />
              <Select
                placeholder="Category"
                className="w-[180px]"
                size="large"
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value || "all")}
                options={categories}
                allowClear
                onClear={() => setCategoryFilter("all")}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
              {canCreate("Product Portfolio") && (
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  size="large"
                  onClick={() => navigate("/product-portfolio/new")}
                  className="shadow-lg shadow-green-600/20"
                >
                  Add Product
                </Button>
              )}
            </Space>
          </div>

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={products}
              pagination={false}
              scroll={{ x: 1450 }}
              rowKey="id"
              loading={loading}
              className="rounded-xl overflow-hidden"
              locale={{
                emptyText: hasActiveFilters ? (
                  <div className="py-8 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No products match your filters</p>
                    <Button type="link" onClick={clearFilters}>Clear all filters</Button>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No products found</p>
                  </div>
                ),
              }}
            />
          </Spin>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              Showing <span className="font-medium text-gray-900">{Math.min((currentPage - 1) * pageSize + 1, totalCount)}</span> to{" "}
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

export default AllProducts;
