/**
 * 🧪 templateUtils 순수 함수 테스트
 * 
 * 외부 의존성 없이 테스트 가능한 순수 함수들만 따로 추출하여 테스트
 * 이후 리팩토링 시 이 함수들을 별도 모듈로 분리할 예정
 */

import type { TimelineTrack, TimelineClip, VideoClip, AudioClip, TextClip } from '../src/types';

// 테스트용 순수 함수들을 직접 복사하여 테스트
// (실제 리팩토링 시에는 이 함수들을 별도 모듈로 분리)

// 템플릿 이름 검증 함수 (실제 구현과 동일)
function validateTemplateName(name: string): { isValid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: '템플릿 이름을 입력해주세요.' };
  }

  if (name.length > 100) {
    return { isValid: false, message: '템플릿 이름은 100자 이하로 입력해주세요.' };
  }

  if (!/^[a-zA-Z0-9가-힣\s\-_]+$/.test(name)) {
    return { isValid: false, message: '템플릿 이름에는 문자, 숫자, 공백, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.' };
  }

  return { isValid: true };
}

// 프로젝트 검증 함수 (실제 구현과 동일)
function validateProjectForTemplate(tracks: TimelineTrack[]): { isValid: boolean; message?: string } {
  const totalClips = tracks.reduce((sum, track) => sum + track.clips.length, 0);

  if (totalClips === 0) {
    return { isValid: false, message: '템플릿으로 저장할 클립이 없습니다. 타임라인에 미디어를 추가해주세요.' };
  }

  if (tracks.length === 0) {
    return { isValid: false, message: '트랙이 없습니다.' };
  }

  return { isValid: true };
}

// 템플릿 지속시간 계산 함수 (실제 구현과 동일)
function calculateTemplateDuration(tracks: TimelineTrack[]): number {
  if (!tracks || tracks.length === 0) {
    return 0;
  }

  const allClips = tracks.flatMap(track => track.clips);

  if (allClips.length === 0) {
    return 0;
  }

  const maxEndTime = Math.max(...allClips.map(clip => clip.endTime));

  console.log('📏 템플릿 길이 계산:', {
    totalClips: allClips.length,
    maxEndTime,
    duration: `${Math.floor(maxEndTime / 60)}:${(maxEndTime % 60).toString().padStart(2, '0')}`
  });

  return maxEndTime;
}

// 템플릿 시작시간 조정 함수 (실제 구현과 동일)
function adjustTemplateStartTime(tracks: TimelineTrack[], timeOffset: number): TimelineTrack[] {
  if (!tracks || tracks.length === 0) {
    return [];
  }

  console.log('⏰ 템플릿 시작시간 조정:', {
    originalTracks: tracks.length,
    timeOffset,
    direction: timeOffset >= 0 ? '뒤로 이동' : '앞으로 이동'
  });

  const adjustedTracks = tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => ({
      ...clip,
      startTime: clip.startTime + timeOffset,
      endTime: clip.endTime + timeOffset
    }))
  }));

  console.log('✅ 시간 조정 완료:', {
    adjustedClips: adjustedTracks.reduce((sum, track) => sum + track.clips.length, 0)
  });

  return adjustedTracks;
}

// 테스트용 모킹 헬퍼 - 특정 타입별로 생성
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

const createMockAudioClip = (overrides: Partial<AudioClip> = {}): AudioClip => ({
  id: 'clip-2',
  mediaId: 'media-2',
  trackId: 'track-2',
  name: 'Test Audio Clip',
  startTime: 0,
  endTime: 10,
  duration: 10,
  mediaType: 'audio',
  mediaUrl: '/test.mp3',
  volume: 1,
  playbackRate: 1,
  ...overrides
});

const createMockTextClip = (overrides: Partial<TextClip> = {}): TextClip => ({
  id: 'clip-3',
  mediaId: 'media-3',
  trackId: 'track-3',
  name: 'Test Text Clip',
  startTime: 0,
  endTime: 10,
  duration: 10,
  mediaType: 'text',
  text: 'Test Text',
  x: 100,
  y: 100,
  width: 400,
  height: 100,
  opacity: 1,
  rotation: 0,
  fontSize: 24,
  fontFamily: 'Arial',
  textColor: '#000000',
  textAlign: 'center',
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

describe('templateUtils - 순수 함수 테스트', () => {
  
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
        'Template/with/slash', // 슬래시 포함
        'Template:with:colon', // 콜론 포함
        'Template|with|pipe', // 파이프 포함
        'Template*with*asterisk', // 애스터리스크 포함
        'Template?with?question', // 물음표 포함
        'Template"with"quote', // 따옴표 포함
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
        createMockTrack({ clips: [createMockVideoClip(), createMockAudioClip()] }),
        createMockTrack({ clips: [createMockTextClip()] })
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
  });

  describe('calculateTemplateDuration', () => {
    test('단일 트랙의 지속시간 계산', () => {
      const tracks = [
        createMockTrack({
          clips: [
            createMockVideoClip({ startTime: 0, endTime: 10 }),
            createMockAudioClip({ startTime: 5, endTime: 15 }),
            createMockTextClip({ startTime: 10, endTime: 20 })
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
            createMockVideoClip({ startTime: 0, endTime: 10 }),
            createMockVideoClip({ startTime: 5, endTime: 25 })
          ]
        }),
        createMockTrack({
          clips: [
            createMockAudioClip({ startTime: 0, endTime: 30 }),
            createMockTextClip({ startTime: 10, endTime: 15 })
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
            createMockVideoClip({ startTime: 0, endTime: 10.5 }),
            createMockAudioClip({ startTime: 5.2, endTime: 15.7 })
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
            createMockVideoClip({ id: 'clip-1', startTime: 0, endTime: 10 }),
            createMockAudioClip({ id: 'clip-2', startTime: 5, endTime: 15 })
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
            createMockVideoClip({ startTime: 10, endTime: 20 }),
            createMockTextClip({ startTime: 15, endTime: 25 })
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
          clips: [createMockVideoClip({ startTime: 5, endTime: 15 })]
        })
      ];

      const adjustedTracks = adjustTemplateStartTime(originalTracks, 0);

      expect(adjustedTracks[0].clips[0].startTime).toBe(5);
      expect(adjustedTracks[0].clips[0].endTime).toBe(15);
    });

    test('부동소수점 오프셋 처리', () => {
      const tracks = [
        createMockTrack({
          clips: [createMockVideoClip({ startTime: 0, endTime: 10.5 })]
        })
      ];

      const adjustedTracks = adjustTemplateStartTime(tracks, 2.3);

      expect(adjustedTracks[0].clips[0].startTime).toBe(2.3);
      expect(adjustedTracks[0].clips[0].endTime).toBe(12.8);
    });

    test('원본 배열이 변경되지 않음', () => {
      const originalTracks = [
        createMockTrack({
          clips: [createMockVideoClip({ startTime: 0, endTime: 10 })]
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

  describe('성능 테스트', () => {
    test('대량 클립 처리 성능', () => {
      const tracks = [
        createMockTrack({
          clips: Array.from({ length: 1000 }, (_, i) => 
            createMockVideoClip({ 
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
  });

  describe('타입 안전성', () => {
    test('모든 함수가 예상된 타입 반환', () => {
      const tracks = [createMockTrack()];

      expect(typeof validateTemplateName('test')).toBe('object');
      expect(typeof validateProjectForTemplate(tracks)).toBe('object');
      expect(typeof calculateTemplateDuration(tracks)).toBe('number');
      expect(Array.isArray(adjustTemplateStartTime(tracks, 0))).toBe(true);
    });
  });
});