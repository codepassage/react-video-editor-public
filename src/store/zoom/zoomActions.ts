import { StateCreator } from 'zustand';
import { DEFAULT_ZOOM } from '../../types';

// 줌 관련 상수
export const MIN_ZOOM = 10; // 최소 줌 (픽셀/초)
export const MAX_ZOOM = 500; // 최대 줌 (픽셀/초)
export const ZOOM_STEP = 10; // 줌 단계
export const DEFAULT_TIMELINE_WIDTH = 1000; // 기본 타임라인 표시 영역 너비

// 줌 관련 상태 타입
export interface ZoomState {
  zoom: number;
  scrollLeft: number;
  timelineContainerWidth: number; // ✅ 타임라인 표시 영역 실제 너비
}

// 줌 관련 액션 타입
export interface ZoomActions {
  setZoom: (zoom: number) => void;
  setScrollLeft: (scrollLeft: number) => void;
  setTimelineContainerWidth: (width: number) => void; // ✅ 표시 영역 너비 설정
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  setZoomPercentage: (percentage: number) => void;
  getZoomPercentage: () => number;
}

// getTotalDuration 액션 타입 (의존성)
export interface ZoomDependencies {
  getTotalDuration: () => number;
  selectedClips: string[];
  tracks: any[];
}

export const createZoomActions: StateCreator<
  ZoomState & ZoomActions & ZoomDependencies,
  [],
  [],
  ZoomActions
> = (set, get) => ({
  setZoom: (zoom) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    set({ zoom: clampedZoom });
  },

  setScrollLeft: (scrollLeft) => set({ scrollLeft }),

  // ✅ 표시 영역 실제 너비 업데이트
  setTimelineContainerWidth: (width) => {
    set({ timelineContainerWidth: width });
  },

  // 🔍 줌 관련 새 액션들
  zoomIn: () => {
    const currentZoom = get().zoom;
    const newZoom = Math.min(MAX_ZOOM, currentZoom + ZOOM_STEP);
    set({ zoom: newZoom });
  },

  zoomOut: () => {
    const currentZoom = get().zoom;
    const newZoom = Math.max(MIN_ZOOM, currentZoom - ZOOM_STEP);
    set({ zoom: newZoom });
  },

  zoomToFit: () => {
    const state = get();
    const totalDuration = state.getTotalDuration();

    // 실제 타임라인 표시 영역 너비를 사용
    const timelineWidth = state.timelineContainerWidth || DEFAULT_TIMELINE_WIDTH;

    if (totalDuration > 0) {
      // 전체 기간이 타임라인 너비에 맞도록 줌 계산 (최대 소수점 2째자리)
      const rawZoom = timelineWidth / totalDuration;
      const roundedZoom = parseFloat(rawZoom.toFixed(2));
      const fitZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, roundedZoom));

      set({
        zoom: fitZoom,
        scrollLeft: 0 // 스크롤을 맨 처음으로
      });
    } else {
      // 클립이 없으면 기본 줌으로
      set({ zoom: DEFAULT_ZOOM, scrollLeft: 0 });
    }
  },

  zoomToSelection: () => {
    const state = get();
    const selectedClips = state.selectedClips;

    if (selectedClips.length === 0) {
      return;
    }

    // 선택된 클립들의 시간 범위 계산
    const clips = state.tracks
      .flatMap(track => track.clips)
      .filter(clip => selectedClips.includes(clip.id));

    if (clips.length === 0) return;

    const minStartTime = Math.min(...clips.map(clip => clip.startTime));
    const maxEndTime = Math.max(...clips.map(clip => clip.endTime));
    const selectionDuration = maxEndTime - minStartTime;

    if (selectionDuration > 0) {
      const timelineWidth = state.timelineContainerWidth || DEFAULT_TIMELINE_WIDTH;
      const rawZoom = timelineWidth / selectionDuration;
      const roundedZoom = parseFloat(rawZoom.toFixed(2));
      const fitZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, roundedZoom));
      const scrollPosition = minStartTime * fitZoom;

      set({
        zoom: fitZoom,
        scrollLeft: scrollPosition
      });
    }
  },

  setZoomPercentage: (percentage) => {
    const newZoom = (percentage / 100) * DEFAULT_ZOOM;
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    set({ zoom: clampedZoom });
  },

  getZoomPercentage: () => {
    return Math.round((get().zoom / DEFAULT_ZOOM) * 100);
  },
});
