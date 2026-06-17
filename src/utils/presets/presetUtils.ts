// 🎯 프리셋 적용 유틸리티 함수들
// TextPreset을 TextClip에 적용하고 변환하는 헬퍼 함수들

import { TextClip } from '../../types/clipTypes';
import { TextPreset } from '../../types/presets/textPresets';

/**
 * 🎨 TextPreset을 TextClip에 적용하는 메인 함수
 * @param clip 적용할 텍스트 클립
 * @param preset 적용할 프리셋
 * @returns 프리셋이 적용된 클립의 업데이트 객체
 */
export const applyPresetToClip = (
  clip: TextClip, 
  preset: TextPreset
): Partial<TextClip> => {
  
  const updates: Partial<TextClip> = {
    // 기본 텍스트 속성
    fontFamily: preset.fontFamily,
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
    fontStyle: preset.fontStyle || 'normal',
    textDecoration: preset.textDecoration || 'none',
    color: preset.color,
    textAlign: preset.textAlign,
    
    // 배경 색상 (단순 색상인 경우)
    backgroundColor: preset.backgroundColor || 'transparent',
    
    // 라인 높이와 글자 간격
    lineHeight: preset.lineHeight,
    letterSpacing: preset.letterSpacing,
  };
  
  // 🎨 그라디언트 배경 처리
  if (preset.backgroundGradient) {
    // 그라디언트는 CSS에서 처리하므로 backgroundColor를 'gradient'로 표시
    // 실제 그라디언트 정보는 별도 속성으로 저장
    updates.backgroundColor = 'gradient';
    
    // 추가 속성으로 그라디언트 정보 저장 (TextClip 타입에 추가 필요시)
    // updates.backgroundGradient = preset.backgroundGradient;
  }
  
  // ✨ 텍스트 그림자 처리
  if (preset.textShadow) {
    // CSS text-shadow 형식으로 변환
    const shadow = `${preset.textShadow.offsetX}px ${preset.textShadow.offsetY}px ${preset.textShadow.blur}px ${preset.textShadow.color}`;
    
    // TextClip에 textShadow 속성이 있다면 적용
    (updates as any).textShadow = shadow;
    
    // 개별 속성으로도 저장 (향후 UI에서 편집 가능하도록)
    updates.shadowOffsetX = preset.textShadow.offsetX;
    updates.shadowOffsetY = preset.textShadow.offsetY;
    updates.shadowBlur = preset.textShadow.blur;
    updates.shadowColor = preset.textShadow.color;
  }
  
  // 🖼️ 텍스트 테두리 처리
  if (preset.textStroke) {
    updates.strokeWidth = preset.textStroke.width;
    updates.strokeColor = preset.textStroke.color;
  }
  
  // 💫 글로우 효과 처리 (textGlow가 있는 경우)
  if (preset.textGlow) {
    // 글로우는 보통 box-shadow나 특별한 CSS 효과로 구현
    (updates as any).textGlow = preset.textGlow;
  }
  
  // 📦 패딩 처리
  if (preset.padding) {
    updates.paddingTop = preset.padding.top;
    updates.paddingRight = preset.padding.right;
    updates.paddingBottom = preset.padding.bottom;
    updates.paddingLeft = preset.padding.left;
  }
  
  // 🔲 테두리 처리
  if (preset.border) {
    (updates as any).borderWidth = preset.border.width;
    (updates as any).borderColor = preset.border.color;
    (updates as any).borderStyle = preset.border.style;
  }
  
  // 📐 모서리 둥글기
  if (preset.borderRadius !== undefined) {
    (updates as any).borderRadius = preset.borderRadius;
  }
  
  return updates;
};

/**
 * 🔄 현재 TextClip의 스타일을 TextPreset으로 변환
 * @param clip 변환할 텍스트 클립
 * @param presetInfo 프리셋 메타정보 (이름, 설명 등)
 * @returns TextPreset 객체
 */
export const convertClipToPreset = (
  clip: TextClip,
  presetInfo: {
    name: string;
    description: string;
    category?: string;
    tags?: string[];
  }
): TextPreset => {
  
  const preset: TextPreset = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: presetInfo.name,
    category: (presetInfo.category as any) || 'custom',
    description: presetInfo.description,
    
    // 기본 텍스트 속성
    fontFamily: clip.fontFamily || 'Arial',
    fontSize: clip.fontSize || 24,
    fontWeight: clip.fontWeight || '400',
    fontStyle: clip.fontStyle,
    textDecoration: clip.textDecoration,
    color: clip.color || '#FFFFFF',
    textAlign: clip.textAlign || 'center',
    lineHeight: clip.lineHeight,
    letterSpacing: clip.letterSpacing,
    
    // 배경 색상
    backgroundColor: clip.backgroundColor !== 'transparent' ? clip.backgroundColor : undefined,
    
    // 그림자 효과
    textShadow: clip.shadowOffsetX !== undefined ? {
      offsetX: clip.shadowOffsetX,
      offsetY: clip.shadowOffsetY || 0,
      blur: clip.shadowBlur || 0,
      color: clip.shadowColor || '#000000'
    } : undefined,
    
    // 텍스트 테두리
    textStroke: clip.strokeWidth ? {
      width: clip.strokeWidth,
      color: clip.strokeColor || '#000000'
    } : undefined,
    
    // 패딩
    padding: clip.paddingTop !== undefined ? {
      top: clip.paddingTop,
      right: clip.paddingRight || 0,
      bottom: clip.paddingBottom || 0,
      left: clip.paddingLeft || 0
    } : undefined,
    
    // 메타데이터
    tags: presetInfo.tags || ['사용자정의'],
    popularity: 0,
    isUserCreated: true,
    createdAt: new Date().toISOString()
  };
  
  return preset;
};

/**
 * 🎨 프리셋의 CSS 스타일 생성
 * @param preset CSS 스타일로 변환할 프리셋
 * @returns React CSS 스타일 객체
 */
export const generateCSSFromPreset = (preset: TextPreset): React.CSSProperties => {
  const style: React.CSSProperties = {
    fontFamily: preset.fontFamily,
    fontSize: `${preset.fontSize}px`,
    fontWeight: preset.fontWeight,
    fontStyle: preset.fontStyle || 'normal',
    textDecoration: preset.textDecoration || 'none',
    color: preset.color,
    textAlign: preset.textAlign,
    lineHeight: preset.lineHeight || 1.2,
    letterSpacing: preset.letterSpacing || 'normal',
    
    // 배경 색상
    backgroundColor: preset.backgroundColor || 'transparent',
    
    // 패딩
    padding: preset.padding ? 
      `${preset.padding.top}px ${preset.padding.right}px ${preset.padding.bottom}px ${preset.padding.left}px` :
      undefined,
    
    // 모서리 둥글기
    borderRadius: preset.borderRadius ? `${preset.borderRadius}px` : undefined,
    
    // 테두리
    border: preset.border ?
      `${preset.border.width}px ${preset.border.style} ${preset.border.color}` :
      undefined,
    
    // 텍스트 그림자
    textShadow: preset.textShadow ?
      `${preset.textShadow.offsetX}px ${preset.textShadow.offsetY}px ${preset.textShadow.blur}px ${preset.textShadow.color}` :
      undefined,
    
    // 텍스트 테두리 (웹킷 전용)
    WebkitTextStroke: preset.textStroke ?
      `${preset.textStroke.width}px ${preset.textStroke.color}` :
      undefined,
    
    // 글로우 효과 (box-shadow로 구현)
    boxShadow: preset.textGlow ?
      `0 0 ${preset.textGlow.blur}px ${preset.textGlow.color}` :
      undefined
  };
  
  // 그라디언트 배경 처리
  if (preset.backgroundGradient) {
    const { type, angle, colors, centerX, centerY } = preset.backgroundGradient;
    
    if (type === 'linear') {
      const colorStops = colors.map(c => `${c.color} ${c.stop}%`).join(', ');
      style.background = `linear-gradient(${angle || 0}deg, ${colorStops})`;
    } else if (type === 'radial') {
      const colorStops = colors.map(c => `${c.color} ${c.stop}%`).join(', ');
      const center = `${centerX || 50}% ${centerY || 50}%`;
      style.background = `radial-gradient(circle at ${center}, ${colorStops})`;
    } else if (type === 'conic') {
      const colorStops = colors.map(c => `${c.color} ${c.stop}%`).join(', ');
      const center = `${centerX || 50}% ${centerY || 50}%`;
      style.background = `conic-gradient(from ${angle || 0}deg at ${center}, ${colorStops})`;
    }
  }
  
  return style;
};

/**
 * 📊 프리셋 호환성 검사
 * @param preset 검사할 프리셋
 * @returns 호환성 검사 결과
 */
export const validatePreset = (preset: TextPreset): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // 필수 속성 검사
  if (!preset.id) errors.push('프리셋 ID가 없습니다.');
  if (!preset.name) errors.push('프리셋 이름이 없습니다.');
  if (!preset.fontFamily) errors.push('폰트 패밀리가 없습니다.');
  if (!preset.fontSize || preset.fontSize <= 0) errors.push('올바르지 않은 폰트 크기입니다.');
  if (!preset.color) errors.push('텍스트 색상이 없습니다.');
  
  // 값 범위 검사
  if (preset.fontSize > 500) warnings.push('폰트 크기가 매우 큽니다. (500px 초과)');
  if (preset.fontSize < 8) warnings.push('폰트 크기가 매우 작습니다. (8px 미만)');
  if (preset.popularity < 0 || preset.popularity > 100) {
    warnings.push('인기도 값이 0-100 범위를 벗어났습니다.');
  }
  
  // 색상 형식 검사 - 정규표현식 수정
  const colorRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$|^rgba?\(|^hsla?\(/;
  if (!colorRegex.test(preset.color)) {
    warnings.push('텍스트 색상 형식이 올바르지 않을 수 있습니다.');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * 🔍 프리셋 간 유사도 계산
 * @param preset1 첫 번째 프리셋
 * @param preset2 두 번째 프리셋
 * @returns 0-1 사이의 유사도 점수 (1이 완전 동일)
 */
export const calculatePresetSimilarity = (
  preset1: TextPreset, 
  preset2: TextPreset
): number => {
  let score = 0;
  let totalChecks = 0;
  
  // 폰트 패밀리 비교
  totalChecks++;
  if (preset1.fontFamily === preset2.fontFamily) score++;
  
  // 폰트 크기 비교 (±10% 이내면 유사)
  totalChecks++;
  const sizeDiff = Math.abs(preset1.fontSize - preset2.fontSize) / preset1.fontSize;
  if (sizeDiff <= 0.1) score++;
  
  // 폰트 굵기 비교
  totalChecks++;
  if (preset1.fontWeight === preset2.fontWeight) score++;
  
  // 색상 비교
  totalChecks++;
  if (preset1.color === preset2.color) score++;
  
  // 배경 비교
  totalChecks++;
  if (preset1.backgroundColor === preset2.backgroundColor) score++;
  
  // 카테고리 비교
  totalChecks++;
  if (preset1.category === preset2.category) score++;
  
  return score / totalChecks;
};
