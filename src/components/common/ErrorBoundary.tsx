/**
 * 🛡️ ErrorBoundary.tsx - React 에러 경계 컴포넌트
 * 
 * React 애플리케이션에서 발생하는 JavaScript 에러를 포착하고 처리하는
 * 에러 경계(Error Boundary) 컴포넌트입니다. 에러 발생 시 앱 전체가
 * 크래시되는 것을 방지하고 사용자에게 친화적인 에러 화면을 제공합니다.
 * 
 * 주요 기능:
 * - React 컴포넌트 트리의 에러 포착 및 처리
 * - 에러 발생 시 대체 UI 표시
 * - 글로벌 알림 시스템과 연동된 에러 알림
 * - 개발 환경에서 상세한 에러 로깅
 * - 프로덕션 환경에서 사용자 친화적 에러 처리
 * 
 * 에러 처리 범위:
 * - 렌더링 중 발생하는 에러
 * - 생명주기 메서드에서 발생하는 에러
 * - 컴포넌트 트리 전체의 constructor 에러
 * - 하위 컴포넌트에서 throw된 에러
 * 
 * 처리하지 않는 에러:
 * - 이벤트 핸들러 에러
 * - 비동기 코드 에러 (setTimeout, Promise 등)
 * - 서버 사이드 렌더링 에러
 * - 에러 경계 자체에서 발생한 에러
 * 
 * 에러 발생 시 동작:
 * 1. getDerivedStateFromError: 에러 상태 업데이트
 * 2. componentDidCatch: 에러 로깅 및 알림
 * 3. 대체 UI 렌더링 (fallback 또는 기본 에러 화면)
 * 4. 글로벌 알림으로 사용자에게 에러 안내
 * 
 * 사용 방법:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 * 
 * 장점:
 * - 앱 전체 크래시 방지
 * - 사용자 경험 개선
 * - 디버깅을 위한 상세 로깅
 * - 커스텀 에러 UI 지원
 * 
 * 개선사항:
 * - 에러 보고 서비스 연동 가능
 * - 에러 타입별 다른 처리 가능
 * - 재시도 버튼 제공 가능
 * - 에러 통계 수집 가능
 * 
 * 관련 시스템:
 * - globalAlert: 에러 알림 표시
 * - 로깅 시스템: 에러 기록 및 분석
 * - App.tsx: 최상위 에러 경계로 사용
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { globalAlert } from '../../utils/globalAlert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    // Global Alert은 Error Boundary 밖에서 동작하므로 안전
    globalAlert.showError(`앱에서 오류가 발생했습니다: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '40px',
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.95) 0%, rgba(229, 115, 115, 0.95) 100%)',
          color: 'white',
          borderRadius: '16px',
          textAlign: 'center',
          zIndex: 10000,
          maxWidth: '500px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>🚨 오류 발생</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '16px', lineHeight: '1.4' }}>
            앱에서 예상치 못한 오류가 발생했습니다.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            🔄 페이지 새로고침
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontSize: '14px' }}>개발자 정보</summary>
              <pre style={{ 
                marginTop: '10px', 
                fontSize: '12px', 
                background: 'rgba(0, 0, 0, 0.3)', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error?.stack || this.state.error?.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}