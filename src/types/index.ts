/**
 * 🧩 types/index.ts - 핵심 타입 시스템 (핵심 모듈 #4)
 * 
 * =====================================================================
 * 🎯 3단계 UNION 타입 시스템 - 완벽한 타입 안전성 보장
 * =====================================================================
 * 
 * React Video Editor의 모든 데이터 구조를 정의하는 중앙 타입 허브
 * TypeScript의 고급 타입 기능을 활용한 확장 가능하고 안전한 타입 시스템
 * 
 * 🏗️ 3단계 타입 아키텍처 설계:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  1단계: MediaType - 기본 미디어 분류 (8가지 기본 타입)     │
 * │  2단계: Properties - 각 미디어별 고유 속성 정의             │  
 * │  3단계: ClipTypes - 최종 클립 Union 타입 조합               │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * 🎯 지원하는 8가지 클립 타입:
 * ┌────────────────┬─────────────────────────────────────────────┐
 * │ AudioClip      │ 오디오 파일 재생 + 볼륨/페이드 제어        │
 * │ VideoClip      │ 비디오 파일 재생 + 시각/오디오 통합 제어   │
 * │ ImageClip      │ 이미지 표시 + 위치/크기/효과 제어          │
 * │ TextClip       │ 텍스트 오버레이 + 폰트/색상/애니메이션     │
 * │ SentenceClip   │ 단일 문장 + TTS 통합                       │
 * │ LongSentenceClip│ 긴 문장 자동 분할 + 연속 TTS              │
 * │ ShapeClip      │ 기본 도형 + 색상/크기 제어                 │
 * │ PolygonShapeClip│ 복합 다각형 + 고급 벡터 그래픽            │
 * └────────────────┴─────────────────────────────────────────────┘
 * 
 * 💡 타입 안전성의 3가지 핵심 원칙:
 * 
 * 1️⃣ **Discriminated Union Pattern**
 *    ```typescript
 *    // type 필드로 런타임 타입 구분 가능
 *    if (clip.type === 'video') {
 *      // TypeScript가 자동으로 VideoClip 타입으로 추론
 *      const duration = clip.videoDuration; // ✅ 타입 안전
 *    }
 *    ```
 * 
 * 2️⃣ **Generic Constraint System**
 *    ```typescript
 *    // 타입 제약을 통한 안전한 함수 설계  
 *    function updateClip<T extends TimelineClip>(clip: T): T {
 *      // T 타입의 모든 속성에 안전하게 접근 가능
 *    }
 *    ```
 * 
 * 3️⃣ **Type Guard Functions**
 *    ```typescript
 *    // 런타임에서도 100% 안전한 타입 검증
 *    if (isVideoClip(clip)) {
 *      // clip은 확실히 VideoClip 타입
 *      clip.videoDuration // ✅ 안전한 접근
 *    }
 *    ```
 * 
 * ⚡ 성능 최적화 설계:
 * • Zero-cost Abstractions: 런타임 오버헤드 없는 타입 검증
 * • Tree Shaking: 사용하지 않는 타입 가드는 번들에서 제외
 * • Compile-time Validation: 빌드 시점에 모든 타입 오류 검출
 * • IntelliSense 지원: IDE에서 완벽한 자동완성 제공
 * 
 * 🔧 확장성 보장:
 * • 새로운 클립 타입 추가 시 기존 코드 수정 최소화
 * • 하위 호환성 유지하며 점진적 타입 개선 가능
 * • 컴포넌트별 필요한 타입만 선택적 import 가능
 * • 플러그인 방식의 타입 확장 지원
 * 
 * 📋 이 파일에서 제공하는 항목들:
 * • Core Types: 기본 데이터 구조 (TimelineClip, Track, Project 등)
 * • Union Types: 3단계 타입 조합 시스템
 * • Type Guards: 런타임 타입 검증 함수들
 * • Utility Types: 타입 조작 및 변환 헬퍼들
 * • Constants: 기본값 및 설정 상수들
 * • Validation: 타입 안전성 검증 함수들
 */

// 핵심 타입들 (명시적 export로 충돌 방지)
export type {
    TimelineClip,
    MediaItem,
    TimelineTrack,
    ProjectSettings,
    TimelineState,
    DragItem,
    HistoryState,
    LegacyTimelineClip
} from './core';

// 🆕 3단계 Union 타입 시스템 (명시적 export)
export type {
    MediaType,
    BaseClipCore,
    VisualClipProperties,
    AudioProperties,
    TextProperties,
    SentenceProperties,
    ShapeClipProperties,
    SimpleShapeClipProperties,
    PolygonShapeClipProperties
} from './clipCore';

export type {
    NewTimelineClip,
    AudioClip,
    VideoClip,
    ImageClip,
    TextClip,
    SentenceClip,
    LongSentenceClip,
    ShapeClip,
    SimpleShapeClip,
    PolygonShapeClip,
    VisualClip,
    AudioCapableClip,
    AudioEnabledClip,
    ShapeClipTypes,
    FileBasedClip,
    GeneratedClip
} from './clipTypes';

export {
    // 타입 가드들 (clipTypes에서만)
    isAudioClip,
    isVideoClip,
    isImageClip,
    isTextClip,
    isSentenceClip,
    isLongSentenceClip,
    isShapeClip,
    isSimpleShapeClip,
    isPolygonShapeClip,
    isVisualClip,
    hasAudioProperties,
    hasTextProperties,
    hasShapeProperties,
    // 속성 접근 헬퍼들
    getVisualProperties,
    getAudioProperties,
    getTextProperties
} from './clipTypes';

export {
    // 생성 함수들
    createAudioClip,
    createVideoClip,
    createImageClip,
    createTextClip,
    createSentenceClip,
    createLongSentenceClip,
    createShapeClip,
    createSimpleShapeClip,
    createPolygonShapeClip,
    createClip,
    getDefaultClipName,
    validateClip
} from './clipCreators';

// clipGuards에서 추가 유틸리티들만 export
export {
    isBasicShapeClip,
    getClipCategory,
    getClipTypeInfo,
    assertVisualClip,
    assertAudioCapable,
    assertTextClip,
    SafeAccess
} from './clipGuards';

// clipUtils는 star export (충돌 없음)
export * from './clipUtils';

// 🆕 필수 유틸리티 함수 명시적 export
export { filterValidUpdates } from './clipUtils';

// 상수 및 기본 설정
export * from './constants';

// 해상도 관련
export * from './resolution';

// 텍스트 효과
export * from './textEffects';

// 기준클립/트랙 시스템
export * from './baseClips';

// 템플릿 시스템
export * from './templates';

// Bundle 시스템
export * from './bundles';

// 키보드 단축키 시스템
export * from './keyboard';

// 클립 정렬 및 연결 시스템
export * from './clipAlignment';

// Shape 관련 (기존)
export * from './shape';
export * from './polygonShape.types';

// 🆕 타입 시스템 버전 정보
export const TYPE_SYSTEM_VERSION = '3.0';
export const UNION_TYPE_ENABLED = true;

// 🧪 3단계 Union 타입 데모
export * from './clipTypeDemo';

// 🔄 기존 호환성을 위한 별칭들
export type { TimelineClip as LegacyTimelineClipType } from './core';

