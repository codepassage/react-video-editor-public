import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import { youtubeService } from '../services/youtubeService';
import fs from 'fs';

const prisma = new PrismaClient();

interface UploadJobData {
  uploadId: string;
  videoPath: string;
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
    privacy: 'private' | 'unlisted' | 'public';
    thumbnail?: string;
    publishAt?: string;
  };
  credentials: {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  };
}

export async function processUploadJob(job: Job<UploadJobData>) {
  const { uploadId, videoPath, metadata, credentials } = job.data;
  
  try {
    // Update upload status
    await prisma.youTubeUpload.update({
      where: { id: uploadId },
      data: {
        status: 'uploading'
      }
    });

    // Set YouTube credentials
    youtubeService.setCredentials(credentials);

    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    console.log(`Starting YouTube upload: ${metadata.title}`);
    console.log(`Video path: ${videoPath}`);
    console.log(`Privacy: ${metadata.privacy}`);

    // Prepare upload options
    const uploadOptions = {
      filePath: videoPath,
      title: metadata.title,
      description: metadata.description || '',
      tags: metadata.tags || [],
      privacy: metadata.privacy,
      thumbnail: metadata.thumbnail,
      scheduledAt: metadata.publishAt ? new Date(metadata.publishAt) : undefined
    };

    // Upload to YouTube with progress tracking
    const uploadResult = await youtubeService.uploadVideo(uploadOptions, async (progress) => {
      await job.progress(progress);
      
      await prisma.youTubeUpload.update({
        where: { id: uploadId },
        data: { uploadProgress: progress }
      });
      
      console.log(`Upload progress: ${progress}%`);
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Update as completed
    await prisma.youTubeUpload.update({
      where: { id: uploadId },
      data: {
        status: 'completed',
        uploadProgress: 100,
        uploadedAt: new Date(),
        youtubeVideoId: uploadResult.videoId
      }
    });

    console.log(`YouTube upload completed: ${uploadResult.videoId}`);

    return {
      success: true,
      youtubeVideoId: uploadResult.videoId,
      uploadBytes: uploadResult.uploadBytes
    };

  } catch (error) {
    console.error('Upload job failed:', error);
    
    // Update as failed
    await prisma.youTubeUpload.update({
      where: { id: uploadId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}