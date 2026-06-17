import React from 'react';
import { isBaseClip } from '../../../types';

// 클립 정보 뷰어 컴포넌트 - 모든 클립 타입에서 공통으로 사용
export const ClipInfoViewer: React.FC<{
  clip: any;
  onUpdate?: (clipId: string, updates: any) => void;
}> = ({ clip, onUpdate }) => {
  const isBaseClipValue = isBaseClip(clip);

  return (
    <div className="space-y-4">
      <h3 className="text-white font-medium flex items-center space-x-2">
        <span className="text-lg">📋</span>
        <span>클립 정보</span>
        {isBaseClipValue && (
          <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full font-bold">
            🛡️ 기준클립
          </span>
        )}
        {!isBaseClipValue && clip.regularClipProperties && (
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-bold">
            🔗 일반클립
          </span>
        )}
      </h3>

      {/* 기본 정보 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">클립 ID:</span>
          <span className="text-white font-mono text-sm bg-gray-700 px-2 py-1 rounded">
            {clip.id}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">미디어 타입:</span>
          <span className="text-white text-sm bg-gray-700 px-2 py-1 rounded">
            {clip.mediaType}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">시간 범위:</span>
          <span className="text-white font-mono text-sm bg-gray-700 px-2 py-1 rounded">
            {clip.startTime.toFixed(2)}s ~ {clip.endTime.toFixed(2)}s ({clip.duration.toFixed(2)}s)
          </span>
        </div>
      </div>

      {/* 기준클립 정보 */}
      {isBaseClipValue && (
        <div className="space-y-3">
          <h4 className="text-orange-400 font-medium flex items-center space-x-2">
            <span>🛡️</span>
            <span>기준클립 속성</span>
          </h4>

          <div className="bg-gray-900 p-3 rounded-lg border border-orange-600/30">
            <pre className="text-xs text-orange-300 font-mono whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify({
                id: clip.id,
                baseClipProperties: clip.baseClipProperties
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 일반클립 정보 */}
      {!isBaseClipValue && clip.regularClipProperties && (
        <div className="space-y-3">
          <h4 className="text-blue-400 font-medium flex items-center space-x-2">
            <span>🔗</span>
            <span>일반클립 속성</span>
          </h4>

          <div className="bg-gray-900 p-3 rounded-lg border border-blue-600/30">
            <pre className="text-xs text-blue-300 font-mono whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify({
                isBaseClip: clip.regularClipProperties.isBaseClip,
                dynamicProperties: clip.regularClipProperties.dynamicProperties,
                startAnchor: clip.regularClipProperties.startAnchor,
                endAnchor: clip.regularClipProperties.endAnchor,
                startAnchorExtended: clip.regularClipProperties.startAnchorExtended,
                endAnchorExtended: clip.regularClipProperties.endAnchorExtended,
                staticDuration: clip.regularClipProperties.staticDuration
              }, null, 2)}
            </pre>
          </div>

          {/* 연결 상태 요약 */}
          <div className="space-y-2">
            <h5 className="text-blue-300 font-medium text-sm">연결 상태 요약:</h5>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {/* 기존 앵커 (기준클립) */}
              {clip.regularClipProperties.startAnchor && (
                <div className="flex items-center space-x-2 text-green-400">
                  <span>✅</span>
                  <span>
                    시작점 연결: {clip.regularClipProperties.startAnchor.baseClipId.slice(-8)}
                    ({clip.regularClipProperties.startAnchor.anchorPoint})
                    {clip.regularClipProperties.startAnchor.offset !== 0 && (
                      <span className="text-yellow-400">
                        {clip.regularClipProperties.startAnchor.offset > 0 ? '+' : ''}
                        {clip.regularClipProperties.startAnchor.offset.toFixed(2)}s
                      </span>
                    )}
                  </span>
                </div>
              )}

              {clip.regularClipProperties.endAnchor && (
                <div className="flex items-center space-x-2 text-green-400">
                  <span>✅</span>
                  <span>
                    끝점 연결: {clip.regularClipProperties.endAnchor.baseClipId.slice(-8)}
                    ({clip.regularClipProperties.endAnchor.anchorPoint})
                    {clip.regularClipProperties.endAnchor.offset !== 0 && (
                      <span className="text-yellow-400">
                        {clip.regularClipProperties.endAnchor.offset > 0 ? '+' : ''}
                        {clip.regularClipProperties.endAnchor.offset.toFixed(2)}s
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* 확장된 앵커 (템플릿 그룹, 번들) */}
              {clip.regularClipProperties.startAnchorExtended && (
                <div className="flex items-center space-x-2 text-purple-400">
                  <span>🔗</span>
                  <span>
                    시작점 연결(확장):
                    {clip.regularClipProperties.startAnchorExtended.baseClipId &&
                      ` 기준클립 ${clip.regularClipProperties.startAnchorExtended.baseClipId.slice(-8)}`}
                    {clip.regularClipProperties.startAnchorExtended.templateGroupId &&
                      ` 템플릿그룹 ${clip.regularClipProperties.startAnchorExtended.templateGroupId.slice(-8)}`}
                    {clip.regularClipProperties.startAnchorExtended.bundleId &&
                      ` 번들 ${clip.regularClipProperties.startAnchorExtended.bundleId.slice(-8)}`}
                    ({clip.regularClipProperties.startAnchorExtended.anchorPoint})
                    {clip.regularClipProperties.startAnchorExtended.offset !== 0 && (
                      <span className="text-yellow-400">
                        {clip.regularClipProperties.startAnchorExtended.offset > 0 ? '+' : ''}
                        {clip.regularClipProperties.startAnchorExtended.offset.toFixed(2)}s
                      </span>
                    )}
                  </span>
                </div>
              )}

              {clip.regularClipProperties.endAnchorExtended && (
                <div className="flex items-center space-x-2 text-purple-400">
                  <span>🔗</span>
                  <span>
                    끝점 연결(확장):
                    {clip.regularClipProperties.endAnchorExtended.baseClipId &&
                      ` 기준클립 ${clip.regularClipProperties.endAnchorExtended.baseClipId.slice(-8)}`}
                    {clip.regularClipProperties.endAnchorExtended.templateGroupId &&
                      ` 템플릿그룹 ${clip.regularClipProperties.endAnchorExtended.templateGroupId.slice(-8)}`}
                    {clip.regularClipProperties.endAnchorExtended.bundleId &&
                      ` 번들 ${clip.regularClipProperties.endAnchorExtended.bundleId.slice(-8)}`}
                    ({clip.regularClipProperties.endAnchorExtended.anchorPoint})
                    {clip.regularClipProperties.endAnchorExtended.offset !== 0 && (
                      <span className="text-yellow-400">
                        {clip.regularClipProperties.endAnchorExtended.offset > 0 ? '+' : ''}
                        {clip.regularClipProperties.endAnchorExtended.offset.toFixed(2)}s
                      </span>
                    )}
                  </span>
                </div>
              )}

              {!clip.regularClipProperties.startAnchor && !clip.regularClipProperties.startAnchorExtended && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <span>❌</span>
                  <span>시작점 연결 없음</span>
                </div>
              )}

              {!clip.regularClipProperties.endAnchor && !clip.regularClipProperties.endAnchorExtended && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <span>❌</span>
                  <span>끝점 연결 없음</span>
                </div>
              )}

              {clip.regularClipProperties.staticDuration && (
                <div className="flex items-center space-x-2 text-cyan-400">
                  <span>📏</span>
                  <span>정적 길이: {clip.regularClipProperties.staticDuration.toFixed(2)}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 연결되지 않은 일반클립 */}
      {!isBaseClipValue && !clip.regularClipProperties && (
        <div className="space-y-3">
          <h4 className="text-gray-400 font-medium flex items-center space-x-2">
            <span>⚪</span>
            <span>독립 클립</span>
          </h4>

          <div className="bg-gray-900 p-3 rounded-lg border border-gray-600/30">
            <p className="text-gray-400 text-sm">
              이 클립은 기준클립에 연결되지 않은 독립적인 클립입니다.
            </p>
          </div>
        </div>
      )}

      {/* 전체 클립 데이터 (접기/펼치기) */}
      <details className="space-y-2">
        <summary className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors">
          📄 전체 클립 데이터 보기 (개발자용)
        </summary>
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-600/30 max-h-60 overflow-y-auto">
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
            {JSON.stringify(clip, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
};
