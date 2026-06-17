/**
 * 다각형 셰이프의 그림자 효과 편집기 컴포넌트
 * @description 다각형 셰이프에 드롭 셐도우와 이너 셐도우 효과를 적용하는 전용 편집 인터페이스
 * 
 * 주요 기능:
 * - 드롭 셐도우 (Drop Shadow) 효과 설정
 *   - X/Y 오프셋 조정
 *   - 블러 강도 조정 (0-50px)
 *   - RGBA 색상 및 투명도 조정
 * - 이너 셐도우 (Inner Shadow) 효과 설정
 *   - 내부 그림자로 입체감 추가
 *   - 더 세밀한 블러 조정 (0-30px)
 * - 실시간 색상 선택기 통합
 * - 기본값 자동 설정 및 매개변수 초기화
 * 
 * 사용 사례:
 * - 셰이프에 깊이감과 입체감 부여
 * - UI 요소의 시각적 계층 구조 표현
 * - 디자인 품질 향상을 위한 미세 효과 조정
 */

import React from 'react';
import { PolygonShapeProperties } from '../../../types/polygonShape.types';
import { RGBAColorPicker } from '../../common/ui/RGBAColorPicker';

/**
 * ShadowEffectsEditor 컴포넌트의 Props 인터페이스
 * @interface ShadowEffectsEditorProps
 */
interface ShadowEffectsEditorProps {
  /** 현재 다각형 셰이프의 속성 데이터 */
  polygonShapeProps: PolygonShapeProperties;
  /** 셰이프 속성 업데이트 콜백 함수 */
  updatePolygonShapeProperty: (updates: Partial<PolygonShapeProperties>) => void;
}

/**
 * 다각형 셰이프의 그림자 효과 편집기 컴포넌트
 * 
 * 드롭 셐도우와 이너 셐도우 두 가지 효과를 독립적으로 설정할 수 있으며,
 * 각각의 효과는 오프셋, 블러, 색상 속성을 세밀하게 조정할 수 있습니다.
 * 체크박스로 효과를 활성화할 때 자동으로 기본값이 설정됩니다.
 * 
 * @param props - ShadowEffectsEditor 컴포넌트 속성
 * @returns 그림자 효과 편집 UI 컴포넌트
 */
export const ShadowEffectsEditor: React.FC<ShadowEffectsEditorProps> = ({
  polygonShapeProps,
  updatePolygonShapeProperty
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-white font-medium flex items-center space-x-2">
        <span>✨</span>
        <span>Shadow Effects</span>
      </h4>

      {/* Shadow Enable */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={polygonShapeProps.shadowEnabled || false}
          onChange={(e) => updatePolygonShapeProperty({ 
            shadowEnabled: e.target.checked,
            shadowOffsetX: e.target.checked ? (polygonShapeProps.shadowOffsetX || 4) : polygonShapeProps.shadowOffsetX,
            shadowOffsetY: e.target.checked ? (polygonShapeProps.shadowOffsetY || 4) : polygonShapeProps.shadowOffsetY,
            shadowBlur: e.target.checked ? (polygonShapeProps.shadowBlur || 8) : polygonShapeProps.shadowBlur,
            shadowColor: e.target.checked ? (polygonShapeProps.shadowColor || 'rgba(0, 0, 0, 0.3)') : polygonShapeProps.shadowColor
          })}
          className="w-4 h-4"
        />
        <label className="text-white font-medium">Drop Shadow</label>
      </div>

      {polygonShapeProps.shadowEnabled && (
        <div className="space-y-3 ml-6">
          {/* Shadow Offset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">X Offset</label>
              <input
                type="number"
                value={polygonShapeProps.shadowOffsetX || 4}
                onChange={(e) => updatePolygonShapeProperty({ shadowOffsetX: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Y Offset</label>
              <input
                type="number"
                value={polygonShapeProps.shadowOffsetY || 4}
                onChange={(e) => updatePolygonShapeProperty({ shadowOffsetY: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
          
          {/* Shadow Blur */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Blur</label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="50"
                value={polygonShapeProps.shadowBlur || 8}
                onChange={(e) => updatePolygonShapeProperty({ shadowBlur: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-white text-sm w-12">{polygonShapeProps.shadowBlur || 8}px</span>
            </div>
          </div>

          {/* Shadow Color with Alpha */}
          <RGBAColorPicker
            label="Color & Opacity"
            value={polygonShapeProps.shadowColor || 'rgba(0, 0, 0, 0.3)'}
            onChange={(color) => updatePolygonShapeProperty({ shadowColor: color })}
          />
        </div>
      )}

      {/* Inner Shadow Enable */}
      <div className="flex items-center space-x-2 mt-4">
        <input
          type="checkbox"
          checked={polygonShapeProps.innerShadowEnabled || false}
          onChange={(e) => updatePolygonShapeProperty({ 
            innerShadowEnabled: e.target.checked,
            innerShadowOffsetX: e.target.checked ? (polygonShapeProps.innerShadowOffsetX || 2) : polygonShapeProps.innerShadowOffsetX,
            innerShadowOffsetY: e.target.checked ? (polygonShapeProps.innerShadowOffsetY || 2) : polygonShapeProps.innerShadowOffsetY,
            innerShadowBlur: e.target.checked ? (polygonShapeProps.innerShadowBlur || 4) : polygonShapeProps.innerShadowBlur,
            innerShadowColor: e.target.checked ? (polygonShapeProps.innerShadowColor || 'rgba(0, 0, 0, 0.5)') : polygonShapeProps.innerShadowColor
          })}
          className="w-4 h-4"
        />
        <label className="text-white font-medium">Inner Shadow</label>
      </div>

      {polygonShapeProps.innerShadowEnabled && (
        <div className="space-y-3 ml-6">
          {/* Inner Shadow Offset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">X Offset</label>
              <input
                type="number"
                value={polygonShapeProps.innerShadowOffsetX || 2}
                onChange={(e) => updatePolygonShapeProperty({ innerShadowOffsetX: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Y Offset</label>
              <input
                type="number"
                value={polygonShapeProps.innerShadowOffsetY || 2}
                onChange={(e) => updatePolygonShapeProperty({ innerShadowOffsetY: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
          
          {/* Inner Shadow Blur */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Blur</label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="30"
                value={polygonShapeProps.innerShadowBlur || 4}
                onChange={(e) => updatePolygonShapeProperty({ innerShadowBlur: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-white text-sm w-12">{polygonShapeProps.innerShadowBlur || 4}px</span>
            </div>
          </div>

          {/* Inner Shadow Color with Alpha */}
          <RGBAColorPicker
            label="Color & Opacity"
            value={polygonShapeProps.innerShadowColor || 'rgba(0, 0, 0, 0.5)'}
            onChange={(color) => updatePolygonShapeProperty({ innerShadowColor: color })}
          />
        </div>
      )}
    </div>
  );
};