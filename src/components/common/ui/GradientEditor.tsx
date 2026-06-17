/**
 * 📝 GradientEditor - 고급 그래디언트 편집 컴포넌트
 * 
 * 다양한 그래디언트 효과를 생성하고 편집할 수 있는 종합적인 그래디언트 에디터입니다.
 * Linear, Radial, Conic 그래디언트를 지원하며, 실시간 미리보기와 프리셋 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 다중 그래디언트 타입 지원 (Linear, Radial, Conic)
 * - 동적 색상 스톱 관리 (추가, 제거, 이동)
 * - 실시간 미리보기 및 시각적 피드백
 * - 사전 정의된 그래디언트 프리셋
 * - 각도 및 중심점 조정 도구
 * - 색상 랜덤 생성 기능
 * - 색상 스톱 위치 최적화
 * 
 * 기술적 특징:
 * - TypeScript 타입 안전성으로 런타임 오류 방지
 * - 복잡한 그래디언트 CSS 문자열 자동 생성
 * - 성능 최적화된 색상 스톱 관리 알고리즘
 * - 모듈화된 컴포넌트 구조 (SliderWithNumber, PresetGrid 활용)
 * - 사용자 친화적인 색상 인터페이스
 * 
 * 사용 사례:
 * - 텍스트 및 도형의 배경 그래디언트
 * - 비디오 오버레이 효과
 * - UI 요소의 시각적 강조
 * - 브랜딩 색상 테마 적용
 * - 아티스틱 비주얼 이펙트
 * 
 * @author 개발팀
 * @version 2.1.0
 * @since 2024-02-10
 */

import React from 'react';
import { SliderWithNumber } from './SliderWithNumber';
import { PresetGrid, PresetGridItem } from './PresetGrid';
import type { Gradient, GradientStop, GradientType } from './types';

/**
 * GradientEditor 컴포넌트 Props 인터페이스
 * @interface GradientEditorProps
 * @property {Gradient} value - 현재 그래디언트 설정값
 * @property {(gradient: Gradient) => void} onChange - 그래디언트 변경 시 호출되는 콜백
 * @property {boolean} [showPreview] - 미리보기 표시 여부 (기본값: true)
 * @property {string} [previewHeight] - 미리보기 높이 클래스 (기본값: 'h-8')
 * @property {string} [className] - 컨테이너에 추가할 CSS 클래스
 * @property {string} [label] - 에디터 라벨 텍스트 (기본값: '그래디언트')
 * @property {boolean} [showPresets] - 프리셋 표시 여부 (기본값: true)
 */
export interface GradientEditorProps {
  value: Gradient;
  onChange: (gradient: Gradient) => void;
  showPreview?: boolean;
  previewHeight?: string;
  className?: string;
  label?: string;
  showPresets?: boolean;
}

export const GradientEditor: React.FC<GradientEditorProps> = ({
  value,
  onChange,
  showPreview = true,
  previewHeight = 'h-8',
  className = '',
  label = '그래디언트',
  showPresets = true
}) => {
  // 기본 그래디언트 값
  const defaultGradient: Gradient = {
    type: 'linear',
    angle: 0,
    centerX: 50,
    centerY: 50,
    stops: [
      { color: '#3b82f6', position: 0 },
      { color: '#1d4ed8', position: 100 }
    ]
  };

  const currentGradient = { ...defaultGradient, ...value };

  // 그래디언트 타입 변경
  const handleTypeChange = (type: GradientType) => {
    onChange({
      ...currentGradient,
      type,
      angle: type === 'linear' || type === 'conic' ? (currentGradient.angle || 0) : undefined,
      centerX: type === 'radial' || type === 'conic' ? (currentGradient.centerX || 50) : undefined,
      centerY: type === 'radial' || type === 'conic' ? (currentGradient.centerY || 50) : undefined
    });
  };

  // 속성 업데이트
  const handlePropertyChange = (property: keyof Gradient, propertyValue: any) => {
    onChange({
      ...currentGradient,
      [property]: propertyValue
    });
  };

  // 그래디언트 스톱 추가
  const addGradientStop = () => {
    const sortedStops = [...currentGradient.stops].sort((a, b) => a.position - b.position);
    let newPosition = 50;
    let newColor = '#ffffff';

    if (sortedStops.length >= 2) {
      let maxGap = 0;
      let bestPosition = 50;

      for (let i = 0; i < sortedStops.length - 1; i++) {
        const gap = sortedStops[i + 1].position - sortedStops[i].position;
        if (gap > maxGap && gap > 10) {
          maxGap = gap;
          bestPosition = sortedStops[i].position + gap / 2;
        }
      }

      if (maxGap === 0) {
        const lastPosition = sortedStops[sortedStops.length - 1].position;
        if (lastPosition < 90) {
          bestPosition = Math.min(lastPosition + 20, 100);
        } else {
          const firstPosition = sortedStops[0].position;
          bestPosition = Math.max(firstPosition - 20, 0);
        }
      }

      newPosition = Math.round(bestPosition);

      // 랜덤 색상 선택
      const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
        '#6c5ce7', '#fd79a8', '#00b894', '#e17055'
      ];
      newColor = colors[Math.floor(Math.random() * colors.length)];
    }

    const newStop: GradientStop = { color: newColor, position: newPosition };
    onChange({
      ...currentGradient,
      stops: [...currentGradient.stops, newStop]
    });
  };

  // 그래디언트 스톱 제거
  const removeGradientStop = (index: number) => {
    if (currentGradient.stops.length > 2) {
      const newStops = currentGradient.stops.filter((_, i) => i !== index);
      onChange({
        ...currentGradient,
        stops: newStops
      });
    }
  };

  // 그래디언트 스톱 업데이트
  const updateGradientStop = (index: number, stopUpdate: Partial<GradientStop>) => {
    const newStops = [...currentGradient.stops];
    newStops[index] = { ...newStops[index], ...stopUpdate };
    onChange({
      ...currentGradient,
      stops: newStops
    });
  };

  // CSS 그래디언트 문자열 생성
  const generateGradientCSS = (): string => {
    const { type, angle = 0, centerX = 50, centerY = 50, stops } = currentGradient;

    if (stops.length === 0) return '#3b82f6';

    const stopStr = stops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    switch (type) {
      case 'radial':
        return `radial-gradient(circle at ${centerX}% ${centerY}%, ${stopStr})`;
      case 'conic':
        return `conic-gradient(from ${angle}deg at ${centerX}% ${centerY}%, ${stopStr})`;
      default:
        return `linear-gradient(${angle}deg, ${stopStr})`;
    }
  };

  // 그래디언트 프리셋
  const gradientPresets: PresetGridItem[] = [
    {
      name: '일몰',
      value: 'sunset',
      onClick: () => onChange({
        type: 'linear',
        angle: 45,
        stops: [
          { color: '#ff7e5f', position: 0 },
          { color: '#feb47b', position: 100 }
        ]
      }),
      backgroundStyle: { background: 'linear-gradient(45deg, #ff7e5f, #feb47b)' }
    },
    {
      name: '바다',
      value: 'ocean',
      onClick: () => onChange({
        type: 'linear',
        angle: 45,
        stops: [
          { color: '#667eea', position: 0 },
          { color: '#764ba2', position: 100 }
        ]
      }),
      backgroundStyle: { background: 'linear-gradient(45deg, #667eea, #764ba2)' }
    },
    {
      name: '숲',
      value: 'forest',
      onClick: () => onChange({
        type: 'linear',
        angle: 45,
        stops: [
          { color: '#2ecc71', position: 0 },
          { color: '#27ae60', position: 100 }
        ]
      }),
      backgroundStyle: { background: 'linear-gradient(45deg, #2ecc71, #27ae60)' }
    },
    {
      name: '불꽃',
      value: 'fire',
      onClick: () => onChange({
        type: 'linear',
        angle: 45,
        stops: [
          { color: '#e74c3c', position: 0 },
          { color: '#f39c12', position: 100 }
        ]
      }),
      backgroundStyle: { background: 'linear-gradient(45deg, #e74c3c, #f39c12)' }
    },
    {
      name: '하늘',
      value: 'sky',
      onClick: () => onChange({
        type: 'linear',
        angle: 45,
        stops: [
          { color: '#3498db', position: 0 },
          { color: '#9b59b6', position: 100 }
        ]
      }),
      backgroundStyle: { background: 'linear-gradient(45deg, #3498db, #9b59b6)' }
    },
    {
      name: '금속',
      value: 'metal',
      onClick: () => onChange({
        type: 'linear',
        angle: 45,
        stops: [
          { color: '#34495e', position: 0 },
          { color: '#2c3e50', position: 100 }
        ]
      }),
      backgroundStyle: { background: 'linear-gradient(45deg, #34495e, #2c3e50)' }
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-sm text-gray-300">{label}</label>
      )}

      {/* 그래디언트 타입 선택 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">타입</label>
        <select
          value={currentGradient.type}
          onChange={(e) => handleTypeChange(e.target.value as GradientType)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
          <option value="conic">Conic</option>
        </select>
      </div>

      {/* 각도 (Linear/Conic) */}
      {(currentGradient.type === 'linear' || currentGradient.type === 'conic') && (
        <SliderWithNumber
          label="각도"
          value={currentGradient.angle || 0}
          min={0}
          max={360}
          step={1}
          suffix="°"
          onChange={(angle) => handlePropertyChange('angle', angle)}
        />
      )}

      {/* 중심점 (Radial/Conic) */}
      {(currentGradient.type === 'radial' || currentGradient.type === 'conic') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Center X</label>
            <input
              type="number"
              min="0"
              max="100"
              value={currentGradient.centerX || 50}
              onChange={(e) => handlePropertyChange('centerX', Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Center Y</label>
            <input
              type="number"
              min="0"
              max="100"
              value={currentGradient.centerY || 50}
              onChange={(e) => handlePropertyChange('centerY', Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
      )}

      {/* 그래디언트 미리보기 */}
      {showPreview && (
        <div>
          <label className="block text-sm text-gray-300 mb-2">미리보기</label>
          <div
            className={`w-full ${previewHeight} rounded border border-gray-600 relative`}
            style={{ background: generateGradientCSS() }}
          >
            {/* 색상 스톱 인디케이터 */}
            {currentGradient.stops.map((stop, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 w-1 bg-black bg-opacity-50 transform -translate-x-0.5"
                style={{ left: `${stop.position}%` }}
                title={`${stop.color} at ${stop.position}%`}
              >
                <div className="w-2 h-2 bg-white border border-gray-800 rounded-full transform -translate-x-0.5 -translate-y-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 색상 스톱 관리 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-gray-300">
            색상 스톱 ({currentGradient.stops.length}개)
          </label>
          <button
            onClick={addGradientStop}
            className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
            title="색상 스톱 추가"
          >
            + 색상 추가
          </button>
        </div>

        <div className="space-y-3">
          {currentGradient.stops.map((stop, index) => (
            <div key={index} className="p-3 bg-gray-750 rounded border border-gray-600">
              {/* 색상 선택 */}
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateGradientStop(index, { color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-500"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={stop.color}
                    onChange={(e) => updateGradientStop(index, { color: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
                    placeholder="#ffffff"
                  />
                </div>
                {currentGradient.stops.length > 2 ? (
                  <button
                    onClick={() => removeGradientStop(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors min-w-[40px]"
                    title="색상 스톱 제거"
                  >
                    ×
                  </button>
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-gray-500 text-sm" title="최소 2개 색상 필요">🔒</span>
                  </div>
                )}
              </div>

              {/* 위치 슬라이더 */}
              <SliderWithNumber
                label="위치"
                value={stop.position}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(position) => updateGradientStop(index, { position })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 그래디언트 프리셋 */}
      {showPresets && (
        <PresetGrid
          title="프리셋"
          items={gradientPresets}
          columns={3}
        />
      )}
    </div>
  );
};