import {
  NewTimelineClip,
  MediaType
} from '../types';


// Shape 관련 타입 export
export * from './shape';

// 🔄 Phase 3 Core: Union 타입 시스템으로 완전 전환
// NewTimelineClip Union 타입을 기본 TimelineClip으로 사용
export type {
  NewTimelineClip,
  AudioClip,
  VideoClip,
  ImageClip,
  TextClip,
  ShapeClip,
  SimpleShapeClip,
  PolygonShapeClip,
  SpacerClip,
  VisualClip,
  AudioCapableClip,
  AudioEnabledClip,
  ShapeClipTypes,
  FileBasedClip,
  GeneratedClip
} from './clipTypes';

export {
  // 타입 가드들
  isAudioClip,
  isVideoClip,
  isImageClip,
  isTextClip,
  isShapeClip,
  isSimpleShapeClip,
  isPolygonShapeClip,
  isSpacerClip,
  isVisualClip,
  hasAudioProperties,
  hasTextProperties,
  hasShapeProperties
} from './clipTypes';

export {
  // 생성 함수들
  createAudioClip,
  createVideoClip,
  createImageClip,
  createTextClip,
  createShapeClip,
  createSimpleShapeClip,
  createPolygonShapeClip,
  createSpacerClip,
  createClip,
  getDefaultClipName,
  validateClip
} from './clipCreators';

export type { MediaType } from './clipCore';

// 🔄 기본 TimelineClip 타입을 Union 타입으로 교체
export type TimelineClip = NewTimelineClip;

// 미디어 아이템 기본 정보 (기존 정의 유지)
export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  url?: string;
  duration?: number; // 초 단위
  width?: number;
  height?: number;
  fileSize?: number;
  thumbnail?: string;

  // 클립 생성 시 사용할 기본 속성들 (선택적)
  x?: number;
  y?: number;
  opacity?: number;
  rotation?: number;

  // 텍스트 미디어용 속성들
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;

  // Shape 미디어용 속성들
  shapeProperties?: import('./shape').ShapeProperties;

  // 오디오/비디오용 속성들
  volume?: number;
  playbackRate?: number;

  // 스페이서 미디어용 속성들
  description?: string;
  label?: string;
  displayColor?: string;
  displayPattern?: 'solid' | 'striped' | 'dotted' | 'dashed';
  purpose?: 'timing' | 'pause' | 'transition' | 'buffer' | 'placeholder' | 'custom';
  notes?: string;
}

// 🔒 기존 TimelineClip 정의를 LegacyTimelineClip으로 백업 보존
export interface LegacyTimelineClip {
  id: string;
  mediaId: string;
  trackId: string;
  name?: string;     // 🆕 사용자 식별용 클립 이름
  startTime: number; // 타임라인에서의 시작 시간 (초)
  endTime: number;   // 타임라인에서의 끝 시간 (초)
  duration: number;  // 클립의 지속 시간 (초)

  // 미디어별 속성
  mediaType: MediaType;
  mediaUrl?: string;

  // 위치 및 크기 (영상 내에서의 위치)
  x: number;
  y: number;
  width: number;
  height: number;

  // 위치 여백 설정
  positionMargin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // 기본 변형 속성
  opacity: number;
  rotation: number;

  // 고급 변형 속성
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  anchorX?: number; // 0-1, 변형 기준점 X
  anchorY?: number; // 0-1, 변형 기준점 Y

  // 블렌드 모드
  blendMode?: string;

  // 텍스트 전용 속성
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;

  // 고급 텍스트 속성
  textDecoration?: string;
  textTransform?: string;
  wordWrap?: boolean;
  textOverflow?: string;
  autoSize?: boolean;

  // 패딩
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  // 텍스트 그림자
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;

  // 텍스트 테두리 (기본)
  strokeWidth?: number;
  strokeColor?: string;

  // === 전문적인 텍스트 효과 시스템 === //

  // 그라데이션 텍스트
  textGradient?: import('./textEffects').TextGradient;

  // 다중 그림자 효과
  multipleShadows?: import('./textEffects').TextShadowEffect[];

  // 글로우 효과
  textGlow?: import('./textEffects').TextGlowEffect;

  // 3D 베벨 효과
  textBevel?: import('./textEffects').TextBevelEffect;

  // 텍스트 돌출 효과 (3D Extrude)
  textExtrude?: import('./textEffects').TextExtrudeEffect;

  // 텍스트 텍스처 효과
  textTexture?: import('./textEffects').TextTextureEffect;

  // 고급 다중 스트로크
  multipleStrokes?: import('./textEffects').TextStrokeEffect[];

  // 텍스트 애니메이션
  textAnimation?: import('./textEffects').TextAnimationEffect;

  // 텍스트 왜곡 효과
  textDistortion?: import('./textEffects').TextDistortionEffect;

  // Shape 클립 전용 속성들
  shapeProperties?: import('./shape').ShapeProperties;

  // SimpleShape 클립 전용 속성들
  simpleShapeProperties?: {
    backgroundType: 'image' | 'color';
    backgroundColor?: string;
    backgroundImageUrl?: string;
    backgroundFit?: 'cover' | 'contain' | 'fill';
    backgroundPosition?: string;
    borderRadius?: number; // 둥근 모서리
    borderRadiusUnit?: 'px' | '%'; // 테두리 반지름 단위

    // 가장자리 페이드 효과
    edgeFade?: number; // 0-100, 페이드 강도
    fadeType?: 'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right'; // 페이드 방향

    // 고급 Multi-Stop Edge Fade
    edgeFadeStops?: Array<{ position: number; opacity: number }>; // 그래디언트처럼 여러 조절점
  };

  // PolygonShape 클립 전용 속성들
  polygonShapeProperties?: {
    // 도형 설정
    shapeType: 'star' | 'heart' | 'triangle' | 'diamond' | 'circle' | 'rectangle';

    // 배경 설정 (SimpleShape와 동일)
    backgroundType: 'color' | 'gradient' | 'image';
    backgroundColor?: string;
    gradient?: {
      type: 'linear' | 'radial' | 'conic';
      angle?: number;
      centerX?: number;
      centerY?: number;
      stops: Array<{ color: string; position: number }>;
    };

    // 이미지 배경 (SimpleShape와 동일)
    backgroundImageUrl?: string;
    backgroundFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    backgroundPosition?: string;

    // 외관 설정
    borderRadius?: number; // 둥근 모서리
    borderRadiusUnit?: 'px' | '%'; // 테두리 반지름 단위
    borderWidth?: number;
    borderColor?: string;

    // 그림자 효과
    shadowEnabled?: boolean;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowBlur?: number;
    shadowColor?: string;

    // 가장자리 페이드 효과
    edgeFade?: number; // 0-100, 페이드 강도
    fadeType?: 'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right'; // 페이드 방향

    // 고급 Multi-Stop Edge Fade
    edgeFadeStops?: Array<{ position: number; opacity: number }>; // 그래디언트처럼 여러 조절점
  };

  // 시각 필터 효과
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;

  // 오디오/비디오 전용 속성
  volume?: number;
  playbackRate?: number;

  // 애니메이션 효과
  fadeIn?: number;
  fadeOut?: number;

  // 고급 애니메이션
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;

  // === 기준트랙/클립 시스템 속성 === //

  // 기준클립 속성들
  baseClipProperties?: import('./baseClips').BaseClipProperties;

  // 일반클립 속성들  
  regularClipProperties?: import('./baseClips').RegularClipProperties;

  // 템플릿 그룹 속성
  templateGroupId?: string; // 소속 그룹 ID
  isGrouped?: boolean; // 그룹화 여부

  // Bundle 속성
  bundleId?: string; // 소속 Bundle ID
  isBundled?: boolean; // Bundle 소속 여부
}

// 타임라인 트랙
export interface TimelineTrack {
  id: string;
  name: string; // 내부 로직용 (track-1, track-2...)
  displayName: string; // 화면 표시용 (사용자가 수정 가능)
  clips: TimelineClip[];
  isLocked: boolean;
  isVisible: boolean;
  height: number; // 트랙 높이 (픽셀)
}

// 프로젝트 설정
export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
  duration: number; // 전체 프로젝트 길이 (초)
  backgroundColor: string;
}

// 타임라인 상태
export interface TimelineState {
  currentTime: number; // 현재 재생 시간 (초)
  isPlaying: boolean;
  zoom: number; // 타임라인 줌 레벨 (픽셀/초)
  scrollLeft: number; // 타임라인 스크롤 위치
  selectedClips: string[]; // 선택된 클립 ID들
  tracks: TimelineTrack[];
  projectSettings: ProjectSettings;
  templateGroups: import('./templates').TemplateGroup[]; // 템플릿 그룹들

  // Bundle 관련 상태
  bundles: import('./bundles').Bundle[];
  selectedBundleId: string | null;
  bundleSelectionMode: boolean;    // Command/Ctrl 키 상태
  pendingBundleSelection: import('./bundles').SelectedElement[]; // 선택 중인 요소들

  // 스냅 관련 상태
  snapValue: number; // 사용자 설정 가능한 스냅 값 (초 단위, 기본값 0.25초)
}

// 드래그 앤 드롭 관련
export interface DragItem {
  type: 'media' | 'clip' | 'bundleElement';
  mediaItem?: MediaItem;
  clipId?: string;
  shiftKeyPressed?: boolean; // Shift 키 눌림 상태 (deprecated)
  optionKeyPressed?: boolean; // Option 키 눌림 상태
}

// 히스토리 관리용
export interface HistoryState {
  timeline: TimelineState;
  timestamp: number;
  description: string;
}
