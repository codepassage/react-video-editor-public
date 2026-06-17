import { GoogleTTSService } from '../../tts/googleTTS';
import { LanguageDetector } from '../../tts/languageDetector';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TTSProcessor {
  private ttsService: GoogleTTSService;
  private defaultVoicesCache: Record<string, string> | null = null;

  constructor(ttsService: GoogleTTSService) {
    this.ttsService = ttsService;
  }

  /**
   * 기본 음성 설정 로드
   */
  private loadDefaultVoices(): Record<string, string> {
    if (this.defaultVoicesCache) {
      return this.defaultVoicesCache;
    }

    try {
      const defaultVoicesFile = path.join(__dirname, '../../../data/default-voices.json');
      if (fs.existsSync(defaultVoicesFile)) {
        const data = fs.readFileSync(defaultVoicesFile, 'utf8');
        this.defaultVoicesCache = JSON.parse(data);
        console.log('📢 기본 음성 설정 로드 완료:', this.defaultVoicesCache);
        return this.defaultVoicesCache || {};
      }
    } catch (error) {
      console.error('❌ 기본 음성 설정 로드 실패:', error);
    }

    // 폴백 기본값
    this.defaultVoicesCache = {};
    return this.defaultVoicesCache;
  }

  /**
   * 언어 자동 감지 및 음성 선택
   */
  processLanguageAndVoice(text: string, language?: string, voice?: string): {
    finalLanguage: string;
    finalVoice: string;
  } {
    let finalLanguage = language;

    // 언어 자동 감지
    if (!finalLanguage) {
      const detectionResult = LanguageDetector.detectLanguage(text);
      finalLanguage = detectionResult.language;
      console.log(`🔍 언어 자동 감지: "${text.substring(0, 30)}..." => ${finalLanguage}`);
    }

    // 음성 선택
    let finalVoice = voice;

    // 음성이 지정되지 않은 경우 기본 음성 사용
    if (!finalVoice) {
      const defaultVoices = this.loadDefaultVoices();
      finalVoice = defaultVoices[finalLanguage] || 'ko-KR-Standard-D';
      console.log(`🔊 사용자 설정 기본 음성 사용: ${finalVoice}`);
    }

    return {
      finalLanguage: finalLanguage || 'ko',
      finalVoice: finalVoice || 'ko-KR-Standard-D'
    };
  }

  /**
   * 리소스 아이템들에 대해 재귀적으로 TTS 생성
   */
  async generateTTSRecursively(
    items: any[], 
    pathPrefix: string = ''
  ): Promise<Record<string, { url: string; duration: number }>> {
    const ttsFiles: Record<string, { url: string; duration: number }> = {};

    for (const item of items) {
      const currentPath = pathPrefix ? `${pathPrefix}_${item.name}` : item.name;

      // 컨테이너 처리
      if (item.containers && Array.isArray(item.containers)) {
        for (let containerIndex = 0; containerIndex < item.containers.length; containerIndex++) {
          const container = item.containers[containerIndex];
          const containerPath = `${currentPath}_c${containerIndex + 1}`;

          // 컨테이너 내부 아이템들 재귀 처리
          const containerTtsFiles = await this.generateTTSRecursively(
            container.items || [],
            containerPath
          );
          Object.assign(ttsFiles, containerTtsFiles);
        }
      }

      // 텍스트 데이터 처리
      if (item.data && item.data.type === 'text') {
        const { finalLanguage, finalVoice } = this.processLanguageAndVoice(
          item.data.text,
          item.data.language,
          item.data.voice
        );

        const ttsParams: any = {
          text: item.data.text,
          language: finalLanguage,
          voice: finalVoice
        };

        console.log(`🎵 TTS 생성 요청: {
  path: '${currentPath}',
  text: '${item.data.text.substring(0, 50)}${item.data.text.length > 50 ? '...' : ''}',
  originalLanguage: '${item.data.language}',
  originalVoice: '${item.data.voice}',
  finalLanguage: '${finalLanguage}',
  finalVoice: '${finalVoice}'
}`);

        try {
          const ttsResult = await this.ttsService.generateAudio(ttsParams);
          ttsFiles[currentPath] = ttsResult;
          console.log(`🎵 TTS 생성: ${currentPath} = "${item.data.text}" (${ttsResult.duration}s)`);
        } catch (error) {
          console.error(`❌ TTS 생성 실패: ${currentPath}`, error);
          throw error;
        }
      }

      // LongSentence 데이터 처리
      if (item.data && item.data.type === 'longSentence') {
        const longSentenceData = (item.data as any).items as Array<{ text: string, mediaUrl: string }>;
        const language = (item.data as any).language || 'ko';

        // 각 문장별 TTS 생성
        for (let dataIndex = 0; dataIndex < longSentenceData.length; dataIndex++) {
          const dataItem = longSentenceData[dataIndex];
          const itemPath = `${currentPath}_data${dataIndex + 1}`;

          // 기존 mediaUrl이 없는 경우에만 TTS 생성
          if (!dataItem.mediaUrl) {
            const { finalLanguage, finalVoice } = this.processLanguageAndVoice(
              dataItem.text,
              language,
              undefined
            );

            const ttsParams: any = {
              text: dataItem.text,
              language: finalLanguage,
              voice: finalVoice
            };

            console.log(`🎵 LongSentence TTS 생성 요청: {
  path: '${itemPath}',
  text: '${dataItem.text.substring(0, 50)}${dataItem.text.length > 50 ? '...' : ''}',
  language: '${finalLanguage}',
  voice: '${finalVoice}'
}`);

            try {
              const ttsResult = await this.ttsService.generateAudio(ttsParams);
              ttsFiles[itemPath] = ttsResult;
              console.log(`🎵 LongSentence TTS 생성: ${itemPath} = "${dataItem.text}" (${ttsResult.duration}s)`);
            } catch (error) {
              console.error(`❌ LongSentence TTS 생성 실패: ${itemPath}`, error);
              throw error;
            }
          }
        }
      }
    }

    return ttsFiles;
  }

  /**
   * 단일 텍스트에 대한 TTS 생성
   */
  async generateSingleTTS(
    text: string, 
    language?: string, 
    voice?: string,
    resourcePath?: string
  ): Promise<{ url: string; duration: number }> {
    const { finalLanguage, finalVoice } = this.processLanguageAndVoice(text, language, voice);

    const ttsParams: any = {
      text: text,
      language: finalLanguage,
      voice: finalVoice
    };

    console.log(`🎵 단일 TTS 생성 요청: {
  path: '${resourcePath || 'unknown'}',
  text: '${text.substring(0, 50)}${text.length > 50 ? '...' : ''}',
  language: '${finalLanguage}',
  voice: '${finalVoice}'
}`);

    try {
      const ttsResult = await this.ttsService.generateAudio(ttsParams);
      console.log(`🎵 단일 TTS 생성: ${resourcePath || 'unknown'} = "${text}" (${ttsResult.duration}s)`);
      return ttsResult;
    } catch (error) {
      console.error(`❌ 단일 TTS 생성 실패: ${resourcePath || 'unknown'}`, error);
      throw error;
    }
  }
}