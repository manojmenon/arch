import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import { Project } from '../types';
import { ProjectFilters } from '../store/organizationStore';

export const useProjects = (filters?: ProjectFilters) => {
  return useQuery<Project[]>(
    ['projects', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }
      
      const response = await apiClient.get<Project[]>(`/api/projects?${params.toString()}`);
      return response;
    }
  );
};

export const useProject = (id: string) => {
  return useQuery<Project>(
    ['project', id],
    async () => {
      const response = await apiClient.get<Project>(`/api/projects/${id}`);
      return response;
    },
    {
      enabled: !!id,
    }
  );
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, Partial<Project>>(
    async (projectData) => {
      const response = await apiClient.post<Project>('/api/projects', projectData);
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
      },
    }
  );
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, { id: string; data: Partial<Project> }>(
    async ({ id, data }) => {
      const response = await apiClient.put<Project>(`/api/projects/${id}`, data);
      return response;
    },
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['projects']);
        queryClient.invalidateQueries(['project', id]);
      },
    }
  );
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(
    async (id) => {
      await apiClient.delete(`/api/projects/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
      },
    }
  );
};

export const useProjectVersions = (id: string) => {
  return useQuery<any[]>(
    ['project-versions', id],
    async () => {
      const response = await apiClient.get<any[]>(`/api/projects/${id}/versions`);
      return response;
    },
    {
      enabled: !!id,
    }
  );
};

