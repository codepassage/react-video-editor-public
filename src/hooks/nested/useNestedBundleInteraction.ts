/**
 * 중첩 Bundle 상호작용을 위한 고급 React Hooks 시스템
 * 
 * 기능:
 * - Bundle 계층 구조 상호작용 관리
 * - 드래그 앤 드롭 상태 추적
 * - 선택/포커스 상태 관리
 * - 키보드 네비게이션 지원
 * - 성능 최적화된 리액티브 업데이트
 * 
 * @version 1.0.0
 * @author NestedBundle Team
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  Bundle,
  NestedBundle,
  BundleElement,
  BundleHierarchyNode,
  NestedBundleRelation
} from '../../types/nested';
import { NestedBundleSystemManager } from '../../utils/nested';

// ===============================
// 상호작용 상태 타입 정의
// ===============================

export interface BundleInteractionState {
  // 선택 상태
  selectedBundleIds: Set<string>;
  selectedElementIds: Set<string>;
  focusedBundleId: string | null;
  
  // 드래그 상태
  isDragging: boolean;
  draggedBundleId: string | null;
  dragStartPosition: { x: number; y: number } | null;
  dragCurrentPosition: { x: number; y: number } | null;
  
  // 확장/축소 상태
  expandedBundleIds: Set<string>;
  collapsedBundleIds: Set<string>;
  
  // 호버 상태
  hoveredBundleId: string | null;
  hoveredElementId: string | null;
  
  // 네비게이션 상태
  navigationHistory: string[];
  currentNavigationIndex: number;
  
  // 키보드 상태
  keyboardNavigationEnabled: boolean;
  lastKeyboardAction: string | null;
}

export interface BundleInteractionActions {
  // 선택 관리
  selectBundle: (bundleId: string, multiSelect?: boolean) => void;
  deselectBundle: (bundleId: string) => void;
  clearSelection: () => void;
  selectElement: (elementId: string, multiSelect?: boolean) => void;
  deselectElement: (elementId: string) => void;
  
  // 포커스 관리
  focusBundle: (bundleId: string) => void;
  blurBundle: () => void;
  
  // 확장/축소 관리
  toggleBundleExpansion: (bundleId: string) => void;
  expandBundle: (bundleId: string) => void;
  collapseBundle: (bundleId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // 드래그 관리
  startDrag: (bundleId: string, position: { x: number; y: number }) => void;
  updateDrag: (position: { x: number; y: number }) => void;
  endDrag: () => void;
  cancelDrag: () => void;
  
  // 호버 관리
  setHoveredBundle: (bundleId: string | null) => void;
  setHoveredElement: (elementId: string | null) => void;
  
  // 네비게이션 관리
  navigateToBundle: (bundleId: string) => void;
  goBack: () => void;
  goForward: () => void;
  clearNavigationHistory: () => void;
  
  // 키보드 네비게이션
  enableKeyboardNavigation: () => void;
  disableKeyboardNavigation: () => void;
  handleKeyboardAction: (action: string, bundleId?: string) => void;
}

export interface BundleInteractionConfig {
  // 선택 옵션
  multiSelectEnabled: boolean;
  maxSelections: number;
  
  // 드래그 옵션
  dragThreshold: number;
  dragEnabled: boolean;
  
  // 확장/축소 옵션
  defaultExpanded: boolean;
  autoExpandOnHover: boolean;
  autoExpandDelay: number;
  
  // 키보드 옵션
  keyboardShortcutsEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  
  // 성능 옵션
  debounceDelay: number;
  throttleDelay: number;
  enableVirtualization: boolean;
  
  // 접근성 옵션
  announceChanges: boolean;
  highlightFocused: boolean;
  reducedMotion: boolean;
}

// ===============================
// 메인 상호작용 Hook
// ===============================

export function useNestedBundleInteraction(
  bundles: NestedBundle[],
  config: Partial<BundleInteractionConfig> = {}
): {
  state: BundleInteractionState;
  actions: BundleInteractionActions;
  computed: {
    selectedBundles: NestedBundle[];
    focusedBundle: NestedBundle | null;
    draggedBundle: NestedBundle | null;
    hoveredBundle: NestedBundle | null;
    expandedBundles: NestedBundle[];
    canGoBack: boolean;
    canGoForward: boolean;
    interactionMetrics: InteractionMetrics;
  };
} {
  // 설정 초기화
  const fullConfig: BundleInteractionConfig = useMemo(() => ({
    multiSelectEnabled: true,
    maxSelections: 50,
    dragThreshold: 5,
    dragEnabled: true,
    defaultExpanded: false,
    autoExpandOnHover: false,
    autoExpandDelay: 1000,
    keyboardShortcutsEnabled: true,
    keyboardNavigationEnabled: true,
    debounceDelay: 100,
    throttleDelay: 16,
    enableVirtualization: true,
    announceChanges: true,
    highlightFocused: true,
    reducedMotion: false,
    ...config
  }), [config]);

  // 상태 관리
  const [state, setState] = useState<BundleInteractionState>(() => ({
    selectedBundleIds: new Set(),
    selectedElementIds: new Set(),
    focusedBundleId: null,
    isDragging: false,
    draggedBundleId: null,
    dragStartPosition: null,
    dragCurrentPosition: null,
    expandedBundleIds: new Set(
      fullConfig.defaultExpanded ? bundles.map(b => b.id) : []
    ),
    collapsedBundleIds: new Set(),
    hoveredBundleId: null,
    hoveredElementId: null,
    navigationHistory: [],
    currentNavigationIndex: -1,
    keyboardNavigationEnabled: fullConfig.keyboardNavigationEnabled,
    lastKeyboardAction: null
  }));

  // 성능 메트릭 추적
  const metricsRef = useRef<InteractionMetrics>({
    selectionCount: 0,
    dragCount: 0,
    navigationCount: 0,
    keyboardActionCount: 0,
    averageResponseTime: 0,
    lastUpdateTime: Date.now()
  });

  // 디바운스/스로틀 관리
  const timersRef = useRef<{
    debounceTimer: NodeJS.Timeout | null;
    throttleTimer: NodeJS.Timeout | null;
    hoverTimer: NodeJS.Timeout | null;
  }>({
    debounceTimer: null,
    throttleTimer: null,
    hoverTimer: null
  });

  // Bundle 맵 생성 (성능 최적화)
  const bundleMap = useMemo(() => {
    const map = new Map<string, NestedBundle>();
    bundles.forEach(bundle => map.set(bundle.id, bundle));
    return map;
  }, [bundles]);

  // ===============================
  // 선택 관리 액션
  // ===============================

  const selectBundle = useCallback((bundleId: string, multiSelect = false) => {
    const startTime = performance.now();
    
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedBundleIds);
      
      if (multiSelect && fullConfig.multiSelectEnabled) {
        if (newSelectedIds.has(bundleId)) {
          newSelectedIds.delete(bundleId);
        } else if (newSelectedIds.size < fullConfig.maxSelections) {
          newSelectedIds.add(bundleId);
        }
      } else {
        newSelectedIds.clear();
        newSelectedIds.add(bundleId);
      }
      
      return {
        ...prev,
        selectedBundleIds: newSelectedIds
      };
    });
    
    // 메트릭 업데이트
    metricsRef.current.selectionCount++;
    metricsRef.current.averageResponseTime = 
      (metricsRef.current.averageResponseTime + (performance.now() - startTime)) / 2;
    
    // 접근성 알림
    if (fullConfig.announceChanges) {
      announceToScreenReader(`Bundle ${bundleId} selected`);
    }
  }, [fullConfig.multiSelectEnabled, fullConfig.maxSelections, fullConfig.announceChanges]);

  const deselectBundle = useCallback((bundleId: string) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedBundleIds);
      newSelectedIds.delete(bundleId);
      
      return {
        ...prev,
        selectedBundleIds: newSelectedIds
      };
    });
    
    if (fullConfig.announceChanges) {
      announceToScreenReader(`Bundle ${bundleId} deselected`);
    }
  }, [fullConfig.announceChanges]);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedBundleIds: new Set(),
      selectedElementIds: new Set()
    }));
    
    if (fullConfig.announceChanges) {
      announceToScreenReader('Selection cleared');
    }
  }, [fullConfig.announceChanges]);

  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedElementIds);
      
      if (multiSelect && fullConfig.multiSelectEnabled) {
        if (newSelectedIds.has(elementId)) {
          newSelectedIds.delete(elementId);
        } else {
          newSelectedIds.add(elementId);
        }
      } else {
        newSelectedIds.clear();
        newSelectedIds.add(elementId);
      }
      
      return {
        ...prev,
        selectedElementIds: newSelectedIds
      };
    });
  }, [fullConfig.multiSelectEnabled]);

  const deselectElement = useCallback((elementId: string) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedElementIds);
      newSelectedIds.delete(elementId);
      
      return {
        ...prev,
        selectedElementIds: newSelectedIds
      };
    });
  }, []);

  // ===============================
  // 포커스 관리 액션
  // ===============================

  const focusBundle = useCallback((bundleId: string) => {
    setState(prev => ({
      ...prev,
      focusedBundleId: bundleId
    }));
    
    if (fullConfig.announceChanges) {
      announceToScreenReader(`Bundle ${bundleId} focused`);
    }
  }, [fullConfig.announceChanges]);

  const blurBundle = useCallback(() => {
    setState(prev => ({
      ...prev,
      focusedBundleId: null
    }));
  }, []);

  // ===============================
  // 확장/축소 관리 액션
  // ===============================

  const toggleBundleExpansion = useCallback((bundleId: string) => {
    setState(prev => {
      const newExpandedIds = new Set(prev.expandedBundleIds);
      const newCollapsedIds = new Set(prev.collapsedBundleIds);
      
      if (newExpandedIds.has(bundleId)) {
        newExpandedIds.delete(bundleId);
        newCollapsedIds.add(bundleId);
      } else {
        newExpandedIds.add(bundleId);
        newCollapsedIds.delete(bundleId);
      }
      
      return {
        ...prev,
        expandedBundleIds: newExpandedIds,
        collapsedBundleIds: newCollapsedIds
      };
    });
    
    const bundle = bundleMap.get(bundleId);
    if (fullConfig.announceChanges && bundle) {
      const isExpanded = state.expandedBundleIds.has(bundleId);
      announceToScreenReader(
        `Bundle ${bundle.name} ${isExpanded ? 'collapsed' : 'expanded'}`
      );
    }
  }, [bundleMap, state.expandedBundleIds, fullConfig.announceChanges]);

  const expandBundle = useCallback((bundleId: string) => {
    setState(prev => {
      const newExpandedIds = new Set(prev.expandedBundleIds);
      const newCollapsedIds = new Set(prev.collapsedBundleIds);
      
      newExpandedIds.add(bundleId);
      newCollapsedIds.delete(bundleId);
      
      return {
        ...prev,
        expandedBundleIds: newExpandedIds,
        collapsedBundleIds: newCollapsedIds
      };
    });
  }, []);

  const collapseBundle = useCallback((bundleId: string) => {
    setState(prev => {
      const newExpandedIds = new Set(prev.expandedBundleIds);
      const newCollapsedIds = new Set(prev.collapsedBundleIds);
      
      newExpandedIds.delete(bundleId);
      newCollapsedIds.add(bundleId);
      
      return {
        ...prev,
        expandedBundleIds: newExpandedIds,
        collapsedBundleIds: newCollapsedIds
      };
    });
  }, []);

  const expandAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      expandedBundleIds: new Set(bundles.map(b => b.id)),
      collapsedBundleIds: new Set()
    }));
    
    if (fullConfig.announceChanges) {
      announceToScreenReader(`All ${bundles.length} bundles expanded`);
    }
  }, [bundles, fullConfig.announceChanges]);

  const collapseAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      expandedBundleIds: new Set(),
      collapsedBundleIds: new Set(bundles.map(b => b.id))
    }));
    
    if (fullConfig.announceChanges) {
      announceToScreenReader(`All ${bundles.length} bundles collapsed`);
    }
  }, [bundles, fullConfig.announceChanges]);

  // ===============================
  // 드래그 관리 액션
  // ===============================

  const startDrag = useCallback((bundleId: string, position: { x: number; y: number }) => {
    if (!fullConfig.dragEnabled) return;
    
    setState(prev => ({
      ...prev,
      isDragging: true,
      draggedBundleId: bundleId,
      dragStartPosition: position,
      dragCurrentPosition: position
    }));
    
    metricsRef.current.dragCount++;
    
    if (fullConfig.announceChanges) {
      announceToScreenReader(`Started dragging bundle ${bundleId}`);
    }
  }, [fullConfig.dragEnabled, fullConfig.announceChanges]);

  const updateDrag = useCallback((position: { x: number; y: number }) => {
    if (!state.isDragging) return;
    
    // 스로틀링 적용
    if (timersRef.current.throttleTimer) return;
    
    timersRef.current.throttleTimer = setTimeout(() => {
      timersRef.current.throttleTimer = null;
    }, fullConfig.throttleDelay);
    
    setState(prev => ({
      ...prev,
      dragCurrentPosition: position
    }));
  }, [state.isDragging, fullConfig.throttleDelay]);

  const endDrag = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDragging: false,
      draggedBundleId: null,
      dragStartPosition: null,
      dragCurrentPosition: null
    }));
    
    if (fullConfig.announceChanges) {
      announceToScreenReader('Drag operation completed');
    }
  }, [fullConfig.announceChanges]);

  const cancelDrag = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDragging: false,
      draggedBundleId: null,
      dragStartPosition: null,
      dragCurrentPosition: null
    }));
    
    if (fullConfig.announceChanges) {
      announceToScreenReader('Drag operation cancelled');
    }
  }, [fullConfig.announceChanges]);

  // ===============================
  // 호버 관리 액션
  // ===============================

  const setHoveredBundle = useCallback((bundleId: string | null) => {
    // 자동 확장 처리
    if (bundleId && fullConfig.autoExpandOnHover) {
      if (timersRef.current.hoverTimer) {
        clearTimeout(timersRef.current.hoverTimer);
      }
      
      timersRef.current.hoverTimer = setTimeout(() => {
        expandBundle(bundleId);
      }, fullConfig.autoExpandDelay);
    } else if (timersRef.current.hoverTimer) {
      clearTimeout(timersRef.current.hoverTimer);
      timersRef.current.hoverTimer = null;
    }
    
    setState(prev => ({
      ...prev,
      hoveredBundleId: bundleId
    }));
  }, [fullConfig.autoExpandOnHover, fullConfig.autoExpandDelay, expandBundle]);

  const setHoveredElement = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      hoveredElementId: elementId
    }));
  }, []);

  // ===============================
  // 네비게이션 관리 액션
  // ===============================

  const navigateToBundle = useCallback((bundleId: string) => {
    setState(prev => {
      const newHistory = prev.navigationHistory.slice(0, prev.currentNavigationIndex + 1);
      newHistory.push(bundleId);
      
      return {
        ...prev,
        navigationHistory: newHistory,
        currentNavigationIndex: newHistory.length - 1
      };
    });
    
    metricsRef.current.navigationCount++;
    
    if (fullConfig.announceChanges) {
      const bundle = bundleMap.get(bundleId);
      announceToScreenReader(`Navigated to bundle ${bundle?.name || bundleId}`);
    }
  }, [bundleMap, fullConfig.announceChanges]);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.currentNavigationIndex > 0) {
        return {
          ...prev,
          currentNavigationIndex: prev.currentNavigationIndex - 1
        };
      }
      return prev;
    });
  }, []);

  const goForward = useCallback(() => {
    setState(prev => {
      if (prev.currentNavigationIndex < prev.navigationHistory.length - 1) {
        return {
          ...prev,
          currentNavigationIndex: prev.currentNavigationIndex + 1
        };
      }
      return prev;
    });
  }, []);

  const clearNavigationHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      navigationHistory: [],
      currentNavigationIndex: -1
    }));
  }, []);

  // ===============================
  // 키보드 네비게이션 액션
  // ===============================

  const enableKeyboardNavigation = useCallback(() => {
    setState(prev => ({
      ...prev,
      keyboardNavigationEnabled: true
    }));
  }, []);

  const disableKeyboardNavigation = useCallback(() => {
    setState(prev => ({
      ...prev,
      keyboardNavigationEnabled: false
    }));
  }, []);

  const handleKeyboardAction = useCallback((action: string, bundleId?: string) => {
    if (!state.keyboardNavigationEnabled) return;
    
    setState(prev => ({
      ...prev,
      lastKeyboardAction: action
    }));
    
    metricsRef.current.keyboardActionCount++;
    
    // 키보드 액션 처리 로직 (실제 구현에서 확장)
    switch (action) {
      case 'select':
        if (bundleId) selectBundle(bundleId);
        break;
      case 'expand':
        if (bundleId) expandBundle(bundleId);
        break;
      case 'collapse':
        if (bundleId) collapseBundle(bundleId);
        break;
      case 'focus':
        if (bundleId) focusBundle(bundleId);
        break;
      default:
        break;
    }
  }, [state.keyboardNavigationEnabled, selectBundle, expandBundle, collapseBundle, focusBundle]);

  // ===============================
  // 계산된 값들
  // ===============================

  const computed = useMemo(() => {
    const selectedBundles = Array.from(state.selectedBundleIds)
      .map(id => bundleMap.get(id))
      .filter((bundle): bundle is NestedBundle => bundle !== undefined);
    
    const focusedBundle = state.focusedBundleId 
      ? bundleMap.get(state.focusedBundleId) || null 
      : null;
    
    const draggedBundle = state.draggedBundleId 
      ? bundleMap.get(state.draggedBundleId) || null 
      : null;
    
    const hoveredBundle = state.hoveredBundleId 
      ? bundleMap.get(state.hoveredBundleId) || null 
      : null;
    
    const expandedBundles = Array.from(state.expandedBundleIds)
      .map(id => bundleMap.get(id))
      .filter((bundle): bundle is NestedBundle => bundle !== undefined);
    
    const canGoBack = state.currentNavigationIndex > 0;
    const canGoForward = state.currentNavigationIndex < state.navigationHistory.length - 1;
    
    return {
      selectedBundles,
      focusedBundle,
      draggedBundle,
      hoveredBundle,
      expandedBundles,
      canGoBack,
      canGoForward,
      interactionMetrics: { ...metricsRef.current }
    };
  }, [
    state.selectedBundleIds,
    state.focusedBundleId,
    state.draggedBundleId,
    state.hoveredBundleId,
    state.expandedBundleIds,
    state.currentNavigationIndex,
    state.navigationHistory.length,
    bundleMap
  ]);

  // ===============================
  // 액션 객체 생성
  // ===============================

  const actions: BundleInteractionActions = useMemo(() => ({
    selectBundle,
    deselectBundle,
    clearSelection,
    selectElement,
    deselectElement,
    focusBundle,
    blurBundle,
    toggleBundleExpansion,
    expandBundle,
    collapseBundle,
    expandAll,
    collapseAll,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    setHoveredBundle,
    setHoveredElement,
    navigateToBundle,
    goBack,
    goForward,
    clearNavigationHistory,
    enableKeyboardNavigation,
    disableKeyboardNavigation,
    handleKeyboardAction
  }), [
    selectBundle, deselectBundle, clearSelection, selectElement, deselectElement,
    focusBundle, blurBundle, toggleBundleExpansion, expandBundle, collapseBundle,
    expandAll, collapseAll, startDrag, updateDrag, endDrag, cancelDrag,
    setHoveredBundle, setHoveredElement, navigateToBundle, goBack, goForward,
    clearNavigationHistory, enableKeyboardNavigation, disableKeyboardNavigation,
    handleKeyboardAction
  ]);

  // ===============================
  // 정리 및 이벤트 핸들러
  // ===============================

  useEffect(() => {
    return () => {
      // 타이머 정리
      if (timersRef.current.debounceTimer) {
        clearTimeout(timersRef.current.debounceTimer);
      }
      if (timersRef.current.throttleTimer) {
        clearTimeout(timersRef.current.throttleTimer);
      }
      if (timersRef.current.hoverTimer) {
        clearTimeout(timersRef.current.hoverTimer);
      }
    };
  }, []);

  return {
    state,
    actions,
    computed
  };
}

// ===============================
// 보조 타입 및 유틸리티
// ===============================

interface InteractionMetrics {
  selectionCount: number;
  dragCount: number;
  navigationCount: number;
  keyboardActionCount: number;
  averageResponseTime: number;
  lastUpdateTime: number;
}

function announceToScreenReader(message: string) {
  // 스크린 리더를 위한 접근성 알림 구현
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// ===============================
// 특화된 Hook들
// ===============================

/**
 * Bundle 선택 상태만 관리하는 경량 Hook
 */
export function useNestedBundleSelection(
  bundles: NestedBundle[],
  options: {
    multiSelect?: boolean;
    maxSelections?: number;
  } = {}
) {
  const { state, actions, computed } = useNestedBundleInteraction(bundles, {
    multiSelectEnabled: options.multiSelect ?? true,
    maxSelections: options.maxSelections ?? 50,
    dragEnabled: false,
    keyboardNavigationEnabled: false
  });
  
  return {
    selectedBundleIds: state.selectedBundleIds,
    selectedBundles: computed.selectedBundles,
    selectBundle: actions.selectBundle,
    deselectBundle: actions.deselectBundle,
    clearSelection: actions.clearSelection
  };
}

/**
 * Bundle 드래그 상태만 관리하는 경량 Hook
 */
export function useNestedBundleDrag(
  bundles: NestedBundle[],
  options: {
    dragThreshold?: number;
    onDragStart?: (bundleId: string) => void;
    onDragEnd?: (bundleId: string) => void;
  } = {}
) {
  const { state, actions } = useNestedBundleInteraction(bundles, {
    dragEnabled: true,
    dragThreshold: options.dragThreshold ?? 5,
    multiSelectEnabled: false,
    keyboardNavigationEnabled: false
  });
  
  useEffect(() => {
    if (state.isDragging && state.draggedBundleId && options.onDragStart) {
      options.onDragStart(state.draggedBundleId);
    }
  }, [state.isDragging, state.draggedBundleId, options.onDragStart]);
  
  useEffect(() => {
    if (!state.isDragging && state.draggedBundleId && options.onDragEnd) {
      options.onDragEnd(state.draggedBundleId);
    }
  }, [state.isDragging, state.draggedBundleId, options.onDragEnd]);
  
  return {
    isDragging: state.isDragging,
    draggedBundleId: state.draggedBundleId,
    dragPosition: state.dragCurrentPosition,
    startDrag: actions.startDrag,
    updateDrag: actions.updateDrag,
    endDrag: actions.endDrag,
    cancelDrag: actions.cancelDrag
  };
}

/**
 * Bundle 키보드 네비게이션만 관리하는 경량 Hook
 */
export function useNestedBundleKeyboard(
  bundles: NestedBundle[],
  options: {
    shortcuts?: Record<string, (bundleId?: string) => void>;
    focusOnMount?: boolean;
  } = {}
) {
  const { state, actions } = useNestedBundleInteraction(bundles, {
    keyboardNavigationEnabled: true,
    keyboardShortcutsEnabled: true,
    dragEnabled: false,
    multiSelectEnabled: false
  });
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.keyboardNavigationEnabled) return;
      
      const shortcut = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.key.toLowerCase()}`;
      
      if (options.shortcuts && options.shortcuts[shortcut]) {
        event.preventDefault();
        options.shortcuts[shortcut](state.focusedBundleId || undefined);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.keyboardNavigationEnabled, state.focusedBundleId, options.shortcuts]);
  
  return {
    focusedBundleId: state.focusedBundleId,
    keyboardNavigationEnabled: state.keyboardNavigationEnabled,
    lastKeyboardAction: state.lastKeyboardAction,
    focusBundle: actions.focusBundle,
    handleKeyboardAction: actions.handleKeyboardAction,
    enableKeyboardNavigation: actions.enableKeyboardNavigation,
    disableKeyboardNavigation: actions.disableKeyboardNavigation
  };
}
