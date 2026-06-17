import React from 'react';
import { CheckCircle, XCircle, AlertCircle, FileText, Video, Download, X } from 'lucide-react';
import { TransformResult } from '../../../types/autoGeneration';

interface TransformResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TransformResult | null;
  onRender?: () => void;
  onSaveAsJson?: () => void;
  onSendToEditor?: () => void;
  isRendering?: boolean;
}

export const TransformResultModal: React.FC<TransformResultModalProps> = ({
  isOpen,
  onClose,
  result,
  onRender,
  onSaveAsJson,
  onSendToEditor,
  isRendering = false
}) => {
  if (!isOpen || !result) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 24px 16px 24px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {result.success ? (
              <CheckCircle style={{ width: '24px', height: '24px', color: '#10b981' }} />
            ) : (
              <XCircle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
            )}
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#111827' }}>
              변환 결과
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#6b7280'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          {result.success ? (
            <div>
              {/* 성공 메시지 */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  <span style={{ fontSize: '16px', fontWeight: '500', color: '#166534' }}>
                    변환이 성공적으로 완료되었습니다!
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#15803d', margin: 0 }}>
                  템플릿과 리소스 데이터가 정상적으로 결합되어 동영상 데이터가 생성되었습니다.
                </p>
              </div>

              {/* 통계 정보 */}
              {result.statistics && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1e293b', margin: '0 0 12px 0' }}>
                    📊 변환 통계
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {result.statistics.processedClips !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>처리된 클립:</span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                          {result.statistics.processedClips}개
                        </span>
                      </div>
                    )}
                    {result.statistics.processedBundles !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>처리된 번들:</span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                          {result.statistics.processedBundles}개
                        </span>
                      </div>
                    )}
                    {result.statistics.totalTracks !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>총 트랙:</span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                          {result.statistics.totalTracks}개
                        </span>
                      </div>
                    )}
                    {result.statistics.duration !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>총 길이:</span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                          {result.statistics.duration}초
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={onRender}
                  disabled={isRendering}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isRendering ? 'not-allowed' : 'pointer',
                    opacity: isRendering ? 0.7 : 1
                  }}
                >
                  <Video style={{ width: '16px', height: '16px' }} />
                  {isRendering ? '렌더링 중...' : '동영상 렌더링'}
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={onSaveAsJson}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 12px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <Download style={{ width: '14px', height: '14px' }} />
                    JSON으로 저장
                  </button>

                  <button
                    onClick={onSendToEditor}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <FileText style={{ width: '14px', height: '14px' }} />
                    에디터로 전송
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* 실패 메시지 */}
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <XCircle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                  <span style={{ fontSize: '16px', fontWeight: '500', color: '#dc2626' }}>
                    변환에 실패했습니다
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#b91c1c', margin: 0 }}>
                  {result.error || '알 수 없는 오류가 발생했습니다.'}
                </p>
              </div>

              {/* 오류 세부 정보 */}
              {result.details && (
                <div style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fed7aa',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertCircle style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
                      상세 정보
                    </span>
                  </div>
                  <pre style={{
                    fontSize: '12px',
                    color: '#92400e',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};