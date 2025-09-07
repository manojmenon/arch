import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import { ApiToken, CreateTokenRequest } from '../types';

export const useApiTokens = () => {
  return useQuery<ApiToken[]>(
    ['apiTokens'],
    async () => {
      const response = await apiClient.get<ApiToken[]>('/api/auth/tokens');
      return response;
    }
  );
};

export const useCreateToken = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiToken, Error, CreateTokenRequest>(
    async (tokenData) => {
      const response = await apiClient.post<ApiToken>('/api/auth/tokens', tokenData);
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['apiTokens']);
      },
    }
  );
};

export const useRevokeToken = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(
    async (tokenId) => {
      await apiClient.delete(`/api/auth/tokens/${tokenId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['apiTokens']);
      },
    }
  );
};

export const useExportToken = (token: string, filename: string) => {
  return () => {
    const blob = new Blob([token], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
};

