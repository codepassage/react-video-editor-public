import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LongSentenceClip } from '../../types/clipTypes';
import {
  Eye,
  EyeOff,
  Settings,
  Mic,
  Play,
  RotateCcw,
  HelpCircle,
  FileText,
  Volume2,
  Type,
  Image,
  AlertCircle,
  Scissors,
  Sparkles
} from 'lucide-react';
import { useDebounceCallback } from '../../hooks/useDebounceCallback';
import { DEFAULT_FONT_SIZE, PREVIEW_SCALE, MIN_PREVIEW_FONT_SIZE } from '../../constants/textDefaults';
import { 
  DEFAULT_TEXT_PROPERTIES, 
  DEFAULT_MEDIA_PROPERTIES,
  getCompleteTextProperties,
  getCompleteMediaProperties,
  getCompleteClipForServer 
} from '../../constants/longSentenceDefaults';
import { TTSVoiceSelector } from '../shared/TTSVoiceSelector';
import { LongSentenceDataEditor } from './LongSentenceDataEditor';

// 새로운 공통 컴포넌트들
import { PositionTransformControls } from './shared/PositionTransformControls';
import { TextStyleControls } from './shared/TextStyleControls';
import { SimplifiedMediaControls } from './shared/SimplifiedMediaControls';
import { SettingsSection } from '../common/ui/SettingsSection';
import { PropertySection } from './shared/PropertySection';
import { EffectsEditor } from './EffectsEditor';
import { useEditorStore } from '../../store/editorStore';
import { ImagePropertiesEditor } from './polygonShape/ImagePropertiesEditor';
import { ImageFitEditor } from './polygonShape/ImageFitEditor';

// 커스텀 훅들
import { useLongSentenceDefaults } from './hooks/useLongSentenceDefaults';
import { useLongSentenceInitializers } from './hooks/useLongSentenceInitializers';

interface LongSentencePropertiesProps {
  clip: LongSentenceClip;
  onUpdate: (updates: Partial<LongSentenceClip>) => void;
  onPreviewSplit?: (text: string, options: any) => void;
  onConvert?: () => void;
  onDeleteChildClips?: () => void;
}

export const LongSentenceProperties: React.FC<LongSentencePropertiesProps> = ({
  clip,
  onUpdate,
  onPreviewSplit,
  onConvert,
  onDeleteChildClips,
}) => {
  // 클립 스토어에서 자식 클립들을 가져오기 위해
  const { tracks } = useEditorStore();
  // 모든 트랙의 클립들을 하나의 배열로 합치기
  const allClips = tracks.flatMap(track => track.clips || []);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [localData, setLocalData] = useState(clip.data || [{ text: '', mediaUrl: '', mediaProps: {} }]);

  // 언어 및 음성 상태
  const [selectedLanguage, setSelectedLanguage] = useState(clip.language || 'auto');
  const [selectedVoice, setSelectedVoice] = useState(clip.voice || '');

  // ImagePropertiesEditor용 상태들
  const [imageUrl, setImageUrl] = useState('');
  const [backgroundFit, setBackgroundFit] = useState<'fill' | 'contain' | 'cover' | 'none' | 'scale-down'>('fill');
  const [backgroundPosition, setBackgroundPosition] = useState('center');
  const [borderRadius, setBorderRadius] = useState(0);
  const [borderRadiusUnit, setBorderRadiusUnit] = useState<'px' | '%'>('px');
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [borderWidth, setBorderWidth] = useState(0);
  const [edgeFade, setEdgeFade] = useState(0);
  const [fadeType, setFadeType] = useState<'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right'>('radial');

  // 섹션 확장 상태
  const [expandedSections, setExpandedSections] = useState({
    split: true,
    generation: true,
    voice: true,
    advanced: false,
    textSettings: false,
    mediaSettings: false
  });

  // 디바운싱된 업데이트
  const debouncedUpdate = useDebounceCallback((updates: Partial<LongSentenceClip>) => {
    onUpdate(updates);
  }, 100);

  const immediateUpdate = useCallback((updates: Partial<LongSentenceClip>) => {
    console.log('🚀 immediateUpdate 호출됨:', { updates });
    console.log('🚀 onUpdate 함수 존재:', typeof onUpdate === 'function');
    onUpdate(updates);
    console.log('🚀 onUpdate 호출 완료');
  }, [onUpdate]);

  // 🎯 가상 클립은 렌더링 시 실시간으로 생성됨 (캐싱 없음)

  // 🎯 커스텀 onUpdate 핸들러들
  const handleTextEffectsUpdate = useCallback((virtualClipId: string, updates: any) => {
    console.log('📝 Text Effects Virtual Clip Update:', { virtualClipId, updates });

    // 🔍 폰트 크기 업데이트 특별 로깅
    if (updates.fontSize) {
      console.log('🔤 Font Size Update detected:', {
        newFontSize: updates.fontSize,
        currentTextProperties: clip.textProperties,
        currentFontSize: clip.textProperties?.fontSize
      });
    }

    // 가상 클립 ID는 무시하고 실제 클립의 textProperties 업데이트
    const textProperties = clip.textProperties || {};
    const finalUpdates = {
      textProperties: {
        ...textProperties,
        ...updates
      }
    };
    console.log('📦 Final text effects updates:', finalUpdates);
    immediateUpdate(finalUpdates);
  }, [clip.textProperties, immediateUpdate]);

  // 🎯 텍스트 효과 개별 속성 핸들러 (프리셋 버튼용)
  const handleTextPropertyChange = useCallback((property: string, value: any) => {
    console.log('📝 Text Property Change:', { property, value });
    const textProperties = clip.textProperties || {};

    let finalUpdates;
    if (property === 'batch' && typeof value === 'object') {
      // 배치 업데이트: 여러 속성을 한 번에 업데이트 (텍스트 페이드 프리셋용)
      finalUpdates = {
        textProperties: {
          ...textProperties,
          ...value
        }
      };
      console.log('📦 Text Batch Update:', { value, finalUpdates });
    } else {
      // 단일 속성 업데이트
      finalUpdates = {
        textProperties: {
          ...textProperties,
          [property]: value
        }
      };
    }

    immediateUpdate(finalUpdates);
  }, [clip.textProperties, immediateUpdate]);

  const handleMediaEffectsUpdate = useCallback((virtualClipId: string, updates: any) => {
    console.log('🎯 Media Effects Virtual Clip Update:', { virtualClipId, updates });
    // 가상 클립 ID는 무시하고 실제 클립의 mediaProperties 업데이트
    const mediaProperties = clip.mediaProperties || {};
    const finalUpdates = {
      mediaProperties: {
        ...mediaProperties,
        ...updates
      }
    };
    console.log('📦 Final media effects updates:', finalUpdates);
    immediateUpdate(finalUpdates);
  }, [clip.mediaProperties, immediateUpdate]);

  // 🎯 미디어 효과 개별 속성 핸들러 (프리셋 버튼용)
  const handleMediaPropertyChange = useCallback((property: string, value: any) => {
    const mediaProperties = clip.mediaProperties || {};

    let finalUpdates;
    if (property === 'batch' && typeof value === 'object') {
      // 배치 업데이트: 여러 속성을 한 번에 업데이트
      finalUpdates = {
        mediaProperties: {
          ...mediaProperties,
          ...value
        }
      };
    } else {
      // 단일 속성 업데이트
      finalUpdates = {
        mediaProperties: {
          ...mediaProperties,
          [property]: value
        }
      };
    }

    immediateUpdate(finalUpdates);
  }, [clip.mediaProperties, immediateUpdate]);

  const debouncedDataUpdate = useDebounceCallback((data: Array<{ text: string; mediaUrl: string; mediaProps?: any }>) => {
    onUpdate({ data });
  }, 300);

  // 클립 데이터와 로컬 상태 동기화
  useEffect(() => {
    setLocalData(clip.data || [{ text: '', mediaUrl: '', mediaProps: {} }]);
  }, [clip.data]);

  // 선택된 언어와 음성 동기화
  useEffect(() => {
    setSelectedLanguage(clip.language || 'auto');
    setSelectedVoice(clip.voice || '');
  }, [clip.language, clip.voice]);

  // ImagePropertiesEditor 상태들과 mediaProperties 동기화
  useEffect(() => {
    const firstItem = localData && localData.length > 0 ? localData[0] : null;
    const mediaProps = clip.mediaProperties || {};

    if (firstItem?.mediaUrl) {
      setImageUrl(firstItem.mediaUrl);
    }
    setBackgroundFit((mediaProps as any).backgroundFit || DEFAULT_MEDIA_PROPERTIES.backgroundFit);
    setBackgroundPosition((mediaProps as any).backgroundPosition || DEFAULT_MEDIA_PROPERTIES.backgroundPosition);
    setBorderRadius((mediaProps as any).borderRadius || DEFAULT_MEDIA_PROPERTIES.borderRadius);
    setBorderRadiusUnit((mediaProps as any).borderRadiusUnit || DEFAULT_MEDIA_PROPERTIES.borderRadiusUnit);
    setBorderColor((mediaProps as any).borderColor || DEFAULT_MEDIA_PROPERTIES.borderColor);
    setBorderWidth((mediaProps as any).borderWidth || DEFAULT_MEDIA_PROPERTIES.borderWidth);
    setEdgeFade((mediaProps as any).edgeFade || DEFAULT_MEDIA_PROPERTIES.edgeFade);
    setFadeType((mediaProps as any).fadeType || DEFAULT_MEDIA_PROPERTIES.fadeType);
  }, [clip.mediaProperties, localData]);

  // === 커스텀 훅 사용 ===
  const { mediaDefaults, textDefaults } = useLongSentenceDefaults(clip);
  const { createInitialMediaProperties, createInitialTextProperties } = useLongSentenceInitializers(clip);

  const getEffectiveMediaProperties = useCallback(() => {
    const current = clip.mediaProperties || {};
    return {
      x: current.x !== undefined ? current.x : mediaDefaults.x,
      y: current.y !== undefined ? current.y : mediaDefaults.y,
      width: current.width !== undefined ? current.width : mediaDefaults.width,
      height: current.height !== undefined ? current.height : mediaDefaults.height,
      opacity: current.opacity !== undefined ? current.opacity : mediaDefaults.opacity,
      rotation: current.rotation !== undefined ? current.rotation : mediaDefaults.rotation,
      volume: current.volume !== undefined ? current.volume : mediaDefaults.volume,
      playbackRate: current.playbackRate !== undefined ? current.playbackRate : mediaDefaults.playbackRate,
    };
  }, [clip.mediaProperties, mediaDefaults]);

  // === 초기값 동기화 Effects ===
  useEffect(() => {
    // textProperties 초기값 동기화 (누락된 속성들 채우기)
    const current = clip.textProperties || {};
    const missingKeys = Object.keys(textDefaults).filter(key =>
      !(key in current) || current[key as keyof typeof current] === undefined
    );

    if (!clip.textProperties || missingKeys.length > 0) {
      const mergedTextProperties = {
        ...textDefaults,
        ...current  // 기존 값들은 유지
      };

      console.log('🔄 textProperties 초기화/병합:', {
        기존: current,
        병합후: mergedTextProperties,
        누락된속성: missingKeys
      });

      immediateUpdate({
        textProperties: mergedTextProperties
      });
    }
  }, []); // 한 번만 실행

  useEffect(() => {
    // mediaProperties 초기값 동기화
    const effective = getEffectiveMediaProperties();
    const current = clip.mediaProperties || {};

    const needsSync = ['x', 'y', 'width', 'height', 'opacity', 'rotation', 'volume', 'playbackRate'].some(
      key => (current as any)[key] !== (effective as any)[key]
    );

    if (needsSync) {
      console.log('🔄 mediaProperties 동기화:', {
        현재: current,
        동기화후: effective
      });

      immediateUpdate({
        mediaProperties: effective
      });
    }
  }, []); // 한 번만 실행

  // 미리보기 자동 업데이트
  useEffect(() => {
    const hasValidData = localData.some(item => item.text && item.text.length > 10);
    if (hasValidData && onPreviewSplit && previewMode) {
      const timer = setTimeout(() => {
        handlePreviewSplit();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [localData, clip.maxWordsPerSentence, clip.splitOnPunctuation, clip.language]);

  const handleDataChange = (data: Array<{ text: string; mediaUrl: string; mediaProps?: any }>) => {
    setLocalData(data);

    const firstItem = data && data.length > 0 ? data[0] : null;
    let updates: any = { data };

    // 미디어가 처음 선택될 때 mediaSettings 초기화
    if (firstItem?.mediaUrl && !clip.mediaProperties) {
      console.log('🎬 Initializing mediaProperties for first time');
      updates.mediaProperties = createInitialMediaProperties();
    }

    // 텍스트가 처음 입력될 때 textProperties 초기화
    if (firstItem?.text && !clip.textProperties) {
      console.log('📝 Initializing textProperties for first time');
      updates.textProperties = createInitialTextProperties();
    }

    if (updates.mediaProperties || updates.textProperties) {
      immediateUpdate(updates);
    } else {
      debouncedDataUpdate(data);
    }
  };

  const handleStyleChange = (property: string, value: any) => {
    console.log('🔧 handleStyleChange 호출됨:', { property, value });

    // displayMode는 루트 레벨에 저장 (LongSentenceClip 렌더링 제어용)
    if (property === 'displayMode') {
      console.log('📺 Display mode change:', { property, value });
      immediateUpdate({ [property]: value });
      return;
    }

    // 나머지 텍스트 스타일은 textProperties에 저장
    const textProperties = clip.textProperties || {};

    let finalUpdates;
    if (property === 'batch' && typeof value === 'object') {
      // 배치 업데이트: 여러 속성을 한 번에 업데이트 (패딩 설정용)
      console.log('🚨 BATCH 업데이트 감지됨!', { value });
      finalUpdates = {
        textProperties: {
          ...textProperties,
          ...value
        }
      };
      console.log('📦 Text Style Batch Update:', { value, finalUpdates });
    } else {
      // 단일 속성 업데이트
      console.log('📝 단일 속성 업데이트:', { property, value });
      finalUpdates = {
        textProperties: {
          ...textProperties,
          [property]: value
        }
      };
      console.log('📝 Text style change:', { property, value, finalUpdates });
    }

    immediateUpdate(finalUpdates);
  };

  // 텍스트 속성 업데이트 핸들러
  const handleTextPropertyUpdate = (clipId: string, updates: any) => {
    console.log('📝 Text property update:', updates);
    console.log('📋 Current textProperties:', clip.textProperties);

    // 모든 속성들을 textProperties에 저장 (x, y 포함)
    const textProperties = clip.textProperties || {};
    const finalUpdates = {
      textProperties: {
        ...textProperties,
        ...updates
      }
    };
    console.log('📦 Final text updates:', finalUpdates);
    immediateUpdate(finalUpdates);
  };

  // 미디어 속성 업데이트 핸들러
  const handleMediaPropertyUpdate = (clipId: string, updates: any) => {
    console.log('🎯 Media property update:', updates);
    const mediaProperties = clip.mediaProperties || {};

    const finalUpdates = {
      mediaProperties: {
        ...mediaProperties,
        ...updates
      }
    };

    console.log('📦 Final media updates:', finalUpdates);
    immediateUpdate(finalUpdates);
  };

  // ImagePropertiesEditor용 mediaProperties 업데이트 핸들러 (EffectsEditor와 동일한 패턴)
  const handleImagePropertiesUpdate = useCallback((updates: any) => {
    console.log('🎨 ImagePropertiesUpdate 호출됨:', { updates });
    console.log('🔍 현재 mediaProperties:', clip.mediaProperties);
    
    // borderColor 그대로 사용 (strokeColor 변환 제거)
    const convertedUpdates = { ...updates };
    
    // EffectsEditor와 동일한 방식으로 mediaProperties 업데이트
    const mediaProperties = clip.mediaProperties || {};
    const finalUpdates = {
      mediaProperties: {
        ...mediaProperties,
        ...convertedUpdates
      }
    };
    console.log('📦 Final ImageProperties updates:', finalUpdates);
    immediateUpdate(finalUpdates);
  }, [clip.mediaProperties, immediateUpdate]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    immediateUpdate({ language });
  };

  const handleVoiceSelect = (voiceName: string) => {
    setSelectedVoice(voiceName);
    immediateUpdate({ voice: voiceName });
  };

  const handlePreviewSplit = async () => {
    if (!onPreviewSplit) return;

    const firstValidText = localData.find(item => item.text && item.text.trim())?.text;
    if (!firstValidText) return;

    setIsPreviewLoading(true);
    try {
      const options = {
        maxWordsPerSentence: clip.maxWordsPerSentence,
        splitOnPunctuation: clip.splitOnPunctuation,
        language: clip.language
      };

      const result = await onPreviewSplit(firstValidText, options);
      setPreviewResult(result);
    } catch (error) {
      console.error('미리보기 실패:', error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // === 유틸리티 함수들 ===
  const getLanguageDisplayName = useCallback((code: string): string => {
    const languageMap: Record<string, string> = {
      auto: '자동 감지',
      ko: '한국어',
      en: 'English',
      ja: '日本語',
      zh: '中文',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ar: 'العربية',
      hi: 'हिन्दी',
    };

    return languageMap[code] || code.toUpperCase();
  }, []);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xl">
            <span>📖</span>
            <span className="text-white font-medium">LongSentence 편집기</span>
          </div>
          {clip.generatedClips && clip.generatedClips.length > 0 && (
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
              {clip.generatedClips.length} 클립 생성됨
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2 py-1 rounded text-xs transition-colors ${previewMode
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            title={previewMode ? '미리보기 ON' : '미리보기 OFF'}
          >
            {previewMode ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAdvanced ? '간단히' : '고급 모드'}
          </button>

          {/* 🔍 생성된 클립 이펙트 확인 버튼 */}
          {clip.childClipIds && clip.childClipIds.length > 0 && (
            <button
              onClick={() => {
                console.group('🔍 생성된 클립들의 이펙트 확인');
                console.log('📖 부모 클립 (LongSentence):', {
                  id: clip.id,
                  textProperties: clip.textProperties,
                  mediaProperties: clip.mediaProperties
                });

                // 스토어에서 자식 클립들 가져오기
                const childClips = clip.childClipIds?.map(id => {
                  return allClips.find(c => c.id === id);
                }).filter(Boolean) || [];

                console.log('👶 자식 클립들:', childClips.map(child => ({
                  id: child.id,
                  mediaType: child.mediaType,
                  text: (child as any).text?.substring(0, 30) + '...',
                  effects: {
                    brightness: (child as any).brightness,
                    contrast: (child as any).contrast,
                    saturation: (child as any).saturation,
                    fadeIn: (child as any).fadeIn,
                    fadeOut: (child as any).fadeOut,
                    animationType: (child as any).animationType,
                    animationDuration: (child as any).animationDuration
                  }
                })));

                console.groupEnd();
              }}
              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
              title="콘솔에서 생성된 클립들의 이펙트 확인"
            >
              🔍 이펙트 확인
            </button>
          )}
        </div>
      </div>

      {/* 텍스트 + 미디어 데이터 입력 */}
      <LongSentenceDataEditor
        data={localData}
        onChange={handleDataChange}
      />

      {/* 텍스트 미리보기 */}
      {localData.some(item => item.text) && previewMode && (
        <div className="p-3 bg-gray-900 border border-gray-600 rounded">
          <h4 className="text-sm text-gray-300 mb-2 flex items-center space-x-2">
            <Eye size={14} />
            <span>스타일 미리보기</span>
          </h4>
          <div className="space-y-2">
            {localData.slice(0, 2).map((item, index) => (
              item.text && (
                <div key={index} className="border-l-2 border-blue-500 pl-3">
                  <div className="text-xs text-gray-400 mb-1">항목 {index + 1}</div>
                  <div
                    className="text-white"
                    style={{
                      fontFamily: clip.fontFamily || 'Arial',
                      fontSize: `${Math.max(MIN_PREVIEW_FONT_SIZE, (clip.fontSize || DEFAULT_FONT_SIZE) * PREVIEW_SCALE)}px`,
                      fontWeight: clip.fontWeight || 'normal',
                      color: clip.color || '#ffffff',
                      textAlign: clip.textAlign as any || 'left',
                      lineHeight: clip.lineHeight || 1.2,
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      backgroundColor: (clip.backgroundColor && clip.backgroundColor !== 'transparent') ? clip.backgroundColor : 'transparent',
                      padding: (clip.backgroundColor && clip.backgroundColor !== 'transparent')
                        ? `${clip.paddingTop || 8}px ${clip.paddingRight || 12}px ${clip.paddingBottom || 8}px ${clip.paddingLeft || 12}px`
                        : '0',
                      borderRadius: (clip.borderRadius && clip.borderRadius > 0) ? `${clip.borderRadius}px` : '0',
                      textShadow: (clip.textShadow && clip.textShadow !== 'none') ? clip.textShadow : 'none',
                      letterSpacing: clip.letterSpacing ? `${clip.letterSpacing}px` : 'normal',
                      textDecoration: clip.textDecoration || 'none',
                      textTransform: clip.textTransform as any || 'none'
                    }}
                  >
                    {item.text.slice(0, 100)}{item.text.length > 100 ? '...' : ''}
                  </div>
                </div>
              )
            ))}
            {localData.length > 2 && (
              <div className="text-center text-xs text-gray-400 italic">
                ...그리고 {localData.length - 2}개 항목 더
              </div>
            )}
          </div>
        </div>
      )}

      {/* 분할 설정 섹션 */}
      <SettingsSection
        title="분할 설정"
        icon={<Scissors size={16} />}
        isOpen={expandedSections.split}
        onToggle={() => toggleSection('split')}
        iconColor="text-blue-400"
      >

        <div className="space-y-4">
          {/* 최대 단어 수 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">최대 단어 수</label>
              <span className="text-sm text-white bg-gray-700 px-2 py-1 rounded">
                {clip.maxWordsPerSentence}단어
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={clip.maxWordsPerSentence}
              onChange={(e) => handleStyleChange('maxWordsPerSentence', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 구두점 기준 분할 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="splitOnPunctuation"
              checked={clip.splitOnPunctuation}
              onChange={(e) => handleStyleChange('splitOnPunctuation', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="splitOnPunctuation" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
              <span>구두점 기준 분할</span>
              <div title="마침표, 느낌표, 물음표를 기준으로 문장을 분할합니다">
                <HelpCircle size={14} className="text-gray-400" />
              </div>
            </label>
          </div>

          {/* 언어 안내 */}
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-300 flex items-center space-x-2">
              <span>🌏</span>
              <span>언어 설정</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              현재 언어: <span className="text-white font-medium bg-gray-600 px-2 py-0.5 rounded">{getLanguageDisplayName(clip.language || 'ko')}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              💡 언어 변경은 아래 "음성 설정" 섹션에서 가능합니다
            </p>
          </div>

          {/* 분할 미리보기 */}
          {localData.some(item => item.text) && previewMode && (
            <div className="bg-gray-700 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">분할 미리보기</label>
                <button
                  onClick={handlePreviewSplit}
                  disabled={isPreviewLoading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
                >
                  {isPreviewLoading ? '분석 중...' : '미리보기'}
                </button>
              </div>

              {previewResult && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                    <span>예상 문장 수: <strong className="text-white">{previewResult.totalSentences}</strong></span>
                    <span>평균 단어 수: <strong className="text-white">{Math.round(previewResult.averageWordsPerSentence)}</strong></span>
                    <span>예상 시간: <strong className="text-white">{Math.round(previewResult.estimatedDuration)}초</strong></span>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {previewResult.sentences?.slice(0, 3).map((sentence: string, index: number) => (
                      <div key={index} className="flex gap-2 p-2 bg-gray-800 rounded">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="text-xs text-gray-300 leading-relaxed">{sentence}</span>
                      </div>
                    ))}
                    {previewResult.sentences?.length > 3 && (
                      <div className="text-center text-xs text-gray-400 italic">
                        ...그리고 {previewResult.sentences.length - 3}개 문장 더
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SettingsSection>

      {/* ===== 새로운 분리된 섹션들 ===== */}

      {/* 텍스트 설정 섹션 */}
      <SettingsSection
        title="텍스트 설정"
        icon={<Type size={16} />}
        isOpen={expandedSections.textSettings}
        onToggle={() => toggleSection('textSettings')}
        badge="독립 제어"
        badgeColor="orange"
        iconColor="text-orange-400"
      >

        <div className="space-y-6">
          {/* 텍스트 위치 및 변환 컨트롤 */}
          <PositionTransformControls
            clip={{
              id: clip.id,
              x: clip.textProperties?.x ?? 100,
              y: clip.textProperties?.y ?? 100,
              width: clip.textProperties?.width ?? 800,
              height: clip.textProperties?.height ?? 200,
              rotation: clip.textProperties?.rotation ?? 0,
              opacity: clip.textProperties?.opacity ?? 1,
              positionMargin: clip.textProperties?.positionMargin ?? { top: 50, right: 50, bottom: 50, left: 50 },
              positioning: clip.textProperties?.positioning ?? 'coordinate',
              alignment: clip.textProperties?.alignment
            }}
            onUpdate={handleTextPropertyUpdate}
            titlePrefix="텍스트"
            includeRotation={true}
            includeSizeControls={true}
            includeOpacity={true}
            includePositionPresets={true}
            textContext={{
              fontSize: clip.fontSize || 24,
              lineHeight: clip.lineHeight || 1.2,
              textContent: localData.find(item => item.text)?.text || 'Sample Text'
            }}
          />

          {/* 구분선 */}
          <div className="border-t border-gray-600"></div>

          {/* 텍스트 스타일 컨트롤 */}
          <TextStyleControls
            clip={(() => {
              const textStyleClip = {
                ...clip,
                // TextStyleControls가 읽을 수 있도록 textProperties 값들을 루트 레벨에 복사
                fontSize: clip.textProperties?.fontSize || clip.fontSize,
                color: clip.textProperties?.color || clip.color,
                fontFamily: clip.textProperties?.fontFamily || clip.fontFamily,
                fontWeight: clip.textProperties?.fontWeight || clip.fontWeight,
                textAlign: clip.textProperties?.textAlign || clip.textAlign,
                lineHeight: clip.textProperties?.lineHeight || clip.lineHeight,
                letterSpacing: clip.textProperties?.letterSpacing || clip.letterSpacing,
                textDecoration: clip.textProperties?.textDecoration || clip.textDecoration,
                textTransform: clip.textProperties?.textTransform || clip.textTransform,
                backgroundColor: clip.textProperties?.backgroundColor || clip.backgroundColor,
                borderRadius: clip.textProperties?.borderRadius || clip.borderRadius,
                // 🔧 누락된 텍스트 그림자와 패딩 속성들 추가
                textShadow: clip.textProperties?.textShadow || clip.textShadow,
                paddingTop: clip.textProperties?.paddingTop || clip.paddingTop,
                paddingRight: clip.textProperties?.paddingRight || clip.paddingRight,
                paddingBottom: clip.textProperties?.paddingBottom || clip.paddingBottom,
                paddingLeft: clip.textProperties?.paddingLeft || clip.paddingLeft,
              };

              console.log('🔧 TextStyleControls에 전달되는 clip 디버깅:', {
                원본패딩: {
                  paddingTop: clip.paddingTop,
                  paddingRight: clip.paddingRight,
                  paddingBottom: clip.paddingBottom,
                  paddingLeft: clip.paddingLeft,
                },
                textProperties패딩: {
                  paddingTop: clip.textProperties?.paddingTop,
                  paddingRight: clip.textProperties?.paddingRight,
                  paddingBottom: clip.textProperties?.paddingBottom,
                  paddingLeft: clip.textProperties?.paddingLeft,
                },
                최종전달되는패딩: {
                  paddingTop: textStyleClip.paddingTop,
                  paddingRight: textStyleClip.paddingRight,
                  paddingBottom: textStyleClip.paddingBottom,
                  paddingLeft: textStyleClip.paddingLeft,
                }
              });

              return textStyleClip;
            })()}
            onStyleChange={handleStyleChange}
            titlePrefix="텍스트"
            showBackgroundControls={true}
            showPaddingControls={true}
            showBorderControls={true}
          />

          {/* 텍스트 효과 및 애니메이션 - 가상 클립 사용 */}
          {useMemo(() => {
            const firstItem = localData && localData.length > 0 ? localData[0] : null;
            if (!firstItem?.text) return null;

            // 🔄 실시간 textProperties 값 직접 참조
            const textProps = clip.textProperties || {};
            console.log('🔍 가상클립 생성시 textProps 디버깅:', {
              hasClipTextProperties: !!clip.textProperties,
              textPropsKeys: Object.keys(textProps),
              전체textProps: textProps,
              paddingInTextProps: {
                paddingTop: textProps.paddingTop,
                paddingRight: textProps.paddingRight,
                paddingBottom: textProps.paddingBottom,
                paddingLeft: textProps.paddingLeft,
              },
              직접접근: {
                paddingTop: textProps['paddingTop'],
                paddingRight: textProps['paddingRight'],
                paddingBottom: textProps['paddingBottom'],
                paddingLeft: textProps['paddingLeft'],
              }
            });

            console.log('🔍 현재 클립 상태 확인:', {
              clipId: clip.id.slice(-8),
              전체textProperties: clip.textProperties,
              클립에저장된패딩: {
                paddingTop: clip.textProperties?.paddingTop,
                paddingRight: clip.textProperties?.paddingRight,
                paddingBottom: clip.textProperties?.paddingBottom,
                paddingLeft: clip.textProperties?.paddingLeft,
              }
            });

            const textVirtualClip = {
              id: `${clip.id}-text`,
              mediaType: 'text' as const,
              text: firstItem.text,
              // 기본 속성들
              startTime: clip.startTime,
              endTime: clip.endTime,
              duration: clip.duration,
              trackId: clip.trackId,
              mediaId: clip.mediaId,
              name: clip.name,
              // 시각 속성들 - 텍스트 독립적인 기본값 사용
              x: clip.textProperties?.x,
              y: clip.textProperties?.y,
              width: clip.textProperties?.width,
              height: clip.textProperties?.height,
              opacity: clip.textProperties?.opacity,
              rotation: clip.textProperties?.rotation,

              // 🎯 텍스트 스타일 속성들
              fontSize: (textProps as any).fontSize,
              fontFamily: (textProps as any).fontFamily,
              fontWeight: (textProps as any).fontWeight,
              textAlign: (textProps as any).textAlign,
              color: (textProps as any).color,
              backgroundColor: (textProps as any).backgroundColor,
              lineHeight: (textProps as any).lineHeight,
              letterSpacing: (textProps as any).letterSpacing,
              textDecoration: (textProps as any).textDecoration,
              textTransform: (textProps as any).textTransform,
              borderRadius: (textProps as any).borderRadius,

              // 🔧 텍스트 그림자와 패딩 속성들 추가 - 직접 접근
              textShadow: textProps.textShadow,
              paddingTop: textProps.paddingTop,
              paddingRight: textProps.paddingRight,
              paddingBottom: textProps.paddingBottom,
              paddingLeft: textProps.paddingLeft,

              // 🎯 실시간 값 직접 사용 (캐싱 없음)
              brightness: (textProps as any).brightness,
              contrast: (textProps as any).contrast,
              saturation: (textProps as any).saturation,
              hue: (textProps as any).hue,
              blur: (textProps as any).blur,
              sepia: (textProps as any).sepia,
              grayscale: (textProps as any).grayscale,
              fadeIn: (textProps as any).fadeIn,
              fadeOut: (textProps as any).fadeOut,
              animationType: (textProps as any).animationType,
              animationDuration: (textProps as any).animationDuration,
              animationDelay: (textProps as any).animationDelay,
              animationEasing: (textProps as any).animationEasing,
              animationLoop: (textProps as any).animationLoop,
            };

            return (
              <EffectsEditor
                clip={textVirtualClip as any}
                onUpdate={handleTextEffectsUpdate}
                customPropertyHandler={handleTextPropertyChange}
              />
            );
          }, [
            // 🎯 구체적인 패딩 의존성 추가하여 값 변경시 다시 렌더링
            clip.id,
            clip.textProperties?.paddingTop,
            clip.textProperties?.paddingRight,
            clip.textProperties?.paddingBottom,
            clip.textProperties?.paddingLeft,
            // 🎯 다른 텍스트 속성들도 개별 의존성 추가
            clip.textProperties?.fontSize,
            clip.textProperties?.color,
            clip.textProperties?.backgroundColor,
            clip.textProperties?.fadeIn,
            clip.textProperties?.fadeOut,
            clip.textProperties?.animationType,
            localData?.[0]?.text,
            handleTextEffectsUpdate,
            handleTextPropertyChange
          ])}

        </div>
      </SettingsSection>

      {/* 미디어 설정 섹션 */}
      <SettingsSection
        title="미디어 설정"
        icon={<Image size={16} />}
        isOpen={expandedSections.mediaSettings}
        onToggle={() => toggleSection('mediaSettings')}
        badge="독립 제어"
        badgeColor="blue"
        iconColor="text-cyan-400"
      >

        <div className="space-y-6">
          {/* 미디어 위치 및 변환 컨트롤 */}
          <PositionTransformControls
            clip={{
              id: clip.id,
              ...getEffectiveMediaProperties(),
              positionMargin: clip.mediaProperties?.positionMargin ?? { top: 50, right: 50, bottom: 50, left: 50 }
            }}
            onUpdate={handleMediaPropertyUpdate}
            titlePrefix="미디어"
            includeRotation={true}
            includeSizeControls={true}
            includeOpacity={true}
            includePositionPresets={true}
          />

          {/* 미디어 효과 및 애니메이션 - 가상 클립 사용 */}
          {useMemo(() => {
            const firstItem = localData && localData.length > 0 ? localData[0] : null;
            if (!firstItem?.mediaUrl) return null;

            const isVideo = /\.(mp4|webm|mov|avi)$/i.test(firstItem.mediaUrl);
            const mediaType = isVideo ? 'video' : 'image';

            // 🔄 실시간 mediaProperties 값 직접 참조
            const mediaProps = clip.mediaProperties || {};
            
            console.log('🎬 Media Virtual Clip 생성 중:', {
              clipId: clip.id.slice(-8),
              mediaPropsKeys: Object.keys(mediaProps),
              borderColor: (mediaProps as any).borderColor,
              전체mediaProps: mediaProps
            });

            const mediaVirtualClip = {
              id: `${clip.id}-media`,
              mediaUrl: firstItem.mediaUrl,
              mediaType: mediaType === 'video' ? 'video' : 'image',
              // 기본 속성들
              startTime: clip.startTime,
              endTime: clip.endTime,
              duration: clip.duration,
              trackId: clip.trackId,
              mediaId: clip.mediaId,
              name: clip.name,
              // 시각 속성들 - Player와 동일한 데이터 소스 사용
              x: clip.mediaProperties?.x,
              y: clip.mediaProperties?.y,
              width: clip.mediaProperties?.width,
              height: clip.mediaProperties?.height,
              opacity: clip.mediaProperties?.opacity,
              rotation: clip.mediaProperties?.rotation,
              // 🎯 실시간 값 직접 사용 (캐싱 없음)
              brightness: (mediaProps as any).brightness,
              contrast: (mediaProps as any).contrast,
              saturation: (mediaProps as any).saturation,
              hue: (mediaProps as any).hue,
              blur: (mediaProps as any).blur,
              sepia: (mediaProps as any).sepia,
              grayscale: (mediaProps as any).grayscale,
              fadeIn: (mediaProps as any).fadeIn || 0,
              fadeOut: (mediaProps as any).fadeOut || 0,
              animationType: (mediaProps as any).animationType,
              animationDuration: (mediaProps as any).animationDuration,
              animationDelay: (mediaProps as any).animationDelay,
              animationEasing: (mediaProps as any).animationEasing,
              animationLoop: (mediaProps as any).animationLoop,
              // 미디어 전용 속성들
              volume: isVideo ? 1 : undefined,
              playbackRate: isVideo ? 1 : undefined,
              // 🎯 ImagePropertiesEditor용 추가 속성들
              polygonShapeProperties: (() => {
                const polygonProps = {
                  ...mediaProps,
                  backgroundImageUrl: firstItem.mediaUrl,
                  backgroundFit: (mediaProps as any).backgroundFit || 'fill',
                  backgroundPosition: (mediaProps as any).backgroundPosition || 'center',
                  borderRadius: (mediaProps as any).borderRadius || 0,
                  borderRadiusUnit: (mediaProps as any).borderRadiusUnit || 'px',
                  edgeFade: (mediaProps as any).edgeFade || 0,
                  fadeType: (mediaProps as any).fadeType || 'radial',
                  borderWidth: (mediaProps as any).borderWidth || 0,
                  borderColor: (mediaProps as any).borderColor || '#ffffff',
                  shadowEnabled: (mediaProps as any).shadowEnabled || false,
                  shadowOffsetX: (mediaProps as any).shadowOffsetX || 4,
                  shadowOffsetY: (mediaProps as any).shadowOffsetY || 4,
                  shadowBlur: (mediaProps as any).shadowBlur || 8,
                  shadowColor: (mediaProps as any).shadowColor || 'rgba(0, 0, 0, 0.3)',
                  innerShadowEnabled: (mediaProps as any).innerShadowEnabled || false,
                  innerShadowOffsetX: (mediaProps as any).innerShadowOffsetX || 2,
                  innerShadowOffsetY: (mediaProps as any).innerShadowOffsetY || 2,
                  innerShadowBlur: (mediaProps as any).innerShadowBlur || 4,
                  innerShadowColor: (mediaProps as any).innerShadowColor || 'rgba(0, 0, 0, 0.5)'
                };
                
                console.log('🎨 PolygonShapeProperties 생성:', {
                  clipId: clip.id.slice(-8),
                  borderColorFromMediaProps: (mediaProps as any).borderColor,
                  finalBorderColor: polygonProps.borderColor,
                  전체polygonProps: polygonProps
                });
                
                return polygonProps;
              })()
            };

            return (
              <div>
                <EffectsEditor
                  clip={mediaVirtualClip as any}
                  onUpdate={handleMediaEffectsUpdate}
                  customPropertyHandler={handleMediaPropertyChange}
                />

                {/* ImageFitEditor 분리 렌더링 */}
                <ImageFitEditor
                  backgroundFit={backgroundFit}
                  setBackgroundFit={setBackgroundFit}
                  backgroundPosition={backgroundPosition}
                  setBackgroundPosition={setBackgroundPosition}
                  updatePolygonShapeProperties={handleImagePropertiesUpdate}
                />

                {/* ImagePropertiesEditor - backgroundFit 관련 prop 제거 */}
                <ImagePropertiesEditor
                  clip={mediaVirtualClip as any}
                  imageUrl={imageUrl}
                  setImageUrl={setImageUrl}
                  borderRadius={borderRadius}
                  setBorderRadius={setBorderRadius}
                  borderRadiusUnit={borderRadiusUnit}
                  setBorderRadiusUnit={setBorderRadiusUnit}
                  edgeFade={edgeFade}
                  setEdgeFade={setEdgeFade}
                  fadeType={fadeType}
                  setFadeType={setFadeType}
                  updatePolygonShapeProperties={handleImagePropertiesUpdate}
                />
              </div>
            );
          }, [
            // 🎯 필요한 의존성만 포함 (currentTime 제외하여 무한루프 방지)
            clip.id,
            clip.mediaProperties,
            localData?.[0]?.mediaUrl,
            backgroundFit,
            backgroundPosition,
            borderRadius,
            borderRadiusUnit,
            borderColor,
            borderWidth,
            edgeFade,
            fadeType,
            imageUrl,
            handleMediaEffectsUpdate,
            handleMediaPropertyChange,
            handleImagePropertiesUpdate
          ])}

        </div>
      </SettingsSection>

      {/* ===== 기존 섹션들 ===== */}

      {/* 생성 옵션 섹션 */}
      <SettingsSection
        title="생성 옵션"
        icon={<Settings size={16} />}
        isOpen={expandedSections.generation}
        onToggle={() => toggleSection('generation')}
        iconColor="text-purple-400"
      >

        <div className="space-y-4">
          {/* 생성 타입 선택 */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">생성 타입</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="generateBoth"
                  name="generationType"
                  value="both"
                  checked={clip.generateTTS && clip.generateText !== false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleStyleChange('generateTTS', true);
                      handleStyleChange('generateText', true);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="generateBoth" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Type size={14} />
                    <span>+</span>
                    <Volume2 size={14} />
                  </div>
                  <span>텍스트 + 오디오 생성</span>
                  <span className="text-xs text-gray-400">(추천)</span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="generateTextOnly"
                  name="generationType"
                  value="textOnly"
                  checked={clip.generateText !== false && !clip.generateTTS}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleStyleChange('generateTTS', false);
                      handleStyleChange('generateText', true);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="generateTextOnly" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
                  <Type size={14} />
                  <span>텍스트만 생성</span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="generateAudioOnly"
                  name="generationType"
                  value="audioOnly"
                  checked={clip.generateTTS && clip.generateText === false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleStyleChange('generateTTS', true);
                      handleStyleChange('generateText', false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="generateAudioOnly" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
                  <Volume2 size={14} />
                  <span>오디오만 생성</span>
                </label>
              </div>
            </div>
          </div>

          {/* Player 표시 모드 설정 */}
          <div className="bg-gray-600 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Eye size={14} className="text-blue-400" />
              <span className="text-sm text-gray-200 font-medium">Player 표시 모드</span>
              <div title="편집 중 Player에서 LongSentence 클립을 어떻게 표시할지 선택합니다">
                <HelpCircle size={14} className="text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="displayMode-none"
                  name="displayMode"
                  value="none"
                  checked={clip.displayMode === 'none' || !clip.displayMode}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleStyleChange('displayMode', 'none');
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="displayMode-none" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
                  <EyeOff size={14} />
                  <span>숨김</span>
                  <span className="text-xs text-gray-400">(기본값)</span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="displayMode-both"
                  name="displayMode"
                  value="both"
                  checked={clip.displayMode === 'both'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleStyleChange('displayMode', 'both');
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="displayMode-both" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Type size={14} />
                    <span>+</span>
                    <Image size={14} />
                  </div>
                  <span>텍스트 + 미디어</span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="displayMode-sentence"
                  name="displayMode"
                  value="sentence"
                  checked={clip.displayMode === 'sentence'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleStyleChange('displayMode', 'sentence');
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="displayMode-sentence" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
                  <Type size={14} />
                  <span>텍스트만</span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="displayMode-media"
                  name="displayMode"
                  value="media"
                  checked={clip.displayMode === 'media'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleStyleChange('displayMode', 'media');
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="displayMode-media" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
                  <Image size={14} />
                  <span>미디어만</span>
                </label>
              </div>
            </div>

            {/* 현재 표시 모드 상태 */}
            <div className="mt-3 p-2 bg-gray-700 rounded text-xs text-gray-300">
              <div className="flex items-center space-x-2">
                <span>현재 설정:</span>
                <span className="font-medium text-white">
                  {clip.displayMode === 'none' || !clip.displayMode ? '숨김' :
                    clip.displayMode === 'both' ? '텍스트 + 미디어' :
                      clip.displayMode === 'sentence' ? '텍스트만' :
                        clip.displayMode === 'media' ? '미디어만' : '알 수 없음'}
                </span>
              </div>
              {clip.displayMode && clip.displayMode !== 'none' && (
                <div className="mt-1 text-gray-400">
                  💡 Player에서 이 클립을 재생할 때 선택한 내용이 표시됩니다
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* 음성 설정 섹션 */}
      <SettingsSection
        title="음성 설정"
        icon={<Mic size={16} />}
        isOpen={expandedSections.voice}
        onToggle={() => toggleSection('voice')}
        iconColor="text-green-400"
      >

        <div className="space-y-4">
          {/* TTS 설정 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="generateTTS"
              checked={clip.generateTTS}
              onChange={(e) => handleStyleChange('generateTTS', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="generateTTS" className="text-sm text-gray-300 cursor-pointer flex items-center space-x-2">
              <Volume2 size={14} />
              <span>음성 생성 (TTS)</span>
              <div title="Google Cloud Text-to-Speech를 사용하여 음성을 생성합니다">
                <HelpCircle size={14} className="text-gray-400" />
              </div>
            </label>
          </div>

          {clip.generateTTS && (
            <TTSVoiceSelector
              selectedLanguage={selectedLanguage}
              selectedVoice={selectedVoice}
              onLanguageChange={handleLanguageChange}
              onVoiceChange={handleVoiceSelect}
              className="mt-4"
            />
          )}
        </div>
      </SettingsSection>

      {/* 변환 상태 및 관리 */}
      {(clip.conversionStatus !== 'pending' || (clip.childClipIds && clip.childClipIds.length > 0)) && (
        <div className="bg-red-900/20 border-2 border-dashed border-red-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-red-400" />
              <span className="text-white font-medium">변환 상태:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${clip.conversionStatus === 'completed' ? 'bg-green-600 text-white' :
                clip.conversionStatus === 'processing' ? 'bg-blue-600 text-white' :
                  clip.conversionStatus === 'failed' ? 'bg-red-600 text-white' :
                    'bg-gray-600 text-white'
                }`}>
                {clip.conversionStatus === 'completed' ? '완료' :
                  clip.conversionStatus === 'processing' ? '처리중' :
                    clip.conversionStatus === 'failed' ? '실패' :
                      '대기'}
              </span>
              
            </div>
          </div>


          {/* 생성된 클립 정보 */}
          {clip.childClipIds && clip.childClipIds.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-green-200 mb-2">
                ✅ {clip.childClipIds.length}개의 클립이 생성되었습니다
              </div>
            </div>
          )}

          {/* 관리 버튼들 */}
          {clip.childClipIds && clip.childClipIds.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (window.confirm('생성된 클립들을 모두 삭제하시겠습니까?')) {
                    onDeleteChildClips?.();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                <RotateCcw size={14} />
                <span>생성된 클립 삭제</span>
              </button>

              <button
                onClick={onConvert}
                disabled={clip.conversionStatus === 'processing'}
                className="flex items-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:bg-gray-600 transition-colors"
              >
                {clip.conversionStatus === 'processing' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    <span>처리중</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>재생성</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 변환 버튼 */}
      <div className="space-y-2">
        <button
          onClick={onConvert}
          disabled={
            clip.conversionStatus === 'processing' ||
            !localData.some(item => item.text?.trim())
          }
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {clip.conversionStatus === 'processing' ? (
            <>
              {/* 로딩 스피너 */}
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>처리중...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>
                {clip.childClipIds && clip.childClipIds.length > 0
                  ? 'Sentence 클립 재생성'
                  : 'Sentence 클립 생성'
                }
              </span>
            </>
          )}
        </button>

        {/* 버튼 비활성화 상태 메시지 */}
        {!localData.some(item => item.text?.trim()) && clip.conversionStatus !== 'processing' && (
          <div className="flex items-center space-x-2 text-sm text-yellow-400 bg-yellow-900/20 rounded-lg p-3">
            <AlertCircle size={16} />
            <span>위의 "텍스트 + 미디어 데이터" 섹션에서 실제 텍스트 내용을 입력해주세요.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LongSentenceProperties;