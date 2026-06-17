/**
 * @fileoverview 중첩 Bundle 드래그 관리 Hook
 * @description 중첩 Bundle의 드래그 앤 드롭 기능을 통합 관리하는 React Hook
 * @version 1.0.0
 * @created 2025-06-22
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { NestedBundle, BundleHierarchyNode, BundleElement } from '../../types/nested';
import { TimelineTrack } from '../../types';

// ===== 타입 정의 =====

/**
 * 드래그 상태
 */
type DragState = 'idle' | 'dragging' | 'dropping' | 'canceled';

/**
 * 드래그 타입
 */
type DragType = 'bundle' | 'element' | 'selection';

/**
 * 드롭 존 타입
 */
type DropZoneType = 'bundle' | 'track' | 'timeline' | 'hierarchy' | 'trash';

/**
 * 드래그 데이터
 */
interface DragData {
  type: DragType;
  bundleId?: string;
  elementId?: string;
  elementIds?: string[];
  sourcePosition: { x: number; y: number };
  sourceTime: number;
  sourceTrack?: number;
  metadata?: any;
}

/**
 * 드롭 대상
 */
interface DropTarget {
  type: DropZoneType;
  bundleId?: string;
  trackId?: string;
  position: { x: number; y: number };
  time: number;
  trackIndex?: number;
  isValid: boolean;
  constraints?: DropConstraints;
}

/**
 * 드롭 제약 조건
 */
interface DropConstraints {
  allowedTypes: DragType[];
  maxDepth?: number;
  preventCircularRef: boolean;
  requireParentConsent: boolean;
  timeConstraints?: {
    minTime?: number;
    maxTime?: number;
    snapToGrid?: boolean;
    gridSize?: number;
  };
  trackConstraints?: {
    allowedTracks?: string[];
    forbiddenTracks?: string[];
  };
}

/**
 * 드래그 피드백
 */
interface DragFeedback {
  isValidDrop: boolean;
  dropEffect: 'copy' | 'move' | 'link' | 'none';
  feedbackMessage?: string;
  visualHints: {
    showDropZones: boolean;
    highlightValidTargets: boolean;
    showPreview: boolean;
    ghostOpacity: number;
  };
}

/**
 * 드래그 세션
 */
interface DragSession {
  id: string;
  startTime: number;
  endTime?: number;
  dragData: DragData;
  currentTarget?: DropTarget;
  feedback: DragFeedback;
  performance: {
    moveCount: number;
    averageFrameTime: number;
    lastFrameTime: number;
  };
}

/**
 * 드래그 설정
 */
interface DragSettings {
  enableDragAndDrop: boolean;
  enableMultiDrag: boolean;
  enableTouchDrag: boolean;
  autoScroll: boolean;
  snapToGrid: boolean;
  gridSize: number;
  dragThreshold: number;
  ghostOpacity: number;
  feedbackDelay: number;
  performanceMode: 'smooth' | 'performance';
}

/**
 * 드래그 통계
 */
interface DragStatistics {
  totalDrags: number;
  successfulDrops: number;
  canceledDrags: number;
  averageDragTime: number;
  mostDraggedBundle: string | null;
  performanceMetrics: {
    averageFrameRate: number;
    slowFrames: number;
    memoryUsage: number;
  };
}

// ===== Hook 인터페이스 =====

export interface UseNestedBundleDragResult {
  // 현재 상태
  dragState: DragState;
  currentSession: DragSession | null;
  activeDragData: DragData | null;
  currentDropTarget: DropTarget | null;
  
  // 설정
  settings: DragSettings;
  updateSettings: (settings: Partial<DragSettings>) => void;
  
  // 드래그 시작
  startDrag: (data: DragData, event: React.DragEvent | React.MouseEvent | React.TouchEvent) => boolean;
  startBundleDrag: (bundleId: string, event: React.DragEvent | React.MouseEvent | React.TouchEvent) => boolean;
  startElementDrag: (elementId: string, event: React.DragEvent | React.MouseEvent | React.TouchEvent) => boolean;
  startSelectionDrag: (elementIds: string[], event: React.DragEvent | React.MouseEvent | React.TouchEvent) => boolean;
  
  // 드래그 중 처리
  updateDragPosition: (position: { x: number; y: number }) => void;
  updateDropTarget: (target: DropTarget | null) => void;
  
  // 드래그 종료
  completeDrop: (target?: DropTarget) => boolean;
  cancelDrag: () => void;
  
  // 드롭 존 관리
  registerDropZone: (zoneId: string, zone: DropZoneConfig) => void;
  unregisterDropZone: (zoneId: string) => void;
  findDropTarget: (position: { x: number; y: number }) => DropTarget | null;
  
  // 유효성 검증
  validateDrop: (dragData: DragData, target: DropTarget) => boolean;
  getDropConstraints: (target: DropTarget) => DropConstraints;
  
  // 이벤트 핸들러
  onDragStart: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  
  // 터치 이벤트 핸들러
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
  
  // 마우스 이벤트 핸들러
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseUp: (event: React.MouseEvent) => void;
  
  // 유틸리티
  isDragging: () => boolean;
  canDrop: (target: DropTarget) => boolean;
  getPreviewData: () => { dragData: DragData; target: DropTarget | null } | null;
  
  // 통계 및 성능
  statistics: DragStatistics;
  resetStatistics: () => void;
}

/**
 * 드롭 존 설정
 */
interface DropZoneConfig {
  id: string;
  type: DropZoneType;
  element: HTMLElement;
  constraints: DropConstraints;
  onDrop?: (dragData: DragData) => boolean;
  onDragEnter?: (dragData: DragData) => void;
  onDragLeave?: () => void;
}

/**
 * Hook 옵션
 */
interface UseNestedBundleDragOptions {
  /** 중첩 Bundle 데이터 */
  nestedBundles: NestedBundle[];
  
  /** 계층 노드 데이터 */
  hierarchyNodes: BundleHierarchyNode[];
  
  /** 타임라인 트랙 데이터 */
  tracks: TimelineTrack[];
  
  /** 줌 레벨 */
  zoom: number;
  
  /** 트랙 높이 */
  trackHeight: number;
  
  /** 초기 설정 */
  initialSettings?: Partial<DragSettings>;
  
  /** 이벤트 콜백들 */
  onDragStart?: (session: DragSession) => void;
  onDragEnd?: (session: DragSession, success: boolean) => void;
  onBundleMove?: (bundleId: string, deltaTime: number, targetTrack?: number) => boolean;
  onElementMove?: (elementId: string, deltaTime: number, targetBundle?: string) => boolean;
  
  /** 성능 모니터링 */
  enablePerformanceMonitoring?: boolean;
}

// ===== Hook 구현 =====

/**
 * 중첩 Bundle 드래그 관리 Hook
 */
export const useNestedBundleDrag = (
  options: UseNestedBundleDragOptions
): UseNestedBundleDragResult => {
  const {
    nestedBundles,
    hierarchyNodes,
    tracks,
    zoom,
    trackHeight,
    initialSettings,
    onDragStart,
    onDragEnd,
    onBundleMove,
    onElementMove,
    enablePerformanceMonitoring = true
  } = options;

  // ===== 상태 관리 =====
  
  const [dragState, setDragState] = useState<DragState>('idle');
  const [currentSession, setCurrentSession] = useState<DragSession | null>(null);
  const [currentDropTarget, setCurrentDropTarget] = useState<DropTarget | null>(null);
  
  const [settings, setSettings] = useState<DragSettings>({
    enableDragAndDrop: true,
    enableMultiDrag: true,
    enableTouchDrag: true,
    autoScroll: true,
    snapToGrid: false,
    gridSize: 10,
    dragThreshold: 5,
    ghostOpacity: 0.5,
    feedbackDelay: 100,
    performanceMode: 'smooth',
    ...initialSettings
  });

  // ===== Refs =====
  
  const dropZonesRef = useRef<Map<string, DropZoneConfig>>(new Map());
  const dragSessionIdRef = useRef<number>(0);
  const performanceRef = useRef<{ lastFrameTime: number; frameCount: number }>({ 
    lastFrameTime: 0, 
    frameCount: 0 
  });
  const statisticsRef = useRef<DragStatistics>({
    totalDrags: 0,
    successfulDrops: 0,
    canceledDrags: 0,
    averageDragTime: 0,
    mostDraggedBundle: null,
    performanceMetrics: {
      averageFrameRate: 60,
      slowFrames: 0,
      memoryUsage: 0
    }
  });

  // ===== 유틸리티 함수들 =====
  
  const generateSessionId = useCallback((): string => {
    return `drag_session_${++dragSessionIdRef.current}_${Date.now()}`;
  }, []);

  const measurePerformance = useCallback((action: () => void) => {
    if (!enablePerformanceMonitoring) {
      action();
      return;
    }

    const startTime = performance.now();
    action();
    const endTime = performance.now();
    
    const frameTime = endTime - startTime;
    const perf = performanceRef.current;
    
    perf.frameCount++;
    const avgFrameTime = (perf.lastFrameTime + frameTime) / 2;
    perf.lastFrameTime = avgFrameTime;
    
    // 느린 프레임 감지 (16.67ms = 60fps 기준)
    if (frameTime > 16.67) {
      statisticsRef.current.performanceMetrics.slowFrames++;
    }
    
    // 평균 프레임레이트 업데이트
    statisticsRef.current.performanceMetrics.averageFrameRate = 1000 / avgFrameTime;
  }, [enablePerformanceMonitoring]);

  const calculateTimeFromPosition = useCallback((x: number): number => {
    return Math.max(0, x / zoom);
  }, [zoom]);

  const calculateTrackFromPosition = useCallback((y: number): number => {
    return Math.max(0, Math.floor(y / trackHeight));
  }, [trackHeight]);

  const snapToGrid = useCallback((value: number): number => {
    if (!settings.snapToGrid) return value;
    return Math.round(value / settings.gridSize) * settings.gridSize;
  }, [settings.snapToGrid, settings.gridSize]);

  // ===== 유효성 검증 =====
  
  const validateDrop = useCallback((dragData: DragData, target: DropTarget): boolean => {
    if (!target.isValid) return false;
    
    const constraints = target.constraints;
    if (!constraints) return true;
    
    // 타입 검증
    if (!constraints.allowedTypes.includes(dragData.type)) {
      return false;
    }
    
    // 순환 참조 방지
    if (constraints.preventCircularRef && dragData.bundleId && target.bundleId) {
      // 드래그하는 Bundle이 드롭 대상의 조상인지 확인
      const isAncestor = (ancestorId: string, descendantId: string): boolean => {
        const descendantNode = hierarchyNodes.find(node => node.bundleId === descendantId);
        if (!descendantNode?.parentId) return false;
        if (descendantNode.parentId === ancestorId) return true;
        return isAncestor(ancestorId, descendantNode.parentId);
      };
      
      if (isAncestor(dragData.bundleId, target.bundleId)) {
        return false;
      }
    }
    
    // 깊이 제한
    if (constraints.maxDepth && target.bundleId) {
      const targetNode = hierarchyNodes.find(node => node.bundleId === target.bundleId);
      if (targetNode && targetNode.depth >= constraints.maxDepth) {
        return false;
      }
    }
    
    // 시간 제약
    if (constraints.timeConstraints) {
      const { minTime, maxTime } = constraints.timeConstraints;
      if (minTime !== undefined && target.time < minTime) return false;
      if (maxTime !== undefined && target.time > maxTime) return false;
    }
    
    // 트랙 제약
    if (constraints.trackConstraints && target.trackIndex !== undefined) {
      const { allowedTracks, forbiddenTracks } = constraints.trackConstraints;
      const trackId = tracks[target.trackIndex]?.id;
      
      if (allowedTracks && trackId && !allowedTracks.includes(trackId)) {
        return false;
      }
      
      if (forbiddenTracks && trackId && forbiddenTracks.includes(trackId)) {
        return false;
      }
    }
    
    return true;
  }, [hierarchyNodes, tracks]);

  const getDropConstraints = useCallback((target: DropTarget): DropConstraints => {
    // 기본 제약 조건
    const defaultConstraints: DropConstraints = {
      allowedTypes: ['bundle', 'element', 'selection'],
      maxDepth: 10,
      preventCircularRef: true,
      requireParentConsent: false
    };
    
    // 드롭 존 타입별 제약 조건
    switch (target.type) {
      case 'bundle':
        return {
          ...defaultConstraints,
          allowedTypes: ['bundle', 'element'],
          maxDepth: 5,
          requireParentConsent: true
        };
      
      case 'track':
        return {
          ...defaultConstraints,
          allowedTypes: ['bundle', 'element'],
          timeConstraints: {
            minTime: 0,
            snapToGrid: settings.snapToGrid,
            gridSize: settings.gridSize
          }
        };
      
      case 'timeline':
        return {
          ...defaultConstraints,
          allowedTypes: ['bundle'],
          timeConstraints: {
            minTime: 0,
            snapToGrid: settings.snapToGrid,
            gridSize: settings.gridSize
          }
        };
      
      case 'hierarchy':
        return {
          ...defaultConstraints,
          allowedTypes: ['bundle'],
          maxDepth: 10
        };
      
      case 'trash':
        return {
          ...defaultConstraints,
          allowedTypes: ['bundle', 'element', 'selection']
        };
      
      default:
        return defaultConstraints;
    }
  }, [settings.snapToGrid, settings.gridSize]);

  // ===== 드래그 시작 =====
  
  const startDrag = useCallback((
    data: DragData, 
    event: React.DragEvent | React.MouseEvent | React.TouchEvent
  ): boolean => {
    if (!settings.enableDragAndDrop || dragState !== 'idle') {
      return false;
    }

    measurePerformance(() => {
      const sessionId = generateSessionId();
      const startTime = Date.now();
      
      const session: DragSession = {
        id: sessionId,
        startTime,
        dragData: data,
        feedback: {
          isValidDrop: false,
          dropEffect: 'none',
          visualHints: {
            showDropZones: true,
            highlightValidTargets: true,
            showPreview: true,
            ghostOpacity: settings.ghostOpacity
          }
        },
        performance: {
          moveCount: 0,
          averageFrameTime: 0,
          lastFrameTime: startTime
        }
      };

      setDragState('dragging');
      setCurrentSession(session);
      
      // 통계 업데이트
      statisticsRef.current.totalDrags++;
      
      // 콜백 호출
      onDragStart?.(session);
    });

    return true;
  }, [settings.enableDragAndDrop, settings.ghostOpacity, dragState, measurePerformance, generateSessionId, onDragStart]);

  const startBundleDrag = useCallback((
    bundleId: string, 
    event: React.DragEvent | React.MouseEvent | React.TouchEvent
  ): boolean => {
    const bundle = nestedBundles.find(b => b.id === bundleId);
    if (!bundle) return false;

    const position = 'touches' in event ? 
      { x: event.touches[0].clientX, y: event.touches[0].clientY } :
      { x: event.clientX, y: event.clientY };

    const dragData: DragData = {
      type: 'bundle',
      bundleId,
      sourcePosition: position,
      sourceTime: bundle.timeRange.startTime,
      metadata: { bundleName: bundle.name }
    };

    return startDrag(dragData, event);
  }, [nestedBundles, startDrag]);

  const startElementDrag = useCallback((
    elementId: string, 
    event: React.DragEvent | React.MouseEvent | React.TouchEvent
  ): boolean => {
    // 요소 찾기
    let foundElement: BundleElement | null = null;
    let sourceBundle: NestedBundle | null = null;
    
    for (const bundle of nestedBundles) {
      const element = bundle.elements.find(e => e.id === elementId);
      if (element) {
        foundElement = element;
        sourceBundle = bundle;
        break;
      }
    }
    
    if (!foundElement || !sourceBundle) return false;

    const position = 'touches' in event ? 
      { x: event.touches[0].clientX, y: event.touches[0].clientY } :
      { x: event.clientX, y: event.clientY };

    const dragData: DragData = {
      type: 'element',
      elementId,
      sourcePosition: position,
      sourceTime: foundElement.startTime,
      metadata: { 
        elementType: foundElement.type,
        parentBundleId: sourceBundle.id
      }
    };

    return startDrag(dragData, event);
  }, [nestedBundles, startDrag]);

  const startSelectionDrag = useCallback((
    elementIds: string[], 
    event: React.DragEvent | React.MouseEvent | React.TouchEvent
  ): boolean => {
    if (!settings.enableMultiDrag || elementIds.length === 0) {
      return false;
    }

    const position = 'touches' in event ? 
      { x: event.touches[0].clientX, y: event.touches[0].clientY } :
      { x: event.clientX, y: event.clientY };

    const dragData: DragData = {
      type: 'selection',
      elementIds,
      sourcePosition: position,
      sourceTime: 0, // 계산 필요
      metadata: { 
        selectionCount: elementIds.length
      }
    };

    return startDrag(dragData, event);
  }, [settings.enableMultiDrag, startDrag]);

  // ===== 드래그 중 처리 =====
  
  const updateDragPosition = useCallback((position: { x: number; y: number }) => {
    if (!currentSession || dragState !== 'dragging') return;

    measurePerformance(() => {
      const time = calculateTimeFromPosition(position.x);
      const trackIndex = calculateTrackFromPosition(position.y);
      
      // 그리드에 스냅
      const snappedTime = snapToGrid(time);
      
      // 드롭 대상 찾기
      const dropTarget = findDropTarget(position);
      
      if (dropTarget) {
        dropTarget.time = snappedTime;
        dropTarget.trackIndex = trackIndex;
        dropTarget.isValid = validateDrop(currentSession.dragData, dropTarget);
      }
      
      setCurrentDropTarget(dropTarget);
      
      // 세션 성능 업데이트
      const now = performance.now();
      const frameTime = now - currentSession.performance.lastFrameTime;
      
      setCurrentSession(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          currentTarget: dropTarget,
          performance: {
            ...prev.performance,
            moveCount: prev.performance.moveCount + 1,
            averageFrameTime: (prev.performance.averageFrameTime + frameTime) / 2,
            lastFrameTime: now
          },
          feedback: {
            ...prev.feedback,
            isValidDrop: dropTarget?.isValid || false,
            dropEffect: dropTarget?.isValid ? 'move' : 'none'
          }
        };
      });
    });
  }, [currentSession, dragState, measurePerformance, calculateTimeFromPosition, calculateTrackFromPosition, snapToGrid, findDropTarget, validateDrop]);

  const updateDropTarget = useCallback((target: DropTarget | null) => {
    setCurrentDropTarget(target);
    
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        currentTarget: target,
        feedback: {
          ...prev.feedback,
          isValidDrop: target?.isValid || false
        }
      } : prev);
    }
  }, [currentSession]);

  // ===== 드래그 종료 =====
  
  const completeDrop = useCallback((target?: DropTarget): boolean => {
    if (!currentSession || dragState !== 'dragging') {
      return false;
    }

    const dropTarget = target || currentDropTarget;
    const isValidDrop = dropTarget && validateDrop(currentSession.dragData, dropTarget);

    measurePerformance(() => {
      const endTime = Date.now();
      const sessionDuration = endTime - currentSession.startTime;
      
      // 세션 완료
      const completedSession: DragSession = {
        ...currentSession,
        endTime,
        currentTarget: dropTarget || undefined
      };

      if (isValidDrop && dropTarget) {
        // 성공적인 드롭 처리
        const { dragData } = currentSession;
        
        if (dragData.type === 'bundle' && dragData.bundleId && onBundleMove) {
          const deltaTime = dropTarget.time - dragData.sourceTime;
          const success = onBundleMove(dragData.bundleId, deltaTime, dropTarget.trackIndex);
          
          if (success) {
            statisticsRef.current.successfulDrops++;
            statisticsRef.current.mostDraggedBundle = dragData.bundleId;
          }
        } else if (dragData.type === 'element' && dragData.elementId && onElementMove) {
          const deltaTime = dropTarget.time - dragData.sourceTime;
          const success = onElementMove(dragData.elementId, deltaTime, dropTarget.bundleId);
          
          if (success) {
            statisticsRef.current.successfulDrops++;
          }
        }
      } else {
        statisticsRef.current.canceledDrags++;
      }

      // 평균 드래그 시간 업데이트
      const stats = statisticsRef.current;
      stats.averageDragTime = 
        (stats.averageDragTime * (stats.totalDrags - 1) + sessionDuration) / stats.totalDrags;

      // 상태 초기화
      setDragState('idle');
      setCurrentSession(null);
      setCurrentDropTarget(null);
      
      // 콜백 호출
      onDragEnd?.(completedSession, !!isValidDrop);
    });

    return !!isValidDrop;
  }, [currentSession, currentDropTarget, dragState, validateDrop, measurePerformance, onBundleMove, onElementMove, onDragEnd]);

  const cancelDrag = useCallback(() => {
    if (!currentSession || dragState === 'idle') return;

    measurePerformance(() => {
      const endTime = Date.now();
      const canceledSession: DragSession = {
        ...currentSession,
        endTime
      };

      statisticsRef.current.canceledDrags++;

      // 상태 초기화
      setDragState('idle');
      setCurrentSession(null);
      setCurrentDropTarget(null);
      
      // 콜백 호출
      onDragEnd?.(canceledSession, false);
    });
  }, [currentSession, dragState, measurePerformance, onDragEnd]);

  // ===== 드롭 존 관리 =====
  
  const registerDropZone = useCallback((zoneId: string, zone: DropZoneConfig) => {
    dropZonesRef.current.set(zoneId, zone);
  }, []);

  const unregisterDropZone = useCallback((zoneId: string) => {
    dropZonesRef.current.delete(zoneId);
  }, []);

  const findDropTarget = useCallback((position: { x: number; y: number }): DropTarget | null => {
    // 등록된 드롭 존에서 검색
    for (const [zoneId, zone] of dropZonesRef.current) {
      const rect = zone.element.getBoundingClientRect();
      
      if (position.x >= rect.left && position.x <= rect.right &&
          position.y >= rect.top && position.y <= rect.bottom) {
        
        const time = calculateTimeFromPosition(position.x - rect.left);
        const trackIndex = calculateTrackFromPosition(position.y - rect.top);
        
        return {
          type: zone.type,
          bundleId: zone.type === 'bundle' ? zoneId : undefined,
          trackId: zone.type === 'track' ? zoneId : undefined,
          position,
          time,
          trackIndex,
          isValid: true,
          constraints: zone.constraints
        };
      }
    }
    
    return null;
  }, [calculateTimeFromPosition, calculateTrackFromPosition]);

  // ===== 이벤트 핸들러들 =====
  
  const onDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', ''); // 필수
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const position = { x: event.clientX, y: event.clientY };
    updateDragPosition(position);
  }, [updateDragPosition]);

  const onDragEnd = useCallback((event: React.DragEvent) => {
    if (event.dataTransfer.dropEffect === 'none') {
      cancelDrag();
    } else {
      completeDrop();
    }
  }, [cancelDrag, completeDrop]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const position = { x: event.clientX, y: event.clientY };
    const dropTarget = findDropTarget(position);
    
    completeDrop(dropTarget);
  }, [findDropTarget, completeDrop]);

  // ===== 터치 이벤트 핸들러들 =====
  
  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (!settings.enableTouchDrag) return;
    
    // 터치 드래그 구현은 복잡하므로 기본 구조만 제공
    const touch = event.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    
    // 터치 시작 처리
  }, [settings.enableTouchDrag]);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (!settings.enableTouchDrag || !currentSession) return;
    
    const touch = event.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    
    updateDragPosition(position);
  }, [settings.enableTouchDrag, currentSession, updateDragPosition]);

  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!settings.enableTouchDrag) return;
    
    completeDrop();
  }, [settings.enableTouchDrag, completeDrop]);

  // ===== 마우스 이벤트 핸들러들 =====
  
  const onMouseDown = useCallback((event: React.MouseEvent) => {
    // 마우스 드래그 시작 감지
  }, []);

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    if (!currentSession) return;
    
    const position = { x: event.clientX, y: event.clientY };
    updateDragPosition(position);
  }, [currentSession, updateDragPosition]);

  const onMouseUp = useCallback((event: React.MouseEvent) => {
    if (!currentSession) return;
    
    completeDrop();
  }, [currentSession, completeDrop]);

  // ===== 유틸리티 =====
  
  const isDragging = useCallback(() => dragState === 'dragging', [dragState]);
  
  const canDrop = useCallback((target: DropTarget) => {
    if (!currentSession) return false;
    return validateDrop(currentSession.dragData, target);
  }, [currentSession, validateDrop]);
  
  const getPreviewData = useCallback(() => {
    if (!currentSession) return null;
    return {
      dragData: currentSession.dragData,
      target: currentDropTarget
    };
  }, [currentSession, currentDropTarget]);

  // ===== 설정 업데이트 =====
  
  const updateSettings = useCallback((newSettings: Partial<DragSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // ===== 통계 초기화 =====
  
  const resetStatistics = useCallback(() => {
    statisticsRef.current = {
      totalDrags: 0,
      successfulDrops: 0,
      canceledDrags: 0,
      averageDragTime: 0,
      mostDraggedBundle: null,
      performanceMetrics: {
        averageFrameRate: 60,
        slowFrames: 0,
        memoryUsage: 0
      }
    };
  }, []);

  // ===== 현재 활성 데이터 =====
  
  const activeDragData = useMemo(() => {
    return currentSession?.dragData || null;
  }, [currentSession]);

  const statistics = useMemo(() => {
    return { ...statisticsRef.current };
  }, [statisticsRef.current.totalDrags]);

  // ===== 정리 작업 =====
  
  useEffect(() => {
    return () => {
      // 진행 중인 드래그 취소
      if (currentSession) {
        cancelDrag();
      }
    };
  }, [currentSession, cancelDrag]);

  // ===== 반환 =====
  
  return {
    // 현재 상태
    dragState,
    currentSession,
    activeDragData,
    currentDropTarget,
    
    // 설정
    settings,
    updateSettings,
    
    // 드래그 시작
    startDrag,
    startBundleDrag,
    startElementDrag,
    startSelectionDrag,
    
    // 드래그 중 처리
    updateDragPosition,
    updateDropTarget,
    
    // 드래그 종료
    completeDrop,
    cancelDrag,
    
    // 드롭 존 관리
    registerDropZone,
    unregisterDropZone,
    findDropTarget,
    
    // 유효성 검증
    validateDrop,
    getDropConstraints,
    
    // 이벤트 핸들러
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
    
    // 터치 이벤트 핸들러
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    
    // 마우스 이벤트 핸들러
    onMouseDown,
    onMouseMove,
    onMouseUp,
    
    // 유틸리티
    isDragging,
    canDrop,
    getPreviewData,
    
    // 통계 및 성능
    statistics,
    resetStatistics
  };
};

export default useNestedBundleDrag;
