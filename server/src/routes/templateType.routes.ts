/**
 * TemplateType API 라우터
 */

import express from 'express';
import { templateTypeService } from '../services/templateType.service.prisma';

const router = express.Router();

/**
 * GET /api/template-types - 모든 TemplateType 조회
 */
router.get('/template-types', async (req, res) => {
  try {
    const templateTypes = await templateTypeService.getAllTemplateTypes();
    
    res.json({
      success: true,
      templateTypes,
      totalCount: templateTypes.length
    });
  } catch (error) {
    console.error('Error getting template types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template types',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/template-types/:id - 특정 TemplateType 조회
 */
router.get('/template-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templateType = await templateTypeService.getTemplateTypeById(id);
    
    if (!templateType) {
      return res.status(404).json({
        success: false,
        error: 'Template type not found'
      });
    }
    
    res.json({
      success: true,
      templateType
    });
  } catch (error) {
    console.error('Error getting template type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template type',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/template-types - TemplateType 생성
 */
router.post('/template-types', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Name is required and must be a string'
      });
    }
    
    const templateType = await templateTypeService.createTemplateType({
      name: name.trim(),
      description: description?.trim()
    });
    
    res.status(201).json({
      success: true,
      templateType
    });
  } catch (error) {
    console.error('Error creating template type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template type',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/template-types/:id - TemplateType 수정
 */
router.put('/template-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const templateType = await templateTypeService.updateTemplateType(id, {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() })
    });
    
    if (!templateType) {
      return res.status(404).json({
        success: false,
        error: 'Template type not found'
      });
    }
    
    res.json({
      success: true,
      templateType
    });
  } catch (error) {
    console.error('Error updating template type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template type',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/template-types/:id - TemplateType 삭제
 */
router.delete('/template-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await templateTypeService.deleteTemplateType(id);
    
    res.json({
      success: true,
      message: 'Template type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template type:', error);
    
    if (error instanceof Error && error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete template type',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;