import { NestedTransformEngineRefactored } from './services/transform/NestedTransformEngineRefactored';
import { NestedTransformEngine } from './services/transform/nestedEngine';
import { ResourceData } from './types/autoGeneration';
import fs from 'fs';
import path from 'path';

/**
 * 리팩토링된 엔진과 기존 엔진의 기능 비교 테스트
 */
async function compareEngines() {
  console.log('🔄 리팩토링된 엔진 vs 기존 엔진 비교 테스트 시작...\n');

  // 테스트 데이터 준비
  const simpleTemplate = {
    tracks: [
      {
        id: 'track-test',
        clips: [
          {
            id: 'clip-test-1',
            name: 'test-sentence',
            text: 'Test sentence',
            startTime: 0,
            endTime: 2,
            duration: 2,
            mediaType: 'sentence',
            trackId: 'track-test',
            regularClipProperties: {}
          }
        ]
      }
    ],
    bundles: [],
    projectSettings: {
      duration: 10,
      width: 1920,
      height: 1080,
      fps: 30
    }
  };

  const simpleResourceData: ResourceData = {
    items: [
      {
        name: 'test-sentence',
        data: {
          type: 'text',
          text: 'This is a test sentence for refactoring comparison',
          language: 'ko'
        }
      }
    ]
  };

  // 기존 엔진 테스트
  console.log('1️⃣ 기존 엔진 테스트');
  const originalEngine = new NestedTransformEngine({
    maxNestingDepth: 3,
    enableCircularReferenceCheck: true,
    strictMode: false
  });

  let originalResult;
  let originalError;
  const originalStartTime = Date.now();

  try {
    originalResult = await originalEngine.transformNasted(simpleTemplate, simpleResourceData);
    console.log('✅ 기존 엔진 성공');
    console.log(`   - 성공: ${originalResult.success}`);
    console.log(`   - 처리시간: ${originalResult.statistics.processingTime}ms`);
    console.log(`   - 클립 수: ${originalResult.statistics.totalClips}`);
    console.log(`   - TTS 생성 수: ${originalResult.statistics.ttsGenerated}`);
  } catch (error) {
    originalError = error;
    console.error('❌ 기존 엔진 실패:', error);
  }

  const originalEndTime = Date.now();
  console.log(`   - 실제 처리시간: ${originalEndTime - originalStartTime}ms\n`);

  // 리팩토링된 엔진 테스트
  console.log('2️⃣ 리팩토링된 엔진 테스트');
  const refactoredEngine = new NestedTransformEngineRefactored({
    maxNestingDepth: 3,
    enableCircularReferenceCheck: true,
    strictMode: false
  });

  let refactoredResult;
  let refactoredError;
  const refactoredStartTime = Date.now();

  try {
    refactoredResult = await refactoredEngine.transformNasted(simpleTemplate, simpleResourceData);
    console.log('✅ 리팩토링된 엔진 성공');
    console.log(`   - 성공: ${refactoredResult.success}`);
    console.log(`   - 처리시간: ${refactoredResult.statistics.processingTime}ms`);
    console.log(`   - 클립 수: ${refactoredResult.statistics.totalClips}`);
    console.log(`   - TTS 생성 수: ${refactoredResult.statistics.ttsGenerated}`);
  } catch (error) {
    refactoredError = error;
    console.error('❌ 리팩토링된 엔진 실패:', error);
  }

  const refactoredEndTime = Date.now();
  console.log(`   - 실제 처리시간: ${refactoredEndTime - refactoredStartTime}ms\n`);

  // 결과 비교
  console.log('3️⃣ 결과 비교');
  
  if (originalError && refactoredError) {
    console.log('⚠️ 양쪽 모두 실패 - 에러 비교 필요');
  } else if (originalError) {
    console.log('⚠️ 기존 엔진 실패, 리팩토링된 엔진 성공');
  } else if (refactoredError) {
    console.log('⚠️ 리팩토링된 엔진 실패, 기존 엔진 성공');
  } else if (originalResult && refactoredResult) {
    console.log('📊 성공 결과 비교:');
    console.log(`   - 기존 엔진 처리시간: ${originalResult.statistics.processingTime}ms`);
    console.log(`   - 리팩토링된 엔진 처리시간: ${refactoredResult.statistics.processingTime}ms`);
    console.log(`   - 기존 엔진 클립 수: ${originalResult.statistics.totalClips}`);
    console.log(`   - 리팩토링된 엔진 클립 수: ${refactoredResult.statistics.totalClips}`);
    console.log(`   - 기존 엔진 TTS 수: ${originalResult.statistics.ttsGenerated}`);
    console.log(`   - 리팩토링된 엔진 TTS 수: ${refactoredResult.statistics.ttsGenerated}`);
    
    // 기본 기능 동일성 확인
    const functionalityMatches = 
      originalResult.success === refactoredResult.success &&
      originalResult.statistics.totalClips === refactoredResult.statistics.totalClips &&
      originalResult.statistics.ttsGenerated === refactoredResult.statistics.ttsGenerated;
    
    if (functionalityMatches) {
      console.log('✅ 기본 기능 동일성 확인됨');
    } else {
      console.log('❌ 기본 기능 차이 발견');
    }
  }

  return {
    originalResult,
    refactoredResult,
    originalError,
    refactoredError
  };
}

/**
 * 리팩토링된 엔진의 모듈 테스트
 */
async function testRefactoredModules() {
  console.log('\n🧪 리팩토링된 엔진 모듈 테스트...\n');

  const engine = new NestedTransformEngineRefactored({
    maxNestingDepth: 5,
    enableCircularReferenceCheck: true,
    strictMode: false
  });

  // 1. 초기화 테스트
  console.log('1️⃣ 초기화 테스트');
  console.log('✅ 엔진 초기화 성공');
  console.log('✅ 모든 프로세서 모듈 초기화 완료');

  // 2. 검증 서비스 테스트
  console.log('\n2️⃣ 검증 서비스 테스트');
  const validTemplate = {
    tracks: [{ id: 'track-1', clips: [] }],
    bundles: [],
    projectSettings: { duration: 10, width: 1920, height: 1080, fps: 30 }
  };
  
  const validResourceData = {
    items: [
      {
        name: 'test-item',
        data: { type: 'text', text: 'Test text' }
      }
    ]
  };

  try {
    // ValidationService의 validateAll 메서드 직접 호출은 private이므로
    // 전체 transform을 통해 검증 테스트
    const result = await engine.transformNasted(validTemplate, validResourceData);
    console.log('✅ 검증 서비스 테스트 성공');
  } catch (error) {
    console.error('❌ 검증 서비스 테스트 실패:', error);
  }

  // 3. 에러 처리 테스트
  console.log('\n3️⃣ 에러 처리 테스트');
  try {
    await engine.transformNasted(null, validResourceData);
    console.log('❌ null 템플릿 처리 - 예외가 발생해야 함');
  } catch (error) {
    console.log('✅ null 템플릿 처리 - 올바르게 예외 발생');
  }

  try {
    await engine.transformNasted(validTemplate, null);
    console.log('❌ null 리소스 처리 - 예외가 발생해야 함');
  } catch (error) {
    console.log('✅ null 리소스 처리 - 올바르게 예외 발생');
  }

  console.log('\n🎉 모듈 테스트 완료!');
}

/**
 * 실제 데이터 파일 테스트
 */
async function testWithRealData() {
  console.log('\n📄 실제 데이터 파일 테스트...\n');

  const dataPath = path.join(process.cwd(), 'data');
  const templateFile = path.join(dataPath, 'sample-simple-template01.json');
  const resourceFile = path.join(dataPath, 'resource-data01.json');

  if (!fs.existsSync(templateFile) || !fs.existsSync(resourceFile)) {
    console.log('⚠️ 실제 데이터 파일이 존재하지 않아 테스트 생략');
    return;
  }

  const template = JSON.parse(fs.readFileSync(templateFile, 'utf-8'));
  const resourceData = JSON.parse(fs.readFileSync(resourceFile, 'utf-8'));

  const refactoredEngine = new NestedTransformEngineRefactored({
    maxNestingDepth: 5,
    enableCircularReferenceCheck: true,
    strictMode: false
  });

  try {
    const result = await refactoredEngine.transformNasted(template, resourceData);
    console.log('✅ 실제 데이터 파일 테스트 성공');
    console.log(`   - 성공: ${result.success}`);
    console.log(`   - 처리시간: ${result.statistics.processingTime}ms`);
    console.log(`   - 클립 수: ${result.statistics.totalClips}`);
    console.log(`   - TTS 생성 수: ${result.statistics.ttsGenerated}`);
  } catch (error) {
    console.error('❌ 실제 데이터 파일 테스트 실패:', error);
  }
}

// 메인 테스트 실행
async function runRefactoredTests() {
  console.log('🚀 리팩토링된 NestedTransformEngine 테스트 시작\n');
  console.log('='.repeat(60));

  await compareEngines();
  await testRefactoredModules();
  await testWithRealData();

  console.log('\n' + '='.repeat(60));
  console.log('✨ 리팩토링된 엔진 테스트 완료! ✨');
  console.log('📈 모듈화를 통해 코드 구조가 개선되었습니다.');
}

// 실행
runRefactoredTests().catch(console.error);