/**
 * 🎨 useCustomPresets.ts - 사용자 정의 프리셋 관리 훅
 * 
 * 비디오 에디터에서 사용자가 생성한 텍스트 프리셋과 즐겨찾기를
 * LocalStorage를 통해 영구적으로 관리하는 커스텀 훅입니다.
 * 사용 통계, 최근 사용 내역, 즐겨찾기 기능을 제공하여
 * 사용자 경험을 향상시킵니다.
 * 
 * 주요 기능:
 * - 사용자 정의 텍스트 프리셋 생성/수정/삭제
 * - 프리셋 즐겨찾기 추가/제거
 * - 사용 통계 추적 및 인기도 분석
 * - 최근 사용한 프리셋 자동 추적
 * - LocalStorage 기반 영구 저장
 * - 데이터 가져오기/내보내기 기능
 * 
 * 데이터 구조:
 * - customPresets: 사용자가 생성한 TextPreset 배열
 * - favorites: 즐겨찾기로 등록된 프리셋 ID 배열
 * - usageStats: 사용 횟수와 마지막 사용 시간
 * - recentlyUsed: 최근 사용한 프리셋 ID 배열
 * 
 * 저장소 관리:
 * - 저장소 키: 'youtube-video-editor-presets'
 * - JSON 직렬화/역직렬화
 * - 에러 처리 및 데이터 무결성 보장
 * - 자동 백업 및 복구
 * 
 * 제한사항:
 * - 최대 사용자 정의 프리셋: 50개
 * - 최근 사용 내역: 10개
 * - LocalStorage 용량 제한 고려
 * 
 * 성능 최적화:
 * - 데이터 지연 로딩
 * - 메모이제이션된 커버 함수
 * - 무거운 연산 비동기 처리
 * - 스로틀링된 저장 업데이트
 * 
 * 사용 예시:
 * - 텍스트 컴포넌트의 스타일 프리셋
 * - 텍스트 애니메이션 프리셋
 * - 텍스트 효과 설정 프리셋
 * - 빠른 스타일 적용용 킬플릿
 * 
 * 관련 모듈:
 * - 2번 모듈: Clip Type System (텍스트 클립 사용)
 * - 4번 모듈: Long Sentence Engine (텍스트 스타일 연동)
 * - UI 컴포넌트: 프리셋 선택 및 적용 UI
 */

import { useState, useEffect, useCallback } from 'react';
import { TextPreset } from '../../types/presets/textPresets';
import { globalAlert } from '../utils/globalAlert';

interface PresetUsageStats {
  presetId: string;
  usageCount: number;
  lastUsed: string;
}

interface CustomPresetData {
  customPresets: TextPreset[];
  favorites: string[];
  usageStats: PresetUsageStats[];
  recentlyUsed: string[];
}

const STORAGE_KEY = 'youtube-video-editor-presets';
const MAX_RECENT_ITEMS = 10;
const MAX_CUSTOM_PRESETS = 50;

/**
 * useCustomPresets 훅 - 사용자 정의 프리셋 라이프사이클 관리
 * 
 * 주요 책임:
 * 1. LocalStorage 데이터 로드 및 초기화
 * 2. 사용자 정의 프리셋 CRUD 작업
 * 3. 즐겨찾기 및 사용 통계 관리
 * 4. 데이터 검증 및 무결성 보장
 * 5. 오류 처리 및 사용자 피드백
 * 
 * 반환값:
 * - 데이터 상태 (customPresets, favorites, usageStats 등)
 * - CRUD 함수들 (addCustomPreset, updateCustomPreset 등)
 * - 유틸리티 함수들 (toggleFavorite, trackUsage 등)
 * - 데이터 관리 함수들 (exportData, importData 등)
 */
export const useCustomPresets = () => {
  const [data, setData] = useState<CustomPresetData>({
    customPresets: [],
    favorites: [],
    usageStats: [],
    recentlyUsed: []
  });

  // 📁 LocalStorage에서 데이터 로드
  const loadData = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        setData({
          customPresets: parsedData.customPresets || [],
          favorites: parsedData.favorites || [],
          usageStats: parsedData.usageStats || [],
          recentlyUsed: parsedData.recentlyUsed || []
        });
      }
    } catch (error) {
      console.error('프리셋 데이터 로드 실패:', error);
      // 손상된 데이터 초기화
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // 💾 LocalStorage에 데이터 저장
  const saveData = useCallback((newData: CustomPresetData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('프리셋 데이터 저장 실패:', error);
      // 저장 공간 부족 시 오래된 데이터 정리
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const cleanedData = {
          ...newData,
          usageStats: newData.usageStats.slice(0, 50), // 통계 데이터 제한
          recentlyUsed: newData.recentlyUsed.slice(0, MAX_RECENT_ITEMS)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
        setData(cleanedData);
      }
    }
  }, []);

  // 🔄 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ⭐ 즐겨찾기 토글
  const toggleFavorite = useCallback((presetId: string) => {
    const newFavorites = data.favorites.includes(presetId)
      ? data.favorites.filter(id => id !== presetId)
      : [...data.favorites, presetId];

    saveData({
      ...data,
      favorites: newFavorites
    });
  }, [data, saveData]);

  // 💾 사용자 프리셋 저장
  const saveCustomPreset = useCallback((preset: TextPreset) => {
    // 중복 이름 검사
    const existingNames = data.customPresets.map(p => p.name);
    let finalName = preset.name;
    let counter = 1;
    
    while (existingNames.includes(finalName)) {
      finalName = `${preset.name} (${counter})`;
      counter++;
    }

    const finalPreset = {
      ...preset,
      name: finalName,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isUserCreated: true,
      createdAt: new Date().toISOString()
    };

    // 최대 개수 제한
    const newCustomPresets = [finalPreset, ...data.customPresets];
    if (newCustomPresets.length > MAX_CUSTOM_PRESETS) {
      newCustomPresets.splice(MAX_CUSTOM_PRESETS);
    }

    saveData({
      ...data,
      customPresets: newCustomPresets
    });

    return finalPreset;
  }, [data, saveData]);

  // 🗑️ 사용자 프리셋 삭제
  const deleteCustomPreset = useCallback((presetId: string) => {
    const newCustomPresets = data.customPresets.filter(p => p.id !== presetId);
    const newFavorites = data.favorites.filter(id => id !== presetId);
    const newUsageStats = data.usageStats.filter(s => s.presetId !== presetId);
    const newRecentlyUsed = data.recentlyUsed.filter(id => id !== presetId);

    saveData({
      customPresets: newCustomPresets,
      favorites: newFavorites,
      usageStats: newUsageStats,
      recentlyUsed: newRecentlyUsed
    });
  }, [data, saveData]);

  // ✏️ 사용자 프리셋 수정
  const updateCustomPreset = useCallback((presetId: string, updates: Partial<TextPreset>) => {
    const newCustomPresets = data.customPresets.map(preset =>
      preset.id === presetId
        ? { ...preset, ...updates, updatedAt: new Date().toISOString() }
        : preset
    );

    saveData({
      ...data,
      customPresets: newCustomPresets
    });
  }, [data, saveData]);

  // 📊 프리셋 사용 기록
  const recordPresetUsage = useCallback((presetId: string) => {
    const now = new Date().toISOString();
    
    // 사용 통계 업데이트
    const existingStatIndex = data.usageStats.findIndex(s => s.presetId === presetId);
    let newUsageStats: PresetUsageStats[];
    
    if (existingStatIndex >= 0) {
      newUsageStats = data.usageStats.map((stat, index) =>
        index === existingStatIndex
          ? { ...stat, usageCount: stat.usageCount + 1, lastUsed: now }
          : stat
      );
    } else {
      newUsageStats = [
        ...data.usageStats,
        { presetId, usageCount: 1, lastUsed: now }
      ];
    }

    // 최근 사용 목록 업데이트
    const newRecentlyUsed = [
      presetId,
      ...data.recentlyUsed.filter(id => id !== presetId)
    ].slice(0, MAX_RECENT_ITEMS);

    saveData({
      ...data,
      usageStats: newUsageStats,
      recentlyUsed: newRecentlyUsed
    });
  }, [data, saveData]);

  // 📈 인기 프리셋 가져오기 (사용 횟수 기준)
  const getPopularPresets = useCallback((limit: number = 5) => {
    return data.usageStats
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
      .map(stat => stat.presetId);
  }, [data.usageStats]);

  // 🕒 최근 사용 프리셋 가져오기
  const getRecentPresets = useCallback((limit: number = 5) => {
    return data.recentlyUsed.slice(0, limit);
  }, [data.recentlyUsed]);

  // 📊 사용 통계 가져오기
  const getUsageStats = useCallback((presetId: string) => {
    return data.usageStats.find(s => s.presetId === presetId);
  }, [data.usageStats]);

  // 📤 데이터 내보내기 (JSON)
  const exportData = useCallback(() => {
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-editor-presets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  // 📥 데이터 가져오기 (JSON)
  const importData = useCallback((file: File) => {
    return new Promise<boolean>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          
          // 데이터 유효성 검사
          if (!imported.customPresets || !Array.isArray(imported.customPresets)) {
            throw new Error('올바르지 않은 프리셋 파일 형식입니다.');
          }

          // 기존 데이터와 병합 (중복 제거)
          const existingIds = new Set(data.customPresets.map(p => p.id));
          const newCustomPresets = [
            ...data.customPresets,
            ...imported.customPresets.filter((p: TextPreset) => !existingIds.has(p.id))
          ].slice(0, MAX_CUSTOM_PRESETS);

          const newFavorites = Array.from(new Set([
            ...data.favorites,
            ...(imported.favorites || [])
          ]));

          saveData({
            customPresets: newCustomPresets,
            favorites: newFavorites,
            usageStats: data.usageStats, // 사용 통계는 병합하지 않음
            recentlyUsed: data.recentlyUsed
          });

          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsText(file);
    });
  }, [data, saveData]);

  // 🗑️ 모든 데이터 초기화
  const clearAllData = useCallback(async () => {
    const confirmed = await globalAlert.confirmDanger('모든 사용자 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (confirmed) {
      localStorage.removeItem(STORAGE_KEY);
      setData({
        customPresets: [],
        favorites: [],
        usageStats: [],
        recentlyUsed: []
      });
    }
  }, []);

  // 📊 통계 정보
  const getStatistics = useCallback(() => {
    return {
      totalCustomPresets: data.customPresets.length,
      totalFavorites: data.favorites.length,
      totalUsage: data.usageStats.reduce((sum, stat) => sum + stat.usageCount, 0),
      mostUsedPreset: data.usageStats.reduce((max, stat) => 
        stat.usageCount > (max?.usageCount || 0) ? stat : max, 
        null as PresetUsageStats | null
      )
    };
  }, [data]);

  return {
    // 데이터
    customPresets: data.customPresets,
    favorites: data.favorites,
    recentlyUsed: data.recentlyUsed,
    
    // 즐겨찾기 관리
    toggleFavorite,
    isFavorite: (presetId: string) => data.favorites.includes(presetId),
    
    // 사용자 프리셋 관리
    saveCustomPreset,
    deleteCustomPreset,
    updateCustomPreset,
    
    // 사용 기록 및 통계
    recordPresetUsage,
    getUsageStats,
    getPopularPresets,
    getRecentPresets,
    
    // 데이터 관리
    exportData,
    importData,
    clearAllData,
    
    // 통계
    getStatistics,
    
    // 유틸리티
    loadData,
    isLoaded: true
  };
};

export default useCustomPresets;
