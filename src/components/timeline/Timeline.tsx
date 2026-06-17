/**
 * 🎬 Timeline.tsx - 메인 타임라인 컴포넌트 (핵심 모듈 #2)
 * 
 * =====================================================================
 * 🎯 REACT 기반 비디오 편집기의 핵심 타임라인 시스템 - UI의 심장
 * =====================================================================
 * 
 * 전문적인 비디오 편집 소프트웨어의 타임라인과 동등한 기능을 제공하는
 * React 컴포넌트로, 복잡한 멀티미디어 편집 워크플로우를 지원
 * 
 * 🏗️ 아키텍처 설계 원칙:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  1. 계층형 컴포넌트 구조 - 각 기능별 독립적인 모듈화       │
 * │  2. 성능 최적화 - Zustand Selector 패턴으로 리렌더링 최소화 │
 * │  3. 실시간 동기화 - Remotion Player와 완벽한 시간 동기화    │
 * │  4. 확장성 보장 - 플러그인 방식의 클립 타입 지원           │
 * │  5. 사용성 우선 - 직관적인 드래그앤드롭 인터페이스         │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * 🎯 지원하는 8가지 클립 타입:
 * ┌────────────────┬─────────────────────────────────────────────┐
 * │ Video          │ MP4, WebM 등 비디오 파일 재생              │
 * │ Audio          │ MP3, WAV 등 오디오 파일 재생               │
 * │ Image          │ JPG, PNG 등 이미지 표시                    │
 * │ Text           │ 텍스트 오버레이, 자막                      │
 * │ Shape          │ 도형, 그래픽 요소                          │
 * │ LongSentence   │ 긴 문장 자동 분할 및 애니메이션            │
 * │ Sentence       │ 단일 문장 텍스트                           │
 * │ PolygonShape   │ 복합 다각형 도형                           │
 * └────────────────┴─────────────────────────────────────────────┘
 * 
 * 🎮 핵심 기능들:
 * • 멀티트랙 편집: 8개 트랙에서 동시 편집 지원
 * • 실시간 프리뷰: Remotion Player 완벽 동기화
 * • 드래그앤드롭: 직관적인 클립 배치/이동
 * • 번들 시스템: 관련 클립들의 그룹 관리
 * • 템플릿 시스템: 재사용 가능한 편집 패턴
 * • 키보드 단축키: 전문가용 빠른 편집 지원
 * • 연결 관계: 클립 간 앵커 연결 시각화
 * • 스냅 기능: 정확한 시간 단위 정렬
 * 
 * ⚡ 성능 최적화 전략:
 * • Zustand Selector: 필요한 상태만 선택적 구독
 * • useCallback/useMemo: 불필요한 함수 재생성 방지
 * • 가상화: 대량 클립 처리 시 렌더링 최적화
 * • 배치 업데이트: 여러 변경사항을 한 번에 처리
 * • 지연 로딩: 필요한 시점에만 컴포넌트 로드
 * 
 * 🔄 상태 동기화 시스템:
 * • currentTime: Store의 기본 시간 (일반적인 상태 업데이트)
 * • playerRealTime: Remotion Player의 실제 시간 (seeked 이벤트)
 * • playheadTime: UI 표시용 시간 (playerRealTime 사용)
 * • isDraggingPlayhead: 드래그 중 자동 스크롤 방지
 * 
 * 🎛️ 사용자 인터랙션:
 * • 클릭: 플레이헤드 이동, 클립 선택
 * • 드래그: 클립 이동, 플레이헤드 스크럽
 * • 키보드: 정밀 편집 단축키
 * • 휠: 타임라인 줌 인/아웃
 * • 우클릭: 컨텍스트 메뉴
 * 
 * 📱 반응형 디자인:
 * • 컨테이너 크기에 따른 동적 레이아웃
 * • 줌 레벨별 세부사항 표시 조절
 * • 트랙 개수에 따른 높이 자동 조절
 */

// ========================================================================
// 📦 React 및 Core 라이브러리 Import
// ========================================================================
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';

// ========================================================================
// 🏪 상태 관리 및 스토어 Import
// ========================================================================
import { useEditorStore } from '../../store/editorStore';           // 중앙 상태 관리 스토어

// ========================================================================
// 🧩 타임라인 핵심 컴포넌트들
// ========================================================================
import { TimelineTrack } from './TimelineTrack';                   // 개별 트랙 렌더링
import { TimelineRuler } from './TimelineRuler';                   // 시간 눈금자 및 플레이헤드
import { ConnectionsOverlay } from './connections/ConnectionsOverlay'; // 클립 연결 관계 시각화
import { TimelineHeader } from './header/TimelineHeader';          // 상단 제어 패널
import { TrackManager } from './managers/TrackManager';            // 트랙 관리 사이드바
import { TemplateGroupContainer } from './TemplateGroupBox';       // 템플릿 그룹 표시
import { BundleContainer } from './BundleContainer';               // 번들 그룹 표시

// ========================================================================
// 🎮 인터랙션 및 이벤트 핸들러들
// ========================================================================
import { KeyboardShortcuts } from './interactions/KeyboardShortcuts'; // 키보드 단축키 처리
import { useDragDropHandlers } from './interactions/DragDropHandlers'; // 드래그앤드롭 로직
import { usePlayheadDrag } from './hooks/usePlayheadDrag';         // 플레이헤드 드래그 처리

// ========================================================================
// 🎯 타입 정의 및 유틸리티
// ========================================================================
import { 
  DEFAULT_TRACK_HEIGHT,           // 트랙 기본 높이 상수
  isBaseClip,                     // 기준 클립 판별 함수
  disconnectClipAnchors,          // 클립 앵커 연결 해제 함수
  analyzeSelectedClipsConnections, // 선택된 클립들의 연결 상태 분석
  TimelineClip                    // 타임라인 클립 타입
} from '../../types';

// ========================================================================
// 🚨 컨텍스트 및 Alert 시스템
// ========================================================================
import { useGlobalAlert } from '../../contexts/AlertContext';      // 전역 알림 시스템

// ========================================================================
// 🎆 클립 타입 가드 시스템 - 지능형 클립 분류
// ========================================================================
import {
  isVisualClip,        // 비주얼 클립 (video, image, text, shape) 판별
  isAudioClip,         // 오디오 클립 판별 
  hasAudioProperties,  // 오디오 속성을 가진 클립 판별 (비디오 클립의 오디오 트랙 등)
  isTextClip,          // 텍스트 클립 판별
  isVideoClip,         // 비디오 클립 판별
  isImageClip,         // 이미지 클립 판별
  getClipCategory      // 클립 카테고리 분류 (visual/audio/mixed)
} from '../../types/clipGuards';

// ========================================================================
// 🔧 추가 UI 컴포넌트들
// ========================================================================
import { DragPositionOverlay } from './DragPositionOverlay';       // 드래그 위치 가이드

// ========================================================================
// 🎬 Timeline 메인 컴포넌트 정의 시작
// ========================================================================
export const Timeline: React.FC = () => {
  // ========================================================================
  // 📍 DOM 참조 및 컨테이너 관리
  // ========================================================================
  
  /**
   * 📦 타임라인 컨테이너 DOM 참조
   * 스크롤 제어, 드래그앤드롭 영역 설정, 크기 측정에 사용
   */
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // ========================================================================
  // 🖥️ 플랫폼별 UI 적응 시스템
  // ========================================================================
  
  /**
   * 🍎 운영체제 감지 (키보드 가이드 최적화)
   * Mac: Option(⌥) 키, Windows/Linux: Alt 키 사용
   */
  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && 
           navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }, []);
  const modifierKey = isMac ? 'Opt' : 'Alt';  // 플랫폼별 수정키 이름
  
  // ========================================================================
  // 🎨 로컬 UI 상태 관리
  // ========================================================================
  
  /**
   * ⌨️ 키보드 가이드 패널 표시 상태
   * 사용자가 토글 버튼으로 키보드 단축키 도움말을 표시/숨김
   */
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false);
  
  /**
   * 🔗 연결 관계 오버레이 표시 상태
   * 클립 간의 앵커 연결을 시각적으로 보여주는 기능 토글
   */
  const [showConnections, setShowConnections] = useState(true);
  
  /**
   * 🌟 번들 피드백 메시지 상태
   * 번들 조작 시 사용자에게 보여주는 임시 알림 메시지
   */
  const [showBundleMessage, setShowBundleMessage] = useState<{
    message: string; 
    type: 'success' | 'info' | 'warning'
  } | null>(null);

  // ========================================================================
  // 🔧 유틸리티 및 헬퍼 시스템
  // ========================================================================
  
  /**
   * 🚨 전역 알림 시스템 훅
   * 성공, 에러, 경고, 정보 메시지를 사용자에게 표시
   */
  const { showSuccess, showError, showWarning, showInfo } = useGlobalAlert();

  // ========================================================================
  // 📏 반응형 레이아웃 시스템
  // ========================================================================
  
  /**
   * 📐 컨테이너 너비 추적 및 Store 동기화
   * 
   * 타임라인 컨테이너의 너비를 실시간으로 추적하여 Store에 저장
   * 줌 계산, 스크롤 범위 계산, 반응형 레이아웃에 활용
   */
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        useEditorStore.getState().setTimelineContainerWidth(width);
      }
    };

    // 🎯 초기 너비 설정
    updateWidth();
    
    // 🔄 창 크기 변경 감지 및 대응
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // ========================================================================
  // 🏪 Zustand Store 선택적 구독 시스템 (성능 최적화)
  // ========================================================================
  
  /**
   * ⏰ 시간 관련 상태들 - 고빈도 업데이트 상태들을 분리하여 성능 최적화
   */
  const currentTime = useEditorStore(state => state.currentTime);              // Store의 기본 시간
  const setCurrentTime = useEditorStore(state => state.setCurrentTime);       // 일반 시간 설정
  const setCurrentTimeForced = useEditorStore(state => state.setCurrentTimeForced); // 강제 시간 이동
  const isPlaying = useEditorStore(state => state.isPlaying);                 // 재생 상태
  const playerRealTime = useEditorStore(state => state.playerRealTime);       // Remotion Player 실시간 시간
  const isDraggingPlayhead = useEditorStore(state => state.isDraggingPlayhead); // 플레이헤드 드래그 상태
  const setIsDraggingPlayhead = useEditorStore(state => state.setIsDraggingPlayhead); // 드래그 상태 설정
  const playerRef = useEditorStore(state => state.playerRef);                 // Player 인스턴스 참조

  /**
   * 🎯 플레이헤드 표시용 시간 결정
   * 
   * UI에서 플레이헤드 위치를 표시할 때 사용하는 시간
   * playerRealTime을 사용하여 Remotion Player와 완벽한 동기화 보장
   * seeked 이벤트 기반으로 업데이트되어 가장 정확한 시간 정보 제공
   */
  const playheadTime = playerRealTime;

  /**
   * 🎛️ 기타 상태들 - 저빈도 업데이트 상태들을 한 번에 구독
   * 
   * currentTime과 분리하여 불필요한 리렌더링 방지
   * 이 상태들은 상대적으로 변경 빈도가 낮아 성능에 미치는 영향이 적음
   */
  const {
    tracks,                    // 📊 타임라인 트랙들 배열
    zoom,                      // 🔍 줌 레벨
    scrollLeft,                // ↔️ 수평 스크롤 위치
    isMuted,                   // 🔇 음소거 상태
    selectedClips,             // 🎯 선택된 클립들
    templateGroups,            // 📋 템플릿 그룹들
    selectedGroupId,           // 🎯 선택된 템플릿 그룹 ID
    
    // 📦 Bundle 시스템 관련 상태 및 액션들
    bundles,                   // 번들들 배열
    selectedBundleId,          // 선택된 번들 ID  
    selectBundle,              // 번들 선택 액션
    updateBundleTimeRange,     // 번들 시간 범위 업데이트
    moveBundleElements,        // 번들 요소들 이동
    getBundleElements,         // 번들 구성 요소 조회
    
    // 🎵 트랙 관리 액션들
    addTrack,                  // 트랙 추가
    removeTrack,               // 트랙 제거
    updateTrackDisplayName,    // 트랙 이름 변경
    moveTrackUp,               // 트랙 위로 이동
    moveTrackDown,             // 트랙 아래로 이동
    
    // 🎬 클립 및 기타 액션들
    setScrollLeft,             // 스크롤 위치 설정
    addClip,                   // 클립 추가
    updateClip,                // 클립 업데이트
    getClipById,               // 클립 ID로 조회
    getTotalDuration,          // 총 재생 시간 계산
    setIsPlaying,              // 재생 상태 설정
    toggleMuted,               // 음소거 토글
    closePropertiesPanel,      // 속성 패널 닫기
    
    // ⚙️ 프로젝트 및 템플릿 관련
    projectSettings,           // 프로젝트 설정 (해상도, FPS 등)
    selectTemplateGroup,       // 템플릿 그룹 선택
    moveTemplateGroup,         // 템플릿 그룹 이동
    getClipsByGroupId          // 그룹 ID로 클립들 조회
  } = useEditorStore();

  // ========================================================================
  // 📏 타임라인 크기 및 레이아웃 계산
  // ========================================================================
  
  /**
   * ⏱️ 총 재생 시간 계산
   * 모든 트랙의 클립들을 분석하여 프로젝트의 총 길이를 계산
   */
  const totalDuration = getTotalDuration();
  
  /**
   * 📐 타임라인 실제 표시 너비 계산
   * 
   * 총 시간 × 줌 레벨로 계산하되, 최소 2000px 보장
   * 짧은 프로젝트에서도 충분한 편집 공간을 제공
   */
  const timelineWidth = Math.max(totalDuration * zoom, 2000);

  // ========================================================================
  // 📊 클립 데이터 수집 및 분석
  // ========================================================================
  
  /**
   * 🎬 모든 클립들의 평면화된 배열
   * 트랙별로 분산된 클립들을 하나의 배열로 통합하여 전역 분석 가능
   */
  const allClips = tracks.flatMap(track => track.clips);

  // 📊 클립 통계 정보 계산 (타입 가드 활용)
  const clipStats = useMemo(() => {
    const stats = {
      total: allClips.length,
      visual: allClips.filter(isVisualClip).length,
      audio: allClips.filter(isAudioClip).length,
      withAudio: allClips.filter(hasAudioProperties).length,
      byType: {
        video: allClips.filter(isVideoClip).length,
        audio: allClips.filter(isAudioClip).length,
        image: allClips.filter(isImageClip).length,
        text: allClips.filter(isTextClip).length,
        shape: allClips.filter(clip => clip.mediaType.includes('Shape')).length
      },
      categories: {
        visual: allClips.filter(clip => getClipCategory(clip) === 'visual').length,
        audio: allClips.filter(clip => getClipCategory(clip) === 'audio').length,
        mixed: allClips.filter(clip => getClipCategory(clip) === 'mixed').length
      }
    };

    // 🔍 디버깅: 클립 통계 로그
    // if (import.meta.env.DEV) {
    //   console.log('📊 Timeline 클립 통계:', stats);
    // }

    return stats;
  }, [allClips]);

  // 스크롤 위치 추적을 위한 ref
  const scrollLeftRef = useRef(scrollLeft);

  // 드래그앤드롭 핸들러
  const { isOver, canDrop, drop } = useDragDropHandlers({
    tracks,
    allClips,
    zoom,
    scrollLeft,
    containerRef,
    addClip,
    updateClip,
    getClipById,
    projectSettings,
    // Bundle 제약 로직 전달
    moveBundleElementSafely: useEditorStore.getState().moveBundleElementSafely
  });

  // === 연결 끊기 시스템 === //
  const selectedClipsConnectionState = analyzeSelectedClipsConnections(selectedClips, allClips);

  // 연결 끊기 공통 처리 함수
  const handleDisconnectConnections = useCallback((
    connectionType: 'start' | 'end' | 'all',
    targetClips: TimelineClip[],
    actionName: string
  ) => {
    if (targetClips.length === 0) {
      showError(`끊을 ${actionName} 연결이 선택되지 않았습니다.`);
      return;
    }

    let totalDisconnected = 0;
    let totalConnectionsRemoved = 0;

    targetClips.forEach(clip => {
      const result = disconnectClipAnchors(clip, connectionType);

      if (result.success && result.updatedClip) {
        updateClip(clip.id, {
          regularClipProperties: result.updatedClip.regularClipProperties
        });

        totalDisconnected++;
        totalConnectionsRemoved += result.disconnectedConnections.length;
      }
    });

    showSuccess(`${totalDisconnected}개 클립의 ${actionName} 연결 ${totalConnectionsRemoved}개가 끊어졌습니다.`);
  }, [updateClip, showSuccess, showError]);

  // 시작점 연결 끊기
  const handleDisconnectStartConnections = useCallback(() => {
    handleDisconnectConnections(
      'start',
      selectedClipsConnectionState.startConnectedClips,
      '시작점'
    );
  }, [handleDisconnectConnections, selectedClipsConnectionState.startConnectedClips]);

  // 끝점 연결 끊기
  const handleDisconnectEndConnections = useCallback(() => {
    handleDisconnectConnections(
      'end',
      selectedClipsConnectionState.endConnectedClips,
      '끝점'
    );
  }, [handleDisconnectConnections, selectedClipsConnectionState.endConnectedClips]);

  // 모든 연결 끊기
  const handleDisconnectAllConnections = useCallback(() => {
    handleDisconnectConnections(
      'all',
      selectedClipsConnectionState.connectedClips,
      '전체'
    );
  }, [handleDisconnectConnections, selectedClipsConnectionState.connectedClips]);

  // scrollLeft 변경 시 ref 업데이트
  useEffect(() => {
    scrollLeftRef.current = scrollLeft;
  }, [scrollLeft]);


  // 재생 중 타임헤드 자동 스크롤 기능 (playheadTime 사용)
  useEffect(() => {
    if (!isPlaying || isDraggingPlayhead || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const playheadPosition = playheadTime * zoom;
    const currentScrollLeft = scrollLeftRef.current;

    const scrollThreshold = containerWidth * 0.8;
    const playheadRelativePosition = playheadPosition - currentScrollLeft;

    if (playheadRelativePosition > scrollThreshold) {
      const targetScrollLeft = playheadPosition - (containerWidth * 0.3);
      const maxScrollLeft = Math.max(0, timelineWidth - containerWidth);
      const newScrollLeft = Math.min(Math.max(0, targetScrollLeft), maxScrollLeft);

      if (Math.abs(newScrollLeft - currentScrollLeft) > 30) {
        setScrollLeft(newScrollLeft);
      }
    }
  }, [playheadTime, isPlaying, isDraggingPlayhead, zoom, timelineWidth]);

  // 스크롤 이벤트 핸들러
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  // === 플레이헤드 드래그 훅 사용 ===
  const { handlePlayheadMouseDown } = usePlayheadDrag({
    containerRef,
    scrollLeft,
    totalDuration,
    zoom,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    setIsDraggingPlayhead,
    playerRef,
    projectSettings
  });

  // === 타임라인 클릭 핸들러 ===
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingPlayhead) {
      return;
    }

    // 이벤트 타겟 확인 로그
    const target = e.target as HTMLElement;
    console.log('🔄 Timeline 클릭 감지:', {
      targetTag: target.tagName,
      targetClass: target.className,
      targetId: target.id
    });

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(totalDuration, x / zoom));
    
    // Option 키를 누르고 있으면 스냅 적용
    const { snapValue } = useEditorStore.getState();
    const isOptionPressed = e.altKey;
    const snappedTime = isOptionPressed ? Math.round(time / snapValue) * snapValue : time;

    console.log('🎯 Timeline 클릭 → 시간 이동:', {
      rawTime: time.toFixed(3),
      snappedTime: snappedTime.toFixed(3),
      snapApplied: isOptionPressed,
      snapValue
    });

    // 🎯 새로운 방식: Player.seekTo 만 호출, seeked 이벤트에서 Store 업데이트
    if (playerRef?.current) {
      const targetFrame = Math.round(snappedTime * projectSettings.fps);
      console.log('🎯 Player.seekTo 호출:', {
        time: snappedTime,
        frame: targetFrame,
        fps: projectSettings.fps,
        playerRef: playerRef.current ? '존재' : 'null'
      });

      try {
        playerRef.current.seekTo(targetFrame);
        console.log('✅ Player.seekTo 성공');
      } catch (error) {
        console.error('🚨 Player.seekTo 실패:', error);
        // fallback
        setCurrentTime(snappedTime);
      }
    } else {
      console.warn('🚨 playerRef 없음, 기존 방식 사용');
      setCurrentTime(snappedTime);
    }

    closePropertiesPanel();
  }, [isDraggingPlayhead, scrollLeft, zoom, totalDuration, setCurrentTime, closePropertiesPanel, playerRef, projectSettings]);

  // 🌟 Bundle 피드백 함수들
  const showBundleSuccess = useCallback((message: string) => {
    setShowBundleMessage({ message, type: 'success' });
  }, []);

  const showBundleInfo = useCallback((message: string) => {
    setShowBundleMessage({ message, type: 'info' });
  }, []);

  const showBundleWarning = useCallback((message: string) => {
    setShowBundleMessage({ message, type: 'warning' });
  }, []);

  // Bundle 이동 핸들러 (피드백 포함)
  const handleBundleMove = useCallback((bundleId: string, deltaTime: number) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    // Bundle 이동 실행
    moveBundleElements(bundleId, deltaTime);

    // 그룹 관계 확인 및 피드백
    const linkedGroups = bundle.relationships?.linkedTemplateGroups || [];
    const isDragWithGroups = bundle.relationships?.dragBehavior === 'with-groups';

    // let feedbackMessage = `Bundle "${bundle.name}" 이동 완료`;

    // if (linkedGroups.length > 0 && isDragWithGroups) {
    //   feedbackMessage += ` (🛡️ ${linkedGroups.length}개 그룹과 동시 이동)`;
    //   showBundleSuccess(feedbackMessage);
    // } else if (linkedGroups.length > 0) {
    //   feedbackMessage += ` (🅿️ 그룹과 독립 이동)`;
    //   showBundleInfo(feedbackMessage);
    // } else {
    //   showBundleSuccess(feedbackMessage);
    // }
  }, [bundles, moveBundleElements, showBundleSuccess, showBundleInfo]);

  // Bundle 선택 핸들러 (정보 표시)
  const handleBundleSelect = useCallback((bundleId: string) => {
    selectBundle(bundleId);

    const bundle = bundles.find(b => b.id === bundleId);
    if (bundle) {
      const linkedGroups = bundle.relationships?.linkedTemplateGroups || [];
      const { baseClips, templateGroups: bundleTemplateGroups } = getBundleElements(bundleId);

      if (linkedGroups.length > 0) {
        const dragBehavior = bundle.relationships?.dragBehavior === 'with-groups' ? '동시이동' : '독립이동';
        showBundleInfo(`📦 Bundle "${bundle.name}" 선택됨 | 🛡️ ${linkedGroups.length}개 그룹과 연동 (${dragBehavior})`);
      }
    }
  }, [selectBundle, bundles, getBundleElements, showBundleInfo]);


  // 🌟 Bundle 메시지 자동 숨김
  useEffect(() => {
    if (showBundleMessage) {
      const timer = setTimeout(() => {
        setShowBundleMessage(null);
      }, 4000); // Bundle 메시지는 조금 더 오래 표시

      return () => clearTimeout(timer);
    }
  }, [showBundleMessage]);

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(180deg, #16213e 0%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* 타임라인 헤더 */}
      <TimelineHeader
        currentTime={currentTime}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        isMuted={isMuted}
        playerRealTime={playerRealTime}
        showConnections={showConnections}
        allClips={allClips}
        clipStats={clipStats}
        tracks={tracks}
        setIsPlaying={setIsPlaying}
        setCurrentTime={setCurrentTime}
        toggleMuted={toggleMuted}
        setShowConnections={setShowConnections}
        addTrack={addTrack}
        removeTrack={removeTrack}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* 트랙 관리자 */}
        <TrackManager
          tracks={tracks}
          updateTrackDisplayName={updateTrackDisplayName}
          moveTrackUp={moveTrackUp}
          moveTrackDown={moveTrackDown}
          removeTrack={removeTrack}
        />

        {/* 타임라인 영역 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          {/* 룰러 */}
          <div style={{ flexShrink: 0 }}>
            <TimelineRuler
              zoom={zoom}
              scrollLeft={scrollLeft}
              totalDuration={totalDuration}
              currentTime={currentTime}
              localPlayheadTime={playheadTime}
              isPlaying={isPlaying}
              onPlayheadMouseDown={handlePlayheadMouseDown}
              isDraggingPlayhead={isDraggingPlayhead}
              onRulerClick={handleTimelineClick}
            />
          </div>

          {/* 스크롤 가능한 트랙 영역 */}
          <div
            ref={(node) => {
              drop(node);
              containerRef.current = node;
            }}
            style={{
              flex: 1,
              overflow: 'auto',
              position: 'relative',
              background: isOver && canDrop
                ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)'
                : 'transparent'
            }}
            onScroll={handleScroll}
            onClick={handleTimelineClick}
            className="timeline-container"
          >
            {/* 드롭 오버레이 */}
            {isOver && canDrop && (
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '2px dashed #64b5f6',
                background: 'rgba(100, 181, 246, 0.1)',
                zIndex: 50,
                pointerEvents: 'none',
                borderRadius: '8px'
              }} />
            )}

            <div
              style={{
                position: 'relative',
                background: 'linear-gradient(180deg, rgba(15, 52, 96, 0.3) 0%, rgba(22, 33, 62, 0.3) 100%)',
                width: `${timelineWidth}px`,
                height: `${tracks.length * DEFAULT_TRACK_HEIGHT}px`
              }}
            >
              {/* 그리드 배경 - 클릭 가능하도록 수정 */}
              <div
                className="timeline-grid-background"
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.2,
                  backgroundImage: `
                    linear-gradient(to right, rgba(100, 181, 246, 0.3) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(100, 181, 246, 0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: `${zoom / 4}px ${DEFAULT_TRACK_HEIGHT}px`,
                  backgroundPosition: '0 0',
                  pointerEvents: 'none' // 클릭 이벤트를 부모로 전달
                }}
              />

              {/* 초 단위 구분선 - 클릭 가능하도록 수정 */}
              <div
                className="timeline-second-markers"
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.4,
                  backgroundImage: `linear-gradient(to right, rgba(100, 181, 246, 0.8) 2px, transparent 2px)`,
                  backgroundSize: `${zoom}px 100%`,
                  backgroundPosition: '0 0',
                  pointerEvents: 'none' // 클릭 이벤트를 부모로 전달
                }}
              />

              {/* 트랙들 */}
              {tracks.map((track, index) => (
                <TimelineTrack
                  key={track.id}
                  track={track}
                  index={index}
                  zoom={zoom}
                  totalWidth={timelineWidth}
                  scrollLeft={scrollLeft}
                />
              ))}

              {/* 템플릿 그룹 레이어 */}
              {templateGroups.map(group => {
                const groupClips = getClipsByGroupId(group.id);
                if (groupClips.length === 0) return null;

                return (
                  <TemplateGroupContainer
                    key={group.id}
                    group={group}
                    clips={groupClips}
                    zoom={zoom}
                    trackHeight={DEFAULT_TRACK_HEIGHT}
                    onGroupSelect={selectTemplateGroup}
                    onGroupMove={group.isProtected ? moveTemplateGroup : undefined}
                    isSelected={selectedGroupId === group.id}
                    tracks={tracks}
                  />
                );
              })}

              {/* Bundle 레이어 - 템플릿 그룹들 아래에 렌더링 */}
              {bundles.map(bundle => {
                const { baseClips, templateGroups: bundleTemplateGroups } = getBundleElements(bundle.id);

                if (baseClips.length === 0 && bundleTemplateGroups.length === 0) {
                  return null;
                }

                return (
                  <BundleContainer
                    key={bundle.id}
                    bundle={bundle}
                    baseClips={baseClips}
                    templateGroups={bundleTemplateGroups}
                    zoom={zoom}
                    trackHeight={DEFAULT_TRACK_HEIGHT}
                    onBundleSelect={handleBundleSelect} // 🌟 피드백 포함 핸들러 사용
                    onBundleMove={handleBundleMove} // 🌟 피드백 포함 핸들러 사용
                    isSelected={selectedBundleId === bundle.id}
                    tracks={tracks}
                  />
                );
              })}

              {/* 클립 연결관계 시각화 오버레이 */}
              <ConnectionsOverlay
                allClips={allClips}
                tracks={tracks}
                templateGroups={templateGroups}
                bundles={bundles}
                zoom={zoom}
                scrollLeft={scrollLeft}
                timelineWidth={timelineWidth}
                showConnections={showConnections}
              />

              {/* 플레이헤드 라인 - 실시간 시간 사용 */}
              <div
                className="timeline-playhead-line"
                style={{
                  position: 'absolute',
                  width: '2px',
                  background: 'linear-gradient(180deg, #ff5722 0%, #f44336 100%)',
                  left: `${playheadTime * zoom}px`,
                  top: '0px',
                  height: `${tracks.length * DEFAULT_TRACK_HEIGHT}px`,
                  zIndex: 98,
                  pointerEvents: 'none', // 클릭 이벤트를 부모로 전달
                  boxShadow: '0 0 8px rgba(255, 87, 34, 0.6)',
                  transition: isDraggingPlayhead ? 'none' : isPlaying ? 'none' : 'left 0.1s ease-out',
                  transform: `translateX(-${scrollLeft}px)`
                }}
              />
            </div>
          </div>
        </div>
      </div>


      {/* 🌟 Bundle 메시지 UI */}
      {showBundleMessage && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '18px 28px',
            borderRadius: '16px',
            background: showBundleMessage.type === 'success'
              ? 'linear-gradient(135deg, rgba(100, 181, 246, 0.95) 0%, rgba(33, 150, 243, 0.95) 100%)'
              : showBundleMessage.type === 'info'
                ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.95) 0%, rgba(123, 31, 162, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 152, 0, 0.95) 0%, rgba(245, 124, 0, 0.95) 100%)',
            border: `2px solid ${showBundleMessage.type === 'success' ? 'rgba(100, 181, 246, 0.8)' :
              showBundleMessage.type === 'info' ? 'rgba(156, 39, 176, 0.8)' :
                'rgba(255, 152, 0, 0.8)'
              }`,
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: `0 10px 40px ${showBundleMessage.type === 'success' ? 'rgba(100, 181, 246, 0.4)' :
              showBundleMessage.type === 'info' ? 'rgba(156, 39, 176, 0.4)' :
                'rgba(255, 152, 0, 0.4)'
              }`,
            backdropFilter: 'blur(12px)',
            zIndex: 1001,
            maxWidth: '500px',
            textAlign: 'center',
            animation: 'bundleMessageSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <span style={{
              fontSize: '22px',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
            }}>
              {showBundleMessage.type === 'success' ? '📦' :
                showBundleMessage.type === 'info' ? '💬' : '⚠️'}
            </span>
            <span style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              lineHeight: '1.4'
            }}>
              {showBundleMessage.message}
            </span>
          </div>
        </div>
      )}

      {/* 키보드 단축키 처리 컴포넌트 */}
      <KeyboardShortcuts
        selectedClips={selectedClips}
        allClips={allClips}
        currentTime={currentTime}
        updateClip={updateClip}
        setCurrentTime={setCurrentTime}
        setIsPlaying={setIsPlaying}
        isPlaying={isPlaying}
        showSuccess={showSuccess}
        showError={showError}
      />

      {/* 키보드 가이드 토글 버튼 */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9
      }}>
        {!showKeyboardGuide ? (
          // 축소된 상태 - 아이콘 버튼
          <button
            onClick={() => setShowKeyboardGuide(true)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 30, 30, 0.85) 100%)',
              border: '2px solid rgba(100, 181, 246, 0.5)',
              color: '#64b5f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(100, 181, 246, 0.3)',
              transition: 'all 0.3s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.5), 0 0 30px rgba(100, 181, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(100, 181, 246, 0.3)';
            }}
            title="키보드 단축키 가이드 보기"
          >
            ⌨️
          </button>
        ) : (
          // 확장된 상태 - 전체 가이드
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            minWidth: '220px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}>
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowKeyboardGuide(false)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ccc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#ccc';
              }}
              title="가이드 닫기"
            >
              ✕
            </button>
        {/* 템플릿 그룹 이동 */}
        <div style={{
          marginBottom: '8px',
          padding: '6px 0',
          borderBottom: '1px solid rgba(100, 181, 246, 0.2)'
        }}>
          <div style={{ color: '#4caf50', fontWeight: '600', fontSize: '11px', marginBottom: '4px' }}>🎯 템플릿 그룹 이동</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: '11px' }}>
            <div>정밀: <strong>{modifierKey}+←/→</strong> (0.2초)</div>
            <div>빠름: <strong>{modifierKey}+W/E</strong> (1초)</div>
          </div>
        </div>

        {/* 개별 클립 이동 */}
        <div style={{
          marginBottom: '8px',
          padding: '6px 0',
          borderBottom: '1px solid rgba(100, 181, 246, 0.2)'
        }}>
          <div style={{ color: '#2196f3', fontWeight: '600', fontSize: '11px', marginBottom: '4px' }}>🎬 개별 클립 이동</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: '11px' }}>
            <div>정밀: <strong>{modifierKey}+←/→</strong> (0.2초)</div>
            <div>빠름: <strong>{modifierKey}+W/E</strong> (1초)</div>
          </div>
        </div>

        {/* 클립 앵커 이동 */}
        <div style={{
          marginBottom: '8px',
          padding: '6px 0',
          borderBottom: '1px solid rgba(100, 181, 246, 0.2)'
        }}>
          <div style={{ color: '#ff9800', fontWeight: '600', fontSize: '11px', marginBottom: '4px' }}>🎬 일반 클립 이동</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: '11px' }}>
            <div>시작점: <strong>{modifierKey}+S/D</strong></div>
            <div>끝점: <strong>{modifierKey}+X/C</strong></div>
          </div>
        </div>

        {/* 재생 제어 */}
        <div>
          <div style={{ color: '#e91e63', fontWeight: '600', fontSize: '11px', marginBottom: '4px' }}>▶️ 재생 제어</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px', fontSize: '11px' }}>
            <div>재생/정지: <strong>Space</strong></div>
          </div>
        </div>

            <div style={{
              fontSize: '10px',
              marginTop: '8px',
              opacity: 0.6,
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              * 방향: ←/S/X = 뒤로, →/D/C = 앞으로 *
            </div>
          </div>
        )}
      </div>

      {/* 드래그 위치 오버레이 */}
      <DragPositionOverlay 
        zoom={zoom}
        scrollLeft={scrollLeft}
        allClips={allClips}
        tracks={tracks}
      />
    </div>
  );
};

// CSS 애니메이션
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
  
  @keyframes bundleMessageSlideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.7) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1) translateY(0);
    }
  }
`;
if (!document.head.contains(style)) {
  document.head.appendChild(style);
}
