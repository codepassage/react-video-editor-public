/**
 * 🏷️ Header.tsx - 비디오 에디터 메인 헤더 컴포넌트
 * 
 * React Video Editor의 상단 헤더로, 전체 애플리케이션의 주요 제어 기능과
 * 네비게이션을 제공합니다. 재생 컨트롤, 테링 제어, 템플릿 관리,
 * 프로젝트 내보내기 등 모든 고급 기능에 대한 직접적인 인터페이스를
 * 제공하는 핵심 컴포넌트입니다.
 * 
 * 주요 기능 영역:
 * 
 * 1. 플레이백 컨트롤:
 *    - 재생/일시정지 토글
 *    - 5초 단위 탐색 (앞/뒤)
 *    - 실시간 시간 표시 및 지속시간 보기
 *    - 편집 모드 전환 (레이아웃 편집)
 * 
 * 2. 데이터 관리:
 *    - JSON 내보내기/가져오기 (통합 저장 시스템)
 *    - 템플릿 저장/로드/삽입 (전체 교체 및 시간에 삽입)
 *    - 프로젝트 초기화 (안전 확인 후)
 * 
 * 3. 내보내기 시스템:
 *    - MP4 비디오 렌더링 및 다운로드
 *    - 실시간 진행률 표시
 *    - 상세한 에러 처리 및 사용자 가이드
 * 
 * 4. 네비게이션:
 *    - VideoEditor ↔ DataEditor 페이지 전환
 *    - 데이터 전달 토글 (offset 재계산 포함)
 *    - 해상도 선택기 연동
 * 
 * 5. 상태 표시:
 *    - 저장되지 않은 변경사항 알림
 *    - 로딩 상태 인디케이터
 *    - 실시간 상태 업데이트
 * 
 * 상태 관리:
 * - useEditorStore로 중앙 상태 관리
 * - UnifiedProjectManager로 통합 데이터 운영
 * - 브라우저 로컬 저장소와 서버 상태 동기화
 * 
 * 테맅 시스템:
 * - 타입 안전성을 위한 TypeScript 완전 지원
 * - 비동기 처리를 위한 Promise 기반 API
 * - 에러 상황에 대한 세밀한 처리 및 사용자 피드백
 * 
 * 관련 모듈:
 * - 1번 모듈: Timeline System (재생 컨트롤 연동)
 * - 6번 모듈: Auto Generation System (데이터 전달)
 * - 7번 모듈: Remotion Integration (렌더링 컨트롤)
 * - 8번 모듈: State Management (중앙 상태 연동)
 * - 9번 모듈: Template System (템플릿 관리)
 */
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Save, Download, Upload, Layout, Loader2, FileJson, FolderOpen, BookTemplate, Database, RotateCcw, Menu, ChevronDown, Settings, Mic2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/editorStore';
import { ResolutionSelector } from './ResolutionSelector';
import { TemplateListModal } from './TemplateListModal';
import { TemplateSaveModal } from './TemplateSaveModal';
import { TemplateModeModal } from './TemplateModeModal';
import { TemplateUpdateModal } from './TemplateUpdateModal';

// 🌟 새로운 통합 시스템 import
import { UnifiedProjectManager } from '../utils/unifiedProjectManager';
import { createFileStorage, createServerStorage, StorageError } from '../utils/storage';

import { runQuickTest } from '../utils/testUnifiedUtils';
import { globalAlert } from '../utils/globalAlert';
import { validateTemplateName, validateProjectForTemplate } from '../utils/templateUtils';
import { recalculateEndpointOffsets } from '../types/clipAlignment';
import { applyOptimalDuration } from '../utils/durationUtils';
import { getApiUrl } from '../utils/urlBuilder';
import axios from 'axios';

/**
 * Header 컴포넌트 - 비디오 에디터의 주요 제어 인터페이스
 * 
 * 주요 책임:
 * 1. 플레이백 컨트롤 (재생/일시정지, 탐색, 시간 표시)
 * 2. 데이터 관리 (JSON 내보내기/로드, 템플릿 관리)
 * 3. 비디오 렌더링 및 다운로드
 * 4. 페이지 네비게이션 및 데이터 전달
 * 5. 상태 표시 및 사용자 피드백
 * 
 * 상태 관리:
 * - 중앙화된 에디터 상태 (useEditorStore)
 * - 로컬 컴포넌트 상태 (모달 열기/닫기, 로딩 상태)
 * - 브라우저 저장소 연동 (데이터 전달 설정)
 */
export const Header: React.FC = () => {
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    playerRealTime, // 실시간 시간 추가
    getTotalDuration,
    isEditMode,
    setEditMode,
    getClipsAtCurrentTime,
    tracks,
    projectSettings,
    loadProject,
    resetProject,
    updateProjectSettings,
    insertTemplate, // 새로운 기능
    insertTemplateAtTime, // 새로운 기능
    bundles, // Bundle 정보
    templateGroups, // TemplateGroup 정보
    hasUnsavedChanges, // 변경사항 추적
    markAsChanged,
    markAsSaved
  } = useEditorStore();

  // 라우팅 관련
  const location = useLocation();
  const navigate = useNavigate();

  // 렌더링 상태 관리
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');

  // 템플릿 상태 관리
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTemplateSaveModalOpen, setIsTemplateSaveModalOpen] = useState(false);
  const [isTemplateModeModalOpen, setIsTemplateModeModalOpen] = useState(false);
  const [isTemplateUpdateModalOpen, setIsTemplateUpdateModalOpen] = useState(false);
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);


  // 드롭다운 메뉴 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 데이터 전달 토글 상태
  const [isDataTransferEnabled, setIsDataTransferEnabled] = useState(() => {
    // localStorage에서 설정 불러오기
    return localStorage.getItem('video-editor-data-transfer') === 'true';
  });

  // 🌟 저장소 프로바이더 인스턴스
  const fileStorage = createFileStorage();
  const serverStorage = createServerStorage();

  // API 기본 URL
  const API_BASE_URL = getApiUrl();

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // 데이터 편집기에서 전달받은 데이터 로드
  useEffect(() => {
    if (location.pathname === '/' && isDataTransferEnabled) {
      const transferData = sessionStorage.getItem('data-editor-transfer-data');
      if (transferData) {
        try {
          const parsedData = JSON.parse(transferData);
          console.log('📥 데이터 편집기에서 전달받은 데이터:', parsedData);

          // 데이터 로드
          if (parsedData.tracks && parsedData.projectSettings) {
            // 편집시간 자동 계산 및 적용
            const updatedProjectSettings = applyOptimalDuration(
              parsedData.projectSettings,
              parsedData.tracks
            );

            loadProject(
              parsedData.tracks || [],
              updatedProjectSettings,
              parsedData.bundles || [],
              parsedData.templateGroups || []
            );

            // 사용 후 삭제
            sessionStorage.removeItem('data-editor-transfer-data');

            // 성공 알림 (편집시간 정보 포함)
            globalAlert.showSuccess(`데이터 편집기에서 프로젝트를 성공적으로 불러왔습니다!\n편집시간: ${updatedProjectSettings.duration}초로 자동 설정되었습니다.`);
          }
        } catch (error) {
          console.error('❌ 전달받은 데이터 로드 실패:', error);
          globalAlert.showError('데이터 편집기에서 전달받은 데이터를 불러오는데 실패했습니다.');
        }
      }
    }
  }, [location.pathname, isDataTransferEnabled, loadProject]);

  // 데이터 전달 토글 핸들러
  const handleDataTransferToggle = () => {
    const newValue = !isDataTransferEnabled;
    setIsDataTransferEnabled(newValue);
    localStorage.setItem('video-editor-data-transfer', newValue.toString());
    console.log('📤 데이터 전달 설정:', newValue ? '활성화' : '비활성화');
  };

  // 데이터 편집기로 이동 (데이터 전달 포함, Offset 재계산 포함)
  const handleNavigateToDataEditor = async () => {
    if (isDataTransferEnabled) {
      try {
        // 🔄 Step 1: Perform offset recalculation before transfer
        console.log('🔄 데이터 전달 전 offset 재계산 수행...');

        // Collect all clips
        const allClips = tracks.flatMap(track => track.clips);

        // Execute offset recalculation (with extended anchor support)
        const recalculateResult = recalculateEndpointOffsets(allClips, templateGroups, bundles);

        console.log('🔄 Offset 재계산 결과:', {
          success: recalculateResult.success,
          processedCount: recalculateResult.processedCount,
          message: recalculateResult.message
        });

        // Step 2: Update tracks with recalculated clips
        let updatedTracks = tracks;

        if (recalculateResult.success && recalculateResult.updatedClips.length > 0) {
          console.log('📊 재계산된 클립으로 트랙 업데이트...');

          // Create map of recalculated clips
          const updatedClipsMap = new Map(recalculateResult.updatedClips.map(clip => [clip.id, clip]));

          // Update tracks
          updatedTracks = tracks.map(track => ({
            ...track,
            clips: track.clips.map(clip => {
              const updatedClip = updatedClipsMap.get(clip.id);
              return updatedClip || clip; // Use recalculated clip if available, otherwise original
            })
          }));

          console.log('✅ 트랙 업데이트 완료');
        } else {
          console.log('ℹ️ 재계산할 클립이 없음, 원본 트랙 사용');
        }

        // 현재 프로젝트 데이터를 JSON으로 생성 (offset 재계산된 트랙 사용)
        const projectData = {
          tracks: updatedTracks,
          projectSettings,
          bundles,
          templateGroups,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };

        // sessionStorage에 데이터 저장 (페이지 간 전달)
        sessionStorage.setItem('video-editor-transfer-data', JSON.stringify(projectData));
        console.log('📤 데이터 편집기로 전달할 데이터 저장 완료 (offset 재계산 포함)');
      } catch (error) {
        console.error('❌ 데이터 전달 준비 실패:', error);
      }
    }

    navigate('/data-editor');
  };

  const totalDuration = getTotalDuration();

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeekBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 5));
  };

  const handleSeekForward = () => {
    setCurrentTime(Math.min(totalDuration, currentTime + 5));
  };

  // 편집 모드 토글 핸들러
  const handleToggleEditMode = () => {
    if (!isEditMode) {
      // 편집 모드 진입
      const clipsAtCurrentTime = getClipsAtCurrentTime();
      if (clipsAtCurrentTime.length === 0) {
        globalAlert.showInfo('현재 시간에 편집할 클립이 없습니다.');
        return;
      }
      setEditMode(true);
    } else {
      // 편집 모드 종료
      setEditMode(false);
    }
  };

  // 🌟 통합된 JSON 내보내기 핸들러 (새로운 통합 시스템 사용)
  const handleExportJSON = async () => {
    try {
      console.log('📤 새로운 통합 시스템으로 JSON 내보내기 시작:', {
        tracks: tracks.length,
        bundles: bundles?.length || 0,
        templateGroups: templateGroups?.length || 0
      });

      // 🌟 새로운 통합 저장 메서드 사용
      const result = await UnifiedProjectManager.saveProject(
        tracks,
        projectSettings,
        bundles,
        templateGroups,
        fileStorage, // 파일 저장소 사용
        {
          name: `project-${new Date().toISOString().slice(0, 10)}`,
          metadata: { type: 'project' }
        }
      );

      console.log('✅ 새로운 통합 JSON 내보내기 완료:', result);
      // alert(`JSON 내보내기가 성공했습니다!\n\n파일명: ${result.name}\n저장 시간: ${new Date(result.savedAt).toLocaleString()}`);

    } catch (error) {
      console.error('❌ JSON 내보내기 실패:', error);
      globalAlert.showError(`JSON 내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 🌟 통합된 JSON 가져오기 핸들러 (새로운 통합 시스템 사용)
  const handleImportJSON = async () => {
    try {
      // 기존 데이터 백업 확인
      const hasExistingData = tracks.some(track => track.clips.length > 0) ||
        (bundles && bundles.length > 0) ||
        (templateGroups && templateGroups.length > 0);
      if (hasExistingData) {
        const confirmed = await globalAlert.confirm('기존 프로젝트가 있습니다. 그래도 불러오시겠습니까?');
        if (!confirmed) return;
      }

      console.log('📥 새로운 통합 시스템으로 JSON 가져오기 시작');

      // 🌟 새로운 통합 로드 메서드 사용
      const result = await UnifiedProjectManager.loadProject(
        '', // 파일 선택 대화상자에서는 identifier 불필요
        fileStorage,
        { regenerateIds: false } // JSON은 ID 그대로 유지
      );

      console.log('📥 새로운 통합 시스템으로 JSON 가져오기 완료:', {
        tracks: result.tracks.length,
        clips: result.tracks.reduce((sum, track) => sum + track.clips.length, 0),
        bundles: result.bundles?.length || 0,
        templateGroups: result.templateGroups?.length || 0,
        type: result.metadata.type
      });

      // 🌟 통합 데이터로 프로젝트 로드 (Bundle 정보 포함)
      loadProject(
        result.tracks,
        result.projectSettings,
        result.bundles,
        result.templateGroups
      );

      // 성공 메시지
      const bundleInfo = result.bundles && result.bundles.length > 0 ? `\n📦 Bundle: ${result.bundles.length}개` : '';
      const templateGroupInfo = result.templateGroups && result.templateGroups.length > 0 ? `\n🛡️ Template Group: ${result.templateGroups.length}개` : '';

      // alert(`프로젝트를 성공적으로 불러왔습니다!\n\n트랙 수: ${result.tracks.length}\n클립 수: ${result.tracks.reduce((sum, track) => sum + track.clips.length, 0)}${bundleInfo}${templateGroupInfo}\n내보낸 시간: ${new Date(result.metadata.exportedAt).toLocaleString()}\n버전: ${result.metadata.version}`);

    } catch (error) {
      console.error('❌ JSON 가져오기 실패:', error);
      globalAlert.showError(`JSON 가져오기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 🌟 새로운 통합 템플릿 저장 핸들러 (모달 사용)
  const handleSaveTemplate = async () => {
    if (isSavingTemplate) return;

    try {
      // 현재 프로젝트 유효성 검증
      const projectValidation = validateProjectForTemplate(tracks);
      if (!projectValidation.isValid) {
        globalAlert.showError(projectValidation.message);
        return;
      }

      // 모드 선택 모달 열기
      setIsTemplateModeModalOpen(true);

    } catch (error) {
      console.error('❌ 템플릿 저장 준비 실패:', error);
      globalAlert.showError(`템플릿 저장 준비 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 템플릿 저장 모달에서 호출되는 실제 저장 함수
  const handleTemplateSave = async (name: string, description: string, typeId: string, screenshot?: File) => {
    try {
      setIsSavingTemplate(true);

      console.log('💾 새로운 통합 시스템으로 템플릿 저장 시작:', {
        name,
        description,
        typeId,
        tracks: tracks.length,
        totalClips: tracks.reduce((sum, track) => sum + track.clips.length, 0),
        bundles: bundles?.length || 0,
        templateGroups: templateGroups?.length || 0
      });

      // 🌟 TemplateType 지원하는 saveTemplate 함수 사용 (스크린샷 포함)
      const { saveTemplate } = await import('../utils/templateUtils');
      const result = await saveTemplate(
        name.trim(),
        description.trim(),
        tracks,
        projectSettings,
        bundles,
        templateGroups,
        typeId,
        screenshot
      );

      console.log('✅ 새로운 통합 템플릿 저장 성공:', result);

      // 성공 메시지
      globalAlert.showSuccess(`템플릿이 성공적으로 저장되었습니다!\n\n이름: ${result.name}\nID: ${result.id}\n저장 시간: ${new Date(result.createdAt).toLocaleString()}`);

    } catch (error) {
      console.error('❌ 템플릿 저장 실패:', error);
      globalAlert.showError(`템플릿 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      throw error; // 모달에서 처리할 수 있도록 에러를 다시 던짐
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // 템플릿 저장 모드 선택 핸들러
  const handleModeSelect = (mode: 'add' | 'update') => {
    setIsTemplateModeModalOpen(false);

    if (mode === 'add') {
      // 새 템플릿 추가
      setIsTemplateSaveModalOpen(true);
    } else {
      // 기존 템플릿 덮어쓰기
      setIsTemplateUpdateModalOpen(true);
    }
  };

  // 템플릿 덮어쓰기 핸들러
  const handleTemplateUpdate = async (templateId: string) => {
    try {
      setIsUpdatingTemplate(true);
      setIsTemplateUpdateModalOpen(false);

      console.log('🔄 템플릿 덮어쓰기 시작:', templateId);

      // 현재 프로젝트 데이터로 기존 템플릿 업데이트
      const { saveTemplate } = await import('../utils/templateUtils');

      // 기존 템플릿 정보 가져오기
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/templates/${templateId}`);

      if (!response.ok) {
        throw new Error('기존 템플릿 정보를 가져올 수 없습니다.');
      }

      const templateInfo = await response.json();
      if (!templateInfo.success || !templateInfo.template) {
        throw new Error('템플릿 정보가 올바르지 않습니다.');
      }

      // 현재 프로젝트 데이터로 템플릿 업데이트 (PUT 요청)
      const updateResponse = await fetch(`${apiUrl}/api/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tracks,
          projectSettings,
          bundles,
          templateGroups
        })
      });

      if (!updateResponse.ok) {
        throw new Error('템플릿 업데이트에 실패했습니다.');
      }

      console.log('✅ 템플릿 덮어쓰기 완료:', templateInfo.template.name);
      globalAlert.showSuccess(`"${templateInfo.template.name}" 템플릿이 현재 프로젝트 내용으로 업데이트되었습니다.`);

    } catch (error) {
      console.error('❌ 템플릿 덮어쓰기 실패:', error);
      globalAlert.showError(`템플릿 덮어쓰기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUpdatingTemplate(false);
    }
  };

  // 템플릿 불러오기 모달 열기 (개선된 버전)
  const handleOpenTemplateModal = () => {
    setIsTemplateModalOpen(true);
  };

  // 🌟 새로운 통합 템플릿 로드 처리 (교체 모드)
  const handleTemplateLoad = (tracks: any[], projectSettings: any, bundles?: any[], templateGroups?: any[]) => {
    try {
      console.log('📥 Header에서 새로운 통합 시스템 템플릿 로드 수신:', {
        tracks: tracks.length,
        bundles: bundles?.length || 0,
        templateGroups: templateGroups?.length || 0,
        hasBundles: !!(bundles && bundles.length > 0),
        hasTemplateGroups: !!(templateGroups && templateGroups.length > 0)
      });

      // Bundle 정보를 포함하여 loadProject 호출
      loadProject(tracks, projectSettings, bundles, templateGroups);

      console.log('✅ 새로운 통합 시스템 템플릿 불러오기 성공');

      // 성공 메시지 (기존보다 더 상세한 정보 표시)
      const totalClips = tracks.reduce((sum, track) => sum + track.clips.length, 0);
      const bundleInfo = bundles && bundles.length > 0 ? `\n📦 Bundle: ${bundles.length}개` : '';
      const templateGroupInfo = templateGroups && templateGroups.length > 0 ? `\n🛡️ Template Group: ${templateGroups.length}개` : '';

      // alert(`템플릿을 성공적으로 불러왔습니다!\n\n트랙 수: ${tracks.length}\n클립 수: ${totalClips}${bundleInfo}${templateGroupInfo}`);

    } catch (error) {
      console.error('❌ 템플릿 로드 처리 실패:', error);
      globalAlert.showError(`템플릿 로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 템플릿 삽입 처리 (새로운 기능)
  const handleTemplateInsert = async (templateId: string, insertMode: 'push' | 'overlay', groupOptions?: { isProtected: boolean; groupName: string }) => {
    try {
      console.log('🎆 템플릿 삽입 시작:', { templateId, insertMode, groupOptions });

      await insertTemplate(templateId, insertMode, groupOptions);

      // 성공 메시지
      const modeText = insertMode === 'push' ? '밀어내기' : '겹쳐서';
      const currentTimeText = `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`;
      const protectionText = groupOptions?.isProtected ? '\n보호 기능: 활성화' : '';

      // alert(`템플릿을 성공적으로 삽입했습니다!\n\n삽입 위치: ${currentTimeText}\n삽입 모드: ${modeText}${protectionText}`);

    } catch (error) {
      console.error('❌ 템플릿 삽입 실패:', error);
      globalAlert.showError(`템플릿 삽입 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 프로젝트 초기화 핸들러
  const handleResetProject = async () => {
    try {
      // 현재 데이터 확인
      const totalClips = tracks.reduce((sum, track) => sum + track.clips.length, 0);

      if (totalClips === 0) {
        globalAlert.showInfo('이미 빈 프로젝트입니다. 초기화할 내용이 없습니다.');
        return;
      }

      // 확인 대화상자
      const confirmed = await globalAlert.confirm(
        `정말로 프로젝트를 초기화하시겠습니까?\n\n` +
        `현재 상태:\n` +
        `- 트랙 수: ${tracks.length}\n` +
        `- 클립 수: ${totalClips}\n\n` +
        `⚠️ 이 작업은 되돌릴 수 없습니다!\n` +
        `모든 클립과 설정이 삭제되고 처음 상태로 돌아갑니다.`
      );

      if (!confirmed) return;

      // 초기화 실행
      resetProject();

      console.log('✅ 프로젝트 초기화 완료');

    } catch (error) {
      console.error('❌ 프로젝트 초기화 실패:', error);
      globalAlert.showError(`초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // mediaUrl을 상대 경로로 정규화하는 함수
  const normalizeMediaUrl = (url: string): string => {
    if (!url) return url;

    // 이미 상대 경로인 경우
    if (url.startsWith('/')) {
      return url;
    }

    // data: URL인 경우 그대로 반환
    if (url.startsWith('data:')) {
      return url;
    }

    // 절대 URL인 경우 상대 경로로 변환
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        // /uploads/로 시작하는 경로만 상대 경로로 변환
        if (urlObj.pathname.startsWith('/uploads/')) {
          return urlObj.pathname;
        }
      } catch (error) {
        console.warn('Invalid URL:', url);
      }
    }

    return url; // 변환할 수 없는 경우 원본 반환
  };

  // tracks 데이터를 정규화하는 함수 (모든 mediaUrl을 상대 경로로 변환)
  const normalizeTracksForRender = (tracks: any[]) => {
    return tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        const normalizedClip = {
          ...clip,
          mediaUrl: clip.mediaUrl ? normalizeMediaUrl(clip.mediaUrl) : undefined
        };

        // PolygonShape의 backgroundImageUrl도 정규화
        if (clip.polygonShapeProperties?.backgroundImageUrl) {
          normalizedClip.polygonShapeProperties = {
            ...clip.polygonShapeProperties,
            backgroundImageUrl: normalizeMediaUrl(clip.polygonShapeProperties.backgroundImageUrl)
          };
        }

        // Shape의 backgroundImageUrl도 정규화
        if (clip.shapeProperties?.backgroundImageUrl) {
          normalizedClip.shapeProperties = {
            ...clip.shapeProperties,
            backgroundImageUrl: normalizeMediaUrl(clip.shapeProperties.backgroundImageUrl)
          };
        }

        return normalizedClip;
      })
    }));
  };

  // 내보내기 핸들러
  const handleExport = async () => {
    if (isExporting) return;

    // 🔄 상태 초기화 함수
    const resetExportState = () => {
      setIsExporting(false);
      setExportStatus('');
      setExportProgress(0);
    };

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus('렌더링 시작 중...');

      // 총 클립 수 확인
      const totalClips = tracks.reduce((sum, track) => sum + track.clips.length, 0);
      if (totalClips === 0) {
        globalAlert.showError('내보낼 클립이 없습니다. 타임라인에 미디어를 추가해주세요.');
        resetExportState();
        return;
      }

      // 🔥 모든 mediaUrl을 상대 경로로 정규화
      const renderTracks = normalizeTracksForRender(tracks);

      // 🔍 디버깅: 정규화된 데이터 확인
      console.log('🚀 Normalized Tracks for Rendering (모든 mediaUrl 상대경로로 변환):', {
        tracksCount: renderTracks.length,
        totalClips: renderTracks.reduce((sum, track) => sum + track.clips.length, 0),
        tracks: renderTracks.map(track => ({
          id: track.id,
          name: track.name,
          clipsCount: track.clips.length,
          clips: track.clips.map(clip => ({
            id: clip.id.slice(-8),
            mediaType: clip.mediaType,
            text: clip.text,
            mediaUrl: clip.mediaUrl,
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: clip.duration,
            x: clip.x,
            y: clip.y,
            width: clip.width,
            height: clip.height,
            opacity: clip.opacity,
            // Shape 속성도 확인
            polygonShapeProps: clip.polygonShapeProperties ? {
              backgroundImageUrl: clip.polygonShapeProperties.backgroundImageUrl
            } : undefined,
            shapeProps: clip.shapeProperties ? {
              backgroundImageUrl: clip.shapeProperties.backgroundImageUrl
            } : undefined
          }))
        }))
      });

      // 프로그레스 시뮬레이션 (실제 렌더링 진행률은 서버에서만 알 수 있음)
      progressInterval = setInterval(() => {
        setExportProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          return newProgress >= 85 ? 85 : Math.floor(newProgress); // 소수점 제거
        });
      }, 1000);

      // 🎬 렌더링 API 호출 (상대 경로로 정규화된 데이터 전송)
      setExportStatus('렌더링 중...');

      console.log('📤 Sending render request with normalized relative paths');

      const response = await axios.post('/api/render', {
        tracks: renderTracks,
        projectSettings
      }, {
        responseType: 'blob', // 파일을 blob으로 받음
        timeout: 900000, // 15분 타임아웃
        onDownloadProgress: (progressEvent) => {
          // 다운로드 진행률 (렌더링 완료 후)
          if (progressEvent.total) {
            const progress = Math.floor((progressEvent.loaded / progressEvent.total) * 100); // 소수점 제거
            setExportProgress(Math.max(90, progress)); // 렌더링 완료 후 90% 이상
            setExportStatus(`다운로드 중... ${progress}%`);
          }
        }
      });

      // 🔍 API 요청 확인
      console.log('🚀 API Request Sent with normalized URLs:', {
        url: '/api/render',
        tracksLength: renderTracks.length,
        totalClips: renderTracks.reduce((sum, track) => sum + track.clips.length, 0),
        responseType: 'blob',
        sampleMediaUrls: renderTracks
          .flatMap(track => track.clips)
          .filter(clip => clip.mediaUrl)
          .slice(0, 3)
          .map(clip => ({
            id: clip.id.slice(-8),
            mediaType: clip.mediaType,
            mediaUrl: clip.mediaUrl
          }))
      });

      // ✅ interval 정리 (성공 시)
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      // Blob을 파일로 다운로드
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const downloadUrl = window.URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `video-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.mp4`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // 메모리 정리
      window.URL.revokeObjectURL(downloadUrl);

      setExportStatus('다운로드 완료!');
      setExportProgress(100);

      // ✅ 성공 시 3초 후 상태 초기화
      setTimeout(() => {
        resetExportState();
      }, 3000);

    } catch (error) {
      // 🚨 에러 발생 시 즉시 interval 정리 및 상태 초기화
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      console.error('❌ Export error:', error);

      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      let errorDetails = '';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error)) {
        if (error.response?.status === 500) {
          errorMessage = '서버에서 렌더링 오류가 발생했습니다.';
          errorDetails = '\n\n가능한 해결 방법:\n• 서버를 재시작해 보세요\n• 파일 크기나 복잡도를 줄여보세요\n• 잠시 후 다시 시도해보세요';
        } else if (error.response?.status === 400) {
          errorMessage = '요청 데이터에 오류가 있습니다.';
          errorDetails = '\n\n• 타임라인의 모든 클립이 유효한지 확인해주세요\n• 필수 미디어 파일이 누락되지 않았는지 확인해주세요';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = '렌더링 시간이 초과되었습니다 (15분).';
          errorDetails = '\n\n• 영상 길이를 줄여보세요\n• 복잡한 효과를 줄여보세요\n• 해상도를 낮춰보세요';
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
          errorMessage = '서버에 연결할 수 없습니다.';
          errorDetails = '\n\n• 네트워크 연결을 확인해주세요\n• 서버가 실행 중인지 확인해주세요';
        } else {
          errorMessage = `서버 오류가 발생했습니다 (${error.response?.status || error.code})`;
          errorDetails = '\n\n• 잠시 후 다시 시도해주세요\n• 문제가 계속되면 관리자에게 문의해주세요';
        }
      }

      // 🚨 사용자에게 상세한 에러 메시지 표시
      globalAlert.showError(`❌ 내보내기 실패\n\n${errorMessage}${errorDetails}`);

      // 🔄 에러 발생 시 즉시 상태 초기화
      resetExportState();
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 🎨 통일된 버튼 스타일 시스템
  const buttonStyles = {
    base: {
      padding: '10px 16px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '600',
      position: 'relative' as const,
      overflow: 'hidden',
      backdropFilter: 'blur(10px)'
    },

    control: {
      padding: '10px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
      position: 'relative' as const,
      overflow: 'hidden',
      backdropFilter: 'blur(10px)'
    },

    primary: {
      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)',
      color: '#ffffff',
      border: '1px solid rgba(76, 175, 80, 0.4)',
      boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
    },

    secondary: {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #64b5f6 100%)',
      color: '#ffffff',
      border: '1px solid rgba(79, 172, 254, 0.4)',
      boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
    },

    playPause: (playing: boolean) => ({
      background: playing
        ? 'linear-gradient(135deg, #f44336 0%, #e57373 50%, #ef5350 100%)'
        : 'linear-gradient(135deg, #2196f3 0%, #42a5f5 50%, #64b5f6 100%)',
      color: '#ffffff',
      border: `1px solid ${playing ? 'rgba(244, 67, 54, 0.4)' : 'rgba(33, 150, 243, 0.4)'}`,
      boxShadow: `0 4px 15px ${playing ? 'rgba(244, 67, 54, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`,
      padding: '14px 20px'
    }),

    controlButton: {
      background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.8) 0%, rgba(189, 189, 189, 0.8) 50%, rgba(224, 224, 224, 0.8) 100%)',
      color: '#ffffff',
      border: '1px solid rgba(158, 158, 158, 0.4)',
      boxShadow: '0 4px 15px rgba(158, 158, 158, 0.2)'
    },

    editMode: (isActive: boolean) => ({
      background: isActive
        ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 50%, #e53e3e 100%)'
        : 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 50%, #26a69a 100%)',
      color: '#ffffff',
      border: `1px solid ${isActive ? 'rgba(255, 107, 107, 0.4)' : 'rgba(78, 205, 196, 0.4)'}`,
      boxShadow: `0 4px 15px ${isActive ? 'rgba(255, 107, 107, 0.3)' : 'rgba(78, 205, 196, 0.3)'}`
    }),

    resetButton: {
      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #ef6c00 100%)',
      color: '#ffffff',
      border: '1px solid rgba(255, 152, 0, 0.4)',
      boxShadow: '0 4px 15px rgba(255, 152, 0, 0.3)'
    },

    menuButton: {
      background: 'linear-gradient(135deg, #546e7a 0%, #607d8b 50%, #78909c 100%)',
      color: '#ffffff',
      border: '1px solid rgba(84, 110, 122, 0.4)',
      boxShadow: '0 4px 15px rgba(84, 110, 122, 0.3)'
    }
  };

  const createButtonProps = (style: any, hoverColor: string) => ({
    style: { ...buttonStyles.base, ...style },
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
      e.currentTarget.style.boxShadow = `0 8px 25px ${hoverColor}`;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = style.boxShadow;
    }
  });

  const createControlButtonProps = (style: any, hoverColor: string) => ({
    style: { ...buttonStyles.control, ...style },
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
      e.currentTarget.style.boxShadow = `0 8px 25px ${hoverColor}`;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = style.boxShadow;
    }
  });

  return (
    <header style={{
      height: '60px',
      background: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'relative',
      zIndex: 10,
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* 로고 및 제목 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#ffffff',
          margin: 0,
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          background: 'linear-gradient(135deg, #64b5f6 0%, #2196f3 50%, #1976d2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.5px'
        }}>
          React Video Editor
        </h1>
      </div>

      {/* 중앙 재생 컨트롤 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        padding: '12px 20px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <button
          onClick={handleSeekBackward}
          {...createControlButtonProps(buttonStyles.controlButton, 'rgba(158, 158, 158, 0.4)')}
          title="5초 뒤로"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={handlePlayPause}
          {...createControlButtonProps(buttonStyles.playPause(isPlaying), isPlaying ? 'rgba(244, 67, 54, 0.5)' : 'rgba(33, 150, 243, 0.5)')}
          title={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause size={26} /> : <Play size={26} />}
        </button>

        <button
          onClick={handleSeekForward}
          {...createControlButtonProps(buttonStyles.controlButton, 'rgba(158, 158, 158, 0.4)')}
          title="5초 앞으로"
        >
          <SkipForward size={20} />
        </button>

        {/* 시간 표시 */}
        <div style={{
          fontSize: '15px',
          color: '#ffffff',
          minWidth: '110px',
          textAlign: 'center',
          fontFamily: 'monospace',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(26, 26, 46, 0.4) 100%)',
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          fontWeight: '600'
        }}>
          <span style={{ color: '#64b5f6' }}>{formatTime(isPlaying ? (playerRealTime ?? currentTime) : currentTime)}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0 4px' }}>/</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* 네비게이션 탭 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: location.pathname === '/' ?
                'linear-gradient(135deg, #0066cc 0%, #004499 100%)' :
                'transparent',
              color: location.pathname === '/' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: location.pathname === '/' ? '0 2px 8px rgba(0, 102, 204, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            동영상 생성
          </button>
          <button
            onClick={handleNavigateToDataEditor}
            style={{
              background: location.pathname === '/data-editor' ?
                'linear-gradient(135deg, #0066cc 0%, #004499 100%)' :
                'transparent',
              color: location.pathname === '/data-editor' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: location.pathname === '/data-editor' ? '0 2px 8px rgba(0, 102, 204, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/data-editor') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/data-editor') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            데이터 편집기
          </button>
        </div>

        {/* 데이터 전달 토글 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
          padding: '6px 12px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={isDataTransferEnabled}
              onChange={handleDataTransferToggle}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: '#64b5f6'
              }}
            />
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: isDataTransferEnabled ? '#64b5f6' : 'rgba(255, 255, 255, 0.7)',
              transition: 'color 0.2s ease'
            }}>
              데이터 전달
            </span>
          </label>
        </div>
      </div>

      {/* 오른쪽: 해상도 선택기 및 액션 버튼들 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* 변경사항 표시 */}
        {hasUnsavedChanges && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 193, 7, 0.2) 100%)',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            fontSize: '12px',
            color: '#ffb74d',
            fontWeight: '600'
          }}>
            <span>●</span>
            <span>저장되지 않음</span>
          </div>
        )}


        {/* 해상도 선택기 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <ResolutionSelector />
        </div>

        {/* 구분선 */}
        <div style={{
          width: '1px',
          height: '32px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)'
        }} />

        {/* 간소화된 액션 버튼들 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          position: 'relative'
        }}>
          {/* 편집 모드 버튼 */}
          <button
            onClick={handleToggleEditMode}
            {...createButtonProps(
              buttonStyles.editMode(isEditMode),
              isEditMode ? 'rgba(255, 107, 107, 0.4)' : 'rgba(78, 205, 196, 0.4)'
            )}
            title={isEditMode ? '레이아웃 모드 종료' : '레이아웃 모드 진입'}
          >
            <Layout size={18} />
            <span>레이아웃</span>
          </button>

          {/* 더보기 메뉴 버튼 */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            {...createButtonProps(buttonStyles.menuButton, 'rgba(84, 110, 122, 0.4)')}
            title="더 많은 옵션"
          >
            <Menu size={18} />
            <ChevronDown size={16} style={{
              transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} />
          </button>

          {/* 드롭다운 메뉴 */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(51, 65, 85, 0.98) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
                minWidth: '220px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
              {/* 파일 섹션 */}
              <div style={{ padding: '12px 0' }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  padding: '0 16px',
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  파일
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    // 업로드 기능 여기에 추가
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Upload size={16} />
                  <span>파일 업로드</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    // 저장 기능 여기에 추가
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Save size={16} />
                  <span>프로젝트 저장</span>
                </button>
              </div>

              {/* 구분선 */}
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

              {/* JSON 섹션 */}
              <div style={{ padding: '12px 0' }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  padding: '0 16px',
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  JSON
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleExportJSON();
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <FileJson size={16} />
                  <span>JSON 내보내기</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleImportJSON();
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <FolderOpen size={16} />
                  <span>JSON 불러오기</span>
                </button>
              </div>

              {/* 구분선 */}
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

              {/* 템플릿 섹션 */}
              <div style={{ padding: '12px 0' }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  padding: '0 16px',
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  템플릿
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSaveTemplate();
                  }}
                  disabled={isSavingTemplate}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: isSavingTemplate ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: isSavingTemplate ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSavingTemplate) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  {isSavingTemplate ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <BookTemplate size={16} />
                      <span>템플릿 저장</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleOpenTemplateModal();
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Database size={16} />
                  <span>템플릿 불러오기</span>
                </button>
              </div>

              {/* 구분선 */}
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

              {/* 기타 섹션 */}
              <div style={{ padding: '12px 0' }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  padding: '0 16px',
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  기타
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    // 데이터 편집기 환경설정 페이지로 이동
                    window.open('/data-editor#settings', '_blank');
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#4facfe',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(79, 172, 254, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Settings size={16} />
                  <span>환경설정</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleResetProject();
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#ff9800',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 152, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <RotateCcw size={16} />
                  <span>프로젝트 초기화</span>
                </button>
              </div>
            </div>
          )}

          {/* 내보내기 버튼 (그대로 유지) */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            {...createButtonProps(
              isExporting ? {
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                color: '#ffffff',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                cursor: isExporting ? 'not-allowed' : 'pointer'
              } : buttonStyles.primary,
              isExporting ? 'rgba(245, 158, 11, 0.4)' : 'rgba(76, 175, 80, 0.5)'
            )}
            title={isExporting ? exportStatus : '내보내기'}
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>내보내기 {exportProgress}%</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>내보내기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 🌟 배경 장식 효과 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%, rgba(255, 255, 255, 0.02) 100%)',
        pointerEvents: 'none',
        zIndex: -1
      }} />

      {/* 템플릿 목록 모달 */}
      <TemplateListModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onTemplateLoad={handleTemplateLoad}
        onTemplateInsert={handleTemplateInsert}
        currentTime={currentTime}
        existingTracks={tracks}
      />

      {/* 템플릿 저장 모달 */}
      <TemplateSaveModal
        isOpen={isTemplateSaveModalOpen}
        onClose={() => setIsTemplateSaveModalOpen(false)}
        onSave={handleTemplateSave}
        loading={isSavingTemplate}
      />

      {/* 템플릿 저장 모드 선택 모달 */}
      <TemplateModeModal
        isOpen={isTemplateModeModalOpen}
        onClose={() => setIsTemplateModeModalOpen(false)}
        onSelectMode={handleModeSelect}
      />

      {/* 템플릿 덮어쓰기 선택 모달 */}
      <TemplateUpdateModal
        isOpen={isTemplateUpdateModalOpen}
        onClose={() => setIsTemplateUpdateModalOpen(false)}
        onSelectTemplate={handleTemplateUpdate}
        loading={isUpdatingTemplate}
      />
    </header>
  );
};