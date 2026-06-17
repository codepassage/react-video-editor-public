/**
 * 📚 mediaActions.ts - 미디어 라이브러리 상태 관리 액션
 * 
 * 미디어 라이브러리의 미디어 아이템과 컨트롤 요소들을 관리하는 Zustand 액션 모음입니다.
 * 업로드된 미디어 파일들과 미디어 라이브러리 UI 컨트롤의 상태를 중앙에서 관리합니다.
 * 
 * 주요 기능:
 * - 미디어 아이템 추가, 수정, 삭제 관리
 * - 미디어 라이브러리 컨트롤 상태 관리
 * - 선택된 미디어/컨트롤 추적 및 속성 패널 연동
 * - ID 기반 미디어 검색 및 조회 유틸리티
 * - 미디어 메타데이터 업데이트 처리
 * 
 * 상태 동기화:
 * - selectedMediaItem과 mediaLibrary 간의 일관성 보장
 * - selectedControl과 mediaLibraryControls 간의 동기화
 * - 속성 패널 열림 상태와 선택 상태 연동
 * 
 * 사용 패턴:
 * - MediaLibrary 컴포넌트에서 미디어 관리 시 사용
 * - 파일 업로드 후 미디어 라이브러리에 추가
 * - 속성 편집을 위한 미디어 선택 및 패널 열기
 * 
 * 특별 고려사항:
 * - 미디어 삭제 시 관련 선택 상태 자동 정리
 * - 속성 패널 상태와 미디어 선택 상태 일치성 유지
 * - 대용량 미디어 라이브러리에서도 빠른 검색 성능 보장
 */

import { StateCreator } from 'zustand';
import { MediaItem } from '../../types';
import type { MediaLibraryControl } from '../utils/storeUtils';

// 미디어 라이브러리 관련 상태 타입
export interface MediaState {
  mediaLibrary: MediaItem[];
  mediaLibraryControls: MediaLibraryControl[];
  selectedMediaItem: MediaItem | null;
  selectedControl: MediaLibraryControl | null;
  isPropertiesPanelOpen: boolean;
}

// 미디어 라이브러리 관련 액션 타입
export interface MediaActions {
  addMediaItem: (media: MediaItem) => void;
  removeMediaItem: (mediaId: string) => void;
  updateMediaItem: (mediaItemId: string, updates: Partial<MediaItem>) => void;
  updateMediaLibraryControl: (controlId: string, updates: Partial<MediaLibraryControl>) => void;
  getControlById: (controlId: string) => MediaLibraryControl | undefined;
  getMediaItemById: (mediaItemId: string) => MediaItem | undefined;
}

export const createMediaActions: StateCreator<
  MediaState & MediaActions,
  [],
  [],
  MediaActions
> = (set, get) => ({
  // 미디어 라이브러리
  addMediaItem: (media) => {
    const state = get();
    set({ mediaLibrary: [...state.mediaLibrary, media] });
  },

  removeMediaItem: (mediaId) => {
    const state = get();

    // 선택된 미디어 아이템이 삭제되는 경우 선택 해제
    const isSelectedMediaItem = state.selectedMediaItem?.id === mediaId;

    set({
      mediaLibrary: state.mediaLibrary.filter(item => item.id !== mediaId),
      selectedMediaItem: isSelectedMediaItem ? null : state.selectedMediaItem,
      isPropertiesPanelOpen: isSelectedMediaItem ? false : state.isPropertiesPanelOpen
    });
  },

  updateMediaItem: (mediaItemId, updates) => {
    const state = get();
    const newMediaLibrary = state.mediaLibrary.map(item =>
      item.id === mediaItemId ? { ...item, ...updates } : item
    );

    // selectedMediaItem도 업데이트
    const updatedSelectedMediaItem = state.selectedMediaItem?.id === mediaItemId
      ? { ...state.selectedMediaItem, ...updates }
      : state.selectedMediaItem;

    set({
      mediaLibrary: newMediaLibrary,
      selectedMediaItem: updatedSelectedMediaItem
    });
  },

  // 미디어 라이브러리 컨트롤
  updateMediaLibraryControl: (controlId, updates) => {
    const state = get();
    const newControls = state.mediaLibraryControls.map(control =>
      control.id === controlId ? { ...control, ...updates } : control
    );

    // selectedControl도 업데이트
    const updatedSelectedControl = state.selectedControl?.id === controlId
      ? { ...state.selectedControl, ...updates }
      : state.selectedControl;

    set({
      mediaLibraryControls: newControls,
      selectedControl: updatedSelectedControl
    });
  },

  getControlById: (controlId) => {
    const state = get();
    return state.mediaLibraryControls.find(control => control.id === controlId);
  },

  getMediaItemById: (mediaItemId) => {
    const state = get();
    return state.mediaLibrary.find(item => item.id === mediaItemId);
  },
});
