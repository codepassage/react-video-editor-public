/**
 * ⌨️ KeyboardHandler.tsx - 전역 키보드 이벤트 처리 컴포넌트
 * 
 * 비디오 에디터에서 키보드 단축키를 통한 클립 조작을 담당하는 컴포넌트입니다.
 * UI에 렌더링되지 않으며, 전역 키보드 이벤트 리스너를 등록하여
 * 선택된 클립들에 대한 직접적인 조작을 가능하게 합니다.
 * 
 * 지원되는 키보드 단축키:
 * - Option/Alt + ← : 선택된 클립들을 1초씩 뒤로 이동
 * - Option/Alt + → : 선택된 클립들을 1초씩 앞으로 이동
 * - Delete/Backspace : 선택된 클립들 삭제 (현재 비활성화)
 * 
 * 특징:
 * - 다중 클립 선택 지원 (Bundle 시스템과 연동)
 * - 타임라인 경계 안전성 보장 (0초 미만으로 이동 방지)
 * - 클립 지속시간 유지 (startTime + duration = endTime)
 * - 실시간 상태 업데이트 (useEditorStore 연동)
 * 
 * 관련 모듈:
 * - 3번 모듈: Bundle System (다중 선택된 번들 클립 조작)
 * - 8번 모듈: State Management (editorStore 상태 업데이트)
 * - 1번 모듈: Timeline System (타임라인 표시 업데이트)
 */
import React, { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

/**
 * KeyboardHandler 컴포넌트 - 전역 키보드 단축키 관리
 * 
 * 주요 책임:
 * 1. 전역 키보드 이벤트 리스너 등록/해제
 * 2. 선택된 클립들에 대한 시간축 이동 처리
 * 3. 클립 삭제 단축키 처리 (필요시 활성화)
 * 4. 키보드 이벤트 충돌 방지 (preventDefault)
 * 
 * 동작 방식:
 * - 컴포넌트 마운트 시 전역 keydown 이벤트 리스너 등록
 * - 선택된 클립이 있을 때만 단축키 활성화
 * - 각 클립의 시간 속성을 안전하게 업데이트
 * - 컴포넌트 언마운트 시 이벤트 리스너 정리
 */
export const KeyboardHandler: React.FC = () => {
  const {
    selectedClips,
    updateClip,
    getClipById,
    removeClip,
    selectClips,
    tracks
  } = useEditorStore();

  // 🎯 전역 키보드 이벤트 리스너 등록
  // 컴포넌트 마운트 시 등록되고 언마운트 시 자동 정리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 🔄 Option/Alt + 좌우 화살표: 선택된 클립들의 시간축 이동
      // 1초 단위로 정밀한 이동 제어 가능
      if (e.altKey && selectedClips.length > 0) {
        e.preventDefault();

        const moveTime = 1; // 1초씩 이동

        if (e.key === 'ArrowLeft') {
          // 선택된 클립들을 1초 뒤로 이동
          selectedClips.forEach(clipId => {
            const clip = getClipById(clipId);
            if (clip) {
              const newStartTime = Math.max(0, clip.startTime - moveTime);
              updateClip(clipId, {
                startTime: newStartTime,
                endTime: newStartTime + clip.duration
              });
            }
          });
        } else if (e.key === 'ArrowRight') {
          // 선택된 클립들을 1초 앞으로 이동
          selectedClips.forEach(clipId => {
            const clip = getClipById(clipId);
            if (clip) {
              const newStartTime = clip.startTime + moveTime;
              updateClip(clipId, {
                startTime: newStartTime,
                endTime: newStartTime + clip.duration
              });
            }
          });
        }
      }

      // Delete 키로 선택된 클립 삭제
      // if (e.key === 'Delete' || e.key === 'Backspace') {
      //   if (selectedClips.length > 0) {
      //     e.preventDefault();
      //     selectedClips.forEach(clipId => removeClip(clipId));
      //     selectClips([]);
      //   }
      // }

      // ESC 키로 선택 해제
      if (e.key === 'Escape') {
        if (selectedClips.length > 0) {
          e.preventDefault();
          selectClips([]);
        }
      }

      // Ctrl/Cmd + A로 모든 클립 선택
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allClipIds = tracks.flatMap(track => track.clips.map(clip => clip.id));
        selectClips(allClipIds);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedClips, updateClip, getClipById, removeClip, selectClips, tracks]);

  return null; // 이 컴포넌트는 렌더링하지 않음
};
