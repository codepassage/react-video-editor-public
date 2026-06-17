/**
 * 렌더링 모니터 컴포넌트
 * @description 비디오 렌더링 작업의 실시간 모니터링 및 관리를 담당하는 컴포넌트
 * 
 * 주요 기능:
 * - 렌더링 작업 대기열 상태 실시간 모니터링
 * - 진행 중인 렌더링 작업의 실시간 진행률 표시
 * - 렌더링 작업 취소 및 완료된 결과물 다운로드
 * - 작업 상태별 필터링 (pending, processing, completed, failed)
 * - Server-Sent Events(SSE)를 통한 실시간 진행률 업데이트
 * 
 * 워크플로우:
 * 1. 대기열 통계 정보 표시 (waiting, active, completed, failed, total)
 * 2. 렌더링 작업 목록 조회 및 필터링
 * 3. 진행 중인 작업에 대한 실시간 진행률 스트리밍
 * 4. 작업 취소 및 결과물 다운로드 기능
 * 
 * 사용 사례:
 * - 대량 비디오 렌더링 작업 모니터링
 * - 렌더링 작업 상태 실시간 추적
 * - 렌더링 성능 및 처리 시간 분석
 */

import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../../utils/globalAlert';
import { Progress } from '../../../components/Progress';
import { getApiUrl } from '../../../utils/urlBuilder';

/**
 * 렌더링 작업 데이터 구조
 * @interface RenderJob
 */
interface RenderJob {
  /** 렌더링 작업 고유 식별자 */
  id: string;
  /** 연결된 프로젝트 ID */
  projectId: string;
  /** 현재 작업 상태 (pending, processing, completed, failed) */
  status: string;
  /** 렌더링 진행률 (0-100) */
  progress: number;
  /** 출력 파일 경로 (완료 시) */
  outputPath?: string;
  /** 렌더링 메타데이터 (품질, CRF, 파일 크기 등) */
  metadata?: any;
  /** 오류 메시지 (실패 시) */
  error?: string;
  /** 렌더링 시작 시각 */
  startedAt?: string;
  /** 렌더링 완료 시각 */
  completedAt?: string;
  /** 작업 생성 시각 */
  createdAt: string;
  /** 연결된 프로젝트 정보 (선택사항) */
  project?: {
    name: string;
    status: string;
    template?: {
      name: string;
    };
  };
}

/**
 * 렌더링 대기열 통계 데이터 구조
 * @interface RenderQueueStats
 */
interface RenderQueueStats {
  /** 대기 중인 작업 수 */
  waiting: number;
  /** 진행 중인 작업 수 */
  active: number;
  /** 완료된 작업 수 */
  completed: number;
  /** 실패한 작업 수 */
  failed: number;
  /** 전체 작업 수 */
  total: number;
}

/**
 * 렌더링 모니터 컴포넌트
 * 
 * 비디오 렌더링 작업의 전체 라이프사이클을 실시간으로 모니터링하고 관리합니다.
 * 대기열 통계, 진행률 스트리밍, 작업 취소 등의 기능을 제공합니다.
 * 
 * @returns 렌더링 모니터 UI 컴포넌트
 */
export const RenderMonitor: React.FC = () => {
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [queueStats, setQueueStats] = useState<RenderQueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [progressStreams, setProgressStreams] = useState<Map<string, EventSource>>(new Map());

  /**
   * 렌더링 작업 목록 로드 함수
   * @description 서버에서 렌더링 작업 목록을 조회하고 필터링 조건에 따라 결과를 제한
   * @note 최대 50개 작업까지 조회 가능
   */
  const loadRenderJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      params.append('limit', '50');

      const response = await fetch(`${getApiUrl()}/api/render-jobs?${params}`);
      const data = await response.json();

      if (data.success) {
        setRenderJobs(data.data);
      } else {
        setError(data.error || 'Failed to load render jobs');
      }
    } catch (err) {
      setError('Network error while loading render jobs');
      console.error('Error loading render jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 렌더링 대기열 통계 정보 로드 함수
   * @description 대기열의 상태별 작업 수를 조회하여 대시보드에 표시
   */
  const loadQueueStats = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/render-queue/stats`);
      const data = await response.json();
      if (data.success) {
        setQueueStats(data.data);
      }
    } catch (err) {
      console.error('Error loading queue stats:', err);
    }
  };

  /**
   * 진행 중인 작업의 실시간 진행률 구독 함수
   * @param jobId - 구독할 렌더링 작업의 고유 식별자
   * @description Server-Sent Events(SSE)를 사용하여 실시간 진행률 업데이트를 수신
   */
  const subscribeToProgress = (jobId: string) => {
    if (progressStreams.has(jobId)) {
      return; // Already subscribed
    }

    const eventSource = new EventSource(`${getApiUrl()}/api/render-jobs/${jobId}/progress`);
    
    eventSource.onmessage = (event) => {
      try {
        const progressData = JSON.parse(event.data);
        
        setRenderJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, ...progressData }
            : job
        ));
      } catch (err) {
        console.error('Error parsing progress data:', err);
      }
    };

    eventSource.onerror = () => {
      console.log(`Progress stream ended for job ${jobId}`);
      eventSource.close();
      setProgressStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(jobId);
        return newMap;
      });
    };

    setProgressStreams(prev => new Map(prev.set(jobId, eventSource)));
  };

  /**
   * 렌더링 작업 취소 함수
   * @param jobId - 취소할 렌더링 작업의 고유 식별자
   * @description 사용자 확인 후 진행 중인 렌더링 작업을 취소하고 목록을 새로고침
   */
  const cancelJob = async (jobId: string) => {
    if (!(await globalAlert.confirm('Are you sure you want to cancel this render job?'))) {
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/render-jobs/${jobId}/cancel`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        loadRenderJobs();
        loadQueueStats();
      } else {
        setError(data.error || 'Failed to cancel job');
      }
    } catch (err) {
      setError('Network error while cancelling job');
      console.error('Error cancelling job:', err);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadRenderJobs();
    loadQueueStats();

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadRenderJobs();
      loadQueueStats();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [filterStatus, autoRefresh]);

  // Subscribe to progress for processing jobs
  useEffect(() => {
    const processingJobs = renderJobs.filter(job => job.status === 'processing');
    
    processingJobs.forEach(job => {
      subscribeToProgress(job.id);
    });

    // Clean up closed streams
    const activeJobIds = new Set(processingJobs.map(job => job.id));
    progressStreams.forEach((stream, jobId) => {
      if (!activeJobIds.has(jobId)) {
        stream.close();
        setProgressStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(jobId);
          return newMap;
        });
      }
    });
  }, [renderJobs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      progressStreams.forEach(stream => stream.close());
    };
  }, []);

  /**
   * 렌더링 작업 상태에 따른 배지 스타일 클래스 반환 함수
   * @param status - 렌더링 작업 상태 문자열
   * @returns 상태에 맞는 Tailwind CSS 클래스 문자열
   */
  const getBadgeClasses = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * 날짜 문자열을 한국어 형식으로 포맷팅하는 함수
   * @param dateString - ISO 날짜 문자열
   * @returns 한국어 로케일로 포맷된 날짜 문자열 (월-일 시:분)
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * 렌더링 작업 소요 시간을 포맷팅하는 함수
   * @param startTime - 시작 시각 (선택사항)
   * @param endTime - 종료 시각 (선택사항, 미제공 시 현재 시각 사용)
   * @returns 포맷된 소요 시간 문자열 (예: "5m 30s", "45s")
   */
  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return 'Not started';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds}s`;
    }
    return `${diffSeconds}s`;
  };

  return (
    <div className="render-monitor">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Render Monitor</h2>
            <p className="text-gray-600 mt-1">Monitor video rendering jobs and queue status</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                autoRefresh 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={() => {
                loadRenderJobs();
                loadQueueStats();
              }}
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

        {/* Queue Statistics */}
        {queueStats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{queueStats.waiting}</div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{queueStats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{queueStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Render Jobs List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : renderJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No render jobs found.
            </div>
          ) : (
            renderJobs.map((job) => (
              <div
                key={job.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  selectedJob === job.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedJob(job.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {job.project?.name || `Job ${job.id.slice(-8)}`}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses(job.status)}`}>
                        {job.status}
                      </span>
                      {job.status === 'processing' && progressStreams.has(job.id) && (
                        <span className="text-xs text-blue-600 font-medium">
                          Live
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {(job.status === 'processing' || job.status === 'completed') && (
                      <div className="mb-2">
                        <Progress value={job.progress} className="mb-1" />
                        <div className="text-xs text-gray-600">
                          {job.progress}% complete
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {job.project?.template && (
                        <div>Template: {job.project.template.name}</div>
                      )}
                      <div>Created: {formatDate(job.createdAt)}</div>
                      {job.startedAt && (
                        <div>
                          Duration: {formatDuration(job.startedAt, job.completedAt)}
                        </div>
                      )}
                      {job.error && (
                        <div className="text-red-600 font-medium">
                          Error: {job.error}
                        </div>
                      )}
                      {job.metadata && (
                        <div className="text-xs text-gray-500">
                          Quality: {job.metadata.quality}, 
                          CRF: {job.metadata.crf}
                          {job.metadata.fileSize && (
                            <>, Size: {(job.metadata.fileSize / 1024 / 1024).toFixed(1)}MB</>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {job.status === 'processing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelJob(job.id);
                        }}
                        className="px-3 py-1 text-sm text-red-600 border border-red-300 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {job.outputPath && job.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/renders/${job.outputPath.split('/').pop()}`, '_blank');
                        }}
                        className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};