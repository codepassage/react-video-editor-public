import React from 'react';
import { Play, Download, FileJson, Video, FileInput, Database, Upload, Layers, Volume2 } from 'lucide-react';

interface EditorControlsProps {
  useNestedForm: boolean;
  onToggleNestedForm: () => void;
  onGenerateTTS: () => void;
  onTransform: () => void;
  onRender: () => void;
  onSaveAsJson: () => void;
  onSendToVideoEditor: () => void;
  isGeneratingTTS: boolean;
  isTransforming: boolean;
  isRendering: boolean;
  hasResourceData: boolean;
  hasTemplate: boolean;
  hasTransformResult: boolean;
  currentDataType: 'resource' | 'template' | 'csv-map';
}

export const EditorControls: React.FC<EditorControlsProps> = ({
  useNestedForm,
  onToggleNestedForm,
  onGenerateTTS,
  onTransform,
  onRender,
  onSaveAsJson,
  onSendToVideoEditor,
  isGeneratingTTS,
  isTransforming,
  isRendering,
  hasResourceData,
  hasTemplate,
  hasTransformResult,
  currentDataType
}) => {
  return (
    <div className="auto-gen-header">
      <h1>🎬 자동 비디오 생성</h1>
      <div className="action-buttons">
        <button
          onClick={onToggleNestedForm}
          className={`action-btn ${useNestedForm ? 'info' : 'secondary'}`}
          title={`현재: ${useNestedForm ? '중첩' : '일반'} 폼`}
        >
          <Layers size={16} />
          <span>{useNestedForm ? '중첩' : '일반'} 폼</span>
        </button>

        <button
          onClick={onGenerateTTS}
          disabled={isGeneratingTTS || !hasResourceData || currentDataType !== 'resource'}
          className="action-btn secondary"
          title="리소스 데이터에서 TTS 오디오 파일 생성 (리소스 데이터일 때만 사용 가능)"
        >
          <Volume2 size={16} />
          <span>TTS 생성</span>
        </button>

        <button
          onClick={onTransform}
          disabled={isTransforming || !hasTemplate || currentDataType !== 'resource'}
          className="action-btn primary"
          title={currentDataType !== 'resource' ? '리소스 데이터일 때만 변환 가능합니다' : ''}
        >
          <Play size={16} />
          <span>변환 실행</span>
        </button>

        {hasTransformResult && (
          <>
            <button
              onClick={onRender}
              disabled={isRendering}
              className="action-btn success"
            >
              <Video size={16} />
              <span>동영상 렌더링</span>
            </button>

            <button
              onClick={onSaveAsJson}
              className="action-btn secondary"
            >
              <Download size={16} />
              <span>JSON으로 저장</span>
            </button>

            <button
              onClick={onSendToVideoEditor}
              className="action-btn info"
            >
              <FileJson size={16} />
              <span>에디터로 전송</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};