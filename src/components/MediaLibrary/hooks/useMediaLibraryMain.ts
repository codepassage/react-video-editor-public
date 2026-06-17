import { useState, useEffect } from 'react';
import { MediaItem } from '../../../types';
import { useEditorStore } from '../../../store/editorStore';
import { mediaService } from '../services/mediaService';

type TabType = 'local' | 'server';

/**
 * 미디어 라이브러리 메인 관리 Hook
 */
export const useMediaLibraryMain = () => {
  const { mediaLibrary, removeMediaItem, addMediaItem } = useEditorStore();
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('local');
  
  // 서버 미디어 상태
  const [serverMediaItems, setServerMediaItems] = useState<MediaItem[]>([]);
  const [isLoadingServerMedia, setIsLoadingServerMedia] = useState(false);
  const [serverMediaError, setServerMediaError] = useState<string | null>(null);

  // 서버 미디어 불러오기
  const loadServerMedia = async () => {
    setIsLoadingServerMedia(true);
    setServerMediaError(null);

    const { mediaItems, error } = await mediaService.loadServerMedia();
    
    setServerMediaItems(mediaItems);
    setServerMediaError(error);
    setIsLoadingServerMedia(false);
  };

  // 탭 변경 시 서버 미디어 불러오기
  useEffect(() => {
    if (activeTab === 'server') {
      loadServerMedia();
    }
  }, [activeTab]);

  // 서버 미디어 아이템을 로컬에 추가
  const addServerMediaToLocal = async (item: MediaItem) => {
    // 이미 추가된 아이템인지 확인
    if (!mediaService.canAddServerMediaToLocal(item, mediaLibrary)) {
      console.log('이미 추가된 미디어입니다:', item.name);
      return;
    }

    try {
      // 새로운 ID로 복사하여 추가
      const localItem: MediaItem = {
        ...item,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      addMediaItem(localItem);
      console.log('서버 미디어를 로컬에 추가했습니다:', localItem.name);
    } catch (error) {
      console.error('서버 미디어 추가 실패:', error);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // 현재 활성 미디어 아이템들
  const getCurrentMediaItems = (): MediaItem[] => {
    return activeTab === 'local' ? mediaLibrary : serverMediaItems;
  };

  // 미디어 아이템 제거
  const handleRemoveMediaItem = (itemId: string) => {
    removeMediaItem(itemId);
  };

  // 서버 미디어 새로고침
  const refreshServerMedia = () => {
    loadServerMedia();
  };

  return {
    // 상태
    activeTab,
    mediaLibrary,
    serverMediaItems,
    isLoadingServerMedia,
    serverMediaError,
    
    // 함수
    handleTabChange,
    loadServerMedia,
    refreshServerMedia,
    addServerMediaToLocal,
    handleRemoveMediaItem,
    getCurrentMediaItems,
  };
};