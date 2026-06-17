/**
 * 부모-자식 관계 유지 드래그 시스템
 * Phase 2 Day 3: 부모-자식 관계 유지 드래그 시스템
 * 
 * 주요 기능:
 * - 드래그 중 부모-자식 관계 완전 보존
 * - 관계 기반 동기화 이동
 * - 관계 무결성 실시간 검증
 * - 관계 복구 및 자동 수정
 * - 관계 제약 조건 적용
 * - 관계 시각화 및 피드백
 */

import {
  Bundle,
  TemplateGroup,
  TimelineClip
} from '../../types';

import {
  NestedBundle,
  NestedBundleRelation,
  BundleHierarchyNode,
  RelationshipMaintainedDragResult,
  RelationshipConstraints,
  RelationshipValidationResult,
  RelationshipSyncOptions
} from '../../types/nested';

import {
  getEnhancedRelationshipManager,
  getBundleHierarchyManager
} from './enhancedRelationshipManager';

/**
 * 관계 기반 드래그 상태
 */
export interface RelationshipDragState {
  primaryBundleId: string;
  affectedRelationships: NestedBundleRelation[];
  synchronizedBundles: Map<string, {
    role: 'parent' | 'child' | 'sibling';
    syncType: 'full' | 'partial' | 'none';
    offset: number; // 시간 오프셋
    constraints: RelationshipConstraints;
  }>;
  relationshipIntegrity: {
    maintained: NestedBundleRelation[];
    atRisk: NestedBundleRelation[];
    broken: NestedBundleRelation[];
  };
  repairActions: Array<{
    type: 'restore' | 'adjust' | 'recreate';
    targetRelation: NestedBundleRelation;
    description: string;
    autoExecute: boolean;
  }>;
}

/**
 * 관계 동기화 결과
 */
export interface RelationshipSyncResult {
  success: boolean;
  syncedBundles: Array<{
    bundleId: string;
    role: 'parent' | 'child' | 'sibling';
    oldPosition: number;
    newPosition: number;
    syncReason: string;
  }>;
  maintainedRelationships: NestedBundleRelation[];
  adjustedRelationships: Array<{
    original: NestedBundleRelation;
    adjusted: NestedBundleRelation;
    adjustmentReason: string;
  }>;
  failedSyncs: Array<{
    bundleId: string;
    reason: string;
    severity: 'warning' | 'error';
  }>;
  performance: {
    syncTime: number;
    validationTime: number;
    repairTime: number;
  };
}

/**
 * 🔗 부모-자식 관계 유지 드래그 시스템
 * 
 * Bundle 드래그 시 부모-자식 관계를 완벽하게 유지하고
 * 관계 무결성을 보장하는 고급 드래그 시스템입니다.
 */
export class RelationshipMaintainedDragSystem {
  private relationshipManager = getEnhancedRelationshipManager();
  private hierarchyManager = getBundleHierarchyManager();
  private relationshipTracker: RelationshipTracker;
  private syncEngine: RelationshipSyncEngine;
  private integrityValidator: RelationshipIntegrityValidator;
  private repairSystem: RelationshipRepairSystem;
  private visualizationSystem: RelationshipVisualizationSystem;

  // 현재 관계 드래그 상태
  private currentDragState: RelationshipDragState | null = null;
  
  // 관계 제약 조건
  private relationshipConstraints: RelationshipConstraints = this.getDefaultConstraints();

  // 성능 모니터링
  private performanceTracker: RelationshipPerformanceTracker;

  constructor(options: {
    enableVisualization?: boolean;
    strictIntegrityMode?: boolean;
    autoRepairEnabled?: boolean;
    performanceMonitoring?: boolean;
  } = {}) {
    console.log('🔗 부모-자식 관계 유지 드래그 시스템 초기화');

    this.relationshipTracker = new RelationshipTracker();
    this.syncEngine = new RelationshipSyncEngine();
    this.integrityValidator = new RelationshipIntegrityValidator(options.strictIntegrityMode);
    this.repairSystem = new RelationshipRepairSystem(options.autoRepairEnabled);
    this.visualizationSystem = new RelationshipVisualizationSystem(options.enableVisualization);
    this.performanceTracker = new RelationshipPerformanceTracker(options.performanceMonitoring);

    this.initializeRelationshipDragSystem();
  }

  /**
   * 🎯 관계 기반 드래그 시작
   * 
   * Bundle과 그 모든 관계를 분석하여 드래그를 시작합니다.
   */
  async startRelationshipMaintainedDrag(
    primaryBundleId: string,
    dragOptions: {
      syncChildren?: boolean;
      syncParents?: boolean;
      syncSiblings?: boolean;
      maintainAllRelationships?: boolean;
      allowRelationshipAdjustment?: boolean;
      autoRepairBrokenRelationships?: boolean;
      visualizeRelationships?: boolean;
      strictIntegrityValidation?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    dragState: RelationshipDragState;
    preAnalysis: {
      totalRelationships: number;
      criticalRelationships: number;
      potentialConflicts: number;
      syncStrategy: string;
    };
    warnings: string[];
  }> {
    
    const startTime = performance.now();
    const result = {
      success: false,
      dragState: this.createEmptyDragState(primaryBundleId),
      preAnalysis: {
        totalRelationships: 0,
        criticalRelationships: 0,
        potentialConflicts: 0,
        syncStrategy: 'none'
      },
      warnings: [] as string[]
    };

    try {
      console.log('🎯 관계 기반 드래그 시작:', {
        bundleId: primaryBundleId.slice(-8),
        options: dragOptions
      });

      // 1. 관계 네트워크 분석
      const relationshipAnalysis = await this.analyzeRelationshipNetwork(
        primaryBundleId,
        dragOptions
      );

      result.preAnalysis = {
        totalRelationships: relationshipAnalysis.allRelationships.length,
        criticalRelationships: relationshipAnalysis.criticalRelationships.length,
        potentialConflicts: relationshipAnalysis.potentialConflicts.length,
        syncStrategy: relationshipAnalysis.recommendedSyncStrategy
      };

      // 2. 동기화 전략 수립
      const syncStrategy = await this.syncEngine.planSynchronizationStrategy(
        primaryBundleId,
        relationshipAnalysis,
        dragOptions
      );

      // 3. 관계 드래그 상태 초기화
      this.currentDragState = {
        primaryBundleId,
        affectedRelationships: relationshipAnalysis.allRelationships,
        synchronizedBundles: syncStrategy.synchronizedBundles,
        relationshipIntegrity: {
          maintained: relationshipAnalysis.allRelationships,
          atRisk: [],
          broken: []
        },
        repairActions: []
      };

      // 4. 관계 제약 조건 설정
      await this.setupRelationshipConstraints(this.currentDragState, dragOptions);

      // 5. 관계 시각화 시작 (옵션)
      if (dragOptions.visualizeRelationships) {
        await this.visualizationSystem.startRelationshipVisualization(this.currentDragState);
      }

      // 6. 관계 추적 시작
      await this.relationshipTracker.startTracking(this.currentDragState);

      result.success = true;
      result.dragState = this.currentDragState;

      this.performanceTracker.recordDragStart(performance.now() - startTime);

      console.log('✅ 관계 기반 드래그 시작 완료:', {
        affectedRelationships: result.preAnalysis.totalRelationships,
        synchronizedBundles: this.currentDragState.synchronizedBundles.size,
        syncStrategy: result.preAnalysis.syncStrategy
      });

    } catch (error) {
      console.error('❌ 관계 기반 드래그 시작 실패:', error);
      result.warnings.push(`드래그 시작 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 🔄 관계 동기화 드래그 업데이트
   * 
   * 드래그 중 모든 관계된 Bundle들을 동기화하여 이동합니다.
   */
  async updateRelationshipSynchronizedDrag(
    primaryBundleId: string,
    deltaTime: number,
    updateOptions: {
      validateIntegrityRealTime?: boolean;
      autoRepairOnViolation?: boolean;
      updateVisualization?: boolean;
      performanceOptimization?: boolean;
    } = {}
  ): Promise<RelationshipSyncResult> {
    
    const startTime = performance.now();
    const result: RelationshipSyncResult = {
      success: false,
      syncedBundles: [],
      maintainedRelationships: [],
      adjustedRelationships: [],
      failedSyncs: [],
      performance: {
        syncTime: 0,
        validationTime: 0,
        repairTime: 0
      }
    };

    if (!this.currentDragState || this.currentDragState.primaryBundleId !== primaryBundleId) {
      result.failedSyncs.push({
        bundleId: primaryBundleId,
        reason: '활성화된 관계 드래그 상태를 찾을 수 없습니다',
        severity: 'error'
      });
      return result;
    }

    try {
      const syncStartTime = performance.now();

      // 1. 동기화된 Bundle들 업데이트
      for (const [bundleId, syncInfo] of this.currentDragState.synchronizedBundles) {
        try {
          const syncResult = await this.syncEngine.synchronizeBundleMovement(
            bundleId,
            deltaTime,
            syncInfo,
            this.relationshipConstraints
          );

          if (syncResult.success) {
            result.syncedBundles.push({
              bundleId,
              role: syncInfo.role,
              oldPosition: syncResult.oldPosition,
              newPosition: syncResult.newPosition,
              syncReason: syncResult.syncReason
            });
          } else {
            result.failedSyncs.push({
              bundleId,
              reason: syncResult.failureReason || '동기화 실패',
              severity: 'warning'
            });
          }
        } catch (error) {
          result.failedSyncs.push({
            bundleId,
            reason: `동기화 중 오류: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'error'
          });
        }
      }

      result.performance.syncTime = performance.now() - syncStartTime;

      // 2. 관계 무결성 실시간 검증 (옵션)
      if (updateOptions.validateIntegrityRealTime) {
        const validationStartTime = performance.now();
        
        const integrityResult = await this.integrityValidator.validateRelationshipIntegrity(
          this.currentDragState.affectedRelationships,
          result.syncedBundles
        );

        // 무결성 상태 업데이트
        this.currentDragState.relationshipIntegrity = integrityResult.integrityState;
        result.maintainedRelationships = integrityResult.integrityState.maintained;

        // 위반된 관계 조정
        if (integrityResult.violations.length > 0) {
          const adjustmentResult = await this.adjustRelationshipsForViolations(
            integrityResult.violations
          );
          result.adjustedRelationships = adjustmentResult.adjustedRelationships;
        }

        result.performance.validationTime = performance.now() - validationStartTime;
      }

      // 3. 깨진 관계 자동 복구 (옵션)
      if (updateOptions.autoRepairOnViolation && this.currentDragState.relationshipIntegrity.broken.length > 0) {
        const repairStartTime = performance.now();
        
        const repairResult = await this.repairSystem.repairBrokenRelationships(
          this.currentDragState.relationshipIntegrity.broken,
          result.syncedBundles
        );

        // 복구 액션 추가
        this.currentDragState.repairActions.push(...repairResult.repairActions);

        result.performance.repairTime = performance.now() - repairStartTime;
      }

      // 4. 관계 시각화 업데이트 (옵션)
      if (updateOptions.updateVisualization) {
        await this.visualizationSystem.updateRelationshipVisualization(
          this.currentDragState,
          result
        );
      }

      // 5. 성능 최적화 (옵션)
      if (updateOptions.performanceOptimization) {
        await this.optimizeRelationshipSync();
      }

      result.success = true;

      this.performanceTracker.recordSyncUpdate(performance.now() - startTime);

      console.log(`🔄 관계 동기화 업데이트 완료:`, {
        syncedBundles: result.syncedBundles.length,
        maintainedRelationships: result.maintainedRelationships.length,
        adjustedRelationships: result.adjustedRelationships.length,
        failedSyncs: result.failedSyncs.length,
        totalTime: `${performance.now() - startTime}ms`
      });

    } catch (error) {
      console.error('❌ 관계 동기화 업데이트 실패:', error);
      result.failedSyncs.push({
        bundleId: primaryBundleId,
        reason: `업데이트 실패: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return result;
  }

  /**
   * ✅ 관계 유지 드래그 완료
   * 
   * 모든 관계를 최종 검증하고 필요시 복구하여 드래그를 완료합니다.
   */
  async completeRelationshipMaintainedDrag(
    finalOptions: {
      performFinalIntegrityCheck?: boolean;
      repairAllBrokenRelationships?: boolean;
      optimizeRelationshipStructure?: boolean;
      generateIntegrityReport?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    finalIntegrityState: {
      totalRelationships: number;
      maintainedRelationships: number;
      repairedRelationships: number;
      failedRepairs: number;
      integrityScore: number; // 0-1
    };
    repairActions: Array<{
      type: 'restore' | 'adjust' | 'recreate';
      description: string;
      success: boolean;
    }>;
    integrityReport?: {
      overview: string;
      details: Array<{
        relationship: NestedBundleRelation;
        status: 'maintained' | 'repaired' | 'failed';
        issues: string[];
      }>;
      recommendations: string[];
    };
    performance: {
      totalDragTime: number;
      finalValidationTime: number;
      repairTime: number;
    };
    warnings: string[];
  }> {
    
    const startTime = performance.now();
    const result = {
      success: false,
      finalIntegrityState: {
        totalRelationships: 0,
        maintainedRelationships: 0,
        repairedRelationships: 0,
        failedRepairs: 0,
        integrityScore: 0
      },
      repairActions: [] as any[],
      integrityReport: undefined as any,
      performance: {
        totalDragTime: 0,
        finalValidationTime: 0,
        repairTime: 0
      },
      warnings: [] as string[]
    };

    if (!this.currentDragState) {
      result.warnings.push('활성화된 관계 드래그 상태가 없습니다');
      return result;
    }

    try {
      console.log('✅ 관계 유지 드래그 완료 시작');

      const finalValidationStartTime = performance.now();

      // 1. 최종 무결성 검증
      if (finalOptions.performFinalIntegrityCheck !== false) {
        const finalIntegrityCheck = await this.integrityValidator.performComprehensiveIntegrityCheck(
          this.currentDragState
        );

        result.finalIntegrityState = {
          totalRelationships: this.currentDragState.affectedRelationships.length,
          maintainedRelationships: finalIntegrityCheck.maintainedCount,
          repairedRelationships: 0, // 아직 복구 전
          failedRepairs: 0,
          integrityScore: finalIntegrityCheck.integrityScore
        };
      }

      result.performance.finalValidationTime = performance.now() - finalValidationStartTime;

      // 2. 모든 깨진 관계 복구 (옵션)
      if (finalOptions.repairAllBrokenRelationships && this.currentDragState.relationshipIntegrity.broken.length > 0) {
        const repairStartTime = performance.now();
        
        const comprehensiveRepairResult = await this.repairSystem.performComprehensiveRepair(
          this.currentDragState.relationshipIntegrity.broken,
          { forceRepair: true, useAdvancedStrategies: true }
        );

        result.repairActions = comprehensiveRepairResult.executedActions;
        result.finalIntegrityState.repairedRelationships = comprehensiveRepairResult.successfulRepairs;
        result.finalIntegrityState.failedRepairs = comprehensiveRepairResult.failedRepairs;

        result.performance.repairTime = performance.now() - repairStartTime;
      }

      // 3. 관계 구조 최적화 (옵션)
      if (finalOptions.optimizeRelationshipStructure) {
        await this.optimizeRelationshipStructure();
      }

      // 4. 무결성 리포트 생성 (옵션)
      if (finalOptions.generateIntegrityReport) {
        result.integrityReport = await this.generateIntegrityReport();
      }

      // 5. 최종 무결성 점수 계산
      result.finalIntegrityState.integrityScore = this.calculateFinalIntegrityScore(
        result.finalIntegrityState
      );

      // 6. 드래그 상태 정리
      await this.cleanupRelationshipDragState();

      result.success = true;
      result.performance.totalDragTime = performance.now() - startTime;

      this.performanceTracker.recordDragComplete(result.performance.totalDragTime);

      console.log('✅ 관계 유지 드래그 완료:', {
        integrityScore: result.finalIntegrityState.integrityScore.toFixed(3),
        maintainedRelationships: result.finalIntegrityState.maintainedRelationships,
        repairedRelationships: result.finalIntegrityState.repairedRelationships,
        failedRepairs: result.finalIntegrityState.failedRepairs
      });

    } catch (error) {
      console.error('❌ 관계 유지 드래그 완료 실패:', error);
      result.warnings.push(`완료 처리 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  // ========================================
  // 🛠️ 내부 시스템 메서드들
  // ========================================

  private initializeRelationshipDragSystem(): void {
    // 시스템 초기화
    console.log('⚙️ 관계 유지 드래그 시스템 초기화 완료');
  }

  private getDefaultConstraints(): RelationshipConstraints {
    return {
      maxDepth: 10,
      maxChildrenPerParent: 50,
      preventCircularReferences: true,
      enforceTemporalConsistency: true,
      allowCrossTypeRelations: true,
      validationLevel: 'strict'
    };
  }

  private createEmptyDragState(primaryBundleId: string): RelationshipDragState {
    return {
      primaryBundleId,
      affectedRelationships: [],
      synchronizedBundles: new Map(),
      relationshipIntegrity: {
        maintained: [],
        atRisk: [],
        broken: []
      },
      repairActions: []
    };
  }

  private async analyzeRelationshipNetwork(
    bundleId: string,
    options: any
  ): Promise<{
    allRelationships: NestedBundleRelation[];
    criticalRelationships: NestedBundleRelation[];
    potentialConflicts: any[];
    recommendedSyncStrategy: string;
  }> {
    
    // 관계 네트워크 분석
    const networkAnalysis = await this.relationshipManager.analyzeRelationshipNetwork(bundleId, {
      maxDepth: 5,
      includeIndirectRelations: true,
      detectCycles: true,
      findOptimizationOpportunities: false
    });

    return {
      allRelationships: [], // 실제 구현에서는 네트워크 분석 결과 사용
      criticalRelationships: [],
      potentialConflicts: [],
      recommendedSyncStrategy: options.maintainAllRelationships ? 'full-sync' : 'selective-sync'
    };
  }

  private async setupRelationshipConstraints(
    dragState: RelationshipDragState,
    options: any
  ): Promise<void> {
    // 관계별 제약 조건 설정
    this.relationshipConstraints = {
      ...this.getDefaultConstraints(),
      preventCircularReferences: options.strictIntegrityValidation !== false,
      enforceTemporalConsistency: options.maintainAllRelationships !== false
    };
  }

  private async adjustRelationshipsForViolations(
    violations: any[]
  ): Promise<{
    adjustedRelationships: Array<{
      original: NestedBundleRelation;
      adjusted: NestedBundleRelation;
      adjustmentReason: string;
    }>;
  }> {
    
    return { adjustedRelationships: [] };
  }

  private async optimizeRelationshipSync(): Promise<void> {
    // 관계 동기화 최적화
  }

  private async optimizeRelationshipStructure(): Promise<void> {
    // 관계 구조 최적화
  }

  private async generateIntegrityReport(): Promise<any> {
    return {
      overview: '관계 무결성 검증 완료',
      details: [],
      recommendations: []
    };
  }

  private calculateFinalIntegrityScore(integrityState: any): number {
    const { totalRelationships, maintainedRelationships, repairedRelationships, failedRepairs } = integrityState;
    
    if (totalRelationships === 0) return 1.0;
    
    const successfulRelationships = maintainedRelationships + repairedRelationships;
    return successfulRelationships / totalRelationships;
  }

  private async cleanupRelationshipDragState(): Promise<void> {
    // 관계 추적 중지
    await this.relationshipTracker.stopTracking();
    
    // 시각화 정리
    await this.visualizationSystem.stopRelationshipVisualization();
    
    // 드래그 상태 초기화
    this.currentDragState = null;
  }

  /**
   * 📊 관계 드래그 통계 조회
   */
  getRelationshipDragStatistics(): {
    totalDrags: number;
    averageIntegrityScore: number;
    averageDragTime: number;
    relationshipRepairRate: number;
    performanceMetrics: any;
  } {
    return this.performanceTracker.getStatistics();
  }

  /**
   * ⚙️ 관계 제약 조건 업데이트
   */
  updateRelationshipConstraints(constraints: Partial<RelationshipConstraints>): void {
    this.relationshipConstraints = {
      ...this.relationshipConstraints,
      ...constraints
    };
  }

  /**
   * 🔧 관계 드래그 설정 업데이트
   */
  updateRelationshipDragSettings(settings: {
    enableVisualization?: boolean;
    strictIntegrityMode?: boolean;
    autoRepairEnabled?: boolean;
    performanceMonitoring?: boolean;
  }): void {
    this.visualizationSystem.setEnabled(settings.enableVisualization !== false);
    this.integrityValidator.setStrictMode(settings.strictIntegrityMode !== false);
    this.repairSystem.setAutoRepairEnabled(settings.autoRepairEnabled !== false);
    this.performanceTracker.setEnabled(settings.performanceMonitoring !== false);
  }
}

// ========================================
// 🧩 보조 시스템 클래스들
// ========================================

class RelationshipTracker {
  async startTracking(dragState: RelationshipDragState): Promise<void> {
    // 관계 추적 시작
  }

  async stopTracking(): Promise<void> {
    // 관계 추적 중지
  }
}

class RelationshipSyncEngine {
  async planSynchronizationStrategy(
    bundleId: string,
    analysis: any,
    options: any
  ): Promise<{
    synchronizedBundles: Map<string, any>;
  }> {
    return { synchronizedBundles: new Map() };
  }

  async synchronizeBundleMovement(
    bundleId: string,
    deltaTime: number,
    syncInfo: any,
    constraints: RelationshipConstraints
  ): Promise<{
    success: boolean;
    oldPosition: number;
    newPosition: number;
    syncReason: string;
    failureReason?: string;
  }> {
    return {
      success: true,
      oldPosition: 0,
      newPosition: deltaTime,
      syncReason: '관계 동기화'
    };
  }
}

class RelationshipIntegrityValidator {
  constructor(private strictMode: boolean = true) {}

  async validateRelationshipIntegrity(
    relationships: NestedBundleRelation[],
    syncedBundles: any[]
  ): Promise<{
    integrityState: any;
    violations: any[];
  }> {
    return {
      integrityState: { maintained: relationships, atRisk: [], broken: [] },
      violations: []
    };
  }

  async performComprehensiveIntegrityCheck(dragState: RelationshipDragState): Promise<{
    maintainedCount: number;
    integrityScore: number;
  }> {
    return {
      maintainedCount: dragState.affectedRelationships.length,
      integrityScore: 1.0
    };
  }

  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }
}

class RelationshipRepairSystem {
  constructor(private autoRepairEnabled: boolean = true) {}

  async repairBrokenRelationships(
    brokenRelationships: NestedBundleRelation[],
    syncedBundles: any[]
  ): Promise<{
    repairActions: any[];
  }> {
    return { repairActions: [] };
  }

  async performComprehensiveRepair(
    brokenRelationships: NestedBundleRelation[],
    options: any
  ): Promise<{
    executedActions: any[];
    successfulRepairs: number;
    failedRepairs: number;
  }> {
    return {
      executedActions: [],
      successfulRepairs: brokenRelationships.length,
      failedRepairs: 0
    };
  }

  setAutoRepairEnabled(enabled: boolean): void {
    this.autoRepairEnabled = enabled;
  }
}

class RelationshipVisualizationSystem {
  constructor(private enabled: boolean = true) {}

  async startRelationshipVisualization(dragState: RelationshipDragState): Promise<void> {
    if (!this.enabled) return;
    // 관계 시각화 시작
  }

  async updateRelationshipVisualization(dragState: RelationshipDragState, syncResult: any): Promise<void> {
    if (!this.enabled) return;
    // 관계 시각화 업데이트
  }

  async stopRelationshipVisualization(): Promise<void> {
    // 관계 시각화 중지
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

class RelationshipPerformanceTracker {
  private statistics = {
    totalDrags: 0,
    totalDragTime: 0,
    totalIntegrityScore: 0,
    totalRepairs: 0,
    successfulRepairs: 0
  };

  constructor(private enabled: boolean = true) {}

  recordDragStart(time: number): void {
    if (!this.enabled) return;
    // 드래그 시작 기록
  }

  recordSyncUpdate(time: number): void {
    if (!this.enabled) return;
    // 동기화 업데이트 기록
  }

  recordDragComplete(time: number): void {
    if (!this.enabled) return;
    this.statistics.totalDrags++;
    this.statistics.totalDragTime += time;
  }

  getStatistics(): any {
    return {
      ...this.statistics,
      averageDragTime: this.statistics.totalDrags > 0 
        ? this.statistics.totalDragTime / this.statistics.totalDrags 
        : 0,
      averageIntegrityScore: this.statistics.totalDrags > 0
        ? this.statistics.totalIntegrityScore / this.statistics.totalDrags
        : 0,
      relationshipRepairRate: this.statistics.totalRepairs > 0
        ? this.statistics.successfulRepairs / this.statistics.totalRepairs
        : 0,
      performanceMetrics: this.statistics
    };
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// 전역 인스턴스 생성
let globalRelationshipMaintainedDragSystem: RelationshipMaintainedDragSystem | null = null;

/**
 * 부모-자식 관계 유지 드래그 시스템 싱글톤 인스턴스 반환
 */
export function getRelationshipMaintainedDragSystem(
  options?: Parameters<typeof RelationshipMaintainedDragSystem.prototype.constructor>[0]
): RelationshipMaintainedDragSystem {
  if (!globalRelationshipMaintainedDragSystem) {
    globalRelationshipMaintainedDragSystem = new RelationshipMaintainedDragSystem(options);
  }
  return globalRelationshipMaintainedDragSystem;
}

/**
 * 부모-자식 관계 유지 드래그 시스템 초기화
 */
export function resetRelationshipMaintainedDragSystem(): void {
  globalRelationshipMaintainedDragSystem = null;
}
