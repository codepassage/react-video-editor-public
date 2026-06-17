import React from 'react';
import { shapeOptions } from '../../../../utils/polygonShape.utils';
import { PresetGrid } from '../../../common/ui';

interface ShapeSelectorProps {
  shapeType: 'star' | 'heart' | 'triangle' | 'diamond' | 'circle' | 'rectangle';
  onShapeChange: (type: 'star' | 'heart' | 'triangle' | 'diamond' | 'circle' | 'rectangle') => void;
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  shapeType,
  onShapeChange
}) => {
  const presetItems = shapeOptions.map(shape => ({
    name: shape.name,
    value: shape.type,
    icon: shape.icon,
    description: shape.name,
    isSelected: shapeType === shape.type,
    selectedColor: 'purple',
    onClick: () => onShapeChange(shape.type)
  }));

  return (
    <PresetGrid
      label="도형 타입 선택"
      items={presetItems}
      columns={3}
    />
  );
};
