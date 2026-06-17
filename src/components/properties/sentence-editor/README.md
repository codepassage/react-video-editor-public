# SentenceEditor - 모듈화된 구조

`SentenceEditor` 컴포넌트를 유지보수성 향상을 위해 여러 개의 작은 컴포넌트로 분리했습니다.

## 📁 구조

```
sentence-editor/
├── index.ts                    # 메인 export 파일
├── types.ts                    # 타입 정의
├── SentenceEditor.tsx          # 메인 컴포넌트
├── FontSelector.tsx            # 폰트 선택 컴포넌트
├── TextPreview.tsx             # 텍스트 미리보기 컴포넌트
├── StylePresets.tsx            # 스타일 프리셋 관리
├── GradientEditor.tsx          # 그라데이션 편집기
├── SegmentManager.tsx          # 세그먼트 관리 컴포넌트
├── BasicTextControls.tsx       # 기본 텍스트 속성 조절
└── hooks/
    ├── useTextMetrics.ts       # 텍스트 메트릭 계산 훅
    └── useSegmentManager.ts    # 세그먼트 관리 로직 훅
```

## 🔧 컴포넌트 분리 내용

### 1. **SentenceEditor.tsx** (메인 컴포넌트)
- 전체 상태 관리 및 컴포넌트 조율
- 텍스트 입력 및 선택 처리
- 자동 크기 조절 로직

### 2. **FontSelector.tsx** 
- 고급 폰트 선택 기능
- 폰트 검색 및 카테고리 필터링
- 폰트 로딩 상태 관리

### 3. **TextPreview.tsx**
- 실시간 스타일 미리보기
- 세그먼트별 스타일 렌더링
- 안전한 텍스트 렌더링 로직

### 4. **StylePresets.tsx**
- 미리 정의된 스타일 프리셋
- 프리셋 그리드 UI
- 스타일 적용 로직

### 5. **GradientEditor.tsx**
- 그라데이션 배경 편집
- 색상 조절점 관리
- 그라데이션 타입 변경 (선형/원형/원뿔형)

### 6. **SegmentManager.tsx**
- 텍스트 세그먼트 생성, 편집, 삭제
- 세그먼트별 스타일 조절
- 세그먼트 목록 관리

### 7. **BasicTextControls.tsx**
- 기본 텍스트 속성 (폰트 크기, 굵기, 정렬 등)
- 기본 색상 및 배경 설정
- 텍스트 장식 및 변형

## 🎣 커스텀 훅

### **useTextMetrics**
```typescript
const { calculateTextMetrics } = useTextMetrics();

const metrics = calculateTextMetrics(text, {
  fontSize: 24,
  fontFamily: 'Arial',
  lineHeight: 1.2
});
```

### **useSegmentManager**
```typescript
const {
  generateSegmentId,
  adjustSegmentsForTextChange,
  createSegment,
  updateSegmentStyleSafe,
  removeSegment
} = useSegmentManager();
```

## 📝 사용 방법

### 기본 사용법
```typescript
import { SentenceEditor } from './sentence-editor';

<SentenceEditor
  clip={sentenceClip}
  onUpdate={(clipId, updates) => {
    // 클립 업데이트 로직
  }}
/>
```

### 개별 컴포넌트 사용법
```typescript
import { 
  FontSelector, 
  TextPreview, 
  StylePresetsGrid 
} from './sentence-editor';

// 폰트 선택기만 사용
<FontSelector
  fontFamily="Arial"
  onFontSelect={(font) => console.log(font)}
/>

// 텍스트 미리보기만 사용
<TextPreview
  clip={clip}
  previewMode={true}
/>

// 스타일 프리셋만 사용
<StylePresetsGrid
  segmentId="segment-1"
  onApplyPreset={(segmentId, presetKey) => {
    // 프리셋 적용 로직
  }}
/>
```

## ✨ 주요 개선사항

1. **모듈화**: 각 기능을 독립적인 컴포넌트로 분리
2. **재사용성**: 개별 컴포넌트를 다른 곳에서도 사용 가능
3. **유지보수성**: 각 컴포넌트의 책임이 명확히 분리됨
4. **타입 안전성**: 모든 컴포넌트에 대한 명확한 타입 정의
5. **커스텀 훅**: 비즈니스 로직을 재사용 가능한 훅으로 분리

## 🔄 마이그레이션

기존 코드와의 호환성을 위해 `SentenceEditor.tsx`에서 re-export하므로 기존 import 구문은 그대로 사용 가능합니다:

```typescript
// 기존 방식 (여전히 동작함)
import { SentenceEditor } from './SentenceEditor';

// 새로운 방식 (권장)
import { SentenceEditor } from './sentence-editor';
```

## 🛠️ 개발 팁

1. **새로운 스타일 프리셋 추가**: `StylePresets.tsx`의 `stylePresets` 객체에 추가
2. **새로운 폰트 카테고리 추가**: `FontSelector.tsx`의 `fontCategoryOptions` 배열에 추가
3. **새로운 그라데이션 프리셋 추가**: `GradientEditor.tsx`의 프리셋 배열에 추가

이러한 모듈화 구조를 통해 각 기능을 독립적으로 개발하고 테스트할 수 있으며, 코드의 가독성과 유지보수성이 크게 향상됩니다.
