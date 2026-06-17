import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CsvColumnMapCreateData {
  name: string;
  description?: string;
  resourceTemplateId?: string;
  mappingData: any;
  userId?: string;
}

export interface CsvColumnMapUpdateData {
  name?: string;
  description?: string;
  resourceTemplateId?: string;
  mappingData?: any;
}

export class CsvColumnMapService {
  /**
   * 새 CSV 컬럼 맵 생성 (마스터 + 첫 번째 버전)
   */
  async createCsvColumnMap(data: CsvColumnMapCreateData) {
    try {
      // 메타데이터 계산
      const columnCount = this.calculateColumnCount(data.mappingData);
      const mappingComplexity = this.calculateMappingComplexity(data.mappingData);

      const result = await prisma.$transaction(async (tx) => {
        // 1. 마스터 생성
        const master = await tx.csvColumnMap.create({
          data: {
            name: data.name,
            description: data.description,
            resourceTemplateId: data.resourceTemplateId,
            columnCount,
            mappingComplexity,
            userId: data.userId,
          },
        });

        // 2. 첫 번째 버전 생성
        const version = await tx.csvColumnMapVersion.create({
          data: {
            csvMapId: master.id,
            mappingData: data.mappingData,
            version: 1,
            versionString: '1.0.0',
          },
        });

        return { master, version };
      });

      return await this.getCsvColumnMapById(result.master.id);
    } catch (error) {
      console.error('Error creating CSV column map:', error);
      throw new Error('Failed to create CSV column map');
    }
  }

  /**
   * 새 버전 생성 (업데이트)
   */
  async createNewVersion(id: string, mappingData: any, userId?: string) {
    try {
      // 메타데이터 재계산
      const columnCount = this.calculateColumnCount(mappingData);
      const mappingComplexity = this.calculateMappingComplexity(mappingData);

      const result = await prisma.$transaction(async (tx) => {
        // 1. 새 버전 번호 계산
        const latestVersion = await tx.csvColumnMapVersion.findFirst({
          where: { csvMapId: id },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        const newVersionNumber = (latestVersion?.version || 0) + 1;
        const versionString = this.generateVersionString(newVersionNumber);

        // 3. 새 버전 생성
        const newVersion = await tx.csvColumnMapVersion.create({
          data: {
            csvMapId: id,
            mappingData,
            version: newVersionNumber,
            versionString,
          },
        });

        // 4. 마스터 메타데이터 업데이트
        await tx.csvColumnMap.update({
          where: { id },
          data: {
            columnCount,
            mappingComplexity,
            updatedAt: new Date(),
          },
        });

        return newVersion;
      });

      return await this.getCsvColumnMapById(id);
    } catch (error) {
      console.error('Error creating new version:', error);
      throw new Error('Failed to create new version');
    }
  }

  /**
   * 모든 CSV 컬럼 맵 목록 조회 (마스터만)
   */
  async getAllCsvColumnMaps() {
    try {
      return await prisma.csvColumnMap.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          resourceTemplate: {
            select: { id: true, name: true, description: true },
          },
          versions: {
            orderBy: { version: 'desc' },
            select: {
              id: true,
              version: true,
              versionString: true,
              mappingData: true,
              createdAt: true,
            },
          },
          resourceDataEntries: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching CSV column maps:', error);
      throw new Error('Failed to fetch CSV column maps');
    }
  }

  /**
   * ID로 CSV 컬럼 맵 조회 (최신 버전 포함)
   */
  async getCsvColumnMapById(id: string) {
    try {
      return await prisma.csvColumnMap.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          resourceTemplate: {
            select: { id: true, name: true, description: true },
          },
          versions: {
            orderBy: { version: 'desc' },
            include: {
              csvColumnMap: {
                select: { name: true },
              },
            },
          },
          resourceDataEntries: {
            select: { id: true, name: true, description: true },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching CSV column map:', error);
      throw new Error('Failed to fetch CSV column map');
    }
  }

  /**
   * 이름으로 CSV 컬럼 맵 조회 (최신 버전 포함)
   */
  async getCsvColumnMapByName(name: string) {
    try {
      return await prisma.csvColumnMap.findUnique({
        where: { name },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          resourceTemplate: {
            select: { id: true, name: true, description: true },
          },
          versions: {
            orderBy: { version: 'desc' },
          },
          resourceDataEntries: {
            select: { id: true, name: true, description: true },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching CSV column map by name:', error);
      throw new Error('Failed to fetch CSV column map by name');
    }
  }

  /**
   * 리소스 템플릿으로 CSV 컬럼 맵 조회
   */
  async getCsvColumnMapsByResourceTemplate(resourceTemplateId: string) {
    try {
      return await prisma.csvColumnMap.findMany({
        where: { resourceTemplateId },
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
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching CSV column maps by resource template:', error);
      throw new Error('Failed to fetch CSV column maps by resource template');
    }
  }

  /**
   * 버전 히스토리 조회
   */
  async getVersionHistory(id: string) {
    try {
      return await prisma.csvColumnMapVersion.findMany({
        where: { csvMapId: id },
        orderBy: { version: 'desc' },
        include: {
          csvColumnMap: {
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
      return await prisma.csvColumnMapVersion.findFirst({
        where: {
          csvMapId: id,
          version,
        },
        include: {
          csvColumnMap: {
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
   * CSV 컬럼 맵 삭제 (모든 버전 포함)
   */
  async deleteCsvColumnMap(id: string) {
    try {
      return await prisma.csvColumnMap.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting CSV column map:', error);
      throw new Error('Failed to delete CSV column map');
    }
  }

  /**
   * 연관된 리소스 데이터 조회
   */
  async getRelatedResourceData(id: string) {
    try {
      return await prisma.resourceData.findMany({
        where: { csvMapId: id },
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

  private calculateColumnCount(mappingData: any): number {
    if (!mappingData || !Array.isArray(mappingData)) return 0;
    
    // CSV 매핑 데이터에서 고유한 컬럼 수 계산
    const uniqueColumns = new Set();
    mappingData.forEach((row: any) => {
      if (row.column) {
        uniqueColumns.add(row.column);
      }
    });
    
    return uniqueColumns.size;
  }

  private calculateMappingComplexity(mappingData: any): string {
    if (!mappingData || !Array.isArray(mappingData)) return 'simple';
    
    let hasNested = false;
    let hasMultipleLevels = false;
    const levels = new Set();
    
    mappingData.forEach((row: any) => {
      // 레벨 정보 수집
      ['level 1', 'level 2', 'level 3', 'level 4'].forEach((level, index) => {
        if (row[level] && row[level].trim()) {
          levels.add(index + 1);
          if (index > 0) hasMultipleLevels = true;
        }
      });
      
      // 중첩 구조 확인 (콜론이나 특수 문자 포함)
      Object.values(row).forEach((value: any) => {
        if (typeof value === 'string' && (value.includes(':') || value.includes('-'))) {
          hasNested = true;
        }
      });
    });
    
    if (levels.size >= 3 || hasNested) return 'complex';
    if (hasMultipleLevels) return 'nested';
    return 'simple';
  }

  private generateVersionString(version: number): string {
    const major = Math.floor(version / 100);
    const minor = Math.floor((version % 100) / 10);
    const patch = version % 10;
    return `${major}.${minor}.${patch}`;
  }

  /**
   * CSV 컬럼 맵 관계 업데이트
   */
  async updateRelationships(id: string, relationships: { resourceTemplateId: string | null, resourceDataIds: string[] }) {
    try {
      console.log(`🔗 CSV 컬럼 맵 관계 업데이트: ${id}`, relationships);

      const result = await prisma.$transaction(async (tx) => {
        // 1. ResourceTemplate 관계 업데이트 (N:1)
        await tx.csvColumnMap.update({
          where: { id },
          data: {
            resourceTemplateId: relationships.resourceTemplateId,
            updatedAt: new Date()
          }
        });

        // 2. ResourceData 관계 업데이트 (1:N)
        // 기존 관계 해제: 이 CSV 맵을 참조하는 모든 ResourceData에서 csvMapId를 null로 설정
        await tx.resourceData.updateMany({
          where: { csvMapId: id },
          data: { csvMapId: null }
        });

        // 새로운 관계 설정
        if (relationships.resourceDataIds.length > 0) {
          await tx.resourceData.updateMany({
            where: {
              id: { in: relationships.resourceDataIds }
            },
            data: { csvMapId: id }
          });
        }

        return true;
      });

      // 업데이트된 CSV 맵 반환
      return await this.getCsvColumnMapById(id);
    } catch (error) {
      console.error('Error updating CSV column map relationships:', error);
      throw new Error('Failed to update CSV column map relationships');
    }
  }
}