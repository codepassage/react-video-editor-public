#!/bin/bash

echo "🔧 React Video Editor - Port Configuration"
echo "=========================================="

# 현재 .env 파일에서 포트 읽기
get_current_port() {
    local key=$1
    local default_value=$2
    
    if [ -f ".env" ]; then
        local value=$(grep "^${key}=" ".env" | cut -d '=' -f2 | head -n1)
        if [ -n "$value" ]; then
            echo "$value"
        else
            echo "$default_value"
        fi
    else
        echo "$default_value"
    fi
}

CURRENT_FRONTEND_PORT=$(get_current_port "VITE_PORT" "3004")
CURRENT_BACKEND_PORT=$(get_current_port "VITE_BACKEND_PORT" "5002")

echo "📊 Current configuration:"
echo "  Frontend (Vite):    http://localhost:$CURRENT_FRONTEND_PORT"
echo "  Backend (Express):  http://localhost:$CURRENT_BACKEND_PORT"
echo ""

# 사용자 입력 받기
read -p "🔌 Enter new Frontend port (current: $CURRENT_FRONTEND_PORT): " NEW_FRONTEND_PORT
read -p "🔌 Enter new Backend port (current: $CURRENT_BACKEND_PORT): " NEW_BACKEND_PORT
read -p "🔌 Enter Backend host (current: localhost, for external access use IP): " NEW_BACKEND_HOST

# 빈 입력시 기존 값 유지
if [ -z "$NEW_FRONTEND_PORT" ]; then
    NEW_FRONTEND_PORT=$CURRENT_FRONTEND_PORT
fi

if [ -z "$NEW_BACKEND_PORT" ]; then
    NEW_BACKEND_PORT=$CURRENT_BACKEND_PORT
fi

if [ -z "$NEW_BACKEND_HOST" ]; then
    NEW_BACKEND_HOST="localhost"
fi

# 포트 유효성 검사
validate_port() {
    local port=$1
    local name=$2
    
    if ! [[ "$port" =~ ^[0-9]+$ ]]; then
        echo "❌ Error: $name port '$port' is not a valid number"
        exit 1
    fi
    
    if [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
        echo "❌ Error: $name port '$port' should be between 1024-65535"
        exit 1
    fi
}

validate_port "$NEW_FRONTEND_PORT" "Frontend"
validate_port "$NEW_BACKEND_PORT" "Backend"

# 같은 포트 사용 확인
if [ "$NEW_FRONTEND_PORT" -eq "$NEW_BACKEND_PORT" ]; then
    echo "❌ Error: Frontend and Backend cannot use the same port ($NEW_FRONTEND_PORT)"
    exit 1
fi

# 포트 사용 중인지 확인
check_port_in_use() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Warning: $name port $port is currently in use"
        read -p "   Do you want to continue anyway? (y/N): " confirm
        if [[ $confirm != [yY] ]]; then
            echo "   Cancelled port change"
            exit 1
        fi
    fi
}

echo ""
echo "🔍 Checking if ports are available..."
check_port_in_use "$NEW_FRONTEND_PORT" "Frontend"
check_port_in_use "$NEW_BACKEND_PORT" "Backend"

# .env 파일 업데이트
echo "📝 Updating .env file..."

# 백업 생성
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✅ Backup created: .env.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 새로운 .env 파일 생성
cat > .env << EOF
# 서버 포트 설정
VITE_PORT=$NEW_FRONTEND_PORT
VITE_BACKEND_PORT=$NEW_BACKEND_PORT

# 백엔드 호스트 설정 (개발 환경에서 외부 접속 허용)
VITE_BACKEND_HOST=$NEW_BACKEND_HOST

# API URL (포트는 VITE_BACKEND_PORT와 자동 조합됨)
VITE_API_URL=http://localhost

# 폰트 서버 URL (포트는 VITE_BACKEND_PORT와 자동 조합됨, 기본적으로 API_URL과 동일)
VITE_FONT_SERVER_URL=http://localhost

# 개발 환경 설정
NODE_ENV=development

# 프로덕션 환경에서는 실제 서버 URL로 변경
# VITE_API_URL=https://your-production-server.com
# VITE_PORT=80
# VITE_BACKEND_PORT=8080
EOF

echo "✅ Port configuration updated successfully!"
echo ""
echo "📊 New configuration:"
echo "  Frontend (Vite):    http://localhost:$NEW_FRONTEND_PORT"
echo "  Backend (Express):  http://localhost:$NEW_BACKEND_PORT"
echo ""
echo "🚀 To apply changes, restart the servers:"
echo "  ./start_fullstack.sh"
echo ""
echo "💡 Tips:"
echo "  - The start_fullstack.sh script will automatically use the new ports"
echo "  - CORS settings will be automatically configured"
echo "  - You can run this script again anytime to change ports"
