// Auto Generation Types for Server
// This mirrors the client-side types for consistency

export interface DynamicProperty {
  property_name: string;
  source_data_type: string;
}

export type SourceDataType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface SourceData {
  type: 'text' | 'image' | 'video' | 'audio' | 'long-sentence';
  text?: string;
  url?: string;
  language?: string;
  voice?: string;
  speakingRate?: number;
  items?: LongSentenceItem[];
}

export interface LongSentenceItem {
  text: string;
  mediaUrl: string;
  [key: string]: any; // 추가 속성 지원
}

export interface ResourceItem {
  name: string;
  data?: SourceData;
  isIterator?: boolean;
  containers?: Container[];
  subordinateItems?: string[];
  
  // 중첩 번들 시스템 확장 (v2)
  templateGroupId?: string;
  bundleId?: string;
  nestingLevel?: number;
  parentContainerId?: string;
  metadata?: ResourceItemMetadata;
}

export interface ResourceItemMetadata {
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  isProtected?: boolean;
  originalId?: string;
}

export interface Container {
  id?: string;
  items: ResourceItem[];
  parentId?: string;
  nestingLevel?: number;
  metadata?: ContainerMetadata;
}

export interface ContainerMetadata {
  createdAt?: string;
  iterationIndex?: number;
  isExpanded?: boolean;
  hasErrors?: boolean;
}

export interface ResourceData {
  items: ResourceItem[];
  version?: string;
  metadata?: ResourceMetadata;
}

export interface ResourceMetadata {
  createdAt?: string;
  updatedAt?: string;
  maxNestingDepth?: number;
  hasNestedStructure?: boolean;
}

export interface TransformResult {
  success: boolean;
  transformedData?: any;
  ttsFiles?: Record<string, string>;
  error?: string;
  warnings?: string[];
  statistics?: TransformStatistics;
  metadata?: {
    processedAt: string;
    processingTime: number;
    ttsGeneratedCount: number;
    clipsTransformed: number;
  };
}

export interface TransformStatistics {
  totalClips: number;
  ttsGenerated: number;
  bundlesProcessed: number;
  templateGroupsProcessed: number;
  nestingLevels: number[];
  processingTime: number;
}

export interface TTSRequest {
  text: string;
  language: string;
  voice?: string;
  speakingRate?: number;
}

export interface TTSResult {
  url: string;
  duration: number;
  cached: boolean;
  fileSize?: number;
}

export interface RenderOptions {
  outputFormat?: 'mp4' | 'webm';
  quality?: 'low' | 'medium' | 'high';
  validateMedia?: boolean;
}

export class AutoGenerationError extends Error {
  public readonly code: ErrorCode;
  
  constructor(message: string, code: ErrorCode = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'AutoGenerationError';
    this.code = code;
  }
}

export type ErrorCode = 
  | 'TEMPLATE_ANALYSIS_FAILED'
  | 'RESOURCE_MATCHING_FAILED'
  | 'TTS_GENERATION_FAILED'
  | 'TRANSFORM_FAILED'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN_ERROR'
  // 중첩 구조 관련 오류 (v2)
  | 'NESTING_DEPTH_EXCEEDED'
  | 'CIRCULAR_REFERENCE_DETECTED'
  | 'TEMPLATE_GROUP_NOT_FOUND'
  | 'INVALID_NESTING_STRUCTURE'
  | 'CONTAINER_VALIDATION_FAILED'
  | 'RESOURCE_INVALID';

// 중첩 구조 검증 (v2)
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  statistics: ValidationStatistics;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  details?: any;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  severity: "low" | "medium" | "high";
}

export interface ValidationStatistics {
  totalItems: number;
  totalContainers: number;
  maxDepthFound: number;
  circularReferences: number;
  orphanedItems: number;
}

export interface NestedStructureConfig {
  maxNestingDepth: number;
  enableCircularReferenceCheck: boolean;
  enableDepthValidation: boolean;
  enableOrphanDetection: boolean;
  strictMode: boolean;
}

// Template structure analysis
export interface TemplateStructure {
  clips: AnalyzedClip[];
  bundles: AnalyzedBundle[];
  templateGroups?: AnalyzedTemplateGroup[]; // v2
  totalDuration: number;
  hasBaseTracks: boolean;
  hasDynamicProperties: boolean;
}

export interface AnalyzedClip {
  id: string;
  name: string;
  mediaType: string;
  trackId: string;
  trackName: string;
  startTime: number;
  endTime: number;
  duration: number;
  isBaseClip: boolean;
  dynamicProperties: DynamicProperty[];
  hasDynamicProperties: boolean;
  subordinateClipIds?: string[];
}

export interface AnalyzedBundle {
  id: string;
  name: string;
  baseClipIds: string[];
  startTime: number;
  endTime: number;
  duration: number;
  clipCount: number;
  isIterator: boolean;
}

export interface AnalyzedTemplateGroup {
  id: string;
  name: string;
  clipIds: string[];
  bundleMappings: any[];
  originalBundles: any[];
}

// Cache related types
export interface CacheEntry {
  filePath: string;
  url: string;
  duration: number;
  fileSize: number;
  createdAt: Date;
  lastAccessed: Date;
  hash: string;
}

export interface CacheStats {
  fileCount: number;
  totalSize: number;
  oldestFile?: Date;
  newestFile?: Date;
  totalDuration: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface TransformApiResponse extends ApiResponse<TransformResult> {
  processingTime?: number;
}

export interface TTSApiResponse extends ApiResponse<TTSResult> {
  cached?: boolean;
}

export interface RenderApiResponse extends ApiResponse {
  jobId?: string;
  estimatedDuration?: number;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
}