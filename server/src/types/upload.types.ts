/**
 * 파일 업로드 관련 타입 정의
 */

export interface FileUploadInfo {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  fullUrl: string;
  uploadedAt: string;
  mediaType: MediaType;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
}

export type MediaType = 'image' | 'video' | 'audio' | 'unknown';

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  size?: number;
  thumbnail?: string;
}

export interface ImageMetadata extends MediaMetadata {
  width: number;
  height: number;
  format: string;
}

export interface VideoMetadata extends MediaMetadata {
  width: number;
  height: number;
  duration: number;
}

export interface AudioMetadata extends MediaMetadata {
  duration: number;
}

export interface MediaFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
  mediaType: MediaType;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
}

export interface FileStats {
  name: string;
  url: string;
  fullUrl: string;
  size: number;
  modified: Date;
}

export interface FontInfo {
  filename: string;
  path: string;
  fullPath: string;
  absolutePath: string;
  type: string;
  familyName: string;
  weight: string;
  size?: number;
}
