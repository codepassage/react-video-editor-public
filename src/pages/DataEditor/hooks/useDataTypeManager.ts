import { useState } from 'react';

/**
 * 데이터 타입별 상태 관리 Hook
 */
export const useDataTypeManager = () => {
  // 현재 데이터 타입
  const [currentDataType, setCurrentDataType] = useState<'resource' | 'template' | 'csv-map'>('resource');
  
  // 각 데이터 타입별로 별도 상태 관리
  const [dataByType, setDataByType] = useState<{
    resource: any;
    template: any;
    'csv-map': any;
  }>({
    resource: { items: [] },
    template: { items: [] },
    'csv-map': { mapping: {} }
  });


  // 현재 타입의 데이터 가져오기
  const getCurrentData = () => dataByType[currentDataType];
  
  // 현재 타입의 데이터 설정하기
  const setCurrentData = (newData: any) => {
    setDataByType(prev => ({
      ...prev,
      [currentDataType]: newData
    }));
  };

  // 편의를 위한 현재 데이터 직접 접근
  const resourceData = dataByType[currentDataType];
  const setResourceData = setCurrentData;

  // 데이터 타입 전환 핸들러
  const handleDataTypeSwitch = (newType: 'resource' | 'template' | 'csv-map') => {
    console.log(`🔄 데이터 타입 전환: ${currentDataType} → ${newType}`);
    setCurrentDataType(newType);
    
    // 기본 데이터가 없으면 초기화
    if (!dataByType[newType] || Object.keys(dataByType[newType]).length === 0) {
      const defaultData = newType === 'csv-map' 
        ? { mapping: {} }
        : { items: [] };
      
      setDataByType(prev => ({
        ...prev,
        [newType]: defaultData
      }));
      
      console.log(`📝 ${newType} 타입의 기본 데이터 사용`);
    }
  };

  return {
    // 현재 데이터 타입
    currentDataType,
    setCurrentDataType,
    
    // 타입별 데이터
    dataByType,
    setDataByType,
    
    // 현재 데이터 편의 접근
    resourceData,
    setResourceData,
    
    // 헬퍼 함수들
    getCurrentData,
    setCurrentData,
    handleDataTypeSwitch,
  };
};