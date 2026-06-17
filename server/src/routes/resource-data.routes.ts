/**
 * 리소스 데이터 관리 API 라우터
 */

import express from 'express';
import { resourceDataService } from '../services/resource-data.service';

const router = express.Router();

/**
 * POST /api/resource-data - 리소스 데이터 저장 (추가/수정 지원)
 */
router.post('/resource-data', async (req, res) => {
  try {
    const { name, description, data, isUpdate } = req.body;

    console.log('📨 리소스 데이터 저장 요청 수신:', {
      name,
      itemCount: data?.items?.length || 0,
      isUpdate: !!isUpdate,
      requestBodyKeys: Object.keys(req.body)
    });

    if (!name || !data) {
      return res.status(400).json({
        success: false,
        error: 'name and data are required'
      });
    }

    const resourceData = await resourceDataService.saveResourceData({
      name,
      description,
      data,
      isUpdate
    });

    console.log('✅ 리소스 데이터 저장 응답 전송:', {
      id: resourceData.id,
      name: resourceData.name,
      version: resourceData.version,
      versionString: resourceData.versionString
    });

    res.json({
      success: true,
      data: resourceData
    });

  } catch (error) {
    console.error('Resource data save error:', error);
    
    // 중복 이름 에러 구분
    const isDuplicateNameError = error instanceof Error && 
      error.message.includes('이미 존재합니다');
    
    res.status(isDuplicateNameError ? 409 : 500).json({
      success: false,
      error: isDuplicateNameError ? 'Duplicate name' : 'Failed to save resource data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/resource-data - 리소스 데이터 목록 조회
 */
router.get('/resource-data', async (req, res) => {
  try {
    const resourceDataList = await resourceDataService.getResourceDataList();
    
    console.log(`📂 리소스 데이터 목록 조회: ${resourceDataList.length}개`);
    
    res.json({
      success: true,
      data: resourceDataList
    });

  } catch (error) {
    console.error('Resource data list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resource data list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/resource-data/:id - 특정 리소스 데이터 조회
 */
router.get('/resource-data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resourceData = await resourceDataService.getResourceData(id);

    if (!resourceData) {
      return res.status(404).json({
        success: false,
        error: 'Resource data not found'
      });
    }

    res.json({
      success: true,
      data: resourceData
    });

  } catch (error) {
    console.error('Resource data load error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load resource data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/resource-data/:id - 리소스 데이터 업데이트
 */
router.put('/resource-data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedResourceData = await resourceDataService.updateResourceData(id, updates);

    if (!updatedResourceData) {
      return res.status(404).json({
        success: false,
        error: 'Resource data not found'
      });
    }

    res.json({
      success: true,
      data: updatedResourceData
    });

  } catch (error) {
    console.error('Resource data update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


/**
 * DELETE /api/resource-data/:id - 리소스 데이터 삭제
 */
router.delete('/resource-data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await resourceDataService.deleteResourceData(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Resource data not found'
      });
    }

    res.json({
      success: true,
      message: 'Resource data deleted successfully'
    });

  } catch (error) {
    console.error('Resource data delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/resource-data/name/:name - 이름으로 최신 버전 조회
 */
router.get('/resource-data/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const resourceData = await resourceDataService.getResourceDataByName(name);

    if (!resourceData) {
      return res.status(404).json({
        success: false,
        error: 'Resource data not found'
      });
    }

    res.json({
      success: true,
      data: resourceData
    });

  } catch (error) {
    console.error('Resource data load by name error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load resource data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/resource-data/name/:name/versions - 이름별 버전 히스토리 조회
 */
router.get('/resource-data/name/:name/versions', async (req, res) => {
  try {
    const { name } = req.params;
    const versions = await resourceDataService.getResourceDataVersions(name);

    res.json({
      success: true,
      data: versions
    });

  } catch (error) {
    console.error('Resource data versions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resource data versions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/resource-data/name/:name/version/:version - 특정 버전 조회
 */
router.get('/resource-data/name/:name/version/:version', async (req, res) => {
  try {
    const { name, version } = req.params;
    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid version number'
      });
    }

    const resourceData = await resourceDataService.getResourceDataByVersion(name, versionNumber);

    if (!resourceData) {
      return res.status(404).json({
        success: false,
        error: 'Resource data version not found'
      });
    }

    res.json({
      success: true,
      data: resourceData
    });

  } catch (error) {
    console.error('Resource data version load error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load resource data version',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/resource-data/nested - 중첩 구조 리소스 데이터만 조회
 */
router.get('/resource-data/nested', async (req, res) => {
  try {
    const nestedResourceDataList = await resourceDataService.getNestedResourceData();
    
    console.log(`🔄 중첩 구조 리소스 데이터 조회: ${nestedResourceDataList.length}개`);
    
    res.json({
      success: true,
      data: nestedResourceDataList
    });

  } catch (error) {
    console.error('Nested resource data list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve nested resource data list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/resource-data/:id/relationships - 리소스 데이터 관계 업데이트
 */
router.put('/resource-data/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const { resourceTemplateId, csvMapId } = req.body;

    // 기존 리소스 데이터 존재 확인
    const existingResourceData = await resourceDataService.getResourceData(id);
    if (!existingResourceData) {
      return res.status(404).json({
        success: false,
        error: 'Resource data not found'
      });
    }

    // 관계 필드만 업데이트
    const updatedResourceData = await resourceDataService.updateResourceData(id, {
      resourceTemplateId: resourceTemplateId || null,
      csvMapId: csvMapId || null
    });

    console.log('✅ 리소스 데이터 관계 업데이트:', {
      resourceDataId: id,
      resourceTemplateId,
      csvMapId
    });

    res.json({
      success: true,
      data: updatedResourceData
    });

  } catch (error) {
    console.error('Resource data relationships update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource data relationships',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;