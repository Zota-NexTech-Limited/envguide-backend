import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Users,
    ChevronDown,
    Factory,
    LineChart as LineChartIcon
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ComposedChart,
    Line
} from "recharts";
import {
    DetailedHeader,
    ChartCard,
    ChartModal
} from "../components/DashboardComponents";
import dashboardService from "../lib/dashboardService";

interface ReductionData {
    name: string; // product_name (year)
    emission: number; // total_emission_kg_co2_eq
    reduction: number; // reduction_from_previous_period_percentage
}

interface ActualEmissionData {
    name: string; // product_name
    actual: number; // total_overall_pcf_emission
}

interface ForecastedData {
    name: string; // year
    emission: number; // total_forecasted_emission_kg_co2_eq
}
const DetailedPCFTrend: React.FC = () => {
    const navigate = useNavigate();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    // State
    const [clients, setClients] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

    const [reductionData, setReductionData] = useState<ReductionData[]>([]);
    const [actualEmissionData, setActualEmissionData] = useState<ActualEmissionData[]>([]);
    const [forecastedEmissionData, setForecastedEmissionData] = useState<ForecastedData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            fetchSuppliers(selectedClient.user_id);
            fetchGraphData(selectedClient.user_id);
        } else {
            setReductionData([]);
            setActualEmissionData([]);
            setForecastedEmissionData([]);
            setSuppliers([]);
            setSelectedSupplier(null);
        }
    }, [selectedClient]);

    const fetchClients = async () => {
        const response = await dashboardService.getClientsDropdown();
        if (response.success || response.status) {
            const clientList = Array.isArray(response.data) ? response.data : (response.data?.data ? response.data.data : []);
            setClients(clientList);
        }
    };

    const fetchSuppliers = async (clientId: string) => {
        const response = await dashboardService.getSupplierDropdown(clientId);
        if (response.success || response.status) {
            const supplierList = Array.isArray(response.data) ? response.data : (response.data?.data ? response.data.data : []);
            setSuppliers(supplierList);
        }
    };

    const fetchGraphData = async (clientId: string) => {
        setLoading(true);

        // PCF Reduction Emission
        const reductionRes = await dashboardService.getPCFReductionEmission(clientId);
        if (reductionRes.success) {
            const formatted = reductionRes.data.map((item: any) => ({
                name: `${item.product_name} (${item.year})`,
                emission: item.total_emission_kg_co2_eq,
                reduction: item.reduction_from_previous_period_percentage || 0
            }));
            setReductionData(formatted);
        }

        // Actual PCF Emission
        const actualRes = await dashboardService.getActualPCFEmission(clientId);
        if (actualRes.success) {
            const formatted = actualRes.data.map((item: any) => ({
                name: item.product_name,
                actual: item.total_overall_pcf_emission
            }));
            setActualEmissionData(formatted);
        }

        // Forecasted Emission
        const forecastedRes = await dashboardService.getForecastedEmission(clientId);
        if (forecastedRes.success) {
            const formatted = forecastedRes.data.map((item: any) => ({
                name: item.year.toString(),
                emission: item.total_forecasted_emission_kg_co2_eq
            }));
            setForecastedEmissionData(formatted);
        }

        setLoading(false);
    };

    const renderReductionGraph = (isModal = false) => {
        if (!selectedClient) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400 italic">
                    Select a client to view PCF reduction data
                </div>
            );
        }
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={reductionData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#9CA3AF', width: 100 }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={80}
                    />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Legend
                        verticalAlign="top"
                        align="center"
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }}
                    />
                    <Bar yAxisId="left" dataKey="emission" fill="#74D14C" radius={[4, 4, 0, 0]} name="Total Emission (kg CO₂e)" />
                    <Line yAxisId="right" type="linear" dataKey="reduction" stroke="#1A5D1A" strokeWidth={3} dot={{ fill: '#1A5D1A', r: 4 }} name="% Reduction" />
                </ComposedChart>
            </ResponsiveContainer>
        );
    };

    const renderActualEmission = (isModal = false) => {
        if (!selectedClient) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400 italic">
                    Select a client to view actual emission data
                </div>
            );
        }
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actualEmissionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar dataKey="actual" fill="#52C41A" radius={[4, 4, 0, 0]} name="Actual Emission (kg CO₂e)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderForecastedEmission = (isModal = false) => {
        if (!selectedClient) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400 italic">
                    Select a client to view forecasted emission data
                </div>
            );
        }
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastedEmissionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar dataKey="emission" fill="#74D14C" radius={[4, 4, 0, 0]} name="Forecasted Emission (kg CO₂e)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6">
            <div className="mx-auto">
                <DetailedHeader
                    title="PCF Visualisation Trends"
                    subtitle="Detailed emission insights across life cycle stages"
                    onBack={() => navigate("/dashboard")}
                    icon={LineChartIcon}
                />

                {/* Filters */}
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {/* Client Dropdown */}
                    <div className="w-full md:w-64 relative">
                        <label className="text-xs font-bold text-gray-500 block mb-2">Select Client</label>
                        <div
                            className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 cursor-pointer"
                            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span>{selectedClient ? (selectedClient.company_name || selectedClient.user_name) : "Select Client"}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isClientDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {clients.map((client) => (
                                    <div
                                        key={client.user_id}
                                        className="px-4 py-2.5 text-sm text-gray-600 hover:bg-green-50 hover:text-green-600 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setIsClientDropdownOpen(false);
                                            setSelectedSupplier(null); // Reset supplier
                                        }}
                                    >
                                        {client.company_name || client.user_name}
                                    </div>
                                ))}
                                {clients.length === 0 && (
                                    <div className="px-4 py-2.5 text-sm text-gray-400">No clients available</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Supplier Dropdown */}
                    <div className="w-full md:w-64 relative">
                        <label className="text-xs font-bold text-gray-500 block mb-2">Select Supplier</label>
                        <div
                            className={`flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 cursor-pointer ${!selectedClient ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => selectedClient && setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <Factory className="w-4 h-4 text-gray-400" />
                                <span>{selectedSupplier ? (selectedSupplier.name || selectedSupplier.supplier_name) : "Select Supplier"}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSupplierDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isSupplierDropdownOpen && selectedClient && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                <div
                                    className="px-4 py-2.5 text-sm text-gray-600 hover:bg-green-50 hover:text-green-600 cursor-pointer transition-colors"
                                    onClick={() => {
                                        setSelectedSupplier(null);
                                        setIsSupplierDropdownOpen(false);
                                    }}
                                >
                                    All Suppliers
                                </div>
                                {suppliers.map((supplier) => (
                                    <div
                                        key={supplier.id || supplier.supplier_id}
                                        className="px-4 py-2.5 text-sm text-gray-600 hover:bg-green-50 hover:text-green-600 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setSelectedSupplier(supplier);
                                            setIsSupplierDropdownOpen(false);
                                        }}
                                    >
                                        {supplier.name || supplier.supplier_name}
                                    </div>
                                ))}
                                {suppliers.length === 0 && (
                                    <div className="px-4 py-2.5 text-sm text-gray-400">No suppliers available</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="PCF Reduction Graph" showExpand onExpand={() => setExpandedChart("reduction")}>
                        {renderReductionGraph()}
                    </ChartCard>
                    <ChartCard title="Actual Emission Graph" showExpand onExpand={() => setExpandedChart("target")}>
                        {renderActualEmission()}
                    </ChartCard>
                </div>

                <div className="mt-6">
                    <ChartCard title="Forecasted Emission" showExpand onExpand={() => setExpandedChart("forecast")}>
                        {renderForecastedEmission()}
                    </ChartCard>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal isOpen={expandedChart === "reduction"} onClose={() => setExpandedChart(null)} title="PCF Reduction Graph">
                {renderReductionGraph(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "target"} onClose={() => setExpandedChart(null)} title="Actual Emission Graph">
                {renderActualEmission(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "forecast"} onClose={() => setExpandedChart(null)} title="Forecasted Emission">
                {renderForecastedEmission(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedPCFTrend;
