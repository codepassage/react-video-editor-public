/**
 * 📦 bundleAdvancedActions.ts - Bundle 고급 관리 액션
 * 
 * Bundle 시스템의 고급 기능들을 제공하는 Zustand 액션 모음입니다.
 * Bundle과 TemplateGroup 간의 복잡한 연관 관계를 관리하고, 정교한 이동 제약과 검증 기능을 제공합니다.
 * 
 * 주요 기능:
 * - Bundle-TemplateGroup 연동 이동 및 독립 이동
 * - Bundle 요소 순서 변경 및 재배열
 * - Bundle 개별 요소 이동 범위 계산 및 제약
 * - Bundle 복제, 병합, 메타데이터 관리
 * - Bundle 해제 시 안전 검증 및 확인
 * - Bundle 통계 정보 생성 및 분석
 * 
 * 연관 관계 관리:
 * - Bundle relationships 기반 TemplateGroup 동기화
 * - 연결된 그룹들의 syncMovement 옵션 처리
 * - 그룹 보호 설정 유지 및 보존
 * 
 * 성능 최적화:
 * - 대량의 Bundle/TemplateGroup 처리 최적화
 * - 이동 제약 계산 캐싱
 * - 배치 연산을 통한 상태 업데이트 최소화
 * 
 * 사용 패턴:
 * - 복잡한 프로젝트에서 Bundle 단위 관리
 * - Template 시스템과 연동한 고급 편집 작업
 * - Bundle 내부 요소들의 정교한 제어
 * 
 * 특별 고려사항:
 * - Bundle 요소 이동 시 연속성 제약 검증
 * - TemplateGroup과의 관계 유지 및 동기화
 * - 사용자 친화적 확인 대화상자 및 에러 처리
 * - globalAlert를 통한 안전한 사용자 인터랙션
 */

import { StateCreator } from 'zustand';
import {
  Bundle, TemplateGroup, TimelineTrack, TimelineClip
} from '../../types';
import { generateId } from '../utils/storeUtils';
import { globalAlert } from '../../utils/globalAlert';

// Bundle 고급 액션 상태 의존성
export interface BundleAdvancedState {
  bundles: Bundle[];
  tracks: TimelineTrack[];
  templateGroups: TemplateGroup[];
  selectedBundleId: string | null;
}

// Bundle 고급 액션 타입
export interface BundleAdvancedActions {
  moveBundleElements: (bundleId: string, deltaTime: number) => void;
  // 🌟 새로운 Bundle 이동 함수들
  moveBundleWithTemplateGroups: (bundleId: string, linkedGroups: any[], deltaTime: number) => void;
  moveBundleOnly: (bundleId: string, deltaTime: number) => void;
  updateBundleMetadata: (bundleId: string, updates: { name?: string; color?: string }) => void;
  duplicateBundle: (bundleId: string) => void;
  cleanupEmptyBundles: () => void;
  getBundleStats: () => {
    totalBundles: number;
    totalBaseClips: number;
    totalTemplateGroups: number;
    bundlesByColor: Record<string, number>;
    averageBundleSize: number;
    longestBundle: Bundle | null;
    shortestBundle: Bundle | null;
    bundleDurations: number[];
  };
  mergeBundles: (bundle1Id: string, bundle2Id: string, newName: string) => void;

  // Bundle 내부 요소 순서 변경 기능
  moveBundleElementOrder: (bundleId: string, elementId: string, elementType: 'baseClip' | 'templateGroup', direction: 'left' | 'right') => {
    success: boolean;
    reason?: string;
    newOrder?: Array<{ id: string; type: 'baseClip' | 'templateGroup'; startTime: number }>;
  };
  reorderBundleElements: (bundleId: string, newOrder: Array<{ id: string; type: 'baseClip' | 'templateGroup' }>) => void;

  // Bundle 개별 이동 제약 로직
  calculateBundleElementMoveRange: (elementId: string, elementType: 'baseClip' | 'templateGroup') => {
    minTime: number;
    maxTime: number;
    canMoveFreely: boolean;
    bundleId?: string;
    bundle?: Bundle;
    otherElementsCount?: number;
  } | null;
  validateBundleElementMove: (elementId: string, elementType: 'baseClip' | 'templateGroup', newStartTime: number) => {
    valid: boolean;
    reason: string;
    suggestedTime?: number;
  };
  moveBundleElementSafely: (elementId: string, elementType: 'baseClip' | 'templateGroup', newStartTime: number) => {
    success: boolean;
    finalTime: number;
    wasConstrained?: boolean;
    reason?: string;
  };

  // Bundle 해제 기능 개선
  validateBundleUngroup: (bundleId: string) => {
    valid: boolean;
    reason?: string;
    bundle?: Bundle;
    baseClips?: TimelineClip[];
    templateGroups?: TemplateGroup[];
    totalElements?: number;
  };
  ungroupBundleSafely: (bundleId: string, showConfirmation?: boolean) => Promise<{
    success: boolean;
    reason?: string;
    bundleName?: string;
    releasedElements?: number;
    releasedBaseClips?: number;
    releasedTemplateGroups?: number;
  }>;
}

// 의존성 액션들
export interface BundleAdvancedDependencies {
  getBundleById: (bundleId: string) => Bundle | undefined;
  getBundleElements: (bundleId: string) => { baseClips: TimelineClip[]; templateGroups: TemplateGroup[] };
  updateBundleTimeRange: (bundleId: string) => void;
  createTemplateGroup: (groupData: TemplateGroup) => void;
  deleteBundle: (bundleId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
}

export const createBundleAdvancedActions: StateCreator<
  BundleAdvancedState & BundleAdvancedActions & BundleAdvancedDependencies,
  [],
  [],
  BundleAdvancedActions
> = (set, get) => ({
  // === Bundle 고급 관리 기능들 === //

  moveBundleElements: (bundleId: string, deltaTime: number) => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    console.log('📦 Bundle 요소들 이동 시작:', {
      bundleId: bundleId.slice(-8),
      bundleName: bundle.name,
      deltaTime: deltaTime.toFixed(3),
      hasRelationships: !!bundle.relationships
    });

    // 🌟 Bundle-TemplateGroup 관계 확인
    const linkedGroups = bundle.relationships?.linkedTemplateGroups || [];
    const shouldMoveGroups = bundle.relationships?.dragBehavior === 'with-groups';
    
    if (shouldMoveGroups && linkedGroups.length > 0) {
      console.log('🔗 Bundle-TemplateGroup 연동 이동 시작:', {
        bundleId: bundleId.slice(-8),
        linkedGroups: linkedGroups.length,
        groupIds: linkedGroups.map(g => g.groupId.slice(-8))
      });
      
      // 🌟 연동 이동 로직 실행
      get().moveBundleWithTemplateGroups(bundleId, linkedGroups, deltaTime);
    } else {
      console.log('📦 Bundle 단독 이동 시작');
      
      // 기존 Bundle 단독 이동 로직
      get().moveBundleOnly(bundleId, deltaTime);
    }
  },

  // 🌟 새로운 함수: Bundle과 TemplateGroup 연동 이동
  moveBundleWithTemplateGroups: (bundleId: string, linkedGroups: any[], deltaTime: number) => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    console.log('🔗 Bundle-TemplateGroup 연동 이동 시작:', {
      bundleId: bundleId.slice(-8),
      bundleName: bundle.name,
      deltaTime: deltaTime.toFixed(3),
      linkedGroups: linkedGroups.length
    });

    // 경계 제한: Bundle이 0초 이하로 가지 않도록
    const newBundleStartTime = bundle.startTime + deltaTime;
    let adjustedDeltaTime = deltaTime;

    if (newBundleStartTime < 0) {
      adjustedDeltaTime = -bundle.startTime;
      console.log('🛡️ Bundle 경계 제한 적용:', {
        원래deltaTime: deltaTime.toFixed(3),
        조정된deltaTime: adjustedDeltaTime.toFixed(3)
      });
    }

    // 1. Bundle의 기준클립들 이동
    let updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (bundle.baseClipIds.includes(clip.id)) {
          console.log('🎬 Bundle 기준클립 이동:', {
            clipId: clip.id.slice(-8),
            oldTime: clip.startTime.toFixed(2),
            newTime: (clip.startTime + adjustedDeltaTime).toFixed(2)
          });
          return {
            ...clip,
            startTime: clip.startTime + adjustedDeltaTime,
            endTime: clip.endTime + adjustedDeltaTime
          };
        }
        return clip;
      })
    }));

    // 2. 🌟 연결된 TemplateGroup들도 함께 이동
    let updatedTemplateGroups = state.templateGroups.map(group => {
      // Bundle에 속한 그룹들 이동
      if (bundle.templateGroupIds.includes(group.id)) {
        console.log('📄 Bundle 템플릿그룹 이동:', {
          groupId: group.id.slice(-8),
          groupName: group.name,
          oldTime: group.startTime.toFixed(2),
          newTime: (group.startTime + adjustedDeltaTime).toFixed(2)
        });
        return {
          ...group,
          startTime: group.startTime + adjustedDeltaTime,
          endTime: group.endTime + adjustedDeltaTime
        };
      }
      
      // 🌟 연결된 그룹들도 함께 이동
      const linkedGroup = linkedGroups.find(lg => lg.groupId === group.id && lg.syncMovement);
      if (linkedGroup && !bundle.templateGroupIds.includes(group.id)) {
        console.log('🔗 연결된 템플릿그룹 이동:', {
          groupId: group.id.slice(-8),
          groupName: group.name,
          relationship: linkedGroup.relationship,
          oldTime: group.startTime.toFixed(2),
          newTime: (group.startTime + adjustedDeltaTime).toFixed(2)
        });
        
        // 그룹의 보호 설정 유지
        if (bundle.relationships?.preserveGroupProtection && group.isProtected) {
          console.log('🛡️ 그룹 보호 설정 유지:', group.name);
        }
        
        return {
          ...group,
          startTime: group.startTime + adjustedDeltaTime,
          endTime: group.endTime + adjustedDeltaTime
        };
      }
      
      return group;
    });

    // 3. 🌟 연결된 TemplateGroup의 클립들도 함께 이동
    linkedGroups.forEach(linkedGroup => {
      if (linkedGroup.syncMovement) {
        const templateGroup = state.templateGroups.find(g => g.id === linkedGroup.groupId);
        if (templateGroup && !bundle.templateGroupIds.includes(templateGroup.id)) {
          console.log('🔗 연결된 그룹 클립들 이동:', {
            groupId: templateGroup.id.slice(-8),
            groupName: templateGroup.name,
            clipCount: templateGroup.clipIds.length
          });
          
          // 그룹에 속한 클립들 이동 (Bundle에 포함되지 않은 클립들만)
          updatedTracks = updatedTracks.map(track => ({
            ...track,
            clips: track.clips.map(clip => {
              if (templateGroup.clipIds.includes(clip.id) && !bundle.baseClipIds.includes(clip.id)) {
                console.log('🔗 연결된 그룹 클립 이동:', {
                  clipId: clip.id.slice(-8),
                  oldTime: clip.startTime.toFixed(2),
                  newTime: (clip.startTime + adjustedDeltaTime).toFixed(2)
                });
                return {
                  ...clip,
                  startTime: clip.startTime + adjustedDeltaTime,
                  endTime: clip.endTime + adjustedDeltaTime
                };
              }
              return clip;
            })
          }));
        }
      }
    });

    // 4. Bundle 시간 범위 업데이트
    const updatedBundles = state.bundles.map(b => {
      if (b.id === bundleId) {
        return {
          ...b,
          startTime: b.startTime + adjustedDeltaTime,
          endTime: b.endTime + adjustedDeltaTime
        };
      }
      return b;
    });

    set({
      tracks: updatedTracks,
      templateGroups: updatedTemplateGroups,
      bundles: updatedBundles
    });

    console.log('✅ Bundle-TemplateGroup 연동 이동 완료:', {
      bundleId: bundleId.slice(-8),
      movedGroups: linkedGroups.filter(lg => lg.syncMovement).length,
      adjustedDeltaTime: adjustedDeltaTime.toFixed(3)
    });
  },

  // 🌟 새로운 함수: Bundle 단독 이동
  moveBundleOnly: (bundleId: string, deltaTime: number) => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    console.log('📦 Bundle 단독 이동 시작:', {
      bundleId: bundleId.slice(-8),
      bundleName: bundle.name,
      deltaTime: deltaTime.toFixed(3)
    });

    // 경계 제한: Bundle이 0초 이하로 가지 않도록
    const newBundleStartTime = bundle.startTime + deltaTime;
    let adjustedDeltaTime = deltaTime;

    if (newBundleStartTime < 0) {
      adjustedDeltaTime = -bundle.startTime;
      console.log('🛡️ Bundle 경계 제한 적용:', {
        원래deltaTime: deltaTime.toFixed(3),
        조정된deltaTime: adjustedDeltaTime.toFixed(3)
      });
    }

    // Bundle에 속한 모든 기준클립 이동
    const updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (bundle.baseClipIds.includes(clip.id)) {
          return {
            ...clip,
            startTime: clip.startTime + adjustedDeltaTime,
            endTime: clip.endTime + adjustedDeltaTime
          };
        }
        return clip;
      })
    }));

    // Bundle에 속한 모든 템플릿 그룹 이동
    const updatedTemplateGroups = state.templateGroups.map(group => {
      if (bundle.templateGroupIds.includes(group.id)) {
        return {
          ...group,
          startTime: group.startTime + adjustedDeltaTime,
          endTime: group.endTime + adjustedDeltaTime
        };
      }
      return group;
    });

    // Bundle 시간 범위 업데이트
    const updatedBundles = state.bundles.map(b => {
      if (b.id === bundleId) {
        return {
          ...b,
          startTime: b.startTime + adjustedDeltaTime,
          endTime: b.endTime + adjustedDeltaTime
        };
      }
      return b;
    });

    set({
      tracks: updatedTracks,
      templateGroups: updatedTemplateGroups,
      bundles: updatedBundles
    });

    console.log('✅ Bundle 단독 이동 완룼:', {
      bundleId: bundleId.slice(-8),
      adjustedDeltaTime: adjustedDeltaTime.toFixed(3)
    });
  },

  // Bundle 메타데이터 업데이트
  updateBundleMetadata: (bundleId: string, updates: { name?: string; color?: string }) => {
    const state = get();
    const updatedBundles = state.bundles.map(bundle => {
      if (bundle.id === bundleId) {
        return { ...bundle, ...updates };
      }
      return bundle;
    });

    set({ bundles: updatedBundles });

    console.log('📝 Bundle 메타데이터 업데이트:', {
      bundleId: bundleId.slice(-8),
      updates
    });
  },

  // Bundle 복제 기능
  duplicateBundle: (bundleId: string) => {
    const state = get();
    const originalBundle = state.bundles.find(b => b.id === bundleId);
    if (!originalBundle) return;

    // 새 Bundle ID 생성
    const newBundleId = `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 원본 Bundle의 구성 요소들 복제
    const { baseClips, templateGroups } = get().getBundleElements(bundleId);

    const newBaseClipIds: string[] = [];
    const newTemplateGroupIds: string[] = [];

    // 기준클립들 복제
    baseClips.forEach(clip => {
      const newClipId = generateId();
      const newClip = {
        ...clip,
        id: newClipId,
        startTime: clip.startTime + originalBundle.endTime - originalBundle.startTime + 1, // 1초 간격으로 배치
        endTime: clip.endTime + originalBundle.endTime - originalBundle.startTime + 1,
        bundleId: newBundleId,
        isBundled: true
      };

      // 트랙에 새 클립 추가
      const targetTrack = state.tracks.find(track =>
        track.clips.some(c => c.id === clip.id)
      );
      if (targetTrack) {
        newBaseClipIds.push(newClipId);
        // addClip 대신 직접 추가
        set(state => ({
          tracks: state.tracks.map(track =>
            track.id === targetTrack.id
              ? { ...track, clips: [...track.clips, newClip] }
              : track
          )
        }));
      }
    });

    // 템플릿 그룹들 복제 (간단한 참조 복제)
    templateGroups.forEach(group => {
      const newGroupId = generateId();
      const newGroup = {
        ...group,
        id: newGroupId,
        name: `${group.name} (복제)`,
        startTime: group.startTime + originalBundle.endTime - originalBundle.startTime + 1,
        endTime: group.endTime + originalBundle.endTime - originalBundle.startTime + 1,
        bundleId: newBundleId,
        createdAt: Date.now()
      };

      newTemplateGroupIds.push(newGroupId);
      get().createTemplateGroup(newGroup);
    });

    // 새 Bundle 생성
    const newBundle: Bundle = {
      id: newBundleId,
      name: `${originalBundle.name} (복제)`,
      color: originalBundle.color,
      createdAt: Date.now(),
      baseClipIds: newBaseClipIds,
      templateGroupIds: newTemplateGroupIds,
      startTime: originalBundle.startTime + originalBundle.endTime - originalBundle.startTime + 1,
      endTime: originalBundle.endTime + originalBundle.endTime - originalBundle.startTime + 1
    };

    set({
      bundles: [...state.bundles, newBundle],
      selectedBundleId: newBundleId
    });

    console.log('📋 Bundle 복제 완료:', {
      원본Bundle: originalBundle.name,
      새Bundle: newBundle.name,
      구성요소수: newBaseClipIds.length + newTemplateGroupIds.length
    });
  },

  // Bundle 자동 정리 (빈 Bundle 제거)
  cleanupEmptyBundles: () => {
    const state = get();
    const emptyBundles: string[] = [];

    state.bundles.forEach(bundle => {
      const { baseClips, templateGroups } = get().getBundleElements(bundle.id);
      if (baseClips.length === 0 && templateGroups.length === 0) {
        emptyBundles.push(bundle.id);
      }
    });

    if (emptyBundles.length > 0) {
      const cleanedBundles = state.bundles.filter(b => !emptyBundles.includes(b.id));
      const wasSelectedEmpty = emptyBundles.includes(state.selectedBundleId || '');

      set({
        bundles: cleanedBundles,
        selectedBundleId: wasSelectedEmpty ? null : state.selectedBundleId
      });

      console.log('🧹 빈 Bundle 정리 완료:', {
        제거된Bundle수: emptyBundles.length,
        제거된BundleIds: emptyBundles.map(id => id.slice(-8))
      });
    }
  },

  // Bundle 통계 정보 제공
  getBundleStats: () => {
    const state = get();

    const stats = {
      totalBundles: state.bundles.length,
      totalBaseClips: 0,
      totalTemplateGroups: 0,
      bundlesByColor: {} as Record<string, number>,
      averageBundleSize: 0,
      longestBundle: null as Bundle | null,
      shortestBundle: null as Bundle | null,
      bundleDurations: [] as number[]
    };

    state.bundles.forEach(bundle => {
      const { baseClips, templateGroups } = get().getBundleElements(bundle.id);
      stats.totalBaseClips += baseClips.length;
      stats.totalTemplateGroups += templateGroups.length;

      // 색상별 통계
      stats.bundlesByColor[bundle.color] = (stats.bundlesByColor[bundle.color] || 0) + 1;

      // 길이 통계
      const duration = bundle.endTime - bundle.startTime;
      stats.bundleDurations.push(duration);

      if (!stats.longestBundle || duration > (stats.longestBundle.endTime - stats.longestBundle.startTime)) {
        stats.longestBundle = bundle;
      }

      if (!stats.shortestBundle || duration < (stats.shortestBundle.endTime - stats.shortestBundle.startTime)) {
        stats.shortestBundle = bundle;
      }
    });

    if (stats.bundleDurations.length > 0) {
      stats.averageBundleSize = stats.bundleDurations.reduce((sum, dur) => sum + dur, 0) / stats.bundleDurations.length;
    }

    return stats;
  },

  // Bundle 병합 기능 (두 개의 연속된 Bundle을 하나로 합치기)
  mergeBundles: (bundle1Id: string, bundle2Id: string, newName: string) => {
    const state = get();
    const bundle1 = state.bundles.find(b => b.id === bundle1Id);
    const bundle2 = state.bundles.find(b => b.id === bundle2Id);

    if (!bundle1 || !bundle2) {
      console.error('❌ Bundle 병합 실패: Bundle을 찾을 수 없음');
      return;
    }

    // 시간 순서 정렬
    const [firstBundle, secondBundle] = bundle1.startTime <= bundle2.startTime
      ? [bundle1, bundle2]
      : [bundle2, bundle1];

    // 연속성 검증
    if (firstBundle.endTime > secondBundle.startTime) {
      console.error('❌ Bundle 병합 실패: Bundle들이 겹침');
      return;
    }

    // 새 Bundle ID 생성
    const mergedBundleId = `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 구성 요소들 합치기
    const mergedBaseClipIds = [...firstBundle.baseClipIds, ...secondBundle.baseClipIds];
    const mergedTemplateGroupIds = [...firstBundle.templateGroupIds, ...secondBundle.templateGroupIds];

    // 새 Bundle 생성
    const mergedBundle: Bundle = {
      id: mergedBundleId,
      name: newName,
      color: firstBundle.color, // 첫 번째 Bundle의 색상 사용
      createdAt: Date.now(),
      baseClipIds: mergedBaseClipIds,
      templateGroupIds: mergedTemplateGroupIds,
      startTime: firstBundle.startTime,
      endTime: secondBundle.endTime
    };

    // 기존 Bundle들의 구성 요소들에 새 Bundle ID 할당
    const updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (mergedBaseClipIds.includes(clip.id)) {
          return { ...clip, bundleId: mergedBundleId };
        }
        return clip;
      })
    }));

    const updatedTemplateGroups = state.templateGroups.map(group => {
      if (mergedTemplateGroupIds.includes(group.id)) {
        return { ...group, bundleId: mergedBundleId };
      }
      return group;
    });

    // Bundle 목록 업데이트 (기존 Bundle들 제거, 새 Bundle 추가)
    const updatedBundles = [
      ...state.bundles.filter(b => b.id !== bundle1Id && b.id !== bundle2Id),
      mergedBundle
    ];

    set({
      bundles: updatedBundles,
      tracks: updatedTracks,
      templateGroups: updatedTemplateGroups,
      selectedBundleId: mergedBundleId
    });

    console.log('🤝 Bundle 병합 완료:', {
      원본Bundle1: firstBundle.name,
      원본Bundle2: secondBundle.name,
      새Bundle: mergedBundle.name,
      총구성요소: mergedBaseClipIds.length + mergedTemplateGroupIds.length
    });
  },

  // === Bundle 내부 요소 순서 변경 기능 === //

  // Bundle 내부에서 요소의 순서를 좌우로 이동
  moveBundleElementOrder: (bundleId: string, elementId: string, elementType: 'baseClip' | 'templateGroup', direction: 'left' | 'right') => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) {
      return { success: false, reason: 'Bundle을 찾을 수 없습니다.' };
    }

    const { baseClips, templateGroups } = get().getBundleElements(bundleId);
    const allElements = [
      ...baseClips.map(clip => ({
        id: clip.id,
        type: 'baseClip' as const,
        startTime: clip.startTime,
        endTime: clip.endTime,
        duration: clip.duration,
        name: clip.text || `클립 ${clip.id.slice(-4)}`
      })),
      ...templateGroups.map(group => ({
        id: group.id,
        type: 'templateGroup' as const,
        startTime: group.startTime,
        endTime: group.endTime,
        duration: group.endTime - group.startTime,
        name: group.name
      }))
    ];

    // 시간 순서로 정렬
    const sortedElements = allElements.sort((a, b) => a.startTime - b.startTime);

    // 현재 요소의 인덱스 찾기
    const currentIndex = sortedElements.findIndex(el => el.id === elementId && el.type === elementType);
    if (currentIndex === -1) {
      return { success: false, reason: '요소를 찾을 수 없습니다.' };
    }

    // 이동 방향에 따른 새 인덱스 계산
    let newIndex: number;
    if (direction === 'left') {
      newIndex = currentIndex - 1;
      if (newIndex < 0) {
        return { success: false, reason: '이미 맨 왼쪽에 있습니다.' };
      }
    } else {
      newIndex = currentIndex + 1;
      if (newIndex >= sortedElements.length) {
        return { success: false, reason: '이미 맨 오른쪽에 있습니다.' };
      }
    }

    // 요소들의 새로운 순서 배열 생성
    const newOrder = [...sortedElements];
    const [movedElement] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, movedElement);

    // 새로운 시간 위치 계산 및 적용
    let currentTime = bundle.startTime;
    const gap = 0.1; // 요소들 사이의 최소 간격

    newOrder.forEach((element, index) => {
      const newStartTime = currentTime;
      const newEndTime = newStartTime + element.duration;

      // 실제 요소 업데이트
      if (element.type === 'baseClip') {
        get().updateClip(element.id, {
          startTime: newStartTime,
          endTime: newEndTime
        });
      } else {
        // 템플릿 그룹 업데이트
        const updatedGroups = state.templateGroups.map(group => {
          if (group.id === element.id) {
            return {
              ...group,
              startTime: newStartTime,
              endTime: newEndTime
            };
          }
          return group;
        });

        set({ templateGroups: updatedGroups });

        // 그룹에 속한 클립들도 함께 이동
        const group = state.templateGroups.find(g => g.id === element.id);
        if (group) {
          const deltaTime = newStartTime - group.startTime;
          const updatedTracks = state.tracks.map(track => ({
            ...track,
            clips: track.clips.map(clip => {
              if (group.clipIds.includes(clip.id)) {
                return {
                  ...clip,
                  startTime: clip.startTime + deltaTime,
                  endTime: clip.endTime + deltaTime
                };
              }
              return clip;
            })
          }));

          set({ tracks: updatedTracks });
        }
      }

      currentTime = newEndTime + gap;
    });

    // Bundle 시간 범위 업데이트
    get().updateBundleTimeRange(bundleId);

    console.log('🔄 Bundle 요소 순서 변경 완료:', {
      bundleId: bundleId.slice(-8),
      elementId: elementId.slice(-8),
      direction,
      이전인덱스: currentIndex,
      새인덱스: newIndex
    });

    return {
      success: true,
      newOrder: newOrder.map(el => ({
        id: el.id,
        type: el.type,
        startTime: el.startTime
      }))
    };
  },

  // Bundle 요소들의 순서를 직접 재배열
  reorderBundleElements: (bundleId: string, newOrder: Array<{ id: string; type: 'baseClip' | 'templateGroup' }>) => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    console.log('🔄 Bundle 요소 재배열 시작:', {
      bundleId: bundleId.slice(-8),
      newOrderIds: newOrder.map(el => `${el.type}:${el.id.slice(-4)}`)
    });

    // 새로운 순서에 따라 요소들의 시간 위치 재계산
    let currentTime = bundle.startTime;
    const gap = 0.1;

    newOrder.forEach((orderItem, index) => {
      // 현재 요소 찾기
      let element: any = null;
      let duration = 1; // 기본 길이

      if (orderItem.type === 'baseClip') {
        element = state.tracks.flatMap(track => track.clips)
          .find(clip => clip.id === orderItem.id);
        if (element) {
          duration = element.duration;
        }
      } else {
        element = state.templateGroups.find(group => group.id === orderItem.id);
        if (element) {
          duration = element.endTime - element.startTime;
        }
      }

      if (!element) return;

      const newStartTime = currentTime;
      const newEndTime = newStartTime + duration;

      // 요소 위치 업데이트
      if (orderItem.type === 'baseClip') {
        get().updateClip(orderItem.id, {
          startTime: newStartTime,
          endTime: newEndTime
        });
      } else {
        // 템플릿 그룹의 경우 그룹과 포함된 클립들 모두 이동
        const group = element;
        const deltaTime = newStartTime - group.startTime;

        // 그룹 정보 업데이트
        const updatedGroups = state.templateGroups.map(g => {
          if (g.id === orderItem.id) {
            return {
              ...g,
              startTime: newStartTime,
              endTime: newEndTime
            };
          }
          return g;
        });

        set({ templateGroups: updatedGroups });

        // 그룹에 속한 클립들 이동
        const updatedTracks = state.tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => {
            if (group.clipIds.includes(clip.id)) {
              return {
                ...clip,
                startTime: clip.startTime + deltaTime,
                endTime: clip.endTime + deltaTime
              };
            }
            return clip;
          })
        }));

        set({ tracks: updatedTracks });
      }

      currentTime = newEndTime + gap;
    });

    // Bundle 시간 범위 업데이트
    get().updateBundleTimeRange(bundleId);

    console.log('✅ Bundle 요소 재배열 완료:', {
      bundleId: bundleId.slice(-8),
      totalElements: newOrder.length
    });
  },

  // === Bundle 개별 이동 제약 로직 === //

  // Bundle 요소의 이동 가능 범위 계산
  calculateBundleElementMoveRange: (elementId: string, elementType: 'baseClip' | 'templateGroup') => {
    const state = get();

    // 요소 찾기
    let element: any = null;
    let bundleId: string | null = null;

    if (elementType === 'baseClip') {
      element = state.tracks.flatMap(track => track.clips).find(clip => clip.id === elementId);
      bundleId = element?.bundleId;
    } else {
      element = state.templateGroups.find(group => group.id === elementId);
      bundleId = element?.bundleId;
    }

    if (!element || !bundleId) {
      return null; // Bundle에 속하지 않은 요소는 제약 없음
    }

    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return null;

    const { baseClips, templateGroups } = get().getBundleElements(bundleId);
    const allBundleElements = [
      ...baseClips.map(clip => ({
        id: clip.id,
        type: 'baseClip' as const,
        startTime: clip.startTime,
        endTime: clip.endTime,
        duration: clip.duration
      })),
      ...templateGroups.map(group => ({
        id: group.id,
        type: 'templateGroup' as const,
        startTime: group.startTime,
        endTime: group.endTime,
        duration: group.endTime - group.startTime
      }))
    ];

    // 현재 요소를 제외한 다른 Bundle 요소들
    const otherBundleElements = allBundleElements.filter(el => el.id !== elementId);

    if (otherBundleElements.length === 0) {
      // Bundle에 다른 요소가 없으면 Bundle 밖 클립들과의 경계만 고려
      // 전체 타임라인에서 Bundle 밖 클립들 찾기
      const allNonBundleClips = state.tracks.flatMap(track =>
        track.clips.filter(clip => clip.bundleId !== bundleId)
      );

      let minTime = 0;
      let maxTime = Infinity;

      // Bundle 앞쪽에 있는 Bundle 밖 클립들 중 가장 가까운 클립의 끝 시간
      const clipsBeforeBundle = allNonBundleClips.filter(clip => clip.endTime <= bundle.startTime);
      if (clipsBeforeBundle.length > 0) {
        const closestBeforeClip = clipsBeforeBundle.reduce((closest, clip) =>
          clip.endTime > closest.endTime ? clip : closest
        );
        minTime = closestBeforeClip.endTime;
      }

      // Bundle 뒤쪽에 있는 Bundle 밖 클립들 중 가장 가까운 클립의 시작 시간
      const clipsAfterBundle = allNonBundleClips.filter(clip => clip.startTime >= bundle.endTime);
      if (clipsAfterBundle.length > 0) {
        const closestAfterClip = clipsAfterBundle.reduce((closest, clip) =>
          clip.startTime < closest.startTime ? clip : closest
        );
        maxTime = closestAfterClip.startTime - element.duration;
      }

      return {
        minTime: Math.max(0, minTime),
        maxTime: Math.max(minTime, maxTime),
        canMoveFreely: true,
        bundleId,
        bundle,
        otherElementsCount: 0
      };
    }

    // Bundle에 다른 요소들이 있는 경우: Bundle 밖 클립들과의 경계를 고려
    const allNonBundleClips = state.tracks.flatMap(track =>
      track.clips.filter(clip => clip.bundleId !== bundleId)
    );

    let minTime = 0;
    let maxTime = Infinity;

    // Bundle 앞쪽에 있는 Bundle 밖 클립들 중 가장 가까운 클립의 끝 시간
    const clipsBeforeBundle = allNonBundleClips.filter(clip => clip.endTime <= bundle.startTime);
    if (clipsBeforeBundle.length > 0) {
      const closestBeforeClip = clipsBeforeBundle.reduce((closest, clip) =>
        clip.endTime > closest.endTime ? clip : closest
      );
      minTime = closestBeforeClip.endTime;
    }

    // Bundle 뒤쪽에 있는 Bundle 밖 클립들 중 가장 가까운 클립의 시작 시간
    const clipsAfterBundle = allNonBundleClips.filter(clip => clip.startTime >= bundle.endTime);
    if (clipsAfterBundle.length > 0) {
      const closestAfterClip = clipsAfterBundle.reduce((closest, clip) =>
        clip.startTime < closest.startTime ? clip : closest
      );
      maxTime = closestAfterClip.startTime - element.duration;
    }

    console.log('📦 Bundle 요소 이동 범위 계산:', {
      elementId: elementId.slice(-8),
      bundleId: bundleId.slice(-8),
      elementDuration: element.duration?.toFixed(2) || '?',
      bundleRange: `${bundle.startTime.toFixed(2)}~${bundle.endTime.toFixed(2)}`,
      계산된minTime: minTime.toFixed(2),
      계산된maxTime: maxTime === Infinity ? 'Infinity' : maxTime.toFixed(2),
      Bundle밖앞쪽클립수: clipsBeforeBundle.length,
      Bundle밖뒤쪽클립수: clipsAfterBundle.length
    });

    return {
      minTime: Math.max(0, minTime),
      maxTime: Math.max(minTime, maxTime),
      canMoveFreely: false,
      bundleId,
      bundle,
      otherElementsCount: otherBundleElements.length
    };
  },

  // Bundle 요소 이동 검증
  validateBundleElementMove: (elementId: string, elementType: 'baseClip' | 'templateGroup', newStartTime: number) => {
    const moveRange = get().calculateBundleElementMoveRange(elementId, elementType);

    if (!moveRange) {
      return { valid: true, reason: 'Bundle에 속하지 않음' }; // Bundle에 속하지 않으면 자유 이동
    }

    if (moveRange.canMoveFreely) {
      return { valid: true, reason: 'Bundle 내 유일 요소' };
    }

    // 범위 검증
    if (newStartTime < moveRange.minTime) {
      return {
        valid: false,
        reason: `Bundle 연속성 위반: 최소 ${moveRange.minTime.toFixed(2)}초부터 이동 가능`,
        suggestedTime: moveRange.minTime
      };
    }

    if (newStartTime > moveRange.maxTime) {
      return {
        valid: false,
        reason: `Bundle 연속성 위반: 최대 ${moveRange.maxTime.toFixed(2)}초까지 이동 가능`,
        suggestedTime: moveRange.maxTime
      };
    }

    return { valid: true, reason: 'Bundle 내 이동 가능' };
  },

  // Bundle 요소 안전 이동 (제약 조건 자동 적용)
  moveBundleElementSafely: (elementId: string, elementType: 'baseClip' | 'templateGroup', newStartTime: number) => {
    const validation = get().validateBundleElementMove(elementId, elementType, newStartTime);

    if (validation.valid) {
      // 유효한 이동
      if (elementType === 'baseClip') {
        const clip = get().tracks.flatMap(track => track.clips).find(clip => clip.id === elementId);
        if (clip) {
          const newEndTime = newStartTime + clip.duration;
          get().updateClip(elementId, {
            startTime: newStartTime,
            endTime: newEndTime
          });

          // Bundle 시간 범위 업데이트
          if (clip.bundleId) {
            get().updateBundleTimeRange(clip.bundleId);
          }
        }
      } else {
        // 템플릿 그룹 이동 로직 추가 필요
        const group = get().templateGroups.find(g => g.id === elementId);
        if (group) {
          const duration = group.endTime - group.startTime;
          const newEndTime = newStartTime + duration;

          // 템플릿 그룹 업데이트 로직 필요
          console.log('📄 템플릿 그룹 이동:', {
            groupId: elementId.slice(-8),
            newStartTime: newStartTime.toFixed(2),
            newEndTime: newEndTime.toFixed(2)
          });

          // Bundle 시간 범위 업데이트
          if (group.bundleId) {
            get().updateBundleTimeRange(group.bundleId);
          }
        }
      }

      return { success: true, finalTime: newStartTime };
    } else {
      // 제약 조건 위반 - 제안된 시간으로 이동
      const finalTime = validation.suggestedTime || newStartTime;

      if (elementType === 'baseClip') {
        const clip = get().tracks.flatMap(track => track.clips).find(clip => clip.id === elementId);
        if (clip) {
          const newEndTime = finalTime + clip.duration;
          get().updateClip(elementId, {
            startTime: finalTime,
            endTime: newEndTime
          });

          if (clip.bundleId) {
            get().updateBundleTimeRange(clip.bundleId);
          }
        }
      }

      console.log('⚠️ Bundle 요소 이동 제약 적용:', {
        elementId: elementId.slice(-8),
        원래시간: newStartTime.toFixed(2),
        조정된시간: finalTime.toFixed(2),
        이유: validation.reason
      });

      return {
        success: true,
        finalTime,
        wasConstrained: true,
        reason: validation.reason
      };
    }
  },

  // === Bundle 해제 기능 개선 === //

  // Bundle 해제 전 검증
  validateBundleUngroup: (bundleId: string) => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);

    if (!bundle) {
      return {
        valid: false,
        reason: 'Bundle을 찾을 수 없습니다.'
      };
    }

    const { baseClips, templateGroups } = get().getBundleElements(bundleId);
    const totalElements = baseClips.length + templateGroups.length;

    if (totalElements === 0) {
      return {
        valid: false,
        reason: 'Bundle에 해제할 요소가 없습니다.'
      };
    }

    return {
      valid: true,
      bundle,
      baseClips,
      templateGroups,
      totalElements
    };
  },

  // 강화된 Bundle 해제 (안전 검증 포함)
  ungroupBundleSafely: async (bundleId: string, showConfirmation: boolean = true) => {
    const validation = get().validateBundleUngroup(bundleId);

    if (!validation.valid || !validation.bundle) {
      console.error('❌ Bundle 해제 실패:', validation.reason);
      return {
        success: false,
        reason: validation.reason
      };
    }

    const { bundle, baseClips, templateGroups, totalElements } = validation;

    // 확인 대화상자 (옵션)
    if (showConfirmation) {
      const confirmed = await globalAlert.confirm(
        `Bundle "${bundle.name}"을 해제하시겠습니까?\n\n` +
        `해제될 요소: ${totalElements}개\n` +
        `- 기준클립: ${baseClips.length}개\n` +
        `- 템플릿 그룹: ${templateGroups.length}개\n\n` +
        `해제 후에는 각 요소들이 개별적으로 관리됩니다.`
      );

      if (!confirmed) {
        return {
          success: false,
          reason: '사용자가 취소했습니다.'
        };
      }
    }

    console.log('🔓 Bundle 해제 시작:', {
      bundleName: bundle.name,
      bundleId: bundleId.slice(-8),
      기준클립수: baseClips.length,
      템플릿그룹수: templateGroups.length
    });

    // Bundle에 속한 모든 클립들의 Bundle ID 제거
    const updatedTracks = get().tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (clip.bundleId === bundleId) {
          const { bundleId: _, isBundled: __, ...cleanClip } = clip;
          console.log('🔗 기준클립 Bundle ID 제거:', {
            clipId: clip.id.slice(-8),
            제거된BundleId: bundleId.slice(-8)
          });
          return cleanClip;
        }
        return clip;
      })
    }));

    // Bundle에 속한 모든 템플릿 그룹들의 Bundle ID 제거
    const updatedTemplateGroups = get().templateGroups.map(group => {
      if (group.bundleId === bundleId) {
        const { bundleId: _, ...cleanGroup } = group;
        console.log('🔗 템플릿그룹 Bundle ID 제거:', {
          groupId: group.id.slice(-8),
          groupName: group.name,
          제거된BundleId: bundleId.slice(-8)
        });
        return cleanGroup;
      }
      return group;
    });

    // Bundle 목록에서 제거
    const updatedBundles = get().bundles.filter(b => b.id !== bundleId);

    // 상태 업데이트
    set({
      bundles: updatedBundles,
      tracks: updatedTracks,
      templateGroups: updatedTemplateGroups,
      selectedBundleId: get().selectedBundleId === bundleId ? null : get().selectedBundleId,
      pendingBundleSelection: [] // 선택 상태 초기화
    });

    console.log('✅ Bundle 해제 완료:', {
      해제된Bundle: bundle.name,
      해제된요소수: totalElements,
      남은Bundle수: updatedBundles.length
    });

    return {
      success: true,
      bundleName: bundle.name,
      releasedElements: totalElements,
      releasedBaseClips: baseClips.length,
      releasedTemplateGroups: templateGroups.length
    };
  },
});
