/**
 * 🧪 clipCreators.ts 테스트 파일
 * 
 * 리팩토링 전후 동일한 동작을 보장하기 위한 종합적인 테스트
 * - 모든 클립 생성 함수 테스트
 * - 기본값 검증
 * - 타입 안전성 검증
 * - 예외 상황 처리 검증
 */

import {
  createAudioClip,
  createVideoClip, 
  createImageClip,
  createTextClip,
  createSentenceClip,
  createLongSentenceClip,
  createSpacerClip,
  getDefaultClipName
} from '../src/types/clipCreators';

describe('clipCreators - 기본값 및 타입 안전성 테스트', () => {
  
  describe('getDefaultClipName', () => {
    test('커스텀 이름이 있으면 트림된 커스텀 이름 반환', () => {
      expect(getDefaultClipName('audio', '  내 오디오  ')).toBe('내 오디오');
    });
    
    test('빈 커스텀 이름이면 기본 이름 반환', () => {
      expect(getDefaultClipName('audio', '')).toBe('오디오 클립');
      expect(getDefaultClipName('audio', '   ')).toBe('오디오 클립');
    });
    
    test('모든 미디어 타입의 기본 이름 확인', () => {
      expect(getDefaultClipName('audio')).toBe('오디오 클립');
      expect(getDefaultClipName('video')).toBe('비디오 클립');
      expect(getDefaultClipName('image')).toBe('이미지 클립');
      expect(getDefaultClipName('text')).toBe('텍스트 클립');
      expect(getDefaultClipName('sentence')).toBe('Sentence 클립');
      expect(getDefaultClipName('longsentence')).toBe('LongSentence 클립');
      expect(getDefaultClipName('shape')).toBe('도형 클립');
      expect(getDefaultClipName('simpleShape')).toBe('단순 도형');
      expect(getDefaultClipName('polygonShape')).toBe('다각형');
      expect(getDefaultClipName('spacer')).toBe('스페이서 클립');
    });
  });

  describe('createAudioClip', () => {
    const baseParams = {
      mediaId: 'audio-1',
      trackId: 'track-1', 
      mediaUrl: '/test-audio.mp3',
      startTime: 10,
      duration: 5
    };

    test('필수 파라미터로 오디오 클립 생성', () => {
      const clip = createAudioClip(baseParams);
      
      expect(clip.mediaId).toBe('audio-1');
      expect(clip.trackId).toBe('track-1');
      expect(clip.mediaUrl).toBe('/test-audio.mp3');
      expect(clip.startTime).toBe(10);
      expect(clip.duration).toBe(5);
      expect(clip.endTime).toBe(15);
      expect(clip.mediaType).toBe('audio');
      expect(clip.name).toBe('오디오 클립');
      expect(clip.volume).toBe(1.0);
      expect(clip.playbackRate).toBe(1.0);
      expect(typeof clip.id).toBe('string');
      expect(clip.id).toMatch(/^clip-\d+-[a-z0-9]+$/);
    });

    test('선택적 파라미터로 오디오 클립 생성', () => {
      const clip = createAudioClip({
        ...baseParams,
        id: 'custom-id',
        name: '커스텀 오디오',
        volume: 0.5,
        playbackRate: 1.5,
        baseClipProperties: { isBase: true },
        parentClipId: 'parent-123'
      });
      
      expect(clip.id).toBe('custom-id');
      expect(clip.name).toBe('커스텀 오디오');
      expect(clip.volume).toBe(0.5);
      expect(clip.playbackRate).toBe(1.5);
      expect(clip.baseClipProperties).toEqual({ isBase: true });
      expect(clip.parentClipId).toBe('parent-123');
    });

    test('endTime 계산 정확성', () => {
      const clip1 = createAudioClip({ ...baseParams, startTime: 0, duration: 10 });
      expect(clip1.endTime).toBe(10);
      
      const clip2 = createAudioClip({ ...baseParams, startTime: 5.5, duration: 2.3 });
      expect(clip2.endTime).toBe(7.8);
    });
  });

  describe('createVideoClip', () => {
    const baseParams = {
      mediaId: 'video-1',
      trackId: 'track-1',
      mediaUrl: '/test-video.mp4', 
      startTime: 0,
      duration: 10
    };

    test('필수 파라미터로 비디오 클립 생성', () => {
      const clip = createVideoClip(baseParams);
      
      expect(clip.mediaType).toBe('video');
      expect(clip.mediaUrl).toBe('/test-video.mp4');
      
      // 시각적 속성 기본값
      expect(clip.x).toBe(0);
      expect(clip.y).toBe(0);
      expect(clip.width).toBe(1920);
      expect(clip.height).toBe(1080);
      expect(clip.opacity).toBe(1.0);
      expect(clip.rotation).toBe(0);
      
      // 오디오 속성 기본값
      expect(clip.volume).toBe(1.0);
      expect(clip.playbackRate).toBe(1.0);
      
      // 이펙트 속성 기본값
      expect(clip.brightness).toBe(100);
      expect(clip.contrast).toBe(100);
      expect(clip.saturation).toBe(100);
      expect(clip.hue).toBe(0);
      expect(clip.blur).toBe(0);
      expect(clip.sepia).toBe(0);
      expect(clip.grayscale).toBe(0);
      expect(clip.fadeIn).toBe(0);
      expect(clip.fadeOut).toBe(0);
      expect(clip.animationDuration).toBe(1);
      expect(clip.animationDelay).toBe(0);
      expect(clip.animationEasing).toBe('ease');
      expect(clip.animationLoop).toBe(false);
    });

    test('모든 선택적 파라미터로 비디오 클립 생성', () => {
      const clip = createVideoClip({
        ...baseParams,
        x: 100, y: 200,
        width: 640, height: 360,
        opacity: 0.8, rotation: 45,
        volume: 0.7, playbackRate: 1.2,
        brightness: 120, contrast: 110,
        saturation: 90, hue: 30,
        blur: 2, sepia: 10, grayscale: 20,
        fadeIn: 1, fadeOut: 2,
        animationType: 'slideIn',
        animationDuration: 2, animationDelay: 0.5,
        animationEasing: 'bounce', animationLoop: true
      });
      
      expect(clip.x).toBe(100);
      expect(clip.y).toBe(200);
      expect(clip.width).toBe(640);
      expect(clip.height).toBe(360);
      expect(clip.opacity).toBe(0.8);
      expect(clip.rotation).toBe(45);
      expect(clip.volume).toBe(0.7);
      expect(clip.playbackRate).toBe(1.2);
      expect(clip.brightness).toBe(120);
      expect(clip.contrast).toBe(110);
      expect(clip.saturation).toBe(90);
      expect(clip.hue).toBe(30);
      expect(clip.blur).toBe(2);
      expect(clip.sepia).toBe(10);
      expect(clip.grayscale).toBe(20);
      expect(clip.fadeIn).toBe(1);
      expect(clip.fadeOut).toBe(2);
      expect(clip.animationType).toBe('slideIn');
      expect(clip.animationDuration).toBe(2);
      expect(clip.animationDelay).toBe(0.5);
      expect(clip.animationEasing).toBe('bounce');
      expect(clip.animationLoop).toBe(true);
    });
  });

  describe('createImageClip', () => {
    const baseParams = {
      mediaId: 'image-1',
      trackId: 'track-1',
      mediaUrl: '/test-image.jpg',
      startTime: 0, 
      duration: 5
    };

    test('필수 파라미터로 이미지 클립 생성', () => {
      const clip = createImageClip(baseParams);
      
      expect(clip.mediaType).toBe('image');
      expect(clip.volume).toBeUndefined(); // 이미지는 오디오 속성 없음
      expect(clip.playbackRate).toBeUndefined();
      
      // 시각적 속성은 존재
      expect(clip.x).toBe(0);
      expect(clip.y).toBe(0);
      expect(clip.width).toBe(1920);
      expect(clip.height).toBe(1080);
      expect(clip.opacity).toBe(1.0);
    });
  });

  describe('createTextClip', () => {
    const baseParams = {
      mediaId: 'text-1',
      trackId: 'track-1',
      text: 'Hello World',
      startTime: 0,
      duration: 3
    };

    test('필수 파라미터로 텍스트 클립 생성', () => {
      const clip = createTextClip(baseParams);
      
      expect(clip.mediaType).toBe('text');
      expect(clip.text).toBe('Hello World');
      expect(clip.fontSize).toBe(24);
      expect(clip.fontFamily).toBe('Arial');
      expect(clip.color).toBe('#ffffff');
      expect(clip.backgroundColor).toBe('transparent');
    });

    test('모든 텍스트 속성으로 텍스트 클립 생성', () => {
      const clip = createTextClip({
        ...baseParams,
        fontSize: 36,
        fontFamily: 'Noto Sans KR',
        color: '#FF0000',
        backgroundColor: '#FFFF00',
        opacity: 0.8,
        brightness: 110,
        contrast: 120
      });
      
      expect(clip.fontSize).toBe(36);
      expect(clip.fontFamily).toBe('Noto Sans KR');
      expect(clip.color).toBe('#FF0000');
      expect(clip.backgroundColor).toBe('#FFFF00');
      expect(clip.opacity).toBe(0.8);
      expect(clip.brightness).toBe(110);
      expect(clip.contrast).toBe(120);
    });
  });

  describe('createSpacerClip', () => {
    const baseParams = {
      mediaId: 'spacer-1',
      trackId: 'track-1',
      startTime: 0,
      duration: 2
    };

    test('필수 파라미터로 스페이서 클립 생성', () => {
      const clip = createSpacerClip(baseParams);
      
      expect(clip.mediaType).toBe('spacer');
      expect(clip.name).toBe('스페이서 클립');
      expect(clip.mediaUrl).toBeUndefined(); // 스페이서는 미디어 URL 없음
      expect(clip.volume).toBeUndefined(); // 오디오 속성 없음
      expect(clip.x).toBeUndefined(); // 시각적 속성 없음
    });
  });

  describe('ID 생성 및 재사용', () => {
    test('ID가 제공되지 않으면 자동 생성', () => {
      const clip1 = createAudioClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test',
        startTime: 0, duration: 1
      });
      const clip2 = createAudioClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test', 
        startTime: 0, duration: 1
      });
      
      expect(clip1.id).toBeDefined();
      expect(clip2.id).toBeDefined();
      expect(clip1.id).not.toBe(clip2.id); // 다른 ID
    });

    test('ID가 제공되면 해당 ID 사용', () => {
      const customId = 'my-custom-id';
      const clip = createAudioClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test',
        startTime: 0, duration: 1, id: customId
      });
      
      expect(clip.id).toBe(customId);
    });
  });

  describe('특수 속성 처리', () => {
    test('baseClipProperties 전달', () => {
      const baseProps = { isBase: true, anchorType: 'start' };
      const clip = createVideoClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test',
        startTime: 0, duration: 1, baseClipProperties: baseProps
      });
      
      expect(clip.baseClipProperties).toEqual(baseProps);
    });

    test('parentClipId 전달 (VideoClip에서 테스트)', () => {
      const parentId = 'parent-clip-123';
      const clip = createVideoClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test.mp4',
        startTime: 0, duration: 1, parentClipId: parentId
      });
      
      expect(clip.parentClipId).toBe(parentId);
    });
  });
});

describe('clipCreators - 엣지 케이스 및 경계값 테스트', () => {
  
  describe('시간 관련 계산', () => {
    test('부동소수점 시간 정확한 처리', () => {
      const clip = createAudioClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test',
        startTime: 1.5, duration: 2.7
      });
      
      expect(clip.startTime).toBe(1.5);
      expect(clip.duration).toBe(2.7);
      expect(clip.endTime).toBe(4.2);
    });

    test('0초 시작시간과 지속시간', () => {
      const clip = createVideoClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test',
        startTime: 0, duration: 0
      });
      
      expect(clip.startTime).toBe(0);
      expect(clip.duration).toBe(0);
      expect(clip.endTime).toBe(0);
    });
  });

  describe('숫자 범위 경계값', () => {
    test('opacity 경계값 (0, 1)', () => {
      const clip1 = createImageClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test',
        startTime: 0, duration: 1, opacity: 0
      });
      const clip2 = createImageClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test',
        startTime: 0, duration: 1, opacity: 1
      });
      
      expect(clip1.opacity).toBe(0);
      expect(clip2.opacity).toBe(1);
    });

    test('이펙트 값 경계값', () => {
      const clip = createVideoClip({
        mediaId: 'test', trackId: 'test', mediaUrl: 'test',
        startTime: 0, duration: 1,
        brightness: 0, contrast: 200, saturation: 0,
        hue: -180, blur: 0, sepia: 100, grayscale: 100
      });
      
      expect(clip.brightness).toBe(0);
      expect(clip.contrast).toBe(200);
      expect(clip.saturation).toBe(0);
      expect(clip.hue).toBe(-180);
      expect(clip.blur).toBe(0);
      expect(clip.sepia).toBe(100);
      expect(clip.grayscale).toBe(100);
    });
  });

  describe('문자열 속성 처리', () => {
    test('빈 문자열 텍스트', () => {
      const clip = createTextClip({
        mediaId: 'test', trackId: 'test', text: '',
        startTime: 0, duration: 1
      });
      
      expect(clip.text).toBe('');
    });

    test('긴 문자열 텍스트', () => {
      const longText = 'A'.repeat(1000);
      const clip = createTextClip({
        mediaId: 'test', trackId: 'test', text: longText,
        startTime: 0, duration: 1
      });
      
      expect(clip.text).toBe(longText);
      expect(clip.text.length).toBe(1000);
    });

    test('특수문자 포함 URL', () => {
      const specialUrl = 'https://example.com/file%20name.mp4?param=value&other=123';
      const clip = createVideoClip({
        mediaId: 'test', trackId: 'test', mediaUrl: specialUrl,
        startTime: 0, duration: 1
      });
      
      expect(clip.mediaUrl).toBe(specialUrl);
    });
  });
});