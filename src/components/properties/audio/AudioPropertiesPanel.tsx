/**
 * 오디오 클립 전용 속성 패널 컴포넌트
 * @description 오디오 클립의 모든 속성을 종합적으로 관리하는 고급 편집 인터페이스
 * 
 * 주요 기능:
 * - 기본 오디오 제어 (볼륨, 재생속도, 음소거)
 * - TTS (텍스트 음성 변환) 기능 통합
 *   - 다국어 음성 지원
 *   - 음성 변수 선택
 *   - 실시간 오디오 생성
 * - 파형 시각화 및 인터랙티브 편집
 * - 3밴드 이퀄라이저 (Low/Mid/High 주파수 조절)
 * - 오디오 효과 (리버브, 에코, 컴프레서, 노이즈 게이트)
 * - 사전 정의된 프리셋 및 커스텀 설정
 * - 실시간 오디오 정보 대시보드
 * 
 * 사용 사례:
 * - 내레이션 오디오의 전문적인 후작업
 * - 팟캐스트나 라디오 콘텐츠 제작
 * - 음성 지원 콘텐츠에서 TTS 기능 활용
 * - 음악 트랙의 전문적인 이퀄라이징 작업
 */

import React, { useState } from 'react';
import { Music, Volume2, Clock, Play, Pause, SkipBack, SkipForward, Sliders, Sparkles, BarChart3, Mic2 } from 'lucide-react';
import { AudioClip } from '../../../types/clipTypes';
import { setClipVolume } from '../../../types/clipUtils';
import WaveformVisualization from './WaveformVisualization';
import { ClipInfoViewer } from '../shared/ClipInfoViewer';
import { TTSVoiceSelector } from '../../shared/TTSVoiceSelector';
import { TabControl } from '../../common/ui/TabControl';
import { SliderWithNumber } from '../../common/ui/SliderWithNumber';
import { PropertySection } from '../shared/PropertySection';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { PresetGrid } from '../../common/ui';
import { CheckboxWithLabel } from '../../common/ui';
import { globalAlert } from '../../../utils/globalAlert';

/**
 * AudioPropertiesPanel 컴포넌트의 Props 인터페이스
 * @interface AudioPropertiesPanelProps
 */
interface AudioPropertiesPanelProps {
  /** 편집할 오디오 클립 데이터 */
  clip: AudioClip;
  /** 클립 속성 업데이트 콜백 함수 */
  onUpdate: (clipId: string, updates: Partial<AudioClip>) => void;
}

/**
 * 오디오 클립 전용 속성 패널 컴포넌트
 * 
 * 5개의 메인 탭으로 구성된 종합적인 오디오 편집 인터페이스:
 * 
 * 1. 기본 탭 - 볼륨 및 재생속도 제어
 *    - 0-200% 볼륨 범위 지원 (증폭 가능)
 *    - 실시간 볼륨 레벨 시각화
 *    - 다양한 재생속도 프리셋 (0.25x ~ 4x)
 * 
 * 2. TTS 탭 - 텍스트 음성 변환 전용 기능
 *    - 다국어 지원 및 음성 변수 선택
 *    - 실시간 텍스트 입력 및 미리보기
 *    - 에러 처리 및 사용자 피드백
 * 
 * 3. 파형 탭 - 시각적 오디오 분석 및 편집
 *    - 인터랙티브 파형 시각화
 *    - 오디오 구간 선택 및 재생 제어
 * 
 * 4. 이퀄라이저 탭 - 3밴드 주파수 조절
 *    - Low (80-250Hz), Mid (250Hz-4kHz), High (4-20kHz)
 *    - 전문적인 사운드 프리셋 제공
 * 
 * 5. 효과 탭 - 오디오 효과 및 하드웨어 에뮬레이션
 *    - 리버브, 에코, 컴프레서, 노이즈 게이트
 *    - 전문 녹음 스튜디오 환경 늨류의 프리셋
 * 
 * @param props - AudioPropertiesPanel 컴포넌트 속성
 * @returns 종합적인 오디오 편집 UI 컴포넌트
 */
export const AudioPropertiesPanel: React.FC<AudioPropertiesPanelProps> = ({ 
  clip, 
  onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'tts' | 'waveform' | 'equalizer' | 'effects'>('basic');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  /**
   * 오디오 재생/일시정지 토글 함수
   * @description 오디오 재생 상태를 전환하고 실제 오디오 재생을 제어
   * @note 실제 오디오 재생 로직은 비동기로 구현될 예정
   */
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // 실제 오디오 재생 로직은 여기에 추가
  };

  /**
   * 오디오 재생 시점 변경 함수
   * @param newTime - 새로운 재생 시점 (초 단위)
   * @description 파형 시각화나 시이커를 통해 오디오 재생 위치를 이동
   */
  const handleTimeChange = (newTime: number) => {
    setCurrentTime(newTime);
    // 실제 오디오 시간 변경 로직은 여기에 추가
  };

  /**
   * 안전한 볼륨 업데이트 함수
   * @param newVolume - 새로운 볼륨 값 (0.0 ~ 2.0 범위)
   * @description setClipVolume 유틸리티를 사용하여 안전한 벼륨 변경
   * @note 2.0을 초과하는 볼륨에 대한 경고 시스템 포함
   */
  const handleVolumeChange = (newVolume: number) => {
    const volumeUpdates = setClipVolume(clip, newVolume);
    if (Object.keys(volumeUpdates).length > 0) {
      onUpdate(clip.id, volumeUpdates);
    }
  };

  /**
   * 오디오 재생 속도 변경 함수
   * @param newRate - 새로운 재생 속도 (0.25 ~ 4.0 배속 범위)
   * @description 음성의 피치 변화 없이 속도만 조정
   */
  const handlePlaybackRateChange = (newRate: number) => {
    onUpdate(clip.id, { playbackRate: newRate });
  };

  /**
   * 음소거 토글 함수
   * @description 현재 볼륨이 0보다 크면 0으로, 0이면 1로 설정
   * @note 이전 볼륨 값을 기억하지 않으므로 반복 음소거 시 차이 발생 가능
   */
  const toggleMute = () => {
    const currentVolume = clip.volume || 1;
    const newVolume = currentVolume > 0 ? 0 : 1;
    handleVolumeChange(newVolume);
  };

  /**
   * 3밴드 이퀄라이저 업데이트 함수
   * @param frequency - 주파수 밴드 ('low', 'mid', 'high')
   * @param value - 주파수 강도 (-12dB ~ +12dB 범위)
   * @description Low(80-250Hz), Mid(250Hz-4kHz), High(4-20kHz) 밴드의 개별 조정
   */
  const handleEQUpdate = (frequency: string, value: number) => {
    const eq = clip.equalizer || { low: 0, mid: 0, high: 0 };
    onUpdate(clip.id, { 
      equalizer: { ...eq, [frequency]: value }
    });
  };

  /**
   * 오디오 효과 업데이트 함수
   * @param effect - 효과 이름 ('reverb', 'echo', 'compressor', 'noiseGate')
   * @param value - 효과 강도 (0-100% 범위)
   * @description 전문적인 오디오 효과를 실시간으로 적용
   */
  const handleEffectUpdate = (effect: string, value: number) => {
    const effects = clip.audioEffects || {};
    onUpdate(clip.id, { 
      audioEffects: { ...effects, [effect]: value }
    });
  };

  /**
   * TTS (Text-to-Speech) 활성화 토글 함수
   * @param enabled - TTS 활성화 여부
   * @description TTS 활성화 시 기본 설정값들을 자동으로 설정
   */
  const handleTTSToggle = (enabled: boolean) => {
    
    onUpdate(clip.id, { 
      generateTTS: enabled,
      // TTS 활성화 시 기본값 설정
      ...(enabled && {
        language: clip.language || 'auto',
        voice: clip.voice || 'ko-KR-Standard-A',
        ttsText: clip.ttsText || '여기에 음성으로 변환할 텍스트를 입력하세요.'
      })
    });
  };

  /**
   * TTS 텍스트 변경 함수
   * @param text - 음성으로 변환할 텍스트
   */
  const handleTTSTextChange = (text: string) => {
    onUpdate(clip.id, { ttsText: text });
  };

  /**
   * TTS 언어 변경 함수
   * @param language - 선택된 언어 코드 (ko-KR, en-US 등)
   */
  const handleLanguageChange = (language: string) => {
    onUpdate(clip.id, { language });
  };

  /**
   * TTS 음성 변수 변경 함수
   * @param voice - 선택된 음성 변수 (ko-KR-Standard-A 등)
   */
  const handleVoiceChange = (voice: string) => {
    onUpdate(clip.id, { voice });
  };

  /**
   * TTS 오디오 생성 함수
   * @description 입력된 텍스트를 기반으로 실제 오디오 파일을 생성
   * @note 현재는 모킹 버전이며, 실제 API 호출 기능은 구현 예정
   */
  const handleGenerateTTSAudio = async () => {
    if (!clip.ttsText || !clip.language || !clip.voice) {
      globalAlert.showWarning('TTS 텍스트, 언어, 음성을 모두 설정해주세요.');
      return;
    }

    try {
      // TODO: TTS API 호출해서 오디오 파일 생성
      console.log('TTS 오디오 생성:', {
        text: clip.ttsText,
        language: clip.language,
        voice: clip.voice
      });
      
      // 생성된 오디오 URL을 mediaUrl에 설정
      // const audioUrl = await generateTTSAudio(clip.ttsText, clip.language, clip.voice);
      // onUpdate(clip.id, { mediaUrl: audioUrl });
      
      globalAlert.showInfo('TTS 오디오 생성 기능은 구현 예정입니다.');
    } catch (error) {
      console.error('TTS 오디오 생성 실패:', error);
      globalAlert.showError('TTS 오디오 생성에 실패했습니다.');
    }
  };

  /**
   * 사전 정의된 재생 속도 배열
   * @description 일반적으로 사용되는 재생 속도 프리셋
   * @note 0.25x (아주 느림) ~ 4x (아주 빠름) 범위 지원
   */
  const presetPlaybackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

  return (
    <div className="space-y-3">
      {/* 기준클립 정보 섹션 - 가장 상단에 추가 */}
      <div className="border-b border-gray-700 pb-4">
        <ClipInfoViewer clip={clip} />
      </div>

      {/* 헤더 - Audio 클립 전용 */}
      <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-600/20 rounded-lg">
          <Music size={24} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">오디오 클립 (고급)</h3>
          <p className="text-gray-300 text-sm">
            {clip.name || '오디오 클립'} • {clip.duration.toFixed(2)}초
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <TabControl
        options={[
          { value: 'basic', label: '기본', icon: <Volume2 size={16} /> },
          { value: 'tts', label: 'TTS', icon: <Mic2 size={16} /> },
          { value: 'waveform', label: '파형', icon: <BarChart3 size={16} /> },
          { value: 'equalizer', label: '이퀄라이저', icon: <Sliders size={16} /> },
          { value: 'effects', label: '효과', icon: <Sparkles size={16} /> }
        ]}
        value={activeTab}
        onChange={setActiveTab}
        accentColor="purple"
      />

      {/* 기본 탭 */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <PropertySection
            title="기본 오디오 제어"
            icon={<Volume2 size={16} />}
          >

          {/* 볼륨 컨트롤 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-white font-medium flex items-center space-x-2">
                <Volume2 size={16} className="text-purple-400" />
                <span>볼륨 조절</span>
              </h5>
              
              <button
                onClick={toggleMute}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  (clip.volume || 1) === 0 
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30' 
                    : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {(clip.volume || 1) === 0 ? '음소거' : '음소거 해제'}
              </button>
            </div>

            {/* 볼륨 슬라이더 - 향상된 UI */}
            <div className="space-y-3">
              <SliderWithNumber
                label="볼륨"
                value={Math.round((clip.volume || 1) * 100)}
                min={0}
                max={200}
                step={5}
                suffix="%"
                onChange={(value) => handleVolumeChange(value / 100)}
              />
              
              {/* 볼륨 레벨 인디케이터 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">볼륨 레벨</span>
                <div className="flex items-center space-x-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((level) => (
                    <div
                      key={level}
                      className={`w-1 h-4 rounded ${
                        (clip.volume || 1) >= level 
                          ? level <= 1 
                            ? 'bg-green-500' 
                            : level <= 1.5 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 볼륨 프리셋 버튼들 */}
            <div className="flex space-x-2">
              {[0, 0.25, 0.5, 0.75, 1, 1.5, 2].map((volume) => (
                <button
                  key={volume}
                  onClick={() => handleVolumeChange(volume)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    Math.abs((clip.volume || 1) - volume) < 0.01
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {volume === 0 ? '음소거' : `${Math.round(volume * 100)}%`}
                </button>
              ))}
            </div>
          </div>

          {/* 재생 속도 컨트롤 */}
          <CollapsibleSection
            title="재생 속도"
            icon={<Clock size={16} />}
            isOpen={true}
            onToggle={() => {}}
          >
            <div className="space-y-4">
              <SliderWithNumber
                label="재생 속도"
                value={parseFloat(((clip.playbackRate || 1) * 100).toFixed(0))}
                min={25}
                max={400}
                step={5}
                suffix="%"
                onChange={(value) => handlePlaybackRateChange(value / 100)}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">상태</span>
                <div className="text-sm text-gray-400">
                  {(clip.playbackRate || 1) < 1 ? '느림' : 
                   (clip.playbackRate || 1) > 1 ? '빠름' : '보통'}
                </div>
              </div>
            </div>

            <PresetGrid
              label="재생 속도 프리셋"
              columns={4}
              items={presetPlaybackRates.map((rate) => ({
                name: `${rate}×`,
                value: rate.toString(),
                description: `${rate}배속`,
                isSelected: Math.abs((clip.playbackRate || 1) - rate) < 0.01,
                selectedColor: 'blue',
                onClick: () => handlePlaybackRateChange(rate)
              }))}
            />

            {/* 리셋 버튼 */}
            <button
              onClick={() => handlePlaybackRateChange(1)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              기본 속도로 리셋 (1×)
            </button>
          </CollapsibleSection>
          </PropertySection>
        </div>
      )}

      {/* TTS 탭 */}
      {activeTab === 'tts' && (
        <div className="space-y-6">
          <PropertySection
            title="텍스트 음성 변환 (TTS)"
            icon={<Mic2 size={16} />}
          >

          {/* TTS 활성화 토글 */}
          <CheckboxWithLabel
            label="TTS 음성 생성 활성화"
            description="텍스트를 입력하고 음성으로 변환하여 오디오 클립을 생성합니다."
            checked={clip.generateTTS || false}
            onChange={handleTTSToggle}
          />

          {clip.generateTTS && (
            <div className="space-y-4">
              {/* TTS 텍스트 입력 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <label className="block text-sm text-gray-300 mb-2">
                  📝 음성으로 변환할 텍스트
                </label>
                <textarea
                  value={clip.ttsText || ''}
                  onChange={(e) => handleTTSTextChange(e.target.value)}
                  placeholder="음성으로 변환할 텍스트를 입력하세요..."
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-green-500 focus:outline-none resize-vertical"
                  rows={4}
                />
                <div className="mt-2 text-xs text-gray-400">
                  {clip.ttsText ? `${clip.ttsText.length}자` : '텍스트를 입력하세요'}
                </div>
              </div>

              {/* 음성 선택기 (재사용 가능한 컴포넌트) */}
              <div className="bg-gray-800 rounded-lg p-4">
                <TTSVoiceSelector
                  selectedLanguage={clip.language || 'auto'}
                  selectedVoice={clip.voice || ''}
                  onLanguageChange={handleLanguageChange}
                  onVoiceChange={handleVoiceChange}
                  compact={true}
                />
              </div>

              {/* TTS 생성 버튼 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <button
                  onClick={handleGenerateTTSAudio}
                  disabled={!clip.ttsText || !clip.language || !clip.voice}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Mic2 size={16} />
                  <span>TTS 오디오 생성</span>
                </button>
                
                {(!clip.ttsText || !clip.language || !clip.voice) && (
                  <p className="text-red-400 text-sm mt-2 text-center">
                    텍스트, 언어, 음성을 모두 설정해주세요
                  </p>
                )}
              </div>
            </div>
          )}
          </PropertySection>
        </div>
      )}

      {/* 파형 탭 */}
      {activeTab === 'waveform' && (
        <div className="space-y-6">
          <WaveformVisualization
            audioUrl={clip.mediaUrl}
            duration={clip.duration}
            currentTime={currentTime}
            volume={clip.volume || 1}
            onTimeChange={handleTimeChange}
            onPlayToggle={togglePlayback}
            isPlaying={isPlaying}
          />
        </div>
      )}

      {/* 이퀄라이저 탭 */}
      {activeTab === 'equalizer' && (
        <div className="space-y-6">
          <PropertySection
            title="3밴드 이퀄라이저"
            icon={<Sliders size={16} />}
          >

          {/* 3밴드 EQ */}
          <div className="space-y-6">
            {[
              { key: 'low', label: 'Low (80-250Hz)', color: 'red' },
              { key: 'mid', label: 'Mid (250Hz-4kHz)', color: 'yellow' },
              { key: 'high', label: 'High (4-20kHz)', color: 'green' }
            ].map(({ key, label, color }) => (
              <div key={key} className="space-y-3">
                <SliderWithNumber
                  label={label}
                  value={clip.equalizer?.[key as keyof typeof clip.equalizer] || 0}
                  min={-12}
                  max={12}
                  step={0.5}
                  suffix="dB"
                  onChange={(value) => handleEQUpdate(key, value)}
                  resetValue={0}
                />
                
                {/* EQ 시각화 바 */}
                <div className="h-2 bg-gray-800 rounded-lg overflow-hidden">
                  <div 
                    className={`h-full bg-${color}-500 transition-all duration-200`}
                    style={{ 
                      width: `${Math.abs(clip.equalizer?.[key as keyof typeof clip.equalizer] || 0) * 4.17}%`,
                      marginLeft: (clip.equalizer?.[key as keyof typeof clip.equalizer] || 0) < 0 ? 'auto' : '0'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* EQ 프리셋 */}
          <PresetGrid
            label="EQ 프리셋"
            columns={2}
            items={[
              { name: '플랫', value: 'flat', description: '평면 EQ', isSelected: false, onClick: () => onUpdate(clip.id, { equalizer: { low: 0, mid: 0, high: 0 } }) },
              { name: '베이스 부스트', value: 'bass', description: '저음 강조', isSelected: false, onClick: () => onUpdate(clip.id, { equalizer: { low: 6, mid: 0, high: -2 } }) },
              { name: '보컬 강조', value: 'vocal', description: '중음 강조', isSelected: false, onClick: () => onUpdate(clip.id, { equalizer: { low: -3, mid: 4, high: 2 } }) },
              { name: '밝은 톤', value: 'bright', description: '고음 강조', isSelected: false, onClick: () => onUpdate(clip.id, { equalizer: { low: -2, mid: 2, high: 6 } }) },
              { name: '따뜻한 톤', value: 'warm', description: '따뜻한 사운드', isSelected: false, onClick: () => onUpdate(clip.id, { equalizer: { low: 3, mid: 1, high: -3 } }) },
              { name: '클래식', value: 'classic', description: '클래식 설정', isSelected: false, onClick: () => onUpdate(clip.id, { equalizer: { low: 2, mid: -2, high: 4 } }) }
            ]}
          />
          </PropertySection>
        </div>
      )}

      {/* 효과 탭 */}
      {activeTab === 'effects' && (
        <div className="space-y-6">
          <PropertySection
            title="오디오 효과"
            icon={<Sparkles size={16} />}
          >

          {/* 오디오 효과들 */}
          <div className="space-y-6">
            <SliderWithNumber
              label="리버브 (공간감)"
              value={clip.audioEffects?.reverb || 0}
              min={0}
              max={100}
              step={1}
              suffix="%"
              onChange={(value) => handleEffectUpdate('reverb', value)}
              resetValue={0}
            />

            <SliderWithNumber
              label="에코 (딜레이)"
              value={clip.audioEffects?.echo || 0}
              min={0}
              max={100}
              step={1}
              suffix="%"
              onChange={(value) => handleEffectUpdate('echo', value)}
              resetValue={0}
            />

            <SliderWithNumber
              label="컴프레서 (다이나믹)"
              value={clip.audioEffects?.compressor || 0}
              min={0}
              max={100}
              step={1}
              suffix="%"
              onChange={(value) => handleEffectUpdate('compressor', value)}
              resetValue={0}
            />

            <SliderWithNumber
              label="노이즈 게이트"
              value={clip.audioEffects?.noiseGate || 0}
              min={0}
              max={100}
              step={1}
              suffix="%"
              onChange={(value) => handleEffectUpdate('noiseGate', value)}
              resetValue={0}
            />
          </div>

          {/* 효과 프리셋 */}
          <PresetGrid
            label="효과 프리셋"
            columns={2}
            items={[
              { name: '클린', value: 'clean', description: '효과 없음', isSelected: false, onClick: () => onUpdate(clip.id, { audioEffects: { reverb: 0, echo: 0, compressor: 0, noiseGate: 0 } }) },
              { name: '스튜디오', value: 'studio', description: '스튜디오 설정', isSelected: false, onClick: () => onUpdate(clip.id, { audioEffects: { reverb: 15, echo: 5, compressor: 30, noiseGate: 20 } }) },
              { name: '콘서트홀', value: 'concert', description: '콘서트홀 음향', isSelected: false, onClick: () => onUpdate(clip.id, { audioEffects: { reverb: 45, echo: 20, compressor: 15, noiseGate: 10 } }) },
              { name: '라디오', value: 'radio', description: '라디오 방송', isSelected: false, onClick: () => onUpdate(clip.id, { audioEffects: { reverb: 5, echo: 0, compressor: 60, noiseGate: 40 } }) },
              { name: '팟캐스트', value: 'podcast', description: '팟캐스트 설정', isSelected: false, onClick: () => onUpdate(clip.id, { audioEffects: { reverb: 8, echo: 2, compressor: 40, noiseGate: 35 } }) },
              { name: '음성 향상', value: 'enhance', description: '음성 품질 향상', isSelected: false, onClick: () => onUpdate(clip.id, { audioEffects: { reverb: 10, echo: 3, compressor: 25, noiseGate: 50 } }) }
            ]}
          />

          {/* 향후 확장 기능 */}
          <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg border border-gray-600/30">
            <h5 className="text-gray-400 font-medium flex items-center space-x-2">
              <span className="text-lg">🚧</span>
              <span>향후 추가될 고급 효과들</span>
            </h5>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-500">
                <span>🎚️</span>
                <span>멀티밴드 컴프레서</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <span>🔊</span>
                <span>리미터 & 맥시마이저</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <span>🌊</span>
                <span>스테레오 와이드너</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <span>🤖</span>
                <span>AI 노이즈 제거</span>
              </div>
            </div>
          </div>
          </PropertySection>
        </div>
      )}

      {/* 오디오 정보 대시보드 */}
      <PropertySection
        title="오디오 분석"
        icon={<span className="text-lg">📊</span>}
      >

        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">원본 길이</span>
            <span className="text-white font-mono">{clip.duration.toFixed(2)}초</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">실제 재생 시간</span>
            <span className="text-white font-mono">
              {(clip.duration / (clip.playbackRate || 1)).toFixed(2)}초
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">볼륨 레벨</span>
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

          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">적용된 효과</span>
            <span className="text-white font-mono text-sm">
              {Object.entries(clip.audioEffects || {}).filter(([_, value]) => value > 0).length || 0}개
            </span>
          </div>

          {clip.mediaUrl && (
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">파일 경로</span>
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

export default AudioPropertiesPanel;
