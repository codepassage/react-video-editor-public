/**
 * 📝 SentenceEditor.tsx - Sentence 클립 편집기 엔트리 포인트
 * 
 * 모듈화된 Sentence 편집기 구조에서 메인 컴포넌트를 re-export하는
 * 진입점 파일입니다. 하위 호환성을 유지하면서 새로운 모듈 구조로
 * 전환할 수 있도록 지원합니다.
 * 
 * 주요 기능:
 * - sentence-editor 모듈에서 SentenceEditor 컴포넌트 re-export
 * - TypeScript 타입 정의 re-export
 * - 기본 export 및 명시적 export 모두 지원
 * - 하위 호환성 보장
 * 
 * 모듈 구조:
 * - sentence-editor/: 실제 Sentence 편집기 구현
 * - SentenceEditor.tsx: 진입점 (현재 파일)
 * - 세그먼트별 스타일링 및 텍스트 효과 지원
 * 
 * 관련 모듈:
 * - 2번 모듈: Clip Type System (SentenceClip 타입)
 * - sentence-editor/: 실제 구현 디렉토리
 * - PropertiesPanel: 속성 패널 통합
 */

// Re-export from the new modular structure
export { SentenceEditor } from './sentence-editor';
export type { SentenceEditorProps } from './sentence-editor';

// For backward compatibility, also export as default
export { SentenceEditor as default } from './sentence-editor';
