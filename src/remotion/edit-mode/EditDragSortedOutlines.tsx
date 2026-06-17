// 편집 모드용 다중 선택 지원 아웃라인 정렬 (Sequence 제거로 드래그 이벤트 간섭 해결)
import React from 'react';
import { EditDragSelectionOutline } from './EditDragSelectionOutline';
import type { EditDragItem } from './EditDragItem';

const displaySelectedItemsOnTop = (
  items: EditDragItem[],
  selectedItems: string[],
): EditDragItem[] => {
  const selectedItemsSet = new Set(selectedItems);
  const selected = items.filter((item) => selectedItemsSet.has(item.id));
  const unselected = items.filter((item) => !selectedItemsSet.has(item.id));
  return [...unselected, ...selected];
};

export const EditDragSortedOutlines: React.FC<{
  items: EditDragItem[];
  selectedItems: string[];
  changeItem: (itemId: string, updater: (item: EditDragItem) => EditDragItem) => void;
  changeMultipleItems: (itemIds: string[], updater: (item: EditDragItem) => EditDragItem) => void;
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ items, selectedItems, changeItem, changeMultipleItems, setSelectedItems }) => {
  // 오디오 클립을 제외한 아이템들만 처리
  const visualItems = React.useMemo(
    () => items.filter(item => item.mediaType !== 'audio'),
    [items]
  );
  
  const itemsToDisplay = React.useMemo(
    () => displaySelectedItemsOnTop(visualItems, selectedItems),
    [visualItems, selectedItems],
  );

  const isDragging = React.useMemo(
    () => visualItems.some((item) => item.isDragging),
    [visualItems],
  );

  return itemsToDisplay.map((item) => {
    return (
      <EditDragSelectionOutline
        key={item.id}
        changeItem={changeItem}
        changeMultipleItems={changeMultipleItems}
        item={item}
        allItems={visualItems}
        setSelectedItems={setSelectedItems}
        selectedItems={selectedItems}
        isDragging={isDragging}
      />
    );
  });
};
