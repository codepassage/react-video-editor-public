/**
 * 🕒 durationUtils.ts - 재생시간 자동 조정 유틸리티
 * 
 * 전체 애플리케이션에서 재생시간을 자동으로 맞춰주는 표준 유틸리티 함수들을 제공합니다.
 * TimelineHeader.tsx의 기준을 따라 일관된 계산 방식을 사용합니다.
 */

import type { TimelineTrack, TimelineClip } from '../../../types';

/**
 * 🎯 모든 클립의 최대 종료 시간 계산 (표준 방식)
 * TimelineHeader.tsx와 동일한 계산 방식을 사용합니다.
 */
export const calculateMaxEndTime = (tracks: TimelineTrack[]): number => {
  const allClips: TimelineClip[] = tracks.flatMap(track => track.clips);
  
  const maxEndTime = Math.max(
    ...allClips.map(clip => clip.endTime || 0),
    0
  );
  
  return maxEndTime;
};

/**
 * 🎯 클립 배열에서 최대 종료 시간 계산 (표준 방식)
 * TimelineHeader.tsx와 동일한 계산 방식을 사용합니다.
 */
export const calculateMaxEndTimeFromClips = (allClips: TimelineClip[]): number => {
  const maxEndTime = Math.max(
    ...allClips.map(clip => clip.endTime || 0),
    0
  );
  
  return maxEndTime;
};

/**
 * 🎯 표준 재생시간 계산 (TimelineHeader.tsx 기준)
 * - 최대 종료 시간에서 Math.ceil 적용
 * - 버퍼 시간 없음 (기존 TimelineHeader 방식)
 */
export const calculateStandardDuration = (tracks: TimelineTrack[]): number => {
  const maxEndTime = calculateMaxEndTime(tracks);
  
  if (maxEndTime <= 0) {
    return 0;
  }
  
  // TimelineHeader.tsx와 동일한 계산 방식
  return Math.ceil(maxEndTime);
};

/**
 * 🎯 클립 배열에서 표준 재생시간 계산 (TimelineHeader.tsx 기준)
 */
export const calculateStandardDurationFromClips = (allClips: TimelineClip[]): number => {
  const maxEndTime = calculateMaxEndTimeFromClips(allClips);
  
  if (maxEndTime <= 0) {
    return 0;
  }
  
  // TimelineHeader.tsx와 동일한 계산 방식
  return Math.ceil(maxEndTime);
};

/**
 * 🔄 자동 재생시간 조정 (표준 방식)
 * 템플릿을 로딩한 후 마지막 클립에 맞춰 재생시간을 자동으로 조정합니다.
 * TimelineHeader.tsx와 동일한 계산 방식을 사용합니다.
 */
export const autoAdjustDurationForTemplate = async (
  tracks: TimelineTrack[],
  options: {
    silent?: boolean; // true면 확인 다이얼로그 없이 자동 조정
  } = {}
): Promise<number | null> => {
  const maxEndTime = calculateMaxEndTime(tracks);
  
  if (maxEndTime <= 0) {
    console.log('📝 클립이 없어서 재생시간을 조정할 수 없습니다.');
    return null;
  }
  
  // 표준 계산 방식 사용 (TimelineHeader.tsx 기준)
  const newDuration = Math.ceil(maxEndTime);
  
  try {
    if (options.silent) {
      // 자동 조정 (확인 없이)
      const { updateProjectSettings } = await import('../../../store/editorStore').then(m => m.useEditorStore.getState());
      updateProjectSettings({ duration: newDuration });
      
      console.log(`✅ 템플릿 로딩 후 편집 시간 자동 조정 (표준): ${maxEndTime.toFixed(2)}s → ${newDuration}s`);
      return newDuration;
    } else {
      // 확인 후 조정
      const { globalAlert } = await import('../../../utils/globalAlert');
      const confirmed = await globalAlert.confirm(
        `편집 시간을 ${newDuration}초로 변경하시겠습니까?\n(현재 마지막 클립 종료 시간: ${maxEndTime.toFixed(2)}초)`
      );
      
      if (confirmed) {
        const { updateProjectSettings } = await import('../../../store/editorStore').then(m => m.useEditorStore.getState());
        updateProjectSettings({ duration: newDuration });
        
        console.log(`✅ 편집 시간을 마지막 클립 시간에 맞춤 (표준): ${maxEndTime.toFixed(2)}s → ${newDuration}s`);
        return newDuration;
      }
    }
  } catch (error) {
    console.error('❌ 재생시간 조정 중 오류:', error);
  }
  
  return null;
};

/**
 * 🎯 템플릿 로딩 후 자동 재생시간 조정 (표준 방식)
 * 템플릿을 불러온 후 자동으로 재생시간을 조정합니다.
 */
export const autoAdjustDurationAfterTemplateLoad = async (
  tracks: TimelineTrack[]
): Promise<void> => {
  await autoAdjustDurationForTemplate(tracks, { 
    silent: true // 템플릿 로딩 시에는 자동으로 조정
  });
};