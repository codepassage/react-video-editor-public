/**
 * 템플릿 관리 API 라우터
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { templateService } from '../services/template.service.prisma';
import { CreateTemplateRequest } from '../types/template.types';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer 설정 - 템플릿 스크린샷 업로드용
const uploadDir = path.join(__dirname, '../../uploads/templates');

// 업로드 디렉토리 생성 확인
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `template-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

/**
 * 안전한 JSON 파싱 함수
 */
function safeJSONParse(value: any): any {
  if (!value || value === 'undefined' || value === 'null') {
    return undefined;
  }
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('JSON 파싱 실패:', { value, error: error instanceof Error ? error.message : error });
      return undefined;
    }
  }
  
  return value;
}

/**
 * POST /api/templates - 템플릿 저장 (Bundle 정보 포함, 스크린샷 지원)
 */
router.post('/templates', upload.single('screenshot'), async (req, res) => {
  try {
    // FormData로 전송된 경우 JSON 파싱
    let parsedBody = req.body;
    if (req.file) {
      // 스크린샷이 있는 경우 JSON 문자열들을 파싱
      parsedBody = {
        ...req.body,
        tracks: safeJSONParse(req.body.tracks),
        projectSettings: safeJSONParse(req.body.projectSettings),
        bundles: safeJSONParse(req.body.bundles),
        templateGroups: safeJSONParse(req.body.templateGroups)
      };
    }

    const { name, description, tracks, projectSettings, bundles, templateGroups, typeId } = parsedBody;
    
    console.log('📨 템플릿 저장 요청 수신 (Bundle 정보 포함):', {
      name,
      typeId,
      tracks: tracks?.length || 0,
      bundles: bundles?.length || 0,
      templateGroups: templateGroups?.length || 0,
      hasScreenshot: !!req.file,
      screenshotPath: req.file?.path,
      requestBodyKeys: Object.keys(req.body),
      tracksStructure: tracks?.map((track, index) => ({
        index,
        id: track.id,
        clipCount: track.clips?.length || 0
      }))
    });

    if (!name || !tracks || !projectSettings) {
      return res.status(400).json(
        templateService.createErrorResponse(
          'name, tracks, and projectSettings are required'
        )
      );
    }

    // 스크린샷 경로 처리
    const screenshotPath = req.file ? `/uploads/templates/${req.file.filename}` : undefined;

    const templateData = await templateService.saveTemplate({
      name,
      description,
      tracks,
      projectSettings,
      bundles,        // Bundle 정보 전달
      templateGroups, // TemplateGroup 정보 전달
      typeId,         // TemplateType ID 전달
      screenshotPath  // 스크린샷 경로 전달
    });

    console.log('✅ 템플릿 저장 응답 전송 (Bundle 정보 포함):', {
      id: templateData.id,
      name: templateData.name,
      bundleCount: templateData.metadata.bundleCount || 0,
      templateGroupCount: templateData.metadata.templateGroupCount || 0
    });

    res.json(templateService.createSuccessResponse(templateData));

  } catch (error) {
    console.error('Template save error:', error);
    res.status(500).json(
      templateService.createErrorResponse(
        'Failed to save template',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/templates - 템플릿 목록 조회
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await templateService.getTemplates();
    res.json(templateService.createSuccessResponse(undefined, templates));

  } catch (error) {
    console.error('Templates list error:', error);
    res.status(500).json(
      templateService.createErrorResponse(
        'Failed to retrieve templates',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/templates/:id - 특정 템플릿 조회
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateService.getTemplate(id);

    if (!template) {
      return res.status(404).json(
        templateService.createErrorResponse('Template not found')
      );
    }

    res.json(templateService.createSuccessResponse(template));

  } catch (error) {
    console.error('Template load error:', error);
    res.status(500).json(
      templateService.createErrorResponse(
        'Failed to load template',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * PUT /api/templates/:id - 템플릿 업데이트
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedTemplate = await templateService.updateTemplate(id, updates);

    if (!updatedTemplate) {
      return res.status(404).json(
        templateService.createErrorResponse('Template not found')
      );
    }

    res.json(templateService.createSuccessResponse(updatedTemplate));

  } catch (error) {
    console.error('Template update error:', error);
    res.status(500).json(
      templateService.createErrorResponse(
        'Failed to update template',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * DELETE /api/templates/:id - 템플릿 삭제
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await templateService.deleteTemplate(id);

    if (!success) {
      return res.status(404).json(
        templateService.createErrorResponse('Template not found')
      );
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Template delete error:', error);
    res.status(500).json(
      templateService.createErrorResponse(
        'Failed to delete template',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * POST /api/templates/:id/duplicate - 템플릿 복제
 */
router.post('/templates/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const duplicatedTemplate = await templateService.duplicateTemplate(id, name);

    if (!duplicatedTemplate) {
      return res.status(404).json(
        templateService.createErrorResponse('Template not found')
      );
    }

    res.json(templateService.createSuccessResponse(duplicatedTemplate));

  } catch (error) {
    console.error('Template duplicate error:', error);
    res.status(500).json(
      templateService.createErrorResponse(
        'Failed to duplicate template',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/templates/search/:query - 템플릿 검색
 */
router.get('/templates/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const templates = await templateService.searchTemplates(decodeURIComponent(query));

    res.json(templateService.createSuccessResponse(undefined, templates));

  } catch (error) {
    console.error('Template search error:', error);
    res.status(500).json(
      templateService.createErrorResponse(
        'Failed to search templates',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

/**
 * GET /api/templates-stats - 템플릿 통계
 */
router.get('/templates-stats', async (req, res) => {
  try {
    const stats = await templateService.getStats();
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Template stats error:', error);
    res.status(500).json(
      templateService.createErrorResponse(
        'Failed to retrieve template stats',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

export default router;
