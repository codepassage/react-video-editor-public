import React from 'react';

export interface PresetGridItem {
  name: string;
  value: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  icon?: React.ReactNode;
  description?: string;
  isSelected?: boolean;
  selectedColor?: string;
  backgroundStyle?: React.CSSProperties;
}

export interface PresetGridProps {
  label: string;
  items: PresetGridItem[];
  columns?: number;
  className?: string;
  buttonClassName?: string;
  gridClassName?: string;
}

export const PresetGrid: React.FC<PresetGridProps> = ({
  label,
  items,
  columns = 3,
  className = '',
  buttonClassName = '',
  gridClassName = ''
}) => {
  // 기본 그리드 스타일
  const defaultGridStyle = `grid gap-2`;
  const gridColsStyle = columns === 3 ? 'grid-cols-3' : `grid-cols-${columns}`;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 라벨 */}
      <label className="block text-sm text-gray-300">{label}</label>
      
      {/* 프리셋 버튼 그리드 */}
      <div className={`${defaultGridStyle} ${gridColsStyle} ${gridClassName}`}>
        {items.map((item, index) => {
          const isSelected = item.isSelected || false;
          const selectedColor = item.selectedColor || 'purple';
          
          // 선택 상태에 따른 스타일
          const selectedStyle = isSelected 
            ? `border-${selectedColor}-500 bg-${selectedColor}-500/20`
            : 'border-gray-600 bg-gray-700 hover:border-gray-500';
          
          // 아이콘이 있는 경우와 없는 경우 구분
          const hasIcon = item.icon || item.description;
          const hasBackground = item.backgroundStyle;
          const buttonStyle = hasIcon 
            ? `p-3 rounded-lg border-2 transition-all text-center ${selectedStyle}`
            : hasBackground
            ? `h-12 rounded border border-gray-600 hover:border-gray-400 transition-colors`
            : `p-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors`;

          return (
            <button
              key={index}
              onClick={item.onClick}
              disabled={item.disabled}
              className={`${buttonStyle} ${buttonClassName} disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden`}
              style={item.backgroundStyle}
              title={item.tooltip || `${item.name}으로 설정`}
            >
              {hasIcon ? (
                <>
                  {item.icon && <div className="text-lg mb-1">{item.icon}</div>}
                  <div className="text-xs text-gray-300">{item.description || item.name}</div>
                </>
              ) : (
                <>
                  {item.backgroundStyle && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1">
                      {item.name}
                    </div>
                  )}
                  {!item.backgroundStyle && (
                    <span className="text-white">{item.name}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PresetGrid;