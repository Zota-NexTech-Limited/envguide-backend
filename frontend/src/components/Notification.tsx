import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ 
  type, 
  message, 
  isVisible, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const iconColor = type === 'success' ? 'text-green-400' : 'text-red-400';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full ${bgColor} border ${borderColor} rounded-lg shadow-lg`}>
      <div className="flex items-start p-4">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>
            {type === 'success' ? 'Success' : 'Error'}
          </p>
          <p className={`mt-1 text-sm ${textColor}`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className={`inline-flex ${textColor} hover:${type === 'success' ? 'text-green-600' : 'text-red-600'} focus:outline-none`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
