import axios from 'axios';
import { config } from './config.js';

class ApiClient {
  constructor(baseURL = config.api.baseUrl) {
    this.client = axios.create({
      baseURL,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `${config.mcp.name}/${config.mcp.version}`
      }
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (config.auth?.token) {
          config.headers[config.auth.tokenHeader] = 
            `${config.auth.tokenPrefix}${config.auth.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status
          const errorMessage = error.response.data?.error || 
                              error.response.data?.message || 
                              `HTTP ${error.response.status}: ${error.response.statusText}`;
          throw new Error(errorMessage);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('No response received from server');
        } else {
          // Something else happened
          throw new Error(error.message);
        }
      }
    );
  }

  async get(url, options = {}) {
    try {
      const response = await this.client.get(url, options);
      return response.data;
    } catch (error) {
      throw new Error(`GET ${url} failed: ${error.message}`);
    }
  }

  async post(url, data, options = {}) {
    try {
      const response = await this.client.post(url, data, options);
      return response.data;
    } catch (error) {
      throw new Error(`POST ${url} failed: ${error.message}`);
    }
  }

  async put(url, data, options = {}) {
    try {
      const response = await this.client.put(url, data, options);
      return response.data;
    } catch (error) {
      throw new Error(`PUT ${url} failed: ${error.message}`);
    }
  }

  async delete(url, options = {}) {
    try {
      const response = await this.client.delete(url, options);
      return response.data;
    } catch (error) {
      throw new Error(`DELETE ${url} failed: ${error.message}`);
    }
  }

  async patch(url, data, options = {}) {
    try {
      const response = await this.client.patch(url, data, options);
      return response.data;
    } catch (error) {
      throw new Error(`PATCH ${url} failed: ${error.message}`);
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
}

export default ApiClient;
