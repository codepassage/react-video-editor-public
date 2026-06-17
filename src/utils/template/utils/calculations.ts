/**
 * 📐 calculations.ts - 템플릿 계산 순수 함수들
 * 
 * 템플릿의 지속시간, 시간 조정 등을 처리하는 순수 함수들입니다.
 * 부작용이 없고 예측 가능한 결과를 반환하여 테스트하기 쉽습니다.
 * 
 * 주요 기능:
 * - 템플릿 전체 지속시간 계산
 * - 템플릿 시작시간 조정
 * - 수학적 계산 및 변환
 */

import type { TimelineTrack } from '../../../types';

/**
 * 템플릿의 전체 지속시간을 계산합니다
 * 
 * @param tracks 계산할 타임라인 트랙들
 * @returns 전체 지속시간 (초 단위)
 */
export const calculateTemplateDuration = (tracks: TimelineTrack[]): number => {
  if (!tracks || tracks.length === 0) {
    return 0;
  }

  const allClips = tracks.flatMap(track => track.clips);

  if (allClips.length === 0) {
    return 0;
  }

  const maxEndTime = Math.max(...allClips.map(clip => clip.endTime));

  console.log('📏 템플릿 길이 계산:', {
    totalClips: allClips.length,
    maxEndTime,
    duration: `${Math.floor(maxEndTime / 60)}:${(maxEndTime % 60).toString().padStart(2, '0')}`
  });

  return maxEndTime;
};

/**
 * 템플릿의 모든 클립 시작시간을 조정합니다
 * 
 * @param tracks 조정할 타임라인 트랙들
 * @param timeOffset 시간 오프셋 (초 단위, 양수는 뒤로, 음수는 앞으로)
 * @returns 시간이 조정된 새로운 트랙 배열
 */
export const adjustTemplateStartTime = (tracks: TimelineTrack[], timeOffset: number): TimelineTrack[] => {
  if (!tracks || tracks.length === 0) {
    return [];
  }

  console.log('⏰ 템플릿 시작시간 조정:', {
    originalTracks: tracks.length,
    timeOffset,
    direction: timeOffset >= 0 ? '뒤로 이동' : '앞으로 이동'
  });

  const adjustedTracks = tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => ({
      ...clip,
      startTime: clip.startTime + timeOffset,
      endTime: clip.endTime + timeOffset
    }))
  }));

  console.log('✅ 시간 조정 완료:', {
    adjustedClips: adjustedTracks.reduce((sum, track) => sum + track.clips.length, 0)
  });

  return adjustedTracks;
};