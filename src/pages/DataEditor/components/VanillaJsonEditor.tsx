import React, { useEffect, useRef, useCallback } from 'react';
import { createJSONEditor, JSONEditor, Content, OnChange, OnChangeStatus } from 'vanilla-jsoneditor';

interface VanillaJsonEditorProps {
  value: any;
  onChange: (value: any) => void;
  mode?: 'tree' | 'text' | 'table';
  readOnly?: boolean;
  className?: string;
}

export const VanillaJsonEditor: React.FC<VanillaJsonEditorProps> = ({
  value,
  onChange,
  mode = 'text',
  readOnly = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const isUpdatingRef = useRef(false);

  const handleChange = useCallback((content: Content, previousContent: Content, status: OnChangeStatus) => {
    if (isUpdatingRef.current) return;
    
    try {
      let newValue: any;
      
      if (content.json !== undefined) {
        // JSON 모드
        newValue = content.json;
      } else if (content.text !== undefined) {
        // 텍스트 모드 - JSON 파싱 시도
        try {
          newValue = JSON.parse(content.text);
        } catch (error) {
          // 파싱 실패 시 텍스트 그대로 저장 (유효성 검사는 에디터에서 처리)
          return;
        }
      }
      
      onChange(newValue);
    } catch (error) {
      console.warn('Vanilla JSON Editor: Error processing change', error);
    }
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('🔧 VanillaJsonEditor initializing with value:', value);
    
    const options = {
      target: containerRef.current,
      props: {
        content: { json: value },
        mode: mode,
        readOnly: readOnly,
        onChange: handleChange,
        onError: (error: Error) => {
          console.error('Vanilla JSON Editor Error:', error);
        },
        onFocus: () => {
          // 포커스 시 필요한 로직
        },
        onBlur: () => {
          // 블러 시 필요한 로직
        }
      }
    };

    // VanillaJSONEditor 인스턴스 생성
    editorRef.current = createJSONEditor(options);

    // 정리 함수
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []); // 빈 의존성 배열로 한 번만 초기화

  // value prop이 외부에서 변경될 때 에디터 업데이트
  useEffect(() => {
    if (!editorRef.current || isUpdatingRef.current) return;

    try {
      isUpdatingRef.current = true;
      
      console.log('🔧 VanillaJsonEditor updating with value:', value);
      
      // VanillaJsonEditor의 content 형식 확인
      console.log('🔧 Trying to update with content format:', { json: value });
      console.log('🔧 value type:', typeof value, 'value:', value);
      
      editorRef.current.update({
        content: { json: value }
      });
    } catch (error) {
      console.error('Vanilla JSON Editor: Failed to update value', error);
      console.error('Problematic value:', value);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [value]);

  // mode 변경 처리
  useEffect(() => {
    if (!editorRef.current) return;

    try {
      editorRef.current.updateProps({
        mode: mode
      });
    } catch (error) {
      console.warn('Vanilla JSON Editor: Failed to update mode', error);
    }
  }, [mode]);

  return (
    <div 
      ref={containerRef} 
      className={`vanilla-json-editor-wrapper ${className}`}
      style={{ height: '100%', width: '100%' }}
    />
  );
};