import { ContainerTimeOffsetManager } from '../ContainerTimeOffsetManager';
import { TTSProcessor } from './TTSProcessor';
import { LongSentenceEngine } from '../longSentenceEngine';
import { ClipUtils } from '../modules/clip-utils';

export class ClipProcessor {
  private timeOffsetManager: ContainerTimeOffsetManager;
  private ttsProcessor: TTSProcessor;
  private longSentenceEngine: LongSentenceEngine;
  private originalToProcessedClipMap: Map<string, string[]> = new Map();

  constructor(
    timeOffsetManager: ContainerTimeOffsetManager,
    ttsProcessor: TTSProcessor,
    longSentenceEngine: LongSentenceEngine
  ) {
    this.timeOffsetManager = timeOffsetManager;
    this.ttsProcessor = ttsProcessor;
    this.longSentenceEngine = longSentenceEngine;
  }

  /**
   * 현재 시간 오프셋을 클립에 적용
   */
  applyCurrentOffset(clip: any): any {
    const currentOffset = this.timeOffsetManager.getCurrentOffset();
    return {
      ...clip,
      startTime: (clip.startTime || 0) + currentOffset,
      endTime: (clip.endTime || 0) + currentOffset
    };
  }

  /**
   * 클립의 duration 변화량 계산
   */
  calculateDurationDelta(originalClip: any, processedClip: any): number {
    const originalDuration = originalClip.duration || (originalClip.endTime - originalClip.startTime) || 0;
    const newDuration = processedClip.duration || (processedClip.endTime - processedClip.startTime) || 0;
    return newDuration - originalDuration;
  }

  /**
   * 매칭되는 리소스 아이템 찾기
   */
  findMatchingResourceItem(resourceItems: any[], clipName: string): any {
    return resourceItems.find(item => 
      item.name === clipName || 
      (item.subordinateItems && item.subordinateItems.includes(clipName))
    );
  }

  /**
   * 매칭되는 리소스 컨테이너 찾기
   */
  findMatchingResourceContainer(resourceItems: any[], clipName: string): any {
    return resourceItems.find(item => 
      item.name === clipName && item.containers && Array.isArray(item.containers)
    );
  }

  /**
   * 단일 클립 처리
   */
  async processSingleClip(
    clip: any,
    resourceItems: any[],
    ttsFiles: Record<string, { url: string; duration: number }>,
    forcedResourceItem?: any,
    resourcePath?: string
  ): Promise<any> {
    let processedClip = { ...clip };

    // 리소스 아이템 찾기
    const resourceItem = forcedResourceItem !== undefined
      ? forcedResourceItem
      : this.findMatchingResourceItem(resourceItems, clip.name);

    if (resourceItem) {
      // LongSentence 처리
      if (resourceItem.data && resourceItem.data.type === 'longSentence') {
        try {
          const baseTrackId = processedClip.trackId;
          const conversionResult = await this.longSentenceEngine.convertLongSentence(
            resourceItem.data,
            processedClip,
            baseTrackId
          );

          const flattenedClips: any[] = [];
          let baseClipFound = false;

          // 변환된 클립들을 평면화
          for (const track of conversionResult.clips) {
            if (track.clips && Array.isArray(track.clips)) {
              for (const convertedClip of track.clips) {
                if (convertedClip.id === processedClip.id) {
                  // 기존 클립 대체
                  processedClip = { ...convertedClip };
                  baseClipFound = true;
                } else {
                  // 추가 클립
                  flattenedClips.push(convertedClip);
                }
              }
            }
          }

          // 확장된 클립들이 있는 경우 추가 정보 설정
          if (flattenedClips.length > 0) {
            processedClip.__expandedClips = flattenedClips;
          }

          console.log(`🔄 LongSentence 변환 완료: ${clip.name} -> ${flattenedClips.length + 1}개 클립`);
          return processedClip;
        } catch (error) {
          console.error(`❌ LongSentence 변환 실패: ${clip.name}`, error);
          throw error;
        }
      }

      // 일반 텍스트 처리
      if (resourceItem.data && resourceItem.data.type === 'text') {
        const ttsKey = resourcePath || resourceItem.name;

        // 기존 TTS 파일 사용
        if (ttsFiles[ttsKey]) {
          const ttsData = ttsFiles[ttsKey];
          processedClip.mediaUrl = ttsData.url;
          processedClip.duration = ttsData.duration;
          processedClip.endTime = processedClip.startTime + ttsData.duration;
          processedClip.text = resourceItem.data.text;
          
          console.log(`🎵 TTS 적용: ${clip.name} = ${ttsData.url} (${ttsData.duration}s)`);
        } else {
          // 새로운 TTS 생성
          try {
            const { finalLanguage, finalVoice } = this.ttsProcessor.processLanguageAndVoice(
              resourceItem.data.text,
              resourceItem.data.language,
              resourceItem.data.voice
            );

            const ttsParams: any = {
              text: resourceItem.data.text,
              language: finalLanguage,
              voice: finalVoice
            };

            console.log(`🎵 새 TTS 생성 요청: {
  clipName: '${clip.name}',
  text: '${resourceItem.data.text.substring(0, 50)}${resourceItem.data.text.length > 50 ? '...' : ''}',
  language: '${finalLanguage}',
  voice: '${finalVoice}'
}`);

            const ttsResult = await this.ttsProcessor.ttsService.generateAudio(ttsParams);

            // TTS 결과 적용
            const ttsData = {
              url: ttsResult.url,
              duration: ttsResult.duration
            };

            processedClip.mediaUrl = ttsData.url;
            processedClip.duration = ttsData.duration;
            processedClip.endTime = processedClip.startTime + ttsData.duration;
            processedClip.text = resourceItem.data.text;

            console.log(`🎵 새 TTS 생성: ${clip.name} = ${ttsData.url} (${ttsData.duration}s)`);
          } catch (error) {
            console.error(`❌ TTS 생성 실패: ${clip.name}`, error);
            const availableKeys = Object.keys(ttsFiles);
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`사용 가능한 TTS 키: ${availableKeys.join(', ')}`);
            throw new Error(`TTS 생성 실패: ${clip.name} - ${errorMessage}`);
          }
        }
      }

      // 텍스트 내용 적용
      if (resourceItem.data && resourceItem.data.text) {
        processedClip.text = resourceItem.data.text;
        console.log(`📝 텍스트 적용: ${clip.name} = "${resourceItem.data.text}"`);
      }
    }

    return processedClip;
  }

  /**
   * 기준 클립과 종속 클립들을 함께 처리
   */
  async processMergedDependentClips(
    baseClip: any,
    dependentClips: any[],
    resourceItems: any[],
    ttsFiles: Record<string, { url: string; duration: number }>,
    resourcePathPrefix?: string
  ): Promise<any[]> {
    const processedClips: any[] = [];

    // 기준 클립 처리
    const baseResourceItem = this.findMatchingResourceItem(resourceItems, baseClip.name);
    const baseFullResourcePath = resourcePathPrefix ? `${resourcePathPrefix}_${baseClip.name}` : baseClip.name;
    const processedBaseClip = await this.processSingleClip(baseClip, resourceItems, ttsFiles, baseResourceItem, baseFullResourcePath);

    // 시간 오프셋 적용
    const offsettedBaseClip = this.applyCurrentOffset(processedBaseClip);

    // 확장된 클립들 처리
    if (processedBaseClip.__expandedClips && Array.isArray(processedBaseClip.__expandedClips)) {
      const expandedClips = processedBaseClip.__expandedClips;
      const offsettedExpandedClips: any[] = [];

      for (const expandedClip of expandedClips) {
        const offsettedExpandedClip = this.applyCurrentOffset(expandedClip);
        offsettedExpandedClips.push(offsettedExpandedClip);

        // 원본 클립 ID 매핑 업데이트
        const existingIds = this.originalToProcessedClipMap.get(baseClip.id) || [];
        existingIds.push(offsettedExpandedClip.id);
        this.originalToProcessedClipMap.set(baseClip.id, existingIds);
      }

      // 확장된 클립들을 processedClips에 추가
      processedClips.push(...offsettedExpandedClips);

      // 기준 클립의 시간 범위 조정
      const firstExpandedClip = offsettedExpandedClips[0];
      const lastExpandedClip = offsettedExpandedClips[offsettedExpandedClips.length - 1];

      // 전체 확장된 클립들의 시간 범위로 기준 클립 업데이트
      const expandedTotalDuration = (lastExpandedClip.startTime + lastExpandedClip.duration) - firstExpandedClip.startTime;
      const originalDuration = baseClip.duration || (baseClip.endTime - baseClip.startTime) || 0;
      const durationDelta = expandedTotalDuration - originalDuration;

      // 시간 오프셋 관리자에 변화량 반영
      this.timeOffsetManager.addOffset(durationDelta);

      console.log(`🔄 확장된 클립 처리: ${baseClip.name} -> ${offsettedExpandedClips.length}개 클립 (duration delta: ${durationDelta})`);
    } else {
      // 종속 클립들 처리
      for (const dependentClip of dependentClips) {
        const clonedDepClip = structuredClone(dependentClip);
        
        // 종속 클립의 시간을 기준 클립에 맞춰 조정
        const timeDelta = offsettedBaseClip.startTime - baseClip.startTime;
        clonedDepClip.startTime += timeDelta;
        clonedDepClip.endTime += timeDelta;

        const depMatchingItem = this.findMatchingResourceItem(resourceItems, dependentClip.name);
        const depFullResourcePath = resourcePathPrefix ? `${resourcePathPrefix}_${dependentClip.name}` : dependentClip.name;
        const processedDepClip = await this.processSingleClip(
          clonedDepClip,
          resourceItems,
          ttsFiles,
          depMatchingItem,
          depFullResourcePath
        );

        processedClips.push(processedDepClip);

        // 원본 클립 ID 매핑 업데이트
        const existingIds = this.originalToProcessedClipMap.get(dependentClip.id) || [];
        existingIds.push(processedDepClip.id);
        this.originalToProcessedClipMap.set(dependentClip.id, existingIds);
      }

      // 기준 클립의 duration 변화량 계산 및 반영
      const durationDelta = this.calculateDurationDelta(baseClip, processedBaseClip);
      this.timeOffsetManager.addOffset(durationDelta);

      console.log(`🎯 기준 클립 처리: ${baseClip.name} (종속 클립 ${dependentClips.length}개)`);
    }

    // 기준 클립을 맨 앞에 추가
    processedClips.unshift(offsettedBaseClip);

    // 원본 클립 ID 매핑 업데이트
    const existingIds = this.originalToProcessedClipMap.get(baseClip.id) || [];
    existingIds.push(offsettedBaseClip.id);
    this.originalToProcessedClipMap.set(baseClip.id, existingIds);

    return processedClips;
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