/**
 * 마이그레이션 결과 검증 스크립트
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs-extra';
import path from 'path';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 마이그레이션 검증 시작...\n');
  
  // 1. 템플릿 검증
  console.log('📋 템플릿 검증:');
  const templatesDir = path.join(process.cwd(), 'server/templates');
  const templateFiles = (await fs.readdir(templatesDir)).filter(f => f.endsWith('.json'));
  const dbTemplates = await prisma.template.count();
  const dbBundles = await prisma.bundle.count();
  const dbTemplateGroups = await prisma.templateGroup.count();
  
  console.log(`  파일 시스템: ${templateFiles.length}개 템플릿`);
  console.log(`  데이터베이스: ${dbTemplates}개 템플릿`);
  console.log(`  Bundle: ${dbBundles}개`);
  console.log(`  TemplateGroup: ${dbTemplateGroups}개`);
  console.log(`  상태: ${templateFiles.length === dbTemplates ? '✅ 일치' : '❌ 불일치'}`);
  
  // 2. 미디어 파일 검증
  console.log('\n📷 미디어 파일 검증:');
  const uploadsDir = path.join(process.cwd(), 'server/uploads');
  const mediaFiles = (await fs.readdir(uploadsDir)).filter(f => 
    !f.startsWith('.') && 
    !f.startsWith('thumb_') && 
    !f.includes('.metadata_')
  );
  const dbMediaFiles = await prisma.mediaFile.count();
  
  console.log(`  파일 시스템: ${mediaFiles.length}개 미디어 파일`);
  console.log(`  데이터베이스: ${dbMediaFiles}개 미디어 파일`);
  console.log(`  상태: ${mediaFiles.length === dbMediaFiles ? '✅ 일치' : '❌ 불일치'}`);
  
  // 미디어 타입별 통계
  const mediaStats = await prisma.mediaFile.groupBy({
    by: ['mediaType'],
    _count: true
  });
  
  console.log('\n  타입별 분포:');
  mediaStats.forEach(stat => {
    console.log(`    - ${stat.mediaType}: ${stat._count}개`);
  });
  
  // 3. 렌더링 결과 검증
  console.log('\n🎬 렌더링 결과 검증:');
  const rendersDir = path.join(process.cwd(), 'server/renders');
  const renderFiles = (await fs.readdir(rendersDir)).filter(f => f.endsWith('.mp4'));
  const dbRenders = await prisma.renderResult.count();
  
  console.log(`  파일 시스템: ${renderFiles.length}개 렌더 결과`);
  console.log(`  데이터베이스: ${dbRenders}개 렌더 결과`);
  console.log(`  상태: ${renderFiles.length === dbRenders ? '✅ 일치' : '❌ 불일치'}`);
  
  // 4. 데이터 무결성 검증
  console.log('\n🔧 데이터 무결성 검증:');
  
  // 템플릿의 Bundle 관계 검증
  const templatesWithBundles = await prisma.template.findMany({
    include: {
      bundles: true,
      templateGroups: true
    }
  });
  
  let integrityIssues = 0;
  
  for (const template of templatesWithBundles) {
    // projectData에 저장된 bundle 수와 실제 Bundle 테이블 레코드 수 비교
    const jsonBundles = (template.projectData as any).bundles || [];
    if (jsonBundles.length !== template.bundles.length) {
      console.log(`  ⚠️  템플릿 "${template.name}": JSON bundles(${jsonBundles.length}) != DB bundles(${template.bundles.length})`);
      integrityIssues++;
    }
  }
  
  console.log(`  무결성 문제: ${integrityIssues}개 ${integrityIssues === 0 ? '✅' : '❌'}`);
  
  // 5. 상세 통계
  console.log('\n📊 전체 데이터베이스 통계:');
  
  const totalTemplateSize = await prisma.template.aggregate({
    _sum: { totalClips: true, duration: true },
    _avg: { totalClips: true, duration: true }
  });
  
  const totalMediaSize = await prisma.mediaFile.aggregate({
    _sum: { size: true },
    _count: true
  });
  
  const totalRenderSize = await prisma.renderResult.aggregate({
    _sum: { size: true },
    _count: true
  });
  
  console.log('\n  템플릿:');
  console.log(`    - 총 클립 수: ${totalTemplateSize._sum.totalClips || 0}개`);
  console.log(`    - 평균 클립 수: ${totalTemplateSize._avg.totalClips?.toFixed(1) || 0}개`);
  console.log(`    - 총 길이: ${totalTemplateSize._sum.duration || 0}초`);
  console.log(`    - 평균 길이: ${totalTemplateSize._avg.duration?.toFixed(1) || 0}초`);
  
  console.log('\n  미디어 파일:');
  console.log(`    - 총 개수: ${totalMediaSize._count}개`);
  console.log(`    - 총 크기: ${((totalMediaSize._sum.size || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`    - 평균 크기: ${((totalMediaSize._sum.size || 0) / totalMediaSize._count / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n  렌더링 결과:');
  console.log(`    - 총 개수: ${totalRenderSize._count}개`);
  console.log(`    - 총 크기: ${((totalRenderSize._sum.size || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`    - 평균 크기: ${((totalRenderSize._sum.size || 0) / totalRenderSize._count / 1024 / 1024).toFixed(2)} MB`);
  
  // 6. 샘플 데이터 출력
  console.log('\n📝 샘플 데이터:');
  
  const sampleTemplate = await prisma.template.findFirst({
    include: { bundles: true }
  });
  
  if (sampleTemplate) {
    console.log('\n  샘플 템플릿:');
    console.log(`    - 이름: ${sampleTemplate.name}`);
    console.log(`    - ID: ${sampleTemplate.id}`);
    console.log(`    - 클립 수: ${sampleTemplate.totalClips}`);
    console.log(`    - Bundle 수: ${sampleTemplate.bundles.length}`);
  }
  
  const sampleMedia = await prisma.mediaFile.findFirst({
    where: { mediaType: 'video' }
  });
  
  if (sampleMedia) {
    console.log('\n  샘플 미디어:');
    console.log(`    - 파일명: ${sampleMedia.originalName}`);
    console.log(`    - 타입: ${sampleMedia.mediaType}`);
    console.log(`    - 크기: ${(sampleMedia.size / 1024 / 1024).toFixed(2)} MB`);
    if (sampleMedia.width && sampleMedia.height) {
      console.log(`    - 해상도: ${sampleMedia.width}x${sampleMedia.height}`);
    }
  }
}

// 메인 실행
async function main() {
  try {
    await verifyMigration();
    console.log('\n✅ 검증 완료!');
  } catch (error) {
    console.error('💥 검증 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();