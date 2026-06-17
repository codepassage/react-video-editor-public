import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../utils/urlBuilder';
import axios from 'axios';

// 전역 음성 데이터 캐시 (싱글톤 패턴)
let globalVoicesCache: Record<string, Voice[]> | null = null;
let globalLoadingPromise: Promise<Record<string, Voice[]>> | null = null;

interface TTSVoiceSelectorProps {
  selectedLanguage: string;
  selectedVoice: string;
  onLanguageChange: (language: string) => void;
  onVoiceChange: (voice: string) => void;
  className?: string;
  compact?: boolean; // 컴팩트 모드 (Audio 클립용)
}

interface Voice {
  name: string;
  ssmlGender: 'FEMALE' | 'MALE' | 'NEUTRAL';
  type: string;
  primaryLanguage: string;
  region: string;
}

export const TTSVoiceSelector: React.FC<TTSVoiceSelectorProps> = ({
  selectedLanguage,
  selectedVoice,
  onLanguageChange,
  onVoiceChange,
  className = '',
  compact = false
}) => {
  const [voicesByLanguage, setVoicesByLanguage] = useState<Record<string, Voice[]>>({});
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [voiceTypeFilter, setVoiceTypeFilter] = useState<string>('all');

  // API 기본 URL
  const API_BASE_URL = getApiUrl();

  // localStorage 캐시 키
  const VOICES_CACHE_KEY = 'tts-voices-cache';
  const VOICES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

  // TTS 음성 목록 로드 (싱글톤 패턴)
  const loadTTSVoices = useCallback(async (forceRefresh = false) => {
    // 전역 캐시 확인
    if (!forceRefresh && globalVoicesCache) {
      setVoicesByLanguage(globalVoicesCache);
      return globalVoicesCache;
    }

    // 이미 로딩 중이면 해당 Promise를 재사용
    if (globalLoadingPromise) {
      const result = await globalLoadingPromise;
      setVoicesByLanguage(result);
      return result;
    }

    // localStorage 캐시 확인
    if (!forceRefresh) {
      const cached = localStorage.getItem(VOICES_CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > VOICES_CACHE_DURATION;
          
          if (!isExpired && data) {
            globalVoicesCache = data;
            setVoicesByLanguage(data);
            return data;
          }
        } catch (error) {
          console.warn('캐시 파싱 실패:', error);
        }
      }
    }
    
    // API 로딩 시작
    setIsLoadingVoices(true);
    setVoicesError(null);
    
    globalLoadingPromise = (async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tts/voices-by-language`);
        
        if (response.data.success) {
          const voicesData = response.data.voicesByLanguage;
          
          // 전역 캐시 및 localStorage 저장
          globalVoicesCache = voicesData;
          localStorage.setItem(VOICES_CACHE_KEY, JSON.stringify({
            data: voicesData,
            timestamp: Date.now()
          }));
          
          return voicesData;
        } else {
          throw new Error(response.data.error || 'TTS 음성 목록 로드 실패');
        }
      } catch (error) {
        console.error('❌ TTS 음성 목록 로드 실패:', error);
        setVoicesError('음성 목록을 불러올 수 없습니다. 환경설정에서 음성 목록을 갱신해보세요.');
        
        // 폴백: 기본 음성 목록 사용
        const fallbackVoices = {
          ko: [
            { name: 'ko-KR-Standard-A', ssmlGender: 'FEMALE' as const, type: 'Standard', primaryLanguage: 'ko', region: 'ko-KR' },
            { name: 'ko-KR-Standard-B', ssmlGender: 'MALE' as const, type: 'Standard', primaryLanguage: 'ko', region: 'ko-KR' },
            { name: 'ko-KR-Standard-C', ssmlGender: 'FEMALE' as const, type: 'Standard', primaryLanguage: 'ko', region: 'ko-KR' },
            { name: 'ko-KR-Standard-D', ssmlGender: 'MALE' as const, type: 'Standard', primaryLanguage: 'ko', region: 'ko-KR' }
          ]
        };
        globalVoicesCache = fallbackVoices;
        return fallbackVoices;
      }
    })();

    try {
      const result = await globalLoadingPromise;
      setVoicesByLanguage(result);
      return result;
    } finally {
      setIsLoadingVoices(false);
      globalLoadingPromise = null; // 로딩 완료 후 Promise 초기화
    }
  }, [API_BASE_URL]);

  // 컴포넌트 마운트 시 음성 목록 로드 (한 번만)
  useEffect(() => {
    if (Object.keys(voicesByLanguage).length === 0) {
      loadTTSVoices();
    }
  }, []); // 빈 dependency array로 한 번만 실행

  // 언어 변경 핸들러
  const handleLanguageChange = (language: string) => {
    onLanguageChange(language);
    setVoiceTypeFilter('all'); // 필터 초기화
    
    // 해당 언어의 첫 번째 음성을 기본값으로 선택
    const languageVoices = voicesByLanguage[language] || [];
    if (languageVoices.length > 0) {
      const defaultVoice = languageVoices[0].name;
      onVoiceChange(defaultVoice);
    }
  };

  // 음성 선택 핸들러
  const handleVoiceSelect = (voiceName: string) => {
    onVoiceChange(voiceName);
  };

  // 필터링된 음성 목록 가져오기
  const getFilteredVoices = (): Voice[] => {
    // "auto" 선택 시 한국어 음성을 기본으로 표시
    const targetLanguage = selectedLanguage === 'auto' ? 'ko' : selectedLanguage;
    const voices = voicesByLanguage[targetLanguage] || [];
    
    if (voiceTypeFilter === 'all') {
      return voices;
    }
    
    return voices.filter(voice => voice.type === voiceTypeFilter);
  };

  // 음성 타입 목록 가져오기
  const getVoiceTypes = (): string[] => {
    // "auto" 선택 시 한국어 음성을 기본으로 표시
    const targetLanguage = selectedLanguage === 'auto' ? 'ko' : selectedLanguage;
    const voices = voicesByLanguage[targetLanguage] || [];
    const types = [...new Set(voices.map(v => v.type))];
    return ['all', ...types];
  };

  // 사용 가능한 언어 목록
  const getAvailableLanguages = () => {
    const languages = Object.keys(voicesByLanguage);
    // 언어 코드를 언어 이름으로 매핑
    const languageMap: Record<string, string> = {
      ko: '한국어',
      en: 'English',
      ja: '日本語',
      zh: '中文',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ar: 'العربية',
      hi: 'हिन्दी',
      nl: 'Nederlands',
      sv: 'Svenska',
      da: 'Dansk',
      no: 'Norsk',
      fi: 'Suomi',
      pl: 'Polski',
      tr: 'Türkçe',
      th: 'ไทย',
      vi: 'Tiếng Việt',
      id: 'Bahasa Indonesia',
      ms: 'Bahasa Melayu'
    };
    
    return languages.map(code => ({
      code,
      name: languageMap[code] || code.toUpperCase()
    })).sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <div className={`tts-voice-selector ${className}`}>
      <div className={compact ? "space-y-2" : "space-y-4"}>
        {/* 언어 선택 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2 flex items-center space-x-2">
            <span>🌏</span>
            <span>언어</span>
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="auto">🤖 Auto (자동 감지)</option>
            {getAvailableLanguages().map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* 음성 타입 필터 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2 flex items-center space-x-2">
            <span>🎤</span>
            <span>음성 타입</span>
          </label>
          <select
            value={voiceTypeFilter}
            onChange={(e) => setVoiceTypeFilter(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            {getVoiceTypes().map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All (모든 타입)' : type}
              </option>
            ))}
          </select>
        </div>

        {/* 음성 선택 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2 flex items-center space-x-2">
            <span>📍</span>
            <span>음성 선택</span>
            {isLoadingVoices && (
              <span className="text-xs text-yellow-400 flex items-center space-x-1">
                <span className="animate-spin">⚡</span>
                <span>로딩 중...</span>
              </span>
            )}
          </label>
          
          {voicesError && (
            <div className="bg-red-900/30 border border-red-600/50 rounded p-2 mb-2">
              <p className="text-xs text-red-300">{voicesError}</p>
              <button
                onClick={() => loadTTSVoices(true)}
                className="text-xs text-red-400 hover:text-red-300 underline mt-1"
              >
                다시 시도
              </button>
            </div>
          )}
          
          <div className={`bg-gray-700 rounded p-3 overflow-y-auto ${compact ? 'max-h-32' : 'max-h-48'}`}>
            {getFilteredVoices().length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">
                {isLoadingVoices ? '음성 목록을 불러오는 중...' : '사용 가능한 음성이 없습니다'}
              </p>
            ) : (
              <div className="space-y-2">
                {getFilteredVoices().map((voice) => {
                  const genderIcon = voice.ssmlGender === 'FEMALE' ? '👩' : 
                                   voice.ssmlGender === 'MALE' ? '👨' : '🤖';
                  const genderText = voice.ssmlGender === 'FEMALE' ? '여성' : 
                                   voice.ssmlGender === 'MALE' ? '남성' : '중성';
                  const displayName = voice.name.split('-').pop() || voice.name;
                  
                  return (
                    <label
                      key={voice.name}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`voiceSelection-${selectedLanguage}`}
                        value={voice.name}
                        checked={selectedVoice === voice.name}
                        onChange={() => handleVoiceSelect(voice.name)}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span>{genderIcon}</span>
                          <span className={`text-white ${compact ? 'text-xs' : 'text-sm'}`}>
                            {genderText} {displayName}
                          </span>
                          {voice.type !== 'Standard' && (
                            <span className={`text-xs bg-blue-600 text-white px-2 py-0.5 rounded ${compact ? 'text-xs' : ''}`}>
                              {voice.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* 음성 정보 표시 */}
          <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
            <span>
              {(() => {
                const targetLanguage = selectedLanguage === 'auto' ? 'ko' : selectedLanguage;
                const hasVoices = voicesByLanguage[targetLanguage];
                
                if (selectedLanguage === 'auto') {
                  return hasVoices ? 
                    `🤖 자동 감지 모드 (${getFilteredVoices().length}개 음성)` :
                    '🤖 자동 감지 모드 (기본 음성)';
                }
                
                return hasVoices ? 
                  `${getFilteredVoices().length}개 음성 표시 중 (전체: ${hasVoices.length}개)` :
                  '기본 음성 사용 중';
              })()}
            </span>
            {!isLoadingVoices && !voicesError && Object.keys(voicesByLanguage).length > 0 && (
              <span className="text-green-400">● 캐시됨</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};