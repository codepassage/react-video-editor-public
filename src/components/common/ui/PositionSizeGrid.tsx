/**
 * 📝 PositionSizeGrid - 위치 및 크기 조정 그리드 컴포넌트
 * 
 * 요소의 위치(X, Y)와 크기(너비, 높이)를 2x2 그리드 형태로 조정할 수 있는 통합 컨트롤입니다.
 * 픽셀(px)과 퍼센트(%) 단위 간 실시간 전환이 가능하며, 종횡비 고정 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 2x2 그리드 레이아웃으로 직관적인 조작
 * - 실시간 px/% 단위 전환 기능
 * - 종횡비 잠금/해제 토글
 * - 개별 필드별 단위 설정
 * - 소수점 값 지원 및 정밀 조정
 * - 시각적 잠금 상태 표시
 * 
 * 기술적 특징:
 * - Lucide React 아이콘으로 시각적 일관성
 * - useCallback 훅으로 성능 최적화
 * - TypeScript 완전 타입 안전성
 * - 반응형 그리드 시스템
 * - 접근성 고려 라벨 및 title 속성
 * - 실시간 값 검증 및 변환
 * 
 * 사용 사례:
 * - 비디오 클립의 위치 및 크기 조정
 * - 텍스트 요소의 배치 설정
 * - 이미지 및 그래픽 요소 위치 지정
 * - 오버레이 요소의 정밀한 배치
 * - 반응형 레이아웃 설계
 * 
 * @author 개발팀
 * @version 2.0.0
 * @since 2024-02-15
 */

import React, { useCallback } from 'react';
import { Lock, Unlock } from 'lucide-react';

/**
 * PositionSizeGrid 컴포넌트 Props 인터페이스
 * @interface PositionSizeGridProps
 * @property {number} xValue - X 좌표값
 * @property {number} yValue - Y 좌표값
 * @property {number} widthValue - 너비값
 * @property {number} heightValue - 높이값
 * @property {'px' | '%'} xUnit - X 좌표 단위
 * @property {'px' | '%'} yUnit - Y 좌표 단위
 * @property {'px' | '%'} widthUnit - 너비 단위
 * @property {'px' | '%'} heightUnit - 높이 단위
 * @property {(value: number) => void} onXChange - X 값 변경 콜백
 * @property {(value: number) => void} onYChange - Y 값 변경 콜백
 * @property {(value: number) => void} onWidthChange - 너비 변경 콜백
 * @property {(value: number) => void} onHeightChange - 높이 변경 콜백
 * @property {() => void} onXUnitToggle - X 단위 토글 콜백
 * @property {() => void} onYUnitToggle - Y 단위 토글 콜백
 * @property {() => void} onWidthUnitToggle - 너비 단위 토글 콜백
 * @property {() => void} onHeightUnitToggle - 높이 단위 토글 콜백
 * @property {boolean} [isAspectLocked] - 종횡비 잠금 여부 (기본값: false)
 * @property {() => void} [onAspectLockToggle] - 종횡비 잠금 토글 콜백
 * @property {number} [step] - 입력 스텝 크기 (기본값: 0.1)
 * @property {string} [className] - 컨테이너에 추가할 CSS 클래스
 */
export interface PositionSizeGridProps {
  xValue: number;
  yValue: number;
  widthValue: number;
  heightValue: number;
  xUnit: 'px' | '%';
  yUnit: 'px' | '%';
  widthUnit: 'px' | '%';
  heightUnit: 'px' | '%';
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onXUnitToggle: () => void;
  onYUnitToggle: () => void;
  onWidthUnitToggle: () => void;
  onHeightUnitToggle: () => void;
  isAspectLocked?: boolean;
  onAspectLockToggle?: () => void;
  step?: number;
  className?: string;
}

export const PositionSizeGrid: React.FC<PositionSizeGridProps> = ({
  xValue,
  yValue,
  widthValue,
  heightValue,
  xUnit,
  yUnit,
  widthUnit,
  heightUnit,
  onXChange,
  onYChange,
  onWidthChange,
  onHeightChange,
  onXUnitToggle,
  onYUnitToggle,
  onWidthUnitToggle,
  onHeightUnitToggle,
  isAspectLocked = false,
  onAspectLockToggle,
  step = 0.1,
  className = ''
}) => {
  // 숫자 입력 처리 함수
  const handleNumberChange = useCallback((
    value: string,
    onChange: (value: number) => void
  ) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  }, []);

  // 단위 버튼 스타일
  const getUnitButtonStyle = (unit: 'px' | '%') => {
    return `px-2 py-1 rounded text-xs transition-colors shrink-0 ${
      unit === '%' 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
    }`;
  };

  // 입력 필드 스타일
  const inputStyle = "flex-1 p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 헤더 - 종횡비 잠금 버튼 포함 */}
      {onAspectLockToggle && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">위치 및 크기</span>
          <button
            onClick={onAspectLockToggle}
            className={`p-1 rounded text-xs transition-colors ${
              isAspectLocked 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={isAspectLocked ? '종횡비 잠금 ON' : '종횡비 잠금 OFF'}
          >
            {isAspectLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
        </div>
      )}

      {/* 2x2 그리드 - 스크린샷과 유사한 스타일 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 첫 번째 행: X, 너비 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-300">X</label>
            <button
              onClick={onXUnitToggle}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              title="단위 변경 (px/% 전환)"
            >
              {xUnit}
            </button>
          </div>
          <input
            type="number"
            value={Math.round(xValue * 100) / 100}
            onChange={(e) => handleNumberChange(e.target.value, onXChange)}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            step={xUnit === '%' ? step : 1}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-300">너비</label>
            <button
              onClick={onWidthUnitToggle}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              title="단위 변경 (px/% 전환)"
            >
              {widthUnit}
            </button>
          </div>
          <input
            type="number"
            value={Math.round(widthValue * 100) / 100}
            onChange={(e) => handleNumberChange(e.target.value, onWidthChange)}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            step={widthUnit === '%' ? step : 1}
            min={0}
          />
        </div>

        {/* 두 번째 행: Y, 높이 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-300">Y</label>
            <button
              onClick={onYUnitToggle}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              title="단위 변경 (px/% 전환)"
            >
              {yUnit}
            </button>
          </div>
          <input
            type="number"
            value={Math.round(yValue * 100) / 100}
            onChange={(e) => handleNumberChange(e.target.value, onYChange)}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            step={yUnit === '%' ? step : 1}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-300">높이</label>
            <button
              onClick={onHeightUnitToggle}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              title="단위 변경 (px/% 전환)"
            >
              {heightUnit}
            </button>
          </div>
          <input
            type="number"
            value={Math.round(heightValue * 100) / 100}
            onChange={(e) => handleNumberChange(e.target.value, onHeightChange)}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            step={heightUnit === '%' ? step : 1}
            min={0}
          />
        </div>
      </div>

      {/* 종횡비 잠금 상태 표시 */}
      {isAspectLocked && (
        <div className="text-xs text-yellow-400 flex items-center space-x-1">
          <Lock size={10} />
          <span>비율 고정</span>
        </div>
      )}
    </div>
  );
};

export default PositionSizeGrid;