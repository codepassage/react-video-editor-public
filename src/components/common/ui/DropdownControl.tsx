/**
 * 📝 DropdownControl - 고급 드롭다운 선택 컨트롤 컴포넌트
 * 
 * 다양한 옵션 중에서 단일 값을 선택할 수 있는 커스터마이징된 드롭다운 컴포넌트입니다.
 * 비디오 에디터의 UI 일관성을 위해 다크 테마와 접근성을 고려한 디자인으로 구현되었습니다.
 * 
 * 주요 기능:
 * - 사용자 정의 옵션 배열 지원
 * - 개별 옵션 비활성화 기능
 * - 유연한 스타일링 옵션
 * - 접근성 고려된 키보드 내비게이션
 * - 커스텀 플레이스홀더 지원
 * - 반응형 너비 조정
 * 
 * 기술적 특징:
 * - TypeScript로 완전한 타입 안전성 보장
 * - TailwindCSS를 활용한 다크 테마 스타일링
 * - 제어형 컴포넌트 패턴 구현
 * - 성능 최적화된 렌더링
 * 
 * 사용 사례:
 * - 미디어 포맷 선택 드롭다운
 * - 속성 패널의 다양한 설정 옵션
 * - 템플릿 카테고리 선택
 * - 언어 및 지역 설정
 * 
 * @author 개발팀
 * @version 1.2.0
 * @since 2024-01-15
 */

import React from 'react';

/**
 * 드롭다운 옵션 인터페이스
 * @interface DropdownOption
 * @property {string} value - 옵션의 고유값
 * @property {string} label - 사용자에게 표시될 라벨 텍스트
 * @property {boolean} [disabled] - 옵션 비활성화 여부 (선택사항)
 */
export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * DropdownControl 컴포넌트 Props 인터페이스
 * @interface DropdownControlProps
 * @property {string} [label] - 드롭다운 상단에 표시될 라벨 (선택사항)
 * @property {DropdownOption[]} options - 선택 가능한 옵션들의 배열
 * @property {string} value - 현재 선택된 값
 * @property {(value: string) => void} onChange - 값 변경 시 호출되는 콜백 함수
 * @property {string} [placeholder] - 기본 플레이스홀더 텍스트 (기본값: '선택하세요')
 * @property {string} [className] - 컨테이너에 추가할 CSS 클래스
 * @property {boolean} [disabled] - 드롭다운 비활성화 여부 (기본값: false)
 * @property {boolean} [fullWidth] - 전체 너비 사용 여부 (기본값: true)
 */
export interface DropdownControlProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const DropdownControl: React.FC<DropdownControlProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  className = '',
  disabled = false,
  fullWidth = true
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-gray-300 mb-2">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${
          fullWidth ? 'w-full' : ''
        } p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {placeholder && !value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};