/**
 * 미디어 파일 관리 API 라우터
 */

import express from 'express';
import { mediaService } from '../services/media.service.prisma';
import { MediaType } from '@prisma/client';

const router = express.Router();

/**
 * GET /api/media - 업로드된 파일 목록 조회 (간단한 형태)
 */
router.get('/media', async (req, res) => {
  try {
    const files = await mediaService.getMediaFiles();
    res.json({
      success: true,
      files
    });

  } catch (error) {
    console.error('Error listing media files:', error);
    res.status(500).json(
      mediaService.createErrorResponse(
        'Failed to list media files',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/files - 미디어 파일 목록 조회 (상세 정보 포함)
 */
router.get('/files', async (req, res) => {
  try {
    const { type } = req.query;
    const mediaType = type as MediaType;

    // 타입 검증
    if (type && !['image', 'video', 'audio'].includes(type as string)) {
      return res.status(400).json(
        mediaService.createErrorResponse('Invalid media type. Must be image, video, or audio')
      );
    }

    const files = await mediaService.getDetailedMediaFiles(mediaType);
    const response = mediaService.createFilesResponse(files);

    res.json(response);

  } catch (error) {
    console.error('Error listing detailed files:', error);
    res.status(500).json(
      mediaService.createErrorResponse(
        'Failed to list files',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/files/:filename - 특정 파일 정보 조회
 */
router.get('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const fileInfo = await mediaService.getFileInfo(decodeURIComponent(filename));

    if (!fileInfo) {
      return res.status(404).json(
        mediaService.createErrorResponse('File not found')
      );
    }

    res.json({
      success: true,
      file: fileInfo
    });

  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json(
      mediaService.createErrorResponse(
        'Failed to get file info',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * DELETE /api/files/:filename - 파일 삭제
 */
router.delete('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const success = await mediaService.deleteFile(decodeURIComponent(filename));

    if (!success) {
      return res.status(404).json(
        mediaService.createErrorResponse('File not found')
      );
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json(
      mediaService.createErrorResponse(
        'Failed to delete file',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/files/search/:query - 파일 검색
 */
router.get('/files/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { type } = req.query;
    const mediaType = type as MediaType;

    const files = await mediaService.searchFiles(
      decodeURIComponent(query),
      mediaType
    );

    const response = mediaService.createFilesResponse(files);
    res.json({
      ...response,
      query: decodeURIComponent(query),
      type: mediaType
    });

  } catch (error) {
    console.error('Error searching files:', error);
    res.status(500).json(
      mediaService.createErrorResponse(
        'Failed to search files',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/media/stats - 미디어 라이브러리 통계
 */
router.get('/media/stats', async (req, res) => {
  try {
    const stats = await mediaService.getLibraryStats();

    res.json({
      success: true,
      stats: {
        ...stats,
        totalSizeFormatted: `${Math.round(stats.totalSize / 1024 / 1024 * 100) / 100} MB`
      }
    });

  } catch (error) {
    console.error('Error getting media stats:', error);
    res.status(500).json(
      mediaService.createErrorResponse(
        'Failed to get media stats',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * POST /api/media/cleanup - 오래된 파일 정리
 */
router.post('/media/cleanup', async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.body;

    if (olderThanDays < 1) {
      return res.status(400).json(
        mediaService.createErrorResponse('olderThanDays must be at least 1')
      );
    }

    const cleanedCount = await mediaService.cleanupOldFiles(olderThanDays);

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old files`,
      cleanedCount,
      olderThanDays
    });

  } catch (error) {
    console.error('Error cleaning up files:', error);
    res.status(500).json(
      mediaService.createErrorResponse(
        'Failed to cleanup files',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/media/types - 지원되는 미디어 타입 정보
 */
router.get('/media/types', (req, res) => {
  try {
    res.json({
      success: true,
      supportedTypes: {
        image: {
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
          mimeTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'image/webp', 'image/bmp', 'image/svg+xml'
          ]
        },
        video: {
          extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'],
          mimeTypes: [
            'video/mp4', 'video/webm', 'video/quicktime',
            'video/x-msvideo', 'video/x-matroska', 'video/x-flv'
          ]
        },
        audio: {
          extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
          mimeTypes: [
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'audio/mp4', 'audio/webm', 'audio/aac', 'audio/flac'
          ]
        }
      }
    });
  } catch (error) {
    console.error('Error getting media types:', error);
    res.status(500).json(
      mediaService.createErrorResponse(
        'Failed to get media types',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

export default router;
