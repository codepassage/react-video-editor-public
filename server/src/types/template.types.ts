/**
 * 템플릿 관련 타입 정의 (Bundle 및 TemplateGroup 지원)
 */

import { Track, ProjectSettings } from './render.types';

// Bundle 타입 정의
export interface Bundle {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  baseClipIds: string[];
  templateGroupIds: string[];
  startTime: number;
  endTime: number;
}

// TemplateGroup 타입 정의
export interface TemplateGroup {
  id: string;
  name: string;
  templateId?: string;
  clipIds: string[];
  startTime: number;
  endTime: number;
  isProtected: boolean;
  color: string;
  createdAt: number;
  bundleId?: string;
}

export interface TemplateMetadata {
  version: string;
  totalClips: number;
  totalTracks: number;
  duration: number;
  bundleCount?: number;         // Bundle 개수
  templateGroupCount?: number;  // TemplateGroup 개수
}

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  typeId: string;
  type?: {
    id: string;
    name: string;
    description: string;
  };
  tracks: Track[];
  projectSettings: ProjectSettings;
  bundles?: Bundle[];           // Bundle 정보
  templateGroups?: TemplateGroup[]; // TemplateGroup 정보
  screenshotPath?: string;      // 스크린샷 파일 경로
  createdAt: string;
  updatedAt: string;
  metadata: TemplateMetadata;
}

export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  typeId: string;
  type?: {
    id: string;
    name: string;
    description: string;
  };
  screenshotPath?: string;      // 스크린샷 파일 경로
  createdAt: string;
  updatedAt: string;
  metadata: TemplateMetadata;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  tracks: Track[];
  projectSettings: ProjectSettings;
  bundles?: Bundle[];           // Bundle 정보 추가
  templateGroups?: TemplateGroup[]; // TemplateGroup 정보 추가
  typeId?: string;              // TemplateType ID 추가
  screenshotPath?: string;      // 스크린샷 파일 경로
}

export interface TemplateResponse {
  success: boolean;
  template?: TemplateData;
  templates?: TemplateListItem[];
  error?: string;
  message?: string;
  details?: string;
}
