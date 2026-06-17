/**
 * 🎬 긴 문장 분할 변환 API 라우터 (Long Sentence Routes)
 * 
 * 긴 텍스트를 자동으로 개별 문장 클립으로 분할하는 AI 기반 서비스
 * TTS 음성 생성과 Whisper 자막 동기화를 통한 완전 자동화 파이프라인
 * 
 * 🎯 주요 기능:
 * - 지능형 문장 분할 (구두점, 단어 수 기반)
 * - 다국어 TTS 음성 생성 (53개 언어)
 * - Whisper 정밀 타이밍 동기화
 * - 실시간 진행률 추적 (SSE)
 * - 문장 분할 미리보기
 * - 최적화 제안 시스템
 * 
 * 📡 API 엔드포인트:
 * - POST /convert - 긴 문장 클립 변환
 * - GET /progress/:clipId - 변환 진행 상황 (SSE)
 * - POST /preview-split - 문장 분할 미리보기
 * - POST /suggest-split - 최적화된 분할 제안
 * - POST /split-by-language - 언어별 문장 분할
 * - GET /status/:clipId - 변환 상태 확인
 * - DELETE /cancel/:clipId - 변환 작업 취소
 * - GET /supported-languages - 지원 언어 목록
 * - GET /statistics - 변환 통계 조회
 * - GET /health - 서비스 상태 확인
 * 
 * 🔧 기술적 특징:
 * - Server-Sent Events (SSE) 실시간 통신
 * - EventEmitter 기반 진행률 추적
 * - 비동기 처리 및 오류 복구
 * - 메모리 효율적 스트림 처리
 * - 캐시 기반 성능 최적화
 * 
 * 🤖 AI 통합 서비스:
 * - LongSentenceEngine: 핵심 변환 엔진
 * - SentenceSplitter: 텍스트 분할 로직
 * - Google TTS: 음성 합성
 * - Whisper: 음성 인식 및 타이밍
 * 
 * 📊 변환 파이프라인:
 * 1. 텍스트 분석 및 분할
 * 2. TTS 음성 생성
 * 3. Whisper 자막 생성
 * 4. 타이밍 동기화
 * 5. 클립 생성 및 검증
 * 
 * @version 1.0.0
 * @author YouTube Generator Team
 * @since 2024-01-01
 */

import express from 'express';
import { LongSentenceEngine } from '../services/transform/longSentenceEngine';
import { SentenceSplitter } from '../services/textProcessing/sentenceSplitter';
import { EventEmitter } from 'events';

const router = express.Router();
const longSentenceEngine = new LongSentenceEngine();
const sentenceSplitter = new SentenceSplitter();
const progressEmitter = new EventEmitter();

/**
 * LongSentence 클립 변환 API
 */
router.post('/convert', async (req, res) => {
  try {
    const { clipId, longSentenceClip, baseTrackId } = req.body;
    
    if (!clipId || !longSentenceClip) {
      return res.status(400).json({ 
        success: false, 
        error: 'clipId와 longSentenceClip이 필요합니다.' 
      });
    }
    
    console.log('🎯 기준트랙 정보 (서버):', {
      clipId: clipId.slice(-8),
      baseTrackId,
      longSentenceClipTrackId: longSentenceClip.trackId,
      isUsingBaseTrack: !!baseTrackId
    });

    // 새로운 data 구조 지원
    const hasValidData = longSentenceClip.data && 
                        Array.isArray(longSentenceClip.data) && 
                        longSentenceClip.data.some(item => item.text && item.text.trim());
    
    // 기존 text 속성도 지원 (하위 호환성)
    const hasLegacyText = longSentenceClip.text && longSentenceClip.text.trim();
    
    if (!hasValidData && !hasLegacyText) {
      return res.status(400).json({ 
        success: false, 
        error: '변환할 텍스트를 입력해주세요. 속성 패널에서 "텍스트 + 미디어 데이터" 섹션을 펼쳐서 텍스트를 입력하세요.' 
      });
    }
    
    // 진행 상황 추적
    const onProgress = (progress: number) => {
      progressEmitter.emit(`progress-${clipId}`, progress);
    };

    // 변환 실행
    console.log('🔄 변환 시작...');
    const result = await longSentenceEngine.convertLongSentence(
      longSentenceClip,
      baseTrackId,
      onProgress
    );
    console.log('✅ 변환 완료:', {
      success: result.success,
      generatedClipsCount: result.generatedClips?.length || 0,
      totalDuration: result.totalDuration
    });

    // 결과 검증
    console.log('🔍 결과 검증 시작...');
    const validation = longSentenceEngine.validateConversionResult(result);
    if (!validation.isValid) {
      console.error('❌ 변환 결과 검증 실패:', validation.errors);
      return res.status(400).json({
        success: false,
        error: '변환 결과 검증 실패',
        validationErrors: validation.errors
      });
    }
    console.log('✅ 결과 검증 통과');

    console.log('📤 응답 전송 중...');
    res.json(result);
    console.log('✅ 응답 전송 완료');
  } catch (error) {
    console.error('LongSentence 변환 API 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 변환 진행 상황 조회 (SSE)
 */
router.get('/progress/:clipId', (req, res) => {
  const { clipId } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const listener = (progress: number) => {
    res.write(`data: ${JSON.stringify({ progress, clipId })}\n\n`);
  };

  progressEmitter.on(`progress-${clipId}`, listener);

  // 연결 종료 시 리스너 정리
  req.on('close', () => {
    progressEmitter.removeListener(`progress-${clipId}`, listener);
  });

  req.on('error', () => {
    progressEmitter.removeListener(`progress-${clipId}`, listener);
  });
});

/**
 * 문장 분할 미리보기
 */
router.post('/preview-split', async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: '미리보기할 텍스트가 없습니다.' 
      });
    }

    const {
      maxWordsPerSentence = 15,
      splitOnPunctuation = true,
      language = 'ko'
    } = options;

    const splitOptions = {
      maxWordsPerSentence,
      splitOnPunctuation,
      language
    };

    const result = await longSentenceEngine.previewSplit(text, splitOptions);
    
    res.json(result);
  } catch (error) {
    console.error('문장 분할 미리보기 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 최적화된 분할 제안
 */
router.post('/suggest-split', async (req, res) => {
  try {
    const { text, targetDuration = 30 } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: '분석할 텍스트가 없습니다.' 
      });
    }

    const suggestion = sentenceSplitter.suggestOptimalSplit(text, targetDuration);
    
    res.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('분할 제안 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 언어별 분할
 */
router.post('/split-by-language', async (req, res) => {
  try {
    const { text, language = 'ko', maxWordsPerSentence = 15 } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: '분할할 텍스트가 없습니다.' 
      });
    }

    const sentences = sentenceSplitter.splitByLanguage(text, language, maxWordsPerSentence);
    const analysis = sentenceSplitter.analyzeSentences(sentences);
    
    res.json({
      success: true,
      sentences,
      analysis,
      totalSentences: sentences.length,
      language,
      maxWordsPerSentence
    });
  } catch (error) {
    console.error('언어별 분할 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 변환 상태 확인
 */
router.get('/status/:clipId', (req, res) => {
  const { clipId } = req.params;
  
  // 실제 구현에서는 데이터베이스나 캐시에서 상태 조회
  // 여기서는 임시 응답
  res.json({
    success: true,
    clipId,
    status: 'pending', // pending, processing, completed, failed
    progress: 0,
    message: '변환 대기 중'
  });
});

/**
 * 변환 취소
 */
router.delete('/cancel/:clipId', (req, res) => {
  const { clipId } = req.params;
  
  try {
    // 진행 중인 변환 취소 로직
    progressEmitter.emit(`cancel-${clipId}`);
    
    res.json({
      success: true,
      message: '변환이 취소되었습니다.',
      clipId
    });
  } catch (error) {
    console.error('변환 취소 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 지원되는 언어 목록
 */
router.get('/supported-languages', (req, res) => {
  const languages = [
    { code: 'ko', name: '한국어', voices: ['ko-KR-Standard-A', 'ko-KR-Standard-B'] },
    { code: 'en', name: 'English', voices: ['en-US-Standard-A', 'en-US-Standard-B'] },
    { code: 'ja', name: '日本語', voices: ['ja-JP-Standard-A', 'ja-JP-Standard-B'] },
    { code: 'zh', name: '中文', voices: ['cmn-CN-Standard-A', 'cmn-CN-Standard-B'] },
    { code: 'es', name: 'Español', voices: ['es-ES-Standard-A', 'es-ES-Standard-B'] },
    { code: 'fr', name: 'Français', voices: ['fr-FR-Standard-A', 'fr-FR-Standard-B'] },
    { code: 'de', name: 'Deutsch', voices: ['de-DE-Standard-A', 'de-DE-Standard-B'] }
  ];

  res.json({
    success: true,
    languages
  });
});

/**
 * 변환 통계
 */
router.get('/statistics', async (req, res) => {
  try {
    // 실제 구현에서는 데이터베이스에서 통계 조회
    const stats = {
      totalConversions: 0,
      successfulConversions: 0,
      failedConversions: 0,
      averageProcessingTime: 0,
      totalAudioGenerated: 0, // 초 단위
      popularLanguages: [
        { language: 'ko', count: 0 },
        { language: 'en', count: 0 }
      ]
    };

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 헬스 체크
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'LongSentence API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;