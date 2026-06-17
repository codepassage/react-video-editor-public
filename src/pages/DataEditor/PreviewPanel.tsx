import React, { useState } from 'react';
import { globalAlert } from '../../utils/globalAlert';
import { Eye, Download, AlertCircle, CheckCircle, Loader, FileText, Clock } from 'lucide-react';
import { TransformResult } from '../../types/autoGeneration';

interface PreviewPanelProps {
  transformResult: TransformResult | null;
  isTransforming: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  transformResult,
  isTransforming
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'json'>('summary');
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const renderSummary = () => {
    if (!transformResult?.success || !transformResult.transformedData) {
      return null;
    }

    const data = transformResult.transformedData;
    const clipCount = data.tracks?.reduce((acc: number, track: any) => 
      acc + (track.clips?.length || 0), 0) || 0;
    const bundleCount = data.bundles?.length || 0;
    const templateGroupCount = data.templateGroups?.length || 0;
    const ttsFilesCount = Object.keys(transformResult.ttsFiles || {}).length;

    // 총 재생 시간 계산
    const totalDuration = data.tracks?.reduce((maxDuration: number, track: any) => {
      const trackDuration = track.clips?.reduce((max: number, clip: any) => 
        Math.max(max, clip.endTime || 0), 0) || 0;
      return Math.max(maxDuration, trackDuration);
    }, 0) || 0;

    return (
      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="text-green-600" size={20} />
            <h3 className="font-semibold text-green-900">변환 완료</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">총 클립:</span>
              <span className="ml-2 font-medium">{clipCount}개</span>
            </div>
            <div>
              <span className="text-gray-600">번들:</span>
              <span className="ml-2 font-medium">{bundleCount}개</span>
            </div>
            <div>
              <span className="text-gray-600">TTS 파일:</span>
              <span className="ml-2 font-medium">{ttsFilesCount}개</span>
            </div>
            <div>
              <span className="text-gray-600">재생 시간:</span>
              <span className="ml-2 font-medium">{totalDuration.toFixed(2)}초</span>
            </div>
          </div>
        </div>

        {/* TTS 파일 목록 */}
        {ttsFilesCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">생성된 TTS 파일</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(transformResult.ttsFiles || {}).map(([clipId, url]) => (
                <div key={clipId} className="flex items-center justify-between">
                  <span className="text-blue-700 truncate">{clipId.slice(-8)}</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    듣기
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 트랙별 정보 */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">트랙별 클립 정보</h4>
          {data.tracks?.map((track: any, index: number) => (
            <div key={track.id || index} className="bg-gray-50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{track.name || `Track ${index + 1}`}</span>
                <span className="text-xs text-gray-500">{track.clips?.length || 0}개 클립</span>
              </div>
              
              {track.clips && track.clips.length > 0 && (
                <div className="space-y-1">
                  {track.clips.slice(0, 3).map((clip: any, clipIndex: number) => (
                    <div key={clip.id || clipIndex} className="text-xs text-gray-600 flex justify-between">
                      <span className="truncate">{clip.name || `Clip ${clipIndex + 1}`}</span>
                      <span>{clip.mediaType}</span>
                    </div>
                  ))}
                  {track.clips.length > 3 && (
                    <div className="text-xs text-gray-500">
                      ... 및 {track.clips.length - 3}개 더
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 번들 정보 */}
        {bundleCount > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">번들 정보</h4>
            {data.bundles?.map((bundle: any, index: number) => (
              <div key={bundle.id || index} className="bg-purple-50 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{bundle.name || `Bundle ${index + 1}`}</span>
                  <span className="text-xs text-purple-700">
                    {bundle.startTime?.toFixed(2)}s - {bundle.endTime?.toFixed(2)}s
                  </span>
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {bundle.baseClipIds?.length || 0}개 기준클립
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderJson = () => {
    if (!transformResult?.success || !transformResult.transformedData) {
      return null;
    }

    const jsonString = JSON.stringify(transformResult.transformedData, null, 2);
    const previewLength = jsonExpanded ? jsonString.length : Math.min(1000, jsonString.length);
    const previewJson = jsonString.substring(0, previewLength);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">변환된 JSON 데이터</h4>
          <div className="flex space-x-2">
            <button
              onClick={() => setJsonExpanded(!jsonExpanded)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              {jsonExpanded ? '접기' : '전체보기'}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(jsonString);
                globalAlert.showInfo('클립보드에 복사되었습니다');
              }}
              className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
            >
              복사
            </button>
          </div>
        </div>
        
        <div className="bg-gray-900 text-green-400 text-xs p-3 rounded font-mono overflow-auto max-h-96">
          <pre>{previewJson}</pre>
          {!jsonExpanded && jsonString.length > 1000 && (
            <div className="text-gray-500 mt-2">
              ... ({jsonString.length - 1000}자 더)
            </div>
          )}
        </div>
      </div>
    );
  };

  const downloadResult = () => {
    if (!transformResult?.transformedData) return;

    const dataStr = JSON.stringify(transformResult.transformedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `transformed-project-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="preview-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">미리보기</h2>
        
        {transformResult?.success && (
          <div className="flex space-x-2">
            <div className="flex border rounded">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1 text-sm ${
                  viewMode === 'summary' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Eye size={14} className="inline mr-1" />
                요약
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1 text-sm ${
                  viewMode === 'json' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText size={14} className="inline mr-1" />
                JSON
              </button>
            </div>
            
            <button
              onClick={downloadResult}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download size={14} />
              <span className="text-sm">다운로드</span>
            </button>
          </div>
        )}
      </div>

      <div className="content">
        {isTransforming ? (
          <div className="text-center py-12">
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
            <p className="text-gray-600">변환 중입니다...</p>
            <p className="text-sm text-gray-500 mt-2">
              TTS 파일 생성 및 데이터 변환이 진행 중입니다
            </p>
          </div>
        ) : !transformResult ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto mb-4" size={32} />
            <p>변환 결과가 여기에 표시됩니다</p>
            <p className="text-sm mt-2">
              템플릿과 리소스를 설정한 후 변환 버튼을 클릭하세요
            </p>
          </div>
        ) : transformResult.success ? (
          viewMode === 'summary' ? renderSummary() : renderJson()
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="text-red-600" size={20} />
              <h3 className="font-semibold text-red-900">변환 실패</h3>
            </div>
            <p className="text-red-700 text-sm">{transformResult.error}</p>
            <div className="mt-3 text-xs text-red-600">
              <p>다음 사항을 확인해주세요:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>템플릿이 올바르게 선택되었는지</li>
                <li>리소스 데이터의 이름이 템플릿의 클립/번들 이름과 일치하는지</li>
                <li>Dynamic Properties가 설정된 클립들이 있는지</li>
                <li>TTS 언어 코드가 올바른지 (ko, en 등)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};