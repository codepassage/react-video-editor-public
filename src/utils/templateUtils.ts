/**
 * 🛡️ templateUtils.ts - 템플릿 시스템 통합 유틸리티
 * 
 * 템플릿의 저장, 불러오기, 삽입 등 모든 템플릿 관련 작업을 처리하는 핵심 유틸리티입니다.
 * UnifiedProjectManager와 연동하여 Bundle 정보를 포함한 완전한 템플릿 관리 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 통합 형식 템플릿 저장/불러오기 (Bundle 정보 포함)
 * - 타임헤드 위치에 템플릿 삽입 (push/overlay 모드)
 * - 템플릿 그룹화 및 Bundle 보존 기능
 * - ID 재생성 및 참조 관계 유지
 * - 스마트 트랙 병합 (기준클립/일반클립 자동 분류)
 * - 템플릿 검증 및 미리보기 데이터 생성
 * 
 * Bundle 시스템 통합:
 * - 템플릿 저장 시 Bundle 매핑 정보 포함
 * - 템플릿 불러오기 시 Bundle 관계 재구성
 * - Bundle ID 추적 테이블을 통한 정확한 참조 복원
 * 
 * 성능 최적화:
 * - Offset 재계산을 통한 클립 연결 관계 보정
 * - 대용량 템플릿에서도 빠른 ID 재생성
 * - 메모리 효율적인 트랙 병합 알고리즘
 * - 조건부 로딩으로 불필요한 API 호출 방지
 * 
 * 사용 패턴:
 * - 템플릿 저장소에서 템플릿 관리
 * - 재사용 가능한 비디오 구조 생성
 * - 복잡한 프로젝트의 구조화된 관리
 * 
 * 특별 고려사항:
 * - 기준클립과 일반클립의 엄격한 분리 정책
 * - 확장된 앵커 시스템 지원
 * - 다국어 및 폰트 시스템과의 연동
 * - 서버 API와의 안정적인 통신
 */

import axios from 'axios';
import { TimelineTrack, ProjectSettings, recalculateEndpointOffsets, isBaseClip, TemplateGroup, TimelineClip, Bundle } from '../types';
import { UnifiedProjectManager, UnifiedProjectData } from './unifiedProjectManager';
import { generateBundleMappings, regenerateBundlesForGroup, generateBundleMappingsWithIdTable } from './bundleMappingUtils';
import { getApiUrl } from './urlBuilder';
import { 
  templateToUnifiedData, 
  unifiedDataToTemplate,
  validateTemplateName,
  validateProjectForTemplate,
  calculateTemplateDuration,
  adjustTemplateStartTime,
  generateTemplatePreview,
  autoAdjustDurationAfterTemplateLoad,
  calculateStandardDuration
} from './template/index';

import type { Template } from './template/transformation/types';

// All template utility functions are now imported from modular structure
// Re-export for backward compatibility
export { 
  Template, 
  templateToUnifiedData, 
  unifiedDataToTemplate,
  validateTemplateName,
  validateProjectForTemplate,
  calculateTemplateDuration,
  adjustTemplateStartTime,
  generateTemplatePreview
};

export interface TemplateListItem {
  id: string;
  name: string;
  description?: string;
  typeId: string;
  type?: {
    id: string;
    name: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata: {
    version: string;
    totalClips: number;
    totalTracks: number;
    duration: number;
  };
}

// API 기본 설정
const API_BASE_URL = getApiUrl();

// 🌟 통합된 템플릿 저장 (Offset 재계산 포함, Bundle 정보 포함)
export const saveTemplate = async (
  name: string,
  description: string,
  tracks: TimelineTrack[],
  projectSettings: ProjectSettings,
  bundles?: Bundle[],
  templateGroups?: TemplateGroup[],
  typeId?: string,
  screenshot?: File
): Promise<Template> => {
  try {
    console.log('📝 통합 방식 템플릿 저장 시작 (Bundle 정보 포함):', {
      name,
      description,
      tracks: tracks.length,
      bundles: bundles?.length || 0,
      templateGroups: templateGroups?.length || 0
    });

    // // 🔧 1단계: Offset 재계산 수행
    // console.log('🔄 Offset 재계산 수행 중...');

    // // 모든 클립 수집
    // const allClips = tracks.flatMap(track => track.clips);

    // // Offset 재계산 실행 (확장된 앵커 지원)
    // const recalculateResult = recalculateEndpointOffsets(allClips, templateGroups, bundles);

    // console.log('🔄 Offset 재계산 결과:', {
    //   success: recalculateResult.success,
    //   processedCount: recalculateResult.processedCount,
    //   message: recalculateResult.message
    // });

    // // 2단계: 재계산된 클립들로 tracks 업데이트
    // let updatedTracks = tracks;

    // if (recalculateResult.success && recalculateResult.updatedClips.length > 0) {
    //   console.log('📊 재계산된 클립으로 tracks 업데이트 중...');

    //   // 재계산된 클립들의 맵 생성
    //   const updatedClipsMap = new Map(recalculateResult.updatedClips.map(clip => [clip.id, clip]));

    //   // tracks 업데이트
    //   updatedTracks = tracks.map(track => ({
    //     ...track,
    //     clips: track.clips.map(clip => {
    //       const updatedClip = updatedClipsMap.get(clip.id);
    //       return updatedClip || clip; // 재계산된 클립이 있으면 사용, 없으면 원본 사용
    //     })
    //   }));

    //   console.log('✅ Tracks 업데이트 완료');
    // } else {
    //   console.log('ℹ️ 재계산할 클립이 없어 원본 tracks 사용');
    // }

    // 🌟 3단계: 통합 형식으로 데이터 변환
    const unifiedData = UnifiedProjectManager.exportToUnifiedFormat(
      tracks,
      projectSettings,
      bundles,
      templateGroups,
      {
        type: 'template',
        name,
        description
      }
    );

    // 🔍 통합 데이터 검증
    const validation = UnifiedProjectManager.validateData(unifiedData);
    if (!validation.isValid) {
      throw new Error(`템플릿 데이터 유효성 검증 실패: ${validation.errors.join(', ')}`);
    }

    console.log('🌟 통합 형식으로 변환된 템플릿 데이터:', {
      type: unifiedData.metadata.type,
      name: unifiedData.metadata.name,
      tracksCount: unifiedData.tracks.length,
      bundlesCount: unifiedData.bundles?.length || 0,
      templateGroupsCount: unifiedData.templateGroups?.length || 0
    });

    // 4단계: 서버에 통합 형식으로 템플릿 저장
    console.log('💾 서버에 통합 형식 템플릿 저장 중...', {
      hasScreenshot: !!screenshot,
      screenshotSize: screenshot?.size
    });

    let response;
    
    if (screenshot) {
      // 스크린샷이 있는 경우 FormData 사용
      const formData = new FormData();
      formData.append('name', unifiedData.metadata.name || '');
      formData.append('description', unifiedData.metadata.description || '');
      formData.append('typeId', typeId || '');
      formData.append('tracks', JSON.stringify(unifiedData.tracks));
      formData.append('projectSettings', JSON.stringify(unifiedData.projectSettings));
      formData.append('bundles', JSON.stringify(unifiedData.bundles));
      formData.append('templateGroups', JSON.stringify(unifiedData.templateGroups));
      formData.append('screenshot', screenshot);
      
      response = await axios.post(`${API_BASE_URL}/api/templates`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } else {
      // 스크린샷이 없는 경우 기존 방식 사용
      response = await axios.post(`${API_BASE_URL}/api/templates`, {
        name: unifiedData.metadata.name,
        description: unifiedData.metadata.description,
        typeId: typeId,
        tracks: unifiedData.tracks,
        projectSettings: unifiedData.projectSettings,
        bundles: unifiedData.bundles,
        templateGroups: unifiedData.templateGroups
      });
    }

    if (!response.data.success) {
      throw new Error(response.data.error || '템플릿 저장에 실패했습니다');
    }

    console.log('✅ 통합 형식 템플릿 저장 완료:', {
      id: response.data.template.id,
      name: response.data.template.name,
      totalClips: response.data.template.metadata?.totalClips || 0,
      bundleCount: response.data.template.metadata?.bundleCount || 0,
      templateGroupCount: response.data.template.metadata?.templateGroupCount || 0
    });

    return response.data.template;

  } catch (error) {
    console.error('❌ 통합 형식 템플릿 저장 실패:', error);
    throw new Error(
      error instanceof Error ? error.message : '템플릿 저장 중 알 수 없는 오류가 발생했습니다'
    );
  }
};

// 템플릿 목록 조회
export const getTemplates = async (): Promise<TemplateListItem[]> => {
  try {
    console.log('📂 템플릿 목록 조회 중...');

    const response = await axios.get(`${API_BASE_URL}/api/templates`);

    if (!response.data.success) {
      throw new Error(response.data.error || '템플릿 목록 조회에 실패했습니다');
    }

    console.log(`📂 템플릿 목록 조회 완료: ${response.data.templates.length}개`);

    return response.data.templates;

  } catch (error) {
    console.error('❌ 템플릿 목록 조회 실패:', error);
    throw new Error(
      error instanceof Error ? error.message : '템플릿 목록 조회 중 알 수 없는 오류가 발생했습니다'
    );
  }
};

// 특정 템플릿 조회
export const getTemplate = async (templateId: string): Promise<Template> => {
  try {
    console.log(`📄 템플릿 조회 중: ${templateId}`);

    const response = await axios.get(`${API_BASE_URL}/api/templates/${templateId}`);

    if (!response.data.success) {
      throw new Error(response.data.error || '템플릿 조회에 실패했습니다');
    }

    console.log('📄 템플릿 조회 완료:', {
      id: response.data.template.id,
      name: response.data.template.name,
      totalClips: response.data.template.metadata?.totalClips || 0
    });

    return response.data.template;

  } catch (error) {
    console.error('❌ 템플릿 조회 실패:', error);
    throw new Error(
      error instanceof Error ? error.message : '템플릿 조회 중 알 수 없는 오류가 발생했습니다'
    );
  }
};

// 템플릿 삭제
export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    console.log(`🗑️ 템플릿 삭제 중: ${templateId}`);

    const response = await axios.delete(`${API_BASE_URL}/api/templates/${templateId}`);

    if (!response.data.success) {
      throw new Error(response.data.error || '템플릿 삭제에 실패했습니다');
    }

    console.log('🗑️ 템플릿 삭제 완료:', templateId);

  } catch (error) {
    console.error('❌ 템플릿 삭제 실패:', error);
    throw new Error(
      error instanceof Error ? error.message : '템플릿 삭제 중 알 수 없는 오류가 발생했습니다'
    );
  }
};

// 🌟 통합된 템플릿 불러오기 (Bundle 정보 포함)
// ⚠️ 기존 호환성을 위한 함수 (loadTemplateAtBeginning 사용 권장)
export const loadTemplate = async (
  templateId: string
): Promise<{
  tracks: TimelineTrack[];
  projectSettings: ProjectSettings;
  bundles?: Bundle[];
  templateGroups?: TemplateGroup[];
}> => {
  console.log('⚠️ loadTemplate은 loadTemplateAtBeginning으로 리다이렉트됩니다.');
  return loadTemplateAtBeginning(templateId);
};

/**
 * 🌟 통합된 템플릿 불러오기 함수 (기존 동작과 호환, Bundle 정보 포함)
 * @param templateId - 불러올 템플릿 ID
 * @returns 템플릿의 tracks, projectSettings, bundles, templateGroups
 */
export const loadTemplateAtBeginning = async (
  templateId: string
): Promise<{
  tracks: TimelineTrack[];
  projectSettings: ProjectSettings;
  bundles?: Bundle[];
  templateGroups?: TemplateGroup[];
}> => {
  try {
    console.log('📥 통합 방식 템플릿 불러오기 시작 (Bundle 정보 포함):', templateId.slice(-8));

    const template = await getTemplate(templateId);

    // 🌟 Template을 UnifiedProjectData로 변환
    const unifiedData = templateToUnifiedData(template);

    // 🔍 통합 데이터 검증
    const validation = UnifiedProjectManager.validateData(unifiedData);
    if (!validation.isValid) {
      console.warn('⚠️ 템플릿 데이터 검증 오류:', validation.errors);
      // 경고만 하고 계속 진행 (기존 템플릿과의 호환성)
    }

    // 📊 통계 생성
    const stats = UnifiedProjectManager.generateStatistics(unifiedData);

    console.log('📥 통합 방식으로 불러온 템플릿 데이터:', {
      name: unifiedData.metadata.name,
      tracks: stats.totalTracks,
      clips: stats.totalClips,
      bundles: stats.bundleCount,
      templateGroups: stats.templateGroupCount,
      hasBundles: stats.bundleCount > 0,
      hasTemplateGroups: stats.templateGroupCount > 0
    });

    // 🌟 ID 재생성 (시간은 그대로, Bundle과 TemplateGroup 참조도 함께 업데이트)
    const result = generateUniqueClipIds(
      unifiedData.tracks,
      unifiedData.bundles,
      unifiedData.templateGroups
    );

    console.log('📥 통합 방식 템플릿 불러오기 완료 (Bundle 정보 포함):', {
      tracks: result.tracks.length,
      clips: result.tracks.reduce((sum, track) => sum + track.clips.length, 0),
      bundles: result.bundles?.length || 0,
      templateGroups: result.templateGroups?.length || 0,
      duration: `${Math.floor(calculateTemplateDuration(result.tracks) / 60)}:${(calculateTemplateDuration(result.tracks) % 60).toString().padStart(2, '0')}`,
      bundleReferencesUpdated: !!result.bundles,
      templateGroupReferencesUpdated: !!result.templateGroups
    });

    // 🕒 템플릿 로딩 후 자동 재생시간 조정 및 projectSettings 업데이트 (표준 방식)
    const adjustedDuration = calculateStandardDuration(result.tracks);
    const finalDuration = adjustedDuration > 0 ? adjustedDuration : unifiedData.projectSettings.duration;
    
    console.log(`🕒 템플릿 로딩 후 재생시간 조정 (표준): 템플릿 설정 ${unifiedData.projectSettings.duration}s → 실제 클립 길이 ${finalDuration}s`);

    // projectSettings의 duration을 실제 클립 길이에 맞게 업데이트
    const updatedProjectSettings = {
      ...unifiedData.projectSettings,
      duration: finalDuration
    };

    return {
      tracks: result.tracks,
      projectSettings: updatedProjectSettings,
      bundles: result.bundles || [], // 업데이트된 Bundle 정보 반환
      templateGroups: result.templateGroups || [] // 업데이트된 TemplateGroup 정보 반환
    };

  } catch (error) {
    console.error('❌ 통합 방식 템플릿 불러오기 실패:', error);
    throw error;
  }
};

// 🎯 현재 타임헤드 위치에 템플릿 삽입 (개선된 버전)
export const insertTemplateAtCurrentTime = async (
  templateId: string,
  currentTime: number,
  existingTracks: TimelineTrack[],
  insertMode: 'push' | 'overlay'
): Promise<{ tracks: TimelineTrack[]; templateDuration: number; clipIdMappingTable?: Map<string, string> }> => {
  try {
    console.log('🎯 현재 위치에 템플릿 삽입 시작:', {
      templateId: templateId.slice(-8),
      currentTime: `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`,
      insertMode,
      existingTracks: existingTracks.length,
      existingClips: existingTracks.reduce((sum, track) => sum + track.clips.length, 0)
    });

    // 1단계: 템플릿 데이터 로드
    const template = await getTemplate(templateId);

    // 2단계: 재사용 함수로 템플릿 길이 계산
    const templateDuration = calculateTemplateDuration(template.tracks);

    console.log('📏 템플릿 길이:', {
      duration: templateDuration,
      formatted: `${Math.floor(templateDuration / 60)}:${(templateDuration % 60).toString().padStart(2, '0')}`,
      clips: template.tracks.reduce((sum, track) => sum + track.clips.length, 0)
    });

    // 3단계: 템플릿 시작시간을 현재 시간으로 조정
    const adjustedTemplate = adjustTemplateStartTime(template.tracks, currentTime);

    // 4단계: 클립 ID를 고유하게 재생성 (충돌 방지)
    const idResult = generateUniqueClipIds(adjustedTemplate);
    const templateWithUniqueIds = idResult.tracks;
    const clipIdMappingTable = idResult.clipIdMappingTable; // 🌟 ID 매핑 테이블 저장

    // 5단계: 삽입 모드에 따라 처리
    let resultTracks: TimelineTrack[];

    if (insertMode === 'push') {
      // 옵션 1: 뒤의 클립들을 밀어내기
      resultTracks = pushClipsAndInsertTemplate(
        existingTracks,
        templateWithUniqueIds,
        currentTime,
        templateDuration
      );
    } else {
      // 옵션 2: 겹쳐서 불러오기
      resultTracks = overlayTemplateAtPosition(
        existingTracks,
        templateWithUniqueIds,
        currentTime
      );
    }

    console.log('✅ 템플릿 삽입 완료:', {
      resultTracks: resultTracks.length,
      totalClips: resultTracks.reduce((sum, track) => sum + track.clips.length, 0),
      mode: insertMode,
      insertPosition: `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`,
      templateDuration: `${Math.floor(templateDuration / 60)}:${(templateDuration % 60).toString().padStart(2, '0')}`
    });

    // 🕒 템플릿 삽입 후 자동 재생시간 조정
    await autoAdjustDurationAfterTemplateLoad(resultTracks);

    return {
      tracks: resultTracks,
      templateDuration,
      clipIdMappingTable // 🌟 ID 매핑 테이블 반환
    };

  } catch (error) {
    console.error('❌ 템플릿 삽입 실패:', error);
    throw error;
  }
};

// 📤 옵션 1: 뒤의 클립들을 밀어내고 템플릿 삽입 (개선된 버전)
const pushClipsAndInsertTemplate = (
  existingTracks: TimelineTrack[],
  templateTracks: TimelineTrack[], // 이미 시간과 ID가 조정된 템플릿
  insertTime: number,
  templateDuration: number
): TimelineTrack[] => {
  console.log('📤 클립들을 밀어내며 템플릿 삽입...', {
    insertTime: `${Math.floor(insertTime / 60)}:${(insertTime % 60).toString().padStart(2, '0')}`,
    templateDuration: `${Math.floor(templateDuration / 60)}:${(templateDuration % 60).toString().padStart(2, '0')}`,
    existingClips: existingTracks.reduce((sum, track) => sum + track.clips.length, 0),
    templateClips: templateTracks.reduce((sum, track) => sum + track.clips.length, 0)
  });

  // 1. 기존 클립들을 처리 (insertTime 이후의 클립들을 templateDuration만큼 뒤로 이동)
  const adjustedExistingTracks = existingTracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => {
      // insertTime 이후에 시작하는 클립들은 뒤로 밀기
      if (clip.startTime >= insertTime) {
        return {
          ...clip,
          startTime: clip.startTime + templateDuration,
          endTime: clip.endTime + templateDuration
        };
      }
      // insertTime 이전에 시작하지만 insertTime을 지나는 클립들은 잘라내기
      else if (clip.endTime > insertTime) {
        const newDuration = insertTime - clip.startTime;
        return {
          ...clip,
          endTime: insertTime,
          duration: newDuration
        };
      }
      // insertTime 이전에 완전히 끝나는 클립들은 그대로
      else {
        return clip;
      }
    })
  }));

  // 2. 스마트 병합으로 템플릿 클립들을 기존 트랙에 통합
  const resultTracks = mergeTracks(adjustedExistingTracks, templateTracks, 'smart');

  const pushedClipsCount = adjustedExistingTracks.reduce((sum, track) =>
    sum + track.clips.filter(clip => clip.startTime >= insertTime + templateDuration).length, 0
  );

  const clippedClipsCount = adjustedExistingTracks.reduce((sum, track) =>
    sum + track.clips.filter(clip =>
      clip.endTime === insertTime && existingTracks.flatMap(t => t.clips).some(originalClip =>
        originalClip.id === clip.id && originalClip.endTime > insertTime
      )
    ).length, 0
  );

  console.log('📤 밀어내기 완료:', {
    templateClips: templateTracks.reduce((sum, track) => sum + track.clips.length, 0),
    pushedClips: pushedClipsCount,
    clippedClips: clippedClipsCount,
    finalTracks: resultTracks.length,
    finalClips: resultTracks.reduce((sum, track) => sum + track.clips.length, 0)
  });

  return resultTracks;
};

// 🔄 옵션 2: 기존 클립들과 겹쳐서 템플릿 삽입 (개선된 버전)
const overlayTemplateAtPosition = (
  existingTracks: TimelineTrack[],
  templateTracks: TimelineTrack[], // 이미 시간과 ID가 조정된 템플릿
  insertTime: number
): TimelineTrack[] => {
  console.log('🔄 겹쳐서 템플릿 삽입...', {
    insertTime: `${Math.floor(insertTime / 60)}:${(insertTime % 60).toString().padStart(2, '0')}`,
    existingClips: existingTracks.reduce((sum, track) => sum + track.clips.length, 0),
    templateClips: templateTracks.reduce((sum, track) => sum + track.clips.length, 0)
  });

  // 스마트 병합으로 템플릿 클립들을 기존 트랙에 통합 (겹쳐서)
  const resultTracks = mergeTracks(existingTracks, templateTracks, 'smart');

  // 충돌 분석
  const templateClips = templateTracks.flatMap(track => track.clips);
  const existingClips = existingTracks.flatMap(track => track.clips);

  let timeConflicts = 0;
  templateClips.forEach(templateClip => {
    const hasConflict = existingClips.some(existingClip =>
      !(templateClip.endTime <= existingClip.startTime || templateClip.startTime >= existingClip.endTime)
    );
    if (hasConflict) timeConflicts++;
  });

  console.log('🔄 겹쳐서 삽입 완료:', {
    templateClips: templateClips.length,
    timeConflicts,
    conflictRate: `${Math.round((timeConflicts / templateClips.length) * 100)}%`,
    finalTracks: resultTracks.length,
    finalClips: resultTracks.reduce((sum, track) => sum + track.clips.length, 0)
  });

  return resultTracks;
};

// validateTemplateName function moved to ./template/utils/validation.ts

// validateProjectForTemplate function moved to ./template/utils/validation.ts

// 🔧 재사용 가능한 유틸리티 함수들

// calculateTemplateDuration function moved to ./template/utils/calculations.ts

// adjustTemplateStartTime function moved to ./template/utils/calculations.ts

/**
 * 클립들의 ID를 고유하게 재생성 (기준클립 연결 관계 및 Bundle/TemplateGroup 참조 보존)
 * @param tracks - 대상 트랙들
 * @param bundles - Bundle 정보 (선택적)
 * @param templateGroups - TemplateGroup 정보 (선택적)
 * @returns ID가 재생성된 새로운 트랙들과 업데이트된 Bundle/TemplateGroup
 */
export const generateUniqueClipIds = (
  tracks: TimelineTrack[],
  bundles?: Bundle[],
  templateGroups?: TemplateGroup[]
): {
  tracks: TimelineTrack[];
  bundles?: Bundle[];
  templateGroups?: TemplateGroup[];
  clipIdMappingTable: Map<string, string>; // 🌟 새로 추가
} => {
  if (!tracks || tracks.length === 0) {
    return { tracks: [], bundles, templateGroups, clipIdMappingTable: new Map() };
  }

  console.log('🔑 클립 ID 재생성 시작 (연결 관계 및 Bundle/TemplateGroup 참조 보존):', {
    totalTracks: tracks.length,
    totalClips: tracks.reduce((sum, track) => sum + track.clips.length, 0),
    bundles: bundles?.length || 0,
    templateGroups: templateGroups?.length || 0
  });

  // 1단계: 기존 ID → 새 ID 매핑 테이블 생성 (클립용)
  const clipIdMappingTable = new Map<string, string>();
  const allClips = tracks.flatMap(track => track.clips);

  allClips.forEach(clip => {
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    clipIdMappingTable.set(clip.id, newId);
  });

  // 템플릿 그룹 ID 매핑 테이블 생성
  const groupIdMappingTable = new Map<string, string>();
  if (templateGroups) {
    templateGroups.forEach(group => {
      const newId = `template-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      groupIdMappingTable.set(group.id, newId);
    });
  }

  console.log('🔑 ID 매핑 테이블 생성 완료:', {
    clipMappings: clipIdMappingTable.size,
    groupMappings: groupIdMappingTable.size,
    exampleClipMapping: Array.from(clipIdMappingTable.entries()).slice(0, 2).map(([oldId, newId]) => ({
      old: oldId.slice(-8),
      new: newId.slice(-8)
    })),
    exampleGroupMapping: Array.from(groupIdMappingTable.entries()).slice(0, 2).map(([oldId, newId]) => ({
      old: oldId.slice(-8),
      new: newId.slice(-8)
    }))
  });

  // 2단계: 클립 ID 재생성 + 기준클립 연결 정보 업데이트
  const tracksWithNewIds = tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => {
      const newClip = {
        ...clip,
        id: clipIdMappingTable.get(clip.id)! // 새 ID 적용
      };

      // 3단계: 기준클립 연결 정보 업데이트 (regularClipProperties)
      if (clip.regularClipProperties) {
        const updatedRegularProps = { ...clip.regularClipProperties };

        // 시작점 연결 업데이트
        if (clip.regularClipProperties.startAnchor) {
          const oldBaseClipId = clip.regularClipProperties.startAnchor.baseClipId;
          const newBaseClipId = clipIdMappingTable.get(oldBaseClipId);

          if (newBaseClipId) {
            updatedRegularProps.startAnchor = {
              ...clip.regularClipProperties.startAnchor,
              baseClipId: newBaseClipId
            };

            console.log('🔗 시작점 연결 ID 업데이트:', {
              clipId: newClip.id.slice(-8),
              oldBaseClipId: oldBaseClipId.slice(-8),
              newBaseClipId: newBaseClipId.slice(-8),
              anchorPoint: clip.regularClipProperties.startAnchor.anchorPoint
            });
          } else {
            console.warn('⚠️ 시작점 기준클립 ID 매핑을 찾을 수 없음:', {
              clipId: newClip.id.slice(-8),
              missingBaseClipId: oldBaseClipId.slice(-8)
            });
          }
        }

        // 끝점 연결 업데이트
        if (clip.regularClipProperties.endAnchor) {
          const oldBaseClipId = clip.regularClipProperties.endAnchor.baseClipId;
          const newBaseClipId = clipIdMappingTable.get(oldBaseClipId);

          if (newBaseClipId) {
            updatedRegularProps.endAnchor = {
              ...clip.regularClipProperties.endAnchor,
              baseClipId: newBaseClipId
            };

            console.log('🔗 끝점 연결 ID 업데이트:', {
              clipId: newClip.id.slice(-8),
              oldBaseClipId: oldBaseClipId.slice(-8),
              newBaseClipId: newBaseClipId.slice(-8),
              anchorPoint: clip.regularClipProperties.endAnchor.anchorPoint
            });
          } else {
            console.warn('⚠️ 끝점 기준클립 ID 매핑을 찾을 수 없음:', {
              clipId: newClip.id.slice(-8),
              missingBaseClipId: oldBaseClipId.slice(-8)
            });
          }
        }

        // 🌟 확장된 앵커 구조 지원 - 시작점 연결 업데이트
        if (clip.regularClipProperties.startAnchorExtended) {
          const updatedStartAnchorExtended = { ...clip.regularClipProperties.startAnchorExtended };

          // 기준클립 ID 업데이트
          if (updatedStartAnchorExtended.baseClipId) {
            const oldBaseClipId = updatedStartAnchorExtended.baseClipId;
            const newBaseClipId = clipIdMappingTable.get(oldBaseClipId);

            if (newBaseClipId) {
              updatedStartAnchorExtended.baseClipId = newBaseClipId;
              console.log('🔗🌟 확장된 시작점 기준클립 연결 ID 업데이트:', {
                clipId: newClip.id.slice(-8),
                oldBaseClipId: oldBaseClipId.slice(-8),
                newBaseClipId: newBaseClipId.slice(-8),
                anchorPoint: updatedStartAnchorExtended.anchorPoint
              });
            } else {
              console.warn('⚠️ 확장된 시작점 기준클립 ID 매핑을 찾을 수 없음:', {
                clipId: newClip.id.slice(-8),
                missingBaseClipId: oldBaseClipId.slice(-8)
              });
            }
          }

          // 템플릿 그룹 ID 업데이트
          if (updatedStartAnchorExtended.templateGroupId) {
            const oldTemplateGroupId = updatedStartAnchorExtended.templateGroupId;
            const newTemplateGroupId = groupIdMappingTable.get(oldTemplateGroupId);

            if (newTemplateGroupId) {
              updatedStartAnchorExtended.templateGroupId = newTemplateGroupId;
              console.log('🔗🌟 확장된 시작점 템플릿그룹 연결 ID 업데이트:', {
                clipId: newClip.id.slice(-8),
                oldTemplateGroupId: oldTemplateGroupId.slice(-8),
                newTemplateGroupId: newTemplateGroupId.slice(-8),
                anchorPoint: updatedStartAnchorExtended.anchorPoint
              });
            } else {
              console.warn('⚠️ 확장된 시작점 템플릿그룹 ID 매핑을 찾을 수 없음:', {
                clipId: newClip.id.slice(-8),
                missingTemplateGroupId: oldTemplateGroupId.slice(-8)
              });
            }
          }

          // 번들 ID는 템플릿 로딩에서는 보통 새로 생성되므로 여기서는 처리하지 않음
          // (번들 연결은 템플릿 불러오기 후 별도로 설정됨)

          updatedRegularProps.startAnchorExtended = updatedStartAnchorExtended;
        }

        // 🌟 확장된 앵커 구조 지원 - 끝점 연결 업데이트
        if (clip.regularClipProperties.endAnchorExtended) {
          const updatedEndAnchorExtended = { ...clip.regularClipProperties.endAnchorExtended };

          // 기준클립 ID 업데이트
          if (updatedEndAnchorExtended.baseClipId) {
            const oldBaseClipId = updatedEndAnchorExtended.baseClipId;
            const newBaseClipId = clipIdMappingTable.get(oldBaseClipId);

            if (newBaseClipId) {
              updatedEndAnchorExtended.baseClipId = newBaseClipId;
              console.log('🔗🌟 확장된 끝점 기준클립 연결 ID 업데이트:', {
                clipId: newClip.id.slice(-8),
                oldBaseClipId: oldBaseClipId.slice(-8),
                newBaseClipId: newBaseClipId.slice(-8),
                anchorPoint: updatedEndAnchorExtended.anchorPoint
              });
            } else {
              console.warn('⚠️ 확장된 끝점 기준클립 ID 매핑을 찾을 수 없음:', {
                clipId: newClip.id.slice(-8),
                missingBaseClipId: oldBaseClipId.slice(-8)
              });
            }
          }

          // 템플릿 그룹 ID 업데이트
          if (updatedEndAnchorExtended.templateGroupId) {
            const oldTemplateGroupId = updatedEndAnchorExtended.templateGroupId;
            const newTemplateGroupId = groupIdMappingTable.get(oldTemplateGroupId);

            if (newTemplateGroupId) {
              updatedEndAnchorExtended.templateGroupId = newTemplateGroupId;
              console.log('🔗🌟 확장된 끝점 템플릿그룹 연결 ID 업데이트:', {
                clipId: newClip.id.slice(-8),
                oldTemplateGroupId: oldTemplateGroupId.slice(-8),
                newTemplateGroupId: newTemplateGroupId.slice(-8),
                anchorPoint: updatedEndAnchorExtended.anchorPoint
              });
            } else {
              console.warn('⚠️ 확장된 끝점 템플릿그룹 ID 매핑을 찾을 수 없음:', {
                clipId: newClip.id.slice(-8),
                missingTemplateGroupId: oldTemplateGroupId.slice(-8)
              });
            }
          }

          // 번들 ID는 템플릿 로딩에서는 보통 새로 생성되므로 여기서는 처리하지 않음
          // (번들 연결은 템플릿 불러오기 후 별도로 설정됨)

          updatedRegularProps.endAnchorExtended = updatedEndAnchorExtended;
        }

        newClip.regularClipProperties = updatedRegularProps;
      }

      // 4단계: 템플릿 그룹 ID 업데이트
      if (clip.templateGroupId && groupIdMappingTable.has(clip.templateGroupId)) {
        newClip.templateGroupId = groupIdMappingTable.get(clip.templateGroupId);
      }

      return newClip;
    })
  }));

  // 5단계: TemplateGroup ID 재생성 및 clipIds 업데이트
  let updatedTemplateGroups: TemplateGroup[] | undefined;
  if (templateGroups) {
    updatedTemplateGroups = templateGroups.map(group => {
      const newGroupId = groupIdMappingTable.get(group.id)!;

      // 그룹에 속한 클립들의 새 ID로 업데이트
      const updatedClipIds = group.clipIds
        .map(oldClipId => clipIdMappingTable.get(oldClipId))
        .filter((newId): newId is string => newId !== undefined);

      console.log('🛡️ TemplateGroup ID 업데이트:', {
        oldGroupId: group.id.slice(-8),
        newGroupId: newGroupId.slice(-8),
        oldClipIds: group.clipIds.length,
        newClipIds: updatedClipIds.length
      });

      return {
        ...group,
        id: newGroupId,
        clipIds: updatedClipIds
      };
    });
  }

  // 6단계: Bundle ID 참조 업데이트
  let updatedBundles: Bundle[] | undefined;
  if (bundles) {
    updatedBundles = bundles.map(bundle => {
      // Bundle의 baseClipIds 업데이트
      const updatedBaseClipIds = bundle.baseClipIds
        .map(oldClipId => clipIdMappingTable.get(oldClipId))
        .filter((newId): newId is string => newId !== undefined);

      // Bundle의 templateGroupIds 업데이트
      const updatedTemplateGroupIds = bundle.templateGroupIds
        .map(oldGroupId => groupIdMappingTable.get(oldGroupId))
        .filter((newId): newId is string => newId !== undefined);

      console.log('📦 Bundle ID 참조 업데이트:', {
        bundleId: bundle.id.slice(-8),
        bundleName: bundle.name,
        oldBaseClipIds: bundle.baseClipIds.length,
        newBaseClipIds: updatedBaseClipIds.length,
        oldTemplateGroupIds: bundle.templateGroupIds.length,
        newTemplateGroupIds: updatedTemplateGroupIds.length
      });

      return {
        ...bundle,
        baseClipIds: updatedBaseClipIds,
        templateGroupIds: updatedTemplateGroupIds
      };
    });
  }

  // 결과 검증
  const newAllClips = tracksWithNewIds.flatMap(track => track.clips);
  const connectionsCount = newAllClips.reduce((count, clip) => {
    let connections = 0;
    if (clip.regularClipProperties?.startAnchor) connections++;
    if (clip.regularClipProperties?.endAnchor) connections++;
    return count + connections;
  }, 0);

  console.log('🔑 클립 ID 재생성 완료 (모든 참조 보존):', {
    totalClips: newAllClips.length,
    preservedConnections: connectionsCount,
    clipIdMappings: clipIdMappingTable.size,
    groupIdMappings: groupIdMappingTable.size,
    updatedBundles: updatedBundles?.length || 0,
    updatedTemplateGroups: updatedTemplateGroups?.length || 0
  });

  return {
    tracks: tracksWithNewIds,
    bundles: updatedBundles,
    templateGroups: updatedTemplateGroups,
    clipIdMappingTable: clipIdMappingTable // 🌟 ID 매핑 테이블 반환
  };
};

/**
 * 두 트랙 배열 병합 (기존 트랙에 새 클립들 추가)
 * @param existingTracks - 기존 트랙들
 * @param newTracks - 추가할 트랙들
 * @param strategy - 병합 전략 ('append' | 'smart')
 * @returns 병합된 트랙들
 */
export const mergeTracks = (
  existingTracks: TimelineTrack[],
  newTracks: TimelineTrack[],
  strategy: 'append' | 'smart' = 'smart'
): TimelineTrack[] => {
  if (!existingTracks || existingTracks.length === 0) {
    return newTracks;
  }

  if (!newTracks || newTracks.length === 0) {
    return existingTracks;
  }

  console.log('🔀 트랙 병합 시작:', {
    existingTracks: existingTracks.length,
    newTracks: newTracks.length,
    strategy
  });

  const resultTracks = existingTracks.map(track => ({ ...track, clips: [...track.clips] }));
  const newClips = newTracks.flatMap(track => track.clips);

  // 🔍 클립과 트랙 상세 분석
  console.log('🔍 기존 트랙 분석:');
  resultTracks.forEach((track, index) => {
    const isTrackBaseTrack = 'isBaseTrack' in track && (track as any).isBaseTrack === true;
    console.log(`  Track ${index}: ${track.name || track.id} - isBaseTrack: ${isTrackBaseTrack}`);
  });

  console.log('🔍 새 클립 분석:');
  newClips.forEach((clip, index) => {
    console.log(`  Clip ${index}:`, {
      id: clip.id.slice(-8),
      mediaType: clip.mediaType,
      baseClipProperties: clip.baseClipProperties,
      isBaseClip: clip.baseClipProperties?.isBaseClip === true,
      'isBaseClip함수결과': isBaseClip(clip)
    });
  });

  if (strategy === 'append') {
    // 단순 추가: 첫 번째 트랙에 모든 클립 추가
    if (resultTracks.length > 0) {
      newClips.forEach(clip => {
        resultTracks[0].clips.push({
          ...clip,
          trackId: resultTracks[0].id
        });
      });
    }
  } else {
    // 스마트 병합: 클립 타입(기준클립/일반클립)과 시간대를 고려해서 적절한 트랙에 배치
    newClips.forEach((newClip, clipIndex) => {
      // 🔍 isBaseClip 함수 사용으로 변경
      const isBaseClipResult = isBaseClip(newClip);

      console.log(`\n🔍 클립 ${clipIndex + 1} 배치 분석:`, {
        clipId: newClip.id.slice(-8),
        mediaType: newClip.mediaType,
        isBaseClip: isBaseClipResult,
        baseClipProperties: newClip.baseClipProperties,
        startTime: newClip.startTime.toFixed(2),
        endTime: newClip.endTime.toFixed(2)
      });

      let targetTrack = null;

      if (isBaseClipResult) {
        console.log('🔹 기준클립 감지 - 기준트랙에만 배치 가능');

        // 🔹 기준클립: 기준트랙에만 배치 가능
        targetTrack = resultTracks.find((track, trackIndex) => {
          // BaseTrack 타입 체크
          const isTrackBaseTrack = 'isBaseTrack' in track && (track as any).isBaseTrack === true;

          console.log(`  트랙 ${trackIndex} 검사: ${track.name || track.id} - isBaseTrack: ${isTrackBaseTrack}`);

          if (!isTrackBaseTrack) {
            console.log(`    ❌ 기준트랙이 아니므로 배치 불가`);
            return false; // 기준트랙이 아니면 배치 불가
          }

          // 시간대 충돌 검사
          const hasTimeConflict = track.clips.some(clip =>
            !(newClip.endTime <= clip.startTime || newClip.startTime >= clip.endTime)
          );

          console.log(`    시간대 충돌: ${hasTimeConflict}`);

          return !hasTimeConflict; // 시간대 충돌이 없는 기준트랙
        });

        // 기준트랙이 없거나 모두 충돌하는 경우 클립이 가장 적은 기준트랙 사용
        if (!targetTrack) {
          console.log('⚠️ 적합한 기준트랙을 찾지 못함 - 클립이 가장 적은 기준트랙 사용');

          const baseTracks = resultTracks.filter(track =>
            'isBaseTrack' in track && (track as any).isBaseTrack === true
          );

          console.log(`기준트랙 목록 (${baseTracks.length}개):`, baseTracks.map(track => ({
            name: track.name || track.id,
            clipCount: track.clips.length
          })));

          if (baseTracks.length > 0) {
            targetTrack = baseTracks.reduce((minTrack, track) =>
              track.clips.length < minTrack.clips.length ? track : minTrack
            );

            console.log('🎯 선택된 기준트랙:', {
              name: targetTrack.name || targetTrack.id,
              clipCount: targetTrack.clips.length
            });
          } else {
            console.error('❌ 기준트랙을 찾을 수 없음 - 첫 번째 트랙에 강제 배치');
            targetTrack = resultTracks[0]; // 최후의 수단
          }
        } else {
          console.log('✅ 기준클립을 적절한 기준트랙에 배치:', {
            clipId: newClip.id.slice(-8),
            targetTrackName: targetTrack.name || targetTrack.id,
            isBaseTrack: true
          });
        }
      } else {
        console.log('🔹 일반클립 감지 - 일반트랙에만 배치 가능');

        // 🔹 일반클립: 기존 로직 사용 (일반트랙 우선)
        // 1. 같은 미디어 타입이면서 시간대가 겹치지 않는 일반트랙 찾기
        targetTrack = resultTracks.find((track, trackIndex) => {
          const isTrackBaseTrack = 'isBaseTrack' in track && (track as any).isBaseTrack === true;

          console.log(`  트랙 ${trackIndex} 검사: ${track.name || track.id} - isBaseTrack: ${isTrackBaseTrack}`);

          if (isTrackBaseTrack) {
            console.log(`    ❌ 기준트랙이므로 일반클립 배치 불가`);
            return false; // 기준트랙에는 일반클립 배치 금지
          }

          const hasSameMediaType = track.clips.some(clip => clip.mediaType === newClip.mediaType);
          const hasTimeConflict = track.clips.some(clip =>
            !(newClip.endTime <= clip.startTime || newClip.startTime >= clip.endTime)
          );

          console.log(`    미디어타입 일치: ${hasSameMediaType}, 시간충돌: ${hasTimeConflict}`);

          return hasSameMediaType && !hasTimeConflict;
        });

        // 2. 같은 타입이 없으면 시간대가 겹치지 않는 일반트랙 찾기
        if (!targetTrack) {
          targetTrack = resultTracks.find((track, trackIndex) => {
            const isTrackBaseTrack = 'isBaseTrack' in track && (track as any).isBaseTrack === true;

            if (isTrackBaseTrack) {
              return false; // 기준트랙에는 일반클립 배치 금지
            }

            const hasTimeConflict = track.clips.some(clip =>
              !(newClip.endTime <= clip.startTime || newClip.startTime >= clip.endTime)
            );
            return !hasTimeConflict;
          });
        }

        // 3. 그래도 없으면 클립이 가장 적은 일반트랙 사용
        if (!targetTrack) {
          const regularTracks = resultTracks.filter(track =>
            !('isBaseTrack' in track) || (track as any).isBaseTrack !== true
          );

          console.log(`일반트랙 목록 (${regularTracks.length}개):`, regularTracks.map(track => ({
            name: track.name || track.id,
            clipCount: track.clips.length
          })));

          if (regularTracks.length > 0) {
            targetTrack = regularTracks.reduce((minTrack, track) =>
              track.clips.length < minTrack.clips.length ? track : minTrack
            );

            console.log('🎯 선택된 일반트랙:', {
              name: targetTrack.name || targetTrack.id,
              clipCount: targetTrack.clips.length
            });
          } else {
            console.error('❌ 일반트랙을 찾을 수 없음 - 첫 번째 트랙에 강제 배치');
            targetTrack = resultTracks[0]; // 최후의 수단
          }
        } else {
          console.log('✅ 일반클립을 적절한 일반트랙에 배치:', {
            clipId: newClip.id.slice(-8),
            targetTrackName: targetTrack.name || targetTrack.id,
            isBaseTrack: false
          });
        }
      }

      if (!targetTrack) {
        console.error('❌ targetTrack을 찾을 수 없습니다. 첫 번째 트랙을 사용합니다.');
        targetTrack = resultTracks[0];
      }

      if (targetTrack) {
        console.log(`🎯 최종 배치: 클립 ${newClip.id.slice(-8)} → 트랙 ${targetTrack.name || targetTrack.id}`);
        targetTrack.clips.push({
          ...newClip,
          trackId: targetTrack.id
        });
      }
    });
  }

  console.log('🔀 트랙 병합 완료:', {
    resultTracks: resultTracks.length,
    totalClips: resultTracks.reduce((sum, track) => sum + track.clips.length, 0)
  });

  return resultTracks;
};

// generateTemplatePreview function moved to ./template/utils/preview.ts

// 🛡️ 템플릿을 그룹으로 불러오기 (🌟 확장된 버전)
export const loadTemplateAsGroup = async (
  templateId: string,
  insertTime: number,
  existingTracks: TimelineTrack[],
  groupOptions: {
    isProtected: boolean;
    groupName: string;
    groupColor?: string;
    preserveBundles?: boolean; // 하위 호환성용 (실제로는 무조건 true)
  },
  insertMode: 'push' | 'overlay' = 'push'
): Promise<{
  tracks: TimelineTrack[];
  templateGroup: TemplateGroup;
  preservedBundles?: Bundle[]; // 🌟 새 반환값: 보존된 Bundle들
}> => {
  try {
    console.log('🛡️ 템플릿을 그룹으로 불러오기 시작 (🌟 확장된 버전):', {
      templateId: templateId.slice(-8),
      insertTime: `${Math.floor(insertTime / 60)}:${(insertTime % 60).toString().padStart(2, '0')}`,
      groupName: groupOptions.groupName,
      isProtected: groupOptions.isProtected,
      preserveBundles: groupOptions.preserveBundles || false,
      insertMode
    });

    // 🌟 1단계: 원본 템플릿의 Bundle 정보 조회
    const originalTemplate = await getTemplate(templateId);
    const originalBundles = originalTemplate.bundles || [];

    console.log('📦 [DEBUG] 원본 템플릿 Bundle 정보 상세 분석:', {
      templateId: templateId.slice(-8),
      templateName: originalTemplate.name,
      hasBundle: originalTemplate.bundles ? 'YES' : 'NO',
      bundleCount: originalBundles.length,
      bundleNames: originalBundles.map(b => b.name),
      bundleDetails: originalBundles.map(b => ({
        id: b.id.slice(-8),
        name: b.name,
        baseClipCount: b.baseClipIds?.length || 0,
        templateGroupCount: b.templateGroupIds?.length || 0
      }))
    });

    // 2단계: 템플릿 삽입
    const result = await insertTemplateAtCurrentTime(
      templateId,
      insertTime,
      existingTracks,
      insertMode
    );

    // 3단계: 삽입된 클립 찾기
    const templateClips = result.tracks.flatMap(track => track.clips);
    const existingClipIds = new Set(existingTracks.flatMap(track => track.clips.map(clip => clip.id)));
    const newClips = templateClips.filter(clip => !existingClipIds.has(clip.id));

    console.log('🔍 삽입된 클립 분석:', {
      totalTemplateClips: templateClips.length,
      existingClips: existingClipIds.size,
      newClips: newClips.length
    });

    // 🌟 4단계: Bundle ID 매핑 생성 (개선된 방식 - ID 매핑 테이블 활용)
    const bundleMappings = result.clipIdMappingTable
      ? generateBundleMappingsWithIdTable(originalBundles, result.clipIdMappingTable)
      : []; // ID 매핑 테이블이 없으면 빈 배열

    console.log('📦 [DEBUG] Bundle 매핑 생성 결과 상세 분석:', {
      originalBundles: originalBundles.length,
      bundleMappings: bundleMappings.length,
      newClips: newClips.length,
      existingClips: existingTracks.flatMap(track => track.clips.map(clip => clip.id)).length,
      mappingDetails: bundleMappings.map(m => ({
        originalBundleId: m.originalBundleId.slice(-8),
        newBundleId: m.newBundleId.slice(-8),
        clipMappingCount: Object.keys(m.clipIdMappings).length
      }))
    });

    // 5단계: 그룹 ID 생성
    const groupId = `template-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 6단계: 그룹 시간 범위 계산
    const clipTimes = newClips.map(clip => ({ start: clip.startTime, end: clip.endTime }));
    const groupStartTime = Math.min(...clipTimes.map(t => t.start));
    const groupEndTime = Math.max(...clipTimes.map(t => t.end));

    // 7단계: 클립에 그룹 정보 추가
    const tracksWithGroupInfo = result.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        const isNewClip = newClips.some(nc => nc.id === clip.id);
        if (isNewClip) {
          return {
            ...clip,
            templateGroupId: groupId,
            isGrouped: true
          };
        }
        return clip;
      })
    }));

    // 8단계: 그룹 색상 자동 할당 (선택적)
    const groupColors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
    const existingGroups = existingTracks.flatMap(track =>
      track.clips.filter(clip => clip.templateGroupId).map(clip => clip.templateGroupId)
    );
    const colorIndex = existingGroups.length % groupColors.length;
    const groupColor = groupOptions.groupColor || groupColors[colorIndex];

    // 🌟 9단계: 확장된 TemplateGroup 객체 생성
    const templateGroup: TemplateGroup = {
      id: groupId,
      name: groupOptions.groupName,
      templateId: templateId,
      clipIds: newClips.map(clip => clip.id),
      startTime: groupStartTime,
      endTime: groupEndTime,
      isProtected: groupOptions.isProtected,
      color: groupColor,
      createdAt: Date.now(),

      // 🌟 추가: 원본 템플릿 Bundle 정보
      originalBundles: originalBundles,
      bundleMappings: bundleMappings,

      // 🌟 추가: 메타데이터
      metadata: {
        sourceTemplateId: templateId,
        importedAt: new Date().toISOString(),
        preservesBundles: true // Bundle 무조건 보존
      }
    };

    console.log('📦 [DEBUG] TemplateGroup 생성 결과 상세 분석:', {
      groupId: groupId.slice(-8),
      groupName: templateGroup.name,
      clipIds: templateGroup.clipIds.length,
      hasOriginalBundles: !!templateGroup.originalBundles,
      originalBundlesCount: templateGroup.originalBundles?.length || 0,
      hasBundleMappings: !!templateGroup.bundleMappings,
      bundleMappingsCount: templateGroup.bundleMappings?.length || 0,
      originalBundleNames: templateGroup.originalBundles?.map(b => b.name) || [],
      preservesBundles: templateGroup.metadata?.preservesBundles
    });

    // 🌟 10단계: Bundle 무조건 재생성 (옵션 상관없이)
    let preservedBundles: Bundle[] = [];
    if (originalBundles.length > 0) {
      console.log('🔄 Bundle 무조건 재생성 시작...', {
        originalBundles: originalBundles.length,
        bundleMappings: bundleMappings.length
      });

      try {
        preservedBundles = regenerateBundlesForGroup(
          originalBundles,
          bundleMappings,
          templateGroup.id
        );

        console.log('✅ Bundle 무조건 재생성 완료:', {
          preservedBundles: preservedBundles.length,
          bundleNames: preservedBundles.map(b => b.name)
        });
      } catch (error) {
        console.error('❌ Bundle 재생성 실패:', error);
        preservedBundles = []; // 실패 시 빈 배열
      }
    }

    console.log('✅ 템플릿 그룹 생성 완료:', {
      groupId: groupId.slice(-8),
      groupName: templateGroup.name,
      clipCount: templateGroup.clipIds.length,
      duration: `${Math.floor((groupEndTime - groupStartTime) / 60)}:${((groupEndTime - groupStartTime) % 60).toString().padStart(2, '0')}`,
      color: groupColor
    });

    return {
      tracks: tracksWithGroupInfo,
      templateGroup,
      preservedBundles: preservedBundles // 빈 배열이래도 반환 (무조건 Bundle 처리)
    };

  } catch (error) {
    console.error('❌ 템플릿 그룹 불러오기 실패:', error);
    throw error;
  }
};

// 🎛️ 템플릿 불러오기 옵션 인터페이스
export interface TemplateLoadOptions {
  mode: 'replace' | 'insert'; // 교체 또는 삽입
  insertTime?: number; // 삽입 시간 (insert 모드일 때)
  insertStrategy?: 'push' | 'overlay'; // 삽입 전략 (insert 모드일 때)
  preserveExisting?: boolean; // 기존 클립 보존 여부
  groupOptions?: { // 그룹 옵션 추가
    isProtected: boolean;
    groupName: string;
    groupColor?: string;
    preserveBundles?: boolean; // 하위 호환성용 (실제로는 무조건 true)
  };
}

/**
 * 🌟 통합 템플릿 불러오기 함수 (모든 옵션 지원)
 * @param templateId - 불러올 템플릿 ID
 * @param existingTracks - 기존 트랙들 (insert 모드일 때)
 * @param options - 불러오기 옵션
 * @returns 결과 트랙들과 메타데이터
 */
export const loadTemplateWithOptions = async (
  templateId: string,
  existingTracks: TimelineTrack[] = [],
  options: TemplateLoadOptions = { mode: 'replace' }
): Promise<{
  tracks: TimelineTrack[];
  projectSettings?: ProjectSettings;
  templateDuration: number;
  insertedClips: number;
  templateGroup?: TemplateGroup;
  bundles?: Bundle[];         // 🌟 Bundle 정보 추가
  templateGroups?: TemplateGroup[]; // 🌟 TemplateGroup 정보 추가
  preservedBundles?: Bundle[]; // 🌟 보존된 Bundle 정보 추가
}> => {
  try {
    console.log('🌟 통합 템플릿 불러오기 (Bundle 정보 포함):', {
      templateId: templateId.slice(-8),
      mode: options.mode,
      insertTime: options.insertTime,
      insertStrategy: options.insertStrategy,
      existingTracks: existingTracks.length
    });

    if (options.mode === 'replace') {
      // 교체 모드: 기존 불러오기와 동일
      const result = await loadTemplateAtBeginning(templateId);
      const templateDuration = calculateTemplateDuration(result.tracks);

      console.log('📦 Replace 모드 Bundle 정보:', {
        bundles: result.bundles?.length || 0,
        templateGroups: result.templateGroups?.length || 0
      });

      return {
        tracks: result.tracks,
        projectSettings: result.projectSettings,
        templateDuration,
        insertedClips: result.tracks.reduce((sum, track) => sum + track.clips.length, 0),
        bundles: result.bundles,         // 🌟 Bundle 정보 반환
        templateGroups: result.templateGroups // 🌟 TemplateGroup 정보 반환
      };
    } else {
      // 삽입 모드: 타임헤드 위치에 삽입
      const insertTime = options.insertTime || 0;
      const insertStrategy = options.insertStrategy || 'overlay';

      // 그룹 옵션이 있으면 그룹으로 불러오기
      if (options.groupOptions) {
        const groupResult = await loadTemplateAsGroup(
          templateId,
          insertTime,
          existingTracks,
          options.groupOptions,
          insertStrategy
        );

        const templateDuration = groupResult.templateGroup.endTime - groupResult.templateGroup.startTime;

        console.log('📦 [DEBUG] Insert+Group 모드 Bundle 정보 전달:', {
          preservedBundles: groupResult.preservedBundles?.length || 0,
          originalBundles: groupResult.templateGroup.originalBundles?.length || 0,
          bundleMappings: groupResult.templateGroup.bundleMappings?.length || 0,
          groupResult_preservedBundles: groupResult.preservedBundles ? 'YES' : 'NO',
          templateGroup_originalBundles: groupResult.templateGroup.originalBundles ? 'YES' : 'NO',
          templateGroup_bundleMappings: groupResult.templateGroup.bundleMappings ? 'YES' : 'NO',
          preservedBundleNames: groupResult.preservedBundles?.map(b => b.name) || [],
          originalBundleNames: groupResult.templateGroup.originalBundles?.map(b => b.name) || []
        });

        return {
          tracks: groupResult.tracks,
          templateDuration,
          insertedClips: groupResult.templateGroup.clipIds.length,
          templateGroup: groupResult.templateGroup,
          preservedBundles: groupResult.preservedBundles // 🌟 보존된 Bundle 정보 반환
        };
      } else {
        // 일반 삽입
        const result = await insertTemplateAtCurrentTime(
          templateId,
          insertTime,
          existingTracks,
          insertStrategy
        );

        console.log('📦 Insert 모드 - Bundle 정보 없음 (일반 삽입)');

        return {
          tracks: result.tracks,
          templateDuration: result.templateDuration,
          insertedClips: result.tracks.reduce((sum, track) => sum + track.clips.length, 0) -
            existingTracks.reduce((sum, track) => sum + track.clips.length, 0)
        };
      }
    }

  } catch (error) {
    console.error('❌ 통합 템플릿 불러오기 실패:', error);
    throw error;
  }
};
