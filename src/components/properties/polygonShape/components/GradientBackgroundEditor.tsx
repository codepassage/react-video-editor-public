import React from 'react';
import type { TimelineClip } from '../../../../types';
import type { PolygonShapeProperties, GradientConfig } from '../../../../types/polygonShape.types';
import { GradientEditor } from '../../../common/ui';
import type { Gradient } from '../../../common/ui';

interface GradientBackgroundEditorProps {
  clip: TimelineClip;
  updatePolygonShapeProperties: (updates: Partial<PolygonShapeProperties>) => void;
}

export const GradientBackgroundEditor: React.FC<GradientBackgroundEditorProps> = ({
  clip,
  updatePolygonShapeProperties
}) => {
  // 타입 안전성을 위한 체크
  if (!('polygonShapeProperties' in clip)) {
    return <div>Invalid clip type for gradient editing</div>;
  }

  // PolygonShape GradientConfig를 공통 Gradient 타입으로 변환
  const convertToCommonGradient = (gradientConfig?: GradientConfig): Gradient => {
    const defaultGradient: Gradient = {
      type: 'linear',
      angle: 0,
      centerX: 50,
      centerY: 50,
      stops: [
        { color: '#3b82f6', position: 0 },
        { color: '#1d4ed8', position: 100 }
      ]
    };

    if (!gradientConfig) return defaultGradient;

    return {
      type: gradientConfig.type || 'linear',
      angle: gradientConfig.angle || 0,
      centerX: gradientConfig.centerX || 50,
      centerY: gradientConfig.centerY || 50,
      stops: gradientConfig.stops || defaultGradient.stops
    };
  };

  // 공통 Gradient 타입을 PolygonShape GradientConfig로 변환
  const convertToPolygonGradient = (gradient: Gradient): GradientConfig => {
    return {
      type: gradient.type,
      angle: gradient.angle,
      centerX: gradient.centerX,
      centerY: gradient.centerY,
      stops: gradient.stops
    };
  };

  const currentGradient = convertToCommonGradient(clip.polygonShapeProperties?.gradient);

  // 그래디언트 변경 핸들러
  const handleGradientChange = (gradient: Gradient) => {
    updatePolygonShapeProperties({
      backgroundType: 'gradient',
      gradient: convertToPolygonGradient(gradient)
    });
  };

  return (
    <GradientEditor
      label="배경 그래디언트"
      value={currentGradient}
      onChange={handleGradientChange}
      showPreview={true}
      previewHeight="h-8"
    />
  );
};
