// 편집 모드용 메인 컴포지션 - 다중 선택, 격자, 키보드 지원
import React, { useCallback, useEffect, useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import type { EditDragItem } from './EditDragItem';
import { EditDragLayer } from './EditDragLayer';
import { EditDragSortedOutlines } from './EditDragSortedOutlines';
import { GRID_SIZE, snapToGrid } from './SnapUtils';

export type EditModeCompositionProps = {
  readonly items: EditDragItem[];
  readonly setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  readonly selectedItems: string[];
  readonly changeItem: (itemId: string, updater: (item: EditDragItem) => EditDragItem) => void;
  readonly changeMultipleItems: (itemIds: string[], updater: (item: EditDragItem) => EditDragItem) => void;
  readonly showGrid?: boolean;
  readonly onEditComplete?: (changes: { clipId: string; x: number; y: number; width: number; height: number }[]) => void;
  readonly compositionWidth?: number;
  readonly compositionHeight?: number;
};

const outer: React.CSSProperties = {
  backgroundColor: '#eee',
};

const layerContainer: React.CSSProperties = {
  overflow: 'hidden',
};

// 격자 렌더링 컴포넌트
const GridOverlay: React.FC<{ show: boolean; width: number; height: number }> = ({ 
  show, 
  width, 
  height 
}) => {
  if (!show) return null;

  const gridLines = [];
  
  // 수직 선
  for (let x = 0; x <= width; x += GRID_SIZE) {
    gridLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="rgba(100, 181, 246, 0.3)"
        strokeWidth={0.5}
      />
    );
  }
  
  // 수평 선
  for (let y = 0; y <= height; y += GRID_SIZE) {
    gridLines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="rgba(100, 181, 246, 0.3)"
        strokeWidth={0.5}
      />
    );
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {gridLines}
    </svg>
  );
};

export const EditModeComposition: React.FC<EditModeCompositionProps> = ({
  items,
  setSelectedItems,
  selectedItems,
  changeItem,
  changeMultipleItems,
  showGrid = false,
  onEditComplete,
  compositionWidth = 1920,
  compositionHeight = 1080,
}) => {
  
  // 아이템들을 레이어 순서대로 정렬 (위 트랙이 최상위가 되도록) + 오디오 클립 제외
  const sortedItems = useMemo(() => {
    return [...items]
      // 오디오 클립 필터링
      .filter(item => item.mediaType !== 'audio')
      .sort((a, b) => {
        // trackId에서 트랙 번호 추출 ("track-1" → 1)
        const aTrackNumber = a.trackId ? parseInt(a.trackId.replace('track-', '')) : 1;
        const bTrackNumber = b.trackId ? parseInt(b.trackId.replace('track-', '')) : 1;
        
        // 트랙 번호가 클수록 낮은 z-index (뒤에 렌더링)
        if (aTrackNumber !== bTrackNumber) {
          return bTrackNumber - aTrackNumber; // 높은 트랙 번호가 먼저 (뒤에 렌더링)
        }
        
        // 같은 트랙 내에서는 원래 순서 유지
        return 0;
      });
  }, [items]);
  // 배경 클릭 - 다중 선택 해제
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) {
      return;
    }
    // Ctrl 키를 누르지 않은 경우만 선택 해제
    if (!e.ctrlKey && !e.metaKey) {
      setSelectedItems([]);
    }
  }, [setSelectedItems]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItems.length === 0) return;

      let moved = false;
      let deltaX = 0;
      let deltaY = 0;
      
      // 이동 거리 결정 (Shift 키로 10px, 기본 1px)
      const moveStep = e.shiftKey ? 10 : 1;
      
      switch (e.key) {
        case 'ArrowLeft':
          deltaX = -moveStep;
          moved = true;
          break;
        case 'ArrowRight':
          deltaX = moveStep;
          moved = true;
          break;
        case 'ArrowUp':
          deltaY = -moveStep;
          moved = true;
          break;
        case 'ArrowDown':
          deltaY = moveStep;
          moved = true;
          break;
        case 'Delete':
        case 'Backspace':
          // TODO: 선택된 아이템 삭제 기능 추가
          e.preventDefault();
          return;
        case 'Enter':
          // Enter 키로 편집 완료 (모든 아이템의 변경사항 적용)
          if (onEditComplete) {
            const changes = sortedItems.map(item => ({
              clipId: item.originalClipId,
              x: item.left,
              y: item.top,
              width: item.width,
              height: item.height,
            }));

            onEditComplete(changes);
          }
          e.preventDefault();
          return;
      }
      
      if (moved) {
        e.preventDefault();
        
        // 선택된 모든 아이템 이동
        changeMultipleItems(selectedItems, (item) => {
          let newX = item.left + deltaX;
          let newY = item.top + deltaY;
          
          // 격자 스냅 (옵션)
          if (item.snapToGrid) {
            newX = snapToGrid(newX);
            newY = snapToGrid(newY);
          }
          
          // 범위 제한 (0 이상)
          newX = Math.max(0, newX);
          newY = Math.max(0, newY);
          
          return {
            ...item,
            left: newX,
            top: newY,
          };
        });
        

      }
    };

    // 키보드 이벤트 리스너 추가
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItems, changeMultipleItems, onEditComplete, sortedItems]);

  // 컴포지션 크기 (부모에서 전달받는 값 사용)
  const compositionSize = useMemo(() => ({ 
    width: compositionWidth,
    height: compositionHeight
  }), [compositionWidth, compositionHeight]);

  return (
    <AbsoluteFill style={outer} onPointerDown={onPointerDown}>
      {/* 격자 표시 */}
      <GridOverlay 
        show={showGrid} 
        width={compositionSize.width} 
        height={compositionSize.height} 
      />
      
      {/* 레이어 컴테이너 */}
      <AbsoluteFill style={layerContainer}>
        {sortedItems.map((item) => {
          return <EditDragLayer key={item.id} item={item} />;
        })}
      </AbsoluteFill>
      
      {/* 선택 아웃라인 */}
      <EditDragSortedOutlines
        selectedItems={selectedItems}
        items={sortedItems}
        setSelectedItems={setSelectedItems}
        changeItem={changeItem}
        changeMultipleItems={changeMultipleItems}
      />
      
      {/* 편집 모드 안내 */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(255, 107, 107, 0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        zIndex: 1000
      }}>
        🎨 편집 모드 | 마우스: 드래그 | Ctrl+클릭: 다중선택 | 화살표: 이동 | Enter: 적용 | ESC: 취소
      </div>
    </AbsoluteFill>
  );
};
