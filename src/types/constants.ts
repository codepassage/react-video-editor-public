/**
 * 📏 constants.ts - 시스템 상수 및 기본값 정의
 * 
 * React Video Editor v1에서 사용되는 모든 시스템 상수와 기본값들을
 * 중앙 집중식으로 관리하는 모듈입니다.
 * 
 * 🎯 주요 영역:
 * - 타임라인 UI 기본 설정 (높이, 줌, 클립 최소 길이)
 * - 레이어 시스템 z-index 관리
 * - 기본 트랙명 및 텍스트 스타일 프리셋
 * - 렌더링 설정 (FPS 등)
 * - 계산 유틸리티 함수
 * 
 * 🏗️ 시스템 구조:
 * ```
 * Constants
 * ├── UI Constants (높이, 줌 등)
 * ├── Layer System (z-index 관리)
 * ├── Default Names (트랙명)
 * ├── Text Presets (스타일 프리셋)
 * └── Utility Functions (계산 함수)
 * ```
 * 
 * 🔧 사용 목적:
 * - 일관된 UI 경험 제공
 * - 성능 최적화를 위한 기준값 설정
 * - 유지보수성 향상 (중앙 집중식 관리)
 * - 다국화 및 테마 시스템 지원
 * - 사용자 커스터마이징 기준점 제공
 * 
 * 🎨 디자인 시스템:
 * - 일관된 간격 및 크기 체계
 * - 접근성을 고려한 최소값 설정
 * - 반응형 UI를 위한 유연한 기준값
 * - 프로페셔널 워크플로우 지원
 * 
 * 🔗 연관 모듈:
 * - Timeline System: UI 레이아웃 및 렌더링
 * - Track System: 트랙 생성 및 관리
 * - Layer System: 클립 중첩 순서 관리
 * - Text System: 텍스트 스타일링
 * - Rendering Engine: 출력 품질 설정
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */

// === 기본 UI 상수들 === //

/** 
 * 타임라인 트랙의 기본 높이 (픽셀)
 * @description 각 트랙의 표준 높이로, UI 일관성과 가독성을 위해 설정됩니다.
 */
export const DEFAULT_TRACK_HEIGHT = 80;

/** 
 * 클립의 최소 허용 길이 (초)
 * @description 사용자 경험과 렌더링 성능을 위한 최소 클립 길이입니다.
 * 이보다 짧은 클립은 자동으로 이 값으로 조정됩니다.
 */
export const MIN_CLIP_DURATION = 0.1;

/** 
 * 타임라인의 기본 줌 레벨 (픽셀/초)
 * @description 타임라인 초기 로드 시 적용되는 줌 배율입니다.
 * 값이 클수록 더 확대된 상태로 표시됩니다.
 */
export const DEFAULT_ZOOM = 100;

/** 
 * 비디오 렌더링 프레임률 (FPS)
 * @description 출력 비디오의 표준 프레임률입니다.
 * 30fps는 대부분의 온라인 플랫폼에서 권장하는 표준값입니다.
 */
export const FPS = 30;

// === 레이어 시스템 z-index 관리 상수 === //

/** 
 * 레이어 시스템의 기준 z-index 값
 * @description 모든 클립과 트랙의 z-index 계산의 시작점입니다.
 */
export const LAYER_BASE_Z_INDEX = 0;

/** 
 * 트랙 간 z-index 간격
 * @description 각 트랙 사이의 z-index 차이로, 트랙 간 명확한 계층 구조를 보장합니다.
 * 큰 값으로 설정하여 트랙 내 클립들이 다른 트랙과 겹치지 않도록 합니다.
 */
export const LAYER_Z_INDEX_STEP = 100;

/** 
 * 같은 트랙 내 클립 간 z-index 간격
 * @description 동일 트랙 내에서 클립들의 중첩 순서를 관리하는 간격입니다.
 * 작은 값으로 설정하여 세밀한 순서 조정이 가능합니다.
 */
export const CLIP_Z_INDEX_STEP = 1;

// === 기본 트랙명 프리셋 === //

/**
 * 새 프로젝트 생성 시 사용되는 기본 트랙명 배열
 * @description 사용자에게 친숙하고 직관적인 트랙명들을 제공합니다.
 * 각 트랙의 용도를 암시하는 명명 규칙을 따릅니다.
 */
export const DEFAULT_TRACK_NAMES = [
  'Track 1',      // 첫 번째 트랙 (위쪽) - 주요 콘텐츠용
  'Track 2',      // 두 번째 트랙 - 보조 콘텐츠용
  'Base Track 1', // 세 번째 트랙 - 기준 클립용 (앵커 시스템)
  'Background 1'  // 네 번째 트랙 (아래쪽) - 배경 요소용
];

// === 텍스트 스타일 프리셋 시스템 === //

/**
 * 텍스트 스타일 프리셋 인터페이스
 * 
 * @interface TextStylePreset
 * @description 재사용 가능한 텍스트 스타일 설정을 정의하는 인터페이스입니다.
 * 일관된 타이포그래피와 빠른 스타일 적용을 위해 사용됩니다.
 */
export interface TextStylePreset {
  /** 프리셋의 고유 식별자 */
  id: string;
  
  /** 사용자에게 표시될 프리셋 이름 */
  name: string;
  
  /** 폰트 크기 (픽셀) */
  fontSize: number;
  
  /** 폰트 패밀리 (CSS font-family 형식) */
  fontFamily: string;
  
  /** 폰트 굵기 (normal, bold, 100-900) */
  fontWeight: string;
  
  /** 텍스트 색상 (hex 또는 CSS 색상값) */
  color: string;
  
  /** 배경 색상 (선택적, 투명도 포함 가능) */
  backgroundColor?: string;
  
  /** 텍스트 정렬 방식 */
  textAlign: 'left' | 'center' | 'right';
}

/**
 * 기본 텍스트 스타일 프리셋 배열
 * 
 * @constant DEFAULT_TEXT_PRESETS
 * @description 사용자가 빠르게 적용할 수 있는 사전 정의된 텍스트 스타일들입니다.
 * 제목, 부제목, 본문 등 일반적인 용도에 최적화된 스타일을 제공합니다.
 * 
 * 💡 사용 예시:
 * ```typescript
 * // 제목 스타일 적용
 * const titleStyle = DEFAULT_TEXT_PRESETS.find(preset => preset.id === 'title');
 * applyTextStyle(textClip, titleStyle);
 * 
 * // 프리셋 선택 UI 생성
 * const presetOptions = DEFAULT_TEXT_PRESETS.map(preset => ({
 *   value: preset.id,
 *   label: preset.name
 * }));
 * ```
 */
export const DEFAULT_TEXT_PRESETS: TextStylePreset[] = [
  {
    id: 'title',
    name: '제목',
    fontSize: 48,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center'
  },
  {
    id: 'subtitle',
    name: '부제목',
    fontSize: 32,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    color: '#333333',
    textAlign: 'center'
  },
  {
    id: 'body',
    name: '본문',
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'left'
  }
];

// === 레이어 계산 유틸리티 함수 === //

/**
 * 클립의 z-index 값을 계산하는 함수
 * 
 * @function calculateClipZIndex
 * @param trackIndex - 트랙의 인덱스 (0부터 시작)
 * @param clipIndex - 트랙 내에서 클립의 인덱스
 * @param totalTracks - 전체 트랙 수 (선택적, 더 정확한 계산용)
 * @returns 계산된 z-index 값
 * 
 * @description
 * 타임라인에서 클립들의 시각적 레이어 순서를 결정하는 z-index를 계산합니다.
 * 위쪽 트랙(낮은 인덱스)이 더 높은 z-index를 가져 앞에 표시됩니다.
 * 
 * 📊 계산 방식:
 * - 트랙별 기본 z-index + 클립별 오프셋
 * - 위쪽 트랙일수록 높은 z-index
 * - 같은 트랙 내에서는 뒤쪽 클립이 앞에 표시
 */
export const calculateClipZIndex = (
  trackIndex: number,
  clipIndex: number,
  totalTracks?: number
): number => {
  // 위 트랙(인덱스 0)이 가장 앞에, 아래 트랙이 가장 뒤에
  // trackIndex가 작을수록 더 높은 z-index
  const reversedTrackIndex = totalTracks ? (totalTracks - 1 - trackIndex) : (999 - trackIndex);
  return LAYER_BASE_Z_INDEX + (reversedTrackIndex * LAYER_Z_INDEX_STEP) + (clipIndex * CLIP_Z_INDEX_STEP);
};

/**
 * 트랙의 레이어 순서 번호를 계산하는 함수 (UI 표시용)
 * 
 * @function getTrackLayerNumber
 * @param trackIndex - 트랙의 배열 인덱스
 * @param totalTracks - 전체 트랙 수
 * @returns UI에 표시할 레이어 번호 (1부터 시작)
 * 
 * @description
 * 사용자에게 표시할 트랙의 레이어 번호를 계산합니다.
 * 위쪽 트랙이 레이어 1, 아래쪽으로 갈수록 숫자가 증가합니다.
 * 
 * 💡 사용 예시:
 * ```typescript
 * const layerNumber = getTrackLayerNumber(0, 4); // 결과: 4 (최상위 레이어)
 * const layerNumber = getTrackLayerNumber(3, 4); // 결과: 1 (최하위 레이어)
 * ```
 */
export const getTrackLayerNumber = (trackIndex: number, totalTracks: number): number => {
  // UI에서는 위쪽 트랙이 레이어 1, 아래쪽이 높은 숫자
  return totalTracks - trackIndex;
};

/**
 * 새 트랙 생성 시 기본 이름을 생성하는 함수
 * 
 * @function getDefaultTrackName
 * @param trackIndex - 생성할 트랙의 인덱스 (0부터 시작)
 * @returns 생성된 기본 트랙명
 * 
 * @description
 * 트랙 인덱스에 따라 적절한 기본 이름을 생성합니다.
 * 사전 정의된 이름이 있으면 사용하고, 없으면 순차적으로 생성합니다.
 * 
 * 📝 명명 규칙:
 * - 인덱스 0-3: 사전 정의된 이름 사용
 * - 인덱스 4 이상: "Track N" 형태로 생성
 * 
 * 💡 사용 예시:
 * ```typescript
 * getDefaultTrackName(0);  // "Track 1"
 * getDefaultTrackName(2);  // "Base Track 1"
 * getDefaultTrackName(5);  // "Track 6"
 * ```
 */
export const getDefaultTrackName = (trackIndex: number): string => {
  if (trackIndex < DEFAULT_TRACK_NAMES.length) {
    return DEFAULT_TRACK_NAMES[trackIndex];
  }
  // 4개를 넘어가면 "Track N" 형태로 계속 생성
  return `Track ${trackIndex + 1}`;
};
