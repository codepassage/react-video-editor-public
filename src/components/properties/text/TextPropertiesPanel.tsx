import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Type, Palette, AlignLeft, AlignCenter, AlignRight, Italic, Underline, Sparkles, Save, Settings, Search, Zap } from 'lucide-react';
import { TextClip } from '../../../types/clipTypes';
import { TextPreset } from '../../../types/presets/textPresets';
import { applyPresetToClip } from '../../../utils/presets/presetUtils';
import { getFontCollection, getFontsByCategory, getKoreanFonts, searchFonts, getRecommendedFonts, FontCategory } from '../../../data/fonts';
import { debugFontLoading, getFontWithFallback, measureFontLoadingPerformance, detectAvailableFonts } from '../../../utils/fontLoader';
import TextPresetPanel from './presets/TextPresetPanel';
import SavePresetModal from './presets/SavePresetModal';
import PresetManagementPanel from './presets/PresetManagementPanel';
import useCustomPresets from '../../../hooks/useCustomPresets';
import { globalAlert } from '../../../utils/globalAlert';

interface TextPropertiesPanelProps {
    clip: TextClip;
    onUpdate: (clipId: string, updates: Partial<TextClip>) => void;
}

/**
 * Text 클립 전용 속성 패널
 * @description Text 클립에 최적화된 통합 인터페이스 제공
 * - 텍스트 편집 기능 (내용, 폰트, 스타일)
 * - 프리셋 시스템
 * - 색상 및 효과 관리
 */
export const TextPropertiesPanel: React.FC<TextPropertiesPanelProps> = ({
    clip,
    onUpdate
}) => {
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'presets' | 'manage'>('content');
    const [showColorPicker, setShowColorPicker] = useState<'text' | 'background' | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [fontSearchQuery, setFontSearchQuery] = useState('');
    const [selectedFontCategory, setSelectedFontCategory] = useState<FontCategory | 'all' | 'recommended'>('recommended');
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [fontLoadingStatus, setFontLoadingStatus] = useState<Record<string, boolean>>({});
    const [isCheckingFonts, setIsCheckingFonts] = useState(false);
    const [fontCollection, setFontCollection] = useState<any[]>([]);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [recommendedFonts, setRecommendedFonts] = useState<string[]>([]);
    const fontDropdownRef = useRef<HTMLDivElement>(null);

    // 사용자 정의 프리셋 관리
    const { saveCustomPreset, recordPresetUsage } = useCustomPresets();

    // 폰트 컴렉션 로드
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
                console.error('폰트 컴렉션 로드 실패:', error);
                setFontCollection([]);
                setRecommendedFonts([]);
                setFontsLoaded(true);
            }
        };
        
        loadFonts();
    }, []);

    /**
     * 폰트 로딩 상태 실시간 감지 및 상태 업데이트
     * @description 컬렉션에서 각 폰트의 실제 로딩 여부를 비동기로 확인
     * @note 개발 모드에서만 디버그 로그 출력, 프로덕션에서는 조용히 실행
     */
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

                // 개발 모드에서만 디버그 정보 출력
                if (import.meta.env.DEV) {
                    console.log('🎨 폰트 로딩 상태:', status);
                    const failedFonts = Object.entries(status)
                        .filter(([_, loaded]) => !loaded)
                        .map(([font]) => font);

                    if (failedFonts.length > 0) {
                        console.warn('❌ 로딩 실패한 폰트들:', failedFonts);
                    }
                }
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
        return fontCollection.find(font => font.family === clip.fontFamily) || fontCollection[0];
    }, [clip.fontFamily, fontCollection]);

    // 텍스트 내용 업데이트
    const handleTextChange = (newText: string) => {
        onUpdate(clip.id, { text: newText });
    };

    /**
     * 폰트 속성 업데이트 함수
     * @param property - 업데이트할 폰트 속성 이름
     * @param value - 새로운 속성 값
     * @description fontSize, fontWeight, fontStyle, color 등 다양한 폰트 속성을 일괄 처리
     */
    const handleFontUpdate = (property: string, value: any) => {
        onUpdate(clip.id, { [property]: value });
    };

    /**
     * 폰트 선택 처리 함수
     * @param fontFamily - 선택된 폰트 패밀리 이름
     * @description 폰트 선택 시 fallback 설정 및 로딩 상태 확인
     * @note 로딩 실패 시 콘솔 경고 메시지 출력
     */
    const handleFontSelect = (fontFamily: string) => {
        // 폰트 fallback 적용
        const fontWithFallback = getFontWithFallback(fontFamily);
        handleFontUpdate('fontFamily', fontFamily);
        setShowFontDropdown(false);

        // 로딩 상태 확인
        if (!fontLoadingStatus[fontFamily]) {
            console.warn(`⚠️ 폰트 "${fontFamily}"가 로드되지 않았을 수 있습니다. fallback: ${fontWithFallback}`);
        }
    };

    /**
     * 텍스트 정렬 설정 함수
     * @param align - 정렬 방식 ('left' | 'center' | 'right')
     * @description 텍스트의 수평 정렬을 설정
     */
    const handleTextAlign = (align: 'left' | 'center' | 'right') => {
        onUpdate(clip.id, { textAlign: align });
    };

    /**
     * 텍스트 프리셋 적용 함수
     * @param preset - 적용할 텍스트 프리셋 데이터
     * @description 프리셋의 모든 속성을 현재 클립에 적용하고 사용 통계 기록
     */
    const handleApplyPreset = (preset: TextPreset) => {
        const updates = applyPresetToClip(clip, preset);
        onUpdate(clip.id, updates);

        // 사용 기록
        recordPresetUsage(preset.id);
    };

    /**
     * 현재 스타일을 커스텀 프리셋으로 저장
     * @param preset - 저장할 프리셋 데이터 (이름 및 설명 포함)
     * @description 사용자 정의 프리셋으로 저장하고 성공 메시지 표시
     */
    const handleSavePreset = (preset: TextPreset) => {
        saveCustomPreset(preset);
        globalAlert.showSuccess(`"${preset.name}" 프리셋이 저장되었습니다!`);
    };

    // 미리 정의된 색상 팔레트
    const colorPresets = [
        '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
        '#ffc0cb', '#a52a2a', '#808080', '#ffffe0', '#f0f8ff'
    ];

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

    // 폰트 굵기 옵션
    const fontWeights = [
        { label: 'Thin (100)', value: '100' },
        { label: 'Extra Light (200)', value: '200' },
        { label: 'Light (300)', value: '300' },
        { label: 'Normal (400)', value: '400' },
        { label: 'Medium (500)', value: '500' },
        { label: 'Semi Bold (600)', value: '600' },
        { label: 'Bold (700)', value: '700' },
        { label: 'Extra Bold (800)', value: '800' },
        { label: 'Black (900)', value: '900' }
    ];

    return (
        <div className="space-y-3">
            {/* 헤더 - Text 클립 전용 */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border border-blue-500/30">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-lg">
                    <Type size={24} className="text-blue-400" />
                </div>
                <div>
                    <h3 className="text-white font-semibold">텍스트 클립</h3>
                    <p className="text-gray-300 text-sm">
                        {clip.name || '텍스트 클립'} • {clip.duration.toFixed(2)}초
                    </p>
                </div>
            </div>

            {/* 탭 네비게이션 - 프리셋 탭 추가 */}
            <div className="flex space-x-1 p-1 bg-gray-800/50 rounded-lg">
                {[
                    { id: 'content', label: '내용', icon: Type },
                    { id: 'style', label: '스타일', icon: Palette },
                    { id: 'presets', label: '프리셋', icon: Sparkles },
                    { id: 'manage', label: '관리', icon: Settings }
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <Icon size={16} />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* 내용 탭 */}
            {activeTab === 'content' && (
                <div className="space-y-3">
                    <h4 className="text-white font-medium flex items-center space-x-2">
                        <Type size={16} className="text-blue-400" />
                        <span>텍스트 내용</span>
                    </h4>

                    {/* 텍스트 입력 */}
                    <div className="space-y-3">
                        <label className="block text-sm text-gray-300">텍스트</label>
                        <textarea
                            value={clip.text || ''}
                            onChange={(e) => handleTextChange(e.target.value)}
                            className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                            rows={4}
                            placeholder="여기에 텍스트를 입력하세요..."
                        />
                        <div className="text-xs text-gray-400">
                            글자 수: {(clip.text || '').length}
                        </div>
                    </div>

                    {/* 실시간 미리보기 */}
                    <div className="space-y-2">
                        <label className="block text-sm text-gray-300">미리보기</label>
                        <div
                            className="p-4 bg-gray-800 rounded-lg border border-gray-600 min-h-[80px] flex items-center justify-center"
                            style={{
                                fontSize: `${clip.fontSize || 24}px`,
                                fontFamily: clip.fontFamily ? `"${clip.fontFamily}", Arial` : 'Arial',
                                color: clip.color || '#ffffff',
                                backgroundColor: clip.backgroundColor || 'transparent',
                                textAlign: (clip.textAlign as any) || 'center',
                                fontWeight: clip.fontWeight || 'normal',
                                fontStyle: clip.fontStyle || 'normal',
                                textDecoration: clip.textDecoration || 'none',
                                fontFeatureSettings: 'normal',
                                textRendering: 'optimizeLegibility',
                                WebkitFontSmoothing: 'antialiased'
                            }}
                        >
                            {clip.text || '텍스트를 입력하세요'}
                        </div>
                    </div>
                </div>
            )}

            {/* 스타일 탭 */}
            {activeTab === 'style' && (
                <div className="space-y-3">
                    <h4 className="text-white font-medium flex items-center space-x-2">
                        <Palette size={16} className="text-blue-400" />
                        <span>텍스트 스타일</span>
                    </h4>

                    {/* 폰트 설정 */}
                    <div className="space-y-3">
                        {/* 고급 폰트 선택기 */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">폰트</label>

                            {/* 현재 선택된 폰트 표시 */}
                            <div className="relative" ref={fontDropdownRef}>
                                <button
                                    onClick={() => setShowFontDropdown(!showFontDropdown)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left flex items-center justify-between hover:bg-gray-600 transition-colors"
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
                                {showFontDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-96">
                                        {/* 검색 및 카테고리 필터 */}
                                        <div className="p-3 border-b border-gray-600 space-y-3">
                                            {/* 검색바 */}
                                            <div className="relative">
                                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={fontSearchQuery}
                                                    onChange={(e) => setFontSearchQuery(e.target.value)}
                                                    placeholder="폰트 검색..."
                                                    className="w-full pl-10 pr-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                                />
                                            </div>

                                            {/* 카테고리 필터 */}
                                            <div className="flex flex-wrap gap-1">
                                                {fontCategoryOptions.map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => setSelectedFontCategory(option.value as any)}
                                                        className={`px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors ${selectedFontCategory === option.value
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
                                                    onClick={() => handleFontSelect(font.family)}
                                                    className={`w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors flex items-center space-x-3 ${clip.fontFamily === font.family ? 'bg-blue-600/30' : ''
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
                                                            {/* {fontLoadingStatus[font.family] === false && (
                                                                <span className="text-xs bg-red-600 text-white px-1 py-0.5 rounded" title="폰트 로딩 실패">
                                                                    ❌
                                                                </span>
                                                            )}
                                                            {fontLoadingStatus[font.family] === true && (
                                                                <span className="text-xs bg-green-600 text-white px-1 py-0.5 rounded" title="폰트 로딩 성공">
                                                                    ✅
                                                                </span>
                                                            )} */}
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
                                                    {recommendedFonts.slice(0, 3).map(fontFamily => {
                                                        const font = fontCollection.find(f => f.family === fontFamily);
                                                        return font ? (
                                                            <button
                                                                key={fontFamily}
                                                                onClick={() => handleFontSelect(fontFamily)}
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
                        </div>

                        {/* 폰트 크기 */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">크기</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="range"
                                    min="12"
                                    max="400"
                                    step="1"
                                    value={clip.fontSize || 24}
                                    onChange={(e) => handleFontUpdate('fontSize', Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-white text-sm w-10 text-center">
                                    {clip.fontSize || 24}
                                </span>
                            </div>
                        </div>

                        {/* 폰트 굵기 선택 */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">폰트 굵기</label>
                            <select
                                value={clip.fontWeight || '400'}
                                onChange={(e) => handleFontUpdate('fontWeight', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            >
                                {fontWeights.map(weight => (
                                    <option key={weight.value} value={weight.value}>
                                        {weight.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 텍스트 스타일 버튼들 */}
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-300 text-sm w-16">스타일:</span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleFontUpdate('fontStyle',
                                            clip.fontStyle === 'italic' ? 'normal' : 'italic'
                                        )}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${clip.fontStyle === 'italic'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        <Italic size={16} />
                                    </button>

                                    <button
                                        onClick={() => handleFontUpdate('textDecoration',
                                            clip.textDecoration === 'underline' ? 'none' : 'underline'
                                        )}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${clip.textDecoration === 'underline'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        <Underline size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* 정렬 */}
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-300 text-sm w-16">정렬:</span>
                                <div className="flex space-x-2">
                                    {[
                                        { align: 'left', icon: AlignLeft },
                                        { align: 'center', icon: AlignCenter },
                                        { align: 'right', icon: AlignRight }
                                    ].map(({ align, icon: Icon }) => (
                                        <button
                                            key={align}
                                            onClick={() => handleTextAlign(align as any)}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${(clip.textAlign || 'center') === align
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                        >
                                            <Icon size={16} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 색상 설정 */}
                    <div className="space-y-3">
                        {/* 텍스트 색상 */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">텍스트 색상</label>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    value={clip.color || '#ffffff'}
                                    onChange={(e) => handleFontUpdate('color', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={clip.color || '#ffffff'}
                                    onChange={(e) => handleFontUpdate('color', e.target.value)}
                                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                                />
                            </div>

                            {/* 색상 프리셋 */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {colorPresets.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleFontUpdate('color', color)}
                                        className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${clip.color === color ? 'border-white' : 'border-gray-600'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 배경 색상 */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">배경 색상</label>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    value={clip.backgroundColor || '#000000'}
                                    onChange={(e) => handleFontUpdate('backgroundColor', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={clip.backgroundColor || 'transparent'}
                                    onChange={(e) => handleFontUpdate('backgroundColor', e.target.value)}
                                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                                    placeholder="transparent"
                                />
                                <button
                                    onClick={() => handleFontUpdate('backgroundColor', 'transparent')}
                                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                                >
                                    투명
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 프리셋 탭 */}
            {activeTab === 'presets' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-white font-medium flex items-center space-x-2">
                            <Sparkles size={16} className="text-blue-400" />
                            <span>텍스트 프리셋</span>
                        </h4>

                        {/* 현재 스타일 저장 버튼 */}
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                            title="현재 스타일을 프리셋으로 저장"
                        >
                            <Save size={14} />
                            <span>현재 스타일 저장</span>
                        </button>
                    </div>

                    <div className="bg-gray-800/30 rounded-lg px-4 py-2 border border-gray-600/30">
                        <TextPresetPanel
                            clip={clip}
                            onApplyPreset={handleApplyPreset}
                            sampleText={clip.text || '예시 텍스트'}
                        />
                    </div>
                </div>
            )}

            {/* 프리셋 관리 탭 */}
            {activeTab === 'manage' && (
                <div className="space-y-3">
                    <h4 className="text-white font-medium flex items-center space-x-2">
                        <Settings size={16} className="text-blue-400" />
                        <span>프리셋 관리</span>
                    </h4>

                    <div className="bg-gray-800/30 rounded-lg px-4 py-2 border border-gray-600/30">
                        <PresetManagementPanel
                            onApplyPreset={handleApplyPreset}
                        />
                    </div>
                </div>
            )}

            {/* 텍스트 정보 - 간소화 */}
            <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center space-x-2">
                    <span className="text-lg">📊</span>
                    <span>텍스트 정보</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-gray-300 text-sm">글자 수</span>
                        <span className="text-white font-mono text-sm">{(clip.text || '').length}자</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-gray-300 text-sm">폰트 크기</span>
                        <span className="text-white font-mono text-sm">{clip.fontSize || 24}px</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-gray-300 text-sm">폰트</span>
                        <span className="text-white font-mono text-sm">{currentFont.name}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-gray-300 text-sm">굵기</span>
                        <span className="text-white font-mono text-sm">({clip.fontWeight || '400'})</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-gray-300 text-sm">정렬</span>
                        <span className="text-white font-mono text-sm">{clip.textAlign || 'center'}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-gray-300 text-sm">스타일</span>
                        <span className="text-white font-mono text-sm">
                            {clip.fontStyle === 'italic' ? '기울임' : ''}
                            {clip.textDecoration === 'underline' ? '밑줄' : ''}
                            {!clip.fontStyle && !clip.textDecoration ? '기본' : ''}
                        </span>
                    </div>
                </div>

                <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <div className="text-xs text-blue-300">
                        ℹ️ 위치, 크기, 회전 등의 고급 변형 속성은 <strong>변형 & 위치</strong> 섹션에서 조정하세요.
                    </div>
                </div>
            </div>

            {/* 프리셋 저장 모달 */}
            <SavePresetModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                clip={clip}
                onSave={handleSavePreset}
            />
        </div>
    );
};

export default TextPropertiesPanel;
