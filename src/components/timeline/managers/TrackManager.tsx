/**
 * 🎛️ TrackManager.tsx - 트랙 관리 컴포넌트
 * 
 * 타임라인의 트랙을 생성, 편집, 삭제, 재정렬할 수 있는 트랙 관리
 * 컴포넌트입니다. 트랙의 순서 변경, 이름 편집, 기준 트랙 설정 등
 * 트랙 레벨의 모든 관리 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 트랙 이름 편집 (인라인 편집)
 * - 트랙 순서 변경 (위/아래 이동)
 * - 트랙 삭제 (빈 트랙만)
 * - 기준 트랙 표시 및 관리
 * - 트랙 레이어 번호 표시
 * - 트랙별 시각적 구분
 * 
 * 트랙 타입:
 * - 기준 트랙 (Base Track): 다른 클립들이 참조하는 기준
 * - 일반 트랙: 일반적인 미디어 클립 배치
 * - 자동 생성된 트랙과 수동 생성 트랙 구분
 * 
 * 편집 기능:
 * - 트랙 표시명 변경 (displayName)
 * - 트랙 순서 재배치 (drag & drop 대신 버튼)
 * - 빈 트랙 삭제 (클립이 있는 트랙은 보호)
 * 
 * 시각적 표현:
 * - 기준 트랙 특별 스타일링
 * - 트랙 레이어 번호 표시
 * - 편집 모드 시각적 피드백
 * - 삭제 불가능한 트랙 비활성화
 * 
 * 관련 모듈:
 * - 1번 모듈: Timeline System (트랙 관리 핵심)
 * - trackActions: 트랙 상태 관리 액션
 * - baseClips: 기준 트랙 시스템
 * - TimelineTrack: 트랙 타입 정의
 */

import React, { useState } from 'react';
import { Edit3, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { TimelineTrack, DEFAULT_TRACK_HEIGHT, getTrackLayerNumber, isBaseTrack } from '../../../types';

interface TrackManagerProps {
  tracks: TimelineTrack[];
  updateTrackDisplayName: (trackId: string, name: string) => void;
  moveTrackUp: (trackId: string) => void;
  moveTrackDown: (trackId: string) => void;
  removeTrack: (trackId: string) => void;
}

export const TrackManager: React.FC<TrackManagerProps> = ({
  tracks,
  updateTrackDisplayName,
  moveTrackUp,
  moveTrackDown,
  removeTrack
}) => {
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState('');

  // 트랙명 편집 핸들러들
  const handleStartEditTrackName = (trackId: string, currentName: string) => {
    setEditingTrackId(trackId);
    setEditingTrackName(currentName);
  };

  const handleSaveTrackName = () => {
    if (editingTrackId && editingTrackName.trim()) {
      updateTrackDisplayName(editingTrackId, editingTrackName.trim());
    }
    setEditingTrackId(null);
    setEditingTrackName('');
  };

  const handleCancelEditTrackName = () => {
    setEditingTrackId(null);
    setEditingTrackName('');
  };

  const handleTrackNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTrackName();
    } else if (e.key === 'Escape') {
      handleCancelEditTrackName();
    }
  };

  return (
    <div style={{
      width: '160px',
      background: 'linear-gradient(180deg, rgba(22, 33, 62, 0.8) 0%, rgba(15, 52, 96, 0.8) 100%)',
      borderRight: '1px solid rgba(100, 181, 246, 0.2)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 룰러 공간 */}
      <div style={{
        height: '40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(26, 26, 46, 0.3) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <span style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '600',
          letterSpacing: '1px'
        }}>
          TRACKS
        </span>
      </div>

      {/* 트랙 라벨들 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ height: `${tracks.length * DEFAULT_TRACK_HEIGHT}px` }}>
          {tracks.map((track, index) => {
            const layerNumber = getTrackLayerNumber(index, tracks.length);
            const isBase = isBaseTrack(track);
            return (
              <div
                key={track.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '13px',
                  color: isBase ? '#00bcd4' : 'rgba(255, 255, 255, 0.8)',
                  padding: '12px 16px',
                  height: `${DEFAULT_TRACK_HEIGHT}px`,
                  background: isBase
                    ? index % 2 === 0
                      ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 193, 7, 0.1) 50%, rgba(255, 235, 59, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.08) 50%, rgba(255, 235, 59, 0.03) 100%)'
                    : index % 2 === 0
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)'
                      : 'transparent',
                  border: isBase ? '1px solid rgba(255, 152, 0, 0.3)' : 'none',
                  borderLeft: isBase ? '4px solid #ff9800' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isBase
                    ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.25) 0%, rgba(255, 193, 7, 0.2) 50%, rgba(255, 235, 59, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(100, 181, 246, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isBase
                    ? index % 2 === 0
                      ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 193, 7, 0.1) 50%, rgba(255, 235, 59, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.08) 50%, rgba(255, 235, 59, 0.03) 100%)'
                    : index % 2 === 0
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)'
                      : 'transparent';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    flex: 1,
                    minWidth: 0
                  }}>
                    {editingTrackId === track.id ? (
                      <input
                        type="text"
                        value={editingTrackName}
                        onChange={(e) => setEditingTrackName(e.target.value)}
                        onKeyDown={handleTrackNameKeyDown}
                        onBlur={handleSaveTrackName}
                        autoFocus
                        style={{
                          fontWeight: '600',
                          color: '#ffffff',
                          fontSize: '14px',
                          background: 'rgba(100, 181, 246, 0.2)',
                          border: '1px solid #64b5f6',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          width: '100%',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontWeight: '600',
                          color: isBase ? '#00bcd4' : '#ffffff',
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleStartEditTrackName(track.id, track.displayName)}
                        title="클릭해서 트랙명 수정"
                      >
                        {isBase && (
                          <span
                            style={{
                              color: '#ff9800',
                              fontSize: '16px',
                              filter: 'drop-shadow(0 0 4px rgba(255, 152, 0, 0.6))',
                              animation: 'pulse 2s infinite'
                            }}
                            title="기준 트랙"
                          >
                            🎯
                          </span>
                        )}
                        <span style={{
                          color: isBase ? '#ff6b35' : 'inherit'
                        }}>
                          {track.displayName}
                        </span>
                        <Edit3 size={12} style={{ opacity: 0.6 }} />
                      </div>
                    )}

                    <div style={{
                      fontSize: '11px',
                      color: '#64b5f6',
                      fontWeight: '500'
                    }}>
                      Layer {layerNumber}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {track.clips.length} clips
                    </div>
                  </div>

                  {/* 트랙 컨트롤 버튼들 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '8px'
                  }}>
                    {/* 트랙 순서 변경 버튼들 */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <button
                        onClick={() => moveTrackUp(track.id)}
                        disabled={index === 0}
                        style={{
                          padding: '2px',
                          background: index === 0
                            ? 'rgba(158, 158, 158, 0.3)'
                            : 'linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(100, 181, 246, 0.8) 100%)',
                          border: `1px solid ${index === 0 ? 'rgba(158, 158, 158, 0.3)' : 'rgba(33, 150, 243, 0.4)'}`,
                          borderRadius: '4px',
                          color: index === 0 ? 'rgba(255, 255, 255, 0.4)' : '#ffffff',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                          opacity: index === 0 ? 0.4 : 0.8,
                          fontSize: '10px',
                          lineHeight: 1
                        }}
                        title={index === 0 ? '맨 위 트랙입니다' : `${track.displayName}을 위로 이동`}
                        onMouseEnter={(e) => {
                          if (index !== 0) {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== 0) {
                            e.currentTarget.style.opacity = '0.8';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        <ChevronUp size={10} />
                      </button>

                      <button
                        onClick={() => moveTrackDown(track.id)}
                        disabled={index === tracks.length - 1}
                        style={{
                          padding: '2px',
                          background: index === tracks.length - 1
                            ? 'rgba(158, 158, 158, 0.3)'
                            : 'linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(100, 181, 246, 0.8) 100%)',
                          border: `1px solid ${index === tracks.length - 1 ? 'rgba(158, 158, 158, 0.3)' : 'rgba(33, 150, 243, 0.4)'}`,
                          borderRadius: '4px',
                          color: index === tracks.length - 1 ? 'rgba(255, 255, 255, 0.4)' : '#ffffff',
                          cursor: index === tracks.length - 1 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                          opacity: index === tracks.length - 1 ? 0.4 : 0.8,
                          fontSize: '10px',
                          lineHeight: 1
                        }}
                        title={index === tracks.length - 1 ? '맨 아래 트랙입니다' : `${track.displayName}을 아래로 이동`}
                        onMouseEnter={(e) => {
                          if (index !== tracks.length - 1) {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== tracks.length - 1) {
                            e.currentTarget.style.opacity = '0.8';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        <ChevronDown size={10} />
                      </button>
                    </div>

                    {/* 트랙 삭제 버튼 */}
                    {tracks.length > 1 && (
                      <button
                        onClick={() => removeTrack(track.id)}
                        style={{
                          padding: '4px',
                          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.8) 0%, rgba(229, 115, 115, 0.8) 100%)',
                          border: '1px solid rgba(244, 67, 54, 0.4)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                          opacity: 0.7
                        }}
                        title={`${track.displayName} 삭제`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(244, 67, 54, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Minus size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};