/**
 * @fileoverview 계층 구조 탐색 컴포넌트
 * @description Bundle 계층 구조를 탐색하고 빠른 이동을 지원하는 네비게이터
 * @version 1.0.0
 * @created 2025-06-22
 */

import React, { useMemo, useState, useCallback } from 'react';
import { NestedBundle, BundleHierarchyNode } from '../../../types/nested';

interface HierarchyNavigatorProps {
  /** 현재 Bundle */
  currentBundle: NestedBundle;
  
  /** 현재 계층 노드 */
  currentHierarchyNode: BundleHierarchyNode;
  
  /** 전체 Bundle 목록 (탐색용) */
  allBundles: NestedBundle[];
  
  /** 전체 계층 노드 목록 */
  allHierarchyNodes: BundleHierarchyNode[];
  
  /** Bundle 이동 핸들러 */
  onNavigateToBundle: (bundleId: string) => void;
  
  /** 부모로 이동 핸들러 */
  onNavigateToParent?: () => void;
  
  /** 자식으로 이동 핸들러 */
  onNavigateToChild?: (childId: string) => void;
  
  /** 형제로 이동 핸들러 */
  onNavigateToSibling?: (siblingId: string) => void;
  
  /** 스타일 옵션 */
  variant?: 'breadcrumb' | 'dropdown' | 'sidebar' | 'compact';
  
  /** 표시 옵션 */
  showDepthIndicator?: boolean;
  showShortcuts?: boolean;
  showHistory?: boolean;
  
  /** 최대 표시 깊이 */
  maxDisplayDepth?: number;
}

/**
 * 계층 경로 항목
 */
interface HierarchyPathItem {
  bundleId: string;
  bundleName: string;
  depth: number;
  isClickable: boolean;
  isCurrent: boolean;
  icon: string;
  color: string;
}

/**
 * 탐색 히스토리 항목
 */
interface NavigationHistoryItem {
  bundleId: string;
  bundleName: string;
  visitedAt: number;
  path: string;
}

/**
 * 계층 구조 통계
 */
interface HierarchyStats {
  totalBundles: number;
  maxDepth: number;
  currentDepth: number;
  siblingCount: number;
  childrenCount: number;
  ancestorCount: number;
}

/**
 * 깊이별 색상 계산
 */
const getDepthColor = (depth: number): string => {
  const hue = (220 + (depth * 30)) % 360;
  const saturation = Math.max(40, 70 - (depth * 10));
  const lightness = Math.max(45, 60 - (depth * 5));
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Bundle 아이콘 계산
 */
const getBundleIcon = (depth: number): string => {
  const icons = ['📦', '📋', '📄', '🔸', '🔹', '⚪', '⚫'];
  return icons[depth % icons.length];
};

/**
 * 브레드크럼 스타일 네비게이터
 */
const BreadcrumbNavigator: React.FC<{
  pathItems: HierarchyPathItem[];
  onNavigate: (bundleId: string) => void;
  showDepthIndicator: boolean;
}> = ({ pathItems, onNavigate, showDepthIndicator }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 12px',
        background: 'linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%)',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        overflow: 'auto',
        maxWidth: '100%'
      }}
    >
      {/* 홈 버튼 */}
      <button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '4px',
          color: '#666',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s ease'
        }}
        onClick={() => {
          const rootItem = pathItems.find(item => item.depth === 0);
          if (rootItem) onNavigate(rootItem.bundleId);
        }}
        title="루트로 이동"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        🏠
      </button>

      {/* 구분자 */}
      <span style={{ color: '#ccc', fontSize: '12px' }}>▶</span>

      {/* 경로 항목들 */}
      {pathItems.map((item, index) => (
        <React.Fragment key={item.bundleId}>
          {index > 0 && (
            <span style={{ color: '#ccc', fontSize: '10px', margin: '0 2px' }}>
              ▶
            </span>
          )}
          
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: item.isCurrent ? `${item.color}20` : 'transparent',
              border: item.isCurrent ? `1px solid ${item.color}40` : '1px solid transparent',
              cursor: item.isClickable ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onClick={() => {
              if (item.isClickable) onNavigate(item.bundleId);
            }}
            onMouseEnter={(e) => {
              if (item.isClickable) {
                e.currentTarget.style.backgroundColor = `${item.color}30`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = item.isCurrent ? `${item.color}20` : 'transparent';
            }}
          >
            {/* 깊이 인디케이터 */}
            {showDepthIndicator && (
              <span
                style={{
                  fontSize: '8px',
                  color: item.color,
                  fontWeight: 'bold',
                  backgroundColor: `${item.color}15`,
                  padding: '1px 4px',
                  borderRadius: '3px',
                  minWidth: '16px',
                  textAlign: 'center'
                }}
              >
                {item.depth}
              </span>
            )}

            {/* 아이콘 */}
            <span style={{ fontSize: '12px' }}>
              {item.icon}
            </span>

            {/* 이름 */}
            <span
              style={{
                fontSize: '12px',
                fontWeight: item.isCurrent ? 'bold' : 'normal',
                color: item.isCurrent ? item.color : '#333',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.bundleName}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * 사이드바 스타일 네비게이터
 */
const SidebarNavigator: React.FC<{
  currentBundle: NestedBundle;
  stats: HierarchyStats;
  siblings: NestedBundle[];
  children: NestedBundle[];
  onNavigate: (bundleId: string) => void;
  onNavigateToParent?: () => void;
}> = ({ currentBundle, stats, siblings, children, onNavigate, onNavigateToParent }) => {
  return (
    <div
      style={{
        width: '250px',
        background: 'white',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* 현재 Bundle 정보 */}
      <div
        style={{
          padding: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          color: 'white',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '16px' }}>{getBundleIcon(stats.currentDepth)}</span>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {currentBundle.name}
          </span>
        </div>
        <div style={{ fontSize: '11px', opacity: 0.9, lineHeight: '1.4' }}>
          <div>깊이: {stats.currentDepth}/{stats.maxDepth}</div>
          <div>요소: {currentBundle.elements.length}개</div>
          <div>자식: {stats.childrenCount}개</div>
        </div>
      </div>

      {/* 네비게이션 버튼들 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {/* 부모로 이동 */}
        {onNavigateToParent && stats.currentDepth > 0 && (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onClick={onNavigateToParent}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 147, 251, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>⬆️</span>
            <span>부모로 이동</span>
          </button>
        )}
      </div>

      {/* 형제 Bundle들 */}
      {siblings.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>👥</span>
            <span>형제 Bundle ({siblings.length}개)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {siblings.slice(0, 5).map(sibling => (
              <button
                key={sibling.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  background: sibling.id === currentBundle.id ? '#f0f0f0' : 'transparent',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => onNavigate(sibling.id)}
                disabled={sibling.id === currentBundle.id}
                onMouseEnter={(e) => {
                  if (sibling.id !== currentBundle.id) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sibling.id !== currentBundle.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{getBundleIcon(stats.currentDepth)}</span>
                <span style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {sibling.name}
                </span>
                {sibling.id === currentBundle.id && (
                  <span style={{ color: '#007bff', fontSize: '10px' }}>●</span>
                )}
              </button>
            ))}
            {siblings.length > 5 && (
              <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', padding: '4px' }}>
                +{siblings.length - 5}개 더
              </div>
            )}
          </div>
        </div>
      )}

      {/* 자식 Bundle들 */}
      {children.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>👶</span>
            <span>자식 Bundle ({children.length}개)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {children.slice(0, 5).map(child => (
              <button
                key={child.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => onNavigate(child.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{getBundleIcon(stats.currentDepth + 1)}</span>
                <span style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {child.name}
                </span>
                <span style={{ color: '#28a745', fontSize: '9px' }}>▶</span>
              </button>
            ))}
            {children.length > 5 && (
              <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', padding: '4px' }}>
                +{children.length - 5}개 더
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 계층 구조 탐색 컴포넌트
 */
export const HierarchyNavigator: React.FC<HierarchyNavigatorProps> = ({
  currentBundle,
  currentHierarchyNode,
  allBundles,
  allHierarchyNodes,
  onNavigateToBundle,
  onNavigateToParent,
  onNavigateToChild,
  onNavigateToSibling,
  variant = 'breadcrumb',
  showDepthIndicator = true,
  showShortcuts = true,
  showHistory = false,
  maxDisplayDepth = 10
}) => {
  // 상태 관리
  const [isExpanded, setIsExpanded] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([]);

  // 계층 경로 계산
  const hierarchyPath = useMemo((): HierarchyPathItem[] => {
    const path: HierarchyPathItem[] = [];
    let currentNode = currentHierarchyNode;
    
    // 현재 노드부터 루트까지 역순으로 수집
    const nodes: BundleHierarchyNode[] = [currentNode];
    while (currentNode.parentId) {
      const parentNode = allHierarchyNodes.find(node => node.bundleId === currentNode.parentId);
      if (parentNode) {
        nodes.unshift(parentNode);
        currentNode = parentNode;
      } else {
        break;
      }
    }
    
    // 경로 항목 생성
    nodes.forEach((node, index) => {
      const bundle = allBundles.find(b => b.id === node.bundleId);
      if (bundle) {
        path.push({
          bundleId: bundle.id,
          bundleName: bundle.name,
          depth: node.depth,
          isClickable: true,
          isCurrent: bundle.id === currentBundle.id,
          icon: getBundleIcon(node.depth),
          color: getDepthColor(node.depth)
        });
      }
    });
    
    return path;
  }, [currentBundle, currentHierarchyNode, allBundles, allHierarchyNodes]);

  // 계층 구조 통계 계산
  const hierarchyStats = useMemo((): HierarchyStats => {
    const siblings = allBundles.filter(bundle => {
      const node = allHierarchyNodes.find(n => n.bundleId === bundle.id);
      return node && node.parentId === currentHierarchyNode.parentId && bundle.id !== currentBundle.id;
    });

    const children = allBundles.filter(bundle => {
      const node = allHierarchyNodes.find(n => n.bundleId === bundle.id);
      return node && node.parentId === currentBundle.id;
    });

    const ancestors = hierarchyPath.length - 1; // 현재 Bundle 제외

    return {
      totalBundles: allBundles.length,
      maxDepth: Math.max(...allHierarchyNodes.map(node => node.depth)),
      currentDepth: currentHierarchyNode.depth,
      siblingCount: siblings.length,
      childrenCount: children.length,
      ancestorCount: ancestors
    };
  }, [currentBundle, currentHierarchyNode, allBundles, allHierarchyNodes, hierarchyPath]);

  // 형제 및 자식 Bundle 목록
  const siblingBundles = useMemo(() => {
    return allBundles.filter(bundle => {
      const node = allHierarchyNodes.find(n => n.bundleId === bundle.id);
      return node && node.parentId === currentHierarchyNode.parentId;
    });
  }, [allBundles, allHierarchyNodes, currentHierarchyNode.parentId]);

  const childBundles = useMemo(() => {
    return allBundles.filter(bundle => {
      const node = allHierarchyNodes.find(n => n.bundleId === bundle.id);
      return node && node.parentId === currentBundle.id;
    });
  }, [allBundles, allHierarchyNodes, currentBundle.id]);

  // 네비게이션 핸들러
  const handleNavigate = useCallback((bundleId: string) => {
    // 히스토리 추가
    if (showHistory) {
      const historyItem: NavigationHistoryItem = {
        bundleId: currentBundle.id,
        bundleName: currentBundle.name,
        visitedAt: Date.now(),
        path: currentHierarchyNode.path
      };
      setNavigationHistory(prev => [historyItem, ...prev.slice(0, 9)]);
    }
    
    onNavigateToBundle(bundleId);
  }, [currentBundle, currentHierarchyNode, showHistory, onNavigateToBundle]);

  // 렌더링
  switch (variant) {
    case 'sidebar':
      return (
        <SidebarNavigator
          currentBundle={currentBundle}
          stats={hierarchyStats}
          siblings={siblingBundles}
          children={childBundles}
          onNavigate={handleNavigate}
          onNavigateToParent={onNavigateToParent}
        />
      );

    case 'compact':
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e1e5e9',
            borderRadius: '6px',
            fontSize: '11px'
          }}
        >
          <span>{getBundleIcon(currentHierarchyNode.depth)}</span>
          <span style={{ fontWeight: 'bold' }}>{currentBundle.name}</span>
          <span style={{ color: '#666' }}>({hierarchyStats.currentDepth})</span>
          {hierarchyStats.childrenCount > 0 && (
            <span style={{ color: '#28a745', fontSize: '9px' }}>
              +{hierarchyStats.childrenCount}
            </span>
          )}
        </div>
      );

    case 'dropdown':
      return (
        <div style={{ position: 'relative' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'white',
              border: '1px solid #e1e5e9',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>{getBundleIcon(currentHierarchyNode.depth)}</span>
            <span>{currentBundle.name}</span>
            <span style={{ color: '#666' }}>{isExpanded ? '▲' : '▼'}</span>
          </button>
          
          {isExpanded && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '200px'
              }}
            >
              <BreadcrumbNavigator
                pathItems={hierarchyPath}
                onNavigate={handleNavigate}
                showDepthIndicator={showDepthIndicator}
              />
            </div>
          )}
        </div>
      );

    case 'breadcrumb':
    default:
      return (
        <BreadcrumbNavigator
          pathItems={hierarchyPath}
          onNavigate={handleNavigate}
          showDepthIndicator={showDepthIndicator}
        />
      );
  }
};

export default HierarchyNavigator;
