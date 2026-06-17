/**
 * 애플리케이션 기본 설정
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const appConfig = {
  // 서버 설정
  port: parseInt(process.env.VITE_BACKEND_PORT || process.env.PORT || '5002'),

  // 용량 제한
  uploadLimit: '1000mb',
  fileSize: 1000 * 1024 * 1024, // 1000MB
  maxFiles: 10,

  // 타임아웃
  timeout: 900000, // 15분

  // 디렉토리 설정
  directories: {
    uploads: 'uploads',
    renders: 'renders',
    templates: 'templates',
    fonts: 'font',
    projects: 'projects',
    tts: 'uploads/tts',
    whisper: 'uploads/whisper'
  },

  // 절대 경로
  paths: {
    server: path.resolve(__dirname, '../../'),
    uploads: path.resolve(__dirname, '../../uploads'),
    renders: path.resolve(__dirname, '../../renders'),
    templates: path.resolve(__dirname, '../../templates'),
    fonts: path.resolve(__dirname, '../../font'),
    projects: path.resolve(__dirname, '../../projects'),
    public: path.resolve(__dirname, '../../../public'),
    tts: path.resolve(__dirname, '../../uploads/tts'),
    whisper: path.resolve(__dirname, '../../uploads/whisper')
  },

  // 미디어 설정
  supportedImageTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
  supportedVideoTypes: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'],
  supportedAudioTypes: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
  supportedFontTypes: ['.ttf', '.otf', '.woff', '.woff2'],

  // MIME 타입 매핑
  mimeTypes: {
    image: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'image/webp', 'image/bmp', 'image/svg+xml'
    ],
    video: [
      'video/mp4', 'video/webm', 'video/quicktime',
      'video/x-msvideo', 'video/x-matroska', 'video/x-flv'
    ],
    audio: [
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'audio/mp4', 'audio/webm', 'audio/aac', 'audio/flac'
    ]
  },

  // 렌더링 설정
  rendering: {
    compositionId: 'VideoEditorComposition',
    codec: 'h264',
    concurrency: 3,
    logLevel: 'info',
    ffmpegPreset: 'fast',
    crf: 28,
    threads: 3,
    maxRate: '5M',
    bufSize: '10M'
  },

  // 프론트엔드 연결
  frontend: {
    defaultPort: '3004',
    commonPorts: ['3000', '3001', '3002', '3004', '5173']
  }
};

export default appConfig;
