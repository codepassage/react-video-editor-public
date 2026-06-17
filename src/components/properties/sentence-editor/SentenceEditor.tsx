import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Scissors, Clipboard, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';
import { SentenceEditorProps, TextSelection } from './types';
import { useDebounceCallback } from '../../../hooks/useDebounceCallback';
import { useTextMetrics } from './hooks/useTextMetrics';
import { useSegmentManager } from './hooks/useSegmentManager';
import { SegmentManager } from './SegmentManager';
import { TextPreview } from './TextPreview';
import { BasicTextControls } from './BasicTextControls';
import { DEFAULT_FONT_SIZE } from '../../../constants/textDefaults';

export const SentenceEditor: React.FC<SentenceEditorProps> = ({ clip, onUpdate }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // UI 상태 관리
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAutoSize, setIsAutoSize] = useState(clip.autoSize || false);
  const [previewMode, setPreviewMode] = useState(true);

  // 텍스트 선택 상태 관리
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  // 커스텀 훅 사용
  const { calculateTextMetrics } = useTextMetrics();
  const {
    generateSegmentId,
    adjustSegmentsForTextChange,
    createSegment,
    updateSegmentStyleSafe,
    removeSegment
  } = useSegmentManager();

  // 디바운싱된 업데이트 함수들
  const debouncedUpdate = useDebounceCallback((updates: any) => {
    onUpdate(clip.id, updates);
  }, 100);

  const immediateUpdate = useCallback((updates: any) => {
    onUpdate(clip.id, updates);
  }, [clip.id, onUpdate]);

  const debouncedTextUpdate = useDebounceCallback((text: string) => {
    // 텍스트 변경 시 세그먼트 인덱스 조정
    const adjustedSegments = adjustSegmentsForTextChange(clip.textSegments || [], text);
    immediateUpdate({
      text,
      textSegments: adjustedSegments,
      segmentVersion: (clip.segmentVersion || 1) + 1
    });
  }, 150);

  // 자동 크기 조절
  const autoResizeClip = useCallback(() => {
    if (!isAutoSize || !clip.text) return;

    const metrics = calculateTextMetrics(clip.text, {
      fontSize: clip.fontSize,
      fontWeight: clip.fontWeight,
      fontFamily: clip.fontFamily,
      lineHeight: clip.lineHeight,
      letterSpacing: clip.letterSpacing,
      wordWrap: clip.wordWrap,
      width: clip.width
    });

    const padding = 32; // 패딩
    const newWidth = Math.max(metrics.width + padding, 100);
    const newHeight = Math.max(metrics.height + padding, 60);

    // 크기 변화가 있을 때만 업데이트 (무한 루프 방지)
    const currentWidth = clip.width;
    const currentHeight = clip.height;
    const widthDiff = Math.abs(newWidth - currentWidth);
    const heightDiff = Math.abs(newHeight - currentHeight);

    // 1px 이상 차이가 날 때만 업데이트
    if (widthDiff > 1 || heightDiff > 1) {
      debouncedUpdate({
        width: newWidth,
        height: newHeight
      });
    }
  }, [isAutoSize, clip.text, clip.fontSize, clip.fontFamily, clip.lineHeight, clip.letterSpacing, clip.wordWrap, clip.width, clip.height, calculateTextMetrics, debouncedUpdate]);

  // 텍스트 변경 시 자동 크기 조절
  useEffect(() => {
    if (isAutoSize) {
      const timeoutId = setTimeout(() => {
        autoResizeClip();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isAutoSize, clip.text, clip.fontSize, clip.fontFamily, clip.lineHeight, clip.letterSpacing]);

  // 텍스트 선택 처리
  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start !== end && clip.text) {
      const selectedText = clip.text.slice(start, end);
      setSelectedText({ start, end, text: selectedText });
    } else {
      setSelectedText(null);
    }
  }, [clip.text]);

  // 새 세그먼트 생성
  const handleCreateSegment = useCallback(() => {
    if (!selectedText || !clip.text) return;

    const newSegment = createSegment(
      selectedText.text,
      selectedText.start,
      selectedText.end,
      clip
    );

    const updatedSegments = [...(clip.textSegments || []), newSegment];

    immediateUpdate({
      textSegments: updatedSegments,
      totalSegments: updatedSegments.length,
      lastEditedSegmentId: newSegment.id,
      segmentVersion: (clip.segmentVersion || 1) + 1
    });

    setSelectedText(null);
    setEditingSegmentId(newSegment.id);
  }, [selectedText, clip.text, clip.textSegments, clip.segmentVersion, createSegment, immediateUpdate]);

  // 세그먼트 삭제
  const handleDeleteSegment = useCallback((segmentId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const updatedSegments = removeSegment(clip.textSegments || [], segmentId);

    immediateUpdate({
      textSegments: updatedSegments,
      totalSegments: updatedSegments.length,
      segmentVersion: (clip.segmentVersion || 1) + 1
    });

    if (editingSegmentId === segmentId) {
      setEditingSegmentId(null);
    }
  }, [clip.textSegments, clip.segmentVersion, editingSegmentId, removeSegment, immediateUpdate]);

  // 세그먼트 스타일 업데이트
  const handleUpdateSegmentStyle = useCallback((segmentId: string, styleUpdates: any) => {
    try {
      const updatedSegments = updateSegmentStyleSafe(
        clip.textSegments || [],
        segmentId,
        styleUpdates
      );

      immediateUpdate({
        textSegments: updatedSegments,
        lastEditedSegmentId: segmentId,
        segmentVersion: (clip.segmentVersion || 1) + 1
      });
    } catch (error) {
      console.error('세그먼트 스타일 업데이트 오류:', error);
    }
  }, [clip.textSegments, clip.segmentVersion, updateSegmentStyleSafe, immediateUpdate]);

  // 텍스트 변경 핸들러
  const handleTextChange = (text: string) => {
    debouncedTextUpdate(text);
  };

  // 자동 크기 조절 토글
  const toggleAutoSize = () => {
    const newAutoSize = !isAutoSize;
    setIsAutoSize(newAutoSize);
    debouncedUpdate({ autoSize: newAutoSize });
  };

  // 기본 스타일 변경 핸들러
  const handleStyleChange = (property: string, value: any) => {
    try {
      let processedValue = value;

      // 숫자 값 처리
      if (property === 'fontSize') {
        processedValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(processedValue)) return;
        processedValue = Math.max(8, Math.min(300, processedValue));
      }

      // 즉시 반영이 필요한 속성들
      const immediateUpdateProperties = [
        'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'textAlign', 'color',
        'lineHeight', 'letterSpacing', 'textDecoration', 'textTransform',
        'backgroundColor', 'textShadow', 'backgroundShadow',
        'borderRadius', 'borderRadiusUnit',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        // 위치 관련 속성들 추가 (PositionTransformControls에서 사용)
        'x', 'y', 'width', 'height', 'rotation', 'opacity'
      ];

      if (immediateUpdateProperties.includes(property)) {
        immediateUpdate({ [property]: processedValue });
      } else {
        debouncedUpdate({ [property]: processedValue });
      }
    } catch (error) {
      console.error('스타일 변경 오류:', error);
    }
  };

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xl">
            <span>📄</span>
            <span className="text-white font-medium">Sentence 편집기</span>
          </div>
          {clip.textSegments && clip.textSegments.length > 0 && (
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
              {clip.textSegments.length} 세그먼트
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAutoSize}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              isAutoSize
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={isAutoSize ? '자동 크기 조절 ON' : '자동 크기 조절 OFF'}
          >
            {isAutoSize ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              previewMode
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={previewMode ? '미리보기 ON' : '미리보기 OFF'}
          >
            {previewMode ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAdvanced ? '간단히' : '고급 모드'}
          </button>
        </div>
      </div>

      {/* 실시간 프리뷰 정보 */}
      {isAutoSize && (
        <div className="bg-gray-700 p-2 rounded text-xs text-gray-300">
          <div className="flex justify-between">
            <span>자동 크기 조절 활성화</span>
            <span>현재 크기: {clip.width} × {clip.height}px</span>
          </div>
        </div>
      )}

      {/* 텍스트 입력 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-300">텍스트 내용</label>
          <div className="flex space-x-1">
            <button className="p-1 text-gray-400 hover:text-white transition-colors" title="복사">
              <Copy size={12} />
            </button>
            <button className="p-1 text-gray-400 hover:text-white transition-colors" title="잘라내기">
              <Scissors size={12} />
            </button>
            <button className="p-1 text-gray-400 hover:text-white transition-colors" title="붙여넣기">
              <Clipboard size={12} />
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={clip.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            onSelect={handleTextSelection}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="문장을 입력하고 특정 부분을 선택하여 스타일링하세요..."
            className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none font-mono"
            style={{
              fontFamily: clip.fontFamily,
              fontSize: `${Math.min((clip.fontSize || 28) / 2, 16)}px`,
              fontWeight: clip.fontWeight,
              color: clip.color,
              textAlign: clip.textAlign as any,
              lineHeight: clip.lineHeight,
              minHeight: '120px',
              maxHeight: '200px'
            }}
            rows={5}
          />

          {/* 문자 수 카운터 */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
            {(clip.text || '').length} 문자
          </div>
        </div>
      </div>

      {/* 텍스트 미리보기 */}
      <TextPreview clip={clip} previewMode={previewMode} />

      {/* 세그먼트 관리자 */}
      <SegmentManager
        clip={clip}
        selectedText={selectedText}
        editingSegmentId={editingSegmentId}
        onUpdate={onUpdate}
        onCreateSegment={handleCreateSegment}
        onEditSegment={setEditingSegmentId}
        onDeleteSegment={handleDeleteSegment}
        onUpdateSegmentStyle={handleUpdateSegmentStyle}
      />

      {/* 기본 텍스트 스타일 컨트롤 */}
      <BasicTextControls
        clip={clip}
        onStyleChange={handleStyleChange}
      />
    </div>
  );
};

export default SentenceEditor;
