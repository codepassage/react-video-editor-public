import { Job } from 'bull';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { buildMediaUrl } from '../src/utils/url-builder';

const prisma = new PrismaClient();

interface RenderJobData {
  projectId: string;
  transformResult: any;
  renderSettings: {
    quality?: 1 | 2 | 3;
    fps?: number;
    codec?: string;
  };
}

// Convert render data format
function convertToRenderData(
  transformResult: any,
  serverPort: number = 5002
): {
  timelineData: any[];
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
} {
  const FPS = transformResult.projectSettings?.fps || 30;
  
  // If transformResult already has the correct format, use it directly
  if (transformResult.timelineData) {
    return {
      timelineData: transformResult.timelineData,
      durationInFrames: transformResult.durationInFrames,
      compositionWidth: transformResult.compositionWidth,
      compositionHeight: transformResult.compositionHeight,
    };
  }
  
  // Otherwise, convert from tracks format
  const tracks = transformResult.tracks || [];
  const projectSettings = transformResult.projectSettings || {};
  
  const timelineData = tracks.map((track: any, arrayIndex: number) => {
    const actualTrackNumber = track.id ? parseInt(track.id.replace('track-', '')) : (arrayIndex + 1);
    
    return {
      id: track.id,
      totalDuration: projectSettings.duration,
      scrubbers: track.clips.map((clip: any) => {
        let mediaUrlLocal = clip.mediaUrl;
        let mediaUrlRemote = clip.mediaUrl;
        
        if (clip.mediaUrl) {
          if (clip.mediaUrl.startsWith('http://') || clip.mediaUrl.startsWith('https://')) {
            mediaUrlRemote = clip.mediaUrl;
            mediaUrlLocal = clip.mediaUrl;
          } else if (clip.mediaUrl.startsWith('/uploads/')) {
            mediaUrlLocal = clip.mediaUrl;
            mediaUrlRemote = buildMediaUrl(clip.mediaUrl);
          }
        }
        
        return {
          id: clip.id,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          mediaType: clip.mediaType,
          width: clip.width,
          height: clip.height,
          trackId: track.id,
          trackIndex: actualTrackNumber - 1,
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
          shapeProperties: clip.shapeProperties,
        };
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

export async function processRenderJob(job: Job<RenderJobData>) {
  const { projectId, transformResult, renderSettings } = job.data;
  
  try {
    // Update job status in database
    await prisma.renderJob.update({
      where: { id: job.id as string },
      data: {
        status: 'processing',
        startedAt: new Date()
      }
    });

    // Prepare output path
    const outputDir = path.join(process.cwd(), 'server', 'renders');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputFileName = `video-${projectId}-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    // Convert render data
    console.log('Converting render data...');
    const renderData = convertToRenderData(transformResult, renderSettings.port || 5002);
    
    // Prepare input props
    const inputProps = {
      timelineData: renderData.timelineData,
      durationInFrames: renderData.durationInFrames,
      compositionWidth: renderData.compositionWidth,
      compositionHeight: renderData.compositionHeight,
      isRendering: true
    };

    // Create Remotion bundle
    console.log('Creating Remotion bundle...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./src/render/index.ts'),
      webpackOverride: (config) => config,
    });

    // Select composition
    console.log('Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'VideoEditorComposition',
      inputProps,
    });

    // Render settings
    const quality = renderSettings.quality || 2;
    const crf = quality === 1 ? 18 : quality === 2 ? 23 : 28;
    const codec = renderSettings.codec || 'h264';

    console.log('Starting render with settings:', {
      quality,
      crf,
      codec,
      outputPath
    });

    // Render video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: codec as any,
      outputLocation: outputPath,
      inputProps,
      concurrency: 3,
      verbose: false,
      logLevel: 'warn',
      ffmpegOverride: ({ args }) => {
        return [
          ...args,
          '-preset', 'fast',
          '-crf', crf.toString(),
          '-threads', '4',
          '-tune', 'film',
          '-maxrate', '8M',
          '-bufsize', '16M',
        ];
      },
      timeoutInMilliseconds: 1800000, // 30분 타임아웃
      onProgress: async ({ progress, renderedFrames }) => {
        const percentage = Math.round(progress * 100);
        console.log(`Render progress: ${percentage}% (${renderedFrames}/${composition.durationInFrames} frames)`);
        
        // Update job progress
        await job.progress(percentage);
        
        // Update database
        await prisma.renderJob.update({
          where: { id: job.id as string },
          data: { progress: percentage }
        });
      }
    });

    // Get file stats
    const stats = await fs.stat(outputPath);
    
    // Update job as completed
    await prisma.renderJob.update({
      where: { id: job.id as string },
      data: {
        status: 'completed',
        progress: 100,
        outputPath: outputPath,
        completedAt: new Date(),
        metadata: {
          fileName: outputFileName,
          quality,
          crf,
          codec,
          fileSize: stats.size,
          duration: composition.durationInFrames / composition.fps
        }
      }
    });

    return {
      success: true,
      outputPath,
      fileName: outputFileName
    };

  } catch (error) {
    console.error('Render job failed:', error);
    
    // Update job as failed
    await prisma.renderJob.update({
      where: { id: job.id as string },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      }
    });

    throw error;
  }
}