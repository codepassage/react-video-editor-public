/**
 * 🔔 Alert.tsx - 전역 알림 UI 컴포넌트
 * 
 * globalAlert 시스템과 연동되어 실제로 알림을 화면에 표시하는
 * UI 컴포넌트입니다. 다양한 타입의 알림과 확인 대화상자를
 * 일관된 디자인으로 렌더링합니다.
 * 
 * 주요 기능:
 * - 4가지 타입 알림 표시 (성공, 에러, 경고, 정보)
 * - 자동 타이머 해제
 * - 확인 대화상자 지원
 * - 애니메이션 효과
 * - 다중 알림 스택 관리
 * 
 * 알림 스타일:
 * - success: 녹색 배경, 체크 아이콘
 * - error: 빨간색 배경, X 아이콘
 * - warning: 주황색 배경, 경고 아이콘
 * - info: 파란색 배경, 정보 아이콘
 * 
 * 관련 모듈:
 * - globalAlert: 알림 관리 시스템
 * - useAlert: React 훅 연동
 * - App: 최상위에서 렌더링
 */

import React, { useEffect } from 'react';

export interface AlertMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // milliseconds, default 3000
}

export interface ConfirmMessage {
  message: string;
  type: 'confirm' | 'warning-confirm' | 'danger-confirm';
  confirmText?: string; // default "확인"
  cancelText?: string;  // default "취소"
  onConfirm: () => void;
  onCancel: () => void;
}

interface AlertProps {
  alert: AlertMessage | null;
  confirm: ConfirmMessage | null;
  onClose: () => void;
}

export const Alert: React.FC<AlertProps> = ({ alert, confirm, onClose }) => {
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        onClose();
      }, alert.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [alert, onClose]);

  // Confirm 다이얼로그 스타일 함수들
  const getConfirmStyles = (type: ConfirmMessage['type']) => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '24px',
      borderRadius: '16px',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      maxWidth: '500px',
      minWidth: '320px',
      animation: 'fadeIn 0.3s ease-out',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)'
    };

    switch (type) {
      case 'confirm':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.95) 0%, rgba(100, 181, 246, 0.95) 100%)',
          border: '2px solid rgba(33, 150, 243, 0.8)'
        };
      case 'warning-confirm':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.95) 0%, rgba(255, 183, 77, 0.95) 100%)',
          border: '2px solid rgba(255, 152, 0, 0.8)'
        };
      case 'danger-confirm':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.95) 0%, rgba(229, 115, 115, 0.95) 100%)',
          border: '2px solid rgba(244, 67, 54, 0.8)'
        };
      default:
        return baseStyles;
    }
  };

  const getConfirmIcon = (type: ConfirmMessage['type']) => {
    switch (type) {
      case 'confirm': return '❓';
      case 'warning-confirm': return '⚠️';
      case 'danger-confirm': return '🚨';
      default: return '❓';
    }
  };

  const getConfirmButtonStyle = (type: ConfirmMessage['type']) => {
    switch (type) {
      case 'confirm':
        return 'linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(100, 181, 246, 0.9) 100%)';
      case 'warning-confirm':
        return 'linear-gradient(135deg, rgba(255, 152, 0, 0.9) 0%, rgba(255, 183, 77, 0.9) 100%)';
      case 'danger-confirm':
        return 'linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(229, 115, 115, 0.9) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(100, 181, 246, 0.9) 100%)';
    }
  };

  const getConfirmButtonBorder = (type: ConfirmMessage['type']) => {
    switch (type) {
      case 'confirm': return 'rgba(33, 150, 243, 0.5)';
      case 'warning-confirm': return 'rgba(255, 152, 0, 0.5)';
      case 'danger-confirm': return 'rgba(244, 67, 54, 0.5)';
      default: return 'rgba(33, 150, 243, 0.5)';
    }
  };

  const getConfirmButtonShadow = (type: ConfirmMessage['type']) => {
    switch (type) {
      case 'confirm': return 'rgba(33, 150, 243, 0.4)';
      case 'warning-confirm': return 'rgba(255, 152, 0, 0.4)';
      case 'danger-confirm': return 'rgba(244, 67, 54, 0.4)';
      default: return 'rgba(33, 150, 243, 0.4)';
    }
  };

  // Confirm 다이얼로그 렌더링
  if (confirm) {
    return (
      <>
        {/* 배경 오버레이 */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)'
        }} onClick={confirm.onCancel} />

        {/* Confirm 다이얼로그 */}
        <div style={getConfirmStyles(confirm.type)}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* 메시지 영역 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                fontSize: '24px',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
              }}>
                {getConfirmIcon(confirm.type)}
              </span>
              <span style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                fontSize: '16px',
                lineHeight: '1.4'
              }}>
                {confirm.message}
              </span>
            </div>

            {/* 버튼 영역 */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={confirm.onCancel}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.9) 0%, rgba(189, 189, 189, 0.9) 100%)',
                  border: '1px solid rgba(158, 158, 158, 0.5)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(158, 158, 158, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {confirm.cancelText || '취소'}
              </button>

              <button
                onClick={confirm.onConfirm}
                style={{
                  padding: '10px 20px',
                  background: getConfirmButtonStyle(confirm.type),
                  border: `1px solid ${getConfirmButtonBorder(confirm.type)}`,
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${getConfirmButtonShadow(confirm.type)}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {confirm.confirmText || '확인'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Alert 메시지 렌더링
  if (!alert) return null;

  const getAlertStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '16px 24px',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      backdropFilter: 'blur(10px)',
      zIndex: 9999, // 가장 높은 z-index로 모든 요소 위에 표시
      maxWidth: '400px',
      textAlign: 'center' as const,
      animation: 'fadeIn 0.3s ease-out',
      pointerEvents: 'none' as const,
      minWidth: '200px'
    };

    switch (alert.type) {
      case 'success':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.95) 0%, rgba(102, 187, 106, 0.95) 100%)',
          border: '2px solid rgba(76, 175, 80, 0.8)',
          boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)'
        };
      case 'error':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.95) 0%, rgba(229, 115, 115, 0.95) 100%)',
          border: '2px solid rgba(244, 67, 54, 0.8)',
          boxShadow: '0 8px 32px rgba(244, 67, 54, 0.4)'
        };
      case 'warning':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.95) 0%, rgba(255, 183, 77, 0.95) 100%)',
          border: '2px solid rgba(255, 152, 0, 0.8)',
          boxShadow: '0 8px 32px rgba(255, 152, 0, 0.4)'
        };
      case 'info':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.95) 0%, rgba(100, 181, 246, 0.95) 100%)',
          border: '2px solid rgba(33, 150, 243, 0.8)',
          boxShadow: '0 8px 32px rgba(33, 150, 243, 0.4)'
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💬';
    }
  };

  return (
    <div style={getAlertStyles()}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <span style={{
          fontSize: '20px',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        }}>
          {getIcon()}
        </span>
        <span style={{
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {alert.message}
        </span>
      </div>
    </div>
  );
};