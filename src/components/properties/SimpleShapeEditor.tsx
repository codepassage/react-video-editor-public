import React, { useState, useRef, useEffect } from 'react';
import { Palette, Image, Upload, HardDrive, Server, RefreshCw, Loader2 } from 'lucide-react';
import type { TimelineClip, MediaItem, MediaType } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { apiClient } from '../../api/client';

interface SimpleShapeProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: any) => void;
}

// SimpleShape 속성 인터페이스
interface SimpleShapeProperties {
  backgroundType: 'image' | 'color' | 'gradient';
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'; // ✅ none, scale-down 추가
  backgroundPosition?: string;
  borderRadius?: number;
  gradient?: {
    type: 'linear' | 'radial' | 'conic';
    angle?: number;
    centerX?: number;
    centerY?: number;
    stops: Array<{ color: string; position: number }>;
  };
}

export const SimpleShapeEditor: React.FC<SimpleShapeProps> = ({ clip, onUpdate }) => {
  const { mediaLibrary } = useEditorStore();
  const [imageUrl, setImageUrl] = useState<string>(clip.mediaUrl || '');
  
  // SimpleShape 속성 상태
  const [backgroundType, setBackgroundType] = useState<'image' | 'color' | 'gradient'>(
    clip.simpleShapeProperties?.backgroundType || 'color'
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(
    clip.simpleShapeProperties?.backgroundColor || '#3b82f6'
  );
  const [backgroundFit, setBackgroundFit] = useState<string>(
    clip.simpleShapeProperties?.backgroundFit || 'fill' // ✅ 기본값을 fill로 변경
  );
  const [backgroundPosition, setBackgroundPosition] = useState<string>(
    clip.simpleShapeProperties?.backgroundPosition || 'center'
  );
  const [borderRadius, setBorderRadius] = useState<number>(
    clip.simpleShapeProperties?.borderRadius || 0
  );
  const [borderRadiusUnit, setBorderRadiusUnit] = useState<'px' | '%'>(
    clip.simpleShapeProperties?.borderRadiusUnit || 'px'
  );
  
  // Edge Fade 상태
  const [edgeFade, setEdgeFade] = useState<number>(
    clip.simpleShapeProperties?.edgeFade || 0
  );
  const [fadeType, setFadeType] = useState<string>(
    clip.simpleShapeProperties?.fadeType || 'radial'
  );
  
  // 서버 이미지 관련 상태
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTab, setImagePickerTab] = useState<'local' | 'server'>('local');
  const [serverImages, setServerImages] = useState<MediaItem[]>([]);
  const [isLoadingServerImages, setIsLoadingServerImages] = useState(false);
  const [serverImageError, setServerImageError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 단위 변환 함수
  const convertBorderRadiusUnit = (value: number, fromUnit: 'px' | '%', toUnit: 'px' | '%', clipWidth: number, clipHeight: number): number => {
    if (fromUnit === toUnit) return value;
    
    const minSize = Math.min(clipWidth, clipHeight);
    
    if (fromUnit === '%' && toUnit === 'px') {
      // % → px: 요소 크기 기준으로 계산
      return Math.round((value / 100) * minSize);
    } else if (fromUnit === 'px' && toUnit === '%') {
      // px → %: 요소 크기 기준으로 역계산
      return Math.round((value / minSize) * 100);
    }
    
    return value;
  };

  // 단위 변경 핸들러
  const handleUnitChange = (newUnit: 'px' | '%') => {
    const convertedValue = convertBorderRadiusUnit(
      borderRadius, 
      borderRadiusUnit, 
      newUnit, 
      clip.width, 
      clip.height
    );
    
    setBorderRadius(convertedValue);
    setBorderRadiusUnit(newUnit);
    updateSimpleShapeProperties({ 
      borderRadius: convertedValue,
      borderRadiusUnit: newUnit 
    });
  };

  // 1x1 픽셀 색상 이미지 생성 함수
  const createColorImage = (color: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
    }
    return canvas.toDataURL();
  };

  // 그래디언트 이미지 생성 함수
  const createGradientImage = (gradient: NonNullable<SimpleShapeProperties['gradient']>): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !gradient.stops || gradient.stops.length === 0) {
      return createColorImage('#3b82f6');
    }

    let gradientObject;
    const stops = gradient.stops.sort((a, b) => a.position - b.position);

    switch (gradient.type) {
      case 'linear':
        const angle = (gradient.angle || 0) * Math.PI / 180;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const length = Math.max(canvas.width, canvas.height) / 2;
        const x1 = centerX - Math.cos(angle) * length;
        const y1 = centerY - Math.sin(angle) * length;
        const x2 = centerX + Math.cos(angle) * length;
        const y2 = centerY + Math.sin(angle) * length;
        gradientObject = ctx.createLinearGradient(x1, y1, x2, y2);
        break;
        
      case 'radial':
        const centerXRad = (gradient.centerX || 50) * canvas.width / 100;
        const centerYRad = (gradient.centerY || 50) * canvas.height / 100;
        const radius = Math.max(canvas.width, canvas.height) / 2;
        gradientObject = ctx.createRadialGradient(centerXRad, centerYRad, 0, centerXRad, centerYRad, radius);
        break;
        
      case 'conic':
        // Conic gradient는 대체 방법으로 linear gradient 사용
        const angleRad = (gradient.angle || 0) * Math.PI / 180;
        const centerXConic = canvas.width / 2;
        const centerYConic = canvas.height / 2;
        const lengthConic = Math.max(canvas.width, canvas.height) / 2;
        const x1Conic = centerXConic - Math.cos(angleRad) * lengthConic;
        const y1Conic = centerYConic - Math.sin(angleRad) * lengthConic;
        const x2Conic = centerXConic + Math.cos(angleRad) * lengthConic;
        const y2Conic = centerYConic + Math.sin(angleRad) * lengthConic;
        gradientObject = ctx.createLinearGradient(x1Conic, y1Conic, x2Conic, y2Conic);
        break;
        
      default:
        return createColorImage('#3b82f6');
    }

    // 색상 스톱 추가
    stops.forEach(stop => {
      gradientObject.addColorStop(stop.position / 100, stop.color);
    });

    ctx.fillStyle = gradientObject;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL();
  };

  // 그래디언트 스톱 추가
  const addGradientStop = () => {
    const currentGradient = clip.simpleShapeProperties?.gradient || {
      type: 'linear' as const,
      angle: 0,
      centerX: 50,
      centerY: 50,
      stops: [
        { color: '#3b82f6', position: 0 },
        { color: '#1d4ed8', position: 100 }
      ]
    };
    
    const sortedStops = [...currentGradient.stops].sort((a, b) => a.position - b.position);
    let newPosition = 50;
    let newColor = '#ffffff';
    
    if (sortedStops.length >= 2) {
      let maxGap = 0;
      let bestPosition = 50;
      
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const gap = sortedStops[i + 1].position - sortedStops[i].position;
        if (gap > maxGap && gap > 10) {
          maxGap = gap;
          bestPosition = sortedStops[i].position + gap / 2;
        }
      }
      
      if (maxGap === 0) {
        const lastPosition = sortedStops[sortedStops.length - 1].position;
        if (lastPosition < 90) {
          bestPosition = Math.min(lastPosition + 20, 100);
        } else {
          const firstPosition = sortedStops[0].position;
          bestPosition = Math.max(firstPosition - 20, 0);
        }
      }
      
      newPosition = Math.round(bestPosition);
      
      const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', 
        '#6c5ce7', '#fd79a8', '#00b894', '#e17055'
      ];
      newColor = colors[Math.floor(Math.random() * colors.length)];
    }
    
    const newStop = { color: newColor, position: newPosition };
    const newGradient = {
      ...currentGradient,
      stops: [...currentGradient.stops, newStop]
    };
    
    updateSimpleShapeProperties({
      backgroundType: 'gradient',
      gradient: newGradient
    });
  };

  // 그래디언트 스톱 제거
  const removeGradientStop = (index: number) => {
    const currentGradient = clip.simpleShapeProperties?.gradient;
    if (currentGradient && currentGradient.stops.length > 2) {
      const newStops = currentGradient.stops.filter((_, i) => i !== index);
      updateSimpleShapeProperties({
        gradient: {
          ...currentGradient,
          stops: newStops
        }
      });
    }
  };

  // SimpleShape 속성 업데이트
  const updateSimpleShapeProperties = (updates: Partial<SimpleShapeProperties>) => {
    const newProperties = {
      backgroundType,
      backgroundColor,
      backgroundImageUrl: clip.simpleShapeProperties?.backgroundImageUrl,
      backgroundFit,
      backgroundPosition,
      borderRadius,
      borderRadiusUnit,
      edgeFade,
      fadeType,
      gradient: clip.simpleShapeProperties?.gradient,
      ...updates
    };
    
    // mediaUrl 업데이트
    let newMediaUrl = clip.mediaUrl;
    
    if (updates.backgroundType === 'color' || (updates.backgroundType === undefined && backgroundType === 'color')) {
      // 색상 배경인 경우: 1x1 색상 이미지 생성
      const color = updates.backgroundColor || backgroundColor;
      newMediaUrl = createColorImage(color);
      console.log('🎨 SimpleShape 색상 배경 생성:', {
        '색상': color,
        'Data URL': newMediaUrl.substring(0, 50) + '...'
      });
    } else if (updates.backgroundType === 'gradient' || (updates.backgroundType === undefined && backgroundType === 'gradient')) {
      // 그래디언트 배경인 경우: 그래디언트 이미지 생성
      const gradient = updates.gradient || newProperties.gradient;
      if (gradient && gradient.stops && gradient.stops.length > 0) {
        newMediaUrl = createGradientImage(gradient);
        console.log('🌈 SimpleShape 그래디언트 배경 생성:', {
          '그래디언트 타입': gradient.type,
          '색상 스톱 수': gradient.stops.length,
          'Data URL': newMediaUrl.substring(0, 50) + '...'
        });
      } else {
        // 그래디언트 데이터가 없으면 기본 색상 사용
        newMediaUrl = createColorImage('#3b82f6');
        console.log('⚠️ SimpleShape 그래디언트 데이터 없음, 기본색 사용');
      }
    } else if (updates.backgroundImageUrl || (backgroundType === 'image' && newProperties.backgroundImageUrl)) {
      // 이미지 배경인 경우: 이미지 URL 사용
      newMediaUrl = updates.backgroundImageUrl || newProperties.backgroundImageUrl;
      console.log('🖼️ SimpleShape 이미지 배경 설정:', {
        'URL': newMediaUrl,
        'URL 유형': newMediaUrl?.startsWith('http') ? '절대경로' : 
                   newMediaUrl?.startsWith('blob:') ? 'Blob URL' : 
                   newMediaUrl?.startsWith('data:') ? 'Data URL' : '기타'
      });
    }
    
    // 클립 업데이트
    onUpdate(clip.id, {
      simpleShapeProperties: newProperties,
      mediaUrl: newMediaUrl
    });
    
    setImageUrl(newMediaUrl || '');
  };

  // 배경 타입 변경
  const handleBackgroundTypeChange = (type: 'image' | 'color' | 'gradient') => {
    setBackgroundType(type);
    if (type === 'gradient') {
      // 그래디언트 선택 시 기본 그래디언트 생성
      updateSimpleShapeProperties({ 
        backgroundType: type,
        gradient: {
          type: 'linear',
          angle: 0,
          centerX: 50,
          centerY: 50,
          stops: [
            { color: '#3b82f6', position: 0 },
            { color: '#1d4ed8', position: 100 }
          ]
        }
      });
    } else {
      updateSimpleShapeProperties({ backgroundType: type });
    }
  };

  // 색상 변경
  const handleColorChange = (color: string) => {
    setBackgroundColor(color);
    updateSimpleShapeProperties({ 
      backgroundType: 'color',
      backgroundColor: color 
    });
  };

  // 로컬 이미지 업로드
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      
      console.log('🔍 SimpleShape Upload Image 선택:', {
        '파일명': file.name,
        'Blob URL': url,
        '클립 ID': clip.id.slice(-8)
      });
      
      setImageUrl(url);
      setBackgroundType('image');
      updateSimpleShapeProperties({
        backgroundType: 'image',
        backgroundImageUrl: url
      });
    }
  };

  // URL 직접 입력
  const handleUrlInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setImageUrl(url);
    
    if (url) {
      console.log('🔍 SimpleShape URL 직접 입력:', {
        'URL': url,
        '클립 ID': clip.id.slice(-8)
      });
      
      setBackgroundType('image');
      updateSimpleShapeProperties({
        backgroundType: 'image',
        backgroundImageUrl: url
      });
    }
  };

  // 서버 이미지 로딩
  const loadServerImages = async () => {
    setIsLoadingServerImages(true);
    setServerImageError(null);
    
    try {
      const files = await apiClient.getFiles();
      
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

  // 이미지 크기 가져오기
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

  // 서버 이미지 선택
  const handleServerImageSelect = (mediaItem: MediaItem) => {
    console.log('🔍 SimpleShape Server Image 선택:', {
      '원본 URL': mediaItem.url,
      '파일명': mediaItem.name,
      '타입': mediaItem.type
    });
    
    if (mediaItem.type === 'image' && mediaItem.url) {
      setImageUrl(mediaItem.url);
      setBackgroundType('image');
      updateSimpleShapeProperties({
        backgroundType: 'image',
        backgroundImageUrl: mediaItem.url
      });
      setShowImagePicker(false);
    }
  };

  // 서버 이미지 탭이 선택될 때 로딩
  useEffect(() => {
    if (showImagePicker && imagePickerTab === 'server' && serverImages.length === 0) {
      loadServerImages();
    }
  }, [showImagePicker, imagePickerTab]);
  
  // 클립 속성 변경 시 로컬 상태 업데이트
  useEffect(() => {
    if (clip.simpleShapeProperties) {
      const props = clip.simpleShapeProperties;
      setBackgroundType(props.backgroundType || 'color');
      setBackgroundColor(props.backgroundColor || '#3b82f6');
      setBackgroundFit(props.backgroundFit || 'cover');
      setBackgroundPosition(props.backgroundPosition || 'center');
      setBorderRadius(props.borderRadius || 0);
      setBorderRadiusUnit(props.borderRadiusUnit || 'px');
      setEdgeFade(props.edgeFade || 0);
      setFadeType(props.fadeType || 'radial');
    }
    
    if (clip.mediaUrl) {
      setImageUrl(clip.mediaUrl);
    }
  }, [clip.simpleShapeProperties, clip.mediaUrl]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">🧪</span>
        <h3 className="text-white font-medium">SimpleShape 테스트</h3>
      </div>

      {/* 배경 타입 선택 */}
      <div className="space-y-3">
        <label className="block text-sm text-gray-300">배경 타입</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleBackgroundTypeChange('color')}
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
            onClick={() => handleBackgroundTypeChange('gradient')}
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
            onClick={() => handleBackgroundTypeChange('image')}
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

      {/* 색상 배경 설정 */}
      {backgroundType === 'color' && (
        <div className="space-y-2">
          <label className="block text-sm text-gray-300">배경 색상</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
              placeholder="#3b82f6"
            />
          </div>
        </div>
      )}

      {/* 그래디언트 배경 설정 */}
      {backgroundType === 'gradient' && (
        <div className="space-y-4">
          {/* 그래디언트 타입 */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">그래디언트 타입</label>
            <select
              value={clip.simpleShapeProperties?.gradient?.type || 'linear'}
              onChange={(e) => {
                const currentStops = clip.simpleShapeProperties?.gradient?.stops || [
                  { color: '#3b82f6', position: 0 },
                  { color: '#1d4ed8', position: 100 }
                ];
                updateSimpleShapeProperties({
                  backgroundType: 'gradient',
                  gradient: {
                    type: e.target.value as any,
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

          {/* 각도 (Linear/Conic) */}
          {(clip.simpleShapeProperties?.gradient?.type === 'linear' || clip.simpleShapeProperties?.gradient?.type === 'conic') && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">각도</label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={clip.simpleShapeProperties?.gradient?.angle || 0}
                  onChange={(e) => updateSimpleShapeProperties({
                    gradient: {
                      ...clip.simpleShapeProperties?.gradient,
                      angle: Number(e.target.value)
                    }
                  })}
                  className="flex-1"
                />
                <span className="text-white text-sm w-12">{clip.simpleShapeProperties?.gradient?.angle || 0}°</span>
              </div>
            </div>
          )}

          {/* 중심점 (Radial/Conic) */}
          {(clip.simpleShapeProperties?.gradient?.type === 'radial' || clip.simpleShapeProperties?.gradient?.type === 'conic') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Center X</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={clip.simpleShapeProperties?.gradient?.centerX || 50}
                  onChange={(e) => updateSimpleShapeProperties({
                    gradient: {
                      ...clip.simpleShapeProperties?.gradient,
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
                  value={clip.simpleShapeProperties?.gradient?.centerY || 50}
                  onChange={(e) => updateSimpleShapeProperties({
                    gradient: {
                      ...clip.simpleShapeProperties?.gradient,
                      centerY: Number(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
          )}

          {/* 그래디언트 미리보기 */}
          {(clip.simpleShapeProperties?.gradient?.stops || []).length > 0 && (
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">미리보기</label>
              <div 
                className="w-full h-8 rounded border border-gray-600 relative"
                style={{
                  background: (() => {
                    const stops = clip.simpleShapeProperties?.gradient?.stops || [];
                    const type = clip.simpleShapeProperties?.gradient?.type || 'linear';
                    const angle = clip.simpleShapeProperties?.gradient?.angle || 0;
                    const centerX = clip.simpleShapeProperties?.gradient?.centerX || 50;
                    const centerY = clip.simpleShapeProperties?.gradient?.centerY || 50;
                    
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
                {/* 색상 스톱 인디케이터 */}
                {(clip.simpleShapeProperties?.gradient?.stops || []).map((stop, index) => (
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

          {/* 그래디언트 스톱 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-300">색상 스톱 ({(clip.simpleShapeProperties?.gradient?.stops || []).length}개)</label>
              <button
                onClick={addGradientStop}
                className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
                title="색상 스톱 추가"
              >
                + 색상 추가
              </button>
            </div>
            
            <div className="space-y-3">
              {(clip.simpleShapeProperties?.gradient?.stops || []).map((stop, index) => (
                <div key={index} className="p-3 bg-gray-750 rounded border border-gray-600">
                  {/* 색상 선택 */}
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => {
                        const newStops = [...(clip.simpleShapeProperties?.gradient?.stops || [])];
                        newStops[index] = { ...stop, color: e.target.value };
                        updateSimpleShapeProperties({
                          gradient: {
                            ...clip.simpleShapeProperties?.gradient,
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
                          const newStops = [...(clip.simpleShapeProperties?.gradient?.stops || [])];
                          newStops[index] = { ...stop, color: e.target.value };
                          updateSimpleShapeProperties({
                            gradient: {
                              ...clip.simpleShapeProperties?.gradient,
                              stops: newStops
                            }
                          });
                        }}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
                        placeholder="#ffffff"
                      />
                    </div>
                    {(clip.simpleShapeProperties?.gradient?.stops || []).length > 2 ? (
                      <button
                        onClick={() => removeGradientStop(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors min-w-[40px]"
                        title="색상 스톱 제거"
                      >
                        ×
                      </button>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center">
                        <span className="text-gray-500 text-sm" title="최소 2개 색상 필요">🔒</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 위치 슬라이더 */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      위치: <span className="font-mono">{stop.position}%</span>
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
                          const newStops = [...(clip.simpleShapeProperties?.gradient?.stops || [])];
                          newStops[index] = { ...stop, position: Number(e.target.value) };
                          updateSimpleShapeProperties({
                            gradient: {
                              ...clip.simpleShapeProperties?.gradient,
                              stops: newStops
                            }
                          });
                        }}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-xs text-gray-400 w-8">100%</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) => {
                          const newStops = [...(clip.simpleShapeProperties?.gradient?.stops || [])];
                          newStops[index] = { ...stop, position: Number(e.target.value) };
                          updateSimpleShapeProperties({
                            gradient: {
                              ...clip.simpleShapeProperties?.gradient,
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
            </div>
          </div>
        </div>
      )}

      {/* 둥근 테두리 설정 */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={borderRadius > 0}
            onChange={(e) => {
              const newRadius = e.target.checked ? (borderRadiusUnit === '%' ? 10 : 20) : 0;
              setBorderRadius(newRadius);
              updateSimpleShapeProperties({ borderRadius: newRadius });
            }}
            className="w-4 h-4"
          />
          <label className="text-white text-sm">둥근 테두리</label>
        </div>
        
        {borderRadius > 0 && (
          <div className="space-y-3">
            {/* 단위 선택 */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">단위</label>
              <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => handleUnitChange('px')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${borderRadiusUnit === 'px'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                >
                  px
                </button>
                <button
                  onClick={() => handleUnitChange('%')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${borderRadiusUnit === '%'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                >
                  %
                </button>
              </div>
            </div>
            
            {/* 반지름 조절 */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                테두리 반지름: <span className="font-mono">{borderRadius}{borderRadiusUnit}</span>
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400 w-6">0</span>
                <input
                  type="range"
                  min="0"
                  max={borderRadiusUnit === '%' ? 50 : 100}
                  step="1"
                  value={borderRadius}
                  onChange={(e) => {
                    const newRadius = Number(e.target.value);
                    setBorderRadius(newRadius);
                    updateSimpleShapeProperties({ borderRadius: newRadius });
                  }}
                  className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-400 w-8">{borderRadiusUnit === '%' ? '50%' : '100'}</span>
                <input
                  type="number"
                  min="0"
                  max={borderRadiusUnit === '%' ? 50 : 100}
                  value={borderRadius}
                  onChange={(e) => {
                    const newRadius = Number(e.target.value);
                    setBorderRadius(newRadius);
                    updateSimpleShapeProperties({ borderRadius: newRadius });
                  }}
                  className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center"
                />
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                {borderRadiusUnit === '%' 
                  ? '요소 크기에 비례하는 둥근 모서리 (반응형)'
                  : '고정된 크기의 둥근 모서리 (절대값)'
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edge Fade 설정 */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={edgeFade > 0}
            onChange={(e) => {
              const newFade = e.target.checked ? 20 : 0;
              setEdgeFade(newFade);
              updateSimpleShapeProperties({ edgeFade: newFade });
            }}
            className="w-4 h-4"
          />
          <label className="text-white text-sm">가장자리 페이드</label>
          <span className="text-xs text-gray-400">(부드러운 가장자리 효과)</span>
        </div>
        
        {edgeFade > 0 && (
          <div className="space-y-4">
            {/* 페이드 강도 슬라이더 */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                페이드 강도: <span className="font-mono">{edgeFade}%</span>
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400 w-6">0%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={edgeFade}
                  onChange={(e) => {
                    const newFade = Number(e.target.value);
                    setEdgeFade(newFade);
                    updateSimpleShapeProperties({ edgeFade: newFade });
                  }}
                  className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-400 w-8">100%</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={edgeFade}
                  onChange={(e) => {
                    const newFade = Number(e.target.value);
                    setEdgeFade(newFade);
                    updateSimpleShapeProperties({ edgeFade: newFade });
                  }}
                  className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center"
                />
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                높은 값일수록 가장자리가 더 부드럽게 사라집니다
              </div>
            </div>

            {/* 페이드 방향 선택 */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">페이드 방향</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setFadeType('radial');
                    updateSimpleShapeProperties({ fadeType: 'radial' });
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    fadeType === 'radial'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="text-lg mb-1">⭕</div>
                  <div className="text-xs text-gray-300">원형</div>
                </button>
                
                <button
                  onClick={() => {
                    setFadeType('linear-top');
                    updateSimpleShapeProperties({ fadeType: 'linear-top' });
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    fadeType === 'linear-top'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="text-lg mb-1">⬆️</div>
                  <div className="text-xs text-gray-300">위에서</div>
                </button>
                
                <button
                  onClick={() => {
                    setFadeType('linear-bottom');
                    updateSimpleShapeProperties({ fadeType: 'linear-bottom' });
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    fadeType === 'linear-bottom'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="text-lg mb-1">⬇️</div>
                  <div className="text-xs text-gray-300">아래서</div>
                </button>
                
                <button
                  onClick={() => {
                    setFadeType('linear-left');
                    updateSimpleShapeProperties({ fadeType: 'linear-left' });
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    fadeType === 'linear-left'
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="text-lg mb-1">⬅️</div>
                  <div className="text-xs text-gray-300">왼쪽서</div>
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                {fadeType === 'radial' && '중앙에서 바깥쪽으로 원형 페이드'}
                {fadeType === 'linear-top' && '위쪽 가장자리가 부드럽게 사라짐'}
                {fadeType === 'linear-bottom' && '아래쪽 가장자리가 부드럽게 사라짐'}
                {fadeType === 'linear-left' && '왼쪽 가장자리가 부드럽게 사라짐'}
                {fadeType === 'linear-right' && '오른쪽 가장자리가 부드럽게 사라짐'}
              </div>
            </div>

            {/* 고급 Edge Fade 조절 (Multi-Stop 시스템) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-300">고급 페이드 조절</label>
                <button
                  onClick={() => {
                    const currentStops = clip.simpleShapeProperties?.edgeFadeStops || [
                      { position: 0, opacity: 100 },
                      { position: edgeFade, opacity: 0 }
                    ];
                    
                    // 새 스톱 위치 계산 (기존 스톱들 사이의 중간점)
                    const sortedStops = [...currentStops].sort((a, b) => a.position - b.position);
                    let newPosition = 50;
                    
                    if (sortedStops.length >= 2) {
                      let maxGap = 0;
                      let bestPosition = 50;
                      
                      for (let i = 0; i < sortedStops.length - 1; i++) {
                        const gap = sortedStops[i + 1].position - sortedStops[i].position;
                        if (gap > maxGap && gap > 10) {
                          maxGap = gap;
                          bestPosition = sortedStops[i].position + gap / 2;
                        }
                      }
                      
                      if (maxGap === 0) {
                        const lastPosition = sortedStops[sortedStops.length - 1].position;
                        if (lastPosition < 90) {
                          bestPosition = Math.min(lastPosition + 15, 100);
                        } else {
                          const firstPosition = sortedStops[0].position;
                          bestPosition = Math.max(firstPosition - 15, 0);
                        }
                      }
                      
                      newPosition = Math.round(bestPosition);
                    }
                    
                    const newStop = { position: newPosition, opacity: 50 };
                    const newStops = [...currentStops, newStop];
                    
                    updateSimpleShapeProperties({
                      edgeFadeStops: newStops
                    });
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  title="페이드 조절점 추가"
                >
                  + 조절점 추가
                </button>
              </div>
              
              {/* Edge Fade 미리보기 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">페이드 미리보기</label>
                <div 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded border border-gray-600 relative"
                  style={{
                    maskImage: (() => {
                      const stops = clip.simpleShapeProperties?.edgeFadeStops || [
                        { position: 0, opacity: 100 },
                        { position: edgeFade, opacity: 0 }
                      ];
                      
                      const sortedStops = stops.sort((a, b) => a.position - b.position);
                      const stopStr = sortedStops.map(stop => `rgba(0,0,0,${stop.opacity / 100}) ${stop.position}%`).join(', ');
                      
                      switch (fadeType) {
                        case 'radial':
                          return `radial-gradient(circle at center, ${stopStr})`;
                        case 'linear-top':
                          return `linear-gradient(to bottom, ${stopStr})`;
                        case 'linear-bottom':
                          return `linear-gradient(to top, ${stopStr})`;
                        case 'linear-left':
                          return `linear-gradient(to right, ${stopStr})`;
                        case 'linear-right':
                          return `linear-gradient(to left, ${stopStr})`;
                        default:
                          return 'none';
                      }
                    })(),
                    WebkitMaskImage: (() => {
                      const stops = clip.simpleShapeProperties?.edgeFadeStops || [
                        { position: 0, opacity: 100 },
                        { position: edgeFade, opacity: 0 }
                      ];
                      
                      const sortedStops = stops.sort((a, b) => a.position - b.position);
                      const stopStr = sortedStops.map(stop => `rgba(0,0,0,${stop.opacity / 100}) ${stop.position}%`).join(', ');
                      
                      switch (fadeType) {
                        case 'radial':
                          return `radial-gradient(circle at center, ${stopStr})`;
                        case 'linear-top':
                          return `linear-gradient(to bottom, ${stopStr})`;
                        case 'linear-bottom':
                          return `linear-gradient(to top, ${stopStr})`;
                        case 'linear-left':
                          return `linear-gradient(to right, ${stopStr})`;
                        case 'linear-right':
                          return `linear-gradient(to left, ${stopStr})`;
                        default:
                          return 'none';
                      }
                    })()
                  }}
                >
                  {/* 조절점 인디케이터 */}
                  {(clip.simpleShapeProperties?.edgeFadeStops || []).map((stop, index) => (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 w-1 bg-white bg-opacity-70 transform -translate-x-0.5"
                      style={{ left: `${stop.position}%` }}
                      title={`위치: ${stop.position}%, 투명도: ${stop.opacity}%`}
                    >
                      <div className="w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-x-1 -translate-y-1" />
                    </div>
                  ))}
                </div>
                <div className="mt-1 text-xs text-gray-500 text-center">
                  조절점을 사용해 더 정밀한 페이드 효과를 만들 수 있습니다
                </div>
              </div>
              
              {/* Edge Fade 조절점 목록 */}
              <div className="space-y-3">
                {(clip.simpleShapeProperties?.edgeFadeStops || [
                  { position: 0, opacity: 100 },
                  { position: edgeFade, opacity: 0 }
                ]).map((stop, index) => (
                  <div key={index} className="p-3 bg-gray-750 rounded border border-gray-600">
                    {/* 조절점 헤더 */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-300 font-medium">
                        조절점 {index + 1}
                      </span>
                      {(clip.simpleShapeProperties?.edgeFadeStops || []).length > 2 ? (
                        <button
                          onClick={() => {
                            const currentStops = clip.simpleShapeProperties?.edgeFadeStops || [];
                            const newStops = currentStops.filter((_, i) => i !== index);
                            updateSimpleShapeProperties({
                              edgeFadeStops: newStops
                            });
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                          title="조절점 제거"
                        >
                          ×
                        </button>
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <span className="text-gray-500 text-xs" title="최소 2개 조절점 필요">🔒</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 위치 조절 */}
                    <div className="mb-3">
                      <label className="block text-sm text-gray-300 mb-2">
                        위치: <span className="font-mono">{stop.position}%</span>
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
                            const currentStops = clip.simpleShapeProperties?.edgeFadeStops || [];
                            const newStops = [...currentStops];
                            newStops[index] = { ...stop, position: Number(e.target.value) };
                            updateSimpleShapeProperties({
                              edgeFadeStops: newStops
                            });
                          }}
                          className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <span className="text-xs text-gray-400 w-8">100%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={stop.position}
                          onChange={(e) => {
                            const currentStops = clip.simpleShapeProperties?.edgeFadeStops || [];
                            const newStops = [...currentStops];
                            newStops[index] = { ...stop, position: Number(e.target.value) };
                            updateSimpleShapeProperties({
                              edgeFadeStops: newStops
                            });
                          }}
                          className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center"
                        />
                      </div>
                    </div>
                    
                    {/* 투명도 조절 */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        투명도: <span className="font-mono">{stop.opacity}%</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-400 w-6">0%</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={stop.opacity}
                          onChange={(e) => {
                            const currentStops = clip.simpleShapeProperties?.edgeFadeStops || [];
                            const newStops = [...currentStops];
                            newStops[index] = { ...stop, opacity: Number(e.target.value) };
                            updateSimpleShapeProperties({
                              edgeFadeStops: newStops
                            });
                          }}
                          className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <span className="text-xs text-gray-400 w-8">100%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={stop.opacity}
                          onChange={(e) => {
                            const currentStops = clip.simpleShapeProperties?.edgeFadeStops || [];
                            const newStops = [...currentStops];
                            newStops[index] = { ...stop, opacity: Number(e.target.value) };
                            updateSimpleShapeProperties({
                              edgeFadeStops: newStops
                            });
                          }}
                          className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-xs text-gray-400">
                💡 조절점을 추가하여 그래디언트처럼 정밀한 페이드 효과를 만들어보세요!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 이미지 배경 설정 */}
      {backgroundType === 'image' && (
        <>
          {/* 현재 이미지 미리보기 */}
          {imageUrl && (
            <div className="space-y-2">
              <label className="block text-sm text-gray-300">Current Image</label>
              <img
                src={imageUrl}
                alt="Simple Shape Preview"
                className="w-full h-32 object-cover rounded border border-gray-600"
                style={{ borderRadius: `${borderRadius}px` }}
                onLoad={() => {
                  console.log('✅ SimpleShape 미리보기 로드 성공:', imageUrl);
                }}
                onError={() => {
                  console.error('❌ SimpleShape 미리보기 로드 실패:', imageUrl);
                }}
              />
            </div>
          )}

          {/* 이미지 선택 버튼들 */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowImagePicker(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Image size={16} />
                <span>미디어에서 선택</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Upload size={16} />
                <span>업로드</span>
              </button>
            </div>
          </div>

          {/* URL 직접 입력 */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">또는 이미지 URL 입력</label>
            <input
              type="text"
              value={imageUrl}
              onChange={handleUrlInput}
              placeholder="http://localhost:2809/uploads/... or blob:..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
            />
          </div>

          {/* 이미지 핏 설정 */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">이미지 핏</label>
            <select
              value={backgroundFit}
              onChange={(e) => {
                setBackgroundFit(e.target.value);
                updateSimpleShapeProperties({ backgroundFit: e.target.value as any });
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="fill">Fill - 요소에 딱 맞게 늘이기 (찌그러짐 가능)</option>
              <option value="contain">Contain - 전체가 보이도록 크기 조절</option>
              <option value="cover">Cover - 영역을 가득 채우도록 크기 조절</option>
              <option value="none">None - 원본 크기 그대로</option>
              <option value="scale-down">Scale-down - none과 contain 중 작은 쪽</option>
            </select>
            
            {/* 옵션 설명 */}
            <div className="text-xs text-gray-400 mt-2">
              {backgroundFit === 'fill' && '이미지가 요소의 너비와 높이에 딱 맞게 찌그러지더라도 맞춤'}
              {backgroundFit === 'contain' && '이미지 전체가 보이도록 크기 조절. 비율 유지. 빈 공간이 생길 수 있음'}
              {backgroundFit === 'cover' && '요소 영역을 가득 채우도록 크기 조절. 비율 유지. 잘릴 수도 있음'}
              {backgroundFit === 'none' && '이미지 원본 크기 그대로 표시. 확대/축소 없음'}
              {backgroundFit === 'scale-down' && 'none과 contain 중 더 작은 쪽으로 적용. 이미지가 커지지 않음'}
            </div>
          </div>

          {/* 이미지 위치 설정 */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">이미지 위치</label>
            <select
              value={backgroundPosition}
              onChange={(e) => {
                setBackgroundPosition(e.target.value);
                updateSimpleShapeProperties({ backgroundPosition: e.target.value });
              }}
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
        </>
      )}

      {/* 테스트 정보 */}
      <div className="p-3 bg-gray-800 border border-gray-600 rounded">
        <div className="text-xs text-gray-400 space-y-1">
          <div><strong>타입:</strong> {backgroundType === 'color' ? '색상' : backgroundType === 'gradient' ? '그래디언트' : '이미지'}</div>
          {backgroundType === 'color' && (
            <div><strong>색상:</strong> {backgroundColor}</div>
          )}
          {backgroundType === 'gradient' && (
            <div><strong>그래디언트:</strong> {clip.simpleShapeProperties?.gradient?.type} ({(clip.simpleShapeProperties?.gradient?.stops || []).length}개 색상)</div>
          )}
          {backgroundType === 'image' && (
            <>
              <div><strong>URL:</strong> {imageUrl ? imageUrl.substring(0, 50) + (imageUrl.length > 50 ? '...' : '') : '없음'}</div>
              <div><strong>핏:</strong> {backgroundFit} | <strong>위치:</strong> {backgroundPosition}</div>
            </>
          )}
          <div><strong>둥근 테두리:</strong> {borderRadius}px</div>
          <div><strong>Edge Fade:</strong> {edgeFade}% ({fadeType})</div>
          <div><strong>방식:</strong> 단순한 &lt;img&gt; 태그 (Upload Image와 동일)</div>
        </div>
      </div>

      {/* 이미지 선택 모달 */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">이미지 선택</h3>
              <button
                onClick={() => setShowImagePicker(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            {/* 탭 선택 */}
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
                로컬 이미지
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
                서버 이미지
              </button>
            </div>
            
            {/* 컨텐츠 영역 */}
            <div className="overflow-y-auto max-h-96">
              {/* 로컬 이미지 탭 */}
              {imagePickerTab === 'local' && (
                <div className="space-y-2">
                  {mediaLibrary
                    .filter(item => item.type === 'image')
                    .map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleServerImageSelect(item)}
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
                      <p>로컬 이미지가 없습니다.</p>
                      <p className="text-sm mt-1">먼저 미디어 라이브러리에 이미지를 업로드하세요.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 서버 이미지 탭 */}
              {imagePickerTab === 'server' && (
                <div className="space-y-2">
                  {isLoadingServerImages ? (
                    <div className="text-center py-8 text-gray-400">
                      <Loader2 size={48} className="mx-auto mb-2 opacity-50 animate-spin" />
                      <p>서버 이미지를 불러오는 중...</p>
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
                        다시 시도
                      </button>
                    </div>
                  ) : (
                    <>
                      {serverImages.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleServerImageSelect(item)}
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
                          <p>서버 이미지가 없습니다.</p>
                          <p className="text-sm mt-1">먼저 서버에 이미지를 업로드하세요.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* 서버 탭일 때 새로고침 버튼 */}
            {imagePickerTab === 'server' && !isLoadingServerImages && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={loadServerImages}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  서버 이미지 새로고침
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
