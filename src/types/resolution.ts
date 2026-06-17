/**
 * 📺 resolution.ts - 비디오 해상도 프리셋 타입 및 상수 정의
 * 
 * React Video Editor v1에서 사용되는 비디오 출력 해상도와 관련된
 * 타입 정의와 프리셋 상수들을 관리하는 모듈입니다.
 * 
 * 🎯 주요 기능:
 * - YouTube 표준 해상도 프리셋 제공
 * - 다양한 비디오 형식 지원 (16:9, 9:16, 1:1)
 * - 사용자 정의 해상도 설정 지원
 * - 종횡비 자동 계산 및 검증
 * - 플랫폼별 최적화된 해상도 가이드
 * 
 * 📊 지원 해상도:
 * - 4K UHD (3840×2160) - 최고 품질
 * - 2K QHD (2560×1440) - 고품질
 * - Full HD (1920×1080) - 표준 품질
 * - HD (1280×720) - 기본 품질
 * - SD (854×480, 640×360) - 저품질
 * - YouTube Shorts (1080×1920) - 세로형
 * - Square (1080×1080) - 정사각형
 * 
 * 🔧 사용 시나리오:
 * - 프로젝트 생성 시 해상도 선택
 * - 렌더링 품질 설정
 * - 플랫폼별 최적화 (YouTube, Instagram, TikTok)
 * - 미디어 클립 크기 조정
 * - 성능 최적화를 위한 해상도 조절
 * 
 * 📱 플랫폼 지원:
 * - YouTube: 모든 표준 해상도
 * - YouTube Shorts: 9:16 세로형
 * - Instagram: 1:1 정사각형, 16:9 가로형
 * - TikTok: 9:16 세로형
 * - Facebook: 16:9 가로형, 1:1 정사각형
 * 
 * 🔗 연관 모듈:
 * - 프로젝트 설정: 초기 해상도 선택
 * - 렌더링 엔진: 출력 해상도 설정
 * - 미디어 처리: 클립 크기 조정
 * - 성능 최적화: 해상도별 처리 최적화
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 1.0
 */

/**
 * 비디오 해상도 프리셋 인터페이스
 * 
 * @interface ResolutionPreset
 * @description 비디오 프로젝트에서 사용할 수 있는 해상도 프리셋의 구조를 정의합니다.
 * 각 프리셋은 고유 ID, 표시명, 실제 크기, 종횡비, 설명을 포함합니다.
 */
export interface ResolutionPreset {
  /** 해상도 프리셋의 고유 식별자 */
  id: string;
  
  /** 사용자에게 표시될 프리셋 이름 */
  name: string;
  
  /** 비디오 가로 크기 (픽셀) */
  width: number;
  
  /** 비디오 세로 크기 (픽셀) */
  height: number;
  
  /** 종횡비 표현 (예: "16:9", "9:16", "1:1") */
  aspectRatio: string;
  
  /** 해상도에 대한 상세 설명 */
  description: string;
}

/**
 * YouTube 플랫폼 최적화 해상도 프리셋 배열
 * 
 * @constant YOUTUBE_RESOLUTION_PRESETS
 * @description YouTube를 포함한 주요 비디오 플랫폼에서 사용되는 
 * 표준 해상도들의 프리셋 배열입니다.
 * 
 * 🎬 포함된 프리셋:
 * - 4K UHD: 최고 품질, 대역폭 높음
 * - 2K QHD: 고품질, 균형잡힌 성능
 * - Full HD: 표준 품질, 범용적 사용
 * - HD: 기본 품질, 낮은 대역폭
 * - SD: 저품질, 호환성 우선
 * - YouTube Shorts: 세로형 모바일 콘텐츠
 * - Square: 소셜 미디어 정사각형 포맷
 * - Custom: 사용자 정의 해상도
 * 
 * 💡 사용 예시:
 * ```typescript
 * import { YOUTUBE_RESOLUTION_PRESETS } from './resolution';
 * 
 * // 1080p 프리셋 찾기
 * const fullHD = YOUTUBE_RESOLUTION_PRESETS.find(preset => preset.id === '1080p');
 * console.log(`${fullHD.name}: ${fullHD.width}×${fullHD.height}`);
 * 
 * // 세로형 비디오 프리셋들 필터링
 * const verticalPresets = YOUTUBE_RESOLUTION_PRESETS.filter(
 *   preset => preset.aspectRatio === '9:16'
 * );
 * 
 * // 해상도 선택 UI 생성
 * const resolutionOptions = YOUTUBE_RESOLUTION_PRESETS.map(preset => ({
 *   value: preset.id,
 *   label: `${preset.name} (${preset.description})`
 * }));
 * ```
 * 
 * ⚡ 성능 고려사항:
 * - 4K: 높은 CPU/GPU 요구사항, 대용량 파일
 * - 1080p: 균형잡힌 품질과 성능
 * - 720p: 빠른 처리, 적당한 품질
 * - 480p 이하: 빠른 미리보기용
 */
export const YOUTUBE_RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    id: '4k',
    name: '4K UHD',
    width: 3840,
    height: 2160,
    aspectRatio: '16:9',
    description: '4K Ultra HD (3840×2160)'
  },
  {
    id: '1440p',
    name: '1440p (2K)',
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    description: '2K Quad HD (2560×1440)'
  },
  {
    id: '1080p',
    name: '1080p (Full HD)',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    description: 'Full HD (1920×1080)'
  },
  {
    id: '720p',
    name: '720p (HD)',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    description: 'HD Ready (1280×720)'
  },
  {
    id: '480p',
    name: '480p (SD)',
    width: 854,
    height: 480,
    aspectRatio: '16:9',
    description: 'Standard Definition (854×480)'
  },
  {
    id: '360p',
    name: '360p',
    width: 640,
    height: 360,
    aspectRatio: '16:9',
    description: 'Low Definition (640×360)'
  },
  {
    id: 'shorts',
    name: 'YouTube Shorts',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    description: 'Vertical Video (1080×1920)'
  },
  {
    id: 'square',
    name: 'Square',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    description: 'Square Format (1080×1080)'
  },
  {
    id: 'custom',
    name: 'Custom',
    width: 1920,
    height: 1080,
    aspectRatio: 'Custom',
    description: 'Custom Resolution'
  }
];
