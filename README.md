# React Video Editor 🎬

이미지, 동영상, 텍스트, 음성 등을 타임라인에 배치해 영상을 편집하고,
편집한 템플릿으로 영상을 자동 생성하는 것을 목표로 하는 React 기반 비디오 에디터입니다.

## ✨ 주요 기능

- 🎥 **Remotion Player 기반**: 고품질 비디오 렌더링
- 🎛️ **다중 트랙 타임라인**: 레이어 시스템으로 복잡한 편집 가능
- 📁 **미디어 라이브러리**: 이미지, 비디오, 오디오 파일 업로드 및 관리
- ✂️ **드래그 앤 드롭**: 직관적인 클립 배치 및 이동
- 🎨 **텍스트 편집**: 다양한 텍스트 스타일 및 애니메이션
- 🔄 **실시간 미리보기**: 즉시 결과 확인
- 💾 **프로젝트 저장**: 작업 내용 저장 및 불러오기

## 🚀 빠른 시작

### 1. 기본 실행 (추천)

```bash
# 프로젝트 디렉토리로 이동
cd react-video-editor

# 실행 권한 부여 (처음 한 번만)
chmod +x start_fullstack.sh

# 풀스택 서버 실행
./start_fullstack.sh
```

### 2. 수동 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (프론트엔드 + 백엔드)
npm run dev

# 또는 개별 실행
npm run dev:client    # 프론트엔드만
npm run dev:server    # 백엔드만
```

## 🔧 포트 설정

### 자동 포트 감지
스크립트는 `.env` 파일에서 포트를 자동으로 읽어옵니다:

```env
VITE_PORT=3004          # 프론트엔드 포트
VITE_BACKEND_PORT=5002  # 백엔드 포트
```

### 포트 변경하기

```bash
# 포트 변경 헬퍼 스크립트 실행
chmod +x change_ports.sh
./change_ports.sh
```

또는 직접 `.env` 파일을 편집:

```env
# 원하는 포트로 변경
VITE_PORT=8080
VITE_BACKEND_PORT=8081
VITE_API_URL=http://localhost:8081
```

변경 후 서버 재시작:
```bash
./start_fullstack.sh
```

## 📂 프로젝트 구조

```
react-video-editor/
├── src/                          # 프론트엔드 소스
│   ├── components/               # React 컴포넌트
│   │   ├── player/              # 비디오 플레이어
│   │   ├── timeline/            # 타임라인 관련
│   │   └── properties/          # 속성 편집 패널
│   ├── remotion/                # Remotion 컴포지션
│   ├── store/                   # 상태 관리 (Zustand)
│   └── types/                   # TypeScript 타입 정의
├── server/                      # 백엔드 (Express)
│   ├── index.ts                 # 서버 메인 파일
│   ├── uploads/                 # 업로드된 파일들
│   └── projects/                # 저장된 프로젝트들
├── start_fullstack.sh           # 풀스택 실행 스크립트
├── change_ports.sh              # 포트 변경 헬퍼
└── .env                         # 환경 변수 설정
```

## 🛠️ 개발 가이드

### 기술 스택
- **Frontend**: React 18 + TypeScript + Vite
- **Video Engine**: Remotion 4.0
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Drag & Drop**: React DnD
- **Backend**: Express + TypeScript
- **File Upload**: Multer

### 환경 변수

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `VITE_PORT` | 3004 | 프론트엔드 포트 |
| `VITE_BACKEND_PORT` | 5002 | 백엔드 포트 |
| `VITE_API_URL` | http://localhost:5002 | API 서버 URL |
| `NODE_ENV` | development | 실행 환경 |

### 스크립트 명령어

| 명령어 | 설명 |
|--------|------|
| `./start_fullstack.sh` | 풀스택 서버 실행 (추천) |
| `./change_ports.sh` | 포트 설정 변경 |
| `npm run dev` | 개발 서버 실행 |
| `npm run dev:client` | 프론트엔드만 실행 |
| `npm run dev:server` | 백엔드만 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run remotion:dev` | Remotion 스튜디오 |

## 🎯 사용법

### 1. 미디어 업로드
- 좌측 "Upload Files" 버튼 클릭
- 이미지, 비디오, 오디오 파일 선택
- 드래그 앤 드롭으로도 업로드 가능

### 2. 타임라인 편집
- 업로드된 미디어를 타임라인으로 드래그
- 클립을 드래그하여 위치 조정
- 클립 가장자리를 드래그하여 길이 조정
- 다중 선택: Ctrl/Cmd + 클릭

### 3. 텍스트 추가
- "Add Text" 버튼 클릭
- 텍스트를 타임라인으로 드래그
- 우측 속성 패널에서 텍스트 편집

### 4. 프로젝트 저장
- 작업 완료 후 저장 버튼 클릭
- 프로젝트 이름 입력
- 나중에 불러와서 계속 편집 가능

## 🔍 디버깅

개발 모드에서는 상세한 디버깅 정보가 표시됩니다:

- **Player 영역**: 실시간 트랙/클립 정보
- **브라우저 콘솔**: 상세 로그 (F12 → Console)
- **VideoComposition**: 클립 렌더링 상태

문제 발생 시 브라우저 콘솔을 확인해주세요.

## 🚨 문제 해결

### 포트 충돌
```bash
# 포트 사용 확인
lsof -i :3004
lsof -i :5002

# 프로세스 강제 종료
./start_fullstack.sh  # 자동으로 기존 프로세스 종료
```

### CORS 에러
- `.env` 파일의 포트 설정 확인
- 백엔드가 프론트엔드 포트를 허용하는지 확인
- `start_fullstack.sh`로 재시작

### 비디오 플레이어 빈 화면
- 브라우저 콘솔에서 에러 확인
- 클립이 타임라인에 추가되었는지 확인
- 현재 시간이 클립 범위 내에 있는지 확인

## 📄 라이선스

이 프로젝트는 개발 및 학습 목적으로 제작되었습니다.

## 🤝 기여하기

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

**Happy Video Editing! 🎬✨**
