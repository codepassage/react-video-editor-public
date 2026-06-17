/**
 * 🎵 TimelineTrack.tsx - 개별 트랙 컴포넌트
 * 
 * 타임라인의 각 트랙을 렌더링하는 컴포넌트
 * Base Track과 일반 트랙을 구분하여 시각적으로 표현
 * 
 * 주요 기능:
 * - Base Track 시각적 구분 (오렌지 그래디언트)
 * - 트랙별 클립 렌더링 및 관리
 * - 레이어 번호 표시 (L1, L2...)
 * - 트랙 잠금/비활성화 상태 처리
 * - 빈 트랙에 대한 안내 메시지
 * 
 * Base Track 특징:
 * - 프로젝트의 기준이 되는 특별한 트랙
 * - 오렌지/골드 색상으로 시각적 구분
 * - 다른 클립들의 동기화 기준점 역할
 */

import React from 'react';
import { TimelineTrack as TrackType, DEFAULT_TRACK_HEIGHT, getTrackLayerNumber, isBaseTrack } from '../../types';
import { TimelineClip } from './TimelineClip';
import { useEditorStore } from '../../store/editorStore';

interface TimelineTrackProps {
  track: TrackType;
  index: number;
  zoom: number;
  totalWidth: number;
  scrollLeft: number;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  track,
  index,
  zoom,
  totalWidth,
  scrollLeft
}) => {
  const { tracks } = useEditorStore();
  const trackTop = index * DEFAULT_TRACK_HEIGHT;
  const layerNumber = getTrackLayerNumber(index, tracks.length);
  const isBase = isBaseTrack(track); // Base Track 확인

  return (
    <div
      className={`absolute timeline-track ${!track.isVisible ? 'opacity-50' : ''}`}
      style={{
        top: `${trackTop}px`,
        width: `${totalWidth}px`,
        height: `${track.height}px`,
        // 🎯 Base Track 배경색 구분
        background: isBase
          ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 193, 7, 0.06) 50%, rgba(255, 235, 59, 0.04) 100%)' // Base Track 배경 - 오렌지 계열
          : 'transparent' // 일반 트랙 배경
      }}
    >
      {/* 트랙 배경 및 비활성화 오버레이 */}
      {track.isLocked && (
        <div className="absolute inset-0 bg-gray-600/30 z-10 pointer-events-none" />
      )}

      {/* 레이어 번호 표시 */}
      <div 
        className={isBase ? 'base-track-layer' : ''}
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          background: isBase 
            ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.9) 0%, rgba(255, 193, 7, 0.9) 100%)' // Base Track 라벨 - 오렌지 그래디언트
            : 'rgba(0, 0, 0, 0.6)', // 일반 트랙 라벨
          color: isBase ? '#000000' : '#ffffff', // Base Track은 검은 글씨
          fontSize: '12px',
          fontWeight: isBase ? '700' : '500', // Base Track은 더 굵은 글씨
          padding: '4px 8px',
          borderRadius: '6px',
          zIndex: 20,
          border: isBase ? '1px solid rgba(255, 152, 0, 0.8)' : 'none', // Base Track에 테두리
          boxShadow: isBase 
            ? '0 2px 8px rgba(255, 152, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' // Base Track에 골드 그림자
            : 'none',
          textShadow: isBase ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        {isBase ? `🎯 L${layerNumber}` : `L${layerNumber}`}
      </div>

      {/* 클립들 - 🎯 모든 클립 렌더링 (그룹화된 클립은 마우스 이벤트 차단) */}
      {track.clips.map((clip) => (
        <TimelineClip
          key={clip.id}
          clip={clip}
          zoom={zoom}
          trackHeight={track.height}
          isTrackLocked={track.isLocked}
          isGrouped={!!clip.templateGroupId} // 그룹화된 클립인지 표시
          scrollLeft={scrollLeft}
        />
      ))}

      {/* 트랙이 비어있을 때 안내 텍스트 */}
      {track.clips.length === 0 && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            color: isBase ? 'rgba(255, 152, 0, 0.7)' : 'rgba(128, 128, 128, 0.7)', // Base Track은 오렌지 색상
            fontSize: '14px',
            fontWeight: isBase ? '600' : '400' // Base Track은 더 굵은 글씨
          }}
        >
          {isBase 
            ? `🎯 기준 클립을 여기에 드래그하세요 (레이어 ${layerNumber})` 
            : `미디어를 여기에 드래그하세요 (레이어 ${layerNumber})`
          }
        </div>
      )}
    </div>
  );
};
