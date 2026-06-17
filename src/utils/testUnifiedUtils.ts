// 통합 유틸리티 테스트 스크립트
// 이 파일을 src/utils/testUnifiedUtils.ts로 저장하여 사용하세요

import { UnifiedProjectManager, UnifiedProjectData } from './unifiedProjectManager';
import { exportProjectAsJSON, downloadProjectJSON, importProjectFromJSON } from './projectExport';
import { saveTemplate, loadTemplateAtBeginning } from './templateUtils';

// 🧪 테스트 데이터 생성
const createTestData = () => {
  return {
    tracks: [
      {
        id: 'track-1',
        name: 'Video Track',
        type: 'video',
        isBaseTrack: false,
        clips: [
          {
            id: 'clip-1',
            mediaType: 'video',
            startTime: 0,
            endTime: 10,
            duration: 10,
            x: 100,
            y: 100,
            width: 400,
            height: 300,
            opacity: 1,
            trackId: 'track-1'
          },
          {
            id: 'clip-2',
            mediaType: 'text',
            text: 'Test Text',
            startTime: 5,
            endTime: 15,
            duration: 10,
            x: 200,
            y: 200,
            width: 300,
            height: 100,
            opacity: 1,
            trackId: 'track-1'
          }
        ]
      }
    ],
    projectSettings: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 60,
      backgroundColor: '#000000'
    },
    bundles: [
      {
        id: 'bundle-1',
        name: 'Test Bundle',
        color: '#FF6B6B',
        createdAt: Date.now(),
        baseClipIds: ['clip-1'],
        templateGroupIds: [],
        startTime: 0,
        endTime: 10
      }
    ],
    templateGroups: [
      {
        id: 'group-1',
        name: 'Test Template Group',
        templateId: 'template-123',
        clipIds: ['clip-2'],
        startTime: 5,
        endTime: 15,
        isProtected: true,
        color: '#4CAF50',
        createdAt: Date.now()
      }
    ]
  };
};

// 🔍 테스트 함수들
export const runUnifiedUtilsTests = async () => {
  console.log('🧪 통합 유틸리티 테스트 시작');
  console.log('====================================');

  try {
    // 1. 테스트 데이터 생성
    console.log('\n1️⃣ 테스트 데이터 생성');
    const testData = createTestData();
    console.log('✅ 테스트 데이터 생성 완료:', {
      tracks: testData.tracks.length,
      clips: testData.tracks.reduce((sum, track) => sum + track.clips.length, 0),
      bundles: testData.bundles.length,
      templateGroups: testData.templateGroups.length
    });

    // 2. UnifiedProjectManager 기본 기능 테스트
    console.log('\n2️⃣ UnifiedProjectManager 기본 기능 테스트');
    
    const unifiedData = UnifiedProjectManager.exportToUnifiedFormat(
      testData.tracks,
      testData.projectSettings,
      testData.bundles,
      testData.templateGroups,
      { type: 'project', name: 'Test Project' }
    );
    
    console.log('✅ exportToUnifiedFormat 성공:', {
      type: unifiedData.metadata.type,
      name: unifiedData.metadata.name,
      tracks: unifiedData.tracks.length,
      bundles: unifiedData.bundles?.length || 0,
      templateGroups: unifiedData.templateGroups?.length || 0
    });

    // 3. 데이터 검증 테스트
    console.log('\n3️⃣ 데이터 검증 테스트');
    const validation = UnifiedProjectManager.validateData(unifiedData);
    console.log('✅ 데이터 검증 결과:', {
      isValid: validation.isValid,
      errors: validation.errors
    });

    // 4. 통계 생성 테스트
    console.log('\n4️⃣ 통계 생성 테스트');
    const stats = UnifiedProjectManager.generateStatistics(unifiedData);
    console.log('✅ 통계 생성 성공:', stats);

    // 5. 기존 호환성 테스트
    console.log('\n5️⃣ 기존 API 호환성 테스트');
    
    const legacyProjectData = exportProjectAsJSON(
      testData.tracks,
      testData.projectSettings,
      testData.bundles,
      testData.templateGroups
    );
    
    console.log('✅ 기존 exportProjectAsJSON 호환성 확인:', {
      tracks: legacyProjectData.tracks.length,
      bundles: legacyProjectData.bundles?.length || 0,
      templateGroups: legacyProjectData.templateGroups?.length || 0,
      version: legacyProjectData.metadata.version
    });

    // 6. JSON 직렬화/역직렬화 테스트
    console.log('\n6️⃣ JSON 직렬화/역직렬화 테스트');
    
    const jsonString = JSON.stringify(unifiedData, null, 2);
    const deserializedData = JSON.parse(jsonString);
    const importedData = UnifiedProjectManager.importFromUnifiedFormat(deserializedData);
    
    console.log('✅ JSON 직렬화/역직렬화 성공:', {
      originalSize: jsonString.length,
      deserializedTracks: importedData.tracks.length,
      deserializedBundles: importedData.bundles?.length || 0,
      deserializedTemplateGroups: importedData.templateGroups?.length || 0
    });

    // 7. 기존 포맷 마이그레이션 테스트
    console.log('\n7️⃣ 기존 포맷 마이그레이션 테스트');
    
    // 구 버전 포맷 시뮬레이션
    const legacyFormat = {
      tracks: testData.tracks,
      projectSettings: testData.projectSettings,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        editorVersion: 'v1.0.0'
      }
    };
    
    const migratedData = UnifiedProjectManager.migrateFromLegacyFormat(legacyFormat);
    console.log('✅ 기존 포맷 마이그레이션 성공:', {
      type: migratedData.metadata.type,
      version: migratedData.metadata.version,
      bundles: migratedData.bundles?.length || 0,
      templateGroups: migratedData.templateGroups?.length || 0
    });

    // 8. 템플릿 변환 테스트
    console.log('\n8️⃣ 템플릿 변환 테스트');
    
    const templateData = UnifiedProjectManager.exportToUnifiedFormat(
      testData.tracks,
      testData.projectSettings,
      testData.bundles,
      testData.templateGroups,
      {
        type: 'template',
        name: 'Test Template',
        description: 'Template for testing',
        templateId: 'template-test-123'
      }
    );
    
    console.log('✅ 템플릿 변환 성공:', {
      type: templateData.metadata.type,
      name: templateData.metadata.name,
      templateId: templateData.metadata.templateId,
      description: templateData.metadata.description
    });

    // 9. 파일 이름 생성 테스트
    console.log('\n9️⃣ 파일 이름 생성 테스트');
    
    // 프로젝트용 다운로드 시뮬레이션
    const projectBlob = new Blob([JSON.stringify(unifiedData)], { type: 'application/json' });
    console.log('✅ 프로젝트 파일 Blob 생성:', {
      size: projectBlob.size,
      type: projectBlob.type
    });
    
    // 템플릿용 다운로드 시뮬레이션
    const templateBlob = new Blob([JSON.stringify(templateData)], { type: 'application/json' });
    console.log('✅ 템플릿 파일 Blob 생성:', {
      size: templateBlob.size,
      type: templateBlob.type
    });

    // 10. 성능 테스트
    console.log('\n🔟 성능 테스트');
    
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      const data = UnifiedProjectManager.exportToUnifiedFormat(
        testData.tracks,
        testData.projectSettings,
        testData.bundles,
        testData.templateGroups
      );
      UnifiedProjectManager.validateData(data);
      UnifiedProjectManager.generateStatistics(data);
    }
    
    const endTime = performance.now();
    const averageTime = (endTime - startTime) / 100;
    
    console.log('✅ 성능 테스트 완료:', {
      iterations: 100,
      totalTime: `${(endTime - startTime).toFixed(2)}ms`,
      averageTime: `${averageTime.toFixed(2)}ms`,
      operationsPerSecond: Math.round(1000 / averageTime)
    });

    console.log('\n✅ 모든 테스트 통과!');
    console.log('====================================');
    
    return {
      success: true,
      message: '모든 통합 유틸리티 테스트가 성공적으로 완료되었습니다!',
      stats: {
        validation,
        statistics: stats,
        performance: {
          averageTime,
          operationsPerSecond: Math.round(1000 / averageTime)
        }
      }
    };

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return {
      success: false,
      message: '테스트 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};

// 🧪 개별 기능 테스트 함수들
export const testExportImport = async () => {
  console.log('📤📥 내보내기/가져오기 테스트');
  
  const testData = createTestData();
  
  // 내보내기
  const exported = UnifiedProjectManager.exportToUnifiedFormat(
    testData.tracks,
    testData.projectSettings,
    testData.bundles,
    testData.templateGroups
  );
  
  // JSON 변환
  const jsonString = JSON.stringify(exported);
  const parsed = JSON.parse(jsonString);
  
  // 가져오기
  const imported = UnifiedProjectManager.importFromUnifiedFormat(parsed);
  
  // 검증
  const originalStats = UnifiedProjectManager.generateStatistics(exported);
  const importedStats = UnifiedProjectManager.generateStatistics(imported);
  
  console.log('결과 비교:', {
    original: originalStats,
    imported: importedStats,
    match: JSON.stringify(originalStats) === JSON.stringify(importedStats)
  });
  
  return JSON.stringify(originalStats) === JSON.stringify(importedStats);
};

export const testValidation = () => {
  console.log('✅ 검증 기능 테스트');
  
  // 유효한 데이터
  const validData = createTestData();
  const validUnified = UnifiedProjectManager.exportToUnifiedFormat(
    validData.tracks,
    validData.projectSettings,
    validData.bundles,
    validData.templateGroups
  );
  
  const validResult = UnifiedProjectManager.validateData(validUnified);
  console.log('유효한 데이터 검증:', validResult);
  
  // 무효한 데이터
  const invalidData = { ...validUnified };
  delete invalidData.tracks;
  
  const invalidResult = UnifiedProjectManager.validateData(invalidData as any);
  console.log('무효한 데이터 검증:', invalidResult);
  
  return validResult.isValid && !invalidResult.isValid;
};

// 🎮 브라우저 콘솔에서 실행할 수 있는 테스트 함수
export const runQuickTest = () => {
  console.log('🚀 빠른 테스트 실행');
  
  const testData = createTestData();
  const unified = UnifiedProjectManager.exportToUnifiedFormat(
    testData.tracks,
    testData.projectSettings,
    testData.bundles,
    testData.templateGroups,
    { type: 'project' }
  );
  
  const validation = UnifiedProjectManager.validateData(unified);
  const stats = UnifiedProjectManager.generateStatistics(unified);
  
  console.log('📊 테스트 결과:');
  console.log('- 검증:', validation.isValid ? '✅ 통과' : '❌ 실패');
  console.log('- 통계:', stats);
  
  if (validation.isValid) {
    console.log('🎉 통합 유틸리티가 정상적으로 작동합니다!');
  } else {
    console.log('⚠️ 문제가 발견되었습니다:', validation.errors);
  }
  
  return { validation, stats };
};

// 🌟 모든 테스트를 실행하는 메인 함수
export const runAllTests = async () => {
  console.log('🧪 전체 테스트 실행');
  
  const results = {
    unified: await runUnifiedUtilsTests(),
    exportImport: await testExportImport(),
    validation: testValidation(),
    quick: runQuickTest()
  };
  
  const allPassed = results.unified.success && results.exportImport && results.validation;
  
  console.log('\n🏁 전체 테스트 결과:');
  console.log('- 통합 유틸리티:', results.unified.success ? '✅' : '❌');
  console.log('- 내보내기/가져오기:', results.exportImport ? '✅' : '❌');
  console.log('- 검증 기능:', results.validation ? '✅' : '❌');
  
  if (allPassed) {
    console.log('\n🎉 모든 테스트가 성공적으로 완료되었습니다!');
    console.log('통합 유틸리티가 정상적으로 작동하며, Bundle 정보도 올바르게 처리됩니다.');
  } else {
    console.log('\n⚠️ 일부 테스트가 실패했습니다. 로그를 확인해주세요.');
  }
  
  return { allPassed, results };
};

// 사용 예시:
// import { runAllTests } from './testUnifiedUtils';
// runAllTests();
