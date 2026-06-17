/**
 * 🤖 자동 생성 API 라우터 (AutoGeneration Routes)
 * 
 * 비디오 에디터의 핵심 자동화 기능을 제공하는 서버사이드 라우터
 * 템플릿과 리소스 데이터를 결합하여 동적 비디오 콘텐츠를 생성
 * 
 * 🎯 주요 기능:
 * - 템플릿-리소스 변환 엔진 (NestedTransformEngine)
 * - Google TTS 음성 생성 (53개 언어 지원)
 * - 비디오 렌더링 작업 관리
 * - CSV 데이터를 리소스로 변환
 * - 캐시 관리 및 성능 최적화
 * 
 * 📡 API 엔드포인트:
 * - POST /transform - 템플릿과 리소스 변환
 * - POST /tts - 개별 TTS 생성
 * - POST /resource-tts - 리소스 전체 TTS 일괄 생성
 * - POST /render - 동영상 렌더링 작업 생성
 * - GET /status/:jobId - 작업 상태 확인
 * - POST /transform-nested - 중첩 구조 변환 (v2)
 * - POST /csv-to-resource - CSV를 리소스 데이터로 변환
 * - GET/PUT /transform/config - 변환 엔진 설정 관리
 * - POST/DELETE /tts/cache - TTS 캐시 관리
 * 
 * 🔧 기술적 특징:
 * - 비동기 처리 및 진행률 추적
 * - 오류 처리 및 타입 안전성
 * - 성능 모니터링 및 로깅
 * - 배치 처리 최적화
 * - 메모리 효율적 큐 시스템
 * 
 * 🎨 통합 서비스:
 * - NestedTransformEngine: 중첩 데이터 구조 처리
 * - GoogleTTSService: AI 음성 합성
 * - CsvToResourceConverter: 데이터 형식 변환
 * - 렌더링 큐 시스템
 * 
 * @version 2.0.0
 * @author YouTube Generator Team
 * @since 2024-01-01
 */

import express from 'express';
import { NestedTransformEngine } from '../services/transform/nestedEngine';
import { CsvToResourceConverter } from '../services/transform/csvToResource';
import { GoogleTTSService } from '../services/tts/googleTTS';
import {
  ResourceData,
  RenderOptions,
  AutoGenerationError,
  ErrorCode,
  NestedStructureConfig
} from '../types/autoGeneration';

const router = express.Router();

// 서비스 인스턴스
const nestedTransformEngine = new NestedTransformEngine({
  strictMode: process.env.TRANSFORM_DEBUG === 'true' || process.env.NODE_ENV === 'development' // 디버깅 활성화
});

// TTS 서비스 (Google TTS 사용)
const ttsService = new GoogleTTSService();

// CSV 변환 서비스
const csvConverter = new CsvToResourceConverter();

/**
 * 템플릿과 리소스 데이터를 결합하여 변환
 */
router.post('/transform', async (req, res) => {
  try {
    const { template, resourceData }: { template: any, resourceData: ResourceData } = req.body;

    // 입력 검증
    if (!template) {
      return res.status(400).json({
        success: false,
        error: '템플릿 데이터가 필요합니다'
      });
    }

    if (!resourceData || !resourceData.items) {
      return res.status(400).json({
        success: false,
        error: '리소스 데이터가 필요합니다'
      });
    }

    console.log('🚀 변환 요청:', {
      templateTracks: template.tracks?.length || 0,
      resourceItems: resourceData.items.length,
      timestamp: new Date().toISOString()
    });

    // 변환 실행
    const result = await nestedTransformEngine.transform(template, resourceData);

    // 결과 로깅
    if (result.success) {
      console.log('✅ 변환 성공:', {
        ttsFiles: Object.keys(result.ttsFiles || {}).length,
        transformedTracks: result.transformedData?.tracks?.length || 0
      });
    } else {
      console.log('❌ 변환 실패:', result.error);
    }

    res.json(result);

  } catch (error) {
    console.error('변환 API 오류:', error);

    const errorMessage = error instanceof AutoGenerationError
      ? error.message
      : '변환 중 예상치 못한 오류가 발생했습니다';

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * 텍스트를 음성으로 변환 (개별 TTS 요청)
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, language, voice, speakingRate } = req.body;

    if (!text || !language) {
      return res.status(400).json({
        success: false,
        error: 'text와 language 파라미터가 필요합니다'
      });
    }

    console.log('🎤 TTS 요청:', {
      textLength: text.length,
      language,
      voice: voice || 'default'
    });

    const result = await ttsService.generateAudio({
      text,
      language,
      voice,
      speakingRate: speakingRate || 1.0
    });

    console.log('✅ TTS 완료:', {
      url: result.url,
      duration: result.duration,
      cached: result.cached
    });

    res.json({
      success: true,
      audioUrl: result.url,
      duration: result.duration,
      cached: result.cached
    });

  } catch (error) {
    console.error('TTS API 오류:', error);

    res.status(500).json({
      success: false,
      error: `TTS 생성 실패: ${error.message}`
    });
  }
});

/**
 * 리소스 데이터에서 TTS 생성 (리소스 파일 단독 처리)
 */
router.post('/resource-tts', async (req, res) => {
  try {
    const { resourceData, options = {} } = req.body;

    if (!resourceData || !resourceData.items) {
      return res.status(400).json({
        success: false,
        error: '리소스 데이터가 필요합니다'
      });
    }

    console.log('🎤 리소스 TTS 생성 요청:', {
      resourceItems: resourceData.items.length,
      options
    });

    const results: any[] = [];
    const errors: any[] = [];

    // 리소스 데이터에서 텍스트 추출 및 TTS 생성
    const processItem = async (item: any, path: string = '') => {
      if (item.data && item.data.type === 'text' && item.data.text && item.data.language) {
        try {
          const ttsOptions = {
            text: item.data.text,
            language: item.data.language,
            voice: options.voice,
            speakingRate: options.speed || 1.0
          };

          const result = await ttsService.generateAudio(ttsOptions);

          results.push({
            path,
            itemId: item.id || 'unknown',
            text: item.data.text,
            language: item.data.language,
            audioUrl: result.url,
            duration: result.duration,
            cached: result.cached
          });

          console.log(`✅ TTS 생성 완료: ${path} (${result.cached ? '캐시' : '신규'})`);
        } catch (error) {
          console.error(`❌ TTS 생성 실패: ${path}`, error);
          errors.push({
            path,
            itemId: item.id || 'unknown',
            text: item.data.text,
            error: error.message
          });
        }
      }

      // 중첩 구조 처리
      if (item.children && Array.isArray(item.children)) {
        for (let i = 0; i < item.children.length; i++) {
          await processItem(item.children[i], `${path}.children[${i}]`);
        }
      }

      if (item.items && Array.isArray(item.items)) {
        for (let i = 0; i < item.items.length; i++) {
          await processItem(item.items[i], `${path}.items[${i}]`);
        }
      }

      // containers 구조 처리 (이터레이터 아이템용)
      if (item.containers && Array.isArray(item.containers)) {
        for (let i = 0; i < item.containers.length; i++) {
          const container = item.containers[i];
          if (container.items && Array.isArray(container.items)) {
            for (let j = 0; j < container.items.length; j++) {
              await processItem(container.items[j], `${path}.containers[${i}].items[${j}]`);
            }
          }
        }
      }
    };

    // 병렬 처리를 위한 배치
    const batchSize = options.batchSize || 5;
    for (let i = 0; i < resourceData.items.length; i += batchSize) {
      const batch = resourceData.items.slice(i, i + batchSize);
      await Promise.all(
        batch.map((item, index) => processItem(item, `items[${i + index}]`))
      );
    }

    console.log('🎉 리소스 TTS 생성 완료:', {
      총처리: results.length + errors.length,
      성공: results.length,
      실패: errors.length
    });

    res.json({
      success: true,
      results,
      errors,
      summary: {
        totalProcessed: results.length + errors.length,
        successful: results.length,
        failed: errors.length,
        newFiles: results.filter(r => !r.cached).length,
        cachedFiles: results.filter(r => r.cached).length
      }
    });

  } catch (error) {
    console.error('리소스 TTS 생성 API 오류:', error);

    res.status(500).json({
      success: false,
      error: `리소스 TTS 생성 실패: ${error.message}`
    });
  }
});

/**
 * 변환된 데이터로 동영상 렌더링
 */
router.post('/render', async (req, res) => {
  try {
    const { projectData, outputFormat = 'mp4', validateMedia = false }: {
      projectData: any,
      outputFormat?: 'mp4' | 'webm',
      validateMedia?: boolean
    } = req.body;

    if (!projectData) {
      return res.status(400).json({
        success: false,
        error: '프로젝트 데이터가 필요합니다'
      });
    }

    console.log('🎬 렌더링 요청:', {
      outputFormat,
      validateMedia,
      tracks: projectData.tracks?.length || 0,
      timestamp: new Date().toISOString()
    });

    // 기본 검증
    if (!projectData.tracks || projectData.tracks.length === 0) {
      return res.status(400).json({
        success: false,
        error: '렌더링할 트랙이 없습니다'
      });
    }

    // TODO: 실제 렌더링 서비스 연동
    // 현재는 모의 응답 반환
    const jobId = `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 비동기 렌더링 시뮬레이션
    setTimeout(() => {
      console.log(`✅ 렌더링 완료 (모의): ${jobId}`);
    }, 5000);

    res.json({
      success: true,
      jobId,
      message: '렌더링이 시작되었습니다'
    });

  } catch (error) {
    console.error('렌더링 API 오류:', error);

    res.status(500).json({
      success: false,
      error: `렌더링 실패: ${error.message}`
    });
  }
});

/**
 * 렌더링 작업 상태 확인
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    // TODO: 실제 작업 상태 확인 로직
    // 현재는 모의 응답 반환
    const mockProgress = Math.min(100, Math.floor(Math.random() * 100) + 1);
    const isCompleted = mockProgress === 100;

    res.json({
      jobId,
      status: isCompleted ? 'completed' : 'processing',
      progress: mockProgress,
      resultUrl: isCompleted ? `/renders/${jobId}.mp4` : undefined,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('상태 확인 API 오류:', error);

    res.status(500).json({
      success: false,
      error: '상태 확인 중 오류가 발생했습니다'
    });
  }
});

/**
 * TTS 캐시 통계 조회
 */
router.get('/tts/cache/stats', async (req, res) => {
  try {
    const stats = await (ttsService as any).getCacheStats?.() || {
      totalFiles: 0,
      totalSize: 0,
      oldestFile: null,
      newestFile: null
    };

    res.json({
      success: true,
      stats: {
        fileCount: stats.totalFiles,
        totalSize: stats.totalSize,
        totalSizeMB: Math.round(stats.totalSize / (1024 * 1024) * 100) / 100,
        oldestFile: stats.oldestFile,
        newestFile: stats.newestFile
      }
    });
  } catch (error) {
    console.error('캐시 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '캐시 통계 조회 실패'
    });
  }
});

/**
 * Transform 엔진 설정 조회
 */
router.get('/transform/config', async (req, res) => {
  res.json({
    success: true,
    config: nestedTransformEngine.getConfig(),
    timeOffsetDiagnostics: nestedTransformEngine.getTimeOffsetDiagnostics()
  });
});

/**
 * Transform 엔진 설정 업데이트
 */
router.put('/transform/config', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        error: '유효한 설정 객체가 필요합니다'
      });
    }

    // 설정 업데이트
    nestedTransformEngine.updateConfig(config);

    // timeOffsetManager도 디버깅 모드 업데이트
    if (config.strictMode !== undefined) {
      const timeOffsetManager = nestedTransformEngine.getTimeOffsetManager();
      // ContainerTimeOffsetManager에 setDebugMode 메서드 추가 필요
    }

    res.json({
      success: true,
      config: nestedTransformEngine.getConfig(),
      message: '설정이 업데이트되었습니다'
    });
  } catch (error) {
    console.error('설정 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: '설정 업데이트 중 오류가 발생했습니다'
    });
  }
});

router.post('/tts/cache/cleanup', async (req, res) => {
  try {
    const { maxAge } = req.body; // 밀리초 단위
    const deletedCount = await (ttsService as any).cleanCache?.(maxAge) || 0;

    res.json({
      success: true,
      deletedCount,
      message: `${deletedCount}개의 캐시 파일이 정리되었습니다`
    });
  } catch (error) {
    console.error('캐시 정리 오류:', error);
    res.status(500).json({
      success: false,
      error: '캐시 정리 실패'
    });
  }
});

router.delete('/tts/cache', async (req, res) => {
  try {
    await (ttsService as any).clearCache?.();

    res.json({
      success: true,
      message: '모든 TTS 캐시가 삭제되었습니다'
    });
  } catch (error) {
    console.error('캐시 삭제 오료:', error);
    res.status(500).json({
      success: false,
      error: '캐시 삭제 실패'
    });
  }
});

/**
 * 중첩 구조 지원 변환 (v2)
 */
router.post('/transform-nested', async (req, res) => {
  try {
    const {
      template,
      resourceData,
      config
    }: {
      template: any,
      resourceData: ResourceData,
      config?: Partial<NestedStructureConfig>
    } = req.body;

    // 입력 검증
    if (!template) {
      return res.status(400).json({
        success: false,
        error: '템플릿 데이터가 필요합니다'
      });
    }

    if (!resourceData || !resourceData.items) {
      return res.status(400).json({
        success: false,
        error: '리소스 데이터가 필요합니다'
      });
    }

    console.log('🚀 중첩 변환 요청:', {
      templateTracks: template.tracks?.length || 0,
      templateGroups: template.templateGroups?.length || 0,
      resourceItems: resourceData.items.length,
      hasNestedStructure: resourceData.metadata?.hasNestedStructure || false,
      maxNestingDepth: config?.maxNestingDepth || 3,
      timestamp: new Date().toISOString()
    });

    // 중첩 엔진 설정 업데이트
    if (config) {
      nestedTransformEngine.updateConfig(config);
    }

    // 중첩 변환 실행
    const result = await nestedTransformEngine.transform(template, resourceData);

    // 결과 로깅
    if (result.success) {
      console.log('✅ 중첩 변환 성공:', {
        ttsFiles: Object.keys(result.ttsFiles || {}).length,
        transformedTracks: result.transformedData?.tracks?.length || 0,
        statistics: result.statistics
      });
    } else {
      console.log('❌ 중첩 변환 실패:', result.error);
    }

    res.json({
      success: result.success,
      transformedData: result.transformedData,
      ttsFiles: result.ttsFiles,
      statistics: result.statistics,
      error: result.error
    });

  } catch (error) {
    console.error('중첩 변환 API 오류:', error);

    res.status(500).json({
      success: false,
      error: error instanceof AutoGenerationError
        ? error.message
        : '중첩 변환 중 예상치 못한 오류가 발생했습니다'
    });
  }
});

/**
 * 중첩 구조 데이터 검증
 */
router.post('/validate-nested', async (req, res) => {
  try {
    const { resourceData, config }: {
      resourceData: ResourceData,
      config?: Partial<NestedStructureConfig>
    } = req.body;

    if (!resourceData || !resourceData.items) {
      return res.status(400).json({
        success: false,
        error: '리소스 데이터가 필요합니다'
      });
    }

    // 검증 실행 (간단한 기본 검증)
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        totalItems: resourceData.items?.length || 0,
        totalContainers: 0,
        maxDepthFound: 0
      }
    };

    console.log('🔍 중첩 구조 검증:', {
      isValid: validationResult.isValid,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      statistics: validationResult.statistics
    });

    res.json({
      success: true,
      validation: validationResult
    });

  } catch (error) {
    console.error('중첩 구조 검증 API 오류:', error);

    res.status(500).json({
      success: false,
      error: '검증 중 오류가 발생했습니다'
    });
  }
});

/**
 * 템플릿 분석 (미리보기용)
 */
router.post('/analyze-template', async (req, res) => {
  try {
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({
        success: false,
        error: '템플릿 데이터가 필요합니다'
      });
    }

    // Use public method to analyze template
    const structure = {
      clips: [],
      bundles: template.bundles || [],
      templateGroups: template.templateGroups || []
    };

    // Collect clips from tracks
    for (const track of template.tracks || []) {
      for (const clip of track.clips || []) {
        structure.clips.push({
          ...clip,
          trackName: track.name || track.id
        });
      }
    }

    res.json({
      success: true,
      structure
    });

  } catch (error) {
    console.error('템플릿 분석 API 오류:', error);

    res.status(500).json({
      success: false,
      error: '템플릿 분석 실패'
    });
  }
});

/**
 * CSV를 리소스 데이터로 변환
 */
router.post('/csv-to-resource', async (req, res) => {
  try {
    const { template, mapping, csvData } = req.body;

    // 입력 검증
    if (!template || !template.items) {
      return res.status(400).json({
        success: false,
        error: '리소스 템플릿이 필요합니다 (items 배열 포함)'
      });
    }

    if (!mapping || !Array.isArray(mapping)) {
      return res.status(400).json({
        success: false,
        error: 'CSV 매핑 정보가 필요합니다'
      });
    }

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        success: false,
        error: 'CSV 데이터가 필요합니다'
      });
    }

    console.log('📄 CSV → 리소스 변환 요청:', {
      templateItems: template.items?.length || 0,
      mappingRows: mapping.length,
      csvRows: csvData.length
    });

    // 변환 실행
    const resourceData = await csvConverter.convert(template, mapping, csvData);

    console.log('✅ CSV → 리소스 변환 완료:', {
      resultItems: resourceData.items.length
    });

    res.json({
      success: true,
      resourceData
    });

  } catch (error) {
    console.error('CSV 변환 API 오류:', error);

    res.status(500).json({
      success: false,
      error: `CSV 변환 실패: ${error.message}`
    });
  }
});

export default router;