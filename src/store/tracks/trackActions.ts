/**
 * 🎵 Track Actions - 트랙 관리 액션 (Zustand Store)
 * 
 * React Video Editor v1의 멀티트랙 타임라인 시스템을 관리하는 핵심 모듈입니다.
 * 트랙의 생성, 삭제, 순서 변경, 속성 수정 등의 모든 트랙 관련 작업을 담당합니다.
 * 
 * 🎯 주요 기능:
 * - 새 트랙 추가/제거 (최소 1개 트랙 유지)
 * - 트랙 순서 변경 (위/아래 이동)
 * - 트랙 표시명 및 속성 수정
 * - 트랙 삭제 시 관련 클립 정리
 * - Player 시간 동기화 트리거
 * 
 * 🏗️ 아키텍처:
 * ```
 * TrackActions
 * ├── addTrack() - 새 트랙을 맨 위에 추가
 * ├── removeTrack() - 트랙 제거 (관련 클립도 정리)
 * ├── updateTrack() - 트랙 속성 업데이트
 * ├── updateTrackDisplayName() - 표시명 변경
 * ├── moveTrackUp() - 트랙을 위로 이동
 * ├── moveTrackDown() - 트랙을 아래로 이동
 * └── setTracks() - 트랙 배열 일괄 설정
 * ```
 * 
 * 💡 사용 예시:
 * ```typescript
 * // 새 트랙 추가
 * addTrack();
 * 
 * // 트랙 표시명 변경
 * updateTrackDisplayName('track123', '메인 오디오');
 * 
 * // 트랙 순서 변경
 * moveTrackUp('track123');
 * moveTrackDown('track456');
 * 
 * // 트랙 제거
 * removeTrack('track123'); // 관련 클립도 자동 정리
 * ```
 * 
 * 🔗 모듈 연관성:
 * - Timeline System: 트랙 시각화 및 드래그 앤 드롭
 * - Clip System: 트랙 내 클립 관리
 * - Player System: 트랙 순서 변경 시 시간 동기화
 * - Bundle System: 번들과 트랙 관계 관리
 * 
 * ⚡ 성능 최적화:
 * - 트랙 순서 변경 시 지연된 동기화 (50ms)
 * - 최소 트랙 수 보장으로 안정성 확보
 * - 트랙 삭제 시 관련 클립 일괄 정리
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */

import { StateCreator } from 'zustand';
import { TimelineTrack, DEFAULT_TRACK_HEIGHT, getDefaultTrackName } from '../../types';
import { generateId } from '../utils/storeUtils';

/**
 * 트랙 관련 상태 타입 정의
 * 
 * @interface TrackState
 * @description 트랙 관리에 필요한 모든 상태를 정의합니다.
 */
export interface TrackState {
  /** 전체 트랙 배열 (순서가 중요함 - 위에서 아래로) */
  tracks: TimelineTrack[];
  /** 현재 선택된 클립들의 ID 배열 (트랙 삭제 시 정리용) */
  selectedClips: string[];
}

/**
 * 트랙 관련 액션 타입 정의
 * 
 * @interface TrackActions
 * @description 트랙에 대한 모든 CRUD 작업과 순서 관리 기능을 정의합니다.
 */
export interface TrackActions {
  /** 새 트랙을 맨 위에 추가 */
  addTrack: () => void;
  /** 트랙을 제거 (최소 1개 트랙 유지, 관련 클립도 정리) */
  removeTrack: (trackId: string) => void;
  /** 트랙의 속성을 부분적으로 업데이트 */
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  /** 트랙의 표시명만 변경 */
  updateTrackDisplayName: (trackId: string, displayName: string) => void;
  /** 트랙을 한 단계 위로 이동 */
  moveTrackUp: (trackId: string) => void;
  /** 트랙을 한 단계 아래로 이동 */
  moveTrackDown: (trackId: string) => void;
  /** 트랙 배열을 일괄 설정 (초기화 또는 외부 데이터 로드 시) */
  setTracks: (tracks: TimelineTrack[]) => void;
}

/**
 * 트랙 시스템 의존성 인터페이스
 * 
 * @interface TrackDependencies
 * @description 트랙 관리가 다른 시스템과 연동하기 위한 의존성을 정의합니다.
 */
export interface TrackDependencies {
  /** Player 시간 동기화 필요 플래그 설정 (트랙 순서 변경 시 사용) */
  setNeedsTimeSync: (needsSync: boolean) => void;
}

/**
 * 트랙 액션 생성자
 * 
 * @function createTrackActions
 * @description Zustand StateCreator를 사용하여 트랙 관리 액션들을 생성합니다.
 * @param set - Zustand set 함수
 * @param get - Zustand get 함수
 * @returns TrackActions 인터페이스 구현체
 */
export const createTrackActions: StateCreator<
  TrackState & TrackActions & TrackDependencies,
  [],
  [],
  TrackActions
> = (set, get) => ({
  /**
   * 새 트랙 추가
   * 
   * @description 새 트랙을 타임라인 맨 위에 추가합니다.
   * 내부적으로는 고유 ID를 생성하고, 사용자에게는 기본 표시명을 보여줍니다.
   */
  addTrack: () => {
    const state = get();
    const newTrackIndex = 0; // 새 트랙은 맨 위에 추가
    const newTrack: TimelineTrack = {
      id: generateId(),
      name: `track-${Date.now()}`, // 내부 로직용 고유 ID
      displayName: getDefaultTrackName(newTrackIndex), // 첫 번째 기본 이름 사용
      clips: [],
      isLocked: false,
      isVisible: true,
      height: DEFAULT_TRACK_HEIGHT
    };
    // 새 트랙을 배열 맨 앞에 추가 (위로 추가)
    set({ tracks: [newTrack, ...state.tracks] });
  },

  /**
   * 트랙 제거
   * 
   * @param trackId - 제거할 트랙의 ID
   * @description 지정된 트랙을 제거하고, 해당 트랙의 클립들도 선택에서 해제합니다.
   * 최소 1개 트랙은 유지되도록 보장합니다.
   */
  removeTrack: (trackId) => {
    const state = get();
    if (state.tracks.length <= 1) return; // 최소 1개 트랙 유지

    set({
      tracks: state.tracks.filter(track => track.id !== trackId),
      selectedClips: state.selectedClips.filter(clipId => {
        const clip = state.tracks
          .flatMap(track => track.clips)
          .find(c => c.id === clipId);
        return clip?.trackId !== trackId;
      })
    });
  },

  /**
   * 트랙 속성 업데이트
   * 
   * @param trackId - 업데이트할 트랙의 ID
   * @param updates - 업데이트할 속성들
   * @description 트랙의 속성을 부분적으로 업데이트합니다.
   */
  updateTrack: (trackId, updates) => {
    const state = get();
    set({
      tracks: state.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      )
    });
  },

  /**
   * 트랙 표시명 변경
   * 
   * @param trackId - 트랙 ID
   * @param displayName - 새로운 표시명
   * @description 트랙의 사용자 표시명을 변경합니다.
   */
  updateTrackDisplayName: (trackId, displayName) => {
    const state = get();
    set({
      tracks: state.tracks.map(track =>
        track.id === trackId ? { ...track, displayName } : track
      )
    });
  },

  /**
   * 트랙을 위로 이동
   * 
   * @param trackId - 이동할 트랙의 ID
   * @description 지정된 트랙을 한 단계 위로 이동시킵니다.
   * 이동 후 Player 시간 동기화를 트리거합니다.
   */
  moveTrackUp: (trackId) => {
    const state = get();
    const currentIndex = state.tracks.findIndex(track => track.id === trackId);

    // 첫 번째 트랙이거나 찾지 못한 경우 이동 불가
    if (currentIndex <= 0) return;

    const newTracks = [...state.tracks];
    // 현재 트랙과 위의 트랙 위치 바꿈
    [newTracks[currentIndex - 1], newTracks[currentIndex]] =
      [newTracks[currentIndex], newTracks[currentIndex - 1]];

    set({ tracks: newTracks });

    // 🎯 트랙 순서 변경 후 Player 시간 동기화 필요 플래그 설정
    // 약간의 지연을 두어 tracks 상태 업데이트 완료 후 플래그 설정
    setTimeout(() => {
      get().setNeedsTimeSync(true);
    }, 50);
  },

  /**
   * 트랙을 아래로 이동
   * 
   * @param trackId - 이동할 트랙의 ID
   * @description 지정된 트랙을 한 단계 아래로 이동시킵니다.
   * 이동 후 Player 시간 동기화를 트리거합니다.
   */
  moveTrackDown: (trackId) => {
    const state = get();
    const currentIndex = state.tracks.findIndex(track => track.id === trackId);

    // 마지막 트랙이거나 찾지 못한 경우 이동 불가
    if (currentIndex < 0 || currentIndex >= state.tracks.length - 1) return;

    const newTracks = [...state.tracks];
    // 현재 트랙과 아래의 트랙 위치 바꿈
    [newTracks[currentIndex], newTracks[currentIndex + 1]] =
      [newTracks[currentIndex + 1], newTracks[currentIndex]];

    set({ tracks: newTracks });

    // 🎯 트랙 순서 변경 후 Player 시간 동기화 필요 플래그 설정
    setTimeout(() => {
      get().setNeedsTimeSync(true);
    }, 50);
  },

  /**
   * 트랙 배열 일괄 설정
   * 
   * @param tracks - 새로운 트랙 배열
   * @description 전체 트랙 배열을 한 번에 설정합니다.
   * 주로 초기화나 외부 데이터 로드 시 사용됩니다.
   */
  setTracks: (tracks) => {
    set({ tracks });
  },
});
