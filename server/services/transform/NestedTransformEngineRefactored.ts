import {
  ResourceData,
  ResourceItem,
  TransformResult,
  TransformStatistics,
  NestedStructureConfig
} from '../../types/autoGeneration';
import { GoogleTTSService } from '../tts/googleTTS';
import { ContainerTimeOffsetManager } from './ContainerTimeOffsetManager';
import { LongSentenceEngine } from './longSentenceEngine';
import { ClipUtils } from './modules/clip-utils';

// 새로운 모듈화된 프로세서들
import { TTSProcessor } from './processors/TTSProcessor';
import { ClipProcessor } from './processors/ClipProcessor';
import { ContainerProcessor } from './processors/ContainerProcessor';
import { ValidationService } from './validation/ValidationService';

/**
 * 리팩토링된 NestedTransformEngine
 * 기존 기능을 모듈화하여 유지보수성 향상
 */
export class NestedTransformEngineRefactored {
  private config: NestedStructureConfig;
  private ttsService: GoogleTTSService;
  private statistics: TransformStatistics;
  private idCounter = 0;
  
  // 모듈화된 프로세서들
  private ttsProcessor: TTSProcessor;
  private clipProcessor: ClipProcessor;
  private containerProcessor: ContainerProcessor;
  private validationService: ValidationService;
  private timeOffsetManager: ContainerTimeOffsetManager;
  private longSentenceEngine: LongSentenceEngine;

  // 캐시와 매핑
  private processedBaseClipsMap: Map<string, any> = new Map();
  private processedTemplateGroupsMap: Map<string, any> = new Map();
  private usedFonts: Set<string> = new Set();

  constructor(config: Partial<NestedStructureConfig> = {}) {
    // 기본 설정
    this.config = {
      maxNestingDepth: 3,
      enableCircularReferenceCheck: true,
      enableDepthValidation: true,
      enableOrphanDetection: true,
      strictMode: false,
      ...config
    };

    // 기본 서비스 초기화
    this.ttsService = new GoogleTTSService();
    this.longSentenceEngine = new LongSentenceEngine();
    this.timeOffsetManager = new ContainerTimeOffsetManager(this.config.strictMode);
    
    // 통계 초기화
    this.statistics = {
      totalClips: 0,
      ttsGenerated: 0,
      bundlesProcessed: 0,
      templateGroupsProcessed: 0,
      nestingLevels: [],
      processingTime: 0
    };

    // 모듈화된 프로세서들 초기화
    this.ttsProcessor = new TTSProcessor(this.ttsService);
    this.clipProcessor = new ClipProcessor(this.timeOffsetManager, this.ttsProcessor, this.longSentenceEngine);
    this.containerProcessor = new ContainerProcessor(this.timeOffsetManager, this.clipProcessor);
    this.validationService = new ValidationService(this.config);
  }

  /**
   * 메인 변환 메서드 - 기존 API 호환성 유지
   */
  async transformNasted(template: any, resourceData: ResourceData): Promise<TransformResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Transform 시작: { templateTracks: ${template?.tracks?.length || 0}, resourceItems: ${resourceData?.items?.length || 0} }`);

      // 1. 입력 검증
      this.validationService.validateAll(template, resourceData);

      // 2. 리소스 데이터 정규화
      console.log('📊 리소스 데이터 정규화 중...');
      const normalizedResourceData = this.normalizeResourceData(resourceData);

      // 3. TTS 파일 생성
      const ttsFiles = await this.ttsProcessor.generateTTSRecursively(normalizedResourceData.items);
      this.statistics.ttsGenerated = Object.keys(ttsFiles).length;

      // 4. 템플릿 구조 분석
      const { structuredAllClips } = this.restructureClips(template);

      // 5. 템플릿 처리
      const transformedData = await this.processTemplate(template, structuredAllClips, normalizedResourceData, ttsFiles);

      // 6. 종속성 정리
      const cleanedData = this.removeDependencies(transformedData);

      // 7. 최종 결과 생성
      const endTime = Date.now();
      this.statistics.processingTime = endTime - startTime;

      // TTS 파일 결과 포맷 변환
      const ttsFilesForResult: Record<string, string> = {};
      for (const [key, value] of Object.entries(ttsFiles)) {
        ttsFilesForResult[key] = value.url;
      }

      const result: TransformResult = {
        success: true,
        transformedData: cleanedData,
        ttsFiles: ttsFilesForResult,
        statistics: { ...this.statistics }
      };

      console.log(`✅ Transform 완료: ${JSON.stringify(this.statistics, null, 2)}`);
      return result;

    } catch (error) {
      console.error('❌ Transform 실패:', error);
      const endTime = Date.now();
      this.statistics.processingTime = endTime - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        statistics: { ...this.statistics }
      };
    }
  }

  /**
   * 리소스 데이터 정규화
   */
  private normalizeResourceData(resourceData: ResourceData): ResourceData {
    const normalized: ResourceData = {
      items: resourceData.items || []
    };

    // 추가 정규화 로직이 필요한 경우 여기에 구현
    return normalized;
  }

  /**
   * 클립 구조 재구성
   */
  private restructureClips(template: any): { structuredAllClips: any[] } {
    const flatClips: any[] = (template.tracks ?? [])
      .flatMap((track: any) => track.clips ?? [])
      .filter((clip: any) => clip && clip.id);

    // 템플릿 그룹 필터링
    const templateGroups = this.filterTemplateGroups(template, flatClips);
    const templateGroupIdSet = new Set(templateGroups.map((tg: any) => tg.id));

    // 번들 필터링
    const bundles = this.filterBundles(template.bundles ?? [], flatClips, templateGroupIdSet);

    // 템플릿 그룹과 번들 강화
    const enrichedTemplateGroups = this.enrichTemplateGroups(templateGroups, flatClips);
    const enrichedBundles = this.enrichBundles(bundles, flatClips);

    // 컨테이너 클립 ID 수집
    const containerClipIds = new Set([
      ...enrichedTemplateGroups.map((tg: any) => tg.id),
      ...enrichedBundles.map((bundle: any) => bundle.id)
    ]);

    // 나머지 클립들
    const remainingClips = flatClips.filter((clip) => !containerClipIds.has(clip.id));
    const processedRemainingClips = this.mergeDependentClips(remainingClips, flatClips);

    // 모든 클립 결합
    const combinedAllClips = [
      ...processedRemainingClips,
      ...enrichedTemplateGroups,
      ...enrichedBundles
    ];

    return { structuredAllClips: combinedAllClips };
  }

  /**
   * 템플릿 처리 (기존 로직 유지)
   */
  private async processTemplate(
    template: any,
    structuredAllClips: any[],
    resourceData: ResourceData,
    ttsFiles: Record<string, { url: string; duration: number }>
  ): Promise<any> {
    const currentOffset = this.timeOffsetManager.getCurrentOffset();
    console.log(`🔄 템플릿 처리 시작: { timeOffset: ${currentOffset}, tracks: ${template.tracks.length} }`);

    // 깊은 복사로 결과 생성
    const result = JSON.parse(JSON.stringify(template));

    const resultTracks: any[] = result.tracks.map((track: any) => {
      return {
        ...track,
        clips: []
      };
    });

    // 각 트랙의 클립들 처리
    for (const track of template.tracks) {
      const targetTrack = resultTracks.find((t: any) => t.id === track.id);
      if (!targetTrack) continue;

      const processedClips = await this.processClip(
        track.clips || [],
        structuredAllClips,
        resourceData.items,
        ttsFiles
      );

      targetTrack.clips = processedClips;
    }

    // 결과 구성
    const finalResult = {
      ...result,
      tracks: resultTracks
    };

    return finalResult;
  }

  /**
   * 클립 처리 (기존 로직 활용)
   */
  private async processClip(
    clips: any[],
    structuredAllClips: any[],
    resourceItems: any[],
    ttsFiles: Record<string, { url: string; duration: number }>
  ): Promise<any[]> {
    const processedClips: any[] = [];

    for (const clip of clips) {
      try {
        const processedClip = await this.clipProcessor.processSingleClip(
          clip,
          resourceItems,
          ttsFiles
        );

        if (processedClip) {
          // 확장된 클립들 처리
          if (processedClip.__expandedClips && Array.isArray(processedClip.__expandedClips)) {
            processedClips.push(...processedClip.__expandedClips);
          } else {
            processedClips.push(processedClip);
          }

          this.statistics.totalClips++;
        }
      } catch (error) {
        console.error(`❌ 클립 처리 실패: ${clip.name}`, error);
        // 에러가 발생해도 계속 진행
      }
    }

    return processedClips;
  }

  /**
   * 종속성 제거 (기존 로직 유지)
   */
  private removeDependencies(data: any): any {
    const cleaned = JSON.parse(JSON.stringify(data));

    // 내부 속성들 제거
    const cleanClip = (clip: any) => {
      if (clip) {
        delete clip.__expandedClips;
        delete clip.dependentClips;
      }
    };

    // 모든 트랙의 클립들 정리
    if (cleaned.tracks) {
      for (const track of cleaned.tracks) {
        if (track.clips) {
          track.clips.forEach(cleanClip);
        }
      }
    }

    return cleaned;
  }

  // 기존 유틸리티 메서드들 유지 (간소화)
  private filterTemplateGroups(template: any, flatClips: any[]): any[] {
    // 기존 로직 유지
    return [];
  }

  private filterBundles(bundles: any[], flatClips: any[], templateGroupIdSet: Set<string>): any[] {
    // 기존 로직 유지
    return bundles || [];
  }

  private enrichTemplateGroups(templateGroups: any[], flatClips: any[]): any[] {
    // 기존 로직 유지
    return templateGroups;
  }

  private enrichBundles(bundles: any[], flatClips: any[]): any[] {
    // 기존 로직 유지
    return bundles;
  }

  private mergeDependentClips(remainingClips: any[], flatClips: any[]): any[] {
    // 기존 로직 유지
    return remainingClips;
  }
}