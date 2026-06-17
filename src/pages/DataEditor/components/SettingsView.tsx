import React, { useState } from 'react';
import { Settings, Mic2, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../../utils/urlBuilder';
import axios from 'axios';
import { DefaultVoiceSettings } from '../../../components/shared/DefaultVoiceSettings';

export const SettingsView: React.FC = () => {
  const [isRefreshingVoices, setIsRefreshingVoices] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  // API 기본 URL
  const API_BASE_URL = getApiUrl();

  // TTS 음성 목록 갱신 핸들러
  const handleRefreshTTSVoices = async () => {
    try {
      setIsRefreshingVoices(true);
      setRefreshResult(null);
      console.log('🎤 TTS 음성 목록 갱신 시작...');

      const response = await axios.post(`${API_BASE_URL}/api/tts/refresh-voices`);
      
      if (response.data.success) {
        console.log('✅ TTS 음성 목록 갱신 완료:', response.data);
        
        const successMessage = `TTS 음성 목록이 성공적으로 갱신되었습니다!\n\n총 음성: ${response.data.totalVoices}개\n지원 언어: ${response.data.languages}개`;
        
        setRefreshResult({
          success: true,
          message: successMessage,
          data: response.data
        });

        // TTS 음성 목록 갱신 후 이벤트 발생하여 다른 컴포넌트에 알림
        window.dispatchEvent(new CustomEvent('tts-voices-updated'));
      } else {
        throw new Error(response.data.error || 'TTS 음성 목록 갱신에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ TTS 음성 목록 갱신 실패:', error);
      
      let errorMessage = 'TTS 음성 목록 갱신에 실패했습니다.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 500) {
          errorMessage += '\n\nGoogle TTS API 연결에 문제가 있을 수 있습니다.\n인터넷 연결과 API 키를 확인해주세요.';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage += '\n\n요청 시간이 초과되었습니다. 다시 시도해주세요.';
        } else {
          errorMessage += `\n\n오류 코드: ${error.response?.status || error.code}`;
        }
      } else if (error instanceof Error) {
        errorMessage += `\n\n${error.message}`;
      }

      setRefreshResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsRefreshingVoices(false);
    }
  };

  return (
    <div className="settings-view" style={{ padding: '20px', maxWidth: '800px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '30px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <Settings size={24} style={{ color: '#4f46e5' }} />
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#1f2937',
          margin: 0 
        }}>
          환경설정
        </h1>
      </div>

      {/* TTS 설정 섹션 */}
      <div style={{ 
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '16px' 
        }}>
          <Mic2 size={20} style={{ color: '#059669' }} />
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: 0 
          }}>
            TTS (Text-to-Speech) 설정
          </h2>
        </div>

        <p style={{ 
          color: '#6b7280', 
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          Google TTS API에서 지원하는 음성 목록을 최신 상태로 갱신합니다. 
          새로운 음성이나 언어가 추가되었을 때 사용하세요.
        </p>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}>
          <button
            onClick={handleRefreshTTSVoices}
            disabled={isRefreshingVoices}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: isRefreshingVoices ? '#9ca3af' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isRefreshingVoices ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              maxWidth: 'fit-content'
            }}
            onMouseEnter={(e) => {
              if (!isRefreshingVoices) {
                e.currentTarget.style.backgroundColor = '#4338ca';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRefreshingVoices) {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }
            }}
          >
            {isRefreshingVoices ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>음성 목록 갱신 중...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>TTS 음성 목록 갱신</span>
              </>
            )}
          </button>

          {/* 결과 표시 */}
          {refreshResult && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${refreshResult.success ? '#10b981' : '#ef4444'}`,
              backgroundColor: refreshResult.success ? '#ecfdf5' : '#fef2f2'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                {refreshResult.success ? (
                  <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
                ) : (
                  <AlertCircle size={20} style={{ color: '#ef4444', marginTop: '2px' }} />
                )}
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: refreshResult.success ? '#065f46' : '#991b1b',
                    margin: '0 0 8px 0'
                  }}>
                    {refreshResult.success ? '갱신 완료' : '갱신 실패'}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: refreshResult.success ? '#047857' : '#dc2626',
                    margin: 0,
                    whiteSpace: 'pre-line',
                    lineHeight: '1.4'
                  }}>
                    {refreshResult.message}
                  </p>
                  {refreshResult.success && refreshResult.data && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#047857'
                    }}>
                      갱신 시간: {new Date(refreshResult.data.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 언어별 기본 음성 설정 */}
      <DefaultVoiceSettings />

      {/* 추가 설정 섹션들을 여기에 추가할 수 있습니다 */}
      <div style={{ 
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1f2937',
          margin: '0 0 16px 0' 
        }}>
          추가 설정
        </h2>
        <p style={{ 
          color: '#6b7280', 
          margin: 0,
          lineHeight: '1.5'
        }}>
          향후 다른 환경설정 옵션들이 이곳에 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
};