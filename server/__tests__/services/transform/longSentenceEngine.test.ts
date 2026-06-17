/**
 * longSentenceEngine.ts 단위 테스트
 * 리팩토링 전후 동작 일치성 확인을 위한 테스트 스위트
 */

import { LongSentenceEngine } from '../../../services/transform/longSentenceEngine';

// Mock dependencies
jest.mock('../../../services/tts/googleTTS', () => ({
  GoogleTTSService: jest.fn().mockImplementation(() => ({
    generateAudio: jest.fn().mockResolvedValue({
      filePath: '/mock/audio.mp3',
      url: 'http://localhost:5002/mock/audio.mp3',
      duration: 10.5,
      language: 'ko',
      voice: 'ko-KR-Wavenet-A'
    })
  }))
}));

jest.mock('../../../services/whisper/whisperService', () => ({
  WhisperService: {
    getInstance: jest.fn().mockResolvedValue({
      generateSubtitlesWithCache: jest.fn().mockResolvedValue([
        {
          start: 0,
          end: 3.5,
          text: '안녕하세요 여러분',
          words: [
            { start: 0, end: 1.2, word: '안녕하세요' },
            { start: 1.3, end: 3.5, word: '여러분' }
          ]
        },
        {
          start: 3.6,
          end: 7.2,
          text: '오늘은 좋은 날씨네요',
          words: [
            { start: 3.6, end: 4.8, word: '오늘은' },
            { start: 4.9, end: 5.9, word: '좋은' },
            { start: 6.0, end: 7.2, word: '날씨네요' }
          ]
        }
      ]),
      generateSRTFile: jest.fn()
    })
  }
}));

jest.mock('../../../services/textProcessing/sentenceSplitter', () => ({
  SentenceSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest.fn().mockReturnValue([
      '안녕하세요 여러분.',
      '오늘은 좋은 날씨네요.'
    ])
  }))
}));

describe('LongSentenceEngine', () => {
  let engine: LongSentenceEngine;

  beforeEach(() => {
    engine = new LongSentenceEngine();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize properly', () => {
      expect(engine).toBeDefined();
      expect(engine).toBeInstanceOf(LongSentenceEngine);
    });
  });

  describe('convertLongSentence', () => {
    const mockLongSentenceClip = {
      id: 'test-clip-123',
      trackId: 'track-2', // trackId 추가
      startTime: 0,
      data: [
        {
          text: '안녕하세요 여러분. 오늘은 좋은 날씨네요.',
          mediaUrl: '/uploads/test-image.jpg'
        }
      ],
      generateTTS: true,
      generateText: true,
      generateSubtitles: true,
      language: 'ko',
      voice: 'ko-KR-Wavenet-A',
      maxWordsPerSentence: 10,
      splitOnPunctuation: true,
      textProperties: {
        x: 100,
        y: 50,
        width: 800,
        height: 100,
        fontSize: 48,
        color: '#ffffff'
      },
      mediaProperties: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        backgroundFit: 'cover',
        borderColor: '#ffffff'
      }
    };

    it('should convert LongSentence clip successfully', async () => {
      const result = await engine.convertLongSentence(mockLongSentenceClip);

      expect(result.success).toBe(true);
      expect(result.generatedClips).toBeDefined();
      expect(result.generatedClips!.length).toBeGreaterThan(0);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should generate correct number of clips for text+audio mode', async () => {
      const result = await engine.convertLongSentence(mockLongSentenceClip);

      // 텍스트 + 오디오 모드에서는 문장 수만큼 클립 생성
      expect(result.generatedClips!.length).toBe(2); // 2개 문장
      
      // 첫 번째 클립에는 오디오와 미디어 포함
      expect(result.generatedClips![0].sentenceClip).toBeDefined();
      expect(result.generatedClips![0].audioClip).toBeDefined();
      expect(result.generatedClips![0].mediaClip).toBeDefined();
      
      // 두 번째 클립에는 텍스트만
      expect(result.generatedClips![1].sentenceClip).toBeDefined();
      expect(result.generatedClips![1].audioClip).toBeNull();
      expect(result.generatedClips![1].mediaClip).toBeNull();
    });

    it('should handle audio-only mode', async () => {
      const audioOnlyClip = {
        ...mockLongSentenceClip,
        generateText: false
      };

      const result = await engine.convertLongSentence(audioOnlyClip);

      expect(result.success).toBe(true);
      expect(result.generatedClips!.length).toBe(1);
      expect(result.generatedClips![0].sentenceClip).toBeNull();
      expect(result.generatedClips![0].audioClip).toBeDefined();
    });

    it('should handle text-only mode', async () => {
      const textOnlyClip = {
        ...mockLongSentenceClip,
        generateTTS: false
      };

      const result = await engine.convertLongSentence(textOnlyClip);

      expect(result.success).toBe(true);
      expect(result.generatedClips!.length).toBe(2);
      result.generatedClips!.forEach(clip => {
        expect(clip.sentenceClip).toBeDefined();
        expect(clip.audioClip).toBeNull();
      });
    });
  });

  describe('copyAllTextProperties', () => {
    it('should copy all text properties correctly', () => {
      const mockClip = {
        textProperties: {
          x: 100,
          y: 50,
          width: 800,
          height: 100,
          fontSize: 48,
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.5)',
          brightness: 120,
          contrast: 110,
          saturation: 90,
          paddingTop: 10,
          paddingLeft: 15
        }
      };

      // Private 메서드이므로 any로 캐스팅하여 테스트
      const result = (engine as any).copyAllTextProperties(mockClip);

      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
      expect(result.fontSize).toBe(48);
      expect(result.color).toBe('#ffffff');
      expect(result.backgroundColor).toBe('rgba(0,0,0,0.5)');
      expect(result.brightness).toBe(120);
      expect(result.paddingTop).toBe(10);
      expect(result.paddingLeft).toBe(15);
    });

    it('should use default values for missing properties', () => {
      const mockClip = {
        textProperties: {
          color: '#ff0000' // 일부 속성만 제공
        }
      };

      const result = (engine as any).copyAllTextProperties(mockClip);

      expect(result.color).toBe('#ff0000'); // 제공된 값
      expect(result.x).toBe(0); // 기본값
      expect(result.fontSize).toBe(24); // 기본값
      expect(result.brightness).toBe(100); // 기본값
    });
  });

  describe('copyAllVisualProperties', () => {
    it('should copy all visual properties correctly', () => {
      const mockClip = {
        mediaProperties: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          backgroundFit: 'cover',
          borderColor: '#ffffff',
          borderWidth: 5,
          shadowEnabled: true,
          shadowOffsetX: 4,
          brightness: 110
        }
      };

      const result = (engine as any).copyAllVisualProperties(mockClip);

      expect(result.x).toBe(0);
      expect(result.width).toBe(1920);
      expect(result.backgroundFit).toBe('cover');
      expect(result.borderColor).toBe('#ffffff');
      expect(result.borderWidth).toBe(5);
      expect(result.shadowEnabled).toBe(true);
      expect(result.brightness).toBe(110);
    });
  });

  describe('matchSentencesWithTiming', () => {
    const mockSentences = [
      '안녕하세요 여러분.',
      '오늘은 좋은 날씨네요.'
    ];

    const mockWhisperTimings = [
      {
        start: 0,
        end: 3.5,
        text: '안녕하세요 여러분',
        words: [
          { start: 0, end: 1.2, word: '안녕하세요' },
          { start: 1.3, end: 3.5, word: '여러분' }
        ]
      },
      {
        start: 3.6,
        end: 7.2,
        text: '오늘은 좋은 날씨네요',
        words: [
          { start: 3.6, end: 4.8, word: '오늘은' },
          { start: 4.9, end: 5.9, word: '좋은' },
          { start: 6.0, end: 7.2, word: '날씨네요' }
        ]
      }
    ];

    it('should match sentences with whisper timings correctly', () => {
      const result = (engine as any).matchSentencesWithTiming(
        mockSentences,
        mockWhisperTimings,
        7.2 // Use actual whisper total duration
      );

      expect(result).toHaveLength(2);
      
      // 기본 구조 확인
      expect(result[0].text).toBe('안녕하세요 여러분.');
      expect(result[0].start).toBe(0);
      expect(result[0].end).toBeGreaterThan(0);
      expect(result[0].wordTimings).toBeDefined();
      
      // 두 번째 문장 확인
      expect(result[1].text).toBe('오늘은 좋은 날씨네요.');
      expect(result[1].start).toBeGreaterThan(result[0].end - 1); // 연속성 확인
      expect(result[1].end).toBeGreaterThan(result[1].start);
      
      // 전체 시간 범위 확인
      expect(result[1].end).toBeLessThanOrEqual(7.2);
    });

    it('should handle empty whisper timings', () => {
      const result = (engine as any).matchSentencesWithTiming(
        mockSentences,
        [],
        10.0
      );

      expect(result).toHaveLength(2);
      // 추정 타이밍 사용
      result.forEach(timing => {
        expect(timing.matchMethod).toBe('estimated');
        expect(timing.confidence).toBe('low');
      });
    });
  });

  describe('estimateTimingsForSentences', () => {
    it('should estimate timings proportionally', () => {
      const sentences = [
        '짧은 문장.',
        '이것은 조금 더 긴 문장입니다.',
        '매우 짧음.'
      ];

      const result = (engine as any).estimateTimingsForSentences(sentences, 15.0);

      expect(result).toHaveLength(3);
      
      // 총 시간이 15초와 일치하는지 확인
      const totalDuration = result.reduce((sum: number, timing: any) => sum + timing.duration, 0);
      expect(Math.abs(totalDuration - 15.0)).toBeLessThan(0.1);
      
      // 연속적인 시간 확인
      expect(result[0].start).toBe(0);
      expect(result[1].start).toBe(result[0].end);
      expect(result[2].start).toBe(result[1].end);
    });
  });

  describe('validateConversionResult', () => {
    it('should validate successful conversion result', () => {
      const mockResult = {
        success: true,
        generatedClips: [
          {
            sentenceClip: { startTime: 0, duration: 3.5 },
            audioClip: { startTime: 0, duration: 10.5 },
            mediaClip: null,
            subtitles: [],
            ttsResult: {}
          }
        ],
        totalDuration: 10.5
      };

      const validation = engine.validateConversionResult(mockResult);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect failed conversion', () => {
      const mockResult = {
        success: false,
        error: 'TTS generation failed'
      };

      const validation = engine.validateConversionResult(mockResult);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('TTS generation failed');
    });

    it('should detect empty clips', () => {
      const mockResult = {
        success: true,
        generatedClips: [],
        totalDuration: 0
      };

      const validation = engine.validateConversionResult(mockResult);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('생성된 클립이 없습니다.');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing text data', async () => {
      const invalidClip = {
        id: 'test-clip',
        trackId: 'track-1',
        startTime: 0,
        data: [{ text: '', mediaUrl: '' }],
        generateTTS: true,
        generateText: true,
        generateSubtitles: false,
        language: 'ko',
        voice: 'ko-KR-Wavenet-A',
        maxWordsPerSentence: 10,
        splitOnPunctuation: true,
        textProperties: {},
        mediaProperties: {}
      };

      await expect(engine.convertLongSentence(invalidClip))
        .rejects.toThrow('변환할 텍스트가 없습니다.');
    });

    it('should handle invalid clip data', async () => {
      const invalidClip = {
        id: 'test-clip',
        trackId: 'track-1',
        startTime: 0,
        data: null,
        generateTTS: true,
        generateText: true,
        generateSubtitles: false,
        language: 'ko',
        voice: 'ko-KR-Wavenet-A',
        maxWordsPerSentence: 10,
        splitOnPunctuation: true,
        textProperties: {},
        mediaProperties: {}
      };

      await expect(engine.convertLongSentence(invalidClip))
        .rejects.toThrow('변환할 텍스트가 없습니다.');
    });
  });
});