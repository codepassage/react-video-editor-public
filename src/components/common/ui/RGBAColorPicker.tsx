/**
 * 📝 RGBAColorPicker - 고급 RGBA 색상 선택 컴포넌트
 * 
 * 알파(투명도) 채널을 포함한 완전한 RGBA 색상을 선택하고 편집할 수 있는 종합적인 색상 피커입니다.
 * Hex와 RGBA 포맷 간 자동 변환을 지원하며, 실시간 미리보기와 투명도 시각화를 제공합니다.
 * 
 * 주요 기능:
 * - RGBA 및 Hex 색상 포맷 지원
 * - 실시간 알파 채널(투명도) 조정
 * - 시각적 투명도 미리보기 (체커보드 패턴)
 * - 색상 피커와 텍스트 입력 이중 인터페이스
 * - 자동 색상 포맷 파싱 및 변환
 * - 퍼센트 기반 투명도 표시
 * 
 * 기술적 특징:
 * - React hooks (useState, useEffect)로 상태 관리
 * - 정규표현식 기반 RGBA 파싱
 * - 실시간 색상 포맷 변환 알고리즘
 * - TypeScript 완전 타입 안전성
 * - 성능 최적화된 렌더링
 * - CSS 체커보드 패턴으로 투명도 시각화
 * 
 * 사용 사례:
 * - 텍스트 색상 및 배경색 설정
 * - 반투명 오버레이 효과
 * - 그래디언트 색상 스톱 편집
 * - 도형 및 그래픽 요소 색상
 * - 그림자 및 테두리 색상
 * 
 * @author 개발팀
 * @version 1.8.0
 * @since 2024-01-25
 */

import React, { useState, useEffect } from 'react';

/**
 * RGBAColorPicker 컴포넌트 Props 인터페이스
 * @interface RGBAColorPickerProps
 * @property {string} label - 색상 피커의 라벨 텍스트
 * @property {string} value - 현재 색상값 (rgba(r,g,b,a) 또는 #hex 포맷)
 * @property {(color: string) => void} onChange - 색상 변경 시 호출되는 콜백 함수
 * @property {string} [className] - 컨테이너에 추가할 CSS 클래스
 * @property {boolean} [disabled] - 컴포넌트 비활성화 여부 (기본값: false)
 */
export interface RGBAColorPickerProps {
  label: string;
  value: string; // rgba(r,g,b,a) or #hex
  onChange: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * RGBA 색상 객체 인터페이스
 * @interface RGBA
 * @property {number} r - 빨간색 채널 (0-255)
 * @property {number} g - 녹색 채널 (0-255)
 * @property {number} b - 파란색 채널 (0-255)
 * @property {number} a - 알파 채널/투명도 (0-1)
 */
interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// 색상 문자열을 RGBA 객체로 변환
const parseColor = (color: string): RGBA => {
  if (color.startsWith('#')) {
    // Hex to RGB
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  } else if (color.startsWith('rgba')) {
    // Parse rgba(r, g, b, a)
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }
  }
  
  // 기본값
  return { r: 0, g: 0, b: 0, a: 0.3 };
};

// RGBA 객체를 문자열로 변환
const rgbaToString = (rgba: RGBA): string => {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
};

// RGB를 Hex로 변환
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

export const RGBAColorPicker: React.FC<RGBAColorPickerProps> = ({
  label,
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  const [rgba, setRgba] = useState<RGBA>(parseColor(value));
  
  // value prop이 변경되면 내부 상태 업데이트
  useEffect(() => {
    setRgba(parseColor(value));
  }, [value]);
  
  // RGBA 값이 변경되면 부모에게 알림
  const handleRGBAChange = (newRgba: RGBA) => {
    setRgba(newRgba);
    onChange(rgbaToString(newRgba));
  };
  
  // 색상 피커 변경 핸들러
  const handleColorChange = (hexColor: string) => {
    const newRgba = parseColor(hexColor);
    handleRGBAChange({ ...newRgba, a: rgba.a }); // 기존 투명도 유지
  };
  
  // 투명도 변경 핸들러
  const handleAlphaChange = (alpha: number) => {
    handleRGBAChange({ ...rgba, a: alpha });
  };
  
  // 텍스트 입력 핸들러
  const handleTextChange = (text: string) => {
    onChange(text);
  };
  
  const hexColor = rgbToHex(rgba.r, rgba.g, rgba.b);
  const alphaPercent = Math.round(rgba.a * 100);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* 라벨 */}
      <label className="block text-sm text-gray-300">{label}</label>
      
      <div className="space-y-3">
        {/* 색상 피커와 미리보기 */}
        <div className="flex items-center space-x-3">
          {/* 색상 피커 */}
          <div className="w-10 h-10 rounded border border-gray-600 overflow-hidden">
            <input
              type="color"
              value={hexColor}
              onChange={(e) => handleColorChange(e.target.value)}
              disabled={disabled}
              className="w-full h-full border-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
          
          {/* 미리보기 (투명도 포함) */}
          <div 
            className="w-10 h-10 rounded border border-gray-600"
            style={{
              background: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                          linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                          linear-gradient(45deg, transparent 75%, #ccc 75%), 
                          linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }}
          >
            <div 
              className="w-full h-full rounded"
              style={{ backgroundColor: rgbaToString(rgba) }}
            />
          </div>
          
          {/* 색상 정보 표시 */}
          <div className="text-sm text-gray-300">
            <div className="font-mono">{hexColor.toUpperCase()}</div>
            <div className="text-xs">{alphaPercent}% opacity</div>
          </div>
        </div>
        
        {/* 투명도 슬라이더 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Opacity</label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="100"
              value={alphaPercent}
              onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
              disabled={disabled}
              className="flex-1"
            />
            <span className="text-white text-sm w-12">{alphaPercent}%</span>
          </div>
        </div>
        
        {/* RGBA 텍스트 입력 */}
        <input
          type="text"
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
          placeholder="rgba(0, 0, 0, 0.5)"
        />
      </div>
    </div>
  );
};