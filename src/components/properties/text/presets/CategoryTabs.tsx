// 📂 카테고리 탭 컴포넌트
// 프리셋을 카테고리별로 필터링할 수 있는 탭 인터페이스

import React from 'react';
import { PresetCategory, PresetCategoryInfo } from '../../../../types/presets/textPresets';
import { PRESET_CATEGORIES } from '../../../../data/presets/textPresets';

interface CategoryTabsProps {
  selectedCategory: PresetCategory | 'all';
  onCategoryChange: (category: PresetCategory | 'all') => void;
  categoryCounts?: Record<string, number>;
  showCounts?: boolean;
}

/**
 * 📂 CategoryTabs - 프리셋 카테고리 선택 탭 컴포넌트
 */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts = {},
  showCounts = true
}) => {
  
  // '전체' 탭을 포함한 완전한 탭 목록
  const allTabs = [
    {
      id: 'all' as const,
      name: '전체',
      description: '모든 프리셋 보기',
      icon: '🎨',
      color: '#6B7280'
    },
    ...PRESET_CATEGORIES
  ];
  
  return (
    <div className="space-y-4">
      {/* 모바일용 드롭다운 (작은 화면) */}
      <div className="block sm:hidden">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as PresetCategory | 'all')}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
        >
          {allTabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.icon} {tab.name} 
              {showCounts && categoryCounts[tab.id] !== undefined && ` (${categoryCounts[tab.id]})`}
            </option>
          ))}
        </select>
      </div>
      
      {/* 데스크톱용 탭 버튼들 */}
      <div className="hidden sm:block">
        <div className="flex flex-wrap gap-2">
          {allTabs.map(tab => {
            const isSelected = selectedCategory === tab.id;
            const count = categoryCounts[tab.id];
            
            return (
              <button
                key={tab.id}
                onClick={() => onCategoryChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                title={tab.description}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.name}</span>
                {showCounts && count !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    isSelected 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* 선택된 카테고리 정보 */}
      {selectedCategory !== 'all' && (
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600/30">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {PRESET_CATEGORIES.find(cat => cat.id === selectedCategory)?.icon}
            </span>
            <div>
              <h3 className="font-medium text-white">
                {PRESET_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
              </h3>
              <p className="text-sm text-gray-400">
                {PRESET_CATEGORIES.find(cat => cat.id === selectedCategory)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {selectedCategory === 'all' && (
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600/30">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎨</span>
            <div>
              <h3 className="font-medium text-white">전체 프리셋</h3>
              <p className="text-sm text-gray-400">
                모든 카테고리의 프리셋을 한 번에 확인하세요
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTabs;
