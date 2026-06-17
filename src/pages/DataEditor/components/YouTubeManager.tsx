/**
 * YouTube 관리자 컴포넌트
 * @description YouTube 업로드 예약, 진행 상황 모니터링, 채널 관리를 위한 통합 컴포넌트
 * 
 * 주요 기능:
 * - Google OAuth 2.0 인증 및 YouTube API 연동
 * - 비디오 업로드 예약 및 자동 업로드
 * - 실시간 업로드 진행률 모니터링 (SSE 사용)
 * - YouTube 채널 통계 정보 대시보드
 * - 비디오 메타데이터 관리 (제목, 설명, 태그, 공개 설정)
 * - API 할당량 모니터링 및 사용량 추적
 * 
 * YouTube API 연동:
 * - OAuth 2.0 인증 플로우
 * - 비디오 업로드 API (resumable upload)
 * - 채널 데이터 API (구독자, 조회수, 비디오 수)
 * - API 할당량 모니터링
 * 
 * 업로드 상태:
 * - scheduled: 예약됨 (대기 중)
 * - uploading: 업로드 중 (진행률 표시)
 * - completed: 완료됨 (YouTube 링크 제공)
 * - failed: 실패 (오류 메시지 표시)
 * - cancelled: 취소됨
 * 
 * 워크플로우:
 * 1. Google 계정 인증 및 권한 승인
 * 2. 렌더링 완료된 비디오로 업로드 예약 생성
 * 3. 자동 업로드 시스템이 예약 시간에 업로드 실행
 * 4. 실시간 진행률 업데이트 및 완료 후 YouTube 링크 제공
 * 
 * 사용 사례:
 * - 대량 비디오 콘텐츠 자동 업로드
 * - 예약 게시 및 시간별 콘텐츠 관리
 * - YouTube 채널 성과 분석 및 모니터링
 */

import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../../utils/globalAlert';
import { getApiUrl } from '../../../utils/urlBuilder';
import { Progress } from '../../../components/Progress';

/**
 * YouTube 업로드 데이터 구조
 * @interface YouTubeUpload
 */
interface YouTubeUpload {
  /** 업로드 고유 식별자 */
  id: string;
  /** 연결된 프로젝트 ID */
  projectId: string;
  /** 연결된 렌더링 작업 ID (선택사항) */
  renderJobId?: string;
  /** 업로드할 비디오 파일 경로 */
  videoPath: string;
  /** YouTube 비디오 제목 */
  title: string;
  /** YouTube 비디오 설명 (선택사항) */
  description?: string;
  /** YouTube 비디오 태그 배열 */
  tags: string[];
  /** 업로드할 썸네일 이미지 경로 (선택사항) */
  thumbnail?: string;
  /** 업로드 예약 시각 */
  scheduledAt: string;
  /** 실제 게시 시각 (선택사항) */
  publishAt?: string;
  /** 공개 설정 (private, unlisted, public) */
  privacy: string;
  /** 현재 업로드 상태 */
  status: string;
  /** YouTube에서 생성된 비디오 ID (완료 시) */
  youtubeVideoId?: string;
  /** 업로드 진행률 (0-100) */
  uploadProgress: number;
  /** 오류 메시지 (실패 시) */
  error?: string;
  /** 업로드 완료 시각 */
  uploadedAt?: string;
  /** 레코드 생성 시각 */
  createdAt: string;
  /** 연결된 프로젝트 정보 (선택사항) */
  project?: {
    name: string;
    status: string;
  };
  /** 연결된 렌더링 작업 정보 (선택사항) */
  renderJob?: {
    id: string;
    status: string;
    outputPath: string;
  };
}

/**
 * YouTube 채널 통계 데이터 구조
 * @interface ChannelStats
 */
interface ChannelStats {
  /** 채널 기본 정보 */
  channel: {
    /** 채널 이름 */
    title: string;
    /** 채널 구독자 수 */
    subscriberCount: string;
    /** 채널 총 조회수 */
    viewCount: string;
    /** 채널 비디오 수 */
    videoCount: string;
  };
  /** 업로드 통계 (상태별 카운트) */
  uploadStats: Record<string, number>;
  /** API 할당량 사용 현황 */
  quotaUsage: {
    /** 일일 사용량 */
    daily: number;
    /** 남은 할당량 */
    remaining: number;
  };
}

/**
 * YouTube 관리자 컴포넌트
 * 
 * YouTube API와 연동하여 비디오 업로드를 관리하고 채널 통계를 모니터링합니다.
 * OAuth 2.0 인증, 예약 업로드, 실시간 진행률 추적 등의 기능을 제공합니다.
 * 
 * @returns YouTube 관리자 UI 컴포넌트
 */
export const YouTubeManager: React.FC = () => {
  const [uploads, setUploads] = useState<YouTubeUpload[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedUpload, setSelectedUpload] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [authCode, setAuthCode] = useState<string>('');
  const [credentials, setCredentials] = useState<any>(null);
  const [progressStreams, setProgressStreams] = useState<Map<string, EventSource>>(new Map());

  // New upload form state
  const [newUpload, setNewUpload] = useState({
    projectId: '',
    renderJobId: '',
    title: '',
    description: '',
    tags: '',
    privacy: 'private' as 'private' | 'unlisted' | 'public',
    scheduledAt: new Date().toISOString().slice(0, 16)
  });

  /**
   * YouTube 업로드 목록 로드 함수
   * @description 서버에서 YouTube 업로드 목록을 조회하고 필터링 조건에 따라 결과를 제한
   * @note 최대 50개 업로드까지 조회 가능
   */
  const loadUploads = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      params.append('limit', '50');

      const response = await fetch(`${getApiUrl()}/api/youtube/uploads?${params}`);
      const data = await response.json();

      if (data.success) {
        setUploads(data.data);
      } else {
        setError(data.error || 'Failed to load uploads');
      }
    } catch (err) {
      setError('Network error while loading uploads');
      console.error('Error loading uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * YouTube 채널 통계 정보 로드 함수
   * @description 인증된 채널의 구독자, 조회수, API 할당량 등의 통계 데이터를 조회
   * @note refresh_token이 있을 때만 호출 가능
   */
  const loadChannelStats = async () => {
    if (!credentials?.refresh_token) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/youtube/channel/stats?refresh_token=${credentials.refresh_token}`);
      const data = await response.json();
      if (data.success) {
        setChannelStats(data.data);
      }
    } catch (err) {
      console.error('Error loading channel stats:', err);
    }
  };

  /**
   * YouTube 인증 URL 요청 함수
   * @description Google OAuth 2.0 인증을 위한 인증 URL을 서버로부터 받아옴
   * @note 인증 URL은 사용자가 Google 계정으로 로그인하고 권한을 승인하는 페이지
   */
  const getAuthUrl = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/youtube/auth/url`);
      const data = await response.json();
      if (data.success) {
        setAuthUrl(data.data.authUrl);
      }
    } catch (err) {
      setError('Failed to get authorization URL');
    }
  };

  /**
   * OAuth 콜백 처리 함수
   * @description 사용자가 Google 인증 후 받은 인증 코드를 서버로 전송하여 access token 획득
   * @note 인증 성공 시 채널 통계 자동 로드
   */
  const handleAuthCallback = async () => {
    if (!authCode.trim()) {
      setError('Please enter the authorization code');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/youtube/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: authCode.trim() })
      });

      const data = await response.json();
      if (data.success) {
        setCredentials(data.data.credentials);
        setIsAuthenticated(true);
        setAuthCode('');
        setError('');
        loadChannelStats();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error during authentication');
    }
  };

  /**
   * YouTube 업로드 예약 함수
   * @description 사용자 입력을 검증하고 YouTube 업로드 예약을 생성
   * @note 프로젝트 ID, 제목, YouTube 인증이 필수
   */
  const scheduleUpload = async () => {
    if (!newUpload.title.trim() || !newUpload.projectId.trim()) {
      setError('Project and title are required');
      return;
    }

    if (!credentials) {
      setError('Please authenticate with YouTube first');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/youtube/uploads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newUpload,
          tags: newUpload.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          credentials
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowScheduleModal(false);
        setNewUpload({
          projectId: '',
          renderJobId: '',
          title: '',
          description: '',
          tags: '',
          privacy: 'private',
          scheduledAt: new Date().toISOString().slice(0, 16)
        });
        loadUploads();
      } else {
        setError(data.error || 'Failed to schedule upload');
      }
    } catch (err) {
      setError('Network error while scheduling upload');
    }
  };

  /**
   * YouTube 업로드 취소 함수
   * @param uploadId - 취소할 업로드의 고유 식별자
   * @description 사용자 확인 후 예약된 또는 진행 중인 업로드를 취소
   */
  const cancelUpload = async (uploadId: string) => {
    if (!(await globalAlert.confirm('Are you sure you want to cancel this upload?'))) {
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/youtube/uploads/${uploadId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        loadUploads();
      } else {
        setError(data.error || 'Failed to cancel upload');
      }
    } catch (err) {
      setError('Network error while cancelling upload');
    }
  };

  /**
   * 업로드 진행률 실시간 구독 함수
   * @param uploadId - 구독할 업로드의 고유 식별자
   * @description Server-Sent Events(SSE)를 사용하여 YouTube 업로드 실시간 진행률 업데이트를 수신
   */
  const subscribeToUploadProgress = (uploadId: string) => {
    if (progressStreams.has(uploadId)) {
      return; // Already subscribed
    }

    const eventSource = new EventSource(`${getApiUrl()}/api/youtube/uploads/${uploadId}/progress`);
    
    eventSource.onmessage = (event) => {
      try {
        const progressData = JSON.parse(event.data);
        
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, ...progressData }
            : upload
        ));
      } catch (err) {
        console.error('Error parsing upload progress data:', err);
      }
    };

    eventSource.onerror = () => {
      console.log(`Upload progress stream ended for ${uploadId}`);
      eventSource.close();
      setProgressStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(uploadId);
        return newMap;
      });
    };

    setProgressStreams(prev => new Map(prev.set(uploadId, eventSource)));
  };

  // Load data when component mounts
  useEffect(() => {
    loadUploads();
    if (!authUrl) {
      getAuthUrl();
    }
    if (credentials) {
      loadChannelStats();
    }
  }, [filterStatus]);

  // Subscribe to progress for uploading jobs
  useEffect(() => {
    const uploadingJobs = uploads.filter(upload => upload.status === 'uploading');
    
    uploadingJobs.forEach(upload => {
      subscribeToUploadProgress(upload.id);
    });

    // Clean up closed streams
    const activeUploadIds = new Set(uploadingJobs.map(upload => upload.id));
    progressStreams.forEach((stream, uploadId) => {
      if (!activeUploadIds.has(uploadId)) {
        stream.close();
        setProgressStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }
    });
  }, [uploads]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      progressStreams.forEach(stream => stream.close());
    };
  }, []);

  /**
   * 업로드 상태에 따른 배지 스타일 클래스 반환 함수
   * @param status - 업로드 상태 문자열
   * @returns 상태에 맞는 Tailwind CSS 클래스 문자열
   */
  const getBadgeClasses = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * 날짜 문자열을 한국어 형식으로 포맷팅하는 함수
   * @param dateString - ISO 날짜 문자열
   * @returns 한국어 로케일로 포맷된 날짜 및 시간 문자열
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="youtube-manager">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">YouTube Manager</h2>
            <p className="text-gray-600 mt-1">Manage YouTube uploads and channel settings</p>
          </div>
          <div className="flex gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Schedule Upload
              </button>
            )}
            <button
              onClick={loadUploads}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Authentication Section */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">YouTube Authentication Required</h3>
            <p className="text-yellow-700 mb-4">
              To upload videos to YouTube, you need to authenticate with your Google account.
            </p>
            
            {authUrl && (
              <div className="space-y-3">
                <div>
                  <button
                    onClick={() => window.open(authUrl, '_blank')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    Authorize with Google
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="Enter authorization code here"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAuthCallback}
                    disabled={!authCode.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:bg-gray-400"
                  >
                    Connect
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Channel Statistics */}
        {channelStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-lg font-bold text-red-600">{channelStats.channel.title}</div>
              <div className="text-sm text-gray-600">Channel</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-lg font-bold text-blue-600">
                {parseInt(channelStats.channel.subscriberCount).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Subscribers</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-lg font-bold text-green-600">
                {parseInt(channelStats.channel.viewCount).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-bold text-gray-900">
                {channelStats.quotaUsage.remaining.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">API Quota Remaining</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="uploading">Uploading</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Uploads List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No uploads found.
            </div>
          ) : (
            uploads.map((upload) => (
              <div
                key={upload.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  selectedUpload === upload.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedUpload(upload.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{upload.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses(upload.status)}`}>
                        {upload.status}
                      </span>
                      {upload.status === 'uploading' && progressStreams.has(upload.id) && (
                        <span className="text-xs text-blue-600 font-medium">
                          Live
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {upload.status === 'uploading' && (
                      <div className="mb-2">
                        <Progress value={upload.uploadProgress} className="mb-1" />
                        <div className="text-xs text-gray-600">
                          {upload.uploadProgress}% uploaded
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {upload.project && (
                        <div>Project: {upload.project.name}</div>
                      )}
                      <div>Privacy: {upload.privacy}</div>
                      <div>Scheduled: {formatDate(upload.scheduledAt)}</div>
                      {upload.youtubeVideoId && (
                        <div>
                          <a
                            href={`https://youtube.com/watch?v=${upload.youtubeVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View on YouTube
                          </a>
                        </div>
                      )}
                      {upload.error && (
                        <div className="text-red-600 font-medium">
                          Error: {upload.error}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(upload.status === 'scheduled' || upload.status === 'uploading') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelUpload(upload.id);
                        }}
                        className="px-3 py-1 text-sm text-red-600 border border-red-300 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Upload Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule YouTube Upload</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={newUpload.projectId}
                  onChange={(e) => setNewUpload(prev => ({ ...prev, projectId: e.target.value }))}
                  placeholder="Enter project ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newUpload.title}
                  onChange={(e) => setNewUpload(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Video title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newUpload.description}
                  onChange={(e) => setNewUpload(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Video description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newUpload.tags}
                  onChange={(e) => setNewUpload(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Privacy
                </label>
                <select
                  value={newUpload.privacy}
                  onChange={(e) => setNewUpload(prev => ({ ...prev, privacy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={newUpload.scheduledAt}
                  onChange={(e) => setNewUpload(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={scheduleUpload}
                disabled={!newUpload.title.trim() || !newUpload.projectId.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:bg-gray-400"
              >
                Schedule Upload
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};