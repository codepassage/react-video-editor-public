/**
 * 📏 DepthIndicator.tsx - 중첩 깊이 표시 인디케이터 컴포넌트
 * 
 * Bundle의 중첩 깊이를 시각적으로 표현하는 인디케이터 컴포넌트입니다.
 * 복잡한 중첩 구조에서 사용자가 현재 위치를 쉽게 파악할 수 있도록
 * 직관적인 시각적 단서를 제공합니다.
 * 
 * 주요 기능:
 * - 중첩 깊이별 시각적 표시
 * - 색상 코딩을 통한 레벨 구분
 * - 인덴트 스타일 깊이 표현
 * - 계층 구조 브레드크럼
 * - 깊이별 아이콘 표시
 * 
 * 시각적 표현:
 * - 깊이 0: 기본 레벨 (표시 없음)
 * - 깊이 1: 얕은 인덴트 + 색상 1
 * - 깊이 2: 중간 인덴트 + 색상 2
 * - 깊이 3+: 깊은 인덴트 + 경고 색상
 * 
 * 관련 모듈:
 * - 3번 모듈: Bundle System (중첩 번들 구조)
 * - NestedBundleContainer: 중첩 컨테이너 연동
 * - BundleHierarchyTree: 계층 구조 표시
 * - 1번 모듈: Timeline System (시각적 표시)
 */

import React from 'react';

interface DepthIndicatorProps {
  /** 현재 깊이 (0부터 시작) */
  depth: number;
  
  /** 최대 깊이 */
  maxDepth: number;
  
  /** 인디케이터 색상 */
  color: string;
  
  /** 표시 위치 */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** 인디케이터 크기 */
  size?: 'small' | 'medium' | 'large';
  
  /** 스타일 타입 */
  variant?: 'dots' | 'bars' | 'numbers' | 'icons';
  
  /** 애니메이션 효과 */
  animated?: boolean;
  
  /** 툴팁 표시 여부 */
  showTooltip?: boolean;
}

/**
 * 위치에 따른 스타일 계산
 */
const getPositionStyles = (position: DepthIndicatorProps['position']) => {
  const baseStyles = {
    position: 'absolute' as const,
    zIndex: 100
  };

  switch (position) {
    case 'top-left':
      return { ...baseStyles, top: '4px', left: '4px' };
    case 'top-right':
      return { ...baseStyles, top: '4px', right: '4px' };
    case 'bottom-left':
      return { ...baseStyles, bottom: '4px', left: '4px' };
    case 'bottom-right':
      return { ...baseStyles, bottom: '4px', right: '4px' };
    default:
      return { ...baseStyles, top: '4px', left: '4px' };
  }
};

/**
 * 크기에 따른 스타일 계산
 */
const getSizeStyles = (size: DepthIndicatorProps['size'] = 'medium') => {
  switch (size) {
    case 'small':
      return {
        padding: '2px 4px',
        fontSize: '8px',
        borderRadius: '3px',
        gap: '2px'
      };
    case 'large':
      return {
        padding: '6px 10px',
        fontSize: '12px',
        borderRadius: '6px',
        gap: '4px'
      };
    case 'medium':
    default:
      return {
        padding: '4px 6px',
        fontSize: '10px',
        borderRadius: '4px',
        gap: '3px'
      };
  }
};

/**
 * 깊이 비율에 따른 색상 계산
 */
const getDepthColor = (depth: number, maxDepth: number, baseColor: string) => {
  const ratio = depth / Math.max(maxDepth, 1);
  const hue = parseInt(baseColor.match(/hsl\((\d+)/)?.[1] || '220');
  const newHue = (hue + (ratio * 60)) % 360;
  const saturation = Math.max(30, 70 - (ratio * 20));
  const lightness = Math.max(40, 60 - (ratio * 15));
  
  return `hsl(${newHue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Dots 스타일 인디케이터
 */
const DotsIndicator: React.FC<{
  depth: number;
  maxDepth: number;
  color: string;
  size: string;
  animated: boolean;
}> = ({ depth, maxDepth, color, size, animated }) => {
  const dotSize = size === 'small' ? '4px' : size === 'large' ? '8px' : '6px';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {Array.from({ length: Math.min(depth + 1, 5) }, (_, i) => (
        <div
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: i <= depth ? getDepthColor(i, maxDepth, color) : 'rgba(0,0,0,0.2)',
            transition: animated ? 'all 0.3s ease' : 'none',
            opacity: i <= depth ? 1 : 0.3,
            transform: animated && i <= depth ? 'scale(1.2)' : 'scale(1)'
          }}
        />
      ))}
      {depth > 4 && (
        <span style={{ fontSize: '8px', color, marginLeft: '2px' }}>
          +{depth - 4}
        </span>
      )}
    </div>
  );
};

/**
 * Bars 스타일 인디케이터
 */
const BarsIndicator: React.FC<{
  depth: number;
  maxDepth: number;
  color: string;
  size: string;
  animated: boolean;
}> = ({ depth, maxDepth, color, size, animated }) => {
  const barWidth = size === 'small' ? '2px' : size === 'large' ? '4px' : '3px';
  const maxHeight = size === 'small' ? '12px' : size === 'large' ? '20px' : '16px';
  
  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: '1px' }}>
      {Array.from({ length: Math.min(depth + 1, 5) }, (_, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: `${(i + 1) * (parseInt(maxHeight) / 5)}px`,
            backgroundColor: i <= depth ? getDepthColor(i, maxDepth, color) : 'rgba(0,0,0,0.2)',
            borderRadius: '1px',
            transition: animated ? 'all 0.3s ease' : 'none',
            opacity: i <= depth ? 1 : 0.3,
            transform: animated && i <= depth ? 'scaleY(1.1)' : 'scaleY(1)'
          }}
        />
      ))}
    </div>
  );
};

/**
 * Numbers 스타일 인디케이터
 */
const NumbersIndicator: React.FC<{
  depth: number;
  maxDepth: number;
  color: string;
  size: string;
  animated: boolean;
}> = ({ depth, maxDepth, color, size, animated }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size === 'small' ? '16px' : size === 'large' ? '24px' : '20px',
        height: size === 'small' ? '16px' : size === 'large' ? '24px' : '20px',
        backgroundColor: getDepthColor(depth, maxDepth, color),
        color: 'white',
        borderRadius: '50%',
        fontWeight: 'bold',
        fontSize: size === 'small' ? '8px' : size === 'large' ? '12px' : '10px',
        transform: animated ? 'scale(1.1)' : 'scale(1)',
        transition: animated ? 'all 0.3s ease' : 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }}
    >
      {depth}
    </div>
  );
};

/**
 * Icons 스타일 인디케이터
 */
const IconsIndicator: React.FC<{
  depth: number;
  maxDepth: number;
  color: string;
  size: string;
  animated: boolean;
}> = ({ depth, maxDepth, color, size, animated }) => {
  const getDepthIcon = (depth: number) => {
    const icons = ['📦', '📋', '📄', '🔸', '🔹', '⚪', '⚫', '🟢', '🔴', '🟡'];
    return icons[depth % icons.length];
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '2px 4px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '6px',
        border: `1px solid ${color}30`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }}
    >
      <span style={{ 
        fontSize: size === 'small' ? '8px' : size === 'large' ? '12px' : '10px',
        filter: animated ? 'brightness(1.2)' : 'none',
        transition: animated ? 'all 0.3s ease' : 'none'
      }}>
        {getDepthIcon(depth)}
      </span>
      <span style={{
        fontSize: size === 'small' ? '7px' : size === 'large' ? '9px' : '8px',
        color,
        fontWeight: 'bold'
      }}>
        {depth}
      </span>
    </div>
  );
};

/**
 * 중첩 깊이 표시 인디케이터 컴포넌트
 */
export const DepthIndicator: React.FC<DepthIndicatorProps> = ({
  depth,
  maxDepth,
  color,
  position,
  size = 'medium',
  variant = 'dots',
  animated = false,
  showTooltip = true
}) => {
  const positionStyles = getPositionStyles(position);
  const sizeStyles = getSizeStyles(size);

  const tooltipText = `중첩 깊이: ${depth}/${maxDepth}`;

  const renderIndicator = () => {
    const commonProps = { depth, maxDepth, color, size, animated };

    switch (variant) {
      case 'bars':
        return <BarsIndicator {...commonProps} />;
      case 'numbers':
        return <NumbersIndicator {...commonProps} />;
      case 'icons':
        return <IconsIndicator {...commonProps} />;
      case 'dots':
      default:
        return <DotsIndicator {...commonProps} />;
    }
  };

  return (
    <div
      className="depth-indicator"
      style={{
        ...positionStyles,
        ...sizeStyles,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: variant === 'icons' ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
        border: variant === 'icons' ? 'none' : `1px solid ${color}30`,
        boxShadow: variant === 'icons' ? 'none' : '0 1px 3px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(2px)',
        userSelect: 'none',
        pointerEvents: 'none'
      }}
      title={showTooltip ? tooltipText : undefined}
    >
      {renderIndicator()}
    </div>
  );
};

/**
 * 깊이 인디케이터 팩토리 함수
 */
export const createDepthIndicator = (
  depth: number,
  options?: Partial<Omit<DepthIndicatorProps, 'depth'>>
) => {
  return (
    <DepthIndicator
      depth={depth}
      maxDepth={10}
      color="hsl(220, 60%, 60%)"
      position="top-left"
      size="medium"
      variant="dots"
      animated={false}
      showTooltip={true}
      {...options}
    />
  );
};

export default DepthIndicator;
