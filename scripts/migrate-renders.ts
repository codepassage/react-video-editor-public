/**
 * 기존 렌더링된 영상 파일들을 PostgreSQL 데이터베이스로 마이그레이션
 */

import { PrismaClient, RenderStatus } from '@prisma/client';
import fs from 'fs-extra';
import path from 'path';

const prisma = new PrismaClient();

async function migrateRenderResults() {
  console.log('🚀 렌더링 결과 마이그레이션 시작...');
  
  const rendersDir = path.join(process.cwd(), 'server/renders');
  
  // 렌더 디렉토리 확인
  if (!await fs.pathExists(rendersDir)) {
    console.log('❌ 렌더 디렉토리가 존재하지 않습니다:', rendersDir);
    return;
  }
  
  const files = await fs.readdir(rendersDir);
  const videoFiles = files.filter(f => f.endsWith('.mp4'));
  
  console.log(`📁 발견된 렌더링 결과: ${videoFiles.length}개`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const filename of videoFiles) {
    try {
      console.log(`\n📄 처리 중: ${filename}`);
      
      const filePath = path.join(rendersDir, filename);
      const stats = await fs.stat(filePath);
      
      // 기존 렌더 결과가 이미 마이그레이션되었는지 확인
      const existing = await prisma.renderResult.findUnique({
        where: { filename }
      });
      
      if (existing) {
        console.log(`⏭️  이미 존재하는 렌더 결과: ${filename}`);
        continue;
      }
      
      // ID는 파일명에서 확장자 제거
      const id = path.parse(filename).name;
      
      // 렌더 결과 생성
      const createdRender = await prisma.renderResult.create({
        data: {
          id,
          filename,
          originalRequest: {
            // 기존 요청 데이터는 없으므로 기본값 설정
            note: '파일 시스템에서 마이그레이션됨',
            migrationDate: new Date().toISOString()
          },
          status: RenderStatus.COMPLETED, // 이미 완료된 파일들
          progress: 100,
          size: stats.size,
          url: `/renders/${encodeURIComponent(filename)}`,
          createdAt: stats.birthtime,
          completedAt: stats.mtime,
          // duration은 실제 비디오 메타데이터에서 가져와야 하지만, 
          // 현재는 null로 설정
          duration: null
        }
      });
      
      console.log(`✅ 렌더 결과 생성됨: ${filename}`);
      console.log(`  📦 크기: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  📅 생성일: ${stats.birthtime.toLocaleString()}`);
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ 렌더 결과 마이그레이션 실패 (${filename}):`, error);
      failCount++;
    }
  }
  
  console.log('\n📊 마이그레이션 완료:');
  console.log(`  ✅ 성공: ${successCount}개`);
  console.log(`  ❌ 실패: ${failCount}개`);
  console.log(`  ⏭️  건너뜀: ${videoFiles.length - successCount - failCount}개`);
  
  // 전체 렌더링 통계
  const totalSize = await prisma.renderResult.aggregate({
    _sum: {
      size: true
    },
    _count: true
  });
  
  console.log('\n📈 전체 렌더링 통계:');
  console.log(`  총 개수: ${totalSize._count}개`);
  console.log(`  총 크기: ${((totalSize._sum.size || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`);
}

// 메인 실행
async function main() {
  try {
    await migrateRenderResults();
  } catch (error) {
    console.error('💥 마이그레이션 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();