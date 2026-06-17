/**
 * 📋 types.ts - 템플릿 변환 관련 타입 정의
 * 
 * 템플릿 데이터 변환에 필요한 타입들을 정의합니다.
 * UnifiedProjectData와 Template 간의 변환을 위한 인터페이스를 제공합니다.
 */

import type { TimelineTrack, ProjectSettings, Bundle, TemplateGroup } from '../../../types';

/**
 * 템플릿 인터페이스 - UnifiedProjectData 기반
 * 
 * 템플릿은 재사용 가능한 타임라인 구성 요소로, 
 * 프로젝트 설정, 트랙, 번들, 템플릿 그룹 정보를 포함합니다.
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  typeId: string;
  tracks: TimelineTrack[];
  projectSettings: ProjectSettings;
  bundles: Bundle[];
  templateGroups: TemplateGroup[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    version: string;
    totalClips: number;
    totalTracks: number;
    duration: number;
    bundleCount: number;
    templateGroupCount: number;
  };
}