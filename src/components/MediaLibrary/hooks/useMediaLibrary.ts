import { useState } from 'react';
import { MediaItem } from '../../../types';

type TabType = 'local' | 'server';

/**
 * 미디어 라이브러리 기본 상태 관리 Hook
 */
export const useMediaLibrary = () => {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('local');
  
  // 서버 미디어 상태
  const [serverMediaItems, setServerMediaItems] = useState<MediaItem[]>([]);
  const [isLoadingServerMedia, setIsLoadingServerMedia] = useState(false);
  const [serverMediaError, setServerMediaError] = useState<string | null>(null);

  // 미디어 탭 전환
  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  // 서버 미디어 에러 클리어
  const clearServerError = () => {
    setServerMediaError(null);
  };

  // 서버 미디어 초기화
  const resetServerMedia = () => {
    setServerMediaItems([]);
    setServerMediaError(null);
  };

  return {
    // 탭 상태
    activeTab,
    setActiveTab,
    switchTab,
    
    // 서버 미디어 상태
    serverMediaItems,
    setServerMediaItems,
    isLoadingServerMedia,
    setIsLoadingServerMedia,
    serverMediaError,
    setServerMediaError,
    
    // 헬퍼 함수
    clearServerError,
    resetServerMedia,
  };
};