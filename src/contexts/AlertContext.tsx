import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AlertMessage, ConfirmMessage, Alert } from '../components/common/Alert';
import { connectAlertContext, GlobalAlertManager } from '../utils/globalAlert';

interface AlertContextType {
  // Alert 함수들
  showAlert: (message: string, type?: AlertMessage['type'], duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideAlert: () => void;
  
  // Confirm 함수들
  showConfirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      type?: ConfirmMessage['type'];
      confirmText?: string;
      cancelText?: string;
    }
  ) => void;
  confirm: (message: string) => Promise<boolean>;
  confirmWarning: (message: string) => Promise<boolean>;
  confirmDanger: (message: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
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

  const contextValue: AlertContextType = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
    showConfirm,
    confirm: confirmDialog,
    confirmWarning,
    confirmDanger
  };

  // 글로벌 Alert 매니저와 연결
  useEffect(() => {
    const globalMethods: GlobalAlertManager = {
      showSuccess,
      showError,
      showWarning,
      showInfo,
      confirm: confirmDialog,
      confirmWarning,
      confirmDanger,
      _setContextMethods: () => {} // 사용하지 않음
    };

    connectAlertContext(globalMethods);
    
    console.log('🔗 Global Alert Manager connected to React Context');
  }, [showSuccess, showError, showWarning, showInfo, confirmDialog, confirmWarning, confirmDanger]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {/* 전역 Alert 컴포넌트 - 항상 최상위에 렌더링 */}
      <Alert alert={alert} confirm={confirm} onClose={hideAlert} />
    </AlertContext.Provider>
  );
};

// Hook for using alert context
export const useGlobalAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useGlobalAlert must be used within an AlertProvider');
  }
  return context;
};