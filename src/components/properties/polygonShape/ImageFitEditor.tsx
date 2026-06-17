/**
 * 다각형 셰이프의 이미지 핏 편집기 컴포넌트
 * @description 다각형 셰이프에 적용된 배경 이미지의 크기 조정 방식과 위치를 설정하는 전용 UI 컴포넌트
 * 
 * 주요 기능:
 * - 이미지 핏 모드 선택 (fill, contain, cover, none, scale-down)
 * - 이미지 위치 조정 (9방향 정렬 지원)
 * - CSS object-fit 속성 기반의 직관적인 설명 제공
 * - 실시간 속성 업데이트 및 미리보기 지원
 * 
 * 사용 사례:
 * - 배경 이미지가 있는 다각형 셰이프의 표시 방식 조정
 * - 이미지 비율과 셰이프 비율 간의 불일치 해결
 * - 디자인 의도에 맞는 이미지 크롭 및 정렬 설정
 */

import React from 'react';
import type { PolygonShapeProperties } from '../../../types/polygonShape.types';

/**
 * ImageFitEditor 컴포넌트의 Props 인터페이스
 * @interface ImageFitEditorProps
 */
interface ImageFitEditorProps {
  /** 현재 배경 이미지 핏 모드 */
  backgroundFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  /** 배경 이미지 핏 모드 변경 콜백 */
  setBackgroundFit: (fit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down') => void;
  /** 현재 배경 이미지 위치 */
  backgroundPosition: string;
  /** 배경 이미지 위치 변경 콜백 */
  setBackgroundPosition: (position: string) => void;
  /** 다각형 셰이프 속성 업데이트 콜백 */
  updatePolygonShapeProperties: (updates: Partial<PolygonShapeProperties>) => void;
}

/**
 * 다각형 셰이프의 이미지 핏 편집기 컴포넌트
 * 
 * CSS object-fit 속성을 기반으로 한 5가지 핏 모드를 제공:
 * - fill: 요소 크기에 맞게 이미지를 늘림 (비율 변경 가능)
 * - contain: 이미지 전체가 보이도록 비율 유지하며 크기 조정
 * - cover: 요소를 가득 채우도록 비율 유지하며 크기 조정 (크롭 발생 가능)
 * - none: 이미지 원본 크기 유지
 * - scale-down: none과 contain 중 더 작은 크기 선택
 * 
 * @param props - ImageFitEditor 컴포넌트 속성
 * @returns 이미지 핏 편집 UI 컴포넌트
 */
export const ImageFitEditor: React.FC<ImageFitEditorProps> = ({
  backgroundFit,
  setBackgroundFit,
  backgroundPosition,
  setBackgroundPosition,
  updatePolygonShapeProperties
}) => {
  return (
    <>
      {/* 이미지 핏 헤더 */}
      <div>
        <h4 className="text-white text-lg font-medium mb-1">이미지 핏</h4>
      </div>

      {/* Fill 드롭다운 */}
      <div className="space-y-2">
        <select
          value={backgroundFit}
          onChange={(e) => {
            setBackgroundFit(e.target.value as any);
            updatePolygonShapeProperties({ backgroundFit: e.target.value as any });
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="fill">Fill - 요소에 딱 맞게 늘이기 (찌그러짐)</option>
          <option value="contain">Contain - 전체가 보이도록 크기 조절</option>
          <option value="cover">Cover - 영역을 가득 채우도록 크기 조절</option>
          <option value="none">None - 원본 크기 그대로</option>
          <option value="scale-down">Scale-down - none과 contain 중 작은 쪽</option>
        </select>

        {/* 설명 텍스트 */}
        <div className="text-xs text-gray-400">
          이미지가 요소의 너비와 높이에 딱 맞게 찌그러지더라도 맞춤
        </div>
      </div>

      {/* 이미지 위치 */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">이미지 위치</label>
        <select
          value={backgroundPosition}
          onChange={(e) => {
            setBackgroundPosition(e.target.value);
            updatePolygonShapeProperties({ backgroundPosition: e.target.value });
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>
    </>
  );
};