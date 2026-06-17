import express from 'express';
import { PrismaClient } from '@prisma/client';
import { renderQueue } from '../queue';

const router = express.Router();
const prisma = new PrismaClient();

// Create a new auto generation project
router.post('/projects', async (req, res) => {
  try {
    const {
      name,
      templateId,
      resourceId,
      csvMapId,
      userId,
      transformResult
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Project name is required'
      });
    }

    const project = await prisma.autoGenerationProject.create({
      data: {
        name,
        templateId: templateId || null,
        resourceId: resourceId || null,
        csvMapId: csvMapId || null,
        userId: userId || null,
        transformResult: transformResult || null,
        status: 'draft'
      },
      include: {
        template: {
          select: {
            name: true,
            description: true
          }
        },
        resource: {
          select: {
            name: true,
            description: true
          }
        },
        csvMap: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Error creating auto generation project:', error);
    res.status(500).json({
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all auto generation projects
router.get('/projects', async (req, res) => {
  try {
    const { userId, status, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (status) where.status = status as string;

    const projects = await prisma.autoGenerationProject.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        template: {
          select: {
            name: true,
            description: true
          }
        },
        resource: {
          select: {
            name: true,
            description: true
          }
        },
        csvMap: {
          select: {
            name: true,
            description: true
          }
        },
        renderJobs: {
          select: {
            id: true,
            status: true,
            progress: true,
            createdAt: true,
            completedAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        youtubeUploads: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            uploadedAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    const total = await prisma.autoGenerationProject.count({ where });

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      }
    });

  } catch (error) {
    console.error('Error fetching auto generation projects:', error);
    res.status(500).json({
      error: 'Failed to fetch projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific auto generation project
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.autoGenerationProject.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 1
            }
          }
        },
        resource: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 1
            }
          }
        },
        csvMap: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 1
            }
          }
        },
        renderJobs: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        youtubeUploads: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Error fetching auto generation project:', error);
    res.status(500).json({
      error: 'Failed to fetch project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update auto generation project
router.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      templateId,
      resourceId,
      csvMapId,
      transformResult,
      status
    } = req.body;

    // Check if project exists
    const existingProject = await prisma.autoGenerationProject.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (resourceId !== undefined) updateData.resourceId = resourceId;
    if (csvMapId !== undefined) updateData.csvMapId = csvMapId;
    if (transformResult !== undefined) updateData.transformResult = transformResult;
    if (status !== undefined) updateData.status = status;

    const project = await prisma.autoGenerationProject.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            name: true,
            description: true
          }
        },
        resource: {
          select: {
            name: true,
            description: true
          }
        },
        csvMap: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Error updating auto generation project:', error);
    res.status(500).json({
      error: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete auto generation project
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const existingProject = await prisma.autoGenerationProject.findUnique({
      where: { id },
      include: {
        renderJobs: true,
        youtubeUploads: true
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Cancel any pending render jobs
    for (const renderJob of existingProject.renderJobs) {
      if (renderJob.status === 'pending' || renderJob.status === 'processing') {
        const queueJob = await renderQueue.getJob(renderJob.id);
        if (queueJob) {
          await queueJob.remove();
        }
      }
    }

    // Delete project (cascade will delete related jobs and uploads)
    await prisma.autoGenerationProject.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting auto generation project:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save transform result to project
router.post('/projects/:id/transform', async (req, res) => {
  try {
    const { id } = req.params;
    const { transformResult } = req.body;

    if (!transformResult) {
      return res.status(400).json({
        error: 'Transform result is required'
      });
    }

    // Check if project exists
    const existingProject = await prisma.autoGenerationProject.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Update project with transform result
    const project = await prisma.autoGenerationProject.update({
      where: { id },
      data: {
        transformResult,
        status: 'transformed'
      }
    });

    res.json({
      success: true,
      data: project,
      message: 'Transform result saved successfully'
    });

  } catch (error) {
    console.error('Error saving transform result:', error);
    res.status(500).json({
      error: 'Failed to save transform result',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create render job for project
router.post('/projects/:id/render', async (req, res) => {
  try {
    const { id } = req.params;
    const { renderSettings = {} } = req.body;

    // Get project with transform result
    const project = await prisma.autoGenerationProject.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    if (!project.transformResult) {
      return res.status(400).json({
        error: 'Project must have transform result before rendering'
      });
    }

    // Create render job
    const renderJob = await prisma.renderJob.create({
      data: {
        projectId: id,
        renderSettings,
        status: 'pending',
        progress: 0
      }
    });

    // Add job to render queue
    const job = await renderQueue.add('render-video', {
      projectId: id,
      transformResult: project.transformResult,
      renderSettings: {
        quality: renderSettings.quality || 2,
        fps: renderSettings.fps || 30,
        codec: renderSettings.codec || 'h264',
        port: renderSettings.port || 5002
      }
    }, {
      jobId: renderJob.id,
      delay: 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    // Update project status
    await prisma.autoGenerationProject.update({
      where: { id },
      data: {
        status: 'rendering'
      }
    });

    res.json({
      success: true,
      data: {
        renderJob: {
          id: renderJob.id,
          projectId: renderJob.projectId,
          status: renderJob.status,
          progress: renderJob.progress,
          createdAt: renderJob.createdAt
        },
        queueJob: {
          id: job.id,
          name: job.name
        }
      }
    });

  } catch (error) {
    console.error('Error creating render job for project:', error);
    res.status(500).json({
      error: 'Failed to create render job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get project statistics
router.get('/projects/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;

    const totalProjects = await prisma.autoGenerationProject.count({ where });
    
    const statusCounts = await prisma.autoGenerationProject.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    });

    // Count render jobs by status
    const renderJobStats = await prisma.renderJob.groupBy({
      by: ['status'],
      where: {
        project: userId ? { userId: userId as string } : {}
      },
      _count: {
        status: true
      }
    });

    res.json({
      success: true,
      data: {
        totalProjects,
        projectsByStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        renderJobsByStatus: renderJobStats.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error fetching project statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;