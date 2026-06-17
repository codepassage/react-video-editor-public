// Main component
export { default as SentenceEditor } from './SentenceEditor';

// Sub components
export { FontSelector } from './FontSelector';
export { TextPreview } from './TextPreview';
export { StylePresetsGrid, stylePresets } from './StylePresets';
export { GradientEditor } from './GradientEditor';
export { SegmentManager } from './SegmentManager';
export { BasicTextControls } from './BasicTextControls';

// Hooks
export { useTextMetrics } from './hooks/useTextMetrics';
export { useSegmentManager } from './hooks/useSegmentManager';

// Types
export type {
  SentenceEditorProps,
  SegmentManagerProps,
  FontSelectorProps,
  GradientEditorProps,
  TextPreviewProps,
  StylePresetsProps,
  BasicTextControlsProps,
  TextSelection,
  GradientStop,
  TextBounds,
  StylePreset,
  FontCategory
} from './types';
