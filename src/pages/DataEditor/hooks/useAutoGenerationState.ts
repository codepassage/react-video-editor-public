/**
 * 🔄 useAutoGenerationState.ts - 자동 생성 시스템 상태 관리 훅
 * 
 * CSV 데이터 기반 자동 비디오 생성 시스템의 복잡한 상태를 통합 관리하는 커스텀 훅
 * 템플릿 호환성 검증, 데이터 변환, TTS 생성, 렌더링 등 모든 단계의 상태를 중앙화
 * 
 * 관리하는 상태 영역:
 * - 템플릿 선택 및 호환성 검증
 * - CSV → 프로젝트 데이터 변환 결과
 * - TTS 음성 생성 진행 상태
 * - 비디오 렌더링 진행 상태
 * - UI 모달 및 편집기 상태
 * - 중첩 폼 및 리소스 매핑 설정
 * 
 * 특징:
 * - 22개 상태를 하나의 훅으로 통합 관리
 * - AutoGenerationView의 복잡한 워크플로우 지원
 * - 상태 간 의존성을 고려한 구조화
 * - 개발자 친화적인 명명 규칙
 * 
 * 워크플로우:
 * 1. 템플릿 선택 → 호환성 검증
 * 2. CSV 데이터 로드 → 변환 실행
 * 3. TTS 생성 → 최종 렌더링
 * 4. 각 단계별 진행 상태 표시
 */

import { useState, useRef } from 'react';
import { TransformResult } from '../../../types/autoGeneration';

/**
 * AutoGenerationView의 메인 상태 관리 Hook
 */
export const useAutoGenerationState = () => {
  // 템플릿 및 변환 관련 상태
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);           // 선택된 템플릿 (호환성 검증 완료)
  const [transformResult, setTransformResult] = useState<TransformResult | null>(null); // CSV → 프로젝트 변환 결과
  const [isTransforming, setIsTransforming] = useState(false);                         // 데이터 변환 진행 중
  const [isRendering, setIsRendering] = useState(false);                               // 비디오 렌더링 진행 중
  
  // 편집기 관련 상태
  const [showResourceJson, setShowResourceJson] = useState(true);                      // 리소스 JSON 표시 여부
  const [jsonEditorType, setJsonEditorType] = useState<'classic' | 'modern'>('modern'); // JSON 편집기 타입
  const [showJsonEditor, setShowJsonEditor] = useState(true);                          // JSON 편집기 표시 여부
  
  // 모달 관련 상태
  const [resourceModalOpen, setResourceModalOpen] = useState(false);                   // 리소스 로드/저장 모달
  const [resourceModalMode, setResourceModalMode] = useState<'load' | 'save'>('load'); // 리소스 모달 모드
  const [compatibilityModalOpen, setCompatibilityModalOpen] = useState(false);         // 호환성 검증 결과 모달
  const [transformResultModalOpen, setTransformResultModalOpen] = useState(false);     // 변환 결과 상세 모달
  const [csvModalOpen, setCsvModalOpen] = useState(false);                             // CSV 매핑 설정 모달
  
  // 폼 및 설정 상태
  const [useNestedForm, setUseNestedForm] = useState(false);                           // 중첩 폼 사용 여부
  const [refreshCompatibleResources, setRefreshCompatibleResources] = useState(0);     // 호환 리소스 새로고침 트리거
  
  // TTS 관련 상태
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);                       // TTS 음성 생성 진행 중
  const [ttsResults, setTtsResults] = useState<any>(null);                             // TTS 생성 결과
  
  // CSV 관련 상태
  const [selectedCsvMapId, setSelectedCsvMapId] = useState<string | null>(null);       // 선택된 CSV 매핑 ID

  return {
    // 템플릿 및 변환 (템플릿 선택부터 데이터 변환까지)
    selectedTemplate,           // 호환성 검증된 템플릿
    setSelectedTemplate,
    transformResult,            // CSV → 프로젝트 변환 결과
    setTransformResult,
    isTransforming,             // 변환 진행 상태
    setIsTransforming,
    isRendering,                // 렌더링 진행 상태
    setIsRendering,
    
    // 편집기 (JSON 편집 및 리소스 관리)
    showResourceJson,           // 리소스 JSON 표시
    setShowResourceJson,
    jsonEditorType,             // 편집기 타입 (classic/modern)
    setJsonEditorType,
    showJsonEditor,             // 편집기 표시 여부
    setShowJsonEditor,
    
    // 모달 (각종 다이얼로그 상태)
    resourceModalOpen,          // 리소스 로드/저장
    setResourceModalOpen,
    resourceModalMode,          // 모달 모드 (load/save)
    setResourceModalMode,
    compatibilityModalOpen,     // 호환성 검증 결과
    setCompatibilityModalOpen,
    transformResultModalOpen,   // 변환 결과 상세
    setTransformResultModalOpen,
    csvModalOpen,               // CSV 매핑 설정
    setCsvModalOpen,
    
    // 폼 및 설정 (고급 옵션)
    useNestedForm,              // 중첩 폼 사용
    setUseNestedForm,
    refreshCompatibleResources, // 새로고침 트리거
    setRefreshCompatibleResources,
    
    // TTS (음성 생성)
    isGeneratingTTS,            // TTS 생성 진행
    setIsGeneratingTTS,
    ttsResults,                 // TTS 결과
    setTtsResults,
    
    // CSV (데이터 매핑)
    selectedCsvMapId,           // 선택된 매핑 ID
    setSelectedCsvMapId,
  };
};