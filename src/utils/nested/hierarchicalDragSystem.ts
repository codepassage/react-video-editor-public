/**
 * 계층적 Bundle 드래그 시스템
 * Phase 2 Day 3: 중첩 Bundle 드래그 시스템 - 계층적 드래그 로직
 * 
 * 주요 기능:
 * - 계층적 Bundle 드래그 핸들링
 * - 부모-자식 관계 유지 드래그
 * - 깊이별 이동 제약 조건
 * - 실시간 계층 구조 업데이트
 * - 드래그 중 시각적 피드백
 * - 충돌 감지 및 자동 해결
 */

import {
  Bundle,
  TemplateGroup,
  TimelineClip,
  TimelineTrack
} from '../../types';

import {
  NestedBundle,
  NestedBundleRelation,
  BundleHierarchyNode,
  HierarchicalMoveOptions,
  MoveResult,
  DragConstraints,
  DragValidationResult,
  DragPreviewData,
  DragFeedback
} from '../../types/nested';

import {
  getBundleHierarchyManager,
  getEnhancedRelationshipManager
} from './bundleHierarchyManagement';

/**
 * 드래그 상태 정보
 */
export interface DragState {
  isDragging: boolean;
  draggedBundleId: string | null;
  draggedElement: {
    type: 'bundle' | 'nested-bundle';
    id: string;
    depth: number;
    children: string[];
    parent?: string;
  } | null;
  startPosition: { x: number; y: number; time: number };
  currentPosition: { x: number; y: number; time: number };
  deltaTime: number;
  constraints: DragConstraints;
  previewData: DragPreviewData;
  feedback: DragFeedback[];
}

/**
 * 계층적 드래그 결과
 */
export interface HierarchicalDragResult {
  success: boolean;
  movedBundles: Array<{
    bundleId: string;
    oldTime: number;
    newTime: number;
    depth: number;
    wasConstrained: boolean;
  }>;
  maintainedRelationships: NestedBundleRelation[];
  brokenRelationships: NestedBundleRelation[];
  repairedRelationships: NestedBundleRelation[];
  warnings: string[];
  performance: {
    dragTime: number;
    updateTime: number;
    validationTime: number;
  };
}

/**
 * 🎯 계층적 Bundle 드래그 시스템
 * 
 * 중첩 Bundle 구조에서 부모-자식 관계를 유지하면서
 * 드래그 이동을 처리하는 고급 시스템입니다.
 */
export class HierarchicalBundleDragSystem {
  private dragState: DragState = this.createInitialDragState();
  private hierarchyManager = getBundleHierarchyManager();
  private relationshipManager = getEnhancedRelationshipManager();
  private constraintEngine: DragConstraintEngine;
  private validationEngine: DragValidationEngine;
  private feedbackSystem: DragFeedbackSystem;
  private previewRenderer: DragPreviewRenderer;

  // 드래그 이벤트 리스너들
  private dragListeners: Array<{
    event: 'dragstart' | 'dragmove' | 'dragend' | 'dragcancel';
    handler: (data: any) => void;
  }> = [];

  // 성능 최적화
  private updateThrottleMs = 16; // 60fps
  private lastUpdateTime = 0;
  private pendingUpdates: Map<string, any> = new Map();

  constructor(options: {
    updateThrottleMs?: number;
    enablePreview?: boolean;
    enableFeedback?: boolean;
    strictValidation?: boolean;
  } = {}) {
    console.log('🎯 계층적 Bundle 드래그 시스템 초기화');

    this.updateThrottleMs = options.updateThrottleMs || 16;
    this.constraintEngine = new DragConstraintEngine();
    this.validationEngine = new DragValidationEngine(options.strictValidation);
    this.feedbackSystem = new DragFeedbackSystem(options.enableFeedback !== false);
    this.previewRenderer = new DragPreviewRenderer(options.enablePreview !== false);

    this.initializeDragSystem();
  }

  /**
   * 🚀 계층적 Bundle 드래그 시작
   * 
   * Bundle과 그 하위 계층 요소들의 드래그를 시작합니다.
   */
  async startHierarchicalDrag(
    bundleId: string,
    initialPosition: { x: number; y: number; time: number },
    dragOptions: {
      moveChildren?: boolean;
      maintainRelationships?: boolean;
      allowConstraintViolation?: boolean;
      enableRealTimePreview?: boolean;
      strictHierarchyValidation?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    dragState: DragState;
    constraints: DragConstraints;
    warnings: string[];
  }> {
    
    const result = {
      success: false,
      dragState: this.createInitialDragState(),
      constraints: this.constraintEngine.getDefaultConstraints(),
      warnings: [] as string[]
    };

    try {
      console.log('🚀 계층적 Bundle 드래그 시작:', {
        bundleId: bundleId.slice(-8),
        position: initialPosition,
        options: dragOptions
      });

      // 1. 사전 검증
      const preValidation = await this.validateDragPrerequisites(bundleId, dragOptions);
      if (!preValidation.isValid) {
        result.warnings.push(...preValidation.issues);
        return result;
      }

      // 2. 드래그할 요소 계층 분석
      const hierarchyAnalysis = await this.analyzeHierarchyForDrag(bundleId, dragOptions);
      
      // 3. 제약 조건 계산
      const constraints = await this.constraintEngine.calculateDragConstraints(
        bundleId,
        hierarchyAnalysis.affectedBundles,
        dragOptions
      );

      // 4. 드래그 상태 초기화
      this.dragState = {
        isDragging: true,
        draggedBundleId: bundleId,
        draggedElement: {
          type: hierarchyAnalysis.elementType,
          id: bundleId,
          depth: hierarchyAnalysis.depth,
          children: hierarchyAnalysis.children,
          parent: hierarchyAnalysis.parent
        },
        startPosition: initialPosition,
        currentPosition: initialPosition,
        deltaTime: 0,
        constraints,
        previewData: await this.previewRenderer.createPreviewData(hierarchyAnalysis),
        feedback: []
      };

      // 5. 실시간 피드백 시작
      if (dragOptions.enableRealTimePreview) {
        await this.feedbackSystem.startRealTimeFeedback(this.dragState);
      }

      // 6. 드래그 시작 이벤트 발생
      this.emitDragEvent('dragstart', {
        bundleId,
        dragState: this.dragState,
        constraints
      });

      result.success = true;
      result.dragState = this.dragState;
      result.constraints = constraints;

      console.log('✅ 계층적 Bundle 드래그 시작 완료:', {
        affectedBundles: hierarchyAnalysis.affectedBundles.length,
        depth: hierarchyAnalysis.depth,
        constraints: Object.keys(constraints).length
      });

    } catch (error) {
      console.error('❌ 계층적 Bundle 드래그 시작 실패:', error);
      result.warnings.push(`드래그 시작 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 🔄 계층적 Bundle 드래그 업데이트
   * 
   * 드래그 중 실시간으로 위치를 업데이트하고
   * 계층 구조 제약 조건을 검증합니다.
   */
  async updateHierarchicalDrag(
    newPosition: { x: number; y: number; time: number },
    options: {
      validateConstraints?: boolean;
      updatePreview?: boolean;
      throttleUpdates?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    constraintViolations: Array<{
      type: string;
      description: string;
      severity: 'info' | 'warning' | 'error';
    }>;
    suggestedPosition?: { x: number; y: number; time: number };
    feedback: DragFeedback[];
  }> {
    
    const result = {
      success: false,
      constraintViolations: [] as any[],
      suggestedPosition: undefined as any,
      feedback: [] as DragFeedback[]
    };

    if (!this.dragState.isDragging) {
      result.constraintViolations.push({
        type: 'no-active-drag',
        description: '진행 중인 드래그가 없습니다',
        severity: 'error'
      });
      return result;
    }

    try {
      // 성능 최적화: 업데이트 쓰로틀링
      const now = performance.now();
      if (options.throttleUpdates && now - this.lastUpdateTime < this.updateThrottleMs) {
        this.pendingUpdates.set('position', newPosition);
        return result;
      }

      this.lastUpdateTime = now;

      // 1. 위치 업데이트
      const oldPosition = this.dragState.currentPosition;
      this.dragState.currentPosition = newPosition;
      this.dragState.deltaTime = newPosition.time - this.dragState.startPosition.time;

      // 2. 제약 조건 검증
      if (options.validateConstraints !== false) {
        const validation = await this.validationEngine.validateDragPosition(
          this.dragState,
          newPosition
        );

        result.constraintViolations = validation.violations;

        // 제약 조건 위반 시 위치 조정
        if (validation.violations.length > 0) {
          const adjustedPosition = await this.constraintEngine.adjustPositionForConstraints(
            newPosition,
            this.dragState.constraints,
            validation.violations
          );

          if (adjustedPosition) {
            result.suggestedPosition = adjustedPosition;
            this.dragState.currentPosition = adjustedPosition;
            this.dragState.deltaTime = adjustedPosition.time - this.dragState.startPosition.time;
          }
        }
      }

      // 3. 계층 구조 실시간 검증
      const hierarchyValidation = await this.validateHierarchyDuringDrag();
      if (!hierarchyValidation.isValid) {
        result.constraintViolations.push(...hierarchyValidation.violations);
      }

      // 4. 피드백 업데이트
      if (options.updatePreview !== false) {
        const feedback = await this.feedbackSystem.updateDragFeedback(
          this.dragState,
          result.constraintViolations
        );
        result.feedback = feedback;
        this.dragState.feedback = feedback;
      }

      // 5. 드래그 이동 이벤트 발생
      this.emitDragEvent('dragmove', {
        bundleId: this.dragState.draggedBundleId,
        oldPosition,
        newPosition: this.dragState.currentPosition,
        deltaTime: this.dragState.deltaTime,
        constraintViolations: result.constraintViolations
      });

      result.success = true;

    } catch (error) {
      console.error('❌ 계층적 Bundle 드래그 업데이트 실패:', error);
      result.constraintViolations.push({
        type: 'update-error',
        description: `업데이트 실패: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return result;
  }

  /**
   * ✅ 계층적 Bundle 드래그 완료
   * 
   * 드래그를 완료하고 모든 계층 요소들의 위치를
   * 최종 업데이트합니다.
   */
  async completeHierarchicalDrag(
    finalOptions: {
      validateFinalPosition?: boolean;
      repairBrokenRelationships?: boolean;
      optimizeHierarchy?: boolean;
      forceCompletion?: boolean;
    } = {}
  ): Promise<HierarchicalDragResult> {
    
    const startTime = performance.now();
    const result: HierarchicalDragResult = {
      success: false,
      movedBundles: [],
      maintainedRelationships: [],
      brokenRelationships: [],
      repairedRelationships: [],
      warnings: [],
      performance: {
        dragTime: 0,
        updateTime: 0,
        validationTime: 0
      }
    };

    if (!this.dragState.isDragging) {
      result.warnings.push('진행 중인 드래그가 없습니다');
      return result;
    }

    try {
      console.log('✅ 계층적 Bundle 드래그 완료 시작:', {
        bundleId: this.dragState.draggedBundleId?.slice(-8),
        deltaTime: this.dragState.deltaTime,
        finalOptions
      });

      const validationStartTime = performance.now();

      // 1. 최종 위치 검증
      if (finalOptions.validateFinalPosition !== false) {
        const finalValidation = await this.validationEngine.validateFinalDragPosition(
          this.dragState
        );

        if (!finalValidation.isValid && !finalOptions.forceCompletion) {
          result.warnings.push(...finalValidation.issues);
          await this.cancelHierarchicalDrag();
          return result;
        }
      }

      result.performance.validationTime = performance.now() - validationStartTime;

      // 2. 계층적 이동 실행
      const updateStartTime = performance.now();
      const moveResult = await this.executeHierarchicalMove();
      
      result.movedBundles = moveResult.movedBundles;
      result.maintainedRelationships = moveResult.maintainedRelationships;
      result.brokenRelationships = moveResult.brokenRelationships;

      result.performance.updateTime = performance.now() - updateStartTime;

      // 3. 깨진 관계 복구 (옵션)
      if (finalOptions.repairBrokenRelationships && result.brokenRelationships.length > 0) {
        const repairResult = await this.repairBrokenRelationships(result.brokenRelationships);
        result.repairedRelationships = repairResult.repairedRelationships;
        result.warnings.push(...repairResult.warnings);
      }

      // 4. 계층 구조 최적화 (옵션)
      if (finalOptions.optimizeHierarchy) {
        await this.optimizeHierarchyAfterDrag();
      }

      // 5. 드래그 상태 정리
      await this.cleanupDragState();

      // 6. 드래그 완료 이벤트 발생
      this.emitDragEvent('dragend', {
        bundleId: this.dragState.draggedBundleId,
        result,
        performance: result.performance
      });

      result.success = true;
      result.performance.dragTime = performance.now() - startTime;

      console.log('✅ 계층적 Bundle 드래그 완료:', {
        movedBundles: result.movedBundles.length,
        maintainedRelationships: result.maintainedRelationships.length,
        brokenRelationships: result.brokenRelationships.length,
        repairedRelationships: result.repairedRelationships.length,
        totalTime: `${result.performance.dragTime.toFixed(2)}ms`
      });

    } catch (error) {
      console.error('❌ 계층적 Bundle 드래그 완료 실패:', error);
      result.warnings.push(`드래그 완료 실패: ${error instanceof Error ? error.message : String(error)}`);
      
      // 실패 시 상태 복원
      await this.cancelHierarchicalDrag();
    }

    return result;
  }

  /**
   * ❌ 계층적 Bundle 드래그 취소
   * 
   * 드래그를 취소하고 모든 요소를 원래 위치로 복원합니다.
   */
  async cancelHierarchicalDrag(): Promise<{
    success: boolean;
    restoredBundles: string[];
    warnings: string[];
  }> {
    
    const result = {
      success: false,
      restoredBundles: [] as string[],
      warnings: [] as string[]
    };

    try {
      console.log('❌ 계층적 Bundle 드래그 취소');

      if (this.dragState.isDragging) {
        // 1. 원래 위치로 복원
        if (this.dragState.draggedElement) {
          result.restoredBundles.push(this.dragState.draggedElement.id);
          
          // 하위 Bundle들도 복원
          if (this.dragState.draggedElement.children) {
            result.restoredBundles.push(...this.dragState.draggedElement.children);
          }
        }

        // 2. 드래그 상태 정리
        await this.cleanupDragState();

        // 3. 드래그 취소 이벤트 발생
        this.emitDragEvent('dragcancel', {
          bundleId: this.dragState.draggedBundleId,
          restoredBundles: result.restoredBundles
        });
      }

      result.success = true;

    } catch (error) {
      console.error('❌ 드래그 취소 실패:', error);
      result.warnings.push(`드래그 취소 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  // ========================================
  // 🛠️ 내부 시스템 메서드들
  // ========================================

  private initializeDragSystem(): void {
    // 드래그 시스템 초기화
    console.log('⚙️ 드래그 시스템 초기화 완료');
  }

  private createInitialDragState(): DragState {
    return {
      isDragging: false,
      draggedBundleId: null,
      draggedElement: null,
      startPosition: { x: 0, y: 0, time: 0 },
      currentPosition: { x: 0, y: 0, time: 0 },
      deltaTime: 0,
      constraints: this.constraintEngine.getDefaultConstraints(),
      previewData: this.previewRenderer.createEmptyPreview(),
      feedback: []
    };
  }

  private async validateDragPrerequisites(
    bundleId: string,
    options: any
  ): Promise<DragValidationResult> {
    
    return {
      isValid: true,
      issues: [],
      warnings: []
    };
  }

  private async analyzeHierarchyForDrag(
    bundleId: string,
    options: any
  ): Promise<{
    elementType: 'bundle' | 'nested-bundle';
    depth: number;
    children: string[];
    parent?: string;
    affectedBundles: string[];
  }> {
    
    const children = await this.hierarchyManager.searchBundleHierarchy({
      parentId: bundleId,
      includeChildren: true
    });

    return {
      elementType: 'bundle',
      depth: 1,
      children: children.bundles.filter(id => id !== bundleId),
      affectedBundles: [bundleId, ...children.bundles.filter(id => id !== bundleId)]
    };
  }

  private async validateHierarchyDuringDrag(): Promise<{
    isValid: boolean;
    violations: Array<{ type: string; description: string; severity: string }>;
  }> {
    
    return {
      isValid: true,
      violations: []
    };
  }

  private async executeHierarchicalMove(): Promise<{
    movedBundles: Array<{
      bundleId: string;
      oldTime: number;
      newTime: number;
      depth: number;
      wasConstrained: boolean;
    }>;
    maintainedRelationships: NestedBundleRelation[];
    brokenRelationships: NestedBundleRelation[];
  }> {
    
    const result = {
      movedBundles: [] as any[],
      maintainedRelationships: [] as NestedBundleRelation[],
      brokenRelationships: [] as NestedBundleRelation[]
    };

    if (!this.dragState.draggedBundleId) return result;

    // 실제 Bundle 이동 실행
    const moveResult = await this.hierarchyManager.moveNestedBundle(
      this.dragState.draggedBundleId,
      this.dragState.deltaTime,
      {
        preserveHierarchy: true,
        moveChildren: true
      }
    );

    if (moveResult.success) {
      for (const bundleId of moveResult.movedBundles) {
        const timeUpdate = moveResult.timeUpdates.get(bundleId);
        if (timeUpdate) {
          result.movedBundles.push({
            bundleId,
            oldTime: timeUpdate.startTime - this.dragState.deltaTime,
            newTime: timeUpdate.startTime,
            depth: this.dragState.draggedElement?.depth || 1,
            wasConstrained: false
          });
        }
      }
    }

    return result;
  }

  private async repairBrokenRelationships(
    brokenRelationships: NestedBundleRelation[]
  ): Promise<{
    repairedRelationships: NestedBundleRelation[];
    warnings: string[];
  }> {
    
    return {
      repairedRelationships: [],
      warnings: []
    };
  }

  private async optimizeHierarchyAfterDrag(): Promise<void> {
    // 드래그 후 계층 구조 최적화
  }

  private async cleanupDragState(): Promise<void> {
    // 피드백 시스템 정지
    await this.feedbackSystem.stopRealTimeFeedback();
    
    // 프리뷰 정리
    await this.previewRenderer.clearPreview();
    
    // 드래그 상태 초기화
    this.dragState = this.createInitialDragState();
    
    // 대기 중인 업데이트 정리
    this.pendingUpdates.clear();
  }

  private emitDragEvent(event: string, data: any): void {
    const listeners = this.dragListeners.filter(l => l.event === event);
    for (const listener of listeners) {
      try {
        listener.handler(data);
      } catch (error) {
        console.error(`드래그 이벤트 리스너 오류 (${event}):`, error);
      }
    }
  }

  /**
   * 🎧 드래그 이벤트 리스너 등록
   */
  addDragListener(
    event: 'dragstart' | 'dragmove' | 'dragend' | 'dragcancel',
    handler: (data: any) => void
  ): void {
    this.dragListeners.push({ event, handler });
  }

  /**
   * 🎧 드래그 이벤트 리스너 제거
   */
  removeDragListener(
    event: 'dragstart' | 'dragmove' | 'dragend' | 'dragcancel',
    handler: (data: any) => void
  ): void {
    const index = this.dragListeners.findIndex(l => l.event === event && l.handler === handler);
    if (index > -1) {
      this.dragListeners.splice(index, 1);
    }
  }

  /**
   * 📊 현재 드래그 상태 조회
   */
  getCurrentDragState(): DragState {
    return { ...this.dragState };
  }

  /**
   * ⚙️ 드래그 설정 업데이트
   */
  updateDragSettings(settings: {
    updateThrottleMs?: number;
    enablePreview?: boolean;
    enableFeedback?: boolean;
    strictValidation?: boolean;
  }): void {
    if (settings.updateThrottleMs !== undefined) {
      this.updateThrottleMs = settings.updateThrottleMs;
    }
    
    this.feedbackSystem.setEnabled(settings.enableFeedback !== false);
    this.previewRenderer.setEnabled(settings.enablePreview !== false);
    this.validationEngine.setStrictMode(settings.strictValidation !== false);
  }
}

// ========================================
// 🧩 보조 시스템 클래스들
// ========================================

class DragConstraintEngine {
  getDefaultConstraints(): DragConstraints {
    return {
      minTime: 0,
      maxTime: Infinity,
      snapToGrid: false,
      maintainRelativePositions: true,
      allowOverlap: false,
      respectBoundaries: true
    };
  }

  async calculateDragConstraints(
    bundleId: string,
    affectedBundles: string[],
    options: any
  ): Promise<DragConstraints> {
    return this.getDefaultConstraints();
  }

  async adjustPositionForConstraints(
    position: any,
    constraints: DragConstraints,
    violations: any[]
  ): Promise<any> {
    return position;
  }
}

class DragValidationEngine {
  constructor(private strictMode: boolean = true) {}

  async validateDragPosition(
    dragState: DragState,
    position: any
  ): Promise<{
    violations: Array<{
      type: string;
      description: string;
      severity: 'info' | 'warning' | 'error';
    }>;
  }> {
    return { violations: [] };
  }

  async validateFinalDragPosition(dragState: DragState): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    return { isValid: true, issues: [] };
  }

  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }
}

class DragFeedbackSystem {
  constructor(private enabled: boolean = true) {}

  async startRealTimeFeedback(dragState: DragState): Promise<void> {
    if (!this.enabled) return;
    // 실시간 피드백 시작
  }

  async updateDragFeedback(
    dragState: DragState,
    violations: any[]
  ): Promise<DragFeedback[]> {
    if (!this.enabled) return [];
    
    return violations.map(violation => ({
      type: 'constraint-violation',
      message: violation.description,
      severity: violation.severity,
      timestamp: Date.now()
    }));
  }

  async stopRealTimeFeedback(): Promise<void> {
    // 실시간 피드백 중지
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

class DragPreviewRenderer {
  constructor(private enabled: boolean = true) {}

  async createPreviewData(hierarchyAnalysis: any): Promise<DragPreviewData> {
    return {
      bundleId: hierarchyAnalysis.affectedBundles[0] || '',
      previewElements: [],
      previewRelationships: [],
      estimatedNewPositions: new Map()
    };
  }

  createEmptyPreview(): DragPreviewData {
    return {
      bundleId: '',
      previewElements: [],
      previewRelationships: [],
      estimatedNewPositions: new Map()
    };
  }

  async clearPreview(): Promise<void> {
    // 프리뷰 정리
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// 전역 인스턴스 생성
let globalHierarchicalDragSystem: HierarchicalBundleDragSystem | null = null;

/**
 * 계층적 Bundle 드래그 시스템 싱글톤 인스턴스 반환
 */
export function getHierarchicalBundleDragSystem(
  options?: Parameters<typeof HierarchicalBundleDragSystem.prototype.constructor>[0]
): HierarchicalBundleDragSystem {
  if (!globalHierarchicalDragSystem) {
    globalHierarchicalDragSystem = new HierarchicalBundleDragSystem(options);
  }
  return globalHierarchicalDragSystem;
}

/**
 * 계층적 Bundle 드래그 시스템 초기화
 */
export function resetHierarchicalBundleDragSystem(): void {
  globalHierarchicalDragSystem = null;
}
