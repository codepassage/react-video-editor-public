import { useCallback } from 'react';
import { useLongSentenceDefaults } from './useLongSentenceDefaults';
import { LongSentenceClip } from '../../../types/clipTypes';

export const useLongSentenceInitializers = (clip: LongSentenceClip) => {
  const { mediaDefaults, textDefaults } = useLongSentenceDefaults(clip);

  const createInitialMediaProperties = useCallback(() => ({
    ...mediaDefaults,
    // 필터 효과 (모든 기본값 포함)
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    // 페이드 효과
    fadeIn: 0,
    fadeOut: 0,
    // 애니메이션
    animationType: undefined,
    animationDuration: 1,
    animationDelay: 0,
    animationEasing: 'ease',
    animationLoop: false,
    // 포지셔닝
    positionMargin: { top: 50, right: 50, bottom: 50, left: 50 }
  }), [mediaDefaults]);

  const createInitialTextProperties = useCallback(() => ({
    ...textDefaults,
    // 포지셔닝
    positioning: 'coordinate',
    alignment: undefined,
    // 필터 효과 (모든 기본값 포함)
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    // 페이드 효과
    fadeIn: 0,
    fadeOut: 0,
    // 애니메이션
    animationType: undefined,
    animationDuration: 1,
    animationDelay: 0,
    animationEasing: 'ease',
    animationLoop: false
  }), [textDefaults]);

  return {
    createInitialMediaProperties,
    createInitialTextProperties
  };
};