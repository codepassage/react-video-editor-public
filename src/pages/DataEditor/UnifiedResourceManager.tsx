import React, { useState, useEffect } from 'react';
import { globalAlert } from '../../utils/globalAlert';
import { getApiUrl } from '../../utils/urlBuilder';
import { 
  Database, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Download, 
  FileText, 
  FolderOpen,
  Search,
  Filter,
  Clock,
  Tag,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import './unified-resource-manager.css';

// 타입 정의
interface ResourceTemplate {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  hasNested: boolean;
  maxDepth: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  versions: Array<{
    id: string;
    version: number;
    versionString: string;
    createdAt: string;
  }>;
  csvColumnMaps: Array<{
    id: string;
    name: string;
  }>;
  resourceDataEntries: Array<{
    id: string;
    name: string;
  }>;
}

interface CsvColumnMap {
  id: string;
  name: string;
  description?: string;
  resourceTemplateId?: string;
  columnCount: number;
  mappingComplexity: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  resourceTemplate?: {
    id: string;
    name: string;
    description?: string;
  };
  versions: Array<{
    id: string;
    version: number;
    versionString: string;
    createdAt: string;
  }>;
  resourceDataEntries: Array<{
    id: string;
    name: string;
  }>;
}

type ResourceType = 'templates' | 'csv-maps' | 'resource-data';

export const UnifiedResourceManager: React.FC = () => {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<ResourceType>('templates');
  const [resourceTemplates, setResourceTemplates] = useState<ResourceTemplate[]>([]);
  const [csvColumnMaps, setCsvColumnMaps] = useState<CsvColumnMap[]>([]);
  const [resourceData, setResourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());

  // 데이터 로딩
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadResourceTemplates(),
        loadCsvColumnMaps(),
        loadResourceData()
      ]);
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResourceTemplates = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/resource-templates`);
      if (response.ok) {
        const data = await response.json();
        setResourceTemplates(data);
      }
    } catch (error) {
      console.error('리소스 템플릿 로딩 오류:', error);
    }
  };

  const loadCsvColumnMaps = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/csv-column-maps`);
      if (response.ok) {
        const data = await response.json();
        setCsvColumnMaps(data);
      }
    } catch (error) {
      console.error('CSV 컬럼 맵 로딩 오류:', error);
    }
  };

  const loadResourceData = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/resource-data`);
      if (response.ok) {
        const result = await response.json();
        setResourceData(result.success ? result.data : []);
      }
    } catch (error) {
      console.error('리소스 데이터 로딩 오류:', error);
    }
  };

  // 검색 및 필터링
  const getFilteredData = () => {
    let data: any[] = [];
    
    switch (activeTab) {
      case 'templates':
        data = resourceTemplates;
        break;
      case 'csv-maps':
        data = csvColumnMaps;
        break;
      case 'resource-data':
        data = resourceData;
        break;
    }

    // 검색 필터
    if (searchTerm) {
      data = data.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 타입 필터
    if (filterType !== 'all') {
      switch (activeTab) {
        case 'templates':
          if (filterType === 'nested') {
            data = data.filter(item => item.hasNested);
          } else if (filterType === 'simple') {
            data = data.filter(item => !item.hasNested);
          }
          break;
        case 'csv-maps':
          if (filterType !== 'all') {
            data = data.filter(item => item.mappingComplexity === filterType);
          }
          break;
        case 'resource-data':
          if (filterType === 'nested') {
            data = data.filter(item => item.hasNested);
          } else if (filterType === 'simple') {
            data = data.filter(item => !item.hasNested);
          }
          break;
      }
    }

    return data;
  };

  // 항목 생성
  const handleCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
  };

  // 항목 편집
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsCreating(true);
  };

  // 항목 삭제
  const handleDelete = async (id: string) => {
    if (!(await globalAlert.confirm('정말 삭제하시겠습니까?'))) return;

    try {
      let endpoint = '';
      switch (activeTab) {
        case 'templates':
          endpoint = `${getApiUrl()}/api/resource-templates/${id}`;
          break;
        case 'csv-maps':
          endpoint = `${getApiUrl()}/api/csv-column-maps/${id}`;
          break;
        case 'resource-data':
          endpoint = `${getApiUrl()}/api/resource-data/${id}`;
          break;
      }

      const response = await fetch(endpoint, { method: 'DELETE' });
      if (response.ok) {
        await loadAllData();
        globalAlert.showInfo('삭제되었습니다.');
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      globalAlert.error('삭제 중 오류가 발생했습니다.');
    }
  };

  // 세부 정보 토글
  const toggleDetails = (id: string) => {
    const newShowDetails = new Set(showDetails);
    if (newShowDetails.has(id)) {
      newShowDetails.delete(id);
    } else {
      newShowDetails.add(id);
    }
    setShowDetails(newShowDetails);
  };

  // 항목 선택 토글
  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const filteredData = getFilteredData();
    const allIds = filteredData.map(item => item.id);
    
    if (selectedItems.size === allIds.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allIds));
    }
  };

  // 선택된 항목들 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!(await globalAlert.confirm(`선택된 ${selectedItems.size}개 항목을 삭제하시겠습니까?`))) return;

    try {
      const deletePromises = Array.from(selectedItems).map(id => {
        let endpoint = '';
        switch (activeTab) {
          case 'templates':
            endpoint = `${getApiUrl()}/api/resource-templates/${id}`;
            break;
          case 'csv-maps':
            endpoint = `${getApiUrl()}/api/csv-column-maps/${id}`;
            break;
          case 'resource-data':
            endpoint = `${getApiUrl()}/api/resource-data/${id}`;
            break;
        }
        return fetch(endpoint, { method: 'DELETE' });
      });

      await Promise.all(deletePromises);
      setSelectedItems(new Set());
      await loadAllData();
      globalAlert.showInfo('선택된 항목들이 삭제되었습니다.');
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      globalAlert.error('일괄 삭제 중 오류가 발생했습니다.');
    }
  };

  // 복사
  const handleDuplicate = async (item: any) => {
    try {
      const newName = `${item.name} (복사본)`;
      let endpoint = '';
      let payload: any = {};

      switch (activeTab) {
        case 'templates':
          endpoint = `${getApiUrl()}/api/resource-templates`;
          // 템플릿 데이터를 가져와서 복사
          const templateResponse = await fetch(`${getApiUrl()}/api/resource-templates/${item.id}`);
          const templateData = await templateResponse.json();
          payload = {
            name: newName,
            description: item.description,
            templateData: templateData.versions?.[0]?.templateData || {}
          };
          break;
        case 'csv-maps':
          endpoint = `${getApiUrl()}/api/csv-column-maps`;
          // CSV 맵 데이터를 가져와서 복사
          const csvResponse = await fetch(`${getApiUrl()}/api/csv-column-maps/${item.id}`);
          const csvData = await csvResponse.json();
          payload = {
            name: newName,
            description: item.description,
            resourceTemplateId: item.resourceTemplateId,
            mappingData: csvData.versions?.[0]?.mappingData || []
          };
          break;
        case 'resource-data':
          endpoint = `${getApiUrl()}/api/resource-data`;
          payload = {
            name: newName,
            description: item.description,
            data: item.data || { items: [] }
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadAllData();
        globalAlert.showInfo('복사되었습니다.');
      } else {
        throw new Error('복사 실패');
      }
    } catch (error) {
      console.error('복사 오류:', error);
      globalAlert.error('복사 중 오류가 발생했습니다.');
    }
  };

  const filteredData = getFilteredData();

  return (
    <div className="unified-resource-manager">
      <div className="urm-header">
        <h1>🗂️ 통합 리소스 관리</h1>
        <div className="header-actions">
          <button
            onClick={handleCreate}
            className="btn btn-primary"
          >
            <Plus size={16} />
            새로 만들기
          </button>
          {selectedItems.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger"
            >
              <Trash2 size={16} />
              선택 삭제 ({selectedItems.size})
            </button>
          )}
        </div>
      </div>

      <div className="urm-tabs">
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FileText size={16} />
          리소스 데이터 템플릿
          <span className="count">({resourceTemplates.length})</span>
        </button>
        <button
          className={`tab ${activeTab === 'csv-maps' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv-maps')}
        >
          <Database size={16} />
          CSV 컬럼 맵
          <span className="count">({csvColumnMaps.length})</span>
        </button>
        <button
          className={`tab ${activeTab === 'resource-data' ? 'active' : ''}`}
          onClick={() => setActiveTab('resource-data')}
        >
          <FolderOpen size={16} />
          리소스 데이터
          <span className="count">({resourceData.length})</span>
        </button>
      </div>

      <div className="urm-controls">
        <div className="search-filter">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <Filter size={16} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">전체</option>
              {activeTab === 'templates' && (
                <>
                  <option value="simple">단순 구조</option>
                  <option value="nested">중첩 구조</option>
                </>
              )}
              {activeTab === 'csv-maps' && (
                <>
                  <option value="simple">단순</option>
                  <option value="nested">중첩</option>
                  <option value="complex">복잡</option>
                </>
              )}
              {activeTab === 'resource-data' && (
                <>
                  <option value="simple">단순 구조</option>
                  <option value="nested">중첩 구조</option>
                </>
              )}
            </select>
          </div>
        </div>
        
        {filteredData.length > 0 && (
          <div className="bulk-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedItems.size === filteredData.length && filteredData.length > 0}
                onChange={toggleSelectAll}
              />
              전체 선택
            </label>
          </div>
        )}
      </div>

      <div className="urm-content">
        {loading ? (
          <div className="loading">데이터를 불러오는 중...</div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>데이터가 없습니다</h3>
            <p>새로운 {activeTab === 'templates' ? '리소스 템플릿' : activeTab === 'csv-maps' ? 'CSV 컬럼 맵' : '리소스 데이터'}를 만들어보세요.</p>
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus size={16} />
              새로 만들기
            </button>
          </div>
        ) : (
          <div className="urm-list">
            {filteredData.map((item) => (
              <div key={item.id} className="urm-item">
                <div className="item-header">
                  <div className="item-info">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                    </label>
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      {item.description && (
                        <p className="item-description">{item.description}</p>
                      )}
                      <div className="item-metadata">
                        {activeTab === 'templates' && (
                          <>
                            <span className="meta-tag">
                              <Tag size={12} />
                              {item.itemCount}개 항목
                            </span>
                            <span className="meta-tag">
                              {item.hasNested ? '중첩구조' : '단순구조'}
                            </span>
                            <span className="meta-tag">
                              깊이 {item.maxDepth}
                            </span>
                          </>
                        )}
                        {activeTab === 'csv-maps' && (
                          <>
                            <span className="meta-tag">
                              <Tag size={12} />
                              {item.columnCount}개 컬럼
                            </span>
                            <span className="meta-tag">
                              {item.mappingComplexity}
                            </span>
                            {item.resourceTemplate && (
                              <span className="meta-tag">
                                템플릿: {item.resourceTemplate.name}
                              </span>
                            )}
                          </>
                        )}
                        {activeTab === 'resource-data' && (
                          <>
                            <span className="meta-tag">
                              <Tag size={12} />
                              {item.itemCount}개 항목
                            </span>
                            <span className="meta-tag">
                              {item.hasNested ? '중첩구조' : '단순구조'}
                            </span>
                            <span className="meta-tag">
                              v{item.version || '1'}
                            </span>
                          </>
                        )}
                        <span className="meta-tag">
                          <Clock size={12} />
                          {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button
                      onClick={() => toggleDetails(item.id)}
                      className="btn btn-ghost"
                      title="세부정보"
                    >
                      {showDetails.has(item.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="btn btn-ghost"
                      title="복사"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn btn-ghost"
                      title="편집"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-ghost btn-danger"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {showDetails.has(item.id) && (
                  <div className="item-details-panel">
                    <div className="details-grid">
                      <div className="detail-section">
                        <h4>기본 정보</h4>
                        <div className="detail-item">
                          <strong>ID:</strong> {item.id}
                        </div>
                        <div className="detail-item">
                          <strong>생성일:</strong> {new Date(item.createdAt).toLocaleString()}
                        </div>
                        <div className="detail-item">
                          <strong>수정일:</strong> {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                        </div>
                        {item.user && (
                          <div className="detail-item">
                            <strong>작성자:</strong> {item.user.name || item.user.email}
                          </div>
                        )}
                      </div>

                      {(item.versions || item.version) && (
                        <div className="detail-section">
                          <h4>버전 정보</h4>
                          {item.versions ? (
                            <div className="version-list">
                              {item.versions.map((version: any) => (
                                <div key={version.id} className="version-item">
                                  <span>v{version.versionString}</span>
                                  <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="detail-item">
                              <strong>버전:</strong> v{item.versionString || '1.0.0'}
                            </div>
                          )}
                        </div>
                      )}

                      {(item.csvColumnMaps || item.resourceDataEntries) && (
                        <div className="detail-section">
                          <h4>연관 데이터</h4>
                          {item.csvColumnMaps && item.csvColumnMaps.length > 0 && (
                            <div className="detail-item">
                              <strong>CSV 맵:</strong>
                              <ul>
                                {item.csvColumnMaps.map((map: any) => (
                                  <li key={map.id}>{map.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {item.resourceDataEntries && item.resourceDataEntries.length > 0 && (
                            <div className="detail-item">
                              <strong>리소스 데이터:</strong>
                              <ul>
                                {item.resourceDataEntries.map((data: any) => (
                                  <li key={data.id}>{data.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 생성/편집 모달은 나중에 구현 */}
      {isCreating && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingItem ? '편집' : '새로 만들기'}</h2>
              <button onClick={() => setIsCreating(false)}>✕</button>
            </div>
            <div className="modal-content">
              <p>편집 모달은 다음 단계에서 구현됩니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};