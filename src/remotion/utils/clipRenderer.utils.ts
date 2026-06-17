// 🎆 공통 둥근 모서리 계산 함수 (SimpleShape + PolygonShape 공통 사용)
export const getBorderRadiusValue = (radius: number, unit: 'px' | '%', clipWidth: number, clipHeight: number): string => {
    if (unit === '%') {
        // % 단위일 때: 작은 쪽 기준으로 계산
        const minSize = Math.min(clipWidth, clipHeight);
        return `${(radius / 100) * minSize}px`;
    }
    return `${radius}px`;
};

// Edge Fade 마스크 생성 함수
export const getEdgeFadeMask = (
    edgeFade: number,
    fadeType: string,
    edgeFadeStops?: Array<{ position: number; opacity: number }>
) => {
    if (edgeFade <= 0) return {};

    let maskImage: string;

    // Multi-Stop 시스템 사용 시
    if (edgeFadeStops && edgeFadeStops.length >= 2) {
        const sortedStops = edgeFadeStops.sort((a, b) => a.position - b.position);
        const stopStr = sortedStops.map(stop => `rgba(0,0,0,${(100 - stop.opacity) / 100}) ${stop.position}%`).join(', ');

        switch (fadeType) {
            case 'radial':
                maskImage = `radial-gradient(circle at center, ${stopStr})`;
                break;
            case 'linear-top':
                maskImage = `linear-gradient(to bottom, ${stopStr})`;
                break;
            case 'linear-bottom':
                maskImage = `linear-gradient(to top, ${stopStr})`;
                break;
            case 'linear-left':
                maskImage = `linear-gradient(to right, ${stopStr})`;
                break;
            case 'linear-right':
                maskImage = `linear-gradient(to left, ${stopStr})`;
                break;
            default:
                return {};
        }
    } else {
        // 기존 단순 시스템 (Fallback)
        switch (fadeType) {
            case 'radial':
                maskImage = `radial-gradient(circle at center, black ${100 - edgeFade}%, transparent 100%)`;
                break;
            case 'linear-top':
                maskImage = `linear-gradient(to bottom, transparent 0%, black ${edgeFade}%, black 100%)`;
                break;
            case 'linear-bottom':
                maskImage = `linear-gradient(to top, transparent 0%, black ${edgeFade}%, black 100%)`;
                break;
            case 'linear-left':
                maskImage = `linear-gradient(to right, transparent 0%, black ${edgeFade}%, black 100%)`;
                break;
            case 'linear-right':
                maskImage = `linear-gradient(to left, transparent 0%, black ${edgeFade}%, black 100%)`;
                break;
            default:
                return {};
        }
    }

    return {
        maskImage,
        WebkitMaskImage: maskImage
    };
}; 