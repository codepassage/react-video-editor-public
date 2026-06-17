/**
 * @fileoverview 중첩 Bundle 상태 관리 Hook
 * @description 중첩 Bundle 시스템의 상태 관리와 성능 최적화를 위한 캐싱을 담당하는 React Hook
 * @version 1.0.0
 * @created 2025-06-22
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { NestedBundle, BundleHierarchyNode, BundleElement } from '../../types/nested';
import { TimelineTrack } from '../../types';

// ===== 타입 정의 =====

/**
 * 캐시 키 타입
 */
type CacheKey = string;

/**
 * 캐시 항목
 */
interface CacheItem<T = any> {
  key: CacheKey;
  value: T;
  timestamp: number;
  accessCount: number;
  size: number;
  dependencies: string[];
  ttl?: number;
}

/**
 * 캐시 통계
 */
interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  hitRate: number;
  averageAccessTime: number;
}

/**
 * 상태 스냅샷
 */
interface StateSnapshot {
  id: string;
  timestamp: number;
  bundles: NestedBundle[];
  hierarchyNodes: BundleHierarchyNode[];
  metadata: {
    version: string;
    totalElements: number;
    maxDepth: number;
    checksum: string;
  };
}

/**
 * 상태 변경 이벤트
 */
interface StateChangeEvent {
  type: 'bundle_added' | 'bundle_removed' | 'bundle_updated' | 'hierarchy_changed' | 'cache_invalidated';
  bundleId?: string;
  elementId?: string;
  timestamp: number;
  details?: any;
}

/**
 * 동기화 상태
 */
interface SyncState {
  isLoading: boolean;
  isSaving: boolean;
  isError: boolean;
  lastSyncTime: number;
  pendingChanges: number;
  syncProgress: number;
  error?: Error;
}

/**
 * 성능 메트릭
 */
interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  cacheAccessTime: number;
  memoryUsage: number;
  operationCount: number;
  slowOperations: number;
}

/**
 * 상태 설정
 */
interface StateSettings {
  enableCaching: boolean;
  maxCacheSize: number;
  cacheTTL: number;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  enableUndoRedo: boolean;
  maxHistorySize: number;
  enableCompression: boolean;
  compressionThreshold: number;
  enablePerformanceMonitoring: boolean;
}

// ===== Hook 인터페이스 =====

export interface UseNestedBundleStateResult {
  // 현재 상태
  bundles: NestedBundle[];
  hierarchyNodes: BundleHierarchyNode[];
  syncState: SyncState;
  
  // 상태 조작
  addBundle: (bundle: NestedBundle, hierarchyNode: BundleHierarchyNode) => void;
  updateBundle: (bundleId: string, updates: Partial<NestedBundle>) => void;
  removeBundle: (bundleId: string) => void;
  moveBundle: (bundleId: string, newParentId?: string, newIndex?: number) => void;
  
  // 요소 조작
  addElement: (bundleId: string, element: BundleElement) => void;
  updateElement: (bundleId: string, elementId: string, updates: Partial<BundleElement>) => void;
  removeElement: (bundleId: string, elementId: string) => void;
  moveElement: (elementId: string, fromBundleId: string, toBundleId: string) => void;
  
  // 계층 구조 조작
  updateHierarchy: (bundleId: string, hierarchyUpdates: Partial<BundleHierarchyNode>) => void;
  rebuildHierarchy: () => void;
  validateHierarchy: () => { isValid: boolean; issues: string[] };
  
  // 캐시 관리
  clearCache: () => void;
  invalidateCache: (pattern?: string) => void;
  getCacheStats: () => CacheStats;
  preloadData: (bundleIds: string[]) => Promise<void>;
  
  // 스냅샷 관리
  createSnapshot: (name?: string) => string;
  restoreSnapshot: (snapshotId: string) => boolean;
  listSnapshots: () => StateSnapshot[];
  removeSnapshot: (snapshotId: string) => void;
  
  // Undo/Redo
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  
  // 동기화
  save: () => Promise<boolean>;
  load: () => Promise<boolean>;
  sync: () => Promise<boolean>;
  
  // 검색 및 필터링
  findBundle: (predicate: (bundle: NestedBundle) => boolean) => NestedBundle | null;
  findBundles: (predicate: (bundle: NestedBundle) => boolean) => NestedBundle[];
  findElement: (predicate: (element: BundleElement) => boolean) => { bundle: NestedBundle; element: BundleElement } | null;
  filterBundles: (filter: BundleFilter) => NestedBundle[];
  
  // 통계 및 분석
  getStats: () => BundleStats;
  getPerformanceMetrics: () => PerformanceMetrics;
  analyzeStructure: () => StructureAnalysis;
  
  // 설정
  settings: StateSettings;
  updateSettings: (settings: Partial<StateSettings>) => void;
  
  // 이벤트 구독
  subscribe: (listener: (event: StateChangeEvent) => void) => () => void;
  
  // 유틸리티
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  getChecksum: () => string;
}

/**
 * Bundle 필터
 */
interface BundleFilter {
  name?: string;
  depth?: number | [number, number];
  hasElements?: boolean;
  elementCount?: number | [number, number];
  timeRange?: [number, number];
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Bundle 통계
 */
interface BundleStats {
  totalBundles: number;
  totalElements: number;
  maxDepth: number;
  averageElementsPerBundle: number;
  bundlesByDepth: Record<number, number>;
  elementsByType: Record<string, number>;
  totalDuration: number;
  memoryUsage: number;
}

/**
 * 구조 분석
 */
interface StructureAnalysis {
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  healthScore: number;
  issues: Array<{
    type: 'warning' | 'error';
    message: string;
    bundleId?: string;
    suggestion?: string;
  }>;
  recommendations: string[];
  performance: {
    renderingComplexity: number;
    memoryEfficiency: number;
    cacheEfficiency: number;
  };
}

/**
 * Hook 옵션
 */
interface UseNestedBundleStateOptions {
  /** 초기 Bundle 데이터 */
  initialBundles?: NestedBundle[];
  
  /** 초기 계층 노드 데이터 */
  initialHierarchyNodes?: BundleHierarchyNode[];
  
  /** 타임라인 트랙 데이터 */
  tracks?: TimelineTrack[];
  
  /** 초기 설정 */
  initialSettings?: Partial<StateSettings>;
  
  /** 이벤트 콜백들 */
  onStateChange?: (event: StateChangeEvent) => void;
  onSyncStateChange?: (syncState: SyncState) => void;
  onError?: (error: Error) => void;
  
  /** 외부 저장소 연동 */
  storage?: {
    save: (data: { bundles: NestedBundle[]; hierarchyNodes: BundleHierarchyNode[] }) => Promise<boolean>;
    load: () => Promise<{ bundles: NestedBundle[]; hierarchyNodes: BundleHierarchyNode[] } | null>;
  };
}

// ===== Hook 구현 =====

/**
 * 중첩 Bundle 상태 관리 Hook
 */
export const useNestedBundleState = (
  options: UseNestedBundleStateOptions
): UseNestedBundleStateResult => {
  const {
    initialBundles = [],
    initialHierarchyNodes = [],
    tracks = [],
    initialSettings,
    onStateChange,
    onSyncStateChange,
    onError,
    storage
  } = options;

  // ===== 상태 관리 =====
  
  const [bundles, setBundles] = useState<NestedBundle[]>(initialBundles);
  const [hierarchyNodes, setHierarchyNodes] = useState<BundleHierarchyNode[]>(initialHierarchyNodes);
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    isSaving: false,
    isError: false,
    lastSyncTime: 0,
    pendingChanges: 0,
    syncProgress: 0
  });
  
  const [settings, setSettings] = useState<StateSettings>({
    enableCaching: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    cacheTTL: 5 * 60 * 1000, // 5분
    enableAutoSave: true,
    autoSaveInterval: 30 * 1000, // 30초
    enableUndoRedo: true,
    maxHistorySize: 50,
    enableCompression: false,
    compressionThreshold: 1024 * 1024, // 1MB
    enablePerformanceMonitoring: true,
    ...initialSettings
  });

  // ===== Refs =====
  
  const cacheRef = useRef<Map<CacheKey, CacheItem>>(new Map());
  const cacheStatsRef = useRef<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    hitRate: 0,
    averageAccessTime: 0
  });
  
  const historyRef = useRef<StateSnapshot[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const listenersRef = useRef<Set<(event: StateChangeEvent) => void>>(new Set());
  const changeCounterRef = useRef<number>(0);
  const performanceRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    updateTime: 0,
    cacheAccessTime: 0,
    memoryUsage: 0,
    operationCount: 0,
    slowOperations: 0
  });

  // ===== 유틸리티 함수들 =====
  
  const generateId = useCallback((): string => {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const calculateChecksum = useCallback((data: any): string => {
    // 간단한 체크섬 계산
    const jsonString = JSON.stringify(data, null, 0);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }, []);

  const measurePerformance = useCallback(<T>(operation: () => T, operationName: string): T => {
    if (!settings.enablePerformanceMonitoring) {
      return operation();
    }

    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    // 성능 메트릭 업데이트
    const metrics = performanceRef.current;
    metrics.operationCount++;
    
    switch (operationName) {
      case 'render':
        metrics.renderTime = (metrics.renderTime + duration) / 2;
        break;
      case 'update':
        metrics.updateTime = (metrics.updateTime + duration) / 2;
        break;
      case 'cache':
        metrics.cacheAccessTime = (metrics.cacheAccessTime + duration) / 2;
        break;
    }

    // 느린 연산 감지 (50ms 초과)
    if (duration > 50) {
      metrics.slowOperations++;
    }

    return result;
  }, [settings.enablePerformanceMonitoring]);

  const emitStateChange = useCallback((event: Omit<StateChangeEvent, 'timestamp'>) => {
    const fullEvent: StateChangeEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    changeCounterRef.current++;
    
    // 모든 리스너에게 이벤트 전파
    listenersRef.current.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.warn('State change listener error:', error);
      }
    });
    
    onStateChange?.(fullEvent);
  }, [onStateChange]);

  // ===== 캐시 관리 =====
  
  const getCacheKey = useCallback((type: string, ...params: any[]): CacheKey => {
    return `${type}:${params.map(p => typeof p === 'object' ? JSON.stringify(p) : String(p)).join(':')}`;
  }, []);

  const setCache = useCallback(<T>(key: CacheKey, value: T, dependencies: string[] = [], ttl?: number): void => {
    if (!settings.enableCaching) return;

    const item: CacheItem<T> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0,
      size: JSON.stringify(value).length * 2, // UTF-16 기준
      dependencies,
      ttl
    };

    // 캐시 크기 제한 확인
    let currentSize = cacheStatsRef.current.totalSize + item.size;
    
    while (currentSize > settings.maxCacheSize && cacheRef.current.size > 0) {
      // LRU 방식으로 가장 오래된 항목 제거
      let oldestKey: string | null = null;
      let oldestTime = Date.now();
      
      for (const [k, v] of cacheRef.current) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        const removedItem = cacheRef.current.get(oldestKey);
        cacheRef.current.delete(oldestKey);
        if (removedItem) {
          currentSize -= removedItem.size;
          cacheStatsRef.current.evictionCount++;
        }
      } else {
        break;
      }
    }

    cacheRef.current.set(key, item);
    
    // 캐시 통계 업데이트
    cacheStatsRef.current.totalItems = cacheRef.current.size;
    cacheStatsRef.current.totalSize = currentSize;
  }, [settings.enableCaching, settings.maxCacheSize]);

  const getCache = useCallback(<T>(key: CacheKey): T | null => {
    if (!settings.enableCaching) return null;

    const startTime = performance.now();
    const item = cacheRef.current.get(key) as CacheItem<T> | undefined;
    const endTime = performance.now();

    // 캐시 접근 시간 업데이트
    const stats = cacheStatsRef.current;
    stats.averageAccessTime = (stats.averageAccessTime + (endTime - startTime)) / 2;

    if (!item) {
      stats.missCount++;
      stats.hitRate = stats.hitCount / (stats.hitCount + stats.missCount);
      return null;
    }

    // TTL 확인
    if (item.ttl && (Date.now() - item.timestamp) > item.ttl) {
      cacheRef.current.delete(key);
      stats.missCount++;
      stats.evictionCount++;
      return null;
    }

    // 접근 카운트 업데이트
    item.accessCount++;
    item.timestamp = Date.now(); // LRU 업데이트

    stats.hitCount++;
    stats.hitRate = stats.hitCount / (stats.hitCount + stats.missCount);

    return item.value;
  }, [settings.enableCaching]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    cacheStatsRef.current = {
      totalItems: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      hitRate: 0,
      averageAccessTime: 0
    };
  }, []);

  const invalidateCache = useCallback((pattern?: string) => {
    if (!pattern) {
      clearCache();
      return;
    }

    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    for (const key of cacheRef.current.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const item = cacheRef.current.get(key);
      cacheRef.current.delete(key);
      if (item) {
        cacheStatsRef.current.totalSize -= item.size;
        cacheStatsRef.current.evictionCount++;
      }
    });
    
    cacheStatsRef.current.totalItems = cacheRef.current.size;
    
    emitStateChange({ type: 'cache_invalidated', details: { pattern, deletedCount: keysToDelete.length } });
  }, [clearCache, emitStateChange]);

  // ===== Bundle 조작 =====
  
  const addBundle = useCallback((bundle: NestedBundle, hierarchyNode: BundleHierarchyNode) => {
    measurePerformance(() => {
      setBundles(prev => [...prev, bundle]);
      setHierarchyNodes(prev => [...prev, hierarchyNode]);
      
      // 관련 캐시 무효화
      invalidateCache(`bundle:${bundle.id}`);
      invalidateCache('hierarchy:*');
      
      emitStateChange({ type: 'bundle_added', bundleId: bundle.id });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  const updateBundle = useCallback((bundleId: string, updates: Partial<NestedBundle>) => {
    measurePerformance(() => {
      setBundles(prev => prev.map(bundle => 
        bundle.id === bundleId ? { ...bundle, ...updates } : bundle
      ));
      
      // 관련 캐시 무효화
      invalidateCache(`bundle:${bundleId}`);
      
      emitStateChange({ type: 'bundle_updated', bundleId });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  const removeBundle = useCallback((bundleId: string) => {
    measurePerformance(() => {
      setBundles(prev => prev.filter(bundle => bundle.id !== bundleId));
      setHierarchyNodes(prev => prev.filter(node => 
        node.bundleId !== bundleId && node.parentId !== bundleId
      ));
      
      // 관련 캐시 무효화
      invalidateCache(`bundle:${bundleId}`);
      invalidateCache('hierarchy:*');
      
      emitStateChange({ type: 'bundle_removed', bundleId });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  const moveBundle = useCallback((bundleId: string, newParentId?: string, newIndex?: number) => {
    measurePerformance(() => {
      setHierarchyNodes(prev => prev.map(node => {
        if (node.bundleId === bundleId) {
          const newDepth = newParentId ? 
            (prev.find(p => p.bundleId === newParentId)?.depth || 0) + 1 : 0;
          
          return {
            ...node,
            parentId: newParentId,
            depth: newDepth,
            path: newParentId ? `${newParentId}.${bundleId}` : bundleId
          };
        }
        return node;
      }));
      
      // 관련 캐시 무효화
      invalidateCache('hierarchy:*');
      
      emitStateChange({ type: 'hierarchy_changed', bundleId });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  // ===== 요소 조작 =====
  
  const addElement = useCallback((bundleId: string, element: BundleElement) => {
    measurePerformance(() => {
      setBundles(prev => prev.map(bundle => {
        if (bundle.id === bundleId) {
          return {
            ...bundle,
            elements: [...bundle.elements, element]
          };
        }
        return bundle;
      }));
      
      // 관련 캐시 무효화
      invalidateCache(`bundle:${bundleId}`);
      
      emitStateChange({ type: 'bundle_updated', bundleId, elementId: element.id });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  const updateElement = useCallback((bundleId: string, elementId: string, updates: Partial<BundleElement>) => {
    measurePerformance(() => {
      setBundles(prev => prev.map(bundle => {
        if (bundle.id === bundleId) {
          return {
            ...bundle,
            elements: bundle.elements.map(element =>
              element.id === elementId ? { ...element, ...updates } : element
            )
          };
        }
        return bundle;
      }));
      
      // 관련 캐시 무효화
      invalidateCache(`bundle:${bundleId}`);
      
      emitStateChange({ type: 'bundle_updated', bundleId, elementId });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  const removeElement = useCallback((bundleId: string, elementId: string) => {
    measurePerformance(() => {
      setBundles(prev => prev.map(bundle => {
        if (bundle.id === bundleId) {
          return {
            ...bundle,
            elements: bundle.elements.filter(element => element.id !== elementId)
          };
        }
        return bundle;
      }));
      
      // 관련 캐시 무효화
      invalidateCache(`bundle:${bundleId}`);
      
      emitStateChange({ type: 'bundle_updated', bundleId, elementId });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  const moveElement = useCallback((elementId: string, fromBundleId: string, toBundleId: string) => {
    measurePerformance(() => {
      let elementToMove: BundleElement | null = null;
      
      // 요소 찾기 및 제거
      setBundles(prev => prev.map(bundle => {
        if (bundle.id === fromBundleId) {
          const element = bundle.elements.find(e => e.id === elementId);
          if (element) {
            elementToMove = { ...element, parentId: toBundleId };
            return {
              ...bundle,
              elements: bundle.elements.filter(e => e.id !== elementId)
            };
          }
        }
        return bundle;
      }));
      
      // 요소 추가
      if (elementToMove) {
        setBundles(prev => prev.map(bundle => {
          if (bundle.id === toBundleId) {
            return {
              ...bundle,
              elements: [...bundle.elements, elementToMove!]
            };
          }
          return bundle;
        }));
      }
      
      // 관련 캐시 무효화
      invalidateCache(`bundle:${fromBundleId}`);
      invalidateCache(`bundle:${toBundleId}`);
      
      emitStateChange({ type: 'bundle_updated', elementId });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  // ===== 계층 구조 조작 =====
  
  const updateHierarchy = useCallback((bundleId: string, hierarchyUpdates: Partial<BundleHierarchyNode>) => {
    measurePerformance(() => {
      setHierarchyNodes(prev => prev.map(node =>
        node.bundleId === bundleId ? { ...node, ...hierarchyUpdates } : node
      ));
      
      // 관련 캐시 무효화
      invalidateCache('hierarchy:*');
      
      emitStateChange({ type: 'hierarchy_changed', bundleId });
    }, 'update');
  }, [measurePerformance, invalidateCache, emitStateChange]);

  const rebuildHierarchy = useCallback(() => {
    measurePerformance(() => {
      // 계층 구조 재구축 로직
      const newHierarchyNodes = hierarchyNodes.map(node => {
        // 부모-자식 관계 재계산
        const parentNode = hierarchyNodes.find(p => p.bundleId === node.parentId);
        const newDepth = parentNode ? parentNode.depth + 1 : 0;
        const newPath = parentNode ? `${parentNode.path}.${node.bundleId}` : node.bundleId;
        
        return {
          ...node,
          depth: newDepth,
          path: newPath
        };
      });
      
      setHierarchyNodes(newHierarchyNodes);
      
      // 모든 계층 캐시 무효화
      invalidateCache('hierarchy:*');
      
      emitStateChange({ type: 'hierarchy_changed' });
    }, 'update');
  }, [measurePerformance, hierarchyNodes, invalidateCache, emitStateChange]);

  const validateHierarchy = useCallback((): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // 순환 참조 검사
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        issues.push(`순환 참조 감지: ${nodeId}`);
        return true;
      }
      
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const node = hierarchyNodes.find(n => n.bundleId === nodeId);
      const children = hierarchyNodes.filter(n => n.parentId === nodeId);
      
      for (const child of children) {
        if (hasCycle(child.bundleId)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    // 모든 루트 노드에서 검사
    const rootNodes = hierarchyNodes.filter(node => !node.parentId);
    for (const root of rootNodes) {
      hasCycle(root.bundleId);
    }
    
    // 고아 노드 검사
    for (const node of hierarchyNodes) {
      if (node.parentId && !hierarchyNodes.some(p => p.bundleId === node.parentId)) {
        issues.push(`고아 노드 발견: ${node.bundleId} (부모: ${node.parentId})`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }, [hierarchyNodes]);

  // ===== 스냅샷 관리 =====
  
  const createSnapshot = useCallback((name?: string): string => {
    const snapshot: StateSnapshot = {
      id: generateId(),
      timestamp: Date.now(),
      bundles: JSON.parse(JSON.stringify(bundles)),
      hierarchyNodes: JSON.parse(JSON.stringify(hierarchyNodes)),
      metadata: {
        version: '1.0.0',
        totalElements: bundles.reduce((sum, b) => sum + b.elements.length, 0),
        maxDepth: Math.max(...hierarchyNodes.map(n => n.depth), 0),
        checksum: calculateChecksum({ bundles, hierarchyNodes })
      }
    };
    
    historyRef.current.push(snapshot);
    
    // 히스토리 크기 제한
    if (historyRef.current.length > settings.maxHistorySize) {
      historyRef.current.shift();
    }
    
    historyIndexRef.current = historyRef.current.length - 1;
    
    return snapshot.id;
  }, [generateId, bundles, hierarchyNodes, calculateChecksum, settings.maxHistorySize]);

  const restoreSnapshot = useCallback((snapshotId: string): boolean => {
    const snapshot = historyRef.current.find(s => s.id === snapshotId);
    if (!snapshot) return false;
    
    measurePerformance(() => {
      setBundles(snapshot.bundles);
      setHierarchyNodes(snapshot.hierarchyNodes);
      
      // 모든 캐시 무효화
      clearCache();
      
      emitStateChange({ type: 'hierarchy_changed', details: { restored: true, snapshotId } });
    }, 'update');
    
    return true;
  }, [measurePerformance, clearCache, emitStateChange]);

  const listSnapshots = useCallback((): StateSnapshot[] => {
    return [...historyRef.current];
  }, []);

  const removeSnapshot = useCallback((snapshotId: string) => {
    historyRef.current = historyRef.current.filter(s => s.id !== snapshotId);
    historyIndexRef.current = Math.min(historyIndexRef.current, historyRef.current.length - 1);
  }, []);

  // ===== Undo/Redo =====
  
  const undo = useCallback((): boolean => {
    if (historyIndexRef.current <= 0) return false;
    
    historyIndexRef.current--;
    const snapshot = historyRef.current[historyIndexRef.current];
    
    if (snapshot) {
      return restoreSnapshot(snapshot.id);
    }
    
    return false;
  }, [restoreSnapshot]);

  const redo = useCallback((): boolean => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return false;
    
    historyIndexRef.current++;
    const snapshot = historyRef.current[historyIndexRef.current];
    
    if (snapshot) {
      return restoreSnapshot(snapshot.id);
    }
    
    return false;
  }, [restoreSnapshot]);

  const canUndo = useMemo(() => historyIndexRef.current > 0, [historyIndexRef.current]);
  const canRedo = useMemo(() => historyIndexRef.current < historyRef.current.length - 1, [historyIndexRef.current]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    historyIndexRef.current = -1;
  }, []);

  // ===== 동기화 =====
  
  const save = useCallback(async (): Promise<boolean> => {
    if (!storage?.save) return false;
    
    setSyncState(prev => ({ ...prev, isSaving: true, syncProgress: 0 }));
    
    try {
      const success = await storage.save({ bundles, hierarchyNodes });
      
      setSyncState(prev => ({
        ...prev,
        isSaving: false,
        lastSyncTime: Date.now(),
        pendingChanges: 0,
        syncProgress: 100,
        isError: false
      }));
      
      return success;
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isSaving: false,
        isError: true,
        error: error as Error
      }));
      
      onError?.(error as Error);
      return false;
    }
  }, [storage, bundles, hierarchyNodes, onError]);

  const load = useCallback(async (): Promise<boolean> => {
    if (!storage?.load) return false;
    
    setSyncState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const data = await storage.load();
      
      if (data) {
        setBundles(data.bundles);
        setHierarchyNodes(data.hierarchyNodes);
        clearCache();
      }
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: Date.now(),
        isError: false
      }));
      
      return !!data;
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error as Error
      }));
      
      onError?.(error as Error);
      return false;
    }
  }, [storage, clearCache, onError]);

  const sync = useCallback(async (): Promise<boolean> => {
    const saveSuccess = await save();
    const loadSuccess = await load();
    return saveSuccess && loadSuccess;
  }, [save, load]);

  // ===== 검색 및 필터링 =====
  
  const findBundle = useCallback((predicate: (bundle: NestedBundle) => boolean): NestedBundle | null => {
    return bundles.find(predicate) || null;
  }, [bundles]);

  const findBundles = useCallback((predicate: (bundle: NestedBundle) => boolean): NestedBundle[] => {
    return bundles.filter(predicate);
  }, [bundles]);

  const findElement = useCallback((predicate: (element: BundleElement) => boolean): { bundle: NestedBundle; element: BundleElement } | null => {
    for (const bundle of bundles) {
      const element = bundle.elements.find(predicate);
      if (element) {
        return { bundle, element };
      }
    }
    return null;
  }, [bundles]);

  const filterBundles = useCallback((filter: BundleFilter): NestedBundle[] => {
    return bundles.filter(bundle => {
      if (filter.name && !bundle.name.toLowerCase().includes(filter.name.toLowerCase())) {
        return false;
      }
      
      const node = hierarchyNodes.find(n => n.bundleId === bundle.id);
      if (filter.depth !== undefined) {
        const depth = node?.depth || 0;
        if (typeof filter.depth === 'number') {
          if (depth !== filter.depth) return false;
        } else {
          const [min, max] = filter.depth;
          if (depth < min || depth > max) return false;
        }
      }
      
      if (filter.hasElements !== undefined) {
        const hasElements = bundle.elements.length > 0;
        if (hasElements !== filter.hasElements) return false;
      }
      
      if (filter.elementCount !== undefined) {
        const count = bundle.elements.length;
        if (typeof filter.elementCount === 'number') {
          if (count !== filter.elementCount) return false;
        } else {
          const [min, max] = filter.elementCount;
          if (count < min || count > max) return false;
        }
      }
      
      if (filter.timeRange) {
        const [minTime, maxTime] = filter.timeRange;
        if (bundle.timeRange.startTime > maxTime || bundle.timeRange.endTime < minTime) {
          return false;
        }
      }
      
      return true;
    });
  }, [bundles, hierarchyNodes]);

  // ===== 통계 및 분석 =====
  
  const getStats = useCallback((): BundleStats => {
    const totalElements = bundles.reduce((sum, b) => sum + b.elements.length, 0);
    const maxDepth = Math.max(...hierarchyNodes.map(n => n.depth), 0);
    const bundlesByDepth: Record<number, number> = {};
    const elementsByType: Record<string, number> = {};
    
    hierarchyNodes.forEach(node => {
      bundlesByDepth[node.depth] = (bundlesByDepth[node.depth] || 0) + 1;
    });
    
    bundles.forEach(bundle => {
      bundle.elements.forEach(element => {
        elementsByType[element.type] = (elementsByType[element.type] || 0) + 1;
      });
    });
    
    const totalDuration = Math.max(...bundles.map(b => b.timeRange.endTime), 0);
    const memoryUsage = JSON.stringify({ bundles, hierarchyNodes }).length * 2;
    
    return {
      totalBundles: bundles.length,
      totalElements,
      maxDepth,
      averageElementsPerBundle: totalElements / Math.max(bundles.length, 1),
      bundlesByDepth,
      elementsByType,
      totalDuration,
      memoryUsage
    };
  }, [bundles, hierarchyNodes]);

  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    return { ...performanceRef.current };
  }, []);

  const analyzeStructure = useCallback((): StructureAnalysis => {
    const stats = getStats();
    const validation = validateHierarchy();
    
    let complexity: StructureAnalysis['complexity'] = 'simple';
    if (stats.maxDepth > 3) complexity = 'moderate';
    if (stats.maxDepth > 5 || stats.totalBundles > 50) complexity = 'complex';
    if (stats.maxDepth > 8 || stats.totalBundles > 100) complexity = 'very_complex';
    
    const healthScore = validation.isValid ? 100 - (validation.issues.length * 10) : 50;
    
    const issues = validation.issues.map(issue => ({
      type: 'error' as const,
      message: issue,
      suggestion: '계층 구조를 확인하고 수정하세요.'
    }));
    
    const recommendations: string[] = [];
    if (stats.maxDepth > 6) {
      recommendations.push('너무 깊은 중첩을 피하세요 (권장: 5단계 이하)');
    }
    if (stats.averageElementsPerBundle > 10) {
      recommendations.push('Bundle당 요소 수를 줄이는 것을 고려하세요');
    }
    if (stats.memoryUsage > 10 * 1024 * 1024) {
      recommendations.push('메모리 사용량이 높습니다. 압축을 활성화하세요');
    }
    
    return {
      complexity,
      healthScore,
      issues,
      recommendations,
      performance: {
        renderingComplexity: Math.min(100, stats.totalElements * 0.1 + stats.maxDepth * 5),
        memoryEfficiency: Math.max(0, 100 - (stats.memoryUsage / (1024 * 1024)) * 2),
        cacheEfficiency: cacheStatsRef.current.hitRate * 100
      }
    };
  }, [getStats, validateHierarchy]);

  // ===== 설정 업데이트 =====
  
  const updateSettings = useCallback((newSettings: Partial<StateSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // ===== 이벤트 구독 =====
  
  const subscribe = useCallback((listener: (event: StateChangeEvent) => void): (() => void) => {
    listenersRef.current.add(listener);
    
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  // ===== 유틸리티 =====
  
  const isLoading = useMemo(() => syncState.isLoading, [syncState.isLoading]);
  const hasUnsavedChanges = useMemo(() => syncState.pendingChanges > 0, [syncState.pendingChanges]);
  
  const getChecksum = useCallback(() => {
    return calculateChecksum({ bundles, hierarchyNodes });
  }, [bundles, hierarchyNodes, calculateChecksum]);

  // ===== 자동 저장 =====
  
  useEffect(() => {
    if (!settings.enableAutoSave || !storage?.save) return;
    
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        save();
      }
    }, settings.autoSaveInterval);
    
    return () => clearInterval(interval);
  }, [settings.enableAutoSave, settings.autoSaveInterval, hasUnsavedChanges, save, storage?.save]);

  // ===== 변경 사항 추적 =====
  
  useEffect(() => {
    setSyncState(prev => ({
      ...prev,
      pendingChanges: changeCounterRef.current
    }));
  }, [bundles, hierarchyNodes]);

  // ===== 캐시 정리 =====
  
  useEffect(() => {
    if (!settings.enableCaching) return;
    
    const interval = setInterval(() => {
      // TTL 만료된 캐시 항목 정리
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      for (const [key, item] of cacheRef.current) {
        if (item.ttl && (now - item.timestamp) > item.ttl) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        const item = cacheRef.current.get(key);
        cacheRef.current.delete(key);
        if (item) {
          cacheStatsRef.current.totalSize -= item.size;
          cacheStatsRef.current.evictionCount++;
        }
      });
      
      cacheStatsRef.current.totalItems = cacheRef.current.size;
    }, settings.cacheTTL);
    
    return () => clearInterval(interval);
  }, [settings.enableCaching, settings.cacheTTL]);

  // ===== 반환 =====
  
  return {
    // 현재 상태
    bundles,
    hierarchyNodes,
    syncState,
    
    // 상태 조작
    addBundle,
    updateBundle,
    removeBundle,
    moveBundle,
    
    // 요소 조작
    addElement,
    updateElement,
    removeElement,
    moveElement,
    
    // 계층 구조 조작
    updateHierarchy,
    rebuildHierarchy,
    validateHierarchy,
    
    // 캐시 관리
    clearCache,
    invalidateCache,
    getCacheStats: () => ({ ...cacheStatsRef.current }),
    preloadData: async (bundleIds: string[]) => {
      // 프리로딩 로직 구현 가능
    },
    
    // 스냅샷 관리
    createSnapshot,
    restoreSnapshot,
    listSnapshots,
    removeSnapshot,
    
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    
    // 동기화
    save,
    load,
    sync,
    
    // 검색 및 필터링
    findBundle,
    findBundles,
    findElement,
    filterBundles,
    
    // 통계 및 분석
    getStats,
    getPerformanceMetrics,
    analyzeStructure,
    
    // 설정
    settings,
    updateSettings,
    
    // 이벤트 구독
    subscribe,
    
    // 유틸리티
    isLoading,
    hasUnsavedChanges,
    getChecksum
  };
};

export default useNestedBundleState;
