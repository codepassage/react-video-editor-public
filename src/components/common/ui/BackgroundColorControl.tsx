/**
 * 📝 BackgroundColorControl - 배경 색상 제어 컴포넌트
 * 
 * React Video Editor의 통합 배경 색상 제어 UI 컴포넌트입니다.
 * 단색, 그래디언트, 투명 배경을 모두 지원하는 다목적 색상 컨트롤러입니다.
 * 
 * 주요 기능:
 * - 투명 배경 토글 지원
 * - 단색과 그래디언트 간 전환
 * - CSS 그래디언트 문자열 파싱 및 생성
 * - 다양한 그래디언트 타입 (linear, radial, conic) 지원
 * - 사용자 정의 프리셋 지원
 * 
 * 기술적 특징:
 * - CSS gradient 문자열과 Gradient 객체 간 양방향 변환
 * - 정규식 기반 그래디언트 파싱
 * - 타입 안전한 색상 값 처리
 * - 조건부 UI 렌더링으로 사용자 경험 최적화
 * 
 * 사용 사례:
 * - 클립 배경색 설정 (VideoClip, ImageClip 등)
 * - 텍스트 배경 설정 (TextClip)
 * - 도형 채우기 설정 (ShapeClip)
 * - 전체 프로젝트 배경 설정
 * 
 * 연관 컴포넌트:
 * - ColorPicker: 단색 선택
 * - GradientEditor: 그래디언트 편집
 * - TabControl: 배경 타입 전환
 * - CheckboxWithLabel: 투명 배경 토글
 * 
 * @author React Video Editor Team
 * @version 1.0.0
 * @since 2024-07-13
 */

import React from 'react';
import { ColorPicker } from './ColorPicker';
import { TabControl } from './TabControl';
import { CheckboxWithLabel } from './CheckboxWithLabel';
import { GradientEditor } from './GradientEditor';
import { Gradient } from './types';

/**
 * BackgroundColorControl 컴포넌트의 Props 인터페이스
 * 
 * @interface BackgroundColorControlProps
 * @property {string} [label] - 컨트롤 라벨 텍스트 (기본값: '배경 설정')
 * @property {string} [value] - 현재 배경값 (CSS 색상/그래디언트 문자열 또는 'transparent')
 * @property {(value: string) => void} onChange - 배경값 변경 콜백 함수
 * @property {boolean} [allowTransparent] - 투명 배경 허용 여부 (기본값: true)
 * @property {boolean} [allowGradient] - 그래디언트 배경 허용 여부 (기본값: true)
 * @property {string} [className] - 추가 CSS 클래스명
 */
export interface BackgroundColorControlProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  allowTransparent?: boolean;
  allowGradient?: boolean;
  className?: string;
}

export const BackgroundColorControl: React.FC<BackgroundColorControlProps> = ({
  label = '배경 설정',
  value,
  onChange,
  allowTransparent = true,
  allowGradient = true,
  className = ''
}) => {
  // 현재 배경 타입 판단
  const isTransparent = !value || value === 'transparent';
  const isGradient = typeof value === 'string' && value.includes('gradient');
  const isSolid = !isTransparent && !isGradient;

  // 투명 배경 토글
  const handleTransparentToggle = (checked: boolean) => {
    if (checked) {
      onChange('transparent');
    } else {
      onChange('#000000');
    }
  };

  // 배경 타입 변경 (단색/그래디언트)
  const handleTypeChange = (type: string) => {
    if (type === 'solid' && isGradient) {
      onChange('#000000');
    } else if (type === 'gradient' && !isGradient) {
      onChange('linear-gradient(45deg, #000000, #ffffff)');
    }
  };

  // 단색 색상 변경
  const handleSolidColorChange = (color: string) => {
    onChange(color);
  };

  // CSS 그래디언트 문자열을 Gradient 객체로 파싱
  const parseGradientString = (gradientString: string): Gradient => {
    // 기본값
    const defaultGradient: Gradient = {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#000000', position: 0 },
        { color: '#ffffff', position: 100 }
      ]
    };

    if (!gradientString || !gradientString.includes('gradient')) {
      return defaultGradient;
    }

    // 타입 판단
    let type: 'linear' | 'radial' | 'conic' = 'linear';
    if (gradientString.includes('radial-gradient')) {
      type = 'radial';
    } else if (gradientString.includes('conic-gradient')) {
      type = 'conic';
    }

    // 각도 추출 (linear, conic)
    let angle = 45;
    if (type === 'linear') {
      const angleMatch = gradientString.match(/linear-gradient\((\d+)deg/);
      if (angleMatch) {
        angle = parseInt(angleMatch[1]);
      }
    } else if (type === 'conic') {
      const angleMatch = gradientString.match(/from\s+(\d+)deg/);
      if (angleMatch) {
        angle = parseInt(angleMatch[1]);
      }
    }

    // 색상 스톱 추출
    const stops: Gradient['stops'] = [];
    const colorStopPattern = /(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\))\s+(\d+)%/g;
    let match;

    while ((match = colorStopPattern.exec(gradientString)) !== null) {
      stops.push({
        color: match[1],
        position: parseInt(match[2])
      });
    }

    // 최소 2개 스톱이 필요
    if (stops.length < 2) {
      return defaultGradient;
    }

    return {
      type,
      angle: type === 'linear' || type === 'conic' ? angle : undefined,
      centerX: type === 'radial' || type === 'conic' ? 50 : undefined,
      centerY: type === 'radial' || type === 'conic' ? 50 : undefined,
      stops
    };
  };

  // 그래디언트 변경 (CSS 문자열로 변환)
  const handleGradientChange = (gradient: Gradient) => {
    const { type, angle = 0, centerX = 50, centerY = 50, stops } = gradient;

    if (stops.length === 0) {
      onChange('#000000');
      return;
    }

    const stopStr = stops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    let gradientCSS: string;
    switch (type) {
      case 'radial':
        gradientCSS = `radial-gradient(circle at ${centerX}% ${centerY}%, ${stopStr})`;
        break;
      case 'conic':
        gradientCSS = `conic-gradient(from ${angle}deg at ${centerX}% ${centerY}%, ${stopStr})`;
        break;
      default:
        gradientCSS = `linear-gradient(${angle}deg, ${stopStr})`;
    }

    onChange(gradientCSS);
  };

  return (
    <div className={`bg-gray-800 rounded-lg space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200">{label}</label>
        {allowTransparent && (
          <CheckboxWithLabel
            label="투명 배경"
            checked={isTransparent}
            onChange={handleTransparentToggle}
            className="text-sm"
          />
        )}
      </div>

      {/* 투명이 아닐 때만 배경 설정 표시 */}
      {!isTransparent && (
        <div className="space-y-4">
          {/* 배경 유형 선택 */}
          {allowGradient && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">배경 유형</label>
              <TabControl
                options={[
                  { value: 'solid', label: '단색' },
                  { value: 'gradient', label: '그래디언트' }
                ]}
                value={isGradient ? 'gradient' : 'solid'}
                onChange={handleTypeChange}
              />
            </div>
          )}

          {/* 단색 배경 설정 */}
          {isSolid && (
            <ColorPicker
              label="배경 색상"
              value={typeof value === 'string' ? value : '#000000'}
              onChange={handleSolidColorChange}
              showPresets={true}
            />
          )}

          {/* 그래디언트 배경 설정 */}
          {isGradient && allowGradient && (
            <GradientEditor
              value={parseGradientString(value || '')}
              onChange={handleGradientChange}
              showPresets={true}
              label="그래디언트"
            />
          )}
        </div>
      )}
    </div>
  );
};