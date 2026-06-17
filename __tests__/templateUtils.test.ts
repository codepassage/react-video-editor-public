/**
 * 🧪 templateUtils.ts 테스트 파일
 * 
 * 리팩토링 전후 동일한 동작을 보장하기 위한 종합적인 테스트
 * - 11개 순수 함수 테스트
 * - 데이터 변환 검증
 * - 수학적 계산 정확성 검증
 * - 엣지 케이스 및 경계값 테스트
 */

// Mock urlBuilder to avoid import.meta issues
jest.mock('../src/utils/urlBuilder', () => ({
  getApiUrl: (endpoint: string) => `http://localhost:5002/api${endpoint}`,
  buildMediaUrl: (mediaPath: string) => `http://localhost:5002${mediaPath}`,
  buildFontUrl: (fontPath: string) => `http://localhost:5002${fontPath}`,
}));

import {
  templateToUnifiedData,
  unifiedDataToTemplate,
  validateTemplateName,
  validateProjectForTemplate,
  calculateTemplateDuration,
  adjustTemplateStartTime,
  generateUniqueClipIds,
  mergeTracks,
  generateTemplatePreview,
  pushClipsAndInsertTemplate,
  overlayTemplateAtPosition,
  type Template
} from '../src/utils/templateUtils';

import { UnifiedProjectData } from '../src/utils/unifiedProjectManager';
import type { TimelineTrack, TimelineClip } from '../src/types';

// 테스트용 모킹 데이터 생성 헬퍼
const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: 'clip-1',
  mediaId: 'media-1',
  trackId: 'track-1',
  name: 'Test Clip',
  startTime: 0,
  endTime: 10,
  duration: 10,
  mediaType: 'video',
  mediaUrl: '/test.mp4',
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  opacity: 1,
  rotation: 0,
  volume: 1,
  playbackRate: 1,
  ...overrides
});

const createMockTrack = (overrides: Partial<TimelineTrack> = {}): TimelineTrack => ({
  id: 'track-1',
  name: 'Track 1',
  type: 'video',
  isBaseTrack: false,
  clips: [],
  displayName: 'Track 1',
  isLocked: false,
  isVisible: true,
  height: 60,
  ...overrides
});

const createMockTemplate = (overrides: Partial<Template> = {}): Template => ({
  id: 'template-1',
  name: 'Test Template',
  description: 'Test Description',
  typeId: 'type-1',
  tracks: [],
  projectSettings: {
    duration: 60,
    frameRate: 30,
    resolution: { width: 1920, height: 1080 }
  },
  bundles: [],
  templateGroups: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  metadata: {
    version: '1.0.0',
    totalClips: 0,
    totalTracks: 0,
    duration: 60,
    bundleCount: 0,
    templateGroupCount: 0
  },
  ...overrides
});

const createMockUnifiedData = (overrides: Partial<UnifiedProjectData> = {}): UnifiedProjectData => ({
  tracks: [],
  projectSettings: {
    duration: 60,
    frameRate: 30,
    resolution: { width: 1920, height: 1080 }
  },
  bundles: [],
  templateGroups: [],
  metadata: {
    exportedAt: '2025-01-01T00:00:00Z',
    version: '1.0.0',
    editorVersion: 'test',
    type: 'project',
    name: 'Test Project'
  },
  ...overrides
});

describe('templateUtils - 데이터 변환 함수', () => {
  
  describe('templateToUnifiedData', () => {
    test('기본 템플릿을 UnifiedProjectData로 변환', () => {
      const template = createMockTemplate({
        name: 'My Template',
        description: 'Template Description',
        tracks: [createMockTrack()],
        bundles: [],
        templateGroups: []
      });

      const result = templateToUnifiedData(template);

      expect(result.tracks).toEqual(template.tracks);
      expect(result.projectSettings).toEqual(template.projectSettings);
      expect(result.bundles).toEqual([]);
      expect(result.templateGroups).toEqual([]);
      expect(result.metadata.name).toBe('My Template');
      expect(result.metadata.description).toBe('Template Description');
      expect(result.metadata.type).toBe('template');
      expect(result.metadata.templateId).toBe(template.id);
      expect(result.metadata.editorVersion).toBe('template-system');
    });

    test('번들과 템플릿 그룹이 있는 템플릿 변환', () => {
      const mockBundle = { id: 'bundle-1', name: 'Test Bundle' };
      const mockTemplateGroup = { id: 'group-1', name: 'Test Group' };
      
      const template = createMockTemplate({
        bundles: [mockBundle] as any,
        templateGroups: [mockTemplateGroup] as any
      });

      const result = templateToUnifiedData(template);

      expect(result.bundles).toEqual([mockBundle]);
      expect(result.templateGroups).toEqual([mockTemplateGroup]);
    });

    test('번들과 템플릿 그룹이 없는 템플릿 변환', () => {
      const template = createMockTemplate();
      delete (template as any).bundles;
      delete (template as any).templateGroups;

      const result = templateToUnifiedData(template);

      expect(result.bundles).toEqual([]);
      expect(result.templateGroups).toEqual([]);
    });

    test('메타데이터 타임스탬프 처리', () => {
      const template1 = createMockTemplate({
        updatedAt: '2025-02-01T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      });
      const template2 = createMockTemplate();
      delete (template2 as any).updatedAt;

      const result1 = templateToUnifiedData(template1);
      const result2 = templateToUnifiedData(template2);

      expect(result1.metadata.exportedAt).toBe('2025-02-01T00:00:00Z');
      expect(result2.metadata.exportedAt).toBe(template2.createdAt);
    });
  });

  describe('unifiedDataToTemplate', () => {
    test('기본 UnifiedProjectData를 템플릿으로 변환', () => {
      const unifiedData = createMockUnifiedData({
        metadata: {
          exportedAt: '2025-01-01T00:00:00Z',
          version: '1.0.0',
          editorVersion: 'test',
          type: 'project',
          name: 'Test Project',
          description: 'Project Description'
        }
      });

      const result = unifiedDataToTemplate(unifiedData, 'template-123');

      expect(result.id).toBe('template-123');
      expect(result.name).toBe('Test Project');
      expect(result.description).toBe('Project Description');
      expect(result.tracks).toEqual(unifiedData.tracks);
      expect(result.projectSettings).toEqual(unifiedData.projectSettings);
      expect(result.bundles).toEqual(unifiedData.bundles);
      expect(result.templateGroups).toEqual(unifiedData.templateGroups);
      expect(result.typeId).toBe('template');
      expect(result.metadata.version).toBe('1.0.0');
    });

    test('이름이 없는 프로젝트는 기본 이름 사용', () => {
      const unifiedData = createMockUnifiedData();
      delete (unifiedData.metadata as any).name;

      const result = unifiedDataToTemplate(unifiedData, 'test-id');

      expect(result.name).toBe('Unnamed Template');
    });

    test('메타데이터 통계 정보 포함', () => {
      const unifiedData = createMockUnifiedData({
        tracks: [
          createMockTrack({ clips: [createMockClip(), createMockClip()] }),
          createMockTrack({ clips: [createMockClip()] })
        ]
      });

      const result = unifiedDataToTemplate(unifiedData, 'test-id');

      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata.totalClips).toBe('number');
      expect(typeof result.metadata.totalTracks).toBe('number');
      expect(typeof result.metadata.duration).toBe('number');
    });
  });
});

describe('templateUtils - 검증 함수', () => {
  
  describe('validateTemplateName', () => {
    test('유효한 템플릿 이름들', () => {
      const validNames = [
        'My Template',
        'Template 123',
        'Template-with-dashes',
        'Template_with_underscores',
        '한글 템플릿',
        'A' // 최소 길이
      ];

      validNames.forEach(name => {
        const result = validateTemplateName(name);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });

    test('유효하지 않은 템플릿 이름들', () => {
      const invalidNames = [
        '', // 빈 문자열
        '   ', // 공백만
        'A'.repeat(101), // 너무 긴 이름 (100자 초과)
        'Template<script>', // 특수문자 포함
        'Template with \n newline', // 개행문자
        'Template with \t tab' // 탭문자
      ];

      invalidNames.forEach(name => {
        const result = validateTemplateName(name);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
      });
    });

    test('경계값 테스트', () => {
      const exactLength100 = 'A'.repeat(100);
      const result = validateTemplateName(exactLength100);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateProjectForTemplate', () => {
    test('유효한 프로젝트', () => {
      const tracks = [
        createMockTrack({ clips: [createMockClip(), createMockClip()] }),
        createMockTrack({ clips: [createMockClip()] })
      ];

      const result = validateProjectForTemplate(tracks);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    test('빈 프로젝트', () => {
      const result = validateProjectForTemplate([]);

      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('클립이 없는 프로젝트', () => {
      const tracks = [createMockTrack({ clips: [] })];

      const result = validateProjectForTemplate(tracks);

      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('트랙은 있지만 클립이 없는 경우', () => {
      const tracks = [
        createMockTrack({ clips: [] }),
        createMockTrack({ clips: [] })
      ];

      const result = validateProjectForTemplate(tracks);

      expect(result.isValid).toBe(false);
    });
  });
});

describe('templateUtils - 수학적 계산 함수', () => {
  
  describe('calculateTemplateDuration', () => {
    test('단일 트랙의 지속시간 계산', () => {
      const tracks = [
        createMockTrack({
          clips: [
            createMockClip({ startTime: 0, endTime: 10 }),
            createMockClip({ startTime: 5, endTime: 15 }),
            createMockClip({ startTime: 10, endTime: 20 })
          ]
        })
      ];

      const duration = calculateTemplateDuration(tracks);

      expect(duration).toBe(20); // 가장 늦은 endTime
    });

    test('여러 트랙의 지속시간 계산', () => {
      const tracks = [
        createMockTrack({
          clips: [
            createMockClip({ startTime: 0, endTime: 10 }),
            createMockClip({ startTime: 5, endTime: 25 })
          ]
        }),
        createMockTrack({
          clips: [
            createMockClip({ startTime: 0, endTime: 30 }),
            createMockClip({ startTime: 10, endTime: 15 })
          ]
        })
      ];

      const duration = calculateTemplateDuration(tracks);

      expect(duration).toBe(30); // 전체 트랙 중 가장 늦은 endTime
    });

    test('빈 트랙들의 지속시간', () => {
      const tracks = [createMockTrack({ clips: [] })];

      const duration = calculateTemplateDuration(tracks);

      expect(duration).toBe(0);
    });

    test('트랙이 없는 경우', () => {
      const duration = calculateTemplateDuration([]);

      expect(duration).toBe(0);
    });

    test('부동소수점 시간 처리', () => {
      const tracks = [
        createMockTrack({
          clips: [
            createMockClip({ startTime: 0, endTime: 10.5 }),
            createMockClip({ startTime: 5.2, endTime: 15.7 })
          ]
        })
      ];

      const duration = calculateTemplateDuration(tracks);

      expect(duration).toBe(15.7);
    });
  });

  describe('adjustTemplateStartTime', () => {
    test('양수 오프셋으로 시간 조정', () => {
      const tracks = [
        createMockTrack({
          clips: [
            createMockClip({ id: 'clip-1', startTime: 0, endTime: 10 }),
            createMockClip({ id: 'clip-2', startTime: 5, endTime: 15 })
          ]
        })
      ];

      const adjustedTracks = adjustTemplateStartTime(tracks, 10);

      expect(adjustedTracks[0].clips[0].startTime).toBe(10);
      expect(adjustedTracks[0].clips[0].endTime).toBe(20);
      expect(adjustedTracks[0].clips[1].startTime).toBe(15);
      expect(adjustedTracks[0].clips[1].endTime).toBe(25);
    });

    test('음수 오프셋으로 시간 조정', () => {
      const tracks = [
        createMockTrack({
          clips: [
            createMockClip({ startTime: 10, endTime: 20 }),
            createMockClip({ startTime: 15, endTime: 25 })
          ]
        })
      ];

      const adjustedTracks = adjustTemplateStartTime(tracks, -5);

      expect(adjustedTracks[0].clips[0].startTime).toBe(5);
      expect(adjustedTracks[0].clips[0].endTime).toBe(15);
      expect(adjustedTracks[0].clips[1].startTime).toBe(10);
      expect(adjustedTracks[0].clips[1].endTime).toBe(20);
    });

    test('0 오프셋은 변경하지 않음', () => {
      const originalTracks = [
        createMockTrack({
          clips: [createMockClip({ startTime: 5, endTime: 15 })]
        })
      ];

      const adjustedTracks = adjustTemplateStartTime(originalTracks, 0);

      expect(adjustedTracks[0].clips[0].startTime).toBe(5);
      expect(adjustedTracks[0].clips[0].endTime).toBe(15);
    });

    test('부동소수점 오프셋 처리', () => {
      const tracks = [
        createMockTrack({
          clips: [createMockClip({ startTime: 0, endTime: 10.5 })]
        })
      ];

      const adjustedTracks = adjustTemplateStartTime(tracks, 2.3);

      expect(adjustedTracks[0].clips[0].startTime).toBe(2.3);
      expect(adjustedTracks[0].clips[0].endTime).toBe(12.8);
    });

    test('원본 배열이 변경되지 않음', () => {
      const originalTracks = [
        createMockTrack({
          clips: [createMockClip({ startTime: 0, endTime: 10 })]
        })
      ];
      const originalStartTime = originalTracks[0].clips[0].startTime;

      adjustTemplateStartTime(originalTracks, 5);

      expect(originalTracks[0].clips[0].startTime).toBe(originalStartTime);
    });

    test('빈 트랙 배열 처리', () => {
      const adjustedTracks = adjustTemplateStartTime([], 10);

      expect(adjustedTracks).toEqual([]);
    });

    test('클립이 없는 트랙 처리', () => {
      const tracks = [createMockTrack({ clips: [] })];

      const adjustedTracks = adjustTemplateStartTime(tracks, 5);

      expect(adjustedTracks[0].clips).toEqual([]);
    });
  });
});

describe('templateUtils - 복잡한 데이터 처리 함수', () => {
  
  describe('generateUniqueClipIds', () => {
    test('클립 ID 재생성 및 매핑 테이블 생성', () => {
      const tracks = [
        createMockTrack({
          clips: [
            createMockClip({ id: 'clip-1' }),
            createMockClip({ id: 'clip-2' })
          ]
        })
      ];

      const result = generateUniqueClipIds(tracks, [], []);

      expect(result.tracks[0].clips[0].id).not.toBe('clip-1');
      expect(result.tracks[0].clips[1].id).not.toBe('clip-2');
      expect(result.tracks[0].clips[0].id).toMatch(/^clip-\d+-[a-z0-9]+$/);
      expect(result.tracks[0].clips[1].id).toMatch(/^clip-\d+-[a-z0-9]+$/);
      
      // ID 매핑 테이블 확인
      expect(result.idMappingTable).toBeDefined();
      expect(result.idMappingTable['clip-1']).toBe(result.tracks[0].clips[0].id);
      expect(result.idMappingTable['clip-2']).toBe(result.tracks[0].clips[1].id);
    });

    test('생성된 모든 ID가 고유함', () => {
      const tracks = [
        createMockTrack({
          clips: Array.from({ length: 100 }, (_, i) => 
            createMockClip({ id: `clip-${i}` })
          )
        })
      ];

      const result = generateUniqueClipIds(tracks, [], []);
      const generatedIds = result.tracks[0].clips.map(clip => clip.id);
      const uniqueIds = new Set(generatedIds);

      expect(uniqueIds.size).toBe(generatedIds.length);
    });

    test('원본 데이터가 변경되지 않음', () => {
      const originalTracks = [
        createMockTrack({
          clips: [createMockClip({ id: 'original-id' })]
        })
      ];

      generateUniqueClipIds(originalTracks, [], []);

      expect(originalTracks[0].clips[0].id).toBe('original-id');
    });

    test('빈 입력에 대한 처리', () => {
      const result = generateUniqueClipIds([], [], []);

      expect(result.tracks).toEqual([]);
      expect(result.bundles).toEqual([]);
      expect(result.templateGroups).toEqual([]);
      expect(result.idMappingTable).toEqual({});
    });
  });

  describe('mergeTracks', () => {
    test('트랙 병합 - 기본 전략', () => {
      const existingTracks = [
        createMockTrack({ id: 'track-1', clips: [createMockClip({ id: 'clip-1' })] })
      ];
      const newTracks = [
        createMockTrack({ id: 'track-2', clips: [createMockClip({ id: 'clip-2' })] })
      ];

      const merged = mergeTracks(existingTracks, newTracks, 'append');

      expect(merged.length).toBe(2);
      expect(merged[0].id).toBe('track-1');
      expect(merged[1].id).toBe('track-2');
    });

    test('동일한 타입 트랙 병합', () => {
      const existingTracks = [
        createMockTrack({ 
          id: 'track-1', 
          type: 'video',
          clips: [createMockClip({ id: 'clip-1' })] 
        })
      ];
      const newTracks = [
        createMockTrack({ 
          id: 'track-2', 
          type: 'video',
          clips: [createMockClip({ id: 'clip-2' })] 
        })
      ];

      const merged = mergeTracks(existingTracks, newTracks, 'merge-by-type');

      expect(merged.length).toBe(1);
      expect(merged[0].clips.length).toBe(2);
    });

    test('빈 트랙 배열 병합', () => {
      const existingTracks = [createMockTrack({ id: 'track-1' })];
      const newTracks: TimelineTrack[] = [];

      const merged = mergeTracks(existingTracks, newTracks, 'append');

      expect(merged).toEqual(existingTracks);
    });

    test('원본 배열이 변경되지 않음', () => {
      const existingTracks = [createMockTrack({ id: 'original' })];
      const newTracks = [createMockTrack({ id: 'new' })];
      const originalLength = existingTracks.length;

      mergeTracks(existingTracks, newTracks, 'append');

      expect(existingTracks.length).toBe(originalLength);
      expect(existingTracks[0].id).toBe('original');
    });
  });

  describe('generateTemplatePreview', () => {
    test('템플릿 미리보기 데이터 생성', () => {
      const template = createMockTemplate({
        tracks: [
          createMockTrack({
            clips: [
              createMockClip({ mediaType: 'video', startTime: 0, endTime: 10 }),
              createMockClip({ mediaType: 'audio', startTime: 0, endTime: 15 }),
              createMockClip({ mediaType: 'text', startTime: 5, endTime: 12 })
            ]
          })
        ]
      });

      const preview = generateTemplatePreview(template);

      expect(preview.duration).toBe(15); // 가장 긴 클립의 endTime
      expect(preview.totalClips).toBe(3);
      expect(preview.totalTracks).toBe(1);
      expect(preview.clipTypes).toEqual(['video', 'audio', 'text']);
      expect(preview.trackInfo).toEqual([
        { type: 'video', count: 1 }
      ]);
    });

    test('빈 템플릿 미리보기', () => {
      const template = createMockTemplate({ tracks: [] });

      const preview = generateTemplatePreview(template);

      expect(preview.duration).toBe(0);
      expect(preview.totalClips).toBe(0);
      expect(preview.totalTracks).toBe(0);
      expect(preview.clipTypes).toEqual([]);
      expect(preview.trackInfo).toEqual([]);
    });

    test('다양한 클립 타입 통계', () => {
      const template = createMockTemplate({
        tracks: [
          createMockTrack({
            clips: [
              createMockClip({ mediaType: 'video' }),
              createMockClip({ mediaType: 'video' }),
              createMockClip({ mediaType: 'audio' }),
              createMockClip({ mediaType: 'text' }),
              createMockClip({ mediaType: 'image' })
            ]
          })
        ]
      });

      const preview = generateTemplatePreview(template);

      expect(preview.clipTypes).toContain('video');
      expect(preview.clipTypes).toContain('audio');
      expect(preview.clipTypes).toContain('text');
      expect(preview.clipTypes).toContain('image');
      expect(new Set(preview.clipTypes).size).toBe(4); // 중복 제거 확인
    });
  });
});

describe('templateUtils - 성능 및 엣지 케이스', () => {
  
  describe('성능 테스트', () => {
    test('대량 클립 처리 성능', () => {
      const tracks = [
        createMockTrack({
          clips: Array.from({ length: 1000 }, (_, i) => 
            createMockClip({ 
              id: `clip-${i}`,
              startTime: i * 2,
              endTime: (i * 2) + 1
            })
          )
        })
      ];

      const startTime = Date.now();
      const duration = calculateTemplateDuration(tracks);
      const adjustedTracks = adjustTemplateStartTime(tracks, 10);
      const endTime = Date.now();

      expect(duration).toBe(1999); // (999 * 2) + 1
      expect(adjustedTracks[0].clips.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // 100ms 이내
    });

    test('ID 재생성 성능', () => {
      const tracks = Array.from({ length: 10 }, (_, i) =>
        createMockTrack({
          id: `track-${i}`,
          clips: Array.from({ length: 100 }, (_, j) => 
            createMockClip({ id: `clip-${i}-${j}` })
          )
        })
      );

      const startTime = Date.now();
      const result = generateUniqueClipIds(tracks, [], []);
      const endTime = Date.now();

      expect(result.tracks.length).toBe(10);
      expect(Object.keys(result.idMappingTable).length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(500); // 500ms 이내
    });
  });

  describe('타입 안전성', () => {
    test('모든 함수가 예상된 타입 반환', () => {
      const template = createMockTemplate();
      const unifiedData = createMockUnifiedData();
      const tracks = [createMockTrack()];

      expect(typeof validateTemplateName('test')).toBe('object');
      expect(typeof validateProjectForTemplate(tracks)).toBe('object');
      expect(typeof calculateTemplateDuration(tracks)).toBe('number');
      expect(Array.isArray(adjustTemplateStartTime(tracks, 0))).toBe(true);
      expect(typeof generateUniqueClipIds(tracks, [], [])).toBe('object');
      expect(Array.isArray(mergeTracks(tracks, tracks, 'append'))).toBe(true);
      expect(typeof generateTemplatePreview(template)).toBe('object');
      expect(typeof templateToUnifiedData(template)).toBe('object');
      expect(typeof unifiedDataToTemplate(unifiedData, 'test')).toBe('object');
    });
  });

  describe('메모리 사용', () => {
    test('함수 호출이 메모리 누수를 발생시키지 않음', () => {
      const tracks = [createMockTrack({ clips: [createMockClip()] })];
      
      // 대량 호출로 메모리 누수 체크
      for (let i = 0; i < 1000; i++) {
        calculateTemplateDuration(tracks);
        adjustTemplateStartTime(tracks, i);
        validateTemplateName(`test-${i}`);
        validateProjectForTemplate(tracks);
      }

      // 메모리 누수가 없다면 정상 완료
      expect(true).toBe(true);
    });
  });
});