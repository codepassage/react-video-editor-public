#!/bin/bash

# 로컬 Whisper 설치 스크립트
# macOS, Linux, Windows (WSL) 지원

set -e

echo "🎙️ 로컬 Whisper 설치 스크립트"
echo "==============================="
echo

# 운영체제 확인
OS=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="Windows"
else
    echo "❌ 지원하지 않는 운영체제입니다: $OSTYPE"
    exit 1
fi

echo "📍 운영체제: $OS"
echo

# Python 확인
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python이 설치되지 않았습니다."
        echo "📥 Python 3.8 이상을 설치해주세요: https://python.org"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

# Python 버전 확인
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
echo "🐍 Python 버전: $PYTHON_VERSION"

# pip 확인
if ! command -v pip3 &> /dev/null; then
    if ! command -v pip &> /dev/null; then
        echo "❌ pip가 설치되지 않았습니다."
        echo "📥 pip를 설치해주세요."
        exit 1
    else
        PIP_CMD="pip"
    fi
else
    PIP_CMD="pip3"
fi

echo "📦 pip 버전: $($PIP_CMD --version)"
echo

# ffmpeg 확인 및 설치 안내
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg가 설치되지 않았습니다."
    echo "🔧 ffmpeg 설치 방법:"
    
    if [[ "$OS" == "macOS" ]]; then
        echo "   brew install ffmpeg"
    elif [[ "$OS" == "Linux" ]]; then
        echo "   Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg"
        echo "   CentOS/RHEL: sudo yum install ffmpeg"
        echo "   Arch: sudo pacman -S ffmpeg"
    elif [[ "$OS" == "Windows" ]]; then
        echo "   Chocolatey: choco install ffmpeg"
        echo "   또는 https://ffmpeg.org/download.html 에서 다운로드"
    fi
    
    echo
    read -p "🤔 ffmpeg 설치 없이 계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ ffmpeg를 먼저 설치해주세요."
        exit 1
    fi
else
    echo "✅ ffmpeg 설치됨: $(ffmpeg -version | head -n1)"
fi

echo

# Whisper 설치 옵션 선택
echo "🎯 Whisper 설치 옵션을 선택하세요:"
echo "1) 기본 설치 (CPU only)"
echo "2) GPU 가속 설치 (CUDA)"
echo "3) 개발자 설치 (최신 버전)"
echo

read -p "선택 (1-3): " -n 1 -r INSTALL_OPTION
echo
echo

case $INSTALL_OPTION in
    1)
        echo "📥 기본 Whisper 설치 중..."
        $PIP_CMD install openai-whisper
        ;;
    2)
        echo "🚀 GPU 가속 Whisper 설치 중..."
        echo "⚠️  CUDA가 설치되어 있는지 확인하세요."
        $PIP_CMD install openai-whisper torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
        ;;
    3)
        echo "🔬 개발자 버전 Whisper 설치 중..."
        $PIP_CMD install git+https://github.com/openai/whisper.git
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

echo
echo "⏳ 설치 확인 중..."

# Whisper 설치 확인
if command -v whisper &> /dev/null; then
    echo "✅ Whisper 설치 완료!"
    echo "📍 Whisper 위치: $(which whisper)"
    
    # 버전 확인
    echo "🏷️  Whisper 버전 확인 중..."
    whisper --help | head -n5
else
    echo "❌ Whisper 설치에 실패했습니다."
    echo "🔍 수동 설치를 시도해보세요:"
    echo "   $PIP_CMD install openai-whisper"
    exit 1
fi

echo

# 모델 다운로드 옵션
echo "🎯 사전 다운로드할 모델을 선택하세요:"
echo "1) tiny (39 MB, 가장 빠름, 정확도 낮음)"
echo "2) base (74 MB, 빠름, 기본 정확도) - 권장"
echo "3) small (244 MB, 보통, 좋은 정확도)"
echo "4) medium (769 MB, 느림, 높은 정확도)"
echo "5) large (1550 MB, 매우 느림, 최고 정확도)"
echo "6) 나중에 다운로드"
echo

read -p "선택 (1-6): " -n 1 -r MODEL_OPTION
echo
echo

case $MODEL_OPTION in
    1) MODEL_SIZE="tiny" ;;
    2) MODEL_SIZE="base" ;;
    3) MODEL_SIZE="small" ;;
    4) MODEL_SIZE="medium" ;;
    5) MODEL_SIZE="large" ;;
    6) 
        echo "⏭️  모델 다운로드를 건너뜁니다."
        MODEL_SIZE=""
        ;;
    *)
        echo "❌ 잘못된 선택입니다. base 모델로 설정합니다."
        MODEL_SIZE="base"
        ;;
esac

if [ ! -z "$MODEL_SIZE" ]; then
    echo "📥 $MODEL_SIZE 모델 다운로드 중..."
    echo "⏳ 첫 번째 변환 시 자동으로 다운로드됩니다..."
    
    # 임시 오디오 파일로 모델 다운로드 유도
    echo "🎵 테스트 오디오 생성 중..."
    if command -v ffmpeg &> /dev/null; then
        TEMP_AUDIO="/tmp/whisper_test.wav"
        ffmpeg -f lavfi -i "sine=frequency=1000:duration=1" -ac 1 -ar 16000 "$TEMP_AUDIO" -y -loglevel quiet
        
        echo "🔄 $MODEL_SIZE 모델 다운로드 중... (최초 1회)"
        whisper "$TEMP_AUDIO" --model "$MODEL_SIZE" --output_format txt --output_dir "/tmp" > /dev/null 2>&1 || true
        
        # 임시 파일 정리
        rm -f "$TEMP_AUDIO" /tmp/whisper_test.*
        
        echo "✅ $MODEL_SIZE 모델 다운로드 완료!"
    else
        echo "⚠️  ffmpeg가 없어 모델 사전 다운로드를 건너뜁니다."
    fi
fi

echo
echo "🎉 로컬 Whisper 설치 완료!"
echo "==============================="
echo
echo "📋 설치된 정보:"
echo "   • Whisper 명령어: $(which whisper)"
echo "   • Python: $PYTHON_VERSION"
echo "   • 설치된 모델: ${MODEL_SIZE:-'없음 (첫 사용 시 자동 다운로드)'}"
echo

echo "🔧 환경 변수 설정:"
echo "   WHISPER_PROVIDER=local"
echo "   LOCAL_WHISPER_COMMAND=whisper"
echo "   LOCAL_WHISPER_MODEL_SIZE=${MODEL_SIZE:-base}"
echo

echo "✨ 사용법:"
echo "   whisper audio.mp3 --language ko --output_format srt"
echo

echo "🔗 추가 정보:"
echo "   • Whisper GitHub: https://github.com/openai/whisper"
echo "   • 지원 언어: https://github.com/openai/whisper#available-models-and-languages"
echo

echo "✅ 설치가 완료되었습니다. 이제 로컬 Whisper를 사용할 수 있습니다!"