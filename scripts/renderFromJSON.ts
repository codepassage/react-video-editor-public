#!/usr/bin/env ts-node

import fs from 'fs-extra';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { ProjectData } from '../src/utils/projectExport';

// 기존 서버 로직 재사용을 위한 임포트 (실제로는 서버의 convertToRenderData 함수를 사용)
// TypeScript에서 .ts 파일을 직접 import하려면 별도 설정이 필요하므로, 함수를 복제

interface RenderScrubber {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  mediaType: 'text' | 'image' | 'video' | 'audio' | 'shape';
  width: number;
  height: number;
  trackId: string;
  trackIndex: number;
  media_width: number;
  media_height: number;
  x: number;
  y: number;
  mediaUrlLocal?: string;
  mediaUrlRemote?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  rotation?: number;
  volume?: number;
  playbackRate?: number;
  shapeProperties?: any;
}

interface RenderTimelineDataItem {
  id: string;
  totalDuration: number;
  scrubbers: RenderScrubber[];
}

function convertToRenderData(
  tracks: any[],
  projectSettings: any,
  serverPort: number = 5002
): {
  timelineData: RenderTimelineDataItem[];
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
} {
  const FPS = projectSettings.fps || 30;
  
  console.log('🔄 Converting tracks to render data...');
  
  const timelineData: RenderTimelineDataItem[] = tracks.map((track, arrayIndex) => {
    // trackId에서 실제 트랙 번호 추출 ("track-1" → 1)
    const actualTrackNumber = track.id ? parseInt(track.id.replace('track-', '')) : (arrayIndex + 1);
    
    console.log(`📦 Processing track:`, {
      arrayIndex,
      trackId: track.id,
      actualTrackNumber,
      clipsCount: track.clips.length
    });
    
    return {
      id: track.id,
      totalDuration: projectSettings.duration,
      scrubbers: track.clips.map((clip: any): RenderScrubber => {
        // URL 처리
        let mediaUrlLocal = clip.mediaUrl;
        let mediaUrlRemote;
        
        if (clip.mediaUrl) {
          if (clip.mediaUrl.startsWith('http://') || clip.mediaUrl.startsWith('https://')) {
            mediaUrlRemote = clip.mediaUrl;
            mediaUrlLocal = clip.mediaUrl;
          } else if (clip.mediaUrl.startsWith('/uploads/')) {
            mediaUrlLocal = clip.mediaUrl;
            mediaUrlRemote = `http://localhost:${serverPort}${clip.mediaUrl}`;
          } else {
            console.warn('😨 Unknown mediaUrl format:', clip.mediaUrl);
            mediaUrlLocal = clip.mediaUrl;
            mediaUrlRemote = clip.mediaUrl;
          }
        }
        
        const scrubber = {
          id: clip.id,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          mediaType: clip.mediaType,
          width: clip.width,
          height: clip.height,
          trackId: track.id,
          trackIndex: actualTrackNumber - 1, // 1-based → 0-based
          media_width: clip.width,
          media_height: clip.height,
          x: clip.x,
          y: clip.y,
          
          mediaUrlLocal,
          mediaUrlRemote,
          
          text: clip.text,
          fontSize: clip.fontSize,
          fontFamily: clip.fontFamily,
          fontWeight: clip.fontWeight,
          color: clip.color,
          backgroundColor: clip.backgroundColor,
          textAlign: clip.textAlign,
          
          opacity: clip.opacity,
          rotation: clip.rotation,
          
          volume: clip.volume,
          playbackRate: clip.playbackRate,
          
          // Shape 클립 속성
          shapeProperties: clip.shapeProperties,
        };
        
        console.log(`  🎨 Clip:`, {
          id: clip.id.slice(-8),
          trackId: track.id,
          trackIndex: scrubber.trackIndex,
          mediaType: clip.mediaType,
          text: clip.text || 'N/A'
        });
        
        return scrubber;
      })
    };
  });
  
  return {
    timelineData,
    durationInFrames: Math.round(projectSettings.duration * FPS),
    compositionWidth: projectSettings.width,
    compositionHeight: projectSettings.height,
  };
}

interface CLIOptions {
  input: string;      // JSON 파일 경로
  output?: string;    // 출력 동영상 경로
  quality?: number;   // 비디오 품질 (CRF 값)
  fps?: number;       // FPS 오버라이드
  verbose?: boolean;  // 상세 로그
  port?: number;      // 서버 포트 (미디어 파일 접근용)
}

async function renderFromJSON(options: CLIOptions) {
  console.log('🎬 JSON 기반 동영상 렌더링 시작...');
  console.log('📁 입력 파일:', options.input);
  
  // 1. JSON 파일 읽기
  if (!await fs.pathExists(options.input)) {
    throw new Error(`JSON 파일을 찾을 수 없습니다: ${options.input}`);
  }
  
  const projectData: ProjectData = await fs.readJson(options.input);
  console.log('✅ 프로젝트 데이터 로드 완료');
  console.log('📊 트랙 수:', projectData.tracks.length);
  console.log('🎞️ 프로젝트 설정:', projectData.projectSettings);
  console.log('📅 내보낸 시간:', projectData.metadata.exportedAt);
  
  // 총 클립 수 확인
  const totalClips = projectData.tracks.reduce((sum, track) => sum + track.clips.length, 0);
  console.log('🎨 총 클립 수:', totalClips);
  
  if (totalClips === 0) {
    console.warn('⚠️ 클립이 없는 프로젝트입니다. 빈 동영상이 생성됩니다.');
  }
  
  // 2. 번들 생성
  console.log('📦 Remotion 번들 생성 중...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve('./src/render/index.ts'),
    webpackOverride: (config) => config,
  });
  console.log('✅ 번들 생성 완료:', bundleLocation);
  
  // 3. 렌더링 데이터 변환 (기존 서버 로직 재사용)
  console.log('🔄 렌더링 데이터 변환 중...');
  const renderData = convertToRenderData(
    projectData.tracks, 
    projectData.projectSettings, 
    options.port || 5002
  );
  
  console.log('📊 변환된 렌더링 데이터:', {
    timelineDataLength: renderData.timelineData.length,
    durationInFrames: renderData.durationInFrames,
    compositionWidth: renderData.compositionWidth,
    compositionHeight: renderData.compositionHeight,
  });
  
  // 4. 입력 props 구성
  const inputProps = {
    timelineData: renderData.timelineData,
    durationInFrames: renderData.durationInFrames,
    compositionWidth: renderData.compositionWidth,
    compositionHeight: renderData.compositionHeight,
    isRendering: true
  };
  
  // 5. 컴포지션 선택
  console.log('🎯 컴포지션 선택 중...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'VideoEditorComposition',
    inputProps,
  });
  
  console.log('📋 컴포지션 정보:', {
    id: composition.id,
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    durationInFrames: composition.durationInFrames,
  });
  
  // 6. 출력 경로 결정
  const outputPath = options.output || 
    path.join('./renders', `render-${Date.now()}.mp4`);
  
  await fs.ensureDir(path.dirname(outputPath));
  
  console.log('🎥 동영상 렌더링 시작...');
  console.log('📤 출력 경로:', outputPath);
  
  // 7. 렌더링 실행
  const startTime = Date.now();
  
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    concurrency: 3,
    verbose: options.verbose || false,
    logLevel: options.verbose ? 'info' : 'warn',
    ffmpegOverride: ({ args }) => {
      const quality = options.quality || 28;
      return [
        ...args,
        '-preset', 'fast',
        '-crf', quality.toString(),
        '-threads', '4',
        '-tune', 'film',
        '-maxrate', '8M',
        '-bufsize', '16M',
      ];
    },
    timeoutInMilliseconds: 1800000, // 30분 타임아웃
    onProgress: ({ progress, renderedFrames, renderedFramesPerSecond }) => {
      if (!options.verbose) {
        // 간단한 진행률 표시
        const percentage = Math.round(progress * 100);
        process.stdout.write(`\r🎬 렌더링 진행률: ${percentage}% (${renderedFrames}/${composition.durationInFrames} 프레임, ${renderedFramesPerSecond?.toFixed(1) || 0} fps)`);
      }
    }
  });
  
  const endTime = Date.now();
  const renderTime = (endTime - startTime) / 1000;
  
  console.log('\n✅ 렌더링 완료!');
  console.log('📁 생성된 파일:', outputPath);
  console.log('⏱️ 렌더링 시간:', `${renderTime.toFixed(1)}초`);
  
  // 8. 파일 정보 출력
  const stats = await fs.stat(outputPath);
  console.log('📊 파일 크기:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('🎯 비디오 품질 (CRF):', options.quality || 28);
  
  return outputPath;
}

// CLI 인터페이스
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📖 사용법:
  npm run render:json <input.json> [options]
  
📋 옵션:
  --output, -o      출력 파일 경로 (기본: ./renders/render-timestamp.mp4)
  --quality, -q     비디오 품질 1-51 (기본: 28, 낮을수록 고품질)
  --fps            FPS 오버라이드
  --verbose, -v    상세 로그 출력
  --port, -p       서버 포트 (기본: 5002, 미디어 파일 접근용)
  
📚 예시:
  npm run render:json project.json
  npm run render:json project.json --output my-video.mp4 --quality 20
  npm run render:json project.json -o output.mp4 -q 15 -v
  npm run render:json project.json --port 5003 --verbose
    `);
    process.exit(0);
  }
  
  const options: CLIOptions = {
    input: args[0]
  };
  
  // 인자 파싱
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    if ((arg === '--output' || arg === '-o') && nextArg) {
      options.output = nextArg;
      i++;
    } else if ((arg === '--quality' || arg === '-q') && nextArg) {
      options.quality = parseInt(nextArg);
      i++;
    } else if (arg === '--fps' && nextArg) {
      options.fps = parseInt(nextArg);
      i++;
    } else if ((arg === '--port' || arg === '-p') && nextArg) {
      options.port = parseInt(nextArg);
      i++;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }
  
  // 유효성 검사
  if (options.quality && (options.quality < 1 || options.quality > 51)) {
    console.error('❌ 품질 값은 1-51 사이여야 합니다.');
    process.exit(1);
  }
  
  if (options.fps && (options.fps < 1 || options.fps > 120)) {
    console.error('❌ FPS 값은 1-120 사이여야 합니다.');
    process.exit(1);
  }
  
  if (options.port && (options.port < 1000 || options.port > 65535)) {
    console.error('❌ 포트 번호는 1000-65535 사이여야 합니다.');
    process.exit(1);
  }
  
  try {
    console.log('🚀 JSON 기반 렌더링 시작...');
    console.log('⚙️ 렌더링 옵션:', {
      input: options.input,
      output: options.output || '자동 생성',
      quality: options.quality || 28,
      fps: options.fps || '프로젝트 설정 사용',
      verbose: options.verbose || false,
      port: options.port || 5002
    });
    
    const outputPath = await renderFromJSON(options);
    
    console.log('\n🎉 렌더링 성공!');
    console.log('📁 파일 위치:', path.resolve(outputPath));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 렌더링 실패:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error('💡 해결 방법: 입력 파일 경로가 올바른지 확인하세요.');
      } else if (error.message.includes('EACCES')) {
        console.error('💡 해결 방법: 파일 권한을 확인하세요.');
      } else if (error.message.includes('timeout')) {
        console.error('💡 해결 방법: 더 짧은 영상으로 테스트하거나 --verbose 옵션을 사용하세요.');
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { renderFromJSON };
