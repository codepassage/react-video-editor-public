/**
 * 📦 bundleActions.ts - 번들 시스템 액션 (3번 모듈 핵심 로직)
 * 
 * 연속된 클립들을 논리적으로 그룹화하는 Bundle 시스템의 핵심 로직
 * Zustand 기반 상태 관리와 연속성 검증 알고리즘 포함
 * 
 * 주요 기능:
 * - Bundle 생성/삭제/해제
 * - Bundle 요소 선택 관리 (Command+Click)
 * - 연속성 검증 (Continuity Validation)
 * - Bundle-클립 양방향 바인딩
 * - 시간 범위 자동 업데이트
 * 
 * Bundle 규칙:
 * 1. 최소 2개 요소 필요
 * 2. 요소들이 시간상 연속적이어야 함
 * 3. 기준클립들은 겹칠 수 없음
 * 4. 이미 다른 Bundle에 속한 요소 제외
 * 5. 각 요소는 하나의 Bundle에만 속할 수 있음
 * 
 * 연속성 검증 알고리즘:
 * - 선택된 요소들을 시간순 정렬
 * - 요소 간 간격에 다른 요소 존재 여부 확인
 * - 기준클립 겹침 검사
 * - 기존 Bundle 소속 여부 확인
 */

import { StateCreator } from 'zustand';
import {
  Bundle, SelectedElement, CreateBundleData, BundleValidationResult,
  TemplateGroup, TimelineTrack, TimelineClip
} from '../../types';

// Bundle 관련 상태 타입
export interface BundleState {
  bundles: Bundle[];
  selectedBundleId: string | null;
  bundleSelectionMode: boolean;    // Command/Ctrl 키 상태
  pendingBundleSelection: SelectedElement[]; // 선택 중인 요소들
  tracks: TimelineTrack[];
  templateGroups: TemplateGroup[];
}

// Bundle 기본 액션 타입
export interface BundleActions {
  createBundle: (bundleData: CreateBundleData, selectedElements: SelectedElement[]) => void;
  deleteBundle: (bundleId: string) => void;
  ungroupBundle: (bundleId: string) => void;
  selectBundle: (bundleId: string | null) => void;
  toggleBundleElementSelection: (element: SelectedElement) => void;
  clearBundleSelection: () => void;
  updateBundleTimeRange: (bundleId: string) => void;
  getBundleById: (bundleId: string) => Bundle | undefined;
  getBundleElements: (bundleId: string) => { baseClips: TimelineClip[]; templateGroups: TemplateGroup[] };
  validateBundleContinuity: (selectedElements: SelectedElement[]) => BundleValidationResult;
}

export const createBundleActions: StateCreator<
  BundleState & BundleActions,
  [],
  [],
  BundleActions
> = (set, get) => ({
  // === Bundle 관리 액션들 === //

  createBundle: (bundleData: CreateBundleData, selectedElements: SelectedElement[]) => {
    const state = get();

    // Bundle ID 생성
    const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 시간 범위 계산
    const startTime = Math.min(...selectedElements.map(el => el.startTime));
    const endTime = Math.max(...selectedElements.map(el => el.endTime));

    // 기준클립과 템플릿 그룹 분리
    const baseClipIds: string[] = [];
    const templateGroupIds: string[] = [];

    selectedElements.forEach(element => {
      if (element.type === 'baseClip') {
        baseClipIds.push(element.id);
      } else if (element.type === 'templateGroup') {
        templateGroupIds.push(element.id);
      }
    });

    // Bundle 객체 생성
    const newBundle: Bundle = {
      id: bundleId,
      name: bundleData.name,
      color: bundleData.color,
      createdAt: Date.now(),
      baseClipIds,
      templateGroupIds,
      startTime,
      endTime
    };

    // 트랙의 클립들에 Bundle ID 할당
    const updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (baseClipIds.includes(clip.id)) {
          return { ...clip, bundleId, isBundled: true };
        }
        return clip;
      })
    }));

    // 템플릿 그룹들에 Bundle ID 할당
    const updatedTemplateGroups = state.templateGroups.map(group => {
      if (templateGroupIds.includes(group.id)) {
        return { ...group, bundleId };
      }
      return group;
    });

    // 상태 업데이트
    set({
      bundles: [...state.bundles, newBundle],
      tracks: updatedTracks,
      templateGroups: updatedTemplateGroups,
      pendingBundleSelection: [],  // 선택 초기화
      selectedBundleId: bundleId,  // 새 Bundle 선택
    });

    console.log(`✅ Bundle 생성 완료: ${bundleData.name} (${baseClipIds.length + templateGroupIds.length}개 요소)`);
  },

  deleteBundle: (bundleId: string) => {
    const state = get();

    // Bundle에 속한 모든 클립들의 Bundle ID 제거
    const updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (clip.bundleId === bundleId) {
          const { bundleId: _, isBundled: __, ...clipWithoutBundle } = clip;
          return clipWithoutBundle;
        }
        return clip;
      })
    }));

    // Bundle에 속한 모든 템플릿 그룹들의 Bundle ID 제거
    const updatedTemplateGroups = state.templateGroups.map(group => {
      if (group.bundleId === bundleId) {
        const { bundleId: _, ...groupWithoutBundle } = group;
        return groupWithoutBundle;
      }
      return group;
    });

    // Bundle 목록에서 제거
    const updatedBundles = state.bundles.filter(b => b.id !== bundleId);

    set({
      bundles: updatedBundles,
      tracks: updatedTracks,
      templateGroups: updatedTemplateGroups,
      selectedBundleId: state.selectedBundleId === bundleId ? null : state.selectedBundleId
    });

    console.log(`✅ Bundle 삭제 완료: ${bundleId}`);
  },

  ungroupBundle: (bundleId: string) => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    console.log(`🔓 Bundle 해제: ${bundle.name}`);
    get().deleteBundle(bundleId);
  },

  selectBundle: (bundleId: string | null) => {
    set({ selectedBundleId: bundleId });
  },

  toggleBundleElementSelection: (element: SelectedElement) => {
    const state = get();
    const existing = state.pendingBundleSelection.find(el =>
      el.id === element.id && el.type === element.type
    );

    if (existing) {
      // 이미 선택된 요소는 제거
      set({
        pendingBundleSelection: state.pendingBundleSelection.filter(el =>
          !(el.id === element.id && el.type === element.type)
        )
      });
    } else {
      // 새 요소 추가
      set({
        pendingBundleSelection: [...state.pendingBundleSelection, element]
      });
    }
  },

  clearBundleSelection: () => {
    set({
      pendingBundleSelection: [],
      bundleSelectionMode: false
    });
  },

  updateBundleTimeRange: (bundleId: string) => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    // Bundle에 속한 모든 요소들의 시간 범위 계산
    const bundleBaseClips = state.tracks.flatMap(track =>
      track.clips.filter(clip => clip.bundleId === bundleId)
    );
    const bundleTemplateGroups = state.templateGroups.filter(group =>
      group.bundleId === bundleId
    );

    const allElements = [
      ...bundleBaseClips.map(clip => ({ startTime: clip.startTime, endTime: clip.endTime })),
      ...bundleTemplateGroups.map(group => ({ startTime: group.startTime, endTime: group.endTime }))
    ];

    if (allElements.length === 0) {
      // Bundle에 요소가 없으면 Bundle 삭제
      get().deleteBundle(bundleId);
      return;
    }

    const newStartTime = Math.min(...allElements.map(el => el.startTime));
    const newEndTime = Math.max(...allElements.map(el => el.endTime));

    // Bundle 시간 범위 업데이트
    const updatedBundles = state.bundles.map(b => {
      if (b.id === bundleId) {
        return { ...b, startTime: newStartTime, endTime: newEndTime };
      }
      return b;
    });

    set({ bundles: updatedBundles });
  },

  getBundleById: (bundleId: string) => {
    const state = get();
    return state.bundles.find(b => b.id === bundleId);
  },

  getBundleElements: (bundleId: string) => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return { baseClips: [], templateGroups: [] };

    const baseClips = state.tracks.flatMap(track =>
      track.clips.filter(clip => bundle.baseClipIds.includes(clip.id))
    );
    const templateGroups = state.templateGroups.filter(group =>
      bundle.templateGroupIds.includes(group.id)
    );

    return { baseClips, templateGroups };
  },

  validateBundleContinuity: (selectedElements: SelectedElement[]): BundleValidationResult => {
    if (selectedElements.length < 2) {
      return {
        valid: false,
        reason: 'Bundle을 만들려면 최소 2개의 요소가 필요합니다.'
      };
    }

    const state = get();

    // 시간 순서로 정렬
    const sortedElements = selectedElements.sort((a, b) => a.startTime - b.startTime);

    // 연속성 체크: 선택된 요소들 사이에 다른 요소가 끼어있는지 확인
    for (let i = 0; i < sortedElements.length - 1; i++) {
      const currentElement = sortedElements[i];
      const nextElement = sortedElements[i + 1];

      // 두 요소 사이에 다른 요소가 있는지 검사
      const gapStart = currentElement.endTime;
      const gapEnd = nextElement.startTime;

      if (gapStart < gapEnd) {
        // 간격이 있는 경우, 그 사이에 다른 요소들이 있는지 확인
        const allElements = [
          // 모든 기준클립들
          ...state.tracks.flatMap(track =>
            track.clips
              .filter(clip => clip.baseClipProperties?.isBaseClip)
              .map(clip => ({
                id: clip.id,
                type: 'baseClip' as const,
                name: clip.text || `클립 ${clip.id.slice(-4)}`,
                startTime: clip.startTime,
                endTime: clip.endTime,
                trackIndex: 0
              }))
          ),
          // 모든 템플릿 그룹들
          ...state.templateGroups.map(group => ({
            id: group.id,
            type: 'templateGroup' as const,
            name: group.name,
            startTime: group.startTime,
            endTime: group.endTime,
            trackIndex: 0
          }))
        ];

        // 선택되지 않은 요소들 중에서 간격 사이에 있는 것들 찾기
        const elementsInGap = allElements.filter(el => {
          const isSelected = selectedElements.some(selected =>
            selected.id === el.id && selected.type === el.type
          );
          return !isSelected &&
            el.startTime < gapEnd &&
            el.endTime > gapStart;
        });

        if (elementsInGap.length > 0) {
          return {
            valid: false,
            reason: '선택된 요소들이 연속적이지 않습니다.',
            conflicts: elementsInGap.map(el => el.name)
          };
        }
      }
    }

    // 기준클립 겹침 검사 (기존 규칙 적용)
    const baseClipElements = sortedElements.filter(el => el.type === 'baseClip');
    for (let i = 0; i < baseClipElements.length - 1; i++) {
      const currentClip = baseClipElements[i];
      const nextClip = baseClipElements[i + 1];

      if (currentClip.endTime > nextClip.startTime) {
        return {
          valid: false,
          reason: '기준클립들이 시간상 겹칠 수 없습니다.',
          conflicts: [currentClip.name, nextClip.name]
        };
      }
    }

    // 이미 다른 Bundle에 속한 요소들 확인
    const conflictElements: string[] = [];

    selectedElements.forEach(element => {
      if (element.type === 'baseClip') {
        const clip = state.tracks.flatMap(track => track.clips)
          .find(clip => clip.id === element.id);
        if (clip?.bundleId) {
          const existingBundle = state.bundles.find(b => b.id === clip.bundleId);
          if (existingBundle) {
            conflictElements.push(`${element.name} (Bundle: ${existingBundle.name})`);
          }
        }
      } else if (element.type === 'templateGroup') {
        const group = state.templateGroups.find(g => g.id === element.id);
        if (group?.bundleId) {
          const existingBundle = state.bundles.find(b => b.id === group.bundleId);
          if (existingBundle) {
            conflictElements.push(`${element.name} (Bundle: ${existingBundle.name})`);
          }
        }
      }
    });

    if (conflictElements.length > 0) {
      return {
        valid: false,
        reason: '일부 요소들이 이미 다른 Bundle에 속해 있습니다.',
        conflicts: conflictElements
      };
    }

    return { valid: true };
  },
});
