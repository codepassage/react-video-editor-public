import { registerRoot } from 'remotion';
import RenderCompositionWrapper from './Composition';

// 🎨 Remotion 렌더링에서 폰트 CSS 로드
// 이 import는 Remotion 번들링 시점에 폰트 CSS를 포함시탵니다
import '../index.css';

console.log('🚀 Registering render composition...');
registerRoot(RenderCompositionWrapper);
