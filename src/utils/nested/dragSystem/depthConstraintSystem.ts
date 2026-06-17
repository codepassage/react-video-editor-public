/**
 * @fileoverview 깊이별 이동 제약 조건 시스템
 * @description 중첩 Bundle의 깊이에 따른 드래그 이동 제약 조건을 관리하는 시스템
 * @version 1.0.0
 * @created 2025-06-22
 */

import {
  BundleElement,
  NestedBundle,
  BundleHierarchyNode,
  NestedBundleRelation,
  DragConstraints
} from '../../../types/nested';

import { TimelineTrack } from '../../../types/timeline';

// ===== 깊이별 제약 조건 정의 =====

/**
 * 깊이별 제약 조건 설정
 */
interface DepthConstraint {
  /** 깊이 레벨 */
  depth: number;
  /** 이 깊이에서의 최대 이동 거리 (초) */
  maxMoveDistance?: number;
  /** 이 깊이에서 허용되는 최대 속도 (단위/초) */
  maxMoveSpeed?: number;
  /** 트랙 간 이동 허용 여부 */
  allowCrossTrackMove: boolean;
  /** 계층 간 이동 허용 여부 */
  allowCrossHierarchyMove: boolean;
  /** 시간 경계 제약 */
  timeBoundaryConstraints: {
    /** 음수 시간으로 이동 허용 여부 */
    allowNegativeTime: boolean;
    /** 다른 요소와의 최소 간격 (초) */
    minGapWithOthers: number;
    /** 부모 범위 벗어남 허용 여부 */
    allowExceedParentRange: boolean;
  };
  /** 성능 제약 */
  performanceConstraints: {
    /** 동시 이동 가능한 최대 요소 수 */
    maxConcurrentElements: number;
    /** 실시간 검증 간격 (ms) */
    validationInterval: number;
    /** 배치 업데이트 임계값 */
    batchUpdateThreshold: number;
  };
  /** 사용자 경험 제약 */
  userExperienceConstraints: {
    /** 시각적 피드백 제공 여부 */
    showVisualFeedback: boolean;
    /** 제약 위반 시 자동 보정 여부 */
    autoCorrectViolations: boolean;
    /** 경고 메시지 표시 여부 */
    showWarningMessages: boolean;
  };
}

/**
 * 제약 조건 위반 정보
 */
interface ConstraintViolation {
  type: 'depth' | 'distance' | 'speed' | 'boundary' | 'performance' | 'hierarchy';
  severity: 'info' | 'warning' | 'error' | 'critical';
  depth: number;
  bundleId: string;
  constraint: keyof DepthConstraint;
  currentValue: number;
  limitValue: number;
  message: string;
  suggestedAction: 'ignore' | 'adjust' | 'block' | 'alternative';
  autoCorrection?: {
    canAutoCorrect: boolean;
    correctedValue: number;
    description: string;
  };
}

/**
 * 제약 조건 검증 결과
 */
interface ConstraintValidationResult {
  isValid: boolean;
  violations: ConstraintViolation[];
  allowedMoveDistance: number;
  allowedMoveSpeed: number;
  recommendations: {
    alternativePositions: number[];
    safeZones: Array<{ start: number; end: number }>;
    optimizations: string[];
  };
  performance: {
    validationTime: number;
    constraintsChecked: number;
    violationsDetected: number;
  };
}

/**
 * 깊이별 이동 통계
 */
interface DepthMoveStatistics {
  depth: number;
  totalMoves: number;
  successfulMoves: number;
  violatedMoves: number;
  averageMoveDistance: number;
  averageMoveSpeed: number;
  commonViolations: Map<string, number>;
  performanceMetrics: {
    averageValidationTime: number;
    averageExecutionTime: number;
    cacheHitRate: number;
  };
}

// ===== 깊이별 제약 조건 관리자 =====

/**
 * 깊이별 이동 제약 조건 시스템
 */
export class DepthConstraintSystem {
  private depthConstraints: Map<number, DepthConstraint> = new Map();
  private violationHistory: Map<string, ConstraintViolation[]> = new Map();
  private moveStatistics: Map<number, DepthMoveStatistics> = new Map();
  private constraintCache: Map<string, ConstraintValidationResult> = new Map();

  // 기본 설정
  private readonly config = {
    maxDepthLevels: 10,
    defaultConstraints: {
      maxMoveDistance: 300, // 5분
      maxMoveSpeed: 50, // 50 단위/초
      allowCrossTrackMove: true,
      allowCrossHierarchyMove: false,
      timeBoundaryConstraints: {
        allowNegativeTime: false,
        minGapWithOthers: 0.1, // 0.1초
        allowExceedParentRange: false
      },
      performanceConstraints: {
        maxConcurrentElements: 100,
        validationInterval: 50, // 50ms
        batchUpdateThreshold: 20
      },
      userExperienceConstraints: {
        showVisualFeedback: true,
        autoCorrectViolations: true,
        showWarningMessages: true
      }
    },
    cacheExpirationMs: 30000,
    statisticsRetentionDays: 7,
    performanceLogging: true
  };

  constructor() {
    this.initializeDefaultConstraints();
  }

  /**
   * 기본 제약 조건 초기화
   */
  private initializeDefaultConstraints(): void {
    // 깊이별로 점진적으로 제한적인 제약 조건 설정
    for (let depth = 0; depth <= this.config.maxDepthLevels; depth++) {
      const constraintMultiplier = Math.max(0.1, 1 - (depth * 0.1)); // 깊이가 깊을수록 제한적
      
      const constraint: DepthConstraint = {
        depth,
        maxMoveDistance: this.config.defaultConstraints.maxMoveDistance * constraintMultiplier,
        maxMoveSpeed: this.config.defaultConstraints.maxMoveSpeed * constraintMultiplier,
        allowCrossTrackMove: depth <= 3, // 깊이 3까지만 트랙 간 이동 허용
        allowCrossHierarchyMove: depth <= 1, // 깊이 1까지만 계층 간 이동 허용
        timeBoundaryConstraints: {
          allowNegativeTime: false,
          minGapWithOthers: 0.1 * (depth + 1), // 깊이가 깊을수록 더 큰 간격 필요
          allowExceedParentRange: depth <= 2 // 깊이 2까지만 부모 범위 초과 허용
        },
        performanceConstraints: {
          maxConcurrentElements: Math.max(10, this.config.defaultConstraints.performanceConstraints.maxConcurrentElements - (depth * 10)),
          validationInterval: this.config.defaultConstraints.performanceConstraints.validationInterval * (depth + 1),
          batchUpdateThreshold: Math.max(5, this.config.defaultConstraints.performanceConstraints.batchUpdateThreshold - (depth * 2))
        },
        userExperienceConstraints: {
          showVisualFeedback: true,
          autoCorrectViolations: depth <= 5, // 깊은 깊이에서는 자동 보정 비활성화
          showWarningMessages: true
        }
      };

      this.depthConstraints.set(depth, constraint);

      // 통계 초기화
      this.moveStatistics.set(depth, {
        depth,
        totalMoves: 0,
        successfulMoves: 0,
        violatedMoves: 0,
        averageMoveDistance: 0,
        averageMoveSpeed: 0,
        commonViolations: new Map(),
        performanceMetrics: {
          averageValidationTime: 0,
          averageExecutionTime: 0,
          cacheHitRate: 0
        }
      });
    }
  }

  /**
   * 깊이별 제약 조건 검증
   */
  async validateDepthConstraints(
    bundleId: string,
    currentDepth: number,
    moveDistance: number,
    moveSpeed: number,
    deltaTime: number,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[],
    tracks: TimelineTrack[]
  ): Promise<ConstraintValidationResult> {
    const validationStartTime = performance.now();
    
    // 캐시 확인
    const cacheKey = `${bundleId}_${currentDepth}_${moveDistance}_${moveSpeed}_${deltaTime}`;
    const cachedResult = this.constraintCache.get(cacheKey);
    
    if (cachedResult) {
      this.updateCacheHitRate(currentDepth, true);
      return cachedResult;
    }
    
    this.updateCacheHitRate(currentDepth, false);

    const constraint = this.depthConstraints.get(currentDepth);
    if (!constraint) {
      throw new Error(`깊이 ${currentDepth}에 대한 제약 조건을 찾을 수 없습니다.`);
    }

    const result: ConstraintValidationResult = {
      isValid: true,
      violations: [],
      allowedMoveDistance: constraint.maxMoveDistance || Infinity,
      allowedMoveSpeed: constraint.maxMoveSpeed || Infinity,
      recommendations: {
        alternativePositions: [],
        safeZones: [],
        optimizations: []
      },
      performance: {
        validationTime: 0,
        constraintsChecked: 0,
        violationsDetected: 0
      }
    };

    let constraintsChecked = 0;

    try {
      // 1. 이동 거리 제약 검증
      if (constraint.maxMoveDistance && Math.abs(moveDistance) > constraint.maxMoveDistance) {
        const violation: ConstraintViolation = {
          type: 'distance',
          severity: 'error',
          depth: currentDepth,
          bundleId,
          constraint: 'maxMoveDistance',
          currentValue: Math.abs(moveDistance),
          limitValue: constraint.maxMoveDistance,
          message: `이동 거리(${Math.abs(moveDistance).toFixed(2)}s)가 깊이 ${currentDepth}의 최대 허용 거리(${constraint.maxMoveDistance}s)를 초과했습니다.`,
          suggestedAction: 'adjust',
          autoCorrection: constraint.userExperienceConstraints.autoCorrectViolations ? {
            canAutoCorrect: true,
            correctedValue: Math.sign(moveDistance) * constraint.maxMoveDistance,
            description: `이동 거리를 ${constraint.maxMoveDistance}s로 제한`
          } : undefined
        };
        result.violations.push(violation);
        result.isValid = false;
      }
      constraintsChecked++;

      // 2. 이동 속도 제약 검증
      if (constraint.maxMoveSpeed && moveSpeed > constraint.maxMoveSpeed) {
        const violation: ConstraintViolation = {
          type: 'speed',
          severity: 'warning',
          depth: currentDepth,
          bundleId,
          constraint: 'maxMoveSpeed',
          currentValue: moveSpeed,
          limitValue: constraint.maxMoveSpeed,
          message: `이동 속도(${moveSpeed.toFixed(2)})가 깊이 ${currentDepth}의 최대 허용 속도(${constraint.maxMoveSpeed})를 초과했습니다.`,
          suggestedAction: 'adjust',
          autoCorrection: constraint.userExperienceConstraints.autoCorrectViolations ? {
            canAutoCorrect: true,
            correctedValue: constraint.maxMoveSpeed,
            description: `이동 속도를 ${constraint.maxMoveSpeed}로 제한`
          } : undefined
        };
        result.violations.push(violation);
      }
      constraintsChecked++;

      // 3. 시간 경계 제약 검증
      await this.validateTimeBoundaryConstraints(
        bundleId,
        constraint,
        deltaTime,
        bundles,
        relations,
        result
      );
      constraintsChecked++;

      // 4. 트랙 간 이동 제약 검증
      if (!constraint.allowCrossTrackMove) {
        await this.validateCrossTrackConstraints(bundleId, constraint, tracks, result);
      }
      constraintsChecked++;

      // 5. 계층 간 이동 제약 검증
      if (!constraint.allowCrossHierarchyMove) {
        await this.validateCrossHierarchyConstraints(bundleId, constraint, relations, result);
      }
      constraintsChecked++;

      // 6. 성능 제약 검증
      await this.validatePerformanceConstraints(bundleId, constraint, bundles, result);
      constraintsChecked++;

      // 7. 추천 사항 생성
      if (result.violations.length > 0) {
        await this.generateRecommendations(constraint, moveDistance, result);
      }

    } catch (error) {
      result.isValid = false;
      result.violations.push({
        type: 'depth',
        severity: 'critical',
        depth: currentDepth,
        bundleId,
        constraint: 'maxMoveDistance',
        currentValue: 0,
        limitValue: 0,
        message: `제약 조건 검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
        suggestedAction: 'block'
      });
    }

    // 성능 메트릭 계산
    result.performance = {
      validationTime: performance.now() - validationStartTime,
      constraintsChecked,
      violationsDetected: result.violations.length
    };

    // 결과 캐시 저장
    if (this.constraintCache.size < 1000) { // 캐시 크기 제한
      this.constraintCache.set(cacheKey, result);
    }

    // 통계 업데이트
    this.updateMoveStatistics(currentDepth, result);

    // 위반 기록 저장
    if (result.violations.length > 0) {
      this.recordViolations(bundleId, result.violations);
    }

    return result;
  }

  /**
   * 시간 경계 제약 검증
   */
  private async validateTimeBoundaryConstraints(
    bundleId: string,
    constraint: DepthConstraint,
    deltaTime: number,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[],
    result: ConstraintValidationResult
  ): Promise<void> {
    const bundle = bundles.get(bundleId);
    if (!bundle) return;

    const newStartTime = bundle.timeRange.startTime + deltaTime;
    const newEndTime = bundle.timeRange.endTime + deltaTime;

    // 음수 시간 검증
    if (!constraint.timeBoundaryConstraints.allowNegativeTime && newStartTime < 0) {
      result.violations.push({
        type: 'boundary',
        severity: 'error',
        depth: constraint.depth,
        bundleId,
        constraint: 'timeBoundaryConstraints',
        currentValue: newStartTime,
        limitValue: 0,
        message: `음수 시간(${newStartTime.toFixed(2)}s)으로의 이동이 금지되어 있습니다.`,
        suggestedAction: 'adjust',
        autoCorrection: constraint.userExperienceConstraints.autoCorrectViolations ? {
          canAutoCorrect: true,
          correctedValue: -bundle.timeRange.startTime,
          description: '시작 시간을 0초로 제한'
        } : undefined
      });
      result.isValid = false;
    }

    // 부모 범위 초과 검증
    if (!constraint.timeBoundaryConstraints.allowExceedParentRange) {
      const parentRelations = relations.filter(rel => rel.childBundleId === bundleId);
      
      for (const relation of parentRelations) {
        const parentBundle = bundles.get(relation.parentBundleId);
        if (parentBundle) {
          if (newStartTime < parentBundle.timeRange.startTime || newEndTime > parentBundle.timeRange.endTime) {
            result.violations.push({
              type: 'boundary',
              severity: 'warning',
              depth: constraint.depth,
              bundleId,
              constraint: 'timeBoundaryConstraints',
              currentValue: Math.max(
                parentBundle.timeRange.startTime - newStartTime,
                newEndTime - parentBundle.timeRange.endTime
              ),
              limitValue: 0,
              message: `부모 Bundle(${relation.parentBundleId})의 시간 범위를 벗어나는 이동입니다.`,
              suggestedAction: 'adjust',
              autoCorrection: constraint.userExperienceConstraints.autoCorrectViolations ? {
                canAutoCorrect: true,
                correctedValue: Math.max(
                  Math.min(deltaTime, parentBundle.timeRange.endTime - bundle.timeRange.endTime),
                  parentBundle.timeRange.startTime - bundle.timeRange.startTime
                ),
                description: '부모 범위 내로 이동 제한'
              } : undefined
            });
          }
        }
      }
    }

    // 다른 요소와의 최소 간격 검증
    if (constraint.timeBoundaryConstraints.minGapWithOthers > 0) {
      await this.validateMinimumGap(bundleId, constraint, newStartTime, newEndTime, bundles, result);
    }
  }

  /**
   * 최소 간격 검증
   */
  private async validateMinimumGap(
    bundleId: string,
    constraint: DepthConstraint,
    newStartTime: number,
    newEndTime: number,
    bundles: Map<string, NestedBundle>,
    result: ConstraintValidationResult
  ): Promise<void> {
    const minGap = constraint.timeBoundaryConstraints.minGapWithOthers;
    
    for (const [otherId, otherBundle] of bundles) {
      if (otherId === bundleId) continue;

      // 시간 범위 겹침 검사
      const overlapStart = Math.max(newStartTime, otherBundle.timeRange.startTime);
      const overlapEnd = Math.min(newEndTime, otherBundle.timeRange.endTime);
      
      if (overlapStart < overlapEnd) {
        // 겹침 발생
        const overlapDuration = overlapEnd - overlapStart;
        
        result.violations.push({
          type: 'boundary',
          severity: 'warning',
          depth: constraint.depth,
          bundleId,
          constraint: 'timeBoundaryConstraints',
          currentValue: overlapDuration,
          limitValue: 0,
          message: `다른 Bundle(${otherId})과 ${overlapDuration.toFixed(2)}초 겹침이 발생합니다.`,
          suggestedAction: 'adjust'
        });
      } else {
        // 간격 검사
        const gap = Math.min(
          Math.abs(newStartTime - otherBundle.timeRange.endTime),
          Math.abs(otherBundle.timeRange.startTime - newEndTime)
        );
        
        if (gap < minGap && gap > 0) {
          result.violations.push({
            type: 'boundary',
            severity: 'info',
            depth: constraint.depth,
            bundleId,
            constraint: 'timeBoundaryConstraints',
            currentValue: gap,
            limitValue: minGap,
            message: `다른 Bundle(${otherId})과의 간격(${gap.toFixed(2)}s)이 최소 요구 간격(${minGap}s)보다 작습니다.`,
            suggestedAction: 'ignore'
          });
        }
      }
    }
  }

  /**
   * 트랙 간 이동 제약 검증
   */
  private async validateCrossTrackConstraints(
    bundleId: string,
    constraint: DepthConstraint,
    tracks: TimelineTrack[],
    result: ConstraintValidationResult
  ): Promise<void> {
    // 트랙 간 이동 제약 검증 로직 (구현 필요)
    // 실제 구현에서는 Bundle이 어느 트랙에 있는지 확인하고 이동 제한
  }

  /**
   * 계층 간 이동 제약 검증
   */
  private async validateCrossHierarchyConstraints(
    bundleId: string,
    constraint: DepthConstraint,
    relations: NestedBundleRelation[],
    result: ConstraintValidationResult
  ): Promise<void> {
    // 계층 간 이동 제약 검증 로직 (구현 필요)
    // 실제 구현에서는 Bundle의 계층 위치 변경 여부 확인
  }

  /**
   * 성능 제약 검증
   */
  private async validatePerformanceConstraints(
    bundleId: string,
    constraint: DepthConstraint,
    bundles: Map<string, NestedBundle>,
    result: ConstraintValidationResult
  ): Promise<void> {
    const bundle = bundles.get(bundleId);
    if (!bundle) return;

    // 동시 이동 요소 수 검증
    const totalElements = this.countTotalElements(bundle);
    
    if (totalElements > constraint.performanceConstraints.maxConcurrentElements) {
      result.violations.push({
        type: 'performance',
        severity: 'warning',
        depth: constraint.depth,
        bundleId,
        constraint: 'performanceConstraints',
        currentValue: totalElements,
        limitValue: constraint.performanceConstraints.maxConcurrentElements,
        message: `동시 이동 요소 수(${totalElements})가 최대 허용 수(${constraint.performanceConstraints.maxConcurrentElements})를 초과했습니다.`,
        suggestedAction: 'alternative'
      });
    }
  }

  /**
   * 추천 사항 생성
   */
  private async generateRecommendations(
    constraint: DepthConstraint,
    moveDistance: number,
    result: ConstraintValidationResult
  ): Promise<void> {
    // 대안 위치 제안
    if (constraint.maxMoveDistance) {
      const maxDistance = constraint.maxMoveDistance;
      result.recommendations.alternativePositions = [
        Math.sign(moveDistance) * maxDistance * 0.5,
        Math.sign(moveDistance) * maxDistance * 0.75,
        Math.sign(moveDistance) * maxDistance
      ];
    }

    // 안전 구역 제안
    result.recommendations.safeZones = [
      { start: -constraint.maxMoveDistance! || -100, end: constraint.maxMoveDistance! || 100 }
    ];

    // 최적화 제안
    result.recommendations.optimizations = [
      '더 작은 단위로 나누어 이동하기',
      '배치 이동 사용하기',
      '자동 보정 기능 활용하기'
    ];
  }

  // ===== 유틸리티 메서드들 =====

  private countTotalElements(bundle: NestedBundle): number {
    let count = bundle.elements.length;
    
    for (const element of bundle.elements) {
      if (element.type === 'nestedBundle') {
        // 재귀적으로 중첩 Bundle의 요소들도 카운트 (실제 구현 필요)
        count += 10; // 임시값
      }
    }
    
    return count;
  }

  private updateCacheHitRate(depth: number, isHit: boolean): void {
    const stats = this.moveStatistics.get(depth);
    if (stats) {
      // 캐시 히트률 업데이트 로직
    }
  }

  private updateMoveStatistics(depth: number, result: ConstraintValidationResult): void {
    const stats = this.moveStatistics.get(depth);
    if (stats) {
      stats.totalMoves++;
      if (result.isValid) {
        stats.successfulMoves++;
      } else {
        stats.violatedMoves++;
        
        // 일반적인 위반 사항 추적
        for (const violation of result.violations) {
          const violationType = `${violation.type}_${violation.constraint}`;
          stats.commonViolations.set(
            violationType,
            (stats.commonViolations.get(violationType) || 0) + 1
          );
        }
      }
      
      stats.performanceMetrics.averageValidationTime = 
        (stats.performanceMetrics.averageValidationTime * (stats.totalMoves - 1) + result.performance.validationTime) / stats.totalMoves;
    }
  }

  private recordViolations(bundleId: string, violations: ConstraintViolation[]): void {
    const existing = this.violationHistory.get(bundleId) || [];
    existing.push(...violations);
    
    // 기록 크기 제한 (최대 100개)
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    this.violationHistory.set(bundleId, existing);
  }

  /**
   * 제약 조건 자동 보정
   */
  async autoCorrectViolations(
    violations: ConstraintViolation[],
    originalMoveDistance: number
  ): Promise<{
    correctedMoveDistance: number;
    appliedCorrections: Array<{
      violation: ConstraintViolation;
      correction: any;
      description: string;
    }>;
  }> {
    let correctedMoveDistance = originalMoveDistance;
    const appliedCorrections: Array<{
      violation: ConstraintViolation;
      correction: any;
      description: string;
    }> = [];

    for (const violation of violations) {
      if (violation.autoCorrection?.canAutoCorrect) {
        switch (violation.type) {
          case 'distance':
            correctedMoveDistance = Math.sign(correctedMoveDistance) * Math.min(
              Math.abs(correctedMoveDistance),
              violation.autoCorrection.correctedValue
            );
            appliedCorrections.push({
              violation,
              correction: { newDistance: correctedMoveDistance },
              description: violation.autoCorrection.description
            });
            break;
            
          case 'boundary':
            if (violation.constraint === 'timeBoundaryConstraints') {
              correctedMoveDistance = violation.autoCorrection.correctedValue;
              appliedCorrections.push({
                violation,
                correction: { newDistance: correctedMoveDistance },
                description: violation.autoCorrection.description
              });
            }
            break;
        }
      }
    }

    return {
      correctedMoveDistance,
      appliedCorrections
    };
  }

  // ===== 설정 및 관리 메서드들 =====

  /**
   * 깊이별 제약 조건 설정
   */
  setDepthConstraint(depth: number, constraint: Partial<DepthConstraint>): void {
    const existing = this.depthConstraints.get(depth) || this.createDefaultConstraint(depth);
    this.depthConstraints.set(depth, { ...existing, ...constraint });
  }

  /**
   * 제약 조건 조회
   */
  getDepthConstraint(depth: number): DepthConstraint | undefined {
    return this.depthConstraints.get(depth);
  }

  /**
   * 모든 제약 조건 조회
   */
  getAllDepthConstraints(): Map<number, DepthConstraint> {
    return new Map(this.depthConstraints);
  }

  /**
   * 이동 통계 조회
   */
  getMoveStatistics(depth?: number): DepthMoveStatistics | Map<number, DepthMoveStatistics> {
    if (depth !== undefined) {
      return this.moveStatistics.get(depth)!;
    }
    return new Map(this.moveStatistics);
  }

  /**
   * 위반 기록 조회
   */
  getViolationHistory(bundleId?: string): ConstraintViolation[] | Map<string, ConstraintViolation[]> {
    if (bundleId) {
      return this.violationHistory.get(bundleId) || [];
    }
    return new Map(this.violationHistory);
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.constraintCache.clear();
  }

  /**
   * 통계 리셋
   */
  resetStatistics(): void {
    for (const [depth] of this.moveStatistics) {
      this.moveStatistics.set(depth, {
        depth,
        totalMoves: 0,
        successfulMoves: 0,
        violatedMoves: 0,
        averageMoveDistance: 0,
        averageMoveSpeed: 0,
        commonViolations: new Map(),
        performanceMetrics: {
          averageValidationTime: 0,
          averageExecutionTime: 0,
          cacheHitRate: 0
        }
      });
    }
  }

  /**
   * 기본 제약 조건 생성
   */
  private createDefaultConstraint(depth: number): DepthConstraint {
    const constraintMultiplier = Math.max(0.1, 1 - (depth * 0.1));
    
    return {
      depth,
      maxMoveDistance: this.config.defaultConstraints.maxMoveDistance * constraintMultiplier,
      maxMoveSpeed: this.config.defaultConstraints.maxMoveSpeed * constraintMultiplier,
      allowCrossTrackMove: depth <= 3,
      allowCrossHierarchyMove: depth <= 1,
      timeBoundaryConstraints: {
        allowNegativeTime: false,
        minGapWithOthers: 0.1 * (depth + 1),
        allowExceedParentRange: depth <= 2
      },
      performanceConstraints: {
        maxConcurrentElements: Math.max(10, this.config.defaultConstraints.performanceConstraints.maxConcurrentElements - (depth * 10)),
        validationInterval: this.config.defaultConstraints.performanceConstraints.validationInterval * (depth + 1),
        batchUpdateThreshold: Math.max(5, this.config.defaultConstraints.performanceConstraints.batchUpdateThreshold - (depth * 2))
      },
      userExperienceConstraints: {
        showVisualFeedback: true,
        autoCorrectViolations: depth <= 5,
        showWarningMessages: true
      }
    };
  }

  /**
   * 시스템 상태 진단
   */
  getDiagnostics(): {
    constraintCount: number;
    cacheSize: number;
    totalMoves: number;
    totalViolations: number;
    averageValidationTime: number;
    memoryUsage: string;
  } {
    const totalMoves = Array.from(this.moveStatistics.values()).reduce((sum, stat) => sum + stat.totalMoves, 0);
    const totalViolations = Array.from(this.violationHistory.values()).reduce((sum, violations) => sum + violations.length, 0);
    const avgValidationTime = Array.from(this.moveStatistics.values()).reduce((sum, stat) => sum + stat.performanceMetrics.averageValidationTime, 0) / this.moveStatistics.size;

    return {
      constraintCount: this.depthConstraints.size,
      cacheSize: this.constraintCache.size,
      totalMoves,
      totalViolations,
      averageValidationTime: avgValidationTime,
      memoryUsage: `${Math.round((JSON.stringify(Array.from(this.depthConstraints.values())).length / 1024))}KB`
    };
  }
}

// ===== Export =====
export default DepthConstraintSystem;

// 전역 인스턴스
let globalDepthConstraintSystem: DepthConstraintSystem | null = null;

export function getGlobalDepthConstraintSystem(): DepthConstraintSystem {
  if (!globalDepthConstraintSystem) {
    globalDepthConstraintSystem = new DepthConstraintSystem();
  }
  return globalDepthConstraintSystem;
}

export function resetGlobalDepthConstraintSystem(): void {
  globalDepthConstraintSystem = null;
}
