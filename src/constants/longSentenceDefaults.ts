// LongSentence 클립의 모든 기본값 상수 정의
// 이 파일은 클라이언트와 서버에서 일관된 기본값을 보장합니다.

/**
 * LongSentence 텍스트 속성 기본값
 */
export const DEFAULT_TEXT_PROPERTIES = {
  // 위치와 크기
  x: 100,
  y: 50,
  width: 800,
  height: 100,
  opacity: 1,
  rotation: 0,
  
  // 텍스트 스타일
  color: '#ffffff',
  fontSize: 48,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'center',
  lineHeight: 1.2,
  letterSpacing: 0,
  textDecoration: 'none',
  textTransform: 'none',
  backgroundColor: 'transparent',
  borderRadius: 0,
  borderRadiusUnit: 'px',
  textShadow: 'none',
  backgroundShadow: 'none',
  strokeWidth: 0,
  strokeColor: '#000000',
  
  // 패딩
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingUnit: 'px',
  usePadding: false,
  
  // 시각 효과
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  
  // 페이드 효과
  fadeIn: 0,
  fadeOut: 0,
  
  // 애니메이션
  animationType: 'none',
  animationDuration: 1000,
  animationDelay: 0,
  animationEasing: 'ease',
  animationLoop: false,
} as const;

/**
 * LongSentence 미디어 속성 기본값
 */
export const DEFAULT_MEDIA_PROPERTIES = {
  // 위치와 크기
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  opacity: 1,
  rotation: 0,
  
  // 기본 미디어 속성
  volume: 1,
  playbackRate: 1,
  
  // ImagePropertiesEditor 속성들
  backgroundFit: 'fill' as const,
  backgroundPosition: 'center',
  borderRadius: 0,
  borderRadiusUnit: 'px' as const,
  edgeFade: 0,
  fadeType: 'radial' as const,
  edgeFadeStops: [] as Array<{position: number, opacity: number}>,
  
  // 테두리 스트로크
  borderWidth: 0,
  borderColor: '#ffffff',
  
  // Drop Shadow
  shadowEnabled: false,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  shadowBlur: 8,
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  
  // Inner Shadow
  innerShadowEnabled: false,
  innerShadowOffsetX: 2,
  innerShadowOffsetY: 2,
  innerShadowBlur: 4,
  innerShadowColor: 'rgba(0, 0, 0, 0.5)',
  
  // 시각 효과
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  
  // 페이드 효과
  fadeIn: 0,
  fadeOut: 0,
  
  // 애니메이션
  animationType: 'none',
  animationDuration: 1000,
  animationDelay: 0,
  animationEasing: 'ease',
  animationLoop: false,
} as const;

/**
 * LongSentence 기본 설정값
 */
export const DEFAULT_LONGSENTENCE_SETTINGS = {
  // 분할 설정
  maxWordsPerSentence: 10,
  splitOnPunctuation: true,
  
  // 생성 옵션
  generateTTS: true,
  generateText: true,
  generateSubtitles: true,
  
  // 언어 및 음성
  language: 'ko' as const,
  voice: 'ko-KR-Wavenet-A',
  
  // 가상 클립 시스템
  displayMode: 'none' as const,
  
  // 변환 상태
  conversionStatus: 'pending' as const,
  conversionProgress: 0,
  autoConvertOnEdit: false,
  preserveOriginal: true,
  
  // 부모-자식 관계
  childClipIds: [] as string[],
} as const;

/**
 * 완전한 기본값으로 채워진 textProperties 생성
 */
export function getCompleteTextProperties(partial: any = {}): typeof DEFAULT_TEXT_PROPERTIES {
  return {
    ...DEFAULT_TEXT_PROPERTIES,
    ...partial,
  };
}

/**
 * 완전한 기본값으로 채워진 mediaProperties 생성
 */
export function getCompleteMediaProperties(partial: any = {}): typeof DEFAULT_MEDIA_PROPERTIES {
  return {
    ...DEFAULT_MEDIA_PROPERTIES,
    ...partial,
  };
}

/**
 * 서버 전송용 완전한 LongSentence 클립 데이터 생성
 */
export function getCompleteClipForServer(clip: any) {
  return {
    ...clip,
    textProperties: getCompleteTextProperties(clip.textProperties),
    mediaProperties: getCompleteMediaProperties(clip.mediaProperties),
    ...DEFAULT_LONGSENTENCE_SETTINGS,
    ...clip, // 사용자 설정값으로 덮어쓰기
  };
}