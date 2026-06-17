// 🎨 개별 프리셋 카드 컴포넌트
// 프리셋 미리보기와 적용 기능을 포함한 카드 UI

import React, { useState, useMemo } from 'react';
import { Star, StarOff, Play } from 'lucide-react';
import { TextPreset } from '../../../../types/presets/textPresets';

interface PresetCardProps {
  preset: TextPreset;
  sampleText?: string;
  onApply: (preset: TextPreset) => void;
  onToggleFavorite?: (presetId: string) => void;
  isFavorite?: boolean;
  isSelected?: boolean;
}

/**
 * 🎯 프리셋에서 CSS 스타일 생성하는 헬퍼 함수
 */
const generatePreviewStyle = (preset: TextPreset): React.CSSProperties => {
  const style: React.CSSProperties = {
    fontFamily: preset.fontFamily,
    fontSize: `${Math.min(preset.fontSize * 0.4, 24)}px`, // 미리보기용 크기 조정
    fontWeight: preset.fontWeight,
    fontStyle: preset.fontStyle || 'normal',
    textDecoration: preset.textDecoration || 'none',
    color: preset.color,
    textAlign: preset.textAlign,
    lineHeight: preset.lineHeight || 1.2,
    letterSpacing: preset.letterSpacing || 'normal',
    padding: preset.padding ? 
      `${preset.padding.top * 0.5}px ${preset.padding.right * 0.5}px ${preset.padding.bottom * 0.5}px ${preset.padding.left * 0.5}px` :
      '8px 12px',
    borderRadius: preset.borderRadius ? `${preset.borderRadius * 0.5}px` : undefined,
    border: preset.border ? 
      `${preset.border.width}px ${preset.border.style} ${preset.border.color}` : 
      undefined,
    
    // 배경 처리 - transparent가 아닌 경우에만 적용
    backgroundColor: preset.backgroundColor && preset.backgroundColor !== 'transparent' ? preset.backgroundColor : undefined,
    
    // 텍스트 그림자
    textShadow: preset.textShadow ?
      `${preset.textShadow.offsetX}px ${preset.textShadow.offsetY}px ${preset.textShadow.blur}px ${preset.textShadow.color}` :
      undefined,
    
    // 글로우 효과 (box-shadow로 구현)
    boxShadow: preset.textGlow ?
      `0 0 ${preset.textGlow.blur}px ${preset.textGlow.color}` :
      undefined,
    
    // 텍스트 스트로크 (webkit 전용)
    WebkitTextStroke: preset.textStroke ?
      `${preset.textStroke.width}px ${preset.textStroke.color}` :
      undefined,
      
    // 기타 스타일
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
 * 🎨 PresetCard - 개별 프리셋을 표시하는 카드 컴포넌트
 */
export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  sampleText = '샘플 텍스트',
  onApply,
  onToggleFavorite,
  isFavorite = false,
  isSelected = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 미리보기 스타일 메모이제이션
  const previewStyle = useMemo(() => 
    generatePreviewStyle(preset), [preset]
  );
  
  return (
    <div 
      className={`relative bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 group ${
        isSelected ? 'ring-2 ring-blue-500 bg-gray-600' : 'hover:bg-gray-600'
      } ${
        isHovered ? 'transform scale-105' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onApply(preset)}
    >
      {/* 즐겨찾기 버튼 */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(preset.id);
          }}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          {isFavorite ? 
            <Star size={14} className="text-yellow-400 fill-current" /> :
            <StarOff size={14} className="text-white" />
          }
        </button>
      )}
      
      {/* 프리셋 미리보기 */}
      <div className="p-4 h-24 flex items-center justify-center bg-gray-800">
        <div 
          style={previewStyle}
          className="text-center transition-all duration-200"
          title={`미리보기: ${sampleText}`}
        >
          {sampleText}
        </div>
      </div>
      
      {/* 프리셋 정보 - 간소화 */}
      <div className="p-3">
        <h4 className="font-medium text-white text-sm text-center truncate">
          {preset.name}
        </h4>
      </div>
      
      {/* 호버 시 적용 버튼 */}
      <div className={`absolute inset-0 bg-black/80 flex items-center justify-center transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <button 
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onApply(preset);
          }}
        >
          <Play size={16} className="fill-current" />
          <span>적용하기</span>
        </button>
      </div>
    </div>
  );
};

export default PresetCard;
