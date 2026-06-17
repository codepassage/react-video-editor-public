/**
 * 원격 Whisper API 서버를 사용하는 서비스 구현체
 * FastAPI 기반 Whisper 서버 (POST /transcribe)와 HTTP 통신
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { WhisperProvider, SubtitleSegment } from '../base/WhisperProvider';

export class RemoteWhisperProvider extends WhisperProvider {
  private apiUrl: string;
  private timeout: number;

  constructor(cacheDir?: string) {
    super(cacheDir);

    this.apiUrl = process.env.REMOTE_WHISPER_URL || '';
    this.timeout = parseInt(process.env.REMOTE_WHISPER_TIMEOUT || '300000', 10);

    if (!this.apiUrl) {
      throw new Error('REMOTE_WHISPER_URL 환경변수가 설정되지 않았습니다.');
    }

    console.log(`✅ [Remote Whisper] 서버 URL: ${this.apiUrl}`);
  }

  /**
   * 원격 Whisper 서버를 통해 자막 생성
   */
  async generateSubtitles(audioPath: string, language: string = 'ko'): Promise<SubtitleSegment[]> {
    try {
      console.log('[Remote Whisper] 자막 생성 시작:', { audioPath, language, apiUrl: this.apiUrl });

      if (!fs.existsSync(audioPath)) {
        throw new Error(`오디오 파일을 찾을 수 없습니다: ${audioPath}`);
      }

      const form = new FormData();
      form.append('audio', fs.createReadStream(audioPath));
      form.append('language', language);
      form.append('engine', 'auto');

      const response = await axios.post(
        `${this.apiUrl}/transcribe`,
        form,
        {
          headers: form.getHeaders(),
          timeout: this.timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const data = response.data;

      // 응답에서 segments 추출 및 SubtitleSegment 형식으로 변환
      if (data.segments && Array.isArray(data.segments)) {
        const segments: SubtitleSegment[] = data.segments.map((segment: any) => ({
          start: segment.start || 0,
          end: segment.end || 0,
          text: (segment.text || '').trim(),
          words: (segment.words || []).map((w: any) => ({
            word: w.word || '',
            start: w.start || 0,
            end: w.end || 0,
            probability: w.probability || 0,
          })),
          confidence: segment.avg_logprob || 0,
        }));

        console.log('[Remote Whisper] 자막 생성 완료:', {
          segmentCount: segments.length,
          totalDuration: segments.length > 0 ? segments[segments.length - 1].end : 0,
        });

        return segments;
      }

      // segments가 없으면 전체 텍스트를 하나의 세그먼트로
      if (data.text) {
        return [{
          start: 0,
          end: 0,
          text: data.text.trim(),
          words: [],
          confidence: 0,
        }];
      }

      console.warn('[Remote Whisper] 빈 응답');
      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.detail || error.message;
        console.error(`[Remote Whisper] API 호출 실패 (${status}):`, message);
        throw new Error(`원격 Whisper API 호출 실패 (${status}): ${message}`);
      }
      console.error('[Remote Whisper] 변환 실패:', error);
      throw new Error(`원격 Whisper 실행 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 원격 서버 상태 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.apiUrl) {
        return false;
      }

      const response = await axios.get(`${this.apiUrl}/health`, { timeout: 5000 });
      const isHealthy = response.status === 200;

      if (isHealthy) {
        console.log('[Remote Whisper] 서버 연결 확인됨:', this.apiUrl);
      }

      return isHealthy;
    } catch (error) {
      console.warn('[Remote Whisper] 서버 연결 불가:', this.apiUrl, error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * 서비스 타입 반환
   */
  getProviderType(): string {
    return 'Remote';
  }

  /**
   * 모델 정보 반환 (캐시 키에 사용)
   */
  protected getModelInfo(): string {
    return `remote-whisper-${this.apiUrl}`;
  }

  /**
   * 원격 서버 정보 반환
   */
  async getRemoteInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/info`, { timeout: 5000 });
      return {
        provider: 'Remote',
        available: true,
        url: this.apiUrl,
        ...response.data,
      };
    } catch (error) {
      return {
        provider: 'Remote',
        available: false,
        url: this.apiUrl,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
