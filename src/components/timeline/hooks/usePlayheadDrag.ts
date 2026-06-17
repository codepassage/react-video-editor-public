/**
 * 🎯 usePlayheadDrag.ts - 플레이헤드 드래그 제어 커스텀 훅
 * 
 * 타임라인에서 플레이헤드를 마우스로 드래그하여 정밀한 시간 제어를 제공하는 훅
 * Remotion Player와 실시간 동기화를 통해 부드러운 편집 경험 구현
 * 
 * 주요 기능:
 * - 마우스 위치 → 시간 변환 (픽셀 단위 정밀도)
 * - 드래그 중 실시간 Player 동기화
 * - 재생 상태 자동 관리 (드래그 시작 시 일시정지)
 * - 스크롤 오프셋 보정
 * - 드래그 완료 후 재생 상태 복원
 * 
 * 성능 최적화:
 * - useCallback으로 이벤트 핸들러 메모이제이션
 * - 프레임 단위 정확한 시간 계산
 * - 드래그 중 불필요한 상태 업데이트 최소화
 * 
 * 사용처:
 * - Timeline 컴포넌트의 플레이헤드 조작
 * - 정밀한 시간 편집이 필요한 모든 곳
 */

import { useCallback, useRef } from 'react';
import { useEditorStore } from '../../../store/editorStore';

interface UsePlayheadDragProps {
  containerRef: React.RefObject<HTMLDivElement>;    // 타임라인 컨테이너 ref (좌표 계산용)
  scrollLeft: number;                               // 현재 스크롤 오프셋
  totalDuration: number;                            // 프로젝트 총 길이 (초)
  zoom: number;                                     // 줌 레벨 (픽셀/초)
  isPlaying: boolean;                               // 현재 재생 상태
  setCurrentTime: (time: number) => void;           // 시간 설정 함수
  setIsPlaying: (playing: boolean) => void;         // 재생 상태 설정 함수
  setIsDraggingPlayhead: (dragging: boolean) => void; // 드래그 상태 설정 함수
  playerRef: any;                                   // Remotion Player ref
  projectSettings: any;                             // 프로젝트 설정 (fps 등)
}

export const usePlayheadDrag = ({
  containerRef,
  scrollLeft,
  totalDuration,
  zoom,
  isPlaying,
  setCurrentTime,
  setIsPlaying,
  setIsDraggingPlayhead,
  playerRef,
  projectSettings
}: UsePlayheadDragProps) => {
  
  /**
   * 마우스 X 좌표를 시간으로 변환
   * 스크롤 오프셋을 고려하여 정확한 시간 계산
   */
  const calculateTimeFromMouseX = useCallback((clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left + scrollLeft;  // 스크롤 오프셋 보정
    const time = Math.max(0, Math.min(totalDuration, x / zoom)); // 범위 제한
    return Math.round(time * 10) / 10; // 0.1초 단위로 스냅
  }, [containerRef, scrollLeft, totalDuration, zoom]);

  /**
   * 플레이어 위치를 실시간으로 업데이트
   * 드래그 중 즉시 피드백을 위한 프레임 단위 동기화
   */
  const updatePlayerPosition = useCallback((time: number) => {
    useEditorStore.getState().setPlayerRealTime(time);
    if (playerRef?.current) {
      const targetFrame = Math.round(time * projectSettings.fps); // 시간 → 프레임 변환
      try {
        playerRef.current.seekTo(targetFrame); // Remotion Player 동기화
      } catch (error) {
        console.warn('🚨 드래그 중 Player.seekTo 실패:', error);
      }
    }
  }, [playerRef, projectSettings.fps]);

  /**
   * 플레이헤드 드래그 시작 핸들러
   * 재생 상태 관리와 마우스 이벤트 리스너 등록
   */
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('🐭 플레이헤드 드래그 시작');

    e.preventDefault();
    e.stopPropagation();

    setIsDraggingPlayhead(true);
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      console.log('⏸️ 드래그 시작 - 재생 중지');
      setIsPlaying(false); // 드래그 중 재생 중지
    }

    // 드래그 중 마우스 이동 처리
    const handleMouseMove = (e: MouseEvent) => {
      const snappedTime = calculateTimeFromMouseX(e.clientX);
      console.log('🐭 드래그 이동:', snappedTime.toFixed(3) + 's');
      updatePlayerPosition(snappedTime); // 실시간 플레이어 동기화
    };

    // 드래그 완료 처리
    const handleMouseUp = () => {
      const playerRealTime = useEditorStore.getState().playerRealTime;
      console.log('🎯 드래그 완료:', playerRealTime.toFixed(3) + 's');

      setCurrentTime(playerRealTime); // 최종 시간 확정
      setIsDraggingPlayhead(false);

      // 재생 상태 복원 (약간의 지연으로 안정성 확보)
      if (wasPlaying) {
        setTimeout(() => setIsPlaying(true), 100);
      }

      // 이벤트 리스너 정리
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // 전역 마우스 이벤트 등록 (드래그 중 마우스가 컨테이너를 벗어나도 추적)
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [
    calculateTimeFromMouseX, 
    updatePlayerPosition, 
    isPlaying, 
    setCurrentTime, 
    setIsPlaying, 
    setIsDraggingPlayhead
  ]);

  return {
    handlePlayheadMouseDown,    // 플레이헤드 드래그 시작 핸들러
    calculateTimeFromMouseX,    // 마우스 위치 → 시간 변환 함수
    updatePlayerPosition        // 플레이어 위치 업데이트 함수
  };
};