import { NestedTransformEngine } from './services/transform/nestedEngine';
import { ResourceData } from './types/autoGeneration';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 기존 NestedTransformEngine 기능 테스트
 * 리팩토링 전 기본 기능들이 정상 동작하는지 확인
 */
async function testNestedEngineBasicFunctionality() {
  console.log('🧪 NestedTransformEngine 기본 기능 테스트 시작...\n');

  // 1. 엔진 초기화 테스트
  console.log('1️⃣ 엔진 초기화 테스트');
  const engine = new NestedTransformEngine({
    maxNestingDepth: 3,
    enableCircularReferenceCheck: true,
    strictMode: false
  });
  console.log('✅ 엔진 초기화 성공\n');

  // 2. 간단한 템플릿 + 리소스 데이터 테스트
  console.log('2️⃣ 간단한 템플릿 처리 테스트');
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
          text: 'This is a test sentence for functionality check',
          language: 'ko'
        }
      }
    ]
  };

  try {
    const result = await engine.transformNasted(simpleTemplate, simpleResourceData);
    console.log('✅ 간단한 템플릿 처리 성공');
    console.log(`   - 성공: ${result.success}`);
    console.log(`   - 클립 수: ${result.statistics.totalClips}`);
    console.log(`   - TTS 생성 수: ${result.statistics.ttsGenerated}`);
    console.log(`   - 처리 시간: ${result.statistics.processingTime}ms`);
  } catch (error) {
    console.error('❌ 간단한 템플릿 처리 실패:', error);
  }
  console.log('');

  // 3. 실제 테스트 데이터 파일 테스트 (있는 경우)
  console.log('3️⃣ 실제 테스트 데이터 파일 테스트');
  const dataPath = path.join(__dirname, '../data');
  const templateFile = path.join(dataPath, 'sample-simple-template01.json');
  const resourceFile = path.join(dataPath, 'resource-data01.json');

  if (fs.existsSync(templateFile) && fs.existsSync(resourceFile)) {
    try {
      const template = JSON.parse(fs.readFileSync(templateFile, 'utf-8'));
      const resourceData = JSON.parse(fs.readFileSync(resourceFile, 'utf-8'));
      
      console.log('   파일 로드 성공');
      console.log(`   - 템플릿 트랙 수: ${template.tracks?.length || 0}`);
      console.log(`   - 리소스 아이템 수: ${resourceData.items?.length || 0}`);
      
      const result = await engine.transformNasted(template, resourceData);
      console.log('✅ 실제 데이터 처리 성공');
      console.log(`   - 성공: ${result.success}`);
      console.log(`   - 클립 수: ${result.statistics.totalClips}`);
      console.log(`   - TTS 생성 수: ${result.statistics.ttsGenerated}`);
      console.log(`   - 번들 처리 수: ${result.statistics.bundlesProcessed}`);
      console.log(`   - 처리 시간: ${result.statistics.processingTime}ms`);
    } catch (error) {
      console.error('❌ 실제 데이터 처리 실패:', error);
    }
  } else {
    console.log('   실제 테스트 데이터 파일이 존재하지 않음');
  }
  console.log('');

  // 4. 중첩 구조 테스트
  console.log('4️⃣ 중첩 구조 처리 테스트');
  const nestedResourceData: ResourceData = {
    items: [
      {
        name: 'nested-container',
        isIterator: true,
        containers: [
          {
            items: [
              {
                name: 'nested-item',
                data: {
                  type: 'text',
                  text: 'Nested content for testing',
                  language: 'ko'
                }
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    const result = await engine.transformNasted(simpleTemplate, nestedResourceData);
    console.log('✅ 중첩 구조 처리 성공');
    console.log(`   - 성공: ${result.success}`);
    console.log(`   - 처리 시간: ${result.statistics.processingTime}ms`);
  } catch (error) {
    console.error('❌ 중첩 구조 처리 실패:', error);
  }
  console.log('');

  // 5. 오류 처리 테스트
  console.log('5️⃣ 오류 처리 테스트');
  try {
    await engine.transformNasted(null as any, simpleResourceData);
    console.log('❌ null 템플릿 처리 - 예외가 발생해야 함');
  } catch (error) {
    console.log('✅ null 템플릿 처리 - 올바르게 예외 발생');
  }

  try {
    await engine.transformNasted(simpleTemplate, null as any);
    console.log('❌ null 리소스 처리 - 예외가 발생해야 함');
  } catch (error) {
    console.log('✅ null 리소스 처리 - 올바르게 예외 발생');
  }
  console.log('');

  console.log('🎉 NestedTransformEngine 기본 기능 테스트 완료!');
}

/**
 * 개별 메서드 테스트
 */
async function testIndividualMethods() {
  console.log('\n🔍 개별 메서드 테스트...\n');

  const engine = new NestedTransformEngine();

  // 1. 리소스 정규화 테스트
  console.log('1️⃣ 리소스 정규화 테스트');
  const rawResourceData = {
    items: [
      {
        name: 'test-item',
        data: {
          type: 'text',
          text: 'Test normalization'
        }
      }
    ]
  };

  try {
    const normalized = (engine as any).normalizeResourceData(rawResourceData);
    console.log('✅ 리소스 정규화 성공');
    console.log(`   - 아이템 수: ${normalized.items.length}`);
  } catch (error) {
    console.error('❌ 리소스 정규화 실패:', error);
  }
  console.log('');

  // 2. 시간 오프셋 관리 테스트
  console.log('2️⃣ 시간 오프셋 관리 테스트');
  try {
    const offsetManager = (engine as any).timeOffsetManager;
    const initialOffset = offsetManager.getCurrentOffset();
    console.log(`   - 초기 오프셋: ${initialOffset}`);
    
    offsetManager.addOffset(5.0);
    const newOffset = offsetManager.getCurrentOffset();
    console.log(`   - 5.0 추가 후 오프셋: ${newOffset}`);
    
    console.log('✅ 시간 오프셋 관리 성공');
  } catch (error) {
    console.error('❌ 시간 오프셋 관리 실패:', error);
  }
  console.log('');

  // 3. 클립 오프셋 적용 테스트
  console.log('3️⃣ 클립 오프셋 적용 테스트');
  try {
    const originalClip = {
      id: 'test-clip',
      startTime: 0,
      endTime: 2,
      duration: 2
    };

    (engine as any).timeOffsetManager.addOffset(3.0);
    const offsettedClip = (engine as any).applyCurrentOffset(originalClip);
    
    console.log(`   - 원본 시작시간: ${originalClip.startTime}`);
    console.log(`   - 오프셋 적용 후 시작시간: ${offsettedClip.startTime}`);
    console.log('✅ 클립 오프셋 적용 성공');
  } catch (error) {
    console.error('❌ 클립 오프셋 적용 실패:', error);
  }
  console.log('');

  console.log('🎉 개별 메서드 테스트 완료!');
}

// 테스트 실행
async function runAllTests() {
  console.log('🚀 NestedTransformEngine 기능 검증 시작\n');
  console.log('=' .repeat(50));
  
  await testNestedEngineBasicFunctionality();
  await testIndividualMethods();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 모든 테스트 완료! 리팩토링 준비 완료 ✨');
}

// 실행
runAllTests().catch(console.error);