import React from "react";
import {
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Leaf,
    Truck,
    Factory,
    RefreshCw,
    ExternalLink,
    Maximize,
    X,
    ChevronLeft
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    subValue: string;
    trend: number;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subValue,
    trend,
    icon: Icon,
    iconBg,
    iconColor
}) => {
    const isPositive = trend > 0;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={`${iconBg} ${iconColor} p-2.5 rounded-xl`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-bold ${isPositive
                    ? 'bg-orange-50 text-orange-600'
                    : 'bg-green-50 text-green-600'
                    }`}>
                    {isPositive ? '+' : ''}{trend}%
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <p className="text-xs text-gray-400">{subValue}</p>
            </div>
        </div>
    );
};

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onViewDetails?: () => void;
    showExpand?: boolean;
    onExpand?: () => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    subtitle,
    children,
    onViewDetails,
    showExpand,
    onExpand
}) => {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-base font-bold text-gray-900">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-3">
                    {showExpand && (
                        <button
                            onClick={onExpand}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#B3E699] rounded-lg text-xs font-bold text-[#52C41A] hover:bg-green-50 transition-colors cursor-pointer"
                        >
                            <Maximize className="w-3.5 h-3.5" />
                            Expand
                        </button>
                    )}
                    {onViewDetails && (
                        <button
                            onClick={onViewDetails}
                            className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer"
                        >
                            View Details
                        </button>
                    )}
                </div>
            </div>
            <div className="h-[240px] w-full">
                {children}
            </div>
        </div>
    );
};

export const ChartModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 rounded-full transition-colors group cursor-pointer"
                    >
                        <X className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
                <div className="p-8 h-[600px] overflow-x-auto chart-scrollbar">
                    <div className="h-full min-w-[800px]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DetailedHeader: React.FC<{
    title: string;
    subtitle: string;
    onBack: () => void;
    icon?: LucideIcon;
}> = ({ title, subtitle, onBack, icon: Icon = Leaf }) => {
    return (
        <div className="space-y-6 mb-8">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-900 font-bold hover:text-green-600 transition-colors group cursor-pointer"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Dashboard
            </button>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-green-500 p-3 rounded-xl shadow-lg shadow-green-100">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        <p className="text-sm text-gray-400">{subtitle}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DashboardHeader: React.FC = () => {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm mb-6">
            <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-xl shadow-lg shadow-green-100">
                    <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Carbon Footprint Dashboard</h1>
                    <p className="text-sm text-gray-400">Comprehensive carbon footprint metrics across product lifecycle</p>
                </div>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-50 cursor-pointer">
                <Download className="w-4 h-4" />
                Export Report
            </button>
        </div>
    );
};
