/**
 * @fileoverview 중첩 Bundle 구조 지원 통합 프로젝트 데이터 V3
 * @description 계층적 Bundle 중첩 구조를 완전히 지원하는 새로운 저장 포맷
 * @version 3.0.0
 * @created 2025-06-22
 */

import { TimelineTrack, ProjectSettings } from '../../types';
import { Bundle } from '../../types/bundles';
import { TemplateGroup } from '../../types/templates';
import {
  NestedBundle,
  NestedTemplateGroup,
  BundleElement,
  BundleHierarchyNode,
  NestedBundleRelation,
  ValidationResult,
  MigrationInfo
} from '../../types/nested';

// ===== V3 저장 포맷 정의 =====

/**
 * 중첩 Bundle 계층 구조 저장 정보
 */
interface NestedBundleHierarchy {
  /** 루트 Bundle ID들 (최상위 Bundle들) */
  rootBundles: string[];
  
  /** 계층 구조 맵 (Bundle ID → 계층 노드) */
  hierarchyMap: Record<string, BundleHierarchyNode>;
  
  /** 관계 그래프 (모든 부모-자식 관계) */
  relationGraph: NestedBundleRelation[];
  
  /** 계층 통계 */
  hierarchyStats: {
    maxDepth: number;
    totalNestingCount: number;
    totalBundleCount: number;
    totalElementCount: number;
    complexityScore: number;
  };
  
  /** 계층 무결성 체크섬 */
  integrityChecksum: string;
}

/**
 * 성능 최적화를 위한 저장 인덱스
 */
interface StorageIndexes {
  /** Bundle ID → 파일 위치 매핑 */
  bundleLocationMap: Record<string, string>;
  
  /** TemplateGroup ID → 파일 위치 매핑 */
  templateGroupLocationMap: Record<string, string>;
  
  /** 관계 ID → 관계 정보 인덱스 */
  relationshipIndex: Record<string, {
    parentId: string;
    childId: string;
    depth: number;
    path: string;
  }>;
  
  /** 빠른 검색을 위한 태그 인덱스 */
  tagIndex: Record<string, string[]>;
  
  /** 시간 범위 인덱스 (범위별 Bundle 검색용) */
  timeRangeIndex: Array<{
    bundleId: string;
    startTime: number;
    endTime: number;
    duration: number;
  }>;
}

/**
 * 압축 및 최적화 설정
 */
interface CompressionSettings {
  /** 데이터 압축 사용 여부 */
  enabled: boolean;
  
  /** 압축 알고리즘 */
  algorithm: 'gzip' | 'lz4' | 'brotli';
  
  /** 압축 레벨 (1-9) */
  level: number;
  
  /** 분할 저장 임계값 (바이트) */
  chunkThreshold: number;
  
  /** 지연 로딩 활성화 */
  lazyLoading: boolean;
}

/**
 * 버전 호환성 정보
 */
interface CompatibilityInfo {
  /** 지원하는 최소 에디터 버전 */
  minEditorVersion: string;
  
  /** 지원하는 최대 에디터 버전 */
  maxEditorVersion: string;
  
  /** 하위 호환성 수준 */
  backwardCompatibility: 'full' | 'partial' | 'none';
  
  /** 상위 호환성 수준 */
  forwardCompatibility: 'full' | 'partial' | 'none';
  
  /** 필수 기능 목록 */
  requiredFeatures: string[];
  
  /** 선택적 기능 목록 */
  optionalFeatures: string[];
}

/**
 * 데이터 무결성 검증 정보
 */
interface IntegrityVerification {
  /** 전체 데이터 체크섬 */
  dataChecksum: string;
  
  /** 계층 구조 체크섬 */
  hierarchyChecksum: string;
  
  /** Bundle 체크섬 맵 */
  bundleChecksums: Record<string, string>;
  
  /** TemplateGroup 체크섬 맵 */
  templateGroupChecksums: Record<string, string>;
  
  /** 관계 체크섬 */
  relationshipChecksum: string;
  
  /** 검증 알고리즘 */
  algorithm: 'sha256' | 'md5' | 'crc32';
  
  /** 검증 생성 시간 */
  generatedAt: string;
}

/**
 * 중첩 Bundle 구조 지원 통합 프로젝트 데이터 V3
 */
export interface UnifiedProjectDataV3 {
  /** 기본 타임라인 트랙들 */
  tracks: TimelineTrack[];
  
  /** 프로젝트 설정 */
  projectSettings: ProjectSettings;
  
  /** 중첩 Bundle들 (계층 구조 포함) */
  nestedBundles: NestedBundle[];
  
  /** 중첩 TemplateGroup들 */
  nestedTemplateGroups: NestedTemplateGroup[];
  
  /** 중첩 Bundle 계층 구조 정보 */
  bundleHierarchy: NestedBundleHierarchy;
  
  /** 성능 최적화 인덱스 */
  indexes: StorageIndexes;
  
  /** V3 확장 메타데이터 */
  metadata: UnifiedProjectMetadataV3;
  
  /** 압축 및 최적화 설정 */
  compression?: CompressionSettings;
  
  /** 데이터 무결성 검증 */
  integrity: IntegrityVerification;
}

/**
 * V3 확장 메타데이터
 */
export interface UnifiedProjectMetadataV3 {
  /** 기본 정보 */
  exportedAt: string;
  version: '3.0.0';
  editorVersion: string;
  type: 'project' | 'template' | 'hybrid';
  
  /** 프로젝트/템플릿 정보 */
  name?: string;
  description?: string;
  templateId?: string;
  projectId?: string;
  
  /** 중첩 구조 정보 */
  nestingSupport: {
    enabled: true;
    maxDepth: number;
    bundleNestingCount: number;
    templateGroupNestingCount: number;
    complexityLevel: 'simple' | 'moderate' | 'complex' | 'advanced';
  };
  
  /** 호환성 정보 */
  compatibility: CompatibilityInfo;
  
  /** 성능 정보 */
  performance: {
    saveTime: number;
    loadTime?: number;
    compressionRatio?: number;
    indexBuildTime: number;
    totalSize: number;
    compressedSize?: number;
  };
  
  /** 데이터 통계 */
  statistics: {
    totalTracks: number;
    totalClips: number;
    totalBundles: number;
    totalTemplateGroups: number;
    totalRelations: number;
    totalElements: number;
    duration: number;
    clipsByType: Record<string, number>;
    bundlesByDepth: Record<number, number>;
  };
  
  /** 변경 기록 */
  changeHistory?: {
    version: string;
    changes: string[];
    migratedFrom?: string;
    migratedAt: string;
    migrationInfo?: MigrationInfo;
  }[];
  
  /** 사용자 정의 메타데이터 */
  customMetadata?: Record<string, any>;
  
  /** 기능 플래그 */
  features: {
    hasNestedBundles: boolean;
    hasNestedTemplateGroups: boolean;
    hasAdvancedRelations: boolean;
    hasPerformanceOptimizations: boolean;
    hasCompressionEnabled: boolean;
    hasLazyLoading: boolean;
    hasIndexedSearch: boolean;
    hasIntegrityVerification: boolean;
  };
}

// ===== V3 데이터 변환 인터페이스 =====

/**
 * V2에서 V3로 마이그레이션 결과
 */
export interface V2ToV3MigrationResult {
  /** 마이그레이션된 V3 데이터 */
  v3Data: UnifiedProjectDataV3;
  
  /** 마이그레이션 성공 여부 */
  isSuccess: boolean;
  
  /** 마이그레이션 경고들 */
  warnings: string[];
  
  /** 마이그레이션 오류들 */
  errors: string[];
  
  /** 변환 통계 */
  migrationStats: {
    bundlesConverted: number;
    templateGroupsConverted: number;
    relationsCreated: number;
    hierarchyDepth: number;
    conversionTime: number;
    dataGrowth: number; // 크기 증가율
  };
  
  /** 호환성 체크 결과 */
  compatibilityCheck: {
    isCompatible: boolean;
    missingFeatures: string[];
    unsupportedFeatures: string[];
    recommendedActions: string[];
  };
}

/**
 * Bundle 중첩 변환 옵션
 */
export interface BundleNestingConversionOptions {
  /** 최대 중첩 깊이 */
  maxDepth: number;
  
  /** 순환 참조 자동 해결 */
  autoResolveCircularRefs: boolean;
  
  /** 관계 보존 모드 */
  preserveRelationships: 'strict' | 'relaxed' | 'aggressive';
  
  /** 성능 최적화 수준 */
  optimizationLevel: 'minimal' | 'balanced' | 'aggressive';
  
  /** 압축 사용 여부 */
  enableCompression: boolean;
  
  /** 인덱스 생성 여부 */
  createIndexes: boolean;
  
  /** 무결성 검증 수준 */
  integrityLevel: 'basic' | 'standard' | 'strict';
}

/**
 * 저장 성능 프로파일
 */
export interface StoragePerformanceProfile {
  /** 프로파일 이름 */
  name: string;
  
  /** 압축 설정 */
  compression: CompressionSettings;
  
  /** 인덱싱 설정 */
  indexing: {
    enabled: boolean;
    bundleIndex: boolean;
    relationshipIndex: boolean;
    timeRangeIndex: boolean;
    tagIndex: boolean;
  };
  
  /** 캐싱 설정 */
  caching: {
    enabled: boolean;
    maxCacheSize: number;
    cacheTTL: number;
    preloadStrategy: 'none' | 'metadata' | 'hierarchy' | 'full';
  };
  
  /** 분할 저장 설정 */
  chunking: {
    enabled: boolean;
    chunkSize: number;
    chunkStrategy: 'bySize' | 'byDepth' | 'byType';
  };
}

// ===== 미리 정의된 프로파일들 =====

/**
 * 빠른 저장 프로파일 (최소 압축, 최대 속도)
 */
export const FAST_STORAGE_PROFILE: StoragePerformanceProfile = {
  name: 'Fast',
  compression: {
    enabled: false,
    algorithm: 'lz4',
    level: 1,
    chunkThreshold: 1024 * 1024, // 1MB
    lazyLoading: false
  },
  indexing: {
    enabled: true,
    bundleIndex: true,
    relationshipIndex: false,
    timeRangeIndex: false,
    tagIndex: false
  },
  caching: {
    enabled: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    cacheTTL: 300, // 5분
    preloadStrategy: 'metadata'
  },
  chunking: {
    enabled: false,
    chunkSize: 0,
    chunkStrategy: 'bySize'
  }
};

/**
 * 균형 저장 프로파일 (중간 압축, 중간 속도)
 */
export const BALANCED_STORAGE_PROFILE: StoragePerformanceProfile = {
  name: 'Balanced',
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 5,
    chunkThreshold: 512 * 1024, // 512KB
    lazyLoading: true
  },
  indexing: {
    enabled: true,
    bundleIndex: true,
    relationshipIndex: true,
    timeRangeIndex: true,
    tagIndex: false
  },
  caching: {
    enabled: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    cacheTTL: 600, // 10분
    preloadStrategy: 'hierarchy'
  },
  chunking: {
    enabled: true,
    chunkSize: 256 * 1024, // 256KB
    chunkStrategy: 'byDepth'
  }
};

/**
 * 압축 저장 프로파일 (최대 압축, 최소 크기)
 */
export const COMPACT_STORAGE_PROFILE: StoragePerformanceProfile = {
  name: 'Compact',
  compression: {
    enabled: true,
    algorithm: 'brotli',
    level: 9,
    chunkThreshold: 128 * 1024, // 128KB
    lazyLoading: true
  },
  indexing: {
    enabled: true,
    bundleIndex: true,
    relationshipIndex: true,
    timeRangeIndex: true,
    tagIndex: true
  },
  caching: {
    enabled: true,
    maxCacheSize: 200 * 1024 * 1024, // 200MB
    cacheTTL: 1800, // 30분
    preloadStrategy: 'full'
  },
  chunking: {
    enabled: true,
    chunkSize: 64 * 1024, // 64KB
    chunkStrategy: 'byType'
  }
};

// ===== 유틸리티 타입들 =====

/**
 * V3 데이터 검증 결과
 */
export interface V3ValidationResult extends ValidationResult {
  /** 중첩 구조 검증 */
  nestingValidation: {
    isValid: boolean;
    maxDepthExceeded: boolean;
    circularReferences: string[];
    orphanedElements: string[];
    integrityIssues: string[];
  };
  
  /** 성능 검증 */
  performanceValidation: {
    estimatedLoadTime: number;
    estimatedSaveTime: number;
    memorySizeEstimate: number;
    complexityWarnings: string[];
  };
  
  /** 호환성 검증 */
  compatibilityValidation: {
    isBackwardCompatible: boolean;
    isForwardCompatible: boolean;
    incompatibleFeatures: string[];
    migrationRequired: boolean;
  };
}

/**
 * 저장 최적화 제안
 */
export interface StorageOptimizationSuggestions {
  /** 압축 최적화 제안 */
  compressionSuggestions: {
    recommendedAlgorithm: 'gzip' | 'lz4' | 'brotli';
    recommendedLevel: number;
    expectedSizeReduction: number;
    expectedTimeIncrease: number;
  };
  
  /** 인덱싱 최적화 제안 */
  indexingSuggestions: {
    recommendedIndexes: string[];
    estimatedSpeedImprovement: number;
    estimatedSizeIncrease: number;
  };
  
  /** 분할 저장 제안 */
  chunkingSuggestions: {
    shouldUseChunking: boolean;
    recommendedChunkSize: number;
    recommendedStrategy: 'bySize' | 'byDepth' | 'byType';
    expectedBenefits: string[];
  };
  
  /** 전체 프로파일 추천 */
  recommendedProfile: StoragePerformanceProfile;
}

// ===== Export Types =====
export type {
  NestedBundleHierarchy,
  StorageIndexes,
  CompressionSettings,
  CompatibilityInfo,
  IntegrityVerification,
  BundleNestingConversionOptions,
  StoragePerformanceProfile
};

// ===== 버전 상수 =====
export const UNIFIED_PROJECT_DATA_V3_VERSION = '3.0.0';
export const SUPPORTED_EDITOR_VERSIONS = {
  min: '2.0.0',
  max: '4.0.0'
};

// ===== 기본 설정 상수 =====
export const DEFAULT_V3_SETTINGS = {
  maxNestingDepth: 10,
  defaultCompressionLevel: 5,
  defaultChunkThreshold: 512 * 1024, // 512KB
  defaultCacheSize: 100 * 1024 * 1024, // 100MB
  defaultCacheTTL: 600, // 10분
  integrityAlgorithm: 'sha256' as const,
  compressionAlgorithm: 'gzip' as const
};
