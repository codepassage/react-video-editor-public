/**
 * ✏️ editModeActions.ts - 편집 모드 상태 관리 액션
 * 
 * 비디오 에디터의 편집 모드 전환과 관련된 상태 및 액션을 관리하는
 * Zustand 스토어 슬라이스입니다. 편집 모드에서의 클립 선택, 다중 선택,
 * 편집 상태 토글 등의 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 편집 모드 on/off 토글
 * - 편집 모드에서 클립 다중 선택
 * - 편집 모드 전용 클립 리스트 관리
 * - 편집 모드 상태에 따른 UI 변화
 * - 편집 모드 진입/종료 시 상태 초기화
 * 
 * 편집 모드 특징:
 * - 일반 재생/편집과 구분되는 특수 모드
 * - 다중 클립 선택 및 일괄 편집 가능
 * - 정밀한 편집 작업을 위한 전용 UI
 * - 편집 중 실수 방지를 위한 제한된 인터랙션
 * 
 * 상태 관리:
 * - isEditMode: 현재 편집 모드 활성 여부
 * - editModeSelectedClips: 편집 모드에서 선택된 클립 ID 목록
 * - 일반 모드와 독립적인 선택 상태 유지
 * 
 * 액션 종류:
 * - setEditMode: 편집 모드 직접 설정
 * - toggleEditMode: 편집 모드 토글
 * - addEditModeClip: 편집 모드 클립 선택 추가
 * - removeEditModeClip: 편집 모드 클립 선택 해제
 * - clearEditModeSelection: 편집 모드 선택 초기화
 * 
 * 사용 시나리오:
 * - 정밀한 클립 편집 작업
 * - 다중 클립 일괄 속성 변경
 * - 복잡한 편집 워크플로우
 * - 안전한 편집 환경 제공
 * 
 * 관련 모듈:
 * - 8번 모듈: State Management (Zustand 상태 관리)
 * - editorStore: 중앙 상태 관리 스토어
 * - clipActions: 클립 관련 액션과 연동
 * - Timeline System: 편집 모드 UI 반영
 */

import { StateCreator } from 'zustand';
import { TimelineClip, TimelineTrack } from '../../types';

// 편집 모드 관련 상태 타입
export interface EditModeState {
  isEditMode: boolean;
  editModeSelectedClips: string[];
  currentTime: number;
  tracks: TimelineTrack[];
}

// 편집 모드 관련 액션 타입
export interface EditModeActions {
  setEditMode: (isEditMode: boolean) => void;
  toggleEditMode: () => void;
  setEditModeSelectedClips: (clipIds: string[]) => void;
  getClipsAtCurrentTime: () => TimelineClip[];
  applyEditModeChanges: (clipUpdates: { clipId: string; x: number; y: number; width: number; height: number }[]) => void;
}

// updateClip 의존성
export interface EditModeDependencies {
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
}

export const createEditModeActions: StateCreator<
  EditModeState & EditModeActions & EditModeDependencies,
  [],
  [],
  EditModeActions
> = (set, get) => ({
  // 편집 모드 관리
  setEditMode: (isEditMode) => {
    const state = get();

    if (isEditMode) {
      // 편집 모드로 진입 시 현재 시간의 클립들을 선택
      const clipsAtCurrentTime = state.getClipsAtCurrentTime();
      set({
        isEditMode,
        editModeSelectedClips: clipsAtCurrentTime.map(clip => clip.id),
        isPlaying: false // 편집 모드에서는 일시 정지
      });
    } else {
      // 재생 모드로 복귀
      set({
        isEditMode,
        editModeSelectedClips: []
      });
    }
  },

  toggleEditMode: () => {
    const state = get();
    state.setEditMode(!state.isEditMode);
  },

  setEditModeSelectedClips: (clipIds) => {
    set({ editModeSelectedClips: clipIds });
  },

  getClipsAtCurrentTime: () => {
    const state = get();
    const currentTime = state.currentTime;

    return state.tracks.flatMap(track =>
      track.clips.filter(clip =>
        currentTime >= clip.startTime && currentTime <= clip.endTime
      )
    );
  },

  applyEditModeChanges: (clipUpdates) => {
    const state = get();
    clipUpdates.forEach(({ clipId, x, y, width, height }) => {
      state.updateClip(clipId, { x, y, width, height });
    });
  },
});
