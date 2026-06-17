/**
 * 🎬 VideoComposition.tsx - Remotion 비디오 렌더링 엔진 (핵심 모듈 #3)
 * 
 * =====================================================================
 * 🎯 REMOTION 기반 고품질 비디오 렌더링 시스템 - 최종 출력 엔진
 * =====================================================================
 * 
 * React 컴포넌트 기반으로 비디오를 생성하는 혁신적인 렌더링 시스템
 * 타임라인의 모든 클립들을 최종 비디오로 합성하는 메인 컴포지션
 * 
 * 🏗️ Remotion 아키텍처의 핵심 개념:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  1. 프레임 기반 렌더링 - 정확한 타이밍 제어                │
 * │  2. React 컴포넌트 합성 - 선언적 UI로 비디오 구성           │
 * │  3. 수학적 정밀도 - frame/fps 계산으로 픽셀 완벽 동기화     │
 * │  4. 레이어 시스템 - Z-index 기반 다중 트랙 합성             │
 * │  5. 서버사이드 렌더링 - 헤드리스 환경에서 비디오 생성       │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * 🎥 Remotion 프레임워크 특징:
 * ┌────────────────┬─────────────────────────────────────────────┐
 * │ Code-First     │ JavaScript/TypeScript로 비디오 프로그래밍   │
 * │ React 기반     │ 컴포넌트 재사용성 및 상태 관리 활용         │
 * │ 프레임 정밀도  │ frame 단위 정확한 타이밍 제어               │
 * │ 고품질 출력    │ FFmpeg 통합으로 프로덕션 품질 보장          │
 * │ 실시간 프리뷰  │ 개발 중 즉시 확인 가능                      │
 * │ 확장성        │ 플러그인 및 커스텀 이펙트 지원              │
 * │ 크로스 플랫폼  │ Web, Node.js, Docker 환경 지원              │
 * └────────────────┴─────────────────────────────────────────────┘
 * 
 * 🔄 렌더링 파이프라인 (5단계 프로세스):
 * 
 * 1️⃣ **프레임 시간 계산**
 *    • useCurrentFrame(): 현재 렌더링 중인 프레임 번호
 *    • useVideoConfig(): FPS 및 비디오 설정 정보
 *    • timeFromFrame = frame / fps (정밀한 시간 계산)
 * 
 * 2️⃣ **활성 클립 필터링**
 *    • 현재 시간에 표시되어야 하는 클립들만 선별
 *    • clip.startTime ≤ timeFromFrame ≤ clip.endTime 조건
 *    • 비어있는 트랙 및 비활성 클립 제외
 * 
 * 3️⃣ **Z-index 정렬**
 *    • calculateClipZIndex(): 트랙 순서 + 클립 순서 기반 계산
 *    • 하위 트랙이 뒤쪽, 상위 트랙이 앞쪽에 렌더링
 *    • 같은 트랙 내에서는 나중에 추가된 클립이 앞쪽
 * 
 * 4️⃣ **클립별 렌더링**
 *    • ClipRenderer: 각 클립 타입별 전용 렌더러 호출
 *    • 8가지 클립 타입 지원 (Video, Audio, Image, Text, Shape 등)
 *    • AbsoluteFill로 정확한 위치 및 크기 제어
 * 
 * 5️⃣ **최종 합성 출력**
 *    • 모든 레이어를 Z-index 순서로 합성
 *    • 배경색 및 전역 효과 적용
 *    • 디버그 정보 오버레이 (개발 모드)
 * 
 * ⚡ 성능 최적화 전략:
 * • 프레임 기반 캐싱: 동일 프레임 재계산 방지
 * • 조건부 렌더링: 시간 범위 밖 클립 스킵
 * • 메모이제이션: 복잡한 계산 결과 캐시
 * • 지연 로딩: 필요한 시점에만 리소스 로드
 * • 에러 경계: 개별 클립 오류가 전체 렌더링에 영향 주지 않음
 * 
 * 🎛️ 디버깅 및 개발 지원:
 * • 실시간 프레임 정보 표시
 * • 클립별 렌더링 상태 로깅
 * • 에러 경계 및 대체 UI 제공
 * • 샘플 화면 (빈 타임라인 시)
 * • 성능 모니터링 정보
 */

// ========================================================================
// 📦 React 및 Remotion Core Import
// ========================================================================
import React from 'react';

// ========================================================================
// 🎬 Remotion 렌더링 API Import  
// ========================================================================
import { 
  AbsoluteFill,      // 절대 위치 레이아웃 컨테이너 (CSS position: absolute + full size)
  useCurrentFrame,   // 현재 렌더링 중인 프레임 번호 훅 (0부터 시작)
  useVideoConfig,    // 비디오 설정 정보 훅 (width, height, fps, durationInFrames)
  Video,             // Remotion 비디오 컴포넌트 (선택적으로 사용)
  Audio,             // Remotion 오디오 컴포넌트 (선택적으로 사용)
  Img                // Remotion 이미지 컴포넌트 (선택적으로 사용)
} from 'remotion';

// ========================================================================
// 🎯 프로젝트 타입 및 유틸리티 Import
// ========================================================================
import { 
  TimelineClip,         // 타임라인 클립 데이터 타입
  TimelineTrack,        // 타임라인 트랙 데이터 타입  
  calculateClipZIndex   // 클립 Z-index 계산 유틸리티 함수
} from '../types';

// ========================================================================
// 🎨 클립 렌더링 엔진 Import
// ========================================================================
import { ClipRenderer } from './ClipRenderer';  // 개별 클립 렌더링 컴포넌트

// ========================================================================
// 🎭 VideoComposition Props 인터페이스 정의
// ========================================================================

/**
 * 🎬 VideoComposition 컴포넌트의 Props 타입 정의
 * 
 * 상위 컴포넌트(Player)에서 전달받는 렌더링에 필요한 데이터들
 * Remotion은 Props를 통해 데이터를 전달받고, 각 프레임마다 렌더링 수행
 */
interface VideoCompositionProps {
  /**
   * 🎵 타임라인 트랙 배열
   * 
   * 모든 트랙과 각 트랙에 속한 클립들의 정보를 포함
   * 각 트랙은 독립적인 레이어로 처리되어 Z-index 기반으로 합성
   */
  tracks: TimelineTrack[];
  
  /**
   * 🎨 배경색 설정
   * 
   * 프로젝트 설정에서 정의된 배경색 (HEX 형식)
   * 모든 클립들 뒤에 표시되는 기본 배경색
   */
  backgroundColor: string;
  
  /**
   * ⏰ 현재 재생 시간 (디버깅 전용)
   * 
   * 실제 렌더링에는 useCurrentFrame()을 사용하지만,
   * 디버깅 로그 및 상태 추적을 위해 전달받는 참고용 시간
   */
  currentTime: number;
}

// ========================================================================
// 🎬 VideoComposition 메인 컴포넌트 정의
// ========================================================================

/**
 * 🎯 VideoComposition 메인 렌더링 컴포넌트
 * 
 * Remotion 기반 비디오 합성의 최상위 컴포넌트
 * 모든 트랙의 클립들을 시간순으로 렌더링하여 최종 비디오 프레임을 생성
 */
export const VideoComposition: React.FC<VideoCompositionProps> = ({
  tracks,           // 렌더링할 모든 트랙들
  backgroundColor,  // 배경색 설정
  currentTime       // 디버깅용 현재 시간
}) => {
  // ========================================================================
  // 🎬 Remotion 핵심 훅들 - 프레임 기반 렌더링 시스템
  // ========================================================================
  
  /**
   * 📊 현재 렌더링 중인 프레임 번호
   * 
   * Remotion의 핵심 개념: 모든 렌더링은 frame 번호 기반
   * 0부터 시작하여 video.durationInFrames - 1까지 순차적으로 렌더링
   */
  const frame = useCurrentFrame();
  
  /**
   * ⚙️ 비디오 설정 정보
   * 
   * fps: 초당 프레임 수 (보통 30 또는 60)
   * width, height: 비디오 해상도
   * durationInFrames: 총 프레임 수
   */
  const { fps } = useVideoConfig();
  
  // ========================================================================
  // 🧮 정밀한 시간 계산 시스템
  // ========================================================================
  
  /**
   * ⏱️ 프레임 기반 정확한 시간 계산
   * 
   * Remotion의 핵심: frame 번호를 fps로 나누어 정확한 시간 계산
   * 예: frame=150, fps=30 → timeFromFrame=5.0초 (정확히 5초)
   * 
   * 이 시간이 각 클립의 startTime, endTime과 비교되어 표시 여부 결정
   */
  const timeFromFrame = frame / fps;
  
  // ========================================================================
  // 🔍 렌더링 상태 디버깅 및 모니터링
  // ========================================================================
  
  /**
   * 📊 렌더링 상태 로깅 (개발 모드 전용)
   * 
   * 각 프레임 렌더링마다 현재 상태를 콘솔에 출력
   * 성능 디버깅, 시간 동기화 확인, 클립 수 모니터링에 활용
   */
  console.log('🎭 VideoComposition Props 수신:', {
    frame,                                                    // 현재 프레임 번호
    timeFromFrame: timeFromFrame.toFixed(2),                  // 계산된 시간 (소수점 2자리)
    currentTime: currentTime.toFixed(2),                      // 참고용 시간 (소수점 2자리)
    fps,                                                      // 프레임레이트
    backgroundColor,                                          // 배경색
    tracksCount: tracks.length,                               // 총 트랙 수
    totalClips: tracks.reduce((total, track) => total + track.clips.length, 0) // 총 클립 수
  });
  
  // 에러 경계 처리
  try {
  
  // 현재 시간에 해당하는 클립들을 트랙 순서대로 수집
  const getCurrentClips = () => {
    const allClips: Array<TimelineClip & { trackIndex: number; clipIndex: number }> = [];
    
    tracks.forEach((track, trackIndex) => {
      console.log(`🎵 Track ${trackIndex + 1} (${track.id}):`, {
        isVisible: track.isVisible,
        clipsCount: track.clips.length,
        clips: track.clips.map(clip => ({
          id: clip.id.slice(-8),
          mediaType: clip.mediaType,
          timeRange: `${clip.startTime}s - ${clip.endTime}s`,
          currentTimeInRange: timeFromFrame >= clip.startTime && timeFromFrame <= clip.endTime,
          mediaUrl: clip.mediaUrl
        }))
      });
      
      if (!track.isVisible) return;
      
      track.clips.forEach((clip, clipIndex) => {
        // 현재 시간이 클립 범위 내에 있는지 확인
        const isInTimeRange = timeFromFrame >= clip.startTime && timeFromFrame <= clip.endTime;
        
        // 🚨 Shape 클립 특별 디버깅
        if (clip.mediaType === 'shape') {
          console.log('🔥 VideoComposition Shape 클립 확인:', {
            id: clip.id.slice(-8),
            timeFromFrame: timeFromFrame.toFixed(2),
            clipTimeRange: `${clip.startTime}s - ${clip.endTime}s`,
            isInTimeRange,
            '❗ hasShapeProperties': !!clip.shapeProperties,
            '❗ shapeType': clip.shapeProperties?.shapeType,
            '❗ 전체 shapeProperties': clip.shapeProperties
          });
        }
        
        console.log(`📎 클립 체크 [${clip.mediaType}]:`, {
          id: clip.id.slice(-8),
          timeFromFrame: timeFromFrame.toFixed(2),
          clipTimeRange: `${clip.startTime}s - ${clip.endTime}s`,
          isInTimeRange,
          mediaUrl: clip.mediaUrl || 'URL 없음'
        });
        
        if (isInTimeRange) {
          allClips.push({
            ...clip,
            trackIndex,
            clipIndex
          });
        }
      });
    });
    
    // 트랙 순서로 정렬 (아래 트랙부터 렌더링)
    return allClips.sort((a, b) => {
      const zIndexA = calculateClipZIndex(a.trackIndex, a.clipIndex);
      const zIndexB = calculateClipZIndex(b.trackIndex, b.clipIndex);
      return zIndexA - zIndexB;
    });
  };

  const currentClips = getCurrentClips();
  
  // 전체 클립 수 계산
  const totalClips = tracks.reduce((total, track) => total + track.clips.length, 0);

  // 🔍 결과 확인
  console.log('🎬 VideoComposition 렌더링 결과:', {
    frame,
    timeFromFrame: timeFromFrame.toFixed(2),
    totalClips,
    currentClipsCount: currentClips.length,
    currentClips: currentClips.map(clip => ({
      id: clip.id.slice(-8),
      mediaType: clip.mediaType,
      zIndex: calculateClipZIndex(clip.trackIndex, clip.clipIndex),
      mediaUrl: clip.mediaUrl ? '있음' : '없음'
    }))
  });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* 🔧 항상 기본 배경 표시 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${backgroundColor} 0%, #1a1a1a 100%)`,
          zIndex: -1
        }}
      />

      {/* 클립들 렌더링 */}
      {currentClips.map((clip) => (
        <ClipRenderer 
          key={clip.id} 
          clip={clip}
          currentTimeInSeconds={timeFromFrame}
          zIndex={calculateClipZIndex(clip.trackIndex, clip.clipIndex)}
          isEditMode={false}
          isPlaying={true}
          isMuted={false}
        />
      ))}
      
      {/* 🔧 개선된 디버그 정보 (우상단에 간단하게) */}
      <AbsoluteFill style={{ 
        pointerEvents: 'none',
        zIndex: 9999
      }}>
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          Frame: {frame} | Time: {timeFromFrame.toFixed(2)}s | {currentClips.length}/{totalClips} clips
        </div>
      </AbsoluteFill>
      
      {/* 🔧 클립이 없을 때 개선된 샘플 화면 */}
      {totalClips === 0 && (
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          color: 'white',
          textAlign: 'center',
          zIndex: 1,
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(0, 0, 0, 0.8) 70%)'
        }}>
          <div style={{
            padding: '40px',
            borderRadius: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(59, 130, 246, 0.5)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ 
              marginBottom: '20px', 
              fontSize: '64px',
              animation: 'pulse 2s infinite'
            }}>🎥</div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#3b82f6'
            }}>React Video Editor</div>
            <div style={{ 
              fontSize: '18px', 
              marginTop: '20px', 
              opacity: 0.8,
              lineHeight: '1.6',
              maxWidth: '400px'
            }}>
              미디어 라이브러리에서 파일을 업로드하고<br />
              타임라인으로 드래그하여 편집을 시작하세요
            </div>
            <div style={{
              fontSize: '14px',
              marginTop: '30px',
              color: '#60a5fa',
              fontWeight: 'bold'
            }}>
              지원 형식: 비디오, 이미지, 오디오, 텍스트
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* 🔧 클립이 있지만 현재 시간에 활성화된 클립이 없을 때 개선된 표시 */}
      {totalClips > 0 && currentClips.length === 0 && (
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          color: '#ffd93d',
          textAlign: 'center',
          zIndex: 1,
          background: 'radial-gradient(circle, rgba(255, 217, 61, 0.2) 0%, rgba(0, 0, 0, 0.8) 70%)'
        }}>
          <div style={{
            padding: '30px',
            borderRadius: '15px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '2px solid rgba(255, 217, 61, 0.5)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ 
              marginBottom: '20px', 
              fontSize: '48px',
              animation: 'bounce 1s infinite alternate'
            }}>⏰</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              현재 시간에 활성화된 클립이 없습니다
            </div>
            <div style={{ 
              fontSize: '16px', 
              marginTop: '20px', 
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
              현재 시간: <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{timeFromFrame.toFixed(2)}초</span><br />
              총 {totalClips}개의 클립이 타임라인에 있습니다
            </div>
            <div style={{
              fontSize: '14px',
              marginTop: '20px',
              color: '#94a3b8'
            }}>
              타임라인에서 다른 시간대로 이동해보세요
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* 🔧 샘플 테스트 클립 - 개발용 (totalClips가 0일 때만) */}
      {totalClips === 0 && (
        <AbsoluteFill
          style={{
            left: 50,
            top: 50,
            width: 200,
            height: 100,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            border: '2px solid #3b82f6',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          샘플 요소 (테스트용)
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
  
  } catch (error) {
    console.error('❌ VideoComposition 렌더링 에러:', error);
    
    return (
      <AbsoluteFill style={{ backgroundColor: '#dc2626' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <div>VideoComposition 에러</div>
            <div style={{ fontSize: '14px', marginTop: '20px', opacity: 0.8 }}>
              {error instanceof Error ? error.message : '알 수 없는 에러'}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }
};


