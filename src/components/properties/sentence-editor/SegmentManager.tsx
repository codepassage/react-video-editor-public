import React, { useState, useRef } from 'react';
import { Target, Plus, Edit3, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { SegmentManagerProps } from './types';
import { StylePresetsGrid, stylePresets } from './StylePresets';
import { FontSelector } from './FontSelector';

export const SegmentManager: React.FC<SegmentManagerProps> = ({
  clip,
  selectedText,
  editingSegmentId,
  onUpdate,
  onCreateSegment,
  onEditSegment,
  onDeleteSegment,
  onUpdateSegmentStyle
}) => {
  const [showSegmentManager, setShowSegmentManager] = useState(true);

  // 세그먼트별 폰트 드롭다운 상태 분리
  const [segmentFontDropdowns, setSegmentFontDropdowns] = useState<Record<string, boolean>>({});

  // 텍스트 장식 옵션
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

  // 프리셋 스타일 적용
  const applyPresetStyle = (segmentId: string, presetKey: string) => {
    console.log('프리셋 적용:', segmentId, presetKey);
    const preset = stylePresets[presetKey as keyof typeof stylePresets];
    if (preset) {
      onUpdateSegmentStyle(segmentId, preset.style);
    }
  };

  return (
    <div className="border border-gray-600 rounded-lg">
      <button
        onClick={() => setShowSegmentManager(!showSegmentManager)}
        className="w-full p-3 text-left flex items-center justify-between text-white hover:bg-gray-700 transition-colors"
      >
        <span className="flex items-center space-x-2">
          <Target size={16} />
          <span>세그먼트 관리</span>
          {clip.textSegments && clip.textSegments.length > 0 && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
              {clip.textSegments.length}
            </span>
          )}
        </span>
        {showSegmentManager ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showSegmentManager && (
        <div className="px-4 py-2 space-y-3 border-t border-gray-600">
          {/* 선택된 텍스트 정보 */}
          {selectedText && (
            <div className="p-2 bg-blue-900/50 border border-blue-600 rounded">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-300">
                  선택됨: "{selectedText.text}" ({selectedText.start}-{selectedText.end})
                </div>
                <button
                  onClick={onCreateSegment}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Plus size={12} />
                  <span>세그먼트 생성</span>
                </button>
              </div>
            </div>
          )}

          {/* 세그먼트 목록 */}
          {clip.textSegments && clip.textSegments.length > 0 ? (
            <div className="space-y-2">
              {clip.textSegments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`p-3 border rounded transition-colors ${
                    editingSegmentId === segment.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                      <span className="text-white font-medium">
                        "{clip.text?.slice(segment.startIndex, segment.endIndex) || segment.text}"
                      </span>
                      <span className="text-xs text-gray-500">
                        ({segment.startIndex}-{segment.endIndex})
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditSegment(
                          editingSegmentId === segment.id ? null : segment.id
                        )}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="편집"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => onDeleteSegment(segment.id, e)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* 스타일 미리보기 */}
                  <div
                    className="text-sm mb-2 p-2 bg-gray-900 rounded"
                    style={{
                      fontFamily: segment.style.fontFamily || clip.fontFamily,
                      fontSize: `${Math.min((segment.style.fontSize || clip.fontSize || 28) / 2, 14)}px`,
                      fontWeight: segment.style.fontWeight,
                      fontStyle: segment.style.fontStyle,
                      color: segment.style.color,
                      backgroundColor: segment.style.backgroundColor || 'transparent'
                    }}
                  >
                    {clip.text?.slice(segment.startIndex, segment.endIndex) || segment.text}
                  </div>

                  {/* 세그먼트 편집 패널 */}
                  {editingSegmentId === segment.id && (
                    <div className="space-y-3 pt-3 border-t border-gray-600">
                      {/* 스타일 프리셋 */}
                      <StylePresetsGrid
                        segmentId={segment.id}
                        onApplyPreset={applyPresetStyle}
                      />

                      <hr className="border-gray-600" />

                      {/* 폰트 선택기 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">폰트 패밀리</label>
                        <FontSelector
                          fontFamily={segment.style.fontFamily || clip.fontFamily || 'Arial'}
                          onFontSelect={(fontFamily) => onUpdateSegmentStyle(segment.id, { fontFamily })}
                          className="mb-2"
                        />
                      </div>

                      {/* 색상 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">색상</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={segment.style.color || clip.color || '#ffffff'}
                            onChange={(e) => onUpdateSegmentStyle(segment.id, { color: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={segment.style.color || clip.color || '#ffffff'}
                            onChange={(e) => onUpdateSegmentStyle(segment.id, { color: e.target.value })}
                            className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono"
                          />
                        </div>
                      </div>

                      {/* 폰트 굵기 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">굵기</label>
                        <select
                          value={segment.style.fontWeight || 'normal'}
                          onChange={(e) => onUpdateSegmentStyle(segment.id, { fontWeight: e.target.value })}
                          className="w-full p-1 bg-gray-700 text-white rounded text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="100">Thin</option>
                          <option value="300">Light</option>
                          <option value="500">Medium</option>
                          <option value="600">Semi Bold</option>
                          <option value="800">Extra Bold</option>
                          <option value="900">Black</option>
                        </select>
                      </div>

                      {/* 폰트 스타일 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">스타일</label>
                        <select
                          value={segment.style.fontStyle || 'normal'}
                          onChange={(e) => onUpdateSegmentStyle(segment.id, { fontStyle: e.target.value })}
                          className="w-full p-1 bg-gray-700 text-white rounded text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="italic">Italic</option>
                          <option value="oblique">Oblique</option>
                        </select>
                      </div>

                      {/* 폰트 크기 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">폰트 크기</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="8"
                            max="120"
                            value={segment.style.fontSize || clip.fontSize || 28}
                            onChange={(e) => onUpdateSegmentStyle(segment.id, { fontSize: parseInt(e.target.value, 10) })}
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="8"
                            max="120"
                            value={segment.style.fontSize || clip.fontSize || 28}
                            onChange={(e) => onUpdateSegmentStyle(segment.id, { fontSize: parseInt(e.target.value, 10) })}
                            className="w-16 p-1 bg-gray-700 text-white rounded text-sm"
                          />
                        </div>
                      </div>

                      {/* 텍스트 장식 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">텍스트 장식</label>
                        <select
                          value={segment.style.textDecoration || 'none'}
                          onChange={(e) => onUpdateSegmentStyle(segment.id, { textDecoration: e.target.value })}
                          className="w-full p-1 bg-gray-700 text-white rounded text-sm"
                        >
                          {textDecorations.map(decoration => (
                            <option key={decoration.value} value={decoration.value}>
                              {decoration.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 텍스트 변형 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">텍스트 변형</label>
                        <select
                          value={segment.style.textTransform || 'none'}
                          onChange={(e) => onUpdateSegmentStyle(segment.id, { textTransform: e.target.value })}
                          className="w-full p-1 bg-gray-700 text-white rounded text-sm"
                        >
                          {textTransforms.map(transform => (
                            <option key={transform.value} value={transform.value}>
                              {transform.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 텍스트 그림자 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">텍스트 그림자</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={Boolean(segment.style.textShadow && segment.style.textShadow !== 'none')}
                            onChange={(e) => {
                              onUpdateSegmentStyle(segment.id, {
                                textShadow: e.target.checked ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
                              });
                            }}
                            className="w-4 h-4"
                          />
                          {Boolean(segment.style.textShadow && segment.style.textShadow !== 'none') && (
                            <select
                              value={segment.style.textShadow || '2px 2px 4px rgba(0,0,0,0.8)'}
                              onChange={(e) => onUpdateSegmentStyle(segment.id, { textShadow: e.target.value })}
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

                      {/* 배경색 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">배경색</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={segment.style.backgroundColor !== 'transparent' && segment.style.backgroundColor}
                            onChange={(e) => onUpdateSegmentStyle(segment.id, {
                              backgroundColor: e.target.checked ? '#000000' : 'transparent'
                            })}
                            className="w-4 h-4"
                          />
                          {segment.style.backgroundColor && segment.style.backgroundColor !== 'transparent' && (
                            <>
                              <input
                                type="color"
                                value={segment.style.backgroundColor}
                                onChange={(e) => onUpdateSegmentStyle(segment.id, { backgroundColor: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={segment.style.backgroundColor}
                                onChange={(e) => onUpdateSegmentStyle(segment.id, { backgroundColor: e.target.value })}
                                className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono"
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* 둥근 테두리 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">둥근 테두리</label>
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={Boolean(segment.style.borderRadius && segment.style.borderRadius !== '0px' && segment.style.borderRadius !== '0')}
                            onChange={(e) => {
                              onUpdateSegmentStyle(segment.id, {
                                borderRadius: e.target.checked ? '3px' : '0px'
                              });
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-gray-400">둥근 테두리 사용</span>
                        </div>

                        {Boolean(segment.style.borderRadius && segment.style.borderRadius !== '0px' && segment.style.borderRadius !== '0') && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">둥근 정도</label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="20"
                                  step="1"
                                  value={parseInt(segment.style.borderRadius?.replace(/[^0-9]/g, '') || '0')}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    onUpdateSegmentStyle(segment.id, { borderRadius: `${value}px` });
                                  }}
                                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs text-gray-300 w-8 text-center">
                                  {parseInt(segment.style.borderRadius?.replace(/[^0-9]/g, '') || '0')}px
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 배경 그림자 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">배경 그림자</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={Boolean(segment.style.boxShadow && segment.style.boxShadow !== 'none')}
                            onChange={(e) => {
                              onUpdateSegmentStyle(segment.id, {
                                boxShadow: e.target.checked ? '0px 2px 4px rgba(0,0,0,0.3)' : 'none'
                              });
                            }}
                            className="w-4 h-4"
                          />
                          {Boolean(segment.style.boxShadow && segment.style.boxShadow !== 'none') && (
                            <select
                              value={segment.style.boxShadow || '0px 2px 4px rgba(0,0,0,0.3)'}
                              onChange={(e) => onUpdateSegmentStyle(segment.id, { boxShadow: e.target.value })}
                              className="flex-1 p-1 bg-gray-700 text-white rounded text-sm"
                            >
                              <option value="0px 2px 4px rgba(0,0,0,0.2)">가벼운 그림자</option>
                              <option value="0px 2px 4px rgba(0,0,0,0.3)">일반 그림자</option>
                              <option value="0px 4px 8px rgba(0,0,0,0.4)">진한 그림자</option>
                              <option value="0px 0px 8px rgba(255,255,255,0.3)">흰색 글로우</option>
                              <option value="0px 0px 8px rgba(0,150,255,0.5)">파란색 글로우</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* 패딩 */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">안쪽 패딩</label>
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={Boolean(
                              segment.style.backgroundColor &&
                              segment.style.backgroundColor !== 'transparent' &&
                              (segment.style.paddingTop || segment.style.paddingRight || segment.style.paddingBottom || segment.style.paddingLeft)
                            )}
                            onChange={(e) => {
                              if (e.target.checked && segment.style.backgroundColor && segment.style.backgroundColor !== 'transparent') {
                                onUpdateSegmentStyle(segment.id, {
                                  paddingTop: 2,
                                  paddingRight: 4,
                                  paddingBottom: 2,
                                  paddingLeft: 4
                                });
                              } else {
                                onUpdateSegmentStyle(segment.id, {
                                  paddingTop: 0,
                                  paddingRight: 0,
                                  paddingBottom: 0,
                                  paddingLeft: 0
                                });
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-gray-400">패딩 사용</span>
                        </div>

                        {/* 패딩 컨트롤 */}
                        {segment.style.backgroundColor && segment.style.backgroundColor !== 'transparent' &&
                          (segment.style.paddingTop || segment.style.paddingRight || segment.style.paddingBottom || segment.style.paddingLeft) && (
                          <div className="grid grid-cols-2 gap-1">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500 w-8">상</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={segment.style.paddingTop || 0}
                                onChange={(e) => onUpdateSegmentStyle(segment.id, { paddingTop: Number(e.target.value) })}
                                className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                              />
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500 w-8">하</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={segment.style.paddingBottom || 0}
                                onChange={(e) => onUpdateSegmentStyle(segment.id, { paddingBottom: Number(e.target.value) })}
                                className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                              />
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500 w-8">좌</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={segment.style.paddingLeft || 0}
                                onChange={(e) => onUpdateSegmentStyle(segment.id, { paddingLeft: Number(e.target.value) })}
                                className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                              />
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500 w-8">우</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={segment.style.paddingRight || 0}
                                onChange={(e) => onUpdateSegmentStyle(segment.id, { paddingRight: Number(e.target.value) })}
                                className="w-full p-1 bg-gray-600 text-white rounded text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Target size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">아직 생성된 세그먼트가 없습니다</p>
              <p className="text-xs mt-1">텍스트를 선택하고 '세그먼트 생성' 버튼을 클릭하세요</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SegmentManager;
