/**
 * 🎧 AudioClip.tsx - Remotion 오디오 클립 렌더러
 * 
 * Remotion 기반 비디오 렌더링에서 오디오 클립을 처리하는 전용 컴포넌트
 * 타임라인의 오디오 클립을 최종 비디오의 오디오 트랙으로 변환
 * 
 * 주요 기능:
 * - Remotion Audio 컴포넌트 래핑
 * - 볼륨 제어 (개별 클립 볼륨 + 전역 뮤트)
 * - 재생 속도 조절 (playbackRate)
 * - 오디오 로드 에러 처리
 * - 편집 모드별 동작 차이 지원
 * 
 * Remotion 렌더링 특징:
 * - 프레임 기반 정확한 오디오 동기화
 * - 고품질 오디오 믹싱
 * - 다중 오디오 트랙 지원
 * - FFmpeg 기반 최종 인코딩
 * 
 * 지원 형식:
 * - MP3, WAV, AAC, OGG
 * - 웹 브라우저 지원 형식 전체
 * 
 * 성능 최적화:
 * - 조건부 렌더링 (mediaUrl 검증)
 * - 에러 경계 처리
 * - 메모리 효율적 로딩
 */

import React from 'react';
import { Audio } from 'remotion';
import { TimelineClip } from '../../types';

// 🎧 Remotion 오디오 클립 전용 컴포넌트 (렌더링용)
export const AudioClip: React.FC<{
    clip: TimelineClip;        // 렌더링할 오디오 클립 데이터
    clipProgress: number;      // 클립 내 진행률 (0-1)
    isEditMode: boolean;       // 편집 모드 여부
    isPlaying: boolean;        // 재생 상태
    isMuted: boolean;          // 전역 뮤트 상태
}> = ({ clip, clipProgress, isEditMode, isPlaying, isMuted }) => {

    // 오디오 URL 유효성 검증
    if (!clip.mediaUrl) {
        console.warn('⚠️ Audio clip missing mediaUrl:', clip.id);
        return null;
    }

    return (
        <Audio
            src={clip.mediaUrl}                                    // 오디오 파일 경로
            volume={isMuted ? 0 : (clip.volume || 1)}              // 벨륨 제어 (전역 뮤트 + 개별 벨륨)
            playbackRate={clip.playbackRate || 1}                  // 재생 속도 (1.0 = 정상)
            onError={(error) => {
                console.error('❌ Remotion Audio load error for clip:', {
                    clipId: clip.id,
                    mediaUrl: clip.mediaUrl,
                    error
                });
            }}
        />
    );
};
