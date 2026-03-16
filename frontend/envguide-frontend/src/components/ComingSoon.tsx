import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description,
  icon: Icon,
  className = "",
}) => {
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          We're working on this feature. It will be available shortly.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
