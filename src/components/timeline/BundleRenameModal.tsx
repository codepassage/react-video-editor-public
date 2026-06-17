import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Bundle } from '../../types';
import { useEditorStore } from '../../store/editorStore';

interface BundleRenameModalProps {
  bundle: Bundle;
  onClose: () => void;
}

export const BundleRenameModal: React.FC<BundleRenameModalProps> = ({ 
  bundle, 
  onClose 
}) => {
  const [name, setName] = useState(bundle.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateBundleMetadata } = useEditorStore();

  useEffect(() => {
    // 모달이 열리면 input에 포커스
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== bundle.name) {
      updateBundleMetadata(bundle.id, { name: trimmedName });
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
        <h3 className="text-lg font-semibold text-white mb-4">
          번들 이름 변경
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="bundle-name" className="block text-sm font-medium text-gray-300 mb-2">
              번들 이름
            </label>
            <input
              ref={inputRef}
              id="bundle-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="번들 이름 입력"
              autoComplete="off"
            />
          </div>
          
          <div className="text-sm text-gray-400 mb-6">
            현재 이름: <span className="text-gray-300 font-medium">{bundle.name}</span>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 
                       hover:bg-gray-600 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === bundle.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                       hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed 
                       rounded-md transition-colors"
            >
              변경
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Portal을 사용하여 body에 직접 렌더링
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};