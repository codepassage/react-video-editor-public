import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Move, RotateCw, Lock, Unlock } from 'lucide-react';
import { useEditorStore } from '../../../store/editorStore';

interface UnitType {
  x: 'px' | '%';
  y: 'px' | '%';
  width: 'px' | '%';
  height: 'px' | '%';
}

interface PositionTransformControlsProps {
  clip: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    positionMargin?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    positioning?: 'coordinate' | 'alignment';
    alignment?: {
      horizontal?: 'left' | 'center' | 'right';
      vertical?: 'top' | 'center' | 'bottom';
      marginTop?: number;
      marginBottom?: number;
      marginLeft?: number;
      marginRight?: number;
    };
  };
  onUpdate: (clipId: string, updates: any) => void;
  titlePrefix?: string;
  includeRotation?: boolean;
  includeSizeControls?: boolean;
  includeOpacity?: boolean;
  includePositionPresets?: boolean;
  textContext?: {
    fontSize?: number;
    lineHeight?: number;
    textContent?: string;
  };
}

export const PositionTransformControls: React.FC<PositionTransformControlsProps> = ({
  clip,
  onUpdate,
  titlePrefix = '',
  includeRotation = true,
  includeSizeControls = true,
  includeOpacity = false,
  includePositionPresets = false,
  textContext
}) => {
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
  
  // editorStore에서 projectSettings 가져오기
  const { projectSettings } = useEditorStore((state) => ({ 
    projectSettings: state.projectSettings
  }));
  
  // 단위 변환 함수들 - 프로젝트 해상도 기준으로 % 계산
  const percentToPx = useCallback((percent: number, dimension: 'x' | 'y' | 'width' | 'height') => {
    let canvasSize;
    if (dimension === 'width' || dimension === 'x') {
      canvasSize = projectSettings.width;
    } else {
      canvasSize = projectSettings.height;
    }
    return (percent / 100) * canvasSize;
  }, [projectSettings.width, projectSettings.height]);
  
  const pxToPercent = useCallback((px: number, dimension: 'x' | 'y' | 'width' | 'height') => {
    let canvasSize;
    if (dimension === 'width' || dimension === 'x') {
      canvasSize = projectSettings.width;
    } else {
      canvasSize = projectSettings.height;
    }
    return (px / canvasSize) * 100;
  }, [projectSettings.width, projectSettings.height]);
  
  // 실시간으로 표시값 계산
  const displayValues = useMemo(() => {
    const pxToPercentCalc = (px: number, dimension: 'x' | 'y' | 'width' | 'height') => {
      let canvasSize;
      if (dimension === 'width' || dimension === 'x') {
        canvasSize = projectSettings.width;
      } else {
        canvasSize = projectSettings.height;
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
  
  // 값 변경 핸들러 (coordinate 모드로 전환)
  const handleValueChange = useCallback((field: keyof UnitType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    
    setIsInputting(prev => ({ ...prev, [field]: true }));
    setTempInputValues(prev => ({ ...prev, [field]: newValue }));
    
    if (updateTimeoutRef.current[field]) {
      clearTimeout(updateTimeoutRef.current[field]!);
    }
    updateTimeoutRef.current[field] = setTimeout(() => {
      const actualPxValue = units[field] === '%' 
        ? percentToPx(newValue, field)
        : newValue;
        
      let updates: any = { [field]: actualPxValue };
      
      // x,y 좌표 수동 입력 시 coordinate 모드로 전환
      if (field === 'x' || field === 'y') {
        updates.positioning = 'coordinate';
      }
        
      // 종횡비 잠금이 활성화된 경우 처리
      if (isAspectLocked && (field === 'width' || field === 'height') && includeSizeControls) {
        const aspectRatio = originalAspectRatio;
        
        if (field === 'width') {
          const newHeight = actualPxValue / aspectRatio;
          updates = { ...updates, width: actualPxValue, height: newHeight };
        } else {
          const newWidth = actualPxValue * aspectRatio;
          updates = { ...updates, width: newWidth, height: actualPxValue };
        }
      }
      
      console.log('🔄 Manual coordinate update:', updates);
      console.log('🆔 Clip ID:', clip.id);
      onUpdate(clip.id, updates);
      
      // 업데이트 완료 후 입력 상태 정리
      setTimeout(() => {
        setIsInputting(prev => ({ ...prev, [field]: false }));
        setTempInputValues(prev => {
          const newTemp = { ...prev };
          delete newTemp[field];
          return newTemp;
        });
      }, 50);
    }, 100);
  }, [units, percentToPx, isAspectLocked, originalAspectRatio, clip.id, onUpdate, includeSizeControls]);
  
  // 단위 토글 핸들러
  const toggleUnit = useCallback((field: keyof UnitType) => {
    const currentUnit = units[field];
    const newUnit = currentUnit === 'px' ? '%' : 'px';
    
    const currentValue = displayValues[field];
    let newValue;
    
    if (newUnit === '%') {
      const actualPxValue = currentUnit === 'px' ? currentValue : percentToPx(currentValue, field);
      newValue = pxToPercent(actualPxValue, field);
    } else {
      const actualPxValue = currentUnit === '%' ? percentToPx(currentValue, field) : currentValue;
      newValue = actualPxValue;
    }
    
    setUnits(prev => ({ ...prev, [field]: newUnit }));
    
    setIsInputting(prev => ({ ...prev, [field]: true }));
    setTempInputValues(prev => ({ ...prev, [field]: Math.round(newValue * 100) / 100 }));
    
    setTimeout(() => {
      setIsInputting(prev => ({ ...prev, [field]: false }));
      setTempInputValues(prev => {
        const newTemp = { ...prev };
        delete newTemp[field];
        return newTemp;
      });
    }, 100);
  }, [units, displayValues, percentToPx, pxToPercent]);

  // 회전 값 변경 핸들러
  const handleRotationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    onUpdate(clip.id, { rotation: value });
  }, [clip.id, onUpdate]);

  // 투명도 변경 핸들러
  const handleOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    onUpdate(clip.id, { opacity: value });
  }, [clip.id, onUpdate]);

  // 개별 여백 변경 핸들러
  const handleMarginChange = useCallback((side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const currentMargin = clip.positionMargin || { top: 50, right: 50, bottom: 50, left: 50 };
    const newMargin = { ...currentMargin, [side]: value };
    onUpdate(clip.id, { positionMargin: newMargin });
  }, [clip.id, onUpdate, clip.positionMargin]);


  // 배치 버튼 핸들러 - 임시로 좌표 방식으로 테스트
  const handlePositionPreset = useCallback((position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right') => {
    const canvasWidth = projectSettings.width;
    const canvasHeight = projectSettings.height;
    const elementWidth = clip.width;
    const elementHeight = clip.height;
    const margin = clip.positionMargin || { top: 50, right: 50, bottom: 50, left: 50 };
    
    let newX = clip.x;
    let newY = clip.y;
    
    // X 좌표 계산
    switch (position) {
      case 'top-left':
      case 'center-left':
      case 'bottom-left':
        newX = margin.left;
        break;
      case 'top-center':
      case 'center':
      case 'bottom-center':
        // 여백을 고려한 중앙 계산: (전체 너비 - 좌우 여백 - 요소 너비) / 2 + 좌측 여백
        const availableWidth = canvasWidth - margin.left - margin.right;
        newX = margin.left + (availableWidth - elementWidth) / 2;
        break;
      case 'top-right':
      case 'center-right':
      case 'bottom-right':
        newX = canvasWidth - elementWidth - margin.right;
        break;
    }
    
    // Y 좌표 계산
    switch (position) {
      case 'top-left':
      case 'top-center':
      case 'top-right':
        newY = margin.top;
        break;
      case 'center-left':
      case 'center':
      case 'center-right':
        // 여백을 고려한 중앙 계산: (전체 높이 - 상하 여백 - 요소 높이) / 2 + 상단 여백
        const availableHeight = canvasHeight - margin.top - margin.bottom;
        newY = margin.top + (availableHeight - elementHeight) / 2;
        break;
      case 'bottom-left':
      case 'bottom-center':
      case 'bottom-right':
        newY = canvasHeight - elementHeight - margin.bottom;
        break;
    }
    
    const updates = { x: newX, y: newY };
    onUpdate(clip.id, updates);
  }, [clip.id, clip.x, clip.y, clip.width, clip.height, clip.positionMargin, onUpdate, projectSettings.width, projectSettings.height]);

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Move size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-white">{titlePrefix} 위치 및 크기</span>
          {/* 포지셔닝 모드 인디케이터 */}
          {textContext && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              clip.positioning === 'alignment' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}>
              {clip.positioning === 'alignment' ? '정렬' : '좌표'}
            </span>
          )}
        </div>
        {includeSizeControls && (
          <button
            onClick={() => setIsAspectLocked(!isAspectLocked)}
            className={`p-1 rounded transition-colors ${
              isAspectLocked ? 'text-blue-400' : 'text-gray-400 hover:text-white'
            }`}
            title={isAspectLocked ? '종횡비 잠금 해제' : '종횡비 잠금'}
          >
            {isAspectLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        )}
      </div>

      {/* 위치 컨트롤 */}
      <div className="grid grid-cols-2 gap-3">
        {/* X 위치 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-300">X</label>
            <button
              onClick={() => toggleUnit('x')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {units.x}
            </button>
          </div>
          <input
            type="number"
            value={Math.round(displayValues.x * 100) / 100}
            onChange={handleValueChange('x')}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            step={units.x === '%' ? 0.1 : 1}
          />
        </div>

        {/* Y 위치 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-300">Y</label>
            <button
              onClick={() => toggleUnit('y')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {units.y}
            </button>
          </div>
          <input
            type="number"
            value={Math.round(displayValues.y * 100) / 100}
            onChange={handleValueChange('y')}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            step={units.y === '%' ? 0.1 : 1}
          />
        </div>
      </div>

      {/* 크기 컨트롤 */}
      {includeSizeControls && (
        <div className="grid grid-cols-2 gap-3">
          {/* 너비 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-300">너비</label>
              <button
                onClick={() => toggleUnit('width')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {units.width}
              </button>
            </div>
            <input
              type="number"
              value={Math.round(displayValues.width * 100) / 100}
              onChange={handleValueChange('width')}
              className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              step={units.width === '%' ? 0.1 : 1}
              min={0}
            />
          </div>

          {/* 높이 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-300">높이</label>
              <button
                onClick={() => toggleUnit('height')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {units.height}
              </button>
            </div>
            <input
              type="number"
              value={Math.round(displayValues.height * 100) / 100}
              onChange={handleValueChange('height')}
              className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              step={units.height === '%' ? 0.1 : 1}
              min={0}
            />
          </div>
        </div>
      )}

      {/* 회전 컨트롤 */}
      {includeRotation && (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <RotateCw size={14} className="text-gray-400" />
            <label className="text-xs text-gray-300">회전</label>
          </div>
          <input
            type="number"
            value={clip.rotation || 0}
            onChange={handleRotationChange}
            className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            step={1}
            min={-180}
            max={180}
          />
          <div className="text-xs text-gray-400 mt-1">도 (-180 ~ 180)</div>
        </div>
      )}

      {/* 투명도 컨트롤 */}
      {includeOpacity && (
        <div>
          <label className="block text-xs text-gray-300 mb-1">투명도</label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={clip.opacity || 1}
              onChange={handleOpacityChange}
              className="flex-1"
            />
            <span className="text-white text-sm w-12">
              {Math.round((clip.opacity || 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* 위치 프리셋 컨트롤 */}
      {includePositionPresets && (
        <div>
          <label className="block text-xs text-gray-300 mb-2">위치 여백 (px)</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 w-8">상단</span>
              <input
                type="number"
                value={clip.positionMargin?.top || 50}
                onChange={(e) => handleMarginChange('top', Number(e.target.value))}
                className="w-full p-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
                min={0}
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 w-8">하단</span>
              <input
                type="number"
                value={clip.positionMargin?.bottom || 50}
                onChange={(e) => handleMarginChange('bottom', Number(e.target.value))}
                className="w-full p-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
                min={0}
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 w-8">좌측</span>
              <input
                type="number"
                value={clip.positionMargin?.left || 50}
                onChange={(e) => handleMarginChange('left', Number(e.target.value))}
                className="w-full p-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
                min={0}
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 w-8">우측</span>
              <input
                type="number"
                value={clip.positionMargin?.right || 50}
                onChange={(e) => handleMarginChange('right', Number(e.target.value))}
                className="w-full p-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
                min={0}
              />
            </div>
          </div>

          {/* 배치 위치 버튼들 */}
          <div className="mt-3">
            <label className="block text-xs text-gray-300 mb-2">배치 위치</label>
            <div className="grid grid-cols-3 gap-1">
              {/* 첫 번째 줄 */}
              <button
                onClick={() => handlePositionPreset('top-left')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                좌상단
              </button>
              <button
                onClick={() => handlePositionPreset('top-center')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                상단중앙
              </button>
              <button
                onClick={() => handlePositionPreset('top-right')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                우상단
              </button>
              
              {/* 두 번째 줄 */}
              <button
                onClick={() => handlePositionPreset('center-left')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                좌측중앙
              </button>
              <button
                onClick={() => handlePositionPreset('center')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                중앙
              </button>
              <button
                onClick={() => handlePositionPreset('center-right')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                우측중앙
              </button>
              
              {/* 세 번째 줄 */}
              <button
                onClick={() => handlePositionPreset('bottom-left')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                좌하단
              </button>
              <button
                onClick={() => handlePositionPreset('bottom-center')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                하단중앙
              </button>
              <button
                onClick={() => handlePositionPreset('bottom-right')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                우하단
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};