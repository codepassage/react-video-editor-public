/**
 * 💾 unsavedActions.ts - 미저장 변경사항 추적 상태 관리
 * 
 * 프로젝트의 저장되지 않은 변경사항을 추적하고 관리하는 Zustand 스토어
 * 슬라이스입니다. 사용자가 프로젝트를 종료하거나 페이지를 벗어날 때
 * 경고를 표시하고, 자동 저장 기능의 기반을 제공합니다.
 * 
 * 주요 기능:
 * - 프로젝트 변경사항 실시간 추적
 * - 마지막 저장 시간 기록
 * - 변경 횟수 카운팅
 * - 미저장 상태 알림
 * - 페이지 이탈 시 경고 표시
 * 
 * 상태 관리:
 * - hasUnsavedChanges: 저장되지 않은 변경사항 존재 여부
 * - lastSavedTime: 마지막으로 저장된 시간 (타임스탬프)
 * - changeCount: 마지막 저장 이후 변경 횟수
 * 
 * 변경 감지 대상:
 * - 클립 추가/삭제/편집
 * - 트랙 구조 변경
 * - Bundle 생성/해제
 * - 프로젝트 설정 변경
 * - 템플릿 그룹 수정
 * 
 * 자동 저장 연동:
 * - 일정 시간 간격으로 자동 저장 트리거
 * - 변경 횟수 임계값 도달 시 저장 권장
 * - 브라우저 종료 시 경고 표시
 * 
 * 관련 모듈:
 * - 8번 모듈: State Management (상태 관리 핵심)
 * - useBeforeUnload: 페이지 이탈 경고 훅
 * - projectActions: 프로젝트 저장 액션
 * - Header: 저장 상태 UI 표시
 */

import { StateCreator } from 'zustand';

export interface UnsavedState {
  hasUnsavedChanges: boolean;
  lastSavedTime: number | null;
  changeCount: number;
}

export interface UnsavedActions {
  markAsChanged: () => void;
  markAsSaved: () => void;
  resetUnsavedState: () => void;
}

export const createUnsavedActions: StateCreator<
  UnsavedState & UnsavedActions,
  [],
  [],
  UnsavedState & UnsavedActions
> = (set, get) => ({
  // 초기 상태
  hasUnsavedChanges: false,
  lastSavedTime: null,
  changeCount: 0,

  // 변경사항 발생 시 호출
  markAsChanged: () => {
    const state = get();
    set({
      hasUnsavedChanges: true,
      changeCount: state.changeCount + 1
    });
    
    console.log('📝 편집 데이터 변경됨 - 저장 필요', {
      changeCount: state.changeCount + 1,
      hasUnsavedChanges: true
    });
  },

  // 저장 완료 시 호출
  markAsSaved: () => {
    set({
      hasUnsavedChanges: false,
      lastSavedTime: Date.now(),
      changeCount: 0
    });
    
    console.log('💾 편집 데이터 저장 완료', {
      savedAt: new Date().toLocaleString(),
      hasUnsavedChanges: false
    });
  },

  // 상태 초기화 (새 프로젝트 등)
  resetUnsavedState: () => {
    set({
      hasUnsavedChanges: false,
      lastSavedTime: null,
      changeCount: 0
    });
    
    console.log('🔄 편집 상태 초기화');
  }
});