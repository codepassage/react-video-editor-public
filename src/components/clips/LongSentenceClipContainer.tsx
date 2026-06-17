/**
 * LongSentence 클립 컨테이너 - 스토어와 연결된 컴포넌트
 */

import React from 'react';
import { LongSentenceClipComponent } from './LongSentenceClip';
import { LongSentenceClip } from '../../types/clipTypes';
import { useEditorStore } from '../../store/editorStore';
import { globalAlert } from '../../utils/globalAlert';

interface LongSentenceClipContainerProps {
  clip: LongSentenceClip;
  className?: string;
}

export const LongSentenceClipContainer: React.FC<LongSentenceClipContainerProps> = ({
  clip,
  className
}) => {
  const {
    updateClip,
    convertLongSentence,
    removeClip,
    selectClip,
    openPropertiesPanel
  } = useEditorStore();

  const handleConvert = (clipId: string) => {
    convertLongSentence(clipId);
  };

  const handleTextChange = (clipId: string, text: string) => {
    updateClip(clipId, { text });
  };

  const handleSettingsChange = (clipId: string, settings: Partial<LongSentenceClip>) => {
    updateClip(clipId, settings);
  };

  const handlePreview = (clipId: string) => {
    // 클립 선택 및 속성 패널 열기
    selectClip(clipId);
    openPropertiesPanel(clipId);
  };

  const handleDelete = async (clipId: string) => {
    const confirmed = await globalAlert.confirmDanger('이 LongSentence 클립을 삭제하시겠습니까?');
    if (confirmed) {
      removeClip(clipId);
    }
  };

  return (
    <LongSentenceClipComponent
      clip={clip}
      onConvert={handleConvert}
      onTextChange={handleTextChange}
      onSettingsChange={handleSettingsChange}
      onPreview={handlePreview}
      onDelete={handleDelete}
      className={className}
    />
  );
};

export default LongSentenceClipContainer;