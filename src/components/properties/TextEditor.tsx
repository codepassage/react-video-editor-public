import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Copy, Scissors, Clipboard,
  Maximize2, Minimize2,
  ChevronDown, ChevronUp,
  Layers, Zap, Droplets, Mountain, Image,
  Play, Plus, Minus
} from 'lucide-react';
import { 
  TimelineClip, 
  TextShadowEffect, 
  TextGlowEffect, 
  TextBevelEffect, 
  TextExtrudeEffect, 
  TextTextureEffect, 
  TextStrokeEffect, 
  TextAnimationEffect 
} from '../../types';
import { GradientTextEditor } from './text-effects/GradientTextEditor';
import { useDebounceCallback } from '../../hooks/useDebounceCallback';

interface TextEditorProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: Partial<TimelineClip>) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ clip, onUpdate }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTypography, setShowTypography] = useState(false);
  
  // 전문 효과 섹션 상태
  const [showShadows, setShowShadows] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showBevel, setShowBevel] = useState(false);
  const [showTexture, setShowTexture] = useState(false);
  const [showStrokes, setShowStrokes] = useState(false);
  const [showTextAnimation, setShowTextAnimation] = useState(false);
  const [showExtrudeEffect, setShowExtrudeEffect] = useState(false);
  const [isAutoSize, setIsAutoSize] = useState(clip.autoSize || false);
  const [textBounds, setTextBounds] = useState({ width: 0, height: 0 });
  
  // ⏱️ 디바운싱된 업데이트 함수들
  const debouncedUpdate = useDebounceCallback((updates: Partial<TimelineClip>) => {
    onUpdate(clip.id, updates);
  }, 100);
  
  const debouncedTextUpdate = useDebounceCallback((text: string) => {
    onUpdate(clip.id, { text });
  }, 150); // 텍스트는 조금 더 길게
  
  // 텍스트 메트릭 계산 - 의존성 최소화
  const calculateTextMetrics = useCallback((text: string, style: any) => {
    if (!canvasRef.current) return { width: 0, height: 0, lines: [] };
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width: 0, height: 0, lines: [] };
    
    // 폰트 설정
    const fontSize = style.fontSize || 32;
    const fontWeight = style.fontWeight || 'normal';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    const lineHeight = style.lineHeight || 1.2;
    const letterSpacing = style.letterSpacing || 0;
    const maxWidth = style.maxWidth || style.width || 400; // clip.width 대신 style.width 사용
    
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
  }, []); // 빈 의존성 배열로 안정성 확보

  // 자동 크기 조절 - 무한 루프 방지
  const autoResizeClip = useCallback(() => {
    if (!isAutoSize || !clip.text) return;
    
    const metrics = calculateTextMetrics(clip.text, {
      fontSize: clip.fontSize,
      fontWeight: clip.fontWeight,
      fontFamily: clip.fontFamily,
      lineHeight: clip.lineHeight,
      letterSpacing: clip.letterSpacing,
      wordWrap: clip.wordWrap,
      width: clip.width // maxWidth 대신 width로 전달
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
      setTextBounds(metrics);
      
      // 디바운싱된 업데이트 사용
      debouncedUpdate({
        width: newWidth,
        height: newHeight
      });
    } else {
      // 크기 변화가 없어도 textBounds는 업데이트
      setTextBounds(metrics);
    }
  }, [isAutoSize, clip.text, clip.fontSize, clip.fontFamily, clip.lineHeight, clip.letterSpacing, clip.wordWrap, clip.width, clip.height, calculateTextMetrics, debouncedUpdate]);

  // 텍스트 변경 시 자동 크기 조절 - 무한 루프 방지
  useEffect(() => {
    if (isAutoSize) {
      // 디바운싱된 자동 리사이즈 호출
      const timeoutId = setTimeout(() => {
        autoResizeClip();
      }, 50); // 짧은 딜레이로 레더링 안정성 확보
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAutoSize, clip.text, clip.fontSize, clip.fontFamily, clip.lineHeight, clip.letterSpacing]); // autoResizeClip 제거

  const handleTextChange = (text: string) => {
    debouncedTextUpdate(text); // 디바운싱된 텍스트 업데이트 사용
  };

  const handleStyleChange = (property: string, value: any) => {
    debouncedUpdate({ [property]: value }); // 디바운싱된 업데이트 사용
  };

  const toggleAutoSize = () => {
    const newAutoSize = !isAutoSize;
    setIsAutoSize(newAutoSize);
    debouncedUpdate({ autoSize: newAutoSize }); // 디바운싱된 업데이트 사용
    
    if (newAutoSize) {
      // 직접 호출하지 말고 useEffect가 처리하도록 함
      // autoResizeClip(); // 제거
    }
  };

  // 고급 폰트 목록
  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    { name: 'Lucida Console', value: 'Lucida Console, monospace' },
    { name: 'Palatino', value: 'Palatino, serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' }
  ];

  const textDecorations = [
    { name: '없음', value: 'none' },
    { name: '밑줄', value: 'underline' },
    { name: '취소선', value: 'line-through' },
    { name: '윗줄', value: 'overline' },
    { name: '밑줄+취소선', value: 'underline line-through' }
  ];

  const textTransforms = [
    { name: '없음', value: 'none' },
    { name: '대문자', value: 'uppercase' },
    { name: '소문자', value: 'lowercase' },
    { name: '첫글자 대문자', value: 'capitalize' }
  ];

  return (
    <div className="space-y-4">
      {/* 숨겨진 캔버스 (텍스트 메트릭 계산용) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 w-full justify-end">
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
            <span>예상 크기: {Math.round(textBounds.width)} × {Math.round(textBounds.height)}px</span>
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
            placeholder="텍스트를 입력하세요..."
            className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none font-mono"
            style={{
              fontFamily: clip.fontFamily,
              fontSize: `${Math.min((clip.fontSize || 32) / 2, 16)}px`,
              fontWeight: clip.fontWeight,
              color: clip.color,
              textAlign: clip.textAlign as any,
              lineHeight: clip.lineHeight,
              minHeight: '100px',
              maxHeight: '200px'
            }}
            rows={4}
          />
          
          {/* 문자 수 카운터 */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
            {(clip.text || '').length} 문자
          </div>
        </div>
      </div>

      {/* 기본 스타일 컨트롤 */}
      <div className="space-y-4">
        {/* 폰트 크기 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">폰트 크기</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="8"
              max="300"
              value={clip.fontSize || 32}
              onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="8"
              max="300"
              value={clip.fontSize || 32}
              onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
              className="w-16 p-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            />
          </div>
        </div>

        {/* 폰트 굵기 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">굵기</label>
          <select
            value={clip.fontWeight || 'normal'}
            onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="100">Thin (100)</option>
            <option value="200">Extra Light (200)</option>
            <option value="300">Light (300)</option>
            <option value="normal">Normal (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi Bold (600)</option>
            <option value="bold">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>
      </div>

      {/* 텍스트 정렬 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">텍스트 정렬</label>
        <div className="flex space-x-1">
          {[
            { align: 'left', icon: AlignLeft },
            { align: 'center', icon: AlignCenter },
            { align: 'right', icon: AlignRight },
            { align: 'justify', icon: AlignJustify }
          ].map(({ align, icon: Icon }) => (
            <button
              key={align}
              onClick={() => handleStyleChange('textAlign', align)}
              className={`p-2 rounded transition-colors ${
                clip.textAlign === align 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={align}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* 색상 설정 */}
      <div className="space-y-4">
        {/* 텍스트 색상 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-200">텍스트 색상</label>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded border border-gray-600 overflow-hidden">
                <input
                  type="color"
                  value={clip.color || '#ffffff'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  className="w-full h-full border-0 cursor-pointer"
                  style={{ background: 'none' }}
                />
              </div>
              <span className="text-sm font-mono text-gray-300 min-w-[70px]">
                {(clip.color || '#ffffff').toUpperCase()}
              </span>
            </div>
          </div>
          <input
            type="text"
            value={clip.color || '#ffffff'}
            onChange={(e) => handleStyleChange('color', e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm font-mono"
            placeholder="#FFFFFF"
          />
        </div>

        {/* 배경 색상 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-200">배경 색상</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`transparent-${clip.id}`}
                checked={!clip.backgroundColor || clip.backgroundColor === 'transparent'}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleStyleChange('backgroundColor', 'transparent');
                  } else {
                    handleStyleChange('backgroundColor', '#000000');
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor={`transparent-${clip.id}`} className="text-sm text-gray-300">
                투명 배경
              </label>
            </div>
          </div>
          
          {/* 투명이 아닐 때만 색상 설정 표시 */}
          {clip.backgroundColor && clip.backgroundColor !== 'transparent' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-end space-x-2 mb-2">
                <div className="w-6 h-6 rounded border border-gray-600 overflow-hidden">
                  <input
                    type="color"
                    value={clip.backgroundColor || '#000000'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="w-full h-full border-0 cursor-pointer"
                    style={{ background: 'none' }}
                  />
                </div>
                <span className="text-sm font-mono text-gray-300 min-w-[70px]">
                  {(clip.backgroundColor || '#000000').toUpperCase()}
                </span>
              </div>
              <input
                type="text"
                value={clip.backgroundColor || '#000000'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          ) : (
            <div className="p-3 bg-gray-700 rounded border border-dashed border-gray-600 text-center">
              <span className="text-xs text-gray-400 italic">
                투명 배경이 적용됩니다
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 고급 옵션들 */}
      {showAdvanced && (
        <div className="space-y-4 border-t border-gray-700 pt-4">
          
          {/* 타이포그래피 섹션 */}
          <div className="border border-gray-600 rounded-lg">
            <button
              onClick={() => setShowTypography(!showTypography)}
              className="w-full p-3 text-left flex items-center justify-between text-white hover:bg-gray-700 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Type size={16} />
                <span>타이포그래피</span>
              </span>
              {showTypography ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showTypography && (
              <div className="p-4 space-y-4 border-t border-gray-600">
                {/* 폰트 패밀리 */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">폰트 패밀리</label>
                  <select
                    value={clip.fontFamily || 'Arial, sans-serif'}
                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {fontFamilies.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 줄 간격 */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">줄 간격</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={clip.lineHeight || 1.2}
                        onChange={(e) => handleStyleChange('lineHeight', Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-12">
                        {(clip.lineHeight || 1.2).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* 글자 간격 */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">글자 간격</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="-5"
                        max="20"
                        step="0.5"
                        value={clip.letterSpacing || 0}
                        onChange={(e) => handleStyleChange('letterSpacing', Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-12">
                        {(clip.letterSpacing || 0).toFixed(1)}px
                      </span>
                    </div>
                  </div>
                </div>

                {/* 텍스트 장식 */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">텍스트 장식</label>
                  <select
                    value={clip.textDecoration || 'none'}
                    onChange={(e) => handleStyleChange('textDecoration', e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {textDecorations.map((decoration) => (
                      <option key={decoration.value} value={decoration.value}>
                        {decoration.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 텍스트 변환 */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">텍스트 변환</label>
                  <select
                    value={clip.textTransform || 'none'}
                    onChange={(e) => handleStyleChange('textTransform', e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {textTransforms.map((transform) => (
                      <option key={transform.value} value={transform.value}>
                        {transform.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* 🌈 그라데이션 텍스트 - 새로운 독립 컴포넌트 */}
          <GradientTextEditor clip={clip} onUpdate={onUpdate} />
          
          {/* 나머지 효과들은 추후 개별 컴포넌트로 분리 예정 */}
          
          {/* 글로우 효과 섹션 - 기존 코드 유지 (나중에 분리) */}
          <div className="border border-gray-600 rounded-lg">
            <button
              onClick={() => setShowGlow(!showGlow)}
              className="w-full p-3 text-left flex items-center justify-between text-white hover:bg-gray-700 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Zap size={16} />
                <span>글로우 효과</span>
                {clip.textGlow?.enabled && (
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                )}
              </span>
              {showGlow ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showGlow && (
              <div className="p-4 space-y-4 border-t border-gray-600">
                <p className="text-sm text-gray-400 italic">
                  🚧 글로우 효과는 다음 단계에서 분리될 예정입니다
                </p>
              </div>
            )}
          </div>

          {/* 기타 효과들도 마찬가지로 플레이스홀더로 유지 */}
          <div className="border border-gray-600 rounded-lg">
            <button
              onClick={() => setShowShadows(!showShadows)}
              className="w-full p-3 text-left flex items-center justify-between text-white hover:bg-gray-700 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Layers size={16} />
                <span>다중 그림자</span>
              </span>
              {showShadows ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showShadows && (
              <div className="p-4 space-y-4 border-t border-gray-600">
                <p className="text-sm text-gray-400 italic">
                  🚧 다중 그림자 효과는 다음 단계에서 분리될 예정입니다
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};