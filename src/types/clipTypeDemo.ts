// 🧪 3단계 Union 타입 시스템 - 실전 데모
// 새로운 타입 시스템의 장점을 체험할 수 있는 데모 함수들

import { NewTimelineClip } from './clipTypes';
import {
  createAudioClip,
  createVideoClip,
  createTextClip,
  createImageClip,
  validateClip
} from './clipCreators';
import {
  isAudioClip,
  isVideoClip,
  isVisualClip,
  hasAudioProperties,
  getVisualProperties,
  getAudioProperties
} from './clipTypes';

/**
 * 🎯 타입 안전성 데모
 * - 컴파일 타임에 오류를 방지하는 방법 시연
 */
export function demoTypeSafety() {
  console.log('🎯 === Union 타입 안전성 데모 ===');

  // ✅ 올바른 사용법
  const audioClip = createAudioClip({
    mediaId: 'audio-1',
    trackId: 'track-1',
    mediaUrl: '/audio/sample.mp3',
    startTime: 0,
    duration: 10,
    name: '샘플 오디오',
    volume: 0.8
  });

  console.log('✅ AudioClip 생성 완료:', {
    id: audioClip.id,
    name: audioClip.name,
    mediaType: audioClip.mediaType,
    volume: audioClip.volume,
    // audioClip.x  // ❌ 타입스크립트 오류: AudioClip에는 x 속성 없음
  });

  const videoClip = createVideoClip({
    mediaId: 'video-1', 
    trackId: 'track-1',
    mediaUrl: '/video/sample.mp4',
    startTime: 0,
    duration: 15,
    name: '샘플 비디오',
    x: 100,
    y: 100,
    width: 640,
    height: 480,
    volume: 1.0
  });

  console.log('✅ VideoClip 생성 완료:', {
    id: videoClip.id,
    name: videoClip.name,
    mediaType: videoClip.mediaType,
    x: videoClip.x,        // ✅ 시각적 속성 사용 가능
    volume: videoClip.volume  // ✅ 오디오 속성도 사용 가능
  });

  // 🛡️ 타입 가드를 통한 안전한 속성 접근
  const clips: NewTimelineClip[] = [audioClip, videoClip];
  
  clips.forEach(clip => {
    console.log(`📋 클립 분석: ${clip.name} (${clip.mediaType})`);
    
    // ✅ 모든 클립 공통 속성은 항상 접근 가능
    console.log(`  - 시간: ${clip.startTime}~${clip.endTime} (${clip.duration}초)`);
    
    // 🎨 시각적 속성 안전 접근
    if (isVisualClip(clip)) {
      console.log(`  - 위치: (${clip.x}, ${clip.y}) 크기: ${clip.width}x${clip.height}`);
    } else {
      console.log(`  - 시각적 속성 없음 (오디오 전용)`);
    }
    
    // 🎵 오디오 속성 안전 접근
    if (hasAudioProperties(clip)) {
      console.log(`  - 볼륨: ${clip.volume}`);
    } else {
      console.log(`  - 오디오 속성 없음`);
    }
  });
}

/**
 * 🎨 시각적 속성 업데이트 데모
 * - Audio 클립에는 시각적 속성 설정 불가 시연
 */
export function demoVisualPropertiesUpdate() {
  console.log('\n🎨 === 시각적 속성 업데이트 데모 ===');
  
  const audioClip = createAudioClip({
    mediaId: 'audio-demo',
    trackId: 'track-1',
    mediaUrl: '/audio/demo.mp3',
    startTime: 0,
    duration: 5
  });
  
  const textClip = createTextClip({
    mediaId: 'text-demo',
    trackId: 'track-1', 
    text: '안녕하세요!',
    startTime: 0,
    duration: 3
  });

  // 🛡️ 안전한 시각적 속성 업데이트
  function updateClipPosition(clip: NewTimelineClip, x: number, y: number) {
    if (isVisualClip(clip)) {
      // ✅ 시각적 클립인 경우에만 위치 업데이트
      const updatedClip = { ...clip, x, y };
      console.log(`✅ ${clip.name} 위치 업데이트: (${x}, ${y})`);
      return updatedClip;
    } else {
      console.log(`⚠️ ${clip.name}은 Audio 클립이므로 위치 설정 불가`);
      return clip;
    }
  }

  updateClipPosition(audioClip, 100, 100); // ⚠️ 경고 출력
  updateClipPosition(textClip, 200, 200);  // ✅ 정상 업데이트
}

/**
 * 🎵 오디오 속성 업데이트 데모
 * - Image 클립에는 오디오 속성 설정 불가 시연
 */
export function demoAudioPropertiesUpdate() {
  console.log('\n🎵 === 오디오 속성 업데이트 데모 ===');
  
  const imageClip = createImageClip({
    mediaId: 'image-demo',
    trackId: 'track-1',
    mediaUrl: '/images/demo.jpg',
    startTime: 0,
    duration: 5
  });
  
  const videoClip = createVideoClip({
    mediaId: 'video-demo',
    trackId: 'track-1',
    mediaUrl: '/videos/demo.mp4',
    startTime: 0,
    duration: 10
  });

  // 🛡️ 안전한 오디오 속성 업데이트
  function updateClipVolume(clip: NewTimelineClip, volume: number) {
    if (hasAudioProperties(clip)) {
      // ✅ 오디오 속성이 있는 클립만 볼륨 업데이트
      const updatedClip = { ...clip, volume };
      console.log(`✅ ${clip.name} 볼륨 업데이트: ${volume}`);
      return updatedClip;
    } else {
      console.log(`⚠️ ${clip.name}은 오디오 속성이 없어 볼륨 설정 불가`);
      return clip;
    }
  }

  updateClipVolume(imageClip, 0.5); // ⚠️ 경고 출력
  updateClipVolume(videoClip, 0.8); // ✅ 정상 업데이트
}

/**
 * 🔍 클립 분석 및 통계 데모
 * - 타입별 클립 분류 및 속성 분석
 */
export function demoClipAnalysis() {
  console.log('\n🔍 === 클립 분석 및 통계 데모 ===');
  
  // 다양한 클립들 생성
  const clips: NewTimelineClip[] = [
    createAudioClip({
      mediaId: 'audio-1',
      trackId: 'track-1',
      mediaUrl: '/audio/bgm.mp3',
      startTime: 0,
      duration: 30,
      name: '배경음악'
    }),
    createVideoClip({
      mediaId: 'video-1',
      trackId: 'track-1', 
      mediaUrl: '/video/intro.mp4',
      startTime: 0,
      duration: 5,
      name: '인트로 영상'
    }),
    createTextClip({
      mediaId: 'text-1',
      trackId: 'track-2',
      text: '제목 텍스트',
      startTime: 1,
      duration: 3,
      name: '메인 제목'
    }),
    createImageClip({
      mediaId: 'image-1',
      trackId: 'track-2',
      mediaUrl: '/images/logo.png',
      startTime: 5,
      duration: 2,
      name: '로고 이미지'
    })
  ];

  // 📊 클립 통계 분석
  const stats = {
    total: clips.length,
    byType: {
      audio: clips.filter(isAudioClip).length,
      video: clips.filter(isVideoClip).length,
      text: clips.filter(clip => clip.mediaType === 'text').length,
      image: clips.filter(clip => clip.mediaType === 'image').length
    },
    visual: clips.filter(isVisualClip).length,
    withAudio: clips.filter(hasAudioProperties).length
  };

  console.log('📊 클립 통계:', stats);

  // 🎯 타입별 상세 분석
  clips.forEach(clip => {
    console.log(`\n📋 ${clip.name} (${clip.mediaType}) 분석:`);
    
    // ✅ 기본 정보
    console.log(`  - ID: ${clip.id}`);
    console.log(`  - 시간: ${clip.startTime}~${clip.endTime}초`);
    
    // 🎨 시각적 속성 분석
    const visualProps = getVisualProperties(clip);
    if (visualProps) {
      console.log(`  - 위치: (${visualProps.x}, ${visualProps.y})`);
      console.log(`  - 크기: ${visualProps.width}x${visualProps.height}`);
      console.log(`  - 투명도: ${visualProps.opacity}`);
    } else {
      console.log(`  - 시각적 속성: 없음 (오디오 전용)`);
    }
    
    // 🎵 오디오 속성 분석
    const audioProps = getAudioProperties(clip);
    if (audioProps) {
      console.log(`  - 볼륨: ${audioProps.volume || 1.0}`);
      console.log(`  - 재생속도: ${audioProps.playbackRate || 1.0}`);
    } else {
      console.log(`  - 오디오 속성: 없음`);
    }
    
    // 🔍 유효성 검사
    const validation = validateClip(clip);
    console.log(`  - 유효성: ${validation.isValid ? '✅ 유효' : '❌ 오류'}`);
    if (!validation.isValid) {
      console.log(`  - 오류: ${validation.errors.join(', ')}`);
    }
  });
}

/**
 * 🚀 전체 데모 실행
 */
export function runAllDemos() {
  console.log('🚀 === 3단계 Union 타입 시스템 데모 시작 ===\n');
  
  try {
    demoTypeSafety();
    demoVisualPropertiesUpdate();
    demoAudioPropertiesUpdate();
    demoClipAnalysis();
    
    console.log('\n🎉 === 모든 데모 완료! Union 타입 시스템이 정상 작동합니다! ===');
    
    return {
      success: true,
      message: '3단계 Union 타입 시스템이 성공적으로 구현되었습니다!'
    };
  } catch (error) {
    console.error('❌ 데모 실행 중 오류:', error);
    return {
      success: false,
      message: `데모 실행 실패: ${(error as Error).message}`
    };
  }
}

// 🔧 개발 환경에서 자동 데모 실행 (선택적)
if (false && typeof window !== 'undefined') { // 서버 렌더링에서 안전하게 비활성화
  // 브라우저 콘솔에서 수동 실행 가능하도록 글로벌 함수 등록
  (window as any).runUnionTypeDemo = runAllDemos;
  console.log('🧪 Union 타입 데모 사용법: runUnionTypeDemo() 실행');
}
