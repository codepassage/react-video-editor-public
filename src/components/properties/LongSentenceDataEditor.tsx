/**
 * 📝 LongSentenceDataEditor.tsx - LongSentence 클립 데이터 편집 컴포넌트
 * 
 * LongSentence 클립의 데이터 배열을 편집할 수 있는 전문적인 에디터 컴포넌트입니다.
 * 텍스트와 미디어 URL을 쌍으로 관리하며, 동적으로 아이템을 추가/삭제할 수 있습니다.
 * 
 * 주요 기능:
 * - 텍스트-미디어 쌍 데이터 편집
 * - 동적 아이템 추가/삭제 기능
 * - 확장/축소 가능한 아이템 뷰
 * - 미디어 파일 선택기 통합
 * - 최소 1개 아이템 보장
 * - 실시간 데이터 변경 알림
 * 
 * 데이터 구조:
 * - DataItem: { text: string, mediaUrl: string }
 * - 각 아이템은 텍스트와 연결된 미디어 URL을 가짐
 * - 최소 1개 이상의 아이템 필수
 * 
 * 사용 시나리오:
 * - LongSentence 클립의 세그먼트별 데이터 관리
 * - CSV 자동 생성 시 텍스트-미디어 매핑 편집
 * - 템플릿 기반 비디오 생성 시 동적 데이터 입력
 * 
 * UI 특징:
 * - 확장 가능한 카드 형태 인터페이스
 * - 미디어 타입별 아이콘 표시
 * - 드래그 앤 드롭 지원 (MediaPicker 연동)
 * - 삭제 확인 및 최소 개수 보장
 * 
 * 상태 관리:
 * - expandedIndex: 현재 확장된 아이템 인덱스
 * - 부모 컴포넌트로 데이터 변경 사항 전달 (onChange)
 * 
 * 관련 모듈:
 * - 4번 모듈: Long Sentence Engine (LongSentence 클립 시스템)
 * - MediaPicker: 미디어 파일 선택 컴포넌트
 * - LongSentenceProperties: 상위 속성 편집 컴포넌트
 * - 6번 모듈: Auto Generation System (CSV 데이터 연동)
 */

import React, { useState } from 'react';
import { Plus, Trash2, Upload, Image, Video } from 'lucide-react';
import { MediaPicker } from '../common/MediaPicker';

interface DataItem {
  text: string;
  mediaUrl: string;
}

interface LongSentenceDataEditorProps {
  data: DataItem[];
  onChange: (data: DataItem[]) => void;
}

export const LongSentenceDataEditor: React.FC<LongSentenceDataEditorProps> = ({
  data,
  onChange,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddItem = () => {
    const newItem: DataItem = {
      text: '',
      mediaUrl: ''
    };
    onChange([...data, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (data.length > 1) {
      const newData = data.filter((_, i) => i !== index);
      onChange(newData);

      // 삭제된 항목이 확장되어 있었다면 확장 상태 해제
      if (expandedIndex === index) {
        setExpandedIndex(null);
      } else if (expandedIndex !== null && expandedIndex > index) {
        setExpandedIndex(expandedIndex - 1);
      }
    }
  };

  const handleTextChange = (index: number, text: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], text };
    onChange(newData);
  };

  const handleMediaUrlChange = (index: number, mediaUrl: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], mediaUrl };
    onChange(newData);
  };

  const getMediaType = (url: string): 'image' | 'video' | 'unknown' => {
    if (!url) return 'unknown';
    const ext = url.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExts = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv'];

    if (ext && imageExts.includes(ext)) return 'image';
    if (ext && videoExts.includes(ext)) return 'video';
    return 'unknown';
  };

  const MediaIcon = ({ url }: { url: string }) => {
    const type = getMediaType(url);
    if (type === 'image') return <Image className="w-4 h-4 text-blue-500" />;
    if (type === 'video') return <Video className="w-4 h-4 text-purple-500" />;
    return <Upload className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">텍스트 + 미디어 데이터</h4>
        <button
          onClick={handleAddItem}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-3 h-3" />
          추가
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {data.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  항목 {index + 1}
                </span>
                <MediaIcon url={item.mediaUrl} />
                {item.text && (
                  <span className="text-xs text-gray-500 truncate max-w-32">
                    {item.text.slice(0, 30)}...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {data.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(index);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 확장된 편집 영역 */}
            {expandedIndex === index && (
              <div className="p-3 space-y-3 bg-white">
                {/* 텍스트 편집 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    텍스트 내용
                  </label>
                  <textarea
                    value={item.text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    placeholder="텍스트를 입력하세요..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    rows={3}
                  />
                </div>

                {/* 미디어 URL 편집 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    미디어 URL (이미지/비디오)
                  </label>
                  <MediaPicker
                    value={item.mediaUrl}
                    onChange={(url) => handleMediaUrlChange(index, url)}
                    accept="image/*,video/*"
                    placeholder="미디어를 선택하거나 URL을 입력하세요..."
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Upload className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">데이터 항목을 추가해주세요</p>
        </div>
      )}
    </div>
  );
};