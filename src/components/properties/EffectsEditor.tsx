import React, { useState } from 'react';
import {
  Sparkles, Play, Pause, RotateCw, Zap,
  TrendingUp, TrendingDown, Minus, Plus,
  ChevronDown, ChevronUp, Clock, Target,
  Layers, Filter, Sliders, Waves
} from 'lucide-react';
import { TimelineClip } from '../../types';
import { CollapsibleSection, SliderWithNumber } from '../common/ui';

interface EffectsEditorProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: Partial<TimelineClip>) => void;
  // 🎯 커스텀 속성 변경 핸들러 (가상 클립용)
  customPropertyHandler?: (property: string, value: any) => void;
}

export const EffectsEditor: React.FC<EffectsEditorProps> = ({ clip, onUpdate, customPropertyHandler }) => {
  const [showFadeControls, setShowFadeControls] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnimations, setShowAnimations] = useState(false);
  const [showKeyframes, setShowKeyframes] = useState(false);

  // 🔍 디버깅: 클립 데이터 확인
  console.log('🎨 EffectsEditor 렌더링:', {
    clipId: clip.id?.slice(-8),
    mediaType: clip.mediaType,
    padding: {
      paddingTop: clip.paddingTop,
      paddingRight: clip.paddingRight,
      paddingBottom: clip.paddingBottom,
      paddingLeft: clip.paddingLeft,
    },
    effects: {
      brightness: clip.brightness,
      contrast: clip.contrast,
      saturation: clip.saturation,
      hue: clip.hue,
      blur: clip.blur,
      sepia: clip.sepia,
      grayscale: clip.grayscale,
      fadeIn: clip.fadeIn,
      fadeOut: clip.fadeOut,
      animationType: clip.animationType
    }
  });

  const handlePropertyChange = (property: string, value: any) => {
    console.log('🔧 속성 변경:', {
      property,
      value,
      clipId: clip.id.slice(-8)
    });

    // 🎯 커스텀 핸들러가 있으면 사용 (가상 클립용)
    if (customPropertyHandler) {
      customPropertyHandler(property, value);
      return;
    }

    // 🎯 애니메이션 타입 설정 시 자동으로 지연 시간 0 설정
    if (property === 'animationType' && value) {
      onUpdate(clip.id, {
        [property]: value,
        animationDelay: 0  // 🔥 애니메이션 타입 설정 시 지연 시간 자동 0
      });
      console.log('🎆 애니메이션 타입 설정 후 지연 시간 자동 0 설정:', {
        animationType: value,
        animationDelay: 0
      });
    } else {
      onUpdate(clip.id, { [property]: value });
    }
  };

  const addFadeIn = (duration: number = 0.5) => {
    handlePropertyChange('fadeIn', duration);
  };

  const addFadeOut = (duration: number = 0.5) => {
    handlePropertyChange('fadeOut', duration);
  };

  const removeFadeIn = () => {
    handlePropertyChange('fadeIn', 0);
  };

  const removeFadeOut = () => {
    handlePropertyChange('fadeOut', 0);
  };

  const animationPresets = [
    {
      name: '페이드 인',
      properties: {
        animationType: 'fadeIn',
        animationDuration: 2.0,  // 🎯 0.5초 → 2초로 늘림
        animationEasing: 'ease-out',
        animationDelay: 0  // 🎯 지연 시간 0으로 설정
      }
    },
    {
      name: '슬라이드 인 (왼쪽)',
      properties: {
        animationType: 'slideInLeft',
        animationDuration: 1.5,  // 🎯 0.8초 → 1.5초로 늘림
        animationEasing: 'ease-out',
        animationDelay: 0  // 🎯 지연 시간 0으로 설정
      }
    },
    {
      name: '슬라이드 인 (위)',
      properties: {
        animationType: 'slideInTop',
        animationDuration: 1.5,  // 🎯 0.8초 → 1.5초로 늘림
        animationEasing: 'ease-out',
        animationDelay: 0  // 🎯 지연 시간 0으로 설정
      }
    },
    {
      name: '확대',
      properties: {
        animationType: 'scaleIn',
        animationDuration: 1.2,  // 🎯 0.6초 → 1.2초로 늘림
        animationEasing: 'ease-back',
        animationDelay: 0  // 🎯 지연 시간 0으로 설정
      }
    },
    {
      name: '회전 등장',
      properties: {
        animationType: 'rotateIn',
        animationDuration: 1.8,  // 🎯 1.0초 → 1.8초로 늘림
        animationEasing: 'ease-out',
        animationDelay: 0  // 🎯 지연 시간 0으로 설정
      }
    },
    {
      name: '튀어오르기',
      properties: {
        animationType: 'bounceIn',
        animationDuration: 2.5,  // 🎯 1.2초 → 2.5초로 늘림
        animationEasing: 'ease-bounce',
        animationDelay: 0  // 🎯 지연 시간 0으로 설정
      }
    }
  ];

  const filterPresets = [
    {
      name: '없음',
      properties: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        sepia: 0,
        grayscale: 0
      }
    },
    {
      name: '따뜻함',
      properties: {
        brightness: 110,
        contrast: 105,
        saturation: 120,
        hue: 10,
        blur: 0,
        sepia: 0,
        grayscale: 0
      }
    },
    {
      name: '차가움',
      properties: {
        brightness: 95,
        contrast: 110,
        saturation: 90,
        hue: -10,
        blur: 0,
        sepia: 0,
        grayscale: 0
      }
    },
    {
      name: '세피아',
      properties: {
        brightness: 105,
        contrast: 100,
        saturation: 80,
        hue: 0,
        blur: 0,
        sepia: 80,
        grayscale: 0
      }
    },
    {
      name: '흑백',
      properties: {
        brightness: 100,
        contrast: 110,
        saturation: 0,
        hue: 0,
        blur: 0,
        sepia: 0,
        grayscale: 100
      }
    },
    {
      name: '고대비',
      properties: {
        brightness: 105,
        contrast: 140,
        saturation: 120,
        hue: 0,
        blur: 0,
        sepia: 0,
        grayscale: 0
      }
    }
  ];

  const easingOptions = [
    { name: '기본', value: 'ease' },
    { name: '선형', value: 'linear' },
    { name: '부드럽게 시작', value: 'ease-in' },
    { name: '부드럽게 끝', value: 'ease-out' },
    { name: '부드럽게 시작+끝', value: 'ease-in-out' },
    { name: '탄성', value: 'ease-back' },
    { name: '튀어오르기', value: 'ease-bounce' },
    { name: '탄성 시작', value: 'ease-elastic' }
  ];

  return (
    <div className="space-y-3">
      {/* 페이드 효과 */}
      <CollapsibleSection
        title="페이드 효과"
        icon={<TrendingUp size={16} />}
        isOpen={showFadeControls}
        onToggle={() => setShowFadeControls(!showFadeControls)}
      >
            {/* 페이드 인 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">페이드 인</label>
                <div className="flex space-x-1">
                  {!clip.fadeIn || clip.fadeIn === 0 ? (
                    <button
                      onClick={() => addFadeIn(0.5)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={removeFadeIn}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              </div>

              {clip.fadeIn && clip.fadeIn > 0 && (
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={clip.fadeIn}
                    onChange={(e) => handlePropertyChange('fadeIn', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white text-sm w-12">
                    {clip.fadeIn.toFixed(1)}s
                  </span>
                </div>
              )}
            </div>

            {/* 페이드 아웃 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">페이드 아웃</label>
                <div className="flex space-x-1">
                  {!clip.fadeOut || clip.fadeOut === 0 ? (
                    <button
                      onClick={() => addFadeOut(0.5)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={removeFadeOut}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              </div>

              {clip.fadeOut && clip.fadeOut > 0 && (
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={clip.fadeOut}
                    onChange={(e) => handlePropertyChange('fadeOut', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white text-sm w-12">
                    {clip.fadeOut.toFixed(1)}s
                  </span>
                </div>
              )}
            </div>

            {/* 빠른 설정 */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  if (customPropertyHandler) {
                    // LongSentence의 경우 한 번에 여러 속성 업데이트
                    handlePropertyChange('batch', { fadeIn: 0.3, fadeOut: 0.3 });
                  } else {
                    addFadeIn(0.3);
                    addFadeOut(0.3);
                  }
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
              >
                빠른 페이드
              </button>
              <button
                onClick={() => {
                  if (customPropertyHandler) {
                    // LongSentence의 경우 한 번에 여러 속성 업데이트
                    handlePropertyChange('batch', { fadeIn: 1.0, fadeOut: 1.0 });
                  } else {
                    addFadeIn(1.0);
                    addFadeOut(1.0);
                  }
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
              >
                부드러운 페이드
              </button>
              <button
                onClick={() => {
                  if (customPropertyHandler) {
                    // LongSentence의 경우 한 번에 여러 속성 업데이트
                    handlePropertyChange('batch', { fadeIn: 0, fadeOut: 0 });
                  } else {
                    removeFadeIn();
                    removeFadeOut();
                  }
                }}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
              >
                페이드 제거
              </button>
            </div>
      </CollapsibleSection>

      {/* 필터 효과 */}
      <CollapsibleSection
        title="시각 필터"
        icon={<Filter size={16} />}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      >
        {/* 필터 프리셋 */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">필터 프리셋</label>
              <div className="grid grid-cols-2 gap-2">
                {filterPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (customPropertyHandler) {
                        // LongSentence의 경우 배치 업데이트로 Race Condition 방지
                        handlePropertyChange('batch', preset.properties);
                      } else {
                        // 일반 클립의 경우 개별 업데이트
                        Object.entries(preset.properties).forEach(([key, value]) => {
                          handlePropertyChange(key, value);
                        });
                      }
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 개별 필터 조정 */}
            <div className="space-y-3">
              {/* 밝기 */}
              <SliderWithNumber
                label="밝기"
                value={clip.brightness || 100}
                min={0}
                max={200}
                step={1}
                suffix="%"
                onChange={(value) => handlePropertyChange('brightness', value)}
              />

              {/* 대비 */}
              <SliderWithNumber
                label="대비"
                value={clip.contrast || 100}
                min={0}
                max={200}
                step={1}
                suffix="%"
                onChange={(value) => handlePropertyChange('contrast', value)}
              />

              {/* 채도 */}
              <SliderWithNumber
                label="채도"
                value={clip.saturation || 100}
                min={0}
                max={200}
                step={1}
                suffix="%"
                onChange={(value) => handlePropertyChange('saturation', value)}
              />

              {/* 색조 */}
              <SliderWithNumber
                label="색조"
                value={clip.hue || 0}
                min={-180}
                max={180}
                step={1}
                suffix="°"
                onChange={(value) => handlePropertyChange('hue', value)}
              />

              {/* 블러 */}
              <SliderWithNumber
                label="블러"
                value={clip.blur || 0}
                min={0}
                max={20}
                step={0.5}
                suffix="px"
                onChange={(value) => handlePropertyChange('blur', value)}
              />
            </div>
      </CollapsibleSection>

      {/* 애니메이션 */}
      <CollapsibleSection
        title="애니메이션"
        icon={<Zap size={16} />}
        isOpen={showAnimations}
        onToggle={() => setShowAnimations(!showAnimations)}
      >
            {/* 애니메이션 프리셋 */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">애니메이션 프리셋</label>
              <div className="grid grid-cols-2 gap-2">
                {animationPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // 🎯 애니메이션 프리셋 적용 - 지연 시간 명시적 0 설정
                      const animationProperties = {
                        ...preset.properties,
                        animationDelay: 0, // 🔥 지연 시간 강제 0 설정
                      };
                      
                      if (customPropertyHandler) {
                        // LongSentence의 경우 배치 업데이트로 Race Condition 방지
                        handlePropertyChange('batch', animationProperties);
                      } else {
                        // 일반 클립의 경우 개별 업데이트
                        Object.entries(animationProperties).forEach(([key, value]) => {
                          handlePropertyChange(key, value);
                        });
                      }
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 애니메이션 설정 */}
            {clip.animationType && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">현재 애니메이션</span>
                  <span className="text-sm text-blue-400">{clip.animationType}</span>
                </div>

                {/* 지속 시간 */}
                <SliderWithNumber
                  label="지속 시간"
                  value={clip.animationDuration || 1}
                  min={0.1}
                  max={5}
                  step={0.1}
                  suffix="s"
                  onChange={(value) => handlePropertyChange('animationDuration', value)}
                />

                {/* 지연 시간 */}
                <SliderWithNumber
                  label="지연 시간"
                  value={clip.animationDelay ?? 0}
                  min={0}
                  max={2}
                  step={0.1}
                  suffix="s"
                  onChange={(value) => handlePropertyChange('animationDelay', value)}
                />

                {/* 이징 */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1">이징</label>
                  <select
                    value={clip.animationEasing || 'ease'}
                    onChange={(e) => handlePropertyChange('animationEasing', e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {easingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 반복 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">반복 재생</label>
                  <button
                    onClick={() => handlePropertyChange('animationLoop', !clip.animationLoop)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${clip.animationLoop
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    {clip.animationLoop ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* 애니메이션 제거 */}
                <button
                  onClick={() => {
                    handlePropertyChange('animationType', null);
                    handlePropertyChange('animationDuration', null);
                    handlePropertyChange('animationDelay', null);
                    handlePropertyChange('animationEasing', null);
                    handlePropertyChange('animationLoop', null);
                  }}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                >
                  애니메이션 제거
                </button>
              </div>
            )}
      </CollapsibleSection>

      {/* 키프레임 애니메이션 (고급) */}
      <CollapsibleSection
        title="키프레임 (고급)"
        icon={<Clock size={16} />}
        isOpen={showKeyframes}
        onToggle={() => setShowKeyframes(!showKeyframes)}
      >
            <div className="text-sm text-gray-400">
              키프레임 애니메이션은 향후 버전에서 지원될 예정입니다.
            </div>

            {/* 기본 키프레임 설정 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <span className="text-sm text-white">시작 (0%)</span>
                <span className="text-xs text-gray-400">초기 상태</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <span className="text-sm text-white">끝 (100%)</span>
                <span className="text-xs text-gray-400">최종 상태</span>
              </div>
            </div>

            <button
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              키프레임 추가 (준비 중)
            </button>
      </CollapsibleSection>
    </div>
  );
};
