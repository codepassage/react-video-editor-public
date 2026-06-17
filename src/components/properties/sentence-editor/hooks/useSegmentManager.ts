import { useCallback } from 'react';
import { SentenceClip } from '../../../../types';
import { DEFAULT_FONT_SIZE } from '../../../../constants/textDefaults';

export const useSegmentManager = () => {
  // 세그먼트 ID 생성
  const generateSegmentId = useCallback(() => {
    return `segment-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }, []);

  // 텍스트 변경에 따른 세그먼트 인덱스 조정
  const adjustSegmentsForTextChange = useCallback((segments: SentenceClip['textSegments'], newText: string) => {
    if (!segments || !newText) return [];

    return segments
      .filter(segment => {
        // 새 텍스트 길이를 초과하는 세그먼트는 제거
        return segment.startIndex < newText.length;
      })
      .map(segment => {
        // 불변성을 유지하면서 새로운 세그먼트 객체 생성
        const adjustedEndIndex = Math.min(segment.endIndex, newText.length);
        const adjustedText = newText.slice(segment.startIndex, adjustedEndIndex);

        // 유효하지 않은 세그먼트는 필터링됨
        if (segment.startIndex >= adjustedEndIndex || !adjustedText) {
          return null;
        }

        return {
          ...segment,
          endIndex: adjustedEndIndex,
          text: adjustedText // 실제 텍스트와 동기화
        };
      })
      .filter(Boolean) as NonNullable<SentenceClip['textSegments'][0]>[];
  }, []);

  // 새 세그먼트 생성 (기본 스타일 포함)
  const createSegment = useCallback((
    text: string,
    startIndex: number,
    endIndex: number,
    baseClip: SentenceClip
  ) => {
    return {
      id: generateSegmentId(),
      text,
      startIndex,
      endIndex,
      priority: 1,
      layer: 1,
      style: {
        fontSize: baseClip.fontSize || DEFAULT_FONT_SIZE,
        fontFamily: baseClip.fontFamily || 'Arial',
        color: '#ff6b35', // 기본 강조 색상
        fontWeight: 'bold',
        fontStyle: 'normal'
      }
    };
  }, [generateSegmentId]);

  // 세그먼트 스타일 업데이트 유틸리티
  const updateSegmentStyleSafe = useCallback((
    segments: SentenceClip['textSegments'],
    segmentId: string,
    styleUpdates: Partial<SentenceClip['textSegments'][0]['style']>
  ) => {
    if (!segments) return [];

    return segments.map(segment => {
      if (segment.id === segmentId) {
        // 숫자 값 검증
        const validatedUpdates = { ...styleUpdates };
        if (validatedUpdates.fontSize !== undefined) {
          const fontSize = typeof validatedUpdates.fontSize === 'string'
            ? parseFloat(validatedUpdates.fontSize)
            : Number(validatedUpdates.fontSize);
          validatedUpdates.fontSize = isNaN(fontSize) ? segment.style.fontSize : Math.max(8, Math.min(300, fontSize));
        }

        const newStyle = {
          ...segment.style,
          ...validatedUpdates
        };

        return {
          ...segment,
          style: newStyle
        };
      }
      return segment;
    });
  }, []);

  // 세그먼트 삭제
  const removeSegment = useCallback((
    segments: SentenceClip['textSegments'],
    segmentId: string
  ) => {
    if (!segments) return [];
    return segments.filter(s => s.id !== segmentId);
  }, []);

  // 세그먼트 유효성 검사
  const validateSegments = useCallback((
    segments: SentenceClip['textSegments'],
    textLength: number
  ) => {
    if (!segments) return [];

    return segments.filter(segment => {
      return segment.startIndex >= 0 &&
        segment.endIndex <= textLength &&
        segment.startIndex < segment.endIndex;
    });
  }, []);

  return {
    generateSegmentId,
    adjustSegmentsForTextChange,
    createSegment,
    updateSegmentStyleSafe,
    removeSegment,
    validateSegments
  };
};
