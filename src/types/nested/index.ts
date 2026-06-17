// === 중첩 Bundle 시스템 타입 통합 인덱스 === //

/**
 * 중첩 Bundle 구조 개선을 위한 새로운 타입 시스템
 * 
 * 이 모듈은 Bundle > TemplateGroup > Bundle 과 같은 
 * 복잡한 중첩 구조를 완전히 지원하는 타입 시스템을 제공합니다.
 * 
 * @version 1.0.0
 * @since 2025-06-22
 */

// === 핵심 타입 exports === //

// Bundle Element 시스템
export type {
  BundleElement,
  BundleElementValidation,
  CreateBundleElementOptions,
  BundleElementStats,
  BundleElementUtils
} from './bundleElement';

// Bundle 관계 시스템
export type {
  NestedBundleRelation,
  BundleHierarchyNode,
  CircularReferenceCheck,
  NestingConstraints,
  NestingAnalysis,
  CreateRelationOptions,
  RelationUpdateResult,
  NestedRelationUtils
} from './bundleRelations';

// 중첩 Bundle 시스템
export type {
  NestedBundle,
  TimelineSegment,
  CreateNestedBundleData,
  NestedBundleValidation,
  SelectedNestedElement,
  BundleMoveResult,
  NestedBundleUtils,
  BundleTreeUtils
} from './nestedBundle';

// 중첩 TemplateGroup 시스템
export type {
  NestedTemplateGroup,
  LoadTemplateAsNestedGroupOptions,
  LoadNestedTemplateGroupResult,
  NestedTemplateGroupAnalysis,
  NestedTemplateGroupUtils,
  TemplateGroupConverter
} from './nestedTemplateGroup';

// 검증 및 순환 참조 방지 시스템
export type {
  CircularReferenceValidator,
  CircularReferenceResult,
  DataIntegrityValidator,
  StructureValidationResult,
  BundleValidationResult,
  TemplateGroupValidationResult,
  RelationshipValidationResult,
  TimeValidationResult,
  ValidationIssue,
  BundleValidationSummary,
  TemplateGroupValidationSummary,
  RelationshipValidationSummary,
  TimeValidationSummary,
  CircularReferenceValidationSummary,
  ConstraintValidator,
  ConstraintValidationResult,
  AutoFixEngine,
  AutoFixResult
} from './validation';

// === 유틸리티 타입들 === //

/**
 * 중첩 구조 지원 여부를 나타내는 유니온 타입
 */
export type NestingSupportLevel = 'none' | 'basic' | 'full' | 'advanced';

/**
 * 마이그레이션 정보
 */
export interface MigrationInfo {
  fromVersion: string;
  toVersion: string;
  migratedAt: string;
  migrationMode: 'auto' | 'manual' | 'assisted';
  preservedFeatures: string[];
  lostFeatures: string[];
  addedFeatures: string[];
}

/**
 * 성능 메트릭스
 */
export interface PerformanceMetrics {
  operationType: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsed: number;
  elementsProcessed: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * 중첩 Bundle 시스템 설정
 */
export interface NestedBundleSystemConfig {
  // 기본 제약 조건
  defaultConstraints: NestingConstraints;
  
  // 성능 설정
  performance: {
    enableCaching: boolean;
    cacheTimeout: number;              // ms
    lazyLoadingThreshold: number;      // 요소 수
    maxConcurrentOperations: number;
  };
  
  // 검증 설정
  validation: {
    enableRealTimeValidation: boolean;
    validationDepth: 'shallow' | 'deep' | 'comprehensive';
    autoFixMode: 'off' | 'safe' | 'aggressive';
  };
  
  // 호환성 설정
  compatibility: {
    supportLegacyBundles: boolean;
    autoMigrationEnabled: boolean;
    fallbackMode: 'flatten' | 'preserve_partial' | 'error';
  };
  
  // 디버깅 설정
  debug: {
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    trackPerformance: boolean;
  };
}

/**
 * 중첩 시스템 상태
 */
export interface NestedSystemState {
  isInitialized: boolean;
  supportLevel: NestingSupportLevel;
  activeConfigurations: NestedBundleSystemConfig;
  
  // 런타임 통계
  statistics: {
    totalNestedBundles: number;
    maxActiveDepth: number;
    averageDepth: number;
    operationsPerformed: number;
    errors: number;
    warnings: number;
  };
  
  // 성능 상태
  performance: {
    averageOperationTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    lastOptimization: string;
  };
}

/**
 * 버전 호환성 정보
 */
export interface VersionCompatibility {
  currentVersion: string;
  supportedVersions: string[];
  deprecatedFeatures: Array<{
    feature: string;
    deprecatedIn: string;
    removedIn?: string;
    replacement?: string;
  }>;
  newFeatures: Array<{
    feature: string;
    addedIn: string;
    description: string;
    breaking: boolean;
  }>;
}

// === 타입 가드 함수들 === //

/**
 * NestedBundle 타입 가드
 */
export function isNestedBundle(obj: any): obj is NestedBundle {
  return obj && 
         typeof obj.id === 'string' &&
         Array.isArray(obj.elements) &&
         typeof obj.hierarchy === 'object' &&
         typeof obj.timeRange === 'object' &&
         typeof obj.nestedRelations === 'object';
}

/**
 * NestedTemplateGroup 타입 가드
 */
export function isNestedTemplateGroup(obj: any): obj is NestedTemplateGroup {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.templateId === 'string' &&
         typeof obj.nestedStructure === 'object' &&
         typeof obj.originalTemplate === 'object';
}

/**
 * BundleElement 타입 가드
 */
export function isBundleElement(obj: any): obj is BundleElement {
  return obj &&
         typeof obj.id === 'string' &&
         ['baseClip', 'templateGroup', 'nestedBundle'].includes(obj.type) &&
         typeof obj.depth === 'number' &&
         typeof obj.path === 'string';
}

/**
 * NestedBundleRelation 타입 가드
 */
export function isNestedBundleRelation(obj: any): obj is NestedBundleRelation {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.parentBundleId === 'string' &&
         typeof obj.childBundleId === 'string' &&
         ['direct', 'inherited', 'preserved'].includes(obj.relationship);
}

// === 상수 정의 === //

/**
 * 기본 중첩 제약 조건
 */
export const DEFAULT_NESTING_CONSTRAINTS: NestingConstraints = {
  maxDepth: 10,
  maxChildrenPerBundle: 50,
  preventCircularReference: true,
  allowSelfReference: false,
  maxTotalElements: 1000,
  performance: {
    maxRenderDepth: 5,
    lazyLoadThreshold: 100,
    cacheInvalidationDelay: 1000
  }
};

/**
 * 지원되는 Bundle Element 타입들
 */
export const BUNDLE_ELEMENT_TYPES = ['baseClip', 'templateGroup', 'nestedBundle'] as const;

/**
 * Bundle 관계 타입들
 */
export const BUNDLE_RELATION_TYPES = ['direct', 'inherited', 'preserved'] as const;

/**
 * 중첩 모드들
 */
export const NESTING_MODES = ['preserve', 'flatten', 'hybrid'] as const;

/**
 * 검증 심각도 레벨들
 */
export const VALIDATION_SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

// === 버전 정보 === //

/**
 * 중첩 Bundle 시스템 버전 정보
 */
export const NESTED_BUNDLE_SYSTEM_VERSION = {
  version: '1.0.0',
  releaseDate: '2025-06-22',
  schemaVersion: '1.0',
  compatibleWith: ['bundle-v2.0.0', 'template-v2.0.0'],
  features: [
    'unlimited_nesting_depth',
    'circular_reference_prevention',
    'real_time_validation',
    'auto_conflict_resolution',
    'performance_optimization',
    'backward_compatibility'
  ]
} as const;

// === 유틸리티 타입 exports === //
export type {
  MigrationInfo,
  PerformanceMetrics,
  NestedBundleSystemConfig,
  NestedSystemState,
  VersionCompatibility
};

/**
 * 🎉 중첩 Bundle 타입 시스템 v1.0.0 준비 완료!
 * 
 * 이 타입 시스템은 다음과 같은 복잡한 중첩 구조를 완전히 지원합니다:
 * 
 * Bundle "마스터 시퀀스"
 * ├── TemplateGroup "인트로 섹션" 
 * │   ├── Bundle "타이틀 애니메이션"
 * │   │   ├── BaseClip "배경음악"
 * │   │   └── BaseClip "타이틀 사운드"
 * │   └── Bundle "자막 시퀀스"
 * │       ├── BaseClip "자막1"
 * │       └── BaseClip "자막2"
 * ├── BaseClip "전환 효과"
 * └── TemplateGroup "아웃트로 섹션"
 *     └── Bundle "엔딩 크레딧"
 *         ├── BaseClip "엔딩음악"
 *         └── BaseClip "크레딧 텍스트"
 * 
 * 주요 특징:
 * ✅ 무제한 중첩 깊이 (제약 조건으로 제어 가능)
 * ✅ 순환 참조 완전 방지
 * ✅ 실시간 데이터 검증
 * ✅ 자동 충돌 해결
 * ✅ 성능 최적화
 * ✅ 기존 시스템과 완벽 호환
 */
