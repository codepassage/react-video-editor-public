import { useState } from 'react';
import { MediaItem, MediaType } from '../../../types';
import { apiClient, fileUtils, UploadedFile, UploadProgress } from '../../../api/client';
import { mediaService } from '../services/mediaService';

/**
 * 📎 useFileUpload.ts - 파일 업로드 관리 훅
 * 
 * 미디어 라이브러리에서 파일 업로드와 관련된 모든 로직을 처리하는
 * 커스텀 훅입니다. 단일 및 다중 파일 업로드, 진행률 추적,
 * 에러 처리, 미디어 아이템 생성 등을 종합적으로 관리합니다.
 * 
 * 주요 기능:
 * - 단일/다중 파일 비동기 업로드
 * - 업로드 진행률 실시간 추적
 * - 성공/실패 상태 관리 및 피드백
 * - 업로드된 파일의 MediaItem 객체 생성
 * - MIME 타입 검증 및 미디어 타입 분류
 * - URL 경로 정규화 (상대/절대 경로 관리)
 * 
 * 업로드 플로우:
 * 1. 파일 선택 이벤트 발생
 * 2. 파일 유효성 검사 (MIME 타입, 크기 등)
 * 3. API 클라이언트를 통한 서버 업로드
 * 4. 진행률 콜백으로 사용자 피드백
 * 5. MediaItem 객체 생성 및 로컬 상태 업데이트
 * 6. 성공/실패 상태 처리
 * 
 * 상태 관리:
 * - isUploading: 업로드 진행 상태
 * - uploadError: 업로드 오류 메시지
 * - uploadSuccess: 업로드 성공 메시지
 * - uploadProgress: 업로드 진행률 정보
 * 
 * 에러 처리:
 * - 네트워크 오류
 * - 서버 오류 (413, 415, 500 등)
 * - 파일 타입 오류
 * - 파일 크기 제한 오류
 * 
 * 성능 최적화:
 * - AbortController로 업로드 취소 지원
 * - 업로드 진행률 실시간 업데이트
 * - 메모리 효율적 업로드 리소스 관리
 * 
 * 관련 모듈:
 * - API 클라이언트: 서버 통신
 * - 미디어 라이브러리: 로컬 상태 업데이트
 * - 2번 모듈: Clip Type System (미디어 타입 분류)
 * - 8번 모듈: State Management (전역 상태 연동)
 */
/**
 * useFileUpload 훅 - 파일 업로드 상태 및 로직 관리
 * 
 * 주요 책임:
 * 1. 업로드 상태 추적 및 업데이트
 * 2. 비동기 파일 업로드 처리
 * 3. 업로드된 파일의 MediaItem 변환
 * 4. 에러 및 성공 상태 관리
 * 5. 진행률 콜백 및 UI 업데이트
 * 
 * 반환값:
 * - 업로드 상태 값들 (isUploading, uploadError 등)
 * - 업로드 함수들 (uploadFiles, uploadSingleFile)
 * - 상태 초기화 함수들 (resetUploadState)
 */
export const useFileUpload = () => {
  // 업로드 상태
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // 업로드 진행상황 콜백 함수
  const handleUploadProgress = (progress: UploadProgress) => {
    setUploadProgress(progress);
  };

  // 업로드된 파일 처리
  const processUploadedFile = async (uploadedFile: UploadedFile): Promise<MediaItem> => {
    const mediaType = fileUtils.getMediaType(uploadedFile.mimetype) as MediaType;

    if (mediaType === 'unknown') {
      throw new Error(`Unsupported file type: ${uploadedFile.mimetype}`);
    }

    const relativePath = apiClient.getRelativePath(uploadedFile.filename);
    const absoluteUrl = apiClient.resolveUrl(relativePath);

    const mediaItem: MediaItem = {
      id: uploadedFile.id,
      type: mediaType,
      name: uploadedFile.originalName,
      url: relativePath, // 상대 경로 저장
      fileSize: uploadedFile.size,
      // 서버에서 반환한 메타데이터를 우선 사용
      width: uploadedFile.metadata?.width,
      height: uploadedFile.metadata?.height,
      duration: uploadedFile.metadata?.duration,
      thumbnail: uploadedFile.metadata?.thumbnail ? apiClient.getRelativePath(uploadedFile.metadata.thumbnail) : undefined
    };

    // 메타데이터가 없는 경우 클라이언트에서 가져오기
    if (!mediaItem.width || !mediaItem.height) {
      if (mediaType === 'image') {
        try {
          const dimensions = await mediaService.getImageDimensions(absoluteUrl);
          mediaItem.width = dimensions.width;
          mediaItem.height = dimensions.height;
        } catch (error) {
          console.warn('Failed to get image dimensions:', error);
        }
      } else if (mediaType === 'video') {
        try {
          const videoInfo = await mediaService.getVideoInfo(absoluteUrl);
          mediaItem.width = videoInfo.width;
          mediaItem.height = videoInfo.height;
          if (!mediaItem.duration) mediaItem.duration = videoInfo.duration;
        } catch (error) {
          console.warn('Failed to get video info:', error);
        }
      }
    }

    return mediaItem;
  };


  // 파일 업로드 핸들러
  const handleFileUpload = async (
    files: FileList | null,
    onSuccess?: (items: MediaItem[]) => void,
    onServerRefresh?: () => void
  ) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const fileArray = Array.from(files);

      // 파일 크기 검사 (1000MB = 1,073,741,824 bytes)
      const maxFileSize = 1000 * 1024 * 1024; // 1000MB
      const oversizedFiles = fileArray.filter(file => file.size > maxFileSize);

      if (oversizedFiles.length > 0) {
        setUploadError(`파일 크기 초과: ${oversizedFiles.map(f => f.name).join(', ')} (최대 1000MB)`);
        return;
      }

      const uploadedItems: MediaItem[] = [];

      if (fileArray.length === 1) {
        const uploadedFile = await apiClient.uploadFile(fileArray[0], handleUploadProgress);
        const mediaItem = await processUploadedFile(uploadedFile);
        uploadedItems.push(mediaItem);
        setUploadSuccess(`${uploadedFile.originalName} 업로드 완료!`);
      } else {
        const uploadedFiles = await apiClient.uploadFiles(fileArray, handleUploadProgress);

        for (const uploadedFile of uploadedFiles) {
          const mediaItem = await processUploadedFile(uploadedFile);
          uploadedItems.push(mediaItem);
        }

        setUploadSuccess(`${uploadedFiles.length}개 파일 업로드 완료!`);
      }

      // 성공 콜백 호출
      onSuccess?.(uploadedItems);
      onServerRefresh?.();

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(`업로드 실패 - 로컬 테스트는 "샘플 추가" 버튼을 사용하세요`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);

      setTimeout(() => {
        setUploadError(null);
        setUploadSuccess(null);
      }, 5000);
    }
  };

  // 업로드 상태 초기화
  const clearUploadState = () => {
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(null);
  };

  return {
    // 상태
    isUploading,
    uploadError,
    uploadSuccess,
    uploadProgress,
    
    // 함수
    handleFileUpload,
    processUploadedFile,
    clearUploadState,
  };
};