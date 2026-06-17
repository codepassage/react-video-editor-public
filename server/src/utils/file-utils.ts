/**
 * 파일 관련 유틸리티
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MediaType } from '../types/upload.types';
import { appConfig } from '../config/app.config';

/**
 * 필요한 디렉토리들 생성
 */
export async function ensureDirectories(): Promise<void> {
  const directories = Object.values(appConfig.paths);

  await Promise.all(
    directories.map(async (dir) => {
      await fs.ensureDir(dir);
      console.log(`📁 Directory ensured: ${dir}`);
    })
  );

  console.log(`✅ All directories ensured: ${directories.length} directories`);
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * 고유한 파일명 생성
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = getFileExtension(originalName);
  const baseName = path.basename(originalName, ext);
  return `${uuidv4()}-${baseName}${ext}`;
}

/**
 * 파일 확장자를 통한 MIME 타입 추론
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);

  // 이미지
  if (appConfig.supportedImageTypes.includes(ext)) {
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.gif') return 'image/gif';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.bmp') return 'image/bmp';
    if (ext === '.svg') return 'image/svg+xml';
  }

  // 비디오
  if (appConfig.supportedVideoTypes.includes(ext)) {
    if (ext === '.mp4') return 'video/mp4';
    if (ext === '.webm') return 'video/webm';
    if (ext === '.mov') return 'video/quicktime';
    if (ext === '.avi') return 'video/x-msvideo';
    if (ext === '.mkv') return 'video/x-matroska';
    if (ext === '.flv') return 'video/x-flv';
  }

  // 오디오
  if (appConfig.supportedAudioTypes.includes(ext)) {
    if (ext === '.mp3') return 'audio/mpeg';
    if (ext === '.wav') return 'audio/wav';
    if (ext === '.ogg') return 'audio/ogg';
    if (ext === '.m4a') return 'audio/mp4';
    if (ext === '.aac') return 'audio/aac';
    if (ext === '.flac') return 'audio/flac';
  }

  return 'application/octet-stream';
}

/**
 * 확장자를 통한 미디어 타입 결정
 */
export function getMediaTypeFromExtension(filename: string): MediaType {
  const ext = getFileExtension(filename);

  if (appConfig.supportedImageTypes.includes(ext)) {
    return 'image';
  }

  if (appConfig.supportedVideoTypes.includes(ext)) {
    return 'video';
  }

  if (appConfig.supportedAudioTypes.includes(ext)) {
    return 'audio';
  }

  return 'unknown';
}

/**
 * MIME 타입을 통한 미디어 타입 결정
 */
export function getMediaTypeFromMimeType(mimetype: string): MediaType {
  if (appConfig.mimeTypes.image.includes(mimetype)) {
    return 'image';
  }

  if (appConfig.mimeTypes.video.includes(mimetype)) {
    return 'video';
  }

  if (appConfig.mimeTypes.audio.includes(mimetype)) {
    return 'audio';
  }

  return 'unknown';
}

/**
 * 파일이 지원되는 타입인지 확인
 */
export function isSupportedFileType(filename: string): boolean {
  const ext = getFileExtension(filename);

  return [
    ...appConfig.supportedImageTypes,
    ...appConfig.supportedVideoTypes,
    ...appConfig.supportedAudioTypes
  ].includes(ext);
}

/**
 * 폰트 파일인지 확인
 */
export function isFontFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return appConfig.supportedFontTypes.includes(ext);
}

/**
 * 파일 크기를 읽기 좋은 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 파일 경로 정규화
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * 안전한 파일명으로 변환 (특수문자 제거)
 */
export function sanitizeFilename(filename: string): string {
  // 위험한 문자들 제거
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w\-_.]/g, '');
}

/**
 * 파일 존재 여부 확인
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 디렉토리 내 파일 목록 조회 (필터링 포함)
 */
export async function listFiles(
  directory: string,
  filter?: (filename: string) => boolean
): Promise<string[]> {
  try {
    if (!(await fs.pathExists(directory))) {
      return [];
    }

    const files = await fs.readdir(directory);

    if (filter) {
      return files.filter(filter);
    }

    return files;
  } catch (error) {
    console.warn(`Failed to list files in ${directory}:`, error);
    return [];
  }
}

/**
 * 임시 파일 정리
 */
export async function cleanupTempFiles(directory: string, olderThanHours = 24): Promise<void> {
  try {
    const files = await listFiles(directory);
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime.getTime() < cutoffTime) {
        await fs.remove(filePath);
        console.log(`🧹 Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp files in ${directory}:`, error);
  }
}
