// === 템플릿 그룹 시스템 === //

// 🌟 중첩 Bundle 시스템 import
import type { 
  NestedTemplateGroup, 
  NestedBundleRelation, 
  BundleHierarchyNode 
} from './nested';

// Bundle 매핑 정보
export interface BundleMapping {
  originalBundleId: string;
  newBundleId: string;
  clipIdMappings: { [originalClipId: string]: string };
  preservedInGroup: boolean;
}

// 템플릿 그룹 메타데이터
export interface TemplateGroupMetadata {
  sourceTemplateId: string;
  importedAt: string;
  preservesBundles: boolean;
}

// 템플릿 그룹 타입 (확장된 버전)
export interface TemplateGroup {
  id: string;
  name: string;
  templateId: string;
  clipIds: string[];
  startTime: number;
  endTime: number;
  isProtected: boolean;
  color?: string; // 그룹 시각 구분용
  createdAt: number;
  bundleId?: string; // 소속 Bundle ID
  duration?: number; // 그룹의 길이
  
  // 🌟 추가: 원본 템플릿 Bundle 정보
  originalBundles?: any[]; // Bundle 타입 순환참조 방지를 위해 any 사용
  bundleMappings?: BundleMapping[];
  
  // 🌟 추가: 메타데이터
  metadata?: TemplateGroupMetadata;
}

// 템플릿 그룹 상태 분석 타입
export interface TemplateGroupAnalysis {
  groupId: string;
  clipCount: number;
  tracks: string[];
  duration: number;
  isValid: boolean; // 모든 클립이 존재하는지
}
