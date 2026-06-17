/**
 * 데이터 변환 유틸리티
 */

import {
  RenderData, RenderTimelineDataItem, RenderScrubber, Track, ProjectSettings
} from '../types/render.types';
import { buildMediaUrl } from './url-builder';

/**
 * 클라이언트 트랙 데이터를 렌더링용 데이터로 변환
 */
export function convertToRenderData(
  tracks: Track[],
  projectSettings: ProjectSettings,
  serverPort: number
): RenderData {
  const FPS = projectSettings.fps || 30;

  console.log('🔄 Converting tracks to render data...', serverPort);

  const timelineData: RenderTimelineDataItem[] = tracks.map((track, arrayIndex) => {
    // trackId에서 실제 트랙 번호 추출 ("track-1" → 1)
    const actualTrackNumber = track.id ? parseInt(track.id.replace('track-', '')) : (arrayIndex + 1);

    console.log(`📦 Processing track:`, {
      arrayIndex,
      trackId: track.id,
      actualTrackNumber,
      clipsCount: track.clips.length
    });

    return {
      id: track.id,
      totalDuration: projectSettings.duration,
      scrubbers: track.clips.map((clip: any): RenderScrubber => {
        // URL 처리 - 모든 미디어 파일이 현재 서버 포트를 바라보도록 수정
        let mediaUrlLocal = clip.mediaUrl;
        let mediaUrlRemote;

        if (clip.mediaUrl) {
          if (clip.mediaUrl.startsWith('http://') || clip.mediaUrl.startsWith('https://')) {
            // 외부 URL인 경우 그대로 사용
            mediaUrlRemote = clip.mediaUrl;
            mediaUrlLocal = clip.mediaUrl;
            console.log(`🌐 외부 URL:`, clip.mediaUrl.slice(0, 50) + '...');
          } else if (clip.mediaUrl.startsWith('/uploads/')) {
            // 상대 경로를 현재 서버 포트의 절대 URL로 변환
            mediaUrlLocal = buildMediaUrl(clip.mediaUrl);
            mediaUrlRemote = mediaUrlLocal;
            console.log(`📁 서버 파일 URL 변환:`, {
              원본: clip.mediaUrl,
              변환후: mediaUrlLocal,
              미디어타입: clip.mediaType
            });
          } else if (clip.mediaUrl.startsWith('data:')) {
            // Data URL 처리 (그래디언트, 도형 등)
            mediaUrlLocal = clip.mediaUrl;
            mediaUrlRemote = clip.mediaUrl;
            console.log(`🎨 Data URL:`, clip.mediaType, clip.mediaUrl.slice(0, 50) + '...');
          } else {
            console.warn('😨 Unknown mediaUrl format:', clip.mediaUrl.slice(0, 100));
            // 알 수 없는 형식도 서버 URL로 시도
            mediaUrlLocal = clip.mediaUrl.startsWith('/') ?
              buildMediaUrl(clip.mediaUrl) :
              clip.mediaUrl;
            mediaUrlRemote = mediaUrlLocal;
          }
        }

        // PolygonShape와 Shape의 backgroundImageUrl도 절대 경로로 변환
        let processedPolygonShapeProperties = clip.polygonShapeProperties;
        let processedShapeProperties = clip.shapeProperties;

        // PolygonShape 처리
        if (clip.mediaType === 'polygonShape' && clip.polygonShapeProperties?.backgroundImageUrl) {
          const bgImageUrl = clip.polygonShapeProperties.backgroundImageUrl;
          let processedBgImageUrl = bgImageUrl;

          if (bgImageUrl.startsWith('/uploads/')) {
            // 상대 경로를 현재 서버 포트의 절대 URL로 변환
            processedBgImageUrl = buildMediaUrl(bgImageUrl);
            console.log(`🔄 PolygonShape 배경이미지 URL 변환:`, {
              원본: bgImageUrl,
              변환후: processedBgImageUrl
            });
          }

          processedPolygonShapeProperties = {
            ...clip.polygonShapeProperties,
            backgroundImageUrl: processedBgImageUrl
          };
        }

        // Shape 처리  
        if (clip.mediaType === 'shape' && clip.shapeProperties?.backgroundImageUrl) {
          const bgImageUrl = clip.shapeProperties.backgroundImageUrl;
          let processedBgImageUrl = bgImageUrl;

          if (bgImageUrl.startsWith('/uploads/')) {
            processedBgImageUrl = buildMediaUrl(bgImageUrl);
            console.log(`🔄 Shape 배경이미지 URL 변환:`, {
              원본: bgImageUrl,
              변환후: processedBgImageUrl
            });
          }

          processedShapeProperties = {
            ...clip.shapeProperties,
            backgroundImageUrl: processedBgImageUrl
          };
        }

        const scrubber: RenderScrubber = {
          id: clip.id,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          mediaType: clip.mediaType,
          width: clip.width,
          height: clip.height,
          trackId: track.id,
          trackIndex: actualTrackNumber - 1, // 1-based → 0-based
          media_width: clip.width,
          media_height: clip.height,
          x: clip.x,
          y: clip.y,

          mediaUrlLocal,
          mediaUrlRemote,

          // 🆕 기본 텍스트 속성들 (Text와 Sentence 클립 공용)
          text: clip.text,
          fontSize: clip.fontSize,
          fontFamily: clip.fontFamily,
          fontWeight: clip.fontWeight,
          fontStyle: clip.fontStyle,
          color: clip.color,
          backgroundColor: clip.backgroundColor,
          textAlign: clip.textAlign,
          lineHeight: clip.lineHeight,
          letterSpacing: clip.letterSpacing,
          textDecoration: clip.textDecoration,
          textTransform: clip.textTransform,

          // 🆕 Sentence 클립 전용 속성들
          textSegments: clip.textSegments,
          segmentVersion: clip.segmentVersion,
          totalSegments: clip.totalSegments,
          lastEditedSegmentId: clip.lastEditedSegmentId,
          segmentOverlapMode: clip.segmentOverlapMode,
          enableRealTimePreview: clip.enableRealTimePreview,
          autoSize: clip.autoSize,

          // 🆕 텍스트 효과 속성들 (Text와 Sentence 클립 공용)
          textShadow: clip.textShadow,
          backgroundShadow: clip.backgroundShadow,
          borderRadius: clip.borderRadius,
          borderRadiusUnit: clip.borderRadiusUnit,
          textGradient: clip.textGradient,
          textGlow: clip.textGlow,
          strokeWidth: clip.strokeWidth,
          strokeColor: clip.strokeColor,
          multipleStrokes: clip.multipleStrokes,
          textBevel: clip.textBevel,
          textExtrude: clip.textExtrude,
          multipleShadows: clip.multipleShadows,
          textTexture: clip.textTexture,

          opacity: clip.opacity,
          rotation: clip.rotation,

          // 🎨 페이드 효과 속성 복사
          fadeIn: clip.fadeIn,
          fadeOut: clip.fadeOut,

          // 🎨 시각 필터 속성 복사
          brightness: clip.brightness,
          contrast: clip.contrast,
          saturation: clip.saturation,
          hue: clip.hue,
          blur: clip.blur,
          sepia: clip.sepia,
          grayscale: clip.grayscale,

          // 🎨 변형 속성 복사
          scaleX: clip.scaleX,
          scaleY: clip.scaleY,
          skewX: clip.skewX,
          skewY: clip.skewY,
          anchorX: clip.anchorX,
          anchorY: clip.anchorY,
          blendMode: clip.blendMode,

          volume: clip.volume,
          playbackRate: clip.playbackRate,

          // 🎬 애니메이션 속성 복사
          animationType: clip.animationType,
          animationDuration: clip.animationDuration,
          animationDelay: clip.animationDelay,
          animationEasing: clip.animationEasing,
          animationLoop: clip.animationLoop,

          // Shape 클립 속성 (URL 처리 완료)
          shapeProperties: processedShapeProperties,

          // SimpleShape 클립 속성
          simpleShapeProperties: clip.simpleShapeProperties,

          // PolygonShape 클립 속성 (URL 처리 완료)
          polygonShapeProperties: processedPolygonShapeProperties,
        };

        console.log(`  🎨 Clip:`, {
          id: clip.id.slice(-8),
          trackId: track.id,
          trackIndex: scrubber.trackIndex,
          mediaType: clip.mediaType,
          text: clip.text || 'N/A',
          simpleShapeProps: clip.mediaType === 'simpleShape' ? clip.simpleShapeProperties : 'N/A',
          polygonShapeProps: clip.mediaType === 'polygonShape' ? clip.polygonShapeProperties : 'N/A',
          // 🆕 Sentence 클립 세그먼트 정보 추가
          textSegments: clip.mediaType === 'sentence' ? (clip.textSegments?.length || 0) + ' segments' : 'N/A',
          mediaUrl: clip.mediaUrl ? (clip.mediaUrl.length > 50 ? clip.mediaUrl.slice(0, 50) + '...' : clip.mediaUrl) : 'N/A'
        });

        // 🆕 Sentence 클립 특별 디버깅
        if (clip.mediaType === 'sentence') {
          console.log(`  📄 SENTENCE CLIP DETAILS:`, {
            id: clip.id.slice(-8),
            text: clip.text || 'N/A',
            textSegments: clip.textSegments?.length || 0,
            segmentVersion: clip.segmentVersion || 'N/A',
            totalSegments: clip.totalSegments || 'N/A',
            segmentDetails: clip.textSegments?.map(seg => ({
              id: seg.id.slice(-4),
              text: seg.text.slice(0, 20) + (seg.text.length > 20 ? '...' : ''),
              startIndex: seg.startIndex,
              endIndex: seg.endIndex,
              style: {
                fontSize: seg.style.fontSize,
                color: seg.style.color,
                backgroundColor: seg.style.backgroundColor
              }
            })) || [],
            textEffects: {
              textShadow: clip.textShadow || 'none',
              backgroundColor: clip.backgroundColor || 'transparent',
              borderRadius: clip.borderRadius || 0
            }
          });
        }

        // 🔍 특별 클립 타입 디버깅 (Sentence 클립 추가)
        if (clip.mediaType === 'polygonShape' || clip.mediaType === 'audio' || clip.mediaType === 'sentence') {
          console.log(`  🚨 SPECIAL CLIP DETECTED:`, {
            id: clip.id.slice(-8),
            mediaType: clip.mediaType,
            hasPolygonProps: !!clip.polygonShapeProperties,
            hasSentenceSegments: !!clip.textSegments?.length,
            hasMediaUrl: !!clip.mediaUrl,
            willBeIncluded: true,
            scrubberProps: {
              polygonShapeProperties: scrubber.polygonShapeProperties,
              textSegments: scrubber.textSegments?.length || 0,
              mediaUrlLocal: scrubber.mediaUrlLocal,
              mediaUrlRemote: scrubber.mediaUrlRemote
            }
          });
        }

        return scrubber;
      })
    };
  });

  return {
    timelineData,
    durationInFrames: Math.round(projectSettings.duration * FPS),
    compositionWidth: projectSettings.width,
    compositionHeight: projectSettings.height,
  };
}
