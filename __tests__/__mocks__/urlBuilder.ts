/**
 * Mock for urlBuilder.ts to avoid import.meta issues in tests
 */

export const getApiUrl = (endpoint: string): string => {
  return `http://localhost:5002/api${endpoint}`;
};

export const buildMediaUrl = (mediaPath: string): string => {
  return `http://localhost:5002${mediaPath}`;
};

export const buildFontUrl = (fontPath: string): string => {
  return `http://localhost:5002${fontPath}`;
};