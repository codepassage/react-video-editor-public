// 🎯 3단계 Union 타입 호환 - 클립 유틸리티 함수들
// 새로운 Union 타입과 기존 코드 호환성을 위한 유틸리티들

import { TimelineClip } from './core';
import {
  isVisualClip,
  isAudioClip,
  hasAudioProperties,
  isTextClip,
  getClipCategory,
  // 🆕 새로운 타입 안전 접근 시스템
  assertVisualClip,
  assertAudioCapable,
  assertTextClip
} from './clipGuards';
// 🆕 새로운 Union 타입들 import
import {
  AudioClip,
  VideoClip,
  TextClip,
  VisualClip,
  AudioCapableClip
} from './clipTypes';
import { getDefaultClipName } from './clipCreators';

/**
 * 🏷️ 클립 표시 이름 가져오기
 * name 속성 우선, 없으면 기존 로직 사용
 */
export const getClipDisplayName = (clip: TimelineClip): string => {
  // 🆕 name 속성이 있으면 우선 사용
  if (clip.name && clip.name.trim()) {
    return clip.name;
  }

  // 기존 로직으로 fallback
  if (isTextClip(clip)) {
    return clip.text || '텍스트';
  }

  // 🆕 새로운 기본명 생성 시스템 활용
  return getDefaultClipName(clip.mediaType);
};

/**
 * 🎯 안전한 위치 설정 (새로운 Union 타입 호환)
 * 시각적 클립만 위치 설정 가능
 */
export const setClipPosition = (
  clip: TimelineClip,
  x: number,
  y: number
): Partial<TimelineClip> => {
  try {
    // 🆕 새로운 타입 안전 접근 방식
    assertVisualClip(clip);
    return { x, y };
  } catch (error) {
    console.warn(`[클립 위치] ${clip.mediaType} 클립에는 위치를 설정할 수 없습니다:`, clip.id);
    return {};
  }
};

/**
 * 📏 안전한 크기 설정 (새로운 Union 타입 호환)
 * 시각적 클립만 크기 설정 가능
 */
export const setClipSize = (
  clip: TimelineClip,
  width: number,
  height: number
): Partial<TimelineClip> => {
  try {
    assertVisualClip(clip);
    return {
      width: Math.max(1, width),   // 최소 1px
      height: Math.max(1, height)  // 최소 1px
    };
  } catch (error) {
    console.warn(`[클립 크기] ${clip.mediaType} 클립에는 크기를 설정할 수 없습니다:`, clip.id);
    return {};
  }
};

/**
 * 🔊 안전한 볼륨 설정 (새로운 Union 타입 호환)
 * 오디오 속성이 있는 클립만 볼륨 설정 가능
 */
export const setClipVolume = (
  clip: TimelineClip,
  volume: number
): Partial<TimelineClip> => {
  try {
    assertAudioCapable(clip);
    return {
      volume: Math.max(0, Math.min(1, volume)) // 0-1 범위로 제한
    };
  } catch (error) {
    console.warn(`[클립 볼륨] ${clip.mediaType} 클립에는 볼륨을 설정할 수 없습니다:`, clip.id);
    return {};
  }
};

/**
 * 🎨 안전한 투명도 설정
 * 시각적 클립만 투명도 설정 가능
 */
export const setClipOpacity = (
  clip: TimelineClip,
  opacity: number
): Partial<TimelineClip> => {
  if (isVisualClip(clip)) {
    return {
      opacity: Math.max(0, Math.min(1, opacity)) // 0-1 범위로 제한
    };
  }

  console.warn(`[클립 투명도] ${clip.mediaType} 클립에는 투명도를 설정할 수 없습니다:`, clip.id);
  return {};
};

/**
 * 🔄 안전한 회전 설정
 * 시각적 클립만 회전 설정 가능
 */
export const setClipRotation = (
  clip: TimelineClip,
  rotation: number
): Partial<TimelineClip> => {
  if (isVisualClip(clip)) {
    return { rotation };
  }

  console.warn(`[클립 회전] ${clip.mediaType} 클립에는 회전을 설정할 수 없습니다:`, clip.id);
  return {};
};

/**
 * ✅ 클립 유효성 검사
 */
export const validateClip = (clip: TimelineClip): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 기본 필수 속성 검사
  if (!clip.id || clip.id.trim() === '') {
    errors.push('클립 ID가 없습니다');
  }

  if (!clip.name || clip.name.trim() === '') {
    errors.push('클립 name이 없습니다'); // 🆕 name 필수 검사
  }

  if (clip.duration <= 0) {
    errors.push('클립 길이가 0 이하입니다');
  }

  if (clip.startTime < 0) {
    errors.push('시작 시간이 음수입니다');
  }

  if (clip.endTime <= clip.startTime) {
    errors.push('끝 시간이 시작 시간보다 작거나 같습니다');
  }

  // 시각적 클립 전용 검사
  if (isVisualClip(clip)) {
    if (clip.width <= 0) {
      errors.push('너비가 0 이하입니다');
    }

    if (clip.height <= 0) {
      errors.push('높이가 0 이하입니다');
    }

    if (clip.opacity < 0 || clip.opacity > 1) {
      errors.push('투명도가 0-1 범위를 벗어났습니다');
    }
  }

  // 오디오 속성 검사
  if (hasAudioProperties(clip)) {
    if (clip.volume !== undefined && (clip.volume < 0 || clip.volume > 1)) {
      errors.push('볼륨이 0-1 범위를 벗어났습니다');
    }

    if (clip.playbackRate !== undefined && clip.playbackRate <= 0) {
      errors.push('재생 속도가 0 이하입니다');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};


/**
 * 🔧 안전한 클립 업데이트 필터링
 * 클립 타입에 맞지 않는 속성 업데이트를 필터링
 */
export const filterValidUpdates = (
  clip: TimelineClip,
  updates: Partial<TimelineClip>
): Partial<TimelineClip> => {
  const safeUpdates: Partial<TimelineClip> = {};

  // 모든 클립 공통 속성들
  const commonProps = [
    'name', 'startTime', 'endTime', 'duration', 'mediaId', 'trackId', 'mediaUrl',
    'baseClipProperties', 'regularClipProperties',
    'templateGroupId', 'bundleId', 'isGrouped', 'isBundled', 'parentClipId', 'childClipIds'
  ];

  commonProps.forEach(prop => {
    if (prop in updates) {
      (safeUpdates as any)[prop] = (updates as any)[prop];
    }
  });

  // 시각적 속성들 (시각적 클립만)
  if (isVisualClip(clip)) {
    const visualProps = [
      'x', 'y', 'width', 'height', 'opacity', 'rotation',
      'scaleX', 'scaleY', 'skewX', 'skewY', 'anchorX', 'anchorY',
      'blendMode', 'brightness', 'contrast', 'saturation', 'hue',
      'blur', 'sepia', 'grayscale', 'fadeIn', 'fadeOut',
      'animationType', 'animationDuration', 'animationDelay',
      'animationEasing', 'animationLoop'
    ];

    visualProps.forEach(prop => {
      if (prop in updates) {
        (safeUpdates as any)[prop] = (updates as any)[prop];
      }
    });

    // 텍스트 전용 속성들
    if (isTextClip(clip)) {
      const textProps = [
        'text', 'fontSize', 'fontFamily', 'fontWeight', 'color',
        'backgroundColor', 'textAlign', 'lineHeight', 'letterSpacing',
        'textDecoration', 'textTransform', 'wordWrap', 'textOverflow',
        'autoSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor',
        'strokeWidth', 'strokeColor', 'textGradient', 'multipleShadows',
        'textGlow', 'textBevel', 'textExtrude', 'textTexture',
        'multipleStrokes', 'textAnimation', 'textDistortion',
        // 🆕 누락된 텍스트 전용 속성들 추가
        'borderRadius', 'borderRadiusUnit', 'backgroundShadow', 'textShadow'
      ];

      textProps.forEach(prop => {
        if (prop in updates) {
          (safeUpdates as any)[prop] = (updates as any)[prop];
        }
      });
    }
    
    // Sentence 클립 전용 속성들 (textClip 속성 + sentence 전용)
    if (clip.mediaType === 'sentence') {
      const sentenceProps = [
        // 기본 텍스트 속성들
        'text', 'fontSize', 'fontFamily', 'fontWeight', 'color',
        'backgroundColor', 'textAlign', 'lineHeight', 'letterSpacing',
        'textDecoration', 'textTransform', 'wordWrap', 'textOverflow',
        'autoSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor',
        'strokeWidth', 'strokeColor',
        // 🆕 누락된 텍스트 전용 속성들 추가
        'borderRadius', 'borderRadiusUnit', 'backgroundShadow', 'textShadow',
        // Sentence 전용 속성들
        'textSegments', 'segmentOverlapMode', 'defaultSegmentStyle',
        'enableRealTimePreview', 'lastEditedSegmentId', 'totalSegments', 'segmentVersion'
      ];

      sentenceProps.forEach(prop => {
        if (prop in updates) {
          (safeUpdates as any)[prop] = (updates as any)[prop];
        }
      });
    }
    
    // 📖 LongSentence 클립 전용 속성들 (textClip 속성 + longsentence 전용)
    if (clip.mediaType === 'longsentence') {
      const longSentenceProps = [
        // 기본 텍스트 속성들
        'text', 'fontSize', 'fontFamily', 'fontWeight', 'color',
        'backgroundColor', 'textAlign', 'lineHeight', 'letterSpacing',
        'textDecoration', 'textTransform', 'wordWrap', 'textOverflow',
        'autoSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor',
        'strokeWidth', 'strokeColor',
        // 🆕 누락된 텍스트 전용 속성들 추가
        'borderRadius', 'borderRadiusUnit', 'backgroundShadow', 'textShadow',
        // LongSentence 전용 속성들
        'maxWordsPerSentence', 'splitOnPunctuation', 'generateTTS', 'generateText', 'generateSubtitles',
        'language', 'voice', 'autoConvertOnEdit', 'preserveOriginal',
        'conversionStatus', 'conversionProgress', 'generatedClips', 'errorMessage', 'childClipIds',
        // 새로운 데이터 구조와 미디어 설정
        'data', 'mediaSettings', 'mediaProperties', 'textProperties',
        // 시간 간격 설정
        'timeSpace', 'showMediaDuringTimeSpace',
        // Player 표시 모드 설정
        'displayMode'
      ];

      longSentenceProps.forEach(prop => {
        if (prop in updates) {
          (safeUpdates as any)[prop] = (updates as any)[prop];
        }
      });
    }
  }

  // 오디오 속성들 (해당 클립만)
  if (hasAudioProperties(clip)) {
    const audioProps = [
      'volume', 
      'playbackRate',
      // TTS (Text-to-Speech) 관련 속성들
      'generateTTS',
      'language',
      'voice'
    ];
    audioProps.forEach(prop => {
      if (prop in updates) {
        (safeUpdates as any)[prop] = (updates as any)[prop];
      }
    });
  }

  // 🔶 도형 클립 전용 속성들 (shape, simpleShape, polygonShape)
  if (['shape', 'simpleShape', 'polygonShape'].includes(clip.mediaType)) {
    const shapeProps = [
      // 기본 도형 속성
      'shapeType', 'backgroundColor',
      
      // polygonShape 전용 속성들
      'polygonShapeProperties',
      
      // simpleShape 전용 속성들
      'simpleShapeProperties',
      
      // 기타 도형 관련 속성들
      'borderRadius', 'borderRadiusUnit', 'borderWidth', 'borderColor',
      'shadowEnabled', 'shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor',
      'edgeFade', 'fadeType', 'edgeFadeStops',
      'backgroundType', 'gradient', 'backgroundImageUrl', 'backgroundFit', 'backgroundPosition'
    ];

    shapeProps.forEach(prop => {
      if (prop in updates) {
        (safeUpdates as any)[prop] = (updates as any)[prop];
      }
    });
  }

  return safeUpdates;
};

/**
 * 📊 클립 정보 요약
 */
export const getClipSummary = (clip: TimelineClip) => {
  const category = getClipCategory(clip);
  const displayName = getClipDisplayName(clip);

  return {
    id: clip.id,
    name: displayName,
    mediaType: clip.mediaType,
    category,
    duration: clip.duration,
    isVisual: isVisualClip(clip),
    hasAudio: hasAudioProperties(clip),
    timeRange: {
      start: clip.startTime,
      end: clip.endTime
    },
    // 🆕 새로운 Union 타입 정보
    unionTypeInfo: {
      isUnionType: true,
      version: '3.0'
    }
  };
};

// 🆕 새로운 Union 타입 전용 헬퍼 함수들

/**
 * 🎨 시각적 클립 전용 속성 업데이트
 * @description 시각적 클립에만 사용 가능한 속성들을 안전하게 업데이트
 */
export function updateVisualClipSafely<T extends VisualClip>(
  clip: T,
  updates: Partial<VisualClip>
): Partial<T> {
  try {
    assertVisualClip(clip);

    const validUpdates: Partial<T> = {};
    const visualProps = ['x', 'y', 'width', 'height', 'opacity', 'rotation',
      'scaleX', 'scaleY', 'skewX', 'skewY', 'anchorX', 'anchorY',
      'blendMode', 'brightness', 'contrast', 'saturation', 'hue',
      'blur', 'sepia', 'grayscale', 'fadeIn', 'fadeOut',
      'animationType', 'animationDuration', 'animationDelay',
      'animationEasing', 'animationLoop'] as const;

    visualProps.forEach(prop => {
      if (prop in updates) {
        (validUpdates as any)[prop] = (updates as any)[prop];
      }
    });

    return validUpdates;
  } catch (error) {
    console.error('🚨 시각적 클립 업데이트 실패:', error);
    return {};
  }
}

/**
 * 🎵 오디오 클립 전용 속성 업데이트
 * @description 오디오 속성을 가진 클립에만 사용 가능한 속성들을 안전하게 업데이트
 */
export function updateAudioClipSafely<T extends AudioCapableClip>(
  clip: T,
  updates: Partial<AudioCapableClip>
): Partial<T> {
  try {
    assertAudioCapable(clip);

    const validUpdates: Partial<T> = {};
    const audioProps = ['volume', 'playbackRate'] as const;

    audioProps.forEach(prop => {
      if (prop in updates) {
        (validUpdates as any)[prop] = (updates as any)[prop];
      }
    });

    return validUpdates;
  } catch (error) {
    console.error('🚨 오디오 클립 업데이트 실패:', error);
    return {};
  }
}

/**
 * 📝 텍스트 클립 전용 속성 업데이트
 * @description 텍스트 클립에만 사용 가능한 속성들을 안전하게 업데이트
 */
export function updateTextClipSafely(
  clip: TextClip,
  updates: Partial<TextClip>
): Partial<TextClip> {
  try {
    assertTextClip(clip);

    const validUpdates: Partial<TextClip> = {};
    const textProps = ['text', 'fontSize', 'fontFamily', 'fontWeight', 'color',
      'backgroundColor', 'textAlign', 'lineHeight', 'letterSpacing',
      'textDecoration', 'textTransform', 'wordWrap', 'textOverflow',
      'autoSize', 'paddingTop', 'paddingRight', 'paddingBottom',
      'paddingLeft', 'shadowOffsetX', 'shadowOffsetY', 'shadowBlur',
      'shadowColor', 'strokeWidth', 'strokeColor',
      // 🆕 누락된 텍스트 전용 속성들 추가
      'borderRadius', 'borderRadiusUnit', 'backgroundShadow', 'textShadow'
    ] as const;

    textProps.forEach(prop => {
      if (prop in updates) {
        (validUpdates as any)[prop] = (updates as any)[prop];
      }
    });

    return validUpdates;
  } catch (error) {
    console.error('🚨 텍스트 클립 업데이트 실패:', error);
    return {};
  }
}

/**
 * 🔍 타입 안전 속성 접근 래퍼
 * @description 새로운 Union 타입 시스템의 SafeAccess 래퍼
 */
export const TypeSafeAccess = {
  /**
   * 🎨 시각적 속성 안전 접근
   */
  visual: (clip: TimelineClip) => {
    if (!isVisualClip(clip)) return null;
    return {
      x: clip.x,
      y: clip.y,
      width: clip.width,
      height: clip.height,
      opacity: clip.opacity,
      rotation: clip.rotation
    };
  },

  /**
   * 🎵 오디오 속성 안전 접근
   */
  audio: (clip: TimelineClip) => {
    if (!hasAudioProperties(clip)) return null;
    return {
      volume: clip.volume,
      playbackRate: clip.playbackRate
    };
  },

  /**
   * 📝 텍스트 속성 안전 접근
   */
  text: (clip: TimelineClip) => {
    if (!isTextClip(clip)) return null;
    return {
      text: clip.text,
      fontSize: clip.fontSize,
      fontFamily: clip.fontFamily,
      color: clip.color,
      backgroundColor: clip.backgroundColor
    };
  },

  /**
   * 🔍 모든 속성 안전 접근
   */
  all: (clip: TimelineClip) => ({
    visual: TypeSafeAccess.visual(clip),
    audio: TypeSafeAccess.audio(clip),
    text: TypeSafeAccess.text(clip)
  })
};

/**
 * 🎯 타입 안전 클립 변환 헬퍼
 * @description 타입을 예측 가능하게 변환하는 헬퍼
 */
export const ClipTypeConverter = {
  /**
   * 🎬 비디오 → 이미지 변환 (오디오 속성 제거)
   */
  videoToImage: (videoClip: VideoClip): Omit<VideoClip, 'volume' | 'playbackRate'> & { mediaType: 'image' } => {
    const { volume, playbackRate, ...imageProps } = videoClip;
    return {
      ...imageProps,
      mediaType: 'image' as const
    };
  },

  /**
   * 🖼️ 이미지 → 비디오 변환 (오디오 속성 추가)
   */
  imageToVideo: (imageClip: ImageClip, audioProps?: { volume?: number; playbackRate?: number }): VideoClip => {
    return {
      ...imageClip,
      mediaType: 'video' as const,
      volume: audioProps?.volume ?? 1.0,
      playbackRate: audioProps?.playbackRate ?? 1.0
    };
  }
};

/**
 * 📊 클립 통계 분석 헬퍼 (새로운 Union 타입 활용)
 */
export const ClipAnalytics = {
  /**
   * 📊 클립 집합 통계 분석
   */
  analyzeClips: (clips: TimelineClip[]) => ({
    total: clips.length,
    visual: clips.filter(isVisualClip).length,
    audio: clips.filter(isAudioClip).length,
    withAudio: clips.filter(hasAudioProperties).length,
    categories: {
      visual: clips.filter(clip => getClipCategory(clip) === 'visual').length,
      audio: clips.filter(clip => getClipCategory(clip) === 'audio').length,
      mixed: clips.filter(clip => getClipCategory(clip) === 'mixed').length
    },
    // 🆕 새로운 Union 타입 전용 분석
    unionTypeInfo: {
      audioClips: clips.filter(isAudioClip).length,
      videoClips: clips.filter(clip => clip.mediaType === 'video').length,
      imageClips: clips.filter(clip => clip.mediaType === 'image').length,
      textClips: clips.filter(isTextClip).length,
      shapeClips: clips.filter(clip => ['shape', 'simpleShape', 'polygonShape'].includes(clip.mediaType)).length
    }
  }),

  /**
   * 🕰️ 시간 기반 분석
   */
  analyzeTimeline: (clips: TimelineClip[]) => {
    const totalDuration = Math.max(...clips.map(clip => clip.endTime), 0);
    const audioDuration = clips.filter(hasAudioProperties)
      .reduce((sum, clip) => sum + clip.duration, 0);

    return {
      totalDuration,
      audioDuration,
      audioRatio: totalDuration > 0 ? audioDuration / totalDuration : 0,
      avgClipDuration: clips.length > 0 ? clips.reduce((sum, clip) => sum + clip.duration, 0) / clips.length : 0
    };
  }
};

// 🔄 기존 호환성을 위한 별칭들
export {
  TypeSafeAccess as SafeClipAccess,
  ClipAnalytics as ClipStats,
  updateVisualClipSafely as updateVisual,
  updateAudioClipSafely as updateAudio,
  updateTextClipSafely as updateText
};
