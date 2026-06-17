import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useEditorStore } from '../../store/editorStore';
import { DynamicComposition } from '../../remotion/DynamicComposition';
import { EditModeComposition } from '../../remotion/edit-mode/EditModeComposition';
import type { EditDragItem } from '../../remotion/edit-mode/EditDragItem';
import type { TimelineClip } from '../../types';
import { useBackgroundOptimization } from '../../hooks/useBackgroundOptimization';
import { useNonBlockingTimeUpdate } from '../../hooks/useNonBlockingTimeUpdate';

export const EditableVideoPlayer: React.FC = () => {
    const {
        currentTime,
        isPlaying,
        projectSettings,
        tracks,
        isEditMode,
        editModeSelectedClips,
        isMuted,
        isDraggingClip,
        isResizingClip,
        draggedClipId,
        resizedClipId,
        needsTimeSync,
        setCurrentTime,
        setCurrentTimeForced, // 강제 시간 업데이트
        playerRealTime, // 플레이어 실시간 시간 읽기
        setPlayerRealTime, // 플래이어 실시간 시간 업데이트
        isDraggingPlayhead, // 플레이헤드 드래그 상태
        setPlayerRef, // Player ref 공유
        setIsPlaying,
        setEditMode,
        setEditModeSelectedClips,
        setMuted,
        toggleMuted,
        getClipsAtCurrentTime,
        applyEditModeChanges,
        updateClip,
        setNeedsTimeSync,
    } = useEditorStore();

    const playerRef = useRef<PlayerRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Player ref를 Store에 등록
    useEffect(() => {
        setPlayerRef(playerRef);
    }, [setPlayerRef]);
    const isPlayerUpdatingRef = useRef(false);
    const lastSyncTimeRef = useRef(0);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });
    
    // 디바운싱을 위한 타이머 ref
    const seekDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 🎯 Store 우회 - 로컬 시간 상태 (재생 중 UI 업데이트용)
    const [localCurrentTime, setLocalCurrentTime] = useState(currentTime);

    // 초기 동기화: playerRealTime을 currentTime으로 설정
    useEffect(() => {
        setPlayerRealTime(currentTime);
        lastSyncTimeRef.current = currentTime;
    }, []); // 한 번만 실행

    // 🎯 백그라운드 탭 최적화
    const isBackgrounded = useBackgroundOptimization();

    // 🎯 500ms 간격 UI 업데이트 시스템
    const updateTimeNonBlocking = useNonBlockingTimeUpdate(setCurrentTime);

    // 편집 모드용 상태
    const [editItems, setEditItems] = useState<EditDragItem[]>([]);
    const [editSelectedItems, setEditSelectedItems] = useState<string[]>([]);
    const [showGrid, setShowGrid] = useState(false);

    // 컨테이너 크기 측정 및 업데이트
    useEffect(() => {
        const updateContainerSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const padding = 40;
                const availableWidth = rect.width - padding;
                const availableHeight = rect.height - padding;

                setContainerSize({
                    width: Math.max(200, availableWidth),
                    height: Math.max(150, availableHeight)
                });
            }
        };

        updateContainerSize();
        window.addEventListener('resize', updateContainerSize);

        const resizeObserver = new ResizeObserver(updateContainerSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateContainerSize);
            resizeObserver.disconnect();
        };
    }, []);

    // Player 크기 계산
    const getPlayerSize = () => {
        const aspectRatio = projectSettings.width / projectSettings.height;
        const { width: maxWidth, height: maxHeight } = containerSize;

        let playerWidth: number;
        let playerHeight: number;

        if (aspectRatio > maxWidth / maxHeight) {
            playerWidth = maxWidth;
            playerHeight = maxWidth / aspectRatio;
        } else {
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

    // 🎯 시간 포맷 함수 (Store 우회 UI용)
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    // 프로젝트 설정에서 총 duration 계산
    const durationInFrames = useMemo(() => {
        const maxEndTime = Math.max(
            ...tracks.flatMap(track =>
                track.clips.map(clip => clip.endTime)
            ),
            projectSettings.duration
        );

        return Math.ceil(maxEndTime * projectSettings.fps);
    }, [tracks, projectSettings]);

    // 🎯 안정된 timelineHash 계산 - 클립 조작 중에는 이전 hash 유지
    const [stableTimelineHash, setStableTimelineHash] = useState('');
    const [lastValidTracks, setLastValidTracks] = useState(tracks);

    // 🎯 구조적 변경만 감지하는 스마트 hash (Player 재생성 최소화)
    const currentTimelineHash = useMemo(() => {
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
                    trackId: clip.trackId,        // 트랙 이동
                    text: clip.text               // 텍스트 내용 변경 (중요한 변경)
                    // 위치(x,y), 크기(width,height), 시간(startTime,endTime) 제외
                    // → 이런 변경은 Player 재생성 없이도 렌더링 가능
                }))
            }))
        });
    }, [tracks]);

    // 🎯 클립 조작 상태에 따른 안정된 hash 업데이트
    useEffect(() => {
        const isClipBeingManipulated = isDraggingClip || isResizingClip;

        if (!isClipBeingManipulated) {
            // 클립 조작이 끝났을 때만 hash 업데이트
            const hashChanged = stableTimelineHash !== currentTimelineHash;
            setStableTimelineHash(currentTimelineHash);
            setLastValidTracks(tracks);

            if (hashChanged) {
                setNeedsTimeSync(true); // 🎯 hash 변경 시 시간 동기화 플래그 설정
            }

        }
    }, [currentTimelineHash, isDraggingClip, isResizingClip, draggedClipId, resizedClipId, tracks, stableTimelineHash, setNeedsTimeSync]);

    // 초기 hash 설정
    useEffect(() => {
        if (stableTimelineHash === '') {
            setStableTimelineHash(currentTimelineHash);
            setLastValidTracks(tracks);
        }
    }, [currentTimelineHash, stableTimelineHash, tracks]);

    const timelineHash = stableTimelineHash;

    // 편집 모드에서 현재 시간의 클립들을 EditDragItem으로 변환
    useEffect(() => {
        if (isEditMode) {
            const clipsAtCurrentTime = getClipsAtCurrentTime();


            const editDragItems: EditDragItem[] = clipsAtCurrentTime.map((clip, index) => ({
                id: clip.id,
                durationInFrames: Math.ceil((clip.endTime - clip.startTime) * projectSettings.fps),
                from: 0, // 편집 모드에서는 항상 0부터 시작
                height: clip.height, // 원래 클립의 크기 사용
                left: clip.x, // 원래 클립의 위치 사용
                top: clip.y,
                width: clip.width,
                color: getClipColor(clip),
                isDragging: false,
                mediaType: getClipMediaType(clip),
                mediaUrl: clip.mediaUrl,

                // ✅ Shape 속성 원본 클립에서 복사
                shapeProperties: clip.shapeProperties,

                // 텍스트 속성들 원본 클립에서 복사
                text: clip.text,
                fontSize: clip.fontSize,
                fontFamily: clip.fontFamily,
                fontWeight: clip.fontWeight,
                textColor: clip.color,
                backgroundColor: clip.backgroundColor,
                textAlign: clip.textAlign,
                lineHeight: clip.lineHeight,
                letterSpacing: clip.letterSpacing,
                textDecoration: clip.textDecoration,
                textTransform: clip.textTransform,
                wordWrap: clip.wordWrap,
                paddingTop: clip.paddingTop,
                paddingRight: clip.paddingRight,
                paddingBottom: clip.paddingBottom,
                paddingLeft: clip.paddingLeft,
                shadowOffsetX: clip.shadowOffsetX,
                shadowOffsetY: clip.shadowOffsetY,
                shadowBlur: clip.shadowBlur,
                shadowColor: clip.shadowColor,
                strokeWidth: clip.strokeWidth,
                strokeColor: clip.strokeColor,

                // 일반 속성들 원본 클립에서 복사
                opacity: clip.opacity,
                rotation: clip.rotation,
                scaleX: clip.scaleX,
                scaleY: clip.scaleY,
                skewX: clip.skewX,
                skewY: clip.skewY,
                anchorX: clip.anchorX,
                anchorY: clip.anchorY,
                blendMode: clip.blendMode,

                isSelected: false,
                snapToGrid: false, // 초기값은 false로 설정
                originalClipId: clip.id,
                trackId: clip.trackId,
                mediaId: clip.mediaId,
                clipStartTime: clip.startTime,
                clipEndTime: clip.endTime,
            }));

            setEditItems(editDragItems);
            setEditSelectedItems(editDragItems.map(item => item.id));
        } else {
            setEditItems([]);
            setEditSelectedItems([]);
        }
    }, [isEditMode, currentTime, getClipsAtCurrentTime, projectSettings.fps]);

    // 클립 색상 결정 함수
    const getClipColor = (clip: TimelineClip): string => {
        if (clip.mediaType === 'text') return clip.backgroundColor || '#9b59b6';
        return '#2ecc71'; // 기본 색상
    };

    // 클립 미디어 타입 결정 함수
    const getClipMediaType = (clip: TimelineClip): 'solid' | 'image' | 'text' | 'video' | 'shape' => {
        return clip.mediaType as 'solid' | 'image' | 'text' | 'video' | 'shape';
    };

    // 편집 모드에서 격자 설정 변경 시 기존 아이템 위치 보존
    const updateGridSnapMode = useCallback((newShowGrid: boolean) => {
        setShowGrid(newShowGrid);

        // 기존 editItems에 snapToGrid 속성만 업데이트
        setEditItems(prevItems =>
            prevItems.map(item => ({
                ...item,
                snapToGrid: newShowGrid
            }))
        );
    }, []);

    // 편집 아이템 변경 핸들러 (실시간 속성 패널 동기화 포함) - 무한루프 방지 개선
    const changeEditItem = useCallback((itemId: string, updater: (item: EditDragItem) => EditDragItem) => {
        setEditItems(oldItems => {
            const newItems = oldItems.map(item => {
                if (item.id === itemId) {
                    const updatedItem = updater(item);

                    // 🔄 실시간으로 실제 클립 데이터도 업데이트 (속성 패널 동기화)
                    // 하지만 무한루프 방지를 위해 실제 변경이 있을 때만 업데이트
                    const originalClip = tracks.flatMap(track => track.clips).find(clip => clip.id === updatedItem.originalClipId);
                    if (originalClip && (
                        originalClip.x !== updatedItem.left ||
                        originalClip.y !== updatedItem.top ||
                        originalClip.width !== updatedItem.width ||
                        originalClip.height !== updatedItem.height
                    )) {
                        updateClip(updatedItem.originalClipId, {
                            x: updatedItem.left,
                            y: updatedItem.top,
                            width: updatedItem.width,
                            height: updatedItem.height
                        });
                    }

                    return updatedItem;
                }
                return item;
            });

            return newItems;
        });
    }, [updateClip, tracks]);

    // 속성창 -> 편집 모드 실시간 동기화: 클립 업데이트 시 편집 아이템도 동기화 (무한루프 방지)
    const syncEditItemsWithClips = useCallback(() => {
        if (!isEditMode) return;

        const clipsAtCurrentTime = getClipsAtCurrentTime();

        setEditItems(prevItems => {
            let hasChanges = false;

            const newItems = prevItems.map(editItem => {
                const updatedClip = clipsAtCurrentTime.find(clip => clip.id === editItem.originalClipId);
                if (updatedClip) {
                    // 🔍 실제 변경이 있는지 확인 (무한루프 방지)
                    if (editItem.left !== updatedClip.x ||
                        editItem.top !== updatedClip.y ||
                        editItem.width !== updatedClip.width ||
                        editItem.height !== updatedClip.height) {
                        hasChanges = true;
                        return {
                            ...editItem,
                            left: updatedClip.x,
                            top: updatedClip.y,
                            width: updatedClip.width,
                            height: updatedClip.height
                        };
                    }
                }
                return editItem;
            });

            // ✅ 실제 변경이 있을 때만 업데이트
            return hasChanges ? newItems : prevItems;
        });
    }, [isEditMode, getClipsAtCurrentTime]);

    // 클립 데이터 변경 감지하여 편집 아이템 동기화 (디바운스 추가)
    const tracksStringRef = useRef<string>('');

    useEffect(() => {
        if (!isEditMode) return;

        // 트랙 변경을 문자열로 비교하여 실제 변경이 있을 때만 동기화
        const currentTracksString = JSON.stringify(tracks.map(track =>
            track.clips.map(clip => ({
                id: clip.id,
                x: clip.x,
                y: clip.y,
                width: clip.width,
                height: clip.height
            }))
        ));

        if (tracksStringRef.current !== currentTracksString) {
            tracksStringRef.current = currentTracksString;

            // 디바운스로 동기화 수행 (무한루프 방지)
            const timeoutId = setTimeout(() => {
                syncEditItemsWithClips();
            }, 10); // 10ms 디바운스

            return () => clearTimeout(timeoutId);
        }
    }, [isEditMode, tracks, syncEditItemsWithClips]);

    // 다중 편집 아이템 변경 핸들러
    const changeMultipleEditItems = useCallback((itemIds: string[], updater: (item: EditDragItem) => EditDragItem) => {
        setEditItems(oldItems =>
            oldItems.map(item =>
                itemIds.includes(item.id) ? updater(item) : item
            )
        );
    }, []);

    // 편집 완료 핸들러
    const handleEditComplete = useCallback((changes: { clipId: string; x: number; y: number; width: number; height: number }[]) => {

        applyEditModeChanges(changes);
        setEditMode(false);
    }, [applyEditModeChanges, setEditMode]);

    // 🎯 Player 상태 실시간 폴링 (백그라운드 최적화 적용)
    useEffect(() => {
        if (isEditMode) return; // 편집 모드에서는 폴링 중지

        let animationFrame: number;
        let timeoutId: NodeJS.Timeout;

        const pollPlayerTime = () => {
            if (playerRef.current && isPlaying) {
                try {
                    const playerCurrentFrame = playerRef.current.getCurrentFrame();
                    const playerCurrentTime = playerCurrentFrame / projectSettings.fps;
                    const timeDiff = Math.abs(playerCurrentTime - currentTime);

                    if (timeDiff > 0.05) {
                        // 🎯 재생 중: playerRealTime만 업데이트 (부드러운 재생을 위해)
                        setPlayerRealTime(playerCurrentTime); // 실시간 시간만 업데이트
                        lastSyncTimeRef.current = playerCurrentTime;
                    }
                } catch (error) {
                    // 에러는 조용히 무시
                }
            }

            if (isPlaying && !isEditMode) {
                // 🎯 백그라운드에서는 setTimeout, 포그라운드에서는 requestAnimationFrame
                if (isBackgrounded) {
                    timeoutId = setTimeout(pollPlayerTime, 1000 / projectSettings.fps);
                } else {
                    animationFrame = requestAnimationFrame(pollPlayerTime);
                }
            }
        };

        if (isPlaying && !isEditMode) {
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
    }, [isPlaying, currentTime, projectSettings.fps, setCurrentTime, isEditMode, isBackgrounded]);

    // Store의 재생 상태와 Player 동기화
    useEffect(() => {
        if (playerRef.current && !isEditMode) {
            if (isPlaying) {
                playerRef.current.play();
            } else {
                playerRef.current.pause();
                // 정지 시 실제 Player 시간을 기준으로 currentTime과 playerRealTime 모두 동기화
                try {
                    const playerCurrentFrame = playerRef.current.getCurrentFrame();
                    const playerCurrentTime = playerCurrentFrame / projectSettings.fps;

                    // 중요: currentTime과 playerRealTime 모두 업데이트
                    setCurrentTimeForced(playerCurrentTime); // currentTime도 함께 업데이트
                    setPlayerRealTime(playerCurrentTime);
                    lastSyncTimeRef.current = playerCurrentTime;

                } catch (error) {
                    // 에러 시 currentTime으로 fallback
                    setPlayerRealTime(currentTime);
                }
            }
        }
    }, [isPlaying, isEditMode, currentTime, setPlayerRealTime, setCurrentTimeForced, projectSettings.fps]);

    // 🎯 Player seeked 이벤트 리스너 설정
    useEffect(() => {
        if (!playerRef.current) return;

        const player = playerRef.current;

        const handleSeeked = (e: any) => {
            const frame = e.detail.frame;
            const timeInSeconds = frame / projectSettings.fps;

            // 드래그 중에는 seeked 이벤트 무시 (무한 루프 방지)
            if (isDraggingPlayhead) return;

            setTimeout(() => {
                setPlayerRealTime(timeInSeconds);
                lastSyncTimeRef.current = timeInSeconds;
            }, 0);
        };

        player.addEventListener('seeked', handleSeeked);

        return () => {
            player.removeEventListener('seeked', handleSeeked);

            if (seekDebounceTimerRef.current) {
                clearTimeout(seekDebounceTimerRef.current);
                seekDebounceTimerRef.current = null;
            }
        };
    }, [projectSettings.fps, setCurrentTime, setPlayerRealTime, timelineHash, isDraggingPlayhead]);

    // 편집 모드 전환 시 Player 시간 강제 동기화
    useEffect(() => {
        // 편집 모드에서 재생 모드로 전환할 때 Player 시간 강제 동기화
        if (!isEditMode && playerRef.current) {
            const frameToSeek = Math.round(currentTime * projectSettings.fps);


            // 짧은 지연 후 시간 동기화 (연속 하나의 Player이므로 안정성 위해)
            setTimeout(() => {
                if (playerRef.current && !isEditMode) {
                    playerRef.current.seekTo(frameToSeek);
                    lastSyncTimeRef.current = currentTime;

                }
            }, 50); // 50ms 지연
        }
    }, [isEditMode, currentTime, projectSettings.fps]);

    // Player 이벤트 핸들러들
    const handlePlay = useCallback(() => {

        if (!isPlaying && !isEditMode) {
            setIsPlaying(true);
        }
    }, [isPlaying, setIsPlaying, isEditMode]);

    const handlePause = useCallback(() => {

        if (isPlaying) {
            setIsPlaying(false);
        }
    }, [isPlaying, setIsPlaying]);

    const handleEnded = useCallback(() => {

        setIsPlaying(false);
        const endTime = durationInFrames / projectSettings.fps;
        setCurrentTime(endTime);
    }, [setIsPlaying, durationInFrames, projectSettings.fps, setCurrentTime]);

    // 🎯 timelineHash 변경 감지 및 시간 동기화 강제 수행
    useEffect(() => {
        if (needsTimeSync && !isEditMode && playerRef.current) {
            const timeoutId = setTimeout(() => {
                if (playerRef.current && !isEditMode) {
                    const frameToSeek = Math.round(currentTime * projectSettings.fps);

                    try {
                        playerRef.current.seekTo(frameToSeek);
                        lastSyncTimeRef.current = currentTime;
                        setNeedsTimeSync(false);

                        if (isPlaying) {
                            playerRef.current.play();
                        }
                    } catch (error) {
                        setNeedsTimeSync(false);
                    }
                }
            }, 200);

            return () => clearTimeout(timeoutId);
        }
    }, [needsTimeSync, isEditMode, currentTime, projectSettings.fps, isPlaying, setNeedsTimeSync]);

    // ESC 키로 편집 모드 종료 (변경사항 취소)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isEditMode) {

                setEditMode(false);
                setShowGrid(false); // 격자도 비활성화
                // applyEditModeChanges를 호출하지 않음 - 변경사항 취소

                // ESC 키로 편집 모드 종료 시도 Player 시간 동기화
                setTimeout(() => {
                    if (playerRef.current) {
                        const frameToSeek = Math.round(currentTime * projectSettings.fps);

                        playerRef.current.seekTo(frameToSeek);
                        lastSyncTimeRef.current = currentTime;
                    }
                }, 100); // 100ms 지연
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEditMode, setEditMode, currentTime, projectSettings.fps]);

    // 디버깅용 정보 표시
    const debugInfo = {
        currentTime: currentTime.toFixed(3),
        durationInFrames,
        totalClips: tracks.reduce((sum, track) => sum + track.clips.length, 0),
        playerSize: `${playerSize.width}x${playerSize.height}`,
        containerSize: `${containerSize.width}x${containerSize.height}`,
        aspectRatio: playerSize.aspectRatio,
        isEditMode,
        editItemsCount: editItems.length,
        // Player 실제 프레임 정보 추가
        expectedFrame: Math.round(currentTime * projectSettings.fps),
        playerFrame: playerRef.current ? (() => {
            try {
                return playerRef.current.getCurrentFrame();
            } catch {
                return 'N/A';
            }
        })() : 'N/A'
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
                backgroundColor: 'transparent',
                padding: '20px',
                position: 'relative'
            }}>

            {/* 격자 토글 버튼 (편집 모드에서만) - 속성창과 겹치지 않도록 위치 조정 */}
            {isEditMode && (
                <button
                    onClick={() => updateGridSnapMode(!showGrid)}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '340px', // 속성창(320px) + 여백(20px)
                        background: showGrid
                            ? 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)'
                            : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                        color: '#ffffff',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        zIndex: 1001,
                        boxShadow: showGrid
                            ? '0 4px 12px rgba(78, 205, 196, 0.4)'
                            : '0 4px 12px rgba(149, 165, 166, 0.3)',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${showGrid ? 'rgba(78, 205, 196, 0.5)' : 'rgba(149, 165, 166, 0.3)'}`
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                        e.currentTarget.style.boxShadow = showGrid
                            ? '0 6px 20px rgba(78, 205, 196, 0.6)'
                            : '0 6px 20px rgba(149, 165, 166, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = showGrid
                            ? '0 4px 12px rgba(78, 205, 196, 0.4)'
                            : '0 4px 12px rgba(149, 165, 166, 0.3)';
                    }}
                >
                    [GRID] {showGrid ? 'ON' : 'OFF'}
                </button>
            )}

            {/* 메인 Player - 동적 크기 */}
            <div style={{
                width: `${playerSize.width}px`,
                height: `${playerSize.height}px`,
                border: `3px solid ${isEditMode ? '#ff6b6b' : '#64b5f6'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#000000',
                boxShadow: isEditMode
                    ? '0 8px 32px rgba(255, 107, 107, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)'
                    : '0 8px 32px rgba(100, 181, 246, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)'
            }}>
                <Player
                    ref={playerRef}
                    component={isEditMode ? EditModeComposition : DynamicComposition}
                    durationInFrames={durationInFrames}
                    compositionWidth={projectSettings.width}
                    compositionHeight={projectSettings.height}
                    fps={projectSettings.fps}
                    acknowledgeRemotionLicense={true}
                    controls={false}
                    autoPlay={false}
                    loop={false}
                    allowFullscreen={true}
                    showVolumeControls={false}
                    muted={isMuted}

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
                    inputProps={isEditMode ? {
                        items: editItems,
                        setSelectedItems: setEditSelectedItems,
                        selectedItems: editSelectedItems,
                        changeItem: changeEditItem,
                        changeMultipleItems: changeMultipleEditItems,
                        showGrid,
                        onEditComplete: handleEditComplete,
                        compositionWidth: projectSettings.width,
                        compositionHeight: projectSettings.height,
                    } : undefined}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={handleEnded}
                    onTimeUpdate={(e: any) => {
                        // 재생 중 실시간 시간 업데이트
                        const frame = e.detail.frame;
                        const timeInSeconds = frame / projectSettings.fps;
                        setPlayerRealTime(timeInSeconds);
                    }}
                    key={timelineHash}
                />
            </div>

            {/* 해상도 정보 */}
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
                <div>Duration: {(durationInFrames / projectSettings.fps).toFixed(1)}s</div>
                <div>Time: {debugInfo.currentTime}s</div>
            </div>
        </div>
    );
};
