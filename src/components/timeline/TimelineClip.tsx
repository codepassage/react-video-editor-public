/**
 * 🎬 TimelineClip.tsx - 개별 클립 컴포넌트
 * 
 * 타임라인 상의 개별 미디어 클립을 렌더링하고 상호작용을 처리하는 핵심 컴포넌트
 * 8가지 클립 타입을 지원하며 드래그앤드롭, 리사이징, 연결관계 등을 관리
 * 
 * 지원하는 클립 타입:
 * - 🎵 AudioClip: 오디오 전용 클립
 * - 🎬 VideoClip: 비디오 + 오디오 클립
 * - 🖼️ ImageClip: 이미지 클립
 * - 📝 TextClip: 단순 텍스트 클립
 * - 📄 SentenceClip: 세그먼트 기반 문장 클립
 * - 📖 LongSentenceClip: 긴 문장 자동 분할 클립
 * - 🔶 ShapeClip: 기본 도형 클립
 * - 🔷 PolygonShapeClip: 복잡한 다각형 클립
 * 
 * 주요 기능:
 * - 드래그앤드롭 이동 (Bundle 내부 순서 변경 지원)
 * - 좌우 끝점 리사이징
 * - Base Clip 시각적 구분 (오렌지 그래디언트)
 * - 번들 선택 모드 지원 (Command+Click)
 * - 연결관계 정렬 및 연결 끊기
 * - 컨텍스트 메뉴 (우클릭)
 * - 실시간 재생 진행률 표시
 * 
 * Base Clip 시스템:
 * - 프로젝트의 기준이 되는 특별한 클립들
 * - 다른 클립들의 동기화 앵커 포인트 역할
 * - 충돌 검사를 통해 겹침 방지
 * - 오렌지/골드 색상으로 시각적 구분
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Image, Video, Music, Type, X, Shapes, FileText } from 'lucide-react';
import { TimelineClip as ClipType, NewTimelineClip, MIN_CLIP_DURATION, isBaseClip, disconnectClipAnchors, alignClipStart, alignClipEnd, alignClipBoth, ClipAlignmentResult, SelectedElement, checkBaseClipOverlap, hasAudioProperties, isAudioClip, isVideoClip, isTextClip, isImageClip, hasTextProperties, isSentenceClip, getEffectiveStartAnchor, getEffectiveEndAnchor } from '../../types';
import { getClipDisplayName } from '../../types/clipUtils';
import { useEditorStore } from '../../store/editorStore';
import { useBundleKeyboard } from '../../hooks/useKeyboardState';

interface TimelineClipProps {
  clip: NewTimelineClip;  // 🆕 Union 타입 적용
  zoom: number;
  trackHeight: number;
  isTrackLocked: boolean;
  isGrouped?: boolean; // 그룹화된 클립인지 표시
  scrollLeft: number; // 드래그 중 스냅 계산용
}

export const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  zoom,
  trackHeight,
  isTrackLocked,
  isGrouped = false, // 그룹화된 클립인지 표시
  scrollLeft
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'left' | 'right' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const {
    updateClip,
    removeClip,
    selectClips,
    selectedClips,
    setCurrentTime,
    setIsPlaying,
    currentTime,
    selectClip,
    openPropertiesPanel,
    setClipDragging,
    setClipResizing,
    tracks,
    getClipById, // Bundle 순서 변경에 필요
    // Bundle 관련
    pendingBundleSelection,
    toggleBundleElementSelection,
    clearBundleSelection,
    // 템플릿과 번들 데이터
    templateGroups,
    bundles
  } = useEditorStore();

  // 모든 클립 가져오기 (기준클립 충돌 검사용)
  const getAllClips = useCallback(() => {
    return tracks.flatMap(track => track.clips);
  }, [tracks]);

  // Bundle 키보드 상태
  const { isBundleSelectionMode } = useBundleKeyboard();

  const isSelected = selectedClips.includes(clip.id);
  const isBaseClipValue = isBaseClip(clip);

  // 🔍 기준클립 판단 디버깅 로그
  React.useEffect(() => {
    if (clip.mediaType === 'audio') { // 오디오 클립에 대해서만 로그 출력
      console.log('🔍 클립 기준성 검사:', {
        clipId: clip.id.slice(-8),
        clipName: clip.name,
        mediaType: clip.mediaType,
        trackId: clip.trackId,
        isBaseClipValue,
        baseClipProperties: clip.baseClipProperties,
        regularClipProperties: clip.regularClipProperties,
        예상색상: isBaseClipValue ? '오렌지' : '보라색'
      });
    }
  }, [clip.id, isBaseClipValue, clip.baseClipProperties, clip.mediaType]);

  // Bundle 선택 상태 확인
  const isBundleSelected = pendingBundleSelection.some(element => {
    if (clip.templateGroupId) {
      return element.type === 'templateGroup' && element.id === clip.templateGroupId;
    } else if (isBaseClipValue) {
      return element.type === 'baseClip' && element.id === clip.id;
    }
    return false;
  });

  // 🆕 새로운 유틸리티 함수 사용 (name 속성 우선 지원)
  const displayName = getClipDisplayName(clip);

  // Option 키 상태를 저장할 state
  const [dragStartOptionPressed, setDragStartOptionPressed] = useState(false);

  // 마우스다운 핸들러 - Option 키 상태 캡처
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isOptionPressed = e.altKey;
    setDragStartOptionPressed(isOptionPressed);
    
    console.log('🎯 드래그 시작 - Option 키 상태 캡처:', {
      clipId: clip.id.slice(-8),
      optionPressed: isOptionPressed
    });
  }, [clip.id]);

  // 드래그 설정 - 🎯 Bundle 클립은 Bundle 내에서만 드래그 가능
  const [{ isDragging }, drag, preview] = useDrag({
    type: clip.bundleId ? 'bundleElement' : 'clip', // Bundle 요소는 다른 타입
    item: (monitor) => {
      if (!isSelected) {
        selectClip(clip.id);
      }

      // 🎯 드래그 시작 상태 설정
      setClipDragging(true, clip.id);

      console.log('🎯 클립 드래그 시작:', {
        clipId: clip.id.slice(-8),
        clipStartTime: clip.startTime.toFixed(2),
        clipDuration: clip.duration.toFixed(2),
        isBundled: !!clip.bundleId,
        bundleId: clip.bundleId?.slice(-8) || 'none',
        dragType: clip.bundleId ? 'bundleElement' : 'clip',
        optionKeyPressed: dragStartOptionPressed
      });

      return {
        type: clip.bundleId ? 'bundleElement' : 'clip',
        clipId: clip.id,
        originalStartTime: clip.startTime,
        originalTrackId: clip.trackId,
        clipWidth: clip.duration * zoom,
        clipHeight: trackHeight - 6,
        isBundled: !!clip.bundleId,
        bundleId: clip.bundleId,
        elementType: 'baseClip', // Bundle 요소 타입
        optionKeyPressed: dragStartOptionPressed // 드래그 시작시 캡처된 Option 키 상태
      };
    },
    canDrag: !isTrackLocked && !isResizing && !isGrouped, // 템플릿 그룹화된 클립만 드래그 불가 (Bundle은 허용)
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // 🎯 드래그 종료 상태 설정
      setClipDragging(false, null);

      const dropResult = monitor.getDropResult();
      console.log('🎯 클립 드래그 종료:', {
        clipId: clip.id.slice(-8),
        dropSuccess: dropResult?.success || false
      });

      if (!dropResult || !dropResult.success) {
        console.log('🔄 드롭 실패 - 원래 위치 유지');
      }
    }
  });

  // Bundle 내부 순서 변경을 위한 드롭 영역
  const [{ isDropTarget }, drop] = useDrop({
    accept: 'bundleElement',
    drop: (item: any, monitor) => {
      if (item.clipId === clip.id) return { success: false }; // 자기 자신에게 드롭 불가

      // 같은 Bundle에 속한 요소들만 순서 변경 가능
      if (item.bundleId && clip.bundleId && item.bundleId === clip.bundleId) {
        console.log('🔄 Bundle 내부 순서 변경:', {
          draggedClipId: item.clipId.slice(-8),
          targetClipId: clip.id.slice(-8),
          bundleId: clip.bundleId.slice(-8)
        });

        // Bundle 내부 순서 변경 로직 호출
        const { reorderBundleElements } = useEditorStore.getState();
        const draggedClip = getClipById(item.clipId);

        if (draggedClip) {
          // 현재 Bundle 내 요소들 가져오기
          const { getBundleElements } = useEditorStore.getState();
          const { baseClips } = getBundleElements(clip.bundleId);

          // 시간 순서로 정렬
          const sortedElements = baseClips.sort((a, b) => a.startTime - b.startTime);

          // 드래그된 요소와 타겟 요소의 인덱스 찾기
          const draggedIndex = sortedElements.findIndex(el => el.id === item.clipId);
          const targetIndex = sortedElements.findIndex(el => el.id === clip.id);

          if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
            // 새로운 순서 배열 생성
            const newOrder = [...sortedElements];
            const [movedElement] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, movedElement);

            // 순서 재배열 실행
            reorderBundleElements(clip.bundleId, newOrder.map(el => ({
              id: el.id,
              type: 'baseClip' as const
            })));
          }
        }

        return { success: true };
      }

      return { success: false };
    },
    collect: (monitor) => ({
      isDropTarget: monitor.isOver() && monitor.canDrop(),
    }),
  });

  // React DnD 기본 드래그 프리뷰 비활성화
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Bundle 요소에만 드롭 영역과 드래그 연결
  const combinedRef = clip.bundleId ? (node: any) => {
    drag(node);
    drop(node);
  } : drag;

  // 클립 스타일 계산
  const clipLeft = clip.startTime * zoom;
  const clipWidth = clip.duration * zoom;
  const clipHeight = trackHeight - 6;

  // 🎯 Union 타입 기반 향상된 아이콘 선택
  const getIcon = () => {
    const iconProps = { size: 16, style: { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' } };
    
    // 🎵 Audio 클립 - 오디오 전용 최적화
    if (isAudioClip(clip)) {
      return <Music {...iconProps} />;
    }
    
    // 🎬 Video 클립 - 시각적 + 오디오
    if (isVideoClip(clip)) {
      return <Video {...iconProps} />;
    }
    
    // 🖼️ Image 클립 - 시각적 전용
    if (isImageClip(clip)) {
      return <Image {...iconProps} />;
    }
    
    // 📝 Text 클립 - 텍스트 최적화
    if (isTextClip(clip)) {
      return <Type {...iconProps} />;
    }
    
    // 📄 Sentence 클립 - 세그먼트 텍스트
    if (isSentenceClip(clip)) {
      return <span style={{ fontSize: '16px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>📄</span>;
    }
    
    // 📖 LongSentence 클립 - 긴 텍스트 자동 분할
    if (clip.mediaType === 'longsentence') {
      return <FileText {...iconProps} />;
    }
    
    // 🔶 Shape 클립들
    if (clip.mediaType === 'shape' || clip.mediaType === 'simpleShape' || clip.mediaType === 'polygonShape') {
      return <Shapes {...iconProps} />;
    }
    
    // 기본값
    return <Music {...iconProps} />;
  };

  // 🎨 개선된 클립 스타일 정의
  const getClipStyle = () => {
    const baseStyle = {
      left: `${clipLeft}px`,
      width: `${clipWidth}px`,
      height: `${clipHeight}px`,
      top: '3px',
      minWidth: `${MIN_CLIP_DURATION * zoom}px`,
      position: 'absolute' as const,
      borderRadius: '8px',
      cursor: isTrackLocked ? 'not-allowed' : isGrouped ? 'default' : (clip.bundleId ? 'move' : 'pointer'), // Bundle 클립은 이동 커서
      userSelect: 'none' as const,
      overflow: 'hidden',
      transition: isDragging ? 'none' : 'all 0.3s ease',
      zIndex: isDragging ? 1000 : (isSelected ? 10 : 1),
      transform: isDragging 
        ? 'scale(1.05) rotate(1deg)' // 드래그 중에는 스냅 오프셋 제거 (프리뷰에서 처리)
        : isHovered 
        ? 'scaleY(1.1)' 
        : 'scale(1)',
      opacity: isDragging ? 0.3 : isTrackLocked ? 0.6 : isGrouped ? 0.7 : 1, // 그룹화된 클립은 약간 투명
      pointerEvents: isGrouped ? 'none' : 'auto' // 템플릿 그룹화된 클립만 마우스 이벤트 차단
    };

    // 미디어 타입별 그래디언트 스타일 (기준클립 시각적 구분 포함)
    const gradients = {
      image: {
        background: isBaseClipValue
          ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd23f 100%)' // 기준클립: 주황색 그래디언트
          : 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)',
        border: isBundleSelected
          ? '3px dashed #FFD700' // Bundle 선택 시: 금색 점선 테두리
          : isBaseClipValue
            ? '3px solid rgba(255, 107, 53, 0.8)' // 기준클립: 두꺼운 테두리
            : '2px solid rgba(76, 175, 80, 0.6)',
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)'
          : isSelected
            ? '0 0 0 3px rgba(255, 255, 255, 0.8), 0 8px 25px rgba(76, 175, 80, 0.4)'
            : isDragging
              ? '0 12px 40px rgba(76, 175, 80, 0.5)'
              : isHovered
                ? '0 6px 20px rgba(76, 175, 80, 0.3)'
                : '0 2px 8px rgba(76, 175, 80, 0.2)'
      },
      video: {
        background: isBaseClipValue
          ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd23f 100%)'
          : 'linear-gradient(135deg, #2196f3 0%, #42a5f5 50%, #64b5f6 100%)',
        border: isBundleSelected
          ? '3px dashed #FFD700'
          : isBaseClipValue
            ? '3px solid rgba(255, 107, 53, 0.8)'
            : '2px solid rgba(33, 150, 243, 0.6)',
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)'
          : isSelected
            ? '0 0 0 3px rgba(255, 255, 255, 0.8), 0 8px 25px rgba(33, 150, 243, 0.4)'
            : isDragging
              ? '0 12px 40px rgba(33, 150, 243, 0.5)'
              : isHovered
                ? '0 6px 20px rgba(33, 150, 243, 0.3)'
                : '0 2px 8px rgba(33, 150, 243, 0.2)'
      },
      audio: {
        background: isBaseClipValue
          ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd23f 100%)'
          : 'linear-gradient(135deg, #9c27b0 0%, #ab47bc 50%, #ba68c8 100%)',
        border: isBundleSelected
          ? '3px dashed #FFD700'
          : isBaseClipValue
            ? '3px solid rgba(255, 107, 53, 0.8)'
            : '2px solid rgba(156, 39, 176, 0.6)',
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)'
          : isSelected
            ? '0 0 0 3px rgba(255, 255, 255, 0.8), 0 8px 25px rgba(156, 39, 176, 0.4)'
            : isDragging
              ? '0 12px 40px rgba(156, 39, 176, 0.5)'
              : isHovered
                ? '0 6px 20px rgba(156, 39, 176, 0.3)'
                : '0 2px 8px rgba(156, 39, 176, 0.2)'
      },
      text: {
        background: isBaseClipValue
          ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd23f 100%)'
          : 'linear-gradient(135deg, #ff9800 0%, #ffb74d 50%, #ffcc80 100%)',
        border: isBundleSelected
          ? '3px dashed #FFD700'
          : isBaseClipValue
            ? '3px solid rgba(255, 107, 53, 0.8)'
            : '2px solid rgba(255, 152, 0, 0.6)',
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)'
          : isSelected
            ? '0 0 0 3px rgba(255, 255, 255, 0.8), 0 8px 25px rgba(255, 152, 0, 0.4)'
            : isDragging
              ? '0 12px 40px rgba(255, 152, 0, 0.5)'
              : isHovered
                ? '0 6px 20px rgba(255, 152, 0, 0.3)'
                : '0 2px 8px rgba(255, 152, 0, 0.2)'
      },
      sentence: {
        background: isBaseClipValue
          ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd23f 100%)'
          : 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 50%, #e1bee7 100%)',
        border: isBundleSelected
          ? '3px dashed #FFD700'
          : isBaseClipValue
            ? '3px solid rgba(255, 107, 53, 0.8)'
            : '2px solid rgba(156, 39, 176, 0.6)',
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)'
          : isSelected
            ? '0 0 0 3px rgba(255, 255, 255, 0.8), 0 8px 25px rgba(156, 39, 176, 0.4)'
            : isDragging
              ? '0 12px 40px rgba(156, 39, 176, 0.5)'
              : isHovered
                ? '0 6px 20px rgba(156, 39, 176, 0.3)'
                : '0 2px 8px rgba(156, 39, 176, 0.2)'
      },
      longsentence: {
        background: isBaseClipValue
          ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd23f 100%)'
          : 'linear-gradient(135deg, #607d8b 0%, #78909c 50%, #90a4ae 100%)',
        border: isBundleSelected
          ? '3px dashed #FFD700'
          : isBaseClipValue
            ? '3px solid rgba(255, 107, 53, 0.8)'
            : '2px solid rgba(96, 125, 139, 0.6)',
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)'
          : isSelected
            ? '0 0 0 3px rgba(255, 255, 255, 0.8), 0 8px 25px rgba(96, 125, 139, 0.4)'
            : isDragging
              ? '0 12px 40px rgba(96, 125, 139, 0.5)'
              : isHovered
                ? '0 6px 20px rgba(96, 125, 139, 0.3)'
                : '0 2px 8px rgba(96, 125, 139, 0.2)'
      },
      shape: {
        background: isBaseClipValue
          ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd23f 100%)'
          : 'linear-gradient(135deg, #e91e63 0%, #f48fb1 50%, #f8bbd0 100%)',
        border: isBundleSelected
          ? '3px dashed #FFD700'
          : isBaseClipValue
            ? '3px solid rgba(255, 107, 53, 0.8)'
            : '2px solid rgba(233, 30, 99, 0.6)',
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)'
          : isSelected
            ? '0 0 0 3px rgba(255, 255, 255, 0.8), 0 8px 25px rgba(233, 30, 99, 0.4)'
            : isDragging
              ? '0 12px 40px rgba(233, 30, 99, 0.5)'
              : isHovered
                ? '0 6px 20px rgba(233, 30, 99, 0.3)'
                : '0 2px 8px rgba(233, 30, 99, 0.2)'
      },
      default: {
        background: isBaseClipValue
          ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd23f 100%)'
          : 'linear-gradient(135deg, #757575 0%, #9e9e9e 50%, #bdbdbd 100%)',
        border: isBundleSelected
          ? '3px dashed #FFD700'
          : isBaseClipValue
            ? '3px solid rgba(255, 107, 53, 0.8)'
            : '2px solid rgba(117, 117, 117, 0.6)',
        boxShadow: isBundleSelected
          ? '0 0 0 4px #FFD700, 0 0 0 6px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(255, 215, 0, 0.4)'
          : isSelected
            ? '0 0 0 3px rgba(255, 255, 255, 0.8), 0 8px 25px rgba(117, 117, 117, 0.4)'
            : isDragging
              ? '0 12px 40px rgba(117, 117, 117, 0.5)'
              : isHovered
                ? '0 6px 20px rgba(117, 117, 117, 0.3)'
                : '0 2px 8px rgba(117, 117, 117, 0.2)'
      }
    };

    const gradientKey = (clip.mediaType === 'simpleShape' || clip.mediaType === 'polygonShape') ? 'shape' : clip.mediaType;
    const mediaStyle = gradients[gradientKey as keyof typeof gradients] || gradients.default;

    return {
      ...baseStyle,
      ...mediaStyle
    };
  };

  // 클립 클릭 핸들러 - Bundle 선택 로직 추가
  const handleClipClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    const isTimeWithinClip = currentTime >= clip.startTime && currentTime <= clip.endTime;
    const isMultiSelectMode = e.ctrlKey || e.metaKey;

    console.log('🎥 클립 클릭:', {
      clipId: clip.id.slice(-8),
      mediaType: clip.mediaType,
      startTime: clip.startTime.toFixed(2),
      endTime: clip.endTime.toFixed(2),
      currentTime: currentTime.toFixed(2),
      isTimeWithinClip,
      isMultiSelectMode,
      isBundleSelectionMode,
      isBaseClip: isBaseClipValue
    });

    if (isMultiSelectMode) {
      // Bundle 선택 모드 (Command/Ctrl + 클릭)
      if (isBaseClipValue || clip.templateGroupId) {
        // 기준클립이거나 템플릿 그룹에 속한 클립인 경우에만 Bundle 선택 가능
        const trackIndex = tracks.findIndex(track => track.id === clip.trackId);

        const selectedElement: SelectedElement = {
          id: clip.templateGroupId || clip.id, // 템플릿 그룹 ID 우선, 없으면 클립 ID
          type: clip.templateGroupId ? 'templateGroup' : 'baseClip',
          name: clip.templateGroupId ? `템플릿 그룹` : displayName,
          startTime: clip.startTime,
          endTime: clip.endTime,
          trackIndex
        };

        toggleBundleElementSelection(selectedElement);

        console.log('📦 Bundle 요소 선택 토글:', {
          elementType: selectedElement.type,
          elementId: selectedElement.id.slice(-8),
          elementName: selectedElement.name
        });
      } else {
        // 일반클립은 기존 다중 선택 로직
        if (isSelected) {
          selectClips(selectedClips.filter(id => id !== clip.id));
        } else {
          selectClips([...selectedClips, clip.id]);
        }
      }
    } else {
      // 일반 클릭 (Bundle 선택 모드 해제)
      clearBundleSelection();
      selectClip(clip.id);

      if (!isTimeWithinClip) {
        setCurrentTime(clip.startTime);
        setIsPlaying(false);
      }
    }
  }, [clip.id, clip.startTime, clip.endTime, clip.trackId, clip.templateGroupId, currentTime, isSelected, selectedClips, isBaseClipValue, tracks, selectClips, selectClip, setCurrentTime, setIsPlaying, toggleBundleElementSelection, clearBundleSelection, getClipDisplayName]);

  // 클립 더블클릭 핸들러 (속성창 열기)
  const handleClipDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();


    // 더블클릭 시 속성창 열기
    openPropertiesPanel(clip.id);
  }, [clip.id, clip.mediaType, openPropertiesPanel]);

  // 삭제 핸들러
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    removeClip(clip.id);
  }, [clip.id, removeClip]);

  // 우클릭 핸들러 (컨텍스트 메뉴)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 클립이 선택되지 않았다면 선택
    if (!isSelected) {
      selectClip(clip.id);
    }

    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [clip.id, isSelected, selectClip]);

  // 컨텍스트 메뉴 닫기
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 클립 정렬 핸들러들
  const handleAlignClip = useCallback((alignmentType: 'start' | 'end' | 'both') => {
    // 현재 클립이 선택되지 않은 경우 선택
    if (!selectedClips.includes(clip.id)) {
      selectClip(clip.id);
    }

    // 기준클립이면 정렬 불가
    if (isBaseClipValue) {
      console.log('⚠️ 기준클립은 정렬할 수 없습니다:', clip.id.slice(-8));
      setContextMenu(null);
      return;
    }

    const allClips = getAllClips();
    let result: ClipAlignmentResult;

    // 정렬 타입에 따라 해당 함수 호출 (템플릿 그룹과 번들 데이터 포함)
    switch (alignmentType) {
      case 'start':
        result = alignClipStart(clip, allClips, templateGroups, bundles);
        break;
      case 'end':
        result = alignClipEnd(clip, allClips, templateGroups, bundles);
        break;
      case 'both':
        result = alignClipBoth(clip, allClips, templateGroups, bundles);
        break;
      default:
        console.error('❌ 알 수 없는 정렬 타입:', alignmentType);
        setContextMenu(null);
        return;
    }

    // 결과 처리
    if (result.success && result.updatedClip) {
      updateClip(clip.id, {
        startTime: result.updatedClip.startTime,
        endTime: result.updatedClip.endTime,
        duration: result.updatedClip.duration,
        regularClipProperties: result.updatedClip.regularClipProperties
      });

      console.log(`✅ ${result.message}`, {
        clipId: clip.id.slice(-8),
        alignmentType,
        '새위치': `${result.updatedClip.startTime.toFixed(2)}~${result.updatedClip.endTime.toFixed(2)}`
      });
    } else {
      console.log(`❌ 정렬 실패: ${result.message}`, {
        clipId: clip.id.slice(-8),
        alignmentType
      });
    }

    setContextMenu(null);
  }, [clip, isBaseClipValue, getAllClips, updateClip, selectedClips, selectClip, templateGroups, bundles]);

  // 연결 끊기 핸들러 - 개별 클립 처리로 단순화
  const handleDisconnectConnections = useCallback((connectionType: 'start' | 'end' | 'all') => {
    // 현재 클립이 선택되지 않은 경우 선택
    if (!selectedClips.includes(clip.id)) {
      selectClip(clip.id);
    }

    // 기준클립이면 연결 끊기 불가
    if (isBaseClipValue) {
      setContextMenu(null);
      return;
    }

    // 연결 끊기 실행
    const result = disconnectClipAnchors(clip, connectionType);

    if (result.success && result.updatedClip) {
      updateClip(clip.id, {
        regularClipProperties: result.updatedClip.regularClipProperties
      });

      const actionName = connectionType === 'start' ? '시작점' : connectionType === 'end' ? '끝점' : '전체';
      
      console.log(`✅ ${actionName} 연결 끊기 완료:`, {
        clipId: clip.id.slice(-8),
        connectionType,
        disconnectedConnections: result.disconnectedConnections,
        message: result.message
      });
    } else {
      console.log(`❌ 연결 끊기 실패:`, {
        clipId: clip.id.slice(-8),
        connectionType,
        message: result.message
      });
    }

    setContextMenu(null);
  }, [clip, isBaseClipValue, updateClip, selectedClips, selectClip]);

  // 컨텍스트 메뉴 외부 클릭 감지
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // 리사이즈 핸들러
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: 'left' | 'right') => {
    if (isTrackLocked) return;

    e.preventDefault();
    e.stopPropagation();

    console.log(`🔧 클립 리사이즈 시작 [${direction}]:`, {
      clipId: clip.id.slice(-8),
      startTime: clip.startTime,
      duration: clip.duration
    });

    setIsResizing(true);
    setResizeDirection(direction);

    // 🎯 리사이즈 시작 상태 설정
    setClipResizing(true, clip.id);

    const startX = e.clientX;
    const startTime = clip.startTime;
    const startDuration = clip.duration;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaTime = deltaX / zoom;

      if (direction === 'left') {
        const newStartTime = Math.max(0, startTime + deltaTime);
        const newDuration = startDuration - (newStartTime - startTime);

        if (newDuration >= MIN_CLIP_DURATION) {
          // 🎯 기준클립인 경우 충돌 검사
          if (isBaseClipValue) {
            const allClips = getAllClips();
            const otherBaseClips = allClips.filter(c => isBaseClip(c) && c.id !== clip.id);

            const resizedClip: ClipType = {
              ...clip,
              startTime: newStartTime,
              endTime: newStartTime + newDuration,
              duration: newDuration
            };

            const testBaseClips = [...otherBaseClips, resizedClip];
            const hasConflict = checkBaseClipOverlap(testBaseClips);

            if (!hasConflict) {
              updateClip(clip.id, {
                startTime: newStartTime,
                duration: newDuration,
                endTime: newStartTime + newDuration
              });
            }
          } else {
            updateClip(clip.id, {
              startTime: newStartTime,
              duration: newDuration,
              endTime: newStartTime + newDuration
            });
          }
        }
      } else {
        const newDuration = Math.max(MIN_CLIP_DURATION, startDuration + deltaTime);
        const newEndTime = startTime + newDuration;

        // 🎯 기준클립인 경우 충돌 검사
        if (isBaseClipValue) {
          const allClips = getAllClips();
          const otherBaseClips = allClips.filter(c => isBaseClip(c) && c.id !== clip.id);

          const resizedClip: ClipType = {
            ...clip,
            endTime: newEndTime,
            duration: newDuration
          };

          const testBaseClips = [...otherBaseClips, resizedClip];
          const hasConflict = checkBaseClipOverlap(testBaseClips);

          if (!hasConflict) {
            updateClip(clip.id, {
              duration: newDuration,
              endTime: newEndTime
            });
          }
        } else {
          updateClip(clip.id, {
            duration: newDuration,
            endTime: newEndTime
          });
        }
      }
    };

    const handleMouseUp = () => {
      console.log(`🔧 클립 리사이즈 종료 [${direction}]`);
      setIsResizing(false);
      setResizeDirection(null);

      // 🎯 리사이즈 종료 상태 설정
      setClipResizing(false, null);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [clip, zoom, updateClip, isTrackLocked]);



  return (
    <>
      {/* Bundle 내부 순서 변경을 위한 드롭 영역 상태 표시 */}
      {clip.bundleId && isDropTarget && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 215, 0, 0.3)',
          border: '2px dashed #FFD700',
          borderRadius: '8px',
          zIndex: 30,
          pointerEvents: 'none'
        }} />
      )}

      {/* 드래그 프리뷰 제거 - Bundle 내 순서 변경을 위해 기본 드래그 사용 */}

      {/* 실제 클립 요소 */}
      <div
        ref={combinedRef}
        style={getClipStyle()}
        draggable={false} // HTML5 기본 드래그 비활성화 (React DnD만 사용)
        onClick={handleClipClick}
        onDoubleClick={handleClipDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => {
          // Option 키 상태 캡처
          handleMouseDown(e);
          
          const rect = e.currentTarget.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const offsetY = e.clientY - rect.top;

          console.log('🖱️ 클립 마우스 다운:', {
            clipId: clip.id.slice(-8),
            offsetX: offsetX.toFixed(1),
            offsetY: offsetY.toFixed(1),
            clipWidth: clipWidth.toFixed(1),
            clipHeight: clipHeight.toFixed(1)
          });
        }}
      >
        {/* 🌟 글래스모피즘 오버레이 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '6px 6px 0 0'
        }} />

        {/* 클립 내용 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          padding: '0 12px',
          gap: '8px',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 2
        }}>
          {/* 아이콘 */}
          <div style={{
            color: '#ffffff',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)'
          }}>
            {getIcon()}
          </div>

          {/* 🎯 Union 타입 기반 향상된 클립 이름 및 정보 */}
          <div style={{
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '600',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
            letterSpacing: '0.2px'
          }}>
            {/* 기준클립 표시 */}
            {isBaseClipValue && <span style={{ marginRight: '4px' }}>🛡️</span>}
            
            {/* 🎵 Audio 클립 - 오디오 전용 정보 */}
            {isAudioClip(clip) && (
              <span style={{ fontSize: '11px', opacity: 0.9 }}>
                🎵 {displayName} 
                {clip.volume !== undefined && clip.volume !== 1.0 && (
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    (vol: {Math.round(clip.volume * 100)}%)
                  </span>
                )}
              </span>
            )}
            
            {/* 🎬 Video 클립 - 시각적 + 오디오 정보 */}
            {isVideoClip(clip) && (
              <span>
                🎬 {displayName}
                {/* 비디오 크기 정보 */}
                {clipWidth > 120 && (
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>
                    ({clip.width}x{clip.height})
                  </span>
                )}
              </span>
            )}
            
            {/* 🖼️ Image 클립 - 시각적 전용 정보 */}
            {isImageClip(clip) && (
              <span>
                🖼️ {displayName}
                {/* 이미지 크기 정보 */}
                {clipWidth > 100 && (
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>
                    ({clip.width}x{clip.height})
                  </span>
                )}
              </span>
            )}
            
            {/* 📝 Text 클립 - 클립 이름 우선 표시 */}
            {isTextClip(clip) && (
              <span>
                📝 
                {/* 클립 이름 우선 표시, 없으면 텍스트 내용 */}
                {clipWidth > 80 ? (
                  <span style={{ fontSize: '12px' }}>
                    {clip.name && clip.name.trim() ? displayName : (clip.text?.slice(0, 15) + (clip.text && clip.text.length > 15 ? '...' : ''))}
                  </span>
                ) : (
                  <span style={{ fontSize: '11px' }}>{displayName}</span>
                )}
                {/* 폰트 크기 정보 */}
                {clipWidth > 120 && clip.fontSize && (
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>
                    ({clip.fontSize}px)
                  </span>
                )}
              </span>
            )}
            
            {/* 📄 Sentence 클립 - 클립 이름 우선 표시 */}
            {isSentenceClip(clip) && (
              <span>
                📄 
                {/* 클립 이름 우선 표시, 없으면 텍스트 내용 */}
                {clipWidth > 80 ? (
                  <span style={{ fontSize: '12px' }}>
                    {clip.name && clip.name.trim() ? displayName : (clip.text?.slice(0, 15) + (clip.text && clip.text.length > 15 ? '...' : ''))}
                  </span>
                ) : (
                  <span style={{ fontSize: '11px' }}>{displayName}</span>
                )}
                {/* 세그먼트 수 정보 */}
                {clipWidth > 120 && clip.textSegments && clip.textSegments.length > 0 && (
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>
                    ({clip.textSegments.length}세그먼트)
                  </span>
                )}
              </span>
            )}
            
            {/* 📖 LongSentence 클립 - 긴 텍스트 정보 */}
            {clip.mediaType === 'longsentence' && (
              <span>
                📖 
                {/* 클립 이름 우선 표시, 없으면 텍스트 내용 */}
                {clipWidth > 80 ? (
                  <span style={{ fontSize: '12px' }}>
                    {clip.name && clip.name.trim() ? displayName : (() => {
                      const longSentenceClip = clip as any;
                      if (longSentenceClip.data && longSentenceClip.data.length > 0) {
                        return longSentenceClip.data[0].text?.slice(0, 15) + (longSentenceClip.data[0].text && longSentenceClip.data[0].text.length > 15 ? '...' : '');
                      } else if (longSentenceClip.text) {
                        return longSentenceClip.text.slice(0, 15) + (longSentenceClip.text.length > 15 ? '...' : '');
                      }
                      return '';
                    })()}
                  </span>
                ) : (
                  <span style={{ fontSize: '11px' }}>{displayName}</span>
                )}
                {/* 변환 상태 정보 */}
                {clipWidth > 120 && (clip as any).conversionStatus && (
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>
                    ({(clip as any).conversionStatus === 'pending' ? '대기' : 
                      (clip as any).conversionStatus === 'processing' ? '변환중' : 
                      (clip as any).conversionStatus === 'completed' ? '완료' : '실패'})
                  </span>
                )}
              </span>
            )}
            
            {/* 🔶 Shape 클립들 - 도형 정보 */}
            {(clip.mediaType === 'shape' || clip.mediaType === 'simpleShape' || clip.mediaType === 'polygonShape') && (
              <span>
                🔶 {displayName}
                {/* 도형 타입 정보 */}
                {clipWidth > 100 && clip.mediaType === 'polygonShape' && clip.polygonShapeProperties?.shapeType && (
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '4px' }}>
                    ({clip.polygonShapeProperties.shapeType})
                  </span>
                )}
              </span>
            )}
          </div>

          {/* 🎯 Union 타입 기반 향상된 시간 정보 표시 */}
          <div style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '11px',
            fontWeight: '500',
            flexShrink: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {/* Bundle 표시 */}
            {clip.bundleId && <span style={{ fontSize: '10px' }}>📦</span>}
            
            {/* 🎵 Audio 클립 - 오디오 전용 정보 강조 */}
            {isAudioClip(clip) && (
              <>
                <span style={{ fontSize: '10px', color: '#FFD700' }}>🎵</span>
                <span>{clip.duration.toFixed(1)}s</span>
                {clip.volume !== undefined && clip.volume !== 1.0 && (
                  <span style={{ fontSize: '9px', color: '#81C784' }}>vol:{Math.round(clip.volume * 100)}%</span>
                )}
              </>
            )}
            
            {/* 🎬 Video 클립 - 시각적 + 오디오 정보 */}
            {isVideoClip(clip) && (
              <>
                <span style={{ fontSize: '10px', color: '#64B5F6' }}>🎬</span>
                <span>{clip.duration.toFixed(1)}s</span>
                {/* 사이즈 정보 (충분한 공간이 있을 때) */}
                {clipWidth > 150 && (
                  <span style={{ fontSize: '9px', color: '#FFB74D' }}>{clip.width}x{clip.height}</span>
                )}
                {/* 볼륨 정보 */}
                {clip.volume !== undefined && clip.volume !== 1.0 && (
                  <span style={{ fontSize: '9px', color: '#81C784' }}>vol:{Math.round(clip.volume * 100)}%</span>
                )}
              </>
            )}
            
            {/* 🖼️ Image 클립 - 시각적 전용 정보 */}
            {isImageClip(clip) && (
              <>
                <span style={{ fontSize: '10px', color: '#A5D6A7' }}>🖼️</span>
                <span>{clip.duration.toFixed(1)}s</span>
                {/* 이미지 크기 */}
                {clipWidth > 130 && (
                  <span style={{ fontSize: '9px', color: '#FFB74D' }}>{clip.width}x{clip.height}</span>
                )}
              </>
            )}
            
            {/* 📝 Text 클립 - 텍스트 전용 정보 */}
            {isTextClip(clip) && (
              <>
                <span style={{ fontSize: '10px', color: '#FFCC80' }}>📝</span>
                <span>{clip.duration.toFixed(1)}s</span>
                {/* 폰트 크기 */}
                {clipWidth > 140 && clip.fontSize && (
                  <span style={{ fontSize: '9px', color: '#E1BEE7' }}>{clip.fontSize}px</span>
                )}
                {/* 글자 수 */}
                {clipWidth > 160 && clip.text && (
                  <span style={{ fontSize: '9px', color: '#BCAAA4' }}>{clip.text.length}자</span>
                )}
              </>
            )}
            
            {/* 📄 Sentence 클립 - 세그먼트 텍스트 전용 정보 */}
            {isSentenceClip(clip) && (
              <>
                <span style={{ fontSize: '10px', color: '#DDA0DD' }}>📄</span>
                <span>{clip.duration.toFixed(1)}s</span>
                {/* 세그먼트 수 */}
                {clipWidth > 140 && clip.textSegments && clip.textSegments.length > 0 && (
                  <span style={{ fontSize: '9px', color: '#FFB6C1' }}>{clip.textSegments.length}세그</span>
                )}
                {/* 글자 수 */}
                {clipWidth > 160 && clip.text && (
                  <span style={{ fontSize: '9px', color: '#BCAAA4' }}>{clip.text.length}자</span>
                )}
              </>
            )}
            
            {/* 🔶 Shape 클립들 - 도형 전용 정보 */}
            {(clip.mediaType === 'shape' || clip.mediaType === 'simpleShape' || clip.mediaType === 'polygonShape') && (
              <>
                <span style={{ fontSize: '10px', color: '#F8BBD0' }}>🔶</span>
                <span>{clip.duration.toFixed(1)}s</span>
                {/* 도형 타입 */}
                {clipWidth > 140 && clip.mediaType === 'polygonShape' && clip.polygonShapeProperties?.shapeType && (
                  <span style={{ fontSize: '9px', color: '#D1C4E9' }}>{clip.polygonShapeProperties.shapeType}</span>
                )}
              </>
            )}
            
            {/* 드래그 상태 표시 */}
            {clip.bundleId && isDragging && (
              <span style={{ fontSize: '9px', color: '#FFD700' }}>드래그</span>
            )}
          </div>

          {/* 삭제 버튼 */}
          {isSelected && !isTrackLocked && (
            <button
              onClick={handleDelete}
              style={{
                color: '#ffffff',
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.8) 0%, rgba(229, 115, 115, 0.8) 100%)',
                border: '1px solid rgba(244, 67, 54, 0.4)',
                borderRadius: '4px',
                padding: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: isHovered ? 1 : 0.7,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)'
              }}
              title="삭제"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* 🎛️ 리사이즈 핸들 - 개선된 시각적 피드백 */}
        {!isTrackLocked && !isDragging && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '6px',
                height: '100%',
                cursor: 'ew-resize',
                background: isHovered ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' : 'transparent',
                transition: 'all 0.2s ease',
                zIndex: 20,
                borderRadius: '6px 0 0 6px'
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
              title="시작 시간 조절"
            />

            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '6px',
                height: '100%',
                cursor: 'ew-resize',
                background: isHovered ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' : 'transparent',
                transition: 'all 0.2s ease',
                zIndex: 20,
                borderRadius: '0 6px 6px 0'
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
              title="길이 조절"
            />
          </>
        )}

        {/* 페이드 인/아웃 표시 */}
        {clip.fadeIn && clip.fadeIn > 0 && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${clip.fadeIn * zoom}px`,
            background: 'linear-gradient(to right, rgba(0, 0, 0, 0.6) 0%, transparent 100%)',
            pointerEvents: 'none',
            borderRadius: '6px 0 0 6px'
          }} />
        )}

        {clip.fadeOut && clip.fadeOut > 0 && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: `${clip.fadeOut * zoom}px`,
            background: 'linear-gradient(to left, rgba(0, 0, 0, 0.6) 0%, transparent 100%)',
            pointerEvents: 'none',
            borderRadius: '0 6px 6px 0'
          }} />
        )}

        {/* 드래그 중 위치 안내 - 개선된 스타일 */}
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(79, 172, 254, 0.9) 100%)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '600',
            padding: '6px 12px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(33, 150, 243, 0.4)',
            boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
            backdropFilter: 'blur(10px)',
            fontFamily: 'monospace'
          }}>
            {clip.startTime.toFixed(2)}s - {clip.endTime.toFixed(2)}s
          </div>
        )}

        {/* 📊 진행률 표시바 (선택된 클립에만) */}
        {isSelected && currentTime >= clip.startTime && currentTime <= clip.endTime && (
          <div style={{
            position: 'absolute',
            bottom: '2px',
            left: '4px',
            right: '4px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00ff88 0%, #00d4ff 100%)',
              borderRadius: '2px',
              width: `${((currentTime - clip.startTime) / clip.duration) * 100}%`,
              transition: 'width 0.1s ease',
              boxShadow: '0 0 6px rgba(0, 255, 136, 0.5)'
            }} />
          </div>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (() => {
        // 현재 클립의 연결 상태 확인 - 확장된 앵커 구조(V2) 우선 지원
        const effectiveStartAnchor = getEffectiveStartAnchor(clip.regularClipProperties);
        const effectiveEndAnchor = getEffectiveEndAnchor(clip.regularClipProperties);
        
        const hasStartConnection = !isBaseClipValue && effectiveStartAnchor;
        const hasEndConnection = !isBaseClipValue && effectiveEndAnchor;
        const hasAnyConnection = hasStartConnection || hasEndConnection;

        return (
          <div
            style={{
              position: 'fixed',
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              background: 'linear-gradient(135deg, rgba(22, 33, 62, 0.95) 0%, rgba(15, 52, 96, 0.95) 100%)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(100, 181, 246, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              zIndex: 10000,
              minWidth: '200px',
              padding: '6px 0',
              fontSize: '14px'
            }}
          >
            {/* 클립 정렬 메뉴들 - 일반클립이고 연결이 있을 때만 표시 */}
            {!isBaseClipValue && hasAnyConnection && (
              <>
                {/* 앞끝 맞추기 - 시작점 연결이 있을 때 */}
                {hasStartConnection && (
                  <button
                    onClick={() => handleAlignClip('start')}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#4caf50',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🎯⬅️</span>
                    <span>앞끝 맞추기</span>
                  </button>
                )}

                {/* 뒤끝 맞추기 - 끝점 연결이 있을 때 */}
                {hasEndConnection && (
                  <button
                    onClick={() => handleAlignClip('end')}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#2196f3',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(33, 150, 243, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🎯➡️</span>
                    <span>뒤끝 맞추기</span>
                  </button>
                )}

                {/* 양끝 맞추기 - 시작점과 끝점 연결이 모두 있을 때 */}
                {hasStartConnection && hasEndConnection && (
                  <button
                    onClick={() => handleAlignClip('both')}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ff9800',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 152, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🎯↔️</span>
                    <span>양끝 맞추기</span>
                  </button>
                )}

                {/* 구분선 */}
                <div style={{
                  height: '1px',
                  background: 'rgba(100, 181, 246, 0.2)',
                  margin: '6px 0'
                }} />
              </>
            )}

            {/* 연결 끊기 메뉴들 - 일반클립이고 연결이 있을 때만 표시 */}
            {!isBaseClipValue && hasAnyConnection && (
              <>
                {/* 시작점 연결 끊기 */}
                {hasStartConnection && (
                  <button
                    onClick={() => handleDisconnectConnections('start')}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#e91e63',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(233, 30, 99, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>⬅️❌</span>
                    <span>시작점 연결 끊기</span>
                  </button>
                )}

                {/* 끝점 연결 끊기 */}
                {hasEndConnection && (
                  <button
                    onClick={() => handleDisconnectConnections('end')}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ff5722',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 87, 34, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>➡️❌</span>
                    <span>끝점 연결 끊기</span>
                  </button>
                )}

                {/* 모든 연결 끊기 - 양쪽 모두 연결되어 있을 때만 */}
                {hasStartConnection && hasEndConnection && (
                  <button
                    onClick={() => handleDisconnectConnections('all')}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#9c27b0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(156, 39, 176, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🔗❌</span>
                    <span>모든 연결 끊기</span>
                  </button>
                )}

                {/* 구분선 */}
                <div style={{
                  height: '1px',
                  background: 'rgba(100, 181, 246, 0.2)',
                  margin: '6px 0'
                }} />
              </>
            )}

            {/* 속성 편집 */}
            <button
              onClick={() => {
                openPropertiesPanel(clip.id);
                setContextMenu(null);
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(100, 181, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '16px' }}>⚙️</span>
              <span>속성 편집</span>
            </button>

            {/* 삭제 */}
            <button
              onClick={() => {
                handleDelete(new MouseEvent('click') as any);
                setContextMenu(null);
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: '#ff5252',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 82, 82, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '16px' }}>🗑️</span>
              <span>삭제</span>
            </button>
          </div>
        );
      })()}
    </>
  );
};