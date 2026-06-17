/**
 * 기존 미디어 파일 메타데이터를 PostgreSQL 데이터베이스로 마이그레이션
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs-extra';
import path from 'path';
import { MediaType } from '@prisma/client';

const prisma = new PrismaClient();

// 파일 확장자로부터 미디어 타입 결정
function getMediaTypeFromExtension(filename: string): MediaType {
  const ext = path.extname(filename).toLowerCase();
  
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  
  if (imageExts.includes(ext)) return MediaType.image;
  if (videoExts.includes(ext)) return MediaType.video;
  if (audioExts.includes(ext)) return MediaType.audio;
  return MediaType.unknown;
}

// MIME 타입 결정
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.flv': 'video/x-flv',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac'
  };
  
  return mimeMap[ext] || 'application/octet-stream';
}

async function migrateMediaFiles() {
  console.log('🚀 미디어 파일 마이그레이션 시작...');
  
  const uploadsDir = path.join(process.cwd(), 'server/uploads');
  
  // 업로드 디렉토리 확인
  if (!await fs.pathExists(uploadsDir)) {
    console.log('❌ 업로드 디렉토리가 존재하지 않습니다:', uploadsDir);
    return;
  }
  
  const files = await fs.readdir(uploadsDir);
  // 메타데이터 파일과 썸네일 제외
  const mediaFiles = files.filter(f => 
    !f.startsWith('.') && 
    !f.startsWith('thumb_') && 
    !f.includes('.metadata_')
  );
  
  console.log(`📁 발견된 미디어 파일: ${mediaFiles.length}개`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const filename of mediaFiles) {
    try {
      console.log(`\n📄 처리 중: ${filename}`);
      
      const filePath = path.join(uploadsDir, filename);
      const stats = await fs.stat(filePath);
      
      // 기존 파일이 이미 마이그레이션되었는지 확인
      const existing = await prisma.mediaFile.findUnique({
        where: { filename }
      });
      
      if (existing) {
        console.log(`⏭️  이미 존재하는 파일: ${filename}`);
        continue;
      }
      
      // 메타데이터 파일 로드 시도
      const metadataPath = path.join(uploadsDir, `.metadata_${filename}.json`);
      let metadata: any = {};
      
      if (await fs.pathExists(metadataPath)) {
        try {
          metadata = await fs.readJson(metadataPath);
          console.log(`  📋 메타데이터 발견`);
        } catch (error) {
          console.warn(`  ⚠️  메타데이터 파일 읽기 실패:`, error);
        }
      }
      
      // ID 추출 (파일명에서 첫 번째 UUID 부분)
      const id = filename.split('-')[0] || crypto.randomUUID();
      
      // 원본 파일명 추출 (UUID 이후 부분)
      const originalName = filename.includes('-') 
        ? filename.split('-').slice(1).join('-')
        : filename;
      
      // 썸네일 URL 확인
      let thumbnailUrl: string | null = null;
      const thumbPath = path.join(uploadsDir, `thumb_${filename}`);
      const videoThumbPath = path.join(uploadsDir, `thumb_${filename}.jpg`);
      
      if (await fs.pathExists(thumbPath)) {
        thumbnailUrl = `/uploads/thumb_${encodeURIComponent(filename)}`;
      } else if (await fs.pathExists(videoThumbPath)) {
        thumbnailUrl = `/uploads/thumb_${encodeURIComponent(filename)}.jpg`;
      }
      
      // 미디어 파일 생성
      const createdFile = await prisma.mediaFile.create({
        data: {
          id,
          filename,
          originalName,
          mimetype: getMimeType(filename),
          size: stats.size,
          mediaType: getMediaTypeFromExtension(filename),
          url: `/uploads/${encodeURIComponent(filename)}`,
          thumbnailUrl,
          width: metadata.width || null,
          height: metadata.height || null,
          duration: metadata.duration || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          uploadedAt: stats.birthtime
        }
      });
      
      console.log(`✅ 미디어 파일 생성됨: ${originalName} (${createdFile.mediaType})`);
      
      if (metadata.width && metadata.height) {
        console.log(`  📐 크기: ${metadata.width}x${metadata.height}`);
      }
      if (metadata.duration) {
        console.log(`  ⏱️  길이: ${metadata.duration}초`);
      }
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ 미디어 파일 마이그레이션 실패 (${filename}):`, error);
      failCount++;
    }
  }
  
  console.log('\n📊 마이그레이션 완료:');
  console.log(`  ✅ 성공: ${successCount}개`);
  console.log(`  ❌ 실패: ${failCount}개`);
  console.log(`  ⏭️  건너뜀: ${mediaFiles.length - successCount - failCount}개`);
  
  // 미디어 타입별 통계
  const stats = await prisma.mediaFile.groupBy({
    by: ['mediaType'],
    _count: true
  });
  
  console.log('\n📈 미디어 타입별 통계:');
  stats.forEach(stat => {
    console.log(`  ${stat.mediaType}: ${stat._count}개`);
  });
}

// 메인 실행
async function main() {
  try {
    await migrateMediaFiles();
  } catch (error) {
    console.error('💥 마이그레이션 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();