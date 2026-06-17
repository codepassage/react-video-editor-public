import { SentenceClip } from '../../../types';

export interface SentenceEditorProps {
  clip: SentenceClip;
  onUpdate: (clipId: string, updates: Partial<SentenceClip>) => void;
}

export interface SegmentManagerProps {
  clip: SentenceClip;
  selectedText: TextSelection | null;
  editingSegmentId: string | null;
  onUpdate: (clipId: string, updates: Partial<SentenceClip>) => void;
  onCreateSegment: () => void;
  onEditSegment: (segmentId: string | null) => void;
  onDeleteSegment: (segmentId: string, event?: React.MouseEvent) => void;
  onUpdateSegmentStyle: (segmentId: string, styleUpdates: Partial<SentenceClip['textSegments'][0]['style']>) => void;
}

export interface FontSelectorProps {
  fontFamily: string;
  onFontSelect: (fontFamily: string) => void;
  className?: string;
  disabled?: boolean;
}

export interface GradientEditorProps {
  backgroundColor: string;
  onChange: (backgroundColor: string) => void;
}

export interface TextPreviewProps {
  clip: SentenceClip;
  previewMode: boolean;
}

export interface StylePresetsProps {
  onApplyPreset: (segmentId: string, presetKey: string) => void;
}

export interface BasicTextControlsProps {
  clip: SentenceClip;
  onStyleChange: (property: string, value: any) => void;
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export interface GradientStop {
  color: string;
  position: number;
}

export interface TextBounds {
  width: number;
  height: number;
  lines: string[];
}

export interface StylePreset {
  name: string;
  style: Partial<SentenceClip['textSegments'][0]['style']>;
}

export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
