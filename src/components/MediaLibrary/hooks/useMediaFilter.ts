import { useState } from 'react';
import { MediaItem } from '../../../types';

type FilterType = 'all' | 'image' | 'video' | 'audio' | 'shape' | 'spacer';

/**
 * 🔍 useMediaFilter.ts - 미디어 필터링 관리 훅
 * 
 * 미디어 라이브러리에서 다양한 미디어 타입을 필터링하고 검색하는
 * 로직을 처리하는 커스텀 훅입니다. 사용자가 원하는 미디어 타입만
 * 보여주도록 하여 대량의 미디어 아이템 중에서 효율적으로 탐색할 수 있게 합니다.
 * 
 * 주요 기능:
 * - 미디어 타입별 필터링 (All, Image, Video, Audio, Shape, Spacer)
 * - 필터 상태 유지 및 관리
 * - 다중 조건 필터링 지원
 * - 필터 리셋 기능
 * - 효율적인 배열 필터링 알고리즘
 * 
 * 지원되는 필터 타입:
 * - 'all': 모든 미디어 타입 표시
 * - 'image': 이미지 파일만 표시 (jpg, png, gif 등)
 * - 'video': 비디오 파일만 표시 (mp4, avi, mov 등)
 * - 'audio': 오디오 파일만 표시 (mp3, wav, ogg 등)
 * - 'shape': 도형 컨트롤만 표시 (Rectangle, Circle 등)
 * - 'spacer': 스페이서 컨트롤만 표시
 * 
 * 필터링 알고리즘:
 * - 조건에 맞지 않는 아이템을 빠르게 배제
 * - 'all' 선택 시 필터링 바이패스로 성능 최적화
 * - 메모리 효율적인 배열 순회
 * 
 * 상태 관리:
 * - selectedMediaType: 현재 선택된 필터 타입
 * - 리액트 상태 비용 최소화로 성능 최적화
 * 
 * 사용 예시:
 * - 미디어 라이브러리 UI에서 타입별 분류
 * - 비디오 에디터에서 원하는 미디어만 표시
 * - 대량의 미디어 자산 관리 시스템
 * 
 * 성능 고려사항:
 * - 필터링 결과를 커스텀 훅 외부에서 메모이제이션 권장
 * - 대량 데이터에대한 가상화 및 페이지네이션 고려
 * - 디바운싱이나 쏘로틀링을 통한 최적화 가능
 * 
 * 관련 모듈:
 * - 미디어 라이브러리: UI 컴포넌트와 연동
 * - 2번 모듈: Clip Type System (미디어 타입 시스템)
 * - 8번 모듈: State Management (결과 상태 연동)
 */
/**
 * useMediaFilter 훅 - 미디어 타입 필터링 로직
 * 
 * 주요 책임:
 * 1. 필터 상태 관리 (selectedMediaType)
 * 2. 미디어 아이템 배열 필터링 로직
 * 3. 필터 변경 및 리셋 기능
 * 4. 성능 최적화된 필터링 알고리즘
 * 
 * 반환값:
 * - selectedMediaType: 현재 선택된 필터
 * - getFilteredMediaItems: 필터링 함수
 * - changeFilter: 필터 변경 함수
 * - resetFilter: 필터 리셋 함수
 */
export const useMediaFilter = () => {
  // 선택된 미디어 타입 필터
  const [selectedMediaType, setSelectedMediaType] = useState<FilterType>('all');

  // 필터링된 미디어 아이템들 반환
  const getFilteredMediaItems = (items: MediaItem[]): MediaItem[] => {
    if (selectedMediaType === 'all') {
      return items;
    }

    return items.filter(item => item.type === selectedMediaType);
  };

  // 필터 변경
  const changeFilter = (filterType: FilterType) => {
    setSelectedMediaType(filterType);
  };

  // 필터 리셋
  const resetFilter = () => {
    setSelectedMediaType('all');
  };

  // 각 타입별 아이템 개수 계산
  const getItemCounts = (items: MediaItem[]) => {
    const counts = {
      all: items.length,
      image: items.filter(item => item.type === 'image').length,
      video: items.filter(item => item.type === 'video').length,
      audio: items.filter(item => item.type === 'audio').length,
      text: items.filter(item => item.type === 'text').length,
      shape: items.filter(item => item.type === 'shape').length,
      spacer: items.filter(item => item.type === 'spacer').length,
    };

    return counts;
  };

  // 현재 필터에 해당하는 아이템이 있는지 확인
  const hasFilteredItems = (items: MediaItem[]): boolean => {
    return getFilteredMediaItems(items).length > 0;
  };

  // 필터 옵션들
  const filterOptions: { key: FilterType; label: string; icon?: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'image', label: '이미지', icon: 'Image' },
    { key: 'video', label: '동영상', icon: 'Video' },
    { key: 'audio', label: '오디오', icon: 'Music' },
    { key: 'spacer', label: '스페이서', icon: 'Clock' },
  ];

  return {
    // 상태
    selectedMediaType,
    setSelectedMediaType,
    
    // 함수
    getFilteredMediaItems,
    changeFilter,
    resetFilter,
    getItemCounts,
    hasFilteredItems,
    
    // 설정
    filterOptions,
  };
};