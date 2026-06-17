import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import {
  KeyboardShortcutManager,
  moveRegularClipToAnchor,
  moveRegularClipToBaseClip,
  getMaxMoveDistance,
  isBaseClip,
  TimelineClip
} from '../../../types';

interface KeyboardShortcutsProps {
  selectedClips: string[];
  allClips: TimelineClip[];
  currentTime: number;
  updateClip: (id: string, updates: any) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  isPlaying: boolean; // 현재 재생 상태 추가
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  selectedClips,
  allClips,
  currentTime,
  updateClip,
  setCurrentTime,
  setIsPlaying,
  isPlaying,
  showSuccess,
  showError
}) => {
  // 🎯 스토어에서 템플릿 그룹과 번들 관련 데이터 가져오기
  const { 
    selectedGroupId, 
    moveTemplateGroup, 
    templateGroups, 
    bundles 
  } = useEditorStore();
  
  // === 새로운 2키 조합 키보드 단축키 시스템 === //
  const keyboardManagerRef = useRef(new KeyboardShortcutManager());

  // === 새로운 2키 조합 키보드 단축키 이벤트 처리 === //
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 스페이스바 처리 (Option 키 없이)
      if (event.code === 'Space') {
        // 입력 필드에 포커스가 있으면 무시
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        )) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        console.log('🎯 스페이스바 재생/정지 토글:', isPlaying ? '정지' : '재생');
        setIsPlaying(!isPlaying);
        return;
      }

      // Option 키가 눌리지 않았으면 무시
      if (!event.altKey) return;

      // 직접 키 매핑 (한글 입력 모드에서도 동작)
      let shortcut = null;
      
      if (event.code === 'KeyS') {
        shortcut = { type: 'clip-start', direction: 'left' };
      } else if (event.code === 'KeyD') {
        shortcut = { type: 'clip-start', direction: 'right' };
      } else if (event.code === 'KeyX') {
        shortcut = { type: 'clip-end', direction: 'left' };
      } else if (event.code === 'KeyC') {
        shortcut = { type: 'clip-end', direction: 'right' };
      } else if (event.code === 'ArrowLeft') {
        shortcut = { type: 'clip-move-0.2s', direction: 'left' };
      } else if (event.code === 'ArrowRight') {
        shortcut = { type: 'clip-move-0.2s', direction: 'right' };
      } else if (event.code === 'KeyW') {
        shortcut = { type: 'clip-move-1s', direction: 'left' };
      } else if (event.code === 'KeyE') {
        shortcut = { type: 'clip-move-1s', direction: 'right' };
      }

      if (!shortcut) return;

      // 이벤트 기본 동작 방지
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      console.log('🎯 키보드 단축키 감지:', shortcut);

    // 시간 이동 처리 (0.2초, 1초 단위)
    const handleTimeMovement = (direction: 'left' | 'right', amount: number) => {
      const delta = direction === 'left' ? -amount : amount;
      const newTime = Math.max(0, currentTime + delta);
      setCurrentTime(newTime);
      console.log(`⏰ 시간 이동: ${delta > 0 ? '+' : ''}${delta}초 (현재: ${newTime.toFixed(2)}초)`);
      
      // 성공 메시지 제거됨 - 피드백 없이 조용히 이동
    };

    // 클립/템플릿 그룹 이동 처리
    const handleMoveShortcut = (shortcut: { type: 'move'; direction: 'left' | 'right'; amount: number }) => {
      const moveAmount = shortcut.amount;
      const deltaTime = shortcut.direction === 'left' ? -moveAmount : moveAmount;

      // 🎯 템플릿 그룹 이동 우선 처리
      if (selectedGroupId) {
        console.log('🎯 템플릿 그룹 이동 시도:', {
          groupId: selectedGroupId,
          direction: shortcut.direction,
          amount: moveAmount,
          deltaTime: deltaTime
        });
        
        try {
          moveTemplateGroup(selectedGroupId, deltaTime);
          
          // 성공 메시지 (템플릿 그룹용)
          showSuccess(`템플릿 그룹 ${moveAmount}초 ${shortcut.direction === 'left' ? '뒤로' : '앞으로'} 이동`);
          
          console.log('✅ 템플릿 그룹 키보드 이동 성공');
        } catch (error) {
          console.error('❌ 템플릿 그룹 이동 오류:', error);
          showError('템플릿 그룹 이동에 실패했습니다.');
        }
        
        return; // 템플릿 그룹 이동 완료
      }

      // 🎯 개별 클립 이동 로직 (기존 로직)
      if (selectedClips.length === 0) {
        showError('이동할 클립 또는 템플릿 그룹을 먼저 선택해주세요.');
        return;
      }

      // 클립 분류
      const targetClips = selectedClips.map(clipId => allClips.find(c => c.id === clipId)).filter(Boolean) as TimelineClip[];
      const baseClips = targetClips.filter(isBaseClip);
      const regularClips = targetClips.filter(clip => !isBaseClip(clip));

      console.log('🎯 클립 이동 대상:', {
        total: targetClips.length,
        base: baseClips.length,
        regular: regularClips.length
      });

      // 이동 가능한 최대 거리 체크 (기준클립이 있는 경우만)
      let maxDistance = moveAmount;
      if (baseClips.length > 0) {
        // 기준클립들의 이동 가능한 최대 거리 계산
        const allBaseClips = allClips.filter(isBaseClip);
        maxDistance = Math.min(
          ...baseClips.map(baseClip => 
            getMaxMoveDistance(baseClip, allBaseClips, shortcut.direction, moveAmount)
          )
        );
        
        if (maxDistance === 0) {
          // 성공 메시지 제거됨 - 피드백 없이 조용히 이동
          return;
        }
      }

      // 실제 이동 거리 계산 (요청된 거리와 최대 가능 거리 중 작은 값)
      const actualMoveDistance = Math.min(moveAmount, maxDistance);

      // 모든 클립 이동 실행 (Base + Regular)
      targetClips.forEach(clip => {
        const newStartTime = shortcut.direction === 'left' 
          ? clip.startTime - actualMoveDistance
          : clip.startTime + actualMoveDistance;
        const newEndTime = shortcut.direction === 'left'
          ? clip.endTime - actualMoveDistance  
          : clip.endTime + actualMoveDistance;

        updateClip(clip.id, {
          startTime: newStartTime,
          endTime: newEndTime
        });
      });

      // 성공 메시지 제거됨 - 피드백 없이 조용히 이동
    };

    // 클립 기준점 정렬 이동 함수 (Option + S/D/X/C)
    const handleClipAlignMove = (shortcut: { type: 'clip-start' | 'clip-end'; direction: 'left' | 'right' }) => {
      if (selectedClips.length === 0) {
        showError('이동할 클립을 먼저 선택해주세요.');
        return;
      }

      // 일반 클립만 필터링
      const regularClipIds = selectedClips.filter(clipId => {
        const clip = allClips.find(c => c.id === clipId);
        return clip && !isBaseClip(clip);
      });

      if (regularClipIds.length === 0) {
        showError('일반 클립만 이동 가능합니다. 기준클립은 제외됩니다.');
        return;
      }

      const baseClips = allClips.filter(isBaseClip);

      // 확장된 앵커 대상 확인 (기준클립 + 템플릿 그룹 + 번들)
      const hasAnyAnchorTargets = baseClips.length > 0 || 
                                 (templateGroups && templateGroups.length > 0) || 
                                 (bundles && bundles.length > 0);

      if (!hasAnyAnchorTargets) {
        showError('앵커 대상이 없습니다. 기준클립, 템플릿 그룹, 또는 번들이 필요합니다.');
        return;
      }

      // 확장된 앵커 시스템으로 일반클립 이동 실행
      const result = moveRegularClipToAnchor({
        selectedClipIds: regularClipIds,
        allClips: allClips,
        templateGroups: templateGroups || [],
        bundles: bundles || [],
        anchorType: shortcut.type === 'clip-start' ? 'start' : 'end',
        direction: shortcut.direction
      });

      if (result.success && result.updatedClips.length > 0) {
        result.updatedClips.forEach(updatedClip => {
          updateClip(updatedClip.id, {
            startTime: updatedClip.startTime,
            endTime: updatedClip.endTime,
            duration: updatedClip.duration,
            regularClipProperties: updatedClip.regularClipProperties // 🔗 연결관계 포함
          });
        });

        // 성공 메시지 제거됨 - 피드백 없이 조용히 이동
      } else {
        showError(result.message || '클립 이동에 실패했습니다.');
      }
    };

      // 타입별 처리
      switch (shortcut.type) {
        case 'clip-move-0.2s':
          handleMoveShortcut({ type: 'move', direction: shortcut.direction as 'left' | 'right', amount: 0.2 });
          break;
        case 'clip-move-1s':
          handleMoveShortcut({ type: 'move', direction: shortcut.direction as 'left' | 'right', amount: 1.0 });
          break;

        case 'clip-start':
        case 'clip-end':
          handleClipAlignMove(shortcut as { type: 'clip-start' | 'clip-end'; direction: 'left' | 'right' });
          break;
      }
    };

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', keyboardManagerRef.current.handleKeyUp, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', keyboardManagerRef.current.handleKeyUp, true);
    };
  }, [selectedClips, allClips, updateClip, currentTime, setCurrentTime, setIsPlaying, showSuccess, showError]);

  return null; // 키보드 단축키만 처리하고 UI는 렌더링하지 않음
};