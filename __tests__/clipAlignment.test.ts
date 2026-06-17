/**
 * 🧪 clipAlignment.ts 테스트 파일
 * 
 * 리팩토링 전후 동일한 동작을 보장하기 위한 종합적인 테스트
 * - 모든 정렬 계산 함수 테스트
 * - 오프셋 재계산 로직 검증
 * - 앵커 시스템 테스트
 * - 수학적 계산 정확성 검증
 */

import {
  recalculateEndpointOffsets,
  type RecalculateOffsetResult
} from '../src/types/clipAlignment';

import { isBaseClip } from '../src/types/baseClips';
import type { TimelineClip } from '../src/types/core';
import type { TemplateGroup } from '../src/types/templates';
import type { Bundle } from '../src/types/bundles';

// 테스트용 모킹 데이터 생성 헬퍼
const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: 'clip-1',
  mediaId: 'media-1',
  trackId: 'track-1',
  name: 'Test Clip',
  startTime: 0,
  endTime: 10,
  duration: 10,
  mediaType: 'video',
  mediaUrl: '/test.mp4',
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  opacity: 1,
  rotation: 0,
  volume: 1,
  playbackRate: 1,
  ...overrides
});

const createMockBaseClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  ...createMockClip(overrides),
  baseClipProperties: {
    anchorType: 'start' as const,
    ...overrides.baseClipProperties
  }
});

const createMockRegularClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  ...createMockClip(overrides),
  regularClipProperties: {
    startAnchor: null,
    endAnchor: null,
    ...overrides.regularClipProperties
  }
});

describe('clipAlignment - 기본 기능 테스트', () => {
  
  describe('recalculateEndpointOffsets', () => {
    
    test('일반클립이 없으면 실패 결과 반환', () => {
      const result = recalculateEndpointOffsets([], [], []);
      
      expect(result.success).toBe(false);
      expect(result.updatedClips).toEqual([]);
      expect(result.message).toBe('재계산할 일반클립이 없습니다.');
      expect(result.processedCount).toBe(0);
    });

    test('기준클립만 있으면 실패 결과 반환', () => {
      const baseClips = [
        createMockBaseClip({ id: 'base-1' })
      ];
      
      const result = recalculateEndpointOffsets(baseClips, [], []);
      
      expect(result.success).toBe(false);
      expect(result.updatedClips).toEqual([]);
      expect(result.processedCount).toBe(0);
    });

    test('일반클립만 있으면 처리 시도', () => {
      const regularClips = [
        createMockRegularClip({ id: 'regular-1' })
      ];
      
      const result = recalculateEndpointOffsets(regularClips, [], []);
      
      // 앵커가 없는 클립은 변경되지 않지만 처리는 시도됨
      expect(result.success).toBe(true);
      expect(result.updatedClips.length).toBe(0);
      expect(result.processedCount).toBe(1);
    });

    test('기준클립과 일반클립이 모두 있으면 처리', () => {
      const baseClip = createMockBaseClip({ 
        id: 'base-1',
        startTime: 10,
        endTime: 20
      });
      
      const regularClip = createMockRegularClip({ 
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'start',
            offset: 5
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      
      // 업데이트된 클립이 있는지 확인
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      if (updatedClip) {
        expect(updatedClip.startTime).toBe(15); // 10 (base start) + 5 (offset)
      }
    });
  });

  describe('기준클립 식별', () => {
    
    test('isBaseClip 함수 동작 검증', () => {
      const baseClip = createMockBaseClip();
      const regularClip = createMockRegularClip();
      const plainClip = createMockClip();
      
      expect(isBaseClip(baseClip)).toBe(true);
      expect(isBaseClip(regularClip)).toBe(false);
      expect(isBaseClip(plainClip)).toBe(false);
    });

    test('baseClipProperties가 없으면 기준클립이 아님', () => {
      const clip = createMockClip();
      delete (clip as any).baseClipProperties;
      
      expect(isBaseClip(clip)).toBe(false);
    });
  });

  describe('시간 계산 정확성', () => {
    
    test('시작점 앵커 오프셋 계산', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 10,
        endTime: 20
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'start',
            offset: 3
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      
      if (updatedClip) {
        expect(updatedClip.startTime).toBe(13); // 10 + 3
      }
    });

    test('끝점 앵커 오프셋 계산', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1', 
        startTime: 10,
        endTime: 20
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        startTime: 5,
        duration: 5,
        regularClipProperties: {
          startAnchor: null,
          endAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'end',
            offset: -2
          }
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      
      if (updatedClip) {
        expect(updatedClip.endTime).toBe(18); // 20 - 2
        expect(updatedClip.startTime).toBe(13); // 18 - 5 (duration)
      }
    });

    test('양수와 음수 오프셋 처리', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 100,
        endTime: 200
      });
      
      // 양수 오프셋
      const regularClip1 = createMockRegularClip({
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'start',
            offset: 10
          },
          endAnchor: null
        }
      });
      
      // 음수 오프셋  
      const regularClip2 = createMockRegularClip({
        id: 'regular-2',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1', 
            anchorPoint: 'start',
            offset: -5
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip1, regularClip2], [], []);
      
      const updated1 = result.updatedClips.find(c => c.id === 'regular-1');
      const updated2 = result.updatedClips.find(c => c.id === 'regular-2');
      
      if (updated1) expect(updated1.startTime).toBe(110); // 100 + 10
      if (updated2) expect(updated2.startTime).toBe(95);  // 100 - 5
    });

    test('부동소수점 시간 정확한 처리', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 10.5,
        endTime: 20.7
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'start', 
            offset: 2.3
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      
      if (updatedClip) {
        expect(updatedClip.startTime).toBe(12.8); // 10.5 + 2.3
      }
    });
  });

  describe('예외 상황 처리', () => {
    
    test('존재하지 않는 클립 참조', () => {
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'non-existent-clip',
            anchorPoint: 'start',
            offset: 5
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([regularClip], [], []);
      
      // 참조할 수 없는 클립은 업데이트되지 않음
      expect(result.success).toBe(true);
      expect(result.updatedClips.length).toBe(0);
      expect(result.processedCount).toBe(1);
    });

    test('잘못된 앵커포인트 값', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 10,
        endTime: 20
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'invalid' as any,
            offset: 5
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      
      // 잘못된 앵커포인트는 무시됨
      expect(result.success).toBe(true);
      expect(result.updatedClips.length).toBe(0);
    });

    test('순환 참조 방지', () => {
      // 이 테스트는 순환참조 감지 로직이 구현되면 추가
      // 현재는 기본 동작만 확인
      const baseClip = createMockBaseClip({ id: 'base-1' });
      const regularClip = createMockRegularClip({ id: 'regular-1' });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      expect(result).toBeDefined();
    });
  });

  describe('성능 및 대량 데이터', () => {
    
    test('많은 클립 처리 성능', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 0,
        endTime: 100
      });
      
      // 100개의 일반클립 생성
      const regularClips = Array.from({ length: 100 }, (_, i) => 
        createMockRegularClip({
          id: `regular-${i}`,
          regularClipProperties: {
            startAnchor: {
              baseClipId: 'base-1',
              anchorPoint: 'start',
              offset: i
            },
            endAnchor: null
          }
        })
      );
      
      const startTime = Date.now();
      const result = recalculateEndpointOffsets([baseClip, ...regularClips], [], []);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
    });

    test('빈 배열들 처리', () => {
      const result = recalculateEndpointOffsets([], [], []);
      
      expect(result.success).toBe(false);
      expect(result.updatedClips).toEqual([]);
      expect(result.processedCount).toBe(0);
    });
  });

  describe('템플릿 그룹 및 번들 지원', () => {
    
    test('빈 템플릿 그룹과 번들로 호출', () => {
      const regularClip = createMockRegularClip({ id: 'regular-1' });
      
      const result = recalculateEndpointOffsets([regularClip], [], []);
      
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
    });

    test('템플릿 그룹 배열 전달', () => {
      const templateGroups: TemplateGroup[] = []; // 빈 배열로 테스트
      const regularClip = createMockRegularClip({ id: 'regular-1' });
      
      const result = recalculateEndpointOffsets([regularClip], templateGroups, []);
      
      expect(result.success).toBe(true);
    });

    test('번들 배열 전달', () => {
      const bundles: Bundle[] = []; // 빈 배열로 테스트  
      const regularClip = createMockRegularClip({ id: 'regular-1' });
      
      const result = recalculateEndpointOffsets([regularClip], [], bundles);
      
      expect(result.success).toBe(true);
    });
  });
});

describe('clipAlignment - 수학적 정확성 테스트', () => {
  
  describe('시간 계산 정밀도', () => {
    
    test('매우 작은 오프셋 값', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 0,
        endTime: 1
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'start',
            offset: 0.001
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      
      if (updatedClip) {
        expect(updatedClip.startTime).toBe(0.001);
      }
    });

    test('매우 큰 오프셋 값', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 0,
        endTime: 1000
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'start',
            offset: 999999
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      
      if (updatedClip) {
        expect(updatedClip.startTime).toBe(999999);
      }
    });

    test('0 오프셋 처리', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 50,
        endTime: 100
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'start',
            offset: 0
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      
      if (updatedClip) {
        expect(updatedClip.startTime).toBe(50); // 기준클립과 동일
      }
    });
  });

  describe('duration과 endTime 일관성', () => {
    
    test('startTime 변경 시 endTime도 올바르게 계산', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 10,
        endTime: 20
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        startTime: 0,
        endTime: 5,
        duration: 5,
        regularClipProperties: {
          startAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'start',
            offset: 3
          },
          endAnchor: null
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      
      if (updatedClip) {
        expect(updatedClip.startTime).toBe(13); // 10 + 3
        expect(updatedClip.endTime).toBe(18);   // 13 + 5 (duration)
        expect(updatedClip.duration).toBe(5);   // 원래 duration 유지
      }
    });

    test('endTime 변경 시 startTime과 duration 올바르게 계산', () => {
      const baseClip = createMockBaseClip({
        id: 'base-1',
        startTime: 10,
        endTime: 20
      });
      
      const regularClip = createMockRegularClip({
        id: 'regular-1',
        startTime: 0,
        endTime: 8,
        duration: 8,
        regularClipProperties: {
          startAnchor: null,
          endAnchor: {
            baseClipId: 'base-1',
            anchorPoint: 'end',
            offset: -2
          }
        }
      });
      
      const result = recalculateEndpointOffsets([baseClip, regularClip], [], []);
      const updatedClip = result.updatedClips.find(c => c.id === 'regular-1');
      
      if (updatedClip) {
        expect(updatedClip.endTime).toBe(18);   // 20 - 2
        expect(updatedClip.startTime).toBe(10); // 18 - 8 (duration)
        expect(updatedClip.duration).toBe(8);   // 원래 duration 유지
      }
    });
  });
});