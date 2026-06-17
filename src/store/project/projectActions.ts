/**
 * 📂 projectActions.ts - 프로젝트 전역 상태 관리 액션
 * 
 * 비디오 에디터 프로젝트의 전역 설정과 상태를 관리하는 핵심 Zustand 액션입니다.
 * 프로젝트 설정, 재생 상태, 편집 모드 등 에디터의 전반적인 동작을 제어합니다.
 * 
 * 주요 기능:
 * - 프로젝트 설정 관리 (해상도, FPS, 길이 등)
 * - 프로젝트 로드/저장/초기화 처리
 * - Bundle 및 TemplateGroup 정보 통합 관리
 * - 전체 프로젝트 길이 계산
 * - 프로젝트 초기 상태 복원
 * 
 * 상태 통합 관리:
 * - tracks, bundles, templateGroups의 일관성 보장
 * - 속성 패널 상태와 프로젝트 상태 동기화
 * - 편집 모드와 재생 상태의 통합 관리
 * - 타임라인 표시 설정 (zoom, scroll) 포함
 * 
 * 성능 최적화:
 * - 프로젝트 로드 시 Bundle 및 TemplateGroup 일괄 처리
 * - 대용량 프로젝트에서도 빠른 초기화
 * - 메모리 효율적인 상태 관리
 * 
 * 사용 패턴:
 * - 에디터 시작 시 기본 프로젝트 설정
 * - 프로젝트 파일에서 전체 상태 복원
 * - 새 프로젝트 시작 시 상태 초기화
 * 
 * 특별 고려사항:
 * - Bundle과 TemplateGroup을 포함한 완전한 프로젝트 상태
 * - 하위 호환성을 위한 옵셔널 Bundle/TemplateGroup 처리
 * - 프로젝트 초기화 시 모든 관련 상태 일괄 리셋
 */

import { StateCreator } from 'zustand';
import { ProjectSettings, TimelineTrack, DEFAULT_ZOOM, Bundle, TemplateGroup } from '../../types';
import { createInitialTracks } from '../utils/storeUtils';

// 프로젝트 관련 상태 타입
export interface ProjectState {
  projectSettings: ProjectSettings;
  tracks: TimelineTrack[];
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  scrollLeft: number;
  selectedClips: string[];
  isEditMode: boolean;
  editModeSelectedClips: string[];
  templateGroups: any[];
  selectedGroupId: string | null;
  bundles: import('../../types').Bundle[]; // 타입 통일 (TimelineState와 동일)
  selectedBundleId: string | null;
  bundleSelectionMode: boolean;
  pendingBundleSelection: import('../../types').SelectedElement[]; // 타입 통일
  isMuted: boolean;
  isDraggingClip: boolean;
  isResizingClip: boolean;
  draggedClipId: string | null;
  resizedClipId: string | null;
  needsTimeSync: boolean;
}

// 프로젝트 관련 액션 타입
export interface ProjectActions {
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
  setProjectSettings: (settings: ProjectSettings) => void;
  loadProject: (tracks: TimelineTrack[], projectSettings: ProjectSettings, bundles?: Bundle[], templateGroups?: TemplateGroup[]) => void;
  resetProject: () => void;
  getTotalDuration: () => number;
}

// 속성 패널 의존성
export interface ProjectDependencies {
  selectedClip: any;
  selectedControl: any;
  selectedMediaItem: any;
  isPropertiesPanelOpen: boolean;
}

export const createProjectActions: StateCreator<
  ProjectState & ProjectActions & ProjectDependencies,
  [],
  [],
  ProjectActions
> = (set, get) => ({
  // 프로젝트 설정
  updateProjectSettings: (settings) => {
    const state = get();
    set({
      projectSettings: { ...state.projectSettings, ...settings }
    });
  },

  setProjectSettings: (settings) => {
    set({ projectSettings: settings });
  },

  loadProject: (tracks, projectSettings, bundles, templateGroups) => {
    console.log('📂 프로젝트 로드 시작 (Bundle 정보 포함):', {
      tracks: tracks.length,
      totalClips: tracks.reduce((sum, track) => sum + track.clips.length, 0),
      bundles: bundles?.length || 0,
      templateGroups: templateGroups?.length || 0
    });

    set({
      tracks,
      projectSettings,
      bundles: bundles || [], // Bundle 정보 로드 (없으면 빈 배열)
      templateGroups: templateGroups || [], // TemplateGroup 정보 로드 (없으면 빈 배열)
      currentTime: 0,
      isPlaying: false,
      selectedClips: [],
      selectedClip: null,
      selectedControl: null,
      selectedMediaItem: null,
      isPropertiesPanelOpen: false,
      isEditMode: false,
      editModeSelectedClips: [],
      // Bundle 관련 상태 초기화
      selectedBundleId: null,
      bundleSelectionMode: false,
      pendingBundleSelection: [],
      // TemplateGroup 관련 상태 초기화
      selectedGroupId: null
    });

    console.log('✅ 프로젝트 로드 완료:', {
      bundles: bundles?.length || 0,
      templateGroups: templateGroups?.length || 0
    });
  },

  // 프로젝트 초기화 - 처음 페이지 열렸을 때의 상태로 복원
  resetProject: () => {
    console.log('🔄 프로젝트 초기화 시작...');

    // 기본 상태로 복원
    set({
      // 타임라인 상태 초기화
      currentTime: 0,
      isPlaying: false,
      zoom: DEFAULT_ZOOM,
      scrollLeft: 0,
      selectedClips: [],

      // 트랙 초기화 (기본 트랙들로 복원)
      tracks: createInitialTracks(),

      // 프로젝트 설정 초기화
      projectSettings: {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 60,
        backgroundColor: '#000000'
      },

      // 편집 모드 초기화
      isEditMode: false,
      editModeSelectedClips: [],

      // 템플릿 그룹 초기화
      templateGroups: [],
      selectedGroupId: null,

      // Bundle 초기화
      bundles: [],
      selectedBundleId: null,
      bundleSelectionMode: false,
      pendingBundleSelection: [],

      // 오디오 상태 초기화
      isMuted: false,

      // 속성 패널 초기화
      selectedClip: null,
      selectedControl: null,
      selectedMediaItem: null,
      isPropertiesPanelOpen: false,

      // 클립 조작 상태 초기화
      isDraggingClip: false,
      isResizingClip: false,
      draggedClipId: null,
      resizedClipId: null,
      needsTimeSync: false
    });

    console.log('✅ 프로젝트 초기화 완료!');
  },

  // 유틸리티
  getTotalDuration: () => {
    const state = get();
    const maxEndTime = Math.max(
      ...state.tracks.flatMap(track =>
        track.clips.map(clip => clip.endTime)
      ),
      0
    );
    return Math.max(maxEndTime, state.projectSettings.duration);
  },
});
