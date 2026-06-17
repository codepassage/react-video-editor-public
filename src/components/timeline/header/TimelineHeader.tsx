import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { ZoomControls } from '../../ZoomControls';
import { ProjectDurationControl } from '../../ProjectDurationControl';
import { recalculateEndpointOffsets } from '../../../types';
import { useEditorStore } from '../../../store/editorStore';
import { BundleCreationModal } from '../BundleCreationModal';
import { globalAlert } from '../../../utils/globalAlert';
import { calculateStandardDurationFromClips, calculateMaxEndTimeFromClips } from '../../../utils/template';
import { SnapSettings } from '../SnapSettings';
// 🎆 타입 가드 함수들 import
import {
  isVisualClip,
  isAudioClip,
  hasAudioProperties,
  isTextClip,
  isVideoClip,
  isImageClip,
  getClipCategory
} from '../../../types/clipGuards';

interface TimelineHeaderProps {
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  isMuted: boolean;
  playerRealTime?: number; // 실시간 시간 추가
  showConnections: boolean;
  allClips: any[];
  clipStats: {
    total: number;
    visual: number;
    audio: number;
    withAudio: number;
    byType: {
      video: number;
      audio: number;
      image: number;
      text: number;
      shape: number;
    };
    categories: {
      visual: number;
      audio: number;
      mixed: number;
    };
  };
  tracks: any[];
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  toggleMuted: () => void;
  setShowConnections: (show: boolean) => void;
  addTrack: () => void;
  removeTrack: (trackId: string) => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  currentTime,
  totalDuration,
  isPlaying,
  isMuted,
  playerRealTime,
  showConnections,
  allClips,
  clipStats,
  tracks,
  setIsPlaying,
  setCurrentTime,
  toggleMuted,
  setShowConnections,
  addTrack,
  removeTrack
}) => {
  const {
    updateClip,
    // Bundle 관련
    pendingBundleSelection,
    bundles,
    selectedBundleId,
    createBundle,
    ungroupBundleSafely,
    clearBundleSelection,
    validateBundleContinuity,
    // 템플릿 그룹 관련
    templateGroups
  } = useEditorStore();

  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);

  // 🔗 Base 클립 확인 함수
  const isBaseClip = (clip: any) => clip.baseClipProperties?.isBaseClip;

  // 🔍 연결된 클립 계산 (타입 가드 활용)
  const connectedClipsCount = allClips.filter(clip =>
    !isBaseClip(clip) &&
    clip.regularClipProperties &&
    (clip.regularClipProperties.startAnchor || clip.regularClipProperties.endAnchor)
  ).length;

  // 🎵 오디오 기능 유무 확인 (타입 가드 활용)
  const hasAnyAudioClips = clipStats.withAudio > 0;


  // 끝점 offset 재계산 핸들러 (확장된 앵커 지원)
  const handleRecalculateOffsets = () => {
    const result = recalculateEndpointOffsets(allClips, templateGroups, bundles);

    if (result.success && result.updatedClips.length > 0) {
      // 업데이트된 클립들을 개별적으로 적용
      result.updatedClips.forEach(updatedClip => {
        updateClip(updatedClip.id, {
          regularClipProperties: updatedClip.regularClipProperties
        });
      });

      console.log('✅ Offset 재계산 완료:', {
        processedCount: result.processedCount,
        message: result.message
      });
    } else {
      console.log('ℹ️ Offset 재계산 결과:', {
        message: result.message
      });
    }
  };

  // Bundle 생성 핸들러
  const handleCreateBundle = () => {
    if (pendingBundleSelection.length < 2) {
      globalAlert.showError('Bundle을 만들려면 최소 2개의 요소를 선택해야 합니다.');
      return;
    }

    const validation = validateBundleContinuity(pendingBundleSelection);
    if (!validation.valid) {
      globalAlert.showError(`Bundle 생성 불가: ${validation.reason}`);
      return;
    }

    setIsBundleModalOpen(true);
  };

  // Bundle 생성 확인
  const handleBundleCreationConfirm = (bundleData: { name: string; color: string }) => {
    createBundle(bundleData, pendingBundleSelection);
    setIsBundleModalOpen(false);
    console.log('✅ Bundle 생성 완료:', bundleData.name);
  };

  // Bundle 해제 핸들러 (개선된 버전)
  const handleUngroupBundle = async () => {
    if (!selectedBundleId) {
      globalAlert.showError('해제할 Bundle을 선택해주세요.');
      return;
    }

    // 개선된 Bundle 해제 기능 사용
    const result = await ungroupBundleSafely(selectedBundleId, true); // 확인 대화상자 표시

    if (result.success) {
      console.log('✅ Bundle 해제 성공:', {
        bundleName: result.bundleName,
        해제된요소수: result.releasedElements,
        기준클립: result.releasedBaseClips,
        템플릿그룹: result.releasedTemplateGroups
      });

      // 성공 메시지 표시 (선택적)
      // globalAlert.showSuccess(`Bundle "${result.bundleName}"이 성공적으로 해제되었습니다.\n해제된 요소: ${result.releasedElements}개`);
    } else {
      console.log('❌ Bundle 해제 실패:', result.reason);
      globalAlert.showError(`Bundle 해제 실패: ${result.reason}`);
    }
  };

  // Bundle 상태 계산
  const canCreateBundle = pendingBundleSelection.length >= 2;
  const canUngroupBundle = selectedBundleId !== null;
  const selectedBundle = selectedBundleId ? bundles.find(b => b.id === selectedBundleId) : null;

  return (
    <div style={{
      height: '70px',
      background: 'linear-gradient(135deg, rgba(22, 33, 62, 0.9) 0%, rgba(15, 52, 96, 0.9) 100%)',
      borderBottom: '1px solid rgba(100, 181, 246, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      backdropFilter: 'blur(20px)',
      boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{
        color: '#ffffff',
        fontWeight: '700',
        fontSize: '18px',
        margin: 0,
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        background: 'linear-gradient(135deg, #64b5f6 0%, #2196f3 50%, #1976d2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: '0.5px'
      }}>
        타임라인
      </h3>

      {/* 줌 컨트롤 영역 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <ZoomControls containerWidth={1000} />
      </div>

      {/* 시간 정보 및 컨트롤 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* 편집 시간 설정 */}
        <ProjectDurationControl />

        {/* 마지막 클립 시간에 맞추기 버튼 */}
        <button
          onClick={async () => {
            // 표준 방식으로 최대 종료 시간 및 재생시간 계산
            const maxEndTime = calculateMaxEndTimeFromClips(allClips);
            const newDuration = calculateStandardDurationFromClips(allClips);

            if (maxEndTime > 0) {
              // confirm 다이얼로그
              const confirmed = await globalAlert.confirm(`편집 시간을 ${newDuration}초로 변경하시겠습니까?\n(현재 마지막 클립 종료 시간: ${maxEndTime.toFixed(2)}초)`);

              if (confirmed) {
                // 프로젝트 duration 업데이트 (store에서 가져온 updateProjectSettings 사용)
                const { updateProjectSettings } = useEditorStore.getState();
                updateProjectSettings({ duration: newDuration });

                console.log(`✅ 편집 시간을 마지막 클립 시간에 맞춤 (표준): ${maxEndTime.toFixed(2)}s → ${newDuration}s`);
              }
            } else {
              // alert 다이얼로그
              globalAlert.showWarning('클립이 없어서 시간을 조정할 수 없습니다.');
            }
          }}
          style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 50%, #ce93d8 100%)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            whiteSpace: 'nowrap'
          }}
          title="편집 시간을 마지막 클립의 종료 시간에 맞춥니다"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(156, 39, 176, 0.3)';
          }}
        >
          ⏰
        </button>

        <div style={{
          fontSize: '14px',
          color: '#ffffff',
          fontFamily: 'monospace',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(26, 26, 46, 0.6) 100%)',
          backdropFilter: 'blur(15px)',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(100, 181, 246, 0.3)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600'
        }}>
          <span style={{
            color: '#fbbf24', // 노란색으로 변경
            fontWeight: 'bold',
            fontSize: '15px',
            padding: '2px 4px',
            borderRadius: '3px'
          }}>
            {(isPlaying ? (playerRealTime ?? currentTime) : currentTime).toFixed(2)}s
          </span>
          <span style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px'
          }}>
            /
          </span>
          <span style={{
            color: '#64b5f6',
            fontSize: '15px'
          }}>
            {totalDuration.toFixed(2)}s
          </span>
        </div>

        {/* 스냅 설정 UI */}
        <SnapSettings />

        {/* 재생 컨트롤 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(15px)'
        }}>
          <button
            onClick={() => {
              setCurrentTime(0);
              if (isPlaying) {
                setIsPlaying(false);
              }
            }}
            style={{
              padding: '8px 10px',
              background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.8) 0%, rgba(189, 189, 189, 0.8) 100%)',
              border: '1px solid rgba(158, 158, 158, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(158, 158, 158, 0.2)',
              fontWeight: '600'
            }}
            title="처음으로"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(158, 158, 158, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(158, 158, 158, 0.2)';
            }}
          >
            ⏮️
          </button>

          <button
            onClick={() => {
              const newPlayingState = !isPlaying;
              setIsPlaying(newPlayingState);
            }}
            style={{
              padding: '10px 16px',
              background: isPlaying
                ? 'linear-gradient(135deg, #f44336 0%, #e57373 50%, #ef5350 100%)'
                : 'linear-gradient(135deg, #2196f3 0%, #42a5f5 50%, #64b5f6 100%)',
              border: `1px solid ${isPlaying ? 'rgba(244, 67, 54, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`,
              borderRadius: '10px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: `0 4px 15px ${isPlaying ? 'rgba(244, 67, 54, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
            title={isPlaying ? '정지' : '재생'}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${isPlaying ? 'rgba(244, 67, 54, 0.5)' : 'rgba(33, 150, 243, 0.5)'}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${isPlaying ? 'rgba(244, 67, 54, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`;
            }}
          >
            {isPlaying ? '⏸️ 정지' : '▶️ 재생'}
          </button>

          {/* 음소거 버튼 - 오디오 클립이 있을 때만 활성화 */}
          <button
            onClick={() => {
              if (hasAnyAudioClips) {
                toggleMuted();
              }
            }}
            disabled={!hasAnyAudioClips}
            style={{
              padding: '10px 14px',
              background: !hasAnyAudioClips
                ? 'linear-gradient(135deg, rgba(158, 158, 158, 0.5) 0%, rgba(189, 189, 189, 0.5) 100%)'
                : isMuted
                  ? 'linear-gradient(135deg, #f44336 0%, #e57373 50%, #ef5350 100%)'
                  : 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)',
              border: `1px solid ${!hasAnyAudioClips ? 'rgba(158, 158, 158, 0.3)' : isMuted ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
              borderRadius: '10px',
              color: !hasAnyAudioClips ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
              cursor: hasAnyAudioClips ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: `0 4px 15px ${!hasAnyAudioClips ? 'rgba(158, 158, 158, 0.2)' : isMuted ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              opacity: hasAnyAudioClips ? 1 : 0.6
            }}
            title={!hasAnyAudioClips ? `오디오 클립 없음 (${clipStats.withAudio}개)` : isMuted ? '음소거 해제' : '음소거'}
            onMouseEnter={(e) => {
              if (hasAnyAudioClips) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${isMuted ? 'rgba(244, 67, 54, 0.5)' : 'rgba(76, 175, 80, 0.5)'}`;
              }
            }}
            onMouseLeave={(e) => {
              if (hasAnyAudioClips) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 4px 15px ${isMuted ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`;
              }
            }}
          >
            {!hasAnyAudioClips ? '🔇' : isMuted ? '🔇' : '🔊'}
            <span>{!hasAnyAudioClips ? `오디오 없음` : isMuted ? '음소거' : '오디오'}</span>
          </button>

          {/* 연결선 표시 토글 버튼 */}
          <button
            onClick={() => {
              const newState = !showConnections;
              console.log(`🔗 연결선 토글:`, {
                '이전상태': showConnections,
                '새상태': newState,
                '연결가능클립': connectedClipsCount,
                '전체클립': clipStats.total
              });
              setShowConnections(newState);
            }}
            style={{
              padding: '10px 14px',
              background: showConnections
                ? 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 50%, #ce93d8 100%)'
                : 'linear-gradient(135deg, rgba(158, 158, 158, 0.8) 0%, rgba(189, 189, 189, 0.8) 100%)',
              border: `1px solid ${showConnections ? 'rgba(156, 39, 176, 0.3)' : 'rgba(158, 158, 158, 0.3)'}`,
              borderRadius: '10px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: `0 4px 15px ${showConnections ? 'rgba(156, 39, 176, 0.3)' : 'rgba(158, 158, 158, 0.2)'}`,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
            title={`${showConnections ? '연결선 숨기기' : '연결선 표시'} (${connectedClipsCount}개 연결됨)`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${showConnections ? 'rgba(156, 39, 176, 0.5)' : 'rgba(158, 158, 158, 0.4)'}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${showConnections ? 'rgba(156, 39, 176, 0.3)' : 'rgba(158, 158, 158, 0.2)'}`;
            }}
          >
            🔗
            <span>연결선 ({connectedClipsCount})</span>
          </button>

          {/* Bundle 생성 버튼 - 선택된 요소가 있을 때만 표시 */}
          {canCreateBundle && (
            <button
              onClick={handleCreateBundle}
              style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #673AB7 0%, #9C27B0 50%, #BA68C8 100%)',
                border: '1px solid rgba(103, 58, 183, 0.3)',
                borderRadius: '10px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(103, 58, 183, 0.3)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
              title={`Bundle 생성 (${pendingBundleSelection.length}개 선택됨)`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(103, 58, 183, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(103, 58, 183, 0.3)';
              }}
            >
              📦
              <span>Bundle ({pendingBundleSelection.length})</span>
            </button>
          )}

          {/* Bundle 해제 버튼 - 선택된 Bundle이 있을 때만 표시 */}
          {canUngroupBundle && (
            <button
              onClick={handleUngroupBundle}
              style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #E91E63 0%, #F48FB1 50%, #F8BBD0 100%)',
                border: '1px solid rgba(233, 30, 99, 0.3)',
                borderRadius: '10px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
              title={`Bundle 해제: ${selectedBundle?.name}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(233, 30, 99, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(233, 30, 99, 0.3)';
              }}
            >
              🔓
              <span>Bundle 해제</span>
            </button>
          )}

          {/* 끝점 offset 재계산 버튼 */}
          <button
            onClick={handleRecalculateOffsets}
            style={{
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 50%, #ffcc80 100%)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '10px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(255, 152, 0, 0.3)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
            title={`연결된 일반클립들의 offset을 현재 위치에 맞게 재계산합니다 (${connectedClipsCount}개 대상)`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 152, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 152, 0, 0.3)';
            }}
          >
            🔄
            <span>Offset 재계산</span>
          </button>
        </div>

        {/* 트랙 컨트롤 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <button
            onClick={addTrack}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              borderRadius: '10px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
            title="트랙 추가"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
            }}
          >
            <Plus size={16} />
            <span>트랙 추가</span>
          </button>

          {tracks.length > 1 && (
            <button
              onClick={() => removeTrack(tracks[tracks.length - 1].id)}
              style={{
                padding: '10px',
                background: 'linear-gradient(135deg, #f44336 0%, #e57373 50%, #ef5350 100%)',
                border: '1px solid rgba(244, 67, 54, 0.4)',
                borderRadius: '10px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)'
              }}
              title="트랙 삭제"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(244, 67, 54, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.3)';
              }}
            >
              <Minus size={16} />
            </button>
          )}
        </div>


      </div>

      {/* Bundle 생성 모달 */}
      <BundleCreationModal
        selectedElements={pendingBundleSelection}
        isOpen={isBundleModalOpen}
        onConfirm={handleBundleCreationConfirm}
        onCancel={() => setIsBundleModalOpen(false)}
      />
    </div>
  );
};