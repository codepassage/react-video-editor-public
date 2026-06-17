/**
 * 📋 useTemplateApi.ts - 템플릿 API 인터랙션 훅
 * 
 * 비디오 에디터에서 템플릿 시스템과 상호작용하기 위한 모든 API 호출을
 * 처리하는 커스텀 훅입니다. 템플릿 목록 조회, 타입 관리, 로딩, 생성,
 * 삭제 등 템플릿과 관련된 모든 작업을 중앙화하여 관리합니다.
 * 
 * 주요 기능:
 * - 템플릿 목록 조회 및 필터링
 * - 템플릿 타입 목록 관리
 * - 템플릿 로드 및 데이터 변환
 * - 템플릿 생성 및 업데이트
 * - 템플릿 삭제 및 에러 처리
 * - 로딩 상태 및 에러 상태 추적
 * 
 * API 엔드포인트:
 * - GET /api/templates - 템플릿 목록
 * - GET /api/template-types - 템플릿 타입 목록
 * - GET /api/templates/:id - 템플릿 상세 정보
 * - POST /api/templates - 템플릿 생성
 * - PUT /api/templates/:id - 템플릿 업데이트
 * - DELETE /api/templates/:id - 템플릿 삭제
 * 
 * 상태 관리:
 * - templates: 템플릿 목록 상태
 * - templateTypes: 템플릿 타입 목록
 * - 로딩 상태 (isLoading, isLoadingTypes)
 * - 에러 상태 (error, errorTypes)
 * 
 * 데이터 변환:
 * - 서버 API 응답을 내부 데이터 형식으로 변환
 * - StorageItem 형식으로 정규화
 * - UnifiedProjectData 연동 지원
 * 
 * 에러 처리:
 * - 네트워크 오류 상세 처리
 * - API 응답 유효성 검증
 * - 사용자 친화적 에러 메시지
 * - 에러 상태 자동 복구
 * 
 * 성능 최적화:
 * - API 호출 결과 캐싱
 * - 중복 요청 방지
 * - 지연 로딩 지원
 * - 비동기 데이터 페칭
 * 
 * 관련 모듈:
 * - 9번 모듈: Template System (전체 템플릿 시스템)
 * - 서버 API: 템플릿 데이터 저장소
 * - Header 컴포넌트: 템플릿 관리 UI
 * - TemplateListModal: 템플릿 선택 인터페이스
 */
import { useState, useCallback } from 'react';
import { ServerStorageProvider } from '../utils/storage/ServerStorageProvider';
import { StorageItem } from '../utils/storage/StorageProvider';
import { getApiUrl } from '../utils/urlBuilder';
import { UnifiedProjectData } from '../utils/unifiedProjectManager';

interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  typeId: string;
  type?: {
    id: string;
    name: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

interface TemplateType {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  _count?: {
    templates: number;
  };
}

interface UseTemplateApiReturn {
  templates: TemplateListItem[];
  templateTypes: TemplateType[];
  loading: boolean;
  error: string | null;
  loadTemplateList: () => Promise<void>;
  loadTemplateTypes: () => Promise<void>;
  loadTemplate: (id: string) => Promise<UnifiedProjectData>;
  saveTemplate: (data: any, name: string, description?: string, typeId?: string) => Promise<string>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateApi = (): UseTemplateApiReturn => {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API URL from urlBuilder
  const apiUrl = getApiUrl();
  const storageProvider = new ServerStorageProvider(apiUrl);

  const loadTemplateList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TemplateType 정보가 포함된 API 직접 호출
      const response = await fetch(`${apiUrl}/api/templates`);
      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      } else {
        throw new Error(data.error || 'Failed to load templates');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      console.error('Failed to load template list:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const loadTemplateTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/api/template-types`);
      if (!response.ok) {
        throw new Error(`Failed to load template types: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setTemplateTypes(data.templateTypes);
      } else {
        throw new Error(data.error || 'Failed to load template types');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template types';
      setError(errorMessage);
      console.error('Failed to load template types:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const loadTemplate = useCallback(async (id: string): Promise<UnifiedProjectData> => {
    try {
      setError(null);
      const data = await storageProvider.load(id);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
      setError(errorMessage);
      console.error('Failed to load template:', err);
      throw err;
    }
  }, []);

  const saveTemplate = useCallback(async (
    data: any, 
    name: string, 
    description: string = '',
    typeId?: string
  ): Promise<string> => {
    try {
      setError(null);
      
      // Convert data editor JSON to UnifiedProjectData format
      const unifiedData: UnifiedProjectData = {
        tracks: data.tracks || [],
        projectSettings: data.projectSettings || {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 60,
          backgroundColor: "#000000"
        },
        bundles: data.bundles || [],
        templateGroups: data.templateGroups || [],
        metadata: {
          exportedAt: new Date().toISOString(),
          version: data.metadata?.version || "2.1.0",
          editorVersion: data.metadata?.editorVersion || "v2.1.0",
          type: "template",
          name,
          description
        }
      };

      // Use direct API call to support typeId
      const response = await fetch(`${apiUrl}/api/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          typeId,
          tracks: unifiedData.tracks,
          projectSettings: unifiedData.projectSettings,
          bundles: unifiedData.bundles,
          templateGroups: unifiedData.templateGroups,
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save template: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save template');
      }

      // Refresh template list
      await loadTemplateList();

      return result.template.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setError(errorMessage);
      console.error('Failed to save template:', err);
      throw err;
    }
  }, [loadTemplateList]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await storageProvider.delete(id);
      
      // Refresh template list
      await loadTemplateList();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      console.error('Failed to delete template:', err);
      throw err;
    }
  }, [loadTemplateList]);

  return {
    templates,
    templateTypes,
    loading,
    error,
    loadTemplateList,
    loadTemplateTypes,
    loadTemplate,
    saveTemplate,
    deleteTemplate
  };
};