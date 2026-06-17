import React, { useState, useEffect } from 'react';
import { Database, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { ModalDialog } from './ModalDialog';
import './RelationshipStyles.css';

interface ResourceTemplate {
  id: string;
  name: string;
  description?: string;
  versions: Array<{
    id: string;
    version: number;
    versionString: string;
    templateData: any;
  }>;
}

interface CsvColumnMap {
  id: string;
  name: string;
  description?: string;
  versions: Array<{
    id: string;
    version: number;
    versionString: string;
    mappingData: any;
  }>;
}

interface CsvToResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (resourceData: any) => void;
  preSelectedCsvMapId?: string | null;
}

export const CsvToResourceModal: React.FC<CsvToResourceModalProps> = ({
  isOpen,
  onClose,
  onConvert,
  preSelectedCsvMapId
}) => {
  // Database-based state
  const [resourceTemplates, setResourceTemplates] = useState<ResourceTemplate[]>([]);
  const [csvColumnMaps, setCsvColumnMaps] = useState<CsvColumnMap[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedMappingId, setSelectedMappingId] = useState<string>('');
  const [csvDataFile, setCsvDataFile] = useState<File | null>(null);

  // Processing state
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadResourceTemplates();
      loadCsvColumnMaps();

      // Set pre-selected CSV map if provided
      if (preSelectedCsvMapId) {
        setSelectedMappingId(preSelectedCsvMapId);
      }
    }
  }, [isOpen, preSelectedCsvMapId]);

  const loadResourceTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/resource-templates');
      if (response.ok) {
        const data = await response.json();
        setResourceTemplates(data);
        console.log('✅ 리소스 템플릿 로드됨:', data.length, '개');
      } else {
        console.error('❌ 리소스 템플릿 로드 실패');
      }
    } catch (error) {
      console.error('❌ 리소스 템플릿 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCsvColumnMaps = async () => {
    try {
      const response = await fetch('/api/csv-column-maps');
      if (response.ok) {
        const data = await response.json();
        setCsvColumnMaps(data);
        console.log('✅ CSV 컬럼 맵 로드됨:', data.length, '개');
      } else {
        console.error('❌ CSV 컬럼 맵 로드 실패');
      }
    } catch (error) {
      console.error('❌ CSV 컬럼 맵 로드 오류:', error);
    }
  };

  const handleCsvDataFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setCsvDataFile(null);
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError('CSV 파일만 업로드할 수 있습니다.');
      return;
    }

    setCsvDataFile(file);
    setError('');
    event.target.value = '';
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleConvert = async () => {
    if (!selectedTemplateId || !selectedMappingId || !csvDataFile) {
      setError('모든 항목을 선택/업로드해주세요.');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      // Get selected template data
      const selectedTemplate = resourceTemplates.find(t => t.id === selectedTemplateId);
      console.log('🔍 선택된 템플릿:', selectedTemplate);
      console.log('🔍 첫 번째 버전:', selectedTemplate?.versions?.[0]);
      const templateData = selectedTemplate?.versions?.[0]?.templateData;
      console.log('🔍 템플릿 데이터:', templateData);

      if (!templateData || !templateData.items || !Array.isArray(templateData.items)) {
        throw new Error('선택된 템플릿 데이터를 찾을 수 없습니다.');
      }

      // Get selected mapping data
      const selectedMapping = csvColumnMaps.find(m => m.id === selectedMappingId);
      const mappingData = selectedMapping?.versions?.[0]?.mappingData;
      console.log('🔍 전체 mappingData 구조:', mappingData);

      if (!mappingData) {
        throw new Error('선택된 매핑 데이터를 찾을 수 없습니다.');
      }

      // Read CSV file
      const csvContent = await readFileAsText(csvDataFile);

      // Parse CSV content to object array
      const csvLines = csvContent.split('\n').filter(line => line.trim());
      const headers = csvLines[0].split(',').map(h => h.trim());
      const csvData = csvLines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        // Convert to object with headers as keys
        const rowObject: {[key: string]: string} = {};
        headers.forEach((header, index) => {
          rowObject[header] = values[index] || '';
        });
        return rowObject;
      });

      // Use pre-parsed mapping data from database
      const mappingObjects = (mappingData.rows || []).map((row: string[]) => {
        const rowObject: {[key: string]: string} = {};
        (mappingData.headers || []).forEach((header: string, index: number) => {
          rowObject[header] = row[index] || '';
        });
        return rowObject;
      });

      // Prepare conversion request
      const conversionRequest = {
        template: templateData,
        mapping: mappingObjects,
        csvData: csvData
      };

      console.log('🔄 변환 요청 시작:', {
        templateName: selectedTemplate?.name,
        mappingName: selectedMapping?.name,
        csvFileName: csvDataFile.name
      });

      // Call conversion API
      const response = await fetch('/api/auto-generate/csv-to-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversionRequest)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '변환 중 오류가 발생했습니다.');
      }

      if (result.success) {
        console.log('✅ 변환 성공:', result);
        setPreview(result.resourceData);

        // 미리보기 후 바로 적용하거나 확인 후 적용하도록 선택
        onConvert(result.resourceData);
        onClose();
      } else {
        throw new Error(result.error || '변환에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ 변환 오류:', error);
      setError(error instanceof Error ? error.message : '변환 중 오류가 발생했습니다.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleClose = () => {
    if (isConverting) return;

    // Reset state
    setSelectedTemplateId('');
    setSelectedMappingId('');
    setCsvDataFile(null);
    setError('');
    setPreview(null);

    onClose();
  };

  const canConvert = selectedTemplateId && selectedMappingId && csvDataFile && !isConverting;

  const footer = (
    <>
      <button
        className="cancel-button"
        onClick={handleClose}
        disabled={isConverting}
      >
        취소
      </button>
      <div className="footer-actions">
        <button
          className="save-button"
          onClick={handleConvert}
          disabled={!canConvert}
        >
          {isConverting ? (
            <>
              <div className="button-spinner" />
              변환 중...
            </>
          ) : (
            <>
              <Database size={16} />
              변환하기
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="CSV → 리소스 데이터 변환"
      footer={footer}
      size="large"
      autoHeight={true}
    >
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>데이터를 불러오는 중...</span>
        </div>
      ) : (
        <>
          {error && (
            <div style={{
              background: '#3f1b1b',
              border: '1px solid #7f1d1d',
              borderRadius: '0',
              padding: '12px',
              marginBottom: '16px',
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingTop: '16px', paddingBottom: '24px', width: '100%', boxSizing: 'border-box' }}>
        {/* 1. 리소스 데이터 템플릿 선택 */}
        <div className="entity">
          <div className="entity-header">
            <FileText size={16} />
            <h4>1. 리소스 데이터 템플릿 (JSON)</h4>
          </div>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="entity-select"
            disabled={loading || isConverting}
          >
            <option value="">템플릿을 선택하세요</option>
            {resourceTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.description && `- ${template.description}`}
              </option>
            ))}
          </select>
          {selectedTemplateId && (
            <div className="selected-info">
              ✓ 선택됨: {resourceTemplates.find(t => t.id === selectedTemplateId)?.name}
            </div>
          )}
        </div>

        {/* 2. CSV 컬럼 맵 선택 */}
        <div className="entity">
          <div className="entity-header">
            <FileText size={16} />
            <h4>2. CSV 컬럼 맵 (CSV)</h4>
          </div>
          <select
            value={selectedMappingId}
            onChange={(e) => setSelectedMappingId(e.target.value)}
            className="entity-select"
            disabled={loading || isConverting}
          >
            <option value="">CSV 컬럼 맵을 선택하세요</option>
            {csvColumnMaps.map((mapping) => (
              <option key={mapping.id} value={mapping.id}>
                {mapping.name} {mapping.description && `- ${mapping.description}`}
              </option>
            ))}
          </select>
          {selectedMappingId && (
            <div className="selected-info">
              ✓ 선택됨: {csvColumnMaps.find(m => m.id === selectedMappingId)?.name}
            </div>
          )}
        </div>

        {/* 3. CSV 데이터 업로드 */}
        <div className="entity">
          <div className="entity-header">
            <FileText size={16} />
            <h4>3. CSV 데이터 (CSV)</h4>
          </div>
          <div style={{
            border: '2px dashed #444a5a',
            borderRadius: '0',
            padding: '24px',
            textAlign: 'center',
            background: '#181c22'
          }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvDataFileChange}
              style={{ display: 'none' }}
              id="csv-data-upload"
              disabled={isConverting}
            />
            <label
              htmlFor="csv-data-upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '0',
                cursor: isConverting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isConverting ? 0.5 : 1
              }}
            >
              <FileText size={16} />
              CSV 파일 선택
            </label>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              변환할 CSV 데이터 파일을 선택하세요
            </div>
          </div>
          {csvDataFile && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: '#1f3a2e',
              borderRadius: '0',
              fontSize: '12px',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle size={14} />
              업로드됨: {csvDataFile.name}
            </div>
          )}
        </div>

        {/* 변환 결과 미리보기 */}
        {preview && (
          <div className="entity">
            <div className="entity-header">
              <CheckCircle size={16} />
              <h4>변환 결과 미리보기</h4>
            </div>
            <div style={{
              background: '#181c22',
              border: '1px solid #444a5a',
              borderRadius: '0',
              padding: '12px',
              fontSize: '12px',
              fontFamily: 'monospace',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <div style={{ color: '#10b981', marginBottom: '8px' }}>
                ✅ 성공적으로 변환되었습니다!
              </div>
              <div style={{ color: '#f5f6fa' }}>
                항목 개수: {preview.items?.length || 0}개
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '8px' }}>
                {JSON.stringify(preview, null, 2).slice(0, 300)}...
              </div>
            </div>
          </div>
        )}

          </div>
        </>
      )}
    </ModalDialog>
  );
};