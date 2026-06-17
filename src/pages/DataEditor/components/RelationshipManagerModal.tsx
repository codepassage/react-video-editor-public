import React, { useState, useEffect } from 'react';
import { Save, FileJson, Database, AlertCircle, ArrowUpDown } from 'lucide-react';
import { globalAlert } from '../../../utils/globalAlert';
import { getApiUrl } from '../../../utils/urlBuilder';
import { ModalDialog } from './ModalDialog';
import './RelationshipStyles.css';

interface ResourceTemplate {
  id: string;
  name: string;
  description?: string;
}

interface CsvColumnMap {
  id: string;
  name: string;
  description?: string;
}

interface RelationshipManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceData: any;
  resourceType?: 'resource-data' | 'template' | 'csv-map';
  onRelationshipUpdate: () => void;
}

export const RelationshipManagerModal: React.FC<RelationshipManagerModalProps> = ({
  isOpen,
  onClose,
  resourceData,
  resourceType = 'resource-data',
  onRelationshipUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<ResourceTemplate[]>([]);
  const [availableCsvMaps, setAvailableCsvMaps] = useState<CsvColumnMap[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCsvMapId, setSelectedCsvMapId] = useState<string>('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [selectedCsvMapIds, setSelectedCsvMapIds] = useState<string[]>([]);
  const [selectedResourceDataIds, setSelectedResourceDataIds] = useState<string[]>([]);
  const [availableResourceData, setAvailableResourceData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && resourceData) {
      loadInitialData();
    }
  }, [isOpen, resourceData]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔍 RelationshipManager 초기 데이터 로드:', {
        resourceType,
        resourceData,
        resourceDataKeys: Object.keys(resourceData || {}),
        csvColumnMaps: resourceData?.csvColumnMaps,
        resourceDataField: resourceData?.resourceData
      });

      // 리소스 타입에 따라 현재 관계 정보 설정
      if (resourceType === 'resource-data') {
        // ResourceData의 경우: resourceTemplateId, csvMapId 사용 (단일 선택)
        setSelectedTemplateId(resourceData.resourceTemplateId || '');
        setSelectedCsvMapId(resourceData.csvMapId || '');
        // 복수 선택 초기화
        setSelectedTemplateIds([]);
        setSelectedCsvMapIds([]);
        setSelectedResourceDataIds([]);
      } else if (resourceType === 'template') {
        // ResourceTemplate의 경우: 자기 자신이 template이므로 template은 선택된 상태
        setSelectedTemplateId(resourceData.id || '');
        setSelectedCsvMapId(''); // 단일 선택은 빈 값
        
        // 복수 선택: 연결된 CSV 맵들과 ResourceData 로드 필요
        setSelectedTemplateIds([]);
        
        // CSV 맵 IDs 가져오기 (배열 형태)
        const csvMapIds = resourceData.csvColumnMaps?.map((map: any) => map.id) || [];
        setSelectedCsvMapIds(csvMapIds);
        
        // ResourceData ID 가져오기 (1:1 관계, 객체 형태)
        const resourceDataId = resourceData.resourceData?.id || '';
        setSelectedResourceDataIds(resourceDataId ? [resourceDataId] : []);
        
        console.log('🔍 Template 초기 관계 설정:', {
          csvMapIds,
          resourceDataId,
          csvColumnMaps: resourceData.csvColumnMaps,
          resourceDataObject: resourceData.resourceData
        });
      } else if (resourceType === 'csv-map') {
        // CsvColumnMap의 경우: 자기 자신이 csv-map이므로 csv-map은 선택된 상태
        setSelectedTemplateId(resourceData.resourceTemplateId || ''); // N:1 관계
        setSelectedCsvMapId(resourceData.id || '');
        
        // 복수 선택: 연결된 ResourceData들 로드 필요
        setSelectedTemplateIds([]);
        setSelectedCsvMapIds([]);
        
        // ResourceData IDs 가져오기 (1:N 관계, 배열 형태)
        const resourceDataIds = resourceData.resourceDataEntries?.map((data: any) => data.id) || [];
        setSelectedResourceDataIds(resourceDataIds);
        
        console.log('🔍 CSV Map 초기 관계 설정:', {
          resourceTemplateId: resourceData.resourceTemplateId,
          resourceDataIds,
          resourceDataEntries: resourceData.resourceDataEntries
        });
      }

      // 사용 가능한 리소스들 로드
      await Promise.all([
        loadAvailableTemplates(),
        loadAvailableCsvMaps(),
        loadAvailableResourceData()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      globalAlert.showError('초기 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTemplates = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/resource-templates`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTemplates(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadAvailableCsvMaps = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/csv-column-maps`);
      if (response.ok) {
        const data = await response.json();
        setAvailableCsvMaps(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to load CSV maps:', error);
    }
  };

  const loadAvailableResourceData = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/resource-data`);
      if (response.ok) {
        const data = await response.json();
        setAvailableResourceData(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to load resource data:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let response;
      
      if (resourceType === 'resource-data') {
        // ResourceData의 관계 업데이트
        response = await fetch(`${getApiUrl()}/api/resource-data/${resourceData.id}/relationships`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceTemplateId: selectedTemplateId || null,
            csvMapId: selectedCsvMapId || null,
          }),
        });
      } else if (resourceType === 'template') {
        // ResourceTemplate에서 복수 관계 업데이트
        response = await fetch(`${getApiUrl()}/api/resource-templates/${resourceData.id}/relationships`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            csvMapIds: selectedCsvMapIds, // 1:N 관계 - 복수 선택
            resourceDataId: selectedResourceDataIds[0] || null, // 1:1 관계 - 단일 선택
          }),
        });
      } else if (resourceType === 'csv-map') {
        // CsvColumnMap에서 복수 관계 업데이트
        response = await fetch(`${getApiUrl()}/api/csv-column-maps/${resourceData.id}/relationships`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceTemplateId: selectedTemplateId || null, // N:1 관계 - 단일 선택
            resourceDataIds: selectedResourceDataIds, // 1:N 관계 - 복수 선택
          }),
        });
      }

      if (response && response.ok) {
        globalAlert.showSuccess('관계가 성공적으로 업데이트되었습니다.');
        onRelationshipUpdate();
        onClose();
      } else {
        throw new Error('Failed to update relationships');
      }
    } catch (error) {
      console.error('Failed to save relationships:', error);
      globalAlert.showError('관계 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (resourceType === 'resource-data') {
      setSelectedTemplateId(resourceData.resourceTemplateId || '');
      setSelectedCsvMapId(resourceData.csvMapId || '');
      setSelectedTemplateIds([]);
      setSelectedCsvMapIds([]);
      setSelectedResourceDataIds([]);
    } else if (resourceType === 'template') {
      setSelectedTemplateId(resourceData.id || '');
      setSelectedCsvMapId('');
      setSelectedTemplateIds([]);
      
      // CSV 맵 IDs 복원 (배열 형태)
      const csvMapIds = resourceData.csvColumnMaps?.map((map: any) => map.id) || [];
      setSelectedCsvMapIds(csvMapIds);
      
      // ResourceData ID 복원 (1:1 관계, 객체 형태)
      const resourceDataId = resourceData.resourceData?.id || '';
      setSelectedResourceDataIds(resourceDataId ? [resourceDataId] : []);
    } else if (resourceType === 'csv-map') {
      setSelectedTemplateId(resourceData.resourceTemplateId || '');
      setSelectedCsvMapId(resourceData.id || '');
      setSelectedTemplateIds([]);
      setSelectedCsvMapIds([]);
      
      // ResourceData IDs 복원 (1:N 관계, 배열 형태)
      const resourceDataIds = resourceData.resourceDataEntries?.map((data: any) => data.id) || [];
      setSelectedResourceDataIds(resourceDataIds);
    }
  };

  const hasChanges = (() => {
    if (resourceType === 'resource-data') {
      return selectedTemplateId !== (resourceData.resourceTemplateId || '') ||
             selectedCsvMapId !== (resourceData.csvMapId || '');
    } else if (resourceType === 'template') {
      // CSV 맵 IDs 비교 (배열 형태)
      const originalCsvMapIds = resourceData.csvColumnMaps?.map((map: any) => map.id) || [];
      // ResourceData ID 비교 (1:1 관계, 객체 형태)
      const originalResourceDataIds = resourceData.resourceData?.id ? [resourceData.resourceData.id] : [];
      
      return JSON.stringify(selectedCsvMapIds.sort()) !== JSON.stringify(originalCsvMapIds.sort()) ||
             JSON.stringify(selectedResourceDataIds.sort()) !== JSON.stringify(originalResourceDataIds.sort());
    } else if (resourceType === 'csv-map') {
      // ResourceData IDs 비교 (1:N 관계, 배열 형태)
      const originalResourceDataIds = resourceData.resourceDataEntries?.map((data: any) => data.id) || [];
      return selectedTemplateId !== (resourceData.resourceTemplateId || '') ||
             JSON.stringify(selectedResourceDataIds.sort()) !== JSON.stringify(originalResourceDataIds.sort());
    }
    return false;
  })();

  // 복수 선택 핸들러
  const handleMultiSelectChange = (itemId: string, isSelected: boolean, targetState: 'csvMaps' | 'resourceData') => {
    if (targetState === 'csvMaps') {
      if (isSelected) {
        setSelectedCsvMapIds(prev => [...prev, itemId]);
      } else {
        setSelectedCsvMapIds(prev => prev.filter(id => id !== itemId));
      }
    } else if (targetState === 'resourceData') {
      if (isSelected) {
        setSelectedResourceDataIds(prev => [...prev, itemId]);
      } else {
        setSelectedResourceDataIds(prev => prev.filter(id => id !== itemId));
      }
    }
  };

  // 복수 선택 UI 컴포넌트
  const MultiSelectComponent = ({ 
    items, 
    selectedIds, 
    onChange, 
    title, 
    targetState 
  }: { 
    items: any[], 
    selectedIds: string[], 
    onChange: (itemId: string, isSelected: boolean, targetState: 'csvMaps' | 'resourceData') => void,
    title: string,
    targetState: 'csvMaps' | 'resourceData'
  }) => (
    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #444a5a', borderRadius: '4px', padding: '8px' }}>
      {items.length === 0 ? (
        <div style={{ color: '#6b7280', fontStyle: 'italic', padding: '8px' }}>
          사용 가능한 {title}이 없습니다.
        </div>
      ) : (
        items.map((item) => (
          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={(e) => onChange(item.id, e.target.checked, targetState)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ color: '#f5f6fa', fontSize: '14px' }}>{item.name}</span>
            {item.description && (
              <span style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>
                - {item.description}
              </span>
            )}
          </label>
        ))
      )}
    </div>
  );

  const footer = (
    <>
      <button
        className="reset-button"
        onClick={handleReset}
        disabled={!hasChanges || saving}
      >
        되돌리기
      </button>
      <div className="footer-actions">
        <button className="cancel-button" onClick={onClose} disabled={saving}>
          취소
        </button>
        <button
          className="save-button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <div className="button-spinner" />
              저장 중...
            </>
          ) : (
            <>
              <Save size={16} />
              저장
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="관계 관리"
      footer={footer}
      size="large"
    >
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>데이터를 불러오는 중...</span>
        </div>
      ) : (
        <>
          {/* 현재 리소스 정보 */}
          <div className="current-resource">
            <h3>
              {resourceType === 'resource-data' && '현재 리소스 데이터'}
              {resourceType === 'template' && '현재 리소스 템플릿'}
              {resourceType === 'csv-map' && '현재 CSV 컬럼 맵'}
            </h3>
            <div className="resource-info">
              {resourceType === 'resource-data' && <Database size={16} />}
              {resourceType === 'template' && <FileJson size={16} />}
              {resourceType === 'csv-map' && <FileJson size={16} />}
              <span className="resource-name">{resourceData.name}</span>
              {resourceData.description && (
                <span className="resource-description">- {resourceData.description}</span>
              )}
            </div>
          </div>

          {/* 관계 시각화 - resourceType에 따라 동적 렌더링 */}
          <div className="relationship-visualizer">
            {resourceType === 'resource-data' && (
              <div className="entity-container">
                {/* Resource Template */}
                <div className="entity template-entity">
                  <div className="entity-header">
                    <FileJson size={16} />
                    <h4>Resource Template</h4>
                  </div>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="entity-select"
                  >
                    <option value="">선택하지 않음</option>
                    {availableTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {selectedTemplateId && (
                    <div className="selected-info">
                      {availableTemplates.find(t => t.id === selectedTemplateId)?.description}
                    </div>
                  )}
                </div>

                <div className="connector"><ArrowUpDown size={20} /></div>

                {/* Resource Data (고정) */}
                <div className="entity resource-data-entity">
                  <div className="entity-header">
                    <Database size={16} />
                    <h4>Resource Data (현재)</h4>
                  </div>
                  <div className="current-resource-display">{resourceData.name}</div>
                  <div className="resource-stats">
                    <span>Items: {resourceData.itemCount || 0}</span>
                    {resourceData.hasNested && <span>Nested: Depth {resourceData.maxDepth}</span>}
                  </div>
                </div>

                <div className="connector"><ArrowUpDown size={20} /></div>

                {/* CSV Column Map */}
                <div className="entity csv-map-entity">
                  <div className="entity-header">
                    <FileJson size={16} />
                    <h4>CSV Column Map</h4>
                  </div>
                  <select
                    value={selectedCsvMapId}
                    onChange={(e) => setSelectedCsvMapId(e.target.value)}
                    className="entity-select"
                  >
                    <option value="">선택하지 않음</option>
                    {availableCsvMaps.map((csvMap) => (
                      <option key={csvMap.id} value={csvMap.id}>
                        {csvMap.name}
                      </option>
                    ))}
                  </select>
                  {selectedCsvMapId && (
                    <div className="selected-info">
                      {availableCsvMaps.find(m => m.id === selectedCsvMapId)?.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {resourceType === 'template' && (
              <div className="entity-container">
                {/* Resource Template (고정) */}
                <div className="entity template-entity">
                  <div className="entity-header">
                    <FileJson size={16} />
                    <h4>Resource Template (현재)</h4>
                  </div>
                  <div className="current-resource-display">{resourceData.name}</div>
                  <div className="resource-stats">
                    <span>Items: {resourceData.itemCount || 0}</span>
                    {resourceData.hasNested && <span>Nested: Depth {resourceData.maxDepth}</span>}
                  </div>
                </div>

                <div className="connector"><ArrowUpDown size={20} /></div>

                {/* Resource Data (1:1) */}
                <div className="entity resource-data-entity">
                  <div className="entity-header">
                    <Database size={16} />
                    <h4>Resource Data (1:1)</h4>
                  </div>
                  <select
                    value={selectedResourceDataIds[0] || ''}
                    onChange={(e) => setSelectedResourceDataIds(e.target.value ? [e.target.value] : [])}
                    className="entity-select"
                  >
                    <option value="">선택하지 않음</option>
                    {availableResourceData.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="connector"><ArrowUpDown size={20} /></div>

                {/* CSV Column Maps (1:N) */}
                <div className="entity csv-map-entity">
                  <div className="entity-header">
                    <FileJson size={16} />
                    <h4>CSV Column Maps (1:N)</h4>
                  </div>
                  <MultiSelectComponent
                    items={availableCsvMaps}
                    selectedIds={selectedCsvMapIds}
                    onChange={handleMultiSelectChange}
                    title="CSV Maps"
                    targetState="csvMaps"
                  />
                </div>
              </div>
            )}

            {resourceType === 'csv-map' && (
              <div className="entity-container">
                {/* Resource Template (N:1) */}
                <div className="entity template-entity">
                  <div className="entity-header">
                    <FileJson size={16} />
                    <h4>Resource Template (N:1)</h4>
                  </div>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="entity-select"
                  >
                    <option value="">선택하지 않음</option>
                    {availableTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {selectedTemplateId && (
                    <div className="selected-info">
                      {availableTemplates.find(t => t.id === selectedTemplateId)?.description}
                    </div>
                  )}
                </div>

                <div className="connector"><ArrowUpDown size={20} /></div>

                {/* CSV Column Map (고정) */}
                <div className="entity csv-map-entity">
                  <div className="entity-header">
                    <FileJson size={16} />
                    <h4>CSV Column Map (현재)</h4>
                  </div>
                  <div className="current-resource-display">{resourceData.name}</div>
                  <div className="resource-stats">
                    <span>Columns: {resourceData.columnCount || 0}</span>
                    <span>Complexity: {resourceData.mappingComplexity || 'simple'}</span>
                  </div>
                </div>

                <div className="connector"><ArrowUpDown size={20} /></div>

                {/* Resource Data (1:N) */}
                <div className="entity resource-data-entity">
                  <div className="entity-header">
                    <Database size={16} />
                    <h4>Resource Data (1:N)</h4>
                  </div>
                  <MultiSelectComponent
                    items={availableResourceData}
                    selectedIds={selectedResourceDataIds}
                    onChange={handleMultiSelectChange}
                    title="Resource Data"
                    targetState="resourceData"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 관계 상태 표시 */}
          <div className="relationship-status">
            {resourceType === 'resource-data' ? (
              selectedTemplateId && selectedCsvMapId ? (
                <div className="status-complete">
                  <span>✅ 완전한 관계 설정</span>
                </div>
              ) : (
                <div className="status-incomplete">
                  <AlertCircle size={16} />
                  <span>
                    {!selectedTemplateId && !selectedCsvMapId
                      ? '템플릿과 CSV 맵을 선택해주세요'
                      : !selectedTemplateId
                        ? '템플릿을 선택해주세요'
                        : 'CSV 맵을 선택해주세요'
                    }
                  </span>
                </div>
              )
            ) : resourceType === 'template' ? (
              <div className="status-complete">
                <span>✅ 템플릿 기준 관계 관리</span>
              </div>
            ) : (
              <div className="status-complete">
                <span>✅ CSV 맵 기준 관계 관리</span>
              </div>
            )}
          </div>
        </>
      )}
    </ModalDialog>
  );
};