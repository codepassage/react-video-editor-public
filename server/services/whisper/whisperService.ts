/**
 * 🎤 whisperService.ts - Whisper 음성 인식 시스템 (10번 모듈)
 * 
 * OpenAI Whisper를 활용한 정밀 음성-텍스트 동기화 시스템
 * 팩토리 패턴으로 OpenAI API와 로컬 Whisper 자동 선택
 * 
 * 주요 기능:
 * - 단어 레벨 정밀 타이밍 (millisecond 정확도)
 * - OpenAI API / 로컬 Whisper 자동 선택
 * - 스마트 텍스트 매칭 알고리즘
 * - 다국어 지원 (100+ 언어)
 * - 실시간 진행률 모니터링
 * - 오디오 전처리 (FFmpeg)
 * 
 * 환경 변수 설정:
 * - WHISPER_PROVIDER: 'openai' | 'local' | 'auto' (기본값: 'local')
 * - OPENAI_API_KEY: OpenAI API 키 (OpenAI 사용 시 필수)
 * - LOCAL_WHISPER_COMMAND: 로컬 Whisper 명령어 (기본값: 'whisper')
 * - LOCAL_WHISPER_MODEL_SIZE: 로컬 모델 크기 (기본값: 'base')
 * 
 * 제공자 선택 전략:
 * 1. OPENAI_API_KEY 있으면 OpenAI API 우선
 * 2. 로컬 Whisper 설치 확인
 * 3. 둘 다 없으면 오류 발생
 * 
 * 정밀도 최적화:
 * - Long Sentence Engine과 완벽 연동
 * - TTS 오디오와 정확한 동기화
 * - 단어별 시작/끝 타이밍 제공
 * - 신뢰도 기반 필터링
 * 
 * 사용 사례:
 * - Long Sentence -> Whisper 자막 생성
 * - Manual 오디오 -> 자막 변환
 * - TTS 오디오 검증
 * - 다국어 자막 생성
 */

import { WhisperServiceFactory, WhisperProviderType } from './WhisperServiceFactory';
import { WhisperProvider } from './base/WhisperProvider';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export class WhisperService {
  private provider: WhisperProvider | null = null;           // 현재 활성 제공자 (OpenAI/Local)
  private static instance: WhisperService | null = null;     // 싱글톤 인스턴스

  private constructor() {
    // 싱글톤 패턴 - private 생성자
    // 초기화는 getInstance()에서 수행
  }

  /**
   * WhisperService 인스턴스 가져오기 (싱글톤)
   */
  static async getInstance(): Promise<WhisperService> {
    if (!WhisperService.instance) {
      WhisperService.instance = new WhisperService();
      await WhisperService.instance.initialize();
    }
    return WhisperService.instance;
  }

  /**
   * 서비스 초기화
   */
  private async initialize(): Promise<void> {
    try {
      this.provider = await WhisperServiceFactory.createWhisperService();
      console.log(`[WhisperService] ${this.provider.getProviderType()} 프로바이더로 초기화됨`);
    } catch (error) {
      console.error('[WhisperService] 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 프로바이더로 재초기화
   */
  async switchProvider(providerType: WhisperProviderType): Promise<void> {
    try {
      this.provider = await WhisperServiceFactory.createWhisperService(providerType);
      console.log(`[WhisperService] ${providerType} 프로바이더로 전환됨`);
    } catch (error) {
      console.error(`[WhisperService] ${providerType} 프로바이더 전환 실패:`, error);
      throw error;
    }
  }

  /**
   * 현재 프로바이더 확인
   */
  private ensureProvider(): WhisperProvider {
    if (!this.provider) {
      throw new Error('WhisperService가 초기화되지 않았습니다. getInstance()를 사용하세요.');
    }
    return this.provider;
  }

  /**
   * 음성 파일에서 자막 생성
   */
  async generateSubtitles(audioPath: string, language: string = 'ko'): Promise<SubtitleSegment[]> {
    const provider = this.ensureProvider();
    return await provider.generateSubtitles(audioPath, language);
  }

  /**
   * 캐시와 함께 자막 생성 (메인 메서드)
   */
  async generateSubtitlesWithCache(audioPath: string, language: string = 'ko', options?: { enablePreciseTiming?: boolean }): Promise<SubtitleSegment[]> {
    const provider = this.ensureProvider();
    return await provider.generateSubtitlesWithCache(audioPath, language, options);
  }

  /**
   * SRT 파일 생성
   */
  generateSRTFile(segments: SubtitleSegment[], outputPath: string): void {
    const provider = this.ensureProvider();
    provider.generateSRTFile(segments, outputPath);
  }

  /**
   * 음성 파일을 Whisper가 지원하는 형식으로 변환
   */
  async convertAudioForWhisper(inputPath: string): Promise<string> {
    const provider = this.ensureProvider();
    const cacheDir = (provider as any).cacheDir || path.join(process.cwd(), 'server', 'uploads', 'whisper');
    const outputPath = path.join(cacheDir, `whisper_${Date.now()}.wav`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .format('wav')
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  /**
   * 캐시된 자막 파일 확인
   */
  getCachedSubtitles(audioPath: string, options?: { enablePreciseTiming?: boolean }): SubtitleSegment[] | null {
    const provider = this.ensureProvider();
    return provider.getCachedSubtitles(audioPath, options);
  }

  /**
   * 자막을 캐시에 저장
   */
  cacheSubtitles(audioPath: string, subtitles: SubtitleSegment[], options?: { enablePreciseTiming?: boolean }): void {
    const provider = this.ensureProvider();
    provider.cacheSubtitles(audioPath, subtitles, options);
  }

  /**
   * 캐시 정리
   */
  cleanCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const provider = this.ensureProvider();
    provider.cleanCache(maxAge);
  }

  /**
   * 현재 사용 중인 프로바이더 정보
   */
  getProviderInfo(): { type: string; available: boolean } {
    if (!this.provider) {
      return { type: 'None', available: false };
    }
    
    return {
      type: this.provider.getProviderType(),
      available: true
    };
  }

  /**
   * 서비스 상태 확인
   */
  async checkStatus(): Promise<{
    available: boolean;
    provider: string;
    error?: string;
  }> {
    try {
      if (!this.provider) {
        return {
          available: false,
          provider: 'None',
          error: '프로바이더가 초기화되지 않음'
        };
      }

      const isAvailable = await this.provider.isAvailable();
      return {
        available: isAvailable,
        provider: this.provider.getProviderType(),
        error: isAvailable ? undefined : '서비스 사용 불가'
      };
    } catch (error) {
      return {
        available: false,
        provider: this.provider?.getProviderType() || 'Unknown',
        error: error.message
      };
    }
  }

  /**
   * 사용 가능한 모든 프로바이더 확인
   */
  static async getAvailableProviders() {
    return await WhisperServiceFactory.getAvailableProviders();
  }

  /**
   * 설정 검증
   */
  static async validateSetup() {
    return await WhisperServiceFactory.validateSetup();
  }

  /**
   * 인스턴스 재시작 (테스트용)
   */
  static reset(): void {
    WhisperService.instance = null;
    WhisperServiceFactory.clearCache();
  }
}

// 기존 인터페이스 유지 (하위 호환성)
export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

// 새로운 타입들도 export
export { WhisperProvider } from './base/WhisperProvider';
export { WhisperServiceFactory } from './WhisperServiceFactory';
export type { WhisperProviderType } from './WhisperServiceFactory';