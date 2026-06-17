/**
 * 템플릿 관리 서비스 (Prisma 기반 + 버전 관리)
 */

import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import {
  TemplateData,
  TemplateListItem,
  CreateTemplateRequest,
  TemplateResponse,
  TemplateMetadata
} from '../types/template.types';

interface SaveTemplateRequest extends CreateTemplateRequest {
  isUpdate?: boolean;  // 수정 모드인지 여부
  baseId?: string;     // 수정시 기존 baseId
}

interface SavedTemplateData extends TemplateData {
  version: number;
  versionString: string;
}

export class TemplateService {

  constructor() {
    console.log('🗄️ TemplateService 초기화 (Prisma 기반 + 버전 관리)');
  }

  /**
   * 템플릿 저장 (버전 관리 지원)
   */
  async saveTemplate(request: SaveTemplateRequest): Promise<SavedTemplateData> {
    try {
      const metadata = this.generateMetadata(request);

      // 이름 중복 체크 (템플릿 이름으로)
      const existingTemplate = await prisma.template.findUnique({
        where: {
          name: request.name
        }
      });

      if (request.isUpdate) {
        // 수정 모드: 새 버전 생성
        return await this.createNewTemplateVersion(request, existingTemplate, metadata);
      } else {
        // 추가 모드: 새 템플릿 생성
        if (existingTemplate) {
          throw new Error(`이름 '${request.name}'이 이미 존재합니다. 다른 이름을 사용하거나 수정 모드를 선택하세요.`);
        }
        return await this.createNewTemplate(request, metadata);
      }
    } catch (error) {
      console.error('템플릿 DB 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 새 템플릿 생성
   */
  private async createNewTemplate(
    request: SaveTemplateRequest, 
    metadata: TemplateMetadata
  ): Promise<SavedTemplateData> {
    console.log('💾 새 템플릿 생성:', {
      name: request.name,
      tracks: request.tracks.length,
      bundles: request.bundles?.length || 0,
      templateGroups: request.templateGroups?.length || 0
    });

    const projectData = {
      tracks: request.tracks,
      projectSettings: request.projectSettings,
      bundles: request.bundles || [],
      templateGroups: request.templateGroups || []
    };

    // 트랜잭션으로 마스터와 첫 버전 함께 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 마스터 생성
      const master = await tx.template.create({
        data: {
          name: request.name,
          description: request.description || '',
          typeId: request.typeId || '00000000-0000-0000-0000-000000000001',
          totalClips: metadata.totalClips,
          totalTracks: metadata.totalTracks,
          duration: metadata.duration
        },
        include: {
          type: true
        }
      });

      // 2. 첫 버전 생성
      const firstVersion = await tx.templateVersion.create({
        data: {
          templateId: master.id,
          projectData: projectData as any,
          version: 1,
          versionString: metadata.version
        }
      });

      return { master, version: firstVersion };
    });

    console.log(`✅ 새 템플릿 생성 완료: ${result.master.id} - ${request.name} v1`);
    
    return this.mapToSavedTemplateData(result.master, result.version);
  }

  /**
   * 새 버전 생성 (기존 마스터에 버전 추가)
   */
  private async createNewTemplateVersion(
    request: SaveTemplateRequest,
    existingLatest: any,
    metadata: TemplateMetadata
  ): Promise<SavedTemplateData> {
    // 마스터와 현재 최신 버전 조회
    const master = await prisma.template.findUnique({
      where: { name: request.name },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        },
        type: true
      }
    });

    if (!master) {
      throw new Error(`수정할 템플릿 '${request.name}'을 찾을 수 없습니다.`);
    }

    const currentLatestVersion = master.versions[0];
    const newVersionNumber = currentLatestVersion ? currentLatestVersion.version + 1 : 1;

    console.log('📝 새 템플릿 버전 생성:', {
      name: request.name,
      currentVersion: currentLatestVersion?.version || 0,
      newVersion: newVersionNumber
    });

    const projectData = {
      tracks: request.tracks,
      projectSettings: request.projectSettings,
      bundles: request.bundles || [],
      templateGroups: request.templateGroups || []
    };

    // 트랜잭션으로 버전 관리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 마스터 정보 업데이트 (필요시)
      if (request.description !== undefined || metadata.totalClips !== master.totalClips || 
          metadata.totalTracks !== master.totalTracks || metadata.duration !== master.duration) {
        await tx.template.update({
          where: { id: master.id },
          data: {
            description: request.description,
            totalClips: metadata.totalClips,
            totalTracks: metadata.totalTracks,
            duration: metadata.duration
          }
        });
      }

      // 2. 새 버전 생성
      const newVersion = await tx.templateVersion.create({
        data: {
          templateId: master.id,
          projectData: projectData as any,
          version: newVersionNumber,
          versionString: metadata.version
        }
      });

      // 3. 업데이트된 마스터 조회
      const updatedMaster = await tx.template.findUnique({
        where: { id: master.id },
        include: { type: true }
      });

      return { master: updatedMaster!, version: newVersion };
    });

    console.log(`✅ 새 템플릿 버전 생성 완료: ${request.name} v${newVersionNumber}`);
    
    return this.mapToSavedTemplateData(result.master, result.version);
  }

  /**
   * Prisma 결과를 SavedTemplateData로 변환
   */
  private mapToSavedTemplateData(master: any, version: any): SavedTemplateData {
    const projectData = version.projectData as any;
    
    return {
      id: master.id,
      name: master.name,
      description: master.description,
      typeId: master.typeId,
      type: master.type,
      tracks: projectData.tracks || [],
      projectSettings: projectData.projectSettings || {},
      bundles: projectData.bundles || [],
      templateGroups: projectData.templateGroups || [],
      version: version.version,
      versionString: version.versionString,
      createdAt: master.createdAt.toISOString(),
      updatedAt: master.updatedAt.toISOString(),
      metadata: {
        version: version.versionString,
        totalClips: master.totalClips,
        totalTracks: master.totalTracks,
        duration: master.duration,
        bundleCount: projectData.bundles?.length || 0,
        templateGroupCount: projectData.templateGroups?.length || 0
      }
    };
  }

  /**
   * 템플릿 목록 조회 (최신 버전 포함)
   */
  async getTemplates(): Promise<TemplateListItem[]> {
    const templates = await prisma.template.findMany({
      include: {
        type: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const validTemplates = templates
      .filter(template => template.versions.length > 0)
      .map(template => this.mapToListItem(template, template.versions[0]));

    console.log(`📂 Templates loaded: ${validTemplates.length} templates`);
    return validTemplates;
  }

  /**
   * 특정 템플릿 조회 (최신 버전)
   */
  async getTemplate(id: string): Promise<TemplateData | null> {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        type: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    if (!template || template.versions.length === 0) {
      return null;
    }

    console.log(`📄 Template loaded:`, {
      id,
      name: template.name,
      totalClips: template.totalClips || 0,
      version: template.versions[0].version
    });

    return this.mapToSavedTemplateData(template, template.versions[0]);
  }

  /**
   * 템플릿 업데이트 (Bundle 정보 포함) - 새 버전 생성
   */
  async updateTemplate(id: string, updates: Partial<CreateTemplateRequest>): Promise<TemplateData | null> {
    const existing = await this.getTemplate(id);
    if (!existing) {
      return null;
    }

    // 새 버전 생성을 위한 요청 구성
    const updateRequest: SaveTemplateRequest = {
      name: updates.name || existing.name,
      description: updates.description !== undefined ? updates.description : existing.description,
      tracks: updates.tracks || existing.tracks,
      projectSettings: updates.projectSettings || existing.projectSettings,
      bundles: updates.bundles !== undefined ? updates.bundles : existing.bundles,
      templateGroups: updates.templateGroups !== undefined ? updates.templateGroups : existing.templateGroups,
      isUpdate: true
    };

    console.log(`📝 템플릿 업데이트 (새 버전 생성): ${id}`);
    
    // 새 버전 생성으로 업데이트 처리
    return await this.saveTemplate(updateRequest);
  }

  /**
   * 템플릿 삭제
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      await prisma.template.delete({
        where: { id }
      });
      
      console.log(`🗑️ Template deleted: ${id}`);
      return true;
    } catch (error) {
      console.warn(`Failed to delete template ${id}:`, error);
      return false;
    }
  }

  /**
   * 템플릿 복제 (Bundle 정보 포함)
   */
  async duplicateTemplate(id: string, newName?: string): Promise<TemplateData | null> {
    const original = await this.getTemplate(id);
    if (!original) {
      return null;
    }

    const duplicateRequest: CreateTemplateRequest = {
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      tracks: original.tracks,
      projectSettings: original.projectSettings,
      bundles: original.bundles || [], // Bundle 정보 복제
      templateGroups: original.templateGroups || [] // TemplateGroup 정보 복제
    };

    return await this.saveTemplate(duplicateRequest);
  }

  /**
   * 템플릿 검색 (최신 버전 포함)
   */
  async searchTemplates(query: string): Promise<TemplateListItem[]> {
    const lowercaseQuery = query.toLowerCase();

    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { name: { contains: lowercaseQuery, mode: 'insensitive' } },
          { description: { contains: lowercaseQuery, mode: 'insensitive' } }
        ]
      },
      include: {
        type: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return templates
      .filter(template => template.versions.length > 0)
      .map(template => this.mapToListItem(template, template.versions[0]));
  }

  /**
   * 템플릿 통계
   */
  async getStats(): Promise<{
    totalTemplates: number;
    totalClips: number;
    averageClipsPerTemplate: number;
    totalDuration: number;
    averageDurationPerTemplate: number;
  }> {
    const aggregation = await prisma.template.aggregate({
      _count: true,
      _sum: {
        totalClips: true,
        duration: true
      },
      _avg: {
        totalClips: true,
        duration: true
      }
    });

    return {
      totalTemplates: aggregation._count,
      totalClips: aggregation._sum.totalClips || 0,
      averageClipsPerTemplate: aggregation._avg.totalClips || 0,
      totalDuration: aggregation._sum.duration || 0,
      averageDurationPerTemplate: aggregation._avg.duration || 0
    };
  }

  /**
   * 메타데이터 생성 (Bundle 정보 포함)
   */
  private generateMetadata(request: CreateTemplateRequest): TemplateMetadata {
    const bundleCount = request.bundles?.length || 0;
    const templateGroupCount = request.templateGroups?.length || 0;
    
    return {
      version: bundleCount > 0 || templateGroupCount > 0 ? '1.1.0' : '1.0.0', // Bundle 지원 시 버전 업데이트
      totalClips: request.tracks.reduce((sum, track) => sum + track.clips.length, 0),
      totalTracks: request.tracks.length,
      duration: request.projectSettings.duration,
      bundleCount,        // Bundle 개수 추가
      templateGroupCount  // TemplateGroup 개수 추가
    };
  }

  /**
   * 템플릿 데이터를 목록 아이템으로 변환 (마스터-디테일)
   */
  private mapToListItem(dbTemplate: any, dbVersion?: any): TemplateListItem {
    const projectData = dbVersion?.projectData as any || {};
    
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      typeId: dbTemplate.typeId,
      type: dbTemplate.type ? {
        id: dbTemplate.type.id,
        name: dbTemplate.type.name,
        description: dbTemplate.type.description
      } : undefined,
      createdAt: dbTemplate.createdAt.toISOString(),
      updatedAt: dbTemplate.updatedAt.toISOString(),
      metadata: {
        version: dbVersion?.versionString || '1.0.0',
        totalClips: dbTemplate.totalClips,
        totalTracks: dbTemplate.totalTracks,
        duration: dbTemplate.duration,
        bundleCount: projectData.bundles?.length || 0,
        templateGroupCount: projectData.templateGroups?.length || 0
      }
    };
  }

  /**
   * 성공 응답 생성
   */
  createSuccessResponse(template?: TemplateData, templates?: TemplateListItem[]): TemplateResponse {
    return {
      success: true,
      template,
      templates
    };
  }

  /**
   * 에러 응답 생성
   */
  createErrorResponse(error: string, details?: string): TemplateResponse {
    return {
      success: false,
      error,
      details
    };
  }
}

// 싱글톤 인스턴스
export const templateService = new TemplateService();
export default templateService;
