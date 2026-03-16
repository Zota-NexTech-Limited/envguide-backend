import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Calendar,
    Users,
    ChevronDown,
    RefreshCw
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from "recharts";
import {
    DetailedHeader,
    ChartCard,
    ChartModal
} from "../components/DashboardComponents";
import dashboardService from "../lib/dashboardService";

interface LifeCycleDataItem {
    name: string;
    value: number;
    color: string;
}

interface Client {
    user_id: string;
    user_name: string;
}

const DEFAULT_USER_ID = "01K8GVAT2BMR1FN2T4057JZ50V";

const COLOR_MAP: Record<string, string> = {
    "Raw Material Emission": "#1A5D1A",
    "Manufacturing": "#458C21",
    "Packaging": "#74B72E",
    "Transportation": "#98FB98",
    "End of Life": "#C1FFC1",
};

const DetailedLifeCycle: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [lifeCycleData, setLifeCycleData] = useState<LifeCycleDataItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (location.state?.selectedClient) {
            setSelectedClient(location.state.selectedClient);
        }
    }, [location.state]);

    // Fetch Clients
    useEffect(() => {
        const fetchClients = async () => {
            const result = await dashboardService.getClientsDropdown();
            console.log("Clients API Result:", result);
            if (result.status === true || result.success === true || result.data) {
                const clientList = Array.isArray(result.data) ? result.data : (result.data?.data && Array.isArray(result.data.data) ? result.data.data : []);
                console.log("Processed Client List:", clientList);
                setClients(clientList);
            }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        const fetchLifeCycleData = async () => {
            setIsLoading(true);
            const userId = selectedClient?.user_id || DEFAULT_USER_ID;
            const result = await dashboardService.getProductLifeCycle(userId);
            console.log("Life Cycle API Result for user", userId, ":", result);

            if (result.status || result.success || result.data) {
                const data = result.data?.data || result.data;
                const formattedData: LifeCycleDataItem[] = [
                    { name: "Raw Material Emission", value: parseFloat(data.raw_material) || 0, color: COLOR_MAP["Raw Material Emission"] },
                    { name: "Manufacturing", value: parseFloat(data.manufacturing) || 0, color: COLOR_MAP["Manufacturing"] },
                    { name: "Packaging", value: parseFloat(data.packaging) || 0, color: COLOR_MAP["Packaging"] },
                    { name: "Transportation", value: parseFloat(data.transportation) || 0, color: COLOR_MAP["Transportation"] },
                    { name: "End of Life", value: parseFloat(data.waste) || 0, color: COLOR_MAP["End of Life"] },
                ];
                setLifeCycleData(formattedData);
            }
            setIsLoading(false);
        };

        fetchLifeCycleData();
    }, [selectedClient]);

    const renderLifeCycleChart = (isModal = false) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lifeCycleData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} />
                <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={isModal ? 80 : 40} name="Emission Percentage (%)">
                    {lifeCycleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6">
            <div className="mx-auto">
                <DetailedHeader
                    title="Detailed Life Cycle Analysis"
                    subtitle="Comprehensive breakdown of emissions across all product life cycle stages"
                    onBack={() => navigate("/dashboard")}
                    icon={RefreshCw}
                />

                {/* Filters */}
                <div className="flex justify-start mb-8">
                    <div className="w-full md:w-64 relative">
                        <label className="text-xs font-bold text-gray-500 block mb-2">Select Client</label>
                        <div
                            className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 cursor-pointer"
                            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span>{selectedClient ? selectedClient.user_name : "Select Client"}</span>
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
                                        }}
                                    >
                                        {client.user_name}
                                    </div>
                                ))}
                                {clients.length === 0 && (
                                    <div className="px-4 py-2.5 text-sm text-gray-400">No clients available</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {lifeCycleData.map((kpi, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                                {kpi.name.replace(" Emission", "")}
                            </p>
                            <h3 className={`text-3xl font-bold`} style={{ color: kpi.color }}>
                                {isLoading ? "..." : `${kpi.value.toFixed(0)}%`}
                            </h3>
                        </div>
                    ))}
                    {!isLoading && lifeCycleData.length === 0 && (
                        <div className="col-span-5 bg-white border border-gray-100 rounded-2xl p-6 text-center text-gray-400">
                            No data available for the selected client
                        </div>
                    )}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 gap-6 mb-6">
                    <ChartCard
                        title="Product Life Cycle Emission (%)"
                        showExpand
                        onExpand={() => setExpandedChart("lifecycle")}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                                Loading chart data...
                            </div>
                        ) : lifeCycleData.length > 0 ? (
                            renderLifeCycleChart()
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No data available
                            </div>
                        )}
                    </ChartCard>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal
                isOpen={expandedChart === "lifecycle"}
                onClose={() => setExpandedChart(null)}
                title="Product Life Cycle Emission (%)"
            >
                {renderLifeCycleChart(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedLifeCycle;

