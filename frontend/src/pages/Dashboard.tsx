import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  Truck,
  Factory,
  RefreshCw,
  Users,
  ChevronDown,
  Package,
  Activity,
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
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  StatCard,
  ChartCard,
  DashboardHeader,
  ChartModal
} from "../components/DashboardComponents";
import { useDashboardPermissions } from "../contexts/PermissionContext";
import Welcome from "./Welcome";
import dashboardService from "../lib/dashboardService";

const COLOR_MAP: Record<string, string> = {
  "Raw Material": "#1A5D1A",
  "Manufacturing": "#458C21",
  "Packaging": "#74B72E",
  "Transportation": "#98FB98",
  "End of Life": "#C1FFC1",
};

interface Client {
  user_id: string;
  user_name: string;
}

interface LifeCycleDataItem {
  name: string;
  value: number;
  color: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const { canViewDashboard, loading: permissionsLoading } = useDashboardPermissions();

  // Client State
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Data States
  const [lifeCycleData, setLifeCycleData] = useState<LifeCycleDataItem[]>([]);
  const [supplierEmissionData, setSupplierEmissionData] = useState<any[]>([]);
  const [rawMaterialData, setRawMaterialData] = useState<any[]>([]);
  const [packagingData, setPackagingData] = useState<any[]>([]);
  const [transportationData, setTransportationData] = useState<any[]>([]);
  const [energyData, setEnergyData] = useState<any[]>([]);
  const [recyclabilityData, setRecyclabilityData] = useState<any[]>([]);
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [impactCategoriesData, setImpactCategoriesData] = useState<any[]>([]);
  const [pcfTrendData, setPcfTrendData] = useState<any[]>([]);

  // Loading States
  const [loading, setLoading] = useState({
    lifeCycle: false,
    supplier: false,
    rawMaterial: false,
    packaging: false,
    transportation: false,
    energy: false,
    recyclability: false,
    waste: false,
    impact: false,
    pcfTrend: false
  });

  React.useEffect(() => {
    const fetchClients = async () => {
      const result = await dashboardService.getClientsDropdown();
      if (result.status === true || result.success === true || result.data) {
        const clientList = Array.isArray(result.data) ? result.data : (result.data?.data && Array.isArray(result.data.data) ? result.data.data : []);
        setClients(clientList);
      }
    };
    fetchClients();
  }, []);

  React.useEffect(() => {
    if (!selectedClient) {
      // Reset all data if no client selected
      setLifeCycleData([]);
      setSupplierEmissionData([]);
      setRawMaterialData([]);
      setPackagingData([]);
      setTransportationData([]);
      setEnergyData([]);
      setRecyclabilityData([]);
      setWasteData([]);
      setImpactCategoriesData([]);
      setPcfTrendData([]);
      return;
    }

    const fetchAllData = async () => {
      const clientId = selectedClient.user_id;

      // 1. Life Cycle
      setLoading(prev => ({ ...prev, lifeCycle: true }));
      try {
        const res = await dashboardService.getProductLifeCycle(clientId);
        if (res.data?.data || res.data) {
          const data = res.data?.data || res.data;
          setLifeCycleData([
            { name: "Raw Material", value: parseFloat(data.raw_material) || 0, color: COLOR_MAP["Raw Material"] },
            { name: "Manufacturing", value: parseFloat(data.manufacturing) || 0, color: COLOR_MAP["Manufacturing"] },
            { name: "Packaging", value: parseFloat(data.packaging) || 0, color: COLOR_MAP["Packaging"] },
            { name: "Transportation", value: parseFloat(data.transportation) || 0, color: COLOR_MAP["Transportation"] },
            { name: "End of Life", value: parseFloat(data.waste) || 0, color: COLOR_MAP["End of Life"] },
          ]);
        }
      } catch (e) {
        setLifeCycleData([]);
      }
      setLoading(prev => ({ ...prev, lifeCycle: false }));

      // 2. Supplier (Fetch Dropdown -> First Supplier -> Emission)
      setLoading(prev => ({ ...prev, supplier: true }));
      try {
        const supRes = await dashboardService.getSupplierDropdown(clientId);
        const suppliers = Array.isArray(supRes.data) ? supRes.data : (supRes.data?.data ? supRes.data.data : []);
        if (suppliers.length > 0) {
          const firstSupplierId = suppliers[0].supplier_id || suppliers[0].id || suppliers[0].sup_id;
          const emissionRes = await dashboardService.getSupplierEmission(clientId, firstSupplierId);
          if (emissionRes.data) {
            const formatted = Array.isArray(emissionRes.data) ? emissionRes.data.map((item: any) => ({
              name: (item.material_name || item.name || "Unknown").substring(0, 10),
              value: parseFloat(item.emission) || 0
            })) : [];
            setSupplierEmissionData(formatted);
          } else {
            setSupplierEmissionData([]);
          }
        } else {
          setSupplierEmissionData([]);
        }
      } catch (e) {
        setSupplierEmissionData([]);
      }
      setLoading(prev => ({ ...prev, supplier: false }));

      // 3. Raw Material
      setLoading(prev => ({ ...prev, rawMaterial: true }));
      try {
        const res = await dashboardService.getManufacturingProcessEmission(clientId);
        if (res.data) {
          const formatted = res.data.map((item: any) => ({
            name: item.process_name || "Unknown",
            value: parseFloat(item.total_emission_kg_co2_eq) || 0
          }));
          setRawMaterialData(formatted);
        } else {
          setRawMaterialData([]);
        }
      } catch (e) {
        setRawMaterialData([]);
      }
      setLoading(prev => ({ ...prev, rawMaterial: false }));

      // 4. Packaging (Static for now, but enabled)
      setLoading(prev => ({ ...prev, packaging: true }));
      // Using static data as placeholder until real API
      setPackagingData([
        { name: "Cardboard", value: 120 },
        { name: "Film", value: 60 },
        { name: "Pallet", value: 40 },
        { name: "Tape", value: 14 },
      ]);
      setLoading(prev => ({ ...prev, packaging: false }));

      // 5. Transportation
      setLoading(prev => ({ ...prev, transportation: true }));
      try {
        const res = await dashboardService.getModeOfTransportationEmission(clientId);
        if (res.data) {
          const formatted = res.data.map((item: any) => ({
            name: item.mode_of_transport || "Unknown",
            value: parseFloat(item.co2e_kg) || 0
          }));
          setTransportationData(formatted);
        } else {
          setTransportationData([]);
        }
      } catch (e) {
        setTransportationData([]);
      }
      setLoading(prev => ({ ...prev, transportation: false }));

      // 6. Energy
      setLoading(prev => ({ ...prev, energy: true }));
      try {
        const res = await dashboardService.getEnergySourceEmission(clientId);
        if (res.data) {
          const formatted = res.data.map((item: any) => ({
            name: item.energy_source || "Unknown",
            value: parseFloat(item.total_emission_kg_co2_eq) || 0
          }));
          setEnergyData(formatted);
        } else {
          setEnergyData([]);
        }
      } catch (e) {
        setEnergyData([]);
      }
      setLoading(prev => ({ ...prev, energy: false }));

      // 7. Recyclability
      setLoading(prev => ({ ...prev, recyclability: true }));
      try {
        const res = await dashboardService.getRecyclabilityEmission(clientId);
        if (res.data) {
          const formatted = res.data.map((item: any) => ({
            name: item.material_type || "Unknown",
            value: parseFloat(item.total_recycled_material_percentage) || 0,
            color: item.total_recycled_material_percentage > 50 ? "#52C41A" : "#9CA3AF"
          }));
          setRecyclabilityData(formatted);
        } else {
          setRecyclabilityData([]);
        }
      } catch (e) {
        setRecyclabilityData([]);
      }
      setLoading(prev => ({ ...prev, recyclability: false }));

      // 8. Waste
      setLoading(prev => ({ ...prev, waste: true }));
      try {
        const res = await dashboardService.getWasteEmissionDetails(clientId);
        if (res.data) {
          const formatted = res.data.map((item: any) => ({
            name: (item.treatment_type || "Unknown").substring(0, 10),
            value: parseFloat(item.total_co2_emission) || 0
          }));
          setWasteData(formatted);
        } else {
          setWasteData([]);
        }
      } catch (e) {
        setWasteData([]);
      }
      setLoading(prev => ({ ...prev, waste: false }));

      // 9. Impact (Static)
      setLoading(prev => ({ ...prev, impact: true }));
      setImpactCategoriesData([
        { name: "GWP", value: 100 },
        { name: "ODP", value: 20 },
        { name: "AP", value: 45 },
        { name: "EP", value: 60 },
        { name: "POCP", value: 35 },
      ]);
      setLoading(prev => ({ ...prev, impact: false }));

      // 10. PCF Trend
      setLoading(prev => ({ ...prev, pcfTrend: true }));
      try {
        const res = await dashboardService.getPCFReductionEmission(clientId);
        if (res.data) {
          const formatted = res.data.map((item: any) => ({
            month: item.year ? item.year.toString() : (item.product_name || "Unknown"), // API returns product/year
            value: parseFloat(item.total_emission_kg_co2_eq) || 0
          }));
          setPcfTrendData(formatted);
        } else {
          setPcfTrendData([]);
        }
      } catch (e) {
        setPcfTrendData([]);
      }
      setLoading(prev => ({ ...prev, pcfTrend: false }));
    };

    fetchAllData();
  }, [selectedClient]);

  const renderNoClientState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="bg-gray-50 p-3 rounded-full mb-3">
        <Users className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900">No Client Selected</p>
      <p className="text-xs text-gray-500 mt-1">Select a client above to view emission data</p>
    </div>
  );

  const renderChartOrEmpty = (
    isLoading: boolean,
    data: any[],
    renderChart: () => React.ReactNode
  ) => {
    if (!selectedClient) return renderNoClientState();
    if (isLoading) return <div className="flex items-center justify-center h-full text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mr-2" />Loading...</div>;
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-gray-400">No data available</div>;
    return renderChart();
  };

  // Render Functions
  const renderProductLifeCycle = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={lifeCycleData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Tooltip cursor={{ fill: '#F9FAFB' }} />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} name="Emission (kg CO₂e)">
          {lifeCycleData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderSupplierEmission = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={supplierEmissionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Tooltip cursor={{ fill: '#F9FAFB' }} />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar dataKey="value" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={40} name="Emission (kg CO₂e)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderRawMaterialEmission = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rawMaterialData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Tooltip cursor={{ fill: '#F9FAFB' }} />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar dataKey="value" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={40} name="Emission (kg CO₂e)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPackagingEmission = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={packagingData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Tooltip cursor={{ fill: '#F9FAFB' }} />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar dataKey="value" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={40} name="Emission (kg CO₂e)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderTransportationEmission = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={transportationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Tooltip cursor={{ fill: '#F9FAFB' }} />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar dataKey="value" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={40} name="Emission (kg CO₂e)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderEnergyEmission = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={energyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Tooltip cursor={{ fill: '#F9FAFB' }} />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar dataKey="value" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={40} name="Energy Emission (kg CO₂e)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderRecyclability = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={recyclabilityData}
          cx="40%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ value }) => `${value}%`}
          labelLine={false}
        >
          {recyclabilityData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || "#52C41A"} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderWasteEmission = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={wasteData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Tooltip cursor={{ fill: '#F9FAFB' }} />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar dataKey="value" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={40} name="Waste Emission (kg CO₂e)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderImpact = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={impactCategoriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <Tooltip cursor={{ fill: '#F9FAFB' }} />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar dataKey="value" fill="#52C41A" radius={[4, 4, 0, 0]} barSize={40} name="Impact (kg CO₂e)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPCFTrend = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={pcfTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={['dataMin - 50', 'dataMax + 50']} />
        <Tooltip />
        <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Line type="linear" dataKey="value" stroke="#52C41A" strokeWidth={3} dot={{ fill: '#52C41A', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} name="Total Emission (kg CO₂e)" />
      </LineChart>
    </ResponsiveContainer>
  );

  const navigateToDetail = (path: string) => {
    if (selectedClient) {
      navigate(path, { state: { selectedClient } });
    } else {
      navigate(path);
    }
  };

  // Permission and loading checks
  if (permissionsLoading) {
    return (
      <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canViewDashboard) {
    return <Welcome />;
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6">
      <div className="mx-auto space-y-6">
        <DashboardHeader />

        {/* Client Selection Dropdown */}
        <div className="flex justify-end mb-6">
          <div className="w-full md:w-64 relative">
            <div
              className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 cursor-pointer shadow-sm hover:border-green-200 transition-colors"
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

        {/* Stats Grid - Keeping static for now or can be dynamic later */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total CO₂e Emissions"
            value="2,847 kg"
            subValue="vs. previous period"
            trend={-12.3}
            icon={Leaf}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            title="Manufacturing Emissions"
            value="1,243 kg"
            subValue="43.7% of total"
            trend={5.2}
            icon={Factory}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Recyclability Rate"
            value="72.5%"
            subValue="Target: 85%"
            trend={8.1}
            icon={RefreshCw}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Transport Emissions"
            value="487 kg"
            subValue="17.1% of total"
            trend={-18.4}
            icon={Truck}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Product Life Cycle Emission"
            subtitle={selectedClient ? "Emission Breakdown" : ""}
            onViewDetails={() => navigateToDetail("/dashboard/detailed-lifecycle")}
          >
            {renderChartOrEmpty(loading.lifeCycle, lifeCycleData, renderProductLifeCycle)}
          </ChartCard>

          <ChartCard
            title="Supplier Emission"
            subtitle={selectedClient ? "First Supplier Emission" : ""}
            onViewDetails={() => navigateToDetail("/dashboard/detailed-supplier")}
          >
            {renderChartOrEmpty(loading.supplier, supplierEmissionData, renderSupplierEmission)}
          </ChartCard>

          <ChartCard
            title="Raw Material Emission"
            subtitle={selectedClient ? "Manufacturing Process" : ""}
            onViewDetails={() => navigateToDetail("/dashboard/detailed-raw-material")}
          >
            {renderChartOrEmpty(loading.rawMaterial, rawMaterialData, renderRawMaterialEmission)}
          </ChartCard>

          <ChartCard
            title="Packaging Emission"
            subtitle={selectedClient ? "Packaging Details" : ""}
            onViewDetails={() => navigateToDetail("/dashboard/detailed-packaging")}
          >
            {renderChartOrEmpty(loading.packaging, packagingData, renderPackagingEmission)}
          </ChartCard>

          <ChartCard
            title="Transportation Emission"
            subtitle={selectedClient ? "Mode of Transport" : ""}
            onViewDetails={() => navigateToDetail("/dashboard/detailed-transportation")}
          >
            {renderChartOrEmpty(loading.transportation, transportationData, renderTransportationEmission)}
          </ChartCard>

          <ChartCard title="Energy Emission" subtitle={selectedClient ? "Energy Sources" : ""} onViewDetails={() => navigateToDetail("/dashboard/detailed-energy")}>
            {renderChartOrEmpty(loading.energy, energyData, renderEnergyEmission)}
          </ChartCard>

          <ChartCard title="Recyclability" subtitle={selectedClient ? "Material Recyclability" : ""} onViewDetails={() => navigateToDetail("/dashboard/detailed-recyclability")}>
            {renderChartOrEmpty(loading.recyclability, recyclabilityData, renderRecyclability)}
          </ChartCard>

          <ChartCard title="Waste Emission" subtitle={selectedClient ? "Waste Treatment" : ""} onViewDetails={() => navigateToDetail("/dashboard/detailed-waste")}>
            {renderChartOrEmpty(loading.waste, wasteData, renderWasteEmission)}
          </ChartCard>

          <ChartCard title="Impact Categories" subtitle={selectedClient ? "Impact Analysis" : ""} onViewDetails={() => navigateToDetail("/dashboard/detailed-impact")}>
            {renderChartOrEmpty(loading.impact, impactCategoriesData, renderImpact)}
          </ChartCard>

          <ChartCard title="PCF Dashboard Graph" subtitle={selectedClient ? "Emission Trend" : ""} onViewDetails={() => navigateToDetail("/dashboard/detailed-pcf-trend")}>
            {renderChartOrEmpty(loading.pcfTrend, pcfTrendData, renderPCFTrend)}
          </ChartCard>
        </div>
      </div>

      <ChartModal isOpen={expandedChart === "lifecycle"} onClose={() => setExpandedChart(null)} title="Product Life Cycle Emission">
        <div className="h-full">{renderChartOrEmpty(loading.lifeCycle, lifeCycleData, renderProductLifeCycle)}</div>
      </ChartModal>
      <ChartModal isOpen={expandedChart === "supplier"} onClose={() => setExpandedChart(null)} title="Supplier Emission">
        <div className="h-full">{renderChartOrEmpty(loading.supplier, supplierEmissionData, renderSupplierEmission)}</div>
      </ChartModal>
      <ChartModal isOpen={expandedChart === "raw-material"} onClose={() => setExpandedChart(null)} title="Raw Material Emission">
        <div className="h-full">{renderChartOrEmpty(loading.rawMaterial, rawMaterialData, renderRawMaterialEmission)}</div>
      </ChartModal>
      <ChartModal isOpen={expandedChart === "packaging"} onClose={() => setExpandedChart(null)} title="Packaging Emission">
        <div className="h-full">{renderChartOrEmpty(loading.packaging, packagingData, renderPackagingEmission)}</div>
      </ChartModal>
      <ChartModal isOpen={expandedChart === "transportation"} onClose={() => setExpandedChart(null)} title="Transportation Emission">
        <div className="h-full">{renderChartOrEmpty(loading.transportation, transportationData, renderTransportationEmission)}</div>
      </ChartModal>
    </div>
  );
};

export default Dashboard;
