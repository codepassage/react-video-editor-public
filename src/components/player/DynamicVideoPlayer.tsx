import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useEditorStore } from '../../store/editorStore';
import { DynamicComposition } from '../../remotion/DynamicComposition';
// 🎆 타입 가드 함수들 import
import {
  isVisualClip,
  isAudioClip,
  hasAudioProperties,
  getClipCategory
} from '../../types/clipGuards';
import { useBackgroundOptimization } from '../../hooks/useBackgroundOptimization';
import { useNonBlockingTimeUpdate } from '../../hooks/useNonBlockingTimeUpdate';

export const DynamicVideoPlayer: React.FC = () => {
  const {
    currentTime,
    isPlaying,
    projectSettings,
    tracks,
    setCurrentTime,
    setIsPlaying
  } = useEditorStore();

  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlayerUpdatingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);
  const debugTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });

  // 🎯 백그라운드 탭 최적화
  const isBackgrounded = useBackgroundOptimization();

  // 🎯 500ms 간격 UI 업데이트 시스템
  const updateTimeNonBlocking = useNonBlockingTimeUpdate(setCurrentTime);

  // 📏 컴테이너 크기 측정 및 업데이트
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const padding = 40; // 좌우 padding 20px씩
        const availableWidth = rect.width - padding;
        const availableHeight = rect.height - padding;

        setContainerSize({
          width: Math.max(200, availableWidth),
          height: Math.max(150, availableHeight)
        });
      }
    };

    // 초기 측정
    updateContainerSize();

    // 윈도우 리사이즈 시 업데이트
    window.addEventListener('resize', updateContainerSize);

    // ResizeObserver로 컴테이너 크기 변화 감지
    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateContainerSize);
      resizeObserver.disconnect();
    };
  }, []);

  // 📊 Player 크기 계산 (사용 가능한 영역 최대 활용)
  const getPlayerSize = () => {
    const aspectRatio = projectSettings.width / projectSettings.height;
    const { width: maxWidth, height: maxHeight } = containerSize;

    let playerWidth: number;
    let playerHeight: number;

    // 비율에 따라 최대 크기로 조정
    if (aspectRatio > maxWidth / maxHeight) {
      // 가로가 더 긴 경우 - 너비에 맞춤
      playerWidth = maxWidth;
      playerHeight = maxWidth / aspectRatio;
    } else {
      // 세로가 더 긴 경우 - 높이에 맞춤
      playerHeight = maxHeight;
      playerWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(playerWidth),
      height: Math.round(playerHeight),
      aspectRatio: aspectRatio.toFixed(3)
    };
  };

  const playerSize = getPlayerSize();

  // 🔍 디버깅: Player 상태 실시간 모니터링 (선택적)
  useEffect(() => {
    // 디버깅이 필요하면 주석 해제
    /*
    if (debugTimerRef.current) {
      clearInterval(debugTimerRef.current);
    }
    
    debugTimerRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const playerCurrentFrame = playerRef.current.getCurrentFrame();
          const playerCurrentTime = playerCurrentFrame / projectSettings.fps;
          console.log(`🔍 Player 상태: 프레임=${playerCurrentFrame}, 시간=${playerCurrentTime.toFixed(3)}s, 재생=${isPlaying}`);
        } catch (error) {
          console.log('🔍 Player 상태 확인 실패:', error);
        }
      }
    }, 1000);
    
    return () => {
      if (debugTimerRef.current) {
        clearInterval(debugTimerRef.current);
      }
    };
    */
  }, [projectSettings.fps, isPlaying]);

  // 프로젝트 설정에서 총 duration 계산 (프레임 단위)
  const durationInFrames = useMemo(() => {
    const maxEndTime = Math.max(
      ...tracks.flatMap(track =>
        track.clips.map(clip => clip.endTime)
      ),
      projectSettings.duration
    );

    return Math.ceil(maxEndTime * projectSettings.fps);
  }, [tracks, projectSettings]);

  // 🎯 구조적 변경만 감지하는 스마트 hash (Player 재생성 최소화)
  const timelineHash = useMemo(() => {
    return JSON.stringify({
      tracksCount: tracks.length,
      tracks: tracks.map((track, trackIndex) => ({
        id: track.id,
        trackIndex, // 트랙 순서 변경만 감지
        displayName: track.displayName, // 트랙명 변경 감지
        clipsCount: track.clips.length,
        clips: track.clips.map(clip => ({
          id: clip.id,
          mediaType: clip.mediaType,    // 미디어 타입 변경
          mediaUrl: clip.mediaUrl,      // 미디어 URL 변경
          trackId: clip.trackId         // 트랙 이동
          // 위치(x,y), 크기(width,height), 시간(startTime,endTime) 제외
          // → 이런 변경은 Player 재생성 없이도 렌더링 가능
        }))
      }))
    });
  }, [tracks]);

  // 🎯 Player 상태 실시간 폴링 (백그라운드 최적화 적용)
  useEffect(() => {
    let animationFrame: number;
    let timeoutId: NodeJS.Timeout;

    const pollPlayerTime = () => {
      if (playerRef.current && isPlaying) {
        try {
          const playerCurrentFrame = playerRef.current.getCurrentFrame();
          const playerCurrentTime = playerCurrentFrame / projectSettings.fps;
          const timeDiff = Math.abs(playerCurrentTime - currentTime);

          // 0.05초 이상 차이나면 동기화 (더 민감하게)
          if (timeDiff > 0.05) {
            // 🧪 TEST: 시간 업데이트 복원 (Player 렌더링 위해 필요)
            updateTimeNonBlocking(playerCurrentTime);
            lastSyncTimeRef.current = playerCurrentTime;
          }
        } catch (error) {
          // 에러는 조용히 무시
        }
      }

      // 재생 중일 때만 계속 폴링
      if (isPlaying) {
        // 🎯 백그라운드에서는 setTimeout, 포그라운드에서는 requestAnimationFrame
        if (isBackgrounded) {
          timeoutId = setTimeout(pollPlayerTime, 1000 / projectSettings.fps);
        } else {
          animationFrame = requestAnimationFrame(pollPlayerTime);
        }
      }
    };

    if (isPlaying) {
      // 🎯 백그라운드에서는 setTimeout, 포그라운드에서는 requestAnimationFrame
      if (isBackgrounded) {
        timeoutId = setTimeout(pollPlayerTime, 1000 / projectSettings.fps);
      } else {
        animationFrame = requestAnimationFrame(pollPlayerTime);
      }
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPlaying, currentTime, projectSettings.fps, setCurrentTime, isBackgrounded]);

  // 🎯 Store의 재생 상태와 Player 동기화 (개선된 버전)
  useEffect(() => {
    if (playerRef.current) {
      console.log(`🎮 Store → Player 재생 상태: ${isPlaying ? 'PLAY' : 'PAUSE'}`);

      if (isPlaying) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  }, [isPlaying]);

  // 🎯 Store의 currentTime과 Player 동기화 (단순화된 버전)
  useEffect(() => {
    if (playerRef.current) {
      const frameToSeek = Math.round(currentTime * projectSettings.fps);
      const currentPlayerFrame = Math.round(lastSyncTimeRef.current * projectSettings.fps);

      // 1프레임 이상 차이날 때만 seek (더 민감하게)
      if (Math.abs(frameToSeek - currentPlayerFrame) >= 1) {
        console.log(`🎯 Store → Player 시간 이동: ${currentTime.toFixed(3)}s (프레임: ${frameToSeek})`);
        playerRef.current.seekTo(frameToSeek);
        lastSyncTimeRef.current = currentTime;
      }
    }
  }, [currentTime, projectSettings.fps]);

  // 🎯 Player 이벤트 핸들러들 (개선된 버전)
  const handlePlay = useCallback(() => {
    console.log('🎬 Player 재생 시작');
    if (!isPlaying) {
      setIsPlaying(true);
    }
  }, [isPlaying, setIsPlaying]);

  const handlePause = useCallback(() => {
    console.log('🎬 Player 재생 정지');
    if (isPlaying) {
      setIsPlaying(false);
    }
  }, [isPlaying, setIsPlaying]);

  const handleEnded = useCallback(() => {
    console.log('🎬 Player 재생 완료');
    setIsPlaying(false);
    // 끝에 도달하면 시간을 정확히 끝 지점으로 설정
    const endTime = durationInFrames / projectSettings.fps;
    setCurrentTime(endTime);
  }, [setIsPlaying, durationInFrames, projectSettings.fps, setCurrentTime]);

  // 🎯 Player가 로드될 때 초기 동기화
  const handlePlayerReady = useCallback(() => {
    console.log('🎬 Player 준비 완료 - 초기 동기화');
    if (playerRef.current) {
      const frameToSeek = Math.round(currentTime * projectSettings.fps);
      playerRef.current.seekTo(frameToSeek);
      lastSyncTimeRef.current = currentTime;

      if (isPlaying) {
        playerRef.current.play();
      }
    }
  }, [currentTime, isPlaying, projectSettings.fps]);

  // 📊 클립 통계 정보 계산 (타입 가드 활용)
  const clipStats = useMemo(() => {
    const allClips = tracks.flatMap(track => track.clips);

    const stats = {
      total: allClips.length,
      visual: allClips.filter(isVisualClip).length,
      audio: allClips.filter(isAudioClip).length,
      withAudio: allClips.filter(hasAudioProperties).length,
      categories: {
        visual: allClips.filter(clip => getClipCategory(clip) === 'visual').length,
        audio: allClips.filter(clip => getClipCategory(clip) === 'audio').length,
        mixed: allClips.filter(clip => getClipCategory(clip) === 'mixed').length
      }
    };

    return stats;
  }, [tracks]);

  // 디버깅용 정보 표시
  const debugInfo = {
    currentTime: currentTime.toFixed(3),
    durationInFrames,
    totalClips: clipStats.total,
    visualClips: clipStats.visual,
    audioClips: clipStats.audio,
    withAudioClips: clipStats.withAudio,
    isPlayerUpdating: isPlayerUpdatingRef.current,
    lastSyncTime: lastSyncTimeRef.current.toFixed(3),
    playerSize: `${playerSize.width}x${playerSize.height}`,
    containerSize: `${containerSize.width}x${containerSize.height}`,
    aspectRatio: playerSize.aspectRatio
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent', // 투명하게 변경
        padding: '20px',
        position: 'relative'
      }}>
      {/* 메인 Player - 동적 크기 */}
      <div style={{
        width: `${playerSize.width}px`,
        height: `${playerSize.height}px`,
        border: '3px solid #64b5f6', // 세련된 블루 테두리
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#000000',
        boxShadow: '0 8px 32px rgba(100, 181, 246, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)' // 블루 글로우 + 그림자
      }}>
        <Player
          ref={playerRef}
          component={DynamicComposition}
          durationInFrames={durationInFrames}
          compositionWidth={projectSettings.width}
          compositionHeight={projectSettings.height}
          fps={projectSettings.fps}
          acknowledgeRemotionLicense={true}
          controls={false} // Timeline에서 제어
          autoPlay={false}
          loop={false}

          // 🎯 성능 최적화 Props 추가
          audioLatencyHint="interactive"        // 오디오 지연 최소화
          bufferStateDelayInMilliseconds={300}  // 버퍼링 깜빡임 방지
          numberOfSharedAudioTags={5}           // 오디오 태그 미리 생성
          noSuspense={false}                    // React Suspense 활용
          overflowVisible={false}               // 불필요한 계산 방지

          // 🎯 브라우저 최적화
          browserMediaControlsBehavior={{
            mode: 'register-media-session'
          }}

          // 🎯 GPU 가속 CSS
          style={{
            width: '100%',
            height: '100%',
            willChange: 'transform',    // GPU 가속 힌트
            transform: 'translateZ(0)' // 하드웨어 가속 강제
          }}
          // 🔄 폴링 동기화만 사용
          // onTimeUpdate={handleTimeUpdate} // 비활성화
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          // Timeline + 해상도 + 컴테이너 크기 변경 시 리렌더링
          key={`${timelineHash}-${projectSettings.width}x${projectSettings.height}-${containerSize.width}x${containerSize.height}`}
        />
      </div>

      {/* 🎯 동기화 상태 표시 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(42, 42, 62, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(100, 181, 246, 0.3)',
        color: '#ffffff',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '250px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
      }}>
        <div><strong>🔄 Max Size Player</strong></div>
        <div>Player: {debugInfo.playerSize}px</div>
        <div>Container: {debugInfo.containerSize}px</div>
        <div>Aspect: {debugInfo.aspectRatio}:1</div>
        <div>📊 전체: {debugInfo.totalClips}개</div>
        <div>🎬 시각: {debugInfo.visualClips}개</div>
        <div>🎵 오디오: {debugInfo.audioClips}개</div>
        <div>🎙️ 소리: {debugInfo.withAudioClips}개</div>
        <div>Status: {isPlaying ? '▶️ PLAYING' : '⏸️ PAUSED'}</div>
        <div style={{ fontSize: '10px', color: '#64b5f6', marginTop: '5px' }}>
          사용 가능한 최대 크기
        </div>
      </div>

      {/* 📊 해상도 정보 */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'linear-gradient(135deg, rgba(15, 52, 96, 0.95) 0%, rgba(46, 134, 171, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(100, 181, 246, 0.3)',
        color: '#ffffff',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
      }}>
        <div>{projectSettings.width}x{projectSettings.height} @ {projectSettings.fps}fps</div>
        <div>Aspect: {playerSize.aspectRatio}:1</div>
        <div>Duration: {(durationInFrames / projectSettings.fps).toFixed(1)}s</div>
        <div style={{ fontSize: '10px', color: '#81c784', marginTop: '2px' }}>
          Player: {playerSize.width}x{playerSize.height}px
        </div>
        <div style={{ fontSize: '10px', color: '#ffb74d', marginTop: '1px' }}>
          Container: {containerSize.width}x{containerSize.height}px
        </div>
      </div>
    </div>
  );
};
