import React from 'react';
import { useEditorStore } from '../../store/editorStore';

/**
 * 무한루프 방지 상태를 표시하는 인디케이터
 */
export const InfiniteLoopIndicator: React.FC = () => {
  const { isLoopBlocked } = useEditorStore();

  if (!isLoopBlocked) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg border border-red-500">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        <div>
          <div className="font-medium">무한루프 방지 활성화</div>
          <div className="text-sm opacity-90">Ctrl+ESC로 해제</div>
        </div>
      </div>
    </div>
  );
};