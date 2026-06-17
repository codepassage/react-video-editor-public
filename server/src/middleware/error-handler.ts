/**
 * 에러 처리 미들웨어
 */

import express from 'express';
import multer from 'multer';

/**
 * 글로벌 에러 핸들러
 */
export const errorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.error('Server error:', err);

  // Multer 에러 처리
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size exceeds the maximum limit of 1000MB',
        code: 'FILE_TOO_LARGE'
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Maximum 10 files allowed per upload',
        code: 'TOO_MANY_FILES'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field',
        message: 'Unexpected file field in upload',
        code: 'UNEXPECTED_FILE'
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: err.message,
      code: err.code
    });
  }

  // JSON 파싱 에러
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      code: 'INVALID_JSON'
    });
  }

  // 요청 크기 제한 에러
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request too large',
      message: 'Request body exceeds size limit',
      code: 'REQUEST_TOO_LARGE'
    });
  }

  // 타임아웃 에러
  if (err.code === 'ETIMEDOUT' || err.timeout) {
    return res.status(408).json({
      success: false,
      error: 'Request timeout',
      message: 'Request took too long to process',
      code: 'TIMEOUT'
    });
  }

  // 파일 시스템 에러
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      error: 'File not found',
      message: 'Requested file does not exist',
      code: 'FILE_NOT_FOUND'
    });
  }

  if (err.code === 'EACCES' || err.code === 'EPERM') {
    return res.status(403).json({
      success: false,
      error: 'Permission denied',
      message: 'Insufficient permissions to access resource',
      code: 'PERMISSION_DENIED'
    });
  }

  if (err.code === 'ENOSPC') {
    return res.status(507).json({
      success: false,
      error: 'Insufficient storage',
      message: 'Server storage is full',
      code: 'STORAGE_FULL'
    });
  }

  // 렌더링 관련 에러
  if (err.message && err.message.includes('Remotion')) {
    return res.status(500).json({
      success: false,
      error: 'Rendering failed',
      message: 'Video rendering encountered an error',
      details: err.message,
      code: 'RENDER_ERROR'
    });
  }

  // 폰트 관련 에러
  if (err.message && err.message.includes('font')) {
    return res.status(500).json({
      success: false,
      error: 'Font error',
      message: 'Font processing encountered an error',
      details: err.message,
      code: 'FONT_ERROR'
    });
  }

  // 데이터베이스/파일 저장 에러
  if (err.message && (err.message.includes('SQLITE') || err.message.includes('JSON'))) {
    return res.status(500).json({
      success: false,
      error: 'Data storage error',
      message: 'Failed to save or retrieve data',
      details: err.message,
      code: 'STORAGE_ERROR'
    });
  }

  // 기본 서버 에러
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal server error' : 'Request failed',
    message: status === 500 ? 'An unexpected error occurred' : message,
    details: process.env.NODE_ENV === 'development' ? message : undefined,
    code: 'SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
};

/**
 * 404 핸들러 (라우트를 찾을 수 없음)
 */
export const notFoundHandler = (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint not found: ${req.method} ${req.path}`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      fonts: 'GET /api/fonts',
      upload: 'POST /api/upload',
      render: 'POST /api/render',
      templates: 'GET /api/templates',
      media: 'GET /api/media',
      health: 'GET /api/health'
    }
  });
};

/**
 * 비동기 에러 캐처 래퍼
 * Express 라우터에서 async/await 에러를 자동으로 캐치
 */
export const asyncHandler = (fn: Function) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 에러 로깅 미들웨어
 */
export const errorLogger = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // 에러 정보 로깅
  console.error('🚨 Error Details:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status || err.statusCode
    }
  });

  // 다음 에러 핸들러로 전달
  next(err);
};

/**
 * 개발 환경용 상세 에러 응답
 */
export const developmentErrorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (process.env.NODE_ENV !== 'development') {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message,
    stack: err.stack,
    details: {
      name: err.name,
      code: err.code,
      status: err.status || err.statusCode,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  errorLogger,
  developmentErrorHandler
};
