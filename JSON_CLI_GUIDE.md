# JSON 기반 커맨드라인 동영상 생성 시스템 사용 가이드

**구현 완료 일시**: 2025-06-14 (토) 03:30  
**시스템 상태**: ✅ **완전 구현 완료**

---

## 🎯 완성된 기능들

### **✅ 1. 웹 UI JSON 내보내기/가져오기**
- Header에 "JSON 내보내기", "JSON 불러오기" 버튼 추가
- 프로젝트 데이터를 JSON 파일로 저장/로드
- 안전한 데이터 검증 및 오류 처리

### **✅ 2. 커맨드라인 렌더링 스크립트**
- `scripts/renderFromJSON.ts`: 단일 JSON 파일 → 동영상 변환
- 완전한 CLI 인터페이스 (도움말, 옵션 파싱, 진행률 표시)
- 서버 로직 재사용으로 웹 편집기와 동일한 결과 보장

### **✅ 3. 배치 렌더링 시스템**
- `scripts/batchRender.ts`: 여러 JSON 파일 동시 처리
- 진행률 추적, 에러 처리, 상세 결과 리포트

### **✅ 4. 자동화 스크립트**
- `auto-render.sh`: 원클릭 배치 렌더링
- 크로스 플랫폼 호환성 및 사용자 친화적 인터페이스

---

## 🚀 사용 방법

### **1. 웹에서 프로젝트 편집 및 JSON 저장**

1. **편집 작업**: 웹 편집기에서 비디오, 이미지, 텍스트, Shape 클립 추가 및 편집
2. **JSON 내보내기**: Header의 "JSON 내보내기" 버튼 클릭
3. **파일 저장**: `project-2025-06-14-1234567890.json` 형태로 자동 다운로드

### **2. 커맨드라인에서 동영상 생성**

#### **기본 렌더링**
```bash
npm run render:json project.json
```

#### **고품질 렌더링**
```bash
npm run render:json project.json --output high-quality.mp4 --quality 15
```

#### **상세 로그와 함께**
```bash
npm run render:json project.json --verbose
```

#### **모든 옵션 사용**
```bash
npm run render:json project.json \
  --output ./videos/my-video.mp4 \
  --quality 20 \
  --port 5003 \
  --verbose
```

### **3. 배치 렌더링 (여러 파일 동시 처리)**

#### **기본 배치 렌더링**
```bash
npm run render:batch ./json-projects
```

#### **출력 디렉토리 지정**
```bash
npm run render:batch ./json-projects ./output-videos
```

#### **고품질 배치 렌더링**
```bash
npm run render:batch ./projects ./videos --quality 18 --verbose
```

### **4. 자동화 스크립트 사용**

#### **실행 권한 부여 (최초 1회)**
```bash
chmod +x auto-render.sh
```

#### **자동 렌더링 실행**
```bash
# 기본 설정으로 실행
./auto-render.sh

# 커스텀 설정으로 실행
./auto-render.sh ./my-projects ./my-videos 22
```

---

## 📋 CLI 옵션 상세 가이드

### **render:json 옵션**
| 옵션 | 단축 | 설명 | 기본값 | 예시 |
|------|------|------|--------|------|
| `--output` | `-o` | 출력 파일 경로 | `./renders/render-{timestamp}.mp4` | `-o my-video.mp4` |
| `--quality` | `-q` | 비디오 품질 (1-51) | `28` | `-q 20` (고품질) |
| `--fps` | | FPS 오버라이드 | 프로젝트 설정 사용 | `--fps 60` |
| `--port` | `-p` | 서버 포트 | `5002` | `-p 5003` |
| `--verbose` | `-v` | 상세 로그 | false | `-v` |

### **render:batch 옵션**
| 옵션 | 단축 | 설명 | 기본값 | 예시 |
|------|------|------|--------|------|
| `input-dir` | | JSON 파일 디렉토리 | 필수 | `./projects` |
| `output-dir` | | 출력 동영상 디렉토리 | `./batch-renders` | `./videos` |
| `--quality` | `-q` | 비디오 품질 (1-51) | `25` | `-q 20` |
| `--port` | `-p` | 서버 포트 | `5002` | `-p 5003` |
| `--verbose` | `-v` | 상세 로그 | false | `-v` |

---

## 🎯 품질 설정 가이드

| CRF 값 | 품질 | 파일 크기 | 용도 |
|--------|------|-----------|------|
| 15-18 | 매우 높음 | 매우 큼 | 최종 마스터, 아카이브 |
| 20-23 | 높음 | 큼 | 프로덕션, 유튜브 업로드 |
| 25-28 | 보통 | 보통 | 일반 용도, 테스트 |
| 30-35 | 낮음 | 작음 | 빠른 프리뷰, 초안 |

---

## 📁 디렉토리 구조

```
프로젝트/
├── src/utils/projectExport.ts          # JSON 내보내기/가져오기 유틸리티
├── scripts/
│   ├── renderFromJSON.ts               # 단일 JSON 렌더링
│   └── batchRender.ts                  # 배치 렌더링
├── auto-render.sh                      # 자동화 스크립트
├── projects/                           # JSON 프로젝트 파일 (예시)
├── renders/                            # 단일 렌더링 출력
├── batch-renders/                      # 배치 렌더링 출력
└── server/uploads/                     # 미디어 파일 (렌더링 시 필요)
```

---

## 🔧 고급 사용법

### **1. 템플릿 기반 대량 생성**
```bash
# 1. 기본 템플릿 JSON 생성
# 2. 텍스트나 이미지만 다르게 여러 버전 생성
# 3. 배치 렌더링으로 모든 버전 동시 생성
npm run render:batch ./templates ./final-videos --quality 22
```

### **2. CI/CD 파이프라인 통합**
```bash
# GitHub Actions, Jenkins 등에서 사용
npm run render:json "$INPUT_JSON" --output "$OUTPUT_PATH" --quality 25
```

### **3. 야간 배치 작업**
```bash
# cron 작업으로 예약
0 2 * * * /path/to/project/auto-render.sh /path/to/projects /path/to/output 20
```

### **4. 다양한 품질로 동시 생성**
```bash
# 스크립트 예시
for quality in 15 22 28; do
    npm run render:json project.json --output "video-q${quality}.mp4" --quality $quality
done
```

---

## ⚡ 성능 최적화 팁

### **1. 렌더링 속도 향상**
- `--quality 28-30`: 빠른 테스트용
- 미디어 파일을 로컬 서버(`/uploads`)에 배치
- SSD 사용 권장

### **2. 메모리 사용량 관리**
- 배치 렌더링 시 동시 처리 제한
- 큰 프로젝트는 개별 렌더링 권장

### **3. 디스크 공간 관리**
- 렌더링 완료 후 임시 파일 정리
- 출력 디렉토리 주기적 정리

---

## 🚨 문제 해결

### **일반적인 오류들**

#### **1. "JSON 파일을 찾을 수 없습니다"**
```bash
# 해결 방법
ls -la *.json  # 파일 존재 확인
npm run render:json ./path/to/project.json  # 절대 경로 사용
```

#### **2. "미디어 파일 로딩 실패"**
```bash
# 해결 방법 1: 서버 포트 확인
npm run render:json project.json --port 5002

# 해결 방법 2: uploads 디렉토리 확인
ls -la server/uploads/

# 해결 방법 3: 서버 실행 확인
npm run dev:server
```

#### **3. "번들 생성 실패"**
```bash
# 해결 방법
npm run bundle  # 수동 번들 생성
npm run render:json project.json  # 다시 시도
```

#### **4. "메모리 부족"**
```bash
# 해결 방법: Node.js 메모리 제한 증가
node --max-old-space-size=4096 node_modules/.bin/ts-node scripts/renderFromJSON.ts project.json
```

---

## 🎉 완성된 워크플로우

### **완전한 유튜브 동영상 자동 생성 파이프라인**

1. **📝 편집**: 웹 편집기에서 템플릿 생성
2. **💾 저장**: JSON으로 내보내기
3. **🔄 자동화**: 템플릿 기반 변형 생성 (스크립트/API)
4. **🎬 렌더링**: 배치 렌더링으로 대량 생성
5. **📤 업로드**: YouTube API 연동 (향후 확장)

이제 **웹 편집 → JSON 저장 → 커맨드라인 렌더링**의 완전한 워크플로우가 구축되었습니다! 🎯
