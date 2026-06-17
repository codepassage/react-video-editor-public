/**
 * 🔄 dataConverter.ts - 템플릿 데이터 변환 순수 함수들
 * 
 * Template과 UnifiedProjectData 간의 양방향 데이터 변환을 처리합니다.
 * 순수 함수로 구현되어 부작용이 없고 테스트하기 쉽습니다.
 * 
 * 주요 기능:
 * - Template → UnifiedProjectData 변환
 * - UnifiedProjectData → Template 변환
 * - 메타데이터 보존 및 생성
 */

import type { UnifiedProjectData } from '../../unifiedProjectManager';
import type { Template } from './types';

/**
 * Template 객체를 UnifiedProjectData로 변환합니다
 * 
 * @param template 변환할 템플릿 객체
 * @returns UnifiedProjectData 형태로 변환된 데이터
 */
export const templateToUnifiedData = (template: Template): UnifiedProjectData => {
  return {
    tracks: template.tracks,
    projectSettings: template.projectSettings,
    bundles: template.bundles || [],
    templateGroups: template.templateGroups || [],
    metadata: {
      exportedAt: template.updatedAt || template.createdAt,
      version: template.metadata.version,
      editorVersion: 'template-system',
      type: 'template',
      name: template.name,
      description: template.description,
      templateId: template.id
    }
  };
};

/**
 * UnifiedProjectData를 Template 객체로 변환합니다
 * 
 * @param unifiedData 변환할 UnifiedProjectData
 * @param templateId 생성할 템플릿의 ID
 * @param typeId 템플릿 타입 ID (기본값: 'template')
 * @returns Template 형태로 변환된 데이터
 */
export const unifiedDataToTemplate = (
  unifiedData: UnifiedProjectData, 
  templateId: string,
  typeId: string = 'template'
): Template => {
  const now = new Date().toISOString();
  
  // 통계 정보 계산
  const totalClips = unifiedData.tracks.reduce((sum, track) => sum + track.clips.length, 0);
  const totalTracks = unifiedData.tracks.length;
  const bundleCount = unifiedData.bundles?.length || 0;
  const templateGroupCount = unifiedData.templateGroups?.length || 0;
  
  // 지속시간 계산
  const allClips = unifiedData.tracks.flatMap(track => track.clips);
  const duration = allClips.length > 0 ? Math.max(...allClips.map(clip => clip.endTime)) : 0;

  return {
    id: templateId,
    name: unifiedData.metadata.name || 'Unnamed Template',
    description: unifiedData.metadata.description,
    typeId,
    tracks: unifiedData.tracks,
    projectSettings: unifiedData.projectSettings,
    bundles: unifiedData.bundles || [],
    templateGroups: unifiedData.templateGroups || [],
    createdAt: now,
    updatedAt: now,
    metadata: {
      version: unifiedData.metadata.version || '1.0.0',
      totalClips,
      totalTracks,
      duration,
      bundleCount,
      templateGroupCount
    }
  };
};

// 타입 재수출 (편의성)
export type { Template } from './types';