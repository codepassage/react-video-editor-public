import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: 'orange' | 'blue' | 'green' | 'purple' | 'red';
  iconColor?: string;
  className?: string;
}

const badgeColorClasses = {
  orange: 'bg-orange-600 text-white',
  blue: 'bg-blue-600 text-white',
  green: 'bg-green-600 text-white',
  purple: 'bg-purple-600 text-white',
  red: 'bg-red-600 text-white'
};

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
  badgeColor = 'orange',
  iconColor = 'text-orange-400',
  className = ''
}) => {
  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-3 text-left hover:bg-gray-700 rounded-md p-2 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className={iconColor}>
            {icon}
          </div>
          <span className="text-white font-medium">{title}</span>
          {badge && (
            <span className={`text-xs px-2 py-1 rounded-full ${badgeColorClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-gray-400">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingsSection;