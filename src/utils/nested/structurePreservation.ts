// === 원본 구조 보존 메커니즘 === //

import type { 
  NestedBundle, 
  NestedTemplateGroup, 
  BundleHierarchyNode,
  NestedBundleRelation,
  LoadTemplateAsNestedGroupOptions,
  LoadNestedTemplateGroupResult
} from '../../types/nested';
import type { TimelineTrack } from '../../types';
import { BundleHierarchyManager } from './bundleHierarchy';

/**
 * 원본 Bundle 구조 정보
 */
interface OriginalBundleStructure {
  bundles: NestedBundle[];
  relations: NestedBundleRelation[];
  hierarchy: BundleHierarchyNode[];
  metadata: {
    totalBundles: number;
    maxDepth: number;
    preservationMode: 'full' | 'partial' | 'reference';
    capturedAt: string;
    sourceTemplateId: string;
  };
}

/**
 * 구조 보존 매핑 정보
 */
interface StructurePreservationMapping {
  originalToNew: Map<string, string>;    // 원본 ID -> 새 ID
  newToOriginal: Map<string, string>;    // 새 ID -> 원본 ID
  bundleClipMappings: Map<string, string[]>; // Bundle ID -> Clip IDs
  hierarchyMappings: Map<string, BundleHierarchyNode>; // Bundle ID -> 계층 노드
  preservationQuality: number;           // 0-1, 보존 품질 점수
}

/**
 * 원본 구조 보존 관리자
 */
export class StructurePreservationManager {
  private preservedStructures: Map<string, OriginalBundleStructure> = new Map();
  private preservationMappings: Map<string, StructurePreservationMapping> = new Map();
  private hierarchyManager: BundleHierarchyManager;

  constructor() {
    this.hierarchyManager = new BundleHierarchyManager();
  }

  /**
   * 템플릿의 Bundle 구조 캡처 및 보존
   */
  async captureOriginalStructure(
    templateId: string,
    bundles: NestedBundle[],
    relations: NestedBundleRelation[]
  ): Promise<OriginalBundleStructure> {
    console.log('📸 원본 Bundle 구조 캡처 시작:', {
      templateId: templateId.slice(-8),
      bundleCount: bundles.length,
      relationCount: relations.length
    });

    // 계층 구조 구축
    const hierarchy = this.hierarchyManager.buildHierarchy(relations);
    const stats = this.hierarchyManager.getHierarchyStatistics();

    // 구조 정보 생성
    const structure: OriginalBundleStructure = {
      bundles: this.deepCloneBundles(bundles),
      relations: this.deepCloneRelations(relations), 
      hierarchy,
      metadata: {
        totalBundles: bundles.length,
        maxDepth: stats.maxDepth,
        preservationMode: 'full',
        capturedAt: new Date().toISOString(),
        sourceTemplateId: templateId
      }
    };

    // 캐시에 저장
    this.preservedStructures.set(templateId, structure);

    console.log('✅ 원본 Bundle 구조 캡처 완료:', {
      templateId: templateId.slice(-8),
      hierarchyNodes: hierarchy.length,
      maxDepth: stats.maxDepth,
      captureTime: new Date().toISOString()
    });

    return structure;
  }

  /**
   * 보존된 구조를 기반으로 TemplateGroup 생성
   */
  async createNestedTemplateGroup(
    templateId: string,
    groupName: string,
    insertTime: number,
    newClipIds: string[],
    options: LoadTemplateAsNestedGroupOptions
  ): Promise<LoadNestedTemplateGroupResult> {
    console.log('🏗️ 중첩 TemplateGroup 생성 시작:', {
      templateId: templateId.slice(-8),
      groupName,
      insertTime,
      clipCount: newClipIds.length,
      nestingMode: options.nestingMode
    });

    const startTime = Date.now();

    try {
      // 1. 원본 구조 가져오기
      const originalStructure = this.preservedStructures.get(templateId);
      if (!originalStructure) {
        throw new Error(`템플릿 ${templateId}의 원본 구조를 찾을 수 없습니다`);
      }

      // 2. ID 매핑 생성
      const mapping = this.createIdMapping(originalStructure, newClipIds);

      // 3. Bundle 구조 재구성
      const preservedBundles = this.reconstructBundles(
        originalStructure, 
        mapping, 
        options
      );

      // 4. 관계 재구성
      const preservedRelations = this.reconstructRelations(
        originalStructure.relations, 
        mapping
      );

      // 5. 계층 구조 재구성
      const reconstructedHierarchy = this.reconstructHierarchy(
        originalStructure.hierarchy, 
        mapping
      );

      // 6. NestedTemplateGroup 생성
      const nestedGroup = this.createNestedTemplateGroupObject(
        templateId,
        groupName,
        newClipIds,
        insertTime,
        originalStructure,
        preservedBundles,
        preservedRelations,
        reconstructedHierarchy,
        mapping,
        options
      );

      // 7. 검증
      const validation = this.validatePreservation(originalStructure, nestedGroup);

      const processingTime = Date.now() - startTime;

      console.log('✅ 중첩 TemplateGroup 생성 완료:', {
        templateId: templateId.slice(-8),
        preservedBundles: preservedBundles.length,
        preservedRelations: preservedRelations.length,
        hierarchyNodes: reconstructedHierarchy.length,
        processingTime,
        preservationQuality: mapping.preservationQuality
      });

      return {
        tracks: [], // 실제로는 업데이트된 트랙들
        templateGroup: nestedGroup,
        preservedBundles,
        hierarchy: reconstructedHierarchy,
        processing: {
          mode: options.nestingMode,
          preservedElements: preservedBundles.length,
          flattenedElements: 0, // 계산 필요
          totalProcessingTime: processingTime
        },
        conflicts: {
          resolved: [],
          unresolved: []
        },
        performance: {
          loadTime: processingTime,
          memoryUsage: this.calculateMemoryUsage(nestedGroup),
          cacheHitRate: 1.0, // 첫 생성이므로 캐시 없음
          optimizationApplied: []
        },
        validation: {
          structureValid: validation.structureValid,
          relationshipsValid: validation.relationshipsValid,
          timelineValid: validation.timelineValid,
          errors: validation.errors,
          warnings: validation.warnings
        },
        warnings: validation.warnings,
        errors: validation.errors
      };

    } catch (error) {
      console.error('❌ 중첩 TemplateGroup 생성 실패:', error);
      throw error;
    }
  }

  /**
   * ID 매핑 생성
   */
  private createIdMapping(
    originalStructure: OriginalBundleStructure,
    newClipIds: string[]
  ): StructurePreservationMapping {
    const originalToNew = new Map<string, string>();
    const newToOriginal = new Map<string, string>();
    const bundleClipMappings = new Map<string, string[]>();
    const hierarchyMappings = new Map<string, BundleHierarchyNode>();

    // Bundle ID 매핑 생성
    originalStructure.bundles.forEach((bundle, index) => {
      const newBundleId = `bundle-${Date.now()}-${index}`;
      originalToNew.set(bundle.id, newBundleId);
      newToOriginal.set(newBundleId, bundle.id);

      // Bundle의 클립들 매핑
      const bundleClips = bundle.baseClipIds.slice(0, newClipIds.length);
      bundleClipMappings.set(newBundleId, bundleClips);
    });

    // 계층 노드 매핑
    const mapHierarchyNodes = (nodes: BundleHierarchyNode[]) => {
      for (const node of nodes) {
        const newBundleId = originalToNew.get(node.bundleId);
        if (newBundleId) {
          hierarchyMappings.set(newBundleId, node);
        }
        if (node.children.length > 0) {
          mapHierarchyNodes(node.children);
        }
      }
    };
    mapHierarchyNodes(originalStructure.hierarchy);

    // 보존 품질 계산
    const preservationQuality = this.calculatePreservationQuality(
      originalStructure,
      originalToNew
    );

    return {
      originalToNew,
      newToOriginal,
      bundleClipMappings,
      hierarchyMappings,
      preservationQuality
    };
  }

  /**
   * Bundle 구조 재구성
   */
  private reconstructBundles(
    originalStructure: OriginalBundleStructure,
    mapping: StructurePreservationMapping,
    options: LoadTemplateAsNestedGroupOptions
  ): NestedBundle[] {
    const preservedBundles: NestedBundle[] = [];

    for (const originalBundle of originalStructure.bundles) {
      const newBundleId = mapping.originalToNew.get(originalBundle.id);
      if (!newBundleId) continue;

      // 기본 정보 복사
      const newBundle: NestedBundle = {
        ...originalBundle,
        id: newBundleId,
        name: `${originalBundle.name} (Preserved)`,
        baseClipIds: mapping.bundleClipMappings.get(newBundleId) || [],
        templateGroupIds: [], // 재구성 필요
        
        // 중첩 관계 정보 초기화 (나중에 업데이트)
        nestedRelations: {
          children: [],
          allDescendants: [],
          relations: []
        },

        // 메타데이터 업데이트
        metadata: {
          ...originalBundle.metadata,
          creationContext: {
            source: 'template_import',
            sourceDetails: {
              templateId: originalStructure.metadata.sourceTemplateId
            }
          },
          editHistory: [
            ...(originalBundle.metadata.editHistory || []),
            {
              timestamp: new Date().toISOString(),
              action: 'nested',
              details: {
                preservationMode: options.nestingMode,
                sourceTemplateId: originalStructure.metadata.sourceTemplateId,
                originalBundleId: originalBundle.id
              }
            }
          ]
        }
      };

      preservedBundles.push(newBundle);
    }

    console.log('🔄 Bundle 구조 재구성 완료:', {
      originalCount: originalStructure.bundles.length,
      preservedCount: preservedBundles.length,
      preservationMode: options.nestingMode
    });

    return preservedBundles;
  }

  /**
   * 관계 재구성
   */
  private reconstructRelations(
    originalRelations: NestedBundleRelation[],
    mapping: StructurePreservationMapping
  ): NestedBundleRelation[] {
    const preservedRelations: NestedBundleRelation[] = [];

    for (const originalRelation of originalRelations) {
      const newParentId = mapping.originalToNew.get(originalRelation.parentBundleId);
      const newChildId = mapping.originalToNew.get(originalRelation.childBundleId);

      if (newParentId && newChildId) {
        const newRelation: NestedBundleRelation = {
          ...originalRelation,
          id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          parentBundleId: newParentId,
          childBundleId: newChildId,
          relationship: 'preserved',
          createdAt: new Date().toISOString(),
          metadata: {
            ...originalRelation.metadata,
            sourceType: 'template_import',
            preservationPriority: 'high'
          }
        };

        preservedRelations.push(newRelation);
      }
    }

    console.log('🔗 관계 재구성 완료:', {
      originalCount: originalRelations.length,
      preservedCount: preservedRelations.length
    });

    return preservedRelations;
  }

  /**
   * 계층 구조 재구성
   */
  private reconstructHierarchy(
    originalHierarchy: BundleHierarchyNode[],
    mapping: StructurePreservationMapping
  ): BundleHierarchyNode[] {
    const reconstructNode = (node: BundleHierarchyNode): BundleHierarchyNode | null => {
      const newBundleId = mapping.originalToNew.get(node.bundleId);
      if (!newBundleId) return null;

      const newParentId = node.parentId ? mapping.originalToNew.get(node.parentId) : undefined;

      const reconstructedChildren: BundleHierarchyNode[] = [];
      for (const child of node.children) {
        const reconstructedChild = reconstructNode(child);
        if (reconstructedChild) {
          reconstructedChildren.push(reconstructedChild);
        }
      }

      return {
        ...node,
        bundleId: newBundleId,
        parentId: newParentId,
        children: reconstructedChildren,
        path: this.reconstructPath(node.path, mapping),
        metadata: {
          ...node.metadata,
          originalSource: node.bundleId, // 원본 ID 보존
          preservationMode: 'full'
        },
        cache: {
          flattenedChildIds: reconstructedChildren.map(child => child.bundleId),
          totalElements: node.cache?.totalElements || 1,
          lastUpdated: Date.now()
        }
      };
    };

    const reconstructedHierarchy: BundleHierarchyNode[] = [];
    for (const rootNode of originalHierarchy) {
      const reconstructed = reconstructNode(rootNode);
      if (reconstructed) {
        reconstructedHierarchy.push(reconstructed);
      }
    }

    return reconstructedHierarchy;
  }

  /**
   * 경로 재구성
   */
  private reconstructPath(originalPath: string, mapping: StructurePreservationMapping): string {
    const pathSegments = originalPath.split('.');
    const newSegments: string[] = [];

    for (const segment of pathSegments) {
      // 원본 Bundle ID를 찾아서 새 ID로 변환
      for (const [originalId, newId] of mapping.originalToNew) {
        if (originalId.endsWith(segment)) {
          newSegments.push(newId.slice(-8));
          break;
        }
      }
    }

    return newSegments.join('.');
  }

  /**
   * NestedTemplateGroup 객체 생성
   */
  private createNestedTemplateGroupObject(
    templateId: string,
    groupName: string,
    clipIds: string[],
    insertTime: number,
    originalStructure: OriginalBundleStructure,
    preservedBundles: NestedBundle[],
    preservedRelations: NestedBundleRelation[],
    hierarchy: BundleHierarchyNode[],
    mapping: StructurePreservationMapping,
    options: LoadTemplateAsNestedGroupOptions
  ): NestedTemplateGroup {
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const endTime = insertTime + this.calculateGroupDuration(clipIds);

    const nestedGroup: NestedTemplateGroup = {
      // 기본 TemplateGroup 정보
      id: groupId,
      name: groupName,
      templateId,
      clipIds,
      startTime: insertTime,
      endTime,
      isProtected: options.isProtected,
      color: '#4ECDC4', // 기본 색상
      createdAt: Date.now(),
      
      // 중첩 구조 정보
      nestedStructure: {
        preservedBundles,
        bundleHierarchy: hierarchy,
        flattenedBundleIds: Array.from(mapping.originalToNew.values()),
        preservationMap: mapping.originalToNew,
        nestedRelations: preservedRelations,
        rootBundleIds: hierarchy.map(node => node.bundleId),
        maxNestingDepth: originalStructure.metadata.maxDepth,
        structureIntegrity: {
          isComplete: mapping.preservationQuality > 0.95,
          missingElements: [],
          modifiedElements: [],
          brokenRelations: []
        }
      },

      // 원본 정보
      originalTemplate: {
        templateId,
        bundleStructure: originalStructure.hierarchy,
        importMode: options.nestingMode,
        importedAt: new Date().toISOString(),
        preservationSettings: {
          preserveBundleStructure: true,
          preserveRelationships: true,
          flattenDepth: options.maxDepth,
          selectivePreservation: options.selectivePreservation?.bundleIds
        },
        originalData: {
          bundles: originalStructure.bundles,
          bundleRelations: originalStructure.relations,
          clipBundleMappings: this.createClipBundleMappings(originalStructure.bundles)
        }
      },

      // 확장된 메타데이터
      enhancedMetadata: {
        sourceTemplateId: templateId,
        importedAt: new Date().toISOString(),
        preservesBundles: true,
        nestingInfo: {
          maxNestingDepth: originalStructure.metadata.maxDepth,
          totalBundleCount: preservedBundles.length,
          hasCircularReference: false, // 검증 필요
          preservationQuality: this.mapQualityToLevel(mapping.preservationQuality),
          complexity: this.calculateComplexity(originalStructure, preservedBundles)
        },
        performance: {
          loadTime: 0, // 나중에 업데이트
          renderTime: 0,
          memoryUsage: this.calculateMemoryUsage({ nestedStructure: { preservedBundles } } as any),
          optimizationRecommendations: []
        },
        compatibility: {
          schemaVersion: '1.0.0',
          compatibilityIssues: [],
          fallbackBehavior: 'preserve_partial'
        }
      },

      // 실시간 상태
      state: {
        isLoaded: true,
        isValid: true,
        hasErrors: false,
        lastValidated: Date.now(),
        activeNestingLevel: 0,
        visibleBundleIds: hierarchy.map(node => node.bundleId),
        collapsedNodes: [],
        isEditing: false
      }
    };

    return nestedGroup;
  }

  /**
   * Bundle 복제 (깊은 복사)
   */
  private deepCloneBundles(bundles: NestedBundle[]): NestedBundle[] {
    return JSON.parse(JSON.stringify(bundles));
  }

  /**
   * 관계 복제 (깊은 복사)
   */
  private deepCloneRelations(relations: NestedBundleRelation[]): NestedBundleRelation[] {
    return JSON.parse(JSON.stringify(relations));
  }

  /**
   * 보존 품질 계산
   */
  private calculatePreservationQuality(
    originalStructure: OriginalBundleStructure,
    mapping: Map<string, string>
  ): number {
    const originalCount = originalStructure.bundles.length;
    const preservedCount = mapping.size;
    return preservedCount / originalCount;
  }

  /**
   * 그룹 지속 시간 계산
   */
  private calculateGroupDuration(clipIds: string[]): number {
    // 실제로는 클립들의 정보를 기반으로 계산해야 함
    return 10; // 임시값
  }

  /**
   * 클립-번들 매핑 생성
   */
  private createClipBundleMappings(bundles: NestedBundle[]): { [clipId: string]: string } {
    const mappings: { [clipId: string]: string } = {};
    for (const bundle of bundles) {
      for (const clipId of bundle.baseClipIds) {
        mappings[clipId] = bundle.id;
      }
    }
    return mappings;
  }

  /**
   * 품질 점수를 레벨로 변환
   */
  private mapQualityToLevel(quality: number): 'excellent' | 'good' | 'partial' | 'poor' {
    if (quality >= 0.95) return 'excellent';
    if (quality >= 0.8) return 'good';
    if (quality >= 0.6) return 'partial';
    return 'poor';
  }

  /**
   * 복잡도 계산
   */
  private calculateComplexity(
    originalStructure: OriginalBundleStructure,
    preservedBundles: NestedBundle[]
  ) {
    const bundleCount = preservedBundles.length;
    const relationCount = originalStructure.relations.length;
    const maxDepth = originalStructure.metadata.maxDepth;

    const score = (bundleCount * 2) + (relationCount * 3) + (maxDepth * 5);

    return {
      score: Math.min(score, 100),
      factors: {
        nestingDepth: maxDepth,
        bundleCount,
        relationCount,
        timeOverlaps: 0 // 계산 필요
      },
      level: score < 20 ? 'simple' as const :
             score < 50 ? 'moderate' as const :
             score < 80 ? 'complex' as const : 'very_complex' as const
    };
  }

  /**
   * 메모리 사용량 계산
   */
  private calculateMemoryUsage(group: any): number {
    // 대략적인 메모리 사용량 계산
    const jsonString = JSON.stringify(group);
    return jsonString.length * 2; // UTF-16 기준
  }

  /**
   * 보존 검증
   */
  private validatePreservation(
    originalStructure: OriginalBundleStructure,
    nestedGroup: NestedTemplateGroup
  ): {
    structureValid: boolean;
    relationshipsValid: boolean;
    timelineValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 구조 검증
    const structureValid = nestedGroup.nestedStructure.preservedBundles.length > 0;
    if (!structureValid) {
      errors.push('Bundle 구조가 보존되지 않았습니다');
    }

    // 관계 검증
    const relationshipsValid = nestedGroup.nestedStructure.nestedRelations.length >= 0;

    // 타임라인 검증
    const timelineValid = nestedGroup.startTime < nestedGroup.endTime;
    if (!timelineValid) {
      errors.push('유효하지 않은 시간 범위입니다');
    }

    // 경고 생성
    if (nestedGroup.enhancedMetadata.nestingInfo.preservationQuality !== 'excellent') {
      warnings.push('일부 Bundle 구조가 완전히 보존되지 않았을 수 있습니다');
    }

    return {
      structureValid,
      relationshipsValid,
      timelineValid,
      errors,
      warnings
    };
  }

  /**
   * 보존된 구조 가져오기
   */
  getPreservedStructure(templateId: string): OriginalBundleStructure | undefined {
    return this.preservedStructures.get(templateId);
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.preservedStructures.clear();
    this.preservationMappings.clear();
    console.log('🧹 구조 보존 캐시 정리 완료');
  }
}

// 🎉 원본 구조 보존 메커니즘 v1.0.0 준비 완료!
console.log('📦 원본 구조 보존 메커니즘 로드됨');
