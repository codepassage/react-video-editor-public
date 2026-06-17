/**
 * 📝 BorderStrokeEditor - 테두리 및 스트로크 편집 컴포넌트
 * 
 * 다각형 도형의 테두리 스타일을 설정하고 편집할 수 있는 전용 에디터입니다.
 * 테두리 활성화/비활성화, 두께 조정, 색상 설정 등의 기본적인 스트로크 속성을 관리합니다.
 * 
 * 주요 기능:
 * - 테두리 활성화/비활성화 토글
 * - 실시간 테두리 두께 조정 (1-20px 범위)
 * - 색상 피커를 통한 테두리 색상 설정
 * - 텍스트 입력으로 정확한 색상값 입력
 * - 슬라이더 기반 직관적 두께 조정
 * - 시각적 피드백과 실시간 미리보기
 * 
 * 기술적 특징:
 * - React 함수형 컴포넌트
 * - TypeScript 타입 안전성 보장
 * - 조건부 렌더링으로 성능 최적화
 * - 부분 업데이트 패턴으로 효율적 상태 관리
 * - HTML5 color input과 text input 이중 인터페이스
 * - 범위 슬라이더로 사용자 친화적 UI
 * 
 * 사용 사례:
 * - 다각형 도형의 윤곽선 정의
 * - 텍스트 및 그래픽 요소 강조
 * - 디자인 요소 구분 및 경계 설정
 * - 브랜딩 색상 적용
 * - 시각적 계층 구조 생성
 * 
 * @author 개발팀
 * @version 1.5.0
 * @since 2024-02-20
 */

import React from 'react';
import { PolygonShapeProperties } from '../../../types/polygonShape.types';

/**
 * BorderStrokeEditor 컴포넌트 Props 인터페이스
 * @interface BorderStrokeEditorProps
 * @property {PolygonShapeProperties} polygonShapeProps - 현재 다각형 속성값
 * @property {(updates: Partial<PolygonShapeProperties>) => void} updatePolygonShapeProperty - 속성 업데이트 콜백
 */
interface BorderStrokeEditorProps {
  polygonShapeProps: PolygonShapeProperties;
  updatePolygonShapeProperty: (updates: Partial<PolygonShapeProperties>) => void;
}

export const BorderStrokeEditor: React.FC<BorderStrokeEditorProps> = ({
  polygonShapeProps,
  updatePolygonShapeProperty
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-white font-medium flex items-center space-x-2">
        <span>⭕</span>
        <span>Border Stroke</span>
      </h4>

      {/* Border Enable */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={(polygonShapeProps.borderWidth || 0) > 0}
          onChange={(e) => updatePolygonShapeProperty({ borderWidth: e.target.checked ? 2 : 0 })}
          className="w-4 h-4"
        />
        <label className="text-white">Enable Border</label>
      </div>

      {(polygonShapeProps.borderWidth || 0) > 0 && (
        <div className="space-y-4">
          {/* Border Width */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Width</label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="1"
                max="20"
                value={polygonShapeProps.borderWidth || 2}
                onChange={(e) => updatePolygonShapeProperty({ borderWidth: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-white text-sm w-8">{polygonShapeProps.borderWidth || 2}px</span>
            </div>
          </div>

          {/* Border Color */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={polygonShapeProps.borderColor || '#ffffff'}
                onChange={(e) => updatePolygonShapeProperty({ borderColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={polygonShapeProps.borderColor || '#ffffff'}
                onChange={(e) => updatePolygonShapeProperty({ borderColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};