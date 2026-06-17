/**
 * ⏰ useNonBlockingTimeUpdate.ts - 비차단 시간 업데이트 훅
 * 
 * 비디오 플레이어의 재생을 방해하지 않으면서 UI를 업데이트하는
 * 비동기 시간 업데이트 시스템입니다. Remotion Player와 같이 높은 성능이
 * 요구되는 컴포넌트에서 동기 상태 업데이트로 인한 성능 저하를 방지합니다.
 * 
 * 주요 기능:
 * - queueMicrotask를 사용한 고성능 비동기 업데이트
 * - 중복 업데이트 방지를 위한 예약 시스템
 * - 대기 중인 업데이트 관리 및 업데이트 상태 추적
 * - Player 렌더링 사이클과 분리된 비동기 업데이트
 * - 메모리 효율적인 레퍼런스 기반 상태 관리
 * 
 * 성능 최적화 전략:
 * 1. queueMicrotask: 가장 빠른 비동기 실행
 * 2. setTimeout 0: 더 안전한 비동기 실행 (대체안)
 * 3. 예약 시스템: 동시 요청 중복 방지
 * 4. pending 처리: 대기 중인 값들의 최신 값 유지
 * 
 * 사용 예시:
 * - 비디오 플레이어의 시간 표시 업데이트
 * - 타임라인 스크러버의 실시간 업데이트
 * - 다른 UI 컴포넌트와 동기화
 * - 고주파 데이터 스트림 처리
 * 
 * 대체 전략:
 * - setTimeout 0: queueMicrotask가 지원되지 않는 경우
 * - requestAnimationFrame: 대용량 애니메이션이 필요한 경우
 * - 직접 업데이트: 성능보다 데이터 일관성이 중요한 경우
 * 
 * 관련 모듈:
 * - 7번 모듈: Remotion Integration (플레이어 성능 최적화)
 * - 1번 모듈: Timeline System (타임라인 동기화)
 * - 8번 모듈: State Management (상태 업데이트 최적화)
 */
import { useRef, useCallback } from 'react';

/**
 * Player 재생을 방해하지 않는 비동기 시간 업데이트 hook
 * 전략: 500ms 간격으로 UI 업데이트하여 Player 방해 최소화
 */
/**
 * useNonBlockingTimeUpdate 훅 - 비차단 시간 업데이트 관리
 * 
 * 주요 책임:
 * 1. 비동기 시간 업데이트 예약 및 실행
 * 2. 중복 업데이트 방지 및 성능 최적화
 * 3. 대기 중인 업데이트 값 관리
 * 4. Player 렌더링과 분리된 비동기 실행
 * 
 * 매개변수:
 * - setCurrentTime: 시간 업데이트 콜백 함수
 * 
 * 반환값:
 * - updateTimeNonBlocking: 비차단 시간 업데이트 함수
 * 
 * 내부 상태:
 * - lastUpdateTimeRef: 마지막 업데이트된 시간
 * - pendingTimeRef: 대기 중인 업데이트 시간
 * - updateScheduledRef: 업데이트 예약 상태
 */
export const useNonBlockingTimeUpdate = (setCurrentTime: (time: number) => void) => {
  const lastUpdateTimeRef = useRef(0);
  const pendingTimeRef = useRef<number | null>(null);
  const updateScheduledRef = useRef(false);

  const scheduleUpdate = useCallback(() => {
    if (updateScheduledRef.current || pendingTimeRef.current === null) {
      return;
    }

    updateScheduledRef.current = true;

    // 🎯 전략 1: queueMicrotask (가장 빠른 비동기)
    queueMicrotask(() => {
      if (pendingTimeRef.current !== null) {
        setCurrentTime(pendingTimeRef.current);
        lastUpdateTimeRef.current = pendingTimeRef.current;
        pendingTimeRef.current = null;
      }
      updateScheduledRef.current = false;
    });

    // 🎯 전략 2: setTimeout 0 (더 안전한 비동기)
    // setTimeout(() => {
    //   if (pendingTimeRef.current !== null) {
    //     setCurrentTime(pendingTimeRef.current);
    //     lastUpdateTimeRef.current = pendingTimeRef.current;
    //     pendingTimeRef.current = null;
    //   }
    //   updateScheduledRef.current = false;
    // }, 0);

    // 🎯 전략 3: requestIdleCallback (브라우저 유휴 시간 활용)
    // if ('requestIdleCallback' in window) {
    //   requestIdleCallback(() => {
    //     if (pendingTimeRef.current !== null) {
    //       setCurrentTime(pendingTimeRef.current);
    //       lastUpdateTimeRef.current = pendingTimeRef.current;
    //       pendingTimeRef.current = null;
    //     }
    //     updateScheduledRef.current = false;
    //   });
    // } else {
    //   setTimeout(/* fallback */, 0);
    // }
  }, [setCurrentTime]);

  const updateTimeNonBlocking = useCallback((newTime: number) => {
    const now = performance.now();
    
    // 🎯 500ms 간격으로 UI 업데이트 (재생 중에도 적용)
    if (now - lastUpdateTimeRef.current < 500) {
      pendingTimeRef.current = newTime;
      return;
    }

    // 500ms마다 한 번씩 UI 업데이트 실행
    pendingTimeRef.current = newTime;
    scheduleUpdate();
  }, [scheduleUpdate]);

  return updateTimeNonBlocking;
};