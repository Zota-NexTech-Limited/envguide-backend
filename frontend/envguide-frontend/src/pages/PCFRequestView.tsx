import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Steps,
  Card,
  Button,
  Tag,
  Avatar,
  List,
  Input,
  Form,
  Modal,
  message,
  Spin,
  Divider,
  Row,
  Col,
  Typography,
  Tabs,
  Switch,
  Collapse,
  Table,
  Descriptions,
} from "antd";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Calendar,
  Layers,
  Box,
  Cpu,
  Hash,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  ChevronLeft,
  Mail,
  Phone,
  XCircle,
  Database,
  Star,
  ExternalLink,
  Calculator,
  Play,
  Loader2,
  Leaf,
  Truck,
  Ship,
  Train,
  Plane,
  PieChart,
  Scale,
  Factory,
  Package,
  Flame,
  Trash2,
  MapPin,
  Route,
  Weight,
  Banknote,
  TrendingUp,
  BarChart3,
  Eye,
} from "lucide-react";
import pcfService from "../lib/pcfService";
import authService from "../lib/authService";
import taskService, { type TaskItem } from "../lib/taskService";
import supplierQuestionnaireService from "../lib/supplierQuestionnaireService";
import { getApiBaseUrl } from "../lib/apiBaseUrl";
import {
  getFuelTypeDropdown,
  getSubFuelTypeDropdown,
  getEnergySourceDropdown,
  getEnergyTypeDropdown,
  getRefrigerantTypeDropdown,
  getProcessSpecificEnergyDropdown,
  getTransportModeDropdown,
  type DropdownItem,
} from "../lib/questionnaireDropdownService";
import { usePermissions } from "../contexts/PermissionContext";
import { CheckSquare, ArrowRight, ClipboardList } from "lucide-react";
import BomTable from "../features/pcf-create/BomTable";

const { Step } = Steps;
const { TextArea } = Input;
const { Title, Text } = Typography;

const PCFRequestView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canUpdate } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [newComment, setNewComment] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [calculatingPCF, setCalculatingPCF] = useState(false);
  const [submittingInternally, setSubmittingInternally] = useState(false);
  const [resultValidationTab, setResultValidationTab] = useState("overview");
  const [expandedTransportRow, setExpandedTransportRow] = useState<
    string | null
  >(null);
  const [dqrList, setDqrList] = useState<any[]>([]);
  // DQR stages now come from pcf_data_dqr_rating_stage in getById response

  // Questionnaire response modal state
  const [questionnaireModalVisible, setQuestionnaireModalVisible] =
    useState(false);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>("");

  // Lookup maps for questionnaire response display
  const [questionnaireLookups, setQuestionnaireLookups] = useState<{
    fuelTypes: Map<string, string>;
    subFuelTypes: Map<string, string>;
    energySources: Map<string, string>;
    energyTypes: Map<string, string>;
    refrigerantTypes: Map<string, string>;
    processSpecificEnergy: Map<string, string>;
    transportModes: Map<string, string>;
  }>({
    fuelTypes: new Map(),
    subFuelTypes: new Map(),
    energySources: new Map(),
    energyTypes: new Map(),
    refrigerantTypes: new Map(),
    processSpecificEnergy: new Map(),
    transportModes: new Map(),
  });

  // Helper function to get name from lookup map or return original value
  const getLookupName = (
    lookupMap: Map<string, string>,
    id: string | undefined | null
  ): string => {
    if (!id) return "N/A";
    return lookupMap.get(id) || id;
  };

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  // Fetch DQR list when in DQR stage to get sgiq_id for each supplier
  useEffect(() => {
    const stages = requestData?.pcf_request_stages;
    const dataCollectionStages = requestData?.pcf_data_collection_stage || [];
    // Check if ANY data collection stage is completed (not ALL)
    // This allows viewing responses for completed suppliers even if others are pending
    const hasAnyCompletedDataCollection =
      stages?.is_data_collected ||
      (dataCollectionStages.length > 0 &&
        dataCollectionStages.some(
          (stage: any) =>
            stage.is_submitted === true && stage.completed_date !== null,
        ));

    if (id && hasAnyCompletedDataCollection) {
      fetchDqrList(id);
    }
  }, [
    id,
    requestData?.pcf_request_stages,
    requestData?.pcf_data_collection_stage,
  ]);

  const fetchDqrList = async (pcfId: string) => {
    try {
      const result = await pcfService.getDQRListByBomPcfId(pcfId);
      if (result.success && result.data) {
        setDqrList(result.data);
      }
    } catch (error) {
      console.error("Error fetching DQR list:", error);
    }
  };

  // Helper to get sgiq_id by supplier id
  const getSgiqIdBySupplier = (sup_id: string): string | null => {
    const dqrItem = dqrList.find((item) => item.sup_id === sup_id);
    return dqrItem?.sgiq_id || null;
  };

  // Fetch questionnaire responses for a supplier
  const fetchQuestionnaireResponses = async (
    sup_id: string,
    supplierName: string,
  ) => {
    const sgiq_id = getSgiqIdBySupplier(sup_id);
    if (!sgiq_id) {
      message.warning("Questionnaire data not found for this supplier");
      return;
    }

    setSelectedSupplierName(supplierName);
    setQuestionnaireModalVisible(true);
    setQuestionnaireLoading(true);

    try {
      const token = authService.getToken();

      // Fetch questionnaire data and all lookup dropdowns in parallel
      const [questionnaireResult, fuelTypes, subFuelTypes, energySources, energyTypes, refrigerantTypes, processSpecificEnergy, transportModes] = await Promise.all([
        fetch(
          `${getApiBaseUrl()}/api/supplier-input-questions-get-by-id?sgiq_id=${sgiq_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: token || "",
            },
          },
        ).then((res) => res.json()),
        getFuelTypeDropdown().catch(() => [] as DropdownItem[]),
        getSubFuelTypeDropdown().catch(() => [] as DropdownItem[]),
        getEnergySourceDropdown().catch(() => [] as DropdownItem[]),
        getEnergyTypeDropdown().catch(() => [] as DropdownItem[]),
        getRefrigerantTypeDropdown().catch(() => [] as DropdownItem[]),
        getProcessSpecificEnergyDropdown().catch(() => [] as DropdownItem[]),
        getTransportModeDropdown().catch(() => [] as DropdownItem[]),
      ]);

      // Build lookup maps from dropdown data
      const buildLookupMap = (items: DropdownItem[]): Map<string, string> => {
        const map = new Map<string, string>();
        items.forEach((item) => {
          if (item.id && item.name) {
            map.set(item.id, item.name);
          }
        });
        return map;
      };

      setQuestionnaireLookups({
        fuelTypes: buildLookupMap(fuelTypes),
        subFuelTypes: buildLookupMap(subFuelTypes),
        energySources: buildLookupMap(energySources),
        energyTypes: buildLookupMap(energyTypes),
        refrigerantTypes: buildLookupMap(refrigerantTypes),
        processSpecificEnergy: buildLookupMap(processSpecificEnergy),
        transportModes: buildLookupMap(transportModes),
      });

      if (questionnaireResult.status && questionnaireResult.data) {
        setQuestionnaireData(questionnaireResult.data);
      } else {
        message.error(
          questionnaireResult.message || "Failed to fetch questionnaire responses",
        );
        setQuestionnaireModalVisible(false);
      }
    } catch (error) {
      console.error("Error fetching questionnaire responses:", error);
      message.error("Failed to fetch questionnaire responses");
      setQuestionnaireModalVisible(false);
    } finally {
      setQuestionnaireLoading(false);
    }
  };

  // Fetch tasks only when in Data Collection stage (step 3)
  useEffect(() => {
    const stages = requestData?.pcf_request_stages;
    const dataCollectionStages = requestData?.pcf_data_collection_stage || [];
    const isDataCollectionDone =
      stages?.is_data_collected ||
      (dataCollectionStages.length > 0 &&
        dataCollectionStages.every(
          (stage: any) =>
            stage.is_submitted === true && stage.completed_date !== null,
        ));

    // Only fetch tasks when BOM is verified but Data Collection is not complete
    const isInDataCollectionStage =
      stages?.is_bom_verified && !isDataCollectionDone;

    if (id && isInDataCollectionStage) {
      fetchTasks(id);
    }
  }, [
    id,
    requestData?.pcf_request_stages,
    requestData?.pcf_data_collection_stage,
  ]);

  const fetchData = async (pcfId: string) => {
    setLoading(true);
    try {
      const [requestResult, commentsResult] = await Promise.all([
        pcfService.getPCFBOMById(pcfId),
        pcfService.listPCFComments(pcfId),
      ]);

      if (requestResult.success && requestResult.data) {
        // Handle array response (API returns array of 1 item)
        const data = Array.isArray(requestResult.data)
          ? requestResult.data[0]
          : requestResult.data;
        console.log("PCF Request Data:", data);
        console.log("BOM List Data:", data.bom_list);
        setRequestData(data);
      } else {
        message.error(
          requestResult.message || "Failed to load request details",
        );
      }

      if (commentsResult.success && commentsResult.data) {
        setComments(commentsResult.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (pcfId: string) => {
    setTasksLoading(true);
    try {
      const result = await taskService.getTasksByBomPcfId(pcfId);
      if (result.success && result.data) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const result = await pcfService.verifyPCFRequest(id);
      if (result.success) {
        message.success("PCF Request approved successfully");
        fetchData(id); // Refresh data
      } else {
        message.error(result.message || "Failed to approve request");
      }
    } catch (error) {
      message.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) {
      message.warning("Please provide a reason for rejection");
      return;
    }
    setSubmitting(true);
    try {
      const result = await pcfService.rejectPCFRequest(id, rejectReason);
      if (result.success) {
        message.success("PCF Request rejected successfully");
        setRejectModalVisible(false);
        setRejectReason("");
        fetchData(id); // Refresh data
      } else {
        message.error(result.message || "Failed to reject request");
      }
    } catch (error) {
      message.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return;
    setCommentLoading(true);
    try {
      const result = await pcfService.addPCFComment(id, newComment);
      if (result.success) {
        message.success("Comment added");
        setNewComment("");
        // Refresh comments
        const commentsResult = await pcfService.listPCFComments(id);
        if (commentsResult.success && commentsResult.data) {
          setComments(commentsResult.data);
        }
      } else {
        message.error(result.message || "Failed to add comment");
      }
    } catch (error) {
      message.error("An error occurred");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCalculatePCF = async () => {
    if (!id) return;
    setCalculatingPCF(true);
    try {
      const result = await pcfService.calculatePCF(id);
      if (result.success) {
        message.success(
          result.message || "PCF calculation initiated successfully",
        );
        fetchData(id); // Refresh data to update stages
      } else {
        message.error(result.message || "Failed to calculate PCF");
      }
    } catch (error) {
      message.error("An error occurred while calculating PCF");
    } finally {
      setCalculatingPCF(false);
    }
  };

  const handleSubmitInternally = async () => {
    if (!id) return;
    setSubmittingInternally(true);
    try {
      const result = await pcfService.submitPCFRequestInternally(id);
      if (result.success) {
        message.success(result.message || "PCF request submitted successfully");
        fetchData(id); // Refresh data to update stages
      } else {
        message.error(result.message || "Failed to submit PCF request");
      }
    } catch (error) {
      message.error("An error occurred while submitting PCF request");
    } finally {
      setSubmittingInternally(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="p-6 text-center">
        <Title level={4}>Request not found</Title>
        <Button onClick={() => navigate("/pcf-requests")}>Go Back</Button>
      </div>
    );
  }

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if all suppliers have completed data collection
  const isDataCollectionComplete = () => {
    const dataCollectionStages = requestData.pcf_data_collection_stage || [];
    if (dataCollectionStages.length === 0) return false;
    return dataCollectionStages.every(
      (stage: any) =>
        stage.is_submitted === true && stage.completed_date !== null,
    );
  };

  // Check if all suppliers have completed DQR using pcf_data_dqr_rating_stage from getById response
  const isDqrComplete = () => {
    const dqrStages = requestData.pcf_data_dqr_rating_stage || [];
    if (dqrStages.length === 0) return false;
    return dqrStages.every(
      (stage: any) =>
        stage.is_submitted === true && stage.completed_date !== null,
    );
  };

  // Determine current IN-PROGRESS step (the step being worked on now)
  const getCurrentStep = () => {
    const stages = requestData.pcf_request_stages || {};
    const status = requestData.status?.toLowerCase() || "";
    const isDraft = requestData.is_draft;

    // Return the step that is currently IN PROGRESS
    if (stages.is_result_submitted) return 8; // All done - return beyond last index so all steps show as completed (green)
    if (stages.is_result_validation_verified) return 7; // Result Submitted in progress
    if (stages.is_pcf_calculated) return 6; // Result Validation in progress
    if (stages.is_dqr_completed || isDqrComplete()) return 5; // PCF Calculation in progress
    if (stages.is_data_collected || isDataCollectionComplete()) return 4; // DQR in progress
    if (stages.is_bom_verified) return 3; // Data Collection in progress

    // For early stages, use status field
    // "open" status means PCF is submitted, now in BOM Verification stage
    if (status.toLowerCase() === "open" || stages.is_pcf_request_submitted)
      return 2; // BOM Verification in progress

    // "draft" status means PCF is created, now in Submission stage
    if (
      status.toLowerCase() === "draft" ||
      isDraft ||
      stages.is_pcf_request_created
    )
      return 1; // PCF Request Submission in progress

    return 0; // PCF Request Creation in progress
  };

  // Get count of completed steps (steps before current)
  const getCompletedStepsCount = () => {
    return getCurrentStep();
  };

  const steps = [
    { title: "PCF Request Created", icon: <CheckCircle size={16} /> },
    { title: "PCF Request Submitted", icon: <Send size={16} /> },
    { title: "BOM Verified", icon: <CheckCircle size={16} /> },
    { title: "Data Collection", icon: <Layers size={16} /> },
    { title: "Data Quality Rating", icon: <User size={16} /> },
    { title: "PCF Calculation", icon: <Cpu size={16} /> },
    { title: "Result Validation", icon: <CheckCircle size={16} /> },
    { title: "Result Submitted", icon: <FileText size={16} /> },
  ];

  return (
    <div className="p-6 mx-auto bg-gray-50 min-h-screen">
      {/* Back Button */}
      <Button
        type="text"
        icon={<ChevronLeft size={16} />}
        onClick={() => navigate(-1)}
        className="mb-4 hover:bg-gray-200"
      >
        Back to List
      </Button>

      {/* Rejection Banner */}
      {requestData?.is_rejected && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Text className="text-lg font-semibold text-red-800">
                  Request Rejected
                </Text>
                <Tag color="red" className="!m-0">
                  Rejected
                </Tag>
              </div>
              <Text className="text-red-700 block">
                <span className="font-medium">Reason: </span>
                {requestData.reject_reason || "No reason provided"}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Header Card */}
      <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Box size={32} className="text-green-600" />
            </div>
            <div>
              <Title level={3} className="m-0 text-gray-800">
                {requestData.request_title || "PCF Request"}
              </Title>
              <Text type="secondary" className="text-gray-500">
                {requestData.code}
              </Text>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-white px-2 py-2 rounded-lg flex items-center gap-2 border border-green-100">
              <span className="bg-green-50 p-2 rounded-md text-green-600 w-10 h-10 flex items-center justify-center">
                <Clock size={16} className="text-green-600" />
              </span>
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  Stages Complete
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {getCompletedStepsCount()}/8
                </div>
              </div>
            </div>
            <div className="bg-white px-2 py-2 rounded-lg flex items-center gap-2 border border-blue-100">
              <span className="bg-blue-50 p-2 rounded-md text-blue-600 w-10 h-10 flex items-center justify-center">
                <Calendar size={16} className="text-blue-600" />
              </span>
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  Due Date
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {new Date(requestData.due_date).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="bg-white px-2 py-2 rounded-lg flex items-center gap-2 border border-orange-100">
              <span className="bg-orange-50 p-2 rounded-md text-orange-600 w-10 h-10 flex items-center justify-center">
                <AlertTriangle size={16} className="text-orange-600" />
              </span>
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  Priority
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {requestData.priority}
                </div>
              </div>
            </div>
            <div className="bg-white px-2 py-2 rounded-lg flex items-center gap-2 border border-purple-100">
              <span className="bg-purple-50 p-2 rounded-md text-purple-600 w-10 h-10 flex items-center justify-center">
                <User size={16} className="text-purple-600" />
              </span>
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  Submitted By
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {requestData.request_organization || "Unknown"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-6" />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={6}>
            <Text
              type="secondary"
              className="block text-xs uppercase font-bold mb-1"
            >
              Reference Number
            </Text>
            <Text className="text-gray-800 font-medium">
              {requestData.code}
            </Text>
          </Col>
          <Col xs={24} md={6}>
            <Text
              type="secondary"
              className="block text-xs uppercase font-bold mb-1"
            >
              Submitted On
            </Text>
            <Text className="text-gray-800 font-medium">
              {formatDate(requestData.created_date)}
            </Text>
          </Col>
          <Col xs={24} md={6}>
            <Text
              type="secondary"
              className="block text-xs uppercase font-bold mb-1"
            >
              Due Date
            </Text>
            <Text className="text-gray-800 font-medium">
              {formatDate(requestData.due_date)}
            </Text>
          </Col>
          <Col xs={24} md={6}>
            <Text
              type="secondary"
              className="block text-xs uppercase font-bold mb-1"
            >
              Current Stage
            </Text>
            <Tag color={getCurrentStep() >= steps.length ? "green" : "blue"} className="font-medium">
              {getCurrentStep() >= steps.length ? "Completed" : steps[getCurrentStep()].title}
            </Tag>
          </Col>
        </Row>

        <Divider className="my-6" />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={6}>
            <Text
              type="secondary"
              className="block text-xs uppercase font-bold mb-1"
            >
              Product Category
            </Text>
            <Text className="text-gray-800 font-medium">
              {requestData.product_category?.name || "N/A"}
            </Text>
          </Col>
          <Col xs={24} md={6}>
            <Text
              type="secondary"
              className="block text-xs uppercase font-bold mb-1"
            >
              Component Category
            </Text>
            <Text className="text-gray-800 font-medium">
              {requestData.component_category?.name || "N/A"}
            </Text>
          </Col>
          <Col xs={24} md={6}>
            <Text
              type="secondary"
              className="block text-xs uppercase font-bold mb-1"
            >
              Component Type
            </Text>
            <Text className="text-gray-800 font-medium">
              {requestData.component_type?.name || "N/A"}
            </Text>
          </Col>
          <Col xs={24} md={6}>
            <Text
              type="secondary"
              className="block text-xs uppercase font-bold mb-1"
            >
              Product Code
            </Text>
            <Text className="text-gray-800 font-medium">
              {requestData.product_code || "N/A"}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Stage Stepper */}
      <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
        <Title level={4} className="mb-6">
          PCF Request Stage
        </Title>
        <div className="overflow-x-auto pb-4">
          <style>{`
            .pcf-steps-container .ant-steps-item-icon {
              margin-top: 0 !important;
              width: 32px !important;
              height: 32px !important;
              line-height: 32px !important;
            }
            .pcf-steps-container .ant-steps-item-tail {
              top: 16px !important;
              height: 2px !important;
              margin-top: 0 !important;
              padding: 0 !important;
              transform: translateY(0) !important;
            }
            .pcf-steps-container .ant-steps-item:not(:last-child) .ant-steps-item-tail {
              right: calc(-50% + 16px) !important;
            }
            .pcf-steps-container .ant-steps-item-content {
              margin-top: 8px !important;
            }
            .pcf-steps-container .ant-steps-item-process .ant-steps-item-icon {
              background: transparent !important;
            }
            .pcf-steps-container .ant-steps-item-finish .ant-steps-item-icon {
              background: transparent !important;
            }
            /* Green line for completed steps and line leading to current step */
            .pcf-steps-container .ant-steps-item-finish .ant-steps-item-tail::after {
              background-color: #22c55e !important;
            }
            /* Gray line for steps after current */
            .pcf-steps-container .ant-steps-item-wait .ant-steps-item-tail::after {
              background-color: #d1d5db !important;
            }
            /* Green line from last completed to current (in-progress) step */
            .pcf-steps-container .ant-steps-item-process .ant-steps-item-tail::after {
              background-color: #d1d5db !important;
            }
          `}</style>
          <div className="pcf-steps-container">
            <Steps
              current={getCurrentStep()}
              labelPlacement="vertical"
              size="small"
            >
              {steps.map((step, index) => {
                const currentStep = getCurrentStep();
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <Step
                    key={index}
                    title={step.title}
                    icon={
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          isCompleted
                            ? "border-green-500 bg-green-50 text-green-600"
                            : isCurrent
                              ? "border-yellow-500 bg-yellow-50 text-yellow-600"
                              : "border-gray-300 bg-white text-gray-400"
                        }`}
                      >
                        {isCompleted ? <CheckCircle size={16} /> : step.icon}
                      </div>
                    }
                  />
                );
              })}
            </Steps>
          </div>
        </div>

        {/* Current Stage Details */}
        <div className={`mt-8 rounded-xl p-6 ${getCurrentStep() >= steps.length ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {getCurrentStep() >= steps.length ? "All Stages Completed" : steps[getCurrentStep()].title}
              </h3>
              <p className="text-gray-600">
                {getCurrentStep() >= steps.length
                  ? "The PCF calculation has been completed and results have been submitted successfully."
                  : `Stage Description: In this stage, we are processing the ${steps[getCurrentStep()].title.toLowerCase()}.`
                }
              </p>
            </div>
            <Tag color={getCurrentStep() >= steps.length ? "success" : "warning"}>
              {getCurrentStep() >= steps.length ? "Completed" : "In Progress"}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Task Management Section - Show only in Data Collection stage (step 3) */}
      {getCurrentStep() === 3 && (
        <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare size={24} className="text-green-600" />
            </div>
            <Title level={4} className="m-0">
              Task Management
            </Title>
          </div>

          <Spin spinning={tasksLoading}>
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    className="border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Title level={5} className="m-0">
                            {task.task_title}
                          </Title>
                          <Tag
                            color={
                              task.priority === "High"
                                ? "red"
                                : task.priority === "Medium"
                                  ? "orange"
                                  : "green"
                            }
                          >
                            {task.priority}
                          </Tag>
                          <Tag
                            color={
                              task.status === "Completed"
                                ? "green"
                                : task.status === "In Progress"
                                  ? "blue"
                                  : task.status === "Under Review"
                                    ? "orange"
                                    : "default"
                            }
                          >
                            {task.status}
                          </Tag>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <Text
                              type="secondary"
                              className="block text-xs mb-1"
                            >
                              Task Code
                            </Text>
                            <Text className="font-medium">{task.code}</Text>
                          </div>
                          <div>
                            <Text
                              type="secondary"
                              className="block text-xs mb-1"
                            >
                              Category
                            </Text>
                            <Text className="font-medium">
                              {task.category_name || "N/A"}
                            </Text>
                          </div>
                          <div>
                            <Text
                              type="secondary"
                              className="block text-xs mb-1"
                            >
                              Due Date
                            </Text>
                            <Text className="font-medium">
                              {task.due_date
                                ? formatDate(task.due_date)
                                : "N/A"}
                            </Text>
                          </div>
                          <div>
                            <Text
                              type="secondary"
                              className="block text-xs mb-1"
                            >
                              Progress
                            </Text>
                            <Text className="font-medium">
                              {task.progress ?? 0}%
                            </Text>
                          </div>
                        </div>
                        {task.description && (
                          <div className="mt-3">
                            <Text
                              type="secondary"
                              className="block text-xs mb-1"
                            >
                              Description
                            </Text>
                            <Text className="text-gray-700">
                              {task.description}
                            </Text>
                          </div>
                        )}
                        {task.assigned_entities &&
                          task.assigned_entities.length > 0 && (
                            <div className="mt-3">
                              <Text
                                type="secondary"
                                className="block text-xs mb-1"
                              >
                                Assigned To
                              </Text>
                              <div className="flex flex-wrap gap-2">
                                {task.assigned_entities.map((entity) => (
                                  <Tag key={entity.id} color="blue">
                                    {entity.name} ({entity.type})
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                      <Button
                        type="link"
                        icon={<ArrowRight size={16} />}
                        onClick={() =>
                          navigate(`/task-management/view/${task.id}`)
                        }
                        className="ml-4"
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <CheckSquare size={48} className="text-gray-400 mx-auto" />
                </div>
                <Text type="secondary" className="block mb-4">
                  No tasks have been created for this PCF request yet.
                </Text>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckSquare size={18} />}
                  onClick={() =>
                    navigate(`/task-management/new?bom_pcf_id=${id}`)
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Task
                </Button>
              </div>
            )}
          </Spin>
        </Card>
      )}

      {/* Data Collection Status Section - Show after BOM is verified */}
      {requestData?.pcf_request_stages?.is_bom_verified && (
        <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database size={24} className="text-blue-600" />
              </div>
              <div>
                <Title level={4} className="m-0">
                  Data Collection Status
                </Title>
                <Text type="secondary" className="text-sm">
                  {(() => {
                    const stages = requestData.pcf_data_collection_stage || [];
                    const submitted = stages.filter(
                      (s: any) => s.is_submitted,
                    ).length;
                    return `${submitted}/${stages.length} suppliers submitted`;
                  })()}
                </Text>
              </div>
            </div>
            {isDataCollectionComplete() ? (
              <Tag color="success" className="text-sm px-3 py-1">
                <CheckCircle size={14} className="inline mr-1" />
                All Completed
              </Tag>
            ) : (
              <Tag color="processing" className="text-sm px-3 py-1">
                <Clock size={14} className="inline mr-1" />
                In Progress
              </Tag>
            )}
          </div>

          <div className="space-y-4">
            {(requestData.pcf_data_collection_stage || []).map(
              (stage: any, index: number) => (
                <div
                  key={stage.id || index}
                  className={`p-4 rounded-xl border ${
                    stage.is_submitted
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-full ${
                            stage.is_submitted
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {stage.is_submitted ? (
                            <CheckCircle size={20} />
                          ) : (
                            <XCircle size={20} />
                          )}
                        </div>
                        <div>
                          <Title level={5} className="m-0">
                            {stage.supplier?.supplier_name ||
                              "Unknown Supplier"}
                          </Title>
                          <Text type="secondary" className="text-xs">
                            {stage.supplier?.code || "N/A"}
                          </Text>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ml-11">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <Text className="text-gray-600">
                            {stage.supplier?.supplier_email || "N/A"}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <Text className="text-gray-600">
                            {stage.supplier?.supplier_phone_number || "N/A"}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <Text className="text-gray-600">
                            {stage.completed_date
                              ? `Completed: ${formatDate(stage.completed_date)}`
                              : "Not yet submitted"}
                          </Text>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      {stage.is_submitted && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<ClipboardList size={14} />}
                          onClick={() =>
                            fetchQuestionnaireResponses(
                              stage.supplier?.sup_id,
                              stage.supplier?.supplier_name || "Supplier",
                            )
                          }
                          className="!bg-green-600 hover:!bg-green-700 !border-green-600"
                        >
                          View Responses
                        </Button>
                      )}
                      <Tag color={stage.is_submitted ? "success" : "default"}>
                        {stage.is_submitted ? "Submitted" : "Pending"}
                      </Tag>
                    </div>
                  </div>
                </div>
              ),
            )}

            {(requestData.pcf_data_collection_stage || []).length === 0 && (
              <div className="text-center py-8">
                <Database size={48} className="text-gray-400 mx-auto mb-4" />
                <Text type="secondary">
                  No data collection requests have been sent yet.
                </Text>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* DQR Status Section - Show when Data Collection is complete (step 4 or beyond) */}
      {getCurrentStep() >= 4 && (
        <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star size={24} className="text-purple-600" />
              </div>
              <div>
                <Title level={4} className="m-0">
                  Data Quality Rating Status
                </Title>
                <Text type="secondary" className="text-sm">
                  {(() => {
                    const dqrStages =
                      requestData.pcf_data_dqr_rating_stage || [];
                    const completed = dqrStages.filter(
                      (s: any) => s.is_submitted && s.completed_date,
                    ).length;
                    return `${completed}/${dqrStages.length} assessments completed`;
                  })()}
                </Text>
              </div>
            </div>
            {isDqrComplete() ? (
              <Tag color="success" className="text-sm px-3 py-1">
                <CheckCircle size={14} className="inline mr-1" />
                All Completed
              </Tag>
            ) : (
              <Tag color="warning" className="text-sm px-3 py-1">
                <Clock size={14} className="inline mr-1" />
                In Progress
              </Tag>
            )}
          </div>

          <div className="space-y-4">
            {(requestData.pcf_data_dqr_rating_stage || []).map(
              (item: any, index: number) => (
                <div
                  key={item.id || index}
                  className={`p-4 rounded-xl border ${
                    item.is_submitted && item.completed_date
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-full ${
                            item.is_submitted && item.completed_date
                              ? "bg-green-100 text-green-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {item.is_submitted && item.completed_date ? (
                            <CheckCircle size={20} />
                          ) : (
                            <Star size={20} />
                          )}
                        </div>
                        <div>
                          <Title level={5} className="m-0">
                            {item.supplier?.supplier_name || "Unknown Supplier"}
                          </Title>
                          <Text type="secondary" className="text-xs">
                            {item.supplier?.code || "N/A"}
                          </Text>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ml-11">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <Text className="text-gray-600">
                            {item.supplier?.supplier_email || "N/A"}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <Text className="text-gray-600">
                            {item.supplier?.supplier_phone_number || "N/A"}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <Text className="text-gray-600">
                            {item.completed_date
                              ? `Completed: ${formatDate(item.completed_date)}`
                              : `Created: ${formatDate(item.created_date)}`}
                          </Text>
                        </div>
                      </div>

                      {item.submittedBy && (
                        <div className="mt-3 ml-11">
                          <div className="flex items-center gap-2 text-sm">
                            <User size={14} className="text-gray-400" />
                            <Text className="text-gray-600">
                              Submitted by:{" "}
                              {item.submittedBy.user_name || "Unknown"} (
                              {item.submittedBy.user_role || "N/A"})
                            </Text>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Tag
                        color={
                          item.is_submitted && item.completed_date
                            ? "success"
                            : "warning"
                        }
                      >
                        {item.is_submitted && item.completed_date
                          ? "Completed"
                          : "Pending"}
                      </Tag>
                      <Button
                        type="link"
                        size="small"
                        icon={<ExternalLink size={14} />}
                        onClick={() => {
                          const sgiq_id = getSgiqIdBySupplier(
                            item.supplier?.sup_id,
                          );
                          if (sgiq_id) {
                            navigate(
                              `/data-quality-rating/view?sgiq_id=${sgiq_id}&bom_pcf_id=${id}`,
                            );
                          } else {
                            message.warning(
                              "DQR data not found for this supplier",
                            );
                          }
                        }}
                        disabled={!getSgiqIdBySupplier(item.supplier?.sup_id)}
                      >
                        {item.is_submitted && item.completed_date
                          ? "View"
                          : "Assess"}
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            )}

            {(requestData.pcf_data_dqr_rating_stage || []).length === 0 && (
              <div className="text-center py-8">
                <Star size={48} className="text-gray-400 mx-auto mb-4" />
                <Text type="secondary">
                  No DQR assessments available. Complete data collection first.
                </Text>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* PCF Calculation Section - Show when in PCF Calculation stage (step 5) */}
      {getCurrentStep() === 5 && (
        <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calculator size={24} className="text-emerald-600" />
              </div>
              <div>
                <Title level={4} className="m-0">
                  PCF Calculation
                </Title>
                <Text type="secondary" className="text-sm">
                  Calculate the Product Carbon Footprint for all BOM items
                </Text>
              </div>
            </div>
            {requestData?.pcf_request_stages?.is_pcf_calculated ? (
              <Tag color="success" className="text-sm px-3 py-1">
                <CheckCircle size={14} className="inline mr-1" />
                Calculated
              </Tag>
            ) : (
              <Tag color="warning" className="text-sm px-3 py-1">
                <Clock size={14} className="inline mr-1" />
                Pending
              </Tag>
            )}
          </div>

          {!requestData?.pcf_request_stages?.is_pcf_calculated ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cpu size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Ready for PCF Calculation
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    All prerequisites have been completed. Data quality ratings
                    are finalized and the system is ready to calculate the
                    Product Carbon Footprint values for each BOM component
                    including material, production, packaging, logistics, and
                    waste emissions.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="primary"
                      size="large"
                      icon={
                        calculatingPCF ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Play size={18} />
                        )
                      }
                      onClick={handleCalculatePCF}
                      loading={calculatingPCF}
                      className="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-lg shadow-emerald-600/20"
                    >
                      {calculatingPCF
                        ? "Calculating..."
                        : "Start PCF Calculation"}
                    </Button>
                    <Text type="secondary" className="text-sm">
                      This may take a few moments
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-1">
                    PCF Calculation Complete
                  </h4>
                  <p className="text-green-700 text-sm">
                    Product Carbon Footprint values have been calculated for all
                    BOM components. The results are now ready for validation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Result Validation Section - Show when PCF is calculated (step 6 or beyond) */}
      {requestData?.pcf_request_stages?.is_pcf_calculated && (
        <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 size={24} className="text-green-600" />
              </div>
              <div>
                <Title level={4} className="m-0">
                  PCF Results & Validation
                </Title>
                <Text type="secondary" className="text-sm">
                  Review calculated carbon footprint data for all components
                </Text>
              </div>
            </div>
            {!requestData?.pcf_request_stages?.is_result_submitted && (
              <Button
                type="primary"
                size="large"
                icon={
                  submittingInternally ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )
                }
                onClick={handleSubmitInternally}
                loading={submittingInternally}
                className="!bg-green-600 hover:!bg-green-700 !border-green-600 shadow-lg shadow-green-600/20"
              >
                {submittingInternally ? "Submitting..." : "Submit PCF Results"}
              </Button>
            )}
            {requestData?.pcf_request_stages?.is_result_submitted && (
              <Tag color="success" className="text-sm px-3 py-1">
                <CheckCircle size={14} className="inline mr-1" />
                Results Submitted
              </Tag>
            )}
          </div>

          <Tabs
            activeKey={resultValidationTab}
            onChange={setResultValidationTab}
            type="line"
            className="result-validation-tabs"
            items={[
              {
                key: "overview",
                label: (
                  <span className="flex items-center gap-2">
                    <Eye size={16} />
                    Overview
                  </span>
                ),
                children: (
                  <div className="pt-4">
                    {/* Overview Tab - BomTable with expandable rows */}
                    <BomTable
                      bomData={(requestData?.bom_list || []).map(
                        (item: any) => ({
                          key: item.id,
                          id: item.id,
                          componentName: item.component_name || "-",
                          materialNumber: item.material_number || "-",
                          quantity: item.quantity?.toString() || "1",
                          totalWeight: (item.weight_gms || 0).toString(),
                          totalPrice: (item.price || 0).toString(),
                          emission: (
                            item.pcf_total_emission_calculation
                              ?.total_pcf_value || 0
                          ).toString(),
                          productionLocation: item.production_location || "-",
                          manufacturer: item.manufacturer || "-",
                          detailedDescription: item.detail_description || "-",
                          category: item.component_category || "-",
                          supplierEmail: item.supplier?.supplier_email || "-",
                          supplierName: item.supplier?.supplier_name || "-",
                          supplierNumber:
                            item.supplier?.supplier_phone_number || "-",
                          questionerStatus: "Completed",
                          // Pass the calculated emission data
                          pcf_total_emission_calculation:
                            item.pcf_total_emission_calculation,
                        }),
                      )}
                      readOnly={true}
                      showCalculatedEmissions={true}
                    />

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
                      {[
                        {
                          label: "Total Materials",
                          value: (requestData?.bom_list || []).reduce(
                            (sum: number, item: any) =>
                              sum +
                              (item.pcf_total_emission_calculation
                                ?.material_value || 0),
                            0,
                          ),
                          color: "blue",
                        },
                        {
                          label: "Total Production",
                          value: (requestData?.bom_list || []).reduce(
                            (sum: number, item: any) =>
                              sum +
                              (item.pcf_total_emission_calculation
                                ?.production_value || 0),
                            0,
                          ),
                          color: "purple",
                        },
                        {
                          label: "Total Packaging",
                          value: (requestData?.bom_list || []).reduce(
                            (sum: number, item: any) =>
                              sum +
                              (item.pcf_total_emission_calculation
                                ?.packaging_value || 0),
                            0,
                          ),
                          color: "orange",
                        },
                        {
                          label: "Total Waste",
                          value: (requestData?.bom_list || []).reduce(
                            (sum: number, item: any) =>
                              sum +
                              (item.pcf_total_emission_calculation
                                ?.waste_value || 0),
                            0,
                          ),
                          color: "red",
                        },
                        {
                          label: "Total Logistics",
                          value: (requestData?.bom_list || []).reduce(
                            (sum: number, item: any) =>
                              sum +
                              (item.pcf_total_emission_calculation
                                ?.logistic_value || 0),
                            0,
                          ),
                          color: "cyan",
                        },
                        {
                          label: "Grand Total",
                          value: (requestData?.bom_list || []).reduce(
                            (sum: number, item: any) =>
                              sum +
                              (item.pcf_total_emission_calculation
                                ?.total_pcf_value || 0),
                            0,
                          ),
                          color: "green",
                        },
                      ].map((card, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border ${card.color === "green" ? "bg-green-50 border-green-200" : card.color === "blue" ? "bg-blue-50 border-blue-100" : card.color === "purple" ? "bg-purple-50 border-purple-100" : card.color === "orange" ? "bg-orange-50 border-orange-100" : card.color === "red" ? "bg-red-50 border-red-100" : "bg-cyan-50 border-cyan-100"}`}
                        >
                          <div
                            className={`text-2xl font-bold ${card.color === "green" ? "text-green-700" : card.color === "blue" ? "text-blue-700" : card.color === "purple" ? "text-purple-700" : card.color === "orange" ? "text-orange-700" : card.color === "red" ? "text-red-700" : "text-cyan-700"}`}
                          >
                            {card.value.toFixed(4)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {card.label}
                          </div>
                          <div className="text-xs text-gray-400">kg CO₂e</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: "emissions",
                label: (
                  <span className="flex items-center gap-2">
                    <Leaf size={16} />
                    Emissions
                  </span>
                ),
                children: (
                  <div className="pt-4">
                    {/* Emissions Breakdown Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-green-600 to-emerald-600">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Component Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Material Number
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Material (kg CO₂e)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Production (kg CO₂e)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Packaging (kg CO₂e)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Waste (kg CO₂e)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Logistics (kg CO₂e)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Total PCF (kg CO₂e)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              % of Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {(() => {
                            const bomList = requestData?.bom_list || [];
                            const grandTotal = bomList.reduce(
                              (sum: number, item: any) =>
                                sum +
                                (item.pcf_total_emission_calculation
                                  ?.total_pcf_value || 0),
                              0,
                            );
                            return bomList.map((item: any, index: number) => {
                              const emissions =
                                item.pcf_total_emission_calculation || {};
                              const percentage =
                                grandTotal > 0
                                  ? ((emissions.total_pcf_value || 0) /
                                      grandTotal) *
                                    100
                                  : 0;
                              return (
                                <tr
                                  key={item.id || index}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {item.component_name || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                    {item.material_number || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    {(emissions.material_value || 0).toFixed(4)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    {(emissions.production_value || 0).toFixed(
                                      4,
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    {(emissions.packaging_value || 0).toFixed(
                                      4,
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    {(emissions.waste_value || 0).toFixed(4)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    {(emissions.logistic_value || 0).toFixed(4)}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-green-700 text-right">
                                    {(emissions.total_pcf_value || 0).toFixed(
                                      4,
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">
                                    {percentage.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Material Breakdown for each component */}
                    <div className="mt-8">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package size={18} className="text-green-600" />
                        Material Composition Breakdown
                      </h4>
                      <div className="space-y-4">
                        {(requestData?.bom_list || []).map(
                          (item: any, idx: number) => (
                            <div
                              key={item.id || idx}
                              className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {item.component_name}
                                  </h5>
                                  <p className="text-xs text-gray-500">
                                    {item.material_number}
                                  </p>
                                </div>
                                <Tag color="green">
                                  {(
                                    item.pcf_total_emission_calculation
                                      ?.material_value || 0
                                  ).toFixed(4)}{" "}
                                  kg CO₂e
                                </Tag>
                              </div>
                              {item.material_emission &&
                              item.material_emission.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {item.material_emission.map(
                                    (mat: any, mIdx: number) => (
                                      <div
                                        key={mat.id || mIdx}
                                        className="bg-white rounded-lg p-3 border border-gray-100"
                                      >
                                        <div className="text-sm font-medium text-gray-900">
                                          {mat.material_type}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {mat.material_composition}%
                                          composition
                                        </div>
                                        <div className="text-sm font-semibold text-green-600 mt-1">
                                          {(mat.material_emission || 0).toFixed(
                                            4,
                                          )}{" "}
                                          kg CO₂e
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          EF: {mat.material_emission_factor} kg
                                          CO₂e/kg
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No material breakdown available
                                </p>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "transport",
                label: (
                  <span className="flex items-center gap-2">
                    <Truck size={16} />
                    Transport
                  </span>
                ),
                children: (
                  <div className="pt-4">
                    {/* Transport Summary Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-green-600 to-emerald-600">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-12"></th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Component Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Material Number
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                              Segments
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Total Distance (km)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Emissions (kg CO₂e)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Emission Factor
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {(requestData?.bom_list || []).map(
                            (item: any, index: number) => {
                              const transportDetails =
                                item.transportation_details || [];
                              const logisticCalc =
                                item.logistic_emission_calculation || {};
                              const isExpanded =
                                expandedTransportRow === item.id;
                              const totalDistance = transportDetails.reduce(
                                (sum: number, t: any) =>
                                  sum + (parseFloat(t.distance) || 0),
                                0,
                              );

                              return (
                                <React.Fragment key={item.id || index}>
                                  <tr
                                    className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? "bg-green-50" : ""}`}
                                    onClick={() =>
                                      setExpandedTransportRow(
                                        isExpanded ? null : item.id,
                                      )
                                    }
                                  >
                                    <td
                                      className="px-4 py-3"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Switch
                                        size="small"
                                        checked={isExpanded}
                                        onChange={(checked) =>
                                          setExpandedTransportRow(
                                            checked ? item.id : null,
                                          )
                                        }
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                      {item.component_name || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                      {item.material_number || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                      {transportDetails.length}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                      {totalDistance.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-green-700 text-right">
                                      {(
                                        logisticCalc.leg_wise_transport_emissions_per_unit_kg_co2e ||
                                        0
                                      ).toFixed(4)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                      {logisticCalc.transport_mode_emission_factor_value_kg_co2e_t_km ||
                                        0}
                                    </td>
                                  </tr>
                                  {isExpanded &&
                                    transportDetails.length > 0 && (
                                      <tr>
                                        <td
                                          colSpan={7}
                                          className="px-4 py-4 bg-gradient-to-b from-green-50 to-white"
                                        >
                                          <div className="ml-8">
                                            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                              <Route
                                                size={16}
                                                className="text-green-600"
                                              />
                                              Transport Journey
                                            </h5>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              {transportDetails.map(
                                                (leg: any, legIdx: number) => (
                                                  <React.Fragment
                                                    key={
                                                      leg.motuft_id || legIdx
                                                    }
                                                  >
                                                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm min-w-[160px]">
                                                      <div className="flex items-center gap-2 mb-2">
                                                        {leg.mode_of_transport
                                                          ?.toLowerCase()
                                                          .includes("ship") ||
                                                        leg.mode_of_transport
                                                          ?.toLowerCase()
                                                          .includes("sea") ? (
                                                          <Ship
                                                            size={20}
                                                            className="text-green-600"
                                                          />
                                                        ) : leg.mode_of_transport
                                                            ?.toLowerCase()
                                                            .includes("rail") ||
                                                          leg.mode_of_transport
                                                            ?.toLowerCase()
                                                            .includes("train") ? (
                                                          <Train
                                                            size={20}
                                                            className="text-green-600"
                                                          />
                                                        ) : leg.mode_of_transport
                                                            ?.toLowerCase()
                                                            .includes("plane") ||
                                                          leg.mode_of_transport
                                                            ?.toLowerCase()
                                                            .includes("air") ||
                                                          leg.mode_of_transport
                                                            ?.toLowerCase()
                                                            .includes("flight") ? (
                                                          <Plane
                                                            size={20}
                                                            className="text-green-600"
                                                          />
                                                        ) : (
                                                          <Truck
                                                            size={20}
                                                            className="text-green-600"
                                                          />
                                                        )}
                                                        <span className="text-sm font-medium text-gray-900">
                                                          {leg.mode_of_transport || "N/A"}
                                                        </span>
                                                      </div>
                                                      <div className="text-xs text-gray-500 mb-1">
                                                        {leg.source_point} →{" "}
                                                        {leg.drop_point}
                                                      </div>
                                                      <div className="text-sm font-medium text-gray-700">
                                                        {leg.distance}
                                                      </div>
                                                      <div className="text-xs text-gray-400">
                                                        {leg.weight_transported}
                                                      </div>
                                                    </div>
                                                    {legIdx <
                                                      transportDetails.length -
                                                        1 && (
                                                      <ArrowRight
                                                        size={20}
                                                        className="text-gray-400 flex-shrink-0"
                                                      />
                                                    )}
                                                  </React.Fragment>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                </React.Fragment>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Transport Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="text-2xl font-bold text-blue-700">
                          {(requestData?.bom_list || []).reduce(
                            (sum: number, item: any) =>
                              sum + (item.transportation_details?.length || 0),
                            0,
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total Segments
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="text-2xl font-bold text-purple-700">
                          {(requestData?.bom_list || [])
                            .reduce((sum: number, item: any) => {
                              const details = item.transportation_details || [];
                              return (
                                sum +
                                details.reduce(
                                  (s: number, t: any) =>
                                    s + (parseFloat(t.distance) || 0),
                                  0,
                                )
                              );
                            }, 0)
                            .toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total Distance (km)
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                        <div className="text-2xl font-bold text-orange-700">
                          {(requestData?.bom_list || [])
                            .reduce(
                              (sum: number, item: any) =>
                                sum +
                                (item.logistic_emission_calculation
                                  ?.mass_transported_kg || 0),
                              0,
                            )
                            .toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Mass Transported (kg)
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-700">
                          {(requestData?.bom_list || [])
                            .reduce(
                              (sum: number, item: any) =>
                                sum +
                                (item.pcf_total_emission_calculation
                                  ?.logistic_value || 0),
                              0,
                            )
                            .toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total Logistics Emission
                        </div>
                        <div className="text-xs text-gray-400">kg CO₂e</div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "allocation",
                label: (
                  <span className="flex items-center gap-2">
                    <PieChart size={16} />
                    Allocation
                  </span>
                ),
                children: (
                  <div className="pt-4">
                    {/* Allocation Methods Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-green-600 to-emerald-600">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Component Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Material Number
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                              Allocation Method
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Economic Ratio (%)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              PCF (kg CO₂e)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Weight (g)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                              Price (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {(requestData?.bom_list || []).map(
                            (item: any, index: number) => {
                              const allocation =
                                item.allocation_methodology || {};
                              const productionCalc =
                                item.production_emission_calculation || {};
                              const allocationMethod =
                                productionCalc.allocation_methodology ||
                                (item.economic_ratio <= 5
                                  ? allocation.check_er_less_than_five
                                  : allocation.econ_allocation_er_greater_than_five) ||
                                "Physical";

                              return (
                                <tr
                                  key={item.id || index}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {item.component_name || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                    {item.material_number || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Tag
                                      color={
                                        allocationMethod?.includes("Economic")
                                          ? "blue"
                                          : "green"
                                      }
                                    >
                                      {allocationMethod}
                                    </Tag>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    {item.economic_ratio || 0}%
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-green-700 text-right">
                                    {(
                                      item.pcf_total_emission_calculation
                                        ?.total_pcf_value || 0
                                    ).toFixed(4)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    {(item.weight_gms || 0).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    ₹{(item.price || 0).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Allocation Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-700">
                          {(() => {
                            const bomList = requestData?.bom_list || [];
                            const totalER = bomList.reduce(
                              (sum: number, item: any) =>
                                sum + (item.economic_ratio || 0),
                              0,
                            );
                            return bomList.length > 0
                              ? (totalER / bomList.length).toFixed(2)
                              : "0";
                          })()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Avg Economic Ratio
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="text-2xl font-bold text-green-700">
                          {
                            (requestData?.bom_list || []).filter(
                              (item: any) => {
                                const method =
                                  item.production_emission_calculation
                                    ?.allocation_methodology || "";
                                return method
                                  .toLowerCase()
                                  .includes("physical");
                              },
                            ).length
                          }
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Physical Allocation
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="text-2xl font-bold text-blue-700">
                          {
                            (requestData?.bom_list || []).filter(
                              (item: any) => {
                                const method =
                                  item.production_emission_calculation
                                    ?.allocation_methodology || "";
                                return method
                                  .toLowerCase()
                                  .includes("economic");
                              },
                            ).length
                          }
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Economic Allocation
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="text-2xl font-bold text-purple-700">
                          {
                            (requestData?.bom_list || []).filter(
                              (item: any) =>
                                item.allocation_methodology?.split_allocation,
                            ).length
                          }
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Split Allocation
                        </div>
                      </div>
                    </div>

                    {/* Production Details for each component */}
                    <div className="mt-8">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Factory size={18} className="text-green-600" />
                        Production & Allocation Details
                      </h4>
                      <div className="space-y-4">
                        {(requestData?.bom_list || []).map(
                          (item: any, idx: number) => {
                            const production =
                              item.production_emission_calculation || {};
                            const allocation =
                              item.allocation_methodology || {};

                            return (
                              <div
                                key={item.id || idx}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      {item.component_name}
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                      {item.material_number}
                                    </p>
                                  </div>
                                  <Tag
                                    color={
                                      production.allocation_methodology?.includes(
                                        "Economic",
                                      )
                                        ? "blue"
                                        : "green"
                                    }
                                  >
                                    {production.allocation_methodology ||
                                      "Physical"}
                                  </Tag>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Component Weight
                                    </p>
                                    <p className="font-medium">
                                      {(
                                        production.component_weight_kg || 0
                                      ).toFixed(4)}{" "}
                                      kg
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Factory Total Weight
                                    </p>
                                    <p className="font-medium">
                                      {(
                                        production.total_weight_produced_at_factory_level_kg ||
                                        0
                                      ).toLocaleString()}{" "}
                                      kg
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Products Produced
                                    </p>
                                    <p className="font-medium">
                                      {production.no_of_products_current_component_produced ||
                                        0}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Total Energy (kWh)
                                    </p>
                                    <p className="font-medium">
                                      {(
                                        production.total_energy_consumed_at_factory_level_kwh ||
                                        0
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <p className="text-gray-400">
                                      Electricity EF
                                    </p>
                                    <p className="font-medium">
                                      {production.emission_factor_of_electricity ||
                                        0}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400">Heat EF</p>
                                    <p className="font-medium">
                                      {production.emission_factor_of_heat || 0}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400">Steam EF</p>
                                    <p className="font-medium">
                                      {production.emission_factor_of_steam || 0}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400">Cooling EF</p>
                                    <p className="font-medium">
                                      {production.emission_factor_of_cooling ||
                                        0}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* Completed Stages List */}
      {/* <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
        <Title level={4} className="mb-6">
          Completed Stages
        </Title>
        <div className="space-y-4">
          {getCurrentStep() > 0 && (
            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-full text-green-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-800">
                    {steps[getCurrentStep() - 1].title}
                  </div>
                  <div className="text-xs text-gray-500">
                    Completed on {formatDate(new Date().toISOString())}
                  </div>
                </div>
              </div>
              <Tag color="success">Approved</Tag>
            </div>
          )}

        </div>
      </Card> */}

      {/* BOM Table - Show when approve buttons are visible (at PCF Request Submitted stage) */}
      {(() => {
        const stages = requestData?.pcf_request_stages || {};
        const showApproveButtons =
          !requestData?.is_rejected && !requestData?.is_approved;
        // Show BOM at "PCF Request Submitted" stage (step 1) when approve buttons are visible
        const isSubmittedStage =
          stages.is_pcf_request_submitted && !stages.is_bom_verified;
        const shouldShowBOM = showApproveButtons && isSubmittedStage;

        // Get BOM data from bom_list field (as per API response structure)
        const bomData = requestData?.bom_list || [];

        console.log("BOM Table Check:", {
          showApproveButtons,
          isSubmittedStage,
          shouldShowBOM,
          bomDataLength: bomData.length,
          stages,
          currentStep: getCurrentStep(),
          bomData: bomData,
        });

        // Transform BOM data to match BomTable expected format
        const transformedBomData = bomData.map((item: any) => {
          // Handle supplier object structure
          const supplier = item.supplier || {};

          // Calculate total weight and price if quantity is available
          const quantity = parseFloat(item.quantity) || 1;
          const weightGms = parseFloat(item.weight_gms) || 0;
          const price = parseFloat(item.price) || 0;
          const totalWeight =
            item.total_weight_gms && item.total_weight_gms !== "NaN"
              ? parseFloat(item.total_weight_gms)
              : weightGms * quantity;
          const totalPrice =
            item.total_price && item.total_price !== "NaN"
              ? parseFloat(item.total_price)
              : price * quantity;

          return {
            key: item.id || Math.random().toString(),
            id: item.id,
            componentName: item.component_name || "-",
            materialNumber: item.material_number || "-",
            quantity: item.quantity?.toString() || "1",
            totalWeight: totalWeight.toString(),
            totalPrice: totalPrice.toString(),
            emission: item.emission?.toString() || "0",
            productionLocation: item.production_location || "-",
            manufacturer: item.manufacturer || "-",
            detailedDescription: item.detail_description || "-",
            category: item.component_category || "-",
            supplierEmail: supplier.supplier_email || "-",
            supplierName: supplier.supplier_name || "-",
            supplierNumber: supplier.supplier_phone_number || "-",
            weight: weightGms.toString(),
            price: price.toString(),
          };
        });

        if (shouldShowBOM) {
          if (transformedBomData.length > 0) {
            return (
              <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Layers size={24} className="text-green-600" />
                  </div>
                  <Title level={4} className="m-0">
                    Bill of Materials
                  </Title>
                </div>
                <BomTable bomData={transformedBomData} readOnly={true} />
              </Card>
            );
          } else {
            // Show empty state if no BOM data
            return (
              <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Layers size={24} className="text-green-600" />
                  </div>
                  <Title level={4} className="m-0">
                    Bill of Materials
                  </Title>
                </div>
                <div className="text-center py-8 text-gray-500">
                  No BOM data available
                </div>
              </Card>
            );
          }
        }
        return null;
      })()}

      {/* Action Buttons */}
      {canUpdate("PCF Request") && (
        <div className="flex justify-end gap-4 mb-8">
          {/* Show Submit button when in Result Validation stage */}
          {requestData?.pcf_request_stages?.is_pcf_calculated &&
          !requestData?.pcf_request_stages?.is_result_submitted ? (
            <Button
              type="primary"
              size="large"
              icon={
                submittingInternally ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )
              }
              onClick={handleSubmitInternally}
              loading={submittingInternally}
              className="!bg-green-600 hover:!bg-green-700 !border-green-600"
            >
              {submittingInternally ? "Submitting..." : "Submit PCF Results"}
            </Button>
          ) : requestData?.pcf_request_stages?.is_result_submitted ? (
            <Tag color="success" className="text-base px-4 py-2">
              <CheckCircle size={16} className="inline mr-2" />
              Results Submitted
            </Tag>
          ) : (
            <>
              <Button
                danger
                size="large"
                icon={<ThumbsDown size={18} />}
                onClick={() => setRejectModalVisible(true)}
                disabled={requestData.is_rejected || requestData.is_approved}
              >
                Reject
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<ThumbsUp size={18} />}
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                loading={submitting}
                disabled={requestData.is_rejected || requestData.is_approved}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      )}

      {/* Comments Section */}
      <Card className="!mb-6 shadow-sm rounded-xl border-gray-200">
        <Title level={4} className="mb-6">
          Comments
        </Title>
        <List
          className="mb-6"
          itemLayout="horizontal"
          dataSource={comments}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`}
                  />
                }
                title={
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-800">
                      {item.user_name || "User"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(item.commented_at)}
                    </span>
                  </div>
                }
                description={item.comment}
              />
            </List.Item>
          )}
        />
        <div className="flex gap-4">
          <Avatar
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${authService.getCurrentUser()?.id}`}
          />
          <div className="flex-1">
            <TextArea
              rows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-3 rounded-xl"
            />
            <div className="flex justify-end">
              <Button
                type="primary"
                icon={<MessageSquare size={16} />}
                onClick={handleAddComment}
                loading={commentLoading}
                className="bg-blue-600"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Reject Request"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={submitting}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <p className="mb-4">
          Please provide a reason for rejecting this request:
        </p>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason..."
        />
      </Modal>

      {/* Questionnaire Responses Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <ClipboardList size={24} className="text-green-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                Questionnaire Responses
              </div>
              <div className="text-sm text-gray-500 font-normal">
                {selectedSupplierName}
              </div>
            </div>
          </div>
        }
        open={questionnaireModalVisible}
        onCancel={() => {
          setQuestionnaireModalVisible(false);
          setQuestionnaireData(null);
        }}
        footer={
          <div className="flex justify-end">
            <Button
              type="primary"
              onClick={() => {
                setQuestionnaireModalVisible(false);
                setQuestionnaireData(null);
              }}
              className="!bg-green-600 hover:!bg-green-700 !border-green-600"
            >
              Close
            </Button>
          </div>
        }
        width={1000}
        style={{ top: 20 }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 180px)",
            overflowY: "auto",
            padding: "16px",
          },
        }}
      >
        {questionnaireLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spin size="large" />
            <Text className="mt-4 text-gray-500">
              Loading questionnaire responses...
            </Text>
          </div>
        ) : questionnaireData ? (
          <Collapse
            defaultActiveKey={["general", "organization"]}
            className="bg-white"
            expandIconPosition="end"
          >
            {/* Supplier General Information */}
            {questionnaireData.supplier_general_info && (
              <Collapse.Panel
                header={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <User size={16} className="text-green-600" />
                    </div>
                    <span className="font-medium">General Information</span>
                  </div>
                }
                key="general"
              >
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="Organization Name">
                    {questionnaireData.supplier_general_info
                      .organization_name || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Designation">
                    {questionnaireData.supplier_general_info.designation ||
                      "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email Address">
                    {questionnaireData.supplier_general_info.email_address ||
                      "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Core Business Activity">
                    {questionnaireData.supplier_general_info
                      .core_business_activitiy || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Number of Employees">
                    {questionnaireData.supplier_general_info.no_of_employees ||
                      "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Annual Revenue">
                    {questionnaireData.supplier_general_info.annual_revenue ||
                      "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Annual Reporting Period">
                    {questionnaireData.supplier_general_info
                      .annual_reporting_period || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Emissions Data Available">
                    <Tag
                      color={
                        questionnaireData.supplier_general_info
                          .availability_of_scope_one_two_three_emissions_data
                          ? "green"
                          : "red"
                      }
                    >
                      {questionnaireData.supplier_general_info
                        .availability_of_scope_one_two_three_emissions_data
                        ? "Yes"
                        : "No"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="GDPR Acknowledgement">
                    <Tag
                      color={
                        questionnaireData.supplier_general_info.dc_acknowledge
                          ? "green"
                          : "red"
                      }
                    >
                      {questionnaireData.supplier_general_info.dc_acknowledge
                        ? "Acknowledged"
                        : "Not Acknowledged"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="RE Technologies Acknowledgement">
                    <Tag
                      color={
                        questionnaireData.supplier_general_info.ere_acknowledge
                          ? "green"
                          : "red"
                      }
                    >
                      {questionnaireData.supplier_general_info.ere_acknowledge
                        ? "Acknowledged"
                        : "Not Acknowledged"}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Collapse.Panel>
            )}

            {/* Emissions Data */}
            {questionnaireData.availability_of_scope_one_two_three_emissions
              ?.length > 0 && (
              <Collapse.Panel
                header={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 size={16} className="text-blue-600" />
                    </div>
                    <span className="font-medium">
                      Scope 1, 2, 3 Emissions Data
                    </span>
                    <Tag color="blue">
                      {
                        questionnaireData
                          .availability_of_scope_one_two_three_emissions.length
                      }{" "}
                      entries
                    </Tag>
                  </div>
                }
                key="emissions"
              >
                <Table
                  dataSource={
                    questionnaireData.availability_of_scope_one_two_three_emissions
                  }
                  columns={[
                    {
                      title: "Country",
                      dataIndex: "country_iso_three",
                      key: "country",
                    },
                    {
                      title: "Scope 1",
                      dataIndex: "scope_one",
                      key: "scope_one",
                      render: (v: number) => `${v} tCO₂e`,
                    },
                    {
                      title: "Scope 2",
                      dataIndex: "scope_two",
                      key: "scope_two",
                      render: (v: number) => `${v} tCO₂e`,
                    },
                    {
                      title: "Scope 3",
                      dataIndex: "scope_three",
                      key: "scope_three",
                      render: (v: number) => `${v} tCO₂e`,
                    },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="aosotte_id"
                />
              </Collapse.Panel>
            )}

            {/* Product Questions */}
            {questionnaireData.supplier_product_questions?.length > 0 && (
              <Collapse.Panel
                header={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package size={16} className="text-purple-600" />
                    </div>
                    <span className="font-medium">Product Details</span>
                  </div>
                }
                key="product"
              >
                {questionnaireData.supplier_product_questions.map(
                  (pq: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="Existing PCF Report">
                          <Tag
                            color={
                              pq.do_you_have_an_existing_pcf_report
                                ? "green"
                                : "red"
                            }
                          >
                            {pq.do_you_have_an_existing_pcf_report
                              ? "Yes"
                              : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="PCF Methodology Used">
                          {pq.pcf_methodology_used?.join(", ") || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label="Environmental Impact Methods"
                          span={2}
                        >
                          {pq.required_environmental_impact_methods?.map(
                            (m: string) => (
                              <Tag key={m} color="blue" className="mb-1">
                                {m}
                              </Tag>
                            ),
                          ) || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Co-Products with Economic Value">
                          <Tag
                            color={
                              pq.any_co_product_have_economic_value
                                ? "green"
                                : "red"
                            }
                          >
                            {pq.any_co_product_have_economic_value
                              ? "Yes"
                              : "No"}
                          </Tag>
                        </Descriptions.Item>
                      </Descriptions>

                      {pq.production_site_details_questions?.length > 0 && (
                        <div className="mt-4">
                          <Text strong className="block mb-2">
                            Production Site Details
                          </Text>
                          <Table
                            dataSource={pq.production_site_details_questions}
                            columns={[
                              {
                                title: "Product Name",
                                dataIndex: "product_name",
                                key: "product_name",
                              },
                              {
                                title: "Material Number",
                                dataIndex: "material_number",
                                key: "material_number",
                              },
                              {
                                title: "Location",
                                dataIndex: "location",
                                key: "location",
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="psd_id"
                          />
                        </div>
                      )}

                      {pq.product_component_manufactured_questions?.length >
                        0 && (
                        <div className="mt-4">
                          <Text strong className="block mb-2">
                            Products Manufactured
                          </Text>
                          <Table
                            dataSource={
                              pq.product_component_manufactured_questions
                            }
                            columns={[
                              {
                                title: "Product",
                                dataIndex: "product_name",
                                key: "product_name",
                              },
                              {
                                title: "Material #",
                                dataIndex: "material_number",
                                key: "material_number",
                              },
                              {
                                title: "Period",
                                dataIndex: "production_period",
                                key: "production_period",
                              },
                              {
                                title: "Weight/Unit",
                                dataIndex: "weight_per_unit",
                                key: "weight_per_unit",
                                render: (v: number, r: any) => `${v} ${r.unit}`,
                              },
                              {
                                title: "Quantity",
                                dataIndex: "quantity",
                                key: "quantity",
                              },
                              {
                                title: "Price",
                                dataIndex: "price",
                                key: "price",
                                render: (v: number) => `$${v}`,
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="pcm_id"
                          />
                        </div>
                      )}
                    </div>
                  ),
                )}
              </Collapse.Panel>
            )}

            {/* Scope 1 - Direct Emissions */}
            {questionnaireData.scope_one_direct_emissions_questions?.length >
              0 && (
              <Collapse.Panel
                header={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Flame size={16} className="text-red-600" />
                    </div>
                    <span className="font-medium">
                      Scope 1 - Direct Emissions
                    </span>
                  </div>
                }
                key="scope1"
              >
                {questionnaireData.scope_one_direct_emissions_questions.map(
                  (s1: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      {s1.stationary_combustion_on_site_energy_use_questions
                        ?.length > 0 && (
                        <div>
                          <Text strong className="block mb-2 text-gray-700">
                            Stationary Combustion (On-site Energy Use)
                          </Text>
                          {s1.stationary_combustion_on_site_energy_use_questions.map(
                            (sc: any, i: number) => (
                              <div
                                key={i}
                                className="bg-gray-50 p-3 rounded-lg mb-2"
                              >
                                <Text strong>{getLookupName(questionnaireLookups.fuelTypes, sc.fuel_type)}</Text>
                                {sc.sub_fuel_types?.length > 0 && (
                                  <Table
                                    dataSource={sc.sub_fuel_types}
                                    columns={[
                                      {
                                        title: "Sub Fuel Type",
                                        dataIndex: "sub_fuel_type",
                                        key: "sub_fuel_type",
                                        render: (v: string) =>
                                          getLookupName(questionnaireLookups.subFuelTypes, v),
                                      },
                                      {
                                        title: "Consumption",
                                        dataIndex: "consumption_quantity",
                                        key: "consumption_quantity",
                                        render: (v: number, r: any) =>
                                          `${v} ${r.unit}`,
                                      },
                                    ]}
                                    pagination={false}
                                    size="small"
                                    rowKey="ssft_id"
                                    className="mt-2"
                                  />
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      {s1.mobile_combustion_company_owned_vehicles_questions
                        ?.length > 0 && (
                        <div>
                          <Text strong className="block mb-2 text-gray-700">
                            Mobile Combustion (Company Owned Vehicles)
                          </Text>
                          <Table
                            dataSource={
                              s1.mobile_combustion_company_owned_vehicles_questions
                            }
                            columns={[
                              {
                                title: "Fuel Type",
                                dataIndex: "fuel_type",
                                key: "fuel_type",
                                render: (v: string) =>
                                  getLookupName(questionnaireLookups.subFuelTypes, v),
                              },
                              {
                                title: "Quantity",
                                dataIndex: "quantity",
                                key: "quantity",
                                render: (v: number, r: any) => `${v} ${r.unit}`,
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="mccov_id"
                          />
                        </div>
                      )}

                      {s1.refrigerant_top_ups_performed &&
                        s1.refrigerants_questions?.length > 0 && (
                          <div>
                            <Text strong className="block mb-2 text-gray-700">
                              Refrigerants
                            </Text>
                            <Table
                              dataSource={s1.refrigerants_questions}
                              columns={[
                                {
                                  title: "Refrigerant Type",
                                  dataIndex: "refrigerant_type",
                                  key: "refrigerant_type",
                                  render: (v: string) =>
                                    getLookupName(questionnaireLookups.refrigerantTypes, v),
                                },
                                {
                                  title: "Quantity",
                                  dataIndex: "quantity",
                                  key: "quantity",
                                  render: (v: number, r: any) =>
                                    `${v} ${r.unit}`,
                                },
                              ]}
                              pagination={false}
                              size="small"
                              rowKey="refr_id"
                            />
                          </div>
                        )}

                      {s1.industrial_process_emissions_present &&
                        s1.process_emissions_sources_questions?.length > 0 && (
                          <div>
                            <Text strong className="block mb-2 text-gray-700">
                              Process Emissions Sources
                            </Text>
                            <Table
                              dataSource={
                                s1.process_emissions_sources_questions
                              }
                              columns={[
                                {
                                  title: "Source",
                                  dataIndex: "source",
                                  key: "source",
                                },
                                {
                                  title: "Gas Type",
                                  dataIndex: "gas_type",
                                  key: "gas_type",
                                },
                                {
                                  title: "Quantity",
                                  dataIndex: "quantity",
                                  key: "quantity",
                                  render: (v: number, r: any) =>
                                    `${v} ${r.unit}`,
                                },
                              ]}
                              pagination={false}
                              size="small"
                              rowKey="pes_id"
                            />
                          </div>
                        )}
                    </div>
                  ),
                )}
              </Collapse.Panel>
            )}

            {/* Scope 2 - Indirect Emissions */}
            {questionnaireData.scope_two_indirect_emissions_questions?.length >
              0 && (
              <Collapse.Panel
                header={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Cpu size={16} className="text-yellow-600" />
                    </div>
                    <span className="font-medium">
                      Scope 2 - Indirect Emissions
                    </span>
                  </div>
                }
                key="scope2"
              >
                {questionnaireData.scope_two_indirect_emissions_questions.map(
                  (s2: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      {s2
                        .scope_two_indirect_emissions_from_purchased_energy_questions
                        ?.length > 0 && (
                        <div>
                          <Text strong className="block mb-2 text-gray-700">
                            Purchased Energy
                          </Text>
                          <Table
                            dataSource={
                              s2.scope_two_indirect_emissions_from_purchased_energy_questions
                            }
                            columns={[
                              {
                                title: "Energy Source",
                                dataIndex: "energy_source",
                                key: "energy_source",
                                render: (v: string) =>
                                  getLookupName(questionnaireLookups.energySources, v),
                              },
                              {
                                title: "Energy Type",
                                dataIndex: "energy_type",
                                key: "energy_type",
                                render: (v: string) =>
                                  getLookupName(questionnaireLookups.energyTypes, v),
                              },
                              {
                                title: "Quantity",
                                dataIndex: "quantity",
                                key: "quantity",
                                render: (v: number, r: any) => `${v} ${r.unit}`,
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="stidefpe_id"
                          />
                        </div>
                      )}

                      {s2.process_specific_energy_usage &&
                        s2.process_specific_energy_usage_questions?.length >
                          0 && (
                          <div>
                            <Text strong className="block mb-2 text-gray-700">
                              Process Specific Energy Usage
                            </Text>
                            <Table
                              dataSource={
                                s2.process_specific_energy_usage_questions
                              }
                              columns={[
                                {
                                  title: "Energy Type",
                                  dataIndex: "process_specific_energy_type",
                                  key: "process_specific_energy_type",
                                  render: (v: string) =>
                                    getLookupName(questionnaireLookups.processSpecificEnergy, v),
                                },
                                {
                                  title: "Quantity Consumed",
                                  dataIndex: "quantity_consumed",
                                  key: "quantity_consumed",
                                  render: (v: number, r: any) =>
                                    `${v} ${r.unit}`,
                                },
                              ]}
                              pagination={false}
                              size="small"
                              rowKey="pseu_id"
                            />
                          </div>
                        )}

                      {s2.do_you_acquired_standardized_re_certificates &&
                        s2.scope_two_indirect_emissions_certificates_questions
                          ?.length > 0 && (
                          <div>
                            <Text strong className="block mb-2 text-gray-700">
                              RE Certificates
                            </Text>
                            <Table
                              dataSource={
                                s2.scope_two_indirect_emissions_certificates_questions
                              }
                              columns={[
                                {
                                  title: "Certificate Name",
                                  dataIndex: "certificate_name",
                                  key: "certificate_name",
                                },
                                {
                                  title: "Mechanism",
                                  dataIndex: "mechanism",
                                  key: "mechanism",
                                },
                                {
                                  title: "Generator Name",
                                  dataIndex: "generator_name",
                                  key: "generator_name",
                                },
                                {
                                  title: "Location",
                                  dataIndex: "generator_location",
                                  key: "generator_location",
                                },
                              ]}
                              pagination={false}
                              size="small"
                              rowKey="stidec_id"
                            />
                          </div>
                        )}

                      <Descriptions
                        bordered
                        size="small"
                        column={2}
                        className="mt-4"
                      >
                        <Descriptions.Item label="Uses Abatement Systems">
                          <Tag
                            color={
                              s2.do_you_use_any_abatement_systems
                                ? "green"
                                : "red"
                            }
                          >
                            {s2.do_you_use_any_abatement_systems ? "Yes" : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Destructive Testing">
                          <Tag
                            color={
                              s2.do_you_perform_destructive_testing
                                ? "green"
                                : "red"
                            }
                          >
                            {s2.do_you_perform_destructive_testing
                              ? "Yes"
                              : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item
                          label="IT Systems for Production Control"
                          span={2}
                        >
                          {s2.it_system_use_for_production_control?.map(
                            (it: string) => (
                              <Tag key={it} color="blue" className="mb-1">
                                {it}
                              </Tag>
                            ),
                          ) || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cloud-based Production System">
                          <Tag
                            color={
                              s2.do_you_use_cloud_based_system_for_production
                                ? "green"
                                : "red"
                            }
                          >
                            {s2.do_you_use_cloud_based_system_for_production
                              ? "Yes"
                              : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Cooling System for Server">
                          <Tag
                            color={
                              s2.do_you_use_any_cooling_sysytem_for_server
                                ? "green"
                                : "red"
                            }
                          >
                            {s2.do_you_use_any_cooling_sysytem_for_server
                              ? "Yes"
                              : "No"}
                          </Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  ),
                )}
              </Collapse.Panel>
            )}

            {/* Scope 3 - Other Indirect Emissions */}
            {questionnaireData.scope_three_other_indirect_emissions_questions
              ?.length > 0 && (
              <Collapse.Panel
                header={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Truck size={16} className="text-orange-600" />
                    </div>
                    <span className="font-medium">
                      Scope 3 - Other Indirect Emissions
                    </span>
                  </div>
                }
                key="scope3"
              >
                {questionnaireData.scope_three_other_indirect_emissions_questions.map(
                  (s3: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="ISO 14001/50001 Certified">
                          <Tag
                            color={
                              s3.iso_14001_or_iso_50001_certified
                                ? "green"
                                : "red"
                            }
                          >
                            {s3.iso_14001_or_iso_50001_certified ? "Yes" : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Reports to CDP/SBTi">
                          <Tag
                            color={
                              s3.do_you_report_to_cdp_sbti_or_other
                                ? "green"
                                : "red"
                            }
                          >
                            {s3.do_you_report_to_cdp_sbti_or_other
                              ? "Yes"
                              : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Uses Recycled Materials">
                          <Tag
                            color={
                              s3.use_of_recycled_secondary_materials
                                ? "green"
                                : "red"
                            }
                          >
                            {s3.use_of_recycled_secondary_materials
                              ? "Yes"
                              : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tracks Transport Emissions">
                          <Tag
                            color={
                              s3.do_you_track_emission_from_transport
                                ? "green"
                                : "red"
                            }
                          >
                            {s3.do_you_track_emission_from_transport
                              ? "Yes"
                              : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="By-Products Generated">
                          <Tag
                            color={
                              s3.any_by_product_generated ? "green" : "red"
                            }
                          >
                            {s3.any_by_product_generated ? "Yes" : "No"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Grade of Metal Used">
                          {s3.grade_of_metal_used || "N/A"}
                        </Descriptions.Item>
                      </Descriptions>

                      {s3.mode_of_transport_used_for_transportation_questions
                        ?.length > 0 && (
                        <div className="mt-4">
                          <Text strong className="block mb-2 text-gray-700">
                            Transport Details
                          </Text>
                          <Table
                            dataSource={
                              s3.mode_of_transport_used_for_transportation_questions
                            }
                            columns={[
                              {
                                title: "Mode",
                                dataIndex: "mode_of_transport",
                                key: "mode_of_transport",
                                render: (v: string) =>
                                  getLookupName(questionnaireLookups.transportModes, v),
                              },
                              {
                                title: "Source",
                                dataIndex: "source_point",
                                key: "source_point",
                              },
                              {
                                title: "Destination",
                                dataIndex: "drop_point",
                                key: "drop_point",
                              },
                              {
                                title: "Distance",
                                dataIndex: "distance",
                                key: "distance",
                              },
                              {
                                title: "Weight",
                                dataIndex: "weight_transported",
                                key: "weight_transported",
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="motuft_id"
                          />
                        </div>
                      )}

                      {s3.recycled_materials_with_percentage_questions?.length >
                        0 && (
                        <div className="mt-4">
                          <Text strong className="block mb-2 text-gray-700">
                            Recycled Materials
                          </Text>
                          <Table
                            dataSource={
                              s3.recycled_materials_with_percentage_questions
                            }
                            columns={[
                              {
                                title: "Material Name",
                                dataIndex: "material_name",
                                key: "material_name",
                              },
                              {
                                title: "Material Number",
                                dataIndex: "material_number",
                                key: "material_number",
                              },
                              {
                                title: "Percentage",
                                dataIndex: "percentage",
                                key: "percentage",
                                render: (v: string) => `${v}%`,
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="rmwp_id"
                          />
                        </div>
                      )}

                      {s3.weight_of_packaging_per_unit_product_questions
                        ?.length > 0 && (
                        <div className="mt-4">
                          <Text strong className="block mb-2 text-gray-700">
                            Packaging Weight per Unit
                          </Text>
                          <Table
                            dataSource={
                              s3.weight_of_packaging_per_unit_product_questions
                            }
                            columns={[
                              {
                                title: "Component",
                                dataIndex: "component_name",
                                key: "component_name",
                              },
                              {
                                title: "Material Number",
                                dataIndex: "material_number",
                                key: "material_number",
                              },
                              {
                                title: "Packaging Weight",
                                dataIndex: "packagin_weight",
                                key: "packagin_weight",
                                render: (v: string, r: any) => `${v} ${r.unit}`,
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="woppup_id"
                          />
                        </div>
                      )}

                      {s3.destination_plant_component_transportation_questions
                        ?.length > 0 && (
                        <div className="mt-4">
                          <Text strong className="block mb-2 text-gray-700">
                            Destination Plants
                          </Text>
                          <Table
                            dataSource={
                              s3.destination_plant_component_transportation_questions
                            }
                            columns={[
                              { title: "City", dataIndex: "city", key: "city" },
                              {
                                title: "State",
                                dataIndex: "state",
                                key: "state",
                              },
                              {
                                title: "Country",
                                dataIndex: "country",
                                key: "country",
                              },
                              {
                                title: "Pincode",
                                dataIndex: "pincode",
                                key: "pincode",
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="dpct_id"
                          />
                        </div>
                      )}
                    </div>
                  ),
                )}
              </Collapse.Panel>
            )}

            {/* Scope 4 - Avoided Emissions */}
            {questionnaireData.scope_four_avoided_emissions_questions?.length >
              0 && (
              <Collapse.Panel
                header={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Leaf size={16} className="text-teal-600" />
                    </div>
                    <span className="font-medium">
                      Scope 4 - Avoided Emissions
                    </span>
                  </div>
                }
                key="scope4"
              >
                {questionnaireData.scope_four_avoided_emissions_questions.map(
                  (s4: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <Text strong className="block mb-2 text-gray-700">
                          Renewable Energy & Carbon Offset Projects
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {s4.renewable_energy_carbon_offset_projects_implemented ||
                            "N/A"}
                        </Text>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <Text strong className="block mb-2 text-gray-700">
                          Products/Services Reducing Customer Emissions
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {s4.products_or_services_that_help_reduce_customer_emissions ||
                            "N/A"}
                        </Text>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <Text strong className="block mb-2 text-gray-700">
                          Circular Economy Practices
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {s4.circular_economy_practices_reuse_take_back_epr_refurbishment ||
                            "N/A"}
                        </Text>
                      </div>
                    </div>
                  ),
                )}
              </Collapse.Panel>
            )}

            {/* BOM Items */}
            {questionnaireData.bom?.length > 0 && (
              <Collapse.Panel
                header={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Layers size={16} className="text-gray-600" />
                    </div>
                    <span className="font-medium">BOM Items</span>
                    <Tag color="default">
                      {questionnaireData.bom.length} items
                    </Tag>
                  </div>
                }
                key="bom"
              >
                <Table
                  dataSource={questionnaireData.bom}
                  columns={[
                    { title: "Code", dataIndex: "code", key: "code" },
                    {
                      title: "Material Number",
                      dataIndex: "material_number",
                      key: "material_number",
                    },
                    {
                      title: "Component Name",
                      dataIndex: "component_name",
                      key: "component_name",
                    },
                    {
                      title: "Production Location",
                      dataIndex: "production_location",
                      key: "production_location",
                    },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="bom_id"
                />
              </Collapse.Panel>
            )}
          </Collapse>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList size={48} className="text-gray-300 mb-4" />
            <Text type="secondary">No questionnaire data available</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PCFRequestView;
