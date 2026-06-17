/**
 * 🔗 urlBuilder.ts - 환경별 URL 생성 유틸리티
 * 
 * 브라우저와 Remotion 렌더링 환경에서 서로 다른 URL 생성 전략을
 * 제공하는 유틸리티 함수들입니다. 환경에 따라 적절한 경로 형식을
 * 자동으로 선택하여 미디어 파일 접근을 최적화합니다.
 * 
 * 주요 기능:
 * - 환경별 자동 URL 형식 선택
 * - 브라우저용 상대 경로 생성
 * - Remotion용 절대 URL 생성
 * - 프록시 설정과 연동
 * - 서버 포트 동적 처리
 * 
 * 환경별 전략:
 * - 브라우저: 상대 경로 사용 (Vite 프록시가 /api로 라우팅)
 * - Remotion: 서버에서 전달한 절대 URL 사용 (직접 접근)
 * - 개발/프로덕션 환경 자동 감지
 * 
 * URL 타입:
 * - API 엔드포인트: /api/* 형식
 * - 미디어 파일: /uploads/* 형식  
 * - 정적 자원: /static/* 형식
 * - 폰트 파일: /fonts/* 형식
 * 
 * 관련 모듈:
 * - Vite 프록시 설정과 연동
 * - 7번 모듈: Remotion Integration (렌더링 시 URL 처리)
 * - 서버 미디어 서비스와 연동
 * - MediaLibrary: 미디어 파일 URL 생성
 */

// 환경별 API URL 가져오기
const getBaseApiUrl = (): string => {
  // 브라우저 환경: 상대 경로 사용 (Vite 프록시가 처리)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Remotion 번들: 서버에서 전달한 환경변수 사용
  if (typeof process !== 'undefined' && process.env.REMOTION_API_URL) {
    return process.env.REMOTION_API_URL;
  }
  
  throw new Error('API URL을 찾을 수 없습니다.');
};

const getBaseFontServerUrl = (): string => {
  // 브라우저 환경: 상대 경로 사용 (Vite 프록시가 처리)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Remotion 번들: 서버에서 전달한 환경변수 사용
  if (typeof process !== 'undefined' && process.env.REMOTION_FONT_SERVER_URL) {
    return process.env.REMOTION_FONT_SERVER_URL;
  }
  
  throw new Error('폰트 서버 URL을 찾을 수 없습니다.');
};

const getBackendPort = (): string => {
  // 브라우저 환경: 포트 필요 없음 (프록시 사용)
  if (typeof window !== 'undefined') {
    return ''; // 빈 문자열 반환
  }
  
  // Remotion 번들: 서버에서 전달한 포트 사용
  if (typeof process !== 'undefined' && process.env.REMOTION_BACKEND_PORT) {
    return process.env.REMOTION_BACKEND_PORT;
  }
  
  throw new Error('백엔드 포트를 찾을 수 없습니다.');
};

/**
 * 백엔드 API의 완전한 URL을 생성
 * @returns 완전한 API URL
 */
export const getApiUrl = (): string => {
  const baseUrl = getBaseApiUrl();
  const port = getBackendPort();

  // 브라우저 환경: 프록시 사용하므로 포트 조합 불필요
  if (typeof window !== 'undefined') {
    return baseUrl;
  }

  // Remotion 환경: 포트와 조합
  if (port) {
    const result = `${baseUrl}:${port}`;
    console.log('🔗 getApiUrl() result:', result, { baseUrl, port });
    return result;
  }

  return baseUrl;
};

/**
 * 폰트 서버의 완전한 URL을 생성
 * @returns 완전한 폰트 서버 URL
 */
export const getFontServerUrl = (): string => {
  const baseUrl = getBaseFontServerUrl();
  const port = getBackendPort();

  // 브라우저 환경: 프록시 사용하므로 포트 조합 불필요
  if (typeof window !== 'undefined') {
    return baseUrl;
  }

  // Remotion 환경: 포트와 조합
  if (port) {
    return `${baseUrl}:${port}`;
  }

  return baseUrl;
};

/**
 * API 엔드포인트의 완전한 URL을 생성
 * @param endpoint API 엔드포인트 경로 (예: '/api/clips', '/uploads/image.jpg')
 * @returns 완전한 API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * 폰트 파일의 완전한 URL을 생성
 * @param fontPath 폰트 파일 경로 (예: '/font/NotoSans.woff2')
 * @returns 완전한 폰트 URL
 */
export const buildFontUrl = (fontPath: string): string => {
  const baseUrl = getFontServerUrl();
  const cleanPath = fontPath.startsWith('/') ? fontPath : `/${fontPath}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * 개발 모드에서 디버깅용 정보 출력
 */
export const debugUrls = (): void => {
  if (import.meta.env.DEV) {
    console.log('🔗 URL Configuration:', {
      baseApiUrl: getBaseApiUrl(),
      baseFontServerUrl: getBaseFontServerUrl(),
      backendPort: getBackendPort(),
      finalApiUrl: getApiUrl(),
      finalFontServerUrl: getFontServerUrl(),
    });
  }
};