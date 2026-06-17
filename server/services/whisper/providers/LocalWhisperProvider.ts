/**
 * 로컬 Whisper 모델을 사용하는 서비스 구현체
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { WhisperProvider, SubtitleSegment } from '../base/WhisperProvider';

const execAsync = promisify(exec);

export class LocalWhisperProvider extends WhisperProvider {
  private whisperCommand: string;
  private modelPath: string;
  private tempDir: string;
  private validModels = ['tiny', 'base', 'small', 'medium', 'large', 'large-v1', 'large-v2', 'large-v3', 'large-v3-turbo'];

  constructor(cacheDir?: string) {
    super(cacheDir);
    
    // 환경 변수에서 설정 읽기
    this.whisperCommand = process.env.LOCAL_WHISPER_COMMAND || 'whisper';
    this.modelPath = process.env.LOCAL_WHISPER_MODEL_PATH || '';
    this.tempDir = path.join(this.cacheDir, 'temp');
    
    this.ensureTempDir();
    this.validateModelSettings();
  }

  private validateModelSettings() {
    const modelSize = process.env.LOCAL_WHISPER_MODEL_SIZE || 'medium';
    
    if (!this.validModels.includes(modelSize)) {
      console.error(`❌ [Local Whisper] 잘못된 모델 설정 감지!`);
      console.error(`❌ 현재 설정: LOCAL_WHISPER_MODEL_SIZE=${modelSize}`);
      console.error(`✅ 유효한 모델: ${this.validModels.join(', ')}`);
      console.error(`💡 .env 파일을 수정하고 서버를 재시작하세요.`);
      console.warn(`⚠️ 기본 모델(medium)이 사용됩니다.`);
    } else {
      console.log(`✅ [Local Whisper] 모델 설정 확인: ${modelSize}`);
    }
  }

  private ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 로컬 Whisper를 사용하여 자막 생성
   */
  async generateSubtitles(audioPath: string, language: string = 'ko'): Promise<SubtitleSegment[]> {
    try {
      console.log('[Local Whisper] 자막 생성 시작:', { audioPath, language });

      // 1. 오디오 파일을 Whisper가 처리하기 좋은 형태로 변환
      const processedAudioPath = await this.preprocessAudio(audioPath);

      // 2. Whisper 실행 및 결과 파일 생성
      const outputDir = await this.runWhisper(processedAudioPath, language);
      
      // 3. 결과 파일에서 세그먼트 정보 추출
      const segments = await this.parseWhisperOutput(outputDir, path.basename(processedAudioPath, path.extname(processedAudioPath)));

      // 4. 임시 파일 정리
      this.cleanupTempFiles(processedAudioPath, outputDir);

      console.log('[Local Whisper] 자막 생성 완료:', { 
        segmentCount: segments.length,
        totalDuration: segments.length > 0 ? segments[segments.length - 1].end : 0
      });

      return segments;
    } catch (error) {
      console.error('[Local Whisper] 변환 실패:', error);
      throw new Error(`로컬 Whisper 실행 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 오디오 파일을 Whisper가 처리하기 좋은 형태로 변환
   */
  private async preprocessAudio(inputPath: string): Promise<string> {
    // 임시 디렉토리 재확인 및 생성
    if (!fs.existsSync(this.tempDir)) {
      console.log('[Local Whisper] 임시 디렉토리 생성:', this.tempDir);
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    const outputPath = path.join(this.tempDir, `whisper_input_${Date.now()}.wav`);
    
    console.log('[Local Whisper] 오디오 전처리 시작:', {
      inputPath,
      inputExists: fs.existsSync(inputPath),
      outputPath,
      tempDir: this.tempDir,
      tempDirExists: fs.existsSync(this.tempDir)
    });
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .format('wav')
        .output(outputPath)
        .on('end', () => {
          console.log('[Local Whisper] 오디오 전처리 완료:', {
            outputPath,
            outputExists: fs.existsSync(outputPath),
            outputSize: fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0
          });
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('[Local Whisper] 오디오 전처리 실패:', {
            error: err,
            inputPath,
            inputExists: fs.existsSync(inputPath),
            outputPath
          });
          reject(err);
        })
        .run();
    });
  }

  /**
   * Whisper 명령어 실행
   */
  private async runWhisper(audioPath: string, language: string): Promise<string> {
    const outputDir = path.join(this.tempDir, `whisper_output_${Date.now()}`);
    fs.mkdirSync(outputDir, { recursive: true });

    // 모델 크기 결정
    let modelSize = process.env.LOCAL_WHISPER_MODEL_SIZE || 'medium';
    
    // 유효성 검사
    if (!this.validModels.includes(modelSize)) {
      console.error(`❌ [Local Whisper] 잘못된 모델 이름: ${modelSize}`);
      console.warn(`⚠️ 기본 모델(medium)로 대체합니다.`);
      modelSize = 'medium';
    }

    // Whisper 명령어 구성
    const args = [
      audioPath,
      '--output_dir', outputDir,
      '--output_format', 'json',
      '--language', this.mapLanguageCode(language),
      '--task', 'transcribe',
      '--word_timestamps', 'True'  // 단어별 정밀 타이밍 추가
    ];

    // 모델 경로가 지정된 경우 추가
    if (this.modelPath) {
      args.push('--model', this.modelPath);
      console.log('[Local Whisper] 사용자 지정 모델 사용:', this.modelPath);
    } else {
      args.push('--model', modelSize);
      console.log('[Local Whisper] 모델 크기:', modelSize, '(환경변수:', process.env.LOCAL_WHISPER_MODEL_SIZE, ')');
    }

    const command = `${this.whisperCommand} ${args.join(' ')}`;
    console.log('[Local Whisper] 전체 명령어:', command);

    try {
      console.log('[Local Whisper] 실행 전 확인:', {
        audioPath,
        audioExists: fs.existsSync(audioPath),
        outputDir,
        outputDirExists: fs.existsSync(outputDir)
      });

      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5분 타임아웃
        maxBuffer: 1024 * 1024 * 10 // 10MB 버퍼
      });

      console.log('[Local Whisper] 실행 결과:', {
        stdout: stdout || 'no stdout',
        stderr: stderr || 'no stderr'
      });

      // 모델 관련 에러 감지
      if (stderr) {
        console.warn('[Local Whisper] 경고:', stderr);
        
        // 모델을 찾을 수 없는 경우
        if (stderr.includes('Model not found') || stderr.includes('does not exist') || 
            stderr.includes('Invalid model') || stderr.includes('Unknown model')) {
          console.error(`❌ [Local Whisper] 모델 오류 감지!`);
          console.error(`❌ 요청한 모델: ${modelSize}`);
          console.error(`❌ 사용 가능한 모델: tiny, base, small, medium, large, large-v1, large-v2, large-v3, large-v3-turbo`);
          console.error(`💡 해결 방법:`);
          console.error(`   1. .env 파일에서 LOCAL_WHISPER_MODEL_SIZE 값을 확인하세요`);
          console.error(`   2. 유효한 모델 이름으로 변경하세요`);
          console.error(`   3. 서버를 재시작하세요 (npm run dev:server)`);
          
          // 기본 모델로 폴백 시도
          console.warn(`⚠️ 기본 모델(medium)로 재시도합니다...`);
          const fallbackCommand = command.replace(new RegExp(`--model ${modelSize}`), '--model medium');
          await execAsync(fallbackCommand, {
            timeout: 300000,
            maxBuffer: 1024 * 1024 * 10
          });
          
          return outputDir;
        }
        
        // 모델 다운로드 중인 경우
        if (stderr.includes('Downloading') || stderr.includes('downloading')) {
          console.log(`📥 [Local Whisper] 모델 다운로드 중: ${modelSize}`);
          console.log(`⏳ 첫 실행 시 모델 다운로드로 시간이 걸릴 수 있습니다.`);
        }
      }

      console.log('[Local Whisper] 실행 완료');
      return outputDir;
    } catch (error) {
      console.error('[Local Whisper] 실행 실패 상세:', {
        error: error,
        message: error instanceof Error ? error.message : String(error),
        command: command,
        audioPath: audioPath,
        audioExists: fs.existsSync(audioPath)
      });
      throw error;
    }
  }

  /**
   * Whisper 출력 결과 파싱
   */
  private async parseWhisperOutput(outputDir: string, baseName: string): Promise<SubtitleSegment[]> {
    const jsonPath = path.join(outputDir, `${baseName}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Whisper 출력 파일을 찾을 수 없습니다: ${jsonPath}`);
    }

    try {
      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(jsonContent);

      // Whisper JSON 형식에서 segments 추출
      if (data.segments && Array.isArray(data.segments)) {
        return data.segments.map((segment: any) => ({
          start: segment.start || 0,
          end: segment.end || 0,
          text: (segment.text || '').trim(),
          words: segment.words || [],  // 단어별 타이밍 정보 추가
          confidence: segment.avg_logprob || 0,  // 신뢰도 점수 추가
          tokens: segment.tokens || []  // 토큰 정보 추가 (디버깅용)
        }));
      } else {
        // segments가 없는 경우 전체 텍스트를 하나의 세그먼트로 처리
        return [{
          start: 0,
          end: data.duration || 0,
          text: (data.text || '').trim(),
          words: [],  // 단어 정보 없음
          confidence: 0,  // 신뢰도 정보 없음
          tokens: []  // 토큰 정보 없음
        }];
      }
    } catch (error) {
      console.error('[Local Whisper] 결과 파싱 실패:', error);
      throw new Error(`Whisper 출력 파싱 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 언어 코드 매핑 (Whisper 형식에 맞게)
   */
  private mapLanguageCode(language: string): string {
    // Whisper는 2글자 언어 코드를 사용합니다
    const languageMap: { [key: string]: string } = {
      'ko': 'ko',
      'en': 'en',
      'ja': 'ja',
      'zh': 'zh',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'ru': 'ru',
      'ar': 'ar'
    };

    return languageMap[language] || 'en';
  }

  /**
   * 임시 파일 정리
   */
  private cleanupTempFiles(audioPath: string, outputDir: string) {
    try {
      // 처리된 오디오 파일 삭제
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      // 출력 디렉터리 삭제
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }

      console.log('[Local Whisper] 임시 파일 정리 완료');
    } catch (error) {
      console.warn('[Local Whisper] 임시 파일 정리 실패:', error);
    }
  }

  /**
   * 로컬 Whisper 설치 상태 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      // whisper 명령어가 설치되어 있는지 확인
      const { stdout } = await execAsync(`${this.whisperCommand} --help`, { timeout: 5000 });
      
      if (stdout && stdout.includes('whisper')) {
        console.log('[Local Whisper] 설치 확인됨');
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('[Local Whisper] 설치되지 않음 또는 접근 불가:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * 서비스 타입 반환
   */
  getProviderType(): string {
    return 'Local';
  }

  /**
   * 로컬 Whisper 정보 반환
   */
  async getLocalInfo(): Promise<any> {
    try {
      const available = await this.isAvailable();
      
      if (!available) {
        return {
          provider: 'Local',
          available: false,
          error: 'Whisper가 설치되지 않았습니다.'
        };
      }

      // 버전 정보 확인
      let version = 'Unknown';
      try {
        const { stdout } = await execAsync(`${this.whisperCommand} --version`, { timeout: 3000 });
        version = stdout.trim();
      } catch (error) {
        // 버전 정보를 가져올 수 없는 경우
      }

      return {
        provider: 'Local',
        available: true,
        version: version,
        command: this.whisperCommand,
        modelPath: this.modelPath || 'Default',
        modelSize: process.env.LOCAL_WHISPER_MODEL_SIZE || 'base'
      };
    } catch (error) {
      return {
        provider: 'Local',
        available: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 지원되는 모델 목록 반환
   */
  getSupportedModels(): string[] {
    return this.validModels;
  }
  
  /**
   * 현재 모델 정보 반환 (캐시 키에 사용)
   */
  protected getModelInfo(): string {
    const modelSize = process.env.LOCAL_WHISPER_MODEL_SIZE || 'medium';
    return `local-whisper-${modelSize}`;
  }

  /**
   * 모델 다운로드 (필요시)
   */
  async downloadModel(modelSize: string): Promise<boolean> {
    try {
      console.log(`[Local Whisper] 모델 다운로드 시작: ${modelSize}`);
      
      // 간단한 transcribe 명령으로 모델 다운로드 유도
      const tempAudioPath = path.join(this.tempDir, 'temp_download.wav');
      
      // 1초짜리 무음 파일 생성
      await this.createSilentAudio(tempAudioPath);
      
      const args = [
        tempAudioPath,
        '--output_dir', this.tempDir,
        '--model', modelSize,
        '--output_format', 'txt'
      ];
      
      const command = `${this.whisperCommand} ${args.join(' ')}`;
      await execAsync(command, { timeout: 600000 }); // 10분 타임아웃
      
      // 임시 파일 정리
      fs.unlinkSync(tempAudioPath);
      
      console.log(`[Local Whisper] 모델 다운로드 완료: ${modelSize}`);
      return true;
    } catch (error) {
      console.error(`[Local Whisper] 모델 다운로드 실패: ${modelSize}`, error);
      return false;
    }
  }

  /**
   * 무음 오디오 파일 생성 (모델 다운로드용)
   */
  private async createSilentAudio(outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('anullsrc=channel_layout=mono:sample_rate=16000')
        .inputFormat('lavfi')
        .duration(1) // 1초
        .audioCodec('pcm_s16le')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }
}