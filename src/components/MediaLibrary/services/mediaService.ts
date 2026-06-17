/**
 * 📂 mediaService.ts - 미디어 라이브러리 서비스 모듈
 * 
 * React Video Editor v1의 미디어 라이브러리 시스템에서 사용되는 
 * 미디어 파일 처리 및 서버 통신을 담당하는 서비스 모듈입니다.
 * 
 * 🎯 주요 기능:
 * - 이미지/비디오 메타데이터 추출 (크기, 길이 등)
 * - 서버 미디어 파일 목록 불러오기
 * - 미디어 파일 URL 관리 (상대/절대 경로 변환)
 * - 로컬 라이브러리와의 중복 검사
 * - 에러 처리 및 사용자 친화적 메시지 제공
 * 
 * 🏗️ 아키텍처:
 * ```
 * MediaLibrary Component
 * ├── mediaService.loadServerMedia() - 서버 파일 목록 조회
 * ├── mediaService.getImageDimensions() - 이미지 크기 분석
 * ├── mediaService.getVideoInfo() - 비디오 메타데이터 추출
 * └── mediaService.canAddServerMediaToLocal() - 중복 검사
 * ```
 * 
 * 🔧 처리 흐름:
 * 1. API 클라이언트를 통한 서버 파일 목록 조회
 * 2. UploadedFile을 MediaItem으로 변환
 * 3. 누락된 메타데이터 동적 추출 (크기, 길이)
 * 4. 상대 경로로 URL 정규화
 * 5. 에러 상황별 친화적 메시지 제공
 * 
 * 📊 지원 미디어 타입:
 * - 이미지: PNG, JPG, GIF, WebP 등
 * - 비디오: MP4, WebM, AVI, MOV 등
 * - 오디오: MP3, WAV, AAC, OGG 등
 * - 텍스트: TXT, JSON 등
 * 
 * 🌐 네트워크 최적화:
 * - 메타데이터 캐싱 지원
 * - 병렬 메타데이터 추출 처리
 * - 네트워크 에러 복구 로직
 * - 상대 경로 기반 URL 관리
 * 
 * 🔗 연관 모듈:
 * - MediaLibrary 컴포넌트: UI 표시 및 사용자 상호작용
 * - API Client: 서버 통신 추상화 레이어
 * - MediaItem 타입: 표준화된 미디어 데이터 구조
 * - 업로드 서비스: 파일 업로드 후 라이브러리 갱신
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.2
 */

import { MediaItem, MediaType } from '../../../types';
import { apiClient, UploadedFile } from '../../../api/client';

/**
 * 이미지 파일의 실제 크기(해상도) 추출
 * 
 * @function getImageDimensions
 * @param url - 이미지 파일의 URL (절대 경로 또는 상대 경로)
 * @returns Promise<{width: number, height: number}> 이미지의 가로x세로 픽셀 크기
 * @throws Error 이미지 로드 실패 시 오류 발생
 * 
 * @description
 * HTML Image 객체를 사용하여 이미지 파일의 실제 해상도를 비동기적으로 추출합니다.
 * 서버에서 제공된 메타데이터가 누락되었거나 부정확할 때 사용됩니다.
 * 
 * 🔍 처리 과정:
 * 1. 새로운 Image 객체 생성
 * 2. onload 이벤트로 메타데이터 추출 대기
 * 3. naturalWidth/naturalHeight를 사용하여 원본 크기 반환
 * 4. 로드 실패 시 적절한 에러 메시지와 함께 reject
 * 
 * 💡 사용 예시:
 * ```typescript
 * try {
 *   const dimensions = await getImageDimensions('/uploads/image.jpg');
 *   console.log(`이미지 크기: ${dimensions.width}x${dimensions.height}`);
 * } catch (error) {
 *   console.error('이미지 크기를 가져올 수 없습니다:', error);
 * }
 * ```
 * 
 * ⚡ 성능 고려사항:
 * - 이미지 다운로드가 완료되어야 크기 정보 추출 가능
 * - 대용량 이미지의 경우 시간이 오래 걸릴 수 있음
 * - 동시에 여러 이미지를 처리할 때 네트워크 대역폭 고려 필요
 */
export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};

/**
 * 비디오 파일의 메타데이터 추출 (크기, 재생시간)
 * 
 * @function getVideoInfo
 * @param url - 비디오 파일의 URL (절대 경로 또는 상대 경로)
 * @returns Promise<{width: number, height: number, duration: number}> 비디오의 해상도와 재생시간
 * @throws Error 비디오 로드 실패 시 오류 발생
 * 
 * @description
 * HTML Video 엘리먼트를 사용하여 비디오 파일의 실제 메타데이터를 비동기적으로 추출합니다.
 * videoWidth, videoHeight, duration 속성을 통해 정확한 정보를 획득합니다.
 * 
 * 🔍 처리 과정:
 * 1. 임시 video 엘리먼트 생성 (DOM에 추가하지 않음)
 * 2. onloadedmetadata 이벤트로 메타데이터 로드 대기
 * 3. videoWidth, videoHeight, duration 속성에서 정보 추출
 * 4. 로드 실패 시 적절한 에러 메시지와 함께 reject
 * 
 * 💡 사용 예시:
 * ```typescript
 * try {
 *   const videoInfo = await getVideoInfo('/uploads/video.mp4');
 *   console.log(`비디오: ${videoInfo.width}x${videoInfo.height}, ${videoInfo.duration}초`);
 * } catch (error) {
 *   console.error('비디오 정보를 가져올 수 없습니다:', error);
 * }
 * ```
 * 
 * ⚡ 성능 고려사항:
 * - 비디오 헤더 정보만 로드하므로 전체 파일 다운로드 불필요
 * - 큰 비디오 파일도 메타데이터만 빠르게 추출 가능
 * - 네트워크 상태에 따라 응답 시간 가변적
 * 
 * 🎬 지원 형식:
 * - MP4 (H.264, H.265)
 * - WebM (VP8, VP9, AV1)
 * - OGV (Theora)
 * - MOV, AVI (브라우저 지원 범위 내)
 */
export const getVideoInfo = (url: string): Promise<{ width: number; height: number; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });
    };
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    video.src = url;
  });
};

/**
 * 서버에서 미디어 파일 목록을 불러와 MediaItem 배열로 변환
 * 
 * @function loadServerMedia
 * @returns Promise<{mediaItems: MediaItem[], error: string | null}> 미디어 아이템 목록과 에러 정보
 * 
 * @description
 * API 클라이언트를 통해 서버의 업로드된 파일 목록을 조회하고,
 * UploadedFile 객체들을 표준화된 MediaItem 형식으로 변환합니다.
 * 누락된 메타데이터(크기, 길이)는 동적으로 추출하여 보완합니다.
 * 
 * 🔄 변환 과정:
 * 1. API 클라이언트로 서버 파일 목록 요청
 * 2. UploadedFile → MediaItem 기본 변환
 * 3. 누락된 이미지/비디오 메타데이터 동적 추출
 * 4. 상대 경로 기반 URL 정규화
 * 5. 썸네일 URL 생성 (이미지의 경우 자기 자신)
 * 6. 병렬 처리를 통한 성능 최적화
 * 
 * 🛠️ 메타데이터 보완 로직:
 * - 이미지: width/height 누락 시 getImageDimensions() 호출
 * - 비디오: width/height/duration 누락 시 getVideoInfo() 호출
 * - 오디오: duration 누락 시에도 처리 가능 (향후 확장)
 * 
 * 🌐 URL 처리:
 * - 서버 응답: 절대 경로 또는 파일명
 * - 저장: 상대 경로로 정규화 (getRelativePath 사용)
 * - 표시: 필요 시 절대 URL로 변환 (resolveUrl 사용)
 * 
 * 🚨 에러 처리:
 * - 404 에러: API 엔드포인트 미구현 안내
 * - 네트워크 에러: 서버 연결 실패 안내
 * - 기타 에러: 일반적인 로드 실패 메시지
 * - 개별 파일 메타데이터 추출 실패는 경고로 처리 (전체 실패하지 않음)
 * 
 * 💡 사용 예시:
 * ```typescript
 * const result = await loadServerMedia();
 * if (result.error) {
 *   console.error('서버 미디어 로드 실패:', result.error);
 * } else {
 *   console.log('로드된 파일:', result.mediaItems.length);
 *   result.mediaItems.forEach(item => {
 *     console.log(`${item.name}: ${item.width}x${item.height}`);
 *   });
 * }
 * ```
 * 
 * ⚡ 성능 최적화:
 * - Promise.all을 통한 병렬 메타데이터 추출
 * - 실패한 개별 파일이 전체 로드를 방해하지 않음
 * - 캐시된 메타데이터 우선 사용
 * - 네트워크 요청 최소화
 */
export const loadServerMedia = async (): Promise<{
  mediaItems: MediaItem[];
  error: string | null;
}> => {
  try {
    const files = await apiClient.getFiles();

    // UploadedFile을 MediaItem으로 변환
    const mediaItems: MediaItem[] = await Promise.all(files.map(async file => {
      const mediaItem: MediaItem = {
        id: file.id,
        type: (file.mediaType === 'unknown' ? 'image' : file.mediaType) as MediaType,
        name: file.originalName,
        url: apiClient.getRelativePath(file.filename), // 상대 경로 저장
        fileSize: file.size,
        width: file.width,
        height: file.height,
        duration: file.duration,
        thumbnail: file.thumbnail || (file.mediaType === 'image' ? apiClient.getRelativePath(file.filename) : undefined) // 상대 경로 저장
      };

      // width/height가 없는 이미지/비디오의 경우 다시 가져오기
      if ((mediaItem.type === 'image' || mediaItem.type === 'video') && (!mediaItem.width || !mediaItem.height)) {
        console.log(`🔍 Getting dimensions for ${mediaItem.type}: ${mediaItem.name}`);

        const absoluteUrl = apiClient.resolveUrl(mediaItem.url!); // 절대 URL로 변환

        if (mediaItem.type === 'image') {
          try {
            const dimensions = await getImageDimensions(absoluteUrl);
            mediaItem.width = dimensions.width;
            mediaItem.height = dimensions.height;
            console.log(`✅ Image dimensions: ${dimensions.width}x${dimensions.height}`);
          } catch (error) {
            console.warn('Failed to get image dimensions:', error);
          }
        } else if (mediaItem.type === 'video') {
          try {
            const videoInfo = await getVideoInfo(absoluteUrl);
            mediaItem.width = videoInfo.width;
            mediaItem.height = videoInfo.height;
            mediaItem.duration = videoInfo.duration;
            console.log(`✅ Video dimensions: ${videoInfo.width}x${videoInfo.height}`);
          } catch (error) {
            console.warn('Failed to get video info:', error);
          }
        }
      }

      return mediaItem;
    }));

    console.log('📂 Loaded server media:', mediaItems);
    return { mediaItems, error: null };
  } catch (error: any) {
    console.warn('Failed to load server media:', error.message || error);

    // 404 에러인 경우 더 친절한 메시지 표시
    let errorMessage = '서버 미디어를 불러올 수 없습니다.';
    if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      errorMessage = '서버 API가 아직 준비되지 않았습니다. 서버에 /api/files 엔드포인트를 구현해주세요.';
    } else if (error.message?.includes('Network')) {
      errorMessage = '서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.';
    }

    return { mediaItems: [], error: errorMessage };
  }
};

/**
 * 서버 미디어 아이템의 로컬 라이브러리 추가 가능 여부 확인
 * 
 * @function canAddServerMediaToLocal
 * @param item - 확인할 서버 미디어 아이템
 * @param localMediaItems - 현재 로컬 라이브러리의 미디어 아이템 목록
 * @returns boolean 추가 가능하면 true, 이미 존재하면 false
 * 
 * @description
 * 서버 미디어 아이템이 로컬 라이브러리에 이미 존재하는지 URL 기반으로 중복을 검사합니다.
 * 사용자가 동일한 파일을 중복으로 추가하는 것을 방지하기 위한 유틸리티 함수입니다.
 * 
 * 🔍 중복 검사 기준:
 * - URL 완전 일치: item.url === localItem.url
 * - 상대 경로 정규화된 URL로 비교
 * - 파일명이나 ID가 아닌 실제 파일 경로로 판단
 * 
 * 💡 사용 예시:
 * ```typescript
 * const serverItem = { id: 'server-1', url: '/uploads/video.mp4', ... };
 * const localItems = [...]; // 현재 로컬 라이브러리
 * 
 * if (canAddServerMediaToLocal(serverItem, localItems)) {
 *   addMediaToLocal(serverItem);
 *   console.log('새 미디어 아이템이 추가되었습니다.');
 * } else {
 *   console.log('이미 라이브러리에 존재하는 파일입니다.');
 * }
 * ```
 * 
 * 🎯 사용 시나리오:
 * - 서버 미디어 목록에서 "로컬에 추가" 버튼 활성화/비활성화
 * - 일괄 추가 시 중복 파일 자동 제외
 * - 사용자에게 중복 경고 메시지 표시
 * 
 * ⚡ 성능 고려사항:
 * - Array.some()을 사용하여 조기 종료 최적화
 * - 로컬 라이브러리 크기가 클 때 O(n) 시간복잡도
 * - 필요시 Map 기반 캐싱으로 성능 개선 가능
 */
export const canAddServerMediaToLocal = (item: MediaItem, localMediaItems: MediaItem[]): boolean => {
  return !localMediaItems.some(localItem => localItem.url === item.url);
};

/**
 * 미디어 서비스 모듈의 통합된 API 인터페이스
 * 
 * @const mediaService
 * @description 
 * 미디어 라이브러리에서 사용되는 모든 서비스 함수들을 하나의 객체로 통합하여 제공합니다.
 * 외부 모듈에서 일관된 방식으로 미디어 관련 기능에 접근할 수 있도록 합니다.
 * 
 * 📦 포함된 기능:
 * - getImageDimensions: 이미지 해상도 추출
 * - getVideoInfo: 비디오 메타데이터 추출
 * - loadServerMedia: 서버 미디어 목록 로드
 * - canAddServerMediaToLocal: 중복 검사
 * 
 * 💡 사용 예시:
 * ```typescript
 * import { mediaService } from './services/mediaService';
 * 
 * // 서버 미디어 로드
 * const result = await mediaService.loadServerMedia();
 * 
 * // 이미지 크기 확인
 * const dimensions = await mediaService.getImageDimensions(imageUrl);
 * 
 * // 중복 검사
 * const canAdd = mediaService.canAddServerMediaToLocal(item, localItems);
 * ```
 * 
 * 🔧 확장성:
 * - 새로운 미디어 처리 기능 추가 시 이 객체에 포함
 * - 일관된 네이밍 컨벤션 및 에러 처리 패턴 유지
 * - 타입 안전성을 통한 개발 생산성 향상
 */
export const mediaService = {
  getImageDimensions,
  getVideoInfo,
  loadServerMedia,
  canAddServerMediaToLocal
};