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
BACKEND_PORT=$(get_env_value "VITE_BACKEND_PORT" "5002")


echo "🔧 Detected ports:"
echo "   Backend (Express):  http://localhost:$BACKEND_PORT"


# 기존 프로세스 종료
echo "🛑 Stopping existing processes..."

# 동적 포트로 프로세스 종료
echo "  - Killing processes on port $BACKEND_PORT (Backend)..."
lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true

# 프로세스 이름 기반으로 종료
echo "  - Killing nodemon processes..."
pkill -f "nodemon.*server" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

echo "  - Killing ts-node processes..."
pkill -f "ts-node.*index.ts" 2>/dev/null || true
pkill -f "ts-node.*server" 2>/dev/null || true

# 잠깐 대기 (프로세스 종료 완료 대기)
echo "⏳ Waiting for processes to stop..."
sleep 2

# 포트가 정말 비었는지 확인
echo "🔍 Checking if ports are free..."
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $BACKEND_PORT still in use. Force killing..."
    lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 최종 포트 상태 확인
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port $BACKEND_PORT is still occupied!"
    echo "   You may need to manually kill the process or choose a different port"
    exit 1
else
    echo "✅ Port $BACKEND_PORT is free"
fi
