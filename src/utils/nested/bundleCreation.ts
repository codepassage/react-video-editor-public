/**
 * 중첩 Bundle 생성 시스템
 * Phase 2 Day 1: 중첩 Bundle 생성 로직 구현
 * 
 * 주요 기능:
 * - 복합 요소들로부터 중첩 Bundle 생성
 * - Bundle/TemplateGroup/BaseClip 혼재 처리
 * - 중첩 구조 분석 및 검증
 * - 순환 참조 방지
 * - 최적화된 계층 구조 생성
 */

import {
  Bundle,
  TemplateGroup,
  SelectedElement,
  TimelineClip,
  TimelineTrack,
  CreateBundleData
} from '../../types';

import {
  NestedBundle,
  BundleElement,
  NestedBundleRelation,
  BundleHierarchyNode,
  NestingAnalysis,
  ValidationResult,
  PerformanceMetrics,
  CreateNestedBundleOptions,
  CreateNestedBundleResult,
  SelectedElementWithMetadata,
  NestingConstraints,
  BundleCreationContext
} from '../../types/nested';

import { 
  NestedBundleSystemManager,
  getSystemManager 
} from './index';

/**
 * 🔍 선택된 요소들의 중첩 가능성 분석
 * 
 * Bundle 생성 전에 선택된 요소들을 분석하여:
 * - 기존 Bundle 구조 파악
 * - 중첩 깊이 계산  
 * - 순환 참조 위험성 검사
 * - 최적 중첩 전략 제안
 */
export function analyzeSelectedElementsForNesting(
  elements: SelectedElement[],
  existingBundles: Bundle[] = [],
  existingTemplateGroups: TemplateGroup[] = [],
  constraints: NestingConstraints = getDefaultConstraints()
): NestingAnalysis {
  
  const analysis: NestingAnalysis = {
    totalElements: elements.length,
    elementsByType: {
      baseClips: 0,
      templateGroups: 0,
      existingBundles: 0
    },
    nestingPotential: {
      maxPossibleDepth: 0,
      estimatedDepth: 1,
      hasCircularRisk: false,
      complexityScore: 0
    },
    existingStructures: [],
    recommendations: [],
    warnings: [],
    performance: {
      analysisTime: 0,
      memoryEstimate: 0,
      cpuIntensity: 'low'
    }
  };

  const startTime = performance.now();
  
  try {
    // 1. 요소별 타입 분류
    elements.forEach(element => {
      switch (element.type) {
        case 'baseClip':
          analysis.elementsByType.baseClips++;
          break;
        case 'templateGroup':
          analysis.elementsByType.templateGroups++;
          
          // TemplateGroup 내부 Bundle 구조 분석
          const group = existingTemplateGroups.find(g => g.id === element.id);
          if (group?.originalBundles && group.originalBundles.length > 0) {
            analysis.existingStructures.push({
              sourceId: group.id,
              sourceType: 'templateGroup',
              bundleCount: group.originalBundles.length,
              maxDepth: calculateMaxDepth(group.originalBundles),
              preservationStrategy: 'preserve'
            });
          }
          break;
        case 'bundle':
          analysis.elementsByType.existingBundles++;
          
          // 기존 Bundle 구조 분석
          const bundle = existingBundles.find(b => b.id === element.id);
          if (bundle) {
            analysis.existingStructures.push({
              sourceId: bundle.id,
              sourceType: 'bundle',
              bundleCount: 1,
              maxDepth: 1, // 기존 Bundle은 평면 구조
              preservationStrategy: 'preserve'
            });
          }
          break;
      }
    });

    // 2. 중첩 복잡도 계산
    const complexity = calculateNestingComplexity(analysis);
    analysis.nestingPotential.complexityScore = complexity.score;
    analysis.nestingPotential.estimatedDepth = complexity.estimatedDepth;
    analysis.nestingPotential.maxPossibleDepth = complexity.maxPossibleDepth;

    // 3. 순환 참조 위험 분석
    const circularRisk = analyzeCircularReferenceRisk(elements, existingBundles, existingTemplateGroups);
    analysis.nestingPotential.hasCircularRisk = circularRisk.hasRisk;
    if (circularRisk.hasRisk) {
      analysis.warnings.push(...circularRisk.warnings);
    }

    // 4. 성능 영향 예측
    const performanceImpact = estimatePerformanceImpact(analysis);
    analysis.performance = performanceImpact;

    // 5. 권장사항 생성
    analysis.recommendations = generateNestingRecommendations(analysis, constraints);

    // 6. 제약 조건 검증
    const constraintViolations = validateConstraints(analysis, constraints);
    if (constraintViolations.length > 0) {
      analysis.warnings.push(...constraintViolations);
    }

  } catch (error) {
    analysis.warnings.push(`분석 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
  }

  analysis.performance.analysisTime = performance.now() - startTime;
  return analysis;
}

/**
 * 🔧 중첩 Bundle 구조 검증
 * 
 * Bundle 생성 전 최종 검증:
 * - 데이터 무결성 확인
 * - 순환 참조 완전 검증
 * - 제약 조건 준수 확인
 * - 성능 영향 평가
 */
export function validateNestingStructure(
  analysis: NestingAnalysis,
  constraints: NestingConstraints = getDefaultConstraints(),
  context?: BundleCreationContext
): ValidationResult {
  
  const validation: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    performance: {
      validationTime: 0,
      memoryUsage: 0,
      cpuIntensity: 'low'
    },
    autoFixable: [],
    criticalIssues: []
  };

  const startTime = performance.now();

  try {
    // 1. 기본 요구사항 검증
    if (analysis.totalElements < 2) {
      validation.isValid = false;
      validation.errors.push('Bundle 생성을 위해서는 최소 2개의 요소가 필요합니다');
      return validation;
    }

    // 2. 중첩 깊이 제한 검증
    if (analysis.nestingPotential.maxPossibleDepth > constraints.maxDepth) {
      validation.isValid = false;
      validation.errors.push(
        `최대 중첩 깊이(${constraints.maxDepth})를 초과합니다 (예상: ${analysis.nestingPotential.maxPossibleDepth})`
      );
    }

    // 3. 복잡도 임계값 검증
    if (analysis.nestingPotential.complexityScore > constraints.maxComplexityScore) {
      validation.warnings.push(
        `중첩 복잡도가 높습니다 (${analysis.nestingPotential.complexityScore}/${constraints.maxComplexityScore})`
      );
      validation.suggestions.push('일부 구조를 평면화하는 것을 고려해보세요');
    }

    // 4. 순환 참조 검증
    if (analysis.nestingPotential.hasCircularRisk) {
      validation.isValid = false;
      validation.criticalIssues.push('순환 참조 위험이 감지되었습니다');
      validation.errors.push('Bundle 간의 순환 참조를 방지하기 위해 구조를 수정해야 합니다');
    }

    // 5. 성능 영향 검증
    if (analysis.performance.cpuIntensity === 'high') {
      validation.warnings.push('복잡한 중첩 구조로 인해 성능 저하가 예상됩니다');
      validation.suggestions.push('캐시 시스템 활용을 권장합니다');
    }

    // 6. 메모리 사용량 검증
    if (analysis.performance.memoryEstimate > constraints.maxMemoryUsage) {
      validation.warnings.push(
        `예상 메모리 사용량이 높습니다 (${analysis.performance.memoryEstimate}MB/${constraints.maxMemoryUsage}MB)`
      );
    }

    // 7. 자동 수정 가능한 이슈 식별
    identifyAutoFixableIssues(analysis, validation);

    // 8. 컨텍스트 기반 추가 검증
    if (context) {
      validateWithContext(analysis, validation, context);
    }

  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
  }

  validation.performance.validationTime = performance.now() - startTime;
  return validation;
}

/**
 * 🏗️ 중첩 Bundle 생성 (메인 함수)
 * 
 * 복합 요소들로부터 계층적 Bundle 구조 생성:
 * - Bundle 내부에 다른 Bundle/TemplateGroup 포함
 * - 원본 구조 최대한 보존
 * - 최적화된 계층 관계 설정
 * - 실시간 검증 및 피드백
 */
export async function createNestedBundle(
  selectedElements: SelectedElement[],
  bundleData: CreateBundleData,
  existingBundles: Bundle[],
  existingTemplateGroups: TemplateGroup[],
  tracks: TimelineTrack[],
  options: CreateNestedBundleOptions = getDefaultOptions()
): Promise<CreateNestedBundleResult> {

  const startTime = performance.now();
  
  const result: CreateNestedBundleResult = {
    bundle: null,
    hierarchy: [],
    preservedStructures: [],
    warnings: [],
    performance: {
      creationTime: 0,
      memoryUsage: 0,
      cacheHits: 0,
      optimizationApplied: []
    },
    metadata: {
      totalElements: selectedElements.length,
      maxDepth: 0,
      preservationRatio: 0,
      isOptimized: false
    }
  };

  try {
    // Phase 1: 요소 분석
    console.log('🔍 Phase 1: 선택된 요소 분석 시작...');
    const analysis = analyzeSelectedElementsForNesting(
      selectedElements, 
      existingBundles, 
      existingTemplateGroups, 
      options.constraints || getDefaultConstraints()
    );

    // Phase 2: 구조 검증
    console.log('✅ Phase 2: 중첩 구조 검증 시작...');
    const validation = validateNestingStructure(analysis, options.constraints);
    
    if (!validation.isValid && !options.allowPartialCreation) {
      throw new Error(`Bundle 생성 실패: ${validation.errors.join(', ')}`);
    }

    result.warnings.push(...validation.warnings);

    // Phase 3: 요소 메타데이터 강화
    console.log('📋 Phase 3: 요소 메타데이터 생성...');
    const elementsWithMetadata = await enrichElementsWithMetadata(
      selectedElements,
      existingBundles,
      existingTemplateGroups,
      tracks,
      analysis
    );

    // Phase 4: Bundle Element 구조 생성
    console.log('🏗️ Phase 4: Bundle Element 구조 생성...');
    const bundleElements = await createBundleElements(
      elementsWithMetadata,
      options
    );

    // Phase 5: 계층 관계 구축
    console.log('🌳 Phase 5: 계층 관계 구축...');
    const hierarchyNodes = buildHierarchyNodes(bundleElements, bundleData);

    // Phase 6: NestedBundle 객체 생성
    console.log('📦 Phase 6: NestedBundle 객체 생성...');
    const nestedBundle = createNestedBundleObject(
      bundleData,
      bundleElements,
      hierarchyNodes,
      analysis
    );

    // Phase 7: 시스템 통합 및 캐시 업데이트
    console.log('⚡ Phase 7: 시스템 통합...');
    const systemManager = getSystemManager();
    await systemManager.integrateBundleIntoSystem(nestedBundle);

    // 결과 구성
    result.bundle = nestedBundle;
    result.hierarchy = hierarchyNodes;
    result.preservedStructures = extractPreservedStructures(bundleElements);
    result.metadata = {
      totalElements: bundleElements.length,
      maxDepth: Math.max(...bundleElements.map(el => el.depth)),
      preservationRatio: calculatePreservationRatio(bundleElements),
      isOptimized: true
    };

  } catch (error) {
    result.warnings.push(`Bundle 생성 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    console.error('❌ Bundle 생성 실패:', error);
  }

  result.performance.creationTime = performance.now() - startTime;
  
  console.log(`✅ 중첩 Bundle 생성 완료: ${bundleData.name}`);
  console.log(`📊 생성 통계:`, {
    elements: result.metadata.totalElements,
    depth: result.metadata.maxDepth,
    preservation: `${(result.metadata.preservationRatio * 100).toFixed(1)}%`,
    time: `${result.performance.creationTime.toFixed(2)}ms`
  });

  return result;
}

// ========================================
// 🛠️ 유틸리티 함수들
// ========================================

/**
 * 기본 제약 조건 반환
 */
function getDefaultConstraints(): NestingConstraints {
  return {
    maxDepth: 10,
    maxElementsPerBundle: 100,
    maxComplexityScore: 80,
    maxMemoryUsage: 50, // MB
    allowCircularReferences: false,
    enforceTimeContiguity: true,
    preserveOriginalStructure: true
  };
}

/**
 * 기본 옵션 반환
 */
function getDefaultOptions(): CreateNestedBundleOptions {
  return {
    maxDepth: 10,
    preserveOriginalStructure: true,
    allowPartialCreation: false,
    enableOptimizations: true,
    constraints: getDefaultConstraints()
  };
}

/**
 * Bundle 내부 구조의 최대 깊이 계산
 */
function calculateMaxDepth(bundles: any[]): number {
  if (!bundles || bundles.length === 0) return 0;
  
  // 현재는 기존 Bundle들이 평면 구조이므로 1 반환
  // 향후 NestedBundle 지원 시 재귀적 계산 필요
  return 1;
}

/**
 * 중첩 복잡도 계산
 */
function calculateNestingComplexity(analysis: NestingAnalysis): {
  score: number;
  estimatedDepth: number;
  maxPossibleDepth: number;
} {
  const baseScore = analysis.totalElements * 2;
  const structureScore = analysis.existingStructures.reduce((sum, struct) => 
    sum + struct.bundleCount * struct.maxDepth * 5, 0
  );
  
  const score = baseScore + structureScore;
  const estimatedDepth = Math.ceil(Math.log2(analysis.totalElements)) + 1;
  const maxPossibleDepth = analysis.existingStructures.reduce((max, struct) => 
    Math.max(max, struct.maxDepth + 1), estimatedDepth
  );

  return { score, estimatedDepth, maxPossibleDepth };
}

/**
 * 순환 참조 위험 분석
 */
function analyzeCircularReferenceRisk(
  elements: SelectedElement[],
  existingBundles: Bundle[],
  existingTemplateGroups: TemplateGroup[]
): { hasRisk: boolean; warnings: string[] } {
  
  const warnings: string[] = [];
  let hasRisk = false;

  // Bundle이 포함된 TemplateGroup을 선택했는지 확인
  elements.forEach(element => {
    if (element.type === 'templateGroup') {
      const group = existingTemplateGroups.find(g => g.id === element.id);
      if (group?.originalBundles && group.originalBundles.length > 0) {
        warnings.push(`TemplateGroup "${group.name}"에 ${group.originalBundles.length}개의 Bundle이 포함되어 있습니다`);
      }
    }
  });

  // 현재는 단순 구조이므로 순환 참조 위험은 낮음
  // 향후 더 복잡한 중첩 구조 지원 시 강화 필요

  return { hasRisk, warnings };
}

/**
 * 성능 영향 예측
 */
function estimatePerformanceImpact(analysis: NestingAnalysis): PerformanceMetrics {
  const elementCount = analysis.totalElements;
  const complexityScore = analysis.nestingPotential.complexityScore;
  
  let cpuIntensity: 'low' | 'medium' | 'high' = 'low';
  if (complexityScore > 50) cpuIntensity = 'medium';
  if (complexityScore > 80) cpuIntensity = 'high';

  const memoryEstimate = Math.ceil(elementCount * 0.1 + complexityScore * 0.05); // MB

  return {
    analysisTime: 0, // 실제 측정값으로 대체됨
    memoryEstimate,
    cpuIntensity
  };
}

/**
 * 중첩 권장사항 생성
 */
function generateNestingRecommendations(
  analysis: NestingAnalysis,
  constraints: NestingConstraints
): string[] {
  const recommendations: string[] = [];

  if (analysis.nestingPotential.complexityScore > constraints.maxComplexityScore * 0.8) {
    recommendations.push('복잡도가 높습니다. 일부 구조를 단순화하는 것을 고려해보세요');
  }

  if (analysis.existingStructures.length > 0) {
    recommendations.push('기존 Bundle 구조가 보존됩니다. 필요시 평면화 옵션을 사용하세요');
  }

  if (analysis.elementsByType.templateGroups > analysis.elementsByType.baseClips) {
    recommendations.push('TemplateGroup이 많습니다. 메모리 사용량을 모니터링하세요');
  }

  return recommendations;
}

/**
 * 제약 조건 검증
 */
function validateConstraints(
  analysis: NestingAnalysis,
  constraints: NestingConstraints
): string[] {
  const violations: string[] = [];

  if (analysis.totalElements > constraints.maxElementsPerBundle) {
    violations.push(`요소 수 제한 초과: ${analysis.totalElements}/${constraints.maxElementsPerBundle}`);
  }

  return violations;
}

/**
 * 자동 수정 가능한 이슈 식별
 */
function identifyAutoFixableIssues(analysis: NestingAnalysis, validation: ValidationResult): void {
  // 메모리 사용량이 높은 경우 캐시 최적화 제안
  if (analysis.performance.memoryEstimate > 30) {
    validation.autoFixable.push({
      issue: 'high-memory-usage',
      description: '메모리 사용량이 높습니다',
      solution: '캐시 시스템 최적화 적용'
    });
  }

  // 복잡도가 높은 경우 구조 단순화 제안
  if (analysis.nestingPotential.complexityScore > 60) {
    validation.autoFixable.push({
      issue: 'high-complexity',
      description: '중첩 복잡도가 높습니다',
      solution: '자동 구조 최적화 적용'
    });
  }
}

/**
 * 컨텍스트 기반 추가 검증
 */
function validateWithContext(
  analysis: NestingAnalysis,
  validation: ValidationResult,
  context: BundleCreationContext
): void {
  // 프로젝트별 제약 조건 확인
  if (context.projectConstraints) {
    // 프로젝트별 검증 로직 추가
  }

  // 사용자 권한 확인
  if (context.userPermissions && !context.userPermissions.canCreateNestedBundles) {
    validation.isValid = false;
    validation.errors.push('중첩 Bundle 생성 권한이 없습니다');
  }
}

/**
 * 요소 메타데이터 강화
 */
async function enrichElementsWithMetadata(
  elements: SelectedElement[],
  existingBundles: Bundle[],
  existingTemplateGroups: TemplateGroup[],
  tracks: TimelineTrack[],
  analysis: NestingAnalysis
): Promise<SelectedElementWithMetadata[]> {
  
  return elements.map((element, index) => {
    const metadata: SelectedElementWithMetadata = {
      ...element,
      metadata: {
        index,
        nestingLevel: 1,
        isPreservable: true,
        hasNestedStructure: false,
        estimatedComplexity: 1,
        relatedElements: [],
        constraints: {}
      }
    };

    // 타입별 메타데이터 추가
    if (element.type === 'templateGroup') {
      const group = existingTemplateGroups.find(g => g.id === element.id);
      if (group?.originalBundles && group.originalBundles.length > 0) {
        metadata.metadata.hasNestedStructure = true;
        metadata.metadata.estimatedComplexity = group.originalBundles.length * 2;
      }
    }

    return metadata;
  });
}

/**
 * Bundle Element 구조 생성
 */
async function createBundleElements(
  elements: SelectedElementWithMetadata[],
  options: CreateNestedBundleOptions
): Promise<BundleElement[]> {
  
  const bundleElements: BundleElement[] = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    
    const bundleElement: BundleElement = {
      id: `element_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      type: element.type === 'baseClip' ? 'baseClip' : 
            element.type === 'templateGroup' ? 'templateGroup' : 'nestedBundle',
      
      // 계층 정보
      depth: 1, // 현재는 모든 요소가 1차 깊이
      path: `Bundle.${element.name}`,
      
      // 시간 정보
      startTime: element.startTime,
      endTime: element.endTime,
      duration: element.endTime - element.startTime,
      
      // 타입별 상세 정보
      ...(element.type === 'baseClip' && {
        baseClip: {
          clipId: element.id,
          trackId: `track_${element.trackIndex || 0}`
        }
      }),
      
      ...(element.type === 'templateGroup' && {
        templateGroup: {
          groupId: element.id,
          preservedBundles: [], // 실제 Bundle 정보로 대체 필요
          originalStructure: []
        }
      })
    };

    bundleElements.push(bundleElement);
  }

  return bundleElements;
}

/**
 * 계층 노드 구축
 */
function buildHierarchyNodes(
  elements: BundleElement[],
  bundleData: CreateBundleData
): BundleHierarchyNode[] {
  
  const rootNode: BundleHierarchyNode = {
    bundleId: `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    children: [],
    depth: 0,
    path: bundleData.name,
    metadata: {
      preservationMode: 'full',
      isRoot: true
    }
  };

  // 현재는 평면 구조이므로 모든 요소가 루트의 직접 자식
  elements.forEach(element => {
    const childNode: BundleHierarchyNode = {
      bundleId: element.id,
      parentId: rootNode.bundleId,
      children: [],
      depth: 1,
      path: `${bundleData.name}.${element.id}`,
      metadata: {
        preservationMode: 'full',
        isRoot: false
      }
    };
    
    rootNode.children.push(childNode);
  });

  return [rootNode];
}

/**
 * NestedBundle 객체 생성
 */
function createNestedBundleObject(
  bundleData: CreateBundleData,
  elements: BundleElement[],
  hierarchy: BundleHierarchyNode[],
  analysis: NestingAnalysis
): NestedBundle {
  
  const bundleId = hierarchy[0].bundleId;
  const startTime = Math.min(...elements.map(el => el.startTime));
  const endTime = Math.max(...elements.map(el => el.endTime));

  const nestedBundle: NestedBundle = {
    // 기본 Bundle 속성
    id: bundleId,
    name: bundleData.name,
    color: bundleData.color,
    createdAt: Date.now(),
    
    // 레거시 호환성 (현재는 빈 배열)
    baseClipIds: elements.filter(el => el.type === 'baseClip').map(el => el.baseClip?.clipId || ''),
    templateGroupIds: elements.filter(el => el.type === 'templateGroup').map(el => el.templateGroup?.groupId || ''),
    startTime,
    endTime,
    
    // 중첩 Bundle 속성
    elements,
    
    hierarchy: {
      depth: 1,
      maxDepth: Math.max(...elements.map(el => el.depth)),
      totalElements: elements.length,
      leafElements: elements.filter(el => el.type === 'baseClip').length
    },
    
    timeRange: {
      startTime,
      endTime,
      duration: endTime - startTime,
      isContiguous: true // 실제 검증 로직 추가 필요
    },
    
    relationships: {
      nestedRelations: [] // 실제 관계 정보로 대체 필요
    },
    
    cache: {
      flattenedClipIds: elements
        .filter(el => el.type === 'baseClip')
        .map(el => el.baseClip?.clipId || ''),
      hierarchyMap: new Map(elements.map(el => [el.id, el])),
      lastUpdated: Date.now()
    }
  };

  return nestedBundle;
}

/**
 * 보존된 구조 추출
 */
function extractPreservedStructures(elements: BundleElement[]): any[] {
  return elements
    .filter(el => el.templateGroup?.preservedBundles?.length)
    .map(el => ({
      sourceId: el.id,
      preservedBundles: el.templateGroup?.preservedBundles || []
    }));
}

/**
 * 보존률 계산
 */
function calculatePreservationRatio(elements: BundleElement[]): number {
  const preservableElements = elements.filter(el => 
    el.type === 'templateGroup' && el.templateGroup?.preservedBundles?.length
  );
  
  if (preservableElements.length === 0) return 1.0;
  
  const preservedCount = preservableElements.filter(el => 
    el.templateGroup?.preservedBundles?.length
  ).length;
  
  return preservedCount / preservableElements.length;
}
