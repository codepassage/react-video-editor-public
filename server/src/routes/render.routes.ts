/**
 * 비디오 렌더링 API 라우터
 */

import express from 'express';
import path from 'path';
import { createRenderService } from '../services/render.service';
import { fontService } from '../services/font.service';
import { Track, ProjectSettings } from '../types/render.types';

const router = express.Router();

// 렌더 서비스 인스턴스 생성
const renderService = createRenderService(fontService);

/**
 * POST /api/render - 비디오 렌더링
 */
router.post('/render', async (req, res) => {
  try {
    const { tracks, projectSettings }: { tracks: Track[], projectSettings: ProjectSettings } = req.body;

    if (!tracks || !projectSettings) {
      return res.status(400).json({
        success: false,
        error: 'tracks and projectSettings are required'
      });
    }

    // 렌더링 서비스 초기화 확인
    if (!renderService.isBundleReady()) {
      console.log('📦 Bundle not ready, creating...');
      await renderService.createBundle();
    }

    // 폰트 서비스 초기화 확인
    if (!fontService.isReady()) {
      console.log('🎨 Font service not ready, initializing...');
      await fontService.initialize();
    }

    console.log('🎬 Starting video render...', {
      tracksCount: tracks.length,
      resolution: `${projectSettings.width}x${projectSettings.height}`,
      duration: `${projectSettings.duration}s`,
      fps: projectSettings.fps
    });

    // 비디오 렌더링 실행
    const outputPath = await renderService.renderVideo(tracks, projectSettings);

    console.log('✅ Render completed, sending file...');

    // 렌더링된 파일 직접 전송
    res.sendFile(path.resolve(outputPath), (err) => {
      if (err) {
        console.error('File send error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to send rendered video',
            details: err.message
          });
        }
      }
    });

  } catch (error) {
    console.error('❌ Render failed:', error);

    res.status(500).json({
      success: false,
      error: 'Video rendering failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check server logs for more information'
    });
  }
});

/**
 * GET /api/render/status - 렌더링 시스템 상태 확인
 */
router.get('/render/status', async (req, res) => {
  try {
    const isBundleReady = renderService.isBundleReady();
    const isFontServiceReady = fontService.isReady();
    const bundleLocation = renderService.getBundleLocation();

    res.json({
      success: true,
      status: {
        bundleReady: isBundleReady,
        fontServiceReady: isFontServiceReady,
        bundleLocation,
        readyToRender: isBundleReady && isFontServiceReady
      }
    });

  } catch (error) {
    console.error('Render status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check render status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/render/prepare - 렌더링 시스템 준비
 */
router.post('/render/prepare', async (req, res) => {
  try {
    console.log('🔧 Preparing render system...');

    // 번들 생성
    if (!renderService.isBundleReady()) {
      await renderService.createBundle();
    }

    // 폰트 서비스 초기화
    if (!fontService.isReady()) {
      await fontService.initialize();
    }

    res.json({
      success: true,
      message: 'Render system prepared successfully',
      status: {
        bundleReady: renderService.isBundleReady(),
        fontServiceReady: fontService.isReady(),
        bundleLocation: renderService.getBundleLocation()
      }
    });

  } catch (error) {
    console.error('Render prepare error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to prepare render system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/render/stats - 렌더링 통계
 */
router.get('/render/stats', async (req, res) => {
  try {
    const stats = await renderService.getRenderStats();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        totalSizeFormatted: `${Math.round(stats.totalSize / 1024 / 1024 * 100) / 100} MB`,
        averageSizeFormatted: `${Math.round(stats.averageSize / 1024 / 1024 * 100) / 100} MB`
      }
    });

  } catch (error) {
    console.error('Render stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve render stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/render/validate - 렌더링 요청 검증
 */
router.post('/render/validate', (req, res) => {
  try {
    const { tracks, projectSettings } = req.body;

    const errors: string[] = [];

    // 기본 필드 검증
    if (!tracks) errors.push('tracks is required');
    if (!projectSettings) errors.push('projectSettings is required');

    if (tracks && !Array.isArray(tracks)) {
      errors.push('tracks must be an array');
    }

    if (projectSettings) {
      if (!projectSettings.width || projectSettings.width <= 0) {
        errors.push('projectSettings.width must be positive');
      }
      if (!projectSettings.height || projectSettings.height <= 0) {
        errors.push('projectSettings.height must be positive');
      }
      if (!projectSettings.duration || projectSettings.duration <= 0) {
        errors.push('projectSettings.duration must be positive');
      }
      if (!projectSettings.fps || projectSettings.fps <= 0) {
        errors.push('projectSettings.fps must be positive');
      }
    }

    // 트랙 내용 검증
    if (tracks && Array.isArray(tracks)) {
      tracks.forEach((track: any, index: number) => {
        if (!track.id) errors.push(`Track ${index}: id is required`);
        if (!track.clips || !Array.isArray(track.clips)) {
          errors.push(`Track ${index}: clips must be an array`);
        }
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.json({
      success: true,
      message: 'Render request is valid',
      estimated: {
        durationInFrames: Math.round(projectSettings.duration * (projectSettings.fps || 30)),
        totalClips: tracks.reduce((sum: number, track: any) => sum + (track.clips?.length || 0), 0)
      }
    });

  } catch (error) {
    console.error('Render validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate render request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
