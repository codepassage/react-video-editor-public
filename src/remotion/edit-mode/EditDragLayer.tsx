// 편집 모드용 레이어 렌더링 - 시간 기반 렌더링 제거
import React, { useMemo } from 'react';
import type { EditDragItem } from './EditDragItem';
import { ClipRenderer } from '../ClipRenderer';
import type { TimelineClip } from '../../types';

export const EditDragLayer: React.FC<{
  item: EditDragItem;
}> = ({ item }) => {
  // 오디오 클립은 레이아웃 편집모드에서 렌더링하지 않음
  if (item.mediaType === 'audio') {
    return null;
  }

  // EditDragItem을 TimelineClip 형태로 변환
  const timelineClip: TimelineClip = useMemo(() => ({
    id: item.id,
    mediaId: item.mediaId || '',
    trackId: item.trackId,
    startTime: item.clipStartTime,
    endTime: item.clipEndTime,
    duration: item.clipEndTime - item.clipStartTime,
    mediaType: item.mediaType,
    mediaUrl: item.mediaUrl,
    x: item.left,
    y: item.top,
    width: item.width,
    height: item.height,
    
    // Shape 속성 추가
    shapeProperties: item.shapeProperties,
    
    // 일반 속성들 (원본 또는 기본값 사용)
    opacity: item.opacity ?? 1,
    rotation: item.rotation ?? 0,
    scaleX: item.scaleX ?? 1,
    scaleY: item.scaleY ?? 1,
    skewX: item.skewX ?? 0,
    skewY: item.skewY ?? 0,
    anchorX: item.anchorX ?? 0.5,
    anchorY: item.anchorY ?? 0.5,
    blendMode: item.blendMode || 'normal',
    
    // 텍스트 속성들 (EditDragItem의 속성들 사용, 하드코딩 제거)
    text: item.text,
    fontSize: item.fontSize ?? 32,
    fontFamily: item.fontFamily ?? 'Arial, sans-serif',
    fontWeight: item.fontWeight ?? 'normal',
    color: item.textColor ?? (item.mediaType === 'text' ? '#ffffff' : '#000000'),
    backgroundColor: item.backgroundColor ?? (item.mediaType === 'text' ? item.color : 'transparent'),
    textAlign: item.textAlign ?? 'center',
    lineHeight: item.lineHeight ?? 1.2,
    letterSpacing: item.letterSpacing ?? 0,
    textDecoration: item.textDecoration ?? 'none',
    textTransform: item.textTransform ?? 'none',
    wordWrap: item.wordWrap ?? false,
    paddingTop: item.paddingTop ?? 0,
    paddingRight: item.paddingRight ?? 0,
    paddingBottom: item.paddingBottom ?? 0,
    paddingLeft: item.paddingLeft ?? 0,
    shadowOffsetX: item.shadowOffsetX ?? 0,
    shadowOffsetY: item.shadowOffsetY ?? 0,
    shadowBlur: item.shadowBlur ?? 0,
    shadowColor: item.shadowColor ?? '#000000',
    strokeWidth: item.strokeWidth ?? 0,
    strokeColor: item.strokeColor ?? '#000000',
  }), [item]);

  // 🎯 트랙 번호에 따른 z-index 계산
  const getZIndex = () => {
    if (!item.trackId) return 1;
    
    // trackId에서 번호 추출 ("track-1" → 1)
    const trackNumber = parseInt(item.trackId.replace('track-', '')) || 1;
    
    // 트랙 번호가 클수록 높은 z-index (위 트랙이 더 위에 표시)
    return trackNumber * 10;
  };

  // ✅ Sequence 제거 - 편집 모드에서는 정적 렌더링
  return (
    <ClipRenderer
      clip={timelineClip}
      currentTimeInSeconds={0}
      zIndex={getZIndex()}
      isEditMode={true}
    />
  );
};
