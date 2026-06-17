/**
 * 🏭 factory.ts - 클립 팩토리 함수
 * 
 * 미디어 타입에 따라 적절한 클립 생성 함수를 자동으로 선택하는 팩토리 함수를 제공합니다.
 */

import type { MediaType, NewTimelineClip } from '../clipTypes';
import {
  createAudioClip,
  createVideoClip,
  createImageClip
} from './mediaClips';

import {
  createTextClip,
  createSentenceClip,
  createLongSentenceClip
} from './textClips';

import {
  createShapeClip,
  createSimpleShapeClip,
  createPolygonShapeClip
} from './shapeClips';

/**
 * 🎭 범용 클립 생성 함수
 * - 미디어 타입에 따라 적절한 생성 함수 자동 선택
 */
export function createClip(
  mediaType: MediaType,
  baseParams: {
    mediaId: string;
    trackId: string;
    startTime: number;
    duration: number;
    name?: string;
  },
  specificParams?: any
): NewTimelineClip {
  switch (mediaType) {
    case 'audio':
      return createAudioClip({
        ...baseParams,
        mediaUrl: specificParams?.mediaUrl || '',
        volume: specificParams?.volume,
        playbackRate: specificParams?.playbackRate,
      });

    case 'video':
      return createVideoClip({
        ...baseParams,
        mediaUrl: specificParams?.mediaUrl || '',
        x: specificParams?.x,
        y: specificParams?.y,
        width: specificParams?.width,
        height: specificParams?.height,
        opacity: specificParams?.opacity,
        rotation: specificParams?.rotation,
        volume: specificParams?.volume,
        playbackRate: specificParams?.playbackRate,
      });

    case 'image':
      return createImageClip({
        ...baseParams,
        mediaUrl: specificParams?.mediaUrl || '',
        x: specificParams?.x,
        y: specificParams?.y,
        width: specificParams?.width,
        height: specificParams?.height,
        opacity: specificParams?.opacity,
        rotation: specificParams?.rotation,
      });

    case 'text':
      return createTextClip({
        ...baseParams,
        text: specificParams?.text || '새 텍스트',
        x: specificParams?.x,
        y: specificParams?.y,
        width: specificParams?.width,
        height: specificParams?.height,
        opacity: specificParams?.opacity,
        rotation: specificParams?.rotation,
        fontSize: specificParams?.fontSize,
        fontFamily: specificParams?.fontFamily,
        color: specificParams?.color,
        backgroundColor: specificParams?.backgroundColor,
        id: specificParams?.id, // 서버 ID 보존
      });

    case 'sentence':
      return createSentenceClip({
        ...baseParams,
        text: specificParams?.text || '새 Sentence 클립',
        x: specificParams?.x,
        y: specificParams?.y,
        width: specificParams?.width,
        height: specificParams?.height,
        opacity: specificParams?.opacity,
        rotation: specificParams?.rotation,
        fontSize: specificParams?.fontSize,
        fontFamily: specificParams?.fontFamily,
        color: specificParams?.color,
        backgroundColor: specificParams?.backgroundColor,
        textSegments: specificParams?.textSegments,
        segmentOverlapMode: specificParams?.segmentOverlapMode,
        enableRealTimePreview: specificParams?.enableRealTimePreview,
        id: specificParams?.id, // 서버 ID 보존
      });

    case 'longsentence':
      return createLongSentenceClip({
        ...baseParams,
        data: specificParams?.data || [
          {
            text: specificParams?.text || '텍스트를 입력하세요...',
            mediaUrl: ''
          }
        ],
        x: specificParams?.x,
        y: specificParams?.y,
        width: specificParams?.width,
        height: specificParams?.height,
        opacity: specificParams?.opacity,
        rotation: specificParams?.rotation,
        maxWordsPerSentence: specificParams?.maxWordsPerSentence,
        splitOnPunctuation: specificParams?.splitOnPunctuation,
        generateTTS: specificParams?.generateTTS,
        generateSubtitles: specificParams?.generateSubtitles,
        language: specificParams?.language,
        voice: specificParams?.voice,
        autoConvertOnEdit: specificParams?.autoConvertOnEdit,
        preserveOriginal: specificParams?.preserveOriginal,
        mediaProperties: specificParams?.mediaProperties,
        displayMode: specificParams?.displayMode,
        id: specificParams?.id, // 서버 ID 보존
      });

    case 'shape':
      return createShapeClip({
        ...baseParams,
        x: specificParams?.x,
        y: specificParams?.y,
        width: specificParams?.width,
        height: specificParams?.height,
        opacity: specificParams?.opacity,
        rotation: specificParams?.rotation,
        id: specificParams?.id, // 서버 ID 보존
      });

    case 'simpleShape':
      return createSimpleShapeClip({
        ...baseParams,
        x: specificParams?.x,
        y: specificParams?.y,
        width: specificParams?.width,
        height: specificParams?.height,
        opacity: specificParams?.opacity,
        rotation: specificParams?.rotation,
        backgroundColor: specificParams?.backgroundColor,
        id: specificParams?.id, // 서버 ID 보존
      });

    case 'polygonShape':
      return createPolygonShapeClip({
        ...baseParams,
        x: specificParams?.x,
        y: specificParams?.y,
        width: specificParams?.width,
        height: specificParams?.height,
        opacity: specificParams?.opacity,
        rotation: specificParams?.rotation,
        shapeType: specificParams?.shapeType,
        backgroundColor: specificParams?.backgroundColor,
        polygonShapeProperties: specificParams?.polygonShapeProperties, // 🔺 서버에서 전달된 완전한 속성 객체
        id: specificParams?.id, // 서버 ID 보존
        parentClipId: specificParams?.parentClipId // 부모 클립 ID 전달
      });

    default:
      throw new Error(`지원하지 않는 미디어 타입: ${mediaType}`);
  }
}