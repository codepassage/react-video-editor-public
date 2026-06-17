/**
 * 🎬 App.tsx - 메인 애플리케이션 컴포넌트
 * 
 * React Video Editor의 최상위 라우팅 컴포넌트로, 전체 애플리케이션의 구조를 정의합니다.
 * 두 개의 주요 페이지(VideoEditor, DataEditor) 간의 라우팅을 관리하며,
 * 전역 에러 처리, 알림 시스템, 무한루프 방지 기능을 제공합니다.
 * 
 * 핵심 기능:
 * - React Router를 통한 SPA 라우팅 관리
 * - ErrorBoundary를 통한 전역 에러 처리
 * - AlertProvider를 통한 전역 알림 시스템
 * - 무한루프 방지 훅 적용으로 성능 최적화
 * 
 * 라우트 구조:
 * - '/' : VideoEditor (비디오 편집 메인 페이지)
 * - '/data-editor' : DataEditor (데이터 편집 및 CSV 관리 페이지)
 * 
 * 관련 모듈:
 * - 1번 모듈: Timeline System (VideoEditor 페이지에서 사용)
 * - 6번 모듈: Auto Generation System (DataEditor 페이지에서 사용)
 * - 8번 모듈: State Management (전역 상태 관리)
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VideoEditor from './pages/VideoEditor';
import DataEditor from './pages/DataEditor';
import { AlertProvider } from './contexts/AlertContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useInfiniteLoopPrevention } from './hooks/useInfiniteLoopPrevention';

/**
 * App 컴포넌트 - 전체 애플리케이션의 루트 컴포넌트
 * 
 * 주요 책임:
 * 1. 전역 에러 처리 (이중 ErrorBoundary로 안전성 보장)
 * 2. 전역 알림 시스템 제공 (AlertProvider)
 * 3. 라우팅 구조 관리 (React Router)
 * 4. 무한루프 방지를 통한 성능 최적화
 * 
 * 보안 계층:
 * - 외부 ErrorBoundary: 전체 앱 레벨 에러 처리
 * - 내부 ErrorBoundary: 라우팅 레벨 에러 처리
 * - AlertProvider: 사용자 친화적 알림 시스템
 */
export const App: React.FC = () => {
  // 🛡️ 성능 최적화: 무한루프 방지 훅 사용
  // React의 re-render 무한루프를 방지하여 브라우저 크래시 예방
  useInfiniteLoopPrevention();

  return (
    <ErrorBoundary>
      <AlertProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<VideoEditor />} />
              <Route path="/data-editor" element={<DataEditor />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </AlertProvider>
    </ErrorBoundary>
  );
};
