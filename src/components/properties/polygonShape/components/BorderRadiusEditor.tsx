import React from 'react';
import { convertBorderRadiusUnit } from '../../../../utils/polygonShape.utils';
import type { TimelineClip } from '../../../../types';
import type { PolygonShapeProperties } from '../../../../types/polygonShape.types';
import { SliderWithNumber, UnitToggle, CheckboxWithLabel } from '../../../common/ui';

interface BorderRadiusEditorProps {
  clip: TimelineClip;
  borderRadius: number;
  setBorderRadius: (value: number) => void;
  borderRadiusUnit: 'px' | '%';
  setBorderRadiusUnit: (unit: 'px' | '%') => void;
  updatePolygonShapeProperties: (updates: Partial<PolygonShapeProperties>) => void;
}

export const BorderRadiusEditor: React.FC<BorderRadiusEditorProps> = ({
  clip,
  borderRadius,
  setBorderRadius,
  borderRadiusUnit,
  setBorderRadiusUnit,
  updatePolygonShapeProperties
}) => {
  // 단위 변경 핸들러
  const handleUnitChange = (newUnit: 'px' | '%') => {
    const convertedValue = convertBorderRadiusUnit(
      borderRadius,
      borderRadiusUnit,
      newUnit,
      clip.width,
      clip.height
    );

    setBorderRadius(convertedValue);
    setBorderRadiusUnit(newUnit);
    updatePolygonShapeProperties({
      borderRadius: convertedValue,
      borderRadiusUnit: newUnit
    });
  };

  return (
    <div className="space-y-3">
      <CheckboxWithLabel
        label="둥근 테두리"
        checked={borderRadius > 0}
        onChange={(checked) => {
          const newRadius = checked ? (borderRadiusUnit === '%' ? 10 : 20) : 0;
          setBorderRadius(newRadius);
          updatePolygonShapeProperties({ borderRadius: newRadius });
        }}
      />

      {borderRadius > 0 && (
        <div className="space-y-3">
          {/* 단위 선택 */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">단위</label>
            <UnitToggle
              value={borderRadiusUnit}
              onChange={handleUnitChange}
            />
          </div>

          {/* 반지름 조절 */}
          <SliderWithNumber
            label="테두리 반지름"
            value={borderRadius}
            min={0}
            max={borderRadiusUnit === '%' ? 50 : 100}
            step={1}
            suffix={borderRadiusUnit}
            onChange={(value) => {
              setBorderRadius(value);
              updatePolygonShapeProperties({ borderRadius: value });
            }}
          />

          <div className="text-xs text-gray-400">
            {borderRadiusUnit === '%'
              ? '요소 크기에 비례하는 둥근 모서리 (반응형)'
              : '고정된 크기의 둥근 모서리 (절대값)'
            }
          </div>
        </div>
      )}
    </div>
  );
};
