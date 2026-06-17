import React from 'react';

// SVG 도형 패스 생성 함수들
export const generatePolygonStarPath = (w: number, h: number): string => {
    return `M ${w * 0.5} 0 L ${w * 0.61} ${h * 0.35} L ${w * 0.98} ${h * 0.35} L ${w * 0.68} ${h * 0.57} L ${w * 0.79} ${h * 0.91} L ${w * 0.5} ${h * 0.7} L ${w * 0.21} ${h * 0.91} L ${w * 0.32} ${h * 0.57} L ${w * 0.02} ${h * 0.35} L ${w * 0.39} ${h * 0.35} Z`;
};

export const generatePolygonHeartPath = (w: number, h: number): string => {
    return `M ${w * 0.5} ${h * 0.25} C ${w * 0.6} ${h * 0.1} ${w * 0.8} ${h * 0.1} ${w * 0.9} ${h * 0.35} C ${w * 0.9} ${h * 0.5} ${w * 0.75} ${h * 0.65} ${w * 0.5} ${h * 0.8} C ${w * 0.25} ${h * 0.65} ${w * 0.1} ${h * 0.5} ${w * 0.1} ${h * 0.35} C ${w * 0.2} ${h * 0.1} ${w * 0.4} ${h * 0.1} ${w * 0.5} ${h * 0.25} Z`;
};

export const generatePolygonTrianglePath = (w: number, h: number): string => {
    return `M ${w * 0.5} 0 L ${w} ${h} L 0 ${h} Z`;
};

export const generatePolygonDiamondPath = (w: number, h: number): string => {
    return `M ${w * 0.5} 0 L ${w} ${h * 0.5} L ${w * 0.5} ${h} L 0 ${h * 0.5} Z`;
};

export const generatePolygonCirclePath = (w: number, h: number): string => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
};

export const generatePolygonRectanglePath = (w: number, h: number): string => {
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
};

export const getPolygonShapePath = (type: string, width: number, height: number): string => {
    switch (type) {
        case 'star': return generatePolygonStarPath(width, height);
        case 'heart': return generatePolygonHeartPath(width, height);
        case 'triangle': return generatePolygonTrianglePath(width, height);
        case 'diamond': return generatePolygonDiamondPath(width, height);
        case 'circle': return generatePolygonCirclePath(width, height);
        case 'rectangle': return generatePolygonRectanglePath(width, height);
        default: return generatePolygonStarPath(width, height);
    }
};

// 일반 Shape (SVG 기반) 패스 생성 함수들
export const getShapePath = (shapeType: string, w: number, h: number): string => {
    switch (shapeType) {
        case 'star':
            return `M ${w * 0.5} 0 L ${w * 0.61} ${h * 0.35} L ${w * 0.98} ${h * 0.35} L ${w * 0.68} ${h * 0.57} L ${w * 0.79} ${h * 0.91} L ${w * 0.5} ${h * 0.7} L ${w * 0.21} ${h * 0.91} L ${w * 0.32} ${h * 0.57} L ${w * 0.02} ${h * 0.35} L ${w * 0.39} ${h * 0.35} Z`;
        case 'heart':
            return `M ${w * 0.5} ${h * 0.25} C ${w * 0.6} ${h * 0.1} ${w * 0.8} ${h * 0.1} ${w * 0.9} ${h * 0.35} C ${w * 0.9} ${h * 0.5} ${w * 0.75} ${h * 0.65} ${w * 0.5} ${h * 0.8} C ${w * 0.25} ${h * 0.65} ${w * 0.1} ${h * 0.5} ${w * 0.1} ${h * 0.35} C ${w * 0.2} ${h * 0.1} ${w * 0.4} ${h * 0.1} ${w * 0.5} ${h * 0.25} Z`;
        case 'triangle':
            return `M ${w * 0.5} 0 L 0 ${h} L ${w} ${h} Z`;
        case 'diamond':
            return `M ${w * 0.5} 0 L ${w} ${h * 0.5} L ${w * 0.5} ${h} L 0 ${h * 0.5} Z`;
        case 'circle':
            const cx = w / 2;
            const cy = h / 2;
            const r = Math.min(w, h) / 2;
            return `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`;
        default:
            return '';
    }
};

// 그래디언트 정의 생성 함수
export const createGradientDefs = (
    gradient: any,
    gradientId: string
): React.ReactElement | null => {
    if (!gradient) return null;

    if (gradient.type === 'linear') {
        const angle = gradient.angle || 0;
        const rad = (angle * Math.PI) / 180;
        const x1 = 50 - 50 * Math.cos(rad);
        const y1 = 50 - 50 * Math.sin(rad);
        const x2 = 50 + 50 * Math.cos(rad);
        const y2 = 50 + 50 * Math.sin(rad);

        return React.createElement(
            'linearGradient',
            {
                key: 'gradient',
                id: gradientId,
                x1: `${x1}%`,
                y1: `${y1}%`,
                x2: `${x2}%`,
                y2: `${y2}%`
            },
            gradient.stops.map((stop: any, index: number) =>
                React.createElement('stop', {
                    key: index,
                    offset: `${stop.position}%`,
                    stopColor: stop.color
                })
            )
        );
    } else if (gradient.type === 'radial') {
        return React.createElement(
            'radialGradient',
            {
                key: 'gradient',
                id: gradientId,
                cx: `${gradient.centerX || 50}%`,
                cy: `${gradient.centerY || 50}%`
            },
            gradient.stops.map((stop: any, index: number) =>
                React.createElement('stop', {
                    key: index,
                    offset: `${stop.position}%`,
                    stopColor: stop.color
                })
            )
        );
    }

    return null;
};

// 패턴 정의 생성 함수
export const createPatternDefs = (
    imageUrl: string,
    patternId: string,
    backgroundFit: string,
    backgroundPosition: string,
    svgWidth: number,
    svgHeight: number
): React.ReactElement => {
    let preserveAspectRatio = 'xMidYMid slice';
    let imageWidth = '100%';
    let imageHeight = '100%';
    let patternWidth = '100%';
    let patternHeight = '100%';
    let imageX = '0';
    let imageY = '0';

    // backgroundPosition 처리
    const getPositionValues = (position: string) => {
        switch (position) {
            case 'top': return { x: '50%', y: '0%', align: 'xMidYMin' };
            case 'bottom': return { x: '50%', y: '100%', align: 'xMidYMax' };
            case 'left': return { x: '0%', y: '50%', align: 'xMinYMid' };
            case 'right': return { x: '100%', y: '50%', align: 'xMaxYMid' };
            case 'top-left': return { x: '0%', y: '0%', align: 'xMinYMin' };
            case 'top-right': return { x: '100%', y: '0%', align: 'xMaxYMin' };
            case 'bottom-left': return { x: '0%', y: '100%', align: 'xMinYMax' };
            case 'bottom-right': return { x: '100%', y: '100%', align: 'xMaxYMax' };
            default: return { x: '50%', y: '50%', align: 'xMidYMid' }; // center
        }
    };

    const positionValues = getPositionValues(backgroundPosition);

    if (backgroundFit === 'contain') {
        preserveAspectRatio = positionValues.align + ' meet';
    } else if (backgroundFit === 'fill') {
        preserveAspectRatio = 'none';
    } else if (backgroundFit === 'cover') {
        preserveAspectRatio = positionValues.align + ' slice';
    } else if (backgroundFit === 'none') {
        // CSS object-fit: none과 유사한 효과를 위해
        // 실제 이미지 크기를 사용하고 위치 조정
        preserveAspectRatio = 'none';
        // 원본 크기 유지를 위해 더 정확한 접근
        imageX = positionValues.x === '50%' ? '0' : (positionValues.x === '0%' ? '0' : '-50%');
        imageY = positionValues.y === '50%' ? '0' : (positionValues.y === '0%' ? '0' : '-50%');
    } else if (backgroundFit === 'scale-down') {
        preserveAspectRatio = positionValues.align + ' meet';
    }
    

    return React.createElement(
        'pattern',
        {
            key: 'pattern',
            id: patternId,
            patternUnits: 'userSpaceOnUse',
            width: patternWidth,
            height: patternHeight
        },
        React.createElement('image', {
            href: imageUrl,
            x: imageX,
            y: imageY,
            width: imageWidth,
            height: imageHeight,
            preserveAspectRatio: preserveAspectRatio
        })
    );
}; 