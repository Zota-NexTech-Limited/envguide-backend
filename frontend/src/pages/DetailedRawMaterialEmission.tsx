import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Calendar,
    Users,
    ChevronDown,
    Box,
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
    LineChart,
    Line,
    Legend,
    ComposedChart
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

const manufacturingProcessData = [
    { name: "Extrusion", energy: 12.5, emission: 4.2 },
    { name: "Injection Molding", energy: 18.0, emission: 6.1 },
    { name: "Drying", energy: 9.2, emission: 3.1 },
    { name: "Assembly", energy: 4.5, emission: 1.5 },
    { name: "Finishing", energy: 8.0, emission: 2.7 },
];

const processEnergyData = [
    { name: "Electricity", extrusion: 45, molding: 52, drying: 48 },
    { name: "Natural Gas", extrusion: 30, molding: 20, drying: 25 },
    { name: "Steam", extrusion: 15, molding: 10, drying: 18 },
    { name: "Renewable", extrusion: 5, molding: 8, drying: 6 },
];

const materialCompositionData = [
    { name: "PP", contribution: 1200, share: 25 },
    { name: "PE", contribution: 950, share: 18 },
    { name: "PET", contribution: 1500, share: 30 },
    { name: "PVC", contribution: 820, share: 20 },
    { name: "Recycled PET", contribution: 450, share: 12 },
];

const emissionShareData = [
    { name: "Aluminum", value: 35, color: "#1A5D1A" },
    { name: "Polypropylene", value: 24, color: "#458C21" },
    { name: "HDPE", value: 18, color: "#52C41A" },
    { name: "Steel", value: 12, color: "#74B72E" },
    { name: "Paper/Cardboard", value: 7, color: "#98FB98" },
    { name: "Rubber/Additives", value: 4, color: "#C1FFC1" },
];

const carbonIntensityData = [
    { name: "Aluminum", virgin: 12.5, recycled: 0.5 },
    { name: "Steel", virgin: 2.5, recycled: 0.4 },
    { name: "Copper", virgin: 4.8, recycled: 0.8 },
    { name: "PET Plastic", virgin: 2.2, recycled: 0.5 },
    { name: "Glass", virgin: 0.8, recycled: 0.2 },
];

const DetailedRawMaterialEmission: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    // State for Dropdowns
    const [clients, setClients] = useState<Client[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

    // State for Graph Data
    const [manufacturingData, setManufacturingData] = useState<any[]>([]);
    const [processEnergyData, setProcessEnergyData] = useState<any[]>([]);
    const [materialCompData, setMaterialCompData] = useState<any[]>([]);
    const [intensityData, setIntensityData] = useState<any[]>([]);
    const [shareData, setShareData] = useState<any[]>([]);

    useEffect(() => {
        if (location.state?.selectedClient) {
            setSelectedClient(location.state.selectedClient);
        }
    }, [location.state]);

    // Fetch Clients
    // Loading States
    const [isLoadingManufacturing, setIsLoadingManufacturing] = useState(false);
    const [isLoadingEnergy, setIsLoadingEnergy] = useState(false);
    const [isLoadingComp, setIsLoadingComp] = useState(false);
    const [isLoadingIntensity, setIsLoadingIntensity] = useState(false);
    const [isLoadingShare, setIsLoadingShare] = useState(false);

    const COLOR_PALETTE = ["#1A5D1A", "#458C21", "#52C41A", "#74B72E", "#98FB98", "#C1FFC1", "#D9F5C5"];

    // Fetch Clients on Mount
    useEffect(() => {
        const fetchClients = async () => {
            const result = await dashboardService.getClientsDropdown();
            if (result.success && Array.isArray(result.data)) {
                setClients(result.data);
            } else {
                setClients([]);
            }
        };
        fetchClients();
    }, []);

    // Fetch Suppliers and Client-level Graph Data
    useEffect(() => {
        if (selectedClient) {
            const fetchSuppliers = async () => {
                const result = await dashboardService.getSupplierDropdown(selectedClient.user_id);
                if (result.success && Array.isArray(result.data)) {
                    setSuppliers(result.data);
                } else {
                    setSuppliers([]);
                }
            };

            const fetchManufacturing = async () => {
                setIsLoadingManufacturing(true);
                const result = await dashboardService.getManufacturingProcessEmission(selectedClient.user_id);
                console.log("Manufacturing result:", result);
                if (result.success && Array.isArray(result.data)) {
                    const mapped = result.data.map((item: any) => ({
                        name: item.process_specific_energy_type || item.process_name || item.name,
                        energy: parseFloat(item.quantity_consumed) || parseFloat(item.energy_used) || 0,
                        emission: parseFloat(item.emission_value) || parseFloat(item.carbon_emission) || 0
                    }));
                    setManufacturingData(mapped);
                } else {
                    setManufacturingData([]);
                }
                setIsLoadingManufacturing(false);
            };

            const fetchEnergy = async () => {
                setIsLoadingEnergy(true);
                const result = await dashboardService.getProcessEnergyEmission(selectedClient.user_id);
                console.log("Energy result:", result);
                if (result.success && result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
                    // Pivot logic for grouped energy data
                    const pivotMap: { [key: string]: any } = {};
                    Object.entries(result.data).forEach(([energyType, processes]: [string, any]) => {
                        if (Array.isArray(processes)) {
                            processes.forEach((item: any) => {
                                const processName = item.process_specific_energy_type || item.process_name || "Unknown";
                                if (!pivotMap[processName]) {
                                    pivotMap[processName] = { name: processName };
                                }
                                pivotMap[processName][energyType] = parseFloat(item.quantity_consumed) || parseFloat(item.value) || 0;
                            });
                        }
                    });
                    setProcessEnergyData(Object.values(pivotMap));
                } else if (result.success && Array.isArray(result.data)) {
                    setProcessEnergyData(result.data);
                } else {
                    setProcessEnergyData([]);
                }
                setIsLoadingEnergy(false);
            };

            const fetchComp = async () => {
                setIsLoadingComp(true);
                const result = await dashboardService.getMaterialCompositionEmission(selectedClient.user_id);
                console.log("Comp result:", result);
                if (result.success && Array.isArray(result.data)) {
                    const mapped = result.data.map((item: any) => ({
                        name: item.material_type || item.material_name || item.name,
                        contribution: parseFloat(item.emission_contribution) || parseFloat(item.total_emission_value) || 0,
                        share: parseFloat(item.share_of_total_percentage) || parseFloat(item.share_percentage) || 0
                    }));
                    setMaterialCompData(mapped);
                } else {
                    setMaterialCompData([]);
                }
                setIsLoadingComp(false);
            };

            const fetchIntensity = async () => {
                setIsLoadingIntensity(true);
                const result = await dashboardService.getMaterialCarbonIntensityEmission(selectedClient.user_id);
                console.log("Intensity result:", result);
                if (result.success && result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
                    const virgin = result.data.virgin_material || [];
                    const recycled = result.data.recycled_material || [];

                    const mergedMap: { [key: string]: any } = {};
                    virgin.forEach((item: any) => {
                        const name = item.material_type || "Unknown";
                        mergedMap[name] = {
                            name,
                            virgin: parseFloat(item.carbon_intensity) || parseFloat(item.material_emission_factor) || 0,
                            recycled: 0
                        };
                    });
                    recycled.forEach((item: any) => {
                        const name = item.material_type || "Unknown";
                        if (!mergedMap[name]) {
                            mergedMap[name] = {
                                name,
                                virgin: 0,
                                recycled: parseFloat(item.carbon_intensity) || parseFloat(item.material_emission_factor) || 0
                            };
                        } else {
                            mergedMap[name].recycled = parseFloat(item.carbon_intensity) || parseFloat(item.material_emission_factor) || 0;
                        }
                    });
                    setIntensityData(Object.values(mergedMap));
                } else if (result.success && Array.isArray(result.data)) {
                    const mapped = result.data.map((item: any) => ({
                        name: item.material_name || item.name || item.material_type,
                        virgin: parseFloat(item.virgin_material_intensity) || 0,
                        recycled: parseFloat(item.recycled_material_intensity) || 0
                    }));
                    setIntensityData(mapped);
                } else {
                    setIntensityData([]);
                }
                setIsLoadingIntensity(false);
            };

            const fetchShare = async () => {
                setIsLoadingShare(true);
                const result = await dashboardService.getPercentageShareOfTotalEmission(selectedClient.user_id);
                console.log("Share result:", result);
                if (result.success && Array.isArray(result.data)) {
                    const mapped = result.data.map((item: any, index: number) => ({
                        name: item.material || item.name || item.material_name || item.material_type || "Unknown",
                        value: parseFloat(item.percentage_share) || parseFloat(item.value) || parseFloat(item.percentage) || parseFloat(item.share_of_total_percentage) || 0,
                        color: COLOR_PALETTE[index % COLOR_PALETTE.length]
                    }));
                    setShareData(mapped);
                } else {
                    setShareData([]);
                }
                setIsLoadingShare(false);
            };

            fetchSuppliers();
            fetchManufacturing();
            fetchEnergy();
            fetchComp();
            fetchIntensity();
            fetchShare();
            setSelectedSupplier(null);
        } else {
            setSuppliers([]);
            setManufacturingData([]);
            setProcessEnergyData([]);
            setMaterialCompData([]);
            setIntensityData([]);
            setShareData([]);
        }
    }, [selectedClient]);

    // Fetch Supplier-specific Data
    useEffect(() => {
        if (selectedClient && selectedSupplier) {
            const fetchSupplierComp = async () => {
                setIsLoadingComp(true);
                const result = await dashboardService.getMaterialCompositionEmission(selectedClient.user_id, selectedSupplier.sup_id);
                if (result.success && Array.isArray(result.data)) {
                    const mapped = result.data.map((item: any) => ({
                        name: item.material_type || item.material_name || item.name,
                        contribution: parseFloat(item.emission_contribution) || parseFloat(item.total_emission_value) || 0,
                        share: parseFloat(item.share_of_total_percentage) || parseFloat(item.share_percentage) || 0
                    }));
                    setMaterialCompData(mapped);
                } else {
                    setMaterialCompData([]);
                }
                setIsLoadingComp(false);
            };

            const fetchSupplierIntensity = async () => {
                setIsLoadingIntensity(true);
                const result = await dashboardService.getMaterialCarbonIntensityEmission(selectedClient.user_id, selectedSupplier.sup_id);
                if (result.success && result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
                    const virgin = result.data.virgin_material || [];
                    const recycled = result.data.recycled_material || [];

                    const mergedMap: { [key: string]: any } = {};
                    virgin.forEach((item: any) => {
                        const name = item.material_type || "Unknown";
                        mergedMap[name] = {
                            name,
                            virgin: parseFloat(item.carbon_intensity) || parseFloat(item.material_emission_factor) || 0,
                            recycled: 0
                        };
                    });
                    recycled.forEach((item: any) => {
                        const name = item.material_type || "Unknown";
                        if (!mergedMap[name]) {
                            mergedMap[name] = {
                                name,
                                virgin: 0,
                                recycled: parseFloat(item.carbon_intensity) || parseFloat(item.material_emission_factor) || 0
                            };
                        } else {
                            mergedMap[name].recycled = parseFloat(item.carbon_intensity) || parseFloat(item.material_emission_factor) || 0;
                        }
                    });
                    setIntensityData(Object.values(mergedMap));
                } else {
                    setIntensityData([]);
                }
                setIsLoadingIntensity(false);
            };

            const fetchSupplierShare = async () => {
                setIsLoadingShare(true);
                const result = await dashboardService.getPercentageShareOfTotalEmission(selectedClient.user_id, selectedSupplier.sup_id);
                if (result.success && Array.isArray(result.data)) {
                    const mapped = result.data.map((item: any, index: number) => ({
                        name: item.material || item.name || item.material_name || item.material_type || "Unknown",
                        value: parseFloat(item.percentage_share) || parseFloat(item.value) || parseFloat(item.percentage) || parseFloat(item.share_of_total_percentage) || 0,
                        color: COLOR_PALETTE[index % COLOR_PALETTE.length]
                    }));
                    setShareData(mapped);
                } else {
                    setShareData([]);
                }
                setIsLoadingShare(false);
            };

            fetchSupplierComp();
            fetchSupplierIntensity();
            fetchSupplierShare();
        }
    }, [selectedSupplier, selectedClient]);

    const renderLoader = () => (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
    );

    const renderNoData = (msg: string) => (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
            {msg}
        </div>
    );

    const renderManufacturingProcess = (isModal = false) => {
        if (isLoadingManufacturing) return renderLoader();
        if (manufacturingData.length === 0) return renderNoData("Select a client to view data");

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={manufacturingData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                    <Legend verticalAlign="top" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }} />
                    <Bar dataKey="energy" fill="#458C21" radius={[4, 4, 0, 0]} barSize={isModal ? 60 : 30} name="Energy Used (kWh/unit)" />
                    <Bar dataKey="emission" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={isModal ? 60 : 30} name="CO₂e (kg/unit)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderProcessEnergy = (isModal = false) => {
        if (isLoadingEnergy) return renderLoader();
        if (processEnergyData.length === 0) return renderNoData("Select a client to view data");

        // Dynamically get energy types (keys excluding 'name')
        const energyTypes = Object.keys(processEnergyData[0] || {}).filter(key => key !== 'name');

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processEnergyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                    <Legend verticalAlign="top" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }} />
                    {energyTypes.map((type, index) => (
                        <Bar key={type} dataKey={type} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} radius={[4, 4, 0, 0]} name={type.charAt(0).toUpperCase() + type.slice(1)} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderMaterialComposition = (isModal = false) => {
        if (isLoadingComp) return renderLoader();
        if (materialCompData.length === 0) return renderNoData("Select a client to view data");

        return (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={materialCompData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Legend verticalAlign="top" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }} />
                    <Bar yAxisId="left" dataKey="contribution" fill="#52C41A" radius={[4, 4, 0, 0]} name="Emission Contribution (kg CO₂e)" barSize={isModal ? 60 : 30} />
                    <Line yAxisId="right" type="monotone" dataKey="share" stroke="#1A5D1A" strokeWidth={3} name="Share of Total (%)" dot={{ fill: '#1A5D1A', r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
            </ResponsiveContainer>
        );
    };

    const renderMaterialCarbonIntensity = (isModal = false) => {
        if (isLoadingIntensity) return renderLoader();
        if (intensityData.length === 0) return renderNoData("Select a client to view data");

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intensityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                    <Legend verticalAlign="top" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }} />
                    <Bar dataKey="virgin" fill="#458C21" radius={[4, 4, 0, 0]} barSize={isModal ? 60 : 30} name="Virgin Material (kg CO₂e/kg)" />
                    <Bar dataKey="recycled" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={isModal ? 60 : 30} name="Recycled Material (kg CO₂e/kg)" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderEmissionShare = (isModal = false) => {
        if (isLoadingShare) return renderLoader();
        if (shareData.length === 0) return renderNoData("Select a client to view data");

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shareData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} />
                    <Legend verticalAlign="top" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={isModal ? 80 : 40} name="Share of Total (%)">
                        {shareData.map((entry, index) => (
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
                    title="Raw Material Emission Details"
                    subtitle="Comprehensive breakdown of material-specific carbon footprint"
                    onBack={() => navigate("/dashboard")}
                    icon={Box}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Manufacturing Process Emission" showExpand onExpand={() => setExpandedChart("process")}>
                        {renderManufacturingProcess()}
                    </ChartCard>
                    <ChartCard title="Process Energy Emission" showExpand onExpand={() => setExpandedChart("energy")}>
                        {renderProcessEnergy()}
                    </ChartCard>
                    <ChartCard title="Material Composition" showExpand onExpand={() => setExpandedChart("composition")}>
                        {renderMaterialComposition()}
                    </ChartCard>
                    <ChartCard title="Material Carbon Intensity" showExpand onExpand={() => setExpandedChart("intensity")}>
                        {renderMaterialCarbonIntensity()}
                    </ChartCard>

                    <div className="lg:col-span-2">
                        <ChartCard title="% Share of Total Emission" showExpand onExpand={() => setExpandedChart("share")}>
                            {renderEmissionShare()}
                        </ChartCard>
                    </div>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal isOpen={expandedChart === "process"} onClose={() => setExpandedChart(null)} title="Manufacturing Process Emission">
                {renderManufacturingProcess(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "energy"} onClose={() => setExpandedChart(null)} title="Process Energy Emission">
                {renderProcessEnergy(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "composition"} onClose={() => setExpandedChart(null)} title="Material Composition">
                {renderMaterialComposition(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "intensity"} onClose={() => setExpandedChart(null)} title="Material Carbon Intensity">
                {renderMaterialCarbonIntensity(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "share"} onClose={() => setExpandedChart(null)} title="% Share of Total Emission">
                {renderEmissionShare(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedRawMaterialEmission;
