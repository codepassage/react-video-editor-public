import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import { ResourceData, ResourceItem, Container } from '../../types/autoGeneration';

interface ResourceFormProps {
  resourceData: ResourceData;
  onChange: (data: ResourceData) => void;
  selectedTemplate: any | null;
}

export const ResourceForm: React.FC<ResourceFormProps> = ({
  resourceData,
  onChange,
  selectedTemplate
}) => {
  const [templateStructure, setTemplateStructure] = useState<any>(null);

  // 데이터 초기화를 위한 useEffect (무한 루프 방지)
  useEffect(() => {
    const itemsNeedingInit = resourceData.items.some(item => 
      !item.data && !item.isIterator
    );

    if (itemsNeedingInit) {
      // 한 번만 실행되도록 setTimeout 사용
      const timeoutId = setTimeout(() => {
        const updatedItems = resourceData.items.map(item => {
          if (!item.data && !item.isIterator) {
            return {
              ...item,
              data: {
                type: 'text',
                text: '',
                language: 'ko'
              }
            };
          }
          return item;
        });

        onChange({ items: updatedItems });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [resourceData.items.length]); // length만 감시하여 무한 루프 방지

  // 템플릿 구조 분석
  useEffect(() => {
    if (selectedTemplate) {
      analyzeTemplate(selectedTemplate);
    }
  }, [selectedTemplate]);

  const analyzeTemplate = (template: any) => {
    const clips: any[] = [];
    const bundles: any[] = template.bundles || [];

    // 모든 클립 수집
    for (const track of template.tracks || []) {
      for (const clip of track.clips || []) {
        const hasDynamicProperties = checkDynamicProperties(clip);
        clips.push({
          ...clip,
          hasDynamicProperties,
          trackName: track.name || track.id
        });
      }
    }

    setTemplateStructure({ clips, bundles });
  };

  const checkDynamicProperties = (clip: any): boolean => {
    const baseProps = clip.baseClipProperties?.dynamicProperties;
    const regularProps = clip.regularClipProperties?.dynamicProperties;
    return (baseProps && baseProps.length > 0) || (regularProps && regularProps.length > 0);
  };

  const handleAddItem = () => {
    const newItem: ResourceItem = {
      name: '',
      data: {
        type: 'text',
        text: '',
        language: 'ko'
      },
      subordinateItems: []
    };

    onChange({
      items: [...resourceData.items, newItem]
    });
  };

  const handleAddIterator = () => {
    const newItem: ResourceItem = {
      name: '',
      isIterator: true,
      containers: [
        {
          items: []
        }
      ]
    };

    onChange({
      items: [...resourceData.items, newItem]
    });
  };

  const handleUpdateItem = (index: number, updates: Partial<ResourceItem>) => {
    const updatedItems = [...resourceData.items];
    const currentItem = updatedItems[index];
    
    // data 속성이 없으면 기본값 제공
    if (!currentItem.data && updates.data) {
      updatedItems[index] = { 
        ...currentItem, 
        data: {
          type: 'text',
          text: '',
          language: 'ko',
          ...updates.data
        },
        ...updates 
      };
    } else {
      updatedItems[index] = { ...currentItem, ...updates };
    }
    
    onChange({ items: updatedItems });
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = resourceData.items.filter((_, i) => i !== index);
    onChange({ items: updatedItems });
  };

  const handleDuplicateItem = (index: number) => {
    const item = resourceData.items[index];
    const duplicatedItem = JSON.parse(JSON.stringify(item));
    duplicatedItem.name = `${item.name}_copy`;
    
    const updatedItems = [...resourceData.items];
    updatedItems.splice(index + 1, 0, duplicatedItem);
    onChange({ items: updatedItems });
  };

  const addContainerToIterator = (itemIndex: number) => {
    const item = resourceData.items[itemIndex];
    if (!item.isIterator || !item.containers) return;

    const newContainer: Container = { items: [] };
    const updatedItem = {
      ...item,
      containers: [...item.containers, newContainer]
    };

    handleUpdateItem(itemIndex, updatedItem);
  };

  const deleteContainer = (itemIndex: number, containerIndex: number) => {
    const item = resourceData.items[itemIndex];
    if (!item.isIterator || !item.containers) return;

    const updatedContainers = item.containers.filter((_, i) => i !== containerIndex);
    handleUpdateItem(itemIndex, { containers: updatedContainers });
  };

  const addItemToContainer = (itemIndex: number, containerIndex: number) => {
    const item = resourceData.items[itemIndex];
    if (!item.isIterator || !item.containers) return;

    const newContainerItem: ResourceItem = {
      name: '',
      data: {
        type: 'text',
        text: '',
        language: 'ko'
      },
      subordinateItems: []
    };

    const updatedContainers = [...item.containers];
    updatedContainers[containerIndex] = {
      ...updatedContainers[containerIndex],
      items: [...updatedContainers[containerIndex].items, newContainerItem]
    };

    handleUpdateItem(itemIndex, { containers: updatedContainers });
  };

  const updateContainerItem = (
    itemIndex: number, 
    containerIndex: number, 
    containerItemIndex: number, 
    updates: Partial<ResourceItem>
  ) => {
    const item = resourceData.items[itemIndex];
    if (!item.isIterator || !item.containers) return;

    const updatedContainers = [...item.containers];
    const updatedContainerItems = [...updatedContainers[containerIndex].items];
    updatedContainerItems[containerItemIndex] = {
      ...updatedContainerItems[containerItemIndex],
      ...updates
    };
    updatedContainers[containerIndex] = {
      ...updatedContainers[containerIndex],
      items: updatedContainerItems
    };

    handleUpdateItem(itemIndex, { containers: updatedContainers });
  };

  const deleteContainerItem = (itemIndex: number, containerIndex: number, containerItemIndex: number) => {
    const item = resourceData.items[itemIndex];
    if (!item.isIterator || !item.containers) return;

    const updatedContainers = [...item.containers];
    updatedContainers[containerIndex] = {
      ...updatedContainers[containerIndex],
      items: updatedContainers[containerIndex].items.filter((_, i) => i !== containerItemIndex)
    };

    handleUpdateItem(itemIndex, { containers: updatedContainers });
  };

  const renderResourceItem = (item: ResourceItem, index: number) => {
    // data 속성이 없고 반복자가 아닌 경우 초기화 중 메시지 표시
    if (!item.data && !item.isIterator) {
      return (
        <div key={index} className="bg-white rounded-lg border p-4 mb-4">
          <div className="text-center py-4 text-gray-500">
            <div className="animate-pulse">데이터 초기화 중...</div>
          </div>
        </div>
      );
    }

    return (
    <div key={index} className="bg-white rounded-lg border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">
          {item.isIterator ? '🔄 반복 아이템' : '📝 리소스 아이템'}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => handleDuplicateItem(index)}
            className="p-1 text-gray-500 hover:text-blue-600"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => handleDeleteItem(index)}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* 이름 */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이름 {item.isIterator ? '(번들/템플릿 이름)' : '(클립 이름)'}
        </label>
        <select
          value={item.name}
          onChange={(e) => handleUpdateItem(index, { name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          {item.isIterator ? (
            // 번들 목록
            templateStructure?.bundles?.map((bundle: any) => (
              <option key={bundle.id} value={bundle.name}>
                {bundle.name} (번들)
              </option>
            ))
          ) : (
            // 클립 목록 (Dynamic Properties가 있는 것만)
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

      {!item.isIterator ? (
        // 일반 아이템
        <>
          {/* 데이터 타입 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">데이터 타입</label>
            <select
              value={item.data?.type || 'text'}
              onChange={(e) => {
                const newType = e.target.value as 'text' | 'image' | 'video';
                const currentData = item.data || {};
                
                // 기본 데이터 구조 유지하면서 타입별 기본값 설정
                let newData: any = {
                  type: newType,
                  // 기존 공통 속성들 보존
                  ...currentData
                };
                
                // 타입별 기본값 설정
                if (newType === 'text') {
                  newData = {
                    type: 'text',
                    text: currentData.text || '',
                    language: currentData.language || 'ko'
                  };
                } else if (newType === 'image' || newType === 'video') {
                  newData = {
                    type: newType,
                    url: currentData.url || ''
                  };
                }
                
                handleUpdateItem(index, { data: newData });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">텍스트</option>
              <option value="image">이미지</option>
              <option value="video">비디오</option>
            </select>
          </div>

          {/* 데이터 내용 */}
          {(item.data?.type === 'text' || !item.data?.type) && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">텍스트</label>
                <textarea
                  value={item.data.text || ''}
                  onChange={(e) => handleUpdateItem(index, {
                    data: { ...item.data, text: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="텍스트를 입력하세요"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">언어</label>
                <select
                  value={item.data.language || 'ko'}
                  onChange={(e) => handleUpdateItem(index, {
                    data: { ...item.data, language: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ko">한국어</option>
                  <option value="en">영어</option>
                  <option value="ja">일본어</option>
                  <option value="zh">중국어</option>
                  <option value="es">스페인어</option>
                  <option value="fr">프랑스어</option>
                  <option value="de">독일어</option>
                </select>
              </div>
            </>
          )}

          {(item.data?.type === 'image' || item.data?.type === 'video') && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={item.data.url || ''}
                onChange={(e) => handleUpdateItem(index, {
                  data: { ...item.data, url: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="파일 URL을 입력하세요"
              />
            </div>
          )}

          {/* 종속 아이템들 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">종속 클립들</label>
            <div className="space-y-2">
              {item.subordinateItems?.map((subName, subIndex) => (
                <div key={subIndex} className="flex items-center space-x-2">
                  <select
                    value={subName}
                    onChange={(e) => {
                      const newSubordinates = [...(item.subordinateItems || [])];
                      newSubordinates[subIndex] = e.target.value;
                      handleUpdateItem(index, { subordinateItems: newSubordinates });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {templateStructure?.clips?.map((clip: any) => (
                      <option key={clip.id} value={clip.name}>
                        {clip.name} ({clip.mediaType})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const newSubordinates = item.subordinateItems?.filter((_, i) => i !== subIndex) || [];
                      handleUpdateItem(index, { subordinateItems: newSubordinates });
                    }}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newSubordinates = [...(item.subordinateItems || []), ''];
                  handleUpdateItem(index, { subordinateItems: newSubordinates });
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + 종속 클립 추가
              </button>
            </div>
          </div>
        </>
      ) : (
        // 반복 아이템 (번들)
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">컨테이너들 (반복 데이터)</h4>
            <button
              onClick={() => addContainerToIterator(index)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              + 컨테이너 추가
            </button>
          </div>

          {item.containers?.map((container, containerIndex) => (
            <div key={containerIndex} className="border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">컨테이너 #{containerIndex + 1}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => addItemToContainer(index, containerIndex)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    + 아이템
                  </button>
                  <button
                    onClick={() => deleteContainer(index, containerIndex)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {container.items.map((containerItem, containerItemIndex) => (
                  <div key={containerItemIndex} className="bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">아이템 #{containerItemIndex + 1}</span>
                      <button
                        onClick={() => deleteContainerItem(index, containerIndex, containerItemIndex)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* 컨테이너 아이템 폼 (간소화된 버전) */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <select
                        value={containerItem.name}
                        onChange={(e) => updateContainerItem(index, containerIndex, containerItemIndex, { name: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">클립 선택</option>
                        {templateStructure?.clips
                          ?.filter((clip: any) => clip.hasDynamicProperties)
                          ?.map((clip: any) => (
                            <option key={clip.id} value={clip.name}>
                              {clip.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        value={containerItem.data?.text || ''}
                        onChange={(e) => updateContainerItem(index, containerIndex, containerItemIndex, {
                          data: { ...containerItem.data, text: e.target.value, type: 'text', language: 'ko' }
                        })}
                        placeholder="텍스트"
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="resource-form p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">리소스 데이터</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleAddItem}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>아이템 추가</span>
          </button>
          <button
            onClick={handleAddIterator}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <Plus size={16} />
            <span>반복 추가</span>
          </button>
        </div>
      </div>

      {!selectedTemplate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <span className="text-yellow-800">
              템플릿을 먼저 선택하면 클립 이름들을 자동으로 불러올 수 있습니다.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {resourceData.items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>리소스 아이템이 없습니다.</p>
            <p className="text-sm">위의 버튼을 클릭하여 아이템을 추가하세요.</p>
          </div>
        ) : (
          resourceData.items.map((item, index) => renderResourceItem(item, index))
        )}
      </div>
    </div>
  );
};