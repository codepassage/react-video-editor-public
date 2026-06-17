/**
 * ⌨️ useKeyboardState.ts - 키보드 상태 관리 커스텀 훅
 * 
 * 글로벌 키보드 이벤트를 추적하여 Bundle 시스템의 다중 선택 모드를 지원하는 훅
 * 크로스 플랫폼 호환성을 고려한 Ctrl/Cmd 키 감지 시스템
 * 
 * 주요 기능:
 * - Command/Ctrl 키 상태 실시간 추적
 * - 다중 선택 모드 자동 감지
 * - 크로스 플랫폼 키 매핑 (Windows/Mac)
 * - 윈도우 포커스 해제 시 상태 초기화
 * - Bundle 생성을 위한 선택 모드 지원
 * 
 * 사용 사례:
 * - Bundle 다중 선택 (Ctrl/Cmd + 클릭)
 * - 키보드 단축키 시스템
 * - 편집 모드 전환
 * - 선택 상태 관리
 * 
 * 성능 최적화:
 * - Set 자료구조로 빠른 키 조회
 * - 불필요한 리렌더링 방지
 * - 메모리 누수 방지 (cleanup)
 */

import { useState, useEffect } from 'react';

/**
 * 키보드 상태를 관리하는 커스텀 훅
 * Command/Ctrl 키 상태를 추적하여 Bundle 다중 선택 모드를 감지
 */
export const useKeyboardState = () => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);  // Bundle 다중 선택 모드
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set()); // 현재 눌러진 키들 (Set으로 빠른 조회)

  useEffect(() => {
    /**
     * 키 눌러짐 이벤트 처리
     * Ctrl/Cmd 키 감지로 다중 선택 모드 활성화
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      // 키 상태 업데이트 (Set으로 중복 방지)
      setPressedKeys(prev => new Set([...prev, e.code]));
      
      // Command/Ctrl 키 감지 (크로스 플랫폼 지원)
      if (e.ctrlKey || e.metaKey) {
        setIsMultiSelectMode(true);
        console.log('🔘 다중 선택 모드 활성화:', {
          ctrlKey: e.ctrlKey,     // Windows Ctrl
          metaKey: e.metaKey,     // Mac Cmd
          platform: navigator.platform
        });
      }
    };
    
    /**
     * 키 떼어짐 이벤트 처리
     * 모든 Ctrl/Cmd 키가 떼어졌을 때 모드 비활성화
     */
    const handleKeyUp = (e: KeyboardEvent) => {
      // 키 상태 업데이트 (Set에서 제거)
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.code);
        return newSet;
      });
      
      // Command/Ctrl 키가 모두 떼어졌는지 확인
      if (!e.ctrlKey && !e.metaKey) {
        setIsMultiSelectMode(false);
        console.log('🔘 다중 선택 모드 비활성화');
      }
    };

    /**
     * 윈도우 포커스 해제 시 상태 초기화
     * 다른 애플리케이션으로 전환 시 키 상태 리셋
     */
    const handleWindowBlur = () => {
      setIsMultiSelectMode(false);
      setPressedKeys(new Set());
      console.log('🔘 윈도우 포커스 해제 - 키 상태 초기화');
    };

    // 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  return {
    isMultiSelectMode,                                                      // Bundle 다중 선택 모드 상태
    pressedKeys,                                                            // 현재 눌러진 키 목록
    
    // 유틸리티 함수들 (키 상태 조회)
    isKeyPressed: (keyCode: string) => pressedKeys.has(keyCode),             // 특정 키 눌러짐 여부
    isCtrlPressed: () => pressedKeys.has('ControlLeft') || pressedKeys.has('ControlRight'), // Ctrl 키 눌러짐 여부
    isMetaPressed: () => pressedKeys.has('MetaLeft') || pressedKeys.has('MetaRight'),       // Cmd 키 눌러짐 여부
  };
};

/**
 * Bundle 선택 전용 키보드 훅
 * Bundle 생성을 위한 다중 선택 상태를 관리
 * useKeyboardState를 래핑하여 Bundle 전용 인터페이스 제공
 */
export const useBundleKeyboard = () => {
  const { isMultiSelectMode } = useKeyboardState();
  
  return {
    isBundleSelectionMode: isMultiSelectMode,  // Bundle 다중 선택 모드 (명확한 네이밍)
  };
};
