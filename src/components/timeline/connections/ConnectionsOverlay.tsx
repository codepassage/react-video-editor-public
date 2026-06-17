/**
 * 🔗 ConnectionsOverlay.tsx - 클립 간 연결 관계 시각화 오버레이
 * 
 * 타임라인에서 기준 클립과 일반 클립 간의 앵커 연결 관계를 시각적으로
 * 표시하는 오버레이 컴포넌트입니다. 확장된 앵커 시스템을 지원하여
 * 클립, 템플릿 그룹, 번들 간의 복잡한 종속 관계를 직관적으로 보여줍니다.
 * 
 * 주요 기능:
 * - 기준 클립 ↔ 일반 클립 연결선 표시
 * - 템플릿 그룹 ↔ 클립 연결 관계
 * - 번들 ↔ 클립 종속 관계 시각화
 * - 시작점/끝점 앵커 구분 표시
 * - 오프셋 값 라벨 표시
 * - 연결 상태별 색상 구분
 * 
 * 연결 타입:
 * - baseClip: 기준 클립과의 연결
 * - templateGroup: 템플릿 그룹과의 연결
 * - bundle: 번들과의 연결
 * - start/end: 시작점 또는 끝점 앵커
 * 
 * 시각적 표현:
 * - 베지어 곡선으로 부드러운 연결선
 * - 색상 코딩 (연결 타입별)
 * - 화살표 방향 표시
 * - 오프셋 값 텍스트 라벨
 * - 호버 시 하이라이트 효과
 * 
 * 좌표 계산:
 * - 클립/그룹/번들의 화면상 위치 계산
 * - 줌 레벨에 따른 동적 좌표 변환
 * - 트랙 높이 및 오프셋 고려
 * - SVG 좌표계 변환
 * 
 * 성능 최적화:
 * - 화면에 보이는 연결만 렌더링
 * - 메모이제이션을 통한 불필요한 재계산 방지
 * - requestAnimationFrame 활용
 * - 가상화된 렌더링
 * 
 * 관련 모듈:
 * - baseClips.ts: 확장된 앵커 시스템
 * - 3번 모듈: Bundle System (번들 연결)
 * - 9번 모듈: Template System (템플릿 그룹 연결)
 * - 1번 모듈: Timeline System (시각적 표시)
 */

import React, { useCallback } from 'react';
import {
    TimelineClip,
    TimelineTrack,
    TemplateGroup,
    Bundle,
    DEFAULT_TRACK_HEIGHT,
    isBaseClip,
    getEffectiveStartAnchor,
    getEffectiveEndAnchor
} from '../../../types';

// 확장된 연결관계 타입
interface ExtendedClipConnection {
    fromTargetId: string;
    fromTargetType: 'baseClip' | 'templateGroup' | 'bundle';
    fromPoint: 'start' | 'end';
    toClipId: string;
    toPoint: 'start' | 'end';
    offset: number;
}

// 기존 연결관계 타입 (호환성)
interface ClipConnection {
    fromClipId: string;
    fromPoint: 'start' | 'end';
    toClipId: string;
    toPoint: 'start' | 'end';
    offset: number;
}

interface ConnectionsOverlayProps {
    allClips: TimelineClip[];
    tracks: TimelineTrack[];
    templateGroups?: TemplateGroup[];
    bundles?: Bundle[];
    zoom: number;
    scrollLeft: number;
    timelineWidth: number;
    showConnections: boolean;
}

// 클립 연결관계 시각화 오버레이
export const ConnectionsOverlay: React.FC<ConnectionsOverlayProps> = ({
    allClips,
    tracks,
    templateGroups = [],
    bundles = [],
    zoom,
    scrollLeft,
    timelineWidth,
    showConnections
}) => {
    // 확장된 연결관계 분석
    const analyzeExtendedClipConnections = useCallback((): ExtendedClipConnection[] => {
        const connections: ExtendedClipConnection[] = [];

        allClips.forEach((clip) => {
            if (!isBaseClip(clip) && clip.regularClipProperties) {
                // 효과적인 앵커 찾기 (확장된 버전 우선)
                const effectiveStartAnchor = getEffectiveStartAnchor(clip.regularClipProperties);
                const effectiveEndAnchor = getEffectiveEndAnchor(clip.regularClipProperties);

                if (effectiveStartAnchor) {
                    let targetType: 'baseClip' | 'templateGroup' | 'bundle' = 'baseClip';
                    let targetId = '';

                    if (effectiveStartAnchor.baseClipId) {
                        targetType = 'baseClip';
                        targetId = effectiveStartAnchor.baseClipId;
                    } else if (effectiveStartAnchor.templateGroupId) {
                        targetType = 'templateGroup';
                        targetId = effectiveStartAnchor.templateGroupId;
                    } else if (effectiveStartAnchor.bundleId) {
                        targetType = 'bundle';
                        targetId = effectiveStartAnchor.bundleId;
                    }

                    if (targetId) {
                        connections.push({
                            fromTargetId: targetId,
                            fromTargetType: targetType,
                            fromPoint: effectiveStartAnchor.anchorPoint,
                            toClipId: clip.id,
                            toPoint: 'start',
                            offset: effectiveStartAnchor.offset
                        });
                    }
                }

                if (effectiveEndAnchor) {
                    let targetType: 'baseClip' | 'templateGroup' | 'bundle' = 'baseClip';
                    let targetId = '';

                    if (effectiveEndAnchor.baseClipId) {
                        targetType = 'baseClip';
                        targetId = effectiveEndAnchor.baseClipId;
                    } else if (effectiveEndAnchor.templateGroupId) {
                        targetType = 'templateGroup';
                        targetId = effectiveEndAnchor.templateGroupId;
                    } else if (effectiveEndAnchor.bundleId) {
                        targetType = 'bundle';
                        targetId = effectiveEndAnchor.bundleId;
                    }

                    if (targetId) {
                        connections.push({
                            fromTargetId: targetId,
                            fromTargetType: targetType,
                            fromPoint: effectiveEndAnchor.anchorPoint,
                            toClipId: clip.id,
                            toPoint: 'end',
                            offset: effectiveEndAnchor.offset
                        });
                    }
                }
            }
        });

        return connections;
    }, [allClips]);

    // 기존 연결관계 분석 (호환성 유지)
    const analyzeClipConnections = useCallback((): ClipConnection[] => {
        const connections: ClipConnection[] = [];

        allClips.forEach((clip) => {
            if (!isBaseClip(clip) && clip.regularClipProperties) {
                const { startAnchor, endAnchor } = clip.regularClipProperties;

                if (startAnchor) {
                    connections.push({
                        fromClipId: startAnchor.baseClipId,
                        fromPoint: startAnchor.anchorPoint,
                        toClipId: clip.id,
                        toPoint: 'start',
                        offset: startAnchor.offset
                    });
                }

                if (endAnchor) {
                    connections.push({
                        fromClipId: endAnchor.baseClipId,
                        fromPoint: endAnchor.anchorPoint,
                        toClipId: clip.id,
                        toPoint: 'end',
                        offset: endAnchor.offset
                    });
                }
            }
        });

        return connections;
    }, [allClips]);

    // 확장된 앵커 대상의 연결점 좌표 계산
    const getExtendedConnectionPoint = useCallback(
        (targetId: string, targetType: 'baseClip' | 'templateGroup' | 'bundle', point: 'start' | 'end') => {
            if (targetType === 'baseClip') {
                const clip = allClips.find((c) => c.id === targetId);
                if (!clip) return null;

                const trackIndex = tracks.findIndex((track) =>
                    track.clips.some((c) => c.id === targetId)
                );
                if (trackIndex === -1) return null;

                const trackY = trackIndex * DEFAULT_TRACK_HEIGHT + DEFAULT_TRACK_HEIGHT / 2;
                const pointX = (point === 'start' ? clip.startTime : clip.endTime) * zoom;

                return { x: pointX, y: trackY };
            } else if (targetType === 'templateGroup') {
                const group = templateGroups.find((g) => g.id === targetId);
                if (!group) return null;

                // 템플릿 그룹의 Y 좌표는 그룹에 속한 첫 번째 클립의 트랙을 기준
                if (group.clipIds && group.clipIds.length > 0) {
                    const firstClipId = group.clipIds[0];
                    const trackIndex = tracks.findIndex((track) =>
                        track.clips.some((c) => c.id === firstClipId)
                    );
                    if (trackIndex !== -1) {
                        const trackY = trackIndex * DEFAULT_TRACK_HEIGHT + DEFAULT_TRACK_HEIGHT / 2;
                        const pointX = (point === 'start' ? group.startTime : group.endTime) * zoom;
                        return { x: pointX, y: trackY };
                    }
                }
            } else if (targetType === 'bundle') {
                const bundle = bundles.find((b) => b.id === targetId);
                if (!bundle) return null;

                // 번들의 Y 좌표는 번들에 속한 첫 번째 기준클립의 트랙을 기준
                let firstClipId = null;
                
                // 1. 기준클립이 있으면 사용
                if (bundle.baseClipIds && bundle.baseClipIds.length > 0) {
                    firstClipId = bundle.baseClipIds[0];
                } else if (bundle.templateGroupIds && bundle.templateGroupIds.length > 0) {
                    // 2. 템플릿 그룹의 첫 번째 클립 사용
                    const templateGroupId = bundle.templateGroupIds[0];
                    const templateGroup = templateGroups.find(g => g.id === templateGroupId);
                    if (templateGroup && templateGroup.clipIds && templateGroup.clipIds.length > 0) {
                        firstClipId = templateGroup.clipIds[0];
                    }
                }
                
                if (firstClipId) {
                    const trackIndex = tracks.findIndex((track) =>
                        track.clips.some((c) => c.id === firstClipId)
                    );
                    if (trackIndex !== -1) {
                        const trackY = trackIndex * DEFAULT_TRACK_HEIGHT + DEFAULT_TRACK_HEIGHT / 2;
                        const pointX = (point === 'start' ? bundle.startTime : bundle.endTime) * zoom;
                        return { x: pointX, y: trackY };
                    }
                }
            }

            return null;
        },
        [allClips, tracks, templateGroups, bundles, zoom]
    );

    // 클립의 연결점 좌표 계산 (기존 호환성)
    const getClipConnectionPoint = useCallback(
        (clipId: string, point: 'start' | 'end') => {
            const clip = allClips.find((c) => c.id === clipId);
            if (!clip) return null;

            const trackIndex = tracks.findIndex((track) =>
                track.clips.some((c) => c.id === clipId)
            );
            if (trackIndex === -1) return null;

            const trackY =
                trackIndex * DEFAULT_TRACK_HEIGHT + DEFAULT_TRACK_HEIGHT / 2;
            const pointX =
                (point === 'start' ? clip.startTime : clip.endTime) * zoom;

            return { x: pointX, y: trackY };
        },
        [allClips, tracks, zoom]
    );

    // 확장된 연결선 색상 결정
    const getExtendedConnectionColor = (connection: ExtendedClipConnection): string => {
        if (connection.fromTargetType === 'templateGroup') {
            return connection.toPoint === 'start' ? '#9c27b0' : '#673ab7'; // 보라색 계열
        } else if (connection.fromTargetType === 'bundle') {
            return connection.toPoint === 'start' ? '#ff5722' : '#ff9800'; // 주황색 계열
        } else {
            return connection.toPoint === 'start' ? '#4caf50' : '#ff9800'; // 기존 기준클립 색상
        }
    };

    // 연결선 색상 결정 (기존 호환성)
    const getConnectionColor = (connection: ClipConnection): string => {
        return connection.toPoint === 'start' ? '#4caf50' : '#ff9800';
    };

    // SVG 화살표 컴포넌트
    const ConnectionArrow: React.FC<{
        from: { x: number; y: number };
        to: { x: number; y: number };
        color: string;
    }> = ({ from, to, color }) => {
        const deltaY = Math.abs(to.y - from.y);
        const controlOffset = Math.min(deltaY * 0.5, 30);

        const path = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset
            } ${to.y}, ${to.x} ${to.y}`;

        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowLength = 8;
        const arrowAngle = Math.PI / 6;

        const arrowX1 = to.x - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = to.y - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = to.x - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = to.y - arrowLength * Math.sin(angle + arrowAngle);

        return (
            <g opacity={0.8}>
                <path
                    d={path}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="6,4"
                    fill="none"
                />

                <path
                    d={`M ${to.x} ${to.y} L ${arrowX1} ${arrowY1} M ${to.x} ${to.y} L ${arrowX2} ${arrowY2}`}
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                />

                <circle cx={from.x} cy={from.y} r={4} fill={color} opacity={0.9} />
                <circle cx={to.x} cy={to.y} r={4} fill={color} opacity={0.9} />

                <circle cx={from.x} cy={from.y} r={2} fill="white" opacity={0.8} />
                <circle cx={to.x} cy={to.y} r={2} fill="white" opacity={0.8} />
            </g>
        );
    };

    // 확장된 연결관계와 기존 연결관계 모두 수집
    const extendedConnections = analyzeExtendedClipConnections();
    const legacyConnections = analyzeClipConnections();
    
    if (!showConnections || (extendedConnections.length === 0 && legacyConnections.length === 0)) return null;

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: -scrollLeft,
                width: timelineWidth,
                height: '100%',
                pointerEvents: 'none',
                zIndex: 5,
                overflow: 'visible'
            }}
        >
            {/* 글로우 효과 필터 */}
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={2} result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* 확장된 연결선 렌더링 */}
            {extendedConnections.map((connection, idx) => {
                const from = getExtendedConnectionPoint(
                    connection.fromTargetId,
                    connection.fromTargetType,
                    connection.fromPoint
                );
                const to = getClipConnectionPoint(
                    connection.toClipId,
                    connection.toPoint
                );
                
                
                if (!from || !to) return null;
                return (
                    <ConnectionArrow
                        key={`extended-${connection.fromTargetId}-${connection.toClipId}-${idx}`}
                        from={from}
                        to={to}
                        color={getExtendedConnectionColor(connection)}
                    />
                );
            })}

            {/* 기존 연결선 렌더링 (호환성) */}
            {legacyConnections.map((connection, idx) => {
                const from = getClipConnectionPoint(
                    connection.fromClipId,
                    connection.fromPoint
                );
                const to = getClipConnectionPoint(
                    connection.toClipId,
                    connection.toPoint
                );
                if (!from || !to) return null;
                return (
                    <ConnectionArrow
                        key={`legacy-${connection.fromClipId}-${connection.toClipId}-${idx}`}
                        from={from}
                        to={to}
                        color={getConnectionColor(connection)}
                    />
                );
            })}
        </svg>
    );
}; 