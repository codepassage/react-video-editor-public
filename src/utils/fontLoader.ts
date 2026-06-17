/**
 * 🎨 fontLoader.ts - 서버 폰트 동적 로딩 시스템
 * 
 * 서버의 모든 폰트를 동적으로 스캔하고 로드하는 포괄적인 폰트 관리 시스템입니다.
 * 한글 폰트를 포함한 다양한 폰트 형식을 지원하며, fallback 체인을 통한 안정적인 렌더링을 보장합니다.
 * 
 * 주요 기능:
 * - 서버 폰트 목록 자동 스캔 및 로딩
 * - FontFace API를 통한 동적 폰트 로딩
 * - 한글 폰트 fallback 체인 자동 생성
 * - 프로젝트별 사용 폰트 미리 로딩
 * - 폰트 가용성 검증 및 정규화
 * - 폰트 로딩 상태 추적 및 디버깅
 * 
 * 성능 최적화:
 * - 폰트 로딩 상태 캐싱으로 중복 요청 방지
 * - 실패한 폰트 추적으로 재시도 방지
 * - 조건부 로딩으로 필요한 폰트만 로드
 * - 브라우저 네이티브 폰트 렌더링 최적화
 * 
 * 사용 패턴:
 * - 에디터 시작 시 자동 초기화
 * - 텍스트 클립 렌더링 시 폰트 요청
 * - 프로젝트 로드 시 사용 폰트 미리 로딩
 * 
 * 특별 고려사항:
 * - 서버-클라이언트 환경 모두 지원
 * - 크로스 브라우저 폰트 렌더링 호환성
 * - 환경 변수 기반 유연한 서버 URL 설정
 * - 폰트 로딩 실패 시 graceful degradation
 */

// 🎨 폰트 로딩 유틸리티 - 서버 폰트 동적 로딩 버전
// 서버의 모든 폰트를 동적으로 스캔하고 로드하는 시스템

import { getFontServerUrl } from './urlBuilder';

// 폰트 정보 타입 정의
export interface FontInfo {
  filename: string;
  path: string;
  fullPath: string;
  type: string;
  familyName: string;
  weight: string;
  size?: number;
}

// 폰트 로딩 상태 관리
interface FontLoadingState {
  isInitialized: boolean;
  availableFonts: FontInfo[];
  loadedFonts: Set<string>;
  failedFonts: Set<string>;
  serverUrl: string;
}

const fontState: FontLoadingState = {
  isInitialized: false,
  availableFonts: [],
  loadedFonts: new Set(),
  failedFonts: new Set(),
  serverUrl: ''
};

/**
 * 서버로부터 폰트 목록을 가져와 초기화
 */
export async function initializeFontSystem(): Promise<boolean> {
  if (fontState.isInitialized) {
    console.log('✅ 폰트 시스템이 이미 초기화됨');
    return true;
  }

  try {
    // 환경변수 또는 현재 호스트를 기반으로 서버 URL 결정
    const serverUrl = getServerUrl();
    fontState.serverUrl = serverUrl;

    console.log('🔄 서버에서 폰트 목록 가져오는 중...', serverUrl);

    const response = await fetch(`${serverUrl}/api/fonts`);
    if (!response.ok) {
      throw new Error(`폰트 API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(`폰트 API 오류: ${data.error}`);
    }

    fontState.availableFonts = data.fonts || [];
    fontState.isInitialized = true;

    console.log(`✅ 폰트 시스템 초기화 완료: ${fontState.availableFonts.length}개 폰트 발견`);

    // 폰트 패밀리별로 그룹화해서 출력
    const fontFamilies = [...new Set(fontState.availableFonts.map(f => f.familyName))];
    console.log('🎨 사용 가능한 폰트 패밀리:', fontFamilies);

    return true;

  } catch (error) {
    console.error('❌ 폰트 시스템 초기화 실패:', error);
    fontState.isInitialized = false;
    return false;
  }
}

/**
 * 서버 URL 결정 함수
 */
function getServerUrl(): string {
  // 브라우저 환경에서 실행 중인지 확인
  if (typeof window !== 'undefined') {
    // urlBuilder에서 폰트 서버 URL 가져오기
    try {
      const fontServerUrl = getFontServerUrl();
      console.log('🔧 urlBuilder에서 폰트 서버 URL 사용:', fontServerUrl);
      return fontServerUrl;
    } catch (error) {
      console.warn('⚠️ urlBuilder 로드 실패, 폴백 방식 사용:', error);
    }

    // 현재 호스트를 기반으로 추론
    const { protocol, hostname } = window.location;
    // 환경변수에서 백엔드 포트 읽기
    const backendPort = import.meta.env?.VITE_BACKEND_PORT;
    if (!backendPort) {
      throw new Error('VITE_BACKEND_PORT 환경변수가 설정되지 않았습니다.');
    }

    // 개발 환경 감지
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const serverUrl = `${protocol}//${hostname}:${backendPort}`;
      console.log('🔧 개발 환경 폰트 서버 URL:', serverUrl);
      return serverUrl;
    }

    // 프로덕션 환경에서는 같은 도메인 사용
    const prodUrl = `${protocol}//${hostname}`;
    console.log('🔧 프로덕션 환경 폰트 서버 URL:', prodUrl);
    return prodUrl;
  }

  // 서버 환경에서는 환경변수 필수
  const serverUrl = process.env?.VITE_API_URL;
  if (!serverUrl) {
    throw new Error('서버 환경에서 VITE_API_URL 환경변수가 필요합니다.');
  }
  console.log('🔧 서버 환경 폰트 서버 URL:', serverUrl);
  return serverUrl;
}

/**
 * 단일 폰트를 동적으로 로드
 */
export async function loadFont(fontFamily: string, fontWeight = '400'): Promise<boolean> {
  // 시스템이 초기화되지 않았으면 먼저 초기화
  if (!fontState.isInitialized) {
    const initialized = await initializeFontSystem();
    if (!initialized) {
      console.error('❌ 폰트 시스템 초기화 필요');
      return false;
    }
  }

  try {
    // 요청된 폰트 찾기
    const targetFont = fontState.availableFonts.find(font =>
      font.familyName === fontFamily && font.weight === fontWeight
    );

    if (!targetFont) {
      // 굵기 상관없이 패밀리만 매치 시도
      const familyMatch = fontState.availableFonts.find(font =>
        font.familyName === fontFamily
      );

      if (familyMatch) {
        console.log(`🔄 정확한 굵기(${fontWeight})를 찾을 수 없어 기본 굵기(${familyMatch.weight}) 사용: ${fontFamily}`);
        return await loadFont(fontFamily, familyMatch.weight);
      }

      console.warn(`❌ 폰트를 찾을 수 없음: ${fontFamily} (weight: ${fontWeight})`);
      return false;
    }

    // 이미 로드된 폰트는 스킵
    const fontKey = `${targetFont.familyName}-${targetFont.weight}`;
    if (fontState.loadedFonts.has(fontKey)) {
      console.log(`✅ 폰트 이미 로드됨: ${fontFamily} (${fontWeight})`);
      return true;
    }

    // 이전에 실패한 폰트는 스킵
    if (fontState.failedFonts.has(fontKey)) {
      console.warn(`⚠️ 이전에 로드 실패한 폰트: ${fontFamily} (${fontWeight})`);
      return false;
    }

    // FontFace API를 사용하여 폰트 로드
    if (typeof FontFace !== 'undefined' && typeof document !== 'undefined') {
      const fontUrl = `${fontState.serverUrl}${targetFont.fullPath}`;

      const font = new FontFace(targetFont.familyName, `url(${fontUrl})`, {
        weight: targetFont.weight,
        style: 'normal',
        display: 'swap'
      });

      await font.load();
      document.fonts.add(font);

      fontState.loadedFonts.add(fontKey);
      console.log(`✅ 폰트 로드 성공: ${fontFamily} (${fontWeight})`);
      return true;
    } else {
      // FontFace API가 없는 환경에서는 CSS로 대체 (서버 렌더링 등)
      console.warn(`⚠️ FontFace API 미지원 환경, CSS 폰트 사용: ${fontFamily}`);
      return true;
    }

  } catch (error) {
    const fontKey = `${fontFamily}-${fontWeight}`;
    fontState.failedFonts.add(fontKey);
    console.error(`❌ 폰트 로드 실패: ${fontFamily} (${fontWeight})`, error);
    return false;
  }
}

/**
 * 여러 폰트를 한번에 로드
 */
export async function loadFonts(fontRequests: Array<{ family: string, weight?: string }>): Promise<void> {
  console.log(`🎨 ${fontRequests.length}개 폰트 로딩 시작...`);

  const loadPromises = fontRequests.map(req =>
    loadFont(req.family, req.weight || '400')
  );

  const results = await Promise.allSettled(loadPromises);

  const successCount = results.filter(result =>
    result.status === 'fulfilled' && result.value === true
  ).length;

  console.log(`✅ 폰트 로딩 완료: ${successCount}/${fontRequests.length}`);
}

/**
 * 렌더링에 필요한 모든 폰트를 미리 로드
 */
export async function preloadRenderingFonts(): Promise<void> {
  if (!fontState.isInitialized) {
    await initializeFontSystem();
  }

  // 모든 사용 가능한 폰트를 로드
  const fontRequests = fontState.availableFonts.map(font => ({
    family: font.familyName,
    weight: font.weight
  }));

  await loadFonts(fontRequests);
}

/**
 * 특정 프로젝트/트랙에서 사용된 폰트들만 미리 로드
 * @param tracks 프로젝트 트랙 데이터
 */
export async function preloadProjectFonts(tracks: any[]): Promise<void> {
  console.log('🔄 프로젝트 폰트 미리 로딩...');

  const usedFonts = new Set<string>();

  // 트랙에서 사용된 폰트 수집
  tracks.forEach(track => {
    track.clips?.forEach((clip: any) => {
      if (clip.mediaType === 'text' && clip.fontFamily) {
        usedFonts.add(`${clip.fontFamily}|${clip.fontWeight || '400'}`);
      }
    });
  });

  console.log(`📊 프로젝트에서 사용된 폰트: ${usedFonts.size}개`);

  // 폰트 로드 요청 생성
  const fontRequests = Array.from(usedFonts).map(fontStr => {
    const [family, weight] = fontStr.split('|');
    return { family, weight };
  });

  await loadFonts(fontRequests);
}

/**
 * 특정 폰트 패밀리가 사용 가능한지 확인
 */
export function isFontAvailable(fontFamily: string): boolean {
  if (!fontState.isInitialized) {
    console.warn('⚠️ 폰트 시스템이 초기화되지 않음');
    return false;
  }

  return fontState.availableFonts.some(font => font.familyName === fontFamily);
}

/**
 * 폰트 패밀리 이름을 정규화
 */
export function normalizeFontFamily(fontFamily: string): string {
  if (!fontState.isInitialized) {
    return fontFamily;
  }

  // 서버에서 가져온 폰트 목록에서 정확한 이름 찾기
  const matchingFont = fontState.availableFonts.find(font =>
    font.familyName.toLowerCase() === fontFamily.toLowerCase() ||
    font.filename.toLowerCase().includes(fontFamily.toLowerCase())
  );

  return matchingFont ? matchingFont.familyName : fontFamily;
}

/**
 * 사용 가능한 폰트 패밀리 목록 반환
 */
export function getAvailableFonts(): string[] {
  if (!fontState.isInitialized) {
    console.warn('⚠️ 폰트 시스템이 초기화되지 않음');
    return [];
  }

  // 중복 제거하여 패밀리 목록 반환
  return [...new Set(fontState.availableFonts.map(font => font.familyName))];
}

/**
 * 특정 폰트 패밀리의 사용 가능한 굵기 목록 반환
 */
export function getAvailableFontWeights(fontFamily: string): string[] {
  if (!fontState.isInitialized) {
    return ['400'];
  }

  const familyFonts = fontState.availableFonts.filter(font =>
    font.familyName === fontFamily
  );

  return familyFonts.map(font => font.weight).sort();
}

/**
 * 폰트 로딩 상태 정보 반환
 */
export function getFontLoadingStats(): {
  isInitialized: boolean;
  totalFonts: number;
  loadedFonts: number;
  failedFonts: number;
  availableFamilies: number;
} {
  return {
    isInitialized: fontState.isInitialized,
    totalFonts: fontState.availableFonts.length,
    loadedFonts: fontState.loadedFonts.size,
    failedFonts: fontState.failedFonts.size,
    availableFamilies: new Set(fontState.availableFonts.map(f => f.familyName)).size
  };
}

/**
 * Fallback이 포함된 폰트 문자열 반환
 */
export function getFontWithFallback(fontFamily: string): string {
  const normalizedFont = normalizeFontFamily(fontFamily);

  // 한글 폰트에 대한 적절한 fallback 제공
  const fallbacks = [
    'Apple SD Gothic Neo',
    'Noto Sans CJK KR',
    'Malgun Gothic',
    '맑은 고딕',
    'Dotum',
    '돋움',
    'sans-serif'
  ];

  return `"${normalizedFont}", ${fallbacks.join(', ')}`;
}

/**
 * 폰트 로딩 디버그 정보 출력
 */
export function debugFontLoading(fontFamily?: string): void {
  console.log('🔍 폰트 시스템 디버그 정보:');
  console.log('- 초기화 상태:', fontState.isInitialized);
  console.log('- 서버 URL:', fontState.serverUrl);
  console.log('- 총 폰트 수:', fontState.availableFonts.length);
  console.log('- 로드된 폰트:', fontState.loadedFonts.size);
  console.log('- 실패한 폰트:', fontState.failedFonts.size);

  if (fontFamily) {
    console.log(`- ${fontFamily} 사용 가능:`, isFontAvailable(fontFamily));
    const weights = getAvailableFontWeights(fontFamily);
    console.log(`- ${fontFamily} 사용 가능한 굵기:`, weights);
  }

  // 폰트 패밀리별 통계
  const familyStats = new Map<string, number>();
  fontState.availableFonts.forEach(font => {
    const count = familyStats.get(font.familyName) || 0;
    familyStats.set(font.familyName, count + 1);
  });

  console.log('- 패밀리별 폰트 수:', Object.fromEntries(familyStats));
}

/**
 * 폰트 시스템 재초기화
 */
export async function reinitializeFontSystem(): Promise<boolean> {
  fontState.isInitialized = false;
  fontState.availableFonts = [];
  fontState.loadedFonts.clear();
  fontState.failedFonts.clear();

  console.log('🔄 폰트 시스템 재초기화...');
  return await initializeFontSystem();
}

// 자동 초기화 (브라우저 환경에서만)
if (typeof window !== 'undefined') {
  // DOM이 준비되면 폰트 시스템 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeFontSystem().catch(console.error);
    });
  } else {
    // 이미 로드된 경우 즉시 초기화
    initializeFontSystem().catch(console.error);
  }
}

// 호환성을 위한 기존 인터페이스
export const KOREAN_FONTS = {
  // 동적으로 로드되므로 빈 객체로 시작
  // getAvailableFonts() 함수 사용 권장
} as const;

/**
 * 🔍 사용 가능한 폰트들을 감지 (호환성 함수)
 */
export async function detectAvailableFonts(fontList: string[]): Promise<string[]> {
  if (!fontState.isInitialized) {
    await initializeFontSystem();
  }

  if (typeof document === 'undefined') {
    return [];
  }

  const availableFonts: string[] = [];

  // 각 폰트를 테스트
  for (const fontFamily of fontList) {
    try {
      // FontFace API로 테스트
      if (typeof FontFace !== 'undefined') {
        const isAvailable = isFontAvailable(fontFamily);
        if (isAvailable) {
          availableFonts.push(fontFamily);
        }
      } else {
        // 캔버스 방식으로 테스트
        const isAvailable = isFontAvailable(fontFamily);
        if (isAvailable) {
          availableFonts.push(fontFamily);
        }
      }
    } catch (error) {
      console.warn(`폰트 감지 실패: ${fontFamily}`, error);
    }
  }

  return availableFonts;
}

export { fontState };
