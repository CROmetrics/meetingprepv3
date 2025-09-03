import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onClose,
  className 
}) => {
  return (
    <div className={clsx(
      'bg-red-50 border border-red-200 rounded-lg p-4 flex items-start',
      className
    )}>
      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-800">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 text-red-600 hover:text-red-800"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};