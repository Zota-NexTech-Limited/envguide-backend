import React from "react";
import type { SupplierQuestionnaireData } from "../../lib/supplierQuestionnaireService";
import { QUESTIONNAIRE_OPTIONS } from "../../config/questionnaireConfig";

interface OrganizationDetailsProps {
  data: SupplierQuestionnaireData["organization_details"];
  updateData: (data: Partial<SupplierQuestionnaireData["organization_details"]>) => void;
}

const OrganizationDetails: React.FC<OrganizationDetailsProps> = ({ data, updateData }) => {
  const handleChange = (field: keyof SupplierQuestionnaireData["organization_details"], value: any) => {
    updateData({ ...data, [field]: value });
  };

  const handleEmissionDataChange = (index: number, field: string, value: any) => {
    const newEmissionData = [...(data.emission_data || [])];
    if (!newEmissionData[index]) {
        newEmissionData[index] = { country: "", scope_1: 0, scope_2: 0, scope_3: 0 };
    }
    (newEmissionData[index] as any)[field] = value;
    updateData({ ...data, emission_data: newEmissionData });
  };

  const addEmissionRow = () => {
    const newEmissionData = [...(data.emission_data || []), { country: "", scope_1: 0, scope_2: 0, scope_3: 0 }];
    updateData({ ...data, emission_data: newEmissionData });
  };

  const removeEmissionRow = (index: number) => {
    const newEmissionData = [...(data.emission_data || [])];
    newEmissionData.splice(index, 1);
    updateData({ ...data, emission_data: newEmissionData });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* Organization Name */}
        <div className="sm:col-span-6">
          <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700">
            Organization Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="organization_name"
              id="organization_name"
              value={data.organization_name}
              onChange={(e) => handleChange("organization_name", e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Core Business Activities */}
        <div className="sm:col-span-3">
          <label htmlFor="core_business_activities" className="block text-sm font-medium text-gray-700">
            Core Business Activities
          </label>
          <div className="mt-1">
            <select
              id="core_business_activities"
              name="core_business_activities"
              value={data.core_business_activities}
              onChange={(e) => handleChange("core_business_activities", e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Select Activity</option>
              {QUESTIONNAIRE_OPTIONS.CORE_BUSINESS_ACTIVITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Other Activity */}
        {data.core_business_activities === "Others" && (
          <div className="sm:col-span-3">
            <label htmlFor="core_business_activities_other" className="block text-sm font-medium text-gray-700">
              Specify Other Activity
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="core_business_activities_other"
                id="core_business_activities_other"
                value={data.core_business_activities_other || ""}
                onChange={(e) => handleChange("core_business_activities_other", e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}

        {/* Designation */}
        <div className="sm:col-span-3">
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
            Designation / Role / Title
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="designation"
              id="designation"
              value={data.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="sm:col-span-3">
          <label htmlFor="email_address" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="mt-1">
            <input
              type="email"
              name="email_address"
              id="email_address"
              value={data.email_address}
              onChange={(e) => handleChange("email_address", e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Number of Employees */}
        <div className="sm:col-span-3">
          <label htmlFor="number_of_employees" className="block text-sm font-medium text-gray-700">
            Number of Employees
          </label>
          <div className="mt-1">
            <select
              id="number_of_employees"
              name="number_of_employees"
              value={data.number_of_employees}
              onChange={(e) => handleChange("number_of_employees", e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Select Range</option>
              {QUESTIONNAIRE_OPTIONS.NUMBER_OF_EMPLOYEES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Annual Revenue */}
        <div className="sm:col-span-3">
          <label htmlFor="annual_revenue" className="block text-sm font-medium text-gray-700">
            Annual Revenue
          </label>
          <div className="mt-1">
            <select
              id="annual_revenue"
              name="annual_revenue"
              value={data.annual_revenue}
              onChange={(e) => handleChange("annual_revenue", e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Select Revenue</option>
              {QUESTIONNAIRE_OPTIONS.ANNUAL_REVENUE.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Annual Reporting Period */}
        <div className="sm:col-span-3">
          <label htmlFor="annual_reporting_period" className="block text-sm font-medium text-gray-700">
            Annual Reporting Period
          </label>
          <div className="mt-1">
            <select
              id="annual_reporting_period"
              name="annual_reporting_period"
              value={data.annual_reporting_period}
              onChange={(e) => handleChange("annual_reporting_period", e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Select Year</option>
              {QUESTIONNAIRE_OPTIONS.ANNUAL_REPORTING_PERIOD.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Availability of Scope 1, 2, 3 Emissions Data */}
        <div className="sm:col-span-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="availability_of_emissions_data"
                name="availability_of_emissions_data"
                type="checkbox"
                checked={data.availability_of_emissions_data}
                onChange={(e) => handleChange("availability_of_emissions_data", e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="availability_of_emissions_data" className="font-medium text-gray-700">
                Availability of Scope 1, 2, 3 Emissions Data
              </label>
            </div>
          </div>
        </div>

        {/* Emission Data Table */}
        {data.availability_of_emissions_data && (
          <div className="sm:col-span-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Emission Data</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country (ISO3)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope 2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope 3</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.emission_data?.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={row.country}
                          onChange={(e) => handleEmissionDataChange(index, "country", e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="ISO3 Code"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={row.scope_1}
                          onChange={(e) => handleEmissionDataChange(index, "scope_1", parseFloat(e.target.value))}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={row.scope_2}
                          onChange={(e) => handleEmissionDataChange(index, "scope_2", parseFloat(e.target.value))}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={row.scope_3}
                          onChange={(e) => handleEmissionDataChange(index, "scope_3", parseFloat(e.target.value))}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => removeEmissionRow(index)}
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
                onClick={addEmissionRow}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Row
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationDetails;
