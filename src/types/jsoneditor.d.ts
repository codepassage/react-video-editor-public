/**
 * 📝 jsoneditor.d.ts - JSONEditor 라이브러리 타입 정의
 * 
 * React Video Editor v1에서 사용되는 JSONEditor 라이브러리의 
 * TypeScript 타입 정의를 제공하는 선언 파일입니다.
 * 
 * 🎯 주요 용도:
 * - 프로젝트 데이터의 JSON 형태 편집 및 시각화
 * - 템플릿 설정 파일의 직접 편집
 * - 개발자 도구에서 복잡한 데이터 구조 디버깅
 * - 설정 파일 및 메타데이터의 고급 편집
 * 
 * 📊 지원 기능:
 * - Tree 모드: 계층 구조로 JSON 데이터 표시
 * - Code 모드: 구문 강조된 JSON 텍스트 편집
 * - Text 모드: 일반 텍스트로 JSON 편집
 * - Preview 모드: 읽기 전용 미리보기
 * - 스키마 검증: JSON Schema 기반 데이터 유효성 검사
 * - 자동완성: 스키마 기반 입력 도움
 * - 다국어 지원: 인터페이스 언어 설정
 * 
 * 🔧 사용 시나리오:
 * - 프로젝트 설정 파일 편집 (project.json)
 * - 템플릿 메타데이터 수정
 * - 번들 구성 정보 편집
 * - 자동 생성 시스템 설정 조정
 * - 개발 단계에서의 데이터 구조 검증
 * 
 * 🎨 UI 테마:
 * - 어두운 테마와 밝은 테마 지원
 * - 비디오 에디터 UI와 일관된 스타일링
 * - 반응형 레이아웃 지원
 * 
 * 🔗 연관 모듈:
 * - DataEditor 컴포넌트: UI 래퍼
 * - Project 관리 시스템: 설정 편집
 * - Template 시스템: 템플릿 메타데이터 편집
 * - Auto Generation: CSV 데이터 및 설정 편집
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */
declare module 'jsoneditor' {
  /**
   * JSONEditor 생성 및 동작을 제어하는 설정 옵션
   * 
   * @interface JSONEditorOptions
   * @description JSONEditor 인스턴스를 초기화할 때 사용되는 설정 객체입니다.
   * 에디터의 모드, UI 요소 표시 여부, 이벤트 핸들러, 스키마 등을 설정할 수 있습니다.
   */
  export interface JSONEditorOptions {
    /** 초기 에디터 모드 설정 ('tree', 'code', 'text', 'preview' 중 선택) */
    mode?: 'tree' | 'code' | 'text' | 'preview';
    
    /** 사용자가 전환할 수 있는 모드들의 목록 */
    modes?: string[];
    
    /** 검색 기능 활성화 여부 (기본값: true) */
    search?: boolean;
    
    /** 실행취소/다시실행 기록 기능 활성화 여부 (기본값: true) */
    history?: boolean;
    
    /** 상단 네비게이션 바 표시 여부 */
    navigationBar?: boolean;
    
    /** 하단 상태 바 표시 여부 */
    statusBar?: boolean;
    
    /** JSON 데이터 변경 시 호출되는 콜백 함수 */
    onChange?: () => void;
    
    /** JSON 객체 변경 시 호출되는 콜백 함수 (파싱된 객체 전달) */
    onChangeJSON?: (json: any) => void;
    
    /** JSON 텍스트 변경 시 호출되는 콜백 함수 (문자열 전달) */
    onChangeText?: (jsonString: string) => void;
    
    /** 에러 발생 시 호출되는 콜백 함수 */
    onError?: (error: Error) => void;
    
    /** 에디터 모드 변경 시 호출되는 콜백 함수 */
    onModeChange?: (newMode: string, oldMode: string) => void;
    
    /** 에디터 인스턴스의 이름 (디버깅 및 식별용) */
    name?: string;
    
    /** JSON Schema 객체 (데이터 유효성 검증용) */
    schema?: object;
    
    /** 스키마 참조 객체들 (복잡한 스키마 구조 지원) */
    schemaRefs?: object;
    
    /** 자동완성 설정 객체 */
    autocomplete?: object;
    
    /** UI 테마 설정 ('default', 'dark' 등) */
    theme?: string;
    
    /** 인터페이스 언어 설정 ('en', 'ko' 등) */
    language?: string;
    
    /** 지원하는 언어들의 번역 객체 */
    languages?: object;
    
    /** 기타 확장 옵션들 */
    [key: string]: any;
  }

  /**
   * JSONEditor 메인 클래스
   * 
   * @class JSONEditor
   * @description JSON 데이터를 시각적으로 편집할 수 있는 에디터 컴포넌트의 메인 클래스입니다.
   * 다양한 편집 모드와 풍부한 기능을 제공하여 복잡한 JSON 구조를 쉽게 편집할 수 있습니다.
   * 
   * 💡 사용 예시:
   * ```typescript
   * const container = document.getElementById('jsoneditor');
   * const editor = new JSONEditor(container, {
   *   mode: 'tree',
   *   onChangeJSON: (json) => console.log('Changed:', json)
   * });
   * 
   * editor.set({ name: 'example', value: 123 });
   * ```
   */
  export default class JSONEditor {
    /**
     * JSONEditor 생성자
     * 
     * @constructor
     * @param container - 에디터를 렌더링할 HTML 엘리먼트
     * @param options - 에디터 설정 옵션 (선택적)
     * 
     * @description
     * 지정된 컨테이너 엘리먼트에 JSONEditor 인스턴스를 생성합니다.
     * 옵션을 통해 에디터의 모드, 이벤트 핸들러, 스키마 등을 설정할 수 있습니다.
     */
    constructor(container: HTMLElement, options?: JSONEditorOptions);
    
    /**
     * JSON 데이터 설정
     * @param json - 설정할 JSON 객체
     * @description 에디터에 새로운 JSON 데이터를 로드합니다.
     */
    set(json: any): void;
    
    /**
     * 현재 JSON 데이터 가져오기
     * @returns 현재 에디터의 JSON 객체
     * @description 에디터에서 편집 중인 JSON 데이터를 객체 형태로 반환합니다.
     */
    get(): any;
    
    /**
     * JSON 텍스트 형태로 가져오기
     * @returns JSON 문자열
     * @description 현재 에디터의 데이터를 JSON 문자열 형태로 반환합니다.
     */
    getText(): string;
    
    /**
     * JSON 텍스트 설정
     * @param jsonString - 설정할 JSON 문자열
     * @description 에디터에 JSON 문자열을 파싱하여 로드합니다.
     */
    setText(jsonString: string): void;
    
    /**
     * 현재 에디터 모드 가져오기
     * @returns 현재 모드 ('tree', 'code', 'text', 'preview')
     */
    getMode(): string;
    
    /**
     * 에디터 모드 변경
     * @param mode - 변경할 모드
     * @description 에디터의 표시 모드를 동적으로 변경합니다.
     */
    setMode(mode: string): void;
    
    /**
     * 에디터 이름 설정
     * @param name - 설정할 이름 (선택적)
     * @description 에디터 인스턴스의 이름을 설정합니다.
     */
    setName(name?: string): void;
    
    /**
     * 에디터 이름 가져오기
     * @returns 현재 설정된 이름
     */
    getName(): string;
    
    /**
     * JSON Schema 설정
     * @param schema - JSON Schema 객체
     * @param schemaRefs - 스키마 참조 객체 (선택적)
     * @description 데이터 유효성 검증을 위한 스키마를 설정합니다.
     */
    setSchema(schema: object, schemaRefs?: object): void;
    
    /**
     * 현재 데이터 유효성 검증
     * @returns 검증 오류 배열
     * @description 설정된 스키마에 대해 현재 데이터를 검증하고 오류 목록을 반환합니다.
     */
    validate(): any[];
    
    /**
     * 에디터 인스턴스 정리
     * @description 에디터를 제거하고 관련 이벤트 리스너와 메모리를 정리합니다.
     */
    destroy(): void;
    
    /**
     * 에디터에 포커스 설정
     * @description 에디터를 활성화하고 키보드 포커스를 설정합니다.
     */
    focus(): void;
    
    /**
     * 에디터 크기 재조정
     * @description 컨테이너 크기 변경 시 에디터를 다시 그립니다.
     */
    resize(): void;
    
    /**
     * 모든 노드 확장 (tree 모드)
     * @description tree 모드에서 모든 JSON 노드를 확장하여 표시합니다.
     */
    expandAll(): void;
    
    /**
     * 모든 노드 축소 (tree 모드)
     * @description tree 모드에서 모든 JSON 노드를 축소하여 표시합니다.
     */
    collapseAll(): void;
    
    /** 사용 가능한 에디터 모드들의 정적 배열 */
    static modes: string[];
    
    /** Ace 에디터 인스턴스 (code 모드에서 사용) */
    static ace: any;
  }
}