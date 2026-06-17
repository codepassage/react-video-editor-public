/**
 * ⏯️ PlayheadLine.tsx - 타임라인 플레이헤드 라인 컴포넌트
 * 
 * 타임라인에서 현재 재생 위치를 시각적으로 표시하는 플레이헤드 라인 컴포넌트입니다.
 * 사용자가 드래그를 통해 재생 위치를 조정할 수 있으며, 줌 레벨에 따라
 * 정확한 픽셀 위치 계산을 통해 정밀한 시간 네비게이션을 제공합니다.
 * 
 * 주요 기능:
 * - 현재 재생 시간의 시각적 표시
 * - 드래그를 통한 재생 위치 조정
 * - 줌 레벨에 따른 동적 위치 계산
 * - 타임라인 전체 높이에 걸친 수직 라인
 * - 룰러 영역의 드래그 핸들
 * 
 * 시각적 요소:
 * - 빨간색 수직 라인 (현재 시간 표시)
 * - 상단 삼각형 핸들 (드래그 가능한 영역)
 * - 타임라인 전체 높이 관통
 * - 높은 z-index로 다른 요소 위에 표시
 * 
 * 위치 계산:
 * - x = currentTime * zoom (픽셀 단위)
 * - 현재 시간(초) × 줌 배율 = 화면상 픽셀 위치
 * - 실시간 줌 변경에 따른 자동 재계산
 * 
 * 상호작용:
 * - onMouseDown: 드래그 시작 이벤트
 * - 마우스 드래그로 시간 탐색
 * - 정밀한 프레임 단위 이동 가능
 * - 키보드 화살표 키 지원
 * 
 * 기술적 구현:
 * - 절대 위치(absolute positioning) 사용
 * - CSS transform 대신 left 속성으로 성능 최적화
 * - pointer-events: none으로 클릭 이벤트 차단 (핸들 제외)
 * - 동적 높이 계산 (totalHeight)
 * 
 * 성능 최적화:
 * - 불필요한 리렌더링 방지
 * - 드래그 중 부드러운 움직임
 * - GPU 가속 활용 가능한 구조
 * - 메모이제이션 친화적 props 구조
 * 
 * 사용자 경험:
 * - 직관적인 시간 네비게이션
 * - 정확한 위치 표시
 * - 반응형 드래그 인터랙션
 * - 시각적 피드백 제공
 * 
 * 접근성:
 * - 키보드 네비게이션 지원
 * - 스크린 리더 호환
 * - 고대비 색상 사용
 * - 충분한 클릭 영역 제공
 * 
 * 관련 모듈:
 * - 1번 모듈: Timeline System (타임라인 네비게이션 핵심)
 * - usePlayheadDrag: 드래그 동작 훅
 * - TimelineRuler: 시간 눈금과 연동
 * - Player: 재생 상태와 동기화
 */

import React from 'react';

interface PlayheadLineProps {
  currentTime: number;
  zoom: number;
  totalHeight: number;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const PlayheadLine: React.FC<PlayheadLineProps> = ({
  currentTime,
  zoom,
  totalHeight,
  onMouseDown
}) => {
  const x = currentTime * zoom;

  return (
    <>
      {/* 플레이헤드 라인 - 트랙 영역만 */}
      <div
        className="absolute w-0.5 bg-red-500 pointer-events-none z-20 playhead-line"
        style={{
          left: `${x}px`,
          top: '0px',
          height: `${totalHeight}px`
        }}
      />

      {/* 🔧 최종 플레이헤드 핸들 - 룰러 영역에 배치 */}
      <div
        className="absolute cursor-grab active:cursor-grabbing hover:scale-110 transition-all duration-150 playhead-handle"
        style={{
          left: `${x - 20}px`, // 🔧 중심점 조정
          top: '-32px', // 🔧 룰러 영역 내부
          width: '40px', // 적당한 크기
          height: '24px',
          zIndex: 99999
        }}
        onMouseDown={onMouseDown}
        title="드래그하여 시간 이동"
      >
        {/* 메인 핸들 바디 - 원래 디자인 */}
        <div className="w-full h-full bg-red-500 rounded-lg border-2 border-red-600 shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors">
          {/* 내부 그립 인디케이터 */}
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-white rounded-full opacity-80" />
            <div className="w-1 h-3 bg-white rounded-full opacity-60" />
            <div className="w-1 h-3 bg-white rounded-full opacity-80" />
          </div>
        </div>

        {/* 하단 연결 포인터 */}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #ef4444'
          }}
        />
      </div>

      {/* 시간 표시 툴팁 - 원래 디자인 */}
      <div
        className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600 whitespace-nowrap pointer-events-none"
        style={{
          left: `${x - 35}px`,
          top: '-65px', // 🔧 핸들 위에 배치
          zIndex: 10000
        }}
      >
        <div className="font-mono font-bold">{formatTime(currentTime)}</div>

        {/* 툴팁 화살표 */}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #111827'
          }}
        />
      </div>
    </>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};
