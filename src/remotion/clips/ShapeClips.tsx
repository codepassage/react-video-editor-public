/**
 * 🔷 ShapeClips.tsx - 도형 클립 렌더링 컴포넌트 모음
 * 
 * 다양한 도형 타입을 렌더링하는 전문화된 클립 컴포넌트들의 집합입니다.
 * SVG 기반 벡터 그래픽과 CSS 기반 단순 도형을 모두 지원하며, 고급 스타일링 옵션을 제공합니다.
 * 
 * 주요 기능:
 * - SimpleShape: CSS 기반 단순 도형 (사각형, 원형 등)
 * - PolygonShape: SVG 기반 복잡한 다각형 도형
 * - ShapeClip: 기본 도형 렌더링 (호환성용)
 * - 그라데이션 및 이미지 패턴 배경 지원
 * - 고급 Edge Fade 및 마스크 효과
 * - Inner/Outer Shadow 및 테두리 효과
 * 
 * 성능 최적화:
 * - SVG 렌더링 품질 최적화 (geometricPrecision)
 * - 조건부 필터 적용으로 불필요한 렌더링 방지
 * - 벡터 그래픽 스케일링 최적화
 * - GPU 가속 활성화 (transform: translateZ(0))
 * 
 * 사용 패턴:
 * - 배경 도형이나 장식 요소로 활용
 * - 브랜딩 및 UI 요소 생성
 * - 복잡한 그래픽 디자인 컴포지션
 * 
 * 특별 고려사항:
 * - SVG와 CSS의 혼합 사용으로 최적의 성능 추구
 * - 크로스 브라우저 호환성을 위한 벡터 렌더링 옵션
 * - 동적 패턴 및 그라데이션 생성 지원
 * - 편집 모드에서의 정확한 hit-testing 보장
 */

import React from 'react';
import { TimelineClip } from '../../types';
import type { ShapeProperties } from '../../types/shape';
import { getBorderRadiusValue, getEdgeFadeMask } from '../utils/clipRenderer.utils';
import { getPolygonShapePath, getShapePath, createGradientDefs, createPatternDefs } from '../utils/shapeUtils';

// SimpleShape 클립 컴포넌트
export const SimpleShapeClip: React.FC<{
    clip: TimelineClip;
    finalStyle: React.CSSProperties;
    isEditMode: boolean;
}> = ({ clip, finalStyle, isEditMode }) => {
    if (!clip.mediaUrl) {
        console.warn('SimpleShape clip missing mediaUrl:', clip.id);
        return (
            <div style={{
                ...finalStyle,
                backgroundColor: '#ff6b6b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 14,
                fontWeight: 'bold',
                border: '2px dashed #ff9999',
                pointerEvents: isEditMode ? 'none' : 'auto'
            }}>
                🧪 SimpleShape<br />이미지 없음
            </div>
        );
    }

    // SimpleShape 속성 가져오기
    const simpleShapeProps = clip.simpleShapeProperties || {
        backgroundType: 'image',
        backgroundFit: 'fill', // ✅ 기본값을 fill로 변경
        backgroundPosition: 'center'
    };

    // 고급 Multi-Stop Edge Fade 효과 적용
    const edgeFadeMaskStyle = getEdgeFadeMask(
        simpleShapeProps.edgeFade || 0,
        simpleShapeProps.fadeType || 'radial',
        simpleShapeProps.edgeFadeStops
    );

    return (
        <img
            src={clip.mediaUrl}
            alt="Simple Shape"
            style={{
                ...finalStyle,
                // 🔧 Fill 모드 완전 채우기: width, height 명시적 설정
                width: '100%',
                height: '100%',
                objectFit: (simpleShapeProps.backgroundFit || 'fill') as 'fill' | 'contain' | 'cover' | 'none' | 'scale-down',
                objectPosition: simpleShapeProps.backgroundPosition || 'center',
                pointerEvents: isEditMode ? 'none' : 'auto',
                borderRadius: simpleShapeProps.borderRadius ? getBorderRadiusValue(
                    simpleShapeProps.borderRadius,
                    simpleShapeProps.borderRadiusUnit || 'px',
                    clip.width,
                    clip.height
                ) : undefined,
                // 🔧 완전 채우기를 위한 CSS
                margin: 0,
                padding: 0,
                display: 'block',
                boxSizing: 'border-box',
                // 🌪️ Edge Fade 효과 적용
                ...edgeFadeMaskStyle
            }}
            draggable={false}
            onLoad={() => {
                console.log('✅ SimpleShape 이미지 로드 성공:', clip.mediaUrl);
            }}
            onError={(e) => {
                console.error('❌ SimpleShape 이미지 로드 실패:', clip.mediaUrl);
                e.currentTarget.style.display = 'none';
            }}
        />
    );
};

// PolygonShape 클립 컴포넌트
export const PolygonShapeClip: React.FC<{
    clip: TimelineClip;
    finalStyle: React.CSSProperties;
    isEditMode: boolean;
}> = ({ clip, finalStyle, isEditMode }) => {

    const polygonShapeProps = (clip as any).polygonShapeProperties || {
        shapeType: 'star',
        backgroundType: 'color',
        backgroundColor: '#3b82f6',
        backgroundFit: 'fill'
    };
    


    // PolygonShape SVG 렌더링
    const renderPolygonSVG = () => {
        const svgWidth = clip.width;
        const svgHeight = clip.height;
        const shapePath = getPolygonShapePath(polygonShapeProps.shapeType, svgWidth, svgHeight);

        // 그래디언트 및 이미지 패턴 정의
        const getPolygonPatternDefs = () => {
            const defs = [];

            // 🎯 stroke 마스크 정의 (테두리를 내부로 제한)
            if (polygonShapeProps.borderWidth && polygonShapeProps.borderWidth > 0) {
                const borderRadiusValue = (polygonShapeProps.borderRadius && polygonShapeProps.borderRadius > 0) 
                    ? (polygonShapeProps.borderRadiusUnit === '%' 
                        ? (Math.min(svgWidth, svgHeight) * polygonShapeProps.borderRadius / 100)
                        : polygonShapeProps.borderRadius)
                    : 0;
                
                const maskDef = React.createElement('mask', {
                    key: 'stroke-mask',
                    id: `polygon-stroke-mask-${clip.id}`
                }, React.createElement('rect', {
                    width: svgWidth,
                    height: svgHeight,
                    rx: borderRadiusValue,
                    ry: borderRadiusValue,
                    fill: 'white'
                }));
                defs.push(maskDef);
            }

            // 그래디언트 정의
            if (polygonShapeProps.backgroundType === 'gradient' && polygonShapeProps.gradient) {
                const gradientId = `polygon-gradient-${clip.id}`;
                const gradientDef = createGradientDefs(polygonShapeProps.gradient, gradientId);
                if (gradientDef) defs.push(gradientDef);
            }

            // 이미지 패턴 정의 (서버에서 이미 절대 URL로 변환된 상태)
            if (polygonShapeProps.backgroundType === 'image' && polygonShapeProps.backgroundImageUrl) {
                const patternId = `polygon-pattern-${clip.id}`;
                const backgroundFit = polygonShapeProps.backgroundFit || 'fill';
                const backgroundPosition = polygonShapeProps.backgroundPosition || 'center';
                const patternDef = createPatternDefs(
                    polygonShapeProps.backgroundImageUrl, // 서버에서 이미 절대 URL로 변환됨
                    patternId,
                    backgroundFit,
                    backgroundPosition,
                    svgWidth,
                    svgHeight
                );
                defs.push(patternDef);
            }

            // Inner Shadow Filter (올바른 구현)
            if (polygonShapeProps.innerShadowEnabled) {
                const innerShadowFilter = React.createElement('filter', {
                    id: `polygon-inner-shadow-${clip.id}`,
                    x: '-50%',
                    y: '-50%',
                    width: '200%',
                    height: '200%'
                }, [
                    // 1. 원본 모양을 반전된 방향으로 offset
                    React.createElement('feOffset', {
                        key: 'offset',
                        in: 'SourceAlpha',
                        dx: -(polygonShapeProps.innerShadowOffsetX || 2),
                        dy: -(polygonShapeProps.innerShadowOffsetY || 2),
                        result: 'offsetInner'
                    }),
                    
                    // 2. 블러 적용
                    React.createElement('feGaussianBlur', {
                        key: 'blur',
                        in: 'offsetInner',
                        stdDeviation: (polygonShapeProps.innerShadowBlur || 4) / 2,
                        result: 'blurInner'
                    }),
                    
                    // 3. 원본 모양과 차이를 구해서 가장자리만 남기기
                    React.createElement('feComposite', {
                        key: 'subtract',
                        in: 'SourceAlpha',
                        in2: 'blurInner',
                        operator: 'out',
                        result: 'innerShadowMask'
                    }),
                    
                    // 4. 그림자 색상 적용 (투명도 포함)
                    React.createElement('feFlood', {
                        key: 'flood',
                        'flood-color': polygonShapeProps.innerShadowColor || 'rgba(0, 0, 0, 0.5)',
                        result: 'shadowColor'
                    }),
                    React.createElement('feComposite', {
                        key: 'colorize',
                        in: 'shadowColor',
                        in2: 'innerShadowMask',
                        operator: 'in',
                        result: 'coloredInnerShadow'
                    }),
                    
                    // 5. 원본 그래픽 위에 inner shadow 합성
                    React.createElement('feComposite', {
                        key: 'final',
                        in: 'coloredInnerShadow',
                        in2: 'SourceGraphic',
                        operator: 'atop',
                        result: 'finalResult'
                    })
                ]);
                defs.push(innerShadowFilter);
            }

            return defs.length > 0 ? React.createElement('defs', {}, ...defs) : null;
        };

        // 배경 색상/그래디언트/이미지 결정
        const getPolygonFillColor = () => {
            if (polygonShapeProps.backgroundType === 'image' && polygonShapeProps.backgroundImageUrl) {
                return `url(#polygon-pattern-${clip.id})`;
            } else if (polygonShapeProps.backgroundType === 'gradient' && polygonShapeProps.gradient) {
                return `url(#polygon-gradient-${clip.id})`;
            } else if (polygonShapeProps.backgroundType === 'color') {
                return polygonShapeProps.backgroundColor || '#3b82f6';
            }

            return '#3b82f6';
        };

        // 테두리 설정
        const getPolygonStrokeProps = () => {
            if (!polygonShapeProps.borderWidth || polygonShapeProps.borderWidth === 0) {
                return { stroke: 'none', strokeWidth: 0 };
            }

            return {
                stroke: polygonShapeProps.borderColor || '#ffffff',
                // 🎯 stroke를 내부로 이동 (테두리 잘림 방지)
                strokeWidth: polygonShapeProps.borderWidth * 2, // 두 배로 설정
                // 🎯 부드러운 테두리 렌더링
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                // 🎯 벡터 그래픽 품질 개선
                vectorEffect: 'non-scaling-stroke'
            };
        };


        try {
            console.log('🔍 PolygonShape Shadow 테스트:', {
                shadowEnabled: polygonShapeProps.shadowEnabled,
                shadowOffsetX: polygonShapeProps.shadowOffsetX,
                shadowOffsetY: polygonShapeProps.shadowOffsetY,
                shadowBlur: polygonShapeProps.shadowBlur,
                shadowColor: polygonShapeProps.shadowColor
            });

            // 메인 도형만 생성 (그림자는 CSS로 처리)
            const children = [];
            
            // 🎯 둥근 테두리가 있는 경우 rect로 변경, 없으면 기존 path 사용
            if (polygonShapeProps.borderRadius && polygonShapeProps.borderRadius > 0 && polygonShapeProps.shapeType === 'rectangle') {
                const borderRadiusValue = polygonShapeProps.borderRadiusUnit === '%' 
                    ? (Math.min(svgWidth, svgHeight) * polygonShapeProps.borderRadius / 100)
                    : polygonShapeProps.borderRadius;
                
                children.push(React.createElement('rect', {
                    key: 'main-rounded',
                    width: svgWidth,
                    height: svgHeight,
                    rx: borderRadiusValue,
                    ry: borderRadiusValue,
                    fill: getPolygonFillColor(),
                    ...getPolygonStrokeProps(),
                    // 🎯 마스크 적용으로 테두리 내부 제한
                    mask: (polygonShapeProps.borderWidth && polygonShapeProps.borderWidth > 0) 
                        ? `url(#polygon-stroke-mask-${clip.id})` 
                        : undefined,
                    filter: polygonShapeProps.innerShadowEnabled ? `url(#polygon-inner-shadow-${clip.id})` : undefined
                }));
            } else {
                children.push(React.createElement('path', {
                    key: 'main',
                    d: shapePath,
                    fill: getPolygonFillColor(),
                    ...getPolygonStrokeProps(),
                    // 🎯 마스크 적용으로 테두리 내부 제한
                    mask: (polygonShapeProps.borderWidth && polygonShapeProps.borderWidth > 0) 
                        ? `url(#polygon-stroke-mask-${clip.id})` 
                        : undefined,
                    filter: polygonShapeProps.innerShadowEnabled ? `url(#polygon-inner-shadow-${clip.id})` : undefined
                }));
            }

            const svgElement = React.createElement(
                'svg',
                {
                    width: svgWidth,
                    height: svgHeight,
                    style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: isEditMode ? 'none' : 'auto',
                        overflow: 'visible',
                        // 🎯 렌더링 품질 개선
                        shapeRendering: 'geometricPrecision',
                        textRendering: 'optimizeLegibility'
                    }
                },
                React.createElement('g', {}, [
                    getPolygonPatternDefs(),
                    ...children
                ])
            );

            return svgElement;
        } catch (error) {
            console.error('❌ PolygonShape SVG 생성 실패:', error);
            return React.createElement('div', {
                style: {
                    ...finalStyle,
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                }
            }, 'PolygonShape 오류');
        }
    };

    // 고급 Multi-Stop PolygonShape Edge Fade 효과 적용
    const edgeFadeMaskStyle = getEdgeFadeMask(
        polygonShapeProps.edgeFade || 0,
        polygonShapeProps.fadeType || 'radial',
        polygonShapeProps.edgeFadeStops
    );

    // CSS filter - 색상에 이미 투명도 포함됨
    const getDropShadowFilter = () => {
        if (!polygonShapeProps.shadowEnabled) return 'none';
        
        const offsetX = polygonShapeProps.shadowOffsetX || 4;
        const offsetY = polygonShapeProps.shadowOffsetY || 4;
        const blur = polygonShapeProps.shadowBlur || 8;
        const color = polygonShapeProps.shadowColor || 'rgba(0, 0, 0, 0.3)';
        
        console.log('🔍 Drop Shadow:', { offsetX, offsetY, blur, color });
        
        return `drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`;
    };


    const hasBorderRadius = polygonShapeProps.borderRadius && polygonShapeProps.borderRadius > 0;
    const borderRadiusValue = hasBorderRadius ? getBorderRadiusValue(
        polygonShapeProps.borderRadius,
        polygonShapeProps.borderRadiusUnit || 'px',
        clip.width,
        clip.height
    ) : undefined;

    console.log('🔍 PolygonShape BorderRadius Debug:', {
        borderRadius: polygonShapeProps.borderRadius,
        borderRadiusUnit: polygonShapeProps.borderRadiusUnit,
        hasBorderRadius,
        borderRadiusValue,
        clipWidth: clip.width,
        clipHeight: clip.height
    });

    return (
        <div style={{
            ...finalStyle,
            pointerEvents: isEditMode ? 'none' : 'auto',
            // 🎯 외부 div에서는 borderRadius 제거 (SVG 내부에서 처리)
            // borderRadius: borderRadiusValue,
            // overflow: hasBorderRadius ? 'hidden' : 'visible',
            filter: getDropShadowFilter(),
            // 🌪️ Edge Fade 효과 적용
            ...edgeFadeMaskStyle,
            // 🎯 컨테이너 렌더링 최적화
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)', // GPU 가속 활성화
            willChange: 'transform' // 렌더링 최적화 힌트
        }}>
            {renderPolygonSVG()}
        </div>
    );
};

// Shape 클립 컴포넌트
export const ShapeClip: React.FC<{
    clip: TimelineClip;
    finalStyle: React.CSSProperties;
    isEditMode: boolean;
}> = ({ clip, finalStyle, isEditMode }) => {
    const shapeProps: ShapeProperties = clip.shapeProperties || {
        shapeType: 'star',
        backgroundType: 'solid',
        backgroundColor: '#FFD700'
    };

    // 사각형은 CSS border-radius를 위해 별도 처리
    if (shapeProps.shapeType === 'rectangle') {
        const getBorderRadius = () => {
            if (shapeProps.borderRadius && shapeProps.borderRadius > 0) {
                return `${shapeProps.borderRadius}px`;
            }
            return undefined;
        };

        const getBackground = () => {
            if (shapeProps.backgroundType === 'image' && shapeProps.backgroundImageUrl) {
                const backgroundSize = shapeProps.backgroundFit || 'cover';
                const backgroundPosition = shapeProps.backgroundPosition || 'center';

                return {
                    backgroundImage: `url(${shapeProps.backgroundImageUrl})`,
                    backgroundSize: backgroundSize,
                    backgroundPosition: backgroundPosition,
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'transparent'
                };
            } else if (shapeProps.backgroundType === 'gradient' && shapeProps.gradient) {
                const g = shapeProps.gradient;
                const stops = g.stops.map(stop => `${stop.color} ${stop.position}%`).join(', ');

                if (g.type === 'linear') {
                    return `linear-gradient(${g.angle || 0}deg, ${stops})`;
                } else if (g.type === 'radial') {
                    return `radial-gradient(circle at ${g.centerX || 50}% ${g.centerY || 50}%, ${stops})`;
                }
                return shapeProps.backgroundColor || '#FFD700';
            } else if (shapeProps.backgroundType === 'solid') {
                return shapeProps.backgroundColor === 'transparent' ? 'transparent' : (shapeProps.backgroundColor || '#FFD700');
            }

            return 'transparent';
        };

        const getBorder = () => {
            if (!shapeProps.borderWidth || shapeProps.borderWidth === 0) {
                return 'none';
            }
            return `${shapeProps.borderWidth}px solid ${shapeProps.borderColor || '#ffffff'}`;
        };

        const getBoxShadow = () => {
            const shadows: string[] = [];

            if (shapeProps.shadowEnabled) {
                shadows.push(
                    `${shapeProps.shadowOffsetX || 4}px ${shapeProps.shadowOffsetY || 4}px ${shapeProps.shadowBlur || 8}px ${shapeProps.shadowColor || 'rgba(0, 0, 0, 0.3)'}`
                );
            }

            return shadows.length > 0 ? shadows.join(', ') : 'none';
        };

        const backgroundStyle = getBackground();
        const finalBackgroundStyle = typeof backgroundStyle === 'object' ? backgroundStyle : { background: backgroundStyle };

        // 🔧 이미지 배경이 있을 때는 다른 background 속성 제거
        const cleanedFinalStyle = { ...finalStyle };
        if (shapeProps.backgroundType === 'image' && shapeProps.backgroundImageUrl) {
            delete cleanedFinalStyle.background;
            delete cleanedFinalStyle.backgroundColor;
        }

        return (
            <div style={{
                ...cleanedFinalStyle,
                ...finalBackgroundStyle,
                border: getBorder(),
                borderRadius: getBorderRadius(),
                boxShadow: getBoxShadow(),
                pointerEvents: isEditMode ? 'none' : 'auto'
            }} />
        );
    }

    // 다른 도형들은 SVG 사용
    const renderSVGShape = () => {
        const svgWidth = clip.width;
        const svgHeight = clip.height;

        // 그래디언트 및 이미지 패턴 정의
        const getPatternDefs = () => {
            const defs = [];

            // 그래디언트 정의
            if (shapeProps.backgroundType === 'gradient' && shapeProps.gradient) {
                const gradientId = `gradient-${clip.id}`;
                const gradientDef = createGradientDefs(shapeProps.gradient, gradientId);
                if (gradientDef) defs.push(gradientDef);
            }

            // 이미지 패턴 정의
            if (shapeProps.backgroundType === 'image' && shapeProps.backgroundImageUrl) {
                const patternId = `pattern-${clip.id}`;
                const patternDef = createPatternDefs(
                    shapeProps.backgroundImageUrl,
                    patternId,
                    shapeProps.backgroundFit || 'cover',
                    shapeProps.backgroundPosition || 'center',
                    svgWidth,
                    svgHeight
                );
                defs.push(patternDef);
            }

            return defs.length > 0 ? React.createElement('defs', {}, ...defs) : null;
        };

        // 배경 색상/그래디언트/이미지 결정
        const getFillColor = () => {
            if (shapeProps.backgroundType === 'image' && shapeProps.backgroundImageUrl) {
                return `url(#pattern-${clip.id})`;
            } else if (shapeProps.backgroundType === 'gradient' && shapeProps.gradient) {
                return `url(#gradient-${clip.id})`;
            } else if (shapeProps.backgroundType === 'solid') {
                return shapeProps.backgroundColor === 'transparent' ? 'transparent' : (shapeProps.backgroundColor || '#FFD700');
            }

            return 'transparent';
        };

        // 테두리 설정
        const getStrokeProps = () => {
            if (!shapeProps.borderWidth || shapeProps.borderWidth === 0) {
                return { stroke: 'none', strokeWidth: 0 };
            }

            return {
                stroke: shapeProps.borderColor || '#ffffff',
                strokeWidth: shapeProps.borderWidth,
                // 🎯 부드러운 테두리 렌더링
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                // 🎯 벡터 그래픽 품질 개선
                vectorEffect: 'non-scaling-stroke'
            };
        };

        const shapePath = getShapePath(shapeProps.shapeType, svgWidth, svgHeight);

        if (shapePath) {
            return React.createElement(
                'svg',
                {
                    width: svgWidth,
                    height: svgHeight,
                    style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: isEditMode ? 'none' : 'auto',
                        // 🎯 렌더링 품질 개선
                        shapeRendering: 'geometricPrecision',
                        textRendering: 'optimizeLegibility'
                    }
                },
                getPatternDefs(),
                React.createElement('path', {
                    d: shapePath,
                    fill: getFillColor(),
                    ...getStrokeProps(),
                    style: {
                        filter: shapeProps.shadowEnabled ?
                            `drop-shadow(${shapeProps.shadowOffsetX || 4}px ${shapeProps.shadowOffsetY || 4}px ${shapeProps.shadowBlur || 8}px ${shapeProps.shadowColor || 'rgba(0, 0, 0, 0.3)'})` :
                            'none'
                    }
                })
            );
        }

        return null;
    };

    return (
        <div style={{
            ...finalStyle,
            pointerEvents: isEditMode ? 'none' : 'auto'
        }}>
            {renderSVGShape()}
        </div>
    );
}; 