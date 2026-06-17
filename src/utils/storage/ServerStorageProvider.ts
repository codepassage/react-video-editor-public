import axios from 'axios';
import {
  StorageProvider,
  SaveOptions,
  SaveResult,
  StorageItem,
  StorageError,
  StorageErrorCode
} from './StorageProvider';
import { UnifiedProjectData, UnifiedProjectManager } from '../unifiedProjectManager';

/**
 * Server-based storage implementation
 * Saves projects/templates to server via REST API
 */
export class ServerStorageProvider implements StorageProvider {

  constructor(private apiUrl: string) {
    // console.log('Server Storage initialized:', apiUrl);
  }

  /**
   * Save project/template to server
   */
  async save(data: UnifiedProjectData, options?: SaveOptions): Promise<SaveResult> {
    try {
      console.log('Server Storage: Save project started', {
        apiUrl: this.apiUrl,
        dataType: data.metadata.type,
        name: options?.name || data.metadata.name
      });

      // Validate data
      const validation = UnifiedProjectManager.validateData(data);
      if (!validation.isValid) {
        throw new StorageError(
          `Data validation failed: ${validation.errors.join(', ')}`,
          StorageErrorCode.VALIDATION_ERROR,
          validation.errors
        );
      }

      // Prepare API request data
      const requestData = {
        name: options?.name || data.metadata.name || 'Untitled',
        description: options?.description || data.metadata.description || '',
        tracks: data.tracks,
        projectSettings: data.projectSettings,
        bundles: data.bundles || [],
        templateGroups: data.templateGroups || [],
        metadata: {
          ...data.metadata,
          ...options?.metadata
        }
      };

      console.log('Server Storage: Sending API request', {
        endpoint: `${this.apiUrl}/api/templates`,
        dataSize: {
          tracks: requestData.tracks.length,
          bundles: requestData.bundles.length,
          templateGroups: requestData.templateGroups.length
        }
      });

      // Call server API
      const response = await axios.post(`${this.apiUrl}/api/templates`, requestData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.success) {
        throw new StorageError(
          response.data.error || 'Server rejected save request',
          StorageErrorCode.VALIDATION_ERROR,
          response.data
        );
      }

      const result: SaveResult = {
        id: response.data.template.id,
        name: response.data.template.name,
        savedAt: response.data.template.createdAt || new Date().toISOString(),
        location: `${this.apiUrl}/api/templates/${response.data.template.id}`
      };

      console.log('Server Storage: Save completed', result);
      return result;

    } catch (error) {
      console.error('Server Storage: Save failed', error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new StorageError(
            'Server response timeout',
            StorageErrorCode.NETWORK_ERROR
          );
        }

        if (error.response?.status === 413) {
          throw new StorageError(
            'Project size too large',
            StorageErrorCode.QUOTA_EXCEEDED
          );
        }

        if (error.response?.status === 403) {
          throw new StorageError(
            'Save permission denied',
            StorageErrorCode.PERMISSION_DENIED
          );
        }

        throw new StorageError(
          `Server error: ${error.response?.status || error.code}`,
          StorageErrorCode.NETWORK_ERROR,
          error.response?.data
        );
      }

      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError(
        'Unknown error during server save',
        StorageErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Load project/template from server
   */
  async load(identifier: string): Promise<UnifiedProjectData> {
    try {
      console.log('Server Storage: Load project started', {
        identifier: identifier.slice(-8),
        endpoint: `${this.apiUrl}/api/templates/${identifier}`
      });

      const response = await axios.get(`${this.apiUrl}/api/templates/${identifier}`, {
        timeout: 15000
      });

      if (!response.data.success) {
        throw new StorageError(
          response.data.error || 'Project not found',
          StorageErrorCode.NOT_FOUND,
          response.data
        );
      }

      const template = response.data.template;

      // Convert Template to UnifiedProjectData
      const unifiedData: UnifiedProjectData = {
        tracks: template.tracks,
        projectSettings: template.projectSettings,
        bundles: template.bundles || [],
        templateGroups: template.templateGroups || [],
        metadata: {
          exportedAt: template.updatedAt || template.createdAt,
          version: template.metadata?.version || '1.0.0',
          editorVersion: template.metadata?.editorVersion || 'unknown',
          type: 'template',
          name: template.name,
          description: template.description,
          templateId: template.id
        }
      };

      // Validate data
      const validation = UnifiedProjectManager.validateData(unifiedData);
      if (!validation.isValid) {
        console.warn('Server data validation warning:', validation.errors);
      }

      console.log('Server Storage: Load completed', {
        name: unifiedData.metadata.name,
        tracks: unifiedData.tracks.length,
        bundles: unifiedData.bundles?.length || 0,
        templateGroups: unifiedData.templateGroups?.length || 0
      });

      return unifiedData;

    } catch (error) {
      console.error('Server Storage: Load failed', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new StorageError(
            'Project not found',
            StorageErrorCode.NOT_FOUND
          );
        }

        if (error.response?.status === 403) {
          throw new StorageError(
            'Project access denied',
            StorageErrorCode.PERMISSION_DENIED
          );
        }

        throw new StorageError(
          `Server error: ${error.response?.status || error.code}`,
          StorageErrorCode.NETWORK_ERROR,
          error.response?.data
        );
      }

      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError(
        'Unknown error during server load',
        StorageErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * List projects/templates from server
   */
  async list(): Promise<StorageItem[]> {
    try {
      console.log('Server Storage: List projects started');

      const response = await axios.get(`${this.apiUrl}/api/templates`, {
        timeout: 10000
      });

      if (!response.data.success) {
        throw new StorageError(
          response.data.error || 'Failed to list projects',
          StorageErrorCode.NETWORK_ERROR,
          response.data
        );
      }

      const templates = response.data.templates;
      const items: StorageItem[] = templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        metadata: template.metadata || {}
      }));

      console.log('Server Storage: List completed', {
        count: items.length
      });

      return items;

    } catch (error) {
      console.error('Server Storage: List failed', error);

      if (axios.isAxiosError(error)) {
        throw new StorageError(
          `Server error: ${error.response?.status || error.code}`,
          StorageErrorCode.NETWORK_ERROR,
          error.response?.data
        );
      }

      throw new StorageError(
        'Unknown error during list operation',
        StorageErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Delete project/template from server
   */
  async delete(identifier: string): Promise<void> {
    try {
      console.log('Server Storage: Delete started', {
        identifier: identifier.slice(-8)
      });

      const response = await axios.delete(`${this.apiUrl}/api/templates/${identifier}`, {
        timeout: 10000
      });

      if (!response.data.success) {
        throw new StorageError(
          response.data.error || 'Delete failed',
          StorageErrorCode.NETWORK_ERROR,
          response.data
        );
      }

      console.log('Server Storage: Delete completed');

    } catch (error) {
      console.error('Server Storage: Delete failed', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new StorageError(
            'Project not found for deletion',
            StorageErrorCode.NOT_FOUND
          );
        }

        if (error.response?.status === 403) {
          throw new StorageError(
            'Delete permission denied',
            StorageErrorCode.PERMISSION_DENIED
          );
        }

        throw new StorageError(
          `Server error: ${error.response?.status || error.code}`,
          StorageErrorCode.NETWORK_ERROR,
          error.response?.data
        );
      }

      throw new StorageError(
        'Unknown error during delete operation',
        StorageErrorCode.NETWORK_ERROR,
        error
      );
    }
  }
}
