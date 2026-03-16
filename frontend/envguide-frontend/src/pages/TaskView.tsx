import React, { useState, useEffect } from "react";
import {
  Col,
  Descriptions,
  Row,
  Space,
  Spin,
  Tag,
  message,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { CheckSquare, ArrowLeft, Calendar, Clock, Users } from "lucide-react";
import dayjs from "dayjs";
import taskService, { type TaskItem } from "../lib/taskService";

const TaskView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const result = await taskService.getTaskById(id);
        if (result.success && result.data) {
          setTask(result.data);
        } else {
          message.error(result.message || "Failed to load task details");
          navigate("/task-management");
        }
      } catch (error) {
        console.error("Error loading task:", error);
        message.error("An error occurred while loading task details");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, navigate]);

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      "Created": { color: "default", label: "To-Do" },
      "To Do": { color: "default", label: "To-Do" },
      "Under Review": { color: "orange", label: "Under Review" },
      "In Progress": { color: "blue", label: "In Progress" },
      "Completed": { color: "green", label: "Completed" },
    };
    const config = statusConfig[status] || { color: "default", label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const priorityConfig: Record<string, { color: string; label: string }> = {
      Low: { color: "green", label: "Low" },
      Medium: { color: "orange", label: "Medium" },
      High: { color: "red", label: "High" },
    };
    const config = priorityConfig[priority] || { color: "default", label: priority };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  if (!task && !loading) {
    return null;
  }

  return (
    <div className="p-6">
      <Spin spinning={loading}>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/task-management")}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{task?.task_title || "Task Details"}</h1>
                    {task?.status && getStatusTag(task.status)}
                  </div>
                  <p className="text-gray-500">ID: {task?.code || task?.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/task-management")}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">

            <Row gutter={[24, 24]}>
              <Col span={24}>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    </div>
                    Task Information
                  </h3>
                  <Descriptions layout="vertical" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
                    <Descriptions.Item label="Category">
                      <span className="font-medium">{task?.category_name || "N/A"}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      {task?.priority ? getPriorityTag(task.priority) : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Due Date">
                      <Space>
                        <Calendar size={16} className="text-gray-400" />
                        <span>{task?.due_date ? dayjs(task.due_date).format("MMM D, YYYY") : "N/A"}</span>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Estimated Hours">
                      <Space>
                        <Clock size={16} className="text-gray-400" />
                        <span>{task?.estimated_hour ? `${task.estimated_hour} hrs` : "N/A"}</span>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Assignees" span={2}>
                      <Space wrap>
                        {task?.assigned_entities && task.assigned_entities.length > 0 ? (
                          task.assigned_entities.map((entity) => (
                            <Tag key={entity.id} color="blue">
                              {entity.name} ({entity.type})
                            </Tag>
                          ))
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>

                  <div className="mt-4">
                    <span className="text-gray-500 block mb-2">Description</span>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 min-h-[100px]">
                      <span className="whitespace-pre-wrap">
                        {task?.description || "No description provided."}
                      </span>
                    </div>
                  </div>
                </div>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Additional Details
                  </h3>
                  <Descriptions layout="vertical" column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
                    <Descriptions.Item label="Related Product">
                      {task?.related_product
                        ? (typeof task.related_product === 'object'
                            ? (task.related_product as any).product_name || (task.related_product as any).product_code
                            : task.related_product)
                        : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="PCF Request">
                      {task?.pcf_id ? (
                        <button className="text-green-600 hover:text-green-700" onClick={() => navigate(`/pcf-request/${task.pcf_id}`)}>
                          View PCF Request
                        </button>
                      ) : (
                        "N/A"
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="BOM">
                      {task?.bom_id || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tags" span={3}>
                      <Space wrap>
                        {task?.tags && task.tags.length > 0 ? (
                          task.tags.map((tag, index) => (
                            <Tag key={index} color="cyan">{tag}</Tag>
                          ))
                        ) : (
                          "No tags"
                        )}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </Col>

              <Col span={24}>
                <div className="flex justify-between text-gray-400 text-sm px-2">
                  <span>Created by: {task?.created_by_name || task?.created_by} on {task?.created_date ? dayjs(task.created_date).format("MMM D, YYYY HH:mm") : "N/A"}</span>
                  {task?.updated_by && (
                    <span>Last updated by: {task?.updated_by_name || task?.updated_by} on {task?.update_date ? dayjs(task.update_date).format("MMM D, YYYY HH:mm") : "N/A"}</span>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default TaskView;
