import { TimelineClip } from '../../types';

/**
 * 애니메이션 유틸리티 함수들
 * Remotion 기반 애니메이션 효과 계산 및 적용
 */

// 이징 함수들 - 다양한 애니메이션 곡선 제공
export const applyEasing = (progress: number, easing: string = 'ease'): number => {
  // progress는 0~1 사이의 값
  progress = Math.max(0, Math.min(1, progress));
  
  switch (easing) {
    case 'linear':
      return progress;
      
    case 'ease':
      // 기본 cubic-bezier(0.25, 0.1, 0.25, 1.0)
      return progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
    case 'ease-in':
      // 천천히 시작
      return progress * progress;
      
    case 'ease-out':
      // 천천히 끝
      return 1 - Math.pow(1 - progress, 2);
      
    case 'ease-in-out':
      // 천천히 시작하고 천천히 끝
      return progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
    case 'ease-back':
      // 뒤로 당겼다가 앞으로 (overshoot 효과)
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * progress * progress * progress - c1 * progress * progress;
      
    case 'ease-bounce':
      // 바운스 효과
      if (progress < 1 / 2.75) {
        return 7.5625 * progress * progress;
      } else if (progress < 2 / 2.75) {
        return 7.5625 * (progress -= 1.5 / 2.75) * progress + 0.75;
      } else if (progress < 2.5 / 2.75) {
        return 7.5625 * (progress -= 2.25 / 2.75) * progress + 0.9375;
      } else {
        return 7.5625 * (progress -= 2.625 / 2.75) * progress + 0.984375;
      }
      
    case 'ease-elastic':
      // 탄성 효과
      const c4 = (2 * Math.PI) / 3;
      return progress === 0 
        ? 0 
        : progress === 1 
        ? 1 
        : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1;
        
    default:
      return progress;
  }
};

// 선형 보간 함수 (Remotion의 interpolate와 유사)
export const interpolate = (
  input: number,
  inputRange: [number, number],
  outputRange: [number, number],
  extrapolate?: 'extend' | 'clamp' | 'identity'
): number => {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;
  
  // 입력값이 범위를 벗어났을 때 처리
  if (input <= inputMin) {
    if (extrapolate === 'identity') return input;
    if (extrapolate === 'extend') {
      // 범위를 확장하여 계속 계산
    } else {
      // 'clamp' (기본값)
      return outputMin;
    }
  }
  
  if (input >= inputMax) {
    if (extrapolate === 'identity') return input;
    if (extrapolate === 'extend') {
      // 범위를 확장하여 계속 계산
    } else {
      // 'clamp' (기본값)
      return outputMax;
    }
  }
  
  // 선형 보간 계산
  const progress = (input - inputMin) / (inputMax - inputMin);
  return outputMin + progress * (outputMax - outputMin);
};

// 스프링 애니메이션 계산 (간단한 버전)
export const spring = (options: {
  progress: number;
  damping?: number;
  stiffness?: number;
  mass?: number;
}): number => {
  const { progress, damping = 10, stiffness = 100, mass = 1 } = options;
  
  // 간단한 스프링 물리 시뮬레이션
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  
  if (zeta < 1) {
    // Under-damped (진동하면서 수렴)
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * progress) * 
           Math.cos(omegaD * progress + Math.atan(zeta / Math.sqrt(1 - zeta * zeta)));
  } else if (zeta === 1) {
    // Critically damped (가장 빠른 수렴)
    return 1 - (1 + omega * progress) * Math.exp(-omega * progress);
  } else {
    // Over-damped (진동 없이 천천히 수렴)
    const r1 = -omega * (zeta + Math.sqrt(zeta * zeta - 1));
    const r2 = -omega * (zeta - Math.sqrt(zeta * zeta - 1));
    const c1 = 1;
    const c2 = -1;
    return 1 - (c1 * Math.exp(r1 * progress) + c2 * Math.exp(r2 * progress));
  }
};

// 애니메이션 시작 전 초기 상태 계산
export const getInitialAnimationState = (
  animationType: string,
  baseStyle: React.CSSProperties
): React.CSSProperties => {
  const initialStyle = { ...baseStyle };
  
  switch (animationType) {
    case 'fadeIn':
      initialStyle.opacity = 0;
      break;
      
    case 'slideInLeft':
      initialStyle.transform = `${baseStyle.transform || ''} translateX(-100%)`;
      break;
      
    case 'slideInTop':
      initialStyle.transform = `${baseStyle.transform || ''} translateY(-100%)`;
      break;
      
    case 'scaleIn':
      initialStyle.transform = `${baseStyle.transform || ''} scale(0)`;
      break;
      
    case 'rotateIn':
      initialStyle.transform = `${baseStyle.transform || ''} rotate(180deg)`;
      break;
      
    case 'bounceIn':
      initialStyle.transform = `${baseStyle.transform || ''} scale(0)`;
      initialStyle.opacity = 0;
      break;
  }
  
  return initialStyle;
};

// 애니메이션 타입별 스타일 적용
export const applyAnimationType = (
  animationType: string,
  baseStyle: React.CSSProperties,
  progress: number,
  easing: string = 'ease'
): React.CSSProperties => {
  const animatedStyle = { ...baseStyle };
  const easedProgress = applyEasing(progress, easing);
  
  console.log('🎬 애니메이션 적용:', {
    type: animationType,
    progress: progress.toFixed(3),
    easedProgress: easedProgress.toFixed(3),
    easing
  });
  
  switch (animationType) {
    case 'fadeIn':
      // 페이드 인: 투명도 0 → 1
      animatedStyle.opacity = interpolate(
        easedProgress, 
        [0, 1], 
        [0, baseStyle.opacity || 1]
      );
      break;
      
    case 'slideInLeft':
      // 슬라이드 인 (왼쪽): X축 -100% → 0%
      const translateX = interpolate(easedProgress, [0, 1], [-100, 0]);
      animatedStyle.transform = combineTransforms(
        baseStyle.transform || '', 
        `translateX(${translateX}%)`
      );
      break;
      
    case 'slideInTop':
      // 슬라이드 인 (위): Y축 -100% → 0%
      const translateY = interpolate(easedProgress, [0, 1], [-100, 0]);
      animatedStyle.transform = combineTransforms(
        baseStyle.transform || '', 
        `translateY(${translateY}%)`
      );
      break;
      
    case 'scaleIn':
      // 확대: scale 0 → 1
      const scale = interpolate(easedProgress, [0, 1], [0, 1]);
      animatedStyle.transform = combineTransforms(
        baseStyle.transform || '', 
        `scale(${scale})`
      );
      break;
      
    case 'rotateIn':
      // 회전 등장: 180deg → 0deg
      const rotation = interpolate(easedProgress, [0, 1], [180, 0]);
      const rotateScale = interpolate(easedProgress, [0, 1], [0.5, 1]); // 크기도 함께 변화
      animatedStyle.transform = combineTransforms(
        baseStyle.transform || '', 
        `rotate(${rotation}deg) scale(${rotateScale})`
      );
      animatedStyle.opacity = interpolate(easedProgress, [0, 1], [0, baseStyle.opacity || 1]);
      break;
      
    case 'bounceIn':
      // 튀어오르기: 스프링 효과와 함께 scale 0 → 1
      const springScale = spring({
        progress: easedProgress * 2, // 스프링을 더 빠르게
        damping: 8,
        stiffness: 200
      });
      animatedStyle.transform = combineTransforms(
        baseStyle.transform || '', 
        `scale(${springScale})`
      );
      animatedStyle.opacity = interpolate(easedProgress, [0, 1], [0, baseStyle.opacity || 1]);
      break;
  }
  
  return animatedStyle;
};

// Transform 문자열들을 안전하게 결합하는 함수
export const combineTransforms = (baseTransform: string, newTransform: string): string => {
  // 기존 transform에서 새로 적용할 transform과 겹치는 부분 제거
  let cleanedBase = baseTransform;
  
  // 새 transform에서 사용하는 함수명 추출
  const newFunctions = newTransform.match(/(\w+)\([^)]*\)/g) || [];
  
  newFunctions.forEach(newFunc => {
    const funcName = newFunc.split('(')[0];
    // 기존 transform에서 같은 함수 제거
    const regex = new RegExp(`\\b${funcName}\\([^)]*\\)`, 'g');
    cleanedBase = cleanedBase.replace(regex, '').trim();
  });
  
  // 여러 공백을 하나로 정리
  cleanedBase = cleanedBase.replace(/\s+/g, ' ').trim();
  
  // 결합
  return [cleanedBase, newTransform].filter(Boolean).join(' ').trim();
};

// 애니메이션 진행률 계산 (딜레이 문제 해결)
export const calculateAnimationProgress = (
  currentTimeInSeconds: number,
  clip: TimelineClip
): { 
  isAnimating: boolean; 
  progress: number; 
  isDelayed: boolean;
  debugInfo: {
    clipElapsedTime: number;
    animationElapsedTime: number;
    isInClipTimeRange: boolean;
    effectiveDelay: number;
    shouldStartNow: boolean;
    actualStartTime: number;
  };
} => {
  // 🎯 정밀도 개선: 부동소수점 오차 최소화 (소수점 3자리까지만 사용)
  const preciseCurrent = Math.round(currentTimeInSeconds * 1000) / 1000;
  const preciseClipStart = Math.round(clip.startTime * 1000) / 1000;
  const preciseClipEnd = Math.round(clip.endTime * 1000) / 1000;
  
  const clipElapsedTime = preciseCurrent - preciseClipStart;
  
  // 🚀 핵심 개선: animationDelay 처리 로직 단순화
  const rawDelay = clip.animationDelay || 0;
  const animationDelay = rawDelay > 0.001 ? rawDelay : 0; // 1ms 이하는 즉시 시작
  const animationDuration = clip.animationDuration || 1;
  
  // 클립 시간 범위 검사 (정밀도 개선)
  const isInClipTimeRange = clipElapsedTime >= -0.001 && preciseCurrent <= preciseClipEnd + 0.001;
  
  // 실제 애니메이션 시작 시간
  const actualStartTime = preciseClipStart + animationDelay;
  const shouldStartNow = preciseCurrent >= actualStartTime - 0.001; // 1ms 오차 허용
  
  const debugInfo = {
    clipElapsedTime,
    animationElapsedTime: clipElapsedTime - animationDelay,
    isInClipTimeRange,
    effectiveDelay: animationDelay,
    shouldStartNow,
    actualStartTime
  };
  
  // 클립 시간 범위 밖
  if (!isInClipTimeRange) {
    return {
      isAnimating: false,
      progress: 0,
      isDelayed: false,
      debugInfo
    };
  }
  
  // 🎯 핵심 수정: 즉시 시작 조건 개선
  if (animationDelay <= 0.001) {
    // 딜레이가 거의 없으면 즉시 애니메이션 시작
    const animationElapsedTime = Math.max(0, clipElapsedTime);
    let progress = animationElapsedTime / animationDuration;
    
    // 반복 재생 처리
    if (clip.animationLoop && progress > 1) {
      progress = progress % 1;
    } else {
      progress = Math.min(progress, 1);
    }
    
    return {
      isAnimating: true,
      progress,
      isDelayed: false,
      debugInfo
    };
  }
  
  // 🕒 딜레이가 있는 경우 처리
  if (clipElapsedTime < animationDelay) {
    // 상세 디버깅은 개발 환경에서만
    if (false) {
      console.log('⏰ 애니메이션 지연 중:', {
        clipId: clip.id.slice(-8),
        지연시간: animationDelay.toFixed(3),
        남은지연시간: (animationDelay - clipElapsedTime).toFixed(3)
      });
    }
    return {
      isAnimating: false,
      progress: 0,
      isDelayed: true,
      debugInfo
    };
  }
  
  // 애니메이션 진행률 계산
  const animationElapsedTime = clipElapsedTime - animationDelay;
  let progress = animationElapsedTime / animationDuration;
  
  // 반복 재생 처리
  if (clip.animationLoop && progress > 1) {
    progress = progress % 1;
  } else {
    progress = Math.min(Math.max(progress, 0), 1); // 0~1 범위로 제한
  }
  
  return {
    isAnimating: true,
    progress,
    isDelayed: false,
    debugInfo
  };
};

// 애니메이션 메인 처리 함수 (초기 상태 문제 해결)
export const getAnimatedStyle = (
  clip: TimelineClip,
  baseStyle: React.CSSProperties,
  currentTimeInSeconds: number,
  isEditMode: boolean = false
): React.CSSProperties => {
  // 편집 모드에서는 애니메이션 적용하지 않음
  if (isEditMode || !clip.animationType) {
    return baseStyle;
  }
  
  // 애니메이션 진행률 계산
  const { isAnimating, progress, isDelayed, debugInfo } = calculateAnimationProgress(
    currentTimeInSeconds, 
    clip
  );
  
  // 🎯 핵심 수정: 애니메이션 시작 전에도 초기 상태 적용
  if (isDelayed || (!isAnimating && debugInfo.shouldStartNow === false)) {
    return getInitialAnimationState(clip.animationType, baseStyle);
  }
  
  // 🔍 선택적 디버깅 (개발 환경에서만, 더 적은 로그)
  if (false && clip.animationType && 
      Math.floor(currentTimeInSeconds * 5) % 25 === 0) { // 0.2초마다 5번 중 1번만
    console.log('🎆 애니메이션 상태:', {
      clipId: clip.id.slice(-8),
      type: clip.animationType,
      delay: clip.animationDelay ?? 0,
      time: currentTimeInSeconds.toFixed(2),
      isDelayed,
      isAnimating,
      progress: (progress * 100).toFixed(0) + '%',
      shouldStart: debugInfo.shouldStartNow
    });
  }
  
  // 애니메이션이 시작되지 않았으면 초기 상태 보류
  if (!isAnimating) {
    return getInitialAnimationState(clip.animationType, baseStyle);
  }
  
  // 애니메이션 적용
  return applyAnimationType(
    clip.animationType,
    baseStyle,
    progress,
    clip.animationEasing
  );
};

// 애니메이션 품질 검증 함수
export const validateAnimationSettings = (clip: TimelineClip): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} => {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  if (!clip.animationType) {
    return { isValid: true, warnings, recommendations };
  }
  
  // 지속시간 검증
  const duration = clip.animationDuration || 1;
  if (duration > clip.duration) {
    warnings.push(`애니메이션 지속시간(${duration}s)이 클립 길이(${clip.duration}s)보다 깁니다.`);
    recommendations.push('애니메이션 지속시간을 클립 길이보다 짧게 설정하세요.');
  }
  
  // 지연시간 검증
  const delay = clip.animationDelay || 0;
  if (delay > clip.duration * 0.8) {
    warnings.push(`애니메이션 지연시간(${delay}s)이 너무 깁니다.`);
    recommendations.push('지연시간을 클립 길이의 80% 이하로 설정하세요.');
  }
  
  // 성능 최적화 권장사항
  if (duration < 0.2) {
    recommendations.push('0.2초 미만의 짧은 애니메이션은 부자연스러울 수 있습니다.');
  }
  
  if (duration > 3) {
    recommendations.push('3초 이상의 긴 애니메이션은 사용자 경험을 해칠 수 있습니다.');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations
  };
};

// 성능 모니터링 함수
export const monitorAnimationPerformance = (): {
  logPerformanceMetrics: (clipId: string, startTime: number) => void;
  getPerformanceReport: () => object;
} => {
  const performanceData: Record<string, number[]> = {};
  
  return {
    logPerformanceMetrics: (clipId: string, startTime: number) => {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (!performanceData[clipId]) {
        performanceData[clipId] = [];
      }
      performanceData[clipId].push(executionTime);
      
      // 성능 경고
      if (executionTime > 16) { // 60fps 기준 16ms 초과
        console.warn(`⚠️ 애니메이션 성능 경고: ${clipId.slice(-8)} - ${executionTime.toFixed(2)}ms`);
      }
    },
    
    getPerformanceReport: () => {
      const report: Record<string, object> = {};
      
      for (const [clipId, times] of Object.entries(performanceData)) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const max = Math.max(...times);
        const min = Math.min(...times);
        
        report[clipId] = {
          평균: `${avg.toFixed(2)}ms`,
          최대: `${max.toFixed(2)}ms`,
          최소: `${min.toFixed(2)}ms`,
          호출횟수: times.length
        };
      }
      
      return report;
    }
  };
};

// 전역 성능 모니터
export const animationPerformanceMonitor = monitorAnimationPerformance();

console.log('✅ 애니메이션 시스템 로드 완료 🎬', {
  '지원 애니메이션': ['fadeIn', 'slideInLeft', 'slideInTop', 'scaleIn', 'rotateIn', 'bounceIn'],
  '지원 이징': ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'ease-back', 'ease-bounce', 'ease-elastic'],
  '추가 기능': ['반복재생', '지연시간', '성능모니터링', '품질검증']
});
