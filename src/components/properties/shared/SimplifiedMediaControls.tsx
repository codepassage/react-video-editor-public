import React from 'react';
import { Settings, Image as ImageIcon } from 'lucide-react';
import { MediaPicker } from '../../common/MediaPicker';

interface SimplifiedMediaControlsProps {
  clip: any; // MediaSettings from LongSentence
  onUpdate: (clipId: string, updates: any) => void;
  titlePrefix?: string;
  localData: Array<{ text: string; mediaUrl: string; mediaProps?: any }>;
  onDataChange: (data: Array<{ text: string; mediaUrl: string; mediaProps?: any }>) => void;
}

export const SimplifiedMediaControls: React.FC<SimplifiedMediaControlsProps> = ({
  clip,
  onUpdate,
  titlePrefix = ''
}) => {
  
  const handleMediaUrlChange = (url: string) => {
    onUpdate('media', { 
      mediaUrl: url,
      backgroundType: 'image' // 이미지로 고정
    });
  };

  const handleBackgroundFitChange = (fit: 'cover' | 'contain' | 'fill' | 'scale-down') => {
    onUpdate('media', { backgroundFit: fit });
  };

  const handleBackgroundPositionChange = (position: string) => {
    onUpdate('media', { backgroundPosition: position });
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings size={16} className="text-green-400" />
          <h3 className="text-white font-medium">{titlePrefix} 미디어 설정</h3>
        </div>
      </div>

      {/* 미디어 URL 선택 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2 flex items-center space-x-2">
          <ImageIcon size={14} />
          <span>이미지 선택</span>
        </label>
        <MediaPicker
          value={clip.mediaUrl || ''}
          onChange={handleMediaUrlChange}
          accept="image/*"
          placeholder="이미지를 선택하세요..."
        />
      </div>

      {/* 미디어가 선택된 경우에만 추가 옵션 표시 */}
      {clip.mediaUrl && (
        <>
          {/* 이미지 미리보기 */}
          <div className="aspect-video bg-gray-900 rounded border border-gray-600 flex items-center justify-center overflow-hidden">
            <img
              src={clip.mediaUrl}
              alt="미디어 미리보기"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* 이미지 맞춤 */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">이미지 맞춤</label>
            <select
              value={clip.backgroundFit || 'cover'}
              onChange={(e) => handleBackgroundFitChange(e.target.value as any)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="cover">채우기 (자르기)</option>
              <option value="contain">맞추기 (여백)</option>
              <option value="fill">늘이기</option>
              <option value="scale-down">축소 맞춤</option>
            </select>
          </div>

          {/* 이미지 위치 */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">이미지 위치</label>
            <select
              value={clip.backgroundPosition || 'center'}
              onChange={(e) => handleBackgroundPositionChange(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="center">중앙</option>
              <option value="top">상단</option>
              <option value="bottom">하단</option>
              <option value="left">좌측</option>
              <option value="right">우측</option>
              <option value="top left">좌상단</option>
              <option value="top right">우상단</option>
              <option value="bottom left">좌하단</option>
              <option value="bottom right">우하단</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};