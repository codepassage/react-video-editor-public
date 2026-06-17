/**
 * @fileoverview 중첩 Bundle UI 컴포넌트 통합 인덱스
 * @description 계층적 Bundle 시각화를 위한 모든 UI 컴포넌트들의 진입점
 * @version 1.0.0
 * @created 2025-06-22
 */

// ===== 메인 컴포넌트들 =====
export { NestedBundleContainer } from './NestedBundleContainer';
export { BundleHierarchyTree } from './BundleHierarchyTree';
export { HierarchyNavigator } from './HierarchyNavigator';
export { DepthIndicator, createDepthIndicator } from './DepthIndicator';
export { RelationshipConnector, createRelationshipConnector } from './RelationshipConnector';

// ===== 타입 정의들 =====
export type {
  NestedBundleContainerProps
} from './NestedBundleContainer';

export type {
  BundleHierarchyTreeProps
} from './BundleHierarchyTree';

export type {
  HierarchyNavigatorProps
} from './HierarchyNavigator';

export type {
  DepthIndicatorProps
} from './DepthIndicator';

export type {
  RelationshipConnectorProps
} from './RelationshipConnector';

// ===== 유틸리티 컴포넌트 팩토리 =====

import React from 'react';
import { NestedBundle, BundleHierarchyNode } from '../../../types/nested';
import { TimelineTrack } from '../../../types';
import { NestedBundleContainer } from './NestedBundleContainer';
import { BundleHierarchyTree } from './BundleHierarchyTree';
import { HierarchyNavigator } from './HierarchyNavigator';

/**
 * 완전한 중첩 Bundle 시각화 시스템을 생성하는 팩토리 함수
 */
export const createNestedBundleVisualization = (config: {
  /** 중첩 Bundle 데이터 */
  nestedBundle: NestedBundle;
  
  /** 계층 노드 정보 */
  hierarchyNode: BundleHierarchyNode;
  
  /** 자식 Bundle들 */
  childBundles?: NestedBundle[];
  
  /** 전체 Bundle 목록 */
  allBundles: NestedBundle[];
  
  /** 전체 계층 노드 목록 */
  allHierarchyNodes: BundleHierarchyNode[];
  
  /** 타임라인 트랙들 */
  tracks: TimelineTrack[];
  
  /** 줌 레벨 */
  zoom: number;
  
  /** 트랙 높이 */
  trackHeight: number;
  
  /** 이벤트 핸들러들 */
  eventHandlers: {
    onBundleSelect: (bundleId: string) => void;
    onBundleMove?: (bundleId: string, deltaTime: number) => void;
    onToggleExpand: (bundleId: string) => void;
    onNavigateToBundle: (bundleId: string) => void;
    onNavigateToChild?: (childId: string) => void;
    onElementSelect?: (elementId: string, elementType: string) => void;
  };
  
  /** UI 설정 */
  uiConfig?: {
    showDepthIndicator?: boolean;
    showRelationshipConnectors?: boolean;
    showHierarchyTree?: boolean;
    showNavigator?: boolean;
    navigatorVariant?: 'breadcrumb' | 'dropdown' | 'sidebar' | 'compact';
    compactMode?: boolean;
  };
}) => {
  const {
    nestedBundle,
    hierarchyNode,
    childBundles = [],
    allBundles,
    allHierarchyNodes,
    tracks,
    zoom,
    trackHeight,
    eventHandlers,
    uiConfig = {}
  } = config;

  const {
    showDepthIndicator = true,
    showRelationshipConnectors = true,
    showHierarchyTree = false,
    showNavigator = true,
    navigatorVariant = 'breadcrumb',
    compactMode = false
  } = uiConfig;

  return {
    /**
     * 메인 Bundle 컨테이너 컴포넌트
     */
    BundleContainer: (
      <NestedBundleContainer
        nestedBundle={nestedBundle}
        hierarchyNode={hierarchyNode}
        childBundles={childBundles}
        tracks={tracks}
        zoom={zoom}
        trackHeight={trackHeight}
        isSelected={false}
        isExpanded={true}
        onBundleSelect={eventHandlers.onBundleSelect}
        onBundleMove={eventHandlers.onBundleMove}
        onToggleExpand={eventHandlers.onToggleExpand}
        onNavigateToChild={eventHandlers.onNavigateToChild}
      />
    ),

    /**
     * 계층 구조 네비게이터 컴포넌트
     */
    Navigator: showNavigator ? (
      <HierarchyNavigator
        currentBundle={nestedBundle}
        currentHierarchyNode={hierarchyNode}
        allBundles={allBundles}
        allHierarchyNodes={allHierarchyNodes}
        onNavigateToBundle={eventHandlers.onNavigateToBundle}
        onNavigateToChild={eventHandlers.onNavigateToChild}
        variant={navigatorVariant}
        showDepthIndicator={showDepthIndicator}
      />
    ) : null,

    /**
     * 계층 구조 트리 컴포넌트
     */
    HierarchyTree: showHierarchyTree ? (
      <BundleHierarchyTree
        nestedBundle={nestedBundle}
        hierarchyNode={hierarchyNode}
        childBundles={childBundles}
        onNavigateToChild={eventHandlers.onNavigateToChild}
        onElementSelect={eventHandlers.onElementSelect}
        compact={compactMode}
      />
    ) : null,

    /**
     * 통합 컨테이너 (모든 컴포넌트 포함)
     */
    FullVisualization: (
      <div className="nested-bundle-visualization" style={{ position: 'relative' }}>
        {/* 네비게이터 */}
        {showNavigator && (
          <div style={{ marginBottom: '8px' }}>
            <HierarchyNavigator
              currentBundle={nestedBundle}
              currentHierarchyNode={hierarchyNode}
              allBundles={allBundles}
              allHierarchyNodes={allHierarchyNodes}
              onNavigateToBundle={eventHandlers.onNavigateToBundle}
              onNavigateToChild={eventHandlers.onNavigateToChild}
              variant={navigatorVariant}
              showDepthIndicator={showDepthIndicator}
            />
          </div>
        )}

        {/* 메인 Bundle 컨테이너 */}
        <NestedBundleContainer
          nestedBundle={nestedBundle}
          hierarchyNode={hierarchyNode}
          childBundles={childBundles}
          tracks={tracks}
          zoom={zoom}
          trackHeight={trackHeight}
          isSelected={false}
          isExpanded={true}
          onBundleSelect={eventHandlers.onBundleSelect}
          onBundleMove={eventHandlers.onBundleMove}
          onToggleExpand={eventHandlers.onToggleExpand}
          onNavigateToChild={eventHandlers.onNavigateToChild}
        />

        {/* 계층 구조 트리 (토글 가능) */}
        {showHierarchyTree && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              marginTop: '8px',
              zIndex: 1000
            }}
          >
            <BundleHierarchyTree
              nestedBundle={nestedBundle}
              hierarchyNode={hierarchyNode}
              childBundles={childBundles}
              onNavigateToChild={eventHandlers.onNavigateToChild}
              onElementSelect={eventHandlers.onElementSelect}
              compact={compactMode}
            />
          </div>
        )}
      </div>
    )
  };
};

/**
 * Bundle 계층 구조 분석 유틸리티
 */
export const analyzeBundleHierarchy = (
  bundles: NestedBundle[],
  hierarchyNodes: BundleHierarchyNode[]
) => {
  const stats = {
    totalBundles: bundles.length,
    maxDepth: Math.max(...hierarchyNodes.map(node => node.depth), 0),
    avgDepth: hierarchyNodes.reduce((sum, node) => sum + node.depth, 0) / hierarchyNodes.length,
    rootBundles: hierarchyNodes.filter(node => node.depth === 0).length,
    leafBundles: hierarchyNodes.filter(node => 
      !hierarchyNodes.some(other => other.parentId === node.bundleId)
    ).length,
    totalElements: bundles.reduce((sum, bundle) => sum + bundle.elements.length, 0)
  };

  const depthDistribution: Record<number, number> = {};
  hierarchyNodes.forEach(node => {
    depthDistribution[node.depth] = (depthDistribution[node.depth] || 0) + 1;
  });

  return {
    ...stats,
    depthDistribution,
    complexityScore: Math.min(100, 
      (stats.maxDepth * 15) + 
      (stats.totalBundles * 2) + 
      (stats.totalElements * 0.5)
    )
  };
};

/**
 * 중첩 Bundle 성능 모니터링 유틸리티
 */
export const createNestedBundlePerformanceMonitor = () => {
  const metrics = {
    renderTimes: [] as number[],
    interactionTimes: [] as number[],
    memoryUsage: [] as number[],
    cacheHitRate: 0,
    totalInteractions: 0
  };

  return {
    /**
     * 렌더링 시간 측정 시작
     */
    startRenderMeasure: () => {
      return performance.now();
    },

    /**
     * 렌더링 시간 측정 종료
     */
    endRenderMeasure: (startTime: number) => {
      const renderTime = performance.now() - startTime;
      metrics.renderTimes.push(renderTime);
      if (metrics.renderTimes.length > 100) {
        metrics.renderTimes.shift();
      }
      return renderTime;
    },

    /**
     * 상호작용 시간 측정
     */
    measureInteraction: (interactionFn: () => void) => {
      const startTime = performance.now();
      interactionFn();
      const interactionTime = performance.now() - startTime;
      metrics.interactionTimes.push(interactionTime);
      metrics.totalInteractions++;
      if (metrics.interactionTimes.length > 50) {
        metrics.interactionTimes.shift();
      }
      return interactionTime;
    },

    /**
     * 메모리 사용량 측정
     */
    measureMemoryUsage: () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / 1024 / 1024; // MB 단위
        metrics.memoryUsage.push(usage);
        if (metrics.memoryUsage.length > 20) {
          metrics.memoryUsage.shift();
        }
        return usage;
      }
      return 0;
    },

    /**
     * 성능 리포트 생성
     */
    getPerformanceReport: () => {
      const avgRenderTime = metrics.renderTimes.length > 0 ?
        metrics.renderTimes.reduce((sum, time) => sum + time, 0) / metrics.renderTimes.length : 0;
      
      const avgInteractionTime = metrics.interactionTimes.length > 0 ?
        metrics.interactionTimes.reduce((sum, time) => sum + time, 0) / metrics.interactionTimes.length : 0;
      
      const avgMemoryUsage = metrics.memoryUsage.length > 0 ?
        metrics.memoryUsage.reduce((sum, usage) => sum + usage, 0) / metrics.memoryUsage.length : 0;

      return {
        avgRenderTime: Number(avgRenderTime.toFixed(2)),
        maxRenderTime: Math.max(...metrics.renderTimes, 0),
        avgInteractionTime: Number(avgInteractionTime.toFixed(2)),
        maxInteractionTime: Math.max(...metrics.interactionTimes, 0),
        avgMemoryUsage: Number(avgMemoryUsage.toFixed(2)),
        totalInteractions: metrics.totalInteractions,
        performanceScore: Math.max(0, 100 - (avgRenderTime + avgInteractionTime) / 2)
      };
    },

    /**
     * 메트릭 리셋
     */
    resetMetrics: () => {
      metrics.renderTimes = [];
      metrics.interactionTimes = [];
      metrics.memoryUsage = [];
      metrics.totalInteractions = 0;
      metrics.cacheHitRate = 0;
    }
  };
};

/**
 * 기본 export - 주요 컴포넌트들
 */
export default {
  NestedBundleContainer,
  BundleHierarchyTree,
  HierarchyNavigator,
  DepthIndicator,
  RelationshipConnector,
  createNestedBundleVisualization,
  analyzeBundleHierarchy,
  createNestedBundlePerformanceMonitor
};
