/**
 * 비디오 에디터 서버 진입점 (모듈화 버전)
 * 
 * 이전 1,500+ 줄의 거대한 파일에서 모듈화된 구조로 전환
 * - 타입 정의: src/types/
 * - 설정: src/config/
 * - 서비스: src/services/
 * - 라우터: src/routes/
 * - 유틸리티: src/utils/
 * - 미들웨어: src/middleware/
 */

import { createRequire } from 'module';

import { createApp, printAppInfo } from './src/app';
import { appConfig } from './src/config/app.config';
import { ensureDirectories } from './src/utils/file-utils';
import { fontService } from './src/services/font.service';
import { createRenderService } from './src/services/render.service';

console.log('🚀 Starting Video Editor Server v2.0 (Modular Architecture)...');
console.log('📦 Modules: Types, Config, Services, Routes, Utils, Middleware');

/**
 * 서버 초기화 및 시작
 */
async function startServer(): Promise<void> {
  try {
    console.log('\n🔧 Initializing server components...');

    // ===================
    // 1. 디렉토리 생성
    // ===================
    console.log('📁 Ensuring directories...');
    await ensureDirectories();
    console.log('✅ Directories ready');

    // ===================
    // 2. 선택적 의존성 확인
    // ===================
    console.log('🔍 Checking optional dependencies...');
    checkOptionalDependencies();

    // ===================
    // 3. 폰트 서비스 초기화
    // ===================
    console.log('🎨 Initializing font service...');
    await fontService.initialize();
    console.log('✅ Font service ready');

    // ===================
    // 4. 렌더링 서비스 초기화
    // ===================
    console.log('🎬 Initializing render service...');
    const renderService = createRenderService(fontService);
    await renderService.createBundle();
    console.log('✅ Render service ready');

    // ===================
    // 5. Express 앱 생성
    // ===================
    console.log('🏗️ Creating Express application...');
    const app = await createApp();
    console.log('✅ Express app configured');

    // ===================
    // 6. 스케줄러 서비스 시작
    // ===================
    console.log('⏰ Starting scheduler service...');
    await import('./services/schedulerService');
    console.log('✅ Scheduler service started');

    // ===================
    // 7. Worker 프로세스 시작
    // ===================
    console.log('👷 Starting worker processes...');
    await import('./workers');
    console.log('✅ Workers started');

    // ===================
    // 8. 서버 시작
    // ===================
    console.log('🚀 Starting HTTP server...');

    const server = app.listen(appConfig.port, () => {
      printAppInfo(appConfig.port);

      // 시작 완료 통계
      const stats = fontService.getStats();
      console.log('📊 Startup Statistics:');
      console.log(`   🎨 Fonts loaded: ${stats.totalFonts} (${stats.totalFamilies} families)`);
      console.log(`   🎬 Bundle ready: ${renderService.isBundleReady() ? 'Yes' : 'No'}`);
      console.log(`   ⚡ Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      console.log(`   🕐 Startup time: ${Math.round(process.uptime() * 1000)}ms`);
    });

    // 서버 종료 처리
    setupGracefulShutdown(server);

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    console.error(error);
    process.exit(1);
  }
}

/**
 * 선택적 의존성 확인
 */
function checkOptionalDependencies(): void {
  const dependencies = {
    sharp: 'Image processing (thumbnails, metadata)',
    'fluent-ffmpeg': 'Video/Audio processing (metadata, thumbnails)'
  };

  Object.entries(dependencies).forEach(([dep, description]) => {
    try {
      require(dep);
      console.log(`   ✅ ${dep} - ${description}`);
    } catch {
      console.log(`   ⚠️ ${dep} - ${description} (optional, install with: npm install ${dep})`);
    }
  });
}

/**
 * 안전한 서버 종료 설정
 */
function setupGracefulShutdown(server: any): void {
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    server.close(() => {
      console.log('✅ HTTP server closed');

      // 추가 정리 작업 (필요시)
      console.log('🧹 Cleanup completed');

      console.log('👋 Server shutdown complete');
      process.exit(0);
    });

    // 강제 종료 타임아웃 (10초)
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // 시그널 핸들러 등록
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // 처리되지 않은 예외 처리
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

// 서버 시작
startServer().catch((error) => {
  console.error('💥 Fatal startup error:', error);
  process.exit(1);
});

// 개발 환경 정보 출력
if (process.env.NODE_ENV === 'development') {
  console.log('\n🛠️ Development Mode Active');
  console.log('   - Detailed error messages enabled');
  console.log('   - Request logging enabled');
  console.log('   - Hot reload: Use nodemon for auto-restart');
  console.log('   - GC available: Start with --expose-gc for memory debugging');
}

export default createApp;
