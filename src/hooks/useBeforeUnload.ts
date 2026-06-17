import { useEffect, useRef } from 'react';

interface UseBeforeUnloadOptions {
  hasUnsavedChanges: boolean;
  message?: string;
}

/**
 * ⚠️ useBeforeUnload.ts - 페이지 나가기 전 경고 훅
 * 
 * 비디오 에디터에서 사용자가 작업 중인 데이터를 잃지 않도록
 * 페이지를 떠나기 전에 경고 메시지를 표시하는 훅입니다.
 * 새로고침, 브라우저 닫기, URL 변경 등 다양한 상황에서 동작합니다.
 * 
 * 주요 기능:
 * - beforeunload 이벤트 리스너 등록/해제
 * - 저장되지 않은 변경사항 감지 및 경고
 * - 사용자 정의 경고 메시지 지원
 * - 다양한 브라우저 호환성 보장
 * - 디버깅을 위한 상세 로깅
 * 
 * 발동 조건:
 * - hasUnsavedChanges가 true일 때만 경고 표시
 * - 캐시된 메시지를 사용하여 일관성 보장
 * 
 * 지원되는 상황:
 * - 브라우저 닫기 (Ctrl+W, Alt+F4)
 * - 탭 닫기 (X 버튼 클릭)
 * - 새로고침 (F5, Ctrl+R)
 * - URL 변경 (주소창 입력)
 * - 다른 웹사이트로 이동
 * - 뒤로가기/앞으로가기 버튼
 * 
 * 브라우저 호환성:
 * - Chrome: returnValue 설정 방식
 * - Firefox: returnValue 설정 방식
 * - Safari: returnValue 설정 방식
 * - Edge: 모든 방식 지원
 * 
 * 사용 예시:
 * ```typescript
 * // 변경사항이 있을 때만 경고
 * useBeforeUnload({
 *   hasUnsavedChanges: isDirty,
 *   message: '수정된 내용이 저장되지 않았습니다.'
 * });
 * ```
 * 
 * 보안 고려사항:
 * - 모든 경고를 사용자가 무시할 수 있음
 * - 업로드 중이거나 중요한 작업 중에만 사용 권장
 * - 자동 저장 기능과 병행하여 사용
 * 
 * 관련 모듈:
 * - 8번 모듈: State Management (변경사항 추적)
 * - AppWorking 컴포넌트: 메인 에디터에서 사용
 * - Header 컴포넌트: 프로젝트 저장 상태 연동
 */
/**
 * useBeforeUnload 훅 - 페이지 나가기 전 경고 리스너 관리
 * 
 * 주요 책임:
 * 1. beforeunload 이벤트 리스너 등록/해제
 * 2. 변경사항 상태에 따른 조건부 경고
 * 3. 브라우저 호환성을 위한 다중 방식 지원
 * 4. 메시지 업데이트 시 캐시 동기화
 * 5. 디버깅을 위한 상세 로깅
 * 
 * 매개변수:
 * - hasUnsavedChanges: 저장되지 않은 변경사항 존재 여부
 * - message: 사용자에게 표시할 경고 메시지
 * 
 * 동작 방식:
 * - useEffect로 이벤트 리스너 등록
 * - hasUnsavedChanges가 false면 경고 없이 이동 허용
 * - true면 브라우저 기본 경고창 표시
 * - 컴포넌트 언마운트 시 자동 정리
 */
export const useBeforeUnload = ({ 
  hasUnsavedChanges, 
  message = '편집 중인 데이터가 손실될 수 있습니다. 정말로 페이지를 떠나시겠습니까?' 
}: UseBeforeUnloadOptions) => {
  const messageRef = useRef(message);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🚨 beforeunload 이벤트 발생:', { hasUnsavedChanges, message: messageRef.current });
      
      if (!hasUnsavedChanges) {
        console.log('✅ 변경사항 없음 - 자유로운 이동 허용');
        return;
      }

      console.log('⚠️ 변경사항 있음 - 확인창 표시');
      
      // 최신 표준 방식
      event.preventDefault();
      event.returnValue = '';  // 빈 문자열로 설정
      
      // 구버전 브라우저 호환
      return '';
    };

    const handleUnload = () => {
      console.log('🚪 페이지 언로드 실행');
      
      try {
        const timestamp = new Date().toISOString();
        localStorage.setItem('video-editor-last-exit', timestamp);
        localStorage.setItem('video-editor-exit-warning', 'true');
      } catch (error) {
        console.warn('❌ 언로드 시 로컬 저장 실패:', error);
      }
    };

    // 항상 이벤트 리스너 등록 (조건부 제거)
    console.log('🔧 beforeunload 이벤트 리스너 등록:', { hasUnsavedChanges });
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      console.log('🧹 beforeunload 이벤트 리스너 제거');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [hasUnsavedChanges]);

  // 수동으로 beforeunload 체크하는 함수
  const checkBeforeNavigate = (): boolean => {
    if (!hasUnsavedChanges) return true;
    
    return window.confirm(messageRef.current);
  };

  return { checkBeforeNavigate };
};