import { TimelineClip } from '../../types';
import { getFontWithFallback, normalizeFontFamily, isFontAvailable } from '../../utils/fontLoader';
import { DEFAULT_FONT_SIZE } from '../../constants/textDefaults';

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

        console.groupEnd();
    }
};

// 텍스트 스타일 계산 함수
export const getTextStyle = (clip: TimelineClip, finalStyle: React.CSSProperties, isEditMode: boolean): React.CSSProperties => {
    // 🎨 동적 폰트 fallback 체인 (서버 폰트 시스템 사용)
    const getFontFamilyWithFallback = (fontFamily?: string): string => {
        if (!fontFamily) {
            return 'Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        }

        try {
            // 폰트 이름 정규화
            const normalizedFontFamily = normalizeFontFamily(fontFamily);

            // 동적 폰트 로더로 fallback 체인 생성
            const fallbackChain = getFontWithFallback(normalizedFontFamily);

            console.log(`🎨 폰트 fallback 체인 생성: ${fontFamily} -> ${normalizedFontFamily} -> ${fallbackChain}`);

            return fallbackChain;
        } catch (error) {
            console.warn(`⚠️ 폰트 fallback 생성 실패: ${fontFamily}`, error);

            // 에러 시 기본 fallback 사용
            return `"${fontFamily}", "Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif`;
        }
    };

    const baseStyle: React.CSSProperties = {
        ...finalStyle,
        ...(() => {
            const bgColor = clip.backgroundColor;
            console.log('🎨 textEffects.utils.ts backgroundColor 처리:', {
                clipId: clip.id?.slice(-8),
                bgColor,
                isTransparent: bgColor === 'transparent',
                isEmpty: !bgColor,
                hasGradient: bgColor?.includes('gradient'),
                type: typeof bgColor
            });
            
            if (bgColor === 'transparent') {
                return { backgroundColor: 'transparent' };
            }
            if (!bgColor) {
                return { backgroundColor: 'transparent' };
            }
            
            // 🎨 그라데이션 배경 처리 - background 속성 사용
            if (bgColor.includes('gradient')) {
                console.log('✅ 그라데이션 감지됨 - background 속성 사용:', bgColor);
                return { 
                    background: bgColor,
                    backgroundColor: 'transparent' // 그라데이션 시 backgroundColor는 transparent
                };
            }
            
            // 단색 배경 처리
            console.log('✅ 단색 배경 - backgroundColor 속성 사용:', bgColor);
            return { backgroundColor: bgColor };
        })(),
        fontSize: clip.fontSize || DEFAULT_FONT_SIZE,
        fontFamily: getFontFamilyWithFallback(clip.fontFamily),
        fontWeight: clip.fontWeight || 'normal',
        textAlign: clip.textAlign || 'left',
        lineHeight: clip.lineHeight || 1.2,
        letterSpacing: clip.letterSpacing || 0,
        textDecoration: clip.textDecoration || 'none',
        textTransform: clip.textTransform as any || 'none',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap' as const,
        overflowWrap: 'break-word' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: clip.textAlign === 'center' ? 'center' :
            clip.textAlign === 'right' ? 'flex-end' : 'flex-start',
        padding: `${clip.paddingTop || 0}px ${clip.paddingRight || 0}px ${clip.paddingBottom || 0}px ${clip.paddingLeft || 0}px`,
        // 🔍 패딩 디버깅 로그
        ...((() => {
          const paddingDebug = {
            paddingTop: clip.paddingTop,
            paddingRight: clip.paddingRight,
            paddingBottom: clip.paddingBottom,
            paddingLeft: clip.paddingLeft,
            paddingCSS: `${clip.paddingTop || 0}px ${clip.paddingRight || 0}px ${clip.paddingBottom || 0}px ${clip.paddingLeft || 0}px`
          };
          console.log('🎨 textEffects.utils.ts 패딩 CSS 생성:', paddingDebug);
          return {};
        })()),
        // 둥근 테두리 처리 (LongSentence 텍스트 배경용)
        borderRadius: clip.borderRadius ? (
            clip.borderRadiusUnit === '%' 
                ? `${clip.borderRadius}%` 
                : `${clip.borderRadius}px`
        ) : undefined,
        pointerEvents: isEditMode ? 'none' : 'auto',
        fontFeatureSettings: 'normal',
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
    };

    // 그라데이션 텍스트 처리
    if (clip.textGradient?.enabled && clip.textGradient.stops && clip.textGradient.stops.length >= 2) {
        const gradient = clip.textGradient;
        let gradientCSS = '';

        const stops = gradient.stops
            .sort((a, b) => a.position - b.position)
            .map(stop => `${stop.color} ${stop.position}%`)
            .join(', ');

        switch (gradient.type) {
            case 'linear':
                gradientCSS = `linear-gradient(${gradient.angle || 45}deg, ${stops})`;
                break;
            case 'radial':
                gradientCSS = `radial-gradient(circle at ${gradient.centerX || 50}% ${gradient.centerY || 50}%, ${stops})`;
                break;
            case 'conic':
                gradientCSS = `conic-gradient(from 0deg at ${gradient.centerX || 50}% ${gradient.centerY || 50}%, ${stops})`;
                break;
        }

        console.log('🌈 그라데이션 텍스트 렌더링:', {
            '클립 ID': clip.id.slice(-8),
            '그라데이션 타입': gradient.type,
            '조절점 수': gradient.stops.length,
            'CSS': gradientCSS.substring(0, 100) + '...'
        });

        baseStyle.background = gradientCSS;
        baseStyle.backgroundClip = 'text';
        baseStyle.WebkitBackgroundClip = 'text';
        baseStyle.color = 'transparent';
        baseStyle.WebkitTextFillColor = 'transparent';
    } else {
        // 기본 단색 텍스트
        baseStyle.color = clip.color || '#000000';
    }

    // 전문적인 텍스트 효과 처리
    const shadowEffects: string[] = [];
    let filterEffects: string[] = [];

    // 1. 다중 그림자 효과 처리
    if (clip.multipleShadows && clip.multipleShadows.length > 0) {
        const enabledShadows = clip.multipleShadows.filter(shadow => shadow.enabled);

        enabledShadows.forEach(shadow => {
            const opacity = shadow.opacity || 1;
            const color = shadow.color;

            // 투명도를 포함한 색상 계산
            let shadowColor = color;
            if (opacity < 1) {
                // hex 색상을 rgba로 변환
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                shadowColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }

            if (shadow.type === 'drop-shadow') {
                shadowEffects.push(`${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadowColor}`);
            } else if (shadow.type === 'inner-shadow') {
                // inner shadow는 CSS text-shadow로는 완벽하게 구현하기 어려우므로 근사치로 처리
                shadowEffects.push(`inset ${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadowColor}`);
            }
        });

        console.log('🎆 다중 그림자 렌더링:', {
            '클립 ID': clip.id.slice(-8),
            '활성 그림자 수': enabledShadows.length,
            '총 그림자 수': clip.multipleShadows.length
        });
    }

    // 2. 글로우 효과 처리
    if (clip.textGlow?.enabled) {
        const glow = clip.textGlow;
        const intensity = (glow.intensity || 50) / 100;
        const spread = (glow.spread || 30) / 100;
        const blur = glow.blur || 20;
        const color = glow.color || '#00ff00';

        if (glow.type === 'outer-glow') {
            // 외부 글로우: 다중 text-shadow + filter 사용
            const glowShadows = [
                `0 0 ${blur * 0.5}px ${color}`,
                `0 0 ${blur}px ${color}`,
                `0 0 ${blur * 1.5}px ${color}`,
                `0 0 ${blur * 2}px ${color}`
            ];
            shadowEffects.push(...glowShadows);

            // filter로 추가 글로우 효과
            filterEffects.push(`drop-shadow(0 0 ${blur}px ${color})`);

            console.log('⚡ 외부 글로우 렌더링:', {
                '클립 ID': clip.id.slice(-8),
                '글로우 색상': color,
                '강도': intensity,
                '블러': blur,
                '그림자 수': glowShadows.length
            });
        } else if (glow.type === 'inner-glow') {
            // 내부 글로우: text-shadow로 비슷하게 구현
            const innerGlowShadows = [
                `inset 0 0 ${blur * 0.5}px ${color}`,
                `inset 0 0 ${blur}px ${color}`,
                `0 0 ${blur * 0.3}px ${color}`
            ];
            shadowEffects.push(...innerGlowShadows);

            console.log('⚡ 내부 글로우 렌더링:', {
                '클립 ID': clip.id.slice(-8),
                '글로우 색상': color,
                '강도': intensity,
                '블러': blur
            });
        }
    }

    // 3. 텍스트 텍스처 효과 처리
    if (clip.textTexture?.enabled && clip.textTexture.imageUrl) {
        const texture = clip.textTexture;
        const textureOpacity = (texture.opacity || 80) / 100;
        const textureScale = (texture.scale || 100) / 100;
        const offsetX = texture.offsetX || 0;
        const offsetY = texture.offsetY || 0;

        // 텍스처 배경 설정
        const textureBackground = `url(${texture.imageUrl})`;
        const textureSize = `${textureScale * 100}%`;
        const texturePosition = `${offsetX}% ${offsetY}%`;

        // 기존 그라데이션이 있다면 대체하지 말고 조합되도록 설정
        if (!baseStyle.background) {
            // 텍스처만 사용하는 경우
            baseStyle.background = textureBackground;
            baseStyle.backgroundSize = textureSize;
            baseStyle.backgroundPosition = texturePosition;
            baseStyle.backgroundRepeat = 'repeat';
            baseStyle.backgroundClip = 'text';
            baseStyle.WebkitBackgroundClip = 'text';
            baseStyle.color = 'transparent';
            baseStyle.WebkitTextFillColor = 'transparent';

            if (texture.blendMode) {
                baseStyle.mixBlendMode = texture.blendMode as any;
            }
        } else {
            // 그라데이션과 텍스처 조합: 예술적 효과
            // 이 경우 여러 개의 배경 레이어를 연속적으로 적용
            const existingBackground = baseStyle.background;
            baseStyle.background = `${textureBackground}, ${existingBackground}`;
            const existingSize = baseStyle.backgroundSize || '100%';
            baseStyle.backgroundSize = `${textureSize}, ${existingSize}`;
            const existingPosition = baseStyle.backgroundPosition || '0% 0%';
            baseStyle.backgroundPosition = `${texturePosition}, ${existingPosition}`;
            baseStyle.backgroundRepeat = 'repeat, no-repeat';

            // 다중 블렌드 모드 설정
            if (texture.blendMode) {
                baseStyle.mixBlendMode = texture.blendMode as any;
            }
        }

        // 투명도 조정 (그라데이션 있을 때 따로 처리)
        if (baseStyle.color === 'transparent' || baseStyle.WebkitTextFillColor === 'transparent') {
            const currentOpacity = typeof baseStyle.opacity === 'number' ? baseStyle.opacity : 1;
            baseStyle.opacity = currentOpacity * textureOpacity;
        }

        console.log('🎨 텍스트 텍스처 렌더링:', {
            '클립 ID': clip.id.slice(-8),
            '텍스처 URL': texture.imageUrl.substring(0, 50) + '...',
            '블렌드 모드': texture.blendMode,
            '투명도': textureOpacity,
            '스케일': textureScale,
            '오프셋': `${offsetX}%, ${offsetY}%`,
            '그라데이션 조합': !!baseStyle.background
        });
    }

    // 4. 고급 다중 스트로크 효과 처리
    if (clip.multipleStrokes && clip.multipleStrokes.length > 0) {
        const enabledStrokes = clip.multipleStrokes.filter(stroke => stroke.enabled);

        if (enabledStrokes.length > 0) {
            // 스트로크 효과를 text-shadow로 시뮬레이션
            const strokeShadows: string[] = [];

            enabledStrokes.forEach(stroke => {
                const opacity = (stroke.opacity || 100) / 100;
                const width = stroke.width;
                let strokeColor = stroke.color;

                // 투명도를 포함한 색상 계산
                if (opacity < 1) {
                    const r = parseInt(strokeColor.slice(1, 3), 16);
                    const g = parseInt(strokeColor.slice(3, 5), 16);
                    const b = parseInt(strokeColor.slice(5, 7), 16);
                    strokeColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                }

                // 스트로크 타입에 따른 다중 샤도우 생성
                switch (stroke.type) {
                    case 'outer':
                        // 외부 스트로크: 8방향으로 샤도우 생성
                        for (let i = 0; i < 8; i++) {
                            const angle = (i * Math.PI) / 4;
                            const offsetX = Math.cos(angle) * width;
                            const offsetY = Math.sin(angle) * width;
                            strokeShadows.push(`${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 0px ${strokeColor}`);
                        }
                        break;

                    case 'inner':
                        // 내부 스트로크: inset 샤도우 사용
                        for (let i = 0; i < 8; i++) {
                            const angle = (i * Math.PI) / 4;
                            const offsetX = -Math.cos(angle) * width;
                            const offsetY = -Math.sin(angle) * width;
                            strokeShadows.push(`inset ${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 0px ${strokeColor}`);
                        }
                        break;

                    case 'center':
                        // 중앙 스트로크: 외부와 내부 조합
                        for (let i = 0; i < 8; i++) {
                            const angle = (i * Math.PI) / 4;
                            const halfWidth = width / 2;
                            const offsetX = Math.cos(angle) * halfWidth;
                            const offsetY = Math.sin(angle) * halfWidth;
                            strokeShadows.push(`${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 0px ${strokeColor}`);
                            strokeShadows.push(`${(-offsetX).toFixed(1)}px ${(-offsetY).toFixed(1)}px 0px ${strokeColor}`);
                        }
                        break;
                }
            });

            shadowEffects.push(...strokeShadows);

            // 기본 WebkitTextStroke 도 적용 (가장 바깥쪽 스트로크)
            const primaryStroke = enabledStrokes[0];
            if (primaryStroke) {
                const primaryOpacity = (primaryStroke.opacity || 100) / 100;
                let primaryColor = primaryStroke.color;

                if (primaryOpacity < 1) {
                    const r = parseInt(primaryColor.slice(1, 3), 16);
                    const g = parseInt(primaryColor.slice(3, 5), 16);
                    const b = parseInt(primaryColor.slice(5, 7), 16);
                    primaryColor = `rgba(${r}, ${g}, ${b}, ${primaryOpacity})`;
                }

                baseStyle.WebkitTextStroke = `${primaryStroke.width}px ${primaryColor}`;

                // 점선/파선 패턴 지원 (현재 CSS는 제한적이므로 미래 확장용)
                if (primaryStroke.dashArray) {
                    console.log('✏️ 점선/파선 패턴:', {
                        '클립 ID': clip.id.slice(-8),
                        'dashArray': primaryStroke.dashArray,
                        '참고': 'CSS text-stroke는 점선 미지원. SVG 필요'
                    });
                }
            }

            console.log('✏️ 고급 다중 스트로크 렌더링:', {
                '클립 ID': clip.id.slice(-8),
                '활성 스트로크 수': enabledStrokes.length,
                '총 스트로크 수': clip.multipleStrokes.length,
                '생성된 샤도우 수': strokeShadows.length
            });
        }
    }

    // 5. 3D 베벨 효과 처리
    if (clip.textBevel?.enabled) {
        const bevel = clip.textBevel;
        const depth = (bevel.depth || 50) / 100;
        const direction = (bevel.direction || 135) * (Math.PI / 180); // 라디안으로 변환
        const size = bevel.size || 5;
        const soften = (bevel.soften || 10) / 100;

        const highlightColor = bevel.highlightColor || '#ffffff';
        const shadowColor = bevel.shadowColor || '#000000';
        const highlightOpacity = (bevel.highlightOpacity || 75) / 100;
        const shadowOpacity = (bevel.shadowOpacity || 75) / 100;

        // 하이라이트와 샤도우 색상에 투명도 적용
        const highlightRgba = `rgba(${parseInt(highlightColor.slice(1, 3), 16)
            }, ${parseInt(highlightColor.slice(3, 5), 16)
            }, ${parseInt(highlightColor.slice(5, 7), 16)
            }, ${highlightOpacity})`;

        const shadowRgba = `rgba(${parseInt(shadowColor.slice(1, 3), 16)
            }, ${parseInt(shadowColor.slice(3, 5), 16)
            }, ${parseInt(shadowColor.slice(5, 7), 16)
            }, ${shadowOpacity})`;

        // 방향에 따른 오프셋 계산
        const highlightOffsetX = Math.cos(direction - Math.PI) * size * depth;
        const highlightOffsetY = Math.sin(direction - Math.PI) * size * depth;
        const shadowOffsetX = Math.cos(direction) * size * depth;
        const shadowOffsetY = Math.sin(direction) * size * depth;

        // 베벨 스타일에 따른 그림자 생성
        const bevelShadows: string[] = [];

        switch (bevel.style) {
            case 'outer-bevel':
                // 외부 베벨: 하이라이트와 샤도우를 바깥에 배치
                bevelShadows.push(
                    `${highlightOffsetX}px ${highlightOffsetY}px ${size * soften}px ${highlightRgba}`,
                    `${shadowOffsetX}px ${shadowOffsetY}px ${size * soften}px ${shadowRgba}`,
                    `${highlightOffsetX * 0.5}px ${highlightOffsetY * 0.5}px ${size * 0.5}px ${highlightRgba}`,
                    `${shadowOffsetX * 0.5}px ${shadowOffsetY * 0.5}px ${size * 0.5}px ${shadowRgba}`
                );
                break;

            case 'inner-bevel':
                // 내부 베벨: 색상 반전하고 inset 효과
                bevelShadows.push(
                    `inset ${shadowOffsetX}px ${shadowOffsetY}px ${size * soften}px ${shadowRgba}`,
                    `inset ${highlightOffsetX}px ${highlightOffsetY}px ${size * soften}px ${highlightRgba}`
                );
                break;

            case 'emboss':
                // 엠보싱: 양쪽 방향으로 효과
                bevelShadows.push(
                    `${highlightOffsetX}px ${highlightOffsetY}px ${size * 0.5}px ${highlightRgba}`,
                    `${-highlightOffsetX}px ${-highlightOffsetY}px ${size * 0.5}px ${shadowRgba}`,
                    `${shadowOffsetX * 0.8}px ${shadowOffsetY * 0.8}px ${size * soften}px ${shadowRgba}`
                );
                break;

            case 'pillow-emboss':
                // 필로우 엠보싱: 부드럽게 튀긴 효과
                bevelShadows.push(
                    `${highlightOffsetX * 0.7}px ${highlightOffsetY * 0.7}px ${size * soften * 1.5}px ${highlightRgba}`,
                    `${shadowOffsetX * 0.7}px ${shadowOffsetY * 0.7}px ${size * soften * 1.5}px ${shadowRgba}`,
                    `inset ${-highlightOffsetX * 0.3}px ${-highlightOffsetY * 0.3}px ${size * 0.3}px ${highlightRgba}`,
                    `inset ${shadowOffsetX * 0.3}px ${shadowOffsetY * 0.3}px ${size * 0.3}px ${shadowRgba}`
                );
                break;
        }

        shadowEffects.push(...bevelShadows);

        console.log('🏔️ 3D 베벨 렌더링:', {
            '클립 ID': clip.id.slice(-8),
            '베벨 스타일': bevel.style,
            '깊이': depth,
            '방향': bevel.direction + '°',
            '크기': size + 'px',
            '그림자 수': bevelShadows.length
        });
    }

    // 6. 3D 돌출 효과 (Extrude) 처리
    if (clip.textExtrude?.enabled) {
        const extrude = clip.textExtrude;
        const depth = extrude.depth || 20;
        const direction = (extrude.direction || 135) * (Math.PI / 180); // 라디안으로 변환
        const color = extrude.color || '#666666';
        const opacity = (extrude.opacity || 80) / 100;

        // RGB 색상 분리
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // 3D 돌출 효과를 위한 여러 개의 샤도우 생성
        const extrudeShadows: string[] = [];

        // 최대 20개 레이어로 돌출 효과 생성
        const maxLayers = Math.min(depth, 20);
        for (let i = 1; i <= maxLayers; i++) {
            // 각 레이어의 오프셋 계산
            const offsetX = Math.cos(direction) * i;
            const offsetY = Math.sin(direction) * i;

            // 깊이에 따라 투명도 감소 (3D 효과)
            const layerOpacity = opacity * (1 - (i / maxLayers) * 0.6);

            // 깊이에 따라 색상도 약간 어둡게 (더 사실적인 3D 효과)
            const colorDarkening = 1 - (i / maxLayers) * 0.3;
            const darkR = Math.round(r * colorDarkening);
            const darkG = Math.round(g * colorDarkening);
            const darkB = Math.round(b * colorDarkening);

            const layerColor = `rgba(${darkR}, ${darkG}, ${darkB}, ${layerOpacity})`;

            extrudeShadows.push(`${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 0px ${layerColor}`);
        }

        shadowEffects.push(...extrudeShadows);

        console.log('🎭 3D 돌출 효과 렌더링:', {
            '클립 ID': clip.id.slice(-8),
            '돌출 깊이': depth,
            '방향': extrude.direction + '°',
            '색상': color,
            '투명도': opacity,
            '생성된 레이어 수': maxLayers,
            '생성된 샤도우 수': extrudeShadows.length
        });
    }

    // 7. 기본 textShadow 속성 처리 (LongSentence 텍스트 설정용)
    if (clip.textShadow && clip.textShadow !== 'none') {
        shadowEffects.push(clip.textShadow);
    }

    // 8. 기본 그림자 효과 추가 (기존 호환성 유지)
    if (clip.shadowOffsetX) {
        shadowEffects.push(`${clip.shadowOffsetX}px ${clip.shadowOffsetY}px ${clip.shadowBlur || 0}px ${clip.shadowColor || '#000000'}`);
    }

    // 모든 그림자 효과 적용
    if (shadowEffects.length > 0) {
        baseStyle.textShadow = shadowEffects.join(', ');
    }

    // 모든 필터 효과 적용
    if (filterEffects.length > 0) {
        baseStyle.filter = filterEffects.join(' ');
    }

    // 기본 스트로크 효과 (고급 다중 스트로크가 없을 때만)
    if (clip.strokeWidth && (!clip.multipleStrokes || clip.multipleStrokes.length === 0)) {
        baseStyle.WebkitTextStroke = `${clip.strokeWidth}px ${clip.strokeColor || '#000000'}`;
    }

    // 🔍 getTextStyle 함수에서 최종 CSS 생성 로그
    logCSSGeneration('getTextStyle() 최종 결과', baseStyle, clip.id);

    return baseStyle;
}; 