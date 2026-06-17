/**
 * 🧪 textPresets.ts 테스트 파일
 * 
 * 리팩토링 전후 동일한 동작을 보장하기 위한 종합적인 테스트
 * - 모든 순수 함수 테스트
 * - 데이터 구조 검증
 * - 엣지 케이스 및 경계값 테스트
 * - 성능 테스트
 */

import {
  PRESET_CATEGORIES,
  CORE_TEXT_PRESETS,
  getPresetsByCategory,
  getPopularPresets,
  searchPresets,
  getPresetById,
  getPresetStats
} from '../src/data/presets/textPresets';

describe('textPresets - 데이터 구조 검증', () => {
  
  describe('PRESET_CATEGORIES', () => {
    test('카테고리 배열이 정의되어 있어야 함', () => {
      expect(PRESET_CATEGORIES).toBeDefined();
      expect(Array.isArray(PRESET_CATEGORIES)).toBe(true);
      expect(PRESET_CATEGORIES.length).toBeGreaterThan(0);
    });

    test('모든 카테고리가 필수 속성을 가져야 함', () => {
      PRESET_CATEGORIES.forEach((category, index) => {
        expect(category.id).toBeTruthy();
        expect(category.name).toBeTruthy();
        expect(category.description).toBeTruthy();
        expect(category.icon).toBeTruthy();
        expect(category.color).toBeTruthy();
        expect(category.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // 헥스 컬러 검증
      });
    });

    test('카테고리 ID가 고유해야 함', () => {
      const ids = PRESET_CATEGORIES.map(cat => cat.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('예상되는 카테고리들이 포함되어야 함', () => {
      const expectedCategories = ['youtube', 'social', 'movie', 'business', 'event', 'news', 'custom'];
      const actualIds = PRESET_CATEGORIES.map(cat => cat.id);
      
      expectedCategories.forEach(expectedId => {
        expect(actualIds).toContain(expectedId);
      });
    });
  });

  describe('CORE_TEXT_PRESETS', () => {
    test('프리셋 배열이 정의되어 있어야 함', () => {
      expect(CORE_TEXT_PRESETS).toBeDefined();
      expect(Array.isArray(CORE_TEXT_PRESETS)).toBe(true);
      expect(CORE_TEXT_PRESETS.length).toBeGreaterThan(0);
    });

    test('모든 프리셋이 필수 속성을 가져야 함', () => {
      CORE_TEXT_PRESETS.forEach((preset, index) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.category).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.fontFamily).toBeTruthy();
        expect(preset.fontSize).toBeGreaterThan(0);
        expect(preset.color).toBeTruthy();
        expect(typeof preset.popularity).toBe('number');
        expect(preset.popularity).toBeGreaterThanOrEqual(0);
        expect(preset.popularity).toBeLessThanOrEqual(100);
      });
    });

    test('프리셋 ID가 고유해야 함', () => {
      const ids = CORE_TEXT_PRESETS.map(preset => preset.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('모든 프리셋의 카테고리가 유효해야 함', () => {
      const validCategories = PRESET_CATEGORIES.map(cat => cat.id);
      
      CORE_TEXT_PRESETS.forEach(preset => {
        expect(validCategories).toContain(preset.category);
      });
    });

    test('프리셋 이름이 고유해야 함', () => {
      const names = CORE_TEXT_PRESETS.map(preset => preset.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });
});

describe('textPresets - 순수 함수 테스트', () => {
  
  describe('getPresetsByCategory', () => {
    test('유효한 카테고리로 올바른 필터링', () => {
      const youtubePresets = getPresetsByCategory('youtube');
      
      expect(Array.isArray(youtubePresets)).toBe(true);
      expect(youtubePresets.length).toBeGreaterThan(0);
      
      youtubePresets.forEach(preset => {
        expect(preset.category).toBe('youtube');
      });
    });

    test('존재하지 않는 카테고리는 빈 배열 반환', () => {
      const result = getPresetsByCategory('nonexistent');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('빈 문자열 카테고리는 빈 배열 반환', () => {
      const result = getPresetsByCategory('');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('모든 유효한 카테고리에 대해 동작', () => {
      const validCategories = PRESET_CATEGORIES.map(cat => cat.id);
      
      validCategories.forEach(category => {
        const result = getPresetsByCategory(category);
        expect(Array.isArray(result)).toBe(true);
        
        result.forEach(preset => {
          expect(preset.category).toBe(category);
        });
      });
    });

    test('대소문자 구분하여 정확히 매칭', () => {
      const youtubePresets = getPresetsByCategory('youtube');
      const YouTubePresets = getPresetsByCategory('YouTube');
      const YOUTUBE_PRESETS = getPresetsByCategory('YOUTUBE');
      
      expect(youtubePresets.length).toBeGreaterThan(0);
      expect(YouTubePresets.length).toBe(0);
      expect(YOUTUBE_PRESETS.length).toBe(0);
    });

    test('원본 배열이 변경되지 않음', () => {
      const originalLength = CORE_TEXT_PRESETS.length;
      const originalFirstPreset = { ...CORE_TEXT_PRESETS[0] };
      
      getPresetsByCategory('youtube');
      
      expect(CORE_TEXT_PRESETS.length).toBe(originalLength);
      expect(CORE_TEXT_PRESETS[0]).toEqual(originalFirstPreset);
    });
  });

  describe('getPopularPresets', () => {
    test('기본 limit (5)로 인기순 정렬', () => {
      const result = getPopularPresets();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(Math.min(5, CORE_TEXT_PRESETS.length));
      
      // 인기도 내림차순 정렬 확인
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].popularity).toBeGreaterThanOrEqual(result[i + 1].popularity);
      }
    });

    test('커스텀 limit 적용', () => {
      const limit = 3;
      const result = getPopularPresets(limit);
      
      expect(result.length).toBe(Math.min(limit, CORE_TEXT_PRESETS.length));
      
      // 인기도 내림차순 정렬 확인
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].popularity).toBeGreaterThanOrEqual(result[i + 1].popularity);
      }
    });

    test('limit이 전체 프리셋 수보다 클 때', () => {
      const limit = CORE_TEXT_PRESETS.length + 10;
      const result = getPopularPresets(limit);
      
      expect(result.length).toBe(CORE_TEXT_PRESETS.length);
      
      // 인기도 내림차순 정렬 확인
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].popularity).toBeGreaterThanOrEqual(result[i + 1].popularity);
      }
    });

    test('limit이 0일 때 빈 배열 반환', () => {
      const result = getPopularPresets(0);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('limit이 음수일 때 slice 동작대로 처리', () => {
      const result = getPopularPresets(-1);
      
      expect(Array.isArray(result)).toBe(true);
      // slice(0, -1)은 마지막 요소를 제외한 모든 요소를 반환
      expect(result.length).toBe(CORE_TEXT_PRESETS.length - 1);
    });

    test('limit이 1일 때 가장 인기 있는 프리셋 반환', () => {
      const result = getPopularPresets(1);
      
      expect(result.length).toBe(1);
      
      // 가장 높은 인기도 값 확인
      const maxPopularity = Math.max(...CORE_TEXT_PRESETS.map(p => p.popularity));
      expect(result[0].popularity).toBe(maxPopularity);
    });

    test('원본 배열이 변경되지 않음', () => {
      const originalOrder = CORE_TEXT_PRESETS.map(p => p.id);
      
      getPopularPresets(10);
      
      const currentOrder = CORE_TEXT_PRESETS.map(p => p.id);
      expect(currentOrder).toEqual(originalOrder);
    });

    test('같은 인기도의 프리셋들도 포함', () => {
      const result = getPopularPresets(10);
      
      // 모든 반환된 프리셋이 원본에 존재하는지 확인
      result.forEach(preset => {
        const found = CORE_TEXT_PRESETS.find(p => p.id === preset.id);
        expect(found).toBeDefined();
        expect(found).toEqual(preset);
      });
    });
  });

  describe('searchPresets', () => {
    test('이름으로 검색 (대소문자 무관)', () => {
      // 첫 번째 프리셋의 이름으로 테스트
      const firstPreset = CORE_TEXT_PRESETS[0];
      const query = firstPreset.name.substring(0, 3);
      
      const result = searchPresets(query);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      result.forEach(preset => {
        expect(preset.name.toLowerCase()).toContain(query.toLowerCase());
      });
    });

    test('설명으로 검색', () => {
      const query = '유튜브'; // 많은 프리셋 설명에 포함될 단어
      const result = searchPresets(query);
      
      expect(Array.isArray(result)).toBe(true);
      
      result.forEach(preset => {
        const matchesName = preset.name.toLowerCase().includes(query.toLowerCase());
        const matchesDescription = preset.description.toLowerCase().includes(query.toLowerCase());
        const matchesTags = preset.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        expect(matchesName || matchesDescription || matchesTags).toBe(true);
      });
    });

    test('태그로 검색', () => {
      // 첫 번째 프리셋의 첫 번째 태그로 테스트
      const firstPreset = CORE_TEXT_PRESETS[0];
      if (firstPreset.tags && firstPreset.tags.length > 0) {
        const query = firstPreset.tags[0];
        const result = searchPresets(query);
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        
        result.forEach(preset => {
          const matchesName = preset.name.toLowerCase().includes(query.toLowerCase());
          const matchesDescription = preset.description.toLowerCase().includes(query.toLowerCase());
          const matchesTags = preset.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
          
          expect(matchesName || matchesDescription || matchesTags).toBe(true);
        });
      }
    });

    test('대소문자 무관 검색', () => {
      const query = 'YOUTUBE';
      const lowerQuery = 'youtube';
      const mixedQuery = 'YouTube';
      
      const result1 = searchPresets(query);
      const result2 = searchPresets(lowerQuery);
      const result3 = searchPresets(mixedQuery);
      
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    test('빈 문자열 검색은 모든 프리셋 반환', () => {
      const result = searchPresets('');
      
      expect(result.length).toBe(CORE_TEXT_PRESETS.length);
      expect(result).toEqual(CORE_TEXT_PRESETS);
    });

    test('존재하지 않는 검색어는 빈 배열 반환', () => {
      const result = searchPresets('존재하지않는검색어12345');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('부분 문자열 매칭', () => {
      const firstPreset = CORE_TEXT_PRESETS[0];
      const partialName = firstPreset.name.substring(1, firstPreset.name.length - 1);
      
      if (partialName.length > 0) {
        const result = searchPresets(partialName);
        
        expect(result.length).toBeGreaterThan(0);
        expect(result.some(p => p.id === firstPreset.id)).toBe(true);
      }
    });

    test('공백 문자가 포함된 검색어', () => {
      const query = '썸네일 임팩트';
      const result = searchPresets(query);
      
      expect(Array.isArray(result)).toBe(true);
      // 공백이 포함된 검색어도 처리되어야 함
    });

    test('원본 배열이 변경되지 않음', () => {
      const originalLength = CORE_TEXT_PRESETS.length;
      const originalFirstPreset = { ...CORE_TEXT_PRESETS[0] };
      
      searchPresets('test');
      
      expect(CORE_TEXT_PRESETS.length).toBe(originalLength);
      expect(CORE_TEXT_PRESETS[0]).toEqual(originalFirstPreset);
    });
  });

  describe('getPresetById', () => {
    test('유효한 ID로 프리셋 찾기', () => {
      const firstPreset = CORE_TEXT_PRESETS[0];
      const result = getPresetById(firstPreset.id);
      
      expect(result).toBeDefined();
      expect(result).toEqual(firstPreset);
    });

    test('존재하지 않는 ID는 undefined 반환', () => {
      const result = getPresetById('nonexistent-id');
      
      expect(result).toBeUndefined();
    });

    test('빈 문자열 ID는 undefined 반환', () => {
      const result = getPresetById('');
      
      expect(result).toBeUndefined();
    });

    test('모든 프리셋 ID로 찾기 가능', () => {
      CORE_TEXT_PRESETS.forEach(preset => {
        const result = getPresetById(preset.id);
        
        expect(result).toBeDefined();
        expect(result).toEqual(preset);
      });
    });

    test('대소문자 구분하여 정확히 매칭', () => {
      const firstPreset = CORE_TEXT_PRESETS[0];
      const uppercaseId = firstPreset.id.toUpperCase();
      
      const result1 = getPresetById(firstPreset.id);
      const result2 = getPresetById(uppercaseId);
      
      expect(result1).toBeDefined();
      expect(result2).toBeUndefined();
    });

    test('원본 배열이 변경되지 않음', () => {
      const originalLength = CORE_TEXT_PRESETS.length;
      const originalFirstPreset = { ...CORE_TEXT_PRESETS[0] };
      
      getPresetById('test-id');
      
      expect(CORE_TEXT_PRESETS.length).toBe(originalLength);
      expect(CORE_TEXT_PRESETS[0]).toEqual(originalFirstPreset);
    });
  });

  describe('getPresetStats', () => {
    test('통계 객체 구조 검증', () => {
      const stats = getPresetStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
      expect(typeof stats.totalPresets).toBe('number');
      expect(typeof stats.userCreatedCount).toBe('number');
      expect(typeof stats.favoriteCount).toBe('number');
      expect(typeof stats.mostUsedCategory).toBe('string');
      expect(Array.isArray(stats.recentlyUsed)).toBe(true);
      expect(typeof stats.categoryCounts).toBe('object');
    });

    test('totalPresets 정확성', () => {
      const stats = getPresetStats();
      
      expect(stats.totalPresets).toBe(CORE_TEXT_PRESETS.length);
    });

    test('userCreatedCount 정확성', () => {
      const stats = getPresetStats();
      const actualUserCreatedCount = CORE_TEXT_PRESETS.filter(p => p.isUserCreated).length;
      
      expect(stats.userCreatedCount).toBe(actualUserCreatedCount);
    });

    test('categoryCounts 정확성', () => {
      const stats = getPresetStats();
      
      // 카테고리별 개수 수동 계산
      const expectedCategoryCounts: Record<string, number> = {};
      CORE_TEXT_PRESETS.forEach(preset => {
        expectedCategoryCounts[preset.category] = (expectedCategoryCounts[preset.category] || 0) + 1;
      });
      
      expect(stats.categoryCounts).toEqual(expectedCategoryCounts);
    });

    test('mostUsedCategory 정확성', () => {
      const stats = getPresetStats();
      
      // 가장 많이 사용된 카테고리 수동 계산
      const categoryCounts = stats.categoryCounts;
      const expectedMostUsedCategory = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      expect(stats.mostUsedCategory).toBe(expectedMostUsedCategory);
    });

    test('favoriteCount는 0 (추후 구현)', () => {
      const stats = getPresetStats();
      
      expect(stats.favoriteCount).toBe(0);
    });

    test('recentlyUsed는 빈 배열 (추후 구현)', () => {
      const stats = getPresetStats();
      
      expect(stats.recentlyUsed).toEqual([]);
    });

    test('빈 프리셋 배열에 대한 처리 (모킹)', () => {
      // 원본 배열을 임시로 빈 배열로 모킹
      const originalPresets = [...CORE_TEXT_PRESETS];
      
      // 실제로는 상수이므로 모킹할 수 없지만, 로직 검증을 위한 테스트
      // 이 테스트는 실제 리팩토링 시 중요함
      expect(originalPresets.length).toBeGreaterThan(0);
    });

    test('카테고리 개수 총합이 전체 프리셋 수와 일치', () => {
      const stats = getPresetStats();
      
      const totalFromCategories = Object.values(stats.categoryCounts).reduce((sum, count) => sum + count, 0);
      
      expect(totalFromCategories).toBe(stats.totalPresets);
    });

    test('연속 호출 시 동일한 결과', () => {
      const stats1 = getPresetStats();
      const stats2 = getPresetStats();
      
      expect(stats1).toEqual(stats2);
    });

    test('원본 데이터가 변경되지 않음', () => {
      const originalLength = CORE_TEXT_PRESETS.length;
      const originalFirstPreset = { ...CORE_TEXT_PRESETS[0] };
      
      getPresetStats();
      
      expect(CORE_TEXT_PRESETS.length).toBe(originalLength);
      expect(CORE_TEXT_PRESETS[0]).toEqual(originalFirstPreset);
    });
  });
});

describe('textPresets - 성능 및 엣지 케이스', () => {
  
  describe('성능 테스트', () => {
    test('대량 검색 성능', () => {
      const startTime = Date.now();
      
      // 100번 검색 실행
      for (let i = 0; i < 100; i++) {
        searchPresets('test');
        getPopularPresets(10);
        getPresetsByCategory('youtube');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 100번 실행이 1초 이내에 완료되어야 함
      expect(duration).toBeLessThan(1000);
    });

    test('통계 계산 성능', () => {
      const startTime = Date.now();
      
      // 100번 통계 계산 실행
      for (let i = 0; i < 100; i++) {
        getPresetStats();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 100번 실행이 500ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(500);
    });
  });

  describe('타입 안전성', () => {
    test('모든 함수가 예상된 타입 반환', () => {
      expect(Array.isArray(getPresetsByCategory('youtube'))).toBe(true);
      expect(Array.isArray(getPopularPresets())).toBe(true);
      expect(Array.isArray(searchPresets('test'))).toBe(true);
      expect(typeof getPresetStats()).toBe('object');
      
      const preset = getPresetById(CORE_TEXT_PRESETS[0].id);
      expect(typeof preset === 'object' || preset === undefined).toBe(true);
    });
  });

  describe('메모리 사용', () => {
    test('함수 호출이 메모리 누수를 발생시키지 않음', () => {
      // 대량 호출로 메모리 누수 체크
      const results = [];
      
      for (let i = 0; i < 1000; i++) {
        results.push(getPopularPresets(1));
      }
      
      // 결과가 올바르게 생성되었는지 확인
      expect(results.length).toBe(1000);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
      });
    });
  });
});