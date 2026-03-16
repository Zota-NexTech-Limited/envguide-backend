import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    ChevronDown,
    Package
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
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

const packagingRecyclabilityData = [
    { name: "Corrugated Cardboard", share: 48, recyclability: 90 },
    { name: "LDPE Film", share: 22, recyclability: 75 },
    { name: "PET Plastic", share: 25, recyclability: 85 },
    { name: "Metal Cap", share: 10, recyclability: 100 },
];

const packagingEmissionData = [
    { name: "Corrugated Cardboard", mass: 0.5, factor: 0.8, emission: 0.4 },
    { name: "LDPE Film", mass: 0.15, factor: 2.1, emission: 0.31 },
    { name: "PET Plastic", mass: 0.2, factor: 2.5, emission: 0.8 },
    { name: "Metal Cap", mass: 0.05, factor: 3.2, emission: 0.16 },
];

const DetailedPackagingEmission: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    // Fetch Clients
    useEffect(() => {
        const fetchClients = async () => {
            const result = await dashboardService.getClientsDropdown();
            if (result.status === true || result.success === true || result.data) {
                const clientList = Array.isArray(result.data) ? result.data : (result.data?.data && Array.isArray(result.data.data) ? result.data.data : []);
                setClients(clientList);
            }
        };
        fetchClients();
    }, []);

    // Set Client from Navigation
    useEffect(() => {
        if (location.state?.selectedClient) {
            setSelectedClient(location.state.selectedClient);
        }
    }, [location.state]);

    const renderRecyclability = (isModal = false) => {
        if (!selectedClient) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400 italic">
                    Select a client to view packaging recyclability data
                </div>
            );
        }
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packagingRecyclabilityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar dataKey="share" fill="#52C41A" radius={[4, 4, 0, 0]} name="Share (%)" />
                    <Bar dataKey="recyclability" fill="#D9F5C5" radius={[4, 4, 0, 0]} name="Recyclability (%)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderEmission = (isModal = false) => {
        if (!selectedClient) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400 italic">
                    Select a client to view packaging emission data
                </div>
            );
        }
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packagingEmissionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar dataKey="mass" fill="#D9F5C5" radius={[4, 4, 0, 0]} name="Mass (kg/unit)" />
                    <Bar dataKey="factor" fill="#B3E699" radius={[4, 4, 0, 0]} name="Emission Factor (kg CO₂e/kg)" />
                    <Bar dataKey="emission" fill="#52C41A" radius={[4, 4, 0, 0]} name="Emission (kg CO₂e/unit)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6">
            <div className="mx-auto">
                <DetailedHeader
                    title="Packaging Emission Details"
                    subtitle="In-depth analysis of packaging carbon footprint"
                    onBack={() => navigate("/dashboard")}
                    icon={Package}
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

                <div className="space-y-6">
                    <ChartCard title="Packaging Material and Recyclability" showExpand onExpand={() => setExpandedChart("recyclability")}>
                        {renderRecyclability()}
                    </ChartCard>
                    <ChartCard title="Packaging Emission" showExpand onExpand={() => setExpandedChart("emission")}>
                        {renderEmission()}
                    </ChartCard>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal isOpen={expandedChart === "recyclability"} onClose={() => setExpandedChart(null)} title="Packaging Material and Recyclability">
                {renderRecyclability(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "emission"} onClose={() => setExpandedChart(null)} title="Packaging Emission">
                {renderEmission(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedPackagingEmission;
