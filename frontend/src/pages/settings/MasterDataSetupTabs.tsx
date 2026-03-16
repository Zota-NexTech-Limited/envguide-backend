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
  listMasterData,
  addMasterData,
  updateMasterData,
  deleteMasterData,
  bulkAddMasterData,
  getFuelTypeDropdown,
  getEnergySourceDropdown,
  getCompositionMetalDropdown,
  type MasterDataItem,
  type MasterDataEntity,
} from "../../lib/masterDataSetupService";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Modal, Select, Table, Button, App } from "antd";
import { usePermissions } from "../../contexts/PermissionContext";

const { Option } = Select;
const { useApp } = App;

interface TabConfig {
  key: string;
  label: string;
  entity: MasterDataEntity;
}

interface MasterDataSetupTabsProps {
  title: string;
  description?: string;
  tabs: TabConfig[];
  defaultTab?: string;
}

const MasterDataSetupTabs: React.FC<MasterDataSetupTabsProps> = ({
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
  const [tabData, setTabData] = useState<Record<string, MasterDataItem[]>>({});
  const [newItem, setNewItem] = useState({ name: "", ft_id: "", es_id: "", mcm_id: "", code: "", description: "", country_name: "" });
  const [editingItem, setEditingItem] = useState<{
    item: MasterDataItem;
    tab: string;
  } | null>(null);
  const [editItem, setEditItem] = useState({ name: "", ft_id: "", es_id: "", mcm_id: "", code: "", description: "", country_name: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Fuel type dropdown for sub-fuel-type entity
  const [fuelTypes, setFuelTypes] = useState<{ id: string; name: string }[]>([]);
  // Energy source dropdown for energy-type entity
  const [energySources, setEnergySources] = useState<{ id: string; name: string }[]>([]);
  // Composition metal dropdown for material-composition-metal-type entity
  const [compositionMetals, setCompositionMetals] = useState<{ id: string; name: string }[]>([]);
  const [itemToDelete, setItemToDelete] = useState<{
    item: MasterDataItem;
    tab: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    name: "",
    code: "",
    description: "",
    fuel_type_name: "",
    energy_source_name: "",
    composition_metal_name: "",
    country_name: "",
  });
  const [importPreview, setImportPreview] = useState<MasterDataItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const currentTabConfig = tabs.find((t) => t.key === activeTab);
  const currentEntity = currentTabConfig?.entity;
  const currentData = tabData[activeTab] || [];

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);

  useEffect(() => {
    const load = async () => {
      if (!currentEntity) return;
      setIsLoading(true);

      // Load fuel types if entity is sub-fuel-type
      if (currentEntity === "sub-fuel-type") {
        const fuelTypeData = await getFuelTypeDropdown();
        setFuelTypes(fuelTypeData);
      }
      // Load energy sources if entity is energy-type
      if (currentEntity === "energy-type") {
        const energySourceData = await getEnergySourceDropdown();
        setEnergySources(energySourceData);
      }
      // Load composition metals if entity is material-composition-metal-type
      if (currentEntity === "material-composition-metal-type") {
        const compositionMetalData = await getCompositionMetalDropdown();
        setCompositionMetals(compositionMetalData);
      }

      const data = await listMasterData(currentEntity);
      // Ensure each item has a unique ID (fallback to index if missing)
      const dataWithIds = data.map((item, idx) => ({
        ...item,
        id: item.id || `temp-${idx + 1}`,
      }));
      setTabData((prev) => ({ ...prev, [activeTab]: dataWithIds }));
      setIsLoading(false);
    };
    load();
  }, [activeTab, currentEntity]);

  const handleDelete = async (id: string) => {
    if (!currentEntity) return;
    const result = await deleteMasterData(currentEntity, id);
    if (result.success) {
      message.success("Item deleted successfully");
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
    if (!currentEntity || !newItem.name) return;
    // Validate ft_id for sub-fuel-type
    if (currentEntity === "sub-fuel-type" && !newItem.ft_id) {
      message.error("Please select a fuel type");
      return;
    }
    // Validate es_id for energy-type
    if (currentEntity === "energy-type" && !newItem.es_id) {
      message.error("Please select an energy source");
      return;
    }
    // Validate mcm_id for material-composition-metal-type (code is auto-generated)
    if (currentEntity === "material-composition-metal-type") {
      if (!newItem.mcm_id) {
        message.error("Please select a composition metal");
        return;
      }
    }
    const result = await addMasterData(currentEntity, {
      name: newItem.name,
      ft_id: newItem.ft_id || undefined,
      es_id: newItem.es_id || undefined,
      mcm_id: newItem.mcm_id || undefined,
      code: newItem.code || undefined,
      description: newItem.description || undefined,
      country_name: newItem.country_name || undefined,
    });
    if (result.success) {
      message.success("Item added successfully");
      const data = await listMasterData(currentEntity);
      const dataWithIds = data.map((item, idx) => ({
        ...item,
        id: item.id || `temp-${idx + 1}`,
      }));
      setTabData((prev) => ({ ...prev, [activeTab]: dataWithIds }));
      setNewItem({ name: "", ft_id: "", es_id: "", mcm_id: "", code: "", description: "", country_name: "" });
    } else {
      message.error({
        content: result.message || "Failed to add item",
        duration: 5,
      });
    }
  };

  const handleInputChange = (value: string) => {
    setNewItem((prev) => ({ ...prev, name: value }));
  };

  const handleEdit = (item: MasterDataItem) => {
    setEditingItem({ item, tab: activeTab });
    setEditItem({
      name: item.name,
      ft_id: item.ft_id || "",
      es_id: item.es_id || "",
      mcm_id: item.mcm_id || "",
      code: item.code || "",
      description: item.description || "",
      country_name: item.country_name || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!currentEntity || !editingItem || !editItem.name) return;

    // Validate ft_id for sub-fuel-type
    if (currentEntity === "sub-fuel-type" && !editItem.ft_id) {
      message.error("Please select a fuel type");
      return;
    }
    // Validate es_id for energy-type
    if (currentEntity === "energy-type" && !editItem.es_id) {
      message.error("Please select an energy source");
      return;
    }
    // Validate mcm_id and code for material-composition-metal-type
    if (currentEntity === "material-composition-metal-type") {
      if (!editItem.mcm_id) {
        message.error("Please select a composition metal");
        return;
      }
      if (!editItem.code) {
        message.error("Please enter a code");
        return;
      }
    }

    // Store original data for rollback
    const originalData = tabData[activeTab] || [];
    const currentEditing = editingItem;
    const editedValues = { ...editItem };

    // Get fuel type name for optimistic UI update
    const fuelTypeName = currentEntity === "sub-fuel-type"
      ? fuelTypes.find(ft => ft.id === editItem.ft_id)?.name || ""
      : "";

    // Get energy source name for optimistic UI update
    const energySourceName = currentEntity === "energy-type"
      ? energySources.find(es => es.id === editItem.es_id)?.name || ""
      : "";

    // Get composition metal name for optimistic UI update
    const compositionMetalName = currentEntity === "material-composition-metal-type"
      ? compositionMetals.find(cm => cm.id === editItem.mcm_id)?.name || ""
      : "";

    // Optimistic UI update
    setTabData((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).map((item) =>
        item.id === editingItem.item.id
          ? {
            ...item,
            name: editItem.name,
            ft_id: editItem.ft_id || item.ft_id,
            fuel_type_name: fuelTypeName || item.fuel_type_name,
            es_id: editItem.es_id || item.es_id,
            energy_source_name: energySourceName || item.energy_source_name,
            mcm_id: editItem.mcm_id || item.mcm_id,
            composition_metal_name: compositionMetalName || item.composition_metal_name,
            code: editItem.code || item.code,
            description: editItem.description || item.description,
            country_name: editItem.country_name || item.country_name,
          }
          : item
      ),
    }));

    handleCancelEdit();

    // Process API in background
    const result = await updateMasterData(currentEntity, {
      id: currentEditing.item.id!,
      name: editedValues.name,
      ft_id: editedValues.ft_id || undefined,
      es_id: editedValues.es_id || undefined,
      mcm_id: editedValues.mcm_id || undefined,
      code: editedValues.code || undefined,
      description: editedValues.description || undefined,
      country_name: editedValues.country_name || undefined,
    });

    if (result.success) {
      message.success("Item updated successfully");
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
    setEditItem({ name: "", ft_id: "", es_id: "", mcm_id: "", code: "", description: "", country_name: "" });
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

  const handleDeleteClick = (item: MasterDataItem) => {
    setItemToDelete({ item, tab: activeTab });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await handleDelete(itemToDelete.item.id!);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setEditingItem(null);
    setEditItem({ name: "", ft_id: "", es_id: "", mcm_id: "", code: "", description: "", country_name: "" });
    setNewItem({ name: "", ft_id: "", es_id: "", mcm_id: "", code: "", description: "", country_name: "" });
    // Update URL to reflect tab change
    const currentPath = window.location.pathname;
    const tabKeys = tabs.map((t) => t.key);
    const pathParts = currentPath.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    if (tabKeys.includes(lastPart)) {
      const basePath = "/" + pathParts.slice(0, -1).join("/");
      navigate(`${basePath}/${tabKey}`, { replace: true });
    } else {
      navigate(`${currentPath}/${tabKey}`, { replace: true });
    }
  };

  const handleExport = () => {
    if (!currentData || currentData.length === 0) {
      message.warning("No data to export");
      return;
    }

    // Convert data to CSV
    const headers = ["Code", "Name", "Country Name"];
    const rows = currentData.map((item) => [item.code || "", item.name, item.country_name || ""]);

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
      `${currentTabConfig?.label || "data"}-${new Date().toISOString().split("T")[0]
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
    const mapping: Record<string, string> = { name: "", fuel_type_name: "", energy_source_name: "", composition_metal_name: "", country_name: "" };
    const fieldsToMatch = [
      { key: "name", patterns: ["name", "title", "label", "value", "sub fuel type", "sub-fuel-type", "energy type", "energy-type", "composition metal type"] },
      { key: "fuel_type_name", patterns: ["fuel type", "fuel_type", "fuel-type", "fueltype", "fuel type name"] },
      { key: "energy_source_name", patterns: ["energy source", "energy_source", "energy-source", "energysource", "energy source name"] },
      { key: "composition_metal_name", patterns: ["composition metal", "composition_metal", "composition-metal", "compositionmetal", "composition metal name"] },
      { key: "country_name", patterns: ["country name", "country_name", "countryname", "country"] },
    ];

    headers.forEach((header) => {
      const headerLower = header.toLowerCase().trim();
      fieldsToMatch.forEach((field) => {
        if (!mapping[field.key]) {
          for (const pattern of field.patterns) {
            if (
              headerLower.includes(pattern) ||
              pattern.includes(headerLower)
            ) {
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
        message.error(
          "CSV file must have at least a header row and one data row"
        );
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

    const nameIdx = getColumnIndex("name");
    const fuelTypeNameIdx = getColumnIndex("fuel_type_name");
    const energySourceNameIdx = getColumnIndex("energy_source_name");
    const compositionMetalNameIdx = getColumnIndex("composition_metal_name");
    const countryNameIdx = getColumnIndex("country_name");

    const previewItems: MasterDataItem[] = data
      .filter((row) => {
        const name = nameIdx >= 0 ? row[nameIdx] : "";
        // For sub-fuel-type, also require fuel_type_name
        if (currentEntity === "sub-fuel-type") {
          const fuelTypeName = fuelTypeNameIdx >= 0 ? row[fuelTypeNameIdx] : "";
          return name && fuelTypeName;
        }
        // For energy-type, also require energy_source_name
        if (currentEntity === "energy-type") {
          const energySourceName = energySourceNameIdx >= 0 ? row[energySourceNameIdx] : "";
          return name && energySourceName;
        }
        // For material-composition-metal-type, also require composition_metal_name
        if (currentEntity === "material-composition-metal-type") {
          const compositionMetalName = compositionMetalNameIdx >= 0 ? row[compositionMetalNameIdx] : "";
          return name && compositionMetalName;
        }
        return name; // At least name required
      })
      .map((row) => {
        const item: MasterDataItem = {
          name: nameIdx >= 0 ? row[nameIdx] : "",
          country_name: countryNameIdx >= 0 ? row[countryNameIdx] : "",
        };
        // Include fuel_type_name for sub-fuel-type bulk import
        if (currentEntity === "sub-fuel-type" && fuelTypeNameIdx >= 0) {
          item.fuel_type_name = row[fuelTypeNameIdx];
        }
        // Include energy_source_name for energy-type bulk import
        if (currentEntity === "energy-type" && energySourceNameIdx >= 0) {
          item.energy_source_name = row[energySourceNameIdx];
        }
        // Include composition_metal_name for material-composition-metal-type bulk import
        if (currentEntity === "material-composition-metal-type" && compositionMetalNameIdx >= 0) {
          item.composition_metal_name = row[compositionMetalNameIdx];
        }
        return item;
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
      const result = await bulkAddMasterData(currentEntity!, importPreview);

      if (result.success) {
        message.success(
          `Successfully imported ${result.addedCount || importPreview.length} items`
        );

        // Reload data
        const data = await listMasterData(currentEntity!);
        setTabData((prev) => ({ ...prev, [activeTab]: data }));

        // Close modal and reset state
        handleCloseImportModal();
        setShowImportModal(false);
      } else {
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
    setColumnMapping({ name: "", fuel_type_name: "", energy_source_name: "", country_name: "" });
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
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key
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
              className="mb-4 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center space-x-2 animate-in slide-in-from-top-2 duration-200"
              style={{ display: editingItem ? "flex" : "none" }}
            >
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium mb-1">
                  Keyboard shortcuts available
                </p>
                <p className="text-xs text-green-600">
                  <kbd className="px-1.5 py-0.5 bg-green-100 rounded text-xs font-mono">
                    Ctrl+Enter
                  </kbd>{" "}
                  to save •
                  <kbd className="px-1.5 py-0.5 bg-green-100 rounded text-xs font-mono ml-1">
                    Esc
                  </kbd>{" "}
                  to cancel
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-green-400 hover:text-green-600 transition-colors"
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
                        {currentEntity === "sub-fuel-type" && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Fuel Type
                          </th>
                        )}
                        {currentEntity === "energy-type" && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Energy Source
                          </th>
                        )}
                        {currentEntity === "material-composition-metal-type" && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Composition Metal
                          </th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                          Name
                        </th>
                        {(currentEntity === "country-iso-two" || currentEntity === "country-iso-three" || currentEntity === "time-zone") && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Country Name
                          </th>
                        )}
                        {currentEntity === "material-composition-metal-type" && (
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
                          className={`group hover:bg-gray-50 transition-colors duration-150 ${editingItem?.item.id === item.id &&
                            editingItem?.tab === activeTab
                            ? "bg-green-50 border-l-4 border-green-500"
                            : ""
                            } ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                        >
                          {editingItem?.item.id === item.id &&
                            editingItem?.tab === activeTab ? (
                            <>
                              <td className="px-6 py-4">
                                {currentEntity === "material-composition-metal-type" ? (
                                  <input
                                    type="text"
                                    value={editItem.code}
                                    onChange={(e) =>
                                      setEditItem({ ...editItem, code: e.target.value })
                                    }
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                    placeholder="Enter code"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    {item.code || "-"}
                                  </div>
                                )}
                              </td>
                              {currentEntity === "sub-fuel-type" && (
                                <td className="px-6 py-4">
                                  <Select
                                    value={editItem.ft_id || undefined}
                                    onChange={(value) =>
                                      setEditItem({ ...editItem, ft_id: value })
                                    }
                                    className="w-full"
                                    placeholder="Select fuel type"
                                    size="middle"
                                  >
                                    {fuelTypes.map((ft) => (
                                      <Option key={ft.id} value={ft.id}>
                                        {ft.name}
                                      </Option>
                                    ))}
                                  </Select>
                                </td>
                              )}
                              {currentEntity === "energy-type" && (
                                <td className="px-6 py-4">
                                  <Select
                                    value={editItem.es_id || undefined}
                                    onChange={(value) =>
                                      setEditItem({ ...editItem, es_id: value })
                                    }
                                    className="w-full"
                                    placeholder="Select energy source"
                                    size="middle"
                                  >
                                    {energySources.map((es) => (
                                      <Option key={es.id} value={es.id}>
                                        {es.name}
                                      </Option>
                                    ))}
                                  </Select>
                                </td>
                              )}
                              {currentEntity === "material-composition-metal-type" && (
                                <td className="px-6 py-4">
                                  <Select
                                    value={editItem.mcm_id || undefined}
                                    onChange={(value) =>
                                      setEditItem({ ...editItem, mcm_id: value })
                                    }
                                    className="w-full"
                                    placeholder="Select composition metal"
                                    size="middle"
                                  >
                                    {compositionMetals.map((cm) => (
                                      <Option key={cm.id} value={cm.id}>
                                        {cm.name}
                                      </Option>
                                    ))}
                                  </Select>
                                </td>
                              )}
                              <td className="px-6 py-4">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={editItem.name}
                                    onChange={(e) =>
                                      setEditItem({ ...editItem, name: e.target.value })
                                    }
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                    placeholder="Enter name"
                                    autoFocus
                                  />
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                              </td>
                              {(currentEntity === "country-iso-two" || currentEntity === "country-iso-three" || currentEntity === "time-zone") && (
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    value={editItem.country_name}
                                    onChange={(e) =>
                                      setEditItem({ ...editItem, country_name: e.target.value })
                                    }
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                    placeholder="Enter country name"
                                  />
                                </td>
                              )}
                              {currentEntity === "material-composition-metal-type" && (
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    value={editItem.description}
                                    onChange={(e) =>
                                      setEditItem({ ...editItem, description: e.target.value })
                                    }
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 bg-white shadow-sm"
                                    placeholder="Enter description"
                                  />
                                </td>
                              )}
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={
                                      !editItem.name ||
                                      (currentEntity === "sub-fuel-type" && !editItem.ft_id) ||
                                      (currentEntity === "energy-type" && !editItem.es_id) ||
                                      (currentEntity === "material-composition-metal-type" && (!editItem.mcm_id || !editItem.code))
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
                                <div className="text-sm text-gray-500">
                                  {item.code || "-"}
                                </div>
                              </td>
                              {currentEntity === "sub-fuel-type" && (
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">
                                    {item.fuel_type_name || "-"}
                                  </div>
                                </td>
                              )}
                              {currentEntity === "energy-type" && (
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">
                                    {item.energy_source_name || "-"}
                                  </div>
                                </td>
                              )}
                              {currentEntity === "material-composition-metal-type" && (
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">
                                    {item.composition_metal_name || "-"}
                                  </div>
                                </td>
                              )}
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </div>
                              </td>
                              {(currentEntity === "country-iso-two" || currentEntity === "country-iso-three" || currentEntity === "time-zone") && (
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">
                                    {item.country_name || "-"}
                                  </div>
                                </td>
                              )}
                              {currentEntity === "material-composition-metal-type" && (
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">
                                    {item.description || "-"}
                                  </div>
                                </td>
                              )}
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {canUpdate("master data setup") && (
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                                      title="Edit item"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  )}
                                  {canDelete("master data setup") && (
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
                      {canCreate("master data setup") && (
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-dashed border-gray-300">
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-400 italic">Auto-generated</span>
                          </td>
                          {currentEntity === "sub-fuel-type" && (
                            <td className="px-6 py-4">
                              <Select
                                value={newItem.ft_id || undefined}
                                onChange={(value) =>
                                  setNewItem({ ...newItem, ft_id: value })
                                }
                                className="w-full"
                                placeholder="Select fuel type"
                                size="middle"
                              >
                                {fuelTypes.map((ft) => (
                                  <Option key={ft.id} value={ft.id}>
                                    {ft.name}
                                  </Option>
                                ))}
                              </Select>
                            </td>
                          )}
                          {currentEntity === "energy-type" && (
                            <td className="px-6 py-4">
                              <Select
                                value={newItem.es_id || undefined}
                                onChange={(value) =>
                                  setNewItem({ ...newItem, es_id: value })
                                }
                                className="w-full"
                                placeholder="Select energy source"
                                size="middle"
                              >
                                {energySources.map((es) => (
                                  <Option key={es.id} value={es.id}>
                                    {es.name}
                                  </Option>
                                ))}
                              </Select>
                            </td>
                          )}
                          {currentEntity === "material-composition-metal-type" && (
                            <td className="px-6 py-4">
                              <Select
                                value={newItem.mcm_id || undefined}
                                onChange={(value) =>
                                  setNewItem({ ...newItem, mcm_id: value })
                                }
                                className="w-full"
                                placeholder="Select composition metal"
                                size="middle"
                              >
                                {compositionMetals.map((cm) => (
                                  <Option key={cm.id} value={cm.id}>
                                    {cm.name}
                                  </Option>
                                ))}
                              </Select>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder="Enter name"
                              value={newItem.name}
                              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                            />
                          </td>
                          {(currentEntity === "country-iso-two" || currentEntity === "country-iso-three" || currentEntity === "time-zone") && (
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                placeholder="Enter country name"
                                value={newItem.country_name}
                                onChange={(e) => setNewItem({ ...newItem, country_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                              />
                            </td>
                          )}
                          {currentEntity === "material-composition-metal-type" && (
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                placeholder="Enter description"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors placeholder-gray-400"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={handleAddNew}
                                disabled={
                                  !newItem.name ||
                                  (currentEntity === "sub-fuel-type" && !newItem.ft_id) ||
                                  (currentEntity === "energy-type" && !newItem.es_id) ||
                                  (currentEntity === "material-composition-metal-type" && !newItem.mcm_id)
                                }
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md disabled:hover:shadow-none flex items-center space-x-1"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Add</span>
                              </button>
                              <button
                                onClick={() => setNewItem({ name: "", ft_id: "", es_id: "", mcm_id: "", code: "", description: "", country_name: "" })}
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

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 space-y-2">
                {itemToDelete.item.code && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Code:</span>{" "}
                    {itemToDelete.item.code}
                  </p>
                )}
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Name:</span>{" "}
                  {itemToDelete.item.name}
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
              <div className="font-semibold text-gray-900">
                Bulk Import from CSV
              </div>
              <div className="text-sm text-gray-500 font-normal">
                Map columns and review before importing
              </div>
            </div>
          </div>
        }
        open={showImportModal}
        onCancel={handleCloseImportModal}
        width={700}
        footer={null}
      >
        <div className="space-y-6 mt-4">
          {/* Column Mapping Section */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                1
              </span>
              Map CSV Columns
            </h4>
            <div className={(currentEntity === "sub-fuel-type" || currentEntity === "energy-type" || currentEntity === "material-composition-metal-type") ? "grid grid-cols-2 gap-4" : ""}>
              {currentEntity === "sub-fuel-type" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Fuel Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select column"
                    value={columnMapping.fuel_type_name || undefined}
                    onChange={(value) => handleMappingChange("fuel_type_name", value)}
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
              {currentEntity === "energy-type" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Energy Source <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select column"
                    value={columnMapping.energy_source_name || undefined}
                    onChange={(value) => handleMappingChange("energy_source_name", value)}
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
              {currentEntity === "material-composition-metal-type" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Composition Metal <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select column"
                    value={columnMapping.composition_metal_name || undefined}
                    onChange={(value) => handleMappingChange("composition_metal_name", value)}
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full max-w-xs"
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Country Name
                </label>
                <Select
                  className="w-full max-w-xs"
                  placeholder="Select column"
                  value={columnMapping.country_name || undefined}
                  onChange={(value) => handleMappingChange("country_name", value)}
                  allowClear
                >
                  {csvHeaders.map((header) => (
                    <Option key={header} value={header}>
                      {header}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                2
              </span>
              Preview Data
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {importPreview.length} items
              </span>
            </h4>

            {importPreview.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    No valid items found
                  </p>
                  <p className="text-xs text-amber-600">
                    {currentEntity === "sub-fuel-type"
                      ? "Please map both Fuel Type and Name columns"
                      : currentEntity === "energy-type"
                        ? "Please map both Energy Source and Name columns"
                        : currentEntity === "material-composition-metal-type"
                          ? "Please map both Composition Metal and Name columns"
                          : "Please map the Name column"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <Table
                  dataSource={importPreview.slice(0, 10)}
                  columns={
                    currentEntity === "sub-fuel-type"
                      ? [
                        { title: "Fuel Type", dataIndex: "fuel_type_name", key: "fuel_type_name" },
                        { title: "Name", dataIndex: "name", key: "name" },
                      ]
                      : currentEntity === "energy-type"
                        ? [
                          { title: "Energy Source", dataIndex: "energy_source_name", key: "energy_source_name" },
                          { title: "Name", dataIndex: "name", key: "name" },
                        ]
                        : currentEntity === "material-composition-metal-type"
                          ? [
                            { title: "Composition Metal", dataIndex: "composition_metal_name", key: "composition_metal_name" },
                            { title: "Name", dataIndex: "name", key: "name" },
                          ]
                          : (currentEntity === "country-iso-two" || currentEntity === "country-iso-three" || currentEntity === "time-zone")
                            ? [
                              { title: "Name", dataIndex: "name", key: "name" },
                              { title: "Country Name", dataIndex: "country_name", key: "country_name" },
                            ]
                            : [{ title: "Name", dataIndex: "name", key: "name" }]
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

export default MasterDataSetupTabs;
