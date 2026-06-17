/**
 * Validation utility functions for LongSentence conversion results
 * Extracted from longSentenceEngine.ts for better modularity
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface Recommendation {
  type: 'info' | 'warning' | 'error';
  message: string;
  suggestedValue?: any;
}

export class ValidationUtils {
  /**
   * 변환 결과 검증
   */
  static validateConversionResult(result: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 기본 구조 검증
    if (!result) {
      errors.push('결과 객체가 없습니다.');
      return { isValid: false, errors, warnings };
    }

    // 성공 여부 확인
    if (!result.success) {
      if (result.error) {
        errors.push(result.error);
      } else {
        errors.push('변환에 실패했습니다.');
      }
      return { isValid: false, errors, warnings };
    }

    // 생성된 클립 검증
    if (!result.generatedClips || result.generatedClips.length === 0) {
      errors.push('생성된 클립이 없습니다.');
      return { isValid: false, errors, warnings };
    }

    // 각 클립 그룹 검증
    result.generatedClips.forEach((clipGroup: any, index: number) => {
      if (!clipGroup.sentenceClip && !clipGroup.audioClip) {
        errors.push(`클립 그룹 ${index + 1}에 텍스트 클립과 오디오 클립이 모두 없습니다.`);
      }

      // 시간 범위 검증
      if (clipGroup.sentenceClip) {
        const clip = clipGroup.sentenceClip;
        if (clip.startTime < 0) {
          errors.push(`텍스트 클립 ${index + 1}의 시작 시간이 음수입니다.`);
        }
        if (clip.duration <= 0) {
          errors.push(`텍스트 클립 ${index + 1}의 지속 시간이 0 이하입니다.`);
        }
        if (clip.startTime + clip.duration !== clip.endTime) {
          warnings.push(`텍스트 클립 ${index + 1}의 시간 계산이 일치하지 않습니다.`);
        }
      }

      if (clipGroup.audioClip) {
        const clip = clipGroup.audioClip;
        if (clip.startTime < 0) {
          errors.push(`오디오 클립 ${index + 1}의 시작 시간이 음수입니다.`);
        }
        if (clip.duration <= 0) {
          errors.push(`오디오 클립 ${index + 1}의 지속 시간이 0 이하입니다.`);
        }
      }
    });

    // 총 지속 시간 검증
    if (result.totalDuration <= 0) {
      errors.push('총 지속 시간이 0 이하입니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * 최적화 제안 생성
   */
  static generateRecommendations(preview: any, options: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 문장 수가 너무 많은 경우
    if (preview.totalSentences > 10) {
      recommendations.push({
        type: 'warning',
        message: '문장 수가 많습니다. 최대 단어 수를 늘려보세요.',
        suggestedValue: options.maxWordsPerSentence + 5
      });
    }

    // 평균 단어 수가 너무 적은 경우
    if (preview.averageWordsPerSentence < 5) {
      recommendations.push({
        type: 'info',
        message: '문장이 너무 짧습니다. 최대 단어 수를 줄여보세요.',
        suggestedValue: Math.max(5, options.maxWordsPerSentence - 3)
      });
    }

    // 예상 시간이 너무 긴 경우
    if (preview.estimatedDuration > 60) {
      recommendations.push({
        type: 'warning',
        message: '총 재생 시간이 1분을 초과합니다. 텍스트를 줄이거나 분할을 늘려보세요.',
        suggestedValue: Math.floor(options.maxWordsPerSentence * 0.8)
      });
    }

    return recommendations;
  }

  /**
   * 입력 데이터 검증
   */
  static validateInputData(longSentenceClip: any): { isValid: boolean; error?: string } {
    if (!longSentenceClip) {
      return { isValid: false, error: '클립 데이터가 없습니다.' };
    }

    if (!longSentenceClip.data || !Array.isArray(longSentenceClip.data)) {
      return { isValid: false, error: '클립 데이터 배열이 없습니다.' };
    }

    // 텍스트 데이터 확인
    const hasValidText = longSentenceClip.data.some((item: any) => 
      item && typeof item.text === 'string' && item.text.trim().length > 0
    );

    if (!hasValidText) {
      return { isValid: false, error: '변환할 텍스트가 없습니다.' };
    }

    return { isValid: true };
  }

  /**
   * TTS 설정 검증
   */
  static validateTTSSettings(longSentenceClip: any): { isValid: boolean; error?: string } {
    if (longSentenceClip.generateTTS) {
      if (!longSentenceClip.language) {
        return { isValid: false, error: 'TTS 생성을 위해 언어 설정이 필요합니다.' };
      }

      if (!longSentenceClip.voice) {
        return { isValid: false, error: 'TTS 생성을 위해 음성 설정이 필요합니다.' };
      }
    }

    return { isValid: true };
  }

  /**
   * 미디어 설정 검증
   */
  static validateMediaSettings(dataItem: any): { isValid: boolean; error?: string } {
    if (dataItem.mediaUrl) {
      if (!dataItem.mediaUrl.startsWith('/') && !dataItem.mediaUrl.startsWith('http')) {
        return { isValid: false, error: '잘못된 미디어 URL 형식입니다.' };
      }
    }

    return { isValid: true };
  }
}