import React from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { FontSelector } from '../sentence-editor/FontSelector';
import { BackgroundColorControl } from '../../common/ui/BackgroundColorControl';
import { DEFAULT_FONT_SIZE } from '../../../constants/textDefaults';

interface TextStyleControlsProps {
  clip: {
    id: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: string;
    color?: string;
    backgroundColor?: string;
    lineHeight?: number;
    letterSpacing?: number;
    textDecoration?: string;
    textTransform?: string;
    textShadow?: string;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    borderRadius?: number;
  };
  onStyleChange: (property: string, value: any) => void;
  titlePrefix?: string;
  showBackgroundControls?: boolean;
  showPaddingControls?: boolean;
  showBorderControls?: boolean;
}

export const TextStyleControls: React.FC<TextStyleControlsProps> = ({
  clip,
  onStyleChange,
  titlePrefix = '',
  showBackgroundControls = true,
  showPaddingControls = true,
  showBorderControls = true
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-white font-medium flex items-center space-x-2">
        <Type size={16} />
        <span>{titlePrefix} 텍스트 스타일</span>
      </h4>

      {/* 폰트 크기 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">폰트 크기</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="8"
            max="300"
            value={clip.fontSize || DEFAULT_FONT_SIZE}
            onChange={(e) => onStyleChange('fontSize', parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <input
            type="number"
            min="8"
            max="300"
            value={clip.fontSize || DEFAULT_FONT_SIZE}
            onChange={(e) => onStyleChange('fontSize', parseInt(e.target.value, 10))}
            className="w-16 p-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
          />
        </div>
      </div>

      {/* 폰트 패밀리 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">폰트 패밀리</label>
        <FontSelector
          fontFamily={clip.fontFamily || 'Arial'}
          onFontSelect={(fontFamily) => onStyleChange('fontFamily', fontFamily)}
        />
      </div>

      {/* 폰트 굵기 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">굵기</label>
        <select
          value={clip.fontWeight || 'normal'}
          onChange={(e) => onStyleChange('fontWeight', e.target.value)}
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
              onClick={() => onStyleChange('textAlign', align)}
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

      {/* 기본 텍스트 색상 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-200">텍스트 색상</label>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded border border-gray-600 overflow-hidden">
              <input
                type="color"
                value={clip.color || '#ffffff'}
                onChange={(e) => onStyleChange('color', e.target.value)}
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
          onChange={(e) => onStyleChange('color', e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm font-mono"
          placeholder="#FFFFFF"
        />
      </div>

      {/* 배경 색상 설정 */}
      {showBackgroundControls && (
        <BackgroundColorControl
          label="배경 설정"
          value={clip.backgroundColor}
          onChange={(backgroundColor) => {
            console.log('🎨 BackgroundColorControl onChange:', {
              현재값: clip.backgroundColor,
              새값: backgroundColor
            });
            onStyleChange('backgroundColor', backgroundColor);
          }}
          allowTransparent={true}
          allowGradient={true}
          className="p-4"
        />
      )}

      {/* 줄 간격 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">줄 간격</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0.8"
            max="3.0"
            step="0.1"
            value={clip.lineHeight || 1.2}
            onChange={(e) => onStyleChange('lineHeight', parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-300 w-12 text-center">
            {clip.lineHeight || 1.2}
          </span>
        </div>
      </div>

      {/* 자간 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">자간</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="-5"
            max="10"
            step="0.5"
            value={clip.letterSpacing || 0}
            onChange={(e) => onStyleChange('letterSpacing', parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-300 w-12 text-center">
            {clip.letterSpacing || 0}px
          </span>
        </div>
      </div>

      {/* 텍스트 장식 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">텍스트 장식</label>
        <select
          value={clip.textDecoration || 'none'}
          onChange={(e) => onStyleChange('textDecoration', e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="none">없음</option>
          <option value="underline">밑줄</option>
          <option value="overline">윗줄</option>
          <option value="line-through">취소선</option>
          <option value="underline overline">밑줄 + 윗줄</option>
        </select>
      </div>

      {/* 텍스트 변형 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">텍스트 변형</label>
        <select
          value={clip.textTransform || 'none'}
          onChange={(e) => onStyleChange('textTransform', e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="none">없음</option>
          <option value="uppercase">대문자</option>
          <option value="lowercase">소문자</option>
          <option value="capitalize">첫글자 대문자</option>
        </select>
      </div>

      {/* 텍스트 그림자 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">텍스트 그림자</label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={Boolean(clip.textShadow && clip.textShadow !== 'none')}
            onChange={(e) => {
              onStyleChange('textShadow', e.target.checked ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none');
            }}
            className="w-4 h-4"
          />
          {Boolean(clip.textShadow && clip.textShadow !== 'none') && (
            <select
              value={clip.textShadow || '2px 2px 4px rgba(0,0,0,0.8)'}
              onChange={(e) => onStyleChange('textShadow', e.target.value)}
              className="flex-1 p-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="1px 1px 2px rgba(0,0,0,0.5)">가벼운 그림자</option>
              <option value="2px 2px 4px rgba(0,0,0,0.8)">일반 그림자</option>
              <option value="3px 3px 6px rgba(0,0,0,0.9)">진한 그림자</option>
              <option value="0 0 8px rgba(255,255,255,0.8)">흰색 글로우</option>
              <option value="0 0 10px rgba(255,255,0,0.8)">노란색 글로우</option>
              <option value="2px 2px 0px #000000">아웃라인</option>
            </select>
          )}
        </div>
      </div>

      {/* 패딩 */}
      {showPaddingControls && (
        <div>
          <label className="block text-sm text-gray-300 mb-2">안쪽 패딩</label>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              checked={Boolean(
                clip.paddingTop || clip.paddingRight || clip.paddingBottom || clip.paddingLeft
              )}
              onChange={(e) => {
                console.log('🔄 패딩 체크박스 토글:', {
                  checked: e.target.checked,
                  현재패딩값들: {
                    paddingTop: clip.paddingTop,
                    paddingRight: clip.paddingRight,
                    paddingBottom: clip.paddingBottom,
                    paddingLeft: clip.paddingLeft,
                  }
                });
                
                if (e.target.checked) {
                  // 🔧 패딩 활성화: 기본값 설정
                  const newPadding = {
                    paddingTop: 8,
                    paddingRight: 12,
                    paddingBottom: 8,
                    paddingLeft: 12,
                  };
                  
                  console.log('🔧 패딩 활성화 - 기본값 설정:', newPadding);
                  
                  try {
                    onStyleChange('batch', newPadding);
                    console.log('✅ batch 업데이트 성공');
                  } catch (error) {
                    console.log('❌ batch 실패, 개별 업데이트로 시도:', error);
                    onStyleChange('paddingTop', newPadding.paddingTop);
                    onStyleChange('paddingRight', newPadding.paddingRight);
                    onStyleChange('paddingBottom', newPadding.paddingBottom);
                    onStyleChange('paddingLeft', newPadding.paddingLeft);
                  }
                } else {
                  // 🔧 패딩 비활성화: 모든 값을 0으로 설정
                  console.log('🔧 패딩 비활성화 - 0으로 설정');
                  const resetPadding = {
                    paddingTop: 0,
                    paddingRight: 0,
                    paddingBottom: 0,
                    paddingLeft: 0,
                  };
                  
                  try {
                    onStyleChange('batch', resetPadding);
                    console.log('✅ batch 리셋 성공');
                  } catch (error) {
                    console.log('❌ batch 리셋 실패, 개별 업데이트로 시도:', error);
                    onStyleChange('paddingTop', 0);
                    onStyleChange('paddingRight', 0);
                    onStyleChange('paddingBottom', 0);
                    onStyleChange('paddingLeft', 0);
                  }
                }
              }}
              className="w-4 h-4"
            />
            <span className="text-xs text-gray-400">패딩 사용</span>
          </div>

          {/* 패딩 컨트롤 */}
          {(clip.paddingTop || clip.paddingRight || clip.paddingBottom || clip.paddingLeft) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500 w-8">상</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={clip.paddingTop || 0}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    console.log('🔧 패딩 Top 변경:', newValue);
                    onStyleChange('paddingTop', newValue);
                  }}
                  className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500 w-8">하</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={clip.paddingBottom || 0}
                  onChange={(e) => {
                    console.log('🔧 패딩 Bottom 변경:', Number(e.target.value));
                    onStyleChange('paddingBottom', Number(e.target.value));
                  }}
                  className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500 w-8">좌</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={clip.paddingLeft || 0}
                  onChange={(e) => {
                    console.log('🔧 패딩 Left 변경:', Number(e.target.value));
                    onStyleChange('paddingLeft', Number(e.target.value));
                  }}
                  className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500 w-8">우</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={clip.paddingRight || 0}
                  onChange={(e) => {
                    console.log('🔧 패딩 Right 변경:', Number(e.target.value));
                    onStyleChange('paddingRight', Number(e.target.value));
                  }}
                  className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 둥근 테두리 */}
      {showBorderControls && (
        <div>
          <label className="block text-sm text-gray-300 mb-2">둥근 테두리</label>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              checked={Boolean(clip.borderRadius && clip.borderRadius > 0)}
              onChange={(e) => {
                onStyleChange('borderRadius', e.target.checked ? 8 : 0);
              }}
              className="w-4 h-4"
            />
            <span className="text-xs text-gray-400">둥근 테두리 사용</span>
          </div>

          {Boolean(clip.borderRadius && clip.borderRadius > 0) && (
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="50"
                value={clip.borderRadius || 0}
                onChange={(e) => onStyleChange('borderRadius', Number(e.target.value))}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-300 w-12 text-center">
                {clip.borderRadius || 0}px
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};