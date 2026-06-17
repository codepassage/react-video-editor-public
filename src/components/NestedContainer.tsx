/**
 * 📦 NestedContainer.tsx - 중첩 데이터 컴테이너 컴포넌트
 * 
 * 자동 생성 시스템에서 중첩된 데이터 구조를 시각적으로 표시하고
 * 편집할 수 있도록 하는 재사용 가능한 컴포넌트입니다.
 * 임의의 깊이를 가진 트리 구조를 지원하며, 각 레벨별로
 * 다른 시각적 스타일을 적용하여 계층적 구조를 직관적으로 표현합니다.
 * 
 * 주요 기능:
 * - 다단계 중첩 데이터 구조 지원 (maxDepth 제한)
 * - 각 레벨별 색상 구분 및 시각적 계층 표시
 * - 폴더 확장/축소 기능 (isExpanded 상태)
 * - 동적 컴테이너 추가/삭제
 * - 컴테이너 내 아이템 추가/수정/삭제
 * - 경로 기반 데이터 업데이트 시스템
 * 
 * 데이터 구조:
 * - ResourceItem: 개별 데이터 아이템
 * - 경로 배열(path): 중첩 위치 식별자
 * - 중첩 깊이(depth): 시각적 계층 표시용
 * 
 * 콜백 시스템:
 * - onUpdate: 아이템 속성 업데이트
 * - onDelete: 아이템 삭제
 * - onAddContainer: 새 컴테이너 추가
 * - onUpdateContainerItem: 컴테이너 내 아이템 업데이트
 * 
 * 관련 모듈:
 * - 6번 모듈: Auto Generation System (데이터 구조 관리)
 * - 4번 모듈: Long Sentence Engine (중첩 텍스트 데이터)
 */
import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { ResourceItem } from '../types/autoGeneration';

interface NestedContainerProps {
  item: ResourceItem;
  path: string[];
  depth: number;
  maxDepth: number;
  templateStructure: any;
  onUpdate: (path: string[], updates: Partial<ResourceItem>) => void;
  onDelete: (path: string[]) => void;
  onAddContainer?: (path: string[]) => void;
  onDeleteContainer?: (path: string[], containerIndex: number) => void;
  onAddItemToContainer?: (path: string[], containerIndex: number) => void;
  onUpdateContainerItem?: (path: string[], containerIndex: number, itemIndex: number, updates: Partial<ResourceItem>) => void;
  onDeleteContainerItem?: (path: string[], containerIndex: number, itemIndex: number) => void;
}

/**
 * NestedContainer 컴포넌트 - 중첩 데이터 구조의 재귀적 렌더링
 * 
 * 주요 책임:
 * 1. 중첩 데이터 계층 시각적 표시 (색상 및 들여쓰기)
 * 2. 폴더 확장/축소 상태 관리
 * 3. 동적 컴테이너 및 아이템 추가/삭제
 * 4. 경로 기반 데이터 업데이트 전파
 * 5. 깊이 제한 및 안전성 보장
 * 
 * 상태 관리:
 * - isExpanded: 폴더 확장 상태
 * - depth: 현재 중첩 레벨
 * - path: 데이터 위치 식별 경로
 * 
 * 렌더링 시스템:
 * - 재귀적 컴포넌트 구조
 * - 단계별 색상 및 스타일링
 * - 동적 네스팅 배지 표시
 */
export const NestedContainer: React.FC<NestedContainerProps> = ({
  item,
  path,
  depth,
  maxDepth,
  templateStructure,
  onUpdate,
  onDelete,
  onAddContainer,
  onDeleteContainer,
  onAddItemToContainer,
  onUpdateContainerItem,
  onDeleteContainerItem
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 깊이에 따른 스타일 계산
  const depthStyles = {
    borderLeft: depth > 0 ? `4px solid ${getDepthColor(depth)}` : undefined,
    marginLeft: depth > 0 ? '8px' : undefined,
    paddingLeft: depth > 0 ? '12px' : undefined,
  };

  // 깊이에 따른 색상
  function getDepthColor(depth: number): string {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
    return colors[depth % colors.length];
  }

  // 중첩 레벨 뱃지
  const renderNestingBadge = () => {
    if (item.nestingLevel !== undefined) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          <Layers size={12} className="mr-1" />
          Level {item.nestingLevel}
        </span>
      );
    }
    return null;
  };

  // 헤더 렌더링
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        {item.isIterator && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        <h3 className="text-lg font-semibold">
          {item.isIterator ? '🔄 반복 아이템' : '📝 리소스 아이템'}
          {item.templateGroupId && ' (템플릿 그룹)'}
        </h3>
        {renderNestingBadge()}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onDelete(path)}
          className="p-1 text-gray-500 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // 일반 아이템 폼
  const renderItemForm = () => (
    <>
      {/* 이름 선택 */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이름 {item.isIterator ? '(번들/템플릿 이름)' : '(클립 이름)'}
        </label>
        <select
          value={item.name}
          onChange={(e) => onUpdate(path, { name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          {item.isIterator ? (
            // 번들 및 템플릿 그룹 목록
            <>
              {templateStructure?.bundles?.map((bundle: any) => (
                <option key={bundle.id} value={bundle.name}>
                  {bundle.name} (번들)
                </option>
              ))}
              {templateStructure?.templateGroups?.map((group: any) => (
                <option key={group.id} value={group.name}>
                  {group.name} (템플릿 그룹)
                </option>
              ))}
            </>
          ) : (
            // 클립 목록
            templateStructure?.clips
              ?.filter((clip: any) => clip.hasDynamicProperties)
              ?.map((clip: any) => (
                <option key={clip.id} value={clip.name}>
                  {clip.name} ({clip.mediaType}) - {clip.trackName}
                </option>
              ))
          )}
        </select>
      </div>

      {/* 일반 아이템 데이터 입력 */}
      {!item.isIterator && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">데이터 타입</label>
            <select
              value={item.data?.type || 'text'}
              onChange={(e) => {
                const newType = e.target.value as 'text' | 'image' | 'video';
                const currentData = item.data || {};
                let newData: any = { type: newType };
                
                if (newType === 'text') {
                  newData = {
                    type: 'text',
                    text: (currentData as any)?.text || '',
                    language: (currentData as any)?.language || 'ko'
                  };
                }
                
                onUpdate(path, { data: newData });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="text">텍스트</option>
              <option value="image">이미지</option>
              <option value="video">비디오</option>
            </select>
          </div>

          {item.data?.type === 'text' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">텍스트</label>
                <textarea
                  value={(item.data as any)?.text || ''}
                  onChange={(e) => onUpdate(path, {
                    data: { ...item.data, type: 'text', text: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="텍스트를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">언어</label>
                <select
                  value={(item.data as any)?.language || 'ko'}
                  onChange={(e) => onUpdate(path, {
                    data: { ...item.data, type: 'text', language: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="ko">한국어</option>
                  <option value="en">영어</option>
                  <option value="ja">일본어</option>
                  <option value="zh">중국어</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

  // 컨테이너 렌더링
  const renderContainers = () => {
    if (!item.isIterator || !isExpanded) return null;

    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-700">
            컨테이너들 (반복 데이터) 
            {depth >= maxDepth - 1 && (
              <span className="text-xs text-red-600 ml-2">
                (최대 깊이 도달)
              </span>
            )}
          </h4>
          {depth < maxDepth - 1 && onAddContainer && (
            <button
              onClick={() => onAddContainer(path)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              + 컨테이너 추가
            </button>
          )}
        </div>

        {item.containers?.map((container, containerIndex) => (
          <div 
            key={containerIndex} 
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            style={depthStyles}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">
                컨테이너 #{containerIndex + 1}
                {container.id && ` (${container.id})`}
              </span>
              <div className="flex space-x-2">
                {depth < maxDepth - 1 && onAddItemToContainer && (
                  <button
                    onClick={() => onAddItemToContainer(path, containerIndex)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    + 아이템
                  </button>
                )}
                {onDeleteContainer && (
                  <button
                    onClick={() => onDeleteContainer(path, containerIndex)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {container.items.map((containerItem, itemIndex) => (
                <div key={itemIndex}>
                  {containerItem.isIterator && depth < maxDepth - 1 ? (
                    // 재귀적 중첩 렌더링
                    <NestedContainer
                      item={containerItem}
                      path={[...path, 'containers', containerIndex.toString(), 'items', itemIndex.toString()]}
                      depth={depth + 1}
                      maxDepth={maxDepth}
                      templateStructure={templateStructure}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      onAddContainer={onAddContainer}
                      onDeleteContainer={onDeleteContainer}
                      onAddItemToContainer={onAddItemToContainer}
                      onUpdateContainerItem={onUpdateContainerItem}
                      onDeleteContainerItem={onDeleteContainerItem}
                    />
                  ) : (
                    // 일반 아이템 인라인 편집
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          아이템 #{itemIndex + 1}
                          {containerItem.isIterator && depth >= maxDepth - 1 && ' (반복)'}
                        </span>
                        {onDeleteContainerItem && (
                          <button
                            onClick={() => onDeleteContainerItem(path, containerIndex, itemIndex)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* 간소화된 인라인 폼 */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <select
                          value={containerItem.name}
                          onChange={(e) => onUpdateContainerItem?.(path, containerIndex, itemIndex, { name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">선택</option>
                          {containerItem.isIterator ? (
                            <>
                              {templateStructure?.bundles?.map((bundle: any) => (
                                <option key={bundle.id} value={bundle.name}>
                                  {bundle.name}
                                </option>
                              ))}
                              {templateStructure?.templateGroups?.map((group: any) => (
                                <option key={group.id} value={group.name}>
                                  {group.name}
                                </option>
                              ))}
                            </>
                          ) : (
                            templateStructure?.clips
                              ?.filter((clip: any) => clip.hasDynamicProperties)
                              ?.map((clip: any) => (
                                <option key={clip.id} value={clip.name}>
                                  {clip.name}
                                </option>
                              ))
                          )}
                        </select>
                        
                        {!containerItem.isIterator && (
                          <input
                            type="text"
                            value={(containerItem.data as any)?.text || ''}
                            onChange={(e) => onUpdateContainerItem?.(path, containerIndex, itemIndex, {
                              data: { ...containerItem.data, text: e.target.value, type: 'text', language: 'ko' }
                            })}
                            placeholder="텍스트"
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        )}

                        {containerItem.isIterator && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            최대 깊이 도달
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border p-4 mb-4 ${!isExpanded && item.isIterator ? 'opacity-75' : ''}`}>
      {renderHeader()}
      {(!item.isIterator || isExpanded) && (
        <>
          {renderItemForm()}
          {renderContainers()}
        </>
      )}
    </div>
  );
};