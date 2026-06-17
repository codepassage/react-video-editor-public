/**
 * 🔧 utils/index.ts - 템플릿 유틸리티 함수 통합 익스포트
 * 
 * 템플릿 관련 순수 함수들의 통합 엔트리 포인트입니다.
 * 검증, 계산, 미리보기 생성 등의 기능을 제공합니다.
 */

// 검증 함수들
export {
  validateTemplateName,
  validateProjectForTemplate
} from './validation';

// 계산 함수들
export {
  calculateTemplateDuration,
  adjustTemplateStartTime
} from './calculations';

// 미리보기 함수들
export {
  generateTemplatePreview,
  type TemplatePreview
} from './preview';

// 재생시간 자동 조정 함수들 (표준 방식)
export {
  calculateMaxEndTime,
  calculateMaxEndTimeFromClips,
  calculateStandardDuration,
  calculateStandardDurationFromClips,
  autoAdjustDurationForTemplate,
  autoAdjustDurationAfterTemplateLoad
} from './durationUtils';