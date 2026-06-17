/**
 * 요청 검증 미들웨어
 */

import express from 'express';
import { Track, ProjectSettings } from '../types/render.types.ts';
import { CreateTemplateRequest } from '../types/template.types.ts';

/**
 * 렌더링 요청 검증 미들웨어
 */
export const validateRenderRequest = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { tracks, projectSettings }: { tracks: Track[], projectSettings: ProjectSettings } = req.body;
  const errors: string[] = [];

  // 기본 필드 검증
  if (!tracks) {
    errors.push('tracks is required');
  } else if (!Array.isArray(tracks)) {
    errors.push('tracks must be an array');
  } else if (tracks.length === 0) {
    errors.push('tracks cannot be empty');
  }

  if (!projectSettings) {
    errors.push('projectSettings is required');
  } else {
    // 프로젝트 설정 검증
    if (!projectSettings.width || typeof projectSettings.width !== 'number' || projectSettings.width <= 0) {
      errors.push('projectSettings.width must be a positive number');
    }
    
    if (!projectSettings.height || typeof projectSettings.height !== 'number' || projectSettings.height <= 0) {
      errors.push('projectSettings.height must be a positive number');
    }
    
    if (!projectSettings.duration || typeof projectSettings.duration !== 'number' || projectSettings.duration <= 0) {
      errors.push('projectSettings.duration must be a positive number');
    }
    
    if (!projectSettings.fps || typeof projectSettings.fps !== 'number' || projectSettings.fps <= 0) {
      errors.push('projectSettings.fps must be a positive number');
    }

    // 해상도 제한 검증
    if (projectSettings.width > 4096) {
      errors.push('projectSettings.width cannot exceed 4096');
    }
    
    if (projectSettings.height > 4096) {
      errors.push('projectSettings.height cannot exceed 4096');
    }

    // 지속 시간 제한 검증 (최대 10분)
    if (projectSettings.duration > 600) {
      errors.push('projectSettings.duration cannot exceed 600 seconds (10 minutes)');
    }

    // FPS 제한 검증
    if (projectSettings.fps > 60) {
      errors.push('projectSettings.fps cannot exceed 60');
    }
  }

  // 트랙 내용 검증
  if (tracks && Array.isArray(tracks)) {
    tracks.forEach((track, trackIndex) => {
      if (!track.id || typeof track.id !== 'string') {
        errors.push(`Track ${trackIndex}: id must be a non-empty string`);
      }
      
      if (!track.clips || !Array.isArray(track.clips)) {
        errors.push(`Track ${trackIndex}: clips must be an array`);
      } else {
        track.clips.forEach((clip: any, clipIndex: number) => {
          if (!clip.id || typeof clip.id !== 'string') {
            errors.push(`Track ${trackIndex}, Clip ${clipIndex}: id must be a non-empty string`);
          }
          
          if (!clip.mediaType || typeof clip.mediaType !== 'string') {
            errors.push(`Track ${trackIndex}, Clip ${clipIndex}: mediaType is required`);
          }
          
          if (typeof clip.startTime !== 'number' || clip.startTime < 0) {
            errors.push(`Track ${trackIndex}, Clip ${clipIndex}: startTime must be a non-negative number`);
          }
          
          if (typeof clip.endTime !== 'number' || clip.endTime <= clip.startTime) {
            errors.push(`Track ${trackIndex}, Clip ${clipIndex}: endTime must be greater than startTime`);
          }
          
          if (typeof clip.width !== 'number' || clip.width <= 0) {
            errors.push(`Track ${trackIndex}, Clip ${clipIndex}: width must be a positive number`);
          }
          
          if (typeof clip.height !== 'number' || clip.height <= 0) {
            errors.push(`Track ${trackIndex}, Clip ${clipIndex}: height must be a positive number`);
          }
        });
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

  next();
};

/**
 * 템플릿 저장 요청 검증 미들웨어
 */
export const validateTemplateRequest = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { name, tracks, projectSettings }: CreateTemplateRequest = req.body;
  const errors: string[] = [];

  // 템플릿 이름 검증
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  } else if (name.length > 100) {
    errors.push('name cannot exceed 100 characters');
  }

  // 설명 검증 (선택사항)
  if (req.body.description && typeof req.body.description !== 'string') {
    errors.push('description must be a string');
  } else if (req.body.description && req.body.description.length > 500) {
    errors.push('description cannot exceed 500 characters');
  }

  // 트랙과 프로젝트 설정 검증 (렌더링 검증 재사용)
  if (!tracks || !Array.isArray(tracks)) {
    errors.push('tracks is required and must be an array');
  }

  if (!projectSettings || typeof projectSettings !== 'object') {
    errors.push('projectSettings is required and must be an object');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Template validation failed',
      details: errors
    });
  }

  // 렌더링 검증도 실행
  validateRenderRequest(req, res, next);
};

/**
 * 업로드 파일 검증 미들웨어
 */
export const validateUploadRequest = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // 단일 파일 업로드 검증
  if (req.route?.path === '/upload') {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'A file is required for upload'
      });
    }
  }

  // 다중 파일 업로드 검증
  if (req.route?.path === '/upload-multiple') {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
        message: 'At least one file is required for upload'
      });
    }
  }

  next();
};

/**
 * API 키 검증 미들웨어 (향후 확장용)
 */
export const validateApiKey = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  // 현재는 개발 환경이므로 API 키 검증 비활성화
  if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_API_KEY === 'true') {
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'API key must be provided in x-api-key header or apiKey query parameter'
      });
    }

    if (apiKey !== process.env.API_KEY) {
      return res.status(403).json({
        success: false,
        error: 'Invalid API key',
        message: 'The provided API key is invalid'
      });
    }
  }

  next();
};

/**
 * 요청 크기 제한 검증 미들웨어
 */
export const validateRequestSize = (maxSizeMB: number = 700) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        error: 'Request too large',
        message: `Request size (${Math.round(contentLength / 1024 / 1024)}MB) exceeds limit (${maxSizeMB}MB)`,
        maxSize: `${maxSizeMB}MB`
      });
    }

    next();
  };
};

/**
 * Content-Type 검증 미들웨어
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const contentType = req.get('content-type');

    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type required',
        message: 'Content-Type header is required',
        allowedTypes
      });
    }

    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      return res.status(415).json({
        success: false,
        error: 'Unsupported Content-Type',
        message: `Content-Type '${contentType}' is not supported`,
        allowedTypes
      });
    }

    next();
  };
};

/**
 * 요청 빈도 제한 미들웨어 (간단한 구현)
 */
export const rateLimiter = (windowMs: number = 60000, maxRequests: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // 기존 요청 정보 조회
    let clientRequests = requests.get(clientId);

    // 윈도우 시간이 지났으면 리셋
    if (!clientRequests || clientRequests.resetTime < windowStart) {
      clientRequests = { count: 0, resetTime: now + windowMs };
      requests.set(clientId, clientRequests);
    }

    // 요청 수 증가
    clientRequests.count++;

    // 제한 검증
    if (clientRequests.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000)
      });
    }

    // 응답 헤더 설정
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - clientRequests.count).toString(),
      'X-RateLimit-Reset': Math.ceil(clientRequests.resetTime / 1000).toString()
    });

    next();
  };
};

export default {
  validateRenderRequest,
  validateTemplateRequest,
  validateUploadRequest,
  validateApiKey,
  validateRequestSize,
  validateContentType,
  rateLimiter
};
