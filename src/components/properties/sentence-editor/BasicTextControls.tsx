import React from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { BasicTextControlsProps } from './types';
import { FontSelector } from './FontSelector';
import { DEFAULT_FONT_SIZE } from '../../../constants/textDefaults';
import { ColorPicker, DropdownControl, BackgroundColorControl } from '../../common/ui';
import { PositionTransformControls } from '../shared/PositionTransformControls';

export const BasicTextControls: React.FC<BasicTextControlsProps> = ({ clip, onStyleChange }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-white font-medium flex items-center space-x-2">
        <Type size={16} />
        <span>기본 텍스트 스타일</span>
      </h4>

      {/* 위치, 크기, 회전, 투명도 등 기본 변형 컨트롤 */}
      <PositionTransformControls
        clip={{
          id: clip.id,
          // 텍스트 클립의 필수 속성들을 명확하게 설정
          width: clip.width ?? 400,  // 기본 텍스트 너비
          height: clip.height ?? 80, // 기본 텍스트 높이
          x: clip.x ?? 100,
          y: clip.y ?? 100,
          rotation: clip.rotation ?? 0,
          opacity: clip.opacity ?? 1,
          positionMargin: clip.positionMargin ?? { top: 50, right: 50, bottom: 50, left: 50 },
          // LongSentence와 동일한 속성 추가 (타입 오류 방지를 위해 as any 사용)
          positioning: (clip as any).positioning || 'coordinate',
          alignment: (clip as any).alignment
        }}
        onUpdate={(_, updates) => {
          Object.entries(updates).forEach(([property, value]) => {
            // positioning과 alignment는 SentenceClip에서 지원하지 않으므로 무시
            if (property === 'positioning' || property === 'alignment') {
              return;
            }
            
            onStyleChange(property, value);
          });
        }}
        includeOpacity
        includePositionPresets
        includeSizeControls={true}
        textContext={{
          fontSize: clip.fontSize,
          lineHeight: clip.lineHeight,
          textContent: clip.text
        }}
      />

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
              className={`p-2 rounded transition-colors ${clip.textAlign === align
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
      <ColorPicker
        label="텍스트 색상"
        value={clip.color || '#ffffff'}
        onChange={(color) => onStyleChange('color', color)}
        showPresets={true}
      />

      {/* 배경 색상 설정 */}
      <BackgroundColorControl
        label="배경 설정"
        value={clip.backgroundColor}
        onChange={(backgroundColor) => onStyleChange("backgroundColor", backgroundColor)}
        allowTransparent={true}
        allowGradient={true}
      />
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
      <DropdownControl
        label="텍스트 장식"
        options={[
          { value: 'none', label: '없음' },
          { value: 'underline', label: '밑줄' },
          { value: 'overline', label: '윗줄' },
          { value: 'line-through', label: '취소선' },
          { value: 'underline overline', label: '밑줄 + 윗줄' }
        ]}
        value={clip.textDecoration || 'none'}
        onChange={(value) => onStyleChange('textDecoration', value)}
      />

      {/* 텍스트 변형 */}
      <DropdownControl
        label="텍스트 변형"
        options={[
          { value: 'none', label: '없음' },
          { value: 'uppercase', label: '대문자' },
          { value: 'lowercase', label: '소문자' },
          { value: 'capitalize', label: '첫글자 대문자' }
        ]}
        value={clip.textTransform || 'none'}
        onChange={(value) => onStyleChange('textTransform', value)}
      />

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
      <div>
        <label className="block text-sm text-gray-300 mb-2">안쪽 패딩</label>
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            checked={Boolean(
              clip.backgroundColor &&
              clip.backgroundColor !== 'transparent' &&
              (clip.paddingTop || clip.paddingRight || clip.paddingBottom || clip.paddingLeft)
            )}
            onChange={(e) => {
              if (e.target.checked && clip.backgroundColor && clip.backgroundColor !== 'transparent') {
                onStyleChange('paddingTop', 8);
                onStyleChange('paddingRight', 12);
                onStyleChange('paddingBottom', 8);
                onStyleChange('paddingLeft', 12);
              } else {
                onStyleChange('paddingTop', 0);
                onStyleChange('paddingRight', 0);
                onStyleChange('paddingBottom', 0);
                onStyleChange('paddingLeft', 0);
              }
            }}
            className="w-4 h-4"
          />
          <span className="text-xs text-gray-400">패딩 사용</span>
        </div>

        {/* 패딩 컨트롤 */}
        {clip.backgroundColor && clip.backgroundColor !== 'transparent' &&
          (clip.paddingTop || clip.paddingRight || clip.paddingBottom || clip.paddingLeft) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500 w-8">상</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={clip.paddingTop || 0}
                  onChange={(e) => onStyleChange('paddingTop', Number(e.target.value))}
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
                  onChange={(e) => onStyleChange('paddingBottom', Number(e.target.value))}
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
                  onChange={(e) => onStyleChange('paddingLeft', Number(e.target.value))}
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
                  onChange={(e) => onStyleChange('paddingRight', Number(e.target.value))}
                  className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                />
              </div>
            </div>
          )}
      </div>

      {/* 둥근 테두리 */}
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
    </div>
  );
};

export default BasicTextControls;
