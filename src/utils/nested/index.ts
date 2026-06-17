// === 중첩 Bundle 유틸리티 시스템 통합 인덱스 === //

/**
 * 중첩 Bundle 구조 개선을 위한 유틸리티 시스템
 * 
 * 이 모듈은 Bundle > TemplateGroup > Bundle 과 같은 
 * 복잡한 중첩 구조를 완전히 지원하는 유틸리티들을 제공합니다.
 * 
 * @version 1.1.0 - Phase 2 Day 1 완료
 * @since 2025-06-22
 */

// === 핵심 유틸리티 시스템 exports === //

// Phase 1 구현체들
export {
  BundleHierarchyManager,
  bundleHierarchyUtils
} from './bundleHierarchy';

export {
  StructurePreservationManager
} from './structurePreservation';

export {
  NestedBundleCacheManager,
  CachePerformanceMonitor
} from './cacheSystem';

export {
  AdvancedCircularReferenceValidator
} from './advancedValidation';

export {
  ComprehensiveDataIntegrityValidator
} from './dataIntegrityValidator';

export {
  NestedBundleMigrationManager
} from './migrationManager';

// Phase 2 Day 1 신규 구현체들
export {
  createNestedBundle,
  analyzeSelectedElementsForNesting,
  validateNestingStructure
} from './bundleCreation';

export {
  BundleHierarchyManager as HierarchyManager,
  getBundleHierarchyManager,
  resetBundleHierarchyManager
} from './bundleHierarchyManagement';

export {
  BundleIdMappingManager,
  getBundleIdMappingManager,
  resetBundleIdMappingManager,
  type IdMappingRelation,
  type IdMappingQuery,
  type IdMappingUpdateResult
} from './bundleIdMapping';

// === 통합 유틸리티 매니저 === //

import { BundleHierarchyManager } from './bundleHierarchy';
import { StructurePreservationManager } from './structurePreservation';
import { NestedBundleCacheManager } from './cacheSystem';
import { AdvancedCircularReferenceValidator } from './advancedValidation';
import { ComprehensiveDataIntegrityValidator } from './dataIntegrityValidator';
import { NestedBundleMigrationManager } from './migrationManager';

// Phase 2 Day 1 신규 매니저들
import { getBundleHierarchyManager } from './bundleHierarchyManagement';
import { getBundleIdMappingManager } from './bundleIdMapping';
import { createNestedBundle } from './bundleCreation';

import type { 
  Bundle,
  TemplateGroup,
  TimelineTrack,
  SelectedElement,
  CreateBundleData
} from '../../types';

import type { 
  NestedBundle, 
  NestedTemplateGroup, 
  NestedBundleRelation,
  BundleHierarchyNode,
  LoadTemplateAsNestedGroupOptions,
  LoadNestedTemplateGroupResult,
  NestingConstraints,
  DEFAULT_NESTING_CONSTRAINTS,
  CreateNestedBundleOptions,
  CreateNestedBundleResult
} from '../../types/nested';

/**
 * 중첩 Bundle 시스템 통합 관리자 (v1.1.0)
 * Phase 2 Day 1 완료: 중첩 Bundle 생성 시스템 통합
 */
export class NestedBundleSystemManager {
  private hierarchyManager: BundleHierarchyManager;
  private preservationManager: StructurePreservationManager;
  private cacheManager: NestedBundleCacheManager;
  private circularValidator: AdvancedCircularReferenceValidator;
  private dataValidator: ComprehensiveDataIntegrityValidator;
  private migrationManager: NestedBundleMigrationManager;
  
  // Phase 2 Day 1 신규 매니저들
  private bundleHierarchyManager: ReturnType<typeof getBundleHierarchyManager>;
  private idMappingManager: ReturnType<typeof getBundleIdMappingManager>;
  
  private isInitialized: boolean = false;

  constructor(
    constraints?: Partial<NestingConstraints>,
    cacheConfig?: any
  ) {
    console.log('🚀 중첩 Bundle 시스템 v1.1.0 초기화 시작...');

    // Phase 1 매니저들
    this.hierarchyManager = new BundleHierarchyManager(
      { ...DEFAULT_NESTING_CONSTRAINTS, ...constraints }
    );
    this.preservationManager = new StructurePreservationManager();
    this.cacheManager = new NestedBundleCacheManager(cacheConfig);
    this.circularValidator = new AdvancedCircularReferenceValidator(
      { ...DEFAULT_NESTING_CONSTRAINTS, ...constraints }
    );
    this.dataValidator = new ComprehensiveDataIntegrityValidator(
      { ...DEFAULT_NESTING_CONSTRAINTS, ...constraints }
    );
    this.migrationManager = new NestedBundleMigrationManager();

    // Phase 2 Day 1 신규 매니저들
    this.bundleHierarchyManager = getBundleHierarchyManager();
    this.idMappingManager = getBundleIdMappingManager();

    this.isInitialized = true;

    console.log('✅ 중첩 Bundle 시스템 v1.1.0 초기화 완료:', {
      // Phase 1
      hierarchyManager: '✓',
      preservationManager: '✓', 
      cacheManager: '✓',
      circularValidator: '✓',
      dataValidator: '✓',
      migrationManager: '✓',
      // Phase 2 Day 1
      bundleHierarchyManager: '✓',
      idMappingManager: '✓',
      bundleCreationSystem: '✓',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 🏗️ 중첩 Bundle 생성 (Phase 2 Day 1 신규 기능)
   * 
   * 선택된 요소들로부터 계층적 Bundle 구조를 생성합니다.
   */
  async createNestedBundle(
    selectedElements: SelectedElement[],
    bundleData: CreateBundleData,
    existingBundles: Bundle[],
    existingTemplateGroups: TemplateGroup[],
    tracks: TimelineTrack[],
    options: CreateNestedBundleOptions = {}
  ): Promise<CreateNestedBundleResult> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    console.log('🏗️ 중첩 Bundle 생성 요청:', {
      elements: selectedElements.length,
      bundleName: bundleData.name,
      existingBundles: existingBundles.length,
      existingGroups: existingTemplateGroups.length
    });

    try {
      // 1. 메인 Bundle 생성 함수 호출
      const result = await createNestedBundle(
        selectedElements,
        bundleData,
        existingBundles,
        existingTemplateGroups,
        tracks,
        options
      );

      // 2. 생성된 Bundle을 시스템에 통합
      if (result.bundle) {
        await this.integrateBundleIntoSystem(result.bundle);
      }

      console.log('✅ 중첩 Bundle 생성 완료:', {
        bundleId: result.bundle?.id.slice(-8),
        elements: result.metadata.totalElements,
        depth: result.metadata.maxDepth,
        creationTime: `${result.performance.creationTime.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ 중첩 Bundle 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 🔗 Bundle을 시스템에 통합 (Phase 2 Day 1 신규 기능)
   */
  async integrateBundleIntoSystem(bundle: NestedBundle): Promise<{
    hierarchyUpdated: boolean;
    idMappingsCreated: number;
    cacheUpdated: boolean;
    warnings: string[];
  }> {
    const result = {
      hierarchyUpdated: false,
      idMappingsCreated: 0,
      cacheUpdated: false,
      warnings: [] as string[]
    };

    try {
      console.log(`🔗 Bundle 시스템 통합: ${bundle.name}`);

      // 1. 계층 구조 관리 시스템에 등록
      if (bundle.elements.length > 0) {
        const hierarchyResult = await this.bundleHierarchyManager.buildBundleHierarchy(
          bundle,
          [], // 기존 Bundle들 (실제 구현 시 전달 필요)
          bundle.relationships?.nestedRelations || []
        );
        
        result.hierarchyUpdated = hierarchyResult.hierarchy.length > 0;
        result.warnings.push(...hierarchyResult.warnings);
      }

      // 2. ID 매핑 시스템에 등록
      for (const element of bundle.elements) {
        const mappingResult = await this.idMappingManager.createIdMappings(
          [element as any], // 타입 변환 필요
          bundle.id,
          'nested'
        );
        
        result.idMappingsCreated += mappingResult.mappings.length;
        result.warnings.push(...mappingResult.warnings);
      }

      // 3. 캐시 시스템 업데이트
      await this.cacheManager.cacheFlattenedBundle(bundle.id, {
        clipIds: bundle.cache?.flattenedClipIds || [],
        timelineSegments: [], // 실제 계산 필요
        elementCount: bundle.elements.length
      });
      result.cacheUpdated = true;

      console.log('✅ Bundle 시스템 통합 완료:', result);

    } catch (error) {
      console.error('❌ Bundle 시스템 통합 실패:', error);
      result.warnings.push(`시스템 통합 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 🔍 Bundle 계층 검색 (Phase 2 Day 1 신규 기능)
   */
  async searchBundleHierarchy(query: {
    bundleId?: string;
    parentId?: string;
    depth?: number;
    relationship?: 'direct' | 'inherited' | 'preserved';
    includeChildren?: boolean;
    includeParents?: boolean;
  }): Promise<{
    bundles: string[];
    relations: NestedBundleRelation[];
    hierarchy: BundleHierarchyNode[];
  }> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    return await this.bundleHierarchyManager.searchBundleHierarchy(query);
  }

  /**
   * 🚀 계층적 Bundle 이동 (Phase 2 Day 1 신규 기능)
   */
  async moveNestedBundle(
    bundleId: string,
    deltaTime: number,
    options: {
      preserveHierarchy?: boolean;
      moveChildren?: boolean;
      respectConstraints?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    movedBundles: string[];
    timeUpdates: Map<string, { startTime: number; endTime: number }>;
    relationshipChanges: NestedBundleRelation[];
    warnings: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    console.log(`🚀 계층적 Bundle 이동: ${bundleId} (${deltaTime}ms)`);

    try {
      const result = await this.bundleHierarchyManager.moveNestedBundle(
        bundleId,
        deltaTime,
        options
      );

      // 캐시 무효화
      if (result.success) {
        for (const movedBundleId of result.movedBundles) {
          await this.cacheManager.invalidateHierarchy(movedBundleId);
        }
      }

      console.log('✅ 계층적 Bundle 이동 완료:', {
        movedBundles: result.movedBundles.length,
        success: result.success
      });

      return result;

    } catch (error) {
      console.error('❌ 계층적 Bundle 이동 실패:', error);
      throw error;
    }
  }

  /**
   * 🗂️ ID 매핑 검색 (Phase 2 Day 1 신규 기능)
   */
  async findIdMapping(query: {
    originalId?: string;
    mappedId?: string;
    type?: 'bundle' | 'templateGroup' | 'baseClip';
    context?: 'nested' | 'preserved' | 'inherited';
    parentBundleId?: string;
    includeInactive?: boolean;
  }): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    return await this.idMappingManager.findMapping(query);
  }

  /**
   * 🔄 ID 변환 (Phase 2 Day 1 신규 기능)
   */
  async translateId(
    id: string,
    direction: 'original-to-mapped' | 'mapped-to-original',
    context?: string
  ): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    return await this.idMappingManager.translateId(id, direction, context);
  }

  /**
   * 📊 시스템 상태 확인 (Phase 2 Day 1 확장)
   */
  getSystemStatus(): {
    initialized: boolean;
    healthy: boolean;
    services: {
      hierarchy: boolean;
      preservation: boolean;
      cache: boolean;
      validation: boolean;
      migration: boolean;
      // Phase 2 Day 1 신규
      bundleHierarchy: boolean;
      idMapping: boolean;
      bundleCreation: boolean;
    };
    uptime: number;
    statistics: any;
  } {
    const cacheStats = this.cacheManager.getOverallStatistics();
    const idMappingStats = this.idMappingManager.getIdMappingStatistics();
    
    return {
      initialized: this.isInitialized,
      healthy: this.isInitialized && cacheStats.overallHitRate > 0.5,
      services: {
        // Phase 1
        hierarchy: true,
        preservation: true,
        cache: cacheStats.totalEntries >= 0,
        validation: true,
        migration: true,
        // Phase 2 Day 1
        bundleHierarchy: true,
        idMapping: idMappingStats.indexHealth.isConsistent,
        bundleCreation: true
      },
      uptime: Date.now(),
      statistics: {
        // Phase 1
        cache: cacheStats,
        // Phase 2 Day 1
        idMapping: idMappingStats,
        bundleHierarchy: {
          // 계층 관리 통계 (구현 필요)
        }
      }
    };
  }

  // === 기존 Phase 1 메서드들 유지 === //

  /**
   * 포괄적 데이터 무결성 검증
   */
  async validateDataIntegrity(
    bundles: NestedBundle[],
    templateGroups: NestedTemplateGroup[],
    relations: NestedBundleRelation[]
  ): Promise<{
    isValid: boolean;
    circularReference: any;
    dataIntegrity: any;
    overallScore: number;
    recommendations: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    console.log('🔍 포괄적 데이터 무결성 검증 시작:', {
      bundles: bundles.length,
      templateGroups: templateGroups.length,
      relations: relations.length
    });

    try {
      // 1. 순환 참조 검증
      const circularResult = await this.circularValidator.comprehensiveCircularCheck(relations);
      
      // 2. 전체 데이터 무결성 검증
      const integrityResult = await this.dataValidator.validateComprehensiveStructure(
        bundles,
        templateGroups,
        relations
      );

      // 3. 결과 통합
      const combinedResult = {
        isValid: !circularResult.hasCircularReference && integrityResult.isValid,
        circularReference: circularResult,
        dataIntegrity: integrityResult,
        overallScore: integrityResult.overallScore,
        recommendations: [
          ...circularResult.recommendations,
          ...(integrityResult.autoFixSuggestions?.map((s: any) => s.description) || [])
        ]
      };

      console.log('✅ 포괄적 데이터 무결성 검증 완료:', {
        isValid: combinedResult.isValid,
        hasCircularReference: circularResult.hasCircularReference,
        overallScore: combinedResult.overallScore,
        recommendations: combinedResult.recommendations.length
      });

      return combinedResult;

    } catch (error) {
      console.error('❌ 데이터 무결성 검증 실패:', error);
      throw error;
    }
  }

  /**
   * 레거시 데이터 마이그레이션
   */
  async migrateLegacyData(
    legacyBundles: any[],
    legacyTemplateGroups: any[],
    options?: any
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    console.log('🚀 레거시 데이터 마이그레이션 시작:', {
      legacyBundles: legacyBundles.length,
      legacyTemplateGroups: legacyTemplateGroups.length
    });

    try {
      // 1. 마이그레이션 계획 생성
      const plan = await this.migrationManager.analyzeLegacyDataAndCreatePlan(
        legacyBundles,
        legacyTemplateGroups,
        options
      );

      console.log('📋 마이그레이션 계획 생성 완료:', {
        planId: plan.id,
        strategy: plan.strategy,
        estimatedTime: `${Math.round(plan.totalEstimatedTime / 1000)}초`,
        complexity: plan.transformation.estimatedComplexity
      });

      // 2. 마이그레이션 실행
      const result = await this.migrationManager.executeMigration(
        plan,
        legacyBundles,
        legacyTemplateGroups,
        options
      );

      // 3. 마이그레이션 결과 검증
      if (result.success && result.migrated) {
        const validationResult = await this.validateDataIntegrity(
          result.migrated.bundles,
          result.migrated.templateGroups,
          result.migrated.relations
        );
        
        result.validation.dataIntegrityScore = validationResult.overallScore;
        result.validation.postValidationPassed = validationResult.isValid;
      }

      console.log('✅ 레거시 데이터 마이그레이션 완료:', {
        success: result.success,
        migratedBundles: result.migrated.bundles.length,
        migratedTemplateGroups: result.migrated.templateGroups.length,
        dataIntegrityScore: result.validation.dataIntegrityScore
      });

      return result;

    } catch (error) {
      console.error('❌ 레거시 데이터 마이그레이션 실패:', error);
      throw error;
    }
  }

  /**
   * 실시간 순환 참조 검증 (새 관계 추가 시)
   */
  async validateNewRelation(
    existingRelations: NestedBundleRelation[],
    newRelation: NestedBundleRelation
  ): Promise<{
    canAdd: boolean;
    issues?: string[];
    suggestions?: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    try {
      const result = await this.circularValidator.validateNewRelation(
        existingRelations,
        newRelation
      );

      return {
        canAdd: result.canAdd,
        issues: result.circularResult ? [result.circularResult.warnings[0]] : undefined,
        suggestions: result.alternativeSuggestions
      };

    } catch (error) {
      console.error('❌ 새 관계 검증 실패:', error);
      return {
        canAdd: false,
        issues: ['검증 중 오류 발생'],
        suggestions: ['나중에 다시 시도해주세요']
      };
    }
  }

  /**
   * 템플릿을 중첩 구조가 보존된 그룹으로 로드 (기존 메서드 유지)
   */
  async loadTemplateAsNestedGroup(
    templateId: string,
    groupName: string,
    insertTime: number,
    templateData: {
      bundles: NestedBundle[];
      relations: NestedBundleRelation[];
      newClipIds: string[];
    },
    options: LoadTemplateAsNestedGroupOptions
  ): Promise<LoadNestedTemplateGroupResult> {
    if (!this.isInitialized) {
      throw new Error('중첩 Bundle 시스템이 초기화되지 않았습니다');
    }

    console.log('🔄 중첩 템플릿 그룹 로드 시작:', {
      templateId: templateId.slice(-8),
      groupName,
      bundleCount: templateData.bundles.length,
      relationCount: templateData.relations.length,
      nestingMode: options.nestingMode
    });

    try {
      // 1. 원본 구조 캡처
      const originalStructure = await this.preservationManager.captureOriginalStructure(
        templateId,
        templateData.bundles,
        templateData.relations
      );

      // 2. 계층 구조 캐시 확인
      let hierarchy = await this.cacheManager.getHierarchy(templateId);
      if (!hierarchy) {
        hierarchy = this.hierarchyManager.buildHierarchy(templateData.relations);
        await this.cacheManager.cacheHierarchy(templateId, hierarchy);
      }

      // 3. 중첩 그룹 생성
      const result = await this.preservationManager.createNestedTemplateGroup(
        templateId,
        groupName,
        insertTime,
        templateData.newClipIds,
        options
      );

      // 4. 결과 캐시
      await this.cacheManager.cacheFlattenedBundle(templateId, {
        clipIds: templateData.newClipIds,
        timelineSegments: [], // 실제 계산 필요
        elementCount: templateData.bundles.length
      });

      console.log('✅ 중첩 템플릿 그룹 로드 완료:', {
        templateId: templateId.slice(-8),
        preservedBundles: result.preservedBundles.length,
        processingTime: result.processing.totalProcessingTime,
        preservationQuality: result.templateGroup.enhancedMetadata.nestingInfo.preservationQuality
      });

      return result;

    } catch (error) {
      console.error('❌ 중첩 템플릿 그룹 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 시스템 통계 조회 (Phase 2 Day 1 확장)
   */
  getSystemStatistics(): {
    cache: any;
    hierarchy: any;
    preservation: any;
    validation: any;
    migration: any;
    // Phase 2 Day 1 신규
    bundleHierarchy: any;
    idMapping: any;
    bundleCreation: any;
  } {
    return {
      // Phase 1
      cache: this.cacheManager.getOverallStatistics(),
      hierarchy: this.hierarchyManager.getHierarchyStatistics(),
      preservation: {
        // 보존 매니저 통계 (향후 구현)
        preservedTemplates: 0,
        preservationQuality: 0
      },
      validation: this.dataValidator.getValidationStatistics(),
      migration: this.migrationManager.getMigrationStatistics(),
      // Phase 2 Day 1
      bundleHierarchy: {
        // 계층 관리 통계 (구현 필요)
        totalHierarchies: 0,
        averageDepth: 0
      },
      idMapping: this.idMappingManager.getIdMappingStatistics(),
      bundleCreation: {
        // Bundle 생성 통계 (향후 구현)
        totalCreated: 0,
        averageComplexity: 0
      }
    };
  }

  /**
   * 시스템 초기화 (Phase 2 Day 1 확장)
   */
  reset(): void {
    // Phase 1
    this.cacheManager.clear();
    this.preservationManager.clearCache();
    this.circularValidator.clearCache();
    
    // Phase 2 Day 1
    // ID 매핑 시스템 초기화 (필요 시)
    
    console.log('🔄 중첩 Bundle 시스템 v1.1.0 초기화 완료');
  }

  /**
   * 시스템 종료
   */
  shutdown(): void {
    this.cacheManager.shutdown();
    this.isInitialized = false;
    console.log('⛔ 중첩 Bundle 시스템 v1.1.0 종료');
  }
}

// === 유틸리티 팩토리 함수들 === //

/**
 * 기본 설정으로 중첩 Bundle 시스템 생성
 */
export function createNestedBundleSystem(options?: {
  constraints?: Partial<NestingConstraints>;
  cacheConfig?: any;
}): NestedBundleSystemManager {
  return new NestedBundleSystemManager(
    options?.constraints,
    options?.cacheConfig
  );
}

/**
 * 고성능 설정으로 중첩 Bundle 시스템 생성
 */
export function createHighPerformanceNestedSystem(): NestedBundleSystemManager {
  const constraints: Partial<NestingConstraints> = {
    maxDepth: 15,
    maxChildrenPerBundle: 100,
    performance: {
      maxRenderDepth: 8,
      lazyLoadThreshold: 200,
      cacheInvalidationDelay: 500
    }
  };

  const cacheConfig = {
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxEntries: 2000,
    defaultTTL: 10 * 60 * 1000, // 10분
    evictionStrategy: 'lru' as const,
    compressionEnabled: true
  };

  return new NestedBundleSystemManager(constraints, cacheConfig);
}

// === 전역 인스턴스 관리 === //

let globalNestedSystem: NestedBundleSystemManager | null = null;

/**
 * 전역 중첩 Bundle 시스템 인스턴스 가져오기 (싱글톤 패턴)
 * 
 * 이 함수는 프로젝트 전체에서 중첩 Bundle 시스템에 접근할 때 사용됩니다.
 * Phase 2 Day 1에서 구현된 새로운 기능들이 모두 포함되어 있습니다.
 */
export function getSystemManager(): NestedBundleSystemManager {
  if (!globalNestedSystem) {
    globalNestedSystem = createNestedBundleSystem();
  }
  return globalNestedSystem;
}

/**
 * 전역 중첩 Bundle 시스템 인스턴스 가져오기 (별칭)
 */
export function getGlobalNestedSystem(): NestedBundleSystemManager {
  return getSystemManager();
}

// === 버전 정보 === //

/**
 * 중첩 Bundle 유틸리티 시스템 버전 정보 (Phase 2 Day 1 업데이트)
 */
export const NESTED_BUNDLE_UTILS_VERSION = {
  version: '1.1.0',
  releaseDate: '2025-06-22',
  phase: 'Phase 2 Day 1 완료',
  components: {
    // Phase 1
    hierarchyManager: '1.0.0',
    preservationManager: '1.0.0',
    cacheSystem: '1.0.0',
    circularValidator: '1.0.0',
    dataValidator: '1.0.0',
    migrationManager: '1.0.0',
    unifiedManager: '1.0.0',
    // Phase 2 Day 1
    bundleCreation: '1.0.0',
    bundleHierarchyManagement: '1.0.0',
    bundleIdMapping: '1.0.0'
  },
  features: [
    // Phase 1
    'bundle_hierarchy_management',
    'structure_preservation',
    'performance_cache_system',
    'advanced_circular_validation',
    'comprehensive_data_integrity',
    'legacy_data_migration',
    'unified_api_interface',
    'debugging_tools',
    'performance_monitoring',
    // Phase 2 Day 1
    'nested_bundle_creation',
    'hierarchical_bundle_management',
    'bundle_id_mapping_system',
    'real_time_hierarchy_search',
    'hierarchical_bundle_movement',
    'id_translation_system'
  ]
} as const;

// === 초기화 로그 === //
console.log('🎉 중첩 Bundle 유틸리티 시스템 v1.1.0 로드 완료!');
console.log('📋 Phase 2 Day 1 새로 추가된 기능:');
console.log('  • 🏗️ 중첩 Bundle 생성 시스템');
console.log('  • 🌳 Bundle 계층 관리 시스템'); 
console.log('  • 🗂️ Bundle ID 매핑 시스템');
console.log('  • 🔍 실시간 계층 검색');
console.log('  • 🚀 계층적 Bundle 이동');
console.log('  • 🔄 ID 변환 시스템');
console.log('📋 기존 Phase 1 기능들:');
console.log('  • Bundle 계층 구조 관리');
console.log('  • 원본 구조 보존 메커니즘');
console.log('  • 고성능 캐시 시스템');
console.log('  • 고급 순환 참조 검증');
console.log('  • 포괄적 데이터 무결성 검증');
console.log('  • 레거시 데이터 마이그레이션');
console.log('  • 통합 API 인터페이스');
console.log('  • 성능 모니터링 및 디버깅');
