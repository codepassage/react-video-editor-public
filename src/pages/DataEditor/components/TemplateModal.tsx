/**
 * 템플릿 모달 컴포넌트
 * @description 비디오 편집기 템플릿의 저장 및 불러오기를 위한 모달 컴포넌트
 * 
 * 주요 기능:
 * - 템플릿 리스트 조회 및 타입별 필터링
 * - 템플릿 저장 (이름, 설명, 타입 설정)
 * - 템플릿 불러오기 및 편집기에 적용
 * - 템플릿 삭제 기능
 * - 템플릿 데이터 미리보기 (트랙, 번들, 템플릿 그룹 통계)
 * 
 * 데이터 변환:
 * - 저장 시: 편집기 데이터 → UnifiedProjectData 형식 변환
 * - 불러오기 시: UnifiedProjectData → 편집기 데이터 형식 변환
 * 
 * 템플릿 타입:
 * - 1 단계: 기본 템플릿 타입
 * - 2 단계: 고급 템플릿 타입
 * 
 * 워크플로우:
 * 1. 저장 모드: 현재 편집기 상태 → 메타데이터 입력 → 서버 저장
 * 2. 불러오기 모드: 목록 조회 → 선택 → 데이터 로드 → 편집기 적용
 * 
 * 사용 사례:
 * - 비디오 편집 프로젝트의 템플릿화
 * - 재사용 가능한 디자인 자산 관리
 * - 팀 내 템플릿 공유 및 협업
 */

import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../../utils/globalAlert';
import { useTemplateApi } from '../../../hooks/useTemplateApi';
import './TemplateModal.css';

/**
 * 템플릿 목록 아이템 데이터 구조
 * @interface TemplateListItem
 */
interface TemplateListItem {
  /** 템플릿 고유 식별자 */
  id: string;
  /** 템플릿 이름 */
  name: string;
  /** 템플릿 설명 */
  description: string;
  /** 템플릿 타입 ID */
  typeId: string;
  /** 템플릿 타입 정보 (선택사항) */
  type?: {
    id: string;
    name: string;
    description: string;
  };
  /** 생성 시각 */
  createdAt: string;
  /** 최종 수정 시각 */
  updatedAt: string;
  /** 템플릿 메타데이터 (선택사항) */
  metadata?: any;
}

/**
 * 템플릿 모달 컴포넌트 속성
 * @interface TemplateModalProps
 */
interface TemplateModalProps {
  /** 모달 열림/닫힘 상태 */
  isOpen: boolean;
  /** 모달 모드 (저장 또는 불러오기) */
  mode: 'load' | 'save';
  /** 모달 닫기 콜백 함수 */
  onClose: () => void;
  /** 템플릿 불러오기 완료 콜백 함수 */
  onLoadTemplate?: (data: any) => void;
  /** 템플릿 저장 완료 콜백 함수 */
  onSaveTemplate?: (name: string, description?: string, typeId?: string) => void;
  /** 현재 편집기 데이터 (저장용) */
  currentData?: any;
}

/**
 * 템플릿 모달 컴포넌트
 * 
 * 비디오 편집기 템플릿을 저장하고 불러오는 모달 컴포넌트입니다.
 * 타입별 필터링, 데이터 변환, 사용자 친화적 UI를 제공합니다.
 * 
 * @param props - 컴포넌트 속성
 * @returns 템플릿 모달 UI 컴포넌트
 */
export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  mode,
  onClose,
  onLoadTemplate,
  onSaveTemplate,
  currentData
}) => {
  const { templates, templateTypes, loading, error, loadTemplateList, loadTemplateTypes, loadTemplate, deleteTemplate } = useTemplateApi();
  const [allTemplates, setAllTemplates] = useState<TemplateListItem[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'load') {
        loadTemplateList();
      }
      // Load template types for both modes
      loadTemplateTypes();
    }
  }, [isOpen, mode, loadTemplateList, loadTemplateTypes]);

  // Set default type when template types are loaded
  useEffect(() => {
    if (templateTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(templateTypes[0].id);
    }
  }, [templateTypes, selectedTypeId]);

  // Update template lists when templates change
  useEffect(() => {
    setAllTemplates(templates);
    setFilteredTemplates(templates);
  }, [templates]);

  /**
   * 템플릿 타입 필터 변경 처리 함수
   * @param typeFilter - 선택된 템플릿 타입 필터 값
   * @description 타입별로 템플릿 목록을 필터링하여 표시
   */
  const handleTypeFilterChange = (typeFilter: string) => {
    setSelectedTypeFilter(typeFilter);
    
    if (typeFilter === 'all') {
      setFilteredTemplates(allTemplates);
    } else {
      const filtered = allTemplates.filter(template => 
        template.type && template.type.name === typeFilter
      );
      setFilteredTemplates(filtered);
    }
  };

  /**
   * 템플릿 불러오기 처리 함수
   * @description 선택된 템플릿을 로드하고 편집기 형식으로 변환하여 콜백 호출
   * @note UnifiedProjectData → 편집기 데이터 형식 변환
   */
  const handleLoadTemplate = async () => {
    if (!selectedTemplateId) return;

    try {
      setActionLoading(true);
      const templateData = await loadTemplate(selectedTemplateId);
      
      // Convert UnifiedProjectData back to editor format
      const editorData = {
        tracks: templateData.tracks,
        projectSettings: templateData.projectSettings,
        bundles: templateData.bundles,
        templateGroups: templateData.templateGroups,
        metadata: {
          ...templateData.metadata,
          loadedAt: new Date().toISOString(),
          loadedFrom: 'template'
        }
      };

      onLoadTemplate?.(editorData);
      onClose();
    } catch (err) {
      console.error('Failed to load template:', err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 템플릿 저장 처리 함수
   * @description 현재 편집기 데이터를 템플릿으로 저장하고 모달을 닫음
   * @note 사용자 입력 검증 및 저장 콜백 호출
   */
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;

    try {
      setActionLoading(true);
      await onSaveTemplate?.(templateName.trim(), templateDescription.trim(), selectedTypeId);
      onClose();
      setTemplateName('');
      setTemplateDescription('');
      setSelectedTypeId(templateTypes[0]?.id || '');
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 템플릿 삭제 처리 함수
   * @param templateId - 삭제할 템플릿의 고유 식별자
   * @param templateName - 삭제할 템플릿의 이름 (확인 대화상자용)
   * @description 사용자 확인 후 템플릿을 영구 삭제하고 목록을 새로고침
   */
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!(await globalAlert.confirm(`정말로 템플릿 "${templateName}"을(를) 삭제하시겠습니까?`))) {
      return;
    }

    try {
      await deleteTemplate(templateId);
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  /**
   * 날짜 문자열을 한국어 형식으로 포맷팅하는 함수
   * @param dateString - ISO 날짜 문자열
   * @returns 한국어 로케일로 포맷된 날짜 및 시간 문자열
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (!isOpen) return null;

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-header">
          <h2>{mode === 'load' ? '템플릿 불러오기' : '템플릿 저장'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="template-modal-content">
          {mode === 'load' ? (
            <div className="load-template-content">
              {loading ? (
                <div className="loading-state">템플릿 목록을 불러오는 중...</div>
              ) : error ? (
                <div className="error-state">
                  <p>오류: {error}</p>
                  <button onClick={loadTemplateList}>다시 시도</button>
                </div>
              ) : allTemplates.length === 0 ? (
                <div className="empty-state">저장된 템플릿이 없습니다.</div>
              ) : (
                <>
                  {/* 템플릿 타입 필터 */}
                  <div className="template-filter" style={{
                    marginBottom: '20px',
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#495057'
                      }}>
                        템플릿 타입 필터:
                      </label>
                      <select
                        value={selectedTypeFilter}
                        onChange={(e) => handleTypeFilterChange(e.target.value)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '14px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          outline: 'none',
                          backgroundColor: '#ffffff',
                          color: '#495057'
                        }}
                      >
                        <option value="all" style={{color: '#495057'}}>전체 보기</option>
                        <option value="1 단계" style={{color: '#495057'}}>1 단계</option>
                        <option value="2 단계" style={{color: '#495057'}}>2 단계</option>
                      </select>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d'
                    }}>
                      {selectedTypeFilter === 'all' ? 
                        `전체 ${allTemplates.length}개 템플릿` : 
                        `${selectedTypeFilter} 타입 ${filteredTemplates.length}개 템플릿`
                      }
                    </div>
                  </div>
                </>
              )} 
              
              {!loading && !error && allTemplates.length > 0 && (
                <>
                  {filteredTemplates.length === 0 ? (
                    <div className="empty-state">
                      선택한 타입의 템플릿이 없습니다.
                    </div>
                  ) : (
                    <div className="template-list">
                      <div className="template-list-header">
                        <span>이름</span>
                        <span>설명</span>
                        <span>타입</span>
                        <span>생성일</span>
                        <span>작업</span>
                      </div>
                      {filteredTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className={`template-item ${selectedTemplateId === template.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="template-name">{template.name}</div>
                      <div className="template-description">{template.description || '설명 없음'}</div>
                      <div className="template-type">{template.type?.name || '미지정'}</div>
                      <div className="template-date">{formatDate(template.createdAt)}</div>
                      <div className="template-actions">
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id, template.name);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="save-template-content">
              <div className="form-group">
                <label htmlFor="template-name">템플릿 이름 *</label>
                <input
                  id="template-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="템플릿 이름을 입력하세요"
                  maxLength={100}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="template-description">설명</label>
                <textarea
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="템플릿에 대한 설명을 입력하세요 (선택사항)"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label htmlFor="template-type">템플릿 타입 *</label>
                {error ? (
                  <div style={{color: 'red', fontSize: '14px', marginBottom: '8px'}}>
                    템플릿 타입 불러오기 실패: {error}
                  </div>
                ) : null}
                <select
                  id="template-type"
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  disabled={loading || templateTypes.length === 0}
                >
                  {loading ? (
                    <option value="">불러오는 중...</option>
                  ) : templateTypes.length === 0 ? (
                    <option value="">템플릿 타입이 없습니다</option>
                  ) : (
                    templateTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="template-preview">
                <h4>저장될 데이터 미리보기</h4>
                <div className="preview-stats">
                  <div>트랙: {currentData?.tracks?.length || 0}개</div>
                  <div>번들: {currentData?.bundles?.length || 0}개</div>
                  <div>템플릿 그룹: {currentData?.templateGroups?.length || 0}개</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="template-modal-footer">
          <button className="cancel-button" onClick={onClose}>
            취소
          </button>
          
          {mode === 'load' ? (
            <button 
              className="load-button"
              onClick={handleLoadTemplate}
              disabled={!selectedTemplateId || actionLoading}
            >
              {actionLoading ? '불러오는 중...' : '불러오기'}
            </button>
          ) : (
            <button 
              className="save-button"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || actionLoading}
            >
              {actionLoading ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};