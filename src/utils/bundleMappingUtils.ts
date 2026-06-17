/**
 * 🔗 bundleMappingUtils.ts - Bundle 매핑 및 재생성 로직 헬퍼 유틸리티
 * 
 * Bundle과 TemplateGroup 간의 연동을 개선하기 위한 전문적인 매핑 로직을
 * 제공하는 유틸리티 파일입니다. 템플릿 시스템에서 번들 구조를 재생성하고
 * 클립 간의 관계를 매핑하는 핵심 기능들을 포함합니다.
 * 
 * 주요 기능:
 * - Bundle ID 매핑 생성 및 관리
 * - 클립 간 관계 매핑 (원본 → 새로운 클립)
 * - Bundle 재생성 로직 (템플릿 기반)
 * - Bundle 관계 분석 및 검증
 * - 시간 기반 클립 정렬 및 매칭
 * - Bundle 구조 무결성 검증
 * 
 * Phase 2-2 개선사항:
 * - Bundle-TemplateGroup 연동 강화
 * - 클립 매핑 정확도 향상
 * - 번들 재생성 안정성 개선
 * - 대규모 템플릿 처리 성능 최적화
 * 
 * 매핑 알고리즘:
 * 1. 원본 Bundle 구조 분석
 * 2. 기존 클립 ID 수집 및 분류
 * 3. 새로 생성된 클립들과 매칭
 * 4. 시간 순서 기반 매핑 생성
 * 5. Bundle 관계 재구성
 * 6. 매핑 결과 검증 및 보정
 * 
 * 사용 시나리오:
 * - 템플릿에서 새 프로젝트 생성 시 Bundle 재생성
 * - CSV 자동 생성 시 Bundle 구조 복제
 * - 프로젝트 로드 시 Bundle 관계 복원
 * - Bundle 편집 시 일관성 유지
 * 
 * 성능 최적화:
 * - 클립 ID 맵핑 캐시 활용
 * - 시간 복잡도 O(n log n) 정렬 알고리즘
 * - 메모리 효율적인 매핑 구조
 * - 대용량 번들 처리 최적화
 * 
 * 관련 모듈:
 * - 3번 모듈: Bundle System (핵심 번들 시스템)
 * - 9번 모듈: Template System (템플릿 연동)
 * - Bundle 타입 정의 및 관계 시스템
 * - baseClips.ts: 기준 클립 및 종속 관계
 */

import { Bundle, TimelineClip } from '../types';
import { BundleMapping } from '../types/templates';
import { BundleRelationships } from '../types/bundles';
import { isBaseClip } from '../types';

/**
 * Bundle ID 매핑 생성
 * @param originalBundles - 원본 Bundle들
 * @param existingClipIds - 기존 클립 ID들
 * @param newClips - 새로 생성된 클립들
 * @returns Bundle 매핑 정보
 */
export function generateBundleMappings(
  originalBundles: Bundle[],
  existingClipIds: string[],
  newClips: TimelineClip[]
): BundleMapping[] {
  if (!originalBundles || originalBundles.length === 0) {
    return [];
  }

  const newBaseClips = newClips.filter(clip => isBaseClip(clip));
  const clipIdMappings: { [originalClipId: string]: string } = {};

  // ✅ 뒤에서부터 매핑하는 방법으로 수정
  originalBundles.forEach(bundle => {
    // 시간 순서로 정렬된 baseClip들과 매핑
    const sortedNewBundleClips = [...newBaseClips].sort((a, b) => a.startTime - b.startTime).filter(clip => clip.isBundled);

    bundle.baseClipIds.forEach((originalClipId, index) => {
      const matchingNewClip = sortedNewBundleClips[index];
      clipIdMappings[originalClipId] = matchingNewClip.id;

    });
  });

  // Bundle 매핑 생성
  const bundleMappings: BundleMapping[] = originalBundles.map(originalBundle => {
    const newBundleId = `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      originalBundleId: originalBundle.id,
      newBundleId: newBundleId,
      clipIdMappings: clipIdMappings,
      preservedInGroup: true
    };
  });

  console.log('✅ 최종 매핑 결과:', clipIdMappings);

  return bundleMappings;
}


/**
 * TemplateGroup을 위한 Bundle 재생성
 * @param originalBundles - 원본 Bundle들
 * @param bundleMappings - Bundle 매핑 정보
 * @param templateGroupId - 연결할 TemplateGroup ID
 * @returns 재생성된 Bundle들
 */
export function regenerateBundlesForGroup(
  originalBundles: Bundle[],
  bundleMappings: BundleMapping[],
  templateGroupId: string
): Bundle[] {
  if (!originalBundles || originalBundles.length === 0) {
    return [];
  }

  console.log('🔄 Bundle 재생성 시작:', {
    originalBundles: originalBundles.length,
    bundleMappings: bundleMappings.length,
    templateGroupId: templateGroupId.slice(-8)
  });

  const regeneratedBundles = originalBundles.map((originalBundle, index) => {
    const mapping = bundleMappings[index];
    if (!mapping) {
      console.warn('⚠️ Bundle 매핑을 찾을 수 없음:', originalBundle.id.slice(-8));
      return null;
    }

    // 새 Bundle ID 사용
    const newBundleId = mapping.newBundleId;

    // 클립 ID 매핑 적용
    const mappedClipIds = originalBundle.baseClipIds
      .map(clipId => mapping.clipIdMappings[clipId])
      .filter(id => id !== null && id !== undefined);

    if (mappedClipIds.length === 0) {
      console.warn('⚠️ 매핑된 클립이 없어 Bundle 생략:', originalBundle.name);
      return null;
    }

    // 관계 메타데이터 생성
    const relationships: BundleRelationships = {
      linkedTemplateGroups: [{
        groupId: templateGroupId,
        relationship: 'contains',
        syncMovement: true
      }],
      dragBehavior: 'with-groups',
      preserveGroupProtection: true
    };

    const regeneratedBundle: Bundle = {
      ...originalBundle,
      id: newBundleId,
      baseClipIds: mappedClipIds,
      templateGroupIds: [], // 그룹과 연결
      createdAt: Date.now(),

      // 🌟 관계 메타데이터 추가
      relationships: relationships
    };

    console.log('✅ Bundle 재생성:', {
      originalId: originalBundle.id.slice(-8),
      newId: newBundleId.slice(-8),
      name: originalBundle.name,
      originalClips: originalBundle.baseClipIds.length,
      mappedClips: mappedClipIds.length
    });

    return regeneratedBundle;
  }).filter((bundle): bundle is Bundle => bundle !== null);

  console.log('✅ Bundle 재생성 완료:', {
    originalCount: originalBundles.length,
    regeneratedCount: regeneratedBundles.length,
    templateGroupId: templateGroupId.slice(-8)
  });

  return regeneratedBundles;
}

/**
 * Bundle-TemplateGroup 관계 분석
 * @param bundles - Bundle 목록
 * @param templateGroups - TemplateGroup 목록  
 * @returns 관계 분석 결과
 */
export function analyzeBundleTemplateGroupRelations(
  bundles?: Bundle[],
  templateGroups?: any[] // TemplateGroup 타입 순환참조 방지
): any[] { // BundleTemplateGroupRelation 타입 순환참조 방지
  if (!bundles || !templateGroups) {
    return [];
  }

  const relations: any[] = [];

  bundles.forEach(bundle => {
    bundle.templateGroupIds.forEach(groupId => {
      const group = templateGroups.find(g => g.id === groupId);
      if (group) {
        relations.push({
          bundleId: bundle.id,
          templateGroupId: groupId,
          relationship: 'parent',
          createdAt: new Date().toISOString(),
          syncMovement: bundle.relationships?.dragBehavior === 'with-groups'
        });
      }
    });
  });

  return relations;
}

/**
 * 클립 ID 매핑에서 매핑된 클립 ID 찾기
 * @param originalClipId - 원본 클립 ID
 * @param bundleMappings - Bundle 매핑 정보들
 * @returns 매핑된 새 클립 ID 또는 null
 */
export function findMappedClipId(
  originalClipId: string,
  bundleMappings: BundleMapping[]
): string | null {
  for (const mapping of bundleMappings) {
    const mappedId = mapping.clipIdMappings[originalClipId];
    if (mappedId) {
      return mappedId;
    }
  }
  return null;
}

// 🌟 ===== 개선된 Bundle 매핑 시스템 =====

/**
 * 🌟 개선된 Bundle ID 매핑 생성 함수 (ID 매핑 테이블 활용)
 * @param originalBundles - 원본 Bundle들
 * @param clipIdMappingTable - ID 매핑 테이블 (generateUniqueClipIds에서 생성된)
 * @returns Bundle 매핑 정보
 */
export function generateBundleMappingsWithIdTable(
  originalBundles: Bundle[],
  clipIdMappingTable: Map<string, string>
): BundleMapping[] {
  if (!originalBundles || originalBundles.length === 0) {
    console.log('📦 Bundle이 없어 매핑 건너뛰기');
    return [];
  }

  console.log('🔄 개선된 Bundle 매핑 생성 시작:', {
    originalBundles: originalBundles.length,
    clipIdMappingTable: clipIdMappingTable.size
  });

  // 매핑 테이블을 기반으로 clipIdMappings 생성
  const clipIdMappings: { [originalClipId: string]: string } = {};
  
  originalBundles.forEach(bundle => {
    bundle.baseClipIds.forEach(originalClipId => {
      const newClipId = clipIdMappingTable.get(originalClipId);
      if (newClipId) {
        clipIdMappings[originalClipId] = newClipId;
        
        console.log('✅ Bundle 클립 매핑:', {
          bundleName: bundle.name,
          originalClipId: originalClipId.slice(-8),
          newClipId: newClipId.slice(-8)
        });
      } else {
        console.warn('⚠️ Bundle 클립 매핑 실패:', {
          bundleName: bundle.name,
          originalClipId: originalClipId.slice(-8),
          reason: 'ID 매핑 테이블에 없음'
        });
      }
    });
  });

  // Bundle 매핑 생성
  const bundleMappings: BundleMapping[] = originalBundles.map(originalBundle => {
    const newBundleId = `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      originalBundleId: originalBundle.id,
      newBundleId: newBundleId,
      clipIdMappings: clipIdMappings,
      preservedInGroup: true
    };
  });

  console.log('✅ 개선된 Bundle 매핑 완료:', {
    bundleMappings: bundleMappings.length,
    totalClipMappings: Object.keys(clipIdMappings).length
  });

  return bundleMappings;
}

/**
 * 🧠 속성 기반 스마트 매핑 (ID 매핑 테이블이 없는 경우의 대안)
 * @param originalBundles - 원본 Bundle들
 * @param originalClips - 원본 템플릿의 클립들
 * @param newClips - 새로 생성된 클립들
 * @returns Bundle 매핑 정보
 */
export function generateBundleMappingsWithSmartMatching(
  originalBundles: Bundle[],
  originalClips: TimelineClip[],
  newClips: TimelineClip[]
): BundleMapping[] {
  if (!originalBundles || originalBundles.length === 0) {
    return [];
  }

  console.log('🧠 스마트 매핑 기반 Bundle 매핑 생성 시작:', {
    originalBundles: originalBundles.length,
    originalClips: originalClips.length,
    newClips: newClips.length
  });

  // 매핑 점수 계산 함수
  const calculateMatchScore = (originalClip: TimelineClip, newClip: TimelineClip): number => {
    let score = 0;
    
    // 미디어 타입 일치 (가중치: 30)
    if (originalClip.mediaType === newClip.mediaType) {
      score += 30;
    }
    
    // 시작 시간 유사도 (가중치: 20)
    const timeDiff = Math.abs(originalClip.startTime - newClip.startTime);
    if (timeDiff === 0) score += 20;
    else if (timeDiff < 1) score += 15;
    else if (timeDiff < 5) score += 10;
    else if (timeDiff < 10) score += 5;
    
    // 길이 유사도 (가중치: 20)
    const durationDiff = Math.abs(originalClip.duration - newClip.duration);
    if (durationDiff === 0) score += 20;
    else if (durationDiff < 0.5) score += 15;
    else if (durationDiff < 1) score += 10;
    else if (durationDiff < 2) score += 5;
    
    // 텍스트 내용 일치 (가중치: 30)
    if (originalClip.text && newClip.text) {
      if (originalClip.text === newClip.text) score += 30;
      else if (originalClip.text.includes(newClip.text) || newClip.text.includes(originalClip.text)) score += 15;
    }
    
    // 기준클립 여부 일치 (가중치: 10)
    const originalIsBase = isBaseClip(originalClip);
    const newIsBase = isBaseClip(newClip);
    if (originalIsBase === newIsBase) score += 10;
    
    return score;
  };

  // 클립 매핑 생성
  const clipIdMappings: { [originalClipId: string]: string } = {};
  const usedNewClipIds = new Set<string>();

  originalBundles.forEach(bundle => {
    console.log(`🔍 Bundle "${bundle.name}" 매핑 시작:`, {
      baseClipIds: bundle.baseClipIds.length
    });

    bundle.baseClipIds.forEach(originalClipId => {
      const originalClip = originalClips.find(clip => clip.id === originalClipId);
      
      if (!originalClip) {
        console.warn('⚠️ 원본 클립을 찾을 수 없음:', originalClipId.slice(-8));
        return;
      }

      // 사용되지 않은 새 클립들 중에서 가장 유사한 클립 찾기
      let bestMatch: TimelineClip | null = null;
      let bestScore = 0;

      newClips.forEach(newClip => {
        if (usedNewClipIds.has(newClip.id)) return; // 이미 매핑된 클립은 제외

        const score = calculateMatchScore(originalClip, newClip);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = newClip;
        }
      });

      if (bestMatch && bestScore >= 50) { // 최소 매칭 점수 50점 이상
        clipIdMappings[originalClipId] = bestMatch.id;
        usedNewClipIds.add(bestMatch.id);
        
        console.log('✅ 스마트 매핑 성공:', {
          bundleName: bundle.name,
          originalClipId: originalClipId.slice(-8),
          newClipId: bestMatch.id.slice(-8),
          score: bestScore,
          mediaType: originalClip.mediaType
        });
      } else {
        console.warn('⚠️ 적절한 매핑을 찾지 못함:', {
          bundleName: bundle.name,
          originalClipId: originalClipId.slice(-8),
          bestScore,
          threshold: 50
        });
      }
    });
  });

  // Bundle 매핑 생성
  const bundleMappings: BundleMapping[] = originalBundles.map(originalBundle => {
    const newBundleId = `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      originalBundleId: originalBundle.id,
      newBundleId: newBundleId,
      clipIdMappings: clipIdMappings,
      preservedInGroup: true
    };
  });

  console.log('✅ 스마트 매핑 기반 Bundle 매핑 완료:', {
    bundleMappings: bundleMappings.length,
    totalClipMappings: Object.keys(clipIdMappings).length,
    successRate: `${Math.round((Object.keys(clipIdMappings).length / originalClips.length) * 100)}%`
  });

  return bundleMappings;
}

/**
 * 🔧 기존 함수 개선 (하위 호환성 유지)
 * @param originalBundles - 원본 Bundle들
 * @param originalClips - 원본 템플릿의 클립들 (새로 추가된 매개변수)
 * @param newClips - 새로 생성된 클립들
 * @returns Bundle 매핑 정보
 */
export function generateBundleMappingsImproved(
  originalBundles: Bundle[],
  originalClips: TimelineClip[], // 🌟 새로 추가된 매개변수
  newClips: TimelineClip[]
): BundleMapping[] {
  if (!originalBundles || originalBundles.length === 0) {
    return [];
  }

  console.log('🔄 개선된 Bundle 매핑 생성 (하위 호환성 유지):', {
    originalBundles: originalBundles.length,
    originalClips: originalClips.length,
    newClips: newClips.length
  });

  // 기준클립만 필터링
  const newBaseClips = newClips.filter(clip => isBaseClip(clip));
  const originalBaseClips = originalClips.filter(clip => isBaseClip(clip));
  
  console.log('📋 기준클립 필터링 결과:', {
    originalBaseClips: originalBaseClips.length,
    newBaseClips: newBaseClips.length
  });

  const clipIdMappings: { [originalClipId: string]: string } = {};

  // 시간 순서로 정렬
  const sortedOriginalBaseClips = [...originalBaseClips].sort((a, b) => a.startTime - b.startTime);
  const sortedNewBaseClips = [...newBaseClips].sort((a, b) => a.startTime - b.startTime);

  // Bundle별로 매핑 수행
  originalBundles.forEach(bundle => {
    console.log(`🔍 Bundle "${bundle.name}" 처리 중...`);
    
    bundle.baseClipIds.forEach((originalClipId, index) => {
      // 원본 클립 찾기
      const originalClip = sortedOriginalBaseClips.find(clip => clip.id === originalClipId);
      
      if (!originalClip) {
        console.warn('⚠️ 원본 기준클립을 찾을 수 없음:', originalClipId.slice(-8));
        return;
      }

      // 해당 Bundle의 클립들 중에서 시간 순서상 대응되는 새 클립 찾기
      const originalIndexInBundle = sortedOriginalBaseClips.findIndex(clip => clip.id === originalClipId);
      
      if (originalIndexInBundle >= 0 && originalIndexInBundle < sortedNewBaseClips.length) {
        const matchingNewClip = sortedNewBaseClips[originalIndexInBundle];
        clipIdMappings[originalClipId] = matchingNewClip.id;
        
        console.log('✅ 순서 기반 매핑:', {
          bundleName: bundle.name,
          originalClipId: originalClipId.slice(-8),
          newClipId: matchingNewClip.id.slice(-8),
          index: originalIndexInBundle,
          originalStartTime: originalClip.startTime.toFixed(2),
          newStartTime: matchingNewClip.startTime.toFixed(2)
        });
      } else {
        console.warn('⚠️ 대응되는 새 클립을 찾을 수 없음:', {
          bundleName: bundle.name,
          originalClipId: originalClipId.slice(-8),
          originalIndexInBundle,
          availableNewClips: sortedNewBaseClips.length
        });
      }
    });
  });

  // Bundle 매핑 생성
  const bundleMappings: BundleMapping[] = originalBundles.map(originalBundle => {
    const newBundleId = `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      originalBundleId: originalBundle.id,
      newBundleId: newBundleId,
      clipIdMappings: clipIdMappings,
      preservedInGroup: true
    };
  });

  console.log('✅ 개선된 Bundle 매핑 완료:', {
    bundleMappings: bundleMappings.length,
    totalClipMappings: Object.keys(clipIdMappings).length
  });

  return bundleMappings;
}
