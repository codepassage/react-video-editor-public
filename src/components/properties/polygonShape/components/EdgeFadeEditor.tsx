import React from 'react';
import type { TimelineClip } from '../../../../types';
import type { PolygonShapeProperties } from '../../../../types/polygonShape.types';
import { SliderWithNumber, CheckboxWithLabel, PresetGrid } from '../../../common/ui';

interface EdgeFadeEditorProps {
  clip: TimelineClip;
  edgeFade: number;
  setEdgeFade: (value: number) => void;
  fadeType: 'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right';
  setFadeType: (type: 'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right') => void;
  updatePolygonShapeProperties: (updates: Partial<PolygonShapeProperties>) => void;
}

export const EdgeFadeEditor: React.FC<EdgeFadeEditorProps> = ({
  clip,
  edgeFade,
  setEdgeFade,
  fadeType,
  setFadeType,
  updatePolygonShapeProperties
}) => {
  return (
    <div className="space-y-3">
      <CheckboxWithLabel
        label="가장자리 페이드"
        description="부드러운 가장자리 효과"
        checked={edgeFade > 0}
        onChange={(checked) => {
          const newFade = checked ? 20 : 0;
          setEdgeFade(newFade);
          updatePolygonShapeProperties({ edgeFade: newFade });
        }}
      />

      {edgeFade > 0 && (
        <div className="space-y-4">
          {/* 페이드 강도 슬라이더 */}
          <SliderWithNumber
            label="페이드 강도"
            value={edgeFade}
            min={0}
            max={100}
            step={1}
            suffix="%"
            onChange={(value) => {
              setEdgeFade(value);
              updatePolygonShapeProperties({ edgeFade: value });
            }}
          />

          <div className="text-xs text-gray-400">
            높은 값일수록 가장자리가 더 부드럽게 사라집니다
          </div>

          {/* 페이드 방향 선택 */}
          <PresetGrid
            label="페이드 방향"
            columns={2}
            items={[
              {
                name: '원형',
                value: 'radial',
                icon: '⭕',
                description: '원형',
                isSelected: fadeType === 'radial',
                selectedColor: 'blue',
                onClick: () => {
                  setFadeType('radial');
                  updatePolygonShapeProperties({ fadeType: 'radial' });
                }
              },
              {
                name: '위에서',
                value: 'linear-top',
                icon: '⬆️',
                description: '위에서',
                isSelected: fadeType === 'linear-top',
                selectedColor: 'green',
                onClick: () => {
                  setFadeType('linear-top');
                  updatePolygonShapeProperties({ fadeType: 'linear-top' });
                }
              },
              {
                name: '아래서',
                value: 'linear-bottom',
                icon: '⬇️',
                description: '아래서',
                isSelected: fadeType === 'linear-bottom',
                selectedColor: 'purple',
                onClick: () => {
                  setFadeType('linear-bottom');
                  updatePolygonShapeProperties({ fadeType: 'linear-bottom' });
                }
              },
              {
                name: '왼쪽서',
                value: 'linear-left',
                icon: '⬅️',
                description: '왼쪽서',
                isSelected: fadeType === 'linear-left',
                selectedColor: 'yellow',
                onClick: () => {
                  setFadeType('linear-left');
                  updatePolygonShapeProperties({ fadeType: 'linear-left' });
                }
              }
            ]}
          />

          <div className="text-xs text-gray-400">
            {fadeType === 'radial' && '중앙에서 바깥쪽으로 원형 페이드'}
            {fadeType === 'linear-top' && '위쪽 가장자리가 부드럽게 사라짐'}
            {fadeType === 'linear-bottom' && '아래쪽 가장자리가 부드럽게 사라짐'}
            {fadeType === 'linear-left' && '왼쪽 가장자리가 부드럽게 사라짐'}
            {fadeType === 'linear-right' && '오른쪽 가장자리가 부드럽게 사라짐'}
          </div>

          {/* 고급 Edge Fade 조절 (Multi-Stop 시스템) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-300">고급 페이드 조절</label>
              <button
                onClick={() => {
                  const currentStops = clip.polygonShapeProperties?.edgeFadeStops || [
                    { position: 0, opacity: 100 },
                    { position: edgeFade, opacity: 0 }
                  ];

                  // 새 스톱 위치 계산 (기존 스톱들 사이의 중간점)
                  const sortedStops = [...currentStops].sort((a, b) => a.position - b.position);
                  let newPosition = 50;

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
                        bestPosition = Math.min(lastPosition + 15, 100);
                      } else {
                        const firstPosition = sortedStops[0].position;
                        bestPosition = Math.max(firstPosition - 15, 0);
                      }
                    }

                    newPosition = Math.round(bestPosition);
                  }

                  const newStop = { position: newPosition, opacity: 50 };
                  const newStops = [...currentStops, newStop];

                  updatePolygonShapeProperties({
                    edgeFadeStops: newStops
                  });
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                title="페이드 조절점 추가"
              >
                + 조절점 추가
              </button>
            </div>

            {/* Edge Fade 미리보기 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">페이드 미리보기</label>
              <div
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded border border-gray-600 relative"
                style={{
                  maskImage: (() => {
                    const stops = clip.polygonShapeProperties?.edgeFadeStops || [
                      { position: 0, opacity: 100 },
                      { position: edgeFade, opacity: 0 }
                    ];

                    const sortedStops = stops.sort((a, b) => a.position - b.position);
                    const stopStr = sortedStops.map(stop => `rgba(0,0,0,${stop.opacity / 100}) ${stop.position}%`).join(', ');

                    switch (fadeType) {
                      case 'radial':
                        return `radial-gradient(circle at center, ${stopStr})`;
                      case 'linear-top':
                        return `linear-gradient(to bottom, ${stopStr})`;
                      case 'linear-bottom':
                        return `linear-gradient(to top, ${stopStr})`;
                      case 'linear-left':
                        return `linear-gradient(to right, ${stopStr})`;
                      case 'linear-right':
                        return `linear-gradient(to left, ${stopStr})`;
                      default:
                        return 'none';
                    }
                  })(),
                  WebkitMaskImage: (() => {
                    const stops = clip.polygonShapeProperties?.edgeFadeStops || [
                      { position: 0, opacity: 100 },
                      { position: edgeFade, opacity: 0 }
                    ];

                    const sortedStops = stops.sort((a, b) => a.position - b.position);
                    const stopStr = sortedStops.map(stop => `rgba(0,0,0,${stop.opacity / 100}) ${stop.position}%`).join(', ');

                    switch (fadeType) {
                      case 'radial':
                        return `radial-gradient(circle at center, ${stopStr})`;
                      case 'linear-top':
                        return `linear-gradient(to bottom, ${stopStr})`;
                      case 'linear-bottom':
                        return `linear-gradient(to top, ${stopStr})`;
                      case 'linear-left':
                        return `linear-gradient(to right, ${stopStr})`;
                      case 'linear-right':
                        return `linear-gradient(to left, ${stopStr})`;
                      default:
                        return 'none';
                    }
                  })()
                }}
              >
                {/* 조절점 인디케이터 */}
                {(clip.polygonShapeProperties?.edgeFadeStops || []).map((stop, index) => (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 w-1 bg-white bg-opacity-70 transform -translate-x-0.5"
                    style={{ left: `${stop.position}%` }}
                    title={`위치: ${stop.position}%, 투명도: ${stop.opacity}%`}
                  >
                    <div className="w-3 h-3 bg-white border-2 border-purple-500 rounded-full transform -translate-x-1 -translate-y-1" />
                  </div>
                ))}
              </div>
              <div className="mt-1 text-xs text-gray-500 text-center">
                조절점을 사용해 더 정밀한 페이드 효과를 만들 수 있습니다
              </div>
            </div>

            {/* Edge Fade 조절점 목록 */}
            <div className="space-y-3">
              {(clip.polygonShapeProperties?.edgeFadeStops || [
                { position: 0, opacity: 100 },
                { position: edgeFade, opacity: 0 }
              ]).map((stop, index) => (
                <div key={index} className="p-3 bg-gray-750 rounded border border-gray-600">
                  {/* 조절점 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-300 font-medium">
                      조절점 {index + 1}
                    </span>
                    {(clip.polygonShapeProperties?.edgeFadeStops || []).length > 2 ? (
                      <button
                        onClick={() => {
                          const currentStops = clip.polygonShapeProperties?.edgeFadeStops || [];
                          const newStops = currentStops.filter((_, i) => i !== index);
                          updatePolygonShapeProperties({
                            edgeFadeStops: newStops
                          });
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                        title="조절점 제거"
                      >
                        ×
                      </button>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <span className="text-gray-500 text-xs" title="최소 2개 조절점 필요">🔒</span>
                      </div>
                    )}
                  </div>

                  {/* 위치 조절 */}
                  <SliderWithNumber
                    label="위치"
                    value={stop.position}
                    min={0}
                    max={100}
                    step={1}
                    suffix="%"
                    onChange={(value) => {
                      const currentStops = clip.polygonShapeProperties?.edgeFadeStops || [];
                      const newStops = [...currentStops];
                      newStops[index] = { ...stop, position: value };
                      updatePolygonShapeProperties({
                        edgeFadeStops: newStops
                      });
                    }}
                  />

                  {/* 투명도 조절 */}
                  <SliderWithNumber
                    label="투명도"
                    value={stop.opacity}
                    min={0}
                    max={100}
                    step={1}
                    suffix="%"
                    onChange={(value) => {
                      const currentStops = clip.polygonShapeProperties?.edgeFadeStops || [];
                      const newStops = [...currentStops];
                      newStops[index] = { ...stop, opacity: value };
                      updatePolygonShapeProperties({
                        edgeFadeStops: newStops
                      });
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-gray-400">
              💡 조절점을 추가하여 그래디언트처럼 정밀한 페이드 효과를 만들어보세요!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
