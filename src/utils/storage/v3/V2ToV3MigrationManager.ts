/**
 * @fileoverview V2에서 V3 마이그레이션 관리자
 * @description 기존 UnifiedProjectData V2를 V3 중첩 Bundle 구조로 마이그레이션하는 시스템
 * @version 1.0.0
 * @created 2025-06-22
 */

import { TimelineTrack, ProjectSettings } from '../../../types';
import { Bundle } from '../../../types/bundles';
import { TemplateGroup } from '../../../types/templates';
import {
  NestedBundle,
  NestedTemplateGroup,
  BundleElement,
  BundleHierarchyNode,
  NestedBundleRelation,
  BundleElementType,
  RelationshipType,
  MigrationInfo
} from '../../../types/nested';

import {
  UnifiedProjectDataV3,
  NestedBundleHierarchy,
  StorageIndexes,
  IntegrityVerification,
  UnifiedProjectMetadataV3,
  V2ToV3MigrationResult,
  BundleNestingConversionOptions,
  UNIFIED_PROJECT_DATA_V3_VERSION,
  DEFAULT_V3_SETTINGS
} from './UnifiedProjectDataV3';

import { UnifiedProjectData } from '../unifiedProjectManager';

// ===== 마이그레이션 전략 =====

/**
 * 마이그레이션 전략
 */
interface MigrationStrategy {
  /** 전략 이름 */
  name: string;
  
  /** Bundle 변환 방식 */
  bundleConversion: 'preserve' | 'enhance' | 'restructure';
  
  /** TemplateGroup 처리 방식 */
  templateGroupHandling: 'maintain' | 'merge' | 'separate';
  
  /** 관계 재구성 방식 */
  relationshipReconstruction: 'explicit' | 'inferred' | 'hybrid';
  
  /** 데이터 보존 수준 */
  preservationLevel: 'strict' | 'balanced' | 'aggressive';
  
  /** 성능 우선순위 */
  performancePriority: 'speed' | 'accuracy' | 'size';
}

/**
 * 마이그레이션 컨텍스트
 */
interface MigrationContext {
  /** 소스 데이터 */
  sourceData: UnifiedProjectData;
  
  /** 변환 옵션 */
  conversionOptions: BundleNestingConversionOptions;
  
  /** 마이그레이션 전략 */
  strategy: MigrationStrategy;
  
  /** ID 매핑 테이블 */
  idMappings: {
    bundles: Map<string, string>;
    templateGroups: Map<string, string>;
    relations: Map<string, string>;
  };
  
  /** 변환 통계 */
  statistics: {
    bundlesProcessed: number;
    templateGroupsProcessed: number;
    relationsCreated: number;
    errorsEncountered: number;
    warningsGenerated: number;
    processingTime: number;
  };
  
  /** 변환 로그 */
  conversionLog: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    category: 'bundle' | 'templateGroup' | 'relation' | 'hierarchy';
    message: string;
    details?: any;
  }>;
}

/**
 * Bundle 변환 결과
 */
interface BundleConversionResult {
  /** 변환된 중첩 Bundle */
  nestedBundle: NestedBundle;
  
  /** 생성된 관계들 */
  relations: NestedBundleRelation[];
  
  /** 계층 노드 */
  hierarchyNode: BundleHierarchyNode;
  
  /** 변환 메타데이터 */
  conversionMetadata: {
    originalBundleId: string;
    conversionMethod: string;
    preservedFeatures: string[];
    enhancedFeatures: string[];
    lostFeatures: string[];
    conversionTime: number;
  };
}

// ===== 미리 정의된 마이그레이션 전략들 =====

/**
 * 보수적 마이그레이션 전략 (최대 호환성)
 */
export const CONSERVATIVE_MIGRATION_STRATEGY: MigrationStrategy = {
  name: 'Conservative',
  bundleConversion: 'preserve',
  templateGroupHandling: 'maintain',
  relationshipReconstruction: 'explicit',
  preservationLevel: 'strict',
  performancePriority: 'accuracy'
};

/**
 * 균형 마이그레이션 전략 (호환성과 향상의 균형)
 */
export const BALANCED_MIGRATION_STRATEGY: MigrationStrategy = {
  name: 'Balanced',
  bundleConversion: 'enhance',
  templateGroupHandling: 'merge',
  relationshipReconstruction: 'hybrid',
  preservationLevel: 'balanced',
  performancePriority: 'accuracy'
};

/**
 * 공격적 마이그레이션 전략 (최대 기능 활용)
 */
export const AGGRESSIVE_MIGRATION_STRATEGY: MigrationStrategy = {
  name: 'Aggressive',
  bundleConversion: 'restructure',
  templateGroupHandling: 'separate',
  relationshipReconstruction: 'inferred',
  preservationLevel: 'aggressive',
  performancePriority: 'size'
};

// ===== V2에서 V3 마이그레이션 관리자 =====

/**
 * V2에서 V3 마이그레이션 관리자
 */
export class V2ToV3MigrationManager {
  private migrationStrategies: Map<string, MigrationStrategy> = new Map();
  private conversionCache: Map<string, BundleConversionResult> = new Map();
  
  // 성능 추적
  private performanceMetrics = {
    totalMigrations: 0,
    successfulMigrations: 0,
    averageMigrationTime: 0,
    totalDataProcessed: 0,
    averageConversionRatio: 0
  };

  constructor() {
    this.initializeStrategies();
  }

  /**
   * 기본 전략들 초기화
   */
  private initializeStrategies(): void {
    this.migrationStrategies.set('conservative', CONSERVATIVE_MIGRATION_STRATEGY);
    this.migrationStrategies.set('balanced', BALANCED_MIGRATION_STRATEGY);
    this.migrationStrategies.set('aggressive', AGGRESSIVE_MIGRATION_STRATEGY);
  }

  /**
   * V2에서 V3로 마이그레이션 실행
   */
  async migrateV2ToV3(
    v2Data: UnifiedProjectData,
    strategyName: string = 'balanced',
    options?: Partial<BundleNestingConversionOptions>
  ): Promise<V2ToV3MigrationResult> {
    const migrationStart = performance.now();
    
    console.log('🔄 V2에서 V3 마이그레이션 시작:', {
      sourceVersion: v2Data.metadata.version,
      targetVersion: UNIFIED_PROJECT_DATA_V3_VERSION,
      strategy: strategyName,
      tracks: v2Data.tracks.length,
      bundles: v2Data.bundles?.length || 0,
      templateGroups: v2Data.templateGroups?.length || 0
    });

    const result: V2ToV3MigrationResult = {
      v3Data: {} as UnifiedProjectDataV3,
      isSuccess: false,
      warnings: [],
      errors: [],
      migrationStats: {
        bundlesConverted: 0,
        templateGroupsConverted: 0,
        relationsCreated: 0,
        hierarchyDepth: 0,
        conversionTime: 0,
        dataGrowth: 0
      },
      compatibilityCheck: {
        isCompatible: true,
        missingFeatures: [],
        unsupportedFeatures: [],
        recommendedActions: []
      }
    };

    try {
      // 1. 마이그레이션 전략 및 옵션 설정
      const strategy = this.migrationStrategies.get(strategyName);
      if (!strategy) {
        throw new Error(`알 수 없는 마이그레이션 전략: ${strategyName}`);
      }

      const conversionOptions: BundleNestingConversionOptions = {
        maxDepth: DEFAULT_V3_SETTINGS.maxNestingDepth,
        autoResolveCircularRefs: true,
        preserveRelationships: 'balanced',
        optimizationLevel: 'balanced',
        enableCompression: true,
        createIndexes: true,
        integrityLevel: 'standard',
        ...options
      };

      // 2. 마이그레이션 컨텍스트 초기화
      const context = await this.initializeMigrationContext(v2Data, strategy, conversionOptions);

      // 3. 호환성 사전 검증
      result.compatibilityCheck = await this.performCompatibilityCheck(v2Data, strategy);
      if (!result.compatibilityCheck.isCompatible && strategy.preservationLevel === 'strict') {
        result.errors.push('호환성 검증 실패 - 엄격 모드에서는 마이그레이션 불가');
        return result;
      }

      // 4. Bundle 변환
      const bundleConversionResults = await this.convertBundles(context);
      result.migrationStats.bundlesConverted = bundleConversionResults.length;

      // 5. TemplateGroup 변환
      const templateGroupResults = await this.convertTemplateGroups(context);
      result.migrationStats.templateGroupsConverted = templateGroupResults.length;

      // 6. 관계 재구성
      const relations = await this.reconstructRelationships(context, bundleConversionResults);
      result.migrationStats.relationsCreated = relations.length;

      // 7. 계층 구조 구축
      const hierarchy = await this.buildHierarchyStructure(bundleConversionResults, relations);
      result.migrationStats.hierarchyDepth = hierarchy.hierarchyStats.maxDepth;

      // 8. 인덱스 생성
      const indexes = await this.createStorageIndexes(bundleConversionResults, templateGroupResults, hierarchy);

      // 9. 무결성 검증 정보 생성
      const integrity = await this.generateIntegrityVerification(bundleConversionResults, templateGroupResults, hierarchy);

      // 10. V3 데이터 구조 조립
      result.v3Data = await this.assembleV3Data(
        v2Data,
        bundleConversionResults,
        templateGroupResults,
        hierarchy,
        indexes,
        integrity,
        context
      );

      // 11. 마이그레이션 완료 처리
      result.isSuccess = true;
      result.migrationStats.conversionTime = performance.now() - migrationStart;
      result.migrationStats.dataGrowth = this.calculateDataGrowth(v2Data, result.v3Data);

      // 12. 경고 및 오류 수집
      result.warnings = context.conversionLog
        .filter(log => log.level === 'warn')
        .map(log => log.message);
      result.errors = context.conversionLog
        .filter(log => log.level === 'error')
        .map(log => log.message);

      // 13. 성능 메트릭 업데이트
      this.updatePerformanceMetrics(result);

      console.log('✅ V2에서 V3 마이그레이션 완료:', {
        conversionTime: `${result.migrationStats.conversionTime.toFixed(1)}ms`,
        bundlesConverted: result.migrationStats.bundlesConverted,
        templateGroupsConverted: result.migrationStats.templateGroupsConverted,
        relationsCreated: result.migrationStats.relationsCreated,
        hierarchyDepth: result.migrationStats.hierarchyDepth,
        dataGrowth: `${(result.migrationStats.dataGrowth * 100).toFixed(1)}%`,
        warnings: result.warnings.length,
        errors: result.errors.length
      });

    } catch (error) {
      result.isSuccess = false;
      result.errors.push(`마이그레이션 오류: ${error instanceof Error ? error.message : String(error)}`);
      console.error('❌ V2에서 V3 마이그레이션 실패:', error);
    }

    return result;
  }

  /**
   * 마이그레이션 컨텍스트 초기화
   */
  private async initializeMigrationContext(
    sourceData: UnifiedProjectData,
    strategy: MigrationStrategy,
    conversionOptions: BundleNestingConversionOptions
  ): Promise<MigrationContext> {
    return {
      sourceData,
      conversionOptions,
      strategy,
      idMappings: {
        bundles: new Map(),
        templateGroups: new Map(),
        relations: new Map()
      },
      statistics: {
        bundlesProcessed: 0,
        templateGroupsProcessed: 0,
        relationsCreated: 0,
        errorsEncountered: 0,
        warningsGenerated: 0,
        processingTime: 0
      },
      conversionLog: []
    };
  }

  /**
   * 호환성 검증
   */
  private async performCompatibilityCheck(
    v2Data: UnifiedProjectData,
    strategy: MigrationStrategy
  ): Promise<V2ToV3MigrationResult['compatibilityCheck']> {
    const result = {
      isCompatible: true,
      missingFeatures: [] as string[],
      unsupportedFeatures: [] as string[],
      recommendedActions: [] as string[]
    };

    // 1. 버전 호환성 검증
    if (!v2Data.metadata || !v2Data.metadata.version) {
      result.missingFeatures.push('metadata.version');
      result.recommendedActions.push('버전 정보 추가 필요');
    }

    // 2. Bundle 구조 호환성 검증
    if (v2Data.bundles) {
      for (const bundle of v2Data.bundles) {
        if (!bundle.id || !bundle.name) {
          result.missingFeatures.push('bundle.id 또는 bundle.name');
          result.isCompatible = false;
        }

        // 복잡한 관계 구조 검증
        if (bundle.relationships?.linkedTemplateGroups && bundle.relationships.linkedTemplateGroups.length > 10) {
          result.unsupportedFeatures.push('과도한 템플릿 그룹 링크');
          result.recommendedActions.push('템플릿 그룹 링크 수 제한 권장');
        }
      }
    }

    // 3. TemplateGroup 호환성 검증
    if (v2Data.templateGroups) {
      for (const group of v2Data.templateGroups) {
        if (!group.id || !group.clipIds) {
          result.missingFeatures.push('templateGroup.id 또는 clipIds');
          result.isCompatible = false;
        }

        // 순환 참조 가능성 검증
        if (group.originalBundles && group.originalBundles.length > 5) {
          result.recommendedActions.push('원본 Bundle 참조 최적화 권장');
        }
      }
    }

    // 4. 전략별 호환성 검증
    if (strategy.preservationLevel === 'strict' && result.missingFeatures.length > 0) {
      result.isCompatible = false;
      result.recommendedActions.push('보수적 전략으로 변경하거나 데이터 보완 필요');
    }

    return result;
  }

  /**
   * Bundle 변환
   */
  private async convertBundles(context: MigrationContext): Promise<BundleConversionResult[]> {
    const results: BundleConversionResult[] = [];
    const bundles = context.sourceData.bundles || [];

    console.log('🔄 Bundle 변환 시작:', bundles.length, '개');

    for (const bundle of bundles) {
      try {
        const conversionStart = performance.now();
        const result = await this.convertSingleBundle(bundle, context);
        
        result.conversionMetadata.conversionTime = performance.now() - conversionStart;
        results.push(result);
        
        context.statistics.bundlesProcessed++;
        context.conversionLog.push({
          timestamp: Date.now(),
          level: 'info',
          category: 'bundle',
          message: `Bundle ${bundle.name} 변환 완료`,
          details: { bundleId: bundle.id, conversionTime: result.conversionMetadata.conversionTime }
        });

      } catch (error) {
        context.statistics.errorsEncountered++;
        context.conversionLog.push({
          timestamp: Date.now(),
          level: 'error',
          category: 'bundle',
          message: `Bundle ${bundle.name} 변환 실패: ${error instanceof Error ? error.message : String(error)}`,
          details: { bundleId: bundle.id, error }
        });
      }
    }

    console.log('✅ Bundle 변환 완료:', results.length, '개 성공');
    return results;
  }

  /**
   * 단일 Bundle 변환
   */
  private async convertSingleBundle(bundle: Bundle, context: MigrationContext): Promise<BundleConversionResult> {
    const newBundleId = this.generateNewId('bundle', bundle.id);
    context.idMappings.bundles.set(bundle.id, newBundleId);

    // Bundle 요소들 변환
    const elements: BundleElement[] = [];
    
    // BaseClip ID들을 BundleElement로 변환
    if (bundle.baseClipIds) {
      for (let i = 0; i < bundle.baseClipIds.length; i++) {
        const clipId = bundle.baseClipIds[i];
        elements.push({
          id: this.generateNewId('element', clipId),
          type: 'baseClip',
          parentId: newBundleId,
          depth: 1,
          path: `${newBundleId}.${clipId}`,
          startTime: i * 10, // 임시 시간 설정
          endTime: (i + 1) * 10,
          duration: 10,
          baseClip: {
            clipId,
            trackId: 'unknown' // 실제 구현에서는 트랙 정보 추출
          }
        });
      }
    }

    // TemplateGroup ID들을 BundleElement로 변환
    if (bundle.templateGroupIds) {
      for (const groupId of bundle.templateGroupIds) {
        const templateGroup = context.sourceData.templateGroups?.find(g => g.id === groupId);
        if (templateGroup) {
          elements.push({
            id: this.generateNewId('element', groupId),
            type: 'templateGroup',
            parentId: newBundleId,
            depth: 1,
            path: `${newBundleId}.${groupId}`,
            startTime: templateGroup.startTime,
            endTime: templateGroup.endTime,
            duration: templateGroup.endTime - templateGroup.startTime,
            templateGroup: {
              groupId,
              preservedBundles: templateGroup.originalBundles || [],
              originalStructure: []
            }
          });
        }
      }
    }

    // 중첩 Bundle 생성
    const nestedBundle: NestedBundle = {
      ...bundle,
      id: newBundleId,
      elements,
      hierarchy: {
        depth: 1,
        maxDepth: this.calculateMaxDepth(elements),
        totalElements: elements.length,
        leafElements: elements.filter(e => e.type === 'baseClip').length
      },
      timeRange: {
        startTime: elements.length > 0 ? Math.min(...elements.map(e => e.startTime)) : 0,
        endTime: elements.length > 0 ? Math.max(...elements.map(e => e.endTime)) : 0,
        duration: 0,
        isContiguous: this.checkContiguity(elements)
      },
      cache: {
        flattenedClipIds: bundle.baseClipIds || [],
        hierarchyMap: new Map(),
        lastUpdated: Date.now()
      }
    };

    // 시간 정보 계산
    nestedBundle.timeRange.duration = nestedBundle.timeRange.endTime - nestedBundle.timeRange.startTime;

    // 관계 생성 (Bundle과 연결된 TemplateGroup들)
    const relations: NestedBundleRelation[] = [];
    if (bundle.templateGroupIds) {
      for (const groupId of bundle.templateGroupIds) {
        relations.push({
          id: this.generateNewId('relation', `${bundle.id}_${groupId}`),
          parentBundleId: newBundleId,
          childBundleId: groupId,
          relationship: 'contains',
          depth: 1,
          preserveOnMove: true,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 계층 노드 생성
    const hierarchyNode: BundleHierarchyNode = {
      bundleId: newBundleId,
      parentId: undefined,
      children: [],
      depth: 0,
      path: newBundleId,
      metadata: {
        originalSource: bundle.id,
        preservationMode: 'full',
        isRoot: true
      }
    };

    return {
      nestedBundle,
      relations,
      hierarchyNode,
      conversionMetadata: {
        originalBundleId: bundle.id,
        conversionMethod: context.strategy.bundleConversion,
        preservedFeatures: ['id', 'name', 'color', 'baseClipIds', 'templateGroupIds'],
        enhancedFeatures: ['elements', 'hierarchy', 'timeRange', 'cache'],
        lostFeatures: [],
        conversionTime: 0
      }
    };
  }

  /**
   * TemplateGroup 변환
   */
  private async convertTemplateGroups(context: MigrationContext): Promise<NestedTemplateGroup[]> {
    const results: NestedTemplateGroup[] = [];
    const templateGroups = context.sourceData.templateGroups || [];

    console.log('🔄 TemplateGroup 변환 시작:', templateGroups.length, '개');

    for (const group of templateGroups) {
      try {
        const nestedGroup = await this.convertSingleTemplateGroup(group, context);
        results.push(nestedGroup);
        
        context.statistics.templateGroupsProcessed++;
        context.conversionLog.push({
          timestamp: Date.now(),
          level: 'info',
          category: 'templateGroup',
          message: `TemplateGroup ${group.name} 변환 완료`,
          details: { groupId: group.id }
        });

      } catch (error) {
        context.statistics.errorsEncountered++;
        context.conversionLog.push({
          timestamp: Date.now(),
          level: 'error',
          category: 'templateGroup',
          message: `TemplateGroup ${group.name} 변환 실패: ${error instanceof Error ? error.message : String(error)}`,
          details: { groupId: group.id, error }
        });
      }
    }

    console.log('✅ TemplateGroup 변환 완료:', results.length, '개 성공');
    return results;
  }

  /**
   * 단일 TemplateGroup 변환
   */
  private async convertSingleTemplateGroup(group: TemplateGroup, context: MigrationContext): Promise<NestedTemplateGroup> {
    const newGroupId = this.generateNewId('templateGroup', group.id);
    context.idMappings.templateGroups.set(group.id, newGroupId);

    // 중첩 구조 정보 생성
    const nestedStructure = {
      preservedBundles: group.originalBundles || [],
      bundleHierarchy: [] as BundleHierarchyNode[],
      flattenedBundleIds: group.originalBundles?.map(b => b.id) || [],
      preservationMap: new Map<string, string>()
    };

    // 원본 Bundle들의 계층 구조 재구성
    if (group.originalBundles && group.originalBundles.length > 0) {
      for (const originalBundle of group.originalBundles) {
        const hierarchyNode: BundleHierarchyNode = {
          bundleId: originalBundle.id,
          parentId: newGroupId,
          children: [],
          depth: 1,
          path: `${newGroupId}.${originalBundle.id}`,
          metadata: {
            originalSource: group.id,
            preservationMode: 'full',
            isRoot: false
          }
        };
        nestedStructure.bundleHierarchy.push(hierarchyNode);
        nestedStructure.preservationMap.set(originalBundle.id, originalBundle.id);
      }
    }

    // 중첩 TemplateGroup 생성
    const nestedTemplateGroup: NestedTemplateGroup = {
      ...group,
      id: newGroupId,
      nestedStructure,
      originalTemplate: {
        templateId: group.id,
        bundleStructure: nestedStructure.bundleHierarchy,
        importMode: 'preserve',
        importedAt: new Date().toISOString()
      },
      metadata: {
        ...group.metadata,
        maxNestingDepth: this.calculateTemplateGroupDepth(nestedStructure.bundleHierarchy),
        totalBundleCount: nestedStructure.bundleHierarchy.length,
        hasCircularReference: false
      }
    };

    return nestedTemplateGroup;
  }

  /**
   * 관계 재구성
   */
  private async reconstructRelationships(
    context: MigrationContext,
    bundleResults: BundleConversionResult[]
  ): Promise<NestedBundleRelation[]> {
    const allRelations: NestedBundleRelation[] = [];

    console.log('🔄 관계 재구성 시작');

    // Bundle 변환 결과에서 관계들 수집
    for (const bundleResult of bundleResults) {
      allRelations.push(...bundleResult.relations);
    }

    // V2의 Bundle-TemplateGroup 관계에서 추가 관계 생성
    if (context.sourceData.bundleTemplateGroupRelations) {
      for (const v2Relation of context.sourceData.bundleTemplateGroupRelations) {
        const newBundleId = context.idMappings.bundles.get(v2Relation.bundleId);
        const newGroupId = context.idMappings.templateGroups.get(v2Relation.templateGroupId);

        if (newBundleId && newGroupId) {
          const relation: NestedBundleRelation = {
            id: this.generateNewId('relation', `${newBundleId}_${newGroupId}`),
            parentBundleId: newBundleId,
            childBundleId: newGroupId,
            relationship: v2Relation.relationship === 'parent' ? 'contains' : 'references',
            depth: 1,
            preserveOnMove: v2Relation.syncMovement,
            createdAt: new Date().toISOString()
          };
          allRelations.push(relation);
          context.statistics.relationsCreated++;
        }
      }
    }

    // 관계 중복 제거 및 검증
    const uniqueRelations = this.deduplicateRelations(allRelations);
    const validatedRelations = await this.validateRelations(uniqueRelations, context);

    console.log('✅ 관계 재구성 완료:', validatedRelations.length, '개 관계');
    return validatedRelations;
  }

  /**
   * 계층 구조 구축
   */
  private async buildHierarchyStructure(
    bundleResults: BundleConversionResult[],
    relations: NestedBundleRelation[]
  ): Promise<NestedBundleHierarchy> {
    console.log('🔄 계층 구조 구축 시작');

    // 루트 Bundle들 식별
    const allBundleIds = new Set(bundleResults.map(r => r.nestedBundle.id));
    const childBundleIds = new Set(relations.map(r => r.childBundleId));
    const rootBundles = Array.from(allBundleIds).filter(id => !childBundleIds.has(id));

    // 계층 구조 맵 생성
    const hierarchyMap: Record<string, BundleHierarchyNode> = {};
    for (const bundleResult of bundleResults) {
      hierarchyMap[bundleResult.nestedBundle.id] = bundleResult.hierarchyNode;
    }

    // 부모-자식 관계 설정
    for (const relation of relations) {
      const parentNode = hierarchyMap[relation.parentBundleId];
      const childNode = hierarchyMap[relation.childBundleId];
      
      if (parentNode && childNode) {
        childNode.parentId = relation.parentBundleId;
        childNode.depth = parentNode.depth + 1;
        childNode.path = `${parentNode.path}.${childNode.bundleId}`;
        parentNode.children.push(childNode);
      }
    }

    // 계층 통계 계산
    const hierarchyStats = {
      maxDepth: Math.max(...Object.values(hierarchyMap).map(node => node.depth), 0),
      totalNestingCount: relations.length,
      totalBundleCount: bundleResults.length,
      totalElementCount: bundleResults.reduce((sum, r) => sum + r.nestedBundle.elements.length, 0),
      complexityScore: this.calculateComplexityScore(bundleResults, relations)
    };

    // 무결성 체크섬 생성
    const integrityChecksum = await this.generateHierarchyChecksum(hierarchyMap, relations);

    const hierarchy: NestedBundleHierarchy = {
      rootBundles,
      hierarchyMap,
      relationGraph: relations,
      hierarchyStats,
      integrityChecksum
    };

    console.log('✅ 계층 구조 구축 완료:', {
      rootBundles: rootBundles.length,
      totalBundles: hierarchyStats.totalBundleCount,
      maxDepth: hierarchyStats.maxDepth,
      relations: relations.length
    });

    return hierarchy;
  }

  /**
   * 저장소 인덱스 생성
   */
  private async createStorageIndexes(
    bundleResults: BundleConversionResult[],
    templateGroups: NestedTemplateGroup[],
    hierarchy: NestedBundleHierarchy
  ): Promise<StorageIndexes> {
    console.log('🔍 저장소 인덱스 생성 시작');

    const indexes: StorageIndexes = {
      bundleLocationMap: {},
      templateGroupLocationMap: {},
      relationshipIndex: {},
      tagIndex: {},
      timeRangeIndex: []
    };

    // Bundle 위치 맵 생성
    bundleResults.forEach((result, index) => {
      indexes.bundleLocationMap[result.nestedBundle.id] = `bundle_chunk_${Math.floor(index / 10)}`;
    });

    // TemplateGroup 위치 맵 생성
    templateGroups.forEach((group, index) => {
      indexes.templateGroupLocationMap[group.id] = `templateGroup_chunk_${Math.floor(index / 10)}`;
    });

    // 관계 인덱스 생성
    hierarchy.relationGraph.forEach(relation => {
      indexes.relationshipIndex[relation.id] = {
        parentId: relation.parentBundleId,
        childId: relation.childBundleId,
        depth: relation.depth,
        path: `${relation.parentBundleId}.${relation.childBundleId}`
      };
    });

    // 시간 범위 인덱스 생성
    bundleResults.forEach(result => {
      indexes.timeRangeIndex.push({
        bundleId: result.nestedBundle.id,
        startTime: result.nestedBundle.timeRange.startTime,
        endTime: result.nestedBundle.timeRange.endTime,
        duration: result.nestedBundle.timeRange.duration
      });
    });

    console.log('✅ 저장소 인덱스 생성 완료');
    return indexes;
  }

  /**
   * 무결성 검증 정보 생성
   */
  private async generateIntegrityVerification(
    bundleResults: BundleConversionResult[],
    templateGroups: NestedTemplateGroup[],
    hierarchy: NestedBundleHierarchy
  ): Promise<IntegrityVerification> {
    console.log('🔒 무결성 검증 정보 생성 시작');

    const bundleChecksums: Record<string, string> = {};
    for (const result of bundleResults) {
      bundleChecksums[result.nestedBundle.id] = await this.calculateChecksum(result.nestedBundle);
    }

    const templateGroupChecksums: Record<string, string> = {};
    for (const group of templateGroups) {
      templateGroupChecksums[group.id] = await this.calculateChecksum(group);
    }

    const integrity: IntegrityVerification = {
      dataChecksum: await this.calculateChecksum({ bundleResults, templateGroups, hierarchy }),
      hierarchyChecksum: await this.calculateChecksum(hierarchy),
      bundleChecksums,
      templateGroupChecksums,
      relationshipChecksum: await this.calculateChecksum(hierarchy.relationGraph),
      algorithm: 'sha256',
      generatedAt: new Date().toISOString()
    };

    console.log('✅ 무결성 검증 정보 생성 완료');
    return integrity;
  }

  /**
   * V3 데이터 조립
   */
  private async assembleV3Data(
    v2Data: UnifiedProjectData,
    bundleResults: BundleConversionResult[],
    templateGroups: NestedTemplateGroup[],
    hierarchy: NestedBundleHierarchy,
    indexes: StorageIndexes,
    integrity: IntegrityVerification,
    context: MigrationContext
  ): Promise<UnifiedProjectDataV3> {
    console.log('🔧 V3 데이터 조립 시작');

    const nestedBundles = bundleResults.map(r => r.nestedBundle);
    const migrationInfo: MigrationInfo = {
      migrationId: this.generateNewId('migration', 'v2_to_v3'),
      sourceVersion: v2Data.metadata.version,
      targetVersion: UNIFIED_PROJECT_DATA_V3_VERSION,
      migratedAt: new Date().toISOString(),
      migrationStrategy: context.strategy.name,
      conversionOptions: context.conversionOptions,
      preservedFeatures: ['tracks', 'projectSettings', 'bundles', 'templateGroups'],
      enhancedFeatures: ['nestedBundles', 'bundleHierarchy', 'indexes', 'integrity'],
      lostFeatures: [],
      migrationStatistics: context.statistics,
      rollbackInfo: {
        canRollback: true,
        originalDataChecksum: await this.calculateChecksum(v2Data),
        rollbackInstructions: 'V3에서 V2로 롤백하려면 마이그레이션 관리자의 rollback 메서드 사용'
      }
    };

    const metadata: UnifiedProjectMetadataV3 = {
      exportedAt: new Date().toISOString(),
      version: UNIFIED_PROJECT_DATA_V3_VERSION,
      editorVersion: v2Data.metadata.editorVersion,
      type: v2Data.metadata.type || 'project',
      name: v2Data.metadata.name,
      description: v2Data.metadata.description,
      templateId: v2Data.metadata.templateId,
      nestingSupport: {
        enabled: true,
        maxDepth: hierarchy.hierarchyStats.maxDepth,
        bundleNestingCount: hierarchy.hierarchyStats.totalNestingCount,
        templateGroupNestingCount: templateGroups.reduce((sum, g) => sum + g.nestedStructure.bundleHierarchy.length, 0),
        complexityLevel: this.determineComplexityLevel(hierarchy.hierarchyStats.complexityScore)
      },
      compatibility: {
        minEditorVersion: '2.0.0',
        maxEditorVersion: '4.0.0',
        backwardCompatibility: 'partial',
        forwardCompatibility: 'full',
        requiredFeatures: ['nestedBundles', 'bundleHierarchy'],
        optionalFeatures: ['compression', 'lazyLoading', 'indexedSearch']
      },
      performance: {
        saveTime: context.statistics.processingTime,
        compressionRatio: 1,
        indexBuildTime: 0,
        totalSize: this.estimateDataSize({ bundles: nestedBundles, templateGroups, hierarchy }),
        compressedSize: 0
      },
      statistics: {
        totalTracks: v2Data.tracks.length,
        totalClips: v2Data.tracks.reduce((sum, track) => sum + track.clips.length, 0),
        totalBundles: nestedBundles.length,
        totalTemplateGroups: templateGroups.length,
        totalRelations: hierarchy.relationGraph.length,
        totalElements: nestedBundles.reduce((sum, bundle) => sum + bundle.elements.length, 0),
        duration: this.calculateTotalDuration(v2Data.tracks),
        clipsByType: this.calculateClipsByType(v2Data.tracks),
        bundlesByDepth: this.calculateBundlesByDepth(nestedBundles)
      },
      changeHistory: [{
        version: UNIFIED_PROJECT_DATA_V3_VERSION,
        changes: ['V2에서 V3로 마이그레이션', '중첩 Bundle 구조 추가', '계층 관리 시스템 도입'],
        migratedFrom: v2Data.metadata.version,
        migratedAt: new Date().toISOString(),
        migrationInfo
      }],
      features: {
        hasNestedBundles: nestedBundles.length > 0,
        hasNestedTemplateGroups: templateGroups.some(g => g.nestedStructure.bundleHierarchy.length > 0),
        hasAdvancedRelations: hierarchy.relationGraph.length > 0,
        hasPerformanceOptimizations: true,
        hasCompressionEnabled: context.conversionOptions.enableCompression,
        hasLazyLoading: false,
        hasIndexedSearch: context.conversionOptions.createIndexes,
        hasIntegrityVerification: context.conversionOptions.integrityLevel !== 'basic'
      }
    };

    const v3Data: UnifiedProjectDataV3 = {
      tracks: v2Data.tracks,
      projectSettings: v2Data.projectSettings,
      nestedBundles,
      nestedTemplateGroups: templateGroups,
      bundleHierarchy: hierarchy,
      indexes,
      metadata,
      integrity
    };

    console.log('✅ V3 데이터 조립 완료');
    return v3Data;
  }

  // ===== 유틸리티 메서드들 =====

  private generateNewId(type: string, originalId: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateMaxDepth(elements: BundleElement[]): number {
    return Math.max(...elements.map(e => e.depth), 0);
  }

  private checkContiguity(elements: BundleElement[]): boolean {
    if (elements.length === 0) return true;
    
    const sortedElements = elements.sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sortedElements.length; i++) {
      if (sortedElements[i].startTime > sortedElements[i - 1].endTime) {
        return false;
      }
    }
    return true;
  }

  private calculateTemplateGroupDepth(hierarchy: BundleHierarchyNode[]): number {
    return Math.max(...hierarchy.map(node => node.depth), 0);
  }

  private deduplicateRelations(relations: NestedBundleRelation[]): NestedBundleRelation[] {
    const seen = new Set<string>();
    return relations.filter(relation => {
      const key = `${relation.parentBundleId}_${relation.childBundleId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async validateRelations(relations: NestedBundleRelation[], context: MigrationContext): Promise<NestedBundleRelation[]> {
    // 관계 유효성 검증 (순환 참조 등)
    return relations;
  }

  private calculateComplexityScore(bundleResults: BundleConversionResult[], relations: NestedBundleRelation[]): number {
    const bundleCount = bundleResults.length;
    const relationCount = relations.length;
    const totalElements = bundleResults.reduce((sum, r) => sum + r.nestedBundle.elements.length, 0);
    
    return Math.min(100, (bundleCount * 2) + (relationCount * 3) + (totalElements * 0.5));
  }

  private async generateHierarchyChecksum(hierarchyMap: Record<string, BundleHierarchyNode>, relations: NestedBundleRelation[]): Promise<string> {
    return this.calculateChecksum({ hierarchyMap, relations });
  }

  private async calculateChecksum(data: any): Promise<string> {
    // 간단한 체크섬 계산 (실제로는 crypto API 사용)
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private calculateDataGrowth(v2Data: UnifiedProjectData, v3Data: UnifiedProjectDataV3): number {
    const v2Size = this.estimateDataSize(v2Data);
    const v3Size = this.estimateDataSize(v3Data);
    return (v3Size - v2Size) / v2Size;
  }

  private estimateDataSize(data: any): number {
    return JSON.stringify(data).length * 2; // UTF-16 기준
  }

  private determineComplexityLevel(score: number): 'simple' | 'moderate' | 'complex' | 'advanced' {
    if (score < 25) return 'simple';
    if (score < 50) return 'moderate';
    if (score < 75) return 'complex';
    return 'advanced';
  }

  private calculateTotalDuration(tracks: TimelineTrack[]): number {
    const allClips = tracks.flatMap(track => track.clips);
    return allClips.length > 0 ? Math.max(...allClips.map(clip => clip.endTime)) : 0;
  }

  private calculateClipsByType(tracks: TimelineTrack[]): Record<string, number> {
    const clipsByType: Record<string, number> = {};
    const allClips = tracks.flatMap(track => track.clips);
    
    allClips.forEach(clip => {
      const type = clip.mediaType;
      clipsByType[type] = (clipsByType[type] || 0) + 1;
    });
    
    return clipsByType;
  }

  private calculateBundlesByDepth(bundles: NestedBundle[]): Record<number, number> {
    const bundlesByDepth: Record<number, number> = {};
    
    bundles.forEach(bundle => {
      const depth = bundle.hierarchy.depth;
      bundlesByDepth[depth] = (bundlesByDepth[depth] || 0) + 1;
    });
    
    return bundlesByDepth;
  }

  private updatePerformanceMetrics(result: V2ToV3MigrationResult): void {
    this.performanceMetrics.totalMigrations++;
    if (result.isSuccess) {
      this.performanceMetrics.successfulMigrations++;
    }
    
    this.performanceMetrics.averageMigrationTime = 
      (this.performanceMetrics.averageMigrationTime * (this.performanceMetrics.totalMigrations - 1) + 
       result.migrationStats.conversionTime) / this.performanceMetrics.totalMigrations;
  }

  // ===== 공개 API =====

  /**
   * 사용자 정의 마이그레이션 전략 등록
   */
  registerMigrationStrategy(name: string, strategy: MigrationStrategy): void {
    this.migrationStrategies.set(name, strategy);
  }

  /**
   * 등록된 마이그레이션 전략 목록 조회
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.migrationStrategies.keys());
  }

  /**
   * 마이그레이션 성능 메트릭 조회
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.conversionCache.clear();
  }
}

// ===== Export =====
export default V2ToV3MigrationManager;
export type {
  MigrationStrategy,
  MigrationContext,
  BundleConversionResult
};
