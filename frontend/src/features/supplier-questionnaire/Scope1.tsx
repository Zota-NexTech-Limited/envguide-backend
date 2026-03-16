import React from "react";
import type { SupplierQuestionnaireData } from "../../lib/supplierQuestionnaireService";
import { QUESTIONNAIRE_OPTIONS } from "../../config/questionnaireConfig";

interface Scope1Props {
  data: SupplierQuestionnaireData["scope_1"];
  updateData: (data: Partial<SupplierQuestionnaireData["scope_1"]>) => void;
}

const Scope1: React.FC<Scope1Props> = ({ data, updateData }) => {
  const handleChange = (field: keyof SupplierQuestionnaireData["scope_1"], value: any) => {
    updateData({ ...data, [field]: value });
  };

  // Stationary Combustion Helpers
  const handleStationaryChange = (index: number, field: string, value: any) => {
    const newStationary = [...(data.stationary_combustion || [])];
    if (!newStationary[index]) {
        newStationary[index] = { fuel_type: "" };
    }
    (newStationary[index] as any)[field] = value;
    updateData({ ...data, stationary_combustion: newStationary });
  };

  const addStationaryRow = () => {
    const newStationary = [...(data.stationary_combustion || []), { fuel_type: "" }];
    updateData({ ...data, stationary_combustion: newStationary });
  };

  const removeStationaryRow = (index: number) => {
    const newStationary = [...(data.stationary_combustion || [])];
    newStationary.splice(index, 1);
    updateData({ ...data, stationary_combustion: newStationary });
  };

  // Mobile Combustion Helpers
  const handleMobileChange = (index: number, field: string, value: any) => {
    const newMobile = [...(data.mobile_combustion || [])];
    if (!newMobile[index]) {
        newMobile[index] = { fuel_type: "", quantity: 0, unit: "" };
    }
    (newMobile[index] as any)[field] = value;
    updateData({ ...data, mobile_combustion: newMobile });
  };

  const addMobileRow = () => {
    const newMobile = [...(data.mobile_combustion || []), { fuel_type: "", quantity: 0, unit: "" }];
    updateData({ ...data, mobile_combustion: newMobile });
  };

  const removeMobileRow = (index: number) => {
    const newMobile = [...(data.mobile_combustion || [])];
    newMobile.splice(index, 1);
    updateData({ ...data, mobile_combustion: newMobile });
  };

  // Fugitive Emissions Helpers
  const handleFugitiveChange = (field: string, value: any) => {
    updateData({ ...data, fugitive_emissions: { ...data.fugitive_emissions, [field]: value } });
  };

  const handleRefrigerantChange = (index: number, field: string, value: any) => {
    const newRefrigerants = [...(data.fugitive_emissions.refrigerants || [])];
    if (!newRefrigerants[index]) {
        newRefrigerants[index] = { type: "", quantity: 0, unit: "" };
    }
    (newRefrigerants[index] as any)[field] = value;
    handleFugitiveChange("refrigerants", newRefrigerants);
  };

  const addRefrigerantRow = () => {
    const newRefrigerants = [...(data.fugitive_emissions.refrigerants || []), { type: "", quantity: 0, unit: "" }];
    handleFugitiveChange("refrigerants", newRefrigerants);
  };

  const removeRefrigerantRow = (index: number) => {
    const newRefrigerants = [...(data.fugitive_emissions.refrigerants || [])];
    newRefrigerants.splice(index, 1);
    handleFugitiveChange("refrigerants", newRefrigerants);
  };

  // Process Emissions Helpers
  const handleProcessChange = (field: string, value: any) => {
    updateData({ ...data, process_emissions: { ...data.process_emissions, [field]: value } });
  };

  const handleSourceChange = (index: number, field: string, value: any) => {
    const newSources = [...(data.process_emissions.sources || [])];
    if (!newSources[index]) {
        newSources[index] = { source: "", gas_type: "", quantity: 0, unit: "" };
    }
    (newSources[index] as any)[field] = value;
    handleProcessChange("sources", newSources);
  };

  const addSourceRow = () => {
    const newSources = [...(data.process_emissions.sources || []), { source: "", gas_type: "", quantity: 0, unit: "" }];
    handleProcessChange("sources", newSources);
  };

  const removeSourceRow = (index: number) => {
    const newSources = [...(data.process_emissions.sources || [])];
    newSources.splice(index, 1);
    handleProcessChange("sources", newSources);
  };

  return (
    <div className="space-y-8">
      {/* Stationary Combustion */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">3.1 Stationary Combustion (On-site Energy Use)</h3>
        <p className="text-sm text-gray-500 mb-4">Fuel Types and Quantities Used for On-site Energy Generation</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-fuel Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.stationary_combustion?.map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={row.fuel_type}
                      onChange={(e) => handleStationaryChange(index, "fuel_type", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                        <option value="">Select Category</option>
                        {QUESTIONNAIRE_OPTIONS.FUEL_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={row.sub_fuel_type?.[0]?.sub_fuel_type || ""}
                      onChange={(e) => {
                        const subFuelArray = e.target.value ? [{
                          sub_fuel_type: e.target.value,
                          consumption_quantity: row.sub_fuel_type?.[0]?.consumption_quantity || 0,
                          unit: row.sub_fuel_type?.[0]?.unit || ""
                        }] : undefined;
                        handleStationaryChange(index, "sub_fuel_type", subFuelArray);
                      }}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      disabled={!row.fuel_type}
                    >
                        <option value="">Select Type</option>
                        {row.fuel_type && (QUESTIONNAIRE_OPTIONS.FUEL_SUB_TYPES as any)[row.fuel_type]?.map((subType: string) => (
                            <option key={subType} value={subType}>{subType}</option>
                        ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.sub_fuel_type?.[0]?.consumption_quantity || 0}
                      onChange={(e) => {
                        const currentSubFuel = row.sub_fuel_type?.[0];
                        if (currentSubFuel) {
                          handleStationaryChange(index, "sub_fuel_type", [{
                            ...currentSubFuel,
                            consumption_quantity: parseFloat(e.target.value) || 0
                          }]);
                        }
                      }}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={row.sub_fuel_type?.[0]?.unit || ""}
                      onChange={(e) => {
                        const currentSubFuel = row.sub_fuel_type?.[0];
                        if (currentSubFuel) {
                          handleStationaryChange(index, "sub_fuel_type", [{
                            ...currentSubFuel,
                            unit: e.target.value
                          }]);
                        }
                      }}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                        <option value="">Select Unit</option>
                        <option value="liters">Liters</option>
                        <option value="kg">Kg</option>
                        <option value="m3">m3</option>
                        <option value="kWh">kWh</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeStationaryRow(index)}
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
            onClick={addStationaryRow}
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Fuel
          </button>
        </div>
      </div>

      {/* Mobile Combustion */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">3.2 Mobile Combustion (Company-owned Vehicles)</h3>
        <p className="text-sm text-gray-500 mb-4">Annual Fuel Consumption by Vehicles</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Consumption</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.mobile_combustion?.map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={row.fuel_type}
                      onChange={(e) => handleMobileChange(index, "fuel_type", e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                        <option value="">Select Fuel</option>
                        {QUESTIONNAIRE_OPTIONS.VEHICLE_FUEL_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleMobileChange(index, "quantity", parseFloat(e.target.value))}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Quantity"
                      />
                      <select
                        value={row.unit}
                        onChange={(e) => handleMobileChange(index, "unit", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Unit</option>
                        <option value="Litres">Litres</option>
                        <option value="m3">m3</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeMobileRow(index)}
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
            onClick={addMobileRow}
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Vehicle Fuel
          </button>
        </div>
      </div>

      {/* Fugitive Emissions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">3.3 Fugitive Emissions</h3>
        
        <div className="flex items-start mb-4">
          <div className="flex items-center h-5">
            <input
              id="refrigerant_top_ups"
              name="refrigerant_top_ups"
              type="checkbox"
              checked={data.fugitive_emissions.refrigerant_top_ups}
              onChange={(e) => handleFugitiveChange("refrigerant_top_ups", e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="refrigerant_top_ups" className="font-medium text-gray-700">
              Refrigerant Top-ups Performed?
            </label>
          </div>
        </div>

        {data.fugitive_emissions.refrigerant_top_ups && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refrigerant Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.fugitive_emissions.refrigerants?.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.type}
                        onChange={(e) => handleRefrigerantChange(index, "type", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleRefrigerantChange(index, "quantity", parseFloat(e.target.value))}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.unit}
                        onChange={(e) => handleRefrigerantChange(index, "unit", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => removeRefrigerantRow(index)}
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
              onClick={addRefrigerantRow}
              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Refrigerant
            </button>
          </div>
        )}
      </div>

      {/* Process Emissions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">3.4 Process Emissions</h3>
        
        <div className="flex items-start mb-4">
          <div className="flex items-center h-5">
            <input
              id="process_emissions_present"
              name="process_emissions_present"
              type="checkbox"
              checked={data.process_emissions.present}
              onChange={(e) => handleProcessChange("present", e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="process_emissions_present" className="font-medium text-gray-700">
              Industrial Process Emissions Present?
            </label>
          </div>
        </div>

        {data.process_emissions.present && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gas Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.process_emissions.sources?.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.source}
                        onChange={(e) => handleSourceChange(index, "source", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={row.gas_type}
                        onChange={(e) => handleSourceChange(index, "gas_type", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                          <option value="">Select Gas</option>
                          <option value="CO2">CO2</option>
                          <option value="CH4">CH4</option>
                          <option value="N2O">N2O</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleSourceChange(index, "quantity", parseFloat(e.target.value))}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.unit}
                        onChange={(e) => handleSourceChange(index, "unit", e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => removeSourceRow(index)}
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
              onClick={addSourceRow}
              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Source
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scope1;
