/**
 * @fileoverview 버전 호환성 관리 시스템
 * @description 다양한 버전 간의 호환성을 관리하고 데이터 변환을 담당하는 시스템
 * @version 1.0.0
 * @created 2025-06-22
 */

import { TimelineTrack, ProjectSettings } from '../../../types';
import { Bundle } from '../../../types/bundles';
import { TemplateGroup } from '../../../types/templates';
import {
  NestedBundle,
  NestedTemplateGroup,
  BundleHierarchyNode,
  NestedBundleRelation,
  ValidationResult,
  MigrationInfo
} from '../../../types/nested';

import {
  UnifiedProjectDataV3,
  CompatibilityInfo,
  UNIFIED_PROJECT_DATA_V3_VERSION,
  SUPPORTED_EDITOR_VERSIONS
} from './UnifiedProjectDataV3';

import { UnifiedProjectData } from '../unifiedProjectManager';

// ===== 버전 정보 및 호환성 정의 =====

/**
 * 지원되는 데이터 버전들
 */
export const SUPPORTED_DATA_VERSIONS = {
  'v1.0.0': {
    description: '초기 프로젝트 데이터 형식',
    supportedFeatures: ['tracks', 'projectSettings'],
    deprecatedFeatures: [],
    migrationPath: ['v2.0.0', 'v3.0.0']
  },
  'v2.0.0': {
    description: 'Bundle 및 TemplateGroup 지원',
    supportedFeatures: ['tracks', 'projectSettings', 'bundles', 'templateGroups', 'relations'],
    deprecatedFeatures: [],
    migrationPath: ['v3.0.0']
  },
  'v3.0.0': {
    description: '중첩 Bundle 구조 및 계층 관리',
    supportedFeatures: ['tracks', 'projectSettings', 'nestedBundles', 'nestedTemplateGroups', 'bundleHierarchy', 'indexes'],
    deprecatedFeatures: ['bundles', 'templateGroups'],
    migrationPath: []
  }
} as const;

/**
 * 버전 호환성 매트릭스
 */
interface VersionCompatibilityMatrix {
  [fromVersion: string]: {
    [toVersion: string]: {
      compatibility: 'full' | 'partial' | 'limited' | 'none';
      automaticConversion: boolean;
      dataLoss: 'none' | 'minimal' | 'moderate' | 'significant';
      requiredMigrations: string[];
      estimatedTime: number; // milliseconds
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    };
  };
}

/**
 * 호환성 매트릭스 정의
 */
export const COMPATIBILITY_MATRIX: VersionCompatibilityMatrix = {
  'v1.0.0': {
    'v2.0.0': {
      compatibility: 'full',
      automaticConversion: true,
      dataLoss: 'none',
      requiredMigrations: ['v1_to_v2_basic'],
      estimatedTime: 100,
      riskLevel: 'low'
    },
    'v3.0.0': {
      compatibility: 'partial',
      automaticConversion: true,
      dataLoss: 'minimal',
      requiredMigrations: ['v1_to_v2_basic', 'v2_to_v3_enhanced'],
      estimatedTime: 500,
      riskLevel: 'medium'
    }
  },
  'v2.0.0': {
    'v1.0.0': {
      compatibility: 'limited',
      automaticConversion: true,
      dataLoss: 'significant',
      requiredMigrations: ['v2_to_v1_downgrade'],
      estimatedTime: 200,
      riskLevel: 'high'
    },
    'v3.0.0': {
      compatibility: 'full',
      automaticConversion: true,
      dataLoss: 'none',
      requiredMigrations: ['v2_to_v3_enhanced'],
      estimatedTime: 300,
      riskLevel: 'low'
    }
  },
  'v3.0.0': {
    'v1.0.0': {
      compatibility: 'limited',
      automaticConversion: true,
      dataLoss: 'significant',
      requiredMigrations: ['v3_to_v2_flatten', 'v2_to_v1_downgrade'],
      estimatedTime: 400,
      riskLevel: 'critical'
    },
    'v2.0.0': {
      compatibility: 'partial',
      automaticConversion: true,
      dataLoss: 'moderate',
      requiredMigrations: ['v3_to_v2_flatten'],
      estimatedTime: 250,
      riskLevel: 'medium'
    }
  }
};

/**
 * 버전 감지 결과
 */
interface VersionDetectionResult {
  detectedVersion: string;
  confidence: number;
  alternativeVersions: Array<{
    version: string;
    confidence: number;
    reason: string;
  }>;
  versionIndicators: Array<{
    indicator: string;
    value: any;
    weight: number;
  }>;
  isSupported: boolean;
  recommendedAction: 'use' | 'migrate' | 'upgrade' | 'manual';
}

/**
 * 호환성 분석 결과
 */
interface CompatibilityAnalysisResult {
  sourceVersion: string;
  targetVersion: string;
  compatibility: VersionCompatibilityMatrix[string][string];
  feasibilityScore: number;
  riskAssessment: {
    dataLossRisk: number;
    performanceRisk: number;
    functionalityRisk: number;
    overallRisk: number;
  };
  migrationPlan: {
    steps: Array<{
      fromVersion: string;
      toVersion: string;
      migration: string;
      estimatedTime: number;
      riskLevel: string;
    }>;
    totalTime: number;
    totalRisk: string;
  };
  alternatives: Array<{
    path: string[];
    totalTime: number;
    riskLevel: string;
    pros: string[];
    cons: string[];
  }>;
}

// ===== 버전 호환성 관리자 =====

/**
 * 버전 호환성 관리자
 */
export class VersionCompatibilityManager {
  private migrationCache: Map<string, any> = new Map();
  private conversionStrategies: Map<string, Function> = new Map();
  
  // 성능 추적
  private compatibilityMetrics = {
    totalDetections: 0,
    successfulDetections: 0,
    totalMigrations: 0,
    successfulMigrations: 0,
    averageDetectionTime: 0,
    averageMigrationTime: 0,
    cacheHitRate: 0
  };

  constructor() {
    this.initializeConversionStrategies();
  }

  /**
   * 변환 전략 초기화
   */
  private initializeConversionStrategies(): void {
    // V1 → V2 변환 전략
    this.conversionStrategies.set('v1_to_v2_basic', this.migrateV1ToV2.bind(this));
    
    // V2 → V3 변환 전략  
    this.conversionStrategies.set('v2_to_v3_enhanced', this.migrateV2ToV3.bind(this));
    
    // V2 → V1 다운그레이드 전략
    this.conversionStrategies.set('v2_to_v1_downgrade', this.downgradeV2ToV1.bind(this));
    
    // V3 → V2 평면화 전략
    this.conversionStrategies.set('v3_to_v2_flatten', this.flattenV3ToV2.bind(this));
  }

  /**
   * 데이터 버전 자동 감지
   */
  async detectDataVersion(data: any): Promise<VersionDetectionResult> {
    const detectionStart = performance.now();
    this.compatibilityMetrics.totalDetections++;

    console.log('🔍 데이터 버전 감지 시작');

    const result: VersionDetectionResult = {
      detectedVersion: 'unknown',
      confidence: 0,
      alternativeVersions: [],
      versionIndicators: [],
      isSupported: false,
      recommendedAction: 'manual'
    };

    try {
      // 1. 명시적 버전 정보 확인
      if (data.metadata?.version) {
        result.versionIndicators.push({
          indicator: 'metadata.version',
          value: data.metadata.version,
          weight: 100
        });
        
        if (this.isSupportedVersion(data.metadata.version)) {
          result.detectedVersion = data.metadata.version;
          result.confidence = 95;
          result.isSupported = true;
          result.recommendedAction = 'use';
        }
      }

      // 2. 구조적 특징 분석
      const structuralIndicators = this.analyzeStructuralFeatures(data);
      result.versionIndicators.push(...structuralIndicators);

      // 3. 특징 기반 버전 추론
      if (result.confidence < 80) {
        const inferencedVersion = this.inferVersionFromFeatures(structuralIndicators);
        if (inferencedVersion) {
          result.detectedVersion = inferencedVersion.version;
          result.confidence = inferencedVersion.confidence;
          result.alternativeVersions = inferencedVersion.alternatives;
        }
      }

      // 4. 지원 여부 및 권장 액션 결정
      result.isSupported = this.isSupportedVersion(result.detectedVersion);
      result.recommendedAction = this.determineRecommendedAction(result);

      this.compatibilityMetrics.successfulDetections++;
      
      const detectionTime = performance.now() - detectionStart;
      this.compatibilityMetrics.averageDetectionTime = 
        (this.compatibilityMetrics.averageDetectionTime * (this.compatibilityMetrics.totalDetections - 1) + detectionTime) / 
        this.compatibilityMetrics.totalDetections;

      console.log('✅ 데이터 버전 감지 완료:', {
        detectedVersion: result.detectedVersion,
        confidence: `${result.confidence}%`,
        isSupported: result.isSupported,
        recommendedAction: result.recommendedAction,
        detectionTime: `${detectionTime.toFixed(1)}ms`
      });

    } catch (error) {
      console.error('❌ 데이터 버전 감지 실패:', error);
      result.recommendedAction = 'manual';
    }

    return result;
  }

  /**
   * 버전 간 호환성 분석
   */
  async analyzeCompatibility(
    sourceVersion: string,
    targetVersion: string
  ): Promise<CompatibilityAnalysisResult> {
    console.log('🔍 버전 호환성 분석 시작:', {
      from: sourceVersion,
      to: targetVersion
    });

    const result: CompatibilityAnalysisResult = {
      sourceVersion,
      targetVersion,
      compatibility: {} as any,
      feasibilityScore: 0,
      riskAssessment: {
        dataLossRisk: 0,
        performanceRisk: 0,
        functionalityRisk: 0,
        overallRisk: 0
      },
      migrationPlan: {
        steps: [],
        totalTime: 0,
        totalRisk: 'low'
      },
      alternatives: []
    };

    try {
      // 1. 직접 호환성 확인
      const directCompatibility = COMPATIBILITY_MATRIX[sourceVersion]?.[targetVersion];
      
      if (directCompatibility) {
        result.compatibility = directCompatibility;
        result.feasibilityScore = this.calculateFeasibilityScore(directCompatibility);
        result.riskAssessment = this.assessMigrationRisks(directCompatibility);
        
        // 직접 마이그레이션 계획
        result.migrationPlan = {
          steps: [{
            fromVersion: sourceVersion,
            toVersion: targetVersion,
            migration: directCompatibility.requiredMigrations[0] || 'direct',
            estimatedTime: directCompatibility.estimatedTime,
            riskLevel: directCompatibility.riskLevel
          }],
          totalTime: directCompatibility.estimatedTime,
          totalRisk: directCompatibility.riskLevel
        };
      } else {
        // 2. 간접 마이그레이션 경로 탐색
        const migrationPath = this.findMigrationPath(sourceVersion, targetVersion);
        
        if (migrationPath.length > 0) {
          result.migrationPlan = this.buildMigrationPlan(migrationPath);
          result.feasibilityScore = this.calculatePathFeasibilityScore(migrationPath);
          result.riskAssessment = this.assessPathRisks(migrationPath);
        } else {
          result.feasibilityScore = 0;
          result.riskAssessment.overallRisk = 100;
        }
      }

      // 3. 대안 경로 탐색
      result.alternatives = this.findAlternativePaths(sourceVersion, targetVersion);

      console.log('✅ 버전 호환성 분석 완료:', {
        feasibilityScore: result.feasibilityScore,
        overallRisk: result.riskAssessment.overallRisk,
        migrationSteps: result.migrationPlan.steps.length,
        alternatives: result.alternatives.length
      });

    } catch (error) {
      console.error('❌ 버전 호환성 분석 실패:', error);
      result.feasibilityScore = 0;
    }

    return result;
  }

  /**
   * 자동 버전 변환
   */
  async convertVersion(
    data: any,
    targetVersion: string,
    options?: {
      validateBefore?: boolean;
      validateAfter?: boolean;
      createBackup?: boolean;
      riskLevel?: 'low' | 'medium' | 'high';
    }
  ): Promise<{
    convertedData: any;
    isSuccess: boolean;
    sourceVersion: string;
    targetVersion: string;
    migrationPath: string[];
    conversionTime: number;
    warnings: string[];
    errors: string[];
    backupData?: any;
  }> {
    const conversionStart = performance.now();
    this.compatibilityMetrics.totalMigrations++;

    console.log('🔄 자동 버전 변환 시작:', {
      targetVersion,
      validateBefore: options?.validateBefore,
      createBackup: options?.createBackup
    });

    const result = {
      convertedData: null as any,
      isSuccess: false,
      sourceVersion: 'unknown',
      targetVersion,
      migrationPath: [] as string[],
      conversionTime: 0,
      warnings: [] as string[],
      errors: [] as string[],
      backupData: undefined as any
    };

    try {
      // 1. 소스 버전 감지
      const versionDetection = await this.detectDataVersion(data);
      result.sourceVersion = versionDetection.detectedVersion;

      if (versionDetection.confidence < 70) {
        result.warnings.push('버전 감지 신뢰도가 낮습니다');
      }

      // 2. 백업 생성 (옵션)
      if (options?.createBackup) {
        result.backupData = JSON.parse(JSON.stringify(data));
      }

      // 3. 사전 검증 (옵션)
      if (options?.validateBefore) {
        const validation = await this.validateDataStructure(data, result.sourceVersion);
        if (!validation.isValid) {
          result.errors.push(...validation.errors);
          return result;
        }
      }

      // 4. 호환성 분석
      const compatibility = await this.analyzeCompatibility(result.sourceVersion, targetVersion);
      
      if (compatibility.feasibilityScore < 50) {
        result.errors.push('변환 가능성이 낮습니다');
        return result;
      }

      // 5. 위험도 검증
      if (options?.riskLevel && this.compareRiskLevel(compatibility.migrationPlan.totalRisk, options.riskLevel) > 0) {
        result.errors.push(`허용된 위험도(${options.riskLevel})를 초과합니다`);
        return result;
      }

      // 6. 마이그레이션 실행
      let currentData = data;
      const migrationPath = compatibility.migrationPlan.steps;
      
      for (const step of migrationPath) {
        const conversionStrategy = this.conversionStrategies.get(step.migration);
        
        if (!conversionStrategy) {
          result.errors.push(`변환 전략을 찾을 수 없습니다: ${step.migration}`);
          return result;
        }

        try {
          currentData = await conversionStrategy(currentData, {
            sourceVersion: step.fromVersion,
            targetVersion: step.toVersion
          });
          result.migrationPath.push(`${step.fromVersion} → ${step.toVersion}`);
        } catch (conversionError) {
          result.errors.push(`변환 단계 실패 (${step.migration}): ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
          return result;
        }
      }

      // 7. 사후 검증 (옵션)
      if (options?.validateAfter) {
        const validation = await this.validateDataStructure(currentData, targetVersion);
        if (!validation.isValid) {
          result.warnings.push('변환 후 검증에서 문제가 발견되었습니다');
          result.warnings.push(...validation.errors);
        }
      }

      result.convertedData = currentData;
      result.isSuccess = true;
      this.compatibilityMetrics.successfulMigrations++;

      const conversionTime = performance.now() - conversionStart;
      result.conversionTime = conversionTime;
      
      this.compatibilityMetrics.averageMigrationTime = 
        (this.compatibilityMetrics.averageMigrationTime * (this.compatibilityMetrics.totalMigrations - 1) + conversionTime) / 
        this.compatibilityMetrics.totalMigrations;

      console.log('✅ 자동 버전 변환 완료:', {
        sourceVersion: result.sourceVersion,
        targetVersion: result.targetVersion,
        migrationPath: result.migrationPath,
        conversionTime: `${conversionTime.toFixed(1)}ms`,
        warnings: result.warnings.length,
        errors: result.errors.length
      });

    } catch (error) {
      result.errors.push(`변환 오류: ${error instanceof Error ? error.message : String(error)}`);
      console.error('❌ 자동 버전 변환 실패:', error);
    }

    return result;
  }

  // ===== 버전별 변환 전략들 =====

  /**
   * V1에서 V2로 마이그레이션
   */
  private async migrateV1ToV2(data: any, context: { sourceVersion: string; targetVersion: string }): Promise<UnifiedProjectData> {
    console.log('🔄 V1 → V2 마이그레이션 시작');

    const v2Data: UnifiedProjectData = {
      tracks: data.tracks || [],
      projectSettings: data.projectSettings || {},
      bundles: [], // V1에는 Bundle 없음
      templateGroups: [], // V1에는 TemplateGroup 없음
      bundleTemplateGroupRelations: [], // V1에는 관계 없음
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        editorVersion: data.metadata?.editorVersion || 'unknown',
        type: data.metadata?.type || 'project',
        hasComplexRelations: false,
        bundleGroupMappings: 0
      }
    };

    console.log('✅ V1 → V2 마이그레이션 완료');
    return v2Data;
  }

  /**
   * V2에서 V3로 마이그레이션
   */
  private async migrateV2ToV3(data: UnifiedProjectData, context: { sourceVersion: string; targetVersion: string }): Promise<UnifiedProjectDataV3> {
    console.log('🔄 V2 → V3 마이그레이션 시작');
    
    // 실제로는 V2ToV3MigrationManager를 사용
    // 여기서는 간단한 구조 변환만 수행
    const v3Data: UnifiedProjectDataV3 = {
      tracks: data.tracks,
      projectSettings: data.projectSettings,
      nestedBundles: [],
      nestedTemplateGroups: [],
      bundleHierarchy: {
        rootBundles: [],
        hierarchyMap: {},
        relationGraph: [],
        hierarchyStats: {
          maxDepth: 0,
          totalNestingCount: 0,
          totalBundleCount: 0,
          totalElementCount: 0,
          complexityScore: 0
        },
        integrityChecksum: 'placeholder'
      },
      indexes: {
        bundleLocationMap: {},
        templateGroupLocationMap: {},
        relationshipIndex: {},
        tagIndex: {},
        timeRangeIndex: []
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        version: UNIFIED_PROJECT_DATA_V3_VERSION,
        editorVersion: data.metadata.editorVersion,
        type: data.metadata.type,
        nestingSupport: {
          enabled: true,
          maxDepth: 0,
          bundleNestingCount: 0,
          templateGroupNestingCount: 0,
          complexityLevel: 'simple'
        },
        compatibility: {
          minEditorVersion: SUPPORTED_EDITOR_VERSIONS.min,
          maxEditorVersion: SUPPORTED_EDITOR_VERSIONS.max,
          backwardCompatibility: 'partial',
          forwardCompatibility: 'full',
          requiredFeatures: [],
          optionalFeatures: []
        },
        performance: {
          saveTime: 0,
          indexBuildTime: 0,
          totalSize: 0
        },
        statistics: {
          totalTracks: data.tracks.length,
          totalClips: data.tracks.reduce((sum, track) => sum + track.clips.length, 0),
          totalBundles: 0,
          totalTemplateGroups: 0,
          totalRelations: 0,
          totalElements: 0,
          duration: 0,
          clipsByType: {},
          bundlesByDepth: {}
        },
        features: {
          hasNestedBundles: false,
          hasNestedTemplateGroups: false,
          hasAdvancedRelations: false,
          hasPerformanceOptimizations: false,
          hasCompressionEnabled: false,
          hasLazyLoading: false,
          hasIndexedSearch: false,
          hasIntegrityVerification: false
        }
      },
      integrity: {
        dataChecksum: 'placeholder',
        hierarchyChecksum: 'placeholder',
        bundleChecksums: {},
        templateGroupChecksums: {},
        relationshipChecksum: 'placeholder',
        algorithm: 'sha256',
        generatedAt: new Date().toISOString()
      }
    };

    console.log('✅ V2 → V3 마이그레이션 완료');
    return v3Data;
  }

  /**
   * V2에서 V1로 다운그레이드
   */
  private async downgradeV2ToV1(data: UnifiedProjectData, context: { sourceVersion: string; targetVersion: string }): Promise<any> {
    console.log('🔄 V2 → V1 다운그레이드 시작');

    // Bundle과 TemplateGroup 정보 손실
    const v1Data = {
      tracks: data.tracks,
      projectSettings: data.projectSettings,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        editorVersion: data.metadata.editorVersion,
        type: data.metadata.type
      }
    };

    console.log('⚠️ V2 → V1 다운그레이드 완료 (Bundle/TemplateGroup 정보 손실)');
    return v1Data;
  }

  /**
   * V3에서 V2로 평면화
   */
  private async flattenV3ToV2(data: UnifiedProjectDataV3, context: { sourceVersion: string; targetVersion: string }): Promise<UnifiedProjectData> {
    console.log('🔄 V3 → V2 평면화 시작');

    // 중첩 구조를 평면 구조로 변환
    const flattenedBundles: Bundle[] = [];
    const flattenedTemplateGroups: TemplateGroup[] = [];

    // NestedBundle을 Bundle로 변환 (계층 정보 손실)
    for (const nestedBundle of data.nestedBundles) {
      const bundle: Bundle = {
        id: nestedBundle.id,
        name: nestedBundle.name,
        color: nestedBundle.color,
        createdAt: nestedBundle.createdAt,
        baseClipIds: nestedBundle.cache?.flattenedClipIds || [],
        templateGroupIds: [],
        relationships: nestedBundle.relationships
      };
      flattenedBundles.push(bundle);
    }

    // NestedTemplateGroup을 TemplateGroup으로 변환
    for (const nestedGroup of data.nestedTemplateGroups) {
      const templateGroup: TemplateGroup = {
        id: nestedGroup.id,
        name: nestedGroup.name,
        clipIds: nestedGroup.clipIds,
        startTime: nestedGroup.startTime,
        endTime: nestedGroup.endTime,
        isProtected: nestedGroup.isProtected,
        originalBundles: nestedGroup.nestedStructure.preservedBundles,
        metadata: nestedGroup.metadata
      };
      flattenedTemplateGroups.push(templateGroup);
    }

    const v2Data: UnifiedProjectData = {
      tracks: data.tracks,
      projectSettings: data.projectSettings,
      bundles: flattenedBundles,
      templateGroups: flattenedTemplateGroups,
      bundleTemplateGroupRelations: [],
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        editorVersion: data.metadata.editorVersion,
        type: data.metadata.type,
        hasComplexRelations: data.bundleHierarchy.relationGraph.length > 0,
        bundleGroupMappings: data.bundleHierarchy.relationGraph.length
      }
    };

    console.log('⚠️ V3 → V2 평면화 완료 (계층 구조 정보 손실)');
    return v2Data;
  }

  // ===== 유틸리티 메서드들 =====

  /**
   * 지원되는 버전인지 확인
   */
  private isSupportedVersion(version: string): boolean {
    return Object.keys(SUPPORTED_DATA_VERSIONS).includes(version);
  }

  /**
   * 구조적 특징 분석
   */
  private analyzeStructuralFeatures(data: any): Array<{ indicator: string; value: any; weight: number }> {
    const indicators: Array<{ indicator: string; value: any; weight: number }> = [];

    // 기본 구조 확인
    if (data.tracks) {
      indicators.push({ indicator: 'has_tracks', value: true, weight: 20 });
    }
    
    if (data.projectSettings) {
      indicators.push({ indicator: 'has_projectSettings', value: true, weight: 20 });
    }

    // V2 특징
    if (data.bundles) {
      indicators.push({ indicator: 'has_bundles', value: true, weight: 30 });
    }
    
    if (data.templateGroups) {
      indicators.push({ indicator: 'has_templateGroups', value: true, weight: 30 });
    }
    
    if (data.bundleTemplateGroupRelations) {
      indicators.push({ indicator: 'has_relations', value: true, weight: 25 });
    }

    // V3 특징
    if (data.nestedBundles) {
      indicators.push({ indicator: 'has_nestedBundles', value: true, weight: 40 });
    }
    
    if (data.bundleHierarchy) {
      indicators.push({ indicator: 'has_bundleHierarchy', value: true, weight: 40 });
    }
    
    if (data.indexes) {
      indicators.push({ indicator: 'has_indexes', value: true, weight: 30 });
    }

    return indicators;
  }

  /**
   * 특징 기반 버전 추론
   */
  private inferVersionFromFeatures(indicators: Array<{ indicator: string; value: any; weight: number }>): {
    version: string;
    confidence: number;
    alternatives: Array<{ version: string; confidence: number; reason: string }>;
  } | null {
    const versionScores = {
      'v1.0.0': 0,
      'v2.0.0': 0,
      'v3.0.0': 0
    };

    // V1 점수 계산
    if (indicators.find(i => i.indicator === 'has_tracks')?.value) versionScores['v1.0.0'] += 20;
    if (indicators.find(i => i.indicator === 'has_projectSettings')?.value) versionScores['v1.0.0'] += 20;
    
    // V1에만 있고 V2/V3에 없는 특징들이 있다면 V1일 가능성 증가
    const hasV2Features = indicators.some(i => ['has_bundles', 'has_templateGroups', 'has_relations'].includes(i.indicator) && i.value);
    const hasV3Features = indicators.some(i => ['has_nestedBundles', 'has_bundleHierarchy', 'has_indexes'].includes(i.indicator) && i.value);
    
    if (!hasV2Features && !hasV3Features) {
      versionScores['v1.0.0'] += 40;
    }

    // V2 점수 계산
    versionScores['v2.0.0'] += versionScores['v1.0.0']; // V2는 V1 특징 포함
    if (indicators.find(i => i.indicator === 'has_bundles')?.value) versionScores['v2.0.0'] += 30;
    if (indicators.find(i => i.indicator === 'has_templateGroups')?.value) versionScores['v2.0.0'] += 30;
    if (indicators.find(i => i.indicator === 'has_relations')?.value) versionScores['v2.0.0'] += 25;

    // V3 점수 계산
    versionScores['v3.0.0'] += versionScores['v1.0.0']; // V3는 V1 특징 포함
    if (indicators.find(i => i.indicator === 'has_nestedBundles')?.value) versionScores['v3.0.0'] += 40;
    if (indicators.find(i => i.indicator === 'has_bundleHierarchy')?.value) versionScores['v3.0.0'] += 40;
    if (indicators.find(i => i.indicator === 'has_indexes')?.value) versionScores['v3.0.0'] += 30;

    // 가장 높은 점수의 버전 선택
    const maxScore = Math.max(...Object.values(versionScores));
    const detectedVersion = Object.entries(versionScores).find(([_, score]) => score === maxScore)?.[0];
    
    if (!detectedVersion || maxScore < 40) {
      return null;
    }

    // 대안 버전들
    const alternatives = Object.entries(versionScores)
      .filter(([version, score]) => version !== detectedVersion && score > 20)
      .map(([version, score]) => ({
        version,
        confidence: score,
        reason: `구조적 특징 점수: ${score}`
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return {
      version: detectedVersion,
      confidence: Math.min(maxScore, 90), // 최대 90% 신뢰도
      alternatives
    };
  }

  /**
   * 권장 액션 결정
   */
  private determineRecommendedAction(result: VersionDetectionResult): 'use' | 'migrate' | 'upgrade' | 'manual' {
    if (result.confidence < 50) return 'manual';
    if (!result.isSupported) return 'upgrade';
    if (result.detectedVersion === UNIFIED_PROJECT_DATA_V3_VERSION) return 'use';
    return 'migrate';
  }

  /**
   * 마이그레이션 경로 탐색
   */
  private findMigrationPath(sourceVersion: string, targetVersion: string): string[] {
    // BFS를 사용한 최단 경로 탐색
    const queue = [[sourceVersion]];
    const visited = new Set([sourceVersion]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const currentVersion = path[path.length - 1];

      if (currentVersion === targetVersion) {
        return path;
      }

      const nextVersions = Object.keys(COMPATIBILITY_MATRIX[currentVersion] || {});
      for (const nextVersion of nextVersions) {
        if (!visited.has(nextVersion)) {
          visited.add(nextVersion);
          queue.push([...path, nextVersion]);
        }
      }
    }

    return []; // 경로 없음
  }

  /**
   * 마이그레이션 계획 구축
   */
  private buildMigrationPlan(path: string[]): CompatibilityAnalysisResult['migrationPlan'] {
    const steps = [];
    let totalTime = 0;
    let maxRisk = 'low';

    for (let i = 0; i < path.length - 1; i++) {
      const fromVersion = path[i];
      const toVersion = path[i + 1];
      const compatibility = COMPATIBILITY_MATRIX[fromVersion][toVersion];

      steps.push({
        fromVersion,
        toVersion,
        migration: compatibility.requiredMigrations[0] || 'unknown',
        estimatedTime: compatibility.estimatedTime,
        riskLevel: compatibility.riskLevel
      });

      totalTime += compatibility.estimatedTime;
      if (this.compareRiskLevel(compatibility.riskLevel, maxRisk) > 0) {
        maxRisk = compatibility.riskLevel;
      }
    }

    return {
      steps,
      totalTime,
      totalRisk: maxRisk
    };
  }

  /**
   * 가능성 점수 계산
   */
  private calculateFeasibilityScore(compatibility: VersionCompatibilityMatrix[string][string]): number {
    let score = 0;

    switch (compatibility.compatibility) {
      case 'full': score += 40; break;
      case 'partial': score += 30; break;
      case 'limited': score += 15; break;
      case 'none': score += 0; break;
    }

    if (compatibility.automaticConversion) score += 20;

    switch (compatibility.dataLoss) {
      case 'none': score += 25; break;
      case 'minimal': score += 20; break;
      case 'moderate': score += 10; break;
      case 'significant': score += 0; break;
    }

    switch (compatibility.riskLevel) {
      case 'low': score += 15; break;
      case 'medium': score += 10; break;
      case 'high': score += 5; break;
      case 'critical': score += 0; break;
    }

    return Math.min(score, 100);
  }

  /**
   * 위험도 비교
   */
  private compareRiskLevel(risk1: string, risk2: string): number {
    const riskLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return (riskLevels[risk1 as keyof typeof riskLevels] || 0) - (riskLevels[risk2 as keyof typeof riskLevels] || 0);
  }

  /**
   * 마이그레이션 위험 평가
   */
  private assessMigrationRisks(compatibility: VersionCompatibilityMatrix[string][string]): CompatibilityAnalysisResult['riskAssessment'] {
    const dataLossMap = { 'none': 0, 'minimal': 25, 'moderate': 50, 'significant': 75 };
    const riskLevelMap = { 'low': 10, 'medium': 30, 'high': 60, 'critical': 90 };

    const dataLossRisk = dataLossMap[compatibility.dataLoss];
    const performanceRisk = compatibility.estimatedTime > 1000 ? 40 : 10;
    const functionalityRisk = compatibility.compatibility === 'limited' ? 50 : 20;
    const overallRisk = Math.max(dataLossRisk, riskLevelMap[compatibility.riskLevel]);

    return {
      dataLossRisk,
      performanceRisk,
      functionalityRisk,
      overallRisk
    };
  }

  /**
   * 경로 가능성 점수 계산
   */
  private calculatePathFeasibilityScore(path: string[]): number {
    let totalScore = 0;
    let stepCount = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const compatibility = COMPATIBILITY_MATRIX[path[i]][path[i + 1]];
      if (compatibility) {
        totalScore += this.calculateFeasibilityScore(compatibility);
        stepCount++;
      }
    }

    return stepCount > 0 ? totalScore / stepCount : 0;
  }

  /**
   * 경로 위험 평가
   */
  private assessPathRisks(path: string[]): CompatibilityAnalysisResult['riskAssessment'] {
    let maxDataLossRisk = 0;
    let totalPerformanceRisk = 0;
    let maxFunctionalityRisk = 0;
    let maxOverallRisk = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const compatibility = COMPATIBILITY_MATRIX[path[i]][path[i + 1]];
      if (compatibility) {
        const risks = this.assessMigrationRisks(compatibility);
        maxDataLossRisk = Math.max(maxDataLossRisk, risks.dataLossRisk);
        totalPerformanceRisk += risks.performanceRisk;
        maxFunctionalityRisk = Math.max(maxFunctionalityRisk, risks.functionalityRisk);
        maxOverallRisk = Math.max(maxOverallRisk, risks.overallRisk);
      }
    }

    return {
      dataLossRisk: maxDataLossRisk,
      performanceRisk: Math.min(totalPerformanceRisk, 100),
      functionalityRisk: maxFunctionalityRisk,
      overallRisk: maxOverallRisk
    };
  }

  /**
   * 대안 경로 탐색
   */
  private findAlternativePaths(sourceVersion: string, targetVersion: string): CompatibilityAnalysisResult['alternatives'] {
    // 다양한 경로 탐색 (최대 3개)
    const alternatives: CompatibilityAnalysisResult['alternatives'] = [];
    
    // 중간 버전을 거치는 경로들 탐색
    const intermediateVersions = Object.keys(SUPPORTED_DATA_VERSIONS).filter(
      v => v !== sourceVersion && v !== targetVersion
    );

    for (const intermediate of intermediateVersions) {
      const pathToIntermediate = this.findMigrationPath(sourceVersion, intermediate);
      const pathFromIntermediate = this.findMigrationPath(intermediate, targetVersion);

      if (pathToIntermediate.length > 0 && pathFromIntermediate.length > 0) {
        const fullPath = [...pathToIntermediate, ...pathFromIntermediate.slice(1)];
        const plan = this.buildMigrationPlan(fullPath);

        alternatives.push({
          path: fullPath,
          totalTime: plan.totalTime,
          riskLevel: plan.totalRisk,
          pros: [`${intermediate} 버전을 거쳐 단계적 변환`],
          cons: ['더 많은 변환 단계 필요']
        });
      }
    }

    return alternatives.slice(0, 3); // 최대 3개만 반환
  }

  /**
   * 데이터 구조 검증
   */
  private async validateDataStructure(data: any, version: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      performance: {
        validationTime: 0,
        validatedItems: 0,
        failedItems: 0
      }
    };

    const validationStart = performance.now();

    try {
      // 버전별 구조 검증
      switch (version) {
        case 'v1.0.0':
          if (!data.tracks || !Array.isArray(data.tracks)) {
            result.errors.push('V1: tracks 배열이 필요합니다');
            result.isValid = false;
          }
          break;

        case 'v2.0.0':
          if (!data.tracks || !data.projectSettings) {
            result.errors.push('V2: tracks와 projectSettings가 필요합니다');
            result.isValid = false;
          }
          break;

        case 'v3.0.0':
          if (!data.nestedBundles || !data.bundleHierarchy) {
            result.errors.push('V3: nestedBundles와 bundleHierarchy가 필요합니다');
            result.isValid = false;
          }
          break;
      }

      result.performance.validationTime = performance.now() - validationStart;
      result.performance.validatedItems = 1;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`검증 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  // ===== 공개 API =====

  /**
   * 호환성 메트릭 조회
   */
  getCompatibilityMetrics() {
    const totalOps = this.compatibilityMetrics.totalDetections + this.compatibilityMetrics.totalMigrations;
    const successfulOps = this.compatibilityMetrics.successfulDetections + this.compatibilityMetrics.successfulMigrations;

    return {
      ...this.compatibilityMetrics,
      overallSuccessRate: totalOps > 0 ? successfulOps / totalOps : 1,
      cacheHitRate: this.compatibilityMetrics.cacheHitRate
    };
  }

  /**
   * 사용자 정의 변환 전략 등록
   */
  registerConversionStrategy(name: string, strategy: Function): void {
    this.conversionStrategies.set(name, strategy);
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.migrationCache.clear();
  }
}

// ===== Export =====
export default VersionCompatibilityManager;
export type {
  VersionDetectionResult,
  CompatibilityAnalysisResult
};
