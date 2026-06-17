/**
 * 🌐 client.ts - API 클라이언트 및 서버 통신 레이어
 * 
 * React Video Editor의 전체 서버 통신을 처리하는 중앙화된 API 클라이언트입니다.
 * Axios 기반으로 구현되었으며, 파일 업로드, 프로젝트 관리, 렌더링 등
 * 모든 서버 기능에 대한 인터페이스를 제공합니다.
 * 
 * 주요 기능:
 * - 파일 업로드 (단일/다중, 진행률 추적)
 * - 프로젝트 CRUD 작업 (저장/로드/업데이트/삭제)
 * - 서버 상태 넷크 확인
 * - 파일 URL 관리 (상대경로 대 절대경로 변환)
 * - 에러 처리 및 네트워크 재시도 로직
 * 
 * 타임아웃 설정:
 * - 기본 30초 (30000ms)
 * - 렌더링 API는 15분 (900000ms)
 * 
 * 관련 모듈:
 * - 8번 모듈: State Management (서버 상태 연동)
 * - 9번 모듈: Template System (템플릿 저장/로드)
 * - 미디어 라이브러리: 파일 업로드 및 관리
 */
import axios from 'axios';
import { getApiUrl } from '../utils/urlBuilder';

// 🏠 API 기본 설정 및 인스턴스 생성
const API_BASE_URL = getApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🛡️ 전역 에러 처리 인터셉터
// 모든 API 응답에 대한 통일된 에러 처리 및 사용자 친화적 메시지 제공
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Error:', error.message, error.response?.status);
    
    if (error.response) {
      // 서버에서 응답이 왔지만 에러 상태 코드
      if (error.response.status === 404) {
        throw new Error(`404 Not Found: ${error.response.config.url}`);
      }
      throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
    } else if (error.request) {
      // 요청이 만들어졌지만 응답이 없음
      throw new Error('Network error - Please check if the server is running');
    } else {
      // 요청 설정 중 에러
      throw new Error('Request configuration error');
    }
  }
);

// 📝 TypeScript 타입 정의
// API 요청/응답에 사용되는 모든 데이터 구조를 타입 안전하게 정의
export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
  mediaType?: 'image' | 'video' | 'audio' | 'unknown';
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  fileName?: string;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project extends ProjectSummary {
  data: any; // 프로젝트 데이터 (타임라인 상태 등)
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// 📡 API 함수 컴렉션
// 서버와의 모든 통신을 처리하는 중앙화된 함수 모음
export const apiClient = {
  // 서버 상태 확인
  async checkHealth(): Promise<{ message: string; timestamp: string; version: string }> {
    const response = await api.get('/api/health');
    return response.data;
  },

  // 단일 파일 업로드
  async uploadFile(file: File, onProgress?: UploadProgressCallback): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
            fileName: file.name
          });
        }
      },
    });

    return response.data.file;
  },

  // 다중 파일 업로드
  async uploadFiles(files: File[], onProgress?: UploadProgressCallback): Promise<UploadedFile[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileNames = files.map(f => f.name).join(', ');

    const response = await api.post('/api/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
            fileName: fileNames
          });
        }
      },
    });

    return response.data.files;
  },

  // 프로젝트 저장
  async saveProject(name: string, data: any): Promise<ProjectSummary> {
    const response = await api.post('/api/projects', {
      name,
      data
    });

    return response.data.project;
  },

  // 프로젝트 목록 조회
  async getProjects(): Promise<ProjectSummary[]> {
    const response = await api.get('/api/projects');
    return response.data.projects;
  },

  // 프로젝트 로드
  async loadProject(projectId: string): Promise<Project> {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data.project;
  },

  // 프로젝트 업데이트
  async updateProject(projectId: string, name?: string, data?: any): Promise<ProjectSummary> {
    const response = await api.put(`/api/projects/${projectId}`, {
      name,
      data
    });

    return response.data.project;
  },

  // 프로젝트 삭제
  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/api/projects/${projectId}`);
  },

  // 파일 삭제
  async deleteFile(filename: string): Promise<void> {
    await api.delete(`/api/files/${filename}`);
  },

  // 상대 경로를 절대 URL로 변환
  getFileUrl(filename: string): string {
    return `${API_BASE_URL}/uploads/${filename}`;
  },

  // 상대 경로 생성 (저장용)
  getRelativePath(filename: string): string {
    return `/uploads/${filename}`;
  },

  // 상대 경로를 절대 URL로 변환 (표시용)
  resolveUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath; // 이미 절대 URL
    }
    return `${API_BASE_URL}${relativePath}`;
  },

  // 서버에 저장된 파일 목록 조회
  async getFiles(mediaType?: 'image' | 'video' | 'audio'): Promise<UploadedFile[]> {
    const params = mediaType ? { type: mediaType } : {};
    const response = await api.get('/api/files', { params });
    return response.data.files;
  }
};

// 🛠️ 유틸리티 함수 컴렉션
// 파일 크기 포매팅, 파일 타입 판별 등 보조 기능들
export const fileUtils = {
  // 파일 크기를 읽기 쉬운 형태로 변환
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 파일 타입 확인
  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  },

  isVideoFile(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  },

  isAudioFile(mimetype: string): boolean {
    return mimetype.startsWith('audio/');
  },

  // 미디어 타입 반환
  getMediaType(mimetype: string): 'image' | 'video' | 'audio' | 'unknown' {
    if (this.isImageFile(mimetype)) return 'image';
    if (this.isVideoFile(mimetype)) return 'video';
    if (this.isAudioFile(mimetype)) return 'audio';
    return 'unknown';
  }
};

export default apiClient;
