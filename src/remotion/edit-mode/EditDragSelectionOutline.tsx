// 편집 모드용 선택 아웃라인 - 다중 선택, 그룹 드래그, 스냅 기능
import React, { useCallback, useMemo } from 'react';
import { useCurrentScale } from 'remotion';
import { EditDragResizeHandle } from './EditDragResizeHandle';
import { getAlignmentGuides, applyMagneticSnap, snapToGrid } from './SnapUtils';
import type { EditDragItem } from './EditDragItem';

// 정렬 가이드라인 렌더링 컴포넌트
const AlignmentGuides: React.FC<{
  guides: {
    vertical: Array<{ x: number; fromY: number; toY: number }>;
    horizontal: Array<{ y: number; fromX: number; toX: number }>;
  };
}> = ({ guides }) => {
  if (guides.vertical.length === 0 && guides.horizontal.length === 0) {
    return null;
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
        zIndex: 999,
      }}
    >
      {/* 수직 가이드라인 */}
      {guides.vertical.map((guide, index) => (
        <line
          key={`v-${index}`}
          x1={guide.x}
          y1={guide.fromY}
          x2={guide.x}
          y2={guide.toY}
          stroke="#ff6b6b"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}
      
      {/* 수평 가이드라인 */}
      {guides.horizontal.map((guide, index) => (
        <line
          key={`h-${index}`}
          x1={guide.fromX}
          y1={guide.y}
          x2={guide.toX}
          y2={guide.y}
          stroke="#ff6b6b"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}
    </svg>
  );
};

export const EditDragSelectionOutline: React.FC<{
  item: EditDragItem;
  allItems: EditDragItem[]; // 모든 아이템 정보 추가
  changeItem: (itemId: string, updater: (item: EditDragItem) => EditDragItem) => void;
  changeMultipleItems: (itemIds: string[], updater: (item: EditDragItem) => EditDragItem) => void;
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  selectedItems: string[];
  isDragging: boolean;
}> = ({ item, allItems, changeItem, changeMultipleItems, setSelectedItems, selectedItems, isDragging }) => {
  const scale = useCurrentScale();
  const scaledBorder = Math.ceil(2 / scale);
  
  const [hovered, setHovered] = React.useState(false);
  const [alignmentGuides, setAlignmentGuides] = React.useState<{
    vertical: Array<{ x: number; fromY: number; toY: number }>;
    horizontal: Array<{ y: number; fromX: number; toX: number }>;
  }>({ vertical: [], horizontal: [] });

  const onMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const isSelected = selectedItems.includes(item.id);
  const isOnlySelected = isSelected && selectedItems.length === 1;

  const style: React.CSSProperties = useMemo(() => {
    return {
      width: item.width,
      height: item.height,
      left: item.left,
      top: item.top,
      position: 'absolute',
      outline: (hovered && !isDragging) || isSelected 
        ? `${scaledBorder}px solid ${isSelected ? '#0B84F3' : '#64b5f6'}` 
        : undefined,
      backgroundColor: isSelected ? 'rgba(11, 132, 243, 0.1)' : undefined,
      userSelect: 'none',
      touchAction: 'none',
    };
  }, [item, hovered, isDragging, isSelected, scaledBorder]);

  // 그룹 드래그 시작
  const startGroupDragging = useCallback((e: PointerEvent | React.MouseEvent, allItems: EditDragItem[]) => {
    const initialX = e.clientX;
    const initialY = e.clientY;

    // 선택된 모든 아이템의 원래 위치 저장
    const selectedItemsData = selectedItems.map(id => {
      const selectedItem = allItems.find(item => item.id === id);
      return selectedItem ? {
        id,
        originalLeft: selectedItem.left,
        originalTop: selectedItem.top,
      } : null;
    }).filter(Boolean) as Array<{ id: string; originalLeft: number; originalTop: number }>;

    const onPointerMove = (pointerMoveEvent: PointerEvent) => {
      const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
      const offsetY = (pointerMoveEvent.clientY - initialY) / scale;

      // 선택된 모든 아이템 이동
      changeMultipleItems(selectedItems, (item) => {
        const originalData = selectedItemsData.find(d => d.id === item.id);
        if (!originalData) return item;

        let newX = originalData.originalLeft + offsetX;
        let newY = originalData.originalTop + offsetY;

        // 스냅 기능 적용 (첫 번째 선택 아이템 기준)
        if (item.id === selectedItems[0]) {
          const otherItems = allItems.filter(otherItem => 
            !selectedItems.includes(otherItem.id)
          );

          if (otherItems.length > 0) {
            const guides = getAlignmentGuides(
              { left: newX, top: newY, width: item.width, height: item.height },
              otherItems
            );

            setAlignmentGuides(guides);

            // 자석 효과 적용
            const snapped = applyMagneticSnap(
              newX, newY, 
              { width: item.width, height: item.height },
              otherItems
            );

            if (snapped.x !== newX || snapped.y !== newY) {
              // 모든 선택된 아이템에 스냅 오프셋 적용
              const snapOffsetX = snapped.x - newX;
              const snapOffsetY = snapped.y - newY;
              
              return {
                ...item,
                left: originalData.originalLeft + offsetX + snapOffsetX,
                top: originalData.originalTop + offsetY + snapOffsetY,
                isDragging: true,
              };
            }
          }

          // 격자 스냅
          if (item.snapToGrid) {
            newX = snapToGrid(newX);
            newY = snapToGrid(newY);
          }
        }

        // 범위 제한
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        return {
          ...item,
          left: newX,
          top: newY,
          isDragging: true,
        };
      });
    };

    const onPointerUp = () => {
      // 드래그 종료
      changeMultipleItems(selectedItems, (item) => ({
        ...item,
        isDragging: false,
      }));
      
      setAlignmentGuides({ vertical: [], horizontal: [] });
      window.removeEventListener('pointermove', onPointerMove);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { once: true });
  }, [selectedItems, scale, changeMultipleItems]);

  // 단일 드래그 (기존 로직)
  const startSingleDragging = useCallback((e: PointerEvent | React.MouseEvent, allItems: EditDragItem[]) => {
    const initialX = e.clientX;
    const initialY = e.clientY;

    const onPointerMove = (pointerMoveEvent: PointerEvent) => {
      const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
      const offsetY = (pointerMoveEvent.clientY - initialY) / scale;

      changeItem(item.id, (i) => {
        let newX = item.left + offsetX;
        let newY = item.top + offsetY;

        // 다른 아이템들과의 정렬 가이드
        const otherItems = allItems.filter(otherItem => otherItem.id !== item.id);
        if (otherItems.length > 0) {
          const guides = getAlignmentGuides(
            { left: newX, top: newY, width: item.width, height: item.height },
            otherItems
          );

          setAlignmentGuides(guides);

          // 자석 효과
          const snapped = applyMagneticSnap(
            newX, newY,
            { width: item.width, height: item.height },
            otherItems
          );
          newX = snapped.x;
          newY = snapped.y;
        }

        // 격자 스냅
        if (i.snapToGrid) {
          newX = snapToGrid(newX);
          newY = snapToGrid(newY);
        }

        // 범위 제한
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        return {
          ...i,
          left: newX,
          top: newY,
          isDragging: true,
        };
      });
    };

    const onPointerUp = () => {
      changeItem(item.id, (i) => ({
        ...i,
        isDragging: false,
      }));
      
      setAlignmentGuides({ vertical: [], horizontal: [] });
      window.removeEventListener('pointermove', onPointerMove);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { once: true });
  }, [item, scale, changeItem]);

  const onPointerDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) {
      return;
    }

    // Ctrl/Cmd + 클릭: 다중 선택 토글
    if (e.ctrlKey || e.metaKey) {
      setSelectedItems(prev => {
        if (prev.includes(item.id)) {
          // 이미 선택된 경우 제거
          return prev.filter(id => id !== item.id);
        } else {
          // 선택되지 않은 경우 추가
          return [...prev, item.id];
        }
      });
      return; // 드래그 시작하지 않음
    }

    // 단일 선택
    if (!isSelected) {
      setSelectedItems([item.id]);
    }

    // 드래그 시작
    if (selectedItems.length > 1 && isSelected) {
      // 그룹 드래그
      startGroupDragging(e, allItems);
    } else {
      // 단일 드래그
      startSingleDragging(e, allItems);
    }
  }, [item.id, isSelected, selectedItems, setSelectedItems, startGroupDragging, startSingleDragging, allItems]);

  return (
    <>
      {/* 정렬 가이드라인 */}
      <AlignmentGuides guides={alignmentGuides} />
      
      {/* 선택 아웃라인 */}
      <div
        onPointerDown={onPointerDown}
        onPointerEnter={onMouseEnter}
        onPointerLeave={onMouseLeave}
        style={style}
      >
        {/* 리사이즈 핸들 (단일 선택 시만) */}
        {isOnlySelected ? (
          <>
            <EditDragResizeHandle item={item} setItem={changeItem} type="top-left" />
            <EditDragResizeHandle item={item} setItem={changeItem} type="top-right" />
            <EditDragResizeHandle item={item} setItem={changeItem} type="bottom-left" />
            <EditDragResizeHandle item={item} setItem={changeItem} type="bottom-right" />
          </>
        ) : null}
        
        {/* 다중 선택 표시 */}
        {selectedItems.length > 1 && isSelected && (
          <div style={{
            position: 'absolute',
            top: -20,
            left: 0,
            background: 'rgba(11, 132, 243, 0.9)',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '8px',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            {selectedItems.length}개 선택
          </div>
        )}
      </div>
    </>
  );
};
