/**
 * 🎯 clipGuards.ts - 3단계 Union 타입 호환 타입 가드 시스템
 * 
 * React Video Editor v1의 고급 타입 안전성을 보장하는 타입 가드 함수들을 제공합니다.
 * 3단계 Union 타입 시스템과 기존 코드의 호환성을 유지하면서, 런타임에서 타입 안전한
 * 속성 접근을 보장하는 포괄적인 타입 가드 라이브러리입니다.
 * 
 * 🎯 주요 기능:
 * - 8가지 클립 타입별 타입 가드 함수
 * - 안전한 속성 접근을 위한 assert 함수들
 * - 타입별 속성 추출 헬퍼 함수들
 * - 디버깅을 위한 타입 정보 분석
 * - 기존 코드 호환성을 위한 별칭 제공
 * 
 * 🏗️ 아키텍처:
 * ```
 * clipGuards.ts
 * ├── Basic Type Guards - 기본 타입 판별 (is* 함수들)
 * ├── Property Guards - 속성 존재 여부 확인 (has* 함수들)
 * ├── Assert Guards - 타입 단언 및 런타임 검증 (assert* 함수들)
 * ├── Safe Access - 안전한 속성 접근 헬퍼 (SafeAccess 네임스페이스)
 * └── Legacy Aliases - 기존 코드 호환성 (별칭들)
 * ```
 * 
 * 🔒 타입 안전성 보장:
 * - 컴파일 타임: TypeScript 타입 시스템
 * - 런타임: 타입 가드 및 assert 함수
 * - 개발 시: IntelliSense 자동완성 지원
 * - 디버깅: 상세한 타입 정보 제공
 * 
 * 🎨 지원 클립 타입:
 * - AudioClip: 오디오 전용 클립
 * - VideoClip: 비디오 클립 (시각+오디오)
 * - ImageClip: 이미지 클립
 * - TextClip: 텍스트 클립
 * - SentenceClip: 문장 클립 (TTS 지원)
 * - LongSentenceClip: 긴 문장 클립
 * - ShapeClip: 기본 도형 클립
 * - SimpleShape/PolygonShape: 고급 도형 클립
 * 
 * 📦 Union 타입 카테고리:
 * - VisualClip: 시각적 속성을 가진 모든 클립
 * - AudioCapableClip: 오디오 속성을 가진 클립들
 * - ShapeClipTypes: 모든 도형 관련 클립들
 * 
 * 💡 사용 패턴:
 * ```typescript
 * // 1. 기본 타입 확인
 * if (isTextClip(clip)) {
 *   // TypeScript가 clip을 TextClip으로 인식
 *   console.log(clip.text); // 타입 안전
 * }
 * 
 * // 2. 속성 존재 확인
 * if (hasAudioProperties(clip)) {
 *   // clip.volume, clip.playbackRate 접근 가능
 * }
 * 
 * // 3. 안전한 타입 단언
 * assertVisualClip(clip); // 예외 발생 시 런타임 에러
 * clip.x = 100; // 안전하게 접근 가능
 * 
 * // 4. 안전한 속성 접근
 * const audioProps = SafeAccess.getAudioProps(clip);
 * if (audioProps) {
 *   console.log(audioProps.volume);
 * }
 * ```
 * 
 * ⚡ 성능 최적화:
 * - 단순 속성 체크로 빠른 타입 판별
 * - 메모이제이션이 필요 없는 순수 함수들
 * - 트리 쉐이킹 지원 (사용하지 않는 가드 제거)
 * - 인라인 최적화 가능한 간단한 로직
 * 
 * 🔄 마이그레이션 지원:
 * - 기존 코드 호환성을 위한 별칭 제공
 * - 점진적 타입 시스템 업그레이드 지원
 * - 3단계 Union 타입으로의 원활한 전환
 * 
 * 🔗 연관 모듈:
 * - 2번 모듈: Clip Type System (핵심 타입 정의)
 * - clipTypes.ts: Union 타입 및 기본 가드 함수들
 * - PropertiesPanel: 타입별 속성 편집 UI
 * - Remotion 렌더러: 타입 안전한 클립 렌더링
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 3.0
 */

import { TimelineClip } from './core';
// 🆕 새로운 Union 타입들 import
import { 
  AudioClip, 
  VideoClip, 
  ImageClip, 
  TextClip, 
  SentenceClip,
  LongSentenceClip,
  SpacerClip,
  VisualClip, 
  AudioCapableClip,
  ShapeClipTypes,
  // 기존 타입 가드들 재사용 (중복 방지)
  isAudioClip,
  isVideoClip,
  isImageClip,
  isTextClip,
  isSentenceClip,
  isLongSentenceClip,
  isShapeClip,
  isSimpleShapeClip,
  isPolygonShapeClip,
  isSpacerClip,
  isVisualClip,
  hasAudioProperties,
  hasTextProperties,
  hasShapeProperties
} from './clipTypes';

// 🔄 기존 타입 가드들 재export (중복 제거)
export {
  isAudioClip,
  isVideoClip,
  isImageClip,
  isTextClip,
  isSentenceClip,
  isLongSentenceClip,
  isShapeClip,
  isSimpleShapeClip,
  isPolygonShapeClip,
  isSpacerClip,
  isVisualClip,
  hasAudioProperties,
  hasTextProperties,
  hasShapeProperties
};

/**
 * 기본 도형 클립 확인 헬퍼 함수
 * 
 * @function isBasicShapeClip
 * @param clip - 확인할 타임라인 클립
 * @returns 기본 도형 클립이면 true, 아니면 false
 * @description shape mediaType을 가진 클립인지 확인합니다.
 * 이는 clipTypes.ts에 없는 추가 헬퍼 함수로, 기본 도형 클립만을 구분할 때 사용됩니다.
 * 
 * 💡 사용 예시:
 * ```typescript
 * if (isBasicShapeClip(clip)) {
 *   console.log('기본 도형 클립입니다');
 * }
 * ```
 */
export const isBasicShapeClip = (clip: TimelineClip): boolean => {
  return clip.mediaType === 'shape';
};

/**
 * 클립 카테고리 분류 함수
 * 
 * @function getClipCategory
 * @param clip - 분류할 타임라인 클립
 * @returns 클립의 카테고리 ('visual' | 'audio' | 'mixed')
 * @description 클립을 미디어 특성에 따라 3가지 카테고리로 분류합니다.
 * 
 * 📂 카테고리 분류:
 * - 'audio': 오디오 전용 클립 (AudioClip)
 * - 'mixed': 시각+오디오 클립 (VideoClip)
 * - 'visual': 시각 전용 클립 (Image, Text, Shape 등)
 * 
 * 💡 사용 예시:
 * ```typescript
 * const category = getClipCategory(clip);
 * switch (category) {
 *   case 'audio':
 *     // 오디오 컨트롤만 표시
 *     break;
 *   case 'mixed':
 *     // 비디오 + 오디오 컨트롤 표시
 *     break;
 *   case 'visual':
 *     // 시각적 컨트롤만 표시
 *     break;
 * }
 * ```
 */
export const getClipCategory = (clip: TimelineClip): 'visual' | 'audio' | 'mixed' => {
  if (isAudioClip(clip)) return 'audio';
  if (isVideoClip(clip)) return 'mixed'; // 시각적이면서 오디오도 있음
  return 'visual'; // image, text, shape 등
};

/**
 * 디버깅용 클립 타입 정보 추출 함수
 * 
 * @function getClipTypeInfo
 * @param clip - 정보를 추출할 타임라인 클립
 * @returns 클립의 타입 정보 객체
 * @description 클립의 타입 관련 모든 정보를 종합하여 디버깅과 개발에 유용한
 * 상세 정보를 제공합니다. 타입 시스템 버전 정보도 포함됩니다.
 * 
 * 🔍 제공 정보:
 * - mediaType: 클립의 미디어 타입
 * - isVisual: 시각적 클립 여부
 * - isAudio: 오디오 클립 여부
 * - hasAudio: 오디오 속성 보유 여부
 * - category: 클립 카테고리
 * - isUnionType: Union 타입 시스템 사용 여부
 * - typeSystemVersion: 타입 시스템 버전
 * 
 * 💡 사용 예시:
 * ```typescript
 * const info = getClipTypeInfo(clip);
 * console.log('클립 정보:', info);
 * 
 * // 개발 모드에서 타입 정보 로깅
 * if (process.env.NODE_ENV === 'development') {
 *   console.table(info);
 * }
 * ```
 */
export const getClipTypeInfo = (clip: TimelineClip) => {
  return {
    mediaType: clip.mediaType,
    isVisual: isVisualClip(clip),
    isAudio: isAudioClip(clip),
    hasAudio: hasAudioProperties(clip),
    category: getClipCategory(clip),
    // 🆕 새로운 타입 시스템 정보
    isUnionType: true,
    typeSystemVersion: '3.0'
  };
};

// 🆕 새로운 Union 타입 전용 타입 가드들

/**
 * 시각적 클립 타입 단언 함수
 * 
 * @function assertVisualClip
 * @param clip - 확인할 타임라인 클립
 * @throws Error - 시각적 클립이 아닌 경우 오류 발생
 * @description 시각적 속성을 가진 클립인지 런타임에 검증하고 타입을 단언합니다.
 * 시각적 속성(x, y, width, height, opacity, rotation 등)에 안전하게 접근하기 전에 사용합니다.
 * 
 * 🔒 타입 안전성:
 * - TypeScript 컴파일 단계에서 clip을 VisualClip으로 인식
 * - 런타임에 타입 불일치 시 예외 발생
 * - 안전한 속성 접근 보장
 * 
 * 💡 사용 예시:
 * ```typescript
 * try {
 *   assertVisualClip(clip);
 *   // 이제 clip은 VisualClip 타입으로 취급됨
 *   clip.x = 100;
 *   clip.y = 200;
 *   clip.opacity = 0.8;
 * } catch (error) {
 *   console.error('시각적 클립이 아닙니다:', error.message);
 * }
 * ```
 */
export const assertVisualClip = (clip: TimelineClip): asserts clip is VisualClip => {
  if (!isVisualClip(clip)) {
    throw new Error(`${clip.mediaType} 클립은 시각적 속성을 지원하지 않습니다`);
  }
};

/**
 * 오디오 기능 클립 타입 단언 함수
 * 
 * @function assertAudioCapable
 * @param clip - 확인할 타임라인 클립
 * @throws Error - 오디오 속성을 지원하지 않는 경우 오류 발생
 * @description 오디오 속성을 가진 클립인지 런타임에 검증하고 타입을 단언합니다.
 * 오디오 속성(volume, playbackRate 등)에 안전하게 접근하기 전에 사용합니다.
 * 
 * 🎵 오디오 속성 지원 클립:
 * - AudioClip: 순수 오디오 클립
 * - VideoClip: 비디오와 오디오를 모두 가진 클립
 * - SentenceClip: TTS 옵션이 있는 때
 * 
 * 💡 사용 예시:
 * ```typescript
 * try {
 *   assertAudioCapable(clip);
 *   // 이제 clip은 AudioCapableClip 타입으로 취급됨
 *   clip.volume = 0.8;
 *   clip.playbackRate = 1.2;
 * } catch (error) {
 *   console.error('오디오 기능을 지원하지 않는 클립입니다:', error.message);
 * }
 * ```
 */
export const assertAudioCapable = (clip: TimelineClip): asserts clip is AudioCapableClip => {
  if (!hasAudioProperties(clip)) {
    throw new Error(`${clip.mediaType} 클립은 오디오 속성을 지원하지 않습니다`);
  }
};

/**
 * 미디어 타입을 ClipType으로 변환하는 함수
 * 
 * @function getClipType
 * @param clip - 변환할 타임라인 클립
 * @returns ClipType 열거형 값
 * @description 클립의 mediaType 속성을 ClipType 열거형 식별자로 변환합니다.
 * 이는 타입 시스템 간의 호환성을 위해 사용되며, 타입 기반 스위치 문에서 유용합니다.
 * 
 * 🔄 변환 매핑:
 * - 'audio' → 'audioClip'
 * - 'video' → 'videoClip'
 * - 'image' → 'imageClip'
 * - 'text' → 'textClip'
 * - 'sentence' → 'sentenceClip'
 * - 'shape' → 'shapeClip'
 * - 'simpleShape' → 'simpleShapeClip'
 * - 'polygonShape' → 'polygonShapeClip'
 * - 기타 → 'textClip' (기본값)
 * 
 * 💡 사용 예시:
 * ```typescript
 * const clipType = getClipType(clip);
 * switch (clipType) {
 *   case 'audioClip':
 *     // 오디오 처리
 *     break;
 *   case 'textClip':
 *     // 텍스트 처리
 *     break;
 *   // ...
 * }
 * ```
 */
export const getClipType = (clip: TimelineClip): import('./clipTypes').ClipType => {
  switch (clip.mediaType) {
    case 'audio': return 'audioClip';
    case 'video': return 'videoClip';
    case 'image': return 'imageClip';
    case 'text': return 'textClip';
    case 'sentence': return 'sentenceClip';
    case 'shape': return 'shapeClip';
    case 'simpleShape': return 'simpleShapeClip';
    case 'polygonShape': return 'polygonShapeClip';
    default: return 'textClip'; // 기본값
  }
};

/**
 * 텍스트 클립 타입 단언 함수
 * 
 * @function assertTextClip
 * @param clip - 확인할 타임라인 클립
 * @throws Error - 텍스트 클립이 아닌 경우 오류 발생
 * @description 텍스트 속성을 가진 클립인지 런타임에 검증하고 타입을 단언합니다.
 * 텍스트 속성(text, fontSize, fontFamily, color 등)에 안전하게 접근하기 전에 사용합니다.
 * 
 * 📝 텍스트 속성 지원 클립:
 * - TextClip: 기본 텍스트 클립
 * - SentenceClip: 문장 클립 (또한 텍스트 속성 보유)
 * 
 * 💡 사용 예시:
 * ```typescript
 * try {
 *   assertTextClip(clip);
 *   // 이제 clip은 TextClip 타입으로 취급됨
 *   clip.text = '새로운 텍스트';
 *   clip.fontSize = 24;
 *   clip.color = '#ff0000';
 * } catch (error) {
 *   console.error('텍스트 클립이 아닙니다:', error.message);
 * }
 * ```
 */
export const assertTextClip = (clip: TimelineClip): asserts clip is TextClip => {
  if (!isTextClip(clip)) {
    throw new Error(`${clip.mediaType} 클립은 텍스트 속성을 지원하지 않습니다`);
  }
};

/**
 * 안전한 클립 속성 접근을 위한 네임스페이스
 * 
 * @namespace SafeAccess
 * @description 런타임 타입 확인을 통해 안전하게 클립 속성에 접근할 수 있도록 돕는
 * 헬퍼 함수들을 제공합니다. assert 함수들과 달리 예외를 발생시키지 않고
 * null을 반환하여 더 안전한 접근 방식을 제공합니다.
 * 
 * 🛡️ 안전성 원칙:
 * - 타입 불일치 시 null 반환 (예외 발생 없음)
 * - 모든 반환값은 null check 필요
 * - 순수 함수로 사이드 이펙트 없음
 * - TypeScript 타입 추론 지원
 * 
 * 💡 사용 패턴:
 * ```typescript
 * // 안전한 접근 방식
 * const visualProps = SafeAccess.getVisualProps(clip);
 * if (visualProps) {
 *   console.log(`위치: ${visualProps.x}, ${visualProps.y}`);
 * }
 * 
 * // 체이닝과 함께 사용
 * const audioProps = SafeAccess.getAudioProps(clip);
 * audioProps && setVolume(audioProps.volume);
 * ```
 */
export namespace SafeAccess {
  /**
   * 시각적 속성 안전 추출 함수
   * 
   * @function getVisualProps
   * @param clip - 속성을 추출할 타임라인 클립
   * @returns 시각적 속성 객체 또는 null
   * @description 시각적 클립의 위치, 크기, 투명도 등의 속성을 안전하게 추출합니다.
   * 시각적 클립이 아닌 경우 null을 반환하여 예외 발생을 방지합니다.
   * 
   * 🎨 추출 속성:
   * - x, y: 클립 위치 좌표
   * - width, height: 클립 크기
   * - opacity: 투명도 (0-1)
   * - rotation: 회전 각도 (도)
   * 
   * 💡 사용 예시:
   * ```typescript
   * const props = SafeAccess.getVisualProps(clip);
   * if (props) {
   *   console.log(`위치: (${props.x}, ${props.y})`);
   *   console.log(`크기: ${props.width}x${props.height}`);
   *   console.log(`투명도: ${props.opacity}`);
   * }
   * ```
   */
  export function getVisualProps(clip: TimelineClip) {
    if (!isVisualClip(clip)) return null;
    
    return {
      x: clip.x,
      y: clip.y,
      width: clip.width,
      height: clip.height,
      opacity: clip.opacity,
      rotation: clip.rotation
    };
  }

  /**
   * 오디오 속성 안전 추출 함수
   * 
   * @function getAudioProps
   * @param clip - 속성을 추출할 타임라인 클립
   * @returns 오디오 속성 객체 또는 null
   * @description 오디오 기능을 가진 클립의 소리 관련 속성을 안전하게 추출합니다.
   * 오디오 속성이 없는 클립의 경우 null을 반환하여 예외 발생을 방지합니다.
   * 
   * 🎵 추출 속성:
   * - volume: 음량 (0-1 범위)
   * - playbackRate: 재생 속도 (기본값 1.0)
   * 
   * 💡 사용 예시:
   * ```typescript
   * const props = SafeAccess.getAudioProps(clip);
   * if (props) {
   *   console.log(`음량: ${props.volume * 100}%`);
   *   console.log(`재생 속도: ${props.playbackRate}x`);
   * }
   * ```
   */
  export function getAudioProps(clip: TimelineClip) {
    if (!hasAudioProperties(clip)) return null;
    
    return {
      volume: clip.volume,
      playbackRate: clip.playbackRate
    };
  }

  /**
   * 텍스트 속성 안전 추출 함수
   * 
   * @function getTextProps
   * @param clip - 속성을 추출할 타임라인 클립
   * @returns 텍스트 속성 객체 또는 null
   * @description 텍스트 클립의 내용, 폰트, 색상 등의 속성을 안전하게 추출합니다.
   * 텍스트 클립이 아닌 경우 null을 반환하여 예외 발생을 방지합니다.
   * 
   * 📝 추출 속성:
   * - text: 텍스트 내용
   * - fontSize: 폰트 크기 (픽셀)
   * - fontFamily: 폰트 배숝
   * - color: 글자 색상
   * - backgroundColor: 배경 색상
   * 
   * 💡 사용 예시:
   * ```typescript
   * const props = SafeAccess.getTextProps(clip);
   * if (props) {
   *   console.log(`텍스트: ${props.text}`);
   *   console.log(`폰트: ${props.fontFamily}, ${props.fontSize}px`);
   *   console.log(`색상: ${props.color}`);
   * }
   * ```
   */
  export function getTextProps(clip: TimelineClip) {
    if (!isTextClip(clip)) return null;
    
    return {
      text: clip.text,
      fontSize: clip.fontSize,
      fontFamily: clip.fontFamily,
      color: clip.color,
      backgroundColor: clip.backgroundColor
    };
  }
}

// 🔄 기존 호환성을 위한 별칭들
export {
  isAudioClip as isAudio,
  isVideoClip as isVideo,
  isImageClip as isImage,
  isTextClip as isText,
  isSentenceClip as isSentence,
  isVisualClip as isVisual,
  hasAudioProperties as hasAudio
};
