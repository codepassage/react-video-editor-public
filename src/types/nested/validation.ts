// === 순환 참조 방지 및 데이터 검증 시스템 === //

import { NestedBundle } from './nestedBundle';
import { NestedTemplateGroup } from './nestedTemplateGroup';
import { NestedBundleRelation, BundleHierarchyNode } from './bundleRelations';
import { BundleElement } from './bundleElement';

/**
 * 순환 참조 검증기
 */
export interface CircularReferenceValidator {
  /**
   * Bundle 관계에서 순환 참조 검사
   */
  checkBundleCircularReference(
    relations: NestedBundleRelation[],
    newRelation?: NestedBundleRelation
  ): CircularReferenceResult;
  
  /**
   * 계층 구조에서 순환 참조 검사
   */
  checkHierarchyCircularReference(
    hierarchy: BundleHierarchyNode[],
    newNode?: BundleHierarchyNode
  ): CircularReferenceResult;
  
  /**
   * Bundle 요소에서 순환 참조 검사
   */
  checkElementCircularReference(
    elements: BundleElement[],
    bundleId: string
  ): CircularReferenceResult;
  
  /**
   * 깊이 기반 순환 참조 검사
   */
  checkDepthBasedCircularReference(
    bundleId: string,
    targetParentId: string,
    relations: NestedBundleRelation[],
    maxDepth: number
  ): CircularReferenceResult;
}

/**
 * 순환 참조 검증 결과
 */
export interface CircularReferenceResult {
  hasCircularReference: boolean;
  circularPath?: string[];              // 순환 경로
  cycleLength: number;                  // 순환 길이
  affectedBundles: string[];            // 영향받는 Bundle ID들
  severity: 'low' | 'medium' | 'high' | 'critical'; // 심각도
  
  // 상세 정보
  details: {
    entryPoint: string;                 // 순환 시작점
    cycleType: 'self' | 'direct' | 'indirect' | 'complex'; // 순환 유형
    relationshipChain: Array<{
      from: string;
      to: string;
      relation: NestedBundleRelation;
    }>;
  };
  
  // 해결 방안
  resolutions: Array<{
    method: 'break_relation' | 'change_hierarchy' | 'flatten_structure';
    description: string;
    impact: 'minimal' | 'moderate' | 'significant';
    relations_to_modify: string[];
    estimated_effort: 'low' | 'medium' | 'high';
  }>;
  
  // 경고 및 권장사항
  warnings: string[];
  recommendations: string[];
}

/**
 * 데이터 무결성 검증기
 */
export interface DataIntegrityValidator {
  /**
   * 전체 중첩 구조 검증
   */
  validateNestedStructure(
    bundles: NestedBundle[],
    templateGroups: NestedTemplateGroup[],
    relations: NestedBundleRelation[]
  ): StructureValidationResult;
  
  /**
   * Bundle 개별 검증
   */
  validateBundle(bundle: NestedBundle): BundleValidationResult;
  
  /**
   * TemplateGroup 개별 검증
   */
  validateTemplateGroup(group: NestedTemplateGroup): TemplateGroupValidationResult;
  
  /**
   * 관계 일관성 검증
   */
  validateRelationshipConsistency(
    relations: NestedBundleRelation[],
    bundles: NestedBundle[]
  ): RelationshipValidationResult;
  
  /**
   * 시간 일관성 검증
   */
  validateTimeConsistency(
    bundles: NestedBundle[],
    templateGroups: NestedTemplateGroup[]
  ): TimeValidationResult;
}

/**
 * 구조 검증 결과
 */
export interface StructureValidationResult {
  isValid: boolean;
  overallScore: number;                 // 0-100 품질 점수
  
  // 카테고리별 검증 결과
  categories: {
    bundles: BundleValidationSummary;
    templateGroups: TemplateGroupValidationSummary;
    relationships: RelationshipValidationSummary;
    timeIntegrity: TimeValidationSummary;
    circularReferences: CircularReferenceValidationSummary;
  };
  
  // 전체 문제 요약
  issues: {
    critical: ValidationIssue[];
    warnings: ValidationIssue[];
    suggestions: ValidationIssue[];
  };
  
  // 성능 영향 분석
  performance: {
    estimatedRenderImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
    memoryUsageImpact: 'low' | 'medium' | 'high' | 'critical';
    recommendOptimization: boolean;
    bottlenecks: string[];
  };
  
  // 자동 수정 제안
  autoFixSuggestions: Array<{
    type: 'fix_relation' | 'optimize_structure' | 'resolve_conflict';
    description: string;
    autoApplicable: boolean;
    riskLevel: 'safe' | 'moderate' | 'risky';
    affectedElements: string[];
  }>;
}

/**
 * Bundle 검증 결과
 */
export interface BundleValidationResult {
  bundleId: string;
  isValid: boolean;
  score: number;                        // 0-100 품질 점수
  
  // 구조 검증
  structure: {
    hasValidElements: boolean;
    elementsCount: number;
    maxDepthValid: boolean;
    hierarchyValid: boolean;
    errors: string[];
  };
  
  // 시간 검증
  timing: {
    timeRangeValid: boolean;
    hasGaps: boolean;
    hasOverlaps: boolean;
    durationValid: boolean;
    errors: string[];
  };
  
  // 관계 검증
  relationships: {
    parentChildValid: boolean;
    noCircularReferences: boolean;
    relationshipConsistency: boolean;
    errors: string[];
  };
  
  // 캐시 검증
  cache: {
    cacheValid: boolean;
    needsRefresh: boolean;
    lastValidated: number;
  };
  
  warnings: string[];
  suggestions: string[];
}

/**
 * TemplateGroup 검증 결과
 */
export interface TemplateGroupValidationResult {
  groupId: string;
  isValid: boolean;
  score: number;
  
  // 기본 구조 검증
  basic: {
    clipsValid: boolean;
    templateReferenceValid: boolean;
    timeRangeValid: boolean;
    errors: string[];
  };
  
  // 중첩 구조 검증
  nesting: {
    preservedBundlesValid: boolean;
    hierarchyValid: boolean;
    mappingsValid: boolean;
    structureIntegrityValid: boolean;
    errors: string[];
  };
  
  // 호환성 검증
  compatibility: {
    schemaVersionValid: boolean;
    migrationDataValid: boolean;
    fallbackAvailable: boolean;
    errors: string[];
  };
  
  warnings: string[];
  suggestions: string[];
}

/**
 * 관계 검증 결과
 */
export interface RelationshipValidationResult {
  isValid: boolean;
  totalRelations: number;
  validRelations: number;
  
  // 관계별 검증
  relationValidations: Array<{
    relationId: string;
    isValid: boolean;
    parentExists: boolean;
    childExists: boolean;
    noCircularReference: boolean;
    depthValid: boolean;
    errors: string[];
  }>;
  
  // 일관성 검증
  consistency: {
    bidirectionalConsistency: boolean;  // 양방향 일관성
    hierarchyConsistency: boolean;      // 계층 일관성
    depthConsistency: boolean;          // 깊이 일관성
    orphanedRelations: string[];        // 고아 관계들
  };
  
  // 성능 영향
  performance: {
    complexRelations: number;
    deepNestingCount: number;
    recommendSimplification: boolean;
  };
  
  suggestions: string[];
}

/**
 * 시간 검증 결과
 */
export interface TimeValidationResult {
  isValid: boolean;
  
  // 타임라인 일관성
  timeline: {
    hasTimeConflicts: boolean;
    hasInvalidRanges: boolean;
    hasNegativeDurations: boolean;
    conflicts: Array<{
      type: 'overlap' | 'gap' | 'invalid_range';
      elements: string[];
      startTime: number;
      endTime: number;
      severity: 'minor' | 'major' | 'critical';
    }>;
  };
  
  // Bundle별 시간 검증
  bundleTimeValidation: Array<{
    bundleId: string;
    isValid: boolean;
    calculatedStart: number;
    calculatedEnd: number;
    declaredStart: number;
    declaredEnd: number;
    discrepancy: number;
  }>;
  
  suggestions: string[];
}

/**
 * 검증 이슈
 */
export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  category: 'structure' | 'timing' | 'relationship' | 'performance' | 'compatibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  description: string;
  affectedElements: string[];
  impact: string;
  
  // 해결 방안
  solutions: Array<{
    method: string;
    description: string;
    autoApplicable: boolean;
    riskLevel: 'safe' | 'moderate' | 'risky';
    estimatedTime: number;              // 예상 해결 시간 (ms)
  }>;
  
  // 메타데이터
  detectedAt: string;
  source: 'validator' | 'user_report' | 'system_check';
}

/**
 * 검증 요약 타입들
 */
export interface BundleValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  averageScore: number;
  commonIssues: string[];
}

export interface TemplateGroupValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  averageScore: number;
  commonIssues: string[];
}

export interface RelationshipValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  circularReferences: number;
  orphanedRelations: number;
}

export interface TimeValidationSummary {
  hasConflicts: boolean;
  conflictCount: number;
  gapCount: number;
  overlapCount: number;
  totalDuration: number;
}

export interface CircularReferenceValidationSummary {
  foundCircularReferences: boolean;
  circularReferenceCount: number;
  affectedBundles: number;
  maxCycleLength: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 제약 조건 검증기
 */
export interface ConstraintValidator {
  /**
   * 최대 깊이 제약 검증
   */
  validateMaxDepth(
    bundle: NestedBundle,
    maxDepth: number
  ): ConstraintValidationResult;
  
  /**
   * 최대 요소 수 제약 검증
   */
  validateMaxElements(
    bundle: NestedBundle,
    maxElements: number
  ): ConstraintValidationResult;
  
  /**
   * 성능 제약 검증
   */
  validatePerformanceConstraints(
    bundle: NestedBundle,
    constraints: {
      maxRenderTime: number;
      maxMemoryUsage: number;
    }
  ): ConstraintValidationResult;
  
  /**
   * 사용자 정의 제약 검증
   */
  validateCustomConstraints(
    bundle: NestedBundle,
    constraints: Array<{
      name: string;
      validator: (bundle: NestedBundle) => boolean;
      errorMessage: string;
    }>
  ): ConstraintValidationResult;
}

/**
 * 제약 조건 검증 결과
 */
export interface ConstraintValidationResult {
  isValid: boolean;
  violatedConstraints: Array<{
    constraint: string;
    currentValue: any;
    expectedValue: any;
    severity: 'warning' | 'error' | 'critical';
  }>;
  suggestions: string[];
}

/**
 * 자동 수정 엔진
 */
export interface AutoFixEngine {
  /**
   * 순환 참조 자동 수정
   */
  fixCircularReferences(
    relations: NestedBundleRelation[],
    options?: {
      strategy: 'break_weakest' | 'break_newest' | 'flatten_structure';
      preserveUserRelations: boolean;
    }
  ): AutoFixResult;
  
  /**
   * 시간 충돌 자동 수정
   */
  fixTimeConflicts(
    bundles: NestedBundle[],
    options?: {
      strategy: 'move_later' | 'trim_shorter' | 'split_elements';
      allowGaps: boolean;
    }
  ): AutoFixResult;
  
  /**
   * 관계 일관성 자동 수정
   */
  fixRelationshipInconsistencies(
    relations: NestedBundleRelation[],
    bundles: NestedBundle[]
  ): AutoFixResult;
  
  /**
   * 캐시 무효화 및 재구축
   */
  rebuildCaches(
    bundles: NestedBundle[],
    templateGroups: NestedTemplateGroup[]
  ): AutoFixResult;
}

/**
 * 자동 수정 결과
 */
export interface AutoFixResult {
  success: boolean;
  fixesApplied: number;
  
  changes: Array<{
    type: 'relation_removed' | 'relation_modified' | 'bundle_moved' | 'cache_rebuilt';
    target: string;
    oldValue: any;
    newValue: any;
    reason: string;
  }>;
  
  remainingIssues: ValidationIssue[];
  performance: {
    fixTime: number;
    memoryUsed: number;
  };
  
  warnings: string[];
  recommendations: string[];
}
