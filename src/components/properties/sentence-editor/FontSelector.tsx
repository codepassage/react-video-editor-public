import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Zap } from 'lucide-react';
import { FontSelectorProps, FontCategory } from './types';
import { getFontCollection, getFontsByCategory, getKoreanFonts, searchFonts, getRecommendedFonts } from '../../../data/fonts';
import { detectAvailableFonts, getFontWithFallback } from '../../../utils/fontLoader';

export const FontSelector: React.FC<FontSelectorProps> = ({
  fontFamily,
  onFontSelect,
  className = '',
  disabled = false
}) => {
  // 상태 관리
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [selectedFontCategory, setSelectedFontCategory] = useState<FontCategory | 'all' | 'recommended'>('recommended');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [fontLoadingStatus, setFontLoadingStatus] = useState<Record<string, boolean>>({});
  const [isCheckingFonts, setIsCheckingFonts] = useState(false);
  const [fontCollection, setFontCollection] = useState<any[]>([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [recommendedFonts, setRecommendedFonts] = useState<string[]>([]);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  // 폰트 카테고리 옵션
  const fontCategoryOptions = [
    { value: 'recommended', label: '추천 폰트', icon: '⭐' },
    { value: 'all', label: '전체', icon: '📝' },
    { value: 'sans-serif', label: '고딕체', icon: '🔤' },
    { value: 'serif', label: '명조체', icon: '📜' },
    { value: 'display', label: '디스플레이', icon: '🎨' },
    { value: 'handwriting', label: '손글씨', icon: '✍️' },
    { value: 'monospace', label: '고정폭', icon: '💻' }
  ];

  // 폰트 컬렉션 로드
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const [fonts, recommended] = await Promise.all([
          getFontCollection(),
          getRecommendedFonts()
        ]);
        setFontCollection(fonts);
        setRecommendedFonts(recommended);
        setFontsLoaded(true);
      } catch (error) {
        console.error('폰트 컬렉션 로드 실패:', error);
        setFontCollection([]);
        setRecommendedFonts([]);
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

  // 폰트 로딩 상태 확인
  useEffect(() => {
    const checkFonts = async () => {
      if (!fontsLoaded || fontCollection.length === 0) return;

      setIsCheckingFonts(true);
      try {
        const fontList = fontCollection.map(f => f.family);
        const availableFonts = await detectAvailableFonts(fontList);
        const status: Record<string, boolean> = {};

        fontList.forEach(font => {
          status[font] = availableFonts.includes(font);
        });

        setFontLoadingStatus(status);
      } catch (error) {
        console.error('폰트 상태 확인 중 오류:', error);
      } finally {
        setIsCheckingFonts(false);
      }
    };

    checkFonts();
  }, [fontsLoaded, fontCollection]);

  // 폰트 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setShowFontDropdown(false);
      }
    };

    if (showFontDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFontDropdown]);

  // 폰트 필터링
  const filteredFonts = useMemo(async () => {
    if (!fontsLoaded || fontCollection.length === 0) return [];

    let fonts = fontCollection;

    // 카테고리 필터링
    if (selectedFontCategory === 'recommended') {
      fonts = fonts.filter(font => recommendedFonts.includes(font.family));
    } else if (selectedFontCategory !== 'all') {
      fonts = await getFontsByCategory(selectedFontCategory);
    }

    // 검색 필터링
    if (fontSearchQuery.trim()) {
      fonts = await searchFonts(fontSearchQuery);
    }

    return fonts;
  }, [selectedFontCategory, fontSearchQuery, fontsLoaded, fontCollection, recommendedFonts]);

  // 비동기 필터링 결과를 위한 state
  const [filteredFontList, setFilteredFontList] = useState<any[]>([]);

  // 필터링 결과 업데이트
  useEffect(() => {
    const updateFilteredFonts = async () => {
      const result = await filteredFonts;
      setFilteredFontList(result || []);
    };

    updateFilteredFonts();
  }, [filteredFonts]);

  // 현재 선택된 폰트 정보
  const currentFont = useMemo(() => {
    if (fontCollection.length === 0) {
      return { name: '기본 폰트', family: 'Arial', description: '로딩 중...' };
    }
    return fontCollection.find(font => font.family === fontFamily) || fontCollection[0];
  }, [fontFamily, fontCollection]);

  // 폰트 선택 핸들러
  const handleFontSelect = (selectedFontFamily: string) => {
    // 폰트 fallback 적용
    const fontWithFallback = getFontWithFallback(selectedFontFamily);
    onFontSelect(selectedFontFamily);
    setShowFontDropdown(false);

    // 로딩 상태 확인
    if (!fontLoadingStatus[selectedFontFamily]) {
      console.warn(`⚠️ 폰트 "${selectedFontFamily}"가 로드되지 않았을 수 있습니다. fallback: ${fontWithFallback}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            setShowFontDropdown(!showFontDropdown);
          }
        }}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left flex items-center justify-between transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-600'
        }`}
      >
        <div className="flex items-center space-x-3">
          <span
            className="text-lg"
            style={{ fontFamily: currentFont.family }}
          >
            가Ab
          </span>
          <div>
            <div className="font-medium">{currentFont.name}</div>
            <div className="text-xs text-gray-400">{currentFont.description}</div>
          </div>
        </div>
        <Search size={16} className="text-gray-400" />
      </button>

      {/* 폰트 드롭다운 */}
      {showFontDropdown && !disabled && (
        <div 
          ref={fontDropdownRef}
          className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-96"
        >
          {/* 검색 및 카테고리 필터 */}
          <div className="p-3 border-b border-gray-600 space-y-3">
            {/* 검색바 */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={fontSearchQuery}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFontSearchQuery(e.target.value);
                }}
                placeholder="폰트 검색..."
                className="w-full pl-10 pr-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-1">
              {fontCategoryOptions.map(option => (
                <button
                  key={option.value}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedFontCategory(option.value as any);
                  }}
                  className={`px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors ${
                    selectedFontCategory === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 폰트 목록 */}
          <div className="max-h-80 overflow-y-auto pb-2 bg-gray-700">
            {isCheckingFonts && (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                폰트 상태 확인 중...
              </div>
            )}
            {filteredFontList.map(font => (
              <button
                key={font.family}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFontSelect(font.family);
                }}
                className={`w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors flex items-center space-x-3 ${
                  fontFamily === font.family ? 'bg-blue-600/30' : ''
                }`}
              >
                <span
                  className="text-lg w-12 text-center font-preview"
                  style={{
                    fontFamily: `"${font.family}", Arial`,
                    fontFeatureSettings: 'normal',
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                >
                  가Ab
                </span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="text-white font-medium">{font.name}</div>
                  </div>
                  <div className="text-xs text-gray-400">{font.description}</div>
                </div>
                {font.isKorean && (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">한글</span>
                )}
              </button>
            ))}

            {filteredFontList.length === 0 && (
              <div className="p-4 text-center text-gray-400">
                검색 결과가 없습니다.
              </div>
            )}
          </div>

          {/* 추천 폰트 바로가기 */}
          {selectedFontCategory !== 'recommended' && (
            <div className="p-3 border-t border-gray-600">
              <div className="text-xs text-gray-400 mb-2 flex items-center space-x-1">
                <Zap size={12} />
                <span>유튜브 영상 추천 폰트</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {recommendedFonts.slice(0, 3).map(fontFamilyItem => {
                  const font = fontCollection.find(f => f.family === fontFamilyItem);
                  return font ? (
                    <button
                      key={fontFamilyItem}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFontSelect(fontFamilyItem);
                      }}
                      className="px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded text-xs hover:bg-yellow-600/30 transition-colors"
                    >
                      {font.name}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FontSelector;
