/**
 * 폰트 관련 유틸리티
 */

import fs from 'fs-extra';
import path from 'path';
import { FontInfo } from '../types/upload.types';
import { appConfig } from '../config/app.config';

/**
 * 파일명에서 폰트 패밀리명 추출
 */
export function extractFontFamily(filename: string): string {
  const basename = path.basename(filename, path.extname(filename));

  // BM 폰트 패턴
  if (basename.includes('BMDOHYEON') || basename.includes('BMDoHyeon')) return 'BM DoHyeon';
  if (basename.includes('BMEULJIROTTF') || basename.includes('BMEuljiro')) return 'BM Euljiro';
  if (basename.includes('BMEuljiro10yearslater')) return 'BM Euljiro 10years Later';
  if (basename.includes('BMEuljirooraeorae')) return 'BM Euljiro Oraeorae';
  if (basename.includes('BMHANNAAir')) return 'BM Hanna Air';
  if (basename.includes('BMHANNAPro')) return 'BM Hanna Pro';
  if (basename.includes('BMHANNA_11yrs')) return 'BM Hanna 11years';
  if (basename.includes('BMJUA')) return 'BM Jua';
  if (basename.includes('BMKIRANGHAERANG')) return 'BM Kirang Haerang';
  if (basename.includes('BMKkubulim')) return 'BM Kkubulim';
  if (basename.includes('BMYEONSUNG')) return 'BM Yeonsung';

  // 나눔 폰트 패턴
  if (basename.includes('NanumGothic')) {
    if (basename.includes('Eco')) return 'Nanum Gothic Eco';
    return 'Nanum Gothic';
  }
  if (basename.includes('NanumBarunGothic')) {
    if (basename.includes('YetHangul')) return 'Nanum Barun Gothic YetHangul';
    return 'Nanum Barun Gothic';
  }
  if (basename.includes('NanumMyeongjo')) {
    if (basename.includes('Eco')) return 'Nanum Myeongjo Eco';
    if (basename.includes('YetHangul')) return 'Nanum Myeongjo YetHangul';
    return 'Nanum Myeongjo';
  }
  if (basename.includes('NanumSquare')) {
    if (basename.includes('Round')) return 'Nanum Square Round';
    if (basename.includes('Neo')) return 'Nanum Square Neo';
    return 'Nanum Square';
  }
  if (basename.includes('NanumBarunpen') || basename.includes('NanumBarunPen')) return 'Nanum Barun Pen';
  if (basename.includes('NanumBrush')) return 'Nanum Brush';
  if (basename.includes('NanumPen')) return 'Nanum Pen';
  if (basename.includes('NanumHuman')) return 'Nanum Human';
  if (basename.includes('D2Coding')) return 'D2 Coding';

  // 기본값: 파일명 그대로 (공백과 특수문자 정리)
  return basename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * 파일명에서 폰트 굵기 추출
 */
export function extractFontWeight(filename: string): string {
  const basename = filename.toLowerCase();

  if (basename.includes('extralight') || basename.includes('el')) return '200';
  if (basename.includes('light') || basename.includes('lt')) return '300';
  if (basename.includes('regular') || basename.includes('rg') || basename.includes('_r.') || basename.endsWith('r.ttf')) return '400';
  if (basename.includes('medium') || basename.includes('md')) return '500';
  if (basename.includes('semibold') || basename.includes('sb')) return '600';
  if (basename.includes('bold') || basename.includes('bd') || basename.includes('_b.') || basename.endsWith('b.ttf')) return '700';
  if (basename.includes('extrabold') || basename.includes('eb') || basename.includes('_eb.') || basename.endsWith('eb.ttf')) return '800';
  if (basename.includes('heavy') || basename.includes('hv') || basename.includes('black')) return '900';

  return '400'; // 기본값
}

/**
 * 폰트 디렉토리 재귀 스캔
 */
export async function scanFontDirectory(dir: string, basePath = ''): Promise<FontInfo[]> {
  const fonts: FontInfo[] = [];

  try {
    if (!(await fs.pathExists(dir))) {
      console.warn('⚠️ Font directory not found:', dir);
      return fonts;
    }

    const items = await fs.readdir(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        // 하위 디렉토리 재귀 스캔
        const subFonts = await scanFontDirectory(itemPath, `${basePath}${item}/`);
        fonts.push(...subFonts);
      } else if (appConfig.supportedFontTypes.some(ext => item.toLowerCase().endsWith(ext))) {
        // 폰트 파일 정보 추출
        const fontInfo: FontInfo = {
          filename: item,
          path: `${basePath}${item}`,
          fullPath: `/font/${basePath}${item}`,
          absolutePath: itemPath,
          type: path.extname(item).toLowerCase(),
          familyName: extractFontFamily(item),
          weight: extractFontWeight(item),
          size: stat.size
        };
        fonts.push(fontInfo);
      }
    }

    return fonts;
  } catch (error) {
    console.error('❌ Font directory scan failed:', error);
    return [];
  }
}

/**
 * 사용 가능한 폰트 스캔
 */
export async function scanAvailableFonts(): Promise<FontInfo[]> {
  try {
    const fonts = await scanFontDirectory(appConfig.paths.fonts);
    console.log(`🎨 Font system initialized: ${fonts.length} fonts available`);

    // 폰트 패밀리별로 그룹화해서 출력
    const fontFamilies = [...new Set(fonts.map(f => f.familyName))];
    console.log('🎨 Available font families:', fontFamilies.slice(0, 10).join(', ') + (fontFamilies.length > 10 ? '...' : ''));

    return fonts;
  } catch (error) {
    console.error('❌ Font scanning failed:', error);
    return [];
  }
}

/**
 * 폰트 경로 매핑 (렌더링용)
 */
export function getFontPath(availableFonts: FontInfo[], fontFamily: string, fontWeight = '400'): string | null {
  // 정확한 매치 (패밀리 + 굵기)
  const exactMatch = availableFonts.find(font =>
    font.familyName === fontFamily && font.weight === fontWeight
  );

  if (exactMatch) {
    return exactMatch.absolutePath;
  }

  // 패밀리만 매치 (굵기 상관없이)
  const familyMatch = availableFonts.find(font => font.familyName === fontFamily);
  if (familyMatch) {
    return familyMatch.absolutePath;
  }

  return null;
}

/**
 * 폰트 매핑 생성 (렌더링용)
 */
export function createFontMappings(availableFonts: FontInfo[], usedFonts: Array<{ family: string, weight?: string }>): Map<string, string> {
  const fontMappings = new Map<string, string>();

  usedFonts.forEach(font => {
    const fontPath = getFontPath(availableFonts, font.family, font.weight);
    if (fontPath) {
      const key = `${font.family}-${font.weight || '400'}`;
      fontMappings.set(key, fontPath);
      console.log(`🎨 Font mapping: ${font.family} -> ${fontPath}`);
    } else {
      console.warn(`⚠️ Font not found: ${font.family} (weight: ${font.weight || '400'})`);
    }
  });

  return fontMappings;
}

/**
 * 폰트 패밀리 목록 조회
 */
export function getFontFamilies(availableFonts: FontInfo[]): string[] {
  const families = new Set<string>();
  availableFonts.forEach(font => families.add(font.familyName));
  return Array.from(families).sort();
}

/**
 * 특정 패밀리의 폰트 굵기 목록 조회
 */
export function getFontWeights(availableFonts: FontInfo[], fontFamily: string): string[] {
  const weights = new Set<string>();
  availableFonts
    .filter(font => font.familyName === fontFamily)
    .forEach(font => weights.add(font.weight));
  return Array.from(weights).sort();
}

/**
 * 폰트 정보 검증
 */
export function validateFontInfo(fontInfo: FontInfo): boolean {
  return !!(
    fontInfo.filename &&
    fontInfo.familyName &&
    fontInfo.weight &&
    fontInfo.absolutePath
  );
}
