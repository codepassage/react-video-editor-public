// === 중첩 Bundle 지원 TemplateGroup 타입 시스템 === //

import { BundleHierarchyNode, NestedBundleRelation } from './bundleRelations';
import { NestedBundle } from './nestedBundle';

// 기존 TemplateGroup 관련 타입들 import
import type { TemplateGroupMetadata, BundleMapping } from '../templates';

/**
 * 확장된 TemplateGroup - 중첩 Bundle 완전 지원
 * 기존 TemplateGroup을 확장하여 중첩 구조를 보존하고 관리
 */
export interface NestedTemplateGroup {
  // === 기본 TemplateGroup 정보 (기존과 호환) === //
  id: string;
  name: string;
  templateId: string;
  clipIds: string[];
  startTime: number;
  endTime: number;
  isProtected: boolean;
  color?: string;
  createdAt: number;
  bundleId?: string;               // 소속 Bundle ID (기존 호환)
  duration?: number;
  
  // === 기존 필드들 (하위 호환성) === //
  originalBundles?: any[];         // 기존 타입 유지 (호환성)
  bundleMappings?: BundleMapping[];
  metadata?: TemplateGroupMetadata;
  
  // === 🌟 새로운 중첩 Bundle 지원 시스템 === //
  nestedStructure: {
    // 보존된 Bundle 정보
    preservedBundles: NestedBundle[];           // 원본 템플릿의 모든 Bundle들
    bundleHierarchy: BundleHierarchyNode[];     // 완전한 계층 구조 트리
    flattenedBundleIds: string[];               // 빠른 검색용 평면 Bundle ID 목록
    preservationMap: Map<string, string>;       // 원본ID → 새ID 매핑
    
    // 중첩 관계 정보
    nestedRelations: NestedBundleRelation[];    // 그룹 내부의 Bundle 관계들
    rootBundleIds: string[];                    // 최상위 Bundle ID들
    maxNestingDepth: number;                    // 최대 중첩 깊이
    
    // 구조 보존 정보
    structureIntegrity: {
      isComplete: boolean;                      // 구조가 완전히 보존되었는지
      missingElements: string[];                // 누락된 요소들
      modifiedElements: string[];               // 수정된 요소들
      brokenRelations: NestedBundleRelation[];  // 깨진 관계들
    };
  };
  
  // === 원본 정보 확장 === //
  originalTemplate: {
    templateId: string;
    bundleStructure: BundleHierarchyNode[];     // 원본 Bundle 계층 구조
    importMode: 'preserve' | 'flatten' | 'hybrid'; // 가져오기 모드
    importedAt: string;
    preservationSettings: {
      preserveBundleStructure: boolean;
      preserveRelationships: boolean;
      flattenDepth?: number;                    // 특정 깊이까지만 중첩 보존
      selectivePreservation?: string[];         // 선택적으로 보존할 Bundle ID들
    };
    
    // 원본 데이터 백업
    originalData: {
      bundles: any[];                           // 원본 Bundle 데이터 전체
      bundleRelations: NestedBundleRelation[];  // 원본 관계 정보
      clipBundleMappings: { [clipId: string]: string }; // 클립-번들 매핑
    };
  };
  
  // === 메타데이터 확장 === //
  enhancedMetadata: TemplateGroupMetadata & {
    // 중첩 구조 정보
    nestingInfo: {
      maxNestingDepth: number;
      totalBundleCount: number;
      hasCircularReference: boolean;
      preservationQuality: 'excellent' | 'good' | 'partial' | 'poor';
      
      // 구조 복잡도
      complexity: {
        score: number;                          // 0-100 복잡도 점수
        factors: {
          nestingDepth: number;
          bundleCount: number;
          relationCount: number;
          timeOverlaps: number;
        };
        level: 'simple' | 'moderate' | 'complex' | 'very_complex';
      };
    };
    
    // 성능 정보
    performance: {
      loadTime: number;                         // 로딩 시간 (ms)
      renderTime: number;                       // 렌더링 시간 (ms)
      memoryUsage: number;                      // 메모리 사용량 (bytes)
      optimizationRecommendations: string[];   // 최적화 권장사항
    };
    
    // 호환성 정보
    compatibility: {
      schemaVersion: string;
      migratedFrom?: string;                    // 마이그레이션 소스 버전
      compatibilityIssues: string[];           // 호환성 문제들
      fallbackBehavior?: 'flatten' | 'skip' | 'preserve_partial';
    };
  };
  
  // === 실시간 상태 정보 === //
  state: {
    isLoaded: boolean;                          // 완전히 로드되었는지
    isValid: boolean;                           // 구조가 유효한지
    hasErrors: boolean;                         // 에러가 있는지
    lastValidated: number;                      // 마지막 검증 시간
    
    // 동적 상태
    activeNestingLevel: number;                 // 현재 활성 중첩 레벨
    visibleBundleIds: string[];                 // 현재 표시되는 Bundle들
    collapsedNodes: string[];                   // 접힌 노드들
    
    // 편집 상태
    isEditing: boolean;
    editingTarget?: {
      type: 'bundle' | 'relation' | 'structure';
      targetId: string;
    };
  };
  
  // === 캐시 및 성능 최적화 === //
  cache?: {
    // 구조 캐시
    hierarchyTree: any;                         // 계층 구조 트리 (렌더링용)
    flattenedView: {
      allClipIds: string[];
      allBundleIds: string[];
      timelineSegments: Array<{
        start: number;
        end: number;
        elements: string[];
      }>;
    };
    
    // 관계 캐시
    relationshipIndex: {
      parentToChildren: Map<string, string[]>;
      childToParent: Map<string, string>;
      depthMap: Map<string, number>;
    };
    
    // 성능 캐시
    lastUpdateTime: number;
    invalidationTriggers: string[];             // 캐시 무효화 트리거들
    isValid: boolean;
  };
}

/**
 * TemplateGroup 로딩 옵션 (확장됨)
 */
export interface LoadTemplateAsNestedGroupOptions {
  // 기본 그룹 옵션
  isProtected: boolean;
  groupName: string;
  
  // 중첩 구조 처리 옵션
  nestingMode: 'preserve' | 'flatten' | 'hybrid';
  maxDepth?: number;                            // 보존할 최대 깊이
  selectivePreservation?: {
    bundleIds: string[];                        // 특정 Bundle만 중첩 보존
    preserveRelations: boolean;                 // 관계도 보존할지
  };
  
  // 충돌 해결 옵션
  conflictResolution: {
    timeConflicts: 'auto_resolve' | 'manual' | 'skip';
    idConflicts: 'regenerate' | 'prefix' | 'manual';
    nameConflicts: 'auto_rename' | 'keep_original' | 'manual';
  };
  
  // 성능 옵션
  performance: {
    enableLazyLoading: boolean;
    preloadDepth: number;                       // 미리 로드할 깊이
    cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
  };
  
  // 호환성 옵션
  compatibility: {
    fallbackToFlat: boolean;                    // 실패 시 평면화로 폴백
    ignoreUnknownElements: boolean;             // 알 수 없는 요소 무시
    validateOnLoad: boolean;                    // 로드 시 검증 수행
  };
}

/**
 * TemplateGroup 로딩 결과 (확장됨)
 */
export interface LoadNestedTemplateGroupResult {
  // 결과 데이터
  tracks: any[];                                // TimelineTrack[] (순환 참조 방지)
  templateGroup: NestedTemplateGroup;
  preservedBundles: NestedBundle[];
  hierarchy: BundleHierarchyNode[];
  
  // 처리 결과
  processing: {
    mode: 'preserve' | 'flatten' | 'hybrid';
    preservedElements: number;
    flattenedElements: number;
    totalProcessingTime: number;
  };
  
  // 충돌 해결 결과
  conflicts: {
    resolved: Array<{
      type: 'time' | 'id' | 'name' | 'structure';
      original: any;
      resolved: any;
      method: string;
    }>;
    unresolved: Array<{
      type: 'time' | 'id' | 'name' | 'structure';
      issue: string;
      suggestions: string[];
    }>;
  };
  
  // 성능 정보
  performance: {
    loadTime: number;
    memoryUsage: number;
    cacheHitRate: number;
    optimizationApplied: string[];
  };
  
  // 검증 결과
  validation: {
    structureValid: boolean;
    relationshipsValid: boolean;
    timelineValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  warnings: string[];
  errors: string[];
}

/**
 * TemplateGroup 분석 결과 (확장됨)
 */
export interface NestedTemplateGroupAnalysis {
  groupId: string;
  
  // 기본 정보
  basic: {
    clipCount: number;
    tracks: string[];
    duration: number;
    isValid: boolean;
  };
  
  // 중첩 구조 분석
  nesting: {
    bundleCount: number;
    maxDepth: number;
    relationCount: number;
    hasCircularReferences: boolean;
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  };
  
  // 시간 분석
  timeline: {
    hasGaps: boolean;
    hasOverlaps: boolean;
    isContiguous: boolean;
    utilizationRate: number;                    // 시간 활용률 (0-1)
  };
  
  // 성능 분석
  performance: {
    estimatedRenderTime: number;
    memoryFootprint: number;
    recommendedOptimizations: string[];
    bottlenecks: string[];
  };
  
  // 권장사항
  recommendations: {
    structureOptimizations: string[];
    performanceImprovements: string[];
    compatibilityNotes: string[];
  };
}

/**
 * 중첩 TemplateGroup 유틸리티 함수들의 타입
 */
export interface NestedTemplateGroupUtils {
  loadTemplateAsNestedGroup(
    templateId: string,
    insertTime: number,
    existingTracks: any[],  // TimelineTrack[]
    options: LoadTemplateAsNestedGroupOptions
  ): Promise<LoadNestedTemplateGroupResult>;
  
  analyzeNestedGroup(group: NestedTemplateGroup): NestedTemplateGroupAnalysis;
  
  validateNestedStructure(group: NestedTemplateGroup): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };
  
  optimizeNestedGroup(group: NestedTemplateGroup): {
    optimizedGroup: NestedTemplateGroup;
    optimizations: string[];
    performanceGain: number;
  };
  
  flattenNestedGroup(
    group: NestedTemplateGroup,
    options?: {
      maxDepth?: number;
      preserveProtectedBundles?: boolean;
    }
  ): {
    flatGroup: any; // TemplateGroup
    lostStructure: any[];
    preservedElements: string[];
  };
  
  migrateFromLegacyGroup(
    legacyGroup: any, // TemplateGroup
    options?: {
      preserveAsNested?: boolean;
      autoDetectStructure?: boolean;
    }
  ): NestedTemplateGroup;
}

/**
 * TemplateGroup 변환 유틸리티
 */
export interface TemplateGroupConverter {
  // 기존 → 중첩 변환
  convertToNested(
    legacyGroup: any, // TemplateGroup
    preservationOptions?: {
      detectBundleStructure: boolean;
      preserveRelationships: boolean;
      maxDepthToPreserve: number;
    }
  ): NestedTemplateGroup;
  
  // 중첩 → 기존 변환 (폴백용)
  convertToLegacy(
    nestedGroup: NestedTemplateGroup,
    flattenOptions?: {
      preserveBundleIds: boolean;
      createFlatBundles: boolean;
    }
  ): any; // TemplateGroup
  
  // 검증 및 테스트
  validateConversion(
    original: any,
    converted: NestedTemplateGroup
  ): {
    dataIntegrity: boolean;
    structurePreserved: boolean;
    functionalEquivalence: boolean;
    losses: string[];
    gains: string[];
  };
}
