import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';

export interface OrganizationMembership {
  id: string;
  name: string;
  description?: string;
  type: string;
  city?: string;
  state?: string;
  country?: string;
  role: string;
  permissions?: any;
  joined_at: string;
  project_count: number;
  member_count: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  organizations: OrganizationMembership[];
}

export const useUserProfile = () => {
  return useQuery<UserProfile>(
    ['user', 'profile'],
    async () => {
      const response = await apiClient.get<UserProfile>('/user/profile');
      return response;
    }
  );
};

export const useUserOrganizations = () => {
  return useQuery<OrganizationMembership[]>(
    ['user', 'organizations'],
    async () => {
      const response = await apiClient.get<OrganizationMembership[]>('/api/user/organizations');
      return response;
    }
  );
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, { username: string; email: string }>(
    async (profileData) => {
      const response = await apiClient.put<UserProfile>('/user/profile', profileData);
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', 'profile']);
        queryClient.invalidateQueries(['user', 'organizations']);
      },
    }
  );
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; membership: any },
    Error,
    { organizationId: string; email: string; role: string }
  >(
    async ({ organizationId, email, role }) => {
      const response = await apiClient.post(`/organizations/${organizationId}/invite`, {
        email,
        role,
      }) as { message: string; membership: any };
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', 'profile']);
        queryClient.invalidateQueries(['user', 'organizations']);
        queryClient.invalidateQueries(['organizations']);
      },
    }
  );
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; membership: any },
    Error,
    { organizationId: string; userId: string; role: string }
  >(
    async ({ organizationId, userId, role }) => {
      const response = await apiClient.put(
        `/organizations/${organizationId}/members/${userId}/role`,
        { role }
      ) as { message: string; membership: any };
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', 'profile']);
        queryClient.invalidateQueries(['user', 'organizations']);
        queryClient.invalidateQueries(['organizations']);
      },
    }
  );
};

export const useRemoveUserFromOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { organizationId: string; userId: string }
  >(
    async ({ organizationId, userId }) => {
      const response = await apiClient.delete(
        `/organizations/${organizationId}/members/${userId}`
      ) as { message: string };
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', 'profile']);
        queryClient.invalidateQueries(['user', 'organizations']);
        queryClient.invalidateQueries(['organizations']);
      },
    }
  );
};
