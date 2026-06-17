import { useCallback, useRef } from 'react';
import { DEFAULT_FONT_SIZE } from '../../../../constants/textDefaults';
import { TextBounds } from '../types';

export const useTextMetrics = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 캔버스를 초기화하거나 가져오기
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current;
  }, []);

  // 텍스트 메트릭 계산
  const calculateTextMetrics = useCallback((text: string, style: any): TextBounds => {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx || !text) return { width: 0, height: 0, lines: [] };

    // 폰트 설정
    const fontSize = style.fontSize || DEFAULT_FONT_SIZE;
    const fontWeight = style.fontWeight || 'normal';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    const lineHeight = style.lineHeight || 1.2;
    const letterSpacing = style.letterSpacing || 0;
    const maxWidth = style.maxWidth || style.width || 400;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // 문자 간격 설정
    if (letterSpacing !== 0) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }

    const lines = text.split('\n');
    const wrappedLines: string[] = [];

    // 자동 줄바꿈 처리
    if (style.wordWrap && maxWidth) {
      lines.forEach(line => {
        if (ctx.measureText(line).width <= maxWidth) {
          wrappedLines.push(line);
        } else {
          // 단어 단위로 줄바꿈
          const words = line.split(' ');
          let currentLine = '';

          words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) {
                wrappedLines.push(currentLine);
              }
              currentLine = word;
            }
          });

          if (currentLine) {
            wrappedLines.push(currentLine);
          }
        }
      });
    } else {
      wrappedLines.push(...lines);
    }

    // 텍스트 크기 계산
    let maxLineWidth = 0;
    wrappedLines.forEach(line => {
      const lineWidth = ctx.measureText(line).width;
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
    });

    const totalHeight = wrappedLines.length * fontSize * lineHeight;

    return {
      width: maxLineWidth,
      height: totalHeight,
      lines: wrappedLines
    };
  }, [getCanvas]);

  return { calculateTextMetrics };
};
