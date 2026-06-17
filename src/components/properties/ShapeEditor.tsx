import React, { useState, useRef, useEffect } from 'react';
import { Palette, Image, Layers, Sparkles, Upload, HardDrive, Server, RefreshCw, Loader2 } from 'lucide-react';
import type { TimelineClip, MediaItem, MediaType } from '../../types';
import type { ShapeProperties, BackgroundType, GradientType, BorderEffect } from '../../types/shape';
import { useEditorStore } from '../../store/editorStore';
import { apiClient, fileUtils } from '../../api/client';

interface ShapeEditorProps {
  clip: any;
  onUpdate: (clipId: string, updates: any) => void;
}

export const ShapeEditor: React.FC<ShapeEditorProps> = ({ clip, onUpdate }) => {
  const { mediaLibrary } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'shape' | 'background' | 'border' | 'effects'>('shape');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTab, setImagePickerTab] = useState<'local' | 'server'>('local');
  const [serverImages, setServerImages] = useState<MediaItem[]>([]);
  const [isLoadingServerImages, setIsLoadingServerImages] = useState(false);
  const [serverImageError, setServerImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get shape properties with defaults
  const shapeProps: ShapeProperties = clip.shapeProperties || {
    shapeType: 'circle',
    backgroundType: 'solid',
    backgroundColor: '#3b82f6'
  };

  // Update shape properties
  const updateShapeProperty = (updates: Partial<ShapeProperties>) => {
    const newShapeProperties = { ...shapeProps, ...updates };
    onUpdate(clip.id, { shapeProperties: newShapeProperties });
  };

  // Load server images
  const loadServerImages = async () => {
    setIsLoadingServerImages(true);
    setServerImageError(null);
    
    try {
      const files = await apiClient.getFiles();
      
      // Filter only images and convert to MediaItem
      const imageItems: MediaItem[] = await Promise.all(
        files
          .filter(file => file.mediaType === 'image')
          .map(async file => {
            const mediaItem: MediaItem = {
              id: file.id,
              type: 'image' as MediaType,
              name: file.originalName,
              url: apiClient.getFileUrl(file.filename),
              fileSize: file.size,
              width: file.width,
              height: file.height,
              thumbnail: file.thumbnail || apiClient.getFileUrl(file.filename)
            };
            
            // Get dimensions if not available
            if (!mediaItem.width || !mediaItem.height) {
              try {
                const dimensions = await getImageDimensions(mediaItem.url);
                mediaItem.width = dimensions.width;
                mediaItem.height = dimensions.height;
              } catch (error) {
                console.warn('Failed to get image dimensions:', error);
              }
            }
            
            return mediaItem;
          })
      );
      
      setServerImages(imageItems);
    } catch (error: any) {
      console.warn('Failed to load server images:', error.message || error);
      setServerImageError('서버 이미지를 불러올 수 없습니다.');
    } finally {
      setIsLoadingServerImages(false);
    }
  };

  // Get image dimensions helper
  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Load server images when image picker opens
  useEffect(() => {
    if (showImagePicker && imagePickerTab === 'server' && serverImages.length === 0) {
      loadServerImages();
    }
  }, [showImagePicker, imagePickerTab]);

  // Handle image selection from media library
  const handleImageSelect = (mediaItem: MediaItem) => {
    console.log('🔍 Server Image 선택:', {
      '원본 URL': mediaItem.url,
      '파일명': mediaItem.name,
      '타입': mediaItem.type
    });
    
    if (mediaItem.type === 'image' && mediaItem.url) {
      console.log('🎯 Shape 배경으로 설정할 URL:', mediaItem.url);
      
      // 🔍 수정: document.createElement를 사용하여 이미지 로드 테스트
      const testImg = document.createElement('img');
      testImg.onload = () => {
        console.log('✅ Server Image URL 로드 성공:', mediaItem.url);
        console.log('✅ 이미지 크기:', testImg.naturalWidth, 'x', testImg.naturalHeight);
      };
      testImg.onerror = (error) => {
        console.error('❌ Server Image URL 로드 실패:', mediaItem.url, error);
        console.error('❌ 이는 Server Image가 작동하지 않는 진짜 원인입니다!');
      };
      testImg.src = mediaItem.url;
      
      updateShapeProperty({
        backgroundType: 'image',
        backgroundImageUrl: mediaItem.url
      });
      setShowImagePicker(false);
    }
  };

  // Handle local image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      
      console.log('🔍 Upload Image 선택:', {
        '파일명': file.name,
        'Blob URL': url,
        '파일 크기': file.size
      });
      
      // 🔍 수정: document.createElement를 사용하여 이미지 로드 테스트
      const testImg = document.createElement('img');
      testImg.onload = () => {
        console.log('✅ Upload Image URL 로드 성공:', url);
        console.log('✅ 이미지 크기:', testImg.naturalWidth, 'x', testImg.naturalHeight);
      };
      testImg.onerror = (error) => {
        console.error('❌ Upload Image URL 로드 실패:', url, error);
      };
      testImg.src = url;
      
      updateShapeProperty({
        backgroundType: 'image',
        backgroundImageUrl: url
      });
      setShowImagePicker(false);
    }
  };

  // Gradient stop management
  const addGradientStop = () => {
    const gradient = shapeProps.gradient || {
      type: 'linear' as GradientType,
      angle: 0,
      centerX: 50,
      centerY: 50,
      stops: [
        { color: '#3b82f6', position: 0 },
        { color: '#1d4ed8', position: 100 }
      ]
    };
    
    // 스마트한 위치 계산: 기존 스톱들 사이의 중간점을 찾거나 끝에 추가
    const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
    let newPosition = 50; // 기본값
    let newColor = '#ffffff'; // 기본 컴러
    
    if (sortedStops.length >= 2) {
      // 가장 큰 간격을 찾아서 그 중간에 추가
      let maxGap = 0;
      let bestPosition = 50;
      
      // 처음과 끝 사이의 간격들을 확인
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const gap = sortedStops[i + 1].position - sortedStops[i].position;
        if (gap > maxGap && gap > 10) { // 최소 10% 간격이 있어야 추가
          maxGap = gap;
          bestPosition = sortedStops[i].position + gap / 2;
        }
      }
      
      // 만약 적당한 간격을 찾지 못했으면 끝에 추가
      if (maxGap === 0) {
        const lastPosition = sortedStops[sortedStops.length - 1].position;
        if (lastPosition < 90) {
          bestPosition = Math.min(lastPosition + 20, 100);
        } else {
          // 끝에 공간이 없으면 처음에 추가
          const firstPosition = sortedStops[0].position;
          bestPosition = Math.max(firstPosition - 20, 0);
        }
      }
      
      newPosition = Math.round(bestPosition);
      
      // 주변 컴러들을 기반으로 중간 컴러 생성
      const nearbyStops = sortedStops.filter(stop => 
        Math.abs(stop.position - newPosition) <= 50
      );
      
      if (nearbyStops.length > 0) {
        // 근처 컴러들의 평균을 계산하여 자연스러운 중간색 생성
        const colors = [
          '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', 
          '#6c5ce7', '#fd79a8', '#00b894', '#e17055'
        ];
        newColor = colors[Math.floor(Math.random() * colors.length)];
      }
    }
    
    const newStop = {
      color: newColor,
      position: newPosition
    };
    
    updateShapeProperty({
      gradient: {
        ...gradient,
        stops: [...gradient.stops, newStop]
      }
    });
  };

  const removeGradientStop = (index: number) => {
    const gradient = shapeProps.gradient;
    if (gradient && gradient.stops.length > 2) {
      const newStops = gradient.stops.filter((_, i) => i !== index);
      updateShapeProperty({
        gradient: {
          ...gradient,
          stops: newStops
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Palette className="text-purple-400" size={18} />
        <h3 className="text-white font-medium">Shape Editor</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
        {[
          { id: 'shape', label: 'Shape', icon: '🔶' },
          { id: 'background', label: 'Background', icon: '🎨' },
          { id: 'border', label: 'Border', icon: '⭕' },
          { id: 'effects', label: 'Effects', icon: '✨' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Shape Type Selection */}
      {activeTab === 'shape' && (
        <div className="space-y-4">
          <h4 className="text-white font-medium">Shape Type</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'circle', name: 'Circle', emoji: '🔴' },
              { type: 'rectangle', name: 'Rectangle', emoji: '🔶' },
              { type: 'triangle', name: 'Triangle', emoji: '🔺' },
              { type: 'diamond', name: 'Diamond', emoji: '🔸' },
              { type: 'star', name: 'Star', emoji: '⭐' },
              { type: 'heart', name: 'Heart', emoji: '💖' }
            ].map((shape) => (
              <button
                key={shape.type}
                onClick={() => updateShapeProperty({ shapeType: shape.type as any })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  shapeProps.shapeType === shape.type
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">{shape.emoji}</div>
                <div className="text-xs text-gray-300">{shape.name}</div>
              </button>
            ))}
          </div>

          {/* Border Radius Control - 사각형에서만 지원 */}
          {shapeProps.shapeType === 'rectangle' && (
            <div className="mt-6">
              <h4 className="text-white font-medium mb-3">Round Corners</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(shapeProps.borderRadius || 0) > 0}
                    onChange={(e) => updateShapeProperty({ borderRadius: e.target.checked ? 10 : 0 })}
                    className="w-4 h-4"
                  />
                  <label className="text-white text-sm">Enable rounded corners</label>
                </div>
                
                {(shapeProps.borderRadius || 0) > 0 && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Corner Radius: <span className="font-mono">{shapeProps.borderRadius || 0}px</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-400 w-6">0</span>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={shapeProps.borderRadius || 0}
                        onChange={(e) => updateShapeProperty({ borderRadius: Number(e.target.value) })}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-xs text-gray-400 w-8">50</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={shapeProps.borderRadius || 0}
                        onChange={(e) => updateShapeProperty({ borderRadius: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center"
                      />
                    </div>
                    
                    {/* Help text */}
                    <div className="mt-2 text-xs text-gray-400">
                      Higher values create more rounded corners
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Background Settings */}
      {activeTab === 'background' && (
        <div className="space-y-4">
          <h4 className="text-white font-medium">Background Type</h4>
          
          {/* Background Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'solid', name: 'Solid', emoji: '🎨' },
              { type: 'gradient', name: 'Gradient', emoji: '🌈' },
              { type: 'image', name: 'Image', emoji: '🖼️' }
            ].map((bg) => (
              <button
                key={bg.type}
                onClick={() => updateShapeProperty({ backgroundType: bg.type as BackgroundType })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  shapeProps.backgroundType === bg.type
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-xl mb-1">{bg.emoji}</div>
                <div className="text-xs text-gray-300">{bg.name}</div>
              </button>
            ))}
          </div>

          {/* Solid Background */}
          {shapeProps.backgroundType === 'solid' && (
            <div className="space-y-3">
              {/* 투명 배경 체크박스 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`shape-transparent-${clip.id}`}
                  checked={shapeProps.backgroundColor === 'transparent'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateShapeProperty({ backgroundColor: 'transparent' });
                    } else {
                      updateShapeProperty({ backgroundColor: '#3b82f6' });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor={`shape-transparent-${clip.id}`} className="text-sm text-gray-300">
                  투명 배경
                </label>
              </div>
              
              {/* 색상 선택기 (투명이 아닐 때만 표시) */}
              {shapeProps.backgroundColor !== 'transparent' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Background Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={shapeProps.backgroundColor || '#3b82f6'}
                      onChange={(e) => updateShapeProperty({ backgroundColor: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={shapeProps.backgroundColor || '#3b82f6'}
                      onChange={(e) => updateShapeProperty({ backgroundColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              )}
              
              {/* 투명 설명 */}
              {shapeProps.backgroundColor === 'transparent' && (
                <div className="text-xs text-gray-400 italic">
                  Shape 배경이 투명하게 설정됩니다
                </div>
              )}
            </div>
          )}

          {/* Gradient Background */}
          {shapeProps.backgroundType === 'gradient' && (
            <div className="space-y-4">
              {/* Gradient Type */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Gradient Type</label>
                <select
                  value={shapeProps.gradient?.type || 'linear'}
                  onChange={(e) => {
                    const currentStops = shapeProps.gradient?.stops || [
                      { color: '#3b82f6', position: 0 },
                      { color: '#1d4ed8', position: 100 }
                    ];
                    updateShapeProperty({
                      gradient: {
                        type: e.target.value as GradientType,
                        angle: 0,
                        centerX: 50,
                        centerY: 50,
                        stops: currentStops
                      }
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                  <option value="conic">Conic</option>
                </select>
              </div>

              {/* Angle for Linear/Conic */}
              {(shapeProps.gradient?.type === 'linear' || shapeProps.gradient?.type === 'conic') && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Angle</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={shapeProps.gradient?.angle || 0}
                      onChange={(e) => updateShapeProperty({
                        gradient: {
                          ...shapeProps.gradient,
                          angle: Number(e.target.value)
                        }
                      })}
                      className="flex-1"
                    />
                    <span className="text-white text-sm w-12">{shapeProps.gradient?.angle || 0}°</span>
                  </div>
                </div>
              )}

              {/* Center Point for Radial/Conic */}
              {(shapeProps.gradient?.type === 'radial' || shapeProps.gradient?.type === 'conic') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Center X</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={shapeProps.gradient?.centerX || 50}
                      onChange={(e) => updateShapeProperty({
                        gradient: {
                          ...shapeProps.gradient,
                          centerX: Number(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Center Y</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={shapeProps.gradient?.centerY || 50}
                      onChange={(e) => updateShapeProperty({
                        gradient: {
                          ...shapeProps.gradient,
                          centerY: Number(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
              )}

              {/* Gradient Stops */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-300">Color Stops ({(shapeProps.gradient?.stops || []).length})</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Min: 2</span>
                    <button
                      onClick={addGradientStop}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      title="Add color stop"
                    >
                      + Add Color
                    </button>
                  </div>
                </div>

                {/* Gradient Preview */}
                {(shapeProps.gradient?.stops || []).length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">Preview</label>
                    <div 
                      className="w-full h-8 rounded border border-gray-600 relative"
                      style={{
                        background: (() => {
                          const stops = shapeProps.gradient?.stops || [];
                          const type = shapeProps.gradient?.type || 'linear';
                          const angle = shapeProps.gradient?.angle || 0;
                          const centerX = shapeProps.gradient?.centerX || 50;
                          const centerY = shapeProps.gradient?.centerY || 50;
                          
                          if (stops.length === 0) return '#3b82f6';
                          
                          const stopStr = stops
                            .sort((a, b) => a.position - b.position)
                            .map(stop => `${stop.color} ${stop.position}%`)
                            .join(', ');
                          
                          switch (type) {
                            case 'radial':
                              return `radial-gradient(circle at ${centerX}% ${centerY}%, ${stopStr})`;
                            case 'conic':
                              return `conic-gradient(from ${angle}deg at ${centerX}% ${centerY}%, ${stopStr})`;
                            default:
                              return `linear-gradient(${angle}deg, ${stopStr})`;
                          }
                        })()
                      }}
                    >
                      {/* Color stop indicators */}
                      {(shapeProps.gradient?.stops || []).map((stop, index) => (
                        <div
                          key={index}
                          className="absolute top-0 bottom-0 w-1 bg-black bg-opacity-50 transform -translate-x-0.5"
                          style={{ left: `${stop.position}%` }}
                          title={`${stop.color} at ${stop.position}%`}
                        >
                          <div className="w-2 h-2 bg-white border border-gray-800 rounded-full transform -translate-x-0.5 -translate-y-0.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {(shapeProps.gradient?.stops || []).map((stop, index) => (
                    <div key={index} className="p-3 bg-gray-750 rounded border border-gray-600">
                      {/* Top row: Color picker and text input */}
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="color"
                          value={stop.color}
                          onChange={(e) => {
                            const newStops = [...(shapeProps.gradient?.stops || [])];
                            newStops[index] = { ...stop, color: e.target.value };
                            updateShapeProperty({
                              gradient: {
                                ...shapeProps.gradient,
                                stops: newStops
                              }
                            });
                          }}
                          className="w-12 h-10 rounded cursor-pointer border border-gray-500"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={stop.color}
                            onChange={(e) => {
                              const newStops = [...(shapeProps.gradient?.stops || [])];
                              newStops[index] = { ...stop, color: e.target.value };
                              updateShapeProperty({
                                gradient: {
                                  ...shapeProps.gradient,
                                  stops: newStops
                                }
                              });
                            }}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
                            placeholder="#ffffff"
                          />
                        </div>
                        {(shapeProps.gradient?.stops || []).length > 2 ? (
                          <button
                            onClick={() => removeGradientStop(index)}
                            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors min-w-[40px]"
                            title="Remove color stop"
                          >
                            ×
                          </button>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center">
                            <span className="text-gray-500 text-sm" title="Minimum 2 colors required">🔒</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Bottom row: Position slider */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Position: <span className="font-mono">{stop.position}%</span>
                        </label>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-400 w-6">0%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={stop.position}
                            onChange={(e) => {
                              const newStops = [...(shapeProps.gradient?.stops || [])];
                              newStops[index] = { ...stop, position: Number(e.target.value) };
                              updateShapeProperty({
                                gradient: {
                                  ...shapeProps.gradient,
                                  stops: newStops
                                }
                              });
                            }}
                            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right, 
                                ${stop.color} 0%, 
                                ${stop.color} ${stop.position}%, 
                                #4b5563 ${stop.position}%, 
                                #4b5563 100%)`
                            }}
                          />
                          <span className="text-xs text-gray-400 w-8">100%</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={stop.position}
                            onChange={(e) => {
                              const newStops = [...(shapeProps.gradient?.stops || [])];
                              newStops[index] = { ...stop, position: Number(e.target.value) };
                              updateShapeProperty({
                                gradient: {
                                  ...shapeProps.gradient,
                                  stops: newStops
                                }
                              });
                            }}
                            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(shapeProps.gradient?.stops || []).length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No color stops. Click "Add Color" to start.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image Background */}
          {shapeProps.backgroundType === 'image' && (
            <div className="space-y-4">
              {/* Current Image */}
              {shapeProps.backgroundImageUrl && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Current Background Image</label>
                  <div className="relative">
                    <img
                      src={shapeProps.backgroundImageUrl}
                      alt="Background"
                      className="w-full h-32 object-cover rounded border border-gray-600"
                    />
                    <button
                      onClick={() => updateShapeProperty({ backgroundImageUrl: undefined })}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded hover:bg-red-700"
                      title="Remove Image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Image Selection Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowImagePicker(true)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Image size={16} />
                  <span>Select from Media</span>
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Upload size={16} />
                  <span>Upload</span>
                </button>
              </div>

              {/* Image Fit Settings */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Image Fit</label>
                <select
                  value={shapeProps.backgroundFit || 'cover'}
                  onChange={(e) => updateShapeProperty({ backgroundFit: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">Original</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Image Position</label>
                <select
                  value={shapeProps.backgroundPosition || 'center'}
                  onChange={(e) => updateShapeProperty({ backgroundPosition: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Border Settings */}
      {activeTab === 'border' && (
        <div className="space-y-4">
          {/* Border Enable */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={(shapeProps.borderWidth || 0) > 0}
              onChange={(e) => updateShapeProperty({ borderWidth: e.target.checked ? 2 : 0 })}
              className="w-4 h-4"
            />
            <label className="text-white">Enable Border</label>
          </div>

          {(shapeProps.borderWidth || 0) > 0 && (
            <div className="space-y-4">
              {/* Border Width */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Width</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={shapeProps.borderWidth || 2}
                    onChange={(e) => updateShapeProperty({ borderWidth: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-white text-sm w-8">{shapeProps.borderWidth || 2}px</span>
                </div>
              </div>

              {/* Border Color */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={shapeProps.borderColor || '#ffffff'}
                    onChange={(e) => updateShapeProperty({ borderColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={shapeProps.borderColor || '#ffffff'}
                    onChange={(e) => updateShapeProperty({ borderColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Border Style */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Style</label>
                <select
                  value={shapeProps.borderStyle || 'solid'}
                  onChange={(e) => updateShapeProperty({ borderStyle: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </div>

              {/* Border Effect */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Effect</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'center', label: 'Center' },
                    { value: 'inner', label: 'Inner' },
                    { value: 'outer', label: 'Outer' }
                  ].map((effect) => (
                    <button
                      key={effect.value}
                      onClick={() => updateShapeProperty({ borderEffect: effect.value as BorderEffect })}
                      className={`px-3 py-2 rounded text-sm ${
                        shapeProps.borderEffect === effect.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Effects Settings */}
      {activeTab === 'effects' && (
        <div className="space-y-6">
          {/* Outer Shadow */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={shapeProps.shadowEnabled || false}
                onChange={(e) => updateShapeProperty({ shadowEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-white font-medium">Outer Shadow</label>
            </div>

            {shapeProps.shadowEnabled && (
              <div className="space-y-3 ml-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">X Offset</label>
                    <input
                      type="number"
                      value={shapeProps.shadowOffsetX || 4}
                      onChange={(e) => updateShapeProperty({ shadowOffsetX: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Y Offset</label>
                    <input
                      type="number"
                      value={shapeProps.shadowOffsetY || 4}
                      onChange={(e) => updateShapeProperty({ shadowOffsetY: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Blur</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={shapeProps.shadowBlur || 8}
                    onChange={(e) => updateShapeProperty({ shadowBlur: Number(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-400">{shapeProps.shadowBlur || 8}px</span>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={shapeProps.shadowColor || 'rgba(0, 0, 0, 0.3)'}
                    onChange={(e) => updateShapeProperty({ shadowColor: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    placeholder="rgba(0, 0, 0, 0.3)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Inner Shadow */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={shapeProps.innerShadowEnabled || false}
                onChange={(e) => updateShapeProperty({ innerShadowEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-white font-medium">Inner Shadow</label>
            </div>

            {shapeProps.innerShadowEnabled && (
              <div className="space-y-3 ml-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">X Offset</label>
                    <input
                      type="number"
                      value={shapeProps.innerShadowOffsetX || 2}
                      onChange={(e) => updateShapeProperty({ innerShadowOffsetX: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Y Offset</label>
                    <input
                      type="number"
                      value={shapeProps.innerShadowOffsetY || 2}
                      onChange={(e) => updateShapeProperty({ innerShadowOffsetY: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Blur</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={shapeProps.innerShadowBlur || 4}
                    onChange={(e) => updateShapeProperty({ innerShadowBlur: Number(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-400">{shapeProps.innerShadowBlur || 4}px</span>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={shapeProps.innerShadowColor || 'rgba(0, 0, 0, 0.3)'}
                    onChange={(e) => updateShapeProperty({ innerShadowColor: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    placeholder="rgba(0, 0, 0, 0.3)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Glow Effect */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={shapeProps.glowEnabled || false}
                onChange={(e) => updateShapeProperty({ glowEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-white font-medium">Glow Effect</label>
            </div>

            {shapeProps.glowEnabled && (
              <div className="space-y-3 ml-6">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Size</label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={shapeProps.glowSize || 10}
                    onChange={(e) => updateShapeProperty({ glowSize: Number(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-400">{shapeProps.glowSize || 10}px</span>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={shapeProps.glowColor || '#ffffff'}
                      onChange={(e) => updateShapeProperty({ glowColor: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={shapeProps.glowColor || '#ffffff'}
                      onChange={(e) => updateShapeProperty({ glowColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Picker Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Select Background Image</h3>
              <button
                onClick={() => setShowImagePicker(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            {/* Tab Selection */}
            <div className="flex space-x-1 bg-gray-700 rounded-lg p-1 mb-4">
              <button
                onClick={() => setImagePickerTab('local')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  imagePickerTab === 'local'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <HardDrive size={16} />
                Local Images
              </button>
              <button
                onClick={() => {
                  setImagePickerTab('server');
                  if (serverImages.length === 0) {
                    loadServerImages();
                  }
                }}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  imagePickerTab === 'server'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <Server size={16} />
                Server Images
              </button>
            </div>
            
            {/* Content Area */}
            <div className="overflow-y-auto max-h-96">
              {/* Local Images Tab */}
              {imagePickerTab === 'local' && (
                <div className="space-y-2">
                  {mediaLibrary
                    .filter(item => item.type === 'image')
                    .map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleImageSelect(item)}
                        className="flex items-center space-x-3 p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-white font-medium">{item.name}</div>
                          <div className="text-sm text-gray-400">
                            {item.width && item.height ? `${item.width}×${item.height}` : 'Image'}
                          </div>
                        </div>
                        <div className="text-xs text-blue-400 font-medium">LOCAL</div>
                      </div>
                    ))
                  }
                  
                  {mediaLibrary.filter(item => item.type === 'image').length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <HardDrive size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No local images available.</p>
                      <p className="text-sm mt-1">Upload images to your media library first.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Server Images Tab */}
              {imagePickerTab === 'server' && (
                <div className="space-y-2">
                  {isLoadingServerImages ? (
                    <div className="text-center py-8 text-gray-400">
                      <Loader2 size={48} className="mx-auto mb-2 opacity-50 animate-spin" />
                      <p>Loading server images...</p>
                    </div>
                  ) : serverImageError ? (
                    <div className="text-center py-8 text-gray-400">
                      <Server size={48} className="mx-auto mb-2 opacity-50" />
                      <p>{serverImageError}</p>
                      <button
                        onClick={loadServerImages}
                        className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <RefreshCw size={14} className="inline mr-1" />
                        Retry
                      </button>
                    </div>
                  ) : (
                    <>
                      {serverImages.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleImageSelect(item)}
                          className="flex items-center space-x-3 p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                        >
                          {item.thumbnail && (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-white font-medium">{item.name}</div>
                            <div className="text-sm text-gray-400">
                              {item.width && item.height ? `${item.width}×${item.height}` : 'Image'}
                            </div>
                          </div>
                          <div className="text-xs text-green-400 font-medium">SERVER</div>
                        </div>
                      ))}
                      
                      {serverImages.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Server size={48} className="mx-auto mb-2 opacity-50" />
                          <p>No server images available.</p>
                          <p className="text-sm mt-1">Upload images to the server first.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer with refresh button for server tab */}
            {imagePickerTab === 'server' && !isLoadingServerImages && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={loadServerImages}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh Server Images
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};
