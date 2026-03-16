import React from "react";
import type { SupplierQuestionnaireData } from "../../lib/supplierQuestionnaireService";
import { QUESTIONNAIRE_OPTIONS } from "../../config/questionnaireConfig";

interface Scope2Props {
  data: SupplierQuestionnaireData["scope_2"];
  updateData: (data: Partial<SupplierQuestionnaireData["scope_2"]>) => void;
}

const Scope2: React.FC<Scope2Props> = ({ data, updateData }) => {
  // Purchased Energy Helpers
  const handlePurchasedEnergyChange = (index: number, field: string, value: any) => {
    const newEnergy = [...(data.purchased_energy || [])];
    if (!newEnergy[index]) {
        newEnergy[index] = { energy_source: "", energy_type: "", quantity: 0, unit: "" };
    }
    (newEnergy[index] as any)[field] = value;
    updateData({ ...data, purchased_energy: newEnergy });
  };

  const addPurchasedEnergyRow = () => {
    const newEnergy = [...(data.purchased_energy || []), { energy_source: "", energy_type: "", quantity: 0, unit: "" }];
    updateData({ ...data, purchased_energy: newEnergy });
  };

  const removePurchasedEnergyRow = (index: number) => {
    const newEnergy = [...(data.purchased_energy || [])];
    newEnergy.splice(index, 1);
    updateData({ ...data, purchased_energy: newEnergy });
  };

  // Certificates Helpers
  const handleCertificateChange = (index: number, field: string, value: any) => {
    const newCertificates = [...(data.certificates || [])];
    if (!newCertificates[index]) {
        newCertificates[index] = { name: "", procurement_mechanism: "", serial_id: "", generator_id: "", generator_name: "", generator_location: "", date_of_generation: "", issuance_date: "" };
    }
    (newCertificates[index] as any)[field] = value;
    updateData({ ...data, certificates: newCertificates });
  };

  const addCertificateRow = () => {
    const newCertificates = [...(data.certificates || []), { name: "", procurement_mechanism: "", serial_id: "", generator_id: "", generator_name: "", generator_location: "", date_of_generation: "", issuance_date: "" }];
    updateData({ ...data, certificates: newCertificates });
  };

  const removeCertificateRow = (index: number) => {
    const newCertificates = [...(data.certificates || [])];
    newCertificates.splice(index, 1);
    updateData({ ...data, certificates: newCertificates });
  };

  // Manufacturing Process Helpers
  const handleManufacturingChange = (field: string, value: any) => {
    updateData({ ...data, manufacturing_process_specific_energy: { ...data.manufacturing_process_specific_energy, [field]: value } });
  };

  // Quality Control Helpers
  const handleQualityControlChange = (field: string, value: any) => {
    updateData({ ...data, quality_control: { ...data.quality_control, [field]: value } });
  };

  // IT Helpers
  const handleITChange = (field: string, value: any) => {
    updateData({ ...data, it_for_production: { ...data.it_for_production, [field]: value } });
  };

  return (
    <div className="space-y-8">
      {/* Purchased Energy */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Section 4: Scope 2 – Indirect Emissions from Purchased Energy</h3>
        <p className="text-sm text-gray-500 mb-4">Purchased / Acquired Energy Details</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.purchased_energy?.map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={row.energy_source}
                      onChange={(e) => handlePurchasedEnergyChange(index, "energy_source", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                        <option value="">Select Source</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Heating">Heating</option>
                        <option value="Cooling">Cooling</option>
                        <option value="Steam">Steam</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={row.energy_type}
                      onChange={(e) => handlePurchasedEnergyChange(index, "energy_type", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                        <option value="">Select Type</option>
                        <option value="Grid">Grid</option>
                        <option value="Renewable">Renewable</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => handlePurchasedEnergyChange(index, "quantity", parseFloat(e.target.value))}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => handlePurchasedEnergyChange(index, "unit", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g. MWh"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removePurchasedEnergyRow(index)}
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
            onClick={addPurchasedEnergyRow}
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Energy
          </button>
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-start mb-4">
          <div className="flex items-center h-5">
            <input
              id="standardized_re_certificates"
              name="standardized_re_certificates"
              type="checkbox"
              checked={data.standardized_re_certificates}
              onChange={(e) => updateData({ ...data, standardized_re_certificates: e.target.checked })}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="standardized_re_certificates" className="font-medium text-gray-700">
              Standardized RE Certificates Acquired?
            </label>
          </div>
        </div>

        {data.standardized_re_certificates && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanism</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.certificates?.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleCertificateChange(index, "name", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={row.procurement_mechanism}
                        onChange={(e) => handleCertificateChange(index, "procurement_mechanism", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                          <option value="">Select Mechanism</option>
                          {QUESTIONNAIRE_OPTIONS.RE_PROCUREMENT_MECHANISMS.map(mech => (
                              <option key={mech} value={mech}>{mech}</option>
                          ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.serial_id}
                        onChange={(e) => handleCertificateChange(index, "serial_id", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => removeCertificateRow(index)}
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
              onClick={addCertificateRow}
              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Certificate
            </button>
          </div>
        )}
      </div>

      {/* Manufacturing Process Specific Energy */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Section 4.1: Manufacturing Process-Specific Energy</h3>
        
        <div className="flex items-start mb-4">
          <div className="flex items-center h-5">
            <input
              id="allocation_methodology"
              name="allocation_methodology"
              type="checkbox"
              checked={data.manufacturing_process_specific_energy.allocation_methodology}
              onChange={(e) => handleManufacturingChange("allocation_methodology", e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="allocation_methodology" className="font-medium text-gray-700">
              Methodology to Allocate Factory Energy to Product Level?
            </label>
          </div>
        </div>

        {data.manufacturing_process_specific_energy.allocation_methodology && (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Methodology Details (Document URL)</label>
                <input
                  type="text"
                  value={data.manufacturing_process_specific_energy.methodology_document || ""}
                  onChange={(e) => handleManufacturingChange("methodology_document", e.target.value)}
                  className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="https://..."
                />
            </div>
        )}

        <div className="flex items-start mb-4">
          <div className="flex items-center h-5">
            <input
              id="abatement_systems"
              name="abatement_systems"
              type="checkbox"
              checked={data.manufacturing_process_specific_energy.abatement_systems}
              onChange={(e) => handleManufacturingChange("abatement_systems", e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="abatement_systems" className="font-medium text-gray-700">
              Abatement Systems Used (VOC treatment, heat recovery)?
            </label>
          </div>
        </div>
      </div>

      {/* Quality Control */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Section 4.2: Quality Control in Production</h3>
        <p className="text-sm text-gray-500 mb-4">Quality Control / Testing Equipment Used</p>
        {/* Simplified for brevity, would include tables for equipment, etc. */}
        <div className="text-sm text-gray-500 italic">
            (Quality Control tables implementation placeholder - similar structure to above tables)
        </div>
      </div>

      {/* IT for Production */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Section 4.3: Information Technology (IT) for Production Control</h3>
        
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">IT Systems Used</label>
            <div className="grid grid-cols-2 gap-2">
                {QUESTIONNAIRE_OPTIONS.IT_SYSTEMS.map(system => (
                    <div key={system} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={data.it_for_production.systems_used?.includes(system)}
                            onChange={(e) => {
                                const current = data.it_for_production.systems_used || [];
                                const newSystems = e.target.checked 
                                    ? [...current, system]
                                    : current.filter(s => s !== system);
                                handleITChange("systems_used", newSystems);
                            }}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">{system}</label>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Scope2;
