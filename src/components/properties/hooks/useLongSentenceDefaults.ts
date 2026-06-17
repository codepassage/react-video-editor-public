import { useMemo } from 'react';
import { LongSentenceClip } from '../../../types/clipTypes';

export const useLongSentenceDefaults = (clip: LongSentenceClip) => {
  const mediaDefaults = useMemo(() => ({
    x: 960,
    y: 540,
    width: 400,
    height: 300,
    opacity: 1.0,
    rotation: 0,
    volume: 1.0,
    playbackRate: 1.0,
  }), []);

  const textDefaults = useMemo(() => ({
    // 위치 및 크기
    x: 100,
    y: 100, 
    width: 800,
    height: 200,
    opacity: 1.0,
    rotation: 0,
    positioning: 'coordinate' as const,
    positionMargin: { top: 50, right: 50, bottom: 50, left: 50 },
    
    // 기본 텍스트 스타일
    color: clip.color || '#ffffff',
    fontSize: clip.fontSize || 24,
    fontFamily: clip.fontFamily || 'Arial',
    fontWeight: clip.fontWeight || 'normal',
    textAlign: clip.textAlign || 'center',
    lineHeight: clip.lineHeight || 1.2,
    letterSpacing: clip.letterSpacing || 0,
    textDecoration: clip.textDecoration || 'none',
    textTransform: clip.textTransform || 'none',
    
    // 배경 및 테두리
    backgroundColor: clip.backgroundColor || 'transparent',
    borderRadius: clip.borderRadius || 0,
    borderRadiusUnit: clip.borderRadiusUnit || 'px',
    
    // 그림자 및 효과
    textShadow: clip.textShadow || 'none',
    backgroundShadow: clip.backgroundShadow || 'none',
    strokeWidth: clip.strokeWidth || 0,
    strokeColor: clip.strokeColor || '#000000',
  }), [clip.color, clip.fontSize, clip.fontFamily, clip.fontWeight, clip.textAlign, clip.lineHeight, clip.letterSpacing, clip.textDecoration, clip.textTransform, clip.backgroundColor, clip.borderRadius, clip.borderRadiusUnit, clip.textShadow, clip.backgroundShadow, clip.strokeWidth, clip.strokeColor]);

  return {
    mediaDefaults,
    textDefaults
  };
};