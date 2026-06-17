/**
 * ✨ textEffects.ts - 전문적인 텍스트 효과 시스템
 * 
 * React Video Editor v1에서 텍스트 클립에 적용할 수 있는 다양한 시각적 효과들의
 * 타입 정의를 포함하는 모듈입니다. Photoshop 수준의 고급 텍스트 효과를 지원하며,
 * CSS, SVG, WebGL 기반의 렌더링에 최적화된 데이터 구조를 제공합니다.
 * 
 * 🎯 주요 효과 카테고리:
 * - 그라데이션: 선형/방사형/원뿔형 그라데이션 텍스트
 * - 그림자: 다중 레이어 드롭 섀도우/내부 섀도우
 * - 글로우: 외부/내부 글로우 효과
 * - 3D 베벨: 입체감을 주는 베벨/엠보스 효과
 * - 돌출: 3D 돌출 효과 (Extrude)
 * - 텍스처: 이미지 기반 텍스트 질감
 * - 스트로크: 고급 테두리 효과
 * - 애니메이션: 타이핑, 페이드, 슬라이드 등
 * - 왜곡: 웨이브, 아치, 원근감 등 변형 효과
 * 
 * 🎨 렌더링 호환성:
 * - CSS: text-shadow, background-clip, filter 등
 * - SVG: filters, gradients, paths 등
 * - Canvas: complex compositing, pixel manipulation
 * - WebGL: shader-based effects, 3D transforms
 * 
 * 📐 좌표계 및 단위:
 * - 위치: 백분율 (0-100%) 또는 픽셀 단위
 * - 각도: 도(degrees) 단위 (0-360)
 * - 투명도: 0-1 또는 0-100 범위
 * - 크기: 픽셀 또는 백분율
 * 
 * 🔧 확장성 설계:
 * - enabled 플래그로 효과별 개별 제어
 * - 효과 조합 및 레이어링 지원
 * - 실시간 미리보기 최적화
 * - 프리셋 시스템 연동 가능
 * 
 * 🎬 애니메이션 통합:
 * - Remotion 기반 애니메이션 지원
 * - 키프레임 및 이징 함수
 * - 루프 및 방향 제어
 * - 시간 기반 효과 동기화
 * 
 * 🔗 연관 모듈:
 * - 2번 모듈: Clip Type System (TextClip 타입)
 * - TextPropertiesPanel: 효과 편집 UI
 * - TextClip 렌더러: 실제 효과 적용
 * - PresetSystem: 효과 프리셋 관리
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 2.0
 */

/**
 * 그라데이션 텍스트 효과 인터페이스
 * 
 * @interface TextGradient
 * @description 텍스트에 선형, 방사형, 원뿔형 그라데이션을 적용하기 위한 설정입니다.
 * CSS background-clip과 SVG gradient를 활용하여 고품질 그라데이션 텍스트를 구현합니다.
 * 
 * 💡 사용 예시:
 * ```typescript
 * const rainbowGradient: TextGradient = {
 *   enabled: true,
 *   type: 'linear',
 *   angle: 45,
 *   stops: [
 *     { color: '#ff0000', position: 0 },
 *     { color: '#ffff00', position: 50 },
 *     { color: '#00ff00', position: 100 }
 *   ]
 * };
 * ```
 */
export interface TextGradient {
  /** 그라데이션 효과 활성화 여부 */
  enabled: boolean;
  /** 그라데이션 타입: linear(선형), radial(방사형), conic(원뿔형) */
  type: 'linear' | 'radial' | 'conic';
  /** 선형 그라데이션의 각도 (0-360도) */
  angle?: number;
  /** 방사형/원뿔형 그라데이션의 중심점 X 좌표 (0-100%) */
  centerX?: number;
  /** 방사형/원뿔형 그라데이션의 중심점 Y 좌표 (0-100%) */
  centerY?: number;
  /** 그라데이션 색상 정지점 배열 */
  stops: Array<{
    /** 색상 값 (hex, rgb, rgba 등) */
    color: string;
    /** 그라데이션에서의 위치 (0-100%) */
    position: number;
  }>;
}

/**
 * 다중 그림자 효과 인터페이스
 * 
 * @interface TextShadowEffect
 * @description 텍스트에 드롭 섀도우 또는 내부 그림자를 적용하기 위한 설정입니다.
 * 여러 개의 그림자를 레이어로 쌓아 복잡한 깊이감과 입체감을 연출할 수 있습니다.
 * 
 * 🎨 그림자 타입:
 * - drop-shadow: 외부 그림자 (CSS drop-shadow 필터)
 * - inner-shadow: 내부 그림자 (inset box-shadow)
 * 
 * 💡 사용 예시:
 * ```typescript
 * const deepShadow: TextShadowEffect = {
 *   id: 'shadow-1',
 *   enabled: true,
 *   type: 'drop-shadow',
 *   offsetX: 3,
 *   offsetY: 3,
 *   blur: 6,
 *   color: 'rgba(0, 0, 0, 0.5)',
 *   opacity: 0.8
 * };
 * ```
 */
export interface TextShadowEffect {
  /** 고유 식별자 (다중 그림자 관리용) */
  id: string;
  /** 그림자 효과 활성화 여부 */
  enabled: boolean;
  /** 그림자 타입: drop-shadow(외부), inner-shadow(내부) */
  type: 'drop-shadow' | 'inner-shadow';
  /** X축 오프셋 (픽셀) */
  offsetX: number;
  /** Y축 오프셋 (픽셀) */
  offsetY: number;
  /** 블러 반경 (픽셀) */
  blur: number;
  /** 그림자 색상 */
  color: string;
  /** 그림자 투명도 (0-1, 선택적) */
  opacity?: number;
}

/**
 * 글로우 효과 인터페이스
 * 
 * @interface TextGlowEffect
 * @description 텍스트 주변에 빛나는 효과를 적용하기 위한 설정입니다.
 * Photoshop의 Outer Glow, Inner Glow 효과와 동일한 기능을 제공합니다.
 * 
 * 🌟 글로우 타입:
 * - outer-glow: 텍스트 외부로 퍼지는 빛
 * - inner-glow: 텍스트 내부에서 빛나는 효과
 * 
 * 💡 사용 예시:
 * ```typescript
 * const neonGlow: TextGlowEffect = {
 *   enabled: true,
 *   type: 'outer-glow',
 *   color: '#00ffff',
 *   intensity: 80,
 *   spread: 20,
 *   blur: 15
 * };
 * ```
 */
export interface TextGlowEffect {
  /** 글로우 효과 활성화 여부 */
  enabled: boolean;
  /** 글로우 타입: outer-glow(외부), inner-glow(내부) */
  type: 'outer-glow' | 'inner-glow';
  /** 글로우 색상 */
  color: string;
  /** 글로우 강도 (0-100) */
  intensity: number;
  /** 글로우 확산 범위 (0-100) */
  spread: number;
  /** 글로우 블러 정도 (0-100) */
  blur: number;
}

/**
 * 3D 베벨 효과 인터페이스
 * 
 * @interface TextBevelEffect
 * @description 텍스트에 입체감을 주는 베벨 및 엠보스 효과를 적용하기 위한 설정입니다.
 * 하이라이트와 섀도우를 조합하여 3D 느낌의 텍스트를 구현합니다.
 * 
 * 🏔️ 베벨 스타일:
 * - outer-bevel: 외부 베벨 (텍스트 바깥쪽 입체감)
 * - inner-bevel: 내부 베벨 (텍스트 안쪽 입체감)
 * - emboss: 엠보스 (볼록한 느낌)
 * - pillow-emboss: 필로우 엠보스 (부드러운 볼록함)
 * 
 * 💡 사용 예시:
 * ```typescript
 * const classicBevel: TextBevelEffect = {
 *   enabled: true,
 *   style: 'outer-bevel',
 *   depth: 50,
 *   direction: 135,
 *   size: 5,
 *   soften: 2,
 *   highlightColor: '#ffffff',
 *   shadowColor: '#000000',
 *   highlightOpacity: 75,
 *   shadowOpacity: 50
 * };
 * ```
 */
export interface TextBevelEffect {
  /** 베벨 효과 활성화 여부 */
  enabled: boolean;
  /** 베벨 스타일 타입 */
  style: 'outer-bevel' | 'inner-bevel' | 'emboss' | 'pillow-emboss';
  /** 베벨 깊이 (0-100) */
  depth: number;
  /** 광원 방향 각도 (0-360도) */
  direction: number;
  /** 베벨 크기 (0-250픽셀) */
  size: number;
  /** 베벨 부드러움 정도 (0-100) */
  soften: number;
  /** 하이라이트 색상 */
  highlightColor: string;
  /** 섀도우 색상 */
  shadowColor: string;
  /** 하이라이트 투명도 (0-100) */
  highlightOpacity: number;
  /** 섀도우 투명도 (0-100) */
  shadowOpacity: number;
}

/**
 * 텍스트 돌출 효과 인터페이스 (3D Extrude)
 * 
 * @interface TextExtrudeEffect
 * @description 텍스트를 3D로 돌출시켜 입체감을 만드는 효과입니다.
 * WebGL이나 CSS 3D transform을 활용하여 텍스트에 깊이를 부여합니다.
 * 
 * 🏗️ 돌출 원리:
 * - depth: 돌출 깊이 (Z축 방향)
 * - direction: 돌출 방향 각도
 * - color: 돌출된 면의 색상
 * - opacity: 돌출 면의 투명도
 * 
 * 💡 사용 예시:
 * ```typescript
 * const extrudeText: TextExtrudeEffect = {
 *   enabled: true,
 *   depth: 20,
 *   direction: 225,
 *   color: '#666666',
 *   opacity: 80
 * };
 * ```
 */
export interface TextExtrudeEffect {
  /** 돌출 효과 활성화 여부 */
  enabled: boolean;
  /** 돌출 깊이 (0-100) */
  depth: number;
  /** 돌출 방향 각도 (0-360도) */
  direction: number;
  /** 돌출 면의 색상 */
  color: string;
  /** 돌출 면의 투명도 (0-100) */
  opacity: number;
}

/**
 * 텍스트 텍스처 효과 인터페이스
 * 
 * @interface TextTextureEffect
 * @description 이미지를 텍스트에 매핑하여 질감을 부여하는 효과입니다.
 * 다양한 블렌드 모드를 지원하여 창의적인 텍스트 표현이 가능합니다.
 * 
 * 🎨 블렌드 모드:
 * - multiply: 어둡게 합성
 * - overlay: 오버레이 합성
 * - screen: 밝게 합성
 * - soft-light: 부드러운 조명
 * - hard-light: 강한 조명
 * - color-dodge: 색상 닷지
 * - color-burn: 색상 번
 * 
 * 💡 사용 예시:
 * ```typescript
 * const marbleTexture: TextTextureEffect = {
 *   enabled: true,
 *   imageUrl: '/textures/marble.jpg',
 *   blendMode: 'overlay',
 *   opacity: 70,
 *   scale: 150,
 *   offsetX: 0,
 *   offsetY: 0
 * };
 * ```
 */
export interface TextTextureEffect {
  /** 텍스처 효과 활성화 여부 */
  enabled: boolean;
  /** 텍스처 이미지 URL */
  imageUrl: string;
  /** 블렌드 모드 */
  blendMode: 'multiply' | 'overlay' | 'screen' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn';
  /** 텍스처 투명도 (0-100) */
  opacity: number;
  /** 텍스처 크기 비율 (10-500%) */
  scale: number;
  /** 텍스처 X축 오프셋 (-100 to 100) */
  offsetX: number;
  /** 텍스처 Y축 오프셋 (-100 to 100) */
  offsetY: number;
}

/**
 * 고급 스트로크 효과 인터페이스
 * 
 * @interface TextStrokeEffect
 * @description 텍스트에 다양한 형태의 테두리를 적용하기 위한 설정입니다.
 * 스트로크에도 그라데이션을 적용할 수 있으며, 점선 등 다양한 스타일을 지원합니다.
 * 
 * 🖍️ 스트로크 타입:
 * - outer: 외부 테두리 (텍스트 바깥쪽)
 * - inner: 내부 테두리 (텍스트 안쪽)
 * - center: 중앙 테두리 (텍스트 경계선)
 * 
 * 🎨 스타일 옵션:
 * - dashArray: 점선 패턴 ("5,5", "10,2,5" 등)
 * - lineCap: 선 끝 모양 (butt, round, square)
 * - lineJoin: 선 연결 모양 (miter, round, bevel)
 * 
 * 💡 사용 예시:
 * ```typescript
 * const rainbowStroke: TextStrokeEffect = {
 *   id: 'stroke-1',
 *   enabled: true,
 *   type: 'outer',
 *   width: 3,
 *   color: '#ffffff',
 *   opacity: 100,
 *   gradient: {
 *     enabled: true,
 *     type: 'linear',
 *     angle: 45,
 *     stops: [* ... *]
 *   },
 *   lineCap: 'round',
 *   lineJoin: 'round'
 * };
 * ```
 */
export interface TextStrokeEffect {
  /** 고유 식별자 (다중 스트로크 관리용) */
  id: string;
  /** 스트로크 효과 활성화 여부 */
  enabled: boolean;
  /** 스트로크 타입: outer(외부), inner(내부), center(중앙) */
  type: 'outer' | 'inner' | 'center';
  /** 스트로크 두께 (픽셀) */
  width: number;
  /** 스트로크 색상 */
  color: string;
  /** 스트로크 투명도 (0-100) */
  opacity: number;
  /** 스트로크에 적용할 그라데이션 (선택적) */
  gradient?: TextGradient;
  /** CSS 대시 배열 (예: "5,5" 점선용) */
  dashArray?: string;
  /** 선 끝 마무리 스타일 */
  lineCap?: 'butt' | 'round' | 'square';
  /** 선 연결 스타일 */
  lineJoin?: 'miter' | 'round' | 'bevel';
}

/**
 * 텍스트 애니메이션 효과 인터페이스
 * 
 * @interface TextAnimationEffect
 * @description 텍스트에 다양한 애니메이션 효과를 적용하기 위한 설정입니다.
 * Remotion과 연동되어 시간 기반 애니메이션을 제공하며, 이징 함수와 루프 옵션을 지원합니다.
 * 
 * 🎥 애니메이션 타입:
 * - typing: 타이핑 효과 (글자 하나씩 나타나기)
 * - fade-in: 서서히 나타나기
 * - slide-in: 슬라이드 인 (방향 지정 가능)
 * - bounce: 탄성 효과
 * - pulse: 맥동 효과
 * - glow-pulse: 글로우 맥동
 * - color-shift: 색상 변화
 * - wave: 리드미컬 웨이브
 * 
 * ⏱️ 시간 제어:
 * - duration: 애니메이션 지속 시간
 * - delay: 애니메이션 시작 지연
 * - easing: 이징 함수 (가속도 곡선)
 * - loop: 루프 재생 여부
 * - direction: 재생 방향
 * 
 * 💡 사용 예시:
 * ```typescript
 * const typewriterEffect: TextAnimationEffect = {
 *   enabled: true,
 *   type: 'typing',
 *   duration: 2000,
 *   delay: 500,
 *   easing: 'ease-out',
 *   loop: false,
 *   typingSpeed: 15
 * };
 * 
 * const colorShiftEffect: TextAnimationEffect = {
 *   enabled: true,
 *   type: 'color-shift',
 *   duration: 3000,
 *   delay: 0,
 *   easing: 'ease-in-out',
 *   loop: true,
 *   direction: 'alternate',
 *   colorSequence: ['#ff0000', '#00ff00', '#0000ff']
 * };
 * ```
 */
export interface TextAnimationEffect {
  /** 애니메이션 효과 활성화 여부 */
  enabled: boolean;
  /** 애니메이션 타입 */
  type: 'typing' | 'fade-in' | 'slide-in' | 'bounce' | 'pulse' | 'glow-pulse' | 'color-shift' | 'wave';
  /** 애니메이션 지속 시간 (밀리초) */
  duration: number;
  /** 애니메이션 시작 지연 (밀리초) */
  delay: number;
  /** 이징 함수 (가속도 곡선) */
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  /** 루프 재생 여부 */
  loop: boolean;
  /** 재생 방향 (선택적) */
  direction?: 'normal' | 'reverse' | 'alternate';
  /** 타이핑 속도 (초당 글자 수, 타이핑 애니메이션용) */
  typingSpeed?: number;
  /** 슬라이드 방향 (슬라이드 애니메이션용) */
  slideDirection?: 'up' | 'down' | 'left' | 'right';
  /** 슬라이드 이동 거리 (픽셀, 슬라이드 애니메이션용) */
  slideDistance?: number;
  /** 색상 시퀀스 배열 (색상 변화 애니메이션용) */
  colorSequence?: string[];
}

/**
 * 텍스트 왜곡 효과 인터페이스
 * 
 * @interface TextDistortionEffect
 * @description 텍스트를 다양한 방식으로 변형하여 독특한 시각적 효과를 만드는 설정입니다.
 * CSS transforms, SVG filters, 또는 WebGL 새이더를 활용하여 고급 변형 효과를 구현합니다.
 * 
 * 🌊 왜곡 타입:
 * - wave: 웨이브 효과 (물결 모양)
 * - arch: 아치 효과 (호 모양 변형)
 * - bulge: 볼록 효과 (돌출 변형)
 * - fisheye: 어안 렌즈 효과
 * - perspective: 원근법 효과
 * 
 * ⚙️ 변형 매개변수:
 * - intensity: 효과 강도 (0-100)
 * - frequency: 웨이브 빈도 (웨이브 효과용)
 * - angle: 원근법 각도 (원근법 효과용)
 * 
 * 💡 사용 예시:
 * ```typescript
 * const waveEffect: TextDistortionEffect = {
 *   enabled: true,
 *   type: 'wave',
 *   intensity: 30,
 *   frequency: 2
 * };
 * 
 * const perspectiveEffect: TextDistortionEffect = {
 *   enabled: true,
 *   type: 'perspective',
 *   intensity: 45,
 *   angle: 25
 * };
 * ```
 */
export interface TextDistortionEffect {
  /** 왜곡 효과 활성화 여부 */
  enabled: boolean;
  /** 왜곡 타입 */
  type: 'wave' | 'arch' | 'bulge' | 'fisheye' | 'perspective';
  /** 효과 강도 (0-100) */
  intensity: number;
  /** 웨이브 빈도 (웨이브 효과용, 선택적) */
  frequency?: number;
  /** 원근법 각도 (원근법 효과용, 선택적) */
  angle?: number;
}
