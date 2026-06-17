#!/bin/bash

echo "🎯 Whisper 캐시 관리 도구"
echo "========================"

CACHE_DIR="server/uploads/whisper"

# 현재 캐시 상태 확인
echo -e "\n📊 현재 캐시 상태:"
if [ -d "$CACHE_DIR" ]; then
    CACHE_COUNT=$(find "$CACHE_DIR" -name "*.json" 2>/dev/null | wc -l)
    CACHE_SIZE=$(du -sh "$CACHE_DIR" 2>/dev/null | awk '{print $1}')
    echo "- 캐시 파일 수: $CACHE_COUNT개"
    echo "- 캐시 크기: $CACHE_SIZE"
    
    # 모델별 캐시 통계
    echo -e "\n📈 모델별 캐시 분석:"
    for json_file in "$CACHE_DIR"/*.json; do
        if [ -f "$json_file" ]; then
            MODEL=$(jq -r '.model // "구버전"' "$json_file" 2>/dev/null || echo "읽기실패")
            echo "$MODEL"
        fi
    done | sort | uniq -c | awk '{print "  - " $2 ": " $1 "개"}'
else
    echo "❌ 캐시 디렉토리가 없습니다."
fi

echo -e "\n🔧 관리 옵션:"
echo "1) 캐시 상태 확인 (현재 화면)"
echo "2) 구버전 캐시 정리"
echo "3) 특정 모델의 캐시만 삭제"
echo "4) 전체 캐시 삭제"
echo "5) 캐시 백업"
echo "6) 종료"

read -p "선택 (1-6): " choice

case $choice in
    1)
        # 이미 표시됨
        ;;
    
    2)
        echo -e "\n🧹 구버전 캐시 정리 중..."
        COUNT=0
        for json_file in "$CACHE_DIR"/*.json; do
            if [ -f "$json_file" ]; then
                # 배열 형태인지 확인 (구버전)
                if jq -e 'type == "array"' "$json_file" >/dev/null 2>&1; then
                    rm "$json_file"
                    ((COUNT++))
                fi
            fi
        done
        echo "✅ $COUNT개의 구버전 캐시 파일을 삭제했습니다."
        ;;
    
    3)
        echo -e "\n🎯 삭제할 모델을 선택하세요:"
        # 현재 캐시된 모델 목록
        MODELS=$(for f in "$CACHE_DIR"/*.json; do
            [ -f "$f" ] && jq -r '.model // "구버전"' "$f" 2>/dev/null
        done | sort | uniq)
        
        if [ -z "$MODELS" ]; then
            echo "캐시된 모델이 없습니다."
        else
            echo "$MODELS" | nl -w2 -s') '
            read -p "모델 이름 입력: " MODEL_NAME
            
            COUNT=0
            for json_file in "$CACHE_DIR"/*.json; do
                if [ -f "$json_file" ]; then
                    FILE_MODEL=$(jq -r '.model // ""' "$json_file" 2>/dev/null)
                    if [ "$FILE_MODEL" == "$MODEL_NAME" ]; then
                        rm "$json_file"
                        ((COUNT++))
                    fi
                fi
            done
            echo "✅ $MODEL_NAME 모델의 캐시 $COUNT개를 삭제했습니다."
        fi
        ;;
    
    4)
        read -p "⚠️  정말로 전체 캐시를 삭제하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$CACHE_DIR"/*.json
            echo "✅ 전체 캐시가 삭제되었습니다."
        else
            echo "❌ 취소되었습니다."
        fi
        ;;
    
    5)
        BACKUP_DIR="$CACHE_DIR/backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp "$CACHE_DIR"/*.json "$BACKUP_DIR/" 2>/dev/null
        BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.json 2>/dev/null | wc -l)
        echo "✅ $BACKUP_COUNT개의 캐시 파일을 백업했습니다: $BACKUP_DIR"
        ;;
    
    6)
        echo "👋 종료합니다."
        exit 0
        ;;
    
    *)
        echo "❌ 잘못된 선택입니다."
        ;;
esac

echo -e "\n💡 팁:"
echo "- 모델을 변경한 후에는 이전 모델의 캐시가 자동으로 무시됩니다"
echo "- 구버전 캐시는 자동으로 삭제되어 새로운 형식으로 재생성됩니다"
echo "- 캐시는 처리 속도를 크게 향상시키므로 필요한 경우에만 삭제하세요"