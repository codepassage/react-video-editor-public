// Common UI Types
// 공통 UI 컴포넌트에서 사용되는 타입 정의

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface Gradient {
  type: 'linear' | 'radial' | 'conic';
  angle?: number; // 0-360 (linear, conic)
  centerX?: number; // 0-100 (radial, conic)
  centerY?: number; // 0-100 (radial, conic)
  stops: GradientStop[];
}

export type GradientType = 'linear' | 'radial' | 'conic';