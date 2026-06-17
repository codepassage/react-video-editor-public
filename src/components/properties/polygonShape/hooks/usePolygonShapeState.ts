import { useState, useEffect } from 'react';
import type { TimelineClip } from '../../../../types';
import type { PolygonShapeProperties } from '../../../../types/polygonShape.types';
import { createPolygonImage } from '../../../../utils/polygonShape.utils';

interface UsePolygonShapeStateProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: any) => void;
}

export const usePolygonShapeState = ({ clip, onUpdate }: UsePolygonShapeStateProps) => {
  // PolygonShape 속성 상태
  const [shapeType, setShapeType] = useState<'star' | 'heart' | 'triangle' | 'diamond' | 'circle' | 'rectangle'>(
    clip.polygonShapeProperties?.shapeType || 'rectangle'
  );
  const [backgroundType, setBackgroundType] = useState<'image' | 'color' | 'gradient'>(
    clip.polygonShapeProperties?.backgroundType || 'color'
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(
    clip.polygonShapeProperties?.backgroundColor || '#3b82f6'
  );
  const [backgroundFit, setBackgroundFit] = useState<'fill' | 'contain' | 'cover' | 'none' | 'scale-down'>(
    clip.polygonShapeProperties?.backgroundFit || 'fill'
  );
  const [backgroundPosition, setBackgroundPosition] = useState<string>(
    clip.polygonShapeProperties?.backgroundPosition || 'center'
  );
  const [borderRadius, setBorderRadius] = useState<number>(
    clip.polygonShapeProperties?.borderRadius || 0
  );
  const [borderRadiusUnit, setBorderRadiusUnit] = useState<'px' | '%'>(
    clip.polygonShapeProperties?.borderRadiusUnit || 'px'
  );

  // Edge Fade 상태
  const [edgeFade, setEdgeFade] = useState<number>(
    clip.polygonShapeProperties?.edgeFade || 0
  );
  const [fadeType, setFadeType] = useState<'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right'>(
    (clip.polygonShapeProperties?.fadeType as any) || 'radial'
  );

  // 이미지 URL 상태
  const [imageUrl, setImageUrl] = useState<string>(clip.mediaUrl || '');

  // PolygonShape 속성 업데이트
  const updatePolygonShapeProperties = (updates: Partial<PolygonShapeProperties>) => {
    try {
      
      const newProperties: PolygonShapeProperties = {
        shapeType,
        backgroundType,
        backgroundColor,
        backgroundImageUrl: clip.polygonShapeProperties?.backgroundImageUrl,
        backgroundFit,
        backgroundPosition,
        borderRadius,
        borderRadiusUnit,
        borderWidth: clip.polygonShapeProperties?.borderWidth,
        borderColor: clip.polygonShapeProperties?.borderColor,
        shadowEnabled: clip.polygonShapeProperties?.shadowEnabled,
        shadowOffsetX: clip.polygonShapeProperties?.shadowOffsetX,
        shadowOffsetY: clip.polygonShapeProperties?.shadowOffsetY,
        shadowBlur: clip.polygonShapeProperties?.shadowBlur,
        shadowColor: clip.polygonShapeProperties?.shadowColor,
        shadowSpread: clip.polygonShapeProperties?.shadowSpread,
        innerShadowEnabled: clip.polygonShapeProperties?.innerShadowEnabled,
        innerShadowOffsetX: clip.polygonShapeProperties?.innerShadowOffsetX,
        innerShadowOffsetY: clip.polygonShapeProperties?.innerShadowOffsetY,
        innerShadowBlur: clip.polygonShapeProperties?.innerShadowBlur,
        innerShadowColor: clip.polygonShapeProperties?.innerShadowColor,
        glowEnabled: clip.polygonShapeProperties?.glowEnabled,
        glowColor: clip.polygonShapeProperties?.glowColor,
        glowSize: clip.polygonShapeProperties?.glowSize,
        glowIntensity: clip.polygonShapeProperties?.glowIntensity,
        edgeFade,
        fadeType,
        gradient: clip.polygonShapeProperties?.gradient,
        ...updates
      };

      
      // 클립 업데이트 (SVG 이미지 생성 제거 - 렌더링에서 직접 처리)
      onUpdate(clip.id, {
        polygonShapeProperties: newProperties
      });
    } catch (error) {
      console.error('PolygonShape 업데이트 에러:', error);
    }
  };

  // 클립 속성 변경 시 로컬 상태 업데이트
  useEffect(() => {
    if (clip.polygonShapeProperties) {
      const props = clip.polygonShapeProperties;
      setShapeType(props.shapeType || 'rectangle');
      setBackgroundType(props.backgroundType || 'color');
      setBackgroundColor(props.backgroundColor || '#3b82f6');
      setBackgroundFit(props.backgroundFit || 'fill');
      setBackgroundPosition(props.backgroundPosition || 'center');
      setBorderRadius(props.borderRadius || 0);
      setBorderRadiusUnit(props.borderRadiusUnit || 'px');
      setEdgeFade(props.edgeFade || 0);
      setFadeType(props.fadeType || 'radial');
      
      // 이미지 URL 동기화 - backgroundImageUrl 우선
      if (props.backgroundImageUrl) {
        setImageUrl(props.backgroundImageUrl);
      }
    }

    // mediaUrl로도 동기화 (폴백)
    if (clip.mediaUrl && !clip.polygonShapeProperties?.backgroundImageUrl) {
      setImageUrl(clip.mediaUrl);
    }
  }, [clip.polygonShapeProperties, clip.mediaUrl]);

  return {
    // 상태값들
    shapeType,
    setShapeType,
    backgroundType,
    setBackgroundType,
    backgroundColor,
    setBackgroundColor,
    backgroundFit,
    setBackgroundFit,
    backgroundPosition,
    setBackgroundPosition,
    borderRadius,
    setBorderRadius,
    borderRadiusUnit,
    setBorderRadiusUnit,
    edgeFade,
    setEdgeFade,
    fadeType,
    setFadeType,
    imageUrl,
    setImageUrl,
    
    // 업데이트 함수
    updatePolygonShapeProperties
  };
};
