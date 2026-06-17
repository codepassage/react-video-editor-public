import { useState, useCallback } from 'react';
import { getApiUrl } from '../../../utils/urlBuilder';

interface AutoGenProject {
  id: string;
  name: string;
  status: string;
  templateId?: string;
  resourceId?: string;
  csvMapId?: string;
  transformResult?: any;
  createdAt: string;
  updatedAt: string;
}

interface ProjectManagerState {
  currentProject: AutoGenProject | null;
  projectManagerOpen: boolean;
  isLoadingProject: boolean;
  projectError: string | null;
}

export const useProjectManager = () => {
  const [state, setState] = useState<ProjectManagerState>({
    currentProject: null,
    projectManagerOpen: false,
    isLoadingProject: false,
    projectError: null
  });

  // Open project manager
  const openProjectManager = useCallback(() => {
    setState(prev => ({
      ...prev,
      projectManagerOpen: true,
      projectError: null
    }));
  }, []);

  // Close project manager
  const closeProjectManager = useCallback(() => {
    setState(prev => ({
      ...prev,
      projectManagerOpen: false
    }));
  }, []);

  // Save current state as project
  const saveAsProject = useCallback(async ({
    name,
    templateId,
    resourceId,
    csvMapId,
    transformResult
  }: {
    name: string;
    templateId?: string;
    resourceId?: string;
    csvMapId?: string;
    transformResult?: any;
  }) => {
    setState(prev => ({ ...prev, isLoadingProject: true, projectError: null }));

    try {
      const response = await fetch(`${getApiUrl()}/api/auto-gen/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          templateId,
          resourceId,
          csvMapId,
          transformResult
        })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          currentProject: data.data,
          isLoadingProject: false
        }));
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to save project');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingProject: false,
        projectError: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }, []);

  // Load project
  const loadProject = useCallback(async (projectId: string) => {
    setState(prev => ({ ...prev, isLoadingProject: true, projectError: null }));

    try {
      const response = await fetch(`${getApiUrl()}/api/auto-gen/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          currentProject: data.data,
          isLoadingProject: false
        }));
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to load project');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingProject: false,
        projectError: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }, []);

  // Update project transform result
  const updateProjectTransform = useCallback(async (transformResult: any) => {
    if (!state.currentProject) return;

    setState(prev => ({ ...prev, isLoadingProject: true, projectError: null }));

    try {
      const response = await fetch(`${getApiUrl()}/api/auto-gen/projects/${state.currentProject.id}/transform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transformResult })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          currentProject: data.data,
          isLoadingProject: false
        }));
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update project');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingProject: false,
        projectError: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }, [state.currentProject]);

  // Create render job for current project
  const createRenderJob = useCallback(async (renderSettings?: any) => {
    if (!state.currentProject) {
      throw new Error('No current project selected');
    }

    setState(prev => ({ ...prev, isLoadingProject: true, projectError: null }));

    try {
      const response = await fetch(`${getApiUrl()}/api/auto-gen/projects/${state.currentProject.id}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ renderSettings })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, isLoadingProject: false }));
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create render job');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingProject: false,
        projectError: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }, [state.currentProject]);

  // Clear current project
  const clearCurrentProject = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentProject: null,
      projectError: null
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, projectError: null }));
  }, []);

  return {
    currentProject: state.currentProject,
    projectManagerOpen: state.projectManagerOpen,
    isLoadingProject: state.isLoadingProject,
    projectError: state.projectError,
    
    openProjectManager,
    closeProjectManager,
    saveAsProject,
    loadProject,
    updateProjectTransform,
    createRenderJob,
    clearCurrentProject,
    clearError
  };
};