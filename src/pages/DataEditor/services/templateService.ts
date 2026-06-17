/**
 * 템플릿 생성 및 변환 서비스
 */

import { applyOptimalDuration } from '../../../utils/durationUtils';
import { getApiUrl } from '../../../utils/urlBuilder';

/**
 * 리소스 데이터를 템플릿으로 변환
 * 규칙:
 * 1. 재귀적으로 탐색하면서 모든 containers의 요소를 첫번째 하나만 남기기
 * 2. text는 빈 문자열로 설정
 */
export const generateResourceTemplate = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // 배열인 경우
  if (Array.isArray(data)) {
    return data.map(item => generateResourceTemplate(item));
  }

  // 객체인 경우
  const result: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (key === 'data' && value && typeof value === 'object' && 'text' in value) {
      // 1. text는 빈 문자열로 설정
      result[key] = {
        ...value,
        text: ''
      };
    } else if (key === 'containers') {
      // 2. containers 배열의 첫 번째 요소만 유지하고 재귀 처리
      if (Array.isArray(value) && value.length > 0) {
        result[key] = [generateResourceTemplate(value[0])];
      } else {
        result[key] = [];
      }
    } else if (Array.isArray(value)) {
      // 다른 배열들 (items 등)은 모든 요소를 유지하고 재귀 처리
      result[key] = value.map(item => generateResourceTemplate(item));
    } else if (value && typeof value === 'object') {
      // 다른 객체들은 재귀적으로 처리
      result[key] = generateResourceTemplate(value);
    } else {
      // 원시값들은 그대로 복사
      result[key] = value;
    }
  }

  return result;
};

/**
 * 리소스 템플릿 생성 조건 확인
 */
export const isResourceTemplateGenerationEnabled = (
  currentDataType: string,
  resourceData: any,
  hasResourceDataLoaded: boolean
): boolean => {
  // 현재 리소스 템플릿 타입이고, 리소스 데이터에 데이터가 있어야 함
  if (currentDataType !== 'template') return false;
  
  if (!resourceData || !resourceData.items || !Array.isArray(resourceData.items) || resourceData.items.length === 0) {
    return false;
  }
  
  return hasResourceDataLoaded;
};

/**
 * 템플릿 생성 결과 검증
 */
export const validateGeneratedTemplate = (templateData: any): boolean => {
  if (!templateData || typeof templateData !== 'object') {
    return false;
  }

  // items 배열이 있는지 확인
  if (!templateData.items || !Array.isArray(templateData.items)) {
    return false;
  }

  // 각 아이템의 text 필드가 빈 문자열인지 확인
  const hasEmptyTextFields = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return true;
    
    if (Array.isArray(obj)) {
      return obj.every(item => hasEmptyTextFields(item));
    }
    
    // data.text가 있으면 빈 문자열이어야 함
    if (obj.data && obj.data.text !== undefined) {
      if (obj.data.text !== '') return false;
    }
    
    // 재귀적으로 모든 필드 검사
    return Object.values(obj).every(value => hasEmptyTextFields(value));
  };

  return hasEmptyTextFields(templateData);
};

/**
 * 템플릿 변환 (서버 API 호출)
 */
export const transform = async (template: any, resourceData: any, useNestedForm: boolean): Promise<any> => {
  try {
    console.log('🔄 템플릿 변환 시작:', { template, resourceData, useNestedForm });
    
    // useNestedForm 여부에 따라 다른 엔드포인트 사용
    const endpoint = useNestedForm ? `${getApiUrl()}/api/auto-generate/transform-nested` : `${getApiUrl()}/api/auto-generate/transform`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template,
        resourceData
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '변환 실패');
    }

    console.log('✅ 템플릿 변환 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 템플릿 변환 오류:', error);
    throw error;
  }
};

/**
 * 변환된 데이터를 JSON 파일로 저장
 */
export const saveAsJson = (data: any): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transformed-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 변환된 데이터를 비디오 에디터로 전송 (기존 방식 복원)
 */
export const sendToVideoEditor = (data: any): void => {
  if (!data) {
    console.error('❌ 전송할 데이터가 없습니다.');
    return;
  }

  try {
    // 편집시간 자동 계산 및 적용
    const updatedProjectSettings = applyOptimalDuration(
      data.projectSettings,
      data.tracks
    );

    // 동영상 생성 화면으로 데이터 전달 (번들과 템플릿 그룹 완전 제거)
    const transferData = {
      ...data,
      projectSettings: updatedProjectSettings,
      bundles: [],
      templateGroups: [],
      bundleTemplateGroupRelations: [],
      timestamp: new Date().toISOString(),
      source: 'auto-generation'
    };

    sessionStorage.setItem('data-editor-transfer-data', JSON.stringify(transferData));

    // [에디터로 전송] 버튼은 데이터 전달 체크박스 상태와 무관하게 무조건 데이터 전달
    // 임시로 데이터 전달을 활성화하여 데이터가 전달되도록 함
    localStorage.setItem('video-editor-data-transfer', 'true');

    console.log('🚀 [에디터로 전송] 버튼: 데이터 전달 강제 활성화 및 데이터 전송');

    // 동영상 생성 화면으로 이동
    window.location.href = '/';
  } catch (error) {
    console.error('❌ 에디터로 전송 중 오류 발생:', error);
    throw error;
  }
};

// Export service functions
export const templateService = {
  generateResourceTemplate,
  isResourceTemplateGenerationEnabled,
  validateGeneratedTemplate,
  transform,
  saveAsJson,
  sendToVideoEditor
};