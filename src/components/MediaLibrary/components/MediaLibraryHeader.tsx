/**
 * 🏷️ MediaLibraryHeader.tsx - 미디어 라이브러리 헤더 컴포넌트
 * 
 * 미디어 라이브러리의 상단 헤더 영역으로, 탭 전환과 미디어 타입 필터링을
 * 담당하는 컴포넌트입니다. 사용자가 로컬과 서버 미디어를 전환하고
 * 원하는 미디어 타입만 필터링하여 볼 수 있도록 직관적인 인터페이스를 제공합니다.
 * 
 * 주요 기능:
 * - 로컬/서버 탭 전환 기능
 * - 미디어 타입별 필터링 (All, Image, Video, Audio, Shape, Spacer)
 * - 현재 선택된 탭과 필터의 시각적 하이라이트
 * - 각 타입별 아이콘과 라벨로 직관적 사용자 경험
 * - 그리디언트 배경과 블러 효과로 현대적 UI
 * 
 * 탭 시스템:
 * - 'local': 로컬 브라우저에 저장된 미디어 파일
 * - 'server': 서버에 업로드된 미디어 파일
 * 
 * 필터 시스템:
 * - 'all': 모든 미디어 타입 표시
 * - 'image': 이미지 파일만 표시
 * - 'video': 비디오 파일만 표시
 * - 'audio': 오디오 파일만 표시
 * - 'shape': 도형 컨트롤만 표시
 * - 'spacer': 스페이서 컨트롤만 표시
 * 
 * UI 디자인:
 * - 그리디언트 배경과 블러 효과
 * - 호버 상태와 선택 상태의 시각적 구분
 * - 반응형 디자인 (다양한 화면 크기 지원)
 * - 색상 코드는 브랜드 아이덴티티와 일치
 * 
 * 상태 관리:
 * - 부모 컴포넌트에서 전달받은 상태 사용
 * - 콜백 함수로 상위 컴포넌트에 변경사항 전달
 * - 제어되는 컴포넌트 패턴 사용
 * 
 * 관련 모듈:
 * - 미디어 라이브러리 시스템 (전체 미디어 관리)
 * - 2번 모듈: Clip Type System (미디어 타입 연동)
 * - 8번 모듈: State Management (상태 관리)
 */
import React from 'react';
import { HardDrive, Server, Image, Video, Music } from 'lucide-react';

type TabType = 'local' | 'server';
type FilterType = 'all' | 'image' | 'video' | 'audio' | 'shape' | 'spacer';

interface MediaLibraryHeaderProps {
  activeTab: TabType;
  selectedMediaType: FilterType;
  onTabChange: (tab: TabType) => void;
  onFilterChange: (filter: FilterType) => void;
}

/**
 * MediaLibraryHeader 컴포넌트 - 탭 및 필터 컨트롤 UI
 * 
 * 주요 책임:
 * 1. 로컬/서버 탭 전환 인터페이스 제공
 * 2. 미디어 타입 필터 인터페이스 제공
 * 3. 현재 선택 상태의 시각적 피드백
 * 4. 사용자 인터랙션 이벤트 전파
 * 5. 일관된 브랜드 UI 디자인 제공
 * 
 * 렌더링 구조:
 * - 제목 영역 (미디어 라이브러리 라벨)
 * - 탭 전환 버튼 (로컬/서버)
 * - 필터 버튼 그룹 (미디어 타입별)
 * 
 * 인터랙션 디자인:
 * - 호버 효과로 사용자 피드백
 * - 선택 상태 시각적 하이라이트
 * - 매끄럽고 직관적인 전환 애니메이션
 */
export const MediaLibraryHeader: React.FC<MediaLibraryHeaderProps> = ({
  activeTab,
  selectedMediaType,
  onTabChange,
  onFilterChange
}) => {
  return (
    <div style={{
      padding: '16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
      backdropFilter: 'blur(10px)'
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#ffffff',
        margin: '0 0 16px 0',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        background: 'linear-gradient(135deg, #64b5f6 0%, #2196f3 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Media Library
      </h2>

      {/* 탭 선택 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <button
          onClick={() => onTabChange('local')}
          style={{
            flex: 1,
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === 'local' ? '2px solid #2196f3' : '1px solid rgba(255, 255, 255, 0.2)',
            background: activeTab === 'local'
              ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.3) 0%, rgba(100, 181, 246, 0.3) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'local' ? '#64b5f6' : 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: activeTab === 'local' ? '600' : '400'
          }}
        >
          <HardDrive size={16} />
          로컬 미디어
        </button>
        <button
          onClick={() => onTabChange('server')}
          style={{
            flex: 1,
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === 'server' ? '2px solid #2196f3' : '1px solid rgba(255, 255, 255, 0.2)',
            background: activeTab === 'server'
              ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.3) 0%, rgba(100, 181, 246, 0.3) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'server' ? '#64b5f6' : 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: activeTab === 'server' ? '600' : '400'
          }}
        >
          <Server size={16} />
          서버 미디어
        </button>
      </div>

      {/* 미디어 타입 필터 - 서버 탭에서만 표시 */}
      {activeTab === 'server' && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '12px',
          padding: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => onFilterChange('all')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: selectedMediaType === 'all'
                ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.3) 0%, rgba(233, 30, 99, 0.3) 100%)'
                : 'transparent',
              color: selectedMediaType === 'all' ? '#e91e63' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              fontWeight: selectedMediaType === 'all' ? '600' : '400'
            }}
          >
            전체
          </button>
          <button
            onClick={() => onFilterChange('image')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: selectedMediaType === 'image'
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(129, 199, 132, 0.3) 100%)'
                : 'transparent',
              color: selectedMediaType === 'image' ? '#81c784' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              fontWeight: selectedMediaType === 'image' ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Image size={14} />
            이미지
          </button>
          <button
            onClick={() => onFilterChange('video')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: selectedMediaType === 'video'
                ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.3) 0%, rgba(100, 181, 246, 0.3) 100%)'
                : 'transparent',
              color: selectedMediaType === 'video' ? '#64b5f6' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              fontWeight: selectedMediaType === 'video' ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Video size={14} />
            동영상
          </button>
          <button
            onClick={() => onFilterChange('audio')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: selectedMediaType === 'audio'
                ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.3) 0%, rgba(124, 77, 255, 0.3) 100%)'
                : 'transparent',
              color: selectedMediaType === 'audio' ? '#b39ddb' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              fontWeight: selectedMediaType === 'audio' ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Music size={14} />
            오디오
          </button>

        </div>
      )}
    </div>
  );
};