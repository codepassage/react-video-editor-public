/**
 * 📝 MarginControl - 4방향 여백 조정 컨트롤 컴포넌트
 * 
 * 요소의 상하좌우 여백을 개별적으로 조정할 수 있는 직관적인 인터페이스를 제공합니다.
 * CSS의 margin 속성과 동일한 방식으로 작동하며, 2x2 그리드 레이아웃으로 공간 효율적으로 배치됩니다.
 * 
 * 주요 기능:
 * - 4방향 독립적인 여백 조정 (상단, 하단, 좌측, 우측)
 * - 실시간 숫자 입력 유효성 검증
 * - 범위 제한 기능 (min/max)
 * - 커스터마이징 가능한 단위 표시
 * - 직관적인 2x2 그리드 레이아웃
 * - 접근성을 고려한 라벨링
 * 
 * 기술적 특징:
 * - React.useCallback으로 최적화된 이벤트 핸들링
 * - TypeScript 타입 안전성으로 오류 방지
 * - 제어형 컴포넌트 패턴으로 일관된 상태 관리
 * - TailwindCSS 기반 반응형 디자인
 * - 성능 최적화된 리렌더링
 * 
 * 사용 사례:
 * - 텍스트 요소의 여백 조정
 * - 이미지 및 비디오 클립의 패딩 설정
 * - UI 레이아웃 간격 조정
 * - 도형 및 그래픽 요소의 위치 미세조정
 * - 템플릿 요소 간 간격 최적화
 * 
 * @author 개발팀
 * @version 1.4.0
 * @since 2024-01-20
 */

import React, { useCallback } from 'react';

/**
 * 4방향 여백값 인터페이스
 * @interface MarginValues
 * @property {number} top - 상단 여백값
 * @property {number} right - 우측 여백값
 * @property {number} bottom - 하단 여백값
 * @property {number} left - 좌측 여백값
 */
export interface MarginValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * MarginControl 컴포넌트 Props 인터페이스
 * @interface MarginControlProps
 * @property {string} label - 컨트롤 그룹의 라벨 텍스트
 * @property {MarginValues} values - 현재 4방향 여백값
 * @property {(side: keyof MarginValues, value: number) => void} onChange - 값 변경 콜백
 * @property {number} [min] - 최소값 제한 (기본값: 0)
 * @property {number} [max] - 최대값 제한 (기본값: 9999)
 * @property {string} [unit] - 단위 표시 (기본값: 'px')
 * @property {number} [step] - 입력 스텝 크기 (기본값: 1)
 * @property {string} [className] - 컨테이너에 추가할 CSS 클래스
 * @property {string} [inputClassName] - 입력 필드에 추가할 CSS 클래스
 */
export interface MarginControlProps {
  label: string;
  values: MarginValues;
  onChange: (side: keyof MarginValues, value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  step?: number;
  className?: string;
  inputClassName?: string;
}

export const MarginControl: React.FC<MarginControlProps> = ({
  label,
  values,
  onChange,
  min = 0,
  max = 9999,
  unit = 'px',
  step = 1,
  className = '',
  inputClassName = ''
}) => {
  // 숫자 입력 처리
  const handleInputChange = useCallback((
    side: keyof MarginValues,
    value: string
  ) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(max, Math.max(min, numValue));
      onChange(side, clampedValue);
    }
  }, [min, max, onChange]);

  // 기본 입력 스타일
  const defaultInputStyle = "w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm";

  // 라벨 스타일
  const labelStyle = "block text-xs text-gray-400 mb-1";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 라벨 */}
      <label className="block text-sm text-gray-300">
        {label} {unit && `(${unit})`}
      </label>
      
      {/* 4방향 입력 필드 - 2x2 그리드 */}
      <div className="space-y-3">
        {/* 첫 번째 행: 상단, 하단 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelStyle}>상단</label>
            <input
              type="number"
              value={values.top}
              onChange={(e) => handleInputChange('top', e.target.value)}
              className={`${defaultInputStyle} ${inputClassName}`}
              min={min}
              max={max}
              step={step}
            />
          </div>
          <div>
            <label className={labelStyle}>하단</label>
            <input
              type="number"
              value={values.bottom}
              onChange={(e) => handleInputChange('bottom', e.target.value)}
              className={`${defaultInputStyle} ${inputClassName}`}
              min={min}
              max={max}
              step={step}
            />
          </div>
        </div>
        
        {/* 두 번째 행: 좌측, 우측 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelStyle}>좌측</label>
            <input
              type="number"
              value={values.left}
              onChange={(e) => handleInputChange('left', e.target.value)}
              className={`${defaultInputStyle} ${inputClassName}`}
              min={min}
              max={max}
              step={step}
            />
          </div>
          <div>
            <label className={labelStyle}>우측</label>
            <input
              type="number"
              value={values.right}
              onChange={(e) => handleInputChange('right', e.target.value)}
              className={`${defaultInputStyle} ${inputClassName}`}
              min={min}
              max={max}
              step={step}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarginControl;