import React, { useState, useEffect } from "react";
import { Upload, Button, message } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { UploadOutlined, DeleteOutlined, FileOutlined } from "@ant-design/icons";
import type { SupplierQuestionnaireData } from "../../lib/supplierQuestionnaireService";
import supplierQuestionnaireService from "../../lib/supplierQuestionnaireService";
import { QUESTIONNAIRE_OPTIONS } from "../../config/questionnaireConfig";

interface ProductDetailsProps {
  data: SupplierQuestionnaireData["product_details"];
  updateData: (data: Partial<SupplierQuestionnaireData["product_details"]>) => void;
}

// Helper to extract filename from file key
const getFileNameFromKey = (key: string): string => {
  if (!key) return 'File';
  const parts = key.split('/');
  const fileName = parts[parts.length - 1];
  // Remove the prefix (IMG-timestamp-uuid-)
  const match = fileName.match(/^[A-Z]+-\d+-[a-f0-9-]+-(.+)$/);
  return match ? match[1] : fileName;
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ data, updateData }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [methodologyInput, setMethodologyInput] = useState("");

  // Sync uploadedFiles state when data.pcf_report_file changes (e.g., from localStorage draft)
  useEffect(() => {
    const files = (data.pcf_report_file || []).map((key: string, index: number) => ({
      uid: `pcf-${index}-${key}`,
      name: getFileNameFromKey(key),
      status: "done" as const,
      url: key,
    }));
    setUploadedFiles(files);
  }, [data.pcf_report_file]);

  const handleChange = (field: keyof SupplierQuestionnaireData["product_details"], value: any) => {
    updateData({ ...data, [field]: value });
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await supplierQuestionnaireService.uploadSupplierFile(file);
      if (result.success && result.key) {
        const newFile: UploadFile = {
          uid: `pcf-${Date.now()}`,
          name: file.name,
          status: "done",
          url: result.key,
        };
        const newFiles = [...uploadedFiles, newFile];
        setUploadedFiles(newFiles);
        // Store file keys in data
        updateData({
          ...data,
          pcf_report_file: newFiles.map((f) => f.url as string),
        });
        message.success(`${file.name} uploaded successfully`);
      } else {
        message.error(result.message || "Upload failed");
      }
    } catch (error) {
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (file: UploadFile) => {
    const newFiles = uploadedFiles.filter((f) => f.uid !== file.uid);
    setUploadedFiles(newFiles);
    updateData({
      ...data,
      pcf_report_file: newFiles.map((f) => f.url as string),
    });
  };

  // Production Site Details Helpers
  const handleSiteChange = (index: number, field: string, value: any) => {
    const newSites = [...(data.production_site_details || [])];
    if (!newSites[index]) {
        newSites[index] = { product_name: "", location: "" };
    }
    (newSites[index] as any)[field] = value;
    updateData({ ...data, production_site_details: newSites });
  };

  const addSiteRow = () => {
    const newSites = [...(data.production_site_details || []), { product_name: "", location: "" }];
    updateData({ ...data, production_site_details: newSites });
  };

  const removeSiteRow = (index: number) => {
    const newSites = [...(data.production_site_details || [])];
    newSites.splice(index, 1);
    updateData({ ...data, production_site_details: newSites });
  };

  // Products Manufactured Helpers
  const handleProductChange = (index: number, field: string, value: any) => {
    const newProducts = [...(data.products_manufactured || [])];
    if (!newProducts[index]) {
        newProducts[index] = { product_name: "", production_period: "", weight_per_unit: 0, unit: "", price: 0, quantity: 0 };
    }
    (newProducts[index] as any)[field] = value;
    updateData({ ...data, products_manufactured: newProducts });
  };

  const addProductRow = () => {
    const newProducts = [...(data.products_manufactured || []), { product_name: "", production_period: "", weight_per_unit: 0, unit: "", price: 0, quantity: 0 }];
    updateData({ ...data, products_manufactured: newProducts });
  };

  const removeProductRow = (index: number) => {
    const newProducts = [...(data.products_manufactured || [])];
    newProducts.splice(index, 1);
    updateData({ ...data, products_manufactured: newProducts });
  };

  // PCF Methodology Helpers
  const handleAddMethodology = () => {
    const trimmed = methodologyInput.trim();
    if (trimmed) {
      const currentMethods = Array.isArray(data.pcf_methodology) ? data.pcf_methodology : [];
      if (!currentMethods.includes(trimmed)) {
        handleChange("pcf_methodology", [...currentMethods, trimmed]);
      }
      setMethodologyInput("");
    }
  };

  const handleRemoveMethodology = (methodToRemove: string) => {
    const currentMethods = Array.isArray(data.pcf_methodology) ? data.pcf_methodology : [];
    handleChange("pcf_methodology", currentMethods.filter((m) => m !== methodToRemove));
  };

  const handleMethodologyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMethodology();
    }
  };

  // Impact Methods Helper
  const handleImpactMethodChange = (method: string, checked: boolean) => {
    const currentMethods = data.required_environmental_impact_methods || [];
    let newMethods;
    if (checked) {
      newMethods = [...currentMethods, method];
    } else {
      newMethods = currentMethods.filter((m) => m !== method);
    }
    updateData({ ...data, required_environmental_impact_methods: newMethods });
  };

  return (
    <div className="space-y-8">
      {/* Existing PCF Report */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Existing PCF Report</h3>
        
        <div className="flex items-start mb-4">
          <div className="flex items-center h-5">
            <input
              id="existing_pcf_report"
              name="existing_pcf_report"
              type="checkbox"
              checked={data.existing_pcf_report}
              onChange={(e) => handleChange("existing_pcf_report", e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="existing_pcf_report" className="font-medium text-gray-700">
              Do you have an existing PCF Report (within last 12 months)?
            </label>
          </div>
        </div>

        {data.existing_pcf_report && (
          <div className="space-y-4">
            <div>
              <label htmlFor="pcf_methodology" className="block text-sm font-medium text-gray-700">
                PCF Methodology Used
              </label>
              <div className="mt-1">
                {/* Pills display */}
                {Array.isArray(data.pcf_methodology) && data.pcf_methodology.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {data.pcf_methodology.map((method, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                      >
                        {method}
                        <button
                          type="button"
                          onClick={() => handleRemoveMethodology(method)}
                          className="ml-1 hover:text-indigo-600 focus:outline-none"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Input field */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="pcf_methodology"
                    id="pcf_methodology"
                    value={methodologyInput}
                    onChange={(e) => setMethodologyInput(e.target.value)}
                    onKeyDown={handleMethodologyKeyDown}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Type methodology and press Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddMethodology}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">e.g., ISO 14067, GHG Protocol</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload PCF Report</label>
              <Upload.Dragger
                customRequest={({ file }) => handleFileUpload(file as File)}
                showUploadList={false}
                accept=".pdf,.doc,.docx"
                disabled={uploading}
                className="!border-2 !border-dashed !border-gray-300 !rounded-md hover:!border-green-400"
              >
                <div className="py-4">
                  <UploadOutlined className="text-3xl text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="text-green-600 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC up to 10MB</p>
                </div>
              </Upload.Dragger>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.uid}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileOutlined className="text-green-600" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveFile(file)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Production Site Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Production Site Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component / Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.production_site_details?.map((site, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={site.product_name}
                      onChange={(e) => handleSiteChange(index, "product_name", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={site.location}
                      onChange={(e) => handleSiteChange(index, "location", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeSiteRow(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addSiteRow}
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Site
          </button>
        </div>
      </div>

      {/* Required Environmental Impact Methods */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Environmental Impact Methods</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUESTIONNAIRE_OPTIONS.REQUIRED_ENVIRONMENTAL_IMPACT_METHODS.map((method) => (
            <div key={method} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={`impact_method_${method}`}
                  name={`impact_method_${method}`}
                  type="checkbox"
                  checked={data.required_environmental_impact_methods?.includes(method)}
                  onChange={(e) => handleImpactMethodChange(method, e.target.checked)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={`impact_method_${method}`} className="font-medium text-gray-700">
                  {method}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products / Components Manufactured */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Products / Components Manufactured</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product / Component</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight per Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.products_manufactured?.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={product.product_name}
                      onChange={(e) => handleProductChange(index, "product_name", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={product.production_period}
                      onChange={(e) => handleProductChange(index, "production_period", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                        <option value="">Select</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Annual">Annual</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={product.weight_per_unit}
                      onChange={(e) => handleProductChange(index, "weight_per_unit", parseFloat(e.target.value))}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={product.unit}
                      onChange={(e) => handleProductChange(index, "unit", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                        <option value="">Select</option>
                        <option value="kg">kg</option>
                        <option value="tons">tons</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => handleProductChange(index, "price", parseFloat(e.target.value))}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, "quantity", parseFloat(e.target.value))}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeProductRow(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addProductRow}
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
