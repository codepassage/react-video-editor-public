/**
 * 📊 Progress.tsx - 재사용 가능한 진행률 표시 컴포넌트
 * 
 * 전체 애플리케이션에서 사용되는 표준화된 진행률 표시 UI 컴포넌트입니다.
 * 파일 업로드, 비디오 렌더링, 데이터 처리 등 다양한 상황에서
 * 일관된 시각적 피드백을 제공하여 사용자 경험을 향상시킵니다.
 * 
 * 주요 기능:
 * - 0-100% 진행률 시각적 표시
 * - 3가지 크기 옵션 (sm/md/lg)
 * - 4가지 색상 테마 (blue/green/red/yellow)
 * - 선택적 퍼센테이지 라벨 표시
 * - 값 범위 안전성 보장 (0-100 제한)
 * - Tailwind CSS 기반 스타일링
 * 
 * 사용 예시:
 * - 파일 업로드 진행률
 * - 비디오 렌더링 진행률
 * - 데이터 처리 진행률
 * - TTS 생성 진행률
 * 
 * Props 설명:
 * - value: 0-100 사이의 진행률 값
 * - size: 진행막대 크기 ('sm' | 'md' | 'lg')
 * - color: 진행막대 색상 테마
 * - showLabel: 퍼센테이지 라벨 표시 여부
 * - className: 추가 CSS 클래스
 * 
 * 관련 모듈:
 * - 미디어 라이브러리: 파일 업로드 진행률
 * - 7번 모듈: Remotion Integration (렌더링 진행률)
 * - 5번 모듈: TTS System (TTS 생성 진행률)
 */
import React from 'react';

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow';
  showLabel?: boolean;
}

/**
 * Progress 컴포넌트 - 일관된 진행률 표시 UI
 * 
 * 주요 책임:
 * 1. 0-100% 범위의 진행률 시각화
 * 2. 다양한 크기와 색상 옵션 제공
 * 3. 선택적 퍼센테이지 라벨 표시
 * 4. 값 유효성 검증 및 안전성 보장
 * 5. 부드러운 애니메이션 전환 효과
 * 
 * 스타일링 시스템:
 * - Tailwind CSS 기반 유틸리티 클래스
 * - 반응형 디자인 지원
 * - 부드러운 transition 애니메이션
 * - 접근성을 고려한 색상 대비
 */
export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  className = '', 
  size = 'md',
  color = 'blue',
  showLabel = false
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-sm text-gray-600 mt-1">
          {Math.round(clampedValue)}%
        </div>
      )}
    </div>
  );
};