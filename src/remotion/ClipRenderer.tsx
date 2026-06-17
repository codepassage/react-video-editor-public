/**
 * 🎨 ClipRenderer.tsx - 개별 클립 렌더링 시스템 (핵심 모듈 #6)
 * 
 * =====================================================================
 * 🎯 REMOTION 기반 클립별 전용 렌더러 - 타입 안전한 멀티미디어 렌더링
 * =====================================================================
 * 
 * VideoComposition에서 호출되어 각 클립을 실제 화면에 렌더링하는 핵심 컴포넌트
 * 8가지 클립 타입별로 최적화된 렌더링 로직을 제공하는 중앙 팩토리
 * 
 * 🏗️ 클립 렌더링 아키텍처:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  1. 타입 가드 검증 - 런타임 타입 안전성 보장               │
 * │  2. 애니메이션 처리 - 시간 기반 동적 스타일 생성           │ 
 * │  3. 성능 모니터링 - 렌더링 성능 추적 및 최적화             │
 * │  4. 에러 경계 - 개별 클립 오류가 전체에 영향 주지 않음     │
 * │  5. CSS 최적화 - 불필요한 스타일 계산 방지                 │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * 🎭 지원하는 8가지 클립 렌더러:
 * ┌────────────────┬─────────────────────────────────────────────┐
 * │ AudioClip      │ 웨이브폼 시각화 + 오디오 재생 동기화        │
 * │ VideoClip      │ 비디오 재생 + 오버레이 효과                 │
 * │ ImageClip      │ 이미지 표시 + 변환/크롭 효과                │
 * │ TextClip       │ 텍스트 렌더링 + 타이포그래피 애니메이션     │
 * │ SentenceClip   │ 단일 문장 + TTS 동기화                      │
 * │ LongSentenceClip│ 긴 문장 분할 + 순차 애니메이션             │
 * │ SimpleShapeClip│ 기본 도형 + 색상/크기 제어                 │
 * │ PolygonShapeClip│ 복합 다각형 + 벡터 그래픽 렌더링           │
 * └────────────────┴─────────────────────────────────────────────┘
 */

// ========================================================================
// 📦 React 및 Remotion Core Import
// ========================================================================
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';   // Remotion 프레임/설정 훅

// ========================================================================
// 🎯 프로젝트 타입 시스템 Import
// ========================================================================
import { TimelineClip } from '../types';                      // 통합 클립 타입 정의

// ========================================================================
// 🎨 개별 클립 렌더러 컴포넌트들
// ========================================================================
import { AudioClip } from './clips/AudioClip';               // 🔊 오디오 웨이브폼 + 재생
import { VideoClip } from './clips/VideoClip';               // 🎬 비디오 재생 + 오버레이
import { ImageClip } from './clips/ImageClip';               // 🖼️ 이미지 표시 + 변환
import { TextClip } from './clips/TextClip';                 // 📝 텍스트 렌더링 + 애니메이션
import { SentenceClip } from './clips/SentenceClip';         // 💬 단일 문장 + TTS
import { LongSentenceClip } from './clips/LongSentenceClip'; // 📄 긴 문장 분할 + 순차 표시
import { SimpleShapeClip, PolygonShapeClip, ShapeClip } from './clips/ShapeClips'; // 🔶 도형 렌더링

// ========================================================================
// 🎭 애니메이션 및 성능 유틸리티
// ========================================================================
import { getAnimatedStyle, animationPerformanceMonitor } from './utils/animations.utils';

// ========================================================================
// 🛡️ 타입 가드 시스템 - 런타임 타입 안전성
// ========================================================================
// 컴파일타임 타입 검증을 런타임까지 확장하여 100% 타입 안전성 보장
import {
    isVisualClip,      // 시각적 속성을 가진 클립 (위치, 크기, 회전 등)
    isAudioClip,       // 오디오 재생 기능을 가진 클립
    hasAudioProperties,// 오디오 속성을 가진 클립 (볼륨, 음소거 등)
    isTextClip,        // 텍스트 기반 클립
    isVideoClip,       // 비디오 파일 클립
    isImageClip,       // 이미지 파일 클립
    isShapeClip,       // 도형 클립 (모든 타입)
    isSimpleShapeClip, // 기본 도형 클립
    isPolygonShapeClip,// 다각형 도형 클립
    isBasicShapeClip   // 단순 기본 도형
} from '../types/clipGuards';
import { isSentenceClip } from '../types';                   // 문장 클립 타입 가드
import { isLongSentenceClip } from '../types/clipTypes';     // 긴 문장 클립 타입 가드

// 🔍 ClipRenderer에서 CSS 생성 추적
const CSS_DEBUG = false; // 서버 렌더링에서 안전하게 비활성화

const logCSSGeneration = (location: string, styleObj: React.CSSProperties, clipId: string) => {
    if (CSS_DEBUG) {
        const propertyCount = Object.keys(styleObj).length;
        const styleString = JSON.stringify(styleObj, null, 2);
        const sizeInKB = (styleString.length / 1024).toFixed(2);

        console.group(`🎨 CSS 생성 위치: ${location}`);
        console.log(`📍 클립 ID: ${clipId.slice(-8)}`);
        console.log(`📊 속성 개수: ${propertyCount}개`);
        console.log(`💾 크기: ${sizeInKB}KB`);

        console.groupEnd();
    }
};

// 개별 클립을 렌더링하는 공통 컴포넌트 (애니메이션 딜레이 문제 해결)
export const ClipRenderer: React.FC<{
    clip: TimelineClip;
    currentTimeInSeconds?: number;
    zIndex?: number;
    isEditMode?: boolean; // 편집 모드용 플래그
    isPlaying?: boolean; // 재생 상태
    isMuted?: boolean; // 음소거 상태
}> = ({ clip, currentTimeInSeconds = 0, zIndex = 0, isEditMode = false, isPlaying = false, isMuted = false }) => {
    // 🎬 Remotion 훅들 - 정확한 애니메이션 타이밍을 위해
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 현재 시간을 Remotion 프레임 기준으로 계산 (더 정확함)
    const remotionCurrentTime = frame / fps;

    // 기본 안전성 검사
    if (!clip || !clip.mediaType) {
        console.warn('Invalid clip data:', clip);
        return null;
    }

    // 🎬 애니메이션 적용 (편집 모드가 아닐 때만)
    // Remotion 프레임 기준 시간 또는 전달받은 시간 중 더 정확한 것 사용
    const effectiveCurrentTime = isEditMode ? remotionCurrentTime : currentTimeInSeconds;

    // 🕰️ 시간 기반 클립 표시 제어 (편집 모드가 아닐 때만)
    let shouldShow = true;

    if (!isEditMode) {
        if (clip.startTime !== undefined && clip.endTime !== undefined) {
            shouldShow = effectiveCurrentTime >= clip.startTime && effectiveCurrentTime < clip.endTime;
        } else {
            shouldShow = true;
        }
    }

    if (!shouldShow) {
        return null;
    }

    // 클립 내에서의 상대적 시간 (0~1)
    const clipProgress = !isEditMode && clip.duration > 0 ?
        (currentTimeInSeconds - clip.startTime) / clip.duration : 0;

    // 🎨 타입별 기본 스타일 생성 (타입 안전성 강화)
    const getBaseStyle = (clip: TimelineClip): React.CSSProperties => {
        // 🎵 Audio 클립: 시각적 속성 불필요
        if (isAudioClip(clip)) {
            return {
                // Audio 클립은 시각적 스타일 없음 (성능 최적화)
                position: 'absolute',
                zIndex: zIndex
            };
        }

        // 🎬 시각적 클립: 모든 시각적 속성 적용
        if (isVisualClip(clip)) {
            return {
                position: 'absolute',
                left: clip.x,
                top: clip.y,
                width: clip.width,
                height: clip.height,
                opacity: clip.opacity,
                transform: `
                  rotate(${clip.rotation || 0}deg)
                  scaleX(${clip.scaleX || 1})
                  scaleY(${clip.scaleY || 1})
                  skewX(${clip.skewX || 0}deg)
                  skewY(${clip.skewY || 0}deg)
                `.trim(),
                transformOrigin: `${(clip.anchorX || 0.5) * 100}% ${(clip.anchorY || 0.5) * 100}%`,
                zIndex: zIndex,
                mixBlendMode: clip.blendMode as any || 'normal',
                filter: `
                  brightness(${clip.brightness || 100}%)
                  contrast(${clip.contrast || 100}%)
                  saturate(${clip.saturation || 100}%)
                  hue-rotate(${clip.hue || 0}deg)
                  blur(${clip.blur || 0}px)
                  sepia(${clip.sepia || 0}%)
                  grayscale(${clip.grayscale || 0}%)
                `.trim()
            };
        }

        // 🚨 알 수 없는 타입 (fallback)
        console.warn('🚨 Unknown clip type for styling:', clip.mediaType);
        return {
            position: 'absolute',
            zIndex: zIndex
        };
    };

    const baseStyle = getBaseStyle(clip);

    // 🔍 getBaseStyle 결과 로그
    logCSSGeneration('ClipRenderer getBaseStyle', baseStyle, clip.id);

    // 🎨 애니메이션 적용 (시각적 클립에만)
    const applyAnimationSafely = (clip: TimelineClip, baseStyle: React.CSSProperties): React.CSSProperties => {
        // 🎵 Audio 클립: 애니메이션 불필요
        if (isAudioClip(clip)) {
            return baseStyle; // 애니메이션 없이 기본 스타일 반환
        }

        // 🎬 시각적 클립: 애니메이션 적용
        if (isVisualClip(clip)) {
            // 🕰️ 성능 모니터링 시작
            const animationStartTime = performance.now();

            const animatedStyle = getAnimatedStyle(
                clip,
                baseStyle,
                effectiveCurrentTime,
                isEditMode
            );

            // 🕰️ 성능 모니터링 끝 (애니메이션이 있는 경우에만)
            if (!isEditMode && clip.animationType) {
                animationPerformanceMonitor.logPerformanceMetrics(clip.id, animationStartTime);
            }

            return animatedStyle;
        }

        // 🚨 알 수 없는 타입 (fallback)
        return baseStyle;
    };

    const animatedStyle = applyAnimationSafely(clip, baseStyle);

    // 🌅 페이드 효과 적용 (시각적 클립에만)
    const applyFadeEffect = (style: React.CSSProperties): React.CSSProperties => {
        // 🎵 Audio 클립: 페이드 효과 불필요
        if (isAudioClip(clip)) {
            return style; // 페이드 없이 기본 스타일 반환
        }

        // 🎬 시각적 클립: 페이드 효과 적용
        if (isVisualClip(clip)) {
            let fadeOpacity = 1;

            if (!isEditMode) {
                // 페이드 인 효과
                if (clip.fadeIn && clipProgress < clip.fadeIn / clip.duration) {
                    fadeOpacity = (clipProgress * clip.duration) / clip.fadeIn;
                }

                // 페이드 아웃 효과
                if (clip.fadeOut && clipProgress > (clip.duration - clip.fadeOut) / clip.duration) {
                    const fadeProgress = (clipProgress * clip.duration - (clip.duration - clip.fadeOut)) / clip.fadeOut;
                    fadeOpacity = 1 - fadeProgress;
                }
            }

            return {
                ...style,
                opacity: (style.opacity || 1) * fadeOpacity
            };
        }

        // 🚨 알 수 없는 타입 (fallback)
        return style;
    };

    const finalStyle = applyFadeEffect(animatedStyle);

    // 🔍 finalStyle 결과 로그 (자식 컴포넌트로 전달되는 스타일)
    logCSSGeneration('ClipRenderer finalStyle (전달용)', finalStyle, clip.id);

    // 🔍 최소한의 디버깅 (개발 환경에서만, 성능 최적화)
    if (false && !isEditMode && clip.animationType &&
        frame % 30 === 0 && Math.floor(remotionCurrentTime) % 2 === 0) { // 30프레임마다, 2초마다
        console.log('🎬 ClipRenderer:', {
            id: clip.id.slice(-8),
            type: clip.animationType,
            time: effectiveCurrentTime.toFixed(1),
            opacity: finalStyle.opacity?.toString().slice(0, 4),
            hasAnim: !!(finalStyle.transform && finalStyle.transform !== baseStyle.transform)
        });
    }

    // 🎭 타입 가드 기반 렌더링 (타입 안전성 강화)

    // 🎵 Audio 클립 렌더링 (시각적 속성 없음)
    if (isAudioClip(clip)) {
        if (frame === 0) {
            console.log('🎧 Rendering AudioClip:', {
                id: clip.id.slice(-8),
                hasMediaUrl: !!clip.mediaUrl,
                volume: clip.volume,
                duration: clip.duration
            });
        }

        return (
            <AudioClip
                clip={clip}
                clipProgress={clipProgress}
                isEditMode={isEditMode}
                isPlaying={isPlaying}
                isMuted={isMuted}
            />
        );
    }

    // 📝 텍스트 클립 렌더링
    if (isTextClip(clip)) {
        console.log('📝 Rendering TextClip (uses getTextStyle):', {
            id: clip.id.slice(-8),
            text: clip.text?.slice(0, 30) + '...',
            hasComplexEffects: !!(clip.textBevel?.enabled || clip.textExtrude?.enabled || clip.multipleShadows?.length || clip.textGlow?.enabled)
        });
        return <TextClip clip={clip} finalStyle={finalStyle} isEditMode={isEditMode} />;
    }

    // 📄 Sentence 클립 렌더링 (고급 세그먼트 텍스트)
    if (isSentenceClip(clip)) {
        if (frame === 0) {
            console.log('📄 Rendering SentenceClip:', {
                id: clip.id.slice(-8),
                text: clip.text?.slice(0, 30) + '...',
                segmentCount: clip.textSegments?.length || 0,
                hasSegments: !!(clip.textSegments && clip.textSegments.length > 0)
            });
        }

        return <SentenceClip clip={clip} finalStyle={finalStyle} isEditMode={isEditMode} />;
    }

    // 📖 LongSentence 클립 렌더링 (displayMode에 따라)
    if (isLongSentenceClip(clip)) {

        return (
            <LongSentenceClip
                clip={clip}
                finalStyle={finalStyle}
                isEditMode={isEditMode}
                clipProgress={clipProgress}
                isPlaying={isPlaying}
                isMuted={isMuted}
            />
        );
    }

    // 🎬 비디오 클립 렌더링 (시각적 + 오디오 속성)
    if (isVideoClip(clip)) {
        return (
            <VideoClip
                clip={clip}
                finalStyle={finalStyle}
                clipProgress={clipProgress}
                isEditMode={isEditMode}
                isPlaying={isPlaying}
                isMuted={isMuted}
            />
        );
    }

    // 🖼️ 이미지 클립 렌더링
    if (isImageClip(clip)) {
        return <ImageClip clip={clip} finalStyle={finalStyle} isEditMode={isEditMode} />;
    }

    // 🔹 단순 도형 클립 렌더링
    if (isSimpleShapeClip(clip)) {
        return <SimpleShapeClip clip={clip} finalStyle={finalStyle} isEditMode={isEditMode} />;
    }

    // 🔺 다각형 도형 클립 렌더링
    if (isPolygonShapeClip(clip)) {
        if (frame === 0) {
            console.log('🔺 Rendering PolygonShapeClip:', {
                id: clip.id.slice(-8),
                hasPolygonProps: !!(clip as any).polygonShapeProperties,
                shapeType: (clip as any).polygonShapeProperties?.shapeType || 'unknown'
            });
        }

        return <PolygonShapeClip clip={clip} finalStyle={finalStyle} isEditMode={isEditMode} />;
    }

    // 🔶 기본 도형 클립 렌더링
    if (isBasicShapeClip(clip)) {
        return <ShapeClip clip={clip} finalStyle={finalStyle} isEditMode={isEditMode} />;
    }

    // 🚨 알 수 없는 타입 (fallback)
    console.warn('😵 Unknown media type:', clip.mediaType, 'for clip:', clip.id.slice(-8));
    return (
        <div style={{
            ...finalStyle,
            backgroundColor: '#cccccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: '#666',
            border: '2px dashed #999',
            // 편집모드에서 드래그 이벤트 통과 설정
            pointerEvents: isEditMode ? 'none' : 'auto'
        }}>
            알 수 없는 타입: {clip.mediaType}
        </div>
    );
}; 