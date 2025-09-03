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
      'bg-cro-red-300 border border-cro-red-600 rounded-2xl p-4 flex items-start',
      className
    )}>
      <AlertCircle className="w-5 h-5 text-cro-red-600 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-cro-red-600 font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 text-cro-red-600 hover:text-cro-red-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};