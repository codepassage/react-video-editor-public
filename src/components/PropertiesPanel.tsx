/**
 * ⚙️ PropertiesPanel.tsx - 클립 속성 편집 패널 컴포넌트
 * 
 * 선택된 클립의 속성을 편집할 수 있는 종합적인 속성 패널 컴포넌트입니다.
 * 8가지 클립 타입에 따라 동적으로 적절한 편집 인터페이스를 제공하며,
 * Union 타입 시스템을 활용한 타입 안전한 속성 편집을 지원합니다.
 * 
 * 주요 기능:
 * - 8가지 클립 타입별 맞춤형 편집 인터페이스
 * - 실시간 속성 변경 및 미리보기
 * - 탭 기반 카테고리별 속성 그룹화
 * - 기준 클립 및 일반 클립 구분 처리
 * - 다중 클립 선택 시 공통 속성 편집
 * - 클립 삭제 및 이름 변경 기능
 * 
 * 지원하는 클립 타입:
 * - AudioClip: 볼륨, 재생 속도, TTS 설정
 * - VideoClip: 변형, 효과, 오디오 속성
 * - ImageClip: 위치, 크기, 변형, 효과
 * - TextClip: 텍스트, 폰트, 스타일, 위치
 * - SentenceClip: 세그먼트별 스타일링
 * - LongSentenceClip: 데이터 편집, TTS 설정
 * - ShapeClip: 도형 속성, SVG 편집
 * - SimpleShapeClip/PolygonShapeClip: 기본 도형 스타일링
 * 
 * 편집 카테고리:
 * 1. 기본 정보: 이름, 타입, 시간 정보
 * 2. 텍스트: 내용, 폰트, 스타일
 * 3. 변형: 위치, 크기, 회전, 스케일
 * 4. 효과: 투명도, 블렌드 모드, 필터
 * 5. 오디오: 볼륨, 재생 속도
 * 6. 도형: 색상, 그라데이션, 테두리
 * 
 * 상태 관리:
 * - selectedClips: 선택된 클립 목록
 * - activeTab: 현재 활성 편집 탭
 * - 클립별 개별 상태 관리
 * - 실시간 변경 사항 반영
 * 
 * 타입 안전성:
 * - Union 타입 기반 타입 가드 사용
 * - 런타임 타입 체크 및 검증
 * - TypeScript 컴파일 타임 검사
 * - 안전한 속성 접근 보장
 * 
 * 사용자 경험:
 * - 직관적인 탭 기반 네비게이션
 * - 실시간 미리보기 연동
 * - 키보드 단축키 지원
 * - 다국어 지원 (한국어/영어)
 * 
 * 성능 최적화:
 * - 선택 클립 변경 시에만 리렌더링
 * - 탭별 지연 로딩
 * - 메모이제이션 활용
 * - 불필요한 상태 업데이트 방지
 * 
 * 관련 모듈:
 * - 2번 모듈: Clip Type System (8가지 클립 타입)
 * - editorStore: 클립 선택 및 편집 상태
 * - 각종 Editor 컴포넌트들 (Text, Transform, Effects 등)
 * - clipGuards: 타입 안전한 클립 판별
 */

import React, { useState, useEffect } from 'react';
import { Settings, Type, Image, Video, Music, Palette, Move, RotateCw, X, Shapes } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { 
  NewTimelineClip,
  isBaseClip
} from '../types';
// 🆕 Union 타입 기반 향상된 타입 가드 함수들과 유틸리티 함수들
import { 
  isVisualClip, 
  isAudioClip, 
  hasAudioProperties, 
  isTextClip,
  isVideoClip,
  isImageClip,
  isShapeClip,
  isSimpleShapeClip,
  isPolygonShapeClip,
  hasTextProperties,
  hasShapeProperties
} from '../types/clipGuards';
import { isSentenceClip } from '../types';
import { getClipDisplayName, setClipVolume } from '../types/clipUtils';
import { TextEditor } from './properties/TextEditor';
import { SentenceEditor } from './properties/SentenceEditor';
import { LongSentencePropertiesContainer } from './properties/LongSentencePropertiesContainer';
import { TransformEditor } from './properties/TransformEditor';
import { PositionTransformControls } from './properties/shared/PositionTransformControls';
import { EffectsEditor } from './properties/EffectsEditor';
import { ShapeEditor } from './properties/ShapeEditor';
import { SimpleShapeEditor } from './properties/SimpleShapeEditor';
import { PolygonShapeEditor } from './properties/PolygonShapeEditor';
import AudioPropertiesPanel from './properties/audio/AudioPropertiesPanel';
import TextPropertiesPanel from './properties/text/TextPropertiesPanel';
import VideoPropertiesPanel from './properties/video/VideoPropertiesPanel';
import ImagePropertiesPanel from './properties/image/ImagePropertiesPanel';
import { ClipNameEditor } from './common/ClipNameEditor';
import { ClipInfoViewer } from './properties/shared/ClipInfoViewer';
import { DynamicPropertiesEditor } from './properties/DynamicPropertiesEditor';
import { PropertySection } from './properties/shared/PropertySection';
import './properties/audio/AudioPropertiesPanel.css';
import './properties/text/TextPropertiesPanel.css';
import './properties/video/VideoPropertiesPanel.css';
import './properties/image/ImagePropertiesPanel.css';

export const PropertiesPanel: React.FC = () => {
  const { 
    selectedClip, 
    selectedControl,
    selectedMediaItem,
    isPropertiesPanelOpen, 
    closePropertiesPanel, 
    updateClip,
    updateMediaLibraryControl,
    updateMediaItem 
  } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'properties' | 'project'>('properties');
  
  // 속성 패널이 열려있지 않으면 렌더링하지 않음
  if (!isPropertiesPanelOpen || (!selectedClip && !selectedControl && !selectedMediaItem)) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 shadow-lg z-50 overflow-y-auto text-white">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">속성 패널</h2>
          
          <button
            onClick={closePropertiesPanel}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
            title="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 선택된 아이템 정보 */}
        <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
          <div className="text-xl">
            {selectedClip && (
              <>
                {selectedClip.mediaType === 'text' && <Type />}
                {selectedClip.mediaType === 'sentence' && <span className="text-2xl">📄</span>}
                {selectedClip.mediaType === 'image' && <Image />}
                {selectedClip.mediaType === 'video' && <Video />}
                {selectedClip.mediaType === 'audio' && <Music />}
                {selectedClip.mediaType === 'shape' && <Shapes />}
                {selectedClip.mediaType === 'simpleShape' && <span className="text-2xl">🧪</span>}
                {selectedClip.mediaType === 'polygonShape' && <span className="text-2xl">🔷</span>}
              </>
            )}
            {selectedControl && <Settings />}
            {selectedMediaItem && (
              <>
                {selectedMediaItem.type === 'text' && <Type />}
                {selectedMediaItem.type === 'image' && <Image />}
                {selectedMediaItem.type === 'video' && <Video />}
                {selectedMediaItem.type === 'audio' && <Music />}
                {selectedMediaItem.type === 'shape' && <Shapes />}
              </>
            )}
          </div>
          <div>
            <div className="text-white font-medium">
              {selectedClip && (
                // 🆕 getClipDisplayName 함수 사용으로 name 속성 우선 표시
                getClipDisplayName(selectedClip)
              )}
              {selectedControl && `컨트롤: ${selectedControl.label}`}
              {selectedMediaItem && `미디어: ${selectedMediaItem.name}`}
            </div>
            <div className="text-gray-400 text-sm">
              {selectedClip && `${selectedClip.duration.toFixed(2)}초`}
              {selectedControl && `타입: ${selectedControl.type}`}
              {selectedMediaItem && `타입: ${selectedMediaItem.type}`}
            </div>
          </div>
        </div>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 - 타이틀 고정을 위한 구조 개선 */}
      <div className="flex-1 overflow-y-auto">
        {/* 클립 편집 UI */}
        {selectedClip && (
          <>
            {/* 🎵 Audio 클립 전용 인터페이스 */}
            {isAudioClip(selectedClip) ? (
              <>
                {/* 클립 정보 섹션 - 모든 클립에 추가 */}
                <PropertySection
                  title="클립 정보"
                  icon={<span className="text-lg">📋</span>}
                >
                  <ClipNameEditor clip={selectedClip} onUpdate={updateClip} />
                  <div className="mt-4">
                    <ClipInfoViewer clip={selectedClip} onUpdate={updateClip} />
                  </div>
                </PropertySection>
                
                {/* Dynamic Properties 섹션 */}
                <PropertySection
                  title="Dynamic Properties"
                  icon={<span className="text-lg">⚡</span>}
                >
                  <DynamicPropertiesEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>
                
                <AudioPropertiesPanel 
                  clip={selectedClip} 
                  onUpdate={updateClip} 
                />
              </>
            ) : isTextClip(selectedClip) ? (
              /* 📝 Text 클립 전용 인터페이스 - 스크린샷과 동일한 구조 */
              <>
                {/* 클립 정보 섹션 - 모든 클립에 추가 */}
                <PropertySection
                  title="클립 정보"
                  icon={<span className="text-lg">📋</span>}
                >
                  <ClipNameEditor clip={selectedClip} onUpdate={updateClip} />
                  <div className="mt-4">
                    <ClipInfoViewer clip={selectedClip} onUpdate={updateClip} />
                  </div>
                </PropertySection>
                
                {/* Dynamic Properties 섹션 */}
                <PropertySection
                  title="Dynamic Properties"
                  icon={<span className="text-lg">⚡</span>}
                >
                  <DynamicPropertiesEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>
                
                {/* 📝 Text 편집 섹션 */}
                <PropertySection
                  title="텍스트 편집"
                  icon={<Type size={16} />}
                >
                  <TextPropertiesPanel 
                    clip={selectedClip} 
                    onUpdate={updateClip} 
                  />
                </PropertySection>
                
                {/* ✨ 효과 및 애니메이션 - 스크린샷의 '효과 & 애니메이션' 섹션 */}
                <PropertySection
                  title="효과 & 애니메이션"
                  icon={<Palette size={16} />}
                >
                  <EffectsEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>
              </>
            ) : isSentenceClip(selectedClip) ? (
              /* 📄 Sentence 클립 전용 인터페이스 */
              <>
                {/* 클립 정보 섹션 - 모든 클립에 추가 */}
                <PropertySection
                  title="클립 정보"
                  icon={<span className="text-lg">📋</span>}
                >
                  <ClipNameEditor clip={selectedClip} onUpdate={updateClip} />
                  <div className="mt-4">
                    <ClipInfoViewer clip={selectedClip} onUpdate={updateClip} />
                  </div>
                </PropertySection>
                
                {/* Dynamic Properties 섹션 */}
                <PropertySection
                  title="Dynamic Properties"
                  icon={<span className="text-lg">⚡</span>}
                >
                  <DynamicPropertiesEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>
                
                {/* 📄 Sentence 편집 섹션 */}
                <PropertySection
                  title="Sentence 편집"
                  icon={<span className="text-xl">📄</span>}
                >
                  <SentenceEditor 
                    clip={selectedClip} 
                    onUpdate={updateClip} 
                  />
                </PropertySection>
                
                {/* ✨ 효과 및 애니메이션 - 스크린샷의 '효과 & 애니메이션' 섹션 */}
                <PropertySection
                  title="효과 & 애니메이션"
                  icon={<Palette size={16} />}
                >
                  <EffectsEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>
              </>
            ) : selectedClip.mediaType === 'longsentence' ? (
              /* 📖 LongSentence 클립 전용 인터페이스 */
              <>
                {/* 클립 정보 섹션 */}
                <PropertySection
                  title="클립 정보"
                  icon={<span className="text-lg">📋</span>}
                >
                  <ClipNameEditor clip={selectedClip} onUpdate={updateClip} />
                  <div className="mt-4">
                    <ClipInfoViewer clip={selectedClip} onUpdate={updateClip} />
                  </div>
                </PropertySection>
                
                {/* Dynamic Properties 섹션 */}
                <PropertySection
                  title="Dynamic Properties"
                  icon={<span className="text-lg">⚡</span>}
                >
                  <DynamicPropertiesEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>
                
                {/* 📖 LongSentence 편집 섹션 */}
                <PropertySection
                  title="긴 문장 편집"
                  icon={<span className="text-xl">📖</span>}
                >
                  <LongSentencePropertiesContainer clip={selectedClip as any} />
                </PropertySection>
              </>
            ) : isVideoClip(selectedClip) ? (
              /* 🎬 Video 클립 전용 인터페이스 */
              <>
                {/* 클립 정보 섹션 - 모든 클립에 추가 */}
                <PropertySection
                  title="클립 정보"
                  icon={<span className="text-lg">📋</span>}
                >
                  <ClipNameEditor clip={selectedClip} onUpdate={updateClip} />
                  <div className="mt-4">
                    <ClipInfoViewer clip={selectedClip} onUpdate={updateClip} />
                  </div>
                </PropertySection>
                
                {/* Dynamic Properties 섹션 */}
                <PropertySection
                  title="Dynamic Properties"
                  icon={<span className="text-lg">⚡</span>}
                >
                  <DynamicPropertiesEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>
                
                <VideoPropertiesPanel 
                  clip={selectedClip} 
                  onUpdate={updateClip} 
                />
              </>
            ) : isImageClip(selectedClip) ? (
              /* 🖼️ Image 클립 전용 인터페이스 */
              <>
                {/* 클립 정보 섹션 - 모든 클립에 추가 */}
                <PropertySection
                  title="클립 정보"
                  icon={<span className="text-lg">📋</span>}
                >
                  <ClipNameEditor clip={selectedClip} onUpdate={updateClip} />
                  <div className="mt-4">
                    <ClipInfoViewer clip={selectedClip} onUpdate={updateClip} />
                  </div>
                </PropertySection>
                
                {/* Dynamic Properties 섹션 */}
                <PropertySection
                  title="Dynamic Properties"
                  icon={<span className="text-lg">⚡</span>}
                >
                  <DynamicPropertiesEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>
                
                <ImagePropertiesPanel 
                  clip={selectedClip} 
                  onUpdate={updateClip} 
                />
              </>
            ) : (
              <>
                <PropertySection
                  title="클립 정보"
                  icon={<span className="text-lg">📋</span>}
                >
                  <ClipNameEditor clip={selectedClip} onUpdate={updateClip} />
                  <div className="mt-4">
                    <ClipInfoViewer clip={selectedClip} onUpdate={updateClip} />
                  </div>
                </PropertySection>

                {/* Dynamic Properties 섹션 */}
                <PropertySection
                  title="Dynamic Properties"
                  icon={<span className="text-lg">⚡</span>}
                >
                  <DynamicPropertiesEditor clip={selectedClip} onUpdate={updateClip} />
                </PropertySection>

                {/* Shape 편집 (Shape 클립인 경우) */}
                {isShapeClip(selectedClip) && selectedClip.mediaType === 'shape' && (
                  <PropertySection
                    title="Shape 편집"
                    icon={<Shapes size={16} />}
                  >
                    <ShapeEditor clip={selectedClip} onUpdate={updateClip} />
                  </PropertySection>
                )}

                {/* SimpleShape 편집 (SimpleShape 클립인 경우) */}
                {isSimpleShapeClip(selectedClip) && (
                  <PropertySection
                    title="SimpleShape 테스트"
                    icon={<span className="text-lg">🧪</span>}
                  >
                    <SimpleShapeEditor clip={selectedClip} onUpdate={updateClip} />
                  </PropertySection>
                )}

                {/* PolygonShape 편집 (PolygonShape 클립인 경우) */}
                {isPolygonShapeClip(selectedClip) && (
                  <PropertySection
                    title="PolygonShape 편집"
                    icon={<span className="text-lg">🔷</span>}
                  >
                    <PolygonShapeEditor clip={selectedClip} onUpdate={updateClip} />
                  </PropertySection>
                )}

                {/* 변형 속성 (시각적 클립만, Video/Image 클립 제외) */}
                {isVisualClip(selectedClip) && !isVideoClip(selectedClip) && !isImageClip(selectedClip) && (
                  <PropertySection
                    title="변형 & 위치"
                    icon={<Move size={16} />}
                  >
                    <TransformEditor clip={selectedClip} onUpdate={updateClip} />
                  </PropertySection>
                )}

                {/* 효과 및 애니메이션 (시각적 클립만, Video/Image 클립 제외) */}
                {isVisualClip(selectedClip) && !isVideoClip(selectedClip) && !isImageClip(selectedClip) && (
                  <PropertySection
                    title="효과 & 애니메이션"
                    icon={<Palette size={16} />}
                  >
                    <EffectsEditor clip={selectedClip} onUpdate={updateClip} />
                  </PropertySection>
                )}

                {/* 미디어별 특수 속성 (오디오 속성이 있는 클립만, Audio/Video/Image 클립 제외) */}
                {hasAudioProperties(selectedClip) && !isAudioClip(selectedClip) && !isVideoClip(selectedClip) && !isImageClip(selectedClip) && (
                  <PropertySection
                    title="미디어 속성"
                    icon={<Music size={16} />}
                  >
                    <MediaPropertiesEditor clip={selectedClip} onUpdate={updateClip} />
                  </PropertySection>
                )}
              </>
            )}
          </>
        )}
        
        {/* 컨트롤 편집 UI */}
        {selectedControl && (
          <PropertySection
            title="컨트롤 편집"
            icon={<Settings size={16} />}
          >
            <ControlEditor 
              control={selectedControl} 
              onUpdate={updateMediaLibraryControl} 
            />
          </PropertySection>
        )}
        
        {/* 미디어 아이템 편집 UI - 클립 편집과 동일한 인터페이스 */}
        {selectedMediaItem && (
          <>
            {/* 미디어 아이템 기본 정보 */}
            <PropertySection
              title="미디어 기본 설정"
              icon={
                <>
                  {selectedMediaItem.type === 'text' && <Type size={16} />}
                  {selectedMediaItem.type === 'image' && <Image size={16} />}
                  {selectedMediaItem.type === 'video' && <Video size={16} />}
                  {selectedMediaItem.type === 'audio' && <Music size={16} />}
                </>
              }
            >
              <MediaItemBasicEditor mediaItem={selectedMediaItem} onUpdate={updateMediaItem} />
            </PropertySection>
            
            {/* 텍스트 편집 (텍스트 아이템인 경우) */}
            {selectedMediaItem.type === 'text' && (
              <PropertySection
                title="텍스트 편집"
                icon={<Type size={16} />}
              >
                <TextEditor clip={selectedMediaItem} onUpdate={(id, updates) => updateMediaItem(id, updates)} />
              </PropertySection>
            )}

            {/* Shape 편집 (Shape 아이템인 경우) */}
            {selectedMediaItem.type === 'shape' && (
              <PropertySection
                title="Shape 편집"
                icon={<Shapes size={16} />}
              >
                <ShapeEditor clip={selectedMediaItem} onUpdate={(id, updates) => updateMediaItem(id, updates)} />
              </PropertySection>
            )}

            {/* 변형 속성 (시각적 아이템만) */}
            {selectedMediaItem.type !== 'audio' && (
              <PropertySection
                title="변형 & 위치"
                icon={<Move size={16} />}
              >
                <TransformEditor clip={selectedMediaItem} onUpdate={(id, updates) => updateMediaItem(id, updates)} />
              </PropertySection>
            )}

            {/* 효과 및 애니메이션 (시각적 아이템만) */}
            {selectedMediaItem.type !== 'audio' && (
              <PropertySection
                title="효과 & 애니메이션"
                icon={<Palette size={16} />}
              >
                <EffectsEditor clip={selectedMediaItem} onUpdate={(id, updates) => updateMediaItem(id, updates)} />
              </PropertySection>
            )}

            {/* 미디어별 특수 속성 (오디오 속성이 있는 아이템만) */}
            {(selectedMediaItem.type === 'video' || selectedMediaItem.type === 'audio') && (
              <PropertySection
                title="미디어 속성"
                icon={<Music size={16} />}
              >
                <MediaPropertiesEditor clip={selectedMediaItem} onUpdate={(id, updates) => updateMediaItem(id, updates)} />
              </PropertySection>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// 미디어 아이템 기본 편집기
const MediaItemBasicEditor: React.FC<{
  mediaItem: any;
  onUpdate: (mediaItemId: string, updates: any) => void;
}> = ({ mediaItem, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-white font-medium flex items-center space-x-2">
        {mediaItem.type === 'text' && <Type size={16} />}
        {mediaItem.type === 'image' && <Image size={16} />}
        {mediaItem.type === 'video' && <Video size={16} />}
        {mediaItem.type === 'audio' && <Music size={16} />}
        <span>미디어 기본 설정</span>
      </h3>

      {/* 이름 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">이름</label>
        <input
          type="text"
          value={mediaItem.name || ''}
          onChange={(e) => onUpdate(mediaItem.id, { name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          placeholder="미디어 이름"
        />
      </div>

      {/* 기본 크기 설정 (오디오 아이템 제외) */}
      {mediaItem.type !== 'audio' && (
        <div>
          <h4 className="text-white font-medium mb-2">기본 크기</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">너비</label>
              <input
                type="number"
                value={mediaItem.width || (mediaItem.type === 'text' ? 400 : 1920)}
                onChange={(e) => onUpdate(mediaItem.id, { width: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                min="10"
                max="3840"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">높이</label>
              <input
                type="number"
                value={mediaItem.height || (mediaItem.type === 'text' ? 100 : 1080)}
                onChange={(e) => onUpdate(mediaItem.id, { height: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                min="10"
                max="2160"
              />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            이 크기는 타임라인에 드래그할 때 기본값으로 사용됩니다.
          </p>
        </div>
      )}

      {/* 미디어 정보 */}
      <div>
        <h4 className="text-white font-medium mb-2">미디어 정보</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <div>타입: <span className="text-white">{mediaItem.type}</span></div>
          {mediaItem.duration && (
            <div>재생시간: <span className="text-white">{mediaItem.duration.toFixed(2)}초</span></div>
          )}
          {mediaItem.fileSize && (
            <div>파일크기: <span className="text-white">{(mediaItem.fileSize / 1024 / 1024).toFixed(2)}MB</span></div>
          )}
        </div>
      </div>

      {/* 미리보기 */}
      {mediaItem.url && (mediaItem.type === 'image' || mediaItem.type === 'video') && (
        <div>
          <h4 className="text-white font-medium mb-2">미리보기</h4>
          
          {mediaItem.type === 'image' && (
            <div className="flex justify-center">
              <img
                src={mediaItem.url}
                alt={mediaItem.name}
                style={{
                  maxWidth: '200px',
                  maxHeight: '150px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {mediaItem.type === 'video' && (
            <div className="flex justify-center">
              <video
                src={mediaItem.url}
                controls
                style={{
                  maxWidth: '200px',
                  maxHeight: '150px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 미디어 속성 편집기
const MediaPropertiesEditor: React.FC<{
  clip: any;
  onUpdate: (clipId: string, updates: any) => void;
}> = ({ clip, onUpdate }) => (
  <div className="space-y-4">
    <h3 className="text-white font-medium flex items-center space-x-2">
      <Music size={16} />
      <span>오디오/비디오 설정</span>
    </h3>

    {/* 볼륨 */}
    <div>
      <label className="block text-sm text-gray-300 mb-2">볼륨</label>
      <div className="flex items-center space-x-3">
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={clip.volume || 1}
          onChange={(e) => {
            // 🆕 setClipVolume 유틸리티 함수 사용으로 안전한 볼륨 설정
            const volumeUpdates = setClipVolume(clip, Number(e.target.value));
            if (Object.keys(volumeUpdates).length > 0) {
              onUpdate(clip.id, volumeUpdates);
            }
          }}
          className="flex-1"
        />
        <span className="text-white text-sm w-12">
          {Math.round((clip.volume || 1) * 100)}%
        </span>
      </div>
    </div>

    {/* 재생 속도 */}
    <div>
      <label className="block text-sm text-gray-300 mb-2">재생 속도</label>
      <div className="flex items-center space-x-3">
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={clip.playbackRate || 1}
          onChange={(e) => onUpdate(clip.id, { playbackRate: Number(e.target.value) })}
          className="flex-1"
        />
        <span className="text-white text-sm w-12">
          {clip.playbackRate || 1}×
        </span>
      </div>
    </div>
  </div>
);

// 컨트롤 편집기
const ControlEditor: React.FC<{
  control: any;
  onUpdate: (controlId: string, updates: any) => void;
}> = ({ control, onUpdate }) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      <h3 className="text-white font-medium flex items-center space-x-2">
        <Settings size={16} />
        <span>컨트롤 설정</span>
      </h3>

      {/* 기본 정보 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">레이블</label>
          <input
            type="text"
            value={control.label}
            onChange={(e) => onUpdate(control.id, { label: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="버튼 텍스트"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">아이콘 (이모지)</label>
          <input
            type="text"
            value={control.icon}
            onChange={(e) => onUpdate(control.id, { icon: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="🚀"
            maxLength={4}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">활성화</label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={control.isEnabled}
              onChange={(e) => onUpdate(control.id, { isEnabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-white">버튼 표시</span>
          </label>
        </div>
      </div>

      {/* 스타일 설정 */}
      <div className="space-y-4">
        <h4 className="text-white font-medium flex items-center space-x-2">
          <Palette size={16} />
          <span>스타일</span>
        </h4>

        <div>
          <label className="block text-sm text-gray-300 mb-2">텍스트 색상</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={control.color}
              onChange={(e) => onUpdate(control.id, { color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={control.color}
              onChange={(e) => onUpdate(control.id, { color: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">배경 그라디언트</label>
          <textarea
            value={control.gradient}
            onChange={(e) => onUpdate(control.id, { gradient: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm h-20"
            placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">테두리 색상</label>
          <input
            type="text"
            value={control.borderColor}
            onChange={(e) => onUpdate(control.id, { borderColor: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
            placeholder="rgba(102, 126, 234, 0.4)"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">그림자 색상</label>
          <input
            type="text"
            value={control.shadowColor}
            onChange={(e) => onUpdate(control.id, { shadowColor: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
            placeholder="rgba(102, 126, 234, 0.3)"
          />
        </div>
      </div>

      {/* 미리보기 */}
      <div className="space-y-4">
        <h4 className="text-white font-medium">미리보기</h4>
        <div
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: `1px solid ${control.borderColor}`,
            background: control.gradient,
            color: control.color,
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 4px 15px ${control.shadowColor}`,
            cursor: 'not-allowed'
          }}
        >
          <span style={{ fontSize: '16px' }}>{control.icon}</span>
          <span>{control.label}</span>
        </div>
      </div>

      {/* 커스텀 액션 (custom 타입인 경우) */}
      {control.type === 'custom' && (
        <div className="space-y-4">
          <h4 className="text-white font-medium">커스텀 액션</h4>
          <div>
            <label className="block text-sm text-gray-300 mb-2">액션 코드</label>
            <textarea
              value={control.customAction || ''}
              onChange={(e) => onUpdate(control.id, { customAction: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm h-24"
              placeholder="console.log('커스텀 액션 실행!');"
            />
          </div>
        </div>
      )}
    </div>
  );
};
