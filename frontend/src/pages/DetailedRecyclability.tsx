import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    ChevronDown,
    RefreshCw,
    Factory
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

interface Client {
    user_id: string;
    user_name: string;
}

interface Supplier {
    supplier_id: string;
    supplier_name: string;
}

interface RecyclabilityItem {
    name: string;
    total: number;
    recycled: number;
    percent: number;
}

// Interface for Virgin/Recycled data - assuming structure based on graph name
// If strictly unknown, we can use any, but let's try to be type safe if possible or use any for flexible mapping
interface VirginRecycledItem {
    name: string;
    virgin: number;
    recycled: number;
    [key: string]: any;
}

const DetailedRecyclability: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

    const [recyclabilityData, setRecyclabilityData] = useState<RecyclabilityItem[]>([]);
    const [virginRecycledData, setVirginRecycledData] = useState<VirginRecycledItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Clients
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const result = await dashboardService.getClientsDropdown();
                if (result.success || result.status) {
                    const clientList = Array.isArray(result.data) ? result.data : (result.data?.data && Array.isArray(result.data.data) ? result.data.data : []);
                    setClients(clientList);
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };
        fetchClients();
    }, []);

    // Fetch Suppliers when Client Selects
    useEffect(() => {
        const fetchSuppliers = async () => {
            if (!selectedClient) {
                setSuppliers([]);
                return;
            }
            try {
                const result = await dashboardService.getSupplierDropdown(selectedClient.user_id);
                if (result.success || result.status) {
                    const supplierList = Array.isArray(result.data) ? result.data : (result.data?.data ? result.data.data : []);
                    setSuppliers(supplierList);
                }
            } catch (error) {
                console.error("Error fetching suppliers:", error);
            }
        };
        fetchSuppliers();
        setSelectedSupplier(null);
    }, [selectedClient]);

    // Fetch Graph Data
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedClient) {
                setRecyclabilityData([]);
                setVirginRecycledData([]);
                return;
            }

            setIsLoading(true);
            const clientId = selectedClient.user_id;
            const supplierId = selectedSupplier?.supplier_id;

            try {
                // Fetch Recyclability Data
                const recyclabilityRes = await dashboardService.getRecyclabilityEmission(clientId, supplierId);
                if (recyclabilityRes.success || recyclabilityRes.status) {
                    const data = recyclabilityRes.data || [];
                    const formatted: RecyclabilityItem[] = Array.isArray(data) ? data.map((item: any) => ({
                        name: item.material_type || "Unknown",
                        total: parseFloat(item.total_material_used_in_kg) || 0,
                        recycled: parseFloat(item.total_recycled_content_used_in_kg) || 0,
                        percent: parseFloat(item.total_recycled_material_percentage) || 0
                    })) : [];
                    setRecyclabilityData(formatted);
                }

                // Fetch Virgin / Recycled Data
                // Note: The prompt only specified client_id for this API call, but typically we might want to filter by supplier if the backend supports it.
                // However, sticking to prompt instructions for "use GET api/dashboard/virgin-or-recyclibility-emission?client_id=..."
                // If the user wants supplier filtering here too, we can add it, but strictly following prompt logic for this one.
                // Actually, logic usually dictates consistency. If supplier is selected, we might want to check if API supports it.
                // But prompt purely said: "for Virgin / Recycled graph use GET api/dashboard/virgin-or-recyclibility-emission?client_id=01K8GVAT2BMR1FN2T4057JZ50V"
                // It didn't mention supplier_id for this one, unlike Recyclability graph.
                const virginRes = await dashboardService.getVirginOrRecyclabilityEmission(clientId);
                if (virginRes.success || virginRes.status) {
                    const data = virginRes.data || [];
                    // Mapping strategy:
                    // If data is array of objects with material_type, virgin_emission, recycled_emission (hypothetically)
                    // We map it to display.
                    // If we don't know the exact keys, we'll try to map common patterns or use the data as is if it fits.
                    // Let's assume a structure similar to recyclability but with emission fields.
                    // API name: virgin-or-recyclibility-emission
                    // Likely returns: [{ material_type, virgin_emission, recycled_emission }, ...]
                    const formatted: VirginRecycledItem[] = Array.isArray(data) ? data.map((item: any) => ({
                        name: item.material_type || item.name || "Unknown",
                        virgin: parseFloat(item.virgin_emission || item.virgin || 0),
                        recycled: parseFloat(item.recycled_emission || item.recycled || item.recyclability_emission || 0)
                    })) : [];
                    setVirginRecycledData(formatted);
                }
            } catch (error) {
                console.error("Error fetching graph data:", error);
            }
            setIsLoading(false);
        };

        fetchData();
    }, [selectedClient, selectedSupplier]);

    const renderRecyclability = (isModal = false) => {
        if (!selectedClient) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400 italic">
                    Select a client to view recyclability data
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={recyclabilityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar yAxisId="left" dataKey="total" fill="#52C41A" radius={[4, 4, 0, 0]} name="Total Material Used (kg)" />
                    <Bar yAxisId="left" dataKey="recycled" fill="#B3E699" radius={[4, 4, 0, 0]} name="Recycled Content (kg)" />
                    <Line yAxisId="right" type="linear" dataKey="percent" stroke="#1A5D1A" strokeWidth={3} dot={{ fill: '#1A5D1A', r: 4 }} name="% Recycled Material" />
                </ComposedChart>
            </ResponsiveContainer>
        );
    };

    const renderVirginRecycled = (isModal = false) => {
        if (!selectedClient) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400 italic">
                    Select a client to view virgin vs recycled data
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={virginRecycledData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar dataKey="virgin" fill="#D9F5C5" radius={[4, 4, 0, 0]} name="Virgin Emission" />
                    <Bar dataKey="recycled" fill="#52C41A" radius={[4, 4, 0, 0]} name="Recycled Emission" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6">
            <div className="mx-auto">
                <DetailedHeader
                    title="Recyclability Metrics - Detailed View"
                    subtitle="Comprehensive analysis of material recyclability and circularity metrics across product components"
                    onBack={() => navigate("/dashboard")}
                    icon={RefreshCw}
                />

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

                    {/* Supplier Dropdown */}
                    <div className="w-full md:w-64 relative">
                        <label className="text-xs font-bold text-gray-500 block mb-2">Select Supplier</label>
                        <div
                            className={`flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 cursor-pointer ${!selectedClient ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => selectedClient && setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <Factory className="w-4 h-4 text-gray-400" />
                                <span>{selectedSupplier ? selectedSupplier.supplier_name : "Select Supplier"}</span>
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
                                        key={supplier.supplier_id}
                                        className="px-4 py-2.5 text-sm text-gray-600 hover:bg-green-50 hover:text-green-600 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setSelectedSupplier(supplier);
                                            setIsSupplierDropdownOpen(false);
                                        }}
                                    >
                                        {supplier.supplier_name}
                                    </div>
                                ))}
                                {suppliers.length === 0 && (
                                    <div className="px-4 py-2.5 text-sm text-gray-400">No suppliers available</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <ChartCard title="Recyclability" showExpand onExpand={() => setExpandedChart("recyclability")}>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                        ) : (
                            renderRecyclability()
                        )}
                    </ChartCard>
                    <ChartCard title="Virgin / Recycled" showExpand onExpand={() => setExpandedChart("virgin-recycled")}>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                        ) : (
                            renderVirginRecycled()
                        )}
                    </ChartCard>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal isOpen={expandedChart === "recyclability"} onClose={() => setExpandedChart(null)} title="Recyclability">
                {renderRecyclability(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "virgin-recycled"} onClose={() => setExpandedChart(null)} title="Virgin / Recycled">
                {renderVirginRecycled(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedRecyclability;
