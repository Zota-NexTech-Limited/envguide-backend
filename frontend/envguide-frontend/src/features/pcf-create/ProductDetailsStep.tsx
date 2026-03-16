import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Modal,
  Upload,
  message,
  Table,
} from "antd";
import type { UploadProps } from "antd";
import {
  Package,
  Layers,
  Settings,
  Factory,
  Code,
  GitBranch,
  Plus,
  Trash2,
  Upload as UploadIcon,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  Beaker,
  ClipboardList,
  Save,
} from "lucide-react";
import { listSetup, type SetupItem } from "../../lib/dataSetupService";
import productService, { type ProductDropdownItem } from "../../lib/productService";
import BomTable from "./BomTable";

interface ProductDetailsStepProps {
  initialValues: any;
  onSave: (values: any) => void;
  onBack?: () => void;
  onSaveAsDraft?: (values: any) => void;
  onFormChange?: (values: any) => void;
}

const { Option } = Select;

const ProductDetailsStep: React.FC<ProductDetailsStepProps> = ({
  initialValues,
  onSave,
  onBack,
  onSaveAsDraft,
  onFormChange,
}) => {
  const [form] = Form.useForm();
  const [isBomModalVisible, setIsBomModalVisible] = useState(false);
  const [isMappingModalVisible, setIsMappingModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [pendingBomData, setPendingBomData] = useState<any[]>([]);
  const [bomData, setBomData] = useState<any[]>(initialValues.bomData || []);
  const [productCategories, setProductCategories] = useState<SetupItem[]>([]);
  const [componentCategories, setComponentCategories] = useState<SetupItem[]>([]);
  const [componentTypes, setComponentTypes] = useState<SetupItem[]>([]);
  const [manufacturers, setManufacturers] = useState<SetupItem[]>([]);
  const [products, setProducts] = useState<ProductDropdownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawCsvData, setRawCsvData] = useState<string>("");
  const [productCodeSelected, setProductCodeSelected] = useState<boolean>(Boolean(initialValues.productCode));

  const fieldDefinitions = [
    { key: "materialNumber", label: "Material Number / MPN", required: false },
    { key: "componentName", label: "Component Name", required: true },
    { key: "quantity", label: "Quantity", required: false },
    { key: "productionLocation", label: "Production Location", required: false },
    { key: "manufacturer", label: "Manufacturer", required: false },
    { key: "detailedDescription", label: "Detailed Description", required: false },
    { key: "weight", label: "Weight (gms) /unit", required: false },
    { key: "totalWeight", label: "Total Weight (gms)", required: false },
    { key: "category", label: "Component Category", required: false },
    { key: "price", label: "Price", required: false },
    { key: "totalPrice", label: "Total Price", required: false },
    { key: "supplierEmail", label: "supplier_email", required: false },
    { key: "supplierName", label: "supplier_name", required: false },
    { key: "supplierNumber", label: "supplier_number", required: false },
  ];

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        setLoading(true);
        const [productCats, componentCats, compTypes, mfrs, productsRes] = await Promise.all([
          listSetup("product-category"),
          listSetup("component-category"),
          listSetup("component-type"),
          listSetup("manufacturer"),
          productService.getProductDropdown(),
        ]);
        setProductCategories(productCats);
        setComponentCategories(componentCats);
        setComponentTypes(compTypes);
        setManufacturers(mfrs);
        setProducts(productsRes.data || []);
      } catch (error) {
        console.error("Error loading dropdowns:", error);
        message.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      if (initialValues.bomData) {
        setBomData(initialValues.bomData);
      }
    }
  }, [initialValues, form]);

  const handleSave = () => {
    // Validate BOM data first
    if (!bomData || bomData.length === 0) {
      message.error("Please import a BOM file with at least one component before proceeding");
      return;
    }

    form.validateFields().then((values) => {
      // Look up names for the selected category/type IDs
      const productCategoryName = productCategories.find(c => (c.id || c.code) === values.productCategory)?.name || values.productCategory;
      const componentCategoryName = componentCategories.find(c => (c.id || c.code) === values.componentCategory)?.name || values.componentCategory;
      const componentTypeName = componentTypes.find(t => (t.id || t.code) === values.componentType)?.name || values.componentType;

      onSave({
        ...values,
        bomData,
        productCategoryName,
        componentCategoryName,
        componentTypeName,
      });
    });
  };

  const handleSaveAsDraft = () => {
    // Get current form values without validation for draft
    const values = form.getFieldsValue();
    // Look up names for the selected category/type IDs
    const productCategoryName = productCategories.find(c => (c.id || c.code) === values.productCategory)?.name || values.productCategory;
    const componentCategoryName = componentCategories.find(c => (c.id || c.code) === values.componentCategory)?.name || values.componentCategory;
    const componentTypeName = componentTypes.find(t => (t.id || t.code) === values.componentType)?.name || values.componentType;

    onSaveAsDraft?.({
      ...values,
      bomData,
      productCategoryName,
      componentCategoryName,
      componentTypeName,
    });
  };

  const autoDetectMapping = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const usedHeaders = new Set<string>();

    // Process fields in order of specificity (longer keys first)
    // This ensures "totalPrice" finds its match before "price" can claim it
    const sortedFields = [...fieldDefinitions].sort(
      (a, b) => b.key.length - a.key.length
    );

    // For each field, find the best matching header
    sortedFields.forEach((field) => {
      const fieldKeyLower = field.key.toLowerCase();
      const fieldLabelLower = field.label.toLowerCase();
      const fieldLabelNormalized = fieldLabelLower.replace(/[\s_-]/g, "");

      let bestMatch: string | null = null;
      let bestMatchScore = 0; // Higher is better: 3 = exact, 2 = normalized exact, 1 = partial

      headers.forEach((header) => {
        if (usedHeaders.has(header)) return; // Skip already used headers

        const headerLower = header.toLowerCase().trim();
        const headerNormalized = headerLower.replace(/[\s_-]/g, "");

        // Score 3: Exact match on original strings
        if (headerLower === fieldLabelLower || headerLower === fieldKeyLower) {
          if (bestMatchScore < 3) {
            bestMatch = header;
            bestMatchScore = 3;
          }
          return;
        }

        // Score 2: Exact match on normalized strings (handles "Total Price" -> "totalprice" -> "totalPrice")
        if (headerNormalized === fieldKeyLower || headerNormalized === fieldLabelNormalized) {
          if (bestMatchScore < 2) {
            bestMatch = header;
            bestMatchScore = 2;
          }
          return;
        }

        // Score 1: Header contains the field key as a word boundary match
        // Only for shorter field keys, and only if header is substantially longer
        // This prevents "price" from matching "total price" but allows "unit price" to match "price" if needed
        // Actually, let's skip partial matching to avoid confusion - exact/normalized matches are sufficient
      });

      if (bestMatch) {
        mapping[field.key] = bestMatch;
        usedHeaders.add(bestMatch);
      }
    });

    return mapping;
  };

  const parseCSV = (text: string, mapping: Record<string, string>): any[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

    const getColumnIndex = (fieldKey: string): number => {
      const mappedHeader = mapping[fieldKey];
      if (!mappedHeader) return -1;
      return headers.findIndex((h) => h === mappedHeader);
    };

    const componentNameIdx = getColumnIndex("componentName");
    if (componentNameIdx === -1) {
      throw new Error('CSV file must have "Component Name" column mapped');
    }

    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      while (values.length < headers.length) {
        values.push("");
      }

      const componentName = values[componentNameIdx]?.replace(/^"|"$/g, "") || "";
      if (!componentName) continue;

      const getValue = (fieldKey: string): string => {
        const idx = getColumnIndex(fieldKey);
        return idx !== -1 ? values[idx]?.replace(/^"|"$/g, "") || "" : "";
      };

      const weightGrams = parseFloat(getValue("weight") || "0");
      const totalWeightGrams = parseFloat(getValue("totalWeight") || weightGrams.toString());
      const price = parseFloat(getValue("price") || "0");
      const totalPrice = parseFloat(getValue("totalPrice") || price.toString());

      data.push({
        key: `bom-${i}-${Date.now()}`,
        materialNumber: getValue("materialNumber"),
        componentName: componentName,
        quantity: getValue("quantity") || "1",
        productionLocation: getValue("productionLocation"),
        manufacturer: getValue("manufacturer"),
        detailedDescription: getValue("detailedDescription"),
        weight: weightGrams.toFixed(2),
        totalWeight: totalWeightGrams.toFixed(2),
        category: getValue("category"),
        price: price.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        supplierEmail: getValue("supplierEmail"),
        supplierName: getValue("supplierName"),
        supplierNumber: getValue("supplierNumber"),
        emission: "",
        questionerStatus: "Pending",
      });
    }

    return data;
  };

  const handleFileUpload = (file: File) => {
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");

    if (!isCSV) {
      message.warning("Please use CSV format for now.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          message.error("File is empty");
          return;
        }

        const lines = text.split("\n").filter((line) => line.trim());
        if (lines.length < 2) {
          message.error("CSV file must have at least a header and one data row");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const autoMapping = autoDetectMapping(headers);

        setRawCsvData(text);
        setCsvHeaders(headers);
        setColumnMapping(autoMapping);
        setIsBomModalVisible(false);
        setIsMappingModalVisible(true);
      } catch (error: any) {
        message.error(`Failed to read file: ${error.message || "Invalid file format"}`);
      }
    };

    reader.onerror = () => {
      message.error("Failed to read file");
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleMappingConfirm = () => {
    try {
      if (!columnMapping.componentName) {
        message.error("Please map 'Component Name' field (required)");
        return;
      }

      const parsedData = parseCSV(rawCsvData, columnMapping);

      if (parsedData.length === 0) {
        message.warning("No valid data found in the CSV file");
        return;
      }

      setPendingBomData(parsedData);
      setIsMappingModalVisible(false);
      setIsReviewModalVisible(true);
    } catch (error: any) {
      message.error(`Failed to parse CSV: ${error.message || "Invalid file format"}`);
    }
  };

  const handleConfirmImport = () => {
    setBomData(pendingBomData);
    setPendingBomData([]);
    setIsReviewModalVisible(false);
    message.success(`${pendingBomData.length} components imported successfully`);
  };

  return (
    <div className="space-y-6">
      {/* Product Details Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Product Details</h3>
              <p className="text-sm text-gray-500">Define product category and specifications</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Form form={form} layout="vertical" initialValues={initialValues}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Form.Item
                  label={<span className="text-sm font-medium text-gray-700">Product Category *</span>}
                  name="productCategory"
                  rules={[{ required: true, message: "Select Product Category" }]}
                >
                  <Select
                    placeholder="Select Product Category"
                    size="large"
                    loading={loading}
                    showSearch
                    suffixIcon={<Layers className="w-4 h-4 text-gray-400" />}
                    filterOption={(input, option) => {
                      const label = typeof option?.label === "string" ? option.label : String(option?.children || "");
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                  >
                    {productCategories.map((cat) => (
                      <Option key={cat.id || cat.code} value={cat.id || cat.code}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div>
                <Form.Item
                  label={<span className="text-sm font-medium text-gray-700">Component Category *</span>}
                  name="componentCategory"
                  rules={[{ required: true, message: "Select Component Category" }]}
                >
                  <Select
                    placeholder="Select Component Category"
                    size="large"
                    loading={loading}
                    showSearch
                    suffixIcon={<Settings className="w-4 h-4 text-gray-400" />}
                    filterOption={(input, option) => {
                      const label = typeof option?.label === "string" ? option.label : String(option?.children || "");
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                  >
                    {componentCategories.map((cat) => (
                      <Option key={cat.id || cat.code} value={cat.id || cat.code}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div>
                <Form.Item
                  label={<span className="text-sm font-medium text-gray-700">Component Type *</span>}
                  name="componentType"
                  rules={[{ required: true, message: "Enter Component Type" }]}
                >
                  <Select
                    placeholder="Select Component Type"
                    size="large"
                    loading={loading}
                    showSearch
                    suffixIcon={<Settings className="w-4 h-4 text-gray-400" />}
                    filterOption={(input, option) => {
                      const label = typeof option?.label === "string" ? option.label : String(option?.children || "");
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                  >
                    {componentTypes.map((type) => (
                      <Option key={type.id || type.code} value={type.id || type.code}>
                        {type.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div>
                <Form.Item
                  label={<span className="text-sm font-medium text-gray-700">Product Code *</span>}
                  name="productCode"
                  rules={[{ required: true, message: "Select Product Code" }]}
                >
                  <Select
                    placeholder="Select Product Code"
                    size="large"
                    loading={loading}
                    showSearch
                    suffixIcon={<Code className="w-4 h-4 text-gray-400" />}
                    filterOption={(input, option) => {
                      const label = typeof option?.label === "string" ? option.label : String(option?.children || "");
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                    onChange={(value) => {
                      setProductCodeSelected(Boolean(value));
                      onFormChange?.({ productCode: value });
                    }}
                  >
                    {products.map((product) => (
                      <Option key={product.id} value={product.product_code}>
                        {product.product_code} - {product.product_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div>
                <Form.Item
                  label={<span className="text-sm font-medium text-gray-700">Manufacturer</span>}
                  name="manufacture"
                >
                  <Select
                    placeholder="Select Manufacturer"
                    size="large"
                    loading={loading}
                    showSearch
                    suffixIcon={<Factory className="w-4 h-4 text-gray-400" />}
                    filterOption={(input, option) => {
                      const label = typeof option?.label === "string" ? option.label : String(option?.children || "");
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                  >
                    {manufacturers.map((mfr) => (
                      <Option key={mfr.id || mfr.code} value={mfr.id || mfr.code}>
                        {mfr.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div>
                <Form.Item
                  label={<span className="text-sm font-medium text-gray-700">Model/Version</span>}
                  name="modelVersion"
                >
                  <Input
                    placeholder="Enter model or version"
                    size="large"
                    prefix={<GitBranch className="w-4 h-4 text-gray-400 mr-2" />}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Beaker className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Product Specifications</h4>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-1/3">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-1/3">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-1/4">Unit</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <Form.List name="specifications">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center">
                                <div className="flex flex-col items-center">
                                  <Beaker className="w-10 h-10 text-gray-300 mb-2" />
                                  <p className="text-gray-500 text-sm mb-3">No specifications added</p>
                                  <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    icon={<Plus className="w-4 h-4" />}
                                    className="!border-green-400 !text-green-600"
                                  >
                                    Add Specification
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {fields.map(({ key, name, ...restField }, index) => (
                            <tr key={key} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} group`}>
                              <td className="px-4 py-2">
                                <Form.Item {...restField} name={[name, "name"]} rules={[{ required: true, message: "" }]} className="!mb-0">
                                  <Input placeholder="e.g. Voltage" className="!border-0 !bg-transparent" />
                                </Form.Item>
                              </td>
                              <td className="px-4 py-2">
                                <Form.Item {...restField} name={[name, "value"]} rules={[{ required: true, message: "" }]} className="!mb-0">
                                  <Input placeholder="e.g. 220" className="!border-0 !bg-transparent" />
                                </Form.Item>
                              </td>
                              <td className="px-4 py-2">
                                <Form.Item {...restField} name={[name, "unit"]} className="!mb-0">
                                  <Input placeholder="e.g. V" className="!border-0 !bg-transparent" />
                                </Form.Item>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => remove(name)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {fields.length > 0 && (
                            <tr className="border-t border-dashed border-gray-300">
                              <td colSpan={4} className="px-4 py-2">
                                <Button
                                  type="dashed"
                                  onClick={() => add()}
                                  icon={<Plus className="w-4 h-4" />}
                                  block
                                  className="!border-gray-300 !text-gray-500"
                                >
                                  Add Another
                                </Button>
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </Form.List>
                  </tbody>
                </table>
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* BOM Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Bill of Materials</h3>
                <p className="text-sm text-gray-500">{bomData.length} components added</p>
              </div>
            </div>
            <Button
              onClick={() => setIsBomModalVisible(true)}
              className="!border-green-400 !text-green-600 hover:!bg-green-50"
              icon={<UploadIcon className="w-4 h-4" />}
            >
              Import BOM
            </Button>
          </div>
        </div>

        <div className="p-6">
          <BomTable bomData={bomData} />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Required Fields</p>
                <p className="text-sm font-semibold text-gray-900">4 required</p>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bomData.length > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <ClipboardList className={`w-4 h-4 ${bomData.length > 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">BOM Items</p>
                <p className={`text-sm font-semibold ${bomData.length > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {bomData.length > 0 ? `${bomData.length} components` : 'Required *'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                size="large"
                onClick={onBack}
                icon={<ArrowLeft className="w-4 h-4" />}
                className="!border-gray-300"
              >
                Back
              </Button>
            )}
            {onSaveAsDraft && productCodeSelected && (
              <Button
                size="large"
                onClick={handleSaveAsDraft}
                icon={<Save className="w-4 h-4" />}
              >
                Save as Draft
              </Button>
            )}
            <Button
              type="primary"
              size="large"
              onClick={handleSave}
              disabled={bomData.length === 0}
              className={bomData.length === 0
                ? "!bg-gray-300 !border-gray-300 !text-gray-500 cursor-not-allowed"
                : "!bg-green-600 hover:!bg-green-700 !border-green-600 shadow-lg shadow-green-600/20"
              }
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="end"
            >
              Save & Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Import BOM Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
            </div>
            <span>Import BOM from CSV</span>
          </div>
        }
        open={isBomModalVisible}
        onCancel={() => setIsBomModalVisible(false)}
        footer={null}
        width={500}
      >
        <div className="py-6">
          <Upload.Dragger
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file) => {
              if (file instanceof File) {
                handleFileUpload(file);
              }
              return false;
            }}
            className="!border-2 !border-dashed !border-gray-200 !rounded-xl hover:!border-green-400 !bg-gray-50/50"
          >
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-base font-medium text-gray-700 mb-1">
                Drop your CSV file here or <span className="text-green-600">browse</span>
              </p>
              <p className="text-sm text-gray-400">
                CSV files with component data
              </p>
            </div>
          </Upload.Dragger>
        </div>
      </Modal>

      {/* Column Mapping Modal */}
      <Modal
        title="Map CSV Columns"
        open={isMappingModalVisible}
        onCancel={() => {
          setIsMappingModalVisible(false);
          setRawCsvData("");
          setCsvHeaders([]);
          setColumnMapping({});
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsMappingModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleMappingConfirm}
            className="!bg-green-600 !border-green-600"
          >
            Continue to Review
          </Button>,
        ]}
        width={900}
      >
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            Map your CSV columns to the corresponding data fields. Fields marked with * are required.
          </p>
          <Table
            dataSource={fieldDefinitions}
            columns={[
              {
                title: "Data Field",
                dataIndex: "label",
                key: "label",
                width: 200,
                render: (label: string, record: any) => (
                  <span>
                    {label}
                    {record.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                ),
              },
              {
                title: "CSV Column",
                key: "mapping",
                width: 300,
                render: (_, record: any) => (
                  <Select
                    value={columnMapping[record.key] || undefined}
                    placeholder="Select CSV column"
                    onChange={(value) => {
                      setColumnMapping({ ...columnMapping, [record.key]: value });
                    }}
                    style={{ width: "100%" }}
                    showSearch
                    allowClear
                  >
                    {csvHeaders.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                ),
              },
            ]}
            pagination={false}
            rowKey="key"
            size="small"
          />
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        title="Review Import Data"
        open={isReviewModalVisible}
        onCancel={() => {
          setIsReviewModalVisible(false);
          setPendingBomData([]);
        }}
        footer={[
          <Button key="back" onClick={() => { setIsReviewModalVisible(false); setIsMappingModalVisible(true); }}>
            Back to Mapping
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmImport}
            className="!bg-green-600 !border-green-600"
          >
            Confirm Import ({pendingBomData.length} items)
          </Button>,
        ]}
        width={1400}
      >
        <p className="text-gray-600 mb-4">
          Review the imported data. <strong>{pendingBomData.length}</strong> components found.
        </p>
        <Table
          dataSource={pendingBomData}
          columns={[
            { title: "Component Name", dataIndex: "componentName", key: "componentName", width: 150, fixed: "left" },
            { title: "Material Number", dataIndex: "materialNumber", key: "materialNumber", width: 120 },
            { title: "Quantity", dataIndex: "quantity", key: "quantity", width: 80 },
            { title: "Manufacturer", dataIndex: "manufacturer", key: "manufacturer", width: 120 },
            { title: "Weight (g)", dataIndex: "weight", key: "weight", width: 100 },
            { title: "Category", dataIndex: "category", key: "category", width: 120 },
            { title: "Price", dataIndex: "price", key: "price", width: 100, render: (price) => `₹${price || "0.00"}` },
            { title: "Supplier Email", dataIndex: "supplierEmail", key: "supplierEmail", width: 150 },
          ]}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1200, y: 400 }}
          rowKey="key"
          size="small"
        />
      </Modal>
    </div>
  );
};

export default ProductDetailsStep;
