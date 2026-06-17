/**
 * @fileoverview 계층적 드래그 로직 시스템
 * @description 중첩 Bundle의 계층 구조를 유지하면서 드래그 이동을 처리하는 시스템
 * @version 1.0.0
 * @created 2025-06-22
 */

import {
  BundleElement,
  NestedBundle,
  BundleHierarchyNode,
  NestedBundleRelation,
  DragValidationResult,
  HierarchicalMoveResult,
  DragConstraints,
  DragContext,
  BundleElementType,
  RelationshipType
} from '../../../types/nested';

import { TimelineTrack } from '../../../types/timeline';
import { Bundle } from '../../../types/bundles';
import { TemplateGroup } from '../../../types/templates';

// ===== 드래그 컨텍스트 및 상태 관리 =====

/**
 * 드래그 세션 정보
 */
interface DragSession {
  id: string;
  bundleId: string;
  startTime: number;
  currentTime: number;
  deltaTime: number;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  draggedElements: BundleElement[];
  affectedChildren: BundleElement[];
  constraints: DragConstraints;
  validationCache: Map<string, DragValidationResult>;
  performance: {
    startTimestamp: number;
    validationCount: number;
    updateCount: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

/**
 * 드래그 성능 메트릭
 */
interface DragPerformanceMetrics {
  totalDragTime: number;
  validationLatency: number;
  updateLatency: number;
  cacheEfficiency: number;
  elementsProcessed: number;
  constraintChecks: number;
  relationshipUpdates: number;
}

/**
 * 계층적 드래그 결과
 */
interface HierarchicalDragResult extends HierarchicalMoveResult {
  dragSession: DragSession;
  performanceMetrics: DragPerformanceMetrics;
  visualFeedback: {
    highlightedElements: string[];
    warningElements: string[];
    errorElements: string[];
    previewPositions: Map<string, number>;
  };
  rollbackData?: {
    originalPositions: Map<string, number>;
    originalRelations: NestedBundleRelation[];
    originalHierarchy: BundleHierarchyNode[];
  };
}

// ===== 계층적 드래그 로직 메인 클래스 =====

/**
 * 계층적 드래그 로직 관리자
 * 중첩 Bundle의 계층 구조를 유지하면서 드래그 이동을 처리
 */
export class HierarchicalDragLogic {
  private activeDragSessions: Map<string, DragSession> = new Map();
  private dragConstraints: Map<string, DragConstraints> = new Map();
  private validationCache: Map<string, DragValidationResult> = new Map();
  private performanceTracker: Map<string, DragPerformanceMetrics> = new Map();

  // 성능 설정
  private readonly config = {
    maxConcurrentDrags: 10,
    validationCacheSize: 1000,
    cacheExpirationMs: 30000,
    maxDragDepth: 10,
    performanceLogging: true,
    realTimeValidation: true,
    batchUpdateThreshold: 50,
    animationFrameOptimization: true
  };

  /**
   * 드래그 세션 시작
   */
  async startHierarchicalDrag(
    bundleId: string,
    startPosition: { x: number; y: number },
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[],
    constraints?: Partial<DragConstraints>
  ): Promise<DragSession> {
    const startTime = performance.now();
    
    // 활성 드래그 세션 수 제한 확인
    if (this.activeDragSessions.size >= this.config.maxConcurrentDrags) {
      throw new Error(`최대 동시 드래그 수(${this.config.maxConcurrentDrags})를 초과했습니다.`);
    }

    const bundle = bundles.get(bundleId);
    if (!bundle) {
      throw new Error(`Bundle을 찾을 수 없습니다: ${bundleId}`);
    }

    // 드래그 가능한 요소들 수집
    const draggedElements = await this.collectDraggedElements(bundle, bundles, relations);
    const affectedChildren = await this.collectAffectedChildren(bundle, bundles, relations);

    // 드래그 제약 조건 설정
    const finalConstraints: DragConstraints = {
      maxDepth: this.config.maxDragDepth,
      preserveHierarchy: true,
      allowCrossTrackMove: true,
      respectTimeConstraints: true,
      preventCircularReferences: true,
      maintainRelativePositions: true,
      ...constraints
    };

    // 드래그 세션 생성
    const session: DragSession = {
      id: `drag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bundleId,
      startTime: bundle.timeRange.startTime,
      currentTime: bundle.timeRange.startTime,
      deltaTime: 0,
      startPosition,
      currentPosition: startPosition,
      draggedElements,
      affectedChildren,
      constraints: finalConstraints,
      validationCache: new Map(),
      performance: {
        startTimestamp: startTime,
        validationCount: 0,
        updateCount: 0,
        cacheHits: 0,
        cacheMisses: 0
      }
    };

    this.activeDragSessions.set(session.id, session);
    this.dragConstraints.set(bundleId, finalConstraints);

    // 성능 추적 시작
    this.performanceTracker.set(session.id, {
      totalDragTime: 0,
      validationLatency: 0,
      updateLatency: 0,
      cacheEfficiency: 0,
      elementsProcessed: draggedElements.length + affectedChildren.length,
      constraintChecks: 0,
      relationshipUpdates: 0
    });

    return session;
  }

  /**
   * 드래그 이동 처리
   */
  async updateHierarchicalDrag(
    sessionId: string,
    newPosition: { x: number; y: number },
    deltaTime: number,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[],
    tracks: TimelineTrack[]
  ): Promise<HierarchicalDragResult> {
    const updateStartTime = performance.now();
    const session = this.activeDragSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`활성 드래그 세션을 찾을 수 없습니다: ${sessionId}`);
    }

    // 세션 상태 업데이트
    session.currentPosition = newPosition;
    session.deltaTime = deltaTime;
    session.currentTime = session.startTime + deltaTime;
    session.performance.updateCount++;

    // 드래그 유효성 검증
    const validationResult = await this.validateHierarchicalDrag(
      session,
      bundles,
      relations,
      tracks
    );

    if (!validationResult.isValid) {
      // 유효하지 않은 드래그의 경우 시각적 피드백만 제공
      return {
        isSuccess: false,
        bundleId: session.bundleId,
        deltaTime,
        affectedElements: [],
        updatedRelations: [],
        hierarchy: [],
        warnings: validationResult.warnings,
        errors: validationResult.errors,
        performance: {
          executionTime: performance.now() - updateStartTime,
          elementsProcessed: 0,
          relationshipsUpdated: 0,
          cacheEfficiency: this.calculateCacheEfficiency(session)
        },
        dragSession: session,
        performanceMetrics: this.getPerformanceMetrics(sessionId),
        visualFeedback: {
          highlightedElements: [],
          warningElements: validationResult.warnings.map(w => w.elementId).filter(Boolean),
          errorElements: validationResult.errors.map(e => e.elementId).filter(Boolean),
          previewPositions: new Map()
        }
      };
    }

    // 계층적 이동 실행
    const moveResult = await this.executeHierarchicalMove(
      session,
      bundles,
      relations,
      tracks
    );

    // 시각적 피드백 생성
    const visualFeedback = await this.generateVisualFeedback(
      session,
      moveResult,
      bundles
    );

    // 성능 메트릭 업데이트
    const metrics = this.performanceTracker.get(sessionId)!;
    metrics.updateLatency = performance.now() - updateStartTime;
    metrics.relationshipUpdates += moveResult.updatedRelations.length;

    return {
      ...moveResult,
      dragSession: session,
      performanceMetrics: this.getPerformanceMetrics(sessionId),
      visualFeedback
    };
  }

  /**
   * 드래그 완료 처리
   */
  async completeDrag(
    sessionId: string,
    shouldCommit: boolean = true
  ): Promise<HierarchicalDragResult | null> {
    const session = this.activeDragSessions.get(sessionId);
    
    if (!session) {
      console.warn(`완료할 드래그 세션을 찾을 수 없습니다: ${sessionId}`);
      return null;
    }

    const completionTime = performance.now();
    const totalDragTime = completionTime - session.performance.startTimestamp;

    // 성능 메트릭 최종 계산
    const metrics = this.performanceTracker.get(sessionId)!;
    metrics.totalDragTime = totalDragTime;
    metrics.cacheEfficiency = this.calculateCacheEfficiency(session);

    let finalResult: HierarchicalDragResult | null = null;

    if (shouldCommit && session.deltaTime !== 0) {
      // 최종 이동 커밋 - 실제 Bundle 상태 업데이트 필요
      finalResult = {
        isSuccess: true,
        bundleId: session.bundleId,
        deltaTime: session.deltaTime,
        affectedElements: [...session.draggedElements, ...session.affectedChildren],
        updatedRelations: [], // 실제 구현에서는 업데이트된 관계들 반환
        hierarchy: [], // 실제 구현에서는 업데이트된 계층 구조 반환
        warnings: [],
        errors: [],
        performance: {
          executionTime: totalDragTime,
          elementsProcessed: session.draggedElements.length + session.affectedChildren.length,
          relationshipsUpdated: 0,
          cacheEfficiency: metrics.cacheEfficiency
        },
        dragSession: session,
        performanceMetrics: metrics,
        visualFeedback: {
          highlightedElements: [],
          warningElements: [],
          errorElements: [],
          previewPositions: new Map()
        }
      };
    }

    // 드래그 세션 정리
    this.activeDragSessions.delete(sessionId);
    this.performanceTracker.delete(sessionId);
    this.dragConstraints.delete(session.bundleId);

    // 캐시 정리
    this.cleanupValidationCache();

    return finalResult;
  }

  /**
   * 드래그 취소
   */
  async cancelDrag(sessionId: string): Promise<void> {
    const session = this.activeDragSessions.get(sessionId);
    
    if (session) {
      // 드래그 세션 정리
      this.activeDragSessions.delete(sessionId);
      this.performanceTracker.delete(sessionId);
      this.dragConstraints.delete(session.bundleId);
    }

    // 캐시 정리
    this.cleanupValidationCache();
  }

  // ===== 드래그 요소 수집 =====

  /**
   * 드래그 대상 요소들 수집
   */
  private async collectDraggedElements(
    bundle: NestedBundle,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[]
  ): Promise<BundleElement[]> {
    const draggedElements: BundleElement[] = [];

    // Bundle 내 모든 요소 수집
    for (const element of bundle.elements) {
      draggedElements.push(element);

      // 중첩 Bundle인 경우 하위 요소들도 수집
      if (element.type === 'nestedBundle' && element.nestedBundle) {
        const nestedBundle = bundles.get(element.nestedBundle.bundleId);
        if (nestedBundle) {
          const nestedElements = await this.collectDraggedElements(
            nestedBundle,
            bundles,
            relations
          );
          draggedElements.push(...nestedElements);
        }
      }
    }

    return draggedElements;
  }

  /**
   * 드래그에 영향받는 자식 요소들 수집
   */
  private async collectAffectedChildren(
    bundle: NestedBundle,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[]
  ): Promise<BundleElement[]> {
    const affectedChildren: BundleElement[] = [];

    // 현재 Bundle을 부모로 하는 관계들 찾기
    const childRelations = relations.filter(rel => rel.parentBundleId === bundle.id);

    for (const relation of childRelations) {
      const childBundle = bundles.get(relation.childBundleId);
      if (childBundle) {
        // 자식 Bundle의 모든 요소 수집
        affectedChildren.push(...childBundle.elements);

        // 재귀적으로 손자 Bundle들도 수집
        const grandChildren = await this.collectAffectedChildren(
          childBundle,
          bundles,
          relations
        );
        affectedChildren.push(...grandChildren);
      }
    }

    return affectedChildren;
  }

  // ===== 드래그 검증 =====

  /**
   * 계층적 드래그 유효성 검증
   */
  private async validateHierarchicalDrag(
    session: DragSession,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[],
    tracks: TimelineTrack[]
  ): Promise<DragValidationResult> {
    const validationStartTime = performance.now();
    session.performance.validationCount++;

    // 캐시 확인
    const cacheKey = `${session.bundleId}_${session.deltaTime}_${session.currentPosition.x}_${session.currentPosition.y}`;
    const cachedResult = session.validationCache.get(cacheKey);
    
    if (cachedResult) {
      session.performance.cacheHits++;
      return cachedResult;
    }

    session.performance.cacheMisses++;

    const result: DragValidationResult = {
      isValid: true,
      canMove: true,
      warnings: [],
      errors: [],
      constraints: session.constraints,
      affectedElements: [...session.draggedElements, ...session.affectedChildren],
      timeConflicts: [],
      hierarchyIssues: [],
      performance: {
        validationTime: 0,
        rulesChecked: 0,
        constraintsEvaluated: 0
      }
    };

    let rulesChecked = 0;
    const metrics = this.performanceTracker.get(session.id)!;

    try {
      // 1. 기본 제약 조건 검증
      if (session.constraints.respectTimeConstraints) {
        const timeValidation = this.validateTimeConstraints(session, tracks);
        result.warnings.push(...timeValidation.warnings);
        result.errors.push(...timeValidation.errors);
        if (timeValidation.errors.length > 0) result.isValid = false;
        rulesChecked++;
      }

      // 2. 계층 구조 무결성 검증
      if (session.constraints.preserveHierarchy) {
        const hierarchyValidation = this.validateHierarchyIntegrity(session, bundles, relations);
        result.warnings.push(...hierarchyValidation.warnings);
        result.errors.push(...hierarchyValidation.errors);
        result.hierarchyIssues.push(...hierarchyValidation.hierarchyIssues);
        if (hierarchyValidation.errors.length > 0) result.isValid = false;
        rulesChecked++;
      }

      // 3. 순환 참조 방지 검증
      if (session.constraints.preventCircularReferences) {
        const circularValidation = this.validateCircularReferences(session, relations);
        result.errors.push(...circularValidation.errors);
        if (circularValidation.errors.length > 0) result.isValid = false;
        rulesChecked++;
      }

      // 4. 최대 깊이 제한 검증
      if (session.constraints.maxDepth) {
        const depthValidation = this.validateDepthConstraints(session, bundles, relations);
        result.warnings.push(...depthValidation.warnings);
        result.errors.push(...depthValidation.errors);
        if (depthValidation.errors.length > 0) result.isValid = false;
        rulesChecked++;
      }

      // 5. 트랙 간 이동 제약 검증
      if (!session.constraints.allowCrossTrackMove) {
        const trackValidation = this.validateTrackConstraints(session, tracks);
        result.errors.push(...trackValidation.errors);
        if (trackValidation.errors.length > 0) result.isValid = false;
        rulesChecked++;
      }

      // 6. 상대적 위치 유지 검증
      if (session.constraints.maintainRelativePositions) {
        const positionValidation = this.validateRelativePositions(session);
        result.warnings.push(...positionValidation.warnings);
        rulesChecked++;
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        code: 'VALIDATION_ERROR',
        message: `드래그 검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
        elementId: session.bundleId
      });
    }

    // 성능 메트릭 업데이트
    const validationTime = performance.now() - validationStartTime;
    result.performance = {
      validationTime,
      rulesChecked,
      constraintsEvaluated: Object.keys(session.constraints).length
    };

    metrics.validationLatency = validationTime;
    metrics.constraintChecks += rulesChecked;

    // 캐시에 저장 (크기 제한 확인)
    if (session.validationCache.size < this.config.validationCacheSize) {
      session.validationCache.set(cacheKey, result);
    }

    return result;
  }

  // ===== 제약 조건 검증 메서드들 =====

  private validateTimeConstraints(
    session: DragSession,
    tracks: TimelineTrack[]
  ): Pick<DragValidationResult, 'warnings' | 'errors'> {
    const warnings: DragValidationResult['warnings'] = [];
    const errors: DragValidationResult['errors'] = [];

    const newStartTime = session.startTime + session.deltaTime;

    // 음수 시간 검증
    if (newStartTime < 0) {
      errors.push({
        code: 'NEGATIVE_TIME',
        message: `Bundle을 음수 시간(${newStartTime.toFixed(2)}s)으로 이동할 수 없습니다.`,
        severity: 'error',
        elementId: session.bundleId
      });
    }

    // 다른 요소들과의 시간 충돌 검증 (구현 필요)
    // 실제 구현에서는 tracks의 다른 요소들과 시간 겹침 검사

    return { warnings, errors };
  }

  private validateHierarchyIntegrity(
    session: DragSession,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[]
  ): Pick<DragValidationResult, 'warnings' | 'errors' | 'hierarchyIssues'> {
    const warnings: DragValidationResult['warnings'] = [];
    const errors: DragValidationResult['errors'] = [];
    const hierarchyIssues: DragValidationResult['hierarchyIssues'] = [];

    // 부모-자식 관계 무결성 검증
    const parentRelations = relations.filter(rel => rel.childBundleId === session.bundleId);
    const childRelations = relations.filter(rel => rel.parentBundleId === session.bundleId);

    // 부모와의 시간 관계 검증
    for (const relation of parentRelations) {
      const parentBundle = bundles.get(relation.parentBundleId);
      if (parentBundle) {
        const newStartTime = session.startTime + session.deltaTime;
        const newEndTime = newStartTime + (session.draggedElements[0]?.endTime - session.draggedElements[0]?.startTime || 0);

        if (newStartTime < parentBundle.timeRange.startTime || newEndTime > parentBundle.timeRange.endTime) {
          hierarchyIssues.push({
            type: 'PARENT_TIME_VIOLATION',
            description: `자식 Bundle이 부모 Bundle의 시간 범위를 벗어납니다.`,
            bundleId: session.bundleId,
            parentBundleId: relation.parentBundleId,
            severity: 'warning'
          });
        }
      }
    }

    return { warnings, errors, hierarchyIssues };
  }

  private validateCircularReferences(
    session: DragSession,
    relations: NestedBundleRelation[]
  ): Pick<DragValidationResult, 'errors'> {
    const errors: DragValidationResult['errors'] = [];

    // 간단한 순환 참조 검증 (실제로는 더 복잡한 알고리즘 필요)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (bundleId: string): boolean => {
      if (recursionStack.has(bundleId)) return true;
      if (visited.has(bundleId)) return false;

      visited.add(bundleId);
      recursionStack.add(bundleId);

      // 해당 Bundle을 부모로 하는 관계들 확인
      const childRelations = relations.filter(rel => rel.parentBundleId === bundleId);
      for (const relation of childRelations) {
        if (hasCycle(relation.childBundleId)) {
          return true;
        }
      }

      recursionStack.delete(bundleId);
      return false;
    };

    if (hasCycle(session.bundleId)) {
      errors.push({
        code: 'CIRCULAR_REFERENCE',
        message: '순환 참조가 감지되었습니다.',
        severity: 'error',
        elementId: session.bundleId
      });
    }

    return { errors };
  }

  private validateDepthConstraints(
    session: DragSession,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[]
  ): Pick<DragValidationResult, 'warnings' | 'errors'> {
    const warnings: DragValidationResult['warnings'] = [];
    const errors: DragValidationResult['errors'] = [];

    // 현재 Bundle의 깊이 계산
    const currentDepth = this.calculateBundleDepth(session.bundleId, relations);

    if (currentDepth > session.constraints.maxDepth!) {
      errors.push({
        code: 'MAX_DEPTH_EXCEEDED',
        message: `최대 중첩 깊이(${session.constraints.maxDepth})를 초과했습니다. 현재 깊이: ${currentDepth}`,
        severity: 'error',
        elementId: session.bundleId
      });
    } else if (currentDepth > session.constraints.maxDepth! * 0.8) {
      warnings.push({
        code: 'APPROACHING_MAX_DEPTH',
        message: `최대 중첩 깊이에 근접했습니다. 현재 깊이: ${currentDepth}/${session.constraints.maxDepth}`,
        severity: 'warning',
        elementId: session.bundleId
      });
    }

    return { warnings, errors };
  }

  private validateTrackConstraints(
    session: DragSession,
    tracks: TimelineTrack[]
  ): Pick<DragValidationResult, 'errors'> {
    const errors: DragValidationResult['errors'] = [];

    // 트랙 간 이동 제한 검증 (구현 필요)
    // 실제 구현에서는 현재 트랙과 대상 트랙 확인

    return { errors };
  }

  private validateRelativePositions(
    session: DragSession
  ): Pick<DragValidationResult, 'warnings'> {
    const warnings: DragValidationResult['warnings'] = [];

    // 상대적 위치 유지 검증 (구현 필요)
    // 실제 구현에서는 자식 요소들 간 상대적 위치 확인

    return { warnings };
  }

  // ===== 계층적 이동 실행 =====

  /**
   * 계층적 이동 실행
   */
  private async executeHierarchicalMove(
    session: DragSession,
    bundles: Map<string, NestedBundle>,
    relations: NestedBundleRelation[],
    tracks: TimelineTrack[]
  ): Promise<HierarchicalMoveResult> {
    const executeStartTime = performance.now();

    const result: HierarchicalMoveResult = {
      isSuccess: true,
      bundleId: session.bundleId,
      deltaTime: session.deltaTime,
      affectedElements: [...session.draggedElements, ...session.affectedChildren],
      updatedRelations: [],
      hierarchy: [],
      warnings: [],
      errors: [],
      performance: {
        executionTime: 0,
        elementsProcessed: 0,
        relationshipsUpdated: 0,
        cacheEfficiency: 0
      }
    };

    try {
      // 1. Bundle 요소들 시간 위치 업데이트
      for (const element of session.draggedElements) {
        element.startTime += session.deltaTime;
        element.endTime += session.deltaTime;
      }

      // 2. 자식 요소들 상대적 위치 유지하며 이동
      for (const element of session.affectedChildren) {
        element.startTime += session.deltaTime;
        element.endTime += session.deltaTime;
      }

      // 3. Bundle 시간 범위 업데이트
      const bundle = bundles.get(session.bundleId);
      if (bundle) {
        bundle.timeRange.startTime += session.deltaTime;
        bundle.timeRange.endTime += session.deltaTime;
      }

      // 4. 관계 업데이트 (필요한 경우)
      // 실제 구현에서는 관계 데이터 업데이트

      result.performance.executionTime = performance.now() - executeStartTime;
      result.performance.elementsProcessed = session.draggedElements.length + session.affectedChildren.length;

    } catch (error) {
      result.isSuccess = false;
      result.errors.push({
        code: 'MOVE_EXECUTION_ERROR',
        message: `계층적 이동 실행 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
        elementId: session.bundleId
      });
    }

    return result;
  }

  // ===== 시각적 피드백 =====

  /**
   * 시각적 피드백 생성
   */
  private async generateVisualFeedback(
    session: DragSession,
    moveResult: HierarchicalMoveResult,
    bundles: Map<string, NestedBundle>
  ): Promise<HierarchicalDragResult['visualFeedback']> {
    const highlightedElements: string[] = [];
    const warningElements: string[] = [];
    const errorElements: string[] = [];
    const previewPositions = new Map<string, number>();

    // 드래그되는 요소들 하이라이트
    for (const element of session.draggedElements) {
      highlightedElements.push(element.id);
      previewPositions.set(element.id, element.startTime);
    }

    // 영향받는 자식 요소들 표시
    for (const element of session.affectedChildren) {
      highlightedElements.push(element.id);
      previewPositions.set(element.id, element.startTime);
    }

    // 경고/오류 요소들 표시
    for (const warning of moveResult.warnings) {
      if (warning.elementId) {
        warningElements.push(warning.elementId);
      }
    }

    for (const error of moveResult.errors) {
      if (error.elementId) {
        errorElements.push(error.elementId);
      }
    }

    return {
      highlightedElements,
      warningElements,
      errorElements,
      previewPositions
    };
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

  private calculateCacheEfficiency(session: DragSession): number {
    const total = session.performance.cacheHits + session.performance.cacheMisses;
    return total > 0 ? session.performance.cacheHits / total : 0;
  }

  private getPerformanceMetrics(sessionId: string): DragPerformanceMetrics {
    return this.performanceTracker.get(sessionId) || {
      totalDragTime: 0,
      validationLatency: 0,
      updateLatency: 0,
      cacheEfficiency: 0,
      elementsProcessed: 0,
      constraintChecks: 0,
      relationshipUpdates: 0
    };
  }

  private cleanupValidationCache(): void {
    // 만료된 캐시 엔트리 정리
    const now = Date.now();
    for (const [sessionId, session] of this.activeDragSessions) {
      if (now - session.performance.startTimestamp > this.config.cacheExpirationMs) {
        session.validationCache.clear();
      }
    }

    // 전역 캐시 크기 제한
    if (this.validationCache.size > this.config.validationCacheSize) {
      const entries = Array.from(this.validationCache.entries());
      const toDelete = entries.slice(0, entries.length - this.config.validationCacheSize);
      for (const [key] of toDelete) {
        this.validationCache.delete(key);
      }
    }
  }

  // ===== 디버깅 및 상태 조회 =====

  /**
   * 현재 활성 드래그 세션들 조회
   */
  getActiveDragSessions(): DragSession[] {
    return Array.from(this.activeDragSessions.values());
  }

  /**
   * 드래그 세션 상세 정보 조회
   */
  getDragSessionInfo(sessionId: string): DragSession | undefined {
    return this.activeDragSessions.get(sessionId);
  }

  /**
   * 전체 성능 통계 조회
   */
  getOverallPerformanceStats(): {
    activeSessions: number;
    totalCacheSize: number;
    averageValidationTime: number;
    averageUpdateTime: number;
    overallCacheEfficiency: number;
  } {
    const metrics = Array.from(this.performanceTracker.values());
    
    return {
      activeSessions: this.activeDragSessions.size,
      totalCacheSize: this.validationCache.size,
      averageValidationTime: metrics.reduce((sum, m) => sum + m.validationLatency, 0) / Math.max(metrics.length, 1),
      averageUpdateTime: metrics.reduce((sum, m) => sum + m.updateLatency, 0) / Math.max(metrics.length, 1),
      overallCacheEfficiency: metrics.reduce((sum, m) => sum + m.cacheEfficiency, 0) / Math.max(metrics.length, 1)
    };
  }

  /**
   * 시스템 설정 업데이트
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * 캐시 수동 정리
   */
  clearCaches(): void {
    this.validationCache.clear();
    for (const session of this.activeDragSessions.values()) {
      session.validationCache.clear();
    }
  }
}

// ===== Export =====

export default HierarchicalDragLogic;

// 전역 인스턴스 (필요한 경우)
let globalDragLogic: HierarchicalDragLogic | null = null;

export function getGlobalHierarchicalDragLogic(): HierarchicalDragLogic {
  if (!globalDragLogic) {
    globalDragLogic = new HierarchicalDragLogic();
  }
  return globalDragLogic;
}

export function resetGlobalHierarchicalDragLogic(): void {
  if (globalDragLogic) {
    globalDragLogic.clearCaches();
    globalDragLogic = null;
  }
}
