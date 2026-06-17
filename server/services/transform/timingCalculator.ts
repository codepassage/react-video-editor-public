/**
 * ⏱️ 클립 타이밍 계산 및 조정 서비스 (Timing Calculator)
 * 
 * 비디오 클립의 시간 조정, 앵커 관계 처리, 번들 타이밍 관리를 담당
 * TTS 생성으로 인한 길이 변화와 복잡한 클립 의존성을 자동으로 계산
 * 
 * 🎯 주요 기능:
 * - 개별 클립 타이밍 조정
 * - 전체 타임라인 재계산
 * - 앵커 관계 기반 자동 정렬
 * - 번들 클립 시간 동기화
 * - 겹침 해결 및 최적화
 * 
 * ⚙️ 계산 알고리즘:
 * - TTS 길이 변화에 따른 자동 조정
 * - 앵커 포인트 기반 위치 계산
 * - 순차/병렬 클립 배치 최적화
 * - 재귀적 의존성 해결
 * - 무한 루프 방지 로직
 * 
 * 🔗 앵커 시스템:
 * - startAnchor: 시작점 앵커
 * - endAnchor: 종료점 앵커
 * - bundleAnchor: 번들 기반 앵커
 * - offset: 시간 오프셋 적용
 * 
 * 📊 처리 과정:
 * 1. 개별 클립 길이 조정
 * 2. 앵커 관계 분석
 * 3. 의존성 순서 결정
 * 4. 재귀적 타이밍 계산
 * 5. 겹침 검사 및 해결
 * 6. 전체 길이 최적화
 * 
 * 🎬 지원 시나리오:
 * - TTS 생성 후 오디오 길이 변화
 * - 클립 추가/삭제 시 재정렬
 * - 번들 내 클립 동기화
 * - 복잡한 앵커 체인 처리
 * 
 * @version 1.0.0
 * @author YouTube Generator Team
 * @since 2024-01-01
 */

export class TimingCalculator {
  
  /**
   * Calculate timing adjustments for clips based on TTS duration
   */
  adjustClipTiming(clip: any, newDuration: number): any {
    const originalDuration = clip.endTime - clip.startTime;
    
    return {
      ...clip,
      endTime: clip.startTime + newDuration,
      duration: newDuration
    };
  }

  /**
   * Recalculate timeline after duration changes
   */
  recalculateTimeline(tracks: any[], changedClips: Map<string, number>): any[] {
    return tracks.map(track => ({
      ...track,
      clips: track.clips?.map((clip: any) => {
        const newDuration = changedClips.get(clip.id);
        if (newDuration !== undefined) {
          return this.adjustClipTiming(clip, newDuration);
        }
        return clip;
      }) || []
    }));
  }

  /**
   * Calculate total timeline duration
   */
  calculateTotalDuration(tracks: any[]): number {
    let maxDuration = 0;
    
    for (const track of tracks) {
      for (const clip of track.clips || []) {
        if (clip.endTime > maxDuration) {
          maxDuration = clip.endTime;
        }
      }
    }
    
    return maxDuration;
  }

  /**
   * Adjust bundle clip times and return total duration
   */
  adjustBundleClipTimes(clips: any[], startTime: number): number {
    let currentTime = startTime;
    let maxEndTime = startTime;

    // Sort clips by original start time to maintain order
    const sortedClips = clips.sort((a, b) => a.startTime - b.startTime);

    for (const clip of sortedClips) {
      const originalDuration = clip.endTime - clip.startTime;
      
      clip.startTime = currentTime;
      clip.endTime = currentTime + originalDuration;
      
      if (clip.endTime > maxEndTime) {
        maxEndTime = clip.endTime;
      }
      
      // For sequential clips, move start time forward
      if (!this.hasOverlapWithOthers(clip, sortedClips)) {
        currentTime = clip.endTime;
      }
    }

    return maxEndTime - startTime;
  }

  /**
   * Check if clip overlaps with others (for parallel clips)
   */
  private hasOverlapWithOthers(targetClip: any, allClips: any[]): boolean {
    const originalStart = targetClip.startTime;
    const originalEnd = targetClip.endTime;
    
    return allClips.some(clip => 
      clip.id !== targetClip.id && 
      clip.startTime < originalEnd && 
      clip.endTime > originalStart
    );
  }

  /**
   * Recalculate all timing including anchor relationships
   */
  recalculateAllTiming(template: any, originalTemplate?: any): void {
    // Build original clip map from original template if provided
    this.originalClipMap = new Map();
    if (originalTemplate) {
      this.buildOriginalClipMap(originalTemplate);
    }
    
    console.log('🔄 Recalculating timing for template with', template.tracks?.length || 0, 'tracks');
    
    // Process anchored clips after bundle processing
    this.processAnchoredClips(template);
    
    // Update project duration
    template.projectSettings = template.projectSettings || {};
    template.projectSettings.duration = this.calculateTotalDuration(template.tracks);
    
    console.log('✅ Timing recalculation complete. Total duration:', template.projectSettings.duration);
  }

  /**
   * Process clips with anchor relationships
   */
  private processAnchoredClips(template: any): void {
    const processedClips = new Set<string>();
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      iterations++;

      for (const track of template.tracks || []) {
        for (const clip of track.clips || []) {
          if (processedClips.has(clip.id)) continue;

          const updated = this.updateClipWithAnchor(template, clip);
          if (updated) {
            hasChanges = true;
            processedClips.add(clip.id);
          }
        }
      }
    }
  }

  /**
   * Update clip timing based on anchor relationships
   */
  private updateClipWithAnchor(template: any, clip: any): boolean {
    let updated = false;
    const regularProps = clip.regularClipProperties;
    
    if (!regularProps) return false;

    console.log(`🔍 Checking anchors for clip: ${clip.name} (${clip.id})`);

    // Handle end anchor
    if (regularProps.endAnchorExtended) {
      const anchor = regularProps.endAnchorExtended;
      console.log(`   📌 End anchor found:`, anchor);
      
      const targetClip = this.findTargetClip(template, anchor);
      console.log(`   🎯 Target clip found:`, targetClip ? `${targetClip.name} (${targetClip.id}) endTime: ${targetClip.endTime}` : 'NOT FOUND');
      
      if (targetClip) {
        const newEndTime = this.calculateAnchorTime(targetClip, anchor.anchorPoint, anchor.offset);
        console.log(`   ⏰ Current endTime: ${clip.endTime}, New endTime: ${newEndTime}`);
        
        if (Math.abs(clip.endTime - newEndTime) > 0.001) {
          clip.endTime = newEndTime;
          clip.duration = clip.endTime - clip.startTime;
          updated = true;
          console.log(`   ✅ Updated ${clip.name} endTime to ${newEndTime}`);
        }
      }
    }

    // Handle start anchor
    if (regularProps.startAnchorExtended) {
      const anchor = regularProps.startAnchorExtended;
      console.log(`   📌 Start anchor found:`, anchor);
      
      const targetClip = this.findTargetClip(template, anchor);
      console.log(`   🎯 Target clip found:`, targetClip ? `${targetClip.name} (${targetClip.id})` : 'NOT FOUND');
      
      if (targetClip) {
        const newStartTime = this.calculateAnchorTime(targetClip, anchor.anchorPoint, anchor.offset);
        console.log(`   ⏰ Current startTime: ${clip.startTime}, New startTime: ${newStartTime}`);
        
        if (Math.abs(clip.startTime - newStartTime) > 0.001) {
          const duration = clip.endTime - clip.startTime;
          clip.startTime = newStartTime;
          clip.endTime = newStartTime + duration;
          updated = true;
          console.log(`   ✅ Updated ${clip.name} startTime to ${newStartTime}`);
        }
      }
    }

    return updated;
  }

  /**
   * Find target clip for anchor (handles bundle references)
   */
  private findTargetClip(template: any, anchor: any): any {
    console.log(`     🔎 Finding target clip for anchor:`, anchor);
    
    // If baseClipId is specified, find that clip
    if (anchor.baseClipId) {
      console.log(`     📋 Looking for clip by ID: ${anchor.baseClipId}`);
      
      const clipById = this.findClipById(template, anchor.baseClipId);
      if (clipById) {
        console.log(`     ✅ Found clip by ID: ${clipById.name}`);
        return clipById;
      }
      
      console.log(`     ❌ Clip not found by ID, trying by name...`);
      
      // If original clip not found (likely due to bundle iteration), 
      // find by name - get the last clip with the same name
      const originalClip = this.findOriginalClipById(template, anchor.baseClipId);
      console.log(`     📚 Original clip info:`, originalClip);
      
      if (originalClip && originalClip.name) {
        const lastClip = this.findLastClipByName(template, originalClip.name);
        console.log(`     🎯 Last clip by name "${originalClip.name}":`, lastClip ? `${lastClip.id} endTime: ${lastClip.endTime}` : 'NOT FOUND');
        return lastClip;
      }
    }
    
    // If bundleId is specified, find the last clip in that bundle
    if (anchor.bundleId) {
      console.log(`     📦 Looking for last clip in bundle: ${anchor.bundleId}`);
      return this.findLastClipInBundle(template, anchor.bundleId);
    }
    
    console.log(`     ❌ No target clip found`);
    return null;
  }

  /**
   * Find original clip info from template metadata or bundles
   */
  private findOriginalClipById(template: any, clipId: string): any {
    // Store original clip info before transformation
    if (!this.originalClipMap) {
      this.originalClipMap = new Map();
      this.buildOriginalClipMap(template);
    }
    
    return this.originalClipMap.get(clipId) || null;
  }

  private originalClipMap: Map<string, any> = new Map();

  /**
   * Build map of original clips before transformation
   */
  private buildOriginalClipMap(template: any): void {
    for (const track of template.tracks || []) {
      for (const clip of track.clips || []) {
        this.originalClipMap.set(clip.id, {
          id: clip.id,
          name: clip.name,
          trackId: clip.trackId
        });
      }
    }
  }

  /**
   * Find the last clip by name (highest endTime)
   */
  private findLastClipByName(template: any, clipName: string): any {
    let lastClip = null;
    let latestEndTime = 0;

    for (const track of template.tracks || []) {
      for (const clip of track.clips || []) {
        if (clip.name === clipName && clip.endTime > latestEndTime) {
          lastClip = clip;
          latestEndTime = clip.endTime;
        }
      }
    }

    return lastClip;
  }

  /**
   * Find clip by ID
   */
  private findClipById(template: any, clipId: string): any {
    for (const track of template.tracks || []) {
      const clip = track.clips?.find((c: any) => c.id === clipId);
      if (clip) return clip;
    }
    return null;
  }

  /**
   * Find the last clip in a bundle (by end time)
   */
  private findLastClipInBundle(template: any, bundleId: string): any {
    let lastClip = null;
    let latestEndTime = 0;

    for (const track of template.tracks || []) {
      for (const clip of track.clips || []) {
        if (clip.bundleId === bundleId && clip.endTime > latestEndTime) {
          lastClip = clip;
          latestEndTime = clip.endTime;
        }
      }
    }

    return lastClip;
  }

  /**
   * Calculate anchor time based on anchor point and offset
   */
  private calculateAnchorTime(targetClip: any, anchorPoint: string, offset: number): number {
    switch (anchorPoint) {
      case 'start':
        return targetClip.startTime + (offset || 0);
      case 'end':
        return targetClip.endTime + (offset || 0);
      default:
        return targetClip.endTime + (offset || 0);
    }
  }
}