/**
 * 🎨 TemplateModeModal.tsx - 템플릿 저장 모드 선택 모달
 * 
 * 사용자가 템플릿을 저장할 때 두 가지 모드 중 하나를 선택할 수 있도록
 * 하는 모달 컴포넌트입니다. 새로운 템플릿 추가와 기존 템플릿 덮어쓰기
 * 옵션을 직관적인 UI로 제공하여 사용자의 의도를 명확히 파악합니다.
 * 
 * 주요 기능:
 * - 새 템플릿 추가 모드 선택
 * - 기존 템플릿 덮어쓰기 모드 선택
 * - Portal을 사용한 전체 화면 오버레이
 * - 직관적인 아이콘과 설명으로 모드 구분
 * - ESC 키나 외부 클릭으로 모달 닫기
 * 
 * 선택 모드:
 * - 'add': 새로운 템플릿 생성
 * - 'update': 기존 템플릿 선택 후 덮어쓰기
 * 
 * UI 디자인:
 * - 어두운 배경 오버레이 (70% 투명도)
 * - 중앙 정렬된 모달 대화상자
 * - 두 개의 카드 형태 선택 옵션
 * - 호버 효과와 전환 애니메이션
 * 
 * 관련 모듈:
 * - 9번 모듈: Template System (템플릿 저장 워크플로우)
 * - Header 컴포넌트: 템플릿 저장 버튼에서 호출
 * - TemplateSaveModal: 'add' 모드 선택 시 연결
 * - TemplateUpdateModal: 'update' 모드 선택 시 연결
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Edit, RefreshCw } from 'lucide-react';

interface TemplateModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'add' | 'update') => void;
}

/**
 * TemplateModeModal 컴포넌트 - 템플릿 저장 방식 선택 UI
 * 
 * 주요 책임:
 * 1. 사용자의 템플릿 저장 의도 파악
 * 2. 두 가지 모드의 차이점 명확히 전달
 * 3. 사용자 친화적 인터페이스 제공
 * 4. 모달 상태 관리 및 이벤트 처리
 * 
 * 동작 흐름:
 * 1. Header에서 템플릿 저장 버튼 클릭
 * 2. 이 모달에서 모드 선택 (add/update)
 * 3. 선택된 모드에 따라 다음 모달로 이동
 * 4. 모달 닫기 및 상태 초기화
 * 
 * Portal 사용 이유:
 * - 기존 DOM 계층 구조에 관계없이 전체 화면 오버레이
 * - z-index 문제 해결 및 전역 이벤트 처리
 * - 접근성 및 리더기 지원
 */
export const TemplateModeModal: React.FC<TemplateModeModalProps> = ({
  isOpen,
  onClose,
  onSelectMode
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      pointerEvents: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        position: 'relative',
        zIndex: 1001
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            템플릿 저장 방식 선택
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(107, 114, 128, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 설명 */}
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          현재 편집 중인 프로젝트를 어떻게 저장하시겠습니까?
        </p>

        {/* 모드 선택 버튼들 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* 새 템플릿 추가 */}
          <button
            onClick={() => onSelectMode('add')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={24} />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>새 템플릿으로 추가</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>새로운 템플릿을 생성합니다</div>
            </div>
          </button>

          {/* 기존 템플릿 수정 */}
          <button
            onClick={() => onSelectMode('update')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={24} />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>기존 템플릿 덮어쓰기</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>기존 템플릿의 내용을 현재 프로젝트로 교체합니다</div>
            </div>
          </button>
        </div>

        {/* 취소 버튼 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '24px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};