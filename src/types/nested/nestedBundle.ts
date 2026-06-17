// === 계층적 Bundle 구조 타입 시스템 === //

import { BundleElement } from './bundleElement';
import { NestedBundleRelation, BundleHierarchyNode, NestingConstraints } from './bundleRelations';

// 기존 Bundle 관련 타입들 import (확장을 위해)
import type { BundleRelationships } from '../bundles';

/**
 * 확장된 계층적 Bundle 구조
 * 기존 Bundle을 확장하여 중첩 구조를 완전히 지원
 */
export interface NestedBundle {
  // === 기본 Bundle 정보 (기존 Bundle과 호환) === //
  id: string;
  name: string;
  color: string;
  createdAt: number;
  
  // === 기존 Bundle 필드들 (하위 호환성) === //
  baseClipIds: string[];           // 직접 포함된 BaseClip ID들
  templateGroupIds: string[];      // 직접 포함된 TemplateGroup ID들
  startTime: number;               // 계산된 시작 시간
  endTime: number;                 // 계산된 종료 시간
  relationships?: BundleRelationships; // 기존 관계 정보 (하위 호환)
  
  // === 🌟 새로운 계층적 요소 시스템 === //
  elements: BundleElement[];       // 모든 하위 요소들 (중첩 포함)
  
  // === 계층 메타데이터 === //
  hierarchy: {
    depth: number;                 // 현재 Bundle의 중첩 깊이
    maxDepth: number;              // 내부 요소들의 최대 깊이
    totalElements: number;         // 모든 레벨의 총 요소 수
    leafElements: number;          // 말단(BaseClip) 요소 수
    hasNestedBundles: boolean;     // 중첩된 Bundle이 있는지
    isNested: boolean;             // 이 Bundle이 다른 Bundle에 중첩되어 있는지
  };
  
  // === 시간 정보 (계산됨) === //
  timeRange: {
    startTime: number;
    endTime: number;
    duration: number;
    isContiguous: boolean;         // 연속적인 시간대인지
    gaps: Array<{                  // 시간 간격 정보
      start: number;
      end: number;
      duration: number;
    }>;
  };
  
  // === 관계 정보 === //
  nestedRelations: {
    parent?: string;               // 부모 Bundle ID
    children: string[];            // 직접 자식 Bundle ID들
    allDescendants: string[];      // 모든 하위 Bundle ID들 (재귀적)
    relations: NestedBundleRelation[]; // 이 Bundle과 관련된 모든 관계
  };
  
  // === 제약 조건 === //
  constraints?: NestingConstraints;
  
  // === 성능 최적화 === //
  cache?: {
    flattenedClipIds: string[];    // 모든 하위 BaseClip ID들 (성능용)
    hierarchyMap: Map<string, BundleElement>; // 빠른 검색을 위한 맵
    timelineSegments: TimelineSegment[]; // 타임라인 세그먼트 정보
    lastUpdated: number;           // 마지막 업데이트 시간
    isValid: boolean;              // 캐시 유효성
  };
  
  // === 메타데이터 === //
  metadata: {
    version: string;               // Bundle 스키마 버전
    migrationInfo?: {              // 기존 Bundle에서 마이그레이션된 경우
      originalBundleId: string;
      migratedAt: string;
      preservedData: any;
    };
    
    // 생성 정보
    creationContext: {
      source: 'user_created' | 'template_import' | 'bundle_merge' | 'auto_generated';
      sourceDetails?: {
        templateId?: string;
        mergedBundleIds?: string[];
        generationRules?: string[];
      };
    };
    
    // 편집 히스토리
    editHistory?: Array<{
      timestamp: string;
      action: 'created' | 'element_added' | 'element_removed' | 'nested' | 'moved' | 'renamed';
      details: any;
    }>;
  };
}

/**
 * 타임라인 세그먼트 정보
 * Bundle 내부의 시간 구간 정보
 */
export interface TimelineSegment {
  startTime: number;
  endTime: number;
  duration: number;
  elementIds: string[];            // 이 세그먼트에 포함된 요소 ID들
  depth: number;                   // 세그먼트의 중첩 깊이
  type: 'continuous' | 'gap' | 'overlap'; // 세그먼트 유형
}

/**
 * Bundle 생성 데이터 (확장됨)
 */
export interface CreateNestedBundleData {
  // 기본 정보
  name: string;
  color: string;
  
  // 중첩 옵션
  nestingOptions?: {
    maxDepth?: number;
    preserveOriginalStructure?: boolean;
    flattenOnConflict?: boolean;
    autoResolveTimeConflicts?: boolean;
  };
  
  // 제약 조건
  constraints?: Partial<NestingConstraints>;
  
  // 메타데이터
  metadata?: {
    source?: 'user_created' | 'template_import' | 'bundle_merge';
    description?: string;
    tags?: string[];
  };
}

/**
 * Bundle 검증 결과 (확장됨)
 */
export interface NestedBundleValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  
  // 구조 검증
  structure: {
    hasCircularReference: boolean;
    exceedsMaxDepth: boolean;
    exceedsMaxElements: boolean;
    hasInvalidElements: boolean;
  };
  
  // 시간 검증
  timeline: {
    hasTimeConflicts: boolean;
    hasGaps: boolean;
    isContiguous: boolean;
    totalDuration: number;
  };
  
  // 관계 검증
  relationships: {
    hasBrokenReferences: boolean;
    hasInconsistentRelations: boolean;
    orphanedElements: string[];
  };
  
  // 성능 분석
  performance: {
    estimatedRenderTime: number;
    memoryConcerns: boolean;
    recommendOptimization: boolean;
  };
}

/**
 * Bundle 선택된 요소 (확장됨)
 */
export interface SelectedNestedElement {
  id: string;
  type: 'baseClip' | 'templateGroup' | 'nestedBundle';
  name: string;
  startTime: number;
  endTime: number;
  trackIndex: number;
  
  // 중첩 정보
  nesting: {
    depth: number;
    path: string;
    parentBundleId?: string;
    canBeNested: boolean;
  };
  
  // 관계 정보
  relationships: {
    connectedElements: string[];
    dependencies: string[];
    conflicts: string[];
  };
}

/**
 * Bundle 이동 결과
 */
export interface BundleMoveResult {
  success: boolean;
  movedBundleId: string;
  deltaTime: number;
  
  // 영향받은 요소들
  affected: {
    childBundles: string[];
    templateGroups: string[];
    baseClips: string[];
  };
  
  // 시간 충돌 해결
  timeConflicts: {
    resolved: Array<{
      elementId: string;
      oldTime: number;
      newTime: number;
      resolution: 'moved' | 'trimmed' | 'split';
    }>;
    unresolved: Array<{
      elementId: string;
      conflictWith: string;
      suggestion: string;
    }>;
  };
  
  // 관계 업데이트
  relationshipUpdates: {
    maintained: NestedBundleRelation[];
    broken: NestedBundleRelation[];
    created: NestedBundleRelation[];
  };
  
  warnings: string[];
  errors: string[];
}

/**
 * 중첩 Bundle 유틸리티 함수들의 타입
 */
export interface NestedBundleUtils {
  createBundle(
    selectedElements: SelectedNestedElement[],
    bundleData: CreateNestedBundleData,
    existingBundles: NestedBundle[]
  ): Promise<{
    bundle: NestedBundle;
    hierarchy: BundleHierarchyNode[];
    warnings: string[];
    performance: {
      creationTime: number;
      memoryUsage: number;
    };
  }>;
  
  validateBundle(bundle: NestedBundle): NestedBundleValidation;
  
  moveBundle(
    bundleId: string,
    deltaTime: number,
    options: {
      preserveHierarchy?: boolean;
      moveChildren?: boolean;
      respectConstraints?: boolean;
      autoResolveConflicts?: boolean;
    }
  ): BundleMoveResult;
  
  flattenBundle(
    bundle: NestedBundle,
    options?: {
      preserveGroups?: boolean;
      maxDepth?: number;
    }
  ): {
    baseClipIds: string[];
    templateGroupIds: string[];
    preservedStructure: any[];
  };
  
  mergeBundle(
    targetBundle: NestedBundle,
    sourceBundles: NestedBundle[],
    options?: {
      preserveStructure?: boolean;
      resolveConflicts?: boolean;
    }
  ): NestedBundle;
  
  optimizeBundle(bundle: NestedBundle): {
    optimizedBundle: NestedBundle;
    improvements: string[];
    performanceGain: number;
  };
}

/**
 * Bundle 트리 조작 유틸리티
 */
export interface BundleTreeUtils {
  getAncestors(bundleId: string, bundles: NestedBundle[]): NestedBundle[];
  getDescendants(bundleId: string, bundles: NestedBundle[]): NestedBundle[];
  getSiblings(bundleId: string, bundles: NestedBundle[]): NestedBundle[];
  findCommonAncestor(bundleIds: string[], bundles: NestedBundle[]): NestedBundle | null;
  
  traverseTree(
    rootBundle: NestedBundle,
    callback: (bundle: NestedBundle, depth: number) => void | 'stop',
    options?: {
      depthFirst?: boolean;
      maxDepth?: number;
      includeRoot?: boolean;
    }
  ): void;
  
  searchTree(
    rootBundle: NestedBundle,
    predicate: (bundle: NestedBundle) => boolean,
    options?: {
      returnFirst?: boolean;
      maxDepth?: number;
    }
  ): NestedBundle[];
}
