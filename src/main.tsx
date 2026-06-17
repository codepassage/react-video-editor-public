/**
 * 🚀 main.tsx - React 애플리케이션 진입점
 * 
 * React Video Editor의 메인 진입점으로, 애플리케이션 초기화와
 * 폰트 시스템 설정을 처리합니다.
 * 
 * 주요 기능:
 * - React DOM 렌더링 초기화
 * - 폰트 시스템 비동기 초기화
 * - StrictMode 활성화 (개발 모드 디버깅)
 * - 전역 CSS 스타일 로딩
 * 
 * 초기화 순서:
 * 1. 폰트 로더 시스템 초기화
 * 2. 폰트 컴렉션 초기화
 * 3. React 애플리케이션 렌더링
 * 
 * 관련 모듈:
 * - 8번 모듈: State Management (App 컴포넌트 통해)
 * - 폰트 시스템: 한글 폰트 지원 및 TTS 연동
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// 🎨 폰트 시스템 비동기 초기화
// 한글 TTS 및 텍스트 렌더링을 위한 폰트 컴렉션 사전 로딩
import { initializeFontSystem } from './utils/fontLoader'
import { initializeFontCollection } from './data/fonts'

// 🏁 애플리케이션 시작 전 폰트 시스템 비동기 초기화
// React 렌더링 전에 폰트 로딩을 완료하여 TTS 및 텍스트 렌더링 오류 방지
(async () => {
  try {
    console.log('🎨 앱 시작: 폰트 시스템 초기화 중...');
    
    // 폰트 로더와 컬렉션 동시 초기화
    const [loaderReady, collectionReady] = await Promise.all([
      initializeFontSystem(),
      initializeFontCollection()
    ]);
    
    if (loaderReady && collectionReady) {
      console.log('✅ 폰트 시스템 초기화 완료');
    } else {
      console.warn('⚠️ 폰트 시스템 초기화 부분 실패:', { loaderReady, collectionReady });
    }
  } catch (error) {
    console.error('❌ 폰트 시스템 초기화 실패:', error);
  }
})();

// Stagewise 툴바 비활성화 (포트 스캔으로 인한 CPU 과부하 방지)
// 필요 시 .env에 VITE_ENABLE_STAGEWISE=true 추가하여 활성화
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_STAGEWISE === 'true') {
  import('@stagewise/toolbar').then(({ initToolbar }) => {
    initToolbar({ plugins: [], devServerPort: 3005 });
  }).catch(() => {});
}

// 🔥 React StrictMode 활성화
// 개발 모드에서 잠재적 문제 발견 및 디버깅 지원
// 이중 렌더링을 통한 부작용 감지와 성능 및 안정성 개선
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
