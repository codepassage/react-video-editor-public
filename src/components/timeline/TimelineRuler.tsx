/**
 * ⏱️ TimelineRuler.tsx - 타임라인 눈금자 컴포넌트
 * 
 * 타임라인 상단의 시간 눈금자와 플레이헤드를 렌더링하는 컴포넌트
 * 줌 레벨에 따라 적응적인 시간 간격과 마커를 표시
 * 
 * 주요 기능:
 * - 적응적 시간 간격 (0.5초~30초)
 * - 주요/보조 마커 시스템
 * - 드래그 가능한 플레이헤드
 * - 실시간 시간 정보 표시
 * - 줌 레벨별 세밀도 조정
 * 
 * 시간 표시 형식:
 * - 1분 이상: "분:초" (예: 1:30)
 * - 10초 이상: "초s" (예: 45s)  
 * - 10초 미만: "초.밀리초s" (예: 5.3s)
 * 
 * 줌 레벨별 간격:
 * - 200px/s 이상: 0.5초 간격
 * - 100px/s 이상: 1초 간격
 * - 50px/s 이상: 2초 간격
 * - 25px/s 이상: 5초 간격
 * - 10px/s 이상: 10초 간격
 * - 그 외: 30초 간격
 */

import React, { memo } from 'react';

interface TimelineRulerProps {
  zoom: number; // 픽셀/초
  scrollLeft: number;
  totalDuration: number;
  currentTime: number;
  localPlayheadTime?: number; // 로컬 플레이헤드 시간 (재생 중 사용)
  isPlaying?: boolean;
  onPlayheadMouseDown: (e: React.MouseEvent) => void;
  isDraggingPlayhead: boolean;
  onRulerClick?: (e: React.MouseEvent) => void; // 룰러 클릭 핸들러 추가
}

export const TimelineRuler: React.FC<TimelineRulerProps> = memo(({
  zoom,
  scrollLeft,
  totalDuration,
  currentTime,
  localPlayheadTime,
  isPlaying = false,
  onPlayheadMouseDown,
  isDraggingPlayhead,
  onRulerClick
}) => {
  // 줌 레벨에 따른 시간 간격 결정
  const getTimeInterval = () => {
    if (zoom >= 200) return 0.5;      // 0.5초 간격
    if (zoom >= 100) return 1;        // 1초 간격  
    if (zoom >= 50) return 2;         // 2초 간격
    if (zoom >= 25) return 5;         // 5초 간격
    if (zoom >= 10) return 10;        // 10초 간격
    return 30;                        // 30초 간격
  };

  const timeInterval = getTimeInterval();
  const majorInterval = timeInterval >= 10 ? timeInterval : timeInterval * 10; // 주요 마커 간격

  // 시간을 분:초.밀리초 형식으로 포맷
  const formatTime = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const milliseconds = Math.floor((seconds % 1) * 10); // 0.1초 단위

    if (minutes > 0) {
      // 1분 이상: "분:초" 형식
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    } else if (seconds >= 10) {
      // 10초 이상: "초s" 형식
      return `${totalSeconds}s`;
    } else {
      // 10초 미만: "초.밀리초s" 형식
      return `${totalSeconds}.${milliseconds}s`;
    }
  };

  // 시간 마커 생성
  const generateTimeMarkers = () => {
    const markers = [];
    const maxTime = Math.max(totalDuration, 60); // 최소 1분은 표시

    for (let time = 0; time <= maxTime; time += timeInterval) {
      const x = time * zoom;
      const isMajorMarker = time % majorInterval === 0;
      const isMinorMarker = !isMajorMarker;

      markers.push(
        <React.Fragment key={time}>
          {/* 마커 라인 */}
          <div
            className={`absolute top-0 ${isMajorMarker
              ? 'w-0.5 bg-gray-300'
              : 'w-px bg-gray-500'
              }`}
            style={{
              left: `${x}px`,
              height: isMajorMarker ? '40px' : '20px'
            }}
          />

          {/* 시간 텍스트 (주요 마커에만 표시) */}
          {isMajorMarker && (
            <div
              className="absolute top-0 text-xs text-gray-300 select-none pointer-events-none"
              style={{
                left: `${x + 4}px`,
                lineHeight: '40px' // 높이와 맞춤
              }}
            >
              {formatTime(time)}
            </div>
          )}

          {/* 세밀한 눈금 (줌이 클 때만) */}
          {zoom >= 100 && isMinorMarker && (
            <div
              className="absolute w-px bg-gray-600"
              style={{
                left: `${x}px`,
                top: '30px',
                height: '10px'
              }}
            />
          )}
        </React.Fragment>
      );
    }

    return markers;
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 relative overflow-hidden flex-shrink-0" style={{ height: '40px', zIndex: 5 }}>
      {/* 스크롤되는 타임라인 컨테이너 */}
      <div
        className="relative h-full cursor-pointer"
        style={{
          width: `${Math.max(totalDuration * zoom, 2000)}px`,
          transform: `translateX(-${scrollLeft}px)`
        }}
        onClick={onRulerClick}
      >
        {/* 배경 그리드 */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, #6b7280 1px, transparent 1px)',
            backgroundSize: `${zoom}px 100%`
          }}
        />

        {/* 시간 마커들 */}
        {generateTimeMarkers()}

        {/* 0초 마커 (특별 표시) */}
        <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-400" />
        <div className="absolute left-1 top-0 text-xs text-blue-400 select-none pointer-events-none" style={{ lineHeight: '40px' }}>
          0:00
        </div>

        {/* 플레이헤드 라인 (룰러 영역) - 로컬 시간 사용 */}
        <div
          className={`absolute top-0 w-0.5 h-full bg-red-500 pointer-events-none`}
          style={{
            left: `${(localPlayheadTime ?? currentTime) * zoom - scrollLeft}px`, // scrollLeft를 직접 계산에 포함
            transition: isDraggingPlayhead ? 'none' : isPlaying ? 'none' : 'left 0.1s ease-out',
            zIndex: 8
          }}
        />

        {/* 플레이헤드 핸들 (룰러 영역) - 로컬 시간 사용 */}
        <div
          className="absolute cursor-grab active:cursor-grabbing group"
          style={{
            left: `${(localPlayheadTime ?? currentTime) * zoom - scrollLeft - 20}px`, // scrollLeft를 직접 계산에 포함 (더 큰 핸들)
            top: '0px', // 전체 높이 사용
            width: '40px', // 더 큰 클릭 영역
            height: '40px', // 룰러 전체 높이
            zIndex: 9, // 메인메뉴보다 낮게 설정
            position: 'absolute',
            transition: isDraggingPlayhead ? 'none' : isPlaying ? 'none' : 'left 0.1s ease-out',
            isolation: 'isolate',
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => {
            console.log('🎯 TimelineRuler 플레이헤드 클릭:', {
              target: e.target,
              currentTarget: e.currentTarget,
              clientX: e.clientX,
              clientY: e.clientY
            });
            onPlayheadMouseDown(e);
          }}
          title="드래그하여 시간 이동"
        >
          {/* 핸들 모양 - 더 굵은 테두리와 그림자 */}
          <div className="w-full h-full bg-red-500 rounded border-2 border-red-700 shadow-2xl flex items-center justify-center relative hover:bg-red-400 transition-colors">
            {/* 상단 삼각형 (더 큰 크기) */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-red-500 drop-shadow-lg" />

            {/* 내부 그립 (더 큰 크기) */}
            <div className="flex space-x-1">
              <div className="w-1.5 h-6 bg-white rounded-full opacity-95 shadow-md" />
              <div className="w-1.5 h-6 bg-white rounded-full opacity-80 shadow-md" />
              <div className="w-1.5 h-6 bg-white rounded-full opacity-95 shadow-md" />
            </div>

            {/* 호버 효과 */}
            <div className="absolute inset-0 bg-red-300 opacity-0 group-hover:opacity-30 rounded transition-all duration-200" />

            {/* 초강력 외곽선 */}
            <div className="absolute inset-0 border-4 border-yellow-400 opacity-0 group-hover:opacity-60 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* 고정된 시간 정보 (오른쪽 상단) - z-index 낮게 설정 */}
      <div
        className="absolute top-1 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded"
        style={{ zIndex: 1 }} // 타임헤드보다 극도로 낮게 설정
      >
        <span className="text-[10px] text-gray-500">
          줌: {zoom}px/s ({timeInterval}s 간격)
        </span>
        &nbsp;&nbsp;
        <span>총 길이: {formatTime(totalDuration)}</span>
      </div>
    </div>
  );
});

// memo의 displayName 설정 (디버깅용)
TimelineRuler.displayName = 'TimelineRuler';
