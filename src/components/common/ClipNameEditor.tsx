/**
 * ✏️ ClipNameEditor.tsx - 인라인 클립 이름 편집 컴포넌트
 * 
 * 클립의 이름을 인라인으로 편집할 수 있는 사용자 친화적인 편집기 컴포넌트입니다.
 * 클릭하여 편집 모드로 전환하고, 실시간 유효성 검사와 함께 직관적인
 * 이름 변경 인터페이스를 제공합니다.
 * 
 * 주요 기능:
 * - 인라인 텍스트 편집
 * - 실시간 유효성 검사
 * - 중복 이름 방지
 * - ESC 키로 취소
 * - Enter 키로 확인
 * - 포커스 아웃 시 자동 저장
 * 
 * 편집 상태:
 * - 읽기 모드: 이름 표시 + 편집 버튼
 * - 편집 모드: 입력 필드 + 확인/취소 버튼
 * - 유효성 검사: 실시간 오류 표시
 * 
 * 검증 규칙:
 * - 빈 이름 불허
 * - 공백만 있는 이름 불허
 * - 동일 트랙 내 중복 이름 불허
 * - 특수문자 제한 (옵션)
 * 
 * 관련 모듈:
 * - editorStore: 클립 정보 및 업데이트
 * - TimelineClip: 클립 타입 정의
 * - PropertiesPanel: 속성 편집 패널 통합
 */

import React, { useState, useEffect } from 'react';
import { Edit3, Check, X, AlertTriangle } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import type { TimelineClip } from '../../types';

interface ClipNameEditorProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: any) => void;
}

export const ClipNameEditor: React.FC<ClipNameEditorProps> = ({ clip, onUpdate }) => {
  const { tracks } = useEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(clip.name || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 클립 이름이 변경되면 editValue 동기화
  useEffect(() => {
    setEditValue(clip.name || '');
  }, [clip.name]);

  // 모든 다른 클립들 가져오기
  const getAllOtherClips = (): TimelineClip[] => {
    return tracks.flatMap(track => track.clips).filter(c => c.id !== clip.id);
  };

  // 이름 중복 검사
  const validateName = (name: string): { isValid: boolean; error?: string } => {
    // 빈 이름 체크 - 이제 기본 이름을 사용할 수 있으므로 업데이트
    // 비워두면 기본 이름을 사용하므로 빈 이름도 허용
    if (!name.trim()) {
      return { isValid: true }; // 빈 이름은 이제 허용 (기본 이름 사용)
    }

    // 이름 길이 체크
    if (name.trim().length > 50) {
      return {
        isValid: false,
        error: '클립 이름은 50자를 초과할 수 없습니다.'
      };
    }

    // 중복 이름 체크
    const otherClips = getAllOtherClips();
    const isDuplicate = otherClips.some(otherClip => 
      (otherClip.name || '').trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (isDuplicate) {
      return {
        isValid: false,
        error: '이미 사용 중인 클립 이름입니다.'
      };
    }

    // 특수 문자 체크 (기본적인 제한)
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      return {
        isValid: false,
        error: '클립 이름에 특수문자 (<>:"/\\|?*)는 사용할 수 없습니다.'
      };
    }

    return { isValid: true };
  };

  // 편집 시작
  const startEditing = () => {
    setIsEditing(true);
    setValidationError(null);
    
    // 기본 이름이면 비우기 (사용자가 새로 입력하기 쉽게)
    if (!clip.name || clip.name === generateDefaultName()) {
      setEditValue('');
    }
  };

  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue(clip.name || '');
    setValidationError(null);
  };

  // 변경사항 저장
  const saveChanges = () => {
    const trimmedName = editValue.trim();
    
    // 빈 이름이면 기본 이름 사용
    const finalName = trimmedName || generateDefaultName();
    
    const validation = validateName(finalName);

    if (!validation.isValid) {
      setValidationError(validation.error || '유효하지 않은 이름입니다.');
      return;
    }

    // 이름 업데이트
    onUpdate(clip.id, { name: finalName });
    setIsEditing(false);
    setValidationError(null);

    console.log('✅ 클립 이름 변경:', {
      clipId: clip.id.slice(-8),
      oldName: clip.name,
      newName: finalName
    });
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveChanges();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // 실시간 유효성 검사
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditValue(value);

    // 실시간 유효성 검사 - 빈 이름도 허용하도록 개선
    const testName = value.trim() || generateDefaultName();
    const validation = validateName(testName);
    setValidationError(validation.isValid ? null : validation.error || null);
  };

  // 기본 이름 생성 로직 개선
  const generateDefaultName = () => {
    const typeNameMap = {
      video: '비디오 클립',
      audio: '오디오 클립',
      image: '이미지 클립',
      text: '텍스트 클립',
      sentence: 'Sentence 클립',
      shape: '도형 클립',
      simpleShape: '단순 도형 클립',
      polygonShape: '다각형 클립'
    };
    
    return typeNameMap[clip.mediaType] || `${clip.mediaType} 클립`;
  };

  const currentName = clip.name || generateDefaultName();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300 font-medium">클립 이름</label>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
            ID: {clip.id.slice(-8)}
          </span>
          {!isEditing && (
            <button
              onClick={startEditing}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="이름 편집"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
      </div>

      {!isEditing ? (
        // 표시 모드
        <div
          onClick={startEditing}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white cursor-pointer hover:bg-gray-650 hover:border-gray-500 transition-all"
          title="클릭하여 편집"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{currentName}</span>
            <Edit3 size={14} className="text-gray-400" />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            클릭하여 이름을 변경하세요
          </div>
        </div>
      ) : (
        // 편집 모드
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={`flex-1 px-3 py-2 bg-gray-700 border rounded text-white transition-colors ${
                validationError 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-blue-500 focus:border-blue-400'
              }`}
              placeholder={`예: 내 ${generateDefaultName()} 또는 비워두세요`}
              autoFocus
              maxLength={50}
            />
            <button
              onClick={saveChanges}
              disabled={!!validationError}
              className={`p-2 rounded transition-colors ${
                validationError
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title="저장 (Enter)"
            >
              <Check size={16} />
            </button>
            <button
              onClick={cancelEditing}
              className="p-2 bg-gray-600 text-white hover:bg-gray-700 rounded transition-colors"
              title="취소 (Esc)"
            >
              <X size={16} />
            </button>
          </div>

          {/* 유효성 검사 오류 메시지 */}
          {validationError && (
            <div className="flex items-center space-x-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{validationError}</span>
            </div>
          )}

          {/* 도움말 */}
          <div className="text-xs text-gray-400 space-y-1">
            <div>• Enter: 저장, Esc: 취소</div>
            <div>• 최대 50자, 이름 중복 불가</div>
            <div>• 비워두면 기본 이름 사용</div>
            <div>• 특수문자 &lt;&gt;:"/\|?* 사용 불가</div>
          </div>
        </div>
      )}

      {/* 이름 사용 현황 (편집 중이 아닐 때만) */}
      {!isEditing && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400">
            <div className="flex justify-between">
              <span>이름 길이:</span>
              <span className={currentName.length > 30 ? 'text-yellow-400' : 'text-green-400'}>
                {currentName.length}/50자
              </span>
            </div>
            <div className="flex justify-between">
              <span>타임라인 표시:</span>
              <span className="text-blue-400">이름 우선</span>
            </div>
          </div>
          
          {/* 이름 미리보기 */}
          <div className="p-2 bg-gray-800 rounded border border-gray-600">
            <div className="text-xs text-gray-300 mb-1">타임라인 표시 미리보기:</div>
            <div className="text-sm text-white font-medium truncate">
              {clip.mediaType === 'text' && '📝 '}
              {clip.mediaType === 'sentence' && '📄 '}
              {clip.mediaType === 'image' && '🖼️ '}
              {clip.mediaType === 'video' && '🎬 '}
              {clip.mediaType === 'audio' && '🎵 '}
              {(clip.mediaType === 'shape' || clip.mediaType === 'simpleShape' || clip.mediaType === 'polygonShape') && '🔶 '}
              {currentName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
