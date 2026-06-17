/**
 * 🉰 autoGeneration.ts - 자동 동영상 생성 타입 정의
 * 
 * CSV 데이터로부터 자동으로 비디오를 생성하기 위한 모든 타입 정의를
 * 포함하는 파일입니다. 리소스 데이터 구조, 중첩 데이터 처리,
 * 메타데이터 관리 등 자동 생성 시스템의 핵심 데이터 모델을 정의합니다.
 * 
 * 주요 기능:
 * - CSV 데이터를 비디오 클립으로 변환하는 데이터 모델
 * - 중첩 데이터 구조 지원 (containers)
 * - 다양한 미디어 타입 사용 (text, video, audio, image 등)
 * - 템플릿 기반 비디오 생성 지원
 * - 데이터 버전 관리 및 마이그레이션
 * - 메타데이터 자동 추출 및 관리
 * 
 * 데이터 학습:
 * - CSV 파일의 각 행이 ResourceItem으로 변환
 * - 중첩 구조는 containers 배열로 처리
 * - 각 아이템이 비디오 클립으로 생성됨
 * - duration, media, properties 등 클립 생성에 필요한 모든 정보 포함
 * 
 * 중첩 데이터 예시:
 * 마켓팅 콘텐츠에서 섹션별로 그룹화된 데이터나
 * 대화형 비디오에서 대화별로 그룹화된 데이터 처리
 * 
 * 관련 모듈:
 * - 6번 모듈: Auto Generation System (전체 자동 생성 시스템)
 * - 4번 모듈: Long Sentence Engine (텍스트 처리 연동)
 * - DataEditor 컴포넌트: UI에서 데이터 편집
 * - NestedContainer 컴포넌트: 중첩 데이터 시각화
 */

// 리소스 데이터 타입
export interface ResourceData {
  items: ResourceItem[];
  version?: string; // 데이터 버전 (v1, v2 등)
  metadata?: ResourceMetadata;
}

// 리소스 메타데이터
export interface ResourceMetadata {
  createdAt?: string;
  updatedAt?: string;
  maxNestingDepth?: number; // 최대 중첩 깊이
  hasNestedStructure?: boolean; // 중첩 구조 포함 여부
}

// 개별 리소스 아이템
export interface ResourceItem {
  name: string; // 클립/템플릿/번들 이름
  data?: {
    type: "text" | "image" | "video";
    text?: string;
    language?: string; // TTS용 언어 코드 (예: "ko", "en")
    url?: string; // 이미지/비디오 URL
  };
  subordinateItems?: string[]; // 종속 클립 이름들
  isIterator?: boolean; // 반복 가능 여부
  containers?: Container[]; // 반복될 데이터 배열
  
  // 중첩 번들 시스템 확장 (v2)
  templateGroupId?: string; // 템플릿 그룹 ID
  bundleId?: string; // 번들 ID
  nestingLevel?: number; // 중첩 깊이 (0부터 시작)
  parentContainerId?: string; // 부모 컨테이너 ID
  metadata?: ResourceItemMetadata; // 아이템 메타데이터
}

// 리소스 아이템 메타데이터
export interface ResourceItemMetadata {
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  isProtected?: boolean; // 보호된 아이템 (삭제/수정 제한)
  originalId?: string; // 원본 템플릿에서의 ID
}

// 컨테이너 (번들/템플릿 반복용)
export interface Container {
  id?: string; // 컨테이너 고유 ID (v2)
  items: ResourceItem[];
  parentId?: string; // 부모 컨테이너 ID (v2)
  nestingLevel?: number; // 현재 중첩 레벨 (v2)
  metadata?: ContainerMetadata; // 컨테이너 메타데이터 (v2)
}

// 컨테이너 메타데이터
export interface ContainerMetadata {
  createdAt?: string;
  iterationIndex?: number; // 반복 순서 인덱스
  isExpanded?: boolean; // UI에서 확장 상태
  hasErrors?: boolean; // 검증 오류 여부
}

// 변환 결과
export interface TransformResult {
  success: boolean;
  error?: string;
  transformedData?: any; // 변환된 프로젝트 데이터
  ttsFiles?: { [key: string]: string }; // 생성된 TTS 파일 매핑
  statistics?: TransformStatistics; // 변환 통계 (v2)
}

// 변환 통계
export interface TransformStatistics {
  totalClips: number;
  ttsGenerated: number;
  bundlesProcessed: number;
  templateGroupsProcessed: number; // v2
  nestingLevels: number[]; // 사용된 중첩 레벨들 v2
  processingTime: number; // 처리 시간 (ms) v2
}

// TTS 생성 결과
export interface TTSResult {
  url: string; // 생성된 오디오 파일 경로
  duration: number; // 재생 시간 (초)
  cached: boolean; // 캐시된 파일 사용 여부
}

// 템플릿 구조 분석 결과
export interface TemplateStructure {
  clips: ClipInfo[];
  bundles: BundleInfo[];
  templateGroups: TemplateGroupInfo[];
}

// 클립 정보
export interface ClipInfo {
  id: string;
  name: string;
  type: string;
  trackId: string;
  hasDynamicProperties: boolean;
  subordinates?: string[]; // 이 클립에 종속된 클립들
}

// 번들 정보
export interface BundleInfo {
  id: string;
  name: string;
  clipIds: string[];
  startTime: number;
  endTime: number;
}

// 템플릿 그룹 정보
export interface TemplateGroupInfo {
  id: string;
  name: string;
  clipIds: string[];
}

// 매칭 결과
export interface MatchResult {
  matched: MatchedItem[];
  unmatched: UnmatchedItem[];
  errors: string[];
}

// 매칭된 아이템
export interface MatchedItem {
  clipId: string;
  clipName: string;
  resourceItem: ResourceItem;
}

// 매칭되지 않은 아이템
export interface UnmatchedItem {
  type: "clip" | "resource";
  name: string;
  reason: string;
}

// 렌더링 옵션
export interface RenderOptions {
  outputFormat: "mp4" | "webm";
  quality?: "low" | "medium" | "high";
  validateMedia?: boolean; // 미디어 파일 검증 여부
}

// 렌더링 작업 상태
export interface RenderJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number; // 0-100
  error?: string;
  resultUrl?: string; // 완료된 동영상 URL
  createdAt: Date;
  updatedAt: Date;
}

// API 응답 타입들
export interface TransformResponse {
  success: boolean;
  resultId?: string;
  preview?: any; // 변환된 데이터 미리보기
  error?: string;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

export interface RenderResponse {
  success: boolean;
  jobId?: string;
  error?: string;
}

// 유틸리티 타입
export type MediaType = "audio" | "video" | "image" | "text" | "sentence" | "shape" | "simpleShape" | "polygonShape";

// 에러 타입
export class AutoGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "AutoGenerationError";
  }
}

// 중첩 구조 검증 결과 (v2)
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  statistics: ValidationStatistics;
}

// 검증 오류
export interface ValidationError {
  code: string;
  message: string;
  path: string; // 오류 발생 경로 (예: "items[0].containers[1].items[2]")
  details?: any;
}

// 검증 경고
export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  severity: "low" | "medium" | "high";
}

// 검증 통계
export interface ValidationStatistics {
  totalItems: number;
  totalContainers: number;
  maxDepthFound: number;
  circularReferences: number;
  orphanedItems: number;
}

// 중첩 구조 설정 (v2)
export interface NestedStructureConfig {
  maxNestingDepth: number; // 기본값: 3
  enableCircularReferenceCheck: boolean; // 기본값: true
  enableDepthValidation: boolean; // 기본값: true
  enableOrphanDetection: boolean; // 기본값: true
  strictMode: boolean; // 엄격한 검증 모드
}

// 에러 코드
export enum ErrorCode {
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  RESOURCE_INVALID = "RESOURCE_INVALID",
  TTS_FAILED = "TTS_FAILED",
  CLIP_NOT_FOUND = "CLIP_NOT_FOUND",
  TRANSFORM_FAILED = "TRANSFORM_FAILED",
  RENDER_FAILED = "RENDER_FAILED",
  MEDIA_VALIDATION_FAILED = "MEDIA_VALIDATION_FAILED",
  
  // 중첩 구조 관련 오류 (v2)
  NESTING_DEPTH_EXCEEDED = "NESTING_DEPTH_EXCEEDED",
  CIRCULAR_REFERENCE_DETECTED = "CIRCULAR_REFERENCE_DETECTED",
  TEMPLATE_GROUP_NOT_FOUND = "TEMPLATE_GROUP_NOT_FOUND",
  INVALID_NESTING_STRUCTURE = "INVALID_NESTING_STRUCTURE",
  CONTAINER_VALIDATION_FAILED = "CONTAINER_VALIDATION_FAILED"
}