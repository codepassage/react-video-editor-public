/**
 * 폰트 관리 서비스
 */

import { FontInfo } from '../types/upload.types';
import {
  scanAvailableFonts,
  getFontPath,
  createFontMappings,
  getFontFamilies,
  getFontWeights
} from '../utils/font-utils';

export class FontService {
  private availableFonts: FontInfo[] = [];
  private isInitialized = false;

  /**
   * 폰트 시스템 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🎨 Font service already initialized');
      return;
    }

    console.log('🎨 Initializing font service...');
    this.availableFonts = await scanAvailableFonts();
    this.isInitialized = true;

    console.log(`✅ Font service initialized with ${this.availableFonts.length} fonts`);
  }

  /**
   * 사용 가능한 모든 폰트 조회
   */
  getAvailableFonts(): FontInfo[] {
    return [...this.availableFonts];
  }

  /**
   * 폰트 패밀리 목록 조회
   */
  getFontFamilies(): string[] {
    return getFontFamilies(this.availableFonts);
  }

  /**
   * 특정 패밀리의 폰트 굵기 목록 조회
   */
  getFontWeights(fontFamily: string): string[] {
    return getFontWeights(this.availableFonts, fontFamily);
  }

  /**
   * 폰트 경로 조회 (렌더링용)
   */
  getFontPath(fontFamily: string, fontWeight = '400'): string | null {
    return getFontPath(this.availableFonts, fontFamily, fontWeight);
  }

  /**
   * 폰트 매핑 생성 (렌더링용)
   */
  createFontMappings(usedFonts: Array<{ family: string, weight?: string }>): Map<string, string> {
    return createFontMappings(this.availableFonts, usedFonts);
  }

  /**
   * 폰트 재스캔
   */
  async rescanFonts(): Promise<void> {
    console.log('🔄 Rescanning fonts...');
    this.availableFonts = await scanAvailableFonts();
    console.log(`✅ Font rescan completed: ${this.availableFonts.length} fonts`);
  }

  /**
   * 특정 폰트 존재 여부 확인
   */
  hasFontFamily(fontFamily: string): boolean {
    return this.availableFonts.some(font => font.familyName === fontFamily);
  }

  /**
   * 폰트 정보 조회
   */
  getFontInfo(fontFamily: string, fontWeight?: string): FontInfo | null {
    if (fontWeight) {
      return this.availableFonts.find(font =>
        font.familyName === fontFamily && font.weight === fontWeight
      ) || null;
    }

    return this.availableFonts.find(font => font.familyName === fontFamily) || null;
  }

  /**
   * 초기화 상태 확인
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 폰트 통계 정보
   */
  getStats(): {
    totalFonts: number;
    totalFamilies: number;
    fontsByType: Record<string, number>;
  } {
    const fontsByType: Record<string, number> = {};

    this.availableFonts.forEach(font => {
      fontsByType[font.type] = (fontsByType[font.type] || 0) + 1;
    });

    return {
      totalFonts: this.availableFonts.length,
      totalFamilies: this.getFontFamilies().length,
      fontsByType
    };
  }

  /**
   * 폰트 API 응답 데이터 생성
   */
  getApiResponse(): {
    success: boolean;
    fonts: FontInfo[];
    totalCount: number;
    families: string[];
    stats: any;
  } {
    return {
      success: true,
      fonts: this.getAvailableFonts(),
      totalCount: this.availableFonts.length,
      families: this.getFontFamilies(),
      stats: this.getStats()
    };
  }
}

// 싱글톤 인스턴스
export const fontService = new FontService();
export default fontService;
