/**
 * 📖 longSentenceEngine.ts - 긴 문장 자동 분할 엔진 (4번 모듈)
 * 
 * 긴 텍스트를 자동으로 문장 단위로 분할하고 TTS 생성, Whisper 동기화를 수행하는 핵심 엔진
 * 복잡한 미디어 + 텍스트 조합을 자동으로 개별 클립들로 변환
 * 
 * 주요 기능:
 * - 지능형 문장 분할 (구두점, 단어 수 기반)
 * - Google TTS 자동 생성 (53개 언어 지원)
 * - Whisper 정밀 동기화 (단어 레벨 타이밍)
 * - 미디어-텍스트 매칭 시스템
 * - 텍스트 속성 완전 복사
 * - 시간 간격 자동 계산
 * 
 * 처리 파이프라인:
 * 1. 텍스트 분할 (SentenceSplitter)
 * 2. TTS 오디오 생성 (GoogleTTSService)
 * 3. Whisper 자막 생성 (WhisperService)
 * 4. 미디어 클립 생성 (MediaUtils)
 * 5. 텍스트 클립 생성 (TextUtils)
 * 6. 시간 동기화 및 배치
 * 
 * 생성되는 클립 타입:
 * - SentenceClip: 개별 문장 텍스트
 * - AudioClip: TTS 생성 오디오
 * - ImageClip/VideoClip: 연결된 미디어
 * 
 * 고급 기능:
 * - 스마트 텍스트 매칭 (정확도 최적화)
 * - 단어 레벨 타이밍 (millisecond 정밀도)
 * - 텍스트 속성 완전 상속
 * - 시간 간격 커스터마이징
 */

import { SentenceSplitter } from '../textProcessing/sentenceSplitter';
import { GoogleTTSService } from '../tts/googleTTS';
import { WhisperService } from '../whisper/whisperService';
import { TextUtils } from './modules/text-utils';
import { MediaUtils } from './modules/media-utils';

// 클라이언트와 동일한 ID 생성 함수
const generateClipId = () => `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

import * as path from 'path';
import * as fs from 'fs/promises';

export class LongSentenceEngine {
  private sentenceSplitter: SentenceSplitter;
  private ttsService: GoogleTTSService;
  private whisperService: WhisperService | null = null;

  constructor() {
    this.sentenceSplitter = new SentenceSplitter();
    this.ttsService = new GoogleTTSService();
    // WhisperService는 싱글톤으로 초기화
    this.initializeWhisperService();
  }

  private async initializeWhisperService() {
    try {
      this.whisperService = await WhisperService.getInstance();
    } catch (error) {
      console.error('[LongSentenceEngine] Whisper 서비스 초기화 실패:', error);
      // 실패해도 TTS는 작동할 수 있도록 null로 설정
      this.whisperService = null;
    }
  }

  /**
   * 🔥 longSentence 클립의 모든 텍스트 속성을 완전히 복사 (텍스트 전용)
   */
  private copyAllTextProperties(longSentenceClip: any): any {
    const textProps = longSentenceClip.textProperties || {};

    console.log('🔍 copyAllTextProperties 호출:', {
      clipId: longSentenceClip.id?.slice(-8),
      textProperties: textProps,
      hasEffects: !!(textProps.brightness || textProps.contrast || textProps.saturation),
      // 🔧 패딩 및 배경 속성 디버깅
      패딩속성들: {
        paddingTop: longSentenceClip.paddingTop || textProps.paddingTop,
        paddingRight: longSentenceClip.paddingRight || textProps.paddingRight,
        paddingBottom: longSentenceClip.paddingBottom || textProps.paddingBottom,
        paddingLeft: longSentenceClip.paddingLeft || textProps.paddingLeft,
      },
      배경속성: {
        backgroundColor: longSentenceClip.backgroundColor,
        isGradient: longSentenceClip.backgroundColor?.includes('gradient')
      }
    });

    return {
      // 📝 텍스트 전용 좌표와 사이즈 (textProperties에서만 가져오기)
      x: textProps.x !== undefined ? textProps.x : 0,
      y: textProps.y !== undefined ? textProps.y : 0,
      width: textProps.width !== undefined ? textProps.width : 1920,
      height: textProps.height !== undefined ? textProps.height : 100,
      opacity: textProps.opacity !== undefined ? textProps.opacity : 1.0,
      rotation: textProps.rotation !== undefined ? textProps.rotation : 0,

      // 텍스트 스타일링 속성 (textProperties에서만 가져오기)
      fontSize: textProps.fontSize !== undefined ? textProps.fontSize : 24,
      fontFamily: textProps.fontFamily || 'Arial',
      fontWeight: textProps.fontWeight || 'normal',
      fontStyle: textProps.fontStyle || 'normal',
      color: textProps.color || '#FFFFFF',
      backgroundColor: textProps.backgroundColor || 'transparent',
      textAlign: textProps.textAlign || 'left',
      textDecoration: textProps.textDecoration || 'none',
      lineHeight: textProps.lineHeight !== undefined ? textProps.lineHeight : 1.2,
      letterSpacing: textProps.letterSpacing !== undefined ? textProps.letterSpacing : 0,
      wordSpacing: textProps.wordSpacing !== undefined ? textProps.wordSpacing : 0,

      // 텍스트 그림자 (textProperties에서만 가져오기)
      textShadow: textProps.textShadow,
      textShadowColor: textProps.textShadowColor,
      textShadowOffsetX: textProps.textShadowOffsetX,
      textShadowOffsetY: textProps.textShadowOffsetY,
      textShadowBlur: textProps.textShadowBlur,

      // 텍스트 효과 (textProperties에서만 가져오기)
      textStroke: textProps.textStroke,
      textStrokeColor: textProps.textStrokeColor,
      textStrokeWidth: textProps.textStrokeWidth,

      // 🔧 패딩 속성들 (textProperties에서만 가져오기)
      paddingTop: textProps.paddingTop,
      paddingRight: textProps.paddingRight,
      paddingBottom: textProps.paddingBottom,
      paddingLeft: textProps.paddingLeft,

      // 🎨 둥근 테두리 (textProperties에서만 가져오기)
      borderRadius: textProps.borderRadius,
      borderRadiusUnit: textProps.borderRadiusUnit,

      // 🎯 EffectsEditor 속성들 (textProperties에서만 가져오기)
      // 페이드 효과
      fadeIn: textProps.fadeIn !== undefined ? textProps.fadeIn : 0,
      fadeOut: textProps.fadeOut !== undefined ? textProps.fadeOut : 0,

      // 시각 필터
      brightness: textProps.brightness !== undefined ? textProps.brightness : 100,
      contrast: textProps.contrast !== undefined ? textProps.contrast : 100,
      saturation: textProps.saturation !== undefined ? textProps.saturation : 100,
      hue: textProps.hue !== undefined ? textProps.hue : 0,
      blur: textProps.blur !== undefined ? textProps.blur : 0,
      sepia: textProps.sepia !== undefined ? textProps.sepia : 0,
      grayscale: textProps.grayscale !== undefined ? textProps.grayscale : 0,

      // 애니메이션
      animationType: textProps.animationType,
      animationDuration: textProps.animationDuration !== undefined ? textProps.animationDuration : 1,
      animationDelay: textProps.animationDelay !== undefined ? textProps.animationDelay : 0,
      animationEasing: textProps.animationEasing || 'ease',
      animationLoop: textProps.animationLoop !== undefined ? textProps.animationLoop : false,

      // 기타 속성들 (textProperties에서 가져오기, fallback은 기본값)
      zIndex: textProps.zIndex,
      transform: textProps.transform,
      filter: textProps.filter,

      // Sentence 전용 속성들 (longSentenceClip에서 가져오기)
      textSegments: longSentenceClip.textSegments || [],
      segmentOverlapMode: longSentenceClip.segmentOverlapMode || 'priority',
      enableRealTimePreview: longSentenceClip.enableRealTimePreview !== false,

      // textProperties의 추가 속성들 (위에서 명시적으로 처리하지 않은 것들)
      ...Object.keys(textProps)
        .filter(key => ![
          'x', 'y', 'width', 'height', 'opacity', 'rotation',
          'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'color', 'backgroundColor',
          'textAlign', 'textDecoration', 'lineHeight', 'letterSpacing', 'wordSpacing',
          'textShadow', 'textShadowColor', 'textShadowOffsetX', 'textShadowOffsetY', 'textShadowBlur',
          'textStroke', 'textStrokeColor', 'textStrokeWidth',
          'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
          'borderRadius', 'borderRadiusUnit',
          'fadeIn', 'fadeOut', 'brightness', 'contrast', 'saturation', 'hue', 'blur', 'sepia', 'grayscale',
          'animationType', 'animationDuration', 'animationDelay', 'animationEasing', 'animationLoop',
          'zIndex', 'transform', 'filter'
        ].includes(key))
        .reduce((acc, key) => {
          acc[key] = textProps[key];
          return acc;
        }, {} as any)
    };
  }

  /**
   * 🔥 longSentence 클립의 모든 시각적 속성을 완전히 복사 (미디어 전용)
   */
  private copyAllVisualProperties(longSentenceClip: any): any {
    const mediaProps = longSentenceClip.mediaProperties || {};

    console.log('📊 copyAllVisualProperties 호출:', {
      clipId: longSentenceClip.id?.slice(-8),
      mediaProperties: mediaProps,
      hasEffects: !!(mediaProps.brightness || mediaProps.contrast || mediaProps.saturation),
      longSentenceClip_x: longSentenceClip.x,
      longSentenceClip_y: longSentenceClip.y,
      longSentenceClip_width: longSentenceClip.width,
      longSentenceClip_height: longSentenceClip.height,
      mediaProps_x: mediaProps.x,
      mediaProps_y: mediaProps.y,
      mediaProps_width: mediaProps.width,
      mediaProps_height: mediaProps.height,
      전체mediaProperties: mediaProps
    });

    // 🔥 클라이언트에서 보낸 mediaProperties를 그대로 사용 (기본값 지정 안함)
    const result = {
      // 🖼️ 이미지 전용 좌표와 사이즈 (mediaProperties에서 그대로 사용)
      x: mediaProps.x,
      y: mediaProps.y,
      width: mediaProps.width,
      height: mediaProps.height,
      opacity: mediaProps.opacity,
      rotation: mediaProps.rotation,

      // 추가 시각적 속성
      zIndex: mediaProps.zIndex,
      transform: mediaProps.transform,
      filter: mediaProps.filter,

      // mediaProperties의 모든 속성 (이미지 효과들)
      ...(mediaProps.filters && { filters: mediaProps.filters }),
      ...(mediaProps.effects && { effects: mediaProps.effects }),
      ...(mediaProps.crop && { crop: mediaProps.crop }),

      // 🎯 EffectsEditor 속성들 (mediaProperties에서 복사)
      // 페이드 효과
      fadeIn: mediaProps.fadeIn || 0,
      fadeOut: mediaProps.fadeOut || 0,

      // 시각 필터
      brightness: mediaProps.brightness || 100,
      contrast: mediaProps.contrast || 100,
      saturation: mediaProps.saturation || 100,
      hue: mediaProps.hue || 0,
      blur: mediaProps.blur || 0,
      sepia: mediaProps.sepia || 0,
      grayscale: mediaProps.grayscale || 0,

      // 애니메이션
      animationType: mediaProps.animationType,
      animationDuration: mediaProps.animationDuration || 1,
      animationDelay: mediaProps.animationDelay || 0,
      animationEasing: mediaProps.animationEasing || 'ease',
      animationLoop: mediaProps.animationLoop || false,

      // 🎯 ImagePropertiesEditor 속성들 명시적 추가
      // 이미지 핏과 위치
      backgroundFit: mediaProps.backgroundFit,
      backgroundPosition: mediaProps.backgroundPosition,

      // 둥근 테두리
      borderRadius: mediaProps.borderRadius,
      borderRadiusUnit: mediaProps.borderRadiusUnit,

      // 가장자리 페이드
      edgeFade: mediaProps.edgeFade,
      fadeType: mediaProps.fadeType,
      edgeFadeStops: mediaProps.edgeFadeStops,

      // 테두리 스트로크
      borderWidth: mediaProps.borderWidth,
      borderColor: mediaProps.borderColor,

      // 그림자 효과 (완전한 속성 세트)
      shadowEnabled: mediaProps.shadowEnabled,
      shadowOffsetX: mediaProps.shadowOffsetX,
      shadowOffsetY: mediaProps.shadowOffsetY,
      shadowBlur: mediaProps.shadowBlur,
      shadowColor: mediaProps.shadowColor,
      shadowSpread: mediaProps.shadowSpread,
      shadowOpacity: mediaProps.shadowOpacity,

      // 내부 그림자 (완전한 속성 세트)
      innerShadowEnabled: mediaProps.innerShadowEnabled,
      innerShadowOffsetX: mediaProps.innerShadowOffsetX,
      innerShadowOffsetY: mediaProps.innerShadowOffsetY,
      innerShadowBlur: mediaProps.innerShadowBlur,
      innerShadowColor: mediaProps.innerShadowColor,
      innerShadowOpacity: mediaProps.innerShadowOpacity,

      // 글로우 효과
      glowEnabled: mediaProps.glowEnabled,
      glowColor: mediaProps.glowColor,
      glowSize: mediaProps.glowSize,
      glowIntensity: mediaProps.glowIntensity,

      // 추가 속성들 (미디어 전용) - ImagePropertiesEditor 속성 제외
      ...Object.keys(mediaProps)
        .filter(key => ![
          'x', 'y', 'width', 'height', 'opacity', 'rotation',
          'zIndex', 'transform', 'filter', 'filters', 'effects', 'crop',
          'fadeIn', 'fadeOut', 'brightness', 'contrast', 'saturation', 'hue', 'blur', 'sepia', 'grayscale',
          'animationType', 'animationDuration', 'animationDelay', 'animationEasing', 'animationLoop',
          // ImagePropertiesEditor 속성들 제외 (위에서 명시적으로 처리됨)
          'backgroundFit', 'backgroundPosition', 'borderRadius', 'borderRadiusUnit',
          'edgeFade', 'fadeType', 'edgeFadeStops', 'borderWidth', 'borderColor',
          'shadowEnabled', 'shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor', 'shadowSpread', 'shadowOpacity',
          'innerShadowEnabled', 'innerShadowOffsetX', 'innerShadowOffsetY', 'innerShadowBlur', 'innerShadowColor', 'innerShadowOpacity',
          'glowEnabled', 'glowColor', 'glowSize', 'glowIntensity'
        ].includes(key))
        .reduce((acc, key) => {
          acc[key] = mediaProps[key];
          return acc;
        }, {} as any)
    };


    return result;
  }

  /**
   * LongSentence 클립을 여러 클립으로 변환
   * 새로운 data 구조: Array<{text: string, mediaUrl: string}>
   */
  async convertLongSentence(
    longSentenceClip: any,
    baseTrackId?: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(10);

      // 새로운 data 구조 확인
      const hasValidData = longSentenceClip.data &&
        Array.isArray(longSentenceClip.data) &&
        longSentenceClip.data.length > 0 &&
        longSentenceClip.data.some((item: any) =>
          item.text && item.text.trim()
        );

      // 기존 text 속성 확인 (하위 호환성)
      const hasLegacyText = longSentenceClip.text && longSentenceClip.text.trim();

      if (!hasValidData && !hasLegacyText) {
        throw new Error('변환할 텍스트가 없습니다.');
      }

      // 기존 text를 data 구조로 변환 (하위 호환성)
      if (!hasValidData && hasLegacyText) {
        longSentenceClip.data = [{
          text: longSentenceClip.text,
          mediaUrl: ''
        }];
      }

      // 1. 각 data 항목의 텍스트를 분할
      const allGeneratedClips: GeneratedClipPair[] = [];
      let currentOffset = longSentenceClip.startTime;
      const dataOffsets: number[] = []; // 각 데이터 항목의 시작 오프셋 저장
      const mediaClipsByDataIndex: (any | null)[] = []; // 각 데이터 항목의 미디어 클립 저장

      for (let dataIndex = 0; dataIndex < longSentenceClip.data.length; dataIndex++) {
        dataOffsets.push(currentOffset); // 현재 데이터 항목의 시작점 저장
        const dataItem = longSentenceClip.data[dataIndex];
        const { text: itemText, mediaUrl } = dataItem;

        if (!itemText || itemText.trim() === '') {
          console.warn(`Skipping empty text at data index ${dataIndex}`);
          continue;
        }

        console.log(`🔄 Processing data item ${dataIndex + 1}/${longSentenceClip.data.length}: "${itemText.slice(0, 50)}..."`);

        // 텍스트 분할 (동적 재분배 활성화)
        const sentences = this.sentenceSplitter.splitText(itemText, {
          maxWordsPerSentence: longSentenceClip.maxWordsPerSentence,
          splitOnPunctuation: longSentenceClip.splitOnPunctuation,
          language: longSentenceClip.language,
          enableDynamicRedistribution: true, // 동적 재분배 활성화
          minWordsPerSentence: Math.max(3, Math.floor(longSentenceClip.maxWordsPerSentence * 0.3)) // 최소 3단어 또는 최대값의 30%
        });

        onProgress?.(20 + (dataIndex / longSentenceClip.data.length) * 60);

        // 2. 각 데이터 항목별로 클립 생성
        const itemGeneratedClips = await this.processDataItem(
          longSentenceClip,
          dataItem,
          sentences,
          currentOffset,
          dataIndex,
          baseTrackId,
          (progress) => onProgress ?? (20 + (dataIndex / longSentenceClip.data.length) * 60 + progress * 0.6 / longSentenceClip.data.length)
        );

        allGeneratedClips.push(...itemGeneratedClips);

        // 이 데이터 항목의 미디어 클립 저장
        const mediaClip = itemGeneratedClips.find(clip => clip.mediaClip)?.mediaClip || null;
        mediaClipsByDataIndex.push(mediaClip);

        // 다음 데이터 항목을 위한 오프셋 계산 (모든 클립 중 가장 늦게 끝나는 시간 기준)
        if (itemGeneratedClips.length > 0) {
          let maxEndTime = currentOffset;

          // 이번 데이터 항목에서 생성된 모든 클립의 종료 시간을 확인
          itemGeneratedClips.forEach(clipPair => {
            if (clipPair.sentenceClip) {
              const sentenceEndTime = clipPair.sentenceClip.startTime + clipPair.sentenceClip.duration;
              maxEndTime = Math.max(maxEndTime, sentenceEndTime);
            }
            if (clipPair.audioClip) {
              const audioEndTime = clipPair.audioClip.startTime + clipPair.audioClip.duration;
              maxEndTime = Math.max(maxEndTime, audioEndTime);
            }
            if (clipPair.mediaClip) {
              const mediaEndTime = clipPair.mediaClip.startTime + clipPair.mediaClip.duration;
              maxEndTime = Math.max(maxEndTime, mediaEndTime);
            }
          });

          // 오디오와 sentence 클립 중 가장 긴 것을 찾기 (미디어 제외)
          let maxNonMediaEndTime = currentOffset;
          itemGeneratedClips.forEach(clipPair => {
            if (clipPair.sentenceClip) {
              const sentenceEndTime = clipPair.sentenceClip.startTime + clipPair.sentenceClip.duration;
              maxNonMediaEndTime = Math.max(maxNonMediaEndTime, sentenceEndTime);
            }
            if (clipPair.audioClip) {
              const audioEndTime = clipPair.audioClip.startTime + clipPair.audioClip.duration;
              maxNonMediaEndTime = Math.max(maxNonMediaEndTime, audioEndTime);
            }
          });

          currentOffset = maxNonMediaEndTime;
          console.log(`📏 현재 데이터 항목 완료 시간: ${currentOffset.toFixed(2)}초 (오디오/텍스트 기준)`)

          // timeSpace 적용 (마지막 데이터 항목이 아닌 경우에만)
          if (dataIndex < longSentenceClip.data.length - 1) {
            const timeSpace = longSentenceClip.timeSpace || 0;
            if (timeSpace > 0) {
              currentOffset += timeSpace;
              console.log(`⏱️ timeSpace 적용: +${timeSpace}초, 다음 시작: ${currentOffset.toFixed(2)}초`);
            }
          }
        }
      }

      // 다음 데이터 항목의 시작점 정보 추가
      dataOffsets.push(currentOffset); // 마지막 종료 지점 추가

      // 미디어 클립의 종료 시간 조정 (showMediaDuringTimeSpace가 true인 경우)
      const showMediaDuringTimeSpace = longSentenceClip.showMediaDuringTimeSpace !== false;
      if (showMediaDuringTimeSpace) {
        mediaClipsByDataIndex.forEach((mediaClip, dataIndex) => {
          if (mediaClip && dataIndex < mediaClipsByDataIndex.length - 1) {
            // 다음 데이터 항목의 시작점으로 미디어 클립 연장
            const nextDataStartTime = dataOffsets[dataIndex + 1];
            const oldEndTime = mediaClip.endTime;
            mediaClip.endTime = nextDataStartTime;
            mediaClip.duration = nextDataStartTime - mediaClip.startTime;
            console.log(`🔧 미디어 클립 재조정 (${mediaClip.name}):`);
            console.log(`   - 기존 종료: ${oldEndTime}초`);
            console.log(`   - 새 종료: ${mediaClip.endTime}초 (다음 데이터 시작점)`);
            console.log(`   - 새 길이: ${mediaClip.duration}초`);
          }
        });
      }

      onProgress?.(100);

      console.log('🏁 변환 완료, 결과 생성 중...', {
        generatedClipsCount: allGeneratedClips.length,
        totalDuration: currentOffset - longSentenceClip.startTime,
        sentenceClipsCount: allGeneratedClips.map(clip => clip.sentenceClip).filter(Boolean).length,
        audioClipsCount: allGeneratedClips.map(clip => clip.audioClip).filter(Boolean).length,
        mediaClipsCount: allGeneratedClips.map(clip => clip.mediaClip).filter(Boolean).length
      });

      const result = {
        success: true,
        generatedClips: allGeneratedClips,
        totalDuration: currentOffset - longSentenceClip.startTime,
        originalClip: longSentenceClip,
        splitSentences: allGeneratedClips.map(clip => clip.sentenceClip?.text || '').filter(Boolean),
        sentenceClips: allGeneratedClips.map(clip => clip.sentenceClip).filter(Boolean),
        audioClips: allGeneratedClips.map(clip => clip.audioClip).filter(Boolean),
        mediaClips: allGeneratedClips.map(clip => clip.mediaClip).filter(Boolean)
      };

      console.log('📦 최종 결과 객체 생성 완료');
      return result;

    } catch (error) {
      console.error('[LongSentenceEngine] 변환 중 오류:', error);
      throw error;
    }
  }

  /**
   * 생성 옵션에 따른 트랙 할당 규칙 결정
   */
  private determineTrackAssignment(longSentenceClip: any, baseTrackId?: string, isNestedEngine: boolean = true): {
    sentenceTrackId: string;
    audioTrackId: string;
    mediaTrackId: string;
    baseTrackId: string;
  } {
    const originalTrackId = longSentenceClip.trackId;
    // 기준트랙 ID 사용 (없으면 원본 트랙 사용)
    const targetBaseTrackId = baseTrackId || originalTrackId;

    // 트랙 ID 생성 규칙:
    // - 기준클립은 원본 트랙(기준트랙)에 배치
    // - 미디어 클립은 클라이언트에서 Layer 1로 배치 (특별 플래그 사용)
    let sentenceTrackId: string;
    let audioTrackId: string;
    let mediaTrackId: string;
    let resultBaseTrackId: string;

    // 미디어 클립은 특별한 플래그를 사용하여 클라이언트에서 처리
    const MEDIA_TO_LAYER_1_FLAG = '__LAYER_1__';

    if (longSentenceClip.generateTTS && longSentenceClip.generateText !== false) {
      // Text+Audio → NestedEngine 화면 레이어 순서 규칙
      if (isNestedEngine) {
        // 1. Audio: 기준 트랙에 배치
        audioTrackId = targetBaseTrackId;

        // 2. Sentence: 항상 track-1 (최상위)
        sentenceTrackId = 'track-1';

        // 3. Media: Layer 1 바로 위의 기준트랙이 아닌 트랙
        // 기준트랙이 track-N이면, track-(N-1)에 배치 (Layer 1에 더 가까운 트랙)
        const trackMatch = targetBaseTrackId.match(/track-(\d+)/);
        if (trackMatch) {
          const baseTrackNum = parseInt(trackMatch[1]);
          mediaTrackId = `track-${baseTrackNum - 1}`; // 기준트랙 바로 아래
        } else {
          mediaTrackId = targetBaseTrackId; // 패턴 매칭 실패시 기준트랙 사용
        }

        resultBaseTrackId = audioTrackId; // Audio가 기준
        console.log('🎯 NestedEngine 트랙 배치: Sentence→track-1, Audio→기준트랙, Media→기준트랙-1');
      } else {
        // 클라이언트: 기존 규칙 유지
        audioTrackId = targetBaseTrackId;
        sentenceTrackId = originalTrackId;
        mediaTrackId = MEDIA_TO_LAYER_1_FLAG;
        resultBaseTrackId = audioTrackId;
        console.log('🎯 클라이언트 트랙 배치: 기존 규칙 유지');
      }
    } else if (longSentenceClip.generateTTS && longSentenceClip.generateText === false) {
      // Audio only → Audio가 기준트랙에 배치
      audioTrackId = targetBaseTrackId;  // 기준클립: Audio가 기준트랙에
      sentenceTrackId = targetBaseTrackId; // Sentence는 생성되지 않음

      if (isNestedEngine) {
        // Media: Layer 1 바로 위의 기준트랙이 아닌 트랙
        const trackMatch = targetBaseTrackId.match(/track-(\d+)/);
        if (trackMatch) {
          const baseTrackNum = parseInt(trackMatch[1]);
          mediaTrackId = `track-${baseTrackNum - 1}`; // 기준트랙 바로 아래
        } else {
          mediaTrackId = targetBaseTrackId;
        }
      } else {
        mediaTrackId = MEDIA_TO_LAYER_1_FLAG;
      }

      resultBaseTrackId = audioTrackId; // Audio가 기준
      console.log(`🎯 트랙 배치 규칙 (${isNestedEngine ? 'NestedEngine' : 'Client'}): Audio only → Audio가 기준트랙에 배치`);
    } else {
      // Text only → Sentence가 기준트랙에 배치
      if (isNestedEngine) {
        // NestedEngine에서는 Sentence가 기준이므로 원래 트랙에 유지
        sentenceTrackId = targetBaseTrackId; // 기준클립: Sentence가 기준트랙에
        audioTrackId = targetBaseTrackId; // Audio는 생성되지 않음

        // Media: Layer 1 바로 위의 기준트랙이 아닌 트랙
        const trackMatch = targetBaseTrackId.match(/track-(\d+)/);
        if (trackMatch) {
          const baseTrackNum = parseInt(trackMatch[1]);
          mediaTrackId = `track-${baseTrackNum - 1}`; // 기준트랙 바로 아래
        } else {
          mediaTrackId = targetBaseTrackId;
        }
      } else {
        sentenceTrackId = targetBaseTrackId;
        audioTrackId = targetBaseTrackId;
        mediaTrackId = MEDIA_TO_LAYER_1_FLAG;
      }

      resultBaseTrackId = sentenceTrackId; // Sentence가 기준
      console.log(`🎯 트랙 배치 규칙 (${isNestedEngine ? 'NestedEngine' : 'Client'}): Text only → Sentence가 기준트랙에 배치`);
    }

    console.log('📍 트랙 할당 결과:', {
      originalTrackId,
      targetBaseTrackId,
      sentenceTrackId,
      audioTrackId,
      mediaTrackId,
      baseTrackId: resultBaseTrackId,
      generateTTS: longSentenceClip.generateTTS,
      generateText: longSentenceClip.generateText,
      트랙분리: sentenceTrackId !== audioTrackId ? '✅ 분리됨' : '❌ 같은 트랙'
    });

    return {
      sentenceTrackId,
      audioTrackId,
      mediaTrackId,
      baseTrackId: resultBaseTrackId
    };
  }

  /**
   * 개별 데이터 항목을 처리하여 클립들을 생성
   */
  private async processDataItem(
    longSentenceClip: any,
    dataItem: { text: string; mediaUrl: string },
    sentences: string[],
    startOffset: number,
    dataIndex: number,
    baseTrackId?: string,
    onProgress?: (progress: number) => void
  ): Promise<GeneratedClipPair[]> {
    const generatedClips: GeneratedClipPair[] = [];
    let currentOffset = startOffset;
    const { text: itemText, mediaUrl } = dataItem;

    // 트랙 할당 규칙 결정 (NestedEngine 환경임을 명시)
    const trackAssignment = this.determineTrackAssignment(longSentenceClip, baseTrackId, true);

    // 생성 옵션에 따라 처리
    if (longSentenceClip.generateTTS && longSentenceClip.generateText !== false) {
      // 2-1. 전체 텍스트로 하나의 TTS 생성 (자연스러운 흐름)
      onProgress?.(30);

      const fullTtsResult = await this.ttsService.generateAudio({
        text: itemText, // 이 데이터 항목의 텍스트만 사용
        language: longSentenceClip.language,
        voice: longSentenceClip.voice,
      });

      console.log(`🎵 TTS 오디오 생성 완료 (데이터 항목 ${dataIndex + 1}):`);
      console.log(`   - 오디오 파일: ${fullTtsResult.filePath}`);
      console.log(`   - 길이: ${fullTtsResult.duration}초`);
      console.log(`   - URL: ${fullTtsResult.url}`);

      onProgress?.(50);

      // 2-2. Whisper로 단어/문장별 정확한 타이밍 생성
      let whisperTimings: any[] = [];
      let subtitleFilePath: string | null = null;
      if (longSentenceClip.generateSubtitles && this.whisperService) {
        try {
          console.log(`🎤 Whisper 자막 생성 시작 (데이터 항목 ${dataIndex + 1}):`);
          console.log(`   - 원본 오디오: ${fullTtsResult.filePath}`);
          console.log(`   - 언어: ${longSentenceClip.language}`);

          whisperTimings = await this.whisperService.generateSubtitlesWithCache(
            fullTtsResult.filePath,
            longSentenceClip.language
          );

          // 자막 파일을 SRT 형식으로 저장
          if (whisperTimings && whisperTimings.length > 0) {
            const subtitleDir = path.join(process.cwd(), 'server', 'uploads', 'subtitles');
            await fs.mkdir(subtitleDir, { recursive: true });

            const timestamp = Date.now();
            const audioFileName = path.basename(fullTtsResult.filePath, path.extname(fullTtsResult.filePath));
            subtitleFilePath = path.join(subtitleDir, `${audioFileName}_${timestamp}.srt`);

            this.whisperService.generateSRTFile(whisperTimings, subtitleFilePath);

            console.log(`📄 자막 파일 저장 완료:`);
            console.log(`   - 자막 파일: ${subtitleFilePath}`);
            console.log(`   - 세그먼트 수: ${whisperTimings.length}개`);
            console.log(`   - 총 길이: ${whisperTimings[whisperTimings.length - 1]?.end || 0}초`);
          }
        } catch (error) {
          console.warn('Whisper 자막 생성 실패, 추정 타이밍 사용:', error);
        }
      }

      onProgress?.(70);

      // 2-3. Whisper 타이밍과 분할된 문장 매칭
      const timedSentences = this.matchSentencesWithTiming(sentences, whisperTimings, fullTtsResult.duration);

      // 2-4. 하나의 통합 오디오 클립 생성
      const unifiedAudioClip = {
        id: generateClipId(),
        mediaType: 'audio',
        name: `음성-${dataIndex + 1}`,
        startTime: currentOffset,
        duration: fullTtsResult.duration,
        endTime: currentOffset + fullTtsResult.duration,
        mediaUrl: fullTtsResult.url,
        volume: 1.0,
        playbackRate: 1.0,
        trackId: trackAssignment.audioTrackId, // 오디오 전용 트랙 사용
        parentClipId: longSentenceClip.id,

        // 기준 클립 속성 (Text+Audio 모드에서 Audio가 기준클립)
        baseClipProperties: {
          isBaseClip: trackAssignment.baseTrackId === trackAssignment.audioTrackId
        }
      };

      // 2-5. 미디어 클립 생성 (PolygonShape with background image)
      let mediaClip = null;
      if (mediaUrl && mediaUrl.trim() !== '') {
        const mediaType = MediaUtils.getMediaType(mediaUrl);

        // showMediaDuringTimeSpace에 따른 endTime 계산
        console.log(`\n🔷 PolygonShape 클립 생성 시작 (데이터 항목 ${dataIndex + 1})`);
        console.log(`   - currentOffset: ${currentOffset}초`);
        console.log(`   - fullTtsResult.duration: ${fullTtsResult.duration}초`);
        console.log(`   - timeSpace: ${longSentenceClip.timeSpace || 0}초`);
        console.log(`   - showMediaDuringTimeSpace: ${longSentenceClip.showMediaDuringTimeSpace !== false}`);
        console.log(`   - mediaUrl: ${mediaUrl}`);
        console.log(`   - mediaType: ${mediaType}`);

        let mediaEndTime = currentOffset + fullTtsResult.duration; // 기본: 오디오 끝나는 시점
        const showMediaDuringTimeSpace = longSentenceClip.showMediaDuringTimeSpace !== false; // 기본값 true
        const timeSpace = longSentenceClip.timeSpace || 0;

        // 마지막 데이터 항목이 아닌 경우에만 timeSpace 고려
        if (dataIndex < longSentenceClip.data.length - 1) {
          if (showMediaDuringTimeSpace) {
            // 미디어가 timeSpace 간격까지 포함해서 표시 (다음 데이터 항목 시작 전까지)
            const oldEndTime = mediaEndTime;
            mediaEndTime += timeSpace;
            console.log(`🔷 PolygonShape 클립 연장 (간격 포함):`);
            console.log(`   - 기존 종료: ${oldEndTime}초`);
            console.log(`   - timeSpace 추가: +${timeSpace}초`);
            console.log(`   - 새 종료: ${mediaEndTime}초`);
            console.log(`   - 총 길이: ${mediaEndTime - currentOffset}초`);
          } else {
            // 미디어가 오디오 끝나는 시점에서 종료 (timeSpace 간격 동안 숨김)
            console.log(`🔷 PolygonShape 클립 기본 길이 (간격 제외): ${currentOffset}초 ~ ${mediaEndTime}초 (${mediaEndTime - currentOffset}초)`);
          }
        } else {
          // 마지막 데이터 항목인 경우 오디오 길이와 동일
          console.log(`🔷 PolygonShape 클립 기본 길이 (마지막 항목): ${currentOffset}초 ~ ${mediaEndTime}초 (${mediaEndTime - currentOffset}초)`);
        }

        // 미디어 속성에서 기본값 가져오기
        const mediaProps = longSentenceClip.mediaProperties || {};

        // 🎨 미디어 타입에 따른 분기 처리
        if (mediaType === 'video') {
          // 🎬 비디오인 경우 일반 비디오 클립으로 생성
          mediaClip = {
            id: generateClipId(),
            mediaType: 'video',
            name: `배경비디오-${dataIndex + 1}`,
            startTime: currentOffset,
            duration: mediaEndTime - currentOffset,
            endTime: mediaEndTime,
            mediaUrl: mediaUrl,
            trackId: trackAssignment.mediaTrackId,
            parentClipId: longSentenceClip.id,

            // 🔥 longSentence 클립의 모든 시각적 속성을 완전히 복사
            ...this.copyAllVisualProperties(longSentenceClip),

            // 비디오 특화 속성
            volume: mediaProps.volume || 1.0,
            playbackRate: mediaProps.playbackRate || 1.0,
          };
        } else {
          // 🖼️ 이미지인 경우 PolygonShape 클립으로 생성
          mediaClip = {
            id: generateClipId(),
            mediaType: 'polygonShape',  // 🔷 PolygonShape로 변경
            name: `배경이미지-${dataIndex + 1}`,
            startTime: currentOffset,
            duration: mediaEndTime - currentOffset,
            endTime: mediaEndTime,
            trackId: trackAssignment.mediaTrackId,
            parentClipId: longSentenceClip.id,

            // 🔥 longSentence 클립의 모든 시각적 속성을 완전히 복사
            ...this.copyAllVisualProperties(longSentenceClip),

            // 🔷 PolygonShape 특화 속성
            polygonShapeProperties: {
              shapeType: 'rectangle',  // 기본 사각형
              backgroundType: 'image', // 🖼️ 이미지 배경
              backgroundImageUrl: (() => {
                // 🔧 상대 경로를 절대 URL로 변환
                if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
                  return mediaUrl; // 이미 절대 URL
                } else if (mediaUrl.startsWith('/uploads/')) {
                  // 서버 기본 URL 추가
                  const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:5002';
                  const absoluteUrl = `${serverBaseUrl}${mediaUrl}`;
                  console.log('🔧 상대 경로 → 절대 URL 변환:', {
                    원본: mediaUrl,
                    변환후: absoluteUrl
                  });
                  return absoluteUrl;
                } else {
                  console.warn('⚠️ 알 수 없는 mediaUrl 형식:', mediaUrl);
                  return mediaUrl;
                }
              })(),
              // 🔥 부모 클립의 속성을 상속받고 기본값으로 fallback
              // 클라이언트에서 전송된 값만 사용 (하드코딩된 기본값 제거)
              backgroundFit: mediaProps.backgroundFit,
              backgroundPosition: mediaProps.backgroundPosition,

              // 테두리 속성을 부모로부터 상속
              borderRadius: mediaProps.borderRadius,
              borderRadiusUnit: mediaProps.borderRadiusUnit,
              borderWidth: mediaProps.borderWidth,
              borderColor: mediaProps.borderColor,

              // 그림자 속성을 부모로부터 상속
              shadowEnabled: mediaProps.shadowEnabled,
              shadowOffsetX: mediaProps.shadowOffsetX,
              shadowOffsetY: mediaProps.shadowOffsetY,
              shadowBlur: mediaProps.shadowBlur,
              shadowColor: mediaProps.shadowColor,
              shadowSpread: mediaProps.shadowSpread,
              shadowOpacity: mediaProps.shadowOpacity,

              // 내부 그림자 속성을 부모로부터 상속
              innerShadowEnabled: mediaProps.innerShadowEnabled,
              innerShadowOffsetX: mediaProps.innerShadowOffsetX,
              innerShadowOffsetY: mediaProps.innerShadowOffsetY,
              innerShadowBlur: mediaProps.innerShadowBlur,
              innerShadowColor: mediaProps.innerShadowColor,
              innerShadowOpacity: mediaProps.innerShadowOpacity,

              // 글로우 효과 속성을 부모로부터 상속
              glowEnabled: mediaProps.glowEnabled,
              glowColor: mediaProps.glowColor,
              glowSize: mediaProps.glowSize,
              glowIntensity: mediaProps.glowIntensity,

              // 페이드 효과를 부모로부터 상속
              edgeFade: mediaProps.edgeFade,
              fadeType: mediaProps.fadeType,
              edgeFadeStops: mediaProps.edgeFadeStops,

              // 기타 누락될 수 있는 PolygonShape 속성들
              backgroundColor: mediaProps.backgroundColor,
              backgroundGradient: mediaProps.backgroundGradient
            }
          };
        }

        console.log(`📦 미디어 클립 생성 완료:`);
        console.log(`   - ID: ${mediaClip.id}`);
        console.log(`   - 시작: ${mediaClip.startTime}초`);
        console.log(`   - 종료: ${mediaClip.endTime}초`);
        console.log(`   - 길이: ${mediaClip.duration}초`);
        console.log(`   - 좌표: x=${mediaClip.x}, y=${mediaClip.y}`);
        console.log(`   - 사이즈: width=${mediaClip.width}, height=${mediaClip.height}`);
        console.log(`   - 전체 미디어 클립:`, JSON.stringify(mediaClip, null, 2));
      }

      // 2-6. 여러 텍스트 클립 생성 (Whisper 타이밍 기반, 실제 오디오 길이에 맞춰 스케일링)
      const whisperTotalDuration = timedSentences.length > 0 ?
        Math.max(...timedSentences.map(s => s.start + s.duration)) : fullTtsResult.duration;
      const scaleFactor = fullTtsResult.duration / whisperTotalDuration;

      console.log(`🎵 타이밍 동기화 정보 (데이터 항목 ${dataIndex + 1}):`);
      console.log(`   - 실제 오디오 길이: ${fullTtsResult.duration}초`);
      console.log(`   - Whisper 예상 길이: ${whisperTotalDuration}초`);
      console.log(`   - 스케일 팩터: ${scaleFactor.toFixed(3)}`);

      timedSentences.forEach((timedSentence, i) => {
        // 실제 오디오 길이에 맞춰 타이밍 스케일링
        const scaledStart = timedSentence.start * scaleFactor;
        const scaledDuration = timedSentence.duration * scaleFactor;

        const sentenceClip = {
          id: generateClipId(),
          mediaType: 'sentence',
          name: `문장 ${dataIndex + 1}-${i + 1}`,
          startTime: currentOffset + scaledStart,
          duration: scaledDuration,
          endTime: currentOffset + scaledStart + scaledDuration,
          text: timedSentence.text,

          // 🔥 longSentence 클립의 모든 속성을 완전히 복사
          ...this.copyAllTextProperties(longSentenceClip),

          // Whisper 단어별 타이밍 데이터
          subtitles: timedSentence.wordTimings || [],
          whisperTiming: timedSentence,

          trackId: trackAssignment.sentenceTrackId,
          parentClipId: longSentenceClip.id,

          // 기준 클립 속성 (Text+Audio 모드에서는 Audio가 기준이므로 Sentence는 기준클립 아님)
          baseClipProperties: {
            isBaseClip: false
          }
        };

        console.log(`📝 Sentence 클립 생성 (${sentenceClip.name}):`);
        console.log(`   - 원본: ${timedSentence.start.toFixed(2)}~${(timedSentence.start + timedSentence.duration).toFixed(2)}초 (${timedSentence.duration.toFixed(2)}초)`);
        console.log(`   - 스케일링: ${scaledStart.toFixed(2)}~${(scaledStart + scaledDuration).toFixed(2)}초 (${scaledDuration.toFixed(2)}초)`);
        console.log(`   - 최종: ${sentenceClip.startTime.toFixed(2)}~${sentenceClip.endTime.toFixed(2)}초`);
        console.log(`   - 🎯 핵심 속성 확인:`, {
          x: sentenceClip.x,
          y: sentenceClip.y,
          width: sentenceClip.width,
          height: sentenceClip.height,
          fontSize: sentenceClip.fontSize,
          color: sentenceClip.color,
          backgroundColor: sentenceClip.backgroundColor,
          borderRadius: sentenceClip.borderRadius,
          borderRadiusUnit: sentenceClip.borderRadiusUnit,
          textShadow: sentenceClip.textShadow,
          textShadowColor: sentenceClip.textShadowColor,
          textShadowOffsetX: sentenceClip.textShadowOffsetX,
          textShadowOffsetY: sentenceClip.textShadowOffsetY,
          textShadowBlur: sentenceClip.textShadowBlur,
          paddingTop: sentenceClip.paddingTop,
          paddingRight: sentenceClip.paddingRight,
          paddingBottom: sentenceClip.paddingBottom,
          paddingLeft: sentenceClip.paddingLeft
        });
        console.log(`   - 🎯 Effects 속성 확인:`, {
          brightness: sentenceClip.brightness,
          contrast: sentenceClip.contrast,
          saturation: sentenceClip.saturation,
          hue: sentenceClip.hue,
          blur: sentenceClip.blur,
          sepia: sentenceClip.sepia,
          grayscale: sentenceClip.grayscale,
          fadeIn: sentenceClip.fadeIn,
          fadeOut: sentenceClip.fadeOut,
          animationType: sentenceClip.animationType
        });

        // 첫 번째 문장에는 오디오와 미디어 클립도 포함
        generatedClips.push({
          sentenceClip,
          audioClip: i === 0 ? unifiedAudioClip : null,
          mediaClip: i === 0 ? mediaClip : null,
          subtitles: timedSentence.wordTimings || [],
          whisperTiming: timedSentence,
          ttsResult: i === 0 ? fullTtsResult : null
        });
      });

      onProgress?.(90);

    } else if (longSentenceClip.generateTTS && longSentenceClip.generateText === false) {
      // 통합 오디오만 생성
      const fullTtsResult = await this.ttsService.generateAudio({
        text: itemText,
        language: longSentenceClip.language,
        voice: longSentenceClip.voice,
      });

      console.log(`🎵 TTS 오디오 생성 완료 (Audio-only, 데이터 항목 ${dataIndex + 1}):`);
      console.log(`   - 오디오 파일: ${fullTtsResult.filePath}`);
      console.log(`   - 길이: ${fullTtsResult.duration}초`);
      console.log(`   - URL: ${fullTtsResult.url}`);

      const unifiedAudioClip = {
        id: generateClipId(),
        mediaType: 'audio',
        name: `음성-${dataIndex + 1}`,
        startTime: currentOffset,
        duration: fullTtsResult.duration,
        endTime: currentOffset + fullTtsResult.duration,
        mediaUrl: fullTtsResult.url,
        volume: 1.0,
        playbackRate: 1.0,
        trackId: trackAssignment.audioTrackId,
        parentClipId: longSentenceClip.id,

        // 기준 클립 속성 (Audio only 모드에서 Audio가 기준클립)
        baseClipProperties: {
          isBaseClip: trackAssignment.baseTrackId === trackAssignment.audioTrackId
        }
      };

      // 미디어 클립 생성 (Audio-only 모드)
      let mediaClip = null;
      if (mediaUrl && mediaUrl.trim() !== '') {
        const mediaType = MediaUtils.getMediaType(mediaUrl);

        // showMediaDuringTimeSpace에 따른 endTime 계산
        let mediaEndTime = currentOffset + fullTtsResult.duration; // 기본: 오디오 끝나는 시점
        const showMediaDuringTimeSpace = longSentenceClip.showMediaDuringTimeSpace !== false; // 기본값 true
        const timeSpace = longSentenceClip.timeSpace || 0;

        // 마지막 데이터 항목이 아닌 경우에만 timeSpace 고려
        if (dataIndex < longSentenceClip.data.length - 1) {
          if (showMediaDuringTimeSpace) {
            // 미디어가 timeSpace 간격까지 포함해서 표시 (다음 데이터 항목 시작 전까지)
            mediaEndTime += timeSpace;
            console.log(`🖼️ 미디어 클립 연장 (Audio-only, 간격 포함): +${timeSpace}초, 총 길이: ${mediaEndTime - currentOffset}초`);
          } else {
            // 미디어가 오디오 끝나는 시점에서 종료 (timeSpace 간격 동안 숨김)
            console.log(`🖼️ 미디어 클립 기본 길이 (Audio-only, 간격 제외): ${mediaEndTime - currentOffset}초`);
          }
        } else {
          // 마지막 데이터 항목인 경우 오디오 길이와 동일
          console.log(`🖼️ 미디어 클립 기본 길이 (Audio-only, 마지막 항목): ${mediaEndTime - currentOffset}초`);
        }

        mediaClip = {
          id: generateClipId(),
          mediaType: mediaType,
          name: `미디어-${dataIndex + 1}`,
          startTime: currentOffset,
          duration: mediaEndTime - currentOffset,
          endTime: mediaEndTime,
          mediaUrl: mediaUrl,
          trackId: trackAssignment.mediaTrackId,
          parentClipId: longSentenceClip.id,

          ...MediaUtils.applyMediaProperties(longSentenceClip.mediaProperties),

          ...(mediaType === 'video' && {
            volume: longSentenceClip.mediaProperties?.volume || 1.0,
            playbackRate: longSentenceClip.mediaProperties?.playbackRate || 1.0,
          })
        };
      }

      generatedClips.push({
        sentenceClip: null,
        audioClip: unifiedAudioClip,
        mediaClip: mediaClip,
        subtitles: [],
        ttsResult: fullTtsResult
      });

    } else {
      // 텍스트만 생성
      const totalEstimatedDuration = this.estimateTextDuration(itemText);
      const timedSentences = this.estimateTimingsForSentences(sentences, totalEstimatedDuration);

      // 미디어 클립 생성 (예상 시간 기반, Text-only 모드)
      let mediaClip = null;
      if (mediaUrl && mediaUrl.trim() !== '') {
        const mediaType = MediaUtils.getMediaType(mediaUrl);

        // showMediaDuringTimeSpace에 따른 endTime 계산
        let mediaEndTime = currentOffset + totalEstimatedDuration; // 기본: 예상 텍스트 시간
        const showMediaDuringTimeSpace = longSentenceClip.showMediaDuringTimeSpace !== false; // 기본값 true
        const timeSpace = longSentenceClip.timeSpace || 0;

        // 마지막 데이터 항목이 아닌 경우에만 timeSpace 고려
        if (dataIndex < longSentenceClip.data.length - 1) {
          if (showMediaDuringTimeSpace) {
            // 미디어가 timeSpace 간격까지 포함해서 표시 (다음 데이터 항목 시작 전까지)
            mediaEndTime += timeSpace;
            console.log(`🖼️ 미디어 클립 연장 (Text-only, 간격 포함): +${timeSpace}초, 총 길이: ${mediaEndTime - currentOffset}초`);
          } else {
            // 미디어가 텍스트 끝나는 시점에서 종료 (timeSpace 간격 동안 숨김)
            console.log(`🖼️ 미디어 클립 기본 길이 (Text-only, 간격 제외): ${mediaEndTime - currentOffset}초`);
          }
        } else {
          // 마지막 데이터 항목인 경우 텍스트 길이와 동일
          console.log(`🖼️ 미디어 클립 기본 길이 (Text-only, 마지막 항목): ${mediaEndTime - currentOffset}초`);
        }

        mediaClip = {
          id: generateClipId(),
          mediaType: mediaType,
          name: `미디어-${dataIndex + 1}`,
          startTime: currentOffset,
          duration: mediaEndTime - currentOffset,
          endTime: mediaEndTime,
          mediaUrl: mediaUrl,
          trackId: trackAssignment.mediaTrackId,
          parentClipId: longSentenceClip.id,

          ...MediaUtils.applyMediaProperties(longSentenceClip.mediaProperties),

          ...(mediaType === 'video' && {
            volume: longSentenceClip.mediaProperties?.volume || 1.0,
            playbackRate: longSentenceClip.mediaProperties?.playbackRate || 1.0,
          })
        };
      }

      timedSentences.forEach((timedSentence, i) => {
        const sentenceClip = {
          id: generateClipId(),
          mediaType: 'sentence',
          name: `문장 ${dataIndex + 1}-${i + 1}`,
          startTime: currentOffset + timedSentence.start,
          duration: timedSentence.duration,
          endTime: currentOffset + timedSentence.start + timedSentence.duration,
          text: timedSentence.text,

          // 🔥 longSentence 클립의 모든 속성을 완전히 복사
          ...this.copyAllTextProperties(longSentenceClip),

          trackId: trackAssignment.sentenceTrackId,
          parentClipId: longSentenceClip.id,

          // 기준 클립 속성 (Text only 모드에서 첫 번째 Sentence가 기준클립)
          baseClipProperties: {
            isBaseClip: trackAssignment.baseTrackId === trackAssignment.sentenceTrackId && i === 0
          }
        };

        generatedClips.push({
          sentenceClip,
          audioClip: null,
          mediaClip: i === 0 ? mediaClip : null, // 첫 번째 문장에만 미디어 연결
          subtitles: [],
          ttsResult: null
        });
      });
    }

    return generatedClips;
  }



  /**
   * 분할 미리보기
   */
  async previewSplit(text: string, options: any): Promise<SplitPreviewResult> {
    try {
      const preview = this.sentenceSplitter.previewSplit(text, {
        maxWordsPerSentence: options.maxWordsPerSentence,
        splitOnPunctuation: options.splitOnPunctuation,
        language: options.language
      });

      const analysis = this.sentenceSplitter.analyzeSentences(preview.sentences);

      return {
        success: true,
        preview,
        analysis,
        recommendations: this.generateRecommendations(preview, options)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 최적화 제안 생성
   */
  private generateRecommendations(preview: any, options: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 문장 수가 너무 많은 경우
    if (preview.totalSentences > 10) {
      recommendations.push({
        type: 'warning',
        message: '문장 수가 많습니다. 최대 단어 수를 늘려보세요.',
        suggestedValue: options.maxWordsPerSentence + 5
      });
    }

    // 평균 단어 수가 너무 적은 경우
    if (preview.averageWordsPerSentence < 5) {
      recommendations.push({
        type: 'info',
        message: '문장이 너무 짧습니다. 최대 단어 수를 줄여보세요.',
        suggestedValue: Math.max(5, options.maxWordsPerSentence - 3)
      });
    }

    // 예상 시간이 너무 긴 경우
    if (preview.estimatedDuration > 60) {
      recommendations.push({
        type: 'warning',
        message: '총 재생 시간이 1분을 초과합니다. 텍스트를 줄이거나 분할을 늘려보세요.',
        suggestedValue: Math.floor(options.maxWordsPerSentence * 0.8)
      });
    }

    return recommendations;
  }

  /**
   * Whisper 타이밍과 분할된 문장 매칭 (Word-level 기반 스마트 매칭)
   */
  private matchSentencesWithTiming(sentences: string[], whisperTimings: any[], totalDuration: number): any[] {
    console.log('🔍 [Whisper 스마트 매칭] 시작:', {
      문장수: sentences.length,
      Whisper세그먼트수: whisperTimings.length,
      총길이: totalDuration,
      문장들: sentences.map(s => `"${s.substring(0, 30)}..."`),
      Whisper세그먼트들: whisperTimings.map(w => ({
        text: `"${w.text.substring(0, 30)}..."`,
        start: w.start,
        end: w.end,
        wordCount: w.words?.length || 0
      }))
    });

    if (!whisperTimings || whisperTimings.length === 0) {
      console.warn('⚠️ Whisper 타이밍 없음, 예상 타이밍 사용');
      return this.estimateTimingsForSentences(sentences, totalDuration);
    }

    const results: any[] = [];
    let currentWhisperIndex = 0;

    // 특별 처리: Whisper 세그먼트가 문장보다 적은 경우
    if (whisperTimings.length < sentences.length && whisperTimings.length > 0) {
      console.log(`🔧 [특별 처리] 세그먼트 부족 상황: ${whisperTimings.length}개 세그먼트를 ${sentences.length}개 문장으로 분할`);
      return this.handleSegmentShortage(sentences, whisperTimings, totalDuration);
    }

    for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
      const targetSentence = sentences[sentenceIndex];
      const normalizedTarget = TextUtils.normalizeText(targetSentence);

      console.log(`\n📝 문장 ${sentenceIndex + 1} 처리: "${targetSentence}"`);

      const matchedSegments = [];
      let accumulatedText = '';

      // 현재 문장과 매칭되는 Whisper 세그먼트들 수집
      while (currentWhisperIndex < whisperTimings.length && matchedSegments.length < 5) {
        const whisperSegment = whisperTimings[currentWhisperIndex];
        const segmentText = whisperSegment.text.trim();

        if (!segmentText) {
          currentWhisperIndex++;
          continue;
        }

        accumulatedText += segmentText + ' ';
        matchedSegments.push(whisperSegment);

        const normalizedAccumulated = TextUtils.normalizeText(accumulatedText);
        const similarity = TextUtils.calculateTextSimilarity(normalizedAccumulated, normalizedTarget);

        console.log(`  🔗 세그먼트 추가: "${segmentText}" | 누적: "${accumulatedText.substring(0, 40)}..." | 유사도: ${similarity.toFixed(3)}`);

        // 문장 완성도 체크
        if (similarity > 0.75 || TextUtils.isNaturalBreak(segmentText) ||
          normalizedAccumulated.length >= normalizedTarget.length * 0.9) {
          console.log(`  ✅ 매칭 완료! 조건: 유사도=${similarity.toFixed(3)} 자연끊김=${TextUtils.isNaturalBreak(segmentText)}`);
          currentWhisperIndex++;
          break;
        }

        currentWhisperIndex++;
      }

      if (matchedSegments.length === 0) {
        // 매칭 실패: 예상 타이밍 사용
        console.warn(`  ⚠️ 매칭 실패, 예상 타이밍 사용`);
        const estimatedTiming = this.estimateSentenceTiming(targetSentence, sentenceIndex, sentences, totalDuration);
        results.push({
          ...estimatedTiming,
          matchMethod: 'estimated',
          confidence: 'low'
        });
      } else {
        // 성공적인 매칭
        const firstSegment = matchedSegments[0];
        const lastSegment = matchedSegments[matchedSegments.length - 1];

        // Word-level 타이밍을 활용한 정밀 경계 조정
        const { adjustedStart, adjustedEnd } = this.adjustTimingBoundariesWithWords(
          firstSegment, lastSegment, targetSentence, matchedSegments
        );

        const timedSentence = {
          text: targetSentence,
          start: adjustedStart,
          end: adjustedEnd,
          duration: adjustedEnd - adjustedStart,
          wordTimings: matchedSegments.flatMap(s => s.words || []),
          whisperSegments: matchedSegments,
          matchMethod: 'word-level',
          confidence: matchedSegments.length === 1 ? 'high' : 'medium',
          similarity: TextUtils.calculateTextSimilarity(
            TextUtils.normalizeText(accumulatedText),
            TextUtils.normalizeText(targetSentence)
          )
        };

        results.push(timedSentence);
        console.log(`  ✅ 매칭 성공: ${adjustedStart.toFixed(2)}-${adjustedEnd.toFixed(2)}초 (${timedSentence.duration.toFixed(2)}초)`);
      }
    }

    // 전체 결과 검증 및 보정
    const validatedResults = this.validateAndAdjustTimings(results, totalDuration);

    console.log('🎯 [Whisper 스마트 매칭] 완료:', {
      총문장수: validatedResults.length,
      성공매칭: validatedResults.filter(r => r.matchMethod === 'word-level').length,
      예상타이밍: validatedResults.filter(r => r.matchMethod === 'estimated').length,
      평균신뢰도: (validatedResults.reduce((sum, r) => sum + (r.similarity || 0), 0) / validatedResults.length).toFixed(3)
    });

    return validatedResults;
  }

  /**
   * 텍스트 정규화 (매칭용)
   */

  /**
   * Word-level 타이밍을 활용한 정밀 경계 조정
   */
  private adjustTimingBoundariesWithWords(
    firstSegment: any,
    lastSegment: any,
    targetSentence: string,
    matchedSegments: any[]
  ): { adjustedStart: number; adjustedEnd: number } {
    let adjustedStart = firstSegment.start;
    let adjustedEnd = lastSegment.end;

    // 첫 번째 세그먼트의 첫 단어로 시작 시간 조정
    if (firstSegment.words && firstSegment.words.length > 0) {
      adjustedStart = firstSegment.words[0].start;
    }

    // 마지막 세그먼트의 마지막 단어로 종료 시간 조정
    if (lastSegment.words && lastSegment.words.length > 0) {
      adjustedEnd = lastSegment.words[lastSegment.words.length - 1].end;
    }

    return { adjustedStart, adjustedEnd };
  }

  /**
   * 정밀한 예상 타이밍 계산
   */
  private estimateSentenceTiming(sentence: string, index: number, allSentences: string[], totalDuration: number): any {
    const weights = allSentences.map(s => TextUtils.calculateSentenceWeight(s));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const prevWeights = weights.slice(0, index);
    const currentWeight = weights[index];
    const prevTotalWeight = prevWeights.reduce((sum, w) => sum + w, 0);

    const startTime = (prevTotalWeight / totalWeight) * totalDuration;
    const duration = (currentWeight / totalWeight) * totalDuration;

    return {
      text: sentence,
      start: startTime,
      end: startTime + duration,
      duration: duration,
      wordTimings: [],
      matchMethod: 'estimated',
      confidence: 'low'
    };
  }


  /**
   * 세그먼트 부족 상황 처리 (1개 Whisper 세그먼트를 여러 문장으로 분할)
   */
  private handleSegmentShortage(sentences: string[], whisperTimings: any[], totalDuration: number): any[] {
    console.log('🚨 [세그먼트 부족 처리] 시작:', {
      sentences: sentences.length,
      whisperSegments: whisperTimings.length,
      totalDuration
    });

    if (whisperTimings.length === 0) {
      console.warn('Whisper 세그먼트가 없음, 예상 타이밍 사용');
      return this.estimateTimingsForSentences(sentences, totalDuration);
    }

    const results: any[] = [];

    if (whisperTimings.length === 1) {
      // 가장 일반적인 경우: 1개 세그먼트를 여러 문장으로 분할
      const singleSegment = whisperTimings[0];
      console.log('📖 단일 세그먼트 분할:', {
        segmentText: singleSegment.text.substring(0, 50) + '...',
        segmentDuration: singleSegment.end - singleSegment.start,
        wordCount: singleSegment.words?.length || 0
      });

      // Word-level 데이터가 있는 경우 정밀 분할
      if (singleSegment.words && singleSegment.words.length > 0) {
        return this.splitSegmentByWords(sentences, singleSegment);
      } else {
        // Word-level 데이터가 없는 경우 비례 분할
        return this.splitSegmentProportionally(sentences, singleSegment);
      }
    } else {
      // 여러 세그먼트를 더 많은 문장으로 분배
      return this.distributeSegmentsToSentences(sentences, whisperTimings);
    }
  }

  /**
   * Word-level 데이터를 사용한 정밀 세그먼트 분할
   */
  private splitSegmentByWords(sentences: string[], segment: any): any[] {
    console.log('🔤 Word-level 정밀 분할 시작');

    const words = segment.words;
    const segmentStart = segment.start;
    const segmentEnd = segment.end;

    // 문장별 단어 매칭
    const results: any[] = [];
    let wordIndex = 0;

    for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
      const sentence = sentences[sentenceIndex];
      const normalizedSentence = TextUtils.normalizeText(sentence);
      const sentenceWords = normalizedSentence.split(/\s+/).filter(w => w);

      console.log(`  문장 ${sentenceIndex + 1}: "${sentence}" (${sentenceWords.length}단어)`);

      const matchedWords: any[] = [];
      let bestMatchStart = wordIndex;
      let bestMatchCount = 0;
      let bestSimilarity = 0;

      // 문장과 가장 잘 매칭되는 단어 범위 찾기
      for (let startIdx = wordIndex; startIdx < words.length; startIdx++) {
        for (let count = 1; count <= Math.min(10, words.length - startIdx); count++) {
          const candidateWords = words.slice(startIdx, startIdx + count);
          const candidateText = candidateWords.map((w: any) => w.word).join(' ');
          const similarity = TextUtils.calculateTextSimilarity(
            TextUtils.normalizeText(candidateText),
            normalizedSentence
          );

          if (similarity > bestSimilarity && similarity > 0.3) {
            bestSimilarity = similarity;
            bestMatchStart = startIdx;
            bestMatchCount = count;
          }
        }
      }

      if (bestMatchCount > 0) {
        // 매칭된 단어들 사용
        const sentenceWords = words.slice(bestMatchStart, bestMatchStart + bestMatchCount);
        wordIndex = bestMatchStart + bestMatchCount;

        const startTime = sentenceWords[0].start;
        const endTime = sentenceWords[sentenceWords.length - 1].end;

        console.log(`    ✅ 매칭: ${sentenceWords.length}단어, ${startTime.toFixed(2)}-${endTime.toFixed(2)}초, 유사도: ${bestSimilarity.toFixed(3)}`);

        results.push({
          text: sentence,
          start: startTime,
          end: endTime,
          duration: endTime - startTime,
          wordTimings: sentenceWords,
          whisperSegments: [segment],
          matchMethod: 'word-split',
          confidence: bestSimilarity > 0.7 ? 'high' : 'medium',
          similarity: bestSimilarity
        });
      } else {
        // 매칭 실패 시 비례 분할
        console.log(`    ⚠️ 매칭 실패, 비례 분할 사용`);
        const sentenceWeight = TextUtils.calculateSentenceWeight(sentence);
        const totalWeight = sentences.reduce((sum, s) => sum + TextUtils.calculateSentenceWeight(s), 0);
        const proportion = sentenceWeight / totalWeight;

        const duration = (segmentEnd - segmentStart) * proportion;
        const startTime = segmentStart + (segmentEnd - segmentStart) * (sentenceIndex / sentences.length);

        results.push({
          text: sentence,
          start: startTime,
          end: startTime + duration,
          duration,
          wordTimings: [],
          whisperSegments: [segment],
          matchMethod: 'proportional-fallback',
          confidence: 'low',
          similarity: 0
        });
      }
    }

    console.log('✅ Word-level 분할 완료');
    return this.validateAndAdjustTimings(results, segmentEnd - segmentStart);
  }

  /**
   * 비례적 세그먼트 분할 (Word-level 데이터 없을 때)
   */
  private splitSegmentProportionally(sentences: string[], segment: any): any[] {
    console.log('📏 비례적 분할 시작');

    const segmentStart = segment.start;
    const segmentEnd = segment.end;
    const segmentDuration = segmentEnd - segmentStart;

    // 문장별 가중치 계산
    const weights = sentences.map(s => TextUtils.calculateSentenceWeight(s));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const results: any[] = [];
    let currentTime = segmentStart;

    sentences.forEach((sentence, index) => {
      const weight = weights[index];
      const proportion = weight / totalWeight;
      const duration = segmentDuration * proportion;

      console.log(`  문장 ${index + 1}: ${duration.toFixed(2)}초 (비율: ${(proportion * 100).toFixed(1)}%)`);

      results.push({
        text: sentence,
        start: currentTime,
        end: currentTime + duration,
        duration,
        wordTimings: [],
        whisperSegments: [segment],
        matchMethod: 'proportional',
        confidence: 'medium',
        similarity: 0.5
      });

      currentTime += duration;
    });

    console.log('✅ 비례적 분할 완료');
    return results;
  }

  /**
   * 여러 세그먼트를 더 많은 문장으로 분배
   */
  private distributeSegmentsToSentences(sentences: string[], whisperTimings: any[]): any[] {
    console.log('🔄 세그먼트 분배 시작');

    const results: any[] = [];
    const segmentsPerSentence = sentences.length / whisperTimings.length;

    let sentenceIndex = 0;

    whisperTimings.forEach((segment, segmentIndex) => {
      const sentencesForThisSegment = Math.ceil(segmentsPerSentence);
      const endSentenceIndex = Math.min(sentenceIndex + sentencesForThisSegment, sentences.length);

      const segmentSentences = sentences.slice(sentenceIndex, endSentenceIndex);

      if (segmentSentences.length === 1) {
        // 1:1 매칭
        results.push({
          text: segmentSentences[0],
          start: segment.start,
          end: segment.end,
          duration: segment.end - segment.start,
          wordTimings: segment.words || [],
          whisperSegments: [segment],
          matchMethod: 'direct',
          confidence: 'high',
          similarity: 0.9
        });
      } else {
        // 1:N 분할
        const splitResults = this.splitSegmentProportionally(segmentSentences, segment);
        results.push(...splitResults);
      }

      sentenceIndex = endSentenceIndex;
    });

    console.log('✅ 세그먼트 분배 완료');
    return results;
  }

  /**
   * 타이밍 검증 및 보정
   */
  private validateAndAdjustTimings(timings: any[], totalDuration: number): any[] {
    console.log('🔧 타이밍 검증 및 보정 시작');

    // 1. 겹침 해결
    for (let i = 1; i < timings.length; i++) {
      if (timings[i].start < timings[i - 1].end) {
        const overlap = timings[i - 1].end - timings[i].start;
        timings[i - 1].end -= overlap / 2;
        timings[i].start += overlap / 2;
        timings[i - 1].duration = timings[i - 1].end - timings[i - 1].start;
        timings[i].duration = timings[i].end - timings[i].start;

        console.log(`🔧 겹침 보정: ${i - 1}번과 ${i}번 문장 (${overlap.toFixed(2)}초 겹침)`);
      }
    }

    // 2. 최소/최대 길이 제한
    timings.forEach((timing, index) => {
      const minDuration = 0.3; // 최소 0.3초
      const maxDuration = Math.min(10, totalDuration * 0.4); // 최대 10초 또는 전체의 40%

      if (timing.duration < minDuration) {
        timing.duration = minDuration;
        timing.end = timing.start + minDuration;
        console.log(`🔧 최소 길이 보정: ${index}번 문장`);
      } else if (timing.duration > maxDuration) {
        timing.duration = maxDuration;
        timing.end = timing.start + maxDuration;
        console.log(`🔧 최대 길이 보정: ${index}번 문장`);
      }
    });

    // 3. 총 길이 맞추기
    const lastTiming = timings[timings.length - 1];
    if (lastTiming && Math.abs(lastTiming.end - totalDuration) > 0.1) {
      const adjustment = totalDuration - lastTiming.end;
      lastTiming.end = totalDuration;
      lastTiming.duration += adjustment;
      console.log(`🔧 총 길이 맞춤: 마지막 문장에 ${adjustment.toFixed(2)}초 조정`);
    }

    console.log('✅ 타이밍 검증 및 보정 완료');
    return timings;
  }

  /**
   * 문장 완성 여부 확인 (유사도 기반) - 레거시 호환성 유지
   */
  private isSentenceComplete(accumulated: string, target: string): boolean {
    const similarity = TextUtils.calculateTextSimilarity(TextUtils.normalizeText(accumulated), TextUtils.normalizeText(target));
    return similarity > 0.8;
  }

  /**
   * 문자열 유사도 계산 - 레거시 호환성 유지
   */
  private calculateSimilarity(str1: string, str2: string): number {
    return TextUtils.calculateTextSimilarity(str1, str2);
  }

  /**
   * 예상 시간 기반 문장 타이밍 생성 (개선된 버전)
   */
  private estimateTimingsForSentences(sentences: string[], totalDuration: number): any[] {
    const weights = sentences.map(s => TextUtils.calculateSentenceWeight(s));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let currentTime = 0;

    return sentences.map((sentence, index) => {
      const weight = weights[index];
      const duration = (weight / totalWeight) * totalDuration;

      const timing = {
        text: sentence,
        start: currentTime,
        end: currentTime + duration,
        duration: duration,
        wordTimings: [],
        matchMethod: 'estimated',
        confidence: 'low'
      };

      currentTime += duration;
      return timing;
    });
  }

  /**
   * 텍스트 지속 시간 예상 (개선된 버전)
   */
  private estimateTextDuration(text: string): number {
    const weight = TextUtils.calculateSentenceWeight(text);
    return Math.max(1, weight * 0.05); // 가중치 기반 시간 계산
  }

  /**
   * 오디오 트랙 ID 가져오기
   */
  private getAudioTrackId(originalTrackId: string): string {
    return originalTrackId;
  }

  /**
   * 변환 결과 검증
   */
  validateConversionResult(result: ConversionResult): ValidationResult {
    if (!result.success) {
      return {
        isValid: false,
        errors: [result.error || '알 수 없는 오류']
      };
    }

    const errors: string[] = [];

    // 생성된 클립 검증
    if (!result.generatedClips || result.generatedClips.length === 0) {
      errors.push('생성된 클립이 없습니다.');
    }

    // 시간 겹침 검증
    if (result.generatedClips) {
      for (let i = 1; i < result.generatedClips.length; i++) {
        const prev = result.generatedClips[i - 1];
        const curr = result.generatedClips[i];

        // sentenceClip이 null일 수 있으므로 체크
        if (prev.sentenceClip && curr.sentenceClip) {
          const prevEnd = prev.sentenceClip.startTime + prev.sentenceClip.duration;
          if (prevEnd > curr.sentenceClip.startTime) {
            errors.push(`클립 ${i}와 ${i + 1} 사이에 시간 겹침이 있습니다.`);
          }
        } else if (prev.audioClip && curr.audioClip) {
          // sentenceClip이 없으면 audioClip으로 검증
          const prevEnd = prev.audioClip.startTime + prev.audioClip.duration;
          if (prevEnd > curr.audioClip.startTime) {
            errors.push(`클립 ${i}와 ${i + 1} 사이에 시간 겹침이 있습니다.`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 변환 진행 상황 추적
   */
  async trackConversionProgress(_clipId: string, callback: (progress: number) => void): Promise<void> {
    // 실제 구현에서는 WebSocket이나 SSE를 통해 실시간 진행 상황 전달
    // 여기서는 시뮬레이션
    for (let i = 0; i <= 100; i += 10) {
      callback(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

export interface ConversionResult {
  success: boolean;
  generatedClips?: GeneratedClipPair[];
  totalDuration?: number;
  originalClip?: any;
  splitSentences?: string[];
  sentenceClips?: any[];
  audioClips?: any[];
  mediaClips?: any[];
  error?: string;
}

export interface GeneratedClipPair {
  sentenceClip: any;
  audioClip: any;
  mediaClip?: any; // 새로 추가: 이미지/비디오 클립
  subtitles: any[];
  ttsResult?: any;
  whisperTiming?: any;
}

export interface SplitPreviewResult {
  success: boolean;
  preview?: any;
  analysis?: any[];
  recommendations?: Recommendation[];
  error?: string;
}

export interface Recommendation {
  type: 'info' | 'warning' | 'error';
  message: string;
  suggestedValue?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}