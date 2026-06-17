/**
 * @fileoverview 관계 연결선 컴포넌트
 * @description 부모-자식 Bundle 간의 계층 관계를 시각적 연결선으로 표현
 * @version 1.0.0
 * @created 2025-06-22
 */

import React, { useMemo } from 'react';
import { NestedBundle, BundleHierarchyNode } from '../../../types/nested';

interface RelationshipConnectorProps {
  /** 부모 Bundle */
  parentBundle: NestedBundle;
  
  /** 자식 Bundle들 */
  childBundles: NestedBundle[];
  
  /** 부모 계층 노드 */
  hierarchyNode: BundleHierarchyNode;
  
  /** 줌 레벨 */
  zoom: number;
  
  /** 트랙 높이 */
  trackHeight: number;
  
  /** 연결선 색상 */
  color: string;
  
  /** 연결선 스타일 */
  style?: 'solid' | 'dashed' | 'dotted' | 'curved';
  
  /** 연결선 두께 */
  thickness?: number;
  
  /** 애니메이션 효과 */
  animated?: boolean;
  
  /** 방향 표시 화살표 */
  showArrows?: boolean;
  
  /** 관계 레이블 표시 */
  showLabels?: boolean;
}

/**
 * 연결점 계산
 */
interface ConnectionPoint {
  x: number;
  y: number;
  bundleId: string;
  bundleName: string;
  isParent: boolean;
}

/**
 * SVG 곡선 경로 생성
 */
const createCurvedPath = (
  start: ConnectionPoint,
  end: ConnectionPoint,
  curvature: number = 0.3
): string => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // 제어점 계산
  const cp1x = start.x + dx * curvature;
  const cp1y = start.y;
  const cp2x = end.x - dx * curvature;
  const cp2y = end.y;
  
  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
};

/**
 * 직선 경로 생성
 */
const createStraightPath = (start: ConnectionPoint, end: ConnectionPoint): string => {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
};

/**
 * 계단식 경로 생성 (ㄱ자 모양)
 */
const createSteppedPath = (start: ConnectionPoint, end: ConnectionPoint): string => {
  const midX = start.x + (end.x - start.x) * 0.7;
  const midY = start.y + (end.y - start.y) * 0.3;
  
  return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${midY} L ${end.x} ${end.y}`;
};

/**
 * 화살표 마커 생성
 */
const ArrowMarker: React.FC<{ color: string; id: string }> = ({ color, id }) => (
  <defs>
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8"
      refY="3"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
    >
      <path
        d="M0,0 L0,6 L9,3 z"
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
    </marker>
  </defs>
);

/**
 * 관계 레이블 컴포넌트
 */
const RelationshipLabel: React.FC<{
  start: ConnectionPoint;
  end: ConnectionPoint;
  relationship: string;
  color: string;
}> = ({ start, end, relationship, color }) => {
  const midX = start.x + (end.x - start.x) * 0.5;
  const midY = start.y + (end.y - start.y) * 0.5;
  
  return (
    <text
      x={midX}
      y={midY - 5}
      fill={color}
      fontSize="9"
      fontWeight="500"
      textAnchor="middle"
      style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '2px 4px',
        borderRadius: '3px',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
      }}
    >
      {relationship}
    </text>
  );
};

/**
 * 관계 연결선 컴포넌트
 */
export const RelationshipConnector: React.FC<RelationshipConnectorProps> = ({
  parentBundle,
  childBundles,
  hierarchyNode,
  zoom,
  trackHeight,
  color,
  style = 'curved',
  thickness = 2,
  animated = false,
  showArrows = true,
  showLabels = false
}) => {
  // 연결점들 계산
  const connectionPoints = useMemo(() => {
    const points: ConnectionPoint[] = [];
    
    // 부모 Bundle의 연결점 (하단 중앙)
    const parentPoint: ConnectionPoint = {
      x: parentBundle.timeRange.startTime * zoom + 
         (parentBundle.timeRange.endTime - parentBundle.timeRange.startTime) * zoom * 0.5,
      y: 0, // 부모의 하단
      bundleId: parentBundle.id,
      bundleName: parentBundle.name,
      isParent: true
    };
    points.push(parentPoint);
    
    // 자식 Bundle들의 연결점 (상단 중앙)
    childBundles.forEach((child, index) => {
      const childPoint: ConnectionPoint = {
        x: child.timeRange.startTime * zoom + 
           (child.timeRange.endTime - child.timeRange.startTime) * zoom * 0.5,
        y: trackHeight * (hierarchyNode.depth + 1), // 자식의 상단
        bundleId: child.id,
        bundleName: child.name,
        isParent: false
      };
      points.push(childPoint);
    });
    
    return points;
  }, [parentBundle, childBundles, hierarchyNode.depth, zoom, trackHeight]);

  // SVG 뷰박스 계산
  const svgBounds = useMemo(() => {
    if (connectionPoints.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    
    const allX = connectionPoints.map(p => p.x);
    const allY = connectionPoints.map(p => p.y);
    
    const minX = Math.min(...allX) - 50;
    const maxX = Math.max(...allX) + 50;
    const minY = Math.min(...allY) - 50;
    const maxY = Math.max(...allY) + 50;
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [connectionPoints]);

  // 연결 경로들 생성
  const connectionPaths = useMemo(() => {
    if (connectionPoints.length < 2) return [];
    
    const parentPoint = connectionPoints[0];
    const childPoints = connectionPoints.slice(1);
    
    return childPoints.map((childPoint, index) => {
      let pathData = '';
      
      switch (style) {
        case 'curved':
          pathData = createCurvedPath(parentPoint, childPoint);
          break;
        case 'dashed':
        case 'dotted':
        case 'solid':
          pathData = createStraightPath(parentPoint, childPoint);
          break;
        default:
          pathData = createSteppedPath(parentPoint, childPoint);
      }
      
      return {
        id: `${parentPoint.bundleId}-${childPoint.bundleId}`,
        pathData,
        parentPoint,
        childPoint,
        relationship: 'contains' // 기본 관계
      };
    });
  }, [connectionPoints, style]);

  if (connectionPaths.length === 0) return null;

  const markerId = `arrow-${hierarchyNode.bundleId}`;

  return (
    <svg
      className="relationship-connector"
      style={{
        position: 'absolute',
        left: `${svgBounds.x}px`,
        top: `${svgBounds.y}px`,
        width: `${svgBounds.width}px`,
        height: `${svgBounds.height}px`,
        pointerEvents: 'none',
        zIndex: 99,
        overflow: 'visible'
      }}
      viewBox={`0 0 ${svgBounds.width} ${svgBounds.height}`}
    >
      {/* 화살표 마커 정의 */}
      {showArrows && <ArrowMarker color={color} id={markerId} />}
      
      {/* 연결 경로들 */}
      {connectionPaths.map((path, index) => (
        <g key={path.id}>
          {/* 배경 경로 (더 두꺼운 흰색) */}
          <path
            d={path.pathData}
            fill="none"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth={thickness + 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'blur(0.5px)'
            }}
          />
          
          {/* 메인 경로 */}
          <path
            d={path.pathData}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={
              style === 'dashed' ? '8,4' :
              style === 'dotted' ? '2,3' : 'none'
            }
            markerEnd={showArrows ? `url(#${markerId})` : 'none'}
            style={{
              transition: animated ? 'all 0.3s ease' : 'none',
              filter: animated ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
            }}
          />
          
          {/* 호버 효과용 투명 경로 */}
          <path
            d={path.pathData}
            fill="none"
            stroke="transparent"
            strokeWidth={thickness + 8}
            style={{
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => {
              if (animated) {
                const target = e.target as SVGPathElement;
                target.style.filter = 'drop-shadow(0 3px 8px rgba(0,0,0,0.3))';
              }
            }}
            onMouseLeave={(e) => {
              if (animated) {
                const target = e.target as SVGPathElement;
                target.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
              }
            }}
          >
            <title>
              {`${path.parentPoint.bundleName} → ${path.childPoint.bundleName}`}
            </title>
          </path>
          
          {/* 관계 레이블 */}
          {showLabels && (
            <RelationshipLabel
              start={path.parentPoint}
              end={path.childPoint}
              relationship={path.relationship}
              color={color}
            />
          )}
        </g>
      ))}
      
      {/* 연결점 표시 */}
      {connectionPoints.map((point, index) => (
        <g key={`${point.bundleId}-point`}>
          {/* 연결점 원 */}
          <circle
            cx={point.x - svgBounds.x}
            cy={point.y - svgBounds.y}
            r={thickness + 1}
            fill="white"
            stroke={color}
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))'
            }}
          />
          
          {/* 부모/자식 표시 아이콘 */}
          <text
            x={point.x - svgBounds.x}
            y={point.y - svgBounds.y + 1}
            fill={color}
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {point.isParent ? '▼' : '▲'}
          </text>
        </g>
      ))}
      
      {/* 애니메이션 효과 */}
      {animated && (
        <style>
          {`
            .relationship-connector path {
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              animation: draw 2s ease-in-out forwards;
            }
            
            @keyframes draw {
              to {
                stroke-dashoffset: 0;
              }
            }
            
            .relationship-connector circle {
              opacity: 0;
              animation: fadeIn 0.5s ease-in-out forwards;
              animation-delay: 1.5s;
            }
            
            @keyframes fadeIn {
              to {
                opacity: 1;
              }
            }
          `}
        </style>
      )}
    </svg>
  );
};

/**
 * 관계 연결선 팩토리 함수
 */
export const createRelationshipConnector = (
  parentBundle: NestedBundle,
  childBundles: NestedBundle[],
  options?: Partial<Omit<RelationshipConnectorProps, 'parentBundle' | 'childBundles'>>
) => {
  return (
    <RelationshipConnector
      parentBundle={parentBundle}
      childBundles={childBundles}
      hierarchyNode={{
        bundleId: parentBundle.id,
        parentId: undefined,
        children: [],
        depth: 0,
        path: parentBundle.id,
        metadata: {
          originalSource: parentBundle.id,
          preservationMode: 'full',
          isRoot: true
        }
      }}
      zoom={1}
      trackHeight={60}
      color="hsl(220, 60%, 60%)"
      style="curved"
      thickness={2}
      animated={false}
      showArrows={true}
      showLabels={false}
      {...options}
    />
  );
};

export default RelationshipConnector;
