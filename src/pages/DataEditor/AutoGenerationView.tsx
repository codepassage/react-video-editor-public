/**
 * 🤖 AutoGenerationView.tsx - 자동 생성 시스템 메인 뷰 (6번 모듈)
 * 
 * CSV 데이터를 템플릿 기반으로 자동 비디오 생성하는 완전 자동화 시스템
 * 복잡한 데이터 워크플로우와 템플릿 매칭을 통한 대량 비디오 제작
 * 
 * 주요 기능:
 * - CSV to Video 완전 자동화 파이프라인
 * - 템플릿 호환성 자동 검증
 * - 리소스 매핑 및 검증 시스템
 * - 실시간 변환 진행률 모니터링
 * - 배치 처리 및 렌더링 대기열
 * - TTS 대량 생성 지원
 * 
 * 핵심 워크플로우:
 * 1. 템플릿 선택 (TemplateSelector)
 * 2. 리소스 데이터 준비 (ResourceSelector)
 * 3. 호환성 검증 (TemplateCompatibilityModal)
 * 4. 데이터 변환 (TransformResultModal)
 * 5. 비디오 렌더링 (RenderMonitor)
 * 6. 결과 검증 및 내보내기
 * 
 * 데이터 타입 지원:
 * - CSV 파일 (자동 파싱)
 * - JSON 리소스 (수동/자동)
 * - Nested 구조 (복합 데이터)
 * - 실시간 편집 (JSON Editor)
 * 
 * 고급 기능:
 * - 스마트 리소스 매칭
 * - 자동 TTS 생성
 * - 템플릿 변수 자동 바인딩
 * - 실시간 미리보기
 * - 오류 복구 및 재시도
 */

import React from 'react';
import { globalAlert } from '../../utils/globalAlert';
import { TemplateSelector } from './TemplateSelector';
import { ResourceSelector } from './components/ResourceSelector';
import { ResizablePanels } from '../../components/ResizablePanels';
import { ResourceDataModal } from './components/ResourceDataModal';
import { TemplateCompatibilityModal } from './components/TemplateCompatibilityModal';
import { TransformResultModal } from './components/TransformResultModal';
import { CsvToResourceModal } from './components/CsvToResourceModal';
import { EditorControls } from './components/EditorControls';
import { JsonEditorPanel } from './components/JsonEditorPanel';
import { TemplateGenerationPanel } from './components/TemplateGenerationPanel';
import { UsageGuidePanel } from './components/UsageGuidePanel';
import { useAutoGenerationState } from './hooks/useAutoGenerationState';
import { useDataTypeManager } from './hooks/useDataTypeManager';
import { useResourceManager } from './hooks/useResourceManager';
import { templateService } from './services/templateService';
import { apiService } from './services/apiService';
import { dataValidation } from './utils/dataValidation';
import './auto-generation.css';

interface AutoGenerationViewProps {
  currentJsonData?: any;
}

export const AutoGenerationView: React.FC<AutoGenerationViewProps> = ({ currentJsonData }) => {
  // 상태 관리 hooks
  const {
    selectedTemplate,
    setSelectedTemplate,
    transformResult,
    setTransformResult,
    isTransforming,
    setIsTransforming,
    isRendering,
    setIsRendering,
    useNestedForm,
    setUseNestedForm,
    jsonEditorType,
    setJsonEditorType,
    resourceModalOpen,
    setResourceModalOpen,
    resourceModalMode,
    setResourceModalMode,
    compatibilityModalOpen,
    setCompatibilityModalOpen,
    transformResultModalOpen,
    setTransformResultModalOpen,
    refreshCompatibleResources,
    setRefreshCompatibleResources,
    isGeneratingTTS,
    setIsGeneratingTTS,
    ttsResults,
    setTtsResults,
    csvModalOpen,
    setCsvModalOpen,
    selectedCsvMapId,
    setSelectedCsvMapId
  } = useAutoGenerationState();

  // 데이터 타입 관리
  const {
    currentDataType,
    setCurrentDataType,
    dataByType,
    setDataByType,
    resourceData,
    setResourceData,
    handleDataTypeSwitch
  } = useDataTypeManager();

  // 리소스 관리
  const {
    currentResourceId,
    setCurrentResourceId,
    currentResourceName,
    setCurrentResourceName,
    loadedDataItems,
    setLoadedDataItems,
    currentLoadedDataId,
    setCurrentLoadedDataId
  } = useResourceManager();

  // 자동 중첩 구조 감지 및 폼 전환
  React.useEffect(() => {
    console.log('selectedTemplate 상태 변화:', selectedTemplate);
    console.log('변환 실행 버튼 활성화 여부:', !(!selectedTemplate));
  }, [selectedTemplate]);

  React.useEffect(() => {
    console.log('🔄 resourceData 상태 변화:', resourceData);
    console.log('📊 아이템 개수:', resourceData?.items?.length || 0);

    // 중첩 구조 감지하여 적절한 폼 자동 선택
    const hasNestedStructure = resourceData?.metadata?.hasNestedStructure ||
      resourceData?.version === '2.0.0' ||
      resourceData?.items?.some(item =>
        item.nestingLevel !== undefined ||
        item.templateGroupId ||
        item.bundleId ||
        (item.containers && item.containers.some(c => c.nestingLevel !== undefined))
      );

    if (hasNestedStructure && !useNestedForm) {
      setUseNestedForm(true);
      console.log('🔄 중첩 구조 감지됨, Nested Form으로 자동 전환');
    }
  }, [resourceData, useNestedForm, setUseNestedForm]);

  // JSON 편집기의 데이터를 템플릿으로 사용
  const handleUseAsTemplate = () => {
    if (!currentJsonData) {
      globalAlert.showError('JSON 편집기에 데이터가 없습니다.');
      return;
    }
    console.log('JSON → 템플릿:', currentJsonData);
    setSelectedTemplate(currentJsonData);
  };

  // JSON 편집기의 데이터를 리소스 데이터로 사용
  const handleUseAsResource = () => {
    if (!currentJsonData) {
      globalAlert.showError('JSON 편집기에 데이터가 없습니다.');
      return;
    }

    // JSON 데이터가 리소스 데이터 형식인지 확인
    if (currentJsonData.items && Array.isArray(currentJsonData.items)) {
      setResourceData(currentJsonData);
    } else {
      globalAlert.showError('리소스 데이터 형식이 아닙니다. items 배열이 필요합니다.');
    }
  };

  const handleTransform = async () => {
    if (!selectedTemplate) {
      globalAlert.showError('템플릿을 선택해주세요.');
      return;
    }

    // 리소스 데이터가 없으면 빈 리소스로 변환 실행
    const dataToUse = resourceData.items.length === 0 ? { items: [] } : resourceData;

    setIsTransforming(true);
    setTransformResult(null);

    try {
      const result = await templateService.transform(selectedTemplate, dataToUse, useNestedForm);
      setTransformResult(result);

      if (result.success) {
        console.log('✅ 변환 성공:', result);
        if (result.statistics) {
          console.log('📊 변환 통계:', result.statistics);
        }
        setTransformResultModalOpen(true);
      } else {
        console.error('❌ 변환 실패:', result.error);
      }
    } catch (error) {
      console.error('변환 API 오류:', error);
      setTransformResult({
        success: false,
        error: '변환 중 오류가 발생했습니다.'
      });
    } finally {
      setIsTransforming(false);
    }
  };

  const handleRender = async () => {
    if (!transformResult?.success || !transformResult.transformedData) {
      globalAlert.showError('먼저 변환을 완료해주세요.');
      return;
    }

    setIsRendering(true);

    try {
      const result = await apiService.render(transformResult.transformedData);
      if (result.success) {
        globalAlert.showInfo(`렌더링이 시작되었습니다!\n작업 ID: ${result.jobId}`);
      } else {
        globalAlert.showError(`렌더링 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('렌더링 API 오류:', error);
      globalAlert.showError('렌더링 중 오류가 발생했습니다.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleSaveAsJson = () => {
    if (!transformResult?.success || !transformResult.transformedData) {
      globalAlert.showError('먼저 변환을 완료해주세요.');
      return;
    }

    try {
      templateService.saveAsJson(transformResult.transformedData);
      console.log('변환된 데이터를 JSON 파일로 저장했습니다.');
    } catch (error) {
      console.error('JSON 저장 오류:', error);
      globalAlert.showError('JSON 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSendToVideoEditor = () => {
    if (!transformResult?.success || !transformResult.transformedData) {
      globalAlert.showError('먼저 변환을 완료해주세요.');
      return;
    }

    try {
      templateService.sendToVideoEditor(transformResult.transformedData);
      console.log('🚀 [에디터로 전송] 버튼: 데이터 전달 강제 활성화 및 데이터 전송');
    } catch (error) {
      console.error('에디터로 전송 오류:', error);
      globalAlert.showError('에디터로 전송 중 오류가 발생했습니다.');
    }
  };

  // 리소스 데이터 로드
  const handleLoadResourceData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!dataValidation.validateResourceData(data, currentDataType)) {
          return;
        }

        setResourceData(data);
        globalAlert.showInfo('리소스 데이터를 성공적으로 불러왔습니다.');
      } catch (error) {
        globalAlert.showError('잘못된 JSON 파일입니다.');
      }
    };
    reader.readAsText(file);
  };

  // DB에서 리소스 데이터 저장
  const handleSaveResourceDataToDB = async (name: string, description?: string, resourceId?: string, connectToTemplate?: boolean) => {
    try {
      const savedResourceId = await apiService.saveResourceData(
        resourceData,
        currentDataType,
        name,
        description,
        resourceId
      );

      // 템플릿 연결 처리
      if (connectToTemplate && selectedTemplate?.id && savedResourceId) {
        let success = false;

        if (currentDataType === 'template') {
          // 리소스 템플릿인 경우
          success = await apiService.connectResourceTemplateToTemplate(selectedTemplate.id, savedResourceId);
        } else {
          // 리소스 데이터인 경우
          success = await apiService.connectToTemplate(selectedTemplate.id, savedResourceId);
        }

        if (success) {
          console.log('✅ 템플릿 연결 성공, 호환 리소스 목록 갱신 필요');
          setRefreshCompatibleResources(prev => prev + 1);
        }
      }

      globalAlert.showInfo('리소스 데이터가 성공적으로 저장되었습니다!');

      // 저장 후 현재 리소스 정보 업데이트
      if (!resourceId) {
        setCurrentResourceId(savedResourceId || null);
        setCurrentResourceName(name);
      }
    } catch (error) {
      console.error('DB 저장 오류:', error);
      throw error;
    }
  };

  // DB에서 리소스 데이터 불러오기
  const handleLoadResourceDataFromDB = (resourceData: any, resourceId?: string, resourceName?: string, dataType: 'resource' | 'template' | 'csv-map' = 'resource') => {
    console.log('🔄 DB에서 리소스 데이터 로딩:', resourceData, { resourceId, resourceName, dataType });

    if (!dataValidation.validateResourceData(resourceData, dataType)) {
      return;
    }

    // 타입별 데이터 저장소에 저장
    setDataByType(prev => ({
      ...prev,
      [dataType]: { ...resourceData }
    }));

    // 메타정보 업데이트
    setCurrentResourceId(resourceId || null);
    setCurrentResourceName(resourceName || '');
    setCurrentDataType(dataType);

    // 로딩된 데이터 목록에 추가 (중복 제거)
    const newDataItem = {
      id: resourceId || `temp-${Date.now()}`,
      name: resourceName || '임시 데이터',
      type: dataType,
      data: resourceData
    };

    setLoadedDataItems(prev => {
      const filtered = prev.filter(item => item.id !== newDataItem.id);
      return [...filtered, newDataItem];
    });
    setCurrentLoadedDataId(newDataItem.id);

    console.log('🎯 호환성 섹션 상태 업데이트:', {
      resourceId: resourceId || null,
      resourceName: resourceName || '',
      hasResourceData: !!resourceData,
      dataType
    });

    setTimeout(() => {
      console.log('✅ 리소스 데이터 업데이트 완료:', resourceData);
      globalAlert.showInfo(`${dataType === 'resource' ? '리소스 데이터' : dataType === 'template' ? '리소스 템플릿' : 'CSV 맵'}을 성공적으로 불러왔습니다!`);
    }, 100);
  };

  // 타입별 DB 저장 핸들러
  const handleTypedSave = async () => {
    setResourceModalMode('save');
    setResourceModalOpen(true);
  };




  // CSV에서 리소스 데이터로 변환 핸들러
  const handleCsvToResource = (resourceData: any) => {
    console.log('🔄 handleCsvToResource 호출됨:', resourceData);

    setResourceData(resourceData);
    setCurrentDataType('resource');

    console.log('✅ resourceData 상태 업데이트 완료');
    console.log('✅ currentDataType을 resource로 설정');

    // CSV 변환으로 생성된 데이터 추가
    const timestamp = Date.now();
    const newDataItem = {
      id: 'csv_converted_' + timestamp,
      name: 'CSV 변환 데이터',
      type: 'resource' as const,
      data: resourceData
    };

    setLoadedDataItems(prev => {
      const updated = [...prev, newDataItem];
      console.log('✅ loadedDataItems 업데이트:', updated);
      return updated;
    });

    setCurrentLoadedDataId(newDataItem.id);
    console.log('✅ currentLoadedDataId 설정:', newDataItem.id);

    console.log('CSV에서 변환된 리소스 데이터:', resourceData);
  };



  // 리소스 템플릿 생성 버튼 활성화 조건 확인
  const isResourceTemplateGenerationEnabled = () => {
    if (currentDataType !== 'template') return false;

    const resourceDataType = dataByType.resource;
    if (!resourceDataType || !resourceDataType.items || !Array.isArray(resourceDataType.items) || resourceDataType.items.length === 0) {
      return false;
    }

    const hasResourceDataLoaded = loadedDataItems.some(item => item.type === 'resource');
    return hasResourceDataLoaded;
  };

  // 리소스 템플릿 생성 핸들러
  const handleGenerateResourceTemplate = () => {
    const resourceDataType = dataByType.resource;

    if (!resourceDataType || !resourceDataType.items || !Array.isArray(resourceDataType.items)) {
      globalAlert.showError('리소스 데이터가 없습니다. 먼저 리소스 데이터를 로드하거나 생성해주세요.');
      return;
    }

    try {
      const templateData = templateService.generateResourceTemplate(resourceDataType);

      setDataByType(prev => ({
        ...prev,
        template: templateData
      }));

      globalAlert.showInfo('리소스 템플릿이 생성되었습니다! (containers 축소, text 초기화 완료)');

      console.log('🎯 생성된 리소스 템플릿:', templateData);
      console.log('🔍 기반이 된 리소스 데이터:', resourceDataType);
    } catch (error) {
      console.error('❌ 템플릿 생성 오류:', error);
      globalAlert.showError('템플릿 생성 중 오류가 발생했습니다.');
    }
  };

  // TTS 생성 함수
  const handleGenerateTTS = async () => {
    if (!resourceData.items || !Array.isArray(resourceData.items) || !resourceData.items.length) {
      globalAlert.showError('TTS를 생성할 리소스 데이터가 없습니다.');
      return;
    }

    setIsGeneratingTTS(true);
    setTtsResults(null);

    try {
      const result = await apiService.generateTTS(resourceData);
      setTtsResults(result);

      if (result.success) {
        console.log('✅ TTS 생성 완료:', result);
        const { summary } = result;
        globalAlert.showInfo(`TTS 생성 완료!\n성공: ${summary.successful}개\n실패: ${summary.failed}개\n캐시 활용: ${summary.cachedFiles}개`);
      } else {
        console.error('❌ TTS 생성 실패:', result.error);
        globalAlert.showError(`TTS 생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('TTS 생성 API 오류:', error);
      globalAlert.showError('TTS 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  return (
    <div className="auto-generation-view">
      <EditorControls
        useNestedForm={useNestedForm}
        onToggleNestedForm={() => setUseNestedForm(!useNestedForm)}
        onGenerateTTS={handleGenerateTTS}
        onTransform={handleTransform}
        onRender={handleRender}
        onSaveAsJson={handleSaveAsJson}
        onSendToVideoEditor={handleSendToVideoEditor}
        isGeneratingTTS={isGeneratingTTS}
        isTransforming={isTransforming}
        isRendering={isRendering}
        hasResourceData={!!(resourceData.items && Array.isArray(resourceData.items) && resourceData.items.length)}
        hasTemplate={!!selectedTemplate}
        hasTransformResult={!!(transformResult?.success)}
        currentDataType={currentDataType}
      />

      <div className="auto-gen-layout">
        <ResizablePanels
          leftPanel={
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelect={(templateData) => {
                console.log('왼쪽 템플릿 선택:', templateData);
                setSelectedTemplate(templateData);
              }}
              onQuickTransform={handleTransform}
              isTransforming={isTransforming}
              currentResourceId={currentResourceId}
            />
          }
          centerPanel={
            <>
              <TemplateGenerationPanel
                onUseAsTemplate={handleUseAsTemplate}
                onUseAsResource={handleUseAsResource}
                onCsvToResource={() => setCsvModalOpen(true)}
              />

              {!selectedTemplate ? (
                <UsageGuidePanel />
              ) : (
                <JsonEditorPanel
                  currentDataType={currentDataType}
                  onDataTypeChange={handleDataTypeSwitch}
                  resourceData={resourceData}
                  onResourceDataChange={setResourceData}
                  jsonEditorType={jsonEditorType}
                  onJsonEditorTypeChange={() => setJsonEditorType(jsonEditorType === 'classic' ? 'modern' : 'classic')}
                  onSaveToDb={handleTypedSave}
                  currentResourceName={currentResourceName}
                  onGenerateResourceTemplate={handleGenerateResourceTemplate}
                  isResourceTemplateGenerationEnabled={isResourceTemplateGenerationEnabled()}
                  onLoadResourceData={handleLoadResourceData}
                />
              )}
            </>
          }
          rightPanel={
            <div className="unified-resource-selector" style={{
              padding: '0',
              background: 'white',
              borderRadius: '8px',
              border: '2px dashed #3b82f6',
              height: '100%',
              overflow: 'hidden'
            }}>
              <ResourceSelector
                onTemplateSelect={(template) => {
                  console.log('Resource template selected:', template);
                  if (template.data) {
                    handleLoadResourceDataFromDB(template.data, template.id, template.name, 'template');
                  }
                }}
                onCsvMapSelect={(map) => {
                  console.log('CSV map selected:', map);
                  // CSV 맵 데이터를 바로 로딩
                  if (map.mapping) {
                    handleLoadResourceDataFromDB(map.mapping, map.id, map.name, 'csv-map');
                  }
                }}
                onResourceDataChange={(data) => {
                  console.log('Resource data changed:', data);
                  setResourceData(data);
                }}
                selectedTemplateId={currentResourceId}
                selectedCsvMapId={selectedCsvMapId}
                // For compatible resources tab
                templateId={selectedTemplate && typeof selectedTemplate === 'object' && selectedTemplate.id ?
                  selectedTemplate.id : null}
                templateName={selectedTemplate && typeof selectedTemplate === 'object' && selectedTemplate.name ?
                  selectedTemplate.name : null}
                refreshTrigger={refreshCompatibleResources}
                onResourceSelect={(resourceId, resourceName, resourceData) => {
                  console.log('🎯 리소스 선택됨:', { resourceId, resourceName, resourceData });
                  // DB 불러오기와 동일한 기능 수행
                  handleLoadResourceDataFromDB(resourceData.data, resourceId, resourceName, 'resource');
                }}
                onUnlinkResource={(resourceId) => {
                  console.log('리소스 호환 해제됨:', resourceId);
                  // 현재 선택된 리소스가 해제된 경우 초기화
                  if (currentResourceId === resourceId) {
                    setCurrentResourceId(null);
                    setCurrentResourceName('');
                  }
                }}
              />
            </div>
          }
          initialLeftWidth={30}
          initialCenterWidth={35}
          minWidth={20}
        />
      </div>

      {/* Resource Data Modal */}
      <ResourceDataModal
        isOpen={resourceModalOpen}
        mode={resourceModalMode}
        onClose={() => setResourceModalOpen(false)}
        onLoadResource={handleLoadResourceDataFromDB}
        onSaveResource={handleSaveResourceDataToDB}
        currentData={resourceData}
        currentResourceId={currentResourceId}
        currentResourceName={currentResourceName}
        currentTemplateId={selectedTemplate?.id || null}
        currentTemplateName={selectedTemplate?.name || null}
        currentDataType={currentDataType}
      />

      {/* Template Compatibility Modal */}
      {compatibilityModalOpen && currentResourceId && (
        <TemplateCompatibilityModal
          resourceId={currentResourceId}
          resourceName={currentResourceName}
          isOpen={compatibilityModalOpen}
          onClose={() => setCompatibilityModalOpen(false)}
        />
      )}

      {/* Transform Result Modal */}
      <TransformResultModal
        isOpen={transformResultModalOpen}
        onClose={() => setTransformResultModalOpen(false)}
        result={transformResult}
        onRender={handleRender}
        onSaveAsJson={handleSaveAsJson}
        onSendToEditor={handleSendToVideoEditor}
        isRendering={isRendering}
      />

      {/* CSV to Resource Modal */}
      <CsvToResourceModal
        isOpen={csvModalOpen}
        onClose={() => {
          setCsvModalOpen(false);
          setSelectedCsvMapId(null);
        }}
        onConvert={handleCsvToResource}
        preSelectedCsvMapId={selectedCsvMapId}
      />
    </div>
  );
};