// 편집 모드용 드래그 아이템 타입 정의
import type { ShapeProperties } from '../../types/shape';

export type EditDragItem = {
  id: string; // TimelineClip의 ID 사용
  durationInFrames: number;
  from: number;
  height: number;
  left: number;
  top: number;
  width: number;
  color: string;
  isDragging: boolean;
  
  // 미디어 타입 지원 (Shape 타입 추가)
  mediaType: 'solid' | 'image' | 'text' | 'video' | 'shape';
  mediaUrl?: string;
  text?: string;
  
  // Shape 속성 추가
  shapeProperties?: ShapeProperties;
  
  // 텍스트 스타일 속성들 추가
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textColor?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  textTransform?: string;
  wordWrap?: boolean;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;
  strokeWidth?: number;
  strokeColor?: string;
  
  // 일반 클립 속성들
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  anchorX?: number;
  anchorY?: number;
  blendMode?: string;
  
  // 고급 기능 지원
  isSelected?: boolean;
  snapToGrid?: boolean;
  originalPosition?: { x: number; y: number };
  
  // 타임라인 연동 필드
  originalClipId: string; // 원본 TimelineClip의 ID
  trackId: string; // 원본 트랙 ID
  mediaId?: string; // 원본 미디어 ID
  clipStartTime: number; // 타임라인에서의 시작 시간 (초)
  clipEndTime: number; // 타임라인에서의 끝 시간 (초)
};
