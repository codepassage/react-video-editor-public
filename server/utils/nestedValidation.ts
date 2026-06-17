// 서버용 중첩 구조 검증 유틸리티
import { 
  ResourceData, 
  ResourceItem, 
  Container,
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  ValidationStatistics,
  NestedStructureConfig,
  ErrorCode
} from '../types/autoGeneration';

// 기본 설정
const DEFAULT_CONFIG: NestedStructureConfig = {
  maxNestingDepth: 3,
  enableCircularReferenceCheck: true,
  enableDepthValidation: true,
  enableOrphanDetection: true,
  strictMode: false
};

/**
 * 서버용 중첩 구조 데이터 검증
 */
export class ServerNestedStructureValidator {
  private config: NestedStructureConfig;
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private statistics: ValidationStatistics = {
    totalItems: 0,
    totalContainers: 0,
    maxDepthFound: 0,
    circularReferences: 0,
    orphanedItems: 0
  };

  constructor(config: Partial<NestedStructureConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 리소스 데이터 검증
   */
  validate(resourceData: ResourceData): ValidationResult {
    this.reset();
    
    try {
      // 기본 구조 검증
      this.validateBasicStructure(resourceData);
      
      // 중첩 구조 검증
      this.validateNestedStructure(resourceData.items, [], 0);
      
      // 순환 참조 검증
      if (this.config.enableCircularReferenceCheck) {
        this.validateCircularReferences(resourceData.items);
      }
      
      // 고아 아이템 검증
      if (this.config.enableOrphanDetection) {
        this.validateOrphanedItems(resourceData.items);
      }

    } catch (error) {
      this.addError(
        'CONTAINER_VALIDATION_FAILED',
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'root'
      );
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      statistics: this.statistics
    };
  }

  /**
   * 기본 구조 검증
   */
  private validateBasicStructure(resourceData: ResourceData): void {
    if (!resourceData || typeof resourceData !== 'object') {
      this.addError(
        'RESOURCE_INVALID',
        'Resource data must be an object',
        'root'
      );
      return;
    }

    if (!Array.isArray(resourceData.items)) {
      this.addError(
        'RESOURCE_INVALID',
        'Resource data must contain an items array',
        'items'
      );
      return;
    }

    // 메타데이터 검증
    if (resourceData.metadata) {
      this.validateMetadata(resourceData.metadata);
    }
  }

  /**
   * 중첩 구조 검증 (재귀)
   */
  private validateNestedStructure(
    items: ResourceItem[], 
    path: string[] = [], 
    currentDepth: number = 0
  ): void {
    // 깊이 제한 검증
    if (this.config.enableDepthValidation && currentDepth > this.config.maxNestingDepth) {
      this.addError(
        'NESTING_DEPTH_EXCEEDED',
        `Nesting depth ${currentDepth} exceeds maximum allowed depth ${this.config.maxNestingDepth}`,
        path.join('.')
      );
      return;
    }

    // 통계 업데이트
    this.statistics.maxDepthFound = Math.max(this.statistics.maxDepthFound, currentDepth);
    this.statistics.totalItems += items.length;

    items.forEach((item, index) => {
      const itemPath = [...path, `items[${index}]`];
      
      // 기본 아이템 검증
      this.validateResourceItem(item, itemPath);
      
      // 중첩 컨테이너 검증
      if (item.isIterator && item.containers) {
        this.statistics.totalContainers += item.containers.length;
        
        item.containers.forEach((container, containerIndex) => {
          const containerPath = [...itemPath, `containers[${containerIndex}]`];
          
          // 컨테이너 검증
          this.validateContainer(container, containerPath, currentDepth);
          
          // 재귀적으로 컨테이너 내부 아이템 검증
          if (container.items) {
            this.validateNestedStructure(
              container.items, 
              containerPath, 
              currentDepth + 1
            );
          }
        });
      }
    });
  }

  /**
   * 개별 리소스 아이템 검증
   */
  private validateResourceItem(item: ResourceItem, path: string[]): void {
    const pathStr = path.join('.');

    // 필수 필드 검증
    if (!item.name || typeof item.name !== 'string') {
      this.addError(
        'RESOURCE_INVALID',
        'Resource item must have a valid name',
        pathStr
      );
    }

    // 이터레이터 아이템 검증
    if (item.isIterator) {
      if (!item.containers || !Array.isArray(item.containers)) {
        this.addError(
          'INVALID_NESTING_STRUCTURE',
          'Iterator items must have containers array',
          pathStr
        );
      }
    } else {
      // 일반 아이템은 데이터가 있어야 함
      if (!item.data) {
        this.addWarning(
          'MISSING_DATA',
          'Non-iterator item should have data',
          pathStr,
          'medium'
        );
      }
    }

    // v2 필드 검증
    if (item.nestingLevel !== undefined) {
      if (typeof item.nestingLevel !== 'number' || item.nestingLevel < 0) {
        this.addError(
          'INVALID_NESTING_STRUCTURE',
          'Nesting level must be a non-negative number',
          pathStr
        );
      }
    }

    // 템플릿 그룹 ID 검증
    if (item.templateGroupId && typeof item.templateGroupId !== 'string') {
      this.addError(
        'TEMPLATE_GROUP_NOT_FOUND',
        'Template group ID must be a string',
        pathStr
      );
    }
  }

  /**
   * 컨테이너 검증
   */
  private validateContainer(container: Container, path: string[], depth: number): void {
    const pathStr = path.join('.');

    if (!container || typeof container !== 'object') {
      this.addError(
        'CONTAINER_VALIDATION_FAILED',
        'Container must be an object',
        pathStr
      );
      return;
    }

    if (!Array.isArray(container.items)) {
      this.addError(
        'CONTAINER_VALIDATION_FAILED',
        'Container must have items array',
        pathStr
      );
      return;
    }

    // v2 필드 검증
    if (container.nestingLevel !== undefined) {
      if (container.nestingLevel !== depth) {
        this.addWarning(
          'INCONSISTENT_NESTING_LEVEL',
          `Container nesting level (${container.nestingLevel}) doesn't match actual depth (${depth})`,
          pathStr,
          'low'
        );
      }
    }

    // 빈 컨테이너 경고
    if (container.items.length === 0) {
      this.addWarning(
        'EMPTY_CONTAINER',
        'Container is empty',
        pathStr,
        'low'
      );
    }
  }

  /**
   * 순환 참조 검증
   */
  private validateCircularReferences(items: ResourceItem[]): void {
    const checkCircular = (item: ResourceItem, path: string[], visitPath: string[] = []) => {
      if (visitPath.includes(item.name)) {
        this.statistics.circularReferences++;
        this.addError(
          'CIRCULAR_REFERENCE_DETECTED',
          `Circular reference detected in path: ${[...visitPath, item.name].join(' -> ')}`,
          path.join('.')
        );
        return;
      }

      const newVisitPath = [...visitPath, item.name];
      
      if (item.isIterator && item.containers) {
        item.containers.forEach((container, containerIndex) => {
          if (container.items) {
            container.items.forEach((childItem, itemIndex) => {
              const childPath = [...path, `containers[${containerIndex}]`, `items[${itemIndex}]`];
              checkCircular(childItem, childPath, newVisitPath);
            });
          }
        });
      }
    };

    items.forEach((item, index) => {
      checkCircular(item, [`items[${index}]`]);
    });
  }

  /**
   * 고아 아이템 검증 (참조되지 않는 아이템)
   */
  private validateOrphanedItems(items: ResourceItem[]): void {
    const allNames = new Set<string>();
    const referencedNames = new Set<string>();

    // 모든 이름 수집
    const collectNames = (items: ResourceItem[]) => {
      items.forEach(item => {
        allNames.add(item.name);
        
        if (item.subordinateItems) {
          item.subordinateItems.forEach(name => referencedNames.add(name));
        }
        
        if (item.isIterator && item.containers) {
          item.containers.forEach(container => {
            if (container.items) {
              collectNames(container.items);
            }
          });
        }
      });
    };

    collectNames(items);

    // 고아 아이템 검출
    allNames.forEach(name => {
      if (!referencedNames.has(name)) {
        // 최상위 레벨 아이템은 고아가 아님
        const isTopLevel = items.some(item => item.name === name);
        if (!isTopLevel) {
          this.statistics.orphanedItems++;
          this.addWarning(
            'ORPHANED_ITEM',
            `Item "${name}" is not referenced by any other item`,
            `name:${name}`,
            'low'
          );
        }
      }
    });
  }

  /**
   * 메타데이터 검증
   */
  private validateMetadata(metadata: any): void {
    if (metadata.maxNestingDepth !== undefined) {
      if (typeof metadata.maxNestingDepth !== 'number' || metadata.maxNestingDepth < 0) {
        this.addWarning(
          'INVALID_METADATA',
          'maxNestingDepth should be a non-negative number',
          'metadata.maxNestingDepth',
          'medium'
        );
      }
    }
  }

  /**
   * 오류 추가
   */
  private addError(code: string, message: string, path: string, details?: any): void {
    this.errors.push({
      code,
      message,
      path,
      details
    });
  }

  /**
   * 경고 추가
   */
  private addWarning(
    code: string, 
    message: string, 
    path: string, 
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    this.warnings.push({
      code,
      message,
      path,
      severity
    });
  }

  /**
   * 검증 상태 초기화
   */
  private reset(): void {
    this.errors = [];
    this.warnings = [];
    this.statistics = {
      totalItems: 0,
      totalContainers: 0,
      maxDepthFound: 0,
      circularReferences: 0,
      orphanedItems: 0
    };
  }
}

/**
 * 편의 함수: 리소스 데이터 검증
 */
export function validateNestedStructure(
  resourceData: ResourceData, 
  config?: Partial<NestedStructureConfig>
): ValidationResult {
  const validator = new ServerNestedStructureValidator(config);
  return validator.validate(resourceData);
}

/**
 * 편의 함수: 빠른 검증 (오류만 확인)
 */
export function isValidNestedStructure(
  resourceData: ResourceData, 
  config?: Partial<NestedStructureConfig>
): boolean {
  const result = validateNestedStructure(resourceData, config);
  return result.isValid;
}

/**
 * 편의 함수: 중첩 깊이 계산
 */
export function calculateMaxDepth(items: ResourceItem[]): number {
  let maxDepth = 0;
  
  const traverse = (items: ResourceItem[], currentDepth: number = 0) => {
    maxDepth = Math.max(maxDepth, currentDepth);
    
    items.forEach(item => {
      if (item.isIterator && item.containers) {
        item.containers.forEach(container => {
          if (container.items) {
            traverse(container.items, currentDepth + 1);
          }
        });
      }
    });
  };
  
  traverse(items);
  return maxDepth;
}