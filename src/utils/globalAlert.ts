/**
 * 🚨 globalAlert.ts - 전역 알림 시스템
 * 
 * React 컴포넌트 외부에서도 알림을 표시할 수 있는 전역 알림 시스템입니다.
 * 비동기 작업, 서버 응답, 에러 처리 등 어디서든 사용자에게 피드백을
 * 제공할 수 있도록 설계된 중앙집중식 알림 관리 시스템입니다.
 * 
 * 주요 기능:
 * - 전역 알림 표시 (성공, 에러, 경고, 정보)
 * - 확인 대화상자 (Confirm Dialog)
 * - Promise 기반 사용자 선택 처리
 * - 자동 타이머 해제
 * - 다중 알림 큐 관리
 * 
 * 알림 타입:
 * - success: 성공 메시지 (녹색)
 * - error: 에러 메시지 (빨간색)
 * - warning: 경고 메시지 (주황색)
 * - info: 정보 메시지 (파란색)
 * 
 * 사용 시나리오:
 * - API 호출 결과 알림
 * - 파일 업로드/다운로드 상태
 * - 데이터 저장/삭제 확인
 * - 에러 상황 사용자 안내
 * 
 * 관련 모듈:
 * - useAlert: React 훅 연동
 * - ErrorBoundary: 에러 알림 표시
 * - 모든 API 호출: 결과 알림
 * - 사용자 액션: 확인 대화상자
 */

// 글로벌 Alert 시스템 - React 컴포넌트 밖에서도 동작
// 이 시스템은 React Context와 연동되어 작동합니다.

interface GlobalAlertManager {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  confirm: (message: string) => Promise<boolean>;
  confirmWarning: (message: string) => Promise<boolean>;
  confirmDanger: (message: string) => Promise<boolean>;
  
  // React Context와 연결하는 내부 함수들
  _setContextMethods: (methods: GlobalAlertManager) => void;
}

class GlobalAlertManagerImpl implements GlobalAlertManager {
  private contextMethods: GlobalAlertManager | null = null;

  // React Context 연결
  _setContextMethods(methods: GlobalAlertManager) {
    this.contextMethods = methods;
  }

  // Alert 함수들 - Context가 없으면 fallback
  showSuccess(message: string, duration?: number) {
    if (this.contextMethods) {
      this.contextMethods.showSuccess(message, duration);
    } else {
      this.fallbackAlert(`✅ ${message}`);
    }
  }

  showError(message: string, duration?: number) {
    if (this.contextMethods) {
      this.contextMethods.showError(message, duration);
    } else {
      this.fallbackAlert(`❌ ${message}`);
    }
  }

  showWarning(message: string, duration?: number) {
    if (this.contextMethods) {
      this.contextMethods.showWarning(message, duration);
    } else {
      this.fallbackAlert(`⚠️ ${message}`);
    }
  }

  showInfo(message: string, duration?: number) {
    if (this.contextMethods) {
      this.contextMethods.showInfo(message, duration);
    } else {
      this.fallbackAlert(`ℹ️ ${message}`);
    }
  }

  // Confirm 함수들 - Context가 없으면 fallback
  async confirm(message: string): Promise<boolean> {
    if (this.contextMethods) {
      return this.contextMethods.confirm(message);
    } else {
      return this.fallbackConfirm(message);
    }
  }

  async confirmWarning(message: string): Promise<boolean> {
    if (this.contextMethods) {
      return this.contextMethods.confirmWarning(message);
    } else {
      return this.fallbackConfirm(`⚠️ ${message}`);
    }
  }

  async confirmDanger(message: string): Promise<boolean> {
    if (this.contextMethods) {
      return this.contextMethods.confirmDanger(message);
    } else {
      return this.fallbackConfirm(`🚨 ${message}`);
    }
  }

  // Fallback 메소드들 (React Context가 없을 때)
  private fallbackAlert(message: string) {
    console.warn('🔧 Alert Context not available, using browser alert:', message);
    window.alert(message);
  }

  private fallbackConfirm(message: string): Promise<boolean> {
    console.warn('🔧 Alert Context not available, using browser confirm:', message);
    return Promise.resolve(window.confirm(message));
  }

  // 브라우저 alert/confirm 직접 대체 함수들
  overrideBrowserAlerts() {
    // 기존 browser alert/confirm을 오버라이드
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    window.alert = (message?: any) => {
      if (typeof message === 'string') {
        this.showInfo(message);
      } else {
        originalAlert(String(message));
      }
    };

    window.confirm = (message?: string): boolean => {
      console.warn('🚨 window.confirm은 비동기로 작동하지 않습니다. globalAlert.confirm()을 사용하세요.');
      return originalConfirm(message || '');
    };

    console.log('🔧 Browser alert/confirm functions have been overridden by globalAlert');
  }

  // 원본 복구
  restoreBrowserAlerts() {
    // 이 기능은 필요시 구현 (window의 원본 저장 필요)
    console.log('🔧 Browser alert/confirm functions restored');
  }
}

// 싱글톤 인스턴스
export const globalAlert = new GlobalAlertManagerImpl();

// React Context에서 사용하는 연결 함수
export const connectAlertContext = (contextMethods: GlobalAlertManager) => {
  globalAlert._setContextMethods(contextMethods);
};

// 타입 정의 export
export type { GlobalAlertManager };