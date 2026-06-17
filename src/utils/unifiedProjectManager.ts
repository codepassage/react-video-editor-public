/**
 * 🌟 unifiedProjectManager.ts - 통합 프로젝트 관리 시스템
 * 
 * 프로젝트와 템플릿의 저장, 불러오기, 검증을 담당하는 통합 관리 시스템입니다.
 * Bundle-TemplateGroup 관계 정보와 Offset 재계산을 포함한 완전한 프로젝트 데이터 관리를 제공합니다.
 * 
 * 주요 기능:
 * - 통합 프로젝트 데이터 형식 정의 및 관리
 * - Bundle-TemplateGroup 관계 분석 및 복원
 * - Offset 재계산을 통한 클립 연결 관계 보정
 * - 데이터 검증 및 통계 생성
 * - 다양한 저장소 프로바이더 지원
 * - 기존 포맷에서의 마이그레이션 지원
 * 
 * Bundle-TemplateGroup 관계 관리:
 * - 관계 정보 자동 분석 및 저장
 * - 관계 복원을 통한 Bundle relationships 재구성
 * - 기존 데이터에서의 관계 재구성 지원
 * 
 * 성능 최적화:
 * - Offset 재계산을 통한 정확한 클립 배치
 * - 대량 데이터 처리 최적화
 * - 메모리 효율적인 데이터 구조
 * - 비동기 저장/로드 지원
 * 
 * 사용 패턴:
 * - 모든 프로젝트 저장/불러오기 작업의 중심
 * - 템플릿 시스템과의 완전한 통합
 * - 다양한 저장소 백엔드 지원
 * 
 * 특별 고려사항:
 * - StorageProvider 인터페이스를 통한 확장성
 * - 버전 호환성 및 마이그레이션 지원
 * - 데이터 무결성 검증 및 복구
 * - 개발/디버깅을 위한 포괄적인 로깅
 */

import { TimelineTrack, ProjectSettings, Bundle, TemplateGroup } from '../types';
import { generateUniqueClipIds } from './templateUtils';
import type { BundleTemplateGroupRelation } from '../types/bundles';
import { recalculateEndpointOffsets } from '../types/clipAlignment';

// StorageProvider 관련 타입들 import
import type {
  StorageProvider,
  SaveOptions,
  SaveResult,
  StorageItem,
  LoadOptions
} from './storage/StorageProvider';

// 🌟 통합 프로젝트 데이터 인터페이스 (확장된 버전)
export interface UnifiedProjectData {
  tracks: TimelineTrack[];
  projectSettings: ProjectSettings;
  bundles?: Bundle[];
  templateGroups?: TemplateGroup[];

  // 🌟 추가: 관계 정보
  bundleTemplateGroupRelations?: BundleTemplateGroupRelation[];

  metadata: {
    exportedAt: string;
    version: string;
    editorVersion: string;
    type: 'project' | 'template'; // 데이터 타입 구분
    name?: string; // 템플릿일 경우 이름
    description?: string; // 템플릿일 경우 설명
    templateId?: string; // 템플릿일 경우 ID

    // 🌟 추가: 관계 메타데이터
    hasComplexRelations?: boolean;
    bundleGroupMappings?: number;
  };
}

// 🔧 공통 유틸리티 클래스
export class UnifiedProjectManager {
  private static readonly CURRENT_VERSION = '2.0.0';
  private static readonly EDITOR_VERSION = 'v2.0.0';

  // 🌟 Bundle-TemplateGroup 관계 분석 함수
  private static analyzeBundleTemplateGroupRelations(
    bundles?: Bundle[],
    templateGroups?: TemplateGroup[]
  ): BundleTemplateGroupRelation[] {
    if (!bundles || !templateGroups) {
      return [];
    }

    const relations: BundleTemplateGroupRelation[] = [];

    bundles.forEach(bundle => {
      // Bundle의 relationships에서 linkedTemplateGroups 확인
      if (bundle.relationships?.linkedTemplateGroups) {
        bundle.relationships.linkedTemplateGroups.forEach(linkedGroup => {
          const group = templateGroups.find(g => g.id === linkedGroup.groupId);
          if (group) {
            relations.push({
              bundleId: bundle.id,
              templateGroupId: linkedGroup.groupId,
              relationship: linkedGroup.relationship === 'contains' ? 'parent' : 'sibling',
              createdAt: new Date().toISOString(),
              syncMovement: linkedGroup.syncMovement
            });
          }
        });
      }

      // Bundle의 templateGroupIds에서도 관계 생성
      bundle.templateGroupIds.forEach(groupId => {
        const group = templateGroups.find(g => g.id === groupId);
        if (group && !relations.some(r => r.bundleId === bundle.id && r.templateGroupId === groupId)) {
          relations.push({
            bundleId: bundle.id,
            templateGroupId: groupId,
            relationship: 'parent',
            createdAt: new Date().toISOString(),
            syncMovement: bundle.relationships?.dragBehavior === 'with-groups'
          });
        }
      });
    });

    console.log('🔍 Bundle-TemplateGroup 관계 분석 완료:', {
      totalBundles: bundles.length,
      totalGroups: templateGroups.length,
      generatedRelations: relations.length
    });

    return relations;
  }

  // 📤 프로젝트 데이터를 통합 형식으로 내보내기 (🌟 관계 정보 포함, Offset 재계산 포함)
  static exportToUnifiedFormat(
    tracks: TimelineTrack[],
    projectSettings: ProjectSettings,
    bundles?: Bundle[],
    templateGroups?: TemplateGroup[],
    options?: {
      type?: 'project' | 'template';
      name?: string;
      description?: string;
      templateId?: string;
    }
  ): UnifiedProjectData {
    console.log('📤 통합 형식으로 내보내기 시작 (🌟 관계 정보 포함, Offset 재계산 포함):', {
      tracks: tracks.length,
      totalClips: tracks.reduce((sum, track) => sum + track.clips.length, 0),
      bundles: bundles?.length || 0,
      templateGroups: templateGroups?.length || 0,
      type: options?.type || 'project'
    });

    // 🔄 Step 1: Perform offset recalculation before export
    console.log('🔄 Performing offset recalculation before export...');

    // Collect all clips
    const allClips = tracks.flatMap(track => track.clips);

    // Execute offset recalculation (with extended anchor support)
    const recalculateResult = recalculateEndpointOffsets(allClips, templateGroups, bundles);

    console.log('🔄 Offset recalculation result:', {
      success: recalculateResult.success,
      processedCount: recalculateResult.processedCount,
      message: recalculateResult.message
    });

    // Step 2: Update tracks with recalculated clips
    let updatedTracks = tracks;

    if (recalculateResult.success && recalculateResult.updatedClips.length > 0) {
      console.log('📊 Updating tracks with recalculated clips...');

      // Create map of recalculated clips
      const updatedClipsMap = new Map(recalculateResult.updatedClips.map(clip => [clip.id, clip]));

      // Update tracks
      updatedTracks = tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => {
          const updatedClip = updatedClipsMap.get(clip.id);
          return updatedClip || clip; // Use recalculated clip if available, otherwise original
        })
      }));

      console.log('✅ Tracks update complete');
    } else {
      console.log('ℹ️ No clips to recalculate, using original tracks');
    }

    // 🌟 Bundle-TemplateGroup 관계 분석
    const relations = this.analyzeBundleTemplateGroupRelations(bundles, templateGroups);


    updatedTracks = updatedTracks.map(track => ({
      ...track,
      clips: track.clips.sort((a, b) => a.startTime - b.startTime)
    }));

    const unifiedData: UnifiedProjectData = {
      tracks: updatedTracks,
      projectSettings,
      // 🌟 관계 정보 추가
      bundleTemplateGroupRelations: relations,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: this.CURRENT_VERSION,
        editorVersion: this.EDITOR_VERSION,
        type: options?.type || 'project',
        // 🌟 관계 메타데이터 추가
        hasComplexRelations: relations.length > 0,
        bundleGroupMappings: relations.length,
        ...(options?.name && { name: options.name }),
        ...(options?.description && { description: options.description }),
        ...(options?.templateId && { templateId: options.templateId })
      }
    };

    // Bundle 정보 추가
    if (bundles && bundles.length > 0) {
      unifiedData.bundles = bundles;
      console.log('📦 Bundle 정보 포함:', bundles.length);
    }

    // TemplateGroup 정보 추가  
    if (templateGroups && templateGroups.length > 0) {
      unifiedData.templateGroups = templateGroups;
      console.log('🛡️ TemplateGroup 정보 포함:', templateGroups.length);
    }

    console.log('✅ 통합 형식 내보내기 완료');
    return unifiedData;
  }

  // 🌟 기존 데이터에서 Bundle-TemplateGroup 관계 재구성
  private static reconstructRelationsFromLegacyData(
    bundles?: Bundle[],
    templateGroups?: TemplateGroup[]
  ): BundleTemplateGroupRelation[] {
    if (!bundles || !templateGroups) {
      return [];
    }

    console.log('🔄 기존 데이터에서 관계 재구성 시작:', {
      bundles: bundles.length,
      templateGroups: templateGroups.length
    });

    const relations: BundleTemplateGroupRelation[] = [];

    bundles.forEach(bundle => {
      // Bundle의 templateGroupIds에서 관계 생성
      bundle.templateGroupIds.forEach(groupId => {
        const group = templateGroups.find(g => g.id === groupId);
        if (group) {
          relations.push({
            bundleId: bundle.id,
            templateGroupId: groupId,
            relationship: 'parent',
            createdAt: new Date().toISOString(),
            syncMovement: true // 기본적으로 동기화 이동
          });
        }
      });

      // TemplateGroup의 bundleId에서도 참조
      templateGroups.forEach(group => {
        if (group.bundleId === bundle.id && !relations.some(r => r.bundleId === bundle.id && r.templateGroupId === group.id)) {
          relations.push({
            bundleId: bundle.id,
            templateGroupId: group.id,
            relationship: 'parent',
            createdAt: new Date().toISOString(),
            syncMovement: true
          });
        }
      });
    });

    console.log('✅ 기존 데이터 관계 재구성 완료:', {
      generatedRelations: relations.length
    });

    return relations;
  }

  // 🌟 Bundle relationships 복원
  private static restoreBundleRelationships(
    bundles: Bundle[],
    relations: BundleTemplateGroupRelation[]
  ): Bundle[] {
    if (!bundles || !relations || relations.length === 0) {
      return bundles;
    }

    console.log('🔗 Bundle relationships 복원 시작:', {
      bundles: bundles.length,
      relations: relations.length
    });

    return bundles.map(bundle => {
      // 이 Bundle과 관련된 관계들 찾기
      const bundleRelations = relations.filter(r => r.bundleId === bundle.id);

      if (bundleRelations.length === 0) {
        return bundle; // 관계가 없는 Bundle은 그대로 반환
      }

      // LinkedTemplateGroups 생성
      const linkedTemplateGroups = bundleRelations.map(relation => ({
        groupId: relation.templateGroupId,
        relationship: relation.relationship === 'parent' ? 'contains' as const : 'sibling' as const,
        syncMovement: relation.syncMovement
      }));

      // Bundle relationships 객체 생성
      const relationships = {
        linkedTemplateGroups,
        dragBehavior: bundleRelations.some(r => r.syncMovement) ? 'with-groups' as const : 'independent' as const,
        preserveGroupProtection: true
      };

      console.log('🔗 Bundle relationships 복원:', {
        bundleId: bundle.id.slice(-8),
        bundleName: bundle.name,
        linkedGroups: linkedTemplateGroups.length,
        dragBehavior: relationships.dragBehavior
      });

      return {
        ...bundle,
        relationships
      };
    });
  }

  // 📥 통합 형식에서 프로젝트 데이터 가져오기 (🌟 관계 정보 복원)
  static importFromUnifiedFormat(data: any): UnifiedProjectData {
    console.log('📥 통합 형식에서 가져오기 시작 (🌟 관계 정보 복원):', {
      hasData: !!data,
      hasTracks: !!data?.tracks,
      hasProjectSettings: !!data?.projectSettings,
      hasBundles: !!data?.bundles,
      hasTemplateGroups: !!data?.templateGroups,
      hasBundleRelations: !!data?.bundleTemplateGroupRelations,
      version: data?.metadata?.version
    });

    // 기본 유효성 검증
    if (!data || !data.tracks || !data.projectSettings) {
      throw new Error('Invalid unified project data format');
    }

    // 버전 호환성 처리
    if (!data.metadata) {
      console.warn('🔄 구 버전 데이터 감지 - 메타데이터 추가');
      data.metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        editorVersion: 'unknown',
        type: 'project'
      };
    }

    // Bundle 정보 호환성 처리
    if (!data.bundles) {
      console.log('ℹ️ Bundle 정보가 없는 구 버전 - 빈 배열로 초기화');
      data.bundles = [];
    }

    // TemplateGroup 정보 호환성 처리
    if (!data.templateGroups) {
      console.log('ℹ️ TemplateGroup 정보가 없는 구 버전 - 빈 배열로 초기화');
      data.templateGroups = [];
    }

    // 🌟 Bundle-TemplateGroup 관계 정보 호환성 처리
    if (!data.bundleTemplateGroupRelations) {
      console.log('ℹ️ Bundle 관계 정보가 없는 구 버전 - 기존 데이터에서 관계 재구성');
      data.bundleTemplateGroupRelations = this.reconstructRelationsFromLegacyData(data.bundles, data.templateGroups);
    }

    // 🌟 관계 정보를 기반으로 Bundle relationships 복원
    if (data.bundleTemplateGroupRelations && data.bundleTemplateGroupRelations.length > 0) {
      console.log('🔗 Bundle-TemplateGroup 관계 복원 시작:', {
        totalRelations: data.bundleTemplateGroupRelations.length
      });

      data.bundles = this.restoreBundleRelationships(data.bundles, data.bundleTemplateGroupRelations);
    }

    const unifiedData: UnifiedProjectData = {
      tracks: data.tracks,
      projectSettings: data.projectSettings,
      bundles: data.bundles,
      templateGroups: data.templateGroups,
      bundleTemplateGroupRelations: data.bundleTemplateGroupRelations,
      metadata: data.metadata
    };

    console.log('✅ 통합 형식 가져오기 완료 (🌟 관계 정보 복원):', {
      tracks: unifiedData.tracks.length,
      totalClips: unifiedData.tracks.reduce((sum, track) => sum + track.clips.length, 0),
      bundles: unifiedData.bundles?.length || 0,
      templateGroups: unifiedData.templateGroups?.length || 0,
      relations: unifiedData.bundleTemplateGroupRelations?.length || 0,
      type: unifiedData.metadata.type
    });

    return unifiedData;
  }

  // 📂 JSON 파일로 저장
  static downloadAsJSON(data: UnifiedProjectData, filename?: string): void {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename || this.generateFilename(data);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('📂 JSON 파일 다운로드 완료:', filename || this.generateFilename(data));
    } catch (error) {
      console.error('❌ JSON 파일 다운로드 실패:', error);
      throw new Error(`JSON 파일 다운로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // 📂 JSON 파일에서 읽기
  static importFromJSONFile(file: File): Promise<UnifiedProjectData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rawData = JSON.parse(text);
          const unifiedData = this.importFromUnifiedFormat(rawData);
          resolve(unifiedData);
        } catch (error) {
          reject(new Error(`JSON 파일 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };

      reader.readAsText(file);
    });
  }

  // 📂 파일 선택 대화상자 열기
  static openFileDialog(): Promise<UnifiedProjectData> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('파일이 선택되지 않았습니다'));
          return;
        }

        try {
          const data = await this.importFromJSONFile(file);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      input.click();
    });
  }

  // 🏷️ 파일명 자동 생성
  private static generateFilename(data: UnifiedProjectData): string {
    const date = new Date().toISOString().slice(0, 10);
    const timestamp = Date.now();
    const type = data.metadata.type;
    const name = data.metadata.name;

    if (type === 'template' && name) {
      return `template-${name.replace(/[^a-zA-Z0-9가-힣]/g, '-')}-${date}-${timestamp}.json`;
    } else {
      return `project-${date}-${timestamp}.json`;
    }
  }

  // 🔍 데이터 검증
  static validateData(data: UnifiedProjectData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 필수 필드 검증
    if (!data.tracks || !Array.isArray(data.tracks)) {
      errors.push('tracks 배열이 없거나 유효하지 않습니다');
    }

    if (!data.projectSettings) {
      errors.push('projectSettings가 없습니다');
    }

    if (!data.metadata) {
      errors.push('metadata가 없습니다');
    }

    // Bundle 유효성 검증
    if (data.bundles && !Array.isArray(data.bundles)) {
      errors.push('bundles가 배열이 아닙니다');
    }

    // TemplateGroup 유효성 검증
    if (data.templateGroups && !Array.isArray(data.templateGroups)) {
      errors.push('templateGroups가 배열이 아닙니다');
    }

    // 트랙과 클립 유효성 검증
    if (data.tracks) {
      data.tracks.forEach((track, trackIndex) => {
        if (!track.id) {
          errors.push(`트랙 ${trackIndex}에 ID가 없습니다`);
        }
        if (!track.clips || !Array.isArray(track.clips)) {
          errors.push(`트랙 ${trackIndex}의 clips가 배열이 아닙니다`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 📊 데이터 통계 생성
  static generateStatistics(data: UnifiedProjectData): {
    totalTracks: number;
    totalClips: number;
    bundleCount: number;
    templateGroupCount: number;
    duration: number;
    clipsByType: { [key: string]: number };
  } {
    const totalTracks = data.tracks.length;
    const totalClips = data.tracks.reduce((sum, track) => sum + track.clips.length, 0);
    const bundleCount = data.bundles?.length || 0;
    const templateGroupCount = data.templateGroups?.length || 0;

    // 전체 길이 계산
    const allClips = data.tracks.flatMap(track => track.clips);
    const duration = allClips.length > 0 ? Math.max(...allClips.map(clip => clip.endTime)) : 0;

    // 클립 타입별 통계
    const clipsByType: { [key: string]: number } = {};
    allClips.forEach(clip => {
      const type = clip.mediaType;
      clipsByType[type] = (clipsByType[type] || 0) + 1;
    });

    return {
      totalTracks,
      totalClips,
      bundleCount,
      templateGroupCount,
      duration,
      clipsByType
    };
  }

  // 🔄 기존 포맷에서 통합 포맷으로 변환
  static migrateFromLegacyFormat(legacyData: any): UnifiedProjectData {
    console.log('🔄 기존 포맷에서 통합 포맷으로 변환 시작');

    // 기존 projectExport 포맷 감지
    if (legacyData.tracks && legacyData.projectSettings && legacyData.metadata) {
      return this.importFromUnifiedFormat(legacyData);
    }

    // 기존 template 포맷 감지
    if (legacyData.name && legacyData.tracks && legacyData.projectSettings) {
      const convertedData = {
        tracks: legacyData.tracks,
        projectSettings: legacyData.projectSettings,
        bundles: legacyData.bundles || [],
        templateGroups: legacyData.templateGroups || [],
        metadata: {
          exportedAt: legacyData.updatedAt || legacyData.createdAt || new Date().toISOString(),
          version: this.CURRENT_VERSION,
          editorVersion: this.EDITOR_VERSION,
          type: 'template' as const,
          name: legacyData.name,
          description: legacyData.description,
          templateId: legacyData.id
        }
      };
      return this.importFromUnifiedFormat(convertedData);
    }

    throw new Error('지원하지 않는 기존 포맷입니다');
  }

  // 🌟 새로운 통합 메서드들 - StorageProvider 활용

  /**
   * 통합된 프로젝트 저장
   * @param tracks 타임라인 트랙들
   * @param projectSettings 프로젝트 설정
   * @param bundles Bundle 정보
   * @param templateGroups TemplateGroup 정보
   * @param storageProvider 저장소 프로바이더
   * @param options 저장 옵션
   * @returns 저장 결과
   */
  static async saveProject(
    tracks: TimelineTrack[],
    projectSettings: ProjectSettings,
    bundles: Bundle[] | undefined,
    templateGroups: TemplateGroup[] | undefined,
    storageProvider: StorageProvider,
    options?: SaveOptions
  ): Promise<SaveResult> {
    console.log('💾 통합 프로젝트 저장 시작:', {
      tracks: tracks.length,
      totalClips: tracks.reduce((sum, track) => sum + track.clips.length, 0),
      bundles: bundles?.length || 0,
      templateGroups: templateGroups?.length || 0,
      storageType: storageProvider.constructor.name,
      projectName: options?.name
    });

    try {
      // 1. 통합 데이터 형식으로 변환
      const unifiedData = this.exportToUnifiedFormat(
        tracks,
        projectSettings,
        bundles,
        templateGroups,
        {
          type: options?.metadata?.type || 'project',
          name: options?.name,
          description: options?.description
        }
      );

      // 2. 데이터 검증
      const validation = this.validateData(unifiedData);
      if (!validation.isValid) {
        const errorMessage = `데이터 검증 실패: ${validation.errors.join(', ')}`;
        console.error('❌ 통합 프로젝트 저장 실패:', errorMessage);
        throw new Error(errorMessage);
      }

      // 3. 저장소에 저장
      console.log('📁 저장소에 데이터 전송 중...');
      const result = await storageProvider.save(unifiedData, options);

      // 4. 통계 생성
      const stats = this.generateStatistics(unifiedData);

      console.log('✅ 통합 프로젝트 저장 완료:', {
        ...result,
        statistics: {
          tracks: stats.totalTracks,
          clips: stats.totalClips,
          bundles: stats.bundleCount,
          templateGroups: stats.templateGroupCount,
          duration: `${Math.floor(stats.duration / 60)}:${(stats.duration % 60).toString().padStart(2, '0')}`
        }
      });

      return result;

    } catch (error) {
      console.error('❌ 통합 프로젝트 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 통합된 프로젝트 로드
   * @param identifier 프로젝트 식별자
   * @param storageProvider 저장소 프로바이더
   * @param options 로드 옵션
   * @returns 로드된 프로젝트 데이터
   */
  static async loadProject(
    identifier: string,
    storageProvider: StorageProvider,
    options?: LoadOptions
  ): Promise<{
    tracks: TimelineTrack[];
    projectSettings: ProjectSettings;
    bundles?: Bundle[];
    templateGroups?: TemplateGroup[];
    metadata: any;
  }> {
    console.log('📥 통합 프로젝트 로드 시작:', {
      identifier: identifier.slice(-8),
      storageType: storageProvider.constructor.name,
      options
    });

    try {
      // 1. 저장소에서 로드
      console.log('📁 저장소에서 데이터 로드 중...');
      const unifiedData = await storageProvider.load(identifier);

      // 2. 데이터 검증
      const validation = this.validateData(unifiedData);
      if (!validation.isValid) {
        console.warn('⚠️ 로드된 데이터 검증 오류:', validation.errors);
        // 경고만 하고 계속 진행 (기존 데이터와의 호환성)
      }

      // 3. ID 재생성 (필요시)
      let result = {
        tracks: unifiedData.tracks,
        bundles: unifiedData.bundles,
        templateGroups: unifiedData.templateGroups
      };

      if (options?.regenerateIds) {
        console.log('🔑 ID 재생성 수행 중...');
        const idResult = generateUniqueClipIds(
          unifiedData.tracks,
          unifiedData.bundles,
          unifiedData.templateGroups
        );
        result = {
          tracks: idResult.tracks,
          bundles: idResult.bundles,
          templateGroups: idResult.templateGroups
        };
        console.log('✅ ID 재생성 완료');
      }

      // 4. 통계 생성
      const stats = this.generateStatistics({
        ...unifiedData,
        tracks: result.tracks,
        bundles: result.bundles,
        templateGroups: result.templateGroups
      });

      console.log('✅ 통합 프로젝트 로드 완료:', {
        name: unifiedData.metadata.name,
        type: unifiedData.metadata.type,
        statistics: {
          tracks: stats.totalTracks,
          clips: stats.totalClips,
          bundles: stats.bundleCount,
          templateGroups: stats.templateGroupCount,
          duration: `${Math.floor(stats.duration / 60)}:${(stats.duration % 60).toString().padStart(2, '0')}`
        },
        idRegenerated: !!options?.regenerateIds
      });

      return {
        tracks: result.tracks,
        projectSettings: unifiedData.projectSettings,
        bundles: result.bundles,
        templateGroups: result.templateGroups,
        metadata: unifiedData.metadata
      };

    } catch (error) {
      console.error('❌ 통합 프로젝트 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 저장된 프로젝트 목록 조회
   * @param storageProvider 저장소 프로바이더
   * @returns 프로젝트 목록
   */
  static async listProjects(storageProvider: StorageProvider): Promise<StorageItem[]> {
    console.log('📁 통합 프로젝트 목록 조회 시작:', {
      storageType: storageProvider.constructor.name
    });

    try {
      const items = await storageProvider.list();

      console.log('✅ 통합 프로젝트 목록 조회 완료:', {
        count: items.length,
        items: items.slice(0, 3).map(item => ({
          id: item.id.slice(-8),
          name: item.name,
          type: item.metadata?.type || 'unknown'
        }))
      });

      return items;
    } catch (error) {
      console.error('❌ 통합 프로젝트 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 삭제
   * @param identifier 프로젝트 식별자
   * @param storageProvider 저장소 프로바이더
   */
  static async deleteProject(identifier: string, storageProvider: StorageProvider): Promise<void> {
    console.log('🗑️ 통합 프로젝트 삭제 시작:', {
      identifier: identifier.slice(-8),
      storageType: storageProvider.constructor.name
    });

    try {
      await storageProvider.delete(identifier);

      console.log('✅ 통합 프로젝트 삭제 완료');
    } catch (error) {
      console.error('❌ 통합 프로젝트 삭제 실패:', error);
      throw error;
    }
  }
}



// 🧪 테스트 및 디버깅 유틸리티
export const debugUnifiedData = (data: UnifiedProjectData) => {
  const stats = UnifiedProjectManager.generateStatistics(data);
  const validation = UnifiedProjectManager.validateData(data);

  console.group('📊 통합 데이터 디버깅');
  console.log('✅ 유효성 검증:', validation.isValid);
  if (!validation.isValid) {
    console.error('❌ 검증 오류:', validation.errors);
  }
  console.log('📈 통계:', stats);
  console.log('🏷️ 메타데이터:', data.metadata);
  console.log('📦 Bundle 개수:', data.bundles?.length || 0);
  console.log('🛡️ TemplateGroup 개수:', data.templateGroups?.length || 0);
  console.groupEnd();

  return { stats, validation };
};

// 🎉 통합 유틸리티 준비 완료
// 사용 방법: import { UnifiedProjectManager, UnifiedProjectData } from './unifiedProjectManager';