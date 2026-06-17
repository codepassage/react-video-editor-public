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
 * File-based storage implementation
 * Uses browser download/upload functionality
 */
export class FileStorageProvider implements StorageProvider {
  
  /**
   * Save project to file (download)
   */
  async save(data: UnifiedProjectData, options?: SaveOptions): Promise<SaveResult> {
    try {
      console.log('File Storage: Save project started', {
        dataType: data.metadata.type,
        name: options?.name || data.metadata.name
      });
      
      // Generate filename
      const filename = this.generateFilename(data, options);
      
      // Use UnifiedProjectManager download function
      UnifiedProjectManager.downloadAsJSON(data, filename);
      
      const result: SaveResult = {
        id: filename,
        name: options?.name || data.metadata.name || 'Untitled',
        savedAt: new Date().toISOString(),
        location: 'local-download'
      };
      
      console.log('File Storage: Save completed', result);
      return result;
      
    } catch (error) {
      console.error('File Storage: Save failed', error);
      throw new StorageError(
        'Failed to save file', 
        StorageErrorCode.NETWORK_ERROR,
        error
      );
    }
  }
  
  /**
   * Load project from file (upload)
   */
  async load(identifier: string): Promise<UnifiedProjectData> {
    try {
      console.log('File Storage: Load project started');
      
      // Use UnifiedProjectManager file dialog
      const unifiedData = await UnifiedProjectManager.openFileDialog();
      
      console.log('File Storage: Load completed', {
        tracks: unifiedData.tracks.length,
        bundles: unifiedData.bundles?.length || 0,
        templateGroups: unifiedData.templateGroups?.length || 0
      });
      
      return unifiedData;
      
    } catch (error) {
      console.error('File Storage: Load failed', error);
      
      if (error instanceof Error && error.message.includes('not selected')) {
        throw new StorageError(
          'No file selected',
          StorageErrorCode.NOT_FOUND
        );
      }
      
      throw new StorageError(
        'Failed to load file',
        StorageErrorCode.VALIDATION_ERROR,
        error
      );
    }
  }
  
  /**
   * File storage does not support listing
   */
  async list(): Promise<StorageItem[]> {
    throw new StorageError(
      'File storage does not support project listing',
      StorageErrorCode.UNSUPPORTED_OPERATION
    );
  }
  
  /**
   * File storage does not support deletion
   */
  async delete(identifier: string): Promise<void> {
    throw new StorageError(
      'File storage does not support project deletion',
      StorageErrorCode.UNSUPPORTED_OPERATION
    );
  }
  
  /**
   * Generate filename
   */
  private generateFilename(data: UnifiedProjectData, options?: SaveOptions): string {
    const date = new Date().toISOString().slice(0, 10);
    const timestamp = Date.now();
    const type = data.metadata.type || 'project';
    const name = options?.name || data.metadata.name;
    
    if (name) {
      const sanitizedName = name.replace(/[^a-zA-Z0-9\s\-_]/g, '-');
      return `${type}-${sanitizedName}-${date}-${timestamp}.json`;
    } else {
      return `${type}-${date}-${timestamp}.json`;
    }
  }
}
