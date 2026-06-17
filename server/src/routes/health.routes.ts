/**
 * 헬스체크 및 시스템 상태 API 라우터
 */

import express from 'express';
import { appConfig } from '../config/app.config';
import { fontService } from '../services/font.service';
import { mediaService } from '../services/media.service';
import { templateService } from '../services/template.service';

const router = express.Router();

/**
 * GET /api/health - 기본 헬스체크
 */
router.get('/health', (req, res) => {
  const used = process.memoryUsage();

  res.json({
    status: 'ok',
    server: 'Video Editor Server v2.0 (Modular)',
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    },
    uptime: `${Math.round(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    config: {
      port: appConfig.port,
      uploadLimit: appConfig.uploadLimit,
      timeout: `${appConfig.timeout / 1000}s`
    }
  });
});

/**
 * GET /api/health/detailed - 상세 시스템 상태
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const used = process.memoryUsage();

    // 각 서비스 상태 확인
    const fontStatus = fontService.isReady();
    const fontStats = fontStatus ? fontService.getStats() : null;

    const mediaStats = await mediaService.getLibraryStats();
    const templateStats = await templateService.getStats();

    res.json({
      status: 'ok',
      server: 'Video Editor Server v2.0 (Modular)',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.round(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      memory: {
        rss: used.rss,
        heapTotal: used.heapTotal,
        heapUsed: used.heapUsed,
        external: used.external,
        arrayBuffers: used.arrayBuffers,
        formatted: {
          rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
        }
      },
      services: {
        font: {
          ready: fontStatus,
          stats: fontStats
        },
        media: {
          ready: true,
          stats: mediaStats
        },
        template: {
          ready: true,
          stats: templateStats
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      }
    });

  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get detailed health status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/status - 시스템 전체 상태 요약
 */
router.get('/status', async (req, res) => {
  try {
    const services = {
      font: fontService.isReady(),
      media: true, // 미디어 서비스는 항상 준비됨
      template: true, // 템플릿 서비스는 항상 준비됨
      render: fontService.isReady() // 렌더링은 폰트 서비스에 의존
    };

    const allReady = Object.values(services).every(ready => ready);

    res.json({
      status: allReady ? 'ready' : 'initializing',
      services,
      readyCount: Object.values(services).filter(ready => ready).length,
      totalServices: Object.keys(services).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/version - 버전 정보
 */
router.get('/version', (req, res) => {
  res.json({
    server: 'Video Editor Server',
    version: '2.0.0',
    architecture: 'Modular',
    built: new Date().toISOString(),
    node: process.version,
    modules: {
      express: '~4.18.0',
      remotion: '~4.0.0',
      multer: '~1.4.0'
    }
  });
});

/**
 * POST /api/health/gc - 가비지 컬렉션 강제 실행 (개발용)
 */
router.post('/health/gc', (req, res) => {
  try {
    if (global.gc) {
      const beforeMemory = process.memoryUsage();
      global.gc();
      const afterMemory = process.memoryUsage();

      res.json({
        success: true,
        message: 'Garbage collection executed',
        memory: {
          before: {
            heapUsed: `${Math.round(beforeMemory.heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(beforeMemory.heapTotal / 1024 / 1024)} MB`
          },
          after: {
            heapUsed: `${Math.round(afterMemory.heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(afterMemory.heapTotal / 1024 / 1024)} MB`
          },
          freed: `${Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024)} MB`
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Garbage collection not available. Start with --expose-gc flag.'
      });
    }
  } catch (error) {
    console.error('GC error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute garbage collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 업타임을 읽기 좋은 형태로 포맷
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}

export default router;
