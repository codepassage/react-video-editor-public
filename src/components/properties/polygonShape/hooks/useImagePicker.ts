import { useState, useEffect, useRef } from 'react';
import type { MediaItem, MediaType } from '../../../../types';
import { apiClient } from '../../../../api/client';

export const useImagePicker = () => {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTab, setImagePickerTab] = useState<'local' | 'server'>('local');
  const [serverImages, setServerImages] = useState<MediaItem[]>([]);
  const [isLoadingServerImages, setIsLoadingServerImages] = useState(false);
  const [serverImageError, setServerImageError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              url: apiClient.getRelativePath(file.filename), // 상대 경로 저장
              fileSize: file.size,
              width: file.width,
              height: file.height,
              thumbnail: file.thumbnail || apiClient.getRelativePath(file.filename) // 상대 경로 저장
            };

            if (!mediaItem.width || !mediaItem.height) {
              try {
                const dimensions = await getImageDimensions(apiClient.resolveUrl(mediaItem.url!)); // 절대 URL로 변환
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
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // 서버 이미지 탭이 선택될 때 로딩
  useEffect(() => {
    if (showImagePicker && imagePickerTab === 'server' && serverImages.length === 0) {
      loadServerImages();
    }
  }, [showImagePicker, imagePickerTab]);

  return {
    // 상태값들
    showImagePicker,
    setShowImagePicker,
    imagePickerTab,
    setImagePickerTab,
    serverImages,
    isLoadingServerImages,
    serverImageError,
    fileInputRef,
    
    // 함수들
    loadServerImages,
    getImageDimensions
  };
};
