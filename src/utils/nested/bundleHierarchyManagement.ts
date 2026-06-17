/**
 * Bundle 계층 관리 시스템
 * Phase 2 Day 1: Bundle 계층 구조 구축 및 관리
 * 
 * 주요 기능:
 * - 부모-자식 Bundle 관계 관리
 * - 계층 경로 생성 및 업데이트
 * - Bundle ID 매핑 시스템
 * - 계층 구조 실시간 동기화
 * - 성능 최적화된 검색 시스템
 */

import {
  Bundle,
  TemplateGroup,
  SelectedElement,
  TimelineClip,
  TimelineTrack
} from '../../types';

import {
  NestedBundle,
  BundleElement,
  NestedBundleRelation,
  BundleHierarchyNode,
  BundleRelationshipUpdateResult,
  HierarchicalMoveOptions,
  MoveResult,
  ValidationResult
} from '../../types/nested';

import { getSystemManager } from './index';

/**
 * 🌳 Bundle 계층 관리자
 * 
 * Bundle 간의 부모-자식 관계를 관리하고
 * 계층 구조의 무결성을 보장합니다.
 */
export class BundleHierarchyManager {
  private relationMap: Map<string, NestedBundleRelation[]> = new Map();
  private hierarchyCache: Map<string, BundleHierarchyNode> = new Map();
  private pathCache: Map<string, string> = new Map();
  private childrenCache: Map<string, string[]> = new Map();
  private lastUpdateTime: number = 0;

  constructor() {
    this.initializeManager();
  }

  /**
   * 초기화
   */
  private initializeManager(): void {
    console.log('🌳 Bundle 계층 관리자 초기화...');
    this.clearCaches();
  }

  /**
   * 📋 Bundle 계층 구조 구축
   * 
   * 새로운 Bundle이 생성될 때 기존 Bundle들과의
   * 계층 관계를 설정합니다.
   */
  async buildBundleHierarchy(
    newBundle: NestedBundle,
    existingBundles: Bundle[],
    existingRelations: NestedBundleRelation[] = []
  ): Promise<{
    hierarchy: BundleHierarchyNode[];
    relations: NestedBundleRelation[];
    warnings: string[];
  }> {
    
    const result = {
      hierarchy: [] as BundleHierarchyNode[],
      relations: [] as NestedBundleRelation[],
      warnings: [] as string[]
    };

    try {
      console.log(`🏗️ Bundle 계층 구조 구축: ${newBundle.name}`);

      // 1. 기존 관계 로드
      await this.loadExistingRelations(existingRelations);

      // 2. 새로운 관계 생성
      const newRelations = await this.createNewRelations(newBundle, existingBundles);
      result.relations = [...existingRelations, ...newRelations];

      // 3. 계층 노드 생성
      result.hierarchy = await this.buildHierarchyNodes(newBundle, newRelations);

      // 4. 순환 참조 검증
      const circularCheck = await this.validateNoCircularReferences(result.relations);
      if (!circularCheck.isValid) {
        result.warnings.push('순환 참조가 감지되어 일부 관계가 제거되었습니다');
        result.relations = circularCheck.cleanedRelations;
      }

      // 5. 캐시 업데이트
      await this.updateHierarchyCaches(result.hierarchy, result.relations);

      console.log(`✅ 계층 구조 구축 완료: ${result.hierarchy.length}개 노드, ${result.relations.length}개 관계`);

    } catch (error) {
      console.error('❌ 계층 구조 구축 실패:', error);
      result.warnings.push(`계층 구조 구축 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 🔗 부모-자식 관계 설정
   * 
   * Bundle 간의 직접적인 부모-자식 관계를 설정합니다.
   */
  async setParentChildRelation(
    parentBundleId: string,
    childBundleId: string,
    relationship: 'direct' | 'inherited' | 'preserved' = 'direct',
    preserveOnMove: boolean = true
  ): Promise<BundleRelationshipUpdateResult> {
    
    const result: BundleRelationshipUpdateResult = {
      success: false,
      updatedRelations: [],
      affectedBundles: [],
      warnings: [],
      performance: {
        updateTime: 0,
        cacheUpdates: 0
      }
    };

    const startTime = performance.now();

    try {
      console.log(`🔗 부모-자식 관계 설정: ${parentBundleId} → ${childBundleId}`);

      // 1. 순환 참조 검증
      if (await this.wouldCreateCircularReference(parentBundleId, childBundleId)) {
        result.warnings.push('순환 참조가 발생하므로 관계를 설정할 수 없습니다');
        return result;
      }

      // 2. 기존 관계 확인
      const existingRelation = await this.findExistingRelation(parentBundleId, childBundleId);
      if (existingRelation) {
        result.warnings.push('이미 존재하는 관계입니다');
        return result;
      }

      // 3. 새로운 관계 생성
      const newRelation: NestedBundleRelation = {
        parentBundleId,
        childBundleId,
        relationship,
        depth: await this.calculateRelationDepth(parentBundleId),
        preserveOnMove,
        createdAt: new Date().toISOString()
      };

      // 4. 관계 추가 및 캐시 업데이트
      await this.addRelation(newRelation);
      
      result.success = true;
      result.updatedRelations = [newRelation];
      result.affectedBundles = [parentBundleId, childBundleId];

      // 5. 하위 Bundle들의 깊이 업데이트
      await this.updateChildrenDepth(childBundleId);

      console.log(`✅ 관계 설정 완료: ${relationship} 관계`);

    } catch (error) {
      console.error('❌ 관계 설정 실패:', error);
      result.warnings.push(`관계 설정 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.performance.updateTime = performance.now() - startTime;
    return result;
  }

  /**
   * 📍 계층 경로 생성 및 관리
   * 
   * Bundle의 전체 계층 경로를 생성하고 관리합니다.
   * 예: "마스터번들 > 인트로그룹 > 타이틀번들"
   */
  async generateHierarchyPath(bundleId: string, separator: string = ' > '): Promise<string> {
    
    // 캐시 확인
    const cacheKey = `${bundleId}:${separator}`;
    const cached = this.pathCache.get(cacheKey);
    if (cached && this.isCacheValid()) {
      return cached;
    }

    try {
      const path = await this.buildPathRecursive(bundleId, separator);
      this.pathCache.set(cacheKey, path);
      return path;
    } catch (error) {
      console.error('❌ 경로 생성 실패:', error);
      return bundleId; // 기본값으로 Bundle ID 반환
    }
  }

  /**
   * 🔍 Bundle 계층 검색
   * 
   * 다양한 조건으로 Bundle 계층을 검색합니다.
   */
  async searchBundleHierarchy(query: {
    bundleId?: string;
    parentId?: string;
    depth?: number;
    relationship?: 'direct' | 'inherited' | 'preserved';
    includeChildren?: boolean;
    includeParents?: boolean;
  }): Promise<{
    bundles: string[];
    relations: NestedBundleRelation[];
    hierarchy: BundleHierarchyNode[];
  }> {
    
    const result = {
      bundles: [] as string[],
      relations: [] as NestedBundleRelation[],
      hierarchy: [] as BundleHierarchyNode[]
    };

    try {
      // 1. Bundle ID로 검색
      if (query.bundleId) {
        result.bundles.push(query.bundleId);
        
        if (query.includeChildren) {
          const children = await this.getChildBundles(query.bundleId);
          result.bundles.push(...children);
        }
        
        if (query.includeParents) {
          const parents = await this.getParentBundles(query.bundleId);
          result.bundles.push(...parents);
        }
      }

      // 2. 부모 ID로 검색
      if (query.parentId) {
        const children = await this.getDirectChildren(query.parentId);
        result.bundles.push(...children);
      }

      // 3. 깊이로 검색
      if (query.depth !== undefined) {
        const bundlesAtDepth = await this.getBundlesAtDepth(query.depth);
        result.bundles.push(...bundlesAtDepth);
      }

      // 4. 관계 타입으로 검색
      if (query.relationship) {
        const relatedBundles = await this.getBundlesByRelationship(query.relationship);
        result.bundles.push(...relatedBundles);
      }

      // 중복 제거
      result.bundles = [...new Set(result.bundles)];

      // 5. 관련 관계 정보 수집
      result.relations = await this.getRelationsForBundles(result.bundles);

      // 6. 계층 노드 정보 수집
      result.hierarchy = await this.getHierarchyNodesForBundles(result.bundles);

    } catch (error) {
      console.error('❌ 계층 검색 실패:', error);
    }

    return result;
  }

  /**
   * 🚀 계층적 Bundle 이동
   * 
   * Bundle을 이동할 때 하위 Bundle들도 함께 이동합니다.
   */
  async moveNestedBundle(
    bundleId: string,
    deltaTime: number,
    options: HierarchicalMoveOptions = {}
  ): Promise<MoveResult> {
    
    const result: MoveResult = {
      success: false,
      movedBundles: [],
      timeUpdates: new Map(),
      relationshipChanges: [],
      warnings: []
    };

    try {
      console.log(`🚀 계층적 Bundle 이동: ${bundleId} (${deltaTime}ms)`);

      // 1. 이동 검증
      const validation = await this.validateHierarchicalMove(bundleId, deltaTime, options);
      if (!validation.isValid) {
        result.warnings.push(...validation.errors);
        return result;
      }

      // 2. 이동할 Bundle들 수집
      const bundlesToMove = [bundleId];
      
      if (options.moveChildren !== false) {
        const children = await this.getChildBundles(bundleId);
        bundlesToMove.push(...children);
      }

      // 3. 시간 업데이트 계산
      for (const bundleIdToMove of bundlesToMove) {
        const currentTimes = await this.getBundleTimeRange(bundleIdToMove);
        if (currentTimes) {
          result.timeUpdates.set(bundleIdToMove, {
            startTime: currentTimes.startTime + deltaTime,
            endTime: currentTimes.endTime + deltaTime
          });
        }
      }

      // 4. 관계 업데이트 (필요한 경우)
      if (options.preserveHierarchy !== false) {
        result.relationshipChanges = await this.updateRelationshipsAfterMove(
          bundlesToMove,
          deltaTime
        );
      }

      result.success = true;
      result.movedBundles = bundlesToMove;

      console.log(`✅ 계층적 이동 완료: ${bundlesToMove.length}개 Bundle 이동`);

    } catch (error) {
      console.error('❌ 계층적 이동 실패:', error);
      result.warnings.push(`이동 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 🔒 중첩 Bundle ID 매핑 시스템
   * 
   * Bundle ID와 계층 구조 간의 매핑을 관리합니다.
   */
  async updateBundleIdMapping(
    oldBundleId: string,
    newBundleId: string,
    preserveHierarchy: boolean = true
  ): Promise<{
    success: boolean;
    updatedRelations: number;
    affectedBundles: string[];
  }> {
    
    const result = {
      success: false,
      updatedRelations: 0,
      affectedBundles: [] as string[]
    };

    try {
      console.log(`🔒 Bundle ID 매핑 업데이트: ${oldBundleId} → ${newBundleId}`);

      if (preserveHierarchy) {
        // 1. 부모 관계 업데이트
        const parentRelations = await this.getParentRelations(oldBundleId);
        for (const relation of parentRelations) {
          await this.updateRelation({
            ...relation,
            childBundleId: newBundleId
          });
          result.updatedRelations++;
          result.affectedBundles.push(relation.parentBundleId);
        }

        // 2. 자식 관계 업데이트
        const childRelations = await this.getChildRelations(oldBundleId);
        for (const relation of childRelations) {
          await this.updateRelation({
            ...relation,
            parentBundleId: newBundleId
          });
          result.updatedRelations++;
          result.affectedBundles.push(relation.childBundleId);
        }
      }

      // 3. 캐시 업데이트
      await this.updateCacheForBundleId(oldBundleId, newBundleId);

      result.success = true;
      result.affectedBundles = [...new Set(result.affectedBundles)];

      console.log(`✅ ID 매핑 업데이트 완료: ${result.updatedRelations}개 관계 업데이트`);

    } catch (error) {
      console.error('❌ ID 매핑 업데이트 실패:', error);
    }

    return result;
  }

  // ========================================
  // 🛠️ 내부 헬퍼 메서드들
  // ========================================

  private async loadExistingRelations(relations: NestedBundleRelation[]): Promise<void> {
    this.relationMap.clear();
    
    for (const relation of relations) {
      if (!this.relationMap.has(relation.parentBundleId)) {
        this.relationMap.set(relation.parentBundleId, []);
      }
      this.relationMap.get(relation.parentBundleId)!.push(relation);
    }
  }

  private async createNewRelations(
    newBundle: NestedBundle,
    existingBundles: Bundle[]
  ): Promise<NestedBundleRelation[]> {
    
    const newRelations: NestedBundleRelation[] = [];

    // Bundle 내부 요소들과의 관계 생성
    for (const element of newBundle.elements) {
      if (element.type === 'templateGroup' && element.templateGroup) {
        // TemplateGroup 내부의 Bundle들과의 관계
        for (const preservedBundle of element.templateGroup.preservedBundles) {
          newRelations.push({
            parentBundleId: newBundle.id,
            childBundleId: preservedBundle.id,
            relationship: 'preserved',
            depth: 1,
            preserveOnMove: true,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    return newRelations;
  }

  private async buildHierarchyNodes(
    bundle: NestedBundle,
    relations: NestedBundleRelation[]
  ): Promise<BundleHierarchyNode[]> {
    
    const nodes: BundleHierarchyNode[] = [];

    // 루트 노드 생성
    const rootNode: BundleHierarchyNode = {
      bundleId: bundle.id,
      children: [],
      depth: 0,
      path: bundle.name,
      metadata: {
        preservationMode: 'full',
        isRoot: true
      }
    };

    // 자식 노드들 추가
    const childRelations = relations.filter(r => r.parentBundleId === bundle.id);
    for (const relation of childRelations) {
      const childNode: BundleHierarchyNode = {
        bundleId: relation.childBundleId,
        parentId: bundle.id,
        children: [],
        depth: relation.depth,
        path: `${bundle.name}.${relation.childBundleId}`,
        metadata: {
          preservationMode: relation.relationship === 'preserved' ? 'full' : 'partial',
          isRoot: false
        }
      };
      
      rootNode.children.push(childNode);
    }

    nodes.push(rootNode);
    return nodes;
  }

  private async validateNoCircularReferences(
    relations: NestedBundleRelation[]
  ): Promise<{ isValid: boolean; cleanedRelations: NestedBundleRelation[] }> {
    
    // 간단한 순환 참조 검증 (DFS 기반)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const problematicRelations = new Set<string>();

    const hasCycle = (bundleId: string): boolean => {
      if (recursionStack.has(bundleId)) {
        return true;
      }
      if (visited.has(bundleId)) {
        return false;
      }

      visited.add(bundleId);
      recursionStack.add(bundleId);

      const childRelations = relations.filter(r => r.parentBundleId === bundleId);
      for (const relation of childRelations) {
        if (hasCycle(relation.childBundleId)) {
          problematicRelations.add(`${relation.parentBundleId}-${relation.childBundleId}`);
          return true;
        }
      }

      recursionStack.delete(bundleId);
      return false;
    };

    // 모든 Bundle에서 순환 참조 검사
    const allBundleIds = new Set([
      ...relations.map(r => r.parentBundleId),
      ...relations.map(r => r.childBundleId)
    ]);

    for (const bundleId of allBundleIds) {
      if (!visited.has(bundleId)) {
        hasCycle(bundleId);
      }
    }

    // 문제가 있는 관계 제거
    const cleanedRelations = relations.filter(r => 
      !problematicRelations.has(`${r.parentBundleId}-${r.childBundleId}`)
    );

    return {
      isValid: problematicRelations.size === 0,
      cleanedRelations
    };
  }

  private async updateHierarchyCaches(
    hierarchy: BundleHierarchyNode[],
    relations: NestedBundleRelation[]
  ): Promise<void> {
    
    // 계층 캐시 업데이트
    this.hierarchyCache.clear();
    for (const node of hierarchy) {
      this.hierarchyCache.set(node.bundleId, node);
    }

    // 자식 캐시 업데이트
    this.childrenCache.clear();
    for (const relation of relations) {
      if (!this.childrenCache.has(relation.parentBundleId)) {
        this.childrenCache.set(relation.parentBundleId, []);
      }
      this.childrenCache.get(relation.parentBundleId)!.push(relation.childBundleId);
    }

    this.lastUpdateTime = Date.now();
  }

  private async wouldCreateCircularReference(
    parentId: string,
    childId: string
  ): Promise<boolean> {
    // 자기 자신을 부모로 설정하는 경우
    if (parentId === childId) {
      return true;
    }

    // childId가 parentId의 조상인지 확인
    return await this.isAncestor(childId, parentId);
  }

  private async isAncestor(ancestorId: string, descendantId: string): Promise<boolean> {
    const visited = new Set<string>();
    
    const checkAncestry = async (currentId: string): Promise<boolean> => {
      if (visited.has(currentId)) {
        return false;
      }
      visited.add(currentId);

      if (currentId === ancestorId) {
        return true;
      }

      const parents = await this.getParentBundles(currentId);
      for (const parentId of parents) {
        if (await checkAncestry(parentId)) {
          return true;
        }
      }

      return false;
    };

    return await checkAncestry(descendantId);
  }

  private async findExistingRelation(
    parentId: string,
    childId: string
  ): Promise<NestedBundleRelation | null> {
    
    const parentRelations = this.relationMap.get(parentId) || [];
    return parentRelations.find(r => r.childBundleId === childId) || null;
  }

  private async calculateRelationDepth(parentBundleId: string): Promise<number> {
    const parentNode = this.hierarchyCache.get(parentBundleId);
    return parentNode ? parentNode.depth + 1 : 1;
  }

  private async addRelation(relation: NestedBundleRelation): Promise<void> {
    if (!this.relationMap.has(relation.parentBundleId)) {
      this.relationMap.set(relation.parentBundleId, []);
    }
    this.relationMap.get(relation.parentBundleId)!.push(relation);
  }

  private async updateChildrenDepth(bundleId: string): Promise<void> {
    const children = this.childrenCache.get(bundleId) || [];
    for (const childId of children) {
      // 자식 Bundle들의 깊이 재계산 로직
      await this.updateChildrenDepth(childId);
    }
  }

  private async buildPathRecursive(bundleId: string, separator: string): Promise<string> {
    const node = this.hierarchyCache.get(bundleId);
    if (!node) {
      return bundleId;
    }

    if (!node.parentId) {
      return node.bundleId;
    }

    const parentPath = await this.buildPathRecursive(node.parentId, separator);
    return `${parentPath}${separator}${node.bundleId}`;
  }

  private isCacheValid(): boolean {
    return (Date.now() - this.lastUpdateTime) < 300000; // 5분 캐시 유효
  }

  private async getChildBundles(bundleId: string): Promise<string[]> {
    return this.childrenCache.get(bundleId) || [];
  }

  private async getParentBundles(bundleId: string): Promise<string[]> {
    const parents: string[] = [];
    for (const [parentId, children] of this.childrenCache.entries()) {
      if (children.includes(bundleId)) {
        parents.push(parentId);
      }
    }
    return parents;
  }

  private async getDirectChildren(parentId: string): Promise<string[]> {
    return this.childrenCache.get(parentId) || [];
  }

  private async getBundlesAtDepth(depth: number): Promise<string[]> {
    const bundles: string[] = [];
    for (const [bundleId, node] of this.hierarchyCache.entries()) {
      if (node.depth === depth) {
        bundles.push(bundleId);
      }
    }
    return bundles;
  }

  private async getBundlesByRelationship(
    relationship: 'direct' | 'inherited' | 'preserved'
  ): Promise<string[]> {
    const bundles: string[] = [];
    for (const relations of this.relationMap.values()) {
      for (const relation of relations) {
        if (relation.relationship === relationship) {
          bundles.push(relation.childBundleId);
        }
      }
    }
    return bundles;
  }

  private async getRelationsForBundles(bundleIds: string[]): Promise<NestedBundleRelation[]> {
    const relations: NestedBundleRelation[] = [];
    for (const bundleId of bundleIds) {
      const bundleRelations = this.relationMap.get(bundleId) || [];
      relations.push(...bundleRelations);
    }
    return relations;
  }

  private async getHierarchyNodesForBundles(bundleIds: string[]): Promise<BundleHierarchyNode[]> {
    const nodes: BundleHierarchyNode[] = [];
    for (const bundleId of bundleIds) {
      const node = this.hierarchyCache.get(bundleId);
      if (node) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  private async validateHierarchicalMove(
    bundleId: string,
    deltaTime: number,
    options: HierarchicalMoveOptions
  ): Promise<ValidationResult> {
    
    const validation: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      performance: { validationTime: 0, memoryUsage: 0, cpuIntensity: 'low' },
      autoFixable: [],
      criticalIssues: []
    };

    // 기본 검증 로직
    if (deltaTime === 0) {
      validation.warnings.push('이동 거리가 0입니다');
    }

    // 추가 검증 로직은 필요에 따라 구현

    return validation;
  }

  private async getBundleTimeRange(bundleId: string): Promise<{ startTime: number; endTime: number } | null> {
    // 실제 Bundle 시간 정보 조회 로직
    // 현재는 시스템 매니저에서 조회
    const systemManager = getSystemManager();
    return null; // 실제 구현 필요
  }

  private async updateRelationshipsAfterMove(
    bundleIds: string[],
    deltaTime: number
  ): Promise<NestedBundleRelation[]> {
    // 이동 후 관계 업데이트 로직
    return [];
  }

  private async getParentRelations(bundleId: string): Promise<NestedBundleRelation[]> {
    const relations: NestedBundleRelation[] = [];
    for (const parentRelations of this.relationMap.values()) {
      relations.push(...parentRelations.filter(r => r.childBundleId === bundleId));
    }
    return relations;
  }

  private async getChildRelations(bundleId: string): Promise<NestedBundleRelation[]> {
    return this.relationMap.get(bundleId) || [];
  }

  private async updateRelation(relation: NestedBundleRelation): Promise<void> {
    // 관계 업데이트 로직
    await this.addRelation(relation);
  }

  private async updateCacheForBundleId(oldId: string, newId: string): Promise<void> {
    // ID 변경 시 캐시 업데이트
    const node = this.hierarchyCache.get(oldId);
    if (node) {
      this.hierarchyCache.delete(oldId);
      this.hierarchyCache.set(newId, { ...node, bundleId: newId });
    }

    const children = this.childrenCache.get(oldId);
    if (children) {
      this.childrenCache.delete(oldId);
      this.childrenCache.set(newId, children);
    }
  }

  private clearCaches(): void {
    this.relationMap.clear();
    this.hierarchyCache.clear();
    this.pathCache.clear();
    this.childrenCache.clear();
    this.lastUpdateTime = 0;
  }
}

// 전역 인스턴스 생성
let globalHierarchyManager: BundleHierarchyManager | null = null;

/**
 * Bundle 계층 관리자 싱글톤 인스턴스 반환
 */
export function getBundleHierarchyManager(): BundleHierarchyManager {
  if (!globalHierarchyManager) {
    globalHierarchyManager = new BundleHierarchyManager();
  }
  return globalHierarchyManager;
}

/**
 * Bundle 계층 관리자 초기화
 */
export function resetBundleHierarchyManager(): void {
  globalHierarchyManager = null;
}
