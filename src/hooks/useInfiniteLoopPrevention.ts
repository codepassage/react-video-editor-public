/**
 * 🛡️ useInfiniteLoopPrevention.ts - 무한 루프 방지 시스템 훅
 * 
 * React Video Editor v1에서 렌더링 중 발생할 수 있는 무한 루프 상황을
 * 감지하고 방지하는 안전 메커니즘을 제공하는 커스텀 훅입니다.
 * 
 * 🎯 주요 기능:
 * - ESC 키를 통한 수동 루프 차단 시스템
 * - Ctrl+ESC 키를 통한 차단 해제
 * - 자동 해제 타이머 (1초 후)
 * - 우선순위 기반 키보드 이벤트 처리
 * - 시각적 피드백 및 디버깅 로그
 * 
 * 🔄 작동 원리:
 * ```
 * 사용자 ESC 입력 → 50ms 지연 → 다른 핸들러 확인 → 루프 차단
 * ↓
 * 1초 후 자동 해제 OR Ctrl+ESC로 수동 해제
 * ```
 * 
 * ⚡ 무한 루프 시나리오:
 * - Remotion Player 렌더링 중 상태 업데이트 충돌
 * - setCurrentTime 호출이 연쇄적으로 트리거되는 경우
 * - useEffect 의존성 배열 오류로 인한 재렌더링
 * - 타임라인 스크러빙 중 과도한 상태 변경
 * 
 * 🎮 키보드 단축키:
 * - ESC: 무한 루프 차단 활성화 (낮은 우선순위)
 * - Ctrl+ESC (또는 Cmd+ESC): 차단 즉시 해제 (최고 우선순위)
 * 
 * 🔧 우선순위 시스템:
 * 1. 다른 컴포넌트의 ESC 핸들러 (모달 닫기 등)
 * 2. 50ms 지연 후 이 훅의 ESC 처리
 * 3. Ctrl+ESC는 항상 최우선 처리
 * 
 * 🚨 안전 메커니즘:
 * - setTimeout 지연을 통한 이벤트 충돌 방지
 * - defaultPrevented 체크로 중복 처리 방지
 * - 자동 해제 타이머로 영구 차단 방지
 * - 전역 이벤트 리스너 적절한 정리
 * 
 * 💡 사용 시나리오:
 * - 개발 중 디버깅 도구로 활용
 * - 프로덕션에서 예상치 못한 루프 상황 대응
 * - 사용자가 느끼는 UI 정지 상황 해결
 * - Remotion 렌더링 중 비상 정지
 * 
 * 🔗 연관 모듈:
 * - Editor Store: 루프 차단 상태 관리
 * - Remotion Integration: 렌더링 안정성
 * - Timeline System: 스크러빙 안전성
 * - Player System: 재생 중 안정성
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */
import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
/**
 * 무한 루프 방지 시스템 훅
 * 
 * @function useInfiniteLoopPrevention
 * @description 키보드 단축키를 통해 무한 루프 상황을 감지하고 차단하는 훅입니다.
 * ESC 키로 차단을 활성화하고, Ctrl+ESC로 해제할 수 있습니다.
 * 
 * 주요 책임:
 * 1. 전역 키보드 이벤트 리스너 관리
 * 2. 우선순위 기반 ESC 키 처리
 * 3. 자동 해제 타이머 관리
 * 4. 루프 차단 상태 피드백
 * 
 * @returns {Object} 루프 차단 상태 객체
 * @returns {boolean} returns.isLoopBlocked - 현재 루프가 차단되어 있는지 여부
 * 
 * 내부 동작:
 * - ESC 키: 50ms 지연 후 차단 활성화 (다른 핸들러 우선 처리)
 * - Ctrl+ESC: 즉시 차단 해제 (최우선 처리)
 * - 자동 해제: 차단 활성화 1초 후 자동 해제
 * 
 * 💡 사용 예시:
 * ```typescript
 * function VideoEditor() {
 *   const { isLoopBlocked } = useInfiniteLoopPrevention();
 *   
 *   return (
 *     <div>
 *       {isLoopBlocked && (
 *         <div className="warning">⚠️ 무한루프 방지 활성화됨</div>
 *       )}
 *       <VideoPlayer />
 *     </div>
 *   );
 * }
 * ```
 */
export const useInfiniteLoopPrevention = () => {
  const { blockLoop, unblockLoop, isLoopBlocked } = useEditorStore();

  /**
   * 키보드 이벤트 리스너 설정 및 관리
   * 
   * @description 전역 키보드 이벤트를 감지하여 무한 루프 방지 기능을 제어합니다.
   * 우선순위 시스템을 통해 다른 컴포넌트의 ESC 핸들러와 충돌하지 않도록 합니다.
   */
  useEffect(() => {
    /**
     * 키보드 이벤트 핸들러
     * 
     * @param {KeyboardEvent} event - 키보드 이벤트 객체
     * 
     * 처리 로직:
     * 1. ESC 키 감지
     * 2. Ctrl/Cmd 조합키 확인
     * 3. 우선순위에 따른 처리 분기
     * 4. 타이머 기반 자동 해제
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (event.ctrlKey || event.metaKey) {
          // 🔴 최고 우선순위: Ctrl+ESC 또는 Cmd+ESC로 즉시 차단 해제
          event.preventDefault();
          unblockLoop();
          console.log('🔓 무한루프 차단 해제 (수동)');
          return;
        }
        
        // 🟡 낮은 우선순위: ESC만 눌렀을 때는 지연 처리
        // 다른 핸들러들(모달 닫기 등)이 먼저 처리되도록 50ms 지연
        setTimeout(() => {
          // 다른 핸들러가 preventDefault를 호출했는지 확인
          if (!event.defaultPrevented) {
            blockLoop();
            console.log('🔒 무한루프 차단 활성화 (1초 후 자동 해제)');
            
            // 1초 후 자동 해제 타이머 설정
            setTimeout(() => {
              unblockLoop();
              console.log('🔓 무한루프 차단 해제 (자동)');
            }, 1000);
          }
        }, 50); // 50ms 지연으로 다른 핸들러가 먼저 처리되도록
      }
    };

    // 전역 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown);

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [blockLoop, unblockLoop]);

  /**
   * 루프 차단 상태 변화 감지 및 피드백
   * 
   * @description 차단 상태가 변경될 때마다 콘솔 로그를 출력하여
   * 개발자에게 시각적 피드백을 제공합니다.
   */
  useEffect(() => {
    if (isLoopBlocked) {
      console.log('⚠️ 무한루프 방지 활성화됨. Ctrl+ESC로 해제 가능');
    } else {
      console.log('✅ 무한루프 방지 해제됨. 정상 동작 중');
    }
  }, [isLoopBlocked]);

  return {
    /** 현재 무한 루프 차단이 활성화되어 있는지 여부 */
    isLoopBlocked
  };
};