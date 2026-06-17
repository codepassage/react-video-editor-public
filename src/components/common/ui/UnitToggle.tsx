/**
 * 📝 UnitToggle - 단위 전환 토글 컴포넌트
 * 
 * 픽셀(px)과 퍼센트(%) 단위 간 빠른 전환을 위한 전용 토글 버튼입니다.
 * 레이아웃 및 스타일링에서 절대값과 상대값 간 전환이 필요할 때 사용됩니다.
 * 
 * 주요 기능:
 * - px/% 단위 간 원클릭 전환
 * - 시각적 활성 상태 표시
 * - 균등한 버튼 레이아웃
 * - 호버 상태 피드백
 * - 비활성화 상태 지원
 * - 접근성 고려 설계
 * 
 * 기술적 특징:
 * - React 함수형 컴포넌트
 * - TypeScript 엄격한 타입 제한 ('px' | '%')
 * - TailwindCSS 기반 스타일링
 * - CSS 전환 애니메이션
 * - 조건부 클래스 적용
 * - 성능 최적화된 렌더링
 * 
 * 사용 사례:
 * - 위치 및 크기 설정에서 단위 변경
 * - 여백 및 패딩 설정 시 단위 선택
 * - 반응형 디자인 모드 전환
 * - 절대/상대 레이아웃 전환
 * - CSS 속성값 단위 설정
 * 
 * @author 개발팀
 * @version 1.1.0
 * @since 2024-02-05
 */

import React from 'react';

/**
 * UnitToggle 컴포넌트 Props 인터페이스
 * @interface UnitToggleProps
 * @property {'px' | '%'} value - 현재 선택된 단위
 * @property {(unit: 'px' | '%') => void} onChange - 단위 변경 시 호출되는 콜백
 * @property {string} [className] - 컨테이너에 추가할 CSS 클래스
 * @property {boolean} [disabled] - 컴포넌트 비활성화 여부 (기본값: false)
 */
export interface UnitToggleProps {
  value: 'px' | '%';
  onChange: (unit: 'px' | '%') => void;
  className?: string;
  disabled?: boolean;
}

export const UnitToggle: React.FC<UnitToggleProps> = ({
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  return (
    <div className={`flex space-x-1 bg-gray-700 rounded-lg p-1 ${className}`}>
      <button
        onClick={() => onChange('px')}
        disabled={disabled}
        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          value === 'px'
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:text-white hover:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        px
      </button>
      <button
        onClick={() => onChange('%')}
        disabled={disabled}
        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          value === '%'
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:text-white hover:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        %
      </button>
    </div>
  );
};