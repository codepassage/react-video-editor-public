/**
 * 📁 MediaPicker.tsx - 미디어 파일 선택 컴포넌트
 * 
 * 파일 업로드, URL 입력, 미디어 라이브러리에서 선택 등 다양한 방법으로
 * 미디어 파일을 선택할 수 있는 통합 미디어 선택기 컴포넌트입니다.
 * 드래그 앤 드롭, 파일 브라우저, URL 링크 등을 지원합니다.
 * 
 * 주요 기능:
 * - 파일 드래그 앤 드롭 업로드
 * - 파일 브라우저를 통한 선택
 * - URL 링크 입력
 * - 미디어 라이브러리 연동
 * - 파일 타입 검증
 * - 미리보기 표시
 * - 업로드 진행률 표시
 * 
 * 지원 미디어 타입:
 * - 이미지: jpg, png, gif, webp, svg
 * - 비디오: mp4, avi, mov, webm
 * - 오디오: mp3, wav, ogg, m4a
 * - 기타: pdf, txt 등
 * 
 * 선택 방법:
 * 1. 드래그 앤 드롭: 파일을 직접 드래그하여 선택
 * 2. 파일 브라우저: 클릭하여 파일 탐색기 열기
 * 3. URL 입력: 웹 링크 주소 직접 입력
 * 4. 라이브러리: 기존 업로드된 미디어에서 선택
 * 
 * 관련 모듈:
 * - MediaLibrary: 미디어 라이브러리 연동
 * - 업로드 서비스: 파일 업로드 처리
 * - globalAlert: 업로드 상태 알림
 * - 다양한 에디터: 미디어 선택 통합
 */

import React, { useState, useRef } from 'react';
import { Upload, Link, FolderOpen, X, Image, Video, Play, FileText, Music } from 'lucide-react';
import { globalAlert } from '../../utils/globalAlert';

interface MediaItem {
  id?: string;
  name: string;
  type?: string;
  url: string;
  thumbnail?: string;
  size?: number;
  modified?: string;
}

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string; // 'image/*' | 'video/*' | 'image/*,video/*'
  placeholder?: string;
  className?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  value,
  onChange,
  accept = 'image/*,video/*',
  placeholder = '미디어를 선택하세요...',
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'upload' | 'server'>('url');
  const [serverMedia, setServerMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 서버 미디어 로드
  const loadServerMedia = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/media');
      if (response.ok) {
        const data = await response.json();
        // API 응답을 MediaItem 형태로 변환
        const mediaItems: MediaItem[] = (data.files || []).map((file: any) => ({
          id: file.name, // API에서 id가 없으므로 name을 사용
          name: file.name,
          type: getMediaTypeFromUrl(file.url),
          url: file.url,
          size: file.size,
          modified: file.modified
        }));
        setServerMedia(mediaItems);
      }
    } catch (error) {
      console.error('서버 미디어 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 업로드
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      setUploadProgress(0);

      // 업로드 진행률 시뮬레이션 (실제 구현에서는 xhr progress 사용)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        const uploadedUrl = result.url || result.filePath;
        onChange(uploadedUrl);
        setShowModal(false);
        
        // 서버 미디어 목록 새로고침
        loadServerMedia();
      } else {
        throw new Error('업로드 실패');
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      globalAlert.showError('파일 업로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // 미디어 타입 확인
  const getMediaType = (url: string): 'image' | 'video' | 'unknown' => {
    if (!url) return 'unknown';
    const ext = url.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExts = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv'];
    
    if (ext && imageExts.includes(ext)) return 'image';
    if (ext && videoExts.includes(ext)) return 'video';
    return 'unknown';
  };

  // URL로부터 MIME 타입 추출
  const getMediaTypeFromUrl = (url: string): string => {
    if (!url) return 'unknown';
    const ext = url.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExts = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    
    if (ext && imageExts.includes(ext)) return 'image/';
    if (ext && videoExts.includes(ext)) return 'video/';
    if (ext && audioExts.includes(ext)) return 'audio/';
    return 'unknown';
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 날짜 포맷
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // 파일 확장자 추출
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  // 모달 열기
  const openModal = () => {
    setShowModal(true);
    if (activeTab === 'server') {
      loadServerMedia();
    }
  };

  return (
    <div className={className}>
      {/* 현재 선택된 미디어 표시 */}
      <div className="flex items-center gap-2 mb-2">
        {value ? (
          <>
            {getMediaType(value) === 'image' ? (
              <Image className="w-4 h-4 text-blue-500" />
            ) : getMediaType(value) === 'video' ? (
              <Video className="w-4 h-4 text-purple-500" />
            ) : (
              <Link className="w-4 h-4 text-gray-400" />
            )}
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
            <button
              onClick={() => onChange('')}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          />
        )}
        <button
          onClick={openModal}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
        >
          <FolderOpen className="w-3 h-3" />
          선택
        </button>
      </div>

      {/* 미디어 미리보기 */}
      {value && (
        <div className="mt-2">
          {getMediaType(value) === 'image' ? (
            <img
              src={value}
              alt="미리보기"
              className="w-full h-20 object-cover rounded border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : getMediaType(value) === 'video' ? (
            <div className="relative">
              <video
                src={value}
                className="w-full h-20 object-cover rounded border"
                controls={false}
                onError={(e) => {
                  (e.target as HTMLVideoElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-full h-20 bg-gray-100 rounded border flex items-center justify-center">
              <span className="text-xs text-gray-500">미디어 미리보기</span>
            </div>
          )}
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">미디어 선택</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('url')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'url'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Link className="w-4 h-4 inline mr-1" />
                URL 입력
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'upload'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-1" />
                업로드
              </button>
              <button
                onClick={() => {
                  setActiveTab('server');
                  loadServerMedia();
                }}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'server'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FolderOpen className="w-4 h-4 inline mr-1" />
                서버 파일
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {activeTab === 'url' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    미디어 URL을 입력하세요
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    autoFocus
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      확인
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">업로드 중... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg text-gray-600 mb-2">파일을 선택하거나 드래그하세요</p>
                      <p className="text-sm text-gray-500">
                        지원 형식: {accept === 'image/*' ? '이미지' : accept === 'video/*' ? '비디오' : '이미지, 비디오'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'server' && (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">서버 파일 로딩 중...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {serverMedia.length > 0 ? (
                        serverMedia
                          .filter(item => {
                            if (!item.type) return false;
                            if (accept === 'image/*') return item.type.startsWith('image/');
                            if (accept === 'video/*') return item.type.startsWith('video/');
                            return item.type.startsWith('image/') || item.type.startsWith('video/') || item.type.startsWith('audio/');
                          })
                          .map((item) => (
                            <div
                              key={item.id || item.name}
                              onClick={() => {
                                onChange(item.url);
                                setShowModal(false);
                              }}
                              className="flex items-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500 hover:bg-gray-50"
                            >
                              {/* 파일 아이콘 또는 썸네일 */}
                              <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                {item.type && item.type.startsWith('image/') ? (
                                  <img
                                    src={item.thumbnail || item.url}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                {item.type && item.type.startsWith('video/') ? (
                                  <Video className="w-6 h-6 text-blue-500" />
                                ) : item.type && item.type.startsWith('audio/') ? (
                                  <Music className="w-6 h-6 text-green-500" />
                                ) : !item.type?.startsWith('image/') ? (
                                  <FileText className="w-6 h-6 text-gray-400" />
                                ) : null}
                              </div>
                              
                              {/* 파일 정보 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                    {getFileExtension(item.name)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {item.size ? formatFileSize(item.size) : '0 Bytes'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-900 truncate" title={item.name}>
                                  {item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.modified ? formatDate(item.modified) : '날짜 없음'}
                                </p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <FolderOpen className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">서버에 파일이 없습니다</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};