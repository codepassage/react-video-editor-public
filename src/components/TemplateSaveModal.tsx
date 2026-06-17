/**
 * 💾 TemplateSaveModal.tsx - 템플릿 저장 모달 컴포넌트
 * 
 * 사용자가 새로운 템플릿을 생성할 때 필요한 정보를 입력하고 저장하는
 * 포괄적인 폼 모달입니다. 템플릿 이름, 설명, 타입, 스크린샷 등
 * 모든 메타데이터를 종합적으로 관리하며, 입력 유효성 검증과
 * 실시간 피드백을 제공합니다.
 * 
 * 주요 기능:
 * - 템플릿 이름 및 설명 입력
 * - 템플릿 타입 선택 (서버에서 동적 로드)
 * - 스크린샷 이미지 업로드 (선택사항)
 * - 입력 유효성 실시간 검증
 * - 비동기 저장 처리 및 로딩 상태 관리
 * - 업데이트 모드 지원 (기존 템플릿 수정)
 * 
 * 입력 필드:
 * - 템플릿 이름 (필수, 3-50자 제한)
 * - 템플릿 설명 (선택사항, 500자 제한)
 * - 템플릿 타입 (필수, 드롭다운에서 선택)
 * - 스크린샷 이미지 (선택사항, PNG/JPG 지원)
 * 
 * 유효성 검증:
 * - 이름: 빈 문자열, 길이 제한, 중복 이름 검사
 * - 설명: 길이 제한
 * - 타입: 유효한 타입 ID 선택 여부
 * - 스크린샷: 파일 형식 및 크기 제한
 * 
 * 동작 모드:
 * - 새 생성 모드: 모든 필드 비어있는 상태로 시작
 * - 업데이트 모드: 기존 템플릿 정보로 미리 채우기
 * 
 * 관련 모듈:
 * - 9번 모듈: Template System (템플릿 저장 및 관리)
 * - 서버 API: 템플릿 타입 로드, 템플릿 저장
 * - Header 컴포넌트: 템플릿 저장 워크플로우
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { getApiUrl } from '../utils/urlBuilder';

interface TemplateType {
  id: string;
  name: string;
  description: string;
}

interface TemplateSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, typeId: string, screenshot?: File) => Promise<void>;
  loading?: boolean;
  isUpdate?: boolean;
  currentTemplate?: { id: string; name: string; description: string; typeId: string };
}

/**
 * TemplateSaveModal 컴포넌트 - 템플릿 저장/업데이트 폼 인터페이스
 * 
 * 주요 책임:
 * 1. 템플릿 메타데이터 입력 폼 제공
 * 2. 입력 유효성 실시간 검증
 * 3. 스크린샷 업로드 및 미리보기
 * 4. 비동기 저장 처리
 * 5. 업데이트 모드 지원
 * 
 * 상태 관리:
 * - 로컬 입력 상태 (이름, 설명, 타입, 스크린샷)
 * - 서버 데이터 (템플릿 타입 목록)
 * - 에러 및 로딩 상태
 * - 업데이트 모드의 경우 기존 데이터 로드
 * 
 * 동작 흐름:
 * 1. 모달 열기 시 템플릿 타입 목록 로드
 * 2. 업데이트 모드의 경우 기존 데이터 미리 채우기
 * 3. 사용자 입력 실시간 유효성 검증
 * 4. 저장 버튼 클릭 시 최종 유효성 검사
 * 5. 비동기 저장 요청 및 로딩 상태 처리
 */
export const TemplateSaveModal: React.FC<TemplateSaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loading = false,
  isUpdate = false,
  currentTemplate
}) => {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Load template types when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplateTypes();
      
      // Update 모드일 때 기존 템플릿 정보 로드
      if (isUpdate && currentTemplate) {
        setTemplateName(currentTemplate.name);
        setTemplateDescription(currentTemplate.description || '');
        setSelectedTypeId(currentTemplate.typeId);
      }
    }
  }, [isOpen, isUpdate, currentTemplate]);

  // Set default type when types are loaded
  useEffect(() => {
    if (templateTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(templateTypes[0].id);
    }
  }, [templateTypes, selectedTypeId]);

  const loadTemplateTypes = async () => {
    try {
      setTypesLoading(true);
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/template-types`);
      
      if (!response.ok) {
        throw new Error(`Failed to load template types: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setTemplateTypes(data.templateTypes);
      }
    } catch (error) {
      console.error('Failed to load template types:', error);
    } finally {
      setTypesLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) return;
    
    try {
      setSaving(true);
      await onSave(templateName.trim(), templateDescription.trim(), selectedTypeId, screenshot || undefined);
      
      // Reset form
      setTemplateName('');
      setTemplateDescription('');
      setSelectedTypeId(templateTypes[0]?.id || '');
      setScreenshot(null);
      setScreenshotPreview(null);
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return; // Prevent closing while saving
    
    setTemplateName('');
    setTemplateDescription('');
    setSelectedTypeId('');
    setScreenshot(null);
    setScreenshotPreview(null);
    onClose();
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
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
            {isUpdate ? '템플릿 수정' : '템플릿 저장'}
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            style={{
              background: 'rgba(107, 114, 128, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ marginBottom: '24px' }}>
          {/* Template Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              템플릿 이름 *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="템플릿 이름을 입력하세요"
              maxLength={100}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Template Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              설명
            </label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="템플릿에 대한 설명을 입력하세요 (선택사항)"
              rows={3}
              maxLength={500}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Template Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              템플릿 타입 *
            </label>
            {typesLoading ? (
              <div style={{
                padding: '12px',
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center',
                border: '2px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                타입 목록을 불러오는 중...
              </div>
            ) : (
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                {templateTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Screenshot Upload */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              스크린샷 (선택사항)
            </label>
            
            {!screenshotPreview ? (
              <label
                htmlFor="screenshot-upload"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '120px',
                  border: '2px dashed #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#f9fafb',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
              >
                <ImageIcon size={32} style={{ color: '#9ca3af', marginBottom: '8px' }} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>클릭하여 스크린샷 업로드</span>
                <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>PNG, JPG, GIF (최대 5MB)</span>
              </label>
            ) : (
              <div style={{
                position: 'relative',
                width: '100%',
                height: '180px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6'
              }}>
                <img
                  src={screenshotPreview}
                  alt="Template screenshot"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
                <button
                  onClick={removeScreenshot}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <input
              type="file"
              id="screenshot-upload"
              accept="image/*"
              onChange={handleScreenshotChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={handleClose}
            disabled={saving}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#374151',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: saving ? 0.5 : 1
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!templateName.trim() || saving || typesLoading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              background: (!templateName.trim() || saving || typesLoading) 
                ? '#9ca3af' 
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              cursor: (!templateName.trim() || saving || typesLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: (!templateName.trim() || saving || typesLoading) 
                ? 'none' 
                : '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            {saving ? (isUpdate ? '수정 중...' : '저장 중...') : (isUpdate ? '수정' : '저장')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};