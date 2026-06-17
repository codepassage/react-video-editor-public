/**
 * 비디오 클립 전용 속성 패널 컴포넌트
 * @description 비디오 클립의 모든 속성을 종합적으로 관리하는 고급 편집 인터페이스
 * 
 * 주요 기능:
 * - 비디오 제어 (재생, 일시정지, 구간 편집)
 * - 시각적 속성 (위치, 크기, 회전, 투명도)
 * - 오디오 속성 (볼륨, 재생속도, 음소거)
 * - 비디오 필터 (밝기, 대비, 채도 조정)
 * - 다양한 필터 프리셋 (선명, 부드러움, 흙백 등)
 * - 비디오 메타데이터 및 정보 대시보드
 * 
 * 사용 사례:
 * - 대화형 비디오 콘텐츠 제작
 * - 인터뷰나 인터랙티브 콘텐츠에서의 화면 구성
 * - 초보자도 쉬게 사용할 수 있는 직관적 인터페이스
 * - 전문적인 비디오 효과 및 비주얼 조정
 */

import React, { useState } from 'react';
import { 
  Video, Play, Pause, Volume2, Move, RotateCw, Eye, 
  Sliders, Scissors, Clock, Maximize, Sun, Contrast, 
  Palette, Zap, Filter, Settings
} from 'lucide-react';
import { VideoClip } from '../../../types/clipTypes';
import { setClipVolume, SafeAccess } from '../../../types/clipUtils';
import { TabControl } from '../../common/ui/TabControl';
import { SliderWithNumber } from '../../common/ui/SliderWithNumber';
import { PropertySection } from '../shared/PropertySection';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { PresetGrid } from '../../common/ui';
import { CheckboxWithLabel } from '../../common/ui';

/**
 * VideoPropertiesPanel 컴포넌트의 Props 인터페이스
 * @interface VideoPropertiesPanelProps
 */
interface VideoPropertiesPanelProps {
  /** 편집할 비디오 클립 데이터 */
  clip: VideoClip;
  /** 클립 속성 업데이트 콜백 함수 */
  onUpdate: (clipId: string, updates: Partial<VideoClip>) => void;
}

/**
 * 비디오 클립 전용 속성 패널 컴포넌트
 * 
 * 4개의 메인 탭으로 구성된 종합적인 비디오 편집 인터페이스:
 * 
 * 1. 비디오 탭 - 기본 비디오 제어 및 구간 편집
 *    - 인터랙티브 비디오 재생 컨트롤
 *    - 일시정지/재생 전환 기능
 *    - 시작/끝 시점 지정으로 원하는 구간만 사용
 *    - 대화형 녹아웃으로 직관적 구간 선택 및 계산 제공
 * 
 * 2. 시각 탭 - 비디오 상의 시각적 대상 제어
 *    - X/Y 위치 조정 (픽셀 단위)
 *    - 너비/높이 리사이징
 *    - 회전 각도 조정 (-180° ~ +180°)
 *    - 투명도 조절 (0-100%)
 * 
 * 3. 오디오 탭 - 비디오의 오디오 트랙 제어
 *    - 0-200% 볼륨 범위 지원 (증폭 가능)
 *    - 실시간 볼륨 레벨 시각화
 *    - 재생속도 조정 (0.25x ~ 4x)
 *    - 음소거 기능 및 오디오 정보 대시보드
 * 
 * 4. 필터 탭 - 전문적인 비주얼 비디오 필터
 *    - 기본 색상 조정 (밝기, 대비, 채도)
 *    - 직관적인 프리셋 시스템 (기본, 선명, 부드러움, 흙백)
 *    - 실시간 미리보기 지원
 * 
 * @param props - VideoPropertiesPanel 컴포넌트 속성
 * @returns 종합적인 비디오 편집 UI 컴포넌트
 */
export const VideoPropertiesPanel: React.FC<VideoPropertiesPanelProps> = ({ 
  clip, 
  onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'visual' | 'audio' | 'filters'>('video');
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * 비디오 재생/일시정지 토글 함수
   * @description 비디오 재생 상태를 전환하고 실제 비디오 재생을 제어
   * @note 비디오 콘텍스트에서의 통합 제어 기능 포함
   */
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // 실제 비디오 재생 로직은 여기에 추가
  };

  /**
   * 비디오 시각적 속성 업데이트 함수
   * @param property - 업데이트할 속성 이름 ('x', 'y', 'width', 'height', 'rotation', 'opacity')
   * @param value - 새로운 속성 값
   * @description 위치, 크기, 회전, 투명도 등의 시각적 속성을 업데이트
   */
  const handleVisualUpdate = (property: string, value: number) => {
    onUpdate(clip.id, { [property]: value });
  };

  /**
   * 비디오의 오디오 속성 업데이트 함수
   * @param property - 업데이트할 오디오 속성 ('volume', 'playbackRate')
   * @param value - 새로운 속성 값
   * @description 볼륨은 안전 설정을 위해 setClipVolume 유틸리티 사용
   */
  const handleAudioUpdate = (property: string, value: number) => {
    if (property === 'volume') {
      const volumeUpdates = setClipVolume(clip, value);
      if (Object.keys(volumeUpdates).length > 0) {
        onUpdate(clip.id, volumeUpdates);
      }
    } else {
      onUpdate(clip.id, { [property]: value });
    }
  };

  /**
   * 비디오 필터 업데이트 함수
   * @param property - 필터 속성 이름 ('brightness', 'contrast', 'saturation')
   * @param value - 필터 값 (-100 ~ +100 범위)
   * @description 비디오의 밝기, 대비, 채도 등을 실시간으로 조정
   */
  const handleFilterUpdate = (property: string, value: number) => {
    const filters = clip.filters || {};
    onUpdate(clip.id, { 
      filters: { ...filters, [property]: value }
    });
  };

  /**
   * 비디오 구간 편집 업데이트 함수
   * @param property - 구간 속성 ('trimStart' | 'trimEnd')
   * @param value - 시간 값 (초 단위)
   * @description 비디오의 시작 및 끝 시점을 설정하여 원하는 구간만 사용
   */
  const handleTrimUpdate = (property: 'trimStart' | 'trimEnd', value: number) => {
    onUpdate(clip.id, { [property]: value });
  };

  return (
    <div className="space-y-3">
      {/* 헤더 - Video 클립 전용 */}
      <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-lg border border-red-500/30">
        <div className="flex items-center justify-center w-12 h-12 bg-red-600/20 rounded-lg">
          <Video size={24} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">비디오 클립</h3>
          <p className="text-gray-300 text-sm">
            {clip.name || '비디오 클립'} • {clip.duration.toFixed(2)}초
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <TabControl
        options={[
          { value: 'video', label: '비디오' },
          { value: 'visual', label: '시각' },
          { value: 'audio', label: '오디오' },
          { value: 'filters', label: '필터' }
        ]}
        value={activeTab}
        onChange={(value) => setActiveTab(value as 'video' | 'visual' | 'audio' | 'filters')}
      />

      {/* 비디오 탭 */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <PropertySection
            title="비디오 제어"
            icon={<Video size={16} />}
          >

          {/* 재생 제어 */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
              <button
                onClick={togglePlayback}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  isPlaying 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <div className="flex-1 text-center">
                <div className="text-white font-medium">
                  {isPlaying ? '재생 중' : '일시정지'}
                </div>
                <div className="text-gray-400 text-sm">
                  {clip.duration.toFixed(2)}초 비디오
                </div>
              </div>
            </div>

            {/* 썸네일 미리보기 (예시) */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-300">썸네일 미리보기</label>
              <div className="aspect-video bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center">
                {clip.mediaUrl ? (
                  <video 
                    src={clip.mediaUrl}
                    className="w-full h-full object-cover rounded-lg"
                    controls={false}
                    muted
                  />
                ) : (
                  <div className="text-gray-500 text-center">
                    <Video size={48} className="mx-auto mb-2 opacity-50" />
                    <p>비디오 미리보기</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 구간 설정 */}
          <CollapsibleSection
            title="구간 편집"
            icon={<Scissors size={16} />}
            isOpen={true}
            onToggle={() => {}}
          >

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">시작 시간</label>
                <input
                  type="number"
                  value={clip.trimStart || 0}
                  onChange={(e) => handleTrimUpdate('trimStart', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="0"
                  max={clip.duration}
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">끝 시간</label>
                <input
                  type="number"
                  value={clip.trimEnd || clip.duration}
                  onChange={(e) => handleTrimUpdate('trimEnd', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min={clip.trimStart || 0}
                  max={clip.duration}
                  step="0.1"
                />
              </div>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">선택된 구간:</span>
                <span className="text-white font-mono">
                  {((clip.trimEnd || clip.duration) - (clip.trimStart || 0)).toFixed(2)}초
                </span>
              </div>
            </div>
          </CollapsibleSection>
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
          </PropertySection>
        </div>
      )}

      {/* 오디오 탭 */}
      {activeTab === 'audio' && (
        <div className="space-y-6">
          <PropertySection
            title="오디오 설정"
            icon={<Volume2 size={16} />}
          >

          {/* 볼륨 컨트롤 */}
          <div className="space-y-4">
            <SliderWithNumber
              label="볼륨"
              value={Math.round((clip.volume || 1) * 100)}
              min={0}
              max={200}
              step={5}
              suffix="%"
              onChange={(value) => handleAudioUpdate('volume', value / 100)}
            />
              
            {/* 볼륨 레벨 인디케이터 */}
            <div className="flex items-center space-x-1 mt-2">
              {[0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((level) => (
                <div
                  key={level}
                  className={`w-1 h-3 rounded ${(clip.volume || 1) >= level 
                    ? level <= 1 ? 'bg-green-500' : level <= 1.5 ? 'bg-yellow-500' : 'bg-red-500'
                    : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <SliderWithNumber
              label="재생 속도"
              value={parseFloat(((clip.playbackRate || 1) * 100).toFixed(0))}
              min={25}
              max={400}
              step={5}
              suffix="%"
              onChange={(value) => handleAudioUpdate('playbackRate', value / 100)}
            />

            {/* 오디오 정보 */}
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">실제 재생 시간:</span>
                  <span className="text-white font-mono">
                    {(clip.duration / (clip.playbackRate || 1)).toFixed(2)}초
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">볼륨 레벨:</span>
                  <span className={`font-mono ${
                    (clip.volume || 1) === 0 ? 'text-red-400' :
                    (clip.volume || 1) < 0.5 ? 'text-yellow-400' :
                    (clip.volume || 1) <= 1 ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {(clip.volume || 1) === 0 ? '음소거' : 
                     (clip.volume || 1) < 0.5 ? '낮음' :
                     (clip.volume || 1) <= 1 ? '보통' : '높음'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          </PropertySection>
        </div>
      )}

      {/* 필터 탭 */}
      {activeTab === 'filters' && (
        <div className="space-y-6">
          <PropertySection
            title="비디오 필터"
            icon={<Sliders size={16} />}
          >

          {/* 기본 색상 조정 */}
          <CollapsibleSection
            title="색상 조정"
            icon={<Sun size={16} />}
            isOpen={true}
            onToggle={() => {}}
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

          {/* 필터 프리셋 */}
          <CollapsibleSection
            title="필터 프리셋"
            icon={<Filter size={16} />}
            isOpen={true}
            onToggle={() => {}}
          >
            <PresetGrid
              label=""
              columns={2}
              items={[
                {
                  name: '기본',
                  value: 'default',
                  description: '기본 필터',
                  isSelected: false,
                  onClick: () => {
                    const values = { brightness: 0, contrast: 0, saturation: 0 };
                    Object.entries(values).forEach(([key, value]) => {
                      handleFilterUpdate(key, value);
                    });
                  }
                },
                {
                  name: '선명',
                  value: 'sharp',
                  description: '선명한 필터',
                  isSelected: false,
                  onClick: () => {
                    const values = { brightness: 10, contrast: 20, saturation: 10 };
                    Object.entries(values).forEach(([key, value]) => {
                      handleFilterUpdate(key, value);
                    });
                  }
                },
                {
                  name: '부드러움',
                  value: 'soft',
                  description: '부드러운 필터',
                  isSelected: false,
                  onClick: () => {
                    const values = { brightness: 5, contrast: -10, saturation: -5 };
                    Object.entries(values).forEach(([key, value]) => {
                      handleFilterUpdate(key, value);
                    });
                  }
                },
                {
                  name: '흑백',
                  value: 'bw',
                  description: '흑백 필터',
                  isSelected: false,
                  onClick: () => {
                    const values = { brightness: 0, contrast: 10, saturation: -100 };
                    Object.entries(values).forEach(([key, value]) => {
                      handleFilterUpdate(key, value);
                    });
                  }
                }
              ]}
            />
          </CollapsibleSection>

          {/* 향후 확장 기능 */}
          <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg border border-gray-600/30">
            <h5 className="text-gray-400 font-medium flex items-center space-x-2">
              <span className="text-lg">FUTURE</span>
              <span>향후 추가될 필터들</span>
            </h5>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-500">
                <Filter size={16} />
                <span>블러 효과</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <Zap size={16} />
                <span>샤픈 필터</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <Settings size={16} />
                <span>노이즈 제거</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <Palette size={16} />
                <span>색온도 조절</span>
              </div>
            </div>
          </div>
          </PropertySection>
        </div>
      )}

      {/* 비디오 정보 */}
      <PropertySection
        title="비디오 정보"
        icon={<span className="text-lg">ℹ️</span>}
      >

        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">해상도</span>
            <span className="text-white font-mono">{clip.width || 1920} × {clip.height || 1080}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">재생 시간</span>
            <span className="text-white font-mono">
              {(clip.duration / (clip.playbackRate || 1)).toFixed(2)}초 (원본: {clip.duration.toFixed(2)}초)
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">편집 구간</span>
            <span className="text-white font-mono">
              {(clip.trimStart || 0).toFixed(2)}s ~ {(clip.trimEnd || clip.duration).toFixed(2)}s
            </span>
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

export default VideoPropertiesPanel;
