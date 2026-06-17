import React from 'react';
import { Database } from 'lucide-react';
import { JsonEditor } from './JsonEditor';
import { VanillaJsonEditor } from './VanillaJsonEditor';
import { CsvTableEditor } from './CsvTableEditor';
import { DataTypeSelector } from './DataTypeSelector';

interface JsonEditorPanelProps {
  currentDataType: 'resource' | 'template' | 'csv-map';
  onDataTypeChange: (newType: 'resource' | 'template' | 'csv-map') => void;
  resourceData: any;
  onResourceDataChange: (data: any) => void;
  jsonEditorType: 'classic' | 'modern';
  onJsonEditorTypeChange: () => void;
  onSaveToDb: () => void;
  currentResourceName: string;
  onGenerateResourceTemplate: () => void;
  isResourceTemplateGenerationEnabled: boolean;
  onLoadResourceData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const JsonEditorPanel: React.FC<JsonEditorPanelProps> = ({
  currentDataType,
  onDataTypeChange,
  resourceData,
  onResourceDataChange,
  jsonEditorType,
  onJsonEditorTypeChange,
  onSaveToDb,
  currentResourceName,
  onGenerateResourceTemplate,
  isResourceTemplateGenerationEnabled,
  onLoadResourceData
}) => {
  const handleEditorChange = (newData: any) => {
    console.log('🔧 JSON Editor onChange:', newData);
    try {
      if (newData && typeof newData === 'object') {
        // 리소스 데이터 타입인 경우에만 items 검증
        if (currentDataType === 'resource' && newData.items && Array.isArray(newData.items)) {
          const validatedItems = newData.items.map((item: any) => {
            if (!item.data && !item.isIterator) {
              return {
                ...item,
                data: {
                  type: 'text',
                  text: '',
                  language: 'ko'
                }
              };
            }
            return item;
          });
          onResourceDataChange({ ...newData, items: validatedItems });
        } else {
          // 다른 타입(템플릿, CSV 맵)은 그대로 저장
          onResourceDataChange(newData);
        }
      }
    } catch (error) {
      console.error('JSON Editor onChange error:', error);
    }
  };

  return (
    <div className="resource-json-editor" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3>데이터 JSON 편집기</h3>
          <DataTypeSelector
            currentDataType={currentDataType}
            onDataTypeChange={onDataTypeChange}
          />
        </div>
        <div className="header-controls">
          <input
            type="file"
            accept=".json"
            onChange={onLoadResourceData}
            className="hidden"
            id="resource-data-upload"
          />

          <button
            onClick={onSaveToDb}
            className="db-save-btn"
            title={`${currentDataType === 'resource' ? '리소스 데이터' : currentDataType === 'template' ? '리소스 템플릿' : 'CSV 맵'} DB에 저장`}
          >
            <Database size={14} />
            <span>DB 저장</span>
          </button>
          {currentDataType !== 'csv-map' && (
            <button
              onClick={onJsonEditorTypeChange}
              className="editor-type-btn"
              title="에디터 타입 변경"
            >
              {jsonEditorType === 'classic' ? 'Modern' : 'Classic'}
            </button>
          )}
        </div>
      </div>

      {currentDataType === 'csv-map' ? (
        <div className="csv-editor-wrapper" style={{ flex: 1, overflow: 'hidden' }}>
          <CsvTableEditor
            value={resourceData}
            onChange={(newData: any) => {
              console.log('🔧 CSV Table Editor onChange:', newData);
              onResourceDataChange(newData);
            }}
          />
        </div>
      ) : (
        <div className="json-editor-wrapper" style={{ flex: 1, overflow: 'auto' }}>
          {jsonEditorType === 'classic' ? (
            <JsonEditor
              key={`classic-${JSON.stringify(resourceData).slice(0, 100)}`}
              value={resourceData}
              onChange={handleEditorChange}
              mode="tree"
              className="resource-json-editor-instance"
            />
          ) : (
            <VanillaJsonEditor
              key={`vanilla-${JSON.stringify(resourceData).slice(0, 100)}`}
              value={resourceData}
              onChange={handleEditorChange}
              mode="text"
              className="resource-json-editor-instance"
            />
          )}
        </div>
      )}

      {/* 현재 편집 중인 데이터 정보 표시 */}
      <div style={{
        marginTop: '10px',
        padding: '8px 12px',
        backgroundColor: '#fee2e2',
        border: '2px dashed #ef4444',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#dc2626',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '500'
      }}>
        <span>편집 중:</span>
        <span style={{
          padding: '2px 6px',
          borderRadius: '3px',
          background: currentDataType === 'resource' ? '#10b981' : currentDataType === 'template' ? '#f59e0b' : '#8b5cf6',
          color: 'white',
          fontSize: '11px'
        }}>
          {currentDataType === 'resource' ? '리소스 데이터' : 
           currentDataType === 'template' ? '리소스 템플릿' : 'CSV 맵'}
        </span>
        <span>{currentResourceName || '새 데이터'}</span>
        {currentDataType !== 'resource' && (
          <span style={{ color: '#dc2626', fontSize: '11px' }}>
            (변환/TTS 생성 불가)
          </span>
        )}
      </div>

      {/* 리소스 템플릿 생성 버튼 */}
      {currentDataType === 'template' && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '16px'
        }}>
          <button
            onClick={onGenerateResourceTemplate}
            disabled={!isResourceTemplateGenerationEnabled}
            style={{
              padding: '10px 20px',
              backgroundColor: isResourceTemplateGenerationEnabled ? '#f59e0b' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isResourceTemplateGenerationEnabled ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: isResourceTemplateGenerationEnabled ? '0 2px 4px rgba(245, 158, 11, 0.3)' : 'none'
            }}
            title={
              isResourceTemplateGenerationEnabled 
                ? '리소스 데이터를 기반으로 템플릿을 생성합니다 (containers 축소, text 초기화)' 
                : '리소스 데이터를 먼저 로드하거나 저장해주세요'
            }
          >
            🎯 리소스 템플릿 생성
          </button>
        </div>
      )}
    </div>
  );
};