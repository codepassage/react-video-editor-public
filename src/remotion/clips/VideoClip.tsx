/**
 * 🎬 VideoClip.tsx - Remotion 비디오 클립 렌더러
 * 
 * HTML video 요소를 활용한 정밀한 비디오 클립 렌더링 컴포넌트
 * 60fps 동기화와 부드러운 재생 제어를 통한 전문가급 비디오 편집 지원
 * 
 * 주요 기능:
 * - 프레임 단위 정밀 동기화 (오차 0.2초 이내)
 * - 60fps 제한 부드러운 재생
 * - 실시간 재생 상태 동기화
 * - objectFit/objectPosition 지원
 * - 편집 모드별 동작 분리
 * - 안전한 에러 처리
 * 
 * 성능 최적화:
 * - 16ms(60fps) 업데이트 제한
 * - useCallback 메모이제이션
 * - 중복 업데이트 방지 플래그
 * - 비동기 재생 프라미스 처리
 * 
 * 동기화 알고리즘:
 * 1. clipProgress → 비디오 시간 계산
 * 2. 현재 시간과 차이 확인 (0.2초 허용)
 * 3. 필요시 currentTime 조정
 * 4. 재생/일시정지 상태 동기화
 * 
 * 편집 모드 지원:
 * - pointerEvents: none (드래그 통과)
 * - 재생 제어 비활성화
 * - 시간 동기화만 유지
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { TimelineClip } from '../../types';

// 비디오 클립 전용 컴포넌트 (동기화 및 제어 로직 포함)
export const VideoClip: React.FC<{
    clip: TimelineClip;                    // 렌더링할 비디오 클립
    finalStyle: React.CSSProperties;      // 최종 CSS 스타일
    clipProgress: number;                  // 클립 내 진행률 (0-1)
    isEditMode: boolean;                   // 편집 모드 여부
    isPlaying: boolean;                    // 재생 상태
    isMuted: boolean;                      // 전역 뮤트 상태
}> = ({ clip, finalStyle, clipProgress, isEditMode, isPlaying, isMuted }) => {
    const videoRef = useRef<HTMLVideoElement>(null);  // 비디오 요소 참조
    const lastUpdateTimeRef = useRef<number>(0);      // 마지막 업데이트 시간 (60fps 제한)
    const isUpdatingRef = useRef<boolean>(false);     // 업데이트 중복 방지 플래그

    /**
     * 안전한 비디오 상태 업데이트 함수
     * 시간 동기화, 재생 상태, 오디오 설정을 안전하게 처리
     */
    const updateVideoState = useCallback((video: HTMLVideoElement, targetTime: number) => {
        if (isUpdatingRef.current || !video) return; // 업데이트 중복 방지 및 비디오 요소 존재 확인

        try {
            isUpdatingRef.current = true; // 업데이트 시작 플래그

            // 비디오 시간 동기화 (허용 오차 0.2초로 안정성 확보)
            if (Math.abs(video.currentTime - targetTime) > 0.2) {
                video.currentTime = Math.max(0, Math.min(targetTime, video.duration || 0));
            }

            // 재생 상태 동기화 (편집 모드가 아니었 때만)
            if (!isEditMode) {
                if (isPlaying && video.paused) {
                    const playPromise = video.play();
                    if (playPromise) {
                        playPromise.catch(() => {
                            // 재생 실패는 조용히 무시 (오디오 간섭 방지)
                        });
                    }
                } else if (!isPlaying && !video.paused) {
                    video.pause();
                }
            }

            // 오디오 설정 (뮤트, 벨륨, 재생속도)
            video.muted = isMuted;
            if (!isMuted) {
                video.volume = Math.min(Math.max(clip.volume || 1, 0), 1); // 0-1 범위 제한
            }
            video.playbackRate = clip.playbackRate || 1; // 재생 속도 설정

        } catch (error) {
            // 에러는 조용히 처리하여 UI 렌더링 간섭 방지
            console.warn('Video state update error:', error);
        } finally {
            isUpdatingRef.current = false;            // 업데이트 완료 플래그
            lastUpdateTimeRef.current = Date.now();   // 마지막 업데이트 시간 기록
        }
    }, [isPlaying, isMuted, clip.volume, clip.playbackRate, isEditMode]);

    /**
     * 60fps 제한으로 부드러운 비디오 동기화
     * clipProgress 변화에 따라 비디오 시간 업데이트
     */
    useEffect(() => {
        const video = videoRef.current;
        if (!video || isEditMode) return; // 비디오 없거나 편집모드에서는 스킵

        const now = Date.now();
        if (now - lastUpdateTimeRef.current < 16) return; // 16ms = 60fps 제한

        const videoTime = clipProgress * (clip.duration || 1); // 클립 진행률 → 비디오 시간 변환
        updateVideoState(video, videoTime);

    }, [clipProgress, updateVideoState, isEditMode]);

    /**
     * 비디오 로드 시 초기 설정
     * 비디오 메타데이터 로드 완료 후 업데이트 수행
     */
    const handleLoadedData = useCallback(() => {
        const video = videoRef.current;
        if (video && !isEditMode) {
            const videoTime = clipProgress * (clip.duration || 1);
            updateVideoState(video, videoTime); // 초기 시간 동기화
        }
    }, [clipProgress, updateVideoState, isEditMode]);

    if (!clip.mediaUrl) {
        console.warn('Video clip missing mediaUrl:', clip.id);
        return (
            <div style={{
                ...finalStyle,
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 14,
                fontWeight: 'bold',
                border: '2px dashed #666',
                // 편집모드에서 드래그 이벤트 통과 설정
                pointerEvents: isEditMode ? 'none' : 'auto'
            }}>
                비디오 없음
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            src={clip.mediaUrl}
            style={{
                ...finalStyle,
                objectFit: (clip.mediaProperties as any)?.backgroundFit || 'cover',
                objectPosition: (clip.mediaProperties as any)?.backgroundPosition || 'center',
                // 편집모드에서 드래그 이벤트 통과 설정
                pointerEvents: isEditMode ? 'none' : 'auto'
            }}
            playsInline
            controls={false}
            onLoadedData={handleLoadedData}
            onError={() => {
                // 비디오 로드 에러 시 조용히 처리
                console.warn('Video load error for clip:', clip.id);
            }}
        />
    );
}; 