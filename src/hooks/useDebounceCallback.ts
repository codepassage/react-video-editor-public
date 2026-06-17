/**
 * ⏱️ useDebounceCallback.ts - 디바운싱 콜백 최적화 훅
 * 
 * 빈번한 함수 호출을 지연시켜 성능을 최적화하는 커스텀 훅입니다.
 * 사용자 입력이나 빠른 상태 변경이 있을 때 React 렌더링 충돌을
 * 방지하고 전체적인 UI 응답성을 향상시킵니다.
 * 
 * 주요 기능:
 * - 빠른 연속 호출을 단일 호출로 축소
 * - 지연 시간 동안 새 호출이 있으면 이전 타이머 취소
 * - 제네릭 타입 지원으로 모든 함수 시그니처에 사용 가능
 * - 의존성 배열을 통한 자동 메모이제이션
 * - 메모리 누수 방지를 위한 타이머 정리
 * 
 * 사용 예시:
 * - 검색 입력 필드의 빠른 타이핑
 * - 슬라이더나 리사이지 중 연속 이벤트
 * - 그라데이션 또는 색상 픽커 업데이트
 * - 텍스트 에디터의 자동 저장 기능
 * - API 호출 빈도 제한
 * 
 * 성능 이점:
 * - 불필요한 렌더링 및 API 호출 방지
 * - CPU 사용량 및 네트워크 대역폭 절약
 * - 사용자 인터페이스 반응성 향상
 * - 브라우저 주요 스레드 블로킹 방지
 * 
 * 기술적 내용:
 * - useRef로 타이머 상태 유지 (렌더링 간 유지)
 * - useCallback으로 함수 메모이제이션
 * - clearTimeout으로 안전한 타이머 정리
 * - 제네릭 타입 지원으로 타입 안전성 보장
 * 
 * 관련 모듈:
 * - UI 컴포넌트: 빠른 인터랙션 최적화
 * - 8번 모듈: State Management (상태 업데이트 최적화)
 * - 미디어 컴포넌트: 리사이징 및 업로드 최적화
 */
import { useCallback, useRef } from 'react';

/**
 * 🔧 디바운싱 콜백 훅 - 그라데이션 업데이트 최적화용
 * 빈번한 상태 업데이트를 지연시켜 React 렌더링 충돌 방지
 * 
 * @param callback 실행할 함수
 * @param delay 지연 시간 (ms)
 * @returns 디바운싱된 함수
 */
/**
 * useDebounceCallback 훅 - 지연 실행 함수 생성기
 * 
 * 주요 책임:
 * 1. 빠른 연속 호출을 단일 호출로 축소
 * 2. 지연 시간 동안 대기 후 최마지막 호출만 실행
 * 3. 이전 타이머 자동 취소 및 리소스 정리
 * 4. 제네릭 타입으로 모든 함수 시그니처 지원
 * 
 * 매개변수:
 * - T: 함수 인수 타입 배열
 * - callback: 지연 실행할 원본 함수
 * - delay: 지연 시간 (밀리초)
 * 
 * 반환값:
 * - 디바운싱된 함수 (인수 전달 지원)
 * 
 * 동작 원리:
 * - setTimeout으로 지연 실행 예약
 * - 새 호출 시 clearTimeout으로 이전 예약 취소
 * - 최마지막 호출만 지연 시간 후 실행
 */
export const useDebounceCallback = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
): ((...args: T) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: T) => {
    // 기존 타이머 제거
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 새 타이머 설정
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};
