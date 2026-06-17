/**
 * 🎥 렌더링 작업 관리 API 라우터 (Render Jobs Routes)
 * 
 * 비디오 렌더링 작업의 생성, 관리, 모니터링을 담당하는 RESTful API
 * Remotion 기반 렌더링 엔진과 Redis Queue를 활용한 분산 처리 시스템
 * 
 * 🎯 주요 기능:
 * - 렌더링 작업 생성 및 큐 관리
 * - 실시간 진행률 추적 (SSE)
 * - 작업 상태 관리 (pending, processing, completed, failed)
 * - 렌더링 로그 조회 및 디버깅
 * - 작업 취소 및 재시도 기능
 * - 큐 통계 및 성능 모니터링
 * 
 * 📡 API 엔드포인트:
 * - POST /render-jobs - 새 렌더링 작업 생성
 * - GET /render-jobs - 렌더링 작업 목록 조회 (페이지네이션)
 * - GET /render-jobs/:id - 특정 작업 상세 조회
 * - POST /render-jobs/:id/cancel - 작업 취소
 * - GET /render-jobs/:id/logs - 렌더링 로그 조회
 * - GET /render-jobs/:id/progress - 실시간 진행률 (SSE)
 * - GET /render-queue/stats - 큐 통계 조회
 * 
 * 🔧 기술적 특징:
 * - Redis Bull Queue 분산 처리
 * - Server-Sent Events (SSE) 실시간 업데이트
 * - Prisma ORM 데이터베이스 연동
 * - 페이지네이션 및 필터링 지원
 * - 지수 백오프 재시도 로직
 * - 메모리 효율적 스트림 처리
 * 
 * 🎬 렌더링 파이프라인:
 * - 프로젝트 데이터 검증
 * - 렌더링 작업 큐 등록
 * - Remotion 엔진 실행
 * - 진행률 실시간 업데이트
 * - 결과 파일 저장 및 검증
 * 
 * 📊 상태 관리:
 * - pending: 대기 중
 * - processing: 렌더링 중
 * - completed: 완료
 * - failed: 실패
 * - cancelled: 취소됨
 * 
 * 🎛️ 렌더링 설정:
 * - 화질 (quality): 1-4 레벨
 * - 프레임률 (fps): 24, 30, 60
 * - 코덱 (codec): h264, h265
 * - 해상도 및 비트레이트
 * 
 * @version 1.0.0
 * @author YouTube Generator Team
 * @since 2024-01-01
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { renderQueue } from '../queue';

const router = express.Router();
const prisma = new PrismaClient();

// Create a new render job
router.post('/render-jobs', async (req, res) => {
  try {
    const { 
      projectId, 
      transformResult, 
      renderSettings = {} 
    } = req.body;

    if (!projectId || !transformResult) {
      return res.status(400).json({
        error: 'projectId and transformResult are required'
      });
    }

    // Create render job in database
    const renderJob = await prisma.renderJob.create({
      data: {
        projectId,
        renderSettings,
        status: 'pending',
        progress: 0
      }
    });

    // Add job to render queue
    const job = await renderQueue.add('render-video', {
      projectId,
      transformResult,
      renderSettings: {
        quality: renderSettings.quality || 2,
        fps: renderSettings.fps || 30,
        codec: renderSettings.codec || 'h264',
        port: renderSettings.port || 5002
      }
    }, {
      jobId: renderJob.id,
      delay: 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    res.json({
      success: true,
      renderJob: {
        id: renderJob.id,
        projectId: renderJob.projectId,
        status: renderJob.status,
        progress: renderJob.progress,
        createdAt: renderJob.createdAt
      },
      queueJob: {
        id: job.id,
        name: job.name
      }
    });

  } catch (error) {
    console.error('Error creating render job:', error);
    res.status(500).json({
      error: 'Failed to create render job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all render jobs
router.get('/render-jobs', async (req, res) => {
  try {
    const { projectId, status, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (projectId) where.projectId = projectId as string;
    if (status) where.status = status as string;

    const renderJobs = await prisma.renderJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        project: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });

    const total = await prisma.renderJob.count({ where });

    res.json({
      success: true,
      data: renderJobs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      }
    });

  } catch (error) {
    console.error('Error fetching render jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch render jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific render job
router.get('/render-jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const renderJob = await prisma.renderJob.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            name: true,
            status: true,
            template: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!renderJob) {
      return res.status(404).json({
        error: 'Render job not found'
      });
    }

    // Get queue job status if available
    const queueJob = await renderQueue.getJob(id);
    const queueStatus = queueJob ? {
      state: await queueJob.getState(),
      progress: queueJob.progress(),
      attempts: queueJob.attemptsMade,
      delay: queueJob.opts.delay
    } : null;

    res.json({
      success: true,
      data: {
        ...renderJob,
        queueStatus
      }
    });

  } catch (error) {
    console.error('Error fetching render job:', error);
    res.status(500).json({
      error: 'Failed to fetch render job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel render job
router.post('/render-jobs/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job exists in database
    const renderJob = await prisma.renderJob.findUnique({
      where: { id }
    });

    if (!renderJob) {
      return res.status(404).json({
        error: 'Render job not found'
      });
    }

    if (renderJob.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot cancel completed job'
      });
    }

    // Try to cancel queue job
    const queueJob = await renderQueue.getJob(id);
    if (queueJob) {
      await queueJob.remove();
    }

    // Update database status
    await prisma.renderJob.update({
      where: { id },
      data: {
        status: 'failed',
        error: 'Cancelled by user',
        completedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Render job cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling render job:', error);
    res.status(500).json({
      error: 'Failed to cancel render job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get render job logs
router.get('/render-jobs/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;

    const queueJob = await renderQueue.getJob(id);
    if (!queueJob) {
      return res.status(404).json({
        error: 'Queue job not found'
      });
    }

    const logs = queueJob.returnvalue || queueJob.failedReason || 'No logs available';

    res.json({
      success: true,
      data: {
        jobId: id,
        logs,
        state: await queueJob.getState(),
        progress: queueJob.progress(),
        attempts: queueJob.attemptsMade,
        timestamp: queueJob.timestamp
      }
    });

  } catch (error) {
    console.error('Error fetching render job logs:', error);
    res.status(500).json({
      error: 'Failed to fetch render job logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get render progress (SSE endpoint)
router.get('/render-jobs/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial data
    const renderJob = await prisma.renderJob.findUnique({
      where: { id }
    });

    if (!renderJob) {
      res.write(`data: ${JSON.stringify({ error: 'Render job not found' })}\n\n`);
      res.end();
      return;
    }

    // Send current status
    res.write(`data: ${JSON.stringify({
      id: renderJob.id,
      status: renderJob.status,
      progress: renderJob.progress,
      error: renderJob.error,
      completedAt: renderJob.completedAt
    })}\n\n`);

    // If job is already completed, close connection
    if (renderJob.status === 'completed' || renderJob.status === 'failed') {
      res.end();
      return;
    }

    // Set up periodic updates
    const interval = setInterval(async () => {
      try {
        const updatedJob = await prisma.renderJob.findUnique({
          where: { id }
        });

        if (updatedJob) {
          res.write(`data: ${JSON.stringify({
            id: updatedJob.id,
            status: updatedJob.status,
            progress: updatedJob.progress,
            error: updatedJob.error,
            completedAt: updatedJob.completedAt
          })}\n\n`);

          // Close connection if job is done
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            clearInterval(interval);
            res.end();
          }
        }
      } catch (error) {
        console.error('Error in SSE update:', error);
        clearInterval(interval);
        res.end();
      }
    }, 2000); // Update every 2 seconds

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error('Error setting up SSE for render progress:', error);
    res.status(500).json({
      error: 'Failed to set up progress stream',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get queue statistics
router.get('/render-queue/stats', async (req, res) => {
  try {
    const waiting = await renderQueue.getWaiting();
    const active = await renderQueue.getActive();
    const completed = await renderQueue.getCompleted();
    const failed = await renderQueue.getFailed();

    res.json({
      success: true,
      data: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      }
    });

  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({
      error: 'Failed to fetch queue statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;