// 렌더링용 타입 정의 (애니메이션 지원 추가)

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
  
  // 위치 정보
  x: number;
  y: number;
  
  // 미디어 URL (로컬/원격)
  mediaUrlLocal?: string;
  mediaUrlRemote?: string;
  
  // 텍스트 속성
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
  
  // 시각적 속성
  opacity?: number;
  rotation?: number;
  
  // 🎨 페이드 효과 속성 추가
  fadeIn?: number;
  fadeOut?: number;
  
  // 🎨 시각 필터 속성 추가
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;
  
  // 🎨 변형 속성 추가
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  anchorX?: number;
  anchorY?: number;
  blendMode?: string;
  
  // 오디오/비디오 속성
  volume?: number;
  playbackRate?: number;
  
  // 🎬 애니메이션 속성 추가
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;
  
  // Shape 클립 속성
  shapeProperties?: any;
  
  // SimpleShape 클립 속성
  simpleShapeProperties?: any;
  
  // PolygonShape 클립 속성
  polygonShapeProperties?: any;
}

export interface RenderTimelineDataItem {
  id: string;
  totalDuration: number;
  scrubbers: RenderScrubber[];
}

export interface RenderCompositionProps {
  timelineData: RenderTimelineDataItem[];
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
  isRendering: boolean;
}

// 현재 프로젝트 타입을 렌더링 타입으로 변환하는 함수들
import type { TimelineTrack, TimelineClip, ProjectSettings } from '../types';

export function convertToRenderData(
  tracks: TimelineTrack[],
  projectSettings: ProjectSettings
): {
  timelineData: RenderTimelineDataItem[];
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
} {
  const FPS = projectSettings.fps || 30;
  
  // tracks를 RenderTimelineDataItem으로 변환
  const timelineData: RenderTimelineDataItem[] = tracks.map((track, trackIndex) => ({
    id: track.id,
    totalDuration: projectSettings.duration,
    scrubbers: track.clips.map((clip): RenderScrubber => ({
      id: clip.id,
      startTime: clip.startTime,
      endTime: clip.endTime,
      duration: clip.duration,
      mediaType: clip.mediaType,
      width: clip.width,
      height: clip.height,
      trackId: track.id,
      trackIndex,
      media_width: clip.width,
      media_height: clip.height,
      x: clip.x,
      y: clip.y,
      
      // 미디어 URL 설정 (하드코딩 제거 - 서버에서 처리)
      mediaUrlLocal: clip.mediaUrl,
      mediaUrlRemote: clip.mediaUrl, // 서버에서 이미 절대 경로로 변환됨
      
      // 텍스트 속성
      text: clip.text,
      fontSize: clip.fontSize,
      fontFamily: clip.fontFamily,
      fontWeight: clip.fontWeight,
      color: clip.color,
      backgroundColor: clip.backgroundColor,
      textAlign: clip.textAlign,
      
      // 시각적 속성
      opacity: clip.opacity,
      rotation: clip.rotation,
      
      // 🎨 페이드 효과 속성 복사
      fadeIn: clip.fadeIn,
      fadeOut: clip.fadeOut,
      
      // 🎨 시각 필터 속성 복사
      brightness: clip.brightness,
      contrast: clip.contrast,
      saturation: clip.saturation,
      hue: clip.hue,
      blur: clip.blur,
      sepia: clip.sepia,
      grayscale: clip.grayscale,
      
      // 🎨 변형 속성 복사
      scaleX: clip.scaleX,
      scaleY: clip.scaleY,
      skewX: clip.skewX,
      skewY: clip.skewY,
      anchorX: clip.anchorX,
      anchorY: clip.anchorY,
      blendMode: clip.blendMode,
      
      // 오디오/비디오 속성
      volume: clip.volume,
      playbackRate: clip.playbackRate,
      
      // 🎬 애니메이션 속성 복사
      animationType: clip.animationType,
      animationDuration: clip.animationDuration,
      animationDelay: clip.animationDelay,
      animationEasing: clip.animationEasing,
      animationLoop: clip.animationLoop,
      
      // Shape 클립 속성
      shapeProperties: clip.shapeProperties,
      
      // SimpleShape 클립 속성
      simpleShapeProperties: clip.simpleShapeProperties,
      
      // PolygonShape 클립 속성
      polygonShapeProperties: clip.polygonShapeProperties,
    }))
  }));
  
  return {
    timelineData,
    durationInFrames: Math.round(projectSettings.duration * FPS),
    compositionWidth: projectSettings.width,
    compositionHeight: projectSettings.height,
  };
}
