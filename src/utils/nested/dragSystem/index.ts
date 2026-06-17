/**
 * @fileoverview 중첩 Bundle 드래그 시스템 통합 인덱스
 * @description 계층적 드래그, 부모-자식 관계 유지, 제약 조건, 실시간 업데이트 시스템 통합
 * @version 1.0.0
 * @created 2025-06-22
 */

// ===== 드래그 시스템 컴포넌트들 =====
export { 
  default as HierarchicalDragLogic,
  getGlobalHierarchicalDragLogic,
  resetGlobalHierarchicalDragLogic
} from './hierarchicalDragLogic';

export { 
  default as ParentChildDragSystem,
  getGlobalParentChildDragSystem,
  resetGlobalParentChildDragSystem
} from './parentChildDragSystem';

export { 
  default as DepthConstraintSystem,
  getGlobalDepthConstraintSystem,
  resetGlobalDepthConstraintSystem
} from './depthConstraintSystem';

export { 
  default as RealTimeHierarchyUpdater,
  getGlobalHierarchyUpdater,
  resetGlobalHierarchyUpdater
} from './realTimeHierarchyUpdater';

// ===== 통합 드래그 시스템 관리자 =====

import HierarchicalDragLogic from './hierarchicalDragLogic';
import ParentChildDragSystem from './parentChildDragSystem';
import DepthConstraintSystem from './depthConstraintSystem';
import RealTimeHierarchyUpdater from './realTimeHierarchyUpdater';

import {
  BundleElement,
  NestedBundle,
  BundleHierarchyNode,
  NestedBundleRelation,
  DragConstraints,
  DragValidationResult,
  HierarchicalMoveResult
} from '../../../types/nested';

import { TimelineTrack } from '../../../types/timeline';

/**
 * 통합 드래그 결과
 */
interface IntegratedDragResult {
  isSuccess: boolean;
  bundleId: string;
  deltaTime: number;
  
  // 각 시스템별 결과
  hierarchicalResult: HierarchicalMoveResult;
  relationshipResult: {
    isSuccess: boolean;
    updatedBundles: Map<string, NestedBundle>;
    updatedRelations: NestedBundleRelation[];
    appliedChanges: any[];
    conflicts: any[];
  };
  constraintResult: DragValidationResult;
  
  // 통합 메트릭
  performance: {
    totalExecutionTime: number;
    hierarchicalTime: number;
    relationshipTime: number;
    constraintTime: number;
    updateTime: number;
    elementsProcessed: number;
    conflictsResolved: number;
  };
  
  // 사용자 피드백
  feedback: {
    success: string[];
    warnings: string[];
    errors: string[];
    recommendations: string[];
  };
}

/**
 * 드래그 시스템 설정
 */
interface DragSystemConfig {
  // 계층적 드래그 설정
  hierarchical: {
    enabled: boolean;
    maxConcurrentDrags: number;
    realTimeValidation: boolean;
    cacheSize: number;
  };
  
  // 관계 유지 설정
  relationship: {
    enabled: boolean;
    moveChildrenWithParent: boolean;
    adjustParentRange: boolean;
    maintainSiblingOrder: boolean;
    autoRepairBrokenRelations: boolean;
  };
  
  // 제약 조건 설정
  constraints: {
    enabled: boolean;
    maxDepthLevels: number;
    enforceTimeConstraints: boolean;
    allowCrossTrackMove: boolean;
    performanceOptimization: boolean;
  };
  
  // 실시간 업데이트 설정
  realTimeUpdates: {
    enabled: boolean;
    batchUpdates: boolean;
    maxBatchSize: number;
    updateInterval: number;
    conflictResolution: boolean;
  };
}

/**
 * 통합 중첩 Bundle 드래그 시스템
 */
export class IntegratedNestedDragSystem {
  private hierarchicalDrag: HierarchicalDragLogic;
  private parentChildSystem: ParentChildDragSystem;
  private constraintSystem: DepthConstraintSystem;
  private hierarchyUpdater: RealTimeHierarchyUpdater;
  
  private config: DragSystemConfig;
  private isInitialized: boolean = false;
  
  // 성능 추적
  private performanceMetrics = {
    totalDrags: 0,
    successfulDrags: 0,
    averageExecutionTime: 0,
    peakExecutionTime: 0,
    totalElementsProcessed: 0,
    totalConflictsResolved: 0
  };

  constructor(config?: Partial<DragSystemConfig>) {
    this.config = {
      hierarchical: {
        enabled: true,
        maxConcurrentDrags: 10,
        realTimeValidation: true,
        cacheSize: 1000
      },
      relationship: {
        enabled: true,
        moveChildrenWithParent: true,
        adjustParentRange: true,
        maintainSiblingOrder: true,
        autoRepairBrokenRelations: true
      },
      constraints: {
        enabled: true,
        maxDepthLevels: 10,
        enforceTimeConstraints: true,
        allowCrossTrackMove: true,
        performanceOptimization: true
      },
      realTimeUpdates: {
        enabled: true,
        batchUpdates: true,
        maxBatchSize: 100,
        updateInterval: 50,
        conflictResolution: true
      },
      ...config
    };
    
    this.initializeSystems();
  }

  /**
   * 시스템 초기화
   */
  private initializeSystems(): void {
    this.hierarchicalDrag = new HierarchicalDragLogic();
    this.parentChildSystem = new ParentChildDragSystem({
      moveChildrenWithParent: this.config.relationship.moveChildrenWithParent,
      adjustParentRange: this.config.relationship.adjustParentRange,
      maintainSiblingOrder: this.config.relationship.maintainSiblingOrder,
      autoRepairBrokenRelations: this.config.relationship.autoRepairBrokenRelations
    });
    this.constraintSystem = new DepthConstraintSystem();
    this.hierarchyUpdater = new RealTimeHierarchyUpdater();
    
    this.setupIntegration();
    this.isInitialized = true;
  }

  /**
   * 시스템 간 통합 설정
   */
  private setupIntegration(): void {
    // 실시간 업데이트 구독 설정
    if (this.config.realTimeUpdates.enabled) {
      this.hierarchyUpdater.subscribe(
        'hierarchical_drag',
        'Hierarchical Drag System',
        ['bundle_moved', 'relation_updated', 'hierarchy_rebuilt'],
        async (event) => {
          // 계층적 드래그 시스템에 이벤트 전파
          await this.handleHierarchyUpdate(event);
        },
        {
          immediate: false,
          batchUpdates: this.config.realTimeUpdates.batchUpdates,
          maxBatchSize: this.config.realTimeUpdates.maxBatchSize,
          batchTimeoutMs: this.config.realTimeUpdates.updateInterval
        }
      );
    }
  }

  /**
   * 통합 드래그 시작
   */
  async startIntegratedDrag(
    bundleId: string,
    startPosition: { x: number; y: number },
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[],
    tracks: TimelineTrack[],
    constraints?: Partial<DragConstraints>
  ): Promise<{
    dragSessionId: string;
    relationshipContextId: string;
    isValid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('드래그 시스템이 초기화되지 않았습니다.');
    }

    const startTime = performance.now();
    const result = {
      dragSessionId: '',
      relationshipContextId: '',
      isValid: true,
      warnings: [] as string[],
      errors: [] as string[]
    };

    try {
      // 1. 계층적 드래그 세션 시작
      if (this.config.hierarchical.enabled) {
        const dragSession = await this.hierarchicalDrag.startHierarchicalDrag(
          bundleId,
          startPosition,
          bundles,
          relations,
          constraints
        );
        result.dragSessionId = dragSession.id;
      }

      // 2. 관계 컨텍스트 초기화
      if (this.config.relationship.enabled) {
        const relationshipContext = await this.parentChildSystem.initializeDragRelationshipContext(
          bundleId,
          bundles,
          relations
        );
        result.relationshipContextId = relationshipContext.draggedBundleId;
      }

      // 3. 제약 조건 사전 검증
      if (this.config.constraints.enabled) {
        const bundle = bundles.get(bundleId);
        if (bundle) {
          const depth = this.calculateBundleDepth(bundleId, relations);
          const preValidation = await this.constraintSystem.validateDepthConstraints(
            bundleId,
            depth,
            0, // 초기 이동 거리 0
            0, // 초기 이동 속도 0
            0, // 초기 deltaTime 0
            bundles,
            relations,
            tracks
          );
          
          if (!preValidation.isValid) {
            result.isValid = false;
            result.errors.push(...preValidation.violations.map(v => v.message));
          } else {
            result.warnings.push(...preValidation.violations
              .filter(v => v.severity === 'warning')
              .map(v => v.message));
          }
        }
      }

      // 4. 실시간 업데이트 알림
      if (this.config.realTimeUpdates.enabled && result.isValid) {
        await this.hierarchyUpdater.emitHierarchyChange('bundle_moved', {
          bundleId,
          affectedBundles: [bundleId],
          source: 'user',
          priority: 3
        });
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`드래그 시작 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    const executionTime = performance.now() - startTime;
    this.updatePerformanceMetrics('start', executionTime, result.isValid);

    return result;
  }

  /**
   * 통합 드래그 업데이트
   */
  async updateIntegratedDrag(
    dragSessionId: string,
    newPosition: { x: number; y: number },
    deltaTime: number,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[],
    tracks: TimelineTrack[]
  ): Promise<IntegratedDragResult> {
    const updateStartTime = performance.now();
    
    const result: IntegratedDragResult = {
      isSuccess: false,
      bundleId: '',
      deltaTime,
      hierarchicalResult: {} as HierarchicalMoveResult,
      relationshipResult: {
        isSuccess: false,
        updatedBundles: new Map(),
        updatedRelations: [],
        appliedChanges: [],
        conflicts: []
      },
      constraintResult: {} as DragValidationResult,
      performance: {
        totalExecutionTime: 0,
        hierarchicalTime: 0,
        relationshipTime: 0,
        constraintTime: 0,
        updateTime: 0,
        elementsProcessed: 0,
        conflictsResolved: 0
      },
      feedback: {
        success: [],
        warnings: [],
        errors: [],
        recommendations: []
      }
    };

    try {
      let bundleId = '';

      // 1. 계층적 드래그 업데이트
      if (this.config.hierarchical.enabled) {
        const hierarchicalStart = performance.now();
        
        result.hierarchicalResult = await this.hierarchicalDrag.updateHierarchicalDrag(
          dragSessionId,
          newPosition,
          deltaTime,
          bundles,
          relations,
          tracks
        );
        
        result.performance.hierarchicalTime = performance.now() - hierarchicalStart;
        bundleId = result.hierarchicalResult.bundleId;
        result.bundleId = bundleId;
        
        if (result.hierarchicalResult.isSuccess) {
          result.feedback.success.push('계층적 드래그 성공적으로 처리됨');
        } else {
          result.feedback.errors.push(...result.hierarchicalResult.errors.map(e => e.message));
          result.feedback.warnings.push(...result.hierarchicalResult.warnings.map(w => w.message));
        }
      }

      // 2. 관계 유지 시스템 업데이트
      if (this.config.relationship.enabled && bundleId) {
        const relationshipStart = performance.now();
        
        result.relationshipResult = await this.parentChildSystem.moveWithRelationshipMaintenance(
          bundleId,
          deltaTime,
          bundles,
          relations
        );
        
        result.performance.relationshipTime = performance.now() - relationshipStart;
        
        if (result.relationshipResult.isSuccess) {
          result.feedback.success.push(`관계 유지 시스템: ${result.relationshipResult.appliedChanges.length}개 변경 적용`);
        } else {
          result.feedback.errors.push('관계 유지 시스템에서 오류 발생');
        }
        
        if (result.relationshipResult.conflicts.length > 0) {
          result.feedback.warnings.push(`${result.relationshipResult.conflicts.length}개 관계 충돌 감지`);
          result.performance.conflictsResolved = result.relationshipResult.conflicts.length;
        }
      }

      // 3. 제약 조건 검증
      if (this.config.constraints.enabled && bundleId) {
        const constraintStart = performance.now();
        
        const bundle = bundles.get(bundleId);
        if (bundle) {
          const depth = this.calculateBundleDepth(bundleId, relations);
          const moveDistance = Math.abs(deltaTime);
          const moveSpeed = moveDistance / Math.max(0.1, performance.now() - updateStartTime);
          
          result.constraintResult = await this.constraintSystem.validateDepthConstraints(
            bundleId,
            depth,
            moveDistance,
            moveSpeed,
            deltaTime,
            bundles,
            relations,
            tracks
          );
          
          result.performance.constraintTime = performance.now() - constraintStart;
          
          if (!result.constraintResult.isValid) {
            // 자동 보정 시도
            const corrections = await this.constraintSystem.autoCorrectViolations(
              result.constraintResult.violations,
              deltaTime
            );
            
            if (corrections.appliedCorrections.length > 0) {
              result.feedback.warnings.push(`${corrections.appliedCorrections.length}개 자동 보정 적용`);
              result.feedback.recommendations.push(...corrections.appliedCorrections.map(c => c.description));
            }
          }
          
          result.feedback.errors.push(...result.constraintResult.violations
            .filter(v => v.severity === 'error')
            .map(v => v.message));
          result.feedback.warnings.push(...result.constraintResult.violations
            .filter(v => v.severity === 'warning')
            .map(v => v.message));
        }
      }

      // 4. 실시간 업데이트 알림
      if (this.config.realTimeUpdates.enabled && bundleId) {
        const updateStart = performance.now();
        
        await this.hierarchyUpdater.updateBundleMove(
          bundleId,
          deltaTime,
          result.hierarchicalResult.affectedElements?.map(e => e.id) || [],
          relations
        );
        
        result.performance.updateTime = performance.now() - updateStart;
      }

      // 5. 전체 성공 여부 결정
      result.isSuccess = (
        (!this.config.hierarchical.enabled || result.hierarchicalResult.isSuccess) &&
        (!this.config.relationship.enabled || result.relationshipResult.isSuccess) &&
        (!this.config.constraints.enabled || result.constraintResult.isValid)
      );

      // 6. 성능 메트릭 계산
      result.performance.totalExecutionTime = performance.now() - updateStartTime;
      result.performance.elementsProcessed = result.hierarchicalResult.affectedElements?.length || 0;

    } catch (error) {
      result.isSuccess = false;
      result.feedback.errors.push(`통합 드래그 업데이트 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.updatePerformanceMetrics('update', result.performance.totalExecutionTime, result.isSuccess);
    return result;
  }

  /**
   * 통합 드래그 완료
   */
  async completeIntegratedDrag(
    dragSessionId: string,
    shouldCommit: boolean = true
  ): Promise<{
    isSuccess: boolean;
    finalResult?: IntegratedDragResult;
    summary: {
      totalTime: number;
      elementsProcessed: number;
      changesApplied: number;
      conflictsResolved: number;
    };
  }> {
    const completeStartTime = performance.now();
    
    try {
      // 1. 계층적 드래그 완료
      let hierarchicalResult = null;
      if (this.config.hierarchical.enabled) {
        hierarchicalResult = await this.hierarchicalDrag.completeDrag(dragSessionId, shouldCommit);
      }

      // 2. 관계 컨텍스트 정리
      if (this.config.relationship.enabled && hierarchicalResult?.bundleId) {
        this.parentChildSystem.finalizeDragRelationshipContext(hierarchicalResult.bundleId);
      }

      // 3. 실시간 업데이트 동기화
      if (this.config.realTimeUpdates.enabled) {
        await this.hierarchyUpdater.forceSync();
      }

      const totalTime = performance.now() - completeStartTime;
      
      return {
        isSuccess: true,
        finalResult: hierarchicalResult ? this.convertToIntegratedResult(hierarchicalResult) : undefined,
        summary: {
          totalTime,
          elementsProcessed: hierarchicalResult?.performanceMetrics.elementsProcessed || 0,
          changesApplied: 1,
          conflictsResolved: 0
        }
      };

    } catch (error) {
      console.error('통합 드래그 완료 중 오류:', error);
      return {
        isSuccess: false,
        summary: {
          totalTime: performance.now() - completeStartTime,
          elementsProcessed: 0,
          changesApplied: 0,
          conflictsResolved: 0
        }
      };
    }
  }

  /**
   * 드래그 취소
   */
  async cancelIntegratedDrag(dragSessionId: string): Promise<void> {
    try {
      // 모든 시스템에서 드래그 취소
      if (this.config.hierarchical.enabled) {
        await this.hierarchicalDrag.cancelDrag(dragSessionId);
      }

      // 관계 컨텍스트 정리
      if (this.config.relationship.enabled) {
        // 실제 구현에서는 관계 컨텍스트 정리 필요
      }

      console.log(`통합 드래그 취소 완료: ${dragSessionId}`);
    } catch (error) {
      console.error('통합 드래그 취소 중 오류:', error);
    }
  }

  // ===== 유틸리티 메서드들 =====

  private calculateBundleDepth(bundleId: string, relations: NestedBundleRelation[]): number {
    let depth = 0;
    let currentId = bundleId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const parentRelation = relations.find(rel => rel.childBundleId === currentId);
      if (parentRelation) {
        depth++;
        currentId = parentRelation.parentBundleId;
      } else {
        break;
      }
    }

    return depth;
  }

  private convertToIntegratedResult(hierarchicalResult: any): IntegratedDragResult {
    // HierarchicalMoveResult를 IntegratedDragResult로 변환
    return {
      isSuccess: hierarchicalResult.isSuccess,
      bundleId: hierarchicalResult.bundleId,
      deltaTime: hierarchicalResult.deltaTime,
      hierarchicalResult,
      relationshipResult: {
        isSuccess: true,
        updatedBundles: new Map(),
        updatedRelations: [],
        appliedChanges: [],
        conflicts: []
      },
      constraintResult: {
        isValid: true,
        violations: [],
        allowedMoveDistance: Infinity,
        allowedMoveSpeed: Infinity,
        recommendations: { alternativePositions: [], safeZones: [], optimizations: [] },
        performance: { validationTime: 0, constraintsChecked: 0, violationsDetected: 0 }
      },
      performance: {
        totalExecutionTime: hierarchicalResult.performanceMetrics?.totalDragTime || 0,
        hierarchicalTime: hierarchicalResult.performanceMetrics?.totalDragTime || 0,
        relationshipTime: 0,
        constraintTime: 0,
        updateTime: 0,
        elementsProcessed: hierarchicalResult.performanceMetrics?.elementsProcessed || 0,
        conflictsResolved: 0
      },
      feedback: {
        success: ['드래그 완료'],
        warnings: [],
        errors: [],
        recommendations: []
      }
    };
  }

  private async handleHierarchyUpdate(event: any): Promise<void> {
    // 계층 업데이트 이벤트 처리
    console.log('계층 업데이트 이벤트 처리:', event.type);
  }

  private updatePerformanceMetrics(
    operation: 'start' | 'update' | 'complete',
    executionTime: number,
    isSuccess: boolean
  ): void {
    if (operation === 'update') {
      this.performanceMetrics.totalDrags++;
      if (isSuccess) {
        this.performanceMetrics.successfulDrags++;
      }
      
      this.performanceMetrics.averageExecutionTime = 
        (this.performanceMetrics.averageExecutionTime * (this.performanceMetrics.totalDrags - 1) + executionTime) /
        this.performanceMetrics.totalDrags;
        
      this.performanceMetrics.peakExecutionTime = Math.max(
        this.performanceMetrics.peakExecutionTime,
        executionTime
      );
    }
  }

  // ===== 공개 API =====

  /**
   * 시스템 설정 업데이트
   */
  updateConfig(newConfig: Partial<DragSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 설정 변경에 따른 시스템 재초기화 (필요한 경우)
    if (newConfig.hierarchical || newConfig.relationship || newConfig.constraints || newConfig.realTimeUpdates) {
      this.initializeSystems();
    }
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): DragSystemConfig {
    return { ...this.config };
  }

  /**
   * 성능 메트릭 조회
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      successRate: this.performanceMetrics.totalDrags > 0 ? 
        this.performanceMetrics.successfulDrags / this.performanceMetrics.totalDrags : 1,
      hierarchical: this.hierarchicalDrag.getOverallPerformanceStats(),
      constraints: this.constraintSystem.getDiagnostics(),
      realTimeUpdates: this.hierarchyUpdater.getStatistics()
    };
  }

  /**
   * 시스템 상태 진단
   */
  getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      performance: this.getPerformanceMetrics(),
      activeComponents: {
        hierarchicalDrag: this.config.hierarchical.enabled,
        parentChildSystem: this.config.relationship.enabled,
        constraintSystem: this.config.constraints.enabled,
        hierarchyUpdater: this.config.realTimeUpdates.enabled
      }
    };
  }

  /**
   * 시스템 리셋
   */
  reset(): void {
    this.hierarchicalDrag.clearCaches();
    this.constraintSystem.clearCache();
    this.constraintSystem.resetStatistics();
    this.hierarchyUpdater.reset();
    
    this.performanceMetrics = {
      totalDrags: 0,
      successfulDrags: 0,
      averageExecutionTime: 0,
      peakExecutionTime: 0,
      totalElementsProcessed: 0,
      totalConflictsResolved: 0
    };
  }
}

// ===== 전역 인스턴스 관리 =====

let globalIntegratedDragSystem: IntegratedNestedDragSystem | null = null;

export function getGlobalIntegratedDragSystem(): IntegratedNestedDragSystem {
  if (!globalIntegratedDragSystem) {
    globalIntegratedDragSystem = new IntegratedNestedDragSystem();
  }
  return globalIntegratedDragSystem;
}

export function resetGlobalIntegratedDragSystem(): void {
  if (globalIntegratedDragSystem) {
    globalIntegratedDragSystem.reset();
    globalIntegratedDragSystem = null;
  }
}

export function configureGlobalDragSystem(config: Partial<DragSystemConfig>): void {
  const system = getGlobalIntegratedDragSystem();
  system.updateConfig(config);
}

// ===== 유틸리티 함수들 =====

/**
 * 빠른 드래그 시작 (간소화된 API)
 */
export async function quickStartDrag(
  bundleId: string,
  startPosition: { x: number; y: number },
  bundles: Map<string, NestedBundle>,
  relations: NestedBundleRelation[],
  tracks: TimelineTrack[]
) {
  const system = getGlobalIntegratedDragSystem();
  return await system.startIntegratedDrag(bundleId, startPosition, bundles, relations, tracks);
}

/**
 * 빠른 드래그 업데이트 (간소화된 API)
 */
export async function quickUpdateDrag(
  dragSessionId: string,
  newPosition: { x: number; y: number },
  deltaTime: number,
  bundles: Map<string, NestedBundle>,
  relations: NestedBundleRelation[],
  tracks: TimelineTrack[]
) {
  const system = getGlobalIntegratedDragSystem();
  return await system.updateIntegratedDrag(dragSessionId, newPosition, deltaTime, bundles, relations, tracks);
}

/**
 * 빠른 드래그 완료 (간소화된 API)
 */
export async function quickCompleteDrag(dragSessionId: string, shouldCommit: boolean = true) {
  const system = getGlobalIntegratedDragSystem();
  return await system.completeIntegratedDrag(dragSessionId, shouldCommit);
}

// ===== 타입 재export =====
export type {
  IntegratedDragResult,
  DragSystemConfig
};
