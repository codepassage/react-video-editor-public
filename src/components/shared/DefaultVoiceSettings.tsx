import React, { useState, useEffect } from 'react';
import { Languages, Volume2, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../utils/urlBuilder';
import axios from 'axios';

interface Voice {
  name: string;
  ssmlGender: 'FEMALE' | 'MALE' | 'NEUTRAL';
  type: string;
  primaryLanguage: string;
  region: string;
}

interface DefaultVoiceConfig {
  [languageCode: string]: string; // languageCode -> voiceName
}


export const DefaultVoiceSettings: React.FC = () => {
  // 스크롤바 스타일을 동적으로 추가
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [voices, setVoices] = useState<Record<string, Voice[]>>({});
  const [defaultVoices, setDefaultVoices] = useState<DefaultVoiceConfig>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const API_BASE_URL = getApiUrl();

  // 언어 코드를 사람이 읽기 쉬운 이름으로 변환
  const getLanguageDisplayName = (languageCode: string): string => {
    const languageNames: Record<string, string> = {
      'ko': '한국어',
      'en': 'English',
      'ja': '日本語',
      'zh': '中文',
      'cmn': '中文 (官话)',
      'yue': '粵語 (광동어)',
      'zh-CN': '中文 (简体)',
      'zh-TW': '中文 (繁體)',
      'zh-HK': '中文 (香港)',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'th': 'ไทย',
      'nl': 'Nederlands',
      'sv': 'Svenska',
      'da': 'Dansk',
      'no': 'Norsk',
      'fi': 'Suomi',
      'pl': 'Polski',
      'tr': 'Türkçe',
      'he': 'עברית',
      'vi': 'Tiếng Việt',
      'id': 'Bahasa Indonesia',
      'ms': 'Bahasa Melayu',
      'tl': 'Filipino',
      'bn': 'বাংলা',
      'ta': 'தமிழ்',
      'te': 'తెలుగు',
      'ml': 'മലയാളം',
      'gu': 'ગુજરાતી',
      'kn': 'ಕನ್ನಡ',
      'ur': 'اردو',
      'fa': 'فارسی',
      'uk': 'Українська',
      'bg': 'Български',
      'hr': 'Hrvatski',
      'cs': 'Čeština',
      'sk': 'Slovenčina',
      'sl': 'Slovenščina',
      'et': 'Eesti',
      'lv': 'Latviešu',
      'lt': 'Lietuvių',
      'mt': 'Malti',
      'ro': 'Română',
      'hu': 'Magyar',
      'el': 'Ελληνικά',
      'ca': 'Català',
      'eu': 'Euskera',
      'gl': 'Galego',
      'is': 'Íslenska',
      'ga': 'Gaeilge',
      'cy': 'Cymraeg',
      'af': 'Afrikaans',
      'sw': 'Kiswahili',
      'zu': 'isiZulu',
      'xh': 'isiXhosa',
      'st': 'Sesotho',
      'tn': 'Setswana',
      'ss': 'SiSwati',
      've': 'Tshivenḓa',
      'ts': 'Xitsonga',
      'nr': 'isiNdebele',
      'nso': 'Sepedi'
    };
    
    return languageNames[languageCode] || languageCode.toUpperCase();
  };

  // API 응답에서 실제 사용 가능한 언어들을 추출
  const getAvailableLanguages = () => {
    return Object.keys(voices).sort((a, b) => {
      // 한국어, 영어, 일본어, 중국어를 앞에 배치
      const priority = ['ko', 'en', 'ja', 'zh', 'cmn', 'yue', 'zh-CN', 'zh-TW', 'zh-HK'];
      const aIndex = priority.indexOf(a);
      const bIndex = priority.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    }).map(code => ({
      code,
      name: getLanguageDisplayName(code)
    }));
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // TTS 음성 목록 갱신 이벤트 감지
  useEffect(() => {
    const handleTTSUpdate = () => {
      console.log('🎵 TTS 음성 목록 갱신 이벤트 감지, 데이터 재로드');
      if (!isLoading) {
        loadData();
      }
    };

    window.addEventListener('tts-voices-updated', handleTTSUpdate);
    return () => window.removeEventListener('tts-voices-updated', handleTTSUpdate);
  }, [isLoading]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setSaveResult(null);

      console.log('🔄 음성 데이터 로드 시작:', API_BASE_URL);

      // 음성 목록과 기본 설정을 병렬로 로드
      const [voicesResponse, defaultsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tts/voices-by-language`, { timeout: 10000 }),
        axios.get(`${API_BASE_URL}/api/tts/default-voices`, { timeout: 10000 })
      ]);

      console.log('📢 음성 목록 응답:', voicesResponse.data);
      console.log('📢 기본 설정 응답:', defaultsResponse.data);

      if (voicesResponse.data.success) {
        const voicesData = voicesResponse.data.data || voicesResponse.data.voicesByLanguage || {};
        setVoices(voicesData);
        console.log('✅ API에서 음성 목록 로드 완료:', Object.keys(voicesData).length, '개 언어');
      } else {
        throw new Error('API 응답에 음성 데이터가 없음');
      }

      if (defaultsResponse.data.success) {
        setDefaultVoices(defaultsResponse.data.data || {});
        console.log('✅ 기본 설정 로드 완료');
      } else {
        console.log('⚠️ 기본 설정이 없음 (정상)');
      }

    } catch (error) {
      console.error('❌ 데이터 로드 실패:', error);
      
      // 기본 설정만 로컬스토리지에서 시도
      try {
        const savedDefaults = localStorage.getItem('tts-default-voices');
        if (savedDefaults) {
          setDefaultVoices(JSON.parse(savedDefaults));
          console.log('📂 로컬스토리지에서 기본 설정 로드');
        }
      } catch (storageError) {
        console.log('📂 로컬스토리지에 저장된 설정 없음');
      }
      
      // 초기 로드 시에는 에러 메시지를 표시하지 않음
      // 사용자가 "다시 시도" 버튼을 클릭한 경우에만 표시
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceChange = (languageCode: string, voiceName: string) => {
    setDefaultVoices(prev => ({
      ...prev,
      [languageCode]: voiceName
    }));
    setSaveResult(null); // 변경 시 이전 결과 초기화
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveResult(null);

      console.log('💾 설정 저장 시작:', defaultVoices);

      // API 서버에 저장 시도
      const response = await axios.post(`${API_BASE_URL}/api/tts/default-voices`, {
        defaultVoices
      }, { timeout: 10000 });

      console.log('📢 서버 저장 응답:', response.data);

      if (response.data.success) {
        // 서버 저장 성공 시 로컬스토리지에도 백업
        localStorage.setItem('tts-default-voices', JSON.stringify(defaultVoices));
        
        setSaveResult({
          success: true,
          message: '기본 음성 설정이 성공적으로 저장되었습니다.'
        });
        console.log('✅ 설정 저장 완료');
      } else {
        throw new Error(response.data.error || '설정 저장에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ 서버 저장 실패, 로컬 저장 시도:', error);
      
      try {
        // 서버 저장 실패 시 로컬스토리지에 저장
        localStorage.setItem('tts-default-voices', JSON.stringify(defaultVoices));
        
        setSaveResult({
          success: true,
          message: '서버 연결 실패로 로컬에 저장했습니다. 서버 연결 후 다시 저장하면 서버에도 동기화됩니다.'
        });
        console.log('📂 로컬스토리지에 저장 완료');
      } catch (localError) {
        console.error('❌ 로컬 저장도 실패:', localError);
        setSaveResult({
          success: false,
          message: `설정 저장에 실패했습니다: ${error.message}`
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getVoiceDisplayName = (voice: Voice) => {
    const genderIcon = voice.ssmlGender === 'FEMALE' ? '♀' : 
                      voice.ssmlGender === 'MALE' ? '♂' : '◯';
    return `${genderIcon} ${voice.name} (${voice.type})`;
  };

  if (isLoading) {
    return (
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
          <Languages size={20} style={{ color: '#7c3aed' }} />
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: 0 
          }}>
            언어별 기본 음성 설정
          </h2>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '20px',
          color: '#6b7280'
        }}>
          <Loader2 size={20} className="animate-spin" />
          <span>Google TTS API에서 음성 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
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
        <Languages size={20} style={{ color: '#7c3aed' }} />
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1f2937',
          margin: 0 
        }}>
          언어별 기본 음성 설정
        </h2>
      </div>

      <div style={{ 
        marginBottom: '20px'
      }}>
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '12px',
          lineHeight: '1.5'
        }}>
          각 언어별로 기본으로 사용할 TTS 음성을 설정합니다. 
          리소스 데이터에서 음성이 지정되지 않은 경우 이 설정이 사용됩니다.
        </p>
        <div style={{
          padding: '12px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#1e40af'
        }}>
          <strong>사용 방법:</strong>
          <br />1. 각 언어의 드롭다운에서 원하는 음성을 선택하세요
          <br />2. 설정을 변경한 후 반드시 "설정 저장" 버튼을 클릭하세요
          <br />3. 설정된 음성은 자동 비디오 생성 시 기본값으로 사용됩니다
        </div>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gap: '12px',
          marginBottom: '24px',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: 'white'
        }}
        className="custom-scrollbar"
      >
        {getAvailableLanguages().map(language => {
          const availableVoices = voices[language.code] || [];
          const selectedVoice = defaultVoices[language.code] || '';

          return (
            <div key={language.code} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              padding: '18px',
              background: selectedVoice ? '#f0f9ff' : '#f9fafb',
              borderRadius: '8px',
              border: selectedVoice ? '1px solid #0ea5e9' : '1px solid #e5e7eb',
              minHeight: '75px'
            }}>
              <div style={{ 
                minWidth: '160px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Volume2 size={16} style={{ color: selectedVoice ? '#0ea5e9' : '#6b7280' }} />
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}>
                  <span style={{ 
                    fontWeight: '500',
                    color: selectedVoice ? '#0369a1' : '#374151',
                    fontSize: '14px',
                    lineHeight: '1.2'
                  }}>
                    {language.name}
                  </span>
                  <span style={{ 
                    fontSize: '11px',
                    color: selectedVoice ? '#0ea5e9' : '#9ca3af',
                    fontFamily: 'monospace',
                    fontWeight: '500',
                    backgroundColor: selectedVoice ? '#f0f9ff' : '#f3f4f6',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${selectedVoice ? '#bae6fd' : '#e5e7eb'}`,
                    display: 'inline-block'
                  }}>
                    {language.code}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {availableVoices.length > 0 ? (
                  <select
                    value={selectedVoice}
                    onChange={(e) => handleVoiceChange(language.code, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  >
                    <option value="">기본 음성 선택...</option>
                    {availableVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {getVoiceDisplayName(voice)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ 
                      color: '#9ca3af', 
                      fontStyle: 'italic',
                      fontSize: '14px'
                    }}>
                      음성 목록을 불러올 수 없습니다
                    </span>
                    <button
                      onClick={loadData}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      다시 시도
                    </button>
                  </div>
                )}
              </div>

              {selectedVoice && (
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  설정됨
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px' 
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: isSaving ? '#9ca3af' : '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = '#6d28d9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = '#7c3aed';
              }
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>설정 저장</span>
              </>
            )}
          </button>

          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            {Object.keys(defaultVoices).length > 0 
              ? `${Object.keys(defaultVoices).length}개 언어 설정됨 (전체 ${Object.keys(voices).length}개 언어 사용 가능)`
              : `설정된 언어 없음 (전체 ${Object.keys(voices).length}개 언어 사용 가능)`
            }
          </div>
        </div>

        {/* 저장 결과 표시 */}
        {saveResult && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${saveResult.success ? '#10b981' : '#ef4444'}`,
            backgroundColor: saveResult.success ? '#ecfdf5' : '#fef2f2'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              {saveResult.success ? (
                <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              ) : (
                <AlertCircle size={20} style={{ color: '#ef4444', marginTop: '2px' }} />
              )}
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: saveResult.success ? '#065f46' : '#991b1b',
                  margin: '0 0 8px 0'
                }}>
                  {saveResult.success ? '저장 완료' : '저장 실패'}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: saveResult.success ? '#047857' : '#dc2626',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {saveResult.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};