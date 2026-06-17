/**
 * 📊 DataEditor/index.tsx - 데이터 편집기 메인 페이지 컴포넌트
 * 
 * React Video Editor의 데이터 편집 전용 페이지로, JSON 편집부터 자동 생성,
 * 리소스 관리, 렌더링 모니터링까지 프로젝트 데이터를 종합적으로
 * 관리할 수 있는 통합 작업 환경을 제공합니다.
 * 
 * 주요 기능:
 * - 7가지 전문 작업 뷰 제공 (JSON 편집, 자동 생성, 리소스 관리 등)
 * - 동영상 에디터와 양방향 데이터 전달 시스템
 * - 프로젝트 템플릿 저장/불러오기 기능
 * - 실시간 JSON 편집 (Classic/Modern 에디터)
 * - 자동 생성 시스템 통합 (CSV → 비디오)
 * - 통합 리소스 관리 (미디어, 폰트, 템플릿)
 * - 렌더링 작업 모니터링 및 관리
 * - 유튜브 업로드 관리
 * - 환경설정 및 시스템 구성
 * 
 * 7가지 작업 뷰:
 * 1. JSON 편집기: 프로젝트 데이터 직접 편집
 * 2. 자동 생성: CSV 데이터로부터 비디오 자동 생성
 * 3. 리소스 관리: 미디어 파일, 폰트, 템플릿 통합 관리
 * 4. 프로젝트 관리: 프로젝트 저장/불러오기/버전 관리
 * 5. 렌더링 모니터: 비디오 렌더링 작업 상태 모니터링
 * 6. 유튜브 관리: 유튜브 채널 및 업로드 관리
 * 7. 환경설정: 시스템 설정 및 구성 관리
 * 
 * 데이터 전달 시스템:
 * - 동영상 에디터 ↔ 데이터 편집기 간 데이터 양방향 전달
 * - sessionStorage 기반 임시 데이터 전달
 * - 실시간 프로젝트 데이터 동기화
 * - 데이터 전달 활성화/비활성화 토글
 * 
 * JSON 편집 기능:
 * - Classic Editor: 전문적인 코드 편집 환경
 * - Modern Editor: 사용자 친화적인 시각적 편집 환경
 * - 실시간 JSON 검증 및 오류 처리
 * - 프로젝트 구조 자동 생성 및 관리
 * 
 * 템플릿 시스템:
 * - 프로젝트 템플릿 저장/불러오기
 * - 타입별 템플릿 분류 및 관리
 * - 템플릿 메타데이터 및 버전 관리
 * - 템플릿 재사용을 통한 생산성 향상
 * 
 * 상태 관리:
 * - 7가지 뷰 간 전환 상태 관리
 * - JSON 데이터 실시간 편집 상태
 * - 에디터 타입 전환 (Classic/Modern)
 * - 데이터 전달 설정 localStorage 연동
 * - 알림 시스템 및 사용자 피드백
 * 
 * 사용 시나리오:
 * 1. 프로젝트 데이터 직접 편집 및 디버깅
 * 2. CSV 데이터로부터 대량 비디오 자동 생성
 * 3. 미디어 리소스 체계적 관리
 * 4. 렌더링 작업 모니터링 및 문제 해결
 * 5. 유튜브 채널 연동 및 자동 업로드
 * 
 * 관련 모듈:
 * - 6번 모듈: Auto Generation System (자동 생성 뷰)
 * - JsonEditor/VanillaJsonEditor: JSON 편집 컴포넌트
 * - TemplateModal: 템플릿 관리 모달
 * - UnifiedResourceManager: 통합 리소스 관리
 * - ProjectManager: 프로젝트 관리
 * - RenderMonitor: 렌더링 모니터링
 * - YouTubeManager: 유튜브 관리
 * - SettingsView: 환경설정
 */

import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../utils/globalAlert';
import { useLocation, useNavigate } from 'react-router-dom';
import { JsonEditor } from './components/JsonEditor';
import { VanillaJsonEditor } from './components/VanillaJsonEditor';
import { TemplateModal } from './components/TemplateModal';
import { useTemplateApi } from '../../hooks/useTemplateApi';
import { AutoGenerationView } from './AutoGenerationView';
import { UnifiedResourceManager } from './UnifiedResourceManager';
import { ProjectManager } from './components/ProjectManager';
import { RenderMonitor } from './components/RenderMonitor';
import { YouTubeManager } from './components/YouTubeManager';
import { SettingsView } from './components/SettingsView';
import './styles.css';

export const DataEditor: React.FC = () => {
  const [activeView, setActiveView] = useState<'json' | 'auto-gen' | 'resource-manager' | 'project-manager' | 'render-monitor' | 'youtube-manager' | 'settings'>('json');
  const [editorType, setEditorType] = useState<'classic' | 'modern'>('classic');
  const [jsonData, setJsonData] = useState<any>({
    tracks: [],
    projectSettings: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 60,
      backgroundColor: "#000000"
    },
    bundles: [],
    templateGroups: [],
    metadata: {
      exportedAt: new Date().toISOString(),
      version: "2.1.0",
      editorVersion: "v2.1.0",
      type: "project"
    }
  });
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'load' | 'save'>('load');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { saveTemplate } = useTemplateApi();

  // 데이터 전달 토글 상태
  const [isDataTransferEnabled, setIsDataTransferEnabled] = useState(() => {
    return localStorage.getItem('video-editor-data-transfer') === 'true';
  });

  // URL 해시로 뷰 설정
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'settings') {
      setActiveView('settings');
    }
  }, []);

  // 전달받은 데이터 로드
  useEffect(() => {
    if (isDataTransferEnabled) {
      const transferData = sessionStorage.getItem('video-editor-transfer-data');
      if (transferData) {
        try {
          const parsedData = JSON.parse(transferData);
          console.log('📥 동영상 생성 화면에서 전달받은 데이터:', parsedData);

          // 데이터 구조 검증
          if (parsedData.tracks && parsedData.projectSettings) {
            setJsonData({
              ...parsedData,
              metadata: {
                exportedAt: parsedData.timestamp || new Date().toISOString(),
                version: parsedData.version || "2.1.0",
                editorVersion: "v2.1.0",
                type: "project",
                source: "video-editor-transfer"
              }
            });

            // 사용 후 삭제 (일회성)
            sessionStorage.removeItem('video-editor-transfer-data');
            showNotification('동영상 생성 화면에서 데이터를 불러왔습니다.', 'success');
          }
        } catch (error) {
          console.error('❌ 전달받은 데이터 파싱 실패:', error);
          showNotification('데이터 불러오기에 실패했습니다.', 'error');
        }
      }
    }
  }, []);

  const handleJsonChange = (newValue: any) => {
    setJsonData(newValue);
  };

  // 데이터 전달 토글 핸들러
  const handleDataTransferToggle = () => {
    const newValue = !isDataTransferEnabled;
    setIsDataTransferEnabled(newValue);
    localStorage.setItem('video-editor-data-transfer', newValue.toString());
    console.log('📤 데이터 전달 설정:', newValue ? '활성화' : '비활성화');
  };

  // 동영상 생성 화면으로 이동 (데이터 전달 포함)
  const handleNavigateToVideoEditor = async () => {
    if (isDataTransferEnabled) {
      try {
        // 현재 JSON 데이터 검증
        if (!jsonData.tracks || !jsonData.projectSettings) {
          showNotification('유효하지 않은 프로젝트 데이터입니다. tracks와 projectSettings가 필요합니다.', 'error');
          return;
        }

        // sessionStorage에 데이터 저장
        const transferData = {
          ...jsonData,
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'data-editor'
        };

        sessionStorage.setItem('data-editor-transfer-data', JSON.stringify(transferData));
        console.log('📤 동영상 생성 화면으로 전달할 데이터 저장 완료');
      } catch (error) {
        console.error('❌ 데이터 전달 준비 실패:', error);
        showNotification('데이터 전달 준비에 실패했습니다.', 'error');
        return;
      }
    }

    navigate('/');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleNewProject = () => {
    setJsonData({
      tracks: [],
      projectSettings: {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 60,
        backgroundColor: "#000000"
      },
      bundles: [],
      templateGroups: [],
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "2.1.0",
        editorVersion: "v2.1.0",
        type: "project"
      }
    });
    showNotification('새 프로젝트가 생성되었습니다.', 'success');
  };

  const handleLoadJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const jsonData = JSON.parse(content);
            setJsonData(jsonData);
          } catch (error) {
            globalAlert.error('잘못된 JSON 파일입니다.');
            console.error('JSON parsing error:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportJson = () => {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-project-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('JSON 파일이 내보내졌습니다.', 'success');
  };

  const handleOpenLoadTemplate = () => {
    setTemplateModalMode('load');
    setTemplateModalOpen(true);
  };

  const handleOpenSaveTemplate = () => {
    setTemplateModalMode('save');
    setTemplateModalOpen(true);
  };

  const handleLoadTemplate = (templateData: any) => {
    setJsonData(templateData);
    showNotification('템플릿이 성공적으로 불러와졌습니다.', 'success');
  };

  const handleSaveTemplate = async (name: string, description?: string, typeId?: string) => {
    try {
      await saveTemplate(jsonData, name, description, typeId);
      showNotification('템플릿이 성공적으로 저장되었습니다.', 'success');
    } catch (error) {
      showNotification('템플릿 저장에 실패했습니다.', 'error');
      throw error;
    }
  };

  return (
    <div className="data-editor-page">
      <div className="data-editor-header">
        <div className="header-left">
          <h1>데이터 편집기</h1>
        </div>

        <div className="header-center">
          {/* 네비게이션 탭 */}
          <div className="navigation-tabs">
            <button
              onClick={handleNavigateToVideoEditor}
              className={location.pathname === '/' ? 'nav-tab active' : 'nav-tab'}
            >
              동영상 생성
            </button>
            <button
              onClick={() => navigate('/data-editor')}
              className={location.pathname === '/data-editor' ? 'nav-tab active' : 'nav-tab'}
            >
              데이터 편집기
            </button>
          </div>

          {/* 데이터 전달 토글 */}
          <div className="data-transfer-toggle">
            <label>
              <input
                type="checkbox"
                checked={isDataTransferEnabled}
                onChange={handleDataTransferToggle}
              />
              <span>데이터 전달</span>
            </label>
          </div>
        </div>

        <div className="header-right">
          <div className="editor-controls">
            {/* 에디터 타입 스위처 (JSON 뷰에서만 표시) */}
            {activeView === 'json' && (
              <div className="editor-type-switcher">
                <label className="switcher-label">에디터:</label>
                <button
                  className={editorType === 'classic' ? 'active' : ''}
                  onClick={() => setEditorType('classic')}
                >
                  Classic
                </button>
                <button
                  className={editorType === 'modern' ? 'active' : ''}
                  onClick={() => setEditorType('modern')}
                >
                  Modern
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="editor-layout">
        <div className="properties-panel">

          {/* 뷰 전환 탭들 */}
          <div className="view-switcher">
            <button
              className={activeView === 'json' ? 'active' : ''}
              onClick={() => setActiveView('json')}
            >
              JSON 편집기
            </button>
            <button
              className={activeView === 'auto-gen' ? 'active' : ''}
              onClick={() => setActiveView('auto-gen')}
            >
              자동 생성
            </button>
            <button
              className={activeView === 'resource-manager' ? 'active' : ''}
              onClick={() => setActiveView('resource-manager')}
            >
              리소스 관리
            </button>
            <button
              className={activeView === 'project-manager' ? 'active' : ''}
              onClick={() => setActiveView('project-manager')}
            >
              프로젝트 관리
            </button>
            <button
              className={activeView === 'render-monitor' ? 'active' : ''}
              onClick={() => setActiveView('render-monitor')}
            >
              렌더링 모니터
            </button>
            <button
              className={activeView === 'youtube-manager' ? 'active' : ''}
              onClick={() => setActiveView('youtube-manager')}
            >
              유튜브 관리
            </button>
            <button
              className={activeView === 'settings' ? 'active' : ''}
              onClick={() => setActiveView('settings')}
            >
              환경설정
            </button>
          </div>

        </div>
        
        <div className="main-editor">
          {activeView === 'json' ? (
            <div className="json-editor-container">
              {editorType === 'classic' ? (
                <JsonEditor
                  value={jsonData}
                  onChange={handleJsonChange}
                  mode="code"
                  className="professional-json-editor"
                />
              ) : (
                <VanillaJsonEditor
                  value={jsonData}
                  onChange={handleJsonChange}
                  mode="text"
                  className="modern-json-editor"
                />
              )}
            </div>
          ) : activeView === 'auto-gen' ? (
            <AutoGenerationView currentJsonData={jsonData} />
          ) : activeView === 'resource-manager' ? (
            <UnifiedResourceManager />
          ) : activeView === 'project-manager' ? (
            <ProjectManager />
          ) : activeView === 'render-monitor' ? (
            <RenderMonitor />
          ) : activeView === 'youtube-manager' ? (
            <YouTubeManager />
          ) : activeView === 'settings' ? (
            <SettingsView />
          ) : null}
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={templateModalOpen}
        mode={templateModalMode}
        onClose={() => setTemplateModalOpen(false)}
        onLoadTemplate={handleLoadTemplate}
        onSaveTemplate={handleSaveTemplate}
        currentData={jsonData}
      />

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default DataEditor;