/**
 * 📝 TextClip.tsx - Remotion 텍스트 클립 렌더러
 * 
 * 복잡한 텍스트 이펙트와 스타일링을 지원하는 텍스트 클립 전용 렌더러
 * CSS 생성 최적화와 디버깅 시스템을 포함한 고성능 텍스트 렌더링
 * 
 * 주요 기능:
 * - 다양한 텍스트 이펙트 (그림자, 필터, 그라디언트)
 * - 한국어 폰트 지원
 * - CSS 생성 최적화
 * - 디버깅 시스템 (개발 모드)
 * - 편집 모드별 동작 분리
 * 
 * 지원 이펙트:
 * - textShadow: 복잡한 그림자 효과
 * - filter: CSS 필터 (blur, brightness 등)
 * - gradient: 텍스트 그라디언트
 * - animation: 텍스트 애니메이션
 * 
 * 성능 최적화:
 * - CSS 속성 수 모니터링 (15개 이상 경고)
 * - 텍스트 길이 기반 최적화
 * - 메모리 사용량 추적
 * - 복잡한 스타일 감지
 * 
 * 디버깅 시스템:
 * - CSS 생성 추적
 * - 속성 개수 및 크기 모니터링
 * - 복잡한 속성 경고
 * - 서버 렌더링 안전성
 */

import React from 'react';
import { TimelineClip } from '../../types';
import { getTextStyle } from '../utils/textEffects.utils';

// 🔍 CSS 생성 추적을 위한 디버깅 시스템
const CSS_DEBUG = false; // 서버 렌더링에서 안전하게 비활성화

const logCSSGeneration = (location: string, styleObj: React.CSSProperties, clipId: string) => {
  if (CSS_DEBUG) {
    const propertyCount = Object.keys(styleObj).length;
    const styleString = JSON.stringify(styleObj, null, 2);
    const sizeInKB = (styleString.length / 1024).toFixed(2);
    
    console.group(`🎨 CSS 생성 위치: ${location}`);
    console.log(`📍 클립 ID: ${clipId.slice(-8)}`);
    console.log(`📊 속성 개수: ${propertyCount}개`);
    console.log(`💾 크기: ${sizeInKB}KB`);
    
    if (propertyCount > 15) {
      console.warn('⚠️ CSS 속성이 너무 많습니다!');
      console.log('🔍 생성된 스타일:');
      console.log(styleObj);
    }
    
    // 특별히 복잡한 속성들 체크
    if (styleObj.textShadow && (styleObj.textShadow as string).length > 100) {
      console.warn('⚠️ textShadow가 매우 복잡합니다:', (styleObj.textShadow as string).substring(0, 100) + '...');
    }
    
    if (styleObj.filter && (styleObj.filter as string).length > 50) {
      console.warn('⚠️ filter가 복잡합니다:', styleObj.filter);
    }
    
    console.groupEnd();
  }
};

// 텍스트 클립 전용 컴포넌트
export const TextClip: React.FC<{
    clip: TimelineClip;
    finalStyle: React.CSSProperties;
    isEditMode: boolean;
}> = ({ clip, finalStyle, isEditMode }) => {
    
    // 🔍 기존 getTextStyle 함수 사용 (복잡한 CSS 생성)
    const textStyle = getTextStyle(clip, finalStyle, isEditMode);
    
    // 🔍 CSS 생성 로그
    logCSSGeneration('TextClip getTextStyle()', textStyle, clip.id);

    return (
        <div style={textStyle}>
            {clip.text || 'Text'}
        </div>
    );
}; 