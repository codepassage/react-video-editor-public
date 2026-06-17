/**
 * 🎯 clipCore.ts - 3단계 Union 타입 기본 클립 코어 정의
 * 
 * 비디오 에디터의 8가지 클립 타입 시스템의 기초가 되는
 * 코어 속성들을 정의하는 파일입니다. 모든 클립이 반드시 가져야 하는
 * 필수 속성들을 정의하여 타입 안전성과 데이터 일관성을 보장합니다.
 * 
 * 주요 기능:
 * - 8가지 미디어 타입 정의 및 관리
 * - 모든 클립의 공통 코어 속성 정의
 * - 기준 클립 및 일반 클립 속성 구분
 * - 상속 계층 구조를 통한 타입 안전성
 * - 브랜드 확장 가능한 설계
 * 
 * 3단계 Union 타입 설계:
 * 1. BaseClipCore: 공통 기본 속성 (시간, ID, 이름 등)
 * 2. BaseClipProperties & RegularClipProperties: 역할별 속성
 * 3. 구체적 클립 타입: AudioClip, VideoClip 등
 * 
 * 지원되는 미디어 타입:
 * - video: 비디오 파일 (.mp4, .avi, .mov 등)
 * - audio: 오디오 파일 (.mp3, .wav, .ogg 등)
 * - image: 이미지 파일 (.jpg, .png, .gif 등)
 * - text: 기본 텍스트 클립
 * - sentence: 문장 단위 텍스트 클립
 * - longsentence: 긴 문장 클립 (TTS 연동)
 * - shape: 기본 도형 클립
 * - simpleShape: 단순 도형 클립
 * - polygonShape: 다각형 도형 클립
 * - spacer: 공간 조절용 클립
 * 
 * 필수 코어 속성:
 * - id: 고유 식별자
 * - mediaId: 미디어 연결 ID
 * - trackId: 소속 트랙 ID
 * - name: 사용자 식별용 이름
 * - startTime, endTime, duration: 시간 정보
 * - x, y, width, height: 위치 및 크기
 * - mediaType: 미디어 타입 분류
 * 
 * 타입 안전성:
 * - TypeScript 전체에서 엄격한 타입 체크
 * - Union 타입으로 모든 가능한 클립 타입 커버
 * - 상속 구조로 코드 중복 방지
 * 
 * 관련 모듈:
 * - 2번 모듈: Clip Type System (전체 8가지 클립 타입)
 * - clipTypes.ts: 구체적 클립 타입 정의
 * - baseClips.ts: 기준 클립 시스템 연동
 * - clipCreators.ts: 클립 생성 팩토리 함수
 */

import { BaseClipProperties, RegularClipProperties } from './baseClips';

// MediaType 정의 (core.ts에서 가져옴)
export type MediaType = 'video' | 'audio' | 'image' | 'text' | 'sentence' | 'longsentence' | 'shape' | 'simpleShape' | 'polygonShape' | 'spacer';

/**
 * 🔧 모든 클립의 공통 핵심 속성
 * - 시간, ID, 미디어 정보 등 모든 클립이 반드시 가져야 하는 속성들
 */
export interface BaseClipCore {
  // 📝 기본 식별 정보
  id: string;
  mediaId: string;
  trackId: string;
  name: string;  // 🆕 필수로 변경 (사용자 식별용)

  // ⏰ 시간 관련 (모든 클립 필수)
  startTime: number;  // 타임라인에서의 시작 시간 (초)
  endTime: number;    // 타임라인에서의 끝 시간 (초) 
  duration: number;   // 클립의 지속 시간 (초)
  durationInFrames?: number; // Player/Remotion용 프레임 단위 지속시간

  // 🎭 미디어 정보
  mediaType: MediaType;
  mediaUrl?: string;

  // 🔗 시스템 확장 속성 (기존 호환성 유지)
  baseClipProperties?: BaseClipProperties;
  regularClipProperties?: RegularClipProperties;

  // 📦 그룹/Bundle 시스템 (기존 호환성 유지)
  templateGroupId?: string;
  bundleId?: string;
  isGrouped?: boolean;
  isBundled?: boolean;
  
  // 👨‍👩‍👧‍👦 부모-자식 관계 (LongSentence 시스템)
  parentClipId?: string; // 부모 클립 ID (자식 클립인 경우)
}

/**
 * 🎨 시각적 클립 전용 속성
 * - 화면에 표시되는 모든 클립(video, image, text, shape)이 가져야 하는 속성들
 */
export interface VisualClipProperties {
  // 📍 위치 및 크기 (영상 내에서의 위치)
  x: number;
  y: number;
  width: number;
  height: number;

  // 📐 위치 여백 설정
  positionMargin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // 🎭 기본 변형 속성
  opacity: number;
  rotation: number;

  // 🔧 고급 변형 속성
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  anchorX?: number; // 0-1, 변형 기준점 X
  anchorY?: number; // 0-1, 변형 기준점 Y

  // 🌈 블렌드 모드
  blendMode?: string;

  // 🎨 시각 필터 효과
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;

  // ✨ 애니메이션 효과
  fadeIn?: number;
  fadeOut?: number;

  // 🎬 고급 애니메이션
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;
}

/**
 * 🎵 오디오 클립 전용 속성
 * - 소리를 가진 클립(audio, video)이 가져야 하는 속성들
 */
export interface AudioProperties {
  // 🔊 기본 오디오 속성
  volume?: number;
  playbackRate?: number;

  // 🎤 TTS (Text-to-Speech) 속성
  generateTTS?: boolean;    // TTS 생성 여부
  ttsText?: string;         // TTS로 변환할 텍스트
  language?: string;        // TTS 언어 코드 (ko, en, ja, zh 등)
  voice?: string;           // TTS 음성 이름

  // 🎛️ 고급 오디오 속성 (향후 확장용)
  // audioFilters?: AudioFilter[];
  // audioEffects?: AudioEffect[];
  // audioFadeIn?: number;
  // audioFadeOut?: number;
}

/**
 * 📝 텍스트 클립 전용 속성
 * - 텍스트 클립만 가져야 하는 모든 속성들
 */
export interface TextProperties {
  // 📝 기본 텍스트 속성
  text: string;  // 필수
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;

  // 🎨 고급 텍스트 속성
  textDecoration?: string;
  textTransform?: string;
  wordWrap?: boolean;
  textOverflow?: string;
  autoSize?: boolean;

  // 📐 패딩
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  // 🌫️ 텍스트 그림자
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;

  // 🖼️ 텍스트 테두리 (기본)
  strokeWidth?: number;
  strokeColor?: string;

  // 🔲 둥근 테두리 (배경용)
  borderRadius?: number;
  borderRadiusUnit?: 'px' | '%';

  // 📦 배경 그림자
  backgroundShadow?: string;  // CSS box-shadow 형식

  // 🎨 텍스트 그림자 (CSS 형식)
  textShadow?: string;        // CSS text-shadow 형식

  // 🎨 시각 필터 효과 (VisualClipProperties에서 가져옴)
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;

  // ✨ 애니메이션 효과 (VisualClipProperties에서 가져옴)
  fadeIn?: number;
  fadeOut?: number;

  // 🎬 고급 애니메이션 (VisualClipProperties에서 가져옴)
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;

  // === 🎨 전문적인 텍스트 효과 시스템 === //
  textGradient?: import('./textEffects').TextGradient;
  multipleShadows?: import('./textEffects').TextShadowEffect[];
  textGlow?: import('./textEffects').TextGlowEffect;
  textBevel?: import('./textEffects').TextBevelEffect;
  textExtrude?: import('./textEffects').TextExtrudeEffect;
  textTexture?: import('./textEffects').TextTextureEffect;
  multipleStrokes?: import('./textEffects').TextStrokeEffect[];
  textAnimation?: import('./textEffects').TextAnimationEffect;
  textDistortion?: import('./textEffects').TextDistortionEffect;
}

/**
 * 📄 Sentence 클립 전용 속성
 * - TextProperties를 확장하면서 부분별 스타일링 기능 추가
 */
export interface SentenceProperties extends TextProperties {
  // 🎯 핵심 기능: 텍스트 세그먼트 배열
  textSegments?: Array<{
    id: string;                    // 세그먼트 고유 ID
    text: string;                  // 세그먼트 텍스트 내용
    startIndex: number;            // 원본 텍스트에서의 시작 인덱스
    endIndex: number;              // 원본 텍스트에서의 끝 인덱스
    priority?: number;             // 중복 세그먼트 시 우선순위 (높을수록 우선)
    layer?: number;                // 스타일 레이어 (중첩 효과용)

    // 🎨 세그먼트별 개별 스타일
    style: {
      // 기본 텍스트 스타일
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      fontStyle?: string;
      color?: string;
      backgroundColor?: string;

      // 텍스트 장식
      textDecoration?: string;      // 'none' | 'underline' | 'line-through' | 'overline'
      textTransform?: string;       // 'none' | 'uppercase' | 'lowercase' | 'capitalize'

      // 간격 및 크기
      letterSpacing?: number;
      lineHeight?: number;

      // 그림자 효과
      textShadow?: string;          // CSS textShadow 형식

      // 테두리 효과
      textStroke?: string;          // CSS -webkit-text-stroke 형식

      // 둥근 테두리 (배경용)
      borderRadius?: string;        // CSS border-radius 형식 ("3px", "10%" 등)

      // 배경 그림자
      boxShadow?: string;           // CSS box-shadow 형식

      // 🆕 세그먼트별 패딩 (배경색 있을 때 안쪽 여백)
      paddingTop?: number;          // 상단 패딩 (px)
      paddingRight?: number;        // 우측 패딩 (px)
      paddingBottom?: number;       // 하단 패딩 (px)
      paddingLeft?: number;         // 좌측 패딩 (px)

      // 고급 효과 (향후 확장용)
      opacity?: number;             // 0-1
      transform?: string;           // CSS transform
      filter?: string;              // CSS filter

      // 애니메이션 (향후 확장용)
      animationClass?: string;      // CSS 애니메이션 클래스명
      animationDuration?: number;   // 애니메이션 지속시간 (ms)
      animationDelay?: number;      // 애니메이션 지연시간 (ms)
    };
  }>;

  // 🔧 세그먼트 관리 옵션
  segmentOverlapMode?: 'priority' | 'merge' | 'split';  // 세그먼트 중복 시 처리 방식
  defaultSegmentStyle?: SentenceProperties['textSegments'][0]['style'];  // 기본 세그먼트 스타일
  enableRealTimePreview?: boolean;  // 실시간 미리보기 활성화

  // 📊 메타데이터
  lastEditedSegmentId?: string;     // 마지막 편집된 세그먼트 ID
  totalSegments?: number;           // 총 세그먼트 수
  segmentVersion?: number;          // 세그먼트 버전 (변경 추적용)
}

/**
 * 🔶 도형 클립 전용 속성들
 */
export interface ShapeClipProperties {
  shapeProperties?: import('./shape').ShapeProperties;
}

export interface SimpleShapeClipProperties {
  simpleShapeProperties?: {
    backgroundType: 'image' | 'color';
    backgroundColor?: string;
    backgroundImageUrl?: string;
    backgroundFit?: 'cover' | 'contain' | 'fill';
    backgroundPosition?: string;
    borderRadius?: number;
    borderRadiusUnit?: 'px' | '%';
    edgeFade?: number;
    fadeType?: 'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right';
    edgeFadeStops?: Array<{ position: number; opacity: number }>;
  };
}

export interface PolygonShapeClipProperties {
  polygonShapeProperties?: {
    shapeType: 'star' | 'heart' | 'triangle' | 'diamond' | 'circle' | 'rectangle';
    backgroundType: 'color' | 'gradient' | 'image';
    backgroundColor?: string;
    gradient?: {
      type: 'linear' | 'radial' | 'conic';
      angle?: number;
      centerX?: number;
      centerY?: number;
      stops: Array<{ color: string; position: number }>;
    };
    backgroundImageUrl?: string;
    backgroundFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    backgroundPosition?: string;
    borderRadius?: number;
    borderRadiusUnit?: 'px' | '%';
    borderWidth?: number;
    borderColor?: string;
    shadowEnabled?: boolean;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowBlur?: number;
    shadowColor?: string;
    shadowSpread?: number;
    shadowOpacity?: number;
    
    // inner shadow
    innerShadowEnabled?: boolean;
    innerShadowOffsetX?: number;
    innerShadowOffsetY?: number;
    innerShadowBlur?: number;
    innerShadowColor?: string;
    innerShadowOpacity?: number;
    
    // glow effects
    glowEnabled?: boolean;
    glowColor?: string;
    glowSize?: number;
    glowIntensity?: number;
    
    edgeFade?: number;
    fadeType?: 'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right';
    edgeFadeStops?: Array<{ position: number; opacity: number }>;
  };
}

/**
 * ⏸️ Spacer 클립 전용 속성
 * - 화면에 표시되지 않고 오디오도 없이 타임라인에서 시간만 차지하는 클립
 */
export interface SpacerClipProperties {
  // 📝 설명 및 메타데이터
  description?: string;           // 스페이서 클립의 용도 설명
  label?: string;                // 타임라인에서 표시될 라벨

  // 🎨 타임라인 표시용 속성 (실제 렌더링에는 영향 없음)
  displayColor?: string;          // 타임라인에서 표시될 색상 (#hex)
  displayPattern?: 'solid' | 'striped' | 'dotted' | 'dashed';  // 타임라인 패턴

  // 🔧 기능 속성
  isPause?: boolean;              // 일시정지 용도 여부
  isTransition?: boolean;         // 전환 시간 용도 여부
  isBuffer?: boolean;             // 버퍼 시간 용도 여부

  // 📊 메타데이터
  purpose?: 'timing' | 'pause' | 'transition' | 'buffer' | 'placeholder' | 'custom';
  notes?: string;                 // 추가 메모
}
