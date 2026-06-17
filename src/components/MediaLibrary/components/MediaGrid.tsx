/**
 * 🎦 MediaGrid.tsx - 미디어 그리드 뷰 컴포넌트
 * 
 * 미디어 라이브러리의 미디어 아이템들을 그리드 형태로 표시하는 컴포넌트입니다.
 * 로컬 및 서버 탭을 모두 지원하며, 다양한 미디어 타입의
 * 아이템들을 통일된 인터페이스로 관리하고 사용자 인터랙션을 처리합니다.
 * 
 * 주요 기능:
 * - 로컬과 서버 미디어 아이템 통합 표시
 * - 그리드 레이아웃으로 시각적 미디어 브라우징
 * - 다양한 미디어 타입 지원 (이미지, 비디오, 오디오)
 * - 아이템별 인터랙션 기능 (삭제, 추가, 타임라인 삽입)
 * - 서버 미디어의 로컬 복사 기능
 * - 로딩 상태 및 빈 상태 UI
 * 
 * 데이터 소스:
 * - filteredItems: 현재 표시되는 아이템 목록 (필터링 적용)
 * - localMediaItems: 로컬에 저장된 미디어 아이템
 * - serverMediaItems: 서버에 업로드된 미디어 아이템
 * 
 * 탭 관리:
 * - 'local': 로컬 미디어 아이템들 표시
 * - 'server': 서버 미디어 아이템들 표시
 * 
 * 인터랙션:
 * - onRemoveMediaItem: 로컬 아이템 삭제
 * - onAddServerMediaToLocal: 서버 아이템을 로컬로 복사
 * - onAddToTimeline: 아이템을 타임라인에 직접 추가
 * 
 * UI 구성:
 * - 반응형 그리드 레이아움
 * - 엄축 사이즈 및 텍스트 너브레이킹
 * - 텍스트 오버플로우 처리
 * - 로딩 스하이너 및 빈 상태 메시지
 * 
 * 성능 최적화:
 * - MediaLibraryItem 컴포넌트로 위임 (메모이제이션 가능)
 * - 가상화 대비 준비 (대량 미디어 처리용)
 * - 비동기 로딩 상태 처리
 * 
 * 관련 모듈:
 * - 미디어 라이브러리 시스템 (전체 미디어 관리)
 * - 8번 모듈: State Management (미디어 상태 연동)
 * - 1번 모듈: Timeline System (타임라인 삽입)
 * - 2번 목듈: Clip Type System (미디어 타입 처리)
 */
import React from 'react';
import { MediaItem } from '../../../types';
import { MediaLibraryItem } from './MediaLibraryItem';

type TabType = 'local' | 'server';

interface MediaGridProps {
  activeTab: TabType;
  filteredItems: MediaItem[];
  localMediaItems: MediaItem[];
  serverMediaItems: MediaItem[];
  isLoadingServerMedia: boolean;
  onRemoveMediaItem: (itemId: string) => void;
  onAddServerMediaToLocal: (item: MediaItem) => void;
  onAddToTimeline: (item: MediaItem) => void;
}

/**
 * MediaGrid 컴포넌트 - 미디어 아이템 그리드 렌더링
 * 
 * 주요 책임:
 * 1. 탭별 미디어 아이템 리스트 표시
 * 2. 그리드 레이아웃 관리 및 반응형 디자인
 * 3. 로딩 및 빈 상태 UI 처리
 * 4. 각 아이템의 인터랙션 이벤트 전파
 * 5. 서버와 로컬 데이터 통합 표시
 * 
 * 렌더링 로직:
 * - activeTab에 따라 filteredItems 또는 전체 리스트 표시
 * - 빈 상태: 데이터가 없을 때 안내 메시지 표시
 * - 로딩 상태: 서버 데이터 로딩 중 스페이너 표시
 * - 각 아이템을 MediaLibraryItem으로 렌더링
 * 
 * 성능 고려사항:
 * - key prop으로 React 리렌더링 최적화
 * - 조건부 렌더링으로 불필요한 DOM 업데이트 방지
 * - 그리드 레이아웃으로 대량 데이터 효율적 표시
 */
export const MediaGrid: React.FC<MediaGridProps> = ({
  activeTab,
  filteredItems,
  localMediaItems,
  serverMediaItems,
  isLoadingServerMedia,
  onRemoveMediaItem,
  onAddServerMediaToLocal,
  onAddToTimeline
}) => {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }}>
      {/* 미디어 그리드 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.4) 0%, rgba(22, 33, 62, 0.4) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        minHeight: '200px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'start'
        }}>
          {/* 로딩 상태 */}
          {isLoadingServerMedia && activeTab === 'server' && (
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(100, 181, 246, 0.3)',
                  borderTop: '2px solid #64b5f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                서버 미디어 불러오는 중...
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {!isLoadingServerMedia && filteredItems.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '16px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                opacity: 0.5
              }}>
                📁
              </div>
              <div style={{ marginBottom: '8px' }}>
                {activeTab === 'local' ? '로컬 미디어가 없습니다' : '서버 미디어가 없습니다'}
              </div>
              <div style={{
                fontSize: '14px',
                opacity: 0.7,
                lineHeight: '1.5'
              }}>
                {activeTab === 'local' 
                  ? '위의 버튼을 사용하여 미디어를 추가하세요'
                  : '서버에 미디어 파일을 업로드하거나 새로고침 버튼을 클릭하세요'
                }
              </div>
            </div>
          )}

          {/* 미디어 아이템들 */}
          {!isLoadingServerMedia && filteredItems.map((item) => (
            <MediaLibraryItem
              key={item.id}
              item={item}
              onDelete={activeTab === 'local' ? () => onRemoveMediaItem(item.id) : undefined}
              onAddToLocal={activeTab === 'server' ? () => onAddServerMediaToLocal(item) : undefined}
              onAddToTimeline={onAddToTimeline}
              isServerItem={activeTab === 'server'}
            />
          ))}
        </div>
      </div>

      {/* 디버그 정보 */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(26, 26, 46, 0.6) 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'monospace'
        }}>
          {activeTab === 'local' ? (
            <>
              미디어 {filteredItems.length}개 |
              텍스트 {localMediaItems.filter(item => item.type === 'text').length}개 |
              이미지 {localMediaItems.filter(item => item.type === 'image').length}개 |
              동영상 {localMediaItems.filter(item => item.type === 'video').length}개 |
              오디오 {localMediaItems.filter(item => item.type === 'audio').length}개
            </>
          ) : (
            <>
              서버 미디어 {filteredItems.length}개 |
              이미지 {serverMediaItems.filter(item => item.type === 'image').length}개 |
              동영상 {serverMediaItems.filter(item => item.type === 'video').length}개 |
              오디오 {serverMediaItems.filter(item => item.type === 'audio').length}개
            </>
          )}
        </div>
      </div>
    </div>
  );
};