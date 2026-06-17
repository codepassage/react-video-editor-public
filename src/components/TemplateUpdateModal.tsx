import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Calendar, Clock, Layers, Film } from 'lucide-react';
import { getApiUrl } from '../utils/urlBuilder';
import { globalAlert } from '../utils/globalAlert';

interface Template {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  totalClips: number;
  totalTracks: number;
  screenshotPath?: string;
}

interface TemplateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  loading?: boolean;
}

export const TemplateUpdateModal: React.FC<TemplateUpdateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  loading = false
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/templates`);
      
      if (!response.ok) {
        throw new Error('템플릿 목록을 불러올 수 없습니다');
      }
      
      const result = await response.json();
      if (result.success && result.templates) {
        setTemplates(result.templates);
      }
    } catch (error) {
      console.error('템플릿 로딩 에러:', error);
      globalAlert.showError('템플릿 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = () => {
    if (selectedTemplateId) {
      onSelectTemplate(selectedTemplateId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        maxWidth: '800px',
        maxHeight: '80vh',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        position: 'relative',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column'
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            덮어쓸 템플릿 선택
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'rgba(107, 114, 128, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 경고 메시지 */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#92400e',
            margin: 0,
            fontWeight: '600'
          }}>
            ⚠️ 주의: 선택한 템플릿의 내용이 현재 프로젝트로 완전히 교체됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
        </div>

        {/* 템플릿 목록 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '24px'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '16px' }} />
              <p>템플릿 목록을 불러오는 중...</p>
            </div>
          ) : templates.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              <Film size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>저장된 템플릿이 없습니다</p>
              <p style={{ fontSize: '14px' }}>먼저 템플릿을 생성해주세요.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  style={{
                    background: selectedTemplateId === template.id 
                      ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                      : 'rgba(255, 255, 255, 0.8)',
                    border: selectedTemplateId === template.id
                      ? '2px solid #3b82f6'
                      : '1px solid rgba(229, 231, 235, 0.8)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTemplateId !== template.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplateId !== template.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* 스크린샷 */}
                  {template.screenshotPath ? (
                    <div style={{
                      width: '80px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(229, 231, 235, 0.5)',
                      flexShrink: 0
                    }}>
                      <img
                        src={`${getApiUrl()}${template.screenshotPath}`}
                        alt={`${template.name} 썸네일`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '60px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                      border: '1px solid rgba(229, 231, 235, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Film size={24} style={{ color: '#9ca3af' }} />
                    </div>
                  )}

                  {/* 템플릿 정보 */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 4px 0'
                    }}>
                      {template.name}
                    </h3>
                    
                    {template.description && (
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0 0 8px 0'
                      }}>
                        {template.description}
                      </p>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={12} />
                        <span>{template.totalTracks || 0}개 트랙</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>{template.totalClips || 0}개 클립</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>{formatDate(template.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 선택 표시 */}
                  {selectedTemplateId === template.id && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1
            }}
          >
            취소
          </button>
          <button
            onClick={handleSelectTemplate}
            disabled={!selectedTemplateId || loading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              background: (!selectedTemplateId || loading)
                ? '#9ca3af'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              cursor: (!selectedTemplateId || loading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: (!selectedTemplateId || loading)
                ? 'none'
                : '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            {loading ? '덮어쓰는 중...' : '선택한 템플릿 덮어쓰기'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};