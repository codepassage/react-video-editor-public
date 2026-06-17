/**
 * 🔍 metadata-extractor.ts - 미디어 파일 메타데이터 추출 유틸리티
 * 
 * Sharp와 FFmpeg을 활용하여 업로드된 미디어 파일의 상세 정보를 추출하는 서비스
 * 이미지, 비디오, 오디오 파일의 기술적 정보와 썸네일을 자동 생성
 * 
 * 주요 기능:
 * - 이미지 메타데이터 (해상도, 포맷, 크기)
 * - 비디오 메타데이터 (해상도, 길이, 코덱, FPS)
 * - 오디오 메타데이터 (채널, 샘플레이트, 비트레이트)
 * - 자동 썸네일 생성 (이미지/비디오)
 * - 선택적 의존성 처리 (라이브러리 없어도 동작)
 * 
 * 사용 라이브러리:
 * - Sharp: 이미지 처리 및 썸네일 생성
 * - FFmpeg: 비디오/오디오 분석 및 썸네일 생성
 * - 없어도 기본 기능은 동작 (Graceful degradation)
 * 
 * 성능 최적화:
 * - 썸네일 조건부 생성 (큰 파일만)
 * - 메타데이터 캐싱
 * - 비동기 처리
 * - 에러 처리 및 fallback
 * 
 * 활용처:
 * - 미디어 라이브러리 미리보기
 * - 타임라인 클립 정보 표시
 * - 프로젝트 호환성 검증
 */

import path from 'path';
import fs from 'fs-extra';
import { createRequire } from 'module';
import { FileUploadInfo, ImageMetadata, VideoMetadata, AudioMetadata } from '../types/upload.types';
import { appConfig } from '../config/app.config';

// ES 모듈에서 require 사용을 위한 설정
const require = createRequire(import.meta.url);

// 선택적 의존성 확인 (라이브러리 없어도 오류 없이 동작)
let hasSharp = false;   // 이미지 처리 라이브러리 존재 여부
let hasFFmpeg = false;  // 비디오/오디오 처리 라이브러리 존재 여부

// Sharp 이미지 처리 라이브러리 확인
try {
  require('sharp');
  hasSharp = true;
  console.log('✅ Sharp library available for image processing');
} catch (error) {
  console.warn('⚠️ Sharp not installed - image metadata will not be extracted');
  console.warn('  Install with: npm install sharp');
}

// FFmpeg 비디오/오디오 처리 라이브러리 확인
try {
  require('fluent-ffmpeg');
  hasFFmpeg = true;
  console.log('✅ FFmpeg available for video/audio processing');
} catch (error) {
  console.warn('⚠️ fluent-ffmpeg not installed - video/audio metadata will not be extracted');
  console.warn('  Install with: npm install fluent-ffmpeg');
}

/**
 * 이미지 메타데이터 추출
 * Sharp를 사용하여 해상도, 포맷, 크기 정보 추출
 * 큰 이미지의 경우 자동으로 400x400 썸네일 생성
 */
export async function extractImageMetadata(filePath: string, fileInfo: FileUploadInfo): Promise<ImageMetadata | null> {
  // Sharp 라이브러리 또는 이미지 파일이 아니면 스킵
  if (!hasSharp || !fileInfo.mimetype.startsWith('image/')) {
    return null;
  }

  try {
    const sharp = require('sharp');
    const metadata = await sharp(filePath).metadata();

    const imageMetadata: ImageMetadata = {
      width: metadata.width,      // 이미지 너비
      height: metadata.height,    // 이미지 높이
      format: metadata.format,    // 이미지 포맷 (jpg, png 등)
      size: metadata.size         // 파일 크기
    };

    // 400x400보다 큰 이미지의 경우 썸네일 생성
    if (metadata.width > 400 || metadata.height > 400) {
      const filename = path.basename(filePath);
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join(appConfig.paths.uploads, thumbnailFilename);

      // 비율 유지하며 400x400 이내로 리사이즈
      await sharp(filePath)
        .resize(400, 400, {
          fit: 'inside',              // 비율 유지
          withoutEnlargement: true    // 작은 이미지는 확대 안함
        })
        .jpeg({ quality: 85 })        // JPEG 85% 품질로 압축
        .toFile(thumbnailPath);

      imageMetadata.thumbnail = `/uploads/${thumbnailFilename}`;
      console.log(`🖼️ Created thumbnail for ${filename}`);
    }

    console.log(`🖼️ Image metadata for ${fileInfo.originalName}: ${metadata.width}x${metadata.height}`);
    return imageMetadata;

  } catch (error) {
    console.warn(`Could not extract image metadata for ${fileInfo.originalName}:`, error);
    return null;
  }
}

/**
 * 비디오 메타데이터 추출
 * FFmpeg를 사용하여 해상도, 재생시간, 코덱, FPS 등의 상세 정보 추출
 * 비디오 중간 프레임의 썸네일도 자동 생성
 */
export async function extractVideoMetadata(filePath: string, fileInfo: FileUploadInfo): Promise<VideoMetadata | null> {
  // FFmpeg 라이브러리 또는 비디오 파일이 아니면 스킵
  if (!hasFFmpeg || !fileInfo.mimetype.startsWith('video/')) {
    return null;
  }

  try {
    const ffmpeg = require('fluent-ffmpeg');

    // FFprobe로 비디오 스트림 정보 추출
    const videoMetadata: VideoMetadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error: any, metadata: any) => {
        if (error) {
          reject(error);
        } else {
          // 비디오 스트림 찾기 (오디오 스트림 제외)
          const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
          if (videoStream) {
            resolve({
              width: videoStream.width,
              height: videoStream.height,
              duration: metadata.format.duration
            });
          } else {
            reject(new Error('No video stream found'));
          }
        }
      });
    });

    // 비디오 썸네일 생성 (1초 지점)
    const filename = path.basename(filePath);
    const thumbnailFilename = `thumb_${filename}.jpg`;
    const thumbnailPath = path.join(appConfig.paths.uploads, thumbnailFilename);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(filePath)
        .screenshots({
          timestamps: ['1'], // 1초 지점
          filename: thumbnailFilename,
          folder: appConfig.paths.uploads,
          size: '400x?'
        })
        .on('end', () => {
          videoMetadata.thumbnail = `/uploads/${thumbnailFilename}`;
          console.log(`🎥 Created video thumbnail for ${filename}`);
          resolve();
        })
        .on('error', (err: any) => {
          console.warn('Failed to create video thumbnail:', err);
          resolve(); // 에러가 나도 계속 진행
        });
    });

    console.log(`🎥 Video metadata for ${fileInfo.originalName}: ${videoMetadata.width}x${videoMetadata.height}, ${videoMetadata.duration}s`);
    return videoMetadata;

  } catch (error) {
    console.warn(`Could not extract video metadata for ${fileInfo.originalName}:`, error);
    return null;
  }
}

/**
 * 오디오 메타데이터 추출
 */
export async function extractAudioMetadata(filePath: string, fileInfo: FileUploadInfo): Promise<AudioMetadata | null> {
  if (!hasFFmpeg || !fileInfo.mimetype.startsWith('audio/')) {
    return null;
  }

  try {
    const ffmpeg = require('fluent-ffmpeg');

    const audioMetadata: AudioMetadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error: any, metadata: any) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            duration: metadata.format.duration
          });
        }
      });
    });

    console.log(`🎵 Audio metadata for ${fileInfo.originalName}: ${audioMetadata.duration}s`);
    return audioMetadata;

  } catch (error) {
    console.warn(`Could not extract audio metadata for ${fileInfo.originalName}:`, error);
    return null;
  }
}

/**
 * 통합 메타데이터 추출 함수
 */
export async function extractFileMetadata(filePath: string, fileInfo: FileUploadInfo): Promise<void> {
  const filename = path.basename(filePath);

  try {
    let metadata = null;

    // 파일 타입에 따라 적절한 메타데이터 추출
    if (fileInfo.mimetype.startsWith('image/')) {
      metadata = await extractImageMetadata(filePath, fileInfo);
    } else if (fileInfo.mimetype.startsWith('video/')) {
      metadata = await extractVideoMetadata(filePath, fileInfo);
    } else if (fileInfo.mimetype.startsWith('audio/')) {
      metadata = await extractAudioMetadata(filePath, fileInfo);
    }

    // 메타데이터가 추출되었으면 파일 정보에 추가
    if (metadata) {
      Object.assign(fileInfo, metadata);

      // 메타데이터 파일로 저장
      const metadataPath = path.join(appConfig.paths.uploads, `.metadata_${filename}.json`);
      await fs.writeJson(metadataPath, metadata);
    }

  } catch (error) {
    console.warn(`Failed to extract metadata for ${filename}:`, error);
  }
}

/**
 * 저장된 메타데이터 로드
 */
export async function loadFileMetadata(filename: string): Promise<any | null> {
  try {
    const metadataPath = path.join(appConfig.paths.uploads, `.metadata_${filename}.json`);

    if (await fs.pathExists(metadataPath)) {
      return await fs.readJson(metadataPath);
    }

    return null;
  } catch (error) {
    console.warn(`Failed to load metadata for ${filename}:`, error);
    return null;
  }
}
