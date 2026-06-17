/**
 * 🗇️ VerticalResizablePanels.tsx - 세로 크기 조절 가능한 패널 컴포넌트
 * 
 * 두 개의 패널을 세로로 배치하고 사용자가 마우스 드래그로 크기를
 * 자유롭게 조절할 수 있도록 하는 재사용 가능한 컴포넌트입니다.
 * IDE나 에디터에서 흔히 볼 수 있는 분할 패널 UI를 구현하며,
 * 사용자의 작업 선호도에 따라 레이아웃을 사용자 정의할 수 있게 합니다.
 * 
 * 주요 기능:
 * - 상하 두 패널의 동적 크기 조절
 * - 마우스 드래그로 실시간 리사이징
 * - 최소 크기 제한으로 패널 불가시 방지
 * - 백분율 기반 크기 계산 (반응형 디자인)
 * - 드래그 중 시각적 피드백 (CSS 클래스)
 * 
 * 속성 설정:
 * - topPanel: 상단 패널 콘텐츠
 * - bottomPanel: 하단 패널 콘텐츠
 * - initialTopHeight: 초기 상단 패널 크기 (백분율, 기본 50%)
 * - minHeight: 최소 패널 크기 (백분율, 기본 20%)
 * 
 * 상태 관리:
 * - topHeight: 상단 패널의 현재 크기 (백분율)
 * - isResizing: 드래그 중인지 여부
 * - containerRef: 컴테이너 DOM 요소 참조
 * 
 * 이벤트 처리:
 * - 마우스 다운: 드래그 시작
 * - 마우스 무브: 리사이징 중 크기 계산
 * - 마우스 업: 드래그 종료
 * 
 * 사용 예시:
 * - 에디터 인터페이스의 상하 분할 레이아웃
 * - 데이터 비교 뷰어
 * - 속성 패널과 메인 콘텐츠 분리
 * 
 * 관련 모듈:
 * - UI 컴포넌트: 전체 레이아웃 시스템
 * - 반응형 디자인: 다양한 화면 크기 지원
 */
import React, { useState, useRef, useEffect } from 'react';
import './VerticalResizablePanels.css';

interface VerticalResizablePanelsProps {
  topPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
  initialTopHeight?: number;
  minHeight?: number;
}

/**
 * VerticalResizablePanels 컴포넌트 - 대화형 세로 분할 레이아웃
 * 
 * 주요 책임:
 * 1. 두 패널의 세로 배치 및 크기 관리
 * 2. 마우스 드래그 이벤트 처리
 * 3. 실시간 리사이징 계산 및 적용
 * 4. 최소/최대 크기 제한 적용
 * 5. 사용자 인터랙션 피드백
 * 
 * 리사이징 알고리즘:
 * - 마우스 Y 좌표를 컴테이너 높이로 나눈 백분율 계산
 * - 최소/최대 범위 제한 적용
 * - 두 패널의 합이 항상 100%가 되도록 보장
 * 
 * CSS 클래스 시스템:
 * - .vertical-panels-container: 기본 컴테이너 스타일
 * - .resizing: 리사이징 중 시각적 피드백
 * - .resize-handle: 드래그 핸들 스타일
 */
export const VerticalResizablePanels: React.FC<VerticalResizablePanelsProps> = ({
  topPanel,
  bottomPanel,
  initialTopHeight = 50,
  minHeight = 20
}) => {
  const [topHeight, setTopHeight] = useState(initialTopHeight);
  const [isResizing, setIsResizing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const mouseY = e.clientY - rect.top;
      const percentage = (mouseY / containerHeight) * 100;
      
      const newTopHeight = Math.max(minHeight, Math.min(100 - minHeight, percentage));
      setTopHeight(newTopHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minHeight]);

  const bottomHeight = 100 - topHeight;

  return (
    <div ref={containerRef} className="vertical-resizable-panels">
      <div 
        className="vertical-panel top-panel"
        style={{ height: `${topHeight}%` }}
      >
        {topPanel}
      </div>
      
      <div 
        className="vertical-panel-divider"
        onMouseDown={handleMouseDown}
      >
        <div className="vertical-divider-line"></div>
      </div>
      
      <div 
        className="vertical-panel bottom-panel"
        style={{ height: `${bottomHeight}%` }}
      >
        {bottomPanel}
      </div>
    </div>
  );
};