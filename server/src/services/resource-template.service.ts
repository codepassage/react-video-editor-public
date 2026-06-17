import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ResourceTemplateCreateData {
  name: string;
  description?: string;
  templateData: any;
  userId?: string;
}

export interface ResourceTemplateUpdateData {
  name?: string;
  description?: string;
  templateData?: any;
}

export class ResourceTemplateService {
  /**
   * 새 리소스 템플릿 생성 (마스터 + 첫 번째 버전)
   */
  async createResourceTemplate(data: ResourceTemplateCreateData) {
    try {
      // 메타데이터 계산
      const itemCount = this.calculateItemCount(data.templateData);
      const hasNested = this.calculateHasNested(data.templateData);
      const maxDepth = this.calculateMaxDepth(data.templateData);

      const result = await prisma.$transaction(async (tx) => {
        // 1. 마스터 생성
        const master = await tx.resourceTemplate.create({
          data: {
            name: data.name,
            description: data.description,
            itemCount,
            hasNested,
            maxDepth,
            userId: data.userId,
          },
        });

        // 2. 첫 번째 버전 생성
        const version = await tx.resourceTemplateVersion.create({
          data: {
            resourceTemplateId: master.id,
            templateData: data.templateData,
            version: 1,
            versionString: '1.0.0',
          },
        });

        return { master, version };
      });

      return await this.getResourceTemplateById(result.master.id);
    } catch (error) {
      console.error('Error creating resource template:', error);
      throw new Error('Failed to create resource template');
    }
  }

  /**
   * 새 버전 생성 (업데이트)
   */
  async createNewVersion(id: string, templateData: any, userId?: string) {
    try {
      // 메타데이터 재계산
      const itemCount = this.calculateItemCount(templateData);
      const hasNested = this.calculateHasNested(templateData);
      const maxDepth = this.calculateMaxDepth(templateData);

      const result = await prisma.$transaction(async (tx) => {
        // 1. 새 버전 번호 계산
        const latestVersion = await tx.resourceTemplateVersion.findFirst({
          where: { resourceTemplateId: id },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        const newVersionNumber = (latestVersion?.version || 0) + 1;
        const versionString = this.generateVersionString(newVersionNumber);

        // 2. 새 버전 생성
        const newVersion = await tx.resourceTemplateVersion.create({
          data: {
            resourceTemplateId: id,
            templateData,
            version: newVersionNumber,
            versionString,
          },
        });

        // 4. 마스터 메타데이터 업데이트
        await tx.resourceTemplate.update({
          where: { id },
          data: {
            itemCount,
            hasNested,
            maxDepth,
            updatedAt: new Date(),
          },
        });

        return newVersion;
      });

      return await this.getResourceTemplateById(id);
    } catch (error) {
      console.error('Error creating new version:', error);
      throw new Error('Failed to create new version');
    }
  }

  /**
   * 모든 리소스 템플릿 목록 조회 (마스터만)
   */
  async getAllResourceTemplates() {
    try {
      return await prisma.resourceTemplate.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          versions: {
            orderBy: { version: 'desc' },
            select: {
              id: true,
              version: true,
              versionString: true,
              templateData: true,
              createdAt: true,
            },
          },
          csvColumnMaps: {
            select: { id: true, name: true },
          },
          resourceData: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching resource templates:', error);
      throw new Error('Failed to fetch resource templates');
    }
  }

  /**
   * ID로 리소스 템플릿 조회 (최신 버전 포함)
   */
  async getResourceTemplateById(id: string) {
    try {
      return await prisma.resourceTemplate.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          versions: {
            orderBy: { version: 'desc' },
            include: {
              resourceTemplate: {
                select: { name: true },
              },
            },
          },
          csvColumnMaps: {
            select: { id: true, name: true, description: true },
          },
          resourceData: {
            select: { id: true, name: true, description: true },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching resource template:', error);
      throw new Error('Failed to fetch resource template');
    }
  }

  /**
   * 이름으로 리소스 템플릿 조회 (최신 버전 포함)
   */
  async getResourceTemplateByName(name: string) {
    try {
      return await prisma.resourceTemplate.findUnique({
        where: { name },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          versions: {
            orderBy: { version: 'desc' },
          },
          csvColumnMaps: {
            select: { id: true, name: true, description: true },
          },
          resourceData: {
            select: { id: true, name: true, description: true },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching resource template by name:', error);
      throw new Error('Failed to fetch resource template by name');
    }
  }

  /**
   * 버전 히스토리 조회
   */
  async getVersionHistory(id: string) {
    try {
      return await prisma.resourceTemplateVersion.findMany({
        where: { resourceTemplateId: id },
        orderBy: { version: 'desc' },
        include: {
          resourceTemplate: {
            select: { name: true },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching version history:', error);
      throw new Error('Failed to fetch version history');
    }
  }

  /**
   * 특정 버전 조회
   */
  async getSpecificVersion(id: string, version: number) {
    try {
      return await prisma.resourceTemplateVersion.findFirst({
        where: {
          resourceTemplateId: id,
          version,
        },
        include: {
          resourceTemplate: {
            select: { name: true, description: true },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching specific version:', error);
      throw new Error('Failed to fetch specific version');
    }
  }

  /**
   * 리소스 템플릿 삭제 (모든 버전 포함)
   */
  async deleteResourceTemplate(id: string) {
    try {
      return await prisma.resourceTemplate.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting resource template:', error);
      throw new Error('Failed to delete resource template');
    }
  }

  /**
   * 연관된 CSV 컬럼 맵 조회
   */
  async getRelatedCsvMaps(id: string) {
    try {
      return await prisma.csvColumnMap.findMany({
        where: { resourceTemplateId: id },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            select: {
              id: true,
              version: true,
              versionString: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching related CSV maps:', error);
      throw new Error('Failed to fetch related CSV maps');
    }
  }

  /**
   * 연관된 리소스 데이터 조회
   */
  async getRelatedResourceData(id: string) {
    try {
      return await prisma.resourceData.findMany({
        where: { resourceTemplateId: id },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            select: {
              id: true,
              version: true,
              versionString: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching related resource data:', error);
      throw new Error('Failed to fetch related resource data');
    }
  }

  // === Private Helper Methods ===

  private calculateItemCount(templateData: any): number {
    if (!templateData || !templateData.items) return 0;
    return templateData.items.length;
  }

  private calculateHasNested(templateData: any): boolean {
    if (!templateData || !templateData.items) return false;
    
    const hasNestedItem = (item: any): boolean => {
      if (item.containers && item.containers.length > 0) return true;
      if (item.items && item.items.length > 0) {
        return item.items.some((subItem: any) => hasNestedItem(subItem));
      }
      return false;
    };

    return templateData.items.some((item: any) => hasNestedItem(item));
  }

  private calculateMaxDepth(templateData: any): number {
    if (!templateData || !templateData.items) return 0;

    const getDepth = (item: any, currentDepth: number = 1): number => {
      let maxDepth = currentDepth;
      
      if (item.containers && item.containers.length > 0) {
        for (const container of item.containers) {
          if (container.items && container.items.length > 0) {
            for (const subItem of container.items) {
              maxDepth = Math.max(maxDepth, getDepth(subItem, currentDepth + 1));
            }
          }
        }
      }
      
      if (item.items && item.items.length > 0) {
        for (const subItem of item.items) {
          maxDepth = Math.max(maxDepth, getDepth(subItem, currentDepth + 1));
        }
      }

      return maxDepth;
    };

    return templateData.items.reduce((maxDepth: number, item: any) => {
      return Math.max(maxDepth, getDepth(item));
    }, 0);
  }

  private generateVersionString(version: number): string {
    const major = Math.floor(version / 100);
    const minor = Math.floor((version % 100) / 10);
    const patch = version % 10;
    return `${major}.${minor}.${patch}`;
  }

  /**
   * 리소스 템플릿 관계 업데이트
   */
  async updateRelationships(id: string, relationships: { csvMapIds: string[], resourceDataId: string | null }) {
    try {
      console.log(`🔗 리소스 템플릿 관계 업데이트: ${id}`, relationships);

      // ResourceTemplate의 resourceData 관계는 1:1이므로 직접 업데이트
      // csvColumnMaps 관계는 1:N이므로 기존 관계를 삭제하고 새로 생성해야 함
      
      const result = await prisma.$transaction(async (tx) => {
        // 1. ResourceData 관계 업데이트 (1:1)
        if (relationships.resourceDataId) {
          await tx.resourceData.update({
            where: { id: relationships.resourceDataId },
            data: { resourceTemplateId: id }
          });
        }

        // 2. 기존 CsvColumnMap 관계 해제
        await tx.csvColumnMap.updateMany({
          where: { resourceTemplateId: id },
          data: { resourceTemplateId: null }
        });

        // 3. 새로운 CsvColumnMap 관계 설정
        if (relationships.csvMapIds.length > 0) {
          await tx.csvColumnMap.updateMany({
            where: {
              id: { in: relationships.csvMapIds }
            },
            data: { resourceTemplateId: id }
          });
        }

        // 4. 마스터 업데이트 시간 갱신
        await tx.resourceTemplate.update({
          where: { id },
          data: { updatedAt: new Date() }
        });

        return true;
      });

      // 업데이트된 템플릿 반환
      return await this.getResourceTemplateById(id);
    } catch (error) {
      console.error('Error updating resource template relationships:', error);
      throw new Error('Failed to update resource template relationships');
    }
  }
}