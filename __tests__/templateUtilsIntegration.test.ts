/**
 * 🔗 templateUtilsIntegration.test.ts - 통합 테스트
 * 
 * 리팩토링된 templateUtils 모듈의 통합 테스트입니다.
 * 기존 import 경로로 새로운 모듈 구조에서 함수들을 올바르게 가져올 수 있는지 확인합니다.
 */

// Mock urlBuilder to avoid import.meta issues
jest.mock('../src/utils/urlBuilder', () => ({
  getApiUrl: (endpoint?: string) => `http://localhost:5002/api${endpoint || ''}`,
  buildMediaUrl: (mediaPath: string) => `http://localhost:5002${mediaPath}`,
  buildFontUrl: (fontPath: string) => `http://localhost:5002${fontPath}`,
}));

import {
  validateTemplateName,
  validateProjectForTemplate,
  calculateTemplateDuration,
  adjustTemplateStartTime,
  generateTemplatePreview,
  templateToUnifiedData,
  unifiedDataToTemplate,
  type Template
} from '../src/utils/templateUtils';

import type { TimelineTrack, VideoClip, AudioClip } from '../src/types';

// 테스트용 모킹 헬퍼
const createMockVideoClip = (overrides: Partial<VideoClip> = {}): VideoClip => ({
  id: 'clip-1',
  mediaId: 'media-1',
  trackId: 'track-1',
  name: 'Test Video Clip',
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
  isBaseTrack: false,
  clips: [],
  displayName: 'Track 1',
  isLocked: false,
  isVisible: true,
  height: 60,
  ...overrides
});

describe('templateUtils Integration Test', () => {
  
  describe('Import 검증', () => {
    test('모든 함수가 올바르게 import됨', () => {
      expect(typeof validateTemplateName).toBe('function');
      expect(typeof validateProjectForTemplate).toBe('function');
      expect(typeof calculateTemplateDuration).toBe('function');
      expect(typeof adjustTemplateStartTime).toBe('function');
      expect(typeof generateTemplatePreview).toBe('function');
      expect(typeof templateToUnifiedData).toBe('function');
      expect(typeof unifiedDataToTemplate).toBe('function');
    });
  });

  describe('기존 API 호환성', () => {
    test('validateTemplateName이 정상 동작', () => {
      const result = validateTemplateName('Test Template');
      expect(result.isValid).toBe(true);
      
      const invalidResult = validateTemplateName('');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.message).toBeDefined();
    });

    test('validateProjectForTemplate이 정상 동작', () => {
      const tracks = [createMockTrack({ clips: [createMockVideoClip()] })];
      const result = validateProjectForTemplate(tracks);
      expect(result.isValid).toBe(true);
    });

    test('calculateTemplateDuration이 정상 동작', () => {
      const tracks = [createMockTrack({ 
        clips: [createMockVideoClip({ endTime: 15 })] 
      })];
      const duration = calculateTemplateDuration(tracks);
      expect(duration).toBe(15);
    });

    test('adjustTemplateStartTime이 정상 동작', () => {
      const tracks = [createMockTrack({ 
        clips: [createMockVideoClip({ startTime: 0, endTime: 10 })] 
      })];
      const adjusted = adjustTemplateStartTime(tracks, 5);
      expect(adjusted[0].clips[0].startTime).toBe(5);
      expect(adjusted[0].clips[0].endTime).toBe(15);
    });

    test('generateTemplatePreview가 정상 동작', () => {
      const template = {
        tracks: [createMockTrack({ 
          clips: [createMockVideoClip({ endTime: 20 })] 
        })]
      };
      const preview = generateTemplatePreview(template);
      expect(preview.duration).toBe(20);
      expect(preview.totalClips).toBe(1);
      expect(preview.totalTracks).toBe(1);
    });
  });

  describe('통합 워크플로우', () => {
    test('검증 → 계산 → 조정 → 미리보기 파이프라인', () => {
      // 1. 프로젝트 검증
      const tracks = [createMockTrack({ 
        clips: [
          createMockVideoClip({ id: 'clip-1', startTime: 0, endTime: 10 }),
          createMockVideoClip({ id: 'clip-2', startTime: 10, endTime: 25 })
        ] 
      })];
      
      const validation = validateProjectForTemplate(tracks);
      expect(validation.isValid).toBe(true);
      
      // 2. 지속시간 계산
      const duration = calculateTemplateDuration(tracks);
      expect(duration).toBe(25);
      
      // 3. 시간 조정
      const adjustedTracks = adjustTemplateStartTime(tracks, 5);
      expect(adjustedTracks[0].clips[0].startTime).toBe(5);
      expect(adjustedTracks[0].clips[1].startTime).toBe(15);
      
      // 4. 미리보기 생성
      const preview = generateTemplatePreview({ tracks: adjustedTracks });
      expect(preview.duration).toBe(30); // 25 + 5 offset
      expect(preview.totalClips).toBe(2);
    });
  });

  describe('타입 정확성', () => {
    test('Template 타입이 올바르게 export됨', () => {
      // TypeScript 컴파일러가 이 테스트를 통과하면 타입이 올바름
      const mockTemplate: Template = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test Description',
        typeId: 'test-type',
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
          duration: 0,
          bundleCount: 0,
          templateGroupCount: 0
        }
      };
      
      expect(mockTemplate.id).toBe('test-template');
    });
  });
});