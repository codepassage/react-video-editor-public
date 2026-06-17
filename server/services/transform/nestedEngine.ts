/**
 * 🔄 NestedTransformEngine.ts - 고급 변환 엔진 (핵심 모듈 #4)
 * 
 * =====================================================================
 * 🎯 CSV/JSON 리소스를 타임라인 데이터로 변환하는 서버사이드 엔진
 * =====================================================================
 * 
 * 복잡한 중첩 구조와 TTS, 미디어 처리를 지원하는 고도화된 변환 시스템
 * YouTube 비디오 자동 생성을 위한 핵심 데이터 변환 로직을 담당
 * 
 * 🏗️ 핵심 기능들:
 * • CSV 리소스 → 타임라인 클립 변환
 * • TTS (Text-to-Speech) 음성 생성
 * • Long Sentence 자동 분할 처리
 * • 중첩 번들 및 템플릿 그룹 관리
 * • 시간 오프셋 자동 계산
 * • 다국어 음성 처리
 * • 폰트 의존성 관리
 */

// ========================================================================
// 📦 타입 정의 및 인터페이스 Import
// ========================================================================
import {
  ResourceData,           // 입력 리소스 데이터 타입
  ResourceItem,           // 개별 리소스 아이템 타입
  TransformResult,        // 변환 결과 타입
  TransformStatistics,    // 변환 통계 정보 타입
  NestedStructureConfig   // 중첩 구조 설정 타입
} from '../../types/autoGeneration';

// ========================================================================
// 🔧 서비스 및 유틸리티 Import
// ========================================================================
import { GoogleTTSService } from '../tts/googleTTS';                    // Google TTS 서비스
import { ContainerTimeOffsetManager } from './ContainerTimeOffsetManager'; // 시간 오프셋 관리
import { LanguageDetector } from '../tts/languageDetector';             // 언어 감지 서비스
import { LongSentenceEngine } from './longSentenceEngine';              // 긴 문장 분할 엔진
import { ClipUtils } from './modules/clip-utils';                       // 클립 유틸리티

// ========================================================================
// 🗂️ Node.js 파일 시스템 Import
// ========================================================================
import fs from 'fs';      // 파일 시스템 작업
import path from 'path';  // 경로 처리 유틸리티
// ========================================================================
// 🏭 NestedTransformEngine 클래스 정의 - 고급 변환 엔진
// ========================================================================

/**
 * 🔄 중첩 구조 지원 Transform Engine
 * 
 * CSV/JSON 리소스를 복잡한 타임라인 구조로 변환하는 고도화된 엔진
 * 재귀적 중첩 구조, TTS 음성 생성, 자동 시간 계산을 지원
 */
export class NestedTransformEngine {
  // ========================================================================
  // 🎛️ 핵심 설정 및 서비스들
  // ========================================================================
  
  /** 🔧 중첩 구조 변환 설정 */
  private config: NestedStructureConfig;
  
  /** 🎤 TTS (Text-to-Speech) 서비스 */
  protected ttsService: GoogleTTSService;
  
  /** 📊 변환 작업 통계 정보 */
  protected statistics: TransformStatistics;
  
  /** ⏰ 시간 오프셋 자동 계산 관리자 */
  private timeOffsetManager: ContainerTimeOffsetManager;
  
  /** 📝 Long Sentence 자동 분할 엔진 */
  private longSentenceEngine: LongSentenceEngine;

  // ========================================================================
  // 🗂️ ID 관리 및 캐싱 시스템
  // ========================================================================
  
  /** 🔢 전역 고유 ID 생성용 카운터 */
  private idCounter = 0;
  
  /** 📋 처리된 기준 클립 캐시 (성능 최적화) */
  private processedBaseClipsMap: Map<string, any> = new Map();
  
  /** 📦 처리된 템플릿 그룹 캐시 (중복 처리 방지) */
  private processedTemplateGroupsMap: Map<string, any> = new Map();
  
  /** 🔗 원본 클립 ID → 처리된 클립 ID들 매핑 테이블 */
  private originalToProcessedClipMap: Map<string, string[]> = new Map();

  // ========================================================================
  // 🎨 미디어 및 폰트 관리 시스템
  // ========================================================================
  
  /** 🎵 기본 음성 설정 캐시 (언어별 기본 음성) */
  private defaultVoicesCache: Record<string, string> | null = null;
  
  /** 🔤 사용된 폰트명 수집 Set (한국어 폰트 의존성 관리) */
  private usedFonts: Set<string> = new Set();

  constructor(config: Partial<NestedStructureConfig> = {}) {
    // TTS 서비스 선택 (환경 변수에 따라)
    // this.ttsService = process.env.USE_MOCK_TTS === 'false' 
    //   ? new GoogleTTSService()
    //   : new MockTTSService();
    this.ttsService = new GoogleTTSService();
    this.longSentenceEngine = new LongSentenceEngine(); // LongSentence 엔진 초기화
    this.statistics = {
      totalClips: 0,
      ttsGenerated: 0,
      bundlesProcessed: 0,
      templateGroupsProcessed: 0,
      nestingLevels: [],
      processingTime: 0
    };
    this.config = {
      maxNestingDepth: 3,
      enableCircularReferenceCheck: true,
      enableDepthValidation: true,
      enableOrphanDetection: true,
      strictMode: false,
      ...config
    };

    // 시간 오프셋 관리자 초기화 (strictMode일 때 디버깅 활성화)
    this.timeOffsetManager = new ContainerTimeOffsetManager(this.config.strictMode);
  }

  /**
   * 기본 음성 설정 로드
   */
  private loadDefaultVoices(): Record<string, string> {
    if (this.defaultVoicesCache) {
      return this.defaultVoicesCache;
    }

    try {
      const defaultVoicesFile = path.join(__dirname, '../../data/default-voices.json');
      if (fs.existsSync(defaultVoicesFile)) {
        const data = fs.readFileSync(defaultVoicesFile, 'utf8');
        this.defaultVoicesCache = JSON.parse(data);
        console.log('📢 기본 음성 설정 로드 완료:', this.defaultVoicesCache);
        return this.defaultVoicesCache || {};
      }
    } catch (error) {
      console.error('❌ 기본 음성 설정 로드 실패:', error);
    }

    // 폴백 기본값
    this.defaultVoicesCache = {};
    return this.defaultVoicesCache;
  }

  /**
   * 언어 자동 감지 및 음성 선택
   */
  private processLanguageAndVoice(text: string, language?: string, voice?: string): {
    finalLanguage: string;
    finalVoice: string;
  } {
    let finalLanguage = language;

    // 1. 언어 자동 감지 처리
    if (!finalLanguage || finalLanguage === 'auto') {
      console.log('🤖 언어 자동 감지 시작:', text.substring(0, 50) + '...');

      const detectionResult = LanguageDetector.detectLanguage(text);
      finalLanguage = LanguageDetector.mapToTTSLanguageCode(detectionResult.language);

      console.log('🎯 언어 감지 결과:', {
        detected: detectionResult.language,
        mapped: finalLanguage,
        confidence: detectionResult.confidence,
        method: detectionResult.method
      });
    }

    // 2. 음성 선택 처리
    let finalVoice = voice;

    if (!finalVoice) {
      // 사용자 설정 기본 음성 확인
      const defaultVoices = this.loadDefaultVoices();
      finalVoice = defaultVoices?.[finalLanguage];

      if (finalVoice) {
        console.log('🔊 사용자 설정 기본 음성 사용:', finalVoice);
      } else {
        // TTS 서비스의 기본 음성 사용
        console.log('🔊 시스템 기본 음성 사용 (TTS 서비스에서 선택)');
      }
    }

    return {
      finalLanguage: finalLanguage || 'en', // 최종 폴백
      finalVoice: finalVoice || '' // 빈 문자열이면 TTS 서비스에서 기본값 선택
    };
  }

  /**
   * 중첩 구조 지원 변환 함수
   * 기본 TransformEngine이 이미 재귀 구조를 지원하므로 부모 클래스 호출
   */
  async transform(template: any, resourceData: ResourceData): Promise<TransformResult> {
    console.log('🔄 Nested Transform 시작 (재귀 엔진 사용):', {
      templateTracks: template.tracks?.length || 0,
      resourceItems: resourceData.items.length,
      maxNestingDepth: this.config.maxNestingDepth
    });

    // 중첩 구조 검증 (선택적)
    if (this.config.enableDepthValidation) {
      const maxDepth = this.calculateMaxDepth(resourceData.items);
      if (maxDepth > this.config.maxNestingDepth) {
        const errorMessage = `최대 중첩 깊이(${this.config.maxNestingDepth}) 초과: ${maxDepth}`;

        if (this.config.strictMode) {
          throw new Error(errorMessage);
        } else {
          console.warn('⚠️ ' + errorMessage);
        }
      }
    }

    // 부모 클래스의 재귀 구조 처리 사용
    const result = await this.transformNasted(template, resourceData);

    if (result.success) {
      // 중첩 구조 메타데이터 추가
      result.transformedData.metadata = {
        ...result.transformedData.metadata,
        nestedTransformVersion: '3.0.0',
        maxNestingDepthUsed: this.calculateMaxDepth(resourceData.items),
        isRecursiveEngine: true
      };

      console.log('✅ Nested Transform 완료 (재귀 엔진):', {
        nestingDepthUsed: this.calculateMaxDepth(resourceData.items),
        totalClips: result.statistics?.totalClips || 0,
        processingTime: result.statistics?.processingTime || 0
      });
    }

    return result;
  }

  /**
   * 최대 중첩 깊이 계산
   */
  private calculateMaxDepth(items: any[]): number {
    let maxDepth = 0;

    const traverse = (items: any[], currentDepth: number = 0) => {
      maxDepth = Math.max(maxDepth, currentDepth);

      for (const item of items) {
        if (item.containers) {
          for (const container of item.containers) {
            if (container.items) {
              traverse(container.items, currentDepth + 1);
            }
          }
        }
      }
    };

    traverse(items);
    return maxDepth;
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<NestedStructureConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 설정 조회
   */
  getConfig(): NestedStructureConfig {
    return { ...this.config };
  }

  /**
   * 시간 오프셋 관리자 조회 (디버깅용)
   */
  getTimeOffsetManager(): ContainerTimeOffsetManager {
    return this.timeOffsetManager;
  }

  /**
   * 시간 오프셋 진단 정보 조회
   */
  getTimeOffsetDiagnostics() {
    return this.timeOffsetManager.getDiagnostics();
  }

  /**
   * 변환 통계 정보 조회
   */
  getStatistics() {
    return this.statistics;
  }


  /**
   * 메인 변환 함수
   */
  async transformNasted(template: any, resourceData: ResourceData): Promise<TransformResult> {
    const startTime = Date.now();

    try {
      console.log('🔄 Transform 시작:', {
        templateTracks: template.tracks?.length || 0,
        resourceItems: resourceData.items.length
      });

      // 시간 오프셋 관리자 초기화
      this.timeOffsetManager.reset();

      // 처리된 기준 클립 맵 초기화
      this.processedBaseClipsMap.clear();
      this.processedTemplateGroupsMap.clear();
      this.originalToProcessedClipMap.clear();

      // 폰트 수집 Set 초기화
      this.usedFonts.clear();

      // 1. 리소스 데이터 정규화 (중첩 레벨 계산)
      const normalizedResourceData = this.normalizeResourceData(resourceData);

      // 2. 재귀적 TTS 생성
      const ttsFiles = await this.generateTTSRecursively(normalizedResourceData.items);


      // 모든 트랙의 클립을 하나의 배열로 평탄화
      const { structuredAllClips } = this.restructureClips(template);

      // 3. 재귀적 템플릿 처리
      const transformedData = await this.processTemplate(template, structuredAllClips, normalizedResourceData, ttsFiles);

      // 4. 종속성 제거 및 정리
      const cleanedData = this.removeDependencies(transformedData);

      // 4.1. 프로젝트 duration 자동 계산 및 수정
      this.calculateAndUpdateProjectDuration(cleanedData);

      // 5. 통계 정리
      this.statistics.processingTime = Date.now() - startTime;

      // TTS 파일 결과를 URL만 포함하도록 변환 (하위 호환성)
      const ttsFilesForResult: Record<string, string> = {};
      for (const [key, value] of Object.entries(ttsFiles)) {
        ttsFilesForResult[key] = value.url;
      }

      const result: TransformResult = {
        success: true,
        transformedData: cleanedData,
        ttsFiles: ttsFilesForResult,
        statistics: this.statistics
      };

      console.log('✅ Transform 완료:', this.statistics);
      if (this.config.strictMode) {
        console.log('🕐 시간 오프셋 진단:', this.timeOffsetManager.getDiagnostics());
      }
      return result;

    } catch (error) {
      console.error('❌ Transform 실패:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statistics: {
          ...this.statistics,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  private restructureClips(template: any): { structuredAllClips: any[]; bundles: any[]; templateGroups: any[] } {
    // 1️⃣ 모든 트랙의 클립을 하나의 배열로 평탄화하고 시간순 정렬
    const flatClips: any[] = (template.tracks ?? [])
      .flatMap((track: any) => track.clips ?? [])
      .sort((a: any, b: any) => (a.startTime ?? 0) - (b.startTime ?? 0));

    /* ------------------------------------------------------------------
        템플릿 그룹 / 번들 추출 (필터링)
    ------------------------------------------------------------------ */

    const templateGroups = this.filterTemplateGroups(template, flatClips);
    const templateGroupIdSet = new Set(templateGroups.map((tg: any) => tg.id));

    const bundles = this.filterBundles(template.bundles ?? [], flatClips, templateGroupIdSet);

    /* ------------------------------------------------------------------
        각 템플릿 그룹 / 번들에 clips 배열 추가 및 시간 계산
    ------------------------------------------------------------------ */

    const enrichedTemplateGroups = this.enrichTemplateGroups(templateGroups, flatClips);

    const enrichedBundles = this.enrichBundles(bundles, flatClips);

    /* ------------------------------------------------------------------
        컨테이너(템플릿 그룹, 번들)에 포함된 클립 제거 후 컨테이너를 allClips 로 삽입
    ------------------------------------------------------------------ */
    const containerClipIds = new Set([
      // template group base clips and their dependents (재귀 포함)
      ...enrichedTemplateGroups.flatMap((tg: any) =>
        tg.clips.flatMap((clip: any) => ClipUtils.collectClipAndDependentIds(clip))
      ),
      // bundle base clips and their dependents (재귀 포함)
      ...enrichedBundles.flatMap((b: any) =>
        b.clips.flatMap((clip: any) => ClipUtils.collectClipAndDependentIds(clip))
      )
    ]);

    // 🟡 잔여 클립(remainingClips) 후처리 ----------------------------------
    const remainingClips = flatClips.filter((clip) => !containerClipIds.has(clip.id));

    const processedRemainingClips = this.mergeDependentClips(remainingClips, flatClips);

    // (4) 최종 allClips 조립
    const combinedAllClips = [
      ...processedRemainingClips,
      ...enrichedTemplateGroups,
      ...enrichedBundles
    ].sort((a: any, b: any) => (a.startTime ?? 0) - (b.startTime ?? 0));

    /* ------------------------------------------------------------------
        디버깅 로그
    ------------------------------------------------------------------ */
    console.log('🔄 정리 후 allClips:', combinedAllClips.length, combinedAllClips);
    console.log('🔄 bundles:', enrichedBundles.map((b: any) => b.id));
    console.log('🔄 templateGroups:', enrichedTemplateGroups.map((tg: any) => tg.id));

    return {
      structuredAllClips: combinedAllClips,
      bundles: enrichedBundles,
      templateGroups: enrichedTemplateGroups
    };
  }

  /**
   * 재귀적 TTS 생성
   * 모든 중첩 레벨의 텍스트 아이템에 대해 TTS 생성
   */
  private async generateTTSRecursively(
    items: ResourceItem[],
    pathPrefix: string = ''
  ): Promise<Record<string, { url: string; duration: number }>> {
    const ttsFiles: Record<string, { url: string; duration: number }> = {};

    for (const item of items) {
      const currentPath = pathPrefix ? `${pathPrefix}_${item.name}` : item.name;

      if (item.isIterator && item.containers) {
        // 컨테이너 아이템: 각 컨테이너에 대해 재귀 처리
        for (let containerIndex = 0; containerIndex < item.containers.length; containerIndex++) {
          const container = item.containers[containerIndex];
          const containerPath = `${currentPath}_c${containerIndex + 1}`;

          // 재귀 호출: 컨테이너 내부 아이템들 처리
          const containerTtsFiles = await this.generateTTSRecursively(
            container.items,
            containerPath
          );

          // 결과 병합
          Object.assign(ttsFiles, containerTtsFiles);
        }
      } else if (item.data?.type === 'text' && item.data.text) {
        // 일반 텍스트 아이템: TTS 생성
        try {
          // 언어 자동 감지 및 음성 선택 처리
          const { finalLanguage, finalVoice } = this.processLanguageAndVoice(
            item.data.text,
            item.data.language,
            item.data.voice
          );

          const ttsParams: any = {
            text: item.data.text,
            language: finalLanguage
          };

          // 음성이 지정된 경우 추가
          if (finalVoice) {
            ttsParams.voice = finalVoice;
          }

          console.log('🎵 TTS 생성 요청:', {
            path: currentPath,
            text: item.data.text.substring(0, 50) + '...',
            originalLanguage: item.data.language,
            originalVoice: item.data.voice,
            finalLanguage,
            finalVoice: finalVoice || '(시스템 기본값)'
          });

          const ttsResult = await this.ttsService.generateAudio(ttsParams);

          ttsFiles[currentPath] = {
            url: ttsResult.url,
            duration: ttsResult.duration
          };

          // 단순 이름으로도 저장 (하위 호환성을 위해)
          if (currentPath !== item.name) {
            ttsFiles[item.name] = {
              url: ttsResult.url,
              duration: ttsResult.duration
            };
          }

          this.statistics.ttsGenerated++;

          console.log(`🎵 TTS 생성: ${currentPath} = "${item.data.text}" (${ttsResult.duration}s)`);
        } catch (error) {
          console.warn(`TTS 생성 실패 for ${currentPath}:`, error);
        }
      } else if ((item.data as any)?.type === 'long-sentence' && (item.data as any)?.items) {
        // LongSentence 아이템: 각 데이터 항목에 대해 TTS 생성
        try {
          const longSentenceData = (item.data as any).items as Array<{ text: string, mediaUrl: string }>;
          const language = (item.data as any).language || 'ko';

          console.log(`📋 LongSentence TTS 생성 시작: ${currentPath} (${longSentenceData.length}개 항목)`);

          for (let dataIndex = 0; dataIndex < longSentenceData.length; dataIndex++) {
            const dataItem = longSentenceData[dataIndex];
            const itemPath = `${currentPath}_data${dataIndex + 1}`;

            if (dataItem.text && dataItem.text.trim()) {
              // 언어 자동 감지 및 음성 선택 처리
              const { finalLanguage, finalVoice } = this.processLanguageAndVoice(
                dataItem.text,
                language,
                undefined // voice는 기본값 사용
              );

              const ttsParams: any = {
                text: dataItem.text,
                language: finalLanguage
              };

              // 음성이 지정된 경우 추가
              if (finalVoice) {
                ttsParams.voice = finalVoice;
              }

              console.log(`🎵 LongSentence TTS 생성 요청:`, {
                path: itemPath,
                text: dataItem.text.substring(0, 50) + '...',
                dataIndex: dataIndex + 1,
                finalLanguage,
                finalVoice: finalVoice || '(시스템 기본값)'
              });

              const ttsResult = await this.ttsService.generateAudio(ttsParams);

              ttsFiles[itemPath] = {
                url: ttsResult.url,
                duration: ttsResult.duration
              };

              this.statistics.ttsGenerated++;

              console.log(`🎵 LongSentence TTS 생성 완료: ${itemPath} (${ttsResult.duration}s)`);
            } else {
              console.log(`⏭️ 빈 텍스트 항목 건너뛰기: ${itemPath}`);
            }
          }
        } catch (error) {
          console.warn(`LongSentence TTS 생성 실패 for ${currentPath}:`, error);
        }
      }
    }

    return ttsFiles;
  }

  /**
   * 재귀적 템플릿 처리 - 핵심 함수
   * 각 클립을 순서적으로 처리하면서 컨테이너를 만나면 재귀 호출
   */
  protected async processTemplate(
    template: any,
    structuredAllClips: any[],
    resourceData: ResourceData,
    ttsFiles: Record<string, { url: string; duration: number }>
  ): Promise<any> {
    const currentOffset = this.timeOffsetManager.getCurrentOffset();
    console.log(`🔄 템플릿 처리 시작:`, {
      timeOffset: currentOffset,
      tracks: template.tracks?.length || 0
    });

    const result = JSON.parse(JSON.stringify(template)); // 깊은 복사

    const resultTracks: any[] = result.tracks.map((track: any) => {
      return {
        ...track,
        clips: []
      };
    });

    // 각 클립을 순차적으로 처리 (processClip에서 모든 시간 계산 담당)
    for (const clip of structuredAllClips) {
      const processedClips = await this.processClip(
        clip,
        resourceData.items,
        ttsFiles
      );

      // 처리된 클립들을 각 트랙에 추가
      for (const processedClip of processedClips) {
        resultTracks.find((track: any) => track.id === processedClip.trackId)?.clips.push(processedClip);
      }
    }

    // 2단계: 끝점 재조정이 필요한 클립들 처리
    await this.adjustEndpointsForSpecialClips(structuredAllClips, resultTracks);

    // 폰트 로딩을 위한 더미 text 클립 추가
    this.insertDummyFontClips(resultTracks);

    return {
      ...result,
      tracks: resultTracks
    };
  }

  /**
   * 개별 클립 처리 - 모든 시간 계산의 중심
   * 핵심: 기준 클립만 오프셋을 변경하고, 모든 클립은 현재 오프셋을 적용받음
   */
  private async processClip(
    clip: any,
    resourceItems: ResourceItem[],
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>
  ): Promise<any[]> {
    return await this.processClipWithPath(clip, resourceItems, ttsFiles, '');
  }

  /**
   * 경로 정보를 포함한 클립 처리
   */
  private async processClipWithPath(
    clip: any,
    resourceItems: ResourceItem[],
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>,
    resourcePathPrefix: string = ''
  ): Promise<any[]> {
    // 1. 컨테이너인 경우 확장 처리
    if (clip.clips) {
      console.log(`📦 컨테이너 처리: ${clip.name || clip.id}`);
      return await this.expandContainerGroupWithPath(clip, resourceItems, ttsFiles, resourcePathPrefix);
    }

    // 2. 기준 클립이고 종속 클립들이 있는 경우
    if (clip.baseClipProperties?.isBaseClip && clip.dependentClips?.length > 0) {
      return await this.processBaseClipWithDependentsWithPath(clip, resourceItems, ttsFiles, resourcePathPrefix);
    }

    // 3. 일반 클립 처리 - 리소스 경로 포함
    const resourceItem = this.findMatchingResourceItem(resourceItems, clip.name);
    const fullResourcePath = resourcePathPrefix ? `${resourcePathPrefix}_${clip.name}` : clip.name;
    const processedClip = await this.processSingleClip(clip, resourceItems, ttsFiles, resourceItem, fullResourcePath);


    // 3.1. LongSentence 확장된 클립인지 확인
    if (processedClip.__isLongSentenceExpanded && processedClip.__expandedClips) {
      console.log(`📦 LongSentence 확장 클립 처리: ${processedClip.__expandedClips.length}개 클립`);

      const expandedClips = processedClip.__expandedClips;
      const offsettedExpandedClips: any[] = [];

      // 4.1. 각 확장된 클립에 현재 오프셋 적용
      for (const expandedClip of expandedClips) {
        const offsettedExpandedClip = this.applyCurrentOffset(expandedClip);
        offsettedExpandedClips.push(offsettedExpandedClip);

        // 확장된 클립들에서도 폰트 수집 (이 시점에서 추가 수집)
        ClipUtils.collectFontsFromClip(offsettedExpandedClip, this.usedFonts);

        // 원본-처리된 클립 매핑 저장
        if (clip.id) {
          const existingIds = this.originalToProcessedClipMap.get(clip.id) || [];
          existingIds.push(offsettedExpandedClip.id);
          this.originalToProcessedClipMap.set(clip.id, existingIds);
        }
      }

      // 4.2. 기준 클립이면 첫 번째 확장 클립을 기준으로 길이 변화 계산
      if (clip.baseClipProperties?.isBaseClip && offsettedExpandedClips.length > 0) {
        const firstExpandedClip = offsettedExpandedClips[0];
        const lastExpandedClip = offsettedExpandedClips[offsettedExpandedClips.length - 1];

        // 확장된 전체 길이 계산
        const expandedTotalDuration = (lastExpandedClip.startTime + lastExpandedClip.duration) - firstExpandedClip.startTime;
        const originalDuration = clip.duration || (clip.endTime - clip.startTime) || 0;
        const durationDelta = expandedTotalDuration - originalDuration;

        if (durationDelta !== 0) {
          this.timeOffsetManager.addBaseClipDelta(durationDelta, clip.id || clip.name);
          console.log(`📏 LongSentence 길이 변화: ${originalDuration} → ${expandedTotalDuration} (Δ${durationDelta})`);
        }

        // 첫 번째 클립을 기준 클립으로 저장
        this.processedBaseClipsMap.set(clip.id, firstExpandedClip);
      }

      return offsettedExpandedClips;
    }

    // 4. 기준 클립이면 길이 변화를 전역 오프셋에 누적
    if (clip.baseClipProperties?.isBaseClip) {
      const durationDelta = this.calculateDurationDelta(clip, processedClip);
      if (durationDelta !== 0) {
        this.timeOffsetManager.addBaseClipDelta(durationDelta, clip.id || clip.name);
      }
    }

    // 5. 모든 클립에 현재 오프셋 적용
    const offsettedClip = this.applyCurrentOffset(processedClip);

    // 6. 기준 클립이면 처리된 클립 맵에 저장
    if (clip.baseClipProperties?.isBaseClip) {
      this.processedBaseClipsMap.set(clip.id, offsettedClip);
    }

    // 7. 원본-처리된 클립 매핑 저장
    if (clip.id) {
      const existingIds = this.originalToProcessedClipMap.get(clip.id) || [];
      existingIds.push(offsettedClip.id);
      this.originalToProcessedClipMap.set(clip.id, existingIds);
    }

    return [offsettedClip];
  }

  /**
   * 기준 클립과 종속 클립들을 함께 처리
   */
  private async processBaseClipWithDependents(
    baseClip: any,
    resourceItems: ResourceItem[],
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>
  ): Promise<any[]> {
    return await this.processBaseClipWithDependentsWithPath(baseClip, resourceItems, ttsFiles, '');
  }

  /**
   * 경로 정보를 포함한 기준 클립과 종속 클립들 처리
   */
  private async processBaseClipWithDependentsWithPath(
    baseClip: any,
    resourceItems: ResourceItem[],
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>,
    resourcePathPrefix: string = ''
  ): Promise<any[]> {
    console.log(`🎯 기준 클립 처리: ${baseClip.name} (종속 클립 ${baseClip.dependentClips.length}개)`);

    const processedClips: any[] = [];

    // 1. 기준 클립 처리 (데이터 적용만, 오프셋은 나중에)
    const baseResourceItem = this.findMatchingResourceItem(resourceItems, baseClip.name);
    const baseFullResourcePath = resourcePathPrefix ? `${resourcePathPrefix}_${baseClip.name}` : baseClip.name;
    const processedBaseClip = await this.processSingleClip(baseClip, resourceItems, ttsFiles, baseResourceItem, baseFullResourcePath);

    // 3. 기준 클립에 현재 오프셋 적용
    const offsettedBaseClip = this.applyCurrentOffset(processedBaseClip);
    processedClips.push(offsettedBaseClip);

    // 처리된 기준 클립을 맵에 저장 (다른 클립의 끝점 참조용)
    this.processedBaseClipsMap.set(baseClip.id, offsettedBaseClip);

    // 4. 종속 클립들 처리 (앵커 기반 + 현재 오프셋 적용)
    for (const dependentClip of baseClip.dependentClips) {
      const clonedDepClip = structuredClone(dependentClip);
      clonedDepClip.id = ClipUtils.generateUniqueId(dependentClip.id, this.idCounter++);

      // 앵커 관계를 기반으로 시간 계산 (오프셋 적용된 기준 클립 기준)
      this.applyAnchorBasedTiming(clonedDepClip, offsettedBaseClip);

      // 종속 클립 데이터 적용 (이미 앵커로 위치가 계산되었으므로 추가 오프셋 없음)
      const depMatchingItem = this.findMatchingResourceItem(resourceItems, dependentClip.name);
      const depFullResourcePath = resourcePathPrefix ? `${resourcePathPrefix}_${dependentClip.name}` : dependentClip.name;
      const processedDepClip = await this.processSingleClip(
        clonedDepClip,
        resourceItems,
        ttsFiles,
        depMatchingItem || baseResourceItem,
        depFullResourcePath
      );

      processedClips.push(processedDepClip);

      // 종속 클립도 매핑 저장
      if (dependentClip.id) {
        const existingIds = this.originalToProcessedClipMap.get(dependentClip.id) || [];
        existingIds.push(processedDepClip.id);
        this.originalToProcessedClipMap.set(dependentClip.id, existingIds);
      }
    }

    // 2. 기준 클립의 길이 변화를 전역 오프셋에 누적
    const durationDelta = this.calculateDurationDelta(baseClip, processedBaseClip);
    if (durationDelta !== 0) {
      this.timeOffsetManager.addBaseClipDelta(durationDelta, baseClip.id || baseClip.name);
    }

    // 기준 클립 매핑 저장
    if (baseClip.id) {
      const existingIds = this.originalToProcessedClipMap.get(baseClip.id) || [];
      existingIds.push(offsettedBaseClip.id);
      this.originalToProcessedClipMap.set(baseClip.id, existingIds);
    }

    return processedClips;
  }

  /**
   * 컨테이너 그룹 확장 (템플릿 그룹, 번들)
   */
  private async expandContainerGroup(
    containerClip: any,
    resourceItems: ResourceItem[],
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>
  ): Promise<any[]> {
    return await this.expandContainerGroupWithPath(containerClip, resourceItems, ttsFiles, '');
  }

  /**
   * 경로 정보를 포함한 컨테이너 그룹 확장
   */
  private async expandContainerGroupWithPath(
    containerClip: any,
    resourceItems: ResourceItem[],
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>,
    resourcePathPrefix: string = ''
  ): Promise<any[]> {
    const matchingItem = this.findMatchingResourceContainer(resourceItems, containerClip.name);

    if (!matchingItem) {
      // 매칭되는 컨테이너가 없으면 원본 클립들에 현재 오프셋만 적용
      const offsettedClips = containerClip.clips.map((clip: any) => this.applyCurrentOffset(clip));

      // 템플릿 그룹인 경우 처리된 템플릿 그룹 맵에 저장
      if (containerClip.mediaType === 'template' && containerClip.id) {
        const offsettedContainer = this.applyCurrentOffset(containerClip);
        this.processedTemplateGroupsMap.set(containerClip.id, offsettedContainer);
      }

      return offsettedClips;
    }

    return await this.expandContainerWithPath(containerClip, matchingItem, ttsFiles, resourcePathPrefix);
  }

  /**
   * 컨테이너 확장 - 재귀 호출의 핵심
   * 핵심: 컨테이너 확장으로 인한 실제 점유 시간을 오프셋에 반영
   */
  private async expandContainer(
    originalClip: any,
    resourceItems: ResourceItem,
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>
  ): Promise<any[]> {
    return await this.expandContainerWithPath(originalClip, resourceItems, ttsFiles, '');
  }

  /**
   * 경로 정보를 포함한 컨테이너 확장
   */
  private async expandContainerWithPath(
    originalClip: any,
    resourceItems: ResourceItem,
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>,
    resourcePathPrefix: string = ''
  ): Promise<any[]> {
    console.log(`📦 컨테이너 확장: ${resourceItems.containers?.length || 0}개 인스턴스)`);

    const expandedClips: any[] = [];
    const clipsToProcess = originalClip.clips || [originalClip];
    const parentOffset = this.timeOffsetManager.getCurrentOffset();

    // 원래 컨테이너의 템플릿 길이 계산
    const originalContainerDuration = ClipUtils.calculateOriginalContainerDuration(originalClip);

    // 각 컨테이너 인스턴스에 대해 처리
    let cumulativeActualDuration = 0;

    for (let containerIndex = 0; containerIndex < (resourceItems.containers?.length || 0); containerIndex++) {
      const container = resourceItems.containers![containerIndex];

      // 이번 인스턴스의 시작 위치 계산
      const instanceStartOffset = this.timeOffsetManager.calculateInstanceStartOffset(
        parentOffset,
        cumulativeActualDuration
      );

      // 컨테이너 컨텍스트 진입 (새로운 시간 기준점 설정)
      this.timeOffsetManager.pushContainerContext(
        instanceStartOffset,
        `${resourceItems.name}_instance_${containerIndex}`
      );

      // 이번 반복에서 처리된 클립들
      const instanceClips: any[] = [];

      for (const clip of clipsToProcess) {
        const clonedClip = JSON.parse(JSON.stringify(clip));
        clonedClip.id = ClipUtils.generateUniqueId(clip.id, this.idCounter++);

        // 재귀적으로 클립 처리 (내부에서 알아서 시간 계산)
        // 컨테이너 경로를 전달하여 TTS 키 매핑이 올바르게 되도록 함
        const currentContainerPath = resourcePathPrefix
          ? `${resourcePathPrefix}_${resourceItems.name}_c${containerIndex + 1}`
          : `${resourceItems.name}_c${containerIndex + 1}`;

        const processedClips = await this.processClipWithPath(
          clonedClip,
          container.items,
          ttsFiles,
          currentContainerPath
        );
        instanceClips.push(...processedClips);

        // 컨테이너 내부 클립들도 매핑 저장
        for (const processedClip of processedClips) {
          if (clip.id) {
            const existingIds = this.originalToProcessedClipMap.get(clip.id) || [];
            existingIds.push(processedClip.id);
            this.originalToProcessedClipMap.set(clip.id, existingIds);
          }
        }
      }

      // 컨테이너 컨텍스트 복귀
      this.timeOffsetManager.popContainerContext(`${resourceItems.name}_instance_${containerIndex}`);

      // 이번 반복의 실제 지속시간 계산
      if (instanceClips.length > 0) {
        const minStartTime = Math.min(...instanceClips.map(c => c.startTime || 0));
        const maxEndTime = Math.max(...instanceClips.map(c => c.endTime || 0));
        const actualInstanceDuration = maxEndTime - minStartTime;

        console.log(`📊 반복 ${containerIndex + 1}: 시작=${instanceStartOffset.toFixed(2)}, 실제지속시간=${actualInstanceDuration.toFixed(2)}`);

        // 다음 반복을 위한 누적 지속시간 업데이트
        cumulativeActualDuration += actualInstanceDuration;
      }

      expandedClips.push(...instanceClips);
      this.statistics.bundlesProcessed++;
    }

    // 핵심: 컨테이너 확장으로 인한 추가 시간을 전역 오프셋에 반영
    const actualTotalDuration = cumulativeActualDuration;
    const expansionTime = this.timeOffsetManager.calculateContainerExpansionTime(
      originalContainerDuration,
      actualTotalDuration
    );

    if (expansionTime > 0) {
      this.timeOffsetManager.addContainerExpansionTime(expansionTime, resourceItems.name);
      console.log(`🚀 컨테이너 확장 시간 반영: ${resourceItems.name}, 원래=${originalContainerDuration.toFixed(2)}, 실제=${actualTotalDuration.toFixed(2)}, 확장=${expansionTime.toFixed(2)}`);
    }

    // 템플릿 그룹인 경우 확장된 전체를 맵에 저장
    if (originalClip.mediaType === 'template' && originalClip.id && expandedClips.length > 0) {
      const minStartTime = Math.min(...expandedClips.map(c => c.startTime || 0));
      const maxEndTime = Math.max(...expandedClips.map(c => c.endTime || 0));
      const processedTemplateGroup = {
        ...originalClip,
        startTime: minStartTime,
        endTime: maxEndTime,
        duration: maxEndTime - minStartTime
      };
      this.processedTemplateGroupsMap.set(originalClip.id, processedTemplateGroup);
      console.log(`📦 템플릿 그룹 캐시 저장: ${originalClip.id}, 시간: ${minStartTime.toFixed(2)} ~ ${maxEndTime.toFixed(2)}`);
    }

    console.log(`✅ 컨테이너 확장 완료: ${expandedClips.length}개 클립 생성, 확장시간: ${expansionTime.toFixed(2)}초`);
    return expandedClips;
  }


  /**
   * 2단계: 끝점 재조정이 필요한 클립들 처리
   * 모든 클립이 생성된 후 실행되어 순서 의존성 문제 해결
   */
  private async adjustEndpointsForSpecialClips(
    structuredAllClips: any[],
    resultTracks: any[]
  ): Promise<void> {
    console.log('🔄 2단계: 끝점 재조정 시작');

    // 1. 모든 기준 클립과 템플릿의 최종 위치 정보 수집
    const referencePositions = this.buildReferencePositionsMap(resultTracks);

    // 2. 재귀적으로 모든 클립을 탐색하여 끝점 재조정이 필요한 클립들 처리
    await this.processClipsRecursively(structuredAllClips, referencePositions, resultTracks);

    console.log('✅ 2단계: 끝점 재조정 완료');
  }

  /**
   * 재귀적으로 모든 클립을 탐색하여 끝점 재조정 처리
   */
  private async processClipsRecursively(
    clips: any[],
    referencePositions: Map<string, { startTime: number; endTime: number }>,
    resultTracks: any[]
  ): Promise<void> {
    for (const clip of clips) {
      // 1. 현재 클립이 끝점 재조정이 필요한지 확인
      await this.checkAndAdjustClipEndpoint(clip, referencePositions, resultTracks);

      // 2. 중첩된 클립들이 있으면 재귀 처리
      if (clip.clips && Array.isArray(clip.clips)) {
        await this.processClipsRecursively(clip.clips, referencePositions, resultTracks);
      }

      // 3. 종속 클립들이 있으면 재귀 처리
      if (clip.dependentClips && Array.isArray(clip.dependentClips)) {
        await this.processClipsRecursively(clip.dependentClips, referencePositions, resultTracks);
      }
    }
  }

  /**
   * 개별 클립의 끝점 재조정 필요성 확인 및 처리
   */
  private async checkAndAdjustClipEndpoint(
    originalClip: any,
    referencePositions: Map<string, { startTime: number; endTime: number }>,
    resultTracks: any[]
  ): Promise<void> {
    const props = originalClip.regularClipProperties;
    if (!props) return;

    // 끝점 앵커 정보 확인
    const endAnchor = props.endAnchor || props.endAnchorExtended;
    if (!endAnchor) return;

    // 시작점 앵커 정보
    const startAnchor = props.startAnchor || props.startAnchorExtended;

    // 케이스 1: 시작점과 끝점이 다른 기준점에 연결
    const isDifferentAnchors = this.checkDifferentAnchors(startAnchor, endAnchor);

    // 케이스 2: 끝점만 연결된 경우
    const isEndpointOnlyAnchored = !startAnchor && endAnchor;

    if (isDifferentAnchors || isEndpointOnlyAnchored) {
      // 이 원본 클립에 대응하는 처리된 클립들 찾기
      const processedClipIds = this.originalToProcessedClipMap.get(originalClip.id) || [];

      for (const processedClipId of processedClipIds) {
        // resultTracks에서 해당 클립 찾기
        for (const track of resultTracks) {
          const clipIndex = track.clips.findIndex((c: any) => c.id === processedClipId);
          if (clipIndex >= 0) {
            const clip = track.clips[clipIndex];

            // 끝점 재계산
            const newEndTime = this.calculateEndpointPosition(endAnchor, referencePositions);
            if (newEndTime !== null) {
              clip.endTime = newEndTime;

              // duration 재계산
              if (clip.startTime !== undefined) {
                clip.duration = clip.endTime - clip.startTime;
              }

              console.log(`✅ 끝점 재조정: ${clip.name} - 새 끝점: ${newEndTime.toFixed(2)}, 새 길이: ${clip.duration?.toFixed(2)}`);
            }
          }
        }
      }
    }
  }

  /**
   * 모든 기준 클립과 템플릿의 최종 위치 정보 수집
   */
  private buildReferencePositionsMap(_resultTracks: any[]): Map<string, { startTime: number; endTime: number }> {
    const positions = new Map<string, { startTime: number; endTime: number }>();

    // 처리된 기준 클립 맵에서 가져오기
    for (const [id, clip] of this.processedBaseClipsMap) {
      if (clip.startTime !== undefined && clip.endTime !== undefined) {
        positions.set(id, { startTime: clip.startTime, endTime: clip.endTime });
      }
    }

    // 처리된 템플릿 그룹 맵에서 가져오기
    for (const [id, template] of this.processedTemplateGroupsMap) {
      if (template.startTime !== undefined && template.endTime !== undefined) {
        positions.set(id, { startTime: template.startTime, endTime: template.endTime });
      }
    }

    return positions;
  }

  /**
   * 시작점과 끝점이 다른 기준점에 연결되었는지 확인
   */
  private checkDifferentAnchors(startAnchor: any, endAnchor: any): boolean {
    if (!startAnchor || !endAnchor) return false;

    // 기준 클립 ID 비교
    if (startAnchor.baseClipId && endAnchor.baseClipId) {
      return startAnchor.baseClipId !== endAnchor.baseClipId;
    }

    // 템플릿 그룹 ID 비교
    if (startAnchor.templateGroupId && endAnchor.templateGroupId) {
      return startAnchor.templateGroupId !== endAnchor.templateGroupId;
    }

    // 한쪽은 기준 클립, 다른 쪽은 템플릿 그룹
    return true;
  }

  /**
   * 끝점 앵커 정보를 기반으로 새로운 끝점 위치 계산
   */
  private calculateEndpointPosition(
    endAnchor: any,
    referencePositions: Map<string, { startTime: number; endTime: number }>
  ): number | null {
    const offset = endAnchor.offset || 0;
    let referenceId: string | null = null;
    let referencePosition: { startTime: number; endTime: number } | undefined;

    // 기준 클립 참조
    if (endAnchor.baseClipId) {
      referenceId = endAnchor.baseClipId;
    }
    // 템플릿 그룹 참조
    else if (endAnchor.templateGroupId) {
      referenceId = endAnchor.templateGroupId;
    }

    if (!referenceId) return null;

    referencePosition = referencePositions.get(referenceId);
    if (!referencePosition) {
      console.warn(`⚠️ 참조 위치를 찾을 수 없음: ${referenceId}`);
      return null;
    }

    // 앵커 포인트에 따라 계산
    if (endAnchor.anchorPoint === 'start') {
      return referencePosition.startTime + offset;
    } else if (endAnchor.anchorPoint === 'end') {
      return referencePosition.endTime + offset;
    }

    return null;
  }


  /**
   * 앵커 기반 시간 계산
   */
  private applyAnchorBasedTiming(dependentClip: any, baseClip: any): void {
    const props = dependentClip.regularClipProperties;
    if (!props) return;

    // startAnchor 처리
    if (props.startAnchor) {
      const offset = props.startAnchor.offset || 0;
      if (props.startAnchor.anchorPoint === 'start') {
        dependentClip.startTime = baseClip.startTime + offset;
      } else if (props.startAnchor.anchorPoint === 'end') {
        dependentClip.startTime = baseClip.endTime + offset;
      }
    }

    // startAnchorExtended 처리
    if (props.startAnchorExtended) {
      const offset = props.startAnchorExtended.offset || 0;
      if (props.startAnchorExtended.anchorPoint === 'start') {
        dependentClip.startTime = baseClip.startTime + offset;
      } else if (props.startAnchorExtended.anchorPoint === 'end') {
        dependentClip.startTime = baseClip.endTime + offset;
      }
    }

    // endAnchor 처리 - 지금은 단일 기준 클립 기반이므로 같은 baseClip 사용
    if (props.endAnchor) {
      const offset = props.endAnchor.offset || 0;
      if (props.endAnchor.anchorPoint === 'start') {
        dependentClip.endTime = baseClip.startTime + offset;
      } else if (props.endAnchor.anchorPoint === 'end') {
        dependentClip.endTime = baseClip.endTime + offset;
      }
    }

    // endAnchorExtended 처리 - 지금은 단일 기준 클립 기반이므로 같은 baseClip 사용
    if (props.endAnchorExtended) {
      const offset = props.endAnchorExtended.offset || 0;
      if (props.endAnchorExtended.anchorPoint === 'start') {
        dependentClip.endTime = baseClip.startTime + offset;
      } else if (props.endAnchorExtended.anchorPoint === 'end') {
        dependentClip.endTime = baseClip.endTime + offset;
      }
    }

    // duration 재계산
    if (dependentClip.startTime !== undefined && dependentClip.endTime !== undefined) {
      dependentClip.duration = dependentClip.endTime - dependentClip.startTime;
    }
  }


  /**
   * 단일 클립 처리 (데이터 적용만, 오프셋은 별도 처리)
   */
  private async processSingleClip(
    clip: any,
    resourceItems: ResourceItem[],
    ttsFiles: Record<string, string> | Record<string, { url: string; duration: number }>,
    forcedResourceItem?: ResourceItem | null,
    resourcePath?: string
  ): Promise<any> {
    let processedClip = { ...clip };
    processedClip.id = ClipUtils.generateUniqueId(clip.id, this.idCounter++);

    // 리소스 아이템 찾기
    const resourceItem = forcedResourceItem !== undefined
      ? forcedResourceItem
      : this.findMatchingResourceItem(resourceItems, clip.name);

    if (!resourceItem || !resourceItem.data) {
      // 폰트 수집 (폰트 로딩 문제 해결용)
      ClipUtils.collectFontsFromClip(processedClip, this.usedFonts);

      this.statistics.totalClips++;
      return processedClip;
    }

    // LongSentence 클립 처리 (우선순위가 높음)
    if (processedClip.mediaType === 'longsentence') {
      console.log(`🔄 LongSentence 클립 처리 시작: ${processedClip.name}`);

      // 리소스 데이터에서 long-sentence 타입 데이터 확인
      if ((resourceItem.data as any).type === 'long-sentence') {
        console.log(`📋 long-sentence 타입 리소스 데이터 적용: ${resourceItem.name}`);

        // LongSentenceEngine이 기대하는 형식으로 클립 데이터 설정
        processedClip.data = (resourceItem.data as any).items; // Array<{text: string, mediaUrl: string}>
        processedClip.language = (resourceItem.data as any).language;

        console.log(`📝 Long Sentence 데이터 적용:`, {
          name: processedClip.name,
          dataItemCount: processedClip.data?.length || 0,
          language: processedClip.language,
          firstText: processedClip.data?.[0]?.text?.substring(0, 50) + '...'
        });
      }

      try {
        // LongSentenceEngine을 사용하여 클립 변환
        // 기준 트랙 ID를 명시적으로 전달하여 트랙 배치 규칙 적용
        const baseTrackId = processedClip.trackId;
        const conversionResult = await this.longSentenceEngine.convertLongSentence(
          processedClip,
          baseTrackId, // 기준 트랙 ID 전달하여 트랙 배치 규칙 적용
          (progress) => console.log(`📊 LongSentence 변환 진행: ${progress}%`)
        );

        if (conversionResult.success && conversionResult.generatedClips) {
          console.log(`✅ LongSentence 변환 완료: ${conversionResult.generatedClips.length}개 클립 생성`);

          // 변환된 클립들을 플랫 배열로 변환하여 반환
          const flattenedClips: any[] = [];
          let baseClipFound = false;

          conversionResult.generatedClips.forEach((clipPair) => {
            if (clipPair.sentenceClip) {
              flattenedClips.push(clipPair.sentenceClip);
              // LongSentence에서 생성된 Sentence 클립들의 폰트 수집
              ClipUtils.collectFontsFromClip(clipPair.sentenceClip, this.usedFonts);
              if (clipPair.sentenceClip.baseClipProperties?.isBaseClip) {
                baseClipFound = true;
                console.log(`🎯 기준 클립 발견: Sentence 클립 ${clipPair.sentenceClip.name}`);
              }
            }
            if (clipPair.audioClip) {
              flattenedClips.push(clipPair.audioClip);
              // Audio 클립도 폰트 수집 (혹시 모를 경우를 대비)
              ClipUtils.collectFontsFromClip(clipPair.audioClip, this.usedFonts);
              if (clipPair.audioClip.baseClipProperties?.isBaseClip) {
                baseClipFound = true;
                console.log(`🎯 기준 클립 발견: Audio 클립 ${clipPair.audioClip.name}`);
              }
            }
            if (clipPair.mediaClip) {
              flattenedClips.push(clipPair.mediaClip);
              // Media 클립도 폰트 수집 (혹시 모를 경우를 대비)
              ClipUtils.collectFontsFromClip(clipPair.mediaClip, this.usedFonts);
              if (clipPair.mediaClip.baseClipProperties?.isBaseClip) {
                baseClipFound = true;
                console.log(`🎯 기준 클립 발견: Media 클립 ${clipPair.mediaClip.name}`);
              }
            }
          });

          if (!baseClipFound) {
            console.warn(`⚠️ LongSentence 변환에서 기준 클립을 찾을 수 없음: ${processedClip.name}`);
          }

          console.log(`📦 플랫화된 클립 수: ${flattenedClips.length}`);
          this.statistics.totalClips += flattenedClips.length;

          // 변환된 클립들을 배열로 반환 (특별한 플래그 사용)
          return {
            ...processedClip,
            __isLongSentenceExpanded: true,
            __expandedClips: flattenedClips
          };
        } else {
          console.error(`❌ LongSentence 변환 실패: ${conversionResult.error || 'Unknown error'}`);
          // 실패 시 원본 클립 반환 (폰트 수집 포함)
          ClipUtils.collectFontsFromClip(processedClip, this.usedFonts);
          this.statistics.totalClips++;
          return processedClip;
        }
      } catch (error) {
        console.error(`❌ LongSentence 처리 중 오류:`, error);
        // 에러 시 원본 클립 반환 (폰트 수집 포함)
        ClipUtils.collectFontsFromClip(processedClip, this.usedFonts);
        this.statistics.totalClips++;
        return processedClip;
      }
    }

    if (resourceItem.data.type === 'text') {
      // 텍스트 클립 처리
      if (processedClip.mediaType === 'sentence' || processedClip.mediaType === 'text') {
        processedClip.text = resourceItem.data.text;
        console.log(`📝 텍스트 적용: ${processedClip.name} = "${resourceItem.data.text}"`);
      }

      // 오디오 클립 처리 (TTS)
      if (processedClip.mediaType === 'audio') {
        // TTS 키를 경로 포함해서 생성 (생성 시와 동일한 방식)
        const ttsKey = resourcePath || resourceItem.name;

        if (ttsFiles[ttsKey]) {
          const ttsData = ttsFiles[ttsKey];

          // TTS 데이터가 객체인지 문자열인지 확인
          if (typeof ttsData === 'string') {
            // 기존 형식 (URL만 있는 경우)
            processedClip.mediaUrl = ttsData;
            console.log(`🎵 TTS 적용: ${processedClip.name} = ${ttsData}`);
          } else {
            // 새로운 형식 (URL + duration)
            processedClip.mediaUrl = ttsData.url;

            // duration 업데이트 (TTS 결과에서 직접 사용)
            if (ttsData.duration > 0) {
              processedClip.duration = ttsData.duration;
              processedClip.endTime = processedClip.startTime + ttsData.duration;
            }

            console.log(`🎵 TTS 적용: ${processedClip.name} = ${ttsData.url} (${ttsData.duration}s)`);
          }
        } else {
          // TTS 파일이 없으면 동적으로 생성
          console.log(`🔄 TTS 파일 누락, 동적 생성 중: ${ttsKey}`);

          try {
            // 언어 자동 감지 및 음성 선택 처리
            const { finalLanguage, finalVoice } = this.processLanguageAndVoice(
              resourceItem.data.text || '',
              resourceItem.data.language,
              resourceItem.data.voice
            );

            const ttsParams: any = {
              text: resourceItem.data.text,
              language: finalLanguage
            };

            // 음성이 지정된 경우 추가
            if (finalVoice) {
              ttsParams.voice = finalVoice;
            }

            console.log('🎵 동적 TTS 생성 요청:', {
              key: ttsKey,
              text: (resourceItem.data.text || '').substring(0, 50) + '...',
              originalLanguage: resourceItem.data.language,
              originalVoice: resourceItem.data.voice,
              finalLanguage,
              finalVoice: finalVoice || '(시스템 기본값)'
            });

            const ttsResult = await this.ttsService.generateAudio(ttsParams);

            // 생성된 TTS를 ttsFiles에 추가
            const ttsData = {
              url: ttsResult.url,
              duration: ttsResult.duration
            };

            ttsFiles[ttsKey] = ttsData;

            // 하위 호환성을 위해 단순 이름으로도 저장
            if (ttsKey !== resourceItem.name) {
              ttsFiles[resourceItem.name] = ttsData;
            }

            // 클립에 TTS 적용
            processedClip.mediaUrl = ttsData.url;
            if (ttsData.duration > 0) {
              processedClip.duration = ttsData.duration;
              processedClip.endTime = processedClip.startTime + ttsData.duration;
            }

            this.statistics.ttsGenerated++;
            console.log(`✅ TTS 동적 생성 완료: ${ttsKey} = "${resourceItem.data.text}" (${ttsData.duration}s)`);

          } catch (error) {
            // TTS 생성 실패 시 에러 발생
            const availableKeys = Object.keys(ttsFiles);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(
              `TTS 파일을 찾을 수 없고 동적 생성도 실패했습니다: "${ttsKey}"\n` +
              `클립: ${processedClip.name} (${processedClip.mediaType})\n` +
              `리소스: ${resourceItem.name}\n` +
              `텍스트: "${resourceItem.data.text}"\n` +
              `TTS 생성 오류: ${errorMessage}\n` +
              `사용 가능한 TTS 키: [${availableKeys.join(', ')}]`
            );
          }
        }
      }
    }

    // 폰트 수집 (폰트 로딩 문제 해결용)
    ClipUtils.collectFontsFromClip(processedClip, this.usedFonts);

    this.statistics.totalClips++;
    return processedClip;
  }

  /**
   * 현재 전역 오프셋 적용 (모든 클립이 사용)
   */
  private applyCurrentOffset(clip: any): any {
    const currentOffset = this.timeOffsetManager.getCurrentOffset();

    if (currentOffset === 0) return clip;

    return {
      ...clip,
      startTime: (clip.startTime || 0) + currentOffset,
      endTime: (clip.endTime || 0) + currentOffset
    };
  }

  /**
   * 기준 클립의 길이 변화 계산
   */
  private calculateDurationDelta(originalClip: any, processedClip: any): number {
    const originalDuration = originalClip.duration || (originalClip.endTime - originalClip.startTime) || 0;
    const newDuration = processedClip.duration || (processedClip.endTime - processedClip.startTime) || 0;

    return newDuration - originalDuration;
  }


  /**
   * 리소스 아이템 찾기 (재귀적)
   */
  private findMatchingResourceItem(items: ResourceItem[], clipName: string): ResourceItem | null {
    for (const item of items) {
      if (item.name === clipName) {
        return item;
      }

      // // 재귀적으로 중첩된 컨테이너에서도 찾기
      // if (item.containers) {
      //   for (const container of item.containers) {
      //     const found = this.findMatchingResourceItem(container.items, clipName);
      //     if (found) return found;
      //   }
      // }
    }
    return null;
  }

  private findMatchingResourceContainer(items: ResourceItem[], clipName: string): ResourceItem | null {
    for (const item of items) {
      if (item.name === clipName && item.containers) {
        return item;
      }
    }
    return null;
  }

  /**
 * 리소스 데이터 정규화 - v1.0 데이터를 v2.0 형식으로 변환
 */
  private normalizeResourceData(resourceData: ResourceData): ResourceData {
    // 이미 v2.0 형식이면 그대로 반환
    if (resourceData.version === '2.0.0' && resourceData.metadata?.hasNestedStructure) {
      return resourceData;
    }

    console.log('📊 리소스 데이터 정규화 중...');


    const normalized: ResourceData = {
      ...resourceData,
      version: '2.0.0'
    };

    return normalized;
  }

  /**
   * 기준 클립 집합에 의존하는 종속 클립 매핑 생성
   * @param flatClips 전체 평탄화된 클립 목록
   * @param baseClipIds 종속성을 계산할 기준 클립들의 ID 집합
   */
  private buildDependentMap(flatClips: any[], baseClipIds: Set<string>): Record<string, any[]> {
    const dependentMap: Record<string, any[]> = {};

    for (const clip of flatClips) {
      // 기준 클립 자신이거나 regularClipProperties 가 없으면 스킵
      if (baseClipIds.has(clip.id) || !clip.regularClipProperties) continue;

      const { startAnchor, startAnchorExtended } = clip.regularClipProperties;
      const matchedAnchor = [startAnchor, startAnchorExtended]
        .find((a: any) => a && baseClipIds.has(a.baseClipId));

      if (matchedAnchor) {
        (dependentMap[matchedAnchor.baseClipId] ??= []).push(clip);
      }
    }

    return dependentMap;
  }

  /**
   * 결과 데이터에서 종속성 정보 제거
   * - templateGroupId, bundleId 제거
   * - isGrouped, isBundled 제거
   * - dependentClips 배열 제거
   * - 템플릿 그룹, 번들 정보 제거
   */
  private removeDependencies(data: any): any {
    const cleaned = JSON.parse(JSON.stringify(data)); // 깊은 복사

    // 트랙의 클립들에서 종속성 정보 제거
    if (cleaned.tracks) {
      cleaned.tracks.forEach((track: any) => {
        if (track.clips) {
          track.clips.forEach((clip: any) => {
            // 템플릿/번들 관련 속성 제거
            delete clip.templateGroupId;
            delete clip.bundleId;
            delete clip.isGrouped;
            delete clip.isBundled;
            delete clip.isProtected;
            delete clip.dependentClips;

            // LongSentence 관련 임시 플래그 제거
            delete clip.__isLongSentenceExpanded;
            delete clip.__expandedClips;

            // 기준 클립 관련 정리 (선택적)
            // 필요하다면 baseClipProperties도 제거할 수 있습니다
            // delete clip.baseClipProperties;

            // 앵커 관련 정리 (선택적)
            // regularClipProperties는 유지하되, 필요없는 참조만 제거
            if (clip.regularClipProperties) {
              // 템플릿 그룹 ID 참조 제거
              ['startAnchor', 'endAnchor', 'startAnchorExtended', 'endAnchorExtended'].forEach(anchorName => {
                delete clip.regularClipProperties[anchorName];
                // const anchor = clip.regularClipProperties[anchorName];
                // if (anchor && anchor.templateGroupId) {
                //   delete anchor.templateGroupId;
                // }
              });
            }
          });
        }
      });
    }

    // 최상위 템플릿 그룹, 번들 정보 제거
    delete cleaned.templateGroups;
    delete cleaned.bundles;
    delete cleaned.bundleTemplateGroupRelations;

    // 메타데이터 정리
    if (cleaned.metadata) {
      delete cleaned.metadata.hasComplexRelations;
      delete cleaned.metadata.bundleGroupMappings;
    }

    return cleaned;
  }

  /**
   * remainingClips 에서 종속 클립을 제거하고, 부모 기준 클립의 dependentClips 로 붙여줌
   */
  private mergeDependentClips(remainingClips: any[], flatClips: any[]): any[] {
    // (1) 기준 클립 식별
    const baseClips = remainingClips.filter((clip) => clip.baseClipProperties?.isBaseClip);

    // (2) 기준 클립 ↔ 종속 클립 매핑
    const dependentMap = this.buildDependentMap(flatClips, new Set(baseClips.map((c: any) => c.id)));

    // (3) 종속 클립 ID 집합
    const dependentClipIds = new Set(
      Object.values(dependentMap).flat().map((c: any) => c.id)
    );

    // (4) 종속 클립 제거 & 부모에 부착
    return remainingClips
      .filter((clip) => !dependentClipIds.has(clip.id))
      .map((clip) => {
        if (dependentMap[clip.id]) {
          return {
            ...clip,
            dependentClips: dependentMap[clip.id]
          };
        }
        return clip;
      });
  }

  /* ------------------------------------------------------------------
      Helper: 템플릿 그룹/번들 enrichment
  ------------------------------------------------------------------ */

  private enrichTemplateGroups(templateGroups: any[], flatClips: any[]): any[] {
    return templateGroups.map((tg: any) => {
      const baseClips = flatClips.filter(
        (clip) => clip.templateGroupId === tg.id && clip.baseClipProperties?.isBaseClip
      );
      const baseClipIds = new Set(baseClips.map((c: any) => c.id));

      const dependentMap = this.buildDependentMap(flatClips, baseClipIds);

      let clips = baseClips.map((bc: any) => ({
        ...bc,
        dependentClips: dependentMap[bc.id] ?? []
      }));

      // 1️⃣ 번들 enrichment
      const enrichedBundles = this.enrichBundles(tg.originalBundles ?? [], flatClips);

      // 2️⃣ 번들에 포함된 기준클립 ID 수집 → clips 배열에서 제거
      const bundleClipIdSet = new Set(
        enrichedBundles.flatMap((b: any) => b.clips.map((c: any) => c.id))
      );

      clips = clips.filter((clip: any) => !bundleClipIdSet.has(clip.id));

      // 3️⃣ 번들 객체를 clips 배열에 추가 (컨테이너로 작동)
      clips.push(...enrichedBundles);
      clips = clips.sort((a: any, b: any) => a.startTime - b.startTime);

      // 4️⃣ 그룹 시간 범위 재계산 (클립 + 번들 포함)
      const timeCandidates = clips.flatMap((c: any) =>
        c.startTime !== undefined && c.endTime !== undefined ? [c.startTime, c.endTime] : []
      );

      let { startTime, endTime } = tg;
      if (timeCandidates.length) {
        startTime = Math.min(...timeCandidates);
        endTime = Math.max(...timeCandidates);
      }

      return { ...tg, startTime, endTime, clips, mediaType: 'template' };
    });
  }

  private enrichBundles(bundles: any[], flatClips: any[]): any[] {
    return bundles.map((bundle: any) => {
      const baseClips = flatClips.filter(
        (clip) => clip.bundleId === bundle.id && clip.baseClipProperties?.isBaseClip
      );
      const baseClipIds = new Set(baseClips.map((c: any) => c.id));

      const dependentMap = this.buildDependentMap(flatClips, baseClipIds);

      const clips = baseClips.map((bc: any) => ({
        ...bc,
        dependentClips: dependentMap[bc.id] ?? []
      }));

      let { startTime, endTime } = bundle;
      if (baseClips.length) {
        startTime = Math.min(...baseClips.map((c: any) => c.startTime ?? 0));
        endTime = Math.max(...baseClips.map((c: any) => c.endTime ?? 0));
      }

      return { ...bundle, startTime, endTime, clips, mediaType: 'bundle' };
    });
  }

  /* ------------------------------------------------------------------
      Helper: 그룹/번들 필터링
  ------------------------------------------------------------------ */

  private filterTemplateGroups(template: any, flatClips: any[]): any[] {
    return (template.templateGroups ?? []).filter((tg: any) => {
      const hasDirectClip = flatClips.some((clip: any) => clip.templateGroupId === tg.id);

      const hasBundleRelation = (tg.originalBundles ?? []).some((ob: any) =>
        (template.bundles ?? []).some((b: any) => b.id === ob.id)
      );

      return hasDirectClip || hasBundleRelation;
    });
  }

  private filterBundles(bundles: any[], flatClips: any[], templateGroupIdSet: Set<string>): any[] {
    return bundles.filter((bundle: any) => {
      const hasDirectClip = flatClips.some((clip: any) => clip.bundleId === bundle.id);
      const hasLinkedTemplateGroup = (bundle.templateGroupIds ?? []).some((id: string) =>
        templateGroupIdSet.has(id)
      );
      return hasDirectClip || hasLinkedTemplateGroup;
    });
  }

  /**
   * 원래 컨테이너의 템플릿 길이 계산
   */
  private calculateOriginalContainerDuration(containerClip: any): number {
    if (!containerClip.clips || containerClip.clips.length === 0) {
      return containerClip.duration || (containerClip.endTime - containerClip.startTime) || 0;
    }

    // 컨테이너 내부 클립들의 시간 범위로 계산
    const startTimes = containerClip.clips.map((c: any) => c.startTime || 0);
    const endTimes = containerClip.clips.map((c: any) => c.endTime || c.startTime + c.duration || 0);

    if (startTimes.length === 0 || endTimes.length === 0) return 0;

    const minStart = Math.min(...startTimes);
    const maxEnd = Math.max(...endTimes);

    return maxEnd - minStart;
  }


  /**
   * 프로젝트 duration 자동 계산 및 업데이트
   * 모든 클립들의 최대 endTime을 기준으로 프로젝트 duration을 계산하고 업데이트
   */
  private calculateAndUpdateProjectDuration(data: any): void {
    if (!data?.tracks || !Array.isArray(data.tracks)) {
      console.warn('⚠️ calculateAndUpdateProjectDuration: 유효한 tracks 데이터가 없습니다.');
      return;
    }

    // 모든 트랙의 모든 클립에서 endTime 수집
    const allEndTimes: number[] = [];

    data.tracks.forEach((track: any) => {
      if (track.clips && Array.isArray(track.clips)) {
        track.clips.forEach((clip: any) => {
          if (typeof clip.endTime === 'number' && !isNaN(clip.endTime)) {
            allEndTimes.push(clip.endTime);
          }
        });
      }
    });

    // 최대 endTime 계산
    const maxEndTime = allEndTimes.length > 0 ? Math.max(...allEndTimes) : 0;

    // 프로젝트 설정에서 현재 duration 확인
    const currentDuration = data.projectSettings?.duration || 0;

    // 계산된 최대 endTime이 현재 duration보다 크면 업데이트
    if (maxEndTime > currentDuration) {
      // 약간의 여유 시간 추가 (0.5초)
      const newDuration = maxEndTime + 0.5;

      if (data.projectSettings) {
        data.projectSettings.duration = newDuration;
      } else {
        data.projectSettings = { duration: newDuration };
      }

      console.log(`📏 프로젝트 duration 자동 업데이트: ${currentDuration}s → ${newDuration}s (최대 클립 endTime: ${maxEndTime}s)`);
    } else {
      console.log(`📏 프로젝트 duration 유지: ${currentDuration}s (최대 클립 endTime: ${maxEndTime}s)`);
    }
  }

  /**
   * 클립에서 사용된 폰트를 수집하는 메서드 (폰트 로딩 문제 해결용)
   */
  private collectFontsFromClip(clip: any): void {
    if (!clip) return;

    // Sentence 클립의 폰트 수집
    if (clip.mediaType === 'sentence' && clip.fontFamily) {
      this.usedFonts.add(clip.fontFamily);
      console.log(`🔤 폰트 수집: ${clip.fontFamily} (Sentence 클립: ${clip.name || clip.id})`);
    }

    // LongSentence 확장 클립들에서 폰트 수집
    if (clip.__expandedClips && Array.isArray(clip.__expandedClips)) {
      clip.__expandedClips.forEach((expandedClip: any) => {
        ClipUtils.collectFontsFromClip(expandedClip, this.usedFonts);
      });
    }
  }

  /**
   * 수집된 폰트들을 위한 더미 text 클립들을 생성하는 메서드
   */
  private createDummyTextClipsForFonts(): any[] {
    const dummyClips: any[] = [];

    for (const fontFamily of this.usedFonts) {
      const clipId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const mediaId = `text-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const dummyClip = {
        id: clipId,
        mediaId: mediaId,
        trackId: "track-1000",
        startTime: 0,
        endTime: 0.5,
        duration: 0.5,
        mediaType: "text",
        x: 3000,  // 화면 크기보다 큰 값으로 화면 밖에 배치
        y: 3000,  // 화면 크기보다 큰 값으로 화면 밖에 배치
        width: 1,
        height: 1,
        opacity: 0,  // 완전 투명
        text: "dummy",
        fontSize: 1,
        fontFamily: fontFamily
      };

      dummyClips.push(dummyClip);
      console.log(`🔤 더미 텍스트 클립 생성: ${fontFamily} (ID: ${clipId})`);
    }

    if (dummyClips.length > 0) {
      console.log(`✅ 총 ${dummyClips.length}개 폰트용 더미 클립 생성 완료`);
    }

    return dummyClips;
  }

  /**
   * 폰트 로딩을 위한 더미 text 클립을 track-1000에 삽입
   */
  private insertDummyFontClips(resultTracks: any[]): void {
    const dummyClips = ClipUtils.createDummyTextClipsForFonts(this.usedFonts);
    if (dummyClips.length === 0) return;

    let track1 = resultTracks.find((track: any) => track.id === 'track-1000');
    if (!track1) {
      track1 = {
        id: 'track-1000',
        name: 'track-1000',
        clips: [],
        height: 80,
        isLocked: false,
        isVisible: true,
        displayName: 'Track 1000'
      };
      resultTracks.push(track1);
      console.log('📋 track-1000 생성됨 (더미 클립용)');
    }

    track1.clips.unshift(...dummyClips);
    console.log(`🔤 ${dummyClips.length}개 더미 폰트 클립을 track-1000에 추가 완료`);
  }
}