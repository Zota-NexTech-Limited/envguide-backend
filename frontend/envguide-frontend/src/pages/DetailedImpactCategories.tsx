import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Users,
    ChevronDown,
    Activity
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
    Cell
} from "recharts";
import {
    DetailedHeader,
    ChartCard,
    ChartModal
} from "../components/DashboardComponents";

const impactData = [
    { name: "Global Warming (GWP)", value: 85, color: "#1A5D1A" },
    { name: "Ozone Depletion (ODP)", value: 12, color: "#458C21" },
    { name: "Acidification (AP)", value: 45, color: "#52C41A" },
    { name: "Eutrophication (EP)", value: 60, color: "#74B72E" },
    { name: "Photochemical Ozone (POCP)", value: 35, color: "#B3E699" },
    { name: "Water Scarcity", value: 75, color: "#D9F5C5" },
    { name: "Resource Depletion", value: 50, color: "#EBFADC" },
];

const categoryComparisonData = [
    { name: "Product A", gwp: 120, water: 80, energy: 95 },
    { name: "Product B", gwp: 150, water: 60, energy: 110 },
    { name: "Product C", gwp: 100, water: 110, energy: 85 },
];

const DetailedImpactCategories: React.FC = () => {
    const navigate = useNavigate();
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    const renderImpactIndicators = (isModal = false) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={impactData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F3F5" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={120} />
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Impact Score" barSize={20}>
                    {impactData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );

    const renderCategoryComparison = (isModal = false) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="gwp" fill="#1A5D1A" radius={[4, 4, 0, 0]} name="GWP" />
                <Bar dataKey="water" fill="#52C41A" radius={[4, 4, 0, 0]} name="Water Use" />
                <Bar dataKey="energy" fill="#B3E699" radius={[4, 4, 0, 0]} name="Energy Use" />
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <div className="flex-1 overflow-auto bg-[#F8F9FA] p-8 pt-6">
            <div className="mx-auto">
                <DetailedHeader
                    title="Impact Categories - Detailed View"
                    subtitle="Comprehensive overview of environmental impact values across multiple categories"
                    onBack={() => navigate("/dashboard")}
                    icon={Activity}
                />

                {/* Filters */}
                <div className="flex justify-start mb-8">
                    <div className="w-full md:w-64 space-y-2">
                        <label className="text-xs font-bold text-gray-500 block mb-2">Select Client</label>
                        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-400 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>Select Client</span>
                            </div>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <ChartCard title="Environmental Impact Indicators" showExpand onExpand={() => setExpandedChart("indicators")}>
                        {renderImpactIndicators()}
                    </ChartCard>
                    <ChartCard title="Cross-Category Product Comparison" showExpand onExpand={() => setExpandedChart("comparison")}>
                        {renderCategoryComparison()}
                    </ChartCard>
                </div>
            </div>

            {/* Expansion Modals */}
            <ChartModal isOpen={expandedChart === "indicators"} onClose={() => setExpandedChart(null)} title="Environmental Impact Indicators">
                {renderImpactIndicators(true)}
            </ChartModal>
            <ChartModal isOpen={expandedChart === "comparison"} onClose={() => setExpandedChart(null)} title="Cross-Category Product Comparison">
                {renderCategoryComparison(true)}
            </ChartModal>
        </div>
    );
};

export default DetailedImpactCategories;
