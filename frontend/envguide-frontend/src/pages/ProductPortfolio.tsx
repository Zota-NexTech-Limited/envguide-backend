import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Briefcase, ArrowRight } from "lucide-react";

const ProductPortfolio: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "All Products",
      description: "View and manage your complete product catalog",
      icon: Package,
      path: "/product-portfolio/all-products",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Portfolio</h1>
          <p className="text-gray-500">Manage your products and catalog definitions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.title}
            onClick={() => navigate(item.path)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <item.icon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors flex items-center gap-2">
              {item.title}
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h3>
            <p className="text-gray-500 mt-2 text-sm">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPortfolio;
