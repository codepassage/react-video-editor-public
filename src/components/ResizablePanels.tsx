/**
 * 📐 ResizablePanels.tsx - 3구역 크기 조절 가능한 패널 레이아웃 컴포넌트
 * 
 * 비디오 에디터의 메인 레이아웃을 구성하는 3구역 패널 시스템입니다.
 * 사용자가 드래그로 각 패널의 크기를 자유롭게 조절할 수 있으며, 반응형 레이아웃을 제공합니다.
 * 
 * 주요 기능:
 * - 3구역 레이아웃 (좌측/가운데/우측 패널)
 * - 마우스 드래그를 통한 실시간 크기 조절
 * - 최소 패널 크기 제한 및 경계 검증
 * - 비율 기반 유연한 레이아웃 시스템
 * - 드래그 상태 시각적 피드백
 * - 패널 간 구분선 및 핸들 제공
 * 
 * 레이아웃 시스템:
 * - 퍼센트 기반 유연한 크기 조절
 * - 두 개의 독립적인 구분선 (좌-중, 중-우)
 * - 자동 우측 패널 크기 계산
 * - 최소 폭 제한을 통한 사용성 보장
 * 
 * 성능 최적화:
 * - 이벤트 리스너 적절한 추가/제거
 * - 리사이징 중에만 mousemove 이벤트 등록
 * - 브라우저 기본 동작 방지로 부드러운 드래그
 * - 메모리 누수 방지를 위한 cleanup 함수
 * 
 * 사용 패턴:
 * - 메인 에디터 레이아웃의 기본 골격
 * - 좌측: 미디어 라이브러리
 * - 가운데: 타임라인 편집 영역
 * - 우측: 속성 편집 패널
 * 
 * 특별 고려사항:
 * - 반응형 디자인을 위한 퍼센트 기반 크기
 * - 사용자 경험을 위한 최소 크기 제한
 * - 크로스 브라우저 호환성 보장
 * - 터치 디바이스에서의 드래그 지원은 제외
 * - CSS와 연동한 시각적 스타일링
 */

import React, { useState, useRef, useEffect } from 'react';
import './ResizablePanels.css';

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialLeftWidth?: number;
  initialCenterWidth?: number;
  minWidth?: number;
}

export const ResizablePanels: React.FC<ResizablePanelsProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
  initialLeftWidth = 35,
  initialCenterWidth = 25,
  minWidth = 15
}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [centerWidth, setCenterWidth] = useState(initialCenterWidth);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (divider: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(divider);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const mouseX = e.clientX - rect.left;
      const percentage = (mouseX / containerWidth) * 100;

      if (isResizing === 'left') {
        // 첫 번째 구분선 (왼쪽-가운데 사이)
        const newLeftWidth = Math.max(minWidth, Math.min(80, percentage));
        const maxCenterWidth = 100 - newLeftWidth - minWidth;
        const newCenterWidth = Math.min(centerWidth, maxCenterWidth);
        
        setLeftWidth(newLeftWidth);
        setCenterWidth(newCenterWidth);
      } else if (isResizing === 'right') {
        // 두 번째 구분선 (가운데-오른쪽 사이)
        const newCenterWidth = Math.max(minWidth, Math.min(80, percentage - leftWidth));
        setCenterWidth(newCenterWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, leftWidth, centerWidth, minWidth]);

  const rightWidth = 100 - leftWidth - centerWidth;

  return (
    <div ref={containerRef} className="resizable-panels">
      <div 
        className="resizable-panel left-panel"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>
      
      <div 
        className="panel-divider"
        onMouseDown={handleMouseDown('left')}
      >
        <div className="divider-line"></div>
      </div>
      
      <div 
        className="resizable-panel center-panel"
        style={{ width: `${centerWidth}%` }}
      >
        {centerPanel}
      </div>
      
      <div 
        className="panel-divider"
        onMouseDown={handleMouseDown('right')}
      >
        <div className="divider-line"></div>
      </div>
      
      <div 
        className="resizable-panel right-panel"
        style={{ width: `${rightWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
};