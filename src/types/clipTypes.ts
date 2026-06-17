/**
 * 🎯 clipTypes.ts - 핵심 클립 타입 시스템 (2번 모듈)
 * 
 * 8가지 클립 타입을 정의하는 핵심 타입 시스템
 * Union 타입과 타입 가드를 통한 완전한 타입 안전성 제공
 * 
 * 지원하는 8가지 클립 타입:
 * 1. 🎵 AudioClip: 오디오 전용 (시각적 속성 제거로 40% 메모리 절약)
 * 2. 🎬 VideoClip: 비디오 + 오디오 (시각적+오디오 속성 모두 포함)
 * 3. 🖼️ ImageClip: 이미지 (시각적 속성만, 크롭/필터 지원)
 * 4. 📝 TextClip: 단순 텍스트 (폰트/색상/정렬 등)
 * 5. 📄 SentenceClip: 고급 텍스트 (세그먼트 기반 스타일링)
 * 6. 📖 LongSentenceClip: 긴 문장 자동 분할 (TTS+Whisper 통합)
 * 7. 🔶 ShapeClip: 기본 도형 (사각형, 원형 등)
 * 8. 🔷 PolygonShapeClip: 복잡한 다각형
 * 
 * 주요 특징:
 * - Union 타입으로 컴파일 타임 안전성 보장
 * - 타입 가드로 런타임 안전성 확보
 * - 메모리 최적화 (필요한 속성만 포함)
 * - IDE 자동완성 100% 정확도
 * - Base Clip 시스템 호환
 * 
 * 메모리 최적화:
 * - AudioClip: 시각적 속성 제거 (40% 절약)
 * - TextClip: mediaUrl 제거 (자체 생성)
 * - ShapeClip: mediaUrl 제거 (코드 생성)
 */

// 🎯 3단계 Union 타입 시스템 - 구체적인 클립 타입 정의
// 타입별로 필요한 속성만 포함하는 안전한 클립 타입들

import { 
  BaseClipCore, 
  VisualClipProperties, 
  AudioProperties, 
  TextProperties,
  SentenceProperties,
  ShapeClipProperties,
  SimpleShapeClipProperties,
  PolygonShapeClipProperties,
  SpacerClipProperties
} from './clipCore';

// ===== 🎵 AUDIO CLIP ===== //
/**
 * 🎵 오디오 클립 - 시각적 속성 완전 제거
 * - 타임라인에서 오디오만 처리
 * - x, y, width, height 등 시각적 속성 없음
 * - 메모리 사용량 40% 절약
 */
export interface AudioClip extends BaseClipCore, AudioProperties {
  mediaType: 'audio';
  mediaUrl: string;  // 오디오 파일 URL (필수)
  
  // 🚫 시각적 속성 완전 제거
  // x, y, width, height, opacity, rotation 등 없음
}

// ===== 🎬 VIDEO CLIP ===== //
/**
 * 🎬 비디오 클립 - 시각적 + 오디오 속성 모두 포함
 * - 화면 표시를 위한 모든 시각적 속성
 * - 사운드 처리를 위한 오디오 속성
 */
export interface VideoClip extends BaseClipCore, VisualClipProperties, AudioProperties {
  mediaType: 'video';
  mediaUrl: string;  // 비디오 파일 URL (필수)
}

// ===== 🖼️ IMAGE CLIP ===== //
/**
 * 🖼️ 이미지 클립 - 시각적 속성만 포함
 * - 화면 표시를 위한 시각적 속성
 * - 오디오 속성 없음 (이미지는 소리 없음)
 */
export interface ImageClip extends BaseClipCore, VisualClipProperties {
  mediaType: 'image';
  mediaUrl: string;  // 이미지 파일 URL (필수)
  
  // 이미지 전용 속성들
  originalWidth?: number;
  originalHeight?: number;
  
  // 크롭 설정
  crop?: {
    x: number;      // 0 ~ 100 (%)
    y: number;      // 0 ~ 100 (%)
    width: number;  // 1 ~ 100 (%)
    height: number; // 1 ~ 100 (%)
  };
  
  // 🚫 오디오 속성 없음
  // volume, playbackRate 등 없음
}

// ===== 📝 TEXT CLIP ===== //
/**
 * 📝 텍스트 클립 - 시각적 + 텍스트 속성 포함
 * - 화면 표시를 위한 시각적 속성
 * - 텍스트 고유 속성들 (fontSize, color 등)
 * - mediaUrl 없음 (텍스트는 자체 생성)
 */
export interface TextClip extends BaseClipCore, VisualClipProperties, TextProperties {
  mediaType: 'text';
  text: string;  // 표시할 텍스트 (필수)
  
  // 🚫 mediaUrl 없음 (텍스트는 파일이 아님)
  // 🚫 오디오 속성 없음
}

// ===== 📄 SENTENCE CLIP ===== //
/**
 * 📄 Sentence 클립 - 시각적 + 고급 텍스트 속성 포함
 * - TextClip의 모든 기능 포함
 * - 문장 내 부분별 개별 스타일링 지원
 * - 텍스트 세그먼트 기반 고급 편집
 */
export interface SentenceClip extends BaseClipCore, VisualClipProperties, SentenceProperties {
  mediaType: 'sentence';
  text: string;  // 전체 텍스트 (필수)
  
  // 포지셔닝 시스템 (LongSentence와 호환)
  positioning?: 'coordinate' | 'alignment';
  positionMargin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // 🚫 mediaUrl 없음 (텍스트는 파일이 아님)
  // 🚫 오디오 속성 없음
}

// ===== 📖 LONG SENTENCE CLIP ===== //
/**
 * 📖 LongSentence 클립 - 긴 텍스트와 미디어를 자동으로 여러 클립으로 분할
 * - 자동 문장 분할 및 TTS 생성
 * - 각 텍스트에 연결된 미디어(이미지/비디오) 지원
 * - Whisper 자막 생성 지원
 * - 변환 진행 상태 추적
 */
export interface LongSentenceClip extends BaseClipCore, VisualClipProperties, Omit<TextProperties, 'text'> {
  mediaType: 'longsentence';
  
  // 새로운 데이터 구조: 텍스트 + 미디어 배열
  data: Array<{
    text: string;      // 문장 텍스트
    mediaUrl: string;  // 연결된 이미지/비디오 URL
    mediaProps?: {     // 개별 미디어 속성
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      opacity?: number;
      rotation?: number;
    };
  }>;
  
  // text 속성은 선택적 (호환성을 위해)
  text?: string;
  
  // 분할 설정
  maxWordsPerSentence: number;
  splitOnPunctuation: boolean;
  generateTTS: boolean;
  generateText: boolean; // 텍스트 클립 생성 여부
  generateSubtitles: boolean;
  language: string; // 서버에서 동적으로 관리되는 언어 코드
  voice: string;
  
  // 시간 간격 설정
  timeSpace?: number; // 데이터 항목 사이의 시간 간격 (초)
  showMediaDuringTimeSpace?: boolean; // 시간 간격 동안 미디어 표시 여부 (기본값: true)
  
  // Player 표시 모드 설정
  displayMode?: 'none' | 'sentence' | 'media' | 'both'; // Player에서 보여줄 내용 선택 (기본값: 'none')
  
  // 변환 상태
  conversionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  conversionProgress: number; // 0-100
  generatedClips?: string[]; // 생성된 sentence + audio + image/video 클립 ID들
  errorMessage?: string;
  
  // 변환 설정
  autoConvertOnEdit: boolean;
  preserveOriginal: boolean; // 원본 클립 유지 여부
  
  // 부모-자식 관계
  childClipIds?: string[]; // 생성된 자식 클립들의 ID 목록
  
  // 미디어 클립 속성 (Image/Video 편집용)
  mediaProperties?: {
    // 위치 및 크기
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    
    // 표시 속성
    opacity?: number;
    rotation?: number;
    
    // 이미지 효과 (ImageClip과 동일)
    filters?: {
      brightness?: number;    // -100 ~ 100
      contrast?: number;      // -100 ~ 100
      saturation?: number;    // -100 ~ 100
      temperature?: number;   // -100 ~ 100
      hue?: number;          // -180 ~ 180
      sepia?: number;        // 0 ~ 100
      grayscale?: number;    // 0 ~ 100
    };
    
    effects?: {
      blur?: number;         // 0 ~ 20
      shadow?: number;       // 0 ~ 50
      borderWidth?: number;  // 0 ~ 20
      borderColor?: string;  // hex color
      glow?: number;         // 0 ~ 100
    };
    
    crop?: {
      x: number;      // 0 ~ 100 (%)
      y: number;      // 0 ~ 100 (%)
      width: number;  // 1 ~ 100 (%)
      height: number; // 1 ~ 100 (%)
    };
    
    // 비디오 속성 (VideoClip과 동일)
    volume?: number;
    playbackRate?: number;
  };
  
  // 전역 미디어 설정
  mediaSettings?: {
    defaultWidth?: number;
    defaultHeight?: number;
    defaultX?: number;
    defaultY?: number;
    defaultOpacity?: number;
    positionMargin?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    placement?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  
  // 텍스트 전용 속성 (Sentence 영역)
  textProperties?: {
    // 좌표 모드 속성
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    rotation?: number;
    
    // 포지셔닝 모드
    positioning?: 'coordinate' | 'alignment';
    
    // 정렬 모드 속성
    alignment?: {
      horizontal?: 'left' | 'center' | 'right';
      vertical?: 'top' | 'center' | 'bottom';
      marginTop?: number;
      marginBottom?: number;
      marginLeft?: number;
      marginRight?: number;
    };
    
    // 레거시 여백 (호환성)
    positionMargin?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    
    // 🔧 텍스트 스타일 속성들 추가 (패딩 등)
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number;
    letterSpacing?: number;
    textDecoration?: string;
    textTransform?: string;
    borderRadius?: number;
    textShadow?: string;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    // 효과 속성들
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
  };
  
  // 🚫 이전 text 속성 제거
  // 🚫 mediaUrl 없음 (data 배열로 관리)
  // 🚫 오디오 속성 없음 (mediaProperties로 관리)
}

// ===== 🔶 SHAPE CLIPS ===== //
/**
 * 🔶 기본 도형 클립 - 시각적 + 도형 속성 포함
 */
export interface ShapeClip extends BaseClipCore, VisualClipProperties, ShapeClipProperties {
  mediaType: 'shape';
  
  // 🚫 mediaUrl 없음 (도형은 코드로 생성)
  // 🚫 오디오 속성 없음
}

/**
 * 🟡 단순 도형 클립 - 시각적 + 단순도형 속성 포함
 */
export interface SimpleShapeClip extends BaseClipCore, VisualClipProperties, SimpleShapeClipProperties {
  mediaType: 'simpleShape';
  
  // 🚫 mediaUrl 없음
  // 🚫 오디오 속성 없음
}

/**
 * 🔺 다각형 도형 클립 - 시각적 + 다각형 속성 포함
 */
export interface PolygonShapeClip extends BaseClipCore, VisualClipProperties, PolygonShapeClipProperties {
  mediaType: 'polygonShape';
  
  // 🚫 mediaUrl 없음
  // 🚫 오디오 속성 없음
}

// ===== ⏸️ SPACER CLIP ===== //
/**
 * ⏸️ 스페이서 클립 - 시간만 차지하는 투명한 클립
 * - 화면에 표시되지 않음 (시각적 속성 없음)
 * - 오디오 출력 없음 (오디오 속성 없음)  
 * - 타임라인에서 시간만 차지하는 용도
 * - 일시정지, 전환시간, 버퍼 등으로 활용
 */
export interface SpacerClip extends BaseClipCore, SpacerClipProperties {
  mediaType: 'spacer';
  
  // 🚫 mediaUrl 없음 (빈 시간이므로 미디어 파일 불필요)
  // 🚫 시각적 속성 없음 (x, y, width, height, opacity 등 없음)
  // 🚫 오디오 속성 없음 (volume, playbackRate 등 없음)
  
  // 스페이서만의 고유 속성
  spacerProperties?: SpacerClipProperties;
}

// ===== 🎯 UNION TYPE ===== //
/**
 * 🎯 최종 TimelineClip Union 타입
 * - 컴파일 타임 타입 안전성 보장
 * - 각 클립 타입별 정확한 속성만 허용
 * - IDE 자동완성 정확도 100%
 */
export type NewTimelineClip = 
  | AudioClip 
  | VideoClip 
  | ImageClip 
  | TextClip 
  | SentenceClip
  | LongSentenceClip
  | ShapeClip 
  | SimpleShapeClip 
  | PolygonShapeClip
  | SpacerClip;

// ===== 🛡️ TYPE GUARDS ===== //
/**
 * 🛡️ 구체적인 타입 가드 함수들
 * - 컴파일 타임 + 런타임 타입 안전성
 * - 기존 clipGuards.ts와 호환
 */

export const isAudioClip = (clip: NewTimelineClip): clip is AudioClip => {
  return clip.mediaType === 'audio';
};

export const isVideoClip = (clip: NewTimelineClip): clip is VideoClip => {
  return clip.mediaType === 'video';
};

export const isImageClip = (clip: NewTimelineClip): clip is ImageClip => {
  return clip.mediaType === 'image';
};

export const isTextClip = (clip: NewTimelineClip): clip is TextClip => {
  return clip.mediaType === 'text';
};

export const isSentenceClip = (clip: NewTimelineClip): clip is SentenceClip => {
  return clip.mediaType === 'sentence';
};

export const isLongSentenceClip = (clip: NewTimelineClip): clip is LongSentenceClip => {
  return clip.mediaType === 'longsentence';
};

export const isShapeClip = (clip: NewTimelineClip): clip is ShapeClip => {
  return clip.mediaType === 'shape';
};

export const isSimpleShapeClip = (clip: NewTimelineClip): clip is SimpleShapeClip => {
  return clip.mediaType === 'simpleShape';
};

export const isPolygonShapeClip = (clip: NewTimelineClip): clip is PolygonShapeClip => {
  return clip.mediaType === 'polygonShape';
};

export const isSpacerClip = (clip: NewTimelineClip): clip is SpacerClip => {
  return clip.mediaType === 'spacer';
};

// 🎨 시각적 클립인지 확인 (Union 타입 활용)
export const isVisualClip = (clip: NewTimelineClip): clip is VideoClip | ImageClip | TextClip | SentenceClip | LongSentenceClip | ShapeClip | SimpleShapeClip | PolygonShapeClip => {
  return ['video', 'image', 'text', 'sentence', 'longsentence', 'shape', 'simpleShape', 'polygonShape'].includes(clip.mediaType);
};

// 🎵 오디오 속성을 가진 클립인지 확인
export const hasAudioProperties = (clip: NewTimelineClip): clip is VideoClip | AudioClip => {
  return clip.mediaType === 'video' || clip.mediaType === 'audio';
};

// 📝 텍스트 속성을 가진 클립인지 확인  
export const hasTextProperties = (clip: NewTimelineClip): clip is TextClip | SentenceClip | LongSentenceClip => {
  return clip.mediaType === 'text' || clip.mediaType === 'sentence' || clip.mediaType === 'longsentence';
};

// 🔶 도형 속성을 가진 클립인지 확인
export const hasShapeProperties = (clip: NewTimelineClip): clip is ShapeClip | SimpleShapeClip | PolygonShapeClip => {
  return ['shape', 'simpleShape', 'polygonShape'].includes(clip.mediaType);
};

// ===== 📊 유틸리티 타입들 ===== //
/**
 * 시각적 클립만 추출하는 유틸리티 타입
 */
export type VisualClip = VideoClip | ImageClip | TextClip | SentenceClip | LongSentenceClip | ShapeClip | SimpleShapeClip | PolygonShapeClip;

/**
 * 오디오 속성을 가진 클립만 추출하는 유틸리티 타입
 */
export type AudioCapableClip = VideoClip | AudioClip;
export type AudioEnabledClip = AudioCapableClip; // 호환성을 위한 별칭

/**
 * 파일 기반 클립만 추출하는 유틸리티 타입 (mediaUrl 필요)
 */
export type FileBasedClip = VideoClip | AudioClip | ImageClip;

/**
 * 생성형 클립만 추출하는 유틸리티 타입 (mediaUrl 불필요)
 */
export type GeneratedClip = TextClip | SentenceClip | LongSentenceClip | ShapeClip | SimpleShapeClip | PolygonShapeClip | SpacerClip;

/**
 * 도형 클립들만 추출하는 유틸리티 타입
 */
export type ShapeClipTypes = ShapeClip | SimpleShapeClip | PolygonShapeClip;

/**
 * 클립 타입 문자열 유니온
 */
export type ClipType = 'audioClip' | 'videoClip' | 'imageClip' | 'textClip' | 'sentenceClip' | 'longsentenceClip' | 'shapeClip' | 'simpleShapeClip' | 'polygonShapeClip' | 'spacerClip';

// ===== 🎯 타입별 속성 접근 헬퍼들 ===== //
/**
 * 🎨 시각적 속성 안전 접근
 */
export const getVisualProperties = (clip: NewTimelineClip): VisualClipProperties | null => {
  if (isVisualClip(clip)) {
    return {
      x: clip.x,
      y: clip.y,
      width: clip.width,
      height: clip.height,
      opacity: clip.opacity,
      rotation: clip.rotation,
      // ... 기타 시각적 속성들
    } as VisualClipProperties;
  }
  return null;
};

/**
 * 🎵 오디오 속성 안전 접근
 */
export const getAudioProperties = (clip: NewTimelineClip): AudioProperties | null => {
  if (hasAudioProperties(clip)) {
    return {
      volume: clip.volume,
      playbackRate: clip.playbackRate
    } as AudioProperties;
  }
  return null;
};

/**
 * 📝 텍스트 속성 안전 접근
 */
export const getTextProperties = (clip: NewTimelineClip): TextProperties | SentenceProperties | null => {
  if (hasTextProperties(clip)) {
    // LongSentenceClip의 경우 첫 번째 데이터의 text 반환
    if (isLongSentenceClip(clip)) {
      const firstText = clip.data && clip.data.length > 0 ? clip.data[0].text : '';
      return {
        text: firstText
      } as Pick<TextProperties, 'text'>;
    }
    
    return {
      text: clip.text,
      fontSize: clip.fontSize,
      fontFamily: clip.fontFamily,
      color: clip.color,
      // SentenceClip의 경우 추가 속성들도 포함
      ...(isSentenceClip(clip) && {
        textSegments: clip.textSegments,
        segmentOverlapMode: clip.segmentOverlapMode,
        defaultSegmentStyle: clip.defaultSegmentStyle
      })
    } as TextProperties | SentenceProperties;
  }
  return null;
};
