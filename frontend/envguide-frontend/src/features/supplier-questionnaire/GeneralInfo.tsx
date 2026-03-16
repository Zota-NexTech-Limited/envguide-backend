import React from "react";
import type { SupplierQuestionnaireData } from "../../lib/supplierQuestionnaireService";
import { QUESTIONNAIRE_OPTIONS } from "../../config/questionnaireConfig";

interface GeneralInfoProps {
  data: SupplierQuestionnaireData["general_information"];
  updateData: (data: Partial<SupplierQuestionnaireData["general_information"]>) => void;
}

const GeneralInfo: React.FC<GeneralInfoProps> = ({ data, updateData }) => {
  const handleChange = (field: keyof SupplierQuestionnaireData["general_information"], value: boolean) => {
    updateData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* GDPR Notice */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">GDPR Notice</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                All information provided is confidential and used only for corporate and product-level sustainability assessment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Eligible RE Technologies */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Eligible Renewable Electricity (RE) Technologies</h3>
        <p className="text-sm text-gray-500 mb-4">
          Please read and acknowledge the following eligible technologies considered as renewable electricity:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-4">
          <li>Wind</li>
          <li>Hydro</li>
          <li>Solar power</li>
          <li>Geothermal</li>
          <li>Biomass (solid, liquid, gaseous forms from woody waste, landfill gas, wastewater methane, animal & other organic waste, energy crops)</li>
          <li>Ocean-based energy (tidal and wave technologies)</li>
        </ul>
        
        <h4 className="text-sm font-medium text-gray-900 mb-2">Excluded Technologies</h4>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-4">
          <li>Electricity from nuclear power</li>
          <li>Electricity from waste combustion</li>
        </ul>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="re_technologies_acknowledgement"
              name="re_technologies_acknowledgement"
              type="checkbox"
              checked={data.re_technologies_acknowledgement}
              onChange={(e) => handleChange("re_technologies_acknowledgement", e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="re_technologies_acknowledgement" className="font-medium text-gray-700">
              I acknowledge that I have read and understood the eligible technologies considered as renewable electricity (RE).
            </label>
          </div>
        </div>
      </div>

      {/* RE Procurement Mechanisms */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Renewable Electricity Procurement Mechanisms</h3>
        <p className="text-sm text-gray-500 mb-4">
          Electricity is regarded as renewable if provided using one of the mechanisms below, respecting requirements regarding double counting.
        </p>
        
        <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Acronyms</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li><strong>PPA</strong>: Power Purchase Agreement</li>
                <li><strong>EAC</strong>: Energy Attribute Certificate</li>
                <li><strong>iREC / I-REC</strong>: International Renewable Energy Certificate</li>
                <li><strong>GOO</strong>: Guarantee of Origin</li>
            </ul>
        </div>

        <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Procurement Options</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                {QUESTIONNAIRE_OPTIONS.RE_PROCUREMENT_MECHANISMS.map((option, idx) => (
                    <li key={idx}>{option}</li>
                ))}
            </ul>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="re_procurement_acknowledgement"
              name="re_procurement_acknowledgement"
              type="checkbox"
              checked={data.re_procurement_acknowledgement}
              onChange={(e) => handleChange("re_procurement_acknowledgement", e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="re_procurement_acknowledgement" className="font-medium text-gray-700">
              I acknowledge that I have read and understood the procurement mechanisms mentioned above.
            </label>
          </div>
        </div>
      </div>

      {/* Double Counting */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Double Counting</h3>
        <p className="text-sm text-gray-500 mb-4">
          Please acknowledge that the mechanism used does <strong>not</strong> fall under double counting. Prohibited examples include:
        </p>
        <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1 mb-4">
          <li>Same EAC sold to more than one party or conflicting contracts</li>
          <li>Same EAC claimed by more than one party for environmental claims or disclosure</li>
          <li>Same EAC used for regulatory mandates (e.g., RPS) and customer sales</li>
          <li>Separate attributes of the same MWh sold to different parties</li>
        </ol>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="double_counting_acknowledgement"
              name="double_counting_acknowledgement"
              type="checkbox"
              checked={data.double_counting_acknowledgement}
              onChange={(e) => handleChange("double_counting_acknowledgement", e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="double_counting_acknowledgement" className="font-medium text-gray-700">
              I acknowledge my mechanisms do not fall under double counting.
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralInfo;
