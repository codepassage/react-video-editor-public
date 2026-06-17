import React, { useEffect, useRef, useCallback } from 'react';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
  mode?: 'tree' | 'code' | 'text' | 'preview';
  readOnly?: boolean;
  className?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  mode = 'code',
  readOnly = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const isUpdatingRef = useRef(false);

  const handleChange = useCallback(() => {
    if (!editorRef.current || isUpdatingRef.current) return;
    
    try {
      const newValue = editorRef.current.get();
      onChange(newValue);
    } catch (error) {
      console.warn('JSON Editor: Invalid JSON', error);
    }
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const options: JSONEditorOptions = {
      mode,
      modes: ['tree', 'code', 'text', 'preview'],
      search: true,
      history: true,
      navigationBar: true,
      statusBar: true,
      onChange: handleChange,
      onChangeJSON: handleChange,
      onChangeText: handleChange,
      onError: (error) => {
        console.error('JSON Editor Error:', error);
      }
    };

    if (readOnly) {
      options.mode = 'preview';
      options.modes = ['preview'];
    }

    // JSONEditor 인스턴스 생성
    editorRef.current = new JSONEditor(containerRef.current, options);

    // 초기 값 설정
    if (value !== undefined && value !== null) {
      isUpdatingRef.current = true;
      try {
        editorRef.current.set(value);
      } catch (error) {
        console.warn('JSON Editor: Failed to set initial value', error);
        editorRef.current.setText(JSON.stringify(value, null, 2));
      }
      isUpdatingRef.current = false;
    }

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
      const currentValue = editorRef.current.get();
      if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
        isUpdatingRef.current = true;
        editorRef.current.set(value);
        isUpdatingRef.current = false;
      }
    } catch (error) {
      // JSON 파싱 오류 시 텍스트로 설정
      isUpdatingRef.current = true;
      editorRef.current.setText(JSON.stringify(value, null, 2));
      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <div 
      ref={containerRef} 
      className={`json-editor-wrapper ${className}`}
      style={{ height: '100%', width: '100%' }}
    />
  );
};