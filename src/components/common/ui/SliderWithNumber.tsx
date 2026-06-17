/**
 * 📝 SliderWithNumber - 통합 슬라이더 및 숫자 입력 컴포넌트
 * 
 * 슬라이더와 숫자 입력 필드를 결합한 하이브리드 컨트롤로, 정밀한 값 조정과 빠른 범위 조정을 동시에 지원합니다.
 * 사용자가 원하는 방식으로 값을 설정할 수 있어 다양한 사용자 경험을 만족시킵니다.
 * 
 * 주요 기능:
 * - 슬라이더와 숫자 입력 이중 인터페이스
 * - 실시간 값 동기화 및 범위 검증
 * - 커스터마이징 가능한 단위 표시
 * - 추가 버튼 슬롯 제공 (토글, 리셋 등)
 * - 선택적 숫자 입력 표시/숨김
 * - 고정 너비 슬라이더로 UI 일관성 보장
 * 
 * 기술적 특징:
 * - React.useCallback으로 최적화된 이벤트 핸들링
 * - 값 범위 자동 클램핑 (min/max 제한)
 * - 소수점 정밀도 지원 (반올림 처리)
 * - TypeScript 완전 타입 안전성
 * - 모듈화된 스타일링 시스템
 * - 접근성 고려 라벨링
 * 
 * 사용 사례:
 * - 투명도 및 불투명도 조정
 * - 크기, 각도, 위치 등 수치 설정
 * - 애니메이션 속도 및 지연시간
 * - 색상 채도, 명도 조정
 * - 오디오 볼륨 및 이펙트 강도
 * 
 * @author 개발팀
 * @version 1.6.0
 * @since 2024-02-01
 */

import React, { useCallback } from 'react';

/**
 * SliderWithNumber 컴포넌트 Props 인터페이스
 * @interface SliderWithNumberProps
 * @property {string} label - 컨트롤의 라벨 텍스트
 * @property {number} value - 현재 값
 * @property {number} min - 최소값
 * @property {number} max - 최대값
 * @property {number} [step] - 입력 스텝 크기 (기본값: 1)
 * @property {string} [suffix] - 값 뒤에 표시될 단위 또는 접미사
 * @property {(value: number) => void} onChange - 값 변경 시 호출되는 콜백
 * @property {React.ReactNode} [additionalButton] - 추가 버튼 요소 (토글, 리셋 등)
 * @property {boolean} [showNumberInput] - 숫자 입력 필드 표시 여부 (기본값: true)
 * @property {string} [className] - 컨테이너에 추가할 CSS 클래스
 * @property {string} [sliderClassName] - 슬라이더에 추가할 CSS 클래스
 * @property {string} [numberInputClassName] - 숫자 입력에 추가할 CSS 클래스
 */
export interface SliderWithNumberProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  additionalButton?: React.ReactNode;
  showNumberInput?: boolean;
  className?: string;
  sliderClassName?: string;
  numberInputClassName?: string;
}

export const SliderWithNumber: React.FC<SliderWithNumberProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
  additionalButton,
  showNumberInput = true,
  className = '',
  sliderClassName = '',
  numberInputClassName = ''
}) => {
  // 숫자 입력 처리
  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    
    // 범위 체크
    if (!isNaN(newValue)) {
      const clampedValue = Math.min(max, Math.max(min, newValue));
      onChange(clampedValue);
    }
  }, [min, max, onChange]);

  // 슬라이더 입력 처리
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  }, [onChange]);

  // 기본 스타일 - 슬라이더를 고정 너비로 설정하여 일관성 확보
  const defaultSliderStyle = "w-48"; // 더 긴 고정 너비로 변경 (12rem/192px)
  const defaultNumberInputStyle = "w-16 p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 라벨 */}
      <label className="block text-sm text-gray-300">{label}</label>
      
      {/* 슬라이더 + 숫자 입력 + 추가 버튼 */}
      <div className="flex items-center space-x-3">
        {/* 슬라이더 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className={`${defaultSliderStyle} ${sliderClassName}`}
        />
        
        {/* 숫자 입력 */}
        {showNumberInput && (
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={Math.round(value * 100) / 100}
            onChange={handleNumberChange}
            className={`${defaultNumberInputStyle} ${numberInputClassName}`}
          />
        )}
        
        {/* 단위/퍼센트 표시 */}
        {suffix && (
          <span className="text-sm text-gray-400 min-w-fit">
            {suffix}
          </span>
        )}
        
        {/* 추가 버튼 (예: 보이기/숨기기 토글) */}
        {additionalButton}
      </div>
    </div>
  );
};

export default SliderWithNumber;