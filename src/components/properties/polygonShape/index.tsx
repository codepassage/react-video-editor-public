import React from 'react';
import type { TimelineClip } from '../../../types';
import type { PolygonShapeProperties } from '../../../types/polygonShape.types';

// 분리된 훅들
import { usePolygonShapeState } from './hooks/usePolygonShapeState';

// 분리된 컴포넌트들
import { ShapeSelector } from './components/ShapeSelector';
import { BackgroundTypeSelector } from './components/BackgroundTypeSelector';
import { ColorBackgroundEditor } from './components/ColorBackgroundEditor';
import { GradientBackgroundEditor } from './components/GradientBackgroundEditor';
import { ImageBackgroundEditor } from './components/ImageBackgroundEditor';
import { ImagePropertiesEditor } from './ImagePropertiesEditor';
import { ImageFitEditor } from './ImageFitEditor';

interface PolygonShapeEditorProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: any) => void;
}

export const PolygonShapeEditor: React.FC<PolygonShapeEditorProps> = ({ clip, onUpdate }) => {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🔷</span>
          <h3 className="text-white font-medium">PolygonShape Editor</h3>
        </div>
      </div>

      {/* 도형 선택 */}
      <ShapeSelector
        shapeType={shapeType}
        onShapeChange={handleShapeTypeChange}
      />

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
        <>
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

          {/* 이미지 핏 설정 패널 */}
          <ImageFitEditor
            backgroundFit={backgroundFit}
            setBackgroundFit={setBackgroundFit}
            backgroundPosition={backgroundPosition}
            setBackgroundPosition={setBackgroundPosition}
            updatePolygonShapeProperties={updatePolygonShapeProperties}
          />
        </>
      )}

      {/* 이미지 속성 패널 (노란 점선 영역) - 모든 배경 타입에서 표시 */}
      <ImagePropertiesEditor
        clip={clip}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        borderRadius={borderRadius}
        setBorderRadius={setBorderRadius}
        borderRadiusUnit={borderRadiusUnit}
        setBorderRadiusUnit={setBorderRadiusUnit}
        edgeFade={edgeFade}
        setEdgeFade={setEdgeFade}
        fadeType={fadeType}
        setFadeType={setFadeType}
        updatePolygonShapeProperties={updatePolygonShapeProperties}
      />



    </div>
  );
};
