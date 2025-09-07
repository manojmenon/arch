import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '../types';
import { apiClient } from '../utils/api';

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  apiToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, sessionToken: string) => void;
  logout: () => Promise<void>;
  setApiToken: (token: string | null) => void;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkAuthState: () => void;
  clearAuthState: () => void;
}

const roleHierarchy: Record<Role, number> = {
  guest: 1,
  user: 2,
  localadmin: 3,
  sysadmin: 4,
  superuser: 5,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      sessionToken: null,
      apiToken: null,
      isAuthenticated: false,

      login: (user: User, sessionToken: string) => {
        set({
          user,
          sessionToken,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          // Call logout API to revoke token (only if we have a valid token)
          const { sessionToken } = get();
          if (sessionToken) {
            await apiClient.post('/api/auth/logout');
          }
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with logout even if API call fails
        } finally {
          set({
            user: null,
            sessionToken: null,
            apiToken: null,
            isAuthenticated: false,
          });
        }
      },

      setApiToken: (token: string | null) => {
        set({ apiToken: token });
      },

      hasRole: (role: Role) => {
        const { user } = get();
        if (!user) return false;
        return roleHierarchy[user.role] >= roleHierarchy[role];
      },

      hasAnyRole: (roles: Role[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.some(role => roleHierarchy[user.role] >= roleHierarchy[role]);
      },

      updateProfile: async (userData: Partial<User>) => {
        try {
          const updatedUser = await apiClient.put<User>('/api/user/profile', userData);
          set({ user: updatedUser });
        } catch (error) {
          console.error('Profile update failed:', error);
          throw error;
        }
      },

      checkAuthState: () => {
        const { sessionToken, user } = get();
        const shouldBeAuthenticated = !!(sessionToken && user);
        const currentState = get().isAuthenticated;
        
        if (shouldBeAuthenticated !== currentState) {
          console.log('Fixing inconsistent auth state:', {
            hasSessionToken: !!sessionToken,
            hasUser: !!user,
            shouldBeAuthenticated,
            currentState
          });
          
          if (!shouldBeAuthenticated) {
            // If we should not be authenticated, clear everything
            set({ 
              isAuthenticated: false,
              user: null,
              sessionToken: null,
              apiToken: null
            });
          } else {
            // If we should be authenticated, just fix the flag
            set({ isAuthenticated: shouldBeAuthenticated });
          }
        }
      },

      clearAuthState: () => {
        console.log('Clearing authentication state completely');
        set({
          user: null,
          sessionToken: null,
          apiToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
        // Don't persist API token for security
      }),
    }
  )
);

