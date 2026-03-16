import { Users, Plus, Search, Filter } from 'lucide-react';

const VisitorManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
          <p className="text-gray-600">Manage visitors, check-ins, and check-outs</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Visitor</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search visitors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Visitor Management</h3>
        <p className="text-gray-600 mb-4">
          This page will contain the visitor management functionality including:
        </p>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• Visitor registration and check-in</li>
          <li>• Check-out management</li>
          <li>• Visitor history and reports</li>
          <li>• Badge management</li>
          <li>• Access control</li>
        </ul>
      </div>
    </div>
  );
};

export default VisitorManagement;
