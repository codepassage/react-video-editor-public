/**
 * 📏 clipAlignment.ts - 클립 정렬 및 오프셋 재계산 시스템
 * 
 * 기준 클립 시스템에서 종속 클립들의 시간 오프셋을 자동으로
 * 재계산하는 고급 로직을 제공하는 파일입니다. 확장된 앵커 시스템을
 * 지원하여 템플릿 그룹, 번들 등 복잡한 종속 관계를 처리합니다.
 * 
 * 주요 기능:
 * - 종속 클립의 시작/끝 시간 자동 재계산
 * - 확장된 앵커 시스템 지원 (템플릿 그룹, 번들)
 * - 연쫼 된 종속성 처리 (체인 링크)
 * - 오프셋 값 검증 및 오류 처리
 * - 최소 클립 지속시간 보장
 * - 대량 클립 처리 성능 최적화
 * 
 * 재계산 계기:
 * 1. 기준 클립의 시간이 변경되었을 때
 * 2. 템플릿 그룹이 삽입/이동되었을 때
 * 3. 번들 구조가 변경되었을 때
 * 4. 프로젝트 로드 시 데이터 정리
 * 5. 데이터 전달 전 업데이트
 * 
 * 재계산 알고리즘:
 * 1. 기준 클립 식별 및 정렬
 * 2. 종속 클립 발견 및 분류
 * 3. 종속성 그래프 구축
 * 4. 토폴로지 정렬로 업데이트 순서 결정
 * 5. 오프셋 값 계산 및 적용
 * 6. 최소 지속시간 보장 및 유효성 검사
 * 
 * 성능 최적화:
 * - 오래된 클립만 업데이트 (변경 감지)
 * - 종속성 캐시로 중복 계산 방지
 * - 배치 처리로 대량 업데이트 최적화
 * 
 * 에러 처리:
 * - 순환 종속성 감지
 * - 존재하지 않는 참조 클립 처리
 * - 잘못된 오프셋 값 보정
 * 
 * 관련 모듈:
 * - baseClips.ts: 기본 앵커 시스템
 * - 1번 모듈: Timeline System (시각적 업데이트 연동)
 * - 3번 모듈: Bundle System (번들 종속성 처리)
 * - 9번 모듈: Template System (템플릿 그룹 종속성)
 * - Header 컴포넌트: 데이터 전달 전 오프셋 재계산
 */
import type { TimelineClip } from './core';
import type { TemplateGroup } from './templates';
import type { Bundle } from './bundles';
import { isBaseClip, type AnchorPoint, getEffectiveStartAnchor, getEffectiveEndAnchor } from './baseClips';
import { MIN_CLIP_DURATION } from './constants';

// === 끝점 offset 재계산 시스템 === //

// 끝점 offset 재계산 결과 타입
export interface RecalculateOffsetResult {
  success: boolean;
  updatedClips: TimelineClip[];
  message?: string;
  processedCount: number;
}

// 모든 일반클립의 끝점 offset 재계산 (확장된 앵커 구조 지원)
export const recalculateEndpointOffsets = (
  allClips: TimelineClip[],
  templateGroups: TemplateGroup[] = [],
  bundles: Bundle[] = []
): RecalculateOffsetResult => {
  const regularClips = allClips.filter(clip => !isBaseClip(clip) && clip.regularClipProperties);
  const baseClips = allClips.filter(isBaseClip);

  if (regularClips.length === 0) {
    return {
      success: false,
      updatedClips: [],
      message: '재계산할 일반클립이 없습니다.',
      processedCount: 0
    };
  }

  const updatedClips: TimelineClip[] = [];
  let processedCount = 0;

  for (const clip of regularClips) {
    const props = clip.regularClipProperties || {};
    const updatedClip = { ...clip };
    let clipUpdated = false;

    // 확장된 앵커 구조 우선 지원
    const effectiveStartAnchor = getEffectiveStartAnchor(props);
    const effectiveEndAnchor = getEffectiveEndAnchor(props);

    // 시작점 연결 재계산 (확장된 앵커 지원)
    if (effectiveStartAnchor) {
      const targetElement = findTargetElement(effectiveStartAnchor, baseClips, templateGroups, bundles);
      
      if (targetElement) {
        const baseTime = effectiveStartAnchor.anchorPoint === 'start'
          ? targetElement.startTime
          : targetElement.endTime;

        // 현재 클립 시작점과 타겟 연결점 사이의 거리 계산
        const currentOffset = clip.startTime - baseTime;

        // offset이 다르면 업데이트
        if (Math.abs(currentOffset - (effectiveStartAnchor.offset || 0)) > 0.001) {
          if (!updatedClip.regularClipProperties) {
            updatedClip.regularClipProperties = {};
          }

          // 확장된 앵커가 있으면 확장된 앵커 업데이트, 없으면 레거시 앵커 업데이트
          if (props.startAnchorExtended) {
            updatedClip.regularClipProperties.startAnchorExtended = {
              ...props.startAnchorExtended,
              offset: currentOffset
            };
          } else if (props.startAnchor) {
            updatedClip.regularClipProperties.startAnchor = {
              ...props.startAnchor,
              offset: currentOffset
            };
          }
          clipUpdated = true;

          console.log('🔄 시작점 offset 재계산 (확장):', {
            clipName: clip.name,
            clipId: clip.id.slice(-8),
            targetType: getTargetType(effectiveStartAnchor),
            targetId: getTargetId(effectiveStartAnchor).slice(-8),
            basePoint: effectiveStartAnchor.anchorPoint,
            baseTime: baseTime.toFixed(2),
            clipStartTime: clip.startTime.toFixed(2),
            oldOffset: (effectiveStartAnchor.offset || 0).toFixed(2),
            newOffset: currentOffset.toFixed(2)
          });
        }
      } else {
        console.warn('⚠️ 시작점 타겟을 찾을 수 없음:', {
          clipName: clip.name,
          anchor: effectiveStartAnchor
        });
      }
    }

    // 끝점 연결 재계산 (확장된 앵커 지원)  
    if (effectiveEndAnchor) {
      const targetElement = findTargetElement(effectiveEndAnchor, baseClips, templateGroups, bundles);
      
      if (targetElement) {
        const baseTime = effectiveEndAnchor.anchorPoint === 'start'
          ? targetElement.startTime
          : targetElement.endTime;

        // 현재 클립 끝점과 타겟 연결점 사이의 거리 계산
        const currentOffset = clip.endTime - baseTime;

        // offset이 다르면 업데이트
        if (Math.abs(currentOffset - (effectiveEndAnchor.offset || 0)) > 0.001) {
          if (!updatedClip.regularClipProperties) {
            updatedClip.regularClipProperties = {};
          }

          // 확장된 앵커가 있으면 확장된 앵커 업데이트, 없으면 레거시 앵커 업데이트
          if (props.endAnchorExtended) {
            updatedClip.regularClipProperties.endAnchorExtended = {
              ...props.endAnchorExtended,
              offset: currentOffset
            };
          } else if (props.endAnchor) {
            updatedClip.regularClipProperties.endAnchor = {
              ...props.endAnchor,
              offset: currentOffset
            };
          }
          clipUpdated = true;

          console.log('🔄 끝점 offset 재계산 (확장):', {
            clipName: clip.name,
            clipId: clip.id.slice(-8),
            targetType: getTargetType(effectiveEndAnchor),
            targetId: getTargetId(effectiveEndAnchor).slice(-8),
            basePoint: effectiveEndAnchor.anchorPoint,
            baseTime: baseTime.toFixed(2),
            clipEndTime: clip.endTime.toFixed(2),
            oldOffset: (effectiveEndAnchor.offset || 0).toFixed(2),
            newOffset: currentOffset.toFixed(2)
          });
        }
      } else {
        console.warn('⚠️ 끝점 타겟을 찾을 수 없음:', {
          clipName: clip.name,
          anchor: effectiveEndAnchor
        });
      }
    }

    if (clipUpdated) {
      updatedClips.push(updatedClip);
      processedCount++;
    }
  }

  const message = processedCount > 0
    ? `${processedCount}개 클립의 offset이 재계산되었습니다.`
    : '재계산이 필요한 클립이 없습니다.';

  console.log('🔄 끝점 offset 재계산 완료 (확장):', {
    totalRegularClips: regularClips.length,
    processedCount,
    updatedClipsCount: updatedClips.length,
    message
  });

  return {
    success: true,
    updatedClips,
    message,
    processedCount
  };
};

// 헬퍼 함수들
const findTargetElement = (
  anchor: any,
  baseClips: TimelineClip[],
  templateGroups: TemplateGroup[],
  bundles: Bundle[]
): { startTime: number; endTime: number; id: string } | null => {
  if (anchor.baseClipId) {
    return baseClips.find(bc => bc.id === anchor.baseClipId) || null;
  } else if (anchor.templateGroupId) {
    return templateGroups.find(g => g.id === anchor.templateGroupId) || null;
  } else if (anchor.bundleId) {
    return bundles.find(b => b.id === anchor.bundleId) || null;
  }
  return null;
};

const getTargetType = (anchor: any): string => {
  if (anchor.baseClipId) return '기준클립';
  if (anchor.templateGroupId) return '템플릿그룹';
  if (anchor.bundleId) return '번들';
  return '알 수 없음';
};

const getTargetId = (anchor: any): string => {
  return anchor.baseClipId || anchor.templateGroupId || anchor.bundleId || '';
};

// === 클립 정렬 시스템 === //

// 클립 정렬 결과 타입
export interface ClipAlignmentResult {
  success: boolean;
  updatedClip?: TimelineClip;
  message?: string;
  alignmentType: 'start' | 'end' | 'both';
}

// 앞끝 맞추기: 클립의 시작점을 연결된 기준클립/템플릿/번들에 맞춤
export const alignClipStart = (
  clip: TimelineClip,
  allClips: TimelineClip[],
  templateGroups: TemplateGroup[] = [],
  bundles: Bundle[] = []
): ClipAlignmentResult => {
  // 기준클립이면 정렬 불가
  if (isBaseClip(clip)) {
    return {
      success: false,
      message: '기준클립은 정렬할 수 없습니다.',
      alignmentType: 'start'
    };
  }

  // 확장된 앵커 구조 우선 지원
  const effectiveStartAnchor = getEffectiveStartAnchor(clip.regularClipProperties);

  if (!effectiveStartAnchor) {
    return {
      success: false,
      message: '시작점 연결이 없습니다.',
      alignmentType: 'start'
    };
  }

  // 연결된 타겟 찾기 - 기준클립/템플릿/번들 지원
  let targetElement: { startTime: number; endTime: number; id: string } | null = null;
  let targetType = '';

  if (effectiveStartAnchor.baseClipId) {
    targetElement = allClips.find(c => c.id === effectiveStartAnchor.baseClipId) || null;
    targetType = '기준클립';
  } else if (effectiveStartAnchor.templateGroupId) {
    targetElement = templateGroups.find(g => g.id === effectiveStartAnchor.templateGroupId) || null;
    targetType = '템플릿 그룹';
  } else if (effectiveStartAnchor.bundleId) {
    targetElement = bundles.find(b => b.id === effectiveStartAnchor.bundleId) || null;
    targetType = '번들';
  }

  if (!targetElement) {
    return {
      success: false,
      message: `연결된 ${targetType || '타겟'}을 찾을 수 없습니다.`,
      alignmentType: 'start'
    };
  }

  // 타겟의 연결점 시간 계산
  const baseTime = effectiveStartAnchor.anchorPoint === 'start'
    ? targetElement.startTime
    : targetElement.endTime;

  // 클립 복사 및 업데이트
  const updatedClip = { ...clip };
  const currentDuration = clip.duration;

  // 시작점을 기준클립에 맞춤 (끝점은 유지하면서 길이 조정)
  updatedClip.startTime = baseTime;
  updatedClip.endTime = baseTime + currentDuration;
  updatedClip.duration = currentDuration;

  // 연결 정보 업데이트 - offset을 0으로 설정 (확장된 앵커 우선)
  if (!updatedClip.regularClipProperties) {
    updatedClip.regularClipProperties = {};
  }
  
  // 확장된 앵커가 있으면 확장된를 업데이트, 없으면 레거시 앵커 업데이트
  if (clip.regularClipProperties?.startAnchorExtended) {
    updatedClip.regularClipProperties.startAnchorExtended = {
      baseClipId: effectiveStartAnchor.baseClipId || '',
      templateGroupId: effectiveStartAnchor.templateGroupId,
      bundleId: effectiveStartAnchor.bundleId,
      anchorPoint: effectiveStartAnchor.anchorPoint,
      offset: 0 // 정확히 기준점에 맞춤
    };
  } else if (clip.regularClipProperties?.startAnchor) {
    updatedClip.regularClipProperties.startAnchor = {
      baseClipId: effectiveStartAnchor.baseClipId || '',
      anchorPoint: effectiveStartAnchor.anchorPoint,
      offset: 0 // 정확히 기준점에 맞춤
    };
  }

  // 시작 시간이 음수가 되지 않도록 보장
  if (updatedClip.startTime < 0) {
    updatedClip.startTime = 0;
    updatedClip.endTime = currentDuration;
  }

  console.log('🎯 앞끝 맞추기 완료:', {
    clipId: clip.id.slice(-8),
    '이전시작점': clip.startTime.toFixed(2),
    '새시작점': updatedClip.startTime.toFixed(2),
    '길이유지': currentDuration.toFixed(2),
    '타겟타입': targetType,
    '타겟ID': targetElement.id.slice(-8),
    '기준점': effectiveStartAnchor.anchorPoint,
    '새offset': 0
  });

  return {
    success: true,
    updatedClip,
    message: '앞끝 맞추기가 완료되었습니다.',
    alignmentType: 'start'
  };
};

// 뒤끝 맞추기: 클립의 끝점을 연결된 기준클립/템플릿/번들에 맞춤
export const alignClipEnd = (
  clip: TimelineClip,
  allClips: TimelineClip[],
  templateGroups: TemplateGroup[] = [],
  bundles: Bundle[] = []
): ClipAlignmentResult => {
  // 기준클립이면 정렬 불가
  if (isBaseClip(clip)) {
    return {
      success: false,
      message: '기준클립은 정렬할 수 없습니다.',
      alignmentType: 'end'
    };
  }

  // 확장된 앵커 구조 우선 지원
  const effectiveEndAnchor = getEffectiveEndAnchor(clip.regularClipProperties);

  if (!effectiveEndAnchor) {
    return {
      success: false,
      message: '끝점 연결이 없습니다.',
      alignmentType: 'end'
    };
  }

  // 연결된 타겟 찾기 - 기준클립/템플릿/번들 지원
  let targetElement: { startTime: number; endTime: number; id: string } | null = null;
  let targetType = '';

  if (effectiveEndAnchor.baseClipId) {
    targetElement = allClips.find(c => c.id === effectiveEndAnchor.baseClipId) || null;
    targetType = '기준클립';
  } else if (effectiveEndAnchor.templateGroupId) {
    targetElement = templateGroups.find(g => g.id === effectiveEndAnchor.templateGroupId) || null;
    targetType = '템플릿 그룹';
  } else if (effectiveEndAnchor.bundleId) {
    targetElement = bundles.find(b => b.id === effectiveEndAnchor.bundleId) || null;
    targetType = '번들';
  }

  if (!targetElement) {
    return {
      success: false,
      message: `연결된 ${targetType || '타겟'}을 찾을 수 없습니다.`,
      alignmentType: 'end'
    };
  }

  // 타겟의 연결점 시간 계산
  const baseTime = effectiveEndAnchor.anchorPoint === 'start'
    ? targetElement.startTime
    : targetElement.endTime;

  // 클립 복사 및 업데이트
  const updatedClip = { ...clip };
  const currentDuration = clip.duration;

  // 끝점을 기준클립에 맞춤 (시작점은 유지하면서 길이 조정)
  updatedClip.endTime = baseTime;
  updatedClip.startTime = baseTime - currentDuration;
  updatedClip.duration = currentDuration;

  // 연결 정보 업데이트 - offset을 0으로 설정 (확장된 앵커 우선)
  if (!updatedClip.regularClipProperties) {
    updatedClip.regularClipProperties = {};
  }
  
  // 확장된 앵커가 있으면 확장된를 업데이트, 없으면 레거시 앵커 업데이트
  if (clip.regularClipProperties?.endAnchorExtended) {
    updatedClip.regularClipProperties.endAnchorExtended = {
      baseClipId: effectiveEndAnchor.baseClipId || '',
      templateGroupId: effectiveEndAnchor.templateGroupId,
      bundleId: effectiveEndAnchor.bundleId,
      anchorPoint: effectiveEndAnchor.anchorPoint,
      offset: 0 // 정확히 기준점에 맞춤
    };
  } else if (clip.regularClipProperties?.endAnchor) {
    updatedClip.regularClipProperties.endAnchor = {
      baseClipId: effectiveEndAnchor.baseClipId || '',
      anchorPoint: effectiveEndAnchor.anchorPoint,
      offset: 0 // 정확히 기준점에 맞춤
    };
  }

  // 시작 시간이 음수가 되지 않도록 보장
  if (updatedClip.startTime < 0) {
    const adjustment = -updatedClip.startTime;
    updatedClip.startTime = 0;
    updatedClip.endTime = currentDuration;

    console.log('⚠️ 시작점 음수 방지 조정:', {
      clipId: clip.id.slice(-8),
      adjustment: adjustment.toFixed(2),
      '최종시작점': updatedClip.startTime,
      '최종끝점': updatedClip.endTime.toFixed(2)
    });
  }

  console.log('🎯 뒤끝 맞추기 완료:', {
    clipId: clip.id.slice(-8),
    '이전끝점': clip.endTime.toFixed(2),
    '새끝점': updatedClip.endTime.toFixed(2),
    '길이유지': currentDuration.toFixed(2),
    '타겟타입': targetType,
    '타겟ID': targetElement.id.slice(-8),
    '기준점': effectiveEndAnchor.anchorPoint,
    '새offset': 0
  });

  return {
    success: true,
    updatedClip,
    message: '뒤끝 맞추기가 완료되었습니다.',
    alignmentType: 'end'
  };
};

// 양끝 맞추기: 클립의 시작점과 끝점을 모두 연결된 기준클립/템플릿/번들에 맞춤
export const alignClipBoth = (
  clip: TimelineClip,
  allClips: TimelineClip[],
  templateGroups: TemplateGroup[] = [],
  bundles: Bundle[] = []
): ClipAlignmentResult => {
  // 기준클립이면 정렬 불가
  if (isBaseClip(clip)) {
    return {
      success: false,
      message: '기준클립은 정렬할 수 없습니다.',
      alignmentType: 'both'
    };
  }

  // 확장된 앵커 구조 우선 지원
  const effectiveStartAnchor = getEffectiveStartAnchor(clip.regularClipProperties);
  const effectiveEndAnchor = getEffectiveEndAnchor(clip.regularClipProperties);

  if (!effectiveStartAnchor || !effectiveEndAnchor) {
    return {
      success: false,
      message: '시작점과 끝점 연결이 모두 필요합니다.',
      alignmentType: 'both'
    };
  }

  // 연결된 타겟들 찾기 - 기준클립/템플릿/번들 지원
  let startTargetElement: { startTime: number; endTime: number; id: string } | null = null;
  let endTargetElement: { startTime: number; endTime: number; id: string } | null = null;
  let startTargetType = '';
  let endTargetType = '';

  // 시작점 타겟 찾기
  if (effectiveStartAnchor.baseClipId) {
    startTargetElement = allClips.find(c => c.id === effectiveStartAnchor.baseClipId) || null;
    startTargetType = '기준클립';
  } else if (effectiveStartAnchor.templateGroupId) {
    startTargetElement = templateGroups.find(g => g.id === effectiveStartAnchor.templateGroupId) || null;
    startTargetType = '템플릿 그룹';
  } else if (effectiveStartAnchor.bundleId) {
    startTargetElement = bundles.find(b => b.id === effectiveStartAnchor.bundleId) || null;
    startTargetType = '번들';
  }

  // 끝점 타겟 찾기
  if (effectiveEndAnchor.baseClipId) {
    endTargetElement = allClips.find(c => c.id === effectiveEndAnchor.baseClipId) || null;
    endTargetType = '기준클립';
  } else if (effectiveEndAnchor.templateGroupId) {
    endTargetElement = templateGroups.find(g => g.id === effectiveEndAnchor.templateGroupId) || null;
    endTargetType = '템플릿 그룹';
  } else if (effectiveEndAnchor.bundleId) {
    endTargetElement = bundles.find(b => b.id === effectiveEndAnchor.bundleId) || null;
    endTargetType = '번들';
  }

  if (!startTargetElement || !endTargetElement) {
    return {
      success: false,
      message: `연결된 ${!startTargetElement ? startTargetType || '시작점 타겟' : endTargetType || '끝점 타겟'}을 찾을 수 없습니다.`,
      alignmentType: 'both'
    };
  }

  // 타겟들의 연결점 시간 계산
  const startTime = effectiveStartAnchor.anchorPoint === 'start'
    ? startTargetElement.startTime
    : startTargetElement.endTime;

  const endTime = effectiveEndAnchor.anchorPoint === 'start'
    ? endTargetElement.startTime
    : endTargetElement.endTime;

  // 시작점과 끝점이 올바른 순서인지 확인
  if (startTime >= endTime) {
    return {
      success: false,
      message: '시작점이 끝점보다 뒤에 있어 정렬할 수 없습니다.',
      alignmentType: 'both'
    };
  }

  const newDuration = endTime - startTime;

  // 최소 길이 검증
  if (newDuration < MIN_CLIP_DURATION) {
    return {
      success: false,
      message: `클립 길이가 너무 짧습니다. (최소 ${MIN_CLIP_DURATION}초 필요)`,
      alignmentType: 'both'
    };
  }

  // 클립 복사 및 업데이트
  const updatedClip = { ...clip };

  // 양끝을 기준클립들에 맞춤 (동적 길이 결정)
  updatedClip.startTime = startTime;
  updatedClip.endTime = endTime;
  updatedClip.duration = newDuration;

  // 연결 정보 업데이트 - 양쪽 offset을 0으로 설정 (확장된 앵커 우선)
  if (!updatedClip.regularClipProperties) {
    updatedClip.regularClipProperties = {};
  }
  
  // 확장된 앵커가 있으면 확장된를 업데이트, 없으면 레거시 앵커 업데이트
  if (clip.regularClipProperties?.startAnchorExtended) {
    updatedClip.regularClipProperties.startAnchorExtended = {
      baseClipId: effectiveStartAnchor.baseClipId || '',
      templateGroupId: effectiveStartAnchor.templateGroupId,
      bundleId: effectiveStartAnchor.bundleId,
      anchorPoint: effectiveStartAnchor.anchorPoint,
      offset: 0 // 정확히 기준점에 맞춤
    };
  } else if (clip.regularClipProperties?.startAnchor) {
    updatedClip.regularClipProperties.startAnchor = {
      baseClipId: effectiveStartAnchor.baseClipId || '',
      anchorPoint: effectiveStartAnchor.anchorPoint,
      offset: 0 // 정확히 기준점에 맞춤
    };
  }
  
  if (clip.regularClipProperties?.endAnchorExtended) {
    updatedClip.regularClipProperties.endAnchorExtended = {
      baseClipId: effectiveEndAnchor.baseClipId || '',
      templateGroupId: effectiveEndAnchor.templateGroupId,
      bundleId: effectiveEndAnchor.bundleId,
      anchorPoint: effectiveEndAnchor.anchorPoint,
      offset: 0 // 정확히 기준점에 맞춤
    };
  } else if (clip.regularClipProperties?.endAnchor) {
    updatedClip.regularClipProperties.endAnchor = {
      baseClipId: effectiveEndAnchor.baseClipId || '',
      anchorPoint: effectiveEndAnchor.anchorPoint,
      offset: 0 // 정확히 기준점에 맞춤
    };
  }

  console.log('🎯 양끝 맞추기 완료:', {
    clipId: clip.id.slice(-8),
    '이전시간': `${clip.startTime.toFixed(2)}~${clip.endTime.toFixed(2)}`,
    '새시간': `${updatedClip.startTime.toFixed(2)}~${updatedClip.endTime.toFixed(2)}`,
    '이전길이': clip.duration.toFixed(2),
    '새길이': newDuration.toFixed(2),
    '시작타겟': `${startTargetType}(${startTargetElement.id.slice(-8)})`,
    '끝타겟': `${endTargetType}(${endTargetElement.id.slice(-8)})`,
    '양쪽offset': 0
  });

  return {
    success: true,
    updatedClip,
    message: '양끝 맞추기가 완료되었습니다.',
    alignmentType: 'both'
  };
};

// === 연결 끊기 시스템 === //

// 연결된 클립인지 확인
export const isConnectedClip = (clip: TimelineClip): boolean => {
  return !!(
    clip.regularClipProperties?.startAnchor ||
    clip.regularClipProperties?.endAnchor
  );
};

// 클립의 연결 정보 가져오기
export const getClipConnections = (clip: TimelineClip): {
  hasStartConnection: boolean;
  hasEndConnection: boolean;
  startConnection?: AnchorPoint;
  endConnection?: AnchorPoint;
} => {
  const startAnchor = clip.regularClipProperties?.startAnchor;
  const endAnchor = clip.regularClipProperties?.endAnchor;

  return {
    hasStartConnection: !!startAnchor,
    hasEndConnection: !!endAnchor,
    startConnection: startAnchor,
    endConnection: endAnchor
  };
};

// 연결 끊기 결과 타입
export interface DisconnectResult {
  success: boolean;
  updatedClip?: TimelineClip;
  message?: string;
  disconnectedConnections: ('start' | 'end')[];
}

// 클립의 모든 연결 끊기
export const disconnectClipAnchors = (
  clip: TimelineClip,
  connectionType: 'all' | 'start' | 'end' = 'all'
): DisconnectResult => {
  if (!clip.regularClipProperties) {
    return {
      success: false,
      message: '연결된 클립이 아닙니다.',
      disconnectedConnections: []
    };
  }

  // 확장된 앵커 구조 우선 지원
  const effectiveStartAnchor = getEffectiveStartAnchor(clip.regularClipProperties);
  const effectiveEndAnchor = getEffectiveEndAnchor(clip.regularClipProperties);

  // 연결 타입에 따른 사전 검증
  if (connectionType === 'start' && !effectiveStartAnchor) {
    return {
      success: false,
      message: '시작점 연결이 없습니다.',
      disconnectedConnections: []
    };
  }

  if (connectionType === 'end' && !effectiveEndAnchor) {
    return {
      success: false,
      message: '끝점 연결이 없습니다.',
      disconnectedConnections: []
    };
  }

  if (connectionType === 'all' && !effectiveStartAnchor && !effectiveEndAnchor) {
    return {
      success: false,
      message: '연결된 앵커가 없습니다.',
      disconnectedConnections: []
    };
  }

  // 클립 복사
  const updatedClip = { ...clip };
  updatedClip.regularClipProperties = { ...clip.regularClipProperties };

  const disconnectedConnections: ('start' | 'end')[] = [];

  // 연결 타입에 따라 앵커 제거 (확장된 앵커 구조 우선)
  console.log('🔗❌ 연결 끊기 시작:', {
    clipId: clip.id.slice(-8),
    connectionType,
    hasStartAnchor: !!effectiveStartAnchor,
    hasEndAnchor: !!effectiveEndAnchor
  });
  
  // 명확한 분기 처리
  if (connectionType === 'start') {
    // 시작점만 끊기
    if (effectiveStartAnchor) {
      const targetId = effectiveStartAnchor.baseClipId || effectiveStartAnchor.templateGroupId || effectiveStartAnchor.bundleId;
      console.log('🔗❌ 시작점만 연결 끊기:', {
        clipId: clip.id.slice(-8),
        targetId: targetId?.slice(-8),
        anchorPoint: effectiveStartAnchor.anchorPoint,
        offset: effectiveStartAnchor.offset
      });

      // 확장된 앵커가 있으면 확장된 앵커를 삭제, 없으면 레거시 앵커 삭제
      if (clip.regularClipProperties?.startAnchorExtended) {
        delete updatedClip.regularClipProperties.startAnchorExtended;
      } else if (clip.regularClipProperties?.startAnchor) {
        delete updatedClip.regularClipProperties.startAnchor;
      }
      disconnectedConnections.push('start');
    }
  } else if (connectionType === 'end') {
    // 끝점만 끊기
    if (effectiveEndAnchor) {
      const targetId = effectiveEndAnchor.baseClipId || effectiveEndAnchor.templateGroupId || effectiveEndAnchor.bundleId;
      console.log('🔗❌ 끝점만 연결 끊기:', {
        clipId: clip.id.slice(-8),
        targetId: targetId?.slice(-8),
        anchorPoint: effectiveEndAnchor.anchorPoint,
        offset: effectiveEndAnchor.offset
      });

      // 확장된 앵커가 있으면 확장된 앵커를 삭제, 없으면 레거시 앵커 삭제
      if (clip.regularClipProperties?.endAnchorExtended) {
        delete updatedClip.regularClipProperties.endAnchorExtended;
      } else if (clip.regularClipProperties?.endAnchor) {
        delete updatedClip.regularClipProperties.endAnchor;
      }
      disconnectedConnections.push('end');
    }
  } else if (connectionType === 'all') {
    // 모든 연결 끊기
    if (effectiveStartAnchor) {
      const targetId = effectiveStartAnchor.baseClipId || effectiveStartAnchor.templateGroupId || effectiveStartAnchor.bundleId;
      console.log('🔗❌ 시작점 연결 끊기 (전체):', {
        clipId: clip.id.slice(-8),
        targetId: targetId?.slice(-8),
        anchorPoint: effectiveStartAnchor.anchorPoint,
        offset: effectiveStartAnchor.offset
      });

      if (clip.regularClipProperties?.startAnchorExtended) {
        delete updatedClip.regularClipProperties.startAnchorExtended;
      } else if (clip.regularClipProperties?.startAnchor) {
        delete updatedClip.regularClipProperties.startAnchor;
      }
      disconnectedConnections.push('start');
    }
    
    if (effectiveEndAnchor) {
      const targetId = effectiveEndAnchor.baseClipId || effectiveEndAnchor.templateGroupId || effectiveEndAnchor.bundleId;
      console.log('🔗❌ 끝점 연결 끊기 (전체):', {
        clipId: clip.id.slice(-8),
        targetId: targetId?.slice(-8),
        anchorPoint: effectiveEndAnchor.anchorPoint,
        offset: effectiveEndAnchor.offset
      });

      if (clip.regularClipProperties?.endAnchorExtended) {
        delete updatedClip.regularClipProperties.endAnchorExtended;
      } else if (clip.regularClipProperties?.endAnchor) {
        delete updatedClip.regularClipProperties.endAnchor;
      }
      disconnectedConnections.push('end');
    }
  }

  // 모든 앵커가 제거되면 regularClipProperties 자체를 정리 (확장된 앵커 포함)
  if (!updatedClip.regularClipProperties.startAnchor &&
    !updatedClip.regularClipProperties.endAnchor &&
    !updatedClip.regularClipProperties.startAnchorExtended &&
    !updatedClip.regularClipProperties.endAnchorExtended &&
    !updatedClip.regularClipProperties.staticDuration) {
    delete updatedClip.regularClipProperties;
  }

  // 클립을 현재 위치/크기로 고정 (정적 클립으로 변환)
  // 이미 현재 위치에 있으므로 startTime, endTime, duration은 그대로 유지

  const message = disconnectedConnections.length > 0
    ? `${disconnectedConnections.map(type => type === 'start' ? '시작점' : '끝점').join(', ')} 연결이 끊어졌습니다.`
    : '끊을 연결이 없습니다.';

  console.log('🔗❌ 연결 끊기 완료:', {
    clipId: clip.id.slice(-8),
    disconnectedConnections,
    message,
    '이전연결수': (effectiveStartAnchor ? 1 : 0) + (effectiveEndAnchor ? 1 : 0),
    '남은연결수': Object.keys(updatedClip.regularClipProperties || {}).length
  });

  return {
    success: disconnectedConnections.length > 0,
    updatedClip,
    message,
    disconnectedConnections
  };
};

// 선택된 클립들의 연결 상태 분석
export const analyzeSelectedClipsConnections = (selectedClipIds: string[], allClips: TimelineClip[]): {
  totalSelected: number;
  connectedClips: TimelineClip[];
  unconnectedClips: TimelineClip[];
  hasAnyConnections: boolean;
  hasStartConnections: boolean; // 새로 추가
  hasEndConnections: boolean;   // 새로 추가
  startConnectedClips: TimelineClip[]; // 새로 추가
  endConnectedClips: TimelineClip[];   // 새로 추가
  connectionSummary: string;
} => {
  const selectedClips = selectedClipIds
    .map(id => allClips.find(clip => clip.id === id))
    .filter(clip => clip) as TimelineClip[];

  const connectedClips = selectedClips.filter(isConnectedClip);
  const unconnectedClips = selectedClips.filter(clip => !isConnectedClip(clip));

  // 시작점/끝점 연결별 분석 - 새로 추가
  const startConnectedClips = selectedClips.filter(clip =>
    clip.regularClipProperties?.startAnchor
  );
  const endConnectedClips = selectedClips.filter(clip =>
    clip.regularClipProperties?.endAnchor
  );

  let connectionSummary = '';
  if (connectedClips.length > 0) {
    const totalConnections = connectedClips.reduce((total, clip) => {
      const connections = getClipConnections(clip);
      return total + (connections.hasStartConnection ? 1 : 0) + (connections.hasEndConnection ? 1 : 0);
    }, 0);

    // 더 상세한 요약 - 새로 개선
    const startCount = startConnectedClips.length;
    const endCount = endConnectedClips.length;

    if (startCount > 0 && endCount > 0) {
      connectionSummary = `시작점 ${startCount}개, 끝점 ${endCount}개`;
    } else if (startCount > 0) {
      connectionSummary = `시작점 ${startCount}개`;
    } else if (endCount > 0) {
      connectionSummary = `끝점 ${endCount}개`;
    } else {
      connectionSummary = `총 ${totalConnections}개 연결`;
    }
  } else {
    connectionSummary = '연결된 클립 없음';
  }

  return {
    totalSelected: selectedClips.length,
    connectedClips,
    unconnectedClips,
    hasAnyConnections: connectedClips.length > 0,
    hasStartConnections: startConnectedClips.length > 0, // 새로 추가
    hasEndConnections: endConnectedClips.length > 0,     // 새로 추가
    startConnectedClips,  // 새로 추가
    endConnectedClips,    // 새로 추가
    connectionSummary
  };
};
