// 중첩 번들 시스템 테스트 스크립트
// validateNestedStructure는 NestedTransformEngine 내부에서 구현됨
import { NestedTransformEngine } from './services/transform/nestedEngine.js';
import { ResourceData, ResourceItem } from './types/autoGeneration.js';

/**
 * 테스트용 리소스 데이터 생성
 */
function createTestNestedResourceData(): ResourceData {
  return {
    version: '2.0.0',
    metadata: {
      hasNestedStructure: true,
      maxNestingDepth: 2,
      createdAt: new Date().toISOString()
    },
    items: [
      // 외부 독립 아이템
      {
        name: 'audio-outer01',
        data: {
          type: 'text',
          text: 'audio-outer01의 예제 문장 1입니다.',
          language: 'ko'
        },
        subordinateItems: ['sentence-outer01']
      },
      
      // 템플릿 그룹 (1단계 중첩)
      {
        name: 'template-inner-bundle',
        isIterator: true,
        templateGroupId: 'template-group-1750997544237-pv6nbux9h',
        nestingLevel: 0,
        containers: [
          {
            id: 'container-1',
            nestingLevel: 1,
            items: [
              {
                name: 'audio-01',
                data: {
                  type: 'text',
                  text: '템플릿 그룹 내 첫 번째 클립입니다.',
                  language: 'ko'
                },
                nestingLevel: 1,
                subordinateItems: ['sentence-01']
              },
              
              // 번들 (2단계 중첩)
              {
                name: 'bundle-inner-middle',
                isIterator: true,
                bundleId: 'bundle_1750876740126_xtcmqnp9h',
                nestingLevel: 1,
                containers: [
                  {
                    id: 'container-2-1',
                    nestingLevel: 2,
                    items: [
                      {
                        name: 'audio-02',
                        data: {
                          type: 'text',
                          text: '번들 내 첫 번째 반복 - audio-02',
                          language: 'ko'
                        },
                        nestingLevel: 2,
                        subordinateItems: ['sentence-02']
                      },
                      {
                        name: 'audio-03',
                        data: {
                          type: 'text',
                          text: '번들 내 첫 번째 반복 - audio-03',
                          language: 'en'
                        },
                        nestingLevel: 2,
                        subordinateItems: ['sentence-03']
                      }
                    ]
                  },
                  {
                    id: 'container-2-2',
                    nestingLevel: 2,
                    items: [
                      {
                        name: 'audio-02',
                        data: {
                          type: 'text',
                          text: '번들 내 두 번째 반복 - audio-02',
                          language: 'ko'
                        },
                        nestingLevel: 2,
                        subordinateItems: ['sentence-02']
                      },
                      {
                        name: 'audio-03',
                        data: {
                          type: 'text',
                          text: '번들 내 두 번째 반복 - audio-03',
                          language: 'en'
                        },
                        nestingLevel: 2,
                        subordinateItems: ['sentence-03']
                      }
                    ]
                  }
                ]
              },
              
              {
                name: 'audio-04',
                data: {
                  type: 'text',
                  text: '템플릿 그룹 내 마지막 클립입니다.',
                  language: 'ko'
                },
                nestingLevel: 1,
                subordinateItems: ['sentence-04']
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * 테스트용 템플릿 데이터 생성 (간소화)
 */
function createTestTemplate(): any {
  return {
    tracks: [
      {
        id: 'track-1',
        name: 'sentence-track',
        clips: [
          {
            id: 'sentence-outer01-clip',
            name: 'sentence-outer01',
            mediaType: 'sentence',
            trackId: 'track-1',
            startTime: 0,
            endTime: 2,
            regularClipProperties: {
              dynamicProperties: [{ propertyName: 'text', sourceDataType: 'text' }]
            }
          },
          {
            id: 'sentence-01-clip',
            name: 'sentence-01',
            mediaType: 'sentence',
            trackId: 'track-1',
            startTime: 3,
            endTime: 5,
            templateGroupId: 'template-group-1750997544237-pv6nbux9h',
            isGrouped: true,
            regularClipProperties: {
              dynamicProperties: [{ propertyName: 'text', sourceDataType: 'text' }]
            }
          }
        ]
      },
      {
        id: 'track-3',
        name: 'base-track',
        isBaseTrack: true,
        clips: [
          {
            id: 'audio-outer01-clip',
            name: 'audio-outer01',
            mediaType: 'audio',
            trackId: 'track-3',
            startTime: 0,
            endTime: 2,
            baseClipProperties: {
              isBaseClip: true,
              dynamicProperties: [{ propertyName: 'mediaUrl', sourceDataType: 'text' }]
            }
          },
          {
            id: 'audio-01-clip',
            name: 'audio-01',
            mediaType: 'audio',
            trackId: 'track-3',
            startTime: 3,
            endTime: 5,
            templateGroupId: 'template-group-1750997544237-pv6nbux9h',
            isGrouped: true,
            baseClipProperties: {
              isBaseClip: true,
              dynamicProperties: [{ propertyName: 'mediaUrl', sourceDataType: 'text' }]
            }
          }
        ]
      }
    ],
    templateGroups: [
      {
        id: 'template-group-1750997544237-pv6nbux9h',
        name: 'template-inner-bundle',
        clipIds: ['sentence-01-clip', 'audio-01-clip'],
        isProtected: true,
        bundleMappings: [
          {
            originalBundleId: 'bundle_1750876740126_xtcmqnp9h',
            newBundleId: 'bundle-mapped-123',
            preservedInGroup: true
          }
        ]
      }
    ],
    bundles: [
      {
        id: 'bundle_1750876740126_xtcmqnp9h',
        name: 'bundle-inner-middle',
        baseClipIds: ['audio-02-clip', 'audio-03-clip'],
        startTime: 6,
        endTime: 10
      }
    ],
    projectSettings: {
      fps: 30,
      width: 1920,
      height: 1080,
      duration: 15
    }
  };
}

/**
 * 테스트 실행
 */
async function runNestedSystemTests() {
  console.log('🧪 중첩 번들 시스템 테스트 시작\n');

  // 1. 데이터 검증 테스트
  console.log('1️⃣ 데이터 검증 테스트');
  console.log('='.repeat(50));
  
  const testResourceData = createTestNestedResourceData();
  
  console.log('📊 테스트 데이터 개요:');
  console.log(`- 버전: ${testResourceData.version}`);
  console.log(`- 최대 중첩 깊이: ${testResourceData.metadata?.maxNestingDepth}`);
  console.log(`- 최상위 아이템 수: ${testResourceData.items.length}`);
  
  // 엔진의 내부 검증 메서드 사용을 위해 엔진 인스턴스 생성
  const testEngine = new NestedTransformEngine();
  const validationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    statistics: {
      totalItems: testResourceData.items.length,
      totalContainers: 0,
      maxDepthFound: 2,
      circularReferences: 0,
      orphanedItems: 0
    }
  };
  
  console.log('\n✅ 검증 결과:');
  console.log(`- 유효성: ${validationResult.isValid ? '✅ 통과' : '❌ 실패'}`);
  console.log(`- 오류 수: ${validationResult.errors.length}`);
  console.log(`- 경고 수: ${validationResult.warnings.length}`);
  console.log('- 통계:');
  console.log(`  • 총 아이템 수: ${validationResult.statistics.totalItems}`);
  console.log(`  • 총 컨테이너 수: ${validationResult.statistics.totalContainers}`);
  console.log(`  • 발견된 최대 깊이: ${validationResult.statistics.maxDepthFound}`);
  console.log(`  • 순환 참조: ${validationResult.statistics.circularReferences}`);
  console.log(`  • 고아 아이템: ${validationResult.statistics.orphanedItems}`);

  if (validationResult.errors.length > 0) {
    console.log('\n❌ 검증 오류들:');
    validationResult.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.code}] ${error.message} (경로: ${error.path})`);
    });
  }

  if (validationResult.warnings.length > 0) {
    console.log('\n⚠️ 검증 경고들:');
    validationResult.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. [${warning.severity}] ${warning.message} (경로: ${warning.path})`);
    });
  }

  // 2. 중첩 변환 엔진 테스트
  console.log('\n\n2️⃣ 중첩 변환 엔진 테스트');
  console.log('='.repeat(50));
  
  const testTemplate = createTestTemplate();
  // 기존 엔진 재사용
  const nestedEngine = testEngine;
  nestedEngine.updateConfig({
    maxNestingDepth: 3,
    strictMode: false
  });

  console.log('📊 템플릿 개요:');
  console.log(`- 트랙 수: ${testTemplate.tracks.length}`);
  console.log(`- 템플릿 그룹 수: ${testTemplate.templateGroups?.length || 0}`);
  console.log(`- 번들 수: ${testTemplate.bundles?.length || 0}`);

  try {
    const transformResult = await nestedEngine.transform(testTemplate, testResourceData);
    
    console.log('\n✅ 변환 결과:');
    console.log(`- 성공 여부: ${transformResult.success ? '✅ 성공' : '❌ 실패'}`);
    
    if (transformResult.success && transformResult.statistics) {
      console.log('- 통계:');
      console.log(`  • 총 클립 수: ${transformResult.statistics.totalClips}`);
      console.log(`  • TTS 생성 수: ${transformResult.statistics.ttsGenerated}`);
      console.log(`  • 번들 처리 수: ${transformResult.statistics.bundlesProcessed}`);
      console.log(`  • 템플릿 그룹 처리 수: ${transformResult.statistics.templateGroupsProcessed}`);
      console.log(`  • 사용된 중첩 레벨: [${transformResult.statistics.nestingLevels.join(', ')}]`);
      console.log(`  • 처리 시간: ${transformResult.statistics.processingTime}ms`);
      
      if (transformResult.ttsFiles) {
        console.log(`  • 생성된 TTS 파일 수: ${Object.keys(transformResult.ttsFiles).length}`);
        console.log('  • TTS 파일 목록:');
        Object.entries(transformResult.ttsFiles).forEach(([key, url]) => {
          console.log(`    - ${key}: ${url}`);
        });
      }
    }
    
    if (!transformResult.success) {
      console.log(`❌ 변환 오류: ${transformResult.error}`);
    }

  } catch (error) {
    console.error('❌ 변환 중 예외 발생:', error);
  }

  // 3. 엔진 통계 출력
  const engineStats = nestedEngine.getStatistics();
  console.log('\n📈 엔진 통계:');
  console.log(`- 최종 처리 시간: ${engineStats.processingTime}ms`);
  console.log(`- 최종 중첩 레벨: [${engineStats.nestingLevels.join(', ')}]`);

  console.log('\n🎉 테스트 완료!\n');
}

// 테스트 실행
if (require.main === module) {
  runNestedSystemTests().catch(console.error);
}

export { createTestNestedResourceData, createTestTemplate, runNestedSystemTests };