/**
 * OpenAI API를 사용하는 Whisper 서비스 구현체
 */

import OpenAI from 'openai';
import fs from 'fs';
import { WhisperProvider, SubtitleSegment } from '../base/WhisperProvider';

export class OpenAIWhisperProvider extends WhisperProvider {
  private openai: OpenAI;

  constructor(cacheDir?: string) {
    super(cacheDir);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * OpenAI Whisper API를 사용하여 자막 생성
   */
  async generateSubtitles(audioPath: string, language: string = 'ko'): Promise<SubtitleSegment[]> {
    try {
      console.log('[OpenAI Whisper] 자막 생성 시작:', { audioPath, language });

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: process.env.WHISPER_MODEL || 'whisper-1',
        language: language,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      const segments = transcription.segments?.map((segment: any) => ({
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
      })) || [];

      console.log('[OpenAI Whisper] 자막 생성 완료:', { 
        segmentCount: segments.length,
        totalDuration: segments.length > 0 ? segments[segments.length - 1].end : 0
      });

      return segments;
    } catch (error) {
      console.error('[OpenAI Whisper] 변환 실패:', error);
      throw new Error(`OpenAI Whisper API 호출 실패: ${error.message}`);
    }
  }

  /**
   * OpenAI API 키가 설정되어 있는지 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return false;
      }

      // API 키 유효성 간단 확인 (실제 요청 없이)
      // 실제 사용 시에만 API 요청을 보냄
      return true;
    } catch (error) {
      console.error('[OpenAI Whisper] 사용 불가:', error);
      return false;
    }
  }

  /**
   * 서비스 타입 반환
   */
  getProviderType(): string {
    return 'OpenAI';
  }

  /**
   * OpenAI API 사용량 정보 반환 (선택적)
   */
  async getUsageInfo(): Promise<any> {
    try {
      // OpenAI API는 직접적인 사용량 조회 API가 제한적이므로
      // 필요시 별도 구현
      return {
        provider: 'OpenAI',
        model: process.env.WHISPER_MODEL || 'whisper-1',
        apiKeySet: !!process.env.OPENAI_API_KEY
      };
    } catch (error) {
      console.error('[OpenAI Whisper] 사용량 정보 조회 실패:', error);
      return null;
    }
  }
}