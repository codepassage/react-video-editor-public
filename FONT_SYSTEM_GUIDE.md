# 🎨 한글 폰트 시스템 완벽 가이드

React Video Editor에서 한글 폰트를 완벽하게 지원하는 동적 폰트 시스템입니다.

## ✨ 주요 특징

- **🔄 동적 폰트 스캔**: 서버의 모든 폰트를 자동으로 감지하고 로드
- **🚀 자동 초기화**: 클라이언트 시작 시 폰트 시스템 자동 설정
- **📦 프로젝트 기반 로딩**: 프로젝트에서 사용된 폰트만 선택적 로드
- **🎬 렌더링 최적화**: 내보내기 시 서버에서 폰트 경로 자동 매핑
- **💨 Fallback 체인**: 폰트 로딩 실패 시 적절한 대체 폰트 제공

## 📁 파일 구조

```
📂 폰트 시스템 파일들
├── 🗄️ server/font/                    # 서버 폰트 디렉토리
│   ├── fonts.css                     # 폰트 CSS 정의
│   ├── BM-fonts-package/             # BM 폰트 컬렉션
│   └── nanum-fonts/                  # 나눔 폰트 컬렉션
├── 🔧 src/utils/
│   ├── fontLoader.ts                 # 핵심 폰트 로딩 시스템
│   └── FontPreloader.tsx             # React 폰트 프리로더 컴포넌트
├── 📊 src/data/fonts.ts              # 동적 폰트 컬렉션 관리
├── 🎬 src/render/
│   ├── RenderComposition.tsx         # 렌더링 시 폰트 처리
│   └── index.ts                      # 렌더링 엔트리포인트
└── 🎨 src/remotion/utils/
    └── textEffects.utils.ts          # 텍스트 스타일링 + 폰트 처리
```

## 🚀 사용법

### 1. 기본 사용법

```tsx
import { 
  initializeFontSystem, 
  loadFont, 
  getAvailableFonts 
} from './utils/fontLoader';

// 폰트 시스템 초기화
await initializeFontSystem();

// 사용 가능한 폰트 목록 확인
const fonts = getAvailableFonts();
console.log('사용 가능한 폰트:', fonts);

// 특정 폰트 로드
await loadFont('Nanum Gothic', '400');
```

### 2. React 컴포넌트에서 사용

```tsx
import { FontPreloader, useFontLoadingStatus } from './utils/FontPreloader';

function MyComponent() {
  const { stats, isReady } = useFontLoadingStatus();
  
  return (
    <div>
      <FontPreloader 
        fontFamilies={['Nanum Gothic', 'BM Hanna Pro']}
        onLoadComplete={(result) => {
          console.log(`${result.loaded}/${result.requested} 폰트 로드 완료`);
        }}
      />
      
      {isReady && (
        <p style={{ fontFamily: 'Nanum Gothic' }}>
          한글 폰트가 적용된 텍스트
        </p>
      )}
    </div>
  );
}
```

### 3. 프로젝트 기반 폰트 로딩

```tsx
import { preloadProjectFonts } from './utils/fontLoader';

// 프로젝트 트랙에서 사용된 폰트들만 로드
await preloadProjectFonts(projectTracks);
```

## 🎬 렌더링 시 폰트 처리

### 클라이언트 렌더링
- 자동으로 `/font` 경로를 통해 서버 폰트에 액세스
- Vite 프록시를 통해 개발 환경에서 원활한 폰트 로딩

### 서버 렌더링 (내보내기)
- 서버에서 폰트 경로를 절대 경로로 매핑
- 환경변수를 통해 Remotion에 폰트 정보 전달
- FFmpeg 렌더링 시 폰트 파일 직접 참조

## 📊 지원 폰트 목록

### 🏢 나눔 폰트 패밀리
- **고딕체**: Nanum Gothic, Nanum Gothic Eco, Nanum Barun Gothic
- **스퀘어**: Nanum Square, Nanum Square Round, Nanum Square Neo
- **명조체**: Nanum Myeongjo, Nanum Myeongjo Eco
- **손글씨**: Nanum Brush, Nanum Pen, Nanum Barun Pen
- **휴먼**: Nanum Human (200~900 weight)

### 🎨 BM 폰트 패밀리 
- **기본**: BM DoHyeon, BM Jua, BM Yeonsung
- **한나체**: BM Hanna Air, BM Hanna Pro, BM Hanna 11years
- **을지로**: BM Euljiro, BM Euljiro 10years Later, BM Euljiro Oraeorae
- **특수**: BM Kirang Haerang, BM Kkubulim

### 💻 코딩 폰트
- **D2 Coding**: 프로그래밍에 최적화된 한글 코딩 폰트

## 🔧 설정 및 환경변수

### 클라이언트 환경변수 (.env)
```env
# 서버 포트 설정
VITE_PORT=3009
VITE_BACKEND_PORT=5009

# 폰트 서버 URL
VITE_API_URL=http://localhost:5009
VITE_FONT_SERVER_URL=http://localhost:5009
```

### 서버 환경변수
```env
# 렌더링 시 폰트 처리를 위한 환경변수들
REMOTION_FONT_BASE_URL=http://localhost:5009
REMOTION_SERVER_PORT=5009
REMOTION_FONT_DIR=/path/to/fonts
REMOTION_FONT_MAPPINGS={"font-family":"font-path"}
```

## 🔧 고급 설정

### 1. 폰트 디버깅
```javascript
import { debugFontLoading, getFontLoadingStats } from './utils/fontLoader';

// 폰트 시스템 디버그 정보 출력
debugFontLoading('Nanum Gothic');

// 폰트 로딩 통계 확인
const stats = getFontLoadingStats();
console.log('폰트 통계:', stats);
```

### 2. 성능 측정
```javascript
import { measureFontLoadingPerformance } from './utils/FontPreloader';

const performance = await measureFontLoadingPerformance([
  'Nanum Gothic',
  'BM Hanna Pro'
]);

console.log('폰트 로딩 성능:', performance);
```

### 3. 커스텀 폰트 추가
1. `server/font/` 디렉토리에 폰트 파일 추가
2. `server/font/fonts.css`에 `@font-face` 정의 추가
3. 서버 재시작 후 자동으로 감지됨

## 🚨 문제 해결

### 폰트가 로드되지 않는 경우
1. 브라우저 개발자 도구에서 네트워크 탭 확인
2. `/api/fonts` 엔드포인트 호출 결과 확인
3. 폰트 파일 경로와 권한 확인

### 렌더링 시 폰트가 적용되지 않는 경우
1. 서버 로그에서 폰트 매핑 확인
2. `REMOTION_FONT_MAPPINGS` 환경변수 확인
3. 폰트 파일의 절대 경로 확인

### 성능 최적화
1. 프로젝트 기반 폰트 로딩 사용
2. 불필요한 폰트 weight 제거
3. 폰트 캐싱 활용

## 📈 시스템 모니터링

### API 엔드포인트
- `GET /api/fonts` - 사용 가능한 폰트 목록
- `GET /api/health` - 서버 상태 및 폰트 시스템 정보

### 로그 모니터링
```bash
# 폰트 관련 로그 필터링
tail -f server.log | grep "🎨\|Font\|폰트"
```

## 🤝 기여하기

폰트 시스템 개선에 기여하려면:

1. 새로운 폰트 포맷 지원 (WOFF2, OTF 등)
2. 폰트 서브셋팅 기능 추가
3. 폰트 로딩 성능 최적화
4. 추가 언어 지원 (일본어, 중국어 등)

---

**💡 팁**: 폰트 시스템은 자동으로 초기화되지만, 수동으로 제어가 필요한 경우 `fontLoader.ts`의 함수들을 직접 호출할 수 있습니다.
