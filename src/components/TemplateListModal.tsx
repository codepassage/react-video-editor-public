import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Trash2, Calendar, Clock, Layers, Film, Loader2, Edit } from 'lucide-react';
import { TemplateSaveModal } from './TemplateSaveModal';
import { getTemplates, loadTemplate, deleteTemplate, generateTemplatePreview, TemplateListItem, templateToUnifiedData } from '../utils/templateUtils';
import { calculateStandardDurationFromClips } from '../utils/template';
import { UnifiedProjectManager, debugUnifiedData } from '../utils/unifiedProjectManager';
import { createServerStorage } from '../utils/storage';
import { getApiUrl } from '../utils/urlBuilder';
import { globalAlert } from '../utils/globalAlert';

interface TemplateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateLoad: (tracks: any[], projectSettings: any, bundles?: any[], templateGroups?: any[]) => void; // Bundle 정보 추가
  onTemplateInsert?: (templateId: string, insertMode: 'push' | 'overlay', groupOptions?: { isProtected: boolean; groupName: string }) => Promise<void>; // 새로운 옵션: 기존 프로젝트에 삽입
  currentTime?: number; // 현재 타임헤드 위치
  existingTracks?: any[]; // 기존 트랙들
}

export const TemplateListModal: React.FC<TemplateListModalProps> = ({
  isOpen,
  onClose,
  onTemplateLoad,
  onTemplateInsert,
  currentTime = 0,
  existingTracks = []
}) => {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [allTemplates, setAllTemplates] = useState<TemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  // 옵션 선택 모달 상태
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedTemplateForOptions, setSelectedTemplateForOptions] = useState<string | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  
  // 보호 기능 상태
  const [isProtected, setIsProtected] = useState(false);
  const [groupName, setGroupName] = useState('');
  
  
  // 이미지 전체보기는 새 창에서 처리 (상태 관리 없음)
  
  // Bundle은 무조건 보존 (옵션 제거)

  // 모달이 열릴 때 템플릿 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadTemplateList();
    }
  }, [isOpen]);

  // 🌟 새로운 통합 시스템 목록 로드
  const loadTemplateList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📂 TemplateType 정보가 포함된 템플릿 목록 로드 시작');
      
      // 🌟 TemplateType 정보가 포함된 템플릿 API 직접 호출
      const templateList = await getTemplates();
      
      setAllTemplates(templateList);
      setTemplates(templateList); // 초기에는 모든 템플릿 표시
      
      console.log('✅ TemplateType 정보가 포함된 템플릿 목록 로드 완료:', templateList.length);
      console.log('📊 템플릿 데이터 확인:', {
        allTemplates: templateList.length,
        templates: templateList.length,
        firstTemplate: templateList[0] ? {
          id: templateList[0].id,
          name: templateList[0].name,
          type: templateList[0].type?.name
        } : null
      });
      
    } catch (error) {
      console.error('❌ 새로운 통합 시스템 템플릿 목록 로드 실패:', error);
      setError(error instanceof Error ? error.message : '템플릿 목록을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 TemplateType 필터링 함수
  const handleTypeFilterChange = (typeFilter: string) => {
    setSelectedTypeFilter(typeFilter);
    
    if (typeFilter === 'all') {
      setTemplates(allTemplates);
    } else {
      const filteredTemplates = allTemplates.filter(template => 
        template.type && template.type.name === typeFilter
      );
      setTemplates(filteredTemplates);
    }
    
    console.log(`🎯 템플릿 필터 적용: ${typeFilter}, 결과: ${typeFilter === 'all' ? allTemplates.length : allTemplates.filter(t => t.type?.name === typeFilter).length}개`);
  };

  // 🌟 새로운 통합 시스템 템플릿 로드 핸들러
  const handleLoadTemplate = async (templateId: string) => {
    try {
      setLoadingTemplateId(templateId);
      
      console.log('📥 새로운 통합 시스템 TemplateListModal에서 템플릿 로드 시작:', templateId.slice(-8));
      
      // 🌟 새로운 통합 로드 메서드 사용
      const serverStorage = createServerStorage();
      const result = await UnifiedProjectManager.loadProject(
        templateId,
        serverStorage,
        { regenerateIds: true } // 템플릿은 ID 재생성
      );
      
      console.log('📥 새로운 통합 시스템 TemplateListModal에서 템플릿 로드 완료:', {
        tracks: result.tracks.length,
        clips: result.tracks.reduce((sum, track) => sum + track.clips.length, 0),
        bundles: result.bundles?.length || 0,
        templateGroups: result.templateGroups?.length || 0,
        hasBundles: !!(result.bundles && result.bundles.length > 0),
        hasTemplateGroups: !!(result.templateGroups && result.templateGroups.length > 0),
        type: result.metadata.type
      });
      
      // 🕒 재생시간 자동 조정 (표준 방식 - 공통 함수 사용)
      const allClips = result.tracks.flatMap(track => track.clips);
      const adjustedDuration = calculateStandardDurationFromClips(allClips);
      
      if (adjustedDuration > 0) {
        console.log(`🕒 TemplateListModal에서 재생시간 자동 조정 (표준): ${result.projectSettings.duration}s → ${adjustedDuration}s`);
        
        // projectSettings 업데이트
        result.projectSettings = {
          ...result.projectSettings,
          duration: adjustedDuration
        };
      }
      
      // Bundle 정보를 포함하여 콜백 호출
      onTemplateLoad(
        result.tracks, 
        result.projectSettings, 
        result.bundles, 
        result.templateGroups
      );
      
      onClose();
      
      // 성공 메시지는 부모 컴포넌트에서 처리
    } catch (error) {
      console.error('❌ 새로운 통합 시스템 템플릿 로드 실패:', error);
      globalAlert.showError(`템플릿 불러오기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoadingTemplateId(null);
    }
  };

  // 🌟 새로운 통합 시스템 옵션 선택 모달 표시
  const handleShowInsertOptions = async (templateId: string) => {
    try {
      const hasExistingData = existingTracks.some(track => track.clips.length > 0);
      
      // 템플릿 이름 찾기
      const template = templates.find(t => t.id === templateId);
      const templateName = template?.name || '템플릿';
      
      // 📊 새로운 통합 시스템으로 옵션 선택 전 검증
      if (template) {
        console.log('🔍 새로운 통합 시스템 옵션 선택 전 템플릿 상태 검증:', {
          templateId: templateId.slice(-8),
          templateName,
          hasExistingData,
          existingClips: existingTracks.reduce((sum, track) => sum + track.clips.length, 0)
        });
      }
      
      // 항상 옵션 선택 모달 표시
      setSelectedTemplateForOptions(templateId);
      setSelectedTemplateName(templateName);
      setShowOptionsModal(true);
      
      // 기본 그룹 이름 설정
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      setGroupName(`${templateName} - ${dateStr}`);
      
    } catch (error) {
      console.error('❌ 옵션 모달 표시 실패:', error);
      globalAlert.showError(`옵션 모달 표시 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 템플릿 교체 (기존 동작)
  const handleReplaceTemplate = async () => {
    if (!selectedTemplateForOptions) return;
    
    try {
      setLoadingTemplateId(selectedTemplateForOptions);
      setShowOptionsModal(false);
      
      await handleLoadTemplate(selectedTemplateForOptions);
      
    } finally {
      setSelectedTemplateForOptions(null);
    }
  };
  
  // 템플릿 삽입 (새로운 기능)
  const handleInsertTemplate = async (insertMode: 'push' | 'overlay') => {
    if (!selectedTemplateForOptions || !onTemplateInsert) return;
    
    try {
      setLoadingTemplateId(selectedTemplateForOptions);
      setShowOptionsModal(false);
      
      const groupOptions = isProtected ? {
        isProtected: true,
        groupName: groupName || `${selectedTemplateName} - 그룹`,
        preserveBundles: true  // 🌟 Bundle 무조건 보존
      } : {
        isProtected: false,
        groupName: `${selectedTemplateName} - 그룹`,
        preserveBundles: true  // 🌟 Bundle 무조건 보존
      };
      
      await onTemplateInsert(selectedTemplateForOptions, insertMode, groupOptions);
      onClose();
      
    } catch (error) {
      console.error('템플릿 삽입 실패:', error);
      globalAlert.showError(`템플릿 삽입 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoadingTemplateId(null);
      setSelectedTemplateForOptions(null);
      setIsProtected(false);
      setGroupName('');
      // Bundle은 무조건 보존되므로 초기화 불필요
    }
  };

  // 🌟 새로운 통합 시스템 템플릿 삭제 핸들러
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    const confirmed = await globalAlert.confirmDanger(`"${templateName}" 템플릿을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    try {
      setDeletingTemplateId(templateId);
      
      console.log('🗑️ 새로운 통합 시스템으로 템플릿 삭제 시작:', templateId.slice(-8));
      
      // 🌟 새로운 통합 삭제 메서드 사용
      const serverStorage = createServerStorage();
      await UnifiedProjectManager.deleteProject(templateId, serverStorage);
      
      // 목록에서 제거
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      
      console.log('✅ 새로운 통합 시스템 템플릿 삭제 완료:', templateName);
    } catch (error) {
      console.error('❌ 새로운 통합 시스템 템플릿 삭제 실패:', error);
      globalAlert.showError(`템플릿 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setDeletingTemplateId(null);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Portal을 사용하여 모달을 document.body에 직접 렌더링
  const mainModal = createPortal(
    <div 
      className="template-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483645, // Bundle 모달보다 약간 낮게
        backdropFilter: 'blur(12px)',
        animation: 'templateModalFadeIn 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="template-modal"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(51, 65, 85, 0.98) 100%)',
          borderRadius: '24px',
          padding: '40px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '85vh',
          overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          position: 'relative',
          animation: 'templateModalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '2px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0,
              background: 'linear-gradient(135deg, #64b5f6 0%, #2196f3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              템플릿 선택
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0
            }}>
              불러올 템플릿을 선택하세요
            </p>
            {existingTracks.some(track => track.clips.length > 0) && (
              <p style={{
                fontSize: '14px',
                color: 'rgba(100, 181, 246, 0.9)',
                margin: '8px 0 0 0',
                background: 'rgba(100, 181, 246, 0.1)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(100, 181, 246, 0.2)'
              }}>
                현재 시간: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} | 
                기존 클립: {existingTracks.reduce((sum, track) => sum + track.clips.length, 0)}개
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 필터 섹션 */}
        {!isLoading && !error && (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <label style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                템플릿 타입 필터:
              </label>
              <select
                value={selectedTypeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all" style={{background: '#1e293b'}}>전체 보기 ({allTemplates.length})</option>
                {Array.from(new Set(allTemplates.map(t => t.type?.name).filter(Boolean))).map(typeName => {
                  const count = allTemplates.filter(t => t.type?.name === typeName).length;
                  return (
                    <option key={typeName} value={typeName!} style={{background: '#1e293b'}}>
                      {typeName} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {selectedTypeFilter === 'all' ? 
                `전체 ${allTemplates.length}개 템플릿` : 
                `${selectedTypeFilter} 타입 ${templates.length}개 템플릿`
              }
            </div>
          </div>
        )}

        {/* 내용 */}
        <div style={{
          maxHeight: '450px',
          overflowY: 'auto',
          paddingRight: '12px',
          position: 'relative'
        }}>
          
          {/* 템플릿 목록 */}
          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              color: '#ffffff'
            }}>
              <Loader2 size={40} className="animate-spin" style={{ marginBottom: '20px' }} />
              <p style={{ fontSize: '18px' }}>템플릿 목록을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              color: '#ff6b6b',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '20px' }}>❌ {error}</p>
              <button
                onClick={loadTemplateList}
                style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                다시 시도
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center'
            }}>
              <Film size={64} style={{ marginBottom: '24px', opacity: 0.5 }} />
              <p style={{ fontSize: '24px', marginBottom: '12px' }}>저장된 템플릿이 없습니다</p>
              <p style={{ fontSize: '16px' }}>먼저 프로젝트를 만들고 "템플릿 저장" 버튼을 사용하여 템플릿을 만들어보세요.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '20px'
            }}>
              {(() => {
                console.log('🎨 템플릿 렌더링:', {
                  templatesCount: templates.length,
                  allTemplatesCount: allTemplates.length,
                  selectedFilter: selectedTypeFilter,
                  templateNames: templates.map(t => t.name)
                });
                return templates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* 스크린샷 영역 */}
                  {template.screenshotPath && (
                    <div style={{
                      width: '100%',
                      height: '120px',
                      marginBottom: '16px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // 새 창에서 이미지 열기
                      const imageUrl = `${getApiUrl()}${template.screenshotPath}`;
                      window.open(imageUrl, '_blank', 'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800');
                    }}
                    >
                      <img
                        src={`${getApiUrl()}${template.screenshotPath}`}
                        alt={`${template.name} 스크린샷`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onError={(e) => {
                          // 이미지 로드 실패 시 숨기기
                          e.currentTarget.parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* 템플릿 정보 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#ffffff',
                        margin: 0,
                        flex: 1
                      }}>
                        {template.name}
                      </h3>
                      
                      {/* 액션 버튼들 */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleShowInsertOptions(template.id)}
                          disabled={loadingTemplateId === template.id}
                          style={{
                            background: loadingTemplateId === template.id 
                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            cursor: loadingTemplateId === template.id ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {loadingTemplateId === template.id ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              로딩...
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              불러오기
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          disabled={deletingTemplateId === template.id}
                          style={{
                            background: deletingTemplateId === template.id
                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px',
                            cursor: deletingTemplateId === template.id ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {deletingTemplateId === template.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* 설명 */}
                    {template.description && (
                      <p style={{
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        margin: '0 0 16px 0',
                        lineHeight: '1.5'
                      }}>
                        {template.description}
                      </p>
                    )}
                    
                    {/* 메타데이터 */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {template.type && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          <span>{template.type.name}</span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Layers size={14} />
                        <span>{template.metadata?.totalTracks || 0}개 트랙</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Film size={14} />
                        <span>{template.metadata?.totalClips || 0}개 클립</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        <span>{formatDuration(template.metadata?.duration || 0)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        <span>{formatDate(template.updatedAt || template.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                ));
              })()}
            </div>
          )}
        </div>
        
        {/* 푸터 */}
        {!isLoading && !error && templates.length > 0 && (
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '2px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              총 {templates.length}개의 템플릿
            </div>
            
            <button
              onClick={loadTemplateList}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              새로고침
            </button>
          </div>
        )}

        {/* CSS 애니메이션 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes templateModalFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            @keyframes templateModalSlideUp {
              from { 
                opacity: 0; 
                transform: translateY(30px) scale(0.9);
              }
              to { 
                opacity: 1; 
                transform: translateY(0) scale(1);
              }
            }
            
            .template-modal-overlay {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
          `
        }} />
      </div>
    </div>,
    document.body
  );

  // 옵션 선택 모달 (별도 Portal)
  const optionsModal = showOptionsModal && selectedTemplateForOptions ? createPortal(
    <div 
      className="template-options-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647, // 가장 위에
        backdropFilter: 'blur(15px)',
        animation: 'templateModalFadeIn 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowOptionsModal(false);
          setSelectedTemplateForOptions(null);
          setIsProtected(false);
          setGroupName('');
          // Bundle은 무조건 보존되므로 초기화 불필요
        }
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(51, 65, 85, 0.98) 100%)',
        borderRadius: '20px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
        position: 'relative'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0,
              background: 'linear-gradient(135deg, #64b5f6 0%, #2196f3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              템플릿 불러오기 옵션
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '4px 0 0 0'
            }}>
              기존 프로젝트가 있습니다. 어떻게 불러오시겠습니까?
            </p>
          </div>
          
          <button
            onClick={() => {
              setShowOptionsModal(false);
              setSelectedTemplateForOptions(null);
              setIsProtected(false);
              setGroupName('');
              // Bundle은 무조건 보존되므로 초기화 불필요
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* 현재 상태 */}
        <div style={{
          background: 'rgba(100, 181, 246, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(100, 181, 246, 0.2)'
        }}>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '8px'
          }}>
            현재 프로젝트 상태:
          </div>
          <div style={{
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: '600'
          }}>
            • 트랙 수: {existingTracks.length}개
          </div>
          <div style={{
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: '600'
          }}>
            • 클립 수: {existingTracks.reduce((sum, track) => sum + track.clips.length, 0)}개
          </div>
          <div style={{
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: '600'
          }}>
            • 현재 시간: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        {/* 보호 기능 옵션 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: isProtected ? '12px' : '0'
          }}>
            <input
              type="checkbox"
              checked={isProtected}
              onChange={(e) => setIsProtected(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                marginRight: '8px',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '16px',
              color: '#ffffff',
              fontWeight: '600'
            }}>
              🛡️ 보호 기능 사용
            </span>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginLeft: '8px'
            }}>
              (템플릿을 그룹으로 묶어서 보호)
            </span>
          </label>
          
          {isProtected && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '6px'
              }}>
                그룹 이름:
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="그룹 이름을 입력하세요"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              
              {/* Bundle은 무조건 보존됨 */}
              <div style={{
                fontSize: '13px',
                color: 'rgba(100, 181, 246, 0.9)',
                marginTop: '12px',
                background: 'rgba(100, 181, 246, 0.1)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(100, 181, 246, 0.2)'
              }}>
                📦 <strong>Bundle 정보 자동 보존</strong><br/>
                • 템플릿의 Bundle 구조가 자동으로 보존됩니다<br/>
                • Bundle 드래그 시 전체 그룹이 함께 이동합니다
              </div>
              
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '6px'
              }}>
                • 그룹화된 클립들은 함께 이동/삭제됩니다<br/>
                • 시간축 이동만 가능 (트랙 변경 불가)
              </div>
            </div>
          )}
        </div>
        
        {/* 옵션 버튼들 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* 옵션 1: 교체 */}
          <button
            onClick={handleReplaceTemplate}
            disabled={loadingTemplateId === selectedTemplateForOptions}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 20px',
              cursor: loadingTemplateId === selectedTemplateForOptions ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              opacity: loadingTemplateId === selectedTemplateForOptions ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (loadingTemplateId !== selectedTemplateForOptions) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔄 기존 프로젝트 교체
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              기존 내용을 모두 삭제하고 템플릿을 불러옵니다
            </div>
          </button>
          
          {/* 옵션 2: 밀어내기 */}
          <button
            onClick={() => handleInsertTemplate('push')}
            disabled={loadingTemplateId === selectedTemplateForOptions}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 20px',
              cursor: loadingTemplateId === selectedTemplateForOptions ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              opacity: loadingTemplateId === selectedTemplateForOptions ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (loadingTemplateId !== selectedTemplateForOptions) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            📤 타임헤드 위치에 삽입 (밀어내기)
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              현재 시간 이후의 클립들을 템플릿 길이만큼 뒤로 밀어냅니다
            </div>
          </button>
          
          {/* 옵션 3: 겹쳐서 */}
          <button
            onClick={() => handleInsertTemplate('overlay')}
            disabled={loadingTemplateId === selectedTemplateForOptions}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 20px',
              cursor: loadingTemplateId === selectedTemplateForOptions ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              opacity: loadingTemplateId === selectedTemplateForOptions ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (loadingTemplateId !== selectedTemplateForOptions) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔄 타임헤드 위치에 삽입 (겹쳐서)
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              기존 클립들과 겹쳐서 템플릿을 삽입합니다
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;


  return (
    <>
      {mainModal}
      {optionsModal}
    </>
  );
};
