/**
 * 👁️ preview.ts - 템플릿 미리보기 생성 순수 함수들
 * 
 * 템플릿의 메타데이터와 미리보기 정보를 생성하는 순수 함수들입니다.
 * 부작용이 없고 예측 가능한 결과를 반환하여 테스트하기 쉽습니다.
 * 
 * 주요 기능:
 * - 템플릿 미리보기 데이터 생성
 * - 클립 타입별 통계 정보
 * - 트랙 정보 요약
 */

import type { TimelineTrack } from '../../../types';
import { calculateTemplateDuration } from './calculations';

/**
 * 템플릿 미리보기 데이터 인터페이스
 */
export interface TemplatePreview {
  duration: number;
  totalClips: number;
  totalTracks: number;
  clipTypes: string[];
  trackInfo: Array<{
    type: string;
    count: number;
  }>;
}

/**
 * 템플릿 미리보기 데이터를 생성합니다
 * 
 * @param template 미리보기를 생성할 템플릿
 * @returns 템플릿 미리보기 데이터
 */
export const generateTemplatePreview = (template: { tracks: TimelineTrack[] }): TemplatePreview => {
  const { tracks } = template;
  
  // 기본 통계 계산
  const duration = calculateTemplateDuration(tracks);
  const totalClips = tracks.reduce((sum, track) => sum + track.clips.length, 0);
  const totalTracks = tracks.length;

  // 클립 타입별 통계
  const allClips = tracks.flatMap(track => track.clips);
  const clipTypesSet = new Set(allClips.map(clip => clip.mediaType));
  const clipTypes = Array.from(clipTypesSet);

  // 트랙 정보 요약
  const trackTypeMap = new Map<string, number>();
  tracks.forEach(track => {
    // 트랙의 주요 클립 타입을 기준으로 분류
    const trackClipTypes = track.clips.map(clip => clip.mediaType);
    const primaryType = trackClipTypes.length > 0 ? trackClipTypes[0] : 'empty';
    trackTypeMap.set(primaryType, (trackTypeMap.get(primaryType) || 0) + 1);
  });

  const trackInfo = Array.from(trackTypeMap.entries()).map(([type, count]) => ({
    type,
    count
  }));

  return {
    duration,
    totalClips,
    totalTracks,
    clipTypes,
    trackInfo
  };
};