import React from 'react';

interface ColorBackgroundEditorProps {
  backgroundColor: string;
  onColorChange: (color: string) => void;
}

export const ColorBackgroundEditor: React.FC<ColorBackgroundEditorProps> = ({
  backgroundColor,
  onColorChange
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-300">배경 색상</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-12 h-10 rounded cursor-pointer"
        />
        <input
          type="text"
          value={backgroundColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
          placeholder="#3b82f6"
        />
      </div>
    </div>
  );
};
