import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../utils/globalAlert';
import { FileText, Upload, Download, Eye, Trash2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { TemplateSaveModal } from '../../components/TemplateSaveModal';
import { getApiUrl } from '../../utils/urlBuilder';

interface TemplateSelectorProps {
  selectedTemplate: any | null;
  onSelect: (template: any) => void;
  onQuickTransform?: () => void;
  isTransforming?: boolean;
  currentResourceId?: string | null; // 현재 리소스 ID 추가
}

interface Template {
  id: string;
  name: string;
  description?: string;
  data: any;
  createdAt: Date;
  clipCount: number;
  bundleCount: number;
  hasDynamicClips: boolean;
  screenshotPath?: string;
  type?: {
    id: string;
    name: string;
    description?: string;
  };
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelect,
  onQuickTransform,
  isTransforming = false,
  currentResourceId
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [compatibilityStatus, setCompatibilityStatus] = useState<Record<string, boolean>>({});

  // 이미지 전체보기는 새 창에서 처리 (상태 관리 없음)

  useEffect(() => {
    console.log('🔍 ENV DEBUG:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT,
      VITE_BACKEND_HOST: import.meta.env.VITE_BACKEND_HOST,
      getApiUrl: getApiUrl()
    });
    loadTemplates();
  }, []);

  // 현재 리소스와의 호환성 상태 조회
  useEffect(() => {
    if (currentResourceId && templates.length > 0) {
      loadCompatibilityStatus();
    }
  }, [currentResourceId, templates]);

  const loadCompatibilityStatus = async () => {
    if (!currentResourceId) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/resources/${currentResourceId}/compatible-templates`);
      const data = await response.json();

      if (data.success) {
        const compatibleTemplateIds = data.templates?.map((t: any) => t.id) || [];
        const statusMap = templates.reduce((acc, template) => {
          acc[template.id] = compatibleTemplateIds.includes(template.id);
          return acc;
        }, {} as Record<string, boolean>);

        setCompatibilityStatus(statusMap);
      }
    } catch (error) {
      console.error('Error loading compatibility status:', error);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();
      console.log('🌐 TemplateSelector API URL:', apiUrl);
      const finalUrl = `${apiUrl}/api/templates`;
      console.log('🌐 Final fetch URL:', finalUrl);
      const response = await fetch(finalUrl);
      if (!response.ok) {
        // 404 에러인 경우 서버가 준비되지 않았다는 것을 의미
        if (response.status === 404) {
          console.log('서버 템플릿 API가 준비되지 않음');
          setTemplates([]);
          return;
        }
        throw new Error('템플릿 목록을 불러올 수 없습니다');
      }

      const result = await response.json();

      // 서버 응답이 { success: true, data: [...] } 형식인지 확인
      const templatesArray = result.data || result.templates || result;

      // 배열인지 확인
      if (!Array.isArray(templatesArray)) {
        console.log('Invalid templates response, using empty array:', result);
        setTemplates([]);
        return;
      }

      const processedTemplates = templatesArray.map((template: any) => {
        return {
          ...template,
          createdAt: new Date(template.createdAt),
          clipCount: template.metadata?.totalClips || 0,
          bundleCount: template.metadata?.bundleCount || 0,
          hasDynamicClips: template.metadata?.hasDynamicProperties || false
        };
      });

      setTemplates(processedTemplates);
    } catch (err) {
      console.log('템플릿 로딩 에러:', err);
      // 네트워크 오류 등은 조용히 처리하고 빈 배열로 설정
      setTemplates([]);
      setError(null); // 에러 메시지 표시하지 않음
    } finally {
      setLoading(false);
    }
  };

  const countClips = (templateData: any): number => {
    let count = 0;
    for (const track of templateData.tracks || []) {
      count += track.clips?.length || 0;
    }
    return count;
  };

  const hasDynamicClips = (templateData: any): boolean => {
    for (const track of templateData.tracks || []) {
      for (const clip of track.clips || []) {
        const baseProps = clip.baseClipProperties?.dynamicProperties;
        const regularProps = clip.regularClipProperties?.dynamicProperties;
        if ((baseProps && baseProps.length > 0) || (regularProps && regularProps.length > 0)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const templateData = JSON.parse(e.target?.result as string);

        // 기본 검증
        if (!templateData.items) {
          globalAlert.error('유효하지 않은 템플릿 파일입니다. items 속성이 필요합니다.');
          return;
        }

        // 임시 템플릿으로 설정
        const tempTemplate = {
          id: 'temp_' + Date.now(),
          name: file.name.replace('.json', ''),
          description: '업로드된 파일',
          data: templateData,
          createdAt: new Date(),
          clipCount: countClips(templateData),
          bundleCount: templateData.bundles?.length || 0,
          hasDynamicClips: hasDynamicClips(templateData)
        };

        onSelect(tempTemplate.data);
      } catch (error) {
        globalAlert.error('잘못된 JSON 파일입니다.');
      }
    };
    reader.readAsText(file);
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshotFile(file);
      setIsUploadModalOpen(true);
    } else {
      globalAlert.error('이미지 파일만 업로드 가능합니다.');
    }
  };

  const handleTemplateUpload = async (name: string, description: string, typeId: string, screenshot?: File) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('typeId', typeId);

      if (screenshotFile || screenshot) {
        formData.append('screenshot', (screenshot || screenshotFile)!);
      }

      const response = await fetch(`${getApiUrl()}/api/templates/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('템플릿 업로드에 실패했습니다.');
      }

      await loadTemplates();
      globalAlert.showInfo('템플릿이 성공적으로 업로드되었습니다.');
    } catch (error) {
      console.error('Template upload error:', error);
      throw error;
    } finally {
      setScreenshotFile(null);
    }
  };


  const handleDownloadTemplate = (template: Template) => {
    const dataStr = JSON.stringify(template.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!(await globalAlert.confirm('이 템플릿을 삭제하시겠습니까?'))) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('템플릿 삭제에 실패했습니다');

      await loadTemplates(); // 목록 새로고침

      // 선택된 템플릿이 삭제된 경우 선택 해제
      if (selectedTemplate && (
        (typeof selectedTemplate === 'object' && selectedTemplate.id === templateId) ||
        (selectedTemplate.tracks && templates.some((t: Template) => t.id === templateId && t.data === selectedTemplate))
      )) {
        onSelect(null);
      }
    } catch (error) {
      globalAlert.error(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다');
    }
  };

  const handlePreviewTemplate = (template: Template) => {
    // 간단한 템플릿 정보 미리보기
    const info = `
템플릿: ${template.name}
클립 개수: ${template.clipCount}개
번들 개수: ${template.bundleCount}개
Dynamic Properties: ${template.hasDynamicClips ? '있음' : '없음'}
생성일: ${template.createdAt.toLocaleDateString()}

${template.description ? `설명: ${template.description}` : ''}
    `.trim();

    globalAlert.showInfo(info);
  };

  return (
    <div className="template-selector p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">템플릿 선택</h2>
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="template-upload"
          />
          <label
            htmlFor="template-upload"
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              border: '1px solid #bbdefb',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '13px',
              transition: 'background-color 0.2s'
            }}
            title="템플릿 JSON 파일을 선택하여 불러오기"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#bbdefb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e3f2fd';
            }}
          >
            <Upload size={14} />
            <span>JSON 파일 선택</span>
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleScreenshotUpload}
            className="hidden"
            id="screenshot-upload"
          />
          <label
            htmlFor="screenshot-upload"
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              backgroundColor: '#f3e5f5',
              color: '#7b1fa2',
              border: '1px solid #ce93d8',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '13px',
              transition: 'background-color 0.2s'
            }}
            title="스크린샷과 함께 템플릿 업로드"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ce93d8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3e5f5';
            }}
          >
            <ImageIcon size={14} />
            <span>스크린샷 업로드</span>
          </label>

          <button
            onClick={loadTemplates}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#f5f5f5',
              color: '#424242',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '13px',
              transition: 'background-color 0.2s',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            <RefreshCw 
              size={14} 
              style={{
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}
            />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
          <p>템플릿을 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto mb-2" size={24} />
              <p>사용 가능한 템플릿이 없습니다</p>
              <p className="text-sm">템플릿 JSON 파일을 업로드하거나 비디오 에디터에서 템플릿을 저장해주세요</p>
              <p className="text-xs mt-2 text-gray-400">
                💡 템플릿은 동영상 생성 화면에서 "템플릿 저장" 기능으로 만들 수 있습니다
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-lg p-3 transition-colors ${selectedTemplateId === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {/* 스크린샷 영역 */}
                {template.screenshotPath && (
                  <div
                    className="w-full h-24 mb-3 rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-gray-400"
                    onClick={() => {
                      // 새 창에서 이미지 열기
                      const imageUrl = `${getApiUrl()}${template.screenshotPath}`;
                      window.open(imageUrl, '_blank', 'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800');
                    }}
                  >
                    <img
                      src={`${getApiUrl()}${template.screenshotPath}`}
                      alt={`${template.name} 스크린샷`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        // 이미지 로드 실패 시 숨기기
                        e.currentTarget.parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-gray-800">{template.name}</h3>
                    {template.type && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        📂 {template.type.name}
                      </p>
                    )}
                    {template.description && (
                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                    )}

                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>클립: {template.clipCount}개</span>
                      <span>번들: {template.bundleCount}개</span>
                      {template.hasDynamicClips && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Dynamic
                        </span>
                      )}
                      {currentResourceId && (
                        compatibilityStatus[template.id] ? (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center space-x-1">
                            <span>✅</span>
                            <span>호환됨</span>
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center space-x-1">
                            <span>⚠️</span>
                            <span>연결 안됨</span>
                          </span>
                        )
                      )}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      {template.createdAt.toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1 ml-2">
                    {/* 선택 버튼 */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        console.log('🔥 선택 버튼 클릭됨!', template.id);

                        setSelectedTemplateId(template.id);
                        setLoadingTemplateId(template.id);

                        // 템플릿 전체 데이터를 서버에서 가져오기
                        try {
                          const response = await fetch(`${getApiUrl()}/api/templates/${template.id}`);
                          if (!response.ok) {
                            throw new Error('템플릿 로딩 실패');
                          }

                          const result = await response.json();
                          console.log('서버에서 받은 전체 템플릿 데이터:', result);

                          if (result.success && result.template) {
                            const templateData = result.template;

                            if (templateData && templateData.tracks && templateData.projectSettings) {
                              const fullTemplateData = {
                                id: template.id, // 템플릿 ID 추가
                                name: template.name, // 템플릿 이름 추가
                                tracks: templateData.tracks,
                                projectSettings: templateData.projectSettings,
                                bundles: templateData.bundles || [],
                                templateGroups: templateData.templateGroups || []
                              };

                              if (onSelect) {
                                onSelect(fullTemplateData);
                                console.log('✅ onSelect 호출됨 (전체 데이터):', fullTemplateData);
                              }
                            } else {
                              console.error('템플릿 데이터 구조가 잘못됨:', result);
                              throw new Error('템플릿 데이터가 올바르지 않습니다');
                            }
                          } else {
                            throw new Error('서버 응답 실패');
                          }
                        } catch (error) {
                          console.error('❌ 템플릿 로딩 에러:', error);
                          globalAlert.error('템플릿 데이터를 불러올 수 없습니다. 다시 시도해주세요.');
                        } finally {
                          setLoadingTemplateId(null);
                        }
                      }}
                      disabled={loadingTemplateId === template.id}
                      className="btn btn-primary btn-sm"
                      style={{
                        backgroundColor: selectedTemplateId === template.id ? '#1976d2' : '#f5f5f5',
                        color: selectedTemplateId === template.id ? '#ffffff' : '#424242',
                        border: `1px solid ${selectedTemplateId === template.id ? '#1976d2' : '#e0e0e0'}`,
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: loadingTemplateId === template.id ? 'not-allowed' : 'pointer',
                        opacity: loadingTemplateId === template.id ? 0.6 : 1,
                        transition: 'all 0.2s',
                        minWidth: '70px'
                      }}
                      title="이 템플릿 선택"
                      onMouseEnter={(e) => {
                        if (loadingTemplateId !== template.id && selectedTemplateId !== template.id) {
                          e.currentTarget.style.backgroundColor = '#e3f2fd';
                          e.currentTarget.style.color = '#1976d2';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (loadingTemplateId !== template.id && selectedTemplateId !== template.id) {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.style.color = '#424242';
                        }
                      }}
                    >
                      {loadingTemplateId === template.id ? '로딩...' : selectedTemplateId === template.id ? '✓ 선택됨' : '선택'}
                    </button>


                    {/* 기존 버튼들 */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewTemplate(template);
                        }}
                        className="icon-btn"
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#9e9e9e',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="미리보기"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e3f2fd';
                          e.currentTarget.style.color = '#1976d2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#9e9e9e';
                        }}
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadTemplate(template);
                        }}
                        className="icon-btn"
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#9e9e9e',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="다운로드"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e8f5e8';
                          e.currentTarget.style.color = '#4caf50';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#9e9e9e';
                        }}
                      >
                        <Download size={14} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="icon-btn danger"
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#9e9e9e',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="삭제"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffebee';
                          e.currentTarget.style.color = '#f44336';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#9e9e9e';
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}


      {selectedTemplate && typeof selectedTemplate === 'object' && selectedTemplate.tracks && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium text-sm text-blue-900">선택된 템플릿</h4>
          <div className="text-xs text-blue-700 mt-1">
            {selectedTemplate.tracks?.length || 0}개 트랙, {' '}
            {countClips(selectedTemplate)}개 클립
          </div>
          {hasDynamicClips(selectedTemplate) ? (
            <div className="text-xs text-green-700 mt-1">
              ✓ 자동 생성용 클립들이 준비되어 있습니다
            </div>
          ) : (
            <div className="text-xs text-orange-700 mt-1">
              ⚠ 이 템플릿은 자동 생성이 불가능합니다 (Dynamic Properties 없음)
            </div>
          )}
        </div>
      )}

      {/* Template Upload Modal */}
      <TemplateSaveModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setScreenshotFile(null);
        }}
        onSave={handleTemplateUpload}
        loading={false}
      />

    </div>
  );
};