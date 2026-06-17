import express from 'express';
import { ResourceTemplateService } from '../src/services/resource-template.service.js';

const router = express.Router();
const resourceTemplateService = new ResourceTemplateService();

// GET /api/resource-templates - 모든 리소스 템플릿 조회
router.get('/', async (req, res) => {
  try {
    const templates = await resourceTemplateService.getAllResourceTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching resource templates:', error);
    res.status(500).json({ error: 'Failed to fetch resource templates' });
  }
});

// GET /api/resource-templates/:id - ID로 리소스 템플릿 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await resourceTemplateService.getResourceTemplateById(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Resource template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching resource template:', error);
    res.status(500).json({ error: 'Failed to fetch resource template' });
  }
});

// GET /api/resource-templates/name/:name - 이름으로 리소스 템플릿 조회
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const template = await resourceTemplateService.getResourceTemplateByName(name);
    
    if (!template) {
      return res.status(404).json({ error: 'Resource template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching resource template by name:', error);
    res.status(500).json({ error: 'Failed to fetch resource template by name' });
  }
});

// POST /api/resource-templates - 새 리소스 템플릿 생성
router.post('/', async (req, res) => {
  try {
    const { name, description, templateData, userId } = req.body;
    
    if (!name || !templateData) {
      return res.status(400).json({ error: 'Name and templateData are required' });
    }
    
    const template = await resourceTemplateService.createResourceTemplate({
      name,
      description,
      templateData,
      userId,
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating resource template:', error);
    res.status(500).json({ error: 'Failed to create resource template' });
  }
});

// PUT /api/resource-templates/:id - 새 버전 생성 (업데이트)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { templateData, userId } = req.body;
    
    if (!templateData) {
      return res.status(400).json({ error: 'templateData is required' });
    }
    
    const template = await resourceTemplateService.createNewVersion(id, templateData, userId);
    
    if (!template) {
      return res.status(404).json({ error: 'Resource template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error updating resource template:', error);
    res.status(500).json({ error: 'Failed to update resource template' });
  }
});

// DELETE /api/resource-templates/:id - 리소스 템플릿 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await resourceTemplateService.deleteResourceTemplate(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting resource template:', error);
    res.status(500).json({ error: 'Failed to delete resource template' });
  }
});

// GET /api/resource-templates/:id/versions - 버전 히스토리 조회
router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const versions = await resourceTemplateService.getVersionHistory(id);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

// GET /api/resource-templates/:id/versions/:version - 특정 버전 조회
router.get('/:id/versions/:version', async (req, res) => {
  try {
    const { id, version } = req.params;
    const versionData = await resourceTemplateService.getSpecificVersion(id, parseInt(version));
    
    if (!versionData) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json(versionData);
  } catch (error) {
    console.error('Error fetching specific version:', error);
    res.status(500).json({ error: 'Failed to fetch specific version' });
  }
});

// GET /api/resource-templates/:id/csv-maps - 연관된 CSV 컬럼 맵 조회
router.get('/:id/csv-maps', async (req, res) => {
  try {
    const { id } = req.params;
    const csvMaps = await resourceTemplateService.getRelatedCsvMaps(id);
    res.json(csvMaps);
  } catch (error) {
    console.error('Error fetching related CSV maps:', error);
    res.status(500).json({ error: 'Failed to fetch related CSV maps' });
  }
});

// GET /api/resource-templates/:id/resource-data - 연관된 리소스 데이터 조회
router.get('/:id/resource-data', async (req, res) => {
  try {
    const { id } = req.params;
    const resourceData = await resourceTemplateService.getRelatedResourceData(id);
    res.json(resourceData);
  } catch (error) {
    console.error('Error fetching related resource data:', error);
    res.status(500).json({ error: 'Failed to fetch related resource data' });
  }
});

// PUT /api/resource-templates/:id/relationships - 리소스 템플릿 관계 업데이트
router.put('/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const { csvMapIds, resourceDataId } = req.body;

    console.log('🔗 리소스 템플릿 관계 업데이트 요청:', {
      templateId: id,
      csvMapIds,
      resourceDataId
    });

    // 리소스 템플릿 존재 확인
    const existingTemplate = await resourceTemplateService.getResourceTemplateById(id);
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Resource template not found'
      });
    }

    // 관계 업데이트 로직 (실제 서비스에서 구현해야 함)
    // 현재는 성공 응답만 반환
    const updatedTemplate = await resourceTemplateService.updateRelationships(id, {
      csvMapIds: csvMapIds || [],
      resourceDataId: resourceDataId || null
    });

    res.json({
      success: true,
      data: updatedTemplate
    });

  } catch (error) {
    console.error('Error updating resource template relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource template relationships',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;