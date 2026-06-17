import type { ClipType } from '../types/clipTypes';
import type { DynamicProperty, SourceDataType } from '../types/baseClips';

// 각 클립 타입별 선택 가능한 동적 속성 정의
export const DYNAMIC_PROPERTIES_CONFIG: Record<ClipType, { propertyName: string; label: string; sourceData: string }[]> = {
  imageClip: [
    { propertyName: 'mediaUrl', label: 'Image URL', sourceData: 'text' }
  ],
  videoClip: [
    { propertyName: 'mediaUrl', label: 'Video URL', sourceData: 'text' }
  ],
  audioClip: [
    { propertyName: 'mediaUrl', label: 'Audio URL', sourceData: 'text' }
  ],
  textClip: [
    { propertyName: 'text', label: 'Text Content', sourceData: 'text' }
  ],
  sentenceClip: [
    { propertyName: 'text', label: 'Text Content', sourceData: 'text' }
  ],
  shapeClip: [
    { propertyName: 'shapeProperties.backgroundImageUrl', label: 'Background Image URL', sourceData: 'text' }
  ],
  polygonShapeClip: [
    { propertyName: 'polygonShapeProperties.backgroundImageUrl', label: 'Background Image URL', sourceData: 'text' }
  ],
  simpleShapeClip: [
    { propertyName: 'simpleShapeClipProperties.backgroundImageUrl', label: 'Background Image URL', sourceData: 'text' }
  ]
};

// 동적 속성 키 유효성 검증
export const isValidDynamicProperty = (clipType: ClipType, property: DynamicProperty): boolean => {
  const validProperties = DYNAMIC_PROPERTIES_CONFIG[clipType] || [];
  return validProperties.some(prop => prop.propertyName === property.propertyName);
};

// 클립 타입별 사용 가능한 동적 속성 목록 반환
export const getAvailableDynamicProperties = (clipType: ClipType): { propertyName: string; label: string; sourceData: string }[] => {
  return DYNAMIC_PROPERTIES_CONFIG[clipType] || [];
};

// 호환성을 위한 헬퍼 함수들
export const createDynamicProperty = (propertyName: string, sourceData: SourceData): DynamicProperty => ({
  propertyName,
  sourceData
});

export const getDynamicPropertyNames = (dynamicProperties: DynamicProperty[]): string[] => {
  return dynamicProperties.map(prop => prop.propertyName);
};