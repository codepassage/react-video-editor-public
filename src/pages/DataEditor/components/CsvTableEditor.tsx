import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Plus, Minus, Download, Upload, Table, FileText } from 'lucide-react';
import './CsvTableEditor.css';

interface CsvTableEditorProps {
  value: any;
  onChange: (data: any) => void;
}

export const CsvTableEditor: React.FC<CsvTableEditorProps> = ({ value, onChange }) => {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'text'>('table');
  const [textContent, setTextContent] = useState<string>('');
  const hasUserData = useRef(false);

  // value가 변경될 때 CSV 데이터 파싱 (최초 로딩 시에만)
  useEffect(() => {
    // 사용자가 데이터를 편집한 경우 부모로부터의 업데이트 무시
    if (hasUserData.current) {
      console.log('🚫 사용자 데이터 존재 - value 업데이트 무시');
      return;
    }

    console.log('📥 부모로부터 value 받음:', value);

    if (value && typeof value === 'object') {
      // JSON 형태의 데이터를 CSV로 변환
      if (value.data && typeof value.data === 'string') {
        console.log('📊 CSV 문자열 데이터 파싱');
        const parsed = Papa.parse(value.data, { header: false });
        if (parsed.data && parsed.data.length > 0) {
          const data = parsed.data as string[][];
          setHeaders(data[0] || []);
          setCsvData(data.slice(1));
          setTextContent(value.data);
          return;
        }
      } else if (value.headers && value.rows) {
        console.log('📊 구조화된 데이터 로딩');
        setHeaders(value.headers);
        setCsvData(value.rows);
        setTextContent(Papa.unparse([value.headers, ...value.rows]));
        return;
      }
    }
    
    // 기본값 설정 (최초 로딩 시에만)
    console.log('📊 기본 테이블 생성');
    const defaultHeaders = ['Column 1', 'Column 2'];
    const defaultData = [['', '']];
    setHeaders(defaultHeaders);
    setCsvData(defaultData);
    setTextContent(Papa.unparse([defaultHeaders, ...defaultData]));
  }, [value]);

  // 헤더와 데이터가 변경될 때 로그 출력
  useEffect(() => {
    console.log('🔄 헤더 상태 변경:', headers);
  }, [headers]);

  useEffect(() => {
    console.log('🔄 데이터 상태 변경:', csvData);
  }, [csvData]);

  // 데이터 변경 시 부모에게 알림
  const handleDataChange = (newHeaders: string[], newData: string[][]) => {
    const csvString = Papa.unparse([newHeaders, ...newData]);
    
    // 텍스트 모드가 아닐 때만 텍스트 내용 업데이트 (무한 루프 방지)
    if (viewMode === 'table') {
      setTextContent(csvString);
    }
    
    onChange({
      mapping: {},
      data: csvString,
      headers: newHeaders,
      rows: newData
    });
  };

  // 텍스트 모드에서 테이블로 파싱
  const parseTextToTable = (text: string) => {
    try {
      if (!text.trim()) {
        console.log('📝 빈 텍스트 - 기본 테이블 생성');
        const defaultHeaders = ['Column 1', 'Column 2'];
        const defaultData = [['', '']];
        setHeaders(defaultHeaders);
        setCsvData(defaultData);
        return;
      }

      console.log('📋 파싱할 텍스트:', text);

      const parsed = Papa.parse(text.trim(), { 
        header: false,
        skipEmptyLines: false,
        delimiter: ',',
        quoteChar: '"',
        escapeChar: '"'
      });
      
      console.log('🔍 전체 파싱 결과:', parsed);
      console.log('🔍 파싱된 데이터:', parsed.data);
      console.log('🔍 파싱 에러:', parsed.errors);
      
      if (parsed.data && parsed.data.length > 0) {
        const data = parsed.data as string[][];
        
        // 완전히 빈 행만 제거하고 나머지는 모두 유지
        const filteredData = data.filter(row => {
          // 배열이 존재하고, 모든 요소가 빈 문자열이 아닌 행만 필터링
          return Array.isArray(row) && row.length > 0;
        });
        
        console.log('🧹 필터링된 데이터:', filteredData);
        
        if (filteredData.length > 0) {
          const newHeaders = filteredData[0] || ['Column 1'];
          const newData = filteredData.slice(1);
          
          // 헤더와 데이터의 열 수를 맞춤
          const maxColumns = Math.max(
            newHeaders.length,
            ...newData.map(row => row.length)
          );
          
          // 헤더 보정
          const adjustedHeaders = [...newHeaders];
          while (adjustedHeaders.length < maxColumns) {
            adjustedHeaders.push(`Column ${adjustedHeaders.length + 1}`);
          }
          
          // 데이터 보정 - 모든 행의 열 수를 맞춤
          const adjustedData = newData.map(row => {
            const adjustedRow = [...row];
            while (adjustedRow.length < maxColumns) {
              adjustedRow.push('');
            }
            return adjustedRow;
          });
          
          console.log('✅ 최종 헤더:', adjustedHeaders);
          console.log('✅ 최종 데이터:', adjustedData);
          
          // 사용자 데이터 플래그 설정
          hasUserData.current = true;
          
          // 상태 업데이트를 동시에 처리
          setHeaders(adjustedHeaders);
          setCsvData(adjustedData);
          
          // 텍스트 내용도 업데이트
          const csvString = Papa.unparse([adjustedHeaders, ...adjustedData]);
          if (viewMode === 'table') {
            setTextContent(csvString);
          }
          
          // 부모 컴포넌트에 변경사항 알림
          setTimeout(() => {
            onChange({
              mapping: {},
              data: csvString,
              headers: adjustedHeaders,
              rows: adjustedData
            });
          }, 50);
          
        } else {
          console.warn('⚠️ 유효한 데이터가 없습니다');
        }
      } else {
        console.warn('⚠️ 파싱된 데이터가 없습니다');
      }
    } catch (error) {
      console.error('❌ CSV 파싱 오류:', error);
    }
  };

  // 텍스트 내용 변경
  const handleTextChange = (newText: string) => {
    setTextContent(newText);
  };

  // 모드 전환
  const switchMode = (newMode: 'table' | 'text') => {
    console.log(`🔄 모드 전환: ${viewMode} → ${newMode}`);
    
    if (newMode === 'text' && viewMode === 'table') {
      // 테이블 → 텍스트: 현재 테이블 데이터를 CSV 문자열로 변환
      const csvString = Papa.unparse([headers, ...csvData]);
      console.log('📄 테이블 → 텍스트 변환:', csvString);
      setTextContent(csvString);
      setViewMode(newMode);
    } else if (newMode === 'table' && viewMode === 'text') {
      // 텍스트 → 테이블: 텍스트 내용을 파싱해서 테이블로 변환
      console.log('📊 텍스트 → 테이블 변환 시작');
      console.log('📊 현재 textContent:', textContent);
      
      if (textContent.trim()) {
        // 모드를 먼저 전환한 후 파싱
        setViewMode(newMode);
        // 약간의 지연을 두고 파싱 실행
        setTimeout(() => {
          parseTextToTable(textContent);
        }, 10);
      } else {
        setViewMode(newMode);
      }
    } else {
      setViewMode(newMode);
    }
  };

  // 헤더 변경
  const handleHeaderChange = (index: number, newValue: string) => {
    hasUserData.current = true;
    const newHeaders = [...headers];
    newHeaders[index] = newValue;
    setHeaders(newHeaders);
    handleDataChange(newHeaders, csvData);
  };

  // 셀 값 변경
  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    hasUserData.current = true;
    const newData = [...csvData];
    if (!newData[rowIndex]) {
      newData[rowIndex] = new Array(headers.length).fill('');
    }
    newData[rowIndex][colIndex] = newValue;
    setCsvData(newData);
    handleDataChange(headers, newData);
  };

  // 행 추가
  const addRow = () => {
    const newRow = new Array(headers.length).fill('');
    const newData = [...csvData, newRow];
    setCsvData(newData);
    handleDataChange(headers, newData);
  };

  // 행 삭제
  const removeRow = (index: number) => {
    if (csvData.length <= 1) return; // 최소 1개 행 유지
    const newData = csvData.filter((_, i) => i !== index);
    setCsvData(newData);
    handleDataChange(headers, newData);
  };

  // 열 추가
  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newData = csvData.map(row => [...row, '']);
    setHeaders(newHeaders);
    setCsvData(newData);
    handleDataChange(newHeaders, newData);
  };

  // 열 삭제
  const removeColumn = (index: number) => {
    if (headers.length <= 1) return; // 최소 1개 열 유지
    const newHeaders = headers.filter((_, i) => i !== index);
    const newData = csvData.map(row => row.filter((_, i) => i !== index));
    setHeaders(newHeaders);
    setCsvData(newData);
    handleDataChange(newHeaders, newData);
  };

  // CSV 파일 불러오기
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length > 0) {
          setHeaders(data[0] || []);
          setCsvData(data.slice(1));
          handleDataChange(data[0] || [], data.slice(1));
        }
      },
      header: false
    });
  };

  // CSV 파일로 저장
  const handleDownload = () => {
    const csvString = Papa.unparse([headers, ...csvData]);
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csv-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="csv-table-editor">
      <div className="csv-editor-toolbar">
        <div className="toolbar-group">
          {/* 모드 전환 버튼 */}
          <div className="mode-switch">
            <button
              onClick={() => switchMode('table')}
              className={`mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="테이블 모드"
            >
              <Table size={14} />
              <span>테이블</span>
            </button>
            <button
              onClick={() => switchMode('text')}
              className={`mode-btn ${viewMode === 'text' ? 'active' : ''}`}
              title="텍스트 모드"
            >
              <FileText size={14} />
              <span>텍스트</span>
            </button>
          </div>
        </div>

        <div className="toolbar-group">
          {viewMode === 'table' && (
            <>
              <button onClick={addRow} className="toolbar-btn" title="행 추가">
                <Plus size={14} />
                <span>행 추가</span>
              </button>
              <button onClick={addColumn} className="toolbar-btn" title="열 추가">
                <Plus size={14} />
                <span>열 추가</span>
              </button>
            </>
          )}
        </div>
        
        <div className="toolbar-group">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="toolbar-btn" title="CSV 파일 불러오기">
            <Upload size={14} />
            <span>불러오기</span>
          </label>
          <button onClick={handleDownload} className="toolbar-btn" title="CSV 파일로 저장">
            <Download size={14} />
            <span>저장</span>
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="csv-table-container">
          <table className="csv-table" key={`table-${headers.length}-${csvData.length}`}>
            <thead>
              <tr>
                <th className="row-number-header">#</th>
                {headers.map((header, index) => (
                  <th key={index} className="csv-header">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleHeaderChange(index, e.target.value)}
                      className="header-input"
                      placeholder={`Column ${index + 1}`}
                    />
                    <button
                      onClick={() => removeColumn(index)}
                      className="remove-column-btn"
                      title="열 삭제"
                      disabled={headers.length <= 1}
                    >
                      <Minus size={12} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="row-number">
                    <span>{rowIndex + 1}</span>
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="remove-row-btn"
                      title="행 삭제"
                      disabled={csvData.length <= 1}
                    >
                      <Minus size={12} />
                    </button>
                  </td>
                  {headers.map((_, colIndex) => (
                    <td key={colIndex} className="csv-cell">
                      <input
                        type="text"
                        value={row[colIndex] || ''}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="cell-input"
                        placeholder="데이터 입력"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="csv-text-container">
          <textarea
            value={textContent}
            onChange={(e) => handleTextChange(e.target.value)}
            className="csv-text-editor"
            placeholder="CSV 텍스트를 입력하세요.&#10;&#10;예시:&#10;level 1,level 2,level 3,level 4,column&#10;audio-outer01,,,,title&#10;,template-inner-bundle:audio-01,,,trans category&#10;,template-inner-bundle:audio-04,,,source category"
            spellCheck={false}
          />
          <div className="text-mode-help">
            <div className="help-header">
              <p><strong>텍스트 모드 사용법:</strong></p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    const sampleData = `level 1,level 2,level 3,level 4,column
audio-outer01,,,,title
,template-inner-bundle:audio-01,,,trans category
,template-inner-bundle:audio-04,,,source category
,template-inner-bundle:bundle-inner-middle,,,
,template-inner-bundle:bundle-inner-middle,bundle-inner-middle:audio-02,,trans item
,template-inner-bundle:bundle-inner-middle,bundle-inner-middle:audio-03,,source item`;
                    setTextContent(sampleData);
                  }}
                  className="parse-btn"
                  style={{ background: '#10b981' }}
                  title="샘플 데이터 로드"
                >
                  📝 샘플 로드
                </button>
                <button 
                  onClick={() => parseTextToTable(textContent)}
                  className="parse-btn"
                  title="현재 텍스트를 파싱하여 테이블에 적용"
                >
                  📊 테이블에 적용
                </button>
              </div>
            </div>
            <ul>
              <li>각 행은 새 줄로 구분합니다</li>
              <li>각 열은 쉼표(,)로 구분합니다</li>
              <li>첫 번째 행은 헤더로 인식됩니다</li>
              <li>입력 완료 후 "테이블에 적용" 버튼을 클릭하거나 테이블 모드로 전환하세요</li>
            </ul>
          </div>
        </div>
      )}

      <div className="csv-info">
        <span>행: {csvData.length}개</span>
        <span>열: {headers.length}개</span>
      </div>
    </div>
  );
};