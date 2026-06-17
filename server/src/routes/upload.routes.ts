/**
 * 파일 업로드 API 라우터
 */

import express from 'express';
import { uploadSingle, uploadMultiple } from '../config/multer.config';
import { uploadService } from '../services/upload.service';

const router = express.Router();

/**
 * POST /api/upload - 단일 파일 업로드
 */
router.post('/upload', uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        uploadService.createErrorResponse('No file uploaded')
      );
    }

    // 파일 유효성 검증
    const validation = uploadService.validateFile(req.file);
    if (!validation.isValid) {
      return res.status(400).json(
        uploadService.createErrorResponse('File validation failed', validation.error)
      );
    }

    // 파일 업로드 처리
    const fileInfo = await uploadService.handleSingleUpload(req.file);
    const response = uploadService.createUploadResponse(fileInfo);

    res.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json(
      uploadService.createErrorResponse(
        'Failed to upload file',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * POST /api/upload-multiple - 다중 파일 업로드
 */
router.post('/upload-multiple', uploadMultiple, async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json(
        uploadService.createErrorResponse('No files uploaded')
      );
    }

    // 모든 파일 유효성 검증
    for (const file of req.files) {
      const validation = uploadService.validateFile(file);
      if (!validation.isValid) {
        return res.status(400).json(
          uploadService.createErrorResponse(
            `File validation failed for ${file.originalname}`,
            validation.error
          )
        );
      }
    }

    // 다중 파일 업로드 처리
    const filesInfo = await uploadService.handleMultipleUpload(req.files);
    const response = uploadService.createMultipleUploadResponse(filesInfo);

    res.json(response);

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json(
      uploadService.createErrorResponse(
        'Failed to upload files',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/upload/limits - 업로드 제한 정보 조회
 */
router.get('/upload/limits', (req, res) => {
  try {
    res.json({
      success: true,
      limits: {
        maxFileSize: '1000MB',
        maxFiles: 10,
        supportedTypes: {
          image: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'svg'],
          video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'],
          audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']
        }
      }
    });
  } catch (error) {
    console.error('Upload limits error:', error);
    res.status(500).json(
      uploadService.createErrorResponse(
        'Failed to retrieve upload limits',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

export default router;
