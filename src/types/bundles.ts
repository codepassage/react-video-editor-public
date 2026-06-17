// === Bundle 시스템 === //

// TemplateGroup 참조 정보
export interface TemplateGroupReference {
  groupId: string;
  relationship: 'contains' | 'overlaps' | 'independent';
  syncMovement: boolean;
}

// Bundle 관계 메타데이터
export interface BundleRelationships {
  linkedTemplateGroups: TemplateGroupReference[];
  dragBehavior: 'independent' | 'with-groups' | 'group-only';
  preserveGroupProtection: boolean;
}

// Bundle 타입 - 기준클립과 템플릿 그룹의 논리적 묶음 (확장된 버전)
export interface Bundle {
  id: string;
  name: string;
  color: string;                    // 프리셋 색상
  createdAt: number;

  // Bundle 구성 요소들
  baseClipIds: string[];           // 포함된 기준클립 ID들
  templateGroupIds: string[];      // 포함된 템플릿 그룹 ID들

  // 시간 정보
  startTime: number;
  endTime: number;
  
  // 🌟 추가: 관계 메타데이터
  relationships?: BundleRelationships;
}

// Bundle 검증 결과
export interface BundleValidationResult {
  valid: boolean;
  reason?: string;
  conflicts?: string[];
}

// Bundle 선택된 요소
export interface SelectedElement {
  id: string;
  type: 'baseClip' | 'templateGroup';
  name: string;
  startTime: number;
  endTime: number;
  trackIndex: number;
}

// Bundle 생성 데이터
export interface CreateBundleData {
  name: string;
  color: string;
}

// Bundle-TemplateGroup 관계 정보
export interface BundleTemplateGroupRelation {
  bundleId: string;
  templateGroupId: string;
  relationship: 'parent' | 'child' | 'sibling';
  createdAt: string;
  syncMovement: boolean;
}

// Bundle 전용 프리셋 색상들 (템플릿과 구분)
export const BUNDLE_COLORS = [
  '#FF6B6B',  // 코랄 레드
  '#4ECDC4',  // 터쿼이즈
  '#45B7D1',  // 스카이 블루
  '#96CEB4',  // 민트 그린
  '#FFEAA7',  // 샌디 옐로우
  '#DDA0DD',  // 플럼
  '#98D8C8',  // 아쿠아
  '#F7DC6F'   // 버터 옐로우
];
