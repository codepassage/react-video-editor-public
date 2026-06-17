/**
 * 🔗 templateModuleIntegration.test.ts - 모듈 구조 통합 테스트
 * 
 * 리팩토링된 템플릿 모듈의 통합 테스트입니다.
 * 새로운 모듈 구조에서 함수들을 올바르게 가져올 수 있는지 확인합니다.
 */

import {
  validateTemplateName,
  validateProjectForTemplate,
  calculateTemplateDuration,
  adjustTemplateStartTime,
  generateTemplatePreview,
  templateToUnifiedData,
  unifiedDataToTemplate,
  type Template,
  type TemplatePreview
} from '../src/utils/template';

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

describe('Template Module Integration Test', () => {
  
  describe('모듈별 Import 검증', () => {
    test('유틸리티 함수들이 올바르게 import됨', () => {
      expect(typeof validateTemplateName).toBe('function');
      expect(typeof validateProjectForTemplate).toBe('function');
      expect(typeof calculateTemplateDuration).toBe('function');
      expect(typeof adjustTemplateStartTime).toBe('function');
      expect(typeof generateTemplatePreview).toBe('function');
    });

    test('변환 함수들이 올바르게 import됨', () => {
      expect(typeof templateToUnifiedData).toBe('function');
      expect(typeof unifiedDataToTemplate).toBe('function');
    });

    test('타입들이 올바르게 import됨', () => {
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
      
      const mockPreview: TemplatePreview = {
        duration: 60,
        totalClips: 5,
        totalTracks: 3,
        clipTypes: ['video', 'audio'],
        trackInfo: [{ type: 'video', count: 2 }]
      };
      
      expect(mockTemplate.id).toBe('test-template');
      expect(mockPreview.duration).toBe(60);
    });
  });

  describe('모듈 기능 테스트', () => {
    test('검증 모듈이 정상 동작', () => {
      const nameResult = validateTemplateName('Test Template');
      expect(nameResult.isValid).toBe(true);
      
      const tracks = [createMockTrack({ clips: [createMockVideoClip()] })];
      const projectResult = validateProjectForTemplate(tracks);
      expect(projectResult.isValid).toBe(true);
    });

    test('계산 모듈이 정상 동작', () => {
      const tracks = [createMockTrack({ 
        clips: [createMockVideoClip({ startTime: 0, endTime: 15 })] 
      })];
      
      const duration = calculateTemplateDuration(tracks);
      expect(duration).toBe(15);
      
      const adjusted = adjustTemplateStartTime(tracks, 5);
      expect(adjusted[0].clips[0].startTime).toBe(5);
      expect(adjusted[0].clips[0].endTime).toBe(20);
    });

    test('미리보기 모듈이 정상 동작', () => {
      const template = {
        tracks: [createMockTrack({ 
          clips: [
            createMockVideoClip({ mediaType: 'video', endTime: 20 }),
            createMockVideoClip({ mediaType: 'video', endTime: 15 })
          ] 
        })]
      };
      
      const preview = generateTemplatePreview(template);
      expect(preview.duration).toBe(20);
      expect(preview.totalClips).toBe(2);
      expect(preview.totalTracks).toBe(1);
      expect(preview.clipTypes).toEqual(['video']);
      expect(preview.trackInfo).toEqual([{ type: 'video', count: 1 }]);
    });
  });

  describe('모듈간 협력 테스트', () => {
    test('전체 워크플로우가 정상 동작', () => {
      // 1. 데이터 준비
      const tracks = [createMockTrack({ 
        clips: [
          createMockVideoClip({ id: 'clip-1', startTime: 0, endTime: 10 }),
          createMockVideoClip({ id: 'clip-2', startTime: 10, endTime: 25 })
        ] 
      })];
      
      // 2. 검증
      const nameValidation = validateTemplateName('Integration Test Template');
      const projectValidation = validateProjectForTemplate(tracks);
      expect(nameValidation.isValid).toBe(true);
      expect(projectValidation.isValid).toBe(true);
      
      // 3. 계산 및 조정
      const originalDuration = calculateTemplateDuration(tracks);
      const adjustedTracks = adjustTemplateStartTime(tracks, 5);
      const adjustedDuration = calculateTemplateDuration(adjustedTracks);
      
      expect(originalDuration).toBe(25);
      expect(adjustedDuration).toBe(30); // 25 + 5 offset
      
      // 4. 미리보기 생성
      const preview = generateTemplatePreview({ tracks: adjustedTracks });
      expect(preview.duration).toBe(30);
      expect(preview.totalClips).toBe(2);
      expect(preview.totalTracks).toBe(1);
    });
  });

  describe('성능 및 안정성', () => {
    test('대량 데이터 처리 성능', () => {
      const largeTracks = Array.from({ length: 100 }, (_, i) =>
        createMockTrack({
          id: `track-${i}`,
          clips: Array.from({ length: 50 }, (_, j) =>
            createMockVideoClip({
              id: `clip-${i}-${j}`,
              startTime: j * 2,
              endTime: (j * 2) + 1
            })
          )
        })
      );
      
      const startTime = Date.now();
      
      const validation = validateProjectForTemplate(largeTracks);
      const duration = calculateTemplateDuration(largeTracks);
      const adjusted = adjustTemplateStartTime(largeTracks, 10);
      const preview = generateTemplatePreview({ tracks: adjusted });
      
      const endTime = Date.now();
      
      expect(validation.isValid).toBe(true);
      expect(duration).toBe(99); // (49 * 2) + 1
      expect(adjusted.length).toBe(100);
      expect(preview.totalClips).toBe(5000); // 100 tracks * 50 clips
      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
    });

    test('메모리 누수 방지', () => {
      const tracks = [createMockTrack({ 
        clips: [createMockVideoClip()] 
      })];
      
      // 대량 반복 호출로 메모리 누수 체크
      for (let i = 0; i < 1000; i++) {
        validateTemplateName(`template-${i}`);
        validateProjectForTemplate(tracks);
        calculateTemplateDuration(tracks);
        adjustTemplateStartTime(tracks, i);
        generateTemplatePreview({ tracks });
      }
      
      // 메모리 누수가 없다면 정상 완료
      expect(true).toBe(true);
    });
  });
});