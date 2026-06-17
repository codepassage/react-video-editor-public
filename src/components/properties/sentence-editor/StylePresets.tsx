import React from 'react';
import { StylePresetsProps, StylePreset } from './types';

// 스타일 프리셋 정의
export const stylePresets: Record<string, StylePreset> = {
  'highlight': {
    name: '🔆 강조 (노란 배경)',
    style: {
      backgroundColor: '#FFD700',
      color: '#000000',
      fontWeight: 'bold',
      paddingTop: 2,
      paddingRight: 4,
      paddingBottom: 2,
      paddingLeft: 4,
      borderRadius: '3px'
    }
  },
  'important': {
    name: '⚠️ 중요 (빨간 굵은 글씨)',
    style: {
      color: '#FF4444',
      fontWeight: 'bold',
      textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
    }
  },
  'emphasis': {
    name: '💫 강조 (기울임꼴)',
    style: {
      fontStyle: 'italic',
      color: '#00BFFF',
      fontWeight: '500'
    }
  },
  'title': {
    name: '📋 제목 (큰 굵은 글씨)',
    style: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
    }
  },
  'subtitle': {
    name: '📝 부제목 (중간 크기)',
    style: {
      fontSize: 24,
      fontWeight: '600',
      color: '#CCCCCC'
    }
  },
  'code': {
    name: '💻 코드 (고정폭 폰트)',
    style: {
      fontFamily: 'Courier New',
      backgroundColor: '#2D2D2D',
      color: '#00FF00',
      paddingTop: 2,
      paddingRight: 4,
      paddingBottom: 2,
      paddingLeft: 4,
      borderRadius: '3px'
    }
  },
  'glow': {
    name: '✨ 글로우 효과',
    style: {
      color: '#FFFFFF',
      textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6)'
    }
  },
  'outline': {
    name: '🖼️ 아웃라인',
    style: {
      color: '#FFFFFF',
      textShadow: '2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000'
    }
  }
};

interface StylePresetsGridProps extends StylePresetsProps {
  segmentId: string;
}

export const StylePresetsGrid: React.FC<StylePresetsGridProps> = ({ 
  segmentId, 
  onApplyPreset 
}) => {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-2">🎨 스타일 프리셋</label>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {Object.entries(stylePresets).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => onApplyPreset(segmentId, key)}
            className="p-2 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 transition-colors text-left"
            title={`이 스타일을 적용: ${preset.name}`}
          >
            <div className="text-white font-medium mb-1">{preset.name}</div>
            <div
              className="text-xs truncate"
              style={{
                ...preset.style,
                fontSize: '10px',
                textShadow: preset.style.textShadow ? '1px 1px 2px rgba(0,0,0,0.8)' : undefined
              }}
            >
              예시 텍스트
            </div>
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
        💡 프리셋을 선택하면 세그먼트에 미리 설정된 스타일이 적용됩니다. 그 후 개별 설정을 수정할 수 있습니다.
      </div>
    </div>
  );
};

export default StylePresetsGrid;
