// 🎨 텍스트 프리셋 시스템 타입 정의
// 폰트 + 배경 + 효과를 통합한 텍스트 스타일 프리셋

export type PresetCategory = 
  | 'youtube' 
  | 'social' 
  | 'movie' 
  | 'business' 
  | 'event' 
  | 'news'
  | 'custom';

export interface TextGradient {
  type: 'linear' | 'radial' | 'conic';
  angle?: number;
  centerX?: number;
  centerY?: number;
  colors: Array<{ color: string; stop: number }>;
}

export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface TextStroke {
  width: number;
  color: string;
}

export interface TextGlow {
  blur: number;
  color: string;
  intensity?: number;
}

export interface TextBorder {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface TextPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * 📝 TextPreset - 완전한 텍스트 스타일 정의
 * 폰트부터 배경까지 모든 시각적 요소를 포함
 */
export interface TextPreset {
  // 🆔 기본 정보
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  thumbnail?: string; // 미리보기 이미지 URL (선택적)
  
  // 📝 기본 텍스트 속성
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  
  // 🎨 배경 스타일
  backgroundColor?: string;
  backgroundGradient?: TextGradient;
  
  // ✨ 고급 텍스트 효과
  textShadow?: TextShadow;
  textStroke?: TextStroke;
  textGlow?: TextGlow;
  
  // 📦 배경 박스 스타일
  borderRadius?: number;
  border?: TextBorder;
  padding?: TextPadding;
  
  // 🏷️ 메타데이터
  tags: string[];
  popularity: number; // 0-100, 인기도 점수
  isUserCreated: boolean;
  isFavorite?: boolean;
  
  // 📅 생성/수정 정보
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 🎯 프리셋 카테고리 정보
 */
export interface PresetCategoryInfo {
  id: PresetCategory;
  name: string;
  description: string;
  icon: string; // 이모지 또는 아이콘 클래스
  color: string;
  count?: number;
}

/**
 * 🔍 프리셋 검색/필터 옵션
 */
export interface PresetSearchOptions {
  query?: string;
  category?: PresetCategory;
  tags?: string[];
  favoritesOnly?: boolean;
  userCreatedOnly?: boolean;
  sortBy?: 'popularity' | 'name' | 'recent';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 🎨 프리셋 적용 결과
 */
export interface PresetApplication {
  presetId: string;
  appliedAt: string;
  previousStyle?: Partial<TextPreset>;
}

/**
 * 💾 프리셋 저장 데이터
 */
export interface SavePresetData {
  name: string;
  description: string;
  category: PresetCategory;
  tags: string[];
  isPublic?: boolean;
}

/**
 * 📊 프리셋 통계
 */
export interface PresetStats {
  totalPresets: number;
  userCreatedCount: number;
  favoriteCount: number;
  mostUsedCategory: PresetCategory;
  recentlyUsed: string[]; // 프리셋 ID 배열
}
