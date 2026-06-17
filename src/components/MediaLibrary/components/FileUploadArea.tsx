/**
 * 📎 FileUploadArea.tsx - 파일 업로드 영역 컴포넌트
 * 
 * 미디어 라이브러리의 파일 업로드 및 컨트롤 영역을 담당하는 컴포넌트입니다.
 * 로컬 파일 업로드, 서버 미디어 관리, 미디어 컨트롤 버튼 등
 * 미디어 관리와 관련된 모든 인터렉션을 통합적으로 제공합니다.
 * 
 * 주요 기능:
 * - 파일 업로드 및 진행률 표시
 * - 업로드 상태 및 에러 메시지 표시
 * - 서버 미디어 새로고침 기능
 * - 미디어 컨트롤 버튼 목록 (텍스트, 도형, 오디오 등)
 * - 각 컨트롤의 화륨문 메뉴 지원
 * - 동적 컨트롤 활성화/비활성화
 * 
 * 업로드 기능:
 * - 다중 파일 동시 업로드 지원
 * - 업로드 진행률 실시간 표시
 * - 업로드 성공/실패 상태 피드백
 * - 업로드 중 UI 비활성화
 * 
 * 미디어 컨트롤:
 * - 텍스트 클립 추가 (다양한 스타일)
 * - 도형 컨트롤 (Rectangle, Circle, Triangle 등)
 * - 오디오 컨트롤 (마이크, TTS 등)
 * - 각 컨트롤의 오른쪽 클릭 컴텍스트 메뉴
 * - 속성 패널 연동 기능
 * 
 * 상태 관리:
 * - activeTab: 현재 활성 탭 (local/server)
 * - 업로드 상태 (진행중, 에러, 성공)
 * - 서버 미디어 로딩 상태
 * - 컨트롤 버튼 활성화 상태
 * 
 * 관련 모듈:
 * - 미디어 라이브러리 시스템 (파일 관리)
 * - API 클라이언트 (파일 업로드)
 * - 2번 모듈: Clip Type System (컨트롤 타입 연동)
 * - 8번 모듈: State Management (미디어 상태 연동)
 */
import React from 'react';
import { CheckCircle, AlertCircle, FileIcon, Upload, RefreshCw } from 'lucide-react';
import { UploadProgress } from '../../../api/client';
import { fileUtils } from '../../../api/client';

interface FileUploadAreaProps {
  activeTab: 'local' | 'server';
  isUploading: boolean;
  uploadError: string | null;
  uploadSuccess: string | null;
  uploadProgress: UploadProgress | null;
  serverMediaError: string | null;
  isLoadingServerMedia: boolean;
  onRefreshServerMedia: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mediaLibraryControls: Array<{
    id: string;
    type: string;
    label: string;
    icon: string;
    color: string;
    borderColor: string;
    gradient: string;
    shadowColor: string;
    isEnabled: boolean;
  }>;
  onControlClick: (control: any, e: React.MouseEvent) => void;
  onControlRightClick: (control: any, e: React.MouseEvent) => void;
  onOpenControlPropertiesPanel: (controlId: string) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  activeTab,
  isUploading,
  uploadError,
  uploadSuccess,
  uploadProgress,
  serverMediaError,
  isLoadingServerMedia,
  onRefreshServerMedia,
  onFileUpload,
  mediaLibraryControls,
  onControlClick,
  onControlRightClick,
  onOpenControlPropertiesPanel,
  fileInputRef
}) => {
  return (
    <div style={{ 
      marginBottom: '16px',
      padding: '0 16px'
    }}>
      {/* 업로드 에러 메시지 */}
      {uploadError && (
        <div style={{
          marginBottom: '12px',
          padding: '12px',
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.8) 0%, rgba(229, 115, 115, 0.8) 100%)',
          border: '1px solid rgba(244, 67, 54, 0.4)',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(244, 67, 54, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* 업로드 성공 메시지 */}
      {uploadSuccess && (
        <div style={{
          marginBottom: '12px',
          padding: '12px',
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(129, 199, 132, 0.8) 100%)',
          border: '1px solid rgba(76, 175, 80, 0.4)',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <CheckCircle size={16} />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* 서버 미디어 에러 메시지 */}
      {serverMediaError && activeTab === 'server' && (
        <div style={{
          marginBottom: '12px',
          padding: '12px',
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(255, 193, 7, 0.8) 100%)',
          border: '1px solid rgba(255, 152, 0, 0.4)',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(255, 152, 0, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span style={{ fontWeight: '600' }}>서버 연결 안내</span>
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.5', paddingLeft: '24px' }}>
            {serverMediaError}
          </div>
          {serverMediaError.includes('API가 아직 준비되지') && (
            <div style={{
              fontSize: '12px',
              opacity: 0.9,
              paddingLeft: '24px',
              marginTop: '4px',
              fontFamily: 'monospace',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '8px',
              borderRadius: '6px'
            }}>
              💡 서버 개발 시 필요한 엔드포인트:<br />
              GET /api/files - 전체 파일 목록<br />
              GET /api/files?type=image - 타입별 필터링
            </div>
          )}
        </div>
      )}

      {/* 업로드 진행상황 */}
      {uploadProgress && (
        <div style={{
          marginBottom: '12px',
          padding: '12px',
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(100, 181, 246, 0.8) 100%)',
          border: '1px solid rgba(33, 150, 243, 0.4)',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '14px',
          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* 파일 이름 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <FileIcon size={14} />
            <span style={{
              fontSize: '13px',
              opacity: 0.9,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {uploadProgress.fileName}
            </span>
          </div>

          {/* 진행률 바 */}
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              width: `${uploadProgress.percentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffffff 0%, #e3f2fd 100%)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
            }} />
          </div>

          {/* 진행률 텍스트 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            opacity: 0.9
          }}>
            <span>{uploadProgress.percentage}% 완료</span>
            <span>
              {fileUtils.formatFileSize(uploadProgress.loaded)} / {fileUtils.formatFileSize(uploadProgress.total)}
            </span>
          </div>
        </div>
      )}

      {/* 로컬 탭일 때만 컨트롤 버튼들 표시 */}
      {activeTab === 'local' && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          {mediaLibraryControls.filter(control => control.isEnabled).map(control => (
            <button
              key={control.id}
              onClick={(e) => onControlClick(control, e)}
              onContextMenu={(e) => onControlRightClick(control, e)}
              onDoubleClick={(e) => {
                e.preventDefault();
                onOpenControlPropertiesPanel(control.id);
              }}
              disabled={isUploading}
              style={{
                flex: '1 1 calc(50% - 3px)',
                minWidth: '120px',
                padding: '8px 6px',
                borderRadius: '8px',
                border: `1px solid ${control.borderColor}`,
                cursor: (isUploading && (control.type === 'upload' || control.type === 'text')) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: control.color,
                fontSize: '11px',
                fontWeight: '600',
                opacity: isUploading ? 0.6 : 1,
                background: isUploading
                  ? 'rgba(158, 158, 158, 0.5)'
                  : control.gradient,
                boxShadow: `0 4px 15px ${control.shadowColor}`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={`• 좌클릭: ${control.label} 실행\n• 우클릭/더블클릭: 속성 편집\n• Ctrl+클릭: 속성 편집`}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${control.shadowColor.replace('0.3)', '0.5)')}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 4px 15px ${control.shadowColor}`;
                }
              }}
            >
              {/* 아이콘 영역 */}
              <span style={{ fontSize: '16px' }}>
                {control.type === 'upload' && isUploading ? '🔄' : control.icon}
              </span>

              {/* 레이블 */}
              <span>
                {control.type === 'upload' && isUploading
                  ? `업로드 중... ${uploadProgress?.percentage || 0}%`
                  : control.label
                }
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 서버 탭일 때 새로고침 버튼 */}
      {activeTab === 'server' && (
        <button
          onClick={onRefreshServerMedia}
          disabled={isLoadingServerMedia}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(100, 181, 246, 0.3)',
            cursor: isLoadingServerMedia ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#64b5f6',
            fontSize: '14px',
            fontWeight: '600',
            opacity: isLoadingServerMedia ? 0.6 : 1,
            background: isLoadingServerMedia
              ? 'rgba(158, 158, 158, 0.5)'
              : 'linear-gradient(135deg, rgba(33, 150, 243, 0.8) 0%, rgba(100, 181, 246, 0.8) 100%)',
            boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          title="서버 미디어 새로고침"
          onMouseEnter={(e) => {
            if (!isLoadingServerMedia) {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoadingServerMedia) {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
            }
          }}
        >
          <RefreshCw size={16} style={{ 
            animation: isLoadingServerMedia ? 'spin 1s linear infinite' : 'none'
          }} />
          <span>
            {isLoadingServerMedia ? '새로고침 중...' : '서버 미디어 새로고침'}
          </span>
        </button>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={onFileUpload}
        style={{ display: 'none' }}
        id="media-file-input"
      />
    </div>
  );
};