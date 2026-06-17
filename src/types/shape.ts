/**
 * 🎨 shape.ts - Shape 클립 타입 정의 및 프리셋
 * 
 * React Video Editor v1에서 사용되는 도형(Shape) 클립의 타입 정의와
 * 기본 프리셋들을 관리하는 핵심 모듈입니다.
 * 
 * 🎯 주요 기능:
 * - 다양한 도형 타입 지원 (원형, 사각형, 삼각형, 별, 하트 등)
 * - 고급 배경 시스템 (단색, 그라데이션, 이미지, 비디오)
 * - 테두리 및 그림자 효과
 * - 내부 그림자 및 글로우 효과
 * - 커스텀 SVG 경로 지원
 * - 사전 정의된 도형 프리셋
 * 
 * 🎨 지원 도형 타입:
 * ```
 * 기본 도형: 원형, 사각형, 타원형
 * 다각형: 삼각형, 다이아몬드, 육각형, 팔각형
 * 특수 도형: 별, 하트
 * 화살표: 상하좌우 방향
 * 커스텀: SVG 경로 기반
 * ```
 * 
 * 🌈 배경 시스템:
 * - 단색: 투명도 지원
 * - 그라데이션: 선형, 원형, 원뿔형
 * - 이미지: 다양한 맞춤 모드
 * - 비디오: 동적 배경 지원
 * 
 * ✨ 시각 효과:
 * - 테두리: 내부/외부/중앙 효과, 다양한 스타일
 * - 그림자: 외부 그림자 (오프셋, 블러, 확산)
 * - 내부 그림자: 깊이감 연출
 * - 글로우: 발광 효과
 * 
 * 🎬 사용 시나리오:
 * - 로고 및 브랜딩 요소
 * - 장식적 그래픽 요소
 * - 정보 강조를 위한 도형
 * - 배경 장식 및 패턴
 * - 인터랙티브 버튼 요소
 * 
 * 🔗 연관 모듈:
 * - Clip System: 기본 클립 시스템
 * - Rendering Engine: 도형 렌더링
 * - Properties Panel: 속성 편집 UI
 * - Timeline System: 타임라인 표시
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */

/**
 * 지원되는 도형 타입 정의
 * 
 * @type ShapeType
 * @description Shape 클립에서 사용할 수 있는 모든 도형 타입을 정의합니다.
 * 기본 도형부터 특수 도형, 화살표, 커스텀 도형까지 다양한 형태를 지원합니다.
 * 
 * 📊 도형 분류:
 * - 기본 도형: rectangle, rounded-rectangle, circle, ellipse
 * - 다각형: triangle, diamond, hexagon, octagon
 * - 특수 도형: star, heart
 * - 화살표: arrow-right, arrow-left, arrow-up, arrow-down
 * - 커스텀: custom (SVG 경로 기반)
 */
export type ShapeType = 
  | 'rectangle'         // 사각형
  | 'rounded-rectangle' // 둥근 사각형
  | 'circle'           // 원형
  | 'ellipse'          // 타원형
  | 'triangle'         // 삼각형
  | 'diamond'          // 다이아몬드
  | 'hexagon'          // 육각형
  | 'octagon'          // 팔각형
  | 'star'             // 별
  | 'heart'            // 하트
  | 'arrow-right'      // 오른쪽 화살표
  | 'arrow-left'       // 왼쪽 화살표
  | 'arrow-up'         // 위쪽 화살표
  | 'arrow-down'       // 아래쪽 화살표
  | 'custom';          // 커스텀 SVG 경로

/**
 * 도형 배경 타입 정의
 * 
 * @type BackgroundType
 * @description Shape 클립의 배경으로 사용할 수 있는 모든 타입을 정의합니다.
 * 단색부터 동적 비디오 배경까지 다양한 시각적 효과를 지원합니다.
 */
export type BackgroundType = 
  | 'solid'     // 단색 배경
  | 'gradient'  // 그라데이션 배경
  | 'image'     // 이미지 배경
  | 'video';    // 비디오 배경

/**
 * 그라데이션 타입 정의
 * 
 * @type GradientType
 * @description 그라데이션 배경에서 사용할 수 있는 모든 그라데이션 타입을 정의합니다.
 * CSS 표준 그라데이션 타입을 지원합니다.
 */
export type GradientType = 
  | 'linear'  // 선형 그라데이션 (직선 방향)
  | 'radial'  // 원형 그라데이션 (중심에서 바깥으로)
  | 'conic';  // 원뿔형 그라데이션 (회전 방향)

/**
 * 테두리 효과 타입 정의
 * 
 * @type BorderEffect
 * @description 도형 테두리의 렌더링 위치를 정의합니다.
 * 테두리가 도형 경계선의 어느 위치에 그려질지 결정합니다.
 */
export type BorderEffect = 
  | 'inner'   // 내부 테두리 (도형 안쪽)
  | 'outer'   // 외부 테두리 (도형 바깥쪽)
  | 'center'; // 중앙 테두리 (경계선 중앙)

/**
 * 그라데이션 색상 정지점 인터페이스
 * 
 * @interface GradientStop
 * @description 그라데이션에서 특정 위치의 색상을 정의하는 객체입니다.
 * 여러 정지점을 조합하여 복잡한 그라데이션 효과를 만들 수 있습니다.
 */
export interface GradientStop {
  /** 정지점의 색상 (hex, rgb, rgba 등 CSS 색상 형식) */
  color: string;
  
  /** 정지점의 위치 (0-100 범위의 백분율) */
  position: number;
}

/**
 * 그라데이션 설정 인터페이스
 * 
 * @interface GradientConfig
 * @description 그라데이션 배경의 모든 설정을 정의하는 객체입니다.
 * 타입별로 다른 속성들이 사용되며, 색상 정지점을 통해 그라데이션을 구성합니다.
 */
export interface GradientConfig {
  /** 그라데이션 타입 (linear, radial, conic) */
  type: GradientType;
  
  /** 선형 그라데이션의 각도 (0-360도, 선택적) */
  angle?: number;
  
  /** 원형 그라데이션의 중심 X 좌표 (0-100 백분율, 선택적) */
  centerX?: number;
  
  /** 원형 그라데이션의 중심 Y 좌표 (0-100 백분율, 선택적) */
  centerY?: number;
  
  /** 그라데이션을 구성하는 색상 정지점들의 배열 */
  stops: GradientStop[];
}

/**
 * Shape 클립의 모든 속성을 정의하는 인터페이스
 * 
 * @interface ShapeProperties
 * @description Shape 클립의 외형과 동작을 제어하는 모든 속성들을 포함합니다.
 * 도형 타입부터 시각 효과까지 완전한 커스터마이징을 지원합니다.
 * 
 * 🎨 속성 분류:
 * - 기본 설정: 도형 타입, 지속시간
 * - 배경 시스템: 색상, 그라데이션, 이미지, 비디오
 * - 테두리 효과: 두께, 색상, 스타일, 위치
 * - 그림자 효과: 외부/내부 그림자
 * - 특수 효과: 글로우, 커스텀 경로
 */
export interface ShapeProperties {
  // === 도형 기본 설정 === //
  
  /** 도형의 타입 (원형, 사각형, 별 등) */
  shapeType: ShapeType;
  
  // === 배경 설정 === //
  
  /** 배경 타입 (단색, 그라데이션, 이미지, 비디오) */
  backgroundType: BackgroundType;
  
  /** 단색 배경 색상 (backgroundType이 'solid'일 때 사용) */
  backgroundColor?: string;
  
  /** 그라데이션 배경 설정 (backgroundType이 'gradient'일 때 사용) */
  gradient?: GradientConfig;
  
  /** 배경 이미지 URL (backgroundType이 'image'일 때 사용) */
  backgroundImageUrl?: string;
  
  /** 배경 비디오 URL (backgroundType이 'video'일 때 사용) */
  backgroundVideoUrl?: string;
  
  /** 배경 맞춤 모드 (CSS object-fit과 유사) */
  backgroundFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  
  /** 배경 위치 (CSS background-position과 유사) */
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  // === 테두리 설정 === //
  
  /** 테두리 두께 (픽셀 단위) */
  borderWidth?: number;
  
  /** 테두리 색상 (CSS 색상 형식) */
  borderColor?: string;
  
  /** 테두리 스타일 (CSS border-style과 동일) */
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  
  /** 테두리 렌더링 위치 (내부/외부/중앙) */
  borderEffect?: BorderEffect;
  
  /** 모서리 둥글기 (둥근 사각형에 사용, 픽셀 단위) */
  borderRadius?: number;
  
  // === 외부 그림자 효과 === //
  
  /** 그림자 효과 활성화 여부 */
  shadowEnabled?: boolean;
  
  /** 그림자 X축 오프셋 (픽셀 단위) */
  shadowOffsetX?: number;
  
  /** 그림자 Y축 오프셋 (픽셀 단위) */
  shadowOffsetY?: number;
  
  /** 그림자 블러 반경 (픽셀 단위) */
  shadowBlur?: number;
  
  /** 그림자 색상 (CSS 색상 형식) */
  shadowColor?: string;
  
  /** 그림자 확산 반경 (픽셀 단위) */
  shadowSpread?: number;
  
  // === 내부 그림자 효과 === //
  
  /** 내부 그림자 효과 활성화 여부 */
  innerShadowEnabled?: boolean;
  
  /** 내부 그림자 X축 오프셋 (픽셀 단위) */
  innerShadowOffsetX?: number;
  
  /** 내부 그림자 Y축 오프셋 (픽셀 단위) */
  innerShadowOffsetY?: number;
  
  /** 내부 그림자 블러 반경 (픽셀 단위) */
  innerShadowBlur?: number;
  
  /** 내부 그림자 색상 (CSS 색상 형식) */
  innerShadowColor?: string;
  
  // === 클립 지속시간 설정 === //
  
  /** 지속시간 모드 (고정/동적) */
  durationMode?: 'static' | 'dynamic';
  
  /** 고정 지속시간 (durationMode가 'static'일 때 사용, 초 단위) */
  staticDuration?: number;
  
  // === 커스텀 도형 설정 === //
  
  /** 커스텀 SVG 경로 (shapeType이 'custom'일 때 사용) */
  customPath?: string;
  
  // === 추가 시각 효과 === //
  
  /** 글로우(발광) 효과 활성화 여부 */
  glowEnabled?: boolean;
  
  /** 글로우 효과 색상 (CSS 색상 형식) */
  glowColor?: string;
  
  /** 글로우 효과 크기 (픽셀 단위) */
  glowSize?: number;
}

/**
 * 기본 Shape 속성 상수
 * 
 * @constant DEFAULT_SHAPE_PROPERTIES
 * @description 새로운 Shape 클립을 생성할 때 사용되는 기본 속성값들입니다.
 * 최적화된 시각적 품질과 성능을 고려하여 설정되었습니다.
 * 
 * 🎨 기본 설정 특징:
 * - 도형: 원형 (가장 범용적)
 * - 배경: 파란색 단색 (#3b82f6)
 * - 테두리: 없음 (깔끔한 외형)
 * - 그림자: 비활성화 (성능 최적화)
 * - 지속시간: 5초 고정
 * 
 * 💡 사용 예시:
 * ```typescript
 * import { DEFAULT_SHAPE_PROPERTIES } from './shape';
 * 
 * // 기본 설정으로 새 Shape 클립 생성
 * const newShape = {
 *   ...DEFAULT_SHAPE_PROPERTIES,
 *   id: generateId()
 * };
 * 
 * // 일부 속성만 변경하여 사용
 * const customShape = {
 *   ...DEFAULT_SHAPE_PROPERTIES,
 *   shapeType: 'star',
 *   backgroundColor: '#ff0000'
 * };
 * ```
 */
export const DEFAULT_SHAPE_PROPERTIES: ShapeProperties = {
  // 기본 도형 설정
  shapeType: 'circle',              // 원형 (가장 범용적)
  
  // 배경 설정
  backgroundType: 'solid',          // 단색 배경
  backgroundColor: '#3b82f6',       // 파란색 (브랜드 컬러)
  backgroundFit: 'cover',           // 배경 맞춤 모드
  backgroundPosition: 'center',     // 배경 위치
  
  // 테두리 설정 (기본값: 테두리 없음)
  borderWidth: 0,                   // 테두리 두께
  borderColor: '#ffffff',           // 테두리 색상 (흰색)
  borderStyle: 'solid',             // 테두리 스타일
  borderEffect: 'center',           // 테두리 위치
  borderRadius: 0,                  // 모서리 둥글기
  
  // 외부 그림자 설정 (기본값: 비활성화)
  shadowEnabled: false,             // 그림자 비활성화
  shadowOffsetX: 4,                 // X축 오프셋
  shadowOffsetY: 4,                 // Y축 오프셋
  shadowBlur: 8,                    // 블러 반경
  shadowColor: 'rgba(0, 0, 0, 0.3)', // 그림자 색상
  shadowSpread: 0,                  // 확산 반경
  
  // 내부 그림자 설정 (기본값: 비활성화)
  innerShadowEnabled: false,        // 내부 그림자 비활성화
  
  // 클립 지속시간 설정
  durationMode: 'static',           // 고정 길이 모드
  staticDuration: 5,                // 5초 지속시간
  
  // 글로우 효과 설정 (기본값: 비활성화)
  glowEnabled: false,               // 글로우 비활성화
  glowColor: '#ffffff',             // 글로우 색상 (흰색)
  glowSize: 10                      // 글로우 크기
};

/**
 * Shape 프리셋 인터페이스
 * 
 * @interface ShapePreset
 * @description 사전 정의된 Shape 스타일을 나타내는 프리셋 객체입니다.
 * 사용자가 빠르게 원하는 스타일을 적용할 수 있도록 도와줍니다.
 */
export interface ShapePreset {
  /** 프리셋의 고유 식별자 */
  id: string;
  
  /** 사용자에게 표시될 프리셋 이름 */
  name: string;
  
  /** 프리셋에 포함된 Shape 속성들 (부분적 적용) */
  properties: Partial<ShapeProperties>;
  
  /** 프리셋 미리보기 썸네일 이미지 URL (선택적) */
  thumbnail?: string;
}

/**
 * 사전 정의된 Shape 프리셋 배열
 * 
 * @constant SHAPE_PRESETS
 * @description 사용자가 빠르게 적용할 수 있는 인기 있는 도형 스타일들의 컬렉션입니다.
 * 각 프리셋은 특정 용도와 미적 감각을 고려하여 디자인되었습니다.
 * 
 * 🎨 프리셋 특징:
 * - 다양한 도형 타입 커버
 * - 조화로운 색상 팔레트
 * - 즉시 사용 가능한 설정
 * - 브랜딩 및 디자인 일관성
 * 
 * 💡 사용 예시:
 * ```typescript
 * import { SHAPE_PRESETS } from './shape';
 * 
 * // 특정 프리셋 찾기
 * const starPreset = SHAPE_PRESETS.find(preset => preset.id === 'star');
 * 
 * // 프리셋 적용
 * const newShape = {
 *   ...DEFAULT_SHAPE_PROPERTIES,
 *   ...starPreset.properties
 * };
 * 
 * // UI 선택 옵션 생성
 * const presetOptions = SHAPE_PRESETS.map(preset => ({
 *   value: preset.id,
 *   label: preset.name,
 *   icon: preset.properties.shapeType
 * }));
 * ```
 */
export const SHAPE_PRESETS: ShapePreset[] = [
  // 🔴 기본 원형 - 가장 범용적이고 친근한 형태
  {
    id: 'circle',
    name: '원형',
    properties: {
      shapeType: 'circle',
      backgroundType: 'solid',
      backgroundColor: '#3b82f6'  // 신뢰감 있는 파란색
    }
  },
  
  // 🔺 기본 삼각형 - 강조와 방향성을 나타내는 도형
  {
    id: 'triangle',
    name: '삼각형',
    properties: {
      shapeType: 'triangle',
      backgroundType: 'solid',
      backgroundColor: '#10b981'  // 성장과 활력의 녹색
    }
  },
  
  // ⭐ 기본 별 - 특별함과 우수성을 표현
  {
    id: 'star',
    name: '별',
    properties: {
      shapeType: 'star',
      backgroundType: 'solid',
      backgroundColor: '#f59e0b'  // 주목도 높은 황금색
    }
  },
  
  // 💖 기본 하트 - 감정과 애정을 나타내는 도형
  {
    id: 'heart',
    name: '하트',
    properties: {
      shapeType: 'heart',
      backgroundType: 'solid',
      backgroundColor: '#ef4444'  // 열정적인 빨간색
    }
  },
  
  // 🔸 기본 다이아몬드 - 고급스러움과 가치를 표현
  {
    id: 'diamond',
    name: '다이아몬드',
    properties: {
      shapeType: 'diamond',
      backgroundType: 'solid',
      backgroundColor: '#06b6d4'  // 고급스러운 시안색
    }
  },
  
  // 🔶 기본 사각형 - 안정감과 구조를 표현
  {
    id: 'rectangle',
    name: '사각형',
    properties: {
      shapeType: 'rectangle',
      backgroundType: 'solid',
      backgroundColor: '#8b5cf6'  // 창의적인 보라색
    }
  }
];
