/**
 * 언어 자동 감지 서비스
 * TTS 시스템에서 "auto" 언어 설정 시 텍스트 내용을 분석하여 언어를 자동 감지
 */

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  method: 'charset' | 'keywords' | 'fallback';
}

export class LanguageDetector {
  private static readonly LANGUAGE_KEYWORDS = {
    ko: ['이', '가', '은', '는', '을', '를', '의', '에', '에서', '로', '와', '과', '으로', '에게', '께', '부터', '까지', '만', '도', '한테'],
    en: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above'],
    ja: ['の', 'に', 'は', 'を', 'が', 'で', 'と', 'から', 'より', 'まで', 'へ', 'も', 'だけ', 'しか', 'など', 'という', 'として', 'について', 'によって', 'において'],
    zh: ['的', '了', '是', '在', '有', '和', '人', '这', '中', '大', '为', '上', '个', '国', '我', '以', '要', '他', '时', '来'],
    es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para'],
    fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se'],
    de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als'],
    it: ['il', 'di', 'che', 'e', 'la', 'per', 'in', 'un', 'è', 'una', 'a', 'con', 'da', 'su', 'del', 'le', 'si', 'gli', 'dei', 'al'],
    pt: ['o', 'de', 'a', 'e', 'que', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais'],
    ru: ['в', 'и', 'не', 'на', 'я', 'быть', 'то', 'он', 'с', 'а', 'как', 'по', 'за', 'но', 'у', 'из', 'так', 'же', 'от', 'мы'],
    ar: ['في', 'من', 'إلى', 'على', 'أن', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'كل', 'بين', 'عند', 'كما', 'لقد', 'قال', 'بعد', 'عن', 'أو', 'إذا']
  };

  private static readonly CHARSET_PATTERNS = {
    ko: /[가-힣]/,
    ja: /[ひらがな-カタカナ]/,
    zh: /[\u4e00-\u9fff]/,
    ar: /[\u0600-\u06ff]/,
    ru: /[\u0400-\u04ff]/,
    th: /[\u0e00-\u0e7f]/,
    hi: /[\u0900-\u097f]/,
    he: /[\u0590-\u05ff]/,
    gr: /[\u0370-\u03ff]/
  };

  /**
   * 텍스트의 언어를 자동 감지합니다.
   * @param text 감지할 텍스트
   * @returns 감지된 언어 정보
   */
  public static detectLanguage(text: string): LanguageDetectionResult {
    if (!text || text.trim().length < 2) {
      return {
        language: 'en',
        confidence: 0,
        method: 'fallback'
      };
    }

    const cleanText = text.trim();

    // 1차: 문자 집합 기반 감지 (높은 신뢰도)
    const charsetResult = this.detectByCharset(cleanText);
    if (charsetResult.confidence > 0.8) {
      return charsetResult;
    }

    // 2차: 키워드 빈도 기반 감지 (중간 신뢰도)
    const keywordResult = this.detectByKeywords(cleanText);
    if (keywordResult.confidence > 0.6) {
      return keywordResult;
    }

    // 3차: 폴백 - 영어 기본값
    return {
      language: 'en',
      confidence: 0.5,
      method: 'fallback'
    };
  }

  /**
   * 문자 집합 기반 언어 감지
   * 특정 문자 집합을 사용하는 언어들을 감지
   */
  private static detectByCharset(text: string): LanguageDetectionResult {
    const totalChars = text.length;
    let bestMatch = { language: 'en', confidence: 0 };

    for (const [language, pattern] of Object.entries(this.CHARSET_PATTERNS)) {
      const matches = text.match(new RegExp(pattern, 'g'));
      if (matches) {
        const confidence = matches.length / totalChars;
        if (confidence > bestMatch.confidence) {
          bestMatch = { language, confidence };
        }
      }
    }

    return {
      language: bestMatch.language,
      confidence: bestMatch.confidence,
      method: 'charset'
    };
  }

  /**
   * 키워드 빈도 기반 언어 감지
   * 각 언어의 고빈도 단어를 기반으로 감지
   */
  private static detectByKeywords(text: string): LanguageDetectionResult {
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    let bestMatch = { language: 'en', confidence: 0 };

    for (const [language, keywords] of Object.entries(this.LANGUAGE_KEYWORDS)) {
      let matchCount = 0;
      
      for (const word of words) {
        if (keywords.includes(word)) {
          matchCount++;
        }
      }

      const confidence = matchCount / totalWords;
      if (confidence > bestMatch.confidence) {
        bestMatch = { language, confidence };
      }
    }

    return {
      language: bestMatch.language,
      confidence: bestMatch.confidence,
      method: 'keywords'
    };
  }

  /**
   * 지원되는 언어 목록 반환
   */
  public static getSupportedLanguages(): string[] {
    const charsetLanguages = Object.keys(this.CHARSET_PATTERNS);
    const keywordLanguages = Object.keys(this.LANGUAGE_KEYWORDS);
    return [...new Set([...charsetLanguages, ...keywordLanguages])];
  }

  /**
   * 언어 감지 결과를 Google TTS API 언어 코드로 변환
   */
  public static mapToTTSLanguageCode(detectedLanguage: string): string {
    const languageMapping: Record<string, string> = {
      ko: 'ko',
      en: 'en',
      ja: 'ja',
      zh: 'zh',
      es: 'es',
      fr: 'fr',
      de: 'de',
      it: 'it',
      pt: 'pt',
      ru: 'ru',
      ar: 'ar',
      th: 'th',
      hi: 'hi',
      he: 'he',
      gr: 'el' // 그리스어는 'el' 코드 사용
    };

    return languageMapping[detectedLanguage] || 'en';
  }
}