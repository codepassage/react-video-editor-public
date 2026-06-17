/**
 * LongSentence 속성 패널 컨테이너 - 스토어와 연결된 컴포넌트
 */

import React from 'react';
import { LongSentenceProperties } from './LongSentenceProperties';
import { LongSentenceClip } from '../../types/clipTypes';
import { useEditorStore } from '../../store/editorStore';

interface LongSentencePropertiesContainerProps {
  clip: LongSentenceClip;
}

export const LongSentencePropertiesContainer: React.FC<LongSentencePropertiesContainerProps> = ({
  clip
}) => {
  const {
    updateClip,
    convertLongSentence,
    previewLongSentenceSplit,
    deleteChildClips
  } = useEditorStore();

  const handleUpdate = (updates: Partial<LongSentenceClip>) => {
    updateClip(clip.id, updates);
  };

  const handlePreviewSplit = async (text: string, options: any) => {
    try {
      const result = await previewLongSentenceSplit(text, options);
      return result;
    } catch (error) {
      console.error('분할 미리보기 실패:', error);
      throw error;
    }
  };

  const handleConvert = () => {
    convertLongSentence(clip.id);
  };

  const handleDeleteChildClips = () => {
    deleteChildClips(clip.id);
  };

  return (
    <LongSentenceProperties
      clip={clip}
      onUpdate={handleUpdate}
      onPreviewSplit={handlePreviewSplit}
      onConvert={handleConvert}
      onDeleteChildClips={handleDeleteChildClips}
    />
  );
};

export default LongSentencePropertiesContainer;