/**
 * 🚨 useAlert.ts - 전역 알림 및 확인 대화상자 관리 훅
 * 
 * 비디오 에디터 전체에서 사용되는 알림 메시지와 확인 대화상자를
 * 중앙에서 관리하는 커스텀 훅입니다. 성공, 에러, 경고, 정보 메시지를
 * 일관된 인터페이스로 제공하여 사용자 경험을 향상시킵니다.
 * 
 * 주요 기능:
 * - 4가지 알림 타입 지원 (success, error, warning, info)
 * - 사용자 정의 자동 사라짐 시간 설정
 * - 확인/취소 대화상자 지원
 * - Promise 기반 비동기 확인 처리
 * - 자동 리소스 정리 및 메모리 관리
 * 
 * 알림 타입:
 * - success: 성공 메시지 (녹색, 성공 아이콘)
 * - error: 오류 메시지 (빨간색, 오류 아이콘)
 * - warning: 경고 메시지 (노란색, 경고 아이콘)
 * - info: 정보 메시지 (파란색, 정보 아이콘)
 * 
 * 자동 사라짐 기능:
 * - 기본 5초 후 자동 사라짐
 * - 사용자 정의 지속 시간 지원
 * - 무한 표시 옵션 (duration: 0)
 * - 수동 닫기 버튼 지원
 * 
 * 확인 대화상자:
 * - Promise 기반 비동기 처리
 * - 사용자 정의 버튼 텍스트
 * - 자동 포커스 및 키보드 단축키 지원
 * - ESC 키로 취소, Enter 키로 확인
 * 
 * 사용 예시:
 * ```typescript
 * const { showSuccess, showError, showConfirm } = useAlert();
 * 
 * // 성공 메시지
 * showSuccess('파일이 성공적으로 업로드되었습니다.');
 * 
 * // 에러 메시지
 * showError('네트워크 연결에 실패했습니다.');
 * 
 * // 확인 대화상자
 * const confirmed = await showConfirm('정말로 삭제하시겠습니까?');
 * if (confirmed) {
 *   // 삭제 실행
 * }
 * ```
 * 
 * 상태 관리:
 * - alert: 현재 표시 중인 알림 메시지
 * - confirm: 현재 표시 중인 확인 대화상자
 * - useCallback으로 함수 메모이제이션
 * 
 * 접근성 고려사항:
 * - 스크린 리더 지원
 * - 키보드 네비게이션 지원
 * - 색상 대비 준수
 * - 아이콘과 함께 시각적 전달
 * 
 * 관련 모듈:
 * - Alert 컴포넌트: UI 렌더링
 * - globalAlert: 전역 알림 시스템
 * - 8번 모듈: State Management (상태 관리)
 */
import { useState, useCallback } from 'react';
import { AlertMessage, ConfirmMessage } from '../components/common/Alert';

/**
 * useAlert 훅 - 전역 알림 및 확인 대화상자 관리
 * 
 * 주요 책임:
 * 1. 알림 메시지 상태 관리
 * 2. 확인 대화상자 상태 관리
 * 3. 다양한 알림 타입 지원
 * 4. 비동기 확인 처리
 * 5. 자동 사라짐 및 수동 제어
 * 
 * 반환값:
 * - 알림 표시 함수들 (showAlert, showSuccess, showError 등)
 * - 확인 대화상자 함수 (showConfirm)
 * - 상태 제어 함수들 (hideAlert, hideConfirm)
 * - 상태 값들 (alert, confirm)
 */
export const useAlert = () => {
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [confirm, setConfirm] = useState<ConfirmMessage | null>(null);

  // Alert 기능들
  const showAlert = useCallback((message: string, type: AlertMessage['type'] = 'info', duration?: number) => {
    setAlert({ message, type, duration });
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showAlert(message, 'success', duration);
  }, [showAlert]);

  const showError = useCallback((message: string, duration?: number) => {
    showAlert(message, 'error', duration);
  }, [showAlert]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showAlert(message, 'warning', duration);
  }, [showAlert]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showAlert(message, 'info', duration);
  }, [showAlert]);

  const hideAlert = useCallback(() => {
    setAlert(null);
    setConfirm(null);
  }, []);

  // Confirm 기능들
  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      type?: ConfirmMessage['type'];
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setConfirm({
      message,
      type: options?.type || 'confirm',
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      onConfirm: () => {
        onConfirm();
        setConfirm(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirm(null);
      }
    });
  }, []);

  // 편의 함수들 - browser confirm() 완전 대체
  const confirmDialog = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      showConfirm(
        message,
        () => resolve(true),
        () => resolve(false),
        { type: 'confirm' }
      );
    });
  }, [showConfirm]);

  const confirmWarning = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      showConfirm(
        message,
        () => resolve(true),
        () => resolve(false),
        { type: 'warning-confirm' }
      );
    });
  }, [showConfirm]);

  const confirmDanger = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      showConfirm(
        message,
        () => resolve(true),
        () => resolve(false),
        { type: 'danger-confirm', confirmText: '삭제', cancelText: '취소' }
      );
    });
  }, [showConfirm]);

  return {
    // 상태
    alert,
    confirmState: confirm,
    
    // Alert 함수들
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
    
    // Confirm 함수들
    showConfirm,
    confirm: confirmDialog,
    confirmWarning,
    confirmDanger
  };
};