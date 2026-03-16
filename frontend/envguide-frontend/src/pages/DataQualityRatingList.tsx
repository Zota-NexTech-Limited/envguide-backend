import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  Eye,
  Loader,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Select } from "antd";
import supplierQuestionnaireService from "../lib/supplierQuestionnaireService";
import authService from "../lib/authService";

const { Option } = Select;

interface DQRItem {
  sgiq_id: string;
  bom_pcf_id?: string;
  organization_name?: string;
  core_business_activitiy?: string;
  designation?: string;
  email_address?: string;
  created_date?: string;
  update_date?: string;
  supplier_details?: {
    sup_id: string;
    code: string;
    supplier_name: string;
    supplier_email: string;
    supplier_phone_number: string;
  };
  bom?: Array<{
    bom_id: string;
    material_number: string;
    component_name: string;
    production_location: string;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  totalCount: number;
}

interface DQRSummary {
  total_dqr_count: number;
  pending_dqr_count: number;
  completed_dqr_count: number;
}

const DataQualityRatingList: React.FC = () => {
  const navigate = useNavigate();
  const [dqrList, setDqrList] = useState<DQRItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 9,
    totalRecords: 0,
    totalPages: 0,
    totalCount: 0,
  });
  const [dqrSummary, setDqrSummary] = useState<DQRSummary>({
    total_dqr_count: 0,
    pending_dqr_count: 0,
    completed_dqr_count: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, pageSize]);

  // Fetch data when page, search, or pageSize changes
  useEffect(() => {
    fetchDQRList(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, pageSize]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const fetchDQRList = async (page: number = 1, search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!authService.isAuthenticated()) {
        setError("User not authenticated");
        return;
      }

      const result = await supplierQuestionnaireService.listDQRRatings(
        page,
        pageSize,
        undefined,
        search || undefined
      );

      if (result.success && result.data) {
        setDqrList(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        }
        if (result.dqr_summary) {
          setDqrSummary(result.dqr_summary);
        }
      } else {
        setError(result.message || "Failed to load DQR list");
      }
    } catch (error) {
      console.error("Error fetching DQR list:", error);
      setError("An error occurred while fetching DQR list");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Use dqr_summary from API for stats
  const stats = {
    total: dqrSummary.total_dqr_count,
    completed: dqrSummary.completed_dqr_count,
    pending: dqrSummary.pending_dqr_count,
  };

  if (isLoading && dqrList.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader
            size={48}
            className="animate-spin text-green-500 mx-auto mb-4"
          />
          <p className="text-gray-600">Loading data quality ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex justify-between items-center flex-wrap gap-6">
          {/* Left Section - Title and Description */}
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Data Quality Ratings
                </h1>
                <p className="text-gray-500">
                  Review and assess data quality from supplier submissions
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Summary Cards */}
          <div className="flex gap-3 flex-wrap">
            {/* Total Assessments */}
            <div className="bg-blue-50 rounded-xl p-4 min-w-[140px] border border-blue-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-blue-600 font-medium">Total</div>
                  <div className="text-xl font-bold text-blue-700">{stats.total}</div>
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-amber-50 rounded-xl p-4 min-w-[140px] border border-amber-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs text-amber-600 font-medium">Pending</div>
                  <div className="text-xl font-bold text-amber-700">{stats.pending}</div>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-green-50 rounded-xl p-4 min-w-[140px] border border-green-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 w-10 h-10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-green-600 font-medium">Completed</div>
                  <div className="text-xl font-bold text-green-700">{stats.completed}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by organization, supplier, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex items-center gap-3">
          <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dqrList.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Star size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No assessments found</p>
              <p className="text-sm">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Complete supplier questionnaires to see data quality ratings"}
              </p>
            </div>
          </div>
        ) : (
          dqrList.map((item) => (
            <div
              key={item.sgiq_id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Building2 size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.organization_name || item.supplier_details?.supplier_name || `ID: ${item.sgiq_id?.slice(0, 8)}...`}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {item.bom?.length || 0} BOM items
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {item.supplier_details && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Supplier</span>
                      <span className="font-medium text-gray-900">
                        {item.supplier_details.supplier_name}
                      </span>
                    </div>
                  )}
                  {item.core_business_activitiy && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Business</span>
                      <span className="font-medium text-gray-900">
                        {item.core_business_activitiy}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span className="text-gray-900 font-medium flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(item.created_date)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const params = new URLSearchParams({
                      sgiq_id: item.sgiq_id,
                    });
                    if (item.bom_pcf_id) {
                      params.append("bom_pcf_id", item.bom_pcf_id);
                    }
                    navigate(`/data-quality-rating/view?${params.toString()}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:shadow-lg shadow-lg shadow-green-600/20 transition-all font-medium"
                >
                  <Eye size={18} />
                  <span>View Assessment</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {(pagination.totalRecords > 0 || pagination.totalCount > 0) && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader size={14} className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-medium">
                      {Math.min(((currentPage - 1) * pageSize) + 1, pagination.totalRecords || pagination.totalCount)}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, pagination.totalRecords || pagination.totalCount)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {pagination.totalRecords || pagination.totalCount}
                    </span>{" "}
                    assessments
                  </>
                )}
              </span>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="w-[110px]"
                size="small"
              >
                <Option value={9}>9 / page</Option>
                <Option value={18}>18 / page</Option>
                <Option value={27}>27 / page</Option>
                <Option value={45}>45 / page</Option>
              </Select>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-green-600 text-white"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages || isLoading}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages || isLoading}
                  className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Last
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQualityRatingList;
