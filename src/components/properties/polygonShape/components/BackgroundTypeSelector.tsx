import React from 'react';

interface BackgroundTypeSelectorProps {
  backgroundType: 'image' | 'color' | 'gradient';
  onBackgroundTypeChange: (type: 'image' | 'color' | 'gradient') => void;
}

export const BackgroundTypeSelector: React.FC<BackgroundTypeSelectorProps> = ({
  backgroundType,
  onBackgroundTypeChange
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-300">배경 타입</label>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onBackgroundTypeChange('color')}
          className={`p-3 rounded-lg border-2 transition-all ${
            backgroundType === 'color'
              ? 'border-blue-500 bg-blue-500/20'
              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
          }`}
        >
          <div className="text-xl mb-1">🎨</div>
          <div className="text-xs text-gray-300">색상</div>
        </button>
        <button
          onClick={() => onBackgroundTypeChange('gradient')}
          className={`p-3 rounded-lg border-2 transition-all ${
            backgroundType === 'gradient'
              ? 'border-purple-500 bg-purple-500/20'
              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
          }`}
        >
          <div className="text-xl mb-1">🌈</div>
          <div className="text-xs text-gray-300">그래디언트</div>
        </button>
        <button
          onClick={() => onBackgroundTypeChange('image')}
          className={`p-3 rounded-lg border-2 transition-all ${
            backgroundType === 'image'
              ? 'border-green-500 bg-green-500/20'
              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
          }`}
        >
          <div className="text-xl mb-1">🖼️</div>
          <div className="text-xs text-gray-300">이미지</div>
        </button>
      </div>
    </div>
  );
};
