/**
 * 📁 media.service.ts - 미디어 파일 관리 서비스
 * 
 * 비디오 에디터에서 사용하는 모든 미디어 파일의 업로드, 저장, 조회를 담당하는 서비스
 * 이미지, 비디오, 오디오 파일의 메타데이터 추출 및 썸네일 생성 지원
 * 
 * 주요 기능:
 * - 미디어 파일 업로드 및 저장
 * - 파일 타입별 분류 (image, video, audio)
 * - 메타데이터 자동 추출 (해상도, 길이, 코덱 등)
 * - 썸네일 생성 (비디오/이미지)
 * - 파일 목록 조회 및 필터링
 * - URL 빌더를 통한 접근 경로 관리
 * 
 * 지원 형식:
 * - 비디오: MP4, AVI, MOV, MKV, WebM
 * - 오디오: MP3, WAV, AAC, OGG
 * - 이미지: JPG, PNG, GIF, WebP, SVG
 * 
 * 저장 구조:
 * - /uploads/ : 원본 파일
 * - /uploads/thumbs/ : 썸네일
 * - 메타데이터 캐싱으로 성능 최적화
 * 
 * 성능 최적화:
 * - 메타데이터 캐싱 시스템
 * - 비동기 썸네일 생성
 * - 파일 크기별 압축
 * - 중복 파일 감지
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MediaFile, MediaType, FileStats } from '../types/upload.types';
import { loadFileMetadata } from '../utils/metadata-extractor';
import { getMediaTypeFromExtension, getMimeType, listFiles } from '../utils/file-utils';
import { appConfig } from '../config/app.config';
import { buildUploadUrl } from '../utils/url-builder';

export class MediaService {

  /**
   * 업로드된 파일 목록 조회 (간단한 형태)
   * 기본적인 파일 정보만 제공 (성능 최적화)
   */
  async getMediaFiles(): Promise<FileStats[]> {
    // 업로드 폴더 존재 확인
    if (!await fs.pathExists(appConfig.paths.uploads)) {
      return [];
    }

    const files = await fs.readdir(appConfig.paths.uploads);
    const filesInfo = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(appConfig.paths.uploads, filename);
        const stats = await fs.stat(filePath);
        return {
          name: filename,
          url: `/uploads/${encodeURIComponent(filename)}`,           // 로컬 URL
          fullUrl: buildUploadUrl(filename),                        // 전체 URL (도메인 포함)
          size: stats.size,                                         // 파일 크기
          modified: stats.mtime,                                    // 수정 시간
        };
      })
    );

    return filesInfo;
  }

  /**
   * 미디어 파일 목록 조회 (상세 정보 포함)
   * 메타데이터, 썸네일, 타입 필터링 지원
   * 비디오 에디터의 메인 미디어 로드 메서드
   */
  async getDetailedMediaFiles(type?: MediaType): Promise<MediaFile[]> {
    // 업로드 폴더 존재 확인
    if (!await fs.pathExists(appConfig.paths.uploads)) {
      return [];
    }

    // 숨긴 파일 및 썸네일 파일 제외
    const files = await listFiles(appConfig.paths.uploads, filename =>
      !filename.startsWith('.') &&
      !filename.startsWith('thumb_')
    );

    const filesInfo = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(appConfig.paths.uploads, filename);
        const stats = await fs.stat(filePath);

        // 파일 확장자로 미디어 타입 판별
        const mediaType = getMediaTypeFromExtension(filename);
        const mimetype = getMimeType(filename);

        // 기본 파일 정보 객체 생성
        const fileInfo: MediaFile = {
          id: filename.split('-')[0] || uuidv4(),              // UUID 추출 또는 새로 생성
          originalName: filename,
          filename: filename,
          mimetype: mimetype,
          size: stats.size,
          url: `/uploads/${encodeURIComponent(filename)}`,
          uploadedAt: stats.birthtime.toISOString(),
          mediaType: mediaType,
        };

        // 저장된 메타데이터 로드 (해상도, 재생시간 등)
        const metadata = await loadFileMetadata(filename);
        if (metadata) {
          Object.assign(fileInfo, metadata); // 메타데이터 병합
        }

        return fileInfo;
      })
    );

    // 미디어 타입별 필터링
    let filteredFiles = filesInfo;
    if (type && ['image', 'video', 'audio'].includes(type)) {
      filteredFiles = filesInfo.filter(file => file.mediaType === type);
    }

    // 최신 업로드 순으로 정렬
    filteredFiles.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    console.log(`📂 Media files loaded: ${filteredFiles.length} files${type ? ` of type '${type}'` : ''}`);

    return filteredFiles;
  }

  /**
   * 특정 파일 정보 조회
   */
  async getFileInfo(filename: string): Promise<MediaFile | null> {
    const filePath = path.join(appConfig.paths.uploads, filename);

    if (!await fs.pathExists(filePath)) {
      return null;
    }

    try {
      const stats = await fs.stat(filePath);
      const mediaType = getMediaTypeFromExtension(filename);
      const mimetype = getMimeType(filename);

      const fileInfo: MediaFile = {
        id: filename.split('-')[0] || uuidv4(),
        originalName: filename,
        filename: filename,
        mimetype: mimetype,
        size: stats.size,
        url: `/uploads/${encodeURIComponent(filename)}`,
        uploadedAt: stats.birthtime.toISOString(),
        mediaType: mediaType,
      };

      // 메타데이터 로드
      const metadata = await loadFileMetadata(filename);
      if (metadata) {
        Object.assign(fileInfo, metadata);
      }

      return fileInfo;
    } catch (error) {
      console.warn(`Failed to get file info for ${filename}:`, error);
      return null;
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filename: string): Promise<boolean> {
    const filePath = path.join(appConfig.paths.uploads, filename);

    if (!await fs.pathExists(filePath)) {
      return false;
    }

    try {
      // 원본 파일 삭제
      await fs.remove(filePath);

      // 메타데이터 파일 삭제
      const metadataPath = path.join(appConfig.paths.uploads, `.metadata_${filename}.json`);
      if (await fs.pathExists(metadataPath)) {
        await fs.remove(metadataPath);
      }

      // 썸네일 삭제
      const thumbnailPath = path.join(appConfig.paths.uploads, `thumb_${filename}`);
      if (await fs.pathExists(thumbnailPath)) {
        await fs.remove(thumbnailPath);
      }

      // 비디오 썸네일 삭제 (.jpg 확장자)
      const videoThumbnailPath = path.join(appConfig.paths.uploads, `thumb_${filename}.jpg`);
      if (await fs.pathExists(videoThumbnailPath)) {
        await fs.remove(videoThumbnailPath);
      }

      console.log(`🗑️ File deleted: ${filename}`);
      return true;
    } catch (error) {
      console.warn(`Failed to delete file ${filename}:`, error);
      return false;
    }
  }

  /**
   * 파일 검색
   */
  async searchFiles(query: string, type?: MediaType): Promise<MediaFile[]> {
    const allFiles = await this.getDetailedMediaFiles(type);
    const lowercaseQuery = query.toLowerCase();

    return allFiles.filter(file =>
      file.originalName.toLowerCase().includes(lowercaseQuery) ||
      file.filename.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * 미디어 라이브러리 통계
   */
  async getLibraryStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<MediaType, number>;
    bySizeRange: Record<string, number>;
    recentUploads: MediaFile[];
  }> {
    const allFiles = await this.getDetailedMediaFiles();

    const stats = {
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, file) => sum + file.size, 0),
      byType: { image: 0, video: 0, audio: 0, unknown: 0 } as Record<MediaType, number>,
      bySizeRange: {
        'small (< 1MB)': 0,
        'medium (1-10MB)': 0,
        'large (10-100MB)': 0,
        'huge (> 100MB)': 0
      },
      recentUploads: allFiles.slice(0, 5) // 최근 5개
    };

    allFiles.forEach(file => {
      // 타입별 통계
      stats.byType[file.mediaType]++;

      // 크기별 통계
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB < 1) {
        stats.bySizeRange['small (< 1MB)']++;
      } else if (sizeMB < 10) {
        stats.bySizeRange['medium (1-10MB)']++;
      } else if (sizeMB < 100) {
        stats.bySizeRange['large (10-100MB)']++;
      } else {
        stats.bySizeRange['huge (> 100MB)']++;
      }
    });

    return stats;
  }

  /**
   * 오래된 파일 정리
   */
  async cleanupOldFiles(olderThanDays = 30): Promise<number> {
    const files = await this.getDetailedMediaFiles();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleanedCount = 0;

    for (const file of files) {
      const uploadDate = new Date(file.uploadedAt);
      if (uploadDate < cutoffDate) {
        const success = await this.deleteFile(file.filename);
        if (success) {
          cleanedCount++;
        }
      }
    }

    console.log(`🧹 Cleaned up ${cleanedCount} old files`);
    return cleanedCount;
  }

  /**
   * 파일 목록 API 응답 생성
   */
  createFilesResponse(files: MediaFile[]): {
    success: boolean;
    files: MediaFile[];
    totalCount: number;
    stats?: any;
  } {
    return {
      success: true,
      files,
      totalCount: files.length
    };
  }

  /**
   * 에러 응답 생성
   */
  createErrorResponse(error: string, details?: string): {
    success: false;
    error: string;
    details?: string;
  } {
    return {
      success: false,
      error,
      details
    };
  }
}

// 싱글톤 인스턴스
export const mediaService = new MediaService();
export default mediaService;
