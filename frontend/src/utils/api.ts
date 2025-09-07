import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8081';
const API_TIMEOUT = parseInt((import.meta as any).env?.VITE_API_TIMEOUT) || 10000;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth headers
    this.client.interceptors.request.use(
      (config) => {
        // Check and fix auth state consistency
        useAuthStore.getState().checkAuthState();
        
        const { sessionToken, apiToken, isAuthenticated } = useAuthStore.getState();
        
        console.log('API Request:', {
          url: config.url,
          isAuthenticated,
          hasSessionToken: !!sessionToken,
          hasApiToken: !!apiToken
        });
        
        if (apiToken) {
          config.headers.Authorization = `Bearer ${apiToken}`;
        } else if (sessionToken) {
          config.headers.Authorization = `Bearer ${sessionToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log('API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        
        // Only logout on 401 errors for authentication endpoints, not API token endpoints
        if (error.response?.status === 401 && 
            !error.config?.url?.includes('/api/auth/tokens') &&
            !error.config?.url?.includes('/api/user/profile')) {
          console.log('Triggering logout due to 401 error');
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

