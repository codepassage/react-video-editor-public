import React from 'react';
import { Image, Upload } from 'lucide-react';
import type { TimelineClip } from '../../../../types';
import type { PolygonShapeProperties } from '../../../../types/polygonShape.types';
import { apiClient } from '../../../../api/client';
import { MediaPicker } from '../../../common/MediaPicker';

interface ImageBackgroundEditorProps {
  clip: TimelineClip;
  imageUrl: string;
  setImageUrl: (url: string) => void;
  backgroundFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  setBackgroundFit: (fit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down') => void;
  backgroundPosition: string;
  setBackgroundPosition: (position: string) => void;
  updatePolygonShapeProperties: (updates: Partial<PolygonShapeProperties>) => void;
}

export const ImageBackgroundEditor: React.FC<ImageBackgroundEditorProps> = ({
  clip,
  imageUrl,
  setImageUrl,
  backgroundFit,
  setBackgroundFit,
  backgroundPosition,
  setBackgroundPosition,
  updatePolygonShapeProperties
}) => {
  return (
    <>
      {/* 이미지 선택 */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">배경 이미지</label>
        <MediaPicker
          value={clip.polygonShapeProperties?.backgroundImageUrl || imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            updatePolygonShapeProperties({
              backgroundType: 'image',
              backgroundImageUrl: url
            });
          }}
          accept="image/*"
          placeholder="이미지를 선택하거나 URL을 입력하세요..."
          className="bg-gray-700 text-white [&_input]:bg-gray-700 [&_input]:text-white [&_input]:border-gray-600 [&_button]:bg-blue-600 [&_button:hover]:bg-blue-700"
        />

        {/* 테스트용 샘플 URL */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const testUrl = 'https://picsum.photos/400/300?random=1';
              setImageUrl(testUrl);
              updatePolygonShapeProperties({
                backgroundType: 'image',
                backgroundImageUrl: testUrl
              });
            }}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
          >
            테스트 이미지 1
          </button>
          <button
            onClick={() => {
              const testUrl = 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Test+Image';
              setImageUrl(testUrl);
              updatePolygonShapeProperties({
                backgroundType: 'image',
                backgroundImageUrl: testUrl
              });
            }}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
          >
            테스트 이미지 2
          </button>
        </div>
      </div>

    </>
  );
};
