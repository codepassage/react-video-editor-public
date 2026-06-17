/**
 * 🔶 shapeClips.ts - 도형 클립 생성 함수들
 * 
 * 다양한 도형 클립을 생성하는 팩토리 함수들을 제공합니다.
 * 기본 도형부터 복잡한 다각형까지 지원합니다.
 */

import type { ShapeClip, SimpleShapeClip, PolygonShapeClip } from '../clipTypes';
import { generateClipId, getDefaultClipName } from './utils';

/**
 * 🔶 기본 도형 클립 생성
 */
export function createShapeClip(params: {
  mediaId: string;
  trackId: string;
  startTime: number;
  duration: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  // 🎯 이펙트 속성들 추가
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
  id?: string; // 서버 ID 보존
}): ShapeClip {
  const endTime = params.startTime + params.duration;

  return {
    // 🔧 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('shape', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'shape',

    // 🎨 시각적 속성 (기본값 설정)
    x: params.x ?? 100,
    y: params.y ?? 100,
    width: params.width ?? 200,
    height: params.height ?? 200,
    opacity: params.opacity ?? 1.0,
    rotation: params.rotation ?? 0,

    // 🎯 이펙트 속성들 추가
    brightness: params.brightness ?? 100,
    contrast: params.contrast ?? 100,
    saturation: params.saturation ?? 100,
    hue: params.hue ?? 0,
    blur: params.blur ?? 0,
    sepia: params.sepia ?? 0,
    grayscale: params.grayscale ?? 0,
    fadeIn: params.fadeIn ?? 0,
    fadeOut: params.fadeOut ?? 0,
    animationType: params.animationType,
    animationDuration: params.animationDuration ?? 1,
    animationDelay: params.animationDelay ?? 0,
    animationEasing: params.animationEasing ?? 'ease',
    animationLoop: params.animationLoop ?? false,

    // 🔶 Shape 속성은 나중에 설정
  };
}

/**
 * 🔹 단순 도형 클립 생성
 */
export function createSimpleShapeClip(params: {
  mediaId: string;
  trackId: string;
  startTime: number;
  duration: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  backgroundColor?: string;
  // 🎯 이펙트 속성들 추가
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
  id?: string; // 서버 ID 보존
}): SimpleShapeClip {
  const endTime = params.startTime + params.duration;

  return {
    // 🔧 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('simpleShape', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'simpleShape',

    // 🎨 시각적 속성 (기본값 설정)
    x: params.x ?? 100,
    y: params.y ?? 100,
    width: params.width ?? 200,
    height: params.height ?? 200,
    opacity: params.opacity ?? 1.0,
    rotation: params.rotation ?? 0,

    // 🔹 단순 Shape 속성
    simpleShapeProperties: {
      backgroundType: 'color',
      backgroundColor: params.backgroundColor ?? '#3498db',
    },

    // 🎯 이펙트 속성들 추가
    brightness: params.brightness ?? 100,
    contrast: params.contrast ?? 100,
    saturation: params.saturation ?? 100,
    hue: params.hue ?? 0,
    blur: params.blur ?? 0,
    sepia: params.sepia ?? 0,
    grayscale: params.grayscale ?? 0,
    fadeIn: params.fadeIn ?? 0,
    fadeOut: params.fadeOut ?? 0,
    animationType: params.animationType,
    animationDuration: params.animationDuration ?? 1,
    animationDelay: params.animationDelay ?? 0,
    animationEasing: params.animationEasing ?? 'ease',
    animationLoop: params.animationLoop ?? false,
  };
}

/**
 * 🔺 다각형 도형 클립 생성
 */
export function createPolygonShapeClip(params: {
  mediaId: string;
  trackId: string;
  startTime: number;
  duration: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  shapeType?: 'star' | 'heart' | 'triangle' | 'diamond' | 'circle' | 'rectangle';
  backgroundColor?: string;
  polygonShapeProperties?: any; // 🔺 서버에서 전달된 완전한 속성 객체
  // 🎯 이펙트 속성들 추가
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
  id?: string; // 서버 ID 보존
  parentClipId?: string; // 부모 클립 ID 추가
}): PolygonShapeClip {
  const endTime = params.startTime + params.duration;

  const clip: any = {
    // 🔧 기본 속성
    id: params.id || generateClipId(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    name: getDefaultClipName('polygonShape', params.name),
    startTime: params.startTime,
    endTime: endTime,
    duration: params.duration,
    mediaType: 'polygonShape',

    // 🎨 시각적 속성 (기본값 설정)
    x: params.x ?? 100,
    y: params.y ?? 100,
    width: params.width ?? 200,
    height: params.height ?? 200,
    opacity: params.opacity ?? 1.0,
    rotation: params.rotation ?? 0,

    // 🔺 다각형 Shape 속성 - 서버 데이터 우선 사용
    polygonShapeProperties: params.polygonShapeProperties || {
      shapeType: params.shapeType ?? 'rectangle',
      backgroundType: 'color',
      backgroundColor: params.backgroundColor ?? '#e74c3c',
    },

    // 🎯 이펙트 속성들 추가
    brightness: params.brightness ?? 100,
    contrast: params.contrast ?? 100,
    saturation: params.saturation ?? 100,
    hue: params.hue ?? 0,
    blur: params.blur ?? 0,
    sepia: params.sepia ?? 0,
    grayscale: params.grayscale ?? 0,
    fadeIn: params.fadeIn ?? 0,
    fadeOut: params.fadeOut ?? 0,
    animationType: params.animationType,
    animationDuration: params.animationDuration ?? 1,
    animationDelay: params.animationDelay ?? 0,
    animationEasing: params.animationEasing ?? 'ease',
    animationLoop: params.animationLoop ?? false,
  };

  // 🔗 부모 클립 ID 추가
  if (params.parentClipId) {
    clip.parentClipId = params.parentClipId;
  }

  return clip;
}