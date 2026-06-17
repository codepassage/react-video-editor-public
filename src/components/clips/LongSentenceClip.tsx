/**
 * 📝 LongSentenceClip.tsx - 긴 문장 클립 컴포넌트
 * 
 * React Video Editor v1에서 긴 텍스트를 여러 개의 Sentence 클립으로
 * 자동 분할하고 변환하는 고급 컴포넌트입니다.
 * TTS 음성 생성, 자막 생성, 다국어 지원 등 포괄적인 기능을 제공합니다.
 * 
 * 🎯 주요 기능:
 * - 긴 텍스트의 지능형 문장 분할 알고리즘
 * - 실시간 변환 진행률 및 상태 추적
 * - TTS(텍스트 음성 변환) 자동 생성
 * - Whisper API를 통한 자막 생성
 * - 5가지 주요 언어 지원 (한국어, 영어, 일본어, 중국어)
 * - 사용자 정의 분할 옵션 및 고급 설정
 * 
 * 🔄 변환 워크플로우:
 * ```
 * 1. 사용자 입력 → 긴 텍스트 검증
 * 2. 서버 전송 → 문장 분할 알고리즘
 * 3. TTS 생성 → 음성 파일 생성
 * 4. Whisper 처리 → 자막 데이터 생성
 * 5. 결과 반환 → Sentence 클립 배열 생성
 * ```
 * 
 * 🎨 UI 컴포넌트:
 * - 진행률 메터 및 실시간 상태 표시
 * - 인터랙티브 텍스트 에디터 (debouncing)
 * - 접기/펼치기 가능한 고급 설정 패널
 * - 빠른 설정 체크박스 및 드롭다운
 * - 시각적 상태 피드백 (색상, 아이콘)
 * 
 * 🚀 성능 최적화:
 * - 500ms debouncing으로 과도한 API 호출 방지
 * - 지연 로딩을 통한 언어별 음성 옵션
 * - 메모리 효율적인 로컬 상태 관리
 * - 비동기 데이터 처리 및 에러 복구
 * 
 * 🌍 언어 및 음성 지원:
 * - 한국어: ko-KR-Standard-A/B (Google TTS)
 * - 영어: en-US-Standard-A/B 
 * - 일본어: 기본 음성 지원
 * - 중국어: 기본 음성 지원
 * 
 * 🛠️ 고급 설정:
 * - maxWordsPerSentence: 문장당 최대 단어 수 (5-50)
 * - splitOnPunctuation: 구두점 기준 분할 옵션
 * - autoConvertOnEdit: 편집 시 자동 변환
 * - preserveOriginal: 원본 클립 보존 옵션
 * 
 * 🔗 연관 모듈:
 * - 4번 모듈: Long Sentence Engine (서버 측 처리)
 * - 2번 모듈: Clip Type System (Sentence 클립 생성)
 * - TTS 시스템: 음성 생성 및 관리
 * - Whisper API: 자막 생성 서비스
 * 
 * @author React Video Editor Team
 * @since 2024.07
 * @version 2.0
 */
import React, { useState, useEffect } from 'react';
import { LongSentenceClip } from '../../types/clipTypes';
import { FileText, Play, Settings, AlertCircle, CheckCircle, Loader, X } from 'lucide-react';
import { globalAlert } from '../../utils/globalAlert';

interface LongSentenceClipProps {
  clip: LongSentenceClip;
  onConvert: (clipId: string) => void;
  onTextChange: (clipId: string, text: string) => void;
  onSettingsChange: (clipId: string, settings: Partial<LongSentenceClip>) => void;
  onPreview: (clipId: string) => void;
  onDelete: (clipId: string) => void;
  className?: string;
}

export const LongSentenceClipComponent: React.FC<LongSentenceClipProps> = ({
  clip,
  onConvert,
  onTextChange,
  onSettingsChange,
  onPreview,
  onDelete,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localText, setLocalText] = useState(
    clip.data && clip.data.length > 0 ? clip.data[0].text : (clip.text || '')
  );
  const [isEditing, setIsEditing] = useState(false);

  const isConverting = clip.conversionStatus === 'processing';
  const isCompleted = clip.conversionStatus === 'completed';
  const isFailed = clip.conversionStatus === 'failed';
  const isPending = clip.conversionStatus === 'pending';

  // 텍스트 변경 시 로컬 상태 동기화
  useEffect(() => {
    const currentText = clip.data && clip.data.length > 0 ? clip.data[0].text : (clip.text || '');
    setLocalText(currentText);
  }, [clip.data, clip.text]);

  // 텍스트 변경 핸들러 (debouncing)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentText = clip.data && clip.data.length > 0 ? clip.data[0].text : (clip.text || '');
      if (localText !== currentText && localText.trim()) {
        // 새로운 데이터 구조로 업데이트
        if (clip.data && clip.data.length > 0) {
          const newData = [...clip.data];
          newData[0] = { ...newData[0], text: localText };
          onSettingsChange(clip.id, { data: newData });
        } else {
          // 호환성을 위해 기존 방식도 지원
          onTextChange(clip.id, localText);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localText, clip.data, clip.text, clip.id, onTextChange, onSettingsChange]);

  const getStatusIcon = () => {
    switch (clip.conversionStatus) {
      case 'processing':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (clip.conversionStatus) {
      case 'processing':
        return `변환 중... ${clip.conversionProgress}%`;
      case 'completed':
        return `완료 (${clip.generatedClips?.length || 0}개 클립 생성)`;
      case 'failed':
        return '변환 실패';
      default:
        return '변환 대기';
    }
  };

  const getStatusColor = () => {
    switch (clip.conversionStatus) {
      case 'processing':
        return 'border-blue-500 bg-blue-50';
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'failed':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const handleConvert = () => {
    if (!localText.trim()) {
      globalAlert.showWarning('변환할 텍스트를 입력해주세요.');
      return;
    }
    onConvert(clip.id);
  };

  const handleSettingsToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickSettingChange = (key: keyof LongSentenceClip, value: any) => {
    onSettingsChange(clip.id, { [key]: value });
  };

  return (
    <div className={`longsentence-clip ${getStatusColor()} ${className}`}>
      {/* 클립 헤더 */}
      <div className="clip-header">
        <div className="clip-info">
          {getStatusIcon()}
          <h3 className="clip-title">긴 문장 클립</h3>
          <span className="clip-status">{getStatusText()}</span>
        </div>
        
        <div className="clip-actions">
          <button
            onClick={() => onPreview(clip.id)}
            disabled={isConverting}
            className="action-btn preview-btn"
            title="미리보기"
          >
            <Play className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSettingsToggle}
            className="action-btn settings-btn"
            title="설정"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(clip.id)}
            disabled={isConverting}
            className="action-btn delete-btn"
            title="삭제"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 진행률 바 */}
      {isConverting && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${clip.conversionProgress}%` }}
            />
          </div>
          <span className="progress-text">{clip.conversionProgress}%</span>
        </div>
      )}

      {/* 텍스트 입력 영역 */}
      <div className="text-input-container">
        <textarea
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          placeholder={clip.data && clip.data.length > 1 
            ? `${clip.data.length}개의 텍스트+미디어 항목` 
            : "긴 텍스트를 입력하세요. 자동으로 적절한 길이의 문장들로 분할됩니다..."}
          className={`text-input ${isEditing ? 'editing' : ''}`}
          disabled={isConverting}
          rows={4}
        />
        
        <div className="text-stats">
          {clip.data && clip.data.length > 1 ? (
            <>
              <span>데이터 항목: {clip.data.length}</span>
              <span>총 문자: {clip.data.reduce((sum, item) => sum + item.text.length, 0)}</span>
              <span>미디어: {clip.data.filter(item => item.mediaUrl).length}</span>
            </>
          ) : (
            <>
              <span>문자: {localText.length}</span>
              <span>예상 문장: {Math.ceil(localText.length / (clip.maxWordsPerSentence * 6))}</span>
            </>
          )}
        </div>
      </div>

      {/* 빠른 설정 */}
      <div className="quick-settings">
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={clip.generateTTS}
              onChange={(e) => handleQuickSettingChange('generateTTS', e.target.checked)}
              disabled={isConverting}
            />
            음성 생성 (TTS)
          </label>
        </div>
        
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={clip.generateText !== false}
              onChange={(e) => handleQuickSettingChange('generateText', e.target.checked)}
              disabled={isConverting}
            />
            텍스트 클립 생성
          </label>
        </div>
        
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={clip.generateSubtitles}
              onChange={(e) => handleQuickSettingChange('generateSubtitles', e.target.checked)}
              disabled={isConverting || !clip.generateTTS}
            />
            자막 생성 (Whisper)
          </label>
        </div>
        
        <div className="setting-group">
          <label>언어:</label>
          <select
            value={clip.language}
            onChange={(e) => handleQuickSettingChange('language', e.target.value)}
            disabled={isConverting}
            className="language-select"
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>

      {/* 상세 설정 (확장 시) */}
      {isExpanded && (
        <div className="advanced-settings">
          <h4>상세 설정</h4>
          
          <div className="setting-row">
            <label>최대 단어 수:</label>
            <input
              type="number"
              value={clip.maxWordsPerSentence}
              onChange={(e) => handleQuickSettingChange('maxWordsPerSentence', parseInt(e.target.value))}
              min="5"
              max="50"
              disabled={isConverting}
              className="number-input"
            />
          </div>
          
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={clip.splitOnPunctuation}
                onChange={(e) => handleQuickSettingChange('splitOnPunctuation', e.target.checked)}
                disabled={isConverting}
              />
              구두점 기준 분할
            </label>
          </div>
          
          <div className="setting-row">
            <label>음성:</label>
            <select
              value={clip.voice}
              onChange={(e) => handleQuickSettingChange('voice', e.target.value)}
              disabled={isConverting || !clip.generateTTS}
              className="voice-select"
            >
              {clip.language === 'ko' && (
                <>
                  <option value="ko-KR-Standard-A">한국어 여성 A</option>
                  <option value="ko-KR-Standard-B">한국어 남성 B</option>
                </>
              )}
              {clip.language === 'en' && (
                <>
                  <option value="en-US-Standard-A">English Female A</option>
                  <option value="en-US-Standard-B">English Male B</option>
                </>
              )}
            </select>
          </div>
          
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={clip.autoConvertOnEdit}
                onChange={(e) => handleQuickSettingChange('autoConvertOnEdit', e.target.checked)}
                disabled={isConverting}
              />
              편집 시 자동 변환
            </label>
          </div>
          
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={clip.preserveOriginal}
                onChange={(e) => handleQuickSettingChange('preserveOriginal', e.target.checked)}
                disabled={isConverting}
              />
              원본 클립 유지
            </label>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="action-buttons">
        <button
          onClick={handleConvert}
          disabled={isConverting || !localText.trim()}
          className={`convert-btn ${isConverting ? 'converting' : ''}`}
        >
          {isConverting ? (
            <>
              <Loader className="w-4 h-4 animate-spin mr-2" />
              변환 중...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Sentence 클립 생성
            </>
          )}
        </button>
      </div>

      {/* 에러 메시지 */}
      {isFailed && clip.errorMessage && (
        <div className="error-message">
          <AlertCircle className="w-4 h-4" />
          <span>{clip.errorMessage}</span>
        </div>
      )}

      {/* 성공 메시지 */}
      {isCompleted && (
        <div className="success-message">
          <CheckCircle className="w-4 h-4" />
          <span>
            {clip.generatedClips?.length}개의 Sentence 클립이 생성되었습니다.
            {clip.generateTTS && ' 음성 파일도 함께 생성되었습니다.'}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * 기본 내보내기 - LongSentenceClipComponent 컴포넌트
 * 
 * @default
 * @description 외부 모듈에서 사용할 수 있도록 기본 export로 제공합니다.
 */
export default LongSentenceClipComponent;