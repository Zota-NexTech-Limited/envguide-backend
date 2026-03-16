import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import {
    ArrowLeft,
    FileText,
    Star,
    Download,
    Calendar,
    ChevronDown,
    Filter,
    Check,
    Plus,
    Minus,
    Search as SearchIcon,
    X,
    Settings,
    LayoutGrid,
    RotateCcw,
} from "lucide-react";
import { reportsConfig, type ReportConfig } from "../config/reportsConfig";
import { reportService } from "../lib/reportService";
import { authService } from "../lib/authService";
import { message } from "antd";
import { useReportsPermissions } from "../contexts/PermissionContext";

const ReportView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const report = reportsConfig.find((r) => r.id === id);
    const { canExportReports } = useReportsPermissions();

    const [visibleColumns, setVisibleColumns] = useState<string[]>(report?.columns.map(c => c.header) || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_count: 0
    });
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [allFavorites, setAllFavorites] = useState<any>({
        is_product_footprint: false,
        is_supplier_footprint: false,
        is_material_footprint: false,
        is_electricity_footprint: false,
        is_transportation_footprint: false,
        is_packaging_footprint: false,
        is_dqr_rating_footprint: false
    });

    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.userId || currentUser?.id || "";

    useEffect(() => {
        if (id) {
            fetchData();
            fetchFavoriteStatus();
        }
    }, [id]);

    const fetchFavoriteStatus = async () => {
        try {
            const resp = await reportService.fetchFavoriteReports(userId);
            if (resp && resp.data) {
                setAllFavorites(resp.data);
                const favMap: Record<string, boolean> = {
                    "product-footprint": !!resp.data.is_product_footprint,
                    "supplier-footprint": !!resp.data.is_supplier_footprint,
                    "material-footprint": !!resp.data.is_material_footprint,
                    "electricity-footprint": !!resp.data.is_electricity_footprint,
                    "transportation-footprint": !!resp.data.is_transportation_footprint,
                    "packaging-footprint": !!resp.data.is_packaging_footprint,
                    "dqr-rating": !!resp.data.is_dqr_rating_footprint,
                };
                setIsFavorite(!!favMap[id || ""]);
            }
        } catch (error) {
            console.error("Error fetching favorite status:", error);
        }
    };

    const toggleFavorite = async () => {
        if (!id) return;

        const newStatus = !isFavorite;
        setIsFavorite(newStatus); // Optimistic update

        try {
            const currentFavs = allFavorites || {
                is_product_footprint: false,
                is_supplier_footprint: false,
                is_material_footprint: false,
                is_electricity_footprint: false,
                is_transportation_footprint: false,
                is_packaging_footprint: false,
                is_dqr_rating_footprint: false
            };

            const updatedFavs = {
                "is_product_footprint": id === "product-footprint" ? newStatus : !!currentFavs.is_product_footprint,
                "is_supplier_footprint": id === "supplier-footprint" ? newStatus : !!currentFavs.is_supplier_footprint,
                "is_material_footprint": id === "material-footprint" ? newStatus : !!currentFavs.is_material_footprint,
                "is_electricity_footprint": id === "electricity-footprint" ? newStatus : !!currentFavs.is_electricity_footprint,
                "is_transportation_footprint": id === "transportation-footprint" ? newStatus : !!currentFavs.is_transportation_footprint,
                "is_packaging_footprint": id === "packaging-footprint" ? newStatus : !!currentFavs.is_packaging_footprint,
                "is_dqr_rating_footprint": id === "dqr-rating" ? newStatus : !!currentFavs.is_dqr_rating_footprint,
            };

            const payload = {
                user_id: userId,
                ...updatedFavs
            };

            const resp = await reportService.upsertFavoriteReport(payload);
            if (resp && (resp.status || resp.success)) {
                message.success(newStatus ? "Added to favorites" : "Removed from favorites");
                // Refresh full favorites state
                setAllFavorites({ ...allFavorites, ...updatedFavs });
            } else {
                setIsFavorite(!newStatus);
                message.error("Failed to update favorite");
            }
        } catch (error) {
            setIsFavorite(!newStatus);
            message.error("Network error");
        }
    };

    const handleDateRangeChange = (
        dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    ) => {
        setDateRange(dates);
        fetchData(1);
    };

    const fetchData = async (page = 1) => {
        if (!report?.endpoint) return;

        setLoading(true);
        try {
            // Collect all filters
            const filters: Record<string, any> = {};

            // 1. Date Range Filter
            if (dateRange && dateRange[0] && dateRange[1]) {
                filters.from_date = dateRange[0].format("YYYY-MM-DD");
                filters.to_date = dateRange[1].format("YYYY-MM-DD");
            }

            // 2. Global Search / General Filter (mapping depends on API, but using 'search' as common)
            if (searchQuery) {
                filters.search = searchQuery;
            }

            // 3. "More Filters" Rows
            filterRows.forEach(row => {
                if (row.column && row.value1) {
                    const colConfig = report.columns.find(c => c.header === row.column);
                    const filterKey = colConfig?.filterKey || row.column.toLowerCase().replace(/\s+/g, '_');

                    if (row.condition === "Range") {
                        filters[`${filterKey}_from`] = row.value1;
                        filters[`${filterKey}_to`] = row.value2;
                    } else if (row.condition === "Greater than") {
                        filters[`${filterKey}_gt`] = row.value1;
                    } else if (row.condition === "Less than") {
                        filters[`${filterKey}_lt`] = row.value1;
                    } else {
                        filters[filterKey] = row.value1;
                    }
                }
            });

            const response = await reportService.getReportData(report.endpoint, page, 20, filters);

            if (response?.success) {
                setReportData(response.data);
                setPagination({
                    current_page: response.current_page || 1,
                    total_pages: response.total_pages || 1,
                    total_count: response.total_count || 0
                });
            }
        } catch (error) {
            console.error("Error fetching report data:", error);
            message.error("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    // Update visible columns if report changes
    React.useEffect(() => {
        if (report?.columns) {
            setVisibleColumns(report.columns.map(c => c.header));
            fetchData(1);
        }
    }, [report]);

    const toggleColumn = (columnHeader: string) => {
        setVisibleColumns(prev =>
            prev.includes(columnHeader)
                ? prev.filter(c => c !== columnHeader)
                : [...prev, columnHeader]
        );
    };

    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [isReportVisible, setIsReportVisible] = useState(true);
    const [filterRows, setFilterRows] = useState<{ id: number; column: string; condition: string; value1: string; value2: string }[]>([]);

    const getColumnType = (col: string): "string" | "number" => {
        if (!col) return "string";
        const numCols = ["SL.NO", "SL. No.", "Sl.No", "Sl. No", "Carbon Footprint", "Footprint Per Unit", "Total Footprint", "Quantity", "Intensity", "DQR Rating"];
        if (numCols.some(n => col.includes(n))) return "number";
        return "string";
    };

    const resolvePath = (obj: any, path: string): any => {
        if (!path) return undefined;

        // Convert [n] to .n for consistent splitting
        const cleanPath = path.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '');
        const segments = cleanPath.split('.');

        let current = obj;
        for (let i = 0; i < segments.length; i++) {
            if (current === undefined || current === null) return undefined;

            const segment = segments[i];

            // If we hit an array but the current segment is not a numeric index,
            // it means we should map the remaining path over all elements in the array.
            if (Array.isArray(current) && isNaN(Number(segment))) {
                const remainingPath = segments.slice(i).join('.');
                const results = current.map(item => resolvePath(item, remainingPath));

                // Flatten, filter out empty values, and get unique results
                const flattened = results.flat().filter(r => r !== undefined && r !== null && r !== "");
                const uniqueResults = [...new Set(flattened)];

                return uniqueResults.length > 0 ? uniqueResults : "-";
            }

            current = current[segment];
        }

        return current;
    };

    const addFilterRow = () => {
        setFilterRows([...filterRows, { id: Date.now(), column: "", condition: "", value1: "", value2: "" }]);
    };

    const removeFilterRow = (id: number) => {
        setFilterRows(filterRows.filter(row => row.id !== id));
    };

    const updateFilterRow = (id: number, updates: any) => {
        setFilterRows(filterRows.map(row => {
            if (row.id === id) {
                const newRow = { ...row, ...updates };
                // Reset condition if column changed
                if (updates.column && updates.column !== row.column) {
                    newRow.condition = getColumnType(updates.column) === "string" ? "Equal to" : "Less than";
                    newRow.value1 = "";
                    newRow.value2 = "";
                }
                return newRow;
            }
            return row;
        }));
    };

    const hasActiveFilters = dateRange !== null || filterRows.some(row => row.column && row.value1) || searchQuery !== "";

    const handleClearAll = () => {
        setDateRange(null);
        setFilterRows([]);
        setSearchQuery("");
        setSearchQuery(""); // For good measure if there was another search state
        setShowMoreFilters(false);
        setIsReportVisible(true);
        // We need to fetch data with cleared filters
        setLoading(true);
        reportService.getReportData(report?.endpoint || "", 1, 20, {}).then(response => {
            if (response?.success) {
                setReportData(response.data);
                setPagination({
                    current_page: response.current_page || 1,
                    total_pages: response.total_pages || 1,
                    total_count: response.total_count || 0
                });
            }
        }).finally(() => setLoading(false));
    };

    const handleDownloadCSV = () => {
        if (!reportData || reportData.length === 0 || !report) return;

        // 1. Prepare Headers (skipping SL.NO if it's just an index)
        const csvHeaders = report.columns
            .filter(col => col.key !== 'index')
            .map(col => `"${col.header.replace(/"/g, '""')}"`);

        // 2. Prepare Rows
        const csvRows = reportData.map(row => {
            return report.columns
                .filter(col => col.key !== 'index')
                .map(col => {
                    let val = resolvePath(row, col.key);

                    // Format value for CSV
                    if (Array.isArray(val)) {
                        val = val.join('; '); // Semicolon as internal separator for arrays
                    } else if (val === undefined || val === null) {
                        val = "-";
                    }

                    // Escape quotes and wrap in quotes
                    return `"${String(val).replace(/"/g, '""')}"`;
                })
                .join(',');
        });

        // 3. Combine and Download
        const csvString = [csvHeaders.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const fileName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredColumns = report?.columns?.filter(c =>
        c.header.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="flex-1 overflow-auto bg-gray-50/30 p-8 pt-6 relative">
            <div className="max-w-9xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/reports")}
                    className="flex items-center gap-2 text-gray-900 font-bold hover:text-green-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Reports
                </button>

                {/* Report Header Banner */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${report?.iconColor || "bg-green-500 text-white shadow-green-100"}`}>
                            {report?.icon ? <report.icon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{report?.title || "Report"}</h1>
                            <p className="text-gray-500">
                                {report?.description || "Report analysis and overview"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleFavorite}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors cursor-pointer ${isFavorite
                                ? "bg-orange-50 border-orange-200 text-orange-600 font-bold"
                                : "border-gray-100 text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <Star className={`w-4 h-4 ${isFavorite ? "text-orange-400 fill-orange-400" : "text-gray-400"}`} />
                            {isFavorite ? "Favorited" : "Add to Favorites"}
                        </button>
                        {canExportReports && (
                            <button
                                onClick={handleDownloadCSV}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                title="Export to CSV"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600 cursor-pointer">
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                    </button>

                    <DatePicker.RangePicker
                        size="large"
                        format="DD MMM YYYY"
                        placeholder={["Start Date", "End Date"]}
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        className="w-[260px] !border-gray-100 !rounded-lg !text-xs !font-medium cursor-pointer"
                        allowClear
                    />

                    <button
                        onClick={() => {
                            const newState = !showMoreFilters;
                            setShowMoreFilters(newState);
                            setIsReportVisible(!newState);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterRows.some(row => row.column && row.value1)
                            ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200"
                            : showMoreFilters
                                ? "bg-green-50 border-green-200 text-green-600"
                                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        <Plus className={`w-3.5 h-3.5 ${showMoreFilters ? "rotate-45" : ""} transition-transform`} />
                        More Filters
                        {filterRows.filter(row => row.column && row.value1).length > 0 && (
                            <span className="ml-1 bg-white text-green-600 w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                                {filterRows.filter(row => row.column && row.value1).length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setShowMoreFilters(false);
                            setIsReportVisible(true);
                            fetchData(1);
                        }}
                        className="bg-blue-600 text-white px-8 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 ml-2 cursor-pointer"
                    >
                        Apply
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={handleClearAll}
                            className="text-red-400 hover:text-red-500 text-xs font-bold px-4 py-1.5 transition-colors border border-red-200 bg-red-50 hover:border-red-200 hover:bg-red-100 rounded-lg ml-1 cursor-pointer"
                        >
                            Clear All
                        </button>
                    )}

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="ml-auto flex items-center gap-2 px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Select Columns
                    </button>
                </div>

                {/* More Filters Rows */}
                {showMoreFilters && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {filterRows.map((row) => (
                            <div key={row.id} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-in fade-in zoom-in duration-200">
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    {/* Column Selector */}
                                    <div className="relative group">
                                        <select
                                            value={row.column}
                                            onChange={(e) => updateFilterRow(row.id, { column: e.target.value })}
                                            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 cursor-pointer transition-all hover:border-gray-300"
                                        >
                                            <option value="" disabled>Select Column</option>
                                            {report?.columns?.filter(col => !["SL.NO", "SL. No.", "Sl.No", "Sl. No", "SL NO"].includes(col.header.toUpperCase())).map(col => (
                                                <option key={col.header} value={col.header}>{col.header}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                    </div>

                                    {/* Condition Selector */}
                                    <div className="relative group">
                                        <select
                                            value={row.condition}
                                            onChange={(e) => updateFilterRow(row.id, { condition: e.target.value })}
                                            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 cursor-pointer transition-all hover:border-gray-300"
                                        >
                                            <option value="" disabled>Condition</option>
                                            {!row.column ? (
                                                <option disabled>Select a column first</option>
                                            ) : getColumnType(row.column) === "string" ? (
                                                <option value="Equal to">Equal to</option>
                                            ) : (
                                                <>
                                                    <option value="Less than">Less than</option>
                                                    <option value="Greater than">Greater than</option>
                                                    <option value="Equal to">Equal to</option>
                                                    <option value="Range">Range (From and To)</option>
                                                </>
                                            )}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                    </div>

                                    {/* Value Input */}
                                    <div className="flex items-center gap-2">
                                        {row.condition === "Range" ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="number"
                                                    placeholder="From"
                                                    value={row.value1}
                                                    onChange={(e) => updateFilterRow(row.id, { value1: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all"
                                                />
                                                <span className="text-gray-400 text-xs">to</span>
                                                <input
                                                    type="number"
                                                    placeholder="To"
                                                    value={row.value2}
                                                    onChange={(e) => updateFilterRow(row.id, { value2: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all"
                                                />
                                            </div>
                                        ) : (
                                            <input
                                                type={getColumnType(row.column) === "number" ? "number" : "text"}
                                                placeholder="Select or input values"
                                                value={row.value1}
                                                onChange={(e) => updateFilterRow(row.id, { value1: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all hover:border-gray-300"
                                            />
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFilterRow(row.id)}
                                    className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addFilterRow}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-green-300 hover:text-green-600 hover:bg-green-50/30 transition-all w-full justify-center group"
                        >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Add Another Filter Condition
                        </button>
                    </div>
                )}

                {/* Data Table */}
                {isReportVisible && (
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-max">
                                <thead>
                                    <tr className="bg-[#1EB564] text-white">
                                        {report?.columns?.filter(col => visibleColumns.includes(col.header)).map((column, index) => (
                                            <th key={index} className="px-6 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                                {column.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={visibleColumns.length} className="px-6 py-10 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-sm text-gray-500 font-medium">Loading report data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : reportData.length > 0 ? (
                                        reportData.map((row, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                                                {report?.columns?.filter(col => visibleColumns.includes(col.header)).map((col, colIdx) => {
                                                    const dataKey = col.key;
                                                    let displayValue = resolvePath(row, dataKey);

                                                    if (dataKey === "index") {
                                                        displayValue = (pagination.current_page - 1) * 20 + rowIdx + 1;
                                                    }

                                                    return (
                                                        <td key={colIdx} className="px-6 py-4 text-sm text-gray-600">
                                                            {Array.isArray(displayValue) ? (
                                                                <div className="flex flex-wrap gap-1.5 min-w-[150px]">
                                                                    {displayValue.map((val, i) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-bold whitespace-nowrap">
                                                                            {String(val)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="whitespace-nowrap">
                                                                    {displayValue !== undefined && displayValue !== null ? String(displayValue) : "-"}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={visibleColumns.length} className="px-6 py-10 text-center text-gray-500">
                                                No data available for this report.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Column Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Select Columns</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search here"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-12 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 text-xs font-bold hover:text-blue-600"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto space-y-1 scrollbar-hide">
                                {filteredColumns.map((column) => (
                                    <label
                                        key={column.header}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${visibleColumns.includes(column.header)
                                            ? "bg-green-50"
                                            : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <div
                                            onClick={() => toggleColumn(column.header)}
                                            className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${visibleColumns.includes(column.header)
                                                ? "bg-purple-600 border-purple-600"
                                                : "bg-white border-gray-300"
                                                }`}
                                        >
                                            {visibleColumns.includes(column.header) && (
                                                <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                                            {column.header}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportView;

