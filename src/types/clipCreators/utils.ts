/**
 * 🔧 clipCreators/utils.ts - 클립 생성 공통 유틸리티
 * 
 * 모든 클립 생성 함수에서 공통으로 사용되는 유틸리티 함수들을 정의합니다.
 * - ID 생성
 * - 기본 이름 설정
 * - 공통 속성 처리
 */

import { MediaType } from '../clipCore';

/**
 * 🆔 고유 ID 생성 함수
 */
export function generateClipId(): string {
  return `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 🏷️ 클립 타입별 기본 이름 생성
 */
export function getDefaultClipName(mediaType: MediaType, customName?: string): string {
  if (customName && customName.trim()) {
    return customName.trim();
  }

  const defaultNames: Record<MediaType, string> = {
    audio: '오디오 클립',
    video: '비디오 클립',
    image: '이미지 클립',
    text: '텍스트 클립',
    sentence: 'Sentence 클립',
    longsentence: 'LongSentence 클립',
    shape: '도형 클립',
    simpleShape: '단순 도형',
    polygonShape: '다각형',
    spacer: '스페이서 클립'
  };

  return defaultNames[mediaType] || '클립';
}

/**
 * 🔗 공통 확장 속성 처리
 */
export function applyCommonExtendedProperties(clip: any, params: {
  baseClipProperties?: any;
  parentClipId?: string;
}): void {
  // 기준 클립 속성 추가
  if (params.baseClipProperties) {
    clip.baseClipProperties = params.baseClipProperties;
  }

  // 부모 클립 ID 추가
  if (params.parentClipId) {
    clip.parentClipId = params.parentClipId;
  }
}

/**
 * 🎯 기본 이펙트 속성 생성
 */
export function getDefaultEffectProperties() {
  return {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    fadeIn: 0,
    fadeOut: 0,
    animationDuration: 1,
    animationDelay: 0,
    animationEasing: 'ease',
    animationLoop: false,
  };
}

/**
 * 🎨 기본 시각적 속성 생성
 */
export function getDefaultVisualProperties(overrides: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
} = {}) {
  return {
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    width: overrides.width ?? 1920,
    height: overrides.height ?? 1080,
    opacity: 1.0,
    rotation: 0,
  };
}

/**
 * 🎵 기본 오디오 속성 생성
 */
export function getDefaultAudioProperties() {
  return {
    volume: 1.0,
    playbackRate: 1.0,
  };
}

/**
 * ⏰ endTime 계산
 */
export function calculateEndTime(startTime: number, duration: number): number {
  return startTime + duration;
}