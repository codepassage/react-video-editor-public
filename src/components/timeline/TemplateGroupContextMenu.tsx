import React from 'react';
import ReactDOM from 'react-dom';

interface TemplateGroupContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onUngroup: () => void;
  onDelete: () => void;
}

export const TemplateGroupContextMenu: React.FC<TemplateGroupContextMenuProps> = ({
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
          🔓 그룹 해제
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