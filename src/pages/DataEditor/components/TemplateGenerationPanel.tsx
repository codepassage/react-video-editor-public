import React from 'react';
import { FileInput, Database } from 'lucide-react';

interface TemplateGenerationPanelProps {
  onUseAsTemplate: () => void;
  onUseAsResource: () => void;
  onCsvToResource: () => void;
}

export const TemplateGenerationPanel: React.FC<TemplateGenerationPanelProps> = ({
  onUseAsTemplate,
  onUseAsResource,
  onCsvToResource
}) => {
  return (
    <div className="json-import-buttons">
      <button
        onClick={onUseAsTemplate}
        className="json-import-btn"
        title="JSON 편집기의 데이터를 템플릿으로 사용"
      >
        <FileInput size={16} />
        <span>JSON → 템플릿</span>
      </button>
      <button
        onClick={onUseAsResource}
        className="json-import-btn"
        title="JSON 편집기의 데이터를 리소스로 사용"
      >
        <Database size={16} />
        <span>JSON → 리소스</span>
      </button>
      <button
        onClick={onCsvToResource}
        className="json-import-btn"
        title="CSV 파일을 리소스 데이터로 변환"
      >
        <FileInput size={16} />
        <span>CSV → 리소스</span>
      </button>
    </div>
  );
};