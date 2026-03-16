import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  Save,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  listSetup,
  addSetup,
  updateSetup,
  deleteSetup,
  bulkAddSetup,
  entityFieldConfigs,
  type SetupItem,
  type SetupEntity,
} from "../../lib/dataSetupService";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Modal, Select, Table, Button, App } from "antd";
import { usePermissions } from "../../contexts/PermissionContext";

const { Option } = Select;
const { useApp } = App;

interface DataSetupItem {
  id: string;
  code: string;
  name: string;
  description: string;
  // Vehicle-detail specific fields
  make?: string;
  model?: string;
  year?: string;
  number?: string;
  [key: string]: any;
}

interface TabConfig {
  key: string;
  label: string;
  entity: SetupEntity;
}

interface DataSetupTabsProps {
  title: string;
  description?: string;
  tabs: TabConfig[];
  defaultTab?: string;
}

const DataSetupTabs: React.FC<DataSetupTabsProps> = ({
  title,
  description,
  tabs,
  defaultTab,
}) => {
  const navigate = useNavigate();
  const { message } = useApp();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<string>(
    urlTab || defaultTab || tabs[0]?.key || ""
  );

  // State for each tab's data
  const [tabData, setTabData] = useState<Record<string, DataSetupItem[]>>({});
  const [newItem, setNewItem] = useState<Record<string, string>>({
    code: "",
    name: "",
    description: "",
    make: "",
    model: "",
    year: "",
    number: "",
  });
  const [editingItem, setEditingItem] = useState<{
    item: DataSetupItem;
    tab: string;
  } | null>(null);
  const [editItem, setEditItem] = useState<Record<string, string>>({
    code: "",
    name: "",
    description: "",
    make: "",
    model: "",
    year: "",
    number: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    item: DataSetupItem;
    tab: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    code: "",
    name: "",
    description: "",
    make: "",
    model: "",
    year: "",
    number: "",
  });
  const [importPreview, setImportPreview] = useState<SetupItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const currentTabConfig = tabs.find((t) => t.key === activeTab);
  const currentEntity = currentTabConfig?.entity;
  const currentData = tabData[activeTab] || [];

  // Check if current entity is vehicle-detail
  const isVehicleDetail = currentEntity === "vehicle-detail";
  const entityConfig = currentEntity ? entityFieldConfigs[currentEntity] : null;

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);

  useEffect(() => {
    const load = async () => {
      if (!currentEntity) return;
      setIsLoading(true);
      const data = await listSetup(currentEntity);
      const normalized: DataSetupItem[] = (data as SetupItem[]).map(
        (i, idx) => ({
          id:
            (i as any).id?.toString?.() ||
            (i as any)._id?.toString?.() ||
            `${idx + 1}`,
          code: i.code,
          name: i.name,
          description: i.description || "",
          // Preserve vehicle-detail fields
          make: i.make || "",
          model: i.model || "",
          year: i.year || "",
          number: i.number || "",
        })
      );
      setTabData((prev) => ({ ...prev, [activeTab]: normalized }));
      setIsLoading(false);
    };
    load();
  }, [activeTab, currentEntity]);

  const handleDelete = async (id: string) => {
    if (!currentEntity) return;
    const result = await deleteSetup(currentEntity, id);
    if (result.success) {
      message.success(result.message || "Item deleted successfully");
      setTabData((prev) => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).filter((item) => item.id !== id),
      }));
    } else {
      message.error({
        content: result.message || "Failed to delete item",
        duration: 5,
      });
    }
  };

  const handleAddNew = async () => {
    // Validate required fields based on entity type
    if (!currentEntity || !newItem.code || !newItem.name) return;

    // For non-vehicle-detail entities, require description
    if (!isVehicleDetail && !newItem.description) return;

    const itemToAdd: SetupItem = {
      code: newItem.code,
      name: newItem.name,
      description: newItem.description,
      ...(isVehicleDetail && {
        make: newItem.make,
        model: newItem.model,
        year: newItem.year,
        number: newItem.number,
      }),
    };

    const result = await addSetup(currentEntity, itemToAdd);
    if (result.success) {
      message.success(result.message || "Item added successfully");
      const data = await listSetup(currentEntity);
      const normalized: DataSetupItem[] = (data as SetupItem[]).map(
        (i, idx) => ({
          id:
            (i as any).id?.toString?.() ||
            (i as any)._id?.toString?.() ||
            `${idx + 1}`,
          code: i.code,
          name: i.name,
          description: i.description || "",
          make: i.make || "",
          model: i.model || "",
          year: i.year || "",
          number: i.number || "",
        })
      );
      setTabData((prev) => ({ ...prev, [activeTab]: normalized }));
      setNewItem({ code: "", name: "", description: "", make: "", model: "", year: "", number: "" });
    } else {
      message.error({
        content: result.message || "Failed to add item",
        duration: 5,
      });
    }
  };

  const handleInputChange = (field: keyof typeof newItem, value: string) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (item: DataSetupItem) => {
    setEditingItem({ item, tab: activeTab });
    setEditItem({
      code: item.code,
      name: item.name,
      description: item.description,
      make: item.make || "",
      model: item.model || "",
      year: item.year || "",
      number: item.number || "",
    });
  };

  const handleSaveEdit = async () => {
    // Validate required fields based on entity type
    if (!currentEntity || !editingItem || !editItem.code || !editItem.name) return;

    // For non-vehicle-detail entities, require description
    if (!isVehicleDetail && !editItem.description) return;

    // Store original data for rollback
    const originalData = tabData[activeTab] || [];
    const currentEditing = editingItem;
    const editedValues = { ...editItem };

    // Optimistic UI update
    setTabData((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).map((item) =>
        item.id === editingItem.item.id
          ? {
              ...item,
              code: editItem.code,
              name: editItem.name,
              description: editItem.description,
              ...(isVehicleDetail && {
                make: editItem.make,
                model: editItem.model,
                year: editItem.year,
                number: editItem.number,
              }),
            }
          : item
      ),
    }));

    handleCancelEdit();

    // Build update payload
    const updatePayload: SetupItem & { id: string } = {
      id: currentEditing.item.id,
      code: editedValues.code,
      name: editedValues.name,
      description: editedValues.description,
      ...(isVehicleDetail && {
        make: editedValues.make,
        model: editedValues.model,
        year: editedValues.year,
        number: editedValues.number,
      }),
    };

    // Process API in background
    const result = await updateSetup(currentEntity, updatePayload);

    if (result.success) {
      message.success(result.message || "Item updated successfully");
    } else {
      // Rollback on failure
      setTabData((prev) => ({ ...prev, [activeTab]: originalData }));
      message.error({
        content: result.message || "Failed to update item",
        duration: 5,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditItem({ code: "", name: "", description: "", make: "", model: "", year: "", number: "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // Handle Enter key in add new row to trigger add
  const handleNewItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Check if all required fields are filled
      const canAdd =
        newItem.code &&
        newItem.name &&
        (isVehicleDetail || newItem.description);
      if (canAdd) {
        handleAddNew();
      }
    }
  };

  const handleDeleteClick = (item: DataSetupItem) => {
    setItemToDelete({ item, tab: activeTab });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await handleDelete(itemToDelete.item.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleEditInputChange = (
    field: keyof typeof editItem,
    value: string
  ) => {
    setEditItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setEditingItem(null);
    setEditItem({ code: "", name: "", description: "", make: "", model: "", year: "", number: "" });
    setNewItem({ code: "", name: "", description: "", make: "", model: "", year: "", number: "" });
    // Update URL to reflect tab change
    const currentPath = window.location.pathname;
    const tabKeys = tabs.map(t => t.key);
    const pathParts = currentPath.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    // Check if the last part of URL is already a tab key (needs replacement)
    // Otherwise append the tab key to current path
    if (tabKeys.includes(lastPart)) {
      // Replace the existing tab
      const basePath = '/' + pathParts.slice(0, -1).join('/');
      navigate(`${basePath}/${tabKey}`, { replace: true });
    } else {
      // Append the tab (no tab in URL yet)
      navigate(`${currentPath}/${tabKey}`, { replace: true });
    }
  };

  const handleExport = () => {
    if (!currentData || currentData.length === 0) {
      alert("No data to export");
      return;
    }

    // Convert data to CSV - use different headers based on entity type
    let headers: string[];
    let rows: string[][];

    if (isVehicleDetail) {
      headers = ["Code", "Name", "Make", "Model", "Year", "Number"];
      rows = currentData.map((item) => [
        item.code,
        item.name,
        item.make || "",
        item.model || "",
        item.year || "",
        item.number || "",
      ]);
    } else {
      headers = ["Code", "Name", "Description"];
      rows = currentData.map((item) => [item.code, item.name, item.description]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${currentTabConfig?.label || "data"}-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ""));
    return values;
  };

  // Auto-detect column mapping based on header names
  const autoDetectMapping = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {
      code: "",
      name: "",
      description: "",
      make: "",
      model: "",
      year: "",
      number: "",
    };
    const fieldsToMatch = [
      { key: "code", patterns: ["code", "id", "identifier", "key"] },
      { key: "name", patterns: ["name", "title", "label"] },
      { key: "description", patterns: ["description", "desc", "details", "info"] },
      { key: "make", patterns: ["make", "manufacturer", "brand"] },
      { key: "model", patterns: ["model"] },
      { key: "year", patterns: ["year"] },
      { key: "number", patterns: ["number", "vehicle number", "reg", "registration"] },
    ];

    headers.forEach((header) => {
      const headerLower = header.toLowerCase().trim();
      fieldsToMatch.forEach((field) => {
        if (!mapping[field.key]) {
          for (const pattern of field.patterns) {
            if (headerLower.includes(pattern) || pattern.includes(headerLower)) {
              mapping[field.key] = header;
              break;
            }
          }
        }
      });
    });

    return mapping;
  };

  // Handle file selection
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        message.error("CSV file must have at least a header row and one data row");
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const dataRows = lines.slice(1).map(parseCSVLine);

      setCsvHeaders(headers);
      setCsvData(dataRows);

      // Auto-detect mapping
      const autoMapping = autoDetectMapping(headers);
      setColumnMapping(autoMapping);

      // Generate preview
      updateImportPreview(autoMapping, headers, dataRows);

      setShowImportModal(true);
    };
    input.click();
  };

  // Update preview when mapping changes
  const updateImportPreview = (
    mapping: Record<string, string>,
    headers: string[],
    data: string[][]
  ) => {
    const getColumnIndex = (fieldKey: string): number => {
      const mappedHeader = mapping[fieldKey];
      if (!mappedHeader) return -1;
      return headers.findIndex((h) => h === mappedHeader);
    };

    const codeIdx = getColumnIndex("code");
    const nameIdx = getColumnIndex("name");
    const descIdx = getColumnIndex("description");
    const makeIdx = getColumnIndex("make");
    const modelIdx = getColumnIndex("model");
    const yearIdx = getColumnIndex("year");
    const numberIdx = getColumnIndex("number");

    const previewItems: SetupItem[] = data
      .filter((row) => {
        const code = codeIdx >= 0 ? row[codeIdx] : "";
        const name = nameIdx >= 0 ? row[nameIdx] : "";
        return code && name; // At least code and name required
      })
      .map((row) => {
        const baseItem: SetupItem = {
          code: codeIdx >= 0 ? row[codeIdx] : "",
          name: nameIdx >= 0 ? row[nameIdx] : "",
          description: descIdx >= 0 ? row[descIdx] : "",
        };

        if (isVehicleDetail) {
          baseItem.make = makeIdx >= 0 ? row[makeIdx] : "";
          baseItem.model = modelIdx >= 0 ? row[modelIdx] : "";
          baseItem.year = yearIdx >= 0 ? row[yearIdx] : "";
          baseItem.number = numberIdx >= 0 ? row[numberIdx] : "";
        }

        return baseItem;
      });

    setImportPreview(previewItems);
  };

  // Handle mapping change
  const handleMappingChange = (field: string, header: string) => {
    const newMapping = { ...columnMapping, [field]: header };
    setColumnMapping(newMapping);
    updateImportPreview(newMapping, csvHeaders, csvData);
  };

  // Execute bulk import
  const handleBulkImport = async () => {
    if (importPreview.length === 0) {
      message.error("No valid items to import. Please check your mapping.");
      return;
    }

    setIsImporting(true);
    try {
      const result = await bulkAddSetup(currentEntity!, importPreview);

      if (result.success) {
        message.success(result.message || `Successfully imported ${result.addedCount || importPreview.length} items`);

        // Reload data
        const data = await listSetup(currentEntity!);
        const normalized: DataSetupItem[] = (data as SetupItem[]).map(
          (i, idx) => ({
            id:
              (i as any).id?.toString?.() ||
              (i as any)._id?.toString?.() ||
              `${idx + 1}`,
            code: i.code,
            name: i.name,
            description: i.description || "",
            make: i.make || "",
            model: i.model || "",
            year: i.year || "",
            number: i.number || "",
          })
        );
        setTabData((prev) => ({ ...prev, [activeTab]: normalized }));

        // Close modal and reset state
        setShowImportModal(false);
        setCsvHeaders([]);
        setCsvData([]);
        setColumnMapping({ code: "", name: "", description: "", make: "", model: "", year: "", number: "" });
        setImportPreview([]);
      } else {
        // Show backend error message in toast
        message.error({
          content: result.message || "Import failed",
          duration: 5,
        });
      }
    } catch (error: any) {
      message.error({
        content: error?.message || "An error occurred during import",
        duration: 5,
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Close import modal
  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setCsvHeaders([]);
    setCsvData([]);
    setColumnMapping({ code: "", name: "", description: "", make: "", model: "", year: "", number: "" });
    setImportPreview([]);
  };

  if (!currentEntity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Configuration
          </h1>
          <p className="text-gray-600 mb-4">
            The requested data setup configuration was not found.
          </p>
          <button
            onClick={() => navigate("/settings")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/settings")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-gray-500">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                title="Export CSV"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={handleImport}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-green-600/20"
              >
                <Upload className="h-4 w-4" />
                <span>Import CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

          {/* Tabs - Only show if more than one tab */}
          {tabs.length > 1 && (
            <div className="px-6 pt-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      activeTab === tab.key
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          <div className="px-6 pt-4">
            <div
              className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center space-x-2 animate-in slide-in-from-top-2 duration-200"
              style={{ display: editingItem ? "flex" : "none" }}
            >
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  Keyboard shortcuts available
                </p>
                <p className="text-xs text-blue-600">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">
                    Ctrl+Enter
                  </kbd>{" "}
                  to save •
                  <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono ml-1">
                    Esc
                  </kbd>{" "}
                  to cancel
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-blue-400 hover:text-blue-600 transition-colors"
                title="Close hint"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="py-16 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-green-50 to-green-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                          Name
                        </th>
                        {isVehicleDetail ? (
                          <>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                              Make
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                              Model
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                              Year
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                              Number
                            </th>
                          </>
                        ) : (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Description
                          </th>
                        )}
                        <th className="px-6 py-4 text-center text-xs font-semibold text-green-800 uppercase tracking-wider w-32">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentData.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`group hover:bg-gray-50 transition-colors duration-150 ${
                            editingItem?.item.id === item.id &&
                            editingItem?.tab === activeTab
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : ""
                          } ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                        >
                          {editingItem?.item.id === item.id &&
                          editingItem?.tab === activeTab ? (
                            <>
                              <td className="px-6 py-4">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={editItem.code}
                                    onChange={(e) =>
                                      handleEditInputChange(
                                        "code",
                                        e.target.value
                                      )
                                    }
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                    placeholder="Enter code"
                                    autoFocus
                                  />
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={editItem.name}
                                  onChange={(e) =>
                                    handleEditInputChange(
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={handleKeyDown}
                                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                  placeholder="Enter name"
                                />
                              </td>
                              {isVehicleDetail ? (
                                <>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      value={editItem.make}
                                      onChange={(e) =>
                                        handleEditInputChange("make", e.target.value)
                                      }
                                      onKeyDown={handleKeyDown}
                                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                      placeholder="Enter make"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      value={editItem.model}
                                      onChange={(e) =>
                                        handleEditInputChange("model", e.target.value)
                                      }
                                      onKeyDown={handleKeyDown}
                                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                      placeholder="Enter model"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      value={editItem.year}
                                      onChange={(e) =>
                                        handleEditInputChange("year", e.target.value)
                                      }
                                      onKeyDown={handleKeyDown}
                                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                      placeholder="Enter year"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <input
                                      type="text"
                                      value={editItem.number}
                                      onChange={(e) =>
                                        handleEditInputChange("number", e.target.value)
                                      }
                                      onKeyDown={handleKeyDown}
                                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                      placeholder="Enter number"
                                    />
                                  </td>
                                </>
                              ) : (
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    value={editItem.description}
                                    onChange={(e) =>
                                      handleEditInputChange(
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                    placeholder="Enter description"
                                  />
                                </td>
                              )}
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={
                                      !editItem.code ||
                                      !editItem.name ||
                                      (!isVehicleDetail && !editItem.description)
                                    }
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md disabled:hover:shadow-none flex items-center space-x-1"
                                    title="Save (Ctrl+Enter)"
                                  >
                                    <Save className="h-3 w-3" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                                    title="Cancel (Esc)"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {item.code}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </div>
                              </td>
                              {isVehicleDetail ? (
                                <>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600">
                                      {item.make || "-"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600">
                                      {item.model || "-"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600">
                                      {item.year || "-"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600">
                                      {item.number || "-"}
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600 max-w-xs">
                                    {item.description}
                                  </div>
                                </td>
                              )}
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {canUpdate("data configuration") && (
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                      title="Edit item"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  )}
                                  {canDelete("data configuration") && (
                                    <button
                                      onClick={() => handleDeleteClick(item)}
                                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                                      title="Delete item"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {/* Add New Row */}
                      {canCreate("data configuration") && (
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-dashed border-gray-300">
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder="Enter code"
                              value={newItem.code}
                              onChange={(e) =>
                                handleInputChange("code", e.target.value)
                              }
                              onKeyDown={handleNewItemKeyDown}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder="Enter name"
                              value={newItem.name}
                              onChange={(e) =>
                                handleInputChange("name", e.target.value)
                              }
                              onKeyDown={handleNewItemKeyDown}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                            />
                          </td>
                          {isVehicleDetail ? (
                            <>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  placeholder="Enter make"
                                  value={newItem.make}
                                  onChange={(e) =>
                                    handleInputChange("make", e.target.value)
                                  }
                                  onKeyDown={handleNewItemKeyDown}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  placeholder="Enter model"
                                  value={newItem.model}
                                  onChange={(e) =>
                                    handleInputChange("model", e.target.value)
                                  }
                                  onKeyDown={handleNewItemKeyDown}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  placeholder="Enter year"
                                  value={newItem.year}
                                  onChange={(e) =>
                                    handleInputChange("year", e.target.value)
                                  }
                                  onKeyDown={handleNewItemKeyDown}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  placeholder="Enter number"
                                  value={newItem.number}
                                  onChange={(e) =>
                                    handleInputChange("number", e.target.value)
                                  }
                                  onKeyDown={handleNewItemKeyDown}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                                />
                              </td>
                            </>
                          ) : (
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                placeholder="Enter description"
                                value={newItem.description}
                                onChange={(e) =>
                                  handleInputChange("description", e.target.value)
                                }
                                onKeyDown={handleNewItemKeyDown}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={handleAddNew}
                                disabled={
                                  !newItem.code ||
                                  !newItem.name ||
                                  (!isVehicleDetail && !newItem.description)
                                }
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md disabled:hover:shadow-none flex items-center space-x-1"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Add</span>
                              </button>
                              <button
                                onClick={() =>
                                  setNewItem({
                                    code: "",
                                    name: "",
                                    description: "",
                                    make: "",
                                    model: "",
                                    year: "",
                                    number: "",
                                  })
                                }
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Clear form"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {currentData.length === 0 && (
                  <div className="text-center py-12 bg-gray-50">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No items found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Get started by adding your first item.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Item
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Code:</span>{" "}
                  {itemToDelete.item.code}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Name:</span>{" "}
                  {itemToDelete.item.name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Description:</span>{" "}
                  {itemToDelete.item.description}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Bulk Import from CSV</div>
              <div className="text-sm text-gray-500 font-normal">Map columns and review before importing</div>
            </div>
          </div>
        }
        open={showImportModal}
        onCancel={handleCloseImportModal}
        width={900}
        footer={null}
      >
        <div className="space-y-6 mt-4">
          {/* Column Mapping Section */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
              Map CSV Columns
            </h4>
            <div className={`grid gap-4 ${isVehicleDetail ? 'grid-cols-3' : 'grid-cols-3'}`}>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Code <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full"
                  placeholder="Select column"
                  value={columnMapping.code || undefined}
                  onChange={(value) => handleMappingChange("code", value)}
                  allowClear
                >
                  {csvHeaders.map((header) => (
                    <Option key={header} value={header}>
                      {header}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full"
                  placeholder="Select column"
                  value={columnMapping.name || undefined}
                  onChange={(value) => handleMappingChange("name", value)}
                  allowClear
                >
                  {csvHeaders.map((header) => (
                    <Option key={header} value={header}>
                      {header}
                    </Option>
                  ))}
                </Select>
              </div>
              {isVehicleDetail ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Make
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select column"
                      value={columnMapping.make || undefined}
                      onChange={(value) => handleMappingChange("make", value)}
                      allowClear
                    >
                      {csvHeaders.map((header) => (
                        <Option key={header} value={header}>
                          {header}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Model
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select column"
                      value={columnMapping.model || undefined}
                      onChange={(value) => handleMappingChange("model", value)}
                      allowClear
                    >
                      {csvHeaders.map((header) => (
                        <Option key={header} value={header}>
                          {header}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Year
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select column"
                      value={columnMapping.year || undefined}
                      onChange={(value) => handleMappingChange("year", value)}
                      allowClear
                    >
                      {csvHeaders.map((header) => (
                        <Option key={header} value={header}>
                          {header}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Number
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select column"
                      value={columnMapping.number || undefined}
                      onChange={(value) => handleMappingChange("number", value)}
                      allowClear
                    >
                      {csvHeaders.map((header) => (
                        <Option key={header} value={header}>
                          {header}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Description
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select column"
                    value={columnMapping.description || undefined}
                    onChange={(value) => handleMappingChange("description", value)}
                    allowClear
                  >
                    {csvHeaders.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
              Preview Data
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {importPreview.length} items
              </span>
            </h4>

            {importPreview.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">No valid items found</p>
                  <p className="text-xs text-amber-600">Please map at least Code and Name columns</p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <Table
                  dataSource={importPreview.slice(0, 10)}
                  columns={
                    isVehicleDetail
                      ? [
                          {
                            title: "Code",
                            dataIndex: "code",
                            key: "code",
                            render: (text: string) => (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                {text}
                              </span>
                            ),
                          },
                          { title: "Name", dataIndex: "name", key: "name" },
                          {
                            title: "Make",
                            dataIndex: "make",
                            key: "make",
                            render: (text: string) => (
                              <span className="text-gray-600">{text || "-"}</span>
                            ),
                          },
                          {
                            title: "Model",
                            dataIndex: "model",
                            key: "model",
                            render: (text: string) => (
                              <span className="text-gray-600">{text || "-"}</span>
                            ),
                          },
                          {
                            title: "Year",
                            dataIndex: "year",
                            key: "year",
                            render: (text: string) => (
                              <span className="text-gray-600">{text || "-"}</span>
                            ),
                          },
                          {
                            title: "Number",
                            dataIndex: "number",
                            key: "number",
                            render: (text: string) => (
                              <span className="text-gray-600">{text || "-"}</span>
                            ),
                          },
                        ]
                      : [
                          {
                            title: "Code",
                            dataIndex: "code",
                            key: "code",
                            render: (text: string) => (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                {text}
                              </span>
                            ),
                          },
                          { title: "Name", dataIndex: "name", key: "name" },
                          {
                            title: "Description",
                            dataIndex: "description",
                            key: "description",
                            render: (text: string) => (
                              <span className="text-gray-600">{text || "-"}</span>
                            ),
                          },
                        ]
                  }
                  pagination={false}
                  size="small"
                  rowKey={(record, index) => `preview-${index}`}
                />
                {importPreview.length > 10 && (
                  <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-500 border-t">
                    Showing 10 of {importPreview.length} items
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Ready to import {importPreview.length} items</span>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleCloseImportModal}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleBulkImport}
                loading={isImporting}
                disabled={importPreview.length === 0}
                className="!bg-green-600 hover:!bg-green-700 !border-green-600"
                icon={<Upload className="w-4 h-4" />}
              >
                Import {importPreview.length} Items
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataSetupTabs;
