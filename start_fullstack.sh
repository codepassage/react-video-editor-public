#!/bin/bash

echo "🎬 Starting Enhanced Video Editor (Full Stack)"
echo "=============================================="

# 현재 디렉토리 확인
echo "📁 Working directory: $(pwd)"

# .env 파일에서 포트 정보 읽기
get_env_value() {
    local key=$1
    local default_value=$2
    local env_file=".env"
    
    if [ -f "$env_file" ]; then
        # .env 파일에서 키=값 형태로 값 추출 (주석 제외)
        local value=$(grep "^${key}=" "$env_file" | cut -d '=' -f2 | sed 's/^"//' | sed 's/"$//' | head -n1)
        if [ -n "$value" ]; then
            echo "$value"
        else
            echo "$default_value"
        fi
    else
        echo "$default_value"
    fi
}

# 포트 정보 자동 감지
FRONTEND_PORT=$(get_env_value "VITE_PORT" "3004")
BACKEND_PORT=$(get_env_value "VITE_BACKEND_PORT" "5002")

# 숫자인지 확인 (포트 유효성 검사)
if ! [[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || ! [[ "$BACKEND_PORT" =~ ^[0-9]+$ ]]; then
    echo "❌ Invalid port numbers in .env file"
    echo "   FRONTEND_PORT: $FRONTEND_PORT"
    echo "   BACKEND_PORT: $BACKEND_PORT"
    echo "   Using defaults: Frontend=3004, Backend=5002"
    FRONTEND_PORT=3004
    BACKEND_PORT=5002
fi

echo "🔧 Detected ports:"
echo "   Frontend (Vite):    http://localhost:$FRONTEND_PORT"
echo "   Backend (Express):  http://localhost:$BACKEND_PORT"

# 포트 범위 확인 (1024-65535)
if [ "$FRONTEND_PORT" -lt 1024 ] || [ "$FRONTEND_PORT" -gt 65535 ] || 
   [ "$BACKEND_PORT" -lt 1024 ] || [ "$BACKEND_PORT" -gt 65535 ]; then
    echo "⚠️  Warning: Port numbers should be between 1024-65535"
fi

# 같은 포트 사용 확인
if [ "$FRONTEND_PORT" -eq "$BACKEND_PORT" ]; then
    echo "❌ Error: Frontend and Backend cannot use the same port ($FRONTEND_PORT)"
    echo "   Please update .env file with different port numbers"
    exit 1
fi

# 기존 프로세스 종료
echo "🛑 Stopping existing processes..."

# 동적 포트로 프로세스 종료
echo "  - Killing processes on port $FRONTEND_PORT (Frontend)..."
lsof -ti :$FRONTEND_PORT | xargs kill -9 2>/dev/null || true

echo "  - Killing processes on port $BACKEND_PORT (Backend)..."
lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true

# 프로세스 이름 기반으로 종료
echo "  - Killing vite processes..."
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "  - Killing nodemon processes..."
pkill -f "nodemon.*server" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

echo "  - Killing ts-node processes..."
pkill -f "ts-node.*index.ts" 2>/dev/null || true
pkill -f "ts-node.*server" 2>/dev/null || true

echo "  - Killing any remaining node processes from this project..."
pkill -f "react-video-editor" 2>/dev/null || true

# 잠깐 대기 (프로세스 종료 완료 대기)
echo "⏳ Waiting for processes to stop..."
sleep 2

# 포트가 정말 비었는지 확인
echo "🔍 Checking if ports are free..."
if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $FRONTEND_PORT still in use. Force killing..."
    lsof -ti :$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $BACKEND_PORT still in use. Force killing..."
    lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 최종 포트 상태 확인
echo "📊 Final port status:"
if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port $FRONTEND_PORT is still occupied!"
    echo "   You may need to manually kill the process or choose a different port"
    exit 1
else
    echo "✅ Port $FRONTEND_PORT is free"
fi

if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port $BACKEND_PORT is still occupied!"
    echo "   You may need to manually kill the process or choose a different port"
    exit 1
else
    echo "✅ Port $BACKEND_PORT is free"
fi

# Node modules 확인
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# concurrently 확인 및 설치
echo "🔧 Checking concurrently..."
if ! npm list concurrently >/dev/null 2>&1; then
    echo "📦 Installing concurrently..."
    npm install --save-dev concurrently
else
    echo "✅ concurrently already installed"
fi

# 환경 변수 설정
export NODE_ENV=development
export VITE_PORT=$FRONTEND_PORT
export VITE_BACKEND_PORT=$BACKEND_PORT

# .env 파일에서 호스트 정보 읽기
BACKEND_HOST=$(get_env_value "VITE_BACKEND_HOST" "localhost")
export VITE_BACKEND_HOST=$BACKEND_HOST
export VITE_API_URL="http://$BACKEND_HOST:$BACKEND_PORT"
export VITE_FONT_SERVER_URL="http://$BACKEND_HOST:$BACKEND_PORT"

echo ""
echo "🚀 Starting both frontend and backend..."
echo "  - Frontend (React + Vite): http://localhost:$FRONTEND_PORT"
echo "  - Backend (Express + Nodemon): http://$BACKEND_HOST:$BACKEND_PORT"
echo ""
echo "📝 Process logs:"
echo "  [0] = Frontend (Vite)"
echo "  [1] = Backend (Nodemon)"
echo ""
echo "🔄 To stop: Press Ctrl+C"
echo "💡 To change ports: Edit .env file (VITE_PORT, VITE_BACKEND_PORT)"
echo "=============================================="

# 프론트엔드와 백엔드 동시 실행
npm run dev

# 스크립트 종료 시 정리
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    
    # 동적 포트로 종료
    echo "  - Stopping frontend (port $FRONTEND_PORT)..."
    lsof -ti :$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    
    echo "  - Stopping backend (port $BACKEND_PORT)..."
    lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    
    echo "✅ Cleanup completed"
    exit 0
}

# Ctrl+C 처리
trap cleanup SIGINT SIGTERM
