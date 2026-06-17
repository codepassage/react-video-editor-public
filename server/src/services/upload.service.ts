/**
 * 파일 업로드 서비스
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { FileUploadInfo } from '../types/upload.types';
import { extractFileMetadata } from '../utils/metadata-extractor';
import { mediaService } from './media.service.prisma';
import { getMediaTypeFromMimeType, getMediaTypeFromExtension } from '../utils/file-utils';
import { appConfig } from '../config/app.config';
import { buildUploadUrl } from '../utils/url-builder';

export class UploadService {

  /**
   * 단일 파일 업로드 처리
   */
  async handleSingleUpload(file: Express.Multer.File): Promise<FileUploadInfo> {
    const fileInfo = this.createFileInfo(file);
    const filePath = path.join(appConfig.paths.uploads, file.filename);

    // 메타데이터 추출
    await extractFileMetadata(filePath, fileInfo);
    
    // 데이터베이스에 파일 정보 저장
    await mediaService.saveFileMetadata(fileInfo);

    console.log(`💾 File uploaded:`, {
      id: fileInfo.id,
      name: fileInfo.originalName,
      type: fileInfo.mediaType,
      size: `${Math.round(fileInfo.size / 1024 / 1024 * 100) / 100}MB`,
      dimensions: fileInfo.width && fileInfo.height ? `${fileInfo.width}x${fileInfo.height}` : 'N/A',
      duration: fileInfo.duration ? `${fileInfo.duration}s` : 'N/A'
    });

    return fileInfo;
  }

  /**
   * 다중 파일 업로드 처리
   */
  async handleMultipleUpload(files: Express.Multer.File[]): Promise<FileUploadInfo[]> {
    const uploadPromises = files.map(file => this.handleSingleUpload(file));
    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`💾 Multiple files uploaded: ${uploadedFiles.length} files`);

    return uploadedFiles;
  }

  /**
   * 업로드된 파일 정보 객체 생성
   */
  private createFileInfo(file: Express.Multer.File): FileUploadInfo {
    const mediaType = getMediaTypeFromMimeType(file.mimetype);

    return {
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      fullUrl: buildUploadUrl(file.filename),
      uploadedAt: new Date().toISOString(),
      mediaType
    };
  }

  /**
   * 업로드 가능한 파일인지 검증
   */
  validateFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // MIME 타입 검증
    const allowedTypes = [
      ...appConfig.mimeTypes.image,
      ...appConfig.mimeTypes.video,
      ...appConfig.mimeTypes.audio
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.mimetype}`
      };
    }

    // 파일 크기 검증
    if (file.size > appConfig.fileSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size is ${appConfig.uploadLimit}`
      };
    }

    // 파일명 검증
    if (!file.originalname || file.originalname.trim() === '') {
      return {
        isValid: false,
        error: 'Invalid filename'
      };
    }

    return { isValid: true };
  }

  /**
   * 업로드 통계 조회
   */
  getUploadStats(files: FileUploadInfo[]): {
    totalFiles: number;
    totalSize: number;
    byType: Record<string, number>;
    bySizeRange: Record<string, number>;
  } {
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      byType: {} as Record<string, number>,
      bySizeRange: {
        'small (< 1MB)': 0,
        'medium (1-10MB)': 0,
        'large (10-100MB)': 0,
        'huge (> 100MB)': 0
      }
    };

    files.forEach(file => {
      // 타입별 통계
      stats.byType[file.mediaType] = (stats.byType[file.mediaType] || 0) + 1;

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
   * 파일 업로드 응답 생성
   */
  createUploadResponse(fileInfo: FileUploadInfo): {
    success: boolean;
    file: FileUploadInfo;
  } {
    return {
      success: true,
      file: fileInfo
    };
  }

  /**
   * 다중 파일 업로드 응답 생성
   */
  createMultipleUploadResponse(files: FileUploadInfo[]): {
    success: boolean;
    files: FileUploadInfo[];
    stats: any;
  } {
    return {
      success: true,
      files,
      stats: this.getUploadStats(files)
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
export const uploadService = new UploadService();
export default uploadService;
