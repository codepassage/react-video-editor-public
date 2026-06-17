import React from 'react';

export interface PropertySectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const PropertySection: React.FC<PropertySectionProps> = ({
  title,
  icon,
  children,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  return (
    <div className={`border-b border-gray-700 ${className}`}>
      <div className={`sticky top-0 bg-gray-800 z-10 px-4 py-3 border-b border-gray-600 ${headerClassName}`}>
        <h4 className="text-white font-medium flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </h4>
      </div>
      <div className={`p-4 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default PropertySection;