/**
 * 🏭 clipCreators.ts - 리팩토링된 클립 생성 팩토리 함수들
 * 
 * 이 파일은 리팩토링되어 여러 모듈로 분리되었습니다.
 * 하위 호환성을 위해 모든 기능을 재수출합니다.
 * 
 * 새로운 구조:
 * - clipCreators/utils.ts: 공통 유틸리티
 * - clipCreators/mediaClips.ts: 미디어 클립 생성자들
 * - clipCreators/textClips.ts: 텍스트 클립 생성자들
 * - clipCreators/shapeClips.ts: 도형 클립 생성자들 (예정)
 * - clipCreators/factory.ts: 팩토리 및 검증 (예정)
 */

// 모든 함수를 새로운 모듈에서 재수출
export * from './clipCreators/index';

// 임시로 기존 함수들 중 아직 리팩토링되지 않은 함수들을 직접 정의
// TODO: 이후 적절한 모듈로 이동

import { SpacerClip } from './clipTypes';
import { generateClipId, getDefaultClipName, calculateEndTime } from './clipCreators/utils';

/**
 * ⏸️ Spacer 클립 생성
 * - 화면에 표시되지 않음
 * - 오디오 출력 없음
 * - 타임라인에서 시간만 차지
 */
export function createSpacerClip(params: {
  mediaId: string;
  trackId: string;
  startTime: number;
  duration: number;
  name?: string;
  description?: string;
  label?: string;
  displayColor?: string;
  id?: string;
}): SpacerClip {
  const endTime = calculateEndTime(params.startTime, params.duration);

  return {
    // 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('spacer', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'spacer',
    
    // Spacer 전용 속성
    description: params.description || '',
    label: params.label || '',
    displayColor: params.displayColor || '#888888',
  };
}