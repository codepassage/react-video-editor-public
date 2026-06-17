/**
 * 템플릿 관리 서비스 - Prisma 버전
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TemplateData,
  TemplateListItem,
  CreateTemplateRequest,
  TemplateResponse,
  TemplateMetadata
} from '../types/template.types';
import prisma from '../utils/prisma';

export class TemplateService {

  /**
   * 템플릿 저장 (Bundle 정보 포함)
   */
  async saveTemplate(request: CreateTemplateRequest): Promise<TemplateData> {
    const templateId = uuidv4();
    
    console.log('💾 템플릿 저장 시작 (Bundle 정보 포함):', {
      name: request.name,
      tracks: request.tracks.length,
      bundles: request.bundles?.length || 0,
      templateGroups: request.templateGroups?.length || 0,
      screenshotPath: request.screenshotPath || 'none'
    });
    
    // 메타데이터 계산
    const metadata = this.generateMetadata(request);
    
    // Prisma 트랜잭션으로 템플릿과 관련 데이터 저장
    const result = await prisma.$transaction(async (tx) => {
      // typeId가 없으면 첫 번째 TemplateType 사용
      let finalTypeId = request.typeId;
      if (!finalTypeId) {
        const firstType = await tx.templateType.findFirst({
          orderBy: { name: 'asc' }
        });
        finalTypeId = firstType?.id;
        if (!finalTypeId) {
          throw new Error('No TemplateType available');
        }
      }
      
      // 1. 마스터 생성
      const master = await tx.template.create({
        data: {
          id: templateId,
          name: request.name,
          description: request.description || '',
          typeId: finalTypeId, // TemplateType ID 추가
          totalClips: metadata.totalClips,
          totalTracks: metadata.totalTracks,
          duration: metadata.duration,
          screenshotPath: request.screenshotPath || null
        },
        include: {
          type: true
        }
      });

      // 2. 첫 버전 생성
      const firstVersion = await tx.templateVersion.create({
        data: {
          templateId: master.id,
          projectData: {
            tracks: request.tracks,
            projectSettings: request.projectSettings,
            bundles: request.bundles || [],
            templateGroups: request.templateGroups || []
          } as any,
          version: 1,
          versionString: metadata.version
        }
      });

      return { master, version: firstVersion };
    });

    if (!result) {
      throw new Error('템플릿 생성 실패');
    }

    console.log(`💾 템플릿 저장 완료 (마스터-디테일 구조):`, {
      id: templateId,
      name: request.name,
      totalClips: metadata.totalClips,
      totalTracks: metadata.totalTracks,
      duration: metadata.duration,
      bundleCount: metadata.bundleCount || 0,
      templateGroupCount: metadata.templateGroupCount || 0
    });

    return this.mapToTemplateData(result.master, result.version);
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

    return this.mapToTemplateData(template, template.versions[0]);
  }

  /**
   * 템플릿 업데이트 (Bundle 정보 포함) - 새 버전 생성
   */
  async updateTemplate(id: string, updates: Partial<CreateTemplateRequest>): Promise<TemplateData | null> {
    const existing = await this.getTemplate(id);
    if (!existing) {
      return null;
    }

    console.log(`📝 템플릿 업데이트 (새 버전 생성): ${id}`);
    
    // 새 버전 생성을 위한 데이터 준비
    const newProjectData = {
      tracks: updates.tracks || existing.tracks,
      projectSettings: updates.projectSettings || existing.projectSettings,
      bundles: updates.bundles !== undefined ? updates.bundles : existing.bundles,
      templateGroups: updates.templateGroups !== undefined ? updates.templateGroups : existing.templateGroups
    };

    // 메타데이터 계산
    const metadata = this.generateMetadata({
      name: existing.name, // name은 변경되지 않음
      description: existing.description,
      tracks: newProjectData.tracks,
      projectSettings: newProjectData.projectSettings,
      bundles: newProjectData.bundles,
      templateGroups: newProjectData.templateGroups
    });

    // Prisma 트랜잭션으로 새 버전 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 최신 버전 번호 조회
      const latestVersion = await tx.templateVersion.findFirst({
        where: { templateId: id },
        orderBy: { version: 'desc' }
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      // 2. 새 버전 생성
      const newVersion = await tx.templateVersion.create({
        data: {
          templateId: id,
          projectData: newProjectData as any,
          version: nextVersion,
          versionString: metadata.version
        }
      });

      // 3. 템플릿 마스터 메타데이터 업데이트
      const updatedTemplate = await tx.template.update({
        where: { id },
        data: {
          description: updates.description !== undefined ? updates.description : existing.description,
          totalClips: metadata.totalClips,
          totalTracks: metadata.totalTracks,
          duration: metadata.duration,
          screenshotPath: updates.screenshotPath !== undefined ? updates.screenshotPath : existing.screenshotPath,
          updatedAt: new Date()
        },
        include: {
          type: true
        }
      });

      return { template: updatedTemplate, version: newVersion };
    });

    console.log(`📝 템플릿 업데이트 완료 (버전 ${result.version.version}):`, {
      id,
      name: result.template.name,
      totalClips: metadata.totalClips,
      version: result.version.version
    });

    return this.mapToTemplateData(result.template, result.version);
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
      bundles: original.bundles || [],
      templateGroups: original.templateGroups || [],
      screenshotPath: original.screenshotPath
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
      version: bundleCount > 0 || templateGroupCount > 0 ? '1.1.0' : '1.0.0',
      totalClips: request.tracks.reduce((sum, track) => sum + track.clips.length, 0),
      totalTracks: request.tracks.length,
      duration: request.projectSettings.duration,
      bundleCount,
      templateGroupCount
    };
  }

  /**
   * Prisma 모델을 TemplateData로 변환 (마스터-디테일)
   */
  private mapToTemplateData(dbTemplate: any, dbVersion?: any): TemplateData {
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
      tracks: projectData.tracks || [],
      projectSettings: projectData.projectSettings || {},
      bundles: projectData.bundles || [],
      templateGroups: projectData.templateGroups || [],
      screenshotPath: dbTemplate.screenshotPath || undefined,
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
      screenshotPath: dbTemplate.screenshotPath || undefined,
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