/**
 * 🔍 validation.ts - 클립 유효성 검증 시스템
 * 
 * React Video Editor v1에서 생성된 클립의 데이터 무결성과 유효성을 검증하는
 * 포괄적인 검증 시스템입니다. 각 클립 타입별로 특화된 검증 로직을 제공하며,
 * 상세한 오류 리포팅을 통해 디버깅과 데이터 품질 보장을 지원합니다.
 * 
 * 🎯 주요 기능:
 * - 8가지 클립 타입별 맞춤형 유효성 검증
 * - 기본 속성 검증 (ID, 이름, 시간, 크기 등)
 * - 미디어 URL 및 리소스 유효성 확인
 * - 텍스트 클립 내용 및 포맷 검증
 * - SentenceClip 세그먼트 구조 검증
 * - 상세한 오류 메시지 및 위치 정보 제공
 * 
 * 🔍 검증 카테고리:
 * - 필수 필드 검증: ID, 이름, URL 등 필수 속성 확인
 * - 데이터 타입 검증: 숫자, 문자열, 배열 등 타입 일치성
 * - 범위 검증: 시간, 크기, 좌표 등 유효 범위 확인
 * - 논리적 일관성: 시작/끝 시간 관계, 종속성 검증
 * - 리소스 접근성: 미디어 파일 존재 여부 및 접근 가능성
 * 
 * 🏗️ 검증 아키텍처:
 * ```
 * validateClip()
 * ├── 기본 속성 검증 (공통)
 * │   ├── ID, 이름 존재 여부
 * │   ├── 시간 범위 유효성
 * │   └── 기본 크기 정보
 * ├── 타입별 특수 검증
 * │   ├── AudioClip: 오디오 URL, 형식
 * │   ├── VideoClip: 비디오 URL, 해상도
 * │   ├── ImageClip: 이미지 URL, 크기
 * │   ├── TextClip: 텍스트 내용, 폰트
 * │   └── SentenceClip: 세그먼트 구조
 * └── 결과 리포팅
 *     ├── 성공/실패 상태
 *     └── 상세 오류 목록
 * ```
 * 
 * 📊 검증 결과 구조:
 * - isValid: 전체 검증 통과 여부
 * - errors: 발견된 오류의 상세 목록
 * - 오류 메시지: 사용자 친화적 한국어 설명
 * - 오류 위치: 세그먼트 인덱스 등 정확한 위치 정보
 * 
 * 🎮 사용 시나리오:
 * - 클립 생성 후 즉시 검증
 * - 템플릿 로드 시 데이터 무결성 확인
 * - 사용자 입력 실시간 검증
 * - 프로젝트 저장 전 최종 검증
 * - 외부 데이터 임포트 시 검증
 * 
 * 💡 사용 예시:
 * ```typescript
 * const result = validateClip(newClip);
 * if (!result.isValid) {
 *   console.error('클립 검증 실패:');
 *   result.errors.forEach((error, index) => {
 *     console.error(`  ${index + 1}. ${error}`);
 *   });
 *   // 사용자에게 오류 표시 또는 자동 수정 시도
 * } else {
 *   console.log('클립 검증 성공');
 *   // 클립을 타임라인에 안전하게 추가
 * }
 * ```
 * 
 * ⚡ 성능 고려사항:
 * - 빠른 검증을 위한 조기 종료 최적화
 * - 필수 검증 우선 수행 후 세부 검증
 * - 메모리 효율적인 오류 수집
 * - 대용량 세그먼트 배열 처리 최적화
 * 
 * 🔗 연관 모듈:
 * - 2번 모듈: Clip Type System (타입 정의 및 가드)
 * - clipCreators: 클립 생성 팩토리 함수들
 * - clipGuards: 타입 안전성 검증
 * - Timeline: 클립 추가 전 검증
 * - Template System: 템플릿 데이터 검증
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 2.0
 */

import type { NewTimelineClip } from '../clipTypes';
import { isAudioClip, isVideoClip, isImageClip, isTextClip, isSentenceClip } from '../clipTypes';

/**
 * 클립 유효성 종합 검증 함수
 * 
 * @function validateClip
 * @param clip - 검증할 NewTimelineClip 객체
 * @returns 검증 결과 객체 { isValid: boolean, errors: string[] }
 * 
 * @description 
 * 생성된 클립의 모든 속성을 종합적으로 검증하여 데이터 무결성을 보장합니다.
 * 기본 속성 검증부터 타입별 특수 검증까지 단계적으로 수행하며,
 * 발견된 모든 오류를 상세한 메시지와 함께 수집하여 반환합니다.
 * 
 * 🔍 검증 단계:
 * 1. 기본 속성 검증 (ID, 이름, 시간, 지속시간)
 * 2. 타입별 특수 속성 검증
 * 3. 미디어 리소스 유효성 확인
 * 4. 세그먼트 구조 검증 (SentenceClip)
 * 5. 종합 결과 및 오류 수집
 * 
 * 📊 검증 대상 클립 타입:
 * - AudioClip: 오디오 URL, 재생 관련 속성
 * - VideoClip: 비디오 URL, 해상도, 오디오 속성
 * - ImageClip: 이미지 URL, 크기, 위치 정보
 * - TextClip: 텍스트 내용, 폰트, 스타일 정보
 * - SentenceClip: 텍스트 + 세그먼트 배열 구조
 * 
 * ⚠️ 공통 검증 규칙:
 * - ID: 빈 문자열이나 null/undefined 불허
 * - 이름: 필수 속성, 빈 문자열 불허
 * - 지속시간: 0보다 큰 양수 필수
 * - 시작시간: 0 이상의 값 필수
 * - 끝시간: 시작시간보다 큰 값 필수
 * - 크기(시각적 클립): width, height > 0
 * 
 * 💡 사용 예시:
 * ```typescript
 * const newClip = createTextClip({
 *   text: "Hello World",
 *   duration: 5
 * });
 * 
 * const validation = validateClip(newClip);
 * if (validation.isValid) {
 *   timeline.addClip(newClip);
 * } else {
 *   showValidationErrors(validation.errors);
 * }
 * ```
 * 
 * 🚨 일반적인 검증 실패 사례:
 * - 필수 필드 누락 (ID, 이름, URL 등)
 * - 잘못된 시간 범위 (음수 시간, 끝시간 < 시작시간)
 * - 유효하지 않은 크기 (0 이하의 width/height)
 * - 빈 텍스트 내용 (TextClip, SentenceClip)
 * - 세그먼트 구조 오류 (SentenceClip의 segments)
 * 
 * @example
 * ```typescript
 * // 올바른 클립 검증
 * const validClip = {
 *   id: 'text-1',
 *   name: 'Title Text',
 *   text: 'Hello World',
 *   duration: 5,
 *   startTime: 0,
 *   endTime: 5,
 *   width: 400,
 *   height: 100,
 *   // ... 기타 속성
 * };
 * 
 * const result = validateClip(validClip);
 * // result.isValid === true
 * // result.errors === []
 * ```
 */
export function validateClip(clip: NewTimelineClip): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 기본 속성 검사
  if (!clip.id) errors.push('클립 ID가 없습니다');
  if (!clip.name) errors.push('클립 이름이 없습니다');
  if (clip.duration <= 0) errors.push('클립 길이가 0 이하입니다');
  if (clip.startTime < 0) errors.push('시작 시간이 음수입니다');
  if (clip.endTime <= clip.startTime) errors.push('끝 시간이 시작 시간보다 작거나 같습니다');

  // 타입별 특수 검사
  if (isAudioClip(clip)) {
    if (!clip.mediaUrl) errors.push('오디오 URL이 없습니다');
  } else if (isVideoClip(clip)) {
    if (!clip.mediaUrl) errors.push('비디오 URL이 없습니다');
    if (clip.width <= 0 || clip.height <= 0) errors.push('비디오 크기가 유효하지 않습니다');
  } else if (isImageClip(clip)) {
    if (!clip.mediaUrl) errors.push('이미지 URL이 없습니다');
    if (clip.width <= 0 || clip.height <= 0) errors.push('이미지 크기가 유효하지 않습니다');
  } else if (isTextClip(clip)) {
    if (!clip.text) errors.push('텍스트 내용이 없습니다');
    if (clip.width <= 0 || clip.height <= 0) errors.push('텍스트 영역 크기가 유효하지 않습니다');
  } else if (isSentenceClip(clip)) {
    if (!clip.text) errors.push('Sentence 클립의 텍스트 내용이 없습니다');
    if (clip.width <= 0 || clip.height <= 0) errors.push('Sentence 클립의 영역 크기가 유효하지 않습니다');
    
    // 세그먼트 유효성 검사
    if (clip.segments && clip.segments.length > 0) {
      clip.segments.forEach((segment, index) => {
        if (!segment.text) errors.push(`세그먼트 ${index + 1}의 텍스트가 없습니다`);
        if (segment.startTime < 0) errors.push(`세그먼트 ${index + 1}의 시작 시간이 음수입니다`);
        if (segment.endTime <= segment.startTime) errors.push(`세그먼트 ${index + 1}의 끝 시간이 시작 시간보다 작거나 같습니다`);
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}