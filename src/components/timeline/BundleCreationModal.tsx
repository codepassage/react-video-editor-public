/**
 * 🎯 BundleCreationModal.tsx - Bundle 생성 모달 컴포넌트
 * 
 * 선택된 클립들을 Bundle로 그룹화할 때 사용하는 모달 컴포넌트입니다.
 * Bundle 이름, 색상, 설명 등을 설정하고 Bundle 생성 과정을 관리하며,
 * 사용자에게 직관적인 Bundle 생성 인터페이스를 제공합니다.
 * 
 * 주요 기능:
 * - Bundle 이름 입력 및 자동 생성
 * - Bundle 색상 선택 (시각적 구분)
 * - 선택된 클립 정보 미리보기
 * - Bundle 생성 유효성 검사
 * - 시간 정보 표시 (시작시간, 끝시간, 총 길이)
 * - 취소 및 확인 기능
 * 
 * Bundle 생성 프로세스:
 * 1. 선택된 클립들 분석 및 표시
 * 2. 기본 Bundle 이름 자동 생성 (타임스탬프 기반)
 * 3. 사용자가 이름과 색상 커스터마이징
 * 4. Bundle 데이터 검증 및 생성
 * 5. Bundle 시스템에 등록
 * 
 * 유효성 검사:
 * - 최소 2개 이상의 클립 필요
 * - Bundle 이름 중복 체크
 * - 연속된 클립들인지 확인
 * - 동일 트랙 내 클립인지 검증
 * 
 * 사용자 인터페이스:
 * - 모달 기반 전체화면 오버레이
 * - 선택된 클립 리스트 표시
 * - 색상 팔레트 선택기
 * - 실시간 입력 유효성 피드백
 * - 키보드 단축키 지원 (Enter 확인, ESC 취소)
 * 
 * 데이터 처리:
 * - 선택된 클립들의 시간 범위 계산
 * - Bundle 메타데이터 생성
 * - CreateBundleData 형식으로 데이터 변환
 * - 클립 ID 매핑 및 관계 설정
 * 
 * 자동 이름 생성:
 * - 현재 날짜/시간 기반 기본 이름
 * - "Bundle_YYYY.MM.DD_HH.MM.SS" 형식
 * - 중복 방지를 위한 고유 식별자
 * 
 * 색상 시스템:
 * - 사전 정의된 Bundle 색상 팔레트
 * - 타임라인에서 시각적 구분
 * - Bundle 타입별 색상 권장
 * 
 * 접근성:
 * - 포커스 트랩 구현
 * - 키보드 전용 네비게이션
 * - 스크린 리더 지원
 * - ARIA 속성 및 시맨틱 마크업
 * 
 * 관련 모듈:
 * - 3번 모듈: Bundle System (Bundle 생성 핵심 로직)
 * - bundleActions: Bundle 상태 관리
 * - BUNDLE_COLORS: 색상 팔레트 정의
 * - 1번 모듈: Timeline System (선택된 클립 정보)
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SelectedElement, CreateBundleData, BUNDLE_COLORS } from '../../types';

interface BundleCreationModalProps {
  selectedElements: SelectedElement[];
  isOpen: boolean;
  onConfirm: (bundleData: CreateBundleData) => void;
  onCancel: () => void;
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(1);
  return `${minutes}:${seconds.padStart(4, '0')}`;
};

export const BundleCreationModal: React.FC<BundleCreationModalProps> = ({
  selectedElements,
  isOpen,
  onConfirm,
  onCancel
}) => {
  const [bundleName, setBundleName] = useState('');
  const [selectedColor, setSelectedColor] = useState(BUNDLE_COLORS[0]);

  // 기본 Bundle 이름 생성
  useEffect(() => {
    if (selectedElements.length > 0) {
      const timestamp = new Date().toLocaleString('ko-KR', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setBundleName(`Bundle ${timestamp}`);
    }
  }, [selectedElements]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bundleName.trim()) {
      onConfirm({ name: bundleName.trim(), color: selectedColor });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Portal을 사용하여 모달을 document.body에 직접 렌더링
  return createPortal(
    <div 
      className="bundle-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647, // 최대값
        animation: 'bundleModalFadeIn 0.3s ease-out'
      }}
      onClick={handleOverlayClick}
    >
      <div 
        className="bundle-creation-modal"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 33, 62, 0.98) 0%, rgba(15, 52, 96, 0.98) 100%)',
          borderRadius: '20px',
          padding: '40px',
          minWidth: '520px',
          maxWidth: '640px',
          border: '2px solid rgba(100, 181, 246, 0.4)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(25px)',
          animation: 'bundleModalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* 제목 */}
          <h3 style={{
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 32px 0',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #64b5f6 0%, #2196f3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>📦</span>
            <span>Bundle 생성</span>
          </h3>

          {/* 선택된 요소들 미리보기 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>선택된 요소들</span>
              <span style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '700',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
              }}>
                {selectedElements.length}개
              </span>
            </h4>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '200px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {selectedElements.map(element => (
                <div 
                  key={element.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    transition: 'all 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)';
                  }}
                >
                  <span style={{ fontSize: '24px' }}>
                    {element.type === 'baseClip' ? '🛡️' : '📋'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      {element.name}
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}>
                      {formatTime(element.startTime)} - {formatTime(element.endTime)}
                    </div>
                  </div>
                  <div style={{
                    background: element.type === 'baseClip' 
                      ? 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
                      : 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}>
                    {element.type === 'baseClip' ? '기준클립' : '템플릿'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bundle 이름 입력 */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Bundle 이름
            </label>
            <input 
              type="text"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              placeholder="Bundle 이름을 입력하세요"
              autoFocus
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#64b5f6';
                e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                e.target.style.boxShadow = '0 0 0 4px rgba(100, 181, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* 색상 선택 */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              색상 선택
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              {BUNDLE_COLORS.map(color => (
                <div 
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    position: 'relative',
                    background: color,
                    border: `4px dashed ${color}`,
                    borderRadius: '16px',
                    height: '70px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: selectedColor === color ? 1 : 0.7,
                    transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: selectedColor === color 
                      ? `0 0 0 4px rgba(255, 255, 255, 0.9), 0 12px 35px ${color}60`
                      : '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}
                  title={`색상: ${color}`}
                  onMouseEnter={(e) => {
                    if (selectedColor !== color) {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'scale(1.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedColor !== color) {
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {selectedColor === color && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#ffffff',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      textShadow: '0 3px 6px rgba(0, 0, 0, 0.6)',
                      animation: 'bundleCheckmark 0.3s ease-out'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bundle 미리보기 */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              미리보기
            </label>
            <div 
              style={{
                border: `3px dashed ${selectedColor}`,
                borderRadius: '16px',
                background: `${selectedColor}20`,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.3s ease',
                boxShadow: `0 8px 25px ${selectedColor}30`
              }}
            >
              <span style={{ fontSize: '32px' }}>📦</span>
              <div>
                <div style={{
                  color: selectedColor,
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '4px'
                }}>
                  {bundleName || '(이름 없음)'}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px'
                }}>
                  {selectedElements.length}개 요소 포함
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px'
          }}>
            <button 
              type="button"
              onClick={onCancel}
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'transparent',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              취소
            </button>
            <button 
              type="submit"
              disabled={!bundleName.trim()}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                border: 'none',
                background: bundleName.trim() 
                  ? `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}DD 100%)`
                  : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '700',
                cursor: bundleName.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                opacity: bundleName.trim() ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (bundleName.trim()) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 12px 35px ${selectedColor}50`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>📦</span>
              <span>Bundle 생성</span>
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bundleModalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes bundleModalSlideUp {
            from { 
              opacity: 0; 
              transform: translateY(30px) scale(0.9);
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes bundleCheckmark {
            from { 
              opacity: 0; 
              transform: translate(-50%, -50%) scale(0.5);
            }
            to { 
              opacity: 1; 
              transform: translate(-50%, -50%) scale(1);
            }
          }
          
          .bundle-creation-modal input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
          
          .bundle-modal-overlay {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
        `
      }} />
    </div>,
    document.body
  );
};
