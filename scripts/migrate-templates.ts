/**
 * 기존 템플릿 파일들을 PostgreSQL 데이터베이스로 마이그레이션
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs-extra';
import path from 'path';

const prisma = new PrismaClient();

async function migrateTemplates() {
  console.log('🚀 템플릿 마이그레이션 시작...');
  
  const templatesDir = path.join(process.cwd(), 'server/templates');
  
  // 템플릿 디렉토리 확인
  if (!await fs.pathExists(templatesDir)) {
    console.log('❌ 템플릿 디렉토리가 존재하지 않습니다:', templatesDir);
    return;
  }
  
  const files = await fs.readdir(templatesDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`📁 발견된 템플릿 파일: ${jsonFiles.length}개`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of jsonFiles) {
    try {
      console.log(`\n📄 처리 중: ${file}`);
      
      const templatePath = path.join(templatesDir, file);
      const templateData = await fs.readJson(templatePath);
      
      // 기존 템플릿이 이미 마이그레이션되었는지 확인
      const existing = await prisma.template.findUnique({
        where: { id: templateData.id }
      });
      
      if (existing) {
        console.log(`⏭️  이미 존재하는 템플릿: ${templateData.name}`);
        continue;
      }
      
      // 템플릿 생성
      const createdTemplate = await prisma.template.create({
        data: {
          id: templateData.id,
          name: templateData.name,
          description: templateData.description || '',
          projectData: {
            tracks: templateData.tracks,
            projectSettings: templateData.projectSettings,
            // 원본 bundles와 templateGroups 정보도 JSON에 보존
            bundles: templateData.bundles || [],
            templateGroups: templateData.templateGroups || []
          },
          totalClips: templateData.metadata?.totalClips || 
                     templateData.tracks.reduce((sum: number, track: any) => sum + track.clips.length, 0),
          totalTracks: templateData.metadata?.totalTracks || templateData.tracks.length,
          duration: templateData.metadata?.duration || templateData.projectSettings?.duration || 0,
          version: templateData.metadata?.version || '1.0.0',
          createdAt: new Date(templateData.createdAt || Date.now()),
          updatedAt: new Date(templateData.updatedAt || Date.now()),
        }
      });
      
      console.log(`✅ 템플릿 생성됨: ${createdTemplate.name} (ID: ${createdTemplate.id})`);
      
      // Bundle 정보 분리하여 저장
      if (templateData.bundles && templateData.bundles.length > 0) {
        console.log(`  📦 Bundle 생성 중: ${templateData.bundles.length}개`);
        
        for (const bundle of templateData.bundles) {
          await prisma.bundle.create({
            data: {
              id: bundle.id,
              name: bundle.name,
              color: bundle.color,
              templateId: createdTemplate.id,
              startTime: bundle.startTime,
              endTime: bundle.endTime,
              baseClipIds: bundle.baseClipIds || [],
              templateGroupIds: bundle.templateGroupIds || [],
              createdAt: new Date(bundle.createdAt || Date.now())
            }
          });
        }
        
        console.log(`  ✅ Bundle 생성 완료`);
      }
      
      // TemplateGroup 정보 분리하여 저장
      if (templateData.templateGroups && templateData.templateGroups.length > 0) {
        console.log(`  📁 TemplateGroup 생성 중: ${templateData.templateGroups.length}개`);
        
        for (const group of templateData.templateGroups) {
          await prisma.templateGroup.create({
            data: {
              id: group.id,
              name: group.name,
              templateId: createdTemplate.id,
              clipIds: group.clipIds || [],
              startTime: group.startTime,
              endTime: group.endTime,
              isProtected: group.isProtected || false,
              color: group.color,
              bundleId: group.bundleId || null,
              createdAt: new Date(group.createdAt || Date.now())
            }
          });
        }
        
        console.log(`  ✅ TemplateGroup 생성 완료`);
      }
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ 템플릿 마이그레이션 실패 (${file}):`, error);
      failCount++;
    }
  }
  
  console.log('\n📊 마이그레이션 완료:');
  console.log(`  ✅ 성공: ${successCount}개`);
  console.log(`  ❌ 실패: ${failCount}개`);
  console.log(`  ⏭️  건너뜀: ${jsonFiles.length - successCount - failCount}개`);
}

// 메인 실행
async function main() {
  try {
    await migrateTemplates();
  } catch (error) {
    console.error('💥 마이그레이션 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();