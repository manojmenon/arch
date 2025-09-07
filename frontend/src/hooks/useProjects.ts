import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import { Project } from '../types';

export const useProjects = () => {
  return useQuery<Project[]>(
    ['projects'],
    async () => {
      const response = await apiClient.get<Project[]>('/api/projects');
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

