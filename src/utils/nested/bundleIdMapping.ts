/**
 * Bundle ID 매핑 시스템
 * Phase 2 Day 1: 중첩 Bundle ID 매핑 및 참조 관리
 * 
 * 주요 기능:
 * - Bundle/TemplateGroup/BaseClip ID 매핑 관리
 * - 원본-복사본 ID 관계 추적
 * - 중첩 구조에서의 ID 변환
 * - 빠른 검색을 위한 인덱싱
 * - ID 변경 시 전체 시스템 동기화
 */

import {
  Bundle,
  TemplateGroup,
  TimelineClip,
  SelectedElement
} from '../../types';

import {
  NestedBundle,
  BundleElement,
  BundleHierarchyNode,
  NestedBundleRelation
} from '../../types/nested';

/**
 * ID 매핑 관계 타입
 */
export interface IdMappingRelation {
  originalId: string;
  mappedId: string;
  type: 'bundle' | 'templateGroup' | 'baseClip';
  context: 'nested' | 'preserved' | 'inherited';
  parentBundleId?: string;
  createdAt: string;
  isActive: boolean;
}

/**
 * ID 매핑 쿼리 옵션
 */
export interface IdMappingQuery {
  originalId?: string;
  mappedId?: string;
  type?: 'bundle' | 'templateGroup' | 'baseClip';
  context?: 'nested' | 'preserved' | 'inherited';
  parentBundleId?: string;
  includeInactive?: boolean;
}

/**
 * ID 매핑 업데이트 결과
 */
export interface IdMappingUpdateResult {
  success: boolean;
  updatedMappings: number;
  affectedBundles: string[];
  affectedGroups: string[];
  affectedClips: string[];
  warnings: string[];
  performance: {
    updateTime: number;
    indexRebuildTime: number;
  };
}

/**
 * 🗂️ Bundle ID 매핑 관리자
 * 
 * 중첩 Bundle 시스템에서 모든 ID 매핑과 참조를
 * 효율적으로 관리합니다.
 */
export class BundleIdMappingManager {
  private mappingTable: Map<string, IdMappingRelation[]> = new Map();
  private reverseMappingTable: Map<string, IdMappingRelation[]> = new Map();
  private typeIndex: Map<'bundle' | 'templateGroup' | 'baseClip', Set<string>> = new Map();
  private contextIndex: Map<'nested' | 'preserved' | 'inherited', Set<string>> = new Map();
  private parentIndex: Map<string, Set<string>> = new Map();
  private lastIndexRebuild: number = 0;

  constructor() {
    this.initializeManager();
  }

  /**
   * 초기화
   */
  private initializeManager(): void {
    console.log('🗂️ Bundle ID 매핑 관리자 초기화...');
    this.clearIndexes();
    this.rebuildIndexes();
  }

  /**
   * 📋 새로운 ID 매핑 관계 생성
   * 
   * 원본 요소들을 새로운 Bundle에 포함시킬 때
   * ID 매핑 관계를 생성합니다.
   */
  async createIdMappings(
    elements: SelectedElement[],
    targetBundleId: string,
    context: 'nested' | 'preserved' | 'inherited' = 'nested'
  ): Promise<{
    mappings: IdMappingRelation[];
    idMap: Map<string, string>;
    warnings: string[];
  }> {
    
    const result = {
      mappings: [] as IdMappingRelation[],
      idMap: new Map<string, string>(),
      warnings: [] as string[]
    };

    try {
      console.log(`📋 ID 매핑 생성: ${elements.length}개 요소 → ${targetBundleId}`);

      for (const element of elements) {
        // 새로운 ID 생성
        const newId = this.generateMappedId(element.id, element.type);
        
        // 매핑 관계 생성
        const mapping: IdMappingRelation = {
          originalId: element.id,
          mappedId: newId,
          type: this.getIdType(element.type),
          context,
          parentBundleId: targetBundleId,
          createdAt: new Date().toISOString(),
          isActive: true
        };

        // 중복 체크
        const existingMapping = await this.findMapping({
          originalId: element.id,
          parentBundleId: targetBundleId
        });

        if (existingMapping.length > 0) {
          result.warnings.push(`중복 매핑 발견: ${element.id} → 기존 매핑 사용`);
          result.idMap.set(element.id, existingMapping[0].mappedId);
          continue;
        }

        // 매핑 추가
        await this.addMapping(mapping);
        result.mappings.push(mapping);
        result.idMap.set(element.id, newId);
      }

      // 인덱스 업데이트
      await this.updateIndexes(result.mappings);

      console.log(`✅ ID 매핑 생성 완료: ${result.mappings.length}개 매핑`);

    } catch (error) {
      console.error('❌ ID 매핑 생성 실패:', error);
      result.warnings.push(`매핑 생성 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 🔍 ID 매핑 검색
   * 
   * 다양한 조건으로 ID 매핑을 검색합니다.
   */
  async findMapping(query: IdMappingQuery): Promise<IdMappingRelation[]> {
    const results: IdMappingRelation[] = [];

    try {
      // 원본 ID로 검색
      if (query.originalId) {
        const mappings = this.mappingTable.get(query.originalId) || [];
        results.push(...mappings);
      }

      // 매핑된 ID로 검색
      if (query.mappedId) {
        const mappings = this.reverseMappingTable.get(query.mappedId) || [];
        results.push(...mappings);
      }

      // 타입으로 필터링
      if (query.type) {
        return results.filter(m => m.type === query.type);
      }

      // 컨텍스트로 필터링
      if (query.context) {
        return results.filter(m => m.context === query.context);
      }

      // 부모 Bundle로 필터링
      if (query.parentBundleId) {
        return results.filter(m => m.parentBundleId === query.parentBundleId);
      }

      // 활성 상태 필터링
      if (!query.includeInactive) {
        return results.filter(m => m.isActive);
      }

    } catch (error) {
      console.error('❌ ID 매핑 검색 실패:', error);
    }

    return results;
  }

  /**
   * 🔄 ID 매핑 변환
   * 
   * 원본 ID를 매핑된 ID로 변환하거나 그 반대를 수행합니다.
   */
  async translateId(
    id: string,
    direction: 'original-to-mapped' | 'mapped-to-original',
    context?: string
  ): Promise<string | null> {
    
    try {
      if (direction === 'original-to-mapped') {
        const mappings = this.mappingTable.get(id) || [];
        const activeMapping = mappings.find(m => m.isActive && (!context || m.context === context));
        return activeMapping?.mappedId || null;
      } else {
        const mappings = this.reverseMappingTable.get(id) || [];
        const activeMapping = mappings.find(m => m.isActive && (!context || m.context === context));
        return activeMapping?.originalId || null;
      }
    } catch (error) {
      console.error('❌ ID 변환 실패:', error);
      return null;
    }
  }

  /**
   * 📦 Bundle Element ID 일괄 변환
   * 
   * Bundle Element들의 ID를 일괄적으로 변환합니다.
   */
  async translateBundleElementIds(
    elements: BundleElement[],
    targetBundleId: string
  ): Promise<{
    translatedElements: BundleElement[];
    translationMap: Map<string, string>;
    warnings: string[];
  }> {
    
    const result = {
      translatedElements: [] as BundleElement[],
      translationMap: new Map<string, string>(),
      warnings: [] as string[]
    };

    try {
      console.log(`📦 Bundle Element ID 일괄 변환: ${elements.length}개 요소`);

      for (const element of elements) {
        const translatedElement = { ...element };
        
        // 기본 ID 변환
        const newElementId = await this.translateId(element.id, 'original-to-mapped', 'nested');
        if (newElementId) {
          translatedElement.id = newElementId;
          result.translationMap.set(element.id, newElementId);
        }

        // 타입별 세부 ID 변환
        if (element.type === 'baseClip' && element.baseClip) {
          const newClipId = await this.translateId(element.baseClip.clipId, 'original-to-mapped', 'nested');
          if (newClipId) {
            translatedElement.baseClip = {
              ...element.baseClip,
              clipId: newClipId
            };
          }
        }

        if (element.type === 'templateGroup' && element.templateGroup) {
          const newGroupId = await this.translateId(element.templateGroup.groupId, 'original-to-mapped', 'nested');
          if (newGroupId) {
            translatedElement.templateGroup = {
              ...element.templateGroup,
              groupId: newGroupId
            };
          }
        }

        if (element.type === 'nestedBundle' && element.nestedBundle) {
          const newBundleId = await this.translateId(element.nestedBundle.bundleId, 'original-to-mapped', 'nested');
          if (newBundleId) {
            translatedElement.nestedBundle = {
              ...element.nestedBundle,
              bundleId: newBundleId
            };
          }
        }

        // 부모 ID 업데이트
        if (translatedElement.parentId) {
          const newParentId = await this.translateId(translatedElement.parentId, 'original-to-mapped', 'nested');
          if (newParentId) {
            translatedElement.parentId = newParentId;
          }
        }

        // 경로 업데이트
        translatedElement.path = this.updateElementPath(translatedElement.path, targetBundleId);

        result.translatedElements.push(translatedElement);
      }

      console.log(`✅ ID 변환 완료: ${result.translatedElements.length}개 요소 변환`);

    } catch (error) {
      console.error('❌ Bundle Element ID 변환 실패:', error);
      result.warnings.push(`ID 변환 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 🔄 ID 매핑 업데이트
   * 
   * 기존 ID 매핑을 업데이트하거나 새로운 매핑을 추가합니다.
   */
  async updateMapping(
    originalId: string,
    newMappedId: string,
    updateOptions: {
      parentBundleId?: string;
      context?: 'nested' | 'preserved' | 'inherited';
      deactivateOld?: boolean;
    } = {}
  ): Promise<IdMappingUpdateResult> {
    
    const result: IdMappingUpdateResult = {
      success: false,
      updatedMappings: 0,
      affectedBundles: [],
      affectedGroups: [],
      affectedClips: [],
      warnings: [],
      performance: {
        updateTime: 0,
        indexRebuildTime: 0
      }
    };

    const startTime = performance.now();

    try {
      console.log(`🔄 ID 매핑 업데이트: ${originalId} → ${newMappedId}`);

      // 기존 매핑 찾기
      const existingMappings = this.mappingTable.get(originalId) || [];
      
      if (updateOptions.deactivateOld) {
        // 기존 매핑 비활성화
        for (const mapping of existingMappings) {
          if (mapping.isActive) {
            mapping.isActive = false;
            result.updatedMappings++;
          }
        }
      }

      // 새로운 매핑 생성
      const newMapping: IdMappingRelation = {
        originalId,
        mappedId: newMappedId,
        type: this.inferTypeFromId(originalId),
        context: updateOptions.context || 'nested',
        parentBundleId: updateOptions.parentBundleId,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      await this.addMapping(newMapping);
      result.updatedMappings++;

      // 영향받은 요소들 추적
      this.trackAffectedElements(newMapping, result);

      result.success = true;

      console.log(`✅ ID 매핑 업데이트 완료: ${result.updatedMappings}개 매핑 업데이트`);

    } catch (error) {
      console.error('❌ ID 매핑 업데이트 실패:', error);
      result.warnings.push(`매핑 업데이트 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.performance.updateTime = performance.now() - startTime;
    return result;
  }

  /**
   * 🗑️ ID 매핑 삭제
   * 
   * 특정 ID 매핑을 삭제하거나 비활성화합니다.
   */
  async removeMapping(
    originalId: string,
    options: {
      mappedId?: string;
      parentBundleId?: string;
      permanent?: boolean; // true: 완전 삭제, false: 비활성화
    } = {}
  ): Promise<{
    success: boolean;
    removedMappings: number;
    affectedElements: string[];
  }> {
    
    const result = {
      success: false,
      removedMappings: 0,
      affectedElements: [] as string[]
    };

    try {
      console.log(`🗑️ ID 매핑 삭제: ${originalId}`);

      const mappings = this.mappingTable.get(originalId) || [];
      
      for (const mapping of mappings) {
        // 조건 체크
        if (options.mappedId && mapping.mappedId !== options.mappedId) continue;
        if (options.parentBundleId && mapping.parentBundleId !== options.parentBundleId) continue;

        if (options.permanent) {
          // 완전 삭제
          await this.deleteMapping(mapping);
        } else {
          // 비활성화
          mapping.isActive = false;
        }

        result.removedMappings++;
        result.affectedElements.push(mapping.mappedId);
      }

      result.success = true;

      console.log(`✅ ID 매핑 삭제 완료: ${result.removedMappings}개 매핑 삭제`);

    } catch (error) {
      console.error('❌ ID 매핑 삭제 실패:', error);
    }

    return result;
  }

  /**
   * 📊 ID 매핑 통계
   * 
   * 현재 ID 매핑 시스템의 통계를 반환합니다.
   */
  getIdMappingStatistics(): {
    totalMappings: number;
    activeMappings: number;
    byType: Record<string, number>;
    byContext: Record<string, number>;
    byParent: Record<string, number>;
    indexHealth: {
      lastRebuild: number;
      isConsistent: boolean;
      inconsistencies: string[];
    };
  } {
    
    const stats = {
      totalMappings: 0,
      activeMappings: 0,
      byType: {} as Record<string, number>,
      byContext: {} as Record<string, number>,
      byParent: {} as Record<string, number>,
      indexHealth: {
        lastRebuild: this.lastIndexRebuild,
        isConsistent: true,
        inconsistencies: [] as string[]
      }
    };

    try {
      // 모든 매핑 순회
      for (const mappings of this.mappingTable.values()) {
        for (const mapping of mappings) {
          stats.totalMappings++;
          
          if (mapping.isActive) {
            stats.activeMappings++;
          }

          // 타입별 카운트
          stats.byType[mapping.type] = (stats.byType[mapping.type] || 0) + 1;

          // 컨텍스트별 카운트
          stats.byContext[mapping.context] = (stats.byContext[mapping.context] || 0) + 1;

          // 부모별 카운트
          if (mapping.parentBundleId) {
            stats.byParent[mapping.parentBundleId] = (stats.byParent[mapping.parentBundleId] || 0) + 1;
          }
        }
      }

      // 인덱스 일관성 체크
      const inconsistencies = this.checkIndexConsistency();
      stats.indexHealth.isConsistent = inconsistencies.length === 0;
      stats.indexHealth.inconsistencies = inconsistencies;

    } catch (error) {
      console.error('❌ 통계 생성 실패:', error);
    }

    return stats;
  }

  // ========================================
  // 🛠️ 내부 헬퍼 메서드들
  // ========================================

  private generateMappedId(originalId: string, type: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    const typePrefix = type === 'baseClip' ? 'clip' : 
                      type === 'templateGroup' ? 'group' : 
                      type === 'bundle' ? 'bundle' : 'element';
    
    return `${typePrefix}_${timestamp}_${random}`;
  }

  private getIdType(elementType: string): 'bundle' | 'templateGroup' | 'baseClip' {
    switch (elementType) {
      case 'bundle': return 'bundle';
      case 'templateGroup': return 'templateGroup';
      case 'baseClip': return 'baseClip';
      default: return 'baseClip';
    }
  }

  private async addMapping(mapping: IdMappingRelation): Promise<void> {
    // 정방향 매핑 추가
    if (!this.mappingTable.has(mapping.originalId)) {
      this.mappingTable.set(mapping.originalId, []);
    }
    this.mappingTable.get(mapping.originalId)!.push(mapping);

    // 역방향 매핑 추가
    if (!this.reverseMappingTable.has(mapping.mappedId)) {
      this.reverseMappingTable.set(mapping.mappedId, []);
    }
    this.reverseMappingTable.get(mapping.mappedId)!.push(mapping);
  }

  private async deleteMapping(mapping: IdMappingRelation): Promise<void> {
    // 정방향 매핑에서 제거
    const forwardMappings = this.mappingTable.get(mapping.originalId) || [];
    const forwardIndex = forwardMappings.indexOf(mapping);
    if (forwardIndex > -1) {
      forwardMappings.splice(forwardIndex, 1);
    }

    // 역방향 매핑에서 제거
    const reverseMappings = this.reverseMappingTable.get(mapping.mappedId) || [];
    const reverseIndex = reverseMappings.indexOf(mapping);
    if (reverseIndex > -1) {
      reverseMappings.splice(reverseIndex, 1);
    }
  }

  private async updateIndexes(mappings: IdMappingRelation[]): Promise<void> {
    for (const mapping of mappings) {
      // 타입 인덱스 업데이트
      if (!this.typeIndex.has(mapping.type)) {
        this.typeIndex.set(mapping.type, new Set());
      }
      this.typeIndex.get(mapping.type)!.add(mapping.originalId);

      // 컨텍스트 인덱스 업데이트
      if (!this.contextIndex.has(mapping.context)) {
        this.contextIndex.set(mapping.context, new Set());
      }
      this.contextIndex.get(mapping.context)!.add(mapping.originalId);

      // 부모 인덱스 업데이트
      if (mapping.parentBundleId) {
        if (!this.parentIndex.has(mapping.parentBundleId)) {
          this.parentIndex.set(mapping.parentBundleId, new Set());
        }
        this.parentIndex.get(mapping.parentBundleId)!.add(mapping.originalId);
      }
    }
  }

  private updateElementPath(originalPath: string, targetBundleId: string): string {
    const pathParts = originalPath.split('.');
    return `${targetBundleId}.${pathParts[pathParts.length - 1]}`;
  }

  private inferTypeFromId(id: string): 'bundle' | 'templateGroup' | 'baseClip' {
    if (id.startsWith('bundle_')) return 'bundle';
    if (id.startsWith('group_') || id.startsWith('template_group_')) return 'templateGroup';
    if (id.startsWith('clip_') || id.startsWith('baseClip_')) return 'baseClip';
    return 'baseClip'; // 기본값
  }

  private trackAffectedElements(mapping: IdMappingRelation, result: IdMappingUpdateResult): void {
    switch (mapping.type) {
      case 'bundle':
        result.affectedBundles.push(mapping.mappedId);
        break;
      case 'templateGroup':
        result.affectedGroups.push(mapping.mappedId);
        break;
      case 'baseClip':
        result.affectedClips.push(mapping.mappedId);
        break;
    }

    if (mapping.parentBundleId && !result.affectedBundles.includes(mapping.parentBundleId)) {
      result.affectedBundles.push(mapping.parentBundleId);
    }
  }

  private checkIndexConsistency(): string[] {
    const inconsistencies: string[] = [];

    try {
      // 정방향-역방향 매핑 일치성 체크
      for (const [originalId, mappings] of this.mappingTable.entries()) {
        for (const mapping of mappings) {
          const reverseMappings = this.reverseMappingTable.get(mapping.mappedId) || [];
          if (!reverseMappings.includes(mapping)) {
            inconsistencies.push(`역방향 매핑 누락: ${originalId} → ${mapping.mappedId}`);
          }
        }
      }

      // 타입 인덱스 일치성 체크
      for (const [type, idSet] of this.typeIndex.entries()) {
        for (const id of idSet) {
          const mappings = this.mappingTable.get(id) || [];
          if (!mappings.some(m => m.type === type)) {
            inconsistencies.push(`타입 인덱스 불일치: ${id} (${type})`);
          }
        }
      }

    } catch (error) {
      inconsistencies.push(`일관성 체크 중 오류: ${error instanceof Error ? error.message : String(error)}`);
    }

    return inconsistencies;
  }

  private clearIndexes(): void {
    this.typeIndex.clear();
    this.contextIndex.clear();
    this.parentIndex.clear();
  }

  private rebuildIndexes(): void {
    const startTime = performance.now();
    
    this.clearIndexes();

    for (const mappings of this.mappingTable.values()) {
      for (const mapping of mappings) {
        // 타입 인덱스
        if (!this.typeIndex.has(mapping.type)) {
          this.typeIndex.set(mapping.type, new Set());
        }
        this.typeIndex.get(mapping.type)!.add(mapping.originalId);

        // 컨텍스트 인덱스
        if (!this.contextIndex.has(mapping.context)) {
          this.contextIndex.set(mapping.context, new Set());
        }
        this.contextIndex.get(mapping.context)!.add(mapping.originalId);

        // 부모 인덱스
        if (mapping.parentBundleId) {
          if (!this.parentIndex.has(mapping.parentBundleId)) {
            this.parentIndex.set(mapping.parentBundleId, new Set());
          }
          this.parentIndex.get(mapping.parentBundleId)!.add(mapping.originalId);
        }
      }
    }

    this.lastIndexRebuild = performance.now() - startTime;
    console.log(`🔄 인덱스 재구축 완료: ${this.lastIndexRebuild.toFixed(2)}ms`);
  }
}

// 전역 인스턴스 생성
let globalIdMappingManager: BundleIdMappingManager | null = null;

/**
 * Bundle ID 매핑 관리자 싱글톤 인스턴스 반환
 */
export function getBundleIdMappingManager(): BundleIdMappingManager {
  if (!globalIdMappingManager) {
    globalIdMappingManager = new BundleIdMappingManager();
  }
  return globalIdMappingManager;
}

/**
 * Bundle ID 매핑 관리자 초기화
 */
export function resetBundleIdMappingManager(): void {
  globalIdMappingManager = null;
}
