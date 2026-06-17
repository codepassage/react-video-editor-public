/**
 * 📝 Clip Actions - 클립 관리 액션 (Zustand Store)
 * 
 * React Video Editor v1의 핵심 클립 관리 시스템입니다.
 * 8가지 클립 타입(audio, video, image, text, sentence, longsentence, shape, simpleShape, polygonShape)에 대한
 * 생성, 수정, 삭제, 선택 등의 CRUD 작업을 담당합니다.
 * 
 * 🎯 주요 기능:
 * - 타입별 최적화된 클립 생성 (createXxxClip 함수 활용)
 * - Union 타입 기반 안전한 클립 업데이트
 * - LongSentence 클립의 부모-자식 관계 관리
 * - Base Track과 Regular Track 구분 처리
 * - 클립 드래그/리사이즈 상태 추적
 * - 실시간 변환 진행률 추적
 * 
 * 🏗️ 아키텍처:
 * ```
 * ClipActions
 * ├── addClip() - 8가지 타입별 최적화 생성
 * ├── updateClip() - Union 타입 안전 업데이트
 * ├── removeClip() - 부모-자식 관계 고려 삭제
 * ├── selectClips() - 다중 선택 지원
 * └── getClipById() - 타입 안전 클립 조회
 * 
 * LongSentenceActions
 * ├── convertLongSentence() - 긴 문장 자동 분할
 * ├── regenerateLongSentenceClips() - 재생성
 * ├── deleteChildClips() - 자식 클립 일괄 삭제
 * └── moveChildClips() - 자식 클립 동기화 이동
 * ```
 * 
 * 💡 사용 예시:
 * ```typescript
 * // 새 비디오 클립 추가
 * addClip({
 *   mediaType: 'video',
 *   mediaId: 'video123',
 *   trackId: 'track1',
 *   mediaUrl: '/uploads/video.mp4',
 *   startTime: 10,
 *   duration: 5
 * });
 * 
 * // 클립 속성 업데이트 (타입 안전)
 * updateClip('clip123', {
 *   startTime: 15,
 *   opacity: 0.8
 * });
 * 
 * // LongSentence 변환
 * await convertLongSentence('longclip123');
 * ```
 * 
 * 🔧 모듈 연관성:
 * - Timeline System: 타임라인 UI와 드래그 앤 드롭
 * - Bundle System: 번들 내 클립 관리
 * - Properties Panel: 속성 편집 연동
 * - TTS System: LongSentence 음성 생성
 * - Remotion Integration: 클립 렌더링
 * 
 * ⚡ 성능 최적화:
 * - 타입별 생성 함수로 불필요한 속성 제거
 * - Union 타입 필터링으로 안전한 업데이트
 * - 부모-자식 일괄 작업으로 상태 업데이트 최소화
 * - 디버깅 모드와 개발용 테스트 함수 제공
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */

import { StateCreator } from 'zustand';
import {
  TimelineClip,
  NewTimelineClip,
  createAudioClip,
  createVideoClip,
  createTextClip,
  createSentenceClip,
  createLongSentenceClip,
  createImageClip,
  createShapeClip,
  createSimpleShapeClip,
  createPolygonShapeClip,
  createClip,
  TimelineTrack,
  checkBaseClipOverlap,
  getDefaultClipName,
  validateClip,
  filterValidUpdates
} from '../../types';
import { isBaseTrack } from '../../types/baseClips';
import { processLongSentenceConversionResult } from './clipActions_longsentence_section';
import { generateId } from '../utils/storeUtils';
import type { UnsavedActions } from '../unsaved/unsavedActions';
import { DEFAULT_LONGSENTENCE_DURATION } from '../../constants/clipDefaults';


/**
 * 클립 관련 상태 타입 정의
 * 
 * @interface ClipState
 * @description 클립 관리에 필요한 모든 상태를 정의합니다.
 */
export interface ClipState {
  /** 현재 선택된 클립들의 ID 배열 (다중 선택 지원) */
  selectedClips: string[];
  /** 전체 트랙 배열 (각 트랙은 클립들을 포함) */
  tracks: TimelineTrack[];
  /** 현재 선택된 단일 클립 (속성 패널에서 편집) */
  selectedClip: NewTimelineClip | null;
  /** 속성 패널 열림/닫힘 상태 */
  isPropertiesPanelOpen: boolean;
}

/**
 * 클립 관련 액션 타입 정의
 * 
 * @interface ClipActions
 * @description 클립에 대한 모든 CRUD 작업과 고급 기능을 정의합니다.
 */
export interface ClipActions {
  /** 새 클립을 타임라인에 추가 (8가지 타입 지원) */
  addClip: (clip: Omit<NewTimelineClip, 'id'> | any) => void;
  /** 기존 클립의 속성을 안전하게 업데이트 (Union 타입 필터링) */
  updateClip: (clipId: string, updates: Partial<NewTimelineClip>) => void;
  /** 클립을 타임라인에서 제거 (부모-자식 관계 고려) */
  removeClip: (clipId: string) => void;
  /** 여러 클립을 동시 선택 */
  selectClips: (clipIds: string[]) => void;
  /** ID로 클립 조회 (타입 안전) */
  getClipById: (clipId: string) => NewTimelineClip | undefined;
  /** LongSentence 클립의 자식 클립들만 삭제 */
  deleteChildClips: (parentClipId: string) => void;
  /** LongSentence 클립을 재생성 (기존 자식 삭제 후 새로 생성) */
  regenerateLongSentenceClips: (clipId: string) => Promise<void>;
  /** 자식 클립을 부모로부터 분리 */
  unlinkChildClipFromParent: (childClipId: string) => void;
  /** 부모 클립 이동 시 자식 클립들도 함께 이동 */
  moveChildClips: (parentClipId: string, deltaTime: number, childClipIds?: string[]) => void;
}

/**
 * 속성 패널 의존성 인터페이스
 * 
 * @interface ClipDependencies
 * @description 속성 패널과 연동되는 클립 상태를 정의합니다.
 */
export interface ClipDependencies {
  /** 속성 패널에서 편집 중인 클립 */
  selectedClip: NewTimelineClip | null;
  /** 속성 패널 열림/닫힘 상태 */
  isPropertiesPanelOpen: boolean;
}

export const createClipActions: StateCreator<
  ClipState & ClipActions & UnsavedActions,
  [],
  [],
  ClipActions
> = (set, get) => ({
  // 🎯 Union 타입 기반 향상된 클립 추가
  addClip: (clipData) => {
    const state = get();

    console.log('🔍 addClip 호출됨:', {
      mediaType: clipData.mediaType,
      trackId: clipData.trackId,
      clipId: clipData.id?.slice(-8) || 'no-id',
      hasRequiredFields: !!(clipData.mediaType && clipData.trackId),
      trackExists: !!state.tracks.find(t => t.id === clipData.trackId)
    });

    try {
      // 🎭 타입별 전용 생성 함수 활용
      let newClip: NewTimelineClip;

      switch (clipData.mediaType) {
        case 'audio':
          // 🎵 Audio 클립 - 오디오 전용 최적화
          newClip = createAudioClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            mediaUrl: clipData.mediaUrl || '',
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name,
            volume: clipData.volume,
            playbackRate: clipData.playbackRate,
            id: clipData.id, // 서버 ID 보존
            baseClipProperties: clipData.baseClipProperties, // 기준 클립 속성 전달
            parentClipId: clipData.parentClipId // 부모 클립 ID 전달
          });
          break;

        case 'video':
          // 🎬 Video 클립 - 시각적 + 오디오
          newClip = createVideoClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            mediaUrl: clipData.mediaUrl || '',
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name,
            x: clipData.x,
            y: clipData.y,
            width: clipData.width,
            height: clipData.height,
            opacity: clipData.opacity,
            rotation: clipData.rotation,
            volume: clipData.volume,
            playbackRate: clipData.playbackRate,
            // 🎯 이펙트 속성들 추가 (서버에서 전달받은 속성 유실 방지)
            brightness: (clipData as any).brightness,
            contrast: (clipData as any).contrast,
            saturation: (clipData as any).saturation,
            hue: (clipData as any).hue,
            blur: (clipData as any).blur,
            sepia: (clipData as any).sepia,
            grayscale: (clipData as any).grayscale,
            fadeIn: (clipData as any).fadeIn,
            fadeOut: (clipData as any).fadeOut,
            animationType: (clipData as any).animationType,
            animationDuration: (clipData as any).animationDuration,
            animationDelay: (clipData as any).animationDelay,
            animationEasing: (clipData as any).animationEasing,
            animationLoop: (clipData as any).animationLoop,
            id: clipData.id, // 서버 ID 보존
            baseClipProperties: clipData.baseClipProperties, // 기준 클립 속성 전달
            parentClipId: clipData.parentClipId // 부모 클립 ID 전달
          });
          break;

        case 'image':
          // 🖼️ Image 클립 - 시각적 전용
          newClip = createImageClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            mediaUrl: clipData.mediaUrl || '',
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name,
            x: clipData.x,
            y: clipData.y,
            width: clipData.width,
            height: clipData.height,
            opacity: clipData.opacity,
            rotation: clipData.rotation,
            // 🎯 이펙트 속성들 추가 (서버에서 전달받은 속성 유실 방지)
            brightness: (clipData as any).brightness,
            contrast: (clipData as any).contrast,
            saturation: (clipData as any).saturation,
            hue: (clipData as any).hue,
            blur: (clipData as any).blur,
            sepia: (clipData as any).sepia,
            grayscale: (clipData as any).grayscale,
            fadeIn: (clipData as any).fadeIn,
            fadeOut: (clipData as any).fadeOut,
            animationType: (clipData as any).animationType,
            animationDuration: (clipData as any).animationDuration,
            animationDelay: (clipData as any).animationDelay,
            animationEasing: (clipData as any).animationEasing,
            animationLoop: (clipData as any).animationLoop,
            id: clipData.id, // 서버 ID 보존
            baseClipProperties: clipData.baseClipProperties, // 기준 클립 속성 전달
            parentClipId: clipData.parentClipId // 부모 클립 ID 전달
          });
          break;

        case 'text':
          // 📝 Text 클립 - 텍스트 전용
          newClip = createTextClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            text: (clipData as any).text || '새 텍스트',
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name,
            x: clipData.x,
            y: clipData.y,
            width: clipData.width,
            height: clipData.height,
            opacity: clipData.opacity,
            rotation: clipData.rotation,
            fontSize: (clipData as any).fontSize,
            fontFamily: (clipData as any).fontFamily,
            color: (clipData as any).color,
            backgroundColor: (clipData as any).backgroundColor,
            // 🎯 이펙트 속성들 추가 (서버에서 전달받은 속성 유실 방지)
            brightness: (clipData as any).brightness,
            contrast: (clipData as any).contrast,
            saturation: (clipData as any).saturation,
            hue: (clipData as any).hue,
            blur: (clipData as any).blur,
            sepia: (clipData as any).sepia,
            grayscale: (clipData as any).grayscale,
            fadeIn: (clipData as any).fadeIn,
            fadeOut: (clipData as any).fadeOut,
            animationType: (clipData as any).animationType,
            animationDuration: (clipData as any).animationDuration,
            animationDelay: (clipData as any).animationDelay,
            animationEasing: (clipData as any).animationEasing,
            animationLoop: (clipData as any).animationLoop,
            id: clipData.id // 서버 ID 보존
          });
          break;

        case 'sentence':
          // 📄 Sentence 클립 - 고급 텍스트 전용
          newClip = createSentenceClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            text: (clipData as any).text || '새 Sentence 클립',
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name,
            x: clipData.x,
            y: clipData.y,
            width: clipData.width,
            height: clipData.height,
            opacity: clipData.opacity,
            rotation: clipData.rotation,
            fontSize: (clipData as any).fontSize,
            fontFamily: (clipData as any).fontFamily,
            color: (clipData as any).color,
            backgroundColor: (clipData as any).backgroundColor,
            textSegments: (clipData as any).textSegments,
            segmentOverlapMode: (clipData as any).segmentOverlapMode,
            enableRealTimePreview: (clipData as any).enableRealTimePreview,
            // 🎯 이펙트 속성들 추가 (서버에서 전달받은 속성 유실 방지)
            brightness: (clipData as any).brightness,
            contrast: (clipData as any).contrast,
            saturation: (clipData as any).saturation,
            hue: (clipData as any).hue,
            blur: (clipData as any).blur,
            sepia: (clipData as any).sepia,
            grayscale: (clipData as any).grayscale,
            fadeIn: (clipData as any).fadeIn,
            fadeOut: (clipData as any).fadeOut,
            animationType: (clipData as any).animationType,
            animationDuration: (clipData as any).animationDuration,
            animationDelay: (clipData as any).animationDelay,
            animationEasing: (clipData as any).animationEasing,
            animationLoop: (clipData as any).animationLoop,
            // 🔥 누락된 텍스트 속성들 추가
            borderRadius: (clipData as any).borderRadius,
            borderRadiusUnit: (clipData as any).borderRadiusUnit,
            textShadow: (clipData as any).textShadow,
            textShadowColor: (clipData as any).textShadowColor,
            textShadowOffsetX: (clipData as any).textShadowOffsetX,
            textShadowOffsetY: (clipData as any).textShadowOffsetY,
            textShadowBlur: (clipData as any).textShadowBlur,
            backgroundShadow: (clipData as any).backgroundShadow,
            paddingTop: (clipData as any).paddingTop,
            paddingRight: (clipData as any).paddingRight,
            paddingBottom: (clipData as any).paddingBottom,
            paddingLeft: (clipData as any).paddingLeft,
            textAlign: (clipData as any).textAlign,
            lineHeight: (clipData as any).lineHeight,
            letterSpacing: (clipData as any).letterSpacing,
            wordSpacing: (clipData as any).wordSpacing,
            fontWeight: (clipData as any).fontWeight,
            fontStyle: (clipData as any).fontStyle,
            textDecoration: (clipData as any).textDecoration,
            textStroke: (clipData as any).textStroke,
            textStrokeColor: (clipData as any).textStrokeColor,
            textStrokeWidth: (clipData as any).textStrokeWidth,
            id: clipData.id, // 서버 ID 보존
            baseClipProperties: clipData.baseClipProperties, // 기준 클립 속성 전달
            parentClipId: clipData.parentClipId // 부모 클립 ID 전달
          });
          break;

        case 'longsentence':
          // 📖 LongSentence 클립 - 긴 텍스트 자동 분할
          newClip = createLongSentenceClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            startTime: clipData.startTime,
            duration: clipData.duration || DEFAULT_LONGSENTENCE_DURATION,
            name: clipData.name,
            x: clipData.x,
            y: clipData.y,
            width: clipData.width,
            height: clipData.height,
            opacity: clipData.opacity,
            rotation: clipData.rotation,
            data: (clipData as any).data || [{ text: '', mediaUrl: '' }],
            maxWordsPerSentence: (clipData as any).maxWordsPerSentence,
            splitOnPunctuation: (clipData as any).splitOnPunctuation,
            generateTTS: (clipData as any).generateTTS,
            generateText: (clipData as any).generateText,
            generateSubtitles: (clipData as any).generateSubtitles,
            language: (clipData as any).language,
            voice: (clipData as any).voice,
            autoConvertOnEdit: (clipData as any).autoConvertOnEdit,
            preserveOriginal: (clipData as any).preserveOriginal,
            mediaProperties: (clipData as any).mediaProperties,
            id: clipData.id // 서버 ID 보존
          });
          break;

        case 'shape':
          // 🔶 기본 Shape 클립
          newClip = createShapeClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name,
            x: clipData.x,
            y: clipData.y,
            width: clipData.width,
            height: clipData.height,
            opacity: clipData.opacity,
            rotation: clipData.rotation,
            // 🎯 이펙트 속성들 추가 (서버에서 전달받은 속성 유실 방지)
            brightness: (clipData as any).brightness,
            contrast: (clipData as any).contrast,
            saturation: (clipData as any).saturation,
            hue: (clipData as any).hue,
            blur: (clipData as any).blur,
            sepia: (clipData as any).sepia,
            grayscale: (clipData as any).grayscale,
            fadeIn: (clipData as any).fadeIn,
            fadeOut: (clipData as any).fadeOut,
            animationType: (clipData as any).animationType,
            animationDuration: (clipData as any).animationDuration,
            animationDelay: (clipData as any).animationDelay,
            animationEasing: (clipData as any).animationEasing,
            animationLoop: (clipData as any).animationLoop,
            id: clipData.id // 서버 ID 보존
          });
          break;

        case 'simpleShape':
          // 🔹 단순 Shape 클립
          newClip = createSimpleShapeClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name,
            x: clipData.x,
            y: clipData.y,
            width: clipData.width,
            height: clipData.height,
            opacity: clipData.opacity,
            rotation: clipData.rotation,
            backgroundColor: (clipData as any).simpleShapeProperties?.backgroundColor,
            // 🎯 이펙트 속성들 추가 (서버에서 전달받은 속성 유실 방지)
            brightness: (clipData as any).brightness,
            contrast: (clipData as any).contrast,
            saturation: (clipData as any).saturation,
            hue: (clipData as any).hue,
            blur: (clipData as any).blur,
            sepia: (clipData as any).sepia,
            grayscale: (clipData as any).grayscale,
            fadeIn: (clipData as any).fadeIn,
            fadeOut: (clipData as any).fadeOut,
            animationType: (clipData as any).animationType,
            animationDuration: (clipData as any).animationDuration,
            animationDelay: (clipData as any).animationDelay,
            animationEasing: (clipData as any).animationEasing,
            animationLoop: (clipData as any).animationLoop,
            id: clipData.id // 서버 ID 보존
          });
          break;

        case 'polygonShape':
          // 🔺 다각형 Shape 클립
          console.log('🔺 PolygonShape 클립 생성 시작:', {
            서버ID: clipData.id,
            서버데이터: clipData,
            polygonShapeProperties: (clipData as any).polygonShapeProperties
          });
          newClip = createPolygonShapeClip({
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name,
            x: clipData.x,
            y: clipData.y,
            width: clipData.width,
            height: clipData.height,
            opacity: clipData.opacity,
            rotation: clipData.rotation,
            shapeType: (clipData as any).polygonShapeProperties?.shapeType,
            backgroundColor: (clipData as any).polygonShapeProperties?.backgroundColor,
            polygonShapeProperties: (clipData as any).polygonShapeProperties, // 🔺 서버에서 전달된 완전한 속성 객체
            // 🎯 이펙트 속성들 추가 (서버에서 전달받은 속성 유실 방지)
            brightness: (clipData as any).brightness,
            contrast: (clipData as any).contrast,
            saturation: (clipData as any).saturation,
            hue: (clipData as any).hue,
            blur: (clipData as any).blur,
            sepia: (clipData as any).sepia,
            grayscale: (clipData as any).grayscale,
            fadeIn: (clipData as any).fadeIn,
            fadeOut: (clipData as any).fadeOut,
            animationType: (clipData as any).animationType,
            animationDuration: (clipData as any).animationDuration,
            animationDelay: (clipData as any).animationDelay,
            animationEasing: (clipData as any).animationEasing,
            animationLoop: (clipData as any).animationLoop,
            id: clipData.id, // 서버 ID 보존
            parentClipId: clipData.parentClipId // 부모 클립 ID 전달
          });
          console.log('🔺 PolygonShape 클립 생성 완료:', {
            생성된ID: newClip.id,
            서버ID와동일: newClip.id === clipData.id,
            생성된클립: newClip
          });
          break;

        default:
          // 🚨 알 수 없는 타입 - 범용 생성 함수 사용
          console.warn('🚨 알 수 없는 미디어 타입:', clipData.mediaType);
          newClip = createClip(clipData.mediaType, {
            mediaId: clipData.mediaId,
            trackId: clipData.trackId,
            startTime: clipData.startTime,
            duration: clipData.duration,
            name: clipData.name
          }, clipData);
          break;
      }

      // 🔍 향상된 유효성 검사
      const validation = validateClip(newClip);
      if (!validation.isValid) {
        console.warn('🚨 클립 생성 경고:', {
          clipType: newClip.mediaType,
          clipId: newClip.id.slice(-8),
          errors: validation.errors
        });
        // 경고만 출력하고 계속 진행 (강제 생성 안함)
      }

      // 🆕 기준클립 속성은 이제 생성 함수에서 처리됨

      // 🆕 일반클립 속성 수동 설정
      if (clipData.regularClipProperties) {
        (newClip as any).regularClipProperties = clipData.regularClipProperties;

        console.log('📱 일반클립 속성 수동 설정:', {
          clipId: newClip.id.slice(-8),
          regularClipProperties: clipData.regularClipProperties
        });
      }

      console.log('🎆 타입별 최적화 클립 생성 성공:', {
        id: newClip.id.slice(-8),
        name: newClip.name,
        mediaType: newClip.mediaType,
        duration: newClip.duration.toFixed(2),
        hasVisualProps: 'x' in newClip,
        hasAudioProps: 'volume' in newClip,
        hasTextProps: 'text' in newClip,
        // 🆕 기준클립 속성 확인
        최종baseClipProperties: (newClip as any).baseClipProperties,
        최종regularClipProperties: (newClip as any).regularClipProperties,
        기준클립여부: (newClip as any).baseClipProperties?.isBaseClip === true
      });

      const targetTrack = state.tracks.find(track => track.id === clipData.trackId);
      const clipsBefore = targetTrack?.clips.length || 0;

      set({
        tracks: state.tracks.map(track =>
          track.id === clipData.trackId
            ? { ...track, clips: [...track.clips, newClip] }
            : track
        )
      });

      // 실제 추가 확인
      const clipsAfter = get().tracks.find(track => track.id === clipData.trackId)?.clips.length || 0;
      const actuallyAdded = clipsAfter > clipsBefore;
      const existsAfterAdd = !!get().getClipById(newClip.id);

      console.log('📊 addClip 실행 완료:', {
        clipId: newClip.id.slice(-8),
        trackId: clipData.trackId,
        클립수_이전: clipsBefore,
        클립수_이후: clipsAfter,
        실제추가됨: actuallyAdded,
        getClipById로_존재확인: existsAfterAdd,
        state변경됨: actuallyAdded && existsAfterAdd
      });

      // 변경사항 추적
      get().markAsChanged();

    } catch (error) {
      console.error('🚨 클립 생성 실패:', {
        mediaType: clipData.mediaType,
        error: error instanceof Error ? error.message : String(error)
      });

      // 🚑 폴백: 기존 방식으로 생성 시도
      const fallbackClip: NewTimelineClip = {
        ...clipData,
        id: generateId(),
        name: clipData.name || getDefaultClipName(clipData.mediaType)
      } as NewTimelineClip;

      set({
        tracks: state.tracks.map(track =>
          track.id === clipData.trackId
            ? { ...track, clips: [...track.clips, fallbackClip] }
            : track
        )
      });

      // 변경사항 추적 (폴백 케이스)
      get().markAsChanged();
    }
  },

  updateClip: (clipId, updates) => {
    const state = get();

    // 🔍 기존 클립 찾기 (NewTimelineClip 타입)
    const existingClip = state.tracks
      .flatMap(track => track.clips)
      .find(clip => clip.id === clipId) as NewTimelineClip | undefined;

    if (!existingClip) {
      console.warn('🚨 업데이트할 클립을 찾을 수 없음:', clipId.slice(-8));
      return;
    }

    // 🆕 Union 타입 안전한 업데이트 필터링
    const safeUpdates = filterValidUpdates(existingClip, updates);

    if (Object.keys(safeUpdates).length !== Object.keys(updates).length) {
      const filteredKeys = Object.keys(updates).filter(key => !(key in safeUpdates));
      console.warn(`🚨 ${existingClip.mediaType} 클립에 맞지 않는 속성 필터링:`, {
        clipId: clipId.slice(-8),
        clipType: existingClip.mediaType,
        filteredKeys,
        hasVisualProps: 'x' in existingClip,
        hasAudioProps: 'volume' in existingClip,
        hasTextProps: 'text' in existingClip
      });
    }

    // trackId 변경이 있는지 확인
    if (safeUpdates.trackId) {
      // 기존 클립 찾기
      let existingClip: NewTimelineClip | undefined;
      let oldTrackId: string | undefined;

      for (const track of state.tracks) {
        const clipIndex = track.clips.findIndex(c => c.id === clipId);
        if (clipIndex !== -1) {
          existingClip = track.clips[clipIndex] as NewTimelineClip;
          oldTrackId = track.id;
          break;
        }
      }

      if (existingClip && oldTrackId && oldTrackId !== safeUpdates.trackId) {
        // 트랙 간 이동: 기존 트랙에서 제거하고 새 트랙에 추가
        const updatedClip = { ...existingClip, ...safeUpdates } as NewTimelineClip;

        const newTracks = state.tracks.map(track => {
          if (track.id === oldTrackId) {
            // 기존 트랙에서 제거
            return {
              ...track,
              clips: track.clips.filter(clip => clip.id !== clipId)
            };
          } else if (track.id === safeUpdates.trackId) {
            // 새 트랙에 추가
            return {
              ...track,
              clips: [...track.clips, updatedClip]
            };
          }
          return track;
        });

        set({
          tracks: newTracks,
          selectedClip: state.selectedClip?.id === clipId ? updatedClip : state.selectedClip
        });

        // 변경사항 추적
        get().markAsChanged();

        console.log('🔄 클립 트랙 이동 성공:', {
          clipId: clipId.slice(-8),
          clipType: updatedClip.mediaType,
          from: oldTrackId,
          to: safeUpdates.trackId
        });
        return;
      }
    }

    // 자식 클립의 독립적인 이동 감지 및 처리
    if ((existingClip as any).parentClipId && 'startTime' in safeUpdates) {
      const parentClipId = (existingClip as any).parentClipId;
      console.log('🔄 자식 클립 독립 이동 감지:', {
        childId: clipId.slice(-8),
        parentId: parentClipId.slice(-8),
        독립이동: true
      });

      // 자식이 독립적으로 이동하는 경우 부모와의 연결을 유지하지만 동기화하지 않음
      // 필요에 따라 사용자가 명시적으로 unlink 할 수 있음
    }

    // 🚀 LongSentence 클립의 위치 변경 시 자식들도 함께 이동
    if (existingClip.mediaType === 'longsentence' && 'startTime' in safeUpdates) {
      const deltaTime = (safeUpdates.startTime as number) - existingClip.startTime;

      console.log('🔍 LongSentence 이동 감지:', {
        parentId: clipId.slice(-8),
        oldStartTime: existingClip.startTime.toFixed(2) + 's',
        newStartTime: safeUpdates.startTime?.toFixed(2) + 's',
        deltaTime: deltaTime.toFixed(2) + 's',
        hasChildClipIds: !!(existingClip as any).childClipIds,
        childClipCount: (existingClip as any).childClipIds?.length || 0
      });

      if (deltaTime !== 0) {
        // childClipIds를 직접 전달하여 자식들 이동
        const childClipIds = (existingClip as any).childClipIds || [];
        get().moveChildClips(clipId, deltaTime, childClipIds);
      }
    }

    // 🚀 일반적인 업데이트
    const newTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        // 부모 클립 업데이트
        if (clip.id === clipId) {
          const updatedClip = { ...clip, ...safeUpdates } as NewTimelineClip;
          console.log('📝 클립 업데이트 적용:', {
            clipId: clipId.slice(-8),
            safeUpdates: safeUpdates
          });
          return updatedClip;
        }

        return clip;
      })
    }));

    // selectedClip도 업데이트
    const updatedSelectedClip = state.selectedClip?.id === clipId
      ? { ...state.selectedClip, ...safeUpdates } as NewTimelineClip
      : state.selectedClip;

    set({
      tracks: newTracks,
      selectedClip: updatedSelectedClip
    });

    // 변경사항 추적
    get().markAsChanged();

    console.log('🔄 클립 업데이트 성공:', {
      clipId: clipId.slice(-8),
      clipType: existingClip.mediaType,
      updatedProps: Object.keys(safeUpdates),
      hasVisualProps: 'x' in existingClip,
      hasAudioProps: 'volume' in existingClip
    });
  },

  removeClip: (clipId) => {
    const state = get();
    const clipToRemove = get().getClipById(clipId);

    // 🚀 LongSentence 클립인 경우 자식 클립들도 함께 제거 (개선된 로직)
    let childClipIds: string[] = [];
    if (CLIP_DEBUG) {
      console.log('🔍 제거할 클립 분석:', {
        clipId: clipId.slice(-8),
        mediaType: clipToRemove?.mediaType,
        hasClip: !!clipToRemove
      });
    }

    if (clipToRemove && clipToRemove.mediaType === 'longsentence') {
      const longSentenceClip = clipToRemove as any;
      if (CLIP_DEBUG) {
        console.log('🔍 LongSentence 클립 상세:', {
          hasChildClipIds: !!longSentenceClip.childClipIds,
          childClipIds: longSentenceClip.childClipIds,
          childCount: longSentenceClip.childClipIds?.length || 0
        });
      }

      if (longSentenceClip.childClipIds && longSentenceClip.childClipIds.length > 0) {
        childClipIds = [...longSentenceClip.childClipIds];
        console.log('🗑️ LongSentence 부모 클립 제거로 인한 자식들 삭제:', {
          parentId: clipId.slice(-8),
          childCount: childClipIds.length,
          childIds: childClipIds.map(id => id.slice(-8))
        });
      } else if (CLIP_DEBUG) {
        console.log('⚠️ LongSentence 클립이지만 자식이 없음');
      }
    }

    const isSelectedClip = state.selectedClip?.id === clipId;

    set({
      tracks: state.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => {
          // 🎯 제거할 클립 자체 필터링
          if (clip.id === clipId) {
            console.log('🗑️ 부모 클립 제거:', {
              clipId: clip.id.slice(-8),
              type: clip.mediaType,
              name: clip.name
            });
            return false;
          }

          // 🎯 자식 클립들 필터링 (개선된 로직)
          if (childClipIds.length > 0 && childClipIds.includes(clip.id)) {
            console.log('🗑️ 자식 클립 제거:', {
              clipId: clip.id.slice(-8),
              type: clip.mediaType,
              name: clip.name,
              parentId: clipId.slice(-8)
            });
            return false;
          }

          return true;
        })
      })),
      selectedClips: state.selectedClips.filter(id => {
        // 부모 클립 제거
        if (id === clipId) return false;

        // 자식 클립들도 선택에서 제거
        if (childClipIds.includes(id)) {
          console.log('🗑️ 선택에서 자식 클립 제거:', id.slice(-8));
          return false;
        }

        return true;
      }),
      selectedClip: isSelectedClip || (state.selectedClip && childClipIds.includes(state.selectedClip.id)) ? null : state.selectedClip,
      isPropertiesPanelOpen: (isSelectedClip || (state.selectedClip && childClipIds.includes(state.selectedClip.id))) ? false : state.isPropertiesPanelOpen
    });

    // 변경사항 추적
    get().markAsChanged();

    // 🧪 개발용: 결과 검증
    if (childClipIds.length > 0) {
      setTimeout(() => {
        console.log('🔍 삭제 결과 검증:', {
          deletedParent: clipId.slice(-8),
          deletedChildren: childClipIds.map(id => id.slice(-8)),
          remainingClips: get().tracks.flatMap(t => t.clips).map(c => ({
            id: c.id.slice(-8),
            type: c.mediaType,
            name: c.name
          }))
        });
      }, 100);
    }
  },

  selectClips: (clipIds) => set({ selectedClips: clipIds }),

  // 🔍 Union 타입 기반 클립 찾기
  getClipById: (clipId) => {
    const state = get();
    const foundClip = state.tracks
      .flatMap(track => track.clips)
      .find(clip => clip.id === clipId);

    if (foundClip) {
      console.log('🔍 클립 찾기 성공:', {
        clipId: clipId.slice(-8),
        clipType: foundClip.mediaType,
        clipName: foundClip.name,
        hasVisualProps: 'x' in foundClip,
        hasAudioProps: 'volume' in foundClip,
        hasTextProps: 'text' in foundClip
      });
    }

    return foundClip as NewTimelineClip | undefined;
  },

  // LongSentence 클립의 자식 클립들만 삭제
  deleteChildClips: (parentClipId: string) => {
    const parentClip = get().getClipById(parentClipId);
    if (!parentClip || parentClip.mediaType !== 'longsentence') {
      console.warn('LongSentence 클립을 찾을 수 없습니다:', parentClipId);
      return;
    }

    console.log('🔍 부모 클립 상태 확인:', {
      parentId: parentClipId.slice(-8),
      parentClip: parentClip,
      hasChildClipIds: !!(parentClip as any).childClipIds,
      childClipIds: (parentClip as any).childClipIds
    });

    const longSentenceClip = parentClip as any;
    if (!longSentenceClip.childClipIds || longSentenceClip.childClipIds.length === 0) {
      console.log('삭제할 자식 클립이 없습니다:', {
        parentId: parentClipId.slice(-8),
        hasChildClipIds: !!longSentenceClip.childClipIds,
        childClipIdsLength: longSentenceClip.childClipIds?.length || 0,
        childClipIds: longSentenceClip.childClipIds
      });
      return;
    }

    console.log('🗑️ 자식 클립들 삭제 시작:', {
      parentId: parentClipId.slice(-8),
      childCount: longSentenceClip.childClipIds.length,
      childIds: longSentenceClip.childClipIds.map((id: string) => id.slice(-8))
    });

    const state = get();

    console.log('🔍 삭제 전 트랙 상태:', {
      totalTracks: state.tracks.length,
      tracksWithClips: state.tracks.map(track => ({
        trackId: track.id,
        clipCount: track.clips.length,
        clipIds: track.clips.map(c => c.id.slice(-8))
      }))
    });

    // 자식 클립들을 트랙에서 제거
    const newTracks = state.tracks.map(track => {
      const clipsBeforeFilter = track.clips.length;
      const filteredClips = track.clips.filter(clip => {
        // 자식 클립인지 확인
        if (longSentenceClip.childClipIds.includes(clip.id)) {
          console.log('🗑️ 자식 클립 제거:', {
            trackId: track.id,
            childId: clip.id.slice(-8),
            type: clip.mediaType,
            name: clip.name
          });
          return false; // 제거
        }
        return true; // 유지
      });
      
      if (clipsBeforeFilter !== filteredClips.length) {
        console.log('📊 트랙 클립 변경:', {
          trackId: track.id,
          이전: clipsBeforeFilter,
          이후: filteredClips.length,
          제거됨: clipsBeforeFilter - filteredClips.length
        });
      }
      
      return {
        ...track,
        clips: filteredClips
      };
    });

    // 선택된 클립들에서도 제거
    const newSelectedClips = state.selectedClips.filter(clipId =>
      !longSentenceClip.childClipIds.includes(clipId)
    );

    // 현재 선택된 클립이 자식 클립인 경우 선택 해제
    const newSelectedClip = state.selectedClip && longSentenceClip.childClipIds.includes(state.selectedClip.id)
      ? null
      : state.selectedClip;

    set({
      tracks: newTracks,
      selectedClips: newSelectedClips,
      selectedClip: newSelectedClip,
      isPropertiesPanelOpen: newSelectedClip ? state.isPropertiesPanelOpen : false
    });

    // 부모 클립의 childClipIds 초기화
    get().updateClip(parentClipId, { childClipIds: [] });

    console.log('✅ 자식 클립들 삭제 완료:', {
      parentId: parentClipId.slice(-8),
      deletedCount: longSentenceClip.childClipIds.length
    });
  },

  // LongSentence 클립 재생성 (기존 자식 클립들 삭제 후 새로 생성)
  regenerateLongSentenceClips: async (clipId: string) => {
    const clip = get().getClipById(clipId);
    if (!clip || clip.mediaType !== 'longsentence') {
      console.warn('LongSentence 클립을 찾을 수 없습니다:', clipId);
      return;
    }

    console.log('🔄 LongSentence 클립 재생성 시작:', {
      clipId: clipId.slice(-8),
      현재상태: (clip as any).conversionStatus
    });

    // 기존 자식 클립들 삭제
    get().deleteChildClips(clipId);

    // 새로 변환 실행 (convertLongSentence는 다른 곳에서 정의됨)
    // await get().convertLongSentence(clipId);

    console.log('✅ LongSentence 클립 재생성 완료:', {
      clipId: clipId.slice(-8)
    });
  },

  // 자식 클립을 부모로부터 분리
  unlinkChildClipFromParent: (childClipId: string) => {
    const childClip = get().getClipById(childClipId);
    if (!childClip || !(childClip as any).parentClipId) {
      console.warn('자식 클립을 찾을 수 없거나 부모가 없습니다:', childClipId);
      return;
    }

    const parentClipId = (childClip as any).parentClipId;
    const parentClip = get().getClipById(parentClipId);

    if (parentClip && parentClip.mediaType === 'longsentence') {
      const longSentenceClip = parentClip as any;

      // 부모의 childClipIds에서 제거
      if (longSentenceClip.childClipIds) {
        const updatedChildIds = longSentenceClip.childClipIds.filter((id: string) => id !== childClipId);
        get().updateClip(parentClipId, { childClipIds: updatedChildIds });
      }

      // 자식의 parentClipId 제거
      get().updateClip(childClipId, { parentClipId: undefined });

      console.log('🔗 자식 클립 분리 완료:', {
        childId: childClipId.slice(-8),
        parentId: parentClipId.slice(-8)
      });
    }
  },

  // 자식 클립들 이동
  moveChildClips: (parentClipId: string, deltaTime: number, childClipIds?: string[]) => {
    // childClipIds가 전달되지 않으면 부모 클립에서 조회
    let targetChildClipIds = childClipIds;

    if (!targetChildClipIds) {
      const parentClip = get().getClipById(parentClipId);
      if (!parentClip || parentClip.mediaType !== 'longsentence') {
        console.warn('부모 LongSentence 클립을 찾을 수 없습니다:', parentClipId);
        return;
      }
      targetChildClipIds = (parentClip as any).childClipIds || [];
    }

    if (!targetChildClipIds || targetChildClipIds.length === 0) {
      console.log('이동할 자식 클립이 없습니다:', parentClipId.slice(-8));
      return;
    }

    console.log('↔️ 자식 클립들 이동 시작:', {
      parentId: parentClipId.slice(-8),
      deltaTime: deltaTime.toFixed(2) + 's',
      childCount: targetChildClipIds.length,
      childIds: targetChildClipIds.map((id: string) => id.slice(-8))
    });

    const state = get();

    // 자식 클립들을 직접 업데이트 (updateClip 재귀 호출 방지)
    const newTracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (targetChildClipIds.includes(clip.id)) {
          const newStartTime = clip.startTime + deltaTime;
          const newEndTime = clip.endTime + deltaTime;

          console.log('↔️ 자식 클립 이동:', {
            childId: clip.id.slice(-8),
            oldStartTime: clip.startTime.toFixed(2) + 's',
            newStartTime: newStartTime.toFixed(2) + 's',
            deltaTime: deltaTime.toFixed(2) + 's'
          });

          return {
            ...clip,
            startTime: newStartTime,
            endTime: newEndTime
          };
        }
        return clip;
      })
    }));

    set({ tracks: newTracks });

    // 이동 후 자식 클립들의 실제 위치 확인
    const updatedState = get();
    const childClipPositions = targetChildClipIds.map(childId => {
      const childClip = updatedState.tracks
        .flatMap(track => track.clips)
        .find(clip => clip.id === childId);
      return {
        id: childId.slice(-8),
        startTime: childClip ? childClip.startTime.toFixed(2) + 's' : 'NOT_FOUND',
        endTime: childClip ? childClip.endTime.toFixed(2) + 's' : 'NOT_FOUND'
      };
    });

    console.log('✅ 자식 클립들 이동 완료:', {
      parentId: parentClipId.slice(-8),
      deltaTime: deltaTime.toFixed(2) + 's',
      movedCount: targetChildClipIds.length,
      childPositions: childClipPositions
    });
  },
});

// 디버깅 모드 설정
const CLIP_DEBUG = import.meta.env.VITE_CLIP_DEBUG === 'true';

// 🧪 개발용: 부모-자식 관계 테스트 함수들 (브라우저 콘솔에서 사용 가능)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testParentChildSystem = {
    // 현재 모든 LongSentence 클립과 자식들 조회
    getAllLongSentenceClips: () => {
      const store = (window as any).getEditorStore?.() || (window as any).editorStore;
      if (!store) {
        console.error('❌ Editor store not found');
        return 'Editor store not found';
      }

      console.log('🔍 현재 트랙 상태:', {
        trackCount: store.tracks?.length,
        totalClips: store.tracks?.flatMap((track: any) => track.clips)?.length || 0
      });

      const allClips = store.tracks?.flatMap((track: any) => track.clips) || [];
      const longSentenceClips = allClips
        .filter((clip: any) => clip.mediaType === 'longsentence')
        .map((clip: any) => ({
          id: clip.id.slice(-8),
          fullId: clip.id,
          name: clip.name,
          text: clip.text?.substring(0, 50) + '...',
          childClipIds: clip.childClipIds?.map((id: string) => id.slice(-8)) || [],
          childClipIdsRaw: clip.childClipIds || [],
          position: clip.startTime.toFixed(2) + 's',
          hasChildren: !!(clip.childClipIds && clip.childClipIds.length > 0)
        }));

      console.log('📊 LongSentence 클립 통계:', {
        totalLongSentenceClips: longSentenceClips.length,
        clipsWithChildren: longSentenceClips.filter((c: any) => c.hasChildren).length
      });

      console.table(longSentenceClips);
      return longSentenceClips;
    },

    // 모든 자식 클립들 조회
    getAllChildClips: () => {
      const store = (window as any).getEditorStore?.() || (window as any).editorStore;
      if (!store) return 'Editor store not found';

      const childClips = store.tracks
        .flatMap((track: any) => track.clips)
        .filter((clip: any) => clip.parentClipId)
        .map((clip: any) => ({
          id: clip.id.slice(-8),
          type: clip.mediaType,
          name: clip.name,
          parentId: clip.parentClipId?.slice(-8),
          position: clip.startTime.toFixed(2) + 's'
        }));

      console.table(childClips);
      return childClips;
    },

    // 특정 LongSentence 클립 삭제 테스트
    testDeleteParent: (clipId: string) => {
      const store = (window as any).getEditorStore?.() || (window as any).editorStore;
      if (!store) return 'Editor store not found';

      const fullClipId = store.tracks
        .flatMap((track: any) => track.clips)
        .find((clip: any) => clip.id.endsWith(clipId))?.id;

      if (!fullClipId) return `Clip with ID ending in ${clipId} not found`;

      console.log('🧪 부모 삭제 테스트 시작:', fullClipId.slice(-8));
      store.removeClip(fullClipId);

      return 'Parent deletion initiated - check console for results';
    },

    // 특정 LongSentence 클립 이동 테스트
    testMoveParent: (clipId: string, newStartTime: number) => {
      const store = (window as any).getEditorStore?.() || (window as any).editorStore;
      if (!store) return 'Editor store not found';

      const fullClipId = store.tracks
        .flatMap((track: any) => track.clips)
        .find((clip: any) => clip.id.endsWith(clipId))?.id;

      if (!fullClipId) return `Clip with ID ending in ${clipId} not found`;

      console.log('🧪 부모 이동 테스트 시작:', {
        clipId: fullClipId.slice(-8),
        newStartTime: newStartTime + 's'
      });

      store.updateClip(fullClipId, { startTime: newStartTime });

      return 'Parent movement initiated - check console for results';
    }
  };

  console.log('🧪 부모-자식 관계 테스트 함수들이 window.testParentChildSystem에 등록되었습니다');
  console.log('사용법:');
  console.log('- testParentChildSystem.getAllLongSentenceClips() // 모든 부모 클립 조회');
  console.log('- testParentChildSystem.getAllChildClips() // 모든 자식 클립 조회');
  console.log('- testParentChildSystem.testDeleteParent("1234") // 부모 삭제 테스트');
  console.log('- testParentChildSystem.testMoveParent("1234", 10) // 부모 이동 테스트');
}

// 클립 조작 상태 추적을 위한 인터페이스
export interface ClipManipulationState {
  isDraggingClip: boolean;
  isResizingClip: boolean;
  draggedClipId: string | null;
  resizedClipId: string | null;
  needsTimeSync: boolean; // 시간 동기화 필요 플래그
}

// 클립 조작 액션 타입
export interface ClipManipulationActions {
  setClipDragging: (isDragging: boolean, clipId: string | null) => void;
  setClipResizing: (isResizing: boolean, clipId: string | null) => void;
  setNeedsTimeSync: (needsSync: boolean) => void;
}

export const createClipManipulationActions: StateCreator<
  ClipManipulationState & ClipManipulationActions,
  [],
  [],
  ClipManipulationActions
> = (set, _get) => ({
  // 🎯 클립 조작 상태 관리 액션들
  setClipDragging: (isDragging: boolean, clipId: string | null = null) => {
    set({
      isDraggingClip: isDragging,
      draggedClipId: isDragging ? clipId : null
    });
  },

  setClipResizing: (isResizing: boolean, clipId: string | null = null) => {
    set({
      isResizingClip: isResizing,
      resizedClipId: isResizing ? clipId : null
    });
  },

  // 🎯 시간 동기화 플래그 관리
  setNeedsTimeSync: (needsSync: boolean) => {
    set({ needsTimeSync: needsSync });
  },
});

// LongSentence 클립 전용 액션들
export interface LongSentenceActions {
  createLongSentenceClip: (trackIndex: number, startTime: number, initialData?: Array<{ text: string; mediaUrl: string }>) => void;
  updateLongSentenceConversion: (clipId: string, updates: any) => void;
  convertLongSentence: (clipId: string) => Promise<void>;
  regenerateLongSentenceClips: (clipId: string) => Promise<void>;
  previewLongSentenceSplit: (text: string, options: any) => Promise<any>;
}

export const createLongSentenceActions: StateCreator<
  ClipState & ClipActions & LongSentenceActions,
  [],
  [],
  LongSentenceActions
> = (_set, get) => ({
  createLongSentenceClip: (trackIndex: number, startTime: number, initialData?: Array<{ text: string; mediaUrl: string }>) => {
    const tracks = get().tracks;
    const targetTrack = tracks[trackIndex];

    if (!targetTrack) {
      console.warn('트랙을 찾을 수 없습니다:', trackIndex);
      return;
    }

    const newClip = {
      id: generateId(),
      mediaType: 'longsentence' as const,
      mediaId: generateId(),
      trackId: targetTrack.id,
      name: '긴 문장 클립',
      startTime,
      duration: DEFAULT_LONGSENTENCE_DURATION,
      data: initialData || [{ text: '', mediaUrl: '' }],

      // 시각적 속성
      x: 0,
      y: 0,
      width: 800,
      height: 100,
      opacity: 1,
      rotation: 0,

      // 분할 설정
      maxWordsPerSentence: 15,
      splitOnPunctuation: true,
      generateTTS: true,
      generateText: true, // 텍스트 클립 생성
      generateSubtitles: true, // Whisper 활성화 (디버깅용)
      language: 'ko' as const,
      voice: 'ko-KR-Standard-A',

      // 변환 상태
      conversionStatus: 'pending' as const,
      conversionProgress: 0,
      generatedClips: [],

      // 변환 설정
      autoConvertOnEdit: false,
      preserveOriginal: false,

      // 미디어 클립 속성
      mediaProperties: {
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        opacity: 1,
        rotation: 0,
      },
    };

    get().addClip(newClip);
  },

  updateLongSentenceConversion: (clipId: string, updates: any) => {
    console.log('🔄 updateLongSentenceConversion 호출:', {
      clipId: clipId.slice(-8),
      updates: updates,
      hasChildClipIds: 'childClipIds' in updates,
      childClipIdsLength: updates.childClipIds?.length
    });
    get().updateClip(clipId, updates);
  },

  convertLongSentence: async (clipId: string) => {
    const clip = get().getClipById(clipId);
    if (!clip || clip.mediaType !== 'longsentence') {
      console.warn('LongSentence 클립을 찾을 수 없습니다:', clipId);
      return;
    }

    // 기존 자식 클립들 삭제 (재생성의 경우)
    const existingClip = get().getClipById(clipId);
    if (existingClip && (existingClip as any).childClipIds && (existingClip as any).childClipIds.length > 0) {
      console.log('🔄 LongSentence 재생성: 기존 자식 클립들 삭제');
      get().deleteChildClips(clipId);
    }

    // 변환 상태 업데이트
    get().updateLongSentenceConversion(clipId, {
      conversionStatus: 'processing',
      conversionProgress: 0,
      errorMessage: undefined
    });

    try {
      // 실제 API 호출을 위한 동적 import
      const { LongSentenceApi } = await import('../../services/api/longSentenceApi');

      // 진행률 구독
      const progressSubscription = LongSentenceApi.subscribeToProgress(clipId, (progress) => {
        get().updateLongSentenceConversion(clipId, {
          conversionProgress: progress.progress
        });
      });

      // 기준트랙 찾기
      const state = get();
      const baseTrack = state.tracks.find(track => isBaseTrack(track));
      const baseTrackId = baseTrack?.id;
      
      console.log('🎯 기준트랙 정보:', {
        baseTrackId,
        baseTrackName: baseTrack?.name,
        longSentenceClipTrackId: clip.trackId,
        isOnBaseTrack: clip.trackId === baseTrackId
      });
      
      // 🔧 완전한 기본값이 포함된 클립 데이터 준비
      const { getCompleteClipForServer } = await import('../../constants/longSentenceDefaults');
      const completeClip = getCompleteClipForServer(clip);
      
      console.log('📤 서버로 전송할 완전한 클립 데이터:', {
        clipId: clipId.slice(-8),
        hasTextProperties: !!completeClip.textProperties,
        hasMediaProperties: !!completeClip.mediaProperties,
        textPropertiesKeys: Object.keys(completeClip.textProperties || {}),
        mediaPropertiesKeys: Object.keys(completeClip.mediaProperties || {}),
        borderColor: completeClip.mediaProperties?.borderColor
      });
      
      // 변환 실행 - 완전한 클립과 기준트랙 정보 전달
      const result = await LongSentenceApi.convertLongSentence(clipId, completeClip, baseTrackId);

      // 진행률 구독 종료
      progressSubscription.close();

      if (result.success) {
        // 변환 완료
        get().updateLongSentenceConversion(clipId, {
          conversionStatus: 'completed',
          conversionProgress: 100,
          generatedClips: result.generatedClips
        });

        // 생성된 클립들을 타임라인에 추가
        try {
          const { childClipIds } = processLongSentenceConversionResult(result, clipId, clip, get);
          
          console.log('✅ LongSentence 변환 완료:', {
            parentId: clipId.slice(-8),
            생성된자식클립수: childClipIds.length,
            childIds: childClipIds.map((id: string) => id.slice(-8))
          });

        } catch (conversionError) {
          console.error('❌ LongSentence 클립 변환 처리 실패:', {
            clipId: clipId.slice(-8),
            error: conversionError instanceof Error ? conversionError.message : String(conversionError)
          });
          
          get().updateLongSentenceConversion(clipId, {
            conversionStatus: 'failed',
            errorMessage: conversionError instanceof Error ? conversionError.message : 'Unknown error'
          });
          
          throw conversionError;
        }
      } else {
        throw new Error(result.error || '변환 실패');
      }

    } catch (error) {
      console.error('❌ LongSentence 변환 전체 실패:', {
        clipId: clipId.slice(-8),
        error: error instanceof Error ? error.message : String(error)
      });
      
      get().updateLongSentenceConversion(clipId, {
        conversionStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  previewLongSentenceSplit: async (text: string, options: any) => {
    try {
      // 실제 API 호출을 위한 동적 import
      const { LongSentenceApi } = await import('../../services/api/longSentenceApi');

      // 분할 미리보기 요청
      const result = await LongSentenceApi.previewSplit(text, options);
      return result;
    } catch (error) {
      console.error('분할 미리보기 실패:', error);
      throw error;
    }
  },



  // LongSentence 클립 재생성 (기존 자식 클립들 삭제 후 새로 생성)
  regenerateLongSentenceClips: async (clipId: string) => {
    const clip = get().getClipById(clipId);
    if (!clip || clip.mediaType !== 'longsentence') {
      console.warn('LongSentence 클립을 찾을 수 없습니다:', clipId);
      return;
    }

    console.log('🔄 LongSentence 클립 재생성 시작:', {
      clipId: clipId.slice(-8),
      현재상태: (clip as any).conversionStatus
    });

    // 기존 자식 클립들 삭제
    get().deleteChildClips(clipId);

    // 새로 변환 실행
    await get().convertLongSentence(clipId);

    console.log('✅ LongSentence 클립 재생성 완료:', {
      clipId: clipId.slice(-8)
    });
  },
});
