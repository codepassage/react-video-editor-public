/**
 * 📚 MediaLibrary.tsx - 미디어 라이브러리 통합 관리 컴포넌트
 * 
 * 비디오 에디터의 미디어 자산을 관리하는 종합적인 라이브러리 컴포넌트입니다.
 * 로컬 미디어와 서버 미디어를 통합 관리하며, 다양한 클립 타입의 생성과 타임라인 추가를 담당합니다.
 * 
 * 주요 기능:
 * - 통합 미디어 라이브러리 관리 (로컬/서버)
 * - 다양한 클립 타입 생성 (Text, Sentence, LongSentence, Shape, Spacer)
 * - 파일 업로드 및 드래그앤드롭 지원
 * - 미디어 필터링 및 검색 기능
 * - 실시간 업로드 진행률 표시
 * - 미디어 아이템 타임라인 직접 추가
 * 
 * 클립 생성 시스템:
 * - 각 클립 타입별 전용 생성 함수
 * - 기본값 자동 설정 및 ID 생성
 * - 미디어 아이템과 타임라인 클립 동시 생성
 * - 현재 타임헤드 위치에 자동 배치
 * 
 * 성능 최적화:
 * - 컴포넌트 분리를 통한 재렌더링 최소화
 * - 커스텀 훅을 통한 로직 분리
 * - 지연 로딩을 통한 초기 렌더링 성능 향상
 * - 메모이제이션을 통한 필터링 최적화
 * 
 * 사용 패턴:
 * - 좌측 사이드바에 고정 배치
 * - 탭 기반 미디어 소스 전환 (로컬/서버)
 * - 컨트롤 패널을 통한 빠른 클립 생성
 * - 우클릭을 통한 고급 속성 편집
 * 
 * 특별 고려사항:
 * - 다양한 미디어 형식 지원 (비디오, 오디오, 이미지, 텍스트)
 * - 한글 폰트 시스템과의 연동
 * - 서버 API와의 안정적인 통신
 * - 에러 상태 처리 및 사용자 피드백
 * - Ctrl+클릭을 통한 속성 편집 단축키 지원
 */

import React, { useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { MediaItem, MediaType } from '../types';
// 타입 안전성을 위한 가드 함수들과 유틸리티 함수들 import
import { getDefaultClipName } from '../types/clipCreators';
import { getShapePath } from '../utils/polygonShape.utils';
import { generateId } from '../store/utils/storeUtils';
import { 
  DEFAULT_LONGSENTENCE_DURATION,
  DEFAULT_CLIP_DURATION,
  DEFAULT_TEXT_DURATION,
  DEFAULT_SENTENCE_DURATION,
  DEFAULT_SIMPLESHAPE_DURATION,
  DEFAULT_POLYGONSHAPE_DURATION,
  DEFAULT_SPACER_DURATION
} from '../constants/clipDefaults';

// 분리된 컴포넌트 및 훅들
import { useMediaLibraryMain } from './MediaLibrary/hooks/useMediaLibraryMain';
import { useFileUpload } from './MediaLibrary/hooks/useFileUpload';
import { useMediaFilter } from './MediaLibrary/hooks/useMediaFilter';
import { MediaLibraryHeader } from './MediaLibrary/components/MediaLibraryHeader';
import { FileUploadArea } from './MediaLibrary/components/FileUploadArea';
import { MediaGrid } from './MediaLibrary/components/MediaGrid';


export const MediaLibrary: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    mediaLibraryControls,
    openControlPropertiesPanel,
    addMediaItem,
    addClip,
    tracks,
    currentTime,
  } = useEditorStore();

  // 분리된 훅들 사용
  const {
    activeTab,
    mediaLibrary,
    serverMediaItems,
    isLoadingServerMedia,
    serverMediaError,
    handleTabChange,
    refreshServerMedia,
    addServerMediaToLocal,
    handleRemoveMediaItem,
    getCurrentMediaItems,
  } = useMediaLibraryMain();

  const {
    isUploading,
    uploadError,
    uploadSuccess,
    uploadProgress,
    handleFileUpload,
  } = useFileUpload();

  const {
    selectedMediaType,
    getFilteredMediaItems,
    changeFilter,
  } = useMediaFilter();

  // 현재 탭의 필터링된 미디어 아이템들
  const currentMediaItems = getCurrentMediaItems();
  const filteredItems = getFilteredMediaItems(currentMediaItems);

  // 미디어 아이템을 타임라인에 추가하는 함수
  const handleAddToTimeline = (item: MediaItem) => {
    console.log('🔥 handleAddToTimeline 호출됨:', {
      '아이템': item,
      '트랙스': tracks,
      '현재 시간': currentTime
    });

    const targetTrackId = tracks[0]?.id || 'track-1';
    const startTime = currentTime;

    console.log('📎 미디어 아이템을 타임라인에 추가:', {
      '아이템': item.name,
      '타입': item.type,
      '시작 시간': startTime + 's',
      '타겟 트랙': targetTrackId
    });

    // 미디어 타입에 따른 기본 클립 데이터 생성
    const getClipData = () => {
      const baseData = {
        mediaId: item.id,
        trackId: targetTrackId,
        startTime: startTime,
        endTime: startTime + (item.duration || DEFAULT_CLIP_DURATION), // 기본 duration
        duration: item.duration || DEFAULT_CLIP_DURATION,
        volume: 1,
        playbackRate: 1
      };

      switch (item.type) {
        case 'video':
          return {
            ...baseData,
            mediaType: 'video' as const,
            x: item.x || 0,
            y: item.y || 0,
            width: item.width || 800,
            height: item.height || 600,
            opacity: item.opacity || 1,
            rotation: item.rotation || 0,
          };

        case 'audio':
          return {
            ...baseData,
            mediaType: 'audio' as const,
          };

        case 'image':
          return {
            ...baseData,
            mediaType: 'image' as const,
            x: item.x || 0,
            y: item.y || 0,
            width: item.width || 400,
            height: item.height || 300,
            opacity: item.opacity || 1,
            rotation: item.rotation || 0,
          };

        case 'text':
          return {
            ...baseData,
            mediaType: 'text' as const,
            x: item.x || 200,
            y: item.y || 250,
            width: item.width || 400,
            height: item.height || 100,
            opacity: item.opacity || 1,
            rotation: item.rotation || 0,
            text: item.text || '새 텍스트',
            fontSize: item.fontSize || 32,
            fontFamily: item.fontFamily || 'Arial, sans-serif',
            fontWeight: item.fontWeight || 'normal',
            color: item.color || '#FFFFFF',
            backgroundColor: item.backgroundColor || 'rgba(0, 0, 0, 0)',
            textAlign: item.textAlign || 'center',
            lineHeight: item.lineHeight || 1.2,
          };

        case 'spacer':
          return {
            ...baseData,
            mediaType: 'spacer' as const,
            description: item.description || '타임라인 시간 차지용',
            label: item.label || '스페이서',
            displayColor: item.displayColor || '#808080',
            displayPattern: 'striped' as const,
            purpose: 'timing' as const,
          };

        default:
          return {
            ...baseData,
            mediaType: 'image' as const,
            x: item.x || 0,
            y: item.y || 0,
            width: item.width || 400,
            height: item.height || 300,
            opacity: item.opacity || 1,
            rotation: item.rotation || 0,
          };
      }
    };

    const clipData = getClipData();
    console.log('📎 생성된 클립 데이터:', clipData);

    console.log('🎯 addClip 호출 직전');
    addClip(clipData);
    console.log('✅ addClip 호출 완료');
  };

  // ✅ Text 클립 추가 함수
  const handleAddText = () => {
    const { tracks, addClip, currentTime } = useEditorStore.getState();
    const targetTrackId = tracks[0]?.id || 'track-1';

    // 현재 시간에서 Text 클립 생성
    const startTime = currentTime;

    console.log('📝 Text 클립 추가:', {
      '시작 시간': startTime + 's',
      '타겟 트랙': targetTrackId
    });

    // 📝 Text 미디어 아이템 생성
    const textItem: MediaItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      name: getDefaultClipName('text'), // 🆕 기본 이름 생성
      x: 200,
      y: 250,
      width: 400,
      height: 100,
      opacity: 1,
      rotation: 0,
      text: '새 텍스트',
      fontSize: 32,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      textAlign: 'center',
      lineHeight: 1.2
    };

    addMediaItem(textItem);

    setTimeout(() => {
      addClip({
        mediaId: textItem.id,
        trackId: targetTrackId,
        startTime: startTime,
        endTime: startTime + DEFAULT_TEXT_DURATION, // 기본 duration
        duration: DEFAULT_TEXT_DURATION,
        mediaType: 'text',
        x: 200,
        y: 250,
        width: 400,
        height: 100,
        opacity: 1,
        rotation: 0,
        text: '새 텍스트',
        fontSize: 32,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        textAlign: 'center',
        lineHeight: 1.2,
        volume: 1,
        playbackRate: 1
      });
    }, 50);
  };

  // 🔷 PolygonShape 추가 함수
  const handleAddPolygonShape = () => {
    const { tracks, addClip, currentTime } = useEditorStore.getState();
    const targetTrackId = tracks[0]?.id || 'track-1';

    // 현재 시간에서 PolygonShape 클립 생성
    const startTime = currentTime;

    console.log('🔷 PolygonShape 추가:', {
      '시작 시간': startTime + 's',
      '타겟 트랙': targetTrackId
    });

    // 기본 도형 타입과 색상
    const defaultShapeType = 'rectangle';
    const defaultColor = '#3b82f6';

    // SVG 생성 함수
    const createPolygonSVG = () => {
      const path = getShapePath(defaultShapeType, 400, 300);
      const svg = `
        <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <path d="${path}" fill="${defaultColor}" stroke="none"/>
        </svg>
      `;

      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      return URL.createObjectURL(svgBlob);
    };

    const defaultSVGUrl = createPolygonSVG();

    console.log('🔷 PolygonShape 기본 SVG 생성:', {
      '도형 타입': defaultShapeType,
      '색상': defaultColor,
      'Blob URL': defaultSVGUrl.substring(0, 50) + '...'
    });

    // 🔷 PolygonShape 미디어 아이템 생성
    const polygonShapeItem: MediaItem = {
      id: `polygonShape-${Date.now()}`,
      type: 'image', // ❗ 중요: 미디어 아이템은 'image' 타입
      name: getDefaultClipName('polygonShape'), // 🆕 기본 이름 생성
      width: 400,
      height: 300,
      // 기본 속성
      x: 300,
      y: 200,
      opacity: 1,
      rotation: 0,
      // ✅ 기본 SVG URL 설정
      url: defaultSVGUrl
    };

    addMediaItem(polygonShapeItem);

    // 타임라인에 PolygonShape 클립 추가
    setTimeout(() => {
      const clipData = {
        mediaId: polygonShapeItem.id,
        trackId: targetTrackId,
        startTime: startTime,
        endTime: startTime + DEFAULT_POLYGONSHAPE_DURATION, // 기본 duration
        duration: DEFAULT_POLYGONSHAPE_DURATION,
        mediaType: 'polygonShape' as const, // ❗ 중요: polygonShape 타입
        x: 300,
        y: 200,
        width: 400,
        height: 300,
        opacity: 1,
        rotation: 0,
        volume: 1,
        playbackRate: 1,
        // ❗ 중요: PolygonShape 기본 속성 설정
        polygonShapeProperties: {
          shapeType: defaultShapeType,
          backgroundType: 'color' as const,
          backgroundColor: defaultColor,
          backgroundFit: 'fill',
          backgroundPosition: 'center',
          borderRadius: 0
        },
        // ✅ 기본 SVG URL 설정
        mediaUrl: defaultSVGUrl
      };

      console.log('🔷 PolygonShape 클립 데이터:', clipData);

      addClip(clipData);
    }, 50);
  };

  // 🧪 SimpleShape 추가 함수
  const handleAddSimpleShape = () => {
    const { tracks, addClip, currentTime } = useEditorStore.getState();
    const targetTrackId = tracks[0]?.id || 'track-1';

    // 현재 시간에서 SimpleShape 클립 생성
    const startTime = currentTime;

    console.log('🧪 SimpleShape 추가:', {
      '시작 시간': startTime + 's',
      '타겟 트랙': targetTrackId
    });

    // 1x1 픽셀 기본 색상 이미지 생성
    const defaultColor = '#3b82f6';
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = defaultColor;
      ctx.fillRect(0, 0, 1, 1);
    }
    const defaultColorImageUrl = canvas.toDataURL();

    console.log('🎨 SimpleShape 기본 색상 이미지 생성:', {
      '색상': defaultColor,
      'Data URL': defaultColorImageUrl.substring(0, 50) + '...'
    });

    // 🧪 SimpleShape 미디어 아이템 생성
    const simpleShapeItem: MediaItem = {
      id: `simpleShape-${Date.now()}`,
      type: 'image', // ❗ 중요: 미디어 아이템은 'image' 타입
      name: getDefaultClipName('simpleShape'), // 🆕 기본 이름 생성
      width: 200,
      height: 150,
      // 기본 속성
      x: 250,
      y: 175,
      opacity: 1,
      rotation: 0,
      // ✅ 기본 색상 이미지 URL 설정
      url: defaultColorImageUrl
    };

    addMediaItem(simpleShapeItem);

    // 타임라인에 SimpleShape 클립 추가
    setTimeout(() => {
      const clipData = {
        mediaId: simpleShapeItem.id,
        trackId: targetTrackId,
        startTime: startTime,
        endTime: startTime + DEFAULT_SIMPLESHAPE_DURATION, // 기본 duration
        duration: DEFAULT_SIMPLESHAPE_DURATION,
        mediaType: 'simpleShape' as const, // ❗ 중요: simpleShape 타입
        x: 250,
        y: 175,
        width: 200,
        height: 150,
        opacity: 1,
        rotation: 0,
        volume: 1,
        playbackRate: 1,
        // ❗ 중요: SimpleShape 기본 속성 설정
        simpleShapeProperties: {
          backgroundColor: defaultColor,
          borderRadius: 0,
          borderWidth: 0,
          borderColor: 'transparent'
        },
        // ✅ 기본 색상 이미지 URL 설정
        mediaUrl: defaultColorImageUrl
      };

      console.log('🧪 SimpleShape 클립 데이터:', clipData);

      addClip(clipData);
    }, 50);
  };

  // ⏸️ Spacer 클립 추가 함수
  const handleAddSpacer = () => {
    const { tracks, addClip, currentTime } = useEditorStore.getState();
    const targetTrackId = tracks[0]?.id || 'track-1';

    // 현재 시간에서 Spacer 클립 생성
    const startTime = currentTime;

    console.log('⏸️ Spacer 추가:', {
      '시작 시간': startTime + 's',
      '타겟 트랙': targetTrackId
    });

    // ⏸️ Spacer 미디어 아이템 생성
    const spacerItem: MediaItem = {
      id: `spacer-${Date.now()}`,
      type: 'spacer', // ❗ 중요: Spacer 전용 타입
      name: getDefaultClipName('spacer'), // 🆕 기본 이름 생성
      // ⏸️ Spacer는 시각적 속성 없음 (width, height, x, y 등 제외)
      // ⏸️ Spacer만의 기본 속성
      description: '타임라인 시간 차지용',
      label: '스페이서',
      displayColor: '#808080',
      displayPattern: 'striped',
      purpose: 'timing'
    };

    addMediaItem(spacerItem);

    // 타임라인에 Spacer 클립 추가
    setTimeout(() => {
      const clipData = {
        mediaId: spacerItem.id,
        trackId: targetTrackId,
        startTime: startTime,
        endTime: startTime + DEFAULT_SPACER_DURATION, // 기본 duration
        duration: DEFAULT_SPACER_DURATION,
        mediaType: 'spacer' as const, // ❗ 중요: spacer 타입
        // ⏸️ 스페이서 전용 속성
        description: '타임라인 시간 차지용',
        label: '스페이서',
        displayColor: '#808080',
        displayPattern: 'striped' as const,
        purpose: 'timing' as const,
        notes: '3초 간격 스페이서'
        // 🚫 시각적 속성 없음 (x, y, width, height, opacity 등)
        // 🚫 오디오 속성 없음 (volume, playbackRate 등)
        // 🚫 mediaUrl 없음
      };

      console.log('⏸️ Spacer 클립 데이터:', clipData);

      addClip(clipData);
    }, 50);
  };

  // ✅ Sentence 클립 추가 함수
  const handleAddSentence = () => {
    const { tracks, addClip, currentTime } = useEditorStore.getState();
    const targetTrackId = tracks[0]?.id || 'track-1';

    // 현재 시간에서 Sentence 클립 생성
    const startTime = currentTime;

    console.log('📄 Sentence 클립 추가:', {
      '시작 시간': startTime + 's',
      '타겟 트랙': targetTrackId
    });

    // 📄 Sentence 미디어 아이템 생성
    const sentenceItem: MediaItem = {
      id: `sentence-${Date.now()}`,
      type: 'text',
      name: getDefaultClipName('sentence'),
      x: 200,
      y: 250,
      width: 400,
      height: 100,
      opacity: 1,
      rotation: 0,
      text: '새 Sentence 클립',
      fontSize: 32,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      textAlign: 'center',
      lineHeight: 1.2
    };

    addMediaItem(sentenceItem);

    setTimeout(() => {
      addClip({
        mediaId: sentenceItem.id,
        trackId: targetTrackId,
        startTime: startTime,
        endTime: startTime + DEFAULT_SENTENCE_DURATION,
        duration: DEFAULT_SENTENCE_DURATION,
        mediaType: 'sentence',
        x: 200,
        y: 250,
        width: 400,
        height: 100,
        opacity: 1,
        rotation: 0,
        text: '새 Sentence 클립',
        fontSize: 32,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        textAlign: 'center',
        lineHeight: 1.2,
        textSegments: [],
        segmentOverlapMode: 'overwrite',
        enableRealTimePreview: true
      });

      console.log('✅ Sentence 클립 생성 완료');
    }, 100);
  };

  // ✅ LongSentence 클립 추가 함수
  const handleAddLongSentence = () => {
    const { tracks, addClip, currentTime } = useEditorStore.getState();
    const targetTrackIndex = 0; // 첫 번째 트랙에 추가

    if (tracks.length === 0) {
      console.warn('트랙이 없습니다.');
      return;
    }

    const targetTrackId = tracks[targetTrackIndex].id;
    const startTime = currentTime;

    console.log('📖 LongSentence 클립 추가:', {
      '시작 시간': startTime + 's',
      '타겟 트랙 인덱스': targetTrackIndex,
      '타겟 트랙 ID': targetTrackId
    });

    // 미디어 아이템 생성
    const longSentenceItem: MediaItem = {
      id: generateId(),
      name: 'LongSentence 클립',
      type: 'longsentence' as MediaType,
      url: '',
      duration: DEFAULT_LONGSENTENCE_DURATION
    };

    addMediaItem(longSentenceItem);

    // LongSentence 클립 생성 및 추가
    setTimeout(() => {
      addClip({
        mediaId: longSentenceItem.id,
        trackId: targetTrackId,
        startTime: startTime,
        endTime: startTime + DEFAULT_LONGSENTENCE_DURATION,
        duration: DEFAULT_LONGSENTENCE_DURATION,
        mediaType: 'longsentence',
        x: 100,
        y: 100,
        width: 800,
        height: 100,
        opacity: 1,
        rotation: 0,
        // 새로운 데이터 구조
        data: [
          {
            text: '',
            mediaUrl: ''
          }
        ],
        maxWordsPerSentence: 15,
        splitOnPunctuation: true,
        generateTTS: true,
        generateText: true,
        generateSubtitles: true,
        language: 'ko',
        voice: 'ko-KR-Standard-A',
        conversionStatus: 'pending',
        conversionProgress: 0,
        generatedClips: [],
        autoConvertOnEdit: false,
        preserveOriginal: false,
        childClipIds: [],
        mediaProperties: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          opacity: 1.0,
          rotation: 0,
          volume: 1.0,
          playbackRate: 1.0,
        },
      });

      console.log('✅ LongSentence 클립 생성 완료');
    }, 100);
  };

  // 컨트롤 클릭 핸들러
  const handleControlClick = (control: any, e: React.MouseEvent) => {
    e.preventDefault();

    // Ctrl+클릭이면 속성 편집
    if (e.ctrlKey || e.metaKey) {
      openControlPropertiesPanel(control.id);
      return;
    }

    switch (control.id) {
      case 'upload':
      case 'control-upload':
        fileInputRef.current?.click();
        break;
      case 'text':
      case 'control-text':
        handleAddText();
        break;
      case 'sentence':
      case 'control-sentence':
        handleAddSentence();
        break;
      case 'longSentence':
      case 'control-longSentence':
        handleAddLongSentence();
        break;
      case 'simpleShape':
      case 'control-simpleShape':
        handleAddSimpleShape();
        break;
      case 'polygonShape':
      case 'control-polygonShape':
        handleAddPolygonShape();
        break;
      case 'spacer':
      case 'control-spacer':
        handleAddSpacer();
        break;
      default:
        console.warn('Unknown control:', control.id);
    }
  };

  // 컨트롤 우클릭 핸들러
  const handleControlRightClick = (control: any, e: React.MouseEvent) => {
    e.preventDefault();
    openControlPropertiesPanel(control.id);
  };

  // 파일 업로드 핸들러
  const handleFileUploadEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(
      e.target.files,
      (items: MediaItem[]) => {
        console.log('업로드 완료:', items);
      },
      () => {
        refreshServerMedia();
      }
    );
  };


  return (
    <>
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)',
        boxShadow: '2px 0 20px rgba(0, 0, 0, 0.2)',
      }}>
        {/* 헤더 */}
        <MediaLibraryHeader
          activeTab={activeTab}
          selectedMediaType={selectedMediaType}
          onTabChange={handleTabChange}
          onFilterChange={changeFilter}
        />

        {/* 업로드 영역 */}
        <FileUploadArea
          activeTab={activeTab}
          isUploading={isUploading}
          uploadError={uploadError}
          uploadSuccess={uploadSuccess}
          uploadProgress={uploadProgress}
          serverMediaError={serverMediaError}
          isLoadingServerMedia={isLoadingServerMedia}
          onRefreshServerMedia={refreshServerMedia}
          onFileUpload={handleFileUploadEvent}
          mediaLibraryControls={mediaLibraryControls}
          onControlClick={handleControlClick}
          onControlRightClick={handleControlRightClick}
          onOpenControlPropertiesPanel={openControlPropertiesPanel}
          fileInputRef={fileInputRef}
        />

        {/* 미디어 그리드 */}
        <MediaGrid
          activeTab={activeTab}
          filteredItems={filteredItems}
          localMediaItems={mediaLibrary}
          serverMediaItems={serverMediaItems}
          isLoadingServerMedia={isLoadingServerMedia}
          onRemoveMediaItem={handleRemoveMediaItem}
          onAddServerMediaToLocal={addServerMediaToLocal}
          onAddToTimeline={handleAddToTimeline}
        />
      </div>
    </>
  );
};