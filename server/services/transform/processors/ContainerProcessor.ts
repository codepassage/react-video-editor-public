import { ContainerTimeOffsetManager } from '../ContainerTimeOffsetManager';
import { ClipProcessor } from './ClipProcessor';
import { ClipUtils } from '../modules/clip-utils';

export class ContainerProcessor {
  private timeOffsetManager: ContainerTimeOffsetManager;
  private clipProcessor: ClipProcessor;
  private originalToProcessedClipMap: Map<string, string[]> = new Map();

  constructor(
    timeOffsetManager: ContainerTimeOffsetManager,
    clipProcessor: ClipProcessor
  ) {
    this.timeOffsetManager = timeOffsetManager;
    this.clipProcessor = clipProcessor;
  }

  /**
   * 컨테이너 클립 처리
   */
  async processContainerClip(
    originalClip: any,
    resourceItems: any[],
    resourcePathPrefix?: string
  ): Promise<any> {
    const matchingItem = this.findMatchingResourceContainer(resourceItems, originalClip.name);

    if (!matchingItem || !matchingItem.containers) {
      // 컨테이너 리소스가 없는 경우 원본 클립의 하위 클립들에 시간 오프셋만 적용
      const offsettedClips = originalClip.clips.map((clip: any) => this.clipProcessor.applyCurrentOffset(clip));
      return {
        ...originalClip,
        clips: offsettedClips
      };
    }

    const offsettedContainer = this.clipProcessor.applyCurrentOffset(originalClip);
    const processedTemplateGroup = await this.expandContainerClip(
      originalClip,
      matchingItem,
      resourceItems,
      resourcePathPrefix
    );

    return {
      ...offsettedContainer,
      ...processedTemplateGroup
    };
  }

  /**
   * 컨테이너 클립을 확장하여 처리
   */
  async expandContainerClip(
    originalClip: any,
    resourceItems: any,
    allResourceItems: any[],
    resourcePathPrefix?: string
  ): Promise<any> {
    const expandedClips: any[] = [];
    const clipsToProcess = originalClip.clips || [originalClip];
    const parentOffset = this.timeOffsetManager.getCurrentOffset();

    // 원본 컨테이너 지속시간 계산
    const originalContainerDuration = ClipUtils.calculateOriginalContainerDuration(originalClip);

    // 각 컨테이너 인스턴스의 실제 누적 지속시간 추적
    let cumulativeActualDuration = 0;

    // 각 컨테이너 인스턴스 처리
    for (let containerIndex = 0; containerIndex < resourceItems.containers.length; containerIndex++) {
      const container = resourceItems.containers[containerIndex];

      // 인스턴스 시작 오프셋 계산
      const instanceStartOffset = this.timeOffsetManager.calculateInstanceStartOffset(
        originalClip,
        containerIndex,
        parentOffset
      );

      // 현재 오프셋을 인스턴스 시작점으로 설정
      this.timeOffsetManager.setCurrentOffset(instanceStartOffset);

      console.log(`📦 컨테이너 인스턴스 ${containerIndex + 1} 처리 시작 (offset: ${instanceStartOffset})`);

      const instanceClips: any[] = [];

      // 컨테이너 인스턴스 내의 클립들 처리
      for (const clip of clipsToProcess) {
        const clonedClip = JSON.parse(JSON.stringify(clip));
        
        // 클립 ID 갱신
        clonedClip.id = `${clip.id}_inst${containerIndex + 1}`;

        const currentContainerPath = resourcePathPrefix
          ? `${resourcePathPrefix}_${resourceItems.name}_c${containerIndex + 1}`
          : `${resourceItems.name}_c${containerIndex + 1}`;

        const processedClips = await this.clipProcessor.processClipWithPath(
          clonedClip,
          allResourceItems,
          {}, // ttsFiles는 이미 생성된 상태
          currentContainerPath
        );

        instanceClips.push(...(Array.isArray(processedClips) ? processedClips : [processedClips]));

        // 원본 클립 ID 매핑 업데이트
        if (processedClips) {
          const clipsArray = Array.isArray(processedClips) ? processedClips : [processedClips];
          for (const processedClip of clipsArray) {
            const existingIds = this.originalToProcessedClipMap.get(clip.id) || [];
            existingIds.push(processedClip.id);
            this.originalToProcessedClipMap.set(clip.id, existingIds);
          }
        }
      }

      // 인스턴스의 실제 지속시간 계산
      if (instanceClips.length > 0) {
        const minStartTime = Math.min(...instanceClips.map(c => c.startTime || 0));
        const maxEndTime = Math.max(...instanceClips.map(c => c.endTime || 0));
        const actualInstanceDuration = maxEndTime - minStartTime;
        cumulativeActualDuration += actualInstanceDuration;

        console.log(`📊 반복 ${containerIndex + 1}: 시작=${minStartTime.toFixed(2)}, 실제지속시간=${actualInstanceDuration.toFixed(2)}`);
      }

      expandedClips.push(...instanceClips);
    }

    // 실제 총 지속시간 계산
    const actualTotalDuration = cumulativeActualDuration;
    const expansionTime = this.timeOffsetManager.calculateContainerExpansionTime(
      originalContainerDuration,
      actualTotalDuration
    );

    // 확장 시간을 시간 오프셋에 반영
    this.timeOffsetManager.addOffset(expansionTime);

    console.log(`🚀 컨테이너 확장 시간 반영: ${originalClip.name}, 원래=${originalContainerDuration.toFixed(2)}, 실제=${actualTotalDuration.toFixed(2)}, 확장=${expansionTime.toFixed(2)}`);

    // 처리된 템플릿 그룹 반환
    if (expandedClips.length > 0) {
      const minStartTime = Math.min(...expandedClips.map(c => c.startTime || 0));
      const maxEndTime = Math.max(...expandedClips.map(c => c.endTime || 0));
      const processedTemplateGroup = {
        id: originalClip.id,
        name: originalClip.name,
        startTime: minStartTime,
        endTime: maxEndTime,
        clips: expandedClips,
        __expandedClips: expandedClips // 확장된 클립들 표시
      };

      console.log(`✅ 컨테이너 확장 완료: ${expandedClips.length}개 클립 생성, 확장시간: ${expansionTime.toFixed(2)}초`);
      return processedTemplateGroup;
    }

    return originalClip;
  }

  /**
   * 매칭되는 리소스 컨테이너 찾기
   */
  private findMatchingResourceContainer(resourceItems: any[], clipName: string): any {
    return resourceItems.find(item => 
      item.name === clipName && item.containers && Array.isArray(item.containers)
    );
  }

  /**
   * 원본 클립 ID 매핑 가져오기
   */
  getOriginalToProcessedClipMap(): Map<string, string[]> {
    return this.originalToProcessedClipMap;
  }

  /**
   * 원본 클립 ID 매핑 초기화
   */
  clearOriginalToProcessedClipMap(): void {
    this.originalToProcessedClipMap.clear();
  }
}