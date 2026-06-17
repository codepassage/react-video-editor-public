/**
 * @fileoverview 중첩 구조 복원 시스템
 * @description 손상된 중첩 Bundle 계층 구조를 감지하고 자동으로 복원하는 시스템
 * @version 1.0.0
 * @created 2025-06-22
 */

import {
  NestedBundle,
  NestedTemplateGroup,
  BundleElement,
  BundleHierarchyNode,
  NestedBundleRelation,
  ValidationResult,
  BundleElementType,
  RelationshipType
} from '../../../types/nested';

import {
  UnifiedProjectDataV3,
  NestedBundleHierarchy
} from './UnifiedProjectDataV3';

// ===== 구조 손상 유형 정의 =====

/**
 * 구조 손상 유형
 */
type StructureDamageType = 
  | 'orphaned_elements'      // 고아 요소들
  | 'circular_references'    // 순환 참조
  | 'broken_relationships'   // 깨진 관계
  | 'missing_parents'        // 누락된 부모
  | 'duplicate_references'   // 중복 참조
  | 'invalid_depths'         // 잘못된 깊이
  | 'corrupted_paths'        // 손상된 경로
  | 'inconsistent_metadata'  // 일관성 없는 메타데이터
  | 'timing_conflicts'       // 시간 충돌
  | 'index_mismatches';      // 인덱스 불일치

/**
 * 구조 손상 정보
 */
interface StructureDamage {
  type: StructureDamageType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedElements: string[];
  detectiveProcedure: string;
  repairStrategies: RepairStrategy[];
  autoRepairPossible: boolean;
  estimatedRepairTime: number;
  dataLossRisk: 'none' | 'minimal' | 'moderate' | 'significant';
  cascadeEffects: string[];
}

/**
 * 복원 전략
 */
interface RepairStrategy {
  name: string;
  description: string;
  priority: number;
  riskLevel: 'low' | 'medium' | 'high';
  successRate: number;
  sideEffects: string[];
  requiredResources: string[];
  estimatedTime: number;
  rollbackPossible: boolean;
}

/**
 * 복원 작업 결과
 */
interface RepairResult {
  isSuccess: boolean;
  strategy: RepairStrategy;
  appliedChanges: Array<{
    type: 'create' | 'update' | 'delete' | 'move';
    target: string;
    before: any;
    after: any;
    timestamp: number;
  }>;
  resolvedDamages: StructureDamage[];
  remainingDamages: StructureDamage[];
  newlyCreatedDamages: StructureDamage[];
  performance: {
    repairTime: number;
    elementsProcessed: number;
    relationsRepaired: number;
    backupSize: number;
  };
  warnings: string[];
  errors: string[];
}

/**
 * 구조 복원 컨텍스트
 */
interface StructureRestorationContext {
  originalData: UnifiedProjectDataV3;
  workingData: UnifiedProjectDataV3;
  detectedDamages: StructureDamage[];
  repairHistory: RepairResult[];
  rollbackStack: Array<{
    stepId: string;
    dataSnapshot: UnifiedProjectDataV3;
    timestamp: number;
  }>;
  progressCallback?: (progress: {
    stage: string;
    percentage: number;
    currentDamage?: StructureDamage;
    estimatedTimeRemaining: number;
  }) => void;
}

// ===== 중첩 구조 복원 시스템 =====

/**
 * 중첩 구조 복원 관리자
 */
export class NestedStructureRestorer {
  private repairStrategies: Map<StructureDamageType, RepairStrategy[]> = new Map();
  private damageDetectors: Map<StructureDamageType, Function> = new Map();
  
  // 성능 추적
  private restorationMetrics = {
    totalRestorations: 0,
    successfulRestorations: 0,
    averageRestorationTime: 0,
    totalDamagesDetected: 0,
    totalDamagesRepaired: 0,
    averageDetectionAccuracy: 0
  };

  constructor() {
    this.initializeRepairStrategies();
    this.initializeDamageDetectors();
  }

  /**
   * 복원 전략 초기화
   */
  private initializeRepairStrategies(): void {
    // 고아 요소 복원 전략
    this.repairStrategies.set('orphaned_elements', [
      {
        name: 'parent_inference',
        description: '시간 범위와 위치를 기반으로 부모 추론',
        priority: 1,
        riskLevel: 'low',
        successRate: 85,
        sideEffects: ['새로운 관계 생성'],
        requiredResources: ['시간 정보', '위치 정보'],
        estimatedTime: 100,
        rollbackPossible: true
      },
      {
        name: 'root_adoption',
        description: '루트 레벨로 이동하여 독립적 요소로 설정',
        priority: 2,
        riskLevel: 'medium',
        successRate: 95,
        sideEffects: ['계층 구조 평면화'],
        requiredResources: [],
        estimatedTime: 50,
        rollbackPossible: true
      }
    ]);

    // 순환 참조 복원 전략
    this.repairStrategies.set('circular_references', [
      {
        name: 'break_weakest_link',
        description: '가장 약한 관계 연결 끊기',
        priority: 1,
        riskLevel: 'medium',
        successRate: 90,
        sideEffects: ['관계 손실'],
        requiredResources: ['관계 강도 분석'],
        estimatedTime: 150,
        rollbackPossible: true
      },
      {
        name: 'hierarchy_reconstruction',
        description: '전체 계층 구조 재구성',
        priority: 2,
        riskLevel: 'high',
        successRate: 75,
        sideEffects: ['대량 구조 변경'],
        requiredResources: ['전체 구조 분석'],
        estimatedTime: 500,
        rollbackPossible: false
      }
    ]);

    // 깨진 관계 복원 전략
    this.repairStrategies.set('broken_relationships', [
      {
        name: 'reference_repair',
        description: 'ID 참조 복구 및 관계 재연결',
        priority: 1,
        riskLevel: 'low',
        successRate: 80,
        sideEffects: [],
        requiredResources: ['ID 매핑'],
        estimatedTime: 75,
        rollbackPossible: true
      },
      {
        name: 'relationship_recreation',
        description: '관계 정보 재생성',
        priority: 2,
        riskLevel: 'medium',
        successRate: 70,
        sideEffects: ['새로운 관계 메타데이터'],
        requiredResources: ['구조 분석'],
        estimatedTime: 200,
        rollbackPossible: true
      }
    ]);

    // 기타 손상 유형들에 대한 전략들...
    this.initializeAdditionalStrategies();
  }

  /**
   * 추가 복원 전략 초기화
   */
  private initializeAdditionalStrategies(): void {
    // 누락된 부모 복원
    this.repairStrategies.set('missing_parents', [
      {
        name: 'parent_recreation',
        description: '메타데이터를 기반으로 부모 Bundle 재생성',
        priority: 1,
        riskLevel: 'medium',
        successRate: 75,
        sideEffects: ['새로운 Bundle 생성'],
        requiredResources: ['메타데이터', '시간 정보'],
        estimatedTime: 300,
        rollbackPossible: true
      }
    ]);

    // 중복 참조 복원
    this.repairStrategies.set('duplicate_references', [
      {
        name: 'deduplication',
        description: '중복 참조 제거 및 정리',
        priority: 1,
        riskLevel: 'low',
        successRate: 95,
        sideEffects: [],
        requiredResources: [],
        estimatedTime: 50,
        rollbackPossible: true
      }
    ]);

    // 잘못된 깊이 복원
    this.repairStrategies.set('invalid_depths', [
      {
        name: 'depth_recalculation',
        description: '계층 구조 기반 깊이 재계산',
        priority: 1,
        riskLevel: 'low',
        successRate: 90,
        sideEffects: ['깊이 메타데이터 변경'],
        requiredResources: ['계층 구조'],
        estimatedTime: 100,
        rollbackPossible: true
      }
    ]);

    // 손상된 경로 복원
    this.repairStrategies.set('corrupted_paths', [
      {
        name: 'path_regeneration',
        description: '계층 구조 기반 경로 재생성',
        priority: 1,
        riskLevel: 'low',
        successRate: 95,
        sideEffects: ['경로 문자열 변경'],
        requiredResources: ['계층 구조'],
        estimatedTime: 75,
        rollbackPossible: true
      }
    ]);
  }

  /**
   * 손상 감지기 초기화
   */
  private initializeDamageDetectors(): void {
    this.damageDetectors.set('orphaned_elements', this.detectOrphanedElements.bind(this));
    this.damageDetectors.set('circular_references', this.detectCircularReferences.bind(this));
    this.damageDetectors.set('broken_relationships', this.detectBrokenRelationships.bind(this));
    this.damageDetectors.set('missing_parents', this.detectMissingParents.bind(this));
    this.damageDetectors.set('duplicate_references', this.detectDuplicateReferences.bind(this));
    this.damageDetectors.set('invalid_depths', this.detectInvalidDepths.bind(this));
    this.damageDetectors.set('corrupted_paths', this.detectCorruptedPaths.bind(this));
    this.damageDetectors.set('inconsistent_metadata', this.detectInconsistentMetadata.bind(this));
    this.damageDetectors.set('timing_conflicts', this.detectTimingConflicts.bind(this));
    this.damageDetectors.set('index_mismatches', this.detectIndexMismatches.bind(this));
  }

  /**
   * 중첩 구조 복원 실행
   */
  async restoreNestedStructure(
    data: UnifiedProjectDataV3,
    options?: {
      repairMode?: 'conservative' | 'balanced' | 'aggressive';
      maxRepairAttempts?: number;
      progressCallback?: StructureRestorationContext['progressCallback'];
      createBackup?: boolean;
      autoApprove?: boolean;
    }
  ): Promise<{
    restoredData: UnifiedProjectDataV3;
    isSuccess: boolean;
    detectedDamages: StructureDamage[];
    repairResults: RepairResult[];
    totalRepairTime: number;
    backupData?: UnifiedProjectDataV3;
    summary: {
      totalDamages: number;
      repairedDamages: number;
      unrepairedDamages: number;
      newDamages: number;
      dataIntegrityScore: number;
    };
  }> {
    const restorationStart = performance.now();
    this.restorationMetrics.totalRestorations++;

    console.log('🔧 중첩 구조 복원 시작:', {
      repairMode: options?.repairMode || 'balanced',
      maxAttempts: options?.maxRepairAttempts || 10,
      createBackup: options?.createBackup || true
    });

    const result = {
      restoredData: JSON.parse(JSON.stringify(data)), // 깊은 복사
      isSuccess: false,
      detectedDamages: [] as StructureDamage[],
      repairResults: [] as RepairResult[],
      totalRepairTime: 0,
      backupData: undefined as UnifiedProjectDataV3 | undefined,
      summary: {
        totalDamages: 0,
        repairedDamages: 0,
        unrepairedDamages: 0,
        newDamages: 0,
        dataIntegrityScore: 0
      }
    };

    try {
      // 1. 백업 생성 (옵션)
      if (options?.createBackup) {
        result.backupData = JSON.parse(JSON.stringify(data));
      }

      // 2. 복원 컨텍스트 초기화
      const context = await this.initializeRestorationContext(data, options?.progressCallback);

      // 3. 구조 손상 감지
      options?.progressCallback?.({
        stage: '구조 손상 감지 중',
        percentage: 10,
        estimatedTimeRemaining: 0
      });

      result.detectedDamages = await this.detectAllStructureDamages(context.workingData);
      context.detectedDamages = result.detectedDamages;
      result.summary.totalDamages = result.detectedDamages.length;

      console.log('🔍 구조 손상 감지 완료:', {
        totalDamages: result.detectedDamages.length,
        criticalDamages: result.detectedDamages.filter(d => d.severity === 'critical').length,
        highDamages: result.detectedDamages.filter(d => d.severity === 'high').length
      });

      // 4. 손상이 없으면 조기 종료
      if (result.detectedDamages.length === 0) {
        result.isSuccess = true;
        result.summary.dataIntegrityScore = 100;
        console.log('✅ 구조 손상이 발견되지 않음 - 복원 불필요');
        return result;
      }

      // 5. 복원 계획 수립
      const repairPlan = this.createRepairPlan(result.detectedDamages, options?.repairMode || 'balanced');
      console.log('📋 복원 계획 수립 완료:', {
        plannedRepairs: repairPlan.length,
        estimatedTime: repairPlan.reduce((sum, plan) => sum + plan.strategy.estimatedTime, 0)
      });

      // 6. 복원 실행
      let repairAttempts = 0;
      const maxAttempts = options?.maxRepairAttempts || 10;

      for (const repairPlan_item of repairPlan) {
        if (repairAttempts >= maxAttempts) {
          console.warn('⚠️ 최대 복원 시도 횟수 도달');
          break;
        }

        options?.progressCallback?.({
          stage: `${repairPlan_item.damage.type} 복원 중`,
          percentage: 20 + (repairAttempts / repairPlan.length) * 70,
          currentDamage: repairPlan_item.damage,
          estimatedTimeRemaining: (repairPlan.length - repairAttempts) * repairPlan_item.strategy.estimatedTime
        });

        const repairResult = await this.executeRepair(
          repairPlan_item.damage,
          repairPlan_item.strategy,
          context
        );

        result.repairResults.push(repairResult);
        repairAttempts++;

        if (repairResult.isSuccess) {
          result.summary.repairedDamages++;
          console.log('✅ 복원 성공:', {
            damageType: repairPlan_item.damage.type,
            strategy: repairPlan_item.strategy.name,
            repairTime: `${repairResult.performance.repairTime.toFixed(1)}ms`
          });
        } else {
          result.summary.unrepairedDamages++;
          console.warn('⚠️ 복원 실패:', {
            damageType: repairPlan_item.damage.type,
            strategy: repairPlan_item.strategy.name,
            errors: repairResult.errors
          });
        }

        // 새로운 손상 검사
        const newDamages = await this.detectNewDamagesAfterRepair(context.workingData, repairResult);
        result.summary.newDamages += newDamages.length;
        context.detectedDamages.push(...newDamages);
      }

      // 7. 최종 무결성 검증
      options?.progressCallback?.({
        stage: '최종 무결성 검증 중',
        percentage: 95,
        estimatedTimeRemaining: 100
      });

      const finalValidation = await this.validateFinalStructure(context.workingData);
      result.summary.dataIntegrityScore = finalValidation.integrityScore;

      result.restoredData = context.workingData;
      result.isSuccess = result.summary.dataIntegrityScore >= 80; // 80% 이상이면 성공으로 간주

      // 8. 성능 메트릭 업데이트
      const totalRepairTime = performance.now() - restorationStart;
      result.totalRepairTime = totalRepairTime;

      if (result.isSuccess) {
        this.restorationMetrics.successfulRestorations++;
      }

      this.restorationMetrics.averageRestorationTime = 
        (this.restorationMetrics.averageRestorationTime * (this.restorationMetrics.totalRestorations - 1) + totalRepairTime) / 
        this.restorationMetrics.totalRestorations;

      this.restorationMetrics.totalDamagesDetected += result.detectedDamages.length;
      this.restorationMetrics.totalDamagesRepaired += result.summary.repairedDamages;

      options?.progressCallback?.({
        stage: '복원 완료',
        percentage: 100,
        estimatedTimeRemaining: 0
      });

      console.log('✅ 중첩 구조 복원 완료:', {
        totalRepairTime: `${totalRepairTime.toFixed(1)}ms`,
        isSuccess: result.isSuccess,
        dataIntegrityScore: `${result.summary.dataIntegrityScore}%`,
        summary: result.summary
      });

    } catch (error) {
      console.error('❌ 중첩 구조 복원 실패:', error);
      result.isSuccess = false;
    }

    return result;
  }

  // ===== 손상 감지 메서드들 =====

  /**
   * 모든 구조 손상 감지
   */
  private async detectAllStructureDamages(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const allDamages: StructureDamage[] = [];

    console.log('🔍 전체 구조 손상 감지 시작');

    for (const [damageType, detector] of this.damageDetectors) {
      try {
        const damages = await detector(data);
        allDamages.push(...damages);
      } catch (error) {
        console.warn(`${damageType} 감지 중 오류:`, error);
      }
    }

    // 심각도 순으로 정렬
    allDamages.sort((a, b) => {
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    console.log('🔍 전체 구조 손상 감지 완료:', {
      totalDamages: allDamages.length,
      byType: allDamages.reduce((acc, damage) => {
        acc[damage.type] = (acc[damage.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    return allDamages;
  }

  /**
   * 고아 요소 감지
   */
  private async detectOrphanedElements(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    const allElementIds = new Set<string>();
    const referencedElementIds = new Set<string>();

    // 모든 요소 ID 수집
    for (const bundle of data.nestedBundles) {
      for (const element of bundle.elements) {
        allElementIds.add(element.id);
      }
    }

    // 참조된 요소 ID 수집
    for (const relation of data.bundleHierarchy.relationGraph) {
      referencedElementIds.add(relation.parentBundleId);
      referencedElementIds.add(relation.childBundleId);
    }

    // 고아 요소 찾기
    const orphanedElements = Array.from(allElementIds).filter(id => !referencedElementIds.has(id));

    if (orphanedElements.length > 0) {
      damages.push({
        type: 'orphaned_elements',
        severity: orphanedElements.length > 10 ? 'high' : 'medium',
        description: `${orphanedElements.length}개의 고아 요소가 발견되었습니다`,
        affectedElements: orphanedElements,
        detectiveProcedure: 'reference_analysis',
        repairStrategies: this.repairStrategies.get('orphaned_elements') || [],
        autoRepairPossible: true,
        estimatedRepairTime: orphanedElements.length * 50,
        dataLossRisk: 'minimal',
        cascadeEffects: ['계층 구조 변경 가능']
      });
    }

    return damages;
  }

  /**
   * 순환 참조 감지
   */
  private async detectCircularReferences(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularPaths: string[][] = [];

    const dfs = (bundleId: string, path: string[]): void => {
      if (recursionStack.has(bundleId)) {
        // 순환 참조 발견
        const cycleStart = path.indexOf(bundleId);
        if (cycleStart !== -1) {
          circularPaths.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(bundleId)) return;

      visited.add(bundleId);
      recursionStack.add(bundleId);

      // 자식 Bundle들 확인
      const childRelations = data.bundleHierarchy.relationGraph.filter(
        rel => rel.parentBundleId === bundleId
      );

      for (const relation of childRelations) {
        dfs(relation.childBundleId, [...path, bundleId]);
      }

      recursionStack.delete(bundleId);
    };

    // 모든 루트 Bundle에서 DFS 시작
    for (const rootBundleId of data.bundleHierarchy.rootBundles) {
      dfs(rootBundleId, []);
    }

    if (circularPaths.length > 0) {
      damages.push({
        type: 'circular_references',
        severity: 'critical',
        description: `${circularPaths.length}개의 순환 참조가 발견되었습니다`,
        affectedElements: Array.from(new Set(circularPaths.flat())),
        detectiveProcedure: 'depth_first_search',
        repairStrategies: this.repairStrategies.get('circular_references') || [],
        autoRepairPossible: true,
        estimatedRepairTime: circularPaths.length * 200,
        dataLossRisk: 'moderate',
        cascadeEffects: ['관계 손실', '계층 구조 재구성']
      });
    }

    return damages;
  }

  /**
   * 깨진 관계 감지
   */
  private async detectBrokenRelationships(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    const bundleIds = new Set(data.nestedBundles.map(bundle => bundle.id));
    const brokenRelations: string[] = [];

    for (const relation of data.bundleHierarchy.relationGraph) {
      if (!bundleIds.has(relation.parentBundleId) || !bundleIds.has(relation.childBundleId)) {
        brokenRelations.push(relation.id);
      }
    }

    if (brokenRelations.length > 0) {
      damages.push({
        type: 'broken_relationships',
        severity: brokenRelations.length > 5 ? 'high' : 'medium',
        description: `${brokenRelations.length}개의 깨진 관계가 발견되었습니다`,
        affectedElements: brokenRelations,
        detectiveProcedure: 'reference_validation',
        repairStrategies: this.repairStrategies.get('broken_relationships') || [],
        autoRepairPossible: true,
        estimatedRepairTime: brokenRelations.length * 100,
        dataLossRisk: 'minimal',
        cascadeEffects: ['관계 정리']
      });
    }

    return damages;
  }

  /**
   * 누락된 부모 감지
   */
  private async detectMissingParents(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    const bundleIds = new Set(data.nestedBundles.map(bundle => bundle.id));
    const elementsWithMissingParents: string[] = [];

    for (const bundle of data.nestedBundles) {
      for (const element of bundle.elements) {
        if (element.parentId && !bundleIds.has(element.parentId)) {
          elementsWithMissingParents.push(element.id);
        }
      }
    }

    if (elementsWithMissingParents.length > 0) {
      damages.push({
        type: 'missing_parents',
        severity: 'medium',
        description: `${elementsWithMissingParents.length}개의 요소에 누락된 부모가 있습니다`,
        affectedElements: elementsWithMissingParents,
        detectiveProcedure: 'parent_reference_check',
        repairStrategies: this.repairStrategies.get('missing_parents') || [],
        autoRepairPossible: false,
        estimatedRepairTime: elementsWithMissingParents.length * 150,
        dataLossRisk: 'minimal',
        cascadeEffects: ['새로운 Bundle 생성 가능']
      });
    }

    return damages;
  }

  /**
   * 중복 참조 감지
   */
  private async detectDuplicateReferences(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    const relationKeys = new Set<string>();
    const duplicateRelations: string[] = [];

    for (const relation of data.bundleHierarchy.relationGraph) {
      const key = `${relation.parentBundleId}-${relation.childBundleId}`;
      if (relationKeys.has(key)) {
        duplicateRelations.push(relation.id);
      } else {
        relationKeys.add(key);
      }
    }

    if (duplicateRelations.length > 0) {
      damages.push({
        type: 'duplicate_references',
        severity: 'low',
        description: `${duplicateRelations.length}개의 중복 참조가 발견되었습니다`,
        affectedElements: duplicateRelations,
        detectiveProcedure: 'duplicate_detection',
        repairStrategies: this.repairStrategies.get('duplicate_references') || [],
        autoRepairPossible: true,
        estimatedRepairTime: duplicateRelations.length * 25,
        dataLossRisk: 'none',
        cascadeEffects: []
      });
    }

    return damages;
  }

  /**
   * 잘못된 깊이 감지
   */
  private async detectInvalidDepths(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    const elementsWithInvalidDepth: string[] = [];

    // 실제 깊이 계산
    const actualDepths = this.calculateActualDepths(data.bundleHierarchy);

    for (const bundle of data.nestedBundles) {
      const actualDepth = actualDepths.get(bundle.id) || 0;
      if (bundle.hierarchy.depth !== actualDepth) {
        elementsWithInvalidDepth.push(bundle.id);
      }
    }

    if (elementsWithInvalidDepth.length > 0) {
      damages.push({
        type: 'invalid_depths',
        severity: 'low',
        description: `${elementsWithInvalidDepth.length}개의 요소에 잘못된 깊이 정보가 있습니다`,
        affectedElements: elementsWithInvalidDepth,
        detectiveProcedure: 'depth_calculation',
        repairStrategies: this.repairStrategies.get('invalid_depths') || [],
        autoRepairPossible: true,
        estimatedRepairTime: elementsWithInvalidDepth.length * 50,
        dataLossRisk: 'none',
        cascadeEffects: ['메타데이터 업데이트']
      });
    }

    return damages;
  }

  /**
   * 손상된 경로 감지
   */
  private async detectCorruptedPaths(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    const elementsWithCorruptedPath: string[] = [];

    // 실제 경로 계산
    const actualPaths = this.calculateActualPaths(data.bundleHierarchy);

    for (const bundle of data.nestedBundles) {
      for (const element of bundle.elements) {
        const actualPath = actualPaths.get(element.id);
        if (actualPath && element.path !== actualPath) {
          elementsWithCorruptedPath.push(element.id);
        }
      }
    }

    if (elementsWithCorruptedPath.length > 0) {
      damages.push({
        type: 'corrupted_paths',
        severity: 'low',
        description: `${elementsWithCorruptedPath.length}개의 요소에 손상된 경로가 있습니다`,
        affectedElements: elementsWithCorruptedPath,
        detectiveProcedure: 'path_validation',
        repairStrategies: this.repairStrategies.get('corrupted_paths') || [],
        autoRepairPossible: true,
        estimatedRepairTime: elementsWithCorruptedPath.length * 25,
        dataLossRisk: 'none',
        cascadeEffects: ['경로 문자열 업데이트']
      });
    }

    return damages;
  }

  /**
   * 일관성 없는 메타데이터 감지
   */
  private async detectInconsistentMetadata(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    // 메타데이터 일관성 검사 구현
    return damages;
  }

  /**
   * 시간 충돌 감지
   */
  private async detectTimingConflicts(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    // 시간 충돌 검사 구현
    return damages;
  }

  /**
   * 인덱스 불일치 감지
   */
  private async detectIndexMismatches(data: UnifiedProjectDataV3): Promise<StructureDamage[]> {
    const damages: StructureDamage[] = [];
    // 인덱스 불일치 검사 구현
    return damages;
  }

  // ===== 복원 실행 메서드들 =====

  /**
   * 복원 컨텍스트 초기화
   */
  private async initializeRestorationContext(
    data: UnifiedProjectDataV3,
    progressCallback?: StructureRestorationContext['progressCallback']
  ): Promise<StructureRestorationContext> {
    return {
      originalData: JSON.parse(JSON.stringify(data)),
      workingData: JSON.parse(JSON.stringify(data)),
      detectedDamages: [],
      repairHistory: [],
      rollbackStack: [],
      progressCallback
    };
  }

  /**
   * 복원 계획 수립
   */
  private createRepairPlan(
    damages: StructureDamage[],
    repairMode: 'conservative' | 'balanced' | 'aggressive'
  ): Array<{ damage: StructureDamage; strategy: RepairStrategy }> {
    const plan: Array<{ damage: StructureDamage; strategy: RepairStrategy }> = [];

    for (const damage of damages) {
      const strategies = damage.repairStrategies;
      if (strategies.length === 0) continue;

      let selectedStrategy: RepairStrategy;

      switch (repairMode) {
        case 'conservative':
          // 가장 안전한 전략 선택
          selectedStrategy = strategies.reduce((safest, current) => 
            current.riskLevel === 'low' && current.successRate > safest.successRate ? current : safest
          );
          break;

        case 'aggressive':
          // 가장 효과적인 전략 선택
          selectedStrategy = strategies.reduce((best, current) => 
            current.successRate > best.successRate ? current : best
          );
          break;

        case 'balanced':
        default:
          // 균형 잡힌 전략 선택
          selectedStrategy = strategies.reduce((best, current) => {
            const currentScore = current.successRate * 0.7 + (current.riskLevel === 'low' ? 30 : current.riskLevel === 'medium' ? 15 : 0);
            const bestScore = best.successRate * 0.7 + (best.riskLevel === 'low' ? 30 : best.riskLevel === 'medium' ? 15 : 0);
            return currentScore > bestScore ? current : best;
          });
          break;
      }

      plan.push({ damage, strategy: selectedStrategy });
    }

    // 우선순위 순으로 정렬
    plan.sort((a, b) => a.strategy.priority - b.strategy.priority);

    return plan;
  }

  /**
   * 복원 실행
   */
  private async executeRepair(
    damage: StructureDamage,
    strategy: RepairStrategy,
    context: StructureRestorationContext
  ): Promise<RepairResult> {
    const repairStart = performance.now();

    const result: RepairResult = {
      isSuccess: false,
      strategy,
      appliedChanges: [],
      resolvedDamages: [],
      remainingDamages: [],
      newlyCreatedDamages: [],
      performance: {
        repairTime: 0,
        elementsProcessed: 0,
        relationsRepaired: 0,
        backupSize: 0
      },
      warnings: [],
      errors: []
    };

    try {
      // 롤백 지점 생성
      if (strategy.rollbackPossible) {
        context.rollbackStack.push({
          stepId: `${damage.type}_${Date.now()}`,
          dataSnapshot: JSON.parse(JSON.stringify(context.workingData)),
          timestamp: Date.now()
        });
      }

      // 손상 유형별 복원 실행
      switch (damage.type) {
        case 'orphaned_elements':
          await this.repairOrphanedElements(damage, strategy, context, result);
          break;
        
        case 'circular_references':
          await this.repairCircularReferences(damage, strategy, context, result);
          break;
        
        case 'broken_relationships':
          await this.repairBrokenRelationships(damage, strategy, context, result);
          break;
        
        case 'duplicate_references':
          await this.repairDuplicateReferences(damage, strategy, context, result);
          break;
        
        case 'invalid_depths':
          await this.repairInvalidDepths(damage, strategy, context, result);
          break;
        
        case 'corrupted_paths':
          await this.repairCorruptedPaths(damage, strategy, context, result);
          break;

        default:
          result.errors.push(`지원하지 않는 손상 유형: ${damage.type}`);
          return result;
      }

      result.performance.repairTime = performance.now() - repairStart;
      result.isSuccess = result.errors.length === 0;

    } catch (error) {
      result.isSuccess = false;
      result.errors.push(`복원 실행 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  // ===== 개별 복원 메서드들 =====

  /**
   * 고아 요소 복원
   */
  private async repairOrphanedElements(
    damage: StructureDamage,
    strategy: RepairStrategy,
    context: StructureRestorationContext,
    result: RepairResult
  ): Promise<void> {
    if (strategy.name === 'parent_inference') {
      // 시간 기반 부모 추론
      for (const elementId of damage.affectedElements) {
        const element = this.findElementById(context.workingData, elementId);
        if (element) {
          const inferredParent = this.inferParentByTimeRange(element, context.workingData);
          if (inferredParent) {
            // 새로운 관계 생성
            const newRelation: NestedBundleRelation = {
              id: `inferred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              parentBundleId: inferredParent.id,
              childBundleId: elementId,
              relationship: 'contains',
              depth: inferredParent.hierarchy.depth + 1,
              preserveOnMove: true,
              createdAt: new Date().toISOString()
            };

            context.workingData.bundleHierarchy.relationGraph.push(newRelation);
            result.appliedChanges.push({
              type: 'create',
              target: newRelation.id,
              before: null,
              after: newRelation,
              timestamp: Date.now()
            });
          }
        }
      }
    } else if (strategy.name === 'root_adoption') {
      // 루트 레벨로 이동
      for (const elementId of damage.affectedElements) {
        if (!context.workingData.bundleHierarchy.rootBundles.includes(elementId)) {
          context.workingData.bundleHierarchy.rootBundles.push(elementId);
          result.appliedChanges.push({
            type: 'update',
            target: 'rootBundles',
            before: [...context.workingData.bundleHierarchy.rootBundles],
            after: [...context.workingData.bundleHierarchy.rootBundles, elementId],
            timestamp: Date.now()
          });
        }
      }
    }
  }

  /**
   * 순환 참조 복원
   */
  private async repairCircularReferences(
    damage: StructureDamage,
    strategy: RepairStrategy,
    context: StructureRestorationContext,
    result: RepairResult
  ): Promise<void> {
    if (strategy.name === 'break_weakest_link') {
      // 가장 약한 관계 끊기 (임시 구현)
      const relationsToRemove = damage.affectedElements.slice(0, 1); // 첫 번째 관계만 제거
      
      for (const relationId of relationsToRemove) {
        const relationIndex = context.workingData.bundleHierarchy.relationGraph.findIndex(
          rel => rel.id === relationId
        );
        
        if (relationIndex !== -1) {
          const removedRelation = context.workingData.bundleHierarchy.relationGraph.splice(relationIndex, 1)[0];
          result.appliedChanges.push({
            type: 'delete',
            target: relationId,
            before: removedRelation,
            after: null,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  /**
   * 깨진 관계 복원
   */
  private async repairBrokenRelationships(
    damage: StructureDamage,
    strategy: RepairStrategy,
    context: StructureRestorationContext,
    result: RepairResult
  ): Promise<void> {
    // 깨진 관계 제거
    const relationsToRemove = damage.affectedElements;
    
    for (const relationId of relationsToRemove) {
      const relationIndex = context.workingData.bundleHierarchy.relationGraph.findIndex(
        rel => rel.id === relationId
      );
      
      if (relationIndex !== -1) {
        const removedRelation = context.workingData.bundleHierarchy.relationGraph.splice(relationIndex, 1)[0];
        result.appliedChanges.push({
          type: 'delete',
          target: relationId,
          before: removedRelation,
          after: null,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * 중복 참조 복원
   */
  private async repairDuplicateReferences(
    damage: StructureDamage,
    strategy: RepairStrategy,
    context: StructureRestorationContext,
    result: RepairResult
  ): Promise<void> {
    // 중복 관계 제거
    const relationsToRemove = damage.affectedElements;
    
    for (const relationId of relationsToRemove) {
      const relationIndex = context.workingData.bundleHierarchy.relationGraph.findIndex(
        rel => rel.id === relationId
      );
      
      if (relationIndex !== -1) {
        const removedRelation = context.workingData.bundleHierarchy.relationGraph.splice(relationIndex, 1)[0];
        result.appliedChanges.push({
          type: 'delete',
          target: relationId,
          before: removedRelation,
          after: null,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * 잘못된 깊이 복원
   */
  private async repairInvalidDepths(
    damage: StructureDamage,
    strategy: RepairStrategy,
    context: StructureRestorationContext,
    result: RepairResult
  ): Promise<void> {
    // 실제 깊이 계산 및 업데이트
    const actualDepths = this.calculateActualDepths(context.workingData.bundleHierarchy);

    for (const bundleId of damage.affectedElements) {
      const bundle = context.workingData.nestedBundles.find(b => b.id === bundleId);
      const actualDepth = actualDepths.get(bundleId);
      
      if (bundle && actualDepth !== undefined) {
        const oldDepth = bundle.hierarchy.depth;
        bundle.hierarchy.depth = actualDepth;
        
        result.appliedChanges.push({
          type: 'update',
          target: bundleId,
          before: { depth: oldDepth },
          after: { depth: actualDepth },
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * 손상된 경로 복원
   */
  private async repairCorruptedPaths(
    damage: StructureDamage,
    strategy: RepairStrategy,
    context: StructureRestorationContext,
    result: RepairResult
  ): Promise<void> {
    // 실제 경로 계산 및 업데이트
    const actualPaths = this.calculateActualPaths(context.workingData.bundleHierarchy);

    for (const elementId of damage.affectedElements) {
      const element = this.findElementById(context.workingData, elementId);
      const actualPath = actualPaths.get(elementId);
      
      if (element && actualPath) {
        const oldPath = element.path;
        element.path = actualPath;
        
        result.appliedChanges.push({
          type: 'update',
          target: elementId,
          before: { path: oldPath },
          after: { path: actualPath },
          timestamp: Date.now()
        });
      }
    }
  }

  // ===== 유틸리티 메서드들 =====

  private calculateActualDepths(hierarchy: NestedBundleHierarchy): Map<string, number> {
    const depths = new Map<string, number>();
    
    // 루트 Bundle들은 깊이 0
    for (const rootId of hierarchy.rootBundles) {
      depths.set(rootId, 0);
    }

    // BFS로 깊이 계산
    const queue = [...hierarchy.rootBundles.map(id => ({ id, depth: 0 }))];
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      
      const childRelations = hierarchy.relationGraph.filter(rel => rel.parentBundleId === id);
      for (const relation of childRelations) {
        if (!depths.has(relation.childBundleId)) {
          depths.set(relation.childBundleId, depth + 1);
          queue.push({ id: relation.childBundleId, depth: depth + 1 });
        }
      }
    }

    return depths;
  }

  private calculateActualPaths(hierarchy: NestedBundleHierarchy): Map<string, string> {
    const paths = new Map<string, string>();
    
    // 루트 Bundle들은 자신의 ID가 경로
    for (const rootId of hierarchy.rootBundles) {
      paths.set(rootId, rootId);
    }

    // BFS로 경로 계산
    const queue = [...hierarchy.rootBundles.map(id => ({ id, path: id }))];
    
    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      
      const childRelations = hierarchy.relationGraph.filter(rel => rel.parentBundleId === id);
      for (const relation of childRelations) {
        if (!paths.has(relation.childBundleId)) {
          const childPath = `${path}.${relation.childBundleId}`;
          paths.set(relation.childBundleId, childPath);
          queue.push({ id: relation.childBundleId, path: childPath });
        }
      }
    }

    return paths;
  }

  private findElementById(data: UnifiedProjectDataV3, elementId: string): BundleElement | null {
    for (const bundle of data.nestedBundles) {
      for (const element of bundle.elements) {
        if (element.id === elementId) {
          return element;
        }
      }
    }
    return null;
  }

  private inferParentByTimeRange(element: BundleElement, data: UnifiedProjectDataV3): NestedBundle | null {
    // 시간 범위가 겹치는 Bundle 찾기 (간단한 구현)
    for (const bundle of data.nestedBundles) {
      if (element.startTime >= bundle.timeRange.startTime && 
          element.endTime <= bundle.timeRange.endTime) {
        return bundle;
      }
    }
    return null;
  }

  private async detectNewDamagesAfterRepair(
    data: UnifiedProjectDataV3,
    repairResult: RepairResult
  ): Promise<StructureDamage[]> {
    // 복원 후 새로운 손상 감지 (간단한 구현)
    return [];
  }

  private async validateFinalStructure(data: UnifiedProjectDataV3): Promise<{ integrityScore: number }> {
    // 최종 구조 무결성 검증 (간단한 구현)
    let score = 100;
    
    // 기본 검증들...
    const damages = await this.detectAllStructureDamages(data);
    score -= damages.length * 10;
    
    return { integrityScore: Math.max(0, score) };
  }

  // ===== 공개 API =====

  /**
   * 복원 메트릭 조회
   */
  getRestorationMetrics() {
    return { ...this.restorationMetrics };
  }

  /**
   * 사용자 정의 복원 전략 등록
   */
  registerRepairStrategy(damageType: StructureDamageType, strategy: RepairStrategy): void {
    const strategies = this.repairStrategies.get(damageType) || [];
    strategies.push(strategy);
    this.repairStrategies.set(damageType, strategies);
  }

  /**
   * 빠른 구조 검증
   */
  async quickValidateStructure(data: UnifiedProjectDataV3): Promise<{
    isValid: boolean;
    criticalIssues: number;
    recommendRepair: boolean;
  }> {
    const damages = await this.detectAllStructureDamages(data);
    const criticalIssues = damages.filter(d => d.severity === 'critical').length;
    
    return {
      isValid: damages.length === 0,
      criticalIssues,
      recommendRepair: criticalIssues > 0 || damages.length > 5
    };
  }
}

// ===== Export =====
export default NestedStructureRestorer;
export type {
  StructureDamageType,
  StructureDamage,
  RepairStrategy,
  RepairResult,
  StructureRestorationContext
};
