# React Video Editor v1

## 🎬 비디오 내보내기 기능 사용 방법

### 1. 필수 설정 (최초 1회)

내보내기 기능을 사용하기 전에 Remotion 번들을 생성해야 합니다:

```bash
# Remotion 번들 생성
npm run bundle
```

**또는** 전체 빌드:

```bash
# 전체 프로젝트 빌드 (Remotion 번들 포함)
npm run build
```

### 2. 개발 서버 실행

```bash
# 개발 서버 시작 (프론트엔드 + 백엔드)
npm run dev
```

### 3. 내보내기 사용법

1. 미디어 라이브러리에서 파일 업로드
2. 타임라인으로 미디어 드래그 앤 드롭
3. 편집 완료 후 상단 "내보내기" 버튼 클릭
4. 렌더링 진행률 확인
5. 완료 시 자동 다운로드

## 🛠️ 주요 스크립트

```bash
npm run dev          # 개발 서버 실행
npm run bundle       # Remotion 번들 생성
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과 미리보기
```

## 📁 프로젝트 구조

```
src/
├── components/      # React 컴포넌트
├── remotion/        # Remotion 컴포지션
├── store/           # 상태 관리 (Zustand)
└── types/           # TypeScript 타입 정의

server/
├── uploads/         # 업로드된 미디어 파일
├── projects/        # 저장된 프로젝트
└── renders/         # 렌더링된 비디오 파일
```

## 🎯 지원 기능

- ✅ 드래그 앤 드롭 편집
- ✅ 실시간 미리보기  
- ✅ 다중 트랙 지원
- ✅ 텍스트, 이미지, 비디오, 오디오 지원
- ✅ 속성 편집 (위치, 크기, 투명도 등)
- ✅ 고품질 MP4 내보내기
- ✅ 다양한 해상도 지원 (HD, Full HD, 4K)

## 🚨 문제 해결

### "@remotion/tailwind" 모듈 없음 에러

이 에러는 이미 해결되었습니다. 만약 발생한다면:

```bash
# 해결 방법
npm install
npm run bundle
```

### "Remotion bundle not found" 에러

```bash
# 해결 방법
npm run bundle
```

### 렌더링이 느린 경우

- 클립 수가 많은 경우 렌더링 시간이 오래 걸릴 수 있습니다
- 고해상도 설정은 더 많은 시간이 소요됩니다
- 시스템 리소스(CPU, 메모리) 확인

### 포트 충돌

기본 포트 설정:
- 프론트엔드: 3004
- 백엔드: 5002

`.env` 파일에서 포트 변경 가능:
```
VITE_PORT=3004
VITE_BACKEND_PORT=5002
```

## 📋 시스템 요구사항

- Node.js 18+
- npm 8+
- 충분한 디스크 공간 (렌더링된 비디오 저장용)
- 메모리 4GB+ 권장

## 🎨 렌더링 품질 설정

`remotion.config.ts`에서 품질 조정 가능:

```typescript
Config.setCrf(18);        // 낮을수록 고품질 (파일 크기 증가)
Config.setQuality(90);    // 이미지 품질 (1-100)
Config.setAudioBitrate('320k'); // 오디오 품질
```
