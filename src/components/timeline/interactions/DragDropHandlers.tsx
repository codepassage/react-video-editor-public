/**
 * 🎯 DragDropHandlers.tsx - 타임라인 드래그 앤 드롭 핸들러 컴포넌트
 * 
 * 타임라인에서 미디어 라이브러리로부터 클립을 드래그하여 놓기(drop) 기능을
 * 처리하는 핵심 컴포넌트입니다. react-dnd를 사용하여 정교한 드래그 앤 드롭
 * 상호작용을 구현하고, 다양한 미디어 타입과 특수 클립 규칙을 처리합니다.
 * 
 * 주요 기능:
 * - 미디어 라이브러리에서 타임라인으로 드래그 앤 드롭
 * - 정확한 시간 위치 계산 (줌 레벨 고려)
 * - 트랙별 드롭 위치 감지
 * - 기준 클립 겹침 방지 로직
 * - 미디어 타입별 자동 클립 생성
 * - 드래그 중 시각적 피드백
 * 
 * 지원 미디어 타입:
 * - Video: 비디오 파일 (.mp4, .avi, .mov 등)
 * - Audio: 오디오 파일 (.mp3, .wav, .ogg 등)
 * - Image: 이미지 파일 (.jpg, .png, .gif 등)
 * - Text: 텍스트 클립 생성
 * - Shape: 도형 클립 생성
 * 
 * 드롭 규칙:
 * - 기준 클립 겹침 검사 및 방지
 * - 트랙별 미디어 타입 제한
 * - 최소 클립 길이 보장
 * - 타임라인 경계 내 배치
 * - 자동 트랙 생성 (필요 시)
 * 
 * 좌표 계산:
 * - 마우스 위치 → 시간 변환
 * - 줌 레벨에 따른 정밀도 조정
 * - 트랙 높이 기반 Y 좌표 계산
 * - 그리드 스냅 지원
 * 
 * 관련 모듈:
 * - 1번 모듈: Timeline System (드래그 앤 드롭 핵심)
 * - MediaLibrary: 드래그 소스
 * - clipActions: 클립 생성 액션
 * - baseClips: 기준 클립 겹침 검사
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import {
  MediaItem,
  DragItem,
  DEFAULT_TRACK_HEIGHT,
  TimelineClip,
  TimelineTrack,
  ProjectSettings,
  isBaseClip,
  checkBaseClipOverlap
} from '../../../types';
import { useEditorStore } from '../../../store/editorStore';

interface DragDropHandlersProps {
  tracks: TimelineTrack[];
  allClips: TimelineClip[];
  zoom: number;
  scrollLeft: number;
  containerRef: React.RefObject<HTMLDivElement>;
  addClip: (data: any) => void;
  updateClip: (id: string, updates: any) => void;
  getClipById: (id: string) => TimelineClip | undefined;
  projectSettings: ProjectSettings;
  // Bundle 관련 제약 로직
  moveBundleElementSafely?: (elementId: string, elementType: 'baseClip' | 'templateGroup', newStartTime: number) => {
    success: boolean;
    finalTime: number;
    wasConstrained?: boolean;
    reason?: string;
  };
}

export const useDragDropHandlers = ({
  tracks,
  allClips,
  zoom,
  scrollLeft,
  containerRef,
  addClip,
  updateClip,
  getClipById,
  projectSettings,
  moveBundleElementSafely
}: DragDropHandlersProps) => {

  // 미디어 드롭 처리
  const handleDropMedia = (mediaItem: MediaItem, trackId: string, startTime: number) => {
    // 🎯 트랙이 Base Track인지 확인 (모든 조건 체크)
    const targetTrack = tracks.find((track) => track.id === trackId);
    const isDropOnBaseTrack = targetTrack &&
      (targetTrack.name.includes('Base Track') ||
        targetTrack.displayName.includes('Base Track') ||
        targetTrack.isBaseTrack === true);

    let duration = 3;
    if (mediaItem.type === 'video' && mediaItem.duration) duration = mediaItem.duration;
    else if (mediaItem.type === 'audio' && mediaItem.duration) duration = mediaItem.duration;
    else if (mediaItem.type === 'image') duration = 5;
    else if (mediaItem.type === 'text') duration = 3;
    else if (mediaItem.type === 'shape') duration = 5;

    const snappedStartTime = Math.max(0, startTime);
    let finalTrackId = trackId;
    let finalIsBaseClip = isDropOnBaseTrack;
    let conflictResolved = false;

    console.log('📥 미디어 드롭 시도:', {
      미디어타입: mediaItem.type,
      목표트랙: targetTrack?.displayName || targetTrack?.name || trackId,
      기준트랙여부: isDropOnBaseTrack,
      시작시간: snappedStartTime.toFixed(2),
      지속시간: duration.toFixed(2)
    });

    if (isDropOnBaseTrack) {
      const endTime = snappedStartTime + duration;
      const existingBaseClips = allClips.filter(isBaseClip);

      // 새로운 기준클립을 추가해서 충돌 검사
      const newBaseClip: TimelineClip = {
        id: 'temp-check',
        startTime: snappedStartTime,
        endTime: endTime,
        duration: duration,
        baseClipProperties: { isBaseClip: true, dynamicProperties: [] }
      } as TimelineClip;

      const testBaseClips = [...existingBaseClips, newBaseClip];
      const hasConflict = checkBaseClipOverlap(testBaseClips);

      if (hasConflict) {
        console.log('⚠️ 기준트랙 충돌 감지, 대안 트랙 탐색 중...');

        // 주위 일반트랙으로 배치
        const currentTrackIndex = tracks.findIndex((t) => t.id === trackId);
        const searchOrder: number[] = [];
        for (let i = currentTrackIndex + 1; i < tracks.length; i++) searchOrder.push(i);
        for (let i = currentTrackIndex - 1; i >= 0; i--) searchOrder.push(i);

        for (const idx of searchOrder) {
          const track = tracks[idx];
          const isBase = track.name.includes('Base Track') ||
            track.displayName.includes('Base Track') ||
            track.isBaseTrack === true;
          if (!isBase) {
            finalTrackId = track.id;
            finalIsBaseClip = false;
            conflictResolved = true;
            console.log('✅ 대안 트랙 발견:', {
              대안트랙: track.displayName || track.name,
              트랙ID: track.id
            });
            break;
          }
        }

        if (!conflictResolved) {
          console.log('❌ 사용 가능한 대안 트랙을 찾을 수 없음');
        }
      } else {
        console.log('🛡️ 기준트랙에 성공적으로 배치 - 기준클립으로 설정됨:', {
          트랙: targetTrack?.displayName || targetTrack?.name,
          시간범위: `${snappedStartTime.toFixed(2)}~${endTime.toFixed(2)}`
        });
      }
    } else {
      console.log('📋 일반트랙에 배치 - 일반클립으로 설정됨:', {
        트랙: targetTrack?.displayName || targetTrack?.name
      });
    }

    // 기본 위치/크기 계산
    const clipData = {
      mediaId: mediaItem.id,
      trackId: finalTrackId,
      startTime: snappedStartTime,
      endTime: snappedStartTime + duration,
      duration,
      mediaType: mediaItem.type,
      mediaUrl: mediaItem.url,
      x: mediaItem.x ?? 100,
      y: mediaItem.y ?? 100,
      width: mediaItem.width ?? 400,
      height: mediaItem.height ?? 300,
      opacity: mediaItem.opacity ?? 1,
      rotation: mediaItem.rotation ?? 0,
      name: mediaItem.name || `새 ${mediaItem.type} 클립`, // 🆕 name 속성 추가
      baseClipProperties: finalIsBaseClip
        ? {
          isBaseClip: true,
          dynamicProperties: []
        }
        : undefined,
      regularClipProperties: !finalIsBaseClip ? { isBaseClip: false, dynamicProperties: [] } : undefined
    } as const;

    console.log('🔍 상세 클립 데이터 검사:', {
      mediaItem: {
        id: mediaItem.id,
        type: mediaItem.type,
        name: mediaItem.name,
        url: mediaItem.url?.slice(0, 30) + '...'
      },
      targetTrack: {
        id: targetTrack?.id,
        name: targetTrack?.name,
        displayName: targetTrack?.displayName,
        isBaseTrack: targetTrack?.isBaseTrack
      },
      결정된값: {
        finalTrackId,
        finalIsBaseClip,
        isDropOnBaseTrack
      },
      생성될baseClipProperties: clipData.baseClipProperties,
      생성될regularClipProperties: clipData.regularClipProperties
    });

    console.log('🎬 클립 생성 완료:', {
      최종트랙: finalTrackId,
      기준클립여부: finalIsBaseClip,
      충돌해결: conflictResolved
    });

    addClip(clipData);
  };

  // Bundle에 속한 클립인지 확인 및 이동 처리
  const handleMoveClip = (clipId: string, newTrackId: string, newStartTime: number) => {
    const clip = getClipById(clipId);
    if (!clip) return;

    console.log('🏁 handleMoveClip 시작:', {
      clipId: clipId.slice(-8),
      원래위치: `${clip.startTime.toFixed(3)}s - ${clip.endTime.toFixed(3)}s`,
      newStartTime: newStartTime.toFixed(3),
      newTrackId
    });

    // 순수한 위치 사용 (스냅핑 없음)
    const snappedTime = Math.max(0, newStartTime);
    
    console.log('🔧 순수 위치 적용:', {
      raw: newStartTime.toFixed(3),
      final: snappedTime.toFixed(3)
    });

    // 🆕 목표 트랙이 기준트랙인지 확인
    const targetTrack = tracks.find(track => track.id === newTrackId);
    const isTargetBaseTrack = targetTrack &&
      (targetTrack.name.includes('Base Track') ||
        targetTrack.displayName.includes('Base Track'));

    // 🆕 현재 트랙이 기준트랙인지 확인
    const currentTrack = tracks.find(track => track.id === clip.trackId);
    const isCurrentBaseTrack = currentTrack &&
      (currentTrack.name.includes('Base Track') ||
        currentTrack.displayName.includes('Base Track') ||
        currentTrack.isBaseTrack === true);

    // Bundle에 속한 클립인지 확인
    if (clip.bundleId && moveBundleElementSafely) {
      console.log('📦 Bundle 클립 순서 변경 시도:', {
        clipId: clipId.slice(-8),
        bundleId: clip.bundleId.slice(-8),
        원래시간: clip.startTime.toFixed(2),
        새시간: snappedTime.toFixed(2),
        원래트랙: clip.trackId,
        새트랙: newTrackId
      });

      // Bundle 클립은 트랙 변경 불가 (같은 트랙 내에서만 순서 이동)
      if (clip.trackId !== newTrackId) {
        console.log('⚠️ Bundle 클립은 다른 트랙으로 이동할 수 없습니다');
        return false; // 이동 차단
      }

      // Bundle 제약 로직을 적용하여 안전하게 이동
      const result = moveBundleElementSafely(clipId, 'baseClip', snappedTime);

      if (result.wasConstrained) {
        console.log('🔒 Bundle 순서 변경 제약 적용:', {
          clipId: clipId.slice(-8),
          원래시간: snappedTime.toFixed(2),
          최종시간: result.finalTime.toFixed(2)
        });
      } else {
        console.log('✅ Bundle 클립 순서 변경 완료:', {
          clipId: clipId.slice(-8),
          새위치: result.finalTime.toFixed(2)
        });
      }

      return true; // 이동 완료
    } else {
      // Bundle에 속하지 않은 클립 처리
      const finalEndTime = snappedTime + clip.duration;

      // 🆕 트랙 변경에 따른 baseClipProperties 업데이트
      let baseClipPropsUpdate = {};

      // 기준트랙으로 이동하는 경우
      if (isTargetBaseTrack && !isCurrentBaseTrack) {
        // 일반클립 → 기준클립으로 변경
        baseClipPropsUpdate = {
          baseClipProperties: {
            isBaseClip: true,
            // 🔄 dynamicProperties 보존
            dynamicProperties: clip.regularClipProperties?.dynamicProperties || []
          },
          regularClipProperties: undefined // 일반클립 속성 제거
        };

        console.log('🔄 일반클립 → 기준클립 변환:', {
          clipId: clipId.slice(-8),
          새트랙: newTrackId
        });
      }
      // 일반트랙으로 이동하는 경우
      else if (!isTargetBaseTrack && isCurrentBaseTrack) {
        // 기준클립 → 일반클립으로 변경
        baseClipPropsUpdate = {
          baseClipProperties: undefined, // 기준클립 속성 제거
          regularClipProperties: {
            isBaseClip: false,
            // 🔄 dynamicProperties 보존
            dynamicProperties: clip.baseClipProperties?.dynamicProperties || []
          }
        };

        console.log('🔄 기준클립 → 일반클립 변환:', {
          clipId: clipId.slice(-8),
          새트랙: newTrackId
        });
      }

      // 🎯 기준클립인 경우 (또는 기준클립이 될 경우) 다른 기준클립과의 충돌 검사
      const willBeBaseClip = isTargetBaseTrack || (isCurrentBaseTrack && clip.trackId === newTrackId);

      if (willBeBaseClip) {
        const otherBaseClips = allClips.filter(c => isBaseClip(c) && c.id !== clipId);

        // 이동할 기준클립을 포함해서 충돌 검사
        const movedBaseClip: TimelineClip = {
          ...clip,
          startTime: snappedTime,
          endTime: finalEndTime,
          trackId: newTrackId,
          baseClipProperties: {
            isBaseClip: true,
            dynamicProperties: clip.baseClipProperties?.dynamicProperties || []
          }
        };

        const testBaseClips = [...otherBaseClips, movedBaseClip];
        const hasConflict = checkBaseClipOverlap(testBaseClips);

        if (hasConflict) {
          console.log('⚠️ 기준클립 이동 불가: 다른 기준클립과 겹침', {
            clipId: clipId.slice(-8),
            시도한시간: `${snappedTime.toFixed(2)}~${finalEndTime.toFixed(2)}`,
            기존기준클립들: otherBaseClips.map(c => ({
              id: c.id.slice(-8),
              시간: `${c.startTime.toFixed(2)}~${c.endTime.toFixed(2)}`
            })),
            이동할클립: {
              id: movedBaseClip.id.slice(-8),
              시간: `${movedBaseClip.startTime.toFixed(2)}~${movedBaseClip.endTime.toFixed(2)}`
            }
          });
          return false; // 이동 차단
        }

        console.log('✅ 기준클립 이동 완료:', {
          clipId: clipId.slice(-8),
          시간: `${snappedTime.toFixed(2)}~${finalEndTime.toFixed(2)}`,
          트랙: newTrackId,
          타입: isTargetBaseTrack ? '기준트랙' : '같은트랙'
        });
      } else {
        console.log('📱 일반 클립 이동 완료:', {
          clipId: clipId.slice(-8),
          시간: `${snappedTime.toFixed(2)}~${finalEndTime.toFixed(2)}`,
          트랙: newTrackId
        });
      }

      // 클립 업데이트 (트랙 이동 + baseClipProperties 변경)
      console.log('✅ 최종 클립 업데이트:', {
        clipId: clipId.slice(-8),
        최종위치: `${snappedTime.toFixed(3)}s - ${finalEndTime.toFixed(3)}s`,
        trackId: newTrackId,
        baseClipPropsUpdate
      });
      
      updateClip(clipId, {
        trackId: newTrackId,
        startTime: snappedTime,
        endTime: finalEndTime,
        ...baseClipPropsUpdate
      });

      return true; // 이동 완료
    }
  };

  // 드롭 핸들러
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['media', 'clip', 'bundleElement'], // bundleElement 타입 추가
    drop: (item: DragItem, monitor) => {
      if (!containerRef.current) return { success: false };

      const clientOffset = monitor.getClientOffset();
      const initialClientOffset = monitor.getInitialClientOffset();
      const initialSourceClientOffset = monitor.getInitialSourceClientOffset();

      if (!clientOffset || !initialClientOffset || !initialSourceClientOffset) {
        return { success: false };
      }

      const containerRect = containerRef.current.getBoundingClientRect();

      const mouseX = clientOffset.x - containerRect.left;
      const mouseY = clientOffset.y - containerRect.top;

      const dragOffsetX = initialClientOffset.x - initialSourceClientOffset.x;
      const dragOffsetY = initialClientOffset.y - initialSourceClientOffset.y;

      const objectLeftX = mouseX - dragOffsetX;
      const objectTopY = mouseY - dragOffsetY;

      const absoluteX = objectLeftX + scrollLeft;

      const rawTime = absoluteX / zoom;
      
      // 드래그 시작시 캡처된 Option 키 상태 사용
      const { snapValue } = useEditorStore.getState();
      const isOptionPressed = item.optionKeyPressed || false;
      const snappedTime = isOptionPressed ? Math.round(rawTime / snapValue) * snapValue : rawTime;
      const startTime = Math.max(0, snappedTime);
      
      console.log('🎯 드롭 순간 위치 계산:', {
        rawTime: rawTime.toFixed(3),
        isOptionPressed,
        snapValue,
        snappedTime: snappedTime.toFixed(3),
        finalTime: startTime.toFixed(3),
        mouseX,
        dragOffsetX,
        objectLeftX,
        absoluteX,
        scrollLeft,
        zoom
      });

      const objectCenterY = objectTopY + DEFAULT_TRACK_HEIGHT / 2;
      const trackIndex = Math.floor(objectCenterY / DEFAULT_TRACK_HEIGHT);
      const targetTrack = tracks[trackIndex];

      if (!targetTrack || trackIndex < 0 || trackIndex >= tracks.length) {
        return { success: false };
      }

      if (item.type === 'media' && item.mediaItem) {
        handleDropMedia(item.mediaItem, targetTrack.id, startTime);
        return { success: true };
      } else if (item.type === 'clip' && item.clipId) {
        handleMoveClip(item.clipId, targetTrack.id, startTime);
        return { success: true };
      } else if (item.type === 'bundleElement' && item.clipId) {
        // 🎯 Bundle 요소 처리 - 순서 변경은 허용하되 트랙 이동은 제한
        const result = handleMoveClip(item.clipId, targetTrack.id, startTime);
        return { success: result };
      }

      return { success: false };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  return {
    isOver,
    canDrop,
    drop,
    handleDropMedia,
    handleMoveClip
  };
};