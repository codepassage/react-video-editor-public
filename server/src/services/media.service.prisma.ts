/**
 * 미디어 파일 관리 서비스 - Prisma 버전
 */

import { v4 as uuidv4 } from 'uuid';
import { MediaFile, FileStats } from '../types/upload.types';
import prisma from '../utils/prisma';
import { MediaType } from '@prisma/client';
import { buildMediaUrl } from '../utils/url-builder';

export class MediaService {

  /**
   * 업로드된 파일 목록 조회 (간단한 형태)
   */
  async getMediaFiles(): Promise<FileStats[]> {
    const files = await prisma.mediaFile.findMany({
      where: { deletedAt: null },
      orderBy: { uploadedAt: 'desc' }
    });

    return files.map(file => ({
      name: file.filename,
      url: file.url,
      fullUrl: buildMediaUrl(file.url),
      size: file.size,
      modified: file.uploadedAt
    }));
  }

  /**
   * 미디어 파일 목록 조회 (상세 정보 포함)
   */
  async getDetailedMediaFiles(type?: MediaType): Promise<MediaFile[]> {
    const whereClause = {
      deletedAt: null,
      ...(type && { mediaType: type })
    };

    const files = await prisma.mediaFile.findMany({
      where: whereClause,
      orderBy: { uploadedAt: 'desc' }
    });

    console.log(`📂 Media files loaded: ${files.length} files${type ? ` of type '${type}'` : ''}`);

    return files.map(file => this.mapToMediaFile(file));
  }

  /**
   * 특정 파일 정보 조회
   */
  async getFileInfo(filename: string): Promise<MediaFile | null> {
    const file = await prisma.mediaFile.findUnique({
      where: { filename }
    });

    if (!file || file.deletedAt) {
      return null;
    }

    return this.mapToMediaFile(file);
  }

  /**
   * 파일 메타데이터 저장/업데이트
   */
  async saveFileMetadata(fileInfo: Partial<MediaFile> & { filename: string }): Promise<MediaFile> {
    const upsertData = {
      filename: fileInfo.filename,
      originalName: fileInfo.originalName || fileInfo.filename,
      mimetype: fileInfo.mimetype || 'application/octet-stream',
      size: fileInfo.size || 0,
      mediaType: fileInfo.mediaType || MediaType.unknown,
      url: fileInfo.url || `/uploads/${encodeURIComponent(fileInfo.filename)}`,
      thumbnailUrl: fileInfo.thumbnailUrl,
      width: fileInfo.width,
      height: fileInfo.height,
      duration: fileInfo.duration,
      metadata: fileInfo.metadata || {}
    };

    const result = await prisma.mediaFile.upsert({
      where: { filename: fileInfo.filename },
      update: {
        ...upsertData,
        width: fileInfo.width,
        height: fileInfo.height,
        duration: fileInfo.duration,
        metadata: fileInfo.metadata
      },
      create: {
        id: fileInfo.id || uuidv4(),
        ...upsertData
      }
    });

    return this.mapToMediaFile(result);
  }

  /**
   * 파일 삭제 (소프트 삭제)
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const result = await prisma.mediaFile.update({
        where: { filename },
        data: { deletedAt: new Date() }
      });

      console.log(`🗑️ File soft-deleted: ${filename}`);
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
    const lowercaseQuery = query.toLowerCase();

    const files = await prisma.mediaFile.findMany({
      where: {
        deletedAt: null,
        ...(type && { mediaType: type }),
        OR: [
          { originalName: { contains: lowercaseQuery, mode: 'insensitive' } },
          { filename: { contains: lowercaseQuery, mode: 'insensitive' } }
        ]
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return files.map(file => this.mapToMediaFile(file));
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
    // 전체 파일 통계
    const aggregation = await prisma.mediaFile.aggregate({
      where: { deletedAt: null },
      _count: true,
      _sum: { size: true }
    });

    // 타입별 통계
    const typeStats = await prisma.mediaFile.groupBy({
      by: ['mediaType'],
      where: { deletedAt: null },
      _count: true
    });

    const byType = {
      image: 0,
      video: 0,
      audio: 0,
      unknown: 0
    } as Record<MediaType, number>;

    typeStats.forEach(stat => {
      byType[stat.mediaType] = stat._count;
    });

    // 최근 업로드 파일
    const recentFiles = await prisma.mediaFile.findMany({
      where: { deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
      take: 5
    });

    // 크기별 통계 계산
    const allFiles = await prisma.mediaFile.findMany({
      where: { deletedAt: null },
      select: { size: true }
    });

    const bySizeRange = {
      'small (< 1MB)': 0,
      'medium (1-10MB)': 0,
      'large (10-100MB)': 0,
      'huge (> 100MB)': 0
    };

    allFiles.forEach(file => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB < 1) {
        bySizeRange['small (< 1MB)']++;
      } else if (sizeMB < 10) {
        bySizeRange['medium (1-10MB)']++;
      } else if (sizeMB < 100) {
        bySizeRange['large (10-100MB)']++;
      } else {
        bySizeRange['huge (> 100MB)']++;
      }
    });

    return {
      totalFiles: aggregation._count,
      totalSize: aggregation._sum.size || 0,
      byType,
      bySizeRange,
      recentUploads: recentFiles.map(file => this.mapToMediaFile(file))
    };
  }

  /**
   * 오래된 파일 정리
   */
  async cleanupOldFiles(olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.mediaFile.updateMany({
      where: {
        uploadedAt: { lt: cutoffDate },
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });

    console.log(`🧹 Cleaned up ${result.count} old files`);
    return result.count;
  }

  /**
   * Prisma 모델을 MediaFile 타입으로 변환
   */
  private mapToMediaFile(dbFile: any): MediaFile {
    return {
      id: dbFile.id,
      originalName: dbFile.originalName,
      filename: dbFile.filename,
      mimetype: dbFile.mimetype,
      size: dbFile.size,
      url: dbFile.url,
      fullUrl: buildMediaUrl(dbFile.url),
      uploadedAt: dbFile.uploadedAt.toISOString(),
      mediaType: dbFile.mediaType as any, // Convert Prisma MediaType to upload.types MediaType
      thumbnailUrl: dbFile.thumbnailUrl,
      width: dbFile.width,
      height: dbFile.height,
      duration: dbFile.duration,
      metadata: dbFile.metadata || {}
    };
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