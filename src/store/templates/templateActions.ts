/**
 * 🛡️ templateActions.ts - 템플릿 그룹 상태 관리 액션
 * 
 * 템플릿 시스템의 핵심 기능인 템플릿 그룹 관리와 템플릿 삽입 작업을 담당하는 Zustand 액션입니다.
 * Bundle 보존 기능과 확장된 앵커 시스템을 통해 복잡한 템플릿 구조를 안전하게 관리합니다.
 * 
 * 주요 기능:
 * - 타임헤드 위치에 템플릿 삽입 (push/overlay 모드)
 * - 특정 시간에 템플릿 삽입 및 배치
 * - 템플릿 그룹 생성, 이동, 삭제, 해제
 * - Bundle 보존 및 재생성 기능
 * - 확장된 앵커 포인트 관리 (클립-그룹, 클립-번들 연결)
 * - 그룹 보호 설정 및 이동 제약 관리
 * 
 * Bundle 통합 기능:
 * - 템플릿 삽입 시 원본 Bundle 정보 보존
 * - Bundle 매핑을 통한 ID 추적 및 재생성
 * - 그룹과 Bundle의 관계 유지 및 복원
 * 
 * 성능 최적화:
 * - 동적 import를 통한 코드 분할
 * - 비동기 템플릿 로딩으로 UI 블록킹 방지
 * - 경계 제한 로직으로 0초 이하 이동 방지
 * 
 * 사용 패턴:
 * - 템플릿 저장소에서 템플릿 불러와 삽입
 * - 템플릿 그룹 단위로 클립들을 관리
 * - 복잡한 프로젝트에서 재사용 가능한 구조 생성
 * 
 * 특별 고려사항:
 * - Bundle과 TemplateGroup의 이중 관리 체계
 * - 확장된 앵커를 통한 정교한 클립 간 연결
 * - 템플릿 삽입 후 즉시 Bundle 재생성 처리
 */

import { StateCreator } from 'zustand';
import { TemplateGroup, TimelineTrack, TimelineClip, Bundle } from '../../types';
import { ExtendedAnchorPoint } from '../../types/baseClips';

// 템플릿 관련 상태 타입
export interface TemplateState {
  templateGroups: TemplateGroup[];
  selectedGroupId: string | null;
  tracks: TimelineTrack[];
  currentTime: number;
  selectedClips: string[];
  isPropertiesPanelOpen: boolean;

}

// 템플릿 관련 액션 타입
export interface TemplateActions {
  insertTemplate: (templateId: string, insertMode: 'push' | 'overlay', groupOptions?: { isProtected: boolean; groupName: string; preserveBundles?: boolean }) => Promise<void>;
  insertTemplateAtTime: (templateId: string, insertTime: number, insertMode: 'push' | 'overlay', groupOptions?: { isProtected: boolean; groupName: string; preserveBundles?: boolean }) => Promise<void>;
  createTemplateGroup: (groupData: TemplateGroup) => void;
  moveTemplateGroup: (groupId: string, deltaTime: number) => void;
  deleteTemplateGroup: (groupId: string) => void;
  ungroupTemplate: (groupId: string) => void;
  selectTemplateGroup: (groupId: string | null) => void;
  updateTemplateGroupName: (groupId: string, newName: string) => void;
  getGroupById: (groupId: string) => TemplateGroup | undefined;
  getClipsByGroupId: (groupId: string) => TimelineClip[];
  
  // 확장된 앵커 관리 함수들
  setClipTemplateGroupAnchor: (
    clipId: string,
    templateGroupId: string,
    anchorType: 'start' | 'end',
    anchorPoint: 'start' | 'end',
    offset?: number
  ) => void;
  setClipBundleAnchor: (
    clipId: string,
    bundleId: string,
    anchorType: 'start' | 'end',
    anchorPoint: 'start' | 'end',
    offset?: number
  ) => void;
  removeClipAnchor: (clipId: string, anchorType: 'start' | 'end') => void;
}

// selectedClip 의존성
export interface TemplateDependencies {
  selectedClip: TimelineClip | null;
}

export const createTemplateActions: StateCreator<
  TemplateState & TemplateActions & TemplateDependencies,
  [],
  [],
  TemplateActions
> = (set, get) => ({
  // 🎯 템플릿 관리 (새로운 기능)
  insertTemplate: async (templateId: string, insertMode: 'push' | 'overlay', groupOptions?: { isProtected: boolean; groupName: string; preserveBundles?: boolean }) => {
    const state = get();
    const currentTime = state.currentTime;

    try {
      console.log('🎆 타임헤드 위치에 템플릿 삽입:', {
        templateId: templateId.slice(-8),
        currentTime: `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`,
        insertMode,
        preserveBundles: groupOptions?.preserveBundles
      });

      const { loadTemplateWithOptions } = await import('../../utils/templateUtils');

      const result = await loadTemplateWithOptions(
        templateId,
        state.tracks,
        {
          mode: 'insert',
          insertTime: currentTime,
          insertStrategy: insertMode,
          groupOptions
        }
      );

      // 상태 업데이트
      const updates: any = {
        tracks: result.tracks,
        selectedClips: [],
        selectedClip: null,
        isPropertiesPanelOpen: false
      };

      // 그룹 생성된 경우 추가
      if (result.templateGroup) {
        updates.templateGroups = [...state.templateGroups, result.templateGroup];
        
        // 🌟 Bundle 보존 옵션이 활성화되었고 preservedBundles가 있는 경우
        if (groupOptions?.preserveBundles && result.templateGroup.originalBundles && result.templateGroup.bundleMappings) {
          console.log('📦 Bundle 보존 옵션 활성화됨 - Bundle 재생성 시작');
          
          // Bundle 재생성 로직 동적 import
          const { regenerateBundlesForGroup } = await import('../../utils/bundleMappingUtils');
          
          const preservedBundles = regenerateBundlesForGroup(
            result.templateGroup.originalBundles,
            result.templateGroup.bundleMappings,
            result.templateGroup.id
          );
          
          if (preservedBundles.length > 0) {

            // ✅ BundleState의 함수를 직접 호출
            const currentState = get() as any;
            
            preservedBundles.forEach(bundle => {
              // bundleActions의 createBundle 함수 직접 호출
              if (currentState.createBundle) {
                const bundleElements = [
                  ...bundle.baseClipIds.map(clipId => {
                    const clip = result.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
                    return {
                      id: clipId,
                      type: 'baseClip' as const,
                      name: clip?.text || `클립 ${clipId.slice(-4)}`,
                      startTime: clip?.startTime || 0,
                      endTime: clip?.endTime || 1,
                      trackIndex: 0
                    };
                  }),
                  ...bundle.templateGroupIds.map(groupId => ({
                    id: groupId,
                    type: 'templateGroup' as const,
                    name: `그룹 ${groupId.slice(-4)}`,
                    startTime: 0,
                    endTime: 1,
                    trackIndex: 0
                  }))
                ];
          
                currentState.createBundle(
                  { name: bundle.name, color: bundle.color },
                  bundleElements
                );
              }
            });
          
          }
        }
      }

      set(updates);

      console.log('✅ 템플릿 삽입 완료:', {
        resultTracks: result.tracks.length,
        totalClips: result.tracks.reduce((sum, track) => sum + track.clips.length, 0),
        templateDuration: `${Math.floor(result.templateDuration / 60)}:${(result.templateDuration % 60).toString().padStart(2, '0')}`,
        bundlesAdded: updates.bundles ? updates.bundles.length - (state.bundles?.length || 0) : 0
      });

      setTimeout(() => {
        const currentState = get() as any;
        console.log('🔍 템플릿 삽입 후 Bundle 상태:', {
          bundles: currentState.bundles,
          bundleCount: currentState.bundles?.length || 0,
          bundleNames: currentState.bundles?.map((b: any) => b.name) || []
        });
      }, 100);

    } catch (error) {
      console.error('❌ 템플릿 삽입 실패:', error);
      throw error;
    }
  },

  insertTemplateAtTime: async (templateId: string, insertTime: number, insertMode: 'push' | 'overlay', groupOptions?: { isProtected: boolean; groupName: string; preserveBundles?: boolean }) => {
    const state = get();

    try {
      console.log('🎆 특정 시간에 템플릿 삽입:', {
        templateId: templateId.slice(-8),
        insertTime: `${Math.floor(insertTime / 60)}:${(insertTime % 60).toString().padStart(2, '0')}`,
        insertMode,
        preserveBundles: groupOptions?.preserveBundles
      });

      const { loadTemplateWithOptions } = await import('../../utils/templateUtils');

      const result = await loadTemplateWithOptions(
        templateId,
        state.tracks,
        {
          mode: 'insert',
          insertTime,
          insertStrategy: insertMode,
          groupOptions
        }
      );

      // 상태 업데이트
      const updates: any = {
        tracks: result.tracks,
        selectedClips: [],
        selectedClip: null,
        isPropertiesPanelOpen: false
      };

      // 그룹 생성된 경우 추가
      if (result.templateGroup) {
        updates.templateGroups = [...state.templateGroups, result.templateGroup];
        
        // 🌟 Bundle 보존 옵션이 활성화되었고 preservedBundles가 있는 경우
        if (groupOptions?.preserveBundles && result.templateGroup.originalBundles && result.templateGroup.bundleMappings) {
          console.log('📦 Bundle 보존 옵션 활성화됨 - Bundle 재생성 시작');
          
          // Bundle 재생성 로직 동적 import
          const { regenerateBundlesForGroup } = await import('../../utils/bundleMappingUtils');
          
          const preservedBundles = regenerateBundlesForGroup(
            result.templateGroup.originalBundles,
            result.templateGroup.bundleMappings,
            result.templateGroup.id
          );
          
          if (preservedBundles.length > 0) {


            // ✅ BundleState의 함수를 직접 호출
            const currentState = get() as any;
            
            preservedBundles.forEach(bundle => {
              // bundleActions의 createBundle 함수 직접 호출
              if (currentState.createBundle) {
                const bundleElements = [
                  ...bundle.baseClipIds.map(clipId => {
                    const clip = result.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
                    return {
                      id: clipId,
                      type: 'baseClip' as const,
                      name: clip?.text || `클립 ${clipId.slice(-4)}`,
                      startTime: clip?.startTime || 0,
                      endTime: clip?.endTime || 1,
                      trackIndex: 0
                    };
                  }),
                  ...bundle.templateGroupIds.map(groupId => ({
                    id: groupId,
                    type: 'templateGroup' as const,
                    name: `그룹 ${groupId.slice(-4)}`,
                    startTime: 0,
                    endTime: 1,
                    trackIndex: 0
                  }))
                ];
          
                currentState.createBundle(
                  { name: bundle.name, color: bundle.color },
                  bundleElements
                );
              }
            });

          }
        }
      }

      set(updates);

      console.log('✅ 템플릿 삽입 완료:', {
        resultTracks: result.tracks.length,
        totalClips: result.tracks.reduce((sum, track) => sum + track.clips.length, 0),
        templateDuration: `${Math.floor(result.templateDuration / 60)}:${(result.templateDuration % 60).toString().padStart(2, '0')}`,
        bundlesAdded: updates.bundles ? updates.bundles.length - (state.bundles?.length || 0) : 0
      });

    } catch (error) {
      console.error('❌ 템플릿 삽입 실패:', error);
      throw error;
    }
  },

  // 템플릿 그룹 관리 액션들
  createTemplateGroup: (groupData: TemplateGroup) => {
    const state = get();
    set({ templateGroups: [...state.templateGroups, groupData] });
  },

  moveTemplateGroup: (groupId: string, deltaTime: number) => {
    const state = get();
    const group = state.templateGroups.find(g => g.id === groupId);
    if (!group) return;

    // 🔧 경계 제한: 0초 이하로 이동 방지
    const newGroupStartTime = group.startTime + deltaTime;
    if (newGroupStartTime < 0) {
      // 그룹이 0초 이하로 가려고 하면 0초에 딱 맞추도록 제한
      deltaTime = -group.startTime;
      console.log('🛡️ 그룹 경계 제한 적용:', {
        groupId: groupId.slice(-8),
        원래deltaTime: (group.startTime + (newGroupStartTime + group.startTime)).toFixed(2),
        제한된deltaTime: deltaTime.toFixed(2),
        새시작시간: (group.startTime + deltaTime).toFixed(2)
      });
    }

    // 그룹에 속한 모든 클립 이동
    const newTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (group.clipIds.includes(clip.id)) {
          const newStartTime = clip.startTime + deltaTime;
          const newEndTime = clip.endTime + deltaTime;

          // 🔧 추가 안전장치: 개별 클립도 0초 이하로 가지 않도록 보장
          if (newStartTime < 0) {
            console.warn('⚠️ 클립이 0초 이하로 가려고 함:', {
              clipId: clip.id.slice(-8),
              원래시작: clip.startTime.toFixed(2),
              새시작: newStartTime.toFixed(2),
              deltaTime: deltaTime.toFixed(2)
            });
            // 0초로 제한
            return {
              ...clip,
              startTime: 0,
              endTime: clip.duration // 기존 길이 유지
            };
          }

          return {
            ...clip,
            startTime: newStartTime,
            endTime: newEndTime
          };
        }
        return clip;
      })
    }));

    // 그룹 시간 업데이트 (경계 제한 적용)
    const updatedGroup = {
      ...group,
      startTime: Math.max(0, group.startTime + deltaTime), // 0초 이하로 가지 않도록 보장
      endTime: Math.max(group.duration || 1, group.endTime + deltaTime) // 최소 길이 보장
    };

    const updatedGroups = state.templateGroups.map(g =>
      g.id === groupId ? updatedGroup : g
    );

    set({
      tracks: newTracks,
      templateGroups: updatedGroups
    });

    console.log('✅ 그룹 이동 완료 (경계 제한 적용):', {
      groupId: groupId.slice(-8),
      deltaTime: deltaTime.toFixed(2),
      newStartTime: updatedGroup.startTime.toFixed(2),
      newEndTime: updatedGroup.endTime.toFixed(2)
    });
  },

  deleteTemplateGroup: (groupId: string) => {
    const state = get();
    const group = state.templateGroups.find(g => g.id === groupId);
    if (!group) return;

    // 그룹에 속한 모든 클립 삭제
    const newTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.filter(clip => !group.clipIds.includes(clip.id))
    }));

    // 그룹 삭제
    const updatedGroups = state.templateGroups.filter(g => g.id !== groupId);

    set({
      tracks: newTracks,
      templateGroups: updatedGroups,
      selectedGroupId: state.selectedGroupId === groupId ? null : state.selectedGroupId
    });
  },

  ungroupTemplate: (groupId: string) => {
    const state = get();
    const group = state.templateGroups.find(g => g.id === groupId);
    if (!group) return;

    // 클립에서 그룹 정보 제거
    const newTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (group.clipIds.includes(clip.id)) {
          const { templateGroupId, isGrouped, ...restClip } = clip;
          return restClip;
        }
        return clip;
      })
    }));

    // 그룹 삭제
    const updatedGroups = state.templateGroups.filter(g => g.id !== groupId);

    set({
      tracks: newTracks,
      templateGroups: updatedGroups,
      selectedGroupId: state.selectedGroupId === groupId ? null : state.selectedGroupId
    });
  },

  selectTemplateGroup: (groupId: string | null) => {
    set({ selectedGroupId: groupId });
  },

  updateTemplateGroupName: (groupId: string, newName: string) => {
    const state = get();
    const updatedGroups = state.templateGroups.map(group =>
      group.id === groupId ? { ...group, name: newName } : group
    );
    set({ templateGroups: updatedGroups });
  },

  getGroupById: (groupId: string) => {
    const state = get();
    return state.templateGroups.find(g => g.id === groupId);
  },

  getClipsByGroupId: (groupId: string) => {
    const state = get();
    const group = state.templateGroups.find(g => g.id === groupId);
    if (!group) return [];

    return state.tracks
      .flatMap(track => track.clips)
      .filter(clip => group.clipIds.includes(clip.id));
  },

  // 확장된 앵커 관리 함수들 구현
  setClipTemplateGroupAnchor: (
    clipId: string,
    templateGroupId: string,
    anchorType: 'start' | 'end',
    anchorPoint: 'start' | 'end',
    offset: number = 0
  ) => {
    const state = get();
    
    // 템플릿 그룹 존재 확인
    const templateGroup = state.templateGroups.find(g => g.id === templateGroupId);
    if (!templateGroup) {
      console.error('템플릿 그룹을 찾을 수 없습니다:', templateGroupId);
      return;
    }

    // 확장된 앵커 포인트 생성
    const anchor: ExtendedAnchorPoint = {
      templateGroupId,
      anchorPoint,
      offset
    };

    // 트랙과 클립 업데이트
    const updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (clip.id === clipId) {
          const updatedClip = { ...clip };
          
          if (!updatedClip.regularClipProperties) {
            updatedClip.regularClipProperties = {};
          }

          if (anchorType === 'start') {
            updatedClip.regularClipProperties.startAnchorExtended = anchor;
          } else {
            updatedClip.regularClipProperties.endAnchorExtended = anchor;
          }

          return updatedClip;
        }
        return clip;
      })
    }));

    set({ tracks: updatedTracks });
  },

  setClipBundleAnchor: (
    clipId: string,
    bundleId: string,
    anchorType: 'start' | 'end',
    anchorPoint: 'start' | 'end',
    offset: number = 0
  ) => {
    const state = get();

    // 확장된 앵커 포인트 생성
    const anchor: ExtendedAnchorPoint = {
      bundleId,
      anchorPoint,
      offset
    };

    // 트랙과 클립 업데이트
    const updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (clip.id === clipId) {
          const updatedClip = { ...clip };
          
          if (!updatedClip.regularClipProperties) {
            updatedClip.regularClipProperties = {};
          }

          if (anchorType === 'start') {
            updatedClip.regularClipProperties.startAnchorExtended = anchor;
          } else {
            updatedClip.regularClipProperties.endAnchorExtended = anchor;
          }

          return updatedClip;
        }
        return clip;
      })
    }));

    set({ tracks: updatedTracks });
  },

  removeClipAnchor: (clipId: string, anchorType: 'start' | 'end') => {
    const state = get();

    const updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (clip.id === clipId && clip.regularClipProperties) {
          const updatedClip = { ...clip };
          
          if (anchorType === 'start') {
            delete updatedClip.regularClipProperties.startAnchor;
            delete updatedClip.regularClipProperties.startAnchorExtended;
          } else {
            delete updatedClip.regularClipProperties.endAnchor;
            delete updatedClip.regularClipProperties.endAnchorExtended;
          }

          return updatedClip;
        }
        return clip;
      })
    }));

    set({ tracks: updatedTracks });
  },
});
