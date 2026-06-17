// 🎨 텍스트 프리셋 메인 패널 컴포넌트
// 프리셋 선택, 미리보기, 적용 기능을 통합한 완전한 인터페이스

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Filter, Star, Shuffle, Download } from 'lucide-react';
import { TextClip } from '../../../../types/clipTypes';
import { TextPreset, PresetCategory } from '../../../../types/presets/textPresets';
import { 
  CORE_TEXT_PRESETS, 
  getPresetsByCategory, 
  searchPresets,
  getPresetStats 
} from '../../../../data/presets/textPresets';
import CategoryTabs from './CategoryTabs';
import PresetGrid from './PresetGrid';

interface TextPresetPanelProps {
  clip: TextClip;
  onApplyPreset: (preset: TextPreset) => void;
  sampleText?: string;
}

/**
 * 🎨 TextPresetPanel - 텍스트 프리셋 선택 메인 패널
 */
export const TextPresetPanel: React.FC<TextPresetPanelProps> = ({
  clip,
  onApplyPreset,
  sampleText
}) => {
  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'recent'>('popularity');
  
  // 통계 정보
  const stats = useMemo(() => getPresetStats(), []);
  
  // 프리셋 필터링 및 정렬
  const filteredAndSortedPresets = useMemo(() => {
    let presets = CORE_TEXT_PRESETS;
    
    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      presets = getPresetsByCategory(selectedCategory);
    }
    
    // 검색 필터링
    if (searchQuery.trim()) {
      presets = searchPresets(searchQuery);
      // 검색 시에는 카테고리 필터링 무시하고 전체에서 검색
      if (selectedCategory !== 'all') {
        presets = presets.filter(p => p.category === selectedCategory);
      }
    }
    
    // 즐겨찾기 필터링
    if (showFavoritesOnly) {
      presets = presets.filter(p => favorites.includes(p.id));
    }
    
    // 정렬
    switch (sortBy) {
      case 'popularity':
        presets.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'name':
        presets.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        presets.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        break;
    }
    
    return presets;
  }, [selectedCategory, searchQuery, favorites, showFavoritesOnly, sortBy]);
  
  // 카테고리별 개수 계산
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CORE_TEXT_PRESETS.length };
    
    CORE_TEXT_PRESETS.forEach(preset => {
      counts[preset.category] = (counts[preset.category] || 0) + 1;
    });
    
    return counts;
  }, []);
  
  // 즐겨찾기 토글
  const handleToggleFavorite = useCallback((presetId: string) => {
    setFavorites(prev => 
      prev.includes(presetId) 
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  }, []);
  
  // 프리셋 적용
  const handleApplyPreset = useCallback((preset: TextPreset) => {
    onApplyPreset(preset);
  }, [onApplyPreset]);
  
  // 랜덤 프리셋 선택
  const handleRandomPreset = useCallback(() => {
    const availablePresets = filteredAndSortedPresets.length > 0 
      ? filteredAndSortedPresets 
      : CORE_TEXT_PRESETS;
    
    if (availablePresets.length > 0) {
      const randomPreset = availablePresets[Math.floor(Math.random() * availablePresets.length)];
      handleApplyPreset(randomPreset);
    }
  }, [filteredAndSortedPresets, handleApplyPreset]);
  
  return (
    <div className="space-y-6">
      {/* 헤더 - 통계 및 빠른 액션 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">텍스트 프리셋</h3>
          <p className="text-sm text-gray-400">
            {stats.totalPresets}개 프리셋 • {favorites.length}개 즐겨찾기
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 랜덤 프리셋 버튼 */}
          <button
            onClick={handleRandomPreset}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title="랜덤 프리셋 적용"
          >
            <Shuffle size={16} />
          </button>
          
          {/* 즐겨찾기 필터 토글 */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`p-2 rounded-lg transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={showFavoritesOnly ? '전체 보기' : '즐겨찾기만 보기'}
          >
            <Star size={16} className={showFavoritesOnly ? 'fill-current' : ''} />
          </button>
        </div>
      </div>
      
      {/* 검색 및 필터 */}
      <div className="space-y-4">
        {/* 검색바 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="프리셋 검색... (이름, 설명, 태그)"
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* 정렬 옵션 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <Filter size={14} className="text-gray-400" />
            <span className="text-gray-400">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-gray-700 border border-gray-600 rounded text-white text-sm px-2 py-1"
            >
              <option value="popularity">인기도순</option>
              <option value="name">이름순</option>
              <option value="recent">최신순</option>
            </select>
          </div>
          
          <span className="text-sm text-gray-400">
            {filteredAndSortedPresets.length}개 결과
          </span>
        </div>
      </div>
      
      {/* 카테고리 탭 */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryCounts={categoryCounts}
        showCounts={true}
      />
      
      {/* 프리셋 그리드 */}
      <PresetGrid
        presets={filteredAndSortedPresets}
        onApplyPreset={handleApplyPreset}
        onToggleFavorite={handleToggleFavorite}
        favorites={favorites}
        sampleText={sampleText || clip.text || '샘플 텍스트'}
        columns={2}
        emptyMessage={
          searchQuery 
            ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
            : showFavoritesOnly
            ? '즐겨찾기한 프리셋이 없습니다.'
            : '이 카테고리에는 프리셋이 없습니다.'
        }
      />
      
      {/* 프리셋 생성 안내 */}
      {filteredAndSortedPresets.length === 0 && !searchQuery && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-lg font-medium text-white mb-2">원하는 프리셋이 없나요?</h3>
          <p className="text-gray-400 text-sm mb-4">
            현재 스타일을 프리셋으로 저장하거나 직접 커스텀 프리셋을 만들어보세요.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
            <Download size={16} className="inline mr-2" />
            현재 스타일 저장
          </button>
        </div>
      )}
    </div>
  );
};

export default TextPresetPanel;
