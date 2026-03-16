import React, { useState, useEffect, useCallback } from "react";
import {
  Input,
  Select,
  Button,
  Checkbox,
  Space,
  message,
  Spin,
  Modal,
} from "antd";
import {
  ArrowLeft,
  Bell,
  Info,
  Zap,
  Globe,
  Users,
  Mail,
  FileText,
  Plus,
  X,
  Eye,
  Settings,
  Calendar,
  Filter,
  Table as TableIcon,
  Paperclip,
  Save,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import alertManagementService from "../../lib/alertManagementService";
import { getApiBaseUrl } from "../../lib/apiBaseUrl";
import type {
  AlertCondition,
  AlertPayload,
} from "../../lib/alertManagementService";

const { Option } = Select;
const { TextArea } = Input;

interface Condition {
  id: string;
  column: string;
  condition: string;
  value: string;
  logicalOperator: string;
}

interface Role {
  role_id: string;
  role_name: string;
}

interface User {
  user_id: string;
  user_name: string;
  user_email: string;
}

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const FREQUENCY_OPTIONS = [
  { value: "Immediate", label: "Immediate" },
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Normal", label: "Normal" },
];

const CONDITION_TYPE_OPTIONS = [
  { value: "Simple Condition", label: "Simple Condition" },
  { value: "SQL Query", label: "SQL Query" },
];

const CONDITION_OPERATORS = [
  { value: "Equals", label: "Equals" },
  { value: "Not Equals", label: "Not Equals" },
  { value: "Greater Than", label: "Greater Than" },
  { value: "Less Than", label: "Less Than" },
  { value: "Contains", label: "Contains" },
];

const LOGICAL_OPERATORS = [
  { value: "AND", label: "AND" },
  { value: "OR", label: "OR" },
];

const AlertManagementCreate: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Basic Information
  const [alertName, setAlertName] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [eventType, setEventType] = useState<string>("");
  const [eventTypes, setEventTypes] = useState<{ value: string; label: string }[]>([]);

  // Trigger Conditions
  const [frequency, setFrequency] = useState<string>("Immediate");
  const [conditionType, setConditionType] = useState<string>("Simple Condition");
  const [transactionType, setTransactionType] = useState<string>("");
  const [transactionTypes, setTransactionTypes] = useState<{ value: string; label: string }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tables, setTables] = useState<{ value: string; label: string }[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: "1", column: "", condition: "", value: "", logicalOperator: "AND" },
  ]);

  // Available Variables
  const [availableColumns, setAvailableColumns] = useState<{ column_name: string; display_name: string }[]>([]);

  // Recipients
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [customRecipients, setCustomRecipients] = useState("");

  // Communication Channels
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);
  const [isSmsEnabled, setIsSmsEnabled] = useState(false);
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(false);

  // Message Configuration (Email)
  const [templateName, setTemplateName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [includeAttachment, setIncludeAttachment] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Load event types
        const eventResult = await alertManagementService.getEventTypes();
        if (eventResult.success && eventResult.data) {
          setEventTypes(
            eventResult.data.map((e: any) => ({
              value: e.value || e.name || e.id,
              label: e.name || e.value || e.id,
            }))
          );
        }

        // Load transaction types
        const transResult = await alertManagementService.getTransactionTypes();
        if (transResult.success && transResult.data) {
          setTransactionTypes(transResult.data);
        }

        // Load roles
        const rolesResponse = await fetch(
          `${getApiBaseUrl()}/api/user/roles`,
          {
            headers: {
              Authorization: localStorage.getItem("token") || "",
            },
          }
        );
        const rolesData = await rolesResponse.json();
        if (rolesData.status && rolesData.data) {
          setRoles(rolesData.data);
        }

        // Load existing alert if edit mode
        if (isEditMode && id) {
          const alertResult = await alertManagementService.getAlertById(id);
          if (alertResult.success && alertResult.data) {
            populateFormData(alertResult.data);
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        message.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditMode]);

  // Load tables when transaction type changes
  useEffect(() => {
    const loadTables = async () => {
      if (!transactionType) {
        setTables([]);
        setSelectedTable("");
        return;
      }

      try {
        const result = await alertManagementService.getTablesByTransactionType(transactionType);
        if (result.success && result.data) {
          setTables(
            result.data.map((t: any) => ({
              value: t.table_name || t,
              label: t.display_name || t.table_name || t,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading tables:", error);
        message.error("Failed to load tables");
      }
    };

    loadTables();
  }, [transactionType]);

  // Load columns when table changes
  useEffect(() => {
    const loadColumns = async () => {
      if (!selectedTable) {
        setAvailableColumns([]);
        return;
      }

      try {
        const result = await alertManagementService.getColumnsByTableNames([selectedTable]);
        if (result.success && result.data) {
          const columns = result.data[selectedTable] || [];
          setAvailableColumns(
            columns.map((c: any) => ({
              column_name: c.column_name || c,
              display_name: c.display_name || c.column_name || c,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading columns:", error);
        message.error("Failed to load columns");
      }
    };

    loadColumns();
  }, [selectedTable]);

  // Load users when roles change
  useEffect(() => {
    const loadUsers = async () => {
      if (selectedRoles.length === 0) {
        setUsers([]);
        return;
      }

      try {
        // Fetch users for each selected role
        const allUsers: User[] = [];
        for (const roleId of selectedRoles) {
          const role = roles.find((r) => r.role_id === roleId);
          if (role) {
            const response = await fetch(
              `${getApiBaseUrl()}/api/users/by-role?user_role=${encodeURIComponent(role.role_name)}`,
              {
                headers: {
                  Authorization: localStorage.getItem("token") || "",
                },
              }
            );
            const data = await response.json();
            if (data.status && data.data) {
              data.data.forEach((u: any) => {
                if (!allUsers.find((existing) => existing.user_id === u.user_id)) {
                  allUsers.push({
                    user_id: u.user_id,
                    user_name: u.user_name,
                    user_email: u.user_email || "",
                  });
                }
              });
            }
          }
        }
        setUsers(allUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        message.error("Failed to load users");
      }
    };

    loadUsers();
  }, [selectedRoles, roles]);

  const populateFormData = (data: any) => {
    setAlertName(data.alert_name || "");
    setPriority(data.priority || "");
    setEventType(data.event_type || "");
    setFrequency(data.frequency || "Immediate");
    setConditionType(data.condition_type || "Simple Condition");
    setTransactionType(data.transaction_type || "");
    setSelectedTable(data.table_names?.[0] || "");
    setIsEmailEnabled(data.is_email || false);
    setIsSmsEnabled(data.is_sms || false);
    setIsWhatsappEnabled(data.is_whatsapp || false);

    // Populate conditions
    if (data.column_condition && data.column_condition.length > 0) {
      setConditions(
        data.column_condition.map((c: any, index: number) => ({
          id: String(index + 1),
          column: c.column || "",
          condition: c.condition || "",
          value: c.value || "",
          logicalOperator: c.logical_operator || "AND",
        }))
      );
    }

    // Populate communication data
    if (data.communication_data && data.communication_data.length > 0) {
      const emailComm = data.communication_data.find((c: any) => c.type === "email");
      if (emailComm) {
        setTemplateName(emailComm.template_name || "");
        setEmailSubject(emailComm.subject || "");
        setEmailContent(emailComm.body || "");
        setIncludeAttachment(emailComm.attachments?.length > 0 || false);
      }
    }

    // Populate recipients
    if (data.recipients_data && data.recipients_data.length > 0) {
      const emailRecipients = data.recipients_data.find((r: any) => r.type === "email");
      if (emailRecipients) {
        setSelectedRoles(emailRecipients.recipient_group || []);
        setSelectedUsers(emailRecipients.recipient_users || []);
        setCustomRecipients(emailRecipients.specific_users?.join(", ") || "");
      }
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: String(Date.now()),
        column: "",
        condition: "",
        value: "",
        logicalOperator: "AND",
      },
    ]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((c) => c.id !== id));
    }
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleClear = () => {
    setAlertName("");
    setPriority("");
    setEventType("");
    setFrequency("Immediate");
    setConditionType("Simple Condition");
    setTransactionType("");
    setSelectedTable("");
    setConditions([{ id: "1", column: "", condition: "", value: "", logicalOperator: "AND" }]);
    setSelectedRoles([]);
    setSelectedUsers([]);
    setCustomRecipients("");
    setIsEmailEnabled(true);
    setIsSmsEnabled(false);
    setIsWhatsappEnabled(false);
    setTemplateName("");
    setEmailSubject("");
    setEmailContent("");
    setIncludeAttachment(false);
  };

  const handleSave = async () => {
    // Validation
    if (!alertName.trim()) {
      message.error("Alert name is required");
      return;
    }
    if (!priority) {
      message.error("Priority is required");
      return;
    }

    setSaving(true);
    try {
      const columnConditions: AlertCondition[] = conditions
        .filter((c) => c.column && c.condition)
        .map((c) => ({
          column: c.column,
          condition: c.condition,
          value: c.value,
          logical_operator: c.logicalOperator,
        }));

      const payload: AlertPayload = {
        notificationData: {
          alert_name: alertName,
          priority: priority as "Low" | "Medium" | "High",
          condition_type: conditionType,
          transaction_type: transactionType || null,
          table_names: selectedTable ? [selectedTable] : null,
          column_condition: columnConditions.length > 0 ? columnConditions : null,
          frequency: frequency as any,
          is_email: isEmailEnabled,
          is_sms: isSmsEnabled,
          is_push_notification: false,
          is_whatsapp: isWhatsappEnabled,
          status: true,
          event_type: eventType || "normal",
        },
        notificationCommunicationData: [
          {
            type: "email",
            template_name: templateName || null,
            subject: emailSubject || null,
            body: emailContent || null,
            attachments: includeAttachment ? [] : null,
            is_email: isEmailEnabled,
            is_sms: false,
            is_push_notification: false,
            is_whatsapp: false,
            review_required: false,
            notification_count: 1,
          },
        ],
        notificationRecipientsData: [
          {
            type: "email",
            specific_users: customRecipients
              ? customRecipients.split(",").map((e) => e.trim()).filter(Boolean)
              : [],
            recipient_group: selectedRoles,
            recipient_users: selectedUsers,
            is_email: isEmailEnabled,
            is_sms: false,
            is_push_notification: false,
            is_whatsapp: false,
          },
        ],
      };

      let result;
      if (isEditMode && id) {
        result = await alertManagementService.updateAlert({ ...payload, id });
      } else {
        result = await alertManagementService.createAlert(payload);
      }

      if (result.success) {
        message.success(
          isEditMode ? "Alert updated successfully" : "Alert created successfully"
        );
        navigate("/settings/alert-management");
      } else {
        message.error(result.message || "Failed to save alert");
      }
    } catch (error) {
      console.error("Error saving alert:", error);
      message.error("An error occurred while saving alert");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/settings/alert-management")}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Alert" : "Create New Alert"}
              </h1>
              <p className="text-gray-500">
                {isEditMode
                  ? "Modify alert configuration"
                  : "Configure a new alert for your system"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <FileText className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Alert Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    size="large"
                    placeholder="Enter alert name"
                    value={alertName}
                    onChange={(e) => setAlertName(e.target.value)}
                    prefix={<FileText size={16} className="text-gray-400" />}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <Settings className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <Select
                    size="large"
                    placeholder="Select priority"
                    className="w-full"
                    value={priority || undefined}
                    onChange={setPriority}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        <Settings className="inline w-4 h-4 mr-2 text-gray-400" />
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <Zap className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Event Type
                  </label>
                  <Select
                    size="large"
                    placeholder="Select event type"
                    className="w-full"
                    value={eventType || undefined}
                    onChange={setEventType}
                    allowClear
                  >
                    {eventTypes.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        <Zap className="inline w-4 h-4 mr-2 text-gray-400" />
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Trigger Conditions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Trigger Conditions
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Frequency
                  </label>
                  <Select
                    size="large"
                    placeholder="Select frequency"
                    className="w-full"
                    value={frequency}
                    onChange={setFrequency}
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        <Calendar className="inline w-4 h-4 mr-2 text-gray-400" />
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <Settings className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Condition Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    size="large"
                    placeholder="Select condition type"
                    className="w-full"
                    value={conditionType}
                    onChange={setConditionType}
                  >
                    {CONDITION_TYPE_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        <Settings className="inline w-4 h-4 mr-2 text-gray-400" />
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <Zap className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Transaction Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    size="large"
                    placeholder="Select Transaction Type"
                    className="w-full"
                    value={transactionType || undefined}
                    onChange={setTransactionType}
                    allowClear
                  >
                    {transactionTypes.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        <Zap className="inline w-4 h-4 mr-2 text-gray-400" />
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <TableIcon className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Table
                  </label>
                  <Select
                    size="large"
                    placeholder={transactionType ? "Select table" : "Select transaction type first"}
                    className="w-full"
                    value={selectedTable || undefined}
                    onChange={setSelectedTable}
                    disabled={!transactionType}
                    allowClear
                  >
                    {tables.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        <TableIcon className="inline w-4 h-4 mr-2 text-gray-400" />
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Conditions */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  {conditions.map((cond, index) => (
                    <div
                      key={cond.id}
                      className="p-4 bg-gray-50 rounded-xl mb-3 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Filter size={14} className="text-gray-400" />
                          Condition {index + 1}
                        </span>
                        {conditions.length > 1 && (
                          <button
                            onClick={() => removeCondition(cond.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs text-gray-500">
                            <TableIcon className="inline w-3 h-3 mr-1" />
                            Column <span className="text-red-500">*</span>
                          </label>
                          <Select
                            size="middle"
                            placeholder={selectedTable ? "Select Column" : "Select table first"}
                            className="w-full"
                            value={cond.column || undefined}
                            onChange={(v) => updateCondition(cond.id, "column", v)}
                            disabled={!selectedTable}
                          >
                            {availableColumns.map((col) => (
                              <Option key={col.column_name} value={col.column_name}>
                                {col.display_name}
                              </Option>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs text-gray-500">
                            <Filter className="inline w-3 h-3 mr-1" />
                            Condition <span className="text-red-500">*</span>
                          </label>
                          <Select
                            size="middle"
                            placeholder="Select Conditions"
                            className="w-full"
                            value={cond.condition || undefined}
                            onChange={(v) => updateCondition(cond.id, "condition", v)}
                          >
                            {CONDITION_OPERATORS.map((op) => (
                              <Option key={op.value} value={op.value}>
                                {op.label}
                              </Option>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs text-gray-500">
                            <TableIcon className="inline w-3 h-3 mr-1" />
                            Value <span className="text-red-500">*</span>
                          </label>
                          <Input
                            size="middle"
                            placeholder="Enter value"
                            value={cond.value}
                            onChange={(e) =>
                              updateCondition(cond.id, "value", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs text-gray-500">
                            <Filter className="inline w-3 h-3 mr-1" />
                            Condition
                          </label>
                          <Select
                            size="middle"
                            placeholder="Select Conditions"
                            className="w-full"
                            value={cond.logicalOperator}
                            onChange={(v) =>
                              updateCondition(cond.id, "logicalOperator", v)
                            }
                          >
                            {LOGICAL_OPERATORS.map((op) => (
                              <Option key={op.value} value={op.value}>
                                {op.label}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={addCondition}
                    className="w-full"
                    size="large"
                  >
                    Add Condition
                  </Button>
                </div>
              </div>
            </div>

            {/* Communication Channels */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Communication Channels
                </h2>
              </div>

              <div className="flex gap-4">
                <div
                  onClick={() => setIsEmailEnabled(!isEmailEnabled)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isEmailEnabled
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Mail
                      size={24}
                      className={isEmailEnabled ? "text-green-600" : "text-gray-400"}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isEmailEnabled ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      Email
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Configuration */}
            {isEmailEnabled && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Message Configuration
                    </h2>
                    <p className="text-sm text-gray-500">Email</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      <FileText className="inline w-4 h-4 mr-1.5 text-gray-400" />
                      Template Name
                    </label>
                    <Input
                      size="large"
                      placeholder="Enter template name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      prefix={<FileText size={16} className="text-gray-400" />}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      <Mail className="inline w-4 h-4 mr-1.5 text-gray-400" />
                      Email Subject
                    </label>
                    <div className="flex gap-2">
                      <Input
                        size="large"
                        placeholder="Enter email subject (max 100 chars)"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value.slice(0, 100))}
                        prefix={<Mail size={16} className="text-gray-400" />}
                        className="flex-1"
                        maxLength={100}
                      />
                      <Button
                        type="primary"
                        icon={<Eye size={16} />}
                        size="large"
                        onClick={() => setPreviewOpen(true)}
                      >
                        Preview
                      </Button>
                    </div>
                    <span className="text-xs text-gray-400">
                      {emailSubject.length}/100 characters
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        <FileText className="inline w-4 h-4 mr-1.5 text-gray-400" />
                        Email Content
                      </label>
                      <Button
                        size="small"
                        type={isHtmlMode ? "primary" : "default"}
                        onClick={() => setIsHtmlMode(!isHtmlMode)}
                      >
                        HTML
                      </Button>
                    </div>
                    <TextArea
                      placeholder="Enter email content"
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Checkbox
                      checked={includeAttachment}
                      onChange={(e) => setIncludeAttachment(e.target.checked)}
                    >
                      <span className="flex items-center gap-2">
                        <Paperclip size={16} className="text-gray-400" />
                        Include Attachment
                      </span>
                    </Checkbox>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Side Panels */}
          <div className="space-y-6">
            {/* Available Variables */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Available Variables
                </h2>
              </div>

              {availableColumns.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableColumns.map((col) => (
                    <div
                      key={col.column_name}
                      className="p-2 bg-gray-50 rounded-lg text-sm font-mono text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        const variable = `{{${col.column_name}}}`;
                        setEmailContent((prev) => prev + variable);
                      }}
                    >
                      {`{{${col.column_name}}}`}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">
                    Select a table to view available variables
                  </p>
                </div>
              )}
            </div>

            {/* Recipients */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Recipients</h2>
              </div>

              <div className="space-y-4">
                {/* Select Roles */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Users className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Select Roles
                  </label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {roles.map((role) => (
                      <div
                        key={role.role_id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
                      >
                        <Checkbox
                          checked={selectedRoles.includes(role.role_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles([...selectedRoles, role.role_id]);
                            } else {
                              setSelectedRoles(
                                selectedRoles.filter((r) => r !== role.role_id)
                              );
                              // Also clear users when role is unchecked
                              setSelectedUsers([]);
                            }
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <Users size={14} className="text-gray-400" />
                            {role.role_name}
                          </span>
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Select Users */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Users className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Select Users
                  </label>
                  {users.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border border-gray-100 rounded-xl p-2">
                      {users.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <Checkbox
                            checked={selectedUsers.includes(user.user_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.user_id]);
                              } else {
                                setSelectedUsers(
                                  selectedUsers.filter((u) => u !== user.user_id)
                                );
                              }
                            }}
                          >
                            {user.user_name}
                          </Checkbox>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-gray-100 rounded-xl">
                      <Users size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">
                        Select roles first to view users
                      </p>
                    </div>
                  )}
                </div>

                {/* Custom Recipients */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Mail className="inline w-4 h-4 mr-1.5 text-gray-400" />
                    Custom Recipients
                  </label>
                  <Input
                    size="large"
                    placeholder="Enter Email (separate multiple with commas)"
                    value={customRecipients}
                    onChange={(e) => setCustomRecipients(e.target.value)}
                    prefix={<Mail size={16} className="text-gray-400" />}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Button
            icon={<X size={16} />}
            size="large"
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            type="primary"
            icon={<Save size={16} />}
            size="large"
            onClick={handleSave}
            loading={saving}
            className="shadow-lg shadow-green-600/20"
          >
            Save (S)
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        title="Email Preview"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Subject
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">{emailSubject || "No subject"}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Content
            </label>
            <div
              className="p-4 bg-gray-50 rounded-lg min-h-[200px] whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: isHtmlMode ? emailContent : emailContent.replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AlertManagementCreate;
