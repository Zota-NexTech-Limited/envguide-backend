import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Package,
  User,
  Leaf,
  MapPin,
  Factory,
  Tag,
  FileText,
  Scale,
  Banknote,
  ClipboardList,
} from "lucide-react";

interface BomTableProps {
  bomData: any[];
  readOnly?: boolean;
  showCalculatedEmissions?: boolean; // When true, uses actual emission data from pcf_total_emission_calculation
}

const BomTable: React.FC<BomTableProps> = ({ bomData, readOnly = false, showCalculatedEmissions = false }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (key: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(key)) {
      newExpandedRows.delete(key);
    } else {
      newExpandedRows.add(key);
    }
    setExpandedRows(newExpandedRows);
  };

  const calculateTotals = () => {
    return bomData.reduce(
      (acc, item) => {
        const weight = parseFloat(item.totalWeight || item.weight || "0");
        const cost = parseFloat(item.totalPrice || item.price || "0");
        // Use calculated emissions when available
        const emission = showCalculatedEmissions && item.pcf_total_emission_calculation
          ? (item.pcf_total_emission_calculation.total_pcf_value || 0)
          : parseFloat(item.emission || "0");

        return {
          totalWeight: acc.totalWeight + (isNaN(weight) ? 0 : weight),
          totalCost: acc.totalCost + (isNaN(cost) ? 0 : cost),
          totalEmission: acc.totalEmission + (isNaN(emission) ? 0 : emission),
        };
      },
      { totalWeight: 0, totalCost: 0, totalEmission: 0 }
    );
  };

  const totals = calculateTotals();

  if (bomData.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-2xl">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium mb-1">No BOM data available</p>
        <p className="text-sm text-gray-400">Import a CSV file to add components</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ height: "500px" }}>
      {/* Table Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 sticky top-0 z-10 flex-shrink-0">
        <div className="grid grid-cols-24 gap-2 font-semibold text-xs text-white/90 uppercase tracking-wider">
          <div className="col-span-6 pl-8">Component Name</div>
          <div className="col-span-4">Material Number</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-3 text-right">Weight (g)</div>
          <div className="col-span-3 text-right">Price</div>
          <div className="col-span-3 text-right">Emission</div>
          <div className="col-span-3 text-center">Status</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-white divide-y divide-gray-100 flex-1 overflow-y-auto">
        {bomData.map((item, index) => {
          const isExpanded = expandedRows.has(item.key || item.id);
          return (
            <div key={item.key || item.id} className="transition-all duration-200">
              {/* Main Row */}
              <div
                className={`px-6 py-4 cursor-pointer transition-all duration-200 ${
                  isExpanded
                    ? "bg-green-50 border-l-4 border-green-500"
                    : "hover:bg-gray-50 border-l-4 border-transparent"
                }`}
                onClick={() => toggleRowExpansion(item.key || item.id)}
              >
                <div className="grid grid-cols-24 gap-2 items-center text-sm">
                  <div className="col-span-6 flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                        isExpanded
                          ? "bg-green-200 text-green-700"
                          : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600"
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`font-medium truncate ${isExpanded ? "text-green-900" : "text-gray-900"}`}>
                      {item.componentName || "-"}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-gray-600 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {item.materialNumber || "-"}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-gray-900 font-medium">{item.quantity || "-"}</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-gray-900">
                      {parseFloat(item.totalWeight || item.weight || "0").toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-gray-900">
                      ₹{parseFloat(item.totalPrice || item.price || "0").toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-gray-900">
                      {(() => {
                        const emissionValue = showCalculatedEmissions && item.pcf_total_emission_calculation
                          ? item.pcf_total_emission_calculation.total_pcf_value
                          : parseFloat(item.emission || "0");
                        return emissionValue
                          ? emissionValue.toLocaleString("en-US", {
                              minimumFractionDigits: 4,
                              maximumFractionDigits: 4,
                            })
                          : "-";
                      })()}
                    </span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.questionerStatus === "Completed"
                          ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
                          : "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20"
                      }`}
                    >
                      {item.questionerStatus || "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-3 bg-gradient-to-b from-green-50/50 to-white border-t border-green-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Component Details Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-green-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Component Details</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Category
                          </span>
                          <span className="text-gray-900 font-medium text-right">{item.category || "-"}</span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Description
                          </span>
                          <span className="text-gray-900 font-medium text-right max-w-[140px] truncate" title={item.detailedDescription}>
                            {item.detailedDescription || "-"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            Location
                          </span>
                          <span className="text-gray-900 font-medium text-right">{item.productionLocation || "-"}</span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Factory className="w-3.5 h-3.5" />
                            Manufacturer
                          </span>
                          <span className="text-gray-900 font-medium text-right">{item.manufacturer || "-"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Supplier Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Supplier Information</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Supplier Name</span>
                          <span className="text-gray-900 font-medium">{item.supplierName || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Email</span>
                          <span className="text-gray-900 font-medium truncate max-w-[140px]" title={item.supplierEmail}>
                            {item.supplierEmail || "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Phone</span>
                          <span className="text-gray-900 font-medium">{item.supplierNumber || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Questionnaire</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.questionerStatus === "Completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.questionerStatus || "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Emissions Breakdown Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Leaf className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Emissions Breakdown</h4>
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          // Use calculated emissions if available, otherwise use placeholder factors
                          const emissionCalc = item.pcf_total_emission_calculation;
                          const hasCalculatedData = showCalculatedEmissions && emissionCalc;
                          const totalEmission = hasCalculatedData
                            ? (emissionCalc.total_pcf_value || 0)
                            : parseFloat(item.emission || "0");

                          const emissionRows = hasCalculatedData
                            ? [
                                { label: "Materials", value: emissionCalc.material_value || 0 },
                                { label: "Production", value: emissionCalc.production_value || 0 },
                                { label: "Packaging", value: emissionCalc.packaging_value || 0 },
                                { label: "Logistics", value: emissionCalc.logistic_value || 0 },
                                { label: "Waste", value: emissionCalc.waste_value || 0 },
                              ]
                            : [
                                { label: "Materials", value: totalEmission * 0.5 },
                                { label: "Production", value: totalEmission * 0.2 },
                                { label: "Packaging", value: totalEmission * 0.1 },
                                { label: "Logistics", value: totalEmission * 0.15 },
                                { label: "Waste", value: totalEmission * 0.05 },
                              ];

                          return emissionRows.map((row) => {
                            const percentage = totalEmission > 0 ? (row.value / totalEmission * 100) : 0;
                            return (
                              <div key={row.label} className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">{row.label}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${Math.min(percentage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-gray-900 font-medium w-20 text-right">
                                    {row.value.toFixed(4)} kg
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                        <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium">Total</span>
                          <span className="text-emerald-600 font-semibold">
                            {(showCalculatedEmissions && item.pcf_total_emission_calculation
                              ? item.pcf_total_emission_calculation.total_pcf_value
                              : parseFloat(item.emission || "0")
                            ).toFixed(4)} kgCO₂e
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Totals */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200 sticky bottom-0 z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Components</p>
              <p className="text-lg font-bold text-gray-900">{bomData.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200">
              <Scale className="w-4 h-4 text-gray-400" />
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Weight</p>
                <p className="font-semibold text-gray-900">
                  {totals.totalWeight.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} g
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200">
              <Banknote className="w-4 h-4 text-gray-400" />
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="font-semibold text-gray-900">
                  ₹{totals.totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <div className="text-right">
                <p className="text-xs text-emerald-600">Total Emission</p>
                <p className="font-semibold text-emerald-700">
                  {totals.totalEmission.toLocaleString("en-US", {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4,
                  })} kgCO₂e
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BomTable;
