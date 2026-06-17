# 🎨 한글 폰트 문제 해결 가이드

## 📋 문제 현황
한글 폰트들이 Text 속성 패널에서 선택할 수 있지만 실제로 적용되지 않는 문제가 발생하고 있습니다.

## 🔍 원인 분석
1. **폰트 경로 문제**: `fonts.css`에서 참조하는 경로와 실제 파일 경로 불일치
2. **파일명 불일치**: CSS에서 참조하는 파일명과 실제 파일명 차이
3. **폰트 로딩 검증 부족**: 폰트가 실제로 로드되었는지 확인하는 메커니즘 부족

## ✅ 해결 방법

### 1. 수정된 fonts.css 사용
기존 `public/fonts.css`를 `public/fonts-fixed.css`로 교체하거나 내용을 업데이트하세요.

```bash
# 백업 생성
cp public/fonts.css public/fonts-backup.css

# 수정된 버전으로 교체
cp public/fonts-fixed.css public/fonts.css
```

### 2. index.html 업데이트 (이미 올바름)
```html
<!-- 이미 올바르게 설정되어 있음 -->
<link rel="stylesheet" href="/fonts.css" />
```

### 3. 개선된 폰트 로더 사용
`src/utils/fontLoader-improved.ts`를 사용하여 더 정확한 폰트 로딩 상태 확인:

```typescript
import { debugFontLoading, getFontWithFallback, detectAvailableFonts } from '../utils/fontLoader-improved';
```

### 4. TextPropertiesPanel 업데이트
이미 수정된 버전으로 업데이트되어:
- 실시간 폰트 로딩 상태 확인
- 폰트 fallback 자동 적용
- 로딩 실패한 폰트 시각적 표시

## 🧪 테스트 방법

### 1. 브라우저 개발자 도구 확인
1. F12로 개발자 도구 열기
2. Console 탭에서 폰트 로딩 로그 확인
3. Network 탭에서 폰트 파일 로딩 상태 확인

### 2. 폰트 테스트 컴포넌트 사용
브라우저에서 폰트 테스트 컴포넌트를 실행하여 각 폰트의 로딩 상태를 시각적으로 확인할 수 있습니다.

### 3. 콘솔에서 폰트 상태 확인
```javascript
// 브라우저 콘솔에서 실행
document.fonts.ready.then(() => {
  console.log('폰트 로딩 완료');
  console.log('로드된 폰트 수:', document.fonts.size);
});
```

## 🔧 추가 문제 해결

### 폰트 파일이 404 에러가 나는 경우
1. `public/font/` 디렉토리의 파일 구조 확인
2. `fonts.css`의 경로와 실제 파일 경로 비교
3. 파일명의 대소문자 확인 (특히 macOS에서 Windows로 이동한 경우)

### CORS 에러가 발생하는 경우
```bash
# Vite 개발 서버의 경우, vite.config.ts에 추가
export default defineConfig({
  server: {
    fs: {
      allow: ['..']
    }
  }
})
```

### 폰트가 로드되지만 적용되지 않는 경우
1. CSS font-family 이름과 @font-face에서 정의한 이름 일치 확인
2. 브라우저 캐시 삭제
3. 폰트 weight 설정 확인

## 🎯 최종 확인 사항

### ✅ 체크리스트
- [ ] `public/fonts.css` 파일이 올바른 경로로 업데이트됨
- [ ] 모든 폰트 파일이 실제로 존재함
- [ ] 브라우저 개발자 도구에서 폰트 로딩 에러가 없음
- [ ] TextPropertiesPanel에서 폰트 상태 아이콘이 표시됨
- [ ] 실제 텍스트에 폰트가 적용됨

### 🔍 디버깅 명령어
```javascript
// 브라우저 콘솔에서 실행 가능한 디버깅 코드

// 1. 모든 로드된 폰트 확인
console.log([...document.fonts].map(font => font.family));

// 2. 특정 폰트 로딩 상태 확인
console.log(document.fonts.check('16px "BM DoHyeon"'));

// 3. 폰트 로드 강제 실행
document.fonts.load('16px "BM DoHyeon"').then(() => {
  console.log('BM DoHyeon 로드 완료');
});
```

## 📞 추가 지원
문제가 계속 발생하는 경우:
1. 브라우저 콘솔의 에러 메시지 확인
2. Network 탭에서 실패한 폰트 파일 요청 확인
3. 특정 폰트가 문제인지 전체적인 문제인지 확인

---

**업데이트**: 2025년 6월 19일
**작성자**: AI Assistant
**버전**: 1.0
