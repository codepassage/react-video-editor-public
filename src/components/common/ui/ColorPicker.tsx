/**
 * 📝 ColorPicker - 색상 선택 컴포넌트
 * 
 * React Video Editor의 표준 색상 선택 UI 컴포넌트입니다.
 * 색상 입력, 프리셋 선택, 실시간 미리보기를 제공하는 통합 색상 선택기입니다.
 * 
 * 주요 기능:
 * - 16진수 색상 코드 입력 및 검증
 * - 기본 색상 프리셋 제공 (12가지 표준 색상)
 * - 사용자 정의 프리셋 지원
 * - 실시간 색상 미리보기
 * - 투명 색상 지원
 * - 입력 유효성 검사
 * 
 * 기술적 특징:
 * - 정규식 기반 16진수 색상 검증
 * - 제어 컴포넌트 패턴
 * - TypeScript 타입 안전성
 * - 접근성을 고려한 라벨링
 * - 프리셋 그리드 레이아웃
 * 
 * 사용 사례:
 * - 텍스트 색상 설정 (TextClip)
 * - 도형 채우기 색상 (ShapeClip)
 * - 배경 색상 설정 (BackgroundColorControl)
 * - 테두리 색상 설정
 * - 그림자 색상 설정
 * 
 * @author React Video Editor Team
 * @version 1.0.0
 * @since 2024-07-13
 */

import React from 'react';

/**
 * 색상 프리셋 정의 인터페이스
 * 
 * @interface ColorPreset
 * @property {string} name - 색상의 표시 이름
 * @property {string} color - 16진수 색상 코드 (#RRGGBB)
 */
export interface ColorPreset {
  name: string;
  color: string;
}

/**
 * ColorPicker 컴포넌트의 Props 인터페이스
 * 
 * @interface ColorPickerProps
 * @property {string} label - 색상 선택기 라벨
 * @property {string} value - 현재 선택된 색상 값
 * @property {(color: string) => void} onChange - 색상 변경 콜백 함수
 * @property {boolean} [showPresets] - 프리셋 표시 여부 (기본값: true)
 * @property {ColorPreset[]} [presets] - 사용자 정의 프리셋 배열
 * @property {string} [className] - 추가 CSS 클래스
 * @property {boolean} [disabled] - 비활성화 상태
 * @property {string} [placeholder] - 입력 필드 플레이스홀더
 */
export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  showPresets?: boolean;
  presets?: ColorPreset[];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

// 기본 색상 프리셋
const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { name: '검정', color: '#000000' },
  { name: '흰색', color: '#ffffff' },
  { name: '빨간', color: '#ef4444' },
  { name: '파란', color: '#3b82f6' },
  { name: '초록', color: '#10b981' },
  { name: '노란', color: '#f59e0b' },
  { name: '보라', color: '#8b5cf6' },
  { name: '분홍', color: '#ec4899' },
  { name: '주황', color: '#f97316' },
  { name: '청록', color: '#06b6d4' },
  { name: '회색', color: '#6b7280' },
  { name: '갈색', color: '#92400e' }
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  showPresets = true,
  presets = DEFAULT_COLOR_PRESETS,
  className = '',
  disabled = false,
  placeholder = '#FFFFFF'
}) => {
  // 유효한 색상값인지 확인
  const isValidColor = (color: string): boolean => {
    if (!color) return false;
    if (color === 'transparent') return true;
    return /^#([A-Fa-f0-9]{3}){1,2}$/.test(color);
  };

  // 표시할 색상값 (유효하지 않으면 기본값 사용)
  const displayColor = isValidColor(value) ? value : placeholder;
  const hexValue = displayColor === 'transparent' ? '#000000' : displayColor;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 라벨 */}
      <label className="block text-sm text-gray-300">{label}</label>

      {/* 색상 선택 영역 */}
      <div className="bg-gray-800 rounded-lg">
        {/* 색상 피커 + 값 표시 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {/* 색상 피커 */}
            <div className="w-6 h-6 rounded border border-gray-600 overflow-hidden">
              <input
                type="color"
                value={hexValue}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full h-full border-0 cursor-pointer disabled:cursor-not-allowed"
                style={{ background: 'none' }}
              />
            </div>

            {/* 색상 값 표시 */}
            <span className="text-sm font-mono text-gray-300 min-w-[70px]">
              {displayColor.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 색상 값 텍스트 입력 */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={placeholder}
        />

        {/* 색상 프리셋 */}
        {showPresets && presets.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm text-gray-300 mb-2">색상 프리셋</label>
            <div className="grid grid-cols-6 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => onChange(preset.color)}
                  disabled={disabled}
                  className="w-8 h-8 rounded border border-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-600"
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};