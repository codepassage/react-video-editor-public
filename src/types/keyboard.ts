/**
 * ⌨️ keyboard.ts - 키보드 단축키 및 클립 이동 시스템
 * 
 * React Video Editor v1의 키보드 단축키 시스템과 클립 정밀 이동 기능을
 * 제공하는 핵심 모듈입니다. 생산성 향상을 위한 고급 키보드 인터랙션을 지원합니다.
 * 
 * 🎯 주요 기능:
 * - 정밀한 클립 이동 및 정렬 시스템
 * - 확장된 앵커 포인트 기반 스냅 기능
 * - 크로스 플랫폼 키보드 단축키 지원
 * - 템플릿 그룹 및 번들과의 통합 이동
 * - 충돌 방지 및 경계 처리
 * - 타임헤드 정밀 제어
 * 
 * 🔧 키보드 단축키 체계:
 * ```
 * Option + ←/→     : 0.2초 단위 클립 이동
 * Option + W/E     : 1초 단위 클립 이동
 * Option + S/D     : 클립 시작점 앵커 이동
 * Option + X/C     : 클립 끝점 앵커 이동
 * ```
 * 
 * 📊 앵커 시스템 계층구조:
 * ```
 * 1. 독립 기준클립 (최우선)
 * 2. 템플릿 그룹 (번들에 포함되지 않은)
 * 3. 번들 (템플릿 그룹에 포함되지 않은)
 * ```
 * 
 * 🎬 사용 시나리오:
 * - 비디오 편집 중 클립 정밀 배치
 * - 오디오 동기화를 위한 정확한 타이밍 조정
 * - 템플릿 기반 자동 정렬
 * - 대용량 프로젝트에서의 빠른 편집
 * - 프로페셔널 워크플로우 지원
 * 
 * 🌍 크로스 플랫폼 지원:
 * - macOS: Option 키 (altKey, metaKey 모두 지원)
 * - Windows/Linux: Alt 키
 * - 입력 모드 무관 물리적 키 감지
 * - 키보드 레이아웃 독립적 동작
 * 
 * 🔗 연관 모듈:
 * - Timeline System: 시각적 피드백
 * - Base Clips System: 앵커 포인트 계산
 * - Template System: 그룹 기반 이동
 * - Bundle System: 번들 단위 처리
 * - Clip Alignment: 정렬 알고리즘
 * 
 * 💡 성능 최적화:
 * - 지연 평가를 통한 앵커 포인트 계산
 * - 메모이제이션된 충돌 검사
 * - 효율적인 정렬 알고리즘 (O(n log n))
 * - 경계 조건 조기 검출
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 2.0
 */

import type { TimelineClip } from './core';
import type { TemplateGroup } from './templates';
import type { Bundle } from './bundles';
import { 
  isBaseClip, 
  getMaxMoveDistance, 
  ExtendedAnchorPoint,
  getAnchorTargetType,
  getAnchorTargetId,
  isSameAnchorPosition
} from './baseClips';
import { MIN_CLIP_DURATION } from './constants';

// === 일반클립 이동 키보드 단축키 시스템 === //

/**
 * 클립 이동 작업을 위한 옵션 인터페이스
 * 
 * @interface ClipMovementOptions
 * @description 키보드 단축키를 통한 클립 이동 작업에 필요한 모든 옵션을 정의합니다.
 * 확장된 앵커 시스템을 지원하여 템플릿 그룹과 번들을 포함한 복잡한 이동을 처리합니다.
 */
export interface ClipMovementOptions {
  /** 이동할 클립들의 ID 배열 */
  selectedClipIds: string[];
  
  /** 전체 타임라인 클립 목록 (충돌 검사 및 앵커 계산용) */
  allClips: TimelineClip[];
  
  /** 템플릿 그룹 목록 (확장된 앵커 시스템용) */
  templateGroups?: TemplateGroup[];
  
  /** 번들 목록 (확장된 앵커 시스템용) */
  bundles?: Bundle[];
  
  /** 앵커 타입: 클립의 시작점 또는 끝점 기준 이동 */
  anchorType: 'start' | 'end';
  
  /** 이동 방향: 타임라인 상의 좌측 또는 우측 */
  direction: 'left' | 'right';
}

/**
 * 타임헤드 이동 작업을 위한 옵션 인터페이스
 * 
 * @interface TimeMovementOptions
 * @description 타임헤드(재생 위치 표시자)의 정밀한 이동을 위한 옵션을 정의합니다.
 * 기준클립과의 충돌 방지 기능을 포함합니다.
 */
export interface TimeMovementOptions {
  /** 현재 타임헤드 위치 (초 단위) */
  currentTime: number;
  
  /** 이동 방향: 타임라인 상의 좌측 또는 우측 */
  direction: 'left' | 'right';
  
  /** 이동할 시간 간격 (0.2초 또는 1초 등) */
  amount: number;
  
  /** 기준클립 충돌 방지를 위한 전체 클립 목록 (선택적) */
  allClips?: TimelineClip[];
}

/**
 * 클립 이동 작업의 결과 인터페이스
 * 
 * @interface ClipMovementResult
 * @description 클립 이동 작업의 성공 여부와 결과 데이터를 담는 객체입니다.
 */
export interface ClipMovementResult {
  /** 이동 작업의 성공 여부 */
  success: boolean;
  
  /** 이동된 클립들의 업데이트된 상태 */
  updatedClips: TimelineClip[];
  
  /** 작업 결과에 대한 사용자 메시지 (선택적) */
  message?: string;
}

/**
 * 타임헤드 이동 작업의 결과 인터페이스
 * 
 * @interface TimeMovementResult
 * @description 타임헤드 이동 작업의 성공 여부와 새로운 위치를 담는 객체입니다.
 */
export interface TimeMovementResult {
  /** 이동 작업의 성공 여부 */
  success: boolean;
  
  /** 이동 후 새로운 타임헤드 위치 (초 단위) */
  newTime: number;
  
  /** 작업 결과에 대한 사용자 메시지 (선택적) */
  message?: string;
}

/**
 * 클립이 템플릿 그룹에 포함되어 있는지 확인
 * 
 * @param clipId - 확인할 클립의 ID
 * @param templateGroups - 템플릿 그룹 목록
 * @returns 포함되어 있으면 true, 그렇지 않으면 false
 */
const isClipInTemplateGroup = (clipId: string, templateGroups: TemplateGroup[]): boolean => {
  return templateGroups.some(group => group.clipIds.includes(clipId));
};

/**
 * 클립이 번들에 포함되어 있는지 확인
 * 
 * @param clipId - 확인할 클립의 ID
 * @param bundles - 번들 목록
 * @returns 포함되어 있으면 true, 그렇지 않으면 false
 */
const isClipInBundle = (clipId: string, bundles: Bundle[]): boolean => {
  return bundles.some(bundle => bundle.baseClipIds.includes(clipId));
};

/**
 * 템플릿 그룹이 번들에 포함되어 있는지 확인
 * 
 * @param groupId - 확인할 템플릿 그룹의 ID
 * @param bundles - 번들 목록
 * @returns 포함되어 있으면 true, 그렇지 않으면 false
 */
const isTemplateGroupInBundle = (groupId: string, bundles: Bundle[]): boolean => {
  return bundles.some(bundle => bundle.templateGroupIds.includes(groupId));
};

/**
 * 번들이 템플릿 그룹에 완전히 포함되어 있는지 확인
 * 
 * @param bundle - 확인할 번들
 * @param templateGroups - 템플릿 그룹 목록
 * @returns 완전히 포함되어 있으면 true, 그렇지 않으면 false
 * 
 * @description
 * 번들의 모든 기준클립이 특정 템플릿 그룹에 속하는지 확인합니다.
 * 부분적 포함이 아닌 완전한 포함만을 true로 판단합니다.
 */
const isBundleInTemplateGroup = (bundle: Bundle, templateGroups: TemplateGroup[]): boolean => {
  // 번들에 속한 모든 클립이 특정 템플릿 그룹에 속하는지 확인
  if (!bundle.baseClipIds || bundle.baseClipIds.length === 0) return false;
  
  return templateGroups.some(group => {
    // 번들의 모든 기준클립이 이 템플릿 그룹에 속하는지 확인
    return bundle.baseClipIds.every(clipId => group.clipIds.includes(clipId));
  });
};

/**
 * 계층 필터링이 적용된 확장된 앵커 포인트 수집
 * 
 * @function getAllAnchorPoints
 * @param baseClips - 기준클립 목록
 * @param templateGroups - 템플릿 그룹 목록 (선택적)
 * @param bundles - 번들 목록 (선택적)
 * @returns 정렬된 앵커 포인트 배열
 * 
 * @description
 * 중복을 방지하고 계층 구조를 고려하여 앵커 포인트를 수집합니다.
 * 
 * 📊 수집 우선순위:
 * 1. 독립적인 기준클립 (그룹/번들에 속하지 않은)
 * 2. 번들에 포함되지 않은 템플릿 그룹
 * 3. 템플릿 그룹에 포함되지 않은 번들
 * 
 * 이 방식으로 중복된 앵커 포인트를 방지하고 논리적 계층 구조를 유지합니다.
 */
export const getAllAnchorPoints = (
  baseClips: TimelineClip[],
  templateGroups: TemplateGroup[] = [],
  bundles: Bundle[] = []
): { time: number; targetId: string; targetType: 'baseClip' | 'templateGroup' | 'bundle'; point: 'start' | 'end' }[] => {
  const allAnchorPoints: { time: number; targetId: string; targetType: 'baseClip' | 'templateGroup' | 'bundle'; point: 'start' | 'end' }[] = [];
  
  
  // 1. 독립적인 기준클립만 추가 (템플릿 그룹이나 번들에 포함되지 않은 것)
  baseClips.forEach(baseClip => {
    const inTemplateGroup = isClipInTemplateGroup(baseClip.id, templateGroups);
    const inBundle = isClipInBundle(baseClip.id, bundles);
    
    
    // 템플릿 그룹이나 번들에 포함된 클립은 제외
    if (!inTemplateGroup && !inBundle) {
      allAnchorPoints.push(
        { time: baseClip.startTime, targetId: baseClip.id, targetType: 'baseClip', point: 'start' },
        { time: baseClip.endTime, targetId: baseClip.id, targetType: 'baseClip', point: 'end' }
      );
    }
  });
  
  // 2. 번들에 포함되지 않은 템플릿 그룹만 추가
  templateGroups.forEach(group => {
    if (!isTemplateGroupInBundle(group.id, bundles)) {
      allAnchorPoints.push(
        { time: group.startTime, targetId: group.id, targetType: 'templateGroup', point: 'start' },
        { time: group.endTime, targetId: group.id, targetType: 'templateGroup', point: 'end' }
      );
    }
  });
  
  // 3. 템플릿 그룹에 포함되지 않은 번들만 추가
  bundles.forEach(bundle => {
    const inTemplateGroup = isBundleInTemplateGroup(bundle, templateGroups);
    
    
    if (!inTemplateGroup) {
      allAnchorPoints.push(
        { time: bundle.startTime, targetId: bundle.id, targetType: 'bundle', point: 'start' },
        { time: bundle.endTime, targetId: bundle.id, targetType: 'bundle', point: 'end' }
      );
    }
  });
  
  return allAnchorPoints.sort((a, b) => a.time - b.time);
};

// 일반클립을 확장된 앵커에 맞춰 이동 - 템플릿 그룹과 번들 지원
export const moveRegularClipToAnchor = (
  options: ClipMovementOptions
): ClipMovementResult => {
  const { selectedClipIds, allClips, templateGroups = [], bundles = [], anchorType, direction } = options;

  if (selectedClipIds.length === 0) {
    return {
      success: false,
      updatedClips: [],
      message: '선택된 클립이 없습니다.'
    };
  }

  const updatedClips: TimelineClip[] = [];

  for (const clipId of selectedClipIds) {
    const clip = allClips.find(c => c.id === clipId);
    if (!clip || isBaseClip(clip)) {
      continue; // 기준클립은 이동하지 않음
    }

    // 🎯 순차 이동 중심 알고리즘: 모든 기준점을 개별적으로 고려
    const baseClips = allClips.filter(isBaseClip);
    if (baseClips.length === 0) {
      continue;
    }

    // 현재 클립의 기준점 (시작점 또는 끝점)
    const clipReferencePoint = anchorType === 'start' ? clip.startTime : clip.endTime;

    // 🚀 핵심 개선: 확장된 앵커 포인트 수집 (기준클립 + 템플릿 그룹 + 번들)
    const allAnchorPoints = getAllAnchorPoints(baseClips, templateGroups, bundles);

    // 현재 위치와 정확히 같은 지점 제외 (연속 이동을 위해)
    const tolerance = 0.01; // 부동소수점 오차 허용
    const availablePoints = allAnchorPoints.filter(point =>
      Math.abs(point.time - clipReferencePoint) > tolerance
    );

    if (availablePoints.length === 0) {
      continue; // 이동할 수 있는 지점이 없음
    }

    let targetPoint: { time: number; targetId: string; targetType: 'baseClip' | 'templateGroup' | 'bundle'; point: 'start' | 'end' } | null = null;

    if (direction === 'left') {
      // ← 방향: 현재 위치보다 왼쪽에 있는 점들 중 가장 가까운(큰) 것
      const leftPoints = availablePoints.filter(point => point.time < clipReferencePoint);

      if (leftPoints.length > 0) {
        // 왼쪽 점들 중 가장 오른쪽(가까운) 점 선택
        targetPoint = leftPoints[leftPoints.length - 1];
      } else {
        // 🛡️ 경계 처리 개선: 왼쪽에 더 이상 이동할 지점이 없으면 이동하지 않음
        console.log('🛑 왼쪽 경계 도달:', {
          clipId: clipId.slice(-8),
          현재위치: clipReferencePoint.toFixed(2),
          메시지: '더 이상 왼쪽으로 이동할 수 없습니다'
        });
        continue; // 이 클립은 이동하지 않고 다음 클립으로
      }
    } else {
      // → 방향: 현재 위치보다 오른쪽에 있는 점들 중 가장 가까운(작은) 것
      const rightPoints = availablePoints.filter(point => point.time > clipReferencePoint);

      if (rightPoints.length > 0) {
        // 오른쪽 점들 중 가장 왼쪽(가까운) 점 선택
        targetPoint = rightPoints[0];
      } else {
        // 🛡️ 경계 처리 개선: 오른쪽에 더 이상 이동할 지점이 없으면 이동하지 않음
        console.log('🛑 오른쪽 경계 도달:', {
          clipId: clipId.slice(-8),
          현재위치: clipReferencePoint.toFixed(2),
          메시지: '더 이상 오른쪽으로 이동할 수 없습니다'
        });
        continue; // 이 클립은 이동하지 않고 다음 클립으로
      }
    }

    // targetPoint가 null이면 이동하지 않음
    if (!targetPoint) {
      continue;
    }

    const targetTime = targetPoint.time;

    // 클립 복사 및 위치 업데이트
    const updatedClip = { ...clip };

    if (anchorType === 'start') {
      // 시작점 이동: 길이 유지하면서 시작점을 대상 위치로
      const duration = clip.duration;
      updatedClip.startTime = targetTime;
      updatedClip.endTime = targetTime + duration;
    } else {
      // 끝점 이동: 길이 유지하면서 끝점을 대상 위치로
      const duration = clip.duration;
      updatedClip.endTime = targetTime;
      updatedClip.startTime = targetTime - duration;
    }

    // 길이 재계산
    updatedClip.duration = updatedClip.endTime - updatedClip.startTime;

    // 유효성 검사
    if (updatedClip.duration < MIN_CLIP_DURATION) {
      updatedClip.duration = MIN_CLIP_DURATION;
      if (anchorType === 'start') {
        updatedClip.endTime = updatedClip.startTime + MIN_CLIP_DURATION;
      } else {
        updatedClip.startTime = updatedClip.endTime - MIN_CLIP_DURATION;
      }
    }

    // 시작 시간이 음수가 되지 않도록 보장
    if (updatedClip.startTime < 0) {
      const adjustment = -updatedClip.startTime;
      updatedClip.startTime = 0;
      updatedClip.endTime += adjustment;
    }

    // 🔗 핵심 수정: 확장된 연결관계 설정
    if (!updatedClip.regularClipProperties) {
      updatedClip.regularClipProperties = {
        isBaseClip: false,
        // 🔄 dynamicProperties 보존 (baseClipProperties에서)
        dynamicProperties: updatedClip.baseClipProperties?.dynamicProperties || []
      };
    }

    // 확장된 앵커 포인트 생성
    const newExtendedAnchor: ExtendedAnchorPoint = {
      anchorPoint: targetPoint.point,
      offset: 0 // 정확히 기준점에 맞춤
    };

    // 대상 타입에 따라 적절한 ID 설정
    if (targetPoint.targetType === 'baseClip') {
      newExtendedAnchor.baseClipId = targetPoint.targetId;
    } else if (targetPoint.targetType === 'templateGroup') {
      newExtendedAnchor.templateGroupId = targetPoint.targetId;
    } else if (targetPoint.targetType === 'bundle') {
      newExtendedAnchor.bundleId = targetPoint.targetId;
    }

    // 🚫 중복 연결 방지: 시작점과 끝점이 같은 위치에 연결되는 것을 방지
    const { 
      startAnchor: existingStartAnchor, 
      endAnchor: existingEndAnchor,
      startAnchorExtended: existingStartAnchorExtended,
      endAnchorExtended: existingEndAnchorExtended
    } = updatedClip.regularClipProperties;

    // 연결 타입에 따라 앵커 설정 및 중복 제거
    if (anchorType === 'start') {
      // 확장된 시작점 앵커 설정
      updatedClip.regularClipProperties.startAnchorExtended = newExtendedAnchor;

      // 🛡️ 중복 방지: 끝점이 같은 위치에 연결되어 있으면 제거
      if (existingEndAnchorExtended && isSameAnchorPosition(newExtendedAnchor, existingEndAnchorExtended)) {
        console.log('🚫 중복 연결 감지 - 기존 확장된 끝점 연결 제거:', {
          clipId: clip.id.slice(-8),
          '새시작점': `${getAnchorTargetId(newExtendedAnchor).slice(-8)}.${newExtendedAnchor.anchorPoint}`,
          '새타입': getAnchorTargetType(newExtendedAnchor),
          '제거이유': '시작점과 끝점이 같은 위치에 연결됨'
        });
        delete updatedClip.regularClipProperties.endAnchorExtended;
      }

      // 기존 레거시 앵커와의 충돌도 확인
      if (existingEndAnchor && targetPoint.targetType === 'baseClip' && 
          existingEndAnchor.baseClipId === targetPoint.targetId &&
          existingEndAnchor.anchorPoint === targetPoint.point) {
        console.log('🚫 중복 연결 감지 - 기존 레거시 끝점 연결 제거');
        delete updatedClip.regularClipProperties.endAnchor;
      }
    } else {
      // 확장된 끝점 앵커 설정
      updatedClip.regularClipProperties.endAnchorExtended = newExtendedAnchor;

      // 🛡️ 중복 방지: 시작점이 같은 위치에 연결되어 있으면 제거
      if (existingStartAnchorExtended && isSameAnchorPosition(newExtendedAnchor, existingStartAnchorExtended)) {
        console.log('🚫 중복 연결 감지 - 기존 확장된 시작점 연결 제거:', {
          clipId: clip.id.slice(-8),
          '새끝점': `${getAnchorTargetId(newExtendedAnchor).slice(-8)}.${newExtendedAnchor.anchorPoint}`,
          '새타입': getAnchorTargetType(newExtendedAnchor),
          '제거이유': '시작점과 끝점이 같은 위치에 연결됨'
        });
        delete updatedClip.regularClipProperties.startAnchorExtended;
      }

      // 기존 레거시 앵커와의 충돌도 확인
      if (existingStartAnchor && targetPoint.targetType === 'baseClip' && 
          existingStartAnchor.baseClipId === targetPoint.targetId &&
          existingStartAnchor.anchorPoint === targetPoint.point) {
        console.log('🚫 중복 연결 감지 - 기존 레거시 시작점 연결 제거');
        delete updatedClip.regularClipProperties.startAnchor;
      }
    }

    updatedClips.push(updatedClip);
  }

  return {
    success: updatedClips.length > 0,
    updatedClips,
    message: updatedClips.length > 0
      ? `${updatedClips.length}개 클립이 확장된 앵커로 순차 이동되었습니다.`
      : '이동할 수 있는 클립이 없습니다.'
  };
};

// 기존 함수와의 호환성을 위한 래퍼 함수
export const moveRegularClipToBaseClip = (
  options: ClipMovementOptions
): ClipMovementResult => {
  return moveRegularClipToAnchor(options);
};

// 타임헤드 이동 함수 (기준클립 충돌 방지 포함) - 새로 추가
export const moveTimeHead = (
  options: TimeMovementOptions
): TimeMovementResult => {
  const { currentTime, direction, amount, allClips } = options;

  let deltaTime = direction === 'left' ? -amount : amount;
  let newTime = currentTime + deltaTime;

  // allClips가 있고 기준클립이 있으면 충돌 방지 처리
  if (allClips && allClips.length > 0) {
    // 현재 시간에 있는 기준클립 찾기
    const currentBaseClip = allClips.find(clip =>
      isBaseClip(clip) &&
      currentTime >= clip.startTime &&
      currentTime <= clip.endTime
    );

    if (currentBaseClip) {
      const allBaseClips = allClips.filter(isBaseClip);
      const maxDistance = getMaxMoveDistance(currentBaseClip, allBaseClips, direction, amount);

      if (maxDistance < amount) {
        // 충돌이 예상되므로 최대 가능한 거리만 이동
        deltaTime = direction === 'left' ? -maxDistance : maxDistance;
        newTime = currentTime + deltaTime;

        console.log('🛡️ 기준클립 충돌 방지:', {
          originalAmount: amount,
          maxDistance,
          clippedMovement: deltaTime,
          '제한적용': true
        });
      }
    }
  }

  // 0보다 작아지지 않도록 보장
  newTime = Math.max(0, newTime);

  const wasClipped = allClips && Math.abs(deltaTime) < amount;

  return {
    success: true,
    newTime,
    message: `타임헤드 ${Math.abs(deltaTime).toFixed(1)}초 ${direction === 'left' ? '뒤로' : '앞으로'} 이동${wasClipped ? ' (기준클립 충돌 방지)' : ''}`
  };
};

// 새로운 2키 조합 키보드 단축키 시스템
export class KeyboardShortcutManager {
  reset() {
    // 상태 초기화 (필요시)
  }

  // 2키 조합 감지 및 처리 - 모든 키가 클립 이동
  handleKeyDown(event: KeyboardEvent): {
    type: 'clip-move-0.2s' | 'clip-move-1s' | 'clip-start' | 'clip-end';
    direction: 'left' | 'right';
  } | null {
    const { key, altKey, ctrlKey, shiftKey, metaKey } = event;

    console.log('🎯 KeyboardShortcutManager.handleKeyDown 호출:', {
      key,
      altKey,
      metaKey,
      ctrlKey,
      shiftKey,
      platform: navigator.platform
    });

    // 🍎 Mac OS 호환성 강화: 여러 방식으로 Option 키 감지
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
      /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ||
      navigator.platform === 'MacIntel';

    console.log('🔍 플랫폼 감지 결과:', {
      'navigator.platform': navigator.platform,
      'navigator.userAgent': navigator.userAgent.substring(0, 50) + '...',
      isMac
    });

    // Option 키 감지 (Mac에서는 더 관대하게)
    let isOptionKey = false;

    if (isMac) {
      // Mac에서는 altKey 또는 metaKey 중 하나라도 true면 Option으로 인식
      isOptionKey = altKey || metaKey;
      console.log('🍎 Mac OS Option 키 감지:', { altKey, metaKey, isOptionKey });
    } else {
      // Windows/Linux에서는 altKey만 사용
      isOptionKey = altKey;
      console.log('🖥️ Windows/Linux Alt 키 감지:', { altKey, isOptionKey });
    }

    // Option 키 조건 검사 (더 관대하게)
    if (!isOptionKey) {
      console.log('❌ Option 키가 눌려지지 않음:', {
        isOptionKey,
        altKey,
        metaKey,
        isMac,
        '필요': 'Option 키(또는 Alt 키) 필요'
      });
      return null;
    }

    // 다른 제어키와 함께 눌렸는지 경고만 (차단하지는 않음)
    if (ctrlKey || shiftKey) {
      console.log('⚠️ 다른 제어키와 함께 눌렸지만 처리 계속:', {
        ctrlKey,
        shiftKey,
        '경고': '다른 제어키와 함께 사용하면 예상치 못한 동작 가능'
      });
    }

    console.log('✅ Option 키 조건 만족! 키 조합 처리 시작:', {
      'event.key': key,
      'event.code': event.code,
      '입력모드무관': '물리적 키 위치로 판단'
    });

    // 2키 조합 처리 (입력 모드와 무관한 event.code 사용)
    switch (event.code) {
      // === 모든 키가 클립 이동 === //

      // 클립 직접 이동: Option + ←/→ (0.2초씩)
      case 'ArrowLeft':
        return { type: 'clip-move-0.2s', direction: 'left' };
      case 'ArrowRight':
        return { type: 'clip-move-0.2s', direction: 'right' };

      // 클립 직접 이동: Option + W/E (1초씩)
      case 'KeyW':
        return { type: 'clip-move-1s', direction: 'left' };
      case 'KeyE':
        return { type: 'clip-move-1s', direction: 'right' };

      // === 클립 기준점 정렬 이동 === //

      // 클립 시작점 이동: Option + S/D
      case 'KeyS':
        return { type: 'clip-start', direction: 'left' };
      case 'KeyD':
        return { type: 'clip-start', direction: 'right' };

      // 클립 끝점 이동: Option + X/C
      case 'KeyX':
        return { type: 'clip-end', direction: 'left' };
      case 'KeyC':
        return { type: 'clip-end', direction: 'right' };

      default:
        console.log('❌ 매치되는 키 조합 없음:', {
          'event.key': key,
          'event.code': event.code,
          '지원키': 'ArrowLeft, ArrowRight, KeyW, KeyE, KeyS, KeyD, KeyX, KeyC (모든 키가 클립 이동)'
        });
        return null;
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    // 필요시 추가 처리
  }
}
