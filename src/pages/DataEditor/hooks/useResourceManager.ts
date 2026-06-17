import { useState } from 'react';

/**
 * 리소스 데이터 관리 Hook
 */
export const useResourceManager = () => {
  // 리소스 메타정보
  const [currentResourceId, setCurrentResourceId] = useState<string | null>(null);
  const [currentResourceName, setCurrentResourceName] = useState<string>('');

  // 로드된 데이터 아이템들
  const [loadedDataItems, setLoadedDataItems] = useState<Array<{
    id: string;
    name: string;
    type: 'resource' | 'template' | 'csv-map';
    data: any;
  }>>([]);
  
  const [currentLoadedDataId, setCurrentLoadedDataId] = useState<string | null>(null);

  // 리소스 데이터 로딩 함수
  const loadResourceData = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('JSON 파일 파싱에 실패했습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsText(file);
    });
  };

  // 리소스 데이터 유효성 검증
  const validateResourceData = (data: any, dataType: 'resource' | 'template' | 'csv-map'): boolean => {
    if (!data) {
      return false;
    }

    if (dataType === 'csv-map') {
      // CSV 맵은 mapping, data, rows 중 하나라도 있으면 유효
      return !!(data.mapping || data.data || data.rows);
    } else {
      // 리소스 데이터와 템플릿은 items 배열이 필요
      return !!(data.items && Array.isArray(data.items));
    }
  };

  // 리소스 메타데이터 업데이트
  const updateResourceMetadata = (resourceId?: string, resourceName?: string) => {
    setCurrentResourceId(resourceId || null);
    setCurrentResourceName(resourceName || '');
  };

  // 리소스 데이터 초기화
  const resetResourceData = () => {
    setCurrentResourceId(null);
    setCurrentResourceName('');
  };

  return {
    // 상태
    currentResourceId,
    setCurrentResourceId,
    currentResourceName,
    setCurrentResourceName,
    
    // 로드된 데이터
    loadedDataItems,
    setLoadedDataItems,
    currentLoadedDataId,
    setCurrentLoadedDataId,
    
    // 함수들
    loadResourceData,
    validateResourceData,
    updateResourceMetadata,
    resetResourceData,
  };
};