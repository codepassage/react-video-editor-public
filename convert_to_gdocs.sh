#!/bin/bash
# convert_to_gdocs.sh
# 마크다운 파일들을 구글 독스에서 가져올 수 있는 형식으로 변환

# 필요한 도구 확인
if ! command -v pandoc &> /dev/null; then
    echo "Pandoc이 설치되어 있지 않습니다."
    echo "설치 방법:"
    echo "  macOS: brew install pandoc"
    echo "  Ubuntu: sudo apt-get install pandoc"
    exit 1
fi

# 출력 디렉토리 생성
OUTPUT_DIR="./report/design/gdocs_format"
mkdir -p "$OUTPUT_DIR"

# 마크다운 파일 목록
MD_FILES=(
    "01_프로젝트_구조_분석.md"
    "02_소프트웨어_아키텍처.md"
    "03_기술스택_및_의존성_분석.md"
    "04_운영_및_관리_가이드.md"
    "05_API_및_데이터흐름.md"
    "README.md"
)

echo "📚 마크다운 → DOCX 변환 시작..."

# 각 파일 변환
for file in "${MD_FILES[@]}"; do
    if [ -f "./report/design/$file" ]; then
        output_name="${file%.md}.docx"
        echo "변환 중: $file → $output_name"
        
        pandoc "./report/design/$file" \
            -o "$OUTPUT_DIR/$output_name" \
            --reference-doc=template.docx \
            --highlight-style=tango \
            --toc \
            --toc-depth=3
        
        if [ $? -eq 0 ]; then
            echo "✅ 완료: $output_name"
        else
            echo "❌ 실패: $file"
        fi
    else
        echo "⚠️  파일 없음: $file"
    fi
done

echo ""
echo "✨ 변환 완료!"
echo "📁 결과 위치: $OUTPUT_DIR"
echo ""
echo "🔄 구글 독스로 가져오기:"
echo "1. Google Drive 열기"
echo "2. '새로 만들기' → '파일 업로드'"
echo "3. $OUTPUT_DIR 내의 DOCX 파일 선택"
echo "4. 업로드 후 '구글 문서로 열기' 선택"
