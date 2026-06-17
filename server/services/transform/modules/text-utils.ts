/**
 * 텍스트 처리 유틸리티 함수들
 * LongSentenceEngine에서 분리된 독립적인 헬퍼 함수들
 */

export class TextUtils {
  /**
   * 텍스트 정규화 (매칭용)
   */
  static normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, '') // 한글, 영문, 숫자만 유지
      .replace(/\s+/g, ' ')        // 공백 정규화
      .trim();
  }

  /**
   * 텍스트 유사도 계산 (Levenshtein 거리 기반)
   */
  static calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const distance = this.levenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  /**
   * Levenshtein 거리 계산
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 자연스러운 끊김점 감지
   */
  static isNaturalBreak(text: string): boolean {
    return /[.!?。！？]|그리고|그런데|하지만|또한|그래서|따라서|그러나|하지만/.test(text);
  }

  /**
   * 문장 가중치 계산 (길이, 복잡도, 언어적 특성 고려)
   */
  static calculateSentenceWeight(sentence: string): number {
    const baseLength = sentence.length;
    const wordCount = sentence.split(/\s+/).length;
    const complexityBonus = (sentence.match(/[,;:]/g) || []).length * 0.1;
    const koreanBonus = (sentence.match(/[가-힣]/g) || []).length * 0.05;
    
    return Math.max(1, baseLength + wordCount * 2 + complexityBonus + koreanBonus);
  }
}