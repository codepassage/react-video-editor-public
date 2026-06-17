/**
 * Clip generation utility functions
 * Extracted from longSentenceEngine.ts for better modularity
 */

import { PropertyUtils } from './propertyUtils';

// 클라이언트와 동일한 ID 생성 함수
const generateClipId = () => `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export class ClipGenerationUtils {
  /**
   * 트랙 할당 결정 (NestedEngine 호환)
   */
  static determineTrackAssignment(longSentenceClip: any): any {
    const originalTrackId = longSentenceClip.trackId;
    const targetBaseTrackId = originalTrackId;

    console.log('🎯 NestedEngine 트랙 배치: Sentence→track-1, Audio→기준트랙, Media→기준트랙-1');

    const trackAssignment = {
      originalTrackId,
      targetBaseTrackId,
      sentenceTrackId: 'track-1',
      audioTrackId: targetBaseTrackId,
      mediaTrackId: 'track-1',
      baseTrackId: targetBaseTrackId,
      generateTTS: longSentenceClip.generateTTS,
      generateText: longSentenceClip.generateText,
      트랙분리: '✅ 분리됨'
    };

    console.log('📍 트랙 할당 결과:', trackAssignment);
    return trackAssignment;
  }

  /**
   * 미디어 클립 생성
   */
  static createMediaClip(
    mediaUrl: string,
    mediaType: string,
    startTime: number,
    duration: number,
    longSentenceClip: any,
    trackAssignment: any
  ): any {
    console.log('🔷 PolygonShape 클립 생성 시작');

    const mediaClip = {
      id: generateClipId(),
      mediaType: 'polygonShape',
      name: '배경이미지-1',
      startTime,
      duration,
      endTime: startTime + duration,
      trackId: trackAssignment.mediaTrackId,
      parentClipId: longSentenceClip.id,

      ...PropertyUtils.copyAllVisualProperties(longSentenceClip),

      polygonShapeProperties: {
        shapeType: 'rectangle',
        backgroundType: mediaType === 'image' ? 'image' : 'video',
        backgroundImageUrl: mediaUrl,
        backgroundFit: longSentenceClip.mediaProperties?.backgroundFit || 'cover',
        borderColor: longSentenceClip.mediaProperties?.borderColor
      }
    };

    console.log('📦 미디어 클립 생성 완료:', {
      ID: mediaClip.id,
      시작: `${startTime}초`,
      종료: `${startTime + duration}초`,
      길이: `${duration}초`,
      좌표: `x=${mediaClip.x}, y=${mediaClip.y}`,
      사이즈: `width=${mediaClip.width}, height=${mediaClip.height}`
    });

    return mediaClip;
  }

  /**
   * 오디오 클립 생성
   */
  static createAudioClip(
    ttsResult: any,
    startTime: number,
    longSentenceClip: any,
    trackAssignment: any
  ): any {
    return {
      id: generateClipId(),
      mediaType: 'audio',
      name: 'TTS 오디오',
      startTime,
      duration: ttsResult.duration,
      endTime: startTime + ttsResult.duration,
      trackId: trackAssignment.audioTrackId,
      parentClipId: longSentenceClip.id,

      audioClipProperties: {
        audioUrl: ttsResult.url,
        volume: 1.0,
        fadeIn: 0,
        fadeOut: 0,
        pitch: 1.0,
        speed: 1.0,
        muted: false,
        solo: false
      },

      baseClipProperties: {
        isBaseClip: trackAssignment.baseTrackId === trackAssignment.audioTrackId
      }
    };
  }

  /**
   * 텍스트 클립 생성
   */
  static createTextClip(
    timedSentence: any,
    scaleFactor: number,
    currentOffset: number,
    longSentenceClip: any,
    trackAssignment: any,
    isFirstSentence: boolean = false
  ): any {
    const adjustedStart = timedSentence.start * scaleFactor + currentOffset;
    const adjustedDuration = timedSentence.duration * scaleFactor;
    const adjustedEnd = adjustedStart + adjustedDuration;

    console.log(`📝 Sentence 클립 생성:`, {
      원본: `${timedSentence.start.toFixed(2)}~${timedSentence.end.toFixed(2)}초 (${timedSentence.duration.toFixed(2)}초)`,
      스케일링: `${(timedSentence.start * scaleFactor).toFixed(2)}~${(timedSentence.end * scaleFactor).toFixed(2)}초 (${adjustedDuration.toFixed(2)}초)`,
      최종: `${adjustedStart.toFixed(2)}~${adjustedEnd.toFixed(2)}초`
    });

    const textProperties = PropertyUtils.copyAllTextProperties(longSentenceClip);

    console.log('   - 🎯 핵심 속성 확인:', {
      x: textProperties.x,
      y: textProperties.y,
      width: textProperties.width,
      height: textProperties.height,
      fontSize: textProperties.fontSize,
      color: textProperties.color,
      backgroundColor: textProperties.backgroundColor,
      borderRadius: textProperties.borderRadius,
      borderRadiusUnit: textProperties.borderRadiusUnit,
      textShadow: textProperties.textShadow,
      textShadowColor: textProperties.textShadowColor,
      textShadowOffsetX: textProperties.textShadowOffsetX,
      textShadowOffsetY: textProperties.textShadowOffsetY,
      textShadowBlur: textProperties.textShadowBlur,
      paddingTop: textProperties.paddingTop,
      paddingRight: textProperties.paddingRight,
      paddingBottom: textProperties.paddingBottom,
      paddingLeft: textProperties.paddingLeft
    });

    console.log('   - 🎯 Effects 속성 확인:', {
      brightness: textProperties.brightness,
      contrast: textProperties.contrast,
      saturation: textProperties.saturation,
      hue: textProperties.hue,
      blur: textProperties.blur,
      sepia: textProperties.sepia,
      grayscale: textProperties.grayscale,
      fadeIn: textProperties.fadeIn,
      fadeOut: textProperties.fadeOut,
      animationType: textProperties.animationType
    });

    const sentenceClip = {
      id: generateClipId(),
      mediaType: 'sentence',
      name: `문장-${timedSentence.text.substring(0, 10)}...`,
      text: timedSentence.text,
      startTime: adjustedStart,
      duration: adjustedDuration,
      endTime: adjustedEnd,

      ...textProperties,

      trackId: trackAssignment.sentenceTrackId,
      parentClipId: longSentenceClip.id,

      baseClipProperties: {
        isBaseClip: trackAssignment.baseTrackId === trackAssignment.sentenceTrackId && isFirstSentence
      }
    };

    return sentenceClip;
  }

  /**
   * Text-only 모드 클립 생성
   */
  static createTextOnlyClips(
    timedSentences: any[],
    longSentenceClip: any,
    trackAssignment: any,
    mediaClip: any
  ): any[] {
    const generatedClips: any[] = [];

    timedSentences.forEach((timedSentence, i) => {
      const sentenceClip = {
        id: generateClipId(),
        mediaType: 'sentence',
        name: `문장-${i + 1}`,
        text: timedSentence.text,
        startTime: timedSentence.start,
        duration: timedSentence.duration,
        endTime: timedSentence.end,

        ...PropertyUtils.copyAllTextProperties(longSentenceClip),

        trackId: trackAssignment.sentenceTrackId,
        parentClipId: longSentenceClip.id,

        baseClipProperties: {
          isBaseClip: trackAssignment.baseTrackId === trackAssignment.sentenceTrackId && i === 0
        }
      };

      generatedClips.push({
        sentenceClip,
        audioClip: null,
        mediaClip: i === 0 ? mediaClip : null,
        subtitles: [],
        ttsResult: null
      });
    });

    return generatedClips;
  }
}