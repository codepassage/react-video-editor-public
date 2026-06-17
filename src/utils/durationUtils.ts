/**
 * 편집시간 자동 계산 유틸리티
 */

export interface Track {
  clips: {
    endTime: number;
  }[];
}

/**
 * 클립 데이터를 기반으로 최적의 편집시간을 계산합니다.
 * @param tracksData 트랙 배열
 * @param bufferPercentage 여유분 비율 (기본값: 0.1 = 10%)
 * @param minBuffer 최소 여유분 (초, 기본값: 5초)
 * @param defaultDuration 클립이 없을 때 기본값 (초, 기본값: 60초)
 * @returns 계산된 편집시간 (초)
 */
export function calculateOptimalDuration(
  tracksData: Track[],
  bufferPercentage: number = 0.1,
  minBuffer: number = 5,
  defaultDuration: number = 60
): number {
  if (!tracksData || tracksData.length === 0) {
    console.log('📏 편집시간 계산: 트랙 데이터 없음, 기본값 사용:', defaultDuration);
    return defaultDuration;
  }

  // 모든 클립의 최대 endTime 계산
  const maxEndTime = Math.max(
    ...tracksData.flatMap(track => 
      (track.clips || []).map(clip => clip.endTime || 0)
    ),
    0
  );

  if (maxEndTime === 0) {
    console.log('📏 편집시간 계산: 클립 없음, 기본값 사용:', defaultDuration);
    return defaultDuration;
  }

  // 여유분 추가 (비율 또는 최소값 중 큰 값)
  const bufferTime = Math.max(maxEndTime * bufferPercentage, minBuffer);
  const optimalDuration = Math.ceil(maxEndTime + bufferTime);
  
  console.log('📏 편집시간 자동 계산:', {
    tracksCount: tracksData.length,
    totalClipsCount: tracksData.reduce((sum, track) => sum + (track.clips?.length || 0), 0),
    maxEndTime,
    bufferTime,
    optimalDuration
  });

  return optimalDuration;
}

/**
 * 프로젝트 설정에 편집시간을 자동으로 적용합니다.
 * @param projectSettings 기존 프로젝트 설정
 * @param tracksData 트랙 데이터
 * @returns 편집시간이 업데이트된 프로젝트 설정
 */
export function applyOptimalDuration(
  projectSettings: any,
  tracksData: Track[]
): any {
  const originalDuration = projectSettings.duration;
  const optimalDuration = calculateOptimalDuration(tracksData);
  
  const updatedSettings = {
    ...projectSettings,
    duration: optimalDuration
  };

  console.log('⚙️ 편집시간 자동 적용:', {
    originalDuration,
    calculatedDuration: optimalDuration,
    applied: updatedSettings.duration
  });

  return updatedSettings;
}