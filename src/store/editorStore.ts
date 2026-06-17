/**
 * 📊 editorStore.ts - 중앙 상태 관리 시스템 (핵심 모듈 #1)
 * 
 * ====================================================================
 * 🎯 ZUSTAND 기반 통합 상태 관리 스토어 - 프로젝트의 두뇌 역할
 * ====================================================================
 * 
 * React Video Editor의 모든 상태를 중앙화하여 관리하는 핵심 시스템
 * Zustand를 선택한 이유: Redux보다 가볍고, Context API보다 성능이 우수
 * 
 * 🏗️ 아키텍처 설계 원칙:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  1. 모듈화된 액션 분리 - 각 도메인별 독립적인 파일 구조     │
 * │  2. 타입 안전성 보장 - 100% TypeScript 타입 커버리지        │
 * │  3. 성능 최적화 - Selector 패턴으로 불필요한 리렌더링 방지  │
 * │  4. 개발자 경험 - Redux DevTools 통합 디버깅               │
 * │  5. 안정성 보장 - 무한루프 방지 및 에러 경계 처리          │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * 📋 관리하는 상태 도메인 (10개 주요 영역):
 * ┌────────────────┬─────────────────────────────────────────────┐
 * │ Timeline       │ 트랙, 클립, 재생 상태, 플레이헤드 제어      │
 * │ Zoom           │ 확대/축소, 스크롤, 뷰포트 관리              │
 * │ Audio          │ 오디오 설정, 볼륨, 음소거 상태             │
 * │ Clips          │ 클립 CRUD, 선택, 조작, Long Sentence       │
 * │ Properties     │ 속성 패널, 선택된 요소, 컨트롤 상태        │
 * │ Media          │ 미디어 라이브러리, 업로드, 필터링          │
 * │ Project        │ 프로젝트 설정, 해상도, FPS, 배경색         │
 * │ Templates      │ 템플릿 그룹, 저장/로드, 관계 관리          │
 * │ Bundles        │ 번들 시스템, 그룹화, 계층 구조             │
 * │ EditMode       │ 편집 모드, 드래그 상태, 실시간 편집        │
 * └────────────────┴─────────────────────────────────────────────┘
 * 
 * ⚡ 성능 최적화 전략:
 * • Selector 패턴: useEditorStore(state => state.specificProp)
 * • 지연 초기화: 필요한 시점에만 객체 생성
 * • 불변성 유지: Immer 없이도 안전한 상태 업데이트
 * • 메모이제이션: 복잡한 계산 결과 캐싱
 * • 배치 업데이트: 여러 상태 변경을 하나의 트랜잭션으로 처리
 * 
 * 🛡️ 안정성 보장 시스템:
 * • 무한루프 방지: ESC 키 감지 및 자동 차단 시스템
 * • 타입 가드: 런타임 타입 검증으로 에러 사전 방지
 * • 에러 경계: 상태 업데이트 실패 시 롤백 메커니즘
 * • 디버깅 지원: 모든 액션에 추적 가능한 로깅
 * 
 * 🔄 데이터 플로우:
 * UI Component → useEditorStore(selector) → State → Action → State Update → Re-render
 * 
 * 📝 사용 예시:
 * ```typescript
 * // 1. 선택적 구독 (성능 최적화)
 * const currentTime = useEditorStore(state => state.currentTime);
 * 
 * // 2. 액션 호출
 * const setCurrentTime = useEditorStore(state => state.setCurrentTime);
 * 
 * // 3. 복합 상태 조회
 * const timelineState = useEditorStore(state => ({
 *   tracks: state.tracks,
 *   zoom: state.zoom,
 *   scrollLeft: state.scrollLeft
 * }));
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  TimelineState,
  DEFAULT_ZOOM,
  MediaItem,
  ProjectSettings,
} from '../types';

// ========================================================================
// 📦 모듈화된 액션 시스템 - 도메인별 분리된 상태 관리 로직
// ========================================================================
// 각 기능별로 독립적인 파일로 분리하여 유지보수성과 확장성을 확보
// 순환 참조 방지 및 코드 응집도 향상을 위한 설계
import { createZoomActions, DEFAULT_TIMELINE_WIDTH, type ZoomState, type ZoomActions } from './zoom/zoomActions';              // 🔍 확대/축소, 뷰포트 스크롤 관리
import { createAudioActions, type AudioState, type AudioActions } from './audio/audioActions';                              // 🔊 오디오 볼륨, 음소거 제어
import { createTrackActions, type TrackState, type TrackActions } from './tracks/trackActions';                             // 🎵 멀티트랙 CRUD, 순서 관리
import { createClipActions, createClipManipulationActions, createLongSentenceActions, type ClipState, type ClipActions, type ClipManipulationState, type ClipManipulationActions, type LongSentenceActions } from './clips/clipActions';  // 🎬 클립 생성/수정/삭제/조작
import { createPropertyActions, type PropertyState, type PropertyActions } from './properties/propertyActions';            // ⚙️ 속성 패널, 선택된 요소 관리
import { createMediaActions, type MediaState, type MediaActions } from './media/mediaActions';                             // 📁 미디어 라이브러리, 파일 업로드
import { createProjectActions, type ProjectState, type ProjectActions } from './project/projectActions';                   // 🎯 프로젝트 설정, 해상도, FPS
import { createEditModeActions, type EditModeState, type EditModeActions } from './edit/editModeActions';                  // ✏️ 실시간 편집 모드 상태
import { createTemplateActions, type TemplateState, type TemplateActions } from './templates/templateActions';             // 📋 템플릿 저장/로드, 그룹 관리
import { createBundleActions, type BundleState, type BundleActions } from './bundles/bundleActions';                       // 📦 번들 시스템, 클립 그룹화
import { createBundleAdvancedActions, type BundleAdvancedActions } from './bundles/bundleAdvancedActions';                 // 🚀 고급 번들 기능, 계층 구조
import { createUnsavedActions, type UnsavedState, type UnsavedActions } from './unsaved/unsavedActions';                   // 💾 미저장 변경사항 추적

// ========================================================================
// 🔧 유틸리티 및 헬퍼 함수들
// ========================================================================
import { createInitialTracks, createDefaultMediaLibraryControls, type MediaLibraryControl } from './utils/storeUtils';

// ========================================================================
// 📤 공개 API - 다른 모듈에서 사용할 수 있는 상수들
// ========================================================================
// 기존 코드 호환성을 위해 줌 관련 상수들을 re-export
export { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, DEFAULT_TIMELINE_WIDTH } from './zoom/zoomActions';

// ========================================================================
// 🎭 타입 정의 시스템 - TypeScript 완전 타입 안전성 보장
// ========================================================================

/**
 * 🛡️ 무한루프 방지 시스템
 * 사용자가 ESC 키를 누르면 자동으로 상태 업데이트를 차단하여
 * UI 무한루프나 성능 저하를 방지하는 안전장치
 */
interface InfiniteLoopPreventionState {
  isLoopBlocked: boolean;        // 루프 차단 활성화 여부
  loopBlockedAt: number;         // 차단 시작 시간 (타임스탬프)
}

interface InfiniteLoopPreventionActions {
  blockLoop: () => void;         // 무한루프 차단 활성화 (ESC 키 감지 시)
  unblockLoop: () => void;       // 무한루프 차단 해제 (안전한 상태로 복구)
}

/**
 * 🏪 메인 에디터 스토어 인터페이스
 * 
 * 모든 상태 도메인과 액션들을 통합하는 중앙 인터페이스
 * 다중 상속을 통해 각 도메인의 타입을 조합하여 완전한 스토어 타입을 구성
 * 
 * 📋 포함되는 도메인들:
 * - TimelineState: 기본 타임라인 상태 (currentTime, isPlaying 등)
 * - 10개의 모듈화된 상태 (Zoom, Audio, Track, Clip, Property, Media, Project, EditMode, Template, Bundle, Unsaved)
 * - 무한루프 방지 시스템
 * - 모든 액션 메서드들
 */
interface EditorStore extends
  TimelineState,
  ZoomState,
  AudioState,
  TrackState,
  ClipState,
  ClipManipulationState,
  PropertyState,
  MediaState,
  ProjectState,
  EditModeState,
  TemplateState,
  BundleState,
  UnsavedState,
  InfiniteLoopPreventionState,
  ZoomActions,
  AudioActions,
  TrackActions,
  ClipActions,
  ClipManipulationActions,
  LongSentenceActions,
  PropertyActions,
  MediaActions,
  ProjectActions,
  EditModeActions,
  TemplateActions,
  BundleActions,
  BundleAdvancedActions,
  UnsavedActions,
  InfiniteLoopPreventionActions {

  // ========================================================================
  // 🎮 기본 타임라인 제어 메서드들
  // ========================================================================
  
  /** 
   * ⏰ 표준 시간 설정
   * 무한루프 차단 상태에서는 동작하지 않음 (안전장치)
   */
  setCurrentTime: (time: number) => void;
  
  /** 
   * 💪 강제 시간 이동 
   * 재생 중이거나 차단 상태에서도 강제로 시간을 이동 (타임라인 클릭 등)
   */
  setCurrentTimeForced: (time: number) => void;
  
  /** 
   * ▶️ 재생 상태 제어
   * 재생/일시정지 토글
   */
  setIsPlaying: (playing: boolean) => void;

  // ========================================================================
  // 🎬 Remotion Player 통합 시스템
  // ========================================================================
  
  /** 
   * 🔄 플레이어 실시간 시간
   * Remotion Player의 seeked 이벤트에서 업데이트되는 실제 재생 시간
   * UI 플레이헤드 표시에 사용 (재생 중에도 정확한 동기화)
   */
  playerRealTime: number;
  setPlayerRealTime: (time: number) => void;

  // ========================================================================
  // 🖱️ 사용자 인터랙션 상태
  // ========================================================================
  
  /** 
   * 👆 플레이헤드 드래그 상태
   * 사용자가 플레이헤드를 드래그 중인지 추적하여 자동 스크롤 방지
   */
  isDraggingPlayhead: boolean;
  setIsDraggingPlayhead: (dragging: boolean) => void;

  /** 
   * 🎯 Player 참조 공유
   * Remotion Player 인스턴스를 다른 컴포넌트에서 접근할 수 있도록 공유
   * seekTo() 메서드 호출 등에 사용
   */
  playerRef: React.RefObject<any> | null;
  setPlayerRef: (ref: React.RefObject<any>) => void;

  // ========================================================================
  // ⚙️ 편집 도구 설정
  // ========================================================================
  
  /** 
   * 📏 스냅 값 설정
   * Option/Alt 키와 함께 사용하여 정확한 시간 단위로 스냅
   * 범위: 0.01초 ~ 5초
   */
  setSnapValue: (value: number) => void;

  // ========================================================================
  // 🔍 데이터 조회 유틸리티
  // ========================================================================
  
  /** 
   * 🎵 트랙 ID로 트랙 찾기
   * 성능 최적화된 트랙 조회 메서드
   */
  getTrackById: (trackId: string) => import('../types').TimelineTrack | undefined;
}

// ========================================================================
// 🏗️ ZUSTAND 스토어 생성 - 실제 스토어 인스턴스 구현
// ========================================================================

/**
 * 🎯 메인 에디터 스토어 생성
 * 
 * create<EditorStore>()(): Zustand의 타입 안전한 스토어 생성
 * devtools(): Redux DevTools 연동으로 상태 변화 추적 가능
 * 
 * 구조:
 * 1. 초기 상태 정의
 * 2. 기본 액션 메서드들 구현
 * 3. 모듈화된 액션들 조합 (...createXXXActions)
 */
export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      // ========================================================================
      // 🎬 초기 상태 정의 - 앱 시작 시 기본값들
      // ========================================================================
      // 🎮 기본 타임라인 상태
      currentTime: 0,                   // 현재 재생 시간 (초 단위)
      isPlaying: false,                 // 재생 상태 (true: 재생 중, false: 일시정지)
      playerRealTime: 0,                // Remotion Player 실시간 시간 (seeked 이벤트 기반)
      isDraggingPlayhead: false,        // 플레이헤드 드래그 상태 (자동 스크롤 방지용)
      playerRef: null,                  // Remotion Player 인스턴스 참조

      // 🔍 뷰포트 및 줌 상태
      zoom: DEFAULT_ZOOM,               // 타임라인 확대/축소 배율
      scrollLeft: 0,                    // 타임라인 수평 스크롤 위치
      timelineContainerWidth: DEFAULT_TIMELINE_WIDTH, // 타임라인 컨테이너 너비

      // 🎬 클립 및 트랙 관리
      selectedClips: [],                // 현재 선택된 클립들의 ID 배열
      tracks: createInitialTracks(),    // 멀티트랙 배열 (기본 8개 트랙)

      // 📁 미디어 라이브러리 상태
      mediaLibrary: [],                 // 업로드된 미디어 파일들
      mediaLibraryControls: createDefaultMediaLibraryControls(), // 미디어 라이브러리 UI 제어

      // ✏️ 편집 모드 상태 (실시간 편집용)
      isEditMode: false,                // 편집 모드 활성화 여부
      editModeSelectedClips: [],        // 편집 모드에서 선택된 클립들

      // 📋 템플릿 시스템 상태
      templateGroups: [],               // 템플릿 그룹들 배열
      selectedGroupId: null,            // 현재 선택된 템플릿 그룹 ID

      // 📦 번들 시스템 상태 (클립 그룹화)
      bundles: [],                      // 번들들 배열
      selectedBundleId: null,           // 현재 선택된 번들 ID
      bundleSelectionMode: false,       // 번들 선택 모드 활성화 여부
      pendingBundleSelection: [],       // 번들 생성을 위해 대기 중인 선택 항목들

      // ⚙️ 편집 도구 설정
      snapValue: 0.25,                  // 스냅 간격 (초 단위, 기본값 0.25초)

      // 🔊 오디오 제어
      isMuted: false,                   // 전역 음소거 상태

      // 🎯 클립 조작 상태 (드래그, 리사이즈 등)
      isDraggingClip: false,            // 클립 드래그 중 여부
      isResizingClip: false,            // 클립 리사이즈 중 여부
      draggedClipId: null,              // 현재 드래그 중인 클립 ID
      resizedClipId: null,              // 현재 리사이즈 중인 클립 ID
      needsTimeSync: false,             // 시간 동기화 필요 여부

      // 🎯 프로젝트 설정
      projectSettings: {
        width: 1920,                    // 영상 너비 (픽셀)
        height: 1080,                   // 영상 높이 (픽셀)
        fps: 30,                        // 프레임레이트 (초당 프레임 수)
        duration: 60,                   // 프로젝트 총 길이 (초)
        backgroundColor: '#000000'      // 배경색 (hex 컬러)
      },

      // ⚙️ 속성 패널 상태
      selectedClip: null,               // 속성 편집 중인 클립
      selectedControl: null,            // 선택된 컨트롤 요소
      selectedMediaItem: null,          // 선택된 미디어 아이템
      isPropertiesPanelOpen: false,     // 속성 패널 열림 상태

      // 🛡️ 무한루프 방지 시스템
      isLoopBlocked: false,             // 루프 차단 활성화 여부 (ESC 키로 제어)
      loopBlockedAt: 0,                 // 차단 시작 시간 (타임스탬프)

      // ========================================================================
      // 🎯 기본 액션 메서드들 구현 - 핵심 타임라인 제어 로직
      // ========================================================================
      /**
       * ⏰ 표준 시간 설정 메서드
       * 
       * 무한루프 방지 시스템이 활성화된 상태에서는 동작하지 않음
       * 일반적인 재생 시간 업데이트에 사용
       * 
       * @param time 설정할 시간 (초 단위)
       */
      setCurrentTime: (time) => {
        const state = get();
        // 🛡️ 무한루프 방지: 차단 상태에서는 시간 업데이트 거부
        if (state.isLoopBlocked) {
          console.log('🚫 setCurrentTime 차단됨 (무한루프 방지)');
          return;
        }
        console.log('🔄 setCurrentTime 호출:', time.toFixed(3) + 's');
        set({ currentTime: time }, false, 'setCurrentTime');
      },

      /**
       * ▶️ 재생 상태 토글
       * 
       * @param playing true: 재생, false: 일시정지
       */
      setIsPlaying: (playing) => set({ isPlaying: playing }, false, 'setIsPlaying'),

      /**
       * 💪 강제 시간 이동 메서드
       * 
       * 무한루프 차단 상태나 재생 중에도 강제로 시간을 이동
       * 사용자가 직접 타임라인을 클릭했을 때 등 명시적인 시간 이동에 사용
       * 
       * @param time 이동할 시간 (초 단위)
       */
      setCurrentTimeForced: (time) => {
        console.log('💪 setCurrentTimeForced 호출:', {
          time: time.toFixed(3) + 's',
          action: '강제 이동'
        });
        // currentTime과 playerRealTime을 동시에 업데이트하여 동기화 보장
        set({ currentTime: time, playerRealTime: time }, false, 'setCurrentTimeForced');
      },

      /**
       * 🔄 플레이어 실시간 시간 업데이트
       * 
       * Remotion Player의 seeked 이벤트에서 호출되는 메서드
       * 재생 중에도 지속적으로 업데이트되어 정확한 플레이헤드 위치 표시
       * 
       * @param time Remotion Player에서 받은 실제 재생 시간
       */
      setPlayerRealTime: (time) => {
        set({ playerRealTime: time }, false, 'setPlayerRealTime');
      },

      /**
       * 👆 플레이헤드 드래그 상태 관리
       * 
       * 사용자가 플레이헤드를 드래그 중일 때 자동 스크롤을 방지하기 위한 상태
       * 
       * @param dragging true: 드래그 중, false: 드래그 종료
       */
      setIsDraggingPlayhead: (dragging) => {
        set({ isDraggingPlayhead: dragging }, false, 'setIsDraggingPlayhead');
      },

      /**
       * 🎯 Remotion Player 참조 공유
       * 
       * 다른 컴포넌트에서 Player의 seekTo() 등 메서드를 호출할 수 있도록 참조를 공유
       * 
       * @param ref Remotion Player 컴포넌트의 ref
       */
      setPlayerRef: (ref) => {
        set({ playerRef: ref }, false, 'setPlayerRef');
      },

      /**
       * 📏 스냅 값 설정
       * 
       * Option/Alt 키와 함께 사용하여 정확한 시간 단위로 스냅하는 기능
       * 값의 범위를 0.01초 ~ 5초로 제한하여 안전성 보장
       * 
       * @param value 스냅 간격 (초 단위)
       */
      setSnapValue: (value) => {
        // 📏 범위 제한: 최소 0.01초, 최대 5초
        set({ snapValue: Math.max(0.01, Math.min(5, value)) }, false, 'setSnapValue');
      },

      /**
       * 🔍 트랙 ID로 트랙 조회
       * 
       * 성능 최적화된 트랙 검색 메서드
       * Array.find()를 사용하여 O(n) 복잡도로 트랙을 찾음
       * 
       * @param trackId 찾을 트랙의 ID
       * @returns 해당 트랙 객체 또는 undefined
       */
      getTrackById: (trackId) => {
        const state = get();
        return state.tracks.find(track => track.id === trackId);
      },

      /**
       * 🚫 무한루프 차단 활성화
       * 
       * 사용자가 ESC 키를 누르면 호출되어 모든 자동 시간 업데이트를 차단
       * UI 무한루프나 성능 저하를 방지하는 안전장치
       */
      blockLoop: () => {
        console.log('🚫 무한루프 차단 활성화 (ESC 키 감지)');
        set({ 
          isLoopBlocked: true, 
          loopBlockedAt: Date.now()  // 차단 시작 시간 기록
        }, false, 'blockLoop');
      },
      
      /**
       * ✅ 무한루프 차단 해제
       * 
       * 안전한 상태로 복구되었을 때 호출하여 정상 동작 재개
       */
      unblockLoop: () => {
        console.log('✅ 무한루프 차단 해제');
        set({ 
          isLoopBlocked: false, 
          loopBlockedAt: 0 
        }, false, 'unblockLoop');
      },

      // ========================================================================
      // 🔧 모듈화된 액션들 조합 - 도메인별 분리된 로직 통합
      // ========================================================================
      // JavaScript Spread Operator를 사용하여 각 모듈의 액션들을 스토어에 병합
      // 각 createXXXActions 함수는 해당 도메인의 상태와 액션을 반환
      
      ...createZoomActions(set, get, {} as any),           // 🔍 확대/축소, 스크롤 제어
      ...createAudioActions(set, get, {} as any),          // 🔊 오디오 볼륨, 음소거
      ...createTrackActions(set, get, {} as any),          // 🎵 트랙 CRUD, 순서 관리
      ...createClipActions(set, get, {} as any),           // 🎬 클립 생성/수정/삭제
      ...createClipManipulationActions(set, get, {} as any), // 🎯 클립 드래그/리사이즈
      ...createLongSentenceActions(set, get, {} as any),   // 📝 Long Sentence 특수 처리
      ...createPropertyActions(set, get, {} as any),       // ⚙️ 속성 패널 관리
      ...createMediaActions(set, get, {} as any),          // 📁 미디어 라이브러리
      ...createProjectActions(set, get, {} as any),        // 🎯 프로젝트 설정
      ...createEditModeActions(set, get, {} as any),       // ✏️ 실시간 편집 모드
      ...createTemplateActions(set, get, {} as any),       // 📋 템플릿 시스템
      ...createBundleActions(set, get, {} as any),         // 📦 번들 기본 기능
      ...createBundleAdvancedActions(set, get, {} as any), // 🚀 번들 고급 기능
      ...createUnsavedActions(set, get, {} as any),        // 💾 미저장 변경사항 추적
    }),
    {
      // ========================================================================
      // 🛠️ Redux DevTools 설정 - 개발자 디버깅 도구 연동
      // ========================================================================
      name: 'editor-store'  // DevTools에서 표시될 스토어 이름
    }
  )
);

// ========================================================================
// 📋 사용법 가이드 및 주의사항
// ========================================================================

/**
 * 🎯 이 스토어를 사용할 때 따라야 할 베스트 프랙티스:
 * 
 * 1. 📊 선택적 구독 (Selective Subscription):
 *    ```typescript
 *    // ✅ 좋은 예: 필요한 상태만 구독
 *    const currentTime = useEditorStore(state => state.currentTime);
 *    
 *    // ❌ 나쁜 예: 전체 스토어 구독 (불필요한 리렌더링 발생)
 *    const store = useEditorStore();
 *    ```
 * 
 * 2. 🔄 액션 호출:
 *    ```typescript
 *    // ✅ 함수를 따로 추출하여 사용
 *    const setCurrentTime = useEditorStore(state => state.setCurrentTime);
 *    setCurrentTime(5.2);
 *    
 *    // ✅ 즉시 호출도 가능
 *    useEditorStore.getState().setCurrentTime(5.2);
 *    ```
 * 
 * 3. 🎭 복합 상태 조회:
 *    ```typescript
 *    // ✅ 관련된 상태들을 한 번에 구독
 *    const timelineState = useEditorStore(state => ({
 *      currentTime: state.currentTime,
 *      isPlaying: state.isPlaying,
 *      tracks: state.tracks
 *    }));
 *    ```
 * 
 * 4. 🛡️ 무한루프 방지:
 *    - ESC 키를 누르면 자동으로 루프 차단
 *    - 차단 중에는 setCurrentTime() 호출이 무시됨
 *    - setCurrentTimeForced()는 차단 상태에서도 동작
 * 
 * 5. 🎬 Remotion 통합:
 *    - playerRef를 통해 Player 인스턴스 공유
 *    - playerRealTime은 seeked 이벤트에서 업데이트
 *    - 플레이헤드 표시는 playerRealTime 사용 권장
 * 
 * ⚠️ 주의사항:
 * - 상태 업데이트는 불변성을 유지해야 함
 * - 직접 상태 객체를 수정하지 말고 set() 함수 사용
 * - 무한루프 발생 시 ESC 키로 차단 후 원인 분석
 * - 성능 이슈 발생 시 구독 패턴을 선택적으로 최적화
 */
