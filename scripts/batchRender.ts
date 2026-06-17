#!/usr/bin/env ts-node

import fs from 'fs-extra';
import path from 'path';
import { renderFromJSON } from './renderFromJSON';

interface BatchOptions {
  inputDir: string;
  outputDir: string;
  quality?: number;
  verbose?: boolean;
  port?: number;
}

async function batchRender(options: BatchOptions) {
  console.log('🔄 배치 렌더링 시작...');
  console.log('📁 입력 디렉토리:', options.inputDir);
  console.log('📤 출력 디렉토리:', options.outputDir);
  
  // 입력 디렉토리 확인
  if (!await fs.pathExists(options.inputDir)) {
    throw new Error(`입력 디렉토리를 찾을 수 없습니다: ${options.inputDir}`);
  }
  
  // JSON 파일 찾기
  const allFiles = await fs.readdir(options.inputDir);
  const jsonFiles = allFiles
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(options.inputDir, file));
  
  console.log(`📋 찾은 JSON 파일: ${jsonFiles.length}개`);
  
  if (jsonFiles.length === 0) {
    console.warn('⚠️ JSON 파일이 없습니다.');
    return;
  }
  
  // 출력 디렉토리 생성
  await fs.ensureDir(options.outputDir);
  
  const results = {
    success: 0,
    failed: 0,
    errors: [] as { file: string; error: string }[]
  };
  
  const startTime = Date.now();
  
  // 각 JSON 파일 렌더링
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonFile = jsonFiles[i];
    const baseName = path.basename(jsonFile, '.json');
    const outputFile = path.join(options.outputDir, `${baseName}.mp4`);
    
    console.log(`\n🎬 렌더링 ${i + 1}/${jsonFiles.length}: ${baseName}`);
    console.log(`📁 입력: ${jsonFile}`);
    console.log(`📤 출력: ${outputFile}`);
    
    try {
      await renderFromJSON({
        input: jsonFile,
        output: outputFile,
        quality: options.quality || 25,
        verbose: options.verbose || false,
        port: options.port || 5002
      });
      
      console.log(`✅ 완료: ${outputFile}`);
      results.success++;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error(`❌ 실패: ${baseName} - ${errorMessage}`);
      
      results.failed++;
      results.errors.push({
        file: baseName,
        error: errorMessage
      });
    }
  }
  
  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;
  
  console.log('\n🎉 배치 렌더링 완료!');
  console.log('📊 결과 요약:');
  console.log(`  ✅ 성공: ${results.success}개`);
  console.log(`  ❌ 실패: ${results.failed}개`);
  console.log(`  ⏱️ 총 소요시간: ${(totalTime / 60).toFixed(1)}분`);
  
  if (results.success > 0) {
    const avgTime = totalTime / results.success;
    console.log(`  📈 평균 렌더링 시간: ${avgTime.toFixed(1)}초/파일`);
  }
  
  // 실패한 파일 목록 출력
  if (results.failed > 0) {
    console.log('\n❌ 실패한 파일들:');
    results.errors.forEach(({ file, error }) => {
      console.log(`  • ${file}: ${error}`);
    });
  }
  
  // 생성된 파일 목록
  if (results.success > 0) {
    console.log(`\n📁 생성된 파일들은 다음 위치에 있습니다: ${path.resolve(options.outputDir)}`);
  }
}

// CLI 인터페이스
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📖 사용법:
  npm run render:batch <input-dir> [output-dir] [options]
  
📋 매개변수:
  input-dir         JSON 파일들이 있는 디렉토리
  output-dir        출력 동영상 디렉토리 (기본: ./batch-renders)
  
📋 옵션:
  --quality, -q     비디오 품질 1-51 (기본: 25, 낮을수록 고품질)
  --verbose, -v     상세 로그 출력
  --port, -p        서버 포트 (기본: 5002)
  
📚 예시:
  npm run render:batch ./projects
  npm run render:batch ./projects ./output-videos
  npm run render:batch ./projects ./output --quality 20 --verbose
  npm run render:batch ./json-files ./videos -q 15 -v -p 5003
    `);
    process.exit(0);
  }
  
  const inputDir = args[0];
  const outputDir = args[1] || './batch-renders';
  
  const options: BatchOptions = {
    inputDir,
    outputDir
  };
  
  // 옵션 파싱
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    if ((arg === '--quality' || arg === '-q') && nextArg) {
      options.quality = parseInt(nextArg);
      i++;
    } else if ((arg === '--port' || arg === '-p') && nextArg) {
      options.port = parseInt(nextArg);
      i++;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }
  
  // 유효성 검사
  if (options.quality && (options.quality < 1 || options.quality > 51)) {
    console.error('❌ 품질 값은 1-51 사이여야 합니다.');
    process.exit(1);
  }
  
  if (options.port && (options.port < 1000 || options.port > 65535)) {
    console.error('❌ 포트 번호는 1000-65535 사이여야 합니다.');
    process.exit(1);
  }
  
  try {
    console.log('🚀 배치 렌더링 시작...');
    console.log('⚙️ 배치 옵션:', {
      inputDir: options.inputDir,
      outputDir: options.outputDir,
      quality: options.quality || 25,
      verbose: options.verbose || false,
      port: options.port || 5002
    });
    
    await batchRender(options);
    
    console.log('\n🎉 모든 배치 작업 완료!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 배치 렌더링 실패:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error('💡 해결 방법: 입력 디렉토리 경로가 올바른지 확인하세요.');
      } else if (error.message.includes('EACCES')) {
        console.error('💡 해결 방법: 디렉토리 권한을 확인하세요.');
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { batchRender };
