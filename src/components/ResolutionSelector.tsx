/**
 * 📺 ResolutionSelector.tsx - 비디오 해상도 선택기 컴포넌트
 * 
 * 비디오 프로젝트의 출력 해상도를 선택하고 관리하는 드롭다운 컴포넌트입니다.
 * YouTube 등 주요 플랫폼의 표준 해상도 프리셋과 커스템 해상도
 * 직접 입력을 모두 지원하며, 직관적인 UI로 커스템 해상도 설정이 가능합니다.
 * 
 * 주요 기능:
 * - YouTube 표준 해상도 프리셋 지원
 *   (1080p, 720p, 480p, 4K, 쇼츠, 스토리 등)
 * - 커스템 해상도 직접 입력 기능
 * - 실시간 종회비 계산 및 표시
 * - 현재 설정된 해상도 시각적 표시
 * - 외부 클릭 감지로 드롭다운 자동 닫기
 * 
 * 지원되는 해상도 프리셋:
 * - 4K (3840×2160) - Ultra HD
 * - 1080p (1920×1080) - Full HD
 * - 720p (1280×720) - HD
 * - 480p (854×480) - SD
 * - YouTube Shorts (1080×1920) - 세로 형
 * - Instagram Story (1080×1920) - 세로 형
 * - Custom - 사용자 정의
 * 
 * 상태 관리:
 * - isOpen: 드롭다운 메뉴 열기/닫기
 * - isCustomMode: 커스템 해상도 입력 모드
 * - customWidth/Height: 커스템 해상도 임시 값
 * - dropdownRef: 외부 클릭 감지용 참조
 * 
 * 사용자 경험:
 * - 아이콘과 함께 표시되는 직관적 프리셋 목록
 * - 종회비와 설명이 함께 표시되는 상세 정보
 * - 인스타트 미리보기와 적용
 * - 입력 유효성 검증 및 에러 처리
 * 
 * 관련 모듈:
 * - 8번 모듈: State Management (projectSettings 업데이트)
 * - 7번 모듈: Remotion Integration (렌더링 해상도 설정)
 * - Header 컴포넌트: 메인 UI에서 사용
 */
import React, { useState, useRef, useEffect } from 'react';
import { Monitor, ChevronDown, Smartphone, Square, Youtube, Tv } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { YOUTUBE_RESOLUTION_PRESETS, ResolutionPreset } from '../types';

/**
 * ResolutionSelector 컴포넌트 - 비디오 해상도 선택 인터페이스
 * 
 * 주요 책임:
 * 1. 표준 해상도 프리셋 목록 제공
 * 2. 커스템 해상도 입력 기능
 * 3. 현재 설정 상태 시각적 표시
 * 4. 전역 상태와의 동기화
 * 5. 사용자 친화적 드롭다운 UI
 * 
 * 동작 흐름:
 * 1. 현재 해상도에 맞는 프리셋 검색 및 표시
 * 2. 드롭다운 메뉴에서 프리셋 선택 또는 커스템 모드 진입
 * 3. 선택된 해상도를 전역 상태에 즐시 적용
 * 4. UI 업데이트 및 드롭다운 자동 닫기
 */
export const ResolutionSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { projectSettings, updateProjectSettings } = useEditorStore();

  // 현재 해상도에 맞는 프리셋 찾기
  const getCurrentPreset = (): ResolutionPreset => {
    const current = YOUTUBE_RESOLUTION_PRESETS.find(
      preset => preset.width === projectSettings.width && preset.height === projectSettings.height
    );
    
    if (current) {
      return current;
    }
    
    // 커스텀 해상도인 경우
    return {
      id: 'custom',
      name: 'Custom',
      width: projectSettings.width,
      height: projectSettings.height,
      aspectRatio: 'Custom',
      description: `Custom (${projectSettings.width}×${projectSettings.height})`
    };
  };

  const currentPreset = getCurrentPreset();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCustomMode(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = (preset: ResolutionPreset) => {
    if (preset.id === 'custom') {
      setIsCustomMode(true);
      setCustomWidth(projectSettings.width);
      setCustomHeight(projectSettings.height);
    } else {
      updateProjectSettings({
        width: preset.width,
        height: preset.height
      });
      setIsOpen(false);
      setIsCustomMode(false);
    }
  };

  const handleCustomResolution = () => {
    if (customWidth > 0 && customHeight > 0) {
      updateProjectSettings({
        width: customWidth,
        height: customHeight
      });
      setIsOpen(false);
      setIsCustomMode(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomResolution();
    } else if (e.key === 'Escape') {
      setIsCustomMode(false);
      setIsOpen(false);
    }
  };

  // 프리셋에 맞는 아이콘 반환
  const getPresetIcon = (preset: ResolutionPreset) => {
    switch (preset.id) {
      case 'shorts':
        return <Smartphone size={16} className="text-pink-400" />;
      case 'square':
        return <Square size={16} className="text-purple-400" />;
      case '4k':
      case '1440p':
      case '1080p':
        return <Tv size={16} className="text-blue-400" />;
      case '720p':
      case '480p':
      case '360p':
        return <Youtube size={16} className="text-red-400" />;
      case 'custom':
        return <Monitor size={16} className="text-gray-400" />;
      default:
        return <Monitor size={16} className="text-gray-400" />;
    }
  };

  // 프리셋 품질 표시
  const getQualityBadge = (preset: ResolutionPreset) => {
    if (preset.id === '4k') return <span className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-2 py-0.5 rounded font-bold">4K</span>;
    if (preset.id === '1440p') return <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-bold">2K</span>;
    if (preset.id === '1080p') return <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold">HD</span>;
    if (preset.id === 'shorts') return <span className="text-xs bg-pink-600 text-white px-2 py-0.5 rounded font-bold">Shorts</span>;
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 선택기 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white text-sm"
        title="해상도 변경"
      >
        <Monitor size={16} />
        <span className="font-mono">
          {projectSettings.width} × {projectSettings.height}
        </span>
        <span className="text-xs text-gray-400">
          ({currentPreset.aspectRatio})
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* 프리셋 목록 */}
          <div className="max-h-64 overflow-y-auto">
            {YOUTUBE_RESOLUTION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                  currentPreset.id === preset.id ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* 아이콘 */}
                    <div className="flex-shrink-0">
                      {getPresetIcon(preset)}
                    </div>
                    
                    {/* 이름 및 설명 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{preset.name}</span>
                        {getQualityBadge(preset)}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{preset.description}</div>
                    </div>
                  </div>
                  
                  {/* 비율 */}
                  <div className="text-xs text-gray-400 font-mono flex-shrink-0">
                    {preset.aspectRatio}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 커스텀 해상도 입력 */}
          {isCustomMode && (
            <div className="p-4 bg-gray-750 border-t border-gray-600">
              <div className="text-white text-sm font-medium mb-3">Custom Resolution</div>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                  onKeyDown={handleKeyPress}
                  className="w-24 px-3 py-2 text-sm bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="7680"
                  placeholder="Width"
                  autoFocus
                />
                <span className="text-gray-400 font-bold">×</span>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                  onKeyDown={handleKeyPress}
                  className="w-24 px-3 py-2 text-sm bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="4320"
                  placeholder="Height"
                />
                <button
                  onClick={handleCustomResolution}
                  disabled={customWidth <= 0 || customHeight <= 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex-shrink-0"
                >
                  적용
                </button>
              </div>
              <div className="text-xs text-gray-400">
                💡 Press <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs">Enter</kbd> to apply, <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs">Esc</kbd> to cancel
              </div>
              {customWidth > 0 && customHeight > 0 && (
                <div className="text-xs text-blue-400 mt-1">
                  Aspect ratio: {(customWidth / customHeight).toFixed(3)}:1
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
