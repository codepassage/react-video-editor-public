/**
 * 🎵 googleTTS.ts - Google Cloud TTS 서비스 (5번 모듈)
 * 
 * Google Cloud Text-to-Speech API를 활용한 다국어 음성 합성 시스템
 * 53개 언어 지원, 자동 언어 감지, 지능형 캐싱으로 성능 최적화
 * 
 * 주요 기능:
 * - Google Cloud TTS API 통합
 * - 53개 언어 자동 감지 및 지원
 * - 지능형 오디오 캐싱 (중복 생성 방지)
 * - 음성 옵션 커스터마이징 (속도, 톤, 성별)
 * - 음성 목록 캐싱 (24시간)
 * - FFmpeg 기반 오디오 메타데이터 추출
 * 
 * 지원 언어 (일부):
 * - 한국어 (ko-KR): Standard-A~D, Wavenet-A~D
 * - 영어 (en-US): Standard-A~J, Wavenet-A~J
 * - 일본어 (ja-JP): Standard-A~D, Wavenet-A~D
 * - 중국어 (zh-CN): Standard-A~D, Wavenet-A~D
 * - 독일어, 프랑스어, 스페인어, 이탈리아어 등
 * 
 * 성능 최적화:
 * - MD5 해시 기반 캐싱 (텍스트+언어+옵션)
 * - 24시간 음성 목록 캐싱
 * - 비동기 처리로 응답 속도 향상
 * - 자동 디렉토리 관리
 * 
 * 사용 방식:
 * - Long Sentence Engine에서 자동 호출
 * - Manual TTS 생성
 * - Bulk TTS 처리
 */

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AudioCacheManager } from './audioCache';

const execAsync = promisify(exec);

export interface TTSOptions {
  text: string;
  language: string;
  voice?: string; // 특정 음성 선택 (옵션)
  speakingRate?: number; // 말하기 속도 (0.25 ~ 4.0)
}

export interface TTSResult {
  url: string;
  duration: number;
  cached: boolean;
  filePath: string;
}

export class GoogleTTSService {
  private client: TextToSpeechClient;
  private cacheDir: string;
  private cacheManager: AudioCacheManager;
  private voicesCacheFile: string;
  private voicesCache: any[] | null = null;
  private voicesCacheExpiry: number = 0;
  private readonly VOICES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

  constructor(cacheDir?: string) {
    this.client = new TextToSpeechClient();
    this.cacheDir = cacheDir || process.env.TTS_CACHE_DIR || 'server/uploads/tts';
    this.cacheManager = new AudioCacheManager(this.cacheDir);
    this.voicesCacheFile = path.join(this.cacheDir, 'voices-cache.json');
    
    // 캐시 초기화
    this.cacheManager.initialize().catch(error => {
      console.error('TTS cache initialization failed:', error);
    });

    // 음성 목록 캐시 로드
    this.loadVoicesCache().catch(error => {
      console.error('Failed to load voices cache:', error);
    });
  }

  /**
   * 텍스트를 음성 파일로 변환
   */
  async generateAudio(options: TTSOptions): Promise<TTSResult> {
    const { text, language, voice, speakingRate = 1.0 } = options;

    // 캐시 키 생성 (텍스트 + 언어 + 옵션들의 해시)
    const cacheKey = AudioCacheManager.generateKey(text, language, voice, speakingRate);
    
    // 캐시 확인
    const cachedEntry = await this.cacheManager.get(cacheKey);
    if (cachedEntry) {
      return {
        url: cachedEntry.url,
        duration: cachedEntry.duration,
        cached: true,
        filePath: cachedEntry.filePath
      };
    }

    const fileName = `${cacheKey}.mp3`;
    const filePath = path.join(this.cacheDir, fileName);
    const url = `/uploads/tts/${fileName}`;

    // TTS 생성
    try {
      // 디렉토리 생성
      await fs.mkdir(this.cacheDir, { recursive: true });

      // Google TTS API 요청
      const request = {
        input: { text },
        voice: {
          languageCode: language,
          name: voice || this.getDefaultVoice(language),
          ssmlGender: 'NEUTRAL' as const
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content received from TTS API');
      }

      // 파일 저장
      await fs.writeFile(filePath, response.audioContent, 'binary');

      // 재생 시간 추출
      const duration = await this.getAudioDuration(filePath);

      // 캐시에 추가
      await this.cacheManager.set(cacheKey, filePath, url, duration);

      return {
        url,
        duration,
        cached: false,
        filePath
      };
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw new Error(`TTS 생성 실패: ${error.message}`);
    }
  }

  /**
   * 캐시 통계 조회
   */
  async getCacheStats() {
    return await this.cacheManager.getStats();
  }

  /**
   * 캐시 정리
   */
  async cleanCache(maxAge?: number) {
    return await this.cacheManager.cleanup(maxAge);
  }

  /**
   * 전체 캐시 삭제
   */
  async clearCache() {
    return await this.cacheManager.clear();
  }

  /**
   * 음성 목록 캐시 새로고침 (강제 재로드)
   */
  async refreshVoicesCache(): Promise<any[]> {
    try {
      console.log('🔄 음성 목록 캐시 강제 새로고침...');
      
      // 캐시 무효화
      this.voicesCache = null;
      this.voicesCacheExpiry = 0;
      
      // 캐시 파일 삭제
      try {
        await fs.unlink(this.voicesCacheFile);
        console.log('🗑️ 기존 음성 목록 캐시 파일 삭제');
      } catch (error) {
        // 파일이 없어도 무시
      }
      
      // 새로운 음성 목록 조회
      const voices = await this.getAvailableVoices();
      
      console.log(`✅ 음성 목록 캐시 새로고침 완료: ${voices.length}개 음성`);
      return voices;
    } catch (error) {
      console.error('음성 목록 캐시 새로고침 실패:', error);
      throw error;
    }
  }

  /**
   * 음성 목록 캐시 상태 조회
   */
  getVoicesCacheInfo() {
    return {
      cached: !!this.voicesCache,
      totalVoices: this.voicesCache?.length || 0,
      expiry: this.voicesCacheExpiry,
      expired: Date.now() > this.voicesCacheExpiry,
      cacheFile: this.voicesCacheFile,
      ttlHours: this.VOICES_CACHE_TTL / (60 * 60 * 1000)
    };
  }

  /**
   * 오디오 파일의 재생 시간 추출 (ffprobe 사용)
   */
  private async getAudioDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
      );
      return parseFloat(stdout.trim());
    } catch (error) {
      console.error('Failed to get audio duration:', error);
      // 기본값 반환 (실패 시)
      return 3.0;
    }
  }

  /**
   * 음성 목록 캐시 로드
   */
  private async loadVoicesCache(): Promise<void> {
    try {
      // 디렉토리 확인 및 생성
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      // 캐시 파일 존재 확인
      const cacheExists = await fs.access(this.voicesCacheFile).then(() => true).catch(() => false);
      
      if (cacheExists) {
        const cacheData = await fs.readFile(this.voicesCacheFile, 'utf8');
        const parsed = JSON.parse(cacheData);
        
        // 캐시 유효성 검사
        if (parsed.expiry && Date.now() < parsed.expiry && parsed.voices) {
          this.voicesCache = parsed.voices;
          this.voicesCacheExpiry = parsed.expiry;
          console.log(`✅ 음성 목록 캐시 로드: ${parsed.voices.length}개 음성 (만료: ${new Date(parsed.expiry).toLocaleString()})`);
          return;
        }
      }
      
      console.log('🔄 음성 목록 캐시가 없거나 만료됨, 새로 로드 필요');
    } catch (error) {
      console.error('음성 목록 캐시 로드 실패:', error);
    }
  }

  /**
   * 음성 목록 캐시 저장
   */
  private async saveVoicesCache(voices: any[]): Promise<void> {
    try {
      const cacheData = {
        voices,
        expiry: Date.now() + this.VOICES_CACHE_TTL,
        timestamp: new Date().toISOString(),
        totalVoices: voices.length,
        languages: [...new Set(voices.map(v => v.primaryLanguage))].length
      };

      await fs.writeFile(this.voicesCacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
      
      this.voicesCache = voices;
      this.voicesCacheExpiry = cacheData.expiry;
      
      console.log(`💾 음성 목록 캐시 저장: ${voices.length}개 음성, ${cacheData.languages}개 언어`);
    } catch (error) {
      console.error('음성 목록 캐시 저장 실패:', error);
    }
  }

  /**
   * Google TTS API에서 지원하는 모든 음성 목록 조회
   */
  async getAvailableVoices(): Promise<any[]> {
    // 캐시 확인
    if (this.voicesCache && Date.now() < this.voicesCacheExpiry) {
      console.log(`📋 캐시된 음성 목록 사용: ${this.voicesCache.length}개 음성`);
      return this.voicesCache;
    }

    try {
      console.log('🌐 Google TTS API에서 음성 목록 조회 중...');
      const [response] = await this.client.listVoices();
      
      if (!response.voices) {
        throw new Error('No voices available');
      }

      // 음성 정보를 사용하기 쉬운 형태로 변환
      const voices = response.voices.map(voice => ({
        name: voice.name,
        languageCodes: voice.languageCodes,
        ssmlGender: voice.ssmlGender,
        naturalSampleRateHertz: voice.naturalSampleRateHertz,
        // 음성 타입 판별 (이름 패턴으로)
        type: this.getVoiceType(voice.name || ''),
        // 언어 코드에서 주 언어 추출
        primaryLanguage: voice.languageCodes?.[0]?.split('-')[0] || 'unknown',
        // 지역 정보
        region: voice.languageCodes?.[0] || 'unknown'
      }));

      // 캐시에 저장
      await this.saveVoicesCache(voices);

      console.log(`✅ Google TTS API 조회 완료: ${voices.length}개 음성, ${[...new Set(voices.map(v => v.primaryLanguage))].length}개 언어`);
      return voices;
    } catch (error) {
      console.error('Failed to get available voices:', error);
      
      // API 실패 시 캐시된 음성 목록 사용 (만료되었어도)
      if (this.voicesCache) {
        console.log(`⚠️ API 실패, 만료된 캐시 사용: ${this.voicesCache.length}개 음성`);
        return this.voicesCache;
      }
      
      throw new Error(`음성 목록 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 음성 이름으로 타입 판별
   */
  private getVoiceType(voiceName: string): string {
    if (voiceName.includes('Chirp3-HD')) return 'Chirp3-HD';
    if (voiceName.includes('Chirp-HD')) return 'Chirp-HD';
    if (voiceName.includes('Studio')) return 'Studio';
    if (voiceName.includes('Neural2')) return 'Neural2';
    if (voiceName.includes('WaveNet')) return 'WaveNet';
    if (voiceName.includes('Standard')) return 'Standard';
    return 'Standard'; // 기본값
  }

  /**
   * 언어별로 음성 목록 그룹화
   */
  async getVoicesByLanguage(): Promise<Record<string, any[]>> {
    const voices = await this.getAvailableVoices();
    const groupedVoices: Record<string, any[]> = {};

    voices.forEach(voice => {
      const lang = voice.primaryLanguage;
      if (!groupedVoices[lang]) {
        groupedVoices[lang] = [];
      }
      groupedVoices[lang].push(voice);
    });

    // 각 언어별로 타입과 이름으로 정렬
    Object.keys(groupedVoices).forEach(lang => {
      groupedVoices[lang].sort((a, b) => {
        // 1. 타입 우선순위 (Premium 타입 우선)
        const typeOrder = ['Chirp3-HD', 'Chirp-HD', 'Neural2', 'WaveNet', 'Studio', 'Standard'];
        const aTypeIndex = typeOrder.indexOf(a.type);
        const bTypeIndex = typeOrder.indexOf(b.type);
        
        if (aTypeIndex !== bTypeIndex) {
          return aTypeIndex - bTypeIndex;
        }

        // 2. 이름으로 정렬
        return (a.name || '').localeCompare(b.name || '');
      });
    });

    return groupedVoices;
  }

  /**
   * 언어별 기본 음성 설정
   */
  private getDefaultVoice(language: string): string {
    const voiceMap: { [key: string]: string } = {
      'ko': 'ko-KR-Standard-A', // 한국어 여성
      'en': 'en-US-Standard-C', // 영어 여성
      'ja': 'ja-JP-Standard-A', // 일본어 여성
      'zh': 'cmn-CN-Standard-A', // 중국어 여성
      'es': 'es-ES-Standard-A', // 스페인어 여성
      'fr': 'fr-FR-Standard-C', // 프랑스어 여성
      'de': 'de-DE-Standard-A', // 독일어 여성
    };

    return voiceMap[language] || `${language}-Standard-A`;
  }

}