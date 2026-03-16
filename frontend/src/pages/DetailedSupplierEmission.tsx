import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    ChevronDown,
    Truck,
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

interface Component {
    component_id: string;
    component_name: string;
}

interface EmissionDataItem {
    name: string;
    emission: number;
    color?: string;
}

interface ComparisonDataItem {
    name: string;
    value: number;
    color?: string;
}

const COLOR_PALETTE = ["#D9F5C5", "#B3E699", "#8CD76D", "#66C841", "#40B915", "#1A5D1A", "#347C17"];

const DetailedSupplierEmission: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    // State for Dropdowns
    const [clients, setClients] = useState<Client[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [components, setComponents] = useState<Component[]>([]);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [isComponentDropdownOpen, setIsComponentDropdownOpen] = useState(false);

    // State for Charts
    const [supplierEmissionData, setSupplierEmissionData] = useState<EmissionDataItem[]>([]);
    const [materialComparisonData, setMaterialComparisonData] = useState<ComparisonDataItem[]>([]);

    const [isEmissionLoading, setIsEmissionLoading] = useState(false);
    const [isComparisonLoading, setIsComparisonLoading] = useState(false);

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

    // Fetch Suppliers and Components when Client is selected
    useEffect(() => {
        if (selectedClient) {
            const fetchExtras = async () => {
                const supplierResult = await dashboardService.getSupplierDropdown(selectedClient.user_id);
                if (supplierResult.success && supplierResult.data) {
                    setSuppliers(supplierResult.data);
                }

                const componentResult = await dashboardService.getComponentDropdown(selectedClient.user_id);
                if (componentResult.success && componentResult.data) {
                    setComponents(componentResult.data);
                }
            };
            fetchExtras();
            // Reset dependent dropdowns
            setSelectedSupplier(null);
            setSelectedComponent(null);
            setSupplierEmissionData([]);
            setMaterialComparisonData([]);
        } else {
            setSuppliers([]);
            setComponents([]);
        }
    }, [selectedClient]);

    // Fetch Supplier Emission Data
    useEffect(() => {
        if (selectedClient && selectedSupplier) {
            const fetchEmissionData = async () => {
                setIsEmissionLoading(true);
                const result = await dashboardService.getSupplierEmission(selectedClient.user_id, selectedSupplier.sup_id);
                if (result.success && result.data) {
                    const formattedData = result.data.map((item: any, index: number) => ({
                        name: item.component_name || item.name || "Unknown",
                        emission: parseFloat(item.overall_total_pcf) || parseFloat(item.emission) || 0,
                        color: COLOR_PALETTE[index % COLOR_PALETTE.length]
                    }));
                    setSupplierEmissionData(formattedData);
                }
                setIsEmissionLoading(false);
            };
            fetchEmissionData();
        } else {
            setSupplierEmissionData([]);
        }
    }, [selectedClient, selectedSupplier]);

    // Fetch Material Comparison Data
    useEffect(() => {
        if (selectedClient && selectedComponent) {
            const fetchComparisonData = async () => {
                setIsComparisonLoading(true);
                const result = await dashboardService.getSupplierMaterialComparison(selectedClient.user_id, selectedComponent.component_name);
                if (result.success && result.data) {
                    const formattedData = result.data.map((item: any, index: number) => ({
                        name: item.supplier_name || item.name || "Unknown",
                        value: parseFloat(item.total_material_emission) || parseFloat(item.overall_total_pcf) || parseFloat(item.emission) || 0,
                        color: COLOR_PALETTE[index % COLOR_PALETTE.length]
                    }));
                    setMaterialComparisonData(formattedData);
                }
                setIsComparisonLoading(false);
            };
            fetchComparisonData();
        } else {
            setMaterialComparisonData([]);
        }
    }, [selectedClient, selectedComponent]);

    const renderEmissionByMaterial = (isModal = false) => {
        if (isEmissionLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            );
        }

        if (supplierEmissionData.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                    {selectedSupplier ? "No data found for this selection" : "Select a client and supplier to view emission data"}
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierEmissionData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#9CA3AF' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar dataKey="emission" radius={[4, 4, 0, 0]} barSize={isModal ? 100 : 60} name="Emission (kg CO₂e/kg)">
                        {supplierEmissionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderSupplierComparison = (isModal = false) => {
        if (isComparisonLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            );
        }

        if (materialComparisonData.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                    {selectedComponent ? "No data found for this selection" : "Select a client and component to view comparison data"}
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#9CA3AF' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                    <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={isModal ? 100 : 60} name="Emission Comparison (kg CO₂e/kg)">
                        {materialComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
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
                    title="Comprehensive Supplier Emission Breakdown"
                    subtitle="Detailed analysis of carbon footprint across all supplier partners"
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

                    {renderDropdown(
                        "Component",
                        components,
                        selectedComponent,
                        setSelectedComponent,
                        isComponentDropdownOpen,
                        setIsComponentDropdownOpen,
                        <Package className="w-4 h-4" />,
                        "Select Component",
                        "component_name",
                        "component_id"
                    )}
                </div>

                {/* Charts */}
                <div className="space-y-6">
                    <ChartCard
                        title="Emission (kg CO₂e/kg)"
                        showExpand
                        onExpand={() => setExpandedChart("material")}
                    >
                        {renderEmissionByMaterial()}
                    </ChartCard>

                    <ChartCard
                        title="Supplier Material Emission Comparison"
                        showExpand
                        onExpand={() => setExpandedChart("supplier")}
                    >
                        {renderSupplierComparison()}
                    </ChartCard>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal
                isOpen={expandedChart === "material"}
                onClose={() => setExpandedChart(null)}
                title="Emission (kg CO₂e/kg) by Material/Supplier"
            >
                {renderEmissionByMaterial(true)}
            </ChartModal>

            <ChartModal
                isOpen={expandedChart === "supplier"}
                onClose={() => setExpandedChart(null)}
                title="Supplier Material Emission Comparison"
            >
                {renderSupplierComparison(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedSupplierEmission;
