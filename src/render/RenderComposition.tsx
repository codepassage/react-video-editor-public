import React, { useEffect, useState } from 'react';
import { Sequence, AbsoluteFill, useCurrentFrame, useVideoConfig, delayRender, continueRender, getInputProps } from 'remotion';
import type { RenderTimelineDataItem, RenderScrubber, RenderCompositionProps } from './types';
import { ClipRenderer } from '../remotion/ClipRenderer';
import type { TimelineClip } from '../types';
import { preloadRenderingFonts, normalizeFontFamily, preloadProjectFonts } from '../utils/fontLoader';
import { initializeFontCollection } from '../data/fonts';

interface RenderCompositionProps {
  timelineData: RenderTimelineDataItem[];
  isRendering: boolean;
}

interface RenderCompositionProps {
  timelineData: RenderTimelineDataItem[];
  isRendering: boolean;
}

// RenderScrubber를 TimelineClip으로 변환하는 함수
const convertScrubberToClip = (scrubber: RenderScrubber): TimelineClip => {
  // 기본 클립 구조 생성
  const baseClip: TimelineClip = {
    id: scrubber.id,
    startTime: scrubber.startTime,
    endTime: scrubber.startTime + scrubber.duration,
    duration: scrubber.duration,
    x: scrubber.x,
    y: scrubber.y,
    width: scrubber.width,
    height: scrubber.height,
    opacity: scrubber.opacity || 1,
    rotation: scrubber.rotation || 0,

    // 🎨 변형 속성 추가
    scaleX: scrubber.scaleX || 1,
    scaleY: scrubber.scaleY || 1,
    skewX: scrubber.skewX || 0,
    skewY: scrubber.skewY || 0,
    anchorX: scrubber.anchorX || 0.5,
    anchorY: scrubber.anchorY || 0.5,
    blendMode: scrubber.blendMode || 'normal',

    // 🎨 시각 필터 속성 추가
    brightness: scrubber.brightness || 100,
    contrast: scrubber.contrast || 100,
    saturation: scrubber.saturation || 100,
    hue: scrubber.hue || 0,
    blur: scrubber.blur || 0,
    sepia: scrubber.sepia || 0,
    grayscale: scrubber.grayscale || 0,

    // 🎨 페이드 효과 속성 추가
    fadeIn: scrubber.fadeIn || 0,
    fadeOut: scrubber.fadeOut || 0,

    mediaType: scrubber.mediaType,

    // 🎬 애니메이션 속성 추가 (scrubber에서 가져오기)
    animationType: (scrubber as any).animationType,
    animationDuration: (scrubber as any).animationDuration || 1,
    animationDelay: (scrubber as any).animationDelay || 0,
    animationEasing: (scrubber as any).animationEasing || 'ease',
    animationLoop: (scrubber as any).animationLoop || false,
  };

  // 미디어 타입별 추가 속성 설정
  switch (scrubber.mediaType) {
    case 'text':
      return {
        ...baseClip,
        text: scrubber.text || '',
        fontSize: scrubber.fontSize || 48,
        fontFamily: normalizeFontFamily(scrubber.fontFamily || 'Nanum Gothic'),
        fontWeight: scrubber.fontWeight || 'normal',
        fontStyle: scrubber.fontStyle || 'normal',
        color: scrubber.color || '#ffffff',
        textAlign: scrubber.textAlign || 'center',
        lineHeight: scrubber.lineHeight || 1.2,
        letterSpacing: scrubber.letterSpacing || 0,
        textDecoration: scrubber.textDecoration || 'none',
        textTransform: scrubber.textTransform || 'none',
        backgroundColor: scrubber.backgroundColor || 'transparent',
        // 📝 텍스트 효과 속성들
        textShadow: scrubber.textShadow || 'none',
        backgroundShadow: scrubber.backgroundShadow || 'none',
        borderRadius: scrubber.borderRadius || 0,
        borderRadiusUnit: scrubber.borderRadiusUnit || 'px',
        textGradient: scrubber.textGradient,
        textGlow: scrubber.textGlow,
        strokeWidth: scrubber.strokeWidth,
        strokeColor: scrubber.strokeColor,
        multipleStrokes: scrubber.multipleStrokes,
        textBevel: scrubber.textBevel,
        textExtrude: scrubber.textExtrude,
        multipleShadows: scrubber.multipleShadows,
        textTexture: scrubber.textTexture,
        mediaUrl: undefined
      };

    case 'sentence':
      return {
        ...baseClip,
        // 📄 기본 텍스트 속성들
        text: scrubber.text || '',
        fontSize: scrubber.fontSize || 48,
        fontFamily: normalizeFontFamily(scrubber.fontFamily || 'Nanum Gothic'),
        fontWeight: scrubber.fontWeight || 'normal',
        fontStyle: scrubber.fontStyle || 'normal',
        color: scrubber.color || '#ffffff',
        textAlign: scrubber.textAlign || 'center',
        lineHeight: scrubber.lineHeight || 1.2,
        letterSpacing: scrubber.letterSpacing || 0,
        textDecoration: scrubber.textDecoration || 'none',
        textTransform: scrubber.textTransform || 'none',
        backgroundColor: scrubber.backgroundColor || 'transparent',

        // 📄 Sentence 클립 전용 속성들
        textSegments: scrubber.textSegments || [],
        segmentVersion: scrubber.segmentVersion || 1,
        totalSegments: scrubber.totalSegments || 0,
        lastEditedSegmentId: scrubber.lastEditedSegmentId,
        segmentOverlapMode: scrubber.segmentOverlapMode || 'priority',
        enableRealTimePreview: scrubber.enableRealTimePreview || true,
        autoSize: scrubber.autoSize || false,

        // 📄 텍스트 효과 속성들
        textShadow: scrubber.textShadow || 'none',
        backgroundShadow: scrubber.backgroundShadow || 'none',
        borderRadius: scrubber.borderRadius || 0,
        borderRadiusUnit: scrubber.borderRadiusUnit || 'px',
        textGradient: scrubber.textGradient,
        textGlow: scrubber.textGlow,
        strokeWidth: scrubber.strokeWidth,
        strokeColor: scrubber.strokeColor,
        multipleStrokes: scrubber.multipleStrokes,
        textBevel: scrubber.textBevel,
        textExtrude: scrubber.textExtrude,
        multipleShadows: scrubber.multipleShadows,
        textTexture: scrubber.textTexture,
        mediaUrl: undefined
      };

    case 'image':
    case 'video':
      return {
        ...baseClip,
        mediaUrl: scrubber.mediaUrlLocal || scrubber.mediaUrlRemote,
        volume: scrubber.volume || 1,
        playbackRate: scrubber.playbackRate || 1
      };

    case 'audio':
      const finalAudioUrl = scrubber.mediaUrlLocal || scrubber.mediaUrlRemote;

      return {
        ...baseClip,
        mediaUrl: finalAudioUrl,
        volume: scrubber.volume || 1,
        playbackRate: scrubber.playbackRate || 1
      };

    case 'simpleShape':
      return {
        ...baseClip,
        mediaUrl: scrubber.mediaUrlLocal || scrubber.mediaUrlRemote,
        simpleShapeProperties: scrubber.simpleShapeProperties
      };

    case 'polygonShape':

      return {
        ...baseClip,
        polygonShapeProperties: scrubber.polygonShapeProperties || {
          shapeType: 'star',
          backgroundType: 'color',
          backgroundColor: '#3b82f6'
        }
      };

    case 'shape':
      return {
        ...baseClip,
        shapeProperties: scrubber.shapeProperties
      };

    default:
      return baseClip;
  }
};

export function RenderComposition({ timelineData, isRendering }: RenderCompositionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;
  
  // 렌더링 props 접근 (환경변수는 이제 빌드 타임에 주입됨)
  // const inputProps = getInputProps() as any;

  // 🎨 폰트 로딩 상태 관리
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [renderHandle] = useState(() => delayRender('Loading Korean fonts'));

  // 🎨 렌더링용 폰트 시스템 초기화 및 미리 로드
  useEffect(() => {
    const loadFonts = async () => {
      try {
        console.log('🎨 렌더링 환경: 폰트 시스템 초기화 시작...');

        // 폰트 시스템 초기화
        await initializeFontCollection();

        // 프로젝트에서 사용된 폰트들 추출 (Text와 Sentence 클립 모두 포함)
        const projectTracks = timelineData.map(timeline => ({
          clips: timeline.scrubbers.filter(scrubber =>
            scrubber.mediaType === 'text' || scrubber.mediaType === 'sentence'
          )
        }));

        if (projectTracks.some(track => track.clips.length > 0)) {
          console.log('🎨 프로젝트 기반 폰트 로딩...');
          await preloadProjectFonts(projectTracks);
        } else {
          console.log('🎨 기본 폰트 로딩...');
          await preloadRenderingFonts();
        }

        console.log('✅ 렌더링용 폰트 로딩 완료');
        setFontsLoaded(true);
        continueRender(renderHandle);
      } catch (error) {
        console.error('❌ 폰트 로딩 실패:', error);
        // 폰트 로딩 실패해도 렌더링은 계속 진행
        setFontsLoaded(true);
        continueRender(renderHandle);
      }
    };

    loadFonts();
  }, [renderHandle, timelineData]);

  // 모든 scrubber들을 수집하고 TimelineClip으로 변환
  const allClips: Array<{ clip: TimelineClip; zIndex: number }> = [];

  timelineData.forEach((timeline, timelineIndex) => {
    timeline.scrubbers.forEach((scrubber, scrubberIndex) => {
      // 🚨 서버 렌더링에서 LongSentence 클립 제외 (자식 클립들만 렌더링)
      if (scrubber.mediaType === 'longsentence') {
        console.log('🚫 LongSentence 클립 제외 (서버 렌더링):', scrubber.id);
        return;
      }

      // trackId에서 트랙 번호 추출 ("track-1" → 1)
      const trackNumber = scrubber.trackId ? parseInt(scrubber.trackId.replace('track-', '')) : 1;

      // 트랙 번호가 작을수록 더 높은 z-index (위 트랙이 최상위)
      const maxTrackNumber = 100;
      const reversedTrackNumber = maxTrackNumber - trackNumber;
      const zIndex = reversedTrackNumber * 100 + scrubberIndex;

      // RenderScrubber를 TimelineClip으로 변환
      const clip = convertScrubberToClip(scrubber);

      allClips.push({ clip, zIndex });
    });
  });

  // z-index 순서대로 정렬 (낮은 것부터 - 뒤에서 앞으로)
  allClips.sort((a, b) => a.zIndex - b.zIndex);

  // 🔍 특별 클립 타입 카운트
  const clipCounts = allClips.reduce((acc, { clip }) => {
    acc[clip.mediaType] = (acc[clip.mediaType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // console.log('🔍 Clips by type:', clipCounts);

  // 🚨 특별히 sentence, polygonShape, audio 클립 디버깅
  const specialClips = allClips.filter(({ clip }) =>
    clip.mediaType === 'sentence' || clip.mediaType === 'polygonShape' || clip.mediaType === 'audio'
  );

  // if (specialClips.length > 0) {
  //   console.log('🚨 Special clips in render:', specialClips.map(({ clip }) => ({
  //     id: clip.id.slice(-8),
  //     type: clip.mediaType,
  //     text: clip.mediaType === 'sentence' ? clip.text?.slice(0, 30) + '...' : 'N/A',
  //     segments: clip.mediaType === 'sentence' ? (clip as any).textSegments?.length || 0 : 'N/A'
  //   })));
  // }

  return (
    <AbsoluteFill>
      {/* 🎬 ClipRenderer를 사용하여 애니메이션 지원 */}
      {allClips.map(({ clip, zIndex }) => {
        const startFrame = Math.round(clip.startTime * fps);
        const durationInFrames = Math.round(clip.duration * fps);

        return (
          <Sequence
            from={startFrame}
            durationInFrames={durationInFrames}
            key={clip.id}
          >
            <ClipRenderer
              clip={clip}
              currentTimeInSeconds={currentTimeInSeconds}
              zIndex={zIndex}
              isEditMode={false}
              isPlaying={false}
              isMuted={false}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}