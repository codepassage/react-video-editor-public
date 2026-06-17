import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';

export const SnapSettings: React.FC = () => {
  const { snapValue, setSnapValue } = useEditorStore();
  
  // 운영체제 감지
  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && 
           navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }, []);
  const modifierKey = isMac ? 'Option' : 'Alt';
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(snapValue.toString());

  // 프리셋 값들
  const presetValues = [0.05, 0.1, 0.25, 0.5, 1.0];

  const handlePresetClick = (value: number) => {
    setSnapValue(value);
    setInputValue(value.toString());
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value > 0) {
      setSnapValue(value);
    } else {
      setInputValue(snapValue.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setInputValue(snapValue.toString());
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 50%, #ba68c8 100%)',
          border: '1px solid rgba(103, 58, 183, 0.3)',
          borderRadius: '8px',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(103, 58, 183, 0.3)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          whiteSpace: 'nowrap'
        }}
        title={`스냅 값: ${snapValue}초 (${modifierKey} + 드래그)`}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(103, 58, 183, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(103, 58, 183, 0.3)';
        }}
      >
        🧲 {snapValue}s
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            marginBottom: '4px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            minWidth: '200px'
          }}
        >
          <div style={{
            color: '#e2e8f0',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            스냅 값 설정 (초)
          </div>

          {/* 프리셋 버튼들 */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '8px'
          }}>
            {presetValues.map(value => (
              <button
                key={value}
                onClick={() => handlePresetClick(value)}
                style={{
                  padding: '4px 8px',
                  background: snapValue === value 
                    ? 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)'
                    : 'linear-gradient(135deg, rgba(71, 85, 105, 0.8) 0%, rgba(100, 116, 139, 0.8) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (snapValue !== value) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 116, 139, 0.9) 0%, rgba(148, 163, 184, 0.9) 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (snapValue !== value) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(71, 85, 105, 0.8) 0%, rgba(100, 116, 139, 0.8) 100%)';
                  }
                }}
              >
                {value}s
              </button>
            ))}
          </div>

          {/* 커스텀 입력 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              color: '#94a3b8',
              fontSize: '11px'
            }}>
              커스텀:
            </span>
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              min="0.01"
              max="5"
              step="0.01"
              style={{
                width: '60px',
                padding: '4px 6px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '11px',
                textAlign: 'center'
              }}
            />
            <span style={{
              color: '#94a3b8',
              fontSize: '11px'
            }}>
              초
            </span>
          </div>

          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: '#64748b',
            fontStyle: 'italic'
          }}>
            {modifierKey} + 드래그로 스냅 활성화
          </div>
        </div>
      )}
    </div>
  );
};