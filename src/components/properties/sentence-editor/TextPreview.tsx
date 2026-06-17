import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextPreviewProps } from './types';
import { DEFAULT_FONT_SIZE, PREVIEW_SCALE, MIN_PREVIEW_FONT_SIZE } from '../../../constants/textDefaults';

export const TextPreview: React.FC<TextPreviewProps> = ({ clip, previewMode }) => {
  // 렌더링된 텍스트 미리보기 생성
  const renderPreviewText = () => {
    const text = clip.text || '';

    if (!text || !previewMode) {
      return <span>{text || '텍스트를 입력하세요'}</span>;
    }

    const segments = clip.textSegments || [];
    if (segments.length === 0) {
      return <span>{text}</span>;
    }

    try {
      // 유효한 세그먼트만 필터링 및 정렬
      const validSegments = segments
        .filter(segment => {
          return segment.startIndex < text.length &&
            segment.endIndex <= text.length &&
            segment.startIndex < segment.endIndex;
        })
        .sort((a, b) => a.startIndex - b.startIndex);

      if (validSegments.length === 0) {
        return <span>{text}</span>;
      }

      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let keyIndex = 0;

      validSegments.forEach((segment, index) => {
        // 중복 세그먼트 건너뛰기
        if (segment.startIndex < lastIndex) {
          return;
        }

        // 세그먼트 이전 부분 추가 (기본 스타일)
        if (segment.startIndex > lastIndex) {
          const beforeText = text.slice(lastIndex, segment.startIndex);
          if (beforeText) {
            elements.push(
              <span key={`before-${keyIndex++}`}>
                {beforeText}
              </span>
            );
          }
        }

        // 실제 텍스트에서 세그먼트 부분 가져오기
        const actualSegmentText = text.slice(segment.startIndex, segment.endIndex);

        // 세그먼트 부분 (개별 스타일 적용)
        elements.push(
          <span
            key={`segment-${segment.id}`}
            style={{
              fontSize: segment.style.fontSize ? `${Math.max(MIN_PREVIEW_FONT_SIZE, segment.style.fontSize * PREVIEW_SCALE)}px` : `${Math.max(MIN_PREVIEW_FONT_SIZE, (clip.fontSize || DEFAULT_FONT_SIZE) * PREVIEW_SCALE)}px`,
              fontFamily: segment.style.fontFamily,
              fontWeight: segment.style.fontWeight,
              fontStyle: segment.style.fontStyle,
              color: segment.style.color,
              backgroundColor: (segment.style.backgroundColor && segment.style.backgroundColor !== 'transparent') ? segment.style.backgroundColor : undefined,
              textDecoration: segment.style.textDecoration,
              textTransform: segment.style.textTransform as any,
              textShadow: (segment.style.textShadow && segment.style.textShadow !== 'none') ? segment.style.textShadow : undefined,
              borderRadius: (segment.style.borderRadius && segment.style.borderRadius !== '0px' && segment.style.borderRadius !== 'undefined') ? segment.style.borderRadius : undefined,
              boxShadow: (segment.style.boxShadow && segment.style.boxShadow !== 'none' && segment.style.boxShadow !== 'undefined') ? segment.style.boxShadow : undefined,
              padding: (segment.style.backgroundColor && segment.style.backgroundColor !== 'transparent')
                ? `${segment.style.paddingTop || 2}px ${segment.style.paddingRight || 4}px ${segment.style.paddingBottom || 2}px ${segment.style.paddingLeft || 4}px`
                : undefined,
              whiteSpace: 'pre-wrap' as const,
              wordWrap: 'break-word' as const,
              display: 'inline-block'
            }}
          >
            {actualSegmentText}
          </span>
        );

        lastIndex = segment.endIndex;
      });

      // 마지막 세그먼트 이후 부분 추가 (기본 스타일)
      if (lastIndex < text.length) {
        const afterText = text.slice(lastIndex);
        if (afterText) {
          elements.push(
            <span key={`after-${keyIndex++}`}>
              {afterText}
            </span>
          );
        }
      }

      return <>{elements}</>;
    } catch (error) {
      console.error('미리보기 렌더링 오류:', error);
      return <span style={{ color: '#ff6b6b' }}>미리보기 오류: {text}</span>;
    }
  };

  if (!previewMode) {
    return null;
  }

  return (
    <div className="p-3 bg-gray-900 border border-gray-600 rounded">
      <h4 className="text-sm text-gray-300 mb-2 flex items-center space-x-2">
        <Eye size={14} />
        <span>스타일 미리보기</span>
      </h4>
      <div
        className="text-white"
        style={{
          fontFamily: clip.fontFamily,
          fontSize: `${Math.max(MIN_PREVIEW_FONT_SIZE, (clip.fontSize || DEFAULT_FONT_SIZE) * PREVIEW_SCALE)}px`,
          fontWeight: clip.fontWeight,
          color: clip.color,
          textAlign: clip.textAlign as any,
          lineHeight: clip.lineHeight,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          backgroundColor: (clip.backgroundColor && clip.backgroundColor !== 'transparent') ? clip.backgroundColor : 'transparent',
          padding: (clip.backgroundColor && clip.backgroundColor !== 'transparent')
            ? `${clip.paddingTop || 8}px ${clip.paddingRight || 12}px ${clip.paddingBottom || 8}px ${clip.paddingLeft || 12}px`
            : '0',
          borderRadius: (clip.borderRadius && clip.borderRadius > 0) ? `${clip.borderRadius}${clip.borderRadiusUnit || 'px'}` : '0',
          textShadow: (clip.textShadow && clip.textShadow !== 'none') ? clip.textShadow : 'none',
          boxShadow: (clip.backgroundShadow && clip.backgroundShadow !== 'none') ? clip.backgroundShadow : 'none'
        }}
      >
        {renderPreviewText()}
      </div>
    </div>
  );
};

export default TextPreview;
