/**
 * 🎤 Whisper AI 음성 인식 상태 관리 API 라우터 (Whisper Status Routes)
 * 
 * OpenAI Whisper 음성 인식 서비스의 상태 확인 및 설정 관리
 * 로컬/클라우드 프로바이더 전환과 실시간 가용성 모니터링
 * 
 * 🎯 주요 기능:
 * - Whisper 서비스 가용성 실시간 모니터링
 * - 프로바이더 자동 전환 (OpenAI API ↔ 로컬)
 * - 서비스 설정 검증 및 테스트
 * - 성능 지표 및 상태 진단
 * - 오류 복구 및 알림 시스템
 * 
 * 📡 API 엔드포인트:
 * - GET /status - Whisper 서비스 상태 확인
 * - GET /providers - 사용 가능한 프로바이더 목록
 * - GET /validate - Whisper 설정 검증
 * - POST /switch - 프로바이더 전환
 * - POST /test - 서비스 기능 테스트
 * 
 * 🔧 기술적 특징:
 * - 다중 프로바이더 지원 (OpenAI, Local, Auto)
 * - 자동 장애 조치 (Failover)
 * - 성능 벤치마킹
 * - 설정 유효성 검사
 * - 오류 처리 및 복구
 * 
 * 🤖 AI 서비스 통합:
 * - OpenAI Whisper API (클라우드)
 * - 로컬 Whisper 모델 (온프레미스)
 * - 자동 모드 (가용성 기반 선택)
 * 
 * 📊 모니터링 지표:
 * - 서비스 가용성 상태
 * - 응답 시간 및 성능
 * - 오류율 및 실패 원인
 * - 프로바이더별 통계
 * 
 * 🔄 프로바이더 관리:
 * - openai: OpenAI API 서비스
 * - local: 로컬 Whisper 모델
 * - auto: 자동 선택 모드
 * 
 * @version 1.0.0
 * @author YouTube Generator Team
 * @since 2024-01-01
 */

import express from 'express';
import { WhisperService, WhisperServiceFactory } from '../services/whisper/whisperService';

const router = express.Router();

/**
 * GET /api/whisper/status
 * Whisper 서비스 상태 확인
 */
router.get('/status', async (req, res) => {
  try {
    const whisperService = await WhisperService.getInstance();
    const status = await whisperService.checkStatus();
    const providerInfo = whisperService.getProviderInfo();

    res.json({
      success: true,
      status: {
        available: status.available,
        provider: status.provider,
        type: providerInfo.type,
        error: status.error
      }
    });
  } catch (error) {
    res.json({
      success: false,
      status: {
        available: false,
        provider: 'None',
        type: 'None',
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
});

/**
 * GET /api/whisper/providers
 * 사용 가능한 Whisper 프로바이더 목록
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await WhisperService.getAvailableProviders();
    
    res.json({
      success: true,
      providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/whisper/validate
 * Whisper 설정 검증
 */
router.get('/validate', async (req, res) => {
  try {
    const validation = await WhisperService.validateSetup();
    
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/whisper/switch
 * Whisper 프로바이더 전환
 */
router.post('/switch', async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider || !['openai', 'local', 'auto'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'provider는 openai, local, auto 중 하나여야 합니다.'
      });
    }

    const whisperService = await WhisperService.getInstance();
    await whisperService.switchProvider(provider);
    
    const newStatus = await whisperService.checkStatus();
    
    res.json({
      success: true,
      message: `${provider} 프로바이더로 전환되었습니다.`,
      status: newStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/whisper/test
 * Whisper 서비스 테스트
 */
router.post('/test', async (req, res) => {
  try {
    // 테스트용 짧은 오디오 파일이 필요함
    // 실제 구현에서는 샘플 오디오를 생성하거나 업로드된 파일을 사용
    
    res.json({
      success: true,
      message: 'Whisper 테스트 기능은 구현 예정입니다.',
      note: '실제 오디오 파일이 필요합니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;