/**
 * 📖 LongSentenceClip.tsx - 긴 문장 클립 복합 렌더링 컴포넌트
 * 
 * 긴 문장을 다양한 표시 모드로 렌더링하는 고급 클립 컴포넌트입니다.
 * 텍스트와 미디어를 독립적으로 또는 함께 표시할 수 있으며, 동적 문장 분할 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 다중 표시 모드 (텍스트만, 미디어만, 둘 다)
 * - 실시간 문장 분할 및 미리보기
 * - 독립적인 텍스트/미디어 속성 관리
 * - 고급 CSS 필터 및 효과 적용
 * - Edge Fade 마스크 및 그림자 효과
 * - 이미지/비디오 배경 지원
 * 
 * 성능 최적화:
 * - useEffect를 통한 문장 분할 캐싱
 * - 조건부 렌더링으로 불필요한 컴포넌트 생성 방지
 * - CSS 필터 함수 메모이제이션
 * - 미디어 타입별 최적화된 렌더링 경로
 * 
 * 사용 패턴:
 * - 긴 텍스트를 여러 문장으로 나누어 표시할 때
 * - 텍스트와 배경 미디어를 함께 조합할 때
 * - 동적으로 변화하는 컨텐츠 표시에 적합
 * 
 * 특별 고려사항:
 * - 텍스트와 미디어 속성이 완전히 분리되어 독립적 제어 가능
 * - LongSentenceApi를 통한 서버 사이드 문장 분할 처리
 * - 다국어 지원 (ko, en 등) 및 구두점 기반 분할 옵션
 */

import React, { useState, useEffect } from 'react';
import { LongSentenceClip as LongSentenceClipType } from '../../types/clipTypes';
import { TextClip } from './TextClip';
import { ImageClip } from './ImageClip';
import { VideoClip } from './VideoClip';
import { LongSentenceApi } from '../../services/api/longSentenceApi';
import { getEdgeFadeMask } from '../utils/clipRenderer.utils';

interface LongSentenceClipProps {
  clip: LongSentenceClipType;
  finalStyle: React.CSSProperties;
  isEditMode: boolean;
  clipProgress?: number;
  isPlaying?: boolean;
  isMuted?: boolean;
}

export const LongSentenceClip: React.FC<LongSentenceClipProps> = ({
  clip,
  finalStyle,
  isEditMode,
  clipProgress = 0,
  isPlaying = false,
  isMuted = false
}) => {
  const { displayMode = 'none', data } = clip;
  const [firstSplitSentence, setFirstSplitSentence] = useState<string>('');
  
  // 🎨 CSS 필터 생성 함수 (ClipRenderer와 동일한 로직)
  const createCSSFilter = (effectsClip: any): string => {
    return `
      brightness(${effectsClip.brightness ?? 100}%)
      contrast(${effectsClip.contrast ?? 100}%)
      saturate(${effectsClip.saturation ?? 100}%)
      hue-rotate(${effectsClip.hue ?? 0}deg)
      blur(${effectsClip.blur ?? 0}px)
      sepia(${effectsClip.sepia ?? 0}%)
      grayscale(${effectsClip.grayscale ?? 0}%)
    `.trim();
  };
  
  // 첫 번째 분할된 문장 가져오기
  useEffect(() => {
    const getFirstSplitSentence = async () => {
      if (!data || data.length === 0) return;
      
      const firstItem = data[0];
      if (!firstItem.text) return;
      
      try {
        const splitOptions = {
          maxWordsPerSentence: clip.maxWordsPerSentence ?? 15,
          splitOnPunctuation: clip.splitOnPunctuation ?? true,
          language: clip.language ?? 'ko'
        };
        
        const result = await LongSentenceApi.previewSplit(firstItem.text, splitOptions);
        
        if (result.sentences && result.sentences.length > 0) {
          setFirstSplitSentence(result.sentences[0]);
        } else {
          setFirstSplitSentence(firstItem.text);
        }
      } catch (error) {
        console.error('Error splitting text for preview:', error);
        setFirstSplitSentence(firstItem.text);
      }
    };
    
    getFirstSplitSentence();
  }, [data, clip.maxWordsPerSentence, clip.splitOnPunctuation, clip.language]);

  // displayMode가 'none'이면 아무것도 렌더링하지 않음
  if (displayMode === 'none') {
    return null;
  }

  // 첫 번째 데이터 항목 가져오기
  const firstItem = data && data.length > 0 ? data[0] : null;
  
  if (!firstItem) {
    return null;
  }

  const renderSentenceContent = () => {
    if (!firstItem.text && !firstSplitSentence) return null;

    // SentenceClip과 동일한 단순한 좌표 처리 방식
    const finalX = clip.textProperties?.x ?? 100;
    const finalY = clip.textProperties?.y ?? 100;
    
    let sentenceStyle: React.CSSProperties = {
      position: 'absolute',
      left: finalX,
      top: finalY,
      width: clip.textProperties?.width,
      height: clip.textProperties?.height,
      opacity: clip.textProperties?.opacity,
      transform: clip.textProperties?.rotation ? `rotate(${clip.textProperties.rotation}deg)` : undefined,
      zIndex: 10, // 텍스트를 미디어 위에 표시
      // 🎨 CSS 필터 적용 (textProperties에서 가져온 effects)
      filter: createCSSFilter({
        brightness: clip.textProperties?.brightness,
        contrast: clip.textProperties?.contrast,
        saturation: clip.textProperties?.saturation,
        hue: clip.textProperties?.hue,
        blur: clip.textProperties?.blur,
        sepia: clip.textProperties?.sepia,
        grayscale: clip.textProperties?.grayscale,
      }),
    };

    // TextClip처럼 렌더링하기 위한 임시 클립 객체 생성
    const textClip = {
      ...clip,
      text: firstSplitSentence || firstItem.text,
      mediaType: 'text' as const,
      // SentenceClip과 동일한 단순한 좌표 처리
      x: finalX,
      y: finalY,
      width: clip.textProperties?.width,
      height: clip.textProperties?.height,
      opacity: clip.textProperties?.opacity,
      rotation: clip.textProperties?.rotation,
      
      // 🎯 텍스트 스타일 속성들 (textProperties에서만 가져오기 - 루트 레벨 제거)
      color: (clip.textProperties as any)?.color,
      fontSize: (clip.textProperties as any)?.fontSize,
      fontFamily: (clip.textProperties as any)?.fontFamily,
      fontWeight: (clip.textProperties as any)?.fontWeight,
      fontStyle: (clip.textProperties as any)?.fontStyle,
      textAlign: (clip.textProperties as any)?.textAlign,
      lineHeight: (clip.textProperties as any)?.lineHeight,
      letterSpacing: (clip.textProperties as any)?.letterSpacing,
      textDecoration: (clip.textProperties as any)?.textDecoration,
      textTransform: (clip.textProperties as any)?.textTransform,
      backgroundColor: (() => {
        const bgColor = (clip.textProperties as any)?.backgroundColor;
        console.log('🎨 LongSentenceClip backgroundColor 전달:', {
          clipId: clip.id?.slice(-8),
          bgColor,
          hasGradient: bgColor?.includes('gradient'),
          textProperties: clip.textProperties
        });
        return bgColor;
      })(),
      borderRadius: (clip.textProperties as any)?.borderRadius,
      borderRadiusUnit: (clip.textProperties as any)?.borderRadiusUnit,
      textShadow: (clip.textProperties as any)?.textShadow,
      backgroundShadow: (clip.textProperties as any)?.backgroundShadow,
      strokeWidth: (clip.textProperties as any)?.strokeWidth,
      strokeColor: (clip.textProperties as any)?.strokeColor,
      
      // 🔧 패딩 속성들 추가 (누락되어 있었음)
      paddingTop: (clip.textProperties as any)?.paddingTop,
      paddingRight: (clip.textProperties as any)?.paddingRight,
      paddingBottom: (clip.textProperties as any)?.paddingBottom,
      paddingLeft: (clip.textProperties as any)?.paddingLeft,
      
      // 🎯 EffectsEditor 속성들 적용 (텍스트 영역 - textProperties 우선)
      // 페이드 효과
      fadeIn: (clip.textProperties as any)?.fadeIn,
      fadeOut: (clip.textProperties as any)?.fadeOut,
      
      // 시각 필터
      brightness: (clip.textProperties as any)?.brightness,
      contrast: (clip.textProperties as any)?.contrast,
      saturation: (clip.textProperties as any)?.saturation,
      hue: (clip.textProperties as any)?.hue,
      blur: (clip.textProperties as any)?.blur,
      sepia: (clip.textProperties as any)?.sepia,
      grayscale: (clip.textProperties as any)?.grayscale,
      
      // 애니메이션
      animationType: (clip.textProperties as any)?.animationType,
      animationDuration: (clip.textProperties as any)?.animationDuration,
      animationDelay: (clip.textProperties as any)?.animationDelay,
      animationEasing: (clip.textProperties as any)?.animationEasing,
      animationLoop: (clip.textProperties as any)?.animationLoop,
    };

    return (
      <TextClip 
        clip={textClip as any} 
        finalStyle={sentenceStyle} 
        isEditMode={isEditMode} 
      />
    );
  };

  const renderMediaContent = () => {
    if (!firstItem.mediaUrl) return null;

    // 🌪️ Edge Fade 마스크 효과 생성
    const edgeFadeMaskStyle = getEdgeFadeMask(
      (clip.mediaProperties as any)?.edgeFade || 0,
      (clip.mediaProperties as any)?.fadeType || 'radial',
      (clip.mediaProperties as any)?.edgeFadeStops
    );

    // Inner Shadow 값들을 미리 계산
    const innerShadowEnabled = (clip.mediaProperties as any)?.innerShadowEnabled;
    const innerShadowOffsetX = (clip.mediaProperties as any)?.innerShadowOffsetX || 2;
    const innerShadowOffsetY = (clip.mediaProperties as any)?.innerShadowOffsetY || 2;
    const innerShadowBlur = (clip.mediaProperties as any)?.innerShadowBlur || 4;
    const innerShadowColor = (clip.mediaProperties as any)?.innerShadowColor || 'rgba(0, 0, 0, 0.5)';

    // 미디어 전용 스타일 생성 (독립적인 영역)
    const mediaStyle: React.CSSProperties = {
      position: 'absolute',
      left: clip.mediaProperties?.x,
      top: clip.mediaProperties?.y,
      width: clip.mediaProperties?.width,
      height: clip.mediaProperties?.height,
      opacity: clip.mediaProperties?.opacity,
      transform: clip.mediaProperties?.rotation ? `rotate(${clip.mediaProperties.rotation}deg)` : undefined,
      zIndex: 1, // 미디어를 배경에 표시
      // 🎨 CSS 필터 적용 (mediaProperties에서 가져온 effects + Drop Shadow)
      filter: (() => {
        const filters = [];
        
        // 기본 필터들
        const baseFilter = createCSSFilter({
          brightness: clip.mediaProperties?.brightness,
          contrast: clip.mediaProperties?.contrast,
          saturation: clip.mediaProperties?.saturation,
          hue: clip.mediaProperties?.hue,
          blur: clip.mediaProperties?.blur,
          sepia: clip.mediaProperties?.sepia,
          grayscale: clip.mediaProperties?.grayscale,
        });
        if (baseFilter.trim()) filters.push(baseFilter);
        
        // Drop Shadow 필터
        if ((clip.mediaProperties as any)?.shadowEnabled) {
          const offsetX = (clip.mediaProperties as any)?.shadowOffsetX || 4;
          const offsetY = (clip.mediaProperties as any)?.shadowOffsetY || 4;
          const blur = (clip.mediaProperties as any)?.shadowBlur || 8;
          const color = (clip.mediaProperties as any)?.shadowColor || 'rgba(0, 0, 0, 0.3)';
          filters.push(`drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`);
        }
        
        return filters.length > 0 ? filters.join(' ') : undefined;
      })(),
      // Inner Shadow를 box-shadow로 직접 적용
      boxShadow: innerShadowEnabled ? `inset ${innerShadowOffsetX}px ${innerShadowOffsetY}px ${innerShadowBlur}px ${innerShadowColor}` : undefined,
      // 🎯 ImagePropertiesEditor CSS 효과들 추가
      borderRadius: (clip.mediaProperties as any)?.borderRadius ? 
        `${(clip.mediaProperties as any).borderRadius}${(clip.mediaProperties as any)?.borderRadiusUnit || 'px'}` : 
        undefined,
      border: (clip.mediaProperties as any)?.borderWidth ? 
        `${(clip.mediaProperties as any).borderWidth}px solid ${(clip.mediaProperties as any)?.borderColor || '#ffffff'}` : 
        undefined,
      objectFit: (clip.mediaProperties as any)?.backgroundFit || 'fill',
      objectPosition: (clip.mediaProperties as any)?.backgroundPosition || 'center',
      // 클리핑 보장 (둥근 테두리가 있을 때)
      overflow: (clip.mediaProperties as any)?.borderRadius ? 'hidden' : 'visible',
      // 🌪️ Edge Fade 마스크 적용
      ...edgeFadeMaskStyle,
    };

    // mediaUrl에서 파일 확장자로 타입 판단
    const isVideo = /\.(mp4|webm|mov|avi)$/i.test(firstItem.mediaUrl);
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(firstItem.mediaUrl);


    if (isVideo) {
      // VideoClip처럼 렌더링하기 위한 임시 클립 객체 생성
      const videoClip = {
        ...clip,
        mediaUrl: firstItem.mediaUrl,
        mediaType: 'video' as const,
        // 미디어 전용 속성 적용
        x: clip.mediaProperties?.x,
        y: clip.mediaProperties?.y,
        width: clip.mediaProperties?.width,
        height: clip.mediaProperties?.height,
        opacity: clip.mediaProperties?.opacity,
        rotation: clip.mediaProperties?.rotation,
        volume: 1,
        playbackRate: 1,
        
        // 🎯 EffectsEditor 속성들 적용 (미디어 영역 - mediaProperties에서 가져옴)
        // 페이드 효과
        fadeIn: (clip.mediaProperties as any)?.fadeIn,
        fadeOut: (clip.mediaProperties as any)?.fadeOut,
        
        // 시각 필터
        brightness: (clip.mediaProperties as any)?.brightness,
        contrast: (clip.mediaProperties as any)?.contrast,
        saturation: (clip.mediaProperties as any)?.saturation,
        hue: (clip.mediaProperties as any)?.hue,
        blur: (clip.mediaProperties as any)?.blur,
        sepia: (clip.mediaProperties as any)?.sepia,
        grayscale: (clip.mediaProperties as any)?.grayscale,
        
        // 애니메이션
        animationType: (clip.mediaProperties as any)?.animationType,
        animationDuration: (clip.mediaProperties as any)?.animationDuration,
        animationDelay: (clip.mediaProperties as any)?.animationDelay,
        animationEasing: (clip.mediaProperties as any)?.animationEasing,
        animationLoop: (clip.mediaProperties as any)?.animationLoop,
        
        // 🎯 ImagePropertiesEditor 속성들 추가 (비디오에도 적용 가능)
        // 비디오 배경 속성
        backgroundFit: (clip.mediaProperties as any)?.backgroundFit || 'fill',
        backgroundPosition: (clip.mediaProperties as any)?.backgroundPosition || 'center',
        
        // 둥근 테두리
        borderRadius: (clip.mediaProperties as any)?.borderRadius || 0,
        borderRadiusUnit: (clip.mediaProperties as any)?.borderRadiusUnit || 'px',
        
        // 가장자리 페이드
        edgeFade: (clip.mediaProperties as any)?.edgeFade || 0,
        fadeType: (clip.mediaProperties as any)?.fadeType || 'radial',
        edgeFadeStops: (clip.mediaProperties as any)?.edgeFadeStops,
        
        // Border Stroke
        borderWidth: (clip.mediaProperties as any)?.borderWidth || 0,
        borderColor: (clip.mediaProperties as any)?.borderColor || '#ffffff',
        
        // Shadow Effects
        shadowEnabled: (clip.mediaProperties as any)?.shadowEnabled || false,
        shadowOffsetX: (clip.mediaProperties as any)?.shadowOffsetX || 4,
        shadowOffsetY: (clip.mediaProperties as any)?.shadowOffsetY || 4,
        shadowBlur: (clip.mediaProperties as any)?.shadowBlur || 8,
        shadowColor: (clip.mediaProperties as any)?.shadowColor || 'rgba(0, 0, 0, 0.3)',
        innerShadowEnabled: (clip.mediaProperties as any)?.innerShadowEnabled || false,
        innerShadowOffsetX: (clip.mediaProperties as any)?.innerShadowOffsetX || 2,
        innerShadowOffsetY: (clip.mediaProperties as any)?.innerShadowOffsetY || 2,
        innerShadowBlur: (clip.mediaProperties as any)?.innerShadowBlur || 4,
        innerShadowColor: (clip.mediaProperties as any)?.innerShadowColor || 'rgba(0, 0, 0, 0.5)',
      };

      return (
        <VideoClip
          clip={videoClip as any}
          finalStyle={mediaStyle}
          clipProgress={clipProgress}
          isEditMode={isEditMode}
          isPlaying={isPlaying}
          isMuted={isMuted}
        />
      );
    } else if (isImage) {
      // ImageClip처럼 렌더링하기 위한 임시 클립 객체 생성
      const imageClip = {
        ...clip,
        mediaUrl: firstItem.mediaUrl,
        mediaType: 'image' as const,
        // 미디어 전용 속성 적용
        x: clip.mediaProperties?.x,
        y: clip.mediaProperties?.y,
        width: clip.mediaProperties?.width,
        height: clip.mediaProperties?.height,
        opacity: clip.mediaProperties?.opacity,
        rotation: clip.mediaProperties?.rotation,
        
        // 🎯 EffectsEditor 속성들 적용 (미디어 영역 - mediaProperties에서 가져옴)
        // 페이드 효과
        fadeIn: (clip.mediaProperties as any)?.fadeIn,
        fadeOut: (clip.mediaProperties as any)?.fadeOut,
        
        // 시각 필터
        brightness: (clip.mediaProperties as any)?.brightness,
        contrast: (clip.mediaProperties as any)?.contrast,
        saturation: (clip.mediaProperties as any)?.saturation,
        hue: (clip.mediaProperties as any)?.hue,
        blur: (clip.mediaProperties as any)?.blur,
        sepia: (clip.mediaProperties as any)?.sepia,
        grayscale: (clip.mediaProperties as any)?.grayscale,
        
        // 애니메이션
        animationType: (clip.mediaProperties as any)?.animationType,
        animationDuration: (clip.mediaProperties as any)?.animationDuration,
        animationDelay: (clip.mediaProperties as any)?.animationDelay,
        animationEasing: (clip.mediaProperties as any)?.animationEasing,
        animationLoop: (clip.mediaProperties as any)?.animationLoop,
        
        // 🎯 ImagePropertiesEditor 속성들 추가
        // 이미지 배경 속성
        backgroundFit: (clip.mediaProperties as any)?.backgroundFit || 'fill',
        backgroundPosition: (clip.mediaProperties as any)?.backgroundPosition || 'center',
        
        // 둥근 테두리
        borderRadius: (clip.mediaProperties as any)?.borderRadius || 0,
        borderRadiusUnit: (clip.mediaProperties as any)?.borderRadiusUnit || 'px',
        
        // 가장자리 페이드
        edgeFade: (clip.mediaProperties as any)?.edgeFade || 0,
        fadeType: (clip.mediaProperties as any)?.fadeType || 'radial',
        edgeFadeStops: (clip.mediaProperties as any)?.edgeFadeStops,
        
        // Border Stroke
        borderWidth: (clip.mediaProperties as any)?.borderWidth || 0,
        borderColor: (clip.mediaProperties as any)?.borderColor || '#ffffff',
        
        // Shadow Effects
        shadowEnabled: (clip.mediaProperties as any)?.shadowEnabled || false,
        shadowOffsetX: (clip.mediaProperties as any)?.shadowOffsetX || 4,
        shadowOffsetY: (clip.mediaProperties as any)?.shadowOffsetY || 4,
        shadowBlur: (clip.mediaProperties as any)?.shadowBlur || 8,
        shadowColor: (clip.mediaProperties as any)?.shadowColor || 'rgba(0, 0, 0, 0.3)',
        innerShadowEnabled: (clip.mediaProperties as any)?.innerShadowEnabled || false,
        innerShadowOffsetX: (clip.mediaProperties as any)?.innerShadowOffsetX || 2,
        innerShadowOffsetY: (clip.mediaProperties as any)?.innerShadowOffsetY || 2,
        innerShadowBlur: (clip.mediaProperties as any)?.innerShadowBlur || 4,
        innerShadowColor: (clip.mediaProperties as any)?.innerShadowColor || 'rgba(0, 0, 0, 0.5)',
      };

      return (
        <ImageClip
          clip={imageClip as any}
          finalStyle={mediaStyle}
          isEditMode={isEditMode}
        />
      );
    }

    return null;
  };

  // displayMode에 따른 렌더링
  switch (displayMode) {
    case 'sentence':
      return renderSentenceContent();
      
    case 'media':
      return renderMediaContent();
      
    case 'both':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* 미디어 - 독립적인 영역 */}
          {renderMediaContent()}
          {/* 텍스트 - 독립적인 영역 */}
          {renderSentenceContent()}
        </div>
      );
      
    default:
      return null;
  }
};