/**
 * 데이터 유효성 검증 유틸리티
 */

/**
 * 리소스 데이터 구조 검증
 */
export const validateResourceData = (
  resourceData: any, 
  dataType: 'resource' | 'template' | 'csv-map'
): { isValid: boolean; errorMessage?: string } => {
  if (!resourceData) {
    return {
      isValid: false,
      errorMessage: '데이터가 없습니다.'
    };
  }

  // 타입별 데이터 구조 검증
  if (dataType === 'csv-map') {
    // CSV 맵은 mapping 구조를 가져야 함 (또는 다른 CSV 관련 필드)
    if (!resourceData.mapping && !resourceData.data && !resourceData.rows) {
      return {
        isValid: false,
        errorMessage: '잘못된 CSV 맵 데이터입니다.'
      };
    }
  } else {
    // 리소스 데이터와 템플릿은 items 배열이 필요
    if (!resourceData.items || !Array.isArray(resourceData.items)) {
      return {
        isValid: false,
        errorMessage: '잘못된 리소스 데이터입니다. items 배열이 필요합니다.'
      };
    }
  }

  return { isValid: true };
};

/**
 * 중첩 구조 감지
 */
export const detectNestedStructure = (resourceData: any): boolean => {
  if (!resourceData || !resourceData.items) {
    return false;
  }

  return resourceData.metadata?.hasNestedStructure ||
    resourceData.version === '2.0.0' ||
    resourceData.items.some((item: any) =>
      item.nestingLevel !== undefined ||
      item.templateGroupId ||
      item.bundleId ||
      (item.containers && item.containers.some((c: any) => c.nestingLevel !== undefined))
    );
};

/**
 * JSON 파일 유효성 검증
 */
export const validateJsonFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new Error('JSON 파일만 업로드 가능합니다.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('유효하지 않은 JSON 파일입니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
    reader.readAsText(file);
  });
};

/**
 * 템플릿 호환성 검증
 */
export const validateTemplateCompatibility = (template: any, resourceData: any): boolean => {
  if (!template || !resourceData) {
    return false;
  }

  // 템플릿과 리소스 데이터의 구조가 호환되는지 확인
  // 실제 로직은 서버 측에서 처리되므로 기본적인 검증만 수행
  return !!(template.id && resourceData.items);
};

// Export validation functions
export const dataValidation = {
  validateResourceData,
  detectNestedStructure,
  validateJsonFile,
  validateTemplateCompatibility
};