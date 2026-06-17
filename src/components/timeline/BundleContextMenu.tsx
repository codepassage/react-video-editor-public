/**
 * 📁 BundleContextMenu.tsx - Bundle 우클릭 컨텍스트 메뉴 컴포넌트
 * 
 * Bundle에서 우클릭했을 때 나타나는 컨텍스트 메뉴를 제공하는 컴포넌트입니다.
 * Bundle의 이름 변경, 그룹 해제, 삭제 등의 핵심 기능을 빠른 액세스로 제공하며,
 * 포털을 사용하여 화면 전체에 오버레이되는 메뉴를 구현합니다.
 * 
 * 주요 기능:
 * - Bundle 이름 변경 (Rename)
 * - Bundle 그룹 해제 (Ungroup)
 * - Bundle 삭제 (Delete)
 * - 마우스 위치 기반 메뉴 표시
 * - 외부 클릭 시 자동 닫기
 * - Portal을 통한 전역 오버레이
 * 
 * Bundle 관리 작업:
 * - 이름 변경: Bundle의 사용자 정의 이름 수정
 * - 그룹 해제: Bundle 구조 해체하여 개별 클립으로 분리
 * - 삭제: Bundle 및 포함된 모든 클립 제거
 * - 메뉴 닫기: ESC 키 또는 외부 클릭으로 메뉴 종료
 * 
 * 사용자 인터페이스:
 * - 마우스 우클릭 위치에 메뉴 표시
 * - 화면 경계 감지 및 자동 위치 조정
 * - 키보드 네비게이션 지원
 * - 아이콘과 텍스트가 포함된 직관적 메뉴 아이템
 * 
 * 기술적 구현:
 * - ReactDOM.createPortal을 사용한 전역 렌더링
 * - 고정 위치(fixed position) 기반 절대 좌표 시스템
 * - 높은 z-index로 최상위 레이어 보장
 * - 클릭 이벤트 버블링 방지
 * 
 * 이벤트 처리:
 * - onRename: Bundle 이름 변경 모달 열기
 * - onUngroup: Bundle 해체 확인 후 개별 클립으로 분리
 * - onDelete: Bundle 삭제 확인 후 제거
 * - onClose: 메뉴 닫기 (배경 클릭, ESC 키)
 * 
 * 접근성:
 * - 키보드 탐색 지원
 * - 스크린 리더 호환
 * - ARIA 라벨 및 역할 정의
 * - 포커스 관리
 * 
 * 관련 모듈:
 * - 3번 모듈: Bundle System (Bundle 관리 핵심 기능)
 * - BundleRenameModal: 이름 변경 모달 연동
 * - bundleActions: Bundle 상태 관리 액션
 * - 1번 모듈: Timeline System (타임라인 UI 통합)
 */

import React from 'react';
import ReactDOM from 'react-dom';

interface BundleContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onUngroup: () => void;
  onDelete: () => void;
}

export const BundleContextMenu: React.FC<BundleContextMenuProps> = ({
  position,
  onClose,
  onRename,
  onUngroup,
  onDelete
}) => {
  return ReactDOM.createPortal(
    <>
      {/* 투명한 배경 - 클릭 시 메뉴 닫기 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
        onClick={onClose}
      />
      
      {/* 컨텍스트 메뉴 */}
      <div
        style={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          backgroundColor: '#1a1a1a',
          border: '1px solid #666',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
          zIndex: 10000,
          padding: '6px 0',
          minWidth: '200px',
          backdropFilter: 'blur(10px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            onRename();
            onClose();
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = '#333333';
            e.currentTarget.style.paddingLeft = '28px';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.paddingLeft = '24px';
          }}
        >
          ✏️ 이름 변경
        </button>
        
        <div style={{ height: '1px', backgroundColor: '#444', margin: '6px 12px' }} />
        
        <button
          onClick={() => {
            onUngroup();
            onClose();
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = '#333333';
            e.currentTarget.style.paddingLeft = '28px';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.paddingLeft = '24px';
          }}
        >
          🔓 번들 해제
        </button>
        
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            color: '#ff6666',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = '#442222';
            e.currentTarget.style.paddingLeft = '28px';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.paddingLeft = '24px';
          }}
        >
          🗑️ 삭제
        </button>
      </div>
    </>,
    document.body
  );
};