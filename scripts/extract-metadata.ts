import fs from 'fs-extra';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES 모듈에서 require 사용을 위한 설정
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 업로드 디렉토리
const uploadsDir = path.join(dirname(__dirname), 'server', 'uploads');

console.log('📁 Uploads directory:', uploadsDir);

// Sharp와 FFmpeg 확인
let hasSharp = false;
let hasFFmpeg = false;

try {
  require('sharp');
  hasSharp = true;
  console.log('✅ Sharp library available');
} catch (error) {
  console.error('❌ Sharp not installed');
  process.exit(1);
}

try {
  require('fluent-ffmpeg');
  hasFFmpeg = true;
  console.log('✅ FFmpeg available');
} catch (error) {
  console.error('❌ fluent-ffmpeg not installed');
  process.exit(1);
}

// 메타데이터 추출 함수
async function extractMetadata(filePath: string) {
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  const metadataPath = path.join(uploadsDir, `.metadata_${filename}.json`);
  
  // 이미 메타데이터가 있으면 스킵
  if (await fs.pathExists(metadataPath)) {
    console.log(`⏭️  Skipping ${filename} (metadata exists)`);
    return;
  }
  
  // 이미지 처리
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
    try {
      const sharp = require('sharp');
      const metadata = await sharp(filePath).metadata();
      
      const metadataObj: any = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      };
      
      // 큰 이미지의 경우 썸네일 생성
      if (metadata.width > 400 || metadata.height > 400) {
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(uploadsDir, thumbnailFilename);
        
        if (!await fs.pathExists(thumbnailPath)) {
          await sharp(filePath)
            .resize(400, 400, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath);
            
          metadataObj.thumbnail = `/uploads/${thumbnailFilename}`;
          console.log(`🖼️  Created thumbnail for ${filename}`);
        }
      }
      
      await fs.writeJson(metadataPath, metadataObj);
      console.log(`✅ Image metadata saved for ${filename}: ${metadata.width}x${metadata.height}`);
      
    } catch (error) {
      console.error(`❌ Failed to process image ${filename}:`, error);
    }
  }
  
  // 비디오 처리
  else if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
    try {
      const ffmpeg = require('fluent-ffmpeg');
      
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, async (error: any, metadata: any) => {
          if (error) {
            reject(error);
          } else {
            const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
            if (videoStream) {
              const metadataObj: any = {
                width: videoStream.width,
                height: videoStream.height,
                duration: metadata.format.duration
              };
              
              // 썸네일 생성
              const thumbnailFilename = `thumb_${filename}.jpg`;
              const thumbnailPath = path.join(uploadsDir, thumbnailFilename);
              
              if (!await fs.pathExists(thumbnailPath)) {
                await new Promise((thumbResolve, thumbReject) => {
                  ffmpeg(filePath)
                    .screenshots({
                      timestamps: ['1'],
                      filename: thumbnailFilename,
                      folder: uploadsDir,
                      size: '400x?'
                    })
                    .on('end', () => {
                      metadataObj.thumbnail = `/uploads/${thumbnailFilename}`;
                      console.log(`🎥 Created video thumbnail for ${filename}`);
                      thumbResolve(null);
                    })
                    .on('error', (err: any) => {
                      console.warn('Failed to create video thumbnail:', err);
                      thumbResolve(null);
                    });
                });
              }
              
              await fs.writeJson(metadataPath, metadataObj);
              console.log(`✅ Video metadata saved for ${filename}: ${videoStream.width}x${videoStream.height}, ${metadata.format.duration}s`);
            }
            resolve(null);
          }
        });
      });
      
    } catch (error) {
      console.error(`❌ Failed to process video ${filename}:`, error);
    }
  }
  
  // 오디오 처리
  else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
    try {
      const ffmpeg = require('fluent-ffmpeg');
      
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, async (error: any, metadata: any) => {
          if (error) {
            reject(error);
          } else {
            const metadataObj = {
              duration: metadata.format.duration
            };
            
            await fs.writeJson(metadataPath, metadataObj);
            console.log(`✅ Audio metadata saved for ${filename}: ${metadata.format.duration}s`);
            resolve(null);
          }
        });
      });
      
    } catch (error) {
      console.error(`❌ Failed to process audio ${filename}:`, error);
    }
  }
}

// 메인 함수
async function main() {
  try {
    console.log('\n🚀 Starting metadata extraction for existing files...\n');
    
    const files = await fs.readdir(uploadsDir);
    const mediaFiles = files.filter(f => 
      !f.startsWith('.') && 
      !f.startsWith('thumb_') &&
      !f.endsWith('.json')
    );
    
    console.log(`📊 Found ${mediaFiles.length} media files to process\n`);
    
    for (const file of mediaFiles) {
      const filePath = path.join(uploadsDir, file);
      await extractMetadata(filePath);
    }
    
    console.log('\n✅ Metadata extraction completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// 실행
main();
