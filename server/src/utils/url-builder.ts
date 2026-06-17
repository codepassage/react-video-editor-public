/**
 * 서버 URL 생성 유틸리티
 */

import { appConfig } from '../config/app.config';

/**
 * 백엔드 호스트 정보 가져오기
 */
export function getBackendHost(): string {
  const host = process.env.VITE_BACKEND_HOST;
  if (!host) {
    throw new Error('VITE_BACKEND_HOST 환경변수가 설정되지 않았습니다.');
  }
  return host;
}

/**
 * 백엔드 포트 정보 가져오기
 */
export function getBackendPort(): number {
  return appConfig.port;
}

/**
 * 백엔드 기본 URL 생성
 */
export function getBackendBaseUrl(): string {
  const host = getBackendHost();
  const port = getBackendPort();
  return `http://${host}:${port}`;
}

/**
 * 업로드 파일 URL 생성
 */
export function buildUploadUrl(filename: string): string {
  const baseUrl = getBackendBaseUrl();
  return `${baseUrl}/uploads/${encodeURIComponent(filename)}`;
}

/**
 * 렌더링 파일 URL 생성
 */
export function buildRenderUrl(filename: string): string {
  const baseUrl = getBackendBaseUrl();
  return `${baseUrl}/renders/${filename}`;
}

/**
 * 폰트 파일 URL 생성
 */
export function buildFontUrl(fontPath: string): string {
  const baseUrl = getBackendBaseUrl();
  const cleanPath = fontPath.startsWith('/') ? fontPath : `/${fontPath}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * 미디어 파일 URL 생성
 */
export function buildMediaUrl(mediaPath: string): string {
  const baseUrl = getBackendBaseUrl();
  return `${baseUrl}${mediaPath}`;
}

/**
 * API 엔드포인트 URL 생성
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getBackendBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}