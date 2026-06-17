/**
 * 폰트 관리 API 라우터
 */

import express from 'express';
import { fontService } from '../services/font.service';

const router = express.Router();

/**
 * GET /api/fonts - 사용 가능한 폰트 목록 조회
 */
router.get('/fonts', async (req, res) => {
  try {
    if (!fontService.isReady()) {
      await fontService.initialize();
    }

    const response = fontService.getApiResponse();
    res.json(response);

  } catch (error) {
    console.error('Font API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve fonts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fonts/families - 폰트 패밀리 목록만 조회
 */
router.get('/fonts/families', async (req, res) => {
  try {
    if (!fontService.isReady()) {
      await fontService.initialize();
    }

    const families = fontService.getFontFamilies();
    res.json({
      success: true,
      families,
      totalCount: families.length
    });

  } catch (error) {
    console.error('Font families API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve font families',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fonts/families/:family/weights - 특정 패밀리의 폰트 굵기 목록 조회
 */
router.get('/fonts/families/:family/weights', async (req, res) => {
  try {
    const { family } = req.params;
    
    if (!fontService.isReady()) {
      await fontService.initialize();
    }

    const weights = fontService.getFontWeights(decodeURIComponent(family));
    res.json({
      success: true,
      family: decodeURIComponent(family),
      weights,
      totalCount: weights.length
    });

  } catch (error) {
    console.error('Font weights API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve font weights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fonts/stats - 폰트 시스템 통계
 */
router.get('/fonts/stats', async (req, res) => {
  try {
    if (!fontService.isReady()) {
      await fontService.initialize();
    }

    const stats = fontService.getStats();
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Font stats API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve font stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/fonts/rescan - 폰트 재스캔
 */
router.post('/fonts/rescan', async (req, res) => {
  try {
    await fontService.rescanFonts();
    
    const response = fontService.getApiResponse();
    res.json({
      ...response,
      message: 'Fonts rescanned successfully'
    });

  } catch (error) {
    console.error('Font rescan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rescan fonts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fonts/validate/:family - 폰트 존재 여부 확인
 */
router.get('/fonts/validate/:family', async (req, res) => {
  try {
    const { family } = req.params;
    const { weight } = req.query;
    
    if (!fontService.isReady()) {
      await fontService.initialize();
    }

    const fontFamily = decodeURIComponent(family);
    const fontWeight = weight as string;

    const exists = fontService.hasFontFamily(fontFamily);
    const fontInfo = fontService.getFontInfo(fontFamily, fontWeight);

    res.json({
      success: true,
      family: fontFamily,
      weight: fontWeight,
      exists,
      fontInfo
    });

  } catch (error) {
    console.error('Font validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate font',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
