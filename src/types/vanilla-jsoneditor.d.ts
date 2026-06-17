/**
 * 🍦 vanilla-jsoneditor.d.ts - Vanilla JSONEditor 라이브러리 타입 정의
 * 
 * React Video Editor v1에서 사용되는 Vanilla JSONEditor 라이브러리의
 * TypeScript 타입 정의를 제공하는 선언 파일입니다.
 * 
 * 🚀 Vanilla JSONEditor vs JSONEditor:
 * - 더 현대적이고 가벼운 JSON 에디터
 * - 프레임워크에 의존하지 않는 순수 JavaScript
 * - 향상된 성능과 사용자 경험
 * - React, Vue, Angular 등 모든 프레임워크에서 사용 가능
 * 
 * 🎯 주요 용도:
 * - 고급 프로젝트 설정 편집기
 * - 실시간 JSON 데이터 시각화
 * - 스키마 기반 데이터 검증
 * - 대용량 JSON 데이터 처리
 * - 개발자 도구 및 디버깅 인터페이스
 * 
 * 📊 지원 모드:
 * - Tree 모드: 계층적 트리 구조로 JSON 표시 및 편집
 * - Text 모드: 구문 강조된 텍스트 에디터
 * - Table 모드: 배열 데이터를 테이블 형태로 표시
 * 
 * 🔧 고급 기능:
 * - 실시간 검증 및 오류 표시
 * - JSON Patch 연산 지원
 * - 쿼리 언어 지원 (JMESPath, JSONPath 등)
 * - 자동 수정 제안 및 적용
 * - 대용량 데이터 가상화
 * - 접근성 (WCAG 준수)
 * 
 * 🔗 연관 모듈:
 * - 고급 설정 편집기: 복잡한 프로젝트 설정
 * - 데이터 분석 도구: JSON 기반 분석 결과 표시
 * - API 응답 뷰어: 서버 응답 데이터 검사
 * - 개발자 도구: 실시간 상태 모니터링
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 2.0
 */
declare module 'vanilla-jsoneditor' {
  /**
   * JSON 에디터의 콘텐츠 데이터 구조
   * 
   * @interface Content
   * @description JSON과 텍스트 두 가지 형태로 데이터를 표현할 수 있는 콘텐츠 객체입니다.
   * 에디터는 내부적으로 이 두 형태를 동기화하여 관리합니다.
   */
  export interface Content {
    /** JSON 객체 형태의 데이터 (파싱된 형태) */
    json?: any;
    
    /** JSON 문자열 형태의 데이터 (원시 텍스트) */
    text?: string;
  }

  /**
   * 콘텐츠 변경 시 상태 정보
   * 
   * @interface OnChangeStatus
   * @description 콘텐츠가 변경될 때 함께 전달되는 메타데이터와 상태 정보입니다.
   */
  export interface OnChangeStatus {
    /** 콘텐츠 파싱 및 검증 오류 정보 */
    contentErrors?: any;
    
    /** JSON Patch 연산 결과 정보 */
    patchResult?: any;
  }

  /**
   * 콘텐츠 변경 이벤트 핸들러 타입
   * 
   * @callback OnChange
   * @param content - 변경된 새로운 콘텐츠
   * @param previousContent - 이전 콘텐츠
   * @param status - 변경 상태 및 메타데이터
   * 
   * @description
   * 에디터의 콘텐츠가 변경될 때마다 호출되는 콜백 함수의 타입입니다.
   * 변경 전후의 콘텐츠와 함께 오류 정보 등을 제공합니다.
   */
  export type OnChange = (content: Content, previousContent: Content, status: OnChangeStatus) => void;

  /**
   * Vanilla JSONEditor 초기화 옵션
   * 
   * @interface JSONEditorOptions
   * @description Vanilla JSONEditor 인스턴스를 생성할 때 사용되는 설정 객체입니다.
   * target 요소와 props 객체를 통해 에디터의 모든 설정을 관리합니다.
   */
  export interface JSONEditorOptions {
    /** 에디터를 렌더링할 HTML 요소 */
    target: HTMLElement;
    
    /** 에디터의 속성 및 설정 */
    props: {
      /** 초기 콘텐츠 데이터 */
      content?: Content;
      
      /** 에디터 표시 모드 ('tree', 'text', 'table' 중 선택) */
      mode?: 'tree' | 'text' | 'table';
      
      /** 읽기 전용 모드 활성화 여부 */
      readOnly?: boolean;
      
      /** JSON 들여쓰기 공백 수 (기본값: 2) */
      indentation?: number;
      
      /** 탭 크기 설정 (기본값: 4) */
      tabSize?: number;
      
      /** 콘텐츠 변경 시 호출되는 콜백 함수 */
      onChange?: OnChange;
      
      /** 에러 발생 시 호출되는 콜백 함수 */
      onError?: (error: Error) => void;
      
      /** 에디터가 포커스를 받을 때 호출되는 콜백 함수 */
      onFocus?: () => void;
      
      /** 에디터가 포커스를 잃을 때 호출되는 콜백 함수 */
      onBlur?: () => void;
      
      /** 사용자 정의 검증 함수 */
      validator?: (json: any) => any[];
      
      /** JSON Schema 객체 (데이터 검증용) */
      schema?: object;
      
      /** 스키마 참조 객체들 */
      schemaRefs?: object;
      
      /** 지원하는 쿼리 언어들의 배열 */
      queryLanguages?: any[];
      
      /** 기본 쿼리 언어 ID */
      queryLanguageId?: string;
      
      /** 기타 확장 속성들 */
      [key: string]: any;
    };
  }

  /**
   * Vanilla JSONEditor 인스턴스 인터페이스
   * 
   * @interface JSONEditor
   * @description Vanilla JSONEditor의 메인 API를 정의하는 인터페이스입니다.
   * 생성된 에디터 인스턴스를 통해 콘텐츠 조작, 검증, 변형 등의 작업을 수행할 수 있습니다.
   */
  export interface JSONEditor {
    /**
     * 에디터 옵션 업데이트
     * @param options - 업데이트할 옵션들 (content 및 기타 속성)
     * @description 기존 에디터의 설정이나 콘텐츠를 동적으로 업데이트합니다.
     */
    update(options: { content?: Content; [key: string]: any }): void;
    
    /**
     * 에디터 속성 업데이트
     * @param props - 업데이트할 속성들
     * @description 에디터의 props를 동적으로 변경합니다.
     */
    updateProps(props: { [key: string]: any }): void;
    
    /**
     * 에디터에 포커스 설정
     * @description 에디터를 활성화하고 키보드 포커스를 설정합니다.
     */
    focus(): void;
    
    /**
     * 에디터 인스턴스 정리
     * @description 에디터를 제거하고 관련 이벤트 리스너와 메모리를 정리합니다.
     */
    destroy(): void;
    
    /**
     * 현재 콘텐츠 가져오기
     * @returns 현재 에디터의 콘텐츠
     * @description 에디터에서 편집 중인 JSON 데이터를 반환합니다.
     */
    get(): Content;
    
    /**
     * 콘텐츠 설정
     * @param content - 설정할 콘텐츠
     * @description 에디터에 새로운 콘텐츠를 로드합니다.
     */
    set(content: Content): void;
    
    /**
     * JSON Patch 연산 적용
     * @param operations - 적용할 패치 연산들의 배열
     * @description RFC 6902 JSON Patch 형식의 연산을 현재 콘텐츠에 적용합니다.
     */
    patch(operations: any[]): void;
    
    /**
     * 노드 확장/축소 제어 (tree 모드)
     * @param callback - 각 경로별 확장 여부를 결정하는 함수 (선택적)
     * @description tree 모드에서 JSON 노드들의 확장 상태를 제어합니다.
     */
    expand(callback?: (path: string[]) => boolean): void;
    
    /**
     * 데이터 변형 작업 수행
     * @param options - 변형 옵션
     * @description 복잡한 데이터 변형, 정렬, 필터링 등의 작업을 수행합니다.
     */
    transform(options: any): void;
    
    /**
     * 현재 콘텐츠 검증
     * @returns 검증 오류 배열
     * @description 설정된 스키마나 검증 함수에 대해 현재 데이터를 검증합니다.
     */
    validate(): any[];
    
    /**
     * 자동 수정 제안 적용
     * @returns 수정된 콘텐츠
     * @description 검증 오류에 대한 자동 수정 제안을 적용하고 결과를 반환합니다.
     */
    acceptAutoRepair(): Content;
    
    /**
     * 특정 경로로 스크롤
     * @param path - 스크롤할 JSON 경로 배열
     * @description tree 모드에서 지정된 JSON 경로의 노드로 스크롤합니다.
     */
    scrollTo(path: string[]): void;
    
    /**
     * 경로에 해당하는 DOM 요소 찾기
     * @param path - 찾을 JSON 경로 배열
     * @returns 해당하는 DOM 요소 또는 null
     * @description 지정된 JSON 경로에 해당하는 DOM 요소를 반환합니다.
     */
    findElement(path: string[]): Element | null;
  }

  /**
   * Vanilla JSONEditor 인스턴스 생성 함수
   * 
   * @function createJSONEditor
   * @param options - 에디터 초기화 옵션
   * @returns 생성된 JSONEditor 인스턴스
   * 
   * @description
   * 주어진 옵션을 사용하여 새로운 Vanilla JSONEditor 인스턴스를 생성합니다.
   * 이 함수는 에디터의 팩토리 함수 역할을 합니다.
   * 
   * 💡 사용 예시:
   * ```typescript
   * const editor = createJSONEditor({
   *   target: document.getElementById('editor-container'),
   *   props: {
   *     content: { json: { name: 'example', value: 123 } },
   *     mode: 'tree',
   *     onChange: (content, previousContent, status) => {
   *       console.log('Content changed:', content);
   *     }
   *   }
   * });
   * 
   * // 콘텐츠 업데이트
   * editor.set({ json: { updated: true } });
   * 
   * // 정리
   * editor.destroy();
   * ```
   */
  export function createJSONEditor(options: JSONEditorOptions): JSONEditor;
}