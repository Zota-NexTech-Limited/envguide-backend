import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Grid,
  List as ListIcon,
  Search,
  Filter,
  ChevronDown,
  LayoutGrid,
  FileText,
  Star,
  Plus,
  MoreVertical,
} from "lucide-react";

import { reportsConfig } from "../config/reportsConfig";
import { reportService } from "../lib/reportService";
import { authService } from "../lib/authService";
import { useEffect } from "react";
import { message } from "antd";

const reportsData = reportsConfig;



const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("All Reports");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.userId || currentUser?.id || ""; // Dynamic from local storage via authService

  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  const fetchFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const resp = await reportService.fetchFavoriteReports(userId);
      if (resp && resp.data) {
        // Map backend keys to our config IDs
        const favMap: Record<string, boolean> = {
          "product-footprint": !!resp.data.is_product_footprint,
          "supplier-footprint": !!resp.data.is_supplier_footprint,
          "material-footprint": !!resp.data.is_material_footprint,
          "electricity-footprint": !!resp.data.is_electricity_footprint,
          "transportation-footprint": !!resp.data.is_transportation_footprint,
          "packaging-footprint": !!resp.data.is_packaging_footprint,
          "dqr-rating": !!resp.data.is_dqr_rating_footprint,
        };
        setFavorites(favMap);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    const newStatus = !favorites[reportId];

    // Update local UI immediately
    const updatedFavs = { ...favorites, [reportId]: newStatus };
    setFavorites(updatedFavs);

    try {
      // Construct payload based on user's structure
      const payload = {
        user_id: userId,
        is_product_footprint: !!updatedFavs["product-footprint"],
        is_supplier_footprint: !!updatedFavs["supplier-footprint"],
        is_material_footprint: !!updatedFavs["material-footprint"],
        is_electricity_footprint: !!updatedFavs["electricity-footprint"],
        is_transportation_footprint: !!updatedFavs["transportation-footprint"],
        is_packaging_footprint: !!updatedFavs["packaging-footprint"],
        is_dqr_rating_footprint: !!updatedFavs["dqr-rating"],
      };

      const resp = await reportService.upsertFavoriteReport(payload);
      if (resp && (resp.status || resp.success)) {
        message.success(newStatus ? "Added to favorites" : "Removed from favorites");
      } else {
        // Rollback on failure
        setFavorites(favorites);
        message.error("Failed to update favorite");
      }
    } catch (error) {
      setFavorites(favorites);
      message.error("Network error");
    }
  };

  const filteredReports = reportsData.filter((report) => {
    if (activeTab === "Favorites") {
      return favorites[report.id];
    }
    return true;
  });

  const sidebarItems = [
    { id: "All Reports", label: "All Reports", icon: BarChart3 },
    { id: "Favorites", label: "Favorites", icon: Star },
    // { id: "My Reports", label: "My Reports", icon: FileText },
    // { id: "System Reports", label: "System Reports", icon: LayoutGrid },
  ];

  return (
    <div className="flex h-full bg-gray-50/30">
      {/* Reports Hub Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-gray-900 px-2">Reports Hub</h2>
        <nav className="flex flex-col gap-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                ? "bg-green-50 text-green-700"
                : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto space-y-6">
          {/* Banner */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-6 shadow-sm">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-500">
                Standardised reports for emissions and data quality analysis
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Reports"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-600 focus:outline-none hover:border-gray-300 transition-colors cursor-pointer">
                  <option>All Types</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-600 focus:outline-none hover:border-gray-300 transition-colors cursor-pointer">
                  <option>All Modules</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === "grid"
                ? "bg-green-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Grid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === "list"
                ? "bg-green-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <ListIcon className="w-4 h-4" />
              List
            </button>
          </div>

          {/* Content Area */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {view === "list" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Report
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Module
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tag
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/reports/${report.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.iconColor}`}>
                              <report.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{report.title}</div>
                              <div className="text-sm text-gray-500">{report.description}</div>
                              <div className="text-[10px] text-gray-400 mt-1">{report.updatedAt}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.moduleColor}`}>
                            {report.module}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.typeColor}`}>
                            {report.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className={`p-2 transition-colors ${favorites[report.id] ? "text-orange-400" : "text-gray-400 hover:text-orange-400"}`}
                            onClick={(e) => toggleFavorite(e, report.id)}
                          >
                            <Star className={`w-5 h-5 ${favorites[report.id] ? "fill-orange-400" : ""}`} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="group border border-gray-100 rounded-xl p-5 hover:border-green-200 hover:shadow-md transition-all space-y-4 cursor-pointer"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.iconColor}`}>
                        <report.icon className="w-5 h-5" />
                      </div>
                      <button
                        className={`p-1.5 transition-colors ${favorites[report.id] ? "text-orange-400" : "text-gray-400 hover:text-orange-400"}`}
                        onClick={(e) => toggleFavorite(e, report.id)}
                      >
                        <Star className={`w-5 h-5 ${favorites[report.id] ? "fill-orange-400" : ""}`} />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{report.title}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-medium uppercase tracking-wider">System Generated</p>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{report.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${report.moduleColor}`}>
                        {report.module}
                      </span>
                      <span className="text-[10px] text-gray-400">{report.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

