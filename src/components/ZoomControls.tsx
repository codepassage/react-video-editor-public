/**
 * 🔍 ZoomControls.tsx - 타임라인 줌 조절 컨트롤 컴포넌트
 * 
 * 타임라인의 확대/축소 기능을 제공하는 컴포넌트로, 사용자가 타임라인의
 * 시간 스케일을 조절하여 편집 작업의 정밀도를 높일 수 있도록 합니다.
 * 다양한 줌 옵션과 직관적인 UI를 제공하여 편리한 편집 환경을 구성합니다.
 * 
 * 주요 기능:
 * - 단계별 줌 인/아웃 (ZoomIn/ZoomOut)
 * - 전체 맞춤 (Fit to Timeline)
 * - 선택 영역 맞춤 (Fit to Selection)
 * - 수동 줌 퍼센트 설정 (슬라이더)
 * - 줌 레벨 초기화 (Reset to Default)
 * - 실시간 줌 상태 표시
 * 
 * 줌 기능:
 * - 범위: MIN_ZOOM ~ MAX_ZOOM (보통 0.1x ~ 10x)
 * - 기본값: DEFAULT_ZOOM (1.0x)
 * - 단계별 줌: 고정 비율로 확대/축소
 * - 전체 맞춤: 전체 타임라인이 화면에 맞도록 조정
 * - 선택 맞춤: 선택된 클립들이 화면에 맞도록 조정
 * 
 * UI 구성요소:
 * - 줌 인/아웃 버튼 (+ / -)
 * - 전체 맞춤 버튼 (Maximize2 아이콘)
 * - 선택 맞춤 버튼 (Target 아이콘)
 * - 초기화 버튼 (RotateCcw 아이콘)
 * - 줌 퍼센트 표시 및 슬라이더
 * 
 * 상태 관리:
 * - 줌 레벨: editorStore에서 중앙 관리
 * - 슬라이더 표시 여부 (showSlider)
 * - 슬라이더 값 동기화 (sliderValue)
 * - 컨테이너 너비 반영
 * 
 * 사용자 경험:
 * - 키보드 단축키 지원 (Ctrl +/- 등)
 * - 마우스 휠 줌 지원
 * - 부드러운 줌 전환
 * - 상황별 최적 줌 제안
 * 
 * 성능 최적화:
 * - 줌 변경 시 debounce 적용
 * - 불필요한 리렌더링 방지
 * - 메모이제이션 활용
 * 
 * 관련 기능:
 * - 1번 모듈: Timeline System (타임라인 스케일 조정)
 * - editorStore: 줌 상태 및 액션 관리
 * - TimelineRuler: 시간 눈금 스케일 연동
 * - 키보드 단축키 시스템
 */

import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Target, RotateCcw } from 'lucide-react';
import { useEditorStore, MIN_ZOOM, MAX_ZOOM } from '../store/editorStore';
import { DEFAULT_ZOOM } from '../types';

interface ZoomControlsProps {
  containerWidth?: number; // 타임라인 컨테이너 너비 (전체 맞춤 계산용)
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  containerWidth = 1000
}) => {
  const {
    zoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToSelection,
    setZoomPercentage,
    getZoomPercentage,
    selectedClips,
    getTotalDuration,
    setTimelineContainerWidth
  } = useEditorStore();

  const [showSlider, setShowSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(getZoomPercentage());

  // 📏 컨테이너 너비 변경 시 Store 업데이트
  useEffect(() => {
    setTimelineContainerWidth(containerWidth);
  }, [containerWidth, setTimelineContainerWidth]);

  // 줌 변경 시 슬라이더 값 동기화
  useEffect(() => {
    setSliderValue(getZoomPercentage());
  }, [zoom, getZoomPercentage]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseInt(e.target.value);
    setSliderValue(percentage);
    setZoomPercentage(percentage);
  };

  const handleResetZoom = () => {
    console.log('🔍🔄 줌 리셋 - 100%로 복원');
    setZoomPercentage(100);
  };

  // 🎨 버튼 스타일 정의
  const buttonStyles = {
    base: {
      padding: '8px 10px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      position: 'relative' as const,
      overflow: 'hidden',
      backdropFilter: 'blur(10px)'
    },

    primary: {
      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)',
      color: '#ffffff',
      border: '1px solid rgba(76, 175, 80, 0.4)',
      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
    },

    secondary: {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #64b5f6 100%)',
      color: '#ffffff',
      border: '1px solid rgba(79, 172, 254, 0.4)',
      boxShadow: '0 2px 8px rgba(79, 172, 254, 0.3)'
    },

    accent: {
      background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 50%, #ffcc80 100%)',
      color: '#ffffff',
      border: '1px solid rgba(255, 152, 0, 0.4)',
      boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
    },

    disabled: {
      background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.6) 0%, rgba(189, 189, 189, 0.6) 100%)',
      color: 'rgba(255, 255, 255, 0.6)',
      border: '1px solid rgba(158, 158, 158, 0.3)',
      boxShadow: 'none',
      cursor: 'not-allowed'
    }
  };

  const createButtonProps = (style: any, hoverColor: string, disabled = false) => ({
    style: { ...buttonStyles.base, ...(disabled ? buttonStyles.disabled : style) },
    disabled,
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
        e.currentTarget.style.boxShadow = `0 4px 15px ${hoverColor}`;
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = style.boxShadow;
      }
    }
  });

  const totalDuration = getTotalDuration();
  const currentPercentage = getZoomPercentage();
  const hasSelection = selectedClips.length > 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      padding: '8px 12px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    }}>
      {/* 줌 아웃 버튼 */}
      <button
        onClick={zoomOut}
        {...createButtonProps(buttonStyles.secondary, 'rgba(79, 172, 254, 0.4)', zoom <= MIN_ZOOM)}
        title={`줌 아웃 (${Math.max(10, Math.round(((zoom - 10) / DEFAULT_ZOOM) * 100))}%)`}
      >
        <ZoomOut size={16} />
      </button>

      {/* 줌 레벨 표시 (클릭하면 슬라이더 토글) */}
      <button
        onClick={() => setShowSlider(!showSlider)}
        style={{
          ...buttonStyles.base,
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(26, 26, 46, 0.6) 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 12px',
          minWidth: '70px',
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: '600'
        }}
        title="줌 레벨 조정 (클릭하여 슬라이더 열기)"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {currentPercentage}%
      </button>

      {/* 줌 인 버튼 */}
      <button
        onClick={zoomIn}
        {...createButtonProps(buttonStyles.secondary, 'rgba(79, 172, 254, 0.4)', zoom >= MAX_ZOOM)}
        title={`줌 인 (${Math.min(500, Math.round(((zoom + 10) / DEFAULT_ZOOM) * 100))}%)`}
      >
        <ZoomIn size={16} />
      </button>

      {/* 구분선 */}
      <div style={{
        width: '1px',
        height: '20px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
        margin: '0 4px'
      }} />

      {/* 전체 맞춤 버튼 */}
      <button
        onClick={zoomToFit}
        {...createButtonProps(buttonStyles.primary, 'rgba(76, 175, 80, 0.4)', totalDuration === 0)}
        title={`전체 맞춤 (${totalDuration.toFixed(1)}초 전체를 화면에 맞춤)`}
      >
        <Maximize2 size={16} />
      </button>

      {/* 선택 영역 맞춤 버튼 */}
      <button
        onClick={zoomToSelection}
        {...createButtonProps(buttonStyles.accent, 'rgba(255, 152, 0, 0.4)', !hasSelection)}
        title={hasSelection ? `선택 영역 맞춤 (${selectedClips.length}개 클립)` : '클립을 선택하세요'}
      >
        <Target size={16} />
      </button>

      {/* 줌 리셋 버튼 */}
      <button
        onClick={handleResetZoom}
        {...createButtonProps(buttonStyles.secondary, 'rgba(79, 172, 254, 0.4)', currentPercentage === 100)}
        title="줌 리셋 (100%)"
      >
        <RotateCcw size={16} />
      </button>

      {/* 줌 슬라이더 (토글) */}
      {showSlider && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(26, 26, 46, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          minWidth: '200px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                줌 레벨
              </span>
              <span style={{
                color: '#64b5f6',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>
                {sliderValue}%
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={sliderValue}
              onChange={handleSliderChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '4px'
            }}>
              <span>10%</span>
              <span>100%</span>
              <span>500%</span>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={() => setShowSlider(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* 배경 클릭으로 슬라이더 닫기 */}
      {showSlider && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowSlider(false)}
        />
      )}
    </div>
  );
};
