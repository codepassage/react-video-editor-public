#!/bin/bash

echo "🧪 Whisper 타이밍 정확도 테스트"
echo "================================"

# 테스트용 오디오 파일
TEST_AUDIO="server/uploads/b77df39d-aa24-4651-9db3-4b1106d6c961-ko_liveacademy_sample_3.wav"

if [ ! -f "$TEST_AUDIO" ]; then
    echo "❌ 테스트 오디오 파일이 없습니다: $TEST_AUDIO"
    exit 1
fi

# 환경변수에서 모델 읽기 (서버와 동일한 로직)
MODEL_SIZE="${LOCAL_WHISPER_MODEL_SIZE:-medium}"

echo "📋 설정 정보:"
echo "- 환경변수 LOCAL_WHISPER_MODEL_SIZE: ${LOCAL_WHISPER_MODEL_SIZE:-설정되지 않음}"
echo "- 실제 사용될 모델: $MODEL_SIZE"
echo "- 테스트 파일: $(basename "$TEST_AUDIO")"

# 출력 디렉토리
OUTPUT_DIR="/tmp/whisper_timing_test_$(date +%s)"
mkdir -p "$OUTPUT_DIR"

echo -e "\n🚀 Whisper 실행 중..."
echo "명령어: whisper \"$TEST_AUDIO\" --model $MODEL_SIZE --language ko --output_format json --word_timestamps True --output_dir \"$OUTPUT_DIR\""

# 시간 측정
START_TIME=$(date +%s)

# Whisper 실행 (서버와 동일한 옵션)
whisper "$TEST_AUDIO" \
    --model "$MODEL_SIZE" \
    --language ko \
    --output_format json \
    --word_timestamps True \
    --output_dir "$OUTPUT_DIR" \
    --task transcribe 2>&1 | tee "$OUTPUT_DIR/whisper.log"

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n⏱️  처리 시간: ${ELAPSED}초"

# 결과 파일 찾기
JSON_FILE=$(find "$OUTPUT_DIR" -name "*.json" | head -1)

if [ -f "$JSON_FILE" ]; then
    echo -e "\n📊 결과 분석:"
    
    # 세그먼트 수
    SEGMENT_COUNT=$(jq '.segments | length' "$JSON_FILE")
    echo "- 세그먼트 수: $SEGMENT_COUNT"
    
    # 첫 번째 세그먼트의 단어 수
    WORD_COUNT=$(jq '.segments[0].words | length' "$JSON_FILE" 2>/dev/null || echo "0")
    echo "- 첫 세그먼트 단어 수: $WORD_COUNT"
    
    # 단어별 타이밍 샘플
    echo -e "\n🔤 단어별 타이밍 샘플 (첫 3개):"
    jq -r '.segments[0].words[:3] | .[] | "  - \(.word): \(.start)s ~ \(.end)s (신뢰도: \(.probability))"' "$JSON_FILE" 2>/dev/null || echo "  단어 타이밍 없음"
    
    # 전체 텍스트
    echo -e "\n📝 인식된 전체 텍스트:"
    jq -r '.text' "$JSON_FILE" | head -c 200
    echo "..."
    
    # 결과 파일 위치
    echo -e "\n💾 전체 결과 파일: $JSON_FILE"
else
    echo "❌ 결과 파일을 찾을 수 없습니다."
fi

# 로그에서 사용된 모델 확인
echo -e "\n🔍 실제 사용된 모델 확인:"
grep -i "model\|loading\|using" "$OUTPUT_DIR/whisper.log" | head -5

echo -e "\n✅ 테스트 완료!"

# 정리 옵션
read -p "임시 파일을 삭제하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$OUTPUT_DIR"
    echo "🗑️  임시 파일 삭제됨"
else
    echo "📁 결과 파일 위치: $OUTPUT_DIR"
fi