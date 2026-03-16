/**
 * Service for Task Management API Integration
 */

import authService from "./authService";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

// Assigned Entity structure
export interface AssignedEntity {
  id: string;
  name: string;
  type: "user" | "supplier";
  email?: string | null;
  phone_number?: string | null;
}

// Task Item structure (matches API response)
export interface TaskItem {
  id: string;
  code: string;
  task_title: string;
  category_id: string;
  category_name: string | null;
  priority: "High" | "Medium" | "Low";
  assign_to: string[];
  assigned_entities: AssignedEntity[];
  due_date: string;
  description?: string;
  related_product?: string;
  estimated_hour?: number;
  tags?: string[];
  attachments?: string;
  progress: number | null;
  status: "Created" | "To Do" | "In Progress" | "Under Review" | "Completed";
  created_by: string;
  updated_by?: string | null;
  update_date?: string;
  created_date: string;
  bom_id?: string | null;
  created_by_name: string;
  updated_by_name?: string | null;
  pcf_id?: string | null;
}

// Task List Response
export interface TaskListResponse {
  status: boolean;
  success?: boolean;
  message: string;
  code: number;
  data: {
    data: TaskItem[];
    current_page: number;
    total_pages: number;
    total_count: number;
    stats?: any;
  };
  stats?: any;
}

class TaskService {
  private getHeaders() {
    const token = authService.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `${token}` } : {}),
    };
  }

  /**
   * Get list of tasks
   */
  async getTaskList(
    pageNumber: number = 1,
    pageSize: number = 10,
    filters?: {
      priority?: string;
      category?: string;
      status?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: TaskItem[];
    current_page?: number;
    total_pages?: number;
    total_count?: number;
    stats?: {
      to_do_count?: string;
      inprogress_count?: string;
      completed_count?: string;
    };
  }> {
    try {
      let url = `${API_BASE_URL}/api/task-management/list?pageNumber=${pageNumber}&pageSize=${pageSize}`;
      
      if (filters) {
        const params = new URLSearchParams();
        if (filters.priority && filters.priority !== "all") {
          // Send priority as-is (already in correct format: Low, Medium, High)
          params.append("priority", filters.priority);
        }
        if (filters.category && filters.category !== "all") {
          params.append("category", filters.category);
        }
        const queryString = params.toString();
        if (queryString) {
          url += `&${queryString}`;
        }
      }

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const result: TaskListResponse = await response.json();

      if (result.status || result.success) {
        // API returns nested data structure: result.data.data
        const dataArray = Array.isArray(result.data?.data) ? result.data.data : [];
        // Pagination might be at result.data level or result level
        const pagination = (result.data as any)?.pagination || {};
        
        // Transform API response to match TaskItem interface
        const transformedData: TaskItem[] = dataArray.map((item: any) => ({
          id: item.id,
          code: item.code,
          task_title: item.task_title,
          category_id: item.category_id,
          category_name: item.category?.name || null,
          priority: item.priority,
          assign_to: item.assign_to || [],
          assigned_entities: item.assigned_suppliers?.map((supplier: any) => ({
            id: supplier.sup_id,
            name: supplier.supplier_name || supplier.supplier_email || "Unknown",
            type: "supplier" as const,
            email: supplier.supplier_email,
            phone_number: supplier.supplier_phone_number,
          })) || [],
          due_date: item.due_date,
          description: item.description,
          related_product: item.product?.product_name || item.product?.id || item.product,
          estimated_hour: item.estimated_hour,
          tags: item.tags,
          attachments: item.attachments,
          progress: item.progress,
          status: item.status,
          created_by: item.created_by,
          updated_by: item.updated_by,
          update_date: item.update_date,
          created_date: item.created_date,
          bom_id: item.bom_pcf_id,
          created_by_name: item.created_by_user?.user_name || item.created_by,
          updated_by_name: item.updated_by_user?.user_name || item.updated_by,
          pcf_id: item.bom_pcf_request?.id || item.bom_pcf_id,
        }));
        
        return {
          success: true,
          message: result.message || "Task list fetched successfully",
          data: transformedData,
          current_page: pagination.page || result.data?.current_page || 1,
          total_pages: pagination.totalPages || result.data?.total_pages || 1,
          total_count: pagination.total || result.data?.total_count || dataArray.length,
          stats: (result.data as any)?.stats || result.stats,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch task list",
        };
      }
    } catch (error) {
      console.error("Get task list error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: {
    task_title: string;
    category_id: string;
    priority: "High" | "Medium" | "Low";
    assign_to: string[];
    due_date: string;
    description: string;
    bom_pcf_id?: string;
    product?: string;
    estimated_hour?: number;
    tags?: string[];
    attachments?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task-management/create`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(taskData),
      });

      const result: any = await response.json();

      if (result.success || result.status) {
        return {
          success: true,
          message: result.message || "Task created successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to create task",
        };
      }
    } catch (error) {
      console.error("Create task error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(
    taskId: string,
    taskData: {
      task_title?: string;
      category_id?: string;
      priority?: "High" | "Medium" | "Low";
      assign_to?: string[];
      due_date?: string;
      description?: string;
      pcf_id?: string;
      bom_id?: string;
      related_product?: string;
      estimated_hour?: number;
      tags?: string[];
      attachments?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task-management/update`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ id: taskId, ...taskData }),
      });

      const result: any = await response.json();

      if (result.success || result.status) {
        return {
          success: true,
          message: result.message || "Task updated successfully",
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to update task",
        };
      }
    } catch (error) {
      console.error("Update task error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<{
    success: boolean;
    message: string;
    data?: TaskItem;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/task-management/get-by-id?id=${taskId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: any = await response.json();

      if (result.success || result.status) {
        // Handle array response (API returns data as array)
        const taskData = Array.isArray(result.data) && result.data.length > 0 
          ? result.data[0] 
          : result.data;
        
        // Transform API response to match TaskItem interface
        const transformedData: TaskItem = {
          id: taskData.id,
          code: taskData.code,
          task_title: taskData.task_title,
          category_id: taskData.category_id,
          category_name: taskData.category?.name || null,
          priority: taskData.priority,
          assign_to: taskData.assign_to || [],
          assigned_entities: taskData.assigned_suppliers?.map((supplier: any) => ({
            id: supplier.sup_id,
            name: supplier.supplier_name || supplier.supplier_email || "Unknown",
            type: "supplier" as const,
            email: supplier.supplier_email,
            phone_number: supplier.supplier_phone_number,
          })) || [],
          due_date: taskData.due_date,
          description: taskData.description,
          related_product: taskData.product?.product_name || taskData.product?.id || taskData.product,
          estimated_hour: taskData.estimated_hour,
          tags: taskData.tags,
          attachments: taskData.attachments,
          progress: taskData.progress,
          status: taskData.status,
          created_by: taskData.created_by,
          updated_by: taskData.updated_by,
          update_date: taskData.update_date,
          created_date: taskData.created_date,
          bom_id: taskData.bom_pcf_id,
          created_by_name: taskData.created_by_user?.user_name || taskData.created_by,
          updated_by_name: taskData.updated_by_user?.user_name || taskData.updated_by,
          pcf_id: taskData.bom_pcf_request?.id || taskData.bom_pcf_id,
        };
        
        return {
          success: true,
          message: result.message || "Task fetched successfully",
          data: transformedData,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch task",
        };
      }
    } catch (error) {
      console.error("Get task by ID error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/task-management/delete`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ task_id: taskId }),
        }
      );

      const result: any = await response.json();

      if (result.success || result.status) {
        return {
          success: true,
          message: result.message || "Task deleted successfully",
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to delete task",
        };
      }
    } catch (error) {
      console.error("Delete task error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get PCF dropdown list
   */
  async getPCFDropdown(): Promise<{
    success: boolean;
    message: string;
    data?: Array<{
      id: string;
      code: string;
      request_title: string | null;
      priority: string | null;
      request_organization: string | null;
    }>;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/task-management/get-pcf-dropdown`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: any = await response.json();

      if (result.success || result.status) {
        return {
          success: true,
          message: result.message || "PCF dropdown fetched successfully",
          data: Array.isArray(result.data) ? result.data : [],
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch PCF dropdown",
        };
      }
    } catch (error) {
      console.error("Get PCF dropdown error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get BOM supplier list dropdown
   */
  async getBOMSupplierDropdown(bomPcfId: string): Promise<{
    success: boolean;
    message: string;
    data?: Array<{
      id: string;
      name: string;
      type: "supplier";
      email?: string | null;
      phone_number?: string | null;
    }>;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/task-management/get-bom-suppier-list-dropdown?bom_pcf_id=${bomPcfId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: any = await response.json();

      if (result.success || result.status) {
        // Transform API response to match expected format
        const transformedData = Array.isArray(result.data) 
          ? result.data.map((item: any) => ({
              id: item.supplier_id || item.sup_id,
              name: item.supplier_name || item.supplier_code || item.supplier_email || "Unknown Supplier",
              type: "supplier" as const,
              email: item.supplier_email || null,
              phone_number: item.supplier_phone_number || null,
            }))
          : [];
        
        return {
          success: true,
          message: result.message || "BOM supplier dropdown fetched successfully",
          data: transformedData,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch BOM supplier dropdown",
        };
      }
    } catch (error) {
      console.error("Get BOM supplier dropdown error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get product dropdown list
   */
  async getProductDropdown(): Promise<{
    success: boolean;
    message: string;
    data?: Array<{
      id: string;
      product_code: string;
      product_name: string;
    }>;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/product/drop-down`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: any = await response.json();

      if (result.success || result.status) {
        return {
          success: true,
          message: result.message || "Product dropdown fetched successfully",
          data: Array.isArray(result.data) ? result.data : [],
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch product dropdown",
        };
      }
    } catch (error) {
      console.error("Get product dropdown error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get category dropdown list
   */
  async getCategoryDropdown(): Promise<{
    success: boolean;
    message: string;
    data?: Array<{
      id: string;
      code: string;
      name: string;
      description?: string;
    }>;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/data-setup/category/list`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: any = await response.json();

      if (result.success || result.status) {
        // Handle different response structures
        const categoryList = Array.isArray(result.data) 
          ? result.data 
          : Array.isArray(result.data?.list) 
            ? result.data.list 
            : [];
        
        return {
          success: true,
          message: result.message || "Category dropdown fetched successfully",
          data: categoryList,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch category dropdown",
        };
      }
    } catch (error) {
      console.error("Get category dropdown error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get users list for assignee dropdown
   */
  async getUsersList(): Promise<{
    success: boolean;
    message: string;
    data?: Array<{
      user_id: string;
      user_name: string;
      user_email: string;
      user_role: string;
    }>;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/getUsers`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const result: any = await response.json();

      if (result.success || result.status) {
        const userList = result.data?.userList || result.data || [];
        return {
          success: true,
          message: result.message || "Users fetched successfully",
          data: Array.isArray(userList) ? userList : [],
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch users",
        };
      }
    } catch (error) {
      console.error("Get users list error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  /**
   * Get tasks by bom_pcf_id
   */
  async getTasksByBomPcfId(bomPcfId: string): Promise<{
    success: boolean;
    message: string;
    data?: TaskItem[];
  }> {
    try {
      // Fetch tasks with a large page size to get all tasks, then filter client-side
      const response = await fetch(
        `${API_BASE_URL}/api/task-management/list?pageNumber=1&pageSize=1000`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result: any = await response.json();

      if (result.success || result.status) {
        const dataArray = Array.isArray(result.data?.data) ? result.data.data : [];
        
        // Filter tasks by bom_pcf_id
        const filteredTasks = dataArray.filter((item: any) => 
          item.bom_pcf_id === bomPcfId || 
          item.bom_pcf_request?.id === bomPcfId
        );
        
        // Transform API response to match TaskItem interface
        const transformedData: TaskItem[] = filteredTasks.map((item: any) => ({
          id: item.id,
          code: item.code,
          task_title: item.task_title,
          category_id: item.category_id,
          category_name: item.category?.name || null,
          priority: item.priority,
          assign_to: item.assign_to || [],
          assigned_entities: item.assigned_suppliers?.map((supplier: any) => ({
            id: supplier.sup_id,
            name: supplier.supplier_name || supplier.supplier_email || "Unknown",
            type: "supplier" as const,
            email: supplier.supplier_email,
            phone_number: supplier.supplier_phone_number,
          })) || [],
          due_date: item.due_date,
          description: item.description,
          related_product: item.product?.product_name || item.product?.id || item.product,
          estimated_hour: item.estimated_hour,
          tags: item.tags,
          attachments: item.attachments,
          progress: item.progress,
          status: item.status,
          created_by: item.created_by,
          updated_by: item.updated_by,
          update_date: item.update_date,
          created_date: item.created_date,
          bom_id: item.bom_pcf_id,
          created_by_name: item.created_by_user?.user_name || item.created_by,
          updated_by_name: item.updated_by_user?.user_name || item.updated_by,
          pcf_id: item.bom_pcf_request?.id || item.bom_pcf_id,
        }));
        
        return {
          success: true,
          message: result.message || "Tasks fetched successfully",
          data: transformedData,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to fetch tasks",
        };
      }
    } catch (error) {
      console.error("Get tasks by bom_pcf_id error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }
}

export const taskService = new TaskService();
export default taskService;

