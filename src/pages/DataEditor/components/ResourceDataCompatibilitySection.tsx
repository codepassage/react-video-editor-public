import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../../utils/globalAlert';
import { Database, Settings, Check, X, Loader2, FileText, Clock, Tag, MousePointer, Unlink } from 'lucide-react';

interface ResourceData {
  id: string;
  name: string;
  description?: string;
  version?: number;
  versionString?: string;
  itemCount?: number;
  hasNested?: boolean;
  maxDepth?: number;
  createdAt?: string;
  versions?: Array<{
    id: string;
    version: number;
    versionString: string;
    data: any;
  }>;
}

interface ResourceDataCompatibilitySectionProps {
  templateId?: string;
  templateName?: string;
  refreshTrigger?: number;
  onResourceSelect?: (resourceId: string, resourceName: string, resourceData: any) => void;
  onUnlinkResource?: (resourceId: string) => void;
}

export const ResourceDataCompatibilitySection: React.FC<ResourceDataCompatibilitySectionProps> = ({
  templateId,
  templateName,
  refreshTrigger,
  onResourceSelect,
  onUnlinkResource
}) => {
  const [compatibleResources, setCompatibleResources] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResources, setTotalResources] = useState(0);

  // 호환 리소스 목록 조회
  const fetchCompatibleResources = async () => {
    if (!templateId) return;

    setLoading(true);
    setError(null);

    try {
      // 호환 리소스와 전체 리소스 수를 동시에 가져오기
      const [compatibleResponse, allResourcesResponse] = await Promise.all([
        fetch(`/api/templates/${templateId}/compatible-resources`),
        fetch('/api/resource-data')
      ]);

      const compatibleData = await compatibleResponse.json();
      const allResourcesData = await allResourcesResponse.json();

      if (compatibleData.success) {
        setCompatibleResources(compatibleData.resources || []);
      } else {
        setError('호환 리소스를 불러올 수 없습니다.');
      }

      // 전체 리소스 수 설정
      if (allResourcesData.success || allResourcesData.data || Array.isArray(allResourcesData)) {
        const resources = allResourcesData.data || allResourcesData.resources || allResourcesData;
        setTotalResources(Array.isArray(resources) ? resources.length : 0);
      }
    } catch (err) {
      console.error('Error fetching compatible resources:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 templateId, refreshTrigger 변경 시 데이터 로드
  useEffect(() => {
    fetchCompatibleResources();
  }, [templateId, refreshTrigger]);

  // 리소스 선택 핸들러
  const handleResourceSelect = async (resourceId: string, resourceName: string) => {
    try {
      // 리소스 전체 데이터 가져오기
      const response = await fetch(`/api/resource-data/${resourceId}`);
      const result = await response.json();
      
      console.log('리소스 데이터 API 응답:', result);
      
      if (result.success && onResourceSelect) {
        // API 응답 구조에 따라 데이터 추출
        let resourceData;
        
        if (result.data) {
          // 새로운 API 응답 형식
          resourceData = result.data.data || result.data;
        } else if (result.resource) {
          // 이전 API 응답 형식
          const latestVersion = result.resource.versions?.[0];
          resourceData = latestVersion?.data || result.resource.data || { items: [] };
        } else {
          resourceData = { items: [] };
        }
        
        console.log('추출된 리소스 데이터:', resourceData);
        onResourceSelect(resourceId, resourceName, resourceData);
      }
    } catch (error) {
      console.error('리소스 데이터 로딩 실패:', error);
      globalAlert.error('리소스 데이터를 불러올 수 없습니다.');
    }
  };

  // 리소스 호환 해제 핸들러
  const handleUnlinkResource = async (resourceId: string) => {
    if (!templateId || !(await globalAlert.confirm('이 리소스와의 호환성을 해제하시겠습니까?'))) return;

    try {
      const response = await fetch(`/api/templates/${templateId}/compatible-resources/${resourceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 호환 해제 성공 시 목록 새로고침
        fetchCompatibleResources();
        if (onUnlinkResource) {
          onUnlinkResource(resourceId);
        }
      } else {
        throw new Error('호환 해제에 실패했습니다.');
      }
    } catch (error) {
      console.error('호환 해제 오류:', error);
      globalAlert.error('호환 해제 중 오류가 발생했습니다.');
    }
  };

  // 테스트용: templateId가 없어도 UI는 표시
  const isTemplateLinked = !!templateId;

  return (
    <div style={{
      backgroundColor: isTemplateLinked ? 'white' : '#f9fafb',
      border: isTemplateLinked ? '1px solid #e5e7eb' : '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database style={{ width: '16px', height: '16px', color: isTemplateLinked ? '#3b82f6' : '#9ca3af' }} />
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: isTemplateLinked ? '#111827' : '#6b7280', margin: 0 }}>
            📊 호환 데이터 리소스 {isTemplateLinked ? '' : '(비활성)'}
          </h3>
        </div>
      </div>

      {/* 템플릿 정보 및 호환성 통계 */}
      {isTemplateLinked && (
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #e0f2fe',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText style={{ width: '14px', height: '14px', color: '#0369a1' }} />
              <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: '500' }}>
                {templateName || '이름 없음'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                backgroundColor: compatibleResources.length > 0 ? '#10b981' : '#f59e0b',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {compatibleResources.length}/{totalResources} 연결됨
              </span>
            </div>
            {compatibleResources.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  {Math.round((compatibleResources.length / Math.max(totalResources, 1)) * 100)}% 호환률
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
          {!isTemplateLinked ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                템플릿을 선택한 후 호환 리소스를 확인할 수 있습니다.
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                왼쪽에서 템플릿을 선택해주세요.
              </p>
            </div>
          ) : compatibleResources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ marginBottom: '12px' }}>
                <X style={{ width: '24px', height: '24px', color: '#f59e0b', margin: '0 auto' }} />
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                연결된 호환 리소스가 없습니다.
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                이 템플릿과 호환되는 리소스가 설정되지 않았습니다.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {compatibleResources.slice(0, 3).map((resource) => (
                <div
                  key={resource.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '6px',
                    border: '1px solid #e0f2fe',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Check style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0 }} />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#0c4a6e',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {resource.name}
                      </span>
                      {resource.hasNested && (
                        <span style={{
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          Nested
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {resource.versionString && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Tag style={{ width: '10px', height: '10px', color: '#0369a1' }} />
                          <span style={{ fontSize: '11px', color: '#0369a1' }}>
                            v{resource.versionString}
                          </span>
                        </div>
                      )}
                      {resource.itemCount !== undefined && (
                        <span style={{ fontSize: '11px', color: '#0369a1' }}>
                          {resource.itemCount}개 아이템
                        </span>
                      )}
                      {resource.createdAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Clock style={{ width: '10px', height: '10px', color: '#0369a1' }} />
                          <span style={{ fontSize: '11px', color: '#0369a1' }}>
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 액션 버튼들 */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // versions 배열에서 최신 버전 데이터를 직접 사용
                        if (resource.versions && resource.versions.length > 0) {
                          const latestVersion = resource.versions[0];
                          const resourceData = latestVersion.data || { items: [] };
                          console.log('선택 버튼 클릭 - 직접 데이터 사용:', { resourceId: resource.id, resourceName: resource.name, resourceData });
                          if (onResourceSelect) {
                            onResourceSelect(resource.id, resource.name, resourceData);
                          }
                        } else {
                          // versions가 없으면 API 호출
                          handleResourceSelect(resource.id, resource.name);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                    >
                      <MousePointer style={{ width: '12px', height: '12px' }} />
                      선택
                    </button>
                    
                    <button
                      onClick={() => handleUnlinkResource(resource.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >
                      <Unlink style={{ width: '12px', height: '12px' }} />
                      호환 해제
                    </button>
                  </div>
                </div>
              ))}
              
              {compatibleResources.length > 3 && (
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '4px',
                  border: '1px dashed #bae6fd'
                }}>
                  <span style={{ fontSize: '12px', color: '#0369a1' }}>
                    +{compatibleResources.length - 3}개 더 있음
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};