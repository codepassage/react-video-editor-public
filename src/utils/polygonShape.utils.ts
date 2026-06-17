/**
 * 🔷 polygonShape.utils.ts - 다각형 도형 유틸리티 함수들
 * 
 * PolygonShape 클립의 다양한 기하학적 계산과 변환을 담당하는
 * 유틸리티 함수 모음입니다. 다각형 도형의 렌더링, 스타일링,
 * 단위 변환 등의 핵심 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 테두리 반지름 단위 변환 (px ↔ %)
 * - 도형 타입별 아이콘 및 이름 매핑
 * - 도형 선택 UI 옵션 제공
 * - 다각형 좌표 계산 및 변환
 * - 그라데이션 및 배경 처리
 * 
 * 지원 도형 타입:
 * - rectangle: 사각형 (기본 직사각형)
 * - circle: 원형 (완전한 원)
 * - triangle: 삼각형 (정삼각형)
 * - diamond: 다이아몬드 (마름모)
 * - star: 별 (5각 별)
 * - heart: 하트 (심장 모양)
 * 
 * 단위 변환 시스템:
 * - px: 픽셀 단위 (절대값)
 * - %: 퍼센트 단위 (상대값)
 * - 클립 크기 기준 상대 계산
 * - 최소 크기 기준 안전한 변환
 * 
 * 계산 알고리즘:
 * - 클립 크기의 최소값을 기준으로 변환
 * - 반올림을 통한 정수 픽셀 값 보장
 * - 영역 범위 검증 및 보정
 * 
 * 사용 예시:
 * ```typescript
 * const pxValue = convertBorderRadiusUnit(10, '%', 'px', 200, 100);
 * // 결과: 10 (100px의 10% = 10px)
 * 
 * const shapes = shapeOptions.filter(s => s.type !== 'heart');
 * // 하트를 제외한 모든 도형 옵션
 * ```
 * 
 * 성능 최적화:
 * - 단위 변환 시 동일 단위 빠른 반환
 * - 수학 계산 최소화
 * - 메모이제이션 가능한 구조
 * 
 * 관련 모듈:
 * - 2번 모듈: Clip Type System (PolygonShape 클립)
 * - polygonShape.types.ts: 타입 정의
 * - PolygonShapeEditor: UI 컴포넌트
 * - Remotion 렌더링 시스템
 */

import type { PolygonShapeProperties, PolygonShapeType } from '../types/polygonShape.types';

/**
 * Convert border radius between px and % units based on clip size.
 */
export const convertBorderRadiusUnit = (
    value: number,
    fromUnit: 'px' | '%',
    toUnit: 'px' | '%',
    clipWidth: number,
    clipHeight: number
): number => {
    if (fromUnit === toUnit) return value;
    const minSize = Math.min(clipWidth, clipHeight);
    if (fromUnit === '%' && toUnit === 'px') {
        return Math.round((value / 100) * minSize);
    }
    if (fromUnit === 'px' && toUnit === '%') {
        return Math.round((value / minSize) * 100);
    }
    return value;
};

/** Shape selector options shown in UI */
export const shapeOptions: Array<{ type: PolygonShapeType; icon: string; name: string }> = [
    { type: 'rectangle', icon: '⬜', name: 'Rectangle' },
    { type: 'circle', icon: '⭕', name: 'Circle' },
    { type: 'triangle', icon: '🔺', name: 'Triangle' },
    { type: 'diamond', icon: '💎', name: 'Diamond' },
    { type: 'star', icon: '⭐', name: 'Star' },
    { type: 'heart', icon: '❤️', name: 'Heart' }
];

// ---- Path generators ------------------------------------------------------
const generateStarPath = (w: number, h: number): string => {
    return `M ${w * 0.5} 0 L ${w * 0.61} ${h * 0.35} L ${w * 0.98} ${h * 0.35} L ${w * 0.68} ${h * 0.57} L ${w * 0.79} ${h * 0.91} L ${w * 0.5} ${h * 0.7} L ${w * 0.21} ${h * 0.91} L ${w * 0.32} ${h * 0.57} L ${w * 0.02} ${h * 0.35} L ${w * 0.39} ${h * 0.35} Z`;
};

const generateHeartPath = (w: number, h: number): string => {
    return `M ${w * 0.5} ${h * 0.25} C ${w * 0.6} ${h * 0.1} ${w * 0.8} ${h * 0.1} ${w * 0.9} ${h * 0.35} C ${w * 0.9} ${h * 0.5} ${w * 0.75} ${h * 0.65} ${w * 0.5} ${h * 0.8} C ${w * 0.25} ${h * 0.65} ${w * 0.1} ${h * 0.5} ${w * 0.1} ${h * 0.35} C ${w * 0.2} ${h * 0.1} ${w * 0.4} ${h * 0.1} ${w * 0.5} ${h * 0.25} Z`;
};

const generateTrianglePath = (w: number, h: number): string => {
    return `M ${w * 0.5} 0 L ${w} ${h} L 0 ${h} Z`;
};

const generateDiamondPath = (w: number, h: number): string => {
    return `M ${w * 0.5} 0 L ${w} ${h * 0.5} L ${w * 0.5} ${h} L 0 ${h * 0.5} Z`;
};

const generateCirclePath = (w: number, h: number): string => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
};

const generateRectanglePath = (w: number, h: number): string => {
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
};

export const getShapePath = (type: PolygonShapeType, width: number, height: number): string => {
    switch (type) {
        case 'star':
            return generateStarPath(width, height);
        case 'heart':
            return generateHeartPath(width, height);
        case 'triangle':
            return generateTrianglePath(width, height);
        case 'diamond':
            return generateDiamondPath(width, height);
        case 'circle':
            return generateCirclePath(width, height);
        case 'rectangle':
        default:
            return generateRectanglePath(width, height);
    }
};

/**
 * Create an SVG data URL for the given polygon shape properties.
 */
export const createPolygonImage = (properties: PolygonShapeProperties): string => {
    const width = 300;
    const height = 300;
    const shapePath = getShapePath(properties.shapeType, width, height);

    let fillContent = '';
    let defsContent = '';

    // --- background handling --------------------------------------------------
    if (properties.backgroundType === 'color') {
        fillContent = properties.backgroundColor || '#3b82f6';
    } else if (properties.backgroundType === 'gradient' && properties.gradient) {
        const gradient = properties.gradient;
        const gradientId = `grad_${Math.random().toString(36).substr(2, 9)}`;

        if (gradient.type === 'linear') {
            const angle = gradient.angle || 0;
            const x1 = 50 - 50 * Math.cos((angle - 90) * Math.PI / 180);
            const y1 = 50 - 50 * Math.sin((angle - 90) * Math.PI / 180);
            const x2 = 50 + 50 * Math.cos((angle - 90) * Math.PI / 180);
            const y2 = 50 + 50 * Math.sin((angle - 90) * Math.PI / 180);

            defsContent += `<linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
            (gradient.stops || []).forEach((stop) => {
                defsContent += `<stop offset="${stop.position}%" stop-color="${stop.color}"/>`;
            });
            defsContent += '</linearGradient>';
        } else if (gradient.type === 'radial') {
            const cx = gradient.centerX || 50;
            const cy = gradient.centerY || 50;
            defsContent += `<radialGradient id="${gradientId}" cx="${cx}%" cy="${cy}%" r="50%">`;
            (gradient.stops || []).forEach((stop) => {
                defsContent += `<stop offset="${stop.position}%" stop-color="${stop.color}"/>`;
            });
            defsContent += '</radialGradient>';
        }
        fillContent = `url(#${gradientId})`;
    } else if (properties.backgroundType === 'image' && properties.backgroundImageUrl) {
        const patternId = `pattern_${Math.random().toString(36).substr(2, 9)}`;
        let preserveAspectRatio = 'xMidYMid meet';
        switch (properties.backgroundFit) {
            case 'fill':
                preserveAspectRatio = 'none';
                break;
            case 'cover':
                preserveAspectRatio = 'xMidYMid slice';
                break;
            case 'contain':
            default:
                preserveAspectRatio = 'xMidYMid meet';
                break;
        }
        defsContent += `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="100%" height="100%">`;
        defsContent += `<image href="${properties.backgroundImageUrl}" width="100%" height="100%" preserveAspectRatio="${preserveAspectRatio}"/>`;
        defsContent += '</pattern>';
        fillContent = `url(#${patternId})`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n  <defs>${defsContent}</defs>\n  <path d="${shapePath}" fill="${fillContent}" stroke="${properties.borderColor || 'none'}" stroke-width="${properties.borderWidth || 0}" opacity="1"/>\n</svg>`;

    return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}; 