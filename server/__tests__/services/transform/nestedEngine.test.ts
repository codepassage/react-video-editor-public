import { NestedTransformEngine } from '../../../services/transform/nestedEngine';
import { MockTTSService } from './mocks/MockTTSService';
import { ResourceData, TransformResult } from '../../../types/autoGeneration';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../../../services/tts/googleTTS', () => ({
  GoogleTTSService: jest.fn().mockImplementation(() => new MockTTSService())
}));

jest.mock('../../../services/transform/longSentenceEngine', () => ({
  LongSentenceEngine: jest.fn().mockImplementation(() => ({
    convertLongSentence: jest.fn().mockResolvedValue({
      clips: [],
      totalDuration: 0
    })
  }))
}));

describe('NestedTransformEngine', () => {
  let engine: NestedTransformEngine;
  let mockTTSService: MockTTSService;

  beforeEach(() => {
    mockTTSService = new MockTTSService();
    engine = new NestedTransformEngine({
      maxNestingDepth: 3,
      enableCircularReferenceCheck: true,
      strictMode: false
    });
    
    // Replace the TTS service with our mock
    (engine as any).ttsService = mockTTSService;
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default configuration', () => {
      const newEngine = new NestedTransformEngine();
      expect(newEngine).toBeDefined();
      expect((newEngine as any).config.maxNestingDepth).toBe(3);
      expect((newEngine as any).config.enableCircularReferenceCheck).toBe(true);
    });

    it('should initialize with custom configuration', () => {
      const customEngine = new NestedTransformEngine({
        maxNestingDepth: 5,
        enableCircularReferenceCheck: false,
        strictMode: true
      });
      
      expect((customEngine as any).config.maxNestingDepth).toBe(5);
      expect((customEngine as any).config.enableCircularReferenceCheck).toBe(false);
      expect((customEngine as any).config.strictMode).toBe(true);
    });
  });

  describe('Basic Template Processing', () => {
    const simpleTemplate = {
      tracks: [
        {
          id: 'track-1',
          clips: [
            {
              id: 'clip-1',
              name: 'sentence-01',
              text: 'Hello World',
              startTime: 0,
              endTime: 2,
              duration: 2,
              mediaType: 'sentence',
              trackId: 'track-1',
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
          name: 'sentence-01',
          data: {
            type: 'text',
            text: 'Hello World Test',
            language: 'ko'
          }
        }
      ]
    };

    it('should process simple template with resource data', async () => {
      const result = await engine.transformNasted(simpleTemplate, simpleResourceData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.transformedData).toBeDefined();
      expect(result.transformedData.tracks).toBeDefined();
      expect(result.transformedData.tracks.length).toBe(1);
    });

    it('should generate TTS for text clips', async () => {
      const result = await engine.transformNasted(simpleTemplate, simpleResourceData);
      
      expect(result.success).toBe(true);
      expect(result.ttsFiles).toBeDefined();
      expect(Object.keys(result.ttsFiles).length).toBeGreaterThan(0);
    });

    it('should maintain original template structure', async () => {
      const result = await engine.transformNasted(simpleTemplate, simpleResourceData);
      
      expect(result.transformedData.tracks[0].id).toBe('track-1');
      expect(result.transformedData.projectSettings).toEqual(simpleTemplate.projectSettings);
    });
  });

  describe('Resource Data Processing', () => {
    it('should normalize resource data correctly', () => {
      const rawResourceData = {
        items: [
          {
            name: 'test-item',
            data: {
              type: 'text',
              text: 'Test text'
            }
          }
        ]
      };
      
      const normalized = (engine as any).normalizeResourceData(rawResourceData);
      expect(normalized.items).toBeDefined();
      expect(normalized.items.length).toBe(1);
      expect(normalized.items[0].name).toBe('test-item');
    });

    it('should handle missing resource items gracefully', async () => {
      const templateWithMissingResource = {
        tracks: [
          {
            id: 'track-1',
            clips: [
              {
                id: 'clip-1',
                name: 'missing-resource',
                text: 'Default text',
                startTime: 0,
                endTime: 2,
                duration: 2,
                mediaType: 'sentence',
                trackId: 'track-1',
                regularClipProperties: {}
              }
            ]
          }
        ],
        bundles: [],
        projectSettings: { duration: 10, width: 1920, height: 1080, fps: 30 }
      };

      const emptyResourceData: ResourceData = { items: [] };
      
      const result = await engine.transformNasted(templateWithMissingResource, emptyResourceData);
      expect(result.success).toBe(true);
      // Should still process with default/fallback values
    });
  });

  describe('TTS Generation', () => {
    it('should generate TTS for text items', async () => {
      const resourceData: ResourceData = {
        items: [
          {
            name: 'test-tts',
            data: {
              type: 'text',
              text: 'This is a test for TTS generation',
              language: 'ko'
            }
          }
        ]
      };
      
      const ttsFiles = await (engine as any).generateTTSRecursively(resourceData.items);
      
      expect(ttsFiles).toBeDefined();
      expect(ttsFiles['test-tts']).toBeDefined();
      expect(ttsFiles['test-tts'].url).toContain('mock-tts');
      expect(ttsFiles['test-tts'].duration).toBeGreaterThan(0);
    });

    it('should handle containers in TTS generation', async () => {
      const resourceData: ResourceData = {
        items: [
          {
            name: 'container-test',
            isIterator: true,
            containers: [
              {
                items: [
                  {
                    name: 'nested-item',
                    data: {
                      type: 'text',
                      text: 'Nested text content',
                      language: 'ko'
                    }
                  }
                ]
              }
            ]
          }
        ]
      };
      
      const ttsFiles = await (engine as any).generateTTSRecursively(resourceData.items);
      
      expect(ttsFiles).toBeDefined();
      expect(ttsFiles['container-test_c1_nested-item']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid template gracefully', async () => {
      const invalidTemplate = null;
      const validResourceData: ResourceData = { items: [] };
      
      await expect(engine.transformNasted(invalidTemplate as any, validResourceData))
        .rejects.toThrow();
    });

    it('should handle invalid resource data gracefully', async () => {
      const validTemplate = {
        tracks: [],
        bundles: [],
        projectSettings: { duration: 10, width: 1920, height: 1080, fps: 30 }
      };
      
      const invalidResourceData = null;
      
      await expect(engine.transformNasted(validTemplate, invalidResourceData as any))
        .rejects.toThrow();
    });

    it('should respect max nesting depth', async () => {
      const shallowEngine = new NestedTransformEngine({
        maxNestingDepth: 1,
        enableDepthValidation: true
      });
      
      const deeplyNestedTemplate = {
        tracks: [
          {
            id: 'track-1',
            clips: [
              {
                id: 'clip-1',
                name: 'level-1',
                startTime: 0,
                endTime: 2,
                duration: 2,
                mediaType: 'sentence',
                trackId: 'track-1',
                regularClipProperties: {},
                nestedLevel: 3 // Simulating deep nesting
              }
            ]
          }
        ],
        bundles: [],
        projectSettings: { duration: 10, width: 1920, height: 1080, fps: 30 }
      };
      
      const resourceData: ResourceData = { items: [] };
      
      // This should handle depth validation
      const result = await shallowEngine.transformNasted(deeplyNestedTemplate, resourceData);
      expect(result).toBeDefined();
    });
  });

  describe('Statistics Collection', () => {
    it('should collect transformation statistics', async () => {
      const template = {
        tracks: [
          {
            id: 'track-1',
            clips: [
              {
                id: 'clip-1',
                name: 'stats-test',
                text: 'Statistics test',
                startTime: 0,
                endTime: 2,
                duration: 2,
                mediaType: 'sentence',
                trackId: 'track-1',
                regularClipProperties: {}
              }
            ]
          }
        ],
        bundles: [],
        projectSettings: { duration: 10, width: 1920, height: 1080, fps: 30 }
      };

      const resourceData: ResourceData = {
        items: [
          {
            name: 'stats-test',
            data: {
              type: 'text',
              text: 'Statistics test content',
              language: 'ko'
            }
          }
        ]
      };
      
      const result = await engine.transformNasted(template, resourceData);
      
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalClips).toBeGreaterThan(0);
      expect(result.statistics.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Integration with Real Test Data', () => {
    it('should handle actual test data files if they exist', async () => {
      const testDataPath = path.join(process.cwd(), 'data');
      
      if (fs.existsSync(testDataPath)) {
        const templateFile = path.join(testDataPath, 'sample-simple-template01.json');
        const resourceFile = path.join(testDataPath, 'resource-data01.json');
        
        if (fs.existsSync(templateFile) && fs.existsSync(resourceFile)) {
          const template = JSON.parse(fs.readFileSync(templateFile, 'utf-8'));
          const resourceData = JSON.parse(fs.readFileSync(resourceFile, 'utf-8'));
          
          const result = await engine.transformNasted(template, resourceData);
          
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
        }
      }
    });
  });
});

describe('NestedTransformEngine - Advanced Features', () => {
  let engine: NestedTransformEngine;

  beforeEach(() => {
    engine = new NestedTransformEngine({
      maxNestingDepth: 5,
      enableCircularReferenceCheck: true,
      strictMode: true
    });
    
    // Replace TTS service with mock
    (engine as any).ttsService = new MockTTSService();
  });

  describe('Time Offset Management', () => {
    it('should manage time offsets correctly', () => {
      const offsetManager = (engine as any).timeOffsetManager;
      expect(offsetManager).toBeDefined();
      
      // Test offset operations
      offsetManager.addOffset(5.0);
      expect(offsetManager.getCurrentOffset()).toBe(5.0);
      
      offsetManager.addOffset(3.0);
      expect(offsetManager.getCurrentOffset()).toBe(8.0);
    });
  });

  describe('Clip Processing', () => {
    it('should apply time offsets to clips', () => {
      const originalClip = {
        id: 'test-clip',
        startTime: 0,
        endTime: 2,
        duration: 2
      };
      
      (engine as any).timeOffsetManager.addOffset(5.0);
      const offsettedClip = (engine as any).applyCurrentOffset(originalClip);
      
      expect(offsettedClip.startTime).toBe(5.0);
      expect(offsettedClip.endTime).toBe(7.0);
    });
  });

  describe('Font Collection', () => {
    it('should collect used fonts', () => {
      const usedFonts = (engine as any).usedFonts;
      expect(usedFonts).toBeDefined();
      expect(usedFonts instanceof Set).toBe(true);
    });
  });
});