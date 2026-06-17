#!/bin/bash

echo "🔍 Whisper 모델 확인 스크립트"
echo "================================"

# 1. 환경변수 확인
echo -e "\n📋 환경변수 설정:"
echo "LOCAL_WHISPER_MODEL_SIZE: ${LOCAL_WHISPER_MODEL_SIZE:-설정되지 않음}"

# 2. 캐시된 모델 확인
echo -e "\n💾 다운로드된 모델들:"
if [ -d "$HOME/.cache/whisper" ]; then
    ls -lah "$HOME/.cache/whisper/" | grep ".pt"
else
    echo "캐시 디렉토리가 없습니다."
fi

# 3. 사용 가능한 모델 목록
echo -e "\n📦 사용 가능한 Whisper 모델:"
echo "- tiny (39 MB)"
echo "- tiny.en (39 MB) - 영어 전용"
echo "- base (74 MB)"
echo "- base.en (74 MB) - 영어 전용"
echo "- small (244 MB)"
echo "- small.en (244 MB) - 영어 전용"
echo "- medium (769 MB)"
echo "- medium.en (769 MB) - 영어 전용"
echo "- large (1550 MB)"
echo "- large-v1 (1550 MB)"
echo "- large-v2 (1550 MB)"
echo "- large-v3 (1550 MB)"
echo "- large-v3-turbo (1550 MB) - 최신 빠른 버전"

# 4. 모델 테스트
echo -e "\n🧪 모델 테스트 (작은 오디오 파일 생성):"

# 임시 오디오 파일 생성 (1초 무음)
TEMP_AUDIO="/tmp/whisper_model_test.wav"
ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 1 -acodec pcm_s16le "$TEMP_AUDIO" -y 2>/dev/null

# 각 모델로 테스트
echo -e "\n테스트할 모델을 선택하세요:"
echo "1) tiny"
echo "2) base"
echo "3) small"
echo "4) medium"
echo "5) large"
echo "6) large-v3"
echo "7) large-v3-turbo"
echo "8) 환경변수 설정 모델 (${LOCAL_WHISPER_MODEL_SIZE:-medium})"

read -p "선택 (1-8): " choice

case $choice in
    1) MODEL="tiny";;
    2) MODEL="base";;
    3) MODEL="small";;
    4) MODEL="medium";;
    5) MODEL="large";;
    6) MODEL="large-v3";;
    7) MODEL="large-v3-turbo";;
    8) MODEL="${LOCAL_WHISPER_MODEL_SIZE:-medium}";;
    *) MODEL="base";;
esac

echo -e "\n🚀 $MODEL 모델로 테스트 중..."
echo "명령어: whisper \"$TEMP_AUDIO\" --model $MODEL --language ko"

# 시간 측정 시작
START_TIME=$(date +%s)

# Whisper 실행
whisper "$TEMP_AUDIO" --model "$MODEL" --language ko --output_format txt --output_dir /tmp 2>&1 | grep -E "(Downloading|Using|Model|Loading)"

# 시간 측정 종료
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n⏱️  처리 시간: ${ELAPSED}초"

# 정리
rm -f "$TEMP_AUDIO" /tmp/whisper_model_test.txt

echo -e "\n✅ 테스트 완료!"
echo "실제 사용된 모델: $MODEL"

# 5. 권장사항
echo -e "\n💡 권장사항:"
echo "- 개발/테스트: base 또는 small"
echo "- 일반 용도: medium"
echo "- 높은 정확도: large-v3"
echo "- 빠른 처리 + 정확도: large-v3-turbo (권장)"

# 6. 환경변수 설정 방법
echo -e "\n⚙️  모델 변경 방법:"
echo "1. .env 파일 수정:"
echo "   LOCAL_WHISPER_MODEL_SIZE=large-v3-turbo"
echo ""
echo "2. 서버 재시작:"
echo "   npm run dev:server"