import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { GradientEditorProps, GradientStop } from './types';

export const GradientEditor: React.FC<GradientEditorProps> = ({ backgroundColor, onChange }) => {
  // 그라데이션 조절점 상태
  const [gradientStops, setGradientStops] = useState<GradientStop[]>(() => {
    if (backgroundColor?.includes('gradient')) {
      // 기존 그라데이션에서 색상 조절점 추출
      const matches = backgroundColor.match(/#[0-9a-fA-F]{6}[^,]*\d+%/g);
      if (matches) {
        return matches.map((match, index) => {
          const colorMatch = match.match(/#[0-9a-fA-F]{6}/);
          const positionMatch = match.match(/(\d+)%/);
          return {
            color: colorMatch ? colorMatch[0] : '#000000',
            position: positionMatch ? parseInt(positionMatch[1]) : index * 50
          };
        });
      }
    }
    return [
      { color: '#000000', position: 0 },
      { color: '#ffffff', position: 100 }
    ];
  });

  // 그라데이션 CSS 생성 함수
  const generateGradientCSS = useCallback((type: string, angle: number, stops: GradientStop[]) => {
    const sortedStops = stops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    switch (type) {
      case 'linear':
        return `linear-gradient(${angle}deg, ${sortedStops})`;
      case 'radial':
        return `radial-gradient(circle, ${sortedStops})`;
      case 'conic':
        return `conic-gradient(from 0deg, ${sortedStops})`;
      default:
        return `linear-gradient(${angle}deg, ${sortedStops})`;
    }
  }, []);

  // 그라데이션 조절점 추가
  const addGradientStop = useCallback(() => {
    const newPosition = gradientStops.length > 1
      ? Math.min(100, (gradientStops[gradientStops.length - 1].position + gradientStops[gradientStops.length - 2].position) / 2 + 25)
      : 50;

    const newStops = [...gradientStops, { color: '#ffffff', position: newPosition }];
    setGradientStops(newStops);

    // 현재 그라데이션 타입과 각도 추출
    const currentBg = backgroundColor || 'linear-gradient(45deg, #000000, #ffffff)';
    const isLinear = currentBg.includes('linear-gradient');
    const isRadial = currentBg.includes('radial-gradient');
    const isConic = currentBg.includes('conic-gradient');

    let type = 'linear';
    let angle = 45;

    if (isLinear) {
      type = 'linear';
      const angleMatch = currentBg.match(/linear-gradient\((\d+)deg/);
      angle = angleMatch ? parseInt(angleMatch[1]) : 45;
    } else if (isRadial) {
      type = 'radial';
    } else if (isConic) {
      type = 'conic';
    }

    const newGradient = generateGradientCSS(type, angle, newStops);
    onChange(newGradient);
  }, [gradientStops, generateGradientCSS, backgroundColor, onChange]);

  // 그라데이션 조절점 삭제
  const removeGradientStop = useCallback((index: number) => {
    if (gradientStops.length <= 2) return; // 최소 2개는 유지

    const newStops = gradientStops.filter((_, i) => i !== index);
    setGradientStops(newStops);

    // 현재 그라데이션 타입과 각도 추출
    const currentBg = backgroundColor || 'linear-gradient(45deg, #000000, #ffffff)';
    const isLinear = currentBg.includes('linear-gradient');
    const isRadial = currentBg.includes('radial-gradient');
    const isConic = currentBg.includes('conic-gradient');

    let type = 'linear';
    let angle = 45;

    if (isLinear) {
      type = 'linear';
      const angleMatch = currentBg.match(/linear-gradient\((\d+)deg/);
      angle = angleMatch ? parseInt(angleMatch[1]) : 45;
    } else if (isRadial) {
      type = 'radial';
    } else if (isConic) {
      type = 'conic';
    }

    const newGradient = generateGradientCSS(type, angle, newStops);
    onChange(newGradient);
  }, [gradientStops, generateGradientCSS, backgroundColor, onChange]);

  // 그라데이션 조절점 업데이트
  const updateGradientStop = useCallback((index: number, updates: Partial<GradientStop>) => {
    const newStops = gradientStops.map((stop, i) =>
      i === index ? { ...stop, ...updates } : stop
    );
    setGradientStops(newStops);

    // 현재 그라데이션 타입과 각도 추출
    const currentBg = backgroundColor || 'linear-gradient(45deg, #000000, #ffffff)';
    const isLinear = currentBg.includes('linear-gradient');
    const isRadial = currentBg.includes('radial-gradient');
    const isConic = currentBg.includes('conic-gradient');

    let type = 'linear';
    let angle = 45;

    if (isLinear) {
      type = 'linear';
      const angleMatch = currentBg.match(/linear-gradient\((\d+)deg/);
      angle = angleMatch ? parseInt(angleMatch[1]) : 45;
    } else if (isRadial) {
      type = 'radial';
    } else if (isConic) {
      type = 'conic';
    }

    const newGradient = generateGradientCSS(type, angle, newStops);
    onChange(newGradient);
  }, [gradientStops, generateGradientCSS, backgroundColor, onChange]);

  // 그라데이션 타입 변경
  const handleGradientTypeChange = (type: string) => {
    const angle = type === 'linear' ? 45 : 0;
    const newGradient = generateGradientCSS(type, angle, gradientStops);
    onChange(newGradient);
  };

  // 그라데이션 각도 변경 (선형 그라데이션용)
  const handleAngleChange = (angle: number) => {
    const newGradient = generateGradientCSS('linear', angle, gradientStops);
    onChange(newGradient);
  };

  // 현재 그라데이션 정보 추출
  const currentGradientType = backgroundColor?.includes('radial-gradient') ? 'radial' 
    : backgroundColor?.includes('conic-gradient') ? 'conic' 
    : 'linear';

  const currentAngle = backgroundColor?.includes('linear-gradient') 
    ? (() => {
        const match = backgroundColor.match(/linear-gradient\((\d+)deg/);
        return match ? parseInt(match[1]) : 45;
      })()
    : 45;

  return (
    <div className="space-y-4">
      {/* 그라데이션 타입 선택 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">그라데이션 타입</label>
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleGradientTypeChange('linear')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              currentGradientType === 'linear'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            선형
          </button>
          <button
            onClick={() => handleGradientTypeChange('radial')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              currentGradientType === 'radial'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            원형
          </button>
          <button
            onClick={() => handleGradientTypeChange('conic')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              currentGradientType === 'conic'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            원뿔형
          </button>
        </div>
      </div>

      {/* 선형 그라데이션 각도 조절 */}
      {currentGradientType === 'linear' && (
        <div>
          <label className="block text-sm text-gray-300 mb-2">각도</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="360"
              value={currentAngle}
              onChange={(e) => handleAngleChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-300 w-12 text-center">
              {currentAngle}°
            </span>
          </div>
        </div>
      )}

      {/* 색상 조절점 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-200">색상 조절점</label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">{gradientStops.length}개</span>
            <button
              onClick={addGradientStop}
              className="p-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              title="조절점 추가"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* 조절점 목록 */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {gradientStops.map((stop, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-2 bg-gray-700 rounded border border-gray-600"
            >
              {/* 색상 선택 */}
              <div className="flex items-center space-x-1">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateGradientStop(index, { color: e.target.value })}
                  className="w-6 h-6 rounded border border-gray-500 cursor-pointer"
                />
                <input
                  type="text"
                  value={stop.color}
                  onChange={(e) => updateGradientStop(index, { color: e.target.value })}
                  className="w-16 px-1 py-1 bg-gray-600 text-white rounded text-xs font-mono"
                />
              </div>

              {/* 위치 조절 */}
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(e) => updateGradientStop(index, { position: Number(e.target.value) })}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-300 w-8 text-center">
                  {stop.position}%
                </span>
              </div>

              {/* 삭제 버튼 */}
              {gradientStops.length > 2 && (
                <button
                  onClick={() => removeGradientStop(index)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  title="조절점 삭제"
                >
                  <Minus size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 그라데이션 미리보기 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">미리보기</label>
        <div
          className="w-full h-16 rounded border border-gray-600"
          style={{ background: backgroundColor }}
        />
      </div>

      {/* 그라데이션 프리셋 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">프리셋</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: '일몰', gradient: 'linear-gradient(45deg, #ff7e5f, #feb47b)' },
            { name: '바다', gradient: 'linear-gradient(45deg, #667eea, #764ba2)' },
            { name: '숲', gradient: 'linear-gradient(45deg, #2ecc71, #27ae60)' },
            { name: '불꽃', gradient: 'linear-gradient(45deg, #e74c3c, #f39c12)' },
            { name: '하늘', gradient: 'linear-gradient(45deg, #3498db, #9b59b6)' },
            { name: '금속', gradient: 'linear-gradient(45deg, #34495e, #2c3e50)' }
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.gradient)}
              className="p-2 rounded border border-gray-600 hover:border-gray-400 transition-colors"
              style={{ background: preset.gradient }}
              title={preset.name}
            >
              <div className="text-xs text-white font-medium bg-black/50 rounded px-1">
                {preset.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradientEditor;
