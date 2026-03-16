import authService from "./authService";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

class DashboardService {
    private getHeaders() {
        const token = authService.getToken();
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${token}` } : {}),
        };
    }

    async getClientsDropdown() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/clients-dropdown`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching clients dropdown:", error);
            return { status: false, message: "Network error", data: [] };
        }
    }

    async getProductLifeCycle(userId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/product-life-cycle?user_id=${userId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching product life cycle:", error);
            return { status: false, message: "Network error", data: {} };
        }
    }

    async getSupplierDropdown(userId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/supplier-dropdown?user_id=${userId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching supplier dropdown:", error);
            return { status: false, message: "Network error", data: [] };
        }
    }

    async getComponentDropdown(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/component-dropdown?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching component dropdown:", error);
            return { status: false, message: "Network error", data: [] };
        }
    }

    async getSupplierEmission(clientId: string, supplierId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/supplier-emission?client_id=${clientId}&supplier_id=${supplierId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching supplier emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getSupplierMaterialComparison(clientId: string, componentName: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/supplier-material-comparition-emission?client_id=${clientId}&component_name=${componentName}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching supplier material comparison:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getManufacturingProcessEmission(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/manufacturing-process-emission?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching manufacturing process emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getProcessEnergyEmission(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/process-energy-emission?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching process energy emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getMaterialCompositionEmission(clientId: string, supplierId?: string) {
        try {
            const url = supplierId
                ? `${API_BASE_URL}/api/dashboard/material-composition-emission?client_id=${clientId}&supplier_id=${supplierId}`
                : `${API_BASE_URL}/api/dashboard/material-composition-emission?client_id=${clientId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching material composition emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getMaterialCarbonIntensityEmission(clientId: string, supplierId?: string) {
        try {
            const url = supplierId
                ? `${API_BASE_URL}/api/dashboard/material-carbon-intensity-emission?client_id=${clientId}&supplier_id=${supplierId}`
                : `${API_BASE_URL}/api/dashboard/material-carbon-intensity-emission?client_id=${clientId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching material carbon intensity emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getPercentageShareOfTotalEmission(clientId: string, supplierId?: string) {
        try {
            const url = supplierId
                ? `${API_BASE_URL}/api/dashboard/percentage-share-of-total-emission?client_id=${clientId}&supplier_id=${supplierId}`
                : `${API_BASE_URL}/api/dashboard/percentage-share-of-total-emission?client_id=${clientId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching percentage share of total emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getModeOfTransportationEmission(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/mode-of-transportation-emission?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching mode of transportation emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getDistanceVsCorrelationEmission(clientId: string, supplierId?: string) {
        try {
            const url = supplierId
                ? `${API_BASE_URL}/api/dashboard/distance-vs-correlation-emission?client_id=${clientId}&supplier_id=${supplierId}`
                : `${API_BASE_URL}/api/dashboard/distance-vs-correlation-emission?client_id=${clientId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching distance vs correlation emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getEnergySourceEmission(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/energy-source-emission?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching energy source emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getProcessWiseEnergyConsumption(clientId: string, supplierId?: string) {
        try {
            const url = supplierId
                ? `${API_BASE_URL}/api/dashboard/process-wise-energy-consumption-emission?client_id=${clientId}&supplier_id=${supplierId}`
                : `${API_BASE_URL}/api/dashboard/process-wise-energy-consumption-emission?client_id=${clientId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching process wise energy consumption:", error);
            return { success: false, message: "Network error", data: {} };
        }
    }

    async getRecyclabilityEmission(clientId: string, supplierId?: string) {
        try {
            const url = supplierId
                ? `${API_BASE_URL}/api/dashboard/recyclibility-emission?client_id=${clientId}&supplier_id=${supplierId}`
                : `${API_BASE_URL}/api/dashboard/recyclibility-emission?client_id=${clientId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching recyclability emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getVirginOrRecyclabilityEmission(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/virgin-or-recyclibility-emission?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching virgin or recyclability emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getWasteEmissionDetails(clientId: string, supplierId?: string) {
        try {
            const url = supplierId
                ? `${API_BASE_URL}/api/dashboard/waste-emission?client_id=${clientId}&supplier_id=${supplierId}`
                : `${API_BASE_URL}/api/dashboard/waste-emission?client_id=${clientId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching waste emission details:", error);
            return { success: false, message: "Network error", data: [], totals: {} };
        }
    }

    async getPCFReductionEmission(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/pcf-reduction-emission?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching PCF reduction emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getActualPCFEmission(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/pcf-actual-emission?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching actual PCF emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }

    async getForecastedEmission(clientId: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/forecasted-emission?client_id=${clientId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error fetching forecasted emission:", error);
            return { success: false, message: "Network error", data: [] };
        }
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
