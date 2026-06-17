/**
 * ⚙️ propertyActions.ts - 속성 패널 상태 관리 액션
 * 
 * 속성 편집 패널의 열림/닫힘 상태와 현재 선택된 대상을 관리하는 Zustand 액션입니다.
 * 클립, 컨트롤, 미디어 아이템 등 다양한 객체의 속성 편집을 위한 통합된 인터페이스를 제공합니다.
 * 
 * 주요 기능:
 * - 클립, 컨트롤, 미디어 아이템 선택 상태 관리
 * - 속성 패널 열림/닫힘 상태 제어
 * - 다중 클립 선택 지원 (selectedClips 배열)
 * - 선택 대상 간의 배타적 관계 보장
 * - 패널 열기/닫기 시 자동 상태 정리
 * 
 * 상태 동기화:
 * - 하나의 대상만 선택 가능 (클립 OR 컨트롤 OR 미디어 아이템)
 * - 새로운 선택 시 이전 선택 자동 해제
 * - 선택과 속성 패널 열림 상태 연동
 * 
 * 사용 패턴:
 * - 타임라인에서 클립 선택 시 속성 편집
 * - 미디어 라이브러리에서 컨트롤/미디어 선택 시 편집
 * - 우클릭 또는 더블클릭으로 속성 패널 열기
 * 
 * 특별 고려사항:
 * - tracks 의존성을 통한 실시간 클립 데이터 조회
 * - 선택 해제 시 모든 관련 상태 일괄 초기화
 * - 속성 패널 열림 여부와 선택 상태의 독립적 관리
 */

import { StateCreator } from 'zustand';
import { TimelineClip, TimelineTrack, MediaItem } from '../../types';
import type { MediaLibraryControl } from '../utils/storeUtils';

// 속성 패널 관련 상태 타입
export interface PropertyState {
  selectedClip: TimelineClip | null;
  selectedControl: MediaLibraryControl | null;
  selectedMediaItem: MediaItem | null;
  isPropertiesPanelOpen: boolean;
  selectedClips: string[];
}

// 속성 패널 관련 액션 타입
export interface PropertyActions {
  selectClip: (clipId: string | null) => void;
  selectControl: (controlId: string | null) => void;
  selectMediaItem: (mediaItemId: string | null) => void;
  closePropertiesPanel: () => void;
  openPropertiesPanel: (clipId: string) => void;
  openControlPropertiesPanel: (controlId: string) => void;
  openMediaItemPropertiesPanel: (mediaItemId: string) => void;
}

// 의존성 타입
export interface PropertyDependencies {
  tracks: TimelineTrack[];
  mediaLibraryControls: MediaLibraryControl[];
  mediaLibrary: MediaItem[];
}

export const createPropertyActions: StateCreator<
  PropertyState & PropertyActions & PropertyDependencies,
  [],
  [],
  PropertyActions
> = (set, get) => ({
  // 속성 패널 관리
  selectClip: (clipId) => {
    const state = get();
    if (clipId) {
      const clip = state.tracks
        .flatMap(track => track.clips)
        .find(c => c.id === clipId);

      set({
        selectedClip: clip || null,
        selectedControl: null,
        selectedMediaItem: null, // 클립 선택 시 다른 선택 해제
        isPropertiesPanelOpen: false, // 선택만 하고 속성창은 열지 않음
        selectedClips: clip ? [clipId] : []
      });
    } else {
      set({
        selectedClip: null,
        selectedControl: null,
        selectedMediaItem: null,
        isPropertiesPanelOpen: false,
        selectedClips: []
      });
    }
  },

  selectControl: (controlId) => {
    const state = get();
    if (controlId) {
      const control = state.mediaLibraryControls.find(c => c.id === controlId);

      set({
        selectedControl: control || null,
        selectedClip: null,
        selectedMediaItem: null, // 컨트롤 선택 시 다른 선택 해제
        isPropertiesPanelOpen: !!control,
        selectedClips: []
      });
    } else {
      set({
        selectedControl: null,
        selectedClip: null,
        selectedMediaItem: null,
        isPropertiesPanelOpen: false,
        selectedClips: []
      });
    }
  },

  selectMediaItem: (mediaItemId) => {
    const state = get();
    if (mediaItemId) {
      const mediaItem = state.mediaLibrary.find(item => item.id === mediaItemId);

      set({
        selectedMediaItem: mediaItem || null,
        selectedClip: null,
        selectedControl: null, // 미디어 아이템 선택 시 다른 선택 해제
        isPropertiesPanelOpen: !!mediaItem,
        selectedClips: []
      });
    } else {
      set({
        selectedMediaItem: null,
        selectedClip: null,
        selectedControl: null,
        isPropertiesPanelOpen: false,
        selectedClips: []
      });
    }
  },

  closePropertiesPanel: () => {
    set({
      selectedClip: null,
      selectedControl: null,
      selectedMediaItem: null,
      isPropertiesPanelOpen: false,
      selectedClips: []
    });
  },

  openPropertiesPanel: (clipId) => {
    const state = get();
    const clip = state.tracks
      .flatMap(track => track.clips)
      .find(c => c.id === clipId);

    if (clip) {
      set({
        selectedClip: clip,
        selectedControl: null,
        selectedMediaItem: null,
        isPropertiesPanelOpen: true,
        selectedClips: [clipId]
      });
    }
  },

  openControlPropertiesPanel: (controlId) => {
    const state = get();
    const control = state.mediaLibraryControls.find(c => c.id === controlId);

    if (control) {
      set({
        selectedControl: control,
        selectedClip: null,
        selectedMediaItem: null,
        isPropertiesPanelOpen: true,
        selectedClips: []
      });
    }
  },

  openMediaItemPropertiesPanel: (mediaItemId) => {
    const state = get();
    const mediaItem = state.mediaLibrary.find(item => item.id === mediaItemId);

    if (mediaItem) {
      set({
        selectedMediaItem: mediaItem,
        selectedClip: null,
        selectedControl: null,
        isPropertiesPanelOpen: true,
        selectedClips: []
      });
    }
  },
});
