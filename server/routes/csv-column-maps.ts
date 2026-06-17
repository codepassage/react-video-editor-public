/**
 * 📊 CSV 컬럼 매핑 관리 API 라우터 (CSV Column Maps Routes)
 * 
 * CSV 데이터와 리소스 템플릿 간의 매핑 정보를 관리하는 RESTful API
 * 사용자가 정의한 매핑 규칙을 저장하고 버전 관리를 제공
 * 
 * 🎯 주요 기능:
 * - CSV 컬럼 매핑 CRUD 작업
 * - 매핑 데이터 버전 관리 시스템
 * - 리소스 템플릿별 매핑 조회
 * - 이름 기반 매핑 검색
 * - 연관 데이터 조회 기능
 * 
 * 📡 API 엔드포인트:
 * - GET / - 모든 CSV 컬럼 맵 조회
 * - GET /:id - ID로 특정 매핑 조회
 * - GET /name/:name - 이름으로 매핑 조회
 * - GET /resource-template/:id - 리소스 템플릿별 매핑 조회
 * - POST / - 새 매핑 생성
 * - PUT /:id - 매핑 업데이트 (새 버전 생성)
 * - DELETE /:id - 매핑 삭제
 * - GET /:id/versions - 버전 히스토리 조회
 * - GET /:id/versions/:version - 특정 버전 조회
 * - GET /:id/resource-data - 연관 리소스 데이터 조회
 * 
 * 🔧 기술적 특징:
 * - RESTful API 설계 패턴
 * - 타입 안전성 및 데이터 검증
 * - 오류 처리 및 상태 코드 관리
 * - 페이지네이션 지원
 * - 관계형 데이터 조회 최적화
 * 
 * 📦 데이터 구조:
 * - 매핑 메타데이터 (이름, 설명, 생성일)
 * - 매핑 규칙 데이터 (JSON 형태)
 * - 버전 관리 정보
 * - 사용자 식별자
 * - 리소스 템플릿 연결
 * 
 * @version 1.0.0
 * @author YouTube Generator Team
 * @since 2024-01-01
 */

import express from 'express';
import { CsvColumnMapService } from '../src/services/csv-column-map.service.js';

const router = express.Router();
const csvColumnMapService = new CsvColumnMapService();

// GET /api/csv-column-maps - 모든 CSV 컬럼 맵 조회
router.get('/', async (req, res) => {
  try {
    const csvMaps = await csvColumnMapService.getAllCsvColumnMaps();
    res.json(csvMaps);
  } catch (error) {
    console.error('Error fetching CSV column maps:', error);
    res.status(500).json({ error: 'Failed to fetch CSV column maps' });
  }
});

// GET /api/csv-column-maps/:id - ID로 CSV 컬럼 맵 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const csvMap = await csvColumnMapService.getCsvColumnMapById(id);
    
    if (!csvMap) {
      return res.status(404).json({ error: 'CSV column map not found' });
    }
    
    res.json(csvMap);
  } catch (error) {
    console.error('Error fetching CSV column map:', error);
    res.status(500).json({ error: 'Failed to fetch CSV column map' });
  }
});

// GET /api/csv-column-maps/name/:name - 이름으로 CSV 컬럼 맵 조회
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const csvMap = await csvColumnMapService.getCsvColumnMapByName(name);
    
    if (!csvMap) {
      return res.status(404).json({ error: 'CSV column map not found' });
    }
    
    res.json(csvMap);
  } catch (error) {
    console.error('Error fetching CSV column map by name:', error);
    res.status(500).json({ error: 'Failed to fetch CSV column map by name' });
  }
});

// GET /api/csv-column-maps/resource-template/:resourceTemplateId - 리소스 템플릿으로 CSV 컬럼 맵 조회
router.get('/resource-template/:resourceTemplateId', async (req, res) => {
  try {
    const { resourceTemplateId } = req.params;
    const csvMaps = await csvColumnMapService.getCsvColumnMapsByResourceTemplate(resourceTemplateId);
    res.json(csvMaps);
  } catch (error) {
    console.error('Error fetching CSV column maps by resource template:', error);
    res.status(500).json({ error: 'Failed to fetch CSV column maps by resource template' });
  }
});

// POST /api/csv-column-maps - 새 CSV 컬럼 맵 생성
router.post('/', async (req, res) => {
  try {
    const { name, description, resourceTemplateId, mappingData, userId } = req.body;
    
    if (!name || !mappingData) {
      return res.status(400).json({ error: 'Name and mappingData are required' });
    }
    
    const csvMap = await csvColumnMapService.createCsvColumnMap({
      name,
      description,
      resourceTemplateId,
      mappingData,
      userId,
    });
    
    res.status(201).json(csvMap);
  } catch (error) {
    console.error('Error creating CSV column map:', error);
    res.status(500).json({ error: 'Failed to create CSV column map' });
  }
});

// PUT /api/csv-column-maps/:id - 새 버전 생성 (업데이트)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mappingData, userId } = req.body;
    
    if (!mappingData) {
      return res.status(400).json({ error: 'mappingData is required' });
    }
    
    const csvMap = await csvColumnMapService.createNewVersion(id, mappingData, userId);
    
    if (!csvMap) {
      return res.status(404).json({ error: 'CSV column map not found' });
    }
    
    res.json(csvMap);
  } catch (error) {
    console.error('Error updating CSV column map:', error);
    res.status(500).json({ error: 'Failed to update CSV column map' });
  }
});

// DELETE /api/csv-column-maps/:id - CSV 컬럼 맵 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await csvColumnMapService.deleteCsvColumnMap(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting CSV column map:', error);
    res.status(500).json({ error: 'Failed to delete CSV column map' });
  }
});

// GET /api/csv-column-maps/:id/versions - 버전 히스토리 조회
router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const versions = await csvColumnMapService.getVersionHistory(id);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

// GET /api/csv-column-maps/:id/versions/:version - 특정 버전 조회
router.get('/:id/versions/:version', async (req, res) => {
  try {
    const { id, version } = req.params;
    const versionData = await csvColumnMapService.getSpecificVersion(id, parseInt(version));
    
    if (!versionData) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json(versionData);
  } catch (error) {
    console.error('Error fetching specific version:', error);
    res.status(500).json({ error: 'Failed to fetch specific version' });
  }
});

// GET /api/csv-column-maps/:id/resource-data - 연관된 리소스 데이터 조회
router.get('/:id/resource-data', async (req, res) => {
  try {
    const { id } = req.params;
    const resourceData = await csvColumnMapService.getRelatedResourceData(id);
    res.json(resourceData);
  } catch (error) {
    console.error('Error fetching related resource data:', error);
    res.status(500).json({ error: 'Failed to fetch related resource data' });
  }
});

// PUT /api/csv-column-maps/:id/relationships - CSV 컬럼 맵 관계 업데이트
router.put('/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const { resourceTemplateId, resourceDataIds } = req.body;

    console.log('🔗 CSV 컬럼 맵 관계 업데이트 요청:', {
      csvMapId: id,
      resourceTemplateId,
      resourceDataIds
    });

    // CSV 컬럼 맵 존재 확인
    const existingCsvMap = await csvColumnMapService.getCsvColumnMapById(id);
    if (!existingCsvMap) {
      return res.status(404).json({
        success: false,
        error: 'CSV column map not found'
      });
    }

    // 관계 업데이트 로직 (실제 서비스에서 구현해야 함)
    // 현재는 성공 응답만 반환
    const updatedCsvMap = await csvColumnMapService.updateRelationships(id, {
      resourceTemplateId: resourceTemplateId || null,
      resourceDataIds: resourceDataIds || []
    });

    res.json({
      success: true,
      data: updatedCsvMap
    });

  } catch (error) {
    console.error('Error updating CSV column map relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update CSV column map relationships',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;