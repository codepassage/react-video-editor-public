/**
 * LongSentence API 서비스
 * 백엔드 API와 통신하여 텍스트 분할 및 변환 작업을 수행
 */

import { LongSentenceClip } from '../../types/clipTypes';
import { getApiUrl } from '../../utils/urlBuilder';

const API_BASE_URL = getApiUrl();

export interface SplitPreviewOptions {
  maxWordsPerSentence: number;
  splitOnPunctuation: boolean;
  language: string;
}

export interface SplitPreviewResult {
  sentences: string[];
  totalSentences: number;
  averageWordsPerSentence: number;
  estimatedDuration: number;
}

export interface ConversionOptions {
  text: string;
  maxWordsPerSentence: number;
  splitOnPunctuation: boolean;
  language: string;
  voice: string;
  generateTTS: boolean;
  generateSubtitles: boolean;
}

export interface ConversionResult {
  success: boolean;
  generatedClips: string[];
  sentences: string[];
  audioFiles: string[];
  subtitleFiles: string[];
  error?: string;
}

export interface ConversionProgress {
  progress: number;
  stage: 'splitting' | 'tts' | 'whisper' | 'finalizing';
  message: string;
}

export class LongSentenceApi {
  /**
   * 텍스트 분할 미리보기
   */
  static async previewSplit(text: string, options: SplitPreviewOptions): Promise<SplitPreviewResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/longsentence/preview-split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`미리보기 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      // 백엔드 응답 형식에 맞게 변환
      if (data.success && data.preview) {
        return data.preview;
      }

      return data;
    } catch (error) {
      console.error('텍스트 분할 미리보기 실패:', error);
      throw error;
    }
  }

  /**
   * LongSentence 변환 시작
   */
  static async convertLongSentence(clipId: string, longSentenceClip: any, baseTrackId?: string): Promise<ConversionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/longsentence/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clipId,
          longSentenceClip,
          baseTrackId,
        }),
      });

      if (!response.ok) {
        throw new Error(`변환 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('LongSentence 변환 실패:', error);
      throw error;
    }
  }

  /**
   * 변환 진행률 조회
   */
  static async getConversionProgress(clipId: string): Promise<ConversionProgress> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/longsentence/progress/${clipId}`);

      if (!response.ok) {
        throw new Error(`진행률 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('변환 진행률 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 변환 진행률 실시간 구독 (Server-Sent Events)
   */
  static subscribeToProgress(clipId: string, onProgress: (progress: ConversionProgress) => void): EventSource {
    const eventSource = new EventSource(`${API_BASE_URL}/api/longsentence/progress/${clipId}`);

    eventSource.onmessage = (event) => {
      try {
        const progress = JSON.parse(event.data);
        onProgress(progress);
      } catch (error) {
        console.error('진행률 데이터 파싱 실패:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('진행률 구독 에러:', error);
      eventSource.close();
    };

    return eventSource;
  }

  /**
   * 변환 취소
   */
  static async cancelConversion(clipId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/longsentence/cancel/${clipId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`변환 취소 실패: ${response.status}`);
      }
    } catch (error) {
      console.error('변환 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 변환 결과 조회
   */
  static async getConversionResult(clipId: string): Promise<ConversionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/longsentence/result/${clipId}`);

      if (!response.ok) {
        throw new Error(`변환 결과 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('변환 결과 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 변환 재시도
   */
  static async retryConversion(clipId: string): Promise<ConversionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/longsentence/retry/${clipId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`변환 재시도 실패: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('변환 재시도 실패:', error);
      throw error;
    }
  }

  /**
   * 변환 가능 언어 목록 조회
   */
  static async getSupportedLanguages(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/longsentence/languages`);

      if (!response.ok) {
        throw new Error(`지원 언어 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.languages;
    } catch (error) {
      console.error('지원 언어 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 언어별 음성 옵션 조회
   */
  static async getVoiceOptions(language: string): Promise<{ value: string; label: string }[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/longsentence/voices/${language}`);

      if (!response.ok) {
        throw new Error(`음성 옵션 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('음성 옵션 조회 실패:', error);
      throw error;
    }
  }
}

export default LongSentenceApi;