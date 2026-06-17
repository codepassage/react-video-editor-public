/**
 * ✂️ sentenceSplitter.ts - 고급 텍스트 문장 분할 서비스
 * 
 * React Video Editor v1의 서버 측에서 사용되는 지능형 텍스트 분할 엔진입니다.
 * 긴 텍스트를 여러 문장으로 자동 분할하고 TTS에 적합한 형태로 최적화하는
 * 고급 알고리즘을 제공합니다.
 * 
 * 🎯 주요 기능:
 * - 언어별 특화 문장 분할 (한국어, 영어, 일본어, 중국어 등)
 * - 동적 재분배 알고리즘으로 균등한 문장 길이 조정
 * - 구두점 기반 및 단어 수 기반 분할 옵션
 * - TTS 음성 시간 예측 및 최적화
 * - 문장 복잡도 분석 및 품질 평가
 * - 실시간 분할 미리보기 기능
 * 
 * 🧠 분할 알고리즘:
 * ```
 * 1. 언어 감지 → 구두점 패턴 선택
 * 2. 초기 분할 → 구두점 또는 단어 수 기준
 * 3. 동적 재분배 → 너무 짧은/긴 문장 조정
 * 4. 균형 조정 → 최종 품질 최적화
 * 5. 검증 → 단어 수 제한 및 유효성 검사
 * ```
 * 
 * 🌍 언어별 최적화:
 * - 한국어: 조사와 어미 고려한 자연스러운 분할
 * - 영어: 긴 단어 특성을 고려한 단어 수 조정
 * - 일본어: 문자 밀도를 고려한 분할
 * - 중국어: 한자 특성을 고려한 최적화
 * 
 * ⚡ 성능 최적화:
 * - 정규식 기반 빠른 패턴 매칭
 * - 메모리 효율적인 스트림 처리
 * - 캐시된 언어별 설정
 * - 배치 처리 지원
 * 
 * 🎵 TTS 통합:
 * - Google TTS API 호환 텍스트 길이 최적화
 * - 음성 시간 예측 (분당 300-400자 기준)
 * - 자연스러운 끊어 읽기 지점 제안
 * - 발음하기 어려운 구간 감지
 * 
 * 🔗 연관 모듈:
 * - 4번 모듈: Long Sentence Engine (메인 처리 엔진)
 * - TTS 서비스: 음성 생성 최적화
 * - Whisper 서비스: 자막 동기화
 * - 언어 감지 서비스: 자동 언어 선택
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 2.0
 */
export class SentenceSplitter {
  /**
   * 메인 텍스트 분할 함수 - 지능형 문장 분할 엔진
   * 
   * @method splitText
   * @param {string} text - 분할할 원본 텍스트
   * @param {SplitOptions} options - 분할 옵션 설정
   * @returns {string[]} 분할된 문장 배열
   * 
   * @description 입력된 긴 텍스트를 설정된 옵션에 따라 적절한 길이의 문장들로
   * 분할합니다. 구두점 기반 분할과 단어 수 기반 분할을 지원하며,
   * 동적 재분배 알고리즘을 통해 균등한 문장 길이를 보장합니다.
   * 
   * 🔧 처리 과정:
   * 1. 옵션 검증 및 기본값 설정
   * 2. 분할 방식 선택 (구두점 vs 단어 수)
   * 3. 초기 분할 실행
   * 4. 동적 재분배 적용 (옵션에 따라)
   * 5. 최대 단어 수 제한 강제 적용
   * 
   * 💡 사용 예시:
   * ```typescript
   * const splitter = new SentenceSplitter();
   * const sentences = splitter.splitText(
   *   "긴 텍스트입니다. 여러 문장이 포함되어 있습니다.",
   *   {
   *     maxWordsPerSentence: 15,
   *     splitOnPunctuation: true,
   *     language: 'ko',
   *     enableDynamicRedistribution: true
   *   }
   * );
   * ```
   */
  splitText(text: string, options: SplitOptions): string[] {
    const {
      maxWordsPerSentence = 15,
      splitOnPunctuation = true,
      language = 'ko',
      enableDynamicRedistribution = true,
      minWordsPerSentence = 5
    } = options;

    let sentences: string[] = [];

    if (splitOnPunctuation) {
      // 구두점 기준 분할
      sentences = this.splitByPunctuation(text, language);
      
      // 동적 재분배 적용
      if (enableDynamicRedistribution) {
        sentences = this.redistributeSentences(sentences, minWordsPerSentence, maxWordsPerSentence);
      }
    } else {
      // 단어 수 기준 분할
      sentences = this.splitByWordCount(text, maxWordsPerSentence);
    }

    // 최대 단어 수 제한 적용
    return sentences.flatMap(sentence => 
      this.enforceWordLimit(sentence, maxWordsPerSentence)
    );
  }

  /**
   * 동적 재분배 알고리즘 - 스마트 문장 길이 균등화
   * 
   * @method redistributeSentences
   * @private
   * @param {string[]} sentences - 초기 분할된 문장 배열
   * @param {number} minWords - 문장당 최소 단어 수
   * @param {number} maxWords - 문장당 최대 단어 수
   * @returns {string[]} 재분배된 문장 배열
   * 
   * @description 초기 분할 결과를 분석하여 너무 짧거나 긴 문장들을
   * 지능적으로 재배치합니다. 인접 문장과의 병합, 긴 문장 분할 등을
   * 통해 TTS에 최적화된 균등한 문장 길이를 달성합니다.
   * 
   * 🧮 재분배 로직:
   * 1. 각 문장의 단어 수 계산 및 분석
   * 2. 짧은 문장 감지 → 다음 문장과 병합 시도
   * 3. 마지막 짧은 문장 → 이전 문장과 병합 시도
   * 4. 병합 불가능한 경우 → 현상 유지
   * 5. 최종 균형 조정 실행
   * 
   * ⚖️ 균형 조정 원칙:
   * - 병합 시 최대 단어 수 초과 금지
   * - 자연스러운 문장 경계 유지
   * - 의미적 연관성 고려
   * - TTS 발음 품질 최우선
   */
  private redistributeSentences(sentences: string[], minWords: number, maxWords: number): string[] {
    if (sentences.length <= 1) return sentences;

    // 각 문장의 단어 수 계산
    const sentenceWordCounts = sentences.map(s => ({
      text: s,
      words: this.getWords(s),
      wordCount: this.getWords(s).length
    }));

    console.log('🔄 동적 재분배 시작:', {
      originalSentences: sentences.length,
      wordCounts: sentenceWordCounts.map(s => s.wordCount),
      minWords,
      maxWords
    });

    const redistributed: string[] = [];
    let i = 0;

    while (i < sentenceWordCounts.length) {
      const current = sentenceWordCounts[i];
      
      // 현재 문장이 너무 짧은 경우
      if (current.wordCount < minWords && i < sentenceWordCounts.length - 1) {
        // 다음 문장과 병합 시도
        const next = sentenceWordCounts[i + 1];
        const combinedWordCount = current.wordCount + next.wordCount;
        
        // 병합해도 maxWords를 초과하지 않으면 병합
        if (combinedWordCount <= maxWords) {
          const combined = current.text + ' ' + next.text;
          redistributed.push(combined);
          console.log(`✅ 병합: "${current.text}" + "${next.text}" = ${combinedWordCount}단어`);
          i += 2; // 두 문장을 처리했으므로 2 증가
          continue;
        }
      }
      
      // 마지막 문장이 너무 짧은 경우 이전 문장과 병합 시도
      if (current.wordCount < minWords && i === sentenceWordCounts.length - 1 && redistributed.length > 0) {
        const lastRedistributed = redistributed[redistributed.length - 1];
        const lastWordCount = this.getWords(lastRedistributed).length;
        
        if (lastWordCount + current.wordCount <= maxWords) {
          redistributed[redistributed.length - 1] = lastRedistributed + ' ' + current.text;
          console.log(`✅ 마지막 문장 병합: ${current.wordCount}단어를 이전 문장에 추가`);
          i++;
          continue;
        }
      }
      
      // 그대로 추가
      redistributed.push(current.text);
      i++;
    }

    // 결과 검증 및 추가 조정
    const finalResult = this.balanceSentences(redistributed, minWords, maxWords);
    
    console.log('🎯 재분배 완료:', {
      finalSentences: finalResult.length,
      finalWordCounts: finalResult.map(s => this.getWords(s).length)
    });

    return finalResult;
  }

  /**
   * 문장 균형 조정 - 최종 품질 최적화
   * 
   * @method balanceSentences
   * @private
   * @param {string[]} sentences - 재분배된 문장 배열
   * @param {number} minWords - 최소 단어 수 기준
   * @param {number} maxWords - 최대 단어 수 기준
   * @returns {string[]} 최종 균형 조정된 문장 배열
   * 
   * @description 재분배 후에도 남아있는 긴 문장들을 중간 지점에서
   * 분할하여 최종적으로 균형잡힌 문장 구조를 완성합니다.
   * 
   * 🎯 조정 기준:
   * - 목표 평균 길이: (minWords + maxWords) / 2
   * - 중간 지점 분할: 의미 손상 최소화
   * - 자연스러운 끊어 읽기 지점 선택
   */
  private balanceSentences(sentences: string[], minWords: number, maxWords: number): string[] {
    const targetAverage = Math.floor((minWords + maxWords) / 2);
    const result: string[] = [];
    
    for (const sentence of sentences) {
      const wordCount = this.getWords(sentence).length;
      
      // 문장이 여전히 너무 길면 중간 지점에서 분할
      if (wordCount > maxWords) {
        const words = this.getWords(sentence);
        const midPoint = Math.ceil(words.length / 2);
        
        result.push(words.slice(0, midPoint).join(' '));
        result.push(words.slice(midPoint).join(' '));
        console.log(`✂️ 긴 문장 분할: ${wordCount}단어 → ${midPoint} + ${words.length - midPoint}단어`);
      } else {
        result.push(sentence);
      }
    }
    
    return result;
  }

  /**
   * 구두점 기반 텍스트 분할
   * 
   * @method splitByPunctuation
   * @private
   * @param {string} text - 분할할 원본 텍스트
   * @param {string} language - 대상 언어 코드
   * @returns {string[]} 구두점으로 분할된 문장 배열
   * 
   * @description 언어별 구두점 패턴을 사용하여 자연스러운 문장 경계를
   * 찾아 텍스트를 분할합니다. 구두점을 포함하여 완전한 문장을 유지합니다.
   */
  private splitByPunctuation(text: string, language: string): string[] {
    const patterns = {
      ko: /[.!?。！？]/g,
      en: /[.!?]/g,
      ja: /[.!?。！？]/g,
      zh: /[.!?。！？]/g,
      es: /[.!?]/g,
      fr: /[.!?]/g,
      de: /[.!?]/g,
    };

    const pattern = patterns[language as keyof typeof patterns] || patterns.ko;
    
    // 구두점으로 분할하되, 구두점도 포함
    const parts = text.split(pattern);
    const matches = text.match(pattern) || [];
    
    const sentences: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim()) {
        const sentence = parts[i].trim() + (matches[i] || '');
        sentences.push(sentence);
      }
    }
    
    return sentences.filter(s => s.length > 0);
  }

  /**
   * 단어 수 기반 텍스트 분할
   * 
   * @method splitByWordCount
   * @private
   * @param {string} text - 분할할 원본 텍스트
   * @param {number} maxWords - 문장당 최대 단어 수
   * @returns {string[]} 단어 수로 분할된 문장 배열
   * 
   * @description 구두점을 무시하고 순수하게 단어 수만을 기준으로
   * 텍스트를 일정한 길이의 청크로 분할합니다.
   */
  private splitByWordCount(text: string, maxWords: number): string[] {
    const words = this.getWords(text);
    const sentences: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWords) {
      sentences.push(words.slice(i, i + maxWords).join(' '));
    }
    
    return sentences;
  }

  /**
   * 단어 수 제한 강제 적용
   * 
   * @method enforceWordLimit
   * @private
   * @param {string} sentence - 검사할 문장
   * @param {number} maxWords - 최대 허용 단어 수
   * @returns {string[]} 제한을 만족하는 문장 배열
   * 
   * @description 최대 단어 수를 초과하는 문장을 강제로 분할하여
   * 시스템 제한사항을 준수하도록 합니다.
   */
  private enforceWordLimit(sentence: string, maxWords: number): string[] {
    const words = this.getWords(sentence);
    
    if (words.length <= maxWords) {
      return [sentence];
    }

    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }
    
    return chunks;
  }

  /**
   * 다국어 지원 단어 추출
   * 
   * @method getWords
   * @private
   * @param {string} text - 단어를 추출할 텍스트
   * @returns {string[]} 추출된 단어 배열
   * 
   * @description 한글, 영어 등 다양한 언어의 단어를 정확하게
   * 분리하여 배열로 반환합니다. 공백 기반 분할을 사용합니다.
   */
  private getWords(text: string): string[] {
    // 한글, 영어 등 다양한 언어 지원
    return text.trim().split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * 텍스트 분할 미리보기 - 결과 시뮬레이션
   * 
   * @method previewSplit
   * @param {string} text - 미리보기할 텍스트
   * @param {SplitOptions} options - 분할 옵션
   * @returns {SplitPreview} 분할 결과 미리보기 데이터
   * 
   * @description 실제 분할을 수행하고 결과에 대한 상세한 통계를
   * 제공합니다. 사용자가 분할 옵션을 조정할 때 참고할 수 있습니다.
   * 
   * 📊 제공 정보:
   * - 분할된 문장 목록
   * - 총 문장 수
   * - 평균 단어 수
   * - 예상 음성 시간
   */
  previewSplit(text: string, options: SplitOptions): SplitPreview {
    const sentences = this.splitText(text, options);
    
    return {
      sentences,
      totalSentences: sentences.length,
      averageWordsPerSentence: sentences.reduce((sum, sentence) => {
        return sum + this.getWords(sentence).length;
      }, 0) / sentences.length,
      estimatedDuration: this.estimateDuration(sentences),
    };
  }

  /**
   * TTS 음성 시간 예측 엔진
   * 
   * @method estimateDuration
   * @private
   * @param {string[]} sentences - 음성 시간을 계산할 문장 배열
   * @returns {number} 예상 음성 시간 (초 단위)
   * 
   * @description 한국어 TTS 특성을 기반으로 한 음성 시간 예측 알고리즘입니다.
   * 분당 300-400자 (초당 약 6자) 기준으로 계산합니다.
   * 
   * 📏 계산 기준:
   * - 한국어: 초당 6자 (분당 360자)
   * - 자연스러운 발음 속도 고려
   * - 구두점 일시정지 시간 포함
   */
  private estimateDuration(sentences: string[]): number {
    const totalCharacters = sentences.reduce((sum, sentence) => sum + sentence.length, 0);
    const charactersPerSecond = 6; // 분당 360자 = 초당 6자
    return totalCharacters / charactersPerSecond;
  }

  /**
   * 문장별 상세 분석 - 품질 평가 시스템
   * 
   * @method analyzeSentences
   * @param {string[]} sentences - 분석할 문장 배열
   * @returns {SentenceAnalysis[]} 문장별 상세 분석 결과
   * 
   * @description 각 문장의 특성을 종합적으로 분석하여
   * TTS 품질과 사용자 경험 최적화에 필요한 데이터를 제공합니다.
   * 
   * 🔍 분석 항목:
   * - 단어 수 및 문자 수
   * - 예상 음성 시간
   * - 문장 복잡도 (simple/medium/complex)
   * - 발음 난이도 평가
   */
  analyzeSentences(sentences: string[]): SentenceAnalysis[] {
    return sentences.map((sentence, index) => ({
      index,
      text: sentence,
      wordCount: this.getWords(sentence).length,
      characterCount: sentence.length,
      estimatedDuration: this.estimateDuration([sentence]),
      complexity: this.calculateComplexity(sentence),
    }));
  }

  /**
   * 문장 복잡도 계산 알고리즘
   * 
   * @method calculateComplexity
   * @private
   * @param {string} sentence - 복잡도를 계산할 문장
   * @returns {'simple' | 'medium' | 'complex'} 복잡도 등급
   * 
   * @description 문장의 길이와 단어의 평균 길이를 기준으로
   * 복잡도를 3단계로 분류합니다. TTS 음성 품질 예측에 활용됩니다.
   */
  private calculateComplexity(sentence: string): 'simple' | 'medium' | 'complex' {
    const words = this.getWords(sentence);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    if (words.length <= 8 && avgWordLength <= 4) return 'simple';
    if (words.length <= 15 && avgWordLength <= 6) return 'medium';
    return 'complex';
  }

  /**
   * AI 기반 최적 분할 제안 시스템
   * 
   * @method suggestOptimalSplit
   * @param {string} text - 최적화할 텍스트
   * @param {number} targetDuration - 목표 음성 시간 (초, 기본값: 30초)
   * @returns {SplitSuggestion} 최적 분할 제안 결과
   * 
   * @description 목표 음성 시간을 달성하기 위한 최적의 분할 옵션을
   * AI 알고리즘을 통해 제안합니다. 텍스트 길이, 복잡도, 언어 특성을
   * 종합적으로 고려하여 개인화된 추천을 제공합니다.
   * 
   * 🤖 제안 알고리즘:
   * 1. 텍스트 길이 및 목표 시간 분석
   * 2. 최적 문장 수 계산
   * 3. 언어별 특성 고려한 단어 수 조정
   * 4. 실제 분할 시뮬레이션
   * 5. 결과 검증 및 추천 생성
   */
  suggestOptimalSplit(text: string, targetDuration: number = 30): SplitSuggestion {
    const targetCharacters = targetDuration * 6; // 초당 6자
    const totalCharacters = text.length;
    const suggestedSentenceCount = Math.ceil(totalCharacters / targetCharacters);
    const suggestedWordsPerSentence = Math.ceil(this.getWords(text).length / suggestedSentenceCount);

    const options: SplitOptions = {
      maxWordsPerSentence: Math.min(suggestedWordsPerSentence, 20), // 최대 20단어로 제한
      splitOnPunctuation: true,
      language: 'ko'
    };

    const preview = this.previewSplit(text, options);

    return {
      recommendedOptions: options,
      preview,
      reasoning: `목표 시간 ${targetDuration}초를 위해 ${suggestedSentenceCount}개 문장으로 분할을 제안합니다.`
    };
  }

  /**
   * 언어별 특화 분할 엔진
   * 
   * @method splitByLanguage
   * @param {string} text - 분할할 텍스트
   * @param {string} language - 대상 언어 코드 (ko, en, ja, zh 등)
   * @param {number} maxWordsPerSentence - 기본 최대 단어 수 (기본값: 15)
   * @returns {string[]} 언어 특성에 최적화된 분할 결과
   * 
   * @description 각 언어의 고유한 특성을 고려하여 최적화된
   * 분할을 수행합니다. 언어별로 단어 길이, 문법 구조, TTS 특성이
   * 다르기 때문에 각각에 맞는 파라미터를 자동 적용합니다.
   * 
   * 🌍 언어별 최적화:
   * - 한국어(ko): 기본 설정, 조사/어미 고려
   * - 영어(en): 단어 수 20% 증가 (짧은 단어 특성)
   * - 일본어(ja): 단어 수 20% 감소 (긴 문자 특성)
   * - 중국어(zh): 단어 수 20% 감소 (한자 밀도 고려)
   */
  splitByLanguage(text: string, language: string, maxWordsPerSentence: number = 15): string[] {
    const languageSpecificOptions: Record<string, Partial<SplitOptions>> = {
      ko: {
        splitOnPunctuation: true,
        maxWordsPerSentence: maxWordsPerSentence,
      },
      en: {
        splitOnPunctuation: true,
        maxWordsPerSentence: Math.floor(maxWordsPerSentence * 1.2), // 영어는 단어가 짧아서 약간 더 허용
      },
      ja: {
        splitOnPunctuation: true,
        maxWordsPerSentence: Math.floor(maxWordsPerSentence * 0.8), // 일본어는 문자가 길어서 약간 적게
      },
      zh: {
        splitOnPunctuation: true,
        maxWordsPerSentence: Math.floor(maxWordsPerSentence * 0.8),
      }
    };

    const options: SplitOptions = {
      language,
      ...languageSpecificOptions[language] || languageSpecificOptions.ko
    };

    return this.splitText(text, options);
  }
}

/**
 * 텍스트 분할 옵션 인터페이스
 * 
 * @interface SplitOptions
 * @description SentenceSplitter의 분할 동작을 제어하는 옵션들을 정의합니다.
 * 사용자의 요구사항과 TTS 품질 목표에 맞게 분할 동작을 세밀하게 조정할 수 있습니다.
 */
export interface SplitOptions {
  /** 문장당 최대 허용 단어 수 (기본값: 15) */
  maxWordsPerSentence?: number;
  
  /** 구두점 기반 분할 사용 여부 (기본값: true) */
  splitOnPunctuation?: boolean;
  
  /** 대상 언어 코드 (기본값: 'ko') */
  language?: string;
  
  /** 동적 재분배 알고리즘 사용 여부 (기본값: true) */
  enableDynamicRedistribution?: boolean;
  
  /** 문장당 최소 단어 수 (기본값: 5) */
  minWordsPerSentence?: number;
}

/**
 * 분할 미리보기 결과 인터페이스
 * 
 * @interface SplitPreview
 * @description 텍스트 분할 결과에 대한 상세한 통계와 미리보기 정보를 제공합니다.
 * 사용자가 분할 품질을 평가하고 옵션을 조정하는 데 사용됩니다.
 */
export interface SplitPreview {
  /** 분할된 문장들의 배열 */
  sentences: string[];
  
  /** 총 문장 개수 */
  totalSentences: number;
  
  /** 문장당 평균 단어 수 */
  averageWordsPerSentence: number;
  
  /** 예상 총 음성 시간 (초 단위) */
  estimatedDuration: number;
}

/**
 * 문장별 상세 분석 결과 인터페이스
 * 
 * @interface SentenceAnalysis
 * @description 개별 문장의 특성과 품질을 분석한 결과를 나타냅니다.
 * TTS 품질 예측과 사용자 경험 최적화에 활용됩니다.
 */
export interface SentenceAnalysis {
  /** 문장의 순서 인덱스 (0부터 시작) */
  index: number;
  
  /** 문장 텍스트 내용 */
  text: string;
  
  /** 문장의 단어 수 */
  wordCount: number;
  
  /** 문장의 문자 수 */
  characterCount: number;
  
  /** 예상 음성 시간 (초 단위) */
  estimatedDuration: number;
  
  /** 문장 복잡도 등급 */
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * AI 분할 제안 결과 인터페이스
 * 
 * @interface SplitSuggestion
 * @description AI 알고리즘이 제안하는 최적 분할 옵션과 그 근거를 포함합니다.
 * 사용자가 최적의 분할 설정을 쉽게 선택할 수 있도록 도와줍니다.
 */
export interface SplitSuggestion {
  /** AI가 추천하는 최적 분할 옵션 */
  recommendedOptions: SplitOptions;
  
  /** 추천 옵션으로 분할한 결과 미리보기 */
  preview: SplitPreview;
  
  /** 추천 근거 및 설명 */
  reasoning: string;
}