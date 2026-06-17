import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Sparkles, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { TimelineClip, TextGradient } from '../../../types';
import { useDebounceCallback } from '../../../hooks/useDebounceCallback';

interface GradientTextEditorProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: Partial<TimelineClip>) => void;
}

/**
 * 🌈 GradientTextEditor - 독립적인 그라데이션 텍스트 효과 컴포넌트
 * 
 * 주요 기능:
 * - 그라데이션 활성화/비활성화
 * - 그라데이션 타입 선택 (linear, radial, conic)
 * - 색상 조절점 관리 (추가, 제거, 수정)
 * - 각도 및 중심점 조절
 * - 실시간 미리보기
 * - 독립적인 상태 관리로 렌더링 충돌 해결
 * 
 * 🔧 버그 해결 전략:
 * 1. 로컬 상태와 클립 상태 완전 분리
 * 2. 디바운싱을 통한 배치 업데이트
 * 3. React.memo로 불필요한 리렌더링 방지
 */
export const GradientTextEditor = React.memo<GradientTextEditorProps>(({ clip, onUpdate }) => {
  // ✅ UI 상태 (접기/펼치기)
  const [showGradient, setShowGradient] = useState(false);
  
  // 🎨 로컬 그라데이션 상태 (클립 상태와 분리)
  const [localGradient, setLocalGradient] = useState<TextGradient | null>(() => {
    return clip.textGradient || null;
  });

  // 🔄 클립 그라데이션이 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (clip.textGradient !== localGradient) {
      setLocalGradient(clip.textGradient || null);
    }
  }, [clip.textGradient]); // localGradient을 의존성에서 제거하여 무한 루프 방지

  // ⏱️ 디바운싱된 업데이트 함수 (100ms 지연)
  const debouncedGradientUpdate = useDebounceCallback((newGradient: TextGradient) => {
    onUpdate(clip.id, { textGradient: newGradient });
  }, 100);

  // 🔘 안전한 로컬 그라데이션 업데이트
  const updateLocalGradient = useCallback((updates: Partial<TextGradient>) => {
    setLocalGradient(prevGradient => {
      if (!prevGradient) return null;
      
      const newGradient = { ...prevGradient, ...updates };
      
      // 디바운싱된 실제 업데이트
      debouncedGradientUpdate(newGradient);
      
      return newGradient;
    });
  }, [debouncedGradientUpdate]);

  // 🎨 기본 그라데이션 생성
  const createDefaultGradient = useCallback((): TextGradient => {
    return {
      enabled: true,
      type: 'linear',
      angle: 45,
      centerX: 50,
      centerY: 50,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#00ff00', position: 50 },
        { color: '#0000ff', position: 100 }
      ]
    };
  }, []);

  // 🔘 그라데이션 활성화/비활성화 핸들러
  const handleGradientToggle = useCallback((enabled: boolean) => {
    if (enabled) {
      // 활성화: 새 그라데이션 생성
      const newGradient = createDefaultGradient();
      setLocalGradient(newGradient);
      onUpdate(clip.id, { textGradient: newGradient });
    } else {
      // 비활성화: 기존 그라데이션 유지하되 enabled만 false
      if (localGradient) {
        const disabledGradient = { ...localGradient, enabled: false };
        setLocalGradient(disabledGradient);
        onUpdate(clip.id, { textGradient: disabledGradient });
      }
    }
  }, [localGradient, createDefaultGradient, onUpdate, clip.id]);

  // 🎨 색상 조절점 변경 핸들러 (최적화 대상)
  const handleStopChange = useCallback((index: number, newStop: Partial<{ color: string; position: number }>) => {
    if (!localGradient?.stops) return;

    const newStops = [...localGradient.stops];
    newStops[index] = { ...newStops[index], ...newStop };
    
    updateLocalGradient({ stops: newStops });
  }, [localGradient?.stops, updateLocalGradient]);

  // ➕ 색상 조절점 추가 핸들러
  const handleAddStop = useCallback(() => {
    if (!localGradient?.stops) return;

    const newPosition = Math.min(100, (localGradient.stops.length || 0) * 25);
    const newStops = [
      ...localGradient.stops,
      { color: '#ffffff', position: newPosition }
    ];
    
    updateLocalGradient({ stops: newStops });
  }, [localGradient?.stops, updateLocalGradient]);

  // ➖ 색상 조절점 제거 핸들러
  const handleRemoveStop = useCallback((index: number) => {
    if (!localGradient?.stops || localGradient.stops.length <= 2) return;

    const newStops = localGradient.stops.filter((_, i) => i !== index);
    updateLocalGradient({ stops: newStops });
  }, [localGradient?.stops, updateLocalGradient]);

  // 🎨 그라데이션 미리보기 CSS 생성 (메모이제이션)
  const gradientPreviewCSS = useMemo(() => {
    if (!localGradient?.enabled || !localGradient.stops || localGradient.stops.length < 2) {
      return 'linear-gradient(45deg, #ff0000 0%, #0000ff 100%)';
    }

    const { type, angle, centerX, centerY, stops } = localGradient;
    const sortedStops = stops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    switch (type) {
      case 'linear':
        return `linear-gradient(${angle || 45}deg, ${sortedStops})`;
      case 'radial':
        return `radial-gradient(circle at ${centerX || 50}% ${centerY || 50}%, ${sortedStops})`;
      case 'conic':
        return `conic-gradient(from 0deg at ${centerX || 50}% ${centerY || 50}%, ${sortedStops})`;
      default:
        return `linear-gradient(45deg, ${sortedStops})`;
    }
  }, [localGradient]);

  return (
    <div className="border border-gray-600 rounded-lg">
      <button
        onClick={() => setShowGradient(!showGradient)}
        className="w-full p-3 text-left flex items-center justify-between text-white hover:bg-gray-700 transition-colors"
      >
        <span className="flex items-center space-x-2">
          <Sparkles size={16} />
          <span>그라데이션 텍스트</span>
          {localGradient?.enabled && (
            <div 
              className="w-4 h-4 rounded-full border border-gray-500"
              style={{ background: gradientPreviewCSS }}
            ></div>
          )}
        </span>
        {showGradient ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {showGradient && (
        <div className="p-4 space-y-4 border-t border-gray-600">
          {/* 그라데이션 활성화 */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">그라데이션 활성화</label>
            <input
              type="checkbox"
              checked={localGradient?.enabled || false}
              onChange={(e) => handleGradientToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
          </div>
          
          {localGradient?.enabled && (
            <>
              {/* 그라데이션 타입 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">그라데이션 타입</label>
                <select
                  value={localGradient?.type || 'linear'}
                  onChange={(e) => updateLocalGradient({ type: e.target.value as 'linear' | 'radial' | 'conic' })}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="linear">선형 그라데이션</option>
                  <option value="radial">원형 그라데이션</option>
                  <option value="conic">원뛰 그라데이션</option>
                </select>
              </div>
              
              {/* 실시간 미리보기 */}
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-300 mb-2">실시간 미리보기</div>
                <div 
                  className="h-12 rounded border border-gray-600"
                  style={{ background: gradientPreviewCSS }}
                ></div>
              </div>
              
              {/* 각도 (선형 그라데이션) */}
              {(localGradient?.type || 'linear') === 'linear' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    각도: {localGradient?.angle || 45}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={localGradient?.angle || 45}
                    onChange={(e) => updateLocalGradient({ angle: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}
              
              {/* 중심점 (원형/원뛸 그라데이션) */}
              {(localGradient?.type === 'radial' || localGradient?.type === 'conic') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">중심 X</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localGradient?.centerX || 50}
                        onChange={(e) => updateLocalGradient({ centerX: Number(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-10">
                        {localGradient?.centerX || 50}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">중심 Y</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localGradient?.centerY || 50}
                        onChange={(e) => updateLocalGradient({ centerY: Number(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-10">
                        {localGradient?.centerY || 50}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 색상 조절점 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-300">색상 조절점</label>
                  <button
                    onClick={handleAddStop}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                  >
                    <Plus size={12} /> 조절점 추가
                  </button>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(localGradient?.stops || []).map((stop, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-700 p-2 rounded">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => handleStopChange(index, { color: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) => handleStopChange(index, { position: Number(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-300 w-10">{stop.position}%</span>
                      {(localGradient?.stops || []).length > 2 && (
                        <button
                          onClick={() => handleRemoveStop(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // 🔍 React.memo 비교 함수: 그라데이션 관련 props만 비교
  return (
    prevProps.clip.id === nextProps.clip.id &&
    prevProps.clip.textGradient === nextProps.clip.textGradient
  );
});

GradientTextEditor.displayName = 'GradientTextEditor';