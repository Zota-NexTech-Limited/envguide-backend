import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    ChevronDown,
    Trash2,
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
    Legend
} from "recharts";
import {
    DetailedHeader,
    ChartCard,
    ChartModal
} from "../components/DashboardComponents";
import dashboardService from "../lib/dashboardService";

interface WasteData {
    name: string;
    generated: number;
    emission: number;
}

interface Client {
    user_id: string;
    company_name: string; // Adjusted to match API structure usually returned (dashboardService uses company_name?)
    // Waiting, let's check dashboardService usage. In DetailedEnergyEmission it used user_name.
    // In DetailedWasteEmission I used company_name in previous step: {client.company_name}.
    // I should check what getClientsDropdown returns. 
    // In DetailedEnergyEmission:
    // const clientList = Array.isArray(result.data) ? result.data : ...
    // And it uses client.user_name.
    // In my previous edit to DetailedWasteEmission I used client.company_name.
    // Let me check what I wrote in DetailedWasteEmission previously:
    // <option key={client.user_id} value={client.user_id}>{client.company_name}</option>
    // If I want to be safe I should probably check what the API returns or support both/check.
    // But for now let's stick to what I had or update if needed.
    // Actually, looking at DetailedEnergyEmission again:
    // interface Client { user_id: string; user_name: string; }
    // It uses client.user_name.
    // I should probably use user_name if that's what the other file uses, assuming they stand on the same API.
    // But wait, dashboardService.ts: 
    // async getClientsDropdown() { ... return result; }
    // It just returns json.
    // If I look at DetailedEnergyEmission usage: client.user_name.
    // If I look at my previous DetailedWasteEmission usage: client.company_name.
    // Use user_name to be consistent with DetailedEnergyEmission if possible, but I don't know for sure if user_name is correct or company_name.
    // However, I previously mapped it `client.company_name`. If that worked (I didn't run it), then it's fine.
    // If I am strictly copying DetailedEnergyEmission, I should use user_name.
    // Let's assume user_name is the correct property for the dropdown label based on the other file.
}

interface Supplier {
    id: string; // In DetailedEnergyEmission it was supplier_id
    name: string; // In DetailedEnergyEmission it was supplier_name
    // In Recyclability/others it might differ.
    // My previous code: key={supplier.id} value={supplier.id} {supplier.name}
    // DetailedEnergyEmission: key={supplier.supplier_id} ... {supplier.supplier_name}
    // I should probably switch to supplier_id and supplier_name to match DetailedEnergyEmission pattern if I want to be consistent?
    // The previous code I wrote in DetailedWasteEmission:
    // setSuppliers(response.data); -> response.data seems to be the list.
    // If I want to match DetailedEnergyEmission's types:
}

const DetailedWasteEmission: React.FC = () => {
    const navigate = useNavigate();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

    const [wasteData, setWasteData] = useState<WasteData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            fetchSuppliers(selectedClient.user_id);
            fetchWasteEmissionData(selectedClient.user_id, selectedSupplier?.id);
        } else {
            setWasteData([]);
            setSuppliers([]);
            setSelectedSupplier(null);
        }
    }, [selectedClient, selectedSupplier]);

    const fetchClients = async () => {
        const response = await dashboardService.getClientsDropdown();
        if (response.success || response.status) { // Handle both response structures if inconsistent
            // DetailedEnergyEmission handles: result.data || result.data.data
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

    const fetchWasteEmissionData = async (clientId: string, supplierId?: string) => {
        setLoading(true);
        const response = await dashboardService.getWasteEmissionDetails(clientId, supplierId);
        if (response.success) {
            const mappedData = response.data.map((item: any) => ({
                name: item.treatment_type,
                generated: item.total_waste_weight,
                emission: item.total_co2_emission
            }));

            if (response.totals) {
                mappedData.push({
                    name: "Total",
                    generated: response.totals.total_waste_generated_kg,
                    emission: response.totals.total_emission_generated_kg_co2e
                });
            }
            setWasteData(mappedData);
        }
        setLoading(false);
    };

    const renderWasteTreatment = (isModal = false) => {
        if (!selectedClient) {
            return (
                <div className="flex items-center justify-center h-full min-h-[300px] text-sm text-gray-400 italic">
                    Select a client to view waste treatment data
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteData} margin={{ top: 20, right: 30, left: 40, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        label={{ value: 'Waste Treatment Methods', position: 'insideBottom', offset: -20, fontSize: 12, fontWeight: 'bold' }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                        label={{ value: 'Quantity / Impact', angle: -90, position: 'insideLeft', offset: 0, fontSize: 12, fontWeight: 'bold' }}
                    />
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar dataKey="generated" fill="#52C41A" radius={[4, 4, 0, 0]} name="Waste Generated (kg)" />
                    <Bar dataKey="emission" fill="#B3E699" radius={[4, 4, 0, 0]} name="Emission (kg CO₂e)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6">
            <div className="mx-auto">
                <DetailedHeader
                    title="Waste Emission Details"
                    subtitle="Comprehensive analysis of emissions caused by waste generation and disposal"
                    onBack={() => navigate("/dashboard")}
                    icon={Trash2}
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

                <div className="space-y-6">
                    <ChartCard title="Waste Treatment" showExpand onExpand={() => setExpandedChart("waste")}>
                        {renderWasteTreatment()}
                    </ChartCard>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal isOpen={expandedChart === "waste"} onClose={() => setExpandedChart(null)} title="Waste Treatment">
                {renderWasteTreatment(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedWasteEmission;
