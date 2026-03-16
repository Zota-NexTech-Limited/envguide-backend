import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

export interface AlertCondition {
  column: string;
  condition: string;
  value: string;
  logical_operator?: string;
}

export interface NotificationData {
  id?: string;
  alert_name: string;
  priority: "Low" | "Medium" | "High";
  condition_type: string;
  transaction_type: string | null;
  table_names: string[] | null;
  column_condition: AlertCondition[] | null;
  frequency: "Immediate" | "Daily" | "Weekly" | "Monthly" | "Normal";
  frequency_accurrence?: number | null;
  frequency_time_gap?: number | null;
  frequency_first_alert?: string | null;
  is_email: boolean;
  is_sms: boolean;
  is_push_notification: boolean;
  is_whatsapp: boolean;
  sql_query?: string | null;
  status: boolean;
  event_type: string;
}

export interface CommunicationData {
  type: "email" | "sms" | "whatsapp" | "push_notification";
  sms_config_id?: string | null;
  whatsapp_config_id?: string | null;
  template_name: string | null;
  template_id?: string | null;
  subject: string | null;
  body: string | null;
  attachments: string[] | null;
  is_email: boolean;
  is_sms: boolean;
  is_push_notification: boolean;
  is_whatsapp: boolean;
  review_required: boolean;
  notification_count: number;
}

export interface RecipientData {
  type: "email" | "sms" | "whatsapp" | "push_notification";
  specific_users: string[];
  recipient_group: string[];
  recipient_users: string[];
  is_email: boolean;
  is_sms: boolean;
  is_push_notification: boolean;
  is_whatsapp: boolean;
}

export interface AlertPayload {
  notificationData: NotificationData;
  notificationCommunicationData: CommunicationData[];
  notificationRecipientsData: RecipientData[];
}

export interface AlertListItem {
  id: string;
  alert_name: string;
  priority: string;
  frequency: string;
  event_type: string;
  status: boolean;
  is_email: boolean;
  is_sms: boolean;
  is_whatsapp: boolean;
  is_push_notification: boolean;
  created_at: string;
  updated_at: string;
}

export interface TableInfo {
  table_name: string;
  display_name: string;
}

export interface ColumnInfo {
  column_name: string;
  display_name: string;
  data_type: string;
}

export interface EventType {
  id: string;
  name: string;
  value: string;
}

class AlertManagementService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    };
  }

  // Get all alerts with pagination
  async getAlertList(
    pageNo: number = 1,
    pageSize: number = 10,
    filters?: {
      alert_name?: string;
      priority?: string;
      status?: boolean;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: AlertListItem[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      let url = `${API_BASE_URL}/api/notification/get-all-alerts?page_no=${pageNo}&page_size=${pageSize}`;

      if (filters) {
        if (filters.alert_name) {
          url += `&alert_name=${encodeURIComponent(filters.alert_name)}`;
        }
        if (filters.priority) {
          url += `&priority=${encodeURIComponent(filters.priority)}`;
        }
        if (filters.status !== undefined) {
          url += `&status=${filters.status}`;
        }
      }

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const result = await response.json();

      if (result.status) {
        // Ensure data is always an array
        let alertsData = result.data?.data || result.data;
        if (!Array.isArray(alertsData)) {
          alertsData = [];
        }

        return {
          success: true,
          message: result.message || "Alerts fetched successfully",
          data: alertsData,
          pagination: result.data?.pagination || {
            total: alertsData.length || 0,
            page: pageNo,
            limit: pageSize,
            totalPages: 1,
          },
        };
      }

      return {
        success: false,
        message: result.message || "Failed to fetch alerts",
        data: [],
      };
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return {
        success: false,
        message: "An error occurred while fetching alerts",
      };
    }
  }

  // Get alert by ID
  async getAlertById(ntfId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notification/get-by-id?ntf_id=${ntfId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "Alert fetched successfully",
          data: result.data,
        };
      }

      return {
        success: false,
        message: result.message || "Failed to fetch alert",
      };
    } catch (error) {
      console.error("Error fetching alert:", error);
      return {
        success: false,
        message: "An error occurred while fetching alert",
      };
    }
  }

  // Create new alert
  async createAlert(payload: AlertPayload): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notification/add`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "Alert created successfully",
          data: result.data,
        };
      }

      return {
        success: false,
        message: result.message || "Failed to create alert",
      };
    } catch (error) {
      console.error("Error creating alert:", error);
      return {
        success: false,
        message: "An error occurred while creating alert",
      };
    }
  }

  // Update existing alert
  async updateAlert(payload: AlertPayload & { id: string }): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notification/update`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "Alert updated successfully",
          data: result.data,
        };
      }

      return {
        success: false,
        message: result.message || "Failed to update alert",
      };
    } catch (error) {
      console.error("Error updating alert:", error);
      return {
        success: false,
        message: "An error occurred while updating alert",
      };
    }
  }

  // Delete alert
  async deleteAlert(ntfId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notification/delete`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ ntf_id: ntfId }),
      });

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "Alert deleted successfully",
        };
      }

      return {
        success: false,
        message: result.message || "Failed to delete alert",
      };
    } catch (error) {
      console.error("Error deleting alert:", error);
      return {
        success: false,
        message: "An error occurred while deleting alert",
      };
    }
  }

  // Get all event types
  async getEventTypes(): Promise<{
    success: boolean;
    message: string;
    data?: EventType[];
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notification/get-all-event-names`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "Event types fetched successfully",
          data: result.data || [],
        };
      }

      return {
        success: false,
        message: result.message || "Failed to fetch event types",
      };
    } catch (error) {
      console.error("Error fetching event types:", error);
      return {
        success: false,
        message: "An error occurred while fetching event types",
      };
    }
  }

  // Get tables by transaction type
  async getTablesByTransactionType(transactionType: string): Promise<{
    success: boolean;
    message: string;
    data?: TableInfo[];
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notification/get-table-name-by-transaction-type?transaction_type=${encodeURIComponent(transactionType)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "Tables fetched successfully",
          data: result.data || [],
        };
      }

      return {
        success: false,
        message: result.message || "Failed to fetch tables",
      };
    } catch (error) {
      console.error("Error fetching tables:", error);
      return {
        success: false,
        message: "An error occurred while fetching tables",
      };
    }
  }

  // Get columns by table names
  async getColumnsByTableNames(tableNames: string[]): Promise<{
    success: boolean;
    message: string;
    data?: Record<string, ColumnInfo[]>;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notification/get-column-names-by-table-names?tables=${encodeURIComponent(JSON.stringify(tableNames))}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "Columns fetched successfully",
          data: result.data || {},
        };
      }

      return {
        success: false,
        message: result.message || "Failed to fetch columns",
      };
    } catch (error) {
      console.error("Error fetching columns:", error);
      return {
        success: false,
        message: "An error occurred while fetching columns",
      };
    }
  }

  // Get SMS config dropdown
  async getSmsConfigDropdown(): Promise<{
    success: boolean;
    message: string;
    data?: any[];
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notification/get-sms-config-dropdown`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "SMS config fetched successfully",
          data: result.data || [],
        };
      }

      return {
        success: false,
        message: result.message || "Failed to fetch SMS config",
      };
    } catch (error) {
      console.error("Error fetching SMS config:", error);
      return {
        success: false,
        message: "An error occurred while fetching SMS config",
      };
    }
  }

  // Get WhatsApp config dropdown
  async getWhatsappConfigDropdown(): Promise<{
    success: boolean;
    message: string;
    data?: any[];
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notification/get-whatsapp-config-dropdown`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result = await response.json();

      if (result.status) {
        return {
          success: true,
          message: result.message || "WhatsApp config fetched successfully",
          data: result.data || [],
        };
      }

      return {
        success: false,
        message: result.message || "Failed to fetch WhatsApp config",
      };
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
      return {
        success: false,
        message: "An error occurred while fetching WhatsApp config",
      };
    }
  }

  // Get transaction types (derived from the API pattern)
  async getTransactionTypes(): Promise<{
    success: boolean;
    message: string;
    data?: { value: string; label: string }[];
  }> {
    // These are common transaction types based on the API
    const transactionTypes = [
      { value: "product", label: "Product" },
      { value: "pcf", label: "PCF" },
      { value: "component", label: "Component" },
      { value: "task", label: "Task" },
      { value: "user", label: "User" },
      { value: "supplier", label: "Supplier" },
      { value: "manufacturer", label: "Manufacturer" },
    ];

    return {
      success: true,
      message: "Transaction types fetched",
      data: transactionTypes,
    };
  }
}

const alertManagementService = new AlertManagementService();
export default alertManagementService;
