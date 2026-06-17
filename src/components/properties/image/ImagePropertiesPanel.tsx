import React, { useState } from 'react';
import {
  Image, Move, RotateCw, Sliders, Sparkles,
  Crop, Maximize, Sun, Contrast, Palette,
  Eye, Scissors, Square, Info, Zap
} from 'lucide-react';
import { ImageClip } from '../../../types/clipTypes';
import { TabControl } from '../../common/ui/TabControl';
import { SliderWithNumber } from '../../common/ui/SliderWithNumber';
import { PropertySection } from '../shared/PropertySection';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { PresetGrid } from '../../common/ui';
import { CheckboxWithLabel } from '../../common/ui';


interface ImagePropertiesPanelProps {
  clip: ImageClip;
  onUpdate: (clipId: string, updates: Partial<ImageClip>) => void;
}

/**
 * 이미지 클립 전용 속성 패널 컴포넌트
 * 
 * 4개의 메인 탭으로 구성된 종합적인 이미지 편집 인터페이스:
 * 
 * 1. 이미지 탭 - 기본 이미지 제어 및 크롭 기능
 *    - 인터랙티브 이미지 미리보기
 *    - 원본/현재 크기 정보 및 가로세로 비율 표시
 *    - 비율 고정 리사이징 (16:9, 4:3, 1:1, 9:16 프리셋)
 *    - 실시간 크롭 모드 (백분율 기반 X/Y 시작점 및 너비/높이)
 * 
 * 2. 시각 탭 - 이미지의 시각적 특성 제어
 *    - X/Y 위치 조정 (픽셀 단위)
 *    - 너비/높이 리사이징 (비율 고정 옵션 지원)
 *    - 회전 각도 조정 (-180° ~ +180°)
 *    - 투명도 조절 (0-100%)
 *    - 빠른 리사이지 프리셋 (HD, FHD, 4K, 소셜, 세로, 원본)
 * 
 * 3. 필터 탭 - 전문적인 이미지 색상 조정
 *    - 기본 색상 조정 (밝기, 대비, 채도)
 *    - 색온도 조정 (따뜻함/차가운 톤 조절)
 *    - 6가지 전문 필터 프리셋 (기본, 생생함, 따뜻함, 차가움, 빈티지, 흙백)
 * 
 * 4. 효과 탭 - 이미지 효과 및 디자인 요소
 *    - 블러 효과 (0-20px 범위)
 *    - 드롭 셐도우 (0-50px 범위)
 *    - 커스텀 테두리 (두께 및 색상 조정)
 * 
 * @param props - ImagePropertiesPanel 컴포넌트 속성
 * @returns 종합적인 이미지 편집 UI 컴포넌트
 */
export const ImagePropertiesPanel: React.FC<ImagePropertiesPanelProps> = ({
  clip,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'visual' | 'filters' | 'effects'>('image');
  const [cropMode, setCropMode] = useState(false);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);

  /**
   * 이미지 시각적 속성 업데이트 함수
   * @param property - 업데이트할 속성 이름 ('x', 'y', 'width', 'height', 'rotation', 'opacity')
   * @param value - 새로운 속성 값
   * @description 비율 고정 옵션에 따라 너비/높이 자동 조정 처리
   */
  const handleVisualUpdate = (property: string, value: number) => {
    if (aspectRatioLocked && (property === 'width' || property === 'height')) {
      // 비율 유지 리사이즈
      const currentWidth = clip.width || 1920;
      const currentHeight = clip.height || 1080;
      const aspectRatio = currentWidth / currentHeight;

      if (property === 'width') {
        onUpdate(clip.id, {
          width: value,
          height: Math.round(value / aspectRatio)
        });
      } else {
        onUpdate(clip.id, {
          height: value,
          width: Math.round(value * aspectRatio)
        });
      }
    } else {
      onUpdate(clip.id, { [property]: value });
    }
  };

  /**
   * 이미지 기본 속성 업데이트 함수
   * @param property - 업데이트할 이미지 속성 이름
   * @param value - 새로운 속성 값
   * @description 이미지의 일반적인 속성들을 업데이트
   */
  const handleImageUpdate = (property: string, value: any) => {
    onUpdate(clip.id, { [property]: value });
  };

  /**
   * 이미지 필터 업데이트 함수
   * @param property - 필터 속성 이름 ('brightness', 'contrast', 'saturation', 'temperature')
   * @param value - 필터 값 (-100 ~ +100 범위)
   * @description 이미지의 색상, 밝기, 대비 등을 실시간으로 조정
   */
  const handleFilterUpdate = (property: string, value: number) => {
    const filters = clip.filters || {};
    onUpdate(clip.id, {
      filters: { ...filters, [property]: value }
    });
  };

  /**
   * 이미지 크롭 영역 업데이트 함수
   * @param property - 크롭 속성 이름 ('x', 'y', 'width', 'height')
   * @param value - 크롭 값 (백분율 단위, 0-100)
   * @description 이미지의 특정 영역만 사용하도록 크롭 설정
   */
  const handleCropUpdate = (property: string, value: number) => {
    const crop = clip.crop || { x: 0, y: 0, width: 100, height: 100 };
    onUpdate(clip.id, {
      crop: { ...crop, [property]: value }
    });
  };

  /**
   * 비율 프리셋 적용 함수
   * @param ratio - 적용할 가로세로 비율 ('16:9', '4:3', '1:1', '9:16')
   * @description 사전 정의된 비율로 이미지 크기를 자동 조정
   * @note 기존 크기를 기준으로 비율에 맞게 조정
   */
  const applyAspectRatio = (ratio: string) => {
    const currentWidth = clip.width || 1920;
    const currentHeight = clip.height || 1080;

    let newWidth, newHeight;

    switch (ratio) {
      case '16:9':
        newHeight = currentHeight;
        newWidth = Math.round(newHeight * (16 / 9));
        break;
      case '4:3':
        newHeight = currentHeight;
        newWidth = Math.round(newHeight * (4 / 3));
        break;
      case '1:1':
        newWidth = newHeight = Math.min(currentWidth, currentHeight);
        break;
      case '9:16':
        newWidth = currentWidth;
        newHeight = Math.round(newWidth * (16 / 9));
        break;
      default:
        return;
    }

    onUpdate(clip.id, { width: newWidth, height: newHeight });
  };

  return (
    <div className="space-y-3">
      {/* 헤더 - Image 클립 전용 */}
      <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
        <div className="flex items-center justify-center w-12 h-12 bg-green-600/20 rounded-lg">
          <Image size={24} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">이미지 클립</h3>
          <p className="text-gray-300 text-sm">
            {clip.name || '이미지 클립'} • {clip.duration.toFixed(2)}초
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <TabControl
        options={[
          { value: 'image', label: '이미지' },
          { value: 'visual', label: '시각' },
          { value: 'filters', label: '필터' },
          { value: 'effects', label: '효과' }
        ]}
        value={activeTab}
        onChange={(value) => setActiveTab(value as 'image' | 'visual' | 'filters' | 'effects')}
      />

      {/* 이미지 탭 */}
      {activeTab === 'image' && (
        <div className="space-y-6">
          <PropertySection
            title="이미지 제어"
            icon={<Image size={16} />}
          >

            {/* 이미지 미리보기 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-300">이미지 미리보기</label>
                <div className="aspect-video bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
                  {clip.mediaUrl ? (
                    <img
                      src={clip.mediaUrl}
                      alt={clip.name || '이미지'}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <Image size={48} className="mx-auto mb-2 opacity-50" />
                      <p>이미지 미리보기</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 이미지 정보 */}
              <div className="p-3 bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">현재 크기:</span>
                  <span className="text-white font-mono text-sm">
                    {clip.width || 1920} × {clip.height || 1080}
                  </span>
                </div>

                {clip.originalWidth && clip.originalHeight && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">원본 크기:</span>
                    <span className="text-white font-mono text-sm">
                      {clip.originalWidth} × {clip.originalHeight}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">가로세로 비율:</span>
                  <span className="text-white font-mono text-sm">
                    {((clip.width || 1920) / (clip.height || 1080)).toFixed(2)}:1
                  </span>
                </div>
              </div>
            </div>

            {/* 비율 조정 */}
            <div className="space-y-4">
              <h5 className="text-white font-medium flex items-center space-x-2">
                <Square size={16} className="text-green-400" />
                <span>비율 조정</span>
              </h5>

              <CheckboxWithLabel
                label="비율 고정"
                description="너비와 높이를 동시에 조정합니다"
                checked={aspectRatioLocked}
                onChange={setAspectRatioLocked}
              />

              <PresetGrid
                label="비율 프리셋"
                columns={4}
                items={[
                  { name: '16:9', value: '16:9', description: '와이드스크린', isSelected: false, onClick: () => applyAspectRatio('16:9') },
                  { name: '4:3', value: '4:3', description: '표준 비율', isSelected: false, onClick: () => applyAspectRatio('4:3') },
                  { name: '1:1', value: '1:1', description: '정사각형', isSelected: false, onClick: () => applyAspectRatio('1:1') },
                  { name: '9:16', value: '9:16', description: '세로형', isSelected: false, onClick: () => applyAspectRatio('9:16') }
                ]}
              />
            </div>

            {/* 크롭 기능 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-white font-medium flex items-center space-x-2">
                  <Crop size={16} className="text-green-400" />
                  <span>이미지 크롭</span>
                </h5>

                <button
                  onClick={() => setCropMode(!cropMode)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${cropMode
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {cropMode ? '크롭 적용' : '크롭 모드'}
                </button>
              </div>

              {cropMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">X 시작점</label>
                    <input
                      type="number"
                      value={clip.crop?.x || 0}
                      onChange={(e) => handleCropUpdate('x', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Y 시작점</label>
                    <input
                      type="number"
                      value={clip.crop?.y || 0}
                      onChange={(e) => handleCropUpdate('y', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">크롭 너비</label>
                    <input
                      type="number"
                      value={clip.crop?.width || 100}
                      onChange={(e) => handleCropUpdate('width', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      min="1"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">크롭 높이</label>
                    <input
                      type="number"
                      value={clip.crop?.height || 100}
                      onChange={(e) => handleCropUpdate('height', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              )}
            </div>
          </PropertySection>
        </div>
      )}

      {/* 시각 탭 */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          <PropertySection
            title="시각적 속성"
            icon={<Move size={16} />}
          >

            {/* 위치 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">X 위치</label>
                <input
                  type="number"
                  value={clip.x || 0}
                  onChange={(e) => handleVisualUpdate('x', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Y 위치</label>
                <input
                  type="number"
                  value={clip.y || 0}
                  onChange={(e) => handleVisualUpdate('y', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            {/* 크기 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">크기</span>
                <div className="flex items-center space-x-2">
                  <Square size={16} className={aspectRatioLocked ? 'text-green-400' : 'text-gray-500'} />
                  <span className="text-sm text-gray-300">
                    {aspectRatioLocked ? '비율 고정' : '자유 크기'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">너비</label>
                  <input
                    type="number"
                    value={clip.width || 1920}
                    onChange={(e) => handleVisualUpdate('width', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    min="10"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">높이</label>
                  <input
                    type="number"
                    value={clip.height || 1080}
                    onChange={(e) => handleVisualUpdate('height', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    min="10"
                  />
                </div>
              </div>
            </div>

            {/* 회전 및 투명도 */}
            <div className="space-y-4">
              <SliderWithNumber
                label="회전"
                value={clip.rotation || 0}
                min={-180}
                max={180}
                step={1}
                suffix="°"
                onChange={(value) => handleVisualUpdate('rotation', value)}
              />

              <SliderWithNumber
                label="투명도"
                value={Math.round((clip.opacity || 1) * 100)}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(value) => handleVisualUpdate('opacity', value / 100)}
              />
            </div>

            {/* 빠른 리사이즈 프리셋 */}
            <div className="space-y-3">
              <h5 className="text-white font-medium">빠른 리사이즈</h5>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'HD', width: 1280, height: 720 },
                  { label: 'FHD', width: 1920, height: 1080 },
                  { label: '4K', width: 3840, height: 2160 },
                  { label: '소셜', width: 1080, height: 1080 },
                  { label: '세로', width: 1080, height: 1920 },
                  { label: '원본', width: clip.originalWidth || 1920, height: clip.originalHeight || 1080 }
                ].map(({ label, width, height }) => (
                  <button
                    key={label}
                    onClick={() => {
                      onUpdate(clip.id, { width, height });
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </PropertySection>
        </div>
      )}

      {/* 필터 탭 */}
      {activeTab === 'filters' && (
        <div className="space-y-6">
          <PropertySection
            title="이미지 필터"
            icon={<Sliders size={16} />}
          >

            {/* 기본 색상 조정 */}
            <CollapsibleSection
              title="색상 조정"
              icon={<Sun size={16} />}
              isOpen={true}
              onToggle={() => { }}
            >
              <div className="space-y-4">
                <SliderWithNumber
                  label="밝기"
                  value={clip.filters?.brightness || 0}
                  min={-100}
                  max={100}
                  step={1}
                  suffix=""
                  onChange={(value) => handleFilterUpdate('brightness', value)}
                />

                <SliderWithNumber
                  label="대비"
                  value={clip.filters?.contrast || 0}
                  min={-100}
                  max={100}
                  step={1}
                  suffix=""
                  onChange={(value) => handleFilterUpdate('contrast', value)}
                />

                <SliderWithNumber
                  label="채도"
                  value={clip.filters?.saturation || 0}
                  min={-100}
                  max={100}
                  step={1}
                  suffix=""
                  onChange={(value) => handleFilterUpdate('saturation', value)}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="색상 온도"
              icon={<Palette size={16} />}
              isOpen={true}
              onToggle={() => { }}
            >
              <SliderWithNumber
                label="색온도"
                value={clip.filters?.temperature || 0}
                min={-100}
                max={100}
                step={1}
                suffix=""
                onChange={(value) => handleFilterUpdate('temperature', value)}
              />
            </CollapsibleSection>

            {/* 필터 프리셋 */}
            <div className="space-y-3">
              <h5 className="text-white font-medium">필터 프리셋</h5>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: '기본', values: { brightness: 0, contrast: 0, saturation: 0, temperature: 0 } },
                  { name: '생생함', values: { brightness: 10, contrast: 15, saturation: 20, temperature: 5 } },
                  { name: '따뜻함', values: { brightness: 5, contrast: 5, saturation: 0, temperature: 30 } },
                  { name: '차가움', values: { brightness: 0, contrast: 10, saturation: -10, temperature: -25 } },
                  { name: '빈티지', values: { brightness: -5, contrast: -10, saturation: -20, temperature: 15 } },
                  { name: '흑백', values: { brightness: 0, contrast: 15, saturation: -100, temperature: 0 } }
                ].map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      Object.entries(preset.values).forEach(([key, value]) => {
                        handleFilterUpdate(key, value);
                      });
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </PropertySection>
        </div>
      )}

      {/* 효과 탭 */}
      {activeTab === 'effects' && (
        <div className="space-y-6">
          <PropertySection
            title="이미지 효과"
            icon={<Sparkles size={16} />}
          >

            {/* 기본 효과 */}
            <div className="space-y-4">
              {/* 블러 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">블러</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={clip.effects?.blur || 0}
                    onChange={(e) => {
                      const effects = clip.effects || {};
                      onUpdate(clip.id, {
                        effects: { ...effects, blur: Number(e.target.value) }
                      });
                    }}
                    className="flex-1 image-slider"
                  />
                  <span className="text-white text-sm w-12">
                    {clip.effects?.blur || 0}px
                  </span>
                </div>
              </div>

              {/* 그림자 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">그림자</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={clip.effects?.shadow || 0}
                    onChange={(e) => {
                      const effects = clip.effects || {};
                      onUpdate(clip.id, {
                        effects: { ...effects, shadow: Number(e.target.value) }
                      });
                    }}
                    className="flex-1 image-slider"
                  />
                  <span className="text-white text-sm w-12">
                    {clip.effects?.shadow || 0}px
                  </span>
                </div>
              </div>

              {/* 테두리 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">테두리</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={clip.effects?.borderWidth || 0}
                      onChange={(e) => {
                        const effects = clip.effects || {};
                        onUpdate(clip.id, {
                          effects: { ...effects, borderWidth: Number(e.target.value) }
                        });
                      }}
                      className="flex-1 image-slider"
                    />
                    <span className="text-white text-sm w-12">
                      {clip.effects?.borderWidth || 0}px
                    </span>
                  </div>

                  {(clip.effects?.borderWidth || 0) > 0 && (
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-300 text-sm w-16">색상:</span>
                      <input
                        type="color"
                        value={clip.effects?.borderColor || '#ffffff'}
                        onChange={(e) => {
                          const effects = clip.effects || {};
                          onUpdate(clip.id, {
                            effects: { ...effects, borderColor: e.target.value }
                          });
                        }}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={clip.effects?.borderColor || '#ffffff'}
                        onChange={(e) => {
                          const effects = clip.effects || {};
                          onUpdate(clip.id, {
                            effects: { ...effects, borderColor: e.target.value }
                          });
                        }}
                        className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 향후 확장 기능 */}
            <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg border border-gray-600/30">
              <h5 className="text-gray-400 font-medium flex items-center space-x-2">
                <span className="text-lg">FUTURE</span>
                <span>향후 추가될 효과들</span>
              </h5>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-500">
                  <Zap size={16} />
                  <span>글로우 효과</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Eye size={16} />
                  <span>렌즈 효과</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Palette size={16} />
                  <span>색상 오버레이</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Sparkles size={16} />
                  <span>파티클 효과</span>
                </div>
              </div>
            </div>
          </PropertySection>
        </div>
      )}

      {/* 이미지 정보 */}
      <PropertySection
        title="이미지 정보"
        icon={<Info size={16} />}
      >

        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">현재 크기</span>
            <span className="text-white font-mono">{clip.width || 1920} × {clip.height || 1080}</span>
          </div>

          {clip.originalWidth && clip.originalHeight && (
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">원본 크기</span>
              <span className="text-white font-mono">{clip.originalWidth} × {clip.originalHeight}</span>
            </div>
          )}

          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">가로세로 비율</span>
            <span className="text-white font-mono">
              {((clip.width || 1920) / (clip.height || 1080)).toFixed(2)}:1
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">회전</span>
            <span className="text-white font-mono">{clip.rotation || 0}°</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">투명도</span>
            <span className="text-white font-mono">{Math.round((clip.opacity || 1) * 100)}%</span>
          </div>

          {clip.mediaUrl && (
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">파일</span>
              <span className="text-white font-mono text-xs truncate max-w-40" title={clip.mediaUrl}>
                {clip.mediaUrl.split('/').pop() || 'Unknown'}
              </span>
            </div>
          )}
        </div>
      </PropertySection>
    </div>
  );
};

export default ImagePropertiesPanel;
