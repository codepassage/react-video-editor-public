// Storage module unified exports
// All storage-related types, classes, and factory functions

// Interfaces and types
export type {
  StorageProvider,
  SaveOptions,
  SaveResult,
  StorageItem,
  LoadOptions
} from './StorageProvider';

export {
  StorageError,
  StorageErrorCode
} from './StorageProvider';

// Implementation classes
export { FileStorageProvider } from './FileStorageProvider';
export { ServerStorageProvider } from './ServerStorageProvider';

// Factory functions (recommended usage)
export { 
  createFileStorage,
  createServerStorage 
} from './storageFactory';
