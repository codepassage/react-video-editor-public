/**
 * 🔍 validation.ts - 템플릿 검증 순수 함수들
 * 
 * 템플릿 이름과 프로젝트 데이터의 유효성을 검증하는 순수 함수들입니다.
 * 부작용이 없고 예측 가능한 결과를 반환하여 테스트하기 쉽습니다.
 * 
 * 주요 기능:
 * - 템플릿 이름 형식 검증
 * - 프로젝트 데이터 완성도 검증
 * - 일관된 에러 메시지 제공
 */

import type { TimelineTrack } from '../../../types';

/**
 * 템플릿 이름의 유효성을 검증합니다
 * 
 * @param name 검증할 템플릿 이름
 * @returns 검증 결과와 에러 메시지
 */
export const validateTemplateName = (name: string): { isValid: boolean; message?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: '템플릿 이름을 입력해주세요.' };
  }

  if (name.length > 100) {
    return { isValid: false, message: '템플릿 이름은 100자 이하로 입력해주세요.' };
  }

  if (!/^[a-zA-Z0-9가-힣\s\-_]+$/.test(name)) {
    return { isValid: false, message: '템플릿 이름에는 문자, 숫자, 공백, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.' };
  }

  return { isValid: true };
};

/**
 * 프로젝트가 템플릿으로 저장 가능한지 검증합니다
 * 
 * @param tracks 검증할 타임라인 트랙들
 * @returns 검증 결과와 에러 메시지
 */
export const validateProjectForTemplate = (
  tracks: TimelineTrack[]
): { isValid: boolean; message?: string } => {
  const totalClips = tracks.reduce((sum, track) => sum + track.clips.length, 0);

  if (totalClips === 0) {
    return { isValid: false, message: '템플릿으로 저장할 클립이 없습니다. 타임라인에 미디어를 추가해주세요.' };
  }

  if (tracks.length === 0) {
    return { isValid: false, message: '트랙이 없습니다.' };
  }

  return { isValid: true };
};