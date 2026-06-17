/**
 * 🗂️ NestedBundleContainer.tsx - 중첩 Bundle 컨테이너 컴포넌트
 * 
 * 계층적 Bundle 구조를 시각적으로 표현하고 관리하는 메인 컨테이너 컴포넌트입니다.
 * 복잡한 중첩 Bundle 구조를 직관적으로 표시하고, 각 레벨별로 독립적인
 * 편집과 관리 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 중첩 Bundle 계층 구조 시각화
 * - 레벨별 Bundle 확장/축소
 * - 드래그 앤 드롭을 통한 Bundle 재구성
 * - 중첩 깊이 제한 및 검증
 * - 부모-자식 Bundle 관계 관리
 * - 계층별 색상 코딩
 * 
 * 중첩 레벨 관리:
 * - Level 0: 루트 Bundle (기본)
 * - Level 1: 1차 중첩 Bundle
 * - Level 2: 2차 중첩 Bundle
 * - Level 3+: 깊은 중첩 (성능 고려)
 * 
 * 시각적 표현:
 * - 인덴트를 통한 계층 구조 표시
 * - 연결선을 통한 부모-자식 관계 표시
 * - 확장/축소 아이콘
 * - 깊이별 색상 차별화
 * - 드래그 앤 드롭 시각적 피드백
 * 
 * 성능 최적화:
 * - 가상화를 통한 대량 Bundle 처리
 * - 메모이제이션으로 불필요한 리렌더링 방지
 * - 지연 로딩으로 깊은 계층 최적화
 * 
 * 관련 모듈:
 * - 3번 모듈: Bundle System (중첩 Bundle 핵심)
 * - DepthIndicator: 깊이 표시 인디케이터
 * - BundleHierarchyTree: 계층 트리 관리
 * - 1번 모듈: Timeline System (타임라인 통합)
 */

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { TimelineTrack } from '../../../types';
import { NestedBundle, BundleElement, BundleHierarchyNode } from '../../../types/nested';
import { DepthIndicator } from './DepthIndicator';
import { RelationshipConnector } from './RelationshipConnector';
import { BundleHierarchyTree } from './BundleHierarchyTree';

interface NestedBundleContainerProps {
  /** 중첩 Bundle 데이터 */
  nestedBundle: NestedBundle;
  
  /** 계층 노드 정보 */
  hierarchyNode: BundleHierarchyNode;
  
  /** 자식 Bundle들 */
  childBundles?: NestedBundle[];
  
  /** 타임라인 트랙들 */
  tracks: TimelineTrack[];
  
  /** 줌 레벨 */
  zoom: number;
  
  /** 트랙 높이 */
  trackHeight: number;
  
  /** 선택 상태 */
  isSelected: boolean;
  
  /** 확장/축소 상태 */
  isExpanded: boolean;
  
  /** 하이라이트 상태 (부모-자식 관계 표시용) */
  isHighlighted?: boolean;
  
  /** 이벤트 핸들러들 */
  onBundleSelect: (bundleId: string) => void;
  onBundleMove?: (bundleId: string, deltaTime: number) => void;
  onToggleExpand: (bundleId: string) => void;
  onNavigateToChild?: (childId: string) => void;
  
  /** 드래그 제약 조건 */
  dragConstraints?: {
    maxDepth: number;
    allowCrossHierarchy: boolean;
    preserveRelationships: boolean;
  };
}

/**
 * 시간 포맷팅 유틸리티
 */
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
};

/**
 * 중첩 Bundle 컨테이너 컴포넌트
 */
export const NestedBundleContainer: React.FC<NestedBundleContainerProps> = ({
  nestedBundle,
  hierarchyNode,
  childBundles = [],
  tracks,
  zoom,
  trackHeight,
  isSelected,
  isExpanded,
  isHighlighted = false,
  onBundleSelect,
  onBundleMove,
  onToggleExpand,
  onNavigateToChild,
  dragConstraints
}) => {
  // 상태 관리
  const [showDetails, setShowDetails] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  // Bundle 시각적 경계 계산
  const bundleBounds = useMemo(() => {
    const { timeRange } = nestedBundle;
    
    // 자식 Bundle들의 범위도 고려
    let minTime = timeRange.startTime;
    let maxTime = timeRange.endTime;
    let minTrack = 0;
    let maxTrack = 0;

    if (childBundles.length > 0) {
      childBundles.forEach(child => {
        minTime = Math.min(minTime, child.timeRange.startTime);
        maxTime = Math.max(maxTime, child.timeRange.endTime);
      });
    }

    // 요소들의 트랙 위치 계산
    const elementTracks = nestedBundle.elements.map(element => {
      // 실제 트랙 찾기 (간단한 구현)
      return tracks.findIndex(track => 
        track.clips.some(clip => 
          element.type === 'baseClip' && element.baseClip?.clipId === clip.id
        )
      );
    }).filter(trackIndex => trackIndex >= 0);

    if (elementTracks.length > 0) {
      minTrack = Math.min(...elementTracks);
      maxTrack = Math.max(...elementTracks);
    }

    return {
      left: minTime * zoom,
      width: (maxTime - minTime) * zoom,
      top: minTrack * trackHeight,
      height: Math.max((maxTrack - minTrack + 1) * trackHeight, trackHeight),
      startTime: minTime,
      endTime: maxTime,
      duration: maxTime - minTime
    };
  }, [nestedBundle, childBundles, tracks, zoom, trackHeight]);

  // 계층 깊이에 따른 시각적 스타일
  const hierarchyStyles = useMemo(() => {
    const depth = hierarchyNode.depth;
    const baseHue = 220; // 기본 파란색 계열
    const hue = (baseHue + (depth * 30)) % 360;
    const saturation = Math.max(30, 70 - (depth * 10));
    const lightness = Math.min(85, 50 + (depth * 8));
    
    return {
      primaryColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      borderColor: `hsl(${hue}, ${saturation + 20}%, ${lightness - 15}%)`,
      backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%, 0.15)`,
      shadowColor: `hsl(${hue}, ${saturation}%, ${lightness - 30}%, 0.3)`,
      depth,
      zIndex: 100 - depth
    };
  }, [hierarchyNode.depth]);

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onBundleSelect(nestedBundle.id);
    
    if (!onBundleMove) return;
    
    setIsDragging(true);
    const startX = e.clientX;
    const originalStartTime = nestedBundle.timeRange.startTime;

    // Ghost 요소 생성
    const ghost = document.createElement('div');
    ghost.className = 'nested-bundle-ghost';
    ghost.style.cssText = `
      position: fixed;
      left: ${e.clientX - 50}px;
      top: ${e.clientY - 20}px;
      padding: 8px 16px;
      background: ${hierarchyStyles.primaryColor};
      color: white;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      z-index: 9999;
      pointer-events: none;
      box-shadow: 0 4px 20px ${hierarchyStyles.shadowColor};
      border: 2px dashed ${hierarchyStyles.borderColor};
    `;
    ghost.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>📦${'^'.repeat(hierarchyNode.depth)}</span>
        <span>${nestedBundle.name}</span>
      </div>
      <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
        ${formatTime(bundleBounds.startTime)} - ${formatTime(bundleBounds.endTime)}
      </div>
    `;
    
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragGhostRef.current) return;
      
      const deltaX = e.clientX - startX;
      const deltaTime = deltaX / zoom;
      const newStartTime = Math.max(0, originalStartTime + deltaTime);
      const newEndTime = newStartTime + bundleBounds.duration;
      
      // Ghost 위치 업데이트
      dragGhostRef.current.style.left = `${e.clientX - 50}px`;
      dragGhostRef.current.style.top = `${e.clientY - 20}px`;
      
      // 시간 정보 업데이트
      const timeInfo = dragGhostRef.current.querySelector('div:last-child');
      if (timeInfo) {
        timeInfo.textContent = `${formatTime(newStartTime)} - ${formatTime(newEndTime)}`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      
      if (dragGhostRef.current) {
        document.body.removeChild(dragGhostRef.current);
        dragGhostRef.current = null;
      }

      const deltaX = e.clientX - startX;
      const deltaTime = deltaX / zoom;
      
      // 제약 조건 검증
      if (dragConstraints) {
        const newStartTime = originalStartTime + deltaTime;
        if (newStartTime < 0) return;
        
        // 추가 제약 조건들...
      }

      // 실제 이동 실행
      if (Math.abs(deltaTime) > 0.01) {
        onBundleMove(nestedBundle.id, deltaTime);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [nestedBundle, hierarchyNode, bundleBounds, zoom, onBundleSelect, onBundleMove, hierarchyStyles, dragConstraints]);

  // 확장/축소 토글
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(nestedBundle.id);
  }, [nestedBundle.id, onToggleExpand]);

  // 세부 정보 토글
  const handleToggleDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  }, [showDetails]);

  if (!bundleBounds) return null;

  return (
    <div
      ref={containerRef}
      className={`nested-bundle-container ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        position: 'absolute',
        left: `${bundleBounds.left}px`,
        top: `${bundleBounds.top}px`,
        width: `${bundleBounds.width}px`,
        height: `${bundleBounds.height}px`,
        border: `2px ${isSelected ? 'solid' : 'dashed'} ${hierarchyStyles.borderColor}`,
        borderRadius: '12px',
        background: hierarchyStyles.backgroundColor,
        zIndex: hierarchyStyles.zIndex,
        overflow: 'visible',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        transform: `scale(${isSelected ? 1.02 : 1}) ${isHighlighted ? 'translateY(-2px)' : ''}`,
        boxShadow: isSelected 
          ? `0 0 0 3px ${hierarchyStyles.primaryColor}40, 0 8px 25px ${hierarchyStyles.shadowColor}`
          : isHighlighted
          ? `0 4px 15px ${hierarchyStyles.shadowColor}`
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: isDragging ? 'grabbing' : 'default',
        opacity: isDragging ? 0.7 : 1
      }}
      title={`중첩 Bundle: ${nestedBundle.name} (깊이: ${hierarchyNode.depth}, 요소: ${nestedBundle.elements.length}개)`}
    >
      {/* 깊이 인디케이터 */}
      <DepthIndicator 
        depth={hierarchyNode.depth}
        maxDepth={dragConstraints?.maxDepth || 10}
        color={hierarchyStyles.primaryColor}
        position="top-left"
      />

      {/* Bundle 헤더 */}
      <div 
        className="nested-bundle-header"
        style={{
          position: 'absolute',
          top: '-32px',
          left: '0',
          background: hierarchyStyles.primaryColor,
          color: 'white',
          padding: '6px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '150px',
          boxShadow: `0 2px 8px ${hierarchyStyles.shadowColor}`,
          cursor: 'move',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <span>📦{'^'.repeat(hierarchyNode.depth)}</span>
        <span>{nestedBundle.name}</span>
        
        {/* 요소 개수 표시 */}
        <span style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px'
        }}>
          {nestedBundle.elements.length}개
        </span>

        {/* 확장/축소 버튼 */}
        {childBundles.length > 0 && (
          <button
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
            onClick={handleToggleExpand}
            title={isExpanded ? '축소' : '확장'}
          >
            <span>{isExpanded ? '▼' : '▶'}</span>
            <span>{childBundles.length}</span>
          </button>
        )}

        {/* 세부 정보 버튼 */}
        <button
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: 'white',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '9px',
            cursor: 'pointer'
          }}
          onClick={handleToggleDetails}
          title="세부 정보"
        >
          ℹ️
        </button>
      </div>

      {/* 계층 경로 표시 */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          left: '8px',
          fontSize: '9px',
          color: hierarchyStyles.borderColor,
          fontFamily: 'monospace',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: `1px solid ${hierarchyStyles.borderColor}30`
        }}
      >
        {hierarchyNode.path}
      </div>

      {/* 시간 정보 */}
      <div
        style={{
          position: 'absolute',
          bottom: '-24px',
          left: '0',
          fontSize: '11px',
          color: hierarchyStyles.borderColor,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '3px 8px',
          borderRadius: '4px',
          border: `1px solid ${hierarchyStyles.borderColor}`,
          fontFamily: 'monospace',
          fontWeight: '600',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}
      >
        {formatTime(bundleBounds.startTime)} - {formatTime(bundleBounds.endTime)}
        <span style={{ marginLeft: '6px', opacity: 0.7 }}>
          ({formatTime(bundleBounds.duration)})
        </span>
      </div>

      {/* 계층 구조 정보 (선택 시) */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${hierarchyStyles.borderColor}`,
            borderRadius: '8px',
            padding: '8px',
            fontSize: '10px',
            color: hierarchyStyles.borderColor,
            boxShadow: `0 2px 8px ${hierarchyStyles.shadowColor}`,
            backdropFilter: 'blur(5px)',
            maxWidth: '200px',
            lineHeight: '1.4'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            📊 계층 정보
          </div>
          <div>깊이: {hierarchyNode.depth}</div>
          <div>경로: {hierarchyNode.path}</div>
          <div>요소: {nestedBundle.elements.length}개</div>
          {hierarchyNode.parentId && (
            <div>부모: {hierarchyNode.parentId.slice(-8)}</div>
          )}
          {childBundles.length > 0 && (
            <div>자식: {childBundles.length}개</div>
          )}
        </div>
      )}

      {/* 세부 정보 패널 */}
      {showDetails && (
        <BundleHierarchyTree
          nestedBundle={nestedBundle}
          hierarchyNode={hierarchyNode}
          childBundles={childBundles}
          onNavigateToChild={onNavigateToChild}
          style={{
            position: 'absolute',
            bottom: '-200px',
            left: '0',
            zIndex: 1000
          }}
        />
      )}

      {/* 자식 Bundle들과의 관계 연결선 */}
      {isExpanded && childBundles.length > 0 && (
        <RelationshipConnector
          parentBundle={nestedBundle}
          childBundles={childBundles}
          hierarchyNode={hierarchyNode}
          zoom={zoom}
          trackHeight={trackHeight}
          color={hierarchyStyles.borderColor}
        />
      )}
    </div>
  );
};
