import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

interface YouTubeCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

interface UploadOptions {
  filePath: string;
  title: string;
  description?: string;
  tags?: string[];
  privacy: 'private' | 'unlisted' | 'public';
  categoryId?: string;
  thumbnail?: string;
  scheduledAt?: Date;
}

interface VideoUploadResult {
  success: boolean;
  videoId?: string;
  error?: string;
  uploadBytes?: number;
}

export class YouTubeService {
  private oauth2Client: any;
  private youtube: any;

  constructor() {
    // OAuth2 클라이언트 초기화
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // YouTube API 클라이언트 초기화
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  /**
   * OAuth2 인증 URL 생성
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * 인증 코드로 토큰 교환
   */
  async authenticate(code: string): Promise<YouTubeCredentials> {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        scope: tokens.scope!,
        token_type: tokens.token_type!,
        expiry_date: tokens.expiry_date!
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh Token으로 새 Access Token 발급
   */
  async refreshToken(refreshToken: string): Promise<YouTubeCredentials> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);

      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || refreshToken,
        scope: credentials.scope!,
        token_type: credentials.token_type!,
        expiry_date: credentials.expiry_date!
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 저장된 토큰으로 인증 설정
   */
  setCredentials(credentials: YouTubeCredentials): void {
    this.oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      scope: credentials.scope,
      token_type: credentials.token_type,
      expiry_date: credentials.expiry_date
    });
  }

  /**
   * 채널 정보 조회
   */
  async getChannelInfo(): Promise<any> {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics'],
        mine: true
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('No channel found');
      }

      return response.data.items[0];
    } catch (error) {
      throw new Error(`Failed to get channel info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 비디오 업로드
   */
  async uploadVideo(options: UploadOptions, onProgress?: (progress: number) => void): Promise<VideoUploadResult> {
    try {
      // 파일 존재 확인
      if (!fs.existsSync(options.filePath)) {
        throw new Error(`Video file not found: ${options.filePath}`);
      }

      const fileSize = fs.statSync(options.filePath).size;
      const media = {
        mimeType: 'video/mp4',
        body: fs.createReadStream(options.filePath)
      };

      // 비디오 메타데이터 준비
      const snippet: any = {
        title: options.title,
        description: options.description || '',
        tags: options.tags || [],
        categoryId: options.categoryId || '22', // People & Blogs
        defaultLanguage: 'ko',
        defaultAudioLanguage: 'ko'
      };

      // 공개 설정
      const status: any = {
        privacyStatus: options.privacy,
        selfDeclaredMadeForKids: false
      };

      // 예약 업로드 설정
      if (options.scheduledAt && options.privacy === 'public') {
        status.publishAt = options.scheduledAt.toISOString();
        status.privacyStatus = 'private'; // 예약 업로드는 일단 private으로
      }

      const requestBody = {
        snippet,
        status,
        notifySubscribers: false
      };

      console.log('Starting YouTube upload...', {
        title: options.title,
        privacy: options.privacy,
        fileSize: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
        scheduledAt: options.scheduledAt?.toISOString()
      });

      // 업로드 실행
      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody,
        media
      });

      if (!response.data.id) {
        throw new Error('Upload failed: No video ID returned');
      }

      console.log(`Video uploaded successfully: ${response.data.id}`);

      // 썸네일 업로드 (옵션)
      if (options.thumbnail && fs.existsSync(options.thumbnail)) {
        try {
          await this.uploadThumbnail(response.data.id, options.thumbnail);
        } catch (thumbnailError) {
          console.warn('Thumbnail upload failed:', thumbnailError);
          // 썸네일 실패는 전체 업로드를 실패로 처리하지 않음
        }
      }

      return {
        success: true,
        videoId: response.data.id,
        uploadBytes: fileSize
      };

    } catch (error) {
      console.error('YouTube upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * 썸네일 업로드
   */
  async uploadThumbnail(videoId: string, thumbnailPath: string): Promise<void> {
    try {
      if (!fs.existsSync(thumbnailPath)) {
        throw new Error(`Thumbnail file not found: ${thumbnailPath}`);
      }

      const media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(thumbnailPath)
      };

      await this.youtube.thumbnails.set({
        videoId,
        media
      });

      console.log(`Thumbnail uploaded for video: ${videoId}`);
    } catch (error) {
      throw new Error(`Thumbnail upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 비디오 상태 조회
   */
  async getVideoStatus(videoId: string): Promise<any> {
    try {
      const response = await this.youtube.videos.list({
        part: ['status', 'processingDetails'],
        id: [videoId]
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      return response.data.items[0];
    } catch (error) {
      throw new Error(`Failed to get video status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 비디오 수정
   */
  async updateVideo(videoId: string, updates: Partial<UploadOptions>): Promise<void> {
    try {
      const requestBody: any = {};

      if (updates.title || updates.description || updates.tags) {
        requestBody.snippet = {};
        if (updates.title) requestBody.snippet.title = updates.title;
        if (updates.description) requestBody.snippet.description = updates.description;
        if (updates.tags) requestBody.snippet.tags = updates.tags;
      }

      if (updates.privacy) {
        requestBody.status = {
          privacyStatus: updates.privacy
        };
      }

      await this.youtube.videos.update({
        part: Object.keys(requestBody),
        requestBody: {
          id: videoId,
          ...requestBody
        }
      });

      console.log(`Video updated: ${videoId}`);
    } catch (error) {
      throw new Error(`Video update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 비디오 삭제
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      await this.youtube.videos.delete({
        id: videoId
      });

      console.log(`Video deleted: ${videoId}`);
    } catch (error) {
      throw new Error(`Video deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 채널의 업로드된 비디오 목록 조회
   */
  async getUploadedVideos(maxResults: number = 50): Promise<any[]> {
    try {
      // 먼저 채널의 uploads 플레이리스트 ID 가져오기
      const channelResponse = await this.youtube.channels.list({
        part: ['contentDetails'],
        mine: true
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new Error('No channel found');
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

      // 플레이리스트 아이템 조회
      const playlistResponse = await this.youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults
      });

      return playlistResponse.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get uploaded videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 할당량 사용량 확인 (근사치)
   */
  getQuotaUsageEstimate(): { daily: number; remaining: number } {
    // YouTube Data API v3의 일일 할당량은 10,000 units
    // 실제 사용량은 Google Cloud Console에서 확인해야 함
    // 여기서는 근사치 계산
    
    const dailyQuota = 10000;
    // 실제 구현에서는 Redis나 DB에 사용량을 저장하고 추적해야 함
    const estimatedUsed = 0; // 구현 필요
    
    return {
      daily: dailyQuota,
      remaining: dailyQuota - estimatedUsed
    };
  }
}

// 싱글톤 인스턴스 생성
export const youtubeService = new YouTubeService();