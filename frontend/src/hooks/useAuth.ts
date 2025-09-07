import { useMutation, useQuery } from 'react-query';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../utils/api';
import { LoginRequest, SignupRequest, AuthResponse, User, RoleStatus, Role } from '../types';

export const useLogin = () => {
  const { login } = useAuthStore();

  return useMutation<AuthResponse, Error, LoginRequest>(
    async (credentials) => {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
      return response;
    },
    {
      onSuccess: (data) => {
        login(data.user, data.session_token);
      },
    }
  );
};

export const useSignup = () => {
  return useMutation<AuthResponse, Error, SignupRequest>(
    async (userData) => {
      const response = await apiClient.post<AuthResponse>('/api/auth/signup', userData);
      return response;
    }
  );
};

export const useLogout = () => {
  const { logout } = useAuthStore();

  return useMutation<void, Error>(
    async () => {
      await apiClient.post('/api/auth/logout');
    },
    {
      onSuccess: () => {
        logout();
      },
    }
  );
};

export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery<User | null>(
    ['currentUser'],
    async () => {
      if (!isAuthenticated) return null;
      const response = await apiClient.get<User>('/api/auth/me');
      return response;
    },
    {
      enabled: isAuthenticated,
      initialData: user,
    }
  );
};

export const useRoleStatus = () => {
  return useQuery<RoleStatus>(
    ['roleStatus'],
    async () => {
      const response = await apiClient.get<RoleStatus>('/api/auth/role-status');
      return response;
    }
  );
};

export const useSwitchRole = () => {
  const { updateUser } = useAuthStore();
  
  return useMutation<any, Error, { target_role: Role; expires_in_hours?: number }>(
    async ({ target_role, expires_in_hours }) => {
      const response = await apiClient.post('/api/auth/switch-role', {
        target_role,
        expires_in_hours
      });
      return response;
    },
    {
      onSuccess: () => {
        // Refresh user data to get updated role
        updateUser();
      }
    }
  );
};

export const useReturnRole = () => {
  const { updateUser } = useAuthStore();
  
  return useMutation<any, Error>(
    async () => {
      const response = await apiClient.post('/api/auth/return-role');
      return response;
    },
    {
      onSuccess: () => {
        // Refresh user data to get updated role
        updateUser();
      }
    }
  );
};

