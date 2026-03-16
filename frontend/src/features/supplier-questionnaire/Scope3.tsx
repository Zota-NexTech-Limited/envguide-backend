import React from "react";
import type { SupplierQuestionnaireData } from "../../lib/supplierQuestionnaireService";
import { QUESTIONNAIRE_OPTIONS } from "../../config/questionnaireConfig";

interface Scope3Props {
  data: SupplierQuestionnaireData["scope_3"];
  updateData: (data: Partial<SupplierQuestionnaireData["scope_3"]>) => void;
}

const Scope3: React.FC<Scope3Props> = ({ data, updateData }) => {
  // Materials Helpers
  const handleMaterialsChange = (field: string, value: any) => {
    updateData({ ...data, materials: { ...data.materials, [field]: value } });
  };

  const handleRawMaterialChange = (index: number, field: string, value: any) => {
    const newRaw = [...(data.materials.raw_materials || [])];
    if (!newRaw[index]) {
        newRaw[index] = { material: "", composition_percent: 0 };
    }
    (newRaw[index] as any)[field] = value;
    handleMaterialsChange("raw_materials", newRaw);
  };

  const addRawMaterialRow = () => {
    const newRaw = [...(data.materials.raw_materials || []), { material: "", composition_percent: 0 }];
    handleMaterialsChange("raw_materials", newRaw);
  };

  const removeRawMaterialRow = (index: number) => {
    const newRaw = [...(data.materials.raw_materials || [])];
    newRaw.splice(index, 1);
    handleMaterialsChange("raw_materials", newRaw);
  };

  // Packaging Helpers
  const handlePackagingChange = (field: string, value: any) => {
    updateData({ ...data, packaging: { ...data.packaging, [field]: value } });
  };

  // Waste Helpers
  const handleWasteChange = (field: string, value: any) => {
    updateData({ ...data, waste_disposal: { ...data.waste_disposal, [field]: value } });
  };

  // Logistics Helpers
  const handleLogisticsChange = (field: string, value: any) => {
    updateData({ ...data, logistics: { ...data.logistics, [field]: value } });
  };

  // Certifications Helpers
  const handleCertificationsChange = (field: string, value: any) => {
    updateData({ ...data, certifications: { ...data.certifications, [field]: value } });
  };

  return (
    <div className="space-y-8">
      {/* Materials Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Section 5: Scope 3 – Other Indirect Emissions</h3>
        <h4 className="text-md font-medium text-gray-900 mb-2">5.1 Materials Details</h4>
        
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Raw Materials Used in Component Manufacturing</label>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Composition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.materials.raw_materials?.map((row, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={row.material}
                                        onChange={(e) => handleRawMaterialChange(index, "material", e.target.value)}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    >
                                        <option value="">Select Material</option>
                                        {QUESTIONNAIRE_OPTIONS.RAW_MATERIALS.map(mat => (
                                            <option key={mat} value={mat}>{mat}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="number"
                                        value={row.composition_percent}
                                        onChange={(e) => handleRawMaterialChange(index, "composition_percent", parseFloat(e.target.value))}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => removeRawMaterialRow(index)}
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
                    onClick={addRawMaterialRow}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Add Material
                </button>
            </div>
        </div>

        <div className="mb-4">
            <label htmlFor="metal_grade" className="block text-sm font-medium text-gray-700">Grade of Metal Used</label>
            <input
                type="text"
                id="metal_grade"
                value={data.materials.metal_grade || ""}
                onChange={(e) => handleMaterialsChange("metal_grade", e.target.value)}
                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
        </div>

        <div className="mb-4">
            <label htmlFor="msds" className="block text-sm font-medium text-gray-700">MSDS Link</label>
            <input
                type="text"
                id="msds"
                value={data.materials.msds || ""}
                onChange={(e) => handleMaterialsChange("msds", e.target.value)}
                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="https://..."
            />
        </div>

        <div className="flex items-start mb-4">
            <div className="flex items-center h-5">
                <input
                    id="recycled_materials_used"
                    type="checkbox"
                    checked={data.materials.recycled_materials_used}
                    onChange={(e) => handleMaterialsChange("recycled_materials_used", e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor="recycled_materials_used" className="font-medium text-gray-700">Use of Recycled / Secondary Materials?</label>
            </div>
        </div>
      </div>

      {/* Packaging Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-2">5.2 Packaging Details</h4>
        <div className="flex items-start mb-4">
            <div className="flex items-center h-5">
                <input
                    id="recycled_content_used"
                    type="checkbox"
                    checked={data.packaging.recycled_content_used}
                    onChange={(e) => handlePackagingChange("recycled_content_used", e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor="recycled_content_used" className="font-medium text-gray-700">Use of Recycled Material in Packaging?</label>
            </div>
        </div>
        {data.packaging.recycled_content_used && (
            <div className="mb-4">
                <label htmlFor="recycled_percent" className="block text-sm font-medium text-gray-700">Percentage of Recycled Content</label>
                <input
                    type="number"
                    id="recycled_percent"
                    value={data.packaging.recycled_percent || 0}
                    onChange={(e) => handlePackagingChange("recycled_percent", parseFloat(e.target.value))}
                    className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
            </div>
        )}
      </div>

      {/* Waste Disposal */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-2">5.3 Disposal of Waste</h4>
        <div className="mb-4">
            <label htmlFor="waste_recycled_percent" className="block text-sm font-medium text-gray-700">Percentage of Waste Recycled (Internal / External)</label>
            <input
                type="number"
                id="waste_recycled_percent"
                value={data.waste_disposal.recycled_percent || 0}
                onChange={(e) => handleWasteChange("recycled_percent", parseFloat(e.target.value))}
                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
        </div>
      </div>

      {/* Logistics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-2">5.4 Logistics</h4>
        <div className="flex items-start mb-4">
            <div className="flex items-center h-5">
                <input
                    id="emissions_tracked"
                    type="checkbox"
                    checked={data.logistics.emissions_tracked}
                    onChange={(e) => handleLogisticsChange("emissions_tracked", e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor="emissions_tracked" className="font-medium text-gray-700">Emissions Tracked for Raw Material Transport?</label>
            </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-2">5.5 Certifications & Standards</h4>
        <div className="space-y-4">
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                        id="iso_certified"
                        type="checkbox"
                        checked={data.certifications.iso_certified}
                        onChange={(e) => handleCertificationsChange("iso_certified", e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="iso_certified" className="font-medium text-gray-700">ISO 14001 or ISO 50001 Certified?</label>
                </div>
            </div>
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                        id="standards_followed"
                        type="checkbox"
                        checked={data.certifications.standards_followed}
                        onChange={(e) => handleCertificationsChange("standards_followed", e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="standards_followed" className="font-medium text-gray-700">Standards Followed (ISO 14067, GHG Protocol, Catena-X, etc.)?</label>
                </div>
            </div>
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                        id="reporting_frameworks"
                        type="checkbox"
                        checked={data.certifications.reporting_frameworks}
                        onChange={(e) => handleCertificationsChange("reporting_frameworks", e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="reporting_frameworks" className="font-medium text-gray-700">Reporting to CDP / SBTi / Other ESG Frameworks?</label>
                </div>
            </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-2">5.6 Additional Notes</h4>
        <div className="space-y-4">
            <div>
                <label htmlFor="reduction_measures" className="block text-sm font-medium text-gray-700">Measures to Reduce Carbon Emissions in Production</label>
                <textarea
                    id="reduction_measures"
                    rows={3}
                    value={data.certifications.additional_notes?.reduction_measures || ""}
                    onChange={(e) => updateData({ ...data, certifications: { ...data.certifications, additional_notes: { ...data.certifications.additional_notes, reduction_measures: e.target.value } } })}
                    className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
            </div>
            <div>
                <label htmlFor="initiatives" className="block text-sm font-medium text-gray-700">Company Sustainability Initiatives & Strategies</label>
                <textarea
                    id="initiatives"
                    rows={3}
                    value={data.certifications.additional_notes?.initiatives || ""}
                    onChange={(e) => updateData({ ...data, certifications: { ...data.certifications, additional_notes: { ...data.certifications.additional_notes, initiatives: e.target.value } } })}
                    className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Scope3;
