import express from 'express';
import { GoogleTTSService } from '../services/tts/googleTTS';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const ttsService = new GoogleTTSService();
const prisma = new PrismaClient();

// 기본 음성 설정 파일 경로
const DEFAULT_VOICES_FILE = path.join(__dirname, '../data/default-voices.json');

// 기본 음성 설정 파일 읽기
function loadDefaultVoices(): Record<string, string> {
  try {
    if (fs.existsSync(DEFAULT_VOICES_FILE)) {
      const data = fs.readFileSync(DEFAULT_VOICES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('기본 음성 설정 파일 읽기 실패:', error);
  }
  return {};
}

// 기본 음성 설정 파일 저장
function saveDefaultVoices(defaultVoices: Record<string, string>): void {
  try {
    // 디렉토리가 없으면 생성
    const dir = path.dirname(DEFAULT_VOICES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(DEFAULT_VOICES_FILE, JSON.stringify(defaultVoices, null, 2));
    console.log('기본 음성 설정 저장 완료:', DEFAULT_VOICES_FILE);
  } catch (error) {
    console.error('기본 음성 설정 파일 저장 실패:', error);
    throw error;
  }
}

/**
 * Google TTS에서 지원하는 모든 음성 목록 조회
 */
router.get('/voices', async (req, res) => {
  try {
    console.log('[TTS API] 음성 목록 조회 요청');
    
    const voices = await ttsService.getAvailableVoices();
    
    console.log(`[TTS API] 음성 목록 조회 성공: ${voices.length}개 음성`);
    
    res.json({
      success: true,
      voices,
      total: voices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TTS API] 음성 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 언어별로 그룹화된 음성 목록 조회
 */
router.get('/voices-by-language', async (req, res) => {
  try {
    console.log('[TTS API] 언어별 음성 목록 조회 요청');
    
    const voicesByLanguage = await ttsService.getVoicesByLanguage();
    
    const stats = Object.entries(voicesByLanguage).map(([lang, voices]) => ({
      language: lang,
      count: voices.length,
      types: [...new Set(voices.map(v => v.type))]
    }));
    
    console.log(`[TTS API] 언어별 음성 목록 조회 성공:`, stats);
    
    res.json({
      success: true,
      voicesByLanguage,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TTS API] 언어별 음성 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 특정 언어의 음성 목록만 조회
 */
router.get('/voices/:language', async (req, res) => {
  try {
    const { language } = req.params;
    console.log(`[TTS API] ${language} 음성 목록 조회 요청`);
    
    const voicesByLanguage = await ttsService.getVoicesByLanguage();
    const voices = voicesByLanguage[language] || [];
    
    console.log(`[TTS API] ${language} 음성 목록 조회 성공: ${voices.length}개 음성`);
    
    res.json({
      success: true,
      language,
      voices,
      total: voices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[TTS API] ${req.params.language} 음성 목록 조회 실패:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * TTS 서비스 상태 확인
 */
router.get('/status', async (req, res) => {
  try {
    // 간단한 음성 목록 조회로 서비스 상태 확인
    const voices = await ttsService.getAvailableVoices();
    
    res.json({
      success: true,
      status: 'healthy',
      totalVoices: voices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TTS API] 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 음성 목록 새로고침 (캐시 무효화)
 */
router.post('/refresh-voices', async (req, res) => {
  try {
    console.log('[TTS API] 음성 목록 새로고침 요청');
    
    // 캐시 강제 새로고침
    const voices = await ttsService.refreshVoicesCache();
    const voicesByLanguage = await ttsService.getVoicesByLanguage();
    
    const stats = Object.entries(voicesByLanguage).map(([lang, voices]) => ({
      language: lang,
      count: voices.length,
      types: [...new Set(voices.map(v => v.type))]
    }));
    
    console.log('[TTS API] 음성 목록 새로고침 완료:', {
      totalVoices: voices.length,
      languages: Object.keys(voicesByLanguage).length
    });
    
    res.json({
      success: true,
      message: '음성 목록이 성공적으로 새로고침되었습니다.',
      totalVoices: voices.length,
      languages: Object.keys(voicesByLanguage).length,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TTS API] 음성 목록 새로고침 실패:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 기본 음성 설정 조회
 */
router.get('/default-voices', async (req, res) => {
  try {
    console.log('[TTS API] 기본 음성 설정 조회 요청');
    
    // 데이터베이스에서 기본 음성 설정 조회
    const defaultVoices = await prisma.tTSDefaultVoice.findMany({
      where: { isActive: true }
    });
    
    // 언어 코드 -> 음성 이름 매핑으로 변환
    const defaultVoicesMap = defaultVoices.reduce((acc, voice) => {
      acc[voice.languageCode] = voice.voiceName;
      return acc;
    }, {} as Record<string, string>);
    
    console.log('[TTS API] 기본 음성 설정 조회 성공:', defaultVoicesMap);
    
    res.json({
      success: true,
      data: defaultVoicesMap,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TTS API] 기본 음성 설정 조회 실패:', error);
    
    // 데이터베이스 오류 시 JSON 파일 fallback
    try {
      const defaultVoices = loadDefaultVoices();
      console.log('[TTS API] JSON 파일 fallback 사용');
      res.json({
        success: true,
        data: defaultVoices,
        timestamp: new Date().toISOString(),
        source: 'json-fallback'
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

/**
 * 기본 음성 설정 저장
 */
router.post('/default-voices', async (req, res) => {
  try {
    console.log('[TTS API] 기본 음성 설정 저장 요청');
    
    const { defaultVoices } = req.body;
    
    if (!defaultVoices || typeof defaultVoices !== 'object') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 기본 음성 설정 데이터입니다.'
      });
    }
    
    // 음성 유효성 검사 (선택사항)
    const voicesByLanguage = await ttsService.getVoicesByLanguage();
    const invalidVoices: string[] = [];
    
    for (const [language, voiceName] of Object.entries(defaultVoices)) {
      if (voiceName && voicesByLanguage[language]) {
        const voiceExists = voicesByLanguage[language].some(v => v.name === voiceName);
        if (!voiceExists) {
          invalidVoices.push(`${language}:${voiceName}`);
        }
      }
    }
    
    if (invalidVoices.length > 0) {
      console.warn('[TTS API] 일부 음성이 유효하지 않음:', invalidVoices);
      // 경고만 로그하고 계속 진행 (음성 목록이 변경될 수 있으므로)
    }
    
    // 데이터베이스에 저장
    const upsertPromises = Object.entries(defaultVoices).map(([languageCode, voiceName]) => {
      if (!voiceName) return null; // 빈 값은 건너뛰기
      
      return prisma.tTSDefaultVoice.upsert({
        where: { languageCode },
        update: { 
          voiceName,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          languageCode,
          voiceName,
          isActive: true
        }
      });
    }).filter(Boolean);
    
    const results = await Promise.all(upsertPromises);
    
    // JSON 파일에도 백업 저장
    saveDefaultVoices(defaultVoices);
    
    console.log('[TTS API] 기본 음성 설정 저장 완료:', {
      database: results.length,
      jsonBackup: Object.keys(defaultVoices).length
    });
    
    res.json({
      success: true,
      message: '기본 음성 설정이 성공적으로 저장되었습니다.',
      data: defaultVoices,
      saved: results.length,
      warnings: invalidVoices.length > 0 ? `일부 음성이 유효하지 않을 수 있습니다: ${invalidVoices.join(', ')}` : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TTS API] 기본 음성 설정 저장 실패:', error);
    
    // 데이터베이스 오류 시 JSON 파일에라도 저장
    try {
      saveDefaultVoices(defaultVoices);
      res.json({
        success: true,
        message: '데이터베이스 저장 실패, JSON 파일에 백업 저장했습니다.',
        data: defaultVoices,
        source: 'json-fallback',
        timestamp: new Date().toISOString()
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

/**
 * 음성 목록 캐시 상태 조회
 */
router.get('/voices-cache-info', async (_req, res) => {
  try {
    console.log('[TTS API] 음성 목록 캐시 상태 조회 요청');
    
    const cacheInfo = ttsService.getVoicesCacheInfo();
    
    res.json({
      success: true,
      data: cacheInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TTS API] 음성 목록 캐시 상태 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;