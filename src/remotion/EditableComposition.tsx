import React, { useState, useCallback, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useEditorStore } from '../store/editorStore';
import { TimelineClip, calculateClipZIndex } from '../types';

// 편집 가능한 클립 렌더러 (드래그 기능 포함)
const SimpleEditableClip: React.FC<{ 
  clip: TimelineClip; 
  currentTimeInSeconds: number;
  zIndex: number;
  isSelected: boolean;
  onSelect: (clipId: string) => void;
  onDrag: (clipId: string, deltaX: number, deltaY: number) => void;
}> = ({ clip, currentTimeInSeconds, zIndex, isSelected, onSelect, onDrag }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  
  // 클립이 현재 시간에 보여야 하는지 확인
  const shouldShow = currentTimeInSeconds >= clip.startTime && currentTimeInSeconds < clip.endTime;
  if (!shouldShow) return null;

  // 클립 내에서의 상대적 시간
  const clipProgress = (currentTimeInSeconds - clip.startTime) / clip.duration;
  
  // 마우스 다운 - 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ 클립 마우스 다운:', { clipId: clip.id.slice(-8), type: clip.mediaType });
    
    // 클립 선택
    onSelect(clip.id);
    
    // 드래그 시작
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    
    // 글로벌 마우스 이벤트 리스너 추가
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      console.log('🔄 드래그 중:', { deltaX, deltaY });
      onDrag(clip.id, deltaX, deltaY);
    };
    
    const handleMouseUp = () => {
      console.log('🖱️ 마우스 업: 드래그 종료');
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [clip.id, clip.mediaType, dragStart, onSelect, onDrag]);

  // 기본 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: clip.x || 100,
    top: clip.y || 100,
    width: clip.width || 200,
    height: clip.height || 150,
    zIndex: zIndex,
    cursor: isDragging ? 'grabbing' : 'grab',
    // 클릭 영역을 명확히 하기 위한 배경색
    backgroundColor: isSelected 
      ? 'rgba(100, 181, 246, 0.3)' 
      : 'rgba(255, 255, 255, 0.1)',
    border: isSelected 
      ? '3px solid #64b5f6' 
      : '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    boxSizing: 'border-box',
    // 드래그 중일 때 스케일 효과
    transform: isDragging ? 'scale(1.05)' : 'scale(1)',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    // 그림자 효과
    boxShadow: isSelected 
      ? '0 8px 25px rgba(100, 181, 246, 0.4)' 
      : '0 4px 15px rgba(0, 0, 0, 0.2)'
  };

  // 콘텐츠 스타일 (컨테이너 내부에 꽉 채우기)
  const contentStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '2px',
    userSelect: 'none'
  };

  // 미디어 타입별 콘텐츠 렌더링
  const renderContent = () => {
    switch (clip.mediaType) {
      case 'text':
        return (
          <div style={{
            ...contentStyle,
            backgroundColor: clip.backgroundColor || 'rgba(0, 0, 0, 0.7)',
            color: clip.color || '#ffffff',
            fontSize: clip.fontSize || 32,
            fontFamily: clip.fontFamily || 'Arial, sans-serif',
            fontWeight: clip.fontWeight || 'normal',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '10px'
          }}>
            {clip.text || 'Text'}
          </div>
        );

      case 'image':
        return (
          <img
            src={clip.mediaUrl || '/placeholder-image.png'}
            alt="Media"
            style={{
              ...contentStyle,
              objectFit: 'cover'
            }}
            draggable={false}
          />
        );

      case 'video':
        return (
          <video
            src={clip.mediaUrl}
            style={{
              ...contentStyle,
              objectFit: 'cover'
            }}
            muted
            playsInline
            ref={(video) => {
              if (video) {
                try {
                  const videoTime = clipProgress * (clip.duration || 1);
                  video.currentTime = Math.max(0, Math.min(videoTime, video.duration || 0));
                } catch (error) {
                  // 비디오 시간 설정 에러 무시
                }
              }
            }}
          />
        );

      default:
        return (
          <div style={{
            ...contentStyle,
            backgroundColor: '#cccccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: '#666'
          }}>
            {clip.mediaType}
          </div>
        );
    }
  };

  return (
    <div 
      ref={dragRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      title={`${clip.mediaType} 클립 - 드래그하여 이동`}
    >
      {renderContent()}
      
      {/* 선택됨 표시 */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: -15,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#64b5f6',
          color: 'white',
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '10px',
          fontWeight: 'bold',
          pointerEvents: 'none'
        }}>
          선택됨
        </div>
      )}
      
      {/* 드래그 중 표시 */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          top: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff6b6b',
          color: 'white',
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '10px',
          fontWeight: 'bold',
          pointerEvents: 'none'
        }}>
          🔄 드래그 중...
        </div>
      )}
    </div>
  );
};

// 편집 가능한 컴포지션 (드래그 기능 포함)
export const EditableComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { tracks, selectedClips, selectClips, updateClip, projectSettings } = useEditorStore();
  
  // 현재 시간을 초 단위로 계산
  const currentTimeInSeconds = frame / fps;
  
  // 모든 클립들을 수집하고 레이어 순서대로 정렬
  const allClips: Array<{ clip: TimelineClip; zIndex: number }> = [];
  
  tracks.forEach((track, trackIndex) => {
    track.clips.forEach((clip, clipIndex) => {
      const zIndex = calculateClipZIndex(trackIndex, clipIndex);
      allClips.push({ clip, zIndex });
    });
  });

  // z-index 순서대로 정렬
  allClips.sort((a, b) => a.zIndex - b.zIndex);
  
  // 현재 시간대에 보여야 할 클립들 필터링
  const visibleClips = allClips.filter(({ clip }) => {
    return currentTimeInSeconds >= clip.startTime && currentTimeInSeconds < clip.endTime;
  });
  
  // 클립 선택 핸들러
  const handleSelectClip = useCallback((clipId: string) => {
    console.log('🎯 클립 선택 처리:', { clipId: clipId.slice(-8) });
    selectClips([clipId]); // 단순히 해당 클립만 선택
  }, [selectClips]);

  // 드래그 핸들러
  const handleDragClip = useCallback((clipId: string, deltaX: number, deltaY: number) => {
    console.log('🔄 클립 드래그:', { clipId: clipId.slice(-8), deltaX, deltaY });
    
    // 현재 클립 찾기
    const clip = allClips.find(({ clip }) => clip.id === clipId)?.clip;
    if (!clip) return;
    
    // 새 위치 계산 (음수 방지)
    const newX = Math.max(0, (clip.x || 100) + deltaX);
    const newY = Math.max(0, (clip.y || 100) + deltaY);
    
    // 위치 업데이트
    updateClip(clipId, { x: newX, y: newY });
  }, [allClips, updateClip]);

  // 배경 클릭 핸들러
  const handleBackgroundClick = useCallback(() => {
    console.log('🔲 배경 클릭: 선택 해제');
    selectClips([]);
  }, [selectClips]);

  return (
    <AbsoluteFill 
      style={{ backgroundColor: projectSettings.backgroundColor }}
      onClick={handleBackgroundClick}
    >
      {/* 프로젝트 배경색 */}
      <AbsoluteFill style={{ backgroundColor: projectSettings.backgroundColor }} />
      
      {/* 모든 클립들을 렌더링 */}
      {visibleClips.map(({ clip, zIndex }) => (
        <SimpleEditableClip
          key={clip.id}
          clip={clip}
          currentTimeInSeconds={currentTimeInSeconds}
          zIndex={zIndex}
          isSelected={selectedClips.includes(clip.id)}
          onSelect={handleSelectClip}
          onDrag={handleDragClip}
        />
      ))}
      
      {/* 간단한 디버그 정보 */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        color: '#ffffff',
        fontSize: 14,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '10px',
        borderRadius: 8,
        zIndex: 9999,
        border: '2px solid #64b5f6'
      }}>
        <div style={{ color: '#81c784', marginBottom: '8px', fontWeight: 'bold' }}>
          🎦 편집 모드 (드래그 가능)
        </div>
        <div>시간: {currentTimeInSeconds.toFixed(1)}초</div>
        <div>전체 클립: {allClips.length}개</div>
        <div>보이는 클립: {visibleClips.length}개</div>
        {selectedClips.length > 0 && (
          <div style={{ color: '#ffeb3b', marginTop: '8px' }}>
            선택된 클립: {selectedClips.length}개
          </div>
        )}
      </div>
      
      {/* 클립이 없을 때 안내 */}
      {visibleClips.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ffffff',
          fontSize: 24,
          textAlign: 'center',
          background: 'rgba(0,0,0,0.7)',
          padding: '20px',
          borderRadius: '10px'
        }}>
          <div>클립이 없거나 현재 시간에 보이지 않습니다</div>
          <div style={{ fontSize: 16, marginTop: '10px', opacity: 0.7 }}>
            현재 시간: {currentTimeInSeconds.toFixed(1)}초
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
