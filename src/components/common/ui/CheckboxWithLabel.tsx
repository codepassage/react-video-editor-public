/**
 * 📝 CheckboxWithLabel - 라벨이 있는 체크박스 컴포넌트
 * 
 * React Video Editor의 표준 체크박스 UI 컴포넌트입니다.
 * 라벨, 설명, 커스터마이징 가능한 스타일링을 제공하는 재사용 가능한 체크박스입니다.
 * 
 * 주요 기능:
 * - 라벨과 체크박스의 통합된 UI
 * - 선택적 설명 텍스트 표시
 * - 비활성화 상태 지원
 * - 개별 요소별 스타일 커스터마이징
 * - 접근성을 고려한 구조
 * 
 * 기술적 특징:
 * - TypeScript 타입 안전성 보장
 * - Tailwind CSS 기반 스타일링
 * - 제어 컴포넌트 패턴 사용
 * - 개별 요소별 className 오버라이드 지원
 * 
 * 사용 사례:
 * - 투명 배경 토글 (BackgroundColorControl)
 * - 클립 속성 활성화/비활성화
 * - 렌더링 옵션 설정
 * - 프로젝트 설정 토글
 * - 템플릿 저장 옵션
 * 
 * @author React Video Editor Team
 * @version 1.0.0
 * @since 2024-07-13
 */

import React from 'react';

/**
 * CheckboxWithLabel 컴포넌트의 Props 인터페이스
 * 
 * @interface CheckboxWithLabelProps
 * @property {string} label - 체크박스 라벨 텍스트 (필수)
 * @property {boolean} checked - 체크 상태
 * @property {(checked: boolean) => void} onChange - 상태 변경 콜백 함수
 * @property {boolean} [disabled] - 비활성화 상태 (기본값: false)
 * @property {string} [description] - 라벨 옆에 표시할 설명 텍스트
 * @property {string} [className] - 컨테이너에 적용할 CSS 클래스
 * @property {string} [checkboxClassName] - 체크박스 요소에 적용할 CSS 클래스
 * @property {string} [labelClassName] - 라벨 요소에 적용할 CSS 클래스
 */
export interface CheckboxWithLabelProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
  className?: string;
  checkboxClassName?: string;
  labelClassName?: string;
}

export const CheckboxWithLabel: React.FC<CheckboxWithLabelProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  description,
  className = '',
  checkboxClassName = '',
  labelClassName = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={`w-4 h-4 ${checkboxClassName}`}
        />
        <label className={`text-white text-sm ${labelClassName}`}>
          {label}
        </label>
        {description && (
          <span className="text-xs text-gray-400">({description})</span>
        )}
      </div>
    </div>
  );
};