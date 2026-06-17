import React from 'react';
import { HardDrive, Server, RefreshCw, Loader2 } from 'lucide-react';
import type { MediaItem } from '../../../../types';
import { useEditorStore } from '../../../../store/editorStore';
import { apiClient } from '../../../../api/client';

interface ImagePickerModalProps {
  showImagePicker: boolean;
  setShowImagePicker: (show: boolean) => void;
  imagePickerTab: 'local' | 'server';
  setImagePickerTab: (tab: 'local' | 'server') => void;
  serverImages: MediaItem[];
  isLoadingServerImages: boolean;
  serverImageError: string | null;
  loadServerImages: () => void;
  onImageSelect: (mediaItem: MediaItem) => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  showImagePicker,
  setShowImagePicker,
  imagePickerTab,
  setImagePickerTab,
  serverImages,
  isLoadingServerImages,
  serverImageError,
  loadServerImages,
  onImageSelect
}) => {
  const { mediaLibrary } = useEditorStore();

  if (!showImagePicker) return null;

  return (
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
                    onClick={() => onImageSelect(item)}
                    className="flex items-center space-x-3 p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    {item.thumbnail && (
                      <img
                        src={apiClient.resolveUrl(item.thumbnail!)} // 상대 경로를 절대 URL로 변환
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
                      onClick={() => onImageSelect(item)}
                      className="flex items-center space-x-3 p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      {item.thumbnail && (
                        <img
                          src={apiClient.resolveUrl(item.thumbnail!)} // 상대 경로를 절대 URL로 변환
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
  );
};
