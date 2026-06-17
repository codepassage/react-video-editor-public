/**
 * 🔊 audioActions.ts - 오디오 제어 액션
 * 
 * 비디오 에디터의 전역 오디오 상태를 관리하는 Zustand 액션
 * 모든 클립의 오디오 출력을 통합 제어
 * 
 * 주요 기능:
 * - 전역 뮤트/언뮤트 제어
 * - 토글 기능으로 빠른 음소거 전환
 * - 모든 오디오 클립에 영향
 * 
 * 상태 관리:
 * - isMuted: 전역 뮤트 상태
 * - Remotion 렌더링 시 적용
 * - 실시간 플레이어에서도 동작
 */

import { StateCreator } from 'zustand';

// 오디오 관련 상태 타입
export interface AudioState {
  isMuted: boolean;
}

// 오디오 관련 액션 타입
export interface AudioActions {
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

export const createAudioActions: StateCreator<
  AudioState & AudioActions,
  [],
  [],
  AudioActions
> = (set, get) => ({
  // 오디오 제어
  setMuted: (muted) => {
    set({ isMuted: muted });
  },

  toggleMuted: () => {
    const currentMuted = get().isMuted;
    set({ isMuted: !currentMuted });
  },
});
