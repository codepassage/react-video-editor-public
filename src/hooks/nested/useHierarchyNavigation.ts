/**
 * @fileoverview 계층 구조 탐색 관리 Hook
 * @description Bundle 계층 구조 내에서의 탐색과 네비게이션을 관리하는 React Hook
 * @version 1.0.0
 * @created 2025-06-22
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { NestedBundle, BundleHierarchyNode } from '../../types/nested';

// ===== 타입 정의 =====

/**
 * 네비게이션 방향
 */
type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'parent' | 'child' | 'sibling';

/**
 * 네비게이션 히스토리 항목
 */
interface NavigationHistoryItem {
  bundleId: string;
  bundleName: string;
  depth: number;
  path: string;
  timestamp: number;
  navigationType: 'click' | 'keyboard' | 'programmatic';
}

/**
 * 브레드크럼 항목
 */
interface BreadcrumbItem {
  bundleId: string;
  bundleName: string;
  depth: number;
  isClickable: boolean;
  isCurrent: boolean;
  path: string;
}

/**
 * 계층 통계
 */
interface HierarchyStats {
  totalBundles: number;
  maxDepth: number;
  currentDepth: number;
  siblingCount: number;
  childrenCount: number;
  ancestorCount: number;
  descendantCount: number;
}

/**
 * 네비게이션 옵션
 */
interface NavigationOptions {
  /** 기록을 히스토리에 추가할지 여부 */
  addToHistory?: boolean;
  
  /** 애니메이션 효과 적용 여부 */
  animated?: boolean;
  
  /** 자동 확장 여부 */
  autoExpand?: boolean;
  
  /** 포커스 설정 여부 */
  setFocus?: boolean;
  
  /** 스크롤 동작 */
  scrollBehavior?: 'auto' | 'smooth';
}

/**
 * 검색 옵션
 */
interface SearchOptions {
  /** 검색 범위 */
  scope?: 'current' | 'children' | 'descendants' | 'siblings' | 'all';
  
  /** 대소문자 구분 */
  caseSensitive?: boolean;
  
  /** 정확한 일치 */
  exactMatch?: boolean;
  
  /** 검색 필드 */
  searchFields?: ('name' | 'id' | 'path' | 'metadata')[];
}

/**
 * 검색 결과
 */
interface SearchResult {
  bundleId: string;
  bundleName: string;
  path: string;
  depth: number;
  matchType: 'name' | 'id' | 'path' | 'metadata';
  matchedText: string;
  score: number;
}

// ===== Hook 인터페이스 =====

export interface UseHierarchyNavigationResult {
  // 현재 상태
  currentBundleId: string | null;
  currentBundle: NestedBundle | null;
  currentHierarchyNode: BundleHierarchyNode | null;
  
  // 계층 정보
  hierarchyStats: HierarchyStats;
  breadcrumbPath: BreadcrumbItem[];
  parentBundle: NestedBundle | null;
  siblingBundles: NestedBundle[];
  childBundles: NestedBundle[];
  
  // 네비게이션 액션
  navigateTo: (bundleId: string, options?: NavigationOptions) => boolean;
  navigateToParent: (options?: NavigationOptions) => boolean;
  navigateToChild: (childId: string, options?: NavigationOptions) => boolean;
  navigateToSibling: (direction: 'prev' | 'next', options?: NavigationOptions) => boolean;
  navigateDirection: (direction: NavigationDirection, options?: NavigationOptions) => boolean;
  
  // 키보드 네비게이션
  handleKeyboardNavigation: (event: KeyboardEvent) => boolean;
  
  // 히스토리 관리
  navigationHistory: NavigationHistoryItem[];
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => boolean;
  goForward: () => boolean;
  clearHistory: () => void;
  
  // 검색 기능
  searchBundles: (query: string, options?: SearchOptions) => SearchResult[];
  quickFind: (query: string) => NestedBundle | null;
  
  // 유틸리티
  getBundlePath: (bundleId: string) => BreadcrumbItem[];
  getRelativeBundles: (bundleId: string) => {
    parent: NestedBundle | null;
    siblings: NestedBundle[];
    children: NestedBundle[];
  };
  findShortestPath: (fromBundleId: string, toBundleId: string) => string[];
  
  // 상태 확인
  isNavigationPossible: (direction: NavigationDirection) => boolean;
  isInCurrentPath: (bundleId: string) => boolean;
  getDistanceFromCurrent: (bundleId: string) => number;
}

/**
 * Hook 옵션
 */
interface UseHierarchyNavigationOptions {
  /** 중첩 Bundle 데이터 */
  nestedBundles: NestedBundle[];
  
  /** 계층 노드 데이터 */
  hierarchyNodes: BundleHierarchyNode[];
  
  /** 초기 Bundle ID */
  initialBundleId?: string;
  
  /** 히스토리 최대 크기 */
  maxHistorySize?: number;
  
  /** 키보드 네비게이션 활성화 */
  enableKeyboardNavigation?: boolean;
  
  /** 이벤트 콜백들 */
  onNavigate?: (bundleId: string, previousBundleId: string | null) => void;
  onHistoryChange?: (history: NavigationHistoryItem[]) => void;
  onSearchResults?: (results: SearchResult[]) => void;
}

// ===== Hook 구현 =====

/**
 * 계층 구조 탐색 관리 Hook
 */
export const useHierarchyNavigation = (
  options: UseHierarchyNavigationOptions
): UseHierarchyNavigationResult => {
  const {
    nestedBundles,
    hierarchyNodes,
    initialBundleId,
    maxHistorySize = 50,
    enableKeyboardNavigation = true,
    onNavigate,
    onHistoryChange,
    onSearchResults
  } = options;

  // ===== 상태 관리 =====
  
  const [currentBundleId, setCurrentBundleId] = useState<string | null>(
    initialBundleId || (nestedBundles.length > 0 ? nestedBundles[0].id : null)
  );
  
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // ===== Refs =====
  
  const bundleMapRef = useRef<Map<string, NestedBundle>>(new Map());
  const hierarchyMapRef = useRef<Map<string, BundleHierarchyNode>>(new Map());
  const searchCacheRef = useRef<Map<string, SearchResult[]>>(new Map());

  // ===== 데이터 인덱싱 =====
  
  useEffect(() => {
    // Bundle 맵 생성
    const bundleMap = new Map<string, NestedBundle>();
    nestedBundles.forEach(bundle => {
      bundleMap.set(bundle.id, bundle);
    });
    bundleMapRef.current = bundleMap;

    // 계층 노드 맵 생성
    const hierarchyMap = new Map<string, BundleHierarchyNode>();
    hierarchyNodes.forEach(node => {
      hierarchyMap.set(node.bundleId, node);
    });
    hierarchyMapRef.current = hierarchyMap;

    // 검색 캐시 초기화
    searchCacheRef.current.clear();
  }, [nestedBundles, hierarchyNodes]);

  // ===== 현재 상태 계산 =====
  
  const currentBundle = useMemo(() => {
    return currentBundleId ? bundleMapRef.current.get(currentBundleId) || null : null;
  }, [currentBundleId]);

  const currentHierarchyNode = useMemo(() => {
    return currentBundleId ? hierarchyMapRef.current.get(currentBundleId) || null : null;
  }, [currentBundleId]);

  // ===== 계층 관계 계산 =====
  
  const parentBundle = useMemo(() => {
    if (!currentHierarchyNode?.parentId) return null;
    return bundleMapRef.current.get(currentHierarchyNode.parentId) || null;
  }, [currentHierarchyNode]);

  const siblingBundles = useMemo(() => {
    if (!currentHierarchyNode) return [];
    
    return hierarchyNodes
      .filter(node => 
        node.parentId === currentHierarchyNode.parentId && 
        node.bundleId !== currentBundleId
      )
      .map(node => bundleMapRef.current.get(node.bundleId))
      .filter((bundle): bundle is NestedBundle => bundle !== undefined);
  }, [currentHierarchyNode, currentBundleId, hierarchyNodes]);

  const childBundles = useMemo(() => {
    if (!currentBundleId) return [];
    
    return hierarchyNodes
      .filter(node => node.parentId === currentBundleId)
      .map(node => bundleMapRef.current.get(node.bundleId))
      .filter((bundle): bundle is NestedBundle => bundle !== undefined);
  }, [currentBundleId, hierarchyNodes]);

  // ===== 계층 통계 =====
  
  const hierarchyStats = useMemo((): HierarchyStats => {
    const currentDepth = currentHierarchyNode?.depth || 0;
    const maxDepth = Math.max(...hierarchyNodes.map(node => node.depth), 0);
    
    // 후손 Bundle 개수 계산
    const getDescendantCount = (bundleId: string): number => {
      const children = hierarchyNodes.filter(node => node.parentId === bundleId);
      return children.length + children.reduce((sum, child) => sum + getDescendantCount(child.bundleId), 0);
    };
    
    // 조상 Bundle 개수 계산
    const getAncestorCount = (bundleId: string): number => {
      const node = hierarchyMapRef.current.get(bundleId);
      if (!node?.parentId) return 0;
      return 1 + getAncestorCount(node.parentId);
    };

    return {
      totalBundles: nestedBundles.length,
      maxDepth,
      currentDepth,
      siblingCount: siblingBundles.length,
      childrenCount: childBundles.length,
      ancestorCount: currentBundleId ? getAncestorCount(currentBundleId) : 0,
      descendantCount: currentBundleId ? getDescendantCount(currentBundleId) : 0
    };
  }, [currentHierarchyNode, hierarchyNodes, nestedBundles, siblingBundles, childBundles, currentBundleId]);

  // ===== 브레드크럼 경로 =====
  
  const breadcrumbPath = useMemo((): BreadcrumbItem[] => {
    if (!currentBundleId || !currentHierarchyNode) return [];
    
    const path: BreadcrumbItem[] = [];
    let currentNode = currentHierarchyNode;
    
    // 현재 노드부터 루트까지 역순으로 수집
    const nodes: BundleHierarchyNode[] = [currentNode];
    while (currentNode.parentId) {
      const parentNode = hierarchyMapRef.current.get(currentNode.parentId);
      if (parentNode) {
        nodes.unshift(parentNode);
        currentNode = parentNode;
      } else {
        break;
      }
    }
    
    // 브레드크럼 항목 생성
    nodes.forEach((node, index) => {
      const bundle = bundleMapRef.current.get(node.bundleId);
      if (bundle) {
        path.push({
          bundleId: bundle.id,
          bundleName: bundle.name,
          depth: node.depth,
          isClickable: true,
          isCurrent: bundle.id === currentBundleId,
          path: node.path
        });
      }
    });
    
    return path;
  }, [currentBundleId, currentHierarchyNode]);

  // ===== 네비게이션 함수들 =====
  
  const addToNavigationHistory = useCallback((
    bundleId: string, 
    navigationType: NavigationHistoryItem['navigationType'] = 'programmatic'
  ) => {
    const bundle = bundleMapRef.current.get(bundleId);
    const node = hierarchyMapRef.current.get(bundleId);
    
    if (!bundle || !node) return;

    const historyItem: NavigationHistoryItem = {
      bundleId,
      bundleName: bundle.name,
      depth: node.depth,
      path: node.path,
      timestamp: Date.now(),
      navigationType
    };

    setNavigationHistory(prev => {
      // 현재 인덱스 이후의 히스토리 제거 (forward 히스토리 삭제)
      const newHistory = prev.slice(0, historyIndex + 1);
      
      // 새 항목 추가
      newHistory.push(historyItem);
      
      // 최대 크기 제한
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
    
    onHistoryChange?.(navigationHistory);
  }, [historyIndex, maxHistorySize, onHistoryChange, navigationHistory]);

  const navigateTo = useCallback((bundleId: string, options: NavigationOptions = {}): boolean => {
    const { addToHistory = true, setFocus = true } = options;
    
    // Bundle 존재 확인
    const targetBundle = bundleMapRef.current.get(bundleId);
    if (!targetBundle) {
      console.warn(`Bundle not found: ${bundleId}`);
      return false;
    }

    const previousBundleId = currentBundleId;
    
    // 상태 업데이트
    setCurrentBundleId(bundleId);
    
    // 히스토리 추가
    if (addToHistory) {
      addToNavigationHistory(bundleId, 'programmatic');
    }
    
    // 콜백 호출
    onNavigate?.(bundleId, previousBundleId);
    
    return true;
  }, [currentBundleId, addToNavigationHistory, onNavigate]);

  const navigateToParent = useCallback((options: NavigationOptions = {}): boolean => {
    if (!parentBundle) return false;
    return navigateTo(parentBundle.id, options);
  }, [parentBundle, navigateTo]);

  const navigateToChild = useCallback((childId: string, options: NavigationOptions = {}): boolean => {
    // 자식 Bundle 존재 확인
    const isChild = childBundles.some(child => child.id === childId);
    if (!isChild) return false;
    
    return navigateTo(childId, options);
  }, [childBundles, navigateTo]);

  const navigateToSibling = useCallback((
    direction: 'prev' | 'next', 
    options: NavigationOptions = {}
  ): boolean => {
    if (siblingBundles.length === 0) return false;
    
    // 현재 Bundle의 형제 중에서 위치 찾기
    const allSiblings = [...siblingBundles];
    if (currentBundle) {
      allSiblings.push(currentBundle);
    }
    
    // 깊이순, 이름순으로 정렬
    allSiblings.sort((a, b) => {
      const aNode = hierarchyMapRef.current.get(a.id);
      const bNode = hierarchyMapRef.current.get(b.id);
      if (aNode && bNode) {
        if (aNode.depth !== bNode.depth) {
          return aNode.depth - bNode.depth;
        }
      }
      return a.name.localeCompare(b.name);
    });
    
    const currentIndex = allSiblings.findIndex(bundle => bundle.id === currentBundleId);
    if (currentIndex === -1) return false;
    
    let targetIndex: number;
    if (direction === 'next') {
      targetIndex = (currentIndex + 1) % allSiblings.length;
    } else {
      targetIndex = currentIndex === 0 ? allSiblings.length - 1 : currentIndex - 1;
    }
    
    const targetBundle = allSiblings[targetIndex];
    return navigateTo(targetBundle.id, options);
  }, [siblingBundles, currentBundle, currentBundleId, navigateTo]);

  const navigateDirection = useCallback((
    direction: NavigationDirection, 
    options: NavigationOptions = {}
  ): boolean => {
    switch (direction) {
      case 'up':
      case 'parent':
        return navigateToParent(options);
      
      case 'down':
      case 'child':
        // 첫 번째 자식으로 이동
        if (childBundles.length > 0) {
          return navigateToChild(childBundles[0].id, options);
        }
        return false;
      
      case 'left':
        return navigateToSibling('prev', options);
      
      case 'right':
        return navigateToSibling('next', options);
      
      case 'sibling':
        return navigateToSibling('next', options);
      
      default:
        return false;
    }
  }, [navigateToParent, navigateToChild, navigateToSibling, childBundles]);

  // ===== 키보드 네비게이션 =====
  
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent): boolean => {
    if (!enableKeyboardNavigation) return false;
    
    let handled = false;
    
    // 수정자 키 확인
    const hasCtrl = event.ctrlKey || event.metaKey;
    const hasShift = event.shiftKey;
    const hasAlt = event.altKey;
    
    switch (event.key) {
      case 'ArrowUp':
        if (hasCtrl) {
          handled = navigateToParent();
        } else {
          handled = navigateToSibling('prev');
        }
        break;
      
      case 'ArrowDown':
        if (hasCtrl) {
          if (childBundles.length > 0) {
            handled = navigateToChild(childBundles[0].id);
          }
        } else {
          handled = navigateToSibling('next');
        }
        break;
      
      case 'ArrowLeft':
        handled = navigateToParent();
        break;
      
      case 'ArrowRight':
        if (childBundles.length > 0) {
          handled = navigateToChild(childBundles[0].id);
        }
        break;
      
      case 'Home':
        // 루트로 이동
        const rootBundles = hierarchyNodes.filter(node => node.depth === 0);
        if (rootBundles.length > 0) {
          handled = navigateTo(rootBundles[0].bundleId);
        }
        break;
      
      case 'End':
        // 마지막 Bundle로 이동
        if (nestedBundles.length > 0) {
          handled = navigateTo(nestedBundles[nestedBundles.length - 1].id);
        }
        break;
      
      case 'Backspace':
        if (hasCtrl) {
          handled = goBack();
        }
        break;
      
      case 'Enter':
        // 첫 번째 자식으로 이동하거나 토글
        if (childBundles.length > 0) {
          handled = navigateToChild(childBundles[0].id);
        }
        break;
    }
    
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    return handled;
  }, [
    enableKeyboardNavigation, 
    navigateToParent, 
    navigateToSibling, 
    navigateToChild, 
    childBundles, 
    hierarchyNodes, 
    nestedBundles, 
    navigateTo,
    goBack
  ]);

  // ===== 히스토리 관리 =====
  
  const canGoBack = useMemo(() => historyIndex > 0, [historyIndex]);
  const canGoForward = useMemo(() => historyIndex < navigationHistory.length - 1, [historyIndex, navigationHistory]);

  const goBack = useCallback((): boolean => {
    if (!canGoBack) return false;
    
    const newIndex = historyIndex - 1;
    const targetHistoryItem = navigationHistory[newIndex];
    
    setHistoryIndex(newIndex);
    setCurrentBundleId(targetHistoryItem.bundleId);
    
    onNavigate?.(targetHistoryItem.bundleId, currentBundleId);
    
    return true;
  }, [canGoBack, historyIndex, navigationHistory, currentBundleId, onNavigate]);

  const goForward = useCallback((): boolean => {
    if (!canGoForward) return false;
    
    const newIndex = historyIndex + 1;
    const targetHistoryItem = navigationHistory[newIndex];
    
    setHistoryIndex(newIndex);
    setCurrentBundleId(targetHistoryItem.bundleId);
    
    onNavigate?.(targetHistoryItem.bundleId, currentBundleId);
    
    return true;
  }, [canGoForward, historyIndex, navigationHistory, currentBundleId, onNavigate]);

  const clearHistory = useCallback(() => {
    setNavigationHistory([]);
    setHistoryIndex(-1);
    onHistoryChange?.([]);
  }, [onHistoryChange]);

  // ===== 검색 기능 =====
  
  const searchBundles = useCallback((query: string, options: SearchOptions = {}): SearchResult[] => {
    const {
      scope = 'all',
      caseSensitive = false,
      exactMatch = false,
      searchFields = ['name', 'id', 'path']
    } = options;
    
    // 캐시 확인
    const cacheKey = `${query}|${scope}|${caseSensitive}|${exactMatch}|${searchFields.join(',')}`;
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached) {
      onSearchResults?.(cached);
      return cached;
    }
    
    const results: SearchResult[] = [];
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    
    // 검색 대상 Bundle 필터링
    let targetBundles = nestedBundles;
    
    if (scope !== 'all' && currentBundleId) {
      switch (scope) {
        case 'current':
          targetBundles = nestedBundles.filter(bundle => bundle.id === currentBundleId);
          break;
        case 'children':
          targetBundles = childBundles;
          break;
        case 'descendants':
          // 현재 Bundle의 모든 후손 찾기
          const getDescendants = (bundleId: string): NestedBundle[] => {
            const children = hierarchyNodes
              .filter(node => node.parentId === bundleId)
              .map(node => bundleMapRef.current.get(node.bundleId))
              .filter((bundle): bundle is NestedBundle => bundle !== undefined);
            
            return children.concat(children.flatMap(child => getDescendants(child.id)));
          };
          targetBundles = getDescendants(currentBundleId);
          break;
        case 'siblings':
          targetBundles = siblingBundles;
          break;
      }
    }
    
    // 각 Bundle에서 검색
    targetBundles.forEach(bundle => {
      const node = hierarchyMapRef.current.get(bundle.id);
      if (!node) return;
      
      searchFields.forEach(field => {
        let searchText = '';
        let fieldValue = '';
        
        switch (field) {
          case 'name':
            fieldValue = bundle.name;
            break;
          case 'id':
            fieldValue = bundle.id;
            break;
          case 'path':
            fieldValue = node.path;
            break;
          case 'metadata':
            fieldValue = JSON.stringify(node.metadata);
            break;
        }
        
        searchText = caseSensitive ? fieldValue : fieldValue.toLowerCase();
        
        let isMatch = false;
        let matchedText = '';
        
        if (exactMatch) {
          isMatch = searchText === searchQuery;
          matchedText = isMatch ? fieldValue : '';
        } else {
          const matchIndex = searchText.indexOf(searchQuery);
          isMatch = matchIndex !== -1;
          if (isMatch) {
            matchedText = fieldValue.substring(matchIndex, matchIndex + query.length);
          }
        }
        
        if (isMatch) {
          // 점수 계산 (정확도 기반)
          let score = 1;
          if (exactMatch) {
            score = 100;
          } else {
            // 매치 위치와 길이 기반 점수
            const matchPosition = searchText.indexOf(searchQuery);
            const lengthRatio = query.length / searchText.length;
            score = (1 - matchPosition / searchText.length) * 50 + lengthRatio * 50;
          }
          
          results.push({
            bundleId: bundle.id,
            bundleName: bundle.name,
            path: node.path,
            depth: node.depth,
            matchType: field,
            matchedText,
            score
          });
        }
      });
    });
    
    // 점수 순으로 정렬
    results.sort((a, b) => b.score - a.score);
    
    // 캐시 저장
    searchCacheRef.current.set(cacheKey, results);
    
    onSearchResults?.(results);
    return results;
  }, [nestedBundles, currentBundleId, childBundles, hierarchyNodes, siblingBundles, onSearchResults]);

  const quickFind = useCallback((query: string): NestedBundle | null => {
    const results = searchBundles(query, { exactMatch: false, searchFields: ['name'] });
    return results.length > 0 ? bundleMapRef.current.get(results[0].bundleId) || null : null;
  }, [searchBundles]);

  // ===== 유틸리티 함수들 =====
  
  const getBundlePath = useCallback((bundleId: string): BreadcrumbItem[] => {
    const node = hierarchyMapRef.current.get(bundleId);
    if (!node) return [];
    
    const path: BreadcrumbItem[] = [];
    let currentNode = node;
    
    // 현재 노드부터 루트까지 역순으로 수집
    const nodes: BundleHierarchyNode[] = [currentNode];
    while (currentNode.parentId) {
      const parentNode = hierarchyMapRef.current.get(currentNode.parentId);
      if (parentNode) {
        nodes.unshift(parentNode);
        currentNode = parentNode;
      } else {
        break;
      }
    }
    
    // 브레드크럼 항목 생성
    nodes.forEach((n, index) => {
      const bundle = bundleMapRef.current.get(n.bundleId);
      if (bundle) {
        path.push({
          bundleId: bundle.id,
          bundleName: bundle.name,
          depth: n.depth,
          isClickable: true,
          isCurrent: bundle.id === bundleId,
          path: n.path
        });
      }
    });
    
    return path;
  }, []);

  const getRelativeBundles = useCallback((bundleId: string) => {
    const node = hierarchyMapRef.current.get(bundleId);
    if (!node) {
      return { parent: null, siblings: [], children: [] };
    }
    
    const parent = node.parentId ? bundleMapRef.current.get(node.parentId) || null : null;
    
    const siblings = hierarchyNodes
      .filter(n => n.parentId === node.parentId && n.bundleId !== bundleId)
      .map(n => bundleMapRef.current.get(n.bundleId))
      .filter((bundle): bundle is NestedBundle => bundle !== undefined);
    
    const children = hierarchyNodes
      .filter(n => n.parentId === bundleId)
      .map(n => bundleMapRef.current.get(n.bundleId))
      .filter((bundle): bundle is NestedBundle => bundle !== undefined);
    
    return { parent, siblings, children };
  }, [hierarchyNodes]);

  const findShortestPath = useCallback((fromBundleId: string, toBundleId: string): string[] => {
    if (fromBundleId === toBundleId) return [fromBundleId];
    
    // BFS를 사용한 최단 경로 탐색
    const queue: { bundleId: string; path: string[] }[] = [{ bundleId: fromBundleId, path: [fromBundleId] }];
    const visited = new Set<string>([fromBundleId]);
    
    while (queue.length > 0) {
      const { bundleId, path } = queue.shift()!;
      
      // 인접한 Bundle들 (부모, 자식, 형제)
      const relatives = getRelativeBundles(bundleId);
      const adjacentBundles = [
        relatives.parent,
        ...relatives.siblings,
        ...relatives.children
      ].filter((bundle): bundle is NestedBundle => bundle !== null);
      
      for (const adjacentBundle of adjacentBundles) {
        if (adjacentBundle.id === toBundleId) {
          return [...path, adjacentBundle.id];
        }
        
        if (!visited.has(adjacentBundle.id)) {
          visited.add(adjacentBundle.id);
          queue.push({
            bundleId: adjacentBundle.id,
            path: [...path, adjacentBundle.id]
          });
        }
      }
    }
    
    return []; // 경로 없음
  }, [getRelativeBundles]);

  // ===== 상태 확인 유틸리티 =====
  
  const isNavigationPossible = useCallback((direction: NavigationDirection): boolean => {
    switch (direction) {
      case 'up':
      case 'parent':
        return parentBundle !== null;
      
      case 'down':
      case 'child':
        return childBundles.length > 0;
      
      case 'left':
      case 'right':
      case 'sibling':
        return siblingBundles.length > 0;
      
      default:
        return false;
    }
  }, [parentBundle, childBundles, siblingBundles]);

  const isInCurrentPath = useCallback((bundleId: string): boolean => {
    return breadcrumbPath.some(item => item.bundleId === bundleId);
  }, [breadcrumbPath]);

  const getDistanceFromCurrent = useCallback((bundleId: string): number => {
    if (!currentBundleId) return Infinity;
    
    const path = findShortestPath(currentBundleId, bundleId);
    return path.length - 1; // 자기 자신은 제외
  }, [currentBundleId, findShortestPath]);

  // ===== 키보드 이벤트 리스너 설정 =====
  
  useEffect(() => {
    if (!enableKeyboardNavigation) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // 입력 필드에서는 키보드 네비게이션 비활성화
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      handleKeyboardNavigation(event);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardNavigation, handleKeyboardNavigation]);

  // ===== 반환 =====
  
  return {
    // 현재 상태
    currentBundleId,
    currentBundle,
    currentHierarchyNode,
    
    // 계층 정보
    hierarchyStats,
    breadcrumbPath,
    parentBundle,
    siblingBundles,
    childBundles,
    
    // 네비게이션 액션
    navigateTo,
    navigateToParent,
    navigateToChild,
    navigateToSibling,
    navigateDirection,
    
    // 키보드 네비게이션
    handleKeyboardNavigation,
    
    // 히스토리 관리
    navigationHistory,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    clearHistory,
    
    // 검색 기능
    searchBundles,
    quickFind,
    
    // 유틸리티
    getBundlePath,
    getRelativeBundles,
    findShortestPath,
    
    // 상태 확인
    isNavigationPossible,
    isInCurrentPath,
    getDistanceFromCurrent
  };
};

export default useHierarchyNavigation;
