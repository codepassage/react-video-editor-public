/**
 * 리소스 데이터 관리 서비스 (Prisma 기반)
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';

interface ResourceData {
  version?: string;
  items: any[];
  metadata?: {
    hasNestedStructure?: boolean;
    maxNestingDepth?: number;
    createdAt?: string;
    updatedAt?: string;
  };
}

interface SavedResourceData {
  id: string;
  name: string;
  description?: string;
  data: ResourceData;
  version: number;
  versionString: string;
  itemCount: number;
  hasNested: boolean;
  maxDepth: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SaveResourceDataRequest {
  name: string;
  description?: string;
  data: ResourceData;
  isUpdate?: boolean;  // 수정 모드인지 여부
  resourceTemplateId?: string | null;  // 리소스 템플릿 ID
  csvMapId?: string | null;  // CSV 맵 ID
}

class ResourceDataService {
  constructor() {
    console.log('🗄️ ResourceDataService 초기화 (Prisma 기반)');
  }

  /**
   * 최대 중첩 깊이 계산 (로컬 구현)
   */
  private calculateMaxDepth(items: any[]): number {
    let maxDepth = 0;
    
    const traverse = (items: any[], currentDepth: number = 0) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      
      for (const item of items) {
        if (item.containers) {
          for (const container of item.containers) {
            if (container.items) {
              traverse(container.items, currentDepth + 1);
            }
          }
        }
      }
    };
    
    traverse(items);
    return maxDepth;
  }

  /**
   * 리소스 데이터 저장 (마스터-디테일 버전 관리)
   */
  async saveResourceData(request: SaveResourceDataRequest): Promise<SavedResourceData> {
    try {
      // 메타데이터 분석
      const itemCount = request.data.items?.length || 0;
      const maxDepth = this.calculateMaxDepth(request.data.items || []);
      const hasNested = this.detectNestedStructure(request.data);
      const versionString = request.data.version || '1.0.0';

      if (request.isUpdate) {
        // 수정 모드: 기존 마스터의 새 버전 생성
        return await this.createNewVersion(request, itemCount, maxDepth, hasNested, versionString);
      } else {
        // 추가 모드: 새 마스터와 첫 버전 생성
        const existing = await prisma.resourceData.findUnique({
          where: { name: request.name }
        });
        
        if (existing) {
          throw new Error(`이름 '${request.name}'이 이미 존재합니다. 다른 이름을 사용하거나 수정 모드를 선택하세요.`);
        }
        
        return await this.createNewResource(request, itemCount, maxDepth, hasNested, versionString);
      }
    } catch (error) {
      console.error('리소스 데이터 DB 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 새 리소스 생성 (마스터 + 첫 버전)
   */
  private async createNewResource(
    request: SaveResourceDataRequest, 
    itemCount: number, 
    maxDepth: number, 
    hasNested: boolean, 
    versionString: string
  ): Promise<SavedResourceData> {
    console.log('💾 새 리소스 데이터 생성:', {
      name: request.name,
      itemCount,
      maxDepth,
      hasNested,
      versionString
    });

    // 트랜잭션으로 마스터와 첫 버전 함께 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 마스터 생성
      const master = await tx.resourceData.create({
        data: {
          name: request.name,
          description: request.description,
          itemCount,
          hasNested,
          maxDepth
        }
      });

      // 2. 첫 버전 생성
      const firstVersion = await tx.resourceDataVersion.create({
        data: {
          resourceDataId: master.id,
          data: request.data as any,
          version: 1,
          versionString
        }
      });

      return { master, version: firstVersion };
    });

    console.log(`✅ 새 리소스 데이터 생성 완료: ${result.master.name} v1`);
    
    return this.mapToSavedResourceData(result.master, result.version);
  }

  /**
   * 새 버전 생성 (기존 마스터에 버전 추가)
   */
  private async createNewVersion(
    request: SaveResourceDataRequest,
    itemCount: number,
    maxDepth: number,
    hasNested: boolean,
    versionString: string
  ): Promise<SavedResourceData> {
    // 마스터와 현재 최신 버전 조회
    const master = await prisma.resourceData.findUnique({
      where: { name: request.name },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    if (!master) {
      throw new Error(`수정할 리소스 '${request.name}'을 찾을 수 없습니다.`);
    }

    const currentLatestVersion = master.versions[0];
    const newVersionNumber = currentLatestVersion ? currentLatestVersion.version + 1 : 1;

    console.log('📝 새 버전 생성:', {
      name: request.name,
      currentVersion: currentLatestVersion?.version || 0,
      newVersion: newVersionNumber
    });

    // 트랜잭션으로 버전 관리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 마스터 정보 업데이트 (필요시)
      if (request.description !== undefined || itemCount !== master.itemCount || 
          hasNested !== master.hasNested || maxDepth !== master.maxDepth) {
        await tx.resourceData.update({
          where: { id: master.id },
          data: {
            description: request.description,
            itemCount,
            hasNested,
            maxDepth
          }
        });
      }

      // 2. 새 버전 생성
      const newVersion = await tx.resourceDataVersion.create({
        data: {
          resourceDataId: master.id,
          data: request.data as any,
          version: newVersionNumber,
          versionString
        }
      });

      // 3. 업데이트된 마스터 조회
      const updatedMaster = await tx.resourceData.findUnique({
        where: { id: master.id }
      });

      return { master: updatedMaster!, version: newVersion };
    });

    console.log(`✅ 새 버전 생성 완료: ${request.name} v${newVersionNumber}`);
    
    return this.mapToSavedResourceData(result.master, result.version);
  }

  /**
   * Prisma 결과를 SavedResourceData로 변환
   */
  private mapToSavedResourceData(master: any, version: any): SavedResourceData {
    return {
      id: master.id,
      name: master.name,
      description: master.description || undefined,
      data: version.data as ResourceData,
      version: version.version,
      versionString: version.versionString,
      itemCount: master.itemCount,
      hasNested: master.hasNested,
      maxDepth: master.maxDepth,
      createdAt: master.createdAt,
      updatedAt: master.updatedAt
    };
  }

  /**
   * 중첩 구조 감지
   */
  private detectNestedStructure(data: ResourceData): boolean {
    if (data.metadata?.hasNestedStructure) {
      return true;
    }
    
    return data.items?.some(item => 
      item.isIterator && item.containers && 
      item.containers.some((container: any) => 
        container.items?.some((subItem: any) => subItem.isIterator)
      )
    ) || false;
  }

  /**
   * 리소스 데이터 목록 조회 (최신 버전 포함)
   */
  async getResourceDataList(): Promise<SavedResourceData[]> {
    try {
      const resourceDataList = await prisma.resourceData.findMany({
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`📂 DB에서 리소스 데이터 목록 조회 완료: ${resourceDataList.length}개`);
      
      return resourceDataList
        .filter(item => item.versions.length > 0)
        .map(item => this.mapToSavedResourceData(item, item.versions[0]));
    } catch (error) {
      console.error('리소스 데이터 목록 DB 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 리소스 데이터 조회 (ID로)
   */
  async getResourceData(id: string): Promise<SavedResourceData | null> {
    try {
      const resourceData = await prisma.resourceData.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1
          }
        }
      });
      
      if (!resourceData || resourceData.versions.length === 0) {
        console.log(`DB에 리소스 데이터 없음: ${id}`);
        return null;
      }

      console.log(`📄 DB에서 리소스 데이터 로드 완료: ${id} - ${resourceData.name}`);
      
      return this.mapToSavedResourceData(resourceData, resourceData.versions[0]);
    } catch (error) {
      console.error(`리소스 데이터 DB 조회 실패: ${id}`, error);
      return null;
    }
  }

  /**
   * 리소스 데이터 업데이트 (새 버전 생성)
   */
  async updateResourceData(id: string, updates: Partial<SaveResourceDataRequest>): Promise<SavedResourceData | null> {
    try {
      // 관계 필드만 업데이트하는 경우 (resourceTemplateId, csvMapId)
      if (updates.resourceTemplateId !== undefined || updates.csvMapId !== undefined) {
        console.log(`🔗 리소스 데이터 관계 업데이트: ${id}`, {
          resourceTemplateId: updates.resourceTemplateId,
          csvMapId: updates.csvMapId
        });

        // 직접 DB 업데이트 (새 버전 생성하지 않음)
        const updatedResourceData = await prisma.resourceData.update({
          where: { id },
          data: {
            resourceTemplateId: updates.resourceTemplateId,
            csvMapId: updates.csvMapId,
            updatedAt: new Date()
          },
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 1
            }
          }
        });

        return {
          id: updatedResourceData.id,
          name: updatedResourceData.name,
          description: updatedResourceData.description,
          data: updatedResourceData.versions[0]?.data as ResourceData || { items: [] },
          version: updatedResourceData.versions[0]?.version || 1,
          versionString: updatedResourceData.versions[0]?.versionString || '1.0.0',
          itemCount: updatedResourceData.itemCount,
          hasNested: updatedResourceData.hasNested,
          maxDepth: updatedResourceData.maxDepth,
          createdAt: updatedResourceData.createdAt,
          updatedAt: updatedResourceData.updatedAt
        };
      }

      // 일반 데이터 업데이트 (새 버전 생성)
      const existing = await this.getResourceData(id);
      if (!existing) {
        return null;
      }

      const updateRequest: SaveResourceDataRequest = {
        name: updates.name || existing.name,
        description: updates.description !== undefined ? updates.description : existing.description,
        data: updates.data || existing.data,
        isUpdate: true
      };

      console.log(`📝 리소스 데이터 업데이트 (새 버전 생성): ${id} - ${updateRequest.name}`);
      
      return await this.saveResourceData(updateRequest);
    } catch (error) {
      console.error(`리소스 데이터 DB 업데이트 실패: ${id}`, error);
      return null;
    }
  }

  /**
   * 리소스 데이터 삭제
   */
  async deleteResourceData(id: string): Promise<boolean> {
    try {
      const deletedData = await prisma.resourceData.delete({
        where: { id }
      });
      
      console.log(`🗑️ DB에서 리소스 데이터 삭제 완료: ${id} - ${deletedData.name}`);
      return true;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        console.log(`삭제할 리소스 데이터 없음: ${id}`);
        return false;
      }
      console.error(`리소스 데이터 DB 삭제 실패: ${id}`, error);
      return false;
    }
  }

  /**
   * 리소스 데이터 검색 (이름 기반)
   */
  async searchResourceData(query: string): Promise<SavedResourceData[]> {
    try {
      const resourceDataList = await prisma.resourceData.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`🔍 리소스 데이터 검색 완료: "${query}" -> ${resourceDataList.length}개`);
      
      return resourceDataList
        .filter(item => item.versions && item.versions.length > 0)
        .map(item => this.mapToSavedResourceData(item, item.versions[0]));
    } catch (error) {
      console.error('리소스 데이터 검색 실패:', error);
      return [];
    }
  }

  /**
   * 중첩 구조 리소스 데이터만 조회 (최신 버전만)
   */
  async getNestedResourceData(): Promise<SavedResourceData[]> {
    try {
      const resourceDataList = await prisma.resourceData.findMany({
        where: {
          hasNested: true
        },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`🔄 중첩 구조 리소스 데이터 조회 완료: ${resourceDataList.length}개 (최신 버전만)`);
      
      return resourceDataList
        .filter(item => item.versions.length > 0)
        .map(item => this.mapToSavedResourceData(item, item.versions[0]));
    } catch (error) {
      console.error('중첩 구조 리소스 데이터 조회 실패:', error);
      return [];
    }
  }

  /**
   * 리소스 데이터 버전 히스토리 조회
   */
  async getResourceDataVersions(name: string): Promise<SavedResourceData[]> {
    try {
      // 마스터와 모든 버전 조회
      const master = await prisma.resourceData.findUnique({
        where: { name },
        include: {
          versions: {
            orderBy: {
              version: 'desc'  // 최신 버전부터
            }
          }
        }
      });

      if (!master || master.versions.length === 0) {
        console.log(`리소스 '${name}' 찾을 수 없음`);
        return [];
      }

      console.log(`📚 리소스 '${name}' 버전 히스토리 조회: ${master.versions.length}개 버전`);
      
      return master.versions.map(version => this.mapToSavedResourceData(master, version));
    } catch (error) {
      console.error(`리소스 버전 히스토리 조회 실패: ${name}`, error);
      return [];
    }
  }

  /**
   * 특정 버전의 리소스 데이터 조회
   */
  async getResourceDataByVersion(name: string, version: number): Promise<SavedResourceData | null> {
    try {
      // 마스터와 특정 버전 조회
      const master = await prisma.resourceData.findUnique({
        where: { name },
        include: {
          versions: {
            where: { version },
            take: 1
          }
        }
      });

      if (!master || master.versions.length === 0) {
        console.log(`리소스 '${name}' v${version} 찾을 수 없음`);
        return null;
      }

      console.log(`📄 특정 버전 리소스 조회: ${name} v${version}`);
      
      return this.mapToSavedResourceData(master, master.versions[0]);
    } catch (error) {
      console.error(`특정 버전 리소스 조회 실패: ${name} v${version}`, error);
      return null;
    }
  }

  /**
   * 이름으로 최신 버전 조회 (기본 동작)
   */
  async getResourceDataByName(name: string): Promise<SavedResourceData | null> {
    try {
      const master = await prisma.resourceData.findUnique({
        where: { name },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1
          }
        }
      });
      
      if (!master || master.versions.length === 0) {
        console.log(`리소스 데이터 없음: ${name}`);
        return null;
      }

      console.log(`📄 최신 리소스 데이터 조회: ${name} v${master.versions[0].version}`);
      
      return this.mapToSavedResourceData(master, master.versions[0]);
    } catch (error) {
      console.error(`리소스 데이터 조회 실패: ${name}`, error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
export const resourceDataService = new ResourceDataService();
export default resourceDataService;