import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDragLayer } from 'react-dnd';
import { isBaseClip, TimelineClip } from '../../types';
import { useEditorStore } from '../../store/editorStore';

interface DragPositionOverlayProps {
  zoom: number;
  scrollLeft: number;
  allClips: TimelineClip[];
  tracks: any[];
}

export const DragPositionOverlay: React.FC<DragPositionOverlayProps> = ({
  zoom,
  scrollLeft,
  allClips,
  tracks
}) => {
  const { snapValue } = useEditorStore();

  const {
    isDragging,
    item,
    initialClientOffset,
    initialSourceClientOffset,
    clientOffset
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    initialClientOffset: monitor.getInitialClientOffset(),
    initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
    clientOffset: monitor.getClientOffset()
  }));

  // 드래그 시작시 캡처된 Option 키 상태 사용
  const isOptionPressed = item?.optionKeyPressed || false;

  if (!isDragging || !item || !initialClientOffset || !initialSourceClientOffset || !clientOffset) {
    return null;
  }

  // 클립 드래그인 경우만 표시
  if (item.type !== 'clip') {
    return null;
  }

  // 현재 마우스 위치를 시간으로 계산 (드래그 핸들러와 동일한 로직)
  const timelineRect = document.querySelector('.timeline-container')?.getBoundingClientRect();
  if (!timelineRect) return null;

  const mouseX = clientOffset.x - timelineRect.left;
  
  // 드래그 오프셋 계산 (드래그 핸들러와 동일)
  const dragOffsetX = initialClientOffset.x - initialSourceClientOffset.x;
  
  // 클립의 실제 위치 계산 (드래그 핸들러와 동일)
  const objectLeftX = mouseX - dragOffsetX;
  const absoluteX = objectLeftX + scrollLeft;
  const rawTime = absoluteX / zoom;
  
  // 스냅 적용 여부에 따른 시간 계산
  const snappedTime = isOptionPressed ? Math.round(rawTime / snapValue) * snapValue : rawTime;
  const currentTime = Math.max(0, snappedTime);

  // 현재 클립 찾기
  const currentClip = allClips.find(c => c.id === item.clipId);
  if (!currentClip) return null;

  const finalEndTime = currentTime + currentClip.duration;

  // 기준클립들의 경계점 찾기 및 충돌 분석
  const baseClips = allClips.filter(c => isBaseClip(c) && c.id !== item.clipId);

  // 각 기준클립과의 충돌 상태 분석 (checkBaseClipOverlap와 동일한 로직)
  const clipAnalysis = baseClips.map(clip => {
    const EPSILON = 0.0001;
    const clip1Start = currentTime;
    const clip1End = finalEndTime;
    const clip2Start = clip.startTime;
    const clip2End = clip.endTime;

    // checkBaseClipOverlap와 동일한 로직
    const wouldOverlap = (clip1Start < clip2End - EPSILON && clip1End > clip2Start + EPSILON);

    return {
      id: clip.id.slice(-8),
      start: clip.startTime,
      end: clip.endTime,
      wouldOverlap,
      status: wouldOverlap ? '❌ 충돌' : '✅ 안전',
      debug: {
        condition1: `${clip1Start.toFixed(3)} < ${(clip2End - EPSILON).toFixed(3)} = ${clip1Start < clip2End - EPSILON}`,
        condition2: `${clip1End.toFixed(3)} > ${(clip2Start + EPSILON).toFixed(3)} = ${clip1End > clip2Start + EPSILON}`,
        both: `${clip1Start < clip2End - EPSILON} && ${clip1End > clip2Start + EPSILON} = ${wouldOverlap}`
      }
    };
  });

  // 충돌하는 클립들과 가장 가까운 안전한 클립들 분류
  const conflictingClips = clipAnalysis.filter(c => c.wouldOverlap);
  const safeClips = clipAnalysis.filter(c => !c.wouldOverlap);

  // 가장 가까운 안전한 위치 계산
  const safePositions = baseClips.map(clip => [
    { pos: clip.endTime + 0.01, desc: `${clip.id.slice(-8)} 뒤` },
    { pos: clip.startTime - currentClip.duration - 0.01, desc: `${clip.id.slice(-8)} 앞` }
  ]).flat().filter(p => p.pos >= 0).sort((a, b) => {
    const distA = Math.abs(a.pos - currentTime);
    const distB = Math.abs(b.pos - currentTime);
    return distA - distB;
  });

  // 오버레이 위치 계산 - 드래그 중인 클립 바로 위에 배치
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // 드래그 중인 클립의 실제 높이 (타임라인 트랙 높이)
  const TRACK_HEIGHT = 60; // DEFAULT_TRACK_HEIGHT 값
  
  // 실제 박스 크기 계산 (내용에 따라 동적으로 조정)
  const baseHeight = 50; // 기본 높이 (위치 정보 + Raw 좌표)
  const conflictHeight = conflictingClips.length > 0 ? 35 + (conflictingClips.length * 40) : 0; // 충돌 정보 높이
  const safeHeight = safePositions.length > 0 ? 30 + (safePositions.slice(0, 2).length * 18) : 0; // 안전 위치 높이
  const otherHeight = safeClips.length > 0 ? 25 + (safeClips.length * 15) : 0; // 기타 클립 높이
  const padding = 32; // 상하 패딩
  
  const overlayHeight = baseHeight + conflictHeight + safeHeight + otherHeight + padding;
  
  // 실제 박스 너비 계산
  const contentWidth = Math.max(
    250, // 최소 너비
    currentTime.toFixed(2).length * 8 + finalEndTime.toFixed(2).length * 8 + 100, // 위치 텍스트 기반
    conflictingClips.length > 0 ? 300 : 0, // 충돌 정보가 있으면 더 넓게
    safePositions.length > 0 ? 280 : 0 // 안전 위치 정보가 있으면 더 넓게
  );
  const overlayWidth = Math.min(contentWidth, 400); // 최대 너비 제한
  
  // 마우스가 박스 중간에 위치하도록 계산
  let overlayX = clientOffset.x - overlayWidth / 2;
  let overlayY = clientOffset.y - TRACK_HEIGHT - overlayHeight - 10; // 클립 바로 위에 10px 간격
  
  // 우측 경계 벗어나면 조정
  if (overlayX + overlayWidth > windowWidth - 20) {
    overlayX = windowWidth - overlayWidth - 20;
  }
  
  // 좌측 경계 벗어나면 조정
  if (overlayX < 20) {
    overlayX = 20;
  }
  
  // 상단 경계 벗어나면 아래로 이동
  if (overlayY < 20) {
    overlayY = clientOffset.y + TRACK_HEIGHT + 10; // 클립 아래로 이동
  }
  
  // 하단 경계 벗어나면 위로 이동
  if (overlayY + overlayHeight > windowHeight - 20) {
    overlayY = clientOffset.y - overlayHeight - 10;
  }

  // 스냅된 클립 프리뷰 위치 계산
  const timelineContainer2 = document.querySelector('.timeline-container');
  const timelineRect2 = timelineContainer2?.getBoundingClientRect();
  
  let clipPreviewElement = null;
  if (timelineRect2 && currentClip) {
    const snappedX = currentTime * zoom - scrollLeft;
    const clipPreviewX = timelineRect2.left + snappedX;
    
    // Y 위치는 마우스를 따라가도록 (스냅 없음)
    const trackHeight = 60; // DEFAULT_TRACK_HEIGHT
    const clipPreviewY = clientOffset.y - (trackHeight / 2); // 마우스 중앙에 클립 위치
    
    const clipPreviewWidth = currentClip.duration * zoom;
    const clipPreviewHeight = trackHeight - 6; // 위아래 3px 여백
    
    clipPreviewElement = (
      <div
        style={{
          position: 'fixed',
          left: clipPreviewX,
          top: clipPreviewY,
          width: clipPreviewWidth,
          height: clipPreviewHeight,
          background: isOptionPressed 
            ? 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 50%, #e1bee7 100%)' // 스냅 활성화 시 보라색
            : 'linear-gradient(135deg, #2196f3 0%, #64b5f6 50%, #bbdefb 100%)', // 일반 드래그 시 파란색
          border: isOptionPressed ? '2px solid #9c27b0' : '2px solid #2196f3',
          borderRadius: '6px',
          opacity: 0.8,
          zIndex: 999998,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '10px',
          fontWeight: '600',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        {isOptionPressed ? '🧲' : '📌'} {currentTime.toFixed(2)}s
      </div>
    );
  }

  const overlayElement = (
    <>
      {/* 클립 프리뷰 (스냅된 위치에 표시) */}
      {clipPreviewElement}
      
      {/* 정보 오버레이 */}
      <div
        style={{
          position: 'fixed',
          top: overlayY,
          left: overlayX,
          width: overlayWidth,
          height: overlayHeight,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 999999,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          boxSizing: 'border-box'
        }}
      >
      <div style={{ marginBottom: '6px' }}>
        <strong style={{ color: '#e2e8f0' }}>🎯 드래그 위치: {currentTime.toFixed(2)}s - {finalEndTime.toFixed(2)}s</strong>
        {isOptionPressed && (
          <span style={{ 
            marginLeft: '8px', 
            color: '#9c27b0', 
            fontSize: '11px', 
            fontWeight: '600',
            background: 'rgba(156, 39, 176, 0.2)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(156, 39, 176, 0.3)'
          }}>
            🧲 스냅 {snapValue}s
          </span>
        )}
      </div>
      <div style={{ marginBottom: '6px', fontSize: '10px', color: '#94a3b8' }}>
        Raw 좌표: {rawTime.toFixed(3)}s {isOptionPressed ? `→ 스냅: ${snappedTime.toFixed(3)}s` : '(스냅핑 없음)'}
      </div>

      {conflictingClips.length > 0 && (
        <div style={{ marginBottom: '6px', color: '#fca5a5' }}>
          <strong>❌ 충돌하는 기준클립:</strong>
          {conflictingClips.map((clip, index) => (
            <div key={index} style={{ fontSize: '11px', marginLeft: '8px', marginTop: '2px' }}>
              <div style={{ color: '#fecaca' }}>{clip.id}: {clip.start.toFixed(2)}s - {clip.end.toFixed(2)}s</div>
              <div style={{ fontSize: '9px', color: '#fed7d7', marginTop: '1px' }}>
                {clip.debug.condition1}<br />
                {clip.debug.condition2}<br />
                결과: {clip.debug.both}
              </div>
            </div>
          ))}
        </div>
      )}

      {safePositions.length > 0 && (
        <div style={{ marginBottom: '6px', color: '#86efac' }}>
          <strong>✅ 추천 안전 위치:</strong>
          {safePositions.slice(0, 2).map((pos, index) => (
            <div key={index} style={{ fontSize: '11px', marginLeft: '8px', marginTop: '2px', color: '#bbf7d0' }}>
              {pos.pos.toFixed(2)}s ({pos.desc})
            </div>
          ))}
        </div>
      )}

      {safeClips.length > 0 && (
        <div style={{ color: '#cbd5e1' }}>
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>다른 기준클립들:</div>
          {safeClips.map((clip, index) => (
            <div key={index} style={{ fontSize: '10px', marginLeft: '8px', color: '#94a3b8' }}>
              {clip.id}: {clip.start.toFixed(2)}s - {clip.end.toFixed(2)}s ({clip.status})
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );

  return createPortal(overlayElement, document.body);
};