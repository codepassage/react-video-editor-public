import { Router } from 'express';
import { Request, Response } from 'express';
import CompatibilityService from '../services/compatibility.service';

const router = Router();
const compatibilityService = new CompatibilityService();

// 템플릿의 호환 리소스 조회
router.get('/templates/:templateId/compatible-resources', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    
    const resources = await compatibilityService.getCompatibleResources(templateId);
    
    res.json({ success: true, resources });
  } catch (error) {
    console.error('Error fetching compatible resources:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 템플릿의 호환 리소스 템플릿 조회
router.get('/templates/:templateId/compatible-resource-templates', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    
    const resourceTemplates = await compatibilityService.getCompatibleResourceTemplates(templateId);
    
    res.json({ success: true, data: resourceTemplates });
  } catch (error) {
    console.error('Error fetching compatible resource templates:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 템플릿과 리소스 템플릿 연결 (리소스 템플릿 저장)
router.post('/templates/:templateId/compatible-resource-templates', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { resourceTemplateIds } = req.body;

    if (!Array.isArray(resourceTemplateIds)) {
      return res.status(400).json({ success: false, error: 'resourceTemplateIds must be an array' });
    }

    await compatibilityService.batchLinkTemplateResourceTemplates(templateId, resourceTemplateIds);

    res.json({ success: true });
  } catch (error) {
    console.error('Error linking template resource templates:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 템플릿과 리소스 연결
router.post('/templates/:templateId/compatible-resources', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { resourceIds } = req.body;

    if (!Array.isArray(resourceIds)) {
      return res.status(400).json({ success: false, error: 'resourceIds must be an array' });
    }

    await compatibilityService.batchLinkTemplateResources(templateId, resourceIds);

    res.json({ success: true });
  } catch (error) {
    console.error('Error linking template resources:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 템플릿-리소스 연결 해제
router.delete('/templates/:templateId/compatible-resources/:resourceId', async (req: Request, res: Response) => {
  try {
    const { templateId, resourceId } = req.params;

    await compatibilityService.unlinkTemplateResource(templateId, resourceId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error unlinking template resource:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 리소스의 호환 템플릿 조회
router.get('/resources/:resourceId/compatible-templates', async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    
    const templates = await compatibilityService.getCompatibleTemplates(resourceId);
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching compatible templates:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 리소스와 템플릿 연결
router.post('/resources/:resourceId/compatible-templates', async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const { templateIds } = req.body;

    if (!Array.isArray(templateIds)) {
      return res.status(400).json({ success: false, error: 'templateIds must be an array' });
    }

    await compatibilityService.batchLinkResourceTemplates(resourceId, templateIds);

    res.json({ success: true });
  } catch (error) {
    console.error('Error linking resource templates:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 전체 호환성 매트릭스 조회
router.get('/compatibility/matrix', async (req: Request, res: Response) => {
  try {
    const matrix = await compatibilityService.getCompatibilityMatrix();

    res.json({ success: true, matrix });
  } catch (error) {
    console.error('Error fetching compatibility matrix:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 호환성 상태 확인
router.get('/compatibility/check/:templateId/:resourceId', async (req: Request, res: Response) => {
  try {
    const { templateId, resourceId } = req.params;

    const isCompatible = await compatibilityService.isCompatible(templateId, resourceId);

    res.json({ success: true, isCompatible });
  } catch (error) {
    console.error('Error checking compatibility:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 호환성 통계 조회
router.get('/compatibility/stats', async (req: Request, res: Response) => {
  try {
    const stats = await compatibilityService.getCompatibilityStats();

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching compatibility stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 호환성 데이터 정리
router.post('/compatibility/cleanup', async (req: Request, res: Response) => {
  try {
    const result = await compatibilityService.cleanup();

    res.json({ success: true, result });
  } catch (error) {
    console.error('Error cleaning up compatibility data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ========== 연결 이력 관련 엔드포인트 ==========

// 최근 연결 이력 조회
router.get('/compatibility/history/recent', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const history = await compatibilityService.getRecentConnectionHistory(limit);

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching recent connection history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 특정 템플릿의 연결 이력 조회
router.get('/templates/:templateId/connection-history', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const history = await compatibilityService.getTemplateConnectionHistory(templateId, limit);

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching template connection history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 특정 리소스의 연결 이력 조회
router.get('/resources/:resourceId/connection-history', async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const history = await compatibilityService.getResourceConnectionHistory(resourceId, limit);

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching resource connection history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;