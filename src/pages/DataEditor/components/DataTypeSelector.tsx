import React from 'react';

interface DataTypeSelectorProps {
  currentDataType: 'resource' | 'template' | 'csv-map';
  onDataTypeChange: (newType: 'resource' | 'template' | 'csv-map') => void;
}

export const DataTypeSelector: React.FC<DataTypeSelectorProps> = ({
  currentDataType,
  onDataTypeChange
}) => {
  return (
    <select
      value={currentDataType}
      onChange={(e) => onDataTypeChange(e.target.value as 'resource' | 'template' | 'csv-map')}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        background: currentDataType === 'resource' ? '#10b981' : currentDataType === 'template' ? '#f59e0b' : '#8b5cf6',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        minWidth: '140px'
      }}
    >
      <option value="resource">📊 리소스 데이터</option>
      <option value="template">📋 리소스 템플릿</option>
      <option value="csv-map">🗂️ CSV 맵</option>
    </select>
  );
};