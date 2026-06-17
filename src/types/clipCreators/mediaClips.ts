/**
 * 🎬 clipCreators/mediaClips.ts - 미디어 클립 생성자들
 * 
 * 오디오, 비디오, 이미지 클립 생성 함수들을 정의합니다.
 * - createAudioClip: 오디오 전용 클립
 * - createVideoClip: 비디오 + 오디오 클립
 * - createImageClip: 이미지 전용 클립
 */

import { AudioClip, VideoClip, ImageClip } from '../clipTypes';
import {
  generateClipId,
  getDefaultClipName,
  applyCommonExtendedProperties,
  getDefaultEffectProperties,
  getDefaultVisualProperties,
  getDefaultAudioProperties,
  calculateEndTime
} from './utils';

/**
 * 🎵 Audio 클립 생성
 * - 시각적 속성 없음
 * - 오디오 속성만 포함
 */
export function createAudioClip(params: {
  mediaId: string;
  trackId: string;
  mediaUrl: string;
  startTime: number;
  duration: number;
  name?: string;
  volume?: number;
  playbackRate?: number;
  id?: string;
  baseClipProperties?: any;
  parentClipId?: string;
}): AudioClip {
  const endTime = calculateEndTime(params.startTime, params.duration);
  const audioProperties = getDefaultAudioProperties();

  const clip: any = {
    // 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('audio', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'audio',
    mediaUrl: params.mediaUrl,

    // 오디오 속성
    volume: params.volume ?? audioProperties.volume,
    playbackRate: params.playbackRate ?? audioProperties.playbackRate,
  };

  // 공통 확장 속성 적용
  applyCommonExtendedProperties(clip, params);

  return clip;
}

/**
 * 🎬 Video 클립 생성  
 * - 시각적 + 오디오 속성 모두 포함
 */
export function createVideoClip(params: {
  mediaId: string;
  trackId: string;
  mediaUrl: string;
  startTime: number;
  duration: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  volume?: number;
  playbackRate?: number;
  // 이펙트 속성들
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;
  fadeIn?: number;
  fadeOut?: number;
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;
  id?: string;
  baseClipProperties?: any;
  parentClipId?: string;
}): VideoClip {
  const endTime = calculateEndTime(params.startTime, params.duration);
  const visualProperties = getDefaultVisualProperties({
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height
  });
  const audioProperties = getDefaultAudioProperties();
  const effectProperties = getDefaultEffectProperties();

  const clip: any = {
    // 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('video', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'video',
    mediaUrl: params.mediaUrl,

    // 시각적 속성
    ...visualProperties,
    opacity: params.opacity ?? visualProperties.opacity,
    rotation: params.rotation ?? visualProperties.rotation,

    // 오디오 속성
    volume: params.volume ?? audioProperties.volume,
    playbackRate: params.playbackRate ?? audioProperties.playbackRate,

    // 이펙트 속성들
    brightness: params.brightness ?? effectProperties.brightness,
    contrast: params.contrast ?? effectProperties.contrast,
    saturation: params.saturation ?? effectProperties.saturation,
    hue: params.hue ?? effectProperties.hue,
    blur: params.blur ?? effectProperties.blur,
    sepia: params.sepia ?? effectProperties.sepia,
    grayscale: params.grayscale ?? effectProperties.grayscale,
    fadeIn: params.fadeIn ?? effectProperties.fadeIn,
    fadeOut: params.fadeOut ?? effectProperties.fadeOut,
    animationType: params.animationType,
    animationDuration: params.animationDuration ?? effectProperties.animationDuration,
    animationDelay: params.animationDelay ?? effectProperties.animationDelay,
    animationEasing: params.animationEasing ?? effectProperties.animationEasing,
    animationLoop: params.animationLoop ?? effectProperties.animationLoop,
  };

  // 공통 확장 속성 적용
  applyCommonExtendedProperties(clip, params);

  return clip;
}

/**
 * 🖼️ Image 클립 생성
 * - 시각적 속성만 포함
 * - 오디오 속성 없음
 */
export function createImageClip(params: {
  mediaId: string;
  trackId: string;
  mediaUrl: string;
  startTime: number;
  duration: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  // 이펙트 속성들
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sepia?: number;
  grayscale?: number;
  fadeIn?: number;
  fadeOut?: number;
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  animationLoop?: boolean;
  id?: string;
  baseClipProperties?: any;
  parentClipId?: string;
}): ImageClip {
  const endTime = calculateEndTime(params.startTime, params.duration);
  const visualProperties = getDefaultVisualProperties({
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height
  });
  const effectProperties = getDefaultEffectProperties();

  const clip: any = {
    // 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('image', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'image',
    mediaUrl: params.mediaUrl,

    // 시각적 속성
    ...visualProperties,
    opacity: params.opacity ?? visualProperties.opacity,
    rotation: params.rotation ?? visualProperties.rotation,

    // 이펙트 속성들
    brightness: params.brightness ?? effectProperties.brightness,
    contrast: params.contrast ?? effectProperties.contrast,
    saturation: params.saturation ?? effectProperties.saturation,
    hue: params.hue ?? effectProperties.hue,
    blur: params.blur ?? effectProperties.blur,
    sepia: params.sepia ?? effectProperties.sepia,
    grayscale: params.grayscale ?? effectProperties.grayscale,
    fadeIn: params.fadeIn ?? effectProperties.fadeIn,
    fadeOut: params.fadeOut ?? effectProperties.fadeOut,
    animationType: params.animationType,
    animationDuration: params.animationDuration ?? effectProperties.animationDuration,
    animationDelay: params.animationDelay ?? effectProperties.animationDelay,
    animationEasing: params.animationEasing ?? effectProperties.animationEasing,
    animationLoop: params.animationLoop ?? effectProperties.animationLoop,
  };

  // 공통 확장 속성 적용
  applyCommonExtendedProperties(clip, params);

  return clip;
}