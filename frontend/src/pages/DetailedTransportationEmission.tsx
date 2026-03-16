import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Calendar,
    Users,
    ChevronDown,
    Truck
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

interface Client {
    user_id: string;
    user_name: string;
}

interface Supplier {
    sup_id: string;
    supplier_name: string;
}

interface ModeData {
    name: string;
    distance: number;
    emission: number;
    share: number;
}

interface CorrelationData {
    name: string;
    km: number;
    emission: number;
    color?: string;
}

const COLOR_PALETTE = ["#D9F5C5", "#B3E699", "#8CD76D", "#66C841", "#40B915", "#1A5D1A", "#347C17"];

const DetailedTransportationEmission: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    // Dropdown State
    const [clients, setClients] = useState<Client[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

    // Chart Data State
    const [modeData, setModeData] = useState<ModeData[]>([]);
    const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
    const [isLoadingMode, setIsLoadingMode] = useState(false);
    const [isLoadingCorrelation, setIsLoadingCorrelation] = useState(false);

    // Set Client from Navigation
    useEffect(() => {
        if (location.state?.selectedClient) {
            setSelectedClient(location.state.selectedClient);
        }
    }, [location.state]);

    // Fetch Clients on Mount
    useEffect(() => {
        const fetchClients = async () => {
            const result = await dashboardService.getClientsDropdown();
            if (result.success && result.data) {
                setClients(result.data);
            }
        };
        fetchClients();
    }, []);

    // Fetch Suppliers and Mode Data when Client changes
    useEffect(() => {
        if (selectedClient) {
            const fetchSuppliers = async () => {
                const result = await dashboardService.getSupplierDropdown(selectedClient.user_id);
                if (result.success && result.data) {
                    setSuppliers(result.data);
                }
            };

            const fetchModeData = async () => {
                setIsLoadingMode(true);
                const result = await dashboardService.getModeOfTransportationEmission(selectedClient.user_id);
                if (result.success && result.data) {
                    const formatted = result.data.map((item: any) => ({
                        name: item.mode_of_transport || item.name || "Unknown",
                        distance: parseFloat(item.distance_km) || 0,
                        emission: parseFloat(item.co2e_kg) || 0,
                        share: parseFloat(item.share_percentage) || 0
                    }));
                    setModeData(formatted);
                }
                setIsLoadingMode(false);
            };

            fetchSuppliers();
            fetchModeData();
            setSelectedSupplier(null);
            setCorrelationData([]);
        } else {
            setSuppliers([]);
            setModeData([]);
            setCorrelationData([]);
        }
    }, [selectedClient]);

    // Fetch Correlation Data when Client or Supplier changes
    useEffect(() => {
        if (selectedClient) {
            const fetchCorrelationData = async () => {
                setIsLoadingCorrelation(true);
                const result = await dashboardService.getDistanceVsCorrelationEmission(
                    selectedClient.user_id,
                    selectedSupplier?.sup_id
                );
                if (result.success && result.data) {
                    const formatted = result.data.map((item: any, index: number) => ({
                        name: item.mode_of_transport || item.name || "Unknown",
                        km: parseFloat(item.distance_km) || 0,
                        emission: parseFloat(item.transport_mode_emission_factor_value_kg_co2e_t_km) || 0,
                        color: COLOR_PALETTE[index % COLOR_PALETTE.length]
                    }));
                    setCorrelationData(formatted);
                }
                setIsLoadingCorrelation(false);
            };
            fetchCorrelationData();
        }
    }, [selectedClient, selectedSupplier]);

    const formatYAxis = (value: number) => {
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`.replace('.0k', 'k');
        return value.toString();
    };

    const renderTransportMode = (isModal = false) => {
        if (isLoadingMode) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            );
        }

        if (modeData.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                    {selectedClient ? "No data found for this selection" : "Select a client to view emission data"}
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modeData} margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis
                        yAxisId="left"
                        width={45}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        tickFormatter={formatYAxis}
                    />
                    <YAxis
                        yAxisId="percent"
                        orientation="left"
                        domain={[0, 100]}
                        width={45}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#1A5D1A' }}
                        tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar yAxisId="left" dataKey="distance" fill="#52C41A" radius={[4, 4, 0, 0]} name="Distance (km)" />
                    <Bar yAxisId="left" dataKey="emission" fill="#B3E699" radius={[4, 4, 0, 0]} name="CO₂e (kg)" />
                    <Bar yAxisId="percent" dataKey="share" fill="#1A5D1A" radius={[4, 4, 0, 0]} name="Share (%)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderDistanceCorrelation = (isModal = false) => {
        if (isLoadingCorrelation) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            );
        }

        if (correlationData.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                    {selectedClient ? "No correlation data found" : "Select a client to view correlation data"}
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={correlationData} margin={{ top: 20, right: 30, left: 40, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 8, fill: '#9CA3AF' }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        tickFormatter={formatYAxis}
                    />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '40px' }}
                    />
                    <Bar dataKey="km" fill="#52C41A" radius={[4, 4, 0, 0]} name="Distance (km)" />
                    <Bar dataKey="emission" fill="#B3E699" radius={[4, 4, 0, 0]} name="Emission (kg CO₂e/ton)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderDropdown = (
        label: string,
        options: any[],
        selected: any,
        setSelected: (val: any) => void,
        isOpen: boolean,
        setIsOpen: (val: boolean) => void,
        icon: React.ReactNode,
        placeholder: string,
        displayKey: string,
        valueKey: string
    ) => (
        <div className="w-full md:w-64 space-y-2 relative">
            <label className="text-xs font-bold text-gray-500 block mb-2">{label}</label>
            <div
                className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 cursor-pointer shadow-sm hover:border-green-200 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">{icon}</span>
                    <span>{selected ? selected[displayKey] : placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <div
                            key={option[valueKey]}
                            className="px-4 py-2.5 text-sm text-gray-600 hover:bg-green-50 hover:text-green-600 cursor-pointer transition-colors"
                            onClick={() => {
                                setSelected(option);
                                setIsOpen(false);
                            }}
                        >
                            {option[displayKey]}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="px-4 py-2.5 text-sm text-gray-400">No {label.toLowerCase()} available</div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6">
            <div className="mx-auto">
                <DetailedHeader
                    title="Transportation Emission Details"
                    subtitle="Comprehensive analysis of emissions from various transportation methods"
                    onBack={() => navigate("/dashboard")}
                    icon={Truck}
                />

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {renderDropdown(
                        "Select Client",
                        clients,
                        selectedClient,
                        setSelectedClient,
                        isClientDropdownOpen,
                        setIsClientDropdownOpen,
                        <Users className="w-4 h-4" />,
                        "Select Client",
                        "user_name",
                        "user_id"
                    )}

                    {renderDropdown(
                        "Supplier",
                        suppliers,
                        selectedSupplier,
                        setSelectedSupplier,
                        isSupplierDropdownOpen,
                        setIsSupplierDropdownOpen,
                        <Truck className="w-4 h-4" />,
                        "Select Supplier",
                        "supplier_name",
                        "sup_id"
                    )}
                </div>

                <div className="space-y-6">
                    <ChartCard title="Mode of Transportation Emission" showExpand onExpand={() => setExpandedChart("mode")}>
                        {renderTransportMode()}
                    </ChartCard>
                    <ChartCard title="Distance vs Emission Correlation" showExpand onExpand={() => setExpandedChart("correlation")}>
                        {renderDistanceCorrelation()}
                    </ChartCard>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal isOpen={expandedChart === "mode"} onClose={() => setExpandedChart(null)} title="Mode of Transportation Emission">
                {renderTransportMode(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "correlation"} onClose={() => setExpandedChart(null)} title="Distance vs Emission Correlation">
                {renderDistanceCorrelation(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedTransportationEmission;
