import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../../utils/globalAlert';
import { Database, FileJson, Check, ChevronDown, Search, X, Play, Link } from 'lucide-react';
import './ResourceSelector.css';
import { getApiUrl } from '../../../utils/urlBuilder';
import { RelationshipBadges } from './RelationshipBadges';
import { RelationshipManagerModal } from './RelationshipManagerModal';

interface ResourceTemplate {
  id: string;
  name: string;
  description?: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

interface CsvColumnMap {
  id: string;
  name: string;
  description?: string;
  mapping: any;
  createdAt: string;
  updatedAt: string;
}

interface ResourceSelectorProps {
  onTemplateSelect?: (template: ResourceTemplate) => void;
  onCsvMapSelect?: (map: CsvColumnMap) => void;
  onResourceDataChange?: (resourceData: any) => void;
  selectedTemplateId?: string | null;
  selectedCsvMapId?: string | null;
  // For compatible resources tab
  templateId?: string | null;
  templateName?: string | null;
  refreshTrigger?: number;
  onResourceSelect?: (resourceId: string, resourceName: string, resourceData: any) => void;
  onUnlinkResource?: (resourceId: string) => void;
}

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  onTemplateSelect,
  onCsvMapSelect,
  onResourceDataChange,
  selectedTemplateId,
  selectedCsvMapId,
  templateId,
  templateName,
  refreshTrigger,
  onResourceSelect,
  onUnlinkResource
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'csv-maps' | 'compatible'>('compatible');
  const [templates, setTemplates] = useState<ResourceTemplate[]>([]);
  const [csvMaps, setCsvMaps] = useState<CsvColumnMap[]>([]);
  const [compatibleResources, setCompatibleResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 전체 조회/호환항목 조회 토글 상태
  const [showAllItems, setShowAllItems] = useState(false);
  // 관계 관리 모달 상태
  const [relationshipModalOpen, setRelationshipModalOpen] = useState<string | null>(null);

  // 리소스 템플릿 목록 불러오기
  const loadTemplates = async () => {
    setLoading(true);
    try {
      // 전체 조회 또는 호환항목 조회에 따라 다른 엔드포인트 사용
      const url = showAllItems
        ? `${getApiUrl()}/api/resource-templates`
        : (!templateId ? null : `${getApiUrl()}/api/templates/${templateId}/compatible-resource-templates`);

      // 호환항목 조회인데 템플릿이 선택되지 않은 경우 빈 결과 반환
      if (!showAllItems && !templateId) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      if (!url) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      const response = await fetch(url);

      // 호환 항목 조회가 실패하면 빈 결과 반환 (폴백 없음)
      if (!response.ok) {
        console.warn(`API 호출 실패: ${response.status} - ${url}`);
        setTemplates([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('🔍 ResourceSelector templates API response:', {
        url,
        showAllItems,
        templateId,
        dataType: typeof data,
        dataLength: Array.isArray(data) ? data.length : 'not array',
        data
      });

      // 다양한 API 응답 구조 처리
      let templatesData = [];

      if (Array.isArray(data)) {
        templatesData = data;
      } else if (data.success && data.data && Array.isArray(data.data)) {
        templatesData = data.data;
      } else if (data.success && data.templates && Array.isArray(data.templates)) {
        templatesData = data.templates;
      } else if (data.data && Array.isArray(data.data)) {
        templatesData = data.data;
      } else if (data.templates && Array.isArray(data.templates)) {
        templatesData = data.templates;
      }

      // 데이터 구조 변환: versions에서 실제 데이터 추출 + 관계 데이터 보존
      const processedTemplates = templatesData.map((item: any) => {
        const latestVersion = item.versions?.[0];
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          data: latestVersion?.templateData || {},
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          // 관계 데이터 보존
          csvColumnMaps: item.csvColumnMaps || [],
          resourceData: item.resourceData || null
        };
      });

      console.log('🔍 설정할 템플릿 데이터:', {
        length: processedTemplates.length,
        firstItem: processedTemplates[0],
        processedTemplates
      });

      setTemplates(processedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // CSV 컬럼 맵 목록 불러오기
  const loadCsvMaps = async () => {
    setLoading(true);
    try {
      // 전체 조회 또는 호환항목 조회에 따라 다른 엔드포인트 사용
      const url = showAllItems
        ? `${getApiUrl()}/api/csv-column-maps`
        : (!templateId ? null : `${getApiUrl()}/api/templates/${templateId}/compatible-csv-maps`);

      // 호환항목 조회인데 템플릿이 선택되지 않은 경우 빈 결과 반환
      if (!showAllItems && !templateId) {
        setCsvMaps([]);
        setLoading(false);
        return;
      }

      if (!url) {
        setCsvMaps([]);
        setLoading(false);
        return;
      }

      const response = await fetch(url);

      // 호환 항목 조회가 실패하면 빈 결과 반환 (폴백 없음)
      if (!response.ok) {
        console.warn(`API 호출 실패: ${response.status} - ${url}`);
        setCsvMaps([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('🔍 ResourceSelector CSV maps API response:', data);

      // 다양한 API 응답 구조 처리
      let csvMapsData = [];

      if (Array.isArray(data)) {
        csvMapsData = data;
      } else if (data.success && data.data && Array.isArray(data.data)) {
        csvMapsData = data.data;
      } else if (data.success && data.maps && Array.isArray(data.maps)) {
        csvMapsData = data.maps;
      } else if (data.data && Array.isArray(data.data)) {
        csvMapsData = data.data;
      } else if (data.maps && Array.isArray(data.maps)) {
        csvMapsData = data.maps;
      }

      // 데이터 구조 변환: versions에서 실제 데이터 추출 + 관계 데이터 보존
      const processedCsvMaps = csvMapsData.map((item: any) => {
        const latestVersion = item.versions?.[0];
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          mapping: latestVersion?.mappingData || {},
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          // 관계 데이터 보존
          resourceTemplateId: item.resourceTemplateId || null,
          resourceDataEntries: item.resourceDataEntries || []
        };
      });

      console.log('🔍 설정할 CSV 맵 데이터:', {
        length: processedCsvMaps.length,
        firstItem: processedCsvMaps[0],
        processedCsvMaps
      });

      setCsvMaps(processedCsvMaps);
    } catch (error) {
      console.error('Failed to load CSV maps:', error);
      setCsvMaps([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 호환 리소스 목록 로드 함수
   * @description 서버에서 호환 리소스 목록을 조회하고 데이터 구조를 정규화
   * @note 전체 조회 또는 템플릿 호환성 기반 조회 지원
   */
  const loadCompatibleResources = async () => {
    setLoading(true);
    try {
      // 전체 조회 또는 호환항목 조회에 따라 다른 엔드포인트 사용
      const url = showAllItems
        ? `${getApiUrl()}/api/resource-data` // 전체 리소스 데이터 조회
        : (!templateId ? null : `${getApiUrl()}/api/templates/${templateId}/compatible-resources`);

      // 호환항목 조회인데 템플릿이 선택되지 않은 경우 빈 결과 반환
      if (!showAllItems && !templateId) {
        setCompatibleResources([]);
        setLoading(false);
        return;
      }

      if (!url) {
        setCompatibleResources([]);
        setLoading(false);
        return;
      }

      console.log('🔍 ResourceSelector compatible resources API 호출:', {
        url,
        showAllItems,
        templateId
      });

      const response = await fetch(url);
      if (!response.ok) {
        console.error(`API 호출 실패: ${response.status} - ${url}`);
        setCompatibleResources([]);
        return;
      }

      const data = await response.json();
      console.log('🔍 ResourceSelector compatible resources API response:', {
        url,
        hasSuccess: 'success' in data,
        hasData: 'data' in data,
        hasResources: 'resources' in data,
        isArray: Array.isArray(data),
        data
      });

      // 다양한 API 응답 구조 처리
      let resourcesData = [];

      if (data.success) {
        console.log('🔍 if (data.success)');

        if (data.data && Array.isArray(data.data)) {
          resourcesData = data.data;
          console.log('🔍 if (data.data && Array.isArray(data.data))');
        } else if (data.resources && Array.isArray(data.resources)) {
          resourcesData = data.resources;
          console.log('🔍 if (data.resources && Array.isArray(data.resources))');
        } else if (Array.isArray(data)) {
          resourcesData = data;
          console.log('🔍 if (Array.isArray(data))');
        } else if (data.data && Array.isArray(data.data)) {
          resourcesData = data.data;
          console.log('🔍 if (data.data && Array.isArray(data.data))');
        } else if (data.resources && Array.isArray(data.resources)) {
          resourcesData = data.resources;
          console.log('🔍 if (data.resources && Array.isArray(data.resources))');
        }
      }

      console.log('🔍 설정할 리소스 데이터:', {
        length: resourcesData.length,
        firstItem: resourcesData[0],
        resourcesData
      });

      setCompatibleResources(resourcesData);
    } catch (error) {
      console.error('Failed to load compatible resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates();
    } else if (activeTab === 'csv-maps') {
      loadCsvMaps();
    } else if (activeTab === 'compatible') {
      loadCompatibleResources();
    }
  }, [activeTab, templateId, refreshTrigger, showAllItems]);

  // 검색 필터링
  const filteredItems = activeTab === 'templates'
    ? templates.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    : activeTab === 'csv-maps'
      ? csvMaps.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      : compatibleResources.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleTemplateClick = async (template: ResourceTemplate) => {
    console.log('🔍 Template clicked:', template.name);
    let actualData = template.data;

    // 데이터가 비어있으면 개별 조회로 실제 데이터 가져오기
    if (!actualData || Object.keys(actualData).length === 0) {
      try {
        console.log('🔍 Fetching template detail for:', template.id);
        const response = await fetch(`${getApiUrl()}/api/resource-templates/${template.id}`);
        if (response.ok) {
          const result = await response.json();
          const latestVersion = result.versions?.[0];
          actualData = latestVersion?.templateData || {};
          console.log('🔍 Fetched template data:', actualData);
        }
      } catch (error) {
        console.error('Failed to load template detail:', error);
        globalAlert.showError('템플릿 데이터를 불러오는 중 오류가 발생했습니다.');
        return;
      }
    }

    const templateWithData = { ...template, data: actualData };

    if (onTemplateSelect) {
      onTemplateSelect(templateWithData);
    }
    if (onResourceDataChange && actualData) {
      onResourceDataChange(actualData);
    }
  };

  const handleCsvMapClick = async (map: CsvColumnMap) => {
    console.log('🔍 CSV map clicked:', map.name);
    let actualMapping = map.mapping;

    // 데이터가 비어있으면 개별 조회로 실제 데이터 가져오기
    if (!actualMapping || Object.keys(actualMapping).length === 0) {
      try {
        console.log('🔍 Fetching CSV map detail for:', map.id);
        const response = await fetch(`${getApiUrl()}/api/csv-column-maps/${map.id}`);
        if (response.ok) {
          const result = await response.json();
          const latestVersion = result.versions?.[0];
          actualMapping = latestVersion?.mappingData || {};
          console.log('🔍 Fetched CSV map data:', actualMapping);
        }
      } catch (error) {
        console.error('Failed to load CSV map detail:', error);
        globalAlert.showError('CSV 맵 데이터를 불러오는 중 오류가 발생했습니다.');
        return;
      }
    }

    const mapWithData = { ...map, mapping: actualMapping };

    if (onCsvMapSelect) {
      onCsvMapSelect(mapWithData);
    }
  };

  const handleCompatibleResourceClick = async (resource: any) => {
    console.log('🔥 리소스 클릭됨:', resource);
    try {
      console.log('📡 API 요청 시작:', `${getApiUrl()}/api/resource-data/${resource.id}`);
      const response = await fetch(`${getApiUrl()}/api/resource-data/${resource.id}`);
      const data = await response.json();
      console.log('📡 API 응답:', data);

      // API 응답 구조 확인 및 처리
      if (data.success && data.data) {
        console.log('✅ 리소스 데이터 로드 성공 (data.data), onResourceSelect 호출:', {
          resourceId: resource.id,
          resourceName: resource.name,
          resourceData: data.data
        });
        if (onResourceSelect) {
          onResourceSelect(resource.id, resource.name, data.data);
        } else {
          console.error('❌ onResourceSelect 콜백이 없습니다!');
        }
      } else if (data.data) {
        // success 플래그가 없지만 data가 있는 경우
        console.log('✅ 리소스 데이터 로드 성공 (direct data), onResourceSelect 호출:', {
          resourceId: resource.id,
          resourceName: resource.name,
          resourceData: data.data
        });
        if (onResourceSelect) {
          onResourceSelect(resource.id, resource.name, data.data);
        } else {
          console.error('❌ onResourceSelect 콜백이 없습니다!');
        }
      } else {
        console.error('❌ 리소스 데이터 로드 실패:', data);
      }
    } catch (error) {
      console.error('❌ API 호출 실패:', error);
    }
  };

  const handleUnlinkResource = async (resourceId: string) => {
    if (!templateId || !onUnlinkResource) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/templates/${templateId}/compatible-resources/${resourceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onUnlinkResource(resourceId);
        loadCompatibleResources(); // Reload the list
      }
    } catch (error) {
      console.error('Failed to unlink resource:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR') + ' ' +
      date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="resource-selector">
      <div className="resource-selector-header">
        <h3 className="resource-selector-title">
          <Database size={18} />
          <span>리소스 선택</span>
        </h3>

        <div className="resource-selector-tabs">
          <button
            className={`tab-button ${activeTab === 'compatible' ? 'active' : ''}`}
            onClick={() => setActiveTab('compatible')}
          >
            <Database size={14} />
            <span>호환 리소스</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <FileJson size={14} />
            <span>리소스 템플릿</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'csv-maps' ? 'active' : ''}`}
            onClick={() => setActiveTab('csv-maps')}
          >
            <FileJson size={14} />
            <span>CSV 맵</span>
          </button>
        </div>
      </div>

      <div className="resource-selector-search">
        <Search size={16} />
        <input
          type="text"
          placeholder={`${activeTab === 'templates' ? '템플릿' : activeTab === 'csv-maps' ? 'CSV 맵' : '호환 리소스'} 검색...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 전체 조회/호환항목 조회 토글 버튼 */}
      <div className="filter-toggle-container">
        <div className="filter-toggle">
          <button
            className={`toggle-button ${!showAllItems ? 'active' : ''}`}
            onClick={() => setShowAllItems(false)}
          >
            {templateId ? '호환항목 조회' : '호환항목 조회'}
          </button>
          <button
            className={`toggle-button ${showAllItems ? 'active' : ''}`}
            onClick={() => setShowAllItems(true)}
          >
            전체 조회
          </button>
        </div>
        <div className="filter-description">
          {showAllItems
            ? '모든 항목을 조회합니다'
            : templateId
              ? `선택된 템플릿(${templateName || 'Unknown'})과 호환되는 항목만 조회합니다`
              : '템플릿이 선택되지 않아 전체 항목을 조회합니다'
          }
        </div>
      </div>

      <div className="resource-selector-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>로딩 중...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <Database size={32} />
            <p>
              {searchQuery
                ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                : activeTab === 'templates'
                  ? '리소스 템플릿이 없습니다.'
                  : activeTab === 'csv-maps'
                    ? 'CSV 맵이 없습니다.'
                    : templateId
                      ? '호환되는 리소스가 없습니다.'
                      : '템플릿을 먼저 선택해주세요.'
              }
            </p>
          </div>
        ) : (
          <div className="resource-list">
            {activeTab === 'templates' ? (
              filteredItems.map((template) => (
                <div
                  key={template.id}
                  className={`resource-item ${selectedTemplateId === template.id ? 'selected' : ''}`}
                  style={{ position: 'relative', cursor: 'default' }}
                >
                  <div
                    className="resource-item-header"
                    onClick={() => handleTemplateClick(template as ResourceTemplate)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="resource-item-info">
                      <h4 className="resource-item-name">{template.name}</h4>
                      {template.description && (
                        <p className="resource-item-description">{template.description}</p>
                      )}
                      <span className="resource-item-date">{formatDate(template.updatedAt)}</span>
                    </div>

                    <div className="action-buttons">
                      <button
                        className="btn-load"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateClick(template as ResourceTemplate);
                        }}
                        title="템플릿 로드"
                      >
                        <Play size={12} />
                      </button>
                      <button
                        className="btn-relation"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRelationshipModalOpen(template.id);
                        }}
                        title="관계 관리"
                      >
                        <Link size={12} />
                      </button>
                    </div>

                    {selectedTemplateId === template.id && (
                      <Check size={18} className="selected-icon" />
                    )}
                  </div>

                  {expandedId === template.id && (template as ResourceTemplate).data && (
                    <div className="resource-item-preview">
                      <pre>{JSON.stringify((template as ResourceTemplate).data, null, 2)}</pre>
                    </div>
                  )}

                  {/* 상세보기 버튼을 항상 마지막에, 우측 하단에 위치 */}
                  <button
                    className="expand-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expandedId === template.id ? null : template.id);
                    }}
                    title={expandedId === template.id ? '접기' : '상세 보기'}
                  >
                    <ChevronDown size={14} className={expandedId === template.id ? 'expanded' : ''} />
                  </button>
                </div>
              ))
            ) : activeTab === 'csv-maps' ? (
              filteredItems.map((map) => (
                <div
                  key={map.id}
                  className={`resource-item ${selectedCsvMapId === map.id ? 'selected' : ''}`}
                  style={{ position: 'relative', cursor: 'default' }}
                >
                  <div
                    className="resource-item-header"
                    onClick={() => handleCsvMapClick(map as CsvColumnMap)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="resource-item-info">
                      <h4 className="resource-item-name">{map.name}</h4>
                      {map.description && (
                        <p className="resource-item-description">{map.description}</p>
                      )}
                      <span className="resource-item-date">{formatDate(map.updatedAt)}</span>
                    </div>

                    <div className="action-buttons">
                      <button
                        className="btn-load"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCsvMapClick(map as CsvColumnMap);
                        }}
                        title="CSV 맵 로드"
                      >
                        <Play size={12} />
                      </button>
                      <button
                        className="btn-relation"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRelationshipModalOpen(map.id);
                        }}
                        title="관계 관리"
                      >
                        <Link size={12} />
                      </button>
                    </div>

                    {selectedCsvMapId === map.id && (
                      <Check size={18} className="selected-icon" />
                    )}
                  </div>

                  {expandedId === map.id && (map as CsvColumnMap).mapping && (
                    <div className="resource-item-preview">
                      <pre>{JSON.stringify((map as CsvColumnMap).mapping, null, 2)}</pre>
                    </div>
                  )}

                  <button
                    className="expand-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(expandedId === map.id ? null : map.id);
                    }}
                    title={expandedId === map.id ? '접기' : '상세 보기'}
                  >
                    <ChevronDown size={14} className={expandedId === map.id ? 'expanded' : ''} />
                  </button>
                </div>
              ))
            ) : (
              // Compatible resources
              filteredItems.map((resource) => (
                <div
                  key={resource.id}
                  className="resource-item"
                  style={{ position: 'relative', cursor: 'default' }}
                >
                  <div className="resource-item-header">
                    <div className="resource-item-info">
                      <h4 className="resource-item-name">{resource.name}</h4>
                      {resource.description && (
                        <p className="resource-item-description">{resource.description}</p>
                      )}
                      <div className="resource-item-meta">
                        <span className="resource-item-date">{formatDate(resource.updatedAt)}</span>
                        {resource.versions && resource.versions.length > 0 && (
                          <span className="version-badge">v{resource.versions[0].version}</span>
                        )}
                      </div>

                      {/* 관계 정보 표시 */}
                      <RelationshipBadges
                        resourceData={resource}
                        compact={true}
                        showManageButton={false}
                      />
                    </div>

                    <div className="action-buttons">
                      <button
                        className="btn-load"
                        onClick={() => {
                          console.log('🔄 로드 버튼 클릭:', resource.name);
                          handleCompatibleResourceClick(resource);
                        }}
                        title="리소스 데이터 로드"
                      >
                        <Play size={12} />
                      </button>
                      <button
                        className="btn-relation"
                        onClick={() => {
                          console.log('🔗 관계 버튼 클릭:', resource.name);
                          setRelationshipModalOpen(resource.id);
                        }}
                        title="관계 관리"
                      >
                        <Link size={12} />
                      </button>
                      <button
                        className="btn-unlink"
                        onClick={() => {
                          console.log('❌ 해제 버튼 클릭:', resource.name);
                          handleUnlinkResource(resource.id);
                        }}
                        title="호환 해제"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {expandedId === resource.id && resource.data && (
                    <div className="resource-item-preview">
                      <pre>{JSON.stringify(resource.data, null, 2)}</pre>
                    </div>
                  )}

                  <button
                    className="expand-button"
                    onClick={() => {
                      setExpandedId(expandedId === resource.id ? null : resource.id);
                    }}
                    title={expandedId === resource.id ? '접기' : '상세 보기'}
                  >
                    <ChevronDown size={12} className={expandedId === resource.id ? 'expanded' : ''} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeTab === 'templates' && selectedTemplateId && (
        <div className="selection-status">
          <span>선택된 템플릿: {templates.find(t => t.id === selectedTemplateId)?.name}</span>
        </div>
      )}

      {activeTab === 'csv-maps' && selectedCsvMapId && (
        <div className="selection-status">
          <span>선택된 CSV 맵: {csvMaps.find(m => m.id === selectedCsvMapId)?.name}</span>
        </div>
      )}

      {/* 관계 관리 모달 */}
      {relationshipModalOpen && (
        <RelationshipManagerModal
          isOpen={true}
          onClose={() => setRelationshipModalOpen(null)}
          resourceData={
            activeTab === 'templates' 
              ? templates.find(t => t.id === relationshipModalOpen)
              : activeTab === 'csv-maps'
              ? csvMaps.find(m => m.id === relationshipModalOpen) 
              : compatibleResources.find(r => r.id === relationshipModalOpen)
          }
          resourceType={
            activeTab === 'templates' ? 'template' 
            : activeTab === 'csv-maps' ? 'csv-map' 
            : 'resource-data'
          }
          onRelationshipUpdate={() => {
            if (activeTab === 'templates') loadTemplates();
            else if (activeTab === 'csv-maps') loadCsvMaps();
            else loadCompatibleResources();
            setRelationshipModalOpen(null);
          }}
        />
      )}
    </div>
  );
};