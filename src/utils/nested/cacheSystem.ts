// === 중첩 Bundle 성능 최적화 캐시 시스템 === //

import type { 
  NestedBundle, 
  NestedTemplateGroup, 
  BundleHierarchyNode,
  NestedBundleRelation,
  TimelineSegment
} from '../../types/nested';

/**
 * 캐시 엔트리 정보
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;               // 메모리 사용량 (bytes)
  dependencies: string[];     // 의존성 키들
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 캐시 통계 정보
 */
interface CacheStatistics {
  totalEntries: number;
  totalMemoryUsage: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  averageAccessTime: number;
  mostAccessedKeys: string[];
  recentlyEvicted: string[];
}

/**
 * 캐시 설정
 */
interface CacheConfig {
  maxMemoryUsage: number;     // 최대 메모리 사용량 (bytes)
  maxEntries: number;         // 최대 엔트리 수
  defaultTTL: number;         // 기본 TTL (ms)
  cleanupInterval: number;    // 정리 간격 (ms)
  evictionStrategy: 'lru' | 'lfu' | 'ttl' | 'size'; // 제거 전략
  compressionEnabled: boolean; // 압축 사용 여부
}

/**
 * 고성능 중첩 Bundle 캐시 관리자
 */
export class NestedBundleCacheManager {
  private caches: Map<string, Map<string, CacheEntry<any>>> = new Map();
  private statistics: Map<string, CacheStatistics> = new Map();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  // 캐시 카테고리들
  private readonly CACHE_CATEGORIES = {
    HIERARCHY: 'hierarchy',           // 계층 구조 캐시
    BUNDLES: 'bundles',              // Bundle 객체 캐시
    RELATIONS: 'relations',          // 관계 정보 캐시
    TIMELINE: 'timeline',            // 타임라인 세그먼트 캐시
    QUERIES: 'queries',              // 쿼리 결과 캐시
    COMPUTED: 'computed'             // 계산된 값 캐시
  } as const;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      defaultTTL: 5 * 60 * 1000,        // 5분
      cleanupInterval: 60 * 1000,       // 1분
      evictionStrategy: 'lru',
      compressionEnabled: false,
      ...config
    };

    this.initializeCaches();
    this.startCleanupTimer();

    console.log('🚀 중첩 Bundle 캐시 시스템 초기화:', {
      maxMemory: `${this.config.maxMemoryUsage / 1024 / 1024}MB`,
      maxEntries: this.config.maxEntries,
      ttl: `${this.config.defaultTTL / 1000}초`,
      strategy: this.config.evictionStrategy
    });
  }

  /**
   * 캐시 초기화
   */
  private initializeCaches(): void {
    Object.values(this.CACHE_CATEGORIES).forEach(category => {
      this.caches.set(category, new Map());
      this.statistics.set(category, {
        totalEntries: 0,
        totalMemoryUsage: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        averageAccessTime: 0,
        mostAccessedKeys: [],
        recentlyEvicted: []
      });
    });
  }

  /**
   * 계층 구조 캐시
   */
  async cacheHierarchy(bundleId: string, hierarchy: BundleHierarchyNode[]): Promise<void> {
    const key = `hierarchy-${bundleId}`;
    await this.set(this.CACHE_CATEGORIES.HIERARCHY, key, hierarchy, {
      priority: 'high',
      dependencies: [bundleId]
    });
  }

  /**
   * 계층 구조 조회
   */
  async getHierarchy(bundleId: string): Promise<BundleHierarchyNode[] | null> {
    const key = `hierarchy-${bundleId}`;
    return await this.get(this.CACHE_CATEGORIES.HIERARCHY, key);
  }

  /**
   * Bundle 플래트닝 결과 캐시
   */
  async cacheFlattenedBundle(bundleId: string, flattenedData: {
    clipIds: string[];
    timelineSegments: TimelineSegment[];
    elementCount: number;
  }): Promise<void> {
    const key = `flattened-${bundleId}`;
    await this.set(this.CACHE_CATEGORIES.BUNDLES, key, flattenedData, {
      priority: 'medium',
      dependencies: [bundleId]
    });
  }

  /**
   * 플래트닝 결과 조회
   */
  async getFlattenedBundle(bundleId: string): Promise<{
    clipIds: string[];
    timelineSegments: TimelineSegment[];
    elementCount: number;
  } | null> {
    const key = `flattened-${bundleId}`;
    return await this.get(this.CACHE_CATEGORIES.BUNDLES, key);
  }

  /**
   * 관계 쿼리 결과 캐시
   */
  async cacheRelationQuery(queryKey: string, result: {
    ancestors?: string[];
    descendants?: string[];
    siblings?: string[];
    depth?: number;
  }): Promise<void> {
    await this.set(this.CACHE_CATEGORIES.QUERIES, queryKey, result, {
      priority: 'medium',
      ttl: this.config.defaultTTL / 2 // 관계는 더 자주 변경될 수 있음
    });
  }

  /**
   * 관계 쿼리 결과 조회
   */
  async getRelationQuery(queryKey: string): Promise<{
    ancestors?: string[];
    descendants?: string[];
    siblings?: string[];
    depth?: number;
  } | null> {
    return await this.get(this.CACHE_CATEGORIES.QUERIES, queryKey);
  }

  /**
   * 타임라인 세그먼트 캐시
   */
  async cacheTimelineSegments(bundleId: string, segments: TimelineSegment[]): Promise<void> {
    const key = `timeline-${bundleId}`;
    await this.set(this.CACHE_CATEGORIES.TIMELINE, key, segments, {
      priority: 'high',
      dependencies: [bundleId]
    });
  }

  /**
   * 타임라인 세그먼트 조회
   */
  async getTimelineSegments(bundleId: string): Promise<TimelineSegment[] | null> {
    const key = `timeline-${bundleId}`;
    return await this.get(this.CACHE_CATEGORIES.TIMELINE, key);
  }

  /**
   * 계산된 값 캐시 (복잡한 연산 결과)
   */
  async cacheComputedValue(computationKey: string, value: any, dependencies: string[] = []): Promise<void> {
    await this.set(this.CACHE_CATEGORIES.COMPUTED, computationKey, value, {
      priority: 'low',
      dependencies,
      ttl: this.config.defaultTTL * 2 // 계산 결과는 더 오래 캐시
    });
  }

  /**
   * 계산된 값 조회
   */
  async getComputedValue(computationKey: string): Promise<any> {
    return await this.get(this.CACHE_CATEGORIES.COMPUTED, computationKey);
  }

  /**
   * 일반적인 캐시 저장
   */
  private async set(
    category: string, 
    key: string, 
    data: any, 
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      ttl?: number;
      dependencies?: string[];
    } = {}
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const cache = this.caches.get(category);
      if (!cache) {
        throw new Error(`Unknown cache category: ${category}`);
      }

      // 데이터 크기 계산
      const size = this.calculateDataSize(data);
      
      // 메모리 제한 확인
      await this.ensureMemoryLimit(category, size);

      // 캐시 엔트리 생성
      const entry: CacheEntry<any> = {
        data,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        dependencies: options.dependencies || [],
        priority: options.priority || 'medium'
      };

      // TTL 설정
      if (options.ttl) {
        setTimeout(() => {
          this.delete(category, key);
        }, options.ttl);
      } else {
        setTimeout(() => {
          this.delete(category, key);
        }, this.config.defaultTTL);
      }

      cache.set(key, entry);
      
      // 통계 업데이트
      this.updateStatistics(category, 'set', performance.now() - startTime);

      console.log('💾 캐시 저장:', {
        category,
        key: key.slice(0, 20) + '...',
        size: `${(size / 1024).toFixed(2)}KB`,
        priority: options.priority,
        dependencies: options.dependencies?.length || 0
      });

    } catch (error) {
      console.error('❌ 캐시 저장 실패:', { category, key, error });
    }
  }

  /**
   * 일반적인 캐시 조회
   */
  private async get<T>(category: string, key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      const cache = this.caches.get(category);
      if (!cache) {
        this.updateStatistics(category, 'miss', performance.now() - startTime);
        return null;
      }

      const entry = cache.get(key);
      if (!entry) {
        this.updateStatistics(category, 'miss', performance.now() - startTime);
        return null;
      }

      // TTL 확인
      if (this.isExpired(entry)) {
        cache.delete(key);
        this.updateStatistics(category, 'miss', performance.now() - startTime);
        return null;
      }

      // 액세스 정보 업데이트
      entry.accessCount++;
      entry.lastAccessed = Date.now();

      this.updateStatistics(category, 'hit', performance.now() - startTime);

      console.log('🎯 캐시 히트:', {
        category,
        key: key.slice(0, 20) + '...',
        accessCount: entry.accessCount,
        age: `${Math.round((Date.now() - entry.timestamp) / 1000)}초`
      });

      return entry.data;

    } catch (error) {
      console.error('❌ 캐시 조회 실패:', { category, key, error });
      this.updateStatistics(category, 'miss', performance.now() - startTime);
      return null;
    }
  }

  /**
   * 캐시 삭제
   */
  delete(category: string, key: string): boolean {
    const cache = this.caches.get(category);
    if (!cache) return false;

    const deleted = cache.delete(key);
    if (deleted) {
      console.log('🗑️ 캐시 삭제:', { category, key: key.slice(0, 20) + '...' });
    }
    return deleted;
  }

  /**
   * 의존성 기반 캐시 무효화
   */
  invalidateByDependency(dependencyKey: string): number {
    let invalidatedCount = 0;

    for (const [category, cache] of this.caches) {
      const keysToDelete: string[] = [];

      for (const [key, entry] of cache) {
        if (entry.dependencies.includes(dependencyKey)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        cache.delete(key);
        invalidatedCount++;
      }
    }

    console.log('🔄 의존성 기반 캐시 무효화:', {
      dependency: dependencyKey,
      invalidatedCount
    });

    return invalidatedCount;
  }

  /**
   * 메모리 제한 확인 및 정리
   */
  private async ensureMemoryLimit(category: string, requiredSize: number): Promise<void> {
    const totalMemoryUsage = this.getTotalMemoryUsage();
    
    if (totalMemoryUsage + requiredSize > this.config.maxMemoryUsage) {
      const memoryToFree = (totalMemoryUsage + requiredSize) - this.config.maxMemoryUsage;
      await this.evictEntries(memoryToFree);
    }

    const cache = this.caches.get(category);
    if (cache && cache.size >= this.config.maxEntries) {
      await this.evictEntriesFromCategory(category, 1);
    }
  }

  /**
   * 엔트리 제거 (전략에 따라)
   */
  private async evictEntries(targetSize: number): Promise<void> {
    let freedSize = 0;
    const entriesToEvict: Array<{ category: string; key: string; entry: CacheEntry<any> }> = [];

    // 모든 캐시에서 엔트리 수집
    for (const [category, cache] of this.caches) {
      for (const [key, entry] of cache) {
        entriesToEvict.push({ category, key, entry });
      }
    }

    // 제거 전략에 따라 정렬
    switch (this.config.evictionStrategy) {
      case 'lru':
        entriesToEvict.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
        break;
      case 'lfu':
        entriesToEvict.sort((a, b) => a.entry.accessCount - b.entry.accessCount);
        break;
      case 'size':
        entriesToEvict.sort((a, b) => b.entry.size - a.entry.size);
        break;
      case 'ttl':
        entriesToEvict.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
        break;
    }

    // 우선순위 고려 (critical은 마지막에 제거)
    entriesToEvict.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[a.entry.priority] - priorityOrder[b.entry.priority];
    });

    // 필요한 만큼 제거
    for (const { category, key, entry } of entriesToEvict) {
      if (freedSize >= targetSize) break;

      this.delete(category, key);
      freedSize += entry.size;
    }

    console.log('🧹 캐시 제거 완료:', {
      strategy: this.config.evictionStrategy,
      targetSize: `${(targetSize / 1024).toFixed(2)}KB`,
      freedSize: `${(freedSize / 1024).toFixed(2)}KB`,
      removedEntries: Math.min(entriesToEvict.length, freedSize / 1024)
    });
  }

  /**
   * 특정 카테고리에서 엔트리 제거
   */
  private async evictEntriesFromCategory(category: string, count: number): Promise<void> {
    const cache = this.caches.get(category);
    if (!cache) return;

    const entries = Array.from(cache.entries());
    
    // LRU 기준으로 정렬
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [key] = entries[i];
      cache.delete(key);
    }
  }

  /**
   * TTL 만료 확인
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.config.defaultTTL;
  }

  /**
   * 데이터 크기 계산
   */
  private calculateDataSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // UTF-16 기준
    } catch {
      return 1024; // 기본값
    }
  }

  /**
   * 전체 메모리 사용량 계산
   */
  private getTotalMemoryUsage(): number {
    let total = 0;
    for (const cache of this.caches.values()) {
      for (const entry of cache.values()) {
        total += entry.size;
      }
    }
    return total;
  }

  /**
   * 통계 업데이트
   */
  private updateStatistics(category: string, operation: 'hit' | 'miss' | 'set', accessTime: number): void {
    const stats = this.statistics.get(category);
    if (!stats) return;

    if (operation === 'hit') {
      stats.hitCount++;
    } else if (operation === 'miss') {
      stats.missCount++;
    }

    const totalRequests = stats.hitCount + stats.missCount;
    stats.hitRate = totalRequests > 0 ? stats.hitCount / totalRequests : 0;
    
    // 평균 액세스 시간 업데이트 (지수 이동 평균)
    stats.averageAccessTime = stats.averageAccessTime * 0.9 + accessTime * 0.1;

    const cache = this.caches.get(category);
    if (cache) {
      stats.totalEntries = cache.size;
      stats.totalMemoryUsage = Array.from(cache.values())
        .reduce((sum, entry) => sum + entry.size, 0);
    }
  }

  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 만료된 엔트리 정리
   */
  private cleanup(): void {
    let cleanedCount = 0;

    for (const [category, cache] of this.caches) {
      const keysToDelete: string[] = [];

      for (const [key, entry] of cache) {
        if (this.isExpired(entry)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log('🧹 정기 캐시 정리:', { cleanedCount });
    }
  }

  /**
   * 캐시 통계 조회
   */
  getStatistics(): Map<string, CacheStatistics> {
    return new Map(this.statistics);
  }

  /**
   * 전체 캐시 통계
   */
  getOverallStatistics(): {
    totalMemoryUsage: string;
    totalEntries: number;
    overallHitRate: number;
    categoriesCount: number;
  } {
    let totalEntries = 0;
    let totalHits = 0;
    let totalRequests = 0;

    for (const stats of this.statistics.values()) {
      totalEntries += stats.totalEntries;
      totalHits += stats.hitCount;
      totalRequests += stats.hitCount + stats.missCount;
    }

    return {
      totalMemoryUsage: `${(this.getTotalMemoryUsage() / 1024 / 1024).toFixed(2)}MB`,
      totalEntries,
      overallHitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      categoriesCount: this.caches.size
    };
  }

  /**
   * 캐시 초기화
   */
  clear(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }

    for (const stats of this.statistics.values()) {
      stats.totalEntries = 0;
      stats.totalMemoryUsage = 0;
      stats.hitCount = 0;
      stats.missCount = 0;
      stats.hitRate = 0;
    }

    console.log('🧹 전체 캐시 초기화 완료');
  }

  /**
   * 캐시 시스템 종료
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.clear();
    console.log('⛔ 캐시 시스템 종료');
  }
}

/**
 * 캐시 성능 모니터
 */
export class CachePerformanceMonitor {
  private metrics: Array<{
    timestamp: number;
    category: string;
    operation: string;
    duration: number;
    cacheSize: number;
    memoryUsage: number;
  }> = [];

  private maxMetrics = 1000;

  recordMetric(
    category: string,
    operation: string,
    duration: number,
    cacheSize: number,
    memoryUsage: number
  ): void {
    this.metrics.push({
      timestamp: Date.now(),
      category,
      operation,
      duration,
      cacheSize,
      memoryUsage
    });

    // 오래된 메트릭 제거
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getPerformanceReport(): {
    averageAccessTime: number;
    slowestOperations: Array<{ category: string; operation: string; duration: number }>;
    memoryTrend: Array<{ timestamp: number; usage: number }>;
    operationFrequency: Map<string, number>;
  } {
    const recentMetrics = this.metrics.slice(-100); // 최근 100개

    const averageAccessTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;

    const slowestOperations = recentMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(m => ({ category: m.category, operation: m.operation, duration: m.duration }));

    const memoryTrend = recentMetrics
      .filter((_, i) => i % 10 === 0) // 10번째마다 샘플링
      .map(m => ({ timestamp: m.timestamp, usage: m.memoryUsage }));

    const operationFrequency = new Map<string, number>();
    for (const metric of recentMetrics) {
      const key = `${metric.category}:${metric.operation}`;
      operationFrequency.set(key, (operationFrequency.get(key) || 0) + 1);
    }

    return {
      averageAccessTime,
      slowestOperations,
      memoryTrend,
      operationFrequency
    };
  }
}

// 🎉 중첩 Bundle 캐시 시스템 v1.0.0 준비 완료!
console.log('⚡ 중첩 Bundle 캐시 시스템 로드됨');
