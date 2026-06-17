/**
 * 📝 TabControl - 모던 탭 내비게이션 컴포넌트
 * 
 * 여러 옵션 중에서 하나를 선택할 수 있는 시각적으로 구분되는 탭 인터페이스입니다.
 * 현대적인 디자인과 부드러운 애니메이션으로 사용자 경험을 향상시킵니다.
 * 
 * 주요 기능:
 * - 동적 탭 옵션 구성
 * - 시각적 활성 상태 표시
 * - 개별 탭 비활성화 지원
 * - 호버 및 포커스 상태 관리
 * - 유연한 레이아웃 (균등 분할)
 * - 키보드 접근성 지원
 * 
 * 기술적 특징:
 * - React 함수형 컴포넌트
 * - TypeScript 완전 타입 안전성
 * - TailwindCSS 기반 스타일링
 * - CSS 전환 애니메이션
 * - 조건부 렌더링 최적화
 * - 접근성 고려 disabled 상태 처리
 * 
 * 사용 사례:
 * - 속성 패널의 카테고리 전환
 * - 미디어 타입 필터링
 * - 편집 모드 선택
 * - 설정 페이지 섹션 구분
 * - 프리뷰 옵션 선택
 * 
 * @author 개발팀
 * @version 1.3.0
 * @since 2024-01-30
 */

import React from 'react';

/**
 * 탭 옵션 인터페이스
 * @interface TabOption
 * @property {string} value - 탭의 고유 식별값
 * @property {string} label - 탭에 표시될 텍스트
 * @property {boolean} [disabled] - 탭 비활성화 여부 (선택사항)
 */
export interface TabOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * TabControl 컴포넌트 Props 인터페이스
 * @interface TabControlProps
 * @property {TabOption[]} options - 탭 옵션 배열
 * @property {string} value - 현재 선택된 탭 값
 * @property {(value: string) => void} onChange - 탭 변경 시 호출되는 콜백
 * @property {string} [className] - 컨테이너에 추가할 CSS 클래스
 * @property {boolean} [disabled] - 전체 탭 컨트롤 비활성화 여부 (기본값: false)
 */
export interface TabControlProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const TabControl: React.FC<TabControlProps> = ({
  options,
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  return (
    <div className={`flex space-x-1 bg-gray-700 rounded-lg p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => !disabled && !option.disabled && onChange(option.value)}
          disabled={disabled || option.disabled}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            value === option.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-600 disabled:hover:bg-gray-700 disabled:hover:text-gray-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};