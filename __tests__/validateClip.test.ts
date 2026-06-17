/**
 * 🔍 validateClip.test.ts - 클립 검증 함수 테스트
 * 
 * validateClip 함수가 올바르게 작동하는지 검증합니다.
 */

import { validateClip } from '../src/types/clipCreators';
import { createVideoClip, createTextClip, createAudioClip } from '../src/types/clipCreators';

describe('validateClip', () => {
  
  describe('유효한 클립 검증', () => {
    test('유효한 비디오 클립', () => {
      const clip = createVideoClip({
        mediaId: 'video-1',
        trackId: 'track-1',
        mediaUrl: '/test.mp4',
        startTime: 0,
        duration: 10
      });

      const result = validateClip(clip);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('유효한 텍스트 클립', () => {
      const clip = createTextClip({
        mediaId: 'text-1',
        trackId: 'track-1',
        text: 'Test Text',
        startTime: 0,
        duration: 5
      });

      const result = validateClip(clip);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('유효한 오디오 클립', () => {
      const clip = createAudioClip({
        mediaId: 'audio-1',
        trackId: 'track-1',
        mediaUrl: '/test.mp3',
        startTime: 0,
        duration: 15
      });

      const result = validateClip(clip);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('유효하지 않은 클립 검증', () => {
    test('ID가 없는 클립', () => {
      const clip = createVideoClip({
        mediaId: 'video-1',
        trackId: 'track-1',
        mediaUrl: '/test.mp4',
        startTime: 0,
        duration: 10
      });
      
      // ID 제거
      (clip as any).id = '';

      const result = validateClip(clip);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('클립 ID가 없습니다');
    });

    test('duration이 0 이하인 클립', () => {
      const clip = createVideoClip({
        mediaId: 'video-1',
        trackId: 'track-1',
        mediaUrl: '/test.mp4',
        startTime: 0,
        duration: -5
      });

      const result = validateClip(clip);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('클립 길이가 0 이하입니다');
    });

    test('startTime이 음수인 클립', () => {
      const clip = createVideoClip({
        mediaId: 'video-1',
        trackId: 'track-1',
        mediaUrl: '/test.mp4',
        startTime: -10,
        duration: 5
      });

      const result = validateClip(clip);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('시작 시간이 음수입니다');
    });

    test('mediaUrl이 없는 비디오 클립', () => {
      const clip = createVideoClip({
        mediaId: 'video-1',
        trackId: 'track-1',
        mediaUrl: '/test.mp4',
        startTime: 0,
        duration: 10
      });
      
      // mediaUrl 제거
      (clip as any).mediaUrl = '';

      const result = validateClip(clip);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비디오 URL이 없습니다');
    });

    test('text가 없는 텍스트 클립', () => {
      const clip = createTextClip({
        mediaId: 'text-1',
        trackId: 'track-1',
        text: 'Test Text',
        startTime: 0,
        duration: 5
      });
      
      // text 제거
      (clip as any).text = '';

      const result = validateClip(clip);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('텍스트 내용이 없습니다');
    });
  });

  describe('복합 오류 검증', () => {
    test('여러 오류가 있는 클립', () => {
      const clip = createVideoClip({
        mediaId: 'video-1',
        trackId: 'track-1',
        mediaUrl: '/test.mp4',
        startTime: 0,
        duration: 10
      });
      
      // 여러 문제 생성
      (clip as any).id = '';
      (clip as any).mediaUrl = '';
      (clip as any).startTime = -5;
      (clip as any).duration = 0;

      const result = validateClip(clip);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('클립 ID가 없습니다');
      expect(result.errors).toContain('비디오 URL이 없습니다');
      expect(result.errors).toContain('시작 시간이 음수입니다');
      expect(result.errors).toContain('클립 길이가 0 이하입니다');
    });
  });
});