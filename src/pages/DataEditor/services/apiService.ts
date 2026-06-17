/**
 * API 호출 관련 서비스
 */

import { getApiUrl } from '../../../utils/urlBuilder';

/**
 * 리소스 데이터 저장
 */
export const saveResourceData = async (
  resourceData: any,
  currentDataType: 'resource' | 'template' | 'csv-map',
  name: string,
  description?: string,
  resourceId?: string
): Promise<string | null> => {
  // 데이터 타입에 따른 API 엔드포인트와 데이터 필드 결정
  const getApiInfo = () => {
    switch (currentDataType) {
      case 'template':
        return {
          endpoint: `${getApiUrl()}/api/resource-templates`,
          dataField: 'templateData',
          updateEndpoint: `${getApiUrl()}/api/resource-templates/${resourceId}`
        };
      case 'csv-map':
        return {
          endpoint: `${getApiUrl()}/api/csv-column-maps`,
          dataField: 'mappingData',
          updateEndpoint: `${getApiUrl()}/api/csv-column-maps/${resourceId}`
        };
      default:
        return {
          endpoint: `${getApiUrl()}/api/resource-data`,
          dataField: 'data',
          updateEndpoint: `${getApiUrl()}/api/resource-data/${resourceId}`
        };
    }
  };

  const apiInfo = getApiInfo();
  let response;
  let savedResourceId;

  if (resourceId) {
    // 업데이트 모드 - 모든 타입에 대해 PUT 사용
    response = await fetch(apiInfo.updateEndpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        [apiInfo.dataField]: resourceData
      })
    });
    savedResourceId = resourceId;
  } else {
    // 새로 저장
    response = await fetch(apiInfo.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        [apiInfo.dataField]: resourceData
      })
    });

    if (response.ok) {
      const result = await response.json();
      savedResourceId = result.data?.id || result.resource?.id || result.template?.id || result.map?.id;
    }
  }

  if (!response.ok) {
    throw new Error('저장에 실패했습니다');
  }

  return savedResourceId || null;
};

/**
 * 템플릿 연결 (리소스 데이터용)
 */
export const connectToTemplate = async (templateId: string, resourceId: string): Promise<boolean> => {
  const compatibilityResponse = await fetch(`${getApiUrl()}/api/templates/${templateId}/compatible-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceIds: [resourceId]
    })
  });

  return compatibilityResponse.ok;
};

/**
 * 템플릿 연결 (리소스 템플릿용)
 */
export const connectResourceTemplateToTemplate = async (templateId: string, resourceTemplateId: string): Promise<boolean> => {
  const compatibilityResponse = await fetch(`${getApiUrl()}/api/templates/${templateId}/compatible-resource-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceTemplateIds: [resourceTemplateId]
    })
  });

  return compatibilityResponse.ok;
};

/**
 * TTS 생성
 */
export const generateTTS = async (resourceData: any): Promise<any> => {
  console.log('🎤 TTS 생성 요청:', resourceData);

  const response = await fetch(`${getApiUrl()}/api/auto-generate/resource-tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceData,
      options: {
        batchSize: 3, // 동시 처리 개수
        speed: 1.0,   // 말하기 속도
        voice: undefined // 기본 음성 사용
      }
    })
  });

  return response.json();
};

/**
 * 렌더링
 */
export const render = async (transformedData: any): Promise<any> => {
  const response = await fetch(`${getApiUrl()}/api/auto-generate/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectData: transformedData,
      outputFormat: 'mp4',
      validateMedia: true
    })
  });

  return response.json();
};

// Export API service functions
export const apiService = {
  saveResourceData,
  connectToTemplate,
  connectResourceTemplateToTemplate,
  generateTTS,
  render
};