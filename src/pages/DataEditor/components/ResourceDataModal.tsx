/**
 * 리소스 데이터 모달 컴포넌트
 * @description 리소스 데이터, 템플릿, CSV 맵의 저장 및 불러오기를 위한 범용 모달 컴포넌트
 * 
 * 주요 기능:
 * - 다중 데이터 타입 지원 (리소스 데이터, 리소스 템플릿, CSV 맵)
 * - 저장 모드: 새 저장, 기존 업데이트, 새 이름으로 저장
 * - 불러오기 모드: 목록 조회, 미리보기, 개별 데이터 로드
 * - 템플릿 연결 관리 (리소스 데이터와 템플릿 간의 연관 관계)
 * - 버전 관리 시스템 통합 (최신 버전 자동 선택)
 * 
 * 지원 데이터 타입:
 * - resource: 일반 리소스 데이터 (items 배열 구조)
 * - template: 리소스 템플릿 (templateData 필드)
 * - csv-map: CSV 컬럼 맵핑 (mappingData 필드)
 * 
 * 워크플로우:
 * 1. 저장 모드: 현재 데이터 검증 → 메타데이터 입력 → 서버 저장
 * 2. 불러오기 모드: 목록 조회 → 선택 → 상세 데이터 로드 → 콜백 호출
 * 
 * 사용 사례:
 * - 자동 생성 프로젝트의 리소스 데이터 관리
 * - 템플릿 기반 워크플로우의 데이터 재사용
 * - CSV 기반 대량 데이터 처리를 위한 맵핑 관리
 */

import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../../utils/globalAlert';
import { X, Upload, Download, Eye, Trash2, RefreshCw } from 'lucide-react';
import { ResourceData } from '../../../types/autoGeneration';

/**
 * 리소스 데이터 모달 컴포넌트 속성
 * @interface ResourceDataModalProps
 */
interface ResourceDataModalProps {
  /** 모달 열림/닫힘 상태 */
  isOpen: boolean;
  /** 모달 모드 (저장 또는 불러오기) */
  mode: 'load' | 'save';
  /** 모달 닫기 콜백 함수 */
  onClose: () => void;
  /** 리소스 데이터 불러오기 완료 콜백 함수 */
  onLoadResource: (resourceData: ResourceData, resourceId?: string, resourceName?: string) => void;
  /** 리소스 데이터 저장 완료 콜백 함수 */
  onSaveResource: (name: string, description?: string, resourceId?: string, connectToTemplate?: boolean) => Promise<void>;
  /** 현재 편집 중인 리소스 데이터 */
  currentData: ResourceData;
  /** 현재 리소스 ID (업데이트 모드용) */
  currentResourceId?: string | null;
  /** 현재 리소스 이름 (업데이트 모드용) */
  currentResourceName?: string | null;
  /** 현재 템플릿 ID (연결 관리용) */
  currentTemplateId?: string | null;
  /** 현재 템플릿 이름 (연결 관리용) */
  currentTemplateName?: string | null;
  /** 현재 데이터 타입 (API 엔드포인트 결정용) */
  currentDataType?: 'resource' | 'template' | 'csv-map';
}

/**
 * 저장된 리소스 데이터 구조
 * @interface SavedResourceData
 */
interface SavedResourceData {
  /** 리소스 고유 식별자 */
  id: string;
  /** 리소스 이름 */
  name: string;
  /** 리소스 설명 (선택사항) */
  description?: string;
  /** 리소스 실제 데이터 */
  data: ResourceData;
  /** 생성 시각 */
  createdAt: string;
  /** 최종 수정 시각 */
  updatedAt: string;
}

/**
 * 리소스 데이터 모달 컴포넌트
 * 
 * 다양한 타입의 리소스 데이터를 저장하고 불러오는 범용 모달입니다.
 * 버전 관리, 템플릿 연결, 미리보기 등의 고급 기능을 제공합니다.
 * 
 * @param props - 컴포넌트 속성
 * @returns 리소스 데이터 모달 UI 컴포넌트
 */
export const ResourceDataModal: React.FC<ResourceDataModalProps> = ({
  isOpen,
  mode,
  onClose,
  onLoadResource,
  onSaveResource,
  currentData,
  currentResourceId,
  currentResourceName,
  currentTemplateId,
  currentTemplateName,
  currentDataType = 'resource'
}) => {
  const [savedResources, setSavedResources] = useState<SavedResourceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<'new' | 'update' | 'saveAs'>('new');
  const [connectToTemplate, setConnectToTemplate] = useState(true);

  /**
   * 데이터 타입에 따른 API 엔드포인트 반환 함수
   * @description 현재 데이터 타입에 맞는 API 엔드포인트 경로를 결정
   * @returns API 엔드포인트 경로 문자열
   */
  const getApiEndpoint = () => {
    switch (currentDataType) {
      case 'template':
        return '/api/resource-templates';
      case 'csv-map':
        return '/api/csv-column-maps';
      default:
        return '/api/resource-data';
    }
  };

  /**
   * 데이터 타입에 따른 한국어 표시 텍스트 반환 함수
   * @description UI에서 사용할 데이터 타입의 한국어 명칭을 반환
   * @returns 한국어 데이터 타입 명칭
   */
  const getDataTypeText = () => {
    switch (currentDataType) {
      case 'template':
        return '리소스 템플릿';
      case 'csv-map':
        return 'CSV 맵';
      default:
        return '리소스 데이터';
    }
  };

  /**
   * 데이터 타입에 따른 실제 데이터 필드명 반환 함수
   * @description API 응답에서 실제 데이터가 저장된 필드명을 결정
   * @returns 데이터 필드명 문자열
   */
  const getDataField = () => {
    switch (currentDataType) {
      case 'template':
        return 'data'; // 또는 templateData
      case 'csv-map':
        return 'mapping'; // 또는 mappingData
      default:
        return 'data';
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'load') {
      loadResourceDataList();
    } else if (isOpen && mode === 'save') {
      // 저장 모드 설정
      if (currentResourceId) {
        setSaveMode('update');
        setSaveName(currentResourceName || '');
      } else {
        setSaveMode('new');
        setSaveName('');
      }
      setSaveDescription('');
      setConnectToTemplate(true);
    }
  }, [isOpen, mode, currentResourceId, currentResourceName]);

  /**
   * 리소스 데이터 목록 로드 함수
   * @description 서버에서 저장된 리소스 데이터 목록을 조회하고 버전 정보를 정규화
   * @note 다양한 API 응답 구조를 통일된 형태로 변환
   */
  const loadResourceDataList = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiEndpoint());
      if (!response.ok) {
        throw new Error(`${getDataTypeText()} 목록을 불러올 수 없습니다`);
      }

      const result = await response.json();
      
      // API 응답 구조에 따라 데이터 추출
      let dataList = [];
      if (currentDataType === 'template') {
        // resource-templates API는 직접 배열을 반환
        dataList = Array.isArray(result) ? result : (result.templates || result.data || []);
      } else if (currentDataType === 'csv-map') {
        // csv-column-maps API는 직접 배열을 반환
        dataList = Array.isArray(result) ? result : (result.maps || result.data || []);
      } else {
        // resource-data API는 { data: [] } 구조
        dataList = result.data || [];
      }
      
      // 데이터 구조 통일 - 목록에서는 메타데이터만, 실제 데이터는 선택 시 로드
      const normalizedData = dataList.map((item: any) => {
        let data = {};
        
        if (currentDataType === 'template') {
          // 리소스 템플릿: versions 배열의 최신 버전에서 templateData 추출 (있으면)
          const latestVersion = item.versions?.[0];
          data = latestVersion?.templateData || {};
        } else if (currentDataType === 'csv-map') {
          // CSV 맵: versions 배열의 최신 버전에서 mappingData 추출 (있으면)
          const latestVersion = item.versions?.[0];
          data = latestVersion?.mappingData || {};
        } else {
          // 리소스 데이터: 직접 data 필드 사용
          data = item.data || {};
        }
        
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          data: data,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      });
      
      setSavedResources(normalizedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setSavedResources([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 리소스 데이터 저장 처리 함수
   * @description 사용자 입력을 검증하고 저장 모드에 따라 적절한 저장 작업을 수행
   * @note 새 저장, 업데이트, 새 이름으로 저장 모드 지원
   */
  const handleSave = async () => {
    if (!saveName.trim()) {
      globalAlert.error(`${getDataTypeText()} 이름을 입력해주세요`);
      return;
    }

    try {
      // 업데이트 모드일 때는 기존 리소스 ID 전달
      const resourceIdToSave = saveMode === 'update' ? currentResourceId : undefined;
      await onSaveResource(saveName, saveDescription, resourceIdToSave || undefined, connectToTemplate);
      setSaveName('');
      setSaveDescription('');
      setSaveMode('new');
      onClose();
    } catch (error) {
      globalAlert.error('저장에 실패했습니다');
    }
  };

  /**
   * 리소스 데이터 불러오기 처리 함수
   * @param resourceData - 불러올 리소스 데이터 메타정보
   * @description 목록에서 선택된 리소스의 상세 데이터를 로드하고 콜백 호출
   * @note 데이터가 비어있으면 개별 API 호출로 전체 데이터 조회
   */
  const handleLoad = async (resourceData: SavedResourceData) => {
    let actualData = resourceData.data;
    
    // 데이터가 비어있으면 개별 조회로 실제 데이터 가져오기
    if (!actualData || (Object.keys(actualData).length === 0)) {
      try {
        const response = await fetch(`${getApiEndpoint()}/${resourceData.id}`);
        if (response.ok) {
          const result = await response.json();
          
          if (currentDataType === 'template') {
            const latestVersion = result.versions?.[0];
            actualData = latestVersion?.templateData || {};
          } else if (currentDataType === 'csv-map') {
            const latestVersion = result.versions?.[0];
            actualData = latestVersion?.mappingData || {};
          } else {
            actualData = result.data || {};
          }
        }
      } catch (error) {
        console.error('Failed to load detailed data:', error);
        globalAlert.error('데이터를 불러오는 중 오류가 발생했습니다.');
        return;
      }
    }
    
    onLoadResource(actualData, resourceData.id, resourceData.name);
    setSelectedResourceId(resourceData.id);
    onClose();
  };

  /**
   * 리소스 데이터 삭제 처리 함수
   * @param id - 삭제할 리소스의 고유 식별자
   * @description 사용자 확인 후 리소스를 영구 삭제하고 목록을 새로고침
   */
  const handleDelete = async (id: string) => {
    const confirmMessage = `이 ${getDataTypeText()}을(를) 삭제하시겠습니까?`;
    if (!(await globalAlert.confirm(confirmMessage))) return;

    try {
      const response = await fetch(`${getApiEndpoint()}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다');
      }

      await loadResourceDataList();
    } catch (error) {
      globalAlert.error(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다');
    }
  };

  /**
   * 리소스 데이터 미리보기 처리 함수
   * @param resource - 미리보기할 리소스 데이터
   * @description 리소스 메타정보와 데이터 통계를 팝업으로 표시
   */
  const handlePreview = (resource: SavedResourceData) => {
    let itemInfo = '';
    
    if (currentDataType === 'template' || currentDataType === 'resource') {
      const itemCount = resource.data.items?.length || 0;
      itemInfo = `아이템 개수: ${itemCount}개`;
    } else if (currentDataType === 'csv-map') {
      const rowCount = resource.data.rows?.length || 0;
      const columnCount = resource.data.headers?.length || 0;
      itemInfo = `행: ${rowCount}개, 열: ${columnCount}개`;
    }
    
    const info = `
${getDataTypeText()}: ${resource.name}
${itemInfo}
생성일: ${new Date(resource.createdAt).toLocaleDateString()}
${resource.description ? `설명: ${resource.description}` : ''}
    `.trim();

    globalAlert.showInfo(info);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'save' ? `${getDataTypeText()} 저장` : `${getDataTypeText()} 불러오기`}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {mode === 'save' ? (
            <div className="save-form">
              {/* 저장 모드 선택 (기존 리소스 편집 중일 때만 표시) */}
              {currentResourceId && (
                <div className="form-group">
                  <label>저장 방식</label>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    marginTop: '8px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      padding: '5px 0',
                      color: '#1f2937'
                    }}>
                      <input
                        type="radio"
                        name="saveMode"
                        value="update"
                        checked={saveMode === 'update'}
                        onChange={(e) => {
                          setSaveMode('update');
                          setSaveName(currentResourceName || '');
                        }}
                        style={{ 
                          marginRight: '8px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>업데이트 (버전 추가)</span>
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      padding: '5px 0',
                      color: '#1f2937'
                    }}>
                      <input
                        type="radio"
                        name="saveMode"
                        value="saveAs"
                        checked={saveMode === 'saveAs'}
                        onChange={(e) => {
                          setSaveMode('saveAs');
                          setSaveName('');
                        }}
                        style={{ 
                          marginRight: '8px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>새 이름으로 저장</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="resource-name">이름 *</label>
                <input
                  id="resource-name"
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="리소스 데이터 이름을 입력하세요"
                  disabled={saveMode === 'update'}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="resource-description">설명</label>
                <textarea
                  id="resource-description"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="리소스 데이터에 대한 설명을 입력하세요 (선택사항)"
                  rows={3}
                />
              </div>

              {/* 템플릿 연결 체크박스 */}
              {currentTemplateId && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={connectToTemplate}
                      onChange={(e) => setConnectToTemplate(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    현재 템플릿에 연결 ({currentTemplateName || '이름 없음'})
                  </label>
                </div>
              )}

              <div className="form-group">
                <label>미리보기</label>
                <pre className="data-preview">
                  {JSON.stringify(currentData, null, 2)}
                </pre>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                  취소
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  {saveMode === 'update' ? '업데이트' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <div className="load-list">
              {loading ? (
                <div className="loading-state">
                  <RefreshCw className="animate-spin" size={24} />
                  <p>{getDataTypeText()}을(를) 불러오는 중...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p className="error-message">{error}</p>
                  <button className="btn btn-secondary" onClick={loadResourceDataList}>
                    다시 시도
                  </button>
                </div>
              ) : savedResources.length === 0 ? (
                <div className="empty-state">
                  <p>저장된 {getDataTypeText()}이(가) 없습니다</p>
                </div>
              ) : (
                <div className="resource-list">
                  {savedResources.map((resource) => (
                    <div
                      key={resource.id}
                      className={`resource-item ${selectedResourceId === resource.id ? 'selected' : ''}`}
                    >
                      <div className="resource-info">
                        <h3>{resource.name}</h3>
                        {resource.description && (
                          <p className="description">{resource.description}</p>
                        )}
                        <div className="metadata">
                          <span>
                            {currentDataType === 'csv-map' 
                              ? `행: ${resource.data.rows?.length || 0}개, 열: ${resource.data.headers?.length || 0}개`
                              : `아이템: ${resource.data.items?.length || 0}개`
                            }
                          </span>
                          <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="resource-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleLoad(resource)}
                          title={`이 ${getDataTypeText()} 불러오기`}
                        >
                          선택
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handlePreview(resource)}
                          title="미리보기"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => handleDelete(resource.id)}
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};