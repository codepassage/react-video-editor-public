import { FileStorageProvider } from './FileStorageProvider';
import { ServerStorageProvider } from './ServerStorageProvider';
import { getApiUrl } from '../urlBuilder';

/**
 * File storage factory function
 */
export function createFileStorage(): FileStorageProvider {
  return new FileStorageProvider();
}

/**
 * Server storage factory function
 */
export function createServerStorage(apiUrl?: string): ServerStorageProvider {
  const url = apiUrl || getApiUrl();
  return new ServerStorageProvider(url);
}
