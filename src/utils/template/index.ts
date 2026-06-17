/**
 * 🎯 template/index.ts - 템플릿 유틸리티 메인 익스포트
 * 
 * 리팩토링된 템플릿 유틸리티 시스템의 메인 엔트리 포인트입니다.
 * 모든 템플릿 관련 기능을 통합하여 제공하며 하위 호환성을 보장합니다.
 * 
 * 구조:
 * - utils/: 순수 함수들 (검증, 계산, 미리보기)
 * - transformation/: 데이터 변환 함수들
 * - api/: HTTP API 관련 함수들 (향후 추가)
 * - loading/: 템플릿 로딩 관련 함수들 (향후 추가)
 * - merging/: 트랙 병합 관련 함수들 (향후 추가)
 */

// 유틸리티 함수들 (순수 함수)
export {
  validateTemplateName,
  validateProjectForTemplate,
  calculateTemplateDuration,
  adjustTemplateStartTime,
  generateTemplatePreview,
  type TemplatePreview,
  calculateMaxEndTime,
  calculateMaxEndTimeFromClips,
  calculateStandardDuration,
  calculateStandardDurationFromClips,
  autoAdjustDurationForTemplate,
  autoAdjustDurationAfterTemplateLoad
} from './utils';

// 데이터 변환 함수들
export {
  templateToUnifiedData,
  unifiedDataToTemplate,
  type Template
} from './transformation';