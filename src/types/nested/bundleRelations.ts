// === 중첩 Bundle 관계 타입 시스템 === //

/**
 * 중첩 Bundle 관계 정보
 * Bundle 간의 부모-자식, 형제 관계를 정의
 */
export interface NestedBundleRelation {
  id: string;                         // 관계 고유 ID
  parentBundleId: string;             // 부모 Bundle ID
  childBundleId: string;              // 자식 Bundle ID
  relationship: 'direct' | 'inherited' | 'preserved'; // 관계 유형
  depth: number;                      // 중첩 깊이
  preserveOnMove: boolean;            // 이동 시 관계 유지 여부
  createdAt: string;                  // 관계 생성 시간
  
  // 관계 메타데이터
  metadata?: {
    sourceType: 'user_created' | 'template_import' | 'bundle_merge'; // 관계 생성 원인
    originalTemplateId?: string;      // 템플릿에서 가져온 경우 원본 템플릿 ID
    preservationPriority: 'high' | 'medium' | 'low'; // 보존 우선순위
  };
}

/**
 * Bundle 계층 구조 노드
 * 트리 구조로 Bundle 계층을 표현
 */
export interface BundleHierarchyNode {
  bundleId: string;                   // Bundle ID
  parentId?: string;                  // 부모 노드 ID
  children: BundleHierarchyNode[];    // 자식 노드들
  depth: number;                      // 트리에서의 깊이
  path: string;                       // 루트부터의 경로
  
  // 노드 메타데이터
  metadata: {
    originalSource?: string;          // 원본 소스 (템플릿 ID 등)
    preservationMode: 'full' | 'partial' | 'reference'; // 보존 모드
    isRoot: boolean;                  // 루트 노드 여부
    isLeaf: boolean;                  // 말단 노드 여부
    elementCount: number;             // 포함된 총 요소 수
  };
  
  // 성능 최적화용 캐시
  cache?: {
    flattenedChildIds: string[];      // 모든 하위 Bundle ID들 (평면화)
    totalElements: number;            // 전체 하위 요소 수
    lastUpdated: number;              // 마지막 업데이트 시간
  };
}

/**
 * 순환 참조 검증 결과
 */
export interface CircularReferenceCheck {
  hasCircularReference: boolean;
  circularPath?: string[];            // 순환 경로 (순환이 있을 경우)
  affectedBundleIds: string[];        // 영향받는 Bundle ID들
  maxDepthReached: boolean;           // 최대 깊이에 도달했는지
  recommendations: string[];          // 해결 방안 추천
}

/**
 * Bundle 중첩 제약 조건
 */
export interface NestingConstraints {
  maxDepth: number;                   // 최대 중첩 깊이
  maxChildrenPerBundle: number;       // Bundle당 최대 자식 수
  preventCircularReference: boolean;  // 순환 참조 방지 여부
  allowSelfReference: boolean;        // 자기 참조 허용 여부
  maxTotalElements: number;           // 전체 요소 수 제한
  
  // 성능 제약
  performance?: {
    maxRenderDepth: number;           // 렌더링 최대 깊이
    lazyLoadThreshold: number;        // 지연 로딩 임계값
    cacheInvalidationDelay: number;   // 캐시 무효화 지연 시간 (ms)
  };
}

/**
 * 중첩 관계 분석 결과
 */
export interface NestingAnalysis {
  totalBundles: number;
  rootBundles: string[];              // 루트 Bundle ID들
  maxDepth: number;
  averageDepth: number;
  
  // 관계 통계
  relationshipCounts: {
    direct: number;
    inherited: number;
    preserved: number;
  };
  
  // 구조 정보
  hierarchyComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  hasCircularReferences: boolean;
  violatesConstraints: boolean;
  
  // 성능 예측
  estimatedPerformance: {
    renderingTime: 'fast' | 'moderate' | 'slow';
    memoryUsage: 'low' | 'medium' | 'high';
    recommendLazyLoading: boolean;
  };
  
  // 경고 및 권장사항
  warnings: string[];
  recommendations: string[];
}

/**
 * Bundle 관계 생성 옵션
 */
export interface CreateRelationOptions {
  preserveOnMove?: boolean;
  preservationMode?: 'full' | 'partial' | 'reference';
  sourceType?: 'user_created' | 'template_import' | 'bundle_merge';
  preservationPriority?: 'high' | 'medium' | 'low';
  validateCircularReference?: boolean;
  enforceConstraints?: boolean;
  constraints?: Partial<NestingConstraints>;
}

/**
 * Bundle 관계 업데이트 결과
 */
export interface RelationUpdateResult {
  success: boolean;
  updatedRelations: NestedBundleRelation[];
  newHierarchy: BundleHierarchyNode[];
  warnings: string[];
  errors: string[];
  
  // 성능 정보
  performance: {
    processTime: number;              // 처리 시간 (ms)
    affectedBundles: number;          // 영향받은 Bundle 수
    cacheUpdates: number;             // 캐시 업데이트 수
  };
}

/**
 * 중첩 관계 유틸리티 함수들의 타입
 */
export interface NestedRelationUtils {
  createRelation(
    parentId: string,
    childId: string,
    options?: CreateRelationOptions
  ): NestedBundleRelation;
  
  validateRelation(relation: NestedBundleRelation): boolean;
  
  checkCircularReference(
    relations: NestedBundleRelation[],
    newRelation?: NestedBundleRelation
  ): CircularReferenceCheck;
  
  buildHierarchy(relations: NestedBundleRelation[]): BundleHierarchyNode[];
  
  analyzeNesting(
    relations: NestedBundleRelation[],
    constraints?: NestingConstraints
  ): NestingAnalysis;
  
  updateRelations(
    existingRelations: NestedBundleRelation[],
    changes: Partial<NestedBundleRelation>[],
    constraints?: NestingConstraints
  ): RelationUpdateResult;
}
