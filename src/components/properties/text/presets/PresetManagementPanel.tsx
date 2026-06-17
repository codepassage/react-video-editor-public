// 🎛️ 프리셋 관리 패널 컴포넌트
// 사용자 정의 프리셋 관리, 즐겨찾기, 통계, 백업/복원 기능

import React, { useState, useRef } from 'react';
import { 
  Settings, Download, Upload, Trash2, Edit3, Star, 
  TrendingUp, Clock, BarChart3, FileText, 
  AlertTriangle, CheckCircle 
} from 'lucide-react';
import { TextPreset } from '../../../../types/presets/textPresets';
import useCustomPresets from '../../../../hooks/useCustomPresets';
import PresetCard from './PresetCard';
import { globalAlert } from '../../../../utils/globalAlert';

interface PresetManagementPanelProps {
  onApplyPreset: (preset: TextPreset) => void;
}

/**
 * 🎛️ PresetManagementPanel - 고급 프리셋 관리 인터페이스
 */
export const PresetManagementPanel: React.FC<PresetManagementPanelProps> = ({
  onApplyPreset
}) => {
  const {
    customPresets,
    favorites,
    recentlyUsed,
    toggleFavorite,
    deleteCustomPreset,
    exportData,
    importData,
    clearAllData,
    getStatistics,
    getPopularPresets,
    getRecentPresets,
    getUsageStats
  } = useCustomPresets();

  const [activeTab, setActiveTab] = useState<'custom' | 'favorites' | 'stats' | 'backup'>('custom');
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stats = getStatistics();
  
  // 파일 가져오기 처리
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importData(file);
      setImportStatus({
        type: 'success',
        message: '프리셋을 성공적으로 가져왔습니다!'
      });
      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '파일 가져오기에 실패했습니다.'
      });
      setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
    }
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 프리셋 삭제 확인
  const handleDeletePreset = async (presetId: string, presetName: string) => {
    const confirmed = await globalAlert.confirmDanger(`"${presetName}" 프리셋을 삭제하시겠습니까?`);
    if (confirmed) {
      deleteCustomPreset(presetId);
    }
  };

  // 탭 구성
  const tabs = [
    { id: 'custom', label: '내 프리셋', icon: Edit3, count: customPresets.length },
    { id: 'favorites', label: '즐겨찾기', icon: Star, count: favorites.length },
    { id: 'stats', label: '통계', icon: BarChart3 },
    { id: 'backup', label: '백업/복원', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">프리셋 관리</h2>
          <p className="text-sm text-gray-400">사용자 정의 프리셋과 즐겨찾기를 관리하세요</p>
        </div>
        
        {/* 빠른 액션 버튼들 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={exportData}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="프리셋 내보내기"
          >
            <Download size={16} />
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title="프리셋 가져오기"
          >
            <Upload size={16} />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* 상태 메시지 */}
      {importStatus.type && (
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          importStatus.type === 'success' 
            ? 'bg-green-900/50 border border-green-500/30' 
            : 'bg-red-900/50 border border-red-500/30'
        }`}>
          {importStatus.type === 'success' ? 
            <CheckCircle size={16} className="text-green-400" /> : 
            <AlertTriangle size={16} className="text-red-400" />
          }
          <span className={`text-sm ${
            importStatus.type === 'success' ? 'text-green-300' : 'text-red-300'
          }`}>
            {importStatus.message}
          </span>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 p-1 bg-gray-800/50 rounded-lg">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
            {count !== undefined && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === id ? 'bg-blue-500' : 'bg-gray-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      <div className="min-h-[400px]">
        {/* 내 프리셋 탭 */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            {customPresets.length === 0 ? (
              <div className="text-center py-12">
                <Edit3 size={48} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">사용자 정의 프리셋 없음</h3>
                <p className="text-gray-400 text-sm">
                  텍스트 스타일을 만들고 프리셋으로 저장해보세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customPresets.map(preset => {
                  const usage = getUsageStats(preset.id);
                  
                  return (
                    <div key={preset.id} className="relative">
                      <PresetCard
                        preset={preset}
                        onApply={onApplyPreset}
                        onToggleFavorite={toggleFavorite}
                        isFavorite={favorites.includes(preset.id)}
                      />
                      
                      {/* 사용자 프리셋 전용 액션 */}
                      <div className="absolute top-2 left-2 flex space-x-1">
                        <button
                          onClick={() => handleDeletePreset(preset.id, preset.name)}
                          className="p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      
                      {/* 사용 통계 표시 */}
                      {usage && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                          사용 {usage.usageCount}회
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 즐겨찾기 탭 */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Star size={48} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">즐겨찾기 없음</h3>
                <p className="text-gray-400 text-sm">
                  프리셋을 즐겨찾기에 추가하면 여기에 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  즐겨찾기한 프리셋들을 빠르게 확인하고 사용하세요.
                </p>
                <div className="flex flex-wrap gap-2">
                  {favorites.map(presetId => (
                    <button
                      key={presetId}
                      className="flex items-center space-x-2 px-3 py-2 bg-yellow-600/20 border border-yellow-500/30 rounded-lg text-yellow-300 hover:bg-yellow-600/30 transition-colors"
                    >
                      <Star size={14} className="fill-current" />
                      <span className="text-sm">{presetId}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 통계 탭 */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* 전체 통계 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalCustomPresets}</div>
                <div className="text-sm text-gray-400">사용자 프리셋</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.totalFavorites}</div>
                <div className="text-sm text-gray-400">즐겨찾기</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">{stats.totalUsage}</div>
                <div className="text-sm text-gray-400">총 사용 횟수</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-400">{recentlyUsed.length}</div>
                <div className="text-sm text-gray-400">최근 사용</div>
              </div>
            </div>

            {/* 인기 프리셋 */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <TrendingUp size={20} className="text-orange-400" />
                <span>인기 프리셋</span>
              </h3>
              <div className="space-y-2">
                {getPopularPresets(5).map((presetId, index) => {
                  const usage = getUsageStats(presetId);
                  return (
                    <div key={presetId} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                        <span className="text-white">{presetId}</span>
                      </div>
                      <span className="text-sm text-gray-400">{usage?.usageCount || 0}회 사용</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 최근 사용 */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <Clock size={20} className="text-blue-400" />
                <span>최근 사용</span>
              </h3>
              <div className="space-y-2">
                {getRecentPresets(5).map((presetId, index) => (
                  <div key={`${presetId}-${index}`} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-white">{presetId}</span>
                    <span className="text-sm text-gray-400">최근 사용</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 백업/복원 탭 */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            {/* 내보내기 */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/30">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
                <Download size={20} className="text-blue-400" />
                <span>데이터 내보내기</span>
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                사용자 정의 프리셋, 즐겨찾기, 사용 통계를 JSON 파일로 내보내세요.
              </p>
              <button
                onClick={exportData}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>내 프리셋 내보내기</span>
              </button>
            </div>

            {/* 가져오기 */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/30">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
                <Upload size={20} className="text-green-400" />
                <span>데이터 가져오기</span>
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                이전에 내보낸 프리셋 파일을 가져와서 복원하세요. 기존 데이터와 병합됩니다.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Upload size={16} />
                <span>프리셋 파일 선택</span>
              </button>
            </div>

            {/* 데이터 초기화 */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-red-500/30">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
                <AlertTriangle size={20} className="text-red-400" />
                <span>데이터 초기화</span>
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                모든 사용자 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다!
              </p>
              <button
                onClick={clearAllData}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 size={16} />
                <span>모든 데이터 삭제</span>
              </button>
            </div>

            {/* 도움말 */}
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center space-x-2">
                <FileText size={16} />
                <span>백업 팁</span>
              </h3>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• 정기적으로 프리셋을 내보내서 백업하세요</li>
                <li>• 다른 기기에서도 같은 프리셋을 사용할 수 있습니다</li>
                <li>• 팀원들과 프리셋을 공유할 수 있습니다</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetManagementPanel;
