import { PrismaClient, Template, ResourceData, TemplateResourceCompatibility } from '@prisma/client';

export interface CompatibilityMatrix {
  templateId: string;
  templateName: string;
  resourceIds: string[];
}

export class CompatibilityService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 템플릿과 리소스 연결
   */
  async linkTemplateResource(templateId: string, resourceId: string): Promise<void> {
    try {
      await this.prisma.templateResourceCompatibility.create({
        data: {
          templateId,
          resourceId
        }
      });
      
      // 연결 이력 기록
      await this.recordConnectionHistory(templateId, resourceId, 'CONNECTED');
    } catch (error) {
      // 이미 존재하는 연결인 경우 무시
      if (error.code !== 'P2002') {
        throw error;
      }
    }
  }

  /**
   * 템플릿과 리소스 연결 해제
   */
  async unlinkTemplateResource(templateId: string, resourceId: string): Promise<void> {
    const result = await this.prisma.templateResourceCompatibility.deleteMany({
      where: {
        templateId,
        resourceId
      }
    });
    
    // 실제로 삭제된 경우에만 이력 기록
    if (result.count > 0) {
      await this.recordConnectionHistory(templateId, resourceId, 'DISCONNECTED');
    }
  }

  /**
   * 템플릿에 여러 리소스 일괄 연결
   */
  async batchLinkTemplateResources(templateId: string, resourceIds: string[]): Promise<void> {
    // 기존 연결 삭제
    await this.prisma.templateResourceCompatibility.deleteMany({
      where: { templateId }
    });

    // 새로운 연결 생성
    if (resourceIds.length > 0) {
      const compatibilities = resourceIds.map(resourceId => ({
        templateId,
        resourceId
      }));

      await this.prisma.templateResourceCompatibility.createMany({
        data: compatibilities,
        skipDuplicates: true
      });
    }
  }

  /**
   * 리소스에 여러 템플릿 일괄 연결
   */
  async batchLinkResourceTemplates(resourceId: string, templateIds: string[]): Promise<void> {
    // 기존 연결 삭제
    await this.prisma.templateResourceCompatibility.deleteMany({
      where: { resourceId }
    });

    // 새로운 연결 생성
    if (templateIds.length > 0) {
      const compatibilities = templateIds.map(templateId => ({
        templateId,
        resourceId
      }));

      await this.prisma.templateResourceCompatibility.createMany({
        data: compatibilities,
        skipDuplicates: true
      });
    }
  }

  /**
   * 템플릿에 여러 리소스 템플릿 일괄 연결
   * 리소스 템플릿에 대응하는 리소스 데이터를 생성(필요시)하고 연결
   */
  async batchLinkTemplateResourceTemplates(templateId: string, resourceTemplateIds: string[]): Promise<void> {
    if (resourceTemplateIds.length === 0) {
      return;
    }

    // 리소스 템플릿들 조회 (기존 리소스 데이터도 함께)
    const resourceTemplates = await this.prisma.resourceTemplate.findMany({
      where: {
        id: {
          in: resourceTemplateIds
        }
      },
      include: {
        resourceData: true,  // 1:1 관계로 변경됨
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    const resourceDataIds: string[] = [];
    
    for (const resourceTemplate of resourceTemplates) {
      let resourceData = resourceTemplate.resourceData;
      
      // 연결된 리소스 데이터가 없으면 새로 생성
      if (!resourceData) {
        const latestVersion = resourceTemplate.versions[0];
        if (!latestVersion) continue;

        resourceData = await this.prisma.resourceData.create({
          data: {
            name: `${resourceTemplate.name} (from template)`,
            description: `리소스 템플릿 "${resourceTemplate.name}"에서 생성됨`,
            itemCount: resourceTemplate.itemCount,
            hasNested: resourceTemplate.hasNested,
            maxDepth: resourceTemplate.maxDepth,
            resourceTemplateId: resourceTemplate.id,
            userId: resourceTemplate.userId
          }
        });

        // 최신 템플릿 데이터를 리소스 데이터 버전으로 저장
        await this.prisma.resourceDataVersion.create({
          data: {
            resourceDataId: resourceData.id,
            data: latestVersion.templateData,
            version: 1
          }
        });
      }

      resourceDataIds.push(resourceData.id);
    }

    // 생성된/기존 리소스 데이터들을 템플릿과 연결
    if (resourceDataIds.length > 0) {
      await this.batchLinkTemplateResources(templateId, resourceDataIds);
    }
  }

  /**
   * 템플릿의 호환 리소스 조회
   */
  async getCompatibleResources(templateId: string): Promise<ResourceData[]> {
    const compatibilities = await this.prisma.templateResourceCompatibility.findMany({
      where: { templateId },
      include: {
        resource: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
              select: {
                id: true,
                version: true,
                versionString: true,
                data: true
              }
            }
          }
        }
      }
    });

    return compatibilities.map(comp => comp.resource);
  }

  /**
   * 리소스의 호환 템플릿 조회
   */
  async getCompatibleTemplates(resourceId: string): Promise<Template[]> {
    const compatibilities = await this.prisma.templateResourceCompatibility.findMany({
      where: { resourceId },
      include: {
        template: {
          include: {
            type: true,
            versions: {
              orderBy: { version: 'desc' },
              select: {
                id: true,
                version: true,
                versionString: true,
                projectData: true
              }
            }
          }
        }
      }
    });

    return compatibilities.map(comp => comp.template);
  }

  /**
   * 전체 호환성 매트릭스 조회
   */
  async getCompatibilityMatrix(): Promise<CompatibilityMatrix[]> {
    const compatibilities = await this.prisma.templateResourceCompatibility.findMany({
      include: {
        template: {
          select: { id: true, name: true }
        },
        resource: {
          select: { id: true, name: true }
        }
      }
    });

    const matrix = compatibilities.reduce((acc, comp) => {
      const existingTemplate = acc.find(item => item.templateId === comp.templateId);
      
      if (existingTemplate) {
        existingTemplate.resourceIds.push(comp.resourceId);
      } else {
        acc.push({
          templateId: comp.templateId,
          templateName: comp.template.name,
          resourceIds: [comp.resourceId]
        });
      }
      
      return acc;
    }, [] as CompatibilityMatrix[]);

    return matrix;
  }

  /**
   * 호환성 상태 확인
   */
  async isCompatible(templateId: string, resourceId: string): Promise<boolean> {
    const compatibility = await this.prisma.templateResourceCompatibility.findUnique({
      where: {
        templateId_resourceId: {
          templateId,
          resourceId
        }
      }
    });

    return !!compatibility;
  }

  /**
   * 템플릿의 호환 리소스 개수 조회
   */
  async getCompatibleResourceCount(templateId: string): Promise<number> {
    return await this.prisma.templateResourceCompatibility.count({
      where: { templateId }
    });
  }

  /**
   * 리소스의 호환 템플릿 개수 조회
   */
  async getCompatibleTemplateCount(resourceId: string): Promise<number> {
    return await this.prisma.templateResourceCompatibility.count({
      where: { resourceId }
    });
  }

  /**
   * 전체 호환성 통계 조회
   */
  async getCompatibilityStats(): Promise<{
    totalConnections: number;
    templatesWithConnections: number;
    resourcesWithConnections: number;
    averageConnectionsPerTemplate: number;
    averageConnectionsPerResource: number;
  }> {
    const totalConnections = await this.prisma.templateResourceCompatibility.count();
    
    const templatesWithConnections = await this.prisma.templateResourceCompatibility.groupBy({
      by: ['templateId'],
      _count: { templateId: true }
    });

    const resourcesWithConnections = await this.prisma.templateResourceCompatibility.groupBy({
      by: ['resourceId'],
      _count: { resourceId: true }
    });

    const avgConnectionsPerTemplate = templatesWithConnections.length > 0 
      ? totalConnections / templatesWithConnections.length 
      : 0;

    const avgConnectionsPerResource = resourcesWithConnections.length > 0 
      ? totalConnections / resourcesWithConnections.length 
      : 0;

    return {
      totalConnections,
      templatesWithConnections: templatesWithConnections.length,
      resourcesWithConnections: resourcesWithConnections.length,
      averageConnectionsPerTemplate: Math.round(avgConnectionsPerTemplate * 100) / 100,
      averageConnectionsPerResource: Math.round(avgConnectionsPerResource * 100) / 100
    };
  }

  /**
   * 리소스 정리 (연결이 없는 관련 데이터 정리)
   */
  async cleanup(): Promise<{
    deletedConnections: number;
  }> {
    // 존재하지 않는 템플릿이나 리소스와의 연결 정리
    const result = await this.prisma.templateResourceCompatibility.deleteMany({
      where: {
        OR: [
          {
            template: null
          },
          {
            resource: null
          }
        ]
      }
    });

    return {
      deletedConnections: result.count
    };
  }

  /**
   * 연결 이력 기록 (간단한 로깅 방식)
   */
  private async recordConnectionHistory(templateId: string, resourceId: string, action: 'CONNECTED' | 'DISCONNECTED'): Promise<void> {
    try {
      // 간단한 로그 기록 - 실제 구현에서는 별도의 히스토리 테이블을 사용할 수 있음
      console.log(`[COMPATIBILITY_HISTORY] ${new Date().toISOString()} - ${action}: Template ${templateId} <-> Resource ${resourceId}`);
      
      // 향후 확장 가능: 별도의 ConnectionHistory 테이블에 저장
      // await this.prisma.connectionHistory.create({
      //   data: {
      //     templateId,
      //     resourceId,
      //     action,
      //     timestamp: new Date()
      //   }
      // });
    } catch (error) {
      // 이력 기록 실패는 메인 작업에 영향을 주지 않도록 조용히 처리
      console.error('Failed to record connection history:', error);
    }
  }

  /**
   * 최근 연결 이력 조회 (간단한 구현)
   */
  async getRecentConnectionHistory(limit: number = 10): Promise<Array<{
    templateId: string;
    resourceId: string;
    action: string;
    timestamp: Date;
    templateName?: string;
    resourceName?: string;
  }>> {
    // 실제 구현에서는 ConnectionHistory 테이블에서 조회
    // 현재는 빈 배열 반환 (향후 확장 가능)
    return [];
  }

  /**
   * 특정 템플릿의 연결 이력 조회
   */
  async getTemplateConnectionHistory(templateId: string, limit: number = 20): Promise<Array<{
    resourceId: string;
    action: string;
    timestamp: Date;
    resourceName?: string;
  }>> {
    // 실제 구현에서는 ConnectionHistory 테이블에서 조회
    // 현재는 빈 배열 반환 (향후 확장 가능)
    return [];
  }

  /**
   * 특정 리소스의 연결 이력 조회
   */
  async getResourceConnectionHistory(resourceId: string, limit: number = 20): Promise<Array<{
    templateId: string;
    action: string;
    timestamp: Date;
    templateName?: string;
  }>> {
    // 실제 구현에서는 ConnectionHistory 테이블에서 조회
    // 현재는 빈 배열 반환 (향후 확장 가능)
    return [];
  }

  /**
   * 템플릿과 호환되는 리소스 템플릿 조회
   */
  async getCompatibleResourceTemplates(templateId: string): Promise<any[]> {
    // 호환되는 리소스 데이터들을 조회 (리소스 템플릿 포함)
    const resources = await this.getCompatibleResources(templateId);
    
    // 리소스 데이터에 연결된 리소스 템플릿들을 직접 조회 (1:1 관계)
    const resourceTemplates = await Promise.all(
      resources
        .filter(resource => resource.resourceTemplateId) // resourceTemplateId가 있는 것만
        .map(async (resource) => {
          return await this.prisma.resourceTemplate.findUnique({
            where: { id: resource.resourceTemplateId! },
            include: {
              resourceData: true, // 1:1 관계
              versions: {
                orderBy: { version: 'desc' },
                take: 1
              }
            }
          });
        })
    );

    // null 제거 및 중복 제거
    const uniqueTemplates = resourceTemplates
      .filter(template => template !== null)
      .filter((template, index, array) => 
        array.findIndex(t => t!.id === template!.id) === index
      );

    return uniqueTemplates;
  }
}

export default CompatibilityService;