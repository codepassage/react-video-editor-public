/**
 * 자동 생성 프로젝트 관리 컴포넌트
 * @description 비디오 자동 생성 프로젝트의 전체 라이프사이클을 관리하는 중앙 집중식 컴포넌트
 * 
 * 주요 기능:
 * - 프로젝트 생성, 조회, 삭제 및 상태 관리
 * - 프로젝트 진행 상태별 통계 대시보드 (Draft, Transformed, Rendering, Completed, Failed)
 * - 템플릿, 리소스, CSV 맵 연결 관리
 * - 실시간 프로젝트 상태 모니터링 및 필터링
 * - 프로젝트 메타데이터 및 변환 결과 추적
 * 
 * 워크플로우:
 * 1. Draft - 프로젝트 생성 및 초기 설정
 * 2. Transformed - 템플릿과 리소스 데이터 결합 완료
 * 3. Rendering - 비디오 렌더링 진행 중
 * 4. Completed - 최종 완료
 * 5. Failed - 오류 발생
 * 
 * 사용 사례:
 * - 대량 비디오 생성 캠페인 관리
 * - 템플릿 기반 자동화 워크플로우 모니터링
 * - 프로젝트별 성과 분석 및 추적
 */

import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../../utils/globalAlert';
import { getApiUrl } from '../../../utils/urlBuilder';

/**
 * 자동 생성 프로젝트 데이터 구조
 * @interface AutoGenProject
 */
interface AutoGenProject {
  /** 프로젝트 고유 식별자 */
  id: string;
  /** 프로젝트 이름 */
  name: string;
  /** 현재 프로젝트 상태 (draft, transformed, rendering, completed, failed) */
  status: string;
  /** 연결된 템플릿 ID (선택사항) */
  templateId?: string;
  /** 연결된 리소스 데이터 ID (선택사항) */
  resourceId?: string;
  /** 연결된 CSV 맵 ID (선택사항) */
  csvMapId?: string;
  /** 데이터 변환 결과 (선택사항) */
  transformResult?: any;
  /** 프로젝트 생성 시각 */
  createdAt: string;
  /** 프로젝트 최종 수정 시각 */
  updatedAt: string;
  /** 연결된 템플릿 정보 (선택사항) */
  template?: {
    name: string;
  };
  /** 연결된 리소스 정보 (선택사항) */
  resource?: {
    name: string;
  };
  /** 연결된 CSV 맵 정보 (선택사항) */
  csvMap?: {
    name: string;
  };
}

/**
 * 프로젝트 통계 데이터 구조
 * @interface ProjectStats
 */
interface ProjectStats {
  /** 전체 프로젝트 수 */
  total: number;
  /** 초안 상태 프로젝트 수 */
  draft: number;
  /** 변환 완료 프로젝트 수 */
  transformed: number;
  /** 렌더링 중 프로젝트 수 */
  rendering: number;
  /** 완료된 프로젝트 수 */
  completed: number;
  /** 실패한 프로젝트 수 */
  failed: number;
}

/**
 * 자동 생성 프로젝트 관리 컴포넌트
 * 
 * 프로젝트의 전체 라이프사이클을 관리하는 중앙 허브 역할을 수행합니다.
 * 대시보드 형태의 통계 정보와 함께 프로젝트 생성, 모니터링, 삭제 기능을 제공합니다.
 * 
 * @returns 프로젝트 관리 UI 컴포넌트
 */
export const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<AutoGenProject[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    templateId: '',
    resourceId: '',
    csvMapId: ''
  });

  /**
   * 프로젝트 목록 로드 함수
   * @description 서버에서 프로젝트 목록을 조회하고 필터링 조건에 따라 결과를 제한
   * @note 최대 50개 프로젝트까지 조회 가능
   */
  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      params.append('limit', '50');

      const response = await fetch(`${getApiUrl()}/api/auto-gen/projects?${params}`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.data);
      } else {
        setError(data.error || 'Failed to load projects');
      }
    } catch (err) {
      setError('Network error while loading projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 프로젝트 통계 정보 로드 함수
   * @description 프로젝트 상태별 집계 데이터를 조회하여 대시보드에 표시
   */
  const loadStats = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/auto-gen/projects/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error loading project stats:', err);
    }
  };

  /**
   * 새 프로젝트 생성 함수
   * @description 사용자 입력을 검증하고 새 프로젝트를 서버에 생성
   * @note 프로젝트 이름은 필수, 템플릿/리소스/CSV 맵은 선택사항
   */
  const createProject = async () => {
    if (!newProject.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auto-gen/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProject)
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewProject({
          name: '',
          templateId: '',
          resourceId: '',
          csvMapId: ''
        });
        loadProjects();
        loadStats();
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch (err) {
      setError('Network error while creating project');
    }
  };

  /**
   * 프로젝트 삭제 함수
   * @param projectId - 삭제할 프로젝트의 고유 식별자
   * @description 사용자 확인 후 프로젝트를 영구 삭제하고 목록을 새로고침
   */
  const deleteProject = async (projectId: string) => {
    if (!(await globalAlert.confirm('Are you sure you want to delete this project?'))) {
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auto-gen/projects/${projectId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        loadProjects();
        loadStats();
      } else {
        setError(data.error || 'Failed to delete project');
      }
    } catch (err) {
      setError('Network error while deleting project');
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadProjects();
    loadStats();
  }, [filterStatus]);

  /**
   * 프로젝트 상태에 따른 배지 스타일 클래스 반환 함수
   * @param status - 프로젝트 상태 문자열
   * @returns 상태에 맞는 Tailwind CSS 클래스 문자열
   */
  const getBadgeClasses = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'transformed': return 'bg-blue-100 text-blue-800';
      case 'rendering': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * 날짜 문자열을 한국어 형식으로 포맷팅하는 함수
   * @param dateString - ISO 날짜 문자열
   * @returns 한국어 로케일로 포맷된 날짜 문자열 (년-월-일 시:분)
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
    <div className="project-manager">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Manager</h2>
            <p className="text-gray-600 mt-1">Manage auto-generation projects and workflows</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              New Project
            </button>
            <button
              onClick={() => {
                loadProjects();
                loadStats();
              }}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
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

        {/* Project Statistics */}
        {stats && (
          <div className="grid grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-600">Draft</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.transformed}</div>
              <div className="text-sm text-gray-600">Transformed</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.rendering}</div>
              <div className="text-sm text-gray-600">Rendering</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
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
            <option value="draft">Draft</option>
            <option value="transformed">Transformed</option>
            <option value="rendering">Rendering</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Projects List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No projects found.
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  selectedProject === project.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedProject(project.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {project.template && (
                        <div>Template: {project.template.name}</div>
                      )}
                      {project.resource && (
                        <div>Resource: {project.resource.name}</div>
                      )}
                      {project.csvMap && (
                        <div>CSV Map: {project.csvMap.name}</div>
                      )}
                      <div>Created: {formatDate(project.createdAt)}</div>
                      <div>Updated: {formatDate(project.updatedAt)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newProject.templateId}
                    onChange={(e) => setNewProject(prev => ({ ...prev, templateId: e.target.value }))}
                    placeholder="Template ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newProject.resourceId}
                    onChange={(e) => setNewProject(prev => ({ ...prev, resourceId: e.target.value }))}
                    placeholder="Resource ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CSV Map ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newProject.csvMapId}
                    onChange={(e) => setNewProject(prev => ({ ...prev, csvMapId: e.target.value }))}
                    placeholder="CSV Map ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={!newProject.name.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-gray-400"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};