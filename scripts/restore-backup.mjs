/**
 * 백업 복원 스크립트
 * - isLatest 임시 컬럼 추가
 * - 모든 테이블 TRUNCATE
 * - COPY 블록으로 데이터 복원
 * - isLatest 임시 컬럼 제거
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import copyStreams from 'pg-copy-streams';

const { Client } = pg;
const { from: copyFrom } = copyStreams;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/youtube_generator';
const BACKUP_FILE = path.join(process.cwd(), 'backups/youtube_generator_backup_20250703_143811.sql');

// isLatest 컬럼이 백업에는 있지만 현재 스키마에는 없는 테이블들
const TABLES_NEEDING_ISLATEST = [
  'CsvColumnMapVersion',
  'ResourceDataVersion',
  'ResourceTemplateVersion',
  'TemplateVersion',
];

// 테이블 TRUNCATE 순서 (외래키 의존성 고려, 자식 테이블부터)
const TRUNCATE_ORDER = [
  '_prisma_migrations',
  'template_resource_compatibility',
  'TemplateVersion',
  'TemplateGroup',
  'Bundle',
  'ResourceDataVersion',
  'ResourceTemplateVersion',
  'CsvColumnMapVersion',
  'ResourceData',
  'ResourceTemplate',
  'CsvColumnMap',
  'RenderResult',
  'Project',
  'AudioMapping',
  'Script',
  'Template',
  'TemplateType',
  'MediaFile',
  'User',
];

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✅ DB 연결 완료');

  try {
    // 1단계: isLatest 임시 컬럼 추가
    console.log('\n📌 1단계: isLatest 임시 컬럼 추가...');
    for (const table of TABLES_NEEDING_ISLATEST) {
      try {
        await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "isLatest" boolean DEFAULT true NOT NULL`);
        console.log(`   ✅ ${table}: isLatest 컬럼 추가됨`);
      } catch (err) {
        console.log(`   ⚠️ ${table}: ${err.message}`);
      }
    }

    // 2단계: 모든 테이블 TRUNCATE
    console.log('\n🗑️ 2단계: 기존 데이터 삭제...');
    for (const table of TRUNCATE_ORDER) {
      try {
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`   ✅ ${table} truncated`);
      } catch (err) {
        console.log(`   ⚠️ ${table}: ${err.message}`);
      }
    }

    // 3단계: FK 제약 일시 비활성화 후 백업 데이터 복원
    console.log('\n📥 3단계: 백업 데이터 복원...');
    await client.query(`SET session_replication_role = 'replica'`);
    console.log('   🔓 FK 제약 비활성화됨');
    const backupContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
    const lines = backupContent.split('\n');

    let i = 0;
    let successCount = 0;
    let failCount = 0;

    while (i < lines.length) {
      if (lines[i].startsWith('COPY public.')) {
        const copyStatement = lines[i];
        const tableName = copyStatement.match(/COPY public\."?([^"\s(]+)"?\s/)?.[1];

        // COPY 데이터 수집
        i++;
        const dataLines = [];
        while (i < lines.length && lines[i] !== '\\.') {
          dataLines.push(lines[i]);
          i++;
        }
        // Skip the \. terminator
        if (i < lines.length) i++;

        if (dataLines.length === 0) {
          console.log(`   ⏭️ ${tableName}: 데이터 없음`);
          i++;
          continue;
        }

        // COPY 실행
        try {
          const copyData = dataLines.join('\n') + '\n';
          const stream = client.query(copyFrom(copyStatement));

          await new Promise((resolve, reject) => {
            stream.on('error', reject);
            stream.on('finish', resolve);
            stream.write(copyData);
            stream.end();
          });

          console.log(`   ✅ ${tableName}: ${dataLines.length}행 복원됨`);
          successCount++;
        } catch (err) {
          console.error(`   ❌ ${tableName}: ${err.message}`);
          failCount++;
        }
      }
      i++;
    }

    await client.query(`SET session_replication_role = 'origin'`);
    console.log('   🔒 FK 제약 다시 활성화됨');
    console.log(`\n📊 복원 결과: 성공 ${successCount}, 실패 ${failCount}`);

    // 4단계: isLatest 임시 컬럼 제거
    console.log('\n🧹 4단계: isLatest 임시 컬럼 제거...');
    for (const table of TABLES_NEEDING_ISLATEST) {
      try {
        await client.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "isLatest"`);
        console.log(`   ✅ ${table}: isLatest 컬럼 제거됨`);
      } catch (err) {
        console.log(`   ⚠️ ${table}: ${err.message}`);
      }
    }

    // 5단계: 시퀀스 리셋 (auto-increment가 있는 경우)
    console.log('\n🔄 5단계: 데이터 검증...');
    const tables = TRUNCATE_ORDER.filter(t => t !== '_prisma_migrations');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          console.log(`   📋 ${table}: ${count}행`);
        }
      } catch (err) {
        // skip
      }
    }

    console.log('\n✅ 백업 복원 완료!');

  } catch (err) {
    console.error('❌ 오류:', err);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
