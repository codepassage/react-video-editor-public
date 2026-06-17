/**
 * 🎬 render.service.ts - 비디오 렌더링 서비스
 * 
 * Remotion 기반 고품질 비디오 렌더링을 담당하는 핵심 서비스
 * 타임라인 데이터를 최종 MP4 비디오로 변환하는 전체 파이프라인 관리
 * 
 * 주요 기능:
 * - Remotion 번들 생성 및 최적화
 * - 한국어 폰트 지원 (FontService 연동)
 * - 트랙/클립 데이터 변환 및 검증
 * - FFmpeg 기반 고품질 렌더링
 * - 환경 변수 및 설정 주입
 * - 렌더링 진행률 모니터링
 * 
 * 렌더링 파이프라인:
 * 1. Bundle 생성 (Webpack + Remotion)
 * 2. 트랙 데이터 변환 및 검증
 * 3. 폰트 서비스 준비 확인
 * 4. Remotion 컴포지션 선택
 * 5. 최종 비디오 렌더링
 * 6. 파일 저장 및 반환
 * 
 * 성능 최적화:
 * - Bundle 재사용 (캐싱)
 * - 폰트 사전 로딩
 * - 메모리 효율적 데이터 변환
 * - 병렬 처리 지원
 * 
 * 지원 형식:
 * - 출력: MP4 (H.264)
 * - 해상도: 커스텀 (기본 1920x1080)
 * - 프레임레이트: 커스텀 (기본 30fps)
 */

import path from 'path';
import fs from 'fs-extra';
import webpack from 'webpack';
import { v4 as uuidv4 } from 'uuid';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { RenderInputProps, Track, ProjectSettings } from '../types/render.types';
import { convertToRenderData } from '../utils/data-converter';
import { FontService } from './font.service';
import { appConfig } from '../config/app.config';
import { buildFontUrl } from '../utils/url-builder';

export class RenderService {
  private bundleLocation: string | null = null;  // Remotion 번들 위치 (캐싱용)
  private fontService: FontService;               // 한국어 폰트 서비스

  constructor(fontService: FontService) {
    this.fontService = fontService;
  }

  /**
   * Remotion 번들 생성
   * Webpack을 사용하여 렌더링용 번들을 생성하고 캐싱
   * 폰트 파일 처리 및 환경변수 주입 포함
   */
  async createBundle(): Promise<void> {
    // 번들이 이미 존재하면 재사용 (성능 최적화)
    if (this.bundleLocation) {
      console.log('📦 Bundle already exists:', this.bundleLocation);
      return;
    }

    console.log('📦 Creating Remotion bundle...');
    try {
      this.bundleLocation = await bundle({
        entryPoint: path.resolve('./src/render/index.ts'),
        webpackOverride: (config) => {
          return {
            ...config,
            module: {
              ...config.module,
              rules: [
                ...(config.module?.rules || []),
                // 한국어 폰트 파일 처리 규칙
                {
                  test: /\.(woff|woff2|eot|ttf|otf)$/i,
                  type: 'asset/resource',
                  generator: {
                    filename: 'fonts/[name][ext]',
                  },
                },
              ],
            },
            plugins: [
              ...(config.plugins || []),
              // Remotion 전용 환경변수를 빌드 타임에 주입
              new webpack.DefinePlugin({
                'process.env.REMOTION_API_URL': JSON.stringify(process.env.VITE_API_URL),
                'process.env.REMOTION_BACKEND_PORT': JSON.stringify(process.env.VITE_BACKEND_PORT),
                'process.env.REMOTION_FONT_SERVER_URL': JSON.stringify(process.env.VITE_FONT_SERVER_URL),
              }),
            ],
          };
        },
      });
      console.log('✅ Bundle created successfully:', this.bundleLocation);
    } catch (error) {
      console.error('❌ Bundle creation failed:', error);
      throw error;
    }
  }

  /**
   * 비디오 렌더링 메인 메서드
   * 트랙 데이터를 받아 최종 MP4 비디오를 생성
   * 전체 렌더링 파이프라인을 조율
   */
  async renderVideo(tracks: Track[], projectSettings: ProjectSettings): Promise<string> {
    // 필수 조건 검증
    if (!this.bundleLocation) {
      throw new Error('Bundle not created. Call createBundle() first.');
    }

    if (!this.fontService.isReady()) {
      throw new Error('Font service not initialized.');
    }

    console.log('🎬 Starting render with modular system...');
    console.log('Input tracks:', tracks.length);
    console.log('Project settings:', projectSettings);

    // 입력 데이터 검증 및 디버깅
    this.debugTrackData(tracks);
    
    // Sentence 클립 특별 디버깅 (TTS 연동 확인)
    this.debugSentenceClips(tracks);

    // 트랙 데이터를 Remotion 렌더링 형식으로 변환
    const renderData = convertToRenderData(tracks, projectSettings, parseInt(appConfig.port.toString()));

    console.log('🔄 Converted render data:', {
      timelineDataLength: renderData.timelineData.length,
      compositionWidth: renderData.compositionWidth,
      compositionHeight: renderData.compositionHeight
    });

    // 미디어 URL 디버깅
    this.debugMediaUrls(renderData);

    // 폰트 매핑 생성
    const fontMappings = this.createFontMappings(renderData);

    // InputProps 구성
    const inputProps: RenderInputProps = {
      timelineData: renderData.timelineData,
      durationInFrames: renderData.durationInFrames,
      compositionWidth: renderData.compositionWidth,
      compositionHeight: renderData.compositionHeight,
      isRendering: true,
      fontMappings: Object.fromEntries(fontMappings),
      serverFontDir: appConfig.paths.fonts
    };

    console.log('🎯 Input props prepared');

    // 컴포지션 선택
    const composition = await selectComposition({
      serveUrl: this.bundleLocation,
      id: appConfig.rendering.compositionId,
      inputProps,
      publicDir: appConfig.paths.public,
    });

    console.log('📋 Composition selected:', {
      id: composition.id,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationInFrames: composition.durationInFrames,
      inputProps: inputProps,
    });

    // 출력 파일 경로
    const renderId = uuidv4();
    const outputPath = path.join(appConfig.paths.renders, `${renderId}.mp4`);

    console.log('🎥 Starting render to:', outputPath);
    
    // 🆕 렌더링 전 최종 데이터 검증
    this.validateRenderData(inputProps);

    try {
      // 렌더링 실행
      await renderMedia({
        composition,
        serveUrl: this.bundleLocation,
        codec: appConfig.rendering.codec as any,
        outputLocation: outputPath,
        inputProps: {
          ...inputProps,
          fontMappings: Object.fromEntries(fontMappings),
          serverFontDir: appConfig.paths.fonts,
          // 환경변수는 이제 Webpack DefinePlugin으로 빌드 타임에 주입됨
        },
        publicDir: appConfig.paths.public,
        concurrency: appConfig.rendering.concurrency,
        verbose: true,
        logLevel: appConfig.rendering.logLevel as any,
        envVariables: {
          REMOTION_FONT_BASE_URL: buildFontUrl(''),
          REMOTION_SERVER_PORT: appConfig.port.toString(),
          REMOTION_FONT_DIR: appConfig.paths.fonts,
          REMOTION_FONT_MAPPINGS: JSON.stringify(Object.fromEntries(fontMappings)),
          REMOTION_AVAILABLE_FONTS: JSON.stringify(
            this.fontService.getAvailableFonts().map(f => ({
              family: f.familyName,
              path: f.absolutePath
            }))
          ),
        },
        ffmpegOverride: ({ args }) => {
          return [
            ...args,
            '-preset', appConfig.rendering.ffmpegPreset,
            '-crf', appConfig.rendering.crf.toString(),
            '-threads', appConfig.rendering.threads.toString(),
            '-tune', 'film',
            '-x264-params', 'ref=3:me=hex:subme=6:trellis=1',
            '-g', '30',
            '-bf', '2',
            '-maxrate', appConfig.rendering.maxRate,
            '-bufsize', appConfig.rendering.bufSize,
          ];
        },
        timeoutInMilliseconds: appConfig.timeout,
      });

      console.log('✅ Render completed successfully');
      return outputPath;

    } catch (error) {
      // 실패한 파일 정리
      await this.cleanupFailedRender(outputPath);
      throw error;
    }
  }

  /**
   * 폰트 매핑 생성 (Sentence 클립 세그먼트 폰트 포함)
   */
  private createFontMappings(renderData: any): Map<string, string> {
    const fontMappings = new Map<string, string>();
    const usedFonts: Array<{ family: string, weight?: string }> = [];

    // 렌더 데이터에서 사용된 폰트 추출
    renderData.timelineData.forEach((timeline: any) => {
      timeline.scrubbers.forEach((scrubber: any) => {
        // 🆕 Text와 Sentence 클립의 기본 폰트 처리
        if ((scrubber.mediaType === 'text' || scrubber.mediaType === 'sentence') && scrubber.fontFamily) {
          const fontKey = `${scrubber.fontFamily}-${scrubber.fontWeight || '400'}`;
          if (!usedFonts.find(f => `${f.family}-${f.weight || '400'}` === fontKey)) {
            usedFonts.push({
              family: scrubber.fontFamily,
              weight: scrubber.fontWeight || '400'
            });
          }
        }

        // 🆕 Sentence 클립의 세그먼트별 폰트 처리
        if (scrubber.mediaType === 'sentence' && scrubber.textSegments) {
          scrubber.textSegments.forEach((segment: any) => {
            if (segment.style.fontFamily) {
              const segmentFontKey = `${segment.style.fontFamily}-${segment.style.fontWeight || '400'}`;
              if (!usedFonts.find(f => `${f.family}-${f.weight || '400'}` === segmentFontKey)) {
                usedFonts.push({
                  family: segment.style.fontFamily,
                  weight: segment.style.fontWeight || '400'
                });
                console.log(`📄 Added segment font: ${segment.style.fontFamily} (${segment.style.fontWeight || '400'})`);
              }
            }
          });
        }
      });
    });

    // FontService를 통해 매핑 생성
    const mappings = this.fontService.createFontMappings(usedFonts);
    console.log(`🎨 Font mappings created: ${mappings.size} fonts mapped (includes segment fonts)`);

    return mappings;
  }

  /**
   * 트랙 데이터 디버깅
   */
  private debugTrackData(tracks: Track[]): void {
    console.log('🔍 Input track debugging:');
    tracks.forEach((track, idx) => {
      console.log(`Track ${idx}:`, {
        id: track.id,
        clips: track.clips.length,
        firstClip: track.clips[0] ? {
          id: track.clips[0].id.slice(-8),
          mediaType: track.clips[0].mediaType,
          text: track.clips[0].text || 'N/A'
        } : null
      });
    });
  }

  /**
   * 🆕 Sentence 클립 특별 디버깅
   */
  private debugSentenceClips(tracks: Track[]): void {
    const sentenceClips = tracks.flatMap(track => 
      track.clips.filter((clip: any) => clip.mediaType === 'sentence')
    );

    if (sentenceClips.length > 0) {
      console.log('📄 Sentence clips debugging:');
      sentenceClips.forEach((clip: any, idx) => {
        console.log(`Sentence Clip ${idx + 1}:`, {
          id: clip.id.slice(-8),
          text: clip.text || 'N/A',
          segmentCount: clip.textSegments?.length || 0,
          segmentVersion: clip.segmentVersion || 'N/A',
          baseFont: {
            family: clip.fontFamily || 'default',
            size: clip.fontSize || 'default',
            weight: clip.fontWeight || 'default'
          },
          effects: {
            textShadow: clip.textShadow || 'none',
            backgroundColor: clip.backgroundColor || 'transparent',
            borderRadius: clip.borderRadius || 0
          },
          segments: clip.textSegments?.map((seg: any) => ({
            id: seg.id.slice(-4),
            text: seg.text.slice(0, 30) + (seg.text.length > 30 ? '...' : ''),
            range: `${seg.startIndex}-${seg.endIndex}`,
            font: seg.style.fontFamily || 'inherit',
            color: seg.style.color || 'inherit'
          })) || []
        });
      });
    } else {
      console.log('📄 No Sentence clips found in tracks');
    }
  }

  /**
   * 미디어 URL 디버깅 (Sentence 클립 세맀 정보 포함)
   */
  private debugMediaUrls(renderData: any): void {
    console.log('🔍 Media URL debugging:');
    renderData.timelineData.forEach((timeline: any, idx: number) => {
      timeline.scrubbers.forEach((scrubber: any, sIdx: number) => {
        console.log(`📊 Render scrubber ${idx}-${sIdx}:`, {
          id: scrubber.id.slice(-8),
          trackId: scrubber.trackId,
          trackIndex: scrubber.trackIndex,
          mediaType: scrubber.mediaType,
          text: scrubber.text || 'N/A',
          // 🆕 Sentence 클립 세그먼트 정보 추가
          segments: scrubber.mediaType === 'sentence' ? (scrubber.textSegments?.length || 0) + ' segs' : 'N/A',
          local: scrubber.mediaUrlLocal,
          remote: scrubber.mediaUrlRemote
        });
        
        // 🆕 Sentence 클립의 세그먼트 상세 정보
        if (scrubber.mediaType === 'sentence' && scrubber.textSegments?.length > 0) {
          console.log(`    📄 Segments for ${scrubber.id.slice(-8)}:`, 
            scrubber.textSegments.map((seg: any) => ({
              id: seg.id.slice(-4),
              range: `${seg.startIndex}-${seg.endIndex}`,
              style: {
                font: seg.style.fontFamily || 'inherit',
                size: seg.style.fontSize || 'inherit',
                color: seg.style.color || 'inherit'
              }
            }))
          );
        }
      });
    });
  }

  /**
   * 실패한 렌더링 파일 정리
   */
  private async cleanupFailedRender(outputPath: string): Promise<void> {
    try {
      if (await fs.pathExists(outputPath)) {
        await fs.remove(outputPath);
        console.log('🧹 Cleaned up partial render file');
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Could not clean up partial file:', cleanupErr);
    }
  }

  /**
   * 번들 상태 확인
   */
  isBundleReady(): boolean {
    return !!this.bundleLocation;
  }

  /**
   * 번들 위치 조회
   */
  getBundleLocation(): string | null {
    return this.bundleLocation;
  }

  /**
   * 🆕 렌더링 데이터 최종 검증
   */
  private validateRenderData(inputProps: RenderInputProps): void {
    console.log('🔍 Final render data validation:');
    
    const sentenceCount = inputProps.timelineData.reduce((count, timeline) => 
      count + timeline.scrubbers.filter(s => s.mediaType === 'sentence').length, 0
    );
    
    if (sentenceCount > 0) {
      console.log(`📄 Found ${sentenceCount} Sentence clips in render data`);
      
      inputProps.timelineData.forEach((timeline, tIdx) => {
        timeline.scrubbers
          .filter(s => s.mediaType === 'sentence')
          .forEach((scrubber, sIdx) => {
            console.log(`📄 Sentence ${tIdx}-${sIdx} validation:`, {
              id: scrubber.id.slice(-8),
              hasText: !!scrubber.text,
              hasSegments: !!scrubber.textSegments?.length,
              segmentCount: scrubber.textSegments?.length || 0,
              hasBaseFont: !!scrubber.fontFamily,
              ready: !!scrubber.text && !!scrubber.fontFamily
            });
          });
      });
    } else {
      console.log('📄 No Sentence clips in render data');
    }
  }

  /**
   * 렌더링 통계
   */
  async getRenderStats(): Promise<{
    totalRenders: number;
    totalSize: number;
    averageSize: number;
    recentRenders: string[];
  }> {
    try {
      const renderFiles = await fs.readdir(appConfig.paths.renders);
      const mp4Files = renderFiles.filter(file => file.endsWith('.mp4'));

      let totalSize = 0;
      const recentRenders: string[] = [];

      for (const file of mp4Files.slice(0, 10)) { // 최근 10개만
        const filePath = path.join(appConfig.paths.renders, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        recentRenders.push(file);
      }

      return {
        totalRenders: mp4Files.length,
        totalSize,
        averageSize: mp4Files.length > 0 ? totalSize / mp4Files.length : 0,
        recentRenders
      };
    } catch (error) {
      console.warn('Failed to get render stats:', error);
      return {
        totalRenders: 0,
        totalSize: 0,
        averageSize: 0,
        recentRenders: []
      };
    }
  }
}

// 팩토리 함수
export function createRenderService(fontService: FontService): RenderService {
  return new RenderService(fontService);
}
