import React, { useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TimelineClip, TimelineTrack, calculateClipZIndex } from '../types';
import { ClipRenderer } from './ClipRenderer';
import { useEditorStore } from '../store/editorStore';

interface DynamicCompositionProps {
  tracks?: TimelineTrack[];
  projectSettings?: {
    backgroundColor?: string;
    width?: number;
    height?: number;
    fps?: number;
  };
}

// 🎮 Player용 동적 컴포지션 - 일반 React props 사용
export const DynamicComposition: React.FC<DynamicCompositionProps> = ({
  tracks: propTracks,
  projectSettings: propProjectSettings
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 🔒 안전한 데이터 소스 분리 (Player환경 고려)
  let tracks: TimelineTrack[] = [];
  let projectSettings: any = {
    backgroundColor: '#000000',
    width: 1920,
    height: 1080,
    fps: 30
  };
  let dataSource = 'empty';

  if (propTracks && propTracks.length > 0) {
    // 🎬 렌더링 모드: props 사용
    tracks = propTracks;
    projectSettings = propProjectSettings || projectSettings;
    dataSource = 'props';
  } else {
    // 🎮 에디터/Player 모드: store 사용 (안전 방식)
    try {
      if (typeof window !== 'undefined') {
        const editorStore = useEditorStore();
        if (editorStore && editorStore.tracks) {
          tracks = editorStore.tracks;
          projectSettings = editorStore.projectSettings || projectSettings;
          dataSource = 'store';
        }
      }
    } catch (error) {
      console.warn('Store access failed, using empty data:', error);
      tracks = [];
      projectSettings = projectSettings;
      dataSource = 'error';
    }
  }

  // 🔍 디버깅 (개발 환경에서만)
  if (false) {
    console.log('🎮 DynamicComposition (Player용):', {
      dataSource,
      tracksLength: tracks.length,
      totalClips: tracks.reduce((sum, track) => sum + track.clips.length, 0),
      time: (frame / fps).toFixed(2)
    });
  }

  // 현재 시간을 초 단위로 계산
  const currentTimeInSeconds = frame / fps;

  // 모든 클립들을 수집하고 레이어 순서대로 정렬
  const allClips: Array<{ clip: TimelineClip; zIndex: number; trackName: string; trackIndex: number }> = [];

  tracks.forEach((track, trackIndex) => {
    track.clips.forEach((clip, clipIndex) => {
      // 🎯 실제 배열 인덱스 기반으로 z-index 계산 (트랙 순서 변경 즉시 반영)
      // trackIndex가 작을수록 더 높은 z-index (위 트랙이 최상위)
      const reversedTrackIndex = tracks.length - 1 - trackIndex;
      const zIndex = reversedTrackIndex * 100 + clipIndex;

      allClips.push({
        clip,
        zIndex,
        trackName: track.displayName || track.name,
        trackIndex
      });
    });
  });

  // z-index 순서대로 정렬 (낮은 것부터 - 뒤에서 앞으로)
  allClips.sort((a, b) => a.zIndex - b.zIndex);

  // 디버깅: 레이어 순서 로깅 (트랙 순서 변경 확인용)
  if (false && allClips.length > 0) {
    console.log('🎨 Track order & Layer rendering (Real-time):', {
      tracksOrder: tracks.map((track, index) => ({
        index,
        trackId: track.id.slice(-8),
        displayName: track.displayName,
        layerLevel: tracks.length - 1 - index, // 높을수록 상위 레이어
        clipsCount: track.clips.length
      })),
      clipsRenderOrder: allClips.map(({ clip, zIndex, trackName, trackIndex }, renderIndex) => ({
        renderOrder: renderIndex + 1, // 렌더링 순서 (낮은 것부터)
        clipId: clip.id.slice(-8),
        trackName,
        trackIndex,
        zIndex,
        layerLevel: Math.floor(zIndex / 100), // z-index에서 레이어 레벨 추출
        content: clip.text ? clip.text.substring(0, 10) + '...' : clip.mediaType
      }))
    });
  }

  // 배경색 결정
  const backgroundColor = projectSettings?.backgroundColor || '#000000';


  // 🔍 디버깅 (개발 환경에서만 상세 로그)
  if (false && allClips.length > 0) {
    console.log('🎦 DynamicComposition Render Status:', {
      dataSource,
      tracksLength: tracks.length,
      time: currentTimeInSeconds.toFixed(2),
      clipsShown: allClips.length,
      backgroundColor,
      hashChanged: true // timelineHash 변경으로 인한 렌더링
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* 🎬 Sequence 기반 정확한 시간 제어 (렌더링과 동일한 방식) */}
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

      {/* 디버깅 정보 (개발용) */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        fontSize: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '5px 10px',
        borderRadius: 5,
        zIndex: 9999,
        fontFamily: 'monospace'
      }}>
        Time: {currentTimeInSeconds.toFixed(2)}s | Clips: {allClips.length}
      </div>
    </AbsoluteFill>
  );
};
