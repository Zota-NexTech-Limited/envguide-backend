import authService from "./authService";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T = any> {
    status: boolean;
    message: string;
    code: number;
    data?: T;
    success?: boolean;
}

export interface ReportListResponse {
    success: boolean;
    message: string;
    data: any[];
    current_page: number;
    total_pages: number;
    total_count: number;
}

class ReportService {
    private getHeaders() {
        const token = authService.getToken();
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${token}` } : {}),
        };
    }

    private async fetchReport(endpoint: string, pageNumber: number, pageSize: number, filters: Record<string, any> = {}): Promise<ReportListResponse> {
        try {
            // Build query parameters
            const queryParams = new URLSearchParams({
                pageNumber: pageNumber.toString(),
                pageSize: pageSize.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== "")
                )
            });

            const response = await fetch(
                `${API_BASE_URL}${endpoint}?${queryParams.toString()}`,
                {
                    method: "GET",
                    headers: this.getHeaders(),
                }
            );

            const result: any = await response.json();

            if (result.status || result.success) {
                let dataArray: any[] = [];
                let pageInfo: any = {};

                if (result.data) {
                    if (result.data.data && Array.isArray(result.data.data)) {
                        dataArray = result.data.data;
                        pageInfo = result.data;
                    } else if (Array.isArray(result.data)) {
                        dataArray = result.data;
                    } else if (result.data && typeof result.data === 'object') {
                        pageInfo = result.data;
                        if (Array.isArray(result.data.data)) {
                            dataArray = result.data.data;
                        }
                    }
                }

                return {
                    success: true,
                    message: result.message || "Report fetched successfully",
                    data: dataArray,
                    current_page: pageInfo.page || result.current_page || 1,
                    total_pages: pageInfo.total_pages || result.total_pages || 1,
                    total_count: pageInfo.total_count || result.total_count || dataArray.length,
                };
            } else {
                return {
                    success: false,
                    message: result.message || "Failed to fetch report",
                    data: [],
                    current_page: 1,
                    total_pages: 1,
                    total_count: 0,
                };
            }
        } catch (error) {
            console.error(`Report fetch error (${endpoint}):`, error);
            return {
                success: false,
                message: "Network error occurred",
                data: [],
                current_page: 1,
                total_pages: 1,
                total_count: 0,
            };
        }
    }

    async getReportData(endpoint: string, pageNumber: number = 1, pageSize: number = 20, filters: Record<string, any> = {}) {
        if (!endpoint) {
            return {
                success: false,
                message: "No endpoint provided",
                data: [],
                current_page: 1,
                total_pages: 1,
                total_count: 0,
            };
        }
        return this.fetchReport(endpoint, pageNumber, pageSize, filters);
    }

    async getProductFootprintList(pageNumber: number = 1, pageSize: number = 20) {
        return this.getReportData("/api/report/product-foot-print-list", pageNumber, pageSize);
    }

    async getSupplierFootprintList(pageNumber: number = 1, pageSize: number = 20) {
        return this.getReportData("/api/report/supplier-foot-print-list", pageNumber, pageSize);
    }

    async getPackagingFootprintList(pageNumber: number = 1, pageSize: number = 20) {
        return this.getReportData("/api/report/packaging-foot-print-list", pageNumber, pageSize);
    }

    async fetchFavoriteReports(userId: string) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/report/fetch-favorite-report?user_id=${userId}`,
                {
                    method: "GET",
                    headers: this.getHeaders(),
                }
            );

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Fetch favorites error:", error);
            return { status: false, message: "Network error", data: {} };
        }
    }

    async upsertFavoriteReport(payload: {
        user_id: string;
        is_product_footprint?: boolean;
        is_supplier_footprint?: boolean;
        is_material_footprint?: boolean;
        is_electricity_footprint?: boolean;
        is_transportation_footprint?: boolean;
        is_packaging_footprint?: boolean;
        is_dqr_rating_footprint?: boolean;
    }) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/report/upsert-favorite-report`,
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Upsert favorite error:", error);
            return { status: false, message: "Network error" };
        }
    }
}

export const reportService = new ReportService();
export default reportService;
