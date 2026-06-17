/**
 * 🎯 baseClips.ts - 기준 클립 및 앞커 시스템 타입 정의
 * 
 * 비디오 에디터의 핵심 기능 중 하나인 기준 트랙/클립 시스템을
 * 정의하는 파일입니다. 클립 간의 종속 관계를 설정하고 관리하여
 * 자동 동기화되는 타임라인 시스템을 구현합니다.
 * 
 * 주요 기능:
 * - 기준 클립(Base Clip) 시스템: 다른 클립들이 참조하는 기준점
 * - 앵커 포인트(Anchor Point): 클립 간 종속 관계 정의
 * - 확장된 앵커 시스템: 템플릿 그룹 및 번들 지원
 * - 자동 오프셋 계산: 종속 클립의 시간 자동 조정
 * - 시간 동기화: 기준 클립 변경 시 자동 업데이트
 * 
 * 기준 트랙 시스템:
 * - Base Track: 기준이 되는 특별한 트랙
 * - Base Clip: 기준 트랙에 위치한 클립들로 다른 클립들이 참조
 * - Regular Clip: 기준 클립에 종속되는 일반 클립
 * 
 * 앵커 포인트 시스템:
 * - 'start': 기준 클립의 시작점에 종속
 * - 'end': 기준 클립의 끝점에 종속
 * - offset: 기준점에서의 오프셋 (양수/음수 모두 가능)
 * 
 * 확장된 앵커 시스템:
 * - baseClipId: 기존 기준 클립 연결
 * - templateGroupId: 템플릿 그룹에 연결
 * - bundleId: 번들에 연결
 * - 다중 참조 지원 및 우선순위 처리
 * 
 * 사용 예시:
 * - 타임라인에 내레이션 오디오를 기준으로 비디오 자동 맞춤
 * - 텍스트 애니메이션이 언제 나타날지 자동 계산
 * - 배경 음악과 대화 오디오의 동기화
 * 
 * 관련 모듈:
 * - 1번 모듈: Timeline System (기준 트랙 비주얼 표시)
 * - 3번 모듈: Bundle System (번들 생성 시 자동 연결)
 * - 9번 모듈: Template System (템플릿 그룹 연결)
 * - clipAlignment.ts: 오프셋 재계산 로직
 */
import type { TimelineClip, TimelineTrack } from './core';
import { MIN_CLIP_DURATION } from './constants';

// === 기준트랙/클립 시스템 === //

// 종속 관계 (Anchor) 타입 - 확장된 버전
export interface AnchorPoint {
  baseClipId: string;
  anchorPoint: 'start' | 'end'; // 기준클립의 시작점 또는 끝점
  offset: number; // 초 단위, 양수/음수 모두 가능
}

// 확장된 앵커 포인트 - 템플릿 그룹과 번들 지원
export interface ExtendedAnchorPoint {
  // 기존 기준클립 연결
  baseClipId?: string;

  // 새로운 템플릿 그룹 연결
  templateGroupId?: string;

  // 새로운 번들 연결  
  bundleId?: string;

  // 공통 속성
  anchorPoint: 'start' | 'end';
  offset: number;
}

// 앵커 대상 타입
export type AnchorTarget = 'baseClip' | 'templateGroup' | 'bundle';

// 타입이 있는 앵커 포인트
export interface TypedAnchorPoint extends ExtendedAnchorPoint {
  targetType: AnchorTarget;
}

// 기준트랙 (BaseTrack) - 기존 TimelineTrack 확장
export interface BaseTrack extends TimelineTrack {
  isBaseTrack: true;
  baseClips: string[]; // 이 트랙에 포함된 기준클립 ID들
}

export type SourceData = 'text' | 'mediaUrl' | 'imageUrl';

export interface DynamicProperty {
  propertyName: string;
  sourceData: SourceData;
}

// 공통 클립 속성 정의
export interface ClipProperties {
  isBaseClip: boolean; // 기준클립 여부
  dynamicProperties: DynamicProperty[]
}

// 기준클립 종속성 확장
export interface BaseClipProperties extends ClipProperties {
}

// 일반클립 종속성 확장 - 확장된 앵커 지원
export interface RegularClipProperties extends ClipProperties {
  // 시작점 종속 관계 (기존 호환성)
  startAnchor?: AnchorPoint;
  // 끝점 종속 관계 (기존 호환성)
  endAnchor?: AnchorPoint;

  // 확장된 시작점 종속 관계
  startAnchorExtended?: ExtendedAnchorPoint;
  // 확장된 끝점 종속 관계
  endAnchorExtended?: ExtendedAnchorPoint;

  // 한쪽만 연결된 경우의 고정 길이
  staticDuration?: number;
}

// === 기준트랙/클립 시스템 유틸리티 함수들 === //

// 기준클립인지 확인
export const isBaseClip = (clip: TimelineClip): boolean => {
  return clip.baseClipProperties?.isBaseClip === true;
};

// 일반클립인지 확인
export const isRegularClip = (clip: TimelineClip): boolean => {
  return !isBaseClip(clip);
};

// 기준트랙인지 확인 
export const isBaseTrack = (track: TimelineTrack): track is BaseTrack => {
  return 'isBaseTrack' in track && (track as BaseTrack).isBaseTrack === true;
};

// 주어진 일반클립에 가장 가까운 기준클립 찾기
export const findClosestBaseClip = (
  regularClip: TimelineClip,
  allClips: TimelineClip[],
  preferDirection?: 'left' | 'right'
): TimelineClip | null => {
  const baseClips = allClips.filter(isBaseClip);

  if (baseClips.length === 0) return null;

  const regularClipCenter = regularClip.startTime + (regularClip.duration / 2);

  let closest = baseClips[0];
  let minDistance = Infinity;

  for (const baseClip of baseClips) {
    const baseClipCenter = baseClip.startTime + (baseClip.duration / 2);
    let distance = Math.abs(baseClipCenter - regularClipCenter);

    // 방향 선호도 고려
    if (preferDirection) {
      if (preferDirection === 'left' && baseClipCenter > regularClipCenter) {
        distance += 1000; // 패널티 추가
      } else if (preferDirection === 'right' && baseClipCenter < regularClipCenter) {
        distance += 1000; // 패널티 추가
      }
    }

    if (distance < minDistance) {
      minDistance = distance;
      closest = baseClip;
    }
  }

  return closest;
};

// 기준클립 과 오버랩 체크
export const checkBaseClipOverlap = (
  baseClips: TimelineClip[]
): boolean => {
  for (let i = 0; i < baseClips.length; i++) {
    for (let j = i + 1; j < baseClips.length; j++) {
      const clip1 = baseClips[i];
      const clip2 = baseClips[j];

      // 겹침 체크: 두 클립이 시간상 겹치는지 (경계에서 닿는 것은 허용)
      // 부동소수점 정밀도 문제를 위해 작은 여유값 사용
      const EPSILON = 0.0001;
      
      const clip1Start = clip1.startTime;
      const clip1End = clip1.endTime;
      const clip2Start = clip2.startTime;
      const clip2End = clip2.endTime;
      
      // 실제 겹침이 있는지 확인 (인접하거나 아주 작은 여유는 허용)
      const hasOverlap = (clip1Start < clip2End - EPSILON && clip1End > clip2Start + EPSILON);
      
      if (hasOverlap) {
        console.log('🔍 기준클립 겹침 감지:', {
          clip1: {
            id: clip1.id?.slice(-8) || 'unknown',
            시간: `${clip1Start.toFixed(3)}~${clip1End.toFixed(3)}`
          },
          clip2: {
            id: clip2.id?.slice(-8) || 'unknown', 
            시간: `${clip2Start.toFixed(3)}~${clip2End.toFixed(3)}`
          },
          겹침조건: {
            'clip1Start < clip2End - EPSILON': `${clip1Start.toFixed(3)} < ${(clip2End - EPSILON).toFixed(3)} = ${clip1Start < clip2End - EPSILON}`,
            'clip1End > clip2Start + EPSILON': `${clip1End.toFixed(3)} > ${(clip2Start + EPSILON).toFixed(3)} = ${clip1End > clip2Start + EPSILON}`
          }
        });
        return true; // 겹침 발견
      }
    }
  }
  return false; // 겹침 없음
};

// 종속 관계 설정
export const setClipAnchor = (
  clip: TimelineClip,
  baseClip: TimelineClip,
  anchorType: 'start' | 'end',
  anchorPoint: 'start' | 'end',
  offset: number = 0
): TimelineClip => {
  const anchor: AnchorPoint = {
    baseClipId: baseClip.id,
    anchorPoint,
    offset
  };

  const updatedClip = { ...clip };

  if (!updatedClip.regularClipProperties) {
    updatedClip.regularClipProperties = {};
  }

  if (anchorType === 'start') {
    updatedClip.regularClipProperties.startAnchor = anchor;
  } else {
    updatedClip.regularClipProperties.endAnchor = anchor;
  }

  return updatedClip;
};

// 종속 관계 기반 시간 계산
export const calculateAnchoredTime = (
  anchor: AnchorPoint,
  baseClip: TimelineClip
): number => {
  const baseTime = anchor.anchorPoint === 'start'
    ? baseClip.startTime
    : baseClip.endTime;

  return baseTime + anchor.offset;
};

// 확장된 앵커 대상의 시간 계산
export const calculateExtendedAnchoredTime = (
  anchor: ExtendedAnchorPoint,
  allClips: TimelineClip[],
  templateGroups: any[] = [],
  bundles: any[] = []
): number => {
  if (anchor.baseClipId) {
    // 기존 기준클립 로직
    const baseClip = allClips.find(c => c.id === anchor.baseClipId);
    if (baseClip) {
      return calculateAnchoredTime({
        baseClipId: anchor.baseClipId,
        anchorPoint: anchor.anchorPoint,
        offset: anchor.offset
      }, baseClip);
    }
  }

  if (anchor.templateGroupId) {
    // 템플릿 그룹 시간 계산
    const group = templateGroups.find(g => g.id === anchor.templateGroupId);
    if (group) {
      const baseTime = anchor.anchorPoint === 'start' ? group.startTime : group.endTime;
      return baseTime + anchor.offset;
    }
  }

  if (anchor.bundleId) {
    // 번들 시간 계산
    const bundle = bundles.find(b => b.id === anchor.bundleId);
    if (bundle) {
      const baseTime = anchor.anchorPoint === 'start' ? bundle.startTime : bundle.endTime;
      return baseTime + anchor.offset;
    }
  }

  return 0; // 기본값
};

// 일반클립의 동적 시간 계산 - 확장된 앵커 지원
export const calculateRegularClipTimesExtended = (
  clip: TimelineClip,
  allClips: TimelineClip[],
  templateGroups: any[] = [],
  bundles: any[] = []
): { startTime: number; endTime: number; duration: number } => {
  const properties = clip.regularClipProperties || {};

  // 효과적인 앵커 찾기 (확장된 버전 우선)
  const effectiveStartAnchor = getEffectiveStartAnchor(properties);
  const effectiveEndAnchor = getEffectiveEndAnchor(properties);

  let newStartTime = clip.startTime;
  let newEndTime = clip.endTime;

  // 시작점 종속 관계 처리
  if (effectiveStartAnchor) {
    newStartTime = calculateExtendedAnchoredTime(effectiveStartAnchor, allClips, templateGroups, bundles);
  }

  // 끝점 종속 관계 처리
  if (effectiveEndAnchor) {
    newEndTime = calculateExtendedAnchoredTime(effectiveEndAnchor, allClips, templateGroups, bundles);
  } else if (effectiveStartAnchor && properties.staticDuration) {
    // 시작점만 연결되고 정적 길이가 있는 경우
    newEndTime = newStartTime + properties.staticDuration;
  }

  const newDuration = newEndTime - newStartTime;

  return {
    startTime: newStartTime,
    endTime: newEndTime,
    duration: Math.max(newDuration, MIN_CLIP_DURATION)
  };
};

// 기존 함수와의 호환성 유지
export const calculateRegularClipTimes = (
  clip: TimelineClip,
  allClips: TimelineClip[]
): { startTime: number; endTime: number; duration: number } => {
  // 확장된 앵커가 있으면 확장된 계산 사용
  const properties = clip.regularClipProperties || {};
  if (properties.startAnchorExtended || properties.endAnchorExtended) {
    return calculateRegularClipTimesExtended(clip, allClips, [], []);
  }

  // 기존 로직
  const { startAnchor, endAnchor, staticDuration } = properties;

  let newStartTime = clip.startTime;
  let newEndTime = clip.endTime;

  // 시작점 종속 관계 처리
  if (startAnchor) {
    const baseClip = allClips.find(c => c.id === startAnchor.baseClipId);
    if (baseClip) {
      newStartTime = calculateAnchoredTime(startAnchor, baseClip);
    }
  }

  // 끝점 종속 관계 처리
  if (endAnchor) {
    const baseClip = allClips.find(c => c.id === endAnchor.baseClipId);
    if (baseClip) {
      newEndTime = calculateAnchoredTime(endAnchor, baseClip);
    }
  } else if (startAnchor && staticDuration) {
    // 시작점만 연결되고 정적 길이가 있는 경우
    newEndTime = newStartTime + staticDuration;
  }

  const newDuration = newEndTime - newStartTime;

  return {
    startTime: newStartTime,
    endTime: newEndTime,
    duration: Math.max(newDuration, MIN_CLIP_DURATION)
  };
};

// 기준클립 충돌 방지를 위한 유틸리티 함수 - 개선된 로직
export const getMaxMoveDistance = (
  baseClip: TimelineClip,
  allBaseClips: TimelineClip[],
  direction: 'left' | 'right',
  moveAmount: number
): number => {
  const otherBaseClips = allBaseClips.filter(clip => clip.id !== baseClip.id);

  if (otherBaseClips.length === 0) {
    return moveAmount; // 다른 기준클립이 없으면 제한 없음
  }

  let maxPossibleDistance = moveAmount;

  if (direction === 'left') {
    // 뒤로 이동: 다른 기준클립의 끝점과 충돌하지 않는 최대 거리
    for (const otherClip of otherBaseClips) {
      // 이동 후 위치가 다른 클립과 겹치는지 확인
      const newStartTime = baseClip.startTime - moveAmount;
      const newEndTime = baseClip.endTime - moveAmount;

      // 겹침 조건: (newStartTime < otherClip.endTime) && (newEndTime > otherClip.startTime)
      if (newStartTime < otherClip.endTime && newEndTime > otherClip.startTime) {
        // 충돌! 최대한 가까이 갈 수 있는 거리 계산
        const safeDistance = baseClip.startTime - otherClip.endTime;
        maxPossibleDistance = Math.min(maxPossibleDistance, Math.max(0, safeDistance));
      }
    }
  } else {
    // 앞으로 이동: 다른 기준클립의 시작점과 충돌하지 않는 최대 거리
    for (const otherClip of otherBaseClips) {
      // 이동 후 위치가 다른 클립과 겹치는지 확인
      const newStartTime = baseClip.startTime + moveAmount;
      const newEndTime = baseClip.endTime + moveAmount;

      // 겹침 조건: (newStartTime < otherClip.endTime) && (newEndTime > otherClip.startTime)
      if (newStartTime < otherClip.endTime && newEndTime > otherClip.startTime) {
        // 충돌! 최대한 가까이 갈 수 있는 거리 계산
        const safeDistance = otherClip.startTime - baseClip.endTime;
        maxPossibleDistance = Math.min(maxPossibleDistance, Math.max(0, safeDistance));
      }
    }
  }

  return Math.max(0, maxPossibleDistance); // 음수가 되지 않도록 보장
};

// === 확장된 앵커 시스템 유틸리티 함수들 === //

// 앵커 포인트 타입 확인 함수들
export const isBaseClipAnchor = (anchor: ExtendedAnchorPoint): boolean => {
  return !!anchor.baseClipId;
};

export const isTemplateGroupAnchor = (anchor: ExtendedAnchorPoint): boolean => {
  return !!anchor.templateGroupId;
};

export const isBundleAnchor = (anchor: ExtendedAnchorPoint): boolean => {
  return !!anchor.bundleId;
};

// 앵커 대상 타입 추출
export const getAnchorTargetType = (anchor: ExtendedAnchorPoint): AnchorTarget => {
  if (anchor.baseClipId) return 'baseClip';
  if (anchor.templateGroupId) return 'templateGroup';
  if (anchor.bundleId) return 'bundle';
  throw new Error('Invalid anchor point: no target specified');
};

// 앵커 대상 ID 추출
export const getAnchorTargetId = (anchor: ExtendedAnchorPoint): string => {
  if (anchor.baseClipId) return anchor.baseClipId;
  if (anchor.templateGroupId) return anchor.templateGroupId;
  if (anchor.bundleId) return anchor.bundleId;
  throw new Error('Invalid anchor point: no target specified');
};

// 기존 AnchorPoint를 ExtendedAnchorPoint로 마이그레이션
export const migrateAnchorPoint = (anchor: AnchorPoint): ExtendedAnchorPoint => {
  return {
    baseClipId: anchor.baseClipId,
    anchorPoint: anchor.anchorPoint,
    offset: anchor.offset
  };
};

// ExtendedAnchorPoint를 기존 AnchorPoint로 변환 (기준클립만)
export const convertToLegacyAnchor = (anchor: ExtendedAnchorPoint): AnchorPoint | null => {
  if (!anchor.baseClipId) return null;

  return {
    baseClipId: anchor.baseClipId,
    anchorPoint: anchor.anchorPoint,
    offset: anchor.offset
  };
};

// 두 앵커 포인트가 같은 위치인지 확인
export const isSameAnchorPosition = (
  anchor1: ExtendedAnchorPoint,
  anchor2: ExtendedAnchorPoint
): boolean => {
  return (
    getAnchorTargetId(anchor1) === getAnchorTargetId(anchor2) &&
    getAnchorTargetType(anchor1) === getAnchorTargetType(anchor2) &&
    anchor1.anchorPoint === anchor2.anchorPoint &&
    anchor1.offset === anchor2.offset
  );
};

// RegularClipProperties에서 사용 중인 앵커 찾기 (확장된 버전 우선)
export const getEffectiveStartAnchor = (properties?: RegularClipProperties): ExtendedAnchorPoint | null => {
  if (!properties) return null;

  // 확장된 앵커가 있으면 우선 사용
  if (properties.startAnchorExtended) {
    return properties.startAnchorExtended;
  }

  // 기존 앵커를 확장된 형태로 변환
  if (properties.startAnchor) {
    return migrateAnchorPoint(properties.startAnchor);
  }

  return null;
};

export const getEffectiveEndAnchor = (properties?: RegularClipProperties): ExtendedAnchorPoint | null => {
  if (!properties) return null;

  // 확장된 앵커가 있으면 우선 사용
  if (properties.endAnchorExtended) {
    return properties.endAnchorExtended;
  }

  // 기존 앵커를 확장된 형태로 변환
  if (properties.endAnchor) {
    return migrateAnchorPoint(properties.endAnchor);
  }

  return null;
};
