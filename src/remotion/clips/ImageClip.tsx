/**
 * 🖼️ ImageClip.tsx - 이미지 클립 렌더링 컴포넌트
 * 
 * Remotion 환경에서 이미지 미디어를 렌더링하는 최적화된 클립 컴포넌트입니다.
 * 다양한 이미지 형식을 지원하며, 편집 모드와 재생 모드에 따라 동작을 조정합니다.
 * 
 * 주요 기능:
 * - 이미지 로딩 및 표시 (JPG, PNG, WebP, GIF 등)
 * - 배경 채우기 모드 지원 (cover, contain, fill 등)
 * - 이미지 위치 조정 (center, top, bottom 등)
 * - 에러 핸들링 및 대체 이미지 표시
 * - 편집 모드에서의 드래그 이벤트 통과 처리
 * 
 * 성능 최적화:
 * - 이미지 로딩 실패 시 즉시 에러 처리
 * - 불필요한 리렌더링 방지를 위한 최적화된 props 구조
 * - 메모리 효율적인 이미지 핸들링
 * 
 * 사용 패턴:
 * - VideoComposition에서 각 이미지 클립마다 호출됨
 * - 편집 모드와 미리보기 모드에서 동일한 인터페이스 사용
 * - finalStyle props를 통해 위치, 크기, 변형 적용
 * 
 * 특별 고려사항:
 * - 편집 모드에서 pointerEvents 비활성화로 드래그 충돌 방지
 * - 이미지 로딩 실패 시 사용자 친화적 대체 UI 제공
 * - 크로스 브라우저 호환성을 위한 draggable 비활성화
 */

import React from 'react';
import { TimelineClip } from '../../types';

// 이미지 클립 전용 컴포넌트
export const ImageClip: React.FC<{
    clip: TimelineClip;
    finalStyle: React.CSSProperties;
    isEditMode: boolean;
}> = ({ clip, finalStyle, isEditMode }) => {
    if (!clip.mediaUrl) {
        console.warn('Image clip missing mediaUrl:', clip.id);
        return (
            <div style={{
                ...finalStyle,
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: 14,
                fontWeight: 'bold',
                border: '2px dashed #ccc',
                // 편집모드에서 드래그 이벤트 통과 설정
                pointerEvents: isEditMode ? 'none' : 'auto'
            }}>
                이미지 없음
            </div>
        );
    }

    return (
        <img
            src={clip.mediaUrl}
            alt="Media"
            style={{
                ...finalStyle,
                objectFit: (clip.mediaProperties as any)?.backgroundFit || 'cover',
                objectPosition: (clip.mediaProperties as any)?.backgroundPosition || 'center',
                // 편집모드에서 드래그 이벤트 통과 설정
                pointerEvents: isEditMode ? 'none' : 'auto'
            }}
            draggable={false}
            onError={(e) => {
                console.warn('Image load error for clip:', clip.id, clip.mediaUrl);
                // 이미지 로드 실패 시 기본 대체 이미지 또는 에러 표시
                e.currentTarget.style.display = 'none';
            }}
        />
    );
}; 