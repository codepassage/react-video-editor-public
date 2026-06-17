// 📊 프리셋 그리드 컴포넌트
// 여러 프리셋 카드들을 그리드 형태로 배치하고 관리

import React from 'react';
import { TextPreset } from '../../../../types/presets/textPresets';
import PresetCard from './PresetCard';

interface PresetGridProps {
  presets: TextPreset[];
  onApplyPreset: (preset: TextPreset) => void;
  onToggleFavorite?: (presetId: string) => void;
  favorites?: string[];
  selectedPresetId?: string;
  sampleText?: string;
  columns?: number;
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * 📊 PresetGrid - 프리셋들을 그리드 형태로 표시하는 컴포넌트
 */
export const PresetGrid: React.FC<PresetGridProps> = ({
  presets,
  onApplyPreset,
  onToggleFavorite,
  favorites = [],
  selectedPresetId,
  sampleText = '샘플 텍스트',
  columns = 2,
  loading = false,
  emptyMessage = '프리셋이 없습니다.'
}) => {
  
  // 로딩 상태
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div 
              key={index}
              className="bg-gray-700 rounded-lg overflow-hidden animate-pulse"
            >
              {/* 미리보기 영역 스켈레톤 */}
              <div className="h-24 bg-gray-600" />
              
              {/* 정보 영역 스켈레톤 */}
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-600 rounded w-3/4" />
                <div className="h-3 bg-gray-600 rounded w-full" />
                <div className="h-3 bg-gray-600 rounded w-2/3" />
                <div className="flex space-x-2">
                  <div className="h-5 bg-gray-600 rounded-full w-12" />
                  <div className="h-5 bg-gray-600 rounded-full w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // 빈 상태
  if (presets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-medium text-white mb-2">프리셋 없음</h3>
        <p className="text-gray-400 text-sm max-w-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 그리드 헤더 정보 */}
      <div className="flex items-center justify-between text-sm text-gray-300">
        <span>
          총 <span className="font-medium text-white">{presets.length}</span>개 프리셋
        </span>
        
        {favorites.length > 0 && (
          <span className="flex items-center space-x-1">
            <span>⭐</span>
            <span>즐겨찾기 {favorites.length}개</span>
          </span>
        )}
      </div>
      
      {/* 프리셋 그리드 */}
      <div 
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            sampleText={sampleText}
            onApply={onApplyPreset}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(preset.id)}
            isSelected={preset.id === selectedPresetId}
          />
        ))}
      </div>
      
      {/* 더 보기 버튼 (향후 페이지네이션용) */}
      {presets.length >= 10 && (
        <div className="flex justify-center mt-6">
          <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
            더 많은 프리셋 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default PresetGrid;
