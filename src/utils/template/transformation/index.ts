/**
 * 🔄 transformation/index.ts - 템플릿 데이터 변환 통합 익스포트
 * 
 * 템플릿 데이터 변환 관련 모든 기능의 통합 엔트리 포인트입니다.
 * Template과 UnifiedProjectData 간의 양방향 변환을 제공합니다.
 */

// 타입 정의
export type { Template } from './types';

// 데이터 변환 함수들
export {
  templateToUnifiedData,
  unifiedDataToTemplate
} from './dataConverter';