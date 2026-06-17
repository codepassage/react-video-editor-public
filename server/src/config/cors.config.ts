/**
 * CORS 설정
 */

import { appConfig } from './app.config.ts';

/**
 * 동적 CORS origin 생성
 */
export function generateCorsOrigins(): string[] {
  const frontendPort = process.env.VITE_PORT || appConfig.frontend.defaultPort;
  const commonPorts = appConfig.frontend.commonPorts;

  const origins: string[] = [];
  
  // 메인 프론트엔드 포트
  const host = process.env.VITE_BACKEND_HOST || 'localhost';
  origins.push(`http://${host}:${frontendPort}`);
  origins.push(`http://127.0.0.1:${frontendPort}`);

  // 공통 포트들
  commonPorts.forEach(port => {
    if (port !== frontendPort) {
      origins.push(`http://${host}:${port}`);
      origins.push(`http://127.0.0.1:${port}`);
    }
  });

  return origins;
}

/**
 * CORS 설정 객체
 */
export const corsConfig = {
  origin: function(origin: string | undefined, callback: Function) {
    // 개발 환경에서는 모든 localhost와 로컬 네트워크 IP 허용
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        origin.includes('192.168.') ||
        origin.includes('10.0.') ||
        origin.includes('172.16.') ||
        origin.includes('0.0.0.0')) {
      callback(null, true);
    } else {
      const allowedOrigins = generateCorsOrigins();
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 86400 // 24시간
};

export default corsConfig;
