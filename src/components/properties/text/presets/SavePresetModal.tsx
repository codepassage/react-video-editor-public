// 💾 사용자 정의 프리셋 저장 모달 컴포넌트
// 현재 텍스트 스타일을 새로운 프리셋으로 저장하는 인터페이스

import React, { useState } from 'react';
import { X, Save, Tag, Type, Palette } from 'lucide-react';
import { TextClip } from '../../../../types/clipTypes';
import { TextPreset, PresetCategory } from '../../../../types/presets/textPresets';
import { convertClipToPreset } from '../../../../utils/presets/presetUtils';
import { globalAlert } from '../../../../utils/globalAlert';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: TextClip;
  onSave: (preset: TextPreset) => void;
}

/**
 * 💾 SavePresetModal - 사용자 정의 프리셋 저장 모달
 */
export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  isOpen,
  onClose,
  clip,
  onSave
}) => {
  const [presetName, setPresetName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PresetCategory>('custom');
  const [tags, setTags] = useState<string[]>(['사용자정의']);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  if (!isOpen) return null;

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Enter 키로 태그 추가
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // 프리셋 저장
  const handleSave = () => {
    if (!presetName.trim()) {
      globalAlert.showWarning('프리셋 이름을 입력해주세요.');
      return;
    }

    const preset = convertClipToPreset(clip, {
      name: presetName.trim(),
      description: description.trim() || '사용자가 만든 프리셋',
      category,
      tags
    });

    // 추가 메타데이터 설정
    preset.isUserCreated = true;
    preset.popularity = 0;
    preset.createdAt = new Date().toISOString();

    onSave(preset);
    
    // 폼 리셋
    setPresetName('');
    setDescription('');
    setCategory('custom');
    setTags(['사용자정의']);
    setTagInput('');
    
    onClose();
  };

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'custom', label: '사용자 정의', icon: '⚙️' },
    { value: 'youtube', label: 'YouTube', icon: '📺' },
    { value: 'social', label: '소셜미디어', icon: '📱' },
    { value: 'movie', label: '영화/드라마', icon: '🎬' },
    { value: 'business', label: '비즈니스', icon: '💼' },
    { value: 'event', label: '이벤트/축하', icon: '🎉' },
    { value: 'news', label: '뉴스/정보', icon: '📰' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-lg">
              <Save size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">프리셋 저장</h2>
              <p className="text-sm text-gray-400">현재 스타일을 프리셋으로 저장합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 현재 스타일 미리보기 */}
        <div className="p-6 border-b border-gray-600">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
            <Palette size={16} />
            <span>현재 스타일 미리보기</span>
          </h3>
          <div 
            className="p-4 bg-gray-700 rounded-lg text-center"
            style={{
              fontFamily: clip.fontFamily || 'Arial',
              fontSize: `${Math.min((clip.fontSize || 24) * 0.8, 28)}px`,
              fontWeight: clip.fontWeight || '400',
              color: clip.color || '#ffffff',
              backgroundColor: clip.backgroundColor || 'transparent',
              textAlign: (clip.textAlign as any) || 'center'
            }}
          >
            {clip.text || '프리셋 미리보기'}
          </div>
        </div>

        {/* 폼 */}
        <div className="p-6 space-y-6">
          {/* 프리셋 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              프리셋 이름 *
            </label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="예: 내 채널 제목 스타일"
              maxLength={50}
            />
            <div className="text-xs text-gray-400 mt-1">
              {presetName.length}/50
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="이 프리셋에 대한 설명을 입력하세요..."
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-gray-400 mt-1">
              {description.length}/200
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PresetCategory)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
              <Tag size={16} />
              <span>태그</span>
            </label>
            
            {/* 현재 태그들 */}
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            {/* 태그 입력 */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="태그 입력 후 Enter"
                maxLength={20}
              />
              <button
                onClick={() => addTag(tagInput)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                disabled={!tagInput.trim()}
              >
                추가
              </button>
            </div>
          </div>

          {/* 공개 설정 */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              다른 사용자와 공유 (향후 기능)
            </label>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex space-x-3 p-6 border-t border-gray-600">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!presetName.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Save size={16} />
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePresetModal;
