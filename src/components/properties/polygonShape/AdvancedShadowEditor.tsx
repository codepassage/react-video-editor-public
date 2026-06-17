/**
 * 📝 AdvancedShadowEditor - 고급 그림자 효과 편집 컴포넌트
 * 
 * 다각형 도형에 적용할 수 있는 다양한 그림자 효과를 생성하고 편집하는 종합적인 에디터입니다.
 * Outer Shadow, Inner Shadow, Glow 효과를 지원하며, 각각 세밀한 매개변수 조정이 가능합니다.
 * 
 * 주요 기능:
 * - 3가지 그림자 타입 지원 (Outer, Inner, Glow)
 * - 탭 기반 인터페이스로 효과별 구분
 * - 실시간 그림자 매개변수 조정
 * - 색상, 위치, 블러, 스프레드 제어
 * - 체크박스 기반 효과 활성화/비활성화
 * - 시각적 아이콘으로 직관적 구분
 * 
 * 기술적 특징:
 * - React useState로 탭 상태 관리
 * - TypeScript 타입 안전성 보장
 * - 조건부 렌더링으로 성능 최적화
 * - 부분 업데이트 패턴으로 효율적 상태 관리
 * - 색상 피커와 텍스트 입력 이중 인터페이스
 * - 슬라이더 기반 수치 조정
 * 
 * 사용 사례:
 * - 다각형 도형의 깊이감 연출
 * - 텍스트 및 그래픽 요소 강조
 * - 레이어 시각적 분리 효과
 * - 브랜딩 및 스타일링 목적
 * - 아티스틱 비주얼 이펙트
 * 
 * @author 개발팀
 * @version 2.3.0
 * @since 2024-03-01
 */

import React, { useState } from 'react';
import { PolygonShapeProperties } from '../../../types/polygonShape.types';

/**
 * AdvancedShadowEditor 컴포넌트 Props 인터페이스
 * @interface AdvancedShadowEditorProps
 * @property {PolygonShapeProperties} polygonShapeProps - 현재 다각형 속성값
 * @property {(updates: Partial<PolygonShapeProperties>) => void} updatePolygonShapeProperty - 속성 업데이트 콜백
 */
interface AdvancedShadowEditorProps {
  polygonShapeProps: PolygonShapeProperties;
  updatePolygonShapeProperty: (updates: Partial<PolygonShapeProperties>) => void;
}

export const AdvancedShadowEditor: React.FC<AdvancedShadowEditorProps> = ({
  polygonShapeProps,
  updatePolygonShapeProperty
}) => {
  const [activeTab, setActiveTab] = useState<'outer' | 'inner' | 'glow'>('outer');

  return (
    <div className="space-y-4">
      <h4 className="text-white font-medium flex items-center space-x-2">
        <span>✨</span>
        <span>Advanced Shadow Effects</span>
      </h4>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
        {[
          { id: 'outer', label: 'Outer Shadow', icon: '🌘' },
          { id: 'inner', label: 'Inner Shadow', icon: '🕳️' },
          { id: 'glow', label: 'Glow', icon: '💫' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Outer Shadow */}
      {activeTab === 'outer' && (
        <div className="space-y-4">
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
            <label className="text-white font-medium">Enable Outer Shadow</label>
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
              
              {/* Shadow Blur & Spread */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Blur</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={polygonShapeProps.shadowBlur || 8}
                      onChange={(e) => updatePolygonShapeProperty({ shadowBlur: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-white text-sm w-8">{polygonShapeProps.shadowBlur || 8}px</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Spread</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={polygonShapeProps.shadowSpread || 0}
                      onChange={(e) => updatePolygonShapeProperty({ shadowSpread: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-white text-sm w-8">{polygonShapeProps.shadowSpread || 0}px</span>
                  </div>
                </div>
              </div>

              {/* Shadow Color */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={(polygonShapeProps.shadowColor || 'rgba(0, 0, 0, 0.3)').startsWith('#') ? polygonShapeProps.shadowColor : '#000000'}
                    onChange={(e) => updatePolygonShapeProperty({ shadowColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={polygonShapeProps.shadowColor || 'rgba(0, 0, 0, 0.3)'}
                    onChange={(e) => updatePolygonShapeProperty({ shadowColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    placeholder="rgba(0, 0, 0, 0.3)"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inner Shadow */}
      {activeTab === 'inner' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
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
            <label className="text-white font-medium">Enable Inner Shadow</label>
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
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={polygonShapeProps.innerShadowBlur || 4}
                    onChange={(e) => updatePolygonShapeProperty({ innerShadowBlur: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-white text-sm w-8">{polygonShapeProps.innerShadowBlur || 4}px</span>
                </div>
              </div>

              {/* Inner Shadow Color */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={(polygonShapeProps.innerShadowColor || 'rgba(0, 0, 0, 0.5)').startsWith('#') ? polygonShapeProps.innerShadowColor : '#000000'}
                    onChange={(e) => updatePolygonShapeProperty({ innerShadowColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={polygonShapeProps.innerShadowColor || 'rgba(0, 0, 0, 0.5)'}
                    onChange={(e) => updatePolygonShapeProperty({ innerShadowColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    placeholder="rgba(0, 0, 0, 0.5)"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Glow Effects */}
      {activeTab === 'glow' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={polygonShapeProps.glowEnabled || false}
              onChange={(e) => updatePolygonShapeProperty({ 
                glowEnabled: e.target.checked,
                glowColor: e.target.checked ? (polygonShapeProps.glowColor || '#ffffff') : polygonShapeProps.glowColor,
                glowSize: e.target.checked ? (polygonShapeProps.glowSize || 10) : polygonShapeProps.glowSize,
                glowIntensity: e.target.checked ? (polygonShapeProps.glowIntensity || 50) : polygonShapeProps.glowIntensity
              })}
              className="w-4 h-4"
            />
            <label className="text-white font-medium">Enable Outer Glow</label>
          </div>

          {polygonShapeProps.glowEnabled && (
            <div className="space-y-3 ml-6">
              {/* Glow Size & Intensity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Size</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={polygonShapeProps.glowSize || 10}
                      onChange={(e) => updatePolygonShapeProperty({ glowSize: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-white text-sm w-8">{polygonShapeProps.glowSize || 10}px</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Intensity</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={polygonShapeProps.glowIntensity || 50}
                      onChange={(e) => updatePolygonShapeProperty({ glowIntensity: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-white text-sm w-8">{polygonShapeProps.glowIntensity || 50}%</span>
                  </div>
                </div>
              </div>

              {/* Glow Color */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={polygonShapeProps.glowColor || '#ffffff'}
                    onChange={(e) => updatePolygonShapeProperty({ glowColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={polygonShapeProps.glowColor || '#ffffff'}
                    onChange={(e) => updatePolygonShapeProperty({ glowColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};