import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function migrateDefaultVoices() {
  try {
    console.log('🔄 기본 음성 설정을 JSON 파일에서 데이터베이스로 마이그레이션 시작...');
    
    // JSON 파일 읽기
    const jsonFilePath = path.join(__dirname, '../data/default-voices.json');
    
    if (!fs.existsSync(jsonFilePath)) {
      console.log('⚠️ default-voices.json 파일이 존재하지 않습니다.');
      return;
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log(`📁 JSON 파일에서 ${Object.keys(jsonData).length}개 언어 설정 발견`);
    
    // 기존 데이터 확인
    const existingCount = await prisma.tTSDefaultVoice.count();
    console.log(`🗄️ 데이터베이스에 ${existingCount}개 기존 설정 존재`);
    
    // 데이터베이스에 upsert
    const upsertPromises = Object.entries(jsonData).map(([languageCode, voiceName]) => {
      return prisma.tTSDefaultVoice.upsert({
        where: { languageCode },
        update: { 
          voiceName,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          languageCode,
          voiceName,
          isActive: true,
          description: `Default voice for ${languageCode}`
        }
      });
    });
    
    const results = await Promise.all(upsertPromises);
    
    console.log(`✅ ${results.length}개 언어 설정을 데이터베이스에 저장 완료`);
    
    // 결과 검증
    const finalCount = await prisma.tTSDefaultVoice.count();
    console.log(`🎯 마이그레이션 완료: 총 ${finalCount}개 설정이 데이터베이스에 저장됨`);
    
    // 마이그레이션된 데이터 표시
    const allVoices = await prisma.tTSDefaultVoice.findMany({
      orderBy: { languageCode: 'asc' }
    });
    
    console.log('\n📋 마이그레이션된 기본 음성 설정:');
    allVoices.forEach(voice => {
      console.log(`  ${voice.languageCode}: ${voice.voiceName}`);
    });
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
migrateDefaultVoices()
  .then(() => {
    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  });