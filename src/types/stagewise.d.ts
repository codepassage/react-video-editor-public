/**
 * 🎭 stagewise.d.ts - Stagewise 개발 도구 타입 정의
 * 
 * React Video Editor v1에서 사용되는 Stagewise 개발 도구의
 * TypeScript 타입 정의를 제공하는 선언 파일입니다.
 * 
 * 🛠️ Stagewise란?
 * - VS Code 확장과 연동하는 UI 개발 도구
 * - 실행 중인 웹 애플리케이션의 UI 요소를 코드에서 직접 선택
 * - 컴포넌트와 DOM 요소 간의 실시간 매핑
 * - 디버깅 및 개발 효율성 향상을 위한 도구
 * 
 * 🎯 주요 기능:
 * - 툴바를 통한 UI 요소 인터랙션
 * - 플러그인 시스템으로 확장 가능
 * - AI 어시스턴트와의 연동 (MCP 프로토콜)
 * - 액션 기반 자동화 워크플로우
 * - 실시간 코드-UI 동기화
 * 
 * 🔧 사용 시나리오:
 * - 컴포넌트 구조 분석 및 디버깅
 * - UI/UX 개선을 위한 실시간 테스트
 * - 접근성 검사 및 최적화
 * - 성능 프로파일링 및 분석
 * - 자동화된 UI 테스트 작성
 * 
 * 🔗 연관 도구:
 * - VS Code Stagewise 확장
 * - React DevTools
 * - Chrome DevTools
 * - MCP (Model Context Protocol) 서버
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */
declare module '@stagewise/toolbar' {
  /**
   * Stagewise 툴바 초기화 함수
   * 
   * @function initToolbar
   * @param config - 툴바 설정 옵션 (선택적)
   * 
   * @description
   * Stagewise 툴바를 초기화하고 활성화합니다.
   * 설정된 플러그인들을 로드하고 VS Code 확장과의 연결을 설정합니다.
   * 
   * 💡 사용 예시:
   * ```typescript
   * import { initToolbar } from '@stagewise/toolbar';
   * 
   * // 기본 설정으로 초기화
   * initToolbar();
   * 
   * // 커스텀 플러그인과 함께 초기화
   * initToolbar({
   *   plugins: [
   *     {
   *       name: 'component-inspector',
   *       description: 'React 컴포넌트 구조 분석',
   *       shortInfoForPrompt: () => 'React 컴포넌트 정보 제공',
   *       actions: [
   *         {
   *           name: 'inspect',
   *           description: '컴포넌트 구조 분석',
   *           execute: () => console.log('Inspecting component...')
   *         }
   *       ]
   *     }
   *   ]
   * });
   * ```
   */
  export function initToolbar(config?: StagewiseConfig): void;
}

/**
 * Stagewise 툴바 설정 인터페이스
 * 
 * @interface StagewiseConfig
 * @description Stagewise 툴바를 초기화할 때 사용되는 설정 객체입니다.
 * 플러그인 목록과 기타 툴바 동작을 제어하는 옵션들을 포함합니다.
 */
interface StagewiseConfig {
  /** 로드할 플러그인들의 배열 */
  plugins?: StagewisePlugin[];
}

/**
 * Stagewise 플러그인 인터페이스
 * 
 * @interface StagewisePlugin
 * @description Stagewise 툴바에서 사용할 수 있는 플러그인의 구조를 정의합니다.
 * 각 플러그인은 고유한 기능을 제공하며 여러 액션을 포함할 수 있습니다.
 */
interface StagewisePlugin {
  /** 플러그인의 고유 이름 */
  name: string;
  
  /** 플러그인에 대한 상세 설명 */
  description: string;
  
  /** 
   * AI 프롬프트용 간단한 정보 제공 함수
   * @returns 플러그인의 간단한 설명 문자열
   */
  shortInfoForPrompt: () => string;
  
  /** MCP (Model Context Protocol) 연동 설정 (선택적) */
  mcp?: any;
  
  /** 플러그인에서 제공하는 액션들의 배열 */
  actions: StagewiseAction[];
}

/**
 * Stagewise 액션 인터페이스
 * 
 * @interface StagewiseAction
 * @description 플러그인이 제공하는 개별 액션의 구조를 정의합니다.
 * 각 액션은 특정 기능을 수행하는 실행 가능한 단위입니다.
 */
interface StagewiseAction {
  /** 액션의 고유 이름 */
  name: string;
  
  /** 액션에 대한 상세 설명 */
  description: string;
  
  /** 액션을 실행하는 함수 */
  execute: () => void;
}