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
  Leaf,
} from "lucide-react";
import {
  listEcoInventData,
  addEcoInventData,
  updateEcoInventData,
  deleteEcoInventData,
  bulkAddEcoInventData,
  getEntityConfig,
  getTreatmentTypeDropdown,
  getWasteTreatmentTypeDropdown,
  getVehicleTypeDropdown,
  getMaterialsMaterialTypeDropdown,
  getEnergySourceEnergyTypeDropdown,
  getFuelTypeSubTypeDropdown,
  type EcoInventItem,
  type EcoInventEntity,
} from "../../lib/ecoInventService";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Modal, Select, Table, Button, App, Input, InputNumber } from "antd";
import { usePermissions } from "../../contexts/PermissionContext";

const { Option } = Select;
const { useApp } = App;

interface TabConfig {
  key: string;
  label: string;
  entity: EcoInventEntity;
}

interface EcoInventSetupTabsProps {
  title: string;
  description?: string;
  tabs: TabConfig[];
  defaultTab?: string;
}

const EcoInventSetupTabs: React.FC<EcoInventSetupTabsProps> = ({
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
  const [tabData, setTabData] = useState<Record<string, EcoInventItem[]>>({});
  const [newItem, setNewItem] = useState<EcoInventItem>({
    ef_eu_region: "",
    ef_india_region: "",
    ef_global_region: "",
    year: new Date().getFullYear(),
    unit: "",
    iso_country_code: "",
  });
  const [editingItem, setEditingItem] = useState<{
    item: EcoInventItem;
    tab: string;
  } | null>(null);
  const [editItem, setEditItem] = useState<EcoInventItem>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    item: EcoInventItem;
    tab: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importPreview, setImportPreview] = useState<EcoInventItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Treatment type dropdowns
  const [treatmentTypes, setTreatmentTypes] = useState<{ id: string; name: string }[]>([]);
  const [wasteTreatmentTypes, setWasteTreatmentTypes] = useState<{ id: string; name: string }[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<{ id: string; name: string }[]>([]);
  const [materialsMaterialTypes, setMaterialsMaterialTypes] = useState<{ id: string; name: string }[]>([]);
  const [energySourceTypes, setEnergySourceTypes] = useState<{ id: string; name: string }[]>([]);
  const [fuelSubTypes, setFuelSubTypes] = useState<{ id: string; name: string }[]>([]);

  const currentTabConfig = tabs.find((t) => t.key === activeTab);
  const currentEntity = currentTabConfig?.entity;
  const currentData = tabData[activeTab] || [];
  const entityConfig = currentEntity ? getEntityConfig(currentEntity) : null;

  // Special entity checks
  const isPackagingTreatmentType = currentEntity === "packaging-treatment-type";
  const isPackagingEmissionFactor = currentEntity === "packaging-emission-factor";
  const isWasteTreatmentType = currentEntity === "waste-treatment-type";
  const isWasteMaterialEmissionFactor = currentEntity === "waste-material-type-emission-factor";
  const isVehicleTypeEmissionFactor = currentEntity === "vehicle-type-emission-factor";
  const isMaterialsEmissionFactor = currentEntity === "materials-emission-factor";
  const isElectricityEmissionFactor = currentEntity === "electricity-emission-factor";
  const isFuelEmissionFactor = currentEntity === "fuel-emission-factor";
  const isTreatmentType = isPackagingTreatmentType || isWasteTreatmentType;

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);

  useEffect(() => {
    const load = async () => {
      if (!currentEntity) return;
      setIsLoading(true);
      const data = await listEcoInventData(currentEntity);
      setTabData((prev) => ({ ...prev, [activeTab]: data }));
      setIsLoading(false);
    };
    load();
  }, [activeTab, currentEntity]);

  // Load treatment types for packaging emission factor
  useEffect(() => {
    if (isPackagingEmissionFactor) {
      getTreatmentTypeDropdown().then(setTreatmentTypes);
    }
  }, [isPackagingEmissionFactor]);

  // Load waste treatment types for waste material emission factor
  useEffect(() => {
    if (isWasteMaterialEmissionFactor) {
      getWasteTreatmentTypeDropdown().then(setWasteTreatmentTypes);
    }
  }, [isWasteMaterialEmissionFactor]);

  // Load vehicle types for vehicle type emission factor
  useEffect(() => {
    if (isVehicleTypeEmissionFactor) {
      getVehicleTypeDropdown().then(setVehicleTypes);
    }
  }, [isVehicleTypeEmissionFactor]);

  // Load materials + material types for materials emission factor
  useEffect(() => {
    if (isMaterialsEmissionFactor) {
      getMaterialsMaterialTypeDropdown().then(setMaterialsMaterialTypes);
    }
  }, [isMaterialsEmissionFactor]);

  // Load energy source + energy types for electricity emission factor
  useEffect(() => {
    if (isElectricityEmissionFactor) {
      getEnergySourceEnergyTypeDropdown().then(setEnergySourceTypes);
    }
  }, [isElectricityEmissionFactor]);

  // Load fuel type + sub fuel types for fuel emission factor
  useEffect(() => {
    if (isFuelEmissionFactor) {
      getFuelTypeSubTypeDropdown().then(setFuelSubTypes);
    }
  }, [isFuelEmissionFactor]);

  // Reset new item when entity changes
  useEffect(() => {
    if (entityConfig) {
      // Treatment types (packaging and waste) use name and code only
      if (isTreatmentType) {
        setNewItem({
          name: "",
          code: "",
        });
      }
      // Packaging emission factor includes ptt_id
      else if (isPackagingEmissionFactor) {
        setNewItem({
          [entityConfig.nameField]: "",
          ptt_id: "",
          ef_eu_region: "",
          ef_india_region: "",
          ef_global_region: "",
          year: new Date().getFullYear(),
          unit: "",
          iso_country_code: "",
        });
      }
      // Waste material emission factor includes wtt_id
      else if (isWasteMaterialEmissionFactor) {
        setNewItem({
          [entityConfig.nameField]: "",
          wtt_id: "",
          ef_eu_region: "",
          ef_india_region: "",
          ef_global_region: "",
          year: new Date().getFullYear(),
          unit: "",
          iso_country_code: "",
        });
      }
      // Vehicle type emission factor includes vt_id
      else if (isVehicleTypeEmissionFactor) {
        setNewItem({
          [entityConfig.nameField]: "",
          vt_id: "",
          ef_eu_region: "",
          ef_india_region: "",
          ef_global_region: "",
          year: new Date().getFullYear(),
          unit: "",
          iso_country_code: "",
        });
      } else {
        setNewItem({
          [entityConfig.nameField]: "",
          ef_eu_region: "",
          ef_india_region: "",
          ef_global_region: "",
          year: new Date().getFullYear(),
          unit: "",
          iso_country_code: "",
        });
      }
    }
  }, [entityConfig, isTreatmentType, isPackagingEmissionFactor, isWasteMaterialEmissionFactor]);

  const handleDelete = async (id: string) => {
    if (!currentEntity) return;
    const result = await deleteEcoInventData(currentEntity, id);
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
    if (!currentEntity || !entityConfig) return;

    // Validation for treatment types (packaging and waste)
    if (isTreatmentType) {
      if (!newItem.name) {
        message.warning("Please enter Treatment Type name");
        return;
      }
      if (!newItem.code) {
        message.warning("Please enter Treatment Type code");
        return;
      }
    } else {
      const nameValue = newItem[entityConfig.nameField as keyof EcoInventItem];
      if (!nameValue) {
        message.warning(`Please enter ${entityConfig.displayName}`);
        return;
      }
    }

    const result = await addEcoInventData(currentEntity, newItem);
    if (result.success) {
      message.success("Item added successfully");
      const data = await listEcoInventData(currentEntity);
      setTabData((prev) => ({ ...prev, [activeTab]: data }));

      // Reset new item based on entity type
      if (isTreatmentType) {
        setNewItem({ name: "", code: "" });
      } else if (isPackagingEmissionFactor) {
        setNewItem({
          [entityConfig.nameField]: "",
          ptt_id: "",
          ef_eu_region: "",
          ef_india_region: "",
          ef_global_region: "",
          year: new Date().getFullYear(),
          unit: "",
          iso_country_code: "",
        });
      } else if (isWasteMaterialEmissionFactor) {
        setNewItem({
          [entityConfig.nameField]: "",
          wtt_id: "",
          ef_eu_region: "",
          ef_india_region: "",
          ef_global_region: "",
          year: new Date().getFullYear(),
          unit: "",
          iso_country_code: "",
        });
      } else if (isVehicleTypeEmissionFactor) {
        setNewItem({
          [entityConfig.nameField]: "",
          vt_id: "",
          ef_eu_region: "",
          ef_india_region: "",
          ef_global_region: "",
          year: new Date().getFullYear(),
          unit: "",
          iso_country_code: "",
        });
      } else {
        setNewItem({
          [entityConfig.nameField]: "",
          ef_eu_region: "",
          ef_india_region: "",
          ef_global_region: "",
          year: new Date().getFullYear(),
          unit: "",
          iso_country_code: "",
        });
      }
      setShowAddModal(false);
    } else {
      message.error({
        content: result.message || "Failed to add item",
        duration: 5,
      });
    }
  };

  const handleEdit = (item: EcoInventItem) => {
    setEditingItem({ item, tab: activeTab });
    setEditItem({ ...item });
  };

  const handleSaveEdit = async () => {
    if (!currentEntity || !editingItem || !entityConfig) return;

    // Validation for treatment types (packaging and waste)
    if (isTreatmentType) {
      if (!editItem.name) {
        message.warning("Please enter Treatment Type name");
        return;
      }
      if (!editItem.code) {
        message.warning("Please enter Treatment Type code");
        return;
      }
    } else {
      const nameValue = editItem[entityConfig.nameField as keyof EcoInventItem];
      if (!nameValue) {
        message.warning(`Please enter ${entityConfig.displayName}`);
        return;
      }
    }

    // Store original data for rollback
    const originalData = tabData[activeTab] || [];
    const currentEditing = editingItem;
    const editedValues = { ...editItem };
    const editingId = editingItem.item.id;

    // Only do optimistic update if item has a valid ID
    if (editingId) {
      setTabData((prev) => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).map((item) =>
          item.id === editingId ? { ...item, ...editItem } : item
        ),
      }));
    }

    handleCancelEdit();

    // Process API in background
    const result = await updateEcoInventData(currentEntity, {
      id: currentEditing.item.id!,
      ...editedValues,
    });

    if (result.success) {
      message.success("Item updated successfully");
      // Refresh data from API to get accurate state
      const data = await listEcoInventData(currentEntity);
      setTabData((prev) => ({ ...prev, [activeTab]: data }));
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
    setEditItem({});
  };

  const handleDeleteClick = (item: EcoInventItem) => {
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
    setEditItem({});
    // Update URL
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
    if (!currentData || currentData.length === 0 || !entityConfig) {
      message.warning("No data to export");
      return;
    }

    let headers: string[];
    let rows: (string | number)[][];

    // Treatment types (packaging and waste) only have name and code
    if (isTreatmentType) {
      headers = ["Treatment Type", "Code"];
      rows = currentData.map((item) => [
        item.name || "",
        item.code || "",
      ]);
    }
    // Waste material emission factor includes waste treatment type
    else if (isWasteMaterialEmissionFactor) {
      headers = [
        entityConfig.displayName,
        "Waste Treatment Type",
        "EF EU Region",
        "EF India Region",
        "EF Global Region",
        "Year",
        "Unit",
        "ISO Country Code",
      ];
      rows = currentData.map((item) => {
        const wasteTreatmentType = wasteTreatmentTypes.find((t) => t.id === item.wtt_id);
        return [
          item[entityConfig.nameField as keyof EcoInventItem] || "",
          wasteTreatmentType?.name || item.wtt_id || "",
          item.ef_eu_region || "",
          item.ef_india_region || "",
          item.ef_global_region || "",
          item.year?.toString() || "",
          item.unit || "",
          item.iso_country_code || "",
        ];
      });
    }
    // Packaging emission factor includes treatment type
    else if (isPackagingEmissionFactor) {
      headers = [
        entityConfig.displayName,
        "Treatment Type",
        "EF EU Region",
        "EF India Region",
        "EF Global Region",
        "Year",
        "Unit",
        "ISO Country Code",
      ];
      rows = currentData.map((item) => {
        const treatmentType = treatmentTypes.find((t) => t.id === item.ptt_id);
        return [
          item[entityConfig.nameField as keyof EcoInventItem] || "",
          treatmentType?.name || item.ptt_id || "",
          item.ef_eu_region || "",
          item.ef_india_region || "",
          item.ef_global_region || "",
          item.year?.toString() || "",
          item.unit || "",
          item.iso_country_code || "",
        ];
      });
    } else {
      headers = [
        entityConfig.displayName,
        "EF EU Region",
        "EF India Region",
        "EF Global Region",
        "Year",
        "Unit",
        "ISO Country Code",
      ];
      rows = currentData.map((item) => [
        item[entityConfig.nameField as keyof EcoInventItem] || "",
        item.ef_eu_region || "",
        item.ef_india_region || "",
        item.ef_global_region || "",
        item.year?.toString() || "",
        item.unit || "",
        item.iso_country_code || "",
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${currentTabConfig?.label || "ecoinvent"}-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV line
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

  // Auto-detect column mapping
  const autoDetectMapping = (headers: string[]): Record<string, string> => {
    if (!entityConfig) return {};

    // Treatment types (packaging and waste) only use name and code
    if (isTreatmentType) {
      const mapping: Record<string, string> = {
        name: "",
        code: "",
      };

      const fieldsToMatch = [
        { key: "name", patterns: ["name", "treatment", "type", "treatment type"] },
        { key: "code", patterns: ["code"] },
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
    }

    const mapping: Record<string, string> = {
      [entityConfig.nameField]: "",
      ef_eu_region: "",
      ef_india_region: "",
      ef_global_region: "",
      year: "",
      unit: "",
      iso_country_code: "",
    };

    // Add ptt_id for packaging emission factor
    if (isPackagingEmissionFactor) {
      mapping.ptt_id = "";
    }

    // Add wtt_id for waste material emission factor
    if (isWasteMaterialEmissionFactor) {
      mapping.wtt_id = "";
    }

    // Add element_type for materials emission factor
    if (isMaterialsEmissionFactor) {
      mapping.element_type = "";
    }

    // Add treatment_type for electricity emission factor
    if (isElectricityEmissionFactor) {
      mapping.treatment_type = "";
    }

    // Add sub_fuel_type for fuel emission factor
    if (isFuelEmissionFactor) {
      mapping.sub_fuel_type = "";
    }

    const fieldsToMatch = [
      {
        key: entityConfig.nameField,
        patterns: [
          entityConfig.nameField.replace(/_/g, " "),
          "name",
          "element",
          "type",
          "material",
          "energy",
          "vehicle",
          "fuel",
          "waste",
          "packaging",
        ],
      },
      {
        key: "ef_eu_region",
        patterns: ["eu", "europe", "ef_eu", "eu_region", "ef eu"],
      },
      {
        key: "ef_india_region",
        patterns: ["india", "ef_india", "india_region", "ef india"],
      },
      {
        key: "ef_global_region",
        patterns: ["global", "ef_global", "global_region", "ef global"],
      },
      { key: "year", patterns: ["year"] },
      { key: "unit", patterns: ["unit"] },
      {
        key: "iso_country_code",
        patterns: ["iso", "country", "country_code", "iso_code"],
      },
    ];

    // Add treatment type matching for packaging emission factor
    if (isPackagingEmissionFactor) {
      fieldsToMatch.push({
        key: "ptt_id",
        patterns: ["treatment", "treatment type", "ptt"],
      });
    }

    // Add waste treatment type matching for waste material emission factor
    if (isWasteMaterialEmissionFactor) {
      fieldsToMatch.push({
        key: "wtt_id",
        patterns: ["waste treatment", "treatment", "wtt"],
      });
    }

    // Add element_type matching for materials emission factor
    if (isMaterialsEmissionFactor) {
      fieldsToMatch.push({
        key: "element_type",
        patterns: ["element type", "element_type", "type"],
      });
    }

    // Add treatment_type matching for electricity emission factor
    if (isElectricityEmissionFactor) {
      fieldsToMatch.push({
        key: "treatment_type",
        patterns: ["treatment type", "treatment_type", "treatment"],
      });
    }

    // Add sub_fuel_type matching for fuel emission factor
    if (isFuelEmissionFactor) {
      fieldsToMatch.push({
        key: "sub_fuel_type",
        patterns: ["sub fuel type", "sub_fuel_type", "sub fuel", "sub type"],
      });
    }

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

      const autoMapping = autoDetectMapping(headers);
      setColumnMapping(autoMapping);

      updateImportPreview(autoMapping, headers, dataRows);
      setShowImportModal(true);
    };
    input.click();
  };

  // Update preview
  const updateImportPreview = (
    mapping: Record<string, string>,
    headers: string[],
    data: string[][]
  ) => {
    if (!entityConfig) return;

    const getColumnIndex = (fieldKey: string): number => {
      const mappedHeader = mapping[fieldKey];
      if (!mappedHeader) return -1;
      return headers.findIndex((h) => h === mappedHeader);
    };

    // Treatment types (packaging and waste) only use name and code
    if (isTreatmentType) {
      const nameIdx = getColumnIndex("name");
      const codeIdx = getColumnIndex("code");

      const previewItems: EcoInventItem[] = data
        .filter((row) => {
          const name = nameIdx >= 0 ? row[nameIdx] : "";
          return name;
        })
        .map((row) => ({
          name: nameIdx >= 0 ? row[nameIdx] : "",
          code: codeIdx >= 0 ? row[codeIdx] : "",
        }));

      setImportPreview(previewItems);
      return;
    }

    const nameIdx = getColumnIndex(entityConfig.nameField);
    const euIdx = getColumnIndex("ef_eu_region");
    const indiaIdx = getColumnIndex("ef_india_region");
    const globalIdx = getColumnIndex("ef_global_region");
    const yearIdx = getColumnIndex("year");
    const unitIdx = getColumnIndex("unit");
    const isoIdx = getColumnIndex("iso_country_code");
    const pttIdx = isPackagingEmissionFactor ? getColumnIndex("ptt_id") : -1;
    const wttIdx = isWasteMaterialEmissionFactor ? getColumnIndex("wtt_id") : -1;
    const elementTypeIdx = isMaterialsEmissionFactor ? getColumnIndex("element_type") : -1;
    const treatmentTypeIdx = isElectricityEmissionFactor ? getColumnIndex("treatment_type") : -1;
    const subFuelTypeIdx = isFuelEmissionFactor ? getColumnIndex("sub_fuel_type") : -1;

    const previewItems: EcoInventItem[] = data
      .filter((row) => {
        const name = nameIdx >= 0 ? row[nameIdx] : "";
        return name;
      })
      .map((row) => {
        const item: EcoInventItem = {
          [entityConfig.nameField]: nameIdx >= 0 ? row[nameIdx] : "",
          ef_eu_region: euIdx >= 0 ? row[euIdx] : "",
          ef_india_region: indiaIdx >= 0 ? row[indiaIdx] : "",
          ef_global_region: globalIdx >= 0 ? row[globalIdx] : "",
          year: yearIdx >= 0 ? parseInt(row[yearIdx]) || new Date().getFullYear() : new Date().getFullYear(),
          unit: unitIdx >= 0 ? row[unitIdx] : "",
          iso_country_code: isoIdx >= 0 ? row[isoIdx] : "",
        };

        // Add ptt_id for packaging emission factor - try to match by name
        if (isPackagingEmissionFactor && pttIdx >= 0) {
          const treatmentValue = row[pttIdx];
          // Try to find matching treatment type by name
          const matchingType = treatmentTypes.find(
            (t) => t.name.toLowerCase() === treatmentValue?.toLowerCase() || t.id === treatmentValue
          );
          item.ptt_id = matchingType?.id || treatmentValue || "";
        }

        // Add wtt_id for waste material emission factor - try to match by name
        if (isWasteMaterialEmissionFactor && wttIdx >= 0) {
          const wasteTreatmentValue = row[wttIdx];
          // Try to find matching waste treatment type by name
          const matchingWasteType = wasteTreatmentTypes.find(
            (t) => t.name.toLowerCase() === wasteTreatmentValue?.toLowerCase() || t.id === wasteTreatmentValue
          );
          item.wtt_id = matchingWasteType?.id || wasteTreatmentValue || "";
        }

        // Add element_type for materials emission factor
        if (isMaterialsEmissionFactor && elementTypeIdx >= 0) {
          item.element_type = row[elementTypeIdx] || "";
        }

        // Add treatment_type for electricity emission factor
        if (isElectricityEmissionFactor && treatmentTypeIdx >= 0) {
          item.treatment_type = row[treatmentTypeIdx] || "";
        }

        // Add sub_fuel_type for fuel emission factor
        if (isFuelEmissionFactor && subFuelTypeIdx >= 0) {
          item.sub_fuel_type = row[subFuelTypeIdx] || "";
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
      message.error("No valid items to import.");
      return;
    }

    setIsImporting(true);
    try {
      // Convert ptt_id/wtt_id to treatment_type_name for packaging and waste emission factors
      let itemsToImport = importPreview;
      if (isPackagingEmissionFactor) {
        itemsToImport = importPreview.map(item => {
          const selectedType = treatmentTypes.find(t => t.id === item.ptt_id);
          return {
            ...item,
            treatment_type_name: selectedType?.name || item.ptt_id || "",
          };
        });
      } else if (isWasteMaterialEmissionFactor) {
        itemsToImport = importPreview.map(item => {
          const selectedType = wasteTreatmentTypes.find(t => t.id === item.wtt_id);
          return {
            ...item,
            treatment_type_name: selectedType?.name || item.wtt_id || "",
          };
        });
      }

      const result = await bulkAddEcoInventData(currentEntity!, itemsToImport);

      if (result.success) {
        message.success(
          `Successfully imported ${result.addedCount || importPreview.length} items`
        );

        const data = await listEcoInventData(currentEntity!);
        setTabData((prev) => ({ ...prev, [activeTab]: data }));

        setShowImportModal(false);
        setCsvHeaders([]);
        setCsvData([]);
        setColumnMapping({});
        setImportPreview([]);
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

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setCsvHeaders([]);
    setCsvData([]);
    setColumnMapping({});
    setImportPreview([]);
  };

  const getNameValue = (item: EcoInventItem) => {
    if (!entityConfig) return "";
    return item[entityConfig.nameField as keyof EcoInventItem] as string || "";
  };

  if (!currentEntity || !entityConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Configuration
          </h1>
          <p className="text-gray-600 mb-4">
            The requested configuration was not found.
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
                <Leaf className="w-6 h-6 text-white" />
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
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span>Import CSV</span>
              </button>
              {canCreate("eco invent emission factors") && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-green-600/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Tabs */}
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

          {/* Table */}
          <div className="px-6 py-6">
            {isLoading ? (
              <div className="py-16 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-green-50 to-green-100">
                      {isTreatmentType ? (
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Treatment Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-green-800 uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      ) : (isPackagingEmissionFactor || isWasteMaterialEmissionFactor) ? (
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            {entityConfig.displayName}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Treatment Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            EF EU
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            EF India
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            EF Global
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-green-800 uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            {entityConfig.displayName}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            EF EU
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            EF India
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            EF Global
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-green-800 uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentData.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`group hover:bg-gray-50 transition-colors duration-150 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          }`}
                        >
                          {isTreatmentType ? (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.code}
                              </td>
                            </>
                          ) : isPackagingEmissionFactor ? (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {getNameValue(item)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {treatmentTypes.find((t) => t.id === item.ptt_id)?.name || item.ptt_id || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_eu_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_india_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_global_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.year}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.unit}
                              </td>
                            </>
                          ) : isWasteMaterialEmissionFactor ? (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {getNameValue(item)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {wasteTreatmentTypes.find((t) => t.id === item.wtt_id)?.name || item.wtt_id || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_eu_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_india_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_global_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.year}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.unit}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {getNameValue(item)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_eu_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_india_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.ef_global_region}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.year}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.unit}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {canUpdate("eco invent emission factors") && (
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete("eco invent emission factors") && (
                                <button
                                  onClick={() => handleDeleteClick(item)}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {currentData.length === 0 && (
                  <div className="text-center py-12 bg-gray-50">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Leaf className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No emission factors found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Get started by adding your first emission factor.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {isTreatmentType ? "Add Treatment Type" : "Add Emission Factor"}
              </div>
              <div className="text-sm text-gray-500 font-normal">
                {isPackagingTreatmentType
                  ? "Enter the details for the new treatment type"
                  : "Enter the details for the new emission factor"}
              </div>
            </div>
          </div>
        }
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        width={600}
        footer={null}
      >
        <div className="space-y-4 mt-4">
          {isTreatmentType ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Type Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newItem.name || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  placeholder="Enter treatment type name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newItem.code || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, code: e.target.value })
                  }
                  placeholder="e.g., PKS0021"
                />
              </div>
            </>
          ) : (
            <>
              {!isVehicleTypeEmissionFactor && !isMaterialsEmissionFactor && !isElectricityEmissionFactor && !isFuelEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {entityConfig.displayName} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newItem[entityConfig.nameField as keyof EcoInventItem] as string || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, [entityConfig.nameField]: e.target.value })
                    }
                    placeholder={`Enter ${entityConfig.displayName.toLowerCase()}`}
                  />
                </div>
              )}
              {isMaterialsEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Element Name <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select element name"
                    value={newItem[entityConfig.nameField as keyof EcoInventItem] as string || undefined}
                    onChange={(value) => {
                      setNewItem({ ...newItem, [entityConfig.nameField]: value });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {materialsMaterialTypes.map((item) => (
                      <Option key={item.id} value={item.name}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isElectricityEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type of Energy <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select type of energy"
                    value={newItem[entityConfig.nameField as keyof EcoInventItem] as string || undefined}
                    onChange={(value) => {
                      setNewItem({ ...newItem, [entityConfig.nameField]: value });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {energySourceTypes.map((item) => (
                      <Option key={item.id} value={item.name}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isFuelEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select fuel type"
                    value={newItem[entityConfig.nameField as keyof EcoInventItem] as string || undefined}
                    onChange={(value) => {
                      setNewItem({ ...newItem, [entityConfig.nameField]: value });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {fuelSubTypes.map((item) => (
                      <Option key={item.id} value={item.name}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isPackagingEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Treatment Type
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select treatment type"
                    value={newItem.ptt_id || undefined}
                    onChange={(value) => setNewItem({ ...newItem, ptt_id: value })}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {treatmentTypes.map((tt) => (
                      <Option key={tt.id} value={tt.id}>
                        {tt.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isWasteMaterialEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waste Treatment Type
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select waste treatment type"
                    value={newItem.wtt_id || undefined}
                    onChange={(value) => setNewItem({ ...newItem, wtt_id: value })}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {wasteTreatmentTypes.map((tt) => (
                      <Option key={tt.id} value={tt.id}>
                        {tt.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isVehicleTypeEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select vehicle type"
                    value={newItem.vt_id || undefined}
                    onChange={(value) => {
                      const selectedVehicle = vehicleTypes.find((vt) => vt.id === value);
                      setNewItem({
                        ...newItem,
                        vt_id: value,
                        vehicle_type: selectedVehicle?.name || ""
                      });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {vehicleTypes.map((vt) => (
                      <Option key={vt.id} value={vt.id}>
                        {vt.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EF EU Region
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.ef_eu_region || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, ef_eu_region: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EF India Region
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.ef_india_region || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, ef_india_region: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EF Global Region
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.ef_global_region || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, ef_global_region: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <InputNumber
                    className="w-full"
                    value={newItem.year}
                    onChange={(value) =>
                      setNewItem({ ...newItem, year: value || new Date().getFullYear() })
                    }
                    min={2000}
                    max={2100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <Input
                    value={newItem.unit || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    placeholder="e.g., kg CO2e"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISO Country Code
                  </label>
                  <Input
                    value={newItem.iso_country_code || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, iso_country_code: e.target.value })
                    }
                    placeholder="e.g., IN"
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleAddNew}
              className="!bg-green-600 hover:!bg-green-700 !border-green-600"
            >
              {isTreatmentType ? "Add Treatment Type" : "Add Emission Factor"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Edit className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {isTreatmentType ? "Edit Treatment Type" : "Edit Emission Factor"}
              </div>
              <div className="text-sm text-gray-500 font-normal">
                {isPackagingTreatmentType
                  ? "Update the treatment type details"
                  : "Update the emission factor details"}
              </div>
            </div>
          </div>
        }
        open={!!editingItem}
        onCancel={handleCancelEdit}
        width={600}
        footer={null}
      >
        <div className="space-y-4 mt-4">
          {isTreatmentType ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Type Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editItem.name || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editItem.code || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, code: e.target.value })
                  }
                />
              </div>
            </>
          ) : (
            <>
              {!isVehicleTypeEmissionFactor && !isMaterialsEmissionFactor && !isElectricityEmissionFactor && !isFuelEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {entityConfig.displayName} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editItem[entityConfig.nameField as keyof EcoInventItem] as string || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, [entityConfig.nameField]: e.target.value })
                    }
                  />
                </div>
              )}
              {isMaterialsEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Element Name <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select element name"
                    value={editItem[entityConfig.nameField as keyof EcoInventItem] as string || undefined}
                    onChange={(value) => {
                      setEditItem({ ...editItem, [entityConfig.nameField]: value });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {materialsMaterialTypes.map((item) => (
                      <Option key={item.id} value={item.name}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isElectricityEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type of Energy <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select type of energy"
                    value={editItem[entityConfig.nameField as keyof EcoInventItem] as string || undefined}
                    onChange={(value) => {
                      setEditItem({ ...editItem, [entityConfig.nameField]: value });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {energySourceTypes.map((item) => (
                      <Option key={item.id} value={item.name}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isFuelEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select fuel type"
                    value={editItem[entityConfig.nameField as keyof EcoInventItem] as string || undefined}
                    onChange={(value) => {
                      setEditItem({ ...editItem, [entityConfig.nameField]: value });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {fuelSubTypes.map((item) => (
                      <Option key={item.id} value={item.name}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isPackagingEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Treatment Type
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select treatment type"
                    value={editItem.ptt_id || undefined}
                    onChange={(value) => setEditItem({ ...editItem, ptt_id: value })}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {treatmentTypes.map((tt) => (
                      <Option key={tt.id} value={tt.id}>
                        {tt.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isWasteMaterialEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waste Treatment Type
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select waste treatment type"
                    value={editItem.wtt_id || undefined}
                    onChange={(value) => setEditItem({ ...editItem, wtt_id: value })}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {wasteTreatmentTypes.map((tt) => (
                      <Option key={tt.id} value={tt.id}>
                        {tt.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              {isVehicleTypeEmissionFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select vehicle type"
                    value={editItem.vt_id || vehicleTypes.find((vt) => vt.name === editItem.vehicle_type)?.id || undefined}
                    onChange={(value) => {
                      const selectedVehicle = vehicleTypes.find((vt) => vt.id === value);
                      setEditItem({
                        ...editItem,
                        vt_id: value,
                        vehicle_type: selectedVehicle?.name || ""
                      });
                    }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {vehicleTypes.map((vt) => (
                      <Option key={vt.id} value={vt.id}>
                        {vt.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EF EU Region
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editItem.ef_eu_region || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, ef_eu_region: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EF India Region
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editItem.ef_india_region || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, ef_india_region: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EF Global Region
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editItem.ef_global_region || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, ef_global_region: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <InputNumber
                    className="w-full"
                    value={editItem.year}
                    onChange={(value) =>
                      setEditItem({ ...editItem, year: value || new Date().getFullYear() })
                    }
                    min={2000}
                    max={2100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <Input
                    value={editItem.unit || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, unit: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISO Country Code
                  </label>
                  <Input
                    value={editItem.iso_country_code || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, iso_country_code: e.target.value })
                    }
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleCancelEdit}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleSaveEdit}
              className="!bg-green-600 hover:!bg-green-700 !border-green-600"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

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
                    {isTreatmentType ? "Delete Treatment Type" : "Delete Emission Factor"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                {isTreatmentType ? (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Treatment Type:</span>{" "}
                    {itemToDelete.item.name} ({itemToDelete.item.code})
                  </p>
                ) : (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{entityConfig.displayName}:</span>{" "}
                    {getNameValue(itemToDelete.item)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center space-x-2"
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
        width={900}
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
            {isTreatmentType ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Treatment Type Name <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping.name || undefined}
                    onChange={(v) => handleMappingChange("name", v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping.code || undefined}
                    onChange={(v) => handleMappingChange("code", v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {entityConfig.displayName} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping[entityConfig.nameField] || undefined}
                    onChange={(v) => handleMappingChange(entityConfig.nameField, v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
                {isPackagingEmissionFactor && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Treatment Type
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select"
                      value={columnMapping.ptt_id || undefined}
                      onChange={(v) => handleMappingChange("ptt_id", v)}
                      allowClear
                      size="small"
                    >
                      {csvHeaders.map((h) => (
                        <Option key={h} value={h}>
                          {h}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
                {isWasteMaterialEmissionFactor && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Waste Treatment Type
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select"
                      value={columnMapping.wtt_id || undefined}
                      onChange={(v) => handleMappingChange("wtt_id", v)}
                      allowClear
                      size="small"
                    >
                      {csvHeaders.map((h) => (
                        <Option key={h} value={h}>
                          {h}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
                {isMaterialsEmissionFactor && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Element Type
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select"
                      value={columnMapping.element_type || undefined}
                      onChange={(v) => handleMappingChange("element_type", v)}
                      allowClear
                      size="small"
                    >
                      {csvHeaders.map((h) => (
                        <Option key={h} value={h}>
                          {h}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
                {isElectricityEmissionFactor && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Treatment Type
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select"
                      value={columnMapping.treatment_type || undefined}
                      onChange={(v) => handleMappingChange("treatment_type", v)}
                      allowClear
                      size="small"
                    >
                      {csvHeaders.map((h) => (
                        <Option key={h} value={h}>
                          {h}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
                {isFuelEmissionFactor && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Sub Fuel Type
                    </label>
                    <Select
                      className="w-full"
                      placeholder="Select"
                      value={columnMapping.sub_fuel_type || undefined}
                      onChange={(v) => handleMappingChange("sub_fuel_type", v)}
                      allowClear
                      size="small"
                    >
                      {csvHeaders.map((h) => (
                        <Option key={h} value={h}>
                          {h}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    EF EU Region
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping.ef_eu_region || undefined}
                    onChange={(v) => handleMappingChange("ef_eu_region", v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    EF India Region
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping.ef_india_region || undefined}
                    onChange={(v) => handleMappingChange("ef_india_region", v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    EF Global Region
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping.ef_global_region || undefined}
                    onChange={(v) => handleMappingChange("ef_global_region", v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Year
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping.year || undefined}
                    onChange={(v) => handleMappingChange("year", v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Unit
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping.unit || undefined}
                    onChange={(v) => handleMappingChange("unit", v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ISO Country Code
                  </label>
                  <Select
                    className="w-full"
                    placeholder="Select"
                    value={columnMapping.iso_country_code || undefined}
                    onChange={(v) => handleMappingChange("iso_country_code", v)}
                    allowClear
                    size="small"
                  >
                    {csvHeaders.map((h) => (
                      <Option key={h} value={h}>
                        {h}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
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
                    {isPackagingTreatmentType
                      ? "Please map at least the Treatment Type Name column"
                      : `Please map at least the ${entityConfig.displayName} column`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <Table
                  dataSource={importPreview.slice(0, 5)}
                  columns={
                    isTreatmentType
                      ? [
                          { title: "Treatment Type", dataIndex: "name", key: "name" },
                          { title: "Code", dataIndex: "code", key: "code" },
                        ]
                      : isPackagingEmissionFactor
                      ? [
                          { title: entityConfig.displayName, dataIndex: entityConfig.nameField, key: "name" },
                          {
                            title: "Treatment Type",
                            dataIndex: "ptt_id",
                            key: "ptt_id",
                            render: (value: string) => {
                              const tt = treatmentTypes.find((t) => t.id === value);
                              return tt?.name || value || "-";
                            },
                          },
                          { title: "EF EU", dataIndex: "ef_eu_region", key: "eu" },
                          { title: "EF India", dataIndex: "ef_india_region", key: "india" },
                          { title: "EF Global", dataIndex: "ef_global_region", key: "global" },
                          { title: "Year", dataIndex: "year", key: "year" },
                          { title: "Unit", dataIndex: "unit", key: "unit" },
                        ]
                      : isWasteMaterialEmissionFactor
                      ? [
                          { title: entityConfig.displayName, dataIndex: entityConfig.nameField, key: "name" },
                          {
                            title: "Waste Treatment Type",
                            dataIndex: "wtt_id",
                            key: "wtt_id",
                            render: (value: string) => {
                              const wtt = wasteTreatmentTypes.find((t) => t.id === value);
                              return wtt?.name || value || "-";
                            },
                          },
                          { title: "EF EU", dataIndex: "ef_eu_region", key: "eu" },
                          { title: "EF India", dataIndex: "ef_india_region", key: "india" },
                          { title: "EF Global", dataIndex: "ef_global_region", key: "global" },
                          { title: "Year", dataIndex: "year", key: "year" },
                          { title: "Unit", dataIndex: "unit", key: "unit" },
                        ]
                      : isMaterialsEmissionFactor
                      ? [
                          { title: entityConfig.displayName, dataIndex: entityConfig.nameField, key: "name" },
                          { title: "Element Type", dataIndex: "element_type", key: "element_type" },
                          { title: "EF EU", dataIndex: "ef_eu_region", key: "eu" },
                          { title: "EF India", dataIndex: "ef_india_region", key: "india" },
                          { title: "EF Global", dataIndex: "ef_global_region", key: "global" },
                          { title: "Year", dataIndex: "year", key: "year" },
                          { title: "Unit", dataIndex: "unit", key: "unit" },
                        ]
                      : isElectricityEmissionFactor
                      ? [
                          { title: entityConfig.displayName, dataIndex: entityConfig.nameField, key: "name" },
                          { title: "Treatment Type", dataIndex: "treatment_type", key: "treatment_type" },
                          { title: "EF EU", dataIndex: "ef_eu_region", key: "eu" },
                          { title: "EF India", dataIndex: "ef_india_region", key: "india" },
                          { title: "EF Global", dataIndex: "ef_global_region", key: "global" },
                          { title: "Year", dataIndex: "year", key: "year" },
                          { title: "Unit", dataIndex: "unit", key: "unit" },
                        ]
                      : isFuelEmissionFactor
                      ? [
                          { title: entityConfig.displayName, dataIndex: entityConfig.nameField, key: "name" },
                          { title: "Sub Fuel Type", dataIndex: "sub_fuel_type", key: "sub_fuel_type" },
                          { title: "EF EU", dataIndex: "ef_eu_region", key: "eu" },
                          { title: "EF India", dataIndex: "ef_india_region", key: "india" },
                          { title: "EF Global", dataIndex: "ef_global_region", key: "global" },
                          { title: "Year", dataIndex: "year", key: "year" },
                          { title: "Unit", dataIndex: "unit", key: "unit" },
                        ]
                      : [
                          { title: entityConfig.displayName, dataIndex: entityConfig.nameField, key: "name" },
                          { title: "EF EU", dataIndex: "ef_eu_region", key: "eu" },
                          { title: "EF India", dataIndex: "ef_india_region", key: "india" },
                          { title: "EF Global", dataIndex: "ef_global_region", key: "global" },
                          { title: "Year", dataIndex: "year", key: "year" },
                          { title: "Unit", dataIndex: "unit", key: "unit" },
                        ]
                  }
                  pagination={false}
                  size="small"
                  rowKey={(_, index) => `preview-${index}`}
                />
                {importPreview.length > 5 && (
                  <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-500 border-t">
                    Showing 5 of {importPreview.length} items
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

export default EcoInventSetupTabs;
