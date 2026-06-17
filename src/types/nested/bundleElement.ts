// === 중첩 Bundle 요소 타입 시스템 === //

/**
 * Bundle 내부 요소의 통합 타입
 * 모든 종류의 Bundle 내부 요소(BaseClip, TemplateGroup, NestedBundle)를 표현
 */
export type BundleElement = {
  id: string;
  type: 'baseClip' | 'templateGroup' | 'nestedBundle';
  
  // 계층 정보
  parentId?: string;          // 부모 Bundle ID
  depth: number;              // 중첩 깊이 (0부터 시작)
  path: string;               // 계층 경로 (예: "Bundle_A.TemplateGroup_X.Bundle_B")
  
  // 시간 정보
  startTime: number;
  endTime: number;
  duration: number;
  
  // 타입별 상세 정보
  baseClip?: {
    clipId: string;
    trackId: string;
    mediaType?: string;       // 원본 클립의 미디어 타입
  };
  
  templateGroup?: {
    groupId: string;
    preservedBundles: string[];           // 그룹 내부 Bundle ID들 (순환 참조 방지를 위해 ID만)
    originalStructure: string[];          // 원본 Bundle 계층 구조 (BundleHierarchyNode ID들)
    isProtected: boolean;                 // 보호된 그룹인지
  };
  
  nestedBundle?: {
    bundleId: string;
    isPreserved: boolean;                 // 원본 구조가 보존되었는지
    originalParentId?: string;            // 원본 부모 Bundle ID
    preservationMode: 'full' | 'partial' | 'reference'; // 보존 모드
  };
};

/**
 * Bundle Element 검증 결과
 */
export interface BundleElementValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  depth: number;
  hasCircularReference: boolean;
}

/**
 * Bundle Element 생성 옵션
 */
export interface CreateBundleElementOptions {
  preserveOriginalStructure?: boolean;
  maxDepth?: number;
  preventCircularReference?: boolean;
  generatePath?: boolean;
}

/**
 * Bundle Element 통계 정보
 */
export interface BundleElementStats {
  totalElements: number;
  elementsByType: {
    baseClip: number;
    templateGroup: number;
    nestedBundle: number;
  };
  maxDepth: number;
  avgDepth: number;
  hasNesting: boolean;
}

/**
 * Bundle Element 유틸리티 함수들의 타입
 */
export interface BundleElementUtils {
  createElement(
    type: BundleElement['type'],
    data: any,
    options?: CreateBundleElementOptions
  ): BundleElement;
  
  validateElement(element: BundleElement): BundleElementValidation;
  
  generatePath(element: BundleElement, parentPath?: string): string;
  
  calculateDepth(element: BundleElement, elements: BundleElement[]): number;
  
  detectCircularReference(
    element: BundleElement, 
    allElements: BundleElement[]
  ): boolean;
}
