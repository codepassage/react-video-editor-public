/**
 * Timing utility functions for sentence and whisper timing calculations
 * Extracted from longSentenceEngine.ts for better modularity
 */

import { TextUtils } from '../modules/text-utils';

export class TimingUtils {
  /**
   * 문장들에 대한 예상 타이밍 생성 (비례 분배)
   */
  static estimateTimingsForSentences(sentences: string[], totalDuration: number): any[] {
    if (!sentences || sentences.length === 0) {
      return [];
    }

    // 문장별 길이 비율로 시간 분배
    const sentenceLengths = sentences.map(s => s.length);
    const totalLength = sentenceLengths.reduce((sum, len) => sum + len, 0);

    let currentTime = 0;
    const results: any[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const lengthRatio = sentenceLengths[i] / totalLength;
      const duration = totalDuration * lengthRatio;

      results.push({
        text: sentence,
        start: currentTime,
        end: currentTime + duration,
        duration,
        wordTimings: [],
        matchMethod: 'estimated',
        confidence: 'low'
      });

      currentTime += duration;
    }

    return results;
  }

  /**
   * 단일 문장의 예상 타이밍 계산
   */
  static estimateSentenceTiming(
    sentence: string,
    index: number,
    allSentences: string[],
    totalDuration: number
  ): any {
    const sentenceLengths = allSentences.map(s => s.length);
    const totalLength = sentenceLengths.reduce((sum, len) => sum + len, 0);
    const lengthRatio = sentence.length / totalLength;
    const duration = totalDuration * lengthRatio;

    // 시작 시간 계산 (이전 문장들의 시간 누적)
    let startTime = 0;
    for (let i = 0; i < index; i++) {
      const prevLengthRatio = sentenceLengths[i] / totalLength;
      startTime += totalDuration * prevLengthRatio;
    }

    return {
      text: sentence,
      start: startTime,
      end: startTime + duration,
      duration,
      wordTimings: []
    };
  }

  /**
   * Whisper 세그먼트가 부족한 경우 처리
   */
  static handleSegmentShortage(
    sentences: string[],
    whisperTimings: any[],
    totalDuration: number
  ): any[] {
    if (whisperTimings.length === 0) {
      return TimingUtils.estimateTimingsForSentences(sentences, totalDuration);
    }

    const results: any[] = [];
    const segmentPerSentence = sentences.length / whisperTimings.length;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const segmentIndex = Math.floor(i / segmentPerSentence);
      const whisperSegment = whisperTimings[Math.min(segmentIndex, whisperTimings.length - 1)];

      if (whisperSegment) {
        // 세그먼트 내에서 위치 계산
        const positionInSegment = (i % segmentPerSentence) / segmentPerSentence;
        const segmentDuration = whisperSegment.end - whisperSegment.start;
        const sentenceDuration = segmentDuration / Math.ceil(segmentPerSentence);

        const start = whisperSegment.start + (positionInSegment * segmentDuration);
        const end = Math.min(start + sentenceDuration, whisperSegment.end);

        results.push({
          text: sentence,
          start,
          end,
          duration: end - start,
          wordTimings: whisperSegment.words || [],
          matchMethod: 'interpolated',
          confidence: 'medium'
        });
      } else {
        // 폴백: 예상 타이밍
        const estimated = TimingUtils.estimateSentenceTiming(sentence, i, sentences, totalDuration);
        results.push({
          ...estimated,
          matchMethod: 'estimated',
          confidence: 'low'
        });
      }
    }

    return results;
  }

  /**
   * Word-level 타이밍을 활용한 경계 조정
   */
  static adjustTimingBoundariesWithWords(
    firstSegment: any,
    lastSegment: any,
    targetSentence: string,
    matchedSegments: any[]
  ): { adjustedStart: number; adjustedEnd: number } {
    let adjustedStart = firstSegment.start;
    let adjustedEnd = lastSegment.end;

    // Word-level 조정 (첫 번째 세그먼트)
    if (firstSegment.words && firstSegment.words.length > 0) {
      const firstWord = firstSegment.words[0];
      if (firstWord && firstWord.start !== undefined) {
        adjustedStart = Math.max(firstSegment.start, firstWord.start);
      }
    }

    // Word-level 조정 (마지막 세그먼트)
    if (lastSegment.words && lastSegment.words.length > 0) {
      const lastWord = lastSegment.words[lastSegment.words.length - 1];
      if (lastWord && lastWord.end !== undefined) {
        adjustedEnd = Math.min(lastSegment.end, lastWord.end);
      }
    }

    // 최소 길이 보장 (0.5초)
    if (adjustedEnd - adjustedStart < 0.5) {
      const midPoint = (adjustedStart + adjustedEnd) / 2;
      adjustedStart = midPoint - 0.25;
      adjustedEnd = midPoint + 0.25;
    }

    return { adjustedStart, adjustedEnd };
  }

  /**
   * 타이밍 검증 및 보정
   */
  static validateAndAdjustTimings(results: any[], totalDuration: number): any[] {
    console.log('🔧 타이밍 검증 및 보정 시작');

    if (!results || results.length === 0) {
      return results;
    }

    // 1. 겹침 제거
    for (let i = 1; i < results.length; i++) {
      if (results[i].start < results[i - 1].end) {
        const overlap = results[i - 1].end - results[i].start;
        results[i - 1].end -= overlap / 2;
        results[i].start += overlap / 2;
        results[i - 1].duration = results[i - 1].end - results[i - 1].start;
        results[i].duration = results[i].end - results[i].start;
      }
    }

    // 2. 최소/최대 길이 보정
    results.forEach((result, index) => {
      if (result.duration < 0.3) {
        result.duration = 0.3;
        result.end = result.start + 0.3;
      }
      if (result.duration > 15) {
        result.duration = 15;
        result.end = result.start + 15;
      }
    });

    // 3. 총 길이 맞춤
    const lastResult = results[results.length - 1];
    if (lastResult && lastResult.end !== totalDuration) {
      const adjustment = totalDuration - lastResult.end;
      lastResult.end = totalDuration;
      lastResult.duration += adjustment;
      console.log(`🔧 총 길이 맞춤: 마지막 문장에 ${adjustment.toFixed(2)}초 조정`);
    }

    console.log('✅ 타이밍 검증 및 보정 완료');
    return results;
  }
}