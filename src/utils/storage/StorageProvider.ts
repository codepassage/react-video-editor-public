import { UnifiedProjectData } from '../unifiedProjectManager';

/**
 * Storage abstraction interface
 * Unified interface for file, server, cloud storage
 */
export interface StorageProvider {
  /**
   * Save project data
   */
  save(data: UnifiedProjectData, options?: SaveOptions): Promise<SaveResult>;
  
  /**
   * Load project data
   */
  load(identifier: string): Promise<UnifiedProjectData>;
  
  /**
   * List saved projects
   */
  list(): Promise<StorageItem[]>;
  
  /**
   * Delete project
   */
  delete(identifier: string): Promise<void>;
}

/**
 * Save options
 */
export interface SaveOptions {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Save result
 */
export interface SaveResult {
  id: string;
  name: string;
  savedAt: string;
  location?: string;
}

/**
 * Storage item info
 */
export interface StorageItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

/**
 * Load options
 */
export interface LoadOptions {
  regenerateIds?: boolean;
  preserveExisting?: boolean;
  insertMode?: 'replace' | 'push' | 'overlay';
  insertTime?: number;
}

/**
 * Storage error class
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage error codes
 */
export enum StorageErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED', 
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION'
}
