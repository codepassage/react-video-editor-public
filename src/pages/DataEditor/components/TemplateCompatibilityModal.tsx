import React, { useState, useEffect } from 'react';
import { Check, X, Search, Loader2, AlertCircle } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  type?: {
    name: string;
  };
  versions?: {
    version: number;
    versionString: string;
  }[];
}

interface TemplateCompatibilityModalProps {
  resourceId: string;
  resourceName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateCompatibilityModal: React.FC<TemplateCompatibilityModalProps> = ({
  resourceId,
  resourceName,
  isOpen,
  onClose
}) => {
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [connectedTemplateIds, setConnectedTemplateIds] = useState<Set<string>>(new Set());
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByType, setFilterByType] = useState<string>('');
  const [showOnlyConnected, setShowOnlyConnected] = useState(false);

  // 모든 템플릿과 현재 연결 상태 로드
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 모든 템플릿 조회
      const templatesResponse = await fetch('/api/templates');
      const templatesData = await templatesResponse.json();

      // 현재 연결된 템플릿 조회
      const compatibleResponse = await fetch(`/api/resources/${resourceId}/compatible-templates`);
      const compatibleData = await compatibleResponse.json();

      // 템플릿 데이터 처리 - 다양한 응답 형식 처리
      let templates = [];
      if (templatesData.success) {
        templates = templatesData.templates || templatesData.data || [];
      } else if (Array.isArray(templatesData)) {
        templates = templatesData;
      } else if (templatesData.data && Array.isArray(templatesData.data)) {
        templates = templatesData.data;
      }

      if (compatibleData.success) {
        setAllTemplates(templates);
        
        const connectedIds = new Set(compatibleData.templates?.map((t: Template) => t.id) || []);
        setConnectedTemplateIds(connectedIds);
        setSelectedTemplateIds(new Set(connectedIds)); // 현재 연결 상태를 선택 상태로 복사
      } else {
        setError('데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, resourceId]);

  // 검색 및 필터링
  const filteredTemplates = allTemplates.filter(template => {
    // 텍스트 검색
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.type?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 타입 필터
    const matchesType = !filterByType || template.type?.name === filterByType;
    
    // 연결 상태 필터
    const matchesConnection = !showOnlyConnected || connectedTemplateIds.has(template.id);
    
    return matchesSearch && matchesType && matchesConnection;
  });

  // 사용 가능한 템플릿 타입 목록
  const availableTypes = Array.from(new Set(allTemplates.map(t => t.type?.name).filter(Boolean)));

  // 템플릿 선택/해제 토글
  const toggleTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplateIds);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplateIds(newSelected);
  };

  // 변경사항 저장
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/resources/${resourceId}/compatible-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateIds: Array.from(selectedTemplateIds)
        }),
      });

      const data = await response.json();

      if (data.success) {
        onClose(); // 성공 시 모달 닫기
      } else {
        setError('저장 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Error saving compatibility:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 변경사항이 있는지 확인
  const hasChanges = () => {
    if (selectedTemplateIds.size !== connectedTemplateIds.size) return true;
    
    for (const id of selectedTemplateIds) {
      if (!connectedTemplateIds.has(id)) return true;
    }
    
    return false;
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedTemplateIds.size === filteredTemplates.length) {
      setSelectedTemplateIds(new Set());
    } else {
      setSelectedTemplateIds(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '640px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>템플릿 호환성 관리</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                {resourceName ? `"${resourceName}"` : '현재 리소스'}와 호환되는 템플릿을 선택하세요.
              </p>
            </div>
            <button 
              onClick={onClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '20px', 
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
              <Loader2 style={{ width: '24px', height: '24px', marginRight: '8px' }} className="animate-spin" />
              <span style={{ fontSize: '14px', color: '#6b7280' }}>데이터를 불러오는 중...</span>
            </div>
          ) : (
            <>
              {/* 검색 및 통계 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <Search style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    width: '16px', 
                    height: '16px', 
                    color: '#9ca3af' 
                  }} />
                  <input
                    type="text"
                    placeholder="템플릿 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span>총 {filteredTemplates.length}개 템플릿</span>
                    <span style={{
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {selectedTemplateIds.size}개 선택됨
                    </span>
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={handleSelectAll}
                    style={{ fontSize: '12px' }}
                  >
                    {selectedTemplateIds.size === filteredTemplates.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
              </div>

              {/* 템플릿 목록 */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                border: '1px solid #e5e7eb', 
                borderRadius: '6px',
                padding: '8px'
              }}>
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplateIds.has(template.id);
                  const wasConnected = connectedTemplateIds.has(template.id);
                  const isNew = isSelected && !wasConnected;
                  const isRemoved = !isSelected && wasConnected;

                  return (
                    <div
                      key={template.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#eff6ff' : 'white',
                        borderColor: isNew ? '#86efac' : isRemoved ? '#fca5a5' : '#e5e7eb'
                      }}
                      onClick={() => toggleTemplate(template.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // onClick으로 처리
                        style={{ marginRight: '12px', pointerEvents: 'none' }}
                      />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '500', color: '#111827' }}>
                            {template.name}
                          </span>
                          {wasConnected && (
                            <span style={{
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              기존 연결
                            </span>
                          )}
                          {isNew && (
                            <span style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              새로 추가
                            </span>
                          )}
                          {isRemoved && (
                            <span style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              연결 해제
                            </span>
                          )}
                        </div>
                        
                        {template.type && (
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>
                            타입: {template.type.name}
                          </p>
                        )}
                        
                        {template.description && (
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>
                            {template.description}
                          </p>
                        )}
                      </div>

                      {isSelected ? (
                        <Check style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                      ) : (
                        <div style={{ width: '20px', height: '20px' }} />
                      )}
                    </div>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                    {searchTerm ? '검색 결과가 없습니다.' : '템플릿이 없습니다.'}
                  </div>
                )}
              </div>

              {/* 오류 메시지 */}
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#dc2626',
                  marginTop: '16px'
                }}>
                  <AlertCircle style={{ width: '16px', height: '16px' }} />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '24px', 
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button 
            className="btn btn-secondary" 
            onClick={onClose} 
            disabled={saving}
          >
            취소
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave} 
            disabled={saving || loading || !hasChanges()}
            style={{ minWidth: '80px' }}
          >
            {saving ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px' }} className="animate-spin" />
                저장 중
              </>
            ) : (
              '저장'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};