import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string | number;
  statusIndicator?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
  statusIndicator,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  return (
    <div className={`border border-gray-600 rounded-lg ${className}`}>
      <button
        onClick={onToggle}
        className={`w-full p-3 text-left flex items-center justify-between text-white hover:bg-gray-700 transition-colors ${headerClassName}`}
      >
        <span className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
          {badge && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
              {badge}
            </span>
          )}
          {statusIndicator}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
        <div className={`px-4 py-2 space-y-3 border-t border-gray-600 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;