#!/bin/bash

# JSON 기반 동영상 자동 생성 스크립트
# 사용법: ./auto-render.sh [PROJECT_DIR] [OUTPUT_DIR] [QUALITY]

# 기본 설정
PROJECT_DIR="${1:-./projects}"
OUTPUT_DIR="${2:-./final-videos}"
QUALITY="${3:-20}"

echo "🎬 자동 동영상 생성 시작..."
echo "📁 프로젝트 디렉토리: $PROJECT_DIR"
echo "📤 출력 디렉토리: $OUTPUT_DIR"
echo "🎯 품질 설정: $QUALITY (낮을수록 고품질)"
echo ""

# 디렉토리 존재 확인
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 프로젝트 디렉토리를 찾을 수 없습니다: $PROJECT_DIR"
    exit 1
fi

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

# JSON 파일 찾기
json_files=("$PROJECT_DIR"/*.json)

if [ ! -e "${json_files[0]}" ]; then
    echo "❌ JSON 파일을 찾을 수 없습니다: $PROJECT_DIR/*.json"
    exit 1
fi

echo "📋 찾은 JSON 파일: ${#json_files[@]}개"
echo ""

# 시작 시간 기록
start_time=$(date +%s)
success_count=0
failed_count=0

# 각 JSON 파일 처리
for json_file in "${json_files[@]}"; do
    if [ -f "$json_file" ]; then
        filename=$(basename "$json_file" .json)
        output_file="$OUTPUT_DIR/$filename.mp4"
        
        echo "🎥 렌더링: $filename"
        echo "   입력: $json_file"
        echo "   출력: $output_file"
        
        # 렌더링 실행
        if npm run render:json "$json_file" --output "$output_file" --quality "$QUALITY"; then
            echo "✅ 성공: $filename"
            ((success_count++))
        else
            echo "❌ 실패: $filename"
            ((failed_count++))
        fi
        
        echo ""
    fi
done

# 완료 시간 및 통계
end_time=$(date +%s)
total_time=$((end_time - start_time))
minutes=$((total_time / 60))
seconds=$((total_time % 60))

echo "🎉 자동 동영상 생성 완료!"
echo "📊 결과 요약:"
echo "   ✅ 성공: $success_count개"
echo "   ❌ 실패: $failed_count개"
echo "   ⏱️ 총 소요시간: ${minutes}분 ${seconds}초"

if [ $success_count -gt 0 ]; then
    avg_time=$((total_time / success_count))
    echo "   📈 평균 렌더링 시간: ${avg_time}초/파일"
fi

echo ""
echo "📁 생성된 동영상 위치: $(realpath "$OUTPUT_DIR")"

# 결과에 따른 종료 코드
if [ $failed_count -eq 0 ]; then
    echo "🎯 모든 파일이 성공적으로 렌더링되었습니다!"
    exit 0
else
    echo "⚠️ 일부 파일 렌더링에 실패했습니다."
    exit 1
fi
