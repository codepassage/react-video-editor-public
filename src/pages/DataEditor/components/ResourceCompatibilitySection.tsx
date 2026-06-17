import React, { useState, useEffect } from 'react';
import { Link, Settings, Check, X, Loader2, FileText, Clock, Tag } from 'lucide-react';
import { TemplateCompatibilityModal } from './TemplateCompatibilityModal';

interface Template {
  id: string;
  name: string;
  description?: string;
  type?: {
    name: string;
  };
  createdAt?: string;
  clipCount?: number;
  bundleCount?: number;
  hasDynamicClips?: boolean;
}

interface ResourceCompatibilitySectionProps {
  resourceId?: string;
  resourceName?: string;
  onTemplateSelect?: (templateId: string) => void;
}

export const ResourceCompatibilitySection: React.FC<ResourceCompatibilitySectionProps> = ({
  resourceId,
  resourceName,
  onTemplateSelect
}) => {
  const [compatibleTemplates, setCompatibleTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [totalTemplates, setTotalTemplates] = useState(0);

  // 디버깅용 로그
  // console.log('🔍 ResourceCompatibilitySection 렌더링:', { resourceId, resourceName });

  // 호환 템플릿 목록 조회
  const fetchCompatibleTemplates = async () => {
    if (!resourceId) return;

    setLoading(true);
    setError(null);

    try {
      // 호환 템플릿과 전체 템플릿 수를 동시에 가져오기
      const [compatibleResponse, allTemplatesResponse] = await Promise.all([
        fetch(`/api/resources/${resourceId}/compatible-templates`),
        fetch('/api/templates')
      ]);

      const compatibleData = await compatibleResponse.json();
      const allTemplatesData = await allTemplatesResponse.json();

      if (compatibleData.success) {
        setCompatibleTemplates(compatibleData.templates || []);
      } else {
        setError('호환 템플릿을 불러올 수 없습니다.');
      }

      // 전체 템플릿 수 설정
      if (allTemplatesData.success || allTemplatesData.data || Array.isArray(allTemplatesData)) {
        const templates = allTemplatesData.data || allTemplatesData.templates || allTemplatesData;
        setTotalTemplates(Array.isArray(templates) ? templates.length : 0);
      }
    } catch (err) {
      console.error('Error fetching compatible templates:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 resourceId 변경 시 데이터 로드
  useEffect(() => {
    fetchCompatibleTemplates();
  }, [resourceId]);

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (templateId: string) => {
    if (onTemplateSelect) {
      onTemplateSelect(templateId);
    }
  };

  // 모달에서 연결 관리 완료 후 새로고침
  const handleModalClose = () => {
    setModalOpen(false);
    fetchCompatibleTemplates(); // 데이터 새로고침
  };

  // 테스트용: resourceId가 없어도 UI는 표시
  const isResourceLinked = !!resourceId;

  return (
    <div style={{
      backgroundColor: isResourceLinked ? 'white' : '#f9fafb',
      border: isResourceLinked ? '1px solid #e5e7eb' : '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link style={{ width: '16px', height: '16px', color: isResourceLinked ? '#3b82f6' : '#9ca3af' }} />
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: isResourceLinked ? '#111827' : '#6b7280', margin: 0 }}>
            🔗 호환 템플릿 {isResourceLinked ? '' : '(비활성)'}
          </h3>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => setModalOpen(true)}
          disabled={!isResourceLinked}
          style={{ 
            fontSize: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            opacity: isResourceLinked ? 1 : 0.5,
            backgroundColor: isResourceLinked ? '#3b82f6' : '#d1d5db',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: isResourceLinked ? 'pointer' : 'not-allowed'
          }}
        >
          <Settings style={{ width: '12px', height: '12px' }} />
          관리
        </button>
      </div>

      {/* 리소스 정보 및 호환성 통계 */}
      {isResourceLinked && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText style={{ width: '14px', height: '14px', color: '#64748b' }} />
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                {resourceName || '이름 없음'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                backgroundColor: compatibleTemplates.length > 0 ? '#10b981' : '#f59e0b',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {compatibleTemplates.length}/{totalTemplates} 연결됨
              </span>
            </div>
            {compatibleTemplates.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  {Math.round((compatibleTemplates.length / Math.max(totalTemplates, 1)) * 100)}% 호환률
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
          <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px' }} className="animate-spin" />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>로딩 중...</span>
        </div>
      )}

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
          color: '#dc2626'
        }}>
          <X style={{ width: '16px', height: '16px' }} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {!isResourceLinked ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                리소스 데이터를 저장한 후 호환 템플릿을 관리할 수 있습니다.
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                중앙 패널의 "DB 저장" 버튼을 사용해주세요.
              </p>
            </div>
          ) : compatibleTemplates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ marginBottom: '12px' }}>
                <X style={{ width: '24px', height: '24px', color: '#f59e0b', margin: '0 auto' }} />
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                연결된 호환 템플릿이 없습니다.
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                관리 버튼을 클릭하여 템플릿을 연결해보세요.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  fontSize: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                템플릿 연결하기
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {compatibleTemplates.slice(0, 3).map((template) => (
                <div
                  key={template.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleTemplateSelect(template.id)}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = '#e2e8f0';
                    target.style.borderColor = '#cbd5e1';
                    target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = '#f8fafc';
                    target.style.borderColor = '#e2e8f0';
                    target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Check style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0 }} />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1e293b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {template.name}
                      </span>
                      {template.hasDynamicClips && (
                        <span style={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          Dynamic
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {template.type && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Tag style={{ width: '10px', height: '10px', color: '#64748b' }} />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {template.type.name}
                          </span>
                        </div>
                      )}
                      {template.clipCount !== undefined && (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          클립 {template.clipCount}개
                        </span>
                      )}
                      {template.createdAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Clock style={{ width: '10px', height: '10px', color: '#64748b' }} />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {compatibleTemplates.length > 3 && (
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '4px',
                  border: '1px dashed #cbd5e1'
                }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    +{compatibleTemplates.length - 3}개 더 있음
                  </span>
                  <button
                    onClick={() => setModalOpen(true)}
                    style={{
                      marginLeft: '8px',
                      fontSize: '11px',
                      backgroundColor: 'transparent',
                      color: '#3b82f6',
                      border: 'none',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    모두 보기
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 템플릿 호환성 관리 모달 */}
      {modalOpen && isResourceLinked && (
        <TemplateCompatibilityModal
          resourceId={resourceId!}
          resourceName={resourceName}
          isOpen={modalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};