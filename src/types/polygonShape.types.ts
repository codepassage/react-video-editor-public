export type PolygonShapeType = 'star' | 'heart' | 'triangle' | 'diamond' | 'circle' | 'rectangle';

export type PolygonBackgroundType = 'color' | 'gradient' | 'image';

export interface GradientStop {
    color: string;
    position: number; // 0 - 100
}

export interface GradientConfig {
    /**
     * Gradient kind
     */
    type?: 'linear' | 'radial' | 'conic';
    /** angle for linear / conic */
    angle?: number;
    /** center for radial / conic */
    centerX?: number;
    centerY?: number;
    /** color stops */
    stops?: GradientStop[];
}

export interface EdgeFadeStop {
    position: number; // 0 - 100
    opacity: number;  // 0 - 100
}

export interface PolygonShapeProperties {
    /* shape definition */
    shapeType: PolygonShapeType;

    /* background */
    backgroundType: PolygonBackgroundType;
    backgroundColor?: string;
    gradient?: GradientConfig;
    backgroundImageUrl?: string;
    backgroundFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    backgroundPosition?: string;

    /* appearance */
    borderRadius?: number;
    borderRadiusUnit?: 'px' | '%';
    borderWidth?: number;
    borderColor?: string;

    /* outer shadow */
    shadowEnabled?: boolean;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowBlur?: number;
    shadowColor?: string;
    shadowSpread?: number;
    shadowOpacity?: number; // 0-100

    /* inner shadow */
    innerShadowEnabled?: boolean;
    innerShadowOffsetX?: number;
    innerShadowOffsetY?: number;
    innerShadowBlur?: number;
    innerShadowColor?: string;
    innerShadowOpacity?: number; // 0-100

    /* glow effects */
    glowEnabled?: boolean;
    glowColor?: string;
    glowSize?: number;
    glowIntensity?: number;

    /* edge fade */
    edgeFade?: number; // 0 - 100
    fadeType?: 'radial' | 'linear-top' | 'linear-bottom' | 'linear-left' | 'linear-right';
    edgeFadeStops?: EdgeFadeStop[];
} 