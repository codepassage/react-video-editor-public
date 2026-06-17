/**
 * 📝 clipCreators/textClips.ts - 텍스트 클립 생성자들
 * 
 * 다양한 텍스트 관련 클립 생성 함수들을 정의합니다.
 * - createTextClip: 기본 텍스트 클립
 * - createSentenceClip: 세그먼트 지원 텍스트 클립
 * - createLongSentenceClip: TTS 연동 긴 문장 클립
 */

import { TextClip, SentenceClip, LongSentenceClip } from '../clipTypes';
import {
  generateClipId,
  getDefaultClipName,
  applyCommonExtendedProperties,
  getDefaultEffectProperties,
  getDefaultVisualProperties,
  calculateEndTime
} from './utils';

/**
 * 📝 Text 클립 생성
 * - 시각적 + 텍스트 속성 포함
 * - 오디오 속성 없음
 */
export function createTextClip(params: {
  mediaId: string;
  trackId: string;
  text: string;
  startTime: number;
  duration: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  // 이펙트 속성들
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;
  fadeIn?: number;
  fadeOut?: number;
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;
  id?: string;
}): TextClip {
  const endTime = calculateEndTime(params.startTime, params.duration);
  const visualProperties = getDefaultVisualProperties({
    x: params.x ?? 100,
    y: params.y ?? 100,
    width: params.width ?? 400,
    height: params.height ?? 100
  });
  const effectProperties = getDefaultEffectProperties();

  return {
    // 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('text', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'text',

    // 시각적 속성
    ...visualProperties,
    opacity: params.opacity ?? visualProperties.opacity,
    rotation: params.rotation ?? visualProperties.rotation,

    // 텍스트 속성
    text: params.text,
    fontSize: params.fontSize ?? 24,
    fontFamily: params.fontFamily ?? 'Arial',
    color: params.color ?? '#ffffff',
    backgroundColor: params.backgroundColor ?? 'transparent',

    // 이펙트 속성들
    brightness: params.brightness ?? effectProperties.brightness,
    contrast: params.contrast ?? effectProperties.contrast,
    saturation: params.saturation ?? effectProperties.saturation,
    hue: params.hue ?? effectProperties.hue,
    blur: params.blur ?? effectProperties.blur,
    sepia: params.sepia ?? effectProperties.sepia,
    grayscale: params.grayscale ?? effectProperties.grayscale,
    fadeIn: params.fadeIn ?? effectProperties.fadeIn,
    fadeOut: params.fadeOut ?? effectProperties.fadeOut,
    animationType: params.animationType,
    animationDuration: params.animationDuration ?? effectProperties.animationDuration,
    animationDelay: params.animationDelay ?? effectProperties.animationDelay,
    animationEasing: params.animationEasing ?? effectProperties.animationEasing,
    animationLoop: params.animationLoop ?? effectProperties.animationLoop,
  };
}

/**
 * 📄 Sentence 클립 생성
 * - 시각적 + 고급 텍스트 속성 포함
 * - 부분별 스타일링 지원
 * - 오디오 속성 없음
 */
export function createSentenceClip(params: {
  mediaId: string;
  trackId: string;
  text: string;
  startTime: number;
  duration: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  // Sentence 전용 속성
  textSegments?: SentenceClip['textSegments'];
  segmentOverlapMode?: 'priority' | 'merge' | 'split';
  enableRealTimePreview?: boolean;
  // 이펙트 속성들
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;
  fadeIn?: number;
  fadeOut?: number;
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;
  // 누락된 텍스트 속성들
  borderRadius?: number;
  borderRadiusUnit?: string;
  textShadow?: string;
  textShadowColor?: string;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
  textShadowBlur?: number;
  backgroundShadow?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  textAlign?: string;
  lineHeight?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textStroke?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  id?: string;
  baseClipProperties?: any;
  parentClipId?: string;
}): SentenceClip {
  const endTime = calculateEndTime(params.startTime, params.duration);
  const visualProperties = getDefaultVisualProperties({
    x: params.x ?? 100,
    y: params.y ?? 100,
    width: params.width ?? 500,
    height: params.height ?? 120
  });
  const effectProperties = getDefaultEffectProperties();

  // 기본 세그먼트 스타일 생성
  const generateSegmentId = () => `segment-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const clip: any = {
    // 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('sentence', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'sentence',

    // 시각적 속성
    ...visualProperties,
    opacity: params.opacity ?? visualProperties.opacity,
    rotation: params.rotation ?? visualProperties.rotation,

    // 기본 텍스트 속성
    text: params.text,
    fontSize: params.fontSize ?? 28,
    fontFamily: params.fontFamily ?? 'Arial',
    color: params.color ?? '#ffffff',
    backgroundColor: params.backgroundColor ?? 'transparent',

    // Sentence 전용 속성
    textSegments: params.textSegments || [],
    segmentOverlapMode: params.segmentOverlapMode ?? 'priority',
    enableRealTimePreview: params.enableRealTimePreview ?? true,

    // 메타데이터 초기화
    totalSegments: 0,
    segmentVersion: 1,

    // 기본 세그먼트 스타일 설정
    defaultSegmentStyle: {
      fontFamily: params.fontFamily ?? 'Arial',
      fontSize: params.fontSize ?? 28,
      color: params.color ?? '#ffffff',
      backgroundColor: params.backgroundColor ?? 'transparent',
      fontWeight: params.fontWeight ?? '400',
      fontStyle: params.fontStyle ?? 'normal',
      textDecoration: params.textDecoration ?? 'none',
    },

    // 고급 텍스트 속성들
    borderRadius: params.borderRadius ?? 0,
    borderRadiusUnit: params.borderRadiusUnit ?? 'px',
    textShadow: params.textShadow,
    textShadowColor: params.textShadowColor,
    textShadowOffsetX: params.textShadowOffsetX,
    textShadowOffsetY: params.textShadowOffsetY,
    textShadowBlur: params.textShadowBlur,
    backgroundShadow: params.backgroundShadow,
    paddingTop: params.paddingTop ?? 0,
    paddingRight: params.paddingRight ?? 0,
    paddingBottom: params.paddingBottom ?? 0,
    paddingLeft: params.paddingLeft ?? 0,
    textAlign: params.textAlign ?? 'center',
    lineHeight: params.lineHeight ?? 1.2,
    letterSpacing: params.letterSpacing ?? 0,
    wordSpacing: params.wordSpacing ?? 0,
    fontWeight: params.fontWeight ?? '400',
    fontStyle: params.fontStyle ?? 'normal',
    textDecoration: params.textDecoration ?? 'none',
    textStroke: params.textStroke,
    textStrokeColor: params.textStrokeColor,
    textStrokeWidth: params.textStrokeWidth,

    // 이펙트 속성들
    brightness: params.brightness ?? effectProperties.brightness,
    contrast: params.contrast ?? effectProperties.contrast,
    saturation: params.saturation ?? effectProperties.saturation,
    hue: params.hue ?? effectProperties.hue,
    blur: params.blur ?? effectProperties.blur,
    sepia: params.sepia ?? effectProperties.sepia,
    grayscale: params.grayscale ?? effectProperties.grayscale,
    fadeIn: params.fadeIn ?? effectProperties.fadeIn,
    fadeOut: params.fadeOut ?? effectProperties.fadeOut,
    animationType: params.animationType,
    animationDuration: params.animationDuration ?? effectProperties.animationDuration,
    animationDelay: params.animationDelay ?? effectProperties.animationDelay,
    animationEasing: params.animationEasing ?? effectProperties.animationEasing,
    animationLoop: params.animationLoop ?? effectProperties.animationLoop,
  };

  // 공통 확장 속성 적용
  applyCommonExtendedProperties(clip, params);

  return clip;
}

/**
 * 📖 LongSentence 클립 생성 
 * - 긴 텍스트 자동 분할 기능
 */
export function createLongSentenceClip(params: {
  mediaId: string;
  trackId: string;
  startTime: number;
  duration: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  data?: Array<{
    text: string;
    mediaUrl: string;
  }>;
  maxWordsPerSentence?: number;
  splitOnPunctuation?: boolean;
  generateTTS?: boolean;
  generateText?: boolean;
  generateSubtitles?: boolean;
  language?: 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'fr' | 'de';
  voice?: string;
  autoConvertOnEdit?: boolean;
  preserveOriginal?: boolean;
  mediaProperties?: LongSentenceClip['mediaProperties'];
  displayMode?: 'none' | 'sentence' | 'media' | 'both';
  id?: string;
}): LongSentenceClip {
  const endTime = calculateEndTime(params.startTime, params.duration);
  const visualProperties = getDefaultVisualProperties({
    x: params.x ?? 100,
    y: params.y ?? 100,
    width: params.width ?? 800,
    height: params.height ?? 100
  });

  return {
    // 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('longsentence', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'longsentence',

    // 시각적 속성
    ...visualProperties,
    opacity: params.opacity ?? visualProperties.opacity,
    rotation: params.rotation ?? visualProperties.rotation,

    // 새로운 데이터 구조: 텍스트 + 미디어 배열
    data: params.data || [
      {
        text: '텍스트를 입력하세요...',
        mediaUrl: ''
      }
    ],

    // 분할 설정
    maxWordsPerSentence: params.maxWordsPerSentence ?? 15,
    splitOnPunctuation: params.splitOnPunctuation ?? true,
    generateTTS: params.generateTTS ?? true,
    generateText: params.generateText ?? true,
    generateSubtitles: params.generateSubtitles ?? true,
    language: params.language ?? 'ko',
    voice: params.voice ?? 'ko-KR-Standard-A',

    // 변환 상태
    conversionStatus: 'pending',
    conversionProgress: 0,
    generatedClips: [],

    // 변환 설정
    autoConvertOnEdit: params.autoConvertOnEdit ?? false,
    preserveOriginal: params.preserveOriginal ?? false,
    
    // Player 표시 모드 설정
    displayMode: params.displayMode ?? 'none',
    
    // 부모-자식 관계
    childClipIds: [],

    // 미디어 속성 (이미지/비디오 편집용)
    mediaProperties: params.mediaProperties || {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      opacity: 1.0,
      rotation: 0,
      volume: 1.0,
      playbackRate: 1.0,
      // Border properties for ImagePropertiesEditor
      borderColor: '#ffffff',
      strokeColor: '#ffffff', // LongSentence 시스템에서 실제 사용되는 속성명
      borderWidth: 0,
      borderRadius: 0,
      borderRadiusUnit: 'px',
      // Edge fade properties
      edgeFade: 0,
      fadeType: 'radial',
      // Background fit properties
      backgroundFit: 'fill',
      backgroundPosition: 'center',
    },
  };
}