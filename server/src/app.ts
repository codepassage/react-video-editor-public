/**
 * 🚀 Express App.ts - API 서버 애플리케이션 (핵심 모듈 #5)
 * 
 * =====================================================================
 * 🎯 EXPRESS 기반 백엔드 서버 애플리케이션 - API 서비스 계층
 * =====================================================================
 * 
 * React Video Editor의 모든 백엔드 기능을 제공하는 Express 서버
 * RESTful API, 파일 업로드, 미디어 처리, 렌더링 작업을 담당
 * 
 * 🏗️ 서버 아키텍처 구성:
 * • Express.js 웹 프레임워크 기반
 * • Prisma ORM으로 데이터베이스 연동
 * • Multer를 통한 파일 업로드 처리
 * • CORS 설정으로 프론트엔드 연동
 * • 에러 핸들링 및 로깅 시스템
 * • Rate Limiting 및 보안 미들웨어
 * 
 * 🛣️ API 라우팅 시스템:
 * • 미디어 관리: 업로드, 썸네일, 메타데이터
 * • 템플릿 시스템: 저장, 로드, 버전 관리
 * • 렌더링: Remotion 비디오 생성
 * • TTS: 음성 합성 및 캐싱
 * • 폰트: 한국어 폰트 서비스
 * • 자동화: CSV → 비디오 변환
 */

// ========================================================================
// 📦 Express 및 Core 라이브러리 Import
// ========================================================================
import express from 'express';  // Express 웹 프레임워크
import cors from 'cors';        // Cross-Origin Resource Sharing 미들웨어
import path from 'path';        // 파일 경로 처리 유틸리티

// ========================================================================
// ⚙️ 애플리케이션 설정 Import
// ========================================================================
import { corsConfig } from './config/cors.config';      // CORS 보안 설정
import { appConfig } from './config/app.config';        // 앱 전역 설정

// ========================================================================
// 🛣️ API 라우터 Import - 기능별 엔드포인트 분리
// ========================================================================

// 📝 핵심 API 라우터들 (src/routes/)
import fontRoutes from './routes/font.routes';                    // 🔤 폰트 서비스 API
import uploadRoutes from './routes/upload.routes';                // 📤 파일 업로드 API
import templateRoutes from './routes/template.routes';            // 📋 템플릿 관리 API
import templateTypeRoutes from './routes/templateType.routes';    // 🏷️ 템플릿 타입 API
import renderRoutes from './routes/render.routes';                // 🎬 비디오 렌더링 API
import mediaRoutes from './routes/media.routes';                  // 📁 미디어 관리 API
import healthRoutes from './routes/health.routes';                // 💓 서버 헬스체크 API
import resourceDataRoutes from './routes/resource-data.routes';   // 📊 리소스 데이터 API
import compatibilityRoutes from './routes/compatibility.routes';  // 🔄 호환성 검사 API

// 🚀 확장 API 라우터들 (상위 routes/)
import resourceTemplateRoutes from '../routes/resource-templates'; // 📦 리소스 템플릿 API
import csvColumnMapRoutes from '../routes/csv-column-maps';        // 🗂️ CSV 컬럼 매핑 API
import autoGenerationRoutes from '../routes/autoGeneration';       // 🤖 자동 생성 API
import renderJobRoutes from '../routes/renderJobs';               // ⚙️ 렌더링 작업 API
import autoGenProjectRoutes from '../routes/autoGenProjects';     // 📋 자동 생성 프로젝트 API
import youtubeRoutes from '../routes/youtube';                    // 📺 YouTube 연동 API
import longSentenceRoutes from '../routes/longSentence';          // 📝 긴 문장 처리 API
import whisperStatusRoutes from '../routes/whisperStatus';        // 🎙️ Whisper 상태 API
import ttsRoutes from '../routes/tts';                            // 🎤 TTS (음성 합성) API

// ========================================================================
// 🛡️ 미들웨어 시스템 Import - 보안 및 에러 처리
// ========================================================================

// 🚨 에러 처리 미들웨어들
import {
  errorHandler,              // 🔥 전역 에러 핸들러 (프로덕션)
  notFoundHandler,           // 🔍 404 Not Found 핸들러
  errorLogger,              // 📝 에러 로깅 미들웨어
  developmentErrorHandler   // 🛠️ 개발용 상세 에러 핸들러
} from './middleware/error-handler';

// 🔒 검증 및 보안 미들웨어들
import {
  validateRequestSize,      // 📏 요청 크기 제한 (DOS 공격 방지)
  rateLimiter              // ⏱️ API 호출 빈도 제한 (Rate Limiting)
} from './middleware/validation';

// ========================================================================
// 🏗️ Express 애플리케이션 팩토리 함수
// ========================================================================

/**
 * 🚀 Express 애플리케이션 생성 및 설정
 * 
 * 모든 미들웨어, 라우터, 에러 핸들러를 구성하여 완전한 서버 애플리케이션 생성
 * 비동기 함수로 구현하여 데이터베이스 연결 등 초기화 작업 지원
 * 
 * @returns {Promise<express.Application>} 설정 완료된 Express 앱 인스턴스
 */
export async function createApp(): Promise<express.Application> {
  // ========================================================================
  // 🎯 Express 앱 인스턴스 생성
  // ========================================================================
  const app = express();

  console.log('🏗️ Setting up Express application...');

  // ===================
  // 기본 미들웨어 설정
  // ===================

  // CORS 설정
  app.use(cors(corsConfig));
  console.log('✅ CORS configured');

  // JSON 파싱 설정 (1000MB 대응)
  app.use(express.json({
    limit: appConfig.uploadLimit,
    verify: (req, res, buf) => {
      // JSON 크기 로깅 (개발 환경)
      if (process.env.NODE_ENV === 'development' && buf.length > 1024 * 1024) {
        console.log(`📊 Large JSON request: ${Math.round(buf.length / 1024 / 1024 * 100) / 100}MB`);
      }
    }
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: appConfig.uploadLimit
  }));
  console.log('✅ JSON parsing configured');

  // 요청 크기 제한 (글로벌)
  app.use(validateRequestSize(700));

  // 요청 빈도 제한 (글로벌)
  app.use(rateLimiter(60000, 1000)); // 1분에 1000개 요청 제한

  // 요청 로깅 (개발 환경)
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path}`);
      next();
    });
  }

  // ===================
  // 정적 파일 서빙
  // ===================

  setupStaticFiles(app);

  // ===================
  // API 라우터 등록
  // ===================

  console.log('🔗 Registering API routes...');

  // 헬스체크 (최우선)
  app.use('/api', healthRoutes);

  // 폰트 관리
  app.use('/api', fontRoutes);

  // 파일 업로드
  app.use('/api', uploadRoutes);

  // 미디어 관리
  app.use('/api', mediaRoutes);

  // 템플릿 관리
  app.use('/api', templateRoutes);

  // 템플릿 타입 관리
  app.use('/api', templateTypeRoutes);

  // 리소스 데이터 관리
  app.use('/api', resourceDataRoutes);

  // 리소스 템플릿 관리
  app.use('/api/resource-templates', resourceTemplateRoutes);

  // CSV 컬럼 맵 관리
  app.use('/api/csv-column-maps', csvColumnMapRoutes);

  // 템플릿-리소스 호환성 관리
  app.use('/api', compatibilityRoutes);

  // 비디오 렌더링
  app.use('/api', renderRoutes);

  // 자동 비디오 생성
  app.use('/api/auto-generate', autoGenerationRoutes);

  // 자동 생성 프로젝트 관리
  app.use('/api/auto-gen', autoGenProjectRoutes);

  // 렌더링 작업 관리
  app.use('/api', renderJobRoutes);

  // 유튜브 관리
  app.use('/api', youtubeRoutes);

  // LongSentence 클립 관리
  app.use('/api/longsentence', longSentenceRoutes);

  // Whisper 서비스 상태 관리
  app.use('/api/whisper', whisperStatusRoutes);

  // TTS 음성 관리
  app.use('/api/tts', ttsRoutes);

  // Bull Board (Queue 모니터링)
  const { bullBoardRouter } = await import('../queue');
  app.use('/admin/queues', bullBoardRouter);

  console.log('✅ All API routes registered');

  // ===================
  // 에러 처리 미들웨어
  // ===================

  // 에러 로깅
  app.use(errorLogger);

  // 개발 환경 상세 에러 (프로덕션보다 먼저)
  if (process.env.NODE_ENV === 'development') {
    app.use(developmentErrorHandler);
  }

  // 메인 에러 핸들러
  app.use(errorHandler);

  // 404 핸들러 (마지막)
  app.use('*', notFoundHandler);

  console.log('✅ Error handling configured');

  return app;
}

/**
 * 정적 파일 서빙 설정
 */
function setupStaticFiles(app: express.Application): void {
  console.log('📁 Setting up static file serving...');

  // 업로드된 파일 서빙
  app.use('/uploads', express.static(appConfig.paths.uploads, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();

      // 비디오 파일 MIME 타입 설정
      if (ext === '.mp4') {
        res.set('Content-Type', 'video/mp4');
      } else if (ext === '.webm') {
        res.set('Content-Type', 'video/webm');
      } else if (ext === '.mov') {
        res.set('Content-Type', 'video/quicktime');
      } else if (ext === '.avi') {
        res.set('Content-Type', 'video/x-msvideo');
      }

      // 캐시 설정
      res.set('Cache-Control', 'public, max-age=3600'); // 1시간 캐시
    },
    // 큰 파일 지원
    maxAge: '1h',
    etag: true,
    lastModified: true
  }));

  // 렌더링된 비디오 파일 서빙
  app.use('/renders', express.static(appConfig.paths.renders, {
    setHeaders: (res, filePath) => {
      res.set('Content-Type', 'video/mp4');
      res.set('Cache-Control', 'public, max-age=86400'); // 24시간 캐시

      // 다운로드 헤더 설정
      const filename = path.basename(filePath);
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
    }
  }));

  // 폰트 파일 서빙
  app.use('/font', express.static(appConfig.paths.fonts, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();

      // 폰트 MIME 타입 설정
      if (ext === '.ttf') {
        res.set('Content-Type', 'font/ttf');
      } else if (ext === '.otf') {
        res.set('Content-Type', 'font/otf');
      } else if (ext === '.woff') {
        res.set('Content-Type', 'font/woff');
      } else if (ext === '.woff2') {
        res.set('Content-Type', 'font/woff2');
      } else if (ext === '.css') {
        res.set('Content-Type', 'text/css');
      }

      // 폰트는 오랫동안 캐시
      res.set('Cache-Control', 'public, max-age=31536000'); // 1년 캐시
      res.set('Access-Control-Allow-Origin', '*'); // 폰트 CORS
    }
  }));

  console.log('✅ Static file serving configured');
  console.log(`   📁 Uploads: /uploads -> ${appConfig.paths.uploads}`);
  console.log(`   📁 Renders: /renders -> ${appConfig.paths.renders}`);
  console.log(`   📁 Fonts: /font -> ${appConfig.paths.fonts}`);
}

/**
 * 애플리케이션 정보 출력
 */
export function printAppInfo(port: number | string): void {
  const host = process.env.VITE_BACKEND_HOST || 'localhost';
  const baseUrl = `http://${host}:${port}`;

  console.log('\n🚀 Video Editor Server v2.0 (Modular) - Ready!');
  console.log('='.repeat(60));
  console.log(`🌐 Server: ${baseUrl}`);
  console.log(`📊 Health: ${baseUrl}/api/health`);
  console.log(`🎬 Render: POST ${baseUrl}/api/render`);
  console.log(`📁 Media: ${baseUrl}/api/media`);
  console.log(`📤 Upload: POST ${baseUrl}/api/upload`);
  console.log(`🎨 Fonts: ${baseUrl}/api/fonts`);
  console.log(`📄 Templates: ${baseUrl}/api/templates`);
  console.log(`🏷️ Template Types: ${baseUrl}/api/template-types`);
  console.log(`📊 Resource Data: ${baseUrl}/api/resource-data`);
  console.log(`📋 Resource Templates: ${baseUrl}/api/resource-templates`);
  console.log(`🗂️ CSV Column Maps: ${baseUrl}/api/csv-column-maps`);
  console.log(`🔗 Compatibility: ${baseUrl}/api/compatibility`);
  console.log(`📖 LongSentence: ${baseUrl}/api/longsentence`);
  console.log(`🎤 TTS Voices: ${baseUrl}/api/tts`);
  console.log('='.repeat(60));
  console.log('📖 API Documentation:');
  console.log(`   Health Check: GET ${baseUrl}/api/health/detailed`);
  console.log(`   System Status: GET ${baseUrl}/api/status`);
  console.log(`   Font List: GET ${baseUrl}/api/fonts`);
  console.log(`   File List: GET ${baseUrl}/api/files`);
  console.log(`   Render Stats: GET ${baseUrl}/api/render/stats`);
  console.log('='.repeat(60));
  console.log('⚡ Ready for video editing and rendering!');
  console.log('');
}

export default createApp;
