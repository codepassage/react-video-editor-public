/**
 * ⏱️ ProjectDurationControl.tsx - 프로젝트 지속시간 컨트롤 컴포넌트
 * 
 * 비디오 프로젝트의 최대 지속시간을 설정하고 관리하는 컴포넌트입니다.
 * 사용자가 비디오의 최대 길이를 직접 설정할 수 있도록 하며,
 * 인라인 편집 기능과 입력 유효성 검증을 제공합니다.
 * 
 * 주요 기능:
 * - 현재 프로젝트 지속시간 표시
 * - 인라인 편집 모드 (클릭으로 활성화)
 * - 입력 유효성 검증 (0초 초과, 1시간 제한)
 * - 실시간 미리보기 및 에러 피드백
 * - 키보드 단축키 지원 (Enter 저장, Esc 취소)
 * 
 * 입력 제한사항:
 * - 최소 값: 0초 초과
 * - 최대 값: 3600초 (1시간)
 * - 숫자만 입력 가능 (parseFloat 사용)
 * 
 * 상태 관리:
 * - isEditing: 편집 모드 활성화 상태
 * - tempDuration: 임시 입력 값 (문자열)
 * - error: 입력 오류 메시지
 * 
 * 동작 흐름:
 * 1. 편집 아이콘 클릭 → 인라인 입력 필드 활성화
 * 2. 입력 값 실시간 유효성 검증
 * 3. 저장 또는 취소 선택
 * 4. 전역 상태에 업데이트 반영
 * 
 * 관련 모듈:
 * - 8번 모듈: State Management (projectSettings 업데이트)
 * - 7번 모듈: Remotion Integration (렌더링 지속시간 설정)
 * - 1번 모듈: Timeline System (타임라인 말끘 사이지)
 */
import React, { useState, useEffect } from 'react';
import { Clock, Edit3, Check, X, AlertCircle } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';

/**
 * ProjectDurationControl 컴포넌트 - 비디오 지속시간 설정 UI
 * 
 * 주요 책임:
 * 1. 현재 프로젝트 지속시간 시각적 표시
 * 2. 인라인 편집 기능 제공
 * 3. 입력 유효성 검증 및 에러 처리
 * 4. 전역 상태와의 동기화
 * 5. 사용자 친화적 피드백 제공
 * 
 * 상태 동기화:
 * - useEffect로 projectSettings.duration 변경 감지
 * - 로컬 상태와 전역 상태 자동 동기화
 * - 편집 모드 진입/종료 시 상태 초기화
 */
export const ProjectDurationControl: React.FC = () => {
  const { projectSettings, updateProjectSettings } = useEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempDuration, setTempDuration] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTempDuration(projectSettings.duration.toString());
  }, [projectSettings.duration]);

  const handleEdit = () => {
    setIsEditing(true);
    setTempDuration(projectSettings.duration.toString());
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempDuration(projectSettings.duration.toString());
    setError(null);
  };

  const handleSave = () => {
    const duration = parseFloat(tempDuration);
    
    if (isNaN(duration) || duration <= 0) {
      setError('유효한 숫자를 입력하세요 (0보다 큰 값)');
      return;
    }
    
    if (duration > 3600) { // 1시간 제한
      setError('최대 3600초(1시간)까지 설정할 수 있습니다');
      return;
    }
    
    updateProjectSettings({ duration });
    setIsEditing(false);
    setError(null);
    console.log('📐 프로젝트 편집 시간 변경:', { from: projectSettings.duration, to: duration });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(26, 26, 46, 0.6) 100%)',
      backdropFilter: 'blur(15px)',
      padding: '10px 14px',
      borderRadius: '12px',
      border: '1px solid rgba(100, 181, 246, 0.3)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
      position: 'relative'
    }}>
      <Clock size={16} style={{ color: '#64b5f6', flexShrink: 0 }} />
      
      {!isEditing ? (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'monospace'
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>편집시간:</span>
            <span style={{ color: '#64b5f6' }}>{formatTime(projectSettings.duration)}</span>
          </div>
          
          <button
            onClick={handleEdit}
            style={{
              padding: '4px',
              background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.2) 0%, rgba(33, 150, 243, 0.2) 100%)',
              border: '1px solid rgba(100, 181, 246, 0.4)',
              borderRadius: '6px',
              color: '#64b5f6',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="편집 시간 변경"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 181, 246, 0.3) 0%, rgba(33, 150, 243, 0.3) 100%)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 181, 246, 0.2) 0%, rgba(33, 150, 243, 0.2) 100%)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Edit3 size={12} />
          </button>
        </>
      ) : (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="number"
              value={tempDuration}
              onChange={(e) => {
                setTempDuration(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              style={{
                width: '80px',
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: error ? '1px solid #f44336' : '1px solid rgba(100, 181, 246, 0.5)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'monospace',
                textAlign: 'center',
                outline: 'none'
              }}
              placeholder="초"
              min="1"
              max="3600"
              step="0.1"
              autoFocus
            />
            <span style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500'
            }}>
              초
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '4px',
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(102, 187, 106, 0.8) 100%)',
                border: '1px solid rgba(76, 175, 80, 0.4)',
                borderRadius: '6px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="저장"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Check size={12} />
            </button>
            
            <button
              onClick={handleCancel}
              style={{
                padding: '4px',
                background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.8) 0%, rgba(189, 189, 189, 0.8) 100%)',
                border: '1px solid rgba(158, 158, 158, 0.4)',
                borderRadius: '6px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="취소"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(158, 158, 158, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <X size={12} />
            </button>
          </div>
        </>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          marginTop: '4px',
          padding: '8px 12px',
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(229, 115, 115, 0.9) 100%)',
          border: '1px solid rgba(244, 67, 54, 0.4)',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 1000,
          boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)',
          backdropFilter: 'blur(10px)',
          minWidth: '200px'
        }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
