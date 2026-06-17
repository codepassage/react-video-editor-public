#!/bin/bash

echo "🐳 Starting Enhanced Video Editor (Docker Development Mode)"
echo "=========================================================="

# 현재 디렉토리 확인
echo "📁 Working directory: $(pwd)"

# Docker와 Docker Compose 설치 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Docker 서비스 실행 확인
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker and Docker Compose are ready"

# 기존 컨테이너 정리 (선택사항)
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# 환경 파일 복사
if [ -f ".env.docker.dev" ]; then
    echo "📋 Using Docker development environment settings..."
    cp .env.docker.dev .env.docker.temp
else
    echo "⚠️  .env.docker.dev not found, using default .env"
fi

# Docker 서비스 시작 (백그라운드)
echo "🚀 Starting Docker services (PostgreSQL + Redis)..."
docker-compose -f docker-compose.dev.yml up -d

# 서비스 상태 확인
echo "⏳ Waiting for services to be ready..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up.*healthy"; then
        echo "✅ Docker services are healthy"
        break
    fi
    echo "  - Waiting for services... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo "❌ Services failed to start within $timeout seconds"
    echo "🔍 Checking service status..."
    docker-compose -f docker-compose.dev.yml ps
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.dev.yml logs
    exit 1
fi

# 로컬 개발 서버 시작
echo ""
echo "🔧 Starting local development servers..."
echo "  - Database: PostgreSQL (Docker) - localhost:5432"
echo "  - Redis: Redis (Docker) - localhost:6379"
echo "  - Frontend: React + Vite - http://localhost:3004"
echo "  - Backend: Express + Nodemon - http://localhost:5002"
echo ""

# Redis Commander UI 정보 (선택사항)
echo "💡 Optional: Start Redis Commander UI with:"
echo "   docker-compose -f docker-compose.dev.yml --profile tools up -d redis-commander"
echo "   Then access: http://localhost:8081"
echo ""

# Prisma 마이그레이션 실행 (필요시)
echo "🔄 Running Prisma migrations..."
if [ -f "prisma/schema.prisma" ]; then
    npx prisma migrate dev --name "docker-setup" || echo "⚠️  Migration failed or not needed"
    npx prisma generate || echo "⚠️  Prisma client generation failed"
else
    echo "⚠️  Prisma schema not found, skipping migrations"
fi

echo ""
echo "🎯 Development environment is ready!"
echo "📝 Process logs:"
echo "  [0] = Frontend (Vite)"
echo "  [1] = Backend (Nodemon)"
echo ""
echo "🔄 To stop: Press Ctrl+C"
echo "🐳 To stop Docker services: docker-compose -f docker-compose.dev.yml down"
echo "=========================================================="

# 환경 변수 설정 (Docker 컨테이너와 연결)
export NODE_ENV=development

# 기존 로컬 서비스 종료
echo "🛑 Stopping existing local processes..."
lsof -ti :3004 | xargs kill -9 2>/dev/null || true
lsof -ti :5002 | xargs kill -9 2>/dev/null || true

# 로컬 개발 서버 시작
npm run dev

# 스크립트 종료 시 정리
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."
    
    # 로컬 서버 종료
    echo "  - Stopping local servers..."
    lsof -ti :3004 | xargs kill -9 2>/dev/null || true
    lsof -ti :5002 | xargs kill -9 2>/dev/null || true
    
    # Docker 서비스는 유지 (다음 개발 세션에서 재사용)
    echo "  - Docker services will continue running for next session"
    echo "  - To stop Docker services: docker-compose -f docker-compose.dev.yml down"
    
    # 임시 환경 파일 정리
    rm -f .env.docker.temp
    
    echo "✅ Cleanup completed"
    exit 0
}

# Ctrl+C 처리
trap cleanup SIGINT SIGTERM