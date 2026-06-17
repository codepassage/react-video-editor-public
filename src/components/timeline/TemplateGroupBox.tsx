import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { TemplateGroup, TimelineClip, TimelineTrack, SelectedElement } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { useBundleKeyboard } from '../../hooks/useKeyboardState';
import { TemplateGroupContextMenu } from './TemplateGroupContextMenu';
import { TemplateGroupRenameModal } from './TemplateGroupRenameModal';
import { globalAlert } from '../../utils/globalAlert';

interface TemplateGroupContainerProps {
  group: TemplateGroup;
  clips: TimelineClip[];
  zoom: number;
  trackHeight: number;
  onGroupSelect: (groupId: string) => void;
  onGroupMove?: (groupId: string, deltaTime: number) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  tracks?: TimelineTrack[];
}

interface DragGhost {
  element: HTMLDivElement;
  startX: number;
  originalStartTime: number;
  cleanup: () => void;
}

export const TemplateGroupContainer: React.FC<TemplateGroupContainerProps> = ({
  group,
  clips,
  zoom,
  trackHeight,
  onGroupSelect,
  onGroupMove,
  isSelected = false,
  isDragging = false,
  tracks = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<DragGhost | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  
  // Bundle 상태 및 키보드 훅
  const {
    toggleBundleElementSelection,
    clearBundleSelection,
    pendingBundleSelection,
    deleteTemplateGroup,
    ungroupTemplate
  } = useEditorStore();
  
  const { isBundleSelectionMode } = useBundleKeyboard();
  
  // Bundle 선택 상태 확인
  const isBundleSelected = pendingBundleSelection.some(element => 
    element.type === 'templateGroup' && element.id === group.id
  );

  // 그룹의 시각적 위치와 크기 계산
  const groupBounds = useMemo(() => {
    if (clips.length === 0) return null;

    // 그룹에 속한 클립들의 트랙 인덱스 찾기
    const trackIndices = new Set<number>();
    const clipBounds = clips.map(clip => {
      // 트랙 인덱스 찾기
      const trackIndex = tracks.findIndex(track =>
        track.clips.some(c => c.id === clip.id)
      );

      if (trackIndex >= 0) {
        trackIndices.add(trackIndex);
      }

      return {
        left: clip.startTime * zoom,
        right: clip.endTime * zoom,
        top: trackIndex >= 0 ? trackIndex * trackHeight : 0,
        bottom: trackIndex >= 0 ? (trackIndex + 1) * trackHeight : trackHeight,
        clip
      };
    });

    const left = Math.min(...clipBounds.map(b => b.left));
    const right = Math.max(...clipBounds.map(b => b.right));
    const top = Math.min(...clipBounds.map(b => b.top));
    const bottom = Math.max(...clipBounds.map(b => b.bottom));

    return {
      left,
      top,
      width: right - left,
      height: bottom - top,
      trackCount: trackIndices.size
    };
  }, [clips, zoom, trackHeight, tracks]);

  // Ghost 드래그 시스템 생성
  const createDragGhost = (e: React.MouseEvent): DragGhost | null => {
    if (!containerRef.current || !groupBounds) return null;

    const originalElement = containerRef.current;
    const rect = originalElement.getBoundingClientRect();

    // 🎭 Ghost 엘리먼트 생성
    const ghost = document.createElement('div');
    ghost.className = 'template-group-ghost';

    // Ghost 스타일 설정 (원본과 유사하지만 시각적으로 구분)
    ghost.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid ${group.color || '#4CAF50'};
      border-radius: 8px;
      background-color: ${group.color || '#4CAF50'}40;
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
      top: -24px;
      left: 0;
      background-color: ${group.color || '#4CAF50'};
      color: white;
      padding: 2px 8px;
      border-radius: 4px 4px 0 0;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
      user-select: none;
    `;

    if (group.isProtected) {
      ghostHeader.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4 7V12C4 16.5 6.8 20.7 11 21.9C11.3 22 11.7 22 12 21.9C16.2 20.7 19 16.5 19 12V7L12 2Z" fill="currentColor"/>
        </svg>
        <span>${group.name}</span>
      `;
    } else {
      ghostHeader.innerHTML = `<span>${group.name}</span>`;
    }

    ghost.appendChild(ghostHeader);

    // Ghost 정보 추가
    const ghostInfo = document.createElement('div');
    ghostInfo.style.cssText = `
      position: absolute;
      bottom: 4px;
      left: 8px;
      font-size: 10px;
      color: ${group.color || '#4CAF50'};
      opacity: 0.8;
      user-select: none;
    `;
    ghostInfo.textContent = `${clips.length}개 클립`;
    ghost.appendChild(ghostInfo);

    // Ghost를 문서에 추가
    document.body.appendChild(ghost);

    // 정리 함수
    const cleanup = () => {
      if (ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
    };

    console.log('🎭 Ghost 드래그 시작:', {
      groupId: group.id.slice(-8),
      groupName: group.name,
      ghostPosition: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      originalStartTime: group.startTime.toFixed(2)
    });

    return {
      element: ghost,
      startX: e.clientX,
      originalStartTime: group.startTime,
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


  // 우클릭 핸들러
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isSelected) {
      onGroupSelect(group.id);
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [group.id, isSelected, onGroupSelect]);

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    const confirmed = await globalAlert.confirmDanger(`'${group.name}' 템플릿 그룹을 삭제하시겠습니까?\n\n그룹에 속한 모든 클립이 삭제됩니다.`);
    if (confirmed) {
      deleteTemplateGroup(group.id);
    }
    setContextMenu(null);
  }, [group.id, group.name, deleteTemplateGroup]);

  // 그룹 해제 핸들러
  const handleUngroup = useCallback(async () => {
    const confirmed = await globalAlert.confirmWarning(`'${group.name}' 템플릿 그룹을 해제하시겠습니까?\n\n클립은 유지되며 그룹만 해제됩니다.`);
    if (confirmed) {
      ungroupTemplate(group.id);
    }
    setContextMenu(null);
  }, [group.id, group.name, ungroupTemplate]);

  // 이름 변경 모달 열기
  const handleStartEditName = useCallback(() => {
    console.log('🔧 이름 변경 시작:', group.name);
    setShowRenameModal(true);
    setContextMenu(null);
  }, [group.name]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isMultiSelectMode = e.ctrlKey || e.metaKey;
    
    console.log('📋 템플릿 그룹 클릭:', {
      groupId: group.id.slice(-8),
      groupName: group.name,
      isMultiSelectMode,
      isBundleSelectionMode
    });
    
    if (isMultiSelectMode) {
      // Bundle 선택 모드 (Command/Ctrl + 클릭)
      const trackIndex = tracks.length > 0 ? tracks.findIndex(track => 
        track.clips.some(clip => group.clipIds.includes(clip.id))
      ) : 0;
      
      const selectedElement: SelectedElement = {
        id: group.id,
        type: 'templateGroup',
        name: group.name,
        startTime: group.startTime,
        endTime: group.endTime,
        trackIndex: trackIndex >= 0 ? trackIndex : 0
      };
      
      toggleBundleElementSelection(selectedElement);
      
      console.log('📦 Bundle 템플릿 그룹 선택 토글:', {
        groupId: group.id.slice(-8),
        groupName: group.name
      });
      
      return; // Bundle 선택 모드에서는 드래그 비활성화
    } else {
      // 일반 클릭 (Bundle 선택 모드 해제)
      clearBundleSelection();
      onGroupSelect(group.id);
    }

    if (!onGroupMove || !group.isProtected) return;

    // 🎭 Ghost 드래그 시스템 시작
    const dragGhost = createDragGhost(e);
    if (!dragGhost) return;

    dragGhostRef.current = dragGhost;
    const initialGhostLeft = parseFloat(dragGhost.element.style.left);

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragGhostRef.current) return;

      const deltaX = e.clientX - dragGhostRef.current.startX;

      // 🎭 Ghost 위치 업데이트 (단순하게 마우스 위치 따라가기)
      const ghost = dragGhostRef.current.element;
      const newLeft = initialGhostLeft + deltaX;
      ghost.style.left = `${newLeft}px`;

      console.log('🎭 Ghost 이동 중:', {
        deltaX: deltaX.toFixed(1),
        ghostLeft: newLeft.toFixed(1)
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragGhostRef.current) return;

      console.log('🎭 Ghost 드래그 완료');

      // 최종 이동 거리 계산
      const finalDeltaX = e.clientX - dragGhostRef.current.startX;

      console.log('📏 최종 이동 계산:', {
        startX: dragGhostRef.current.startX,
        endX: e.clientX,
        finalDeltaX,
        zoom
      });

      // 시간으로 변환
      let finalDeltaTime = finalDeltaX / zoom;

      // 경계 제한
      const newStartTime = dragGhostRef.current.originalStartTime + finalDeltaTime;
      if (newStartTime < 0) {
        finalDeltaTime = -dragGhostRef.current.originalStartTime;
      }

      // 스냅
      finalDeltaTime = Math.round(finalDeltaTime * 20) / 20;

      console.log('📊 최종 계산 결과:', {
        finalDeltaTime: finalDeltaTime.toFixed(3),
        newStartTime: (dragGhostRef.current.originalStartTime + finalDeltaTime).toFixed(2)
      });

      // 🎯 실제 그룹 이동 실행
      if (Math.abs(finalDeltaTime) > 0.01) {
        console.log('✅ 템플릿 그룹 이동 실행:', {
          groupId: group.id.slice(-8),
          deltaTime: finalDeltaTime.toFixed(3)
        });

        onGroupMove(group.id, finalDeltaTime);
      } else {
        console.log('🚫 이동 거리 미미하여 무시');
      }

      // 🧹 Ghost 정리
      dragGhostRef.current.cleanup();
      dragGhostRef.current = null;

      // 이벤트 리스너 제거
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // 🚪 ESC 키로 드래그 취소
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragGhostRef.current) {
        console.log('🚫 ESC 키로 드래그 취소');
        dragGhostRef.current.cleanup();
        dragGhostRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
  };

  if (!groupBounds) return null;

  return (
    <div
      ref={containerRef}
      className="template-group-container"
      style={{
        position: 'absolute',
        left: `${groupBounds.left}px`,
        top: `${groupBounds.top}px`,
        width: `${groupBounds.width}px`,
        height: `${groupBounds.height}px`,
        border: isBundleSelected 
          ? '3px dashed #FFD700' // Bundle 선택 시: 금색 점선 테두리
          : `2px solid ${group.color || '#4CAF50'}`,
        borderRadius: '8px',
        backgroundColor: `${group.color || '#4CAF50'}20`,
        cursor: group.isProtected ? 'grab' : 'pointer',
        transition: 'all 0.2s ease',
        zIndex: isSelected ? 1000 : 100,
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)' // Bundle 선택 시: 금색 글로우
          : isSelected 
            ? `0 0 0 2px ${group.color || '#4CAF50'}40` 
            : 'none',
        pointerEvents: 'all',
        // 🎭 드래그 중일 때 원본을 약간 어둡게 표시
        opacity: dragGhostRef.current ? 0.5 : 1
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      title={`${group.name} (템플릿 그룹) - ${group.isProtected ? '보호됨' : '일반'}`}
      data-group-id={group.id}
    >
      {/* 그룹 헤더 */}
      <div
        className="template-group-header"
        style={{
          position: 'absolute',
          top: '-24px',
          left: '0',
          backgroundColor: group.color || '#4CAF50',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px 4px 0 0',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          userSelect: 'none'
        }}
      >
        {group.isProtected && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M12 2L4 7V12C4 16.5 6.8 20.7 11 21.9C11.3 22 11.7 22 12 21.9C16.2 20.7 19 16.5 19 12V7L12 2Z"
              fill="currentColor"
            />
          </svg>
        )}
        <span onDoubleClick={handleStartEditName} style={{ cursor: 'text' }}>{group.name}</span>
      </div>

      {/* 그룹 정보 */}
      <div
        className="template-group-info"
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '8px',
          fontSize: '10px',
          color: group.color || '#4CAF50',
          opacity: 0.8,
          userSelect: 'none'
        }}
      >
        {clips.length}개 클립
      </div>

      {/* 🎯 드래그 준비 상태 표시 */}
      {group.isProtected && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            color: group.color || '#4CAF50',
            opacity: isSelected ? 0.6 : 0,
            transition: 'opacity 0.2s ease',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          드래그 가능
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <TemplateGroupContextMenu
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onRename={handleStartEditName}
          onUngroup={handleUngroup}
          onDelete={handleDelete}
        />
      )}

      {/* 이름 변경 모달 */}
      {showRenameModal && (
        <TemplateGroupRenameModal
          group={group}
          onClose={() => setShowRenameModal(false)}
        />
      )}
    </div>
  );
};