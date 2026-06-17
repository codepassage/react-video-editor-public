/**
 * 🔄 TransformEditor.tsx - 클립 변형 및 위치 편집 컴포넌트
 * 
 * 시각적 클립의 위치, 크기, 회전, 스케일 등 변형(Transform) 속성을
 * 편집할 수 있는 종합적인 편집 인터페이스입니다. 직관적인 UI와
 * 실시간 미리보기를 통해 정밀한 클립 배치 및 변형을 지원합니다.
 * 
 * 주요 기능:
 * - 위치 편집 (X, Y 좌표)
 * - 크기 조절 (Width, Height)
 * - 회전 (Rotation) 제어
 * - 스케일 조정 (ScaleX, ScaleY)
 * - 앵커 포인트 설정
 * - 투명도 (Opacity) 조절
 * - 종횡비 잠금/해제
 * - 변형 프리셋 시스템
 * 
 * 편집 카테고리:
 * 1. 기본 위치: X, Y 좌표 설정
 * 2. 크기: 너비, 높이 조절
 * 3. 회전: 각도 설정 및 회전 중심점
 * 4. 스케일: X/Y축 개별 스케일링
 * 5. 앵커: 변형 기준점 설정
 * 6. 투명도: 알파값 조절
 * 7. 마진: 위치 여백 설정
 * 
 * 대화형 기능:
 * - 실시간 값 변경 및 미리보기
 * - 드래그 앤 드롭 위치 조정
 * - 키보드 단축키 지원
 * - 프리셋 저장/불러오기
 * - 변형 값 리셋 기능
 * 
 * 프리셋 시스템:
 * - 사전 정의된 변형 템플릿
 * - 사용자 정의 프리셋 생성
 * - 빠른 적용 및 복사
 * - 프리셋 분류 및 관리
 * 
 * 관련 모듈:
 * - 2번 모듈: Clip Type System (시각적 클립 타입)
 * - PositionSizeGrid: 위치/크기 그리드 UI
 * - PropertiesPanel: 속성 편집 패널 통합
 * - Remotion 렌더링: 실시간 변형 반영
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Move, RotateCw, Maximize2, Eye, EyeOff,
  Lock, Unlock, CornerDownLeft, CornerDownRight,
  MousePointer, Hand, Crosshair,
  ChevronDown, ChevronUp, Anchor
} from 'lucide-react';
import { TimelineClip } from '../../types';
import { isVisualClip } from '../../types/clipGuards';
import { useEditorStore } from '../../store/editorStore';
import {
  PositionSizeGrid,
  SliderWithNumber,
  PresetGrid,
  MarginControl,
  type MarginValues,
  type PresetGridItem,
} from '../common/ui';
// 👉 공통 위치/크기/회전/투명도 컨트롤 컴포넌트
import { PositionTransformControls } from './shared/PositionTransformControls';

interface TransformEditorProps {
  clip: TimelineClip;
  onUpdate: (clipId: string, updates: Partial<TimelineClip>) => void;
}

interface UnitType {
  x: 'px' | '%';
  y: 'px' | '%';
  width: 'px' | '%';
  height: 'px' | '%';
}

export const TransformEditor: React.FC<TransformEditorProps> = ({ clip, onUpdate }) => {
  // 시각적 클립만 변형 기능 지원
  if (!isVisualClip(clip)) {
    return null;
  }

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAspectLocked, setIsAspectLocked] = useState(false);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(clip.width / clip.height);

  // 단위 상태 관리 - 기본값을 %로 변경
  const [units, setUnits] = useState<UnitType>({
    x: '%',
    y: '%',
    width: '%',
    height: '%'
  });

  // 입력 중인지 추적하는 플래그
  const [isInputting, setIsInputting] = useState({
    x: false,
    y: false,
    width: false,
    height: false
  });

  // 입력 중일 때는 임시 값 저장
  const [tempInputValues, setTempInputValues] = useState<Partial<Record<keyof UnitType, number>>>({});

  // 디바운싱을 위한 타이머 참조
  const updateTimeoutRef = useRef<Record<keyof UnitType, NodeJS.Timeout | null>>({
    x: null,
    y: null,
    width: null,
    height: null
  });

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(updateTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // editorStore에서 projectSettings와 playerDisplaySize 가져오기
  const { projectSettings, playerDisplaySize } = useEditorStore((state) => ({
    projectSettings: state.projectSettings,
    playerDisplaySize: state.playerDisplaySize
  }));

  // 위치 여백 상태 관리
  const [positionMargin, setPositionMargin] = useState({
    top: clip.positionMargin?.top || 50,
    right: clip.positionMargin?.right || 50,
    bottom: clip.positionMargin?.bottom || 50,
    left: clip.positionMargin?.left || 50
  });

  // 단위 변환 함수들 - 프로젝트 해상도 기준으로 % 계산
  const percentToPx = useCallback((percent: number, dimension: 'x' | 'y' | 'width' | 'height') => {
    // 프로젝트 설정 해상도를 기준으로 % 계산
    let canvasSize;
    if (dimension === 'width' || dimension === 'x') {
      canvasSize = projectSettings.width; // 1920
    } else {
      canvasSize = projectSettings.height; // 1080
    }
    return (percent / 100) * canvasSize;
  }, [projectSettings.width, projectSettings.height]);

  const pxToPercent = useCallback((px: number, dimension: 'x' | 'y' | 'width' | 'height') => {
    // 프로젝트 설정 해상도를 기준으로 % 계산
    let canvasSize;
    if (dimension === 'width' || dimension === 'x') {
      canvasSize = projectSettings.width; // 1920
    } else {
      canvasSize = projectSettings.height; // 1080
    }
    return (px / canvasSize) * 100;
  }, [projectSettings.width, projectSettings.height]);

  // 📊 실시간으로 표시값 계산 (입력 중이 아닐 때는 클립 값 기준, 입력 중일 때는 임시 값 사용)
  const displayValues = useMemo(() => {
    // 직접 계산 로직 사용 (함수 참조 대신) - 프로젝트 해상도 기준
    const pxToPercentCalc = (px: number, dimension: 'x' | 'y' | 'width' | 'height') => {
      let canvasSize;
      if (dimension === 'width' || dimension === 'x') {
        canvasSize = projectSettings.width; // 1920
      } else {
        canvasSize = projectSettings.height; // 1080
      }
      return (px / canvasSize) * 100;
    };

    return {
      x: isInputting.x && tempInputValues.x !== undefined
        ? tempInputValues.x
        : (units.x === '%' ? pxToPercentCalc(clip.x, 'x') : clip.x),
      y: isInputting.y && tempInputValues.y !== undefined
        ? tempInputValues.y
        : (units.y === '%' ? pxToPercentCalc(clip.y, 'y') : clip.y),
      width: isInputting.width && tempInputValues.width !== undefined
        ? tempInputValues.width
        : (units.width === '%' ? pxToPercentCalc(clip.width, 'width') : clip.width),
      height: isInputting.height && tempInputValues.height !== undefined
        ? tempInputValues.height
        : (units.height === '%' ? pxToPercentCalc(clip.height, 'height') : clip.height)
    };
  }, [clip.x, clip.y, clip.width, clip.height, units, isInputting, tempInputValues, projectSettings]);

  // 값 변경 핸들러 (무한 루프 방지 개선)
  const handleValueChange = useCallback((field: keyof UnitType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);

    // 입력 중 플래그 설정 및 임시값 저장
    setIsInputting(prev => ({ ...prev, [field]: true }));
    setTempInputValues(prev => ({ ...prev, [field]: newValue }));

    // 디바운싱으로 업데이트 빈도 제한
    if (updateTimeoutRef.current[field]) {
      clearTimeout(updateTimeoutRef.current[field]!);
    }
    updateTimeoutRef.current[field] = setTimeout(() => {
      // 실제 px 값으로 변환 후 클립 업데이트
      const actualPxValue = units[field] === '%'
        ? percentToPx(newValue, field)
        : newValue;

      // 종횡비 잠금이 활성화된 경우 처리
      if (isAspectLocked && (field === 'width' || field === 'height')) {
        const aspectRatio = originalAspectRatio;

        if (field === 'width') {
          const newHeight = actualPxValue / aspectRatio;
          onUpdate(clip.id, { width: actualPxValue, height: newHeight });
        } else {
          const newWidth = actualPxValue * aspectRatio;
          onUpdate(clip.id, { width: newWidth, height: actualPxValue });
        }
      } else {
        onUpdate(clip.id, { [field]: actualPxValue });
      }

      // 업데이트 완료 후 입력 상태 정리
      setTimeout(() => {
        setIsInputting(prev => ({ ...prev, [field]: false }));
        setTempInputValues(prev => {
          const newTemp = { ...prev };
          delete newTemp[field];
          return newTemp;
        });
      }, 50);
    }, 100); // 100ms 디바운싱 (빠른 반응성)
  }, [units, percentToPx, isAspectLocked, originalAspectRatio, clip.id, onUpdate]);

  // 입력 완료 핸들러 (onBlur)
  const handleInputComplete = useCallback((field: keyof UnitType) => () => {
    setIsInputting(prev => ({ ...prev, [field]: false }));
    setTempInputValues(prev => {
      const newTemp = { ...prev };
      delete newTemp[field];
      return newTemp;
    });
  }, []);

  // 단위 토글 핸들러 (입력 중 처리 개선)
  const toggleUnit = useCallback((field: keyof UnitType) => {
    const currentUnit = units[field];
    const newUnit = currentUnit === 'px' ? '%' : 'px';

    // 현재 표시값을 새 단위로 변환
    const currentValue = displayValues[field];
    let newValue;

    if (newUnit === '%') {
      // px → % 변환
      const actualPxValue = currentUnit === 'px' ? currentValue : percentToPx(currentValue, field);
      newValue = pxToPercent(actualPxValue, field);
    } else {
      // % → px 변환
      const actualPxValue = currentUnit === '%' ? percentToPx(currentValue, field) : currentValue;
      newValue = actualPxValue;
    }

    setUnits(prev => ({ ...prev, [field]: newUnit }));

    // 단위 변환 시 입력 중으로 처리하여 값 유지
    setIsInputting(prev => ({ ...prev, [field]: true }));
    setTempInputValues(prev => ({ ...prev, [field]: Math.round(newValue * 100) / 100 }));

    // 짧은 딩레이 후 입력 완료 처리
    setTimeout(() => {
      setIsInputting(prev => ({ ...prev, [field]: false }));
      setTempInputValues(prev => {
        const newTemp = { ...prev };
        delete newTemp[field];
        return newTemp;
      });
    }, 100);
  }, [units, displayValues, percentToPx, pxToPercent]);

  const handlePropertyChange = useCallback((property: string, value: any) => {
    // 종횡비 잠금이 활성화된 경우 처리
    if (isAspectLocked && (property === 'width' || property === 'height')) {
      const aspectRatio = originalAspectRatio;

      if (property === 'width') {
        const newHeight = value / aspectRatio;
        onUpdate(clip.id, { width: value, height: newHeight });
      } else {
        const newWidth = value * aspectRatio;
        onUpdate(clip.id, { width: newWidth, height: value });
      }
    } else {
      onUpdate(clip.id, { [property]: value });
    }
  }, [clip.id, onUpdate, isAspectLocked, originalAspectRatio]);

  const handleMarginChange = useCallback((side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const newMargin = { ...positionMargin, [side]: value };
    setPositionMargin(newMargin);
    onUpdate(clip.id, { positionMargin: newMargin });
  }, [clip.id, onUpdate, positionMargin]);

  const resetTransform = () => {
    onUpdate(clip.id, {
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0
    });
  };

  const flipHorizontal = () => {
    const currentScaleX = clip.scaleX || 1;
    handlePropertyChange('scaleX', -currentScaleX);
  };

  const flipVertical = () => {
    const currentScaleY = clip.scaleY || 1;
    handlePropertyChange('scaleY', -currentScaleY);
  };

  const presetPositions = [
    { name: '좌상단', position: 'top-left' },
    { name: '상단중앙', position: 'top-center' },
    { name: '우상단', position: 'top-right' },
    { name: '좌중앙', position: 'center-left' },
    { name: '중앙', position: 'center' },
    { name: '우중앙', position: 'center-right' },
    { name: '좌하단', position: 'bottom-left' },
    { name: '하단중앙', position: 'bottom-center' },
    { name: '우하단', position: 'bottom-right' }
  ];

  const applyPresetPosition = (position: string) => {
    let newX = 0;
    let newY = 0;

    // 상하좌우 여백 적용
    switch (position) {
      case 'top-left':
        newX = positionMargin.left;
        newY = positionMargin.top;
        break;
      case 'top-center':
        newX = (projectSettings.width - clip.width) / 2;
        newY = positionMargin.top;
        break;
      case 'top-right':
        newX = projectSettings.width - clip.width - positionMargin.right;
        newY = positionMargin.top;
        break;
      case 'center-left':
        newX = positionMargin.left;
        newY = (projectSettings.height - clip.height) / 2;
        break;
      case 'center':
        newX = (projectSettings.width - clip.width) / 2;
        newY = (projectSettings.height - clip.height) / 2;
        break;
      case 'center-right':
        newX = projectSettings.width - clip.width - positionMargin.right;
        newY = (projectSettings.height - clip.height) / 2;
        break;
      case 'bottom-left':
        newX = positionMargin.left;
        newY = projectSettings.height - clip.height - positionMargin.bottom;
        break;
      case 'bottom-center':
        newX = (projectSettings.width - clip.width) / 2;
        newY = projectSettings.height - clip.height - positionMargin.bottom;
        break;
      case 'bottom-right':
        newX = projectSettings.width - clip.width - positionMargin.right;
        newY = projectSettings.height - clip.height - positionMargin.bottom;
        break;
    }

    onUpdate(clip.id, { x: newX, y: newY });
  };

  return (
    <div className="space-y-3">
      {/* 미디어 썸네일 (이미지/비디오인 경우) */}
      {(clip.mediaType === 'image' || clip.mediaType === 'video') && clip.mediaUrl && (
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium text-sm">미리보기</h4>
            <span className="text-xs text-gray-400">
              {clip.mediaType === 'image' ? '이미지' : '동영상'}
            </span>
          </div>

          <div className="flex justify-center">
            {clip.mediaType === 'image' && (
              <img
                src={clip.mediaUrl}
                alt={clip.text || '이미지 클립'}
                style={{
                  maxWidth: '200px',
                  maxHeight: '120px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  objectFit: 'cover',
                  backgroundColor: '#1a1a1a'
                }}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-red-400 text-xs text-center py-4';
                  errorDiv.textContent = '이미지 로드 실패';
                  target.parentNode?.appendChild(errorDiv);
                }}
              />
            )}

            {clip.mediaType === 'video' && (
              <video
                src={clip.mediaUrl}
                controls
                preload="metadata"
                style={{
                  maxWidth: '200px',
                  maxHeight: '120px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: '#1a1a1a'
                }}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-red-400 text-xs text-center py-4';
                  errorDiv.textContent = '비디오 로드 실패';
                  target.parentNode?.appendChild(errorDiv);
                }}
              />
            )}
          </div>

          {/* 체스트 박스 형태로 제작 정보 표시 */}
          <div className="mt-3 space-y-1">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-400">원본 크기:</div>
              <div className="text-white">{clip.width} x {clip.height}px</div>

              <div className="text-gray-400">위치:</div>
              <div className="text-white">X: {Math.round(clip.x)}, Y: {Math.round(clip.y)}</div>

              <div className="text-gray-400">회전:</div>
              <div className="text-white">{Math.round(clip.rotation || 0)}°</div>

              <div className="text-gray-400">투명도:</div>
              <div className="text-white">{Math.round((clip.opacity || 1) * 100)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* 위치, 크기, 회전, 투명도 등 기본 변형 컨트롤 */}
      <PositionTransformControls
        clip={clip as any}
        onUpdate={onUpdate as any}
        includeOpacity
        includePositionPresets
      />
      {/* 고급 옵션 토글 */}
      <div className="flex justify-end mt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAdvanced ? '기본' : '고급'}
        </button>
      </div>

      {/* 고급 옵션 */}
      {showAdvanced && (
        <div className="space-y-4 border-t border-gray-700 pt-4">

          {/* 스케일 */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">스케일 (배율)</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">X축 (가로)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={clip.scaleX || 1}
                    onChange={(e) => handlePropertyChange('scaleX', Number(e.target.value))}
                    className="flex-1 min-w-[100px]"
                  />
                  <input
                    type="number"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={clip.scaleX || 1}
                    onChange={(e) => handlePropertyChange('scaleX', Number(e.target.value))}
                    className="w-16 min-w-[60px] p-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Y축 (세로)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={clip.scaleY || 1}
                    onChange={(e) => handlePropertyChange('scaleY', Number(e.target.value))}
                    className="flex-1 min-w-[100px]"
                  />
                  <input
                    type="number"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={clip.scaleY || 1}
                    onChange={(e) => handlePropertyChange('scaleY', Number(e.target.value))}
                    className="w-16 min-w-[60px] p-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 기울임 (Skew) */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">기울임 (Skew)</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">X축</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={clip.skewX || 0}
                    onChange={(e) => handlePropertyChange('skewX', Number(e.target.value))}
                    className="flex-1 min-w-[100px]"
                  />
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {clip.skewX || 0}°
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Y축</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={clip.skewY || 0}
                    onChange={(e) => handlePropertyChange('skewY', Number(e.target.value))}
                    className="flex-1 min-w-[100px]"
                  />
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {clip.skewY || 0}°
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 앵커 포인트 */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">변형 기준점 (Anchor)</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">X (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={(clip.anchorX || 0.5) * 100}
                  onChange={(e) => handlePropertyChange('anchorX', Number(e.target.value) / 100)}
                  className="w-full min-w-[80px] p-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Y (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={(clip.anchorY || 0.5) * 100}
                  onChange={(e) => handlePropertyChange('anchorY', Number(e.target.value) / 100)}
                  className="w-full min-w-[80px] p-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                />
              </div>
            </div>

            {/* 앵커 프리셋 */}
            <div className="grid grid-cols-3 gap-1 mt-2">
              {[
                { name: '↖', x: 0, y: 0 },
                { name: '↑', x: 0.5, y: 0 },
                { name: '↗', x: 1, y: 0 },
                { name: '←', x: 0, y: 0.5 },
                { name: '●', x: 0.5, y: 0.5 },
                { name: '→', x: 1, y: 0.5 },
                { name: '↙', x: 0, y: 1 },
                { name: '↓', x: 0.5, y: 1 },
                { name: '↘', x: 1, y: 1 }
              ].map((anchor, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handlePropertyChange('anchorX', anchor.x);
                    handlePropertyChange('anchorY', anchor.y);
                  }}
                  className={`p-2 rounded text-sm transition-colors ${(clip.anchorX || 0.5) === anchor.x && (clip.anchorY || 0.5) === anchor.y
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                >
                  {anchor.name}
                </button>
              ))}
            </div>
          </div>

          {/* 블렌드 모드 */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">블렌드 모드</label>
            <select
              value={clip.blendMode || 'normal'}
              onChange={(e) => handlePropertyChange('blendMode', e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="hard-light">Hard Light</option>
              <option value="soft-light">Soft Light</option>
              <option value="difference">Difference</option>
              <option value="exclusion">Exclusion</option>
            </select>
          </div>

          {/* 플립 버튼들 */}
          <div className="space-y-2">
            <button
              onClick={flipHorizontal}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors flex items-center justify-center space-x-1"
            >
              <CornerDownLeft size={14} />
              <span>수평 뒤집기</span>
            </button>

            <button
              onClick={flipVertical}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors flex items-center justify-center space-x-1"
            >
              <CornerDownRight size={14} />
              <span>수직 뒤집기</span>
            </button>
          </div>

          {/* 리셋 버튼 */}
          <button
            onClick={resetTransform}
            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors flex items-center justify-center space-x-1"
          >
            <RotateCw size={14} />
            <span>변형 초기화</span>
          </button>
        </div>
      )}
    </div>
  );
};
