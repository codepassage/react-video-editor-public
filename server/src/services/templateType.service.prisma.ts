/**
 * TemplateType 관리 서비스 - Prisma 버전
 */

import prisma from '../utils/prisma';

export interface TemplateTypeData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  _count?: {
    templates: number;
  };
}

export class TemplateTypeService {

  /**
   * 모든 TemplateType 조회
   */
  async getAllTemplateTypes(): Promise<TemplateTypeData[]> {
    try {
      const templateTypes = await prisma.templateType.findMany({
        include: {
          _count: {
            select: {
              templates: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return templateTypes.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
        createdAt: type.createdAt.toISOString(),
        _count: type._count
      }));
    } catch (error) {
      console.error('Failed to get template types:', error);
      throw new Error('Failed to get template types');
    }
  }

  /**
   * TemplateType ID로 조회
   */
  async getTemplateTypeById(id: string): Promise<TemplateTypeData | null> {
    try {
      const templateType = await prisma.templateType.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              templates: true
            }
          }
        }
      });

      if (!templateType) {
        return null;
      }

      return {
        id: templateType.id,
        name: templateType.name,
        description: templateType.description,
        createdAt: templateType.createdAt.toISOString(),
        _count: templateType._count
      };
    } catch (error) {
      console.error('Failed to get template type:', error);
      throw new Error('Failed to get template type');
    }
  }

  /**
   * TemplateType 생성
   */
  async createTemplateType(data: {
    name: string;
    description?: string;
  }): Promise<TemplateTypeData> {
    try {
      const templateType = await prisma.templateType.create({
        data: {
          name: data.name,
          description: data.description || ''
        },
        include: {
          _count: {
            select: {
              templates: true
            }
          }
        }
      });

      return {
        id: templateType.id,
        name: templateType.name,
        description: templateType.description,
        createdAt: templateType.createdAt.toISOString(),
        _count: templateType._count
      };
    } catch (error) {
      console.error('Failed to create template type:', error);
      throw new Error('Failed to create template type');
    }
  }

  /**
   * TemplateType 수정
   */
  async updateTemplateType(id: string, data: {
    name?: string;
    description?: string;
  }): Promise<TemplateTypeData | null> {
    try {
      const templateType = await prisma.templateType.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description })
        },
        include: {
          _count: {
            select: {
              templates: true
            }
          }
        }
      });

      return {
        id: templateType.id,
        name: templateType.name,
        description: templateType.description,
        createdAt: templateType.createdAt.toISOString(),
        _count: templateType._count
      };
    } catch (error) {
      console.error('Failed to update template type:', error);
      throw new Error('Failed to update template type');
    }
  }

  /**
   * TemplateType 삭제 (템플릿이 있으면 삭제 불가)
   */
  async deleteTemplateType(id: string): Promise<boolean> {
    try {
      // 해당 타입을 사용하는 템플릿이 있는지 확인
      const templateCount = await prisma.template.count({
        where: { typeId: id }
      });

      if (templateCount > 0) {
        throw new Error(`Cannot delete template type: ${templateCount} templates are using this type`);
      }

      await prisma.templateType.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Failed to delete template type:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const templateTypeService = new TemplateTypeService();
export default templateTypeService;