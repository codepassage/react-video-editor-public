/**
 * @fileoverview Bundle 계층 구조 트리 컴포넌트
 * @description Bundle의 중첩 구조를 트리 형태로 표시하고 탐색 기능을 제공
 * @version 1.0.0
 * @created 2025-06-22
 */

import React, { useState, useMemo, useCallback } from 'react';
import { NestedBundle, BundleElement, BundleHierarchyNode } from '../../../types/nested';

interface BundleHierarchyTreeProps {
  /** 현재 중첩 Bundle */
  nestedBundle: NestedBundle;
  
  /** 계층 노드 정보 */
  hierarchyNode: BundleHierarchyNode;
  
  /** 자식 Bundle들 */
  childBundles?: NestedBundle[];
  
  /** 자식 노드 탐색 핸들러 */
  onNavigateToChild?: (childId: string) => void;
  
  /** 요소 선택 핸들러 */
  onElementSelect?: (elementId: string, elementType: string) => void;
  
  /** 스타일 옵션 */
  style?: React.CSSProperties;
  
  /** 컴팩트 모드 */
  compact?: boolean;
  
  /** 최대 표시 깊이 */
  maxDisplayDepth?: number;
  
  /** 검색 필터 */
  searchFilter?: string;
}

/**
 * 트리 노드 데이터
 */
interface TreeNode {
  id: string;
  name: string;
  type: 'bundle' | 'element' | 'baseClip' | 'templateGroup' | 'nestedBundle';
  depth: number;
  children: TreeNode[];
  metadata?: any;
  isExpanded?: boolean;
  isSelected?: boolean;
  parentId?: string;
  icon: string;
  color?: string;
  timeInfo?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

/**
 * 시간 포맷팅
 */
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
};

/**
 * 트리 노드 아이콘 가져오기
 */
const getNodeIcon = (type: TreeNode['type'], depth: number): string => {
  switch (type) {
    case 'bundle':
      return '📦';
    case 'nestedBundle':
      return `📦${'◆'.repeat(Math.min(depth, 3))}`;
    case 'templateGroup':
      return '📋';
    case 'baseClip':
      return '🎬';
    case 'element':
      return '🔸';
    default:
      return '📄';
  }
};

/**
 * 트리 노드 색상 계산
 */
const getNodeColor = (type: TreeNode['type'], depth: number): string => {
  const baseHue = {
    'bundle': 220,
    'nestedBundle': 200,
    'templateGroup': 280,
    'baseClip': 120,
    'element': 60
  }[type] || 0;
  
  const hue = (baseHue + (depth * 20)) % 360;
  const saturation = Math.max(40, 70 - (depth * 10));
  const lightness = Math.max(45, 60 - (depth * 5));
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Bundle을 트리 노드로 변환
 */
const bundleToTreeNode = (
  bundle: NestedBundle,
  hierarchyNode: BundleHierarchyNode,
  childBundles: NestedBundle[] = []
): TreeNode => {
  // Bundle 자체 노드
  const bundleNode: TreeNode = {
    id: bundle.id,
    name: bundle.name,
    type: 'nestedBundle',
    depth: hierarchyNode.depth,
    children: [],
    metadata: {
      hierarchyNode,
      bundle,
      elementsCount: bundle.elements.length,
      childrenCount: childBundles.length
    },
    isExpanded: true,
    icon: getNodeIcon('nestedBundle', hierarchyNode.depth),
    color: getNodeColor('nestedBundle', hierarchyNode.depth),
    timeInfo: {
      startTime: bundle.timeRange.startTime,
      endTime: bundle.timeRange.endTime,
      duration: bundle.timeRange.duration
    }
  };

  // Bundle 내부 요소들을 자식 노드로 추가
  const elementNodes: TreeNode[] = bundle.elements.map(element => ({
    id: element.id,
    name: getElementName(element),
    type: element.type as TreeNode['type'],
    depth: hierarchyNode.depth + 1,
    children: [],
    parentId: bundle.id,
    metadata: { element },
    icon: getNodeIcon(element.type as TreeNode['type'], hierarchyNode.depth + 1),
    color: getNodeColor(element.type as TreeNode['type'], hierarchyNode.depth + 1),
    timeInfo: {
      startTime: element.startTime,
      endTime: element.endTime,
      duration: element.duration
    }
  }));

  // 자식 Bundle들을 자식 노드로 추가
  const childBundleNodes: TreeNode[] = childBundles.map(child => 
    bundleToTreeNode(child, {
      bundleId: child.id,
      parentId: bundle.id,
      children: [],
      depth: hierarchyNode.depth + 1,
      path: `${hierarchyNode.path}.${child.id}`,
      metadata: {
        originalSource: child.id,
        preservationMode: 'full',
        isRoot: false
      }
    })
  );

  bundleNode.children = [...elementNodes, ...childBundleNodes];
  return bundleNode;
};

/**
 * 요소 이름 추출
 */
const getElementName = (element: BundleElement): string => {
  switch (element.type) {
    case 'baseClip':
      return element.baseClip?.clipId ? `클립 ${element.baseClip.clipId.slice(-6)}` : 'Unknown Clip';
    case 'templateGroup':
      return element.templateGroup?.groupId ? `그룹 ${element.templateGroup.groupId.slice(-6)}` : 'Unknown Group';
    case 'nestedBundle':
      return element.nestedBundle?.bundleId ? `Bundle ${element.nestedBundle.bundleId.slice(-6)}` : 'Unknown Bundle';
    default:
      return `요소 ${element.id.slice(-6)}`;
  }
};

/**
 * 트리 노드 컴포넌트
 */
const TreeNodeComponent: React.FC<{
  node: TreeNode;
  isRoot?: boolean;
  onToggleExpand: (nodeId: string) => void;
  onNodeSelect: (nodeId: string, nodeType: string) => void;
  onNavigateToChild?: (childId: string) => void;
  searchFilter?: string;
  compact?: boolean;
}> = ({
  node,
  isRoot = false,
  onToggleExpand,
  onNodeSelect,
  onNavigateToChild,
  searchFilter,
  compact = false
}) => {
  const hasChildren = node.children.length > 0;
  const isFiltered = searchFilter ? 
    node.name.toLowerCase().includes(searchFilter.toLowerCase()) : true;

  if (!isFiltered) return null;

  const indentSize = compact ? 12 : 16;
  const indent = node.depth * indentSize;

  return (
    <div className="tree-node">
      {/* 노드 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: compact ? '2px 4px' : '4px 8px',
          marginLeft: `${indent}px`,
          cursor: 'pointer',
          borderRadius: '4px',
          backgroundColor: node.isSelected ? `${node.color}20` : 'transparent',
          border: node.isSelected ? `1px solid ${node.color}` : '1px solid transparent',
          transition: 'all 0.2s ease',
          fontSize: compact ? '11px' : '12px',
          lineHeight: '1.3'
        }}
        onClick={() => onNodeSelect(node.id, node.type)}
        onDoubleClick={() => {
          if (node.type === 'nestedBundle' && onNavigateToChild) {
            onNavigateToChild(node.id);
          }
        }}
      >
        {/* 확장/축소 버튼 */}
        {hasChildren && (
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              marginRight: '4px',
              color: node.color,
              fontSize: compact ? '8px' : '10px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
          >
            {node.isExpanded ? '▼' : '▶'}
          </button>
        )}

        {/* 아이콘 */}
        <span
          style={{
            marginRight: '6px',
            fontSize: compact ? '10px' : '12px'
          }}
        >
          {node.icon}
        </span>

        {/* 노드 이름 */}
        <span
          style={{
            fontWeight: isRoot ? 'bold' : node.type === 'nestedBundle' ? '600' : 'normal',
            color: node.color,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {node.name}
        </span>

        {/* 시간 정보 */}
        {node.timeInfo && !compact && (
          <span
            style={{
              fontSize: '9px',
              color: '#666',
              fontFamily: 'monospace',
              marginLeft: '8px'
            }}
          >
            {formatTime(node.timeInfo.duration)}
          </span>
        )}

        {/* 자식 개수 */}
        {hasChildren && (
          <span
            style={{
              fontSize: compact ? '8px' : '9px',
              color: '#888',
              backgroundColor: '#f0f0f0',
              padding: '1px 4px',
              borderRadius: '6px',
              marginLeft: '4px',
              minWidth: '16px',
              textAlign: 'center'
            }}
          >
            {node.children.length}
          </span>
        )}

        {/* 네비게이션 버튼 */}
        {node.type === 'nestedBundle' && onNavigateToChild && (
          <button
            style={{
              background: 'none',
              border: `1px solid ${node.color}40`,
              color: node.color,
              cursor: 'pointer',
              padding: '1px 4px',
              borderRadius: '3px',
              marginLeft: '4px',
              fontSize: '8px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToChild(node.id);
            }}
            title="이동"
          >
            →
          </button>
        )}
      </div>

      {/* 노드 세부 정보 (확장 시) */}
      {!compact && node.isSelected && node.metadata && (
        <div
          style={{
            marginLeft: `${indent + 20}px`,
            padding: '4px 8px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#666',
            marginTop: '2px'
          }}
        >
          {node.type === 'nestedBundle' && (
            <div>
              <div>📊 깊이: {node.depth}</div>
              <div>🔗 요소: {node.metadata.elementsCount}개</div>
              {node.metadata.childrenCount > 0 && (
                <div>👥 자식: {node.metadata.childrenCount}개</div>
              )}
              {node.timeInfo && (
                <div>⏱️ {formatTime(node.timeInfo.startTime)} - {formatTime(node.timeInfo.endTime)}</div>
              )}
            </div>
          )}
          {node.type !== 'nestedBundle' && node.timeInfo && (
            <div>
              ⏱️ {formatTime(node.timeInfo.startTime)} - {formatTime(node.timeInfo.endTime)}
            </div>
          )}
        </div>
      )}

      {/* 자식 노드들 */}
      {hasChildren && node.isExpanded && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              onToggleExpand={onToggleExpand}
              onNodeSelect={onNodeSelect}
              onNavigateToChild={onNavigateToChild}
              searchFilter={searchFilter}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Bundle 계층 구조 트리 컴포넌트
 */
export const BundleHierarchyTree: React.FC<BundleHierarchyTreeProps> = ({
  nestedBundle,
  hierarchyNode,
  childBundles = [],
  onNavigateToChild,
  onElementSelect,
  style,
  compact = false,
  maxDisplayDepth = 10,
  searchFilter
}) => {
  // 상태 관리
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([nestedBundle.id]));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [internalSearchFilter, setInternalSearchFilter] = useState(searchFilter || '');

  // 트리 데이터 생성
  const treeData = useMemo(() => {
    return bundleToTreeNode(nestedBundle, hierarchyNode, childBundles);
  }, [nestedBundle, hierarchyNode, childBundles]);

  // 노드 확장/축소 핸들러
  const handleToggleExpand = useCallback((nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  }, [expandedNodes]);

  // 노드 선택 핸들러
  const handleNodeSelect = useCallback((nodeId: string, nodeType: string) => {
    setSelectedNode(nodeId);
    if (onElementSelect && nodeType !== 'nestedBundle') {
      onElementSelect(nodeId, nodeType);
    }
  }, [onElementSelect]);

  // 트리 노드에 확장/선택 상태 적용
  const applyNodeStates = (node: TreeNode): TreeNode => {
    const updatedNode = {
      ...node,
      isExpanded: expandedNodes.has(node.id),
      isSelected: selectedNode === node.id,
      children: node.children.map(child => applyNodeStates(child))
    };
    return updatedNode;
  };

  const finalTreeData = applyNodeStates(treeData);

  return (
    <div
      className="bundle-hierarchy-tree"
      style={{
        background: 'white',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        padding: compact ? '8px' : '12px',
        minWidth: '250px',
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: compact ? '11px' : '12px',
        ...style
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: compact ? '6px' : '12px',
          padding: compact ? '4px 0' : '6px 0',
          borderBottom: '1px solid #e1e5e9'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: compact ? '12px' : '14px' }}>🌳</span>
          <span style={{ fontWeight: 'bold', color: '#333' }}>
            {compact ? '계층 구조' : 'Bundle 계층 구조'}
          </span>
        </div>
        
        {/* 요약 정보 */}
        <div style={{
          fontSize: compact ? '9px' : '10px',
          color: '#666',
          display: 'flex',
          gap: '8px'
        }}>
          <span>D{hierarchyNode.depth}</span>
          <span>{nestedBundle.elements.length}개</span>
        </div>
      </div>

      {/* 검색 필터 */}
      {!compact && (
        <div style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="검색..."
            value={internalSearchFilter}
            onChange={(e) => setInternalSearchFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          />
        </div>
      )}

      {/* 트리 구조 */}
      <div className="tree-content">
        <TreeNodeComponent
          node={finalTreeData}
          isRoot={true}
          onToggleExpand={handleToggleExpand}
          onNodeSelect={handleNodeSelect}
          onNavigateToChild={onNavigateToChild}
          searchFilter={internalSearchFilter}
          compact={compact}
        />
      </div>

      {/* 푸터 정보 */}
      {!compact && (
        <div
          style={{
            marginTop: '12px',
            padding: '6px 0',
            borderTop: '1px solid #e1e5e9',
            fontSize: '9px',
            color: '#888',
            textAlign: 'center'
          }}
        >
          총 {getTotalNodeCount(finalTreeData)}개 항목 • 최대 깊이 {getMaxDepth(finalTreeData)}
        </div>
      )}
    </div>
  );
};

/**
 * 유틸리티 함수들
 */
const getTotalNodeCount = (node: TreeNode): number => {
  return 1 + node.children.reduce((count, child) => count + getTotalNodeCount(child), 0);
};

const getMaxDepth = (node: TreeNode): number => {
  if (node.children.length === 0) return node.depth;
  return Math.max(...node.children.map(child => getMaxDepth(child)));
};

export default BundleHierarchyTree;
