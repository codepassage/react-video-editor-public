/**
 * 📤 projectExport.ts - 프로젝트 내보내기 호환성 레이어
 * 
 * 기존 프로젝트 내보내기 시스템과의 호환성을 유지하면서 새로운 UnifiedProjectManager를 활용하는 래퍼입니다.
 * Bundle과 TemplateGroup 정보를 포함한 완전한 프로젝트 데이터 내보내기/가져오기를 지원합니다.
 * 
 * 주요 기능:
 * - 기존 ProjectData 형식 지원 (하위 호환성)
 * - JSON 파일 내보내기/가져오기
 * - Bundle 및 TemplateGroup 정보 포함
 * - 파일 선택 대화상자 통합
 * - UnifiedProjectManager로의 투명한 리다이렉션
 * 
 * 호환성 보장:
 * - 기존 코드에서 변경 없이 사용 가능
 * - ProjectData와 UnifiedProjectData 간 자동 변환
 * - 기존 프로젝트 파일 형식 지원
 * 
 * 성능 최적화:
 * - UnifiedProjectManager의 모든 최적화 혜택
 * - 변환 오버헤드 최소화
 * - 메모리 효율적인 데이터 처리
 * 
 * 사용 패턴:
 * - 기존 프로젝트 저장/불러오기 코드에서 직접 사용
 * - 새로운 코드에서는 UnifiedProjectManager 직접 사용 권장
 * - 마이그레이션 과정에서의 안전한 전환점 역할
 * 
 * 특별 고려사항:
 * - 새로운 코드에서는 UnifiedProjectManager 사용 권장
 * - 기존 API 시그니처 완전 유지
 * - Bundle/TemplateGroup 정보 자동 처리
 */

import { TimelineTrack, ProjectSettings, Bundle, TemplateGroup } from '../types';
import { UnifiedProjectManager, UnifiedProjectData } from './unifiedProjectManager';

// 🔄 기존 호환성을 위한 ProjectData 인터페이스 (UnifiedProjectData와 동일)
// ⚠️ 새로운 코드에서는 UnifiedProjectData 사용을 권장합니다.
export interface ProjectData {
  tracks: TimelineTrack[];
  projectSettings: ProjectSettings;
  bundles?: Bundle[];               // Bundle 정보
  templateGroups?: TemplateGroup[]; // Template Group 정보
  metadata: {
    exportedAt: string;
    version: string;
    editorVersion: string;
  };
}

// 🔄 ProjectData를 UnifiedProjectData로 변환
const projectDataToUnified = (projectData: ProjectData): UnifiedProjectData => {
  return {
    tracks: projectData.tracks,
    projectSettings: projectData.projectSettings,
    bundles: projectData.bundles,
    templateGroups: projectData.templateGroups,
    metadata: {
      ...projectData.metadata,
      type: 'project'
    }
  };
};

// 🔄 UnifiedProjectData를 ProjectData로 변환
const unifiedToProjectData = (unifiedData: UnifiedProjectData): ProjectData => {
  return {
    tracks: unifiedData.tracks,
    projectSettings: unifiedData.projectSettings,
    bundles: unifiedData.bundles,
    templateGroups: unifiedData.templateGroups,
    metadata: {
      exportedAt: unifiedData.metadata.exportedAt,
      version: unifiedData.metadata.version,
      editorVersion: unifiedData.metadata.editorVersion
    }
  };
};

// 🌟 통합 유틸리티를 사용한 JSON 내보내기 (Bundle 정보 포함)
// 🔄 기존 호환성을 위해 ProjectData 형태로 반환하지만 내부적으로는 UnifiedProjectManager 사용
export const exportProjectAsJSON = (
  tracks: TimelineTrack[], 
  projectSettings: ProjectSettings,
  bundles?: Bundle[],
  templateGroups?: TemplateGroup[]
): ProjectData => {
  console.log('📤 통합 방식으로 JSON 내보내기 시작 (기존 호환성):', {
    tracks: tracks.length,
    totalClips: tracks.reduce((sum, track) => sum + track.clips.length, 0),
    bundles: bundles?.length || 0,
    templateGroups: templateGroups?.length || 0
  });

  // 🌟 UnifiedProjectManager 사용
  const unifiedData = UnifiedProjectManager.exportToUnifiedFormat(
    tracks,
    projectSettings,
    bundles,
    templateGroups,
    { type: 'project' }
  );

  // 🔄 기존 호환성을 위해 ProjectData 형태로 변환
  const projectData = unifiedToProjectData(unifiedData);

  console.log('✅ 통합 방식 JSON 내보내기 완료 (기존 호환성)');
  return projectData;
};

// 🌟 통합 유틸리티를 사용한 JSON 파일 다운로드
// 🔄 기존 호환성을 위해 ProjectData를 받지만 내부적으로는 UnifiedProjectManager 사용
export const downloadProjectJSON = (projectData: ProjectData, filename?: string) => {
  console.log('💾 통합 방식으로 JSON 파일 다운로드 (기존 호환성):', {
    filename: filename || 'auto-generated',
    tracks: projectData.tracks.length,
    bundles: projectData.bundles?.length || 0,
    templateGroups: projectData.templateGroups?.length || 0
  });

  // 🔄 ProjectData를 UnifiedProjectData로 변환
  const unifiedData = projectDataToUnified(projectData);

  // 🌟 UnifiedProjectManager 사용
  UnifiedProjectManager.downloadAsJSON(unifiedData, filename);

  console.log('✅ 통합 방식 JSON 파일 다운로드 완료 (기존 호환성)');
};

// 🌟 통합 유틸리티를 사용한 JSON 파일에서 프로젝트 데이터 가져오기 (Bundle 정보 포함)
// 🔄 기존 호환성을 위해 ProjectData 형태로 반환하지만 내부적으로는 UnifiedProjectManager 사용
export const importProjectFromJSON = (file: File): Promise<ProjectData> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📥 통합 방식으로 JSON 가져오기 시작 (기존 호환성):', {
        fileName: file.name,
        fileSize: file.size
      });

      // 🌟 UnifiedProjectManager 사용
      const unifiedData = await UnifiedProjectManager.importFromJSONFile(file);

      // 🔄 기존 호환성을 위해 ProjectData 형태로 변환
      const projectData = unifiedToProjectData(unifiedData);

      console.log('✅ 통합 방식 JSON 가져오기 완료 (기존 호환성):', {
        tracks: projectData.tracks.length,
        totalClips: projectData.tracks.reduce((sum, track) => sum + track.clips.length, 0),
        bundles: projectData.bundles?.length || 0,
        templateGroups: projectData.templateGroups?.length || 0,
        version: projectData.metadata.version
      });

      resolve(projectData);
    } catch (error) {
      console.error('❌ 통합 방식 JSON 가져오기 실패 (기존 호환성):', error);
      reject(error);
    }
  });
};

// 🌟 통합 유틸리티를 사용한 파일 입력 헬퍼 함수
// 🔄 기존 호환성을 위해 ProjectData 형태로 반환하지만 내부적으로는 UnifiedProjectManager 사용
export const openProjectFileDialog = (): Promise<ProjectData> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📂 통합 방식으로 파일 선택 대화상자 열기 (기존 호환성)');

      // 🌟 UnifiedProjectManager 사용
      const unifiedData = await UnifiedProjectManager.openFileDialog();

      // 🔄 기존 호환성을 위해 ProjectData 형태로 변환
      const projectData = unifiedToProjectData(unifiedData);

      console.log('✅ 통합 방식 파일 선택 및 불러오기 완료 (기존 호환성):', {
        tracks: projectData.tracks.length,
        bundles: projectData.bundles?.length || 0,
        templateGroups: projectData.templateGroups?.length || 0
      });

      resolve(projectData);
    } catch (error) {
      console.error('❌ 통합 방식 파일 선택 실패 (기존 호환성):', error);
      reject(error);
    }
  });
};

// 🌟 새로운 코드에서는 아래 함수들을 직접 사용하세요
// import { UnifiedProjectManager } from './unifiedProjectManager';
// - UnifiedProjectManager.exportToUnifiedFormat()
// - UnifiedProjectManager.importFromUnifiedFormat()
// - UnifiedProjectManager.downloadAsJSON()
// - UnifiedProjectManager.openFileDialog()
// - UnifiedProjectManager.validateData()
// - UnifiedProjectManager.generateStatistics()

// 🌟 새로운 코드에서는 UnifiedProjectManager를 직접 사용하세요:
// import { UnifiedProjectManager, UnifiedProjectData } from './unifiedProjectManager';
//
// 사용 예시:
// const data = UnifiedProjectManager.exportToUnifiedFormat(tracks, settings, bundles, groups);
// const validation = UnifiedProjectManager.validateData(data);
// const stats = UnifiedProjectManager.generateStatistics(data);
// UnifiedProjectManager.downloadAsJSON(data, 'filename.json');
