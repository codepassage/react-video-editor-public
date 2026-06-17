/**
 * 📦 BundleContainer.tsx - 번들 컨테이너 컴포넌트 (3번 모듈 핵심)
 * 
 * 연속된 클립들을 논리적으로 그룹화하는 Bundle 시스템의 시각적 표현
 * Ghost 드래그 시스템을 통한 정교한 Bundle 이동 제어
 * 
 * 주요 기능:
 * - Bundle 경계 시각화 (점선 테두리)
 * - Ghost 드래그 시스템 (실시간 미리보기)
 * - Bundle 헤더 정보 표시 (이름, 요소 수, 관계)
 * - 컨텍스트 메뉴 (이름변경, 그룹해제, 삭제)
 * - 더블클릭 이름 변경
 * - 템플릿 그룹 관계 시각화
 * 
 * Bundle 관계 시스템:
 * - 🛡️ 템플릿 그룹과 연동 표시
 * - ⇄ 동시이동 모드 시각화
 * - 독립이동 vs 연동이동 구분
 * 
 * Ghost 드래그 특징:
 * - 실제 Bundle은 움직이지 않고 Ghost만 움직임
 * - 드래그 완료 시 한 번에 이동 실행
 * - ESC 키로 드래그 취소 가능
 * - 스냅 기능 (0.05초 단위)
 * - 경계값 제한 (음수 시간 방지)
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Bundle, TimelineClip, TemplateGroup, TimelineTrack } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { BundleContextMenu } from './BundleContextMenu';
import { BundleRenameModal } from './BundleRenameModal';
import { globalAlert } from '../../utils/globalAlert';

interface BundleContainerProps {
  bundle: Bundle;
  baseClips: TimelineClip[];
  templateGroups: TemplateGroup[];
  zoom: number;
  trackHeight: number;
  onBundleSelect: (bundleId: string) => void;
  onBundleMove?: (bundleId: string, deltaTime: number) => void;
  isSelected: boolean;
  tracks: TimelineTrack[];
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
};

interface DragGhost {
  element: HTMLDivElement;
  startX: number;
  originalStartTime: number;
  cleanup: () => void;
}

export const BundleContainer: React.FC<BundleContainerProps> = ({
  bundle,
  baseClips,
  templateGroups,
  zoom,
  trackHeight,
  onBundleSelect,
  onBundleMove,
  isSelected,
  tracks
}) => {
  const [showElementControls, setShowElementControls] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showRenameModal, setShowRenameModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<DragGhost | null>(null);
  const { moveBundleElementOrder, deleteBundle, ungroupBundle } = useEditorStore();

  // Bundle 전체 경계 계산
  const bundleBounds = useMemo(() => {
    const allElements = [
      ...baseClips.map(clip => ({
        startTime: clip.startTime,
        endTime: clip.endTime,
        trackIndex: tracks.findIndex(track => track.clips.some(c => c.id === clip.id))
      })),
      ...templateGroups.map(group => ({
        startTime: group.startTime,
        endTime: group.endTime,
        trackIndex: tracks.findIndex(track => track.clips.some(c => group.clipIds.includes(c.id)))
      }))
    ];

    if (allElements.length === 0) return null;

    const startTime = Math.min(...allElements.map(el => el.startTime));
    const endTime = Math.max(...allElements.map(el => el.endTime));
    const topTrack = Math.min(...allElements.map(el => el.trackIndex).filter(idx => idx >= 0));
    const bottomTrack = Math.max(...allElements.map(el => el.trackIndex).filter(idx => idx >= 0));

    return {
      left: startTime * zoom,
      width: (endTime - startTime) * zoom,
      top: topTrack >= 0 ? topTrack * trackHeight : 0,
      height: topTrack >= 0 && bottomTrack >= 0 ? (bottomTrack - topTrack + 1) * trackHeight : trackHeight,
      startTime,
      endTime
    };
  }, [baseClips, templateGroups, zoom, trackHeight, tracks]);

  // Bundle 내부 요소들을 시간순으로 정렬
  const sortedBundleElements = useMemo(() => {
    const allElements = [
      ...baseClips.map(clip => ({
        id: clip.id,
        type: 'baseClip' as const,
        name: clip.text || `클립 ${clip.id.slice(-4)}`,
        startTime: clip.startTime,
        endTime: clip.endTime,
        duration: clip.duration,
        icon: '🎬'
      })),
      ...templateGroups.map(group => ({
        id: group.id,
        type: 'templateGroup' as const,
        name: group.name,
        startTime: group.startTime,
        endTime: group.endTime,
        duration: group.endTime - group.startTime,
        icon: '📋'
      }))
    ];

    return allElements.sort((a, b) => a.startTime - b.startTime);
  }, [baseClips, templateGroups]);

  // Ghost 드래그 시스템 생성
  const createDragGhost = (e: React.MouseEvent): DragGhost | null => {
    if (!containerRef.current || !bundleBounds) return null;

    const originalElement = containerRef.current;
    const rect = originalElement.getBoundingClientRect();

    // 🎭 Ghost 엘리먼트 생성
    const ghost = document.createElement('div');
    ghost.className = 'bundle-ghost';

    // Ghost 스타일 설정 (원본과 유사하지만 시각적으로 구분)
    ghost.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px dashed ${bundle.color};
      border-radius: 8px;
      background-color: ${bundle.color}40;
      z-index: 9999;
      pointer-events: none;
      transition: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      opacity: 0.8;
    `;

    // Ghost 헤더 추가
    const ghostHeader = document.createElement('div');
    ghostHeader.style.cssText = `
      position: absolute;
      top: -28px;
      left: 0;
      background: ${bundle.color};
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
    `;
    ghostHeader.innerHTML = `<span>[B]</span><span>${bundle.name}</span>`;
    ghost.appendChild(ghostHeader);

    // Ghost 정보 추가
    const ghostInfo = document.createElement('div');
    ghostInfo.style.cssText = `
      position: absolute;
      bottom: -22px;
      left: 0;
      font-size: 11px;
      color: ${bundle.color};
      font-family: monospace;
      font-weight: 600;
      user-select: none;
    `;
    ghostInfo.textContent = `${bundleBounds.startTime.toFixed(1)}s - ${bundleBounds.endTime.toFixed(1)}s`;
    ghost.appendChild(ghostInfo);

    // Ghost를 문서에 추가
    document.body.appendChild(ghost);

    // 정리 함수
    const cleanup = () => {
      if (ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
    };

    console.log('🎭 Bundle Ghost 드래그 시작:', {
      bundleId: bundle.id.slice(-8),
      bundleName: bundle.name,
      originalStartTime: bundle.startTime.toFixed(2)
    });

    return {
      element: ghost,
      startX: e.clientX,
      originalStartTime: bundle.startTime,
      cleanup
    };
  };

  // 컴포넌트 언마운트 시 Ghost 정리
  useEffect(() => {
    return () => {
      if (dragGhostRef.current) {
        dragGhostRef.current.cleanup();
        dragGhostRef.current = null;
      }
    };
  }, []);

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBundleSelect(bundle.id);

    if (!onBundleMove) return;

    // 🎭 Ghost 드래그 시스템 시작
    const dragGhost = createDragGhost(e);
    if (!dragGhost) return;

    dragGhostRef.current = dragGhost;
    const initialGhostLeft = parseFloat(dragGhost.element.style.left);

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragGhostRef.current) return;

      const deltaX = e.clientX - dragGhostRef.current.startX;

      // 🎭 Ghost 위치 업데이트 (실제 Bundle은 이동하지 않음)
      const ghost = dragGhostRef.current.element;
      const newLeft = initialGhostLeft + deltaX;
      ghost.style.left = `${newLeft}px`;

      // Ghost 정보도 실시간 업데이트
      const deltaTime = deltaX / zoom;
      const newStartTime = Math.max(0, dragGhostRef.current.originalStartTime + deltaTime);
      const newEndTime = newStartTime + (bundle.endTime - bundle.startTime);
      const ghostInfo = ghost.querySelector('div:last-child');
      if (ghostInfo) {
        ghostInfo.textContent = `${newStartTime.toFixed(1)}s - ${newEndTime.toFixed(1)}s`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragGhostRef.current) return;

      console.log('🎭 Bundle Ghost 드래그 완료');

      // 최종 이동 거리 계산
      const finalDeltaX = e.clientX - dragGhostRef.current.startX;
      let finalDeltaTime = finalDeltaX / zoom;

      // 경계 제한
      const newStartTime = dragGhostRef.current.originalStartTime + finalDeltaTime;
      if (newStartTime < 0) {
        finalDeltaTime = -dragGhostRef.current.originalStartTime;
      }

      // 스냅
      finalDeltaTime = Math.round(finalDeltaTime * 20) / 20;

      console.log('📊 Bundle 최종 계산 결과:', {
        finalDeltaTime: finalDeltaTime.toFixed(3),
        newStartTime: (dragGhostRef.current.originalStartTime + finalDeltaTime).toFixed(2)
      });

      // 🎯 실제 Bundle 이동 실행 (한 번만)
      if (Math.abs(finalDeltaTime) > 0.01) {
        console.log('✅ Bundle 이동 실행:', {
          bundleId: bundle.id.slice(-8),
          deltaTime: finalDeltaTime.toFixed(3)
        });

        onBundleMove(bundle.id, finalDeltaTime);
      } else {
        console.log('🚫 이동 거리 미미하여 무시');
      }

      // 🧹 Ghost 정리
      dragGhostRef.current.cleanup();
      dragGhostRef.current = null;

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // 🚪 ESC 키로 드래그 취소
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragGhostRef.current) {
        console.log('🚫 ESC 키로 Bundle 드래그 취소');
        dragGhostRef.current.cleanup();
        dragGhostRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
  };

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // 더블클릭으로 이름 변경
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRenameModal(true);
  };

  // 컨텍스트 메뉴 액션 핸들러
  const handleRename = () => {
    setShowRenameModal(true);
  };

  const handleUngroup = () => {
    ungroupBundle(bundle.id);
  };

  const handleDelete = async () => {
    const confirmed = await globalAlert.confirmDanger(`번들 "${bundle.name}"을(를) 삭제하시겠습니까?`);
    if (confirmed) {
      deleteBundle(bundle.id);
    }
  };

  // 요소 순서 변경 핸들러
  const handleMoveElement = (elementId: string, elementType: 'baseClip' | 'templateGroup', direction: 'left' | 'right') => {
    const result = moveBundleElementOrder(bundle.id, elementId, elementType, direction);
    if (!result.success) {
      console.warn(`⚠️ 요소 이동 실패: ${result.reason}`);
    }
  };

  if (!bundleBounds) return null;

  return (
    <>
      {/* Bundle 컨테이너 */}
      <div
        ref={containerRef}
        className={`bundle-container ${isSelected ? 'selected' : ''}`}
        style={{
          position: 'absolute',
          left: `${bundleBounds.left}px`,
          top: `${bundleBounds.top}px`,
          width: `${bundleBounds.width}px`,
          height: `${bundleBounds.height}px`,
          border: `2px dashed ${bundle.color}`,
          borderRadius: '8px',
          background: `${bundle.color}15`,
          cursor: 'default',
          zIndex: 50, // 클립들보다 높게 설정하여 헤더 표시
          pointerEvents: 'none',
          overflow: 'visible', // 🎯 헤더가 보이도록 변경
          transition: isSelected ? 'none' : 'all 0.2s ease',
          boxShadow: isSelected
            ? `0 0 0 2px ${bundle.color}, 0 8px 25px ${bundle.color}40`
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
          opacity: isSelected ? 1 : (dragGhostRef.current ? 0.5 : 0.9), // 🎭 드래그 중일 때 원본을 약간 어둡게
          transform: isSelected ? 'scale(1.02)' : 'scale(1)'
        }}
        title={`Bundle: ${bundle.name} (${baseClips.length + templateGroups.length}개 요소)`}
      >
        {/* Bundle 헤더 */}
        <div
          className="bundle-header"
          style={{
            position: 'absolute',
            top: '-28px',
            left: '0',
            background: bundle.color,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            border: `1px dashed ${bundle.color}`,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minWidth: '120px',
            justifyContent: 'center',
            pointerEvents: 'auto', // 헤더 영역만 드래그 가능
            cursor: 'move'
          }}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
          onDoubleClick={handleDoubleClick}
        >
          <span>[B]</span>
          <span>{bundle.name}</span>
          <span style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            {baseClips.length + templateGroups.length}개
          </span>

          {/* 🌟 그룹 관계 표시 */}
          {(() => {
            const linkedGroups = bundle.relationships?.linkedTemplateGroups || [];
            const hasGroupRelation = linkedGroups.length > 0;
            const dragBehavior = bundle.relationships?.dragBehavior;

            if (hasGroupRelation) {
              return (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>🛡️</span>
                  <span>{linkedGroups.length}</span>
                  {dragBehavior === 'with-groups' && (
                    <span title="동시이동" style={{ color: '#90EE90' }}>⇄</span>
                  )}
                </span>
              );
            }
            return null;
          })()}
        </div>

        {/* Bundle 정보 (하단) */}
        <div
          className="bundle-info"
          style={{
            position: 'absolute',
            bottom: '-22px',
            left: '0',
            fontSize: '11px',
            color: bundle.color,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px dashed ${bundle.color}`,
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
            fontWeight: '600',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}
        >
          {formatTime(bundleBounds.startTime)} - {formatTime(bundleBounds.endTime)}
        </div>

        {/* Bundle 사용 안내 */}
      </div>

      {/* 컨텍스트 메뉴 */}
      {showContextMenu && (
        <BundleContextMenu
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onRename={handleRename}
          onUngroup={handleUngroup}
          onDelete={handleDelete}
        />
      )}

      {/* 이름 변경 모달 */}
      {showRenameModal && (
        <BundleRenameModal
          bundle={bundle}
          onClose={() => setShowRenameModal(false)}
        />
      )}
    </>
  );
};
