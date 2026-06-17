/**
 * 📝 clipActions_longsentence_section.ts - LongSentence 클립 섹션 관리 액션
 * 
 * LongSentence 클립의 섹션(구간)별 관리 기능을 제공하는 Zustand 스토어
 * 액션들입니다. LongSentence 클립을 여러 섹션으로 나누어 관리하고,
 * 각 섹션별로 독립적인 편집과 TTS 생성을 지원합니다.
 * 
 * 주요 기능:
 * - LongSentence 클립 섹션 생성/삭제
 * - 섹션별 텍스트 내용 관리
 * - 섹션별 TTS 설정 및 생성
 * - 섹션 간 순서 조정
 * - 섹션별 타이밍 조절
 * 
 * 섹션 시스템:
 * - 긴 텍스트를 논리적 단위로 분할
 * - 각 섹션마다 독립적 TTS 생성
 * - 섹션별 개별 편집 가능
 * - 자동/수동 섹션 분할 지원
 * 
 * 변환 결과 처리:
 * - sentenceClips: 변환된 문장 클립 배열
 * - audioClips: 생성된 오디오 클립 배열  
 * - mediaClips: 연결된 미디어 클립 배열
 * - 서버 응답 데이터 파싱 및 적용
 * 
 * 관련 모듈:
 * - 4번 모듈: Long Sentence Engine (섹션 분할 로직)
 * - 5번 모듈: TTS System (섹션별 TTS 생성)
 * - LongSentenceProperties: UI 컴포넌트 연동
 * - 8번 모듈: State Management (상태 관리)
 */

// LongSentence 변환 결과 처리 부분
// 이 파일은 clipActions.ts의 convertLongSentence 함수에서 사용됩니다

export const processLongSentenceConversionResult = (
  result: any,
  clipId: string,
  clip: any,
  get: any
) => {
  // 서버는 sentenceClips, audioClips, mediaClips 배열로 보냄
  const sentenceClips = result.sentenceClips || [];
  const audioClips = result.audioClips || [];
  const mediaClips = result.mediaClips || [];
  
  const state = get();
  const childClipIds: string[] = [];
  const failedClips: string[] = [];

  console.log('📦 변환 결과 클립들:', {
    sentenceClips: sentenceClips.length,
    audioClips: audioClips.length,
    mediaClips: mediaClips.length,
    첫번째오디오: audioClips[0]
  });

  // 1. Sentence 클립들 처리
  for (const sentenceClip of sentenceClips) {
    sentenceClip.parentClipId = clipId;

    console.log('👶 Sentence 자식 클립 추가:', {
      childId: sentenceClip.id.slice(-8),
      parentId: clipId.slice(-8),
      text: sentenceClip.text?.substring(0, 30) + '...',
      trackId: sentenceClip.trackId,
      baseClipProperties: sentenceClip.baseClipProperties,
      // 🎯 핵심 속성 확인
      coreProperties: {
        x: sentenceClip.x,
        y: sentenceClip.y,
        width: sentenceClip.width,
        height: sentenceClip.height,
        fontSize: sentenceClip.fontSize,
        color: sentenceClip.color,
        backgroundColor: sentenceClip.backgroundColor,
        borderRadius: sentenceClip.borderRadius,
        borderRadiusUnit: sentenceClip.borderRadiusUnit,
        textShadow: sentenceClip.textShadow,
        textShadowColor: sentenceClip.textShadowColor,
        textShadowOffsetX: sentenceClip.textShadowOffsetX,
        textShadowOffsetY: sentenceClip.textShadowOffsetY,
        textShadowBlur: sentenceClip.textShadowBlur,
        paddingTop: sentenceClip.paddingTop,
        paddingRight: sentenceClip.paddingRight,
        paddingBottom: sentenceClip.paddingBottom,
        paddingLeft: sentenceClip.paddingLeft
      },
      // 🎯 Effects 속성 확인
      effects: {
        brightness: sentenceClip.brightness,
        contrast: sentenceClip.contrast,
        saturation: sentenceClip.saturation,
        hue: sentenceClip.hue,
        blur: sentenceClip.blur,
        sepia: sentenceClip.sepia,
        grayscale: sentenceClip.grayscale,
        fadeIn: sentenceClip.fadeIn,
        fadeOut: sentenceClip.fadeOut,
        animationType: sentenceClip.animationType
      }
    });

    try {
      get().addClip(sentenceClip);
      childClipIds.push(sentenceClip.id);
    } catch (error) {
      console.error('❌ Sentence 클립 추가 실패:', error);
      failedClips.push(`Sentence 클립 ${sentenceClip.id.slice(-8)} 추가 실패`);
    }
  }

  // 2. Audio 클립들 처리
  for (const audioClip of audioClips) {
    audioClip.parentClipId = clipId;

    console.log('👶 Audio 자식 클립 추가:', {
      childId: audioClip.id.slice(-8),
      parentId: clipId.slice(-8),
      trackId: audioClip.trackId,
      baseClipProperties: audioClip.baseClipProperties,
      isBaseClip: audioClip.baseClipProperties?.isBaseClip
    });

    try {
      get().addClip(audioClip);
      childClipIds.push(audioClip.id);
    } catch (error) {
      console.error('❌ Audio 클립 추가 실패:', error);
      failedClips.push(`Audio 클립 ${audioClip.id.slice(-8)} 추가 실패`);
    }
  }

  // 3. Media 클립들 처리 (Layer 1 배치 로직 포함)
  for (const mediaClip of mediaClips) {
    mediaClip.parentClipId = clipId;

    // 🎯 PolygonShape 클립의 경우 - 서버에서 이미 완전한 데이터를 보내줌
    if (mediaClip.mediaType === 'polygonShape') {
      // 서버에서 이미 polygonShapeProperties를 설정해서 보내주므로 그대로 사용
      console.log('🎯 PolygonShape 서버 데이터 확인:', {
        clipId: mediaClip.id.slice(-8),
        hasPolygonShapeProperties: !!mediaClip.polygonShapeProperties,
        backgroundImageUrl: mediaClip.polygonShapeProperties?.backgroundImageUrl,
        backgroundFit: mediaClip.polygonShapeProperties?.backgroundFit,
        borderRadius: mediaClip.polygonShapeProperties?.borderRadius,
        shadowEnabled: mediaClip.polygonShapeProperties?.shadowEnabled
      });
    }

    // Layer 1 트랙 찾기 (드로잉 순서가 가장 낮은 트랙)
    let targetTrackId = mediaClip.trackId;
    
    // 서버에서 '__LAYER_1__' 플래그를 보냈으면 Layer 1 트랙 찾기
    if (mediaClip.trackId === '__LAYER_1__') {
      console.log('🔍 Layer 1 트랙 찾기 시작:', {
        총트랙수: state.tracks.length,
        트랙들: state.tracks.map((t: any) => ({ id: t.id, name: t.name, displayName: t.displayName }))
      });
      
      // Layer 1 트랙 찾기 (여러 방법 시도)
      let layer1Track = null;
      
      // 1. displayName이 'Layer 1'인 트랙 찾기
      layer1Track = state.tracks.find((track: any) => 
        track.displayName === 'Layer 1' || 
        track.displayName?.toLowerCase() === 'layer 1'
      );
      
      // 2. name이 'Layer 1'인 트랙 찾기
      if (!layer1Track) {
        layer1Track = state.tracks.find((track: any) => 
          track.name === 'Layer 1' || 
          track.name?.toLowerCase() === 'layer 1'
        );
      }
      
      // 3. track-4 찾기 (Background 트랙)
      if (!layer1Track) {
        layer1Track = state.tracks.find((track: any) => track.id === 'track-4');
      }
      
      // 4. 마지막 트랙 사용 (가장 낮은 드로잉 순서 = Layer 1)
      if (!layer1Track && state.tracks.length > 0) {
        layer1Track = state.tracks[state.tracks.length - 1];
        console.log('⚠️ Layer 1 트랙을 찾지 못해 마지막 트랙 사용 (Layer 1)');
      }
      
      if (layer1Track) {
        targetTrackId = layer1Track.id;
        console.log('🎨 미디어 클립을 Layer 1로 배치:', {
          originalTrackId: clip.trackId,
          layer1TrackId: layer1Track.id,
          layer1TrackName: layer1Track.name,
          layer1DisplayName: layer1Track.displayName,
          찾기방법: layer1Track.displayName?.includes('Layer 1') ? 'displayName' : 
                    layer1Track.name?.includes('Layer 1') ? 'name' : 
                    layer1Track.id === 'track-4' ? 'track-4' : '마지막트랙'
        });
      } else {
        // Layer 1을 찾지 못하면 원본 트랙 사용
        targetTrackId = clip.trackId;
        console.log('❌ Layer 1 트랙을 전혀 찾지 못해 원본 트랙 사용');
      }
    }

    // 실제 트랙 ID로 업데이트
    mediaClip.trackId = targetTrackId;

    console.log('👶 Media 자식 클립 추가:', {
      childId: mediaClip.id.slice(-8),
      parentId: clipId.slice(-8),
      mediaType: mediaClip.mediaType,
      mediaUrl: mediaClip.mediaUrl?.substring(0, 50) + '...',
      trackId: mediaClip.trackId,
      isLayer1: targetTrackId !== clip.trackId,
      // 🎯 Effects 속성 확인
      effects: {
        brightness: mediaClip.brightness,
        contrast: mediaClip.contrast,
        saturation: mediaClip.saturation,
        hue: mediaClip.hue,
        blur: mediaClip.blur,
        sepia: mediaClip.sepia,
        grayscale: mediaClip.grayscale,
        fadeIn: mediaClip.fadeIn,
        fadeOut: mediaClip.fadeOut,
        animationType: mediaClip.animationType
      }
    });

    try {
      get().addClip(mediaClip);
      childClipIds.push(mediaClip.id);
    } catch (error) {
      console.error('❌ Media 클립 추가 실패:', error);
      failedClips.push(`Media 클립 ${mediaClip.id.slice(-8)} 추가 실패`);
    }
  }

  // 4. 결과 검증
  console.log('📊 클립 생성 최종 결과:', {
    부모클립: clipId.slice(-8),
    생성성공: childClipIds.length,
    생성실패: failedClips.length,
    총Sentence: sentenceClips.length,
    총Audio: audioClips.length,
    총Media: mediaClips.length
  });

  // 실패한 클립이 있으면 에러 발생
  if (failedClips.length > 0) {
    const errorMessage = `자식 클립 생성 실패: ${failedClips.join(', ')}`;
    console.error('🚨 LongSentence 변환 부분 실패:', {
      clipId: clipId.slice(-8),
      failedClips: failedClips
    });

    // 변환 상태를 실패로 업데이트
    get().updateLongSentenceConversion(clipId, {
      conversionStatus: 'failed',
      errorMessage: errorMessage
    });

    throw new Error(errorMessage);
  }

  // 5. 부모 클립에 자식 클립 ID들 저장
  console.log('👨‍👩‍👧‍👦 부모-자식 관계 설정:', {
    parentId: clipId.slice(-8),
    childIds: childClipIds.map(id => id.slice(-8))
  });
  
  get().updateClip(clipId, {
    childClipIds: childClipIds
  });

  return {
    childClipIds,
    failedClips
  };
};