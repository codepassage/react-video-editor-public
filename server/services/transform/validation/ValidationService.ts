import { NestedStructureConfig } from '../../../types/autoGeneration';

export class ValidationService {
  private config: NestedStructureConfig;

  constructor(config: NestedStructureConfig) {
    this.config = config;
  }

  /**
   * 중첩 깊이 계산
   */
  calculateMaxDepth(items: any[]): number {
    if (!items || items.length === 0) return 0;

    let maxDepth = 0;

    const traverse = (items: any[], currentDepth: number = 0) => {
      for (const item of items) {
        maxDepth = Math.max(maxDepth, currentDepth);

        if (item.containers && Array.isArray(item.containers)) {
          for (const container of item.containers) {
            if (container.items && Array.isArray(container.items)) {
              traverse(container.items, currentDepth + 1);
            }
          }
        }
      }
    };

    traverse(items);
    return maxDepth;
  }

  /**
   * 중첩 깊이 검증
   */
  validateNestingDepth(items: any[]): void {
    if (!this.config.enableDepthValidation) return;

    const maxDepth = this.calculateMaxDepth(items);
    if (maxDepth > this.config.maxNestingDepth) {
      const errorMessage = `최대 중첩 깊이(${this.config.maxNestingDepth}) 초과: ${maxDepth}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`✅ 중첩 깊이 검증 통과: ${maxDepth}/${this.config.maxNestingDepth}`);
  }

  /**
   * 순환 참조 검증
   */
  validateCircularReferences(items: any[]): void {
    if (!this.config.enableCircularReferenceCheck) return;

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCircular = (item: any, path: string[] = []) => {
      if (!item || !item.name) return;

      const currentPath = [...path, item.name];
      
      if (recursionStack.has(item.name)) {
        const errorMessage = `순환 참조 발견: ${currentPath.join(' -> ')}`;
        console.error(`❌ ${errorMessage}`);
        throw new Error(errorMessage);
      }

      if (visited.has(item.name)) return;

      visited.add(item.name);
      recursionStack.add(item.name);

      // 컨테이너 내부 아이템들 검사
      if (item.containers && Array.isArray(item.containers)) {
        for (const container of item.containers) {
          if (container.items && Array.isArray(container.items)) {
            for (const nestedItem of container.items) {
              checkCircular(nestedItem, currentPath);
            }
          }
        }
      }

      recursionStack.delete(item.name);
    };

    for (const item of items) {
      checkCircular(item);
    }

    console.log(`✅ 순환 참조 검증 통과: ${items.length}개 아이템 검사`);
  }

  /**
   * 고아 아이템 검증
   */
  validateOrphanItems(items: any[]): void {
    if (!this.config.enableOrphanDetection) return;

    const allNames = new Set<string>();
    const referencedNames = new Set<string>();

    // 모든 아이템 이름 수집
    const collectNames = (items: any[]) => {
      for (const item of items) {
        if (item.name) {
          allNames.add(item.name);
        }

        if (item.containers && Array.isArray(item.containers)) {
          for (const container of item.containers) {
            if (container.items && Array.isArray(container.items)) {
              collectNames(container.items);
            }
          }
        }
      }
    };

    // 참조된 아이템 이름 수집
    const collectReferences = (items: any[]) => {
      for (const item of items) {
        if (item.subordinateItems && Array.isArray(item.subordinateItems)) {
          for (const ref of item.subordinateItems) {
            referencedNames.add(ref);
          }
        }

        if (item.containers && Array.isArray(item.containers)) {
          for (const container of item.containers) {
            if (container.items && Array.isArray(container.items)) {
              collectReferences(container.items);
            }
          }
        }
      }
    };

    collectNames(items);
    collectReferences(items);

    // 참조되지 않은 아이템 찾기
    const orphanItems = Array.from(allNames).filter(name => !referencedNames.has(name));
    
    if (orphanItems.length > 0) {
      const warningMessage = `고아 아이템 발견: ${orphanItems.join(', ')}`;
      console.warn(`⚠️ ${warningMessage}`);
      
      if (this.config.strictMode) {
        throw new Error(warningMessage);
      }
    } else {
      console.log(`✅ 고아 아이템 검증 통과: 모든 아이템이 참조됨`);
    }
  }

  /**
   * 템플릿 구조 검증
   */
  validateTemplateStructure(template: any): void {
    if (!template) {
      throw new Error('템플릿이 null 또는 undefined입니다.');
    }

    if (!template.tracks || !Array.isArray(template.tracks)) {
      throw new Error('템플릿에 tracks 배열이 없습니다.');
    }

    if (!template.projectSettings) {
      throw new Error('템플릿에 projectSettings가 없습니다.');
    }

    console.log(`✅ 템플릿 구조 검증 통과: ${template.tracks.length}개 트랙`);
  }

  /**
   * 리소스 데이터 검증
   */
  validateResourceData(resourceData: any): void {
    if (!resourceData) {
      throw new Error('리소스 데이터가 null 또는 undefined입니다.');
    }

    if (!resourceData.items || !Array.isArray(resourceData.items)) {
      throw new Error('리소스 데이터에 items 배열이 없습니다.');
    }

    console.log(`✅ 리소스 데이터 검증 통과: ${resourceData.items.length}개 아이템`);
  }

  /**
   * 전체 검증 실행
   */
  validateAll(template: any, resourceData: any): void {
    console.log('🔍 전체 검증 시작...');
    
    this.validateTemplateStructure(template);
    this.validateResourceData(resourceData);
    this.validateNestingDepth(resourceData.items);
    this.validateCircularReferences(resourceData.items);
    this.validateOrphanItems(resourceData.items);
    
    console.log('✅ 전체 검증 완료');
  }
}