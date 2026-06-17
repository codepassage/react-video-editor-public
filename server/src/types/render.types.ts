/**
 * 렌더링 관련 타입 정의
 */

export interface RenderScrubber {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  mediaType: 'text' | 'image' | 'video' | 'audio' | 'shape' | 'simpleShape' | 'polygonShape' | 'sentence';
  width: number;
  height: number;
  trackId: string;
  trackIndex: number;
  media_width: number;
  media_height: number;
  x: number;
  y: number;
  mediaUrlLocal?: string;
  mediaUrlRemote?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  textTransform?: string;
  opacity?: number;
  rotation?: number;

  // 🆕 Sentence 클립 전용 속성들
  textSegments?: Array<{
    id: string;
    text: string;
    startIndex: number;
    endIndex: number;
    priority: number;
    layer: number;
    style: {
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      fontStyle?: string;
      color?: string;
      backgroundColor?: string;
      textDecoration?: string;
      textTransform?: string;
      textShadow?: string;
      borderRadius?: string;
      boxShadow?: string;
    };
  }>;
  segmentVersion?: number;
  totalSegments?: number;
  lastEditedSegmentId?: string;
  segmentOverlapMode?: 'priority' | 'layer' | 'blend';
  enableRealTimePreview?: boolean;
  autoSize?: boolean;
  
  // 🆕 텍스트 효과 속성들 (Sentence와 Text 클립 공용)
  textShadow?: string;
  backgroundShadow?: string;
  borderRadius?: number;
  borderRadiusUnit?: string;
  textGradient?: any;
  textGlow?: any;
  strokeWidth?: number;
  strokeColor?: string;
  multipleStrokes?: any[];
  textBevel?: any;
  textExtrude?: any;
  multipleShadows?: any[];
  textTexture?: any;

  // 🎨 페이드 효과 속성
  fadeIn?: number;
  fadeOut?: number;

  // 🎨 시각 필터 속성
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;

  // 🎨 변형 속성
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  anchorX?: number;
  anchorY?: number;
  blendMode?: string;

  volume?: number;
  playbackRate?: number;

  // 🎬 애니메이션 속성
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;

  shapeProperties?: any;
  simpleShapeProperties?: any;
  polygonShapeProperties?: any;
}

export interface RenderTimelineDataItem {
  id: string;
  totalDuration: number;
  scrubbers: RenderScrubber[];
}

export interface RenderData {
  timelineData: RenderTimelineDataItem[];
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
}

export interface RenderInputProps {
  timelineData: RenderTimelineDataItem[];
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
  isRendering: boolean;
  fontMappings?: Record<string, string>;
  serverFontDir?: string;
}

export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
  duration: number;
}

export interface Track {
  id: string;
  clips: any[];
}
