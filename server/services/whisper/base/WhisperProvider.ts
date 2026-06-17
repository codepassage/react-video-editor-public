/**
 * Whisper 서비스 추상 기본 클래스
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    probability: number;
  }>;
  confidence?: number;
  tokens?: number[];
}

export abstract class WhisperProvider {
  protected cacheDir: string;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(process.cwd(), 'server', 'uploads', 'whisper');
    this.ensureCacheDir();
  }

  protected ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      console.log(`[${this.constructor.name}] 캐시 디렉토리 생성:`, this.cacheDir);
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * 음성 파일에서 자막 생성 (구현체별로 다름)
   */
  abstract generateSubtitles(audioPath: string, language?: string): Promise<SubtitleSegment[]>;

  /**
   * 서비스 초기화 상태 확인
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * 서비스 타입 반환
   */
  abstract getProviderType(): string;

  /**
   * SRT 파일 생성
   */
  generateSRTFile(segments: SubtitleSegment[], outputPath: string): void {
    const srtContent = segments.map((segment, index) => {
      const startTime = this.formatTime(segment.start);
      const endTime = this.formatTime(segment.end);
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');

    fs.writeFileSync(outputPath, srtContent, 'utf8');
  }

  protected formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * 캐시된 자막 파일 확인
   */
  getCachedSubtitles(audioPath: string, options?: { enablePreciseTiming?: boolean }): SubtitleSegment[] | null {
    const audioHash = this.getFileHash(audioPath, options);
    const modelInfo = this.getModelInfo();
    const cachePath = path.join(this.cacheDir, `${audioHash}.json`);
    
    if (fs.existsSync(cachePath)) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        
        // 구버전 캐시 처리 (배열 형태)
        if (Array.isArray(cachedData)) {
          console.log(`[${this.getProviderType()}] 구버전 캐시 무시 (모델 정보 없음)`);
          fs.unlinkSync(cachePath); // 구버전 캐시 삭제
          return null;
        }
        
        // 모델이 일치하는지 확인
        if (cachedData.model !== modelInfo) {
          console.log(`[${this.getProviderType()}] 캐시 모델 불일치:`, {
            cached: cachedData.model,
            current: modelInfo
          });
          fs.unlinkSync(cachePath); // 다른 모델의 캐시 삭제
          return null;
        }
        
        // 옵션이 일치하는지 확인
        const cachedOptions = cachedData.options || {};
        const currentOptions = options || {};
        if (cachedOptions.enablePreciseTiming !== currentOptions.enablePreciseTiming) {
          console.log(`[${this.getProviderType()}] 캐시 옵션 불일치:`, {
            cached: cachedOptions.enablePreciseTiming,
            current: currentOptions.enablePreciseTiming
          });
          fs.unlinkSync(cachePath); // 다른 옵션의 캐시 삭제
          return null;
        }
        
        console.log(`[${this.getProviderType()}] 캐시된 자막 사용:`, {
          hash: audioHash.substring(0, 8) + '...',
          model: modelInfo,
          options: currentOptions,
          timestamp: cachedData.timestamp
        });
        return cachedData.subtitles;
      } catch (error) {
        console.warn(`[${this.getProviderType()}] 캐시 파일 읽기 실패:`, error);
      }
    }
    
    return null;
  }

  /**
   * 자막을 캐시에 저장
   */
  cacheSubtitles(audioPath: string, subtitles: SubtitleSegment[], options?: { enablePreciseTiming?: boolean }): void {
    const audioHash = this.getFileHash(audioPath, options);
    const modelInfo = this.getModelInfo();
    const cachePath = path.join(this.cacheDir, `${audioHash}.json`);
    
    try {
      // 캐시 데이터에 메타정보 포함
      const cacheData = {
        model: modelInfo,
        options: options || {},
        timestamp: new Date().toISOString(),
        subtitles: subtitles
      };
      
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
      console.log(`[${this.getProviderType()}] 자막 캐시 저장:`, {
        hash: audioHash.substring(0, 8) + '...',
        model: modelInfo,
        options: options || {},
        segments: subtitles.length
      });
    } catch (error) {
      console.warn(`[${this.getProviderType()}] 캐시 저장 실패:`, error);
    }
  }

  protected getFileHash(filePath: string, options?: { enablePreciseTiming?: boolean }): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    
    // 모델 정보를 해시에 포함시켜 모델별로 다른 캐시 사용
    const modelInfo = this.getModelInfo();
    hashSum.update(modelInfo);
    
    // 옵션을 해시에 포함시켜 옵션별로 다른 캐시 사용
    const optionsString = JSON.stringify(options || {});
    hashSum.update(optionsString);
    
    return hashSum.digest('hex');
  }
  
  protected getModelInfo(): string {
    // 서브클래스에서 오버라이드
    return 'default';
  }

  /**
   * 캐시와 함께 자막 생성 (메인 메서드)
   */
  async generateSubtitlesWithCache(audioPath: string, language: string = 'ko', options?: { enablePreciseTiming?: boolean }): Promise<SubtitleSegment[]> {
    // 캐시 확인 (옵션 포함)
    const cached = this.getCachedSubtitles(audioPath, options);
    if (cached) {
      return cached;
    }

    // 새로 생성
    const subtitles = await this.generateSubtitles(audioPath, language);
    
    // 캐시에 저장 (옵션 포함)
    this.cacheSubtitles(audioPath, subtitles, options);
    
    return subtitles;
  }

  /**
   * 캐시 정리
   */
  cleanCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`[${this.getProviderType()}] 오래된 캐시 파일 삭제:`, file);
        }
      });
    } catch (error) {
      console.warn(`[${this.getProviderType()}] 캐시 정리 실패:`, error);
    }
  }
}