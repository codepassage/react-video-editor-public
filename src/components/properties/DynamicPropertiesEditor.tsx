import React from 'react';
import type { TimelineClip } from '../../types/core';
import type { DynamicProperty, SourceData } from '../../types/baseClips';
import { getAvailableDynamicProperties, isValidDynamicProperty, createDynamicProperty, getDynamicPropertyNames } from '../../constants/dynamicProperties';
import { getClipType } from '../../types/clipGuards';

interface DynamicPropertiesEditorProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: Partial<TimelineClip>) => void;
}

export const DynamicPropertiesEditor: React.FC<DynamicPropertiesEditorProps> = ({
  clip,
  onUpdate,
}) => {
  const clipType = getClipType(clip);
  const availableProperties = getAvailableDynamicProperties(clipType);

  // 현재 클립의 동적 속성 목록 (기본값 빈 배열)
  const currentDynamicProperties = clip.baseClipProperties?.dynamicProperties ||
    clip.regularClipProperties?.dynamicProperties ||
    [];

  const handlePropertyToggle = (propertyName: string, sourceData: SourceData, isSelected: boolean) => {
    const newProperty = createDynamicProperty(propertyName, sourceData);

    if (!isValidDynamicProperty(clipType, newProperty)) {
      console.warn(`Invalid dynamic property: ${propertyName} for clip type: ${clipType}`);
      return;
    }

    let updatedProperties: DynamicProperty[];

    if (isSelected) {
      // 속성 추가 (중복 방지)
      const propertyExists = currentDynamicProperties.some(prop => prop.propertyName === propertyName);
      if (!propertyExists) {
        updatedProperties = [...currentDynamicProperties, newProperty];
      } else {
        updatedProperties = currentDynamicProperties;
      }
    } else {
      // 속성 제거
      updatedProperties = currentDynamicProperties.filter(prop => prop.propertyName !== propertyName);
    }

    // 클립 속성 업데이트
    const updates: Partial<TimelineClip> = {};

    if (clip.baseClipProperties) {
      updates.baseClipProperties = {
        ...clip.baseClipProperties,
        dynamicProperties: updatedProperties
      };
    }

    if (clip.regularClipProperties) {
      updates.regularClipProperties = {
        ...clip.regularClipProperties,
        dynamicProperties: updatedProperties
      };
    }

    // 둘 다 없으면 regularClipProperties 생성
    if (!clip.baseClipProperties && !clip.regularClipProperties) {
      updates.regularClipProperties = {
        dynamicProperties: updatedProperties
      };
    }

    onUpdate(clip.id, updates);
  };

  // 디버깅용 로그 (필요시 활성화)
  // console.log('DynamicPropertiesEditor:', {
  //   clipType,
  //   availableProperties,
  //   currentDynamicProperties
  // });

  if (availableProperties.length === 0) {
    return (
      <div className="dynamic-properties-editor">
        <p className="text-sm text-gray-300">No dynamic properties available for {clipType}</p>
      </div>
    );
  }

  // 현재 선택된 속성 이름들
  const selectedPropertyNames = getDynamicPropertyNames(currentDynamicProperties);

  return (
    <div className="dynamic-properties-editor">
      <h4 className="text-sm font-medium text-white mb-3">Dynamic Properties</h4>
      <div className="space-y-2">
        {availableProperties.map(({ propertyName, label, sourceData }) => {
          const isSelected = selectedPropertyNames.includes(propertyName);

          return (
            <label
              key={propertyName}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handlePropertyToggle(propertyName, sourceData, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 rounded bg-gray-700"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-300">{label}</span>
                <div className="text-xs text-gray-500">({sourceData})</div>
              </div>
            </label>
          );
        })}
      </div>

      {/* 선택된 속성들 표시 */}
      {currentDynamicProperties.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-xs text-gray-400 mb-1">Selected properties:</div>
          <div className="flex flex-wrap gap-1">
            {currentDynamicProperties.map(property => (
              <span
                key={property.propertyName}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-600 text-white"
              >
                {availableProperties.find(p => p.propertyName === property.propertyName)?.label || property.propertyName}
                <span className="ml-1 opacity-75">({property.sourceData})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};