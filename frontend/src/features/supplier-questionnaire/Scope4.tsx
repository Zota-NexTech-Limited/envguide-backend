import React from "react";
import type { SupplierQuestionnaireData } from "../../lib/supplierQuestionnaireService";

interface Scope4Props {
  data: SupplierQuestionnaireData["scope_4"];
  updateData: (data: Partial<SupplierQuestionnaireData["scope_4"]>) => void;
}

const Scope4: React.FC<Scope4Props> = ({ data, updateData }) => {
  const handleChange = (field: keyof SupplierQuestionnaireData["scope_4"], value: string) => {
    updateData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Section 6: Scope 4 – Avoided Emissions</h3>
        <p className="text-sm text-gray-500 mb-4">(Climate Positive Impacts)</p>

        <div className="space-y-6">
          <div>
            <label htmlFor="products_reducing_customer_emissions" className="block text-sm font-medium text-gray-700">
              Products or Services that Help Reduce Customer Emissions
            </label>
            <div className="mt-1">
              <textarea
                id="products_reducing_customer_emissions"
                name="products_reducing_customer_emissions"
                rows={4}
                value={data.products_reducing_customer_emissions}
                onChange={(e) => handleChange("products_reducing_customer_emissions", e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label htmlFor="circular_economy_practices" className="block text-sm font-medium text-gray-700">
              Circular Economy Practices (Reuse, Take-back, EPR, Refurbishment)
            </label>
            <div className="mt-1">
              <textarea
                id="circular_economy_practices"
                name="circular_economy_practices"
                rows={4}
                value={data.circular_economy_practices}
                onChange={(e) => handleChange("circular_economy_practices", e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label htmlFor="offset_projects" className="block text-sm font-medium text-gray-700">
              Renewable Energy / Carbon Offset Projects Implemented
            </label>
            <div className="mt-1">
              <textarea
                id="offset_projects"
                name="offset_projects"
                rows={4}
                value={data.offset_projects}
                onChange={(e) => handleChange("offset_projects", e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scope4;
