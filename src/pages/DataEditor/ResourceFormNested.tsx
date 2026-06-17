import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Settings, FileDown, FileUp } from 'lucide-react';
import { ResourceData, ResourceItem, Container } from '../../types/autoGeneration';
import { NestedContainer } from '../../components/NestedContainer';
import { validateNestedStructure, calculateMaxDepth } from '../../utils/nestedValidation';

interface ResourceFormNestedProps {
  resourceData: ResourceData;
  onChange: (data: ResourceData) => void;
  selectedTemplate: any | null;
  maxNestingDepth?: number;
}

export const ResourceFormNested: React.FC<ResourceFormNestedProps> = ({
  resourceData,
  onChange,
  selectedTemplate,
  maxNestingDepth = 3
}) => {
  const [templateStructure, setTemplateStructure] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);

  // 템플릿 구조 분석
  useEffect(() => {
    if (selectedTemplate) {
      analyzeTemplate(selectedTemplate);
    }
  }, [selectedTemplate]);

  // 데이터 변경 시 검증
  useEffect(() => {
    const result = validateNestedStructure(resourceData, {
      maxNestingDepth,
      enableCircularReferenceCheck: true,
      enableDepthValidation: true,
      enableOrphanDetection: false,
      strictMode: false
    });
    setValidationResult(result);
  }, [resourceData, maxNestingDepth]);

  const analyzeTemplate = (template: any) => {
    const clips: any[] = [];
    const bundles: any[] = template.bundles || [];
    const templateGroups: any[] = template.templateGroups || [];

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

    setTemplateStructure({ clips, bundles, templateGroups });
  };

  const checkDynamicProperties = (clip: any): boolean => {
    const baseProps = clip.baseClipProperties?.dynamicProperties;
    const regularProps = clip.regularClipProperties?.dynamicProperties;
    return (baseProps && baseProps.length > 0) || (regularProps && regularProps.length > 0);
  };

  // 아이템 추가
  const handleAddItem = () => {
    const newItem: ResourceItem = {
      name: '',
      data: {
        type: 'text',
        text: '',
        language: 'ko'
      },
      subordinateItems: [],
      nestingLevel: 0
    };

    updateResourceData({
      ...resourceData,
      items: [...resourceData.items, newItem]
    });
  };

  // 반복 아이템(이터레이터) 추가
  const handleAddIterator = () => {
    const newItem: ResourceItem = {
      name: '',
      isIterator: true,
      containers: [
        {
          id: `container-${Date.now()}`,
          items: [],
          nestingLevel: 1
        }
      ],
      nestingLevel: 0
    };

    updateResourceData({
      ...resourceData,
      items: [...resourceData.items, newItem]
    });
  };

  // 리소스 데이터 업데이트 (메타데이터 자동 갱신)
  const updateResourceData = (newData: ResourceData) => {
    const maxDepth = calculateMaxDepth(newData.items);
    
    onChange({
      ...newData,
      version: '2.0.0',
      metadata: {
        ...newData.metadata,
        maxNestingDepth: maxDepth,
        hasNestedStructure: maxDepth > 0,
        updatedAt: new Date().toISOString()
      }
    });
  };

  // 경로 기반 아이템 업데이트
  const handleUpdateItem = (path: string[], updates: Partial<ResourceItem>) => {
    const newItems = JSON.parse(JSON.stringify(resourceData.items));
    let current: any = { items: newItems };
    
    // 경로를 따라 대상 찾기
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    // 업데이트 적용
    const lastKey = path[path.length - 1];
    current[lastKey] = { ...current[lastKey], ...updates };
    
    updateResourceData({ ...resourceData, items: newItems });
  };

  // 경로 기반 아이템 삭제
  const handleDeleteItem = (path: string[]) => {
    const newItems = JSON.parse(JSON.stringify(resourceData.items));
    
    if (path.length === 1) {
      // 최상위 아이템 삭제
      newItems.splice(parseInt(path[0]), 1);
    } else {
      // 중첩된 아이템 삭제
      let current: any = { items: newItems };
      for (let i = 0; i < path.length - 2; i++) {
        current = current[path[i]];
      }
      const parentKey = path[path.length - 2];
      const index = parseInt(path[path.length - 1]);
      current[parentKey].splice(index, 1);
    }
    
    updateResourceData({ ...resourceData, items: newItems });
  };

  // 컨테이너 추가
  const handleAddContainer = (path: string[]) => {
    const newItems = JSON.parse(JSON.stringify(resourceData.items));
    let current: any = { items: newItems };
    
    for (const key of path) {
      current = current[key];
    }
    
    const currentDepth = path.filter(p => p === 'items').length;
    const newContainer: Container = {
      id: `container-${Date.now()}`,
      items: [],
      nestingLevel: currentDepth + 1
    };
    
    if (!current.containers) {
      current.containers = [];
    }
    current.containers.push(newContainer);
    
    updateResourceData({ ...resourceData, items: newItems });
  };

  // 컨테이너 삭제
  const handleDeleteContainer = (path: string[], containerIndex: number) => {
    const newItems = JSON.parse(JSON.stringify(resourceData.items));
    let current: any = { items: newItems };
    
    for (const key of path) {
      current = current[key];
    }
    
    current.containers.splice(containerIndex, 1);
    updateResourceData({ ...resourceData, items: newItems });
  };

  // 컨테이너에 아이템 추가
  const handleAddItemToContainer = (path: string[], containerIndex: number) => {
    const newItems = JSON.parse(JSON.stringify(resourceData.items));
    let current: any = { items: newItems };
    
    for (const key of path) {
      current = current[key];
    }
    
    const currentDepth = path.filter(p => p === 'items').length + 1;
    const newItem: ResourceItem = {
      name: '',
      data: {
        type: 'text',
        text: '',
        language: 'ko'
      },
      nestingLevel: currentDepth
    };
    
    current.containers[containerIndex].items.push(newItem);
    updateResourceData({ ...resourceData, items: newItems });
  };

  // 컨테이너 아이템 업데이트
  const handleUpdateContainerItem = (
    path: string[], 
    containerIndex: number, 
    itemIndex: number, 
    updates: Partial<ResourceItem>
  ) => {
    const newItems = JSON.parse(JSON.stringify(resourceData.items));
    let current: any = { items: newItems };
    
    for (const key of path) {
      current = current[key];
    }
    
    const item = current.containers[containerIndex].items[itemIndex];
    current.containers[containerIndex].items[itemIndex] = { ...item, ...updates };
    
    updateResourceData({ ...resourceData, items: newItems });
  };

  // 컨테이너 아이템 삭제
  const handleDeleteContainerItem = (
    path: string[], 
    containerIndex: number, 
    itemIndex: number
  ) => {
    const newItems = JSON.parse(JSON.stringify(resourceData.items));
    let current: any = { items: newItems };
    
    for (const key of path) {
      current = current[key];
    }
    
    current.containers[containerIndex].items.splice(itemIndex, 1);
    updateResourceData({ ...resourceData, items: newItems });
  };

  // 검증 요약 렌더링
  const renderValidationSummary = () => {
    if (!validationResult) return null;

    return (
      <div className={`rounded-lg p-3 mb-4 text-sm ${
        validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className={validationResult.isValid ? 'text-green-600' : 'text-red-600'} />
            <span className={validationResult.isValid ? 'text-green-800' : 'text-red-800'}>
              {validationResult.isValid ? '데이터 구조 유효' : '데이터 구조 오류'}
            </span>
          </div>
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            {showValidation ? '숨기기' : '자세히'}
          </button>
        </div>
        
        {showValidation && (
          <div className="mt-2 space-y-1">
            <div className="text-gray-600">
              • 총 아이템: {validationResult.statistics.totalItems}
              • 컨테이너: {validationResult.statistics.totalContainers}
              • 최대 깊이: {validationResult.statistics.maxDepthFound}
            </div>
            {validationResult.errors.length > 0 && (
              <div className="text-red-600">
                오류: {validationResult.errors.map(e => e.message).join(', ')}
              </div>
            )}
            {validationResult.warnings.length > 0 && (
              <div className="text-yellow-600">
                경고: {validationResult.warnings.map(w => w.message).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="resource-form p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">리소스 데이터 (중첩 지원)</h2>
          <p className="text-sm text-gray-600 mt-1">
            최대 중첩 깊이: {maxNestingDepth} | 현재 깊이: {validationResult?.statistics.maxDepthFound || 0}
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
              템플릿을 먼저 선택하면 클립과 번들 이름들을 자동으로 불러올 수 있습니다.
            </span>
          </div>
        </div>
      )}

      {renderValidationSummary()}

      <div className="space-y-4">
        {resourceData.items.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <p>리소스 아이템이 없습니다.</p>
            <p className="text-sm mt-2">위의 버튼을 클릭하여 아이템을 추가하세요.</p>
          </div>
        ) : (
          resourceData.items.map((item, index) => (
            <NestedContainer
              key={index}
              item={item}
              path={['items', index.toString()]}
              depth={0}
              maxDepth={maxNestingDepth}
              templateStructure={templateStructure}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onAddContainer={handleAddContainer}
              onDeleteContainer={handleDeleteContainer}
              onAddItemToContainer={handleAddItemToContainer}
              onUpdateContainerItem={handleUpdateContainerItem}
              onDeleteContainerItem={handleDeleteContainerItem}
            />
          ))
        )}
      </div>
    </div>
  );
};