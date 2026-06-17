import { useState } from 'react';
import { MediaItem } from '../../../types';

/**
 * 미디어 선택 관리 Hook
 */
export const useMediaSelection = () => {
  // 선택된 미디어 아이템들
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // 마지막으로 선택된 아이템
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null);

  // 아이템 선택/해제
  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        // 선택 해제
        const newSelection = prev.filter(id => id !== itemId);
        if (lastSelectedItem === itemId) {
          setLastSelectedItem(newSelection.length > 0 ? newSelection[newSelection.length - 1] : null);
        }
        return newSelection;
      } else {
        // 선택 추가
        setLastSelectedItem(itemId);
        return [...prev, itemId];
      }
    });
  };

  // 단일 아이템 선택 (기존 선택 해제)
  const selectSingle = (itemId: string) => {
    setSelectedItems([itemId]);
    setLastSelectedItem(itemId);
  };

  // 범위 선택 (Shift+클릭)
  const selectRange = (itemId: string, allItems: MediaItem[]) => {
    if (!lastSelectedItem) {
      selectSingle(itemId);
      return;
    }

    const lastIndex = allItems.findIndex(item => item.id === lastSelectedItem);
    const currentIndex = allItems.findIndex(item => item.id === itemId);

    if (lastIndex === -1 || currentIndex === -1) {
      selectSingle(itemId);
      return;
    }

    const start = Math.min(lastIndex, currentIndex);
    const end = Math.max(lastIndex, currentIndex);
    const rangeIds = allItems.slice(start, end + 1).map(item => item.id);

    setSelectedItems(prev => {
      const newSelection = Array.from(new Set([...prev, ...rangeIds]));
      return newSelection;
    });
    setLastSelectedItem(itemId);
  };

  // 모든 아이템 선택
  const selectAll = (allItems: MediaItem[]) => {
    const allIds = allItems.map(item => item.id);
    setSelectedItems(allIds);
    setLastSelectedItem(allIds.length > 0 ? allIds[allIds.length - 1] : null);
  };

  // 모든 선택 해제
  const clearSelection = () => {
    setSelectedItems([]);
    setLastSelectedItem(null);
  };

  // 선택된 아이템들의 데이터 가져오기
  const getSelectedItemsData = (allItems: MediaItem[]): MediaItem[] => {
    return allItems.filter(item => selectedItems.includes(item.id));
  };

  // 특정 아이템이 선택되었는지 확인
  const isSelected = (itemId: string): boolean => {
    return selectedItems.includes(itemId);
  };

  // 선택된 아이템 개수
  const selectedCount = selectedItems.length;

  // 모든 아이템이 선택되었는지 확인
  const isAllSelected = (allItems: MediaItem[]): boolean => {
    return allItems.length > 0 && selectedItems.length === allItems.length;
  };

  // 일부 아이템만 선택되었는지 확인 (중간 상태)
  const isPartiallySelected = (allItems: MediaItem[]): boolean => {
    return selectedItems.length > 0 && selectedItems.length < allItems.length;
  };

  return {
    // 상태
    selectedItems,
    lastSelectedItem,
    selectedCount,
    
    // 선택 함수들
    toggleSelection,
    selectSingle,
    selectRange,
    selectAll,
    clearSelection,
    
    // 유틸리티 함수들
    getSelectedItemsData,
    isSelected,
    isAllSelected,
    isPartiallySelected,
  };
};