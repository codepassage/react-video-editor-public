/**
 * 🏭 clipCreators/index.ts - 클립 생성자 메인 익스포트
 * 
 * 모든 클립 생성 함수들을 통합하여 외부에 제공합니다.
 * 기존 clipCreators.ts와 동일한 API를 유지합니다.
 */

// 공통 유틸리티
export {
  generateClipId,
  getDefaultClipName,
  applyCommonExtendedProperties,
  getDefaultEffectProperties,
  getDefaultVisualProperties,
  getDefaultAudioProperties,
  calculateEndTime
} from './utils';

// 미디어 클립 생성자들
export {
  createAudioClip,
  createVideoClip,
  createImageClip
} from './mediaClips';

// 텍스트 클립 생성자들
export {
  createTextClip,
  createSentenceClip,
  createLongSentenceClip
} from './textClips';

// 도형 클립 생성자들
export {
  createShapeClip,
  createSimpleShapeClip,
  createPolygonShapeClip
} from './shapeClips';

// 검증 함수들
export {
  validateClip
} from './validation';

// 팩토리 함수들
export {
  createClip
} from './factory';

// createSpacerClip은 메인 파일에서 처리됨 (순환 참조 방지)