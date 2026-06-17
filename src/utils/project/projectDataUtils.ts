/**
 * 공통 프로젝트 데이터 처리 유틸리티
 * JSON 내보내기/가져오기와 템플릿 저장/불러오기를 통합
 */

import { TimelineTrack, ProjectSettings, Bundle, TemplateGroup } from '../../types';

// 통합 프로젝트 데이터 인터페이스
export interface UnifiedProjectData {
  tracks: TimelineTrack[];
  projectSettings: ProjectSettings;
  bundles?: Bundle[];
  templateGroups?: TemplateGroup[];
  metadata: {
    exportedAt: string;
    version: string;
    editorVersion: string;
    source?: 'json' | 'template'; // 데이터 출처
    totalClips?: number;
    totalTracks?: number;
    duration?: number;
    bundleCount?: number;
    templateGroupCount?: number;
  };
}

/**
 * 프로젝트 데이터를 통합 형식으로 생성
 */
export const createUnifiedProjectData = (
  tracks: TimelineTrack[],
  projectSettings: ProjectSettings,
  bundles?: Bundle[],
  templateGroups?: TemplateGroup[],
  source: 'json' | 'template' = 'json'
): UnifiedProjectData => {
  const bundleCount = bundles?.length || 0;
  const templateGroupCount = templateGroups?.length || 0;
  const totalClips = tracks.reduce((sum, track) => sum + track.clips.length, 0);
  
  console.log(`🔄 통합 프로젝트 데이터 생성 (${source}):`, {
    tracks: tracks.length,
    totalClips,
    bundles: bundleCount,
    templateGroups: templateGroupCount
  });

  return {
    tracks,
    projectSettings,
    bundles: bundles || [],
    templateGroups: templateGroups || [],
    metadata: {
      exportedAt: new Date().toISOString(),
      version: bundleCount > 0 || templateGroupCount > 0 ? '1.1.0' : '1.0.0',
      editorVersion: 'v1.1.0',
      source,
      totalClips,
      totalTracks: tracks.length,
      duration: projectSettings.duration,
      bundleCount,
      templateGroupCount
    }
  };
};

/**
 * 통합 프로젝트 데이터의 유효성 검증
 */
export const validateUnifiedProjectData = (data: any): { 
  isValid: boolean; 
  message?: string; 
  normalizedData?: UnifiedProjectData 
} => {
  try {
    // 필수 필드 확인
    if (!data.tracks || !data.projectSettings) {
      return {
        isValid: false,
        message: 'tracks와 projectSettings는 필수입니다.'
      };
    }

    // 메타데이터 정규화
    if (!data.metadata) {
      console.warn('⚠️ 메타데이터가 없는 구 버전 파일 - 기본값으로 초기화');
      data.metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        editorVersion: 'unknown'
      };
    }

    // Bundle 정보 정규화
    if (!data.bundles) {
      console.log('ℹ️ Bundle 정보가 없음 - 빈 배열로 초기화');
      data.bundles = [];
    }

    // TemplateGroup 정보 정규화
    if (!data.templateGroups) {
      console.log('ℹ️ TemplateGroup 정보가 없음 - 빈 배열로 초기화');
      data.templateGroups = [];
    }

    // 메타데이터 추가 정보 보완
    const bundleCount = data.bundles?.length || 0;
    const templateGroupCount = data.templateGroups?.length || 0;
    const totalClips = data.tracks.reduce((sum: number, track: any) => sum + track.clips.length, 0);

    const normalizedData: UnifiedProjectData = {
      ...data,
      metadata: {
        ...data.metadata,
        totalClips: data.metadata.totalClips ?? totalClips,
        totalTracks: data.metadata.totalTracks ?? data.tracks.length,
        duration: data.metadata.duration ?? data.projectSettings.duration,
        bundleCount: data.metadata.bundleCount ?? bundleCount,
        templateGroupCount: data.metadata.templateGroupCount ?? templateGroupCount
      }
    };

    console.log('✅ 프로젝트 데이터 검증 성공:', {
      tracks: normalizedData.tracks.length,
      bundles: normalizedData.bundles?.length || 0,
      templateGroups: normalizedData.templateGroups?.length || 0,
      version: normalizedData.metadata.version
    });

    return {
      isValid: true,
      normalizedData
    };

  } catch (error) {
    return {
      isValid: false,
      message: `데이터 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    };
  }
};

/**
 * 프로젝트 데이터 요약 생성
 */
export const generateProjectSummary = (data: UnifiedProjectData): {
  basicInfo: string;
  detailedInfo: string;
  bundleInfo: string;
  templateGroupInfo: string;
} => {
  const bundleInfo = data.bundles && data.bundles.length > 0 
    ? `\n📦 Bundle: ${data.bundles.length}개` 
    : '';
  
  const templateGroupInfo = data.templateGroups && data.templateGroups.length > 0 
    ? `\n🛡️ Template Group: ${data.templateGroups.length}개` 
    : '';

  return {
    basicInfo: `트랙 수: ${data.tracks.length}\n클립 수: ${data.metadata.totalClips}`,
    detailedInfo: `${data.metadata.source === 'template' ? '템플릿' : 'JSON'} 버전: ${data.metadata.version}\n기간: ${Math.floor((data.metadata.duration || 0) / 60)}분 ${(data.metadata.duration || 0) % 60}초`,
    bundleInfo,
    templateGroupInfo
  };
};

/**
 * 프로젝트 데이터 호환성 확인
 */
export const checkDataCompatibility = (data: UnifiedProjectData): {
  isCompatible: boolean;
  warnings: string[];
  suggestions: string[];
} => {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // 버전 호환성 확인
  const version = data.metadata.version;
  if (!version || version === '1.0.0') {
    warnings.push('구 버전 데이터입니다. Bundle 기능을 사용할 수 없을 수 있습니다.');
  }

  // Bundle 데이터 확인
  if (data.bundles && data.bundles.length > 0) {
    suggestions.push('Bundle이 포함된 데이터입니다. Bundle 기능을 활용해보세요.');
  }

  // TemplateGroup 데이터 확인
  if (data.templateGroups && data.templateGroups.length > 0) {
    suggestions.push('Template Group이 포함된 데이터입니다. 그룹 기능을 활용해보세요.');
  }

  return {
    isCompatible: warnings.length === 0,
    warnings,
    suggestions
  };
};

/**
 * 레거시 데이터 업그레이드
 */
export const upgradeLegacyData = (data: any): UnifiedProjectData => {
  console.log('🔄 레거시 데이터 업그레이드 시작');

  const upgraded = createUnifiedProjectData(
    data.tracks,
    data.projectSettings,
    data.bundles,
    data.templateGroups,
    data.metadata?.source || 'json'
  );

  // 기존 메타데이터 보존
  if (data.metadata) {
    upgraded.metadata = {
      ...upgraded.metadata,
      ...data.metadata,
      // 새로운 필드들만 추가
      bundleCount: data.metadata.bundleCount ?? upgraded.metadata.bundleCount,
      templateGroupCount: data.metadata.templateGroupCount ?? upgraded.metadata.templateGroupCount
    };
  }

  console.log('✅ 레거시 데이터 업그레이드 완료');
  return upgraded;
};
