/**
 * 🛠️ storeUtils.ts - Zustand 스토어 유틸리티 함수 모음
 * 
 * Zustand 상태 관리에서 공통적으로 사용되는 유틸리티 함수들을 제공하는
 * 파일입니다. ID 생성, 초기 데이터 생성, 데이터 변환 등의 헬퍼 함수들을
 * 중앙 집중식으로 관리하여 코드 재사용성을 높입니다.
 * 
 * 주요 기능:
 * - 고유 ID 생성 (타임스탬프 + 랜덤)
 * - 초기 트랙 구조 생성
 * - 기본 트랙 설정 및 구성
 * - 데이터 검증 및 변환
 * - 스토어 간 공통 로직 제공
 * 
 * ID 생성 시스템:
 * - 타임스탬프 기반 고유성 보장
 * - 36진법 랜덤 문자열 추가
 * - 충돌 방지를 위한 이중 보안
 * - 디버깅 친화적인 형식
 * 
 * 초기 데이터 생성:
 * - 기본 트랙 구조 설정
 * - 트랙 이름 및 높이 기본값
 * - 빈 클립 리스트 초기화
 * - 일관된 데이터 구조 보장
 * 
 * 관련 모듈:
 * - 8번 모듈: State Management (Zustand 스토어 핵심)
 * - editorStore: 중앙 상태 관리
 * - 모든 스토어 액션들: 공통 유틸리티 사용
 * - types: 타입 정의 및 기본값
 */

import {
  TimelineTrack,
  DEFAULT_TRACK_HEIGHT,
  getDefaultTrackName,
  type BaseTrack
} from '../../types';

// ID 생성 유틸리티
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 초기 트랙 생성
export const createInitialTracks = (): TimelineTrack[] => [
  {
    id: 'track-1',
    name: 'track-1', // 내부 로직용 ID
    displayName: getDefaultTrackName(0), // 'Track 1'
    clips: [],
    isLocked: false,
    isVisible: true,
    height: DEFAULT_TRACK_HEIGHT
  },
  {
    id: 'track-2',
    name: 'track-2', // 내부 로직용 ID
    displayName: getDefaultTrackName(1), // 'Track 2'
    clips: [],
    isLocked: false,
    isVisible: true,
    height: DEFAULT_TRACK_HEIGHT
  },
  {
    id: 'track-3',
    name: 'track-3', // 내부 로직용 ID
    displayName: getDefaultTrackName(2), // 'Base Track 1'
    clips: [],
    isLocked: false,
    isVisible: true,
    height: DEFAULT_TRACK_HEIGHT,
    // 🎯 기준트랙 속성 추가
    isBaseTrack: true,
    baseClips: []
  } as BaseTrack, // BaseTrack 타입으로 캐스팅
  {
    id: 'track-4',
    name: 'track-4', // 내부 로직용 ID
    displayName: getDefaultTrackName(3), // 'Background 1'
    clips: [],
    isLocked: false,
    isVisible: true,
    height: DEFAULT_TRACK_HEIGHT
  }
];

// 미디어 라이브러리 컨트롤 버튼 설정
export interface MediaLibraryControl {
  id: string;
  type: 'sample' | 'upload' | 'text' | 'sentence' | 'longSentence' | 'spacer' | 'simpleShape' | 'polygonShape' | 'custom';
  label: string;
  icon: string;
  color: string;
  gradient: string;
  borderColor: string;
  shadowColor: string;
  isEnabled: boolean;
  customAction?: string;
}

// 기본 미디어 라이브러리 컨트롤 생성
export const createDefaultMediaLibraryControls = (): MediaLibraryControl[] => [
  {
    id: 'control-sample',
    type: 'sample',
    label: '테스트용 샘플 추가',
    icon: '🚀',
    color: '#ffffff',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderColor: 'rgba(102, 126, 234, 0.4)',
    shadowColor: 'rgba(102, 126, 234, 0.3)',
    isEnabled: true
  },
  {
    id: 'control-upload',
    type: 'upload',
    label: 'Upload Files',
    icon: '📁',
    color: '#ffffff',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    borderColor: 'rgba(79, 172, 254, 0.4)',
    shadowColor: 'rgba(79, 172, 254, 0.3)',
    isEnabled: true
  },
  {
    id: 'control-text',
    type: 'text',
    label: 'Add Text',
    icon: '🅰️',
    color: '#2c3e50',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    borderColor: 'rgba(168, 237, 234, 0.4)',
    shadowColor: 'rgba(168, 237, 234, 0.3)',
    isEnabled: true
  },
  {
    id: 'control-sentence',
    type: 'sentence',
    label: 'Sentence',
    icon: '📄',
    color: '#ffffff',
    gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 50%, #e1bee7 100%)',
    borderColor: 'rgba(156, 39, 176, 0.4)',
    shadowColor: 'rgba(156, 39, 176, 0.3)',
    isEnabled: true
  },
  {
    id: 'control-longSentence',
    type: 'longSentence',
    label: 'Long Sentence',
    icon: '📖',
    color: '#ffffff',
    gradient: 'linear-gradient(135deg, #607d8b 0%, #78909c 50%, #90a4ae 100%)',
    borderColor: 'rgba(96, 125, 139, 0.4)',
    shadowColor: 'rgba(96, 125, 139, 0.3)',
    isEnabled: true
  },
  {
    id: 'control-spacer',
    type: 'spacer',
    label: 'Spacer',
    icon: '⏸️',
    color: '#ffffff',
    gradient: 'linear-gradient(135deg, #607d8b 0%, #78909c 50%, #90a4ae 100%)',
    borderColor: 'rgba(96, 125, 139, 0.4)',
    shadowColor: 'rgba(96, 125, 139, 0.3)',
    isEnabled: true
  },
  {
    id: 'control-simpleShape',
    type: 'simpleShape',
    label: '🧪 Simple Shape',
    icon: '🧪',
    color: '#ffffff',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)',
    borderColor: 'rgba(255, 107, 107, 0.4)',
    shadowColor: 'rgba(255, 107, 107, 0.3)',
    isEnabled: true
  },
  {
    id: 'control-polygonShape',
    type: 'polygonShape',
    label: 'PolygonShape',
    icon: '🔷',
    color: '#ffffff',
    gradient: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
    borderColor: 'rgba(103, 58, 183, 0.4)',
    shadowColor: 'rgba(103, 58, 183, 0.3)',
    isEnabled: true
  }
];
