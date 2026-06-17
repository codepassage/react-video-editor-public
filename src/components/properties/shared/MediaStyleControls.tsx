import React from 'react';
import { Settings } from 'lucide-react';
import { ShapeSelector } from '../polygonShape/components/ShapeSelector';
import { BackgroundTypeSelector } from '../polygonShape/components/BackgroundTypeSelector';
import { ColorBackgroundEditor } from '../polygonShape/components/ColorBackgroundEditor';
import { GradientBackgroundEditor } from '../polygonShape/components/GradientBackgroundEditor';
import { ImageBackgroundEditor } from '../polygonShape/components/ImageBackgroundEditor';
import { BorderRadiusEditor } from '../polygonShape/components/BorderRadiusEditor';
import { EdgeFadeEditor } from '../polygonShape/components/EdgeFadeEditor';
import { usePolygonShapeState } from '../polygonShape/hooks/usePolygonShapeState';

interface MediaStyleControlsProps {
  clip: any; // PolygonShape 타입
  onUpdate: (clipId: string, updates: any) => void;
  titlePrefix?: string;
  showShapeSelector?: boolean;
  showBackgroundControls?: boolean;
  showBorderControls?: boolean;
  showEffectControls?: boolean;
}

export const MediaStyleControls: React.FC<MediaStyleControlsProps> = ({
  clip,
  onUpdate,
  titlePrefix = '',
  showShapeSelector = true,
  showBackgroundControls = true,
  showBorderControls = true,
  showEffectControls = true
}) => {
  // 상태 관리 훅 사용
  const {
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
    updatePolygonShapeProperties
  } = usePolygonShapeState({ clip, onUpdate });

  // 이벤트 핸들러들
  const handleShapeTypeChange = (type: 'star' | 'heart' | 'triangle' | 'diamond' | 'circle' | 'rectangle') => {
    setShapeType(type);
    updatePolygonShapeProperties({ shapeType: type });
  };

  const handleBackgroundTypeChange = (type: 'image' | 'color' | 'gradient') => {
    setBackgroundType(type);
    if (type === 'gradient') {
      // 그래디언트 선택 시 기본 그래디언트 생성
      updatePolygonShapeProperties({
        backgroundType: type,
        gradient: {
          type: 'linear',
          angle: 0,
          centerX: 50,
          centerY: 50,
          stops: [
            { color: '#3b82f6', position: 0 },
            { color: '#1d4ed8', position: 100 }
          ]
        }
      });
    } else {
      updatePolygonShapeProperties({ backgroundType: type });
    }
  };

  const handleColorChange = (color: string) => {
    setBackgroundColor(color);
    updatePolygonShapeProperties({
      backgroundType: 'color',
      backgroundColor: color
    });
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings size={16} className="text-green-400" />
          <h3 className="text-white font-medium">{titlePrefix} 미디어 설정</h3>
        </div>
      </div>

      {/* 도형 선택 */}
      {showShapeSelector && (
        <ShapeSelector
          shapeType={shapeType}
          onShapeChange={handleShapeTypeChange}
        />
      )}

      {/* 배경 컨트롤 */}
      {showBackgroundControls && (
        <>
          {/* 배경 타입 선택 */}
          <BackgroundTypeSelector
            backgroundType={backgroundType}
            onBackgroundTypeChange={handleBackgroundTypeChange}
          />

          {/* 색상 배경 설정 */}
          {backgroundType === 'color' && (
            <ColorBackgroundEditor
              backgroundColor={backgroundColor}
              onColorChange={handleColorChange}
            />
          )}

          {/* 그래디언트 배경 설정 */}
          {backgroundType === 'gradient' && (
            <GradientBackgroundEditor
              clip={clip}
              updatePolygonShapeProperties={updatePolygonShapeProperties}
            />
          )}

          {/* 이미지 배경 설정 */}
          {backgroundType === 'image' && (
            <ImageBackgroundEditor
              clip={clip}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              backgroundFit={backgroundFit}
              setBackgroundFit={setBackgroundFit}
              backgroundPosition={backgroundPosition}
              setBackgroundPosition={setBackgroundPosition}
              updatePolygonShapeProperties={updatePolygonShapeProperties}
            />
          )}
        </>
      )}

      {/* 둥근 테두리 설정 */}
      {showBorderControls && (
        <BorderRadiusEditor
          clip={clip}
          borderRadius={borderRadius}
          setBorderRadius={setBorderRadius}
          borderRadiusUnit={borderRadiusUnit}
          setBorderRadiusUnit={setBorderRadiusUnit}
          updatePolygonShapeProperties={updatePolygonShapeProperties}
        />
      )}

      {/* Edge Fade 설정 */}
      {showEffectControls && (
        <EdgeFadeEditor
          clip={clip}
          edgeFade={edgeFade}
          setEdgeFade={setEdgeFade}
          fadeType={fadeType}
          setFadeType={setFadeType}
          updatePolygonShapeProperties={updatePolygonShapeProperties}
        />
      )}
    </div>
  );
};