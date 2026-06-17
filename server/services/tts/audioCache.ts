import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CacheEntry {
  key: string;
  filePath: string;
  url: string;
  duration: number;
  createdAt: Date;
  lastUsed: Date;
}

export interface CacheStats {
  totalFiles: number;
  totalSize: number; // bytes
  oldestFile: Date | null;
  newestFile: Date | null;
}

export class AudioCacheManager {
  private cacheDir: string;
  private metadataFile: string;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || process.env.TTS_CACHE_DIR || 'server/uploads/tts';
    this.metadataFile = path.join(this.cacheDir, 'cache-metadata.json');
  }

  /**
   * 캐시 초기화 (서버 시작 시 호출)
   */
  async initialize(): Promise<void> {
    try {
      // 디렉토리 생성
      await fs.mkdir(this.cacheDir, { recursive: true });

      // 메타데이터 로드
      await this.loadMetadata();

      // 실제 파일과 메타데이터 동기화
      await this.syncMetadata();
    } catch (error) {
      console.error('Cache initialization failed:', error);
    }
  }

  /**
   * 캐시에서 항목 조회
   */
  async get(key: string): Promise<CacheEntry | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 파일 존재 확인
    try {
      await fs.access(entry.filePath);
      
      // 사용 시간 업데이트
      entry.lastUsed = new Date();
      await this.saveMetadata();
      
      return entry;
    } catch {
      // 파일이 없으면 캐시에서 제거
      this.cache.delete(key);
      await this.saveMetadata();
      return null;
    }
  }

  /**
   * 캐시에 항목 추가
   */
  async set(key: string, filePath: string, url: string, duration: number): Promise<void> {
    const entry: CacheEntry = {
      key,
      filePath,
      url,
      duration,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    this.cache.set(key, entry);
    await this.saveMetadata();
  }

  /**
   * 캐시 항목 삭제
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    try {
      // 파일 삭제
      await fs.unlink(entry.filePath);
    } catch (error) {
      console.warn('Failed to delete cache file:', entry.filePath, error);
    }

    // 메타데이터에서 제거
    this.cache.delete(key);
    await this.saveMetadata();
    
    return true;
  }

  /**
   * 캐시 정리 (오래된 파일 삭제)
   */
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.lastUsed.getTime() > maxAge) {
        toDelete.push(key);
      }
    }

    let deletedCount = 0;
    for (const key of toDelete) {
      if (await this.delete(key)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 캐시 통계 조회
   */
  async getStats(): Promise<CacheStats> {
    const stats: CacheStats = {
      totalFiles: this.cache.size,
      totalSize: 0,
      oldestFile: null,
      newestFile: null
    };

    for (const entry of this.cache.values()) {
      try {
        const fileStats = await fs.stat(entry.filePath);
        stats.totalSize += fileStats.size;

        if (!stats.oldestFile || entry.createdAt < stats.oldestFile) {
          stats.oldestFile = entry.createdAt;
        }

        if (!stats.newestFile || entry.createdAt > stats.newestFile) {
          stats.newestFile = entry.createdAt;
        }
      } catch {
        // 파일이 없으면 무시
      }
    }

    return stats;
  }

  /**
   * 전체 캐시 삭제
   */
  async clear(): Promise<void> {
    const keys = Array.from(this.cache.keys());
    
    for (const key of keys) {
      await this.delete(key);
    }

    this.cache.clear();
    await this.saveMetadata();
  }

  /**
   * 메타데이터 로드
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await fs.readFile(this.metadataFile, 'utf-8');
      const entries: CacheEntry[] = JSON.parse(data);
      
      this.cache.clear();
      for (const entry of entries) {
        // Date 객체로 변환
        entry.createdAt = new Date(entry.createdAt);
        entry.lastUsed = new Date(entry.lastUsed);
        this.cache.set(entry.key, entry);
      }
    } catch {
      // 메타데이터 파일이 없거나 손상된 경우 빈 캐시로 시작
      this.cache.clear();
    }
  }

  /**
   * 메타데이터 저장
   */
  private async saveMetadata(): Promise<void> {
    try {
      const entries = Array.from(this.cache.values());
      const data = JSON.stringify(entries, null, 2);
      await fs.writeFile(this.metadataFile, data, 'utf-8');
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }

  /**
   * 실제 파일과 메타데이터 동기화
   */
  private async syncMetadata(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const audioFiles = files.filter(f => f.endsWith('.mp3'));
      
      // 메타데이터에는 있지만 파일이 없는 경우 제거
      const keysToDelete: string[] = [];
      for (const [key, entry] of this.cache) {
        const fileName = path.basename(entry.filePath);
        if (!audioFiles.includes(fileName)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.cache.delete(key);
      }

      // 파일은 있지만 메타데이터에 없는 경우 파일 삭제
      for (const fileName of audioFiles) {
        const filePath = path.join(this.cacheDir, fileName);
        const key = fileName.replace('.mp3', '');
        
        if (!this.cache.has(key)) {
          try {
            await fs.unlink(filePath);
          } catch (error) {
            console.warn('Failed to delete orphaned file:', filePath, error);
          }
        }
      }

      await this.saveMetadata();
    } catch (error) {
      console.error('Failed to sync metadata:', error);
    }
  }

  /**
   * 캐시 키 생성 헬퍼
   */
  static generateKey(text: string, language: string, voice?: string, speakingRate?: number): string {
    const data = `${text}|${language}|${voice || 'default'}|${speakingRate || 1}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }
}