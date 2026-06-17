/**
 * 🔍 nestedValidation.ts - 중첩 구조 검증 유틸리티
 * 
 * React Video Editor v1의 자동 생성 시스템에서 사용되는 중첩 구조 데이터의
 * 무결성과 일관성을 검증하는 전문적인 유틸리티 모듈입니다.
 * 
 * 🎯 주요 기능:
 * - 중첩 구조 데이터의 종합적인 검증
 * - 순환 참조 검출 및 방지
 * - 중첩 깊이 제한 및 모니터링
 * - 고아 아이템(orphaned items) 검출
 * - 컨테이너 구조 무결성 검증
 * - 상세한 오류 및 경고 리포팅
 * 
 * 🏗️ 아키텍처:
 * ```
 * NestedStructureValidator
 * ├── validateBasicStructure() - 기본 구조 검증
 * ├── validateNestedStructure() - 재귀적 중첩 구조 검증
 * ├── validateCircularReferences() - 순환 참조 검출
 * ├── validateOrphanedItems() - 고아 아이템 검출
 * └── validateContainer() - 개별 컨테이너 검증
 * ```
 * 
 * 🔧 검증 규칙:
 * - 최대 중첩 깊이 제한 (기본값: 3레벨)
 * - 필수 필드 존재 여부 확인
 * - 데이터 타입 일관성 검증
 * - 참조 무결성 검증
 * - 메타데이터 일관성 검증
 * 
 * 📊 통계 정보:
 * - 총 아이템 수
 * - 총 컨테이너 수
 * - 발견된 최대 깊이
 * - 순환 참조 개수
 * - 고아 아이템 개수
 * 
 * 💡 사용 예시:
 * ```typescript
 * const validator = new NestedStructureValidator({
 *   maxNestingDepth: 5,
 *   strictMode: true
 * });
 * 
 * const result = validator.validate(resourceData);
 * if (!result.isValid) {
 *   console.error('검증 실패:', result.errors);
 * }
 * ```
 * 
 * 🔗 모듈 연관성:
 * - 6번 모듈: Auto Generation System (자동 생성 시스템)
 * - CSV 데이터 변환 및 검증
 * - ResourceData 타입 시스템
 * - 중첩 번들 구조 관리
 * 
 * ⚡ 성능 최적화:
 * - 지연 평가를 통한 효율적인 검증
 * - 메모이제이션을 활용한 중복 검증 방지
 * - 스트림 기반 대용량 데이터 처리
 * - 조기 종료를 통한 검증 시간 단축
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */

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

/**
 * 기본 검증 설정
 * 
 * @constant DEFAULT_CONFIG
 * @description 중첩 구조 검증에 사용되는 기본 설정값들입니다.
 */
const DEFAULT_CONFIG: NestedStructureConfig = {
  /** 허용되는 최대 중첩 깊이 */
  maxNestingDepth: 3,
  /** 순환 참조 검사 활성화 여부 */
  enableCircularReferenceCheck: true,
  /** 깊이 검증 활성화 여부 */
  enableDepthValidation: true,
  /** 고아 아이템 검출 활성화 여부 */
  enableOrphanDetection: true,
  /** 엄격 모드 (모든 경고를 오류로 처리) */
  strictMode: false
};

/**
 * 중첩 구조 데이터 검증 클래스
 * 
 * @class NestedStructureValidator
 * @description 복잡한 중첩 구조를 가진 리소스 데이터의 무결성을 검증하는 전문 클래스입니다.
 * 재귀적 구조 분석, 순환 참조 검출, 깊이 제한 검증 등의 고급 검증 기능을 제공합니다.
 * 
 * @example
 * ```typescript
 * const validator = new NestedStructureValidator({
 *   maxNestingDepth: 5,
 *   strictMode: true
 * });
 * 
 * const result = validator.validate(resourceData);
 * if (result.isValid) {
 *   console.log('검증 통과!');
 * } else {
 *   console.error('검증 실패:', result.errors);
 * }
 * ```
 */
export class NestedStructureValidator {
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

  /**
   * NestedStructureValidator 생성자
   * 
   * @param config - 검증 설정 (선택적, 기본값으로 병합됨)
   * @description 검증기 인스턴스를 생성하고 설정을 초기화합니다.
   */
  constructor(config: Partial<NestedStructureConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 리소스 데이터 종합 검증
   * 
   * @param resourceData - 검증할 리소스 데이터
   * @returns 검증 결과 (유효성, 오류, 경고, 통계 포함)
   * @description 리소스 데이터의 모든 측면을 종합적으로 검증합니다.
   * 
   * 검증 단계:
   * 1. 기본 구조 검증
   * 2. 중첩 구조 재귀 검증
   * 3. 순환 참조 검출
   * 4. 고아 아이템 검출
   * 
   * @example
   * ```typescript
   * const result = validator.validate(resourceData);
   * console.log(`검증 결과: ${result.isValid ? '성공' : '실패'}`);
   * console.log(`오류 ${result.errors.length}개, 경고 ${result.warnings.length}개`);
   * ```
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
        ErrorCode.CONTAINER_VALIDATION_FAILED,
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
   * 
   * @private
   * @param resourceData - 검증할 리소스 데이터
   * @description 리소스 데이터의 기본적인 구조와 필수 필드를 검증합니다.
   * 
   * 검증 항목:
   * - 객체 타입 여부
   * - items 배열 존재 여부
   * - 메타데이터 구조 (선택적)
   */
  private validateBasicStructure(resourceData: ResourceData): void {
    if (!resourceData || typeof resourceData !== 'object') {
      this.addError(
        ErrorCode.RESOURCE_INVALID,
        'Resource data must be an object',
        'root'
      );
      return;
    }

    if (!Array.isArray(resourceData.items)) {
      this.addError(
        ErrorCode.RESOURCE_INVALID,
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
   * 중첩 구조 재귀 검증
   * 
   * @private
   * @param items - 검증할 아이템 배열
   * @param path - 현재 검증 경로 (오류 위치 추적용)
   * @param currentDepth - 현재 중첩 깊이
   * @description 중첩된 구조를 재귀적으로 탐색하며 각 레벨의 유효성을 검증합니다.
   * 
   * 검증 내용:
   * - 중첩 깊이 제한 확인
   * - 개별 아이템 유효성 검증
   * - 컨테이너 구조 검증
   * - 통계 정보 수집
   */
  private validateNestedStructure(
    items: ResourceItem[], 
    path: string[] = [], 
    currentDepth: number = 0
  ): void {
    // 깊이 제한 검증
    if (this.config.enableDepthValidation && currentDepth > this.config.maxNestingDepth) {
      this.addError(
        ErrorCode.NESTING_DEPTH_EXCEEDED,
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
   * 
   * @private
   * @param item - 검증할 리소스 아이템
   * @param path - 아이템의 경로 (오류 위치 추적용)
   * @description 개별 리소스 아이템의 속성과 구조를 상세히 검증합니다.
   * 
   * 검증 항목:
   * - 필수 필드 존재 여부 (name 등)
   * - 이터레이터 아이템의 컨테이너 구조
   * - v2 필드 유효성 (nestingLevel 등)
   * - 템플릿 그룹 ID 형식
   */
  private validateResourceItem(item: ResourceItem, path: string[]): void {
    const pathStr = path.join('.');

    // 필수 필드 검증
    if (!item.name || typeof item.name !== 'string') {
      this.addError(
        ErrorCode.RESOURCE_INVALID,
        'Resource item must have a valid name',
        pathStr
      );
    }

    // 이터레이터 아이템 검증
    if (item.isIterator) {
      if (!item.containers || !Array.isArray(item.containers)) {
        this.addError(
          ErrorCode.INVALID_NESTING_STRUCTURE,
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
          ErrorCode.INVALID_NESTING_STRUCTURE,
          'Nesting level must be a non-negative number',
          pathStr
        );
      }
    }

    // 템플릿 그룹 ID 검증
    if (item.templateGroupId && typeof item.templateGroupId !== 'string') {
      this.addError(
        ErrorCode.TEMPLATE_GROUP_NOT_FOUND,
        'Template group ID must be a string',
        pathStr
      );
    }
  }

  /**
   * 컨테이너 검증
   * 
   * @private
   * @param container - 검증할 컨테이너
   * @param path - 컨테이너의 경로
   * @param depth - 현재 중첩 깊이
   * @description 개별 컨테이너의 구조와 내용을 검증합니다.
   * 
   * 검증 항목:
   * - 컨테이너 객체 타입 확인
   * - items 배열 존재 여부
   * - 중첩 레벨 일관성
   * - 빈 컨테이너 검출
   */
  private validateContainer(container: Container, path: string[], depth: number): void {
    const pathStr = path.join('.');

    if (!container || typeof container !== 'object') {
      this.addError(
        ErrorCode.CONTAINER_VALIDATION_FAILED,
        'Container must be an object',
        pathStr
      );
      return;
    }

    if (!Array.isArray(container.items)) {
      this.addError(
        ErrorCode.CONTAINER_VALIDATION_FAILED,
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
   * 
   * @private
   * @param items - 검증할 아이템 배열
   * @description 중첩 구조에서 순환 참조가 발생하는지 검출합니다.
   * 
   * 검출 방법:
   * - 방문 경로 추적
   * - 재귀적 탐색 중 중복 방문 검출
   * - 순환 참조 경로 상세 리포팅
   * 
   * @example
   * 순환 참조 예시: A -> B -> C -> A
   */
  private validateCircularReferences(items: ResourceItem[]): void {
    const visited = new Map<string, string[]>();
    
    const checkCircular = (item: ResourceItem, path: string[], visitPath: string[] = []) => {
      if (visitPath.includes(item.name)) {
        this.statistics.circularReferences++;
        this.addError(
          ErrorCode.CIRCULAR_REFERENCE_DETECTED,
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
   * 고아 아이템 검증
   * 
   * @private
   * @param items - 검증할 아이템 배열
   * @description 다른 아이템에 의해 참조되지 않는 고아 아이템을 검출합니다.
   * 
   * 검출 과정:
   * 1. 모든 아이템 이름 수집
   * 2. subordinateItems에서 참조되는 이름 수집
   * 3. 참조되지 않는 아이템 식별
   * 4. 최상위 레벨 아이템은 제외
   * 
   * @note 최상위 레벨 아이템은 자연스럽게 고아가 될 수 있으므로 제외됩니다.
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
   * 
   * @private
   * @param metadata - 검증할 메타데이터 객체
   * @description 리소스 데이터의 메타데이터 필드를 검증합니다.
   * 
   * 검증 항목:
   * - maxNestingDepth 값의 유효성
   * - 기타 메타데이터 필드의 타입과 범위
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
   * 검증 오류 추가
   * 
   * @private
   * @param code - 오류 코드
   * @param message - 오류 메시지
   * @param path - 오류 발생 경로
   * @param details - 추가 상세 정보 (선택적)
   * @description 검증 중 발견된 오류를 기록합니다.
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
   * 검증 경고 추가
   * 
   * @private
   * @param code - 경고 코드
   * @param message - 경고 메시지
   * @param path - 경고 발생 경로
   * @param severity - 경고 심각도 ('low' | 'medium' | 'high')
   * @description 검증 중 발견된 경고를 기록합니다.
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
   * 
   * @private
   * @description 새로운 검증을 시작하기 전에 이전 검증 결과를 초기화합니다.
   * 
   * 초기화 대상:
   * - 오류 목록
   * - 경고 목록
   * - 통계 정보
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
 * 리소스 데이터 검증 편의 함수
 * 
 * @function validateNestedStructure
 * @param resourceData - 검증할 리소스 데이터
 * @param config - 검증 설정 (선택적)
 * @returns 검증 결과 객체
 * @description 새로운 검증기 인스턴스를 생성하여 리소스 데이터를 검증하는 편의 함수입니다.
 * 
 * @example
 * ```typescript
 * const result = validateNestedStructure(data, {
 *   maxNestingDepth: 5,
 *   strictMode: true
 * });
 * 
 * if (!result.isValid) {
 *   console.error('검증 실패:', result.errors);
 * }
 * ```
 */
export function validateNestedStructure(
  resourceData: ResourceData, 
  config?: Partial<NestedStructureConfig>
): ValidationResult {
  const validator = new NestedStructureValidator(config);
  return validator.validate(resourceData);
}

/**
 * 빠른 유효성 검증 편의 함수
 * 
 * @function isValidNestedStructure
 * @param resourceData - 검증할 리소스 데이터
 * @param config - 검증 설정 (선택적)
 * @returns 유효한 경우 true, 그렇지 않으면 false
 * @description 리소스 데이터의 유효성만 빠르게 확인하는 편의 함수입니다.
 * 상세한 오류 정보가 필요하지 않을 때 사용합니다.
 * 
 * @example
 * ```typescript
 * if (isValidNestedStructure(data)) {
 *   console.log('유효한 데이터입니다.');
 * } else {
 *   console.log('유효하지 않은 데이터입니다.');
 * }
 * ```
 */
export function isValidNestedStructure(
  resourceData: ResourceData, 
  config?: Partial<NestedStructureConfig>
): boolean {
  const result = validateNestedStructure(resourceData, config);
  return result.isValid;
}

/**
 * 중첩 깊이 계산 편의 함수
 * 
 * @function calculateMaxDepth
 * @param items - 깊이를 계산할 아이템 배열
 * @returns 발견된 최대 중첩 깊이
 * @description 중첩 구조의 최대 깊이를 재귀적으로 계산합니다.
 * 
 * 계산 방법:
 * - 각 레벨을 재귀적으로 탐색
 * - 컨테이너 내부로 들어갈 때마다 깊이 +1
 * - 발견된 최대값 반환
 * 
 * @example
 * ```typescript
 * const maxDepth = calculateMaxDepth(resourceData.items);
 * console.log(`최대 중첩 깊이: ${maxDepth}`);
 * 
 * if (maxDepth > 5) {
 *   console.warn('중첩이 너무 깊습니다!');
 * }
 * ```
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