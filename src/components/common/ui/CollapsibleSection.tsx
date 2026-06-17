/**
 * 📝 CollapsibleSection - 접을 수 있는 섹션 컴포넌트
 * 
 * React Video Editor의 접을 수 있는 UI 섹션 컴포넌트입니다.
 * 아이콘, 제목, 배지, 상태 표시기를 포함한 풍부한 헤더와 접을 수 있는 콘텐츠 영역을 제공합니다.
 * 
 * 주요 기능:
 * - 클릭으로 펼치기/접기 토글
 * - 아이콘과 제목이 있는 사용자 정의 헤더
 * - 배지 및 상태 표시기 지원
 * - 개별 요소별 스타일 커스터마이징
 * - 부드러운 호버 효과
 * 
 * 기술적 특징:
 * - 제어 컴포넌트 패턴 (외부에서 열림/닫힘 상태 관리)
 * - Lucide React 아이콘 통합
 * - Tailwind CSS 기반 반응형 디자인
 * - 접근성을 고려한 버튼 구조
 * 
 * 사용 사례:
 * - 속성 패널의 카테고리별 그룹
 * - 미디어 라이브러리의 폴더 구조
 * - 설정 페이지의 옵션 그룹
 * - 템플릿 목록의 카테고리
 * 
 * @author React Video Editor Team
 * @version 1.0.0
 * @since 2024-07-13
 */

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * CollapsibleSection 컴포넌트의 Props 인터페이스
 * 
 * @interface CollapsibleSectionProps
 * @property {string} title - 섹션 제목 텍스트
 * @property {React.ReactNode} icon - 제목 옆에 표시할 아이콘
 * @property {boolean} isOpen - 섹션 열림/닫힘 상태
 * @property {() => void} onToggle - 토글 상태 변경 콜백 함수
 * @property {React.ReactNode} children - 섹션 콘텐츠 (펼쳐질 때 표시)
 * @property {string | number} [badge] - 제목 옆에 표시할 배지 (예: 항목 수)
 * @property {React.ReactNode} [statusIndicator] - 상태를 나타내는 추가 UI 요소
 * @property {string} [className] - 섹션 컨테이너에 적용할 CSS 클래스
 * @property {string} [headerClassName] - 헤더 버튼에 적용할 CSS 클래스
 * @property {string} [contentClassName] - 콘텐츠 영역에 적용할 CSS 클래스
 * @property {boolean} [defaultOpen] - 초기 열림 상태 (현재 미사용, 호환성용)
 */
export interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string | number;
  statusIndicator?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
  statusIndicator,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  return (
    <div className={`border border-gray-600 rounded-lg ${className}`}>
      <button
        onClick={onToggle}
        className={`w-full p-3 text-left flex items-center justify-between text-white hover:bg-gray-700 transition-colors ${headerClassName}`}
      >
        <span className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
          {badge && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
              {badge}
            </span>
          )}
          {statusIndicator}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
        <div className={`p-4 space-y-4 border-t border-gray-600 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;