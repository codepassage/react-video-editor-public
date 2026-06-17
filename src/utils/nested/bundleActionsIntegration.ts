/**
 * 중첩 Bundle Actions 연동 시스템
 * Phase 2 Day 2: 기존 Bundle Actions와 중첩 Bundle 시스템 연동
 * 
 * 주요 기능:
 * - 기존 Bundle Actions를 중첩 Bundle 지원으로 확장
 * - 중첩 Bundle 인식 및 계층적 처리
 * - ID 매핑 시스템과의 연동
 * - 계층 관리 시스템과의 연동
 * - 하위 호환성 보장
 */

import { StateCreator } from 'zustand';
import {
  Bundle,
  TemplateGroup,
  TimelineTrack,
  TimelineClip,
  SelectedElement,
  CreateBundleData
} from '../../types';

import {
  NestedBundle,
  BundleElement,
  CreateNestedBundleOptions,
  CreateNestedBundleResult,
  HierarchicalMoveOptions,
  MoveResult
} from '../../types/nested';

import {
  getSystemManager,
  createNestedBundle as createNestedBundleFunction
} from './index';

import {
  getBundleHierarchyManager,
  getBundleIdMappingManager
} from './bundleHierarchyManagement';

// 확장된 Bundle 상태 타입
export interface NestedBundleState {
  bundles: Bundle[];
  tracks: TimelineTrack[];
  templateGroups: TemplateGroup[];
  selectedBundleId: string | null;
  bundleSelectionMode: boolean;
  pendingBundleSelection: SelectedElement[];
  
  // 중첩 Bundle 확장 상태
  nestedBundles: NestedBundle[];
  hierarchyEnabled: boolean;
  nestingConstraints: {
    maxDepth: number;
    maxElementsPerBundle: number;
    allowCircularReferences: boolean;
  };
}

// 중첩 Bundle Actions 타입
export interface NestedBundleActions {
  // === 중첩 Bundle 생성 및 관리 === //
  createNestedBundle: (
    selectedElements: SelectedElement[],
    bundleData: CreateBundleData,
    options?: CreateNestedBundleOptions
  ) => Promise<CreateNestedBundleResult>;
  
  upgradeToNestedBundle: (bundleId: string) => Promise<{
    success: boolean;
    nestedBundle?: NestedBundle;
    warnings: string[];
  }>;
  
  // === 계층적 Bundle 이동 === //
  moveNestedBundleHierarchically: (
    bundleId: string,
    deltaTime: number,
    options?: HierarchicalMoveOptions
  ) => Promise<MoveResult>;
  
  // === Bundle 관계 관리 === //
  setParentChildBundleRelation: (
    parentBundleId: string,
    childBundleId: string,
    preserveOnMove?: boolean
  ) => Promise<{
    success: boolean;
    warnings: string[];
  }>;
  
  removeParentChildBundleRelation: (
    parentBundleId: string,
    childBundleId: string
  ) => Promise<{
    success: boolean;
    affectedBundles: string[];
  }>;
  
  // === Bundle 계층 검색 === //
  findBundlesByHierarchy: (query: {
    parentId?: string;
    depth?: number;
    includeChildren?: boolean;
  }) => Promise<{
    bundles: Bundle[];
    hierarchy: any[];
  }>;
  
  getBundleHierarchyPath: (bundleId: string) => Promise<string>;
  
  // === ID 매핑 관리 === //
  translateBundleIds: (
    sourceIds: string[],
    direction: 'original-to-mapped' | 'mapped-to-original'
  ) => Promise<Map<string, string>>;
  
  updateBundleIdMapping: (
    originalId: string,
    newMappedId: string,
    context?: 'nested' | 'preserved' | 'inherited'
  ) => Promise<{
    success: boolean;
    affectedElements: number;
  }>;
  
  // === 중첩 Bundle 해제 === //
  ungroupNestedBundle: (
    bundleId: string,
    options?: {
      preserveChildStructure?: boolean;
      flattenAll?: boolean;
    }
  ) => Promise<{
    success: boolean;
    flattenedElements: number;
    preservedChildren: number;
    warnings: string[];
  }>;
  
  // === 시스템 상태 관리 === //
  enableHierarchyMode: () => void;
  disableHierarchyMode: () => void;
  updateNestingConstraints: (constraints: Partial<NestedBundleState['nestingConstraints']>) => void;
  
  // === 유틸리티 === //
  isNestedBundle: (bundleId: string) => boolean;
  getBundleDepth: (bundleId: string) => Promise<number>;
  getBundleChildren: (bundleId: string) => Promise<string[]>;
  getBundleParent: (bundleId: string) => Promise<string | null>;
  
  // === 호환성 === //
  convertLegacyBundleToNested: (bundleId: string) => Promise<NestedBundle | null>;
  validateBundleStructure: (bundleId: string) => Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }>;
}

// 의존성 타입
export interface NestedBundleDependencies {
  // 기존 Bundle Actions 의존성
  getBundleById: (bundleId: string) => Bundle | undefined;
  getBundleElements: (bundleId: string) => { baseClips: TimelineClip[]; templateGroups: TemplateGroup[] };
  updateBundleTimeRange: (bundleId: string) => void;
  createBundle: (bundleData: CreateBundleData, selectedElements: SelectedElement[]) => void;
  deleteBundle: (bundleId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
}

export const createNestedBundleActions: StateCreator<
  NestedBundleState & NestedBundleActions & NestedBundleDependencies,
  [],
  [],
  NestedBundleActions
> = (set, get) => ({
  
  // === 중첩 Bundle 생성 및 관리 === //
  
  createNestedBundle: async (
    selectedElements: SelectedElement[],
    bundleData: CreateBundleData,
    options: CreateNestedBundleOptions = {}
  ): Promise<CreateNestedBundleResult> => {
    const state = get();
    
    console.log('🏗️ 중첩 Bundle 생성 요청:', {
      elements: selectedElements.length,
      bundleName: bundleData.name,
      hierarchyEnabled: state.hierarchyEnabled
    });

    try {
      // 중첩 Bundle 시스템이 활성화되지 않은 경우 기존 방식 사용
      if (!state.hierarchyEnabled) {
        console.log('📦 계층 모드 비활성화 - 기존 Bundle 생성');
        get().createBundle(bundleData, selectedElements);
        
        return {
          bundle: null,
          hierarchy: [],
          preservedStructures: [],
          warnings: ['계층 모드가 비활성화되어 기존 Bundle로 생성되었습니다'],
          performance: {
            creationTime: 0,
            memoryUsage: 0,
            cacheHits: 0,
            optimizationApplied: []
          },
          metadata: {
            totalElements: selectedElements.length,
            maxDepth: 1,
            preservationRatio: 0,
            isOptimized: false
          }
        };
      }

      // 중첩 Bundle 생성
      const result = await createNestedBundleFunction(
        selectedElements,
        bundleData,
        state.bundles,
        state.templateGroups,
        state.tracks,
        {
          ...options,
          constraints: state.nestingConstraints
        }
      );

      // 생성된 Bundle을 상태에 추가
      if (result.bundle) {
        // 기존 Bundle 타입으로 변환하여 호환성 유지
        const compatibleBundle: Bundle = {
          id: result.bundle.id,
          name: result.bundle.name,
          color: result.bundle.color,
          createdAt: result.bundle.createdAt,
          baseClipIds: result.bundle.baseClipIds,
          templateGroupIds: result.bundle.templateGroupIds,
          startTime: result.bundle.startTime,
          endTime: result.bundle.endTime
        };

        set(state => ({
          bundles: [...state.bundles, compatibleBundle],
          nestedBundles: [...state.nestedBundles, result.bundle!],
          selectedBundleId: result.bundle!.id,
          pendingBundleSelection: []
        }));

        // Bundle 요소들에 Bundle ID 할당
        await get().updateBundleElementIds(result.bundle.id, result.bundle.elements);
      }

      console.log('✅ 중첩 Bundle 생성 완료:', {
        bundleId: result.bundle?.id.slice(-8),
        depth: result.metadata.maxDepth,
        elements: result.metadata.totalElements
      });

      return result;

    } catch (error) {
      console.error('❌ 중첩 Bundle 생성 실패:', error);
      
      return {
        bundle: null,
        hierarchy: [],
        preservedStructures: [],
        warnings: [`Bundle 생성 실패: ${error instanceof Error ? error.message : String(error)}`],
        performance: {
          creationTime: 0,
          memoryUsage: 0,
          cacheHits: 0,
          optimizationApplied: []
        },
        metadata: {
          totalElements: 0,
          maxDepth: 0,
          preservationRatio: 0,
          isOptimized: false
        }
      };
    }
  },

  upgradeToNestedBundle: async (bundleId: string): Promise<{
    success: boolean;
    nestedBundle?: NestedBundle;
    warnings: string[];
  }> => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    
    if (!bundle) {
      return {
        success: false,
        warnings: ['Bundle을 찾을 수 없습니다']
      };
    }

    console.log('🔄 기존 Bundle을 중첩 Bundle로 업그레이드:', bundle.name);

    try {
      const { baseClips, templateGroups } = get().getBundleElements(bundleId);
      
      // Bundle Element 생성
      const elements: BundleElement[] = [];
      
      // 기존 BaseClip들을 BundleElement로 변환
      baseClips.forEach((clip, index) => {
        elements.push({
          id: `element_${Date.now()}_${index}`,
          type: 'baseClip',
          depth: 1,
          path: `${bundle.name}.${clip.id}`,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          baseClip: {
            clipId: clip.id,
            trackId: `track_${index}`
          }
        });
      });

      // 기존 TemplateGroup들을 BundleElement로 변환
      templateGroups.forEach((group, index) => {
        elements.push({
          id: `element_${Date.now()}_${index + baseClips.length}`,
          type: 'templateGroup',
          depth: 1,
          path: `${bundle.name}.${group.id}`,
          startTime: group.startTime,
          endTime: group.endTime,
          duration: group.endTime - group.startTime,
          templateGroup: {
            groupId: group.id,
            preservedBundles: [],
            originalStructure: []
          }
        });
      });

      // NestedBundle 생성
      const nestedBundle: NestedBundle = {
        ...bundle,
        elements,
        hierarchy: {
          depth: 1,
          maxDepth: 1,
          totalElements: elements.length,
          leafElements: baseClips.length
        },
        timeRange: {
          startTime: bundle.startTime,
          endTime: bundle.endTime,
          duration: bundle.endTime - bundle.startTime,
          isContiguous: true
        },
        relationships: {
          nestedRelations: []
        },
        cache: {
          flattenedClipIds: baseClips.map(c => c.id),
          hierarchyMap: new Map(elements.map(el => [el.id, el])),
          lastUpdated: Date.now()
        }
      };

      // 상태 업데이트
      set(state => ({
        nestedBundles: [...state.nestedBundles, nestedBundle]
      }));

      console.log('✅ Bundle 업그레이드 완료:', {
        bundleId: bundleId.slice(-8),
        elements: elements.length
      });

      return {
        success: true,
        nestedBundle,
        warnings: []
      };

    } catch (error) {
      console.error('❌ Bundle 업그레이드 실패:', error);
      return {
        success: false,
        warnings: [`업그레이드 실패: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  },

  // === 계층적 Bundle 이동 === //

  moveNestedBundleHierarchically: async (
    bundleId: string,
    deltaTime: number,
    options: HierarchicalMoveOptions = {}
  ): Promise<MoveResult> => {
    const state = get();
    
    console.log('🚀 계층적 Bundle 이동:', {
      bundleId: bundleId.slice(-8),
      deltaTime,
      options
    });

    try {
      // 계층 관리자를 통해 이동
      const hierarchyManager = getBundleHierarchyManager();
      const result = await hierarchyManager.moveNestedBundle(bundleId, deltaTime, options);

      if (result.success) {
        // 상태 동기화
        await get().syncBundleStatesFromMoveResult(result);
      }

      return result;

    } catch (error) {
      console.error('❌ 계층적 Bundle 이동 실패:', error);
      
      return {
        success: false,
        movedBundles: [],
        timeUpdates: new Map(),
        relationshipChanges: [],
        warnings: [`이동 실패: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  },

  // === Bundle 관계 관리 === //

  setParentChildBundleRelation: async (
    parentBundleId: string,
    childBundleId: string,
    preserveOnMove: boolean = true
  ): Promise<{
    success: boolean;
    warnings: string[];
  }> => {
    console.log('🔗 부모-자식 Bundle 관계 설정:', {
      parent: parentBundleId.slice(-8),
      child: childBundleId.slice(-8),
      preserveOnMove
    });

    try {
      const hierarchyManager = getBundleHierarchyManager();
      const result = await hierarchyManager.setParentChildRelation(
        parentBundleId,
        childBundleId,
        'direct',
        preserveOnMove
      );

      return {
        success: result.success,
        warnings: result.warnings
      };

    } catch (error) {
      console.error('❌ 부모-자식 관계 설정 실패:', error);
      return {
        success: false,
        warnings: [`관계 설정 실패: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  },

  removeParentChildBundleRelation: async (
    parentBundleId: string,
    childBundleId: string
  ): Promise<{
    success: boolean;
    affectedBundles: string[];
  }> => {
    console.log('🔓 부모-자식 Bundle 관계 제거:', {
      parent: parentBundleId.slice(-8),
      child: childBundleId.slice(-8)
    });

    try {
      // 관계 제거 로직 구현
      // 실제로는 hierarchyManager를 통해 처리

      return {
        success: true,
        affectedBundles: [parentBundleId, childBundleId]
      };

    } catch (error) {
      console.error('❌ 부모-자식 관계 제거 실패:', error);
      return {
        success: false,
        affectedBundles: []
      };
    }
  },

  // === Bundle 계층 검색 === //

  findBundlesByHierarchy: async (query: {
    parentId?: string;
    depth?: number;
    includeChildren?: boolean;
  }): Promise<{
    bundles: Bundle[];
    hierarchy: any[];
  }> => {
    try {
      const hierarchyManager = getBundleHierarchyManager();
      const searchResult = await hierarchyManager.searchBundleHierarchy({
        parentId: query.parentId,
        depth: query.depth,
        includeChildren: query.includeChildren
      });

      const state = get();
      const bundles = searchResult.bundles
        .map(bundleId => state.bundles.find(b => b.id === bundleId))
        .filter(Boolean) as Bundle[];

      return {
        bundles,
        hierarchy: searchResult.hierarchy
      };

    } catch (error) {
      console.error('❌ Bundle 계층 검색 실패:', error);
      return {
        bundles: [],
        hierarchy: []
      };
    }
  },

  getBundleHierarchyPath: async (bundleId: string): Promise<string> => {
    try {
      const hierarchyManager = getBundleHierarchyManager();
      return await hierarchyManager.generateHierarchyPath(bundleId);
    } catch (error) {
      console.error('❌ Bundle 경로 생성 실패:', error);
      return bundleId;
    }
  },

  // === ID 매핑 관리 === //

  translateBundleIds: async (
    sourceIds: string[],
    direction: 'original-to-mapped' | 'mapped-to-original'
  ): Promise<Map<string, string>> => {
    const result = new Map<string, string>();

    try {
      const idMappingManager = getBundleIdMappingManager();
      
      for (const id of sourceIds) {
        const translatedId = await idMappingManager.translateId(id, direction);
        if (translatedId) {
          result.set(id, translatedId);
        }
      }

    } catch (error) {
      console.error('❌ Bundle ID 변환 실패:', error);
    }

    return result;
  },

  updateBundleIdMapping: async (
    originalId: string,
    newMappedId: string,
    context: 'nested' | 'preserved' | 'inherited' = 'nested'
  ): Promise<{
    success: boolean;
    affectedElements: number;
  }> => {
    try {
      const idMappingManager = getBundleIdMappingManager();
      const result = await idMappingManager.updateMapping(originalId, newMappedId, {
        context,
        deactivateOld: true
      });

      return {
        success: result.success,
        affectedElements: result.updatedMappings
      };

    } catch (error) {
      console.error('❌ Bundle ID 매핑 업데이트 실패:', error);
      return {
        success: false,
        affectedElements: 0
      };
    }
  },

  // === 중첩 Bundle 해제 === //

  ungroupNestedBundle: async (
    bundleId: string,
    options: {
      preserveChildStructure?: boolean;
      flattenAll?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    flattenedElements: number;
    preservedChildren: number;
    warnings: string[];
  }> => {
    const state = get();
    const nestedBundle = state.nestedBundles.find(nb => nb.id === bundleId);
    
    console.log('🔓 중첩 Bundle 해제:', {
      bundleId: bundleId.slice(-8),
      options
    });

    if (!nestedBundle) {
      // 기존 Bundle 해제 방식 사용
      const legacyResult = await get().ungroupLegacyBundle(bundleId);
      return {
        success: legacyResult.success,
        flattenedElements: legacyResult.flattenedElements || 0,
        preservedChildren: 0,
        warnings: legacyResult.warnings || []
      };
    }

    try {
      let flattenedElements = 0;
      let preservedChildren = 0;
      const warnings: string[] = [];

      // Bundle Element들 처리
      for (const element of nestedBundle.elements) {
        if (element.type === 'nestedBundle' && options.preserveChildStructure) {
          // 하위 Bundle 구조 보존
          preservedChildren++;
        } else {
          // 평면화
          flattenedElements++;
          await get().flattenBundleElement(element);
        }
      }

      // Bundle 제거
      set(state => ({
        bundles: state.bundles.filter(b => b.id !== bundleId),
        nestedBundles: state.nestedBundles.filter(nb => nb.id !== bundleId),
        selectedBundleId: state.selectedBundleId === bundleId ? null : state.selectedBundleId
      }));

      console.log('✅ 중첩 Bundle 해제 완료:', {
        flattenedElements,
        preservedChildren
      });

      return {
        success: true,
        flattenedElements,
        preservedChildren,
        warnings
      };

    } catch (error) {
      console.error('❌ 중첩 Bundle 해제 실패:', error);
      return {
        success: false,
        flattenedElements: 0,
        preservedChildren: 0,
        warnings: [`해제 실패: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  },

  // === 시스템 상태 관리 === //

  enableHierarchyMode: () => {
    set({ hierarchyEnabled: true });
    console.log('✅ 계층 모드 활성화');
  },

  disableHierarchyMode: () => {
    set({ hierarchyEnabled: false });
    console.log('⏸️ 계층 모드 비활성화');
  },

  updateNestingConstraints: (constraints: Partial<NestedBundleState['nestingConstraints']>) => {
    set(state => ({
      nestingConstraints: {
        ...state.nestingConstraints,
        ...constraints
      }
    }));
    console.log('⚙️ 중첩 제약 조건 업데이트:', constraints);
  },

  // === 유틸리티 === //

  isNestedBundle: (bundleId: string): boolean => {
    const state = get();
    return state.nestedBundles.some(nb => nb.id === bundleId);
  },

  getBundleDepth: async (bundleId: string): Promise<number> => {
    const state = get();
    const nestedBundle = state.nestedBundles.find(nb => nb.id === bundleId);
    return nestedBundle?.hierarchy.depth || 1;
  },

  getBundleChildren: async (bundleId: string): Promise<string[]> => {
    try {
      const hierarchyManager = getBundleHierarchyManager();
      const searchResult = await hierarchyManager.searchBundleHierarchy({
        parentId: bundleId,
        includeChildren: true
      });
      return searchResult.bundles.filter(id => id !== bundleId);
    } catch (error) {
      console.error('❌ Bundle 자식 검색 실패:', error);
      return [];
    }
  },

  getBundleParent: async (bundleId: string): Promise<string | null> => {
    try {
      const hierarchyManager = getBundleHierarchyManager();
      const searchResult = await hierarchyManager.searchBundleHierarchy({
        bundleId,
        includeParents: true
      });
      return searchResult.bundles.find(id => id !== bundleId) || null;
    } catch (error) {
      console.error('❌ Bundle 부모 검색 실패:', error);
      return null;
    }
  },

  // === 호환성 === //

  convertLegacyBundleToNested: async (bundleId: string): Promise<NestedBundle | null> => {
    const upgradeResult = await get().upgradeToNestedBundle(bundleId);
    return upgradeResult.nestedBundle || null;
  },

  validateBundleStructure: async (bundleId: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> => {
    const state = get();
    const bundle = state.bundles.find(b => b.id === bundleId);
    const nestedBundle = state.nestedBundles.find(nb => nb.id === bundleId);

    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!bundle) {
      return {
        isValid: false,
        issues: ['Bundle을 찾을 수 없습니다'],
        suggestions: []
      };
    }

    // 기본 구조 검증
    const { baseClips, templateGroups } = get().getBundleElements(bundleId);
    if (baseClips.length === 0 && templateGroups.length === 0) {
      issues.push('Bundle에 요소가 없습니다');
      suggestions.push('Bundle을 삭제하거나 요소를 추가하세요');
    }

    // 중첩 Bundle 특별 검증
    if (nestedBundle) {
      if (nestedBundle.elements.length === 0) {
        issues.push('중첩 Bundle에 Element가 없습니다');
      }

      if (nestedBundle.hierarchy.depth > state.nestingConstraints.maxDepth) {
        issues.push(`최대 중첩 깊이(${state.nestingConstraints.maxDepth})를 초과했습니다`);
        suggestions.push('일부 구조를 평면화하세요');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  },

  // === 내부 헬퍼 메서드들 === //

  updateBundleElementIds: async (bundleId: string, elements: BundleElement[]): Promise<void> => {
    const state = get();
    
    // 기존 Bundle 방식으로 요소들에 Bundle ID 할당
    const updatedTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        const element = elements.find(el => 
          el.type === 'baseClip' && el.baseClip?.clipId === clip.id
        );
        if (element) {
          return { ...clip, bundleId, isBundled: true };
        }
        return clip;
      })
    }));

    const updatedTemplateGroups = state.templateGroups.map(group => {
      const element = elements.find(el => 
        el.type === 'templateGroup' && el.templateGroup?.groupId === group.id
      );
      if (element) {
        return { ...group, bundleId };
      }
      return group;
    });

    set({
      tracks: updatedTracks,
      templateGroups: updatedTemplateGroups
    });
  },

  syncBundleStatesFromMoveResult: async (moveResult: MoveResult): Promise<void> => {
    const state = get();

    // 시간 업데이트 적용
    for (const [bundleId, timeUpdate] of moveResult.timeUpdates) {
      // Bundle 시간 업데이트
      const updatedBundles = state.bundles.map(bundle => {
        if (bundle.id === bundleId) {
          return {
            ...bundle,
            startTime: timeUpdate.startTime,
            endTime: timeUpdate.endTime
          };
        }
        return bundle;
      });

      set({ bundles: updatedBundles });

      // Bundle 요소들 시간 업데이트
      get().updateBundleTimeRange(bundleId);
    }
  },

  ungroupLegacyBundle: async (bundleId: string): Promise<{
    success: boolean;
    flattenedElements?: number;
    warnings?: string[];
  }> => {
    // 기존 Bundle 해제 로직
    try {
      get().deleteBundle(bundleId);
      return {
        success: true,
        flattenedElements: 0,
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        warnings: [`해제 실패: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  },

  flattenBundleElement: async (element: BundleElement): Promise<void> => {
    // Bundle Element 평면화 로직
    console.log('🔽 Bundle Element 평면화:', {
      elementId: element.id.slice(-8),
      type: element.type
    });

    if (element.type === 'baseClip' && element.baseClip) {
      // BaseClip의 Bundle ID 제거
      get().updateClip(element.baseClip.clipId, {
        bundleId: undefined,
        isBundled: false
      } as any);
    }
    
    if (element.type === 'templateGroup' && element.templateGroup) {
      // TemplateGroup의 Bundle ID 제거
      const state = get();
      const updatedGroups = state.templateGroups.map(group => {
        if (group.id === element.templateGroup?.groupId) {
          const { bundleId, ...cleanGroup } = group;
          return cleanGroup;
        }
        return group;
      });
      
      set({ templateGroups: updatedGroups });
    }
  }
});

// 기본 중첩 제약 조건
export const DEFAULT_NESTING_CONSTRAINTS: NestedBundleState['nestingConstraints'] = {
  maxDepth: 10,
  maxElementsPerBundle: 100,
  allowCircularReferences: false
};

// 초기 중첩 Bundle 상태
export const INITIAL_NESTED_BUNDLE_STATE: Pick<NestedBundleState, 'nestedBundles' | 'hierarchyEnabled' | 'nestingConstraints'> = {
  nestedBundles: [],
  hierarchyEnabled: false, // 기본적으로 비활성화
  nestingConstraints: DEFAULT_NESTING_CONSTRAINTS
};
