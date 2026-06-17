/**
 * 텍스트 관련 기본값 상수
 * Single Source of Truth for text styling defaults
 */

export const DEFAULT_FONT_SIZE = 29;
export const DEFAULT_FONT_FAMILY = 'Arial';
export const DEFAULT_TEXT_COLOR = '#ffffff';
export const DEFAULT_LINE_HEIGHT = 1.2;
export const DEFAULT_LETTER_SPACING = 0;
export const DEFAULT_TEXT_ALIGN = 'left';
export const DEFAULT_FONT_WEIGHT = 'normal';

// Sentence 클립 전용 기본값
export const SENTENCE_DEFAULTS = {
  fontSize: DEFAULT_FONT_SIZE,
  fontFamily: DEFAULT_FONT_FAMILY,
  color: DEFAULT_TEXT_COLOR,
  lineHeight: DEFAULT_LINE_HEIGHT,
  letterSpacing: DEFAULT_LETTER_SPACING,
  textAlign: DEFAULT_TEXT_ALIGN,
  fontWeight: DEFAULT_FONT_WEIGHT,
  textDecoration: 'none',
  textTransform: 'none'
} as const;

// 미리보기용 축소 비율
export const PREVIEW_SCALE = 0.6;
export const MIN_PREVIEW_FONT_SIZE = 12;
