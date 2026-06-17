/**
 * @fileoverview 계층 구조 실시간 업데이트 시스템
 * @description 중첩 Bundle의 계층 구조를 실시간으로 업데이트하고 동기화하는 시스템
 * @version 1.0.0
 * @created 2025-06-22
 */

import {
  BundleElement,
  NestedBundle,
  BundleHierarchyNode,
  NestedBundleRelation,
  RelationshipType
} from '../../../types/nested';

import { TimelineTrack } from '../../../types/timeline';

// ===== 실시간 업데이트 이벤트 정의 =====

/**
 * 계층 구조 변경 이벤트 타입
 */
type HierarchyChangeEventType = 
  | 'bundle_moved'
  | 'bundle_created'
  | 'bundle_deleted'
  | 'relation_created'
  | 'relation_updated'
  | 'relation_deleted'
  | 'hierarchy_rebuilt'
  | 'batch_update'
  | 'rollback'
  | 'sync_required';

/**
 * 계층 구조 변경 이벤트
 */
interface HierarchyChangeEvent {
  id: string;
  type: HierarchyChangeEventType;
  timestamp: number;
  bundleId?: string;
  relationId?: string;
  previousState?: any;
  newState?: any;
  affectedBundles: string[];
  affectedRelations: string[];
  metadata: {
    depth: number;
    priority: number;
    source: 'user' | 'system' | 'auto';
    batchId?: string;
  };
  performance: {
    processingTime: number;
    propagationTime: number;
    conflictResolutionTime: number;
  };
}

/**
 * 실시간 업데이트 구독자
 */
interface HierarchyUpdateSubscriber {
  id: string;
  name: string;
  eventTypes: HierarchyChangeEventType[];
  callback: (event: HierarchyChangeEvent) => Promise<void> | void;
  options: {
    immediate: boolean;
    batchUpdates: boolean;
    maxBatchSize: number;
    batchTimeoutMs: number;
  };
}

/**
 * 업데이트 배치 정보
 */
interface UpdateBatch {
  id: string;
  events: HierarchyChangeEvent[];
  startTime: number;
  maxWaitTime: number;
  maxBatchSize: number;
  timeout?: NodeJS.Timeout;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * 계층 동기화 상태
 */
interface HierarchySyncState {
  isInSync: boolean;
  lastSyncTimestamp: number;
  pendingUpdates: number;
  conflictCount: number;
  lastConflictResolution: number;
  syncQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  performance: {
    averageUpdateTime: number;
    averagePropagationTime: number;
    conflictResolutionTime: number;
    throughput: number; // events per second
  };
}

/**
 * 계층 업데이트 통계
 */
interface HierarchyUpdateStatistics {
  totalEvents: number;
  eventsByType: Map<HierarchyChangeEventType, number>;
  averageProcessingTime: number;
  averagePropagationTime: number;
  conflictRate: number;
  successRate: number;
  subscriberCount: number;
  batchEfficiency: number;
  performanceMetrics: {
    peakThroughput: number;
    averageThroughput: number;
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
  };
}

// ===== 실시간 계층 구조 업데이트 시스템 =====

/**
 * 실시간 계층 구조 업데이트 관리자
 */
export class RealTimeHierarchyUpdater {
  private subscribers: Map<string, HierarchyUpdateSubscriber> = new Map();
  private eventQueue: HierarchyChangeEvent[] = [];
  private updateBatches: Map<string, UpdateBatch> = new Map();
  private syncState: HierarchySyncState;
  private statistics: HierarchyUpdateStatistics;
  private conflictResolver: HierarchyConflictResolver;

  // 성능 및 설정
  private readonly config = {
    maxQueueSize: 10000,
    maxBatchSize: 100,
    defaultBatchTimeoutMs: 50,
    maxConcurrentBatches: 10,
    conflictDetectionEnabled: true,
    performanceMonitoring: true,
    autoCleanupIntervalMs: 60000,
    eventRetentionMs: 300000, // 5분
    priorityProcessing: true,
    realTimeUpdatesEnabled: true
  };

  // 이벤트 발생 추적
  private eventHistory: HierarchyChangeEvent[] = [];
  private performanceTracker: {
    recentLatencies: number[];
    throughputHistory: Array<{ timestamp: number; count: number }>;
  } = {
    recentLatencies: [],
    throughputHistory: []
  };

  constructor() {
    this.conflictResolver = new HierarchyConflictResolver();
    this.initializeSyncState();
    this.initializeStatistics();
    this.startAutoCleanup();
  }

  /**
   * 동기화 상태 초기화
   */
  private initializeSyncState(): void {
    this.syncState = {
      isInSync: true,
      lastSyncTimestamp: Date.now(),
      pendingUpdates: 0,
      conflictCount: 0,
      lastConflictResolution: 0,
      syncQuality: 'excellent',
      performance: {
        averageUpdateTime: 0,
        averagePropagationTime: 0,
        conflictResolutionTime: 0,
        throughput: 0
      }
    };
  }

  /**
   * 통계 초기화
   */
  private initializeStatistics(): void {
    this.statistics = {
      totalEvents: 0,
      eventsByType: new Map(),
      averageProcessingTime: 0,
      averagePropagationTime: 0,
      conflictRate: 0,
      successRate: 1.0,
      subscriberCount: 0,
      batchEfficiency: 0,
      performanceMetrics: {
        peakThroughput: 0,
        averageThroughput: 0,
        latencyP50: 0,
        latencyP95: 0,
        latencyP99: 0
      }
    };
  }

  /**
   * 구독자 등록
   */
  subscribe(
    id: string,
    name: string,
    eventTypes: HierarchyChangeEventType[],
    callback: (event: HierarchyChangeEvent) => Promise<void> | void,
    options?: Partial<HierarchyUpdateSubscriber['options']>
  ): void {
    const subscriber: HierarchyUpdateSubscriber = {
      id,
      name,
      eventTypes,
      callback,
      options: {
        immediate: false,
        batchUpdates: true,
        maxBatchSize: this.config.maxBatchSize,
        batchTimeoutMs: this.config.defaultBatchTimeoutMs,
        ...options
      }
    };

    this.subscribers.set(id, subscriber);
    this.statistics.subscriberCount = this.subscribers.size;

    console.log(`계층 업데이트 구독자 등록: ${name} (${id})`);
  }

  /**
   * 구독 해제
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
    this.statistics.subscriberCount = this.subscribers.size;
    console.log(`계층 업데이트 구독자 해제: ${id}`);
  }

  /**
   * 계층 구조 변경 이벤트 발생
   */
  async emitHierarchyChange(
    type: HierarchyChangeEventType,
    data: {
      bundleId?: string;
      relationId?: string;
      previousState?: any;
      newState?: any;
      affectedBundles?: string[];
      affectedRelations?: string[];
      priority?: number;
      source?: 'user' | 'system' | 'auto';
      batchId?: string;
    }
  ): Promise<void> {
    const eventStartTime = performance.now();

    const event: HierarchyChangeEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      bundleId: data.bundleId,
      relationId: data.relationId,
      previousState: data.previousState,
      newState: data.newState,
      affectedBundles: data.affectedBundles || [],
      affectedRelations: data.affectedRelations || [],
      metadata: {
        depth: this.calculateEventDepth(data.affectedBundles || []),
        priority: data.priority || 1,
        source: data.source || 'user',
        batchId: data.batchId
      },
      performance: {
        processingTime: 0,
        propagationTime: 0,
        conflictResolutionTime: 0
      }
    };

    // 큐 크기 제한 확인
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.warn('이벤트 큐가 가득참. 오래된 이벤트 제거 중...');
      this.eventQueue.shift();
    }

    // 이벤트 큐에 추가
    this.eventQueue.push(event);
    this.syncState.pendingUpdates++;

    // 충돌 감지 및 해결
    if (this.config.conflictDetectionEnabled) {
      const conflicts = await this.conflictResolver.detectConflicts(event, this.eventQueue);
      if (conflicts.length > 0) {
        const conflictStartTime = performance.now();
        await this.conflictResolver.resolveConflicts(conflicts);
        event.performance.conflictResolutionTime = performance.now() - conflictStartTime;
        this.syncState.conflictCount += conflicts.length;
        this.syncState.lastConflictResolution = Date.now();
      }
    }

    // 실시간 처리 또는 배치 처리
    if (this.config.realTimeUpdatesEnabled && event.metadata.priority >= 5) {
      await this.processEventImmediately(event);
    } else {
      await this.addToBatch(event);
    }

    // 성능 추적
    const totalProcessingTime = performance.now() - eventStartTime;
    event.performance.processingTime = totalProcessingTime;
    this.trackPerformance(event);

    // 이벤트 히스토리에 추가
    this.addToEventHistory(event);

    // 동기화 상태 업데이트
    this.updateSyncState();
  }

  /**
   * 이벤트 즉시 처리
   */
  private async processEventImmediately(event: HierarchyChangeEvent): Promise<void> {
    const propagationStartTime = performance.now();

    try {
      // 관련 구독자들에게 즉시 전파
      const relevantSubscribers = Array.from(this.subscribers.values()).filter(
        subscriber => subscriber.eventTypes.includes(event.type) && subscriber.options.immediate
      );

      const propagationPromises = relevantSubscribers.map(async subscriber => {
        try {
          await subscriber.callback(event);
        } catch (error) {
          console.error(`구독자 ${subscriber.name}에서 이벤트 처리 실패:`, error);
          this.handleSubscriberError(subscriber.id, event, error);
        }
      });

      await Promise.all(propagationPromises);

      event.performance.propagationTime = performance.now() - propagationStartTime;
      this.syncState.pendingUpdates--;

    } catch (error) {
      console.error('즉시 이벤트 처리 중 오류:', error);
      this.handleProcessingError(event, error);
    }
  }

  /**
   * 배치에 이벤트 추가
   */
  private async addToBatch(event: HierarchyChangeEvent): Promise<void> {
    const batchId = event.metadata.batchId || this.generateBatchId();
    let batch = this.updateBatches.get(batchId);

    if (!batch) {
      // 새 배치 생성
      batch = {
        id: batchId,
        events: [],
        startTime: Date.now(),
        maxWaitTime: this.config.defaultBatchTimeoutMs,
        maxBatchSize: this.config.maxBatchSize,
        status: 'pending'
      };
      this.updateBatches.set(batchId, batch);
    }

    batch.events.push(event);

    // 배치 크기 또는 시간 제한 확인
    if (batch.events.length >= batch.maxBatchSize) {
      await this.processBatch(batchId);
    } else if (!batch.timeout) {
      // 타임아웃 설정
      batch.timeout = setTimeout(() => {
        this.processBatch(batchId);
      }, batch.maxWaitTime);
    }
  }

  /**
   * 배치 처리
   */
  private async processBatch(batchId: string): Promise<void> {
    const batch = this.updateBatches.get(batchId);
    if (!batch || batch.status !== 'pending') return;

    batch.status = 'processing';
    const batchStartTime = performance.now();

    try {
      // 타임아웃 취소
      if (batch.timeout) {
        clearTimeout(batch.timeout);
        batch.timeout = undefined;
      }

      // 배치 이벤트들을 우선순위 순으로 정렬
      batch.events.sort((a, b) => b.metadata.priority - a.metadata.priority);

      // 관련 구독자들 찾기
      const affectedSubscribers = new Map<string, HierarchyChangeEvent[]>();
      
      for (const event of batch.events) {
        for (const [subscriberId, subscriber] of this.subscribers) {
          if (subscriber.eventTypes.includes(event.type) && !subscriber.options.immediate) {
            if (!affectedSubscribers.has(subscriberId)) {
              affectedSubscribers.set(subscriberId, []);
            }
            affectedSubscribers.get(subscriberId)!.push(event);
          }
        }
      }

      // 구독자별로 배치 이벤트 처리
      const propagationPromises = Array.from(affectedSubscribers.entries()).map(
        async ([subscriberId, events]) => {
          const subscriber = this.subscribers.get(subscriberId)!;
          
          if (subscriber.options.batchUpdates) {
            // 배치 업데이트로 처리
            try {
              await subscriber.callback({
                id: `batch_${batchId}`,
                type: 'batch_update',
                timestamp: Date.now(),
                affectedBundles: Array.from(new Set(events.flatMap(e => e.affectedBundles))),
                affectedRelations: Array.from(new Set(events.flatMap(e => e.affectedRelations))),
                metadata: {
                  depth: Math.max(...events.map(e => e.metadata.depth)),
                  priority: Math.max(...events.map(e => e.metadata.priority)),
                  source: 'system',
                  batchId
                },
                performance: {
                  processingTime: 0,
                  propagationTime: 0,
                  conflictResolutionTime: 0
                }
              });
            } catch (error) {
              console.error(`구독자 ${subscriber.name}에서 배치 처리 실패:`, error);
              this.handleSubscriberError(subscriberId, events[0], error);
            }
          } else {
            // 개별 이벤트로 처리
            for (const event of events) {
              try {
                await subscriber.callback(event);
              } catch (error) {
                console.error(`구독자 ${subscriber.name}에서 이벤트 처리 실패:`, error);
                this.handleSubscriberError(subscriberId, event, error);
              }
            }
          }
        }
      );

      await Promise.all(propagationPromises);

      // 배치 성능 메트릭 업데이트
      const batchProcessingTime = performance.now() - batchStartTime;
      for (const event of batch.events) {
        event.performance.propagationTime = batchProcessingTime / batch.events.length;
        this.syncState.pendingUpdates--;
      }

      batch.status = 'completed';
      this.updateBatchStatistics(batch, batchProcessingTime);

    } catch (error) {
      batch.status = 'failed';
      console.error(`배치 ${batchId} 처리 중 오류:`, error);
      
      // 실패한 배치의 이벤트들 개별 처리 시도
      for (const event of batch.events) {
        await this.processEventImmediately(event);
      }
    } finally {
      // 배치 정리
      this.updateBatches.delete(batchId);
    }
  }

  /**
   * Bundle 이동 업데이트
   */
  async updateBundleMove(
    bundleId: string,
    deltaTime: number,
    affectedChildren: string[],
    relations: NestedBundleRelation[]
  ): Promise<void> {
    await this.emitHierarchyChange('bundle_moved', {
      bundleId,
      affectedBundles: [bundleId, ...affectedChildren],
      affectedRelations: relations.filter(rel => 
        rel.parentBundleId === bundleId || rel.childBundleId === bundleId
      ).map(rel => rel.id),
      newState: { deltaTime, timestamp: Date.now() },
      priority: 3,
      source: 'user'
    });
  }

  /**
   * 관계 생성 업데이트
   */
  async updateRelationCreated(relation: NestedBundleRelation): Promise<void> {
    await this.emitHierarchyChange('relation_created', {
      relationId: relation.id,
      bundleId: relation.childBundleId,
      affectedBundles: [relation.parentBundleId, relation.childBundleId],
      affectedRelations: [relation.id],
      newState: relation,
      priority: 4,
      source: 'system'
    });
  }

  /**
   * 계층 구조 재구축 업데이트
   */
  async updateHierarchyRebuilt(
    affectedBundles: string[],
    newHierarchy: BundleHierarchyNode[]
  ): Promise<void> {
    await this.emitHierarchyChange('hierarchy_rebuilt', {
      affectedBundles,
      newState: { hierarchy: newHierarchy, timestamp: Date.now() },
      priority: 5,
      source: 'system'
    });
  }

  // ===== 성능 추적 및 통계 =====

  private trackPerformance(event: HierarchyChangeEvent): void {
    // 최근 지연시간 추적
    this.performanceTracker.recentLatencies.push(event.performance.processingTime);
    if (this.performanceTracker.recentLatencies.length > 1000) {
      this.performanceTracker.recentLatencies.shift();
    }

    // 처리량 추적
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    let throughputEntry = this.performanceTracker.throughputHistory.find(
      entry => Math.floor(entry.timestamp / 60000) === currentMinute
    );
    
    if (!throughputEntry) {
      throughputEntry = { timestamp: now, count: 0 };
      this.performanceTracker.throughputHistory.push(throughputEntry);
      
      // 오래된 데이터 정리 (최근 10분만 유지)
      this.performanceTracker.throughputHistory = this.performanceTracker.throughputHistory
        .filter(entry => now - entry.timestamp < 600000);
    }
    throughputEntry.count++;

    // 통계 업데이트
    this.updateStatistics(event);
  }

  private updateStatistics(event: HierarchyChangeEvent): void {
    this.statistics.totalEvents++;
    
    // 이벤트 타입별 카운트
    const currentCount = this.statistics.eventsByType.get(event.type) || 0;
    this.statistics.eventsByType.set(event.type, currentCount + 1);

    // 평균 처리 시간 업데이트
    this.statistics.averageProcessingTime = 
      (this.statistics.averageProcessingTime * (this.statistics.totalEvents - 1) + event.performance.processingTime) / 
      this.statistics.totalEvents;

    // 평균 전파 시간 업데이트
    this.statistics.averagePropagationTime = 
      (this.statistics.averagePropagationTime * (this.statistics.totalEvents - 1) + event.performance.propagationTime) / 
      this.statistics.totalEvents;

    // 성능 메트릭 계산
    this.calculatePerformanceMetrics();
  }

  private calculatePerformanceMetrics(): void {
    if (this.performanceTracker.recentLatencies.length === 0) return;

    const sortedLatencies = [...this.performanceTracker.recentLatencies].sort((a, b) => a - b);
    const length = sortedLatencies.length;

    this.statistics.performanceMetrics.latencyP50 = sortedLatencies[Math.floor(length * 0.5)];
    this.statistics.performanceMetrics.latencyP95 = sortedLatencies[Math.floor(length * 0.95)];
    this.statistics.performanceMetrics.latencyP99 = sortedLatencies[Math.floor(length * 0.99)];

    // 처리량 계산
    const recentThroughput = this.performanceTracker.throughputHistory
      .filter(entry => Date.now() - entry.timestamp < 60000)
      .reduce((sum, entry) => sum + entry.count, 0);
    
    this.statistics.performanceMetrics.averageThroughput = recentThroughput / Math.min(1, this.performanceTracker.throughputHistory.length);
    this.statistics.performanceMetrics.peakThroughput = Math.max(
      this.statistics.performanceMetrics.peakThroughput,
      recentThroughput
    );
  }

  private updateBatchStatistics(batch: UpdateBatch, processingTime: number): void {
    const batchSize = batch.events.length;
    const efficiency = batchSize / (processingTime / 1000); // events per second
    
    this.statistics.batchEfficiency = 
      (this.statistics.batchEfficiency + efficiency) / 2; // 단순 이동 평균
  }

  // ===== 유틸리티 메서드들 =====

  private calculateEventDepth(affectedBundles: string[]): number {
    // 영향받은 Bundle들의 최대 깊이 계산 (구현 필요)
    return affectedBundles.length > 0 ? Math.min(affectedBundles.length, 10) : 1;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToEventHistory(event: HierarchyChangeEvent): void {
    this.eventHistory.push(event);
    
    // 기록 크기 제한 (최근 10000개만 유지)
    if (this.eventHistory.length > 10000) {
      this.eventHistory.shift();
    }
  }

  private updateSyncState(): void {
    const now = Date.now();
    
    // 동기화 품질 평가
    if (this.syncState.pendingUpdates === 0) {
      this.syncState.isInSync = true;
      this.syncState.lastSyncTimestamp = now;
    } else {
      this.syncState.isInSync = this.syncState.pendingUpdates < 10;
    }

    // 품질 등급 결정
    if (this.syncState.pendingUpdates === 0 && this.statistics.performanceMetrics.latencyP95 < 50) {
      this.syncState.syncQuality = 'excellent';
    } else if (this.syncState.pendingUpdates < 10 && this.statistics.performanceMetrics.latencyP95 < 100) {
      this.syncState.syncQuality = 'good';
    } else if (this.syncState.pendingUpdates < 50 && this.statistics.performanceMetrics.latencyP95 < 200) {
      this.syncState.syncQuality = 'fair';
    } else if (this.syncState.pendingUpdates < 100) {
      this.syncState.syncQuality = 'poor';
    } else {
      this.syncState.syncQuality = 'critical';
    }

    // 성능 메트릭 업데이트
    this.syncState.performance.averageUpdateTime = this.statistics.averageProcessingTime;
    this.syncState.performance.averagePropagationTime = this.statistics.averagePropagationTime;
    this.syncState.performance.throughput = this.statistics.performanceMetrics.averageThroughput;
  }

  private handleSubscriberError(subscriberId: string, event: HierarchyChangeEvent, error: any): void {
    console.error(`구독자 ${subscriberId} 오류:`, error);
    
    // 오류가 많은 구독자는 임시 비활성화 고려
    // 실제 구현에서는 더 정교한 오류 처리 필요
  }

  private handleProcessingError(event: HierarchyChangeEvent, error: any): void {
    console.error('이벤트 처리 오류:', error);
    
    // 실패한 이벤트 재시도 또는 오류 큐에 추가
    // 실제 구현에서는 더 정교한 오류 복구 필요
  }

  // ===== 자동 정리 시스템 =====

  private startAutoCleanup(): void {
    setInterval(() => {
      this.performAutoCleanup();
    }, this.config.autoCleanupIntervalMs);
  }

  private performAutoCleanup(): void {
    const now = Date.now();
    
    // 오래된 이벤트 히스토리 정리
    this.eventHistory = this.eventHistory.filter(
      event => now - event.timestamp < this.config.eventRetentionMs
    );

    // 완료된 배치 정리
    for (const [batchId, batch] of this.updateBatches) {
      if (batch.status === 'completed' || batch.status === 'failed') {
        if (now - batch.startTime > 60000) { // 1분 이상 된 배치 정리
          this.updateBatches.delete(batchId);
        }
      }
    }

    // 성능 데이터 정리
    this.performanceTracker.throughputHistory = this.performanceTracker.throughputHistory
      .filter(entry => now - entry.timestamp < 600000); // 10분
  }

  // ===== 공개 API =====

  /**
   * 동기화 상태 조회
   */
  getSyncState(): HierarchySyncState {
    return { ...this.syncState };
  }

  /**
   * 업데이트 통계 조회
   */
  getStatistics(): HierarchyUpdateStatistics {
    return { ...this.statistics };
  }

  /**
   * 이벤트 히스토리 조회
   */
  getEventHistory(limit?: number): HierarchyChangeEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * 활성 배치 정보 조회
   */
  getActiveBatches(): UpdateBatch[] {
    return Array.from(this.updateBatches.values()).filter(
      batch => batch.status === 'pending' || batch.status === 'processing'
    );
  }

  /**
   * 구독자 목록 조회
   */
  getSubscribers(): HierarchyUpdateSubscriber[] {
    return Array.from(this.subscribers.values());
  }

  /**
   * 시스템 리셋
   */
  reset(): void {
    // 모든 배치 취소
    for (const batch of this.updateBatches.values()) {
      if (batch.timeout) {
        clearTimeout(batch.timeout);
      }
    }

    this.eventQueue = [];
    this.updateBatches.clear();
    this.eventHistory = [];
    this.initializeSyncState();
    this.initializeStatistics();
    this.performanceTracker.recentLatencies = [];
    this.performanceTracker.throughputHistory = [];
  }

  /**
   * 강제 동기화
   */
  async forceSync(): Promise<void> {
    // 모든 대기 중인 배치 즉시 처리
    const pendingBatches = Array.from(this.updateBatches.keys());
    await Promise.all(pendingBatches.map(batchId => this.processBatch(batchId)));

    // 큐에 남은 이벤트들 즉시 처리
    const remainingEvents = [...this.eventQueue];
    this.eventQueue = [];
    
    for (const event of remainingEvents) {
      await this.processEventImmediately(event);
    }

    this.updateSyncState();
  }
}

// ===== 계층 충돌 해결기 =====

/**
 * 계층 구조 충돌 해결기
 */
class HierarchyConflictResolver {
  async detectConflicts(
    newEvent: HierarchyChangeEvent,
    eventQueue: HierarchyChangeEvent[]
  ): Promise<HierarchyChangeEvent[]> {
    const conflicts: HierarchyChangeEvent[] = [];

    // 같은 Bundle에 대한 동시 변경 감지
    const conflictingEvents = eventQueue.filter(event =>
      event.bundleId === newEvent.bundleId &&
      event.id !== newEvent.id &&
      Math.abs(event.timestamp - newEvent.timestamp) < 1000 // 1초 이내
    );

    return conflictingEvents;
  }

  async resolveConflicts(conflicts: HierarchyChangeEvent[]): Promise<void> {
    // 우선순위 기반 충돌 해결
    conflicts.sort((a, b) => b.metadata.priority - a.metadata.priority);

    // 가장 높은 우선순위 이벤트만 유지, 나머지는 병합 또는 취소
    // 실제 구현에서는 더 정교한 충돌 해결 로직 필요
  }
}

// ===== Export =====
export default RealTimeHierarchyUpdater;

// 전역 인스턴스
let globalHierarchyUpdater: RealTimeHierarchyUpdater | null = null;

export function getGlobalHierarchyUpdater(): RealTimeHierarchyUpdater {
  if (!globalHierarchyUpdater) {
    globalHierarchyUpdater = new RealTimeHierarchyUpdater();
  }
  return globalHierarchyUpdater;
}

export function resetGlobalHierarchyUpdater(): void {
  if (globalHierarchyUpdater) {
    globalHierarchyUpdater.reset();
    globalHierarchyUpdater = null;
  }
}
